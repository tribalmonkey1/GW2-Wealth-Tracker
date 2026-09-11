/**
 * Boss Timers — combined Countdown + Timeline view for World Bosses, Hardcore
 * Meta bosses, Invasions, and zone meta events.
 *
 * A "View" control next to Areas/Sound swaps between the countdown-grid
 * presentation and the Gantt-strip timeline presentation of the SAME
 * underlying schedule data. Areas, Sound, and View are all persisted (via
 * bossTimerStorage) so they survive switching away to another tab and back —
 * previously only Sound was remembered.
 *
 * Identity for alerts (🔔), collections (⭐), and completions (✓) is the
 * event NAME alone, not name+location — some events (Ley-Line Anomaly being
 * the clearest example) are mechanically the same event rotating through
 * several zones, so setting an alert or saving to a collection from any one
 * zone's occurrence now applies to every zone that event appears in, and all
 * of them show the same bell/star/checkbox state. See bossTimerCalc's
 * getNextOccurrenceForName / getUpcomingOccurrencesFor and
 * bossTimerStorage's bossKey for where this lives.
 *
 * Completion (✓) is auto-detected for the 13 Core Tyria world bosses that
 * GW2's `/v2/account/worldbosses` endpoint tracks (the ones with a Hero's
 * Choice Chest) — see worldBossApiIds.js for exactly which ones and why the
 * rest of the schedule (meta events, Ley-Line Anomaly, HoT/PoF/EoD/SotO
 * metas, etc.) has no API-exposed completion signal and stays manual-only.
 *
 * Timeline blocks are laid out with simple greedy lane-packing: two blocks
 * that would visually overlap (their real spawn times are close together,
 * not aligned to the 15-minute column grid) get pushed into separate lanes
 * instead of drawing on top of each other. This doesn't need event duration/
 * end-time data — GW2's API doesn't expose that anyway — it just treats each
 * block's fixed on-screen width as the thing that must not collide.
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  getUpcomingRowSeries, getUpcomingOccurrencesFor, getAllPossibleExpansions,
  formatCountdown, urgencyColor, ALERT_LEAD_OPTIONS_MIN,
} from "../lib/bossTimerCalc.js";
import {
  bossKey, loadFavoriteLists, saveFavoriteLists, nextDefaultFavoriteListName,
  loadCompletions, saveCompletions, migrateLocationKeyedMap,
  loadAreasSelection, saveAreasSelection, loadViewMode, saveViewMode,
} from "../lib/bossTimerStorage.js";
import { EXPANSION_ACCENT_COLORS, EXPANSION_ACCENT_FALLBACK, expansionSortKey } from "../lib/worldBossScheduleData.js";
import { WORLD_BOSS_API_ID_TO_NAME } from "../lib/worldBossApiIds.js";
import { apiFetch, BASE } from "../lib/gw2Api.js";
import { InteractivePopover } from "../components/InteractivePopover.jsx";

const CYCLES_AHEAD = 6;
const TICK_MS = 1000;
const WORLD_BOSS_POLL_MS = 2 * 60_000; // /v2/account/worldbosses only changes on kill or daily reset — no need to hammer it

// ── Timeline-view constants ──
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

// Greedy interval-scheduling lane packing: sort by horizontal start position,
// place each block in the first lane whose last-placed block doesn't
// horizontally overlap it, otherwise open a new lane. `items` must already
// carry numeric `left`/`width` in pixels; returns the same items with a
// `lane` index added.
function assignLanes(items) {
  const sorted = [...items].sort((a, b) => a.left - b.left);
  const laneEnds = []; // right edge (px) of the last block placed in each lane
  const placed = [];
  for (const item of sorted) {
    let lane = laneEnds.findIndex(end => item.left >= end);
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(0); }
    laneEnds[lane] = item.left + item.width;
    placed.push({ ...item, lane });
  }
  return placed;
}

// ── Shared alert/collection popovers — identical content in both views ──
function AlertPopover({ anchorRef, open, onClose, occ, alerts, setAlertLead, keyPrefix }) {
  const key = bossKey(occ.name);
  const leadMinutes = alerts[key];
  return (
    <InteractivePopover anchorRef={anchorRef} open={open} onClose={onClose}>
      <div className="bt-pop-lbl">ALERT ME</div>
      {ALERT_LEAD_OPTIONS_MIN.map(min => (
        <label key={min} className="bt-pop-row">
          <input type="radio" name={`${keyPrefix}-${key}`} checked={leadMinutes === min}
            onChange={() => setAlertLead(occ.name, min)} />
          {min} minutes before
        </label>
      ))}
      <label className="bt-pop-row">
        <input type="radio" name={`${keyPrefix}-${key}`} checked={!leadMinutes} onChange={() => setAlertLead(occ.name, null)} />
        Off
      </label>
    </InteractivePopover>
  );
}

function CollectionPopover({ anchorRef, open, onClose, occ, collections, onToggleMember, onCreateCollection }) {
  const [newListName, setNewListName] = useState("");
  const memberListIds = collections.filter(l => l.members.some(m => m.name === occ.name)).map(l => l.id);
  return (
    <InteractivePopover anchorRef={anchorRef} open={open} onClose={onClose} minWidth={220}>
      <div className="bt-pop-lbl">SAVE TO COLLECTION</div>
      {collections.length === 0 && <div className="bt-pop-empty">No collections yet.</div>}
      {collections.map(list => (
        <label key={list.id} className="bt-pop-row">
          <input type="checkbox" checked={memberListIds.includes(list.id)}
            onChange={e => onToggleMember(list.id, occ.name, e.target.checked)} />
          {list.name}
        </label>
      ))}
      <div className="bt-pop-newlist">
        <input className="si" style={{ width: 130, fontSize: 12 }} placeholder="New collection…" value={newListName}
          onChange={e => setNewListName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && newListName.trim()) { onCreateCollection(newListName.trim(), occ.name); setNewListName(""); } }} />
        <button className="rbtn" style={{ fontSize: 11 }} onClick={() => {
          const name = newListName.trim();
          if (!name) return;
          onCreateCollection(name, occ.name);
          setNewListName("");
        }}>+ Add</button>
      </div>
    </InteractivePopover>
  );
}

function AutoTrackedBadge({ name }) {
  if (!WORLD_BOSS_API_ID_TO_NAME[name]) return null;
  return <span title="Marked done automatically once GW2's API reports this boss killed for the day" style={{ fontSize: 9, opacity: .6, flexShrink: 0 }}>🔗</span>;
}

// ── Countdown view: one occurrence line ──
function CountdownLine({ occ, now, alerts, setAlertLead, collections, onToggleMember, onCreateCollection, completions, currentPeriodStr, onToggleComplete }) {
  const msUntil = occ.spawnMs - now;
  const urgency = urgencyColor(msUntil);
  const key = bossKey(occ.name);
  const leadMinutes = alerts[key];
  const localTime = new Date(occ.spawnMs).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const done = completions[key]?.period === currentPeriodStr;

  const bellRef = useRef(null);
  const starRef = useRef(null);
  const [bellOpen, setBellOpen] = useState(false);
  const [starOpen, setStarOpen] = useState(false);

  const memberListIds = collections.filter(l => l.members.some(m => m.name === occ.name)).map(l => l.id);
  const isFavorited = memberListIds.length > 0;

  return (
    <div className="bt-occ" style={{ opacity: done ? 0.6 : 1 }}>
      <div className="bt-occ-top">
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <input type="checkbox" checked={done} title={done ? "Marked done for today" : "Mark done for today"}
            onChange={() => onToggleComplete(occ.name)} style={{ cursor: "pointer", flexShrink: 0 }} />
          <span className="bt-occ-name" title={occ.location} style={{ textDecoration: done ? "line-through" : "none", flex: 1, minWidth: 0 }}>{occ.name}</span>
          <AutoTrackedBadge name={occ.name} />
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
  const key = bossKey(occ.name);
  const done = completions[key]?.period === currentPeriodStr;
  const leadMinutes = alerts[key];
  const memberListIds = collections.filter(l => l.members.some(m => m.name === occ.name)).map(l => l.id);
  const isFavorited = memberListIds.length > 0;

  const bellRef = useRef(null);
  const starRef = useRef(null);
  const [bellOpen, setBellOpen] = useState(false);
  const [starOpen, setStarOpen] = useState(false);

  return (
    <div className="tl-occ-line" style={{ opacity: done ? 0.55 : 1 }}>
      <input type="checkbox" checked={done} title={done ? "Marked done for today" : "Mark done for today"}
        onChange={() => onToggleComplete(occ.name)} style={{ cursor: "pointer", flexShrink: 0 }} />
      <span className="tl-occ-name" onClick={() => onToggleComplete(occ.name)}
        style={{ textDecoration: done ? "line-through" : "none", cursor: "pointer" }}>{occ.name}</span>
      <AutoTrackedBadge name={occ.name} />
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
  const blockWidth = COL_WIDTH - 4;
  const rawSlots = row.slots.filter(s => s.time >= origin && s.time < windowEnd);
  const positioned = rawSlots.map(s => ({
    ...s,
    left: ((s.time - origin) / INTERVAL_MS) * COL_WIDTH,
    width: blockWidth,
  }));
  // Real spawn times aren't aligned to the 15-minute column grid, so two
  // blocks close together in time can visually overlap even though they're
  // in "different columns" — push colliding blocks into separate lanes
  // instead of letting them draw on top of each other.
  const laned = assignLanes(positioned);
  const numLanes = laned.reduce((m, s) => Math.max(m, s.lane + 1), 1);
  const maxStack = laned.reduce((m, s) => Math.max(m, s.occurrences.length), 1);
  const laneHeight = Math.max(30, maxStack * 26 + 14);
  const rowHeight = numLanes * laneHeight;

  return (
    <div className="tl-row" style={{ height: rowHeight }}>
      <div className="tl-row-label">{row.rowLabel}</div>
      <div className="tl-track">
        {laned.map((slot, i) => (
          <div key={i} className="tl-block" style={{ left: slot.left, top: slot.lane * laneHeight + 6, width: slot.width }}>
            {slot.occurrences.map((occ, j) => <TimelineOccLine key={j} occ={occ} {...rest} />)}
          </div>
        ))}
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
  const [newCollectionOpen, setNewCollectionOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const areasBtnRef = useRef(null);
  const soundBtnRef = useRef(null);
  const viewBtnRef = useRef(null);
  const newCollectionBtnRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadFavoriteLists(), loadCompletions(), loadAreasSelection(), loadViewMode()])
      .then(([lists, comps, areas, view]) => {
        if (cancelled) return;
        setCollections(lists);
        setCompletions(migrateLocationKeyedMap(comps)); // pre-name-grouping saves used "name|location" keys
        if (areas) setSelectedAreas(new Set(areas));
        if (view) setViewMode(view);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(t);
  }, []);

  // ── GW2 API auto-completion for the 13 world bosses that expose it ──
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      let killed;
      try { killed = await apiFetch(`${BASE}/account/worldbosses`); } catch { return; }
      if (cancelled || !Array.isArray(killed) || killed.length === 0) return;
      const killedNames = killed.map(id => WORLD_BOSS_API_ID_TO_NAME[id]).filter(Boolean);
      if (killedNames.length === 0) return;
      setCompletions(prev => {
        const period = currentPeriod(Date.now());
        let changed = false;
        const next = { ...prev };
        for (const name of killedNames) {
          if (next[name]?.period !== period) { next[name] = { period, auto: true }; changed = true; }
        }
        if (!changed) return prev;
        saveCompletions(next);
        return next;
      });
    };
    poll();
    const t = setInterval(poll, WORLD_BOSS_POLL_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const allExpansions = useMemo(() => getAllPossibleExpansions(), []);
  const effectiveSelectedAreas = selectedAreas || new Set(allExpansions);

  const handleSetSelectedAreas = useCallback((next) => {
    setSelectedAreas(next);
    saveAreasSelection([...next]);
  }, []);

  const handleSetViewMode = useCallback((mode) => {
    setViewMode(mode);
    saveViewMode(mode);
  }, []);

  const persistCollections = useCallback((next) => {
    setCollections(next);
    saveFavoriteLists(next);
  }, []);

  const handleToggleMember = useCallback((listId, name, isMember) => {
    persistCollections(collections.map(list => {
      if (list.id !== listId) return list;
      const already = list.members.some(m => m.name === name);
      if (isMember && !already) return { ...list, members: [...list.members, { name }] };
      if (!isMember) return { ...list, members: list.members.filter(m => m.name !== name) };
      return list;
    }));
  }, [collections, persistCollections]);

  const handleCreateCollection = useCallback((name, bossName) => {
    const id = collections.reduce((max, l) => Math.max(max, l.id), 0) + 1;
    persistCollections([...collections, { id, name, members: [{ name: bossName }] }]);
  }, [collections, persistCollections]);

  // "+" next to All — name the collection right away (like the star's
  // "New collection…" mini-form) instead of silently creating
  // "Favorite List N" and requiring a double-click rename afterward.
  const handleCreateNamedCollection = useCallback((name) => {
    const finalName = name.trim() || nextDefaultFavoriteListName(collections);
    const id = collections.reduce((max, l) => Math.max(max, l.id), 0) + 1;
    persistCollections([...collections, { id, name: finalName, members: [] }]);
    setActiveTabId(id);
  }, [collections, persistCollections]);

  const handleDeleteCollection = useCallback((id) => {
    persistCollections(collections.filter(l => l.id !== id));
    setActiveTabId(prev => (prev === id ? null : prev));
  }, [collections, persistCollections]);

  // Completion is per event name per UTC calendar day — marking any one
  // occurrence done marks it done for every zone that shares the name
  // (matches alerts/collections' name-only identity).
  const currentPeriodStr = useMemo(() => currentPeriod(now), [now]);
  const handleToggleComplete = useCallback((name) => {
    setCompletions(prev => {
      const key = bossKey(name);
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
          ✓ marks done for today · 🔔 sets an alert · ⭐ saves to a collection · 🔗 auto-tracked via API
        </div>
      </div>

      <InteractivePopover anchorRef={areasBtnRef} open={areasOpen} onClose={() => setAreasOpen(false)} minWidth={200}>
        <div className="bt-pop-lbl">AREAS</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 11 }}>
          <span style={{ color: "var(--gold2)", cursor: "pointer" }} onClick={() => handleSetSelectedAreas(new Set(allExpansions))}>All</span>
          <span style={{ color: "var(--text3)" }}>·</span>
          <span style={{ color: "var(--gold2)", cursor: "pointer" }} onClick={() => handleSetSelectedAreas(new Set())}>None</span>
        </div>
        {allExpansions.map(exp => (
          <label key={exp} className="bt-pop-row">
            <input type="checkbox" checked={effectiveSelectedAreas.has(exp)} onChange={e => {
              const next = new Set(effectiveSelectedAreas);
              if (e.target.checked) next.add(exp); else next.delete(exp);
              handleSetSelectedAreas(next);
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
          <input type="radio" name="view-mode" checked={viewMode === "countdown"} onChange={() => { handleSetViewMode("countdown"); setViewOpen(false); }} />
          ⏱ Countdown
        </label>
        <label className="bt-pop-row">
          <input type="radio" name="view-mode" checked={viewMode === "timeline"} onChange={() => { handleSetViewMode("timeline"); setViewOpen(false); }} />
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
        <button ref={newCollectionBtnRef} className="dtab" onClick={() => setNewCollectionOpen(o => !o)} title="New collection">+</button>
      </div>

      <InteractivePopover anchorRef={newCollectionBtnRef} open={newCollectionOpen} onClose={() => setNewCollectionOpen(false)} minWidth={210}>
        <div className="bt-pop-lbl">NEW COLLECTION</div>
        <div className="bt-pop-newlist">
          <input className="si" style={{ width: 140, fontSize: 12 }} placeholder="Collection name…" autoFocus value={newCollectionName}
            onChange={e => setNewCollectionName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { handleCreateNamedCollection(newCollectionName); setNewCollectionName(""); setNewCollectionOpen(false); } }} />
          <button className="rbtn" style={{ fontSize: 11 }} onClick={() => {
            handleCreateNamedCollection(newCollectionName);
            setNewCollectionName("");
            setNewCollectionOpen(false);
          }}>+ Create</button>
        </div>
      </InteractivePopover>

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
