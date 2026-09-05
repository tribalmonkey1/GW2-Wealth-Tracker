/**
 * A single stat (e.g. Net Profit, Craft Advantage) that shows a vertical
 * receipt breakdown on hover, via TooltipPortal.
 * (Split out of App.jsx — also duplicated in MysticForgeTab.jsx; that copy
 * should now import this one instead.)
 */
import React, { useState, useRef } from "react";
import { Gold } from "./Gold.jsx";
import { TooltipPortal } from "./TooltipPortal.jsx";

export function ReceiptStat({ label, value, lines, size = 15, wrapClass = "ci-stat", lblClass = "ci-stat-lbl" }) {
  const [hovered, setHovered] = useState(false);
  const anchorRef = useRef(null);
  const positive = value >= 0;
  return (
    <div
      ref={anchorRef}
      className={wrapClass}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className={lblClass}>{label}</span>
      <span className={positive ? "pp" : "pn"} style={{ fontSize: size }}>
        {positive ? "+" : ""}<Gold v={value} size={size} />
      </span>
      <TooltipPortal anchorRef={anchorRef} visible={hovered}>
        {lines.map((l, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", gap: 20,
            padding: l.isTotal ? "6px 0 0" : "3px 0",
            marginTop: l.isTotal ? 6 : 0,
            borderTop: l.isTotal ? "1px solid var(--border2)" : "none",
          }}>
            <span style={{ fontSize: 13, fontWeight: l.isTotal ? 600 : 400, color: l.isTotal ? "var(--text1)" : "var(--text3)" }}>{l.label}</span>
            <span style={{ fontSize: 13, fontWeight: l.isTotal ? 600 : 400, color: l.isTotal ? (l.value >= 0 ? "var(--green2)" : "var(--red2)") : "var(--text2)" }}>
              <Gold v={l.value} size={13} />
            </span>
          </div>
        ))}
      </TooltipPortal>
    </div>
  );
}
