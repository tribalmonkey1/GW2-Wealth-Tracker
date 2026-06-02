/**
 * GW2 Legendary Weapon Data — Gen 1 + Gen 2 (partial)
 *
 * All item IDs and ingredient counts verified from:
 *  - GW2 API /v2/recipes scans
 *  - Wiki screenshots (May 2026)
 *
 * Gen 1 weapon-specific gift structure (confirmed from wiki):
 *   Gift of [Weapon] = Gift of [Material/Energy/Wood] + [Unique Sub-component]
 *                    + 100 Icy Runestones + 1 Superior Sigil of [X]
 *
 * Sub-component items that are account-bound crafted collectibles
 * (Wolf Statue, Unicorn Statue, Shark Statue, Eel Statue, Wolf Statue,
 *  Gift of Entertainment, Gift of Weather, Gift of History, Gift of Stealth,
 *  Gift of Water, Vial of Quicksilver) have null IDs — they display by name
 *  but have no TP price lookup.
 */

// ── Verified Item IDs ─────────────────────────────────────────────────────────
const ID = {
  // Shared gift outputs
  GIFT_OF_FORTUNE:          19626,
  GIFT_OF_MASTERY:          19674,
  GIFT_OF_MAGIC:            19673,
  GIFT_OF_MIGHT:            19672,
  GIFT_OF_BATTLE:           19678,
  GIFT_OF_EXPLORATION:      19677,
  ICY_RUNESTONE:            19676,

  // Gift of Might sub-components [API verified]
  GIFT_OF_CLAWS:            70801,
  GIFT_OF_SCALES:           75299,
  GIFT_OF_BONES:            71123,
  GIFT_OF_FANGS:            75744,

  // Gift of Magic sub-components [API verified]
  GIFT_OF_BLOOD:            71655,
  GIFT_OF_VENOM:            71787,
  GIFT_OF_TOTEMS:           73236,
  GIFT_OF_DUST:             73196,
  GIFT_OF_CONDENSED_MAGIC:  76530,
  GIFT_OF_CONDENSED_MIGHT:  70867,

  // Shared weapon building-block gifts [API verified]
  GIFT_OF_METAL:            19621,
  GIFT_OF_WOOD:             19622,
  GIFT_OF_ENERGY:           19623,

  // Sub-gifts used inside weapon-specific gifts [API verified]
  GIFT_OF_DARKNESS:         19631,   // sub of Gift of Twilight
  GIFT_OF_LIGHT:            19632,   // sub of Gift of Sunrise
  GIFT_OF_LIGHTNING:        19639,   // sub of Gift of Bolt
  GIFT_OF_COLOR:            19638,   // sub of Gift of The Bifrost
  GIFT_OF_ICE:              19624,   // sub of Gift of Frostfang
  GIFT_OF_NATURE:           19627,   // sub of Gift of Kudzu
  GIFT_OF_MUSIC:            19630,   // sub of Gift of The Minstrel

  // Dungeon-vendor sub-gifts (account-bound) [API verified]
  GIFT_OF_ASCALON:          19664,   // AC tokens
  GIFT_OF_ZHAITAN:          19669,   // Arah tokens   — sub of Gift of Color
  GIFT_OF_THE_SANCTUARY:    19670,   // HotW tokens   — sub of Gift of Ice
  GIFT_OF_THE_NOBLEMAN:     19665,   // CoF tokens    — sub of Gift of Music
  GIFT_OF_THORNS:           19667,   // TA tokens     — sub of Gift of Nature

  // Top-level weapon-specific gifts [wiki verified]
  GIFT_OF_TWILIGHT:         19648,
  GIFT_OF_SUNRISE:          19647,
  GIFT_OF_BOLT:             19655,
  GIFT_OF_FROSTFANG:        19625,
  GIFT_OF_INCINERATOR:      19645,
  GIFT_OF_THE_MOOT:         19650,
  GIFT_OF_QUIP:             19651,
  GIFT_OF_METEORLOGICUS:    19652,
  GIFT_OF_THE_MINSTREL:     19646,
  GIFT_OF_THE_FLAMESEEKER:  19653,
  GIFT_OF_RODGORT:          19656,
  GIFT_OF_HOWLER:           19662,
  GIFT_OF_THE_JUGGERNAUT:   19649,
  GIFT_OF_KUDZU:            19644,
  GIFT_OF_THE_PREDATOR:     19661,
  GIFT_OF_THE_DREAMER:      19660,
  GIFT_OF_THE_BIFROST:      19654,
  GIFT_OF_FRENZY:           19659,
  GIFT_OF_KOTAKI:           19657,
  GIFT_OF_KRAITKIN:         19658,

  // Unique sub-components used inside weapon gifts [wiki verified]
  VIAL_OF_LIQUID_FLAME:     19634,   // Chef-crafted; used by Incinerator + Rodgort
  // The following are account-bound collectibles with no TP listing:
  GIFT_OF_ENTERTAINMENT:    null,    // used by The Moot + Quip
  GIFT_OF_WEATHER:          null,    // used by Meteorlogicus
  GIFT_OF_HISTORY:          null,    // used by The Flameseeker Prophecies
  VIAL_OF_QUICKSILVER:      null,    // used by The Juggernaut
  WOLF_STATUE:              null,    // used by Howler
  GIFT_OF_STEALTH:          null,    // used by The Predator
  UNICORN_STATUE:           null,    // used by The Dreamer
  GIFT_OF_WATER:            null,    // used by Frenzy
  SHARK_STATUE:             null,    // used by Kamohoali'i Kotaki
  EEL_STATUE:               null,    // used by Kraitkin

  // Gen 2 mastery gifts [API scan]
  GIFT_OF_MAGUUMA_MASTERY:  73239,
  GIFT_OF_DESERT_MASTERY:   86036,
  GIFT_OF_MAGUUMA:          74927,
  GIFT_OF_THE_MISTS:        76427,

  // Gen 2 weapon gifts [API scan]
  GIFT_OF_THE_FLEET:        70797,
  GIFT_OF_NEVERMORE:        74300,
  GIFT_OF_HOPE:             77086,
  GIFT_OF_EUREKA:           79419,
  GIFT_OF_SHOOSHADOO:       79839,
  GIFT_OF_THE_COSMOS:       72083,
  GIFT_OF_EXORDIUM:         90893,
  GIFT_OF_PHARUS:           89445,
  GIFT_OF_IPOS:             85744,

  // Aurora chain [API scan + wiki screenshots]
  AURORA:                   81908,
  SPARK_OF_SENTIENCE:       81729,
  GIFT_OF_SENTIENCE:        81796,
  GIFT_OF_DRACONIC_MASTERY: 81861,
  MYSTIC_TRIBUTE:           71820,

  // Gen 1 legendary weapons
  ETERNITY:                 88933,
  THE_BIFROST:              88567,

  // Gen 1 precursors [API scan + wiki verified]
  DUSK:                     29185,   // Twilight
  DAWN:                     29169,   // Sunrise
  ZAP:                      29181,   // Bolt
  SPARK:                    29167,   // Incinerator  [wiki verified]
  THE_ENERGIZER:            29173,   // The Moot     [wiki verified]
  CHAOS_GUN:                29174,   // Quip         [wiki verified]
  STORM:                    29176,   // Meteorlogicus
  THE_BARD:                 29168,   // The Minstrel [wiki verified]
  THE_CHOSEN:               29177,   // The Flameseeker Prophecies
  RODGORTS_FLAME:           29182,   // Rodgort
  HOWL:                     29184,   // Howler
  THE_LEGEND:               29180,   // The Bifrost  [wiki verified]
  THE_COLOSSUS:             29170,   // The Juggernaut [wiki verified]
  LEAF_OF_KUDZU:            29172,   // Kudzu
  THE_HUNTER:               29175,   // The Predator
  THE_LOVER:                29178,   // The Dreamer
  TOOTH_OF_FROSTFANG:       29166,   // Frostfang
  VENOM:                    29183,   // Kraitkin
  RAGE:                     29179,   // Frenzy       [wiki verified]
  CARCHARIAS:               29171,   // Kamohoali'i Kotaki [wiki verified]
  THE_ANOMALY:              null,    // HOPE precursor — [MISSING]
  ARIA:                     null,    // Kotaki precursor (old name, may be Carcharias)

  // T6 fine crafting materials [API verified]
  VICIOUS_CLAW:             24351,
  LARGE_CLAW:               24350,
  SHARP_CLAW:               24349,
  CLAW:                     24348,
  ARMORED_SCALE:            24289,
  LARGE_SCALE:              24288,
  SMOOTH_SCALE:             24287,
  SCALE:                    24286,
  ANCIENT_BONE:             24358,
  LARGE_BONE:               24341,
  HEAVY_BONE:               24345,
  BONE:                     24344,
  VICIOUS_FANG:             24357,
  LARGE_FANG:               24356,
  SHARP_FANG:               24355,
  FANG:                     24354,
  VIAL_OF_POWERFUL_BLOOD:   24295,
  VIAL_OF_POTENT_BLOOD:     24294,
  VIAL_OF_THICK_BLOOD:      24293,
  VIAL_OF_BLOOD:            24292,
  POWERFUL_VENOM_SAC:       24283,
  POTENT_VENOM_SAC:         24282,
  FULL_VENOM_SAC:           24281,
  VENOM_SAC:                24280,
  ELABORATE_TOTEM:          24300,
  INTRICATE_TOTEM:          24299,
  ENGRAVED_TOTEM:           24363,
  TOTEM:                    24298,
  PILE_OF_CRYSTALLINE_DUST: 24277,
  PILE_OF_INCANDESCENT_DUST:24276,
  PILE_OF_LUMINOUS_DUST:    24275,
  PILE_OF_RADIANT_DUST:     24274,

  // Crafted materials [API verified]
  ORICHALCUM_INGOT:         19685,
  MITHRIL_INGOT:            19684,
  DARKSTEEL_INGOT:          19681,
  PLATINUM_INGOT:           19686,
  ANCIENT_WOOD_PLANK:       19712,
  ELDER_WOOD_PLANK:         19709,
  HARD_WOOD_PLANK:          19711,
  SEASONED_WOOD_PLANK:      19714,
  BOLT_OF_GOSSAMER:         19746,
  CURED_HARDENED_LEATHER:   19737,

  // Other materials
  MYSTIC_CLOVER:            19675,
  GLOB_OF_ECTOPLASM:        19721,
  MYSTIC_COIN:              19976,
  OBSIDIAN_SHARD:           19925,
  UNIDENTIFIED_DYE:         20323,
  OPAL_ORB:                 24522,
  OMNOMBERRY:               12128,
  ONYX_LODESTONE:           24310,
  CHARGED_LODESTONE:        24305,
  GLACIAL_LODESTONE:        24320,
  CORRUPTED_LODESTONE:      24340,
  MOLTEN_LODESTONE:         24302,
  DESTROYER_LODESTONE:      24312,

  // Superior Sigils — used in weapon-specific gifts [wiki verified]
  SIGIL_OF_BLOOD:           91604,   // Twilight
  SIGIL_OF_AIR:             91520,   // Sunrise, Bolt, Meteorlogicus
  SIGIL_OF_FIRE:            91559,   // Incinerator, Rodgort
  SIGIL_OF_ICE:             24555,   // Frostfang
  SIGIL_OF_ENERGY:          24607,   // The Moot, The Minstrel
  SIGIL_OF_STAMINA:         24592,   // Quip
  SIGIL_OF_BATTLE:          24601,   // The Flameseeker Prophecies
  SIGIL_OF_ACCURACY:        91607,   // Howler
  SIGIL_OF_BENEVOLENCE:     91382,   // The Juggernaut
  SIGIL_OF_CELERITY:        24865,   // Kudzu
  SIGIL_OF_FORCE:           24615,   // The Predator
  SIGIL_OF_PURITY:          91509,   // The Dreamer
  SIGIL_OF_NULLIFICATION:   24572,   // The Bifrost
  SIGIL_OF_RAGE:            91420,   // Frenzy
  SIGIL_OF_AGONY:           24612,   // Kamohoali'i Kotaki
  SIGIL_OF_VENOM:           24632,   // Kraitkin

  // Gen 2 weapons [API scan]
  NEVERMORE:                71383,
  HOPE:                     72713,
  ASTRALARIA:               76158,
  CHUKA_AND_CHAMPAWAT:      78556,
  SHOOSHADOO:               79802,
  EUREKA:                   79562,
  THE_SHINING_BLADE:        81957,
  THE_BINDING_OF_IPOS:      86098,
  CLAW_OF_THE_KHAN_UR:      87109,
  EXORDIUM:                 90551,
  PHARUS:                   89854,
};

