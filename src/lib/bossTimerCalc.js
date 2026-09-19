/**
 * Boss/event timer calculators — pure functions, no I/O, no framework
 * dependency. Ported from the C# reference app's BossTimerCalculator /
 * MetaEventCalculator / BossTimerService.GetUpcomingRowSeries, adapted to
 * plain millisecond epoch timestamps (matches how the rest of this app
 * already works with Date.now()).
 *
 * (Split into its own module — like craftingCalc.js — so both the Timeline
 * view and the Countdown view, plus the global alert hook, share one tested
 * source of truth instead of three copies of spawn-time math.)
 */
import { WORLD_BOSS_SCHEDULE, expansionSortKey } from "./worldBossScheduleData.js";
import { META_EVENT_SCHEDULE } from "./metaEventScheduleData.js";

const ONE_MIN_MS = 60_000;
const ONE_HOUR_MS = 3_600_000;

// Fallback duration (minutes) for any schedule entry that doesn't yet carry
// a confirmed durationMin — matches the old fixed-one-column-wide behavior
// the Timeline view used before per-event durations existed, so an
// unconfirmed event doesn't shrink to something misleadingly tiny.
export const DEFAULT_DURATION_MIN = 15;

// Any timestamp that itself falls exactly on an even UTC hour works as the
// epoch here — GW2's meta cycles are synced to 00:00/02:00/...  UTC daily,
// so this specific date is arbitrary; only its alignment matters. Matches
// the C# reference's own CycleEpoch exactly so the two stay comparable if
// you ever cross-check them.
const CYCLE_EPOCH_MS = Date.UTC(2000, 0, 1, 0, 0, 0);

// How many raw candidate occurrences to pull per schedule entry before
// stacking same-time entries together. Stacking can only ever REDUCE the
// number of distinct slots (never increase it), so over-fetching here and
// trimming to cyclesAhead slots afterward guarantees we never come up short
// on slots just because two bosses happened to share a spawn minute.
const OCCURRENCE_FETCH_MULTIPLIER = 3;

// ── HH:MM parsing ──────────────────────────────────────────────────────────
function parseHHMM(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return { h, m };
}

// ── World boss fixed daily-time math ────────────────────────────────────────
// `inclusive` controls whether a spawn landing EXACTLY on nowMs counts as
// still upcoming (true) or already happened (false, the default — used for
// chaining below, see getUpcomingSpawns). The Timeline view's window filter
// (TimelineRow) includes a slot whose time === origin ("s.time >= origin"),
// but origin is itself snapped to a slot boundary, which is exactly where a
// boss's own spawn time can land. Without an inclusive first lookup, that
// occurrence got skipped ahead to its NEXT spawn before the Timeline ever
// saw it, which is why the very first (leftmost/soonest) column could come
// up empty even though a boss does spawn right at that instant.
export function getNextSpawn(dailySpawnTimesUtc, nowMs, inclusive = false) {
  const now = new Date(nowMs);
  const y = now.getUTCFullYear(), mo = now.getUTCMonth(), d = now.getUTCDate();

  const candidatesToday = dailySpawnTimesUtc
    .map(t => { const { h, m } = parseHHMM(t); return Date.UTC(y, mo, d, h, m, 0); })
    .filter(ts => (inclusive ? ts >= nowMs : ts > nowMs))
    .sort((a, b) => a - b);

  if (candidatesToday.length > 0) return candidatesToday[0];

  // Every spawn today has passed — wrap to the earliest spawn tomorrow.
  const earliest = dailySpawnTimesUtc
    .map(parseHHMM)
    .reduce((min, t) => (t.h * 60 + t.m < min.h * 60 + min.m ? t : min));
  return Date.UTC(y, mo, d + 1, earliest.h, earliest.m, 0);
}

