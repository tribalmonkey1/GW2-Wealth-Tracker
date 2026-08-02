/**
 * GW2 Market Worker
 * Runs velocity, trend, and flip calculations off the main thread.
 * Receives raw DB data via postMessage, returns computed results.
 */

const ONE_HOUR_MS = 3_600_000;
const ONE_MIN_MS = 60_000;
const SEVEN_DAYS_MS = 7 * 24 * ONE_HOUR_MS;
const MIN_OBS = 3; // Lower threshold — NAS collector gives plenty of data

function computeVelocity(grouped, now) {
  const velocity = {};
  for (const [idStr, snapshots] of Object.entries(grouped)) {
    const id = Number(idStr);
    if (snapshots.length < 2) continue;
    snapshots.sort((a, b) => a.ts - b.ts);
    const pairs = [];
    for (let i = 1; i < snapshots.length; i++) {
      const prev = snapshots[i - 1], cur = snapshots[i];
      const dtHr = (cur.ts - prev.ts) / ONE_HOUR_MS;
      if (dtHr <= 0 || dtHr > (10 / 60)) continue; // allow up to 10 min gap for 60s collector
      const sellDelta = Math.max(0, prev.sellQty - cur.sellQty);
      const buyDelta = Math.max(0, prev.buyQty - cur.buyQty);
      pairs.push({ sellFills: sellDelta / dtHr, buyFills: buyDelta / dtHr, ts: cur.ts });
    }
    if (pairs.length < MIN_OBS) continue;
    const recentPairs = pairs.filter(p => p.ts > now - SEVEN_DAYS_MS);
    if (recentPairs.length < MIN_OBS) continue;
    const sellFillsPerHr = recentPairs.reduce((s, p) => s + p.sellFills, 0) / recentPairs.length;
    const buyFillsPerHr = recentPairs.reduce((s, p) => s + p.buyFills, 0) / recentPairs.length;
    const windowHrs = (recentPairs[recentPairs.length - 1].ts - recentPairs[0].ts) / ONE_HOUR_MS;
    velocity[id] = { sellFillsPerHr, buyFillsPerHr, observations: recentPairs.length, windowHrs };
  }
  return velocity;
}

function computeTrendsAndFlips(priceHistoryMap, now) {
  const trends = {};
  const flips = {};
  for (const [idStr, rows] of Object.entries(priceHistoryMap)) {
    const id = Number(idStr);
    if (rows.length < 2) continue;
    rows.sort((a, b) => a.ts - b.ts);

    const recent = rows[rows.length - 1];
    const old24h = rows.find(r => r.ts >= now - 24 * 3_600_000) || rows[0];
    if (recent?.sell && old24h?.sell && recent.sell !== old24h.sell) {
      const pct = ((recent.sell - old24h.sell) / old24h.sell) * 100;
      trends[id] = { pct, current: recent.sell, old: old24h.sell };
    }

    const sellPrices = rows.map(r => r.sell).filter(s => s > 0);
    if (sellPrices.length >= 10) {
      sellPrices.sort((a, b) => a - b);
      const pct = (arr, p) => arr[Math.floor((p / 100) * (arr.length - 1))];
      const p10 = pct(sellPrices, 10), p25 = pct(sellPrices, 25), p50 = pct(sellPrices, 50);
      const p75 = pct(sellPrices, 75), p90 = pct(sellPrices, 90);
      const swing = p50 > 0 ? (p90 - p10) / p50 : 0;
      if (swing >= 0.1) {
        flips[id] = { p10Sell: p10, p25Sell: p25, p50Sell: p50, p75Sell: p75, p90Sell: p90, swing, snapCount: sellPrices.length };
      }
    }
  }
  return { trends, flips };
}


const VENDOR_PRICES = {
  19792: 8, 19789: 16, 19791: 24, 19790: 32, 19788: 48, 19793: 64,
  46740: 150, 46742: 150, 19704: 8, 19750: 8, 19924: 8,
  46747: 150, 75919: 150,
  19914: 72, 19915: 252, 19916: 500, 19917: 100000,
  12157: 8, 19985: 8, 12156: 8, 12151: 8, 12152: 8, 12153: 8,
  12154: 8, 12155: 8, 12158: 8, 12159: 8,
  36731: 16, 8576: 8, 12238: 150,
};

// rootRecipe override — see App.jsx buildTreeSync for full rationale. Needed so
// each card (one per recipe object) builds its own tree instead of always
// resolving to whichever recipe last won the resolvedRecipes[outputId] collision.
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