// ── Ingredient helpers ─────────────────────────────────────────────────────────
function tp(itemId, name, count) {
  return { itemId, name, count, source: 'tp', inputs: [] };
}
function forge(itemId, name, count, inputs) {
  return { itemId, name, count, source: 'forge', accountBound: true, inputs };
}
function wvw(itemId, name, count, note) {
  return { itemId, name, count, source: 'wvw', accountBound: true, note, inputs: [] };
}
function exploration(itemId, name, count, note) {
  return { itemId, name, count, source: 'exploration', accountBound: true, note, inputs: [] };
}
function karma(itemId, name, count, note) {
  return { itemId, name, count, source: 'karma', note, inputs: [] };
}
function collection(itemId, name, count, note) {
  return { itemId, name, count, source: 'collection', accountBound: true, note, inputs: [] };
}
function precursor(itemId, name) {
  return {
    itemId, name, count: 1, source: 'tp', isPrecursor: true,
    note: 'Buy from TP or obtain via Mystic Forge (4× exotics) or account collection',
    inputs: [],
  };
}

// ── Shared components ──────────────────────────────────────────────────────────

// Gift of Might [wiki verified]
const GIFT_OF_MIGHT = forge(ID.GIFT_OF_MIGHT, 'Gift of Might', 1, [
  forge(ID.GIFT_OF_CLAWS, 'Gift of Claws', 1, [
    tp(ID.VICIOUS_CLAW, 'Vicious Claw', 100),
    tp(ID.LARGE_CLAW,   'Large Claw',   250),
    tp(ID.SHARP_CLAW,   'Sharp Claw',   50),
    tp(ID.CLAW,         'Claw',         50),
  ]),
  forge(ID.GIFT_OF_SCALES, 'Gift of Scales', 1, [
    tp(ID.ARMORED_SCALE, 'Armored Scale', 100),
    tp(ID.LARGE_SCALE,   'Large Scale',   250),
    tp(ID.SMOOTH_SCALE,  'Smooth Scale',  50),
    tp(ID.SCALE,         'Scale',         50),
  ]),
  forge(ID.GIFT_OF_BONES, 'Gift of Bones', 1, [
    tp(ID.ANCIENT_BONE, 'Ancient Bone', 100),
    tp(ID.LARGE_BONE,   'Large Bone',   250),
    tp(ID.HEAVY_BONE,   'Heavy Bone',   50),
    tp(ID.BONE,         'Bone',         50),
  ]),
  forge(ID.GIFT_OF_FANGS, 'Gift of Fangs', 1, [
    tp(ID.VICIOUS_FANG, 'Vicious Fang', 100),
    tp(ID.LARGE_FANG,   'Large Fang',   250),
    tp(ID.SHARP_FANG,   'Sharp Fang',   50),
    tp(ID.FANG,         'Fang',         50),
  ]),
]);

