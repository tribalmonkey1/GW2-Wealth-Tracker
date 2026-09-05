/**
 * "Best crafting use" hover cell (Materials tab) — same portal-tooltip
 * pattern as ReceiptStat so it isn't clipped by the table wrapper's
 * overflow-x:auto either.
 * (Split out of App.jsx.)
 */
import React, { useState, useRef } from "react";
import { Gold } from "./Gold.jsx";
import { TooltipPortal } from "./TooltipPortal.jsx";
import { TrendBadge } from "./TrendBadge.jsx";

export function BestCraftingUseCell({ best, velocitySummary, trendSummary }) {
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
