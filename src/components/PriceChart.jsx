/**
 * Price history mini chart (SVG, hand-rolled) with 1H/24H/3D/7D/30D period
 * toggles, hover crosshair, and min/max markers. Used by the Materials tab,
 * Crafting Profits, Recommended, Unlearned Recipes, and the Flip Market tab.
 * (Split out of App.jsx.)
 */
import React, { useState, useRef, useEffect } from "react";
import { loadHistory } from "../lib/storage.js";

export const fmtAgo = (ms) => {
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
};

export function PriceChart({ itemId, itemName }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [period, setPeriod] = useState("24h");
  const [d, setD] = useState([]);

  const PERIODS = [
    { key: "1h",  label: "1H",    ms: 60 * 60 * 1000 },
    { key: "24h", label: "24H",   ms: 24 * 60 * 60 * 1000 },
    { key: "3d",  label: "3D",    ms: 3  * 24 * 60 * 60 * 1000 },
    { key: "7d",  label: "7D",    ms: 7  * 24 * 60 * 60 * 1000 },
    { key: "30d", label: "30D",   ms: 30 * 24 * 60 * 60 * 1000 },
  ];

  const [noData, setNoData] = useState(false);
  const [loading, setLoading] = useState(true);
  // Guards against out-of-order responses: if the user clicks between 1H/24H/3D/7D/30D
  // quickly, several loadHistory() calls can be in flight at once (a 30D query can take
  // far longer than a 1H query). Without this guard, whichever request happens to resolve
  // LAST wins — even if it was for a period the user already clicked away from — which is
  // exactly the "sometimes shows data, sometimes doesn't" behavior. Only the response that
  // matches the most recently issued request is allowed to update state.
  const requestSeqRef = useRef(0);
  // Per-item+period cache so re-clicking a period you've already viewed this session is
  // instant instead of re-running a potentially 30+ second query every time.
  const historyCacheRef = useRef(new Map());

  useEffect(() => {
    if (!itemId) return;
    const p = PERIODS.find(p => p.key === period);
    const sinceTs = Date.now() - p.ms;
    const cacheKey = `${itemId}:${period}`;
    const mySeq = ++requestSeqRef.current;

    const cached = historyCacheRef.current.get(cacheKey);
    if (cached) {
      // Show what we already have instantly; still refetch in the background below
      // so newly-collected snapshots eventually show up without a manual reopen.
      setD(cached);
      setNoData(cached.length === 0);
      setLoading(false);
    } else {
      setLoading(true);
      setNoData(false);
    }

    loadHistory(itemId, sinceTs).then(rows => {
      if (mySeq !== requestSeqRef.current) return; // superseded by a newer request — ignore
      historyCacheRef.current.set(cacheKey, rows);
      setD(rows);
      setNoData(rows.length === 0);
      setLoading(false);
    }).catch(() => {
      if (mySeq !== requestSeqRef.current) return;
      if (!cached) { setD([]); setNoData(true); }
      setLoading(false);
    });
  }, [itemId, period]);

  const fmtDate = (ts) => {
    const dt = new Date(ts);
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " +
    dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  const fmtGoldStr = (copper) => {
    if (!copper) return "0c";
    const g = Math.floor(copper / 10000);
    const s = Math.floor((copper % 10000) / 100);
    const c = copper % 100;
    const parts = [];
    if (g) parts.push(`${g}g`);
    if (s) parts.push(`${s}s`);
    parts.push(`${c}c`);
    return parts.join(" ");
  };

  if (!d || d.length < 2) return (
    <div className="hist-wrap">
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
    <div className="hist-lbl" style={{ margin: 0 }}>PRICE HISTORY — {itemName}</div>
    <div style={{ display: "flex", gap: 4 }}>
    {PERIODS.map(p => (
      <button key={p.key}
      onClick={() => setPeriod(p.key)}
      style={{
        fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1,
        padding: "2px 8px", borderRadius: 3, cursor: "pointer",
        border: period === p.key ? "1px solid var(--gold2)" : "1px solid var(--border)",
                       background: period === p.key ? "rgba(200,150,42,0.15)" : "transparent",
                       color: period === p.key ? "var(--gold2)" : "var(--text3)",
      }}>
      {p.label}
      </button>
    ))}
    </div>
    </div>
    <div className="hist-empty">
      {loading
        ? "Loading price history…"
        : noData
          ? "No price history collected for this item — only Rare/Exotic/Ascended/Legendary items are tracked."
          : "No data for this period yet."}
    </div>
    </div>
  );

  const W = 480, H = 160;
  const PAD = { top: 24, right: 16, bottom: 36, left: 70 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const sells = d.map(p => p.sell).filter(Boolean);
  const minV = Math.min(...sells), maxV = Math.max(...sells);
  const range = maxV - minV || 1;
  const pad = range * 0.1;
  const lo = Math.max(0, minV - pad), hi = maxV + pad;

  const toX = (i) => PAD.left + (i / (d.length - 1)) * cW;
  const toY = (v) => PAD.top + cH - ((v - lo) / (hi - lo)) * cH;

  const pts = d.map((p, i) => `${toX(i)},${toY(p.sell)}`).join(" ");
  const fillPts = `${PAD.left},${PAD.top + cH} ${pts} ${PAD.left + cW},${PAD.top + cH}`;

  // Find min/max indices
  const maxIdx = sells.indexOf(maxV);
  const minIdx = sells.indexOf(minV);

  // Y-axis ticks (4 ticks)
  const yTicks = [0, 1, 2, 3].map(i => lo + (hi - lo) * (i / 3));

  // X-axis ticks (up to 5)
  const xTickCount = Math.min(5, d.length);
  const xTicks = Array.from({ length: xTickCount }, (_, i) =>
  Math.round(i * (d.length - 1) / (xTickCount - 1))
  );

  const handleMouseMove = (e) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const svgX = (e.clientX - rect.left) * (W / rect.width);
    const chartX = svgX - PAD.left;
    if (chartX < 0 || chartX > cW) { setHover(null); return; }
    const idx = Math.round((chartX / cW) * (d.length - 1));
    const clamped = Math.max(0, Math.min(d.length - 1, idx));
    setHover({ idx: clamped, x: toX(clamped), y: toY(d[clamped].sell), point: d[clamped] });
  };

  const fmtXLabel = (ts) => {
    const dt = new Date(ts);
    if (period === "1h") return dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    if (period === "24h") return dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="hist-wrap">
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
    <div className="hist-lbl" style={{ margin: 0 }}>PRICE HISTORY — {itemName}</div>
    <div style={{ display: "flex", gap: 4 }}>
    {PERIODS.map(p => (
      <button key={p.key}
      onClick={() => setPeriod(p.key)}
      style={{
        fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1,
        padding: "2px 8px", borderRadius: 3, cursor: "pointer",
        border: period === p.key ? "1px solid var(--gold2)" : "1px solid var(--border)",
                       background: period === p.key ? "rgba(200,150,42,0.15)" : "transparent",
                       color: period === p.key ? "var(--gold2)" : "var(--text3)",
      }}>
      {p.label}
      </button>
    ))}
    </div>
    </div>
    <svg
    ref={svgRef}
    width="100%"
    viewBox={`0 0 ${W} ${H}`}
    style={{ display: "block", cursor: "crosshair" }}
    onMouseMove={handleMouseMove}
    onMouseLeave={() => setHover(null)}
    >
    {/* Grid lines */}
    {yTicks.map((v, i) => (
      <line key={i} x1={PAD.left} y1={toY(v)} x2={PAD.left + cW} y2={toY(v)}
      stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    ))}

    {/* Fill */}
    <polygon points={fillPts} fill="rgba(200,150,42,0.08)" />

    {/* Line */}
    <polyline fill="none" stroke="var(--gold)" strokeWidth="1.5" points={pts} />

    {/* Y-axis labels */}
    {yTicks.map((v, i) => (
      <text key={i} x={PAD.left - 6} y={toY(v) + 4}
      fill="var(--text3)" fontSize="10" textAnchor="end" fontFamily="Cinzel,serif">
      {fmtGoldStr(Math.round(v))}
      </text>
    ))}

    {/* X-axis labels */}
    {xTicks.map((idx, i) => {
      const lbl = fmtXLabel(d[idx].ts);
      return (
        <text key={i} x={toX(idx)} y={H - 6}
        fill="var(--text3)" fontSize="10" textAnchor="middle" fontFamily="Cinzel,serif">
        {lbl}
        </text>
      );
    })}

    {/* Axes */}
    <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + cH}
    stroke="var(--border2)" strokeWidth="1" />
    <line x1={PAD.left} y1={PAD.top + cH} x2={PAD.left + cW} y2={PAD.top + cH}
    stroke="var(--border2)" strokeWidth="1" />

    {/* Max point */}
    <circle cx={toX(maxIdx)} cy={toY(maxV)} r="4"
    fill="var(--green)" stroke="var(--bg4)" strokeWidth="1.5" />
    <text x={toX(maxIdx)} y={toY(maxV) - 8}
    fill="var(--green)" fontSize="10" textAnchor="middle" fontFamily="Cinzel,serif">
    ▲ {fmtGoldStr(maxV)}
    </text>

    {/* Min point */}
    <circle cx={toX(minIdx)} cy={toY(minV)} r="4"
    fill="var(--red)" stroke="var(--bg4)" strokeWidth="1.5" />
    <text x={toX(minIdx)} y={toY(minV) + 18}
    fill="var(--red)" fontSize="10" textAnchor="middle" fontFamily="Cinzel,serif">
    ▼ {fmtGoldStr(minV)}
    </text>

    {/* Hover crosshair */}
    {hover && (
      <>
      <line x1={hover.x} y1={PAD.top} x2={hover.x} y2={PAD.top + cH}
      stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="3,3" />
      <circle cx={hover.x} cy={hover.y} r="5"
      fill="var(--gold2)" stroke="var(--bg4)" strokeWidth="2" />
      {/* Tooltip box */}
      {(() => {
        const bx = hover.x + 10 > PAD.left + cW - 140 ? hover.x - 155 : hover.x + 10;
        return (
          <g>
          <rect x={bx} y={hover.y - 32} width={145} height={44}
          fill="var(--bg4)" stroke="var(--gold)" strokeWidth="1" rx="3" />
          <text x={bx + 8} y={hover.y - 14}
          fill="var(--gold2)" fontSize="12" fontFamily="Cinzel,serif" fontWeight="600">
          {fmtGoldStr(hover.point.sell)}
          </text>
          <text x={bx + 8} y={hover.y + 4}
          fill="var(--text3)" fontSize="10" fontFamily="Cinzel,serif">
          {fmtDate(hover.point.ts)}
          </text>
          </g>
        );
      })()}
      </>
    )}
    </svg>
    <div style={{ display: "flex", gap: 20, marginTop: 6, fontSize: 12, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 0.5 }}>
    <span>{d.length} snapshots</span>
    <span>from {fmtAgo(Date.now() - d[0].ts)}</span>
    <span style={{ color: "var(--green)" }}>▲ {fmtGoldStr(maxV)}</span>
    <span style={{ color: "var(--red)" }}>▼ {fmtGoldStr(minV)}</span>
    </div>
    </div>
  );
}