// Gift of Magic [wiki verified]
const GIFT_OF_MAGIC = forge(ID.GIFT_OF_MAGIC, 'Gift of Magic', 1, [
  forge(ID.GIFT_OF_BLOOD, 'Gift of Blood', 1, [
    tp(ID.VIAL_OF_POWERFUL_BLOOD, 'Vial of Powerful Blood', 100),
    tp(ID.VIAL_OF_POTENT_BLOOD,   'Vial of Potent Blood',   250),
    tp(ID.VIAL_OF_THICK_BLOOD,    'Vial of Thick Blood',    50),
    tp(ID.VIAL_OF_BLOOD,          'Vial of Blood',          50),
  ]),
  forge(ID.GIFT_OF_VENOM, 'Gift of Venom', 1, [
    tp(ID.POWERFUL_VENOM_SAC, 'Powerful Venom Sac', 100),
    tp(ID.POTENT_VENOM_SAC,   'Potent Venom Sac',   250),
    tp(ID.FULL_VENOM_SAC,     'Full Venom Sac',     50),
    tp(ID.VENOM_SAC,          'Venom Sac',          50),
  ]),
  forge(ID.GIFT_OF_TOTEMS, 'Gift of Totems', 1, [
    tp(ID.ELABORATE_TOTEM,  'Elaborate Totem',  100),
    tp(ID.INTRICATE_TOTEM,  'Intricate Totem',  250),
    tp(ID.ENGRAVED_TOTEM,   'Engraved Totem',   50),
    tp(ID.TOTEM,            'Totem',            50),
  ]),
  forge(ID.GIFT_OF_DUST, 'Gift of Dust', 1, [
    tp(ID.PILE_OF_CRYSTALLINE_DUST,  'Pile of Crystalline Dust',  100),
    tp(ID.PILE_OF_INCANDESCENT_DUST, 'Pile of Incandescent Dust', 250),
    tp(ID.PILE_OF_LUMINOUS_DUST,     'Pile of Luminous Dust',     50),
    tp(ID.PILE_OF_RADIANT_DUST,      'Pile of Radiant Dust',      50),
  ]),
]);

// Gift of Fortune [wiki verified]
const GIFT_OF_FORTUNE = forge(ID.GIFT_OF_FORTUNE, 'Gift of Fortune', 1, [
  tp(ID.MYSTIC_CLOVER,     'Mystic Clover',     77),
  tp(ID.GLOB_OF_ECTOPLASM, 'Glob of Ectoplasm', 250),
  { ...GIFT_OF_MIGHT },
  { ...GIFT_OF_MAGIC },
]);

// Gift of Mastery [wiki verified]
const GIFT_OF_MASTERY = forge(ID.GIFT_OF_MASTERY, 'Gift of Mastery', 1, [
  collection(null, 'Bloodstone Shard', 1, 'Account-bound — from Arah story path or HoT mastery vendor'),
  karma(ID.OBSIDIAN_SHARD, 'Obsidian Shard', 250, '1,050 Karma each (or Volatile/Unbound Magic + 96c)'),
  exploration(ID.GIFT_OF_EXPLORATION, 'Gift of Exploration', 1, '100% World Completion (all hearts, WPs, PoIs, Vistas)'),
  wvw(ID.GIFT_OF_BATTLE, 'Gift of Battle', 1, 'WvW Skirmish reward track'),
]);

// ── Shared weapon building-block gifts ────────────────────────────────────────

// Gift of Metal [API verified]
const GIFT_OF_METAL = forge(ID.GIFT_OF_METAL, 'Gift of Metal', 1, [
  tp(ID.ORICHALCUM_INGOT, 'Orichalcum Ingot', 250),
  tp(ID.MITHRIL_INGOT,    'Mithril Ingot',    250),
  tp(ID.DARKSTEEL_INGOT,  'Darksteel Ingot',  250),
  tp(ID.PLATINUM_INGOT,   'Platinum Ingot',   250),
]);

// Gift of Wood [API verified]
const GIFT_OF_WOOD = forge(ID.GIFT_OF_WOOD, 'Gift of Wood', 1, [
  tp(ID.ANCIENT_WOOD_PLANK,  'Ancient Wood Plank',  250),
  tp(ID.ELDER_WOOD_PLANK,    'Elder Wood Plank',    250),
  tp(ID.HARD_WOOD_PLANK,     'Hard Wood Plank',     250),
  tp(ID.SEASONED_WOOD_PLANK, 'Seasoned Wood Plank', 250),
]);

// Gift of Energy [API verified]
const GIFT_OF_ENERGY = forge(ID.GIFT_OF_ENERGY, 'Gift of Energy', 1, [
  tp(ID.PILE_OF_CRYSTALLINE_DUST,  'Pile of Crystalline Dust',  250),
  tp(ID.PILE_OF_INCANDESCENT_DUST, 'Pile of Incandescent Dust', 250),
  tp(ID.PILE_OF_LUMINOUS_DUST,     'Pile of Luminous Dust',     250),
  tp(ID.PILE_OF_RADIANT_DUST,      'Pile of Radiant Dust',      250),
]);