export function getUpcomingSpawns(dailySpawnTimesUtc, nowMs, count) {
  const result = [];
  let cursor = nowMs;
  for (let i = 0; i < count; i++) {
    // Only the very first lookup is inclusive of nowMs itself — every
    // subsequent one chains off the spawn we just found, where strict
    // "after" is what actually advances the cursor instead of returning
    // the same timestamp forever.
    cursor = getNextSpawn(dailySpawnTimesUtc, cursor, i === 0);
    result.push(cursor);
  }
  return result;
}

// ── Meta event repeating-cycle math ─────────────────────────────────────────
// Same `inclusive` reasoning as getNextSpawn above — see its comment.
export function getNextOccurrence(schedule, nowMs, inclusive = false) {
  const cycleLengthMs = schedule.cycleLengthMin * ONE_MIN_MS;
  const cyclesElapsed = Math.floor((nowMs - CYCLE_EPOCH_MS) / cycleLengthMs);
  const currentCycleStart = CYCLE_EPOCH_MS + cyclesElapsed * cycleLengthMs;
  const candidate = currentCycleStart + schedule.offsetMin * ONE_MIN_MS;
  // Exactly "now" counts as already happened, not still upcoming, UNLESS
  // inclusive was requested (the Timeline's first-slot lookup) — strict >
  // otherwise, same default as before.
  const stillUpcoming = inclusive ? candidate >= nowMs : candidate > nowMs;
  return stillUpcoming ? candidate : candidate + cycleLengthMs;
}

export function getUpcomingOccurrences(schedule, nowMs, count) {
  const result = [];
  let cursor = nowMs;
  for (let i = 0; i < count; i++) {
    // Only the first lookup is inclusive — see getUpcomingSpawns' comment.
    cursor = getNextOccurrence(schedule, cursor, i === 0);
    result.push(cursor);
  }
  return result;
}

// Seasonal-content gate — permanent zones (no activeFrom/activeTo) are
// always active. Date-only, UTC calendar days, inclusive both ends — GW2
// doesn't publish festival patch-cutover times precisely enough to model
// more finely than that.
export function isMetaEventActive(schedule, nowMs) {
  if (!schedule.activeFrom && !schedule.activeTo) return true;
  const today = new Date(nowMs).toISOString().slice(0, 10); // "YYYY-MM-DD"
  if (schedule.activeFrom && today < schedule.activeFrom) return false;
  if (schedule.activeTo && today > schedule.activeTo) return false;
  return true;
}

// ── Row label / grouping helpers ────────────────────────────────────────────
function rowLabelForBossType(bossType) {
  if (bossType === "World Boss") return "World Bosses";
  if (bossType === "Hardcore Meta") return "Hardcore Meta Bosses";
  if (bossType === "Invasion") return "Invasions";
  return bossType;
}

// Groups a flat, already-sorted-by-time occurrence list into slots — any
// occurrences within the same UTC minute are stacked into one slot instead
// of being treated as sequential. This is what makes "Chak Gerent" render
// underneath "Battle For Lion's Arch (Public)" instead of appearing to
// start 30 minutes apart when they actually start together.
function buildStackedSlots(occurrences, cyclesAhead) {
  const sorted = [...occurrences].sort((a, b) => a.spawnMs - b.spawnMs);
  const slots = [];
  for (const occ of sorted) {
    const last = slots[slots.length - 1];
    if (last && Math.abs(occ.spawnMs - last.time) < ONE_MIN_MS) {
      // Same slot — avoid pushing an exact duplicate (can happen when a
      // schedule entry's own upcoming-occurrence buffer overlaps another
      // member's candidate at the boundary of the fetch window).
      if (!last.occurrences.some(o => o.name === occ.name && o.location === occ.location)) {
        last.occurrences.push(occ);
      }
    } else {
      slots.push({ time: occ.spawnMs, occurrences: [occ] });
    }
    if (slots.length >= cyclesAhead) break;
  }
  return slots.slice(0, cyclesAhead);
}

