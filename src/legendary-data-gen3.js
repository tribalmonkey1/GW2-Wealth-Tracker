/**
 * GW2 Gen 3 Legendary Weapon Data — End of Dragons (EoD)
 * The Aurene legendary weapon set, introduced in the End of Dragons expansion.
 *
 * Gen 3 structure:
 * - Precursor: crafted via 3-stage collection (account-bound), same pattern as Gen 2
 * - Gift of [Weapon]: unique per weapon, uses Jade Runestones + T6 mats
 * - Gift of Fortune: identical to Gen 1/2
 * - Gift of the End of Dragons: replaces Gift of Mastery/Maguuma Mastery
 *
 * Ingredient notes:
 * - Jade Runestone: crafted from Jade Sliver (map currency) + other mats [NAME_LOOKUP]
 * - Antique Summoning Stones: from Strike Mission rewards [NAME_LOOKUP]
 * - Gift of the End of Dragons: requires Cantha map completion + EoD masteries
 *
 * [INFERRED] items are marked — verify against wiki before trusting exact counts.
 * Most T6 counts (250) and lodestone counts (100) follow the established Gen 1/2 pattern.
 */

// ── Shared Gen 3 components ────────────────────────────────────────────────────

const GIFT_OF_FORTUNE_GEN3 = {
  name: 'Gift of Fortune',
  itemId: null, idName: 'Gift of Fortune',
  count: 1, source: 'forge', accountBound: true,
  inputs: [
    { name: 'Mystic Clover',     itemId: 19675, count: 77,  source: 'tp',    inputs: [] },
    { name: 'Glob of Ectoplasm', itemId: 19721, count: 250, source: 'tp',    inputs: [] },
    { name: 'Mystic Coin',       itemId: 19976, count: 77,  source: 'tp',    inputs: [] },
    { name: 'Crystal',           itemId: null, idName: 'Crystal', count: 77, source: 'tp', inputs: [] },
  ],
};

// Gift of Jade Mastery — EoD mastery equivalent [wiki verified]
// ID 96033: Gift of the Dragon Empire + Bloodstone Shard + Gift of Cantha + 100 Antique Summoning Stones
const GIFT_OF_EOD = {
  name: 'Gift of Jade Mastery',
  itemId: 96033, idName: 'Gift of Jade Mastery',
  count: 1, source: 'forge', accountBound: true,
  inputs: [
    // Gift of the Dragon Empire [wiki verified — ID 97433]
    // Mystic Forge: 100 Jade Runestone + 200 Chunk of Pure Jade + 100 Chunk of Ancient Ambergris + 5 Blessing of the Jade Empress
    {
      name: 'Gift of the Dragon Empire',
      itemId: 97433, idName: 'Gift of the Dragon Empire',
      count: 1, source: 'forge', accountBound: true,
      inputs: [
        { name: 'Jade Runestone',             itemId: 96722, count: 100, source: 'tp', note: 'Purchasable from TP or crafted', inputs: [] },
        { name: 'Chunk of Pure Jade',         itemId: null,  count: 200, source: 'tp', note: 'EoD map currency', inputs: [] },
        { name: 'Chunk of Ancient Ambergris', itemId: null,  count: 100, source: 'tp', note: 'EoD map currency', inputs: [] },
        { name: 'Blessing of the Jade Empress', itemId: null, count: 5,  source: 'tp', note: 'EoD map currency', inputs: [] },
      ],
    },
    // Bloodstone Shard — 200 Spirit Shards from Miyani
    { name: 'Bloodstone Shard', itemId: 20797, count: 1, source: 'currency',
      note: 'Buy from Miyani for 200 Spirit Shards', inputs: [] },
    // Gift of Cantha [wiki verified — ID 97096]
    // Mystic Forge: Gift of Seitung Province + Gift of New Kaineng City + Gift of the Echovald Forest + Gift of Dragon's End
    {
      name: 'Gift of Cantha',
      itemId: 97096, idName: 'Gift of Cantha',
      count: 1, source: 'forge', accountBound: true,
      inputs: [
        { name: "Gift of Seitung Province",       itemId: null, count: 1, source: 'exploration', accountBound: true, note: 'Complete Seitung Province map', inputs: [] },
        { name: 'Gift of New Kaineng City',       itemId: null, count: 1, source: 'exploration', accountBound: true, note: 'Complete New Kaineng City map', inputs: [] },
        { name: 'Gift of the Echovald Forest',    itemId: null, count: 1, source: 'exploration', accountBound: true, note: 'Complete Echovald Forest map', inputs: [] },
        { name: "Gift of Dragon's End",           itemId: 96083, count: 1, source: 'exploration', accountBound: true, note: "Complete Dragon's End map", inputs: [] },
      ],
    },
    // Antique Summoning Stone [wiki verified — ID 96978]
    { name: 'Antique Summoning Stone', itemId: 96978, count: 100, source: 'tp',
      note: 'From EoD Strike Mission rewards, End of Dragons Reward Coffer, or TP', inputs: [] },
  ],
};

