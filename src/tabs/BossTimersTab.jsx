/**
 * Boss Timers — countdown grid view (the RogueAIO-style view). Groups World
 * Bosses/Hardcore Meta/meta-event zones into collapsible sections, each
 * with a horizontally-scrolling strip of upcoming-occurrence cells. Same
 * spawn slot is shown as one cell with each boss/event stacked inside it
 * (see buildStackedSlots in bossTimerCalc.js) rather than as separate cells
 * that look sequential.
 *
 * Alerts (bell) and collections (star) are both per-(name, location)
 * identity, not per-cell — a boss keeps its alert/collection membership as
 * it moves across cells each tick. Alert state itself lives in the global
 * useBossAlerts hook (mounted in App.jsx) so it keeps firing on other tabs;
 * collections are local to this tab since browsing/curating them is only
 * ever done here.
 * (Lives in tabs/, alongside CraftingTab.jsx etc.)
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  getUpcomingRowSeries, getUpcomingOccurrencesFor, getAllPossibleExpansions,
  formatCountdown, urgencyColor, ALERT_LEAD_OPTIONS_MIN,
} from "../lib/bossTimerCalc.js";
import { bossKey, loadFavoriteLists, saveFavoriteLists, nextDefaultFavoriteListName } from "../lib/bossTimerStorage.js";
import { EXPANSION_ACCENT_COLORS, EXPANSION_ACCENT_FALLBACK, expansionSortKey } from "../lib/worldBossScheduleData.js";
import { InteractivePopover } from "../components/InteractivePopover.jsx";

const CYCLES_AHEAD = 6;
const TICK_MS = 1000;

const URGENCY_STYLE = {
  default: { color: "var(--text2)" },
  yellow: { color: "var(--gold2)", fontWeight: 600 },
  red: { color: "var(--red2,#e05555)", fontWeight: 700 },
};

function CountdownLine({ occ, now, alerts, setAlertLead, collections, onToggleMember, onCreateCollection }) {
  const msUntil = occ.spawnMs - now;
  const urgency = urgencyColor(msUntil);
  const key = bossKey(occ.name, occ.location);
  const leadMinutes = alerts[key];
  const localTime = new Date(occ.spawnMs).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  const bellRef = useRef(null);
  const starRef = useRef(null);
  const [bellOpen, setBellOpen] = useState(false);
  const [starOpen, setStarOpen] = useState(false);
  const [newListName, setNewListName] = useState("");

  const memberListIds = collections.filter(l => l.members.some(m => m.name === occ.name && m.location === occ.location)).map(l => l.id);
  const isFavorited = memberListIds.length > 0;

  return (
    <div className="bt-occ">
      <div className="bt-occ-top">
        <span className="bt-occ-name" title={occ.location}>{occ.name}</span>
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

      <InteractivePopover anchorRef={bellRef} open={bellOpen} onClose={() => setBellOpen(false)}>
        <div className="bt-pop-lbl">ALERT ME</div>
        {ALERT_LEAD_OPTIONS_MIN.map(min => (
          <label key={min} className="bt-pop-row">
            <input type="radio" name={`lead-${key}`} checked={leadMinutes === min}
              onChange={() => setAlertLead(occ.name, occ.location, min)} />
            {min} minutes before
          </label>
        ))}
        <label className="bt-pop-row">
          <input type="radio" name={`lead-${key}`} checked={!leadMinutes} onChange={() => setAlertLead(occ.name, occ.location, null)} />
          Off
        </label>
      </InteractivePopover>

      <InteractivePopover anchorRef={starRef} open={starOpen} onClose={() => setStarOpen(false)} minWidth={220}>
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

function Section({ expansion, rows, collapsed, onToggle, ...rest }) {
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

export default function BossTimersTab({ bossAlerts }) {
  const { alerts, setAlertLead, soundSettings, setSoundSettings } = bossAlerts;
  const [now, setNow] = useState(Date.now());
  const [collections, setCollections] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeTabId, setActiveTabId] = useState(null); // null = "All"
  const [collapsedExpansions, setCollapsedExpansions] = useState(() => new Set());
  const [selectedAreas, setSelectedAreas] = useState(null); // null = every area selected
  const [areasOpen, setAreasOpen] = useState(false);
  const [soundOpen, setSoundOpen] = useState(false);
  const areasBtnRef = useRef(null);
  const soundBtnRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadFavoriteLists().then(lists => { if (!cancelled) { setCollections(lists); setLoaded(true); } }).catch(() => setLoaded(true));
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

  const cellProps = { now, alerts, setAlertLead, collections, onToggleMember: handleToggleMember, onCreateCollection: handleCreateCollection };

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

  if (!loaded) return <div className="empty">Loading boss timers…</div>;

  return (
    <div>
      <div className="ctrl">
        <button ref={areasBtnRef} className="rbtn" onClick={() => setAreasOpen(o => !o)}>
          Areas ({effectiveSelectedAreas.size}/{allExpansions.length}) ▾
        </button>
        <button ref={soundBtnRef} className="rbtn" onClick={() => setSoundOpen(o => !o)}>🔊 Sound ▾</button>
        <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--text3)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
          🔔 sets an alert · ⭐ saves to a collection
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
        {[["beep", "Beep"], ["tts", "Text-to-Speech"]].map(([mode, label]) => (
          <label key={mode} className="bt-pop-row">
            <input type="radio" name="sound-mode" checked={soundSettings.mode === mode}
              onChange={() => setSoundSettings({ ...soundSettings, mode })} />
            {label}
          </label>
        ))}
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

      {activeTabId === null ? (
        sectionsByExpansion.length === 0
          ? <div className="empty">No areas selected.</div>
          : sectionsByExpansion.map(([expansion, rows]) => (
            <Section key={expansion} expansion={expansion} rows={rows}
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
      )}
    </div>
  );
}
