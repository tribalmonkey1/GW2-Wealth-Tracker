/**
 * Top status bar — last-refresh time, price/recipe refresh countdowns,
 * and the manual "Refresh Now" button.
 * (Split out of App.jsx.)
 */
import React from "react";
import { fmtCd } from "./tableHelpers.jsx";

export function StatusBar({ refreshing, secsAgo, nextPriceIn, nextRecipeIn, PRICE_REFRESH_MS, RECIPE_REFRESH_MS, refreshPrices }) {
  return (
    <div className="sbar">
    <div className={`sdot${refreshing ? " spin" : secsAgo > 90 ? " warn" : ""}`} />
    <span style={{ color: "var(--text3)", fontSize: 13 }}>
    Updated: <span style={{ color: "var(--text2)" }}>{secsAgo < 3 ? "just now" : `${secsAgo}s ago`}</span>
    </span>
    <span style={{ color: "var(--border2)" }}>|</span>
    <div className="cd-wrap">
    <div className="cd-item">
    <span>prices in</span>
    <div className="cd-bar-w"><div className={`cd-bar cd-p`} style={{ width: `${(nextPriceIn / PRICE_REFRESH_MS) * 100}%` }} /></div>
    <span style={{ color: "var(--gold)", minWidth: 36 }}>{fmtCd(nextPriceIn)}</span>
    </div>
    <div className="cd-item">
    <span>recipes in</span>
    <div className="cd-bar-w"><div className={`cd-bar cd-r`} style={{ width: `${(nextRecipeIn / RECIPE_REFRESH_MS) * 100}%` }} /></div>
    <span style={{ color: "var(--blue)", minWidth: 36 }}>{fmtCd(nextRecipeIn)}</span>
    </div>
    </div>
    <button className="rbtn" disabled={refreshing} onClick={refreshPrices} style={{ marginLeft: "auto" }}>
    {refreshing ? "↻ Updating..." : "↺ Refresh Now"}
    </button>
    </div>
  );
}
