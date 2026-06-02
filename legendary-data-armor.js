/**
 * GW2 Legendary Armor Data
 *
 * Three sets:
 * - Gen 1 (PvE): Crafted via Mystic Forge using Gift of the Legendary Armorer
 *   Available in all weight classes (Light/Medium/Heavy), 6 pieces per set
 * - Gen 2 (WvW): Crafted via WvW reward tracks + Gift of Battle
 * - Gen 3 (Raids): Crafted via raid progression (Envoy armor collections)
 *
 * Each armor piece uses:
 *   - Gift of the Armorer (shared)
 *   - Gift of [Weight] (per weight class)
 *   - Gift of Condensed Might / Magic (per piece type)
 *   - Stat-specific insignia (varies by desired stats)
 *
 * [INFERRED] counts follow wiki pattern — verify exact numbers on wiki.
 */

// ── Shared components ──────────────────────────────────────────────────────────

// Gift of the Legendary Armorer — shared across ALL Gen 1 legendary armor pieces
const GIFT_OF_LEGENDARY_ARMORER = {
  name: 'Gift of the Legendary Armorer',
  itemId: null, idName: 'Gift of the Legendary Armorer',
  count: 1, source: 'forge', accountBound: true,
  inputs: [
    { name: 'Mystic Clover',        itemId: 19675, count: 25, source: 'tp',    inputs: [] },
    { name: 'Glob of Ectoplasm',    itemId: 19721, count: 250, source: 'tp',   inputs: [] },
    { name: 'Mystic Coin',          itemId: 19976, count: 100, source: 'tp',   inputs: [] },
    { name: 'Obsidian Shard',       itemId: 19925, count: 100, source: 'karma', note: '1,050 Karma each', inputs: [] },
  ],
};

// Gift of Condensed Might — used for armor pieces (helm, shoulders, gloves)
const GIFT_OF_CONDENSED_MIGHT = {
  name: 'Gift of Condensed Might',
  itemId: null, idName: 'Gift of Condensed Might',
  count: 1, source: 'forge', accountBound: true,
  inputs: [
    { name: 'Gift of Claws',        itemId: null, idName: 'Gift of Claws',  count: 1, source: 'forge', accountBound: true,
      inputs: [
        { name: 'Vicious Claw',     itemId: 24351, count: 100, source: 'tp', inputs: [] },
        { name: 'Large Claw',       itemId: 24350, count: 250, source: 'tp', inputs: [] },
        { name: 'Sharp Claw',       itemId: 24349, count: 50,  source: 'tp', inputs: [] },
        { name: 'Claw',             itemId: 24348, count: 50,  source: 'tp', inputs: [] },
      ],
    },
    { name: 'Gift of Scales',       itemId: null, idName: 'Gift of Scales', count: 1, source: 'forge', accountBound: true,
      inputs: [
        { name: 'Armored Scale',    itemId: 24289, count: 100, source: 'tp', inputs: [] },
        { name: 'Large Scale',      itemId: 24288, count: 250, source: 'tp', inputs: [] },
        { name: 'Smooth Scale',     itemId: 24287, count: 50,  source: 'tp', inputs: [] },
        { name: 'Scale',            itemId: 24286, count: 50,  source: 'tp', inputs: [] },
      ],
    },
    { name: 'Gift of Bones',        itemId: null, idName: 'Gift of Bones',  count: 1, source: 'forge', accountBound: true,
      inputs: [
        { name: 'Ancient Bone',     itemId: 24358, count: 100, source: 'tp', inputs: [] },
        { name: 'Large Bone',       itemId: 24341, count: 250, source: 'tp', inputs: [] },
        { name: 'Heavy Bone',       itemId: 24345, count: 50,  source: 'tp', inputs: [] },
        { name: 'Bone',             itemId: 24344, count: 50,  source: 'tp', inputs: [] },
      ],
    },
    { name: 'Gift of Fangs',        itemId: null, idName: 'Gift of Fangs',  count: 1, source: 'forge', accountBound: true,
      inputs: [
        { name: 'Vicious Fang',     itemId: 24357, count: 100, source: 'tp', inputs: [] },
        { name: 'Large Fang',       itemId: 24356, count: 250, source: 'tp', inputs: [] },
        { name: 'Sharp Fang',       itemId: 24355, count: 50,  source: 'tp', inputs: [] },
        { name: 'Fang',             itemId: 24354, count: 50,  source: 'tp', inputs: [] },
      ],
    },
  ],
};

