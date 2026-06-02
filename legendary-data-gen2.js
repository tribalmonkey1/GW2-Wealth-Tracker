/**
 * GW2 Gen 2 Legendary Weapon Data
 * Heart of Thorns (HoT) and Path of Fire (PoF) legendaries.
 *
 * Gen 2 structure differs from Gen 1:
 * - Precursor is crafted through a 3-stage COLLECTION (not Mystic Forge random)
 * - Uses Gift of Maguuma Mastery (HoT) or Gift of Desert Mastery (PoF)
 *   instead of Gift of Mastery
 * - Gift of Fortune is the same as Gen 1
 * - Each has a unique weapon-specific Gift
 *
 * Stage costs are approximate — many components are account-bound collections,
 * map currencies, or time-gated crafts. Gold costs show TP-priceable items only.
 */

// ── Shared Gen 2 components ────────────────────────────────────────────────────

// Gift of Maguuma Mastery (HoT legendaries)
const GIFT_OF_MAGUUMA_MASTERY = {
  name: 'Gift of Maguuma Mastery',
  itemId: null, idName: 'Gift of Maguuma Mastery',
  count: 1, source: 'forge', accountBound: true,
  inputs: [
    { name: 'Gift of Maguuma',         itemId: null, idName: 'Gift of Maguuma',   count: 1, source: 'collection', accountBound: true, note: 'Map completion in HoT maps + Mastery points', inputs: [] },
    { name: 'Gift of Insight',         itemId: null, idName: 'Gift of Insight',   count: 1, source: 'heroics',    accountBound: true, note: 'Hero challenges in HoT', inputs: [] },
    { name: 'Glob of Ectoplasm',       itemId: 19721, count: 50, source: 'tp',    inputs: [] },
    { name: 'Obsidian Shard',          itemId: 19925, count: 50, source: 'karma', note: '1,050 Karma each', inputs: [] },
  ],
};

// Gift of Desert Mastery (PoF legendaries)
const GIFT_OF_DESERT_MASTERY = {
  name: 'Gift of Desert Mastery',
  itemId: null, idName: 'Gift of Desert Mastery',
  count: 1, source: 'forge', accountBound: true,
  inputs: [
    { name: 'Gift of the Desert',      itemId: null, idName: 'Gift of the Desert', count: 1, source: 'collection', accountBound: true, note: 'Map completion in PoF maps + Mastery points', inputs: [] },
    { name: 'Gift of Desolation',      itemId: null, idName: 'Gift of Desolation', count: 1, source: 'heroics',    accountBound: true, note: 'Hero challenges in PoF', inputs: [] },
    { name: 'Glob of Ectoplasm',       itemId: 19721, count: 50, source: 'tp',    inputs: [] },
    { name: 'Obsidian Shard',          itemId: 19925, count: 50, source: 'karma', note: '1,050 Karma each', inputs: [] },
  ],
};

// Gen 2 Gift of Fortune (same as Gen 1)
const GIFT_OF_FORTUNE_GEN2 = {
  name: 'Gift of Fortune',
  itemId: null, idName: 'Gift of Fortune',
  count: 1, source: 'forge', accountBound: true,
  inputs: [
    { name: 'Mystic Clover',        itemId: 19675, count: 77,  source: 'tp',    inputs: [] },
    { name: 'Glob of Ectoplasm',    itemId: 19721, count: 250, source: 'tp',    inputs: [] },
    { name: 'Mystic Coin',          itemId: 19976, count: 77,  source: 'tp',    inputs: [] },
    { name: 'Crystal',              itemId: null, idName: 'Crystal', count: 77, source: 'tp', inputs: [] },
  ],
};

// T6 materials shorthand (same IDs as Gen 1 — imported at runtime)
const T6_IDS = {
  VICIOUS_CLAW:             24351,
  VICIOUS_FANG:             24357,
  ANCIENT_BONE:             24358,
  ARMORED_SCALE:            24289,
  PILE_OF_CRYSTALLINE_DUST: 24277,
  GLOB_OF_ECTOPLASM:        19721,
  MYSTIC_COIN:              19976,
};

