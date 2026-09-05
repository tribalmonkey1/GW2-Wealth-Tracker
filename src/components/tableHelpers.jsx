/**
 * Small pure table/formatting helpers shared by the tab components
 * (Materials, Crafting Profits, etc).
 * (Split out of App.jsx.)
 */
import React from "react";
import { Gold } from "./Gold.jsx";

export const sortBy = (arr, k, d) => [...arr].sort((a, b) => {
  const av = a[k] ?? -Infinity, bv = b[k] ?? -Infinity;
  return typeof av === "string" ? d * av.localeCompare(bv) : d * (av - bv);
});

export const fmtCd = (ms) => {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
};

export const SortTh = ({ label, k, s, setS, ...rest }) => (
  <th className={s.k === k ? "srt" : ""} onClick={() => setS(p => ({ k, d: p.k === k ? p.d * -1 : -1 }))} {...rest}>
  {label}{s.k === k && <span style={{ marginLeft: 5, opacity: .6 }}>{s.d === 1 ? "↑" : "↓"}</span>}
  </th>
);

export const P2 = ({ sell, buy }) => (
  <div className="p2">
  <span className="psell"><Gold v={sell} /></span>
  <span className="pbuy"><Gold v={buy} size={13} /> <span className="plbl">buy</span></span>
  </div>
);
