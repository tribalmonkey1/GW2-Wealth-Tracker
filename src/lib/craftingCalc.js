/**
 * Crafting profit / ingredient-tree engine — recipe tree flattening,
 * fulfillment checks, best-sell-path and cheapest-acquire pathfinding,
 * and the buildCraftItems() pipeline that powers Crafting Profits,
 * Recommended, and Unlearned Recipes.
 *
 * NOTE: market-worker.js contains a near-duplicate of this module (it has
 * to — Web Workers can't share App's live closures), kept in sync manually.
 * If you fix a bug here, check market-worker.js for the same bug.
 * (Split out of App.jsx.)
 */
import { VENDOR_PRICES } from "./vendorPrices.js";
export const DISCIPLINES = ["Armorsmith","Leatherworker","Tailor","Weaponsmith","Huntsman","Chef","Artificer","Jeweler","Scribe","Homesteader"];

export const getRecipeDisciplines = (ci) =>
  (ci.disciplines && ci.disciplines.length > 0) ? ci.disciplines : ["Uncategorized"];

export function dedupeRecipesById(recipes) {
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

export function buildTreeSync(itemId, count, resolvedRecipes, depth = 0, rootRecipe = null) {
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

export function flatLeaves(node, ownedMap = {}, needed = null, isRoot = true) {
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

export function flatAllNodes(node, depth = 0) {
  if (node.isLeaf) return [{ itemId: node.itemId, count: node.count, isLeaf: true, depth }];
  const self = { itemId: node.itemId, count: node.count, isLeaf: false, depth, outputCount: node.outputCount };
  const children = node.children.flatMap(c => flatAllNodes(c, depth + 1));
  return [self, ...children];
}

export function treeUsesDailyIngredient(node, dailySet, isRoot = true) {
  if (!node) return false;
  if (!isRoot && dailySet.has(node.itemId)) return true;
  if (node.children) {
    for (const child of node.children) {
      if (treeUsesDailyIngredient(child, dailySet, false)) return true;
    }
  }
  return false;
}

export function bestSellValue(itemId, count, resolvedRecipes, priceMap, itemMap, depth = 0) {
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

export function cheapestAcquire(itemId, count, resolvedRecipes, priceMap, itemMap, ownedMap, depth = 0) {
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

export function checkFulfillment(itemId, needed, resolvedRecipes, ownedMap, depth = 0) {
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

export const TRACKED_RARITIES = new Set(["Rare", "Exotic", "Ascended", "Legendary"]);

export function buildCraftItems(recipes, resolvedRecipes, itemMap, priceMap, ownedMap) {
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
