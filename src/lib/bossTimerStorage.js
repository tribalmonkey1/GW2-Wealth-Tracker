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

// Item identity below is itemId (a single numeric GW2 item id), itemIds (an array of
// numeric ids that are all "the same reward" and whose counts should be summed — used
// where GW2 issued a second id for an item when its loot table was rebalanced, leaving
// old mail/inventory able to hold either), or itemName (a display-name fallback for the
// small number of items whose numeric id wasn't confirmed). See resolveTrackerItemIds in
// useBossAlerts.js, which looks itemName up in itemMap the same way legendary-data.js's
// resolveLegendaryIds does — once itemMap has seen the item once, the name resolves
// permanently and behaves exactly like an itemId entry from then on.

// Category 1 — no timing at all: the item is exclusively obtainable from this one
// event, so any increase in its owned count, whenever it happens, means the event was
// just completed. Used for convergence "Commander's Choice"/"Hero's Choice" chests and
// other single-source rewards that can sit in the inventory a while before being opened.
export const ITEM_COMPLETION_TRACKERS = [
  { eventName: 'Mount Balrior', itemId: 103842, itemName: "Convergence: Mount Balrior Commander's Choice Chest" },
  { eventName: 'Nexus of Eternity (Public)', itemId: 110137, itemName: "Convergence: Nexus of Eternity Commander's Choice Chest" },
  { eventName: 'Outer Nayos', itemId: 101185, itemName: "Convergence: Hero's Choice Chest" },
  { eventName: 'Depths of Cruelty', itemId: 110205, itemName: "Leyspring Hollows: Hero's Choice Chest" },
  { eventName: 'Hammerhart Rumble!', itemId: 105700, itemName: "Hammerhart's \"Recovered\" Hoard" },
  { eventName: 'Of Mists and Monsters', itemId: 102265, itemName: "Janthir Syntri: Hero's Choice Chest" },
  { eventName: 'A Titanic Voyage', itemId: 104714, itemName: "Bava Nisos: Commander's Choice Chest" },
  { eventName: "Unlocking the Wizard's Tower", itemId: 100547, itemName: "Skywatch Archipelago: Hero's Choice Chest" },
  { eventName: 'Defense of Amnytas', itemId: 100193, itemName: "Amnytas: Hero's Choice Chest" },
  { eventName: 'Kaineng Blackout', itemId: 97901, itemName: "New Kaineng City: Hero's Choice Chest" },
  { eventName: 'Gang War', itemId: 97894, itemName: "Echovald Wilds: Hero's Choice Chest" },
  { eventName: 'The Oil Floes', itemId: 89692, itemName: 'Light of Deldrimor Plate—Bottom Half' },
  { eventName: 'Thunderhead Keep', itemId: 89828, itemName: 'Light of Deldrimor Plate—Top Half' },
];

// DRF-only mirror of MAP_CHEST_API_IDS (see that file): each of those events is already
// API-tracked through its zone's daily Hero's Choice Chest, but the API only refreshes
// on its own poll cadence (worldbosses/mapchests every 2 min — see BossTimersTab.jsx).
// When a DRF token is connected, these give the SAME completion near-instantly off the
// live item-count feed instead, using the same "does this chest item's count go up"
// signal as every other Hero's/Commander's Choice Chest tracker above. Gated on
// drfConnected in useBossAlerts.js — with no DRF token these are simply never checked,
// and the API poll in BossTimersTab.jsx remains the only path, same as before this was
// added. Item names are the zone's own display name + ": Hero's Choice Chest", matching
// the confirmed pattern (Seitung Province, Leyspring Hollows, etc.) — unconfirmed per-zone,
// same caveat as the rest of this file.
export const MAP_CHEST_ITEM_TRACKERS = [
  { eventName: 'Night Bosses', itemIds: [78171, 78743], itemName: "Verdant Brink: Hero's Choice Chest" },
  { eventName: 'Octovine', itemIds: [78650, 78748], itemName: "Auric Basin: Hero's Choice Chest" },
  { eventName: 'Chak Gerent', itemIds: [78332, 78751], itemName: "Tangled Depths: Hero's Choice Chest" },
  { eventName: 'Advancing on the Blighting Towers', itemIds: [78617, 78783], itemName: "Dragon's Stand: Hero's Choice Chest" },
  { eventName: 'Choya Pinata', itemId: 90958, itemName: "Crystal Oasis: Hero's Choice Chest" },
  { eventName: 'Doppelganger', itemId: 91039, itemName: "Elon Riverlands: Hero's Choice Chest" },
  { eventName: 'The Battle for the Jade Sea', itemId: 97896, itemName: "Dragon's End: Hero's Choice Chest" },
  { eventName: 'Aetherblade Assault', itemId: 97895, itemName: "Seitung Province: Hero's Choice Chest" },
];

