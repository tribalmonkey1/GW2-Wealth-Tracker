/**
 * Unlearned Recipes tab — ranks recipes you don't currently know using the
 * same craftAdvantage x sellFillsPerHr scoring as Recommended, so
 * learned-vs-unlearned is just another axis instead of a separate system.
 * (Split out of App.jsx. Internal useMemo dep list is unchanged from the
 * original.)
 */
import React, { useMemo } from "react";
import { Gold } from "../components/Gold.jsx";
import { ReceiptStat } from "../components/ReceiptStat.jsx";
import { PriceChart } from "../components/PriceChart.jsx";
import { getRecipeDisciplines } from "../lib/craftingCalc.js";
import { passesRarityFilter } from "../RarityFilter.jsx";

export function UnlearnedRecipesTab({
  data, lockedCraftItems, velocitySummary, hideZeroProfitUnlearned,
  setHideZeroProfitUnlearned, hideAutoLearnedUnlearned, setHideAutoLearnedUnlearned,
  rarityFilter, unlearnedRecipeCount, unlearnedLoading, expanded, setExpanded,
  craftingChartItem, setCraftingChartItem, searchCraft,
}) {
  const content = useMemo(() => {
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

  return content;
}
