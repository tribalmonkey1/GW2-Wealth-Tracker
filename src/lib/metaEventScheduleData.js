/**
 * GW2 Meta Event Schedule — ported directly from the C# reference app's
 * MetaEventScheduleData.cs. Unlike world bosses (fixed daily times), each
 * zone runs on its OWN repeating cycle synced to 00:00 UTC, with each named
 * event sitting at a fixed offset inside that cycle. See getNextOccurrence
 * in bossTimerCalc.js for the offset-into-cycle math.
 *
 * cycleLengthMin / offsetMin are both in minutes (source used TimeSpan —
 * flattened here for plain JS arithmetic). activeFrom/activeTo (ISO date
 * strings, inclusive, UTC calendar days) mark seasonal-only content — see
 * isMetaEventActive in bossTimerCalc.js. Every entry without those two
 * fields is a permanent zone, always active.
 *
 * durationMin: how long the event actually runs once it starts, used by the
 * Timeline view to size each block proportionally instead of every event
 * getting the same fixed-width block. Every entry in this file now carries a
 * confirmed duration except the seasonal festivals still pending real-world
 * dates (see the Special Events section below) — anything without the field
 * falls back to DEFAULT_DURATION_MIN (15) in bossTimerCalc.js.
 *
 * "Defend Jora's Keep" isn't a separate event in this schedule — it's what
 * this app's data calls "Raven Shrines" (Bjora Marches); its duration was
 * applied there.
 *
 * Convergences are grouped under a "Public Instance" expansion / "Convergence"
 * zone (Mount Balrior, Outer Nayos) rather than filed under whichever
 * expansion introduced them — see that section below. The original SotO
 * Convergence ("Convergences (Public)" at Amnytas) hasn't been moved into
 * that bucket, only these two.
 *
 * Special Events (seasonal festivals) still need real-world active windows:
 * Dragon Bash has no activeFrom/activeTo at all yet (so it currently shows
 * as always-on rather than seasonal) and Shadow of the Mad King is using a
 * "safe buffer" estimate rather than confirmed 2026 dates — see those
 * sections below for specifics. Wintersday, Super Adventure Festival, and
 * Lunar New Year have no tracked events yet at all.
 *
 * Source: docs/reference/events.json — the same structured data file that
 * powers the wiki's own timer widget — except Awakened Invasion (not
 * present here; see worldBossScheduleData.js). If the game's schedule
 * changes, that file is the one to re-check first.
 */

const ONE_HOUR = 60;
const TWO_HOUR = 120;
const THREE_HOUR = 180;

