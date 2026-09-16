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
 * Timeline blocks are sized proportionally to each event's real duration
 * (durationMin on the schedule entry — see worldBossScheduleData.js /
 * metaEventScheduleData.js — falling back to DEFAULT_DURATION_MIN for
 * anything not yet confirmed) rather than always taking up one fixed-width
 * column. A slot can stack multiple occurrences that start at the same
 * time; the block is sized to the LONGEST of those so every stacked line
 * fits inside it.
 *
 * Timeline blocks are laid out with simple greedy lane-packing: two blocks
 * that would visually overlap (their real spawn times are close together,
 * not aligned to the 15-minute column grid, or one simply runs long enough
 * to reach into the next block's start) get pushed into separate lanes
 * instead of drawing on top of each other.
 *
 * Vertical gridlines mark every 15-minute column boundary, both in the
 * header (so it's clear exactly where e.g. "3:00 PM" begins) and behind the
 * blocks in each zone's track.
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  getUpcomingRowSeries, getUpcomingOccurrencesFor, getAllPossibleExpansions,
  formatCountdown, urgencyColor, ALERT_LEAD_OPTIONS_MIN, DEFAULT_DURATION_MIN,
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
const COL_WIDTH = 200;
const ROW_LABEL_WIDTH = 150;
const FETCH_CYCLES = 8; // generous buffer, filtered down to the visible window
const MIN_BLOCK_WIDTH = 95; // floor so very short events (5-9 min) still fit their checkbox/name/icons legibly
// Single shared gap value used BOTH horizontally (the visual gap you see
// between two back-to-back blocks, carved out of block width below) and
// vertically (the gap between stacked lanes in TimelineRow) — so a
// back-to-back pair and a two-lane stack read as the same "resting" amount
// of space, per design intent.
const BLOCK_GAP_PX = 4;
// Deliberate inset applied to BOTH sides of every block, so a block never
// sits flush against its own start-time gridline. A block's own left/right
// margin should match what you see as "the gap" next to it, whether that
// neighbor is a bare gridline (isolated block) or another block. Two
// genuinely back-to-back blocks (no real time gap between them) show double
// this as their combined visual gap, since each contributes its own inset —
// kept independent of BLOCK_GAP_PX (rather than reusing it directly) so the
// two can be tuned separately now that they no longer need to match.
const BLOCK_INSET_PX = 3;
// Every timeline block now holds exactly one occurrence — same-start-time
// events get their own lane instead of being crammed into one box (see
// TimelineRow) — so a single fixed block height covers every lane. Matches
// the original single-occurrence sizing (before stacking existed).
const BLOCK_HEIGHT = 40;
// A block's actual rendered content (one line of text + its own padding)
// is shorter than the full lane slot it's allocated (BLOCK_HEIGHT) — without
// this, a block sits pinned to the top of its slot with all the leftover
// space below it instead of being centered. BLOCK_VERTICAL_INSET is applied
// symmetrically above and below so the visible box centers within its lane.
const BLOCK_VERTICAL_INSET = 5;
const TRACK_TOP_PADDING = 6;
// Fixed pixel width for the entire scrollable timeline content (labels +
// all visible time columns). Used to force ONE shared horizontal scrollbar
// for the whole timeline — header row and every expansion section's rows —
// instead of each section/zone scrolling independently. See the render
// branch below for how this is applied.
const TIMELINE_CONTENT_WIDTH = SLOT_COUNT * COL_WIDTH;
const TIMELINE_TOTAL_WIDTH = ROW_LABEL_WIDTH + TIMELINE_CONTENT_WIDTH;

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

// Renders the repeating vertical column-boundary lines behind a timeline
// track. `leftOffset` is where column 0 begins in the parent's coordinate
// space (matches whatever the nowline in that same parent uses).
function TimelineGridLines({ leftOffset, count = SLOT_COUNT }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="tl-gridline" style={{ left: leftOffset + i * COL_WIDTH }} />
      ))}
    </>
  );
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
        title={`${occ.name} · ${occ.durationMin || DEFAULT_DURATION_MIN} min`}
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
  const rawSlots = row.slots.filter(s => s.time >= origin && s.time < windowEnd);
  // Timeline wants every occurrence as its OWN separate block — even when
  // several start at the exact same minute — rather than crammed together
  // as multiple stacked lines inside one box. row.slots groups same-minute
  // occurrences together (that grouping is what the Countdown view's card
  // format wants), so flatten it back out here: each occurrence becomes its
  // own positioned item, and assignLanes naturally pushes same-start-time
  // occurrences into separate lanes — vertically shifted — since they fully
  // overlap in time, exactly like any other colliding pair already does.
  const positioned = rawSlots.flatMap(s => s.occurrences.map(occ => {
    const durationMin = occ.durationMin || DEFAULT_DURATION_MIN;
    const left = ((s.time - origin) / INTERVAL_MS) * COL_WIDTH + BLOCK_INSET_PX;
    // TRUE, time-accurate width — deliberately NOT floored to MIN_BLOCK_WIDTH
    // here. Lane assignment below must see real widths, or a short event
    // inflated past its actual duration looks like it overlaps whatever
    // comes right after it (even when it's genuinely back-to-back, like
    // Dragon's End's Preparations → Jade Maw), and gets wrongly split into
    // a separate lane. Legibility widening happens in a second pass below,
    // after lanes are already correctly assigned from true widths.
    const width = Math.max(1, (durationMin / INTERVAL_MIN) * COL_WIDTH - BLOCK_INSET_PX * 2);
    return { occurrences: [occ], left, width };
  }));
  // Real spawn times aren't aligned to the 15-minute column grid, and blocks
  // vary in width by duration, so two blocks can visually overlap even
  // though they look like they're in "different columns" — push colliding
  // blocks into separate lanes instead of letting them draw on top of each other.
  const laned = assignLanes(positioned);

  // Second pass, per lane: widen short blocks for legibility, but only as
  // far as the real gap to the NEXT block in that same lane allows. A short
  // event followed by genuinely empty time can stretch up to
  // MIN_BLOCK_WIDTH; one immediately followed by another event (zero real
  // gap) stays at its true width instead of visually creeping into — or
  // past — its neighbor's start.
  const byLane = {};
  laned.forEach(item => { (byLane[item.lane] ||= []).push(item); });
  Object.values(byLane).forEach(items => {
    items.sort((a, b) => a.left - b.left);
    items.forEach((item, idx) => {
      const next = items[idx + 1];
      // Must subtract the SAME amount trueWidth already subtracts
      // (2×BLOCK_INSET_PX), not BLOCK_GAP_PX — those aren't the same value.
      // Using the wrong one here let genuinely back-to-back short events
      // eat into what should've been the neighbor's own leading inset,
      // shrinking the visual gap after short events specifically instead of
      // keeping every junction's gap the same size regardless of duration.
      const maxAvailable = next ? Math.max(item.width, next.left - item.left - BLOCK_INSET_PX * 2) : Infinity;
      item.width = Math.min(Math.max(item.width, MIN_BLOCK_WIDTH), maxAvailable);
    });
  });

  const numLanes = laned.reduce((m, s) => Math.max(m, s.lane + 1), 1);
  // Every laned item now carries exactly one occurrence (see the flatten
  // above), so every lane is the same fixed height — no per-lane variance
  // to reason about, and no risk of one lane inheriting extra height from
  // a neighbor that used to stack multiple lines.
  const laneHeight = BLOCK_HEIGHT;
  // TRACK_TOP_PADDING counted twice — once as the margin before the first
  // lane, once as the matching margin after the last lane — so a
  // single-lane row has equal empty space above and below its one block.
  // Previously only the top margin was included, which is what made every
  // block sit noticeably higher than centered ("sits low" — more brown
  // above than below — was actually "more room above than below").
  const rowHeight = TRACK_TOP_PADDING * 2 + numLanes * laneHeight + Math.max(0, numLanes - 1) * BLOCK_GAP_PX;

  return (
    <div className="tl-row" style={{ height: rowHeight }}>
      <div className="tl-row-label">{row.rowLabel}</div>
      <div className="tl-track">
        {laned.map((slot, i) => (
          <div key={i} className="tl-block" style={{
            left: slot.left, width: slot.width,
            top: TRACK_TOP_PADDING + slot.lane * (laneHeight + BLOCK_GAP_PX) + BLOCK_VERTICAL_INSET,
            height: laneHeight - BLOCK_VERTICAL_INSET * 2,
          }}>
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
        <div style={{ position: "relative", borderTop: "1px solid var(--border)", background: "var(--bg2)" }}>
          <TimelineGridLines leftOffset={ROW_LABEL_WIDTH} />
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
        // Single shared horizontal scroll for the ENTIRE timeline — header
        // row + every expansion section/collection row together, all sized
        // to the same fixed TIMELINE_TOTAL_WIDTH. Previously each section
        // had its own independent overflow-x:auto, so scrolling one zone
        // left the header (and every other zone) behind — events no longer
        // lined up with the time markers above them. One scrollbar here
        // means the header always moves in lockstep with every row, and
        // every row/zone extends the same distance regardless of whether
        // its own events reach that far, so empty space reads as
        // consistent background rather than a ragged right edge.
        <div className="tl-scroll-wrap">
          <div style={{ width: TIMELINE_TOTAL_WIDTH }}>
            <div style={{ display: "flex", marginBottom: 8, paddingLeft: ROW_LABEL_WIDTH, position: "relative" }}>
              {headerCols.map((label, i) => (
                <div key={i} style={{
                  width: COL_WIDTH, flexShrink: 0, fontSize: 11, color: "var(--text3)", fontFamily: "Cinzel,serif",
                  letterSpacing: 1, textAlign: "center", borderLeft: "1px solid rgba(200,150,42,.18)",
                }}>
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
                <div style={{ position: "relative", padding: "6px 0", background: "var(--bg2)" }}>
                  <TimelineGridLines leftOffset={ROW_LABEL_WIDTH} />
                  <div className="tl-nowline" style={{ left: nowLineLeft + ROW_LABEL_WIDTH }} />
                  {timelineCollectionSlots.length === 0
                    ? <div className="empty">Nothing in this collection is scheduled in the next {HOURS_AHEAD} hours.</div>
                    : <TimelineRow row={{ rowLabel: activeList.name, slots: timelineCollectionSlots }} origin={origin} windowEnd={windowEnd} {...cellProps} />}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