// Gift of Condensed Magic — used for armor pieces (chest, leggings, boots)
const GIFT_OF_CONDENSED_MAGIC = {
  name: 'Gift of Condensed Magic',
  itemId: null, idName: 'Gift of Condensed Magic',
  count: 1, source: 'forge', accountBound: true,
  inputs: [
    { name: 'Gift of Blood',        itemId: null, idName: 'Gift of Blood',  count: 1, source: 'forge', accountBound: true,
      inputs: [
        { name: 'Vial of Powerful Blood', itemId: null, idName: 'Vial of Powerful Blood', count: 100, source: 'tp', inputs: [] },
        { name: 'Vial of Potent Blood',   itemId: null, idName: 'Vial of Potent Blood',   count: 250, source: 'tp', inputs: [] },
        { name: 'Vial of Thick Blood',    itemId: null, idName: 'Vial of Thick Blood',    count: 50,  source: 'tp', inputs: [] },
        { name: 'Vial of Blood',          itemId: null, idName: 'Vial of Blood',          count: 50,  source: 'tp', inputs: [] },
      ],
    },
    { name: 'Gift of Venom',        itemId: null, idName: 'Gift of Venom',  count: 1, source: 'forge', accountBound: true,
      inputs: [
        { name: 'Powerful Venom Sac', itemId: null, idName: 'Powerful Venom Sac', count: 100, source: 'tp', inputs: [] },
        { name: 'Potent Venom Sac',   itemId: null, idName: 'Potent Venom Sac',   count: 250, source: 'tp', inputs: [] },
        { name: 'Full Venom Sac',     itemId: null, idName: 'Full Venom Sac',     count: 50,  source: 'tp', inputs: [] },
        { name: 'Venom Sac',          itemId: null, idName: 'Venom Sac',          count: 50,  source: 'tp', inputs: [] },
      ],
    },
    { name: 'Gift of Totems',       itemId: null, idName: 'Gift of Totems', count: 1, source: 'forge', accountBound: true,
      inputs: [
        { name: 'Elaborate Totem',  itemId: null, idName: 'Elaborate Totem',  count: 100, source: 'tp', inputs: [] },
        { name: 'Intricate Totem',  itemId: null, idName: 'Intricate Totem',  count: 250, source: 'tp', inputs: [] },
        { name: 'Engraved Totem',   itemId: null, idName: 'Engraved Totem',   count: 50,  source: 'tp', inputs: [] },
        { name: 'Totem',            itemId: null, idName: 'Totem',            count: 50,  source: 'tp', inputs: [] },
      ],
    },
    { name: 'Gift of Dust',         itemId: null, idName: 'Gift of Dust',   count: 1, source: 'forge', accountBound: true,
      inputs: [
        { name: 'Pile of Crystalline Dust',  itemId: 24277, count: 100, source: 'tp', inputs: [] },
        { name: 'Pile of Incandescent Dust', itemId: 24276, count: 250, source: 'tp', inputs: [] },
        { name: 'Pile of Luminous Dust',     itemId: 24275, count: 50,  source: 'tp', inputs: [] },
        { name: 'Pile of Radiant Dust',      itemId: 24274, count: 50,  source: 'tp', inputs: [] },
      ],
    },
  ],
};