function flatLeaves(node, ownedMap = {}, needed = null) {
  const count = needed !== null ? needed : node.count;
  const owned = ownedMap[node.itemId] || 0;
  if (node.isLeaf || owned >= count) return [{ itemId: node.itemId, count }];
  const outputCount = node.outputCount || 1;
  const treeRuns = Math.ceil(node.count / outputCount);
  const actualRuns = Math.ceil(count / outputCount);
  const scale = treeRuns > 0 ? actualRuns / treeRuns : 1;
  const acc = {};
  for (const child of node.children) {
    const childNeeded = Math.ceil(child.count * scale);
    for (const leaf of flatLeaves(child, ownedMap, childNeeded)) {
      acc[leaf.itemId] = (acc[leaf.itemId] || 0) + leaf.count;
    }
  }
  return Object.entries(acc).map(([itemId, count]) => ({ itemId: Number(itemId), count }));
}

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

function bestSellValue(itemId, count, resolvedRecipes, priceMap, itemMap, depth = 0) {
  if (depth > 8) {
    const sp = priceMap[itemId]?.sells?.unit_price || 0;
    return { value: sp * count };
  }
  const tpSell = priceMap[itemId]?.sells?.unit_price || 0;
  const tpValue = tpSell * count;
  const recipe = resolvedRecipes[itemId];
  if (!recipe) return { value: tpValue };
  let ingValue = 0;
  for (const ing of recipe.ingredients) {
    ingValue += bestSellValue(ing.item_id, ing.count * count, resolvedRecipes, priceMap, itemMap, depth + 1).value;
  }
  return { value: Math.max(tpValue, ingValue) };
}

function cheapestAcquire(itemId, count, resolvedRecipes, priceMap, itemMap, ownedMap, depth = 0) {
  if (depth > 8) {
    const owned = ownedMap[itemId] || 0;
    const needed = Math.max(0, count - owned);
    const vp = VENDOR_PRICES[itemId];
    const tpP = priceMap[itemId]?.sells?.unit_price || 0;
    const unitPrice = vp ? Math.min(vp, tpP || Infinity) : tpP;
    const source = vp && vp <= (tpP || Infinity) ? 'vendor' : 'tp';
    return { cost: unitPrice * needed, path: [{ itemId, count, needed, unitPrice, source, owned }] };
  }
  const owned = ownedMap[itemId] || 0;
  const stillNeed = Math.max(0, count - owned);
  if (stillNeed === 0) return { cost: 0, path: [{ itemId, count, needed: 0, unitPrice: 0, source: 'owned', owned }] };
  const vp = VENDOR_PRICES[itemId];
  const tpP = priceMap[itemId]?.sells?.unit_price || 0;
  const bestDirectPrice = vp ? Math.min(vp, tpP || Infinity) : tpP;
  const directSource = vp && vp <= (tpP || Infinity) ? 'vendor' : 'tp';
  const directCost = bestDirectPrice * stillNeed;
  const recipe = resolvedRecipes[itemId];
  if (!recipe) return { cost: directCost, path: [{ itemId, count, needed: stillNeed, unitPrice: bestDirectPrice, source: directSource, owned }] };
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
  return { cost: directCost, path: [{ itemId, count, needed: stillNeed, unitPrice: bestDirectPrice, source: directSource, owned }] };
}

