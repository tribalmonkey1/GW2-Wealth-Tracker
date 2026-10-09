/**
 * Legendary cost engine — one pass over a legendary's ingredient tree that
 * produces an annotated copy of the tree (needed / owned-used / shortfall /
 * gold / spirit shards per node) instead of every row recomputing its own cost.
 *
 * Why a single pass:
 *  - Owned materials are a SHARED, DEPLETING pool. If you own 250 Orichalcum and
 *    two branches each need 250, only the first branch gets them; the second has
 *    to buy. The old per-row calc let every branch claim the same 250.
 *  - Child quantities scale with the parent's shortfall (a ×2 parent needs ×2 of
 *    every child). The old tree reset this multiplier to 1 at every level.
 *
 * Same idea as RogueAIO's ADR-022 ("recursive owned-material crediting needs a
 * depleting pool, not per-item memoization").
 *
 * Node modes (what the row means):
 *  owned    — fully covered by inventory
 *  craft    — shortfall is built from the children (forge / collection / crafted)
 *  buy      — shortfall bought on the TP (for a craftable node: TP was cheaper)
 *  vendor   — bought from an NPC vendor for gold (e.g. Icy Runestone, 1g each)
 *  shards   — bought with Spirit Shards (Philosopher's Stone, Bloodstone Shard…)
 *  free     — no gold involved (WvW, map completion, hero points, karma, collection leaf)
 *  currency — non-gold currency (PvP / dungeon tokens) with no TP price
 *  unpriced — should cost gold but there is no TP price yet (shown, and counted)
 */
import { VENDOR_PRICES } from "./lib/vendorPrices.js";

// Gold-for-item vendor prices that matter for legendaries (copper).
// Icy Runestone: account-bound (not on TP), 1g each from Miyani / Mystic Forge vendors.
export const LEGENDARY_VENDOR_PRICES = {
  19676: 10000, // Icy Runestone
};

// Items bought with Spirit Shards: { count: items per purchase, shards: cost per purchase }
export const LEGENDARY_SHARD_COSTS = {
  20796: { count: 10, shards: 1 },   // Philosopher's Stone — 10 for 1 Spirit Shard
  20799: { count: 5,  shards: 3 },   // Mystic Crystal — 5 for 3 Spirit Shards
  20797: { count: 1,  shards: 200 }, // Bloodstone Shard — 200 Spirit Shards (Miyani)
};

const NO_GOLD_SOURCES = new Set(["wvw", "exploration", "heroics", "karma"]);

function tpPrice(priceMap, itemId) {
  return itemId ? (priceMap?.[itemId]?.sells?.unit_price || 0) : 0;
}

function vendorPrice(node) {
  if (node.vendorPrice) return node.vendorPrice;
  const id = node.itemId;
  if (!id) return 0;
  return LEGENDARY_VENDOR_PRICES[id] ?? VENDOR_PRICES[id]?.price ?? 0;
}

function shardCost(node) {
  if (node.shardCost) return node.shardCost; // { count, shards }
  return node.itemId ? LEGENDARY_SHARD_COSTS[node.itemId] : null;
}

function toPool(ownedMap) {
  const pool = new Map();
  for (const [k, v] of Object.entries(ownedMap || {})) {
    if (v > 0) pool.set(Number(k), v);
  }
  return pool;
}

function strip(node) {
  // Copy node metadata but not its raw inputs — `children` replaces them.
  const { inputs, ...rest } = node;
  return rest;
}

