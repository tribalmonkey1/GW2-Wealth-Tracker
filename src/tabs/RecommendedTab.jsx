/**
 * Recommended tab — ranks every known/craftable-adjacent item across all
 * disciplines (plus friend-only candidates and optionally raw materials) by
 * craftAdvantage × market velocity. Shares its expanded-card body with the
 * Crafting Profits tab via CraftDetailBody.
 * (Split out of App.jsx. Internal useMemo dep list is unchanged from the
 * original.)
 */
import React, { useMemo } from "react";
import { Gold } from "../components/Gold.jsx";
import { ReceiptStat } from "../components/ReceiptStat.jsx";
import { PriceChart } from "../components/PriceChart.jsx";
import { CraftDetailBody } from "../components/CraftDetailBody.jsx";
import { getRecipeDisciplines, flatLeaves, treeUsesDailyIngredient } from "../lib/craftingCalc.js";
import { friendBadgeInfo } from "../lib/friendData.js";
import { DAILY_CRAFT_IDS, DAILY_CRAFT_MAP, ALL_DAILY_CRAFT_IDS } from "../lib/dailyCrafting.js";
import { passesFriendFilter } from "../FriendFilter.jsx";
import { passesRarityFilter } from "../RarityFilter.jsx";

export function RecommendedTab({
  data, velocitySummary, trendSummary, showRecMaterials, showRecDaily,
  showRecDailyOutputs, showRecMissing, rarityFilter, expanded, setExpanded,
  dailyCrafted, myListings, mySoldHistory, craftingChartItem, setCraftingChartItem,
  friendOnlyCraftItems, friendFilter, friendKnownEligibleBadges, searchCraft,
  setActiveTab, cacheRef,
}) {
  const content = useMemo(() => {
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
            {/* Friend badge: see friendBadgeInfo() for the three cases (genuinely-unknown-
                to-user, known-by-rating-but-undiscovered-by-user, discipline-eligible-for-
                friend). Different tooltip + icon explains which applies. */}
            {ci.friendBadges?.map(b => {
              const { icon, title } = friendBadgeInfo(b, ci);
              return (
                <span key={b.friendId} title={title}
                  style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, padding: "2px 7px", borderRadius: 3, background: "rgba(159,77,255,.12)", border: "1px solid rgba(159,77,255,.4)", color: "#c9a0ff", whiteSpace: "nowrap" }}>
                  {icon} {b.friendName}
                </span>
              );
            })}
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

  return content;
}
