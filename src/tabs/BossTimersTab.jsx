/**
 * Boss Timers — combined Countdown + Timeline view for World Bosses, Hardcore
 * Meta bosses, Invasions, and zone meta events.
 *
 * This replaces the old BossTimersTab.jsx / EventTimelineTab.jsx split. A
 * "View" control next to Areas/Sound swaps between the countdown-grid
 * presentation and the Gantt-strip timeline presentation of the SAME
 * underlying schedule data — Timeline is just another way to look at Boss
 * Timers now, not a separate feature with its own state.
 *
 * Shared across both views:
 *  - alerts (🔔)      — global, from useBossAlerts (mounted in App.jsx)
 *  - collections (⭐)  — per (name, location) identity, persisted via
 *                        bossTimerStorage favoriteLists. Previously
 *                        Countdown-only; now also available from Timeline.
 *  - completions (✓)  — per (name, location) per UTC calendar day, persisted
 *                        via bossTimerStorage completions. Previously
 *                        Timeline-only; now also markable from Countdown.
 *  - Areas filter      — previously Countdown-only; Timeline never filtered
 *                        by area before. Both now respect the same selection.
 *
 * EventTimelineTab.jsx is no longer used anywhere and can be deleted.
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  getUpcomingRowSeries, getUpcomingOccurrencesFor, getAllPossibleExpansions,
  formatCountdown, urgencyColor, ALERT_LEAD_OPTIONS_MIN,
} from "../lib/bossTimerCalc.js";
import {
  bossKey, loadFavoriteLists, saveFavoriteLists, nextDefaultFavoriteListName,
  loadCompletions, saveCompletions,
} from "../lib/bossTimerStorage.js";
import { EXPANSION_ACCENT_COLORS, EXPANSION_ACCENT_FALLBACK, expansionSortKey } from "../lib/worldBossScheduleData.js";
import { InteractivePopover } from "../components/InteractivePopover.jsx";

const CYCLES_AHEAD = 6;
const TICK_MS = 1000;

// ── Timeline-view constants (carried over from the old EventTimelineTab) ──
const INTERVAL_MIN = 15;
const INTERVAL_MS = INTERVAL_MIN * 60_000;
const HOURS_AHEAD = 3;
const SLOT_COUNT = (HOURS_AHEAD * 60) / INTERVAL_MIN + 1;
const COL_WIDTH = 150;
const ROW_LABEL_WIDTH = 150;
const FETCH_CYCLES = 8; // generous buffer, filtered down to the visible window

const URGENCY_STYLE = {
  default: { color: "var(--text2)" },
  yellow: { color: "var(--gold2)", fontWeight: 600 },
  red: { color: "var(--red2,#e05555)", fontWeight: 700 },
};

function snapToLocalInterval(nowMs, intervalMin) {
  const d = new Date(nowMs);
  const snapped = Math.floor(d.getMinutes() / intervalMin) * intervalMin;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), snapped, 0, 0).getTime();
}
function currentPeriod(nowMs) {
  return new Date(nowMs).toISOString().slice(0, 10); // UTC calendar day
}

// ── Shared alert/collection popovers — identical content in both views ──
function AlertPopover({ anchorRef, open, onClose, occ, alerts, setAlertLead, keyPrefix }) {
  const key = bossKey(occ.name, occ.location);
  const leadMinutes = alerts[key];
  return (
    <InteractivePopover anchorRef={anchorRef} open={open} onClose={onClose}>
      <div className="bt-pop-lbl">ALERT ME</div>
      {ALERT_LEAD_OPTIONS_MIN.map(min => (
        <label key={min} className="bt-pop-row">
          <input type="radio" name={`${keyPrefix}-${key}`} checked={leadMinutes === min}
            onChange={() => setAlertLead(occ.name, occ.location, min)} />
          {min} minutes before
        </label>
      ))}
      <label className="bt-pop-row">
        <input type="radio" name={`${keyPrefix}-${key}`} checked={!leadMinutes} onChange={() => setAlertLead(occ.name, occ.location, null)} />
        Off
      </label>
    </InteractivePopover>
  );
}

function CollectionPopover({ anchorRef, open, onClose, occ, collections, onToggleMember, onCreateCollection }) {
  const [newListName, setNewListName] = useState("");
  const memberListIds = collections.filter(l => l.members.some(m => m.name === occ.name && m.location === occ.location)).map(l => l.id);
  return (
    <InteractivePopover anchorRef={anchorRef} open={open} onClose={onClose} minWidth={220}>
      <div className="bt-pop-lbl">SAVE TO COLLECTION</div>
      {collections.length === 0 && <div className="bt-pop-empty">No collections yet.</div>}
      {collections.map(list => (
        <label key={list.id} className="bt-pop-row">
          <input type="checkbox" checked={memberListIds.includes(list.id)}
            onChange={e => onToggleMember(list.id, occ.name, occ.location, e.target.checked)} />
          {list.name}
        </label>
      ))}
      <div className="bt-pop-newlist">
        <input className="si" style={{ width: 130, fontSize: 12 }} placeholder="New collection…" value={newListName}
          onChange={e => setNewListName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && newListName.trim()) { onCreateCollection(newListName.trim(), occ.name, occ.location); setNewListName(""); } }} />
        <button className="rbtn" style={{ fontSize: 11 }} onClick={() => {
          const name = newListName.trim();
          if (!name) return;
          onCreateCollection(name, occ.name, occ.location);
          setNewListName("");
        }}>+ Add</button>
      </div>
    </InteractivePopover>
  );
}

// ── Countdown view: one occurrence line ──
function CountdownLine({ occ, now, alerts, setAlertLead, collections, onToggleMember, onCreateCollection, completions, currentPeriodStr, onToggleComplete }) {
  const msUntil = occ.spawnMs - now;
  const urgency = urgencyColor(msUntil);
  const key = bossKey(occ.name, occ.location);
  const leadMinutes = alerts[key];
  const localTime = new Date(occ.spawnMs).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const done = completions[key]?.period === currentPeriodStr;

  const bellRef = useRef(null);
  const starRef = useRef(null);
  const [bellOpen, setBellOpen] = useState(false);
  const [starOpen, setStarOpen] = useState(false);

  const memberListIds = collections.filter(l => l.members.some(m => m.name === occ.name && m.location === occ.location)).map(l => l.id);
  const isFavorited = memberListIds.length > 0;

  return (
    <div className="bt-occ" style={{ opacity: done ? 0.6 : 1 }}>
      <div className="bt-occ-top">
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <input type="checkbox" checked={done} title={done ? "Marked done for today" : "Mark done for today"}
            onChange={() => onToggleComplete(occ.name, occ.location)} style={{ cursor: "pointer", flexShrink: 0 }} />
          <span className="bt-occ-name" title={occ.location} style={{ textDecoration: done ? "line-through" : "none", flex: 1, minWidth: 0 }}>{occ.name}</span>
        </div>
        <div className="bt-occ-actions">
          <button ref={bellRef} className={`bt-icon-btn${leadMinutes ? " on" : ""}`}
            title={leadMinutes ? `Alerting ${leadMinutes} min before` : "Set an alert"}
            onClick={() => { setBellOpen(o => !o); setStarOpen(false); }}>🔔</button>
          <button ref={starRef} className={`bt-icon-btn${isFavorited ? " on" : ""}`} title="Save to a collection"
            onClick={() => { setStarOpen(o => !o); setBellOpen(false); }}>⭐</button>
        </div>
      </div>
      <div className="bt-occ-time">
        <span style={URGENCY_STYLE[urgency]}>{formatCountdown(msUntil)}</span>
        <span className="bt-occ-local">{localTime}</span>
      </div>

      <AlertPopover anchorRef={bellRef} open={bellOpen} onClose={() => setBellOpen(false)} occ={occ} alerts={alerts} setAlertLead={setAlertLead} keyPrefix="cd-lead" />
      <CollectionPopover anchorRef={starRef} open={starOpen} onClose={() => setStarOpen(false)} occ={occ} collections={collections} onToggleMember={onToggleMember} onCreateCollection={onCreateCollection} />
    </div>
  );
}

function SlotCell({ slot, ...rest }) {
  return (
    <div className="bt-cell">
      {slot.occurrences.map((occ, i) => (
        <React.Fragment key={`${occ.name}|${occ.location}`}>
          {i > 0 && <div className="bt-cell-divider" />}
          <CountdownLine occ={occ} {...rest} />
        </React.Fragment>
      ))}
    </div>
  );
}

function Row({ row, ...rest }) {
  return (
    <div className="bt-row">
      <div className="bt-row-label">{row.rowLabel}</div>
      <div className="bt-row-scroll">
        {row.slots.map((slot, i) => <SlotCell key={i} slot={slot} {...rest} />)}
      </div>
    </div>
  );
}

function CountdownSection({ expansion, rows, collapsed, onToggle, ...rest }) {
  const accent = EXPANSION_ACCENT_COLORS[expansion] || EXPANSION_ACCENT_FALLBACK;
  return (
    <div className="ci" style={{ marginBottom: 10 }}>
      <div className="ci-hdr" onClick={onToggle} style={{ cursor: "pointer" }}>
        <span style={{ color: "var(--text3)", fontSize: 12 }}>{collapsed ? "▶" : "▼"}</span>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: accent, flexShrink: 0 }} />
        <span className="ci-name" style={{ flex: "unset" }}>{expansion}</span>
      </div>
      {!collapsed && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "10px 20px 6px", background: "var(--bg2)" }}>
          {rows.map(row => <Row key={row.rowLabel} row={row} {...rest} />)}
        </div>
      )}
    </div>
  );
}

// ── Timeline view: one occurrence line inside a Gantt block ──
function TimelineOccLine({ occ, alerts, setAlertLead, collections, onToggleMember, onCreateCollection, completions, currentPeriodStr, onToggleComplete }) {
  const key = bossKey(occ.name, occ.location);
  const done = completions[key]?.period === currentPeriodStr;
  const leadMinutes = alerts[key];
  const memberListIds = collections.filter(l => l.members.some(m => m.name === occ.name && m.location === occ.location)).map(l => l.id);
  const isFavorited = memberListIds.length > 0;

  const bellRef = useRef(null);
  const starRef = useRef(null);
  const [bellOpen, setBellOpen] = useState(false);
  const [starOpen, setStarOpen] = useState(false);

  return (
    <div className="tl-occ-line" style={{ opacity: done ? 0.55 : 1 }}>
      <input type="checkbox" checked={done} title={done ? "Marked done for today" : "Mark done for today"}
        onChange={() => onToggleComplete(occ.name, occ.location)} style={{ cursor: "pointer", flexShrink: 0 }} />
      <span className="tl-occ-name" onClick={() => onToggleComplete(occ.name, occ.location)}
        style={{ textDecoration: done ? "line-through" : "none", cursor: "pointer" }}>{occ.name}</span>
      <div style={{ display: "flex", gap: 2, marginLeft: "auto", flexShrink: 0 }}>
        <button ref={bellRef} className={`bt-icon-btn${leadMinutes ? " on" : ""}`} style={{ fontSize: 11 }}
          title={leadMinutes ? `Alerting ${leadMinutes} min before` : "Set an alert"}
          onClick={e => { e.stopPropagation(); setBellOpen(o => !o); setStarOpen(false); }}>🔔</button>
        <button ref={starRef} className={`bt-icon-btn${isFavorited ? " on" : ""}`} style={{ fontSize: 11 }} title="Save to a collection"
          onClick={e => { e.stopPropagation(); setStarOpen(o => !o); setBellOpen(false); }}>⭐</button>
      </div>

      <AlertPopover anchorRef={bellRef} open={bellOpen} onClose={() => setBellOpen(false)} occ={occ} alerts={alerts} setAlertLead={setAlertLead} keyPrefix="tl-lead" />
      <CollectionPopover anchorRef={starRef} open={starOpen} onClose={() => setStarOpen(false)} occ={occ} collections={collections} onToggleMember={onToggleMember} onCreateCollection={onCreateCollection} />
    </div>
  );
}

function TimelineRow({ row, origin, windowEnd, ...rest }) {
  const slots = row.slots.filter(s => s.time >= origin && s.time < windowEnd);
  const maxStack = slots.reduce((m, s) => Math.max(m, s.occurrences.length), 1);
  const rowHeight = Math.max(48, maxStack * 26 + 14);

  return (
    <div className="tl-row" style={{ height: rowHeight }}>
      <div className="tl-row-label">{row.rowLabel}</div>
      <div className="tl-track">
        {slots.map((slot, i) => {
          const left = ((slot.time - origin) / INTERVAL_MS) * COL_WIDTH;
          return (
            <div key={i} className="tl-block" style={{ left, width: COL_WIDTH - 4 }}>
              {slot.occurrences.map((occ, j) => <TimelineOccLine key={j} occ={occ} {...rest} />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineSection({ expansion, rows, origin, windowEnd, nowLineLeft, collapsed, onToggleCollapse, ...rest }) {
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
            <TimelineRow key={row.rowLabel} row={row} origin={origin} windowEnd={windowEnd} {...rest} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BossTimersTab({ bossAlerts }) {
  const { alerts, setAlertLead, soundSettings, setSoundSettings } = bossAlerts;
  const [now, setNow] = useState(Date.now());
  const [collections, setCollections] = useState([]);
  const [completions, setCompletions] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [viewMode, setViewMode] = useState("countdown"); // "countdown" | "timeline"
  const [activeTabId, setActiveTabId] = useState(null); // null = "All" — shared by both views
  const [collapsedExpansions, setCollapsedExpansions] = useState(() => new Set());
  const [selectedAreas, setSelectedAreas] = useState(null); // null = every area selected
  const [areasOpen, setAreasOpen] = useState(false);
  const [soundOpen, setSoundOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const areasBtnRef = useRef(null);
  const soundBtnRef = useRef(null);
  const viewBtnRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadFavoriteLists(), loadCompletions()])
      .then(([lists, comps]) => { if (!cancelled) { setCollections(lists); setCompletions(comps); setLoaded(true); } })
      .catch(() => setLoaded(true));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(t);
  }, []);

  const allExpansions = useMemo(() => getAllPossibleExpansions(), []);
  const effectiveSelectedAreas = selectedAreas || new Set(allExpansions);

  const persistCollections = useCallback((next) => {
    setCollections(next);
    saveFavoriteLists(next);
  }, []);

  const handleToggleMember = useCallback((listId, name, location, isMember) => {
    persistCollections(collections.map(list => {
      if (list.id !== listId) return list;
      const already = list.members.some(m => m.name === name && m.location === location);
      if (isMember && !already) return { ...list, members: [...list.members, { name, location }] };
      if (!isMember) return { ...list, members: list.members.filter(m => !(m.name === name && m.location === location)) };
      return list;
    }));
  }, [collections, persistCollections]);

  const handleCreateCollection = useCallback((name, bossName, location) => {
    const id = collections.reduce((max, l) => Math.max(max, l.id), 0) + 1;
    persistCollections([...collections, { id, name, members: [{ name: bossName, location }] }]);
  }, [collections, persistCollections]);

  const handleAddBlankCollection = useCallback(() => {
    const id = collections.reduce((max, l) => Math.max(max, l.id), 0) + 1;
    const name = nextDefaultFavoriteListName(collections);
    persistCollections([...collections, { id, name, members: [] }]);
    setActiveTabId(id);
  }, [collections, persistCollections]);

  const handleDeleteCollection = useCallback((id) => {
    persistCollections(collections.filter(l => l.id !== id));
    setActiveTabId(prev => (prev === id ? null : prev));
  }, [collections, persistCollections]);

  // Completion is per (name, location) per UTC calendar day — marking any one
  // occurrence of a boss done marks it done for every occurrence of that same
  // boss that day, in both views (matches the original Event Timeline semantics).
  const currentPeriodStr = useMemo(() => currentPeriod(now), [now]);
  const handleToggleComplete = useCallback((name, location) => {
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

  const cellProps = {
    now, alerts, setAlertLead, collections, onToggleMember: handleToggleMember, onCreateCollection: handleCreateCollection,
    completions, currentPeriodStr, onToggleComplete: handleToggleComplete,
  };

  // ── Countdown view data ──
  const allRows = useMemo(() => getUpcomingRowSeries(now, CYCLES_AHEAD), [now]);
  const sectionsByExpansion = useMemo(() => {
    const map = new Map();
    for (const row of allRows) {
      if (!effectiveSelectedAreas.has(row.expansion)) continue;
      if (!map.has(row.expansion)) map.set(row.expansion, []);
      map.get(row.expansion).push(row);
    }
    return [...map.entries()].sort((a, b) => expansionSortKey(a[0]) - expansionSortKey(b[0]));
  }, [allRows, effectiveSelectedAreas]);

  const activeList = collections.find(l => l.id === activeTabId);
  const collectionSlots = useMemo(() => (
    activeList ? getUpcomingOccurrencesFor(activeList.members, now, CYCLES_AHEAD) : []
  ), [activeList, now]);

  // ── Timeline view data ──
  const origin = useMemo(() => snapToLocalInterval(now, INTERVAL_MIN), [now]);
  const windowEnd = origin + SLOT_COUNT * INTERVAL_MS;
  const nowLineLeft = ((now - origin) / INTERVAL_MS) * COL_WIDTH;

  const timelineAllRows = useMemo(() => getUpcomingRowSeries(origin, FETCH_CYCLES), [origin]);
  const timelineSectionsByExpansion = useMemo(() => {
    const map = new Map();
    for (const row of timelineAllRows) {
      if (!effectiveSelectedAreas.has(row.expansion)) continue;
      const hasVisibleSlot = row.slots.some(s => s.time >= origin && s.time < windowEnd);
      if (!hasVisibleSlot) continue;
      if (!map.has(row.expansion)) map.set(row.expansion, []);
      map.get(row.expansion).push(row);
    }
    return [...map.entries()].sort((a, b) => expansionSortKey(a[0]) - expansionSortKey(b[0]));
  }, [timelineAllRows, origin, windowEnd, effectiveSelectedAreas]);

  const timelineCollectionSlots = useMemo(() => (
    activeList
      ? getUpcomingOccurrencesFor(activeList.members, origin, FETCH_CYCLES).filter(s => s.time >= origin && s.time < windowEnd)
      : []
  ), [activeList, origin, windowEnd]);

  if (!loaded) return <div className="empty">Loading boss timers…</div>;

  const headerCols = viewMode === "timeline" ? Array.from({ length: SLOT_COUNT }, (_, i) => {
    const t = origin + i * INTERVAL_MS;
    return new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }) : null;

  return (
    <div>
      <div className="ctrl">
        <button ref={areasBtnRef} className="rbtn" onClick={() => setAreasOpen(o => !o)}>
          Areas ({effectiveSelectedAreas.size}/{allExpansions.length}) ▾
        </button>
        <button ref={soundBtnRef} className="rbtn" onClick={() => setSoundOpen(o => !o)}>🔊 Sound ▾</button>
        <button ref={viewBtnRef} className="rbtn" onClick={() => setViewOpen(o => !o)}>
          👁 View: {viewMode === "countdown" ? "Countdown" : "Timeline"} ▾
        </button>
        <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
          ✓ marks done for today · 🔔 sets an alert · ⭐ saves to a collection
        </div>
      </div>

      <InteractivePopover anchorRef={areasBtnRef} open={areasOpen} onClose={() => setAreasOpen(false)} minWidth={200}>
        <div className="bt-pop-lbl">AREAS</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 11 }}>
          <span style={{ color: "var(--gold2)", cursor: "pointer" }} onClick={() => setSelectedAreas(new Set(allExpansions))}>All</span>
          <span style={{ color: "var(--text3)" }}>·</span>
          <span style={{ color: "var(--gold2)", cursor: "pointer" }} onClick={() => setSelectedAreas(new Set())}>None</span>
        </div>
        {allExpansions.map(exp => (
          <label key={exp} className="bt-pop-row">
            <input type="checkbox" checked={effectiveSelectedAreas.has(exp)} onChange={e => {
              const next = new Set(effectiveSelectedAreas);
              if (e.target.checked) next.add(exp); else next.delete(exp);
              setSelectedAreas(next);
            }} />
            {exp}
          </label>
        ))}
      </InteractivePopover>

      <InteractivePopover anchorRef={soundBtnRef} open={soundOpen} onClose={() => setSoundOpen(false)} minWidth={190}>
        <div className="bt-pop-lbl">ALERT SOUND</div>
        {[["beep", "Beep"], ["tts", "Text-to-Speech"], ["custom", "Custom Sound"]].map(([mode, label]) => (
          <label key={mode} className="bt-pop-row">
            <input type="radio" name="sound-mode" checked={soundSettings.mode === mode}
              onChange={() => setSoundSettings({ ...soundSettings, mode })} />
            {label}
          </label>
        ))}
        {soundSettings.mode === "custom" && (
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6, paddingTop: 6, borderTop: "1px solid var(--border)", lineHeight: 1.5, maxWidth: 180 }}>
            Set the sound file in <strong style={{ color: "var(--text2)" }}>Settings → Alert Sound</strong>.
          </div>
        )}
      </InteractivePopover>

      <InteractivePopover anchorRef={viewBtnRef} open={viewOpen} onClose={() => setViewOpen(false)} minWidth={170}>
        <div className="bt-pop-lbl">VIEW</div>
        <label className="bt-pop-row">
          <input type="radio" name="view-mode" checked={viewMode === "countdown"} onChange={() => { setViewMode("countdown"); setViewOpen(false); }} />
          ⏱ Countdown
        </label>
        <label className="bt-pop-row">
          <input type="radio" name="view-mode" checked={viewMode === "timeline"} onChange={() => { setViewMode("timeline"); setViewOpen(false); }} />
          📅 Timeline
        </label>
      </InteractivePopover>

      <div className="disc-tabs">
        <button className={`dtab${activeTabId === null ? " on" : ""}`} onClick={() => setActiveTabId(null)}>All</button>
        {collections.map(list => (
          <button key={list.id} className={`dtab${activeTabId === list.id ? " on" : ""}`}
            onClick={() => setActiveTabId(list.id)}
            onDoubleClick={() => {
              const name = window.prompt("Rename collection:", list.name);
              if (name && name.trim()) persistCollections(collections.map(l => (l.id === list.id ? { ...l, name: name.trim() } : l)));
            }}>
            {list.name}
            <span className="dtab-ct" title="Delete collection"
              onClick={e => { e.stopPropagation(); if (window.confirm(`Delete "${list.name}"?`)) handleDeleteCollection(list.id); }}>✕</span>
          </button>
        ))}
        <button className="dtab" onClick={handleAddBlankCollection} title="New collection">+</button>
      </div>

      {viewMode === "countdown" ? (
        activeTabId === null ? (
          sectionsByExpansion.length === 0
            ? <div className="empty">No areas selected.</div>
            : sectionsByExpansion.map(([expansion, rows]) => (
              <CountdownSection key={expansion} expansion={expansion} rows={rows}
                collapsed={collapsedExpansions.has(expansion)}
                onToggle={() => setCollapsedExpansions(prev => {
                  const next = new Set(prev);
                  if (next.has(expansion)) next.delete(expansion); else next.add(expansion);
                  return next;
                })}
                {...cellProps} />
            ))
        ) : (
          <div className="ci" style={{ marginBottom: 10 }}>
            <div style={{ padding: "12px 20px 6px" }}>
              {collectionSlots.length === 0
                ? <div className="empty">Nothing in this collection yet — click ⭐ on any timer to add one.</div>
                : <div className="bt-row"><div className="bt-row-scroll">
                    {collectionSlots.map((slot, i) => <SlotCell key={i} slot={slot} {...cellProps} />)}
                  </div></div>}
            </div>
          </div>
        )
      ) : (
        <>
          <div style={{ display: "flex", marginBottom: 8, paddingLeft: ROW_LABEL_WIDTH, position: "relative" }}>
            {headerCols.map((label, i) => (
              <div key={i} style={{ width: COL_WIDTH, flexShrink: 0, fontSize: 11, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 1, textAlign: "center" }}>
                {label}
              </div>
            ))}
          </div>

          {activeTabId === null ? (
            timelineSectionsByExpansion.length === 0
              ? <div className="empty">Nothing scheduled in the next {HOURS_AHEAD} hours for the selected areas.</div>
              : timelineSectionsByExpansion.map(([expansion, rows]) => (
                <TimelineSection key={expansion} expansion={expansion} rows={rows} origin={origin} windowEnd={windowEnd}
                  nowLineLeft={nowLineLeft + ROW_LABEL_WIDTH} collapsed={collapsedExpansions.has(expansion)}
                  onToggleCollapse={() => setCollapsedExpansions(prev => {
                    const next = new Set(prev);
                    if (next.has(expansion)) next.delete(expansion); else next.add(expansion);
                    return next;
                  })}
                  {...cellProps} />
              ))
          ) : (
            <div className="ci" style={{ marginBottom: 10 }}>
              <div style={{ position: "relative", padding: "6px 0", background: "var(--bg2)", overflowX: "auto" }}>
                <div className="tl-nowline" style={{ left: nowLineLeft + ROW_LABEL_WIDTH }} />
                {timelineCollectionSlots.length === 0
                  ? <div className="empty">Nothing in this collection is scheduled in the next {HOURS_AHEAD} hours.</div>
                  : <TimelineRow row={{ rowLabel: activeList.name, slots: timelineCollectionSlots }} origin={origin} windowEnd={windowEnd} {...cellProps} />}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
