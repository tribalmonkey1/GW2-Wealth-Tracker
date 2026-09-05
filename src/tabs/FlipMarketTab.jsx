/**
 * Flip Market tab — buy-dip / sell-spike opportunities derived from
 * accumulated price-history percentiles, plus pending-flip tracking and
 * flip history. Was an inline IIFE in App.jsx's render; unwrapped into a
 * real component.
 * Caller is responsible for the `activeTab === "flipping" && data` gate
 * (see App.jsx).
 * (Split out of App.jsx.)
 */
import React from "react";
import { Gold } from "../components/Gold.jsx";
import { FlipRow, ColHeader } from "../components/FlipRow.jsx";
import {
  flipPendingAdd, flipPendingGetAll, flipPendingDelete,
  flipHistoryAdd, flipHistoryGetAll, flipHistoryDelete,
} from "../lib/storage.js";

export function FlipMarketTab({
  data, flipSummary, velocitySummary, pendingFlips, setPendingFlips,
  flipHistory, setFlipHistory, craftingChartItem, setCraftingChartItem,
}) {
        const itemMap = data.itemMap || {};

        // Helper: format age
        const fmtAge = ms => ms < 3600000 ? `${Math.floor(ms/60000)}m ago` : ms < 86400000 ? `${Math.floor(ms/3600000)}h ago` : `${Math.floor(ms/86400000)}d ago`;

        // Build flip candidates: items with sufficient data + current price context
        const flipCandidates = Object.entries(flipSummary)
        .map(([idStr, flip]) => {
          const id = Number(idStr);
          const item = itemMap[id];
          const cur = data.priceMap[id];
          const curSell = cur?.sells?.unit_price || 0;
          const curBuy  = cur?.buys?.unit_price  || 0;
          if (!curSell) return null;
          const vel = velocitySummary[id];
          const sellFills = vel?.observations >= 5 ? vel.sellFillsPerHr : null;
          // Dip/spike classification using percentiles
          const isBuyNow  = curSell <= flip.p25Sell; // in bottom 25% — dip
          const isSellNow = curSell >= flip.p75Sell; // in top 25% — spike
          const isNeutral = !isBuyNow && !isSellNow;
          // Predicted profit: buy now at curSell, sell at p75 target
          const predictedProfit = isBuyNow ? Math.floor(flip.p75Sell * 0.85) - curSell : null;
          const predictedProfitOptimistic = isBuyNow ? Math.floor(flip.p90Sell * 0.85) - curSell : null;
          // Position in range: 0 = at floor, 1 = at ceiling
          const pricePosition = flip.p90Sell > flip.p10Sell ? (curSell - flip.p10Sell) / (flip.p90Sell - flip.p10Sell) : 0.5;
          return { id, item, flip, curSell, curBuy, sellFills, isBuyNow, isSellNow, isNeutral, predictedProfit, predictedProfitOptimistic, pricePosition };
        })
        .filter(Boolean)
        .filter(r => {
          if (r.sellFills == null) return false;
          if (r.sellFills < 1.0) return false;
          // For buy-now: only show if there's actual profit after 15% TP tax
          if (r.isBuyNow && (r.predictedProfit == null || r.predictedProfit <= 0)) return false;
          // Only show actionable signals
          return r.isBuyNow || r.isSellNow;
        })
        .sort((a, b) => {
          // Unified score: predicted profit × sell rate = expected gold per hour of flipping.
          // A fast market with modest spread beats a slow market with great spread
          // because you complete more flips per day and hold less risk per position.
          // For sell-now items: use current price above median × sell rate as proxy.
          const aProfit = a.isBuyNow ? (a.predictedProfit || 0) : a.isSellNow ? Math.floor((a.curSell - a.flip.p50Sell) * 0.85) : 0;
          const bProfit = b.isBuyNow ? (b.predictedProfit || 0) : b.isSellNow ? Math.floor((b.curSell - b.flip.p50Sell) * 0.85) : 0;
          const aFlipScore = aProfit * (a.sellFills || 0);
          const bFlipScore = bProfit * (b.sellFills || 0);
          // BUY NOW and SELL NOW always rank above mid-range, but within actionable signals sort by score
          const aActionable = a.isBuyNow || a.isSellNow ? 1 : 0;
          const bActionable = b.isBuyNow || b.isSellNow ? 1 : 0;
          if (aActionable !== bActionable) return bActionable - aActionable;
          return bFlipScore - aFlipScore;
        });

        // Pending flips: check if "sell now" for any pending item
        const pendingEnriched = pendingFlips.map(pf => {
          const cur = data.priceMap[pf.itemId];
          const curSell = cur?.sells?.unit_price || 0;
          const flip = flipSummary[pf.itemId];
          const isSellNow = flip && curSell >= flip.p75Sell;
          const currentProfit = curSell > 0 ? Math.floor(curSell * 0.85) - pf.buyPrice : null;
          return { ...pf, curSell, flip, isSellNow, currentProfit, item: itemMap[pf.itemId] };
        });

        return (
          <div>
          {/* Info banner */}
          <div style={{ marginBottom:18, padding:"12px 16px", background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:5, fontSize:13, color:"var(--text3)", lineHeight:1.6 }}>
          <span style={{ fontFamily:"Cinzel,serif", fontSize:11, letterSpacing:2, color:"var(--gold2)" }}>FLIP MARKET</span>
          {" — "}Buy at price dips (bottom 25% of historical range), sell at spikes (top 25%). Signals improve significantly with 30+ days of data.
          {Object.keys(flipSummary).length === 0 && <span style={{ color:"var(--gold)" }}> Collecting price history — check back in a few days.</span>}
          {Object.keys(flipSummary).length > 0 && <span style={{ marginLeft:8, color:"var(--text3)" }}>{Object.keys(flipSummary).length} items tracked · {flipCandidates.filter(r=>r.isBuyNow).length} buy signals · {flipCandidates.filter(r=>r.isSellNow).length} sell signals</span>}
          </div>

          {/* ── Pending Flips ── */}
          {pendingFlips.length > 0 && (
            <div className="lp-section" style={{ marginBottom:24 }}>
            <div className="lp-hdr" style={{ background:"rgba(80,120,200,0.1)", borderColor:"rgba(80,120,200,0.3)", color:"#9bbcf5" }}>
            ⏳ PENDING FLIPS — {pendingFlips.length} open position{pendingFlips.length > 1 ? "s" : ""}
            </div>
            {pendingEnriched.map(pf => (
              <div key={pf.id} className="lp-row" style={{ borderLeft: pf.isSellNow ? "3px solid var(--gold2)" : "3px solid rgba(80,120,200,0.4)", background: pf.isSellNow ? "rgba(200,150,42,0.05)" : undefined }}>
              {pf.item?.icon
                ? <img src={pf.item.icon} style={{ width:36, height:36, borderRadius:3, border:"1px solid var(--border2)", flexShrink:0 }} alt="" />
                : <div style={{ width:36, height:36, background:"var(--bg4)", borderRadius:3, flexShrink:0 }} />
              }
              <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:15, fontWeight:600, color:"var(--text1)", display:"flex", alignItems:"center", gap:8 }}>
              {pf.itemName || pf.item?.name || `Item ${pf.itemId}`}
              {pf.isSellNow && (
                <span style={{ fontSize:10, fontFamily:"Cinzel,serif", letterSpacing:1, padding:"2px 8px", borderRadius:3, background:"rgba(200,150,42,.2)", border:"1px solid rgba(200,150,42,.5)", color:"var(--gold2)" }}>
                💰 SELL NOW — at spike
                </span>
              )}
              </div>
              <div style={{ fontSize:12, color:"var(--text3)", marginTop:3, display:"flex", gap:12, flexWrap:"wrap" }}>
              <span>Bought {fmtAge(Date.now() - pf.buyTime)}</span>
              <span>×{pf.qty} @ <Gold v={pf.buyPrice} size={11} /></span>
              <span>Target: <Gold v={pf.targetSellPrice} size={11} /></span>
              {pf.curSell > 0 && <span style={{ color: pf.currentProfit > 0 ? "var(--green2)" : "var(--red)" }}>Current net: {pf.currentProfit > 0 ? "+" : ""}<Gold v={pf.currentProfit} size={11} /> each</span>}
              </div>
              </div>
              <div className="stat-cell" style={{ textAlign:"right", minWidth:120 }}>
              <span className="stat-lbl">CURRENT ASK</span>
              <Gold v={pf.curSell} size={14} />
              </div>
              <div className="stat-cell" style={{ textAlign:"right", minWidth:130 }}>
              <span className="stat-lbl">PREDICTED PROFIT</span>
              <span className={pf.currentProfit >= 0 ? "pp" : "pn"}>{pf.currentProfit >= 0 ? "+" : ""}<Gold v={pf.currentProfit * pf.qty} size={13} /></span>
              <span style={{ fontSize:11, color:"var(--text3)" }}>×{pf.qty}</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
              {pf.isSellNow && (
                <button className="rbtn" style={{ fontSize:11, color:"var(--gold2)", borderColor:"rgba(200,150,42,.4)" }}
                onClick={() => {
                  const profit = pf.currentProfit * pf.qty;
                  flipHistoryAdd({ itemId: pf.itemId, itemName: pf.itemName, buyPrice: pf.buyPrice, qty: pf.qty, sellPrice: pf.curSell, buyTime: pf.buyTime, sellTime: Date.now(), profit, failedFlip: false });
                  flipPendingDelete(pf.id);
                  setPendingFlips(prev => prev.filter(p => p.id !== pf.id));
                  flipHistoryGetAll().then(setFlipHistory);
                }}>
                ✓ Mark Sold
                </button>
              )}
              <button className="rbtn" style={{ fontSize:11, color:"var(--red)", borderColor:"rgba(200,60,60,.4)" }}
              onClick={() => {
                const loss = (pf.curSell > 0 ? Math.floor(pf.curSell * 0.85) - pf.buyPrice : -pf.buyPrice) * pf.qty;
                flipHistoryAdd({ itemId: pf.itemId, itemName: pf.itemName, buyPrice: pf.buyPrice, qty: pf.qty, sellPrice: pf.curSell || 0, buyTime: pf.buyTime, sellTime: Date.now(), profit: loss, failedFlip: true });
                flipPendingDelete(pf.id);
                setPendingFlips(prev => prev.filter(p => p.id !== pf.id));
                flipHistoryGetAll().then(setFlipHistory);
              }}>
              ✗ Remove (lost)
              </button>
              </div>
              </div>
            ))}
            </div>
          )}

          {/* ── Opportunities ── */}
          <div className="lp-section">
          <div className="lp-hdr">📊 FLIP OPPORTUNITIES</div>
          <div style={{ fontSize:11, color:"var(--text3)", fontFamily:"Cinzel,serif", letterSpacing:1, padding:"4px 16px 8px", borderBottom:"1px solid var(--border)" }}>
          Ranked by profit × sell rate (expected gold/hr) · min 1.0/hr · actionable signals only
          </div>
          {flipCandidates.length === 0 && Object.keys(flipSummary).length > 0 && (
            <div className="empty" style={{ padding:20 }}>No profitable flip opportunities at current prices. Markets are near median — check back when prices shift.</div>
          )}
          {flipCandidates.length > 0 && (() => {
            const buyNow  = flipCandidates.filter(r => r.isBuyNow);
            const sellNow = flipCandidates.filter(r => r.isSellNow);
            const FlipCol = "44px 1fr 90px 140px 160px";
            // FlipRow defined at module level
            // ColHeader defined at module level
            return (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 1px", background:"var(--border)" }}>
              {/* ── Buy Now column ── */}
              <div style={{ background:"var(--bg1)" }}>
              <ColHeader label="🟢 BUY NOW" color="var(--green2)" count={buyNow.length} flipCol={FlipCol} />
              {buyNow.length === 0
                ? <div style={{ padding:"16px 12px", fontSize:12, color:"var(--text3)" }}>No buy signals right now</div>
                : buyNow.map(r => <FlipRow key={r.id} r={r} side="buy" flipCol={FlipCol} chartItem={craftingChartItem} setChartItem={setCraftingChartItem} onTrack={cb => flipPendingAdd(cb).then(() => flipPendingGetAll().then(setPendingFlips))} />)
              }
              </div>
              {/* ── Sell Now column ── */}
              <div style={{ background:"var(--bg1)" }}>
              <ColHeader label="💰 SELL NOW" color="var(--gold2)" count={sellNow.length} flipCol={FlipCol} />
              {sellNow.length === 0
                ? <div style={{ padding:"16px 12px", fontSize:12, color:"var(--text3)" }}>No sell signals right now</div>
                : sellNow.map(r => <FlipRow key={r.id} r={r} side="sell" flipCol={FlipCol} chartItem={craftingChartItem} setChartItem={setCraftingChartItem} onTrack={cb => flipPendingAdd(cb).then(() => flipPendingGetAll().then(setPendingFlips))} />)
              }
              </div>
              </div>
            );
          })()}
          </div>

          {/* ── Flip History ── */}
          {flipHistory.length > 0 && (
            <div className="lp-section" style={{ marginTop:24 }}>
            <div className="lp-hdr">📜 FLIP HISTORY</div>
            <div style={{ display:"grid", gap:4 }}>
            {flipHistory.map(fh => {
              const ageMs = Date.now() - (fh.sellTime || fh.buyTime);
              return (
                <div key={fh.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 14px", background:"var(--bg2)", borderRadius:4, fontSize:13, borderLeft: fh.failedFlip ? "3px solid var(--red2)" : "3px solid var(--green2)" }}>
                <div style={{ flex:1, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontWeight:600, color:"var(--text1)" }}>{fh.itemName || `Item ${fh.itemId}`}</span>
                {fh.failedFlip && <span style={{ fontSize:10, fontFamily:"Cinzel,serif", color:"var(--red)", padding:"1px 6px", border:"1px solid rgba(200,60,60,.3)", borderRadius:3 }}>LOSS</span>}
                </div>
                <span style={{ color:"var(--text3)", fontSize:12 }}>×{fh.qty}</span>
                <span style={{ color:"var(--text3)", fontSize:12 }}>bought <Gold v={fh.buyPrice} size={11} /></span>
                {fh.sellPrice > 0 && <span style={{ color:"var(--text3)", fontSize:12 }}>sold <Gold v={fh.sellPrice} size={11} /></span>}
                <span className={fh.profit >= 0 ? "pp" : "pn"} style={{ fontWeight:600 }}>{fh.profit >= 0 ? "+" : ""}<Gold v={fh.profit} size={13} /></span>
                <span style={{ color:"var(--text3)", fontSize:12 }}>{fmtAge(ageMs)}</span>
                <button onClick={() => {
                  flipHistoryDelete(fh.id).then(() => {
                    setFlipHistory(prev => prev.filter(h => h.id !== fh.id));
                  }).catch(() => {});
                }} style={{ background:"transparent", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:14, padding:"0 2px", lineHeight:1 }} title="Remove from history">×</button>
                </div>
              );
            })}
            <div style={{ padding:"8px 14px", fontSize:12, color:"var(--text3)", display:"flex", gap:20 }}>
            <span>Total flips: {flipHistory.length}</span>
            <span style={{ color: flipHistory.reduce((s,h)=>s+h.profit,0) >= 0 ? "var(--green2)" : "var(--red)" }}>
            Net P&amp;L: {flipHistory.reduce((s,h)=>s+h.profit,0) >= 0 ? "+" : ""}<Gold v={flipHistory.reduce((s,h)=>s+h.profit,0)} size={12} />
            </span>
            <span>Won: {flipHistory.filter(h=>!h.failedFlip).length} / Lost: {flipHistory.filter(h=>h.failedFlip).length}</span>
            </div>
            </div>
            </div>
          )}
          </div>
        );
}