function evalNode(node, needed, pool, priceMap, visited) {
  const itemId = node.itemId || null;
  const ownedTotal = itemId ? (pool.get(itemId) || 0) : 0;
  const used = Math.min(ownedTotal, needed);
  if (used > 0) pool.set(itemId, ownedTotal - used);
  const shortfall = needed - used;
  const hasChildren = node.inputs?.length > 0 && !visited.has(node.name);
  const tpSell = tpPrice(priceMap, itemId);

  const out = {
    ...strip(node),
    needed, used, shortfall, tpSell,
    gold: 0, shards: 0, unpriced: 0,
    mode: "owned", inactive: false,
    children: [],
  };

  // Fully owned: still show the children (as covered) so the tree stays browsable.
  if (shortfall === 0) {
    if (node.inputs?.length) {
      const v2 = new Set(visited).add(node.name);
      out.children = node.inputs.map(c => markInactive(evalNode(c, 0, pool, priceMap, v2)));
    }
    return out;
  }

  if (hasChildren) {
    const v2 = new Set(visited).add(node.name);
    // A craftable node that is ALSO on the TP (not account-bound): compare
    // buying the shortfall vs building it — evaluate the build on a scratch
    // copy of the pool so a rejected build doesn't consume inventory.
    const tradeable = !node.accountBound && tpSell > 0;
    const scratch = tradeable ? new Map(pool) : pool;
    const children = node.inputs.map(c => evalNode(c, (c.count ?? 1) * shortfall, scratch, priceMap, v2));
    const craftGold = children.reduce((s, c) => s + c.gold, 0);
    const craftShards = children.reduce((s, c) => s + c.shards, 0);
    const craftUnpriced = children.reduce((s, c) => s + c.unpriced, 0);
    const buyGold = tpSell * shortfall;

    if (tradeable && (buyGold <= craftGold || craftUnpriced > 0)) {
      out.mode = "buy";
      out.gold = buyGold;
      out.children = children.map(markInactive);
      out.craftGold = craftGold;
    } else {
      if (tradeable) {
        // Commit the scratch pool — the build path won.
        pool.clear();
        for (const [k, v] of scratch) pool.set(k, v);
      }
      out.mode = "craft";
      out.gold = craftGold;
      out.shards = craftShards;
      out.unpriced = craftUnpriced;
      out.children = children;
      if (tradeable) out.buyGold = buyGold;
    }
    return out;
  }

  // ── Leaf ──
  const sc = shardCost(node);
  if (node.source === "spirit_shard" || sc) {
    out.mode = "shards";
    out.shards = sc ? Math.ceil(shortfall / sc.count) * sc.shards : 0;
    return out;
  }
  if (NO_GOLD_SOURCES.has(node.source) || node.source === "collection") {
    out.mode = "free";
    return out;
  }
  if (node.source === "vendor") {
    const vp = vendorPrice(node);
    const unit = tpSell > 0 && (vp === 0 || tpSell < vp) ? tpSell : vp;
    out.mode = unit === tpSell && tpSell > 0 ? "buy" : "vendor";
    out.gold = unit * shortfall;
    if (unit === 0) { out.mode = "unpriced"; out.unpriced = 1; }
    return out;
  }
  if (tpSell > 0) {
    out.mode = "buy";
    out.gold = tpSell * shortfall;
    return out;
  }
  const vp = vendorPrice(node);
  if (vp > 0) {
    out.mode = "vendor";
    out.gold = vp * shortfall;
    return out;
  }
  if (node.source === "currency") {
    out.mode = "currency";
    return out;
  }
  out.mode = "unpriced";
  out.unpriced = 1;
  return out;
}

function markInactive(n) {
  return { ...n, inactive: true, children: n.children.map(markInactive) };
}

/**
 * Evaluate a whole legendary (its top-level `inputs`) against one shared,
 * depleting copy of the owned inventory.
 * Returns { nodes, gold, shards, unpriced }.
 */
export function evaluateLegendaryTree(inputs, priceMap, ownedMap) {
  const pool = toPool(ownedMap);
  const nodes = (inputs || []).map(n => evalNode(n, n.count ?? 1, pool, priceMap, new Set()));
  return {
    nodes,
    gold: nodes.reduce((s, n) => s + n.gold, 0),
    shards: nodes.reduce((s, n) => s + n.shards, 0),
    unpriced: nodes.reduce((s, n) => s + n.unpriced, 0),
  };
}

/** Every achievementId referenced anywhere in the given recipe lists (for the account fetch). */
export function collectAchievementIds(...recipeLists) {
  const ids = new Set();
  const walk = (n) => {
    if (!n) return;
    if (n.achievementId) ids.add(n.achievementId);
    (n.inputs || []).forEach(walk);
  };
  recipeLists.flat().forEach(walk);
  return [...ids];
}

/** { achievementId: bitCount } for nodes that declare achievementBitCount. */
export function collectAchievementBitCounts(...recipeLists) {
  const out = {};
  const walk = (n) => {
    if (!n) return;
    if (n.achievementId && n.achievementBitCount) out[n.achievementId] = n.achievementBitCount;
    (n.inputs || []).forEach(walk);
  };
  recipeLists.flat().forEach(walk);
  return out;
}
