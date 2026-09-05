/**
 * Flip Market tab row components — a single buy/sell candidate row (with
 * inline chart toggle + "track this flip" action) and the column header
 * above each side of the buy/sell grid.
 * (Split out of App.jsx.)
 */
import React from "react";
import { Gold } from "./Gold.jsx";
import { PriceChart } from "./PriceChart.jsx";

export function FlipRow({ r, side, flipCol, chartItem, setChartItem, onTrack }) {
  const [trackQty, setTrackQty] = React.useState(1);
  return (
    <div key={r.id}>
    <div style={{
      display:"grid", gridTemplateColumns: flipCol,
      padding:"8px 10px 8px 12px", alignItems:"center",
      borderLeft: side === "buy" ? "3px solid var(--green2)" : "3px solid var(--gold2)",
          background: side === "buy" ? "rgba(60,160,60,0.04)" : "rgba(200,150,42,0.04)",
          borderBottom:"1px solid var(--border)"
    }}>
    {/* Icon */}
    <div>{r.item?.icon
      ? <img src={r.item.icon} style={{ width:34,height:34,borderRadius:4,border:"1px solid var(--border2)" }} alt="" />
      : <div style={{ width:34,height:34,background:"var(--bg4)",borderRadius:4 }} />
    }</div>
    {/* Name + meta */}
    <div style={{ paddingRight:6, minWidth:0 }}>
    <div style={{ fontSize:12, fontWeight:600, color:"var(--text1)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.item?.name || `Item ${r.id}`}</div>
    <div style={{ fontSize:10, color:"var(--text3)", marginTop:1 }}>{r.flip.snapCount} samples</div>
    </div>
    {/* Rate/hr */}
    <div style={{ textAlign:"right" }}>
    {r.sellFills != null
      ? <span style={{ fontSize:12, color: r.sellFills >= 5 ? "var(--green2)" : r.sellFills >= 1 ? "var(--gold2)" : "var(--text3)" }}>{r.sellFills.toFixed(1)}/hr</span>
      : <span style={{ color:"var(--text3)" }}>—</span>}
      </div>
      {/* Profit / spike */}
      <div style={{ textAlign:"right" }}>
      {side === "buy" && <>
        <div style={{ display:"flex", alignItems:"baseline", gap:4, justifyContent:"flex-end" }}>
        <span style={{ fontSize:10, color:"var(--text3)" }}>p75:</span>
        <span className="pp" style={{ fontSize:12 }}>+<Gold v={r.predictedProfit} size={12} /></span>
        </div>
        <div style={{ display:"flex", alignItems:"baseline", gap:4, justifyContent:"flex-end" }}>
        <span style={{ fontSize:10, color:"var(--text3)" }}>p90:</span>
        <span className="pp" style={{ fontSize:11 }}>+<Gold v={r.predictedProfitOptimistic} size={11} /></span>
        </div>
        </>}
        {side === "sell" && (
          <span style={{ color:"var(--gold2)", fontSize:12, fontWeight:600 }}>+{((r.curSell/r.flip.p50Sell-1)*100).toFixed(0)}%</span>
        )}
        </div>
        {/* Actions */}
        <div style={{ display:"flex", flexDirection:"row", gap:6, alignItems:"center", justifyContent:"flex-end", flexWrap:"nowrap", overflow:"hidden" }}>
        {side === "buy" && (<>
          <input
          type="number" min={1} max={9999} value={trackQty}
          onChange={e => setTrackQty(Math.max(1, parseInt(e.target.value) || 1))}
          style={{ width:44, background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:3, padding:"2px 4px", color:"var(--text1)", fontSize:11, textAlign:"center" }}
          />
          <button className="rbtn" style={{ fontSize:10, color:"var(--green2)", borderColor:"rgba(60,160,60,.4)", padding:"2px 5px", whiteSpace:"nowrap" }}
          onClick={() => {
            onTrack({ itemId:r.id, itemName:r.item?.name||`Item ${r.id}`, buyPrice:r.curSell,
                    qty:trackQty, targetSellPrice:r.flip.p75Sell, buyTime:Date.now(), flaggedBuyNowTs:Date.now() });
          }}>+Track</button>
          </>)}
          <button className={`cbtn${chartItem === r.id ? " on" : ""}`}
          onClick={() => setChartItem(chartItem === r.id ? null : r.id)}>
          📈
          </button>
          </div>
          </div>
          {chartItem === r.id && (
            <div style={{ padding:"0 12px 12px", borderBottom:"1px solid var(--border)", background:"var(--bg2)" }}>
            <PriceChart itemId={r.id} itemName={r.item?.name || `Item ${r.id}`} />
            </div>
          )}
          </div>
  );
}

export function ColHeader({ label, color, count, flipCol }) {
  return (
    <div style={{ padding:"6px 12px", borderBottom:"1px solid var(--border)",
      display:"grid", gridTemplateColumns: flipCol,
      fontSize:9, fontFamily:"Cinzel,serif", letterSpacing:1, color:"var(--text3)" }}>
      <div style={{ gridColumn:"1/3", color, fontWeight:700, fontSize:10 }}>{label} <span style={{ color:"var(--text3)", fontWeight:400 }}>({count})</span></div>
      <div style={{ textAlign:"right" }}>RATE/HR</div>
      <div style={{ textAlign:"right" }}>{label === "🟢 BUY NOW" ? "PROFIT" : "SPIKE"}</div>
      <div/>
      </div>
  );
}