// ── Sub-gifts used inside weapon-specific gifts ────────────────────────────────

// Gift of Ascalon — dungeon vendor [API verified]
const GIFT_OF_ASCALON = collection(ID.GIFT_OF_ASCALON, 'Gift of Ascalon', 1,
  'Purchase from Dungeon Merchant for 500 Ascalonian Catacombs tokens');

// Gift of Darkness [API verified] — sub of Gift of Twilight
const GIFT_OF_DARKNESS = forge(ID.GIFT_OF_DARKNESS, 'Gift of Darkness', 1, [
  tp(ID.ORICHALCUM_INGOT,       'Orichalcum Ingot',              250),
  tp(ID.ONYX_LODESTONE,         'Onyx Lodestone',                100),
  { ...GIFT_OF_ASCALON },
  tp(ID.CURED_HARDENED_LEATHER, 'Cured Hardened Leather Square', 250),
]);

// Gift of Light [API verified] — sub of Gift of Sunrise
const GIFT_OF_LIGHT = forge(ID.GIFT_OF_LIGHT, 'Gift of Light', 1, [
  tp(ID.ORICHALCUM_INGOT,       'Orichalcum Ingot',              250),
  tp(ID.CHARGED_LODESTONE,      'Charged Lodestone',             100),
  { ...GIFT_OF_ASCALON },
  tp(ID.CURED_HARDENED_LEATHER, 'Cured Hardened Leather Square', 250),
]);

// Gift of Lightning [API verified] — sub of Gift of Bolt
const GIFT_OF_LIGHTNING = forge(ID.GIFT_OF_LIGHTNING, 'Gift of Lightning', 1, [
  tp(ID.ORICHALCUM_INGOT,  'Orichalcum Ingot',  250),
  tp(ID.CHARGED_LODESTONE, 'Charged Lodestone', 100),
  tp(ID.BOLT_OF_GOSSAMER,  'Bolt of Gossamer',  250),
  { ...GIFT_OF_ASCALON },
]);

// Gift of Color [API verified] — sub of Gift of The Bifrost
const GIFT_OF_COLOR = forge(ID.GIFT_OF_COLOR, 'Gift of Color', 1, [
  tp(ID.UNIDENTIFIED_DYE,         'Unidentified Dye',         100),
  tp(ID.OPAL_ORB,                 'Opal Orb',                 100),
  tp(ID.PILE_OF_CRYSTALLINE_DUST, 'Pile of Crystalline Dust', 250),
  collection(ID.GIFT_OF_ZHAITAN,  'Gift of Zhaitan',          1,
    'Purchase from Dungeon Merchant for 500 Arah tokens'),
]);

// Gift of Ice [API verified] — sub of Gift of Frostfang
const GIFT_OF_ICE = forge(ID.GIFT_OF_ICE, 'Gift of Ice', 1, [
  tp(ID.ORICHALCUM_INGOT,   'Orichalcum Ingot',   250),
  tp(ID.GLACIAL_LODESTONE,  'Glacial Lodestone',  100),
  collection(ID.GIFT_OF_THE_SANCTUARY, 'Gift of the Sanctuary', 1,
    'Purchase from Dungeon Merchant for 500 Honor of the Waves tokens'),
  tp(ID.CORRUPTED_LODESTONE, 'Corrupted Lodestone', 100),
]);

// Gift of Nature [API verified] — sub of Gift of Kudzu
const GIFT_OF_NATURE = forge(ID.GIFT_OF_NATURE, 'Gift of Nature', 1, [
  tp(ID.OMNOMBERRY,            'Omnomberry',                    250),
  tp(ID.ANCIENT_WOOD_PLANK,    'Ancient Wood Plank',            250),
  collection(ID.GIFT_OF_THORNS, 'Gift of Thorns',               1,
    'Purchase from Dungeon Merchant for 500 Twilight Arbor tokens'),
  tp(ID.CURED_HARDENED_LEATHER, 'Cured Hardened Leather Square', 250),
]);

// Gift of Music [API verified] — sub of Gift of The Minstrel
const GIFT_OF_MUSIC = forge(ID.GIFT_OF_MUSIC, 'Gift of Music', 1, [
  tp(ID.ORICHALCUM_INGOT,  'Orichalcum Ingot', 250),
  tp(ID.BOLT_OF_GOSSAMER,  'Bolt of Gossamer', 250),
  collection(ID.GIFT_OF_THE_NOBLEMAN, 'Gift of the Nobleman', 1,
    'Purchase from Dungeon Merchant for 500 Citadel of Flame tokens'),
  tp(ID.OPAL_ORB, 'Opal Orb', 100),
]);

// Vial of Liquid Flame [wiki verified — ID 19634, Chef crafted]
// Shared by Incinerator and Rodgort
const VIAL_OF_LIQUID_FLAME = {
  itemId: ID.VIAL_OF_LIQUID_FLAME,
  name: 'Vial of Liquid Flame',
  count: 1,
  source: 'forge',
  accountBound: true,
  note: 'Chef 400 — crafted from 250 Ghost Pepper + 1 Gift of Baelfire + 100 Molten Lodestone + 100 Destroyer Lodestone',
  inputs: [
    tp(null, 'Ghost Pepper', 250),
    collection(null, 'Gift of Baelfire', 1, 'Account-bound — crafted via Legendary: Incinerator/Rodgort collection'),
    tp(ID.MOLTEN_LODESTONE,    'Molten Lodestone',    100),
    tp(ID.DESTROYER_LODESTONE, 'Destroyer Lodestone', 100),
  ],
};

// ── Top-level weapon-specific gifts [wiki verified] ────────────────────────────

// Gift of Twilight [wiki verified]
const GIFT_OF_TWILIGHT = forge(ID.GIFT_OF_TWILIGHT, 'Gift of Twilight', 1, [
  { ...GIFT_OF_METAL },
  { ...GIFT_OF_DARKNESS },
  tp(ID.ICY_RUNESTONE,    'Icy Runestone',           100),
  tp(ID.SIGIL_OF_BLOOD,   'Superior Sigil of Blood',  1),
]);

// Gift of Sunrise [wiki verified]
const GIFT_OF_SUNRISE = forge(ID.GIFT_OF_SUNRISE, 'Gift of Sunrise', 1, [
  { ...GIFT_OF_METAL },
  { ...GIFT_OF_LIGHT },
  tp(ID.ICY_RUNESTONE,   'Icy Runestone',          100),
  tp(ID.SIGIL_OF_AIR,    'Superior Sigil of Air',   1),
]);

