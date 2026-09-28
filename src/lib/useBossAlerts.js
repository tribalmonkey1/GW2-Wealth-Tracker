/**
 * useBossAlerts — the global "did any alerted boss/event just enter its
 * lead window" check, ported from the C# reference app's
 * BossTimerViewModel.CheckAlerts/PlayAlertsSequentiallyAsync. Mounted once
 * at the App level (not inside the Time Gated tab) so alerts fire whether
 * or not the person is currently looking at Boss Timers — matches the
 * "global, not tab-scoped" behavior requested.
 *
 * Each alerted identity carries its OWN lead time (10/15/20 min — the bell
 * popover's choice) plus an "always" flag (the popover's "alert me every
 * time" checkbox), stored as { eventName: { lead: minutes|null, always } }
 * via bossTimerStorage. Identity is the event NAME alone (not name+location)
 * — see bossTimerStorage.bossKey.
 *
 * Completion state (`completions`) also lives here now, not in BossTimersTab —
 * it moved so the auto-completion heuristics below (which need to run whenever
 * DRF reports a drop, regardless of which tab is open) and the alert-suppression
 * check (an alert is skipped for an event already marked done today, UNLESS its
 * "always" flag is set) both read/write a single shared source of truth.
 * BossTimersTab.jsx now consumes `completions`/`setCompletions`/`toggleComplete`
 * from this hook's return value instead of keeping its own copy. The World Boss
 * API poll and Map Chest API poll remain in BossTimersTab (tab-scoped, matching
 * their original design) but write into this shared state too.
 *
 * Auto-completion heuristics (gated by AUTO_COMPLETION_ENABLED, same switch
 * BossTimersTab's world-boss/map-chest polls already respect):
 *  - Category 1 (ITEM_COMPLETION_TRACKERS from bossTimerStorage.js): an item that's
 *    exclusively obtainable from one event — any increase in its owned count marks
 *    that event done immediately, no timing at all.
 *  - Category 2 (MATERIAL_REWARD_TRACKERS): an item's count increasing by any amount
 *    during that event's own scheduled window (+ grace).
 *  - Category 3 (EXACT_COUNT_TRACKERS): an item's count must increase by EXACTLY a
 *    given amount during the window (+ grace), invalidated if certain other
 *    (container) items are seen increasing first that occurrence.
 *  - Category 4 (DUAL_THRESHOLD_TRACKERS): a gold delta AND a wallet-currency delta
 *    must both cross their thresholds during the window (+ grace).
 * All are best-effort heuristics, not guaranteed completion signals — see each
 * tracker's comment in bossTimerStorage.js for the specific tradeoffs accepted.
 *
 * customSoundPath: the CURRENT value of Settings → Alert Sound → custom
 * sound path (owned by App.jsx). piperVoiceFile / piperSpeakerId: same
 * live-override pattern, for Settings → Piper Voice (Linux native TTS
 * fallback — see alertSound.js/commands.rs). ownedMap / goldCopper /
 * extraCurrencies: the account's current material counts, gold, and any
 * other tracked wallet currencies (see drfClient.js) — DRF pushes these
 * near-instantly, and the GW2 API refreshes them every ~60s otherwise, so
 * the auto-completion trackers below see changes without any polling of
 * their own. All are passed in fresh on every render rather than baked
 * into state, so changes take effect immediately.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  getNextOccurrenceForName, getMostRecentOccurrenceForName, getEventDurationMin,
} from "./bossTimerCalc.js";
import { playAlertsSequentially } from "./alertSound.js";
import {
  bossKey, loadBossTimerPrefs, saveAlerts, saveSoundSettings, saveCompletions,
  DEFAULT_SOUND_SETTINGS, migrateLocationKeyedMap, migrateAlertsShape, currentPeriod,
  AUTO_COMPLETION_ENABLED, ITEM_COMPLETION_TRACKERS, MATERIAL_REWARD_TRACKERS,
  EXACT_COUNT_TRACKERS, DUAL_THRESHOLD_TRACKERS,
} from "./bossTimerStorage.js";

const TICK_MS = 1000;

export function useBossAlerts(customSoundPath, piperVoiceFile, piperSpeakerId, ownedMap, goldCopper, extraCurrencies, dataSettled) {
  const [alerts, setAlerts] = useState({}); // event name -> { lead, always }
  const [soundSettings, setSoundSettingsState] = useState(DEFAULT_SOUND_SETTINGS);
  const [completions, setCompletions] = useState({}); // event name -> { period, auto? }
  const [loaded, setLoaded] = useState(false);

  const alertsRef = useRef(alerts);
  const soundRef = useRef(soundSettings);
  const completionsRef = useRef(completions);
  const customSoundPathRef = useRef(customSoundPath);
  const piperVoiceFileRef = useRef(piperVoiceFile);
  const piperSpeakerIdRef = useRef(piperSpeakerId);
  const ownedMapRef = useRef(ownedMap || {});
  const goldRef = useRef(goldCopper || 0);
  const extraCurrenciesRef = useRef(extraCurrencies || {});
  // False until App.jsx has finished its staged startup load (cached map -> storage-only
  // map -> full map incl. bags). Auto-completion trackers must not read counts before
  // then, or items already sitting in a bag look like a fresh "increase" when bag data
  // arrives and would falsely complete events on every launch.
  const settledRef = useRef(!!dataSettled);

  // Dedup: event name -> spawnMs already alerted (or already skipped as complete)
  // for. Stamped the moment an occurrence first enters the lead window, regardless
  // of whether sound actually plays that tick — prevents re-checking every second
  // while still inside the window, same as the reference app's _lastAlertedSpawnUtc.
  const lastAlertedRef = useRef({});
  // Tracks the last daily-reset period the sweep effect actually ran for, so the
  // (slightly heavier) stale-completion cleanup only runs once per rollover instead
  // of every tick.
  const lastSweepPeriodRef = useRef(null);

  // Per-tracker running state for the four auto-completion categories — see the
  // big interval effect below for how each is used.
  const itemBaselineRef = useRef({});           // Category 1: eventName -> last known count
  const materialBaselineRef = useRef({});       // Category 2: eventName -> { occurrenceSpawnMs, baselineCount, confirmed }
  const exactCountTrackerRef = useRef({});      // Category 3: eventName -> { occurrenceSpawnMs, baselineCount, invalidBaseline, invalidated, confirmed }
  const dualThresholdTrackerRef = useRef({});   // Category 4: eventName -> { occurrenceSpawnMs, baselineGold, baselineCurrency, confirmed }

  useEffect(() => { alertsRef.current = alerts; }, [alerts]);
  useEffect(() => { soundRef.current = soundSettings; }, [soundSettings]);
  useEffect(() => { completionsRef.current = completions; }, [completions]);
  useEffect(() => { customSoundPathRef.current = customSoundPath; }, [customSoundPath]);
  useEffect(() => { piperVoiceFileRef.current = piperVoiceFile; }, [piperVoiceFile]);
  useEffect(() => { piperSpeakerIdRef.current = piperSpeakerId; }, [piperSpeakerId]);
  useEffect(() => { ownedMapRef.current = ownedMap || {}; }, [ownedMap]);
  useEffect(() => { goldRef.current = goldCopper || 0; }, [goldCopper]);
  useEffect(() => { extraCurrenciesRef.current = extraCurrencies || {}; }, [extraCurrencies]);
  useEffect(() => { settledRef.current = !!dataSettled; }, [dataSettled]);

  useEffect(() => {
    let cancelled = false;
    loadBossTimerPrefs().then(prefs => {
      if (cancelled) return;
      // pre-name-grouping saves used "name|location" keys; alerts also predate the
      // {lead,always} shape (used to be a bare lead-time number) — migrate both.
      setAlerts(migrateAlertsShape(migrateLocationKeyedMap(prefs.alerts)));
      setSoundSettingsState(prefs.soundSettings);
      setCompletions(migrateLocationKeyedMap(prefs.completions));
      setLoaded(true);
    }).catch(() => setLoaded(true));
    return () => { cancelled = true; };
  }, []);

  // Marks an event done for `period` via an auto-completion source. A no-op if it's
  // already marked done for that period via any path (manual or auto) — matches the
  // "count going up is all that matters, nothing double-fires" requirement.
  const markAutoComplete = (name, period) => {
    setCompletions(prev => {
      const key = bossKey(name);
      if (prev[key]?.period === period) return prev;
      const next = { ...prev, [key]: { period, auto: true } };
      saveCompletions(next);
      return next;
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const period = currentPeriod(now);

      // ── Reset sweep: once the period actually rolls over, drop every completion
      // that isn't for the new period (display already ignores stale periods; this
      // also removes them from storage so a fresh launch doesn't need to redo it).
      // While auto-completion is off, also drop any leftover auto-stamped entries.
      if (lastSweepPeriodRef.current !== period) {
        lastSweepPeriodRef.current = period;
        setCompletions(prev => {
          const stale = Object.keys(prev).filter(k =>
            prev[k]?.period !== period || (!AUTO_COMPLETION_ENABLED && prev[k]?.auto));
          if (stale.length === 0) return prev;
          const next = { ...prev };
          stale.forEach(k => delete next[k]);
          saveCompletions(next);
          return next;
        });
      }

      // ── Alert checking ──
      const currentAlerts = alertsRef.current;
      const toFire = [];
      for (const [name, entry] of Object.entries(currentAlerts)) {
        const leadMinutes = entry?.lead;
        if (!leadMinutes) continue;
        const spawnMs = getNextOccurrenceForName(name, now);
        if (spawnMs == null) continue;

        const msUntil = spawnMs - now;
        if (msUntil > leadMinutes * 60_000) continue;
        if (lastAlertedRef.current[name] === spawnMs) continue; // already handled this occurrence

        // Skip alerting for an event already marked done today — unless its "always"
        // flag is set, for the farming-loop case where the person wants to know it's
        // back up again even though the daily "done" checkbox no longer applies.
        if (!entry.always) {
          const key = bossKey(name);
          if (completionsRef.current[key]?.period === period) {
            lastAlertedRef.current[name] = spawnMs;
            continue;
          }
        }

        lastAlertedRef.current[name] = spawnMs;
        toFire.push(name);
      }

      if (toFire.length > 0) {
        const settings = soundRef.current;
        // Merge in the live custom sound path / Piper voice+speaker only
        // for the mode that actually uses them — avoids ever needing to
        // re-save soundSettings just because one of these changed.
        let effective = settings;
        if (settings.mode === "custom") {
          effective = { ...settings, customPath: customSoundPathRef.current || settings.customPath };
        } else if (settings.mode === "tts") {
          effective = {
            ...settings,
            piperVoiceFile: piperVoiceFileRef.current || settings.piperVoiceFile,
            piperSpeakerId: piperSpeakerIdRef.current ?? settings.piperSpeakerId,
          };
        }
        playAlertsSequentially(toFire, effective);
      }

      // ── Auto-completion heuristics ──
      if (AUTO_COMPLETION_ENABLED && settledRef.current) {
        const owned = ownedMapRef.current || {};
        const gold = goldRef.current || 0;
        const extra = extraCurrenciesRef.current || {};

        // Category 1 — no timing: any increase in a uniquely-sourced item's count.
        for (const t of ITEM_COMPLETION_TRACKERS) {
          const cur = owned[t.itemId] || 0;
          const baseline = itemBaselineRef.current[t.eventName];
          if (baseline === undefined) { itemBaselineRef.current[t.eventName] = cur; continue; }
          if (cur > baseline) {
            itemBaselineRef.current[t.eventName] = cur;
            markAutoComplete(t.eventName, period);
          } else if (cur !== baseline) {
            itemBaselineRef.current[t.eventName] = cur; // went down (used/traded) — just rebase, no effect on completion
          }
        }

        // Category 2 — any increase during the event's own window + grace.
        for (const t of MATERIAL_REWARD_TRACKERS) {
          const occSpawnMs = getMostRecentOccurrenceForName(t.eventName, now);
          if (occSpawnMs == null) continue;
          const durationMin = getEventDurationMin(t.eventName);
          const windowEndMs = occSpawnMs + durationMin * 60_000 + t.graceMinutes * 60_000;
          if (now > windowEndMs) continue;
          const cur = owned[t.itemId] || 0;
          const existing = materialBaselineRef.current[t.eventName];
          if (!existing || existing.occurrenceSpawnMs !== occSpawnMs) {
            materialBaselineRef.current[t.eventName] = { occurrenceSpawnMs: occSpawnMs, baselineCount: cur, confirmed: false };
            continue;
          }
          if (existing.confirmed) continue;
          if (cur > existing.baselineCount) {
            existing.confirmed = true;
            markAutoComplete(t.eventName, period);
          }
        }

        // Category 3 — exact-delta with invalidation.
        for (const t of EXACT_COUNT_TRACKERS) {
          const occSpawnMs = getMostRecentOccurrenceForName(t.eventName, now);
          if (occSpawnMs == null) continue;
          const durationMin = getEventDurationMin(t.eventName);
          const windowEndMs = occSpawnMs + durationMin * 60_000 + t.graceMinutes * 60_000;
          let state = exactCountTrackerRef.current[t.eventName];
          if (now > windowEndMs) {
            if (state && state.occurrenceSpawnMs === occSpawnMs) delete exactCountTrackerRef.current[t.eventName];
            continue;
          }
          const cur = owned[t.itemId] || 0;
          if (!state || state.occurrenceSpawnMs !== occSpawnMs) {
            state = { occurrenceSpawnMs: occSpawnMs, baselineCount: cur, invalidBaseline: null, invalidated: false, confirmed: false };
            exactCountTrackerRef.current[t.eventName] = state;
            continue;
          }
          if (state.confirmed) continue;
          if (!state.invalidBaseline) {
            state.invalidBaseline = {};
            for (const invId of t.invalidatedByItemIds) state.invalidBaseline[invId] = owned[invId] || 0;
          } else if (!state.invalidated) {
            for (const invId of t.invalidatedByItemIds) {
              if ((owned[invId] || 0) > state.invalidBaseline[invId]) { state.invalidated = true; break; }
            }
          }
          const delta = cur - state.baselineCount;
          if (!state.invalidated && delta === t.exactCount) {
            state.confirmed = true;
            markAutoComplete(t.eventName, period);
          }
        }

        // Category 4 — dual threshold (gold + a currency), read together each tick.
        for (const t of DUAL_THRESHOLD_TRACKERS) {
          const occSpawnMs = getMostRecentOccurrenceForName(t.eventName, now);
          if (occSpawnMs == null) continue;
          const durationMin = getEventDurationMin(t.eventName);
          const windowEndMs = occSpawnMs + durationMin * 60_000 + t.graceMinutes * 60_000;
          const state = dualThresholdTrackerRef.current[t.eventName];
          if (now > windowEndMs) {
            if (state && state.occurrenceSpawnMs === occSpawnMs) delete dualThresholdTrackerRef.current[t.eventName];
            continue;
          }
          const curGold = gold;
          const curCurrency = extra[t.currencyId] || 0;
          if (!state || state.occurrenceSpawnMs !== occSpawnMs) {
            dualThresholdTrackerRef.current[t.eventName] = {
              occurrenceSpawnMs: occSpawnMs, baselineGold: curGold, baselineCurrency: curCurrency, confirmed: false,
            };
            continue;
          }
          if (state.confirmed) continue;
          const goldDelta = curGold - state.baselineGold;
          const currencyDelta = curCurrency - state.baselineCurrency;
          if (goldDelta >= t.goldThresholdCopper && currencyDelta >= t.currencyThreshold) {
            state.confirmed = true;
            markAutoComplete(t.eventName, period);
          }
        }
      }
    }, TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const setAlertLead = useCallback((name, leadMinutes) => {
    setAlerts(prev => {
      const key = bossKey(name);
      const next = { ...prev };
      if (leadMinutes) next[key] = { lead: leadMinutes, always: prev[key]?.always || false };
      else delete next[key]; // "Off" clears the always-flag too — no lead time means no alert to always-fire
      saveAlerts(next);
      return next;
    });
  }, []);

  const setAlertAlways = useCallback((name, always) => {
    setAlerts(prev => {
      const key = bossKey(name);
      const existing = prev[key];
      if (!existing && !always) return prev; // nothing configured, nothing to toggle off
      const next = { ...prev, [key]: { lead: existing?.lead ?? null, always } };
      saveAlerts(next);
      return next;
    });
  }, []);

  const setSoundSettings = useCallback((settings) => {
    setSoundSettingsState(settings);
    saveSoundSettings(settings);
  }, []);

  // Manual completion toggle — used by the ✓ checkbox in both Boss Timer views.
  const toggleComplete = useCallback((name) => {
    setCompletions(prev => {
      const key = bossKey(name);
      const next = { ...prev };
      const period = currentPeriod(Date.now());
      if (next[key]?.period === period) delete next[key]; // un-check
      else next[key] = { period };
      saveCompletions(next);
      return next;
    });
  }, []);

  return useMemo(() => ({
    alerts, setAlertLead, setAlertAlways,
    soundSettings, setSoundSettings,
    completions, setCompletions, toggleComplete,
    loaded,
  }), [alerts, setAlertLead, setAlertAlways, soundSettings, setSoundSettings, completions, toggleComplete, loaded]);
}
