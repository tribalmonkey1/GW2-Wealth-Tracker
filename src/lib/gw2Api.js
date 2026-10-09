/**
 * GW2 API client — authenticated + public fetch helpers, batching, and the
 * "unlearned recipe catalog" item/price coverage resolver.
 * (Split out of App.jsx.)
 */
import { cacheSet } from "./storage.js";

const BASE = "https://api.guildwars2.com/v2";
export { BASE };

// ── Recipe schema ─────────────────────────────────────────────────────────────
// /v2/recipes only returns recipes that cost a CURRENCY (e.g. 50 Research Notes for
// Rare Rift Motivation, Amalgamated Rift Essence, most Secrets of the Obscure /
// Wizard's Tower recipes) when the request asks for the 2022-03-09 schema or later —
// under the default schema those recipes "appear as invalid" and are silently dropped
// from ?ids= batches (API:2/recipes on the wiki). The newer schema changes the
// ingredient shape to { type, id, count }; normalizeRecipe() converts it back to the
// { item_id, count } shape the rest of the app uses and moves currencies to
// recipe.currency_ingredients = [{ currency_id, count }].
export const RECIPE_SCHEMA = "2022-03-09T02:00:00.000Z";
export const RECIPE_LIST_URL = `${BASE}/recipes?v=${RECIPE_SCHEMA}`;

// Names for currency ingredients shown in the crafting UI (wallet currency ids).
export const CURRENCY_INGREDIENT_NAMES = {
  61: "Research Note",
  78: "Fine Rift Essence",       // wallet currency since SotO [API verified Oct 2026]
  79: "Rare Rift Essence",
  80: "Masterwork Rift Essence",
};

// Fill in names for every wallet currency once per session, so any new currency-cost
// recipe shows a real name instead of "currency #N". Safe to call more than once.
let _currencyNamesLoaded = false;
export async function loadCurrencyNames() {
  if (_currencyNamesLoaded) return;
  try {
    const list = await publicFetch(`${BASE}/currencies?ids=all`);
    if (Array.isArray(list)) for (const c of list) if (c?.id && c.name) CURRENCY_INGREDIENT_NAMES[c.id] = c.name;
    _currencyNamesLoaded = true;
  } catch {}
}

export function normalizeRecipe(r) {
  if (!r || !Array.isArray(r.ingredients)) return r;
  if (!r.ingredients.some(i => i && i.type)) return r; // already old shape (e.g. from cache)
  const ingredients = [], currency_ingredients = [], guild = [...(r.guild_ingredients || [])];
  for (const ing of r.ingredients) {
    if (ing.type === "Currency") currency_ingredients.push({ currency_id: ing.id, count: ing.count });
    else if (ing.type === "GuildUpgrade") guild.push({ upgrade_id: ing.id, count: ing.count });
    else ingredients.push({ item_id: ing.id, count: ing.count });
  }
  return { ...r, ingredients, currency_ingredients, guild_ingredients: guild };
}

export const chunk = (arr, size) =>
Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

export async function apiFetch(url, options = {}) {
  const sep = url.includes("?") ? "&" : "?";
  const key = window.__gw2ApiKey || "";
  const res = await fetch(`${url}${sep}access_token=${key}`, options);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function publicFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// Fetch recipe details by id with the currency-aware schema (see RECIPE_SCHEMA above).
export async function fetchRecipes(ids) {
  if (!ids.length) return [];
  const results = [];
  for (const ch of chunk([...new Set(ids)], 200)) {
    try {
      const data = await publicFetch(`${BASE}/recipes?v=${RECIPE_SCHEMA}&ids=${ch.join(",")}`);
      if (Array.isArray(data)) results.push(...data.map(normalizeRecipe));
    } catch {}
  }
  return results;
}

export async function fetchIds(endpoint, ids) {
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

export async function fetchPrices(ids) {
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

export async function fetchSoldHistory() {
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

export const NON_TRADEABLE_FLAGS = new Set(["AccountBound", "SoulbindOnAcquire", "MonsterOnly"]);

export function filterTradeable(ids, itemMap) {
  if (!itemMap || Object.keys(itemMap).length === 0) return ids; // no itemMap yet, fetch all
  return ids.filter(id => {
    const item = itemMap[id];
    if (!item) return true; // unknown item — try fetching, API will 404 if untradeable
    const flags = item.flags || [];
    return !flags.some(f => NON_TRADEABLE_FLAGS.has(f));
  });
}

export async function resolveLockedCatalogCoverage(recipesArr, itemMap, priceMap) {
  const lockedItemIds = new Set();
  for (const r of recipesArr) {
    lockedItemIds.add(r.output_item_id);
    for (const ing of (r.ingredients || [])) lockedItemIds.add(ing.item_id);
  }
  const missingItemIds = [...lockedItemIds].filter(id => id && !itemMap[id]);
  let resolvedItems = 0;
  if (missingItemIds.length) {
    const ni = await fetchIds("/items", missingItemIds);
    ni.forEach(i => { itemMap[i.id] = i; });
    resolvedItems = ni.length;
  }
  const missingPriceIds = filterTradeable([...lockedItemIds], itemMap).filter(id => id && !priceMap[id]);
  if (missingPriceIds.length) {
    const np = await fetchPrices(missingPriceIds);
    Object.assign(priceMap, np);
  }
  // requestedItemIds vs resolvedItems lets a caller notice a partial failure (e.g. a
  // chunk silently dropped) instead of assuming "ran once" means "fully resolved" —
  // GW2's bulk /items endpoint only ever returns entries for IDs that actually exist,
  // so some gap here is normal, but a large one is worth logging.
  return { itemMap, priceMap, requestedItemIds: missingItemIds.length, resolvedItems };
}

export function persistItemMapCache(itemMap) {
  cacheSet("itemMap", Object.fromEntries(
    Object.entries(itemMap).map(([id, item]) => [id, {
      id: item.id, name: item.name, icon: item.icon,
      rarity: item.rarity, type: item.type, flags: item.flags,
    }])
  ));
}

// Bank + shared inventory slots as { itemId: totalCount }, or null if either call fails.
// Callers keep the last good result on null (see loadAccountSlotItems in App.jsx) so a
// transient API error never makes bank contents look like they were just removed.
export async function fetchAccountSlotItems() {
  try {
    const [bank, shared] = await Promise.all([
      apiFetch(`${BASE}/account/bank`),
      apiFetch(`${BASE}/account/inventory`),
    ]);
    const counts = {};
    for (const slot of [...(bank || []), ...(shared || [])]) {
      if (!slot || !slot.id || !(slot.count > 0)) continue;
      counts[slot.id] = (counts[slot.id] || 0) + slot.count;
    }
    return counts;
  } catch { return null; }
}
