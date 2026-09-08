/**
 * Event Timeline — the Gantt-strip view from event_timer.py, rebuilt on top
 * of the same schedule data/calculators the Countdown view uses. Columns
 * are derived fresh from `now` every tick instead of being mutated in
 * place, so "shifting left as time passes" falls out for free — there's no
 * manual array-splice-and-append step like the original PyQt version
 * needed for its stateful row model.
 *
 * NOTE ON DURATION: neither WorldBossScheduleData nor MetaEventScheduleData
 * models how long an event actually runs — only its spawn instant. Blocks
 * here are drawn at a fixed one-interval width as a "be here at this time"
 * marker rather than a fabricated duration.
 *
 * Completion is tracked per (name, location) per UTC calendar day — marking
 * any one occurrence of a boss done marks it done for every occurrence of
 * that same boss that day, matching event_timer.py's own per-day semantics.
 * (Lives in tabs/, alongside BossTimersTab.jsx.)
 */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getUpcomingRowSeries, getAllPossibleExpansions } from "../lib/bossTimerCalc.js";
import { bossKey, loadCompletions, saveCompletions } from "../lib/bossTimerStorage.js";
import { EXPANSION_ACCENT_COLORS, EXPANSION_ACCENT_FALLBACK, expansionSortKey } from "../lib/worldBossScheduleData.js";

const INTERVAL_MIN = 15;
const INTERVAL_MS = INTERVAL_MIN * 60_000;
const HOURS_AHEAD = 3;
const SLOT_COUNT = (HOURS_AHEAD * 60) / INTERVAL_MIN + 1;
const COL_WIDTH = 150;
const ROW_LABEL_WIDTH = 150;
const FETCH_CYCLES = 8; // generous buffer — filtered down to the visible window below
const TICK_MS = 1000;

function snapToLocalInterval(nowMs, intervalMin) {
  const d = new Date(nowMs);
  const snapped = Math.floor(d.getMinutes() / intervalMin) * intervalMin;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), snapped, 0, 0).getTime();
}

function currentPeriod(nowMs) {
  return new Date(nowMs).toISOString().slice(0, 10); // UTC calendar day
}

function TimelineRow({ row, origin, windowEnd, completions, currentPeriodStr, onToggle }) {
  const slots = row.slots.filter(s => s.time >= origin && s.time < windowEnd);
  // Row height grows to fit the most-stacked block in this row.
  const maxStack = slots.reduce((m, s) => Math.max(m, s.occurrences.length), 1);
  const rowHeight = Math.max(44, maxStack * 22 + 14);

  return (
    <div className="tl-row" style={{ height: rowHeight }}>
      <div className="tl-row-label">{row.rowLabel}</div>
      <div className="tl-track">
        {slots.map((slot, i) => {
          const left = ((slot.time - origin) / INTERVAL_MS) * COL_WIDTH;
          return (
            <div key={i} className="tl-block" style={{ left, width: COL_WIDTH - 4 }}>
              {slot.occurrences.map((occ, j) => {
                const key = bossKey(occ.name, occ.location);
                const done = completions[key]?.period === currentPeriodStr;
                return (
                  <label key={j} className="tl-occ-line">
                    <input type="checkbox" checked={done} onChange={() => onToggle(occ.name, occ.location)} />
                    <span className="tl-occ-name">{occ.name}</span>
                  </label>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineSection({ expansion, rows, origin, windowEnd, nowLineLeft, collapsed, onToggleCollapse, completions, currentPeriodStr, onToggle }) {
  const accent = EXPANSION_ACCENT_COLORS[expansion] || EXPANSION_ACCENT_FALLBACK;
  return (
    <div className="ci" style={{ marginBottom: 10 }}>
      <div className="ci-hdr" onClick={onToggleCollapse} style={{ cursor: "pointer" }}>
        <span style={{ color: "var(--text3)", fontSize: 12 }}>{collapsed ? "▶" : "▼"}</span>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: accent, flexShrink: 0 }} />
        <span className="ci-name" style={{ flex: "unset" }}>{expansion}</span>
      </div>
      {!collapsed && (
        <div style={{ position: "relative", borderTop: "1px solid var(--border)", background: "var(--bg2)", overflowX: "auto" }}>
          <div className="tl-nowline" style={{ left: nowLineLeft }} />
          {rows.map(row => (
            <TimelineRow key={row.rowLabel} row={row} origin={origin} windowEnd={windowEnd}
              completions={completions} currentPeriodStr={currentPeriodStr} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function EventTimelineTab() {
  const [now, setNow] = useState(Date.now());
  const [completions, setCompletions] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [collapsedExpansions, setCollapsedExpansions] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;
    loadCompletions().then(c => { if (!cancelled) { setCompletions(c); setLoaded(true); } }).catch(() => setLoaded(true));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(t);
  }, []);

  const origin = useMemo(() => snapToLocalInterval(now, INTERVAL_MIN), [now]);
  const windowEnd = origin + SLOT_COUNT * INTERVAL_MS;
  const nowLineLeft = ((now - origin) / INTERVAL_MS) * COL_WIDTH;
  const periodStr = currentPeriod(now);

  const allRows = useMemo(() => getUpcomingRowSeries(origin, FETCH_CYCLES), [origin]);
  const sectionsByExpansion = useMemo(() => {
    const map = new Map();
    for (const row of allRows) {
      const hasVisibleSlot = row.slots.some(s => s.time >= origin && s.time < windowEnd);
      if (!hasVisibleSlot) continue;
      if (!map.has(row.expansion)) map.set(row.expansion, []);
      map.get(row.expansion).push(row);
    }
    return [...map.entries()].sort((a, b) => expansionSortKey(a[0]) - expansionSortKey(b[0]));
  }, [allRows, origin, windowEnd]);

  const handleToggle = useCallback((name, location) => {
    setCompletions(prev => {
      const key = bossKey(name, location);
      const next = { ...prev };
      if (next[key]?.period === currentPeriod(Date.now())) {
        delete next[key]; // un-check
      } else {
        next[key] = { period: currentPeriod(Date.now()) };
      }
      saveCompletions(next);
      return next;
    });
  }, []);

  if (!loaded) return <div className="empty">Loading event timeline…</div>;

  // Column headers, shared across every section.
  const headerCols = Array.from({ length: SLOT_COUNT }, (_, i) => {
    const t = origin + i * INTERVAL_MS;
    return new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  });

  return (
    <div>
      <div style={{ display: "flex", marginBottom: 8, paddingLeft: ROW_LABEL_WIDTH, position: "relative" }}>
        {headerCols.map((label, i) => (
          <div key={i} style={{ width: COL_WIDTH, flexShrink: 0, fontSize: 11, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 1, textAlign: "center" }}>
            {label}
          </div>
        ))}
      </div>

      {sectionsByExpansion.length === 0
        ? <div className="empty">Nothing scheduled in the next {HOURS_AHEAD} hours.</div>
        : sectionsByExpansion.map(([expansion, rows]) => (
          <TimelineSection key={expansion} expansion={expansion} rows={rows} origin={origin} windowEnd={windowEnd}
            nowLineLeft={nowLineLeft + ROW_LABEL_WIDTH} collapsed={collapsedExpansions.has(expansion)}
            onToggleCollapse={() => setCollapsedExpansions(prev => {
              const next = new Set(prev);
              if (next.has(expansion)) next.delete(expansion); else next.add(expansion);
              return next;
            })}
            completions={completions} currentPeriodStr={periodStr} onToggle={handleToggle} />
        ))}
    </div>
  );
}
