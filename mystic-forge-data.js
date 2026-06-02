/**
 * GW2 Mystic Forge Data
 * All item IDs verified via wiki.guildwars2.com API links or gw2bltc.com URLs.
 * IDs marked [INFERRED] follow confirmed sequential patterns.
 * IDs marked [NAME_LOOKUP] are resolved at runtime from itemMap by name.
 */

// ── Verified Item IDs ─────────────────────────────────────────────────────────
export const FORGE_IDS = {
  // Mystic items (Miyani vendor)
  PHILOSOPHER_STONE: 20796,   // verified wiki
  MYSTIC_CRYSTAL: 20799,      // verified wiki
  MYSTIC_COIN: 19976,         // verified wiki
  GLOB_OF_ECTOPLASM: 19721,   // verified wiki
  OBSIDIAN_SHARD: 19925,      // verified wiki

  // Dusts — all sequential, all verified
  PILE_OF_GLITTERING_DUST: 24272,
  PILE_OF_SHIMMERING_DUST: 24273,
  PILE_OF_RADIANT_DUST: 24274,
  PILE_OF_LUMINOUS_DUST: 24275,
  PILE_OF_INCANDESCENT_DUST: 24276,
  PILE_OF_CRYSTALLINE_DUST: 24277,

  // Cloth scraps — verified
  JUTE_SCRAP: 19718,
  WOOL_SCRAP: 19739,
  COTTON_SCRAP: 19741,
  LINEN_SCRAP: 19743,
  SILK_SCRAP: 19748,
  GOSSAMER_SCRAP: 19745,

  // Bolts — verified
  BOLT_OF_JUTE: 19720,
  BOLT_OF_WOOL: 19740,
  BOLT_OF_COTTON: 19742,
  BOLT_OF_LINEN: 19744,
  BOLT_OF_SILK: 19747,
  BOLT_OF_GOSSAMER: 19746,

  // Leather sections — verified
  RAWHIDE_LEATHER_SECTION: 19719,
  THIN_LEATHER_SECTION: 19728,
  COARSE_LEATHER_SECTION: 19730,
  RUGGED_LEATHER_SECTION: 19731,
  THICK_LEATHER_SECTION: 19729,
  HARDENED_LEATHER_SECTION: 19732,

  // Leather squares — verified
  STRETCHED_RAWHIDE_LEATHER_SQUARE: 19738,
  CURED_THIN_LEATHER_SQUARE: 19733,
  CURED_COARSE_LEATHER_SQUARE: 19734,
  CURED_RUGGED_LEATHER_SQUARE: 19736,
  CURED_THICK_LEATHER_SQUARE: 19735,
  CURED_HARDENED_LEATHER_SQUARE: 19737,

  // Metal ores — verified
  COPPER_ORE: 19697,
  IRON_ORE: 19699,
  SILVER_ORE: 19703,
  GOLD_ORE: 19698,
  PLATINUM_ORE: 19702,
  MITHRIL_ORE: 19700,
  ORICHALCUM_ORE: 19701,

  // Metal ingots — verified
  COPPER_INGOT: 19680,
  BRONZE_INGOT: 19679,
  SILVER_INGOT: 19687,
  IRON_INGOT: 19683,
  GOLD_INGOT: 19682,
  STEEL_INGOT: 19688,
  DARKSTEEL_INGOT: 19681,
  PLATINUM_INGOT: 19686,
  MITHRIL_INGOT: 19684,
  ORICHALCUM_INGOT: 19685,

  // Wood logs — verified
  GREEN_WOOD_LOG: 19723,
  SOFT_WOOD_LOG: 19726,
  SEASONED_WOOD_LOG: 19727,
  HARD_WOOD_LOG: 19724,
  ELDER_WOOD_LOG: 19722,
  ANCIENT_WOOD_LOG: 19725,

  // Wood planks — verified
  GREEN_WOOD_PLANK: 19710,
  SOFT_WOOD_PLANK: 19713,
  SEASONED_WOOD_PLANK: 19714,
  HARD_WOOD_PLANK: 19711,
  ELDER_WOOD_PLANK: 19709,
  ANCIENT_WOOD_PLANK: 19712,

  // Bones — verified (Large Bone 24341 confirmed, rest sequential from 24342)
  LARGE_BONE: 24341,
  BONE_CHIP: 24342,
  BONE_SHARD: 24343,
  BONE: 24344,
  HEAVY_BONE: 24345,
  ANCIENT_BONE: 24358,

  // Claws — all verified sequential 24346–24351
  TINY_CLAW: 24346,
  SMALL_CLAW: 24347,
  CLAW: 24348,
  SHARP_CLAW: 24349,
  LARGE_CLAW: 24350,
  VICIOUS_CLAW: 24351,

  // Fangs — all verified sequential 24352–24357
  TINY_FANG: 24352,
  SMALL_FANG: 24353,
  FANG: 24354,
  SHARP_FANG: 24355,
  LARGE_FANG: 24356,
  VICIOUS_FANG: 24357,

  // Scales — Tiny 24284 (dulfy URL), Small 24285 (gw2bltc), Armored 24289 (wiki)
  // [INFERRED] Scale 24286, Smooth 24287, Large 24288 complete the sequential range
  TINY_SCALE: 24284,
  SMALL_SCALE: 24285,
  SCALE: 24286,
  SMOOTH_SCALE: 24287,
  LARGE_SCALE: 24288,
  ARMORED_SCALE: 24289,

  // Totems — [NAME_LOOKUP] resolved at runtime
  TINY_TOTEM: null,
  SMALL_TOTEM: null,
  TOTEM: null,
  ENGRAVED_TOTEM: null,
  INTRICATE_TOTEM: null,
  ELABORATE_TOTEM: null,

  // Venom Sacs — [NAME_LOOKUP]
  TINY_VENOM_SAC: null,
  SMALL_VENOM_SAC: null,
  VENOM_SAC: null,
  FULL_VENOM_SAC: null,
  POTENT_VENOM_SAC: null,
  POWERFUL_VENOM_SAC: null,

  // Vials of Blood — [NAME_LOOKUP]
  VIAL_OF_WEAK_BLOOD: null,
  VIAL_OF_THIN_BLOOD: null,
  VIAL_OF_BLOOD: null,
  VIAL_OF_THICK_BLOOD: null,
  VIAL_OF_POTENT_BLOOD: null,
  VIAL_OF_POWERFUL_BLOOD: null,

  // Equipment recipe specific items — [NAME_LOOKUP]
  ELDRITCH_SCROLL: null,
};

// Item names for runtime NAME_LOOKUP resolution
export const FORGE_NAME_LOOKUPS = {
  TINY_TOTEM: 'Tiny Totem',
  SMALL_TOTEM: 'Small Totem',
  TOTEM: 'Totem',
  ENGRAVED_TOTEM: 'Engraved Totem',
  INTRICATE_TOTEM: 'Intricate Totem',
  ELABORATE_TOTEM: 'Elaborate Totem',
  TINY_VENOM_SAC: 'Tiny Venom Sac',
  SMALL_VENOM_SAC: 'Small Venom Sac',
  VENOM_SAC: 'Venom Sac',
  FULL_VENOM_SAC: 'Full Venom Sac',
  POTENT_VENOM_SAC: 'Potent Venom Sac',
  POWERFUL_VENOM_SAC: 'Powerful Venom Sac',
  VIAL_OF_WEAK_BLOOD: 'Vial of Weak Blood',
  VIAL_OF_THIN_BLOOD: 'Vial of Thin Blood',
  VIAL_OF_BLOOD: 'Vial of Blood',
  VIAL_OF_THICK_BLOOD: 'Vial of Thick Blood',
  VIAL_OF_POTENT_BLOOD: 'Vial of Potent Blood',
  VIAL_OF_POWERFUL_BLOOD: 'Vial of Powerful Blood',
  ELDRITCH_SCROLL: 'Eldritch Scroll',
};

// Resolve NAME_LOOKUP IDs from itemMap at runtime
export function resolveForgeIds(itemMap) {
  const resolved = { ...FORGE_IDS };
  const nameToId = {};
  for (const [id, item] of Object.entries(itemMap)) {
    if (item?.name) nameToId[item.name] = Number(id);
  }
  for (const [key, name] of Object.entries(FORGE_NAME_LOOKUPS)) {
    if (resolved[key] === null && nameToId[name]) {
      resolved[key] = nameToId[name];
    }
  }
  return resolved;
}

// ── Vendor / Account-Bound Costs ──────────────────────────────────────────────
// Items purchasable with account currencies — treated as 0 gold cost
// when you have enough of the currency.
export const SPIRIT_SHARD_COSTS = {
  [20796]: { count: 10, shards: 1 },   // Philosopher's Stone: 10 for 1 SS
  [20799]: { count: 5,  shards: 3 },   // Mystic Crystal: 5 for 3 SS
};

// Bottle of Elonian Wine: 25s 04c from Miyani. Use TP only if cheaper.
export const ELONIAN_WINE_VENDOR_PRICE = 2504; // copper

// Obsidian Shard purchase methods (in priority order)
export const OBSIDIAN_SHARD_METHODS = [
  { currency: 'volatile_magic', currencyName: 'Volatile Magic', perShard: 100, goldPerShard: 96, label: '100 Volatile Magic + 96c' },
  { currency: 'unbound_magic',  currencyName: 'Unbound Magic',  perShard: 100, goldPerShard: 96, label: '100 Unbound Magic + 96c' },
  { currency: 'karma',          currencyName: 'Karma',          perShard: 1050, goldPerShard: 0, label: '1,050 Karma' },
];