// Weight-specific gifts
function giftOfWeight(weightClass) {
  // Each weight class gift uses specific crafted components
  // [INFERRED] — exact recipes vary; all require 250 Ectos + silk/leather/metal
  const materialsByWeight = {
    Light: [
      { name: 'Bolt of Gossamer',              itemId: 19746, count: 250, source: 'tp', inputs: [] },
      { name: 'Glob of Ectoplasm',             itemId: 19721, count: 250, source: 'tp', inputs: [] },
      { name: 'Elonian Leather Square',        itemId: null, idName: 'Elonian Leather Square', count: 50, source: 'tp', inputs: [] },
      { name: 'Deldrimor Steel Ingot',         itemId: null, idName: 'Deldrimor Steel Ingot', count: 50, source: 'tp', inputs: [] },
    ],
    Medium: [
      { name: 'Cured Hardened Leather Square', itemId: 19737, count: 250, source: 'tp', inputs: [] },
      { name: 'Glob of Ectoplasm',             itemId: 19721, count: 250, source: 'tp', inputs: [] },
      { name: 'Bolt of Gossamer',              itemId: 19746, count: 50,  source: 'tp', inputs: [] },
      { name: 'Deldrimor Steel Ingot',         itemId: null, idName: 'Deldrimor Steel Ingot', count: 50, source: 'tp', inputs: [] },
    ],
    Heavy: [
      { name: 'Orichalcum Ingot',              itemId: 19685, count: 250, source: 'tp', inputs: [] },
      { name: 'Glob of Ectoplasm',             itemId: 19721, count: 250, source: 'tp', inputs: [] },
      { name: 'Bolt of Gossamer',              itemId: 19746, count: 50,  source: 'tp', inputs: [] },
      { name: 'Deldrimor Steel Ingot',         itemId: null, idName: 'Deldrimor Steel Ingot', count: 50, source: 'tp', inputs: [] },
    ],
  };

  return {
    name: `Gift of ${weightClass} Armor`,
    itemId: null, idName: `Gift of ${weightClass} Armor`,
    count: 1, source: 'forge', accountBound: true,
    inputs: materialsByWeight[weightClass] || [],
  };
}

// Build a single legendary armor piece recipe
function armorPiece(slot, weightClass, pieceNote) {
  const usesMight = ['Helm', 'Shoulders', 'Gloves'].includes(slot);
  const condensedGift = usesMight ? GIFT_OF_CONDENSED_MIGHT : GIFT_OF_CONDENSED_MAGIC;

  // Stat-selectable insignia — player chooses stats
  const insignia = {
    name: `Stat-Selectable Insignia (${slot})`,
    itemId: null,
    count: 1, source: 'tp',
    note: 'Choose your desired stats — buy from TP or craft. Price varies by stat prefix.',
    inputs: [],
  };

  return {
    id: `legendary_armor_${weightClass.toLowerCase()}_${slot.toLowerCase()}`,
    name: `Legendary ${weightClass} ${slot}`,
    itemId: null, idName: `Legendary ${weightClass} ${slot}`,
    rarity: 'Legendary',
    armorSlot: slot,
    weightClass,
    generation: 1,
    category: 'armor',
    note: pieceNote || null,
    inputs: [
      { ...GIFT_OF_LEGENDARY_ARMORER },
      { ...giftOfWeight(weightClass) },
      { ...condensedGift },
      insignia,
    ],
  };
}

// ── Gen 1 PvE Legendary Armor ─────────────────────────────────────────────────
// Three weight classes × 6 slots = 18 pieces total
const ARMOR_SLOTS = ['Helm', 'Shoulders', 'Chest', 'Gloves', 'Leggings', 'Boots'];
const WEIGHT_CLASSES = ['Light', 'Medium', 'Heavy'];

const GEN1_ARMOR = [];
for (const weight of WEIGHT_CLASSES) {
  for (const slot of ARMOR_SLOTS) {
    GEN1_ARMOR.push(armorPiece(slot, weight));
  }
}

