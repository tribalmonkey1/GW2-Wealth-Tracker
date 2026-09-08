/**
 * GW2 World Boss Schedule — ported directly from the C# reference app's
 * WorldBossScheduleData.cs. Fixed daily UTC spawn times, confirmed against
 * docs/reference/events.json (the same structured data file that powers the
 * wiki's own timer widget) plus the wiki's stated schedule for Awakened
 * Invasion (not present in events.json — see note below).
 *
 * dailySpawnTimesUtc entries are "HH:MM" 24h UTC strings. If GW2's schedule
 * ever changes, this is the one place to correct it — bossTimerCalc.js
 * derives everything else from this table.
 */

export const WORLD_BOSS_SCHEDULE = [
  { bossName: 'Admiral Taidha Covington', location: 'Bloodtide Coast', bossType: 'World Boss', expansion: 'Core Tyria',
    dailySpawnTimesUtc: ['00:00','03:00','06:00','09:00','12:00','15:00','18:00','21:00'], chatLink: '[&BKgBAAA=]' },

  { bossName: 'Svanir Shaman Chief', location: 'Wayfarer Foothills', bossType: 'World Boss', expansion: 'Core Tyria',
    dailySpawnTimesUtc: ['00:15','02:15','04:15','06:15','08:15','10:15','12:15','14:15','16:15','18:15','20:15','22:15'], chatLink: '[&BMIDAAA=]' },

  { bossName: 'Megadestroyer', location: 'Mount Maelstrom', bossType: 'World Boss', expansion: 'Core Tyria',
    dailySpawnTimesUtc: ['00:30','03:30','06:30','09:30','12:30','15:30','18:30','21:30'], chatLink: '[&BM0CAAA=]' },

  { bossName: 'Fire Elemental', location: 'Metrica Province', bossType: 'World Boss', expansion: 'Core Tyria',
    dailySpawnTimesUtc: ['00:45','02:45','04:45','06:45','08:45','10:45','12:45','14:45','16:45','18:45','20:45','22:45'], chatLink: '[&BEcAAAA=]' },

  { bossName: 'The Shatterer', location: 'Blazeridge Steppes', bossType: 'World Boss', expansion: 'Core Tyria',
    dailySpawnTimesUtc: ['01:00','04:00','07:00','10:00','13:00','16:00','19:00','22:00'], chatLink: '[&BE4DAAA=]' },

  { bossName: 'Great Jungle Wurm', location: 'Caledon Forest', bossType: 'World Boss', expansion: 'Core Tyria',
    dailySpawnTimesUtc: ['01:15','03:15','05:15','07:15','09:15','11:15','13:15','15:15','17:15','19:15','21:15','23:15'], chatLink: '[&BEEFAAA=]' },

  { bossName: 'Modniir Ulgoth', location: 'Harathi Hinterlands', bossType: 'World Boss', expansion: 'Core Tyria',
    dailySpawnTimesUtc: ['01:30','04:30','07:30','10:30','13:30','16:30','19:30','22:30'], chatLink: '[&BLAAAAA=]' },

  { bossName: 'Shadow Behemoth', location: 'Queensdale', bossType: 'World Boss', expansion: 'Core Tyria',
    dailySpawnTimesUtc: ['01:45','03:45','05:45','07:45','09:45','11:45','13:45','15:45','17:45','19:45','21:45','23:45'], chatLink: '[&BPcAAAA=]' },

  { bossName: 'Golem Mark II', location: 'Mount Maelstrom', bossType: 'World Boss', expansion: 'Core Tyria',
    dailySpawnTimesUtc: ['02:00','05:00','08:00','11:00','14:00','17:00','20:00','23:00'], chatLink: '[&BNQCAAA=]' },

  { bossName: 'Claw of Jormag', location: 'Frostgorge Sound', bossType: 'World Boss', expansion: 'Core Tyria',
    dailySpawnTimesUtc: ['02:30','05:30','08:30','11:30','14:30','17:30','20:30','23:30'], chatLink: '[&BHoCAAA=]' },

  { bossName: 'Tequatl the Sunless', location: 'Sparkfly Fen', bossType: 'Hardcore Meta', expansion: 'Core Tyria',
    dailySpawnTimesUtc: ['00:00','03:00','07:00','11:30','16:00','19:00'], chatLink: '[&BNABAAA=]' },

  { bossName: 'Evolved Jungle Wurm (Triple Trouble)', location: 'Bloodtide Coast', bossType: 'Hardcore Meta', expansion: 'Core Tyria',
    dailySpawnTimesUtc: ['01:00','04:00','08:00','12:30','17:00','20:00'], chatLink: '[&BKoBAAA=]' },

  { bossName: 'Karka Queen', location: 'Southsun Cove', bossType: 'Hardcore Meta', expansion: 'Core Tyria',
    dailySpawnTimesUtc: ['02:00','06:00','10:30','15:00','18:00','23:00'], chatLink: '[&BNUGAAA=]' },

  // Not in events.json — sourced from the wiki's own stated schedule directly
  // ("Defeat the invading Awakened" runs hourly at :30 since an April 2018
  // update). WHICH zone hosts each hour's invasion rotates on its own and
  // isn't tracked here — location is generic, chatLink is null since there's
  // no single fixed waypoint for a rotating zone.
  { bossName: 'Awakened Invasion', location: 'Elona (rotating zone)', bossType: 'Invasion', expansion: 'Living World Season 4',
    dailySpawnTimesUtc: ['00:30','01:30','02:30','03:30','04:30','05:30','06:30','07:30','08:30','09:30','10:30','11:30',
      '12:30','13:30','14:30','15:30','16:30','17:30','18:30','19:30','20:30','21:30','22:30','23:30'], chatLink: null },
];

// Fixed display order for the Areas filter / section grouping — NOT derived
// from whichever expansion happens to have the soonest occurrence right now,
// which would reorder itself second to second. Anything encountered that
// isn't listed here sorts after everything named.
export const EXPANSION_DISPLAY_ORDER = [
  'Core Tyria', 'Living World Season 1', 'Living World Season 2', 'Heart of Thorns',
  'Living World Season 3', 'Path of Fire', 'Living World Season 4', 'The Icebrood Saga',
  'End of Dragons', 'Secrets of the Obscure', 'Janthir Wilds', 'Visions of Eternity',
  'Special Events',
];

export function expansionSortKey(expansionName) {
  const idx = EXPANSION_DISPLAY_ORDER.indexOf(expansionName);
  return idx >= 0 ? idx : EXPANSION_DISPLAY_ORDER.length;
}

export const EXPANSION_ACCENT_COLORS = {
  'Core Tyria': '#C97B4A',
  'Living World Season 1': '#8A8680',
  'Living World Season 2': '#B08D57',
  'Heart of Thorns': '#4C8C6B',
  'Living World Season 3': '#6B8E4E',
  'Path of Fire': '#8B6DB5',
  'Living World Season 4': '#B0568C',
  'The Icebrood Saga': '#5B8DB8',
  'End of Dragons': '#A6567E',
  'Secrets of the Obscure': '#7B6DBE',
  'Janthir Wilds': '#4A7A96',
  'Visions of Eternity': '#9C6B4A',
  'Special Events': '#D4A72C',
};
export const EXPANSION_ACCENT_FALLBACK = '#888888';
