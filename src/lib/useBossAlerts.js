/**
 * useBossAlerts — the global "did any alerted boss/event just enter its
 * lead window" check, ported from the C# reference app's
 * BossTimerViewModel.CheckAlerts/PlayAlertsSequentiallyAsync. Mounted once
 * at the App level (not inside the Time Gated tab) so alerts fire whether
 * or not the person is currently looking at Boss Timers — matches the
 * "global, not tab-scoped" behavior requested.
 *
 * Each alerted identity carries its OWN lead time (10/15/20 min — the bell
 * popover's choice) rather than a single global lead time, stored as
 * { eventName: leadMinutes } via bossTimerStorage. Identity is the event
 * NAME alone (not name+location) — see bossTimerStorage.bossKey.
 *
 * customSoundPath: the CURRENT value of Settings → Alert Sound → custom
 * sound path (owned by App.jsx). Passed in fresh on every render rather
 * than baked into soundSettings.customPath at save-time, so changing the
 * path in Settings takes effect immediately.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getNextOccurrenceForName } from "./bossTimerCalc.js";
import { playAlertsSequentially } from "./alertSound.js";
import {
  bossKey, loadBossTimerPrefs, saveAlerts, saveSoundSettings, DEFAULT_SOUND_SETTINGS,
  migrateLocationKeyedMap,
} from "./bossTimerStorage.js";

const TICK_MS = 1000;

export function useBossAlerts(customSoundPath) {
  const [alerts, setAlerts] = useState({}); // event name -> leadMinutes
  const [soundSettings, setSoundSettingsState] = useState(DEFAULT_SOUND_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const alertsRef = useRef(alerts);
  const soundRef = useRef(soundSettings);
  const customSoundPathRef = useRef(customSoundPath);
  // Dedup: event name -> spawnMs already alerted for. Stamped the moment an
  // occurrence first enters the lead window, regardless of whether sound
  // actually plays that tick — prevents re-alerting every second while
  // still inside the window, same as the reference app's
  // _lastAlertedSpawnUtc. Since identity is name-only now, this naturally
  // covers "already alerted for this spawn, wherever it is" too.
  const lastAlertedRef = useRef({});

  useEffect(() => { alertsRef.current = alerts; }, [alerts]);
  useEffect(() => { soundRef.current = soundSettings; }, [soundSettings]);
  useEffect(() => { customSoundPathRef.current = customSoundPath; }, [customSoundPath]);

  useEffect(() => {
    let cancelled = false;
    loadBossTimerPrefs().then(prefs => {
      if (cancelled) return;
      setAlerts(migrateLocationKeyedMap(prefs.alerts)); // pre-name-grouping saves used "name|location" keys
      setSoundSettingsState(prefs.soundSettings);
      setLoaded(true);
    }).catch(() => setLoaded(true));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const currentAlerts = alertsRef.current;
      const toFire = [];

      for (const [name, leadMinutes] of Object.entries(currentAlerts)) {
        if (!leadMinutes) continue;
        const spawnMs = getNextOccurrenceForName(name, now);
        if (spawnMs == null) continue;

        const msUntil = spawnMs - now;
        if (msUntil > leadMinutes * 60_000) continue;

        if (lastAlertedRef.current[name] === spawnMs) continue; // already handled this occurrence
        lastAlertedRef.current[name] = spawnMs;
        toFire.push(name);
      }

      if (toFire.length > 0) {
        const settings = soundRef.current;
        // Merge in the live custom sound path only when custom mode is active —
        // avoids ever needing to re-save soundSettings just because the path changed.
        const effective = settings.mode === "custom"
          ? { ...settings, customPath: customSoundPathRef.current || settings.customPath }
          : settings;
        playAlertsSequentially(toFire, effective);
      }
    }, TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const setAlertLead = useCallback((name, leadMinutes) => {
    setAlerts(prev => {
      const key = bossKey(name);
      const next = { ...prev };
      if (leadMinutes) next[key] = leadMinutes; else delete next[key];
      saveAlerts(next);
      return next;
    });
  }, []);

  const setSoundSettings = useCallback((settings) => {
    setSoundSettingsState(settings);
    saveSoundSettings(settings);
  }, []);

  return useMemo(() => ({ alerts, setAlertLead, soundSettings, setSoundSettings, loaded }),
    [alerts, setAlertLead, soundSettings, setSoundSettings, loaded]);
}