// ── Gen 2 WvW Legendary Armor ──────────────────────────────────────────────────
// Acquired via WvW reward track (Triumphant Armor collection)
// Each piece requires Triumphant Hero's armor + WvW reward track progression
function wvwArmorPiece(slot, weightClass) {
  return {
    id: `legendary_armor_wvw_${weightClass.toLowerCase()}_${slot.toLowerCase()}`,
    name: `Legendary WvW ${weightClass} ${slot}`,
    itemId: null, idName: `Legendary WvW ${weightClass} ${slot}`,
    rarity: 'Legendary',
    armorSlot: slot,
    weightClass,
    generation: 2,
    category: 'armor',
    expansion: 'WvW',
    note: 'Requires Triumphant Hero\'s Armor (WvW reward track) + Gift of Battle',
    inputs: [
      {
        name: `Triumphant Hero's ${weightClass} ${slot}`,
        itemId: null, idName: `Triumphant Hero's ${weightClass} ${slot}`,
        count: 1, source: 'wvw', accountBound: true,
        note: 'Crafted via WvW Skirmish Chest progression',
        inputs: [],
      },
      {
        name: 'Gift of Battle',
        itemId: null, idName: 'Gift of Battle',
        count: 1, source: 'wvw', accountBound: true,
        note: 'WvW Skirmish reward track',
        inputs: [],
      },
      {
        name: 'Memory of Battle',
        itemId: null, idName: 'Memory of Battle',
        count: 150, source: 'wvw', accountBound: false,
        note: 'WvW participation currency — tradeable',
        inputs: [],
      },
      {
        name: 'Glob of Ectoplasm',
        itemId: 19721, count: 50, source: 'tp', inputs: [],
      },
    ],
  };
}

const GEN2_WVW_ARMOR = [];
for (const weight of WEIGHT_CLASSES) {
  for (const slot of ARMOR_SLOTS) {
    GEN2_WVW_ARMOR.push(wvwArmorPiece(slot, weight));
  }
}

// ── Gen 3 Raid Legendary Armor (Envoy Armor) ──────────────────────────────────
// Acquired via raid progression (Envoy Armor I & II collections)
// Each piece: Envoy Insignia (account-bound) + Orichalcum components + Ectos
function raidArmorPiece(slot, weightClass) {
  return {
    id: `legendary_armor_raid_${weightClass.toLowerCase()}_${slot.toLowerCase()}`,
    name: `Legendary Raid ${weightClass} ${slot}`,
    itemId: null, idName: `Legendary Raid ${weightClass} ${slot}`,
    rarity: 'Legendary',
    armorSlot: slot,
    weightClass,
    generation: 3,
    category: 'armor',
    expansion: 'Raids',
    note: 'Requires Envoy Armor I + II collection progression through raids',
    inputs: [
      {
        name: 'Perfected Envoy Armor (collection)',
        itemId: null,
        count: 1, source: 'collection', accountBound: true,
        note: 'Complete Envoy Armor I: Experimental, then II: Refined, then III: Perfected via raid progression',
        inputs: [],
      },
      {
        name: 'Stat-Selectable Insignia',
        itemId: null,
        count: 1, source: 'tp',
        note: 'Choose your desired stats',
        inputs: [],
      },
    ],
  };
}

const GEN3_RAID_ARMOR = [];
for (const weight of WEIGHT_CLASSES) {
  for (const slot of ARMOR_SLOTS) {
    GEN3_RAID_ARMOR.push(raidArmorPiece(slot, weight));
  }
}

export const LEGENDARY_ARMOR_RECIPES = [
  ...GEN1_ARMOR,
  ...GEN2_WVW_ARMOR,
  ...GEN3_RAID_ARMOR,
];

export const ARMOR_WEIGHT_CLASSES = ['All', 'Light', 'Medium', 'Heavy'];
export const ARMOR_SLOTS_LIST = ['All', ...ARMOR_SLOTS];
export const ARMOR_GENERATIONS = ['All', '1 (PvE)', '2 (WvW)', '3 (Raids)'];