// Gift of Bolt [wiki verified — ID 19655]
const GIFT_OF_BOLT = forge(ID.GIFT_OF_BOLT, 'Gift of Bolt', 1, [
  { ...GIFT_OF_METAL },
  { ...GIFT_OF_LIGHTNING },
  tp(ID.ICY_RUNESTONE,   'Icy Runestone',          100),
  tp(ID.SIGIL_OF_AIR,    'Superior Sigil of Air',   1),
]);

// Gift of Frostfang [wiki verified — ID 19625]
const GIFT_OF_FROSTFANG = forge(ID.GIFT_OF_FROSTFANG, 'Gift of Frostfang', 1, [
  { ...GIFT_OF_METAL },
  { ...GIFT_OF_ICE },
  tp(ID.ICY_RUNESTONE,   'Icy Runestone',          100),
  tp(ID.SIGIL_OF_ICE,    'Superior Sigil of Ice',   1),
]);

// Gift of Incinerator [wiki verified — ID 19645]
const GIFT_OF_INCINERATOR = forge(ID.GIFT_OF_INCINERATOR, 'Gift of Incinerator', 1, [
  { ...GIFT_OF_METAL },
  { ...VIAL_OF_LIQUID_FLAME },
  tp(ID.ICY_RUNESTONE,   'Icy Runestone',          100),
  tp(ID.SIGIL_OF_FIRE,   'Superior Sigil of Fire',  1),
]);

// Gift of The Moot [wiki verified — ID 19650]
const GIFT_OF_THE_MOOT = forge(ID.GIFT_OF_THE_MOOT, 'Gift of The Moot', 1, [
  { ...GIFT_OF_METAL },
  { itemId: ID.GIFT_OF_ENTERTAINMENT, name: 'Gift of Entertainment', count: 1,
    source: 'collection', accountBound: true,
    note: 'Account-bound crafted item — obtained via The Moot collection chain', inputs: [] },
  tp(ID.ICY_RUNESTONE,    'Icy Runestone',            100),
  tp(ID.SIGIL_OF_ENERGY,  'Superior Sigil of Energy',  1),
]);

// Gift of Quip [wiki verified — ID 19651]
const GIFT_OF_QUIP = forge(ID.GIFT_OF_QUIP, 'Gift of Quip', 1, [
  { ...GIFT_OF_WOOD },
  { itemId: ID.GIFT_OF_ENTERTAINMENT, name: 'Gift of Entertainment', count: 1,
    source: 'collection', accountBound: true,
    note: 'Account-bound crafted item — obtained via Quip collection chain', inputs: [] },
  tp(ID.ICY_RUNESTONE,    'Icy Runestone',              100),
  tp(ID.SIGIL_OF_STAMINA, 'Superior Sigil of Stamina',   1),
]);

// Gift of Meteorlogicus [wiki verified — ID 19652]
const GIFT_OF_METEORLOGICUS = forge(ID.GIFT_OF_METEORLOGICUS, 'Gift of Meteorlogicus', 1, [
  { ...GIFT_OF_ENERGY },
  { itemId: ID.GIFT_OF_WEATHER, name: 'Gift of Weather', count: 1,
    source: 'collection', accountBound: true,
    note: 'Account-bound crafted item — obtained via Meteorlogicus collection chain', inputs: [] },
  tp(ID.ICY_RUNESTONE,   'Icy Runestone',          100),
  tp(ID.SIGIL_OF_AIR,    'Superior Sigil of Air',   1),
]);

// Gift of The Minstrel [wiki verified — ID 19646]
const GIFT_OF_THE_MINSTREL = forge(ID.GIFT_OF_THE_MINSTREL, 'Gift of The Minstrel', 1, [
  { ...GIFT_OF_ENERGY },
  { ...GIFT_OF_MUSIC },
  tp(ID.ICY_RUNESTONE,    'Icy Runestone',            100),
  tp(ID.SIGIL_OF_ENERGY,  'Superior Sigil of Energy',  1),
]);

// Gift of The Flameseeker Prophecies [wiki verified — ID 19653]
const GIFT_OF_THE_FLAMESEEKER = forge(ID.GIFT_OF_THE_FLAMESEEKER, 'Gift of The Flameseeker Prophecies', 1, [
  { ...GIFT_OF_METAL },
  { itemId: ID.GIFT_OF_HISTORY, name: 'Gift of History', count: 1,
    source: 'collection', accountBound: true,
    note: 'Account-bound crafted item — obtained via The Flameseeker Prophecies collection chain', inputs: [] },
  tp(ID.ICY_RUNESTONE,    'Icy Runestone',             100),
  tp(ID.SIGIL_OF_BATTLE,  'Superior Sigil of Battle',   1),
]);

// Gift of Rodgort [wiki verified — ID 19656]
const GIFT_OF_RODGORT = forge(ID.GIFT_OF_RODGORT, 'Gift of Rodgort', 1, [
  { ...GIFT_OF_WOOD },
  { ...VIAL_OF_LIQUID_FLAME },
  tp(ID.ICY_RUNESTONE,   'Icy Runestone',          100),
  tp(ID.SIGIL_OF_FIRE,   'Superior Sigil of Fire',  1),
]);

// Gift of Howler [wiki verified — ID 19662]
const GIFT_OF_HOWLER = forge(ID.GIFT_OF_HOWLER, 'Gift of Howler', 1, [
  { ...GIFT_OF_WOOD },
  { itemId: ID.WOLF_STATUE, name: 'Wolf Statue', count: 1,
    source: 'collection', accountBound: true,
    note: 'Account-bound crafted item — obtained via Howler collection chain', inputs: [] },
  tp(ID.ICY_RUNESTONE,     'Icy Runestone',              100),
  tp(ID.SIGIL_OF_ACCURACY, 'Superior Sigil of Accuracy',  1),
]);

// Gift of The Juggernaut [wiki verified — ID 19649]
const GIFT_OF_THE_JUGGERNAUT = forge(ID.GIFT_OF_THE_JUGGERNAUT, 'Gift of The Juggernaut', 1, [
  { ...GIFT_OF_METAL },
  { itemId: ID.VIAL_OF_QUICKSILVER, name: 'Vial of Quicksilver', count: 1,
    source: 'collection', accountBound: true,
    note: 'Account-bound crafted item — obtained via The Juggernaut collection chain', inputs: [] },
  tp(ID.ICY_RUNESTONE,       'Icy Runestone',                100),
  tp(ID.SIGIL_OF_BENEVOLENCE,'Superior Sigil of Benevolence', 1),
]);

// Gift of Kudzu [wiki verified — ID 19644]
const GIFT_OF_KUDZU = forge(ID.GIFT_OF_KUDZU, 'Gift of Kudzu', 1, [
  { ...GIFT_OF_WOOD },
  { ...GIFT_OF_NATURE },
  tp(ID.ICY_RUNESTONE,     'Icy Runestone',             100),
  tp(ID.SIGIL_OF_CELERITY, 'Superior Sigil of Celerity', 1),
]);

