import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import MysticForgeTab from "./MysticForgeTab.jsx";
import { buildForgeRecipeMap } from "./mystic-forge-data.js";
import "./styles/app.css";

import { Gold } from "./components/Gold.jsx";
import { StatusBar } from "./components/StatusBar.jsx";
import { MaterialsTab } from "./tabs/MaterialsTab.jsx";
import { RecommendedTab } from "./tabs/RecommendedTab.jsx";
import { UnlearnedRecipesTab } from "./tabs/UnlearnedRecipesTab.jsx";
import { CraftingTab } from "./tabs/CraftingTab.jsx";
import { SettingsPanel } from "./tabs/SettingsPanel.jsx";
import { ImportExportPanel } from "./tabs/ImportExportPanel.jsx";
import { ResetConfirmDialog } from "./tabs/ResetConfirmDialog.jsx";
import { DeleteFriendConfirmDialog } from "./tabs/DeleteFriendConfirmDialog.jsx";
import { FlipMarketTab } from "./tabs/FlipMarketTab.jsx";
import { TradingPostTab } from "./tabs/TradingPostTab.jsx";
import { TimeGatedTab } from "./tabs/TimeGatedTab.jsx";

import { getRecipeDisciplines, dedupeRecipesById, DISCIPLINES, buildCraftItems } from "./lib/craftingCalc.js";
import {
  apiFetch, publicFetch, fetchIds, fetchPrices, fetchSoldHistory, chunk,
  filterTradeable, resolveLockedCatalogCoverage, persistItemMapCache, BASE,
} from "./lib/gw2Api.js";
import {
  DAILY_CRAFT_MAP, MANUAL_DAILY_MAP, DAILY_CRAFT_IDS, ALL_DAILY_CRAFT_IDS,
  buildTimegatedInfo, buildDailyCraftedSet, getDailyResetTs, getWeeklyResetTs,
  checkManualDailyCrafted, recordManualDailyBaseline,
} from "./lib/dailyCrafting.js";
import { extractCharacterItems, extractCharacterItemsByChar, extractCharacterDisciplines, extractForgeWallet } from "./lib/characterData.js";
import { buildFriendRecipeMap, buildFriendDisciplineMap } from "./lib/friendData.js";
import { getChangelog, checkForUpdate, getCurrentVersion } from "./lib/updater.js";

import {
  cacheSet, cacheGet,
  saveSnapshot, loadHistory, computeCraftItems, computeLockedCraftItems, cacheGetBulk, processStartupCache, getPriceAlertData,
  saveVelocitySnapshot, loadMarketSummary,
  flipPendingAdd, flipPendingGetAll, flipPendingDelete,
  flipHistoryAdd, flipHistoryGetAll, flipHistoryDelete,
  manualDailyGetAll, manualDailySet as manualDailySetCount,
  pruneOldData as pruneOldSnapshots,
  getDbStats, importFromBrowser, exportAllData,
  addFriendKey, refreshFriendKey, deleteFriendKey, getFriends, getFriendRecipesKnown,
  getFriendDisciplineLevels,
} from "./lib/storage.js";
import { DEFAULT_RARITY_FILTER, passesRarityFilter, RarityDropdown } from "./RarityFilter.jsx";
import { DEFAULT_FRIEND_FILTER, passesFriendFilter, FriendFilterDropdown } from "./FriendFilter.jsx";

