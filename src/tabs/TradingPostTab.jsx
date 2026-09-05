/**
 * Trading Post tab — active sell listings (with undercut/stale detection)
 * and sold-history sub-tabs. Was an inline IIFE in App.jsx's render;
 * unwrapped into a real component.
 * Caller is responsible for the `activeTab === "listings" && data` gate
 * (see App.jsx).
 * (Split out of App.jsx.)
 */
import React from "react";
import { Gold } from "../components/Gold.jsx";

export function TradingPostTab({
  data, tpSubTab, setTpSubTab, mySoldHistory, myListings, velocitySummary,
}) {
        const itemMap = data.itemMap || {};

        // Sub-tab header
        const tpSubHdr = (
          <div style={{ display: "flex", gap: 6, marginBottom: 18, borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
          {[["current", "🏪 Current Listings", Object.keys(myListings).length],
            ["history", "📜 Sale History", mySoldHistory.length]
          ].map(([key, label, count]) => (
            <button key={key} onClick={() => setTpSubTab(key)}
            style={{ fontSize: 12, fontFamily: "Cinzel,serif", letterSpacing: 1, padding: "5px 14px", borderRadius: 4, cursor: "pointer", border: tpSubTab === key ? "1px solid var(--gold2)" : "1px solid var(--border)", background: tpSubTab === key ? "rgba(180,140,40,.15)" : "transparent", color: tpSubTab === key ? "var(--gold1)" : "var(--text2)" }}>
            {label}{count > 0 && <span style={{ marginLeft: 6, fontSize: 10, opacity: .7 }}>{count}</span>}
            </button>
          ))}
          </div>
        );

        // Active sell listings grouped and sorted by value
        const listingRows = Object.entries(myListings)
        .map(([itemId, listings]) => {
          const id = Number(itemId);
          const item = itemMap[id];
          const totalQty = listings.reduce((s, l) => s + l.quantity, 0);
          const minPrice = Math.min(...listings.map(l => l.price));
          const maxPrice = Math.max(...listings.map(l => l.price));
          const totalValue = listings.reduce((s, l) => s + l.price * l.quantity, 0);
          const totalNet = Math.floor(totalValue * 0.85);
          const oldest = listings.reduce((o, l) => !o || new Date(l.created) < new Date(o.created) ? l : o, null);
          const ageMs = oldest ? Date.now() - new Date(oldest.created).getTime() : 0;
          const ageTxt = ageMs < 3600000 ? `${Math.floor(ageMs/60000)}m` : ageMs < 86400000 ? `${Math.floor(ageMs/3600000)}h` : `${Math.floor(ageMs/86400000)}d`;
          const vel = velocitySummary[id];
          const sellFills = vel?.observations >= 5 ? vel.sellFillsPerHr : null;
          // Current market ask price from priceMap
          const mktAsk = data.priceMap[id]?.sells?.unit_price || 0;
          const mktBid = data.priceMap[id]?.buys?.unit_price || 0;
          const mktListings = data.priceMap[id]?.sells?.quantity || 0;
          // Undercut: someone is listing below my cheapest price
          const isUndercut = mktAsk > 0 && minPrice > 0 && mktAsk < minPrice;
          const undercutBy = isUndercut ? minPrice - mktAsk : 0;
          // Days to sell: listings ahead of me in queue / fill rate
          // Listings ahead ≈ total market listings minus my qty (rough estimate)
          const queueAhead = Math.max(0, mktListings - totalQty);
          const daysToSell = (sellFills && sellFills > 0) ? queueAhead / (sellFills * 24) : null;
          // Sold history for this item
          const mySolds = mySoldHistory.filter(s => s.item_id === id);
          const lastSoldMs = mySolds.length > 0 ? Date.now() - new Date(mySolds[0].purchased).getTime() : null;
          return { id, item, totalQty, minPrice, maxPrice, totalValue, totalNet, ageTxt, ageMs, listings, sellFills, mktAsk, mktBid, mktListings, isUndercut, undercutBy, daysToSell, mySolds, lastSoldMs };
        })
        .sort((a, b) => {
          // Undercut items float to top, each group sorted newest listed first
          if (a.isUndercut !== b.isUndercut) return a.isUndercut ? -1 : 1;
          return a.ageMs - b.ageMs;
        });

        // Sold history — group by item, show individually
        const soldRows = mySoldHistory.slice(0, 200);
        // Aggregate stats
        const totalListedNet = listingRows.reduce((s, r) => s + r.totalNet, 0);
        const totalListedQty = listingRows.reduce((s, r) => s + r.totalQty, 0);
        const soldLast30 = soldRows.filter(r => new Date(r.purchased) > new Date(Date.now() - 30*86400000));
        const soldRevenue30 = soldLast30.reduce((s, r) => s + r.price * r.quantity, 0);
        const soldNet30 = Math.floor(soldRevenue30 * 0.85);

        return (
          <div>
          {tpSubHdr}
          {/* Summary strip */}
          <div className="cards" style={{ gridTemplateColumns: "repeat(2,1fr)", marginBottom: 20 }}>
          {(tpSubTab === "current" ? [
            ["ACTIVE LISTINGS", listingRows.length + " items", `${totalListedQty} total qty`],
            ["LISTING VALUE (NET)", <Gold v={totalListedNet} size={15} />, "after 15% tax"],
          ] : [
            ["SOLD (30 DAYS)", soldLast30.length + " transactions", `${soldLast30.reduce((s,r)=>s+r.quantity,0)} items sold`],
            ["REVENUE (30 DAYS)", <Gold v={soldNet30} size={15} />, "after 15% tax"],
          ]).map(([lbl, val, sub]) => (
            <div key={lbl} className="card">
            <div className="card-lbl">{lbl}</div>
            <div className="card-val" style={{ fontSize: 20 }}>{val}</div>
            <div className="card-sub">{sub}</div>
            </div>
          ))}
          </div>

          {/* Active Listings */}
          {tpSubTab === "current" && <div className="lp-section">
            <div className="lp-hdr">🏪 ACTIVE SELL LISTINGS</div>
            {listingRows.length === 0 && <div className="empty">No active sell listings found.</div>}
            {listingRows.map(r => {
              const soldQty30 = r.mySolds.filter(s => new Date(s.purchased) > new Date(Date.now()-30*86400000)).reduce((s,x)=>s+x.quantity,0);
              // Stale detection: listed > 3 days, no sales in history, low fills
              const isStale = r.ageMs > 3*86400000 && r.mySolds.length === 0 && (r.sellFills == null || r.sellFills < 0.2);
              return (
                <div key={r.id} className="lp-row" style={{ borderLeft: r.isUndercut ? "3px solid var(--red2)" : isStale ? "3px solid rgba(200,150,42,.3)" : "3px solid transparent" }}>
                {r.item?.icon
                  ? <img src={r.item.icon} style={{ width:36, height:36, borderRadius:3, border:"1px solid var(--border2)", flexShrink:0 }} alt="" />
                  : <div style={{ width:36, height:36, borderRadius:3, background:"var(--bg4)", flexShrink:0 }} />
                }
                <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:600, color:"var(--text1)", display:"flex", alignItems:"center", gap:8 }}>
                {r.item?.name || `Item ${r.id}`}
                {r.isUndercut && (
                  <span title={`Someone is listing at ${Math.floor(r.mktAsk/10000)}g${Math.floor((r.mktAsk%10000)/100)}s — ${Math.floor(r.undercutBy/10000)}g${Math.floor((r.undercutBy%10000)/100)}s below your price. Relist at ${r.mktAsk - 1}c to be lowest.`}
                  style={{ fontSize:10, fontFamily:"Cinzel,serif", letterSpacing:1, padding:"2px 7px", borderRadius:3, background:"rgba(200,60,60,.15)", border:"1px solid rgba(200,60,60,.4)", color:"var(--red2)", cursor:"help" }}>
                  ⚡ UNDERCUT −<Gold v={r.undercutBy} size={10} />
                  </span>
                )}
                {isStale && !r.isUndercut && (
                  <span title={`Listed ${r.ageTxt} ago with no confirmed sales and low market activity. Consider cancelling or adjusting price.`}
                  style={{ fontSize:10, fontFamily:"Cinzel,serif", letterSpacing:1, padding:"2px 7px", borderRadius:3, background:"rgba(160,120,0,.12)", border:"1px solid rgba(160,120,0,.3)", color:"var(--gold)", cursor:"help" }}>
                  ⚠ STALE
                  </span>
                )}
                {soldQty30 > 0 && (
                  <span title={`You sold ${soldQty30}× in last 30 days — confirmed demand`}
                  style={{ fontSize:10, fontFamily:"Cinzel,serif", letterSpacing:1, padding:"2px 7px", borderRadius:3, background:"rgba(60,160,60,.12)", border:"1px solid rgba(60,160,60,.3)", color:"var(--green2)", cursor:"help" }}>
                  ✓ {soldQty30}× sold/30d
                  </span>
                )}
                </div>
                <div style={{ fontSize:12, color:"var(--text3)", marginTop:3, display:"flex", gap:12, flexWrap:"wrap" }}>
                <span>listed {r.ageTxt} ago</span>
                <span>{r.mktListings.toLocaleString()} on market</span>
                {r.daysToSell != null && <span title="Estimated days for your listing to clear based on queue depth and fill rate" style={{ color: r.daysToSell < 1 ? "var(--green2)" : r.daysToSell < 7 ? "var(--gold2)" : "var(--red)" }}>~{r.daysToSell < 1 ? `${Math.round(r.daysToSell*24)}h` : `${r.daysToSell.toFixed(1)}d`} to sell</span>}
                </div>
                </div>
                <div className="stat-cell" style={{ textAlign:"right", minWidth:80 }}>
                <span className="stat-lbl">QTY</span>
                <span style={{ fontSize:16, color:"var(--text1)" }}>{r.totalQty}×</span>
                </div>
                <div className="stat-cell" style={{ textAlign:"right", minWidth:130 }}>
                <span className="stat-lbl">MY PRICE</span>
                <Gold v={r.minPrice} size={14} />
                {r.isUndercut && <div style={{ fontSize:11, color:"var(--red)" }}>mkt: <Gold v={r.mktAsk} size={11} /></div>}
                </div>
                <div className="stat-cell" style={{ textAlign:"right", minWidth:130 }}>
                <span className="stat-lbl">TOTAL NET</span>
                <span className="pp"><Gold v={r.totalNet} size={14} /></span>
                </div>
                <div className="stat-cell" style={{ textAlign:"right", minWidth:110 }} title="Buyers paying ask price per hour (upper bound market velocity)">
                <span className="stat-lbl">BUYING HIGH</span>
                <span style={{ fontSize:13, color: r.sellFills > 0.5 ? "var(--green2)" : r.sellFills === 0 ? "var(--red)" : r.sellFills != null ? "var(--gold2)" : "var(--text3)" }}>
                {r.sellFills != null ? `${r.sellFills.toFixed(1)}/hr` : "no data"}
                </span>
                </div>
                </div>
              );
            })}
            </div>}

            {/* Sold History */}
            {tpSubTab === "history" && <div className="lp-section">
              <div className="lp-hdr">
              💰 SELL HISTORY
              <span style={{ fontSize:11, color:"var(--text3)", fontFamily:"var(--font-body)", fontStyle:"italic", letterSpacing:0 }}>most recent 200 transactions</span>
              </div>
              {soldRows.length === 0 && <div className="empty">No sold history found. The GW2 API returns up to 500 recent transactions.</div>}
              {soldRows.map((r, i) => {
                const item = itemMap[r.item_id];
                const net = Math.floor(r.price * 0.85);
                const totalNet = Math.floor(r.price * r.quantity * 0.85);
                const dt = new Date(r.purchased);
                const dateTxt = dt.toLocaleDateString(undefined, { month:"short", day:"numeric", year:"numeric" });
                const timeTxt = dt.toLocaleTimeString(undefined, { hour:"2-digit", minute:"2-digit" });
                return (
                  <div key={i} className="sold-row">
                  {item?.icon
                    ? <img src={item.icon} style={{ width:32, height:32, borderRadius:3, border:"1px solid var(--border2)", flexShrink:0 }} alt="" />
                    : <div style={{ width:32, height:32, borderRadius:3, background:"var(--bg4)", flexShrink:0 }} />
                  }
                  <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, color:"var(--text1)" }}>{item?.name || `Item ${r.item_id}`}</div>
                  </div>
                  <div className="sold-date">{dateTxt} {timeTxt}</div>
                  <div className="sold-qty">{r.quantity}×</div>
                  <div className="stat-cell" style={{ textAlign:"right", minWidth:110 }}>
                  <span className="stat-lbl">UNIT (NET)</span>
                  <Gold v={net} size={13} />
                  </div>
                  <div className="sold-total"><span className="pp"><Gold v={totalNet} size={14} /></span></div>
                  </div>
                );
              })}
              </div>}
              </div>
        );
}