// Whether a stacked slot has any presence in [windowStart, windowEnd) — either it
// starts inside the window, or it started before windowStart but is still running
// (the longest occurrence stacked into it hasn't finished yet). Checking only
// `slot.time >= windowStart` (the Timeline view's original filter) drops an event
// entirely the instant the window's start edge ticks past its spawn time, even
// though the event itself is still going — that's what made an in-progress event
// (Palawadan) fail to show up at all, and made others (Sunspear Uprising, Drakkar
// and Spirits of the Wild) visibly disappear mid-countdown well before they
// actually ended. A slot only stops being visible once its longest occurrence's
// end time has actually passed, or once its start is beyond windowEnd.
export function slotVisibleInWindow(slot, windowStart, windowEnd) {
  if (slot.time >= windowEnd) return false;
  const maxDurationMs = Math.max(...slot.occurrences.map(o => (o.durationMin || DEFAULT_DURATION_MIN) * ONE_MIN_MS));
  return slot.time + maxDurationMs > windowStart;
}

// ── Main row-series builder (the "All" tab's data source) ──────────────────
export function getUpcomingRowSeries(nowMs, cyclesAhead) {
  const fetchCount = cyclesAhead * OCCURRENCE_FETCH_MULTIPLIER;
  const rows = [];

  // World Bosses / Hardcore Meta / Invasions — grouped by (expansion, bossType),
  // interleaved by true spawn time, then stacked.
  const worldGroups = new Map();
  for (const boss of WORLD_BOSS_SCHEDULE) {
    const key = `${boss.expansion}|${boss.bossType}`;
    if (!worldGroups.has(key)) worldGroups.set(key, []);
    worldGroups.get(key).push(boss);
  }
  for (const [key, members] of worldGroups) {
    const [expansion, bossType] = key.split("|");
    const occurrences = members.flatMap(boss =>
      getUpcomingSpawns(boss.dailySpawnTimesUtc, nowMs, fetchCount).map(spawnMs => ({
        name: boss.bossName, location: boss.location, chatLink: boss.chatLink, spawnMs,
        durationMin: boss.durationMin || DEFAULT_DURATION_MIN,
      }))
    );
    const slots = buildStackedSlots(occurrences, cyclesAhead);
    if (slots.length > 0) rows.push({ rowLabel: rowLabelForBossType(bossType), expansion, slots });
  }

  // Meta events — grouped by (zoneName, expansion), active schedules only.
  const metaGroups = new Map();
  for (const schedule of META_EVENT_SCHEDULE) {
    if (!isMetaEventActive(schedule, nowMs)) continue;
    const key = `${schedule.zoneName}|${schedule.expansion}`;
    if (!metaGroups.has(key)) metaGroups.set(key, []);
    metaGroups.get(key).push(schedule);
  }
  for (const [key, members] of metaGroups) {
    const [zoneName, expansion] = key.split("|");
    const occurrences = members.flatMap(schedule =>
      getUpcomingOccurrences(schedule, nowMs, fetchCount).map(spawnMs => ({
        name: schedule.eventName, location: schedule.zoneName, chatLink: schedule.chatLink, spawnMs,
        durationMin: schedule.durationMin || DEFAULT_DURATION_MIN,
      }))
    );
    const slots = buildStackedSlots(occurrences, cyclesAhead);
    if (slots.length > 0) rows.push({ rowLabel: zoneName, expansion, slots });
  }

  return rows.sort((a, b) => a.slots[0].time - b.slots[0].time);
}

