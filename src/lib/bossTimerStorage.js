/**
 * Boss Timer persistence — reuses the app's existing generic cache_get/
 * cache_set Tauri commands (same mechanism as rarityFilter/friendFilter in
 * App.jsx) rather than dedicated SQLite tables. Everything here is small,
 * infrequently-written, whole-value data — exactly the shape that
 * convention already covers — so no new Rust commands or schema migration
 * are needed to ship this.
 *
 * Keys are "name|location" strings (matches getUpcomingRowSeries' own
 * occurrence shape in bossTimerCalc.js) rather than nested objects, so the
 * maps below serialize as plain flat JSON.
 */
import { cacheGet, cacheSet, cacheGetBulk } from "./storage.js";

export const CACHE_KEYS = {
  favoriteLists: "bossTimerFavoriteLists",   // [{ id, name, members: [{name, location}] }]
  alerts: "bossTimerAlerts",                 // { "name|location": leadMinutes }
  completions: "bossTimerCompletions",       // { "name|location": { period } }
  soundSettings: "bossTimerSoundSettings",   // { mode: "beep"|"tts"|"custom", customPath }
};

export function bossKey(name, location) {
  return `${name}|${location}`;
}

export const DEFAULT_SOUND_SETTINGS = { mode: "beep", customPath: null };

// Bulk-loads everything Boss Timers needs on startup in one IPC round-trip,
// same pattern App.jsx's fullLoad already uses via cacheGetBulk. Falls back
// to sensible empty defaults for a first-ever launch (no cached keys yet).
export async function loadBossTimerPrefs() {
  const [listsEntry, alertsEntry, completionsEntry, soundEntry] = await cacheGetBulk([
    CACHE_KEYS.favoriteLists, CACHE_KEYS.alerts, CACHE_KEYS.completions, CACHE_KEYS.soundSettings,
  ]);
  return {
    favoriteLists: listsEntry?.value || [],
    alerts: alertsEntry?.value || {},
    completions: completionsEntry?.value || {},
    soundSettings: soundEntry?.value || DEFAULT_SOUND_SETTINGS,
  };
}

// Single-key loaders — used by tabs that only need one slice of this data
// (e.g. BossTimersTab only cares about favoriteLists; useBossAlerts already
// covers alerts/soundSettings globally) rather than always paying for the
// full bulk fetch loadBossTimerPrefs does on app startup.
export async function loadFavoriteLists() {
  const entry = await cacheGet(CACHE_KEYS.favoriteLists);
  return entry?.value || [];
}

export async function loadCompletions() {
  const entry = await cacheGet(CACHE_KEYS.completions);
  return entry?.value || {};
}

export function saveFavoriteLists(lists) {
  return cacheSet(CACHE_KEYS.favoriteLists, lists);
}

export function saveAlerts(alertsMap) {
  return cacheSet(CACHE_KEYS.alerts, alertsMap);
}

export function saveCompletions(completionsMap) {
  return cacheSet(CACHE_KEYS.completions, completionsMap);
}

export function saveSoundSettings(settings) {
  return cacheSet(CACHE_KEYS.soundSettings, settings);
}

// "Favorite List N" for the smallest N not already in use — matches the
// C# reference's own NextDefaultFavoriteListName naming convention.
export function nextDefaultFavoriteListName(existingLists) {
  const used = new Set(
    existingLists
      .map(l => /^Favorite List (\d+)$/.exec(l.name))
      .filter(Boolean)
      .map(m => Number(m[1]))
  );
  let next = 1;
  while (used.has(next)) next++;
  return `Favorite List ${next}`;
}