export const META_EVENT_SCHEDULE = [
  // ── Core Tyria ──
  { eventName: 'Ley-Line Anomaly', zoneName: 'Timberline Falls', expansion: 'Core Tyria', cycleLengthMin: 360, offsetMin: 20, chatLink: '[&BEwCAAA=]', durationMin: 20 },
  { eventName: 'Ley-Line Anomaly', zoneName: 'Iron Marches', expansion: 'Core Tyria', cycleLengthMin: 360, offsetMin: 140, chatLink: '[&BOYBAAA=]', durationMin: 20 },
  { eventName: 'Ley-Line Anomaly', zoneName: 'Gendarran Fields', expansion: 'Core Tyria', cycleLengthMin: 360, offsetMin: 260, chatLink: '[&BO0AAAA=]', durationMin: 20 },

  // ── Living World Season 1 ──
  { eventName: "Twisted Marionette (Public)", zoneName: "Lion's Arch", expansion: 'Living World Season 1', cycleLengthMin: TWO_HOUR, offsetMin: 0, chatLink: '[&BAkMAAA=]', durationMin: 20 },
  { eventName: "Battle For Lion's Arch (Public)", zoneName: "Lion's Arch", expansion: 'Living World Season 1', cycleLengthMin: TWO_HOUR, offsetMin: 30, chatLink: '[&BAkMAAA=]', durationMin: 15 },
  { eventName: 'Tower of Nightmares (Public)', zoneName: "Lion's Arch", expansion: 'Living World Season 1', cycleLengthMin: TWO_HOUR, offsetMin: 90, chatLink: '[&BAkMAAA=]', durationMin: 15 },
  { eventName: 'Defeat Scarlet\'s minions', zoneName: 'Various', expansion: 'Living World Season 1', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BOQAAAA=]', durationMin: 15 },

  // ── Living World Season 2 ──
  { eventName: 'Sandstorm', zoneName: 'Dry Top', expansion: 'Living World Season 2', cycleLengthMin: ONE_HOUR, offsetMin: 40, chatLink: '[&BIAHAAA=]', durationMin: 20 },

  // ── Heart of Thorns ──
  { eventName: 'Night Bosses', zoneName: 'Verdant Brink', expansion: 'Heart of Thorns', cycleLengthMin: TWO_HOUR, offsetMin: 10, chatLink: '[&BAgIAAA=]', durationMin: 45 },
  { eventName: 'Octovine', zoneName: 'Auric Basin', expansion: 'Heart of Thorns', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BAIIAAA=]', durationMin: 20 },
  { eventName: 'Pylons', zoneName: 'Auric Basin', expansion: 'Heart of Thorns', cycleLengthMin: TWO_HOUR, offsetMin: 90, chatLink: '[&BN0HAAA=]', durationMin: 45 },
  { eventName: 'Chak Gerent', zoneName: 'Tangled Depths', expansion: 'Heart of Thorns', cycleLengthMin: TWO_HOUR, offsetMin: 30, chatLink: '[&BPUHAAA=]', durationMin: 20 },
  { eventName: 'Advancing on the Blighting Towers', zoneName: "Dragon's Stand", expansion: 'Heart of Thorns', cycleLengthMin: TWO_HOUR, offsetMin: 90, chatLink: '[&BBAIAAA=]', durationMin: 120 },

  // ── Living World Season 3 ──
  { eventName: "Noran's Homestead", zoneName: 'Lake Doric', expansion: 'Living World Season 3', cycleLengthMin: TWO_HOUR, offsetMin: 30, chatLink: '[&BK8JAAA=]', durationMin: 30 },
  { eventName: "Saidra's Haven", zoneName: 'Lake Doric', expansion: 'Living World Season 3', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BK0JAAA=]', durationMin: 45 },
  { eventName: 'New Loamhurst', zoneName: 'Lake Doric', expansion: 'Living World Season 3', cycleLengthMin: TWO_HOUR, offsetMin: 105, chatLink: '[&BLQJAAA=]', durationMin: 45 },

  // ── Path of Fire ──
  { eventName: 'Rounds 1 to 3', zoneName: 'Crystal Oasis', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 5, chatLink: '[&BLsKAAA=]', durationMin: 16 },
  { eventName: 'Choya Pinata', zoneName: 'Crystal Oasis', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 21, chatLink: '[&BLsKAAA=]', durationMin: 9 },
  { eventName: 'Buried Treasure', zoneName: 'Desert Highlands', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BGsKAAA=]', durationMin: 20 },
  { eventName: 'The Path to Ascension: Augury Rock', zoneName: 'Elon Riverlands', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 90, chatLink: '[&BFMKAAA=]', durationMin: 25 },
  { eventName: 'Doppelganger', zoneName: 'Elon Riverlands', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 115, chatLink: '[&BCgKAAA=]', durationMin: 20 },
  { eventName: 'Junundu Rising', zoneName: 'The Desolation', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 30, chatLink: '[&BMEKAAA=]', durationMin: 20 },
  { eventName: 'Maws of Torment', zoneName: 'The Desolation', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BKMKAAA=]', durationMin: 20 },
  { eventName: 'Junundu Rising', zoneName: 'The Desolation', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 90, chatLink: '[&BMEKAAA=]', durationMin: 20 },
  { eventName: 'Forged with Fire', zoneName: 'Domain of Vabbi', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 0, chatLink: '[&BO0KAAA=]', durationMin: 30 },
  // Odd-hour UTC at :30 (e.g. 01:30, 03:30, ...) — offsetMin corrected from 30
  // to 90 per Derrick's clarification; the old value put this on even hours.
  { eventName: "Serpents' Ire", zoneName: 'Domain of Vabbi', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 90, chatLink: '[&BHQKAAA=]', durationMin: 30 },
  { eventName: 'Forged with Fire', zoneName: 'Domain of Vabbi', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BO0KAAA=]', durationMin: 30 },

  // ── Living World Season 4 ──
  { eventName: 'Palawadan', zoneName: 'Domain of Istan', expansion: 'Living World Season 4', cycleLengthMin: TWO_HOUR, offsetMin: 105, chatLink: '[&BAkLAAA=]', durationMin: 30 },
  // Starts 5 min after Palawadan ends (105 + 30 + 5 = 140, wraps mod the
  // 120-min cycle to 20) — same zone, same cycle length.
  { eventName: 'Sunspear Uprising', zoneName: 'Domain of Istan', expansion: 'Living World Season 4', cycleLengthMin: TWO_HOUR, offsetMin: 20, chatLink: '[&BAkLAAA=]', durationMin: 15 },
  { eventName: 'Escorts', zoneName: 'Jahai Bluffs', expansion: 'Living World Season 4', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BIMLAAA=]', durationMin: 15 },
  { eventName: 'Death-Branded Shatterer', zoneName: 'Jahai Bluffs', expansion: 'Living World Season 4', cycleLengthMin: TWO_HOUR, offsetMin: 75, chatLink: '[&BJMLAAA=]', durationMin: 15 },
  { eventName: 'The Oil Floes', zoneName: 'Thunderhead Peaks', expansion: 'Living World Season 4', cycleLengthMin: TWO_HOUR, offsetMin: 45, chatLink: '[&BKYLAAA=]', durationMin: 15 },
  { eventName: 'Thunderhead Keep', zoneName: 'Thunderhead Peaks', expansion: 'Living World Season 4', cycleLengthMin: TWO_HOUR, offsetMin: 105, chatLink: '[&BLsLAAA=]', durationMin: 20 },

  // ── The Icebrood Saga ──
  { eventName: 'Effigy', zoneName: 'Grothmar Valley', expansion: 'The Icebrood Saga', cycleLengthMin: TWO_HOUR, offsetMin: 10, chatLink: '[&BA4MAAA=]', durationMin: 15 },
  { eventName: 'Doomlore Shrine', zoneName: 'Grothmar Valley', expansion: 'The Icebrood Saga', cycleLengthMin: TWO_HOUR, offsetMin: 38, chatLink: '[&BA4MAAA=]', durationMin: 22 },
  { eventName: 'Ooze Pits', zoneName: 'Grothmar Valley', expansion: 'The Icebrood Saga', cycleLengthMin: TWO_HOUR, offsetMin: 65, chatLink: '[&BPgLAAA=]', durationMin: 20 },
  { eventName: 'Metal Concert', zoneName: 'Grothmar Valley', expansion: 'The Icebrood Saga', cycleLengthMin: TWO_HOUR, offsetMin: 100, chatLink: '[&BPgLAAA=]', durationMin: 15 },
  { eventName: 'Shards and Construct', zoneName: 'Bjora Marches', expansion: 'The Icebrood Saga', cycleLengthMin: TWO_HOUR, offsetMin: 0, chatLink: '[&BCcMAAA=]', durationMin: 5 },
  { eventName: 'Icebrood Champions', zoneName: 'Bjora Marches', expansion: 'The Icebrood Saga', cycleLengthMin: TWO_HOUR, offsetMin: 5, chatLink: '[&BCcMAAA=]', durationMin: 15 },
  { eventName: 'Drakkar and Spirits of the Wild', zoneName: 'Bjora Marches', expansion: 'The Icebrood Saga', cycleLengthMin: TWO_HOUR, offsetMin: 65, chatLink: '[&BDkMAAA=]', durationMin: 35 },
  // In-app labeled "Raven Shrines" — this is the event Derrick knows as "Defend Jora's Keep".
  { eventName: 'Raven Shrines', zoneName: 'Bjora Marches', expansion: 'The Icebrood Saga', cycleLengthMin: TWO_HOUR, offsetMin: 105, chatLink: '[&BCcMAAA=]', durationMin: 15 },
  { eventName: 'Dragonstorm', zoneName: 'Dragonstorm', expansion: 'The Icebrood Saga', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BAkMAAA=]', durationMin: 20 },

  // ── End of Dragons ──
  { eventName: 'Aetherblade Assault', zoneName: 'Seitung Province', expansion: 'End of Dragons', cycleLengthMin: TWO_HOUR, offsetMin: 90, chatLink: '[&BGUNAAA=]', durationMin: 30 },
  { eventName: 'Kaineng Blackout', zoneName: 'New Kaineng City', expansion: 'End of Dragons', cycleLengthMin: TWO_HOUR, offsetMin: 0, chatLink: '[&BBkNAAA=]', durationMin: 40 },
  { eventName: 'Gang War', zoneName: 'The Echovald Wilds', expansion: 'End of Dragons', cycleLengthMin: TWO_HOUR, offsetMin: 30, chatLink: '[&BMwMAAA=]', durationMin: 35 },
  { eventName: 'Aspenwood', zoneName: 'The Echovald Wilds', expansion: 'End of Dragons', cycleLengthMin: TWO_HOUR, offsetMin: 100, chatLink: '[&BPkMAAA=]', durationMin: 20 },
  { eventName: 'Preparations', zoneName: "Dragon's End", expansion: 'End of Dragons', cycleLengthMin: TWO_HOUR, offsetMin: 0, chatLink: '[&BKIMAAA=]', durationMin: 5 },
  { eventName: 'Jade Maw', zoneName: "Dragon's End", expansion: 'End of Dragons', cycleLengthMin: TWO_HOUR, offsetMin: 5, chatLink: '[&BKIMAAA=]', durationMin: 8 },
  { eventName: 'Preparations', zoneName: "Dragon's End", expansion: 'End of Dragons', cycleLengthMin: TWO_HOUR, offsetMin: 13, chatLink: '[&BKIMAAA=]', durationMin: 32 },
  { eventName: 'Jade Maw', zoneName: "Dragon's End", expansion: 'End of Dragons', cycleLengthMin: TWO_HOUR, offsetMin: 45, chatLink: '[&BKIMAAA=]', durationMin: 8 },
  { eventName: 'Preparations', zoneName: "Dragon's End", expansion: 'End of Dragons', cycleLengthMin: TWO_HOUR, offsetMin: 53, chatLink: '[&BKIMAAA=]', durationMin: 7 },
  { eventName: 'The Battle for the Jade Sea', zoneName: "Dragon's End", expansion: 'End of Dragons', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BKIMAAA=]', durationMin: 60 },

  // ── Secrets of the Obscure ──
  { eventName: "Unlocking the Wizard's Tower", zoneName: 'Skywatch Archipelago', expansion: 'Secrets of the Obscure', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BL4NAAA=]', durationMin: 25 },
  { eventName: 'Target Practice', zoneName: "Wizard's Tower", expansion: 'Secrets of the Obscure', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BB8OAAA=]', durationMin: 40 },
  { eventName: 'Target Practice & Fly by Night', zoneName: "Wizard's Tower", expansion: 'Secrets of the Obscure', cycleLengthMin: TWO_HOUR, offsetMin: 100, chatLink: '[&BB8OAAA=]', durationMin: 15 },
  { eventName: 'Fly by Night', zoneName: "Wizard's Tower", expansion: 'Secrets of the Obscure', cycleLengthMin: TWO_HOUR, offsetMin: 115, chatLink: '[&BB8OAAA=]', durationMin: 25 },
  { eventName: 'Defense of Amnytas', zoneName: 'Amnytas', expansion: 'Secrets of the Obscure', cycleLengthMin: TWO_HOUR, offsetMin: 0, chatLink: '[&BDQOAAA=]', durationMin: 25 },
  { eventName: 'Convergences (Public)', zoneName: 'Amnytas', expansion: 'Secrets of the Obscure', cycleLengthMin: THREE_HOUR, offsetMin: 90, chatLink: '[&BB8OAAA=]', durationMin: 10 },

  // ── Janthir Wilds ──
  { eventName: 'Of Mists and Monsters', zoneName: 'Janthir Syntri', expansion: 'Janthir Wilds', cycleLengthMin: TWO_HOUR, offsetMin: 40, chatLink: '[&BCoPAAA=]', durationMin: 25 },
  { eventName: 'A Titanic Voyage', zoneName: 'Bava Nisos', expansion: 'Janthir Wilds', cycleLengthMin: TWO_HOUR, offsetMin: 80, chatLink: '[&BGEPAAA=]', durationMin: 25 },

  // ── Visions of Eternity ──
  { eventName: 'Hammerhart Rumble!', zoneName: 'Shipwreck Strand', expansion: 'Visions of Eternity', cycleLengthMin: TWO_HOUR, offsetMin: 40, chatLink: '[&BJEPAAA=]', durationMin: 20 },
  { eventName: 'Secrets of the Weald', zoneName: 'Starlit Weald', expansion: 'Visions of Eternity', cycleLengthMin: TWO_HOUR, offsetMin: 100, chatLink: '[&BJ4PAAA=]', durationMin: 35 },

  // ── Public Instance — Convergences ──
  // Each expansion since Secrets of the Obscure has added its own
  // Convergence public instance; grouped under one "Public Instance"
  // expansion / "Convergence" zone bucket rather than filed under whichever
  // expansion happened to introduce it, since Derrick thinks of them as one
  // family of content. (The original SotO one, "Convergences (Public)" at
  // Amnytas above, hasn't been moved into this bucket — only these two.)
  { eventName: 'Mount Balrior', zoneName: 'Convergence', expansion: 'Public Instance', cycleLengthMin: THREE_HOUR, offsetMin: 0, chatLink: '[&BK4OAAA=]', durationMin: 10 },
  // Opens every 3 hours at :30, UTC-7 anchor 18:30 (= 01:30 UTC) — offsetMin
  // 90 puts occurrences at 01:30, 04:30, 07:30, ... UTC.
  { eventName: 'Outer Nayos', zoneName: 'Convergence', expansion: 'Public Instance', cycleLengthMin: THREE_HOUR, offsetMin: 90, chatLink: null, durationMin: 10 },

  // ── Special Events (seasonal) ──
  //
  // expansion here is the FESTIVAL name (not a real expansion) and zoneName
  // is the map that festival's tracked events occur in — same shape as
  // everything else in this file, just grouped by festival instead of by
  // release. activeFrom/activeTo gate these to when the festival is
  // actually running; outside that window isMetaEventActive() hides them
  // entirely. Dates are per-year and need updating each time the festival
  // returns — see the comment above each festival block for what's known
  // and what's still a guess.

  // ── Festival of the Four Winds — Labyrinthine Cliffs ──
  // (The Crown Pavilion is the festival's other map, but its events are
  // player-action-driven rather than clock-driven, so it isn't tracked here.)
  { eventName: 'Water Balloons', zoneName: 'Labyrinthine Cliffs', expansion: 'Festival of the Four Winds', cycleLengthMin: TWO_HOUR, offsetMin: 15, chatLink: '[&BBwHAAA=]', durationMin: 10, activeFrom: '2026-08-11', activeTo: '2026-09-01' },
  { eventName: 'Treasure Hunt', zoneName: 'Labyrinthine Cliffs', expansion: 'Festival of the Four Winds', cycleLengthMin: TWO_HOUR, offsetMin: 30, chatLink: '[&BBwHAAA=]', durationMin: 30, activeFrom: '2026-08-11', activeTo: '2026-09-01' },
  { eventName: 'Skimmer Race', zoneName: 'Labyrinthine Cliffs', expansion: 'Festival of the Four Winds', cycleLengthMin: TWO_HOUR, offsetMin: 75, chatLink: '[&BBwHAAA=]', durationMin: 10, activeFrom: '2026-08-11', activeTo: '2026-09-01' },
  { eventName: 'Fishing', zoneName: 'Labyrinthine Cliffs', expansion: 'Festival of the Four Winds', cycleLengthMin: TWO_HOUR, offsetMin: 90, chatLink: '[&BBwHAAA=]', durationMin: 10, activeFrom: '2026-08-11', activeTo: '2026-09-01' },
  { eventName: 'Dolyak Race', zoneName: 'Labyrinthine Cliffs', expansion: 'Festival of the Four Winds', cycleLengthMin: TWO_HOUR, offsetMin: 105, chatLink: '[&BBwHAAA=]', durationMin: 10, activeFrom: '2026-08-11', activeTo: '2026-09-01' },
  { eventName: 'Skiff Race', zoneName: 'Labyrinthine Cliffs', expansion: 'Festival of the Four Winds', cycleLengthMin: TWO_HOUR, offsetMin: 0, chatLink: '[&BBwHAAA=]', durationMin: 10, activeFrom: '2026-08-11', activeTo: '2026-09-01' },

  // ── Dragon Bash ──
  // "Hologram Stampede" rotates through 4 zones on an hourly cycle, the same
  // one-event-many-zones shape as Ley-Line Anomaly (grouped by name, not
  // name+location — see bossKey/getNextOccurrenceForName). NO activeFrom/
  // activeTo yet — Derrick didn't have Dragon Bash's real-world date range
  // (Groc's research only covered Halloween/Wintersday/Super Adventure/Lunar
  // New Year), so without those two fields this festival will show as
  // always-on rather than seasonal until dates are supplied.
  { eventName: 'Hologram Stampede', zoneName: 'Wayfarer Foothills', expansion: 'Dragon Bash', cycleLengthMin: ONE_HOUR, offsetMin: 0, chatLink: null, durationMin: 5 },
  { eventName: 'Hologram Stampede', zoneName: 'Dredgehaunt Cliffs', expansion: 'Dragon Bash', cycleLengthMin: ONE_HOUR, offsetMin: 15, chatLink: null, durationMin: 5 },
  { eventName: 'Hologram Stampede', zoneName: "Lornar's Pass", expansion: 'Dragon Bash', cycleLengthMin: ONE_HOUR, offsetMin: 30, chatLink: null, durationMin: 5 },
  { eventName: 'Hologram Stampede', zoneName: 'Snowden Drifts', expansion: 'Dragon Bash', cycleLengthMin: ONE_HOUR, offsetMin: 45, chatLink: null, durationMin: 5 },

  // ── Shadow of the Mad King (Halloween) ──
  // activeFrom/activeTo use the "safe buffer" window Derrick's research
  // recommended (real historical 2026 dates were closer to Oct 13 – Nov 3)
  // rather than the exact confirmed dates, since exact per-year dates
  // aren't nailed down — widen/narrow once the actual 2026 dates are known.
  { eventName: 'Your Mad King Says...', zoneName: "Lion's Arch", expansion: 'Shadow of the Mad King', cycleLengthMin: TWO_HOUR, offsetMin: 0, chatLink: null, durationMin: 10, activeFrom: '2026-10-01', activeTo: '2026-11-15' },
];
