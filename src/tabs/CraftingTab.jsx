/**
 * Crafting Profits tab — per-discipline recipe cards ranked by
 * craftAdvantage x market velocity, plus the ⭐ Recommended and
 * 🔒 Unlearned Recipes sub-tabs (rendered as real child components now,
 * where the original held them as pre-computed useMemo JSX values spliced
 * in directly — same visual result, cleaner React).
 * (Split out of App.jsx. Internal useMemo dep list is unchanged from the
 * original.)
 */
import React, { useMemo } from "react";
import { Gold } from "../components/Gold.jsx";
import { ReceiptStat } from "../components/ReceiptStat.jsx";
import { PriceChart } from "../components/PriceChart.jsx";
import { CraftDetailBody } from "../components/CraftDetailBody.jsx";
import { RecommendedTab } from "./RecommendedTab.jsx";
import { UnlearnedRecipesTab } from "./UnlearnedRecipesTab.jsx";
import { getRecipeDisciplines, DISCIPLINES, treeUsesDailyIngredient } from "../lib/craftingCalc.js";
import { DAILY_CRAFT_IDS, ALL_DAILY_CRAFT_IDS } from "../lib/dailyCrafting.js";
import { friendBadgeInfo } from "../lib/friendData.js";
import { passesFriendFilter, FriendFilterDropdown } from "../FriendFilter.jsx";
import { passesRarityFilter, RarityDropdown } from "../RarityFilter.jsx";

export function CraftingTab({
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
}) {
  const content = useMemo(() => {
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

      {activeDisc === "__recommended__" ? <RecommendedTab {...recommendedTabProps} /> : activeDisc === "__unlearned__" ? <UnlearnedRecipesTab {...unlearnedTabProps} /> : <>

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
            {ci.friendBadges?.map(b => {
              const { icon, title } = friendBadgeInfo(b, ci);
              return (
                <span key={b.friendId} title={title}
                  style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, padding: "2px 7px", borderRadius: 3, background: "rgba(159,77,255,.12)", border: "1px solid rgba(159,77,255,.4)", color: "#c9a0ff", whiteSpace: "nowrap" }}>
                  {icon} {b.friendName}
                </span>
              );
            })}
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
  }, [data, activeDisc, showRecMissing, showRecMaterials, showRecDaily, showRecDailyOutputs, rarityFilter, searchCraft, expanded, dailyCrafted, manualDailyCrafted, resetCountdown, myListings, mySoldHistory, velocitySummary, trendSummary, craftingChartItem, craftPage, recommendedTabProps, unlearnedTabProps, unlearnedRecipeCount, unlearnedLoading, friendOnlyCraftItems, friendFilter, friends, friendKnownEligibleBadges]);

  return content;
}
