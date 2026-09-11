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
  favoriteLists: "bossTimerFavoriteLists",   // [{ id, name, members: [{name}] }]
  alerts: "bossTimerAlerts",                 // { name: leadMinutes }
  completions: "bossTimerCompletions",       // { name: { period } }
  soundSettings: "bossTimerSoundSettings",   // { mode: "beep"|"tts"|"custom", customPath }
  areasSelection: "bossTimerAreasSelection", // string[] of selected expansion names, or absent = all
  viewMode: "bossTimerViewMode",             // "countdown" | "timeline"
};

// Identity key for alerts/collections/completions — the event NAME alone.
// Some events (Ley-Line Anomaly being the clearest example) are the same
// mechanical event rotating through several zones; grouping by name means a
// bell/star/checkbox set from any one zone's occurrence applies to all of
// them. Kept as a named function (rather than using `name` directly at every
// call site) so the identity concept has one place to change later if it
// ever needs to get smarter than "name alone".
export function bossKey(name) {
  return name;
}

// Migrates alerts/completions maps saved before the name-only identity
// change, whose keys were "name|location" strings. Safe to run on every
// load — a no-op for already-migrated data (keys with no "|" pass through
// unchanged). If two old location-specific entries for the same event name
// collide, the later one in iteration order wins; for alerts/completions
// that's harmless (both meant "this event, on"), so no merge logic needed.
export function migrateLocationKeyedMap(map) {
  if (!map) return {};
  const next = {};
  for (const [key, value] of Object.entries(map)) {
    const name = key.includes("|") ? key.slice(0, key.indexOf("|")) : key;
    next[name] = value;
  }
  return next;
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

// Areas selection — stored as an array of expansion names, or null if the
// person has never customized it (defaults to "everything selected").
export async function loadAreasSelection() {
  const entry = await cacheGet(CACHE_KEYS.areasSelection);
  return entry?.value ?? null;
}

export function saveAreasSelection(namesOrNull) {
  return cacheSet(CACHE_KEYS.areasSelection, namesOrNull);
}

export async function loadViewMode() {
  const entry = await cacheGet(CACHE_KEYS.viewMode);
  return entry?.value || "countdown";
}

export function saveViewMode(mode) {
  return cacheSet(CACHE_KEYS.viewMode, mode);
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