// T6 material shorthand
function t6(name, itemId, idName, count) {
  return { name, itemId: itemId || null, idName: idName || null, count, source: 'tp', inputs: [] };
}

// Jade Runestone [wiki verified — ID 96722]
function jadeRunestone(count) {
  return {
    name: 'Jade Runestone',
    itemId: 96722,
    count,
    source: 'tp',
    note: 'Purchasable from TP or crafted (Scribe 225)',
    inputs: [],
  };
}

// Antique Summoning Stone [wiki verified — ID 96978]
function antiqueSummoningStone(count) {
  return {
    name: 'Antique Summoning Stone',
    itemId: 96978,
    count,
    source: 'tp',
    note: 'From EoD Strike Mission rewards or TP',
    inputs: [],
  };
}

// Collection precursor — same 3-stage pattern as Gen 2
function collectionPrecursor(baseName, note) {
  return {
    name: `${baseName} (Precursor)`,
    itemId: null, idName: baseName,
    count: 1, source: 'collection', accountBound: true,
    note: note || 'Gen 3 precursor — 3-stage collection (account-bound)',
    inputs: [
      { name: `${baseName} I`,   itemId: null, idName: `${baseName} I`,   count: 1, source: 'collection', accountBound: true, note: 'Stage 1 — gathering & exploration', inputs: [] },
      { name: `${baseName} II`,  itemId: null, idName: `${baseName} II`,  count: 1, source: 'collection', accountBound: true, note: 'Stage 2 — intermediate crafts',      inputs: [] },
      { name: `${baseName} III`, itemId: null, idName: `${baseName} III`, count: 1, source: 'collection', accountBound: true, note: 'Stage 3 — T6 mats + Jade currencies',  inputs: [] },
    ],
  };
}

// Unique gift helper — all Gen 3 gifts follow the same 4-ingredient pattern:
// Jade Runestone x100, two T6 stacks x250, one lodestone x100
// [INFERRED] lodestone types — verify per weapon on wiki
// Lodestone IDs for Gen 3 gift recipes
const LODESTONE_IDS = {
  'Crystal Lodestone':    24325,
  'Resonating Lodestone': 75015,
  'Destroyer Lodestone':  24312,
  'Charged Lodestone':    24305,
  'Onyx Lodestone':       24310,
  'Evergreen Lodestone':  24330,
  'Corrupted Lodestone':  24340,
  'Glacial Lodestone':    24320,
  'Molten Lodestone':     24302,
};

function aureneGift(giftName, lodestone, t6a_name, t6a_id, t6b_name, t6b_id) {
  return {
    name: giftName,
    itemId: null, idName: giftName,
    count: 1, source: 'forge', accountBound: true,
    inputs: [
      jadeRunestone(100),
      { name: lodestone, itemId: LODESTONE_IDS[lodestone] || null, count: 100, source: 'tp', inputs: [] },
      t6(t6a_name, t6a_id, null, 250),
      t6(t6b_name, t6b_id, null, 250),
    ],
  };
}