// ── Average Output Multipliers ─────────────────────────────────────────────────
// From wiki.guildwars2.com/wiki/Mystic_Forge/Material_Promotion notes
// Common tiers 1-4: x40 output (verified from recipe tables)
// Common tier 5: x10 output
// Fine tiers 1-4: x7 output (some are x6)
// Fine tier 5: x5 or x6 output

// ── Recipe Helpers ────────────────────────────────────────────────────────────
const F = FORGE_IDS; // shorthand

function ing(itemId, count, name) {
  return { itemId, count, name };
}

// ── Material Promotion Recipes ────────────────────────────────────────────────
// All recipes follow the pattern: 250× tier(n-1) + 1× tier(n) + dust/crystal + Phil's Stone
// The 1× of the output is a SEED — the visited set handles the self-reference cycle.

export const MATERIAL_PROMOTION_RECIPES = [
  // ── Cloth Scraps ──────────────────────────────────────────────────────────
  {
    id: 'mp_wool_scrap',
    name: 'Wool Scrap',
    outputId: F.WOOL_SCRAP,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Cloth Scraps',
    inputs: [
      ing(F.JUTE_SCRAP, 250, 'Jute Scrap'),
      ing(F.WOOL_SCRAP, 1, 'Wool Scrap'),
      ing(F.PILE_OF_SHIMMERING_DUST, 5, 'Pile of Shimmering Dust'),
      ing(F.PHILOSOPHER_STONE, 1, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_cotton_scrap',
    name: 'Cotton Scrap',
    outputId: F.COTTON_SCRAP,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Cloth Scraps',
    inputs: [
      ing(F.WOOL_SCRAP, 250, 'Wool Scrap'),
      ing(F.COTTON_SCRAP, 1, 'Cotton Scrap'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 2, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_linen_scrap',
    name: 'Linen Scrap',
    outputId: F.LINEN_SCRAP,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Cloth Scraps',
    inputs: [
      ing(F.COTTON_SCRAP, 250, 'Cotton Scrap'),
      ing(F.LINEN_SCRAP, 1, 'Linen Scrap'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 3, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_silk_scrap',
    name: 'Silk Scrap',
    outputId: F.SILK_SCRAP,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Cloth Scraps',
    inputs: [
      ing(F.LINEN_SCRAP, 250, 'Linen Scrap'),
      ing(F.SILK_SCRAP, 1, 'Silk Scrap'),
      ing(F.PILE_OF_INCANDESCENT_DUST, 5, 'Pile of Incandescent Dust'),
      ing(F.PHILOSOPHER_STONE, 4, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_gossamer_scrap',
    name: 'Gossamer Scrap',
    outputId: F.GOSSAMER_SCRAP,
    outputCount: 10,
    outputIsAverage: true,
    subcategory: 'Cloth Scraps',
    inputs: [
      ing(F.SILK_SCRAP, 250, 'Silk Scrap'),
      ing(F.GOSSAMER_SCRAP, 1, 'Gossamer Scrap'),
      ing(F.PILE_OF_CRYSTALLINE_DUST, 5, 'Pile of Crystalline Dust'),
      ing(F.PHILOSOPHER_STONE, 5, "Philosopher's Stone"),
    ],
  },

  // ── Leather Sections ──────────────────────────────────────────────────────
  {
    id: 'mp_thin_leather',
    name: 'Thin Leather Section',
    outputId: F.THIN_LEATHER_SECTION,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Leather Sections',
    inputs: [
      ing(F.RAWHIDE_LEATHER_SECTION, 250, 'Rawhide Leather Section'),
      ing(F.THIN_LEATHER_SECTION, 1, 'Thin Leather Section'),
      ing(F.PILE_OF_SHIMMERING_DUST, 5, 'Pile of Shimmering Dust'),
      ing(F.PHILOSOPHER_STONE, 1, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_coarse_leather',
    name: 'Coarse Leather Section',
    outputId: F.COARSE_LEATHER_SECTION,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Leather Sections',
    inputs: [
      ing(F.THIN_LEATHER_SECTION, 250, 'Thin Leather Section'),
      ing(F.COARSE_LEATHER_SECTION, 1, 'Coarse Leather Section'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 2, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_rugged_leather',
    name: 'Rugged Leather Section',
    outputId: F.RUGGED_LEATHER_SECTION,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Leather Sections',
    inputs: [
      ing(F.COARSE_LEATHER_SECTION, 250, 'Coarse Leather Section'),
      ing(F.RUGGED_LEATHER_SECTION, 1, 'Rugged Leather Section'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 3, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_thick_leather',
    name: 'Thick Leather Section',
    outputId: F.THICK_LEATHER_SECTION,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Leather Sections',
    inputs: [
      ing(F.RUGGED_LEATHER_SECTION, 250, 'Rugged Leather Section'),
      ing(F.THICK_LEATHER_SECTION, 1, 'Thick Leather Section'),
      ing(F.PILE_OF_INCANDESCENT_DUST, 5, 'Pile of Incandescent Dust'),
      ing(F.PHILOSOPHER_STONE, 4, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_hardened_leather',
    name: 'Hardened Leather Section',
    outputId: F.HARDENED_LEATHER_SECTION,
    outputCount: 10,
    outputIsAverage: true,
    subcategory: 'Leather Sections',
    inputs: [
      ing(F.THICK_LEATHER_SECTION, 250, 'Thick Leather Section'),
      ing(F.HARDENED_LEATHER_SECTION, 1, 'Hardened Leather Section'),
      ing(F.PILE_OF_CRYSTALLINE_DUST, 5, 'Pile of Crystalline Dust'),
      ing(F.PHILOSOPHER_STONE, 5, "Philosopher's Stone"),
    ],
  },

  // ── Metal Ore ─────────────────────────────────────────────────────────────
  {
    id: 'mp_iron_ore',
    name: 'Iron Ore',
    outputId: F.IRON_ORE,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Metal Ore',
    inputs: [
      ing(F.COPPER_ORE, 250, 'Copper Ore'),
      ing(F.IRON_ORE, 1, 'Iron Ore'),
      ing(F.PILE_OF_SHIMMERING_DUST, 5, 'Pile of Shimmering Dust'),
      ing(F.PHILOSOPHER_STONE, 1, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_gold_ore',
    name: 'Gold Ore',
    outputId: F.GOLD_ORE,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Metal Ore',
    inputs: [
      ing(F.SILVER_ORE, 250, 'Silver Ore'),
      ing(F.GOLD_ORE, 1, 'Gold Ore'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 2, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_platinum_ore_a',
    name: 'Platinum Ore (from Iron)',
    outputId: F.PLATINUM_ORE,
    outputCount: 20,
    outputIsAverage: true,
    subcategory: 'Metal Ore',
    inputs: [
      ing(F.IRON_ORE, 250, 'Iron Ore'),
      ing(F.PLATINUM_ORE, 1, 'Platinum Ore'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 2, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_platinum_ore_b',
    name: 'Platinum Ore (from Gold)',
    outputId: F.PLATINUM_ORE,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Metal Ore',
    inputs: [
      ing(F.PLATINUM_ORE, 1, 'Platinum Ore'),
      ing(F.GOLD_ORE, 250, 'Gold Ore'),
      ing(F.PILE_OF_LUMINOUS_DUST, 5, 'Pile of Luminous Dust'),
      ing(F.PHILOSOPHER_STONE, 4, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_mithril_ore',
    name: 'Mithril Ore',
    outputId: F.MITHRIL_ORE,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Metal Ore',
    inputs: [
      ing(F.PLATINUM_ORE, 250, 'Platinum Ore'),
      ing(F.MITHRIL_ORE, 1, 'Mithril Ore'),
      ing(F.PILE_OF_INCANDESCENT_DUST, 5, 'Pile of Incandescent Dust'),
      ing(F.PHILOSOPHER_STONE, 4, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_orichalcum_ore',
    name: 'Orichalcum Ore',
    outputId: F.ORICHALCUM_ORE,
    outputCount: 10,
    outputIsAverage: true,
    subcategory: 'Metal Ore',
    inputs: [
      ing(F.MITHRIL_ORE, 250, 'Mithril Ore'),
      ing(F.ORICHALCUM_ORE, 1, 'Orichalcum Ore'),
      ing(F.PILE_OF_CRYSTALLINE_DUST, 5, 'Pile of Crystalline Dust'),
      ing(F.PHILOSOPHER_STONE, 5, "Philosopher's Stone"),
    ],
  },

  // ── Wood Logs ─────────────────────────────────────────────────────────────
  {
    id: 'mp_soft_wood_log',
    name: 'Soft Wood Log',
    outputId: F.SOFT_WOOD_LOG,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Wood Logs',
    inputs: [
      ing(F.GREEN_WOOD_LOG, 250, 'Green Wood Log'),
      ing(F.SOFT_WOOD_LOG, 1, 'Soft Wood Log'),
      ing(F.PILE_OF_SHIMMERING_DUST, 5, 'Pile of Shimmering Dust'),
      ing(F.PHILOSOPHER_STONE, 1, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_seasoned_wood_log',
    name: 'Seasoned Wood Log',
    outputId: F.SEASONED_WOOD_LOG,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Wood Logs',
    inputs: [
      ing(F.SOFT_WOOD_LOG, 250, 'Soft Wood Log'),
      ing(F.SEASONED_WOOD_LOG, 1, 'Seasoned Wood Log'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 2, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_hard_wood_log',
    name: 'Hard Wood Log',
    outputId: F.HARD_WOOD_LOG,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Wood Logs',
    inputs: [
      ing(F.SEASONED_WOOD_LOG, 250, 'Seasoned Wood Log'),
      ing(F.HARD_WOOD_LOG, 1, 'Hard Wood Log'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 3, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_elder_wood_log',
    name: 'Elder Wood Log',
    outputId: F.ELDER_WOOD_LOG,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Wood Logs',
    inputs: [
      ing(F.HARD_WOOD_LOG, 250, 'Hard Wood Log'),
      ing(F.ELDER_WOOD_LOG, 1, 'Elder Wood Log'),
      ing(F.PILE_OF_INCANDESCENT_DUST, 5, 'Pile of Incandescent Dust'),
      ing(F.PHILOSOPHER_STONE, 4, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_ancient_wood_log',
    name: 'Ancient Wood Log',
    outputId: F.ANCIENT_WOOD_LOG,
    outputCount: 10,
    outputIsAverage: true,
    subcategory: 'Wood Logs',
    inputs: [
      ing(F.ELDER_WOOD_LOG, 250, 'Elder Wood Log'),
      ing(F.ANCIENT_WOOD_LOG, 1, 'Ancient Wood Log'),
      ing(F.PILE_OF_CRYSTALLINE_DUST, 5, 'Pile of Crystalline Dust'),
      ing(F.PHILOSOPHER_STONE, 5, "Philosopher's Stone"),
    ],
  },

  // ── Bolts of Cloth ────────────────────────────────────────────────────────
  {
    id: 'mp_bolt_of_wool',
    name: 'Bolt of Wool',
    outputId: F.BOLT_OF_WOOL,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Bolts of Cloth',
    inputs: [
      ing(F.BOLT_OF_JUTE, 250, 'Bolt of Jute'),
      ing(F.BOLT_OF_WOOL, 1, 'Bolt of Wool'),
      ing(F.PILE_OF_SHIMMERING_DUST, 5, 'Pile of Shimmering Dust'),
      ing(F.PHILOSOPHER_STONE, 2, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_bolt_of_cotton',
    name: 'Bolt of Cotton',
    outputId: F.BOLT_OF_COTTON,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Bolts of Cloth',
    inputs: [
      ing(F.BOLT_OF_WOOL, 250, 'Bolt of Wool'),
      ing(F.BOLT_OF_COTTON, 1, 'Bolt of Cotton'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 4, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_bolt_of_linen',
    name: 'Bolt of Linen',
    outputId: F.BOLT_OF_LINEN,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Bolts of Cloth',
    inputs: [
      ing(F.BOLT_OF_COTTON, 250, 'Bolt of Cotton'),
      ing(F.BOLT_OF_LINEN, 1, 'Bolt of Linen'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 6, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_bolt_of_silk',
    name: 'Bolt of Silk',
    outputId: F.BOLT_OF_SILK,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Bolts of Cloth',
    inputs: [
      ing(F.BOLT_OF_LINEN, 250, 'Bolt of Linen'),
      ing(F.BOLT_OF_SILK, 1, 'Bolt of Silk'),
      ing(F.PILE_OF_INCANDESCENT_DUST, 5, 'Pile of Incandescent Dust'),
      ing(F.PHILOSOPHER_STONE, 8, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_bolt_of_gossamer',
    name: 'Bolt of Gossamer',
    outputId: F.BOLT_OF_GOSSAMER,
    outputCount: 10,
    outputIsAverage: true,
    subcategory: 'Bolts of Cloth',
    inputs: [
      ing(F.BOLT_OF_SILK, 250, 'Bolt of Silk'),
      ing(F.BOLT_OF_GOSSAMER, 1, 'Bolt of Gossamer'),
      ing(F.PILE_OF_CRYSTALLINE_DUST, 5, 'Pile of Crystalline Dust'),
      ing(F.PHILOSOPHER_STONE, 10, "Philosopher's Stone"),
    ],
  },

  // ── Leather Squares ───────────────────────────────────────────────────────
  {
    id: 'mp_cured_thin_leather',
    name: 'Cured Thin Leather Square',
    outputId: F.CURED_THIN_LEATHER_SQUARE,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Leather Squares',
    inputs: [
      ing(F.STRETCHED_RAWHIDE_LEATHER_SQUARE, 250, 'Stretched Rawhide Leather Square'),
      ing(F.CURED_THIN_LEATHER_SQUARE, 1, 'Cured Thin Leather Square'),
      ing(F.PILE_OF_SHIMMERING_DUST, 5, 'Pile of Shimmering Dust'),
      ing(F.PHILOSOPHER_STONE, 2, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_cured_coarse_leather',
    name: 'Cured Coarse Leather Square',
    outputId: F.CURED_COARSE_LEATHER_SQUARE,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Leather Squares',
    inputs: [
      ing(F.CURED_THIN_LEATHER_SQUARE, 250, 'Cured Thin Leather Square'),
      ing(F.CURED_COARSE_LEATHER_SQUARE, 1, 'Cured Coarse Leather Square'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 4, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_cured_rugged_leather',
    name: 'Cured Rugged Leather Square',
    outputId: F.CURED_RUGGED_LEATHER_SQUARE,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Leather Squares',
    inputs: [
      ing(F.CURED_COARSE_LEATHER_SQUARE, 250, 'Cured Coarse Leather Square'),
      ing(F.CURED_RUGGED_LEATHER_SQUARE, 1, 'Cured Rugged Leather Square'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 6, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_cured_thick_leather',
    name: 'Cured Thick Leather Square',
    outputId: F.CURED_THICK_LEATHER_SQUARE,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Leather Squares',
    inputs: [
      ing(F.CURED_RUGGED_LEATHER_SQUARE, 250, 'Cured Rugged Leather Square'),
      ing(F.CURED_THICK_LEATHER_SQUARE, 1, 'Cured Thick Leather Square'),
      ing(F.PILE_OF_INCANDESCENT_DUST, 5, 'Pile of Incandescent Dust'),
      ing(F.PHILOSOPHER_STONE, 8, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_cured_hardened_leather',
    name: 'Cured Hardened Leather Square',
    outputId: F.CURED_HARDENED_LEATHER_SQUARE,
    outputCount: 10,
    outputIsAverage: true,
    subcategory: 'Leather Squares',
    inputs: [
      ing(F.CURED_THICK_LEATHER_SQUARE, 250, 'Cured Thick Leather Square'),
      ing(F.CURED_HARDENED_LEATHER_SQUARE, 1, 'Cured Hardened Leather Square'),
      ing(F.PILE_OF_CRYSTALLINE_DUST, 5, 'Pile of Crystalline Dust'),
      ing(F.PHILOSOPHER_STONE, 10, "Philosopher's Stone"),
    ],
  },

  // ── Metal Ingots ──────────────────────────────────────────────────────────
  {
    id: 'mp_silver_ingot',
    name: 'Silver Ingot',
    outputId: F.SILVER_INGOT,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Metal Ingots',
    inputs: [
      ing(F.COPPER_INGOT, 250, 'Copper Ingot'),
      ing(F.SILVER_INGOT, 1, 'Silver Ingot'),
      ing(F.PILE_OF_SHIMMERING_DUST, 5, 'Pile of Shimmering Dust'),
      ing(F.PHILOSOPHER_STONE, 2, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_iron_ingot',
    name: 'Iron Ingot',
    outputId: F.IRON_INGOT,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Metal Ingots',
    inputs: [
      ing(F.BRONZE_INGOT, 250, 'Bronze Ingot'),
      ing(F.IRON_INGOT, 1, 'Iron Ingot'),
      ing(F.PILE_OF_SHIMMERING_DUST, 5, 'Pile of Shimmering Dust'),
      ing(F.PHILOSOPHER_STONE, 2, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_gold_ingot',
    name: 'Gold Ingot',
    outputId: F.GOLD_INGOT,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Metal Ingots',
    inputs: [
      ing(F.SILVER_INGOT, 250, 'Silver Ingot'),
      ing(F.GOLD_INGOT, 1, 'Gold Ingot'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 4, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_steel_ingot',
    name: 'Steel Ingot',
    outputId: F.STEEL_INGOT,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Metal Ingots',
    inputs: [
      ing(F.IRON_INGOT, 250, 'Iron Ingot'),
      ing(F.STEEL_INGOT, 1, 'Steel Ingot'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 4, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_platinum_ingot',
    name: 'Platinum Ingot',
    outputId: F.PLATINUM_INGOT,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Metal Ingots',
    inputs: [
      ing(F.GOLD_INGOT, 250, 'Gold Ingot'),
      ing(F.PLATINUM_INGOT, 1, 'Platinum Ingot'),
      ing(F.PILE_OF_LUMINOUS_DUST, 5, 'Pile of Luminous Dust'),
      ing(F.PHILOSOPHER_STONE, 6, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_mithril_ingot_a',
    name: 'Mithril Ingot (from Darksteel)',
    outputId: F.MITHRIL_INGOT,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Metal Ingots',
    inputs: [
      ing(F.DARKSTEEL_INGOT, 250, 'Darksteel Ingot'),
      ing(F.MITHRIL_INGOT, 1, 'Mithril Ingot'),
      ing(F.PILE_OF_LUMINOUS_DUST, 5, 'Pile of Luminous Dust'),
      ing(F.PHILOSOPHER_STONE, 6, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_mithril_ingot_b',
    name: 'Mithril Ingot (from Platinum)',
    outputId: F.MITHRIL_INGOT,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Metal Ingots',
    inputs: [
      ing(F.MITHRIL_INGOT, 1, 'Mithril Ingot'),
      ing(F.PLATINUM_INGOT, 250, 'Platinum Ingot'),
      ing(F.PILE_OF_INCANDESCENT_DUST, 5, 'Pile of Incandescent Dust'),
      ing(F.PHILOSOPHER_STONE, 8, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_orichalcum_ingot',
    name: 'Orichalcum Ingot',
    outputId: F.ORICHALCUM_INGOT,
    outputCount: 10,
    outputIsAverage: true,
    subcategory: 'Metal Ingots',
    inputs: [
      ing(F.MITHRIL_INGOT, 250, 'Mithril Ingot'),
      ing(F.ORICHALCUM_INGOT, 1, 'Orichalcum Ingot'),
      ing(F.PILE_OF_CRYSTALLINE_DUST, 5, 'Pile of Crystalline Dust'),
      ing(F.PHILOSOPHER_STONE, 10, "Philosopher's Stone"),
    ],
  },

  // ── Wood Planks ───────────────────────────────────────────────────────────
  {
    id: 'mp_soft_wood_plank',
    name: 'Soft Wood Plank',
    outputId: F.SOFT_WOOD_PLANK,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Wood Planks',
    inputs: [
      ing(F.GREEN_WOOD_PLANK, 250, 'Green Wood Plank'),
      ing(F.SOFT_WOOD_PLANK, 1, 'Soft Wood Plank'),
      ing(F.PILE_OF_SHIMMERING_DUST, 5, 'Pile of Shimmering Dust'),
      ing(F.PHILOSOPHER_STONE, 2, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_seasoned_wood_plank',
    name: 'Seasoned Wood Plank',
    outputId: F.SEASONED_WOOD_PLANK,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Wood Planks',
    inputs: [
      ing(F.SOFT_WOOD_PLANK, 250, 'Soft Wood Plank'),
      ing(F.SEASONED_WOOD_PLANK, 1, 'Seasoned Wood Plank'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 4, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_hard_wood_plank',
    name: 'Hard Wood Plank',
    outputId: F.HARD_WOOD_PLANK,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Wood Planks',
    inputs: [
      ing(F.SEASONED_WOOD_PLANK, 250, 'Seasoned Wood Plank'),
      ing(F.HARD_WOOD_PLANK, 1, 'Hard Wood Plank'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 6, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_elder_wood_plank',
    name: 'Elder Wood Plank',
    outputId: F.ELDER_WOOD_PLANK,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Wood Planks',
    inputs: [
      ing(F.HARD_WOOD_PLANK, 250, 'Hard Wood Plank'),
      ing(F.ELDER_WOOD_PLANK, 1, 'Elder Wood Plank'),
      ing(F.PILE_OF_INCANDESCENT_DUST, 5, 'Pile of Incandescent Dust'),
      ing(F.PHILOSOPHER_STONE, 8, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_ancient_wood_plank',
    name: 'Ancient Wood Plank',
    outputId: F.ANCIENT_WOOD_PLANK,
    outputCount: 10,
    outputIsAverage: true,
    subcategory: 'Wood Planks',
    inputs: [
      ing(F.ELDER_WOOD_PLANK, 250, 'Elder Wood Plank'),
      ing(F.ANCIENT_WOOD_PLANK, 1, 'Ancient Wood Plank'),
      ing(F.PILE_OF_CRYSTALLINE_DUST, 5, 'Pile of Crystalline Dust'),
      ing(F.PHILOSOPHER_STONE, 10, "Philosopher's Stone"),
    ],
  },

  // ── Piles of Dust ─────────────────────────────────────────────────────────
  // Dust recipes use Mystic Crystals instead of dusts for the catalyst
  {
    id: 'mp_shimmering_dust',
    name: 'Pile of Shimmering Dust',
    outputId: F.PILE_OF_SHIMMERING_DUST,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Piles of Dust',
    inputs: [
      ing(F.PILE_OF_GLITTERING_DUST, 250, 'Pile of Glittering Dust'),
      ing(F.PILE_OF_SHIMMERING_DUST, 1, 'Pile of Shimmering Dust'),
      ing(F.MYSTIC_CRYSTAL, 1, 'Mystic Crystal'),
      ing(F.PHILOSOPHER_STONE, 1, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_radiant_dust',
    name: 'Pile of Radiant Dust',
    outputId: F.PILE_OF_RADIANT_DUST,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Piles of Dust',
    inputs: [
      ing(F.PILE_OF_SHIMMERING_DUST, 250, 'Pile of Shimmering Dust'),
      ing(F.PILE_OF_RADIANT_DUST, 1, 'Pile of Radiant Dust'),
      ing(F.MYSTIC_CRYSTAL, 2, 'Mystic Crystal'),
      ing(F.PHILOSOPHER_STONE, 2, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_luminous_dust',
    name: 'Pile of Luminous Dust',
    outputId: F.PILE_OF_LUMINOUS_DUST,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Piles of Dust',
    inputs: [
      ing(F.PILE_OF_RADIANT_DUST, 250, 'Pile of Radiant Dust'),
      ing(F.PILE_OF_LUMINOUS_DUST, 1, 'Pile of Luminous Dust'),
      ing(F.MYSTIC_CRYSTAL, 3, 'Mystic Crystal'),
      ing(F.PHILOSOPHER_STONE, 3, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_incandescent_dust',
    name: 'Pile of Incandescent Dust',
    outputId: F.PILE_OF_INCANDESCENT_DUST,
    outputCount: 40,
    outputIsAverage: true,
    subcategory: 'Piles of Dust',
    inputs: [
      ing(F.PILE_OF_LUMINOUS_DUST, 250, 'Pile of Luminous Dust'),
      ing(F.PILE_OF_INCANDESCENT_DUST, 1, 'Pile of Incandescent Dust'),
      ing(F.MYSTIC_CRYSTAL, 4, 'Mystic Crystal'),
      ing(F.PHILOSOPHER_STONE, 4, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_crystalline_dust',
    name: 'Pile of Crystalline Dust',
    outputId: F.PILE_OF_CRYSTALLINE_DUST,
    outputCount: 6,
    outputIsAverage: true,
    subcategory: 'Piles of Dust',
    inputs: [
      ing(F.PILE_OF_INCANDESCENT_DUST, 250, 'Pile of Incandescent Dust'),
      ing(F.PILE_OF_CRYSTALLINE_DUST, 1, 'Pile of Crystalline Dust'),
      ing(F.MYSTIC_CRYSTAL, 5, 'Mystic Crystal'),
      ing(F.PHILOSOPHER_STONE, 5, "Philosopher's Stone"),
    ],
  },

  // ── Bones ─────────────────────────────────────────────────────────────────
  {
    id: 'mp_bone_shard',
    name: 'Bone Shard',
    outputId: F.BONE_SHARD,
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Bones',
    inputs: [
      ing(F.BONE_CHIP, 50, 'Bone Chip'),
      ing(F.BONE_SHARD, 1, 'Bone Shard'),
      ing(F.PILE_OF_SHIMMERING_DUST, 5, 'Pile of Shimmering Dust'),
      ing(F.PHILOSOPHER_STONE, 1, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_bone',
    name: 'Bone',
    outputId: F.BONE,
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Bones',
    inputs: [
      ing(F.BONE_SHARD, 50, 'Bone Shard'),
      ing(F.BONE, 1, 'Bone'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 2, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_heavy_bone',
    name: 'Heavy Bone',
    outputId: F.HEAVY_BONE,
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Bones',
    inputs: [
      ing(F.BONE, 50, 'Bone'),
      ing(F.HEAVY_BONE, 1, 'Heavy Bone'),
      ing(F.PILE_OF_LUMINOUS_DUST, 5, 'Pile of Luminous Dust'),
      ing(F.PHILOSOPHER_STONE, 3, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_large_bone',
    name: 'Large Bone',
    outputId: F.LARGE_BONE,
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Bones',
    inputs: [
      ing(F.HEAVY_BONE, 50, 'Heavy Bone'),
      ing(F.LARGE_BONE, 1, 'Large Bone'),
      ing(F.PILE_OF_INCANDESCENT_DUST, 5, 'Pile of Incandescent Dust'),
      ing(F.PHILOSOPHER_STONE, 4, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_ancient_bone',
    name: 'Ancient Bone',
    outputId: F.ANCIENT_BONE,
    outputCount: 5,
    outputIsAverage: true,
    subcategory: 'Bones',
    inputs: [
      ing(F.LARGE_BONE, 50, 'Large Bone'),
      ing(F.ANCIENT_BONE, 1, 'Ancient Bone'),
      ing(F.PILE_OF_CRYSTALLINE_DUST, 5, 'Pile of Crystalline Dust'),
      ing(F.PHILOSOPHER_STONE, 5, "Philosopher's Stone"),
    ],
  },

  // ── Claws ─────────────────────────────────────────────────────────────────
  {
    id: 'mp_small_claw',
    name: 'Small Claw',
    outputId: F.SMALL_CLAW,
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Claws',
    inputs: [
      ing(F.TINY_CLAW, 50, 'Tiny Claw'),
      ing(F.SMALL_CLAW, 1, 'Small Claw'),
      ing(F.PILE_OF_SHIMMERING_DUST, 5, 'Pile of Shimmering Dust'),
      ing(F.PHILOSOPHER_STONE, 1, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_claw',
    name: 'Claw',
    outputId: F.CLAW,
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Claws',
    inputs: [
      ing(F.SMALL_CLAW, 50, 'Small Claw'),
      ing(F.CLAW, 1, 'Claw'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 2, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_sharp_claw',
    name: 'Sharp Claw',
    outputId: F.SHARP_CLAW,
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Claws',
    inputs: [
      ing(F.CLAW, 50, 'Claw'),
      ing(F.SHARP_CLAW, 1, 'Sharp Claw'),
      ing(F.PILE_OF_LUMINOUS_DUST, 5, 'Pile of Luminous Dust'),
      ing(F.PHILOSOPHER_STONE, 3, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_large_claw',
    name: 'Large Claw',
    outputId: F.LARGE_CLAW,
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Claws',
    inputs: [
      ing(F.SHARP_CLAW, 50, 'Sharp Claw'),
      ing(F.LARGE_CLAW, 1, 'Large Claw'),
      ing(F.PILE_OF_INCANDESCENT_DUST, 5, 'Pile of Incandescent Dust'),
      ing(F.PHILOSOPHER_STONE, 4, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_vicious_claw',
    name: 'Vicious Claw',
    outputId: F.VICIOUS_CLAW,
    outputCount: 6,
    outputIsAverage: true,
    subcategory: 'Claws',
    inputs: [
      ing(F.LARGE_CLAW, 50, 'Large Claw'),
      ing(F.VICIOUS_CLAW, 1, 'Vicious Claw'),
      ing(F.PILE_OF_CRYSTALLINE_DUST, 5, 'Pile of Crystalline Dust'),
      ing(F.PHILOSOPHER_STONE, 5, "Philosopher's Stone"),
    ],
  },

  // ── Fangs ─────────────────────────────────────────────────────────────────
  {
    id: 'mp_small_fang',
    name: 'Small Fang',
    outputId: F.SMALL_FANG,
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Fangs',
    inputs: [
      ing(F.TINY_FANG, 50, 'Tiny Fang'),
      ing(F.SMALL_FANG, 1, 'Small Fang'),
      ing(F.PILE_OF_SHIMMERING_DUST, 5, 'Pile of Shimmering Dust'),
      ing(F.PHILOSOPHER_STONE, 1, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_fang',
    name: 'Fang',
    outputId: F.FANG,
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Fangs',
    inputs: [
      ing(F.SMALL_FANG, 50, 'Small Fang'),
      ing(F.FANG, 1, 'Fang'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 2, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_sharp_fang',
    name: 'Sharp Fang',
    outputId: F.SHARP_FANG,
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Fangs',
    inputs: [
      ing(F.FANG, 50, 'Fang'),
      ing(F.SHARP_FANG, 1, 'Sharp Fang'),
      ing(F.PILE_OF_LUMINOUS_DUST, 5, 'Pile of Luminous Dust'),
      ing(F.PHILOSOPHER_STONE, 3, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_large_fang',
    name: 'Large Fang',
    outputId: F.LARGE_FANG,
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Fangs',
    inputs: [
      ing(F.SHARP_FANG, 50, 'Sharp Fang'),
      ing(F.LARGE_FANG, 1, 'Large Fang'),
      ing(F.PILE_OF_INCANDESCENT_DUST, 5, 'Pile of Incandescent Dust'),
      ing(F.PHILOSOPHER_STONE, 4, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_vicious_fang',
    name: 'Vicious Fang',
    outputId: F.VICIOUS_FANG,
    outputCount: 5,
    outputIsAverage: true,
    subcategory: 'Fangs',
    inputs: [
      ing(F.LARGE_FANG, 50, 'Large Fang'),
      ing(F.VICIOUS_FANG, 1, 'Vicious Fang'),
      ing(F.PILE_OF_CRYSTALLINE_DUST, 5, 'Pile of Crystalline Dust'),
      ing(F.PHILOSOPHER_STONE, 5, "Philosopher's Stone"),
    ],
  },

  // ── Scales ────────────────────────────────────────────────────────────────
  {
    id: 'mp_small_scale',
    name: 'Small Scale',
    outputId: F.SMALL_SCALE,
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Scales',
    inputs: [
      ing(F.TINY_SCALE, 50, 'Tiny Scale'),
      ing(F.SMALL_SCALE, 1, 'Small Scale'),
      ing(F.PILE_OF_SHIMMERING_DUST, 5, 'Pile of Shimmering Dust'),
      ing(F.PHILOSOPHER_STONE, 1, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_scale',
    name: 'Scale',
    outputId: F.SCALE,
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Scales',
    inputs: [
      ing(F.SMALL_SCALE, 50, 'Small Scale'),
      ing(F.SCALE, 1, 'Scale'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 2, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_smooth_scale',
    name: 'Smooth Scale',
    outputId: F.SMOOTH_SCALE,
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Scales',
    inputs: [
      ing(F.SCALE, 50, 'Scale'),
      ing(F.SMOOTH_SCALE, 1, 'Smooth Scale'),
      ing(F.PILE_OF_LUMINOUS_DUST, 5, 'Pile of Luminous Dust'),
      ing(F.PHILOSOPHER_STONE, 3, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_large_scale',
    name: 'Large Scale',
    outputId: F.LARGE_SCALE,
    outputCount: 6,
    outputIsAverage: true,
    subcategory: 'Scales',
    inputs: [
      ing(F.SMOOTH_SCALE, 50, 'Smooth Scale'),
      ing(F.LARGE_SCALE, 1, 'Large Scale'),
      ing(F.PILE_OF_INCANDESCENT_DUST, 5, 'Pile of Incandescent Dust'),
      ing(F.PHILOSOPHER_STONE, 4, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_armored_scale',
    name: 'Armored Scale',
    outputId: F.ARMORED_SCALE,
    outputCount: 5,
    outputIsAverage: true,
    subcategory: 'Scales',
    inputs: [
      ing(F.LARGE_SCALE, 50, 'Large Scale'),
      ing(F.ARMORED_SCALE, 1, 'Armored Scale'),
      ing(F.PILE_OF_CRYSTALLINE_DUST, 5, 'Pile of Crystalline Dust'),
      ing(F.PHILOSOPHER_STONE, 5, "Philosopher's Stone"),
    ],
  },

  // ── Totems ────────────────────────────────────────────────────────────────
  {
    id: 'mp_small_totem',
    name: 'Small Totem',
    outputId: null, // NAME_LOOKUP
    outputIdName: 'Small Totem',
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Totems',
    inputs: [
      ing(null, 50, 'Tiny Totem'),
      ing(null, 1, 'Small Totem'),
      ing(F.PILE_OF_SHIMMERING_DUST, 5, 'Pile of Shimmering Dust'),
      ing(F.PHILOSOPHER_STONE, 1, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_totem',
    name: 'Totem',
    outputId: null,
    outputIdName: 'Totem',
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Totems',
    inputs: [
      ing(null, 50, 'Small Totem'),
      ing(null, 1, 'Totem'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 2, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_engraved_totem',
    name: 'Engraved Totem',
    outputId: null,
    outputIdName: 'Engraved Totem',
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Totems',
    inputs: [
      ing(null, 50, 'Totem'),
      ing(null, 1, 'Engraved Totem'),
      ing(F.PILE_OF_LUMINOUS_DUST, 5, 'Pile of Luminous Dust'),
      ing(F.PHILOSOPHER_STONE, 3, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_intricate_totem',
    name: 'Intricate Totem',
    outputId: null,
    outputIdName: 'Intricate Totem',
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Totems',
    inputs: [
      ing(null, 50, 'Engraved Totem'),
      ing(null, 1, 'Intricate Totem'),
      ing(F.PILE_OF_INCANDESCENT_DUST, 5, 'Pile of Incandescent Dust'),
      ing(F.PHILOSOPHER_STONE, 4, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_elaborate_totem',
    name: 'Elaborate Totem',
    outputId: null,
    outputIdName: 'Elaborate Totem',
    outputCount: 5,
    outputIsAverage: true,
    subcategory: 'Totems',
    inputs: [
      ing(null, 50, 'Intricate Totem'),
      ing(null, 1, 'Elaborate Totem'),
      ing(F.PILE_OF_CRYSTALLINE_DUST, 5, 'Pile of Crystalline Dust'),
      ing(F.PHILOSOPHER_STONE, 5, "Philosopher's Stone"),
    ],
  },

  // ── Venom Sacs ────────────────────────────────────────────────────────────
  {
    id: 'mp_small_venom_sac',
    name: 'Small Venom Sac',
    outputId: null,
    outputIdName: 'Small Venom Sac',
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Venom Sacs',
    inputs: [
      ing(null, 50, 'Tiny Venom Sac'),
      ing(null, 1, 'Small Venom Sac'),
      ing(F.PILE_OF_SHIMMERING_DUST, 5, 'Pile of Shimmering Dust'),
      ing(F.PHILOSOPHER_STONE, 1, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_venom_sac',
    name: 'Venom Sac',
    outputId: null,
    outputIdName: 'Venom Sac',
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Venom Sacs',
    inputs: [
      ing(null, 50, 'Small Venom Sac'),
      ing(null, 1, 'Venom Sac'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 2, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_full_venom_sac',
    name: 'Full Venom Sac',
    outputId: null,
    outputIdName: 'Full Venom Sac',
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Venom Sacs',
    inputs: [
      ing(null, 50, 'Venom Sac'),
      ing(null, 1, 'Full Venom Sac'),
      ing(F.PILE_OF_LUMINOUS_DUST, 5, 'Pile of Luminous Dust'),
      ing(F.PHILOSOPHER_STONE, 3, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_potent_venom_sac',
    name: 'Potent Venom Sac',
    outputId: null,
    outputIdName: 'Potent Venom Sac',
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Venom Sacs',
    inputs: [
      ing(null, 50, 'Full Venom Sac'),
      ing(null, 1, 'Potent Venom Sac'),
      ing(F.PILE_OF_INCANDESCENT_DUST, 5, 'Pile of Incandescent Dust'),
      ing(F.PHILOSOPHER_STONE, 4, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_powerful_venom_sac',
    name: 'Powerful Venom Sac',
    outputId: null,
    outputIdName: 'Powerful Venom Sac',
    outputCount: 5,
    outputIsAverage: true,
    subcategory: 'Venom Sacs',
    inputs: [
      ing(null, 50, 'Potent Venom Sac'),
      ing(null, 1, 'Powerful Venom Sac'),
      ing(F.PILE_OF_CRYSTALLINE_DUST, 5, 'Pile of Crystalline Dust'),
      ing(F.PHILOSOPHER_STONE, 5, "Philosopher's Stone"),
    ],
  },

  // ── Vials of Blood ────────────────────────────────────────────────────────
  {
    id: 'mp_thin_blood',
    name: 'Vial of Thin Blood',
    outputId: null,
    outputIdName: 'Vial of Thin Blood',
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Vials of Blood',
    inputs: [
      ing(null, 50, 'Vial of Weak Blood'),
      ing(null, 1, 'Vial of Thin Blood'),
      ing(F.PILE_OF_SHIMMERING_DUST, 5, 'Pile of Shimmering Dust'),
      ing(F.PHILOSOPHER_STONE, 1, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_blood',
    name: 'Vial of Blood',
    outputId: null,
    outputIdName: 'Vial of Blood',
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Vials of Blood',
    inputs: [
      ing(null, 50, 'Vial of Thin Blood'),
      ing(null, 1, 'Vial of Blood'),
      ing(F.PILE_OF_RADIANT_DUST, 5, 'Pile of Radiant Dust'),
      ing(F.PHILOSOPHER_STONE, 2, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_thick_blood',
    name: 'Vial of Thick Blood',
    outputId: null,
    outputIdName: 'Vial of Thick Blood',
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Vials of Blood',
    inputs: [
      ing(null, 50, 'Vial of Blood'),
      ing(null, 1, 'Vial of Thick Blood'),
      ing(F.PILE_OF_LUMINOUS_DUST, 5, 'Pile of Luminous Dust'),
      ing(F.PHILOSOPHER_STONE, 3, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_potent_blood',
    name: 'Vial of Potent Blood',
    outputId: null,
    outputIdName: 'Vial of Potent Blood',
    outputCount: 7,
    outputIsAverage: true,
    subcategory: 'Vials of Blood',
    inputs: [
      ing(null, 50, 'Vial of Thick Blood'),
      ing(null, 1, 'Vial of Potent Blood'),
      ing(F.PILE_OF_INCANDESCENT_DUST, 5, 'Pile of Incandescent Dust'),
      ing(F.PHILOSOPHER_STONE, 4, "Philosopher's Stone"),
    ],
  },
  {
    id: 'mp_powerful_blood',
    name: 'Vial of Powerful Blood',
    outputId: null,
    outputIdName: 'Vial of Powerful Blood',
    outputCount: 5,
    outputIsAverage: true,
    subcategory: 'Vials of Blood',
    inputs: [
      ing(null, 50, 'Vial of Potent Blood'),
      ing(null, 1, 'Vial of Powerful Blood'),
      ing(F.PILE_OF_CRYSTALLINE_DUST, 5, 'Pile of Crystalline Dust'),
      ing(F.PHILOSOPHER_STONE, 5, "Philosopher's Stone"),
    ],
  },
];

// ── Equipment Recipes (Reference) ─────────────────────────────────────────────
// Generic-input recipes are shown as reference only — no profit math.
// Items with Eldritch Scroll use spirit shards (0 gold cost if you have enough).
export const EQUIPMENT_RECIPES_GENERIC = [
  // Recipes requiring a generic "any exotic [weapon type]"
  {
    id: 'eq_old_ascalon',
    name: 'Old Ascalon',
    weaponType: 'Sword',
    rarity: 'Exotic',
    isGenericInput: true,
    inputs: [
      { name: 'Exotic sword (any)', count: 1, isGeneric: true },
      { name: 'Ectoplasmic Stone', count: 1 },
      { name: "Anthology of Heroes", count: 1 },
      { name: 'Glob of Ectoplasm', count: 100, itemId: F.GLOB_OF_ECTOPLASM },
    ],
  },
  {
    id: 'eq_salvation',
    name: 'Salvation',
    weaponType: 'Greatsword',
    rarity: 'Exotic',
    isGenericInput: true,
    inputs: [
      { name: 'Exotic greatsword (any)', count: 1, isGeneric: true },
      { name: 'Ectoplasmic Stone', count: 1 },
      { name: "Anthology of Heroes", count: 1 },
      { name: 'Bottle of Elonian Wine', count: 100 },
    ],
  },
  {
    id: 'eq_true_mettle',
    name: 'True Mettle',
    weaponType: 'Pistol',
    rarity: 'Exotic',
    isGenericInput: true,
    inputs: [
      { name: 'Exotic pistol (any)', count: 1, isGeneric: true },
      { name: 'Ectoplasmic Stone', count: 1 },
      { name: "Anthology of Heroes", count: 1 },
      { name: 'Mithril Ingot', count: 250, itemId: F.MITHRIL_INGOT },
    ],
  },
  {
    id: 'eq_boneskinner_spine',
    name: "Boneskinner's Spine",
    weaponType: 'Staff',
    rarity: 'Exotic',
    isGenericInput: true,
    inputs: [
      { name: 'Exotic staff (any)', count: 1, isGeneric: true },
      { name: 'Amalgamated Draconic Lodestone', count: 10 },
      { name: 'Eitrite Ingot', count: 50 },
      { name: 'Glob of Ectoplasm', count: 10, itemId: F.GLOB_OF_ECTOPLASM },
    ],
  },
];

// Standard (non-generic) equipment recipes with Eldritch Scroll
// Eldritch Scroll costs 50 Spirit Shards from Miyani
export const EQUIPMENT_RECIPES_STANDARD = [
  { id: 'eq_abyssal_scepter', name: 'Abyssal Scepter', weaponType: 'Scepter', rarity: 'Exotic',
    inputs: [{ name: 'Eldritch Scroll', count: 1, spiritShards: 50 }, { name: 'Mystic Coin', count: 100, itemId: F.MYSTIC_COIN }, { name: 'Glob of Ectoplasm', count: 250, itemId: F.GLOB_OF_ECTOPLASM }, { name: 'Ancient Scepter Rod', count: 250 }] },
  { id: 'eq_accursed_chains', name: 'Accursed Chains', weaponType: 'Focus', rarity: 'Exotic',
    inputs: [{ name: 'Eldritch Scroll', count: 1, spiritShards: 50 }, { name: 'Mystic Coin', count: 30, itemId: F.MYSTIC_COIN }, { name: 'Steel Ingot', count: 250, itemId: F.STEEL_INGOT }, { name: 'Orichalcum Ingot', count: 50, itemId: F.ORICHALCUM_INGOT }] },
  { id: 'eq_courage', name: 'Courage', weaponType: 'Focus', rarity: 'Exotic',
    inputs: [{ name: 'Eldritch Scroll', count: 1, spiritShards: 50 }, { name: 'Mystic Coin', count: 20, itemId: F.MYSTIC_COIN }, { name: 'Pile of Crystalline Dust', count: 20, itemId: F.PILE_OF_CRYSTALLINE_DUST }, { name: 'Bottle of Elonian Wine', count: 1 }] },
  { id: 'eq_dreadwing', name: 'Dreadwing', weaponType: 'Axe', rarity: 'Exotic',
    inputs: [{ name: 'Eldritch Scroll', count: 1, spiritShards: 50 }, { name: 'Mystic Coin', count: 10, itemId: F.MYSTIC_COIN }, { name: 'Small Ancient Haft', count: 10 }, { name: 'Onyx Lodestone', count: 10 }] },
  { id: 'eq_firebringer', name: 'Firebringer', weaponType: 'Sword', rarity: 'Exotic',
    inputs: [{ name: 'Eldritch Scroll', count: 1, spiritShards: 50 }, { name: 'Mystic Coin', count: 30, itemId: F.MYSTIC_COIN }, { name: 'Orichalcum Sword Blade', count: 250 }, { name: 'Molten Lodestone', count: 50 }] },
  { id: 'eq_infinite_light', name: 'Infinite Light', weaponType: 'Sword', rarity: 'Exotic',
    inputs: [{ name: 'Eldritch Scroll', count: 1, spiritShards: 50 }, { name: 'Mystic Coin', count: 100, itemId: F.MYSTIC_COIN }, { name: 'Orichalcum Sword Blade', count: 250 }, { name: 'Charged Lodestone', count: 250 }] },
  { id: 'eq_icy_dragon_sword', name: 'Icy Dragon Sword', weaponType: 'Sword', rarity: 'Exotic',
    inputs: [{ name: 'Eldritch Scroll', count: 1, spiritShards: 50 }, { name: 'Mystic Coin', count: 50, itemId: F.MYSTIC_COIN }, { name: 'Orichalcum Sword Blade', count: 100 }, { name: 'Corrupted Lodestone', count: 50 }] },
  { id: 'eq_jormag_needle', name: "Jormag's Needle", weaponType: 'Dagger', rarity: 'Exotic',
    inputs: [{ name: 'Eldritch Scroll', count: 1, spiritShards: 50 }, { name: 'Mystic Coin', count: 30, itemId: F.MYSTIC_COIN }, { name: 'Corrupted Lodestone', count: 50 }, { name: 'Glacial Lodestone', count: 50 }] },
  { id: 'eq_kryta_salvation', name: "Kryta's Salvation", weaponType: 'Axe', rarity: 'Exotic',
    inputs: [{ name: 'Eldritch Scroll', count: 1, spiritShards: 50 }, { name: 'Mystic Coin', count: 10, itemId: F.MYSTIC_COIN }, { name: 'Small Ancient Haft', count: 10 }, { name: 'Vicious Fang', count: 100, itemId: F.VICIOUS_FANG }] },
  { id: 'eq_mjolnir', name: 'Mjölnir', weaponType: 'Hammer', rarity: 'Exotic',
    inputs: [{ name: 'Eldritch Scroll', count: 1, spiritShards: 50 }, { name: 'Mystic Coin', count: 100, itemId: F.MYSTIC_COIN }, { name: 'Gift of Lightning', count: 1 }, { name: 'Charged Lodestone', count: 250 }] },
  { id: 'eq_reaver_mists', name: 'Reaver of the Mists', weaponType: 'Axe', rarity: 'Exotic',
    inputs: [{ name: 'Eldritch Scroll', count: 1, spiritShards: 50 }, { name: 'Mystic Coin', count: 50, itemId: F.MYSTIC_COIN }, { name: 'Crystal Lodestone', count: 20 }, { name: 'Glob of Ectoplasm', count: 250, itemId: F.GLOB_OF_ECTOPLASM }] },
  { id: 'eq_rusttooth', name: 'Rusttooth', weaponType: 'Sword', rarity: 'Exotic',
    inputs: [{ name: 'Eldritch Scroll', count: 1, spiritShards: 50 }, { name: 'Mystic Coin', count: 10, itemId: F.MYSTIC_COIN }, { name: 'Steel Ingot', count: 10, itemId: F.STEEL_INGOT }, { name: 'Seasoned Wood Plank', count: 10, itemId: F.SEASONED_WOOD_PLANK }] },
  { id: 'eq_stygian_blade', name: 'Stygian Blade', weaponType: 'Sword', rarity: 'Exotic',
    inputs: [{ name: 'Eldritch Scroll', count: 1, spiritShards: 50 }, { name: 'Mystic Coin', count: 50, itemId: F.MYSTIC_COIN }, { name: 'Vial of Powerful Blood', count: 250 }, { name: 'Vicious Claw', count: 250, itemId: F.VICIOUS_CLAW }] },
  { id: 'eq_tear_grenth', name: 'Tear of Grenth', weaponType: 'Dagger', rarity: 'Exotic',
    inputs: [{ name: 'Eldritch Scroll', count: 1, spiritShards: 50 }, { name: 'Mystic Coin', count: 30, itemId: F.MYSTIC_COIN }, { name: 'Pile of Crystalline Dust', count: 250, itemId: F.PILE_OF_CRYSTALLINE_DUST }, { name: 'Molten Lodestone', count: 10 }] },
  { id: 'eq_titans_vengeance', name: "Titans' Vengeance", weaponType: 'Axe', rarity: 'Exotic',
    inputs: [{ name: 'Eldritch Scroll', count: 1, spiritShards: 50 }, { name: 'Mystic Coin', count: 50, itemId: F.MYSTIC_COIN }, { name: 'Destroyer Lodestone', count: 50 }, { name: 'Molten Lodestone', count: 50 }] },
  { id: 'eq_unspoken_curse', name: 'Unspoken Curse', weaponType: 'Sword', rarity: 'Exotic',
    inputs: [{ name: 'Eldritch Scroll', count: 1, spiritShards: 50 }, { name: 'Mystic Coin', count: 50, itemId: F.MYSTIC_COIN }, { name: 'Orichalcum Sword Blade', count: 100 }, { name: 'Destroyer Lodestone', count: 50 }] },
  { id: 'eq_volcanus', name: 'Volcanus', weaponType: 'Greatsword', rarity: 'Exotic',
    inputs: [{ name: 'Eldritch Scroll', count: 1, spiritShards: 50 }, { name: 'Mystic Coin', count: 100, itemId: F.MYSTIC_COIN }, { name: 'Vial of Liquid Flame', count: 1 }, { name: 'Molten Lodestone', count: 250 }] },
  { id: 'eq_mystic_sword', name: 'Mystic Sword', weaponType: 'Sword', rarity: 'Exotic',
    inputs: [{ name: 'Eldritch Scroll', count: 1, spiritShards: 50 }, { name: 'Mystic Coin', count: 30, itemId: F.MYSTIC_COIN }, { name: 'Orichalcum Sword Blade', count: 5 }, { name: 'Orichalcum Sword Hilt', count: 5 }] },
  { id: 'eq_mystic_claymore', name: 'Mystic Claymore', weaponType: 'Greatsword', rarity: 'Exotic',
    inputs: [{ name: 'Eldritch Scroll', count: 1, spiritShards: 50 }, { name: 'Mystic Coin', count: 30, itemId: F.MYSTIC_COIN }, { name: 'Orichalcum Greatsword Blade', count: 5 }, { name: 'Orichalcum Greatsword Hilt', count: 5 }] },
  { id: 'eq_mystic_staff', name: 'Mystic Staff', weaponType: 'Staff', rarity: 'Exotic',
    inputs: [{ name: 'Eldritch Scroll', count: 1, spiritShards: 50 }, { name: 'Mystic Coin', count: 30, itemId: F.MYSTIC_COIN }, { name: 'Ancient Staff Shaft', count: 5 }, { name: 'Ancient Staff Head', count: 5 }] },
  { id: 'eq_immobulus', name: 'Immobulus', weaponType: 'Scepter', rarity: 'Exotic',
    inputs: [{ name: 'Eldritch Scroll', count: 1, spiritShards: 50 }, { name: 'Mystic Coin', count: 30, itemId: F.MYSTIC_COIN }, { name: 'Pile of Crystalline Dust', count: 250, itemId: F.PILE_OF_CRYSTALLINE_DUST }, { name: 'Giant Eye', count: 250 }] },
];

// Trinket recipes
export const EQUIPMENT_RECIPES_TRINKETS = [
  { id: 'eq_emerald_pendant', name: 'Emerald Pendant', type: 'Amulet', rarity: 'Exotic',
    inputs: [{ name: 'Gold Ingot', count: 250, itemId: F.GOLD_INGOT }, { name: 'Mystic Coin', count: 50, itemId: F.MYSTIC_COIN }, { name: 'Pile of Crystalline Dust', count: 250, itemId: F.PILE_OF_CRYSTALLINE_DUST }, { name: 'Emerald Orb', count: 250 }] },
  { id: 'eq_ruby_pendant', name: 'Ruby Pendant', type: 'Amulet', rarity: 'Exotic',
    inputs: [{ name: 'Gold Ingot', count: 250, itemId: F.GOLD_INGOT }, { name: 'Mystic Coin', count: 50, itemId: F.MYSTIC_COIN }, { name: 'Pile of Crystalline Dust', count: 250, itemId: F.PILE_OF_CRYSTALLINE_DUST }, { name: 'Ruby Orb', count: 250 }] },
  { id: 'eq_sapphire_pendant', name: 'Sapphire Pendant', type: 'Amulet', rarity: 'Exotic',
    inputs: [{ name: 'Gold Ingot', count: 250, itemId: F.GOLD_INGOT }, { name: 'Mystic Coin', count: 50, itemId: F.MYSTIC_COIN }, { name: 'Pile of Crystalline Dust', count: 250, itemId: F.PILE_OF_CRYSTALLINE_DUST }, { name: 'Sapphire Orb', count: 250 }] },
  { id: 'eq_triforge_pendant_exotic', name: 'Triforge Pendant (Exotic)', type: 'Amulet', rarity: 'Exotic',
    inputs: [{ name: 'Emerald Pendant', count: 1 }, { name: 'Ruby Pendant', count: 1 }, { name: 'Sapphire Pendant', count: 1 }, { name: 'Crystal', count: 50 }] },
  { id: 'eq_triforge_pendant_ascended', name: 'Triforge Pendant (Ascended)', type: 'Amulet', rarity: 'Ascended',
    inputs: [{ name: 'Triforge Pendant (Exotic)', count: 1 }, { name: 'Glob of Ectoplasm', count: 1, itemId: F.GLOB_OF_ECTOPLASM }, { name: 'Mystic Coin', count: 1, itemId: F.MYSTIC_COIN }, { name: 'Pile of Crystalline Dust', count: 1, itemId: F.PILE_OF_CRYSTALLINE_DUST }] },
];

// ── Profit Calculation ─────────────────────────────────────────────────────────
/**
 * Compute effective cost of a single ingredient accounting for:
 * - Spirit Shard vendor pricing
 * - Bottle of Elonian Wine vendor cap
 * - Mystic Forge self-reference (visited set prevents infinite loops)
 * Returns { cost, source: 'tp'|'vendor'|'spirit_shard'|'forge', forgeRecipeId? }
 */
export function getIngredientEffectiveCost(
  itemId, count, name, priceMap, ownedMap, resolvedIds, spiritShards, forgeRecipeMap, visited = new Set()
) {
  const owned = ownedMap[itemId] || 0;
  const stillNeed = Math.max(0, count - owned);
  if (stillNeed === 0) return { cost: 0, source: 'owned' };

  // Spirit Shard items (Philosopher's Stone, Mystic Crystal)
  // These cannot be bought with gold — only spirit shards (or TP if listed)
  const ssCost = SPIRIT_SHARD_COSTS[itemId];
  if (ssCost) {
    const shardsNeeded = Math.ceil(stillNeed / ssCost.count) * ssCost.shards;
    // Always treat as spirit shard cost — show 0 gold cost since shards have no gold value tracked
    // The UI shows the shard cost separately via shardsNeeded
    return { cost: 0, source: 'spirit_shard', shardsNeeded, canAfford: spiritShards >= shardsNeeded };
  }

  const tpSell = priceMap[itemId]?.sells?.unit_price || 0;
  let directCost = tpSell * stillNeed;
  let directSource = 'tp';

  // Bottle of Elonian Wine vendor cap
  if (name === 'Bottle of Elonian Wine') {
    const vendorTotal = ELONIAN_WINE_VENDOR_PRICE * stillNeed;
    if (!tpSell || vendorTotal <= directCost) {
      directCost = vendorTotal;
      directSource = 'vendor';
    }
  }

  // Check if this item has a Mystic Forge recipe that could be cheaper
  // VISITED SET: prevents infinite loops from self-reference seeds
  if (!visited.has(itemId) && forgeRecipeMap[itemId]) {
    const recipe = forgeRecipeMap[itemId];
    const newVisited = new Set(visited);
    newVisited.add(itemId);
    const runs = Math.ceil(stillNeed / recipe.outputCount);
    let forgeCost = 0;
    let forgeValid = true;
    for (const inp of recipe.inputs) {
      if (!inp.itemId) { forgeValid = false; break; }
      const subCost = getIngredientEffectiveCost(
        inp.itemId, inp.count * runs, inp.name, priceMap, ownedMap, resolvedIds,
        spiritShards, forgeRecipeMap, newVisited
      );
      forgeCost += subCost.cost;
    }
    if (forgeValid && forgeCost < directCost) {
      return { cost: forgeCost, source: 'forge', forgeRecipeId: recipe.id };
    }
  }

  return { cost: directCost, source: directSource };
}

/**
 * Build a map of outputId → forge recipe for quick lookup.
 * Uses resolved IDs (after NAME_LOOKUP resolution).
 */
export function buildForgeRecipeMap(recipes) {
  const map = {};
  for (const r of recipes) {
    if (r.outputId) map[r.outputId] = r;
  }
  return map;
}

/**
 * Compute profit data for all forge recipes.
 * Returns array sorted by craftAdvantage descending.
 */
export function buildForgeItems(recipes, itemMap, priceMap, ownedMap, spiritShards) {
  const forgeRecipeMap = buildForgeRecipeMap(recipes);
  const items = [];

  for (const recipe of recipes) {
    if (!recipe.outputId) continue; // skip unresolved
    const outPrice = priceMap[recipe.outputId];
    if (!outPrice) continue;
    const outSell = outPrice.sells?.unit_price || 0;
    const outSellNet = Math.floor(outSell * recipe.outputCount * 0.85);

    let totalInputCost = 0;
    let hasUnresolved = false;
    const inputDetails = [];

    for (const inp of recipe.inputs) {
      if (!inp.itemId) { hasUnresolved = true; continue; }
      const owned = ownedMap[inp.itemId] || 0;
      const { cost, source, shardsNeeded } = getIngredientEffectiveCost(
        inp.itemId, inp.count, inp.name, priceMap, ownedMap, null,
        spiritShards, forgeRecipeMap, new Set([recipe.outputId])
      );
      totalInputCost += cost;
      const tpSell = priceMap[inp.itemId]?.sells?.unit_price || 0;
      inputDetails.push({
        ...inp,
        owned,
        tpSell,
        effectiveCost: cost,
        effectiveSource: source,
        shardsNeeded,
      });
    }

    const profitNet = outSellNet - totalInputCost;
    const craftAdvantage = profitNet; // simplified — no mat sell value for forge

    items.push({
      ...recipe,
      outSell,
      outSellNet,
      totalInputCost,
      profitNet,
      craftAdvantage,
      inputDetails,
      hasUnresolved,
      itemData: itemMap[recipe.outputId],
    });
  }

  return items.sort((a, b) => b.craftAdvantage - a.craftAdvantage);
}

/**
 * Compute Obsidian Shard acquisition options given wallet state.
 * Returns array of { method, canAfford, count, goldCost, currencyCost }
 * Methods are ordered by priority: volatile → unbound → karma → (laurels | TP)
 */
export function getObsidianAcquisition(needed, wallet, priceMap) {
  const volatileMagic = wallet.volatile_magic || 0;
  const unboundMagic  = wallet.unbound_magic  || 0;
  const karma         = wallet.karma          || 0;
  const laurels       = wallet.laurels        || 0;

  let remaining = needed;
  const steps = [];

  // 1. Volatile Magic: 100 VM + 96c per shard
  const vmCanBuy = Math.floor(volatileMagic / 100);
  const vmUsed = Math.min(vmCanBuy, remaining);
  if (vmUsed > 0) {
    steps.push({ method: 'Volatile Magic', count: vmUsed, currencyUsed: vmUsed * 100, currency: 'Volatile Magic', goldCost: vmUsed * 96 });
    remaining -= vmUsed;
  }

  // 2. Unbound Magic: 100 UM + 96c per shard
  if (remaining > 0) {
    const umCanBuy = Math.floor(unboundMagic / 100);
    const umUsed = Math.min(umCanBuy, remaining);
    if (umUsed > 0) {
      steps.push({ method: 'Unbound Magic', count: umUsed, currencyUsed: umUsed * 100, currency: 'Unbound Magic', goldCost: umUsed * 96 });
      remaining -= umUsed;
    }
  }

  // 3. Karma: 1050 per shard
  if (remaining > 0) {
    const karmaCanBuy = Math.floor(karma / 1050);
    const karmaUsed = Math.min(karmaCanBuy, remaining);
    if (karmaUsed > 0) {
      steps.push({ method: 'Karma', count: karmaUsed, currencyUsed: karmaUsed * 1050, currency: 'Karma', goldCost: 0 });
      remaining -= karmaUsed;
    }
  }

  // 4. If still short — show laurels AND TP as options
  const lastResort = [];
  if (remaining > 0) {
    const tpPrice = priceMap[19925]?.sells?.unit_price || 0;
    if (tpPrice > 0) lastResort.push({ method: 'Trading Post', count: remaining, goldCost: tpPrice * remaining, currency: 'Gold' });
    const laurelCanBuy = Math.floor(laurels / 3) * 3 >= remaining ? remaining : Math.floor(laurels / 3) * 3; // 3 laurels = 3 shards
    if (laurelCanBuy > 0) lastResort.push({ method: 'Laurels', count: laurelCanBuy, currencyUsed: laurelCanBuy, currency: 'Laurels', goldCost: 0, note: 'Last resort' });
  }

  return { steps, lastResort, remaining, totalGold: steps.reduce((s, x) => s + x.goldCost, 0) };
}


// ── Miniature Promotion Recipes ────────────────────────────────────────────────
// Miniature promotion: 4x lower-tier minis → 1x higher-tier mini (random output)
// Source: wiki.guildwars2.com/wiki/Mystic_Forge/Miniatures
// The output is RANDOM from the next tier's pool — no guaranteed specific mini.
// "Output" means 1x random mini from that tier.
//
// Tiers: Common → Uncommon → Rare (3 tiers)
// All miniatures are identified by "Miniature" prefix in itemMap names.
// We use NAME_LOOKUP since thousands of mini IDs exist — user's itemMap will have them.

export const MINIATURE_PROMOTION_RECIPES = [
  {
    id: 'mini_promo_uncommon',
    name: 'Random Uncommon Miniature',
    description: '4× Common miniatures → 1× random Uncommon miniature',
    outputTier: 'Uncommon',
    outputCount: 1,
    outputIsRandom: true,
    inputs: [
      { name: 'Common Miniature ×4', count: 4, tier: 'Common',
        note: 'Any 4 common (white) miniatures', isGeneric: true },
    ],
  },
  {
    id: 'mini_promo_rare',
    name: 'Random Rare Miniature',
    description: '4× Uncommon miniatures → 1× random Rare miniature',
    outputTier: 'Rare',
    outputCount: 1,
    outputIsRandom: true,
    inputs: [
      { name: 'Uncommon Miniature ×4', count: 4, tier: 'Uncommon',
        note: 'Any 4 uncommon (green) miniatures', isGeneric: true },
    ],
  },
];

// Specific named mini chains (e.g. Miniature Rytlock → Miniature Rytlock chain)
// These require specific minis as ingredients, not random commons.
// Add specific minis here as NAME_LOOKUP when wiki data is confirmed.
export const MINIATURE_SPECIFIC_RECIPES = [];

export const ALL_FORGE_RECIPES = MATERIAL_PROMOTION_RECIPES;
