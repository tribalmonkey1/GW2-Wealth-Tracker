/**
 * Small ▲/▼ percentage badge for 24h price trend.
 * (Split out of App.jsx.)
 */
import React from "react";

export function TrendBadge({ trend }) {
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
