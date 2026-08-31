import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { invoke } from "@tauri-apps/api/core";
import MysticForgeTab from "./MysticForgeTab.jsx";
import { buildForgeRecipeMap } from "./mystic-forge-data.js";

// ── Constants ─────────────────────────────────────────────────────────────────
// API key loaded from personal.db on startup — see apiKey state
const BASE = "https://api.guildwars2.com/v2";
const PRICE_REFRESH_MS = 60_000;
const RECIPE_REFRESH_MS = 4 * 60 * 60_000;
const UPDATE_CHECK_MS = 4 * 60 * 60_000; // 4h — GitHub Releases doesn't need aggressive polling
const GEM_QUANTITY_COPPER = 4_000_000; // 400g sample — coins_per_gem is stable enough at this size to extrapolate ×400
const UNLEARNED_REFRESH_MS = 7 * 24 * 60 * 60_000; // weekly — full-catalog recipe ID diff for Unlearned Recipes tab
const FRIEND_REFRESH_MS = 24 * 60 * 60_000; // daily — friend recipes-known rarely changes, no need for tighter polling
const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Vendor prices: { itemId: priceInCopper }
// Sources: GW2 wiki, verified vendor costs
const VENDOR_PRICES = {
  // Spools of Thread (sold by discipline vendors)
  19792: { name: "Spool of Jute Thread",            price: 8   },
  19789: { name: "Spool of Wool Thread",             price: 16  },
  19791: { name: "Spool of Cotton Thread",           price: 24  },
  19790: { name: "Spool of Linen Thread",            price: 32  },
  19788: { name: "Spool of Silk Thread",             price: 48  },
  19793: { name: "Spool of Gossamer Thread",         price: 64  },
  // Ascended spools
  46740: { name: "Spool of Thick Elonian Cord",      price: 150 },
  46742: { name: "Spool of Silk Weaving Thread",     price: 150 },
  // Alloying Lumps (sold by discipline vendors)
  19704: { name: "Lump of Tin",                      price: 8   },
  19750: { name: "Lump of Coal",                     price: 8   },
  19924: { name: "Lump of Primordium",               price: 8   },
  46742: { name: "Lump of Mithrillium",              price: 150 },
  // Reagents
  46747: { name: "Thermocatalytic Reagent",          price: 150 },
  75919: { name: "Hydrocatalytic Reagent",           price: 150 },
  // Runes of Holding (bag crafting)
  19914: { name: "Rune of Holding",                  price: 72  },
  19915: { name: "Minor Rune of Holding",            price: 252 },
  19916: { name: "Major Rune of Holding",            price: 500 },
  19917: { name: "Superior Rune of Holding",         price: 1000_00 }, // 10g
  // Glass (Artificer/Chef)
  19985: { name: "Lump of Glass",                    price: 8  },
  // Jug of Water — vendor 10 for 80c = 8c each [wiki verified June 2026, API 12156]
  // NOTE: 12156 is Jug of Water, NOT Pouch of Black Pigment (fixed June 2026)
  12156: { name: "Jug of Water",                     price: 8   },
  // Dye pigments (Chef) [API verified June 2026]
  70426: { name: "Pouch of Black Pigment",           price: 8   },
  12151: { name: "Pouch of Red Pigment",             price: 8   },
  12152: { name: "Pouch of Orange Pigment",          price: 8   },
  12153: { name: "Pouch of Yellow Pigment",          price: 8   },
  12154: { name: "Pouch of Green Pigment",           price: 8   },
  12155: { name: "Pouch of Blue Pigment",            price: 8   },
  77112: { name: "Pouch of Purple Pigment",          price: 8   },
  12158: { name: "Pouch of White Pigment",           price: 8   },
  12159: { name: "Pouch of Brown Pigment",           price: 8   },
  // Flax seeds (Chef)
  36731: { name: "Pile of Flax Seeds",               price: 16  },
  // Vials (Artificer/Chef)
  8576:  { name: "Vial of Water",                    price: 8   },
  // Potions/misc
  12238: { name: "Thermocatalytic Reagent (old)",    price: 150 },
};

const DISCIPLINES = ["Armorsmith","Leatherworker","Tailor","Weaponsmith","Huntsman","Chef","Artificer","Jeweler","Scribe","Homesteader"];

// /v2/account/dailycrafting API - returns exactly these strings when an item has been crafted today.
// Source: https://api.guildwars2.com/v2/dailycrafting (lists all valid IDs)
// The 5 items tracked by /v2/account/dailycrafting API endpoint.
// API returns lowercase strings that match these keys exactly.
const DAILY_CRAFT_MAP = {
  "charged_quartz_crystal":       { itemId: 43772, disciplines: ["Artificer","Jeweler"],                                     minRating: 400 },
  "glob_of_elder_spirit_residue": { itemId: 46744, disciplines: ["Artificer","Huntsman","Weaponsmith"],                      minRating: 450 },
  "lump_of_mithrilium":           { itemId: 46742, disciplines: ["Armorsmith","Weaponsmith","Artificer"],                    minRating: 400 },
  "spool_of_silk_weaving_thread": { itemId: 46740, disciplines: ["Tailor","Leatherworker","Armorsmith"],                     minRating: 400 },
  "spool_of_thick_elonian_cord":  { itemId: 46745, disciplines: ["Leatherworker","Huntsman","Tailor","Armorsmith"],          minRating: 400 },
};
const DAILY_CRAFT_IDS = new Set(Object.values(DAILY_CRAFT_MAP).map(v => v.itemId));

// Time-gated items NOT tracked by /v2/account/dailycrafting API.
// Tracked by material count delta: if count goes up since last 4PM UTC reset, mark as crafted.
// Buying from TP also counts (count goes up either way — goal is just "do I still need to do this today").
// Item IDs verified from GW2 wiki.
const MANUAL_DAILY_MAP = {
  // ── Mawdrey / Cultivated Vine chain (Dry Top recipes) ──
  "clay_pot":                          { itemId: 66913, disciplines: ["Artificer","Huntsman","Chef"],           minRating: 400 },
  "grow_lamp":                         { itemId: 66993, disciplines: ["Jeweler"],                               minRating: 400 },
  "plate_of_meaty_plant_food":         { itemId: 66917, disciplines: ["Huntsman"],                              minRating: 400 },
  "plate_of_piquant_plant_food":       { itemId: 66923, disciplines: ["Chef"],                                  minRating: 400 },
  "heat_stone":                        { itemId: 67015, disciplines: ["Armorsmith"],                            minRating: 500 },
  // ── Gift of Aurene / Dragon Hatchling Doll (legendary backpiece parts) ──
  "dragon_hatchling_doll_adornments":  { itemId: 79795, disciplines: ["Jeweler"],                               minRating: 400 },
  "dragon_hatchling_doll_eye":         { itemId: 79726, disciplines: ["Artificer"],                             minRating: 450 },
  "dragon_hatchling_doll_frame":       { itemId: 79817, disciplines: ["Huntsman"],                              minRating: 450 },
  "dragon_hatchling_doll_hide":        { itemId: 79790, disciplines: ["Leatherworker"],                         minRating: 450 },
  "gossamer_stuffing":                 { itemId: 79763, disciplines: ["Tailor"],                                minRating: 450 },
  // ── Halloween seasonal (only available during Halloween) ──
  "vial_of_maize_balm":                { itemId: 9808,  disciplines: ["Artificer"],                             minRating: 400, seasonal: true },
};
const ALL_DAILY_ITEM_IDS = new Set([
  ...Object.values(DAILY_CRAFT_MAP).map(v => v.itemId),
                                   ...Object.values(MANUAL_DAILY_MAP).map(v => v.itemId),
]);
// Combined set of all daily craft item IDs (API-tracked + manual)
const ALL_DAILY_CRAFT_IDS = new Set([
  ...Object.values(DAILY_CRAFT_MAP).map(v => v.itemId),
                                    ...Object.values(MANUAL_DAILY_MAP).map(v => v.itemId),
]);

// Storage for material counts at last daily reset, keyed by itemId
// Used to detect count increases since reset for manual daily items

function buildTimegatedInfo(itemMap, disciplineLevels) {
  // API-tracked items (completion via /v2/account/dailycrafting)
  const apiItems = Object.entries(DAILY_CRAFT_MAP)
  .map(([key, info]) => {
    const qualDiscs = info.disciplines.filter(d => (disciplineLevels[d] || 0) >= info.minRating);
    const allDiscs = info.disciplines.map(d => ({ name: d, level: disciplineLevels[d] || 0, qualifies: (disciplineLevels[d] || 0) >= info.minRating }));
    const itemName = itemMap[info.itemId]?.name || key.replace(/_/g, " ");
    const icon = itemMap[info.itemId]?.icon || null;
    return { key, ...info, qualDiscs, allDiscs, name: itemName, icon, trackByCount: false };
  })
  .filter(r => r.qualDiscs.length > 0);

  // Manually-tracked items (completion via material count delta since reset)
  const manualItems = Object.entries(MANUAL_DAILY_MAP)
  .map(([key, info]) => {
    const qualDiscs = info.disciplines.filter(d => (disciplineLevels[d] || 0) >= info.minRating);
    const allDiscs = info.disciplines.map(d => ({ name: d, level: disciplineLevels[d] || 0, qualifies: (disciplineLevels[d] || 0) >= info.minRating }));
    const itemName = itemMap[info.itemId]?.name || key.replace(/_/g, " ");
    const icon = itemMap[info.itemId]?.icon || null;
    return { key, ...info, qualDiscs, allDiscs, name: itemName, icon, trackByCount: true };
  })
  .filter(r => r.qualDiscs.length > 0);

  return [...apiItems, ...manualItems].sort((a, b) => b.minRating - a.minRating || a.name.localeCompare(b.name));
}

// For dailycrafting API response (item name strings) -> Set of output item IDs
// The API returns strings like "Deldrimor_Steel_Ingot" or item display names
// We match by normalizing: lowercase, replace spaces/hyphens with underscores
function normalizeDailyKey(s) {
  return s.toLowerCase().replace(/[\s\-]+/g, "_");
}

// ── Utilities ─────────────────────────────────────────────────────────────────
// Returns a craft item's disciplines, falling back to "Uncategorized" when the
// GW2 API returns an empty disciplines array (happens for some refinement-type
// recipes, e.g. Piece of Dragon Jade). Previously `(ci.disciplines || ["Unknown"])`
// only caught null/undefined — an empty array [] is truthy and passed through,
// so .forEach ran zero times and the item silently never appeared under any tab.
const getRecipeDisciplines = (ci) =>
  (ci.disciplines && ci.disciplines.length > 0) ? ci.disciplines : ["Uncategorized"];

// Deduplicates a recipe array by GW2 recipe API id. None of the three places that
// build/load `allRecipes` (initial full-load merge, cache read, refreshRecipes'
// incremental merge) ever checked for this, so if a duplicate ever got written
// into the persisted cache (e.g. a race between two refresh cycles), it would
// silently accumulate forever, since the cache is reused as-is on every launch.
// Symptom: the same output item shows up as several identical-looking cards
// (e.g. Karka Toughness Station showing 6 cards where only 3 real recipe
// variants exist), with the count doubling/tripling depending on how many
// times the duplication occurred historically.
function dedupeRecipesById(recipes) {
  const deduped = Array.from(new Map(recipes.map(r => [r.id, r])).values());
  // Diagnostic: every known call site (fullLoad, refreshRecipes, rescanAutoUnlockedRecipes)
  // is expected to be a no-op here in normal operation. If this ever actually removes
  // something, the stack trace pinpoints which refresh path is reintroducing duplicate
  // recipe ids into the live `recipes` array — check the console if duplicates return.
  if (deduped.length !== recipes.length) {
    console.warn(`[dedupeRecipesById] removed ${recipes.length - deduped.length} duplicate(s) — call stack:`, new Error().stack);
  }
  return deduped;
}

const chunk = (arr, size) =>
Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

const Gold = ({ v, size = 14 }) => {
  if (v == null || isNaN(v)) return <span style={{ color: "var(--text3)" }}>—</span>;
  const neg = v < 0;
  const abs = Math.abs(Math.round(v));
  const g = Math.floor(abs / 10000);
  const s = Math.floor((abs % 10000) / 100);
  const c = abs % 100;
  const col = neg ? "var(--red)" : undefined;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: size, color: col }}>
    {neg && <span>−</span>}
    {g > 0 && <><b>{g}</b><span style={{ fontSize: 10, background: "#3a2e00", color: "var(--gold2)", padding: "0 3px", borderRadius: 2, fontFamily: "Cinzel,serif" }}>g</span></>}
    {s > 0 && <><b>{s}</b><span style={{ fontSize: 10, background: "#2a2a3a", color: "#c0c0d8", padding: "0 3px", borderRadius: 2, fontFamily: "Cinzel,serif" }}>s</span></>}
    <b>{c}</b><span style={{ fontSize: 10, background: "#2a1a0a", color: "var(--copper)", padding: "0 3px", borderRadius: 2, fontFamily: "Cinzel,serif" }}>c</span>
    </span>
  );
};

// ── Receipt-style hover stat ────────────────────────────────────────────────
// Renders a single stat (e.g. Net Profit, Craft Advantage) that shows a
// vertical receipt breakdown on hover. `lines` is an ordered array of
// { label, value, isTotal? } — always rendered in full, including 0c lines.
// Desktop-only (hover), reuses the existing .tt-wrap/.tt tooltip CSS.
// ── Portal-based hover tooltip ──────────────────────────────────────────────
// Renders into document.body with position:fixed, positioned from the trigger's
// getBoundingClientRect(). This deliberately escapes any ancestor's overflow:hidden
// (e.g. .ci card corners) so the tooltip is never clipped, regardless of whether
// the card is collapsed or expanded. Re-measures on open and on scroll/resize
// while visible so it tracks the trigger if the page moves under it.
function TooltipPortal({ anchorRef, visible, children, minWidth = 260, maxWidth = 460 }) {
  const [pos, setPos] = useState(null);

  const measure = useCallback(() => {
    const el = anchorRef.current;
    if (!el) { setPos(null); return; }
    const rect = el.getBoundingClientRect();
    let left = rect.left;
    const overflowRight = left + maxWidth - (window.innerWidth - 12);
    if (overflowRight > 0) left = Math.max(12, left - overflowRight);
    let top = rect.bottom + 6;
    // Flip above the trigger if there isn't room below
    if (top + 160 > window.innerHeight - 12 && rect.top > window.innerHeight - rect.bottom) {
      top = Math.max(12, rect.top - 6);
      setPos({ top, left, flip: true });
      return;
    }
    setPos({ top, left, flip: false });
  }, [anchorRef, maxWidth]);

  useEffect(() => {
    if (!visible) { setPos(null); return; }
    measure();
    const onMove = () => measure();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [visible, measure]);

  if (!visible || !pos) return null;
  return createPortal(
    <div
      className="tt-portal"
      style={{
        top: pos.flip ? undefined : pos.top,
        bottom: pos.flip ? (window.innerHeight - pos.top) : undefined,
        left: pos.left,
        minWidth, maxWidth,
      }}
    >
      {children}
    </div>,
    document.body
  );
}

function ReceiptStat({ label, value, lines, size = 15, wrapClass = "ci-stat", lblClass = "ci-stat-lbl" }) {
  const [hovered, setHovered] = useState(false);
  const anchorRef = useRef(null);
  const positive = value >= 0;
  return (
    <div
      ref={anchorRef}
      className={wrapClass}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className={lblClass}>{label}</span>
      <span className={positive ? "pp" : "pn"} style={{ fontSize: size }}>
        {positive ? "+" : ""}<Gold v={value} size={size} />
      </span>
      <TooltipPortal anchorRef={anchorRef} visible={hovered}>
        {lines.map((l, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", gap: 20,
            padding: l.isTotal ? "6px 0 0" : "3px 0",
            marginTop: l.isTotal ? 6 : 0,
            borderTop: l.isTotal ? "1px solid var(--border2)" : "none",
          }}>
            <span style={{ fontSize: 13, fontWeight: l.isTotal ? 600 : 400, color: l.isTotal ? "var(--text1)" : "var(--text3)" }}>{l.label}</span>
            <span style={{ fontSize: 13, fontWeight: l.isTotal ? 600 : 400, color: l.isTotal ? (l.value >= 0 ? "var(--green2)" : "var(--red2)") : "var(--text2)" }}>
              <Gold v={l.value} size={13} />
            </span>
          </div>
        ))}
      </TooltipPortal>
    </div>
  );
}

// "Best crafting use" hover cell (Materials tab) — same portal-tooltip pattern as
// ReceiptStat so it isn't clipped by the table wrapper's overflow-x:auto either.
function BestCraftingUseCell({ best, velocitySummary, trendSummary }) {
  const [hovered, setHovered] = useState(false);
  const anchorRef = useRef(null);
  return (
    <div
      ref={anchorRef}
      style={{ display: "inline-block" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ color: "var(--gold)", cursor: "help", fontSize: 14 }}>{best[0].name} →</span>
      <TooltipPortal anchorRef={anchorRef} visible={hovered}>
        <div style={{ fontFamily: "Cinzel,serif", fontSize: 11, letterSpacing: 2, color: "var(--text3)", marginBottom: 10 }}>BEST CRAFTING USES</div>
        {best.map(ci => {
          const vel = velocitySummary[ci.outputId];
          const sellFills = vel?.observations >= 5 ? vel.sellFillsPerHr : null;
          const trend = trendSummary[ci.outputId];
          return (
            <div key={ci.recipeId} style={{ marginBottom: 10 }}>
            <div className={`rar-${ci.rarity}`} style={{ fontWeight: 600, fontSize: 15 }}>{ci.name}</div>
            <div style={{ color: "var(--text3)", fontSize: 13 }}>Craft advantage: <span className={ci.craftAdvantage >= 0 ? "pp" : "pn"}>{ci.craftAdvantage >= 0 ? "+" : ""}<Gold v={ci.craftAdvantage} size={13} /></span></div>
            <div style={{ color: "var(--text3)", fontSize: 13 }}>Net profit: <span className={ci.profitNet >= 0 ? "pp" : "pn"}>{ci.profitNet >= 0 ? "+" : ""}<Gold v={ci.profitNet} size={13} /></span></div>
            {sellFills != null && <div style={{ color: sellFills > 0.5 ? "var(--green2)" : "var(--gold2)", fontSize: 12 }}>↑ {sellFills.toFixed(1)} buys/hr</div>}
            {trend && <div><TrendBadge trend={trend} /></div>}
            <div style={{ color: "var(--text3)", fontSize: 12 }}>{ci.disciplines?.join(", ")}</div>
            </div>
          );
        })}
      </TooltipPortal>
    </div>
  );
}

// Fetch up to 30 days of sold history by paging through the API (50 per page)
async function fetchSoldHistory() {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const results = [];
  for (let page = 0; page < 20; page++) { // max 20 pages = 1000 transactions
    try {
      const data = await apiFetch(`${BASE}/commerce/transactions/history/sells?page=${page}&page_size=50`);
      if (!Array.isArray(data) || data.length === 0) break;
      const filtered = data.filter(t => new Date(t.purchased).getTime() >= cutoff);
      results.push(...filtered);
      if (filtered.length < data.length) break; // hit cutoff date
    } catch { break; }
  }
  return results;
}

