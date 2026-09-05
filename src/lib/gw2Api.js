/**
 * GW2 API client — authenticated + public fetch helpers, batching, and the
 * "unlearned recipe catalog" item/price coverage resolver.
 * (Split out of App.jsx.)
 */
import { cacheSet } from "./storage.js";

const BASE = "https://api.guildwars2.com/v2";
export { BASE };

export const chunk = (arr, size) =>
Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

export async function apiFetch(url) {
  const sep = url.includes("?") ? "&" : "?";
  const key = window.__gw2ApiKey || "";
  const res = await fetch(`${url}${sep}access_token=${key}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function publicFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
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
