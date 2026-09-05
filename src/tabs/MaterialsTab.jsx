/**
 * Materials tab — owned material inventory table with price-alert banner
 * and per-row "best crafting use" hint.
 * (Split out of App.jsx. Internal useMemo dep list is unchanged from the
 * original — kept narrow so this doesn't recompute on unrelated App state
 * changes, e.g. switching tabs or opening a chart elsewhere.)
 */
import React, { useMemo } from "react";
import { Gold } from "../components/Gold.jsx";
import { TrendBadge } from "../components/TrendBadge.jsx";
import { BestCraftingUseCell } from "../components/BestCraftingUseCell.jsx";
import { PriceChart } from "../components/PriceChart.jsx";
import { sortBy, SortTh } from "../components/tableHelpers.jsx";

export function MaterialsTab({
  data, searchMat, setSearchMat, matPage, setMatPage, sortMat, setSortMat,
  priceAlerts, alertSort, setAlertSort, trendSummary, velocitySummary,
  historyItem, setHistoryItem, PAGE_SIZE,
}) {
  const content = useMemo(() => {
    if (!data) return null;
    const rows = sortBy(
      data.materialRows.filter(r => r.name.toLowerCase().includes(searchMat.toLowerCase())),
                        sortMat.k, sortMat.d
    );
    // Best crafting use: craftAdvantage * velocity
    const getBest = (id) => data.craftItems
    .filter(ci => ci.outputId !== id && ci.matDetails.some(m => m.itemId === id) && ci.craftAdvantage > 0)
    .map(ci => {
      const vel = velocitySummary[ci.outputId];
      const sellFills = vel?.observations >= 5 ? vel.sellFillsPerHr : null;
      const advantage = ci.craftAdvantage;
      let score;
      if (sellFills === 0 || sellFills == null) score = advantage * 0.01;
      else score = advantage * sellFills;
      return { ...ci, score };
    })
    .sort((a, b) => b.score - a.score).slice(0, 3);

    return (
      <div>
      <div className="ctrl">
      <input
      className="si"
      placeholder="Search materials..."
      value={searchMat}
      onChange={e => { setSearchMat(e.target.value); setMatPage(0); }}
      />
      </div>
      {priceAlerts.length > 0 && (
        <div className="alert-banner">
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10, gap: 16 }}>
        <strong style={{ flex: 1 }}>📈 PRICE NEAR 7-DAY HIGH — GOOD TIME TO SELL</strong>
        <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>SORT:</span>
        {[["totalNet","Total Profit"],["cur","Unit Price"],["pctOfMax","% of 7d Max"]].map(([k, label]) => (
          <span key={k} onClick={() => setAlertSort(k)}
          style={{ cursor: "pointer", fontSize: 11, padding: "2px 8px", borderRadius: 3, fontFamily: "Cinzel,serif", letterSpacing: 1,
            border: `1px solid ${alertSort === k ? "var(--gold)" : "var(--border)"}`,
                                                                                                            color: alertSort === k ? "var(--gold2)" : "var(--text3)",
                                                                                                            background: alertSort === k ? "rgba(200,150,42,0.1)" : "transparent" }}>
                                                                                                            {label}
                                                                                                            </span>
        ))}
        </div>
        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 70px 130px 130px 130px 110px", gap: "0 12px", alignItems: "center",
          padding: "4px 6px", marginBottom: 4, borderBottom: "1px solid var(--border2)" }}>
          <span />
          <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>ITEM</span>
          <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>COUNT</span>
          <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>UNIT PRICE</span>
          <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>TOTAL NET</span>
          <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>7D HIGH</span>
          <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>STATUS</span>
          </div>
          {[...priceAlerts].sort((a, b) => b[alertSort] - a[alertSort]).map(a => (
            <div key={a.id} className="alert-item" style={{ display: "grid", gridTemplateColumns: "28px 1fr 70px 130px 130px 130px 110px", gap: "0 12px", alignItems: "center" }}>
            {a.icon ? <img src={a.icon} style={{ width: 22, height: 22, borderRadius: 2, border: "1px solid var(--border2)" }} alt="" /> : <span />}
            <span style={{ fontSize: 15 }}>{a.name}</span>
            <span style={{ fontSize: 13, color: "var(--text2)" }}>×{a.count.toLocaleString()}</span>
            <span><Gold v={a.cur} size={14} /></span>
            <span><Gold v={a.totalNet} size={14} /></span>
            <span><Gold v={a.sevenDayMax} size={13} /></span>
            <span style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 3, textAlign: "center",
              background: a.isNewHigh ? "rgba(90,200,90,0.15)" : "rgba(200,150,42,0.15)",
                                                                                  color: a.isNewHigh ? "var(--green2)" : "var(--gold2)",
                                                                                  fontFamily: "Cinzel,serif", letterSpacing: 1, whiteSpace: "nowrap",
            }}>
            {a.isNewHigh ? "🏆 NEW HIGH" : `${a.pctOfMax}% of max`}
            </span>
            </div>
          ))}
          </div>
      )}
      {rows.length > PAGE_SIZE && (
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0", fontSize:12, fontFamily:"Cinzel,serif", letterSpacing:1, color:"var(--text3)" }}>
        <button className="rbtn" disabled={matPage === 0} onClick={() => setMatPage(p => p-1)}>← Prev</button>
        <span>Page {matPage+1} of {Math.ceil(rows.length/PAGE_SIZE)} · {rows.length} materials</span>
        <button className="rbtn" disabled={(matPage+1)*PAGE_SIZE >= rows.length} onClick={() => setMatPage(p => p+1)}>Next →</button>
        </div>
      )}
      <div className="tw">
      <table>
      <thead>
      <tr>
      <SortTh label="Material" k="name" s={sortMat} setS={setSortMat} style={{ width: "36%" }} />
      <SortTh label="Count" k="count" s={sortMat} setS={setSortMat} />
      <SortTh label="TP Sell Price (net)" k="sellPriceNet" s={sortMat} setS={setSortMat} />
      <SortTh label="Total Value (after tax)" k="totalValue" s={sortMat} setS={setSortMat} />
      <th>Best Crafting Use</th>
      <th>Price History</th>
      </tr>
      </thead>
      <tbody>
      {rows.slice(matPage*PAGE_SIZE, (matPage+1)*PAGE_SIZE).map(row => {
        const best = getBest(row.id);
        return (
          <React.Fragment key={row.id}>
          <tr>
          <td><div className="ic">{row.icon ? <img className="iico" src={row.icon} alt="" /> : <div className="iico-ph" />}<span className={`rar-${row.rarity}`}>{row.name}</span></div></td>
          <td>{row.count.toLocaleString()}</td>
          <td>
          <div className="p2">
          <span className="psell"><Gold v={row.sellPriceNet} /></span>
          <span style={{ fontSize: 12, color: "var(--text3)" }}>(<Gold v={row.sellPrice} size={12} /> before tax)</span>
          </div>
          <TrendBadge trend={trendSummary[row.id]} />
          </td>
          <td><Gold v={row.totalValue} /></td>
          <td>
          {best.length > 0 ? <BestCraftingUseCell best={best} velocitySummary={velocitySummary} trendSummary={trendSummary} /> : <span style={{ color: "var(--text3)" }}>—</span>}
          </td>
          <td>
          <button
          onClick={() => setHistoryItem(historyItem === row.id ? null : row.id)}
          style={{ fontSize: 12, color: historyItem === row.id ? "var(--gold2)" : "var(--text3)", background: "transparent", border: "1px solid var(--border)", borderRadius: 3, padding: "3px 10px", cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
          {historyItem === row.id ? "▲ Hide" : "📈 Chart"}
          </button>
          </td>
          </tr>
          {historyItem === row.id && (
            <tr>
            <td colSpan={6} style={{ padding: 0, background: "var(--bg2)", borderBottom: "2px solid var(--border2)" }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ padding: "14px 16px", width: 560 }}>
            <PriceChart itemId={row.id} itemName={row.name} />
            </div>
            </div>
            </td>
            </tr>
          )}
          </React.Fragment>
        );
      })}
      <tr>
      <td colSpan={3} className="tfoot" style={{ color: "var(--text3)", fontSize: 13 }}>{rows.length} materials · values shown after 15% TP tax</td>
      <td className="tfoot"><Gold v={rows.reduce((s, r) => s + r.totalValue, 0)} /></td>
      <td className="tfoot" colSpan={2} />
      </tr>
      </tbody>
      </table>
      </div>
      </div>
    );
  }, [data, searchMat, sortMat, historyItem, priceAlerts, trendSummary, matPage]);

  return content;
}