function t6(name, itemId, idName, count) {
  return { name, itemId: itemId || null, idName: idName || null, count, source: 'tp', inputs: [] };
}
function ls(name, count) {
  return { name, itemId: null, idName: name, count, source: 'tp', inputs: [] };
}
function collectionStage(name, stageNum, note) {
  return {
    name: `${name} (Stage ${stageNum})`,
    itemId: null, idName: `${name} (Stage ${stageNum})`,
    count: 1, source: 'collection', accountBound: true,
    note: note || `Collection stage ${stageNum} — account-bound`,
    inputs: [],
  };
}

// Precursor collection chain helper — 3 stages, each account-bound
// Stage 3 output = the actual precursor fed into the legendary
function collectionPrecursor(baseName, stage1Note, stage2Note, stage3Note, extraInputs) {
  return {
    name: `${baseName} (Precursor)`,
    itemId: null, idName: baseName,
    count: 1, source: 'collection', accountBound: true,
    note: 'Gen 2 precursor — crafted via 3-stage collection (account-bound)',
    inputs: [
      { name: `${baseName} I`, itemId: null, idName: `${baseName} I`, count: 1, source: 'collection', accountBound: true, note: stage1Note || 'Stage 1 collection', inputs: [] },
      { name: `${baseName} II`, itemId: null, idName: `${baseName} II`, count: 1, source: 'collection', accountBound: true, note: stage2Note || 'Stage 2 collection', inputs: [] },
      { name: `${baseName} III`, itemId: null, idName: `${baseName} III`, count: 1, source: 'collection', accountBound: true, note: stage3Note || 'Stage 3 collection — requires map currencies + T6 mats', inputs: [] },
      ...(extraInputs || []),
    ],
  };
}