// Gift of The Predator [wiki verified — ID 19661]
const GIFT_OF_THE_PREDATOR = forge(ID.GIFT_OF_THE_PREDATOR, 'Gift of The Predator', 1, [
  { ...GIFT_OF_WOOD },
  { itemId: ID.GIFT_OF_STEALTH, name: 'Gift of Stealth', count: 1,
    source: 'collection', accountBound: true,
    note: 'Account-bound crafted item — obtained via The Predator collection chain', inputs: [] },
  tp(ID.ICY_RUNESTONE,    'Icy Runestone',           100),
  tp(ID.SIGIL_OF_FORCE,   'Superior Sigil of Force',  1),
]);

// Gift of The Dreamer [wiki verified — ID 19660]
const GIFT_OF_THE_DREAMER = forge(ID.GIFT_OF_THE_DREAMER, 'Gift of The Dreamer', 1, [
  { ...GIFT_OF_WOOD },
  { itemId: ID.UNICORN_STATUE, name: 'Unicorn Statue', count: 1,
    source: 'collection', accountBound: true,
    note: 'Account-bound crafted item — obtained via The Dreamer collection chain', inputs: [] },
  tp(ID.ICY_RUNESTONE,    'Icy Runestone',           100),
  tp(ID.SIGIL_OF_PURITY,  'Superior Sigil of Purity', 1),
]);

// Gift of The Bifrost [wiki verified — ID 19654]
const GIFT_OF_THE_BIFROST = forge(ID.GIFT_OF_THE_BIFROST, 'Gift of The Bifrost', 1, [
  { ...GIFT_OF_ENERGY },
  { ...GIFT_OF_COLOR },
  tp(ID.ICY_RUNESTONE,         'Icy Runestone',                100),
  tp(ID.SIGIL_OF_NULLIFICATION,'Superior Sigil of Nullification', 1),
]);

// Gift of Frenzy [wiki verified — ID 19659]
const GIFT_OF_FRENZY = forge(ID.GIFT_OF_FRENZY, 'Gift of Frenzy', 1, [
  { ...GIFT_OF_WOOD },
  { itemId: ID.GIFT_OF_WATER, name: 'Gift of Water', count: 1,
    source: 'collection', accountBound: true,
    note: 'Account-bound crafted item — obtained via Frenzy collection chain', inputs: [] },
  tp(ID.ICY_RUNESTONE,   'Icy Runestone',          100),
  tp(ID.SIGIL_OF_RAGE,   'Superior Sigil of Rage',  1),
]);

// Gift of Kamohoali'i Kotaki [wiki verified — ID 19657]
const GIFT_OF_KOTAKI = forge(ID.GIFT_OF_KOTAKI, "Gift of Kamohoali'i Kotaki", 1, [
  { ...GIFT_OF_METAL },
  { itemId: ID.SHARK_STATUE, name: 'Shark Statue', count: 1,
    source: 'collection', accountBound: true,
    note: "Account-bound crafted item — obtained via Kamohoali'i Kotaki collection chain", inputs: [] },
  tp(ID.ICY_RUNESTONE,   'Icy Runestone',          100),
  tp(ID.SIGIL_OF_AGONY,  'Superior Sigil of Agony', 1),
]);

// Gift of Kraitkin [wiki verified — ID 19658]
const GIFT_OF_KRAITKIN = forge(ID.GIFT_OF_KRAITKIN, 'Gift of Kraitkin', 1, [
  { ...GIFT_OF_ENERGY },
  { itemId: ID.EEL_STATUE, name: 'Eel Statue', count: 1,
    source: 'collection', accountBound: true,
    note: 'Account-bound crafted item — obtained via Kraitkin collection chain', inputs: [] },
  tp(ID.ICY_RUNESTONE,   'Icy Runestone',          100),
  tp(ID.SIGIL_OF_VENOM,  'Superior Sigil of Venom', 1),
]);

// ── Gen 2 shared components ────────────────────────────────────────────────────

const MYSTIC_TRIBUTE = forge(ID.MYSTIC_TRIBUTE, 'Mystic Tribute', 1, [
  forge(ID.GIFT_OF_CONDENSED_MAGIC, 'Gift of Condensed Magic', 2, [
    forge(ID.GIFT_OF_BLOOD, 'Gift of Blood', 1, [
      tp(ID.VIAL_OF_POWERFUL_BLOOD, 'Vial of Powerful Blood', 100),
      tp(ID.VIAL_OF_POTENT_BLOOD,   'Vial of Potent Blood',   250),
      tp(ID.VIAL_OF_THICK_BLOOD,    'Vial of Thick Blood',    50),
      tp(ID.VIAL_OF_BLOOD,          'Vial of Blood',          50),
    ]),
    forge(ID.GIFT_OF_VENOM, 'Gift of Venom', 1, [
      tp(ID.POWERFUL_VENOM_SAC, 'Powerful Venom Sac', 100),
      tp(ID.POTENT_VENOM_SAC,   'Potent Venom Sac',   250),
      tp(ID.FULL_VENOM_SAC,     'Full Venom Sac',     50),
      tp(ID.VENOM_SAC,          'Venom Sac',          50),
    ]),
    forge(ID.GIFT_OF_TOTEMS, 'Gift of Totems', 1, [
      tp(ID.ELABORATE_TOTEM,  'Elaborate Totem',  100),
      tp(ID.INTRICATE_TOTEM,  'Intricate Totem',  250),
      tp(ID.ENGRAVED_TOTEM,   'Engraved Totem',   50),
      tp(ID.TOTEM,            'Totem',            50),
    ]),
    forge(ID.GIFT_OF_DUST, 'Gift of Dust', 1, [
      tp(ID.PILE_OF_CRYSTALLINE_DUST,  'Pile of Crystalline Dust',  100),
      tp(ID.PILE_OF_INCANDESCENT_DUST, 'Pile of Incandescent Dust', 250),
      tp(ID.PILE_OF_LUMINOUS_DUST,     'Pile of Luminous Dust',     50),
      tp(ID.PILE_OF_RADIANT_DUST,      'Pile of Radiant Dust',      50),
    ]),
  ]),
  forge(ID.GIFT_OF_CONDENSED_MIGHT, 'Gift of Condensed Might', 2, [
    forge(ID.GIFT_OF_CLAWS, 'Gift of Claws', 1, [
      tp(ID.VICIOUS_CLAW, 'Vicious Claw', 100),
      tp(ID.LARGE_CLAW,   'Large Claw',   250),
      tp(ID.SHARP_CLAW,   'Sharp Claw',   50),
      tp(ID.CLAW,         'Claw',         50),
    ]),
    forge(ID.GIFT_OF_SCALES, 'Gift of Scales', 1, [
      tp(ID.ARMORED_SCALE, 'Armored Scale', 100),
      tp(ID.LARGE_SCALE,   'Large Scale',   250),
      tp(ID.SMOOTH_SCALE,  'Smooth Scale',  50),
      tp(ID.SCALE,         'Scale',         50),
    ]),
    forge(ID.GIFT_OF_BONES, 'Gift of Bones', 1, [
      tp(ID.ANCIENT_BONE, 'Ancient Bone', 100),
      tp(ID.LARGE_BONE,   'Large Bone',   250),
      tp(ID.HEAVY_BONE,   'Heavy Bone',   50),
      tp(ID.BONE,         'Bone',         50),
    ]),
    forge(ID.GIFT_OF_FANGS, 'Gift of Fangs', 1, [
      tp(ID.VICIOUS_FANG, 'Vicious Fang', 100),
      tp(ID.LARGE_FANG,   'Large Fang',   250),
      tp(ID.SHARP_FANG,   'Sharp Fang',   50),
      tp(ID.FANG,         'Fang',         50),
    ]),
  ]),
  tp(ID.MYSTIC_CLOVER, 'Mystic Clover', 77),
  tp(ID.MYSTIC_COIN,   'Mystic Coin',   250),
]);