// Category 2 — the item's count only needs to increase by ANY amount, but only counts
// during that event's own scheduled window (+ a short grace period for API/DRF lag).
// Forged with Fire / Serpents' Ire and Junundu Rising / Maws of Torment each share one
// reward item between two events — safe because, per design, the two events in each pair
// run at different hours of the day, so only one of the pair's windows is ever open at a
// time, and the increase always lands inside the correct event's own window.
export const MATERIAL_REWARD_TRACKERS = [
  { eventName: 'Ley-Line Anomaly', itemId: 19976, itemName: 'Mystic Coin', graceMinutes: 5 },
  { eventName: 'Doomlore Shrine', itemId: 92037, itemName: 'Ash Legion Key', graceMinutes: 2 },
  { eventName: 'Ooze Pits', itemId: 92052, itemName: 'Blood Legion Key', graceMinutes: 2 },
  { eventName: 'Effigy', itemId: 92082, itemName: 'Flame Legion Key', graceMinutes: 2 },
  { eventName: 'Metal Concert', itemId: 92077, itemName: 'Iron Legion Key', graceMinutes: 2 },
  { eventName: 'Forged with Fire', itemId: 83035, itemName: "Domain of Vabbi: Hero's Choice Chest", graceMinutes: 2 },
  { eventName: "Serpents' Ire", itemId: 83035, itemName: "Domain of Vabbi: Hero's Choice Chest", graceMinutes: 2 },
  { eventName: 'Junundu Rising', itemId: 84360, itemName: "The Desolation: Hero's Choice Chest", graceMinutes: 2 },
  { eventName: 'Maws of Torment', itemId: 84360, itemName: "The Desolation: Hero's Choice Chest", graceMinutes: 2 },
];

// Category 3 — the item's count must increase by EXACTLY the given amount within a
// short window (correlationSeconds, default 3s) during the event's window (+ grace) —
// a single reward drop, not a running total of everything gained since the event began.
// Rejected whenever any of `invalidatedByItemIds` (the other, container-based sources of
// the same material) changes — up (picked up) or down (opened) — in that same short
// window, since the shards then likely came from that container instead.
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
// crossed during the window (+ grace). Floor match ("at least"), not exact — an exact
// match turned out to false-negative on a real Dragonstorm run (confirmed Sept 2026):
// loot from the fight itself (vendor-sellable drops, other currencies) can push gold or
// seals past the guaranteed amount in the same window, so "exactly 2g / exactly 25"
// misses runs that genuinely completed the event. goldThresholdCopper/currencyThreshold
// are the floor values (2 gold = 200 silver = 20,000 copper; 25 Tyrian Defense Seals).
export const DUAL_THRESHOLD_TRACKERS = [
  {
    eventName: 'Dragonstorm', graceMinutes: 2,
    goldThresholdCopper: 2 * 100 * 100,
    currencyId: 60, currencyName: 'Tyrian Defense Seal', currencyThreshold: 25,
  },
];

// Category 5 — two (or more) items that must each increase at least once during the
// event's window (+ grace), with no required amount — a simultaneous-reward pairing
// unique to one event. Used when a single meta event hands out two different items in
// the same reward drop, so neither alone is a unique-enough signal but the pair is.
export const PAIRED_ITEM_TRACKERS = [
  {
    eventName: 'Secrets of the Weald', graceMinutes: 2,
    items: [
      { itemId: 105822, itemName: "Castora: Hero's Choice Chest" },
      { itemId: 106445, itemName: 'Starlit Weald Renown Token' },
    ],
  },
];

// Category 6 — like Category 5, but each item must land within a specific delta RANGE
// (or exact amount, when min equals max) of the SAME reward drop, and both deltas must
// land within a short correlation window of each other — not just "sometime during the
// event" — since the quantities alone (a range of ore, a handful of a common material)
// aren't a unique enough signal without also requiring them to arrive together.
export const RANGED_PAIR_TRACKERS = [
  {
    eventName: 'Death-Branded Shatterer', graceMinutes: 2, correlationSeconds: 2,
    items: [
      { itemId: 46733, itemName: 'Dragonite Ore', minDelta: 15, maxDelta: 25 },
      { itemId: 88955, itemName: 'Lump of Mistonium', minDelta: 5, maxDelta: 5 },
    ],
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
