/**
 * Tauri Storage Adapter
 * Supports standalone mode (local DB) and NAS mode (collector DB on NAS).
 * Personal data (flips, daily resets, cache) always uses local PersonalDbState.
 * Market data (price history, velocity) uses whichever DB is active.
 */

import { invoke } from "@tauri-apps/api/core";

const LOG = true;
const log = (...a) => LOG && console.log("[storage]", ...a);
const warn = (...a) => console.warn("[storage]", ...a);

// ── App Cache (personal DB) ───────────────────────────────────────────────────

export async function cacheSet(key, value) {
  try {
    await invoke("cache_set", { key, value: JSON.stringify(value) });
  } catch (e) { warn("[cacheSet] failed:", e); }
}

export async function cacheGet(key) {
  try {
    const entry = await invoke("cache_get", { key });
    if (!entry) return null;
    return { key: entry.key, value: JSON.parse(entry.value), ts: entry.ts };
  } catch (e) { warn("[cacheGet] failed:", e); return null; }
}

// Fetch multiple cache keys in a single IPC round-trip
// JSON.parse runs in a worker to avoid blocking the main thread
export async function cacheGetBulk(keys) {
  try {
    const t0 = performance.now();
    const entries = await invoke("cache_get_bulk", { keys });
    const t1 = performance.now();
    const totalBytes = entries.reduce((s, e) => s + (e?.value?.length || 0), 0);
    console.log(`[cacheGetBulk] IPC: ${(t1-t0).toFixed(0)}ms, ${(totalBytes/1024).toFixed(0)}KB total`);
    entries.forEach(e => e && console.log(`  ${e.key}: ${(e.value.length/1024).toFixed(0)}KB`));

    // Parse in worker if available, otherwise fall back to main thread
    const worker = getWorker();
    if (worker) {
      const result = await new Promise((resolve, reject) => {
        const id = ++_workerMsgId;
        _workerCallbacks[id] = { resolve, reject };
        worker.postMessage({ type: 'parse_cache_bulk', id, payload: { entries } });
      });
      console.log(`[cacheGetBulk] worker parse: ${(performance.now()-t1).toFixed(0)}ms`);
      return result;
    }
    // Main thread fallback
    return entries.map(entry => {
      if (!entry) return null;
      try { return { key: entry.key, value: JSON.parse(entry.value), ts: entry.ts }; }
      catch { return null; }
    });
  } catch (e) { warn("[cacheGetBulk] failed:", e); return keys.map(() => null); }
}

// ── Price History (market DB) ─────────────────────────────────────────────────

export async function saveSnapshot(priceMap) {
  try {
    const points = Object.entries(priceMap).map(([id, p]) => ({
      item_id: Number(id),
                                                              ts: Date.now(),
                                                              sell: p.sells?.unit_price || 0,
                                                              buy: p.buys?.unit_price || 0,
                                                              sell_qty: p.sells?.quantity || 0,
                                                              buy_qty: p.buys?.quantity || 0,
    }));
    log(`[saveSnapshot] sending ${points.length} points to Rust`);
    const written = await invoke("save_price_snapshots", { points });
    log(`[saveSnapshot] Rust wrote ${written} records`);
    return written;
  } catch (e) { warn("[saveSnapshot] failed:", e); return 0; }
}

export async function loadHistory(itemId, sinceTs = 0) {
  try {
    const t0h = Date.now();
    const rows = await invoke("load_price_history", { itemId: Number(itemId), sinceTs: sinceTs });
    log(`[loadHistory] item=${itemId} got ${rows.length} rows in ${Date.now()-t0h}ms`);
    return rows.map(r => ({ ts: r.ts, sell: r.sell, buy: r.buy, sellQty: r.sell_qty, buyQty: r.buy_qty }));
  } catch (e) { warn("[loadHistory] failed:", e); return []; }
}

// Single-query replacement for the per-item alert scan — returns 7-day max + row count per item
export async function getPriceAlertData(itemIds, sinceTs) {
  try {
    const t0 = Date.now();
    const rows = await invoke("get_price_alert_data", { itemIds: itemIds.map(Number), sinceTs });
    log(`[getPriceAlertData] ${rows.length} rows for ${itemIds.length} items in ${Date.now()-t0}ms`);
    return rows;
  } catch (e) { warn("[getPriceAlertData] failed:", e); return []; }
}