function buildCraftItems(recipes, resolvedRecipes, itemMap, priceMap, ownedMap) {
  // Defensive: collapse any recipes sharing the same GW2 recipe id before building
  // cards. Mirrors the same guard in App.jsx's buildCraftItems — see that copy
  // for the full rationale. Keeping both in sync matters since this worker copy
  // is the one used for the bulk of live refreshes (computeCraftItems).
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
    // Don't skip recipes with no TP price — show all recipes, 0 sell = untradeable/unlisted
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
      const vp = VENDOR_PRICES[leaf.itemId];
      const tpSell = price?.sells?.unit_price || 0;
      const tpBuy = price?.buys?.unit_price || 0;
      const vendorPrice = vp;
      const bestBuyPrice = vendorPrice ? Math.min(vendorPrice, tpSell || Infinity) : tpSell;
      const bestSource = vendorPrice && vendorPrice <= (tpSell || Infinity) ? 'vendor' : 'tp';
      const fulfill = checkFulfillment(leaf.itemId, needed, resolvedRecipes, ownedMap);
      let status = 'have';
      if (!fulfill.canFulfill) {
        status = 'mustBuy';
        canCraft = false;
        const mustBuyCount = Math.max(0, needed - owned);
        missingMats.push({ itemId: leaf.itemId, needed, owned, name: item?.name || `Item ${leaf.itemId}`, mustBuyCount, bestBuyPrice, bestSource, vendorPrice });
        totalMustBuyCostSell += bestBuyPrice * needed;
        totalMustBuyCostBuy += (tpBuy || bestBuyPrice) * needed;
      } else if (fulfill.hasMaterials) {
        status = 'hasMaterials';
      }
      matDetails.push({ itemId: leaf.itemId, name: item?.name || `Item ${leaf.itemId}`, needed, owned, tpSell, tpBuy, vendorPrice, bestBuyPrice, bestSource, rarity: item?.rarity, status });
    }
    const outSell = outputPrice?.sells?.unit_price || 0;
    const outBuy = outputPrice?.buys?.unit_price || 0;
    const profitGross = outSell * outputCount - totalMustBuyCostSell;
    const profitNet = Math.floor(outSell * outputCount * 0.85) - totalMustBuyCostSell;
    let matSellTotal = 0;
    const matSellPaths = [];
    for (const leaf of leaves) {
      if (matDetails.find(m => m.itemId === leaf.itemId)?.status === 'mustBuy') continue;
      const best = bestSellValue(leaf.itemId, leaf.count, resolvedRecipes, priceMap, itemMap);
      matSellTotal += best.value;
      matSellPaths.push({ leafId: leaf.itemId, count: leaf.count, ...best });
    }
    const matSellNet = Math.floor(matSellTotal * 0.85);
    const craftAdvantage = profitNet - matSellNet;
    const cheapAcquire = cheapestAcquire(outputId, 1, resolvedRecipes, priceMap, itemMap, ownedMap);
    items.push({ recipeId: recipe.id, outputId, outputCount, name: itemMap[outputId]?.name || `Item ${outputId}`, icon: itemMap[outputId]?.icon, rarity: itemMap[outputId]?.rarity, disciplines: recipe.disciplines, canCraft, missingMats, matDetails, outSell, outBuy, totalMustBuyCostSell, profitGross, profitNet, matSellTotal, matSellNet, matSellPaths, craftAdvantage, cheapAcquire, tree });
  }
  return items;
}

self.onmessage = function(e) {
  const { type, id, payload } = e.data;
  if (type === 'compute_craft_items') {
    const { recipes, resolvedRecipes, itemMap, priceMap, ownedMap } = e.data.payload;
    try {
      const craftItems = buildCraftItems(recipes, resolvedRecipes, itemMap, priceMap, ownedMap);
      const byDisc = {};
      const byDiscSeen = {};
      // getRecipeDisciplines: empty disciplines array is truthy so `|| ['Unknown']`
      // never caught it — items with [] disciplines silently vanished from every
      // tab. Falls back to 'Uncategorized' instead. Dedup key changed from
      // ci.outputId to ci.recipeId so multiple valid recipes for the same output
      // (different materials/costs) each get their own card instead of collapsing
      // into one. Mirrors the same fix in App.jsx.
      craftItems.forEach(ci => ((ci.disciplines && ci.disciplines.length > 0) ? ci.disciplines : ['Uncategorized']).forEach(d => {
        if (!byDisc[d]) { byDisc[d] = []; byDiscSeen[d] = new Set(); }
        if (!byDiscSeen[d].has(ci.recipeId)) { byDiscSeen[d].add(ci.recipeId); byDisc[d].push(ci); }
      }));
      self.postMessage({ type: 'craft_items_result', id, result: { craftItems, byDisc } });
    } catch(e) {
      self.postMessage({ type: 'craft_items_error', id, error: String(e) });
    }
  }
  if (type === 'process_startup_cache') {
    // Run all startup data processing off the main thread
    try {
      const { allRecipes, itemMap, priceMap, ownedMap } = payload;
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
      self.postMessage({ type: 'process_startup_cache_result', id, result: { resolvedRecipes, matRows, totalMatValue } });
    } catch(e) {
      self.postMessage({ type: 'process_startup_cache_error', id, error: String(e) });
    }
  }
  if (type === 'parse_cache_bulk') {
    // Parse all cache entry JSON strings off the main thread
    try {
      const { entries } = payload;
      const result = entries.map(entry => {
        if (!entry) return null;
        try { return { key: entry.key, value: JSON.parse(entry.value), ts: entry.ts }; }
        catch { return null; }
      });
      self.postMessage({ type: 'parse_cache_bulk_result', id, result });
    } catch(e) {
      self.postMessage({ type: 'parse_cache_bulk_error', id, error: String(e) });
    }
  }
  if (type === 'compute_market_summary') {
    const { velocityGrouped, priceHistoryMap, now } = payload;
    try {
      const velocity = computeVelocity(velocityGrouped, now);
      const { trends, flips } = computeTrendsAndFlips(priceHistoryMap, now);
      self.postMessage({ type: 'market_summary_result', id, result: { velocity, trends, flips } });
    } catch(e) {
      self.postMessage({ type: 'market_summary_error', id, error: String(e) });
    }
  }
};