async function apiFetch(url) {
  const sep = url.includes("?") ? "&" : "?";
  const key = window.__gw2ApiKey || "";
  const res = await fetch(`${url}${sep}access_token=${key}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function publicFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function fetchIds(endpoint, ids) {
  if (!ids.length) return [];
  const results = [];
  for (const ch of chunk(ids, 200)) {
    try {
      const data = await publicFetch(`${BASE}${endpoint}?ids=${ch.join(",")}`);
      results.push(...(Array.isArray(data) ? data : []));
    } catch {
      for (const sm of chunk(ch, 10)) {
        try {
          const data = await publicFetch(`${BASE}${endpoint}?ids=${sm.join(",")}`);
          results.push(...(Array.isArray(data) ? data : []));
        } catch {}
      }
    }
  }
  return results;
}

async function fetchPrices(ids) {
  if (!ids.length) return {};
  const map = {};
  for (const ch of chunk([...new Set(ids)], 200)) {
    try {
      const data = await publicFetch(`${BASE}/commerce/prices?ids=${ch.join(",")}`);
      data.forEach(p => { map[p.id] = p; });
    } catch {}
  }
  return map;
}

// Filter item IDs to only those that can actually appear on the TP.
// Skips AccountBound, SoulbindOnAcquire, and MonsterOnly items — they never have listings.
const NON_TRADEABLE_FLAGS = new Set(["AccountBound", "SoulbindOnAcquire", "MonsterOnly"]);
function filterTradeable(ids, itemMap) {
  if (!itemMap || Object.keys(itemMap).length === 0) return ids; // no itemMap yet, fetch all
  return ids.filter(id => {
    const item = itemMap[id];
    if (!item) return true; // unknown item — try fetching, API will 404 if untradeable
    const flags = item.flags || [];
    return !flags.some(f => NON_TRADEABLE_FLAGS.has(f));
  });
}

// ── Character inventory aggregation ──────────────────────────────────────────
// Returns { itemId: count } from all character bags (not material storage)
function extractCharacterItems(characters) {
  const counts = {};
  for (const char of characters) {
    for (const bag of (char.bags || [])) {
      if (!bag) continue;
      for (const slot of (bag.inventory || [])) {
        if (!slot || !slot.id || slot.count <= 0) continue;
        counts[slot.id] = (counts[slot.id] || 0) + slot.count;
      }
    }
  }
  return counts;
}

// Returns { charName: { itemId: count } } — per-character bag inventory
function extractCharacterItemsByChar(characters) {
  const byChar = {};
  for (const char of characters) {
    const counts = {};
    for (const bag of (char.bags || [])) {
      if (!bag) continue;
      for (const slot of (bag.inventory || [])) {
        if (!slot || !slot.id || slot.count <= 0) continue;
        counts[slot.id] = (counts[slot.id] || 0) + slot.count;
      }
    }
    if (Object.keys(counts).length > 0) byChar[char.name] = counts;
  }
  return byChar;
}

// Returns { charName: [discipline, ...] } — which disciplines each character has
function extractCharacterDisciplines(characters) {
  const byChar = {};
  for (const char of characters) {
    const discs = (char.crafting || []).map(c => c.discipline);
    if (discs.length > 0) byChar[char.name] = discs;
  }
  return byChar;
}

// Extract forge-relevant currencies from wallet by fetching currency names once
// Returns { spirit_shards, volatile_magic, unbound_magic, karma, laurels }
let _currencyMap = null; // name(lowercase) -> currency_id, cached after first fetch
// Verified currency IDs from GW2 wiki /v2/currencies
const CURRENCY_IDS = {
  spirit_shards:  23,
  volatile_magic: 45,
  unbound_magic:  32,
  karma:          2,
  laurels:        3,
};
function extractForgeWallet(walletArr) {
  if (!Array.isArray(walletArr)) return {};
  const get = (id) => walletArr.find(w => w.id === id)?.value || 0;
  return {
    spirit_shards:  get(CURRENCY_IDS.spirit_shards),
    volatile_magic: get(CURRENCY_IDS.volatile_magic),
    unbound_magic:  get(CURRENCY_IDS.unbound_magic),
    karma:          get(CURRENCY_IDS.karma),
    laurels:        get(CURRENCY_IDS.laurels),
  };
}

// Build a Set of crafted item IDs from the dailycrafting API response
// GW2 API returns lowercase e.g. "glob_of_elder_spirit_residue"; map uses Title_Case
const DAILY_CRAFT_MAP_LOWER = Object.fromEntries(
  Object.entries(DAILY_CRAFT_MAP).map(([k, v]) => [k.toLowerCase(), v])
);
function buildDailyCraftedSet(dailyNames, itemMap) {
  const ids = new Set();
  console.log("[Daily] API returned:", dailyNames);
  for (const name of (dailyNames || [])) {
    const entry = DAILY_CRAFT_MAP[name] || DAILY_CRAFT_MAP_LOWER[name.toLowerCase()];
    if (entry) ids.add(entry.itemId);
    else console.log("[Daily] No map match for:", name);
  }
  console.log("[Daily] Matched crafted IDs:", [...ids]);
  return ids;
}

// ── IndexedDB: Price History + App Cache ─────────────────────────────────────

// Downsampling thresholds: keep all snapshots <24h old, hourly <7d, daily beyond
// This caps storage at ~500 records/item max over 6 months


// ── Storage: Tauri SQLite backend (replaces IndexedDB) ───────────────────────
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
} from "./storage.js";
import { getCurrentVersion, checkForUpdate, getChangelog } from "./updater.js";
import { DEFAULT_RARITY_FILTER, passesRarityFilter, RarityDropdown } from "./RarityFilter.jsx";
import { DEFAULT_FRIEND_FILTER, passesFriendFilter, FriendFilterDropdown } from "./FriendFilter.jsx";

// Builds recipeId -> [{friendId, friendName}] from the get_friend_recipes_known
// backend response — used to tag craft items with which friend(s) know them.
function buildFriendRecipeMap(entries) {
  const map = {};
  for (const { friend_id, friend_name, recipe_ids } of (entries || [])) {
    for (const rid of recipe_ids) {
      if (!map[rid]) map[rid] = [];
      map[rid].push({ friendId: friend_id, friendName: friend_name });
    }
  }
  return map;
}

function TrendBadge({ trend }) {
  if (!trend) return null;
  const { pct } = trend;
  const abs = Math.abs(pct);
  if (abs < 0.1) return null;
  const up = pct > 0;
  const arrow = up ? "▲" : "▼";
  const color = up ? "var(--green2)" : "var(--red2)";
  const tip = `24h: ${up ? "+" : ""}${pct.toFixed(2)}%`;
  return (
    <span title={tip} style={{ fontSize:10, fontFamily:"Cinzel,serif", letterSpacing:.5, color, cursor:"help", whiteSpace:"nowrap" }}>
    {arrow} {abs >= 10 ? abs.toFixed(0) : abs.toFixed(1)}%
    </span>
  );
}


// ── Lightweight Markdown renderer (changelog only) ───────────────────────────
// Handles the subset GitHub release notes actually use: #/##/### headers,
// **bold**, *italic*, and "- " bullet lists. Not a general-purpose parser.
function renderMarkdownInline(line, key) {
  const parts = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0, match;
  while ((match = regex.exec(line))) {
    if (match.index > lastIndex) parts.push(line.slice(lastIndex, match.index));
    parts.push(
      match[1] !== undefined
        ? <strong key={`${key}-b${match.index}`}>{match[1]}</strong>
        : <em key={`${key}-i${match.index}`}>{match[2]}</em>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < line.length) parts.push(line.slice(lastIndex));
  return parts;
}

function renderMarkdown(text) {
  if (!text) return null;
  const blocks = [];
  let listItems = null;
  const flushList = () => {
    if (listItems) {
      blocks.push(<ul key={`ul-${blocks.length}`} style={{ margin: "4px 0 10px 20px", padding: 0 }}>{listItems}</ul>);
      listItems = null;
    }
  };
  text.split("\n").forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (line.trim() === "") { flushList(); return; }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushList();
      const sizes = { 1: 18, 2: 16, 3: 14, 4: 13 };
      blocks.push(
        <div key={`h-${idx}`} style={{ fontSize: sizes[h[1].length] || 13, fontWeight: 700, color: "var(--gold2)", marginTop: idx === 0 ? 0 : 12, marginBottom: 4 }}>
          {renderMarkdownInline(h[2], `h-${idx}`)}
        </div>
      );
      return;
    }

    const b = line.match(/^[-*]\s+(.*)$/);
    if (b) {
      if (!listItems) listItems = [];
      listItems.push(<li key={`li-${idx}`} style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4, lineHeight: 1.5 }}>{renderMarkdownInline(b[1], `li-${idx}`)}</li>);
      return;
    }

    flushList();
    blocks.push(<div key={`p-${idx}`} style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6, lineHeight: 1.5 }}>{renderMarkdownInline(line, `p-${idx}`)}</div>);
  });
  flushList();
  return blocks;
}

// Compatibility shim: the app calls manualDailySetCount(itemId, count, resetTs)
// storage.js exports manualDailySet — already aliased above.

// ── Recipe Tree ───────────────────────────────────────────────────────────────
// `rootRecipe`, when provided, is used for the depth-0 node instead of looking
// up resolvedRecipes[itemId]. This matters because resolvedRecipes is keyed by
// output_item_id only — when an item has multiple valid recipes (e.g. Karka
// Toughness Station has 3 different material combinations), resolvedRecipes[id]
// can only ever hold one of them (last one written wins). Without rootRecipe,
// every card for that output — regardless of which recipe object it represents —
// would render the same ingredient tree. Deeper recursion still uses
// resolvedRecipes[itemId] for sub-ingredients, which is an acceptable
// simplification since the card being displayed is what needs to be correct.
function buildTreeSync(itemId, count, resolvedRecipes, depth = 0, rootRecipe = null) {
  if (depth > 8) return { itemId, count, children: [], isLeaf: true };
  const recipe = (depth === 0 && rootRecipe) ? rootRecipe : resolvedRecipes[itemId];
  if (!recipe) return { itemId, count, children: [], isLeaf: true };
  const outputCount = recipe.output_item_count || 1;
  const runs = Math.ceil(count / outputCount);
  const children = recipe.ingredients.map(ing =>
  buildTreeSync(ing.item_id, ing.count * runs, resolvedRecipes, depth + 1)
  );
  return { itemId, count, outputCount, children, isLeaf: false };
}

function flatLeaves(node, ownedMap = {}, needed = null, isRoot = true) {
  const count = needed !== null ? needed : node.count;
  const owned = ownedMap[node.itemId] || 0;
  // If we own enough of this node (even if it's craftable), treat it as a leaf — don't flatten deeper.
  // EXCEPTION: the root node is the recipe's own output item, not an ingredient — owning existing
  // copies of the finished item (e.g. one sitting in your bags) must never short-circuit the
  // ingredient breakdown for crafting ANOTHER one. Only intermediate ingredients get this shortcut.
  if (node.isLeaf || (!isRoot && owned >= count)) return [{ itemId: node.itemId, count }];
  // child.count in the tree is already the total needed quantity (buildTreeSync pre-multiplies)
  // When called recursively with a specific needed count, we may need to scale children proportionally
  const outputCount = node.outputCount || 1;
  const treeRuns = Math.ceil(node.count / outputCount); // runs the tree was built for
  const actualRuns = Math.ceil(count / outputCount);    // runs we actually need
  const scale = treeRuns > 0 ? actualRuns / treeRuns : 1;
  const acc = {};
  for (const child of node.children) {
    const childNeeded = Math.ceil(child.count * scale);
    for (const leaf of flatLeaves(child, ownedMap, childNeeded, false)) {
      acc[leaf.itemId] = (acc[leaf.itemId] || 0) + leaf.count;
    }
  }
  return Object.entries(acc).map(([itemId, count]) => ({ itemId: Number(itemId), count }));
}

// Returns all nodes (intermediary + leaf) in recipe tree, for full ingredient display
function flatAllNodes(node, depth = 0) {
  if (node.isLeaf) return [{ itemId: node.itemId, count: node.count, isLeaf: true, depth }];
  const self = { itemId: node.itemId, count: node.count, isLeaf: false, depth, outputCount: node.outputCount };
  const children = node.children.flatMap(c => flatAllNodes(c, depth + 1));
  return [self, ...children];
}

// Checks whether any ingredient ANYWHERE in a recipe's tree (any depth, not just the direct/
// first-level ones) is itself a daily-gated item — e.g. Bolt of Damask requires Spool of Silk
// Weaving Thread, which is capped at one craft per day. The root node is the recipe's own
// OUTPUT, not an ingredient, so it's never itself counted as a "daily ingredient" here — that's
// a separate question (whether the craft's own output is daily-gated), checked elsewhere via
// dailySet.has(ci.outputId) directly.
function treeUsesDailyIngredient(node, dailySet, isRoot = true) {
  if (!node) return false;
  if (!isRoot && dailySet.has(node.itemId)) return true;
  if (node.children) {
    for (const child of node.children) {
      if (treeUsesDailyIngredient(child, dailySet, false)) return true;
    }
  }
  return false;
}

// For a given item+count, find the best sell strategy recursively.
// Returns { value, path } where path is an array of { itemId, count, name, sellPrice }
function bestSellValue(itemId, count, resolvedRecipes, priceMap, itemMap, depth = 0) {
  if (depth > 8) {
    const sp = priceMap[itemId]?.sells?.unit_price || 0;
    return { value: sp * count, path: [{ itemId, count, name: itemMap[itemId]?.name || `Item ${itemId}`, sellPrice: sp }] };
  }

  const tpSell = priceMap[itemId]?.sells?.unit_price || 0;
  const tpValue = tpSell * count;

  const recipe = resolvedRecipes[itemId];
  if (!recipe) return { value: tpValue, path: [{ itemId, count, name: itemMap[itemId]?.name || `Item ${itemId}`, sellPrice: tpSell }] };

  // Value of selling the ingredients instead
  let ingValue = 0;
  let ingPaths = [];
  for (const ing of recipe.ingredients) {
    const sub = bestSellValue(ing.item_id, ing.count * count, resolvedRecipes, priceMap, itemMap, depth + 1);
    ingValue += sub.value;
    ingPaths = ingPaths.concat(sub.path);
  }

  if (ingValue > tpValue) {
    return { value: ingValue, path: ingPaths };
  }
  return { value: tpValue, path: [{ itemId, count, name: itemMap[itemId]?.name || `Item ${itemId}`, sellPrice: tpSell }] };
}

// For a given item+count, find the cheapest way to acquire it (buy TP vs craft from cheaper sub-mats)
// Returns { cost, path } where path is array of { itemId, count, name, unitPrice, source }
function cheapestAcquire(itemId, count, resolvedRecipes, priceMap, itemMap, ownedMap, depth = 0) {
  const getItemName = (id) => itemMap[id]?.name || VENDOR_PRICES[id]?.name || `Item ${id}`;
  if (depth > 8) {
    const owned = ownedMap[itemId] || 0;
    const needed = Math.max(0, count - owned);
    const vendorP = VENDOR_PRICES[itemId];
    const tpP = priceMap[itemId]?.sells?.unit_price || 0;
    const unitPrice = vendorP ? Math.min(vendorP.price, tpP || Infinity) : tpP;
    const source = vendorP && vendorP.price <= (tpP || Infinity) ? "vendor" : "tp";
    return { cost: unitPrice * needed, path: [{ itemId, count, needed, name: getItemName(itemId), unitPrice, tpPrice: tpP, vendorPrice: vendorP?.price, source, owned }] };
  }

  const owned = ownedMap[itemId] || 0;
  const stillNeed = Math.max(0, count - owned);

  if (stillNeed === 0) {
    return { cost: 0, path: [{ itemId, count, needed: 0, name: getItemName(itemId), unitPrice: 0, tpPrice: 0, vendorPrice: null, source: "owned", owned }] };
  }

  // TP or vendor cost
  const vendorP = VENDOR_PRICES[itemId];
  const tpP = priceMap[itemId]?.sells?.unit_price || 0;
  const bestDirectPrice = vendorP ? Math.min(vendorP.price, tpP || Infinity) : tpP;
  const directSource = vendorP && vendorP.price <= (tpP || Infinity) ? "vendor" : "tp";
  const directCost = bestDirectPrice * stillNeed;

  const recipe = resolvedRecipes[itemId];
  if (!recipe) {
    return { cost: directCost, path: [{ itemId, count, needed: stillNeed, name: getItemName(itemId), unitPrice: bestDirectPrice, tpPrice: tpP, vendorPrice: vendorP?.price, source: directSource, owned }] };
  }

  // Cost of crafting from sub-ingredients
  const outputCount = recipe.output_item_count || 1;
  const runs = Math.ceil(stillNeed / outputCount);
  let craftCost = 0;
  let craftPaths = [];
  for (const ing of recipe.ingredients) {
    const sub = cheapestAcquire(ing.item_id, ing.count * runs, resolvedRecipes, priceMap, itemMap, ownedMap, depth + 1);
    craftCost += sub.cost;
    craftPaths = craftPaths.concat(sub.path);
  }

  if (craftCost < directCost) {
    const merged = {};
    for (const p of craftPaths) {
      if (merged[p.itemId]) {
        merged[p.itemId] = { ...merged[p.itemId], needed: merged[p.itemId].needed + p.needed, count: merged[p.itemId].count + p.count };
      } else {
        merged[p.itemId] = { ...p };
      }
    }
    const mergedPath = Object.values(merged);
    const mergedCost = mergedPath.reduce((s, p) => s + p.unitPrice * p.needed, 0);
    return { cost: mergedCost, path: mergedPath };
  }
  return { cost: directCost, path: [{ itemId, count, needed: stillNeed, name: getItemName(itemId), unitPrice: bestDirectPrice, tpPrice: tpP, vendorPrice: vendorP?.price, source: directSource, owned }] };
}

// Check if you can fulfill `needed` of `itemId` from owned inventory or craftable sub-mats
function checkFulfillment(itemId, needed, resolvedRecipes, ownedMap, depth = 0) {
  if (depth > 8) return { canFulfill: false, hasMaterials: false };
  const owned = ownedMap[itemId] || 0;
  if (owned >= needed) return { canFulfill: true, hasMaterials: false };

  const stillNeed = needed - owned;
  const recipe = resolvedRecipes[itemId];
  if (!recipe) return { canFulfill: false, hasMaterials: false };

  const outputCount = recipe.output_item_count || 1;
  const runs = Math.ceil(stillNeed / outputCount);
  for (const ing of recipe.ingredients) {
    const sub = checkFulfillment(ing.item_id, ing.count * runs, resolvedRecipes, ownedMap, depth + 1);
    if (!sub.canFulfill) return { canFulfill: false, hasMaterials: false };
  }
  return { canFulfill: true, hasMaterials: true };
}

// ── Craft Items Builder ───────────────────────────────────────────────────────
// Returns a filtered priceMap containing only items worth tracking:
// - Rare/Exotic/Ascended/Legendary rarity (high-value items)
// - Any item that appears in a known recipe (output or ingredient)
// - Materials you own (always track what you have)
const TRACKED_RARITIES = new Set(["Rare", "Exotic", "Ascended", "Legendary"]);

function buildCraftItems(recipes, resolvedRecipes, itemMap, priceMap, ownedMap) {
  // Defensive: collapse any recipes sharing the same GW2 recipe id before building
  // cards. Something upstream (a refresh path, a race between cache writes, etc.)
  // can reintroduce duplicate ids into the recipes array during a live session —
  // this guarantees exactly one card per recipe id no matter the cause upstream.
  const seenRecipeIds = new Set();
  const cleanRecipes = [];
  for (const r of recipes) {
    if (seenRecipeIds.has(r.id)) continue;
    seenRecipeIds.add(r.id);
    cleanRecipes.push(r);
  }
  recipes = cleanRecipes;

  const items = [];
  for (const recipe of recipes) {
    const outputId = recipe.output_item_id;
    const outputCount = recipe.output_item_count || 1;
    const outputPrice = priceMap[outputId];
    // Don't skip recipes with no TP price — show them with 0 sell price so user
    // can see all recipes. Account-bound/untradeable outputs will show negative profit.

    const tree = buildTreeSync(outputId, 1, resolvedRecipes, 0, recipe);
    const leaves = flatLeaves(tree, ownedMap);

    let canCraft = true;
    const missingMats = [], matDetails = [];
    let totalMustBuyCostSell = 0, totalMustBuyCostBuy = 0;

    for (const leaf of leaves) {
      const price = priceMap[leaf.itemId];
      const item = itemMap[leaf.itemId];
      const owned = ownedMap[leaf.itemId] || 0;
      const needed = leaf.count;
      const vendorP = VENDOR_PRICES[leaf.itemId];
      const tpSell = price?.sells?.unit_price || 0;
      const tpBuy = price?.buys?.unit_price || 0;
      const vendorPrice = vendorP?.price;
      const bestBuyPrice = vendorPrice ? Math.min(vendorPrice, tpSell || Infinity) : tpSell;
      const bestSource = vendorPrice && vendorPrice <= (tpSell || Infinity) ? "vendor" : "tp";

      const fulfill = checkFulfillment(leaf.itemId, needed, resolvedRecipes, ownedMap);
      let status = "have";
      if (!fulfill.canFulfill) {
        status = "mustBuy";
        canCraft = false;
        const mustBuyCount = Math.max(0, needed - owned);
        missingMats.push({ itemId: leaf.itemId, needed, owned, name: item?.name || `Item ${leaf.itemId}`, mustBuyCount, bestBuyPrice, bestSource, vendorPrice });
        totalMustBuyCostSell += bestBuyPrice * mustBuyCount;
        totalMustBuyCostBuy += (tpBuy || bestBuyPrice) * mustBuyCount;
      } else if (fulfill.hasMaterials) {
        status = "hasMaterials";
      }

      matDetails.push({
        itemId: leaf.itemId,
        name: item?.name || `Item ${leaf.itemId}`,
        needed, owned,
        tpSell, tpBuy, vendorPrice, bestBuyPrice, bestSource,
        rarity: item?.rarity,
        status,
      });
    }

    const outSell = outputPrice?.sells?.unit_price || 0;
    const outBuy = outputPrice?.buys?.unit_price || 0;
    const profitGross = outSell * outputCount - totalMustBuyCostSell;
    const profitNet = Math.floor(outSell * outputCount * 0.85) - totalMustBuyCostSell;

    // Best sell path for each mat (what you'd get selling mats instead of crafting)
    let matSellTotal = 0;
    const matSellPaths = [];
    for (const leaf of leaves) {
      if (matDetails.find(m => m.itemId === leaf.itemId)?.status === "mustBuy") continue;
      const best = bestSellValue(leaf.itemId, leaf.count, resolvedRecipes, priceMap, itemMap);
      matSellTotal += best.value;
      matSellPaths.push({ leafId: leaf.itemId, count: leaf.count, ...best });
    }
    const matSellNet = Math.floor(matSellTotal * 0.85);
    const craftAdvantage = profitNet - matSellNet;

    // Cheapest acquire path for missing mats
    const cheapAcquire = cheapestAcquire(outputId, 1, resolvedRecipes, priceMap, itemMap, ownedMap);

    items.push({
      recipeId: recipe.id,
      outputId, outputCount,
      name: itemMap[outputId]?.name || `Item ${outputId}`,
      icon: itemMap[outputId]?.icon,
      rarity: itemMap[outputId]?.rarity,
      disciplines: recipe.disciplines,
      canCraft, missingMats, matDetails,
      outSell, outBuy,
      totalMustBuyCostSell,
      profitGross, profitNet,
      matSellTotal, matSellNet, matSellPaths,
      craftAdvantage,
      cheapAcquire,
      tree,
    });
  }
  return items;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');
:root {
  --bg:#0e0c09; --bg2:#161310; --bg3:#1e1a14; --bg4:#252018; --bg5:#2e2718;
  --border:#3a3020; --border2:#4a3f28;
  --gold:#c8962a; --gold2:#e8b84b; --gold3:#f5d080;
  --copper:#b87333; --text:#e8dcc8; --text2:#b8a888; --text3:#786858;
  --green:#5a9e5a; --green2:#7ade7a; --red:#c05050; --red2:#e05a5a;
  --blue:#5a8aaf; --blue2:#7ab4d4;
  --font-ui: 'Cinzel', serif;
  --font-body: 'Crimson Pro', Georgia, serif;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 17px; }
body { background: var(--bg); color: var(--text); font-family: var(--font-body); min-height: 100vh; }
.app { max-width: 2000px; margin: 0 auto; padding: 0 48px 60px; }

/* ── Header ── */
.hdr { text-align: center; padding: 32px 0 20px; border-bottom: 1px solid var(--border2); margin-bottom: 20px; position: relative; }
.hdr::before,.hdr::after { content:'⬡'; color:var(--gold); font-size:12px; position:absolute; top:50%; transform:translateY(-50%); opacity:.4; }
.hdr::before{left:0;} .hdr::after{right:0;}
.hdr h1 { font-family:var(--font-ui); font-size:32px; font-weight:700; color:var(--gold2); letter-spacing:4px; text-transform:uppercase; text-shadow:0 0 40px rgba(200,150,42,.35); }
.hdr p { color:var(--text3); font-size:14px; letter-spacing:1px; margin-top:5px; font-style:italic; }

/* ── Status bar ── */
.sbar { display:flex; align-items:center; gap:14px; padding:9px 16px; background:var(--bg3); border:1px solid var(--border); border-radius:5px; margin-bottom:18px; font-size:13px; font-family:var(--font-ui); letter-spacing:.5px; flex-wrap:wrap; }
.sdot { width:8px; height:8px; border-radius:50%; background:var(--green); flex-shrink:0; box-shadow:0 0 7px var(--green); }
.sdot.spin { background:var(--gold); box-shadow:0 0 7px var(--gold); animation:pulse .8s infinite; }
.sdot.warn { background:var(--red); box-shadow:0 0 7px var(--red); }
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.3;}}
.cd-wrap { margin-left:auto; display:flex; align-items:center; gap:16px; }
.cd-item { display:flex; align-items:center; gap:6px; color:var(--text3); font-size:12px; }
.cd-bar-w { width:64px; height:3px; background:var(--bg4); border-radius:2px; overflow:hidden; }
.cd-bar { height:100%; border-radius:2px; transition:width 1s linear; }
.cd-p { background:var(--gold); } .cd-r { background:var(--blue); }
.rbtn { font-family:var(--font-ui); font-size:11px; letter-spacing:1px; padding:6px 14px; border:1px solid var(--border2); border-radius:4px; cursor:pointer; color:var(--gold); background:transparent; transition:all .15s; }
.rbtn:hover { background:rgba(200,150,42,.1); border-color:var(--gold); }
.rbtn:disabled { opacity:.4; cursor:not-allowed; }

/* ── Alert banner ── */
.alert-banner { background:#2a1e00; border:1px solid var(--gold); border-radius:5px; padding:10px 16px; margin-bottom:14px; font-size:14px; color:var(--gold2); }
.alert-banner strong { font-family:var(--font-ui); font-size:11px; letter-spacing:2px; display:block; margin-bottom:6px; }
.alert-item { display:flex; align-items:center; gap:10px; padding:4px 0; border-bottom:1px solid rgba(200,150,42,.15); }
.alert-item:last-child { border-bottom:none; }

/* ── Summary cards ── */
.cards { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
.card { background:var(--bg3); border:1px solid var(--border2); border-radius:5px; padding:20px 24px; position:relative; overflow:hidden; }
.card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,var(--gold),transparent); }
.card-lbl { font-family:var(--font-ui); font-size:11px; letter-spacing:2px; color:var(--text3); text-transform:uppercase; margin-bottom:10px; }
.card-val { font-size:26px; font-weight:600; }
.card-sub { font-size:13px; color:var(--text3); margin-top:5px; }

/* ── Nav ── */
.nav { display:flex; gap:4px; margin-bottom:22px; border-bottom:1px solid var(--border); flex-wrap:wrap; }
.ntab { font-family:var(--font-ui); font-size:12px; letter-spacing:1px; text-transform:uppercase; padding:10px 20px; border:1px solid transparent; border-bottom:none; border-radius:4px 4px 0 0; cursor:pointer; color:var(--text3); background:transparent; transition:all .15s; margin-bottom:-1px; }
.ntab:hover { color:var(--text2); border-color:var(--border); background:var(--bg3); }
.ntab.on { color:var(--gold2); border-color:var(--border2); background:var(--bg3); border-bottom-color:var(--bg3); }

/* ── Controls ── */
.ctrl { display:flex; gap:14px; align-items:center; margin-bottom:16px; flex-wrap:wrap; }
.si { background:var(--bg3); border:1px solid var(--border2); border-radius:4px; padding:9px 14px; color:var(--text); font-family:var(--font-body); font-size:15px; outline:none; width:240px; transition:border-color .15s; }
.si:focus { border-color:var(--gold); }
.si::placeholder { color:var(--text3); }
.cbl { display:flex; align-items:center; gap:7px; color:var(--text2); font-size:14px; cursor:pointer; font-family:var(--font-ui); letter-spacing:.5px; }
.cbl input { accent-color:var(--gold); cursor:pointer; width:16px; height:16px; }

/* ── Tables ── */
.tw { overflow-x:auto; border:1px solid var(--border); border-radius:5px; }
table { width:100%; border-collapse:collapse; font-size:15px; }
thead th { font-family:var(--font-ui); font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:var(--text3); padding:12px 14px; border-bottom:1px solid var(--border2); background:var(--bg4); text-align:left; cursor:pointer; white-space:nowrap; user-select:none; }
thead th:hover { color:var(--gold); }
thead th.srt { color:var(--gold2); }
tbody tr { border-bottom:1px solid var(--border); transition:background .1s; }
tbody tr:last-child { border-bottom:none; }
tbody tr:hover { background:var(--bg4); }
tbody td { padding:11px 14px; color:var(--text2); vertical-align:middle; }
.tfoot td { border-top:2px solid var(--border2)!important; font-weight:600; color:var(--text)!important; background:var(--bg4); padding:11px 14px; }

/* ── Rarity ── */
.rj{color:#aaa;} .rB{color:#fff;} .rF{color:#62a4da;} .rM{color:#1a9306;}
.rR{color:#fcd00b;} .rE{color:#ffa405;} .rA{color:#fb3e8d;} .rL{color:#9f4dff;}
.rar-Junk{color:#aaa;} .rar-Basic{color:#fff;} .rar-Fine{color:#62a4da;}
.rar-Masterwork{color:#1a9306;} .rar-Rare{color:#fcd00b;} .rar-Exotic{color:#ffa405;}
.rar-Ascended{color:#fb3e8d;} .rar-Legendary{color:#9f4dff;}

/* ── Item cell ── */
.ic { display:flex; align-items:center; gap:9px; }
.iico { width:32px; height:32px; border-radius:3px; border:1px solid var(--border2); object-fit:cover; flex-shrink:0; }
.iico-sm { width:22px; height:22px; border-radius:2px; border:1px solid var(--border2); object-fit:cover; flex-shrink:0; }
.iico-ph { width:32px; height:32px; border-radius:3px; border:1px solid var(--border2); background:var(--bg4); flex-shrink:0; }

/* ── Price display ── */
.p2 { display:flex; flex-direction:column; gap:2px; }
.psell { color:#e8a850; font-size:14px; }
.pbuy { color:#7ab87a; font-size:13px; }
.plbl { font-size:11px; color:var(--text3); }

/* ── Tooltip ── */
.tt-wrap { position:relative; }
.tt { display:none; position:absolute; z-index:200; left:0; top:100%; min-width:300px; max-width:460px; background:var(--bg4); border:1px solid var(--gold); border-radius:5px; padding:14px 16px; font-size:14px; color:var(--text2); box-shadow:0 10px 40px rgba(0,0,0,.8); pointer-events:none; }
.tt-wrap:hover .tt { display:block; }
/* Portal tooltip — rendered into document.body via createPortal so it's never
   clipped by an ancestor's overflow:hidden (e.g. .ci card corners). Positioned
   with position:fixed from the trigger's getBoundingClientRect(). */
.tt-portal { position:fixed; z-index:9999; background:var(--bg4); border:1px solid var(--gold); border-radius:5px; padding:14px 16px; font-size:14px; color:var(--text2); box-shadow:0 10px 40px rgba(0,0,0,.8); pointer-events:none; text-align:left; }

/* ── Loading ── */
.load-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:100px 20px; gap:20px; }
.load-bar-w { width:340px; height:5px; background:var(--bg4); border-radius:3px; overflow:hidden; }
.load-bar { height:100%; background:linear-gradient(90deg,var(--gold),var(--gold2)); border-radius:3px; transition:width .3s; }
.load-txt { font-family:var(--font-ui); font-size:12px; color:var(--text3); letter-spacing:2px; }

/* ── Error ── */
.errbar { background:#2a0808; border:1px solid #5a2020; border-radius:5px; padding:12px 16px; color:#e08080; margin-bottom:12px; font-size:14px; }

/* ── Crafting items ── */
.ci { background:var(--bg3); border:1px solid var(--border); border-radius:5px; margin-bottom:10px; overflow:hidden; }
.ci-hdr { display:flex; align-items:center; gap:14px; padding:14px 20px; cursor:pointer; transition:background .1s; flex-wrap:wrap; }
.ci-hdr:hover { background:var(--bg4); }
.ci-name { flex:1; min-width:160px; font-size:16px; font-weight:600; }
.ci-body { padding:0 20px 16px; border-top:1px solid var(--border); background:var(--bg2); }

.bhave { font-family:var(--font-ui); font-size:10px; letter-spacing:1px; padding:3px 8px; border-radius:3px; background:#1a3a1a; color:var(--green2); border:1px solid #205a20; white-space:nowrap; }
.bmiss { font-family:var(--font-ui); font-size:10px; letter-spacing:1px; padding:3px 8px; border-radius:3px; background:#3a1a1a; color:var(--red2); border:1px solid #5a2020; white-space:nowrap; }
.bdaily-done { font-family:var(--font-ui); font-size:10px; letter-spacing:1px; padding:3px 8px; border-radius:3px; background:#1a1a3a; color:#8888dd; border:1px solid #303080; white-space:nowrap; }
.bdaily-avail { font-family:var(--font-ui); font-size:10px; letter-spacing:1px; padding:3px 8px; border-radius:3px; background:#2a1a00; color:var(--gold2); border:1px solid #80600a; white-space:nowrap; }

.stat-row { display:flex; gap:32px; padding:14px 16px; border-bottom:1px solid var(--border); margin-bottom:12px; flex-wrap:wrap; align-items:flex-start; }
.stat-cell { display:flex; flex-direction:column; gap:4px; min-width:90px; }
.stat-lbl { font-family:var(--font-ui); font-size:10px; letter-spacing:1.5px; color:var(--text3); text-transform:uppercase; }

.r-tree { font-size:14px; margin-top:10px; }
.r-hdr { font-family:var(--font-ui); font-size:11px; letter-spacing:2px; color:var(--text3); text-transform:uppercase; padding:9px 10px 5px; border-bottom:1px solid var(--border); margin-bottom:4px; display:flex; gap:8px; }
.r-row { display:flex; align-items:center; gap:10px; padding:6px 10px; border-radius:3px; transition:background .1s; }
.r-row:hover { background:var(--bg3); }
.r-tot { border-top:1px solid var(--border2); margin-top:5px; padding-top:9px; font-weight:600; }
/* ── Crafting header stats cluster ── */
.ci-stats { display:flex; gap:16px; align-items:center; margin-left:auto; flex-shrink:0; padding-left:12px; }
.ci-stat { display:flex; flex-direction:column; gap:3px; min-width:88px; text-align:right; }
.ci-stat-lbl { font-family:var(--font-ui); font-size:10px; letter-spacing:1.5px; color:var(--text3); white-space:nowrap; }

.sell-path { margin-top:12px; padding:10px; background:rgba(200,150,42,.06); border:1px solid rgba(200,150,42,.2); border-radius:4px; }
.sell-path-lbl { font-family:var(--font-ui); font-size:10px; letter-spacing:2px; color:var(--gold); margin-bottom:8px; }
.sell-path-item { display:flex; justify-content:space-between; align-items:center; padding:3px 0; font-size:13px; color:var(--text2); border-bottom:1px solid rgba(200,150,42,.1); }
.sell-path-item:last-child { border-bottom:none; }

.cheap-path { margin-top:10px; padding:10px; background:rgba(90,160,90,.05); border:1px solid rgba(90,160,90,.2); border-radius:4px; }
.cheap-path-lbl { font-family:var(--font-ui); font-size:10px; letter-spacing:2px; color:var(--green); margin-bottom:8px; }
.src-vendor { color:var(--gold2); font-size:11px; background:rgba(200,150,42,.15); padding:1px 5px; border-radius:2px; }
.src-tp { color:var(--blue2); font-size:11px; background:rgba(90,160,210,.15); padding:1px 5px; border-radius:2px; }
.src-owned { color:var(--green); font-size:11px; background:rgba(90,160,90,.15); padding:1px 5px; border-radius:2px; }

.miss-section { margin-top:12px; padding:10px; background:rgba(90,20,20,.2); border-radius:4px; border:1px solid #4a2020; }
.miss-lbl { font-family:var(--font-ui); font-size:10px; letter-spacing:2px; color:var(--red2); margin-bottom:8px; }
.miss-row { display:flex; gap:12px; font-size:14px; color:var(--text2); margin-bottom:4px; align-items:center; }

.pp { color:var(--green); font-weight:600; }
.pn { color:var(--red); font-weight:600; }

.disc-tabs { display:flex; gap:4px; flex-wrap:wrap; margin-bottom:18px; }
.dtab { font-family:var(--font-ui); font-size:11px; letter-spacing:1px; padding:6px 14px; border:1px solid var(--border); border-radius:4px; cursor:pointer; color:var(--text3); background:transparent; transition:all .15s; }
.dtab:hover { color:var(--text2); border-color:var(--border2); }
.dtab.on { color:var(--gold2); border-color:var(--gold); background:rgba(200,150,42,.08); }
.dtab-ct { opacity:.5; margin-left:5px; }

.sort-pills { display:flex; gap:8px; align-items:center; font-size:12px; color:var(--text3); font-family:var(--font-ui); letter-spacing:1px; flex-wrap:wrap; }
.sp { cursor:pointer; padding:4px 10px; border:1px solid var(--border); border-radius:3px; transition:all .15s; font-size:11px; }
.sp:hover { border-color:var(--border2); color:var(--text2); }
.sp.on { color:var(--gold2); border-color:var(--gold); }

.empty { color:var(--text3); font-style:italic; padding:50px; text-align:center; font-size:16px; }

/* ── Trend badge ── */
.trend-up { color:var(--green2); font-size:11px; font-family:var(--font-ui); letter-spacing:.5px; }
.trend-dn { color:var(--red2); font-size:11px; font-family:var(--font-ui); letter-spacing:.5px; }
.trend-flat { color:var(--text3); font-size:11px; font-family:var(--font-ui); letter-spacing:.5px; }

/* ── TP Listings tab ── */
.lp-section { background:var(--bg3); border:1px solid var(--border); border-radius:5px; margin-bottom:16px; overflow:hidden; }
.lp-hdr { padding:14px 20px; background:var(--bg4); border-bottom:1px solid var(--border2); font-family:var(--font-ui); font-size:12px; letter-spacing:2px; color:var(--gold2); display:flex; align-items:center; gap:12px; }
.lp-row { display:flex; align-items:center; gap:16px; padding:11px 20px; border-bottom:1px solid var(--border); transition:background .1s; }
.lp-row:last-child { border-bottom:none; }
.lp-row:hover { background:var(--bg4); }
.sold-row { display:flex; align-items:center; gap:16px; padding:10px 20px; border-bottom:1px solid var(--border); transition:background .1s; }
.sold-row:hover { background:var(--bg4); }
.sold-row:last-child { border-bottom:none; }
.sold-date { font-size:12px; color:var(--text3); min-width:120px; font-family:var(--font-ui); letter-spacing:.5px; }
.sold-qty { font-size:13px; color:var(--text2); min-width:40px; text-align:right; }
.sold-total { font-size:13px; color:var(--green); font-weight:600; min-width:120px; }
.lp-summary { display:flex; gap:32px; padding:16px 20px; background:var(--bg2); border-top:1px solid var(--border2); flex-wrap:wrap; }

/* ── Chart in crafting tab ── */
.cbtn { font-family:var(--font-ui); font-size:10px; letter-spacing:1px; padding:3px 8px; border:1px solid var(--border); border-radius:3px; cursor:pointer; color:var(--text3); background:transparent; transition:all .15s; white-space:nowrap; }
.cbtn:hover,.cbtn.on { color:var(--gold2); border-color:var(--gold); background:rgba(200,150,42,.08); }

/* ── Price history mini chart ── */
.hist-wrap { background:var(--bg4); border:1px solid var(--border2); border-radius:5px; padding:14px 16px; min-width:520px; }
.hist-lbl { font-family:var(--font-ui); font-size:10px; letter-spacing:2px; color:var(--text3); margin-bottom:10px; }
.hist-empty { font-size:13px; color:var(--text3); font-style:italic; padding:10px; }
.hist-row { display:flex; align-items:flex-start; gap:0; }
.hist-row td.chart-td { padding:0 !important; }

/* ── Toast ── */
.toast { position:fixed; bottom:28px; right:28px; z-index:300; background:#1a3a1a; border:1px solid #3a7a3a; border-radius:5px; padding:14px 20px; color:var(--green2); font-family:var(--font-ui); font-size:13px; letter-spacing:1px; box-shadow:0 5px 24px rgba(0,0,0,.7); animation:slideIn .3s ease; }
@keyframes slideIn{from{transform:translateX(24px);opacity:0;}to{transform:translateX(0);opacity:1;}}

@media(max-width:900px){ .cards{grid-template-columns:1fr;} .hdr h1{font-size:22px;} .cd-wrap{margin-left:0;} }
`;

// ── Manual daily craft helpers ────────────────────────────────────────────────
// GW2 daily reset is at 00:00 UTC. Returns ms timestamp of most recent reset.
function getDailyResetTs() {
  const now = new Date();
  const resetToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0);
  return now.getTime() >= resetToday ? resetToday : resetToday - 86400000;
}

// Weekly reset: Monday 07:30 UTC
function getWeeklyResetTs() {
  const now = new Date();
  const nowMs = now.getTime();
  // Find the most recent Monday at 07:30 UTC
  const day = now.getUTCDay(); // 0=Sun, 1=Mon...
  const daysToMonday = (day === 0 ? 6 : day - 1); // days since last Monday
  const lastMonday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysToMonday, 7, 30, 0, 0);
  if (nowMs >= lastMonday) return lastMonday;
  return lastMonday - 7 * 86400000;
}