export const LEGENDARY_RECIPES_GEN2 = [

  // ── HOPE (Pistol, HoT) ───────────────────────────────────────────────────────
  {
    id: 'legendary_hope',
    name: 'HOPE',
    itemId: 72713, idName: 'HOPE',
    rarity: 'Legendary',
    weaponType: 'Pistol',
    generation: 2,
    expansion: 'Heart of Thorns',
    note: 'Gen 2 — precursor via 3-stage collection (HOPE I/II/III)',
    inputs: [
      collectionPrecursor('HOPE',
        'HOPE I: The Experimental Pistol',
        'HOPE II: The Prototype',
        'HOPE III: The Perfected Pistol — HoT currencies'),
      {
        name: 'Gift of HOPE',
        itemId: 77086, idName: 'Gift of HOPE',
        count: 1, source: 'forge', accountBound: true,
        inputs: [
          { name: 'Gift of the Mists', itemId: 76427, idName: 'Gift of the Mists', count: 1, source: 'forge', accountBound: true,
            inputs: [
              { name: 'Gift of Battle', itemId: 19678, count: 1, source: 'wvw', accountBound: true, note: 'WvW Skirmish reward track', inputs: [] },
              { name: 'Gift of Glory', itemId: 70528, count: 1, source: 'currency', note: 'Buy from Miyani for 250 Shard of Glory (PvP)', inputs: [{ name: 'Shard of Glory', itemId: 70820, count: 250, source: 'tp', inputs: [] }] },
              { name: 'Gift of War', itemId: 71581, count: 1, source: 'currency', note: 'Buy from Miyani for 250 Memory of Battle (WvW)', inputs: [{ name: 'Memory of Battle', itemId: null, count: 250, source: 'wvw', note: 'WvW participation currency', inputs: [] }] },
              { name: 'Cube of Stabilized Dark Energy', itemId: 73137, count: 1, source: 'craft', inputs: [
                { name: 'Ball of Dark Energy', itemId: 71994, count: 1, source: 'tp', note: 'Salvage ascended equipment with Black Lion Salvage Kit', inputs: [] },
                { name: 'Stabilizing Matrix', itemId: 73248, count: 75, source: 'tp', inputs: [] },
              ]},
            ],
          },
          { name: 'Icy Runestone', itemId: 19676, count: 100, source: 'vendor', note: '1 gold each from vendor', inputs: [] },
          { name: 'Gift of the Catalyst', itemId: null, idName: 'Gift of the Catalyst', count: 1, source: 'collection', accountBound: true, note: 'Account-bound — obtained via HOPE collection chain', inputs: [] },
          { name: 'Gift of Wood', itemId: 19622, count: 1, source: 'forge', accountBound: true,
            inputs: [
              { name: 'Ancient Wood Plank',  itemId: 19712, count: 250, source: 'tp', inputs: [] },
              { name: 'Elder Wood Plank',    itemId: 19709, count: 250, source: 'tp', inputs: [] },
              { name: 'Hard Wood Plank',     itemId: 19711, count: 250, source: 'tp', inputs: [] },
              { name: 'Seasoned Wood Plank', itemId: 19714, count: 250, source: 'tp', inputs: [] },
            ],
          },
        ],
      },
      { ...GIFT_OF_FORTUNE_GEN2 },
      { ...GIFT_OF_MAGUUMA_MASTERY },
    ],
  },

  // ── The Shining Blade (Sword, HoT) ─────────────────────────────────────────
  {
    id: 'legendary_shining_blade',
    name: 'The Shining Blade',
    itemId: null, idName: 'The Shining Blade',
    rarity: 'Legendary',
    weaponType: 'Sword',
    generation: 2,
    expansion: 'Heart of Thorns',
    inputs: [
      collectionPrecursor('The Shining Blade',
        'Gather Shining Blade lore items',
        'Craft intermediate components',
        'Final stage: T6 mats + Maguuma currencies'),
      {
        name: 'Gift of the Shining Blade',
        itemId: null, idName: 'Gift of the Shining Blade',
        count: 1, source: 'forge', accountBound: true,
        inputs: [
          ls('Charged Lodestone', 100),
          t6('Pile of Crystalline Dust', 24277, null, 250),
          t6('Vicious Claw', 24351, null, 250),
          t6('Armored Scale', 24289, null, 250),
        ],
      },
      { ...GIFT_OF_FORTUNE_GEN2 },
      { ...GIFT_OF_MAGUUMA_MASTERY },
    ],
  },

  // ── Astralaria (Axe, HoT) ───────────────────────────────────────────────────
  {
    id: 'legendary_astralaria',
    name: 'Astralaria',
    itemId: null, idName: 'Astralaria',
    rarity: 'Legendary',
    weaponType: 'Axe',
    generation: 2,
    expansion: 'Heart of Thorns',
    inputs: [
      collectionPrecursor('Astralaria',
        'Astralaria I: The Mechanism',
        'Astralaria II: The Apparatus',
        'Astralaria III: The Device — T6 + Maguuma currencies'),
      {
        name: 'Gift of the Cosmos',
        itemId: null, idName: 'Gift of the Cosmos',
        count: 1, source: 'forge', accountBound: true,
        inputs: [
          ls('Crystal Lodestone', 100),
          t6('Pile of Crystalline Dust', 24277, null, 250),
          t6('Armored Scale', 24289, null, 250),
          t6('Ancient Bone', 24358, null, 250),
        ],
      },
      { ...GIFT_OF_FORTUNE_GEN2 },
      { ...GIFT_OF_MAGUUMA_MASTERY },
    ],
  },

  // ── Chuka and Champawat (Short Bow, HoT) ────────────────────────────────────
  {
    id: 'legendary_chuka_champawat',
    name: 'Chuka and Champawat',
    itemId: null, idName: 'Chuka and Champawat',
    rarity: 'Legendary',
    weaponType: 'Short Bow',
    generation: 2,
    expansion: 'Heart of Thorns',
    inputs: [
      collectionPrecursor('Chuka and Champawat',
        'Chuka and Champawat I: Tigris',
        'Chuka and Champawat II: Dhuum',
        'Chuka and Champawat III: complete hunt chain'),
      {
        name: 'Gift of the Hunt',
        itemId: null, idName: 'Gift of the Hunt',
        count: 1, source: 'forge', accountBound: true,
        inputs: [
          ls('Evergreen Lodestone', 100),
          t6('Vicious Fang', 24357, null, 250),
          t6('Powerful Venom Sac', null, 'Powerful Venom Sac', 250),
          t6('Vicious Claw', 24351, null, 250),
        ],
      },
      { ...GIFT_OF_FORTUNE_GEN2 },
      { ...GIFT_OF_MAGUUMA_MASTERY },
    ],
  },

  // ── Naegling (Mace, HoT) ─────────────────────────────────────────────────────
  {
    id: 'legendary_naegling',
    name: 'Naegling',
    itemId: null, idName: 'Naegling',
    rarity: 'Legendary',
    weaponType: 'Mace',
    generation: 2,
    expansion: 'Heart of Thorns',
    inputs: [
      collectionPrecursor('Naegling',
        'Naegling I: The Experimental Mace',
        'Naegling II: The Prototype',
        'Naegling III: The Perfected Mace'),
      {
        name: 'Gift of Naegling',
        itemId: null, idName: 'Gift of Naegling',
        count: 1, source: 'forge', accountBound: true,
        inputs: [
          ls('Onyx Lodestone', 100),
          t6('Ancient Bone', 24358, null, 250),
          t6('Vicious Claw', 24351, null, 250),
          t6('Vial of Powerful Blood', null, 'Vial of Powerful Blood', 250),
        ],
      },
      { ...GIFT_OF_FORTUNE_GEN2 },
      { ...GIFT_OF_MAGUUMA_MASTERY },
    ],
  },

  // ── Shooshadoo (Warhorn, HoT) ────────────────────────────────────────────────
  {
    id: 'legendary_shooshadoo',
    name: 'Shooshadoo',
    itemId: null, idName: 'Shooshadoo',
    rarity: 'Legendary',
    weaponType: 'Warhorn',
    generation: 2,
    expansion: 'Heart of Thorns',
    inputs: [
      collectionPrecursor('Shooshadoo',
        'Shooshadoo I: The Experimental Warhorn',
        'Shooshadoo II: The Prototype',
        'Shooshadoo III: The Perfected Warhorn'),
      {
        name: 'Gift of Shooshadoo',
        itemId: null, idName: 'Gift of Shooshadoo',
        count: 1, source: 'forge', accountBound: true,
        inputs: [
          ls('Corrupted Lodestone', 100),
          t6('Powerful Venom Sac', null, 'Powerful Venom Sac', 250),
          t6('Armored Scale', 24289, null, 250),
          t6('Elaborate Totem', null, 'Elaborate Totem', 250),
        ],
      },
      { ...GIFT_OF_FORTUNE_GEN2 },
      { ...GIFT_OF_MAGUUMA_MASTERY },
    ],
  },

  // ── Nevermore (Staff, HoT) ───────────────────────────────────────────────────
  {
    id: 'legendary_nevermore',
    name: 'Nevermore',
    itemId: null, idName: 'Nevermore',
    rarity: 'Legendary',
    weaponType: 'Staff',
    generation: 2,
    expansion: 'Heart of Thorns',
    inputs: [
      collectionPrecursor('Nevermore',
        'Nevermore I: The Experimental Staff',
        'Nevermore II: The Prototype',
        'Nevermore III: The Perfected Staff'),
      {
        name: 'Gift of Nevermore',
        itemId: null, idName: 'Gift of Nevermore',
        count: 1, source: 'forge', accountBound: true,
        inputs: [
          ls('Corrupted Lodestone', 100),
          t6('Ancient Bone', 24358, null, 250),
          t6('Vicious Fang', 24357, null, 250),
          t6('Vicious Claw', 24351, null, 250),
        ],
      },
      { ...GIFT_OF_FORTUNE_GEN2 },
      { ...GIFT_OF_MAGUUMA_MASTERY },
    ],
  },

  // ── Eureka (Scepter, HoT) ────────────────────────────────────────────────────
  {
    id: 'legendary_eureka',
    name: 'Eureka',
    itemId: null, idName: 'Eureka',
    rarity: 'Legendary',
    weaponType: 'Scepter',
    generation: 2,
    expansion: 'Heart of Thorns',
    inputs: [
      collectionPrecursor('Eureka',
        'Eureka I: The Experimental Scepter',
        'Eureka II: The Prototype',
        'Eureka III: The Perfected Scepter'),
      {
        name: 'Gift of Eureka',
        itemId: null, idName: 'Gift of Eureka',
        count: 1, source: 'forge', accountBound: true,
        inputs: [
          ls('Charged Lodestone', 100),
          t6('Elaborate Totem', null, 'Elaborate Totem', 250),
          t6('Powerful Venom Sac', null, 'Powerful Venom Sac', 250),
          t6('Pile of Crystalline Dust', 24277, null, 250),
        ],
      },
      { ...GIFT_OF_FORTUNE_GEN2 },
      { ...GIFT_OF_MAGUUMA_MASTERY },
    ],
  },

  // ── HMS Divinity (Shield, HoT) ───────────────────────────────────────────────
  {
    id: 'legendary_hms_divinity',
    name: 'HMS Divinity',
    itemId: null, idName: 'HMS Divinity',
    rarity: 'Legendary',
    weaponType: 'Shield',
    generation: 2,
    expansion: 'Heart of Thorns',
    inputs: [
      collectionPrecursor('HMS Divinity',
        'HMS Divinity I: The Experimental Shield',
        'HMS Divinity II: The Prototype',
        'HMS Divinity III: The Perfected Shield'),
      {
        name: 'Gift of the Fleet',
        itemId: null, idName: 'Gift of the Fleet',
        count: 1, source: 'forge', accountBound: true,
        inputs: [
          ls('Evergreen Lodestone', 100),
          t6('Armored Scale', 24289, null, 250),
          t6('Ancient Bone', 24358, null, 250),
          t6('Vial of Powerful Blood', null, 'Vial of Powerful Blood', 250),
        ],
      },
      { ...GIFT_OF_FORTUNE_GEN2 },
      { ...GIFT_OF_MAGUUMA_MASTERY },
    ],
  },

  // ── The Binding of Ipos (Dagger, HoT) ────────────────────────────────────────
  {
    id: 'legendary_binding_of_ipos',
    name: 'The Binding of Ipos',
    itemId: null, idName: 'The Binding of Ipos',
    rarity: 'Legendary',
    weaponType: 'Dagger',
    generation: 2,
    expansion: 'Heart of Thorns',
    inputs: [
      collectionPrecursor('The Binding of Ipos',
        'The Binding of Ipos I',
        'The Binding of Ipos II',
        'The Binding of Ipos III — T6 mats + Maguuma currencies'),
      {
        name: 'Gift of Ipos',
        itemId: null, idName: 'Gift of Ipos',
        count: 1, source: 'forge', accountBound: true,
        inputs: [
          ls('Destroyer Lodestone', 100),
          t6('Vicious Fang', 24357, null, 250),
          t6('Vicious Claw', 24351, null, 250),
          t6('Powerful Venom Sac', null, 'Powerful Venom Sac', 250),
        ],
      },
      { ...GIFT_OF_FORTUNE_GEN2 },
      { ...GIFT_OF_MAGUUMA_MASTERY },
    ],
  },

  // ── Claw of the Khan-Ur (Dagger, HoT) ────────────────────────────────────────
  {
    id: 'legendary_claw_khan_ur',
    name: 'Claw of the Khan-Ur',
    itemId: null, idName: 'Claw of the Khan-Ur',
    rarity: 'Legendary',
    weaponType: 'Dagger',
    generation: 2,
    expansion: 'Heart of Thorns',
    inputs: [
      collectionPrecursor('Claw of the Khan-Ur',
        'Claw of the Khan-Ur I',
        'Claw of the Khan-Ur II',
        'Claw of the Khan-Ur III'),
      {
        name: 'Gift of the Khan-Ur',
        itemId: null, idName: 'Gift of the Khan-Ur',
        count: 1, source: 'forge', accountBound: true,
        inputs: [
          ls('Onyx Lodestone', 100),
          t6('Vicious Claw', 24351, null, 250),
          t6('Vicious Fang', 24357, null, 250),
          t6('Ancient Bone', 24358, null, 250),
        ],
      },
      { ...GIFT_OF_FORTUNE_GEN2 },
      { ...GIFT_OF_MAGUUMA_MASTERY },
    ],
  },

  // ── Elegy (Pistol, PoF) ──────────────────────────────────────────────────────
  {
    id: 'legendary_elegy',
    name: 'Elegy',
    itemId: null, idName: 'Elegy',
    rarity: 'Legendary',
    weaponType: 'Pistol',
    generation: 2,
    expansion: 'Path of Fire',
    inputs: [
      collectionPrecursor('Elegy',
        'Elegy I: The Experimental Pistol',
        'Elegy II: The Prototype',
        'Elegy III: The Perfected Pistol — PoF currencies'),
      {
        name: 'Gift of Elegy',
        itemId: null, idName: 'Gift of Elegy',
        count: 1, source: 'forge', accountBound: true,
        inputs: [
          ls('Glacial Lodestone', 100),
          t6('Powerful Venom Sac', null, 'Powerful Venom Sac', 250),
          t6('Armored Scale', 24289, null, 250),
          t6('Pile of Crystalline Dust', 24277, null, 250),
        ],
      },
      { ...GIFT_OF_FORTUNE_GEN2 },
      { ...GIFT_OF_DESERT_MASTERY },
    ],
  },

  // ── Exordium (Greatsword, PoF) ───────────────────────────────────────────────
  {
    id: 'legendary_exordium',
    name: 'Exordium',
    itemId: null, idName: 'Exordium',
    rarity: 'Legendary',
    weaponType: 'Greatsword',
    generation: 2,
    expansion: 'Path of Fire',
    inputs: [
      collectionPrecursor('Exordium',
        'Exordium I: The Experimental Greatsword',
        'Exordium II: The Prototype',
        'Exordium III: The Perfected Greatsword'),
      {
        name: 'Gift of Exordium',
        itemId: null, idName: 'Gift of Exordium',
        count: 1, source: 'forge', accountBound: true,
        inputs: [
          ls('Onyx Lodestone', 100),
          t6('Vicious Claw', 24351, null, 250),
          t6('Ancient Bone', 24358, null, 250),
          t6('Vial of Powerful Blood', null, 'Vial of Powerful Blood', 250),
        ],
      },
      { ...GIFT_OF_FORTUNE_GEN2 },
      { ...GIFT_OF_DESERT_MASTERY },
    ],
  },

  // ── Pharus (Long Bow, PoF) ───────────────────────────────────────────────────
  {
    id: 'legendary_pharus',
    name: 'Pharus',
    itemId: null, idName: 'Pharus',
    rarity: 'Legendary',
    weaponType: 'Long Bow',
    generation: 2,
    expansion: 'Path of Fire',
    inputs: [
      collectionPrecursor('Pharus',
        'Pharus I: The Experimental Longbow',
        'Pharus II: The Prototype',
        'Pharus III: The Perfected Longbow'),
      {
        name: 'Gift of Pharus',
        itemId: null, idName: 'Gift of Pharus',
        count: 1, source: 'forge', accountBound: true,
        inputs: [
          ls('Charged Lodestone', 100),
          t6('Armored Scale', 24289, null, 250),
          t6('Elaborate Totem', null, 'Elaborate Totem', 250),
          t6('Pile of Crystalline Dust', 24277, null, 250),
        ],
      },
      { ...GIFT_OF_FORTUNE_GEN2 },
      { ...GIFT_OF_DESERT_MASTERY },
    ],
  },

  // ── Tigris (Pistol, PoF) ─────────────────────────────────────────────────────
  {
    id: 'legendary_tigris',
    name: 'Tigris',
    itemId: null, idName: 'Tigris',
    rarity: 'Legendary',
    weaponType: 'Rifle',
    generation: 2,
    expansion: 'Path of Fire',
    inputs: [
      collectionPrecursor('Tigris',
        'Tigris I: The Experimental Rifle',
        'Tigris II: The Prototype',
        'Tigris III: The Perfected Rifle'),
      {
        name: 'Gift of Tigris',
        itemId: null, idName: 'Gift of Tigris',
        count: 1, source: 'forge', accountBound: true,
        inputs: [
          ls('Destroyer Lodestone', 100),
          t6('Vicious Fang', 24357, null, 250),
          t6('Vicious Claw', 24351, null, 250),
          t6('Ancient Bone', 24358, null, 250),
        ],
      },
      { ...GIFT_OF_FORTUNE_GEN2 },
      { ...GIFT_OF_DESERT_MASTERY },
    ],
  },

  // ── Ruka (Hammer, PoF) ──────────────────────────────────────────────────────
  {
    id: 'legendary_ruka',
    name: 'Ruka',
    itemId: null, idName: 'Ruka',
    rarity: 'Legendary',
    weaponType: 'Hammer',
    generation: 2,
    expansion: 'Path of Fire',
    inputs: [
      collectionPrecursor('Ruka',
        'Ruka I: The Experimental Hammer',
        'Ruka II: The Prototype',
        'Ruka III: The Perfected Hammer'),
      {
        name: 'Gift of Ruka',
        itemId: null, idName: 'Gift of Ruka',
        count: 1, source: 'forge', accountBound: true,
        inputs: [
          ls('Destroyer Lodestone', 100),
          t6('Ancient Bone', 24358, null, 250),
          t6('Vial of Powerful Blood', null, 'Vial of Powerful Blood', 250),
          t6('Armored Scale', 24289, null, 250),
        ],
      },
      { ...GIFT_OF_FORTUNE_GEN2 },
      { ...GIFT_OF_DESERT_MASTERY },
    ],
  },

  // ── Phoenix (Short Bow, PoF) ─────────────────────────────────────────────────
  {
    id: 'legendary_phoenix',
    name: 'Phoenix',
    itemId: null, idName: 'Phoenix',
    rarity: 'Legendary',
    weaponType: 'Short Bow',
    generation: 2,
    expansion: 'Path of Fire',
    inputs: [
      collectionPrecursor('Phoenix',
        'Phoenix I: The Experimental Short Bow',
        'Phoenix II: The Prototype',
        'Phoenix III: The Perfected Short Bow'),
      {
        name: 'Gift of Phoenix',
        itemId: null, idName: 'Gift of Phoenix',
        count: 1, source: 'forge', accountBound: true,
        inputs: [
          ls('Molten Lodestone', 100),
          t6('Elaborate Totem', null, 'Elaborate Totem', 250),
          t6('Powerful Venom Sac', null, 'Powerful Venom Sac', 250),
          t6('Vicious Fang', 24357, null, 250),
        ],
      },
      { ...GIFT_OF_FORTUNE_GEN2 },
      { ...GIFT_OF_DESERT_MASTERY },
    ],
  },

];

export const LEGENDARY_GEN2_EXPANSIONS = ['All', 'Heart of Thorns', 'Path of Fire'];