// ── Favorites — merged occurrences for an arbitrary set of event NAMES ──
// Identity is the event name alone, not name+location: some events (Ley-Line
// Anomaly being the clearest example) are the same mechanical event rotating
// through several zones on its own schedule. Grouping by name means setting
// an alert or saving to a collection from any one zone's occurrence applies
// to every zone that event appears in — matches how the player thinks about
// "the event", not the specific instance they happened to click on.
export function getUpcomingOccurrencesFor(identities, nowMs, cyclesAhead) {
  if (identities.length === 0) return [];
  const nameSet = new Set(identities.map(i => i.name));
  const fetchCount = cyclesAhead * OCCURRENCE_FETCH_MULTIPLIER;
  const occurrences = [];

  for (const boss of WORLD_BOSS_SCHEDULE) {
    if (!nameSet.has(boss.bossName)) continue;
    occurrences.push(...getUpcomingSpawns(boss.dailySpawnTimesUtc, nowMs, fetchCount).map(spawnMs => ({
      name: boss.bossName, location: boss.location, chatLink: boss.chatLink, spawnMs,
      durationMin: boss.durationMin || DEFAULT_DURATION_MIN,
    })));
  }
  for (const schedule of META_EVENT_SCHEDULE) {
    if (!nameSet.has(schedule.eventName)) continue;
    if (!isMetaEventActive(schedule, nowMs)) continue;
    occurrences.push(...getUpcomingOccurrences(schedule, nowMs, fetchCount).map(spawnMs => ({
      name: schedule.eventName, location: schedule.zoneName, chatLink: schedule.chatLink, spawnMs,
      durationMin: schedule.durationMin || DEFAULT_DURATION_MIN,
    })));
  }

  return buildStackedSlots(occurrences, cyclesAhead);
}

export function getAllPossibleExpansions() {
  const set = new Set([
    ...WORLD_BOSS_SCHEDULE.map(b => b.expansion),
    ...META_EVENT_SCHEDULE.map(s => s.expansion),
  ]);
  return [...set].sort((a, b) => expansionSortKey(a) - expansionSortKey(b));
}

// ── Every individually-favoritable (name, location) identity ───────────────
// Powers the star-picker "search for a boss/event to favorite" list — a
// flat catalog independent of current schedule timing.
export function getAllBossIdentities() {
  const seen = new Set();
  const result = [];
  for (const b of WORLD_BOSS_SCHEDULE) {
    if (seen.has(b.bossName)) continue;
    seen.add(b.bossName);
    result.push({ name: b.bossName, location: b.location, chatLink: b.chatLink });
  }
  for (const s of META_EVENT_SCHEDULE) {
    if (seen.has(s.eventName)) continue;
    seen.add(s.eventName);
    result.push({ name: s.eventName, location: s.zoneName, chatLink: s.chatLink });
  }
  return result;
}

// ── Display helpers ──────────────────────────────────────────────────────────
export function formatCountdown(msUntil) {
  const totalSec = Math.max(0, Math.floor(msUntil / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h >= 1) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

// Matches the screenshots' rule: default under 15 min away, yellow at <15,
// red at <5.
export function urgencyColor(msUntil) {
  if (msUntil < 5 * ONE_MIN_MS) return "red";
  if (msUntil < 15 * ONE_MIN_MS) return "yellow";
  return "default";
}

export const ALERT_LEAD_OPTIONS_MIN = [10, 15, 20];

// ── Single-identity lookup (for the global alert hook) ──────────────────────
// Returns the SOONEST upcoming spawn across every schedule entry sharing this
// event name, regardless of zone — an alert on "Ley-Line Anomaly" should fire
// for whichever of its three zones comes up next, not just the one zone the
// alert happened to be set from. Returns null if the name doesn't match
// anything (e.g. a stale alert left over from schedule data that's since
// changed). Deliberately not derived from getUpcomingRowSeries' grouped/
// stacked output — an alert is about one named event, not "whichever boss
// occupies a combined row's soonest slot."
export function getNextOccurrenceForName(name, nowMs) {
  let best = null;
  for (const boss of WORLD_BOSS_SCHEDULE) {
    if (boss.bossName !== name) continue;
    const spawnMs = getNextSpawn(boss.dailySpawnTimesUtc, nowMs);
    if (best === null || spawnMs < best) best = spawnMs;
  }
  for (const schedule of META_EVENT_SCHEDULE) {
    if (schedule.eventName !== name) continue;
    if (!isMetaEventActive(schedule, nowMs)) continue;
    const spawnMs = getNextOccurrence(schedule, nowMs);
    if (best === null || spawnMs < best) best = spawnMs;
  }
  return best;
}