// ── Velocity Snapshots (market DB) ────────────────────────────────────────────

export async function saveVelocitySnapshot(priceMap) {
  try {
    const now = Date.now();
    const points = Object.entries(priceMap).map(([id, p]) => ({
      item_id: Number(id),
                                                              ts: now,
                                                              sell_qty: p.sells?.quantity || 0,
                                                              buy_qty: p.buys?.quantity || 0,
    }));
    log(`[saveVelocitySnapshot] sending ${points.length} points`);
    await invoke("save_velocity_snapshots", { points });
    log(`[saveVelocitySnapshot] done`);
  } catch (e) { warn("[saveVelocitySnapshot] failed:", e); }
}

export async function loadVelocityForItems(itemIds, sinceTs) {
  try {
    log(`[loadVelocityForItems] ${itemIds.length} items since ${new Date(sinceTs).toISOString()}`);
    const t0 = Date.now();
    const rows = await invoke("load_velocity_for_items", {
      itemIds: itemIds.map(Number),
                              sinceTs: sinceTs,
    });
    const grouped = {};
    for (const r of rows) {
      if (!grouped[r.item_id]) grouped[r.item_id] = [];
      grouped[r.item_id].push({ ts: r.ts, sellQty: r.sell_qty, buyQty: r.buy_qty });
    }
    log(`[loadVelocityForItems] got ${rows.length} rows for ${Object.keys(grouped).length} items in ${Date.now()-t0}ms`);
    return grouped;
  } catch (e) { warn("[loadVelocityForItems] failed:", e); return {}; }
}

// ── Market Summary ────────────────────────────────────────────────────────────

const ONE_HOUR_MS = 3_600_000;
const NINETY_DAYS_MS = 90 * 24 * ONE_HOUR_MS;

// Singleton worker — created once, reused across all loadMarketSummary calls
let _worker = undefined; // undefined = not yet initialized, null = failed/unavailable
let _workerMsgId = 0;
const _workerCallbacks = {};

function getWorker() {
  if (_worker === undefined) {
    try {
      _worker = new Worker(new URL('./market-worker.js', import.meta.url), { type: 'module' });
      _worker.onmessage = (e) => {
        const { type, id, result, error } = e.data;
        const cb = _workerCallbacks[id];
        if (!cb) return;
        delete _workerCallbacks[id];
        if (type === 'market_summary_result' || type === 'craft_items_result' || type === 'parse_cache_bulk_result' || type === 'process_startup_cache_result' || type === 'locked_craft_items_result') cb.resolve(result);
        else cb.reject(new Error(error));
      };
        _worker.onerror = (e) => {
          warn('[worker] error — falling back to main thread:', e);
          _worker = null; // force fallback on next call
        };
    } catch(e) {
      warn('[worker] failed to create — will compute on main thread:', e);
      _worker = null;
    }
  }
  return _worker;
}

// Fallback: compute on main thread if worker unavailable
function computeOnMainThread(velocityGrouped, priceHistoryMap, now) {
  const ONE_HOUR_MS = 3_600_000;
  const SEVEN_DAYS_MS = 7 * 24 * ONE_HOUR_MS;
  const MIN_OBS = 3;
  const velocity = {};
  for (const [idStr, snapshots] of Object.entries(velocityGrouped)) {
    const id = Number(idStr);
    if (snapshots.length < 2) continue;
    snapshots.sort((a, b) => a.ts - b.ts);
    const pairs = [];
    for (let i = 1; i < snapshots.length; i++) {
      const prev = snapshots[i-1], cur = snapshots[i];
      const dtHr = (cur.ts - prev.ts) / ONE_HOUR_MS;
      if (dtHr <= 0 || dtHr > (10 / 60)) continue; // allow up to 10 min gap
      pairs.push({ sellFills: Math.max(0, prev.sellQty - cur.sellQty) / dtHr, buyFills: Math.max(0, prev.buyQty - cur.buyQty) / dtHr, ts: cur.ts });
    }
    if (pairs.length < MIN_OBS) continue;
    const recentPairs = pairs.filter(p => p.ts > now - SEVEN_DAYS_MS);
    if (recentPairs.length < MIN_OBS) continue;
    velocity[id] = {
      sellFillsPerHr: recentPairs.reduce((s, p) => s + p.sellFills, 0) / recentPairs.length,
      buyFillsPerHr: recentPairs.reduce((s, p) => s + p.buyFills, 0) / recentPairs.length,
      observations: recentPairs.length,
      windowHrs: (recentPairs[recentPairs.length-1].ts - recentPairs[0].ts) / ONE_HOUR_MS,
    };
  }
  const trends = {}, flips = {};
  for (const [idStr, rows] of Object.entries(priceHistoryMap)) {
    const id = Number(idStr);
    if (rows.length < 2) continue;
    rows.sort((a, b) => a.ts - b.ts);
    const recent = rows[rows.length-1], old24h = rows.find(r => r.ts >= now - 86400000) || rows[0];
    if (recent?.sell && old24h?.sell && recent.sell !== old24h.sell)
      trends[id] = { pct: ((recent.sell - old24h.sell) / old24h.sell) * 100, current: recent.sell, old: old24h.sell };
    const sp = rows.map(r => r.sell).filter(s => s > 0);
    if (sp.length >= 10) {
      sp.sort((a, b) => a - b);
      const p = (arr, pct) => arr[Math.floor((pct/100) * (arr.length-1))];
      const p10 = p(sp,10), p50 = p(sp,50), p90 = p(sp,90);
      const swing = p50 > 0 ? (p90-p10)/p50 : 0;
      if (swing >= 0.1) flips[id] = { p10Sell:p10, p25Sell:p(sp,25), p50Sell:p50, p75Sell:p(sp,75), p90Sell:p90, swing, snapCount:sp.length };
    }
  }
  return { velocity, trends, flips };
}