const GIFT_OF_MAGUUMA_MASTERY = forge(ID.GIFT_OF_MAGUUMA_MASTERY, 'Gift of Maguuma Mastery', 1, [
  collection(ID.GIFT_OF_MAGUUMA, 'Gift of Maguuma', 1,
    'HoT map completion (Verdant Brink, Auric Basin, Tangled Depths, Dragon Stand)'),
  collection(null, 'Gift of Insight', 1, 'Hero challenges in Heart of Thorns maps'),
  tp(ID.GLOB_OF_ECTOPLASM, 'Glob of Ectoplasm', 50),
  karma(ID.OBSIDIAN_SHARD,  'Obsidian Shard',    50, '1,050 Karma each'),
]);

const GIFT_OF_DESERT_MASTERY = forge(ID.GIFT_OF_DESERT_MASTERY, 'Gift of Desert Mastery', 1, [
  collection(null, 'Gift of the Desert', 1,
    'PoF map completion (Crystal Oasis, Desert Highlands, Elon Riverlands, The Desolation, Domain of Vabbi)'),
  collection(null, 'Gift of Desolation', 1, 'Hero challenges in Path of Fire maps'),
  tp(ID.GLOB_OF_ECTOPLASM, 'Glob of Ectoplasm', 50),
  karma(ID.OBSIDIAN_SHARD,  'Obsidian Shard',    50, '1,050 Karma each'),
]);

// ── Gen 1 Legendary Weapon Recipes ────────────────────────────────────────────

