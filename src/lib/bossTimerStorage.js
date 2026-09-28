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
import { getDailyResetTs } from "./dailyCrafting.js";

export const CACHE_KEYS = {
  favoriteLists: "bossTimerFavoriteLists",   // [{ id, name, members: [{name}] }]
  alerts: "bossTimerAlerts",                 // { name: { lead: minutes|null, always: boolean } }
  completions: "bossTimerCompletions",       // { name: { period } }
  soundSettings: "bossTimerSoundSettings",   // { mode: "beep"|"tts"|"custom", customPath, piperVoiceFile, piperSpeakerId }
  areasSelection: "bossTimerAreasSelection", // string[] of selected expansion names, or absent = all
  viewMode: "bossTimerViewMode",             // "countdown" | "timeline"
  apiFreshness: "bossTimerApiFreshness",     // { [source]: { period, names: string[], confirmed } } — see evaluateApiFreshness in BossTimersTab.jsx
};

// Master switch for every automatic completion source (world-boss API poll, map-chest
// API poll, and every DRF-driven heuristic in useBossAlerts.js). OFF = completions are
// purely manual checkboxes that reset at 00:00 UTC. Either way, ALL completions (manual
// and auto) are cleared at that reset — see the sweep in useBossAlerts.js.
export const AUTO_COMPLETION_ENABLED = true;

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

// Shared "today" identity for completions, used by both useBossAlerts.js (to decide
// whether to suppress an alert for an already-done event) and BossTimersTab.jsx (to
// render checkbox state) — the same UTC-midnight reset boundary Daily Crafting/Time
// Gated already use (getDailyResetTs), so Boss Timers can't drift out of sync with the
// rest of the app's dailies if that reset math ever changes. Ignores nowMs and always
// reflects the actual current UTC day, matching the previous per-file local copies of
// this function exactly.
export function currentPeriod(nowMs) {
  return getDailyResetTs();
}

// Migrates alerts saved before "alert me every time" existed, whose values were a bare
// lead-time number (or, even older, absent entirely meaning off). New shape is always
// { lead: minutes|null, always: boolean }. Safe to run on already-migrated data.
export function migrateAlertsShape(raw) {
  const next = {};
  for (const [name, val] of Object.entries(raw || {})) {
    if (val && typeof val === "object") {
      next[name] = { lead: val.lead ?? null, always: !!val.always };
    } else if (val) {
      next[name] = { lead: val, always: false };
    }
  }
  return next;
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

// ── Auto-completion tracker configs ──────────────────────────────────────────
// Evaluated every tick in useBossAlerts.js (the one hook mounted globally, so these
// run regardless of which tab is open — needed since DRF pushes drops in real time).
// Kept here, rather than inline in that hook, so BossTimersTab's 🔗 auto-tracked badge
// can describe them to the person without duplicating the list.
//
// All four categories key their per-occurrence/global state by the item or currency
// actually being watched; "count going up" is what matters everywhere — a count going
// down (used, sold, traded) never un-completes or double-completes anything.

// Category 1 — no timing at all: the item is exclusively obtainable from this one
// event, so any increase in its owned count, whenever it happens, means the event was
// just completed. Used for convergence "Commander's Choice"/"Hero's Choice" chests,
// which sit in the inventory sometimes for a while before being opened.
export const ITEM_COMPLETION_TRACKERS = [
  { eventName: 'Mount Balrior', itemId: 103842, itemName: "Convergence: Mount Balrior Commander's Choice Chest" },
  { eventName: 'Nexus of Eternity (Public)', itemId: 110137, itemName: "Convergence: Nexus of Eternity Commander's Choice Chest" },
  { eventName: 'Outer Nayos', itemId: 101185, itemName: "Convergence: Hero's Choice Chest" },
];

// Category 2 — the item's count only needs to increase by ANY amount, but only counts
// during that event's own scheduled window (+ a short grace period for API/DRF lag).
export const MATERIAL_REWARD_TRACKERS = [
  { eventName: 'Ley-Line Anomaly', itemId: 19976, itemName: 'Mystic Coin', graceMinutes: 5 },
];

// Category 3 — the item's count must increase by EXACTLY the given amount during the
// window (+ grace) — not more, not less. Invalidated for that occurrence the moment any
// of `invalidatedByItemIds` (the other, container-based sources of the same material)
// is seen increasing first, since that means the shards likely came from one of those
// instead. A container looted AFTER the exact-20 delta already confirmed doesn't
// retroactively undo the completion — only "before" matters.
export const EXACT_COUNT_TRACKERS = [
  {
    eventName: 'Drakkar and Spirits of the Wild', itemId: 92272, itemName: 'Eternal Ice Shard',
    exactCount: 20, graceMinutes: 2,
    invalidatedByItemIds: [
      92775, // Raid Encounter: Lost Large Chest of Resilience
      92369, // Raid Encounter: Lost Medium Chest of Resilience
      92376, // Raven's Gift
    ],
  },
];

// Category 4 — two independent thresholds (gold and a wallet currency) must BOTH be
// crossed, observed together on the same check, during the window (+ grace). Modeled
// as "gold delta >= threshold AND currency delta >= threshold since the window opened"
// rather than needing sub-second correlation — the tick rate itself (1s) already keeps
// the two readings close enough together to call them "the same reward drop".
export const DUAL_THRESHOLD_TRACKERS = [
  {
    eventName: 'Dragonstorm', graceMinutes: 2,
    goldThresholdCopper: 2 * 10000, // 2 gold
    currencyId: 60, currencyName: 'Tyrian Defense Seal', currencyThreshold: 25,
  },
];

// piperVoiceFile: file stem (no .onnx extension) of a voice detected by the
// list_piper_voices Tauri command, or null (native TTS falls back to the
// legacy single piper-voice.onnx convention, and ultimately espeak-ng, if
// unset). piperSpeakerId: numeric speaker index for multi-speaker voices
// (e.g. the "semaine" dataset's Prudence/Spike/Obadiah/Poppy), or null for
// ordinary single-speaker voices / default speaker 0. Both are Linux-only
// concerns — ignored entirely on the browser-TTS path Windows/macOS use.
export const DEFAULT_SOUND_SETTINGS = { mode: "beep", customPath: null, piperVoiceFile: null, piperSpeakerId: null, volume: 100 };

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
    soundSettings: soundEntry?.value ? { ...DEFAULT_SOUND_SETTINGS, ...soundEntry.value } : DEFAULT_SOUND_SETTINGS,
  };
}

// Single-key loaders — used by callers that only need one slice of this data
// rather than always paying for the full bulk fetch loadBossTimerPrefs does.
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

// Persists, per API-tracked source ("worldbosses" | "mapchests"), the last poll result
// and whether it's been confirmed fresh for its period — see evaluateApiFreshness in
// BossTimersTab.jsx for what this gates. Stored as plain arrays (Sets aren't JSON-safe);
// callers convert back to Sets after loading. Survives app restarts, which matters
// specifically for the case this exists to handle: the app wasn't running when the
// daily reset happened, so there's no in-memory state to compare a fresh poll against.
export async function loadApiFreshness() {
  const entry = await cacheGet(CACHE_KEYS.apiFreshness);
  return entry?.value || {};
}

export function saveApiFreshness(freshnessMap) {
  return cacheSet(CACHE_KEYS.apiFreshness, freshnessMap);
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