function workerCompute(type, payload) {
  const worker = getWorker();
  if (!worker) {
    // Worker unavailable — compute synchronously on main thread as fallback
    warn('[worker] unavailable, computing on main thread');
    return Promise.resolve(computeOnMainThread(payload.velocityGrouped, payload.priceHistoryMap, payload.now));
  }
  return new Promise((resolve, reject) => {
    const id = ++_workerMsgId;
    _workerCallbacks[id] = { resolve, reject };
    worker.postMessage({ type, id, payload });
  });
}

// In-flight deduplication — if a summary is already being computed, return the same promise
let _marketSummaryInFlight = null;

export function loadMarketSummary() {
  if (_marketSummaryInFlight) {
    log('[loadMarketSummary] reusing in-flight request');
    return _marketSummaryInFlight;
  }
  const t0 = Date.now();
  log(`[loadMarketSummary] START — invoking Rust get_market_summary`);
  _marketSummaryInFlight = (async () => {
    try {
      // 8s timeout belt-and-suspenders with Rust-side timeout
      const raw = await Promise.race([
        invoke("get_market_summary"),
        new Promise((_, reject) => setTimeout(() => reject(new Error("market summary timeout")), 20000)),
      ]);
      const velocity = {};
      for (const v of raw.velocity) {
        velocity[v.item_id] = { sellFillsPerHr: v.sell_fills_per_hr, buyFillsPerHr: v.buy_fills_per_hr, observations: v.observations, windowHrs: v.window_hrs };
      }
      const trends = {};
      for (const t of raw.trends) {
        trends[t.item_id] = { pct: t.pct, current: t.current, old: t.old };
      }
      const flips = {};
      for (const f of raw.flips) {
        flips[f.item_id] = { p10Sell: f.p10_sell, p25Sell: f.p25_sell, p50Sell: f.p50_sell, p75Sell: f.p75_sell, p90Sell: f.p90_sell, swing: f.swing, snapCount: f.snap_count };
      }
      log(`[loadMarketSummary] TOTAL time: ${Date.now()-t0}ms — vel:${raw.velocity.length} trends:${raw.trends.length} flips:${raw.flips.length}`);
      // Persist to cache so next startup has last-known data immediately
      if (raw.velocity.length > 0) {
        invoke("cache_set", { key: "lastMarketSummary", value: JSON.stringify({ velocity: raw.velocity, trends: raw.trends, flips: raw.flips }) }).catch(() => {});
      }
      return { velocity, trends, flips };
    } catch (e) {
      warn("[loadMarketSummary] failed:", e);
      return { velocity: {}, trends: {}, flips: {} };
    } finally {
      _marketSummaryInFlight = null; // clear so next call can run fresh
    }
  })();
  return _marketSummaryInFlight;
}

// ── Flip Tracking (personal DB) ───────────────────────────────────────────────