// Check which manual daily items have been crafted (count went up since last reset baseline)
function checkManualDailyCrafted(resetMap, currentOwnedMap, currentResetTs) {
  const crafted = new Set();
  for (const info of Object.values(MANUAL_DAILY_MAP)) {
    const id = info.itemId;
    const baseline = resetMap[id];
    if (!baseline) continue; // no baseline yet
    if (baseline.resetTs < currentResetTs) continue; // baseline from before this reset
    const countNow = currentOwnedMap[id] || 0;
    if (countNow > baseline.count) crafted.add(id);
  }
  return crafted;
}

// Save current owned counts as reset baseline for all manual daily items
async function recordManualDailyBaseline(ownedMap) {
  const resetTs = getDailyResetTs();
  const existing = await manualDailyGetAll().catch(() => ({}));
  for (const info of Object.values(MANUAL_DAILY_MAP)) {
    const id = info.itemId;
    const existingEntry = existing[id];
    // Only record baseline if we don't have one for this reset yet
    // (prevents overwriting a higher count with a lower one mid-session)
    if (!existingEntry || existingEntry.resetTs < resetTs) {
      await manualDailySetCount(id, ownedMap[id] || 0, resetTs).catch(() => {});
    }
  }
}

// ── Main App ──────────────────────────────────────────────────────────────────
function FlipRow({ r, side, flipCol, chartItem, setChartItem, onTrack }) {
  const [trackQty, setTrackQty] = React.useState(1);
  return (
    <div key={r.id}>
    <div style={{
      display:"grid", gridTemplateColumns: flipCol,
      padding:"8px 10px 8px 12px", alignItems:"center",
      borderLeft: side === "buy" ? "3px solid var(--green2)" : "3px solid var(--gold2)",
          background: side === "buy" ? "rgba(60,160,60,0.04)" : "rgba(200,150,42,0.04)",
          borderBottom:"1px solid var(--border)"
    }}>
    {/* Icon */}
    <div>{r.item?.icon
      ? <img src={r.item.icon} style={{ width:34,height:34,borderRadius:4,border:"1px solid var(--border2)" }} alt="" />
      : <div style={{ width:34,height:34,background:"var(--bg4)",borderRadius:4 }} />
    }</div>
    {/* Name + meta */}
    <div style={{ paddingRight:6, minWidth:0 }}>
    <div style={{ fontSize:12, fontWeight:600, color:"var(--text1)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.item?.name || `Item ${r.id}`}</div>
    <div style={{ fontSize:10, color:"var(--text3)", marginTop:1 }}>{r.flip.snapCount} samples</div>
    </div>
    {/* Rate/hr */}
    <div style={{ textAlign:"right" }}>
    {r.sellFills != null
      ? <span style={{ fontSize:12, color: r.sellFills >= 5 ? "var(--green2)" : r.sellFills >= 1 ? "var(--gold2)" : "var(--text3)" }}>{r.sellFills.toFixed(1)}/hr</span>
      : <span style={{ color:"var(--text3)" }}>—</span>}
      </div>
      {/* Profit / spike */}
      <div style={{ textAlign:"right" }}>
      {side === "buy" && <>
        <div style={{ display:"flex", alignItems:"baseline", gap:4, justifyContent:"flex-end" }}>
        <span style={{ fontSize:10, color:"var(--text3)" }}>p75:</span>
        <span className="pp" style={{ fontSize:12 }}>+<Gold v={r.predictedProfit} size={12} /></span>
        </div>
        <div style={{ display:"flex", alignItems:"baseline", gap:4, justifyContent:"flex-end" }}>
        <span style={{ fontSize:10, color:"var(--text3)" }}>p90:</span>
        <span className="pp" style={{ fontSize:11 }}>+<Gold v={r.predictedProfitOptimistic} size={11} /></span>
        </div>
        </>}
        {side === "sell" && (
          <span style={{ color:"var(--gold2)", fontSize:12, fontWeight:600 }}>+{((r.curSell/r.flip.p50Sell-1)*100).toFixed(0)}%</span>
        )}
        </div>
        {/* Actions */}
        <div style={{ display:"flex", flexDirection:"row", gap:6, alignItems:"center", justifyContent:"flex-end", flexWrap:"nowrap", overflow:"hidden" }}>
        {side === "buy" && (<>
          <input
          type="number" min={1} max={9999} value={trackQty}
          onChange={e => setTrackQty(Math.max(1, parseInt(e.target.value) || 1))}
          style={{ width:44, background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:3, padding:"2px 4px", color:"var(--text1)", fontSize:11, textAlign:"center" }}
          />
          <button className="rbtn" style={{ fontSize:10, color:"var(--green2)", borderColor:"rgba(60,160,60,.4)", padding:"2px 5px", whiteSpace:"nowrap" }}
          onClick={() => {
            onTrack({ itemId:r.id, itemName:r.item?.name||`Item ${r.id}`, buyPrice:r.curSell,
                    qty:trackQty, targetSellPrice:r.flip.p75Sell, buyTime:Date.now(), flaggedBuyNowTs:Date.now() });
          }}>+Track</button>
          </>)}
          <button className={`cbtn${chartItem === r.id ? " on" : ""}`}
          onClick={() => setChartItem(chartItem === r.id ? null : r.id)}>
          📈
          </button>
          </div>
          </div>
          {chartItem === r.id && (
            <div style={{ padding:"0 12px 12px", borderBottom:"1px solid var(--border)", background:"var(--bg2)" }}>
            <PriceChart itemId={r.id} itemName={r.item?.name || `Item ${r.id}`} />
            </div>
          )}
          </div>
  );
}

// ── Price chart component ───────────────────────────────────────────────────
const fmtAgo = (ms) => {
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
};

function ColHeader({ label, color, count, flipCol }) {
  return (
    <div style={{ padding:"6px 12px", borderBottom:"1px solid var(--border)",
      display:"grid", gridTemplateColumns: flipCol,
      fontSize:9, fontFamily:"Cinzel,serif", letterSpacing:1, color:"var(--text3)" }}>
      <div style={{ gridColumn:"1/3", color, fontWeight:700, fontSize:10 }}>{label} <span style={{ color:"var(--text3)", fontWeight:400 }}>({count})</span></div>
      <div style={{ textAlign:"right" }}>RATE/HR</div>
      <div style={{ textAlign:"right" }}>{label === "🟢 BUY NOW" ? "PROFIT" : "SPIKE"}</div>
      <div/>
      </div>
  );
}

function PriceChart({ itemId, itemName }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [period, setPeriod] = useState("24h");
  const [d, setD] = useState([]);

  const PERIODS = [
    { key: "1h",  label: "1H",    ms: 60 * 60 * 1000 },
    { key: "24h", label: "24H",   ms: 24 * 60 * 60 * 1000 },
    { key: "3d",  label: "3D",    ms: 3  * 24 * 60 * 60 * 1000 },
    { key: "7d",  label: "7D",    ms: 7  * 24 * 60 * 60 * 1000 },
    { key: "30d", label: "30D",   ms: 30 * 24 * 60 * 60 * 1000 },
  ];

  const [noData, setNoData] = useState(false);
  const [loading, setLoading] = useState(true);
  // Guards against out-of-order responses: if the user clicks between 1H/24H/3D/7D/30D
  // quickly, several loadHistory() calls can be in flight at once (a 30D query can take
  // far longer than a 1H query). Without this guard, whichever request happens to resolve
  // LAST wins — even if it was for a period the user already clicked away from — which is
  // exactly the "sometimes shows data, sometimes doesn't" behavior. Only the response that
  // matches the most recently issued request is allowed to update state.
  const requestSeqRef = useRef(0);
  // Per-item+period cache so re-clicking a period you've already viewed this session is
  // instant instead of re-running a potentially 30+ second query every time.
  const historyCacheRef = useRef(new Map());

  useEffect(() => {
    if (!itemId) return;
    const p = PERIODS.find(p => p.key === period);
    const sinceTs = Date.now() - p.ms;
    const cacheKey = `${itemId}:${period}`;
    const mySeq = ++requestSeqRef.current;

    const cached = historyCacheRef.current.get(cacheKey);
    if (cached) {
      // Show what we already have instantly; still refetch in the background below
      // so newly-collected snapshots eventually show up without a manual reopen.
      setD(cached);
      setNoData(cached.length === 0);
      setLoading(false);
    } else {
      setLoading(true);
      setNoData(false);
    }

    loadHistory(itemId, sinceTs).then(rows => {
      if (mySeq !== requestSeqRef.current) return; // superseded by a newer request — ignore
      historyCacheRef.current.set(cacheKey, rows);
      setD(rows);
      setNoData(rows.length === 0);
      setLoading(false);
    }).catch(() => {
      if (mySeq !== requestSeqRef.current) return;
      if (!cached) { setD([]); setNoData(true); }
      setLoading(false);
    });
  }, [itemId, period]);

  const fmtDate = (ts) => {
    const dt = new Date(ts);
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " +
    dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  const fmtGoldStr = (copper) => {
    if (!copper) return "0c";
    const g = Math.floor(copper / 10000);
    const s = Math.floor((copper % 10000) / 100);
    const c = copper % 100;
    const parts = [];
    if (g) parts.push(`${g}g`);
    if (s) parts.push(`${s}s`);
    parts.push(`${c}c`);
    return parts.join(" ");
  };

  if (!d || d.length < 2) return (
    <div className="hist-wrap">
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
    <div className="hist-lbl" style={{ margin: 0 }}>PRICE HISTORY — {itemName}</div>
    <div style={{ display: "flex", gap: 4 }}>
    {PERIODS.map(p => (
      <button key={p.key}
      onClick={() => setPeriod(p.key)}
      style={{
        fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1,
        padding: "2px 8px", borderRadius: 3, cursor: "pointer",
        border: period === p.key ? "1px solid var(--gold2)" : "1px solid var(--border)",
                       background: period === p.key ? "rgba(200,150,42,0.15)" : "transparent",
                       color: period === p.key ? "var(--gold2)" : "var(--text3)",
      }}>
      {p.label}
      </button>
    ))}
    </div>
    </div>
    <div className="hist-empty">
      {loading
        ? "Loading price history…"
        : noData
          ? "No price history collected for this item — only Rare/Exotic/Ascended/Legendary items are tracked."
          : "No data for this period yet."}
    </div>
    </div>
  );

  const W = 480, H = 160;
  const PAD = { top: 24, right: 16, bottom: 36, left: 70 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const sells = d.map(p => p.sell).filter(Boolean);
  const minV = Math.min(...sells), maxV = Math.max(...sells);
  const range = maxV - minV || 1;
  const pad = range * 0.1;
  const lo = Math.max(0, minV - pad), hi = maxV + pad;

  const toX = (i) => PAD.left + (i / (d.length - 1)) * cW;
  const toY = (v) => PAD.top + cH - ((v - lo) / (hi - lo)) * cH;

  const pts = d.map((p, i) => `${toX(i)},${toY(p.sell)}`).join(" ");
  const fillPts = `${PAD.left},${PAD.top + cH} ${pts} ${PAD.left + cW},${PAD.top + cH}`;

  // Find min/max indices
  const maxIdx = sells.indexOf(maxV);
  const minIdx = sells.indexOf(minV);

  // Y-axis ticks (4 ticks)
  const yTicks = [0, 1, 2, 3].map(i => lo + (hi - lo) * (i / 3));

  // X-axis ticks (up to 5)
  const xTickCount = Math.min(5, d.length);
  const xTicks = Array.from({ length: xTickCount }, (_, i) =>
  Math.round(i * (d.length - 1) / (xTickCount - 1))
  );

  const handleMouseMove = (e) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const svgX = (e.clientX - rect.left) * (W / rect.width);
    const chartX = svgX - PAD.left;
    if (chartX < 0 || chartX > cW) { setHover(null); return; }
    const idx = Math.round((chartX / cW) * (d.length - 1));
    const clamped = Math.max(0, Math.min(d.length - 1, idx));
    setHover({ idx: clamped, x: toX(clamped), y: toY(d[clamped].sell), point: d[clamped] });
  };

  const fmtXLabel = (ts) => {
    const dt = new Date(ts);
    if (period === "1h") return dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    if (period === "24h") return dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="hist-wrap">
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
    <div className="hist-lbl" style={{ margin: 0 }}>PRICE HISTORY — {itemName}</div>
    <div style={{ display: "flex", gap: 4 }}>
    {PERIODS.map(p => (
      <button key={p.key}
      onClick={() => setPeriod(p.key)}
      style={{
        fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1,
        padding: "2px 8px", borderRadius: 3, cursor: "pointer",
        border: period === p.key ? "1px solid var(--gold2)" : "1px solid var(--border)",
                       background: period === p.key ? "rgba(200,150,42,0.15)" : "transparent",
                       color: period === p.key ? "var(--gold2)" : "var(--text3)",
      }}>
      {p.label}
      </button>
    ))}
    </div>
    </div>
    <svg
    ref={svgRef}
    width="100%"
    viewBox={`0 0 ${W} ${H}`}
    style={{ display: "block", cursor: "crosshair" }}
    onMouseMove={handleMouseMove}
    onMouseLeave={() => setHover(null)}
    >
    {/* Grid lines */}
    {yTicks.map((v, i) => (
      <line key={i} x1={PAD.left} y1={toY(v)} x2={PAD.left + cW} y2={toY(v)}
      stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    ))}

    {/* Fill */}
    <polygon points={fillPts} fill="rgba(200,150,42,0.08)" />

    {/* Line */}
    <polyline fill="none" stroke="var(--gold)" strokeWidth="1.5" points={pts} />

    {/* Y-axis labels */}
    {yTicks.map((v, i) => (
      <text key={i} x={PAD.left - 6} y={toY(v) + 4}
      fill="var(--text3)" fontSize="10" textAnchor="end" fontFamily="Cinzel,serif">
      {fmtGoldStr(Math.round(v))}
      </text>
    ))}

    {/* X-axis labels */}
    {xTicks.map((idx, i) => {
      const lbl = fmtXLabel(d[idx].ts);
      return (
        <text key={i} x={toX(idx)} y={H - 6}
        fill="var(--text3)" fontSize="10" textAnchor="middle" fontFamily="Cinzel,serif">
        {lbl}
        </text>
      );
    })}

    {/* Axes */}
    <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + cH}
    stroke="var(--border2)" strokeWidth="1" />
    <line x1={PAD.left} y1={PAD.top + cH} x2={PAD.left + cW} y2={PAD.top + cH}
    stroke="var(--border2)" strokeWidth="1" />

    {/* Max point */}
    <circle cx={toX(maxIdx)} cy={toY(maxV)} r="4"
    fill="var(--green)" stroke="var(--bg4)" strokeWidth="1.5" />
    <text x={toX(maxIdx)} y={toY(maxV) - 8}
    fill="var(--green)" fontSize="10" textAnchor="middle" fontFamily="Cinzel,serif">
    ▲ {fmtGoldStr(maxV)}
    </text>

    {/* Min point */}
    <circle cx={toX(minIdx)} cy={toY(minV)} r="4"
    fill="var(--red)" stroke="var(--bg4)" strokeWidth="1.5" />
    <text x={toX(minIdx)} y={toY(minV) + 18}
    fill="var(--red)" fontSize="10" textAnchor="middle" fontFamily="Cinzel,serif">
    ▼ {fmtGoldStr(minV)}
    </text>

    {/* Hover crosshair */}
    {hover && (
      <>
      <line x1={hover.x} y1={PAD.top} x2={hover.x} y2={PAD.top + cH}
      stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="3,3" />
      <circle cx={hover.x} cy={hover.y} r="5"
      fill="var(--gold2)" stroke="var(--bg4)" strokeWidth="2" />
      {/* Tooltip box */}
      {(() => {
        const bx = hover.x + 10 > PAD.left + cW - 140 ? hover.x - 155 : hover.x + 10;
        return (
          <g>
          <rect x={bx} y={hover.y - 32} width={145} height={44}
          fill="var(--bg4)" stroke="var(--gold)" strokeWidth="1" rx="3" />
          <text x={bx + 8} y={hover.y - 14}
          fill="var(--gold2)" fontSize="12" fontFamily="Cinzel,serif" fontWeight="600">
          {fmtGoldStr(hover.point.sell)}
          </text>
          <text x={bx + 8} y={hover.y + 4}
          fill="var(--text3)" fontSize="10" fontFamily="Cinzel,serif">
          {fmtDate(hover.point.ts)}
          </text>
          </g>
        );
      })()}
      </>
    )}
    </svg>
    <div style={{ display: "flex", gap: 20, marginTop: 6, fontSize: 12, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 0.5 }}>
    <span>{d.length} snapshots</span>
    <span>from {fmtAgo(Date.now() - d[0].ts)}</span>
    <span style={{ color: "var(--green)" }}>▲ {fmtGoldStr(maxV)}</span>
    <span style={{ color: "var(--red)" }}>▼ {fmtGoldStr(minV)}</span>
    </div>
    </div>
  );
}

// ── Shared expanded card body ────────────────────────────────────────────────
// forgeableIds: set of item IDs that have a Mystic Forge material promotion recipe.
// Hoisted to module scope (was previously local to CraftingTab's useMemo) so
// CraftDetailBody below — shared by Crafting Profits AND Recommended — can use it.
const forgeableOutputIds = new Set([
  19739,19741,19743,19748,19745, // wool/cotton/linen/silk/gossamer scrap
  19728,19730,19731,19729,19732, // leather sections thin-hardened
  19699,19698,19702,19700,19701, // iron/gold/platinum/mithril/orichalcum ore
  19726,19727,19724,19722,19725, // soft/seasoned/hard/elder/ancient wood log
  19740,19742,19744,19747,19746, // bolts wool-gossamer
  19733,19734,19736,19735,19737, // cured leather squares
  19687,19683,19682,19688,19686,19684,19685, // silver/iron/gold/steel/platinum/mithril/orichalcum ingot
  19713,19714,19711,19709,19712, // soft/seasoned/hard/elder/ancient wood plank
  24273,24274,24275,24276,24277, // shimmering-crystalline dust
  24343,24344,24345,24341,24358, // bone shard/bone/heavy bone/large bone/ancient bone
  24347,24348,24349,24350,24351, // small-vicious claw
  24353,24354,24355,24356,24357, // small-vicious fang
  24285,24286,24287,24288,24289, // small-armored scale
]);

// CraftDetailBody renders the full expanded card contents for a craft item —
// ingredient tree (with intermediary crafting sub-trees), buy-order savings,
// your active TP listings for the output, the "selling mats beats crafting"
// warning, and the cheapest-acquisition path for missing materials. This is
// the exact body Crafting Profits has always shown; it's extracted here so
// the Recommended tab can render an IDENTICAL card body instead of just a
// "go look in Crafting Profits" link — a card for the same recipe looks the
// same whether opened from its discipline tab or from Recommended.
function CraftDetailBody({ ci, itemMap, priceMap, ownedMap, resolvedRecipes, charInventoryByChar, charDisciplines, myListings, velocitySummary, setActiveTab }) {
  // Characters able to craft this recipe — any character with at least one of
  // the recipe's disciplines. Used to figure out which OTHER characters are
  // sitting on ingredients the crafter(s) don't have in their own bags.
  const recipeDiscs = getRecipeDisciplines(ci);
  const crafterNames = charDisciplines
    ? Object.entries(charDisciplines)
        .filter(([, discs]) => discs.some(d => recipeDiscs.includes(d)))
        .map(([name]) => name)
    : [];

  const findItemOnOtherChar = (itemId, needed) => {
    if (!charInventoryByChar) return null;
    const crafterHas = crafterNames.reduce((sum, n) => sum + (charInventoryByChar[n]?.[itemId] || 0), 0);
    if (crafterHas >= needed) return null; // crafters have enough, no note needed
    const others = Object.entries(charInventoryByChar)
      .filter(([name]) => !crafterNames.includes(name))
      .map(([name, inv]) => ({ name, count: inv[itemId] || 0 }))
      .filter(c => c.count > 0);
    if (others.length === 0) return null;
    return others;
  };

  const matDetailMap = Object.fromEntries(ci.matDetails.map(m => [m.itemId, m]));
  const renderNode = (node, depth = 0) => {
    const rows = [];
    for (const [idx, child] of node.children.entries()) {
      const item = itemMap[child.itemId];
      const isIntermediary = !child.isLeaf; // has a recipe (craftable intermediary)
      const m = matDetailMap[child.itemId]; // leaf status info if it's a base mat
      const owned = ownedMap?.[child.itemId] || 0;

      if (isIntermediary) {
        const canMakeIt = checkFulfillment(child.itemId, child.count, resolvedRecipes, ownedMap);
        const fulfilledFromOwned = owned >= child.count;
        const statusCol = fulfilledFromOwned ? "var(--green)" : canMakeIt.canFulfill ? "var(--gold)" : "var(--red)";
        const statusLabel = fulfilledFromOwned
          ? `✓ ${owned}`
          : canMakeIt.canFulfill
          ? owned > 0 ? `⚒ ${owned}/${child.count}` : `⚒ 0/${child.count} (craftable)`
          : owned > 0 ? `✗ ${owned}/${child.count}` : `✗ 0/${child.count}`;
        rows.push(
          <div key={`int-${child.itemId}-${depth}-${idx}`} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "7px 10px",
            marginLeft: depth * 20,
            borderRadius: 3,
            background: depth === 0 ? "rgba(200,150,42,0.06)" : "rgba(200,150,42,0.03)",
            borderLeft: `2px solid rgba(200,150,42,${0.5 - depth * 0.15})`,
            marginBottom: 2,
          }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
              {item?.icon && <img className="iico-sm" src={item.icon} alt="" />}
              <span className={`rar-${item?.rarity}`} style={{ fontWeight: 600 }}>{item?.name || `Item ${child.itemId}`}</span>
              {!fulfilledFromOwned && <span style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, color: canMakeIt.canFulfill ? "var(--gold2)" : "var(--red)", padding: "1px 6px", borderRadius: 2, border: `1px solid ${canMakeIt.canFulfill ? "rgba(200,150,42,0.4)" : "rgba(200,80,80,0.4)"}`, background: canMakeIt.canFulfill ? "rgba(200,150,42,0.1)" : "rgba(200,80,80,0.1)" }}>CRAFT</span>}
            </div>
            <span style={{ width: 60, color: "var(--text3)", fontSize: 14 }}>×{child.count}</span>
            <span style={{ width: 110, fontSize: 13, color: statusCol }}>{statusLabel}</span>
            <span style={{ width: 130 }} />
            <span style={{ width: 130 }} />
          </div>
        );
        // Only show sub-ingredients if we don't already have enough of this intermediary
        if (!fulfilledFromOwned) {
          rows.push(...renderNode(child, depth + 1));
        }
      } else {
        // Leaf: base material
        const effectiveNeeded = m ? m.needed : child.count;
        const effectiveStatus = m?.status ?? (owned >= child.count ? "have" : "mustBuy");
        const col = effectiveStatus === "have" ? "var(--green)" : effectiveStatus === "hasMaterials" ? "var(--gold)" : "var(--red)";
        const label = effectiveStatus === "have" ? `✓ ${owned}` : effectiveStatus === "hasMaterials" ? `⚒ ${owned}/${effectiveNeeded}` : `✗ ${owned}/${effectiveNeeded}`;
        const isMustBuy = effectiveStatus === "mustBuy";
        const shortage = Math.max(0, effectiveNeeded - owned);
        const onOther = shortage > 0 ? findItemOnOtherChar(child.itemId, child.count) : null;
        rows.push(
          <div key={`leaf-${child.itemId}-${depth}-${idx}`} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "6px 10px",
            marginLeft: depth * 20,
            borderRadius: 3,
            borderLeft: depth > 0 ? "2px solid rgba(255,255,255,0.05)" : "none",
            marginBottom: 1,
          }}
          className="r-row"
          >
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {item?.icon && <img className="iico-sm" src={item.icon} alt="" />}
              <span className={`rar-${item?.rarity}`}>{item?.name || `Item ${child.itemId}`}</span>
              {m?.vendorPrice && m?.tpSell > 0 && isMustBuy && m?.bestSource === "tp" && (
                <span className="src-tp">📊 TP cheaper than vendor</span>
              )}
              {isMustBuy && forgeableOutputIds.has(child.itemId) && (
                <span
                  title="This item can be made cheaper in the Mystic Forge — check the ⚗ Mystic Forge tab"
                  onClick={e => { e.stopPropagation(); setActiveTab("mysticforge"); }}
                  style={{ fontSize: 10, color: "#a060e0", background: "rgba(160,90,220,.15)", border: "1px solid rgba(160,90,220,.35)", borderRadius: 3, padding: "1px 6px", cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 0.5 }}>
                  ⚗ Mystic Forge
                </span>
              )}
              {onOther && onOther.map(c => (
                <span key={c.name} style={{ fontSize: 11, color: "var(--gold2)", background: "rgba(200,150,42,0.1)", border: "1px solid rgba(200,150,42,0.3)", borderRadius: 3, padding: "1px 6px", fontFamily: "Cinzel,serif", letterSpacing: 0.5 }}>
                  📦 {c.count} on {c.name}
                </span>
              ))}
            </div>
            <span style={{ width: 60, color: "var(--text3)", fontSize: 14 }}>×{child.count}</span>
            <span style={{ width: 110, fontSize: 13, color: col || "var(--text3)" }}>
              {label || `${owned}`}
              {m?.status === "hasMaterials" && <span style={{ fontSize: 11, marginLeft: 4, opacity: .7 }}>(craftable)</span>}
            </span>
            <span style={{ width: 130, textAlign: "right" }}>{isMustBuy && m?.bestBuyPrice ? <Gold v={m.bestBuyPrice} /> : <span style={{ color: "var(--text3)" }}>—</span>}</span>
            <span style={{ width: 130, textAlign: "right" }}>{isMustBuy && m?.bestBuyPrice ? <Gold v={m.bestBuyPrice * child.count} /> : <span style={{ color: "var(--text3)" }}>—</span>}</span>
          </div>
        );
      }
    }
    return rows;
  };

  return (
    <div className="ci-body">
      {/* Ingredient tree — shows intermediary crafts with sub-ingredients indented */}
      <div className="r-tree">
        <div className="r-hdr">
          <span style={{ flex: 1 }}>Ingredient</span>
          <span style={{ width: 60 }}>Need</span>
          <span style={{ width: 110 }}>Status</span>
          <span style={{ width: 130, textAlign: "right" }}>Unit Price</span>
          <span style={{ width: 130, textAlign: "right" }}>Total</span>
        </div>
        {ci.tree ? renderNode(ci.tree) : ci.matDetails.map(m => {
          // Fallback to flat list if no tree
          const item = itemMap[m.itemId];
          const col = m.status === "have" ? "var(--green)" : m.status === "hasMaterials" ? "var(--gold)" : "var(--red)";
          const label = m.status === "have" ? `✓ ${m.owned}` : m.status === "hasMaterials" ? `⚒ ${m.owned}/${m.needed}` : `✗ ${m.owned}/${m.needed}`;
          const isMustBuy = m.status === "mustBuy";
          return (
            <div key={m.itemId} className="r-row">
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                {item?.icon && <img className="iico-sm" src={item.icon} alt="" />}
                <span className={`rar-${m.rarity}`}>{m.name}</span>
              </div>
              <span style={{ width: 60, color: "var(--text3)", fontSize: 14 }}>×{m.needed}</span>
              <span style={{ width: 110, fontSize: 13, color: col }}>{label}</span>
              <span style={{ width: 130, textAlign: "right" }}>{isMustBuy ? <Gold v={m.bestBuyPrice} /> : <span style={{ color: "var(--text3)" }}>—</span>}</span>
              <span style={{ width: 130, textAlign: "right" }}>{isMustBuy ? <Gold v={m.bestBuyPrice * m.needed} /> : <span style={{ color: "var(--text3)" }}>—</span>}</span>
            </div>
          );
        })}
        <div className="r-row r-tot">
          <span style={{ flex: 1, fontFamily: "Cinzel,serif", fontSize: 11, letterSpacing: 1, color: "var(--text3)" }}>TOTAL MUST-BUY COST</span>
          <span style={{ width: 60 }} /><span style={{ width: 110 }} /><span style={{ width: 130 }} />
          <span style={{ width: 130, textAlign: "right", color: "var(--red)" }}><Gold v={ci.totalMustBuyCostSell} /></span>
        </div>
      </div>

      {/* Buy order suggestions: ingredients where placing a buy order saves gold ──
          Only shown for ingredients that need to be purchased AND have active buy fills */}
      {(() => {
        const mustBuyMats = ci.matDetails.filter(m => m.status === "mustBuy" && m.bestBuyPrice > 0);
        const suggestions = mustBuyMats.map(m => {
          const priceData = priceMap[m.itemId];
          const askPrice = priceData?.sells?.unit_price || m.bestBuyPrice;
          const bidPrice = priceData?.buys?.unit_price || 0;
          if (!bidPrice || bidPrice <= 0) return null;
          const savingPer = askPrice - bidPrice;
          const savingTotal = savingPer * m.needed;
          if (savingPer <= 1) return null; // no meaningful savings
          const vel = velocitySummary[m.itemId];
          const buyFills = vel?.observations >= 5 ? vel.buyFillsPerHr : null;
          if (buyFills != null && buyFills < 0.05) return null; // bids never get filled
          const savingPct = askPrice > 0 ? (savingPer / askPrice) * 100 : 0;
          if (savingPct < 2) return null; // less than 2% savings not worth mentioning
          return { ...m, askPrice, bidPrice, savingPer, savingTotal, savingPct, buyFills };
        }).filter(Boolean).sort((a,b) => b.savingTotal - a.savingTotal);

        if (suggestions.length === 0) return null;
        return (
          <div style={{ margin:"10px 0", padding:"10px 14px", borderRadius:4, background:"rgba(90,160,90,0.07)", border:"1px solid rgba(90,160,90,0.25)" }}>
            <div style={{ fontFamily:"Cinzel,serif", fontSize:11, letterSpacing:1, color:"var(--green)", marginBottom:8 }}>
              💡 BUY ORDER SAVINGS
              <span style={{ fontFamily:"var(--font-body)", fontSize:12, color:"var(--text3)", letterSpacing:0, marginLeft:8, fontStyle:"italic" }}>
                Place buy orders instead of buying at ask price:
              </span>
            </div>
            {suggestions.map(s => {
              const item = itemMap[s.itemId];
              return (
                <div key={s.itemId} style={{ display:"flex", alignItems:"center", gap:12, fontSize:13, padding:"4px 0", borderBottom:"1px solid rgba(90,160,90,0.12)" }}>
                  {item?.icon && <img className="iico-sm" src={item.icon} alt="" />}
                  <span style={{ flex:1, color:"var(--text2)" }}>{s.name} ×{s.needed}</span>
                  <span style={{ color:"var(--text3)", fontSize:12 }}>ask <Gold v={s.askPrice} size={12} /></span>
                  <span style={{ color:"var(--green2)", fontSize:12 }}>bid <Gold v={s.bidPrice} size={12} /></span>
                  <span style={{ color:"var(--green2)", fontWeight:600 }}>save <Gold v={s.savingTotal} size={12} /></span>
                  <span style={{ color:"var(--text3)", fontSize:11 }}>({s.savingPct.toFixed(1)}%)</span>
                  {s.buyFills != null && <span style={{ fontSize:11, color:"var(--text3)" }}>{s.buyFills.toFixed(2)} fills/hr</span>}
                </div>
              );
            })}
            <div style={{ marginTop:6, paddingTop:6, borderTop:"1px solid rgba(90,160,90,0.15)", fontSize:12, color:"var(--green2)" }}>
              Total potential savings: <Gold v={suggestions.reduce((s,x)=>s+x.savingTotal,0)} size={12} />
              <span style={{ color:"var(--text3)", marginLeft:8 }}>— buy orders may take time to fill</span>
            </div>
          </div>
        );
      })()}

      {/* My TP listings for this item */}
      {(() => {
        const listings = myListings[ci.outputId] || [];
        if (listings.length === 0) return null;
        const now = Date.now();
        return (
          <div style={{ margin: "12px 0", padding: "10px 14px", borderRadius: 4, background: "rgba(80,120,200,0.08)", border: "1px solid rgba(80,120,200,0.3)" }}>
            <div style={{ fontFamily: "Cinzel,serif", fontSize: 11, letterSpacing: 1, color: "#8aabee", marginBottom: 8 }}>🏪 YOUR TP LISTINGS</div>
            {listings.map((l, i) => {
              const listedMs = now - new Date(l.created).getTime();
              const listedDays = Math.floor(listedMs / 86400000);
              const listedHrs = Math.floor((listedMs % 86400000) / 3600000);
              const age = listedDays > 0 ? `${listedDays}d ${listedHrs}h ago` : `${listedHrs}h ago`;
              return (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 13, padding: "3px 0", borderBottom: i < listings.length - 1 ? "1px solid rgba(80,120,200,0.15)" : "none" }}>
                  <span style={{ color: "var(--text2)" }}>×{l.quantity}</span>
                  <Gold v={l.price} size={13} />
                  <span style={{ color: "var(--text3)", fontSize: 12 }}>listed {age}</span>
                  {listedDays >= 7 && <span style={{ fontSize: 11, color: "var(--red)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>⚠ EXPIRING SOON</span>}
                </div>
              );
            })}
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(80,120,200,0.2)", fontSize: 12, color: "#8aabee" }}>
              {listings.reduce((s,l) => s+l.quantity, 0)} total listed · est. value <Gold v={listings.reduce((s,l) => s + Math.floor(l.price * l.quantity * 0.85), 0)} size={12} /> after tax
            </div>
          </div>
        );
      })()}

      {/* Best sell path — only itemize if selling mats beats crafting */}
      {ci.matSellPaths.length > 0 && ci.matSellNet > ci.profitNet && (
        <div className="sell-path">
          <div className="sell-path-lbl">⚠ SELLING MATS IS MORE PROFITABLE THAN CRAFTING</div>
          {ci.matSellPaths.map((p, i) => (
            <div key={i}>
              {(p.path || []).map((it, j) => (
                <div key={j} className="sell-path-item">
                  <span className={`rar-${itemMap[it.itemId]?.rarity}`}>{it.name} ×{it.count}</span>
                  <Gold v={Math.floor(it.sellPrice * it.count * 0.85)} size={13} />
                </div>
              ))}
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(200,150,42,.2)", fontWeight: 600 }}>
            <span style={{ fontSize: 12, color: "var(--gold)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>TOTAL</span>
            <Gold v={ci.matSellNet} />
          </div>
        </div>
      )}

      {/* Cheapest acquire path */}
      {!ci.canCraft && ci.cheapAcquire.path.filter(p => p.needed > 0).length > 0 && (
        <div className="cheap-path">
          <div className="cheap-path-lbl">CHEAPEST WAY TO ACQUIRE MISSING MATERIALS</div>
          {ci.cheapAcquire.path.filter(p => p.needed > 0 && (p.name || p.unitPrice > 0)).map((p, i) => {
            const displayName = itemMap[p.itemId]?.name || VENDOR_PRICES[p.itemId]?.name || p.name || `Item ${p.itemId}`;
            return (
              <div key={i} className="r-row" style={{ padding: "5px 0" }}>
                <span style={{ flex: 1, fontSize: 14, color: "var(--text2)" }}>{displayName} ×{p.needed}</span>
                {p.source === "tp" && <span className="src-tp">📊 TP</span>}
                {p.source === "owned" && <span className="src-owned">✓ owned</span>}
                {p.source === "vendor" && p.tpPrice > 0 && p.tpPrice < p.unitPrice && (
                  <span className="src-tp">📊 TP cheaper</span>
                )}
                <span style={{ marginLeft: 10, minWidth: 100, textAlign: "right" }}><Gold v={p.unitPrice * p.needed} size={14} /></span>
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(90,160,90,.2)", fontWeight: 600 }}>
            <span style={{ fontSize: 12, color: "var(--green)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>TOTAL ACQUISITION COST</span>
            <Gold v={ci.cheapAcquire.cost} />
          </div>
        </div>
      )}
    </div>
  );
}

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
          cacheRef.current.lockedRecipes = mergedDetails;
          await Promise.all([
            cacheSet("allGameRecipeIds", mergedIds),
            cacheSet("allGameRecipes", mergedDetails),
          ]);
          setUnlearnedRecipeCount(mergedDetails.length);
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

  // ── Friend Recipe Lookup: friend-only craft candidates ──────────────────────
  // Recipes the user does NOT know, but at least one added friend does. Reuses
  // the exact lockedCraftItems pipeline above (full-catalog recipe details ×
  // the user's own materials/prices) rather than any friend-side data, so
  // craftAdvantage/canCraft/sellFillsPerHr scoring is identical to the user's
  // own recipes and always reflects the LOCAL user's inventory only — the
  // "still only show your materials" requirement falls out of this for free,
  // since lockedCraftItems was already built against cacheRef.current.ownedMap.
  const friendOnlyCraftItems = useMemo(() => {
    if (!lockedCraftItems.length || Object.keys(friendRecipeMap).length === 0) return [];
    return lockedCraftItems
      .filter(ci => friendRecipeMap[ci.recipeId])
      .map(ci => ({ ...ci, friendBadges: friendRecipeMap[ci.recipeId], isFriendOnly: true }));
  }, [lockedCraftItems, friendRecipeMap]);

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
    if (!data?.byDisc || Object.keys(friendRecipeMap).length === 0) return map;
    const trulyKnownIds = new Set(cacheRef.current.knownRecipeIds || []);
    const seen = new Set();
    for (const disc of Object.keys(data.byDisc)) {
      for (const ci of (data.byDisc[disc] || [])) {
        if (seen.has(ci.recipeId) || trulyKnownIds.has(ci.recipeId)) continue;
        const badges = friendRecipeMap[ci.recipeId];
        if (!badges) continue;
        seen.add(ci.recipeId);
        map[ci.recipeId] = badges;
      }
    }
    return map;
  }, [data, friendRecipeMap]);

  // ── Friend key management ────────────────────────────────────────────────────
  const handleAddFriend = useCallback(async () => {
    const name = friendNameInput.trim();
    const key = friendKeyInput.trim();
    if (!name || !key) { setFriendActionMsg({ ok: false, text: "Name and API key are both required." }); return; }
    setFriendBusy(true); setFriendActionMsg(null);
    try {
      const summary = await addFriendKey(name, key);
      setFriends(prev => [...prev, summary]);
      const entries = await getFriendRecipesKnown();
      setFriendRecipeMap(buildFriendRecipeMap(entries));
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
      const entries = await getFriendRecipesKnown();
      setFriendRecipeMap(buildFriendRecipeMap(entries));
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
      const lockedItemIds = new Set();
      merged.forEach(r => {
        lockedItemIds.add(r.output_item_id);
        (r.ingredients || []).forEach(ing => lockedItemIds.add(ing.item_id));
      });
      const missingItemIds = [...lockedItemIds].filter(id => id && !itemMap[id]);
      if (missingItemIds.length) {
        const ni = await fetchIds("/items", missingItemIds);
        ni.forEach(i => { itemMap[i.id] = i; });
      }
      const missingPriceIds = filterTradeable([...lockedItemIds], itemMap).filter(id => !priceMap[id]);
      if (missingPriceIds.length) {
        const np = await fetchPrices(missingPriceIds);
        Object.assign(priceMap, np);
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
        if (stale) refreshUnlearnedRecipesCatalog();
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
      const [refreshed, entries] = await Promise.all([
        getFriends().catch(() => list),
        getFriendRecipesKnown().catch(() => []),
      ]);
      setFriends(refreshed);
      setFriendRecipeMap(buildFriendRecipeMap(entries));
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
  const sortBy = (arr, k, d) => [...arr].sort((a, b) => {
    const av = a[k] ?? -Infinity, bv = b[k] ?? -Infinity;
    return typeof av === "string" ? d * av.localeCompare(bv) : d * (av - bv);
  });

  const fmtCd = (ms) => {
    const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  };

  const SortTh = ({ label, k, s, setS, ...rest }) => (
    <th className={s.k === k ? "srt" : ""} onClick={() => setS(p => ({ k, d: p.k === k ? p.d * -1 : -1 }))} {...rest}>
    {label}{s.k === k && <span style={{ marginLeft: 5, opacity: .6 }}>{s.d === 1 ? "↑" : "↓"}</span>}
    </th>
  );

  const P2 = ({ sell, buy }) => (
    <div className="p2">
    <span className="psell"><Gold v={sell} /></span>
    <span className="pbuy"><Gold v={buy} size={13} /> <span className="plbl">buy</span></span>
    </div>
  );

  // ── Price chart (defined at module level) ──────────────────────────────────

  // ── Status bar ──────────────────────────────────────────────────────────────
  const StatusBar = () => (
    <div className="sbar">
    <div className={`sdot${refreshing ? " spin" : secsAgo > 90 ? " warn" : ""}`} />
    <span style={{ color: "var(--text3)", fontSize: 13 }}>
    Updated: <span style={{ color: "var(--text2)" }}>{secsAgo < 3 ? "just now" : `${secsAgo}s ago`}</span>
    </span>
    <span style={{ color: "var(--border2)" }}>|</span>
    <div className="cd-wrap">
    <div className="cd-item">
    <span>prices in</span>
    <div className="cd-bar-w"><div className={`cd-bar cd-p`} style={{ width: `${(nextPriceIn / PRICE_REFRESH_MS) * 100}%` }} /></div>
    <span style={{ color: "var(--gold)", minWidth: 36 }}>{fmtCd(nextPriceIn)}</span>
    </div>
    <div className="cd-item">
    <span>recipes in</span>
    <div className="cd-bar-w"><div className={`cd-bar cd-r`} style={{ width: `${(nextRecipeIn / RECIPE_REFRESH_MS) * 100}%` }} /></div>
    <span style={{ color: "var(--blue)", minWidth: 36 }}>{fmtCd(nextRecipeIn)}</span>
    </div>
    </div>
    <button className="rbtn" disabled={refreshing} onClick={refreshPrices} style={{ marginLeft: "auto" }}>
    {refreshing ? "↻ Updating..." : "↺ Refresh Now"}
    </button>
    </div>
  );

  // ── Materials tab ────────────────────────────────────────────────────────────
  const MaterialsTab = useMemo(() => {
    if (!data) return null;
    const rows = sortBy(
      data.materialRows.filter(r => r.name.toLowerCase().includes(searchMat.toLowerCase())),
                        sortMat.k, sortMat.d
    );
    // Best crafting use: craftAdvantage * velocity
    const getBest = (id) => data.craftItems
    .filter(ci => ci.outputId !== id && ci.matDetails.some(m => m.itemId === id) && ci.craftAdvantage > 0)
    .map(ci => {
      const vel = velocitySummary[ci.outputId];
      const sellFills = vel?.observations >= 5 ? vel.sellFillsPerHr : null;
      const advantage = ci.craftAdvantage;
      let score;
      if (sellFills === 0 || sellFills == null) score = advantage * 0.01;
      else score = advantage * sellFills;
      return { ...ci, score };
    })
    .sort((a, b) => b.score - a.score).slice(0, 3);

    return (
      <div>
      <div className="ctrl">
      <input
      className="si"
      placeholder="Search materials..."
      value={searchMat}
      onChange={e => { setSearchMat(e.target.value); setMatPage(0); }}
      />
      </div>
      {priceAlerts.length > 0 && (
        <div className="alert-banner">
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10, gap: 16 }}>
        <strong style={{ flex: 1 }}>📈 PRICE NEAR 7-DAY HIGH — GOOD TIME TO SELL</strong>
        <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>SORT:</span>
        {[["totalNet","Total Profit"],["cur","Unit Price"],["pctOfMax","% of 7d Max"]].map(([k, label]) => (
          <span key={k} onClick={() => setAlertSort(k)}
          style={{ cursor: "pointer", fontSize: 11, padding: "2px 8px", borderRadius: 3, fontFamily: "Cinzel,serif", letterSpacing: 1,
            border: `1px solid ${alertSort === k ? "var(--gold)" : "var(--border)"}`,
                                                                                                            color: alertSort === k ? "var(--gold2)" : "var(--text3)",
                                                                                                            background: alertSort === k ? "rgba(200,150,42,0.1)" : "transparent" }}>
                                                                                                            {label}
                                                                                                            </span>
        ))}
        </div>
        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 70px 130px 130px 130px 110px", gap: "0 12px", alignItems: "center",
          padding: "4px 6px", marginBottom: 4, borderBottom: "1px solid var(--border2)" }}>
          <span />
          <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>ITEM</span>
          <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>COUNT</span>
          <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>UNIT PRICE</span>
          <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>TOTAL NET</span>
          <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>7D HIGH</span>
          <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>STATUS</span>
          </div>
          {[...priceAlerts].sort((a, b) => b[alertSort] - a[alertSort]).map(a => (
            <div key={a.id} className="alert-item" style={{ display: "grid", gridTemplateColumns: "28px 1fr 70px 130px 130px 130px 110px", gap: "0 12px", alignItems: "center" }}>
            {a.icon ? <img src={a.icon} style={{ width: 22, height: 22, borderRadius: 2, border: "1px solid var(--border2)" }} alt="" /> : <span />}
            <span style={{ fontSize: 15 }}>{a.name}</span>
            <span style={{ fontSize: 13, color: "var(--text2)" }}>×{a.count.toLocaleString()}</span>
            <span><Gold v={a.cur} size={14} /></span>
            <span><Gold v={a.totalNet} size={14} /></span>
            <span><Gold v={a.sevenDayMax} size={13} /></span>
            <span style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 3, textAlign: "center",
              background: a.isNewHigh ? "rgba(90,200,90,0.15)" : "rgba(200,150,42,0.15)",
                                                                                  color: a.isNewHigh ? "var(--green2)" : "var(--gold2)",
                                                                                  fontFamily: "Cinzel,serif", letterSpacing: 1, whiteSpace: "nowrap",
            }}>
            {a.isNewHigh ? "🏆 NEW HIGH" : `${a.pctOfMax}% of max`}
            </span>
            </div>
          ))}
          </div>
      )}
      {rows.length > PAGE_SIZE && (
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0", fontSize:12, fontFamily:"Cinzel,serif", letterSpacing:1, color:"var(--text3)" }}>
        <button className="rbtn" disabled={matPage === 0} onClick={() => setMatPage(p => p-1)}>← Prev</button>
        <span>Page {matPage+1} of {Math.ceil(rows.length/PAGE_SIZE)} · {rows.length} materials</span>
        <button className="rbtn" disabled={(matPage+1)*PAGE_SIZE >= rows.length} onClick={() => setMatPage(p => p+1)}>Next →</button>
        </div>
      )}
      <div className="tw">
      <table>
      <thead>
      <tr>
      <SortTh label="Material" k="name" s={sortMat} setS={setSortMat} style={{ width: "36%" }} />
      <SortTh label="Count" k="count" s={sortMat} setS={setSortMat} />
      <SortTh label="TP Sell Price (net)" k="sellPriceNet" s={sortMat} setS={setSortMat} />
      <SortTh label="Total Value (after tax)" k="totalValue" s={sortMat} setS={setSortMat} />
      <th>Best Crafting Use</th>
      <th>Price History</th>
      </tr>
      </thead>
      <tbody>
      {rows.slice(matPage*PAGE_SIZE, (matPage+1)*PAGE_SIZE).map(row => {
        const best = getBest(row.id);
        return (
          <React.Fragment key={row.id}>
          <tr>
          <td><div className="ic">{row.icon ? <img className="iico" src={row.icon} alt="" /> : <div className="iico-ph" />}<span className={`rar-${row.rarity}`}>{row.name}</span></div></td>
          <td>{row.count.toLocaleString()}</td>
          <td>
          <div className="p2">
          <span className="psell"><Gold v={row.sellPriceNet} /></span>
          <span style={{ fontSize: 12, color: "var(--text3)" }}>(<Gold v={row.sellPrice} size={12} /> before tax)</span>
          </div>
          <TrendBadge trend={trendSummary[row.id]} />
          </td>
          <td><Gold v={row.totalValue} /></td>
          <td>
          {best.length > 0 ? <BestCraftingUseCell best={best} velocitySummary={velocitySummary} trendSummary={trendSummary} /> : <span style={{ color: "var(--text3)" }}>—</span>}
          </td>
          <td>
          <button
          onClick={() => setHistoryItem(historyItem === row.id ? null : row.id)}
          style={{ fontSize: 12, color: historyItem === row.id ? "var(--gold2)" : "var(--text3)", background: "transparent", border: "1px solid var(--border)", borderRadius: 3, padding: "3px 10px", cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
          {historyItem === row.id ? "▲ Hide" : "📈 Chart"}
          </button>
          </td>
          </tr>
          {historyItem === row.id && (
            <tr>
            <td colSpan={6} style={{ padding: 0, background: "var(--bg2)", borderBottom: "2px solid var(--border2)" }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ padding: "14px 16px", width: 560 }}>
            <PriceChart itemId={row.id} itemName={row.name} />
            </div>
            </div>
            </td>
            </tr>
          )}
          </React.Fragment>
        );
      })}
      <tr>
      <td colSpan={3} className="tfoot" style={{ color: "var(--text3)", fontSize: 13 }}>{rows.length} materials · values shown after 15% TP tax</td>
      <td className="tfoot"><Gold v={rows.reduce((s, r) => s + r.totalValue, 0)} /></td>
      <td className="tfoot" colSpan={2} />
      </tr>
      </tbody>
      </table>
      </div>
      </div>
    );
  }, [data, searchMat, sortMat, historyItem, priceAlerts, trendSummary, matPage]);

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

  const RecommendedTab = useMemo(() => {
    if (!data) return null;

    // Gather all craft items across every discipline (including any non-standard
    // discipline bucket, e.g. "Uncategorized"), deduplicated by recipeId — NOT
    // outputId, since some items have multiple valid recipes (different materials/
    // costs) that must each show up as their own entry, not collapse into one.
    const seen = new Set();
    const allItems = [];
    for (const disc of Object.keys(data.byDisc)) {
      for (const ci of (data.byDisc[disc] || [])) {
        if (!seen.has(ci.recipeId)) {
          seen.add(ci.recipeId);
          allItems.push(ci);
        }
      }
    }

    // Attach a friend badge onto items that already exist above because they're Discovery-eligible
    // (rating met) but not genuinely discovered — see friendKnownEligibleBadges. Never adds or
    // removes an item, only decorates an existing one with a badge if a friend genuinely knows it.
    if (friendFilter.enabled && Object.keys(friendKnownEligibleBadges).length > 0) {
      for (let i = 0; i < allItems.length; i++) {
        const badges = friendKnownEligibleBadges[allItems[i].recipeId];
        if (!badges) continue;
        const visibleBadges = badges.filter(b => friendFilter.byFriend[b.friendId] !== false);
        if (visibleBadges.length === 0) continue;
        allItems[i] = { ...allItems[i], friendBadges: visibleBadges };
      }
    }

    // Friend-only candidates: recipes the user doesn't know but an added friend
    // does. These are never in data.byDisc (they're not known/learned), so they
    // can't already be in `seen` — merged in here, scored by the exact same
    // formula below since they carry the same shape (craftAdvantage, outputId,
    // matDetails, tree, etc.) as any other craft item. Gated by the master
    // "show friend-known recipes" toggle + per-friend selection.
    for (const ci of friendOnlyCraftItems) {
      if (seen.has(ci.recipeId)) continue;
      if (!passesFriendFilter(ci, friendFilter)) continue;
      seen.add(ci.recipeId);
      allItems.push(ci);
    }

    // Base materials as "sell raw" candidates - only if toggled on
    // Prevent duplicates by checking seen set (some materials also have craft recipes)
    const matCandidates = showRecMaterials ? data.materialRows
    .filter(r => r.sellPrice > 0 && r.count > 0 && !seen.has(r.id))
    .map(r => ({
      outputId: r.id, recipeId: `mat_${r.id}`, name: r.name, icon: r.icon, rarity: r.rarity,
      profitNet: r.sellPriceNet, profitGross: r.sellPrice,
      isMaterial: true, disciplines: ["Raw Material"],
      canCraft: true, missingMats: [], matDetails: [], tree: null,
      outSell: r.sellPrice, totalMustBuyCostSell: 0,
    })) : [];

    // Filter to daily craft items only if showRecDaily is off
    const dailyIds = new Set(Object.values(DAILY_CRAFT_MAP).map(v => v.itemId));

    let items = [
      ...(showRecMissing ? allItems : allItems.filter(i => i.canCraft)),
                                 ...matCandidates,
    ].filter(i => showRecDaily || !dailyIds.has(i.outputId))
    .filter(i => showRecDailyOutputs || !treeUsesDailyIngredient(i.tree, ALL_DAILY_CRAFT_IDS))
    .filter(i => passesRarityFilter(i.rarity, rarityFilter))
    .filter(i => i.name.toLowerCase().includes(searchCraft.toLowerCase()))


    // Score all items
    const MIN_OBS = 5;
    items = items.map(ci => {
      const vel = velocitySummary[ci.outputId];
      const hasVel = vel && vel.observations >= MIN_OBS;
      const sellRate = hasVel ? vel.sellFillsPerHr : null;
      const buyRate  = hasVel ? vel.buyFillsPerHr  : null;
      const demandRate = hasVel ? (sellRate * 2 + buyRate) / 3 : null;
      const currentSellListings = data.priceMap[ci.outputId]?.sells?.quantity || 0;
      const turnoverRatio = (hasVel && currentSellListings > 0) ? sellRate / currentSellListings : null;
      const profitPerHr = hasVel ? ci.profitNet * demandRate : null;
      const dataHrs = vel?.windowHrs || 0;
      // TP is price-priority: undercutting by 1c always puts you at front of queue.
      // Absolute sell rate dominates — how fast the market clears is what matters.
      // Listing count used as log-scaled competitor density (more = harder to stay at front).
      // Slow markets (<0.5/hr) penalized heavily — even at the front, few buyers are coming.
      // Score = craftAdvantage * velocity (craftAdvantage already accounts for mat sell value)
      // No competitorFactor — GW2 TP is price-priority, undercutting by 1c always puts you first
      const advantage = ci.craftAdvantage != null ? ci.craftAdvantage : ci.profitNet;
      let score;
      if (!hasVel || sellRate === 0) {
        score = 0; // no velocity data or dead market = no recommendation
      } else {
        score = Math.max(0, advantage) * sellRate;
      }

      // Personal sold-history multiplier: your own data confirms or denies demand
      const mySoldsForItem = mySoldHistory.filter(s => s.item_id === ci.outputId);
      const soldLast30 = mySoldsForItem.filter(s => new Date(s.purchased) > new Date(Date.now() - 30*86400000));
      const soldQty30 = soldLast30.reduce((s,r)=>s+r.quantity,0);
      if (soldQty30 > 0) {
        const confirmBoost = Math.min(1.3, 1.0 + Math.log10(soldQty30 + 1) * 0.3);
        score *= confirmBoost;
      } else {
        const myCurrentListings = myListings[ci.outputId];
        if (myCurrentListings) {
          const oldest = myCurrentListings.reduce((o, l) => !o || new Date(l.created) < new Date(o.created) ? l : o, null);
          const ageMs = oldest ? Date.now() - new Date(oldest.created).getTime() : 0;
          if (ageMs > 3 * 86400000 && mySoldsForItem.length === 0) {
            score *= 0.5;
          }
        }
      }
      // Will it sell? Combines absolute fill rate AND turnover ratio (fills/total listings in queue)
      let sellSignalLabel, sellSignalColor;
      const buyDominates = hasVel && buyRate != null && sellRate != null && buyRate > sellRate * 2 && buyRate > 1;
      if (!hasVel) { sellSignalLabel = "⬜ no data yet"; sellSignalColor = "var(--text3)"; }
      else if (sellRate === 0) { sellSignalLabel = "🔴 rarely sells"; sellSignalColor = "var(--red)"; }
      else if (sellRate >= 10 || (sellRate >= 2 && turnoverRatio != null && turnoverRatio > 0.01)) { sellSignalLabel = "🟢 actively selling"; sellSignalColor = "var(--green2)"; }
      else if (sellRate >= 1 || (sellRate >= 0.3 && turnoverRatio != null && turnoverRatio > 0.003)) { sellSignalLabel = "🟡 moderate"; sellSignalColor = "var(--gold2)"; }
      else { sellSignalLabel = "🟠 slow market"; sellSignalColor = "#e07830"; }
      const priceSignalLabel = dataHrs < 1 ? "⬜ <1hr collected"
      : dataHrs < 24 ? `🟡 ${dataHrs.toFixed(0)}hr collected`
      : dataHrs < 72 ? `🟠 ${(dataHrs/24).toFixed(1)}d collected`
      : `🟢 ${(dataHrs/24).toFixed(1)}d collected`;
      const priceSignalColor = dataHrs < 1 ? "var(--text3)" : dataHrs < 24 ? "var(--gold2)" : dataHrs < 72 ? "#e07830" : "var(--green2)";
      return { ...ci, score, sellFillsPerHr: sellRate, buyFillsPerHr: buyRate, demandRate, turnoverRatio, profitPerHr,
        sellSignalLabel, sellSignalColor, priceSignalLabel, priceSignalColor, dataHrs, buyDominates };
    });

    // Sort by score descending, take top 100
    const sorted = [...items].sort((a, b) => b.score - a.score).slice(0, 100);

    // Build a "better use" map using proper gold/hr comparison.
    //
    // For each ingredient that also appears as a sell candidate in sorted[], we compare:
    //   Option A (sell raw):  qty × sellPrice × 0.85 × sellFillsPerHr_of_ingredient
    //   Option B (craft):     recipeProfit × sellFillsPerHr_of_recipe_output
    //
    // qty = how many of this ingredient the recipe actually needs (from flatLeaves)
    // We only show "better used in X" if Option B > Option A by at least 20%
    // (margin avoids noise when the two are nearly equal)
    //
    // If no velocity data yet, fall back to pure profit comparison (qty-adjusted).
    const betterUseMap = {};
    for (const ci of sorted) {
      if (!ci.tree) continue;
      const leaves = flatLeaves(ci.tree, data.ownedMap || {}); // [{ itemId, count }] — total qty per craft run
      const recipeOutputCount = ci.outputCount || 1;
      const recipeAdvantage = ci.craftAdvantage != null ? ci.craftAdvantage : ci.profitNet;
      const recipeSellRate = ci.sellFillsPerHr; // fills/hr for the output item (may be null)

  for (const { itemId: ingId, count: ingQty } of leaves) {
    // Is this ingredient also a sell candidate in the recommended list?
    const ingCandidate = sorted.find(c => c.outputId === ingId);
    if (!ingCandidate) continue;

    const ingSellPrice = data.priceMap[ingId]?.sells?.unit_price || 0;
    const ingNetPerUnit = Math.floor(ingSellPrice * 0.85);
    const ingSellRate = ingCandidate.sellFillsPerHr; // fills/hr for the ingredient

    // Gold/hr comparison using craftAdvantage * velocity
    let ingGoldPerHr, recipeGoldPerHr;
    if (ingSellRate != null && ingSellRate > 0 && recipeSellRate != null && recipeSellRate > 0) {
      ingGoldPerHr    = ingQty * ingNetPerUnit * ingSellRate;
      recipeGoldPerHr = Math.max(0, recipeAdvantage) * recipeSellRate;
    } else {
      ingGoldPerHr    = ingQty * ingNetPerUnit;
      recipeGoldPerHr = Math.max(0, recipeAdvantage);
    }

    // Only flag if crafting beats raw selling by >20% (avoid noise on near-equal cases)
    if (recipeGoldPerHr > ingGoldPerHr * 1.2) {
      betterUseMap[ingId] = betterUseMap[ingId] || [];
      betterUseMap[ingId].push({
        name: ci.name,
        recipeGoldPerHr,
        ingGoldPerHr,
        profitNet: recipeAdvantage,
        ingQty,
        hasRateData: ingSellRate != null && recipeSellRate != null,
      });
    }
  }
    }
    // For each ingredient, keep only the single best recipe option
    for (const ingId of Object.keys(betterUseMap)) {
      betterUseMap[ingId].sort((a, b) => b.recipeGoldPerHr - a.recipeGoldPerHr);
    }

    const hasVelData = Object.keys(velocitySummary).length > 0;
    const totalWindowHrs = Object.values(velocitySummary).reduce((m, v) => Math.max(m, v.windowHrs || 0), 0);

    return (
      <div>
      {/* Header bar */}
      <div className="ctrl" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ flex: 1 }}>
      <span style={{ fontFamily: "Cinzel,serif", fontSize: 13, color: "var(--gold2)", letterSpacing: 1 }}>⭐ TOP RECOMMENDED CRAFTS</span>
      <span style={{ marginLeft: 12, fontSize: 12, color: "var(--text3)" }}>
      {hasVelData
        ? `Ranked by profit × market velocity · ${totalWindowHrs.toFixed(1)}hrs of market data`
        : "Accumulating market data — ranking by profit until enough data collected"}
        </span>
        </div>
        {/* "Include raw materials" / "Include daily-gated items" / "Include crafts using daily
            ingredients" checkboxes, and the Rarities dropdown, all moved to CraftingTab's shared
            .ctrl bar (renders above this component on every tab, not just Recommended) — see
            that bar for the controls. */}
        </div>

        {sorted.length === 0 && (
          <div className="empty">No craftable items found. Toggle "Show missing" to include items you lack materials for.</div>
        )}

        {sorted.map((ci, rank) => {
          const vel = velocitySummary[ci.outputId];
          const isOpen = expanded[ci.recipeId || ci.outputId];
          const listings = myListings[ci.outputId] || [];
          const totalListed = listings.reduce((s, l) => s + l.quantity, 0);

          return (
            <div key={ci.recipeId} className="ci" style={{ marginBottom: 6, borderLeft: ci.isFriendOnly ? "3px solid #9f4dff" : undefined }}>
            <div className="ci-hdr" onClick={() => ci.recipeId && setExpanded(e => ({ ...e, [ci.recipeId]: !e[ci.recipeId] }))}>
            {/* Rank badge */}
            <span style={{ fontFamily: "Cinzel,serif", fontSize: 12, color: rank < 3 ? "var(--gold2)" : "var(--text3)", width: 28, textAlign: "center", flexShrink: 0 }}>
            {rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `#${rank + 1}`}
            </span>
            {ci.icon ? <img className="iico" src={ci.icon} alt="" /> : <div className="iico-ph" />}
            <span className={`ci-name rar-${ci.rarity}`}>{ci.name}</span>
            {/* Disciplines */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {getRecipeDisciplines(ci).map(d => (
              <span key={d} style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, padding: "2px 7px", borderRadius: 3, background: "rgba(200,150,42,0.1)", border: "1px solid rgba(200,150,42,0.3)", color: "var(--gold2)" }}>{d}</span>
            ))}
            </div>
            {ci.isMaterial
              ? <span className="bhave" style={{ background: "rgba(80,120,200,0.15)", borderColor: "rgba(80,120,200,0.4)", color: "#9bbcf5" }}>📦 Raw</span>
              : ci.canCraft ? <span className="bhave">✓ Can Craft</span> : <span className="bmiss">✗ Missing</span>
            }
            {/* Friend badge: Case A (isFriendOnly) = user doesn't know this at all, only a friend
                does. Case B (friendBadges present without isFriendOnly) = this card already shows
                as "known" because the user's discipline rating qualifies, but they haven't actually
                discovered it — a friend genuinely has. Different tooltip explains which applies. */}
            {ci.friendBadges?.map(b => (
              <span key={b.friendId} title={ci.isFriendOnly
                ? `${b.friendName} knows this recipe — you don't. Materials shown are yours.`
                : `${b.friendName} has genuinely discovered this recipe. You're shown as able to craft it because your discipline rating qualifies, but you haven't actually discovered it yourself yet.`}
                style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, padding: "2px 7px", borderRadius: 3, background: "rgba(159,77,255,.12)", border: "1px solid rgba(159,77,255,.4)", color: "#c9a0ff", whiteSpace: "nowrap" }}>
                🛠 {b.friendName}
              </span>
            ))}
            {/* Better-use hint: crafting downstream recipe beats selling this ingredient raw */}
            {betterUseMap[ci.outputId]?.length > 0 && (() => {
              const best = betterUseMap[ci.outputId][0];
              const rateNote = best.hasRateData
              ? `Sell raw: ~${Math.round(best.ingGoldPerHr/100)}s/hr · Craft ${best.name}: ~${Math.round(best.recipeGoldPerHr/100)}s/hr`
              : `Using ${best.ingQty}× in ${best.name} yields +${Math.round((best.profitNet - best.ingGoldPerHr)/100)}s more profit per craft`;
              return (
                <span title={`💡 ${rateNote}. Uses ${best.ingQty}× of this item per craft.`}
                style={{ fontSize:10, fontFamily:"Cinzel,serif", letterSpacing:1, padding:"2px 8px", borderRadius:3, cursor:"help",
                  background:"rgba(120,200,120,0.12)", border:"1px solid rgba(120,200,120,0.35)", color:"#7ccc7c" }}>
                  💡 Better used in: {best.name} ({best.ingQty}×)
                  </span>
              );
            })()}
            {DAILY_CRAFT_IDS.has(ci.outputId) && (
              dailyCrafted.has(ci.outputId)
              ? <span className="bdaily-done">⏳ Done Today</span>
              : <span className="bdaily-avail">⚡ Daily</span>
            )}
            {totalListed > 0 && (() => {
              const now = Date.now();
              const oldest = listings.reduce((o, l) => !o || new Date(l.created) < new Date(o.created) ? l : o, null);
              const ageMs = oldest ? now - new Date(oldest.created).getTime() : 0;
              const ageTxt = ageMs < 3600000 ? `${Math.floor(ageMs/60000)}m` : ageMs < 86400000 ? `${Math.floor(ageMs/3600000)}h` : `${Math.floor(ageMs/86400000)}d`;
              return <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 3, background: "rgba(80,120,200,0.18)", border: "1px solid rgba(80,120,200,0.4)", color: "#9bbcf5" }}>🏪 {totalListed}× · {ageTxt} ago</span>;
            })()}
            {/* You sold badge */}
            {(() => {
              const mySolds = mySoldHistory.filter(s => s.item_id === ci.outputId);
              if (mySolds.length === 0) return null;
              const recentSold = mySolds[0];
              const soldAgoMs = Date.now() - new Date(recentSold.purchased).getTime();
              const soldAgoTxt = soldAgoMs < 3600000 ? `${Math.floor(soldAgoMs/60000)}m` : soldAgoMs < 86400000 ? `${Math.floor(soldAgoMs/3600000)}h` : `${Math.floor(soldAgoMs/86400000)}d`;
              return (
                <span title={`You sold ${mySolds.reduce((s,r)=>s+r.quantity,0)}× total. Most recent: ${soldAgoTxt} ago.`}
                style={{ fontSize:10, fontFamily:"Cinzel,serif", letterSpacing:1, padding:"2px 7px", borderRadius:3, cursor:"help", background:"rgba(60,160,60,0.15)", border:"1px solid rgba(60,160,60,0.4)", color:"var(--green2)" }}>
                ✓ You sold {mySolds.reduce((s,r)=>s+r.quantity,0)}× · last {soldAgoTxt} ago
                </span>
              );
            })()}

            {/* Key metrics inline */}
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginLeft: "auto" }}>
            {(() => {
              const sellPrice = ci.outSell * (ci.outputCount || 1);
              const afterTax = Math.floor(sellPrice * 0.85);
              const taxAmt = sellPrice - afterTax;
              return (
                <>
                <div className="stat-cell" style={{ minWidth: 0 }}>
                <span className="stat-lbl">SELL PRICE</span>
                <span><Gold v={sellPrice} size={13} /></span>
                </div>
                <ReceiptStat
                label="NET PROFIT"
                value={ci.profitNet}
                size={13}
                wrapClass="stat-cell"
                lblClass="stat-lbl"
                lines={[
                  { label: "Sell Price", value: sellPrice },
                  { label: "− 15% TP Tax", value: -taxAmt },
                  { label: "− Must-Buy Mats", value: -(ci.totalMustBuyCostSell || 0) },
                  { label: "Net Profit", value: ci.profitNet, isTotal: true },
                ]}
                />
                {ci.craftAdvantage != null && (
                  <ReceiptStat
                  label="CRAFT ADVANTAGE"
                  value={ci.craftAdvantage}
                  size={13}
                  wrapClass="stat-cell"
                  lblClass="stat-lbl"
                  lines={[
                    { label: "Net Profit", value: ci.profitNet },
                    { label: "− Owned Mats Cost", value: -(ci.matSellNet || 0) },
                    { label: "Craft Advantage", value: ci.craftAdvantage, isTotal: true },
                  ]}
                  />
                )}
                {ci.sellFillsPerHr != null && (
                  <div className="stat-cell" style={{ minWidth: 0 }} title="Buyers paying ask price — sell listings purchased/hr (upper bound). High sell rate + few listings = less competition, your listing clears fast.">
                  <span className="stat-lbl" style={{ color: !ci.buyDominates ? "var(--green2)" : "var(--text3)" }}>BUYING HIGH</span>
                  <span style={{ color: ci.sellFillsPerHr >= 2 ? "var(--green2)" : ci.sellFillsPerHr === 0 ? "var(--red)" : "var(--gold2)", fontSize: 13 }}>
                  {ci.sellFillsPerHr.toFixed(1)}/hr
                  </span>
                  </div>
                )}
                {ci.buyFillsPerHr != null && (
                  <div className="stat-cell" style={{ minWidth: 0 }} title={ci.buyDominates ? "⚠ Market moves at floor price — more sellers hitting bids than buyers paying ask. Selling low may be more reliable." : "Sellers fulfilling buy orders/hr (lower bound)"}>
                  <span className="stat-lbl" style={{ color: ci.buyDominates ? "var(--gold2)" : "var(--text3)" }}>SELLING LOW</span>
                  <span style={{ color: ci.buyDominates ? "var(--gold2)" : "var(--text3)", fontSize: 13 }}>
                  {ci.buyFillsPerHr.toFixed(1)}/hr{ci.buyDominates ? " ★" : ""}
                  </span>
                  </div>
                )}
                <div className="stat-cell" style={{ minWidth: 0 }} title={`Market activity signal · ${ci.priceSignalLabel || "no data yet"}`}>
                <span className="stat-lbl">WILL IT SELL?</span>
                <span style={{ fontSize: 12, color: ci.sellSignalColor || "var(--text3)" }}>{ci.sellSignalLabel || "⬜ no data"}</span>
                </div>
                </>
              );
            })()}
            <button className={`cbtn${craftingChartItem === ci.outputId ? " on" : ""}`}
            onClick={e => { e.stopPropagation(); setCraftingChartItem(craftingChartItem === ci.outputId ? null : ci.outputId); }}>
            📈 Chart
            </button>
            </div>
            </div>
            {craftingChartItem === ci.outputId && (
              <div style={{ padding: "0 20px 14px", borderTop: "1px solid var(--border)", background: "var(--bg2)" }}>
              <PriceChart itemId={ci.outputId} itemName={ci.name} />
              </div>
            )}

            {/* Expanded detail — identical to Crafting Profits' card body (ingredient
                tree, buy order savings, your TP listings, sell path, cheapest acquire).
                Raw materials have no recipe tree, so they're excluded. */}
            {isOpen && !ci.isMaterial && (
              <CraftDetailBody
                ci={ci}
                itemMap={data.itemMap}
                priceMap={data.priceMap}
                ownedMap={cacheRef.current.ownedMap}
                resolvedRecipes={cacheRef.current.resolvedRecipes}
                charInventoryByChar={data.charInventoryByChar}
                charDisciplines={data.charDisciplines}
                myListings={myListings}
                velocitySummary={velocitySummary}
                setActiveTab={setActiveTab}
              />
            )}
            </div>
          );
        })}

        {sorted.length > 0 && (
          <div style={{ padding: "12px 16px", color: "var(--text3)", fontSize: 12, fontFamily: "Cinzel,serif", letterSpacing: 1, borderTop: "1px solid var(--border)" }}>
          Showing top {sorted.length} of {items.length} candidates · Score = √(profit/hr × turnover)
          </div>
        )}
        </div>
    );
  }, [data, velocitySummary, trendSummary, showRecMaterials, showRecDaily, showRecDailyOutputs, showRecMissing, rarityFilter, expanded, dailyCrafted, myListings, mySoldHistory, craftingChartItem, friendOnlyCraftItems, friendFilter, friendKnownEligibleBadges, searchCraft]);

  // ── Unlearned Recipes tab ────────────────────────────────────────────────────
  // Ranks recipes you don't know by the same craftAdvantage × sellFillsPerHr formula
  // as ⭐ Recommended (directly comparable rankings), so learned-vs-unlearned is just
  // another axis instead of a totally separate ranking system. Reuses the same card
  // shell as Recommended, with a 🔒 badge instead of ✓/✗ Can Craft, plus a "have
  // materials" badge shown independently since materials-owned and recipe-known are
  // unrelated for a locked recipe.
  const UnlearnedRecipesTab = useMemo(() => {
    if (!data) return null;

    let items = lockedCraftItems;
    if (hideZeroProfitUnlearned) {
      items = items.filter(ci => {
        const advantage = ci.craftAdvantage != null ? ci.craftAdvantage : ci.profitNet;
        return advantage > 0 && ci.outSell > 0;
      });
    }
    if (hideAutoLearnedUnlearned) {
      // AutoLearned recipes never need to be "learned" — they become usable the instant
      // a qualifying discipline hits the required rating (e.g. Piece of Dragon Jade).
      // They're technically "unlearned" today but aren't actionable the way a vendor/
      // achievement/recipe-sheet recipe is, so let the user filter them out of this list.
      items = items.filter(ci => !(ci.flags || []).includes("AutoLearned"));
    }
    items = items.filter(ci => passesRarityFilter(ci.rarity, rarityFilter));
    items = items.filter(ci => ci.name.toLowerCase().includes(searchCraft.toLowerCase()));

    const MIN_OBS = 5;
    items = items.map(ci => {
      const vel = velocitySummary[ci.outputId];
      const hasVel = vel && vel.observations >= MIN_OBS;
      const sellRate = hasVel ? vel.sellFillsPerHr : null;
      const buyRate = hasVel ? vel.buyFillsPerHr : null;
      const advantage = ci.craftAdvantage != null ? ci.craftAdvantage : ci.profitNet;
      const score = (!hasVel || sellRate === 0) ? 0 : Math.max(0, advantage) * sellRate;

      // Same "will it sell?" / turnover / buy-dominates signal logic as Crafting Profits
      // and Recommended, so Unlearned Recipes cards carry the identical sell-rate context
      // rather than just the profit numbers.
      const currentSellListings = data.priceMap[ci.outputId]?.sells?.quantity || 0;
      const turnoverRatio = (hasVel && currentSellListings > 0) ? sellRate / currentSellListings : null;
      const buyDominates = hasVel && buyRate != null && sellRate != null && buyRate > sellRate * 2 && buyRate > 1;
      let sellSignalLabel, sellSignalColor;
      if (!hasVel) { sellSignalLabel = "⬜ no data yet"; sellSignalColor = "var(--text3)"; }
      else if (sellRate === 0) { sellSignalLabel = "🔴 rarely sells"; sellSignalColor = "var(--red)"; }
      else if (sellRate >= 10 || (sellRate >= 2 && turnoverRatio != null && turnoverRatio > 0.01)) { sellSignalLabel = "🟢 actively selling"; sellSignalColor = "var(--green2)"; }
      else if (sellRate >= 1 || (sellRate >= 0.3 && turnoverRatio != null && turnoverRatio > 0.003)) { sellSignalLabel = "🟡 moderate"; sellSignalColor = "var(--gold2)"; }
      else { sellSignalLabel = "🟠 slow market"; sellSignalColor = "#e07830"; }
      const dataHrs = vel?.windowHrs || 0;
      const priceSignalLabel = dataHrs < 1 ? "⬜ <1hr collected"
        : dataHrs < 24 ? `🟡 ${dataHrs.toFixed(0)}hr collected`
        : dataHrs < 72 ? `🟠 ${(dataHrs / 24).toFixed(1)}d collected`
        : `🟢 ${(dataHrs / 24).toFixed(1)}d collected`;

      return { ...ci, score, sellFillsPerHr: sellRate, buyFillsPerHr: buyRate, buyDominates, sellSignalLabel, sellSignalColor, priceSignalLabel };
    });

    const sorted = [...items].sort((a, b) => b.score - a.score).slice(0, 100);

    return (
      <div>
      <div className="ctrl" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ flex: 1 }}>
      <span style={{ fontFamily: "Cinzel,serif", fontSize: 13, color: "var(--gold2)", letterSpacing: 1 }}>🔒 UNLEARNED RECIPES</span>
      <span style={{ marginLeft: 12, fontSize: 12, color: "var(--text3)" }}>
      Recipes you don't currently know, ranked the same way as ⭐ Recommended — see what's worth learning or farming.
      {unlearnedLoading && <span style={{ color: "var(--gold2)", marginLeft: 8 }}>⏳ refreshing catalog…</span>}
      </span>
      </div>
      <label style={{ fontSize: 12, color: "var(--text3)", display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }} title="Hide recipes with no profit or no TP sell price — keeps junk/vendor recipes out of view">
      <input type="checkbox" checked={hideZeroProfitUnlearned} onChange={e => setHideZeroProfitUnlearned(e.target.checked)} />
      Hide zero-profit / no-data recipes
      </label>
      <label style={{ fontSize: 12, color: "var(--text3)", display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }} title="Hide recipes flagged Auto-Learned — these become known automatically once a qualifying discipline hits the required rating, with nothing to buy/find/achieve">
      <input type="checkbox" checked={hideAutoLearnedUnlearned} onChange={e => setHideAutoLearnedUnlearned(e.target.checked)} />
      Hide auto-learned recipes
      </label>
      </div>

      {unlearnedRecipeCount === 0 && (
        <div className="empty">
        {unlearnedLoading
          ? "Building the unlearned-recipe catalog for the first time — this scans the full game recipe list and can take a little while. Check back shortly."
          : "No unlearned-recipe catalog cached yet. It refreshes automatically in the background (weekly), or click \"Rescan Auto-Unlocked Recipes\" in Settings to help seed it now."}
        </div>
      )}
      {unlearnedRecipeCount > 0 && sorted.length === 0 && (
        <div className="empty">No recipes match the current filters. Toggle "Hide zero-profit / no-data recipes" to see the full {unlearnedRecipeCount.toLocaleString()}-recipe catalog.</div>
      )}

      {sorted.map((ci, rank) => {
        const key = `locked_${ci.recipeId}`;
        const isOpen = expanded[key];
        return (
          <div key={ci.recipeId} className="ci" style={{ marginBottom: 6 }}>
          <div className="ci-hdr" onClick={() => setExpanded(e => ({ ...e, [key]: !e[key] }))}>
          <span style={{ fontFamily: "Cinzel,serif", fontSize: 12, color: rank < 3 ? "var(--gold2)" : "var(--text3)", width: 28, textAlign: "center", flexShrink: 0 }}>
          {rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `#${rank + 1}`}
          </span>
          {ci.icon ? <img className="iico" src={ci.icon} alt="" /> : <div className="iico-ph" />}
          <span className={`ci-name rar-${ci.rarity}`}>{ci.name}</span>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {getRecipeDisciplines(ci).map(d => (
            <span key={d} style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, padding: "2px 7px", borderRadius: 3, background: "rgba(200,150,42,0.1)", border: "1px solid rgba(200,150,42,0.3)", color: "var(--gold2)" }}>
            {d}{ci.minRating ? ` ${ci.minRating}` : ""}
            </span>
          ))}
          </div>
          <span style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, padding: "3px 8px", borderRadius: 3, background: "rgba(159,77,255,.12)", border: "1px solid rgba(159,77,255,.4)", color: "#9f4dff", whiteSpace: "nowrap" }}>🔒 Not Learned</span>
          {ci.canCraft ? <span className="bhave">✓ Have Mats</span> : <span className="bmiss">✗ Missing Mats</span>}
          {ci.flags?.includes("LearnedFromItem") && (
            <span title="Learned from a consumable recipe sheet/scroll — check the wiki for where to find it" style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, padding: "2px 7px", borderRadius: 3, background: "rgba(90,160,210,.12)", border: "1px solid rgba(90,160,210,.35)", color: "var(--blue2)" }}>📖 Recipe Sheet</span>
          )}
          {ci.flags?.includes("AutoLearned") && (
            <span title="Automatically becomes known once a qualifying discipline reaches the required rating — nothing to buy, find, or achieve" style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, padding: "2px 7px", borderRadius: 3, background: "rgba(122,200,120,.12)", border: "1px solid rgba(122,200,120,.35)", color: "#7ac878" }}>⚙ Auto-Unlocks</span>
          )}

          <div style={{ display: "flex", gap: 14, alignItems: "center", marginLeft: "auto" }}>
          {(() => {
            const sellPrice = ci.outSell * (ci.outputCount || 1);
            const afterTax = Math.floor(sellPrice * 0.85);
            const taxAmt = sellPrice - afterTax;
            return (
              <>
              <div className="stat-cell" style={{ minWidth: 0 }}>
              <span className="stat-lbl">SELL PRICE</span>
              <span><Gold v={sellPrice} size={13} /></span>
              </div>
              <ReceiptStat
              label="NET PROFIT"
              value={ci.profitNet}
              size={13}
              wrapClass="stat-cell"
              lblClass="stat-lbl"
              lines={[
                { label: "Sell Price", value: sellPrice },
                { label: "− 15% TP Tax", value: -taxAmt },
                { label: "− Must-Buy Mats", value: -(ci.totalMustBuyCostSell || 0) },
                { label: "Net Profit", value: ci.profitNet, isTotal: true },
              ]}
              />
              {ci.craftAdvantage != null && (
                <ReceiptStat
                label="CRAFT ADVANTAGE"
                value={ci.craftAdvantage}
                size={13}
                wrapClass="stat-cell"
                lblClass="stat-lbl"
                lines={[
                  { label: "Net Profit", value: ci.profitNet },
                  { label: "− Owned Mats Cost", value: -(ci.matSellNet || 0) },
                  { label: "Craft Advantage", value: ci.craftAdvantage, isTotal: true },
                ]}
                />
              )}
              {ci.sellFillsPerHr != null && (
                <div className="stat-cell" style={{ minWidth: 0 }} title="Buyers paying ask price — sell listings purchased/hr (upper bound). High sell rate + few listings = less competition, your listing clears fast.">
                <span className="stat-lbl" style={{ color: !ci.buyDominates ? "var(--green2)" : "var(--text3)" }}>BUYING HIGH</span>
                <span style={{ color: ci.sellFillsPerHr >= 2 ? "var(--green2)" : ci.sellFillsPerHr === 0 ? "var(--red)" : "var(--gold2)", fontSize: 13 }}>
                {ci.sellFillsPerHr.toFixed(1)}/hr
                </span>
                </div>
              )}
              {ci.buyFillsPerHr != null && (
                <div className="stat-cell" style={{ minWidth: 0 }} title={ci.buyDominates ? "⚠ Market moves at floor price — more sellers hitting bids than buyers paying ask. Selling low may be more reliable." : "Sellers fulfilling buy orders/hr (lower bound)"}>
                <span className="stat-lbl" style={{ color: ci.buyDominates ? "var(--gold2)" : "var(--text3)" }}>SELLING LOW</span>
                <span style={{ color: ci.buyDominates ? "var(--gold2)" : "var(--text3)", fontSize: 13 }}>
                {ci.buyFillsPerHr.toFixed(1)}/hr{ci.buyDominates ? " ★" : ""}
                </span>
                </div>
              )}
              <div className="stat-cell" style={{ minWidth: 0 }} title={`Market activity signal · ${ci.priceSignalLabel || "no data yet"}`}>
              <span className="stat-lbl">WILL IT SELL?</span>
              <span style={{ fontSize: 12, color: ci.sellSignalColor || "var(--text3)" }}>{ci.sellSignalLabel || "⬜ no data"}</span>
              </div>
              </>
            );
          })()}
          <button className={`cbtn${craftingChartItem === ci.outputId ? " on" : ""}`}
          onClick={e => { e.stopPropagation(); setCraftingChartItem(craftingChartItem === ci.outputId ? null : ci.outputId); }}>
          📈 Chart
          </button>
          </div>
          </div>

          {craftingChartItem === ci.outputId && (
            <div style={{ padding: "0 20px 14px", borderTop: "1px solid var(--border)", background: "var(--bg2)" }}>
            <PriceChart itemId={ci.outputId} itemName={ci.name} />
            </div>
          )}

          {isOpen && (
            <div className="ci-body">
            <div className="r-tree">
            <div className="r-hdr">
            <span style={{ flex: 1 }}>Ingredient</span>
            <span style={{ width: 60 }}>Need</span>
            <span style={{ width: 110 }}>Status</span>
            <span style={{ width: 130, textAlign: "right" }}>Unit Price</span>
            <span style={{ width: 130, textAlign: "right" }}>Total</span>
            </div>
            {ci.matDetails.map(m => {
              const item = data.itemMap[m.itemId];
              const col = m.status === "have" ? "var(--green)" : m.status === "hasMaterials" ? "var(--gold)" : "var(--red)";
              const label = m.status === "have" ? `✓ ${m.owned}` : m.status === "hasMaterials" ? `⚒ ${m.owned}/${m.needed}` : `✗ ${m.owned}/${m.needed}`;
              const isMustBuy = m.status === "mustBuy";
              return (
                <div key={m.itemId} className="r-row">
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                {item?.icon && <img className="iico-sm" src={item.icon} alt="" />}
                <span className={`rar-${m.rarity}`}>{m.name}</span>
                </div>
                <span style={{ width: 60, color: "var(--text3)", fontSize: 14 }}>×{m.needed}</span>
                <span style={{ width: 110, fontSize: 13, color: col }}>{label}</span>
                <span style={{ width: 130, textAlign: "right" }}>{isMustBuy ? <Gold v={m.bestBuyPrice} /> : <span style={{ color: "var(--text3)" }}>—</span>}</span>
                <span style={{ width: 130, textAlign: "right" }}>{isMustBuy ? <Gold v={m.bestBuyPrice * m.needed} /> : <span style={{ color: "var(--text3)" }}>—</span>}</span>
                </div>
              );
            })}
            <div className="r-row r-tot">
            <span style={{ flex: 1, fontFamily: "Cinzel,serif", fontSize: 11, letterSpacing: 1, color: "var(--text3)" }}>TOTAL MUST-BUY COST</span>
            <span style={{ width: 60 }} /><span style={{ width: 110 }} /><span style={{ width: 130 }} />
            <span style={{ width: 130, textAlign: "right", color: "var(--red)" }}><Gold v={ci.totalMustBuyCostSell} /></span>
            </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--text3)", lineHeight: 1.6 }}>
            Acquisition source for this recipe isn't tracked — GW2's API doesn't cleanly expose vendor/drop/achievement mapping, so check the wiki for how to learn it.
            {ci.minRating > 0 && <> Requires discipline rating <strong style={{ color: "var(--text2)" }}>{ci.minRating}</strong>.</>}
            </div>
            </div>
          )}
          </div>
        );
      })}

      {sorted.length > 0 && (
        <div style={{ padding: "12px 16px", color: "var(--text3)", fontSize: 12, fontFamily: "Cinzel,serif", letterSpacing: 1, borderTop: "1px solid var(--border)" }}>
        Showing top {sorted.length} of {items.length} unlearned recipes · {unlearnedRecipeCount.toLocaleString()} total in catalog
        </div>
      )}
      </div>
    );
  }, [data, lockedCraftItems, velocitySummary, hideZeroProfitUnlearned, hideAutoLearnedUnlearned, rarityFilter, unlearnedRecipeCount, unlearnedLoading, expanded, craftingChartItem, searchCraft]);

  const CraftingTab = useMemo(() => {
    if (!data) return null;
    // Known professions first, then any non-standard bucket (e.g. "Uncategorized" —
    // items whose GW2 API disciplines array came back empty) so nothing is ever
    // silently hidden just because it doesn't match a known profession name.
    const knownDiscs = DISCIPLINES.filter(d => data.byDisc[d]?.length > 0);
    const extraDiscs = Object.keys(data.byDisc).filter(d => !DISCIPLINES.includes(d) && data.byDisc[d]?.length > 0);
    const discs = [...knownDiscs, ...extraDiscs];
    const disc = activeDisc || discs[0];

    // forgeableOutputIds (set of item IDs with a Mystic Forge material promotion
    // recipe) now lives at module scope — see definition near CraftDetailBody —
    // so both this tab and CraftDetailBody (shared by Recommended) use the same set.
    // Per-character crafter/inventory lookups (findItemOnOtherChar) also moved into
    // CraftDetailBody, which now renders the expanded card body for both this tab
    // and Recommended.

    let items = data.byDisc[disc] || [];
    // Friend-only candidates for this discipline: recipes the user doesn't know
    // but an added friend does, filtered to the disciplines that recipe actually
    // uses and gated by the friend filter — same merge as the Recommended tab,
    // scoped per-discipline since Crafting Profits is organized that way.
    if (friendFilter.enabled && friendOnlyCraftItems.length > 0) {
      const existingIds = new Set(items.map(i => i.recipeId));
      const friendItemsForDisc = friendOnlyCraftItems.filter(ci =>
        getRecipeDisciplines(ci).includes(disc) &&
        !existingIds.has(ci.recipeId) &&
        passesFriendFilter(ci, friendFilter)
      );
      items = [...items, ...friendItemsForDisc];
    }
    // Attach a friend badge onto cards that already exist here because they're Discovery-eligible
    // (rating met) but not genuinely discovered — see friendKnownEligibleBadges above. Never adds
    // or removes a card, only decorates an existing one with a badge if a friend genuinely knows it.
    if (friendFilter.enabled && Object.keys(friendKnownEligibleBadges).length > 0) {
      items = items.map(i => {
        const badges = friendKnownEligibleBadges[i.recipeId];
        if (!badges) return i;
        const visibleBadges = badges.filter(b => friendFilter.byFriend[b.friendId] !== false);
        if (visibleBadges.length === 0) return i;
        return { ...i, friendBadges: visibleBadges };
      });
    }
    if (!showRecMissing) items = items.filter(i => i.canCraft);
    items = items.filter(ci => passesRarityFilter(ci.rarity, rarityFilter));
    items = items.filter(i => showRecDaily || !DAILY_CRAFT_IDS.has(i.outputId));
    items = items.filter(i => showRecDailyOutputs || !treeUsesDailyIngredient(i.tree, ALL_DAILY_CRAFT_IDS));

    // Recommendation score — uses accumulated global market velocity data
    // sellFillsPerHr: how many sell listings are getting snapped up by buyers per hour (global)
    // buyFillsPerHr: how many buy orders are getting filled by sellers per hour (global)
    // Score = profitNet × turnover, adjusted for confidence and market saturation
    const MIN_OBS = 5; // need at least 5 valid pairs
    items = items.map(ci => {
      const vel = velocitySummary[ci.outputId];
      const hasVel = vel && vel.observations >= MIN_OBS;
      const sellRate = hasVel ? vel.sellFillsPerHr : null;
      const buyRate  = hasVel ? vel.buyFillsPerHr  : null;

      // Combined demand: weight sell fills more (we're listing on sell side)
      // buyFills signals demand pressure — people willing to wait for lower prices
      const demandRate = hasVel ? (sellRate * 2 + buyRate) / 3 : null;

      // Turnover ratio: fills per hr relative to current sell listings.
      // High fills + low listings = fast mover. High fills + huge listings = slow despite volume.
      const currentSellListings = data.priceMap[ci.outputId]?.sells?.quantity || 0;
      const turnoverRatio = (hasVel && currentSellListings > 0)
      ? sellRate / currentSellListings  // fraction of total listings sold per hour
      : null;

      // Profit per hour estimate: if this sells N times/hr, profit × N
      const profitPerHr = hasVel ? ci.profitNet * demandRate : null;

      // Score = craftAdvantage * velocity — same formula as Recommended tab
      const advantage = ci.craftAdvantage != null ? ci.craftAdvantage : ci.profitNet;
      let score;
      if (!hasVel || sellRate === 0) {
        score = 0;
      } else {
        score = Math.max(0, advantage) * sellRate;
      }

      // Personal sold-history multiplier
      const mySoldsForItem = mySoldHistory.filter(s => s.item_id === ci.outputId);
      const soldLast30 = mySoldsForItem.filter(s => new Date(s.purchased) > new Date(Date.now() - 30*86400000));
      const soldQty30 = soldLast30.reduce((s,r) => s + r.quantity, 0);
      if (soldQty30 > 0) {
        const confirmBoost = Math.min(1.3, 1.0 + Math.log10(soldQty30 + 1) * 0.3);
        score *= confirmBoost;
      } else {
        const myCurrentListings = myListings[ci.outputId];
        if (myCurrentListings) {
          const oldest = myCurrentListings.reduce((o, l) => !o || new Date(l.created) < new Date(o.created) ? l : o, null);
          const ageMs = oldest ? Date.now() - new Date(oldest.created).getTime() : 0;
          if (ageMs > 3 * 86400000 && mySoldsForItem.length === 0) {
            score *= 0.5;
          }
        }
      }

      // Will it sell? Same logic as Recommended tab
      const buyDominates = hasVel && buyRate != null && sellRate != null && buyRate > sellRate * 2 && buyRate > 1;
      let sellSignal, sellSignalLabel, sellSignalColor;
      if (!hasVel) {
        sellSignal = null; sellSignalLabel = "⬜ no data yet"; sellSignalColor = "var(--text3)";
      } else if (sellRate === 0) {
        sellSignal = 0; sellSignalLabel = "🔴 rarely sells"; sellSignalColor = "var(--red)";
      } else if (sellRate >= 10 || (sellRate >= 2 && turnoverRatio != null && turnoverRatio > 0.01)) {
        sellSignal = 1; sellSignalLabel = "🟢 actively selling"; sellSignalColor = "var(--green2)";
      } else if (sellRate >= 1 || (sellRate >= 0.3 && turnoverRatio != null && turnoverRatio > 0.003)) {
        sellSignal = 0.6; sellSignalLabel = "🟡 moderate"; sellSignalColor = "var(--gold2)";
      } else {
        sellSignal = 0.3; sellSignalLabel = "🟠 slow market"; sellSignalColor = "#e07830";
      }

      // priceSignal: how much market data has been collected (renamed from "confidence")
      const dataHrs = vel?.windowHrs || 0;
      const priceSignalLabel = dataHrs < 1 ? "⬜ <1hr collected"
      : dataHrs < 24  ? `🟡 ${dataHrs.toFixed(0)}hr collected`
      : dataHrs < 72  ? `🟠 ${(dataHrs/24).toFixed(1)}d collected`
      : `🟢 ${(dataHrs/24).toFixed(1)}d collected`;
      const priceSignalColor = dataHrs < 1 ? "var(--text3)" : dataHrs < 24 ? "var(--gold2)" : dataHrs < 72 ? "#e07830" : "var(--green2)";

      return {
        ...ci, score,
        sellFillsPerHr: sellRate, buyFillsPerHr: buyRate,
        demandRate, turnoverRatio, profitPerHr,
        sellSignal, sellSignalLabel, sellSignalColor,
        priceSignalLabel, priceSignalColor, dataHrs, buyDominates,
      };
    });

    // Show all recipes — items without velocity data get score=0 and sort to bottom
    // This ensures the user sees every recipe they have, not just ones with market data
    const filtered = items
    .filter(i => i.name.toLowerCase().includes(searchCraft.toLowerCase()));
    // Sort by score desc (velocity-informed), then by profitNet desc for items with no velocity data
    const sorted = [...filtered].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.profitNet - a.profitNet;
    });

    // When an item has more than one valid recipe (different materials/costs —
    // e.g. Karka Toughness Station has 3), label each card "Method X of Y" so
    // they're distinguishable instead of looking like duplicate entries.
    const outputCounts = {};
    sorted.forEach(ci => { outputCounts[ci.outputId] = (outputCounts[ci.outputId] || 0) + 1; });
    const outputSeenIdx = {};
    const variantLabel = {};
    sorted.forEach(ci => {
      const total = outputCounts[ci.outputId];
      if (total > 1) {
        outputSeenIdx[ci.outputId] = (outputSeenIdx[ci.outputId] || 0) + 1;
        variantLabel[ci.recipeId] = `Method ${outputSeenIdx[ci.outputId]} of ${total}`;
      }
    });

    return (
      <div>
      {(() => {
        // Find the discipline with the single highest net-profit craftable
        let bestDiscProfit = -Infinity, bestDisc = null;
        for (const d of discs) {
          const top = (data.byDisc[d] || []).reduce((mx, ci) => Math.max(mx, ci.profitNet), -Infinity);
          if (top > bestDiscProfit) { bestDiscProfit = top; bestDisc = d; }
        }
        return (
          <div className="disc-tabs">
          {discs.map(d => (
            <button key={d} className={`dtab${activeDisc === d ? " on" : ""}`} onClick={() => setActiveDisc(d)}>
            {d === bestDisc && <span title="Best net profit across all professions" style={{ marginRight: 5 }}>💰</span>}
            {d}<span className="dtab-ct">{data.byDisc[d]?.length}</span>
            </button>
          ))}
          <button className={`dtab${activeDisc === "__recommended__" ? " on" : ""}`} onClick={() => setActiveDisc("__recommended__")}
          style={{ position: "relative", borderColor: activeDisc === "__recommended__" ? "var(--gold2)" : undefined }}>
          ⭐ Recommended
          {Object.keys(velocitySummary).length > 0 && <span style={{ position: "absolute", top: 2, right: 4, width: 6, height: 6, borderRadius: "50%", background: "var(--green2)" }} title="Velocity data available" />}
          </button>
          <button className={`dtab${activeDisc === "__unlearned__" ? " on" : ""}`} onClick={() => setActiveDisc("__unlearned__")}
          style={{ position: "relative", borderColor: activeDisc === "__unlearned__" ? "var(--gold2)" : undefined }}>
          🔒 Unlearned Recipes<span className="dtab-ct">{unlearnedRecipeCount || ""}</span>
          {unlearnedLoading && <span style={{ position: "absolute", top: 2, right: 4, width: 6, height: 6, borderRadius: "50%", background: "var(--gold2)" }} title="Refreshing catalog..." />}
          </button>
          </div>
        );
      })()}
      <div className="ctrl">
      <input
      className="si"
      placeholder="Search recipes..."
      value={searchCraft}
      onChange={e => { setSearchCraft(e.target.value); setCraftPage(0); }}
      />
      <label className="cbl" title="Also applies to the Recommended tab">
      <input type="checkbox" checked={showRecMissing} onChange={e => setShowRecMissing(e.target.checked)} />
      Show missing materials
      </label>
      <label className="cbl" title="Only affects the ⭐ Recommended tab — raw materials aren't tied to a crafting discipline, so this has no effect on the other tabs">
      <input type="checkbox" checked={showRecMaterials} onChange={e => setShowRecMaterials(e.target.checked)} />
      Include raw materials
      </label>
      <label className="cbl" title="Include time-gated daily crafts (Glob of Elder Spirit Residue, etc.)">
      <input type="checkbox" checked={showRecDaily} onChange={e => setShowRecDaily(e.target.checked)} />
      Include daily-gated items
      </label>
      <label className="cbl" title="Show items that REQUIRE a daily material as an ingredient (e.g. Bolt of Damask uses Spool of Weaving Thread). Uncheck to hide crafts that depend on dailies.">
      <input type="checkbox" checked={showRecDailyOutputs} onChange={e => setShowRecDailyOutputs(e.target.checked)} />
      Include crafts using daily ingredients
      </label>
      <FriendFilterDropdown friends={friends} friendFilter={friendFilter} setFriendFilter={setFriendFilter} />
      <RarityDropdown rarityFilter={rarityFilter} setRarityFilter={setRarityFilter} />
      <div style={{ marginLeft:"auto", fontSize:11, color:"var(--text3)", fontFamily:"Cinzel,serif", letterSpacing:1 }}>
      Ranked by profit × market velocity
      </div>
      </div>

      {activeDisc === "__recommended__" ? RecommendedTab : activeDisc === "__unlearned__" ? UnlearnedRecipesTab : <>

        {sorted.length === 0 && <div className="empty">No craftable items found.</div>}

        {sorted.length > PAGE_SIZE && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0", fontSize:12, fontFamily:"Cinzel,serif", letterSpacing:1, color:"var(--text3)" }}>
          <button className="rbtn" disabled={craftPage === 0} onClick={() => setCraftPage(p => p-1)}>← Prev</button>
          <span>Page {craftPage+1} of {Math.ceil(sorted.length/PAGE_SIZE)} · {sorted.length} items</span>
          <button className="rbtn" disabled={(craftPage+1)*PAGE_SIZE >= sorted.length} onClick={() => setCraftPage(p => p+1)}>Next →</button>
          </div>
        )}

        {sorted.slice(craftPage*PAGE_SIZE, (craftPage+1)*PAGE_SIZE).map(ci => {
          const isOpen = expanded[ci.recipeId];
          return (
            <div key={ci.recipeId} className="ci" style={{ borderLeft: ci.isFriendOnly ? "3px solid #9f4dff" : undefined }}>
            <div className="ci-hdr" onClick={() => setExpanded(e => ({ ...e, [ci.recipeId]: !e[ci.recipeId] }))}>
            {ci.icon ? <img className="iico" src={ci.icon} alt="" /> : <div className="iico-ph" />}
            <span className={`ci-name rar-${ci.rarity}`}>{ci.name}</span>
            {variantLabel[ci.recipeId] && (
              <span title="This item has multiple valid recipes with different materials/costs" style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, padding: "2px 8px", borderRadius: 3, background: "rgba(159,77,255,.12)", border: "1px solid rgba(159,77,255,.4)", color: "#9f4dff", flexShrink: 0 }}>
              ⚗ {variantLabel[ci.recipeId]}
              </span>
            )}
            {ci.outputCount > 1 && <span style={{ color: "var(--text3)", fontSize: 13 }}>×{ci.outputCount}</span>}
            {ci.canCraft ? <span className="bhave">✓ Can Craft</span> : <span className="bmiss">✗ Missing</span>}
            {ci.friendBadges?.map(b => (
              <span key={b.friendId} title={ci.isFriendOnly
                ? `${b.friendName} knows this recipe — you don't. Materials shown are yours.`
                : `${b.friendName} has genuinely discovered this recipe. You're shown as able to craft it because your discipline rating qualifies, but you haven't actually discovered it yourself yet.`}
                style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, padding: "2px 7px", borderRadius: 3, background: "rgba(159,77,255,.12)", border: "1px solid rgba(159,77,255,.4)", color: "#c9a0ff", whiteSpace: "nowrap" }}>
                🛠 {b.friendName}
              </span>
            ))}
            {DAILY_CRAFT_IDS.has(ci.outputId) && (
              dailyCrafted.has(ci.outputId)
              ? <span className="bdaily-done" title={`Resets in ${resetCountdown}`}>⏳ Crafted Today · resets {resetCountdown}</span>
              : <span className="bdaily-avail" title={`Resets at 4:00 PM · ${resetCountdown} left`}>⚡ Daily Available · {resetCountdown} left</span>
            )}

            {(() => {
              const listings = myListings[ci.outputId] || [];
              const totalListed = listings.reduce((s, l) => s + l.quantity, 0);
              const mySolds = mySoldHistory.filter(s => s.item_id === ci.outputId);
              const myCurrentListing = myListings[ci.outputId];
              const showBadges = listings.length > 0 || mySolds.length > 0 || (myCurrentListing && (() => {
                const oldest = myCurrentListing.reduce((o,l) => !o || new Date(l.created) < new Date(o.created) ? l : o, null);
                return oldest ? Date.now() - new Date(oldest.created).getTime() > 48 * 3600000 : false;
              })());
              if (!showBadges) return null;
              return (
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginLeft: 6, flexWrap: "wrap" }}>
                {totalListed > 0 && (() => {
                  const now = Date.now();
                  const oldest = listings.reduce((o, l) => o === null || new Date(l.created) < new Date(o.created) ? l : o, null);
                  const ageMs = oldest ? now - new Date(oldest.created).getTime() : 0;
                  const ageTxt = ageMs < 3600000 ? `${Math.floor(ageMs/60000)}m ago` : ageMs < 86400000 ? `${Math.floor(ageMs/3600000)}h ago` : `${Math.floor(ageMs/86400000)}d ago`;
                  return (
                    <span style={{ fontSize: 11, fontFamily: "Cinzel,serif", letterSpacing: 0.5, padding: "3px 9px", borderRadius: 3, background: "rgba(80,120,200,0.18)", border: "1px solid rgba(80,120,200,0.5)", color: "#9bbcf5", display: "flex", alignItems: "center", gap: 5 }}>
                    🏪 <strong style={{color:"#b8d0ff"}}>{totalListed}×</strong> on TP · listed {ageTxt}
                    </span>
                  );
                })()}
                {/* Personal sold/stale listing badges */}
                {(() => {
                  if (mySolds.length > 0) {
                    const recentSold = mySolds[0];
                    const soldAgoMs = Date.now() - new Date(recentSold.purchased).getTime();
                    const soldAgoTxt = soldAgoMs < 3600000 ? `${Math.floor(soldAgoMs/60000)}m` : soldAgoMs < 86400000 ? `${Math.floor(soldAgoMs/3600000)}h` : `${Math.floor(soldAgoMs/86400000)}d`;
                    return (
                      <span title={`You sold ${mySolds.reduce((s,r)=>s+r.quantity,0)}× of this item. Most recent: ${soldAgoTxt} ago for ${recentSold.price > 10000 ? Math.floor(recentSold.price/10000)+"g " : ""}${Math.floor((recentSold.price%10000)/100)}s each.`}
                      style={{ fontSize:10, fontFamily:"Cinzel,serif", letterSpacing:1, padding:"2px 7px", borderRadius:3, cursor:"help", background:"rgba(60,160,60,0.15)", border:"1px solid rgba(60,160,60,0.4)", color:"var(--green2)" }}>
                      ✓ You sold {mySolds.reduce((s,r)=>s+r.quantity,0)}× · last {soldAgoTxt} ago
                      </span>
                    );
                  }
                  if (myCurrentListing) {
                    const oldest = myCurrentListing.reduce((o,l) => !o || new Date(l.created) < new Date(o.created) ? l : o, null);
                    const ageMs = oldest ? Date.now() - new Date(oldest.created).getTime() : 0;
                    if (ageMs > 48 * 3600000) {
                      const ageTxt = `${Math.floor(ageMs/86400000)}d`;
                      return (
                        <span title={`Listed ${ageTxt} ago with no sales recorded.`}
                        style={{ fontSize:10, fontFamily:"Cinzel,serif", letterSpacing:1, padding:"2px 7px", borderRadius:3, cursor:"help", background:"rgba(160,120,0,0.12)", border:"1px solid rgba(160,120,0,0.3)", color:"var(--gold)" }}>
                        ⚠ Sitting {ageTxt} unsold
                        </span>
                      );
                    }
                  }
                  return null;
                })()}
                </div>
              );
            })()}
            <div className="ci-stats">
            {(() => {
              const sellPrice = ci.outSell * ci.outputCount;
              const afterTax = Math.floor(sellPrice * 0.85);
              const taxAmt = sellPrice - afterTax;
              return (
                <>
                <div className="ci-stat">
                <span className="ci-stat-lbl">SELL PRICE</span>
                <span style={{ fontSize: 15 }}><Gold v={sellPrice} size={15} /></span>
                </div>
                <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 16 }}>
                <ReceiptStat
                label="NET PROFIT"
                value={ci.profitNet}
                size={15}
                lines={[
                  { label: "Sell Price", value: sellPrice },
                  { label: "− 15% TP Tax", value: -taxAmt },
                  { label: "− Must-Buy Mats", value: -ci.totalMustBuyCostSell },
                  { label: "Net Profit", value: ci.profitNet, isTotal: true },
                ]}
                />
                </div>
                {ci.craftAdvantage != null && (
                  <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 16 }}>
                  <ReceiptStat
                  label="CRAFT ADVANTAGE"
                  value={ci.craftAdvantage}
                  size={15}
                  lines={[
                    { label: "Net Profit", value: ci.profitNet },
                    { label: "− Owned Mats Cost", value: -(ci.matSellNet || 0) },
                    { label: "Craft Advantage", value: ci.craftAdvantage, isTotal: true },
                  ]}
                  />
                  </div>
                )}
                {ci.sellFillsPerHr != null && (
                  <div className="ci-stat" style={{ borderLeft: "1px solid var(--border)", paddingLeft: 16 }}
                  title="Buyers paying ask price per hour. High fills + few listings = low undercutting competition.">
                  <span className="ci-stat-lbl" style={{ color: !ci.buyDominates ? "var(--green2)" : "var(--text3)" }}>BUYING HIGH</span>
                  <span style={{ color: ci.sellFillsPerHr >= 2 ? "var(--green2)" : ci.sellFillsPerHr === 0 ? "var(--red)" : "var(--gold2)", fontSize: 14 }}>
                  {ci.sellFillsPerHr.toFixed(1)}/hr
                  </span>
                  </div>
                )}
                {ci.buyFillsPerHr != null && (
                  <div className="ci-stat" style={{ paddingLeft: 16 }}
                  title={ci.buyDominates ? "⚠ Market moves at floor price — selling low may be more reliable here." : "Sellers fulfilling buy orders/hr (lower bound)"}>
                  <span className="ci-stat-lbl" style={{ color: ci.buyDominates ? "var(--gold2)" : "var(--text3)" }}>SELLING LOW</span>
                  <span style={{ color: ci.buyDominates ? "var(--gold2)" : "var(--text3)", fontSize: 14 }}>
                  {ci.buyFillsPerHr.toFixed(1)}/hr{ci.buyDominates ? " ★" : ""}
                  </span>
                  </div>
                )}
                {ci.sellSignalLabel && (
                  <div className="ci-stat" style={{ borderLeft: "1px solid var(--border)", paddingLeft: 16 }}
                  title={`${ci.priceSignalLabel || "no data"} · ${velocitySummary[ci.outputId]?.observations || 0} snapshot pairs`}>
                  <span className="ci-stat-lbl">WILL IT SELL?</span>
                  <span style={{ fontSize: 12, color: ci.sellSignalColor || "var(--text3)" }}>{ci.sellSignalLabel}</span>
                  </div>
                )}
                </>
              );
            })()}
            <button className={`cbtn${craftingChartItem === ci.outputId ? " on" : ""}`}
            onClick={e => { e.stopPropagation(); setCraftingChartItem(craftingChartItem === ci.outputId ? null : ci.outputId); }}>
            📈 Chart
            </button>
            </div>
            <span style={{ color: "var(--text3)", fontSize: 13, flexShrink:0 }}>{isOpen ? "▲" : "▼"}</span>
            </div>

            {craftingChartItem === ci.outputId && (
              <div style={{ padding: "0 20px 14px", borderTop: "1px solid var(--border)", background: "var(--bg2)" }}>
              <PriceChart itemId={ci.outputId} itemName={ci.name} />
              </div>
            )}

            {isOpen && (
              <CraftDetailBody
                ci={ci}
                itemMap={data.itemMap}
                priceMap={data.priceMap}
                ownedMap={cacheRef.current.ownedMap}
                resolvedRecipes={cacheRef.current.resolvedRecipes}
                charInventoryByChar={data.charInventoryByChar}
                charDisciplines={data.charDisciplines}
                myListings={myListings}
                velocitySummary={velocitySummary}
                setActiveTab={setActiveTab}
              />
            )}
            </div>
          );
        })}
        {sorted.length > PAGE_SIZE && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 0 4px", fontSize:12, fontFamily:"Cinzel,serif", letterSpacing:1, color:"var(--text3)" }}>
          <button className="rbtn" disabled={craftPage === 0} onClick={() => { setCraftPage(p => p-1); window.scrollTo(0,0); }}>← Prev</button>
          <span>Page {craftPage+1} of {Math.ceil(sorted.length/PAGE_SIZE)}</span>
          <button className="rbtn" disabled={(craftPage+1)*PAGE_SIZE >= sorted.length} onClick={() => { setCraftPage(p => p+1); window.scrollTo(0,0); }}>Next →</button>
          </div>
        )}
        </>}
        </div>
    );
  }, [data, activeDisc, showRecMissing, showRecMaterials, showRecDaily, showRecDailyOutputs, rarityFilter, searchCraft, expanded, dailyCrafted, manualDailyCrafted, resetCountdown, myListings, mySoldHistory, velocitySummary, trendSummary, craftingChartItem, craftPage, RecommendedTab, UnlearnedRecipesTab, unlearnedRecipeCount, unlearnedLoading, friendOnlyCraftItems, friendFilter, friends, friendKnownEligibleBadges]);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
    <style>{css}</style>
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
    {showResetConfirm && (() => {
      const isMarket = resetType === "market";
      const title = isMarket ? "RESET MARKET DATABASE" : "RESET PERSONAL DATABASE";
      const description = isMarket
        ? (<>Deletes all collected price history, velocity data, and market summary from your NAS.<br /><br />
           Your crafting recommendations, flip signals, price charts, and trend data will be gone until the collector rebuilds them.<br /><br />
           You will need to restart the collector on your NAS after resetting.<br /><br />
           <span style={{ color: "var(--gold2)" }}>Your personal data (flip tracking, sold history, API key) is NOT affected.</span></>)
        : (<>Deletes all your personal app data stored locally.<br /><br />
           This removes: known crafting recipes, your GW2 API key, flip tracking history, sold order history, daily crafting records, price alerts, added friend API keys, and all app settings.<br /><br />
           <span style={{ color: "var(--gold2)" }}>Market price history on your NAS is NOT affected.</span><br /><br />
           <span style={{ color: "var(--red2,#e05555)" }}>You will need to re-enter your API key, settings, and any friend API keys after resetting.</span></>);
      const confirmLabel = isMarket ? "🗑 Reset Market DB" : "🗑 Reset Personal DB";
      const doReset = async () => {
        try {
          if (isMarket) {
            await invoke("reset_market_db_files");
            setDbStats(null);
            setMigrationStatus({ state: "done", msg: `✓ Market database deleted. Now restart the collector on your NAS:\n\nssh ${settingsNasSsh} "cd /volume1/docker/gw2-collector && sudo docker-compose down && sudo docker-compose up -d"\n\nThen wait a few minutes for data to rebuild.` });
          } else {
            await invoke("reset_database");
            setMigrationStatus({ state: "done", msg: "✓ Personal database cleared. Please re-enter your API key in Settings." });
          }
          setShowResetConfirm(false);
          setShowMigration(true);
        } catch (err) {
          setShowResetConfirm(false);
          setMigrationStatus({ state: "error", msg: `✕ Reset failed: ${err}` });
          setShowMigration(true);
        }
      };
      return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "var(--bg2)", border: "2px solid var(--red2,#e05555)", borderRadius: 8, padding: 32, maxWidth: 500, width: "90%", textAlign: "center" }}>
        <div style={{ fontFamily: "Cinzel,serif", fontSize: 16, color: "var(--red2,#e05555)", letterSpacing: 2, marginBottom: 16 }}>⚠ {title}</div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16, lineHeight: 1.7, textAlign: "left" }}>{description}</div>
        <div style={{ fontSize: 11, color: "var(--red2,#e05555)", marginBottom: 20 }}>This cannot be undone.</div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button onClick={() => setShowResetConfirm(false)}
        style={{ fontSize: 12, color: "var(--gold2)", background: "transparent", border: "1px solid var(--border)", borderRadius: 4, padding: "6px 20px", cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
        Cancel
        </button>
        <button onClick={doReset}
        style={{ fontSize: 12, color: "#fff", background: "var(--red2,#e05555)", border: "none", borderRadius: 4, padding: "6px 20px", cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
        {confirmLabel}
        </button>
        </div>
        </div>
        </div>
      );
    })()}

    {/* Friend deletion confirmation */}
    {showDeleteFriendConfirm != null && (() => {
      const f = friends.find(x => x.id === showDeleteFriendConfirm);
      return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "var(--bg2)", border: "2px solid var(--red2,#e05555)", borderRadius: 8, padding: 32, maxWidth: 440, width: "90%", textAlign: "center" }}>
        <div style={{ fontFamily: "Cinzel,serif", fontSize: 15, color: "var(--red2,#e05555)", letterSpacing: 1, marginBottom: 16 }}>⚠ REMOVE {f?.name?.toUpperCase() || "FRIEND"}</div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20, lineHeight: 1.6 }}>
        Deletes their API key and everything they're known to be able to craft from your Crafting Profits and Recommended tabs. Your own recipes, materials, and recommendations are not affected.
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button onClick={() => setShowDeleteFriendConfirm(null)}
        style={{ fontSize: 12, color: "var(--gold2)", background: "transparent", border: "1px solid var(--border)", borderRadius: 4, padding: "6px 20px", cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
        Cancel
        </button>
        <button onClick={() => handleDeleteFriend(showDeleteFriendConfirm)} disabled={friendBusy}
        style={{ fontSize: 12, color: "#fff", background: "var(--red2,#e05555)", border: "none", borderRadius: 4, padding: "6px 20px", cursor: friendBusy ? "not-allowed" : "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1, opacity: friendBusy ? 0.6 : 1 }}>
        🗑 Remove Friend
        </button>
        </div>
        </div>
        </div>
      );
    })()}

    {/* Settings Panel */}
    {showSettings && (
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 6, padding: 20, marginBottom: 16 }}>
      <div style={{ fontFamily: "Cinzel,serif", fontSize: 13, color: "var(--gold2)", letterSpacing: 2, marginBottom: 16 }}>⚙ SETTINGS</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 12, color: "var(--text2)" }}>
      <strong style={{ color: "var(--gold1)" }}>GW2 API Key</strong>
      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6 }}>
      Your personal GW2 API key. Generate one at account.arena.net - Applications.
      </div>
      <input value={settingsApiKey} onChange={e => setSettingsApiKey(e.target.value)}
      placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXXXXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
      style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 10px", color: "var(--text1)", fontSize: 12, fontFamily: "monospace" }} />
      </div>

      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8 }}>
      <strong style={{ color: "var(--gold1)" }}>NAS Address</strong>
      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6 }}>Your NAS IP or SSH address (e.g. 192.168.1.212 or derrick@192.168.1.212). Used to fetch market data from the API on your NAS, and for restarting the collector when resetting the market database. Port is automatic.</div>
      <input value={settingsNasSsh} onChange={e => setSettingsNasSsh(e.target.value)}
      style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 10px", color: "var(--text1)", fontSize: 12, fontFamily: "monospace" }} />
      </div>
      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8 }}>
      <strong style={{ color: "var(--gold1)" }}>Price Alert Threshold</strong>
      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6 }}>
      Alert when current price is at or above this % of the 7-day high. Default: 85%.
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <input type="range" min={50} max={100} step={1} value={settingsAlertThreshold}
      onChange={e => setSettingsAlertThreshold(Number(e.target.value))}
      style={{ flex: 1 }} />
      <span style={{ width: 40, color: "var(--gold2)", fontFamily: "monospace", fontSize: 13 }}>{settingsAlertThreshold}%</span>
      </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8 }}>
      <strong style={{ color: "var(--gold1)" }}>Gem Price Alert</strong>
      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6 }}>
      Alert when the gold cost for 400 gems (cheapest exchange rate) drops to or below this. Set to 0 to disable.
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <input type="number" min={0} step={1} value={settingsGemAlertThresholdGold}
      onChange={e => setSettingsGemAlertThresholdGold(Math.max(0, Number(e.target.value) || 0))}
      style={{ width: 100, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 10px", color: "var(--text1)", fontSize: 13 }} />
      <span style={{ color: "var(--text3)", fontSize: 12 }}>gold</span>
      </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
      <strong style={{ color: "var(--gold1)" }}>Rescan Auto-Unlocked Recipes</strong>
      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8, lineHeight: 1.6 }}>
      A small number of recipes (e.g. Piece of Dragon Jade) never need to be "learned" — they become usable the moment a discipline hits the required rating. These never show up in the normal recipe refresh, so if you've leveled a discipline since your very first launch, run this to catch anything newly available. Can take a minute or two — it scans every recipe in the game.
      </div>
      <button onClick={rescanAutoUnlockedRecipes} disabled={rescanningRecipes}
      style={{ fontSize: 11, color: "var(--gold2)", background: "transparent", border: "1px solid var(--border)", borderRadius: 3, padding: "5px 14px", cursor: rescanningRecipes ? "not-allowed" : "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1, opacity: rescanningRecipes ? 0.5 : 1 }}>
      {rescanningRecipes ? "⏳ Scanning all recipes..." : "🔍 Rescan Auto-Unlocked Recipes"}
      </button>
      </div>

      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
      <strong style={{ color: "var(--gold1)" }}>👥 Friend Crafters</strong>
      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10, lineHeight: 1.6 }}>
      Add a friend's GW2 API key to see recipes <em>they</em> know that you don't — Crafting Profits and Recommended will
      tag those cards with their name. Only their known-recipe list is ever read; your materials, prices, and market
      data are always what's used to score and craft the item — nothing about your friend's account beyond "does
      this recipe show up in their unlocks" is fetched or stored.
      Ask them to generate a key with only the <strong style={{ color: "var(--text2)" }}>Unlocks</strong> permission checked.
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
      <input value={friendNameInput} onChange={e => setFriendNameInput(e.target.value)} placeholder="Friend's name"
      style={{ width: 140, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 10px", color: "var(--text1)", fontSize: 12 }} />
      <input value={friendKeyInput} onChange={e => setFriendKeyInput(e.target.value)} placeholder="Friend's API key"
      style={{ flex: 1, minWidth: 220, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 10px", color: "var(--text1)", fontSize: 12, fontFamily: "monospace" }} />
      <button onClick={handleAddFriend} disabled={friendBusy}
      style={{ fontSize: 11, color: "#fff", background: "#7a4fb8", border: "none", borderRadius: 3, padding: "5px 14px", cursor: friendBusy ? "not-allowed" : "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1, opacity: friendBusy ? 0.6 : 1 }}>
      {friendBusy ? "⏳ Working..." : "+ Add Friend"}
      </button>
      </div>
      {friendActionMsg && (
        <div style={{ fontSize: 12, color: friendActionMsg.ok ? "#4caf50" : "var(--red2,#e05555)", marginBottom: 8 }}>{friendActionMsg.text}</div>
      )}
      {friends.length === 0 && <div style={{ fontSize: 12, color: "var(--text3)", fontStyle: "italic" }}>No friends added yet.</div>}
      {friends.map(f => (
        <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--text1)", flex: 1, minWidth: 100 }}>{f.name}</span>
        <span style={{ fontSize: 11, color: "var(--text3)" }}>{f.recipe_count.toLocaleString()} recipes known</span>
        {!f.last_refresh_ok && (
          <span title="Last refresh failed — the key may be invalid or revoked. Still showing their last-known recipes." style={{ fontSize: 10, color: "var(--red2,#e05555)", border: "1px solid rgba(200,60,60,.4)", borderRadius: 3, padding: "1px 6px", cursor: "help" }}>⚠ refresh failed</span>
        )}
        <span style={{ fontSize: 10, color: "var(--text3)" }}>{f.last_refresh_ts ? `updated ${new Date(f.last_refresh_ts).toLocaleDateString()}` : "never refreshed"}</span>
        <button onClick={() => handleRefreshFriend(f.id)} disabled={friendBusy} title="Refresh this friend's known recipes now"
        style={{ fontSize: 11, color: "var(--gold2)", background: "transparent", border: "1px solid var(--border)", borderRadius: 3, padding: "3px 9px", cursor: friendBusy ? "not-allowed" : "pointer" }}>
        🔄
        </button>
        <button onClick={() => setShowDeleteFriendConfirm(f.id)} disabled={friendBusy} title="Remove this friend"
        style={{ fontSize: 11, color: "var(--red2,#e05555)", background: "transparent", border: "1px solid rgba(200,60,60,.4)", borderRadius: 3, padding: "3px 9px", cursor: friendBusy ? "not-allowed" : "pointer" }}>
        🗑
        </button>
        </div>
      ))}
      {friends.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6, lineHeight: 1.6 }}>
            <strong style={{ color: "var(--gold1)" }}>🔍 Diagnostic: check a specific recipe ID</strong> — for a "friend
            knows this but it's not showing" case, this checks each stage of the pipeline directly instead of guessing.
            Find the recipe's numeric ID on the wiki page (in the "API" row of the Recipes table).
          </div>
          <input type="number" value={recipeLookupId} onChange={e => setRecipeLookupId(e.target.value)}
            placeholder="Recipe ID, e.g. 2555"
            style={{ width: 180, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 10px", color: "var(--text1)", fontSize: 12, fontFamily: "monospace" }} />
          {recipeLookupId && (() => {
            const rid = Number(recipeLookupId);
            const inFriendMap = friendRecipeMap[rid];
            const lockedEntry = lockedCraftItems.find(ci => ci.recipeId === rid);
            let knownEntry = null, knownDisc = null;
            for (const d of Object.keys(data?.byDisc || {})) {
              const hit = (data.byDisc[d] || []).find(ci => ci.recipeId === rid);
              if (hit) { knownEntry = hit; knownDisc = d; break; }
            }
            const inFriendOnlyItems = friendOnlyCraftItems.find(ci => ci.recipeId === rid);
            return (
              <div style={{ marginTop: 10, fontSize: 12, lineHeight: 2, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "10px 14px" }}>
                <div>
                  <strong style={{ color: "var(--text2)" }}>1. friendRecipeMap</strong> (does a friend actually have this recipe id, per last refresh): {" "}
                  {inFriendMap
                    ? <span style={{ color: "var(--green2)" }}>✓ yes — {inFriendMap.map(b => b.friendName).join(", ")}</span>
                    : <span style={{ color: "var(--red2,#e05555)" }}>✗ not found for any friend</span>}
                </div>
                <div>
                  <strong style={{ color: "var(--text2)" }}>2. lockedCraftItems</strong> (your own unlearned-recipe catalog): {" "}
                  {lockedEntry
                    ? <span style={{ color: "var(--green2)" }}>✓ present — disciplines: [{(lockedEntry.disciplines || []).join(", ") || "none, falls back to Uncategorized"}], canCraft: {String(lockedEntry.canCraft)}, rarity: {lockedEntry.rarity || "—"}</span>
                    : <span style={{ color: "var(--red2,#e05555)" }}>✗ not in your locked catalog at all — not yet scanned, or you already know it</span>}
                </div>
                <div>
                  <strong style={{ color: "var(--text2)" }}>3. Your own known recipes</strong> (data.byDisc, any discipline): {" "}
                  {knownEntry
                    ? <span style={{ color: "var(--gold2)" }}>⚠ already known under {knownDisc} — this is why no friend badge shows: you know it yourself</span>
                    : <span style={{ color: "var(--text3)" }}>not found — you don't know it yourself</span>}
                </div>
                <div>
                  <strong style={{ color: "var(--text2)" }}>4. friendOnlyCraftItems</strong> (the actual merged list Crafting Profits/Recommended read from): {" "}
                  {inFriendOnlyItems
                    ? <span style={{ color: "var(--green2)" }}>✓ present — disciplines: [{(inFriendOnlyItems.disciplines || []).join(", ") || "none"}]</span>
                    : <span style={{ color: "var(--red2,#e05555)" }}>✗ not present</span>}
                </div>
              </div>
            );
          })()}
        </div>
      )}
      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 8, fontStyle: "italic" }}>
      Refreshes automatically once a day, or use 🔄 above anytime. A friend's known-recipe list doesn't reflect whether
      they've already used today's daily-crafting cooldown — just whether they know how to make it.
      Friend API keys are intentionally excluded from Import/Export backups below, so a shared backup file never contains a friend's credentials.
      </div>
      </div>

      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
        <strong style={{ color: "var(--gold1)" }}>Updates & Changelog</strong>
        <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8, lineHeight: 1.6 }}>
          Current version: <span style={{ color: "var(--gold2)", fontFamily: "monospace" }}>{appVersion || "…"}</span>
        </div>

        {updateError && <div style={{ fontSize: 11, color: "var(--red2,#e05555)", marginBottom: 8 }}>{updateError}</div>}

        {updateInfo ? (
          <div style={{ background: "rgba(200,150,42,0.08)", border: "1px solid rgba(200,150,42,0.3)", borderRadius: 4, padding: "10px 14px", marginBottom: 10 }}>
            <div style={{ fontSize: 13, color: "var(--gold2)", fontWeight: 600, marginBottom: 4 }}>Update available: v{updateInfo.version}</div>
            {updateInfo.body && <div style={{ fontSize: 12, color: "var(--text2)", whiteSpace: "pre-wrap", marginBottom: 8, maxHeight: 140, overflowY: "auto" }}>{updateInfo.body}</div>}
            <button onClick={handleInstallUpdate} disabled={updateInstalling}
              style={{ fontSize: 11, color: "#fff", background: "var(--gold3,#7a5c1e)", border: "none", borderRadius: 3, padding: "5px 14px", cursor: updateInstalling ? "not-allowed" : "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1, opacity: updateInstalling ? 0.6 : 1 }}>
              {updateInstalling ? "⏳ Downloading & installing..." : "⬇ Download & Restart to Update"}
            </button>
          </div>
        ) : (
          <button onClick={handleCheckForUpdates} disabled={updateChecking}
            style={{ fontSize: 11, color: "var(--gold2)", background: "transparent", border: "1px solid var(--border)", borderRadius: 3, padding: "5px 14px", cursor: updateChecking ? "not-allowed" : "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1, opacity: updateChecking ? 0.6 : 1, marginBottom: 10 }}>
            {updateChecking ? "⏳ Checking..." : "🔍 Check for Updates"}
          </button>
        )}

        <div>
          <button onClick={handleOpenChangelog}
            style={{ fontSize: 11, color: "var(--text2)", background: "transparent", border: "1px solid var(--border)", borderRadius: 3, padding: "5px 14px", cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
            {showChangelog ? "▲ Hide Changelog" : "📜 View Changelog"}
          </button>
          {showChangelog && (
            <div style={{ marginTop: 10, maxHeight: 260, overflowY: "auto", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "10px 14px" }}>
              {changelogLoading && <div style={{ fontSize: 12, color: "var(--text3)" }}>Loading...</div>}
              {!changelogLoading && changelog.length === 0 && <div style={{ fontSize: 12, color: "var(--text3)" }}>No releases found.</div>}
              {changelog.map(r => (
                <div key={r.tag} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 13, color: "var(--gold2)", fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4 }}>{new Date(r.date).toLocaleDateString()}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>{r.body ? renderMarkdown(r.body) : "—"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
      <button onClick={async () => {
        setSettingsMsg(null);
        try {
          const nasHost = settingsNasSsh.includes("@") ? settingsNasSsh.split("@")[1] : settingsNasSsh;
          const nasApiUrl = `http://${nasHost}:8745`;
          const msg = await invoke("set_market_db_path", { path: settingsNasSsh });
          await invoke("cache_set", { key: "nas_ssh", value: settingsNasSsh });
          await invoke("cache_set", { key: "alert_threshold", value: String(settingsAlertThreshold) });
          await invoke("cache_set", { key: "gem_alert_threshold_gold", value: String(settingsGemAlertThresholdGold) });
          await invoke("cache_set", { key: "api_key", value: settingsApiKey.trim() });
          setAlertThreshold(settingsAlertThreshold);
          setGemAlertThresholdGold(settingsGemAlertThresholdGold);
          if (settingsApiKey.trim()) { setApiKey(settingsApiKey.trim()); window.__gw2ApiKey = settingsApiKey.trim(); }
          setSettingsMsg({ ok: true, text: msg });
        } catch(e) { setSettingsMsg({ ok: false, text: String(e) }); }
      }} style={{ fontSize: 12, color: "#fff", background: "var(--gold3,#7a5c1e)", border: "none", borderRadius: 4, padding: "6px 16px", cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
      Save
      </button>
      </div>
      {settingsMsg && <div style={{ fontSize: 12, color: settingsMsg.ok ? "#4caf50" : "var(--red2,#e05555)" }}>{settingsMsg.text}</div>}
      </div>
      </div>
    )}
    {/* Import / Export panel */}
    {showMigration && (
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 6, padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 280 }}>
      <div style={{ fontFamily: "Cinzel,serif", fontSize: 13, color: "var(--gold2)", letterSpacing: 2, marginBottom: 8 }}>📥 IMPORT</div>
      <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10, lineHeight: 1.6 }}>
      Load a previously exported <code>.json</code> backup — from this app or the browser version.
      </div>
      <input type="file" accept=".json"
      style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8, display: "block" }}
      onChange={async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        setMigrationStatus({ state: "importing", msg: "Reading file..." });
        try {
          const text = await file.text();
          const json = JSON.parse(text);
          setMigrationStatus({ state: "importing", msg: "Importing into SQLite..." });
          const result = await importFromBrowser(json);
          setMigrationStatus({ state: "done", msg: `✓ Imported ${(result.price_snapshots_imported || 0).toLocaleString()} price snapshots.` });
          getDbStats().then(setDbStats);
        } catch (err) {
          setMigrationStatus({ state: "error", msg: `✕ Import failed: ${err.message}` });
        }
      }} />
      {migrationStatus && (
        <div style={{ fontSize: 12, fontFamily: "monospace", whiteSpace: "pre-wrap", lineHeight: 1.7,
          color: migrationStatus.state === "done" ? "var(--green2)" : migrationStatus.state === "error" ? "var(--red)" : "var(--gold2)" }}>
          {migrationStatus.msg}
          </div>
      )}
      </div>
      <div style={{ flex: 1, minWidth: 280 }}>
      <div style={{ fontFamily: "Cinzel,serif", fontSize: 13, color: "var(--gold2)", letterSpacing: 2, marginBottom: 8 }}>📤 EXPORT</div>
      <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10, lineHeight: 1.6 }}>
      Save all your price history, flip tracking, and cache to a <code>.json</code> file. Use this before reformatting.
      </div>
      <button onClick={async () => {
        setMigrationStatus({ state: "importing", msg: "Exporting data..." });
        try {
          const exportData = await exportAllData();
          const blob = new Blob([JSON.stringify(exportData)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `gw2-backup-${new Date().toISOString().slice(0,10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
          setMigrationStatus({ state: "done", msg: `✓ Exported ${((exportData.price_history || []).length).toLocaleString()} price snapshots.` });
        } catch (err) {
          setMigrationStatus({ state: "error", msg: `✕ Export failed: ${err.message}` });
        }
      }} style={{ fontSize: 11, color: "var(--gold2)", background: "transparent", border: "1px solid var(--border)", borderRadius: 3, padding: "4px 14px", cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
      📤 Export Backup
      </button>
      </div>
      </div>
      </div>
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
      <StatusBar />
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

      {activeTab === "materials" && MaterialsTab}
      {activeTab === "crafting" && CraftingTab}
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
      {activeTab === "flipping" && data && (() => {
        const itemMap = data.itemMap || {};

        // Helper: format age
        const fmtAge = ms => ms < 3600000 ? `${Math.floor(ms/60000)}m ago` : ms < 86400000 ? `${Math.floor(ms/3600000)}h ago` : `${Math.floor(ms/86400000)}d ago`;

        // Build flip candidates: items with sufficient data + current price context
        const flipCandidates = Object.entries(flipSummary)
        .map(([idStr, flip]) => {
          const id = Number(idStr);
          const item = itemMap[id];
          const cur = data.priceMap[id];
          const curSell = cur?.sells?.unit_price || 0;
          const curBuy  = cur?.buys?.unit_price  || 0;
          if (!curSell) return null;
          const vel = velocitySummary[id];
          const sellFills = vel?.observations >= 5 ? vel.sellFillsPerHr : null;
          // Dip/spike classification using percentiles
          const isBuyNow  = curSell <= flip.p25Sell; // in bottom 25% — dip
          const isSellNow = curSell >= flip.p75Sell; // in top 25% — spike
          const isNeutral = !isBuyNow && !isSellNow;
          // Predicted profit: buy now at curSell, sell at p75 target
          const predictedProfit = isBuyNow ? Math.floor(flip.p75Sell * 0.85) - curSell : null;
          const predictedProfitOptimistic = isBuyNow ? Math.floor(flip.p90Sell * 0.85) - curSell : null;
          // Position in range: 0 = at floor, 1 = at ceiling
          const pricePosition = flip.p90Sell > flip.p10Sell ? (curSell - flip.p10Sell) / (flip.p90Sell - flip.p10Sell) : 0.5;
          return { id, item, flip, curSell, curBuy, sellFills, isBuyNow, isSellNow, isNeutral, predictedProfit, predictedProfitOptimistic, pricePosition };
        })
        .filter(Boolean)
        .filter(r => {
          if (r.sellFills == null) return false;
          if (r.sellFills < 1.0) return false;
          // For buy-now: only show if there's actual profit after 15% TP tax
          if (r.isBuyNow && (r.predictedProfit == null || r.predictedProfit <= 0)) return false;
          // Only show actionable signals
          return r.isBuyNow || r.isSellNow;
        })
        .sort((a, b) => {
          // Unified score: predicted profit × sell rate = expected gold per hour of flipping.
          // A fast market with modest spread beats a slow market with great spread
          // because you complete more flips per day and hold less risk per position.
          // For sell-now items: use current price above median × sell rate as proxy.
          const aProfit = a.isBuyNow ? (a.predictedProfit || 0) : a.isSellNow ? Math.floor((a.curSell - a.flip.p50Sell) * 0.85) : 0;
          const bProfit = b.isBuyNow ? (b.predictedProfit || 0) : b.isSellNow ? Math.floor((b.curSell - b.flip.p50Sell) * 0.85) : 0;
          const aFlipScore = aProfit * (a.sellFills || 0);
          const bFlipScore = bProfit * (b.sellFills || 0);
          // BUY NOW and SELL NOW always rank above mid-range, but within actionable signals sort by score
          const aActionable = a.isBuyNow || a.isSellNow ? 1 : 0;
          const bActionable = b.isBuyNow || b.isSellNow ? 1 : 0;
          if (aActionable !== bActionable) return bActionable - aActionable;
          return bFlipScore - aFlipScore;
        });

        // Pending flips: check if "sell now" for any pending item
        const pendingEnriched = pendingFlips.map(pf => {
          const cur = data.priceMap[pf.itemId];
          const curSell = cur?.sells?.unit_price || 0;
          const flip = flipSummary[pf.itemId];
          const isSellNow = flip && curSell >= flip.p75Sell;
          const currentProfit = curSell > 0 ? Math.floor(curSell * 0.85) - pf.buyPrice : null;
          return { ...pf, curSell, flip, isSellNow, currentProfit, item: itemMap[pf.itemId] };
        });

        return (
          <div>
          {/* Info banner */}
          <div style={{ marginBottom:18, padding:"12px 16px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:5, fontSize:13, color:"var(--text3)", lineHeight:1.6 }}>
          <span style={{ fontFamily:"Cinzel,serif", fontSize:11, letterSpacing:2, color:"var(--gold2)" }}>FLIP MARKET</span>
          {" — "}Buy at price dips (bottom 25% of historical range), sell at spikes (top 25%). Signals improve significantly with 30+ days of data.
          {Object.keys(flipSummary).length === 0 && <span style={{ color:"var(--gold)" }}> Collecting price history — check back in a few days.</span>}
          {Object.keys(flipSummary).length > 0 && <span style={{ marginLeft:8, color:"var(--text3)" }}>{Object.keys(flipSummary).length} items tracked · {flipCandidates.filter(r=>r.isBuyNow).length} buy signals · {flipCandidates.filter(r=>r.isSellNow).length} sell signals</span>}
          </div>

          {/* ── Pending Flips ── */}
          {pendingFlips.length > 0 && (
            <div className="lp-section" style={{ marginBottom:24 }}>
            <div className="lp-hdr" style={{ background:"rgba(80,120,200,0.1)", borderColor:"rgba(80,120,200,0.3)", color:"#9bbcf5" }}>
            ⏳ PENDING FLIPS — {pendingFlips.length} open position{pendingFlips.length > 1 ? "s" : ""}
            </div>
            {pendingEnriched.map(pf => (
              <div key={pf.id} className="lp-row" style={{ borderLeft: pf.isSellNow ? "3px solid var(--gold2)" : "3px solid rgba(80,120,200,0.4)", background: pf.isSellNow ? "rgba(200,150,42,0.05)" : undefined }}>
              {pf.item?.icon
                ? <img src={pf.item.icon} style={{ width:36, height:36, borderRadius:3, border:"1px solid var(--border2)", flexShrink:0 }} alt="" />
                : <div style={{ width:36, height:36, background:"var(--bg4)", borderRadius:3, flexShrink:0 }} />
              }
              <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:15, fontWeight:600, color:"var(--text1)", display:"flex", alignItems:"center", gap:8 }}>
              {pf.itemName || pf.item?.name || `Item ${pf.itemId}`}
              {pf.isSellNow && (
                <span style={{ fontSize:10, fontFamily:"Cinzel,serif", letterSpacing:1, padding:"2px 8px", borderRadius:3, background:"rgba(200,150,42,.2)", border:"1px solid rgba(200,150,42,.5)", color:"var(--gold2)" }}>
                💰 SELL NOW — at spike
                </span>
              )}
              </div>
              <div style={{ fontSize:12, color:"var(--text3)", marginTop:3, display:"flex", gap:12, flexWrap:"wrap" }}>
              <span>Bought {fmtAge(Date.now() - pf.buyTime)}</span>
              <span>×{pf.qty} @ <Gold v={pf.buyPrice} size={11} /></span>
              <span>Target: <Gold v={pf.targetSellPrice} size={11} /></span>
              {pf.curSell > 0 && <span style={{ color: pf.currentProfit > 0 ? "var(--green2)" : "var(--red)" }}>Current net: {pf.currentProfit > 0 ? "+" : ""}<Gold v={pf.currentProfit} size={11} /> each</span>}
              </div>
              </div>
              <div className="stat-cell" style={{ textAlign:"right", minWidth:120 }}>
              <span className="stat-lbl">CURRENT ASK</span>
              <Gold v={pf.curSell} size={14} />
              </div>
              <div className="stat-cell" style={{ textAlign:"right", minWidth:130 }}>
              <span className="stat-lbl">PREDICTED PROFIT</span>
              <span className={pf.currentProfit >= 0 ? "pp" : "pn"}>{pf.currentProfit >= 0 ? "+" : ""}<Gold v={pf.currentProfit * pf.qty} size={13} /></span>
              <span style={{ fontSize:11, color:"var(--text3)" }}>×{pf.qty}</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
              {pf.isSellNow && (
                <button className="rbtn" style={{ fontSize:11, color:"var(--gold2)", borderColor:"rgba(200,150,42,.4)" }}
                onClick={() => {
                  const profit = pf.currentProfit * pf.qty;
                  flipHistoryAdd({ itemId: pf.itemId, itemName: pf.itemName, buyPrice: pf.buyPrice, qty: pf.qty, sellPrice: pf.curSell, buyTime: pf.buyTime, sellTime: Date.now(), profit, failedFlip: false });
                  flipPendingDelete(pf.id);
                  setPendingFlips(prev => prev.filter(p => p.id !== pf.id));
                  flipHistoryGetAll().then(setFlipHistory);
                }}>
                ✓ Mark Sold
                </button>
              )}
              <button className="rbtn" style={{ fontSize:11, color:"var(--red)", borderColor:"rgba(200,60,60,.4)" }}
              onClick={() => {
                const loss = (pf.curSell > 0 ? Math.floor(pf.curSell * 0.85) - pf.buyPrice : -pf.buyPrice) * pf.qty;
                flipHistoryAdd({ itemId: pf.itemId, itemName: pf.itemName, buyPrice: pf.buyPrice, qty: pf.qty, sellPrice: pf.curSell || 0, buyTime: pf.buyTime, sellTime: Date.now(), profit: loss, failedFlip: true });
                flipPendingDelete(pf.id);
                setPendingFlips(prev => prev.filter(p => p.id !== pf.id));
                flipHistoryGetAll().then(setFlipHistory);
              }}>
              ✗ Remove (lost)
              </button>
              </div>
              </div>
            ))}
            </div>
          )}

          {/* ── Opportunities ── */}
          <div className="lp-section">
          <div className="lp-hdr">📊 FLIP OPPORTUNITIES</div>
          <div style={{ fontSize:11, color:"var(--text3)", fontFamily:"Cinzel,serif", letterSpacing:1, padding:"4px 16px 8px", borderBottom:"1px solid var(--border)" }}>
          Ranked by profit × sell rate (expected gold/hr) · min 1.0/hr · actionable signals only
          </div>
          {flipCandidates.length === 0 && Object.keys(flipSummary).length > 0 && (
            <div className="empty" style={{ padding:20 }}>No profitable flip opportunities at current prices. Markets are near median — check back when prices shift.</div>
          )}
          {flipCandidates.length > 0 && (() => {
            const buyNow  = flipCandidates.filter(r => r.isBuyNow);
            const sellNow = flipCandidates.filter(r => r.isSellNow);
            const FlipCol = "44px 1fr 90px 140px 160px";
            // FlipRow defined at module level
            // ColHeader defined at module level
            return (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 1px", background:"var(--border)" }}>
              {/* ── Buy Now column ── */}
              <div style={{ background:"var(--bg1)" }}>
              <ColHeader label="🟢 BUY NOW" color="var(--green2)" count={buyNow.length} flipCol={FlipCol} />
              {buyNow.length === 0
                ? <div style={{ padding:"16px 12px", fontSize:12, color:"var(--text3)" }}>No buy signals right now</div>
                : buyNow.map(r => <FlipRow key={r.id} r={r} side="buy" flipCol={FlipCol} chartItem={craftingChartItem} setChartItem={setCraftingChartItem} onTrack={cb => flipPendingAdd(cb).then(() => flipPendingGetAll().then(setPendingFlips))} />)
              }
              </div>
              {/* ── Sell Now column ── */}
              <div style={{ background:"var(--bg1)" }}>
              <ColHeader label="💰 SELL NOW" color="var(--gold2)" count={sellNow.length} flipCol={FlipCol} />
              {sellNow.length === 0
                ? <div style={{ padding:"16px 12px", fontSize:12, color:"var(--text3)" }}>No sell signals right now</div>
                : sellNow.map(r => <FlipRow key={r.id} r={r} side="sell" flipCol={FlipCol} chartItem={craftingChartItem} setChartItem={setCraftingChartItem} onTrack={cb => flipPendingAdd(cb).then(() => flipPendingGetAll().then(setPendingFlips))} />)
              }
              </div>
              </div>
            );
          })()}
          </div>

          {/* ── Flip History ── */}
          {flipHistory.length > 0 && (
            <div className="lp-section" style={{ marginTop:24 }}>
            <div className="lp-hdr">📜 FLIP HISTORY</div>
            <div style={{ display:"grid", gap:4 }}>
            {flipHistory.map(fh => {
              const ageMs = Date.now() - (fh.sellTime || fh.buyTime);
              return (
                <div key={fh.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 14px", background:"var(--bg2)", borderRadius:4, fontSize:13, borderLeft: fh.failedFlip ? "3px solid var(--red2)" : "3px solid var(--green2)" }}>
                <div style={{ flex:1, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontWeight:600, color:"var(--text1)" }}>{fh.itemName || `Item ${fh.itemId}`}</span>
                {fh.failedFlip && <span style={{ fontSize:10, fontFamily:"Cinzel,serif", color:"var(--red)", padding:"1px 6px", border:"1px solid rgba(200,60,60,.3)", borderRadius:3 }}>LOSS</span>}
                </div>
                <span style={{ color:"var(--text3)", fontSize:12 }}>×{fh.qty}</span>
                <span style={{ color:"var(--text3)", fontSize:12 }}>bought <Gold v={fh.buyPrice} size={11} /></span>
                {fh.sellPrice > 0 && <span style={{ color:"var(--text3)", fontSize:12 }}>sold <Gold v={fh.sellPrice} size={11} /></span>}
                <span className={fh.profit >= 0 ? "pp" : "pn"} style={{ fontWeight:600 }}>{fh.profit >= 0 ? "+" : ""}<Gold v={fh.profit} size={13} /></span>
                <span style={{ color:"var(--text3)", fontSize:12 }}>{fmtAge(ageMs)}</span>
                <button onClick={() => {
                  flipHistoryDelete(fh.id).then(() => {
                    setFlipHistory(prev => prev.filter(h => h.id !== fh.id));
                  }).catch(() => {});
                }} style={{ background:"transparent", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:14, padding:"0 2px", lineHeight:1 }} title="Remove from history">×</button>
                </div>
              );
            })}
            <div style={{ padding:"8px 14px", fontSize:12, color:"var(--text3)", display:"flex", gap:20 }}>
            <span>Total flips: {flipHistory.length}</span>
            <span style={{ color: flipHistory.reduce((s,h)=>s+h.profit,0) >= 0 ? "var(--green2)" : "var(--red)" }}>
            Net P&amp;L: {flipHistory.reduce((s,h)=>s+h.profit,0) >= 0 ? "+" : ""}<Gold v={flipHistory.reduce((s,h)=>s+h.profit,0)} size={12} />
            </span>
            <span>Won: {flipHistory.filter(h=>!h.failedFlip).length} / Lost: {flipHistory.filter(h=>h.failedFlip).length}</span>
            </div>
            </div>
            </div>
          )}
          </div>
        );
      })()}
      {activeTab === "listings" && data && (() => {
        const itemMap = data.itemMap || {};

        // Sub-tab header
        const tpSubHdr = (
          <div style={{ display: "flex", gap: 6, marginBottom: 18, borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
          {[["current", "🏪 Current Listings", Object.keys(myListings).length],
            ["history", "📜 Sale History", mySoldHistory.length]
          ].map(([key, label, count]) => (
            <button key={key} onClick={() => setTpSubTab(key)}
            style={{ fontSize: 12, fontFamily: "Cinzel,serif", letterSpacing: 1, padding: "5px 14px", borderRadius: 4, cursor: "pointer", border: tpSubTab === key ? "1px solid var(--gold2)" : "1px solid var(--border)", background: tpSubTab === key ? "rgba(180,140,40,.15)" : "transparent", color: tpSubTab === key ? "var(--gold1)" : "var(--text2)" }}>
            {label}{count > 0 && <span style={{ marginLeft: 6, fontSize: 10, opacity: .7 }}>{count}</span>}
            </button>
          ))}
          </div>
        );

        // Active sell listings grouped and sorted by value
        const listingRows = Object.entries(myListings)
        .map(([itemId, listings]) => {
          const id = Number(itemId);
          const item = itemMap[id];
          const totalQty = listings.reduce((s, l) => s + l.quantity, 0);
          const minPrice = Math.min(...listings.map(l => l.price));
          const maxPrice = Math.max(...listings.map(l => l.price));
          const totalValue = listings.reduce((s, l) => s + l.price * l.quantity, 0);
          const totalNet = Math.floor(totalValue * 0.85);
          const oldest = listings.reduce((o, l) => !o || new Date(l.created) < new Date(o.created) ? l : o, null);
          const ageMs = oldest ? Date.now() - new Date(oldest.created).getTime() : 0;
          const ageTxt = ageMs < 3600000 ? `${Math.floor(ageMs/60000)}m` : ageMs < 86400000 ? `${Math.floor(ageMs/3600000)}h` : `${Math.floor(ageMs/86400000)}d`;
          const vel = velocitySummary[id];
          const sellFills = vel?.observations >= 5 ? vel.sellFillsPerHr : null;
          // Current market ask price from priceMap
          const mktAsk = data.priceMap[id]?.sells?.unit_price || 0;
          const mktBid = data.priceMap[id]?.buys?.unit_price || 0;
          const mktListings = data.priceMap[id]?.sells?.quantity || 0;
          // Undercut: someone is listing below my cheapest price
          const isUndercut = mktAsk > 0 && minPrice > 0 && mktAsk < minPrice;
          const undercutBy = isUndercut ? minPrice - mktAsk : 0;
          // Days to sell: listings ahead of me in queue / fill rate
          // Listings ahead ≈ total market listings minus my qty (rough estimate)
          const queueAhead = Math.max(0, mktListings - totalQty);
          const daysToSell = (sellFills && sellFills > 0) ? queueAhead / (sellFills * 24) : null;
          // Sold history for this item
          const mySolds = mySoldHistory.filter(s => s.item_id === id);
          const lastSoldMs = mySolds.length > 0 ? Date.now() - new Date(mySolds[0].purchased).getTime() : null;
          return { id, item, totalQty, minPrice, maxPrice, totalValue, totalNet, ageTxt, ageMs, listings, sellFills, mktAsk, mktBid, mktListings, isUndercut, undercutBy, daysToSell, mySolds, lastSoldMs };
        })
        .sort((a, b) => {
          // Undercut items float to top, each group sorted newest listed first
          if (a.isUndercut !== b.isUndercut) return a.isUndercut ? -1 : 1;
          return a.ageMs - b.ageMs;
        });

        // Sold history — group by item, show individually
        const soldRows = mySoldHistory.slice(0, 200);
        // Aggregate stats
        const totalListedNet = listingRows.reduce((s, r) => s + r.totalNet, 0);
        const totalListedQty = listingRows.reduce((s, r) => s + r.totalQty, 0);
        const soldLast30 = soldRows.filter(r => new Date(r.purchased) > new Date(Date.now() - 30*86400000));
        const soldRevenue30 = soldLast30.reduce((s, r) => s + r.price * r.quantity, 0);
        const soldNet30 = Math.floor(soldRevenue30 * 0.85);

        return (
          <div>
          {tpSubHdr}
          {/* Summary strip */}
          <div className="cards" style={{ gridTemplateColumns: "repeat(2,1fr)", marginBottom: 20 }}>
          {(tpSubTab === "current" ? [
            ["ACTIVE LISTINGS", listingRows.length + " items", `${totalListedQty} total qty`],
            ["LISTING VALUE (NET)", <Gold v={totalListedNet} size={15} />, "after 15% tax"],
          ] : [
            ["SOLD (30 DAYS)", soldLast30.length + " transactions", `${soldLast30.reduce((s,r)=>s+r.quantity,0)} items sold`],
            ["REVENUE (30 DAYS)", <Gold v={soldNet30} size={15} />, "after 15% tax"],
          ]).map(([lbl, val, sub]) => (
            <div key={lbl} className="card">
            <div className="card-lbl">{lbl}</div>
            <div className="card-val" style={{ fontSize: 20 }}>{val}</div>
            <div className="card-sub">{sub}</div>
            </div>
          ))}
          </div>

          {/* Active Listings */}
          {tpSubTab === "current" && <div className="lp-section">
            <div className="lp-hdr">🏪 ACTIVE SELL LISTINGS</div>
            {listingRows.length === 0 && <div className="empty">No active sell listings found.</div>}
            {listingRows.map(r => {
              const soldQty30 = r.mySolds.filter(s => new Date(s.purchased) > new Date(Date.now()-30*86400000)).reduce((s,x)=>s+x.quantity,0);
              // Stale detection: listed > 3 days, no sales in history, low fills
              const isStale = r.ageMs > 3*86400000 && r.mySolds.length === 0 && (r.sellFills == null || r.sellFills < 0.2);
              return (
                <div key={r.id} className="lp-row" style={{ borderLeft: r.isUndercut ? "3px solid var(--red2)" : isStale ? "3px solid rgba(200,150,42,.3)" : "3px solid transparent" }}>
                {r.item?.icon
                  ? <img src={r.item.icon} style={{ width:36, height:36, borderRadius:3, border:"1px solid var(--border2)", flexShrink:0 }} alt="" />
                  : <div style={{ width:36, height:36, borderRadius:3, background:"var(--bg4)", flexShrink:0 }} />
                }
                <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:600, color:"var(--text1)", display:"flex", alignItems:"center", gap:8 }}>
                {r.item?.name || `Item ${r.id}`}
                {r.isUndercut && (
                  <span title={`Someone is listing at ${Math.floor(r.mktAsk/10000)}g${Math.floor((r.mktAsk%10000)/100)}s — ${Math.floor(r.undercutBy/10000)}g${Math.floor((r.undercutBy%10000)/100)}s below your price. Relist at ${r.mktAsk - 1}c to be lowest.`}
                  style={{ fontSize:10, fontFamily:"Cinzel,serif", letterSpacing:1, padding:"2px 7px", borderRadius:3, background:"rgba(200,60,60,.15)", border:"1px solid rgba(200,60,60,.4)", color:"var(--red2)", cursor:"help" }}>
                  ⚡ UNDERCUT −<Gold v={r.undercutBy} size={10} />
                  </span>
                )}
                {isStale && !r.isUndercut && (
                  <span title={`Listed ${r.ageTxt} ago with no confirmed sales and low market activity. Consider cancelling or adjusting price.`}
                  style={{ fontSize:10, fontFamily:"Cinzel,serif", letterSpacing:1, padding:"2px 7px", borderRadius:3, background:"rgba(160,120,0,.12)", border:"1px solid rgba(160,120,0,.3)", color:"var(--gold)", cursor:"help" }}>
                  ⚠ STALE
                  </span>
                )}
                {soldQty30 > 0 && (
                  <span title={`You sold ${soldQty30}× in last 30 days — confirmed demand`}
                  style={{ fontSize:10, fontFamily:"Cinzel,serif", letterSpacing:1, padding:"2px 7px", borderRadius:3, background:"rgba(60,160,60,.12)", border:"1px solid rgba(60,160,60,.3)", color:"var(--green2)", cursor:"help" }}>
                  ✓ {soldQty30}× sold/30d
                  </span>
                )}
                </div>
                <div style={{ fontSize:12, color:"var(--text3)", marginTop:3, display:"flex", gap:12, flexWrap:"wrap" }}>
                <span>listed {r.ageTxt} ago</span>
                <span>{r.mktListings.toLocaleString()} on market</span>
                {r.daysToSell != null && <span title="Estimated days for your listing to clear based on queue depth and fill rate" style={{ color: r.daysToSell < 1 ? "var(--green2)" : r.daysToSell < 7 ? "var(--gold2)" : "var(--red)" }}>~{r.daysToSell < 1 ? `${Math.round(r.daysToSell*24)}h` : `${r.daysToSell.toFixed(1)}d`} to sell</span>}
                </div>
                </div>
                <div className="stat-cell" style={{ textAlign:"right", minWidth:80 }}>
                <span className="stat-lbl">QTY</span>
                <span style={{ fontSize:16, color:"var(--text1)" }}>{r.totalQty}×</span>
                </div>
                <div className="stat-cell" style={{ textAlign:"right", minWidth:130 }}>
                <span className="stat-lbl">MY PRICE</span>
                <Gold v={r.minPrice} size={14} />
                {r.isUndercut && <div style={{ fontSize:11, color:"var(--red)" }}>mkt: <Gold v={r.mktAsk} size={11} /></div>}
                </div>
                <div className="stat-cell" style={{ textAlign:"right", minWidth:130 }}>
                <span className="stat-lbl">TOTAL NET</span>
                <span className="pp"><Gold v={r.totalNet} size={14} /></span>
                </div>
                <div className="stat-cell" style={{ textAlign:"right", minWidth:110 }} title="Buyers paying ask price per hour (upper bound market velocity)">
                <span className="stat-lbl">BUYING HIGH</span>
                <span style={{ fontSize:13, color: r.sellFills > 0.5 ? "var(--green2)" : r.sellFills === 0 ? "var(--red)" : r.sellFills != null ? "var(--gold2)" : "var(--text3)" }}>
                {r.sellFills != null ? `${r.sellFills.toFixed(1)}/hr` : "no data"}
                </span>
                </div>
                </div>
              );
            })}
            </div>}

            {/* Sold History */}
            {tpSubTab === "history" && <div className="lp-section">
              <div className="lp-hdr">
              💰 SELL HISTORY
              <span style={{ fontSize:11, color:"var(--text3)", fontFamily:"var(--font-body)", fontStyle:"italic", letterSpacing:0 }}>most recent 200 transactions</span>
              </div>
              {soldRows.length === 0 && <div className="empty">No sold history found. The GW2 API returns up to 500 recent transactions.</div>}
              {soldRows.map((r, i) => {
                const item = itemMap[r.item_id];
                const net = Math.floor(r.price * 0.85);
                const totalNet = Math.floor(r.price * r.quantity * 0.85);
                const dt = new Date(r.purchased);
                const dateTxt = dt.toLocaleDateString(undefined, { month:"short", day:"numeric", year:"numeric" });
                const timeTxt = dt.toLocaleTimeString(undefined, { hour:"2-digit", minute:"2-digit" });
                return (
                  <div key={i} className="sold-row">
                  {item?.icon
                    ? <img src={item.icon} style={{ width:32, height:32, borderRadius:3, border:"1px solid var(--border2)", flexShrink:0 }} alt="" />
                    : <div style={{ width:32, height:32, borderRadius:3, background:"var(--bg4)", flexShrink:0 }} />
                  }
                  <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, color:"var(--text1)" }}>{item?.name || `Item ${r.item_id}`}</div>
                  </div>
                  <div className="sold-date">{dateTxt} {timeTxt}</div>
                  <div className="sold-qty">{r.quantity}×</div>
                  <div className="stat-cell" style={{ textAlign:"right", minWidth:110 }}>
                  <span className="stat-lbl">UNIT (NET)</span>
                  <Gold v={net} size={13} />
                  </div>
                  <div className="sold-total"><span className="pp"><Gold v={totalNet} size={14} /></span></div>
                  </div>
                );
              })}
              </div>}
              </div>
        );
      })()}
      {activeTab === "daily" && data && (() => {
        const discLevels = cacheRef.current.disciplineLevels || {};
        const eligible = data.timegatedList || [];
        // Combine API-tracked completions and manual count-delta completions
        const isDone = (r) => {
          if (r.trackByCount ? manualDailyCrafted.has(r.itemId) : dailyCrafted.has(r.itemId)) return true;
          // Also check if sold on TP today (since last reset at 00:00 UTC)
          const resetTs = getDailyResetTs();
          return mySoldHistory.some(s => s.item_id === r.itemId && new Date(s.purchased).getTime() >= resetTs);
        };
        const doneCount = eligible.filter(r => isDone(r)).length + (weeklyKeyDone ? 1 : 0);
        const totalCount = eligible.length + 1; // +1 for weekly key
        const allDone = doneCount === totalCount && totalCount > 1;
        // Weekly reset countdown
        const weeklyResetTs = getWeeklyResetTs() + 7 * 86400000; // next reset
        const weeklyMsLeft = weeklyResetTs - Date.now();
        const weeklyDays = Math.floor(weeklyMsLeft / 86400000);
        const weeklyHrs = Math.floor((weeklyMsLeft % 86400000) / 3600000);
        const weeklyCountdown = weeklyMsLeft > 0 ? `${weeklyDays}d ${weeklyHrs}h` : "now";
        return (
          <div>
          {/* Header bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
          <span style={{ fontFamily: "Cinzel,serif", fontSize: 13, letterSpacing: 1, color: "var(--gold2)" }}>
          DAILY TIME-GATED CRAFTS
          </span>
          <span style={{ marginLeft: 12, fontSize: 12, color: "var(--text3)" }}>
          Resets at midnight UTC · count-tracked items update within 1 minute
          </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {allDone
            ? <span style={{ fontSize: 12, color: "var(--green2)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>✓ ALL DONE</span>
            : <span style={{ fontSize: 12, color: "var(--text3)" }}>{doneCount}/{totalCount} done</span>
          }
          <span style={{ fontSize: 13, color: "var(--gold)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
          ⏱ {resetCountdown}
          </span>
          </div>
          </div>

          {eligible.length === 0 && (
            <div className="empty">No time-gated recipes available at your current discipline levels.</div>
          )}

          {/* Weekly Level 10 Key */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            padding: "14px 20px", marginBottom: 8, borderRadius: 6,
            background: weeklyKeyDone ? "rgba(30,50,30,0.5)" : "var(--bg3)",
                border: `1px solid ${weeklyKeyDone ? "rgba(60,140,60,0.4)" : "var(--border)"}`,
                opacity: weeklyKeyDone ? 0.75 : 1,
                transition: "all .2s",
          }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: weeklyKeyDone ? "rgba(60,160,60,0.2)" : "rgba(100,140,200,0.1)",
                border: `2px solid ${weeklyKeyDone ? "var(--green2)" : "rgba(100,140,200,0.4)"}`,
                fontSize: 18,
          }}>
          {weeklyKeyDone ? "✓" : "🗝"}
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 4, background: "rgba(100,140,200,0.15)", border: "1px solid rgba(100,140,200,0.3)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
          🗝
          </div>
          <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: weeklyKeyDone ? "var(--text3)" : "var(--text1)", marginBottom: 4 }}>
          Weekly Level 10 Key
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)" }}>
          Level any character to 10 · Resets Monday 07:30 UTC · Next reset in {weeklyCountdown}
          </div>
          </div>
          <button
          onClick={() => {
            const newDone = !weeklyKeyDone;
            setWeeklyKeyDone(newDone);
            invoke("cache_set", { key: "weekly_key_done", value: JSON.stringify({ done: newDone, weeklyResetTs: getWeeklyResetTs() }) }).catch(() => {});
          }}
          style={{
            fontSize: 12, fontFamily: "Cinzel,serif", letterSpacing: 1,
            padding: "5px 14px", borderRadius: 4, cursor: "pointer",
            background: weeklyKeyDone ? "rgba(60,160,60,0.15)" : "rgba(100,140,200,0.15)",
                border: `1px solid ${weeklyKeyDone ? "rgba(60,160,60,0.4)" : "rgba(100,140,200,0.4)"}`,
                color: weeklyKeyDone ? "var(--green2)" : "var(--text2)",
          }}>
          {weeklyKeyDone ? "✓ Done" : "Mark Done"}
          </button>
          </div>

          {/* One card per eligible recipe */}
          {eligible.map(r => {
            const done = isDone(r);
            const item = data.itemMap[r.itemId] || extraDailyItems[r.itemId];
            const price = data.priceMap[r.itemId];
            const sellNet = price?.sells?.unit_price ? Math.floor(price.sells.unit_price * 0.85) : null;
            return (
              <div key={r.itemId} style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "14px 20px", marginBottom: 8, borderRadius: 6,
                background: done ? "rgba(30,50,30,0.5)" : "var(--bg3)",
                    border: `1px solid ${done ? "rgba(60,140,60,0.4)" : "var(--border)"}`,
                    opacity: done ? 0.75 : 1,
                    transition: "all .2s",
              }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? "rgba(60,160,60,0.2)" : "rgba(200,150,42,0.1)",
                    border: `2px solid ${done ? "var(--green2)" : "rgba(200,150,42,0.4)"}`,
                    fontSize: 18,
              }}>
              {done ? "✓" : "·"}
              </div>

              {item?.icon
                ? <img src={item.icon} style={{ width: 40, height: 40, borderRadius: 4, border: "1px solid var(--border2)", flexShrink: 0 }} alt="" />
                : <div style={{ width: 40, height: 40, borderRadius: 4, background: "var(--bg4)", flexShrink: 0 }} />
              }

              <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: done ? "var(--text3)" : "var(--text1)", marginBottom: 4 }}>
              {r.name}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {(r.allDiscs || r.qualDiscs.map(d => ({name:d,level:0,qualifies:true}))).map(d => (
                <span key={d.name} style={{
                  fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1,
                  padding: "2px 8px", borderRadius: 3,
                  background: d.qualifies ? "rgba(200,150,42,0.12)" : "rgba(80,80,80,0.15)",
                                                                                                 border: `1px solid ${d.qualifies ? "rgba(200,150,42,0.4)" : "rgba(100,100,100,0.3)"}`,
                                                                                                 color: d.qualifies ? "var(--gold2)" : "var(--text3)",
                }}>{d.name} {d.level > 0 ? d.level : ""}</span>
              ))}
              {r.trackByCount && (
                <span style={{ fontSize: 10, fontFamily: "Cinzel,serif", color: "var(--text3)", letterSpacing: 1, padding: "2px 7px", border: "1px solid var(--border)", borderRadius: 3 }}>
                📦 count-tracked
                </span>
              )}
              </div>
              </div>

              {sellNet != null && (
                <div style={{ textAlign: "right", minWidth: 120 }}>
                <div style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, color: "var(--text3)", marginBottom: 3 }}>TP VALUE (NET)</div>
                <Gold v={sellNet} size={15} />
                </div>
              )}

              <div style={{ minWidth: 110, textAlign: "right" }}>
              {done
                ? <span style={{ fontSize: 11, fontFamily: "Cinzel,serif", letterSpacing: 1, color: "var(--green2)", background: "rgba(60,160,60,0.12)", border: "1px solid rgba(60,160,60,0.3)", padding: "4px 10px", borderRadius: 3 }}>✓ CRAFTED</span>
                : <span style={{ fontSize: 11, fontFamily: "Cinzel,serif", letterSpacing: 1, color: "var(--gold2)", background: "rgba(200,150,42,0.1)", border: "1px solid rgba(200,150,42,0.3)", padding: "4px 10px", borderRadius: 3 }}>⚡ AVAILABLE</span>
              }
              </div>
              </div>
            );
          })}

          {eligible.length > 0 && (
            <div style={{ marginTop: 16, padding: "10px 16px", borderRadius: 4, background: "var(--bg2)", border: "1px solid var(--border)", fontSize: 12, color: "var(--text3)" }}>
            Only recipes you can craft at your current discipline levels are shown. Time-gated items reset daily at 4:00 PM Pacific (00:00 UTC).
            </div>
          )}
          </div>
        );
      })()}
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
