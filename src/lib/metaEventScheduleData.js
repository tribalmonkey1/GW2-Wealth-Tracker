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
  { eventName: 'Ley-Line Anomaly', zoneName: 'Timberline Falls', expansion: 'Core Tyria', cycleLengthMin: 360, offsetMin: 20, chatLink: '[&BEwCAAA=]' },
  { eventName: 'Ley-Line Anomaly', zoneName: 'Iron Marches', expansion: 'Core Tyria', cycleLengthMin: 360, offsetMin: 140, chatLink: '[&BOYBAAA=]' },
  { eventName: 'Ley-Line Anomaly', zoneName: 'Gendarran Fields', expansion: 'Core Tyria', cycleLengthMin: 360, offsetMin: 260, chatLink: '[&BO0AAAA=]' },

  // ── Living World Season 1 ──
  { eventName: "Twisted Marionette (Public)", zoneName: "Lion's Arch", expansion: 'Living World Season 1', cycleLengthMin: TWO_HOUR, offsetMin: 0, chatLink: '[&BAkMAAA=]' },
  { eventName: "Battle For Lion's Arch (Public)", zoneName: "Lion's Arch", expansion: 'Living World Season 1', cycleLengthMin: TWO_HOUR, offsetMin: 30, chatLink: '[&BAkMAAA=]' },
  { eventName: 'Tower of Nightmares (Public)', zoneName: "Lion's Arch", expansion: 'Living World Season 1', cycleLengthMin: TWO_HOUR, offsetMin: 90, chatLink: '[&BAkMAAA=]' },
  { eventName: "Defeat Scarlet's minions", zoneName: 'Various', expansion: 'Living World Season 1', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BOQAAAA=]' },

  // ── Living World Season 2 ──
  { eventName: 'Sandstorm', zoneName: 'Dry Top', expansion: 'Living World Season 2', cycleLengthMin: ONE_HOUR, offsetMin: 40, chatLink: '[&BIAHAAA=]' },

  // ── Heart of Thorns ──
  { eventName: 'Night Bosses', zoneName: 'Verdant Brink', expansion: 'Heart of Thorns', cycleLengthMin: TWO_HOUR, offsetMin: 10, chatLink: '[&BAgIAAA=]' },
  { eventName: 'Octovine', zoneName: 'Auric Basin', expansion: 'Heart of Thorns', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BAIIAAA=]' },
  { eventName: 'Pylons', zoneName: 'Auric Basin', expansion: 'Heart of Thorns', cycleLengthMin: TWO_HOUR, offsetMin: 90, chatLink: '[&BN0HAAA=]' },
  { eventName: 'Chak Gerent', zoneName: 'Tangled Depths', expansion: 'Heart of Thorns', cycleLengthMin: TWO_HOUR, offsetMin: 30, chatLink: '[&BPUHAAA=]' },
  { eventName: 'Advancing on the Blighting Towers', zoneName: "Dragon's Stand", expansion: 'Heart of Thorns', cycleLengthMin: TWO_HOUR, offsetMin: 90, chatLink: '[&BBAIAAA=]' },

  // ── Living World Season 3 ──
  { eventName: "Noran's Homestead", zoneName: 'Lake Doric', expansion: 'Living World Season 3', cycleLengthMin: TWO_HOUR, offsetMin: 30, chatLink: '[&BK8JAAA=]' },
  { eventName: "Saidra's Haven", zoneName: 'Lake Doric', expansion: 'Living World Season 3', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BK0JAAA=]' },
  { eventName: 'New Loamhurst', zoneName: 'Lake Doric', expansion: 'Living World Season 3', cycleLengthMin: TWO_HOUR, offsetMin: 105, chatLink: '[&BLQJAAA=]' },

  // ── Path of Fire ──
  { eventName: 'Rounds 1 to 3', zoneName: 'Crystal Oasis', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 5, chatLink: '[&BLsKAAA=]' },
  { eventName: 'Choya Pinata', zoneName: 'Crystal Oasis', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 21, chatLink: '[&BLsKAAA=]' },
  { eventName: 'Buried Treasure', zoneName: 'Desert Highlands', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BGsKAAA=]' },
  { eventName: 'The Path to Ascension: Augury Rock', zoneName: 'Elon Riverlands', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 90, chatLink: '[&BFMKAAA=]' },
  { eventName: 'Doppelganger', zoneName: 'Elon Riverlands', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 115, chatLink: '[&BCgKAAA=]' },
  { eventName: 'Junundu Rising', zoneName: 'The Desolation', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 30, chatLink: '[&BMEKAAA=]' },
  { eventName: 'Maws of Torment', zoneName: 'The Desolation', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BKMKAAA=]' },
  { eventName: 'Junundu Rising', zoneName: 'The Desolation', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 90, chatLink: '[&BMEKAAA=]' },
  { eventName: 'Forged with Fire', zoneName: 'Domain of Vabbi', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 0, chatLink: '[&BO0KAAA=]' },
  { eventName: "Serpents' Ire", zoneName: 'Domain of Vabbi', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 30, chatLink: '[&BHQKAAA=]' },
  { eventName: 'Forged with Fire', zoneName: 'Domain of Vabbi', expansion: 'Path of Fire', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BO0KAAA=]' },

  // ── Living World Season 4 ──
  { eventName: 'Palawadan', zoneName: 'Domain of Istan', expansion: 'Living World Season 4', cycleLengthMin: TWO_HOUR, offsetMin: 105, chatLink: '[&BAkLAAA=]' },
  { eventName: 'Escorts', zoneName: 'Jahai Bluffs', expansion: 'Living World Season 4', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BIMLAAA=]' },
  { eventName: 'Death-Branded Shatterer', zoneName: 'Jahai Bluffs', expansion: 'Living World Season 4', cycleLengthMin: TWO_HOUR, offsetMin: 75, chatLink: '[&BJMLAAA=]' },
  { eventName: 'The Oil Floes', zoneName: 'Thunderhead Peaks', expansion: 'Living World Season 4', cycleLengthMin: TWO_HOUR, offsetMin: 45, chatLink: '[&BKYLAAA=]' },
  { eventName: 'Thunderhead Keep', zoneName: 'Thunderhead Peaks', expansion: 'Living World Season 4', cycleLengthMin: TWO_HOUR, offsetMin: 105, chatLink: '[&BLsLAAA=]' },

  // ── The Icebrood Saga ──
  { eventName: 'Effigy', zoneName: 'Grothmar Valley', expansion: 'The Icebrood Saga', cycleLengthMin: TWO_HOUR, offsetMin: 10, chatLink: '[&BA4MAAA=]' },
  { eventName: 'Doomlore Shrine', zoneName: 'Grothmar Valley', expansion: 'The Icebrood Saga', cycleLengthMin: TWO_HOUR, offsetMin: 38, chatLink: '[&BA4MAAA=]' },
  { eventName: 'Ooze Pits', zoneName: 'Grothmar Valley', expansion: 'The Icebrood Saga', cycleLengthMin: TWO_HOUR, offsetMin: 65, chatLink: '[&BPgLAAA=]' },
  { eventName: 'Metal Concert', zoneName: 'Grothmar Valley', expansion: 'The Icebrood Saga', cycleLengthMin: TWO_HOUR, offsetMin: 100, chatLink: '[&BPgLAAA=]' },
  { eventName: 'Shards and Construct', zoneName: 'Bjora Marches', expansion: 'The Icebrood Saga', cycleLengthMin: TWO_HOUR, offsetMin: 0, chatLink: '[&BCcMAAA=]' },
  { eventName: 'Icebrood Champions', zoneName: 'Bjora Marches', expansion: 'The Icebrood Saga', cycleLengthMin: TWO_HOUR, offsetMin: 5, chatLink: '[&BCcMAAA=]' },
  { eventName: 'Drakkar and Spirits of the Wild', zoneName: 'Bjora Marches', expansion: 'The Icebrood Saga', cycleLengthMin: TWO_HOUR, offsetMin: 65, chatLink: '[&BDkMAAA=]' },
  { eventName: 'Raven Shrines', zoneName: 'Bjora Marches', expansion: 'The Icebrood Saga', cycleLengthMin: TWO_HOUR, offsetMin: 105, chatLink: '[&BCcMAAA=]' },
  { eventName: 'Dragonstorm', zoneName: 'Dragonstorm', expansion: 'The Icebrood Saga', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BAkMAAA=]' },

  // ── End of Dragons ──
  { eventName: 'Aetherblade Assault', zoneName: 'Seitung Province', expansion: 'End of Dragons', cycleLengthMin: TWO_HOUR, offsetMin: 90, chatLink: '[&BGUNAAA=]' },
  { eventName: 'Kaineng Blackout', zoneName: 'New Kaineng City', expansion: 'End of Dragons', cycleLengthMin: TWO_HOUR, offsetMin: 0, chatLink: '[&BBkNAAA=]' },
  { eventName: 'Gang War', zoneName: 'The Echovald Wilds', expansion: 'End of Dragons', cycleLengthMin: TWO_HOUR, offsetMin: 30, chatLink: '[&BMwMAAA=]' },
  { eventName: 'Aspenwood', zoneName: 'The Echovald Wilds', expansion: 'End of Dragons', cycleLengthMin: TWO_HOUR, offsetMin: 100, chatLink: '[&BPkMAAA=]' },
  { eventName: 'Preparations', zoneName: "Dragon's End", expansion: 'End of Dragons', cycleLengthMin: TWO_HOUR, offsetMin: 0, chatLink: '[&BKIMAAA=]' },
  { eventName: 'Jade Maw', zoneName: "Dragon's End", expansion: 'End of Dragons', cycleLengthMin: TWO_HOUR, offsetMin: 5, chatLink: '[&BKIMAAA=]' },
  { eventName: 'Preparations', zoneName: "Dragon's End", expansion: 'End of Dragons', cycleLengthMin: TWO_HOUR, offsetMin: 13, chatLink: '[&BKIMAAA=]' },
  { eventName: 'Jade Maw', zoneName: "Dragon's End", expansion: 'End of Dragons', cycleLengthMin: TWO_HOUR, offsetMin: 45, chatLink: '[&BKIMAAA=]' },
  { eventName: 'Preparations', zoneName: "Dragon's End", expansion: 'End of Dragons', cycleLengthMin: TWO_HOUR, offsetMin: 53, chatLink: '[&BKIMAAA=]' },
  { eventName: 'The Battle for the Jade Sea', zoneName: "Dragon's End", expansion: 'End of Dragons', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BKIMAAA=]' },

  // ── Secrets of the Obscure ──
  { eventName: "Unlocking the Wizard's Tower", zoneName: 'Skywatch Archipelago', expansion: 'Secrets of the Obscure', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BL4NAAA=]' },
  { eventName: 'Target Practice', zoneName: "Wizard's Tower", expansion: 'Secrets of the Obscure', cycleLengthMin: TWO_HOUR, offsetMin: 60, chatLink: '[&BB8OAAA=]' },
  { eventName: 'Target Practice & Fly by Night', zoneName: "Wizard's Tower", expansion: 'Secrets of the Obscure', cycleLengthMin: TWO_HOUR, offsetMin: 100, chatLink: '[&BB8OAAA=]' },
  { eventName: 'Fly by Night', zoneName: "Wizard's Tower", expansion: 'Secrets of the Obscure', cycleLengthMin: TWO_HOUR, offsetMin: 115, chatLink: '[&BB8OAAA=]' },
  { eventName: 'Defense of Amnytas', zoneName: 'Amnytas', expansion: 'Secrets of the Obscure', cycleLengthMin: TWO_HOUR, offsetMin: 0, chatLink: '[&BDQOAAA=]' },
  { eventName: 'Convergences (Public)', zoneName: 'Amnytas', expansion: 'Secrets of the Obscure', cycleLengthMin: THREE_HOUR, offsetMin: 90, chatLink: '[&BB8OAAA=]' },

  // ── Janthir Wilds ──
  { eventName: 'Of Mists and Monsters', zoneName: 'Janthir Syntri', expansion: 'Janthir Wilds', cycleLengthMin: TWO_HOUR, offsetMin: 40, chatLink: '[&BCoPAAA=]' },
  { eventName: 'Convergence: Mount Balrior', zoneName: 'Mount Balrior', expansion: 'Janthir Wilds', cycleLengthMin: THREE_HOUR, offsetMin: 0, chatLink: '[&BK4OAAA=]' },
  { eventName: 'A Titanic Voyage', zoneName: 'Bava Nisos', expansion: 'Janthir Wilds', cycleLengthMin: TWO_HOUR, offsetMin: 80, chatLink: '[&BGEPAAA=]' },

  // ── Visions of Eternity ──
  { eventName: 'Hammerhart Rumble!', zoneName: 'Shipwreck Strand', expansion: 'Visions of Eternity', cycleLengthMin: TWO_HOUR, offsetMin: 40, chatLink: '[&BJEPAAA=]' },
  { eventName: 'Secrets of the Weald', zoneName: 'Starlit Weald', expansion: 'Visions of Eternity', cycleLengthMin: TWO_HOUR, offsetMin: 100, chatLink: '[&BJ4PAAA=]' },

  // ── Special Events (seasonal) — Festival of the Four Winds ──
  // Lower confidence than every permanent zone above — see events.json's own
  // "active": false flag on this entry. Update these dates each year, or the
  // section simply stops appearing once activeTo passes (by design).
  { eventName: 'Dolyak Race', zoneName: 'Labyrinthine Cliffs', expansion: 'Special Events', cycleLengthMin: TWO_HOUR, offsetMin: 0, chatLink: '[&BBwHAAA=]', activeFrom: '2026-08-11', activeTo: '2026-09-01' },
  { eventName: 'Treasure Hunt', zoneName: 'Labyrinthine Cliffs', expansion: 'Special Events', cycleLengthMin: TWO_HOUR, offsetMin: 30, chatLink: '[&BBwHAAA=]', activeFrom: '2026-08-11', activeTo: '2026-09-01' },
  { eventName: 'Skimmer Race', zoneName: 'Labyrinthine Cliffs', expansion: 'Special Events', cycleLengthMin: TWO_HOUR, offsetMin: 90, chatLink: '[&BBwHAAA=]', activeFrom: '2026-08-11', activeTo: '2026-09-01' },
];