// ── Aurene Legendary Weapon Set ────────────────────────────────────────────────
export const LEGENDARY_RECIPES_GEN3 = [

  // ── Aurene's Insight (Staff) ────────────────────────────────────────────────
  {
    id: 'legendary_aurene_insight',
    name: "Aurene's Insight",
    itemId: null, idName: "Aurene's Insight",
    rarity: 'Legendary',
    weaponType: 'Staff',
    generation: 3,
    expansion: 'End of Dragons',
    inputs: [
      collectionPrecursor("Aurene's Insight"),
      aureneGift("Gift of Aurene's Insight",
        'Crystal Lodestone',
        'Ancient Bone', 24358,
        'Armored Scale', 24289),
      { ...GIFT_OF_FORTUNE_GEN3 },
      { ...GIFT_OF_EOD },
    ],
  },

  // ── Aurene's Persuasion (Scepter) ───────────────────────────────────────────
  {
    id: 'legendary_aurene_persuasion',
    name: "Aurene's Persuasion",
    itemId: null, idName: "Aurene's Persuasion",
    rarity: 'Legendary',
    weaponType: 'Scepter',
    generation: 3,
    expansion: 'End of Dragons',
    inputs: [
      collectionPrecursor("Aurene's Persuasion"),
      aureneGift("Gift of Aurene's Persuasion",
        'Resonating Lodestone',
        'Pile of Crystalline Dust', 24277,
        'Powerful Venom Sac', null),
      { ...GIFT_OF_FORTUNE_GEN3 },
      { ...GIFT_OF_EOD },
    ],
  },

  // ── Aurene's Bite (Dagger) ───────────────────────────────────────────────────
  {
    id: 'legendary_aurene_bite',
    name: "Aurene's Bite",
    itemId: null, idName: "Aurene's Bite",
    rarity: 'Legendary',
    weaponType: 'Dagger',
    generation: 3,
    expansion: 'End of Dragons',
    inputs: [
      collectionPrecursor("Aurene's Bite"),
      aureneGift("Gift of Aurene's Bite",
        'Destroyer Lodestone',
        'Vicious Fang', 24357,
        'Vicious Claw', 24351),
      { ...GIFT_OF_FORTUNE_GEN3 },
      { ...GIFT_OF_EOD },
    ],
  },

  // ── Aurene's Fang (Sword) ────────────────────────────────────────────────────
  {
    id: 'legendary_aurene_fang',
    name: "Aurene's Fang",
    itemId: null, idName: "Aurene's Fang",
    rarity: 'Legendary',
    weaponType: 'Sword',
    generation: 3,
    expansion: 'End of Dragons',
    inputs: [
      collectionPrecursor("Aurene's Fang"),
      aureneGift("Gift of Aurene's Fang",
        'Charged Lodestone',
        'Vicious Claw', 24351,
        'Armored Scale', 24289),
      { ...GIFT_OF_FORTUNE_GEN3 },
      { ...GIFT_OF_EOD },
    ],
  },

  // ── Aurene's Claw (Axe) ──────────────────────────────────────────────────────
  {
    id: 'legendary_aurene_claw',
    name: "Aurene's Claw",
    itemId: null, idName: "Aurene's Claw",
    rarity: 'Legendary',
    weaponType: 'Axe',
    generation: 3,
    expansion: 'End of Dragons',
    inputs: [
      collectionPrecursor("Aurene's Claw"),
      aureneGift("Gift of Aurene's Claw",
        'Onyx Lodestone',
        'Vicious Claw', 24351,
        'Ancient Bone', 24358),
      { ...GIFT_OF_FORTUNE_GEN3 },
      { ...GIFT_OF_EOD },
    ],
  },

  // ── Aurene's Scale (Shield) ──────────────────────────────────────────────────
  {
    id: 'legendary_aurene_scale',
    name: "Aurene's Scale",
    itemId: null, idName: "Aurene's Scale",
    rarity: 'Legendary',
    weaponType: 'Shield',
    generation: 3,
    expansion: 'End of Dragons',
    inputs: [
      collectionPrecursor("Aurene's Scale"),
      aureneGift("Gift of Aurene's Scale",
        'Evergreen Lodestone',
        'Armored Scale', 24289,
        'Vial of Powerful Blood', null),
      { ...GIFT_OF_FORTUNE_GEN3 },
      { ...GIFT_OF_EOD },
    ],
  },

  // ── Aurene's Breath (Rifle) ──────────────────────────────────────────────────
  {
    id: 'legendary_aurene_breath',
    name: "Aurene's Breath",
    itemId: null, idName: "Aurene's Breath",
    rarity: 'Legendary',
    weaponType: 'Rifle',
    generation: 3,
    expansion: 'End of Dragons',
    inputs: [
      collectionPrecursor("Aurene's Breath"),
      aureneGift("Gift of Aurene's Breath",
        'Corrupted Lodestone',
        'Vicious Fang', 24357,
        'Ancient Bone', 24358),
      { ...GIFT_OF_FORTUNE_GEN3 },
      { ...GIFT_OF_EOD },
    ],
  },

  // ── Aurene's Wing (Short Bow) ────────────────────────────────────────────────
  {
    id: 'legendary_aurene_wing',
    name: "Aurene's Wing",
    itemId: null, idName: "Aurene's Wing",
    rarity: 'Legendary',
    weaponType: 'Short Bow',
    generation: 3,
    expansion: 'End of Dragons',
    inputs: [
      collectionPrecursor("Aurene's Wing"),
      aureneGift("Gift of Aurene's Wing",
        'Glacial Lodestone',
        'Armored Scale', 24289,
        'Powerful Venom Sac', null),
      { ...GIFT_OF_FORTUNE_GEN3 },
      { ...GIFT_OF_EOD },
    ],
  },

  // ── Aurene's Tail (Warhorn) ──────────────────────────────────────────────────
  {
    id: 'legendary_aurene_tail',
    name: "Aurene's Tail",
    itemId: null, idName: "Aurene's Tail",
    rarity: 'Legendary',
    weaponType: 'Warhorn',
    generation: 3,
    expansion: 'End of Dragons',
    inputs: [
      collectionPrecursor("Aurene's Tail"),
      aureneGift("Gift of Aurene's Tail",
        'Molten Lodestone',
        'Elaborate Totem', null,
        'Powerful Venom Sac', null),
      { ...GIFT_OF_FORTUNE_GEN3 },
      { ...GIFT_OF_EOD },
    ],
  },

  // ── Aurene's Rending (Greatsword) ────────────────────────────────────────────
  {
    id: 'legendary_aurene_rending',
    name: "Aurene's Rending",
    itemId: null, idName: "Aurene's Rending",
    rarity: 'Legendary',
    weaponType: 'Greatsword',
    generation: 3,
    expansion: 'End of Dragons',
    inputs: [
      collectionPrecursor("Aurene's Rending"),
      aureneGift("Gift of Aurene's Rending",
        'Onyx Lodestone',
        'Vicious Claw', 24351,
        'Vial of Powerful Blood', null),
      { ...GIFT_OF_FORTUNE_GEN3 },
      { ...GIFT_OF_EOD },
    ],
  },

  // ── Aurene's Weight (Hammer) ─────────────────────────────────────────────────
  {
    id: 'legendary_aurene_weight',
    name: "Aurene's Weight",
    itemId: null, idName: "Aurene's Weight",
    rarity: 'Legendary',
    weaponType: 'Hammer',
    generation: 3,
    expansion: 'End of Dragons',
    inputs: [
      collectionPrecursor("Aurene's Weight"),
      aureneGift("Gift of Aurene's Weight",
        'Destroyer Lodestone',
        'Ancient Bone', 24358,
        'Vial of Powerful Blood', null),
      { ...GIFT_OF_FORTUNE_GEN3 },
      { ...GIFT_OF_EOD },
    ],
  },

  // ── Aurene's Voice (Focus) ───────────────────────────────────────────────────
  {
    id: 'legendary_aurene_voice',
    name: "Aurene's Voice",
    itemId: null, idName: "Aurene's Voice",
    rarity: 'Legendary',
    weaponType: 'Focus',
    generation: 3,
    expansion: 'End of Dragons',
    inputs: [
      collectionPrecursor("Aurene's Voice"),
      aureneGift("Gift of Aurene's Voice",
        'Crystal Lodestone',
        'Elaborate Totem', null,
        'Armored Scale', 24289),
      { ...GIFT_OF_FORTUNE_GEN3 },
      { ...GIFT_OF_EOD },
    ],
  },

  // ── Aurene's Argument (Pistol) ───────────────────────────────────────────────
  {
    id: 'legendary_aurene_argument',
    name: "Aurene's Argument",
    itemId: null, idName: "Aurene's Argument",
    rarity: 'Legendary',
    weaponType: 'Pistol',
    generation: 3,
    expansion: 'End of Dragons',
    inputs: [
      collectionPrecursor("Aurene's Argument"),
      aureneGift("Gift of Aurene's Argument",
        'Charged Lodestone',
        'Powerful Venom Sac', null,
        'Pile of Crystalline Dust', 24277),
      { ...GIFT_OF_FORTUNE_GEN3 },
      { ...GIFT_OF_EOD },
    ],
  },

  // ── Aurene's Gaze (Torch) ────────────────────────────────────────────────────
  {
    id: 'legendary_aurene_gaze',
    name: "Aurene's Gaze",
    itemId: null, idName: "Aurene's Gaze",
    rarity: 'Legendary',
    weaponType: 'Torch',
    generation: 3,
    expansion: 'End of Dragons',
    inputs: [
      collectionPrecursor("Aurene's Gaze"),
      aureneGift("Gift of Aurene's Gaze",
        'Molten Lodestone',
        'Vicious Fang', 24357,
        'Pile of Crystalline Dust', 24277),
      { ...GIFT_OF_FORTUNE_GEN3 },
      { ...GIFT_OF_EOD },
    ],
  },

  // ── Aurene's Wisdom (Long Bow) ───────────────────────────────────────────────
  {
    id: 'legendary_aurene_wisdom',
    name: "Aurene's Wisdom",
    itemId: null, idName: "Aurene's Wisdom",
    rarity: 'Legendary',
    weaponType: 'Long Bow',
    generation: 3,
    expansion: 'End of Dragons',
    inputs: [
      collectionPrecursor("Aurene's Wisdom"),
      aureneGift("Gift of Aurene's Wisdom",
        'Evergreen Lodestone',
        'Ancient Bone', 24358,
        'Elaborate Totem', null),
      { ...GIFT_OF_FORTUNE_GEN3 },
      { ...GIFT_OF_EOD },
    ],
  },

  // ── Aurene's Courage (Mace) ──────────────────────────────────────────────────
  {
    id: 'legendary_aurene_courage',
    name: "Aurene's Courage",
    itemId: null, idName: "Aurene's Courage",
    rarity: 'Legendary',
    weaponType: 'Mace',
    generation: 3,
    expansion: 'End of Dragons',
    inputs: [
      collectionPrecursor("Aurene's Courage"),
      aureneGift("Gift of Aurene's Courage",
        'Glacial Lodestone',
        'Vial of Powerful Blood', null,
        'Ancient Bone', 24358),
      { ...GIFT_OF_FORTUNE_GEN3 },
      { ...GIFT_OF_EOD },
    ],
  },

];

export const LEGENDARY_GEN3_EXPANSIONS = ['All', 'End of Dragons'];
