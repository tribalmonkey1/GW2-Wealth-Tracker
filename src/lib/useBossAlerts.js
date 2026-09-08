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
 * { "name|location": leadMinutes } via bossTimerStorage.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getNextOccurrenceForIdentity } from "./bossTimerCalc.js";
import { playAlertsSequentially } from "./alertSound.js";
import {
  bossKey, loadBossTimerPrefs, saveAlerts, saveSoundSettings, DEFAULT_SOUND_SETTINGS,
} from "./bossTimerStorage.js";

const TICK_MS = 1000;

export function useBossAlerts() {
  const [alerts, setAlerts] = useState({}); // "name|location" -> leadMinutes
  const [soundSettings, setSoundSettingsState] = useState(DEFAULT_SOUND_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const alertsRef = useRef(alerts);
  const soundRef = useRef(soundSettings);
  // Dedup: "name|location" -> spawnMs already alerted for. Stamped the
  // moment an occurrence first enters the lead window, regardless of
  // whether sound actually plays that tick — prevents re-alerting every
  // second while still inside the window, same as the reference app's
  // _lastAlertedSpawnUtc.
  const lastAlertedRef = useRef({});

  useEffect(() => { alertsRef.current = alerts; }, [alerts]);
  useEffect(() => { soundRef.current = soundSettings; }, [soundSettings]);

  useEffect(() => {
    let cancelled = false;
    loadBossTimerPrefs().then(prefs => {
      if (cancelled) return;
      setAlerts(prefs.alerts);
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

      for (const [key, leadMinutes] of Object.entries(currentAlerts)) {
        if (!leadMinutes) continue;
        const sepIdx = key.indexOf("|");
        const name = key.slice(0, sepIdx), location = key.slice(sepIdx + 1);
        const spawnMs = getNextOccurrenceForIdentity(name, location, now);
        if (spawnMs == null) continue;

        const msUntil = spawnMs - now;
        if (msUntil > leadMinutes * 60_000) continue;

        if (lastAlertedRef.current[key] === spawnMs) continue; // already handled this occurrence
        lastAlertedRef.current[key] = spawnMs;
        toFire.push(name);
      }

      if (toFire.length > 0) playAlertsSequentially(toFire, soundRef.current);
    }, TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const setAlertLead = useCallback((name, location, leadMinutes) => {
    setAlerts(prev => {
      const key = bossKey(name, location);
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