// ── Timing / config constants ───────────────────────────────────────────────
const PRICE_REFRESH_MS = 60_000;
const RECIPE_REFRESH_MS = 4 * 60 * 60_000;
const UPDATE_CHECK_MS = 4 * 60 * 60_000; // 4h — GitHub Releases doesn't need aggressive polling
const GEM_QUANTITY_COPPER = 4_000_000; // 400g sample — coins_per_gem is stable enough at this size to extrapolate ×400
const UNLEARNED_REFRESH_MS = 7 * 24 * 60 * 60_000; // weekly — full-catalog recipe ID diff for Unlearned Recipes tab
const FRIEND_REFRESH_MS = 24 * 60 * 60_000; // daily — friend recipes-known rarely changes, no need for tighter polling
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default function App() {
  const [loadState, setLoadState] = useState({ phase: "loading", pct: 0, msg: "Initializing..." });
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [dbStats, setDbStats] = useState(null);
  const [showMigration, setShowMigration] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetType, setResetType] = useState(null); // 'market' | 'personal'
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [livePricesReady, setLivePricesReady] = useState(false);
  const [refreshError, setRefreshError] = useState(null);
  const [lastPrice, setLastPrice] = useState(null);
  const [lastRecipe, setLastRecipe] = useState(null);
  const [nextPriceIn, setNextPriceIn] = useState(PRICE_REFRESH_MS);
  const [nextRecipeIn, setNextRecipeIn] = useState(RECIPE_REFRESH_MS);
  const [secsAgo, setSecsAgo] = useState(0);
  const [toast, setToast] = useState(null);
  const [gemPrice, setGemPrice] = useState(null); // { coinsPerGem, costFor400, ts }
  const [gemAlertThresholdGold, setGemAlertThresholdGold] = useState(0); // 0 = disabled
  const [settingsGemAlertThresholdGold, setSettingsGemAlertThresholdGold] = useState(0);
  const gemAlertFiredRef = useRef(false); // prevents re-toasting every minute while still under threshold
  const gemAlertThresholdGoldRef = useRef(0); // mirrors gemAlertThresholdGold so fetchGemPrice can stay dependency-free
  const [priceAlerts, setPriceAlerts] = useState([]);
  const [forgeWallet, setForgeWallet] = useState({}); // spirit_shards, volatile_magic, unbound_magic, karma, laurels
  const [alertSort, setAlertSort] = useState("totalNet"); // totalNet | cur | pctOfMax
  const [dailyCrafted, setDailyCrafted] = useState(new Set()); // item IDs crafted today
  const [utcMidnightMs, setUtcMidnightMs] = useState(0); // next reset timestamp
  const [myListings, setMyListings] = useState({}); // itemId -> [{ price, quantity, created }]
  const [mySoldHistory, setMySoldHistory] = useState([]); // [{ item_id, price, quantity, purchased }]
  const [tpSubTab, setTpSubTab] = useState("current"); // "current" | "history"
  const [craftingChartItem, setCraftingChartItem] = useState(null);
  const [velocitySummary, setVelocitySummary] = useState({}); // itemId -> { sellFillsPerHr, buyFillsPerHr, observations }
  const [trendSummary, setTrendSummary] = useState({}); // itemId -> { pct, sell, sell24hAgo }
  const [flipSummary, setFlipSummary] = useState({}); // itemId -> { p10..p90, spreadNet, swing, etc }
  const [manualDailyCrafted, setManualDailyCrafted] = useState(new Set()); // set of itemIds confirmed crafted via count delta
  const [weeklyKeyDone, setWeeklyKeyDone] = useState(false); // whether weekly level 10 key has been earned this week
  const [legendaryAchievements, setLegendaryAchievements] = useState({}); // achievementId -> { done, current, max }
  const [pendingFlips, setPendingFlips] = useState([]); // loaded from IndexedDB
  const [flipHistory, setFlipHistory] = useState([]); // loaded from IndexedDB
  // Track items that were "buy now" in last 2 refreshes for auto-pending
  const buyNowWindowRef = useRef({});
  const lastMarketSummaryRef = useRef(0); // itemId -> { ts, price, targetSell }
  const prevOrdersRef = useRef({}); // itemId -> { buyQty, sellQty } for delta tracking
  const velocityRef = useRef({}); // itemId -> { sellFills, buyFills } this refresh
  const cacheRef = useRef({});
  const doLiveUpdateRef = useRef(null);
  const refreshingRef = useRef(false);

  const [activeTab, setActiveTab] = useState("materials");
  const [activeDisc, setActiveDisc] = useState(null);
  const [sortCraft, setSortCraft] = useState({ k: "profitNet", d: -1 });
  const [showRecMaterials, setShowRecMaterials] = useState(false);
  const [showRecDaily, setShowRecDaily] = useState(true);
  const [showRecDailyOutputs, setShowRecDailyOutputs] = useState(true);
  const [showRecMissing, setShowRecMissing] = useState(false);
  // ── Unlearned Recipes tab state ──
  const [lockedCraftItems, setLockedCraftItems] = useState([]); // computed craft items for recipes NOT known/learned
  const [unlearnedRecipeCount, setUnlearnedRecipeCount] = useState(0); // size of the cached locked-recipe catalog
  const [unlearnedLoading, setUnlearnedLoading] = useState(false);
  const [hideZeroProfitUnlearned, setHideZeroProfitUnlearned] = useState(true); // mirrors showRecMissing's "hide the long tail" role
  const [hideAutoLearnedUnlearned, setHideAutoLearnedUnlearned] = useState(false); // hide recipes with the "AutoLearned" flag — these unlock automatically at a discipline rating, no learning/purchase/achievement needed
  const [sortMat, setSortMat] = useState({ k: "totalValue", d: -1 });
  const [searchMat, setSearchMat] = useState("");
  const [searchCraft, setSearchCraft] = useState("");
  const [craftPage, setCraftPage] = useState(0);
  const [matPage, setMatPage] = useState(0);
  const PAGE_SIZE = 100;
  const [expanded, setExpanded] = useState({});
  const [historyItem, setHistoryItem] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [noApiKey, setNoApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [settingsApiKey, setSettingsApiKey] = useState("");
  const [settingsMarketDbPath, setSettingsMarketDbPath] = useState("");
  const [settingsNasSsh, setSettingsNasSsh] = useState("");
  const [settingsMsg, setSettingsMsg] = useState(null);
  const [alertThreshold, setAlertThreshold] = useState(85); // % of 7-day high to trigger price alert
  const [settingsAlertThreshold, setSettingsAlertThreshold] = useState(85);
  const [rarityFilter, setRarityFilter] = useState(DEFAULT_RARITY_FILTER); // rarity -> boolean, filters Crafting/Recommended/Unlearned/Mystic Forge material promotion
  const rarityFilterLoadedRef = useRef(false); // guards against persisting the default before the cached value has loaded
  const [extraDailyItems, setExtraDailyItems] = useState({}); // itemId -> {name, icon} for non-TP items
  // ── Friend Recipe Lookup — read-only. See FriendFilter.jsx / commands.rs for design notes. ──
  const [friends, setFriends] = useState([]); // [{id, name, added_ts, last_refresh_ts, last_refresh_ok, recipe_count}]
  const [friendRecipeMap, setFriendRecipeMap] = useState({}); // recipeId -> [{friendId, friendName}]
  const [friendDisciplineLevels, setFriendDisciplineLevels] = useState({}); // friendId -> { [discipline]: rating }
  const [friendFilter, setFriendFilter] = useState(DEFAULT_FRIEND_FILTER);
  const [friendNameInput, setFriendNameInput] = useState("");
  const [recipeLookupId, setRecipeLookupId] = useState("");
  const [friendKeyInput, setFriendKeyInput] = useState("");
  const [friendBusy, setFriendBusy] = useState(false);
  const [friendActionMsg, setFriendActionMsg] = useState(null); // {ok, text}
  const [showDeleteFriendConfirm, setShowDeleteFriendConfirm] = useState(null); // friend id pending delete confirmation

  const prog = (pct, msg) => setLoadState({ phase: "loading", pct, msg });
  const fullLoadInProgressRef = useRef(false);

  // ── Full load ───────────────────────────────────────────────────────────────
  const fullLoad = useCallback(async () => {
    if (fullLoadInProgressRef.current) return; // prevent double-load from HMR/StrictMode
    if (cacheRef.current.itemMap && Object.keys(cacheRef.current.itemMap).length > 0) return; // already loaded
    fullLoadInProgressRef.current = true;
    setError(null);
    // Prune old snapshots in background (fixes 5-year retention bug — clears bloat)
    pruneOldSnapshots();
    // Load app mode
    try {
      // ── Phase 1: Load from cache immediately for fast startup ──
      // Cache read comes FIRST — get_market_summary uses the same SQLite DB and would block it
      const _t0 = performance.now();
      const [cachedRecipes, cachedItems, cachedDiscLevels, cachedKnownIds, cachedPrices, cachedOwnedMapEntry, cachedGoldEntry] =
      await cacheGetBulk(["allRecipes", "itemMap", "disciplineLevels", "knownRecipeIds", "lastPriceMap", "ownedMap", "lastGold"]);
      console.log(`[startup] cacheGetBulk done in ${(performance.now()-_t0).toFixed(0)}ms`);

      // NOW start market summary — cache read is done so no SQLite contention
      const marketSummaryPromise = loadMarketSummary().catch(() => ({ velocity: {}, trends: {}, flips: {} }));

      // Restore last known market summary immediately so UI isn't empty while background compute runs
      invoke("cache_get", { key: "lastMarketSummary" }).then(entry => {
        if (!entry?.value) return;
        try {
          const raw = JSON.parse(entry.value);
          const velocity = {};
          for (const v of raw.velocity) velocity[v.item_id] = { sellFillsPerHr: v.sell_fills_per_hr, buyFillsPerHr: v.buy_fills_per_hr, observations: v.observations, windowHrs: v.window_hrs };
          const trends = {};
          for (const t of raw.trends) trends[t.item_id] = { pct: t.pct, current: t.current, old: t.old };
          const flips = {};
          for (const f of raw.flips) flips[f.item_id] = { p10Sell: f.p10_sell, p25Sell: f.p25_sell, p50Sell: f.p50_sell, p75Sell: f.p75_sell, p90Sell: f.p90_sell, swing: f.swing, snapCount: f.snap_count };
          setVelocitySummary(velocity);
          setTrendSummary(trends);
          setFlipSummary(flips);
        } catch(e) {}
      }).catch(() => {});

      const hasCachedEverything = cachedRecipes && cachedItems && cachedPrices;
      if (hasCachedEverything) {
        const cachedAllRecipes = dedupeRecipesById(cachedRecipes.value);
        if (cachedAllRecipes.length !== cachedRecipes.value.length) {
          console.log(`[Cache] Removed ${cachedRecipes.value.length - cachedAllRecipes.length} duplicate recipe(s) from cache — self-healing persisted copy`);
          cacheSet("allRecipes", cachedAllRecipes);
        }
        const cachedItemMap = cachedItems.value;
        const cachedPriceMap = cachedPrices.value;
        const cachedOwnedMap = cachedOwnedMapEntry?.value || {};
        const cachedGold = cachedGoldEntry?.value || 0;

        // Populate cacheRef immediately — background live update needs it
        const cachedResolvedRecipes = {};
        cachedAllRecipes.forEach(r => { cachedResolvedRecipes[r.output_item_id] = r; });
        // Build allItemIds from recipes + owned items (not just cached prices) so we always
        // re-fetch prices for ALL recipe outputs even if they had no TP listing last time
        const _allRecipeItemIds = [...new Set([
          ...cachedAllRecipes.map(r => r.output_item_id),
          ...Object.values(cachedResolvedRecipes).flatMap(r => r.ingredients?.map(i => i.item_id) || []),
          ...Object.keys(cachedOwnedMap).map(Number),
          ...Object.keys(cachedPriceMap).map(Number),
        ])];
        cacheRef.current = { itemMap: cachedItemMap, priceMap: cachedPriceMap, resolvedRecipes: cachedResolvedRecipes, recipes: cachedAllRecipes, knownRecipeIds: cachedKnownIds?.value || [], ownedMap: cachedOwnedMap, allItemIds: _allRecipeItemIds, disciplineLevels: cachedDiscLevels?.value || {}, charInventoryByChar: {}, charDisciplines: {}, timegatedList: [] };

        // Kick off heavy worker tasks in parallel
        console.log(`[startup] kicking off workers. recipes:${cachedAllRecipes.length} items:${Object.keys(cachedItemMap).length} prices:${Object.keys(cachedPriceMap).length}`);
        const startupProcessPromise = processStartupCache(cachedAllRecipes, cachedItemMap, cachedPriceMap, cachedOwnedMap);
        const craftItemsPromise = computeCraftItems(cachedAllRecipes, cachedResolvedRecipes, cachedItemMap, cachedPriceMap, cachedOwnedMap);

        // Render shell immediately
        setData({ goldCopper: cachedGold, totalMaterialValue: 0, materialRows: [], craftItems: [], byDisc: {}, itemMap: cachedItemMap, priceMap: cachedPriceMap, ownedMap: cachedOwnedMap, charInventoryByChar: {}, charDisciplines: {}, timegatedList: [] });
        setLoadState({ phase: "refreshing", pct: 100, msg: "Updating live data..." });

        // Material rows populated when worker finishes
        startupProcessPromise.then(({ resolvedRecipes, matRows, totalMatValue }) => {
          console.log(`[startup] processStartupCache done in ${(performance.now()-_t0).toFixed(0)}ms`);
          cacheRef.current = { ...cacheRef.current, resolvedRecipes };
          setData(prev => prev ? { ...prev, totalMaterialValue: totalMatValue, materialRows: matRows } : prev);
        }).catch(() => {});

        // Crafting tab populated when worker finishes
        craftItemsPromise.then(result => {
          console.log(`[startup] computeCraftItems done in ${(performance.now()-_t0).toFixed(0)}ms`);
          if (!result) return;
          setData(prev => prev ? { ...prev, craftItems: result.craftItems, byDisc: result.byDisc } : prev);
        }).catch(() => {});

        // Flip/velocity/trend data populated when Rust finishes
        marketSummaryPromise.then(({ velocity, trends, flips }) => {
          console.log(`[startup] marketSummary done in ${(performance.now()-_t0).toFixed(0)}ms`);
          setVelocitySummary(velocity);
          setTrendSummary(trends);
          const f = flips || {};
          setFlipSummary(f);
          const nowTs = Date.now();
          const newBuyNow = {};
          const pm = cacheRef.current.priceMap || cachedPriceMap;
          for (const [idStr, flip] of Object.entries(f)) {
            const id = Number(idStr);
            const curSell = pm[id]?.sells?.unit_price || 0;
            if (curSell > 0 && curSell <= flip.p25Sell)
              newBuyNow[id] = { ts: nowTs, price: curSell, targetSell: flip.p75Sell, flip };
          }
          buyNowWindowRef.current = newBuyNow;
        }).catch(() => {});
      }

      // ── Phase 2: Fetch live account + price data ──
      if (hasCachedEverything) {
        // Fire and forget — live update runs in background, UI already showing
        (async () => {
          try {
            await doLiveUpdateRef.current?.();
          } catch(e) {
            console.warn("Background live update failed:", e.message);
            setLoadState({ phase: "done", pct: 100, msg: "" });
          }
        })();
        return; // done — cached UI is live
      }
      // No cache — show loading screen and do full fetch
      setLoadState({ phase: "loading", pct: 0, msg: "Initializing..." });
      prog(6, "Fetching wallet, materials & character inventories...");
      const [wallet, rawMaterials, characters_startup, rawDailyCrafted, rawListings, rawSoldHistory] = await Promise.all([
        apiFetch(`${BASE}/account/wallet`),
                                                                                                                         apiFetch(`${BASE}/account/materials`),
                                                                                                                         apiFetch(`${BASE}/characters?ids=all`),
                                                                                                                         apiFetch(`${BASE}/account/dailycrafting`).catch(() => []),
                                                                                                                         apiFetch(`${BASE}/commerce/transactions/current/sells`).catch(e => { console.warn("[Listings] fetch failed:", e.message); return null; }),
                                                                                                                         fetchSoldHistory().catch(() => []),
      ]);
      const goldCopper = wallet.find(w => w.id === 1)?.value || 0;
      setForgeWallet(extractForgeWallet(wallet));
      // dailycrafting returns array of item name strings like "glob_of_elder_spirit_residue"
      // We'll store as a raw array and look up against recipe output IDs via the API's item IDs
      const nowDate = new Date();
      const nextReset = Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate() + 1);
      // Convert string names to item IDs
      // Match dailycrafting strings to item IDs via normalized name lookup
      setDailyCrafted(buildDailyCraftedSet(rawDailyCrafted, data?.itemMap || {}));
      setUtcMidnightMs(nextReset);

      // Aggregate: material storage + all character bag inventories
      const matAgg = {};
      for (const m of rawMaterials) {
        if (m.count > 0) matAgg[m.id] = (matAgg[m.id] || 0) + m.count;
      }
      const charItems = extractCharacterItems(characters_startup);
      for (const [id, count] of Object.entries(charItems)) {
        matAgg[id] = (matAgg[id] || 0) + count;
      }
      const materials = Object.entries(matAgg).map(([id, count]) => ({ id: Number(id), count }));

      let disciplineLevels, knownRecipeIds, allRecipes, resolvedRecipes, itemMap, allItemIds;

      if (cachedRecipes && cachedItems) {
        // Fast path: recipes/items cached — always use them, prices are always fetched live
        const cacheAgeMin = cachedRecipes?.ts ? Math.round((Date.now() - cachedRecipes.ts) / 60000) : 0;
        const sampleFlags = cachedRecipes.value?.[0]?.flags;
        const hasTimegated = cachedRecipes.value?.some(r => (r.flags||[]).some(f => f.toLowerCase() === "timegated"));
        console.log(`[Cache] Fast path: ${cachedRecipes.value?.length} recipes, has Timegated flag: ${hasTimegated}, sample flags:`, sampleFlags);
        prog(15, `Using cached recipes & items from ${cacheAgeMin < 60 ? cacheAgeMin + "m" : Math.round(cacheAgeMin/60) + "h"} ago...`);
        allRecipes = dedupeRecipesById(cachedRecipes.value);
        itemMap = cachedItems.value;
        // Refresh discipline levels from current character data (catches level-ups)
        disciplineLevels = {};
        for (const char of characters_startup) {
          for (const craft of (char.crafting || [])) {
            const cur = disciplineLevels[craft.discipline] || 0;
            if (craft.rating > cur) disciplineLevels[craft.discipline] = craft.rating;
          }
        }
        knownRecipeIds = cachedKnownIds?.value || [];
        resolvedRecipes = {};
        allRecipes.forEach(r => { resolvedRecipes[r.output_item_id] = r; });
        allItemIds = [...new Set([
          ...materials.map(m => m.id),
                                 ...Object.keys(cachedOwnedMap).map(Number),
                                 ...allRecipes.map(r => r.output_item_id),
                                 ...Object.values(resolvedRecipes).flatMap(r => r.ingredients?.map(i => i.item_id) || []),
        ])];
      } else {
        // Full load path
        prog(10, "Fetching character disciplines...");
        // Use characters_startup already fetched above (saves a duplicate API call)
        const characters = characters_startup;
        disciplineLevels = {};
        for (const char of characters) {
          for (const craft of (char.crafting || [])) {
            const cur = disciplineLevels[craft.discipline] || 0;
            if (craft.rating > cur) disciplineLevels[craft.discipline] = craft.rating;
          }
        }

        prog(16, "Fetching known recipes...");
        knownRecipeIds = await apiFetch(`${BASE}/account/recipes`);

        prog(22, "Fetching all recipe IDs...");
        const allRecipeIds = await publicFetch(`${BASE}/recipes`);

        prog(30, "Loading recipe details...");
        const knownRecipes = await fetchIds("/recipes", knownRecipeIds);

        prog(38, "Scanning auto-unlocked recipes...");
        // Only fetch public recipe IDs that aren't already in knownRecipeIds to save requests
        const knownSetForFetch = new Set(knownRecipeIds);
        const publicOnlyIds = allRecipeIds.filter(id => !knownSetForFetch.has(id));
        const allRecipeDetails = [];
        for (const ch of chunk(publicOnlyIds, 200)) {
          try {
            const batch = await publicFetch(`${BASE}/recipes?ids=${ch.join(",")}`);
            allRecipeDetails.push(...(Array.isArray(batch) ? batch : []));
          } catch {}
        }
        const knownSet = new Set(knownRecipeIds);
        const autoUnlocked = allRecipeDetails.filter(r => {
          if (knownSet.has(r.id)) return false;
          if (!r.disciplines?.length) return false;
          if ((r.flags || []).includes("LearnedFromItem")) return false;
          return r.disciplines.some(d => (disciplineLevels[d] || 0) >= (r.min_rating || 0));
        });
        allRecipes = dedupeRecipesById([...knownRecipes, ...autoUnlocked]);
        resolvedRecipes = {};
        allRecipes.forEach(r => { resolvedRecipes[r.output_item_id] = r; });

        prog(55, "Fetching item details...");
        const matIds = materials.map(m => m.id);
        const outputIds = allRecipes.map(r => r.output_item_id);
        const ingIds = new Set();
        const collectIngs = (r) => r?.ingredients?.forEach(ing => {
          ingIds.add(ing.item_id);
          if (resolvedRecipes[ing.item_id]) collectIngs(resolvedRecipes[ing.item_id]);
        });
          allRecipes.forEach(collectIngs);
          allItemIds = [...new Set([...matIds, ...outputIds, ...ingIds])];
          const itemDetails = await fetchIds("/items", allItemIds);
          itemMap = Object.fromEntries(itemDetails.map(i => [i.id, i]));

          prog(68, "Caching recipes & items for faster future startup...");
          await Promise.all([
            cacheSet("allRecipes", allRecipes),
                            // Strip itemMap to name+icon+rarity+flags+type only — reduces cache from ~5MB to ~1MB
                            cacheSet("itemMap", Object.fromEntries(
                              Object.entries(itemMap).map(([id, item]) => [id, {
                                id: item.id, name: item.name, icon: item.icon,
                                rarity: item.rarity, type: item.type, flags: item.flags,
                              }])
                            )),
                            cacheSet("disciplineLevels", disciplineLevels),
                            cacheSet("knownRecipeIds", knownRecipeIds),
          ]);
      }

      // Fetch item details for any IDs not already in itemMap (e.g. new character bag items)
      const missingItemIds = allItemIds.filter(id => !itemMap[id]);
      if (missingItemIds.length > 0) {
        prog(70, `Fetching ${missingItemIds.length} new item details...`);
        const newItems = await fetchIds("/items", missingItemIds);
        newItems.forEach(i => { itemMap[i.id] = i; });
        // Update cache with newly discovered items (stripped)
        cacheSet("itemMap", Object.fromEntries(
          Object.entries(itemMap).map(([id, item]) => [id, {
            id: item.id, name: item.name, icon: item.icon,
            rarity: item.rarity, type: item.type, flags: item.flags,
          }])
        ));
      }

      // Prices always fetched live regardless of recipe/item cache
      prog(72, "Fetching live trading post prices...");
      const priceMap = await fetchPrices(filterTradeable(allItemIds, itemMap));

      prog(88, "Building crafting data...");
      const ownedMap = Object.fromEntries(materials.map(m => [m.id, m.count]));
      // Expand allItemIds to include all owned items (bank, inventory, materials) for accurate wealth
      const charItems_startup = extractCharacterItems(characters_startup);
      const expandedIds = [...new Set([...allItemIds, ...Object.keys(ownedMap).map(Number), ...Object.keys(charItems_startup).map(Number)])];
      const extraPrices = await fetchPrices(filterTradeable(expandedIds.filter(id => !priceMap[id]), itemMap));
      Object.assign(priceMap, extraPrices);
      allItemIds = expandedIds;
      cacheRef.current = { ...cacheRef.current, allItemIds };
      const craftItems = buildCraftItems(allRecipes, resolvedRecipes, itemMap, priceMap, ownedMap);

      const byDisc = {};
      const byDiscSeen = {};
      craftItems.forEach(ci => getRecipeDisciplines(ci).forEach(d => {
        if (!byDisc[d]) { byDisc[d] = []; byDiscSeen[d] = new Set(); }
        if (!byDiscSeen[d].has(ci.recipeId)) { byDiscSeen[d].add(ci.recipeId); byDisc[d].push(ci); }
      }));

      const materialRows = materials.map(m => {
        const item = itemMap[m.id];
        const price = priceMap[m.id];
        const sp = price?.sells?.unit_price || 0;
        const spNet = Math.floor(sp * 0.85);
        return { id: m.id, name: item?.name || `Item ${m.id}`, icon: item?.icon, rarity: item?.rarity, count: m.count, sellPrice: sp, sellPriceNet: spNet, buyPrice: price?.buys?.unit_price || 0, totalValue: spNet * m.count };
      }).filter(r => {
        // Exclude items that are untradeable, have no recipe, and no known name — these are
        // permanent contracts, infinite tools, account-bound junk from character inventories
        if (r.name.startsWith("Item ")) return false; // unknown item, not in API
        const item = itemMap[r.id];
        const hasTP = r.sellPrice > 0;
        const hasCraft = !!resolvedRecipes[r.id];
        const flags = item?.flags || [];
        const isAccountBound = flags.includes("AccountBound") || flags.includes("MonsterOnly");
        const isTool = item?.type === "Tool" || item?.type === "Container";
        // Keep if tradeable or craftable; drop if account-bound tool/container with no TP value
        if (isAccountBound && isTool && !hasTP && !hasCraft) return false;
        return true;
      });
      const totalMaterialValue = materialRows.reduce((s, r) => s + r.totalValue, 0);

      const charInventoryByChar = extractCharacterItemsByChar(characters_startup);
      const charDisciplines = extractCharacterDisciplines(characters_startup);
      const timegatedList = buildTimegatedInfo(itemMap, disciplineLevels);
      cacheRef.current = { itemMap, priceMap, resolvedRecipes, recipes: allRecipes, knownRecipeIds, ownedMap, allItemIds, disciplineLevels, charInventoryByChar, charDisciplines, timegatedList };

      prog(95, "Saving price snapshot (live prices only)...");
      // NAS collector handles price snapshots
      cacheSet("lastPriceMap", priceMap); // cache for fast startup next time

      // Derive velocity from all accumulated qty snapshots
      const outputItemIds = allRecipes.map(r => r.output_item_id);
      loadMarketSummary()
      .then(({ velocity, trends, flips }) => {
        setVelocitySummary(velocity); setTrendSummary(trends);
        const f = flips || {}; setFlipSummary(f);
        const nowTs = Date.now(); const newBuyNow = {};
        const priceMap = cacheRef.current.priceMap || {}; const itemMap = cacheRef.current.itemMap || {};
        for (const [idStr, flip] of Object.entries(f)) {
          const id = Number(idStr);
          const curSell = priceMap[id]?.sells?.unit_price || 0;
          if (curSell > 0 && curSell <= flip.p25Sell) newBuyNow[id] = { ts: nowTs, price: curSell, targetSell: flip.p75Sell, flip };
        }
        buyNowWindowRef.current = newBuyNow;
      }).catch(() => {});

      const now = Date.now();
      // Process TP listings
      const listingMap = {};
      console.log("[Listings] raw response:", rawListings?.length, rawListings?.[0]);
      for (const l of (Array.isArray(rawListings) ? rawListings : [])) {
        if (!listingMap[l.item_id]) listingMap[l.item_id] = [];
        listingMap[l.item_id].push({ price: l.price, quantity: l.quantity, created: l.created });
      }
      console.log("[Listings] mapped items:", Object.keys(listingMap).length);
      setMyListings(listingMap);
      if (Array.isArray(rawSoldHistory)) {
        const sorted = rawSoldHistory.sort((a, b) => new Date(b.purchased) - new Date(a.purchased));
        setMySoldHistory(sorted);
        // Fetch names for any items not yet in itemMap (listings + sold history)
        const allTpIds = [
          ...Object.keys(listingMap).map(Number),
                               ...sorted.map(s => s.item_id),
                               // Also fetch names for any items referenced in cheapAcquire paths but missing from itemMap
                               ...craftItems.flatMap(ci => (ci.cheapAcquire?.path || []).map(p => p.itemId)).filter(Boolean),
        ];
        const missingIds = [...new Set(allTpIds)].filter(id => !itemMap[id]);
        if (missingIds.length > 0) {
          const chunks = [];
          for (let i = 0; i < missingIds.length; i += 200) chunks.push(missingIds.slice(i, i+200));
          Promise.all(chunks.map(chunk => publicFetch(`${BASE}/items?ids=${chunk.join(",")}`).catch(() => [])))
          .then(results => {
            const extra = {};
            for (const batch of results) for (const item of (batch || [])) extra[item.id] = item;
            if (Object.keys(extra).length > 0) {
              cacheRef.current.itemMap = { ...itemMap, ...extra };
              setData(prev => prev ? { ...prev, itemMap: { ...prev.itemMap, ...extra } } : prev);
            }
          }).catch(() => {});
        }
      }
      setLivePricesReady(true);
      cacheRef.current.craftItems = craftItems;
      setData({ goldCopper, totalMaterialValue, materialRows, craftItems, byDisc, itemMap, priceMap, ownedMap, charInventoryByChar, charDisciplines, timegatedList });
      setLastPrice(now); setLastRecipe(now);
      setNextPriceIn(PRICE_REFRESH_MS); setNextRecipeIn(RECIPE_REFRESH_MS);
      setSecsAgo(0);
      cacheSet("lastRecipeRefresh", now);
      setLoadState({ phase: "done", pct: 100, msg: "" });
    } catch (e) {
      setError(e.message);
      setLoadState({ phase: "done", pct: 0, msg: "" });
    } finally {
      fullLoadInProgressRef.current = false;
    }
  }, []);

  // Live update: runs in background after fast cache load, or inline on first load
  // Fetches account data + live prices and updates the full UI
  const doLiveUpdate = useCallback(async () => {
    const { itemMap, resolvedRecipes, recipes: allRecipes, knownRecipeIds, allItemIds } = cacheRef.current;

    // ── Wave 1: fast account data (no character inventories) + prices ──
    // characters?ids=all is the slowest call — fetch it separately so it doesn't
    // block wallet/materials/prices from showing up quickly.
    const [wallet, rawMaterials, rawDailyCrafted, rawAchievements, rawListings, rawSoldHistory] = await Promise.all([
      apiFetch(`${BASE}/account/wallet`),
      apiFetch(`${BASE}/account/materials`),
      apiFetch(`${BASE}/account/dailycrafting`).catch(() => []),
      apiFetch(`${BASE}/account/achievements?ids=3489,3522,2530,2500,2187,2483,2522,2296,2478,2606,2393,2564,2458,2502,2177,2291,2374,2389,2498,2524,2441,2391,2449`).catch(() => []),
      apiFetch(`${BASE}/commerce/transactions/current/sells`).catch(() => null),
      fetchSoldHistory().catch(() => []),
    ]);
    // Process legendary achievement progress (Aurora II: Empowering = 3489, Aurora: Awakening = 3522)
    if (Array.isArray(rawAchievements)) {
      const achMax = { 3489: 21, 3522: 7, 2530: null, 2500: null, 2187: null, 2483: 7, 2522: 9, 2296: null, 2478: 15, 2606: 12, 2393: 34, 2564: 18, 2458: 15, 2502: 24, 2177: 14, 2291: 14, 2374: 35, 2389: 16, 2498: 14, 2524: 36, 2441: 15, 2391: 12, 2449: 29 }; // null = use API bits count
      const achMap = {};
      for (const ach of rawAchievements) {
        achMap[ach.id] = {
          done: ach.done || false,
          current: ach.bits?.length || ach.current || 0,
          max: achMax[ach.id] !== undefined && achMax[ach.id] !== null
            ? achMax[ach.id]
            : (ach.max || ach.bits?.length || null),
        };
      }
      setLegendaryAchievements(achMap);
    }
    const goldCopper = wallet.find(w => w.id === 1)?.value || 0;
    setForgeWallet(extractForgeWallet(wallet));
    const nowDate = new Date();
    setDailyCrafted(buildDailyCraftedSet(rawDailyCrafted, itemMap));
    setUtcMidnightMs(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate() + 1));

    // Material storage only (no bag inventory yet — that comes with characters)
    const matAgg = {};
    for (const m of rawMaterials) { if (m.count > 0) matAgg[m.id] = (matAgg[m.id] || 0) + m.count; }

    // Fetch prices in parallel with character fetch (below)
    const pricePromise = fetchPrices(filterTradeable(allItemIds, itemMap));

    // ── Wave 2: slow character fetch (runs in parallel with price fetch) ──
    const charPromise = apiFetch(`${BASE}/characters?ids=all`).catch(() => []);

    // Wait for prices first — update UI as soon as prices + mat storage are ready
    const freshPrices = await pricePromise;
    cacheRef.current.priceMap = freshPrices;

    // Build partial ownedMap from material storage (no bag items yet)
    const partialOwnedMap = { ...matAgg };
    const partialMaterials = Object.entries(partialOwnedMap).map(([id, count]) => ({ id: Number(id), count }));
    const partialMatRows = partialMaterials.map(m => {
      const item = itemMap[m.id]; const price = freshPrices[m.id];
      const sp = price?.sells?.unit_price || 0; const spNet = Math.floor(sp * 0.85);
      return { id: m.id, name: item?.name || `Item ${m.id}`, icon: item?.icon, rarity: item?.rarity, count: m.count, sellPrice: sp, sellPriceNet: spNet, buyPrice: price?.buys?.unit_price || 0, totalValue: spNet * m.count };
    }).filter(r => {
      if (r.name.startsWith("Item ")) return false;
      const item = itemMap[r.id]; const flags = item?.flags || [];
      if (flags.includes("AccountBound") && (item?.type === "Tool" || item?.type === "Container") && !r.sellPrice && !resolvedRecipes[r.id]) return false;
      return true;
    });
    const partialTotalMat = partialMatRows.reduce((s, r) => s + r.totalValue, 0);
    const partialCraftItems = buildCraftItems(allRecipes, resolvedRecipes, itemMap, freshPrices, partialOwnedMap);
    // Dedup by recipeId — every other byDisc builder in this file already does this
    // (fullLoad, refreshRecipes, rescanAutoUnlockedRecipes, the worker); this one was
    // missing the guard, which let duplicate recipe ids pile up across refreshes
    // instead of collapsing to one card each.
    const partialByDisc = {};
    const partialByDiscSeen = {};
    partialCraftItems.forEach(ci => getRecipeDisciplines(ci).forEach(d => {
      if (!partialByDisc[d]) { partialByDisc[d] = []; partialByDiscSeen[d] = new Set(); }
      if (!partialByDiscSeen[d].has(ci.recipeId)) { partialByDiscSeen[d].add(ci.recipeId); partialByDisc[d].push(ci); }
    }));

    // Show partial data immediately — gold, mat storage prices, crafting profits
    cacheRef.current.ownedMap = partialOwnedMap;
    setLivePricesReady(true);
    setData(prev => ({ ...prev, goldCopper, totalMaterialValue: partialTotalMat, materialRows: partialMatRows, craftItems: partialCraftItems, byDisc: partialByDisc, priceMap: freshPrices, ownedMap: partialOwnedMap }));

    // Save price snapshot and cache immediately
    // NAS collector handles price snapshots
    cacheSet("lastPriceMap", freshPrices);
    cacheSet("lastGold", goldCopper);
    cacheSet("ownedMap", partialOwnedMap);

    // Velocity / flip analysis (non-blocking)
    const outputItemIds = allRecipes.map(r => r.output_item_id);
    loadMarketSummary()
    .then(({ velocity, trends, flips }) => {
      setVelocitySummary(velocity); setTrendSummary(trends);
      const f = flips || {}; setFlipSummary(f);
      const nowTs = Date.now(); const newBuyNow = {};
      const pm = cacheRef.current.priceMap || {};
      for (const [idStr, flip] of Object.entries(f)) {
        const id = Number(idStr);
        const curSell = pm[id]?.sells?.unit_price || 0;
        if (curSell > 0 && curSell <= flip.p25Sell) newBuyNow[id] = { ts: nowTs, price: curSell, targetSell: flip.p75Sell, flip };
      }
      buyNowWindowRef.current = newBuyNow;
    }).catch(() => {});

    // TP listings / sold history (non-blocking UI update)
    const listingMap = {};
    for (const l of (Array.isArray(rawListings) ? rawListings : [])) {
      if (!listingMap[l.item_id]) listingMap[l.item_id] = [];
      listingMap[l.item_id].push({ price: l.price, quantity: l.quantity, created: l.created });
    }
    setMyListings({ ...listingMap }); // new reference to force re-render
    if (Array.isArray(rawSoldHistory)) {
      const sorted = [...rawSoldHistory].sort((a, b) => new Date(b.purchased) - new Date(a.purchased));
      setMySoldHistory(sorted);
      const curItemMap = cacheRef.current.itemMap || {};
      const allTpIds2 = [
        ...Object.keys(listingMap).map(Number),
                                   ...sorted.map(s => s.item_id),
                                   ...(cacheRef.current.craftItems || []).flatMap(ci => (ci.cheapAcquire?.path || []).map(p => p.itemId)).filter(Boolean),
      ];
      const missingIds = [...new Set(allTpIds2)].filter(id => !curItemMap[id]);
      if (missingIds.length > 0) {
        const chunks = [];
        for (let i = 0; i < missingIds.length; i += 200) chunks.push(missingIds.slice(i, i+200));
        Promise.all(chunks.map(chunk => publicFetch(`${BASE}/items?ids=${chunk.join(",")}`).catch(() => [])))
        .then(results => {
          const extra = {};
          for (const batch of results) for (const item of (batch || [])) extra[item.id] = item;
          if (Object.keys(extra).length > 0) {
            cacheRef.current.itemMap = { ...curItemMap, ...extra };
            setData(prev => prev ? { ...prev, itemMap: { ...prev.itemMap, ...extra } } : prev);
          }
        }).catch(() => {});
      }
    }

    // Mark as done — partial data is live. Character inventory will add on top.
    const now = Date.now();
    setLastPrice(now); setLastRecipe(now);
    setNextPriceIn(PRICE_REFRESH_MS); setNextRecipeIn(RECIPE_REFRESH_MS);
    setSecsAgo(0);
    setLoadState({ phase: "done", pct: 100, msg: "" });

    // ── Wave 3: character inventory (slow) — updates bag items on top of mat storage ──
    charPromise.then(characters_startup => {
      if (!characters_startup?.length) return;
      const charItems = extractCharacterItems(characters_startup);
      const fullMatAgg = { ...matAgg };
      for (const [id, count] of Object.entries(charItems)) { fullMatAgg[id] = (fullMatAgg[id] || 0) + count; }
      const fullOwnedMap = fullMatAgg;
      const fullMaterials = Object.entries(fullOwnedMap).map(([id, count]) => ({ id: Number(id), count }));
      const fullMatRows = fullMaterials.map(m => {
        const item = itemMap[m.id]; const price = freshPrices[m.id];
        const sp = price?.sells?.unit_price || 0; const spNet = Math.floor(sp * 0.85);
        return { id: m.id, name: item?.name || `Item ${m.id}`, icon: item?.icon, rarity: item?.rarity, count: m.count, sellPrice: sp, sellPriceNet: spNet, buyPrice: price?.buys?.unit_price || 0, totalValue: spNet * m.count };
      }).filter(r => {
        if (r.name.startsWith("Item ")) return false;
        const item = itemMap[r.id]; const flags = item?.flags || [];
        if (flags.includes("AccountBound") && (item?.type === "Tool" || item?.type === "Container") && !r.sellPrice && !resolvedRecipes[r.id]) return false;
        return true;
      });
      const fullTotalMat = fullMatRows.reduce((s, r) => s + r.totalValue, 0);
      const fullCraftItems = buildCraftItems(allRecipes, resolvedRecipes, itemMap, freshPrices, fullOwnedMap);
      // Same recipeId dedup guard as wave 2 above — see that comment for rationale.
      const fullByDisc = {};
      const fullByDiscSeen = {};
      fullCraftItems.forEach(ci => getRecipeDisciplines(ci).forEach(d => {
        if (!fullByDisc[d]) { fullByDisc[d] = []; fullByDiscSeen[d] = new Set(); }
        if (!fullByDiscSeen[d].has(ci.recipeId)) { fullByDiscSeen[d].add(ci.recipeId); fullByDisc[d].push(ci); }
      }));
      const charInventoryByChar = extractCharacterItemsByChar(characters_startup);
      const charDisciplines = extractCharacterDisciplines(characters_startup);
      const disciplineLevels = cacheRef.current.disciplineLevels || {};
      const timegatedList = buildTimegatedInfo(itemMap, disciplineLevels);
      cacheRef.current.ownedMap = fullOwnedMap;
      cacheRef.current.charInventoryByChar = charInventoryByChar;
      cacheRef.current.charDisciplines = charDisciplines;
      cacheRef.current.timegatedList = timegatedList;
      // Cache the full ownedMap (with bags) for next fast-path load
      cacheSet("ownedMap", fullOwnedMap);
      setData(prev => ({ ...prev, totalMaterialValue: fullTotalMat, materialRows: fullMatRows, craftItems: fullCraftItems, byDisc: fullByDisc, ownedMap: fullOwnedMap, charInventoryByChar, charDisciplines, timegatedList }));
    }).catch(() => {});
  }, []);

  useEffect(() => { doLiveUpdateRef.current = doLiveUpdate; }, [doLiveUpdate]);
  useEffect(() => {
    // Load API key first — don't start data load until we have it
    invoke("cache_get", { key: "api_key" }).then(e => {
      if (e?.value) {
        setApiKey(e.value);
        setSettingsApiKey(e.value);
        window.__gw2ApiKey = e.value;
        // Check when recipes were last refreshed — if >4h ago, trigger refresh after load
        invoke("cache_get", { key: "lastRecipeRefresh" }).then(re => {
          if (re?.value) {
            const lastRecipeTs = Number(re.value);
            const elapsed = Date.now() - lastRecipeTs;
            setLastRecipe(elapsed > RECIPE_REFRESH_MS ? 0 : Date.now() - elapsed);
          }
        }).catch(() => {});
        fullLoad();
      } else {
        // No API key — show setup screen immediately
        setNoApiKey(true);
        setLoadState({ phase: "done", pct: 100, msg: "" });
      }
    }).catch(() => {
      setNoApiKey(true);
      setLoadState({ phase: "done", pct: 100, msg: "" });
    });

    // Other settings — load in parallel
    invoke("get_market_db_info").then(info => { if (info.path) setSettingsNasSsh(info.path); }).catch(() => {});
    invoke("cache_get", { key: "nas_ssh" }).then(e => { if (e?.value) setSettingsNasSsh(e.value); }).catch(() => {});
    invoke("cache_get", { key: "alert_threshold" }).then(e => { if (e?.value) { const v = Number(e.value); if (v >= 50 && v <= 100) { setAlertThreshold(v); setSettingsAlertThreshold(v); } } }).catch(() => {});
    invoke("cache_get", { key: "gem_alert_threshold_gold" }).then(e => {
      if (e?.value) { const v = Number(e.value); if (v >= 0) { setGemAlertThresholdGold(v); setSettingsGemAlertThresholdGold(v); } }
    }).catch(() => {});
    invoke("cache_get", { key: "lastGemPrice" }).then(e => {
      if (e?.value) { try { setGemPrice(JSON.parse(e.value)); } catch {} }
    }).catch(() => {});
    invoke("cache_get", { key: "rarityFilter" }).then(e => {
      if (e?.value) { try { setRarityFilter(JSON.parse(e.value)); } catch {} }
      rarityFilterLoadedRef.current = true;
    }).catch(() => { rarityFilterLoadedRef.current = true; });
    invoke("cache_get", { key: "weekly_key_done" }).then(e => {
      if (e?.value) {
        const { done, weeklyResetTs } = JSON.parse(e.value);
        if (done && weeklyResetTs === getWeeklyResetTs()) setWeeklyKeyDone(true);
      }
    }).catch(() => {});
    // Fetch DB stats on startup
    getDbStats().then(setDbStats).catch(() => {});
    // Load flip tracking data from personal.db
    flipPendingGetAll().then(setPendingFlips).catch(() => {});
    flipHistoryGetAll().then(rows => {
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
      setFlipHistory(rows.filter(r => r.sellTime >= monthStart.getTime()));
    }).catch(() => {});
    // Load friend recipe lookup data from personal.db
    getFriends().then(setFriends).catch(() => {});
    getFriendRecipesKnown().then(entries => setFriendRecipeMap(buildFriendRecipeMap(entries))).catch(() => {});
    getFriendDisciplineLevels().then(entries => setFriendDisciplineLevels(buildFriendDisciplineMap(entries))).catch(() => {});
    invoke("cache_get", { key: "friendFilter" }).then(e => {
      if (e?.value) { try { setFriendFilter(JSON.parse(e.value)); } catch {} }
    }).catch(() => {});
  }, [fullLoad]);

  useEffect(() => {
    if (data && !activeDisc) {
      const d = DISCIPLINES.find(d => data.byDisc[d]?.length > 0);
      if (d) setActiveDisc(d);
    }
  }, [data, activeDisc]);

  // ── Price + materials refresh ───────────────────────────────────────────────
  const refreshPrices = useCallback(async () => {
    if (!cacheRef.current.itemMap || refreshingRef.current) return;
    refreshingRef.current = true; setRefreshing(true); setRefreshError(null);
    try {
      const { itemMap, resolvedRecipes, recipes, allItemIds } = cacheRef.current;
      const [wallet, rawMats, characters_refresh, freshPrices, rawDailyCrafted2, rawListings, rawSoldHistory] = await Promise.all([
        apiFetch(`${BASE}/account/wallet`),
                                                                                                                                  apiFetch(`${BASE}/account/materials`),
                                                                                                                                  apiFetch(`${BASE}/characters?ids=all`),
                                                                                                                                  fetchPrices(filterTradeable(allItemIds, itemMap)),
                                                                                                                                  apiFetch(`${BASE}/account/dailycrafting`).catch(() => []),
                                                                                                                                  apiFetch(`${BASE}/commerce/transactions/current/sells`).catch(() => null),
                                                                                                                                  fetchSoldHistory().catch(() => []),
      ]);
      const characters_data = characters_refresh || [];
      setDailyCrafted(buildDailyCraftedSet(rawDailyCrafted2, itemMap));
      const now2 = new Date();
      setUtcMidnightMs(Date.UTC(now2.getUTCFullYear(), now2.getUTCMonth(), now2.getUTCDate() + 1));
      const goldCopper = wallet.find(w => w.id === 1)?.value || 0;
      setForgeWallet(extractForgeWallet(wallet));
      // Aggregate material storage + character bag inventories, deduplicate
      const matAgg2 = {};
      for (const m of rawMats) { if (m.count > 0) matAgg2[m.id] = (matAgg2[m.id] || 0) + m.count; }
      const charItems2 = extractCharacterItems(characters_data);
      for (const [id, count] of Object.entries(charItems2)) {
        matAgg2[id] = (matAgg2[id] || 0) + count;
      }
      const dedupedMats = Object.entries(matAgg2).map(([id, count]) => ({ id: Number(id), count }));
      const ownedMap = Object.fromEntries(dedupedMats.map(m => [m.id, m.count]));
      // Fetch prices and item details for any bag items not in allItemIds
      // (e.g. high-value containers like Permanent Hair Stylist Contract id:38507)
      const missingPriceIds = Object.keys(ownedMap).map(Number).filter(id => !freshPrices[id]);
      if (missingPriceIds.length > 0) {
        const [extraPrices, extraItems] = await Promise.all([
          fetchPrices(filterTradeable(missingPriceIds, itemMap)),
          fetchIds("/items", missingPriceIds.filter(id => !itemMap[id])),
        ]);
        Object.assign(freshPrices, extraPrices);
        extraItems.forEach(i => { itemMap[i.id] = i; });
        cacheRef.current.allItemIds = [...new Set([...allItemIds, ...missingPriceIds])];
        cacheRef.current.itemMap = itemMap;
      }
      cacheRef.current.priceMap = freshPrices;
      cacheRef.current.ownedMap = ownedMap;

      // Manual daily tracking: record baseline if needed, then check for count increases
      const resetTs = getDailyResetTs();
      const manualResetMap = await manualDailyGetAll().catch(() => ({}));
      // Detect items where we have no baseline for this reset yet → record one
      const needsBaseline = Object.values(MANUAL_DAILY_MAP).some(info => {
        const b = manualResetMap[info.itemId];
        return !b || b.resetTs < resetTs;
      });
      if (needsBaseline) await recordManualDailyBaseline(ownedMap);
      const freshResetMap = await manualDailyGetAll().catch(() => ({}));
      setManualDailyCrafted(checkManualDailyCrafted(freshResetMap, ownedMap, resetTs));

      // Check current prices against 7-day historical max from IndexedDB
      // NAS collector handles price snapshots
      // Recompute velocity from fresh snapshots (uses all accumulated history)
      const outputIds = (cacheRef.current.recipes || []).map(r => r.output_item_id);
      const nowMs = Date.now();
      const MARKET_SUMMARY_INTERVAL = 5 * 60 * 1000; // every 5 minutes
      if (nowMs - lastMarketSummaryRef.current >= MARKET_SUMMARY_INTERVAL) {
        lastMarketSummaryRef.current = nowMs;
        loadMarketSummary()
        .then(({ velocity, trends, flips }) => {
          setVelocitySummary(velocity);
          setTrendSummary(trends);
          const f = flips || {};
          setFlipSummary(f);
          // Auto-track "buy now" signals in the buyNow window
          const nowTs = Date.now();
          const curBuyNow = buyNowWindowRef.current;
          const newBuyNow = {};
          // Get current prices from cacheRef
          const priceMap = cacheRef.current.priceMap || {};
          const itemMap  = cacheRef.current.itemMap  || {};
          for (const [idStr, flip] of Object.entries(f)) {
            const id = Number(idStr);
            const curSell = priceMap[id]?.sells?.unit_price || 0;
            const isBuyNow = curSell > 0 && curSell <= flip.p25Sell;
            if (isBuyNow) {
              newBuyNow[id] = { ts: nowTs, price: curSell, targetSell: flip.p75Sell, flip };
            }
          }
          buyNowWindowRef.current = newBuyNow;
        }).catch(() => {});
      } // end market summary throttle
      // Price alert scanning — throttled to every 15 min (heavy query on large DB)
      if (Date.now() - (cacheRef.current.lastAlertScan || 0) >= 15 * 60 * 1000) {
        cacheRef.current.lastAlertScan = Date.now();
        const _alertSevenDaysAgo = Date.now() - SEVEN_DAYS_MS;
        // Send all owned material IDs — file filters to tracked items with sufficient history
        const alertItemIds = dedupedMats.map(mat => mat.id);
        getPriceAlertData(alertItemIds, _alertSevenDaysAgo).then(rows => {
          const alertMap = {};
          for (const row of rows) {
            // row_count already filtered to >=5 by collector when writing price_alerts.json
            const id = row.item_id;
            const cur = freshPrices[id]?.sells?.unit_price;
            if (!cur) continue;
            if (cur < row.seven_day_max * (alertThreshold / 100)) continue;
            const item = itemMap[id];
            const mat = dedupedMats.find(m => m.id === id);
            const count = mat?.count || 0;
            const pctOfMax = Math.round((cur / row.seven_day_max) * 100);
            alertMap[id] = { id, name: item?.name || `Item ${id}`, icon: item?.icon, cur,
            sevenDayMax: row.seven_day_max, pctOfMax, isNewHigh: cur >= row.seven_day_max,
            count, totalNet: Math.floor(cur * count * 0.85) };
          }
          if (Object.keys(alertMap).length) setPriceAlerts(Object.values(alertMap).sort((a, b) => b.totalNet - a.totalNet));
        }).catch(() => {});
      } // end alert throttle

      // Update gold, prices, owned counts immediately — no heavy work
      const materialRows = dedupedMats.map(m => {
        const item = itemMap[m.id]; const price = freshPrices[m.id];
        const sp = price?.sells?.unit_price || 0;
        const spNet = Math.floor(sp * 0.85);
        return { id: m.id, name: item?.name || `Item ${m.id}`, icon: item?.icon, rarity: item?.rarity, count: m.count, sellPrice: sp, sellPriceNet: spNet, buyPrice: price?.buys?.unit_price || 0, totalValue: spNet * m.count };
      }).filter(r => {
        if (r.name.startsWith("Item ")) return false;
        const item = itemMap[r.id];
        const flags = item?.flags || [];
        const isAccountBound = flags.includes("AccountBound") || flags.includes("MonsterOnly");
        const isTool = item?.type === "Tool" || item?.type === "Container";
        if (isAccountBound && isTool && !r.sellPrice && !resolvedRecipes[r.id]) return false;
        return true;
      });
      const totalMaterialValue = materialRows.reduce((s, r) => s + r.totalValue, 0);
      const now = Date.now();
      const charInventoryByChar2 = extractCharacterItemsByChar(characters_data);
      const charDisciplines2 = extractCharacterDisciplines(characters_data);
      cacheRef.current.charInventoryByChar = charInventoryByChar2;
      cacheRef.current.charDisciplines = charDisciplines2;
      // Update UI immediately with gold/prices/materials — crafting items deferred
      setData(prev => ({ ...prev, goldCopper, totalMaterialValue, materialRows, priceMap: freshPrices, ownedMap, charInventoryByChar: charInventoryByChar2, charDisciplines: charDisciplines2, timegatedList: cacheRef.current.timegatedList || prev.timegatedList }));
      setLastPrice(now); setNextPriceIn(PRICE_REFRESH_MS); setSecsAgo(0);
      // Persist latest data so next app launch loads fresh values immediately
      cacheSet("lastPriceMap", freshPrices);
      cacheSet("lastGold", goldCopper);
      cacheSet("ownedMap", ownedMap);
      // Build craft items in worker — never blocks the main thread
      computeCraftItems(recipes, resolvedRecipes, itemMap, freshPrices, ownedMap)
      .then(result => {
        if (result) { cacheRef.current.craftItems = result.craftItems; setData(prev => prev ? { ...prev, craftItems: result.craftItems, byDisc: result.byDisc } : prev); }
      }).catch(() => {});
      // Update DB stats in sync with price refresh
      getDbStats().then(setDbStats).catch(() => {});
      // Update TP listings and sold history
      const listingMap2 = {};
      for (const l of (Array.isArray(rawListings) ? rawListings : [])) {
        if (!listingMap2[l.item_id]) listingMap2[l.item_id] = [];
        listingMap2[l.item_id].push({ price: l.price, quantity: l.quantity, created: l.created });
      }
      setMyListings({ ...listingMap2 });
      if (Array.isArray(rawSoldHistory)) {
        setMySoldHistory([...rawSoldHistory].sort((a, b) => new Date(b.purchased) - new Date(a.purchased)));
      }
    } catch (e) { setRefreshError("Refresh failed: " + e.message); }
    finally { setRefreshing(false); refreshingRef.current = false; }
  }, []); // no deps — uses refs

  // ── Recipe refresh ──────────────────────────────────────────────────────────
  // Some GW2 recipes (e.g. Piece of Dragon Jade, source: "Automatic") never need to be
  // "learned" — they're usable the moment any qualifying discipline hits the required
  // rating. These never appear in /account/recipes, so refreshRecipes' diff-based
  // approach can never discover them. The only place that ever scanned for them was
  // the one-time no-cache initial load. Once recipes are cached (i.e. every launch
  // after the very first), that scan never runs again — if a discipline crosses the
  // qualifying threshold afterward, the recipe is permanently invisible with no
  // self-healing path. This is a manual, user-triggered re-scan (Settings button)
  // rather than something run automatically on a timer, since it requires fetching
  // and checking the full public recipe list — expensive to do silently every few hours.
  const [rescanningRecipes, setRescanningRecipes] = useState(false);
  const rescanAutoUnlockedRecipes = useCallback(async () => {
    if (!cacheRef.current.itemMap || rescanningRecipes) return;
    setRescanningRecipes(true);
    try {
      const { itemMap, priceMap, ownedMap, resolvedRecipes, recipes, disciplineLevels, knownRecipeIds } = cacheRef.current;
      const existingIds = new Set(recipes.map(r => r.id));
      const knownSet = new Set(knownRecipeIds || []);
      const allRecipeIds = await publicFetch(`${BASE}/recipes`);
      const candidateIds = allRecipeIds.filter(id => !existingIds.has(id) && !knownSet.has(id));
      const candidateDetails = [];
      for (const ch of chunk(candidateIds, 200)) {
        try {
          const batch = await publicFetch(`${BASE}/recipes?ids=${ch.join(",")}`);
          candidateDetails.push(...(Array.isArray(batch) ? batch : []));
        } catch {}
      }
      const newlyEligible = candidateDetails.filter(r => {
        if (!r.disciplines?.length) return false;
        if ((r.flags || []).includes("LearnedFromItem")) return false;
        return r.disciplines.some(d => (disciplineLevels[d] || 0) >= (r.min_rating || 0));
      });

      // Opportunistic seed for the Unlearned Recipes tab: this scan already fetched full
      // details for essentially every non-owned recipe — everything that DIDN'T qualify
      // as newly-eligible above is exactly the "locked" set that tab wants, so merge it
      // into that cache instead of discarding it (per project design — avoids a second,
      // separately-expensive full-catalog fetch just for that tab).
      (async () => {
        try {
          const newlyEligibleIds = new Set(newlyEligible.map(r => r.id));
          const stillLocked = candidateDetails.filter(r => !newlyEligibleIds.has(r.id));
          const [idsEntry, detailsEntry] = await cacheGetBulk(["allGameRecipeIds", "allGameRecipes"]);
          const mergedIds = [...new Set([...(idsEntry?.value || []), ...allRecipeIds])];
          const mergedDetails = dedupeRecipesById([...(detailsEntry?.value || []), ...stillLocked])
            .filter(r => !newlyEligibleIds.has(r.id));
          // Resolve item names/icons/prices for this seed too — this scan can merge
          // thousands of never-before-seen recipe IDs straight into the persisted
          // allGameRecipes cache. Without this, most of the catalog would show as
          // unnamed "Item {id}" placeholders with 0 sell price indefinitely: the
          // weekly refreshUnlearnedRecipesCatalog job only re-fetches item data for
          // IDs belonging to genuinely-NEW recipes, so once an unresolved recipe is
          // written here, nothing else ever revisits it. See resolveLockedCatalogCoverage.
          const { itemMap, priceMap } = cacheRef.current;
          const coverage = await resolveLockedCatalogCoverage(mergedDetails, itemMap, priceMap);
          if (coverage.requestedItemIds > 0) {
            console.log(`[UnlearnedRecipes] rescan seed resolved ${coverage.resolvedItems}/${coverage.requestedItemIds} item names`);
          }
          cacheRef.current.itemMap = itemMap;
          cacheRef.current.priceMap = priceMap;
          cacheRef.current.lockedRecipes = mergedDetails;
          await Promise.all([
            cacheSet("allGameRecipeIds", mergedIds),
            cacheSet("allGameRecipes", mergedDetails),
          ]);
          if (coverage.resolvedItems > 0) persistItemMapCache(itemMap);
          setUnlearnedRecipeCount(mergedDetails.length);
          setData(prev => prev ? { ...prev, itemMap: { ...prev.itemMap, ...itemMap }, priceMap: { ...prev.priceMap, ...priceMap } } : prev);
          computeAndSetLockedCraftItems(mergedDetails);
        } catch (e) { console.warn("[UnlearnedRecipes] seed from rescan failed:", e.message); }
      })();

      if (newlyEligible.length === 0) {
        setToast("✦ Rescan complete — no new auto-unlocked recipes found");
        setTimeout(() => setToast(null), 5000);
        return;
      }
      const allRecipes = dedupeRecipesById([...recipes, ...newlyEligible]);
      newlyEligible.forEach(r => { resolvedRecipes[r.output_item_id] = r; });
      const newItemIds = [...new Set([...newlyEligible.map(r => r.output_item_id), ...newlyEligible.flatMap(r => r.ingredients.map(i => i.item_id))])].filter(id => !itemMap[id]);
      if (newItemIds.length) {
        const ni = await fetchIds("/items", newItemIds);
        ni.forEach(i => { itemMap[i.id] = i; });
        const np = await fetchPrices(filterTradeable(newItemIds, itemMap));
        Object.assign(priceMap, np);
      }
      cacheRef.current = { ...cacheRef.current, itemMap, priceMap, resolvedRecipes, recipes: allRecipes, ownedMap };
      cacheSet("allRecipes", allRecipes);
      const craftItems = buildCraftItems(allRecipes, resolvedRecipes, itemMap, priceMap, ownedMap);
      const byDisc = {};
      const _byDiscSeen = {};
      craftItems.forEach(ci => getRecipeDisciplines(ci).forEach(d => {
        if (!byDisc[d]) { byDisc[d] = []; _byDiscSeen[d] = new Set(); }
        if (!_byDiscSeen[d].has(ci.recipeId)) { _byDiscSeen[d].add(ci.recipeId); byDisc[d].push(ci); }
      }));
      setData(prev => ({ ...prev, craftItems, byDisc, itemMap, priceMap }));
      setToast(`✦ ${newlyEligible.length} new auto-unlocked recipe${newlyEligible.length > 1 ? "s" : ""} found!`);
      setTimeout(() => setToast(null), 5000);
    } catch (e) {
      setToast(`✕ Rescan failed: ${e.message}`);
      setTimeout(() => setToast(null), 5000);
    } finally {
      setRescanningRecipes(false);
    }
  }, [rescanningRecipes]);

  const refreshRecipes = useCallback(async () => {
    if (!cacheRef.current.itemMap) return;
    try {
      const { itemMap, priceMap, ownedMap, knownRecipeIds: oldIds, resolvedRecipes, recipes, disciplineLevels } = cacheRef.current;
      const newIds = await apiFetch(`${BASE}/account/recipes`);
      const added = newIds.filter(id => !oldIds.includes(id));
      cacheRef.current.knownRecipeIds = newIds;
      const recipeNow = Date.now();
      setLastRecipe(recipeNow); setNextRecipeIn(RECIPE_REFRESH_MS);
      cacheSet("lastRecipeRefresh", recipeNow);
      if (!added.length) return;
      const newRecipes = await fetchIds("/recipes", added);
      const allRecipes = dedupeRecipesById([...recipes, ...newRecipes]);
      newRecipes.forEach(r => { resolvedRecipes[r.output_item_id] = r; });
      const newItemIds = [...new Set([...newRecipes.map(r => r.output_item_id), ...newRecipes.flatMap(r => r.ingredients.map(i => i.item_id))])].filter(id => !itemMap[id]);
      if (newItemIds.length) {
        const ni = await fetchIds("/items", newItemIds);
        ni.forEach(i => { itemMap[i.id] = i; });
        const np = await fetchPrices(filterTradeable(newItemIds, itemMap));
        Object.assign(priceMap, np);
      }
      cacheRef.current = { ...cacheRef.current, itemMap, priceMap, resolvedRecipes, recipes: allRecipes, ownedMap };
      // Update per-char inventory in data too
      const craftItems = buildCraftItems(allRecipes, resolvedRecipes, itemMap, priceMap, ownedMap);
      const byDisc = {};
      const _byDiscSeen = {};
      craftItems.forEach(ci => getRecipeDisciplines(ci).forEach(d => {
        if (!byDisc[d]) { byDisc[d] = []; _byDiscSeen[d] = new Set(); }
        if (!_byDiscSeen[d].has(ci.recipeId)) { _byDiscSeen[d].add(ci.recipeId); byDisc[d].push(ci); }
      }));
      setData(prev => ({ ...prev, craftItems, byDisc, itemMap, priceMap }));
      setToast(`✦ ${added.length} new recipe${added.length > 1 ? "s" : ""} discovered!`);
      setTimeout(() => setToast(null), 5000);
    } catch {}
  }, []);

  // ── Unlearned Recipes tab ────────────────────────────────────────────────────
  // Ranks every recipe you DON'T currently know (recipe not in /account/recipes and
  // not auto-unlocked) by the same craftAdvantage × sellFillsPerHr formula as ⭐
  // Recommended, so you can see what would be worth learning/farming. "Recipe known"
  // and "materials owned" are independent axes here — buildCraftItems' canCraft still
  // reflects materials only, so the UI badges recipe-lock state separately.
  const computeAndSetLockedCraftItems = useCallback(async (lockedRecipesArr) => {
    const { itemMap, priceMap, ownedMap, resolvedRecipes } = cacheRef.current;
    if (!itemMap || !priceMap || !ownedMap || !lockedRecipesArr?.length) { setLockedCraftItems([]); return; }
    // Merge a locked-recipe output→recipe map into the resolved set so ingredient trees
    // can walk through OTHER locked recipes too, not just already-owned ones. Owned
    // recipes win on collision (matches existing resolvedRecipes precedent elsewhere).
    const lockedResolved = {};
    lockedRecipesArr.forEach(r => { if (!lockedResolved[r.output_item_id]) lockedResolved[r.output_item_id] = r; });
    const mergedResolved = { ...lockedResolved, ...resolvedRecipes };
    const result = await computeLockedCraftItems(lockedRecipesArr, mergedResolved, itemMap, priceMap, ownedMap);
    if (!result) { setLockedCraftItems([]); return; }
    // Enrich with discipline min-rating + raw flags for display — buildCraftItems doesn't
    // carry these (owned crafting never needed them), so stitch them on here by recipeId.
    const metaById = {};
    lockedRecipesArr.forEach(r => { metaById[r.id] = { minRating: r.min_rating || 0, flags: r.flags || [] }; });
    const enriched = result.craftItems.map(ci => ({ ...ci, ...(metaById[ci.recipeId] || {}) }));
    setLockedCraftItems(enriched);
  }, []);

  // ── Friend discipline-eligible matching ──────────────────────────────────────
  // Mirrors the account owner's own `autoUnlocked` heuristic (fullLoad /
  // rescanAutoUnlockedRecipes), but computed per-friend against that friend's
  // crafting discipline levels instead of the owner's. A recipe qualifies for a
  // friend here if: it has at least one discipline, it isn't LearnedFromItem
  // (those need a consumable recipe sheet — a rating alone never grants them),
  // and the friend's rating in at least one of those disciplines meets the
  // recipe's min_rating — regardless of whether that friend's own
  // /account/recipes actually lists it as formally known/discovered. This is
  // the same "known ∪ auto-learned ∪ discoverable-now" three-way union the
  // owner's own Crafting Profits/Recommended tabs already get, just re-run
  // against friendDisciplineLevels. Requires the friend's key to include the
  // "Characters" permission (see Settings → Friend Crafters).
  const friendDisciplineEligibleMap = useMemo(() => {
    const map = {};
    const friendIds = Object.keys(friendDisciplineLevels);
    if (friendIds.length === 0) return map;
    const rawRecipes = [
      ...(cacheRef.current.recipes || []),
      ...(cacheRef.current.lockedRecipes || []),
    ];
    const seenIds = new Set();
    for (const r of rawRecipes) {
      if (seenIds.has(r.id)) continue;
      seenIds.add(r.id);
      if (!r.disciplines?.length) continue;
      if ((r.flags || []).includes("LearnedFromItem")) continue;
      for (const fid of friendIds) {
        const levels = friendDisciplineLevels[fid];
        const qualifies = r.disciplines.some(d => (levels[d] || 0) >= (r.min_rating || 0));
        if (!qualifies) continue;
        const friend = friends.find(f => f.id === fid);
        if (!friend) continue;
        if (!map[r.id]) map[r.id] = [];
        map[r.id].push({ friendId: fid, friendName: friend.name, viaDiscipline: true });
      }
    }
    return map;
  }, [friendDisciplineLevels, friends, data, unlearnedRecipeCount, lockedCraftItems]);

  // Union of genuinely-known-by-friend (friendRecipeMap) and discipline-eligible-
  // for-friend (friendDisciplineEligibleMap) badges per recipe. Genuine knowledge
  // wins when both apply for the same friend, since it's the stronger claim —
  // viaDiscipline is only kept when that friend has no genuine match.
  const combinedFriendRecipeMap = useMemo(() => {
    const map = {};
    const allIds = new Set([
      ...Object.keys(friendRecipeMap),
      ...Object.keys(friendDisciplineEligibleMap),
    ]);
    for (const ridStr of allIds) {
      const rid = Number(ridStr);
      const byFriend = {};
      for (const b of (friendRecipeMap[rid] || [])) byFriend[b.friendId] = { ...b, viaDiscipline: false };
      for (const b of (friendDisciplineEligibleMap[rid] || [])) if (!byFriend[b.friendId]) byFriend[b.friendId] = b;
      map[rid] = Object.values(byFriend);
    }
    return map;
  }, [friendRecipeMap, friendDisciplineEligibleMap]);

  // ── Friend Recipe Lookup: friend-only craft candidates ──────────────────────
  // Recipes the user does NOT know, but at least one added friend either
  // genuinely knows OR is discipline-eligible for. Reuses the exact
  // lockedCraftItems pipeline above (full-catalog recipe details × the user's
  // own materials/prices) rather than any friend-side data, so
  // craftAdvantage/canCraft/sellFillsPerHr scoring is identical to the user's
  // own recipes and always reflects the LOCAL user's inventory only — the
  // "still only show your materials" requirement falls out of this for free,
  // since lockedCraftItems was already built against cacheRef.current.ownedMap.
  const friendOnlyCraftItems = useMemo(() => {
    if (!lockedCraftItems.length || Object.keys(combinedFriendRecipeMap).length === 0) return [];
    return lockedCraftItems
      .filter(ci => combinedFriendRecipeMap[ci.recipeId]?.length)
      .map(ci => ({ ...ci, friendBadges: combinedFriendRecipeMap[ci.recipeId], isFriendOnly: true }));
  }, [lockedCraftItems, combinedFriendRecipeMap]);

  // Discovery-eligible recipes that already show as a normal "known" card in Crafting Profits
  // purely because the discipline rating is met (see the autoUnlocked heuristic in fullLoad),
  // but were never actually discovered — i.e. not present in the account's real
  // /account/recipes list. When a friend genuinely knows one of these, this does NOT create a
  // new card (the recipe already has one, unmodified, in data.byDisc) — it maps recipeId ->
  // friend badges so CraftingTab/RecommendedTab can attach a badge onto the EXISTING card
  // instead of adding a duplicate. Deliberately does not touch lockedCraftItems or the
  // Unlearned Recipes catalog at all — these recipes must keep NOT appearing there, per design.
  const friendKnownEligibleBadges = useMemo(() => {
    const map = {};
    if (!data?.byDisc || Object.keys(combinedFriendRecipeMap).length === 0) return map;
    const trulyKnownIds = new Set(cacheRef.current.knownRecipeIds || []);
    const seen = new Set();
    for (const disc of Object.keys(data.byDisc)) {
      for (const ci of (data.byDisc[disc] || [])) {
        if (seen.has(ci.recipeId) || trulyKnownIds.has(ci.recipeId)) continue;
        const badges = combinedFriendRecipeMap[ci.recipeId];
        if (!badges?.length) continue;
        seen.add(ci.recipeId);
        map[ci.recipeId] = badges;
      }
    }
    return map;
  }, [data, combinedFriendRecipeMap]);

  // ── Friend key management ────────────────────────────────────────────────────
  const handleAddFriend = useCallback(async () => {
    const name = friendNameInput.trim();
    const key = friendKeyInput.trim();
    if (!name || !key) { setFriendActionMsg({ ok: false, text: "Name and API key are both required." }); return; }
    setFriendBusy(true); setFriendActionMsg(null);
    try {
      const summary = await addFriendKey(name, key);
      setFriends(prev => [...prev, summary]);
      const [entries, discEntries] = await Promise.all([getFriendRecipesKnown(), getFriendDisciplineLevels()]);
      setFriendRecipeMap(buildFriendRecipeMap(entries));
      setFriendDisciplineLevels(buildFriendDisciplineMap(discEntries));
      setFriendNameInput(""); setFriendKeyInput("");
      setFriendActionMsg({ ok: true, text: `✓ Added ${summary.name} — ${summary.recipe_count} recipes known.` });
    } catch (e) {
      setFriendActionMsg({ ok: false, text: String(e) });
    } finally {
      setFriendBusy(false);
    }
  }, [friendNameInput, friendKeyInput]);

  const handleRefreshFriend = useCallback(async (id) => {
    setFriendBusy(true); setFriendActionMsg(null);
    try {
      const summary = await refreshFriendKey(id);
      setFriends(prev => prev.map(f => f.id === id ? summary : f));
      const [entries, discEntries] = await Promise.all([getFriendRecipesKnown(), getFriendDisciplineLevels()]);
      setFriendRecipeMap(buildFriendRecipeMap(entries));
      setFriendDisciplineLevels(buildFriendDisciplineMap(discEntries));
      setFriendActionMsg({ ok: true, text: `✓ Refreshed ${summary.name} — ${summary.recipe_count} recipes known.` });
    } catch (e) {
      // Keep showing last-known recipes — just flag the failure (matches backend,
      // which also preserves friend_recipes_known on a failed refresh).
      setFriends(prev => prev.map(f => f.id === id ? { ...f, last_refresh_ok: false } : f));
      setFriendActionMsg({ ok: false, text: String(e) });
    } finally {
      setFriendBusy(false);
    }
  }, []);

  const handleDeleteFriend = useCallback(async (id) => {
    setFriendBusy(true);
    try {
      await deleteFriendKey(id);
      setFriends(prev => prev.filter(f => f.id !== id));
      setFriendRecipeMap(prev => {
        const next = {};
        for (const [rid, badges] of Object.entries(prev)) {
          const filtered = badges.filter(b => b.friendId !== id);
          if (filtered.length) next[rid] = filtered;
        }
        return next;
      });
      setFriendFilter(prev => {
        const { [id]: _removed, ...rest } = prev.byFriend;
        return { ...prev, byFriend: rest };
      });
      setFriendDisciplineLevels(prev => {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      });
      setShowDeleteFriendConfirm(null);
    } catch (e) {
      setFriendActionMsg({ ok: false, text: String(e) });
    } finally {
      setFriendBusy(false);
    }
  }, []);

  const refreshUnlearnedRecipesCatalog = useCallback(async () => {
    if (!cacheRef.current.itemMap) return;
    setUnlearnedLoading(true);
    try {
      const { recipes, knownRecipeIds } = cacheRef.current;
      const knownIds = new Set([...(recipes || []).map(r => r.id), ...(knownRecipeIds || [])]);
      const freshIdList = await publicFetch(`${BASE}/recipes`);
      const [idsEntry, detailsEntry] = await cacheGetBulk(["allGameRecipeIds", "allGameRecipes"]);
      const cachedIds = new Set(idsEntry?.value || []);
      const cachedDetails = detailsEntry?.value || [];
      // Incremental diff (per project decision): only fetch details for IDs that are
      // genuinely new since the last cached ID list AND not already known — GW2 patches
      // add recipes in batches, so after the first (expensive) run this is normally just
      // the 1 cheap ID-list request plus at most a couple of detail chunks.
      const newIds = freshIdList.filter(id => !cachedIds.has(id) && !knownIds.has(id));
      let newDetails = [];
      for (const ch of chunk(newIds, 200)) {
        try {
          const batch = await publicFetch(`${BASE}/recipes?ids=${ch.join(",")}`);
          newDetails.push(...(Array.isArray(batch) ? batch : []));
        } catch {}
      }
      // Merge with previously-cached details, then drop anything that has since become
      // known (discipline leveled up, item learned, etc.) — those live in the normal
      // owned-recipe list now, not here.
      const merged = dedupeRecipesById([...cachedDetails, ...newDetails]).filter(r => !knownIds.has(r.id));

      // Expand item/price coverage to the locked catalog's ingredients+outputs — most
      // won't be in itemMap/priceMap yet since they were never relevant before this tab.
      const { itemMap, priceMap } = cacheRef.current;
      const coverage = await resolveLockedCatalogCoverage(merged, itemMap, priceMap);
      if (coverage.requestedItemIds > 0) {
        console.log(`[UnlearnedRecipes] resolved ${coverage.resolvedItems}/${coverage.requestedItemIds} item names`);
      }

      cacheRef.current.itemMap = itemMap;
      cacheRef.current.priceMap = priceMap;
      cacheRef.current.lockedRecipes = merged;
      const now = Date.now();
      await Promise.all([
        cacheSet("allGameRecipeIds", freshIdList),
        cacheSet("allGameRecipes", merged),
        cacheSet("lastUnlearnedRefresh", now),
      ]);
      if (coverage.resolvedItems > 0) persistItemMapCache(itemMap);
      setUnlearnedRecipeCount(merged.length);
      setData(prev => prev ? { ...prev, itemMap: { ...prev.itemMap, ...itemMap }, priceMap: { ...prev.priceMap, ...priceMap } } : prev);
      await computeAndSetLockedCraftItems(merged);
    } catch (e) {
      console.warn("[UnlearnedRecipes] catalog refresh failed:", e.message);
    } finally {
      setUnlearnedLoading(false);
    }
  }, [computeAndSetLockedCraftItems]);

  // ── Timers — no data in deps to avoid infinite refresh loop ─────────────────
  const dataReadyRef = useRef(false);
  useEffect(() => { if (data) dataReadyRef.current = true; }, [data]);

  useEffect(() => {
    if (loadState.phase !== "done") return;
    let priceInterval;
    const waitForData = setInterval(() => {
      if (!dataReadyRef.current) return;
      clearInterval(waitForData);
      refreshPrices();
      priceInterval = setInterval(refreshPrices, PRICE_REFRESH_MS);
    }, 100);
    return () => { clearInterval(waitForData); clearInterval(priceInterval); };
  }, [loadState.phase]);

  useEffect(() => {
    if (loadState.phase !== "done") return;
    let recipeInterval;
    const waitForData = setInterval(() => {
      if (!dataReadyRef.current) return;
      clearInterval(waitForData);
      recipeInterval = setInterval(refreshRecipes, RECIPE_REFRESH_MS);
    }, 100);
    return () => { clearInterval(waitForData); clearInterval(recipeInterval); };
  }, [loadState.phase]);

  useEffect(() => {
    if (loadState.phase !== "done") return;
    let unlearnedInterval;
    const waitForData = setInterval(() => {
      if (!dataReadyRef.current) return;
      clearInterval(waitForData);
      (async () => {
        // Fast path: show whatever the last session cached immediately, so the tab
        // isn't empty while the (possibly slow, first-run-only) catalog diff runs.
        const [idsEntry, detailsEntry, lastRunEntry] = await cacheGetBulk(["allGameRecipeIds", "allGameRecipes", "lastUnlearnedRefresh"]);
        if (detailsEntry?.value?.length) {
          cacheRef.current.lockedRecipes = detailsEntry.value;
          setUnlearnedRecipeCount(detailsEntry.value.length);
          computeAndSetLockedCraftItems(detailsEntry.value);
        }
        // Bootstrap or catch-up: run now if we've never cached a catalog, or it's been
        // a week or more since the last successful diff (e.g. app wasn't opened for a while).
        const lastRun = lastRunEntry?.value || 0;
        const stale = !idsEntry?.value || (Date.now() - lastRun) >= UNLEARNED_REFRESH_MS;
        if (stale) {
          refreshUnlearnedRecipesCatalog();
        } else if (detailsEntry?.value?.length) {
          // Self-heal for a cache that's stuck with unresolved item names — the weekly
          // diff above only re-fetches item data for IDs belonging to genuinely-NEW
          // recipes, so a catalog seeded before item resolution was added (or by a
          // rescan-button run that skipped it) would otherwise show "Item {id}"
          // placeholders indefinitely, never touched again until it ages past
          // UNLEARNED_REFRESH_MS. Cheap check every launch (no network unless it finds
          // something unresolved): count cached recipes whose output item still isn't
          // in itemMap, and if any are found, run a lightweight top-up — item/price
          // resolution only, no recipe-ID fetch/diff — instead of a full catalog rescan.
          const unresolvedCount = detailsEntry.value.filter(r => !cacheRef.current.itemMap?.[r.output_item_id]).length;
          if (unresolvedCount > 0) {
            (async () => {
              const { itemMap: im, priceMap: pm } = cacheRef.current;
              const coverage = await resolveLockedCatalogCoverage(detailsEntry.value, im, pm);
              if (coverage.resolvedItems > 0) {
                console.log(`[UnlearnedRecipes] self-heal resolved ${coverage.resolvedItems}/${coverage.requestedItemIds} previously-unnamed items`);
                cacheRef.current.itemMap = im;
                cacheRef.current.priceMap = pm;
                persistItemMapCache(im);
                setData(prev => prev ? { ...prev, itemMap: { ...prev.itemMap, ...im }, priceMap: { ...prev.priceMap, ...pm } } : prev);
                computeAndSetLockedCraftItems(detailsEntry.value);
              }
            })();
          }
        }
      })();
      unlearnedInterval = setInterval(refreshUnlearnedRecipesCatalog, UNLEARNED_REFRESH_MS);
    }, 100);
    return () => { clearInterval(waitForData); clearInterval(unlearnedInterval); };
  }, [loadState.phase]);

  // Once-daily background refresh of every added friend's known-recipe list.
  // Manual refresh (🔄 in Settings) is also always available — this just catches
  // friends up automatically without the user needing to remember to click it.
  useEffect(() => {
    if (loadState.phase !== "done") return;
    let friendInterval;
    const runFriendRefresh = async () => {
      const list = await getFriends().catch(() => []);
      for (const f of list) {
        await refreshFriendKey(f.id).catch(() => {}); // per-friend failure shouldn't block the others
      }
      const [refreshed, entries, discEntries] = await Promise.all([
        getFriends().catch(() => list),
        getFriendRecipesKnown().catch(() => []),
        getFriendDisciplineLevels().catch(() => []),
      ]);
      setFriends(refreshed);
      setFriendRecipeMap(buildFriendRecipeMap(entries));
      setFriendDisciplineLevels(buildFriendDisciplineMap(discEntries));
      cacheSet("lastFriendRefresh", Date.now());
    };
    const waitForData = setInterval(() => {
      if (!dataReadyRef.current) return;
      clearInterval(waitForData);
      (async () => {
        const lastRunEntry = await cacheGet("lastFriendRefresh").catch(() => null);
        const lastRun = lastRunEntry?.value || 0;
        const stale = (Date.now() - lastRun) >= FRIEND_REFRESH_MS;
        if (stale) runFriendRefresh();
      })();
      friendInterval = setInterval(runFriendRefresh, FRIEND_REFRESH_MS);
    }, 100);
    return () => { clearInterval(waitForData); clearInterval(friendInterval); };
  }, [loadState.phase]);

  useEffect(() => {
    if (!lastPrice) return;
    const t = setInterval(() => {
      const el = Date.now() - lastPrice;
      setNextPriceIn(Math.max(0, PRICE_REFRESH_MS - el));
      setSecsAgo(Math.floor(el / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [lastPrice]);

  useEffect(() => {
    if (!lastRecipe) return;
    const t = setInterval(() => {
      setNextRecipeIn(Math.max(0, RECIPE_REFRESH_MS - (Date.now() - lastRecipe)));
    }, 1000);
    return () => clearInterval(t);
  }, [lastRecipe]);

  // Persist rarity filter changes — skipped until the initial cached value has loaded,
  // so we never overwrite a saved filter with the default before it's read.
  useEffect(() => {
    if (!rarityFilterLoadedRef.current) return;
    cacheSet("rarityFilter", rarityFilter);
  }, [rarityFilter]);

  // Persist friend filter changes (master toggle + per-friend selection)
  useEffect(() => {
    cacheSet("friendFilter", friendFilter);
  }, [friendFilter]);

  // ── Toast auto-dismiss ────────────────────────────────────────────────────────
  // Every setToast() call site is expected to pair with its own setTimeout clear,
  // but that's easy to forget (e.g. handleCheckForUpdates' "up to date" message
  // used to never clear). Centralizing the dismiss here means every toast — current
  // and future — always disappears on its own, on top of the manual X button.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Gem Price (commerce exchange) ────────────────────────────────────────────
  // Public/unauthenticated endpoint — no API key needed, safe to poll on the same
  // cadence as TP prices. coins_per_gem is stable across quantity, so we sample at
  // a representative 400g and extrapolate ×400 rather than trying to solve for the
  // exact coin amount that yields exactly 400 gems.
  //
  // cache: "no-store" is required here — quantity is a fixed constant, so this is
  // the same URL on every single poll. Without it, the webview's HTTP cache was
  // silently serving a stale response instead of hitting the network, so the card
  // only ever changed whenever the browser cache entry happened to expire rather
  // than on our 60s cadence. Bypassed via raw fetch rather than publicFetch so the
  // shared helper (used for items/recipes, where caching is fine) is untouched.
  useEffect(() => { gemAlertThresholdGoldRef.current = gemAlertThresholdGold; }, [gemAlertThresholdGold]);

  const fetchGemPrice = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/commerce/exchange/coins?quantity=${GEM_QUANTITY_COPPER}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      const coinsPerGem = json.coins_per_gem;
      const costFor400 = Math.round(coinsPerGem * 400);
      const entry = { coinsPerGem, costFor400, ts: Date.now() };
      setGemPrice(entry);
      cacheSet("lastGemPrice", entry);

      const threshold = gemAlertThresholdGoldRef.current;
      if (threshold > 0) {
        const thresholdCopper = threshold * 10000;
        if (costFor400 <= thresholdCopper) {
          if (!gemAlertFiredRef.current) {
            gemAlertFiredRef.current = true;
            const g = Math.floor(costFor400 / 10000), s = Math.floor((costFor400 % 10000) / 100);
            setToast(`💎 Gems are cheap — ${g}g ${s}s for 400`);
          }
        } else {
          gemAlertFiredRef.current = false; // reset so it can fire again next time it dips
        }
      }
    } catch (e) { console.warn("[GemPrice] fetch failed:", e.message); }
  }, []); // stable — matches refreshPrices/refreshRecipes, which also never change identity

  useEffect(() => {
    if (loadState.phase !== "done") return;
    let gemInterval;
    const waitForData = setInterval(() => {
      if (!dataReadyRef.current) return;
      clearInterval(waitForData);
      fetchGemPrice();
      gemInterval = setInterval(fetchGemPrice, PRICE_REFRESH_MS);
    }, 100);
    return () => { clearInterval(waitForData); clearInterval(gemInterval); };
  }, [loadState.phase]);

  // ── Update check + changelog ─────────────────────────────────────────────────
  const [appVersion, setAppVersion] = useState(null);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateChecking, setUpdateChecking] = useState(false);
  const [updateInstalling, setUpdateInstalling] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [showChangelog, setShowChangelog] = useState(false);
  const [changelog, setChangelog] = useState([]);
  const [changelogLoading, setChangelogLoading] = useState(false);

  useEffect(() => {
    getCurrentVersion().then(setAppVersion);

    const runUpdateCheck = () => {
      checkForUpdate().then(setUpdateInfo).catch(() => {}); // silent — no toast if it fails or none found
    };

    runUpdateCheck(); // initial check on launch, same as before
    const updateInterval = setInterval(runUpdateCheck, UPDATE_CHECK_MS);
    return () => clearInterval(updateInterval);
  }, []);

  const handleCheckForUpdates = async () => {
    setUpdateChecking(true); setUpdateError(null);
    try {
      const info = await checkForUpdate();
      setUpdateInfo(info);
      if (!info) setToast("✓ You're up to date");
    } catch (e) {
      setUpdateError(String(e));
    } finally {
      setUpdateChecking(false);
    }
  };

  const handleInstallUpdate = async () => {
    if (!updateInfo) return;
    setUpdateInstalling(true); setUpdateError(null);
    try {
      await updateInfo.install(); // downloads, verifies signature, relaunches — app exits here on success
    } catch (e) {
      setUpdateError(String(e));
      setUpdateInstalling(false);
    }
  };

  const handleOpenChangelog = async () => {
    setShowChangelog(v => !v);
    if (!showChangelog && changelog.length === 0) {
      setChangelogLoading(true);
      try { setChangelog(await getChangelog()); }
      catch (e) { setToast(`✕ Changelog failed: ${e.message}`); }
      finally { setChangelogLoading(false); }
    }
  };

  // ── History ─────────────────────────────────────────────────────────────────
  // Tick every 60s to refresh open charts with new collector data
  // Fetch item data for daily/timegated items that aren't on the TP (no icon in itemMap)
  // Also fetches icons for legendary components (account-bound, never in priceMap/itemMap)
  useEffect(() => {
    if (!data?.itemMap) return;
    const LEGENDARY_ITEM_IDS = [19626, 19674, 19673, 19672, 19678, 19677, 19676, 70801, 75299, 71123, 75744, 71655, 71787, 73236, 73196, 76530, 70867, 19621, 19622, 19623, 19624, 19631, 19632, 19639, 19638, 19627, 19630, 19656, 19659, 19664, 19665, 19667, 19669, 19670, 19648, 19647, 19645, 29185, 29169, 29178, 29181, 29170, 29173, 29172, 29175, 29176, 29177, 29166, 29184, 29180, 29182, 29183, 29168, 88567, 88933, 73239, 86036, 74927, 76427, 70797, 74300, 77086, 79419, 79839, 72083, 90893, 89445, 85744, 71383, 72713, 76158, 78556, 79802, 79562, 81957, 86098, 87109, 90551, 89854, 81908, 81729, 81796, 81861, 71820, 46743, 46742, 82008, 70528, 71581, 73137, 71994, 73248, 70820, 20797, 46683, 81815, 82036, 79280, 80332, 81706, 81127, 79899, 79469, 91604, 91520, 91407, 91607, 91559, 91584, 91594, 91443, 91509, 91420, 91488, 91382, 19687, 19682, 19686, 19684,
    // Mystic Forge vendor items + unnamed flip market items
    20796, 20799, 97983, 71581,
    // The Legend / Bifrost precursor chain items (June 2026)
    77190, 71932, 73748, 72261, 71677, 75535, 73431, 77139, 75316, 73517, 74094, 75752,
    74378, 76891, 76027, 73809, 73875, 74301, 24572,
    // Resolved null IDs (June 2026): Spiritwood Plank, Pile of Bloodstone Dust, Master Maintenance Oil, Sculptor's Tools
    46736, 46731, 9461, 74909,
    // Sigil of Strength (Sunrise) — corrected from Sigil of Air
    24548,
    // Bolt/Zap precursor chain (June 2026)
    74093, 75769, 76117, 73013, 71679, 73912,  // Tier 1: Zap Experiment + components
    77118, 73473, 75891, 73841, 76269,          // Tier 2: Perfected Sword + components
    76380, 71585, 72724, 70735,                 // Tier 3: Zap components
    // Materials used in Zap chain
    76491, 71641, 43772, 46738, 12988, 46739, 46747,
    // Kraitkin/Venom (June 2026)
    30701,   // Kraitkin item ID
    19666,
    // Bolt item ID (missed when Zap chain was added)
    30699,
    // Venom precursor chain (Kraitkin) — wiki verified June 2026
    // Tier 1: Kraitkin I: The Experimental Trident
    75599, 75043, 73441, 76017, 74061, 73440, 72629,
    // Tier 2: Kraitkin II: The Perfected Trident
    71788, 70757, 71720, 74291, 74468, 76376,
    // Tier 3: Kraitkin III: Venom
    74039, 75215, 75259, 72543, 74433,
    // Frostfang precursor chain (Tooth of Frostfang) — wiki verified June 2026
    // Tier 1: Frostfang I: The Experimental Axe
    73865, 73671, 76732, 76795, 70868, 70952,
    // Tier 2: Frostfang II: The Perfected Axe
    75415, 76051, 75534, 70679, 71910, 71915,
    // Tier 3: Frostfang III: Tooth of Frostfang
    72332, 75818, 73126, 76342, 75619,
    // Sub-ingredients: Snow Diamond, Lump of Beeswax, Brick of Clay
    86627, 71949, 66902,
    // Frostfang legendary item
    30684,
    // Spark precursor chain (Incinerator) — wiki verified June 2026
    // Tier 1: Incinerator I: The Experimental Dagger
    76613, 74544, 76927, 72017, 74031, 72827,
    // Tier 2: Incinerator II: The Perfected Dagger
    71429, 76460, 71203, 73353, 77156, 75064,
    // Tier 3: Incinerator III: Spark
    75957, 75504, 72368, 75825, 73736,
    // Watchwork Mechanism (Regulator Nozzle ingredient)
    49782,
    // Incinerator legendary item
    30687,
    // Energizer precursor chain (The Moot) — wiki verified June 2026
    // Tier 1: Moot I: The Experimental Mace
    74731, 72846, 71493, 70610, 72498, 75952,
    // Tier 2: Moot II: The Perfected Mace
    72028, 77018, 71723, 75704, 74020, 76735,
    // Tier 3: Moot III: The Energizer
    77116, 73375, 74984, 73774, 71486,
    // Gift of Entertainment ingredients
    20000,   // Box o' Fun
    // The Moot legendary item
    30692,
    // Chaos Gun precursor chain (Quip) — wiki verified June 2026
    // Tier 1: Chaos Gun Experiment + components
    73332, 70874, 75330, 75846,
    // Tier 2: Perfected Pistol + components
    70763, 70850, 73023,
    // Tier 3: Chaos Gun + components
    73396, 71163, 75429, 76094, 73993, 75272,
    // Chaos Gun (precursor) item ID
    29174,
    // Storm precursor chain (Meteorlogicus) — wiki verified July 2026
    // Gift of Weather + Gift of Knowledge
    19637, 19671,
    // Tier 1: Storm Experiment + components
    75801, 70545, 70977, 74655,
    // Tier 2: Perfected Scepter + components
    73891, 72995, 71886,
    // Tier 3: Storm + components
    75336, 72454, 70884, 76229,
    // Storm (precursor) item ID + Meteorlogicus legendary item ID
    29176, 30695];
    const allDailyIds = [
      ...Object.values(MANUAL_DAILY_MAP).map(v => v.itemId),
      ...Object.values(DAILY_CRAFT_MAP).map(v => v.itemId),
      ...LEGENDARY_ITEM_IDS,
    ];
    const missing = [...new Set(allDailyIds)].filter(id => id && !data.itemMap[id]);
    if (missing.length === 0) return;
    // Fetch in chunks of 200
    const chunks = [];
    for (let i = 0; i < missing.length; i += 200) chunks.push(missing.slice(i, i + 200));
    Promise.all(chunks.map(chunk =>
      fetch(`https://api.guildwars2.com/v2/items?ids=${chunk.join(",")}`)
      .then(r => r.json()).catch(() => [])
    )).then(results => {
      const map = {};
      for (const batch of results) {
        if (!Array.isArray(batch)) continue;
        for (const item of batch) map[item.id] = { name: item.name, icon: item.icon };
      }
      setExtraDailyItems(map);
      // Also merge into cacheRef itemMap so legendary recipes can resolve icons
      if (Object.keys(map).length > 0) {
        cacheRef.current.itemMap = { ...cacheRef.current.itemMap, ...map };
        setData(prev => prev ? { ...prev, itemMap: { ...prev.itemMap, ...map } } : prev);
      }
    }).catch(() => {});
  }, [!!data?.itemMap]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  // ── Crafting tab ─────────────────────────────────────────────────────────────
  // Countdown to daily 4:00 PM reset
  const [resetCountdown, setResetCountdown] = useState("");
  useEffect(() => {
    if (!utcMidnightMs) return;
    const tick = () => {
      const ms = utcMidnightMs - Date.now();
      if (ms <= 0) { setResetCountdown("Resetting..."); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setResetCountdown(`${h}h ${m}m ${s}s`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [utcMidnightMs]);

  // ── Prop bundles for extracted tab components ────────────────────────────
  // Bundled (rather than a giant flat prop list on <CraftingTab>) and built via
  // useMemo with the SAME dependency lists RecommendedTab/UnlearnedRecipesTab
  // use internally, so CraftingTab only re-renders them when something they
  // actually care about changes — matching the original's memoization grain.
  const recommendedTabProps = useMemo(() => ({
    data, velocitySummary, trendSummary, showRecMaterials, showRecDaily,
    showRecDailyOutputs, showRecMissing, rarityFilter, expanded, setExpanded,
    dailyCrafted, myListings, mySoldHistory, craftingChartItem, setCraftingChartItem,
    friendOnlyCraftItems, friendFilter, friendKnownEligibleBadges, searchCraft,
    setActiveTab, cacheRef,
  }), [data, velocitySummary, trendSummary, showRecMaterials, showRecDaily, showRecDailyOutputs, showRecMissing, rarityFilter, expanded, dailyCrafted, myListings, mySoldHistory, craftingChartItem, friendOnlyCraftItems, friendFilter, friendKnownEligibleBadges, searchCraft]);

  const unlearnedTabProps = useMemo(() => ({
    data, lockedCraftItems, velocitySummary, hideZeroProfitUnlearned,
    setHideZeroProfitUnlearned, hideAutoLearnedUnlearned, setHideAutoLearnedUnlearned,
    rarityFilter, unlearnedRecipeCount, unlearnedLoading, expanded, setExpanded,
    craftingChartItem, setCraftingChartItem, searchCraft,
  }), [data, lockedCraftItems, velocitySummary, hideZeroProfitUnlearned, hideAutoLearnedUnlearned, rarityFilter, unlearnedRecipeCount, unlearnedLoading, expanded, craftingChartItem, searchCraft]);

  const materialsTabProps = useMemo(() => ({
    data, searchMat, setSearchMat, matPage, setMatPage, sortMat, setSortMat,
    priceAlerts, alertSort, setAlertSort, trendSummary, velocitySummary,
    historyItem, setHistoryItem, PAGE_SIZE,
  }), [data, searchMat, sortMat, historyItem, priceAlerts, trendSummary, matPage]);

  const craftingTabProps = useMemo(() => ({
    data, activeDisc, setActiveDisc, showRecMissing, setShowRecMissing,
    showRecMaterials, setShowRecMaterials, showRecDaily, setShowRecDaily,
    showRecDailyOutputs, setShowRecDailyOutputs, rarityFilter, setRarityFilter,
    searchCraft, setSearchCraft, expanded, setExpanded, dailyCrafted,
    manualDailyCrafted, resetCountdown, myListings, mySoldHistory,
    velocitySummary, trendSummary, craftingChartItem, setCraftingChartItem,
    craftPage, setCraftPage, unlearnedRecipeCount, unlearnedLoading,
    friendOnlyCraftItems, friendFilter, setFriendFilter, friends,
    friendKnownEligibleBadges, PAGE_SIZE, cacheRef, setActiveTab,
    recommendedTabProps, unlearnedTabProps,
  }), [data, activeDisc, showRecMissing, showRecMaterials, showRecDaily, showRecDailyOutputs, rarityFilter, searchCraft, expanded, dailyCrafted, manualDailyCrafted, resetCountdown, myListings, mySoldHistory, velocitySummary, trendSummary, craftingChartItem, craftPage, recommendedTabProps, unlearnedTabProps, unlearnedRecipeCount, unlearnedLoading, friendOnlyCraftItems, friendFilter, friends, friendKnownEligibleBadges]);

  const flipMarketTabProps = useMemo(() => ({
    data, flipSummary, velocitySummary, pendingFlips, setPendingFlips,
    flipHistory, setFlipHistory, craftingChartItem, setCraftingChartItem,
  }), [data, flipSummary, velocitySummary, pendingFlips, flipHistory, craftingChartItem]);

  const tradingPostTabProps = useMemo(() => ({
    data, tpSubTab, setTpSubTab, mySoldHistory, myListings, velocitySummary,
  }), [data, tpSubTab, mySoldHistory, myListings, velocitySummary]);

  const timeGatedTabProps = useMemo(() => ({
    data, cacheRef, dailyCrafted, manualDailyCrafted, mySoldHistory,
    resetCountdown, weeklyKeyDone, setWeeklyKeyDone, extraDailyItems,
  }), [data, dailyCrafted, manualDailyCrafted, mySoldHistory, resetCountdown, weeklyKeyDone, extraDailyItems]);


  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
    <div className="app">
    <div className="hdr">
    <h1>⚜ GW2 Wealth Tracker ⚜</h1>
    <p>Account Ledger & Crafting Profit Calculator</p>
    <div style={{ marginTop: 8, fontSize: 11, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 1, display: "flex", gap: 10, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
    {appVersion && (
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        v{appVersion}
        {updateInfo && (
          <span onClick={() => setShowSettings(true)} title={`v${updateInfo.version} available`}
            style={{ cursor: "pointer", color: "var(--gold2)", background: "rgba(200,150,42,.15)", border: "1px solid rgba(200,150,42,.4)", borderRadius: 3, padding: "1px 7px" }}>
            ⬆ Update available
          </span>
        )}
      </span>
    )}
    {dbStats && (
      <span title={dbStats.db_path}>💾 {Number(dbStats.size_mb).toFixed(2)}MB · {(dbStats.price_history_count || 0).toLocaleString()} price · {(dbStats.velocity_count || 0).toLocaleString()} velocity snapshots</span>
    )}
    <button onClick={() => setShowMigration(v => !v)}
    style={{ fontSize: 10, color: "var(--gold2)", background: "transparent", border: "1px solid var(--border)", borderRadius: 3, padding: "1px 8px", cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
    {showMigration ? "✕ Close" : "📥 Import / Export"}
    </button>
    <button onClick={() => { setResetType("market"); setShowResetConfirm(true); }}
    style={{ fontSize: 10, color: "var(--red2,#e05555)", background: "transparent", border: "1px solid var(--red2,#e05555)", borderRadius: 3, padding: "1px 8px", cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
    🗑 Reset Market DB
    </button>
    <button onClick={() => { setResetType("personal"); setShowResetConfirm(true); }}
    style={{ fontSize: 10, color: "var(--red2,#e05555)", background: "transparent", border: "1px solid var(--red2,#e05555)", borderRadius: 3, padding: "1px 8px", cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
    🗑 Reset Personal DB
    </button>
    <button onClick={() => setShowSettings(v => !v)}
    style={{ fontSize: 10, color: "var(--gold2)", background: "transparent", border: "1px solid var(--border)", borderRadius: 3, padding: "1px 8px", cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
    ⚙ Settings
    </button>
    </div>
    </div>

    {/* Reset Database confirmation dialog */}
    {showResetConfirm && (
      <ResetConfirmDialog
        resetType={resetType}
        setShowResetConfirm={setShowResetConfirm}
        setDbStats={setDbStats}
        setMigrationStatus={setMigrationStatus}
        setShowMigration={setShowMigration}
        settingsNasSsh={settingsNasSsh}
      />
    )}


    {/* Friend deletion confirmation */}
    {showDeleteFriendConfirm != null && (
      <DeleteFriendConfirmDialog
        showDeleteFriendConfirm={showDeleteFriendConfirm}
        setShowDeleteFriendConfirm={setShowDeleteFriendConfirm}
        friends={friends}
        friendBusy={friendBusy}
        handleDeleteFriend={handleDeleteFriend}
      />
    )}

    {/* Settings Panel */}
    {showSettings && (
      <SettingsPanel
        settingsApiKey={settingsApiKey} setSettingsApiKey={setSettingsApiKey}
        settingsNasSsh={settingsNasSsh} setSettingsNasSsh={setSettingsNasSsh}
        settingsAlertThreshold={settingsAlertThreshold} setSettingsAlertThreshold={setSettingsAlertThreshold}
        settingsGemAlertThresholdGold={settingsGemAlertThresholdGold} setSettingsGemAlertThresholdGold={setSettingsGemAlertThresholdGold}
        rescanningRecipes={rescanningRecipes} rescanAutoUnlockedRecipes={rescanAutoUnlockedRecipes}
        friends={friends} friendNameInput={friendNameInput} setFriendNameInput={setFriendNameInput}
        friendKeyInput={friendKeyInput} setFriendKeyInput={setFriendKeyInput}
        friendBusy={friendBusy} handleAddFriend={handleAddFriend} friendActionMsg={friendActionMsg}
        handleRefreshFriend={handleRefreshFriend} setShowDeleteFriendConfirm={setShowDeleteFriendConfirm}
        recipeLookupId={recipeLookupId} setRecipeLookupId={setRecipeLookupId} friendRecipeMap={friendRecipeMap}
        friendDisciplineEligibleMap={friendDisciplineEligibleMap} combinedFriendRecipeMap={combinedFriendRecipeMap}
        lockedCraftItems={lockedCraftItems} data={data} friendOnlyCraftItems={friendOnlyCraftItems}
        appVersion={appVersion} updateInfo={updateInfo} updateChecking={updateChecking}
        updateInstalling={updateInstalling} updateError={updateError}
        handleCheckForUpdates={handleCheckForUpdates} handleInstallUpdate={handleInstallUpdate}
        showChangelog={showChangelog} handleOpenChangelog={handleOpenChangelog}
        changelog={changelog} changelogLoading={changelogLoading}
        settingsMsg={settingsMsg} setSettingsMsg={setSettingsMsg}
        setAlertThreshold={setAlertThreshold} setGemAlertThresholdGold={setGemAlertThresholdGold}
        setApiKey={setApiKey}
      />
    )}
    {showMigration && (
      <ImportExportPanel
        migrationStatus={migrationStatus}
        setMigrationStatus={setMigrationStatus}
        setDbStats={setDbStats}
      />
    )}


    {loadState.phase === "refreshing" && (
      <div style={{ background: "rgba(200,150,42,0.08)", border: "1px solid rgba(200,150,42,0.25)", borderRadius: 6, padding: "8px 16px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--gold2)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "var(--gold2)", animation: "pulse 1.2s ease-in-out infinite" }} />
      UPDATING LIVE DATA — prices, inventory & daily crafts refreshing in background...
      </div>
    )}
    {noApiKey && (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16, padding: 32 }}>
      <div style={{ fontFamily: "Cinzel,serif", fontSize: 22, color: "var(--gold)", letterSpacing: 3 }}>GW2 WEALTH TRACKER</div>
      <div style={{ fontSize: 13, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>Enter your GW2 API key to get started</div>
      <div style={{ width: "100%", maxWidth: 500, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 6, padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
      Generate an API key at <span style={{ color: "var(--gold2)", fontFamily: "monospace" }}>account.arena.net</span> {"\u2192"} Applications.<br/>
      Required permissions: <span style={{ color: "var(--gold2)" }}>account, characters, inventories, progression, tradingpost, unlocks, wallet</span>
      </div>
      <input
      value={settingsApiKey}
      onChange={e => setSettingsApiKey(e.target.value)}
      placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXXXXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
      style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "8px 12px", color: "var(--text1)", fontSize: 12, fontFamily: "monospace", boxSizing: "border-box" }}
      />
      <button onClick={async () => {
        const key = settingsApiKey.trim();
        if (!key) return;
        await invoke("cache_set", { key: "api_key", value: key });
        setApiKey(key);
        setNoApiKey(false);
        window.__gw2ApiKey = key;
        setLoadState({ phase: "loading", pct: 0, msg: "Initializing..." });
        fullLoad();
      }} style={{ alignSelf: "flex-end", fontSize: 12, color: "#fff", background: "var(--gold3,#7a5c1e)", border: "none", borderRadius: 4, padding: "8px 20px", cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
      SAVE & CONTINUE {"\u2192"}
      </button>
      </div>
      </div>
    )}

    {loadState.phase === "loading" && (
      <div className="load-wrap">
      <div style={{ fontFamily: "Cinzel,serif", fontSize: 14, color: "var(--gold)", letterSpacing: 3 }}>LOADING</div>
      <div className="load-bar-w"><div className="load-bar" style={{ width: `${loadState.pct}%` }} /></div>
      <div className="load-txt">{loadState.msg}</div>
      <div style={{ fontSize: 13, color: "var(--text3)", fontStyle: "italic", maxWidth: 400, textAlign: "center" }}>
      First load fetches all recipe data — this may take a few minutes on a fresh install, it's not frozen. Subsequent loads are much faster.
      </div>
      </div>
    )}

    {error && <div className="errbar">⚠ {error}</div>}

    {data && (loadState.phase === "done" || loadState.phase === "refreshing") && (
      <>
      <StatusBar
        refreshing={refreshing} secsAgo={secsAgo}
        nextPriceIn={nextPriceIn} nextRecipeIn={nextRecipeIn}
        PRICE_REFRESH_MS={PRICE_REFRESH_MS} RECIPE_REFRESH_MS={RECIPE_REFRESH_MS}
        refreshPrices={refreshPrices}
      />
      {refreshError && <div className="errbar">⚠ {refreshError}</div>}

      <div className="cards">
      <div className="card">
      <div className="card-lbl">💰 Current Gold</div>
      <div className="card-val"><Gold v={data.goldCopper} size={26} /></div>
      </div>
      <div className="card">
      <div className="card-lbl">📦 Materials Value</div>
      <div className="card-val"><Gold v={data.totalMaterialValue} size={26} /></div>
      <div className="card-sub">{data.materialRows.length} materials · after 15% TP tax</div>
      </div>
      <div className="card">
      <div className="card-lbl">🏦 Total Wealth</div>
      <div className="card-val"><Gold v={data.goldCopper + data.totalMaterialValue} size={26} /></div>
      <div className="card-sub">Gold + materials value after TP tax</div>
      </div>
      <div className="card" style={
        gemPrice && gemAlertThresholdGold > 0 && gemPrice.costFor400 <= gemAlertThresholdGold * 10000
          ? { border: "1px solid var(--green2)", boxShadow: "0 0 16px rgba(122,222,122,.25)" }
          : undefined
      }>
      <div className="card-lbl">💎 Gems (400)</div>
      <div className="card-val">
      {gemPrice ? <Gold v={gemPrice.costFor400} size={26} /> : <span style={{ color: "var(--text3)", fontSize: 16 }}>—</span>}
      </div>
      <div className="card-sub">
      {gemAlertThresholdGold > 0 && gemPrice && gemPrice.costFor400 <= gemAlertThresholdGold * 10000
        ? <span style={{ color: "var(--green2)" }}>🔔 below your alert</span>
        : "cheapest gold cost via exchange"}
      </div>
      </div>
      </div>

      <div className="nav">
      <button className={`ntab${activeTab === "materials" ? " on" : ""}`} onClick={() => setActiveTab("materials")}>Materials</button>
      <button className={`ntab${activeTab === "crafting" ? " on" : ""}`} onClick={() => setActiveTab("crafting")}>Crafting Profits</button>
      <button className={`ntab${activeTab === "mysticforge" ? " on" : ""}`} onClick={() => setActiveTab("mysticforge")}>⚗ Mystic Forge</button>
      <button className={`ntab${activeTab === "listings" ? " on" : ""}`} onClick={() => setActiveTab("listings")}>
      Trading Post
      {Object.keys(myListings).length > 0 && <span style={{ marginLeft: 7, fontSize: 10, opacity: .8 }}>{Object.keys(myListings).length}</span>}
      </button>
      <button className={`ntab${activeTab === "flipping" ? " on" : ""}`} onClick={() => setActiveTab("flipping")}>
      Flip Market
      {Object.keys(flipSummary).length > 0 && <span style={{ marginLeft: 7, fontSize: 10, opacity: .8 }}>{Object.keys(flipSummary).length}</span>}
      </button>
      <button className={`ntab${activeTab === "daily" ? " on" : ""}`} onClick={() => setActiveTab("daily")}>
      Time Gated
      {data && (() => {
        const eligible = data.timegatedList || [];
        const done = eligible.filter(r => dailyCrafted.has(r.itemId)).length;
        return eligible.length > 0
        ? <span style={{ marginLeft: 7, fontSize: 10, fontFamily: "Cinzel,serif", opacity: 0.8 }}>
        {done}/{eligible.length}
        </span>
        : null;
      })()}
      </button>
      </div>

      {activeTab === "materials" && data && <MaterialsTab {...materialsTabProps} />}
      {activeTab === "crafting" && data && <CraftingTab {...craftingTabProps} />}
      {activeTab === "mysticforge" && data && (
        <MysticForgeTab
          data={data}
          priceMap={data.priceMap}
          ownedMap={data.ownedMap}
          velocitySummary={velocitySummary}
          trendSummary={trendSummary}
          wallet={forgeWallet}
          legendaryAchievements={legendaryAchievements}
          rarityFilter={rarityFilter}
          setRarityFilter={setRarityFilter}
        />
      )}
      {activeTab === "flipping" && data && <FlipMarketTab {...flipMarketTabProps} />}
      {activeTab === "listings" && data && <TradingPostTab {...tradingPostTabProps} />}
      {activeTab === "daily" && data && <TimeGatedTab {...timeGatedTabProps} />}
      </>
    )}
    </div>
    {toast && (
      <div className="toast" style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span>{toast}</span>
      <button onClick={() => setToast(null)}
      style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontSize: 16, lineHeight: 1, opacity: .7 }}
      title="Dismiss">×</button>
      </div>
    )}
    </>
  );
}