export async function flipPendingAdd(entry) {
  return invoke("flip_pending_add", {
    entry: {
      item_id: entry.itemId, item_name: entry.itemName, buy_price: entry.buyPrice,
      qty: entry.qty || 1, target_sell_price: entry.targetSellPrice,
      buy_time: entry.buyTime, flagged_buy_now_ts: entry.flaggedBuyNowTs || null,
    }
  });
}

export async function flipPendingGetAll() {
  const rows = await invoke("flip_pending_get_all");
  return rows.map(r => ({
    id: r.id, itemId: r.item_id, itemName: r.item_name, buyPrice: r.buy_price,
    qty: r.qty, targetSellPrice: r.target_sell_price, buyTime: r.buy_time,
    flaggedBuyNowTs: r.flagged_buy_now_ts,
  }));
}

export async function flipPendingDelete(id) {
  return invoke("flip_pending_delete", { id });
}

export async function flipHistoryAdd(entry) {
  return invoke("flip_history_add", {
    entry: {
      item_id: entry.itemId, item_name: entry.itemName, buy_price: entry.buyPrice,
      sell_price: entry.sellPrice, qty: entry.qty || 1, profit: entry.profit,
      buy_time: entry.buyTime, sell_time: entry.sellTime,
    }
  });
}

export async function flipHistoryGetAll() {
  const rows = await invoke("flip_history_get_all");
  return rows.map(r => ({
    id: r.id, itemId: r.item_id, itemName: r.item_name, buyPrice: r.buy_price,
    sellPrice: r.sell_price, qty: r.qty, profit: r.profit,
    buyTime: r.buy_time, sellTime: r.sell_time,
  }));
}

export async function flipHistoryDelete(id) {
  return invoke("flip_history_delete", { id });
}

// ── Manual Daily Resets (personal DB) ─────────────────────────────────────────

export async function manualDailySet(itemId, count, resetTs) {
  return invoke("manual_daily_set", { itemId, count, resetTs });
}

export async function manualDailyGetAll() {
  const rows = await invoke("manual_daily_get_all");
  return rows.map(r => ({ itemId: r.item_id, count: r.count, resetTs: r.reset_ts }));
}

// ── DB Stats ──────────────────────────────────────────────────────────────────

export async function getDbStats() {
  return invoke("get_db_stats");
}

export async function pruneOldData() {
  return invoke("prune_old_data");
}

// ── Export ────────────────────────────────────────────────────────────────────

export async function exportAllData() {
  try {
    const [flipPending, flipHistory, manualResets] = await Promise.all([
      invoke("flip_pending_get_all"),
                                                                       invoke("flip_history_get_all"),
                                                                       invoke("manual_daily_get_all"),
    ]);
    const cacheKeys = ["recipes", "itemMap", "disciplineLevels", "knownRecipeIds", "ownedMap", "lastGold"];
    const cacheEntries = (await Promise.all(
      cacheKeys.map(k => invoke("cache_get", { key: k }).catch(() => null))
    )).filter(Boolean);
    return {
      exported_at: Date.now(),
      flip_pending: (flipPending || []).map(r => ({ item_id: r.itemId, item_name: r.itemName, buy_price: r.buyPrice, qty: r.qty, target_sell_price: r.targetSellPrice, buy_time: r.buyTime, flagged_buy_now_ts: r.flaggedBuyNowTs || null })),
      flip_history: (flipHistory || []).map(r => ({ item_id: r.itemId, item_name: r.itemName, buy_price: r.buyPrice, sell_price: r.sellPrice, qty: r.qty, profit: r.profit, buy_time: r.buyTime, sell_time: r.sellTime })),
      manual_daily_resets: (manualResets || []).map(r => ({ item_id: r.itemId, count: r.count, reset_ts: r.resetTs })),
      app_cache: cacheEntries.map(e => ({ key: e.key, value: e.value, ts: e.ts })),
    };
  } catch (e) { throw new Error(`Export failed: ${e}`); }
}

// ── Import ────────────────────────────────────────────────────────────────────

export async function importFromBrowser(jsonData) {
  try {
    return await invoke("import_from_browser", { data: jsonData });
  } catch (e) { throw new Error(`Import failed: ${e}`); }
}