export const LEGENDARY_RECIPES = [

  // ── Twilight (Greatsword) ─────────────────────────────────────────────────
  {
    id: 'legendary_twilight',
    name: 'Twilight',
    itemId: null,
    rarity: 'Legendary', weaponType: 'Greatsword', generation: 1,
    inputs: [
      precursor(ID.DUSK, 'Dusk'),
      { ...GIFT_OF_TWILIGHT },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── Sunrise (Greatsword) ──────────────────────────────────────────────────
  {
    id: 'legendary_sunrise',
    name: 'Sunrise',
    itemId: null,
    rarity: 'Legendary', weaponType: 'Greatsword', generation: 1,
    inputs: [
      precursor(ID.DAWN, 'Dawn'),
      { ...GIFT_OF_SUNRISE },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── Eternity (Greatsword) ─────────────────────────────────────────────────
  {
    id: 'legendary_eternity',
    name: 'Eternity',
    itemId: ID.ETERNITY,
    rarity: 'Legendary', weaponType: 'Greatsword', generation: 1,
    note: 'Combine Twilight + Sunrise in Mystic Forge',
    inputs: [
      tp(null,                        'Twilight',                   1),
      tp(null,                        'Sunrise',                    1),
      tp(ID.MYSTIC_COIN,              'Mystic Coin',                100),
      tp(ID.PILE_OF_CRYSTALLINE_DUST, 'Pile of Crystalline Dust',   250),
    ],
  },

  // ── Bolt (Sword) ──────────────────────────────────────────────────────────
  {
    id: 'legendary_bolt',
    name: 'Bolt',
    itemId: null,
    rarity: 'Legendary', weaponType: 'Sword', generation: 1,
    inputs: [
      precursor(ID.ZAP, 'Zap'),
      { ...GIFT_OF_BOLT },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── Frostfang (Axe) ───────────────────────────────────────────────────────
  {
    id: 'legendary_frostfang',
    name: 'Frostfang',
    itemId: null,
    rarity: 'Legendary', weaponType: 'Axe', generation: 1,
    inputs: [
      precursor(ID.TOOTH_OF_FROSTFANG, 'Tooth of Frostfang'),
      { ...GIFT_OF_FROSTFANG },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── Incinerator (Dagger) ──────────────────────────────────────────────────
  {
    id: 'legendary_incinerator',
    name: 'Incinerator',
    itemId: null,
    rarity: 'Legendary', weaponType: 'Dagger', generation: 1,
    inputs: [
      precursor(ID.SPARK, 'Spark'),
      { ...GIFT_OF_INCINERATOR },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── The Moot (Mace) ───────────────────────────────────────────────────────
  {
    id: 'legendary_moot',
    name: 'The Moot',
    itemId: null,
    rarity: 'Legendary', weaponType: 'Mace', generation: 1,
    inputs: [
      precursor(ID.THE_ENERGIZER, 'The Energizer'),
      { ...GIFT_OF_THE_MOOT },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── Quip (Pistol) ─────────────────────────────────────────────────────────
  {
    id: 'legendary_quip',
    name: 'Quip',
    itemId: null,
    rarity: 'Legendary', weaponType: 'Pistol', generation: 1,
    inputs: [
      precursor(ID.CHAOS_GUN, 'Chaos Gun'),
      { ...GIFT_OF_QUIP },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── Meteorlogicus (Scepter) ───────────────────────────────────────────────
  {
    id: 'legendary_meteorlogicus',
    name: 'Meteorlogicus',
    itemId: null,
    rarity: 'Legendary', weaponType: 'Scepter', generation: 1,
    inputs: [
      precursor(ID.STORM, 'Storm'),
      { ...GIFT_OF_METEORLOGICUS },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── The Minstrel (Focus) ──────────────────────────────────────────────────
  {
    id: 'legendary_minstrel',
    name: 'The Minstrel',
    itemId: null,
    rarity: 'Legendary', weaponType: 'Focus', generation: 1,
    inputs: [
      precursor(ID.THE_BARD, 'The Bard'),
      { ...GIFT_OF_THE_MINSTREL },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── The Flameseeker Prophecies (Shield) ───────────────────────────────────
  {
    id: 'legendary_flameseeker',
    name: 'The Flameseeker Prophecies',
    itemId: null,
    rarity: 'Legendary', weaponType: 'Shield', generation: 1,
    inputs: [
      precursor(ID.THE_CHOSEN, 'The Chosen'),
      { ...GIFT_OF_THE_FLAMESEEKER },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── Rodgort (Torch) ───────────────────────────────────────────────────────
  {
    id: 'legendary_rodgort',
    name: 'Rodgort',
    itemId: null,
    rarity: 'Legendary', weaponType: 'Torch', generation: 1,
    inputs: [
      precursor(ID.RODGORTS_FLAME, "Rodgort's Flame"),
      { ...GIFT_OF_RODGORT },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── Howler (Warhorn) ──────────────────────────────────────────────────────
  {
    id: 'legendary_howler',
    name: 'Howler',
    itemId: null,
    rarity: 'Legendary', weaponType: 'Warhorn', generation: 1,
    inputs: [
      precursor(ID.HOWL, 'Howl'),
      { ...GIFT_OF_HOWLER },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── The Juggernaut (Hammer) ───────────────────────────────────────────────
  {
    id: 'legendary_juggernaut',
    name: 'The Juggernaut',
    itemId: null,
    rarity: 'Legendary', weaponType: 'Hammer', generation: 1,
    inputs: [
      precursor(ID.THE_COLOSSUS, 'The Colossus'),
      { ...GIFT_OF_THE_JUGGERNAUT },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── Kudzu (Long Bow) ──────────────────────────────────────────────────────
  {
    id: 'legendary_kudzu',
    name: 'Kudzu',
    itemId: null,
    rarity: 'Legendary', weaponType: 'Long Bow', generation: 1,
    inputs: [
      precursor(ID.LEAF_OF_KUDZU, 'Leaf of Kudzu'),
      { ...GIFT_OF_KUDZU },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── The Predator (Rifle) ──────────────────────────────────────────────────
  {
    id: 'legendary_predator',
    name: 'The Predator',
    itemId: null,
    rarity: 'Legendary', weaponType: 'Rifle', generation: 1,
    inputs: [
      precursor(ID.THE_HUNTER, 'The Hunter'),
      { ...GIFT_OF_THE_PREDATOR },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── The Dreamer (Short Bow) ───────────────────────────────────────────────
  {
    id: 'legendary_dreamer',
    name: 'The Dreamer',
    itemId: null,
    rarity: 'Legendary', weaponType: 'Short Bow', generation: 1,
    inputs: [
      precursor(ID.THE_LOVER, 'The Lover'),
      { ...GIFT_OF_THE_DREAMER },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── The Bifrost (Staff) ───────────────────────────────────────────────────
  {
    id: 'legendary_bifrost',
    name: 'The Bifrost',
    itemId: ID.THE_BIFROST,
    rarity: 'Legendary', weaponType: 'Staff', generation: 1,
    inputs: [
      precursor(ID.THE_LEGEND, 'The Legend'),
      { ...GIFT_OF_THE_BIFROST },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── Frenzy (Harpoon Gun) ──────────────────────────────────────────────────
  {
    id: 'legendary_frenzy',
    name: 'Frenzy',
    itemId: null,
    rarity: 'Legendary', weaponType: 'Harpoon Gun', generation: 1,
    inputs: [
      precursor(ID.RAGE, 'Rage'),
      { ...GIFT_OF_FRENZY },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── Kamohoali'i Kotaki (Spear) ────────────────────────────────────────────
  {
    id: 'legendary_kotaki',
    name: "Kamohoali'i Kotaki",
    itemId: null,
    rarity: 'Legendary', weaponType: 'Spear', generation: 1,
    inputs: [
      precursor(ID.CARCHARIAS, 'Carcharias'),
      { ...GIFT_OF_KOTAKI },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── Kraitkin (Trident) ────────────────────────────────────────────────────
  {
    id: 'legendary_kraitkin',
    name: 'Kraitkin',
    itemId: null,
    rarity: 'Legendary', weaponType: 'Trident', generation: 1,
    inputs: [
      precursor(ID.VENOM, 'Venom'),
      { ...GIFT_OF_KRAITKIN },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

];

// ── Cost Calculation ───────────────────────────────────────────────────────────
export function calcLegendaryMissingCost(node, neededCount, priceMap, ownedMap, visited = new Set()) {
  const count = neededCount ?? node.count ?? 1;
  if (['wvw', 'exploration', 'heroics', 'collection', 'karma'].includes(node.source)) return 0;

  const itemId = node.itemId;
  const owned  = itemId ? (ownedMap[itemId] || 0) : 0;
  const shortfall = Math.max(0, count - owned);
  if (shortfall === 0) return 0;

  if (node.accountBound && node.inputs?.length > 0 && !visited.has(node.name)) {
    const v2 = new Set(visited).add(node.name);
    return node.inputs.reduce((sum, inp) =>
      sum + calcLegendaryMissingCost(inp, inp.count * shortfall, priceMap, ownedMap, v2), 0);
  }

  if (node.inputs?.length > 0 && !visited.has(node.name)) {
    const tpSell = itemId ? (priceMap[itemId]?.sells?.unit_price || 0) : 0;
    const tpCost = tpSell * shortfall;
    const v2 = new Set(visited).add(node.name);
    const craftCost = node.inputs.reduce((sum, inp) =>
      sum + calcLegendaryMissingCost(inp, inp.count * shortfall, priceMap, ownedMap, v2), 0);
    if (tpSell > 0 && tpCost <= craftCost) return tpCost;
    if (craftCost > 0) return craftCost;
    return tpCost;
  }

  const tpSell = itemId ? (priceMap[itemId]?.sells?.unit_price || 0) : 0;
  return tpSell * shortfall;
}

export function resolveLegendaryIds(recipes, itemMap) {
  const nameToId = {};
  for (const [id, item] of Object.entries(itemMap)) {
    if (item?.name) nameToId[item.name] = Number(id);
  }
  function resolveNode(node) {
    const resolved = { ...node };
    if (!resolved.itemId && resolved.name) {
      resolved.itemId = nameToId[resolved.name] ?? null;
    }
    if (resolved.itemId && itemMap[resolved.itemId]) {
      resolved.icon = itemMap[resolved.itemId].icon ?? null;
    }
    if (resolved.inputs?.length) {
      resolved.inputs = resolved.inputs.map(resolveNode);
    }
    return resolved;
  }
  return recipes.map(resolveNode);
}

export const LEGENDARY_WEAPON_TYPES = [
  'All', 'Greatsword', 'Sword', 'Axe', 'Dagger', 'Mace',
  'Short Bow', 'Long Bow', 'Rifle', 'Pistol', 'Warhorn',
  'Staff', 'Scepter', 'Focus', 'Shield', 'Torch',
  'Spear', 'Trident', 'Harpoon Gun',
];