// Run buildCraftItems in the worker so it never blocks the main thread
export function computeCraftItems(recipes, resolvedRecipes, itemMap, priceMap, ownedMap) {
  const worker = getWorker();
  if (!worker) return Promise.resolve(null); // fallback: caller handles null
  return new Promise((resolve, reject) => {
    const id = ++_workerMsgId;
    _workerCallbacks[id] = { resolve, reject };
    worker.postMessage({
      type: 'compute_craft_items',
      id,
      payload: { recipes, resolvedRecipes, itemMap, priceMap, ownedMap }
    });
  });
}

// Run buildCraftItems against the full-catalog "locked" (not-learned) recipe list,
// off the main thread — powers the Unlearned Recipes tab. Same worker/message pattern
// as computeCraftItems above.
export function computeLockedCraftItems(lockedRecipes, resolvedRecipes, itemMap, priceMap, ownedMap) {
  const worker = getWorker();
  if (!worker) return Promise.resolve(null); // fallback: caller handles null
  return new Promise((resolve, reject) => {
    const id = ++_workerMsgId;
    _workerCallbacks[id] = { resolve, reject };
    worker.postMessage({
      type: 'compute_locked_craft_items',
      id,
      payload: { lockedRecipes, resolvedRecipes, itemMap, priceMap, ownedMap }
    });
  });
}

// ── Friend Recipe Lookup ──────────────────────────────────────────────────────
// Read-only: a friend's API key is used ONLY to fetch which recipes they know
// and their crafting discipline levels (needed to mirror the account owner's own
// autoUnlocked/discipline-eligible heuristic on a per-friend basis — see
// friendDisciplineEligibleMap in App.jsx). We never fetch their materials, wallet,
// inventory, or bank. See commands.rs for the full design rationale (single-purpose,
// not multi-account support). Discipline levels require the "Characters" permission
// on the friend's API key, in addition to "Unlocks" for known recipes.

export async function addFriendKey(name, apiKey) {
  return invoke("add_friend_key", { name, apiKey });
}

export async function refreshFriendKey(id) {
  return invoke("refresh_friend_key", { id });
}

export async function deleteFriendKey(id) {
  return invoke("delete_friend_key", { id });
}

export async function getFriends() {
  return invoke("get_friends");
}

export async function getFriendRecipesKnown() {
  return invoke("get_friend_recipes_known");
}

// Per-friend crafting discipline levels — e.g. [{ friend_id, friend_name,
// discipline_levels: { Weaponsmith: 500, Tailor: 400, ... } }]. Powers the
// discipline-eligible ("could make this via Discovery / auto-unlock right now,
// even if not formally known") matching in App.jsx's friendDisciplineEligibleMap,
// mirroring the same three-way eligibility the account owner's own Crafting
// Profits/Recommended tabs already get (known / auto-learned / discoverable-now).
// Requires the friend's key to have the "Characters" permission — refreshFriendKey
// re-fetches both this and known-recipe IDs together, same cadence, same key.
export async function getFriendDisciplineLevels() {
  return invoke("get_friend_discipline_levels");
}

// Process startup cache data off the main thread (resolvedRecipes, matRows, totalMatValue)
export function processStartupCache(allRecipes, itemMap, priceMap, ownedMap) {
  const worker = getWorker();
  if (!worker) {
    // Main thread fallback
    const resolvedRecipes = {};
    allRecipes.forEach(r => { resolvedRecipes[r.output_item_id] = r; });
    const matRows = Object.entries(ownedMap).map(([idStr, count]) => {
      const id = Number(idStr);
      const item = itemMap[id];
      const price = priceMap[id];
      const sp = price?.sells?.unit_price || 0;
      const spNet = Math.floor(sp * 0.85);
      return { id, name: item?.name || `Item ${id}`, icon: item?.icon, rarity: item?.rarity, count, sellPrice: sp, sellPriceNet: spNet, buyPrice: price?.buys?.unit_price || 0, totalValue: spNet * count };
    }).filter(r => r.name && !r.name.startsWith('Item ') && (r.sellPrice > 0 || resolvedRecipes[r.id]));
    const totalMatValue = matRows.reduce((s, r) => s + r.totalValue, 0);
    return Promise.resolve({ resolvedRecipes, matRows, totalMatValue });
  }
  return new Promise((resolve, reject) => {
    const id = ++_workerMsgId;
    _workerCallbacks[id] = { resolve, reject };
    worker.postMessage({ type: 'process_startup_cache', id, payload: { allRecipes, itemMap, priceMap, ownedMap } });
  });
}
