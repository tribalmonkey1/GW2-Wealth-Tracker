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
  GIFT_OF_THE_FORGEMAN:     19666,   // SE tokens (500 Tales of Dungeon Delving) — sub of Eel Statue + Vial of Quicksilver [wiki verified June 2026]

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
  GIFT_OF_ENTERTAINMENT:    19635,   // used by The Moot + Quip [wiki verified June 2026]; Armorsmith 400 crafted via Recipe: Gift of Entertainment (9628 from Miyani)
  GIFT_OF_WEATHER:          19637,   // used by Meteorlogicus — RESOLVED July 2026, previously null
  GIFT_OF_HISTORY:          null,    // used by The Flameseeker Prophecies
  VIAL_OF_QUICKSILVER:      null,    // used by The Juggernaut — recipe uses Gift of the Forgeman [sub-ingredients TBD]
  WOLF_STATUE:              null,    // used by Howler
  GIFT_OF_STEALTH:          null,    // used by The Predator
  UNICORN_STATUE:           null,    // used by The Dreamer
  GIFT_OF_WATER:            null,    // used by Frenzy
  SHARK_STATUE:             null,    // used by Kamohoali'i Kotaki
  EEL_STATUE:               null,    // used by Kraitkin — recipe verified June 2026 (Gift of Forgeman + 250 Orichalcum + 250 Cured Hardened Leather + 250 Armored Scale)

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

  // Previously-null IDs — resolved June 2026
  SPIRITWOOD_PLANK:         46736,   // Ascended, account-bound, TP tradeable
  PILE_OF_BLOODSTONE_DUST:  46731,   // Ascended, account-bound, TP tradeable
  MASTER_MAINTENANCE_OIL:   9461,    // Fine rarity, TP tradeable
  // Sculptor's Tools: 74909 — Exotic, account-bound, purchased from Lord Joshua in Beetletun
  // for 4,500 Karma. NOT on TP — left as collection source below.

  // Bolt/Zap precursor chain IDs [wiki verified June 2026]
  // Tier 1 — Zap Experiment (Bolt I: The Experimental Sword)
  ZAP_EXPERIMENT:              74093,   // Tier 1 precursor weapon — salvage for Spirit
  ESSENCE_OF_ARTISTRY:         75769,   // From Chest of Artistry (73912) — Bolt I achievement reward
  EXPERIMENTAL_SWORD_BLADE:    76117,   // Crafted Weaponsmith 450
  EXPERIMENTAL_SWORD_HILT:     73013,   // Crafted Weaponsmith 450
  BOX_OF_RECIPES_ZAP_1:        71679,   // Box of Recipes: Zap (First Tier) — from Chest of Artistry
  CHEST_OF_ARTISTRY:           73912,   // Chest of Artistry — Bolt I achievement reward
  // Tier 2 — Perfected Sword (Bolt II: The Perfected Sword)
  PERFECTED_SWORD_ZAP:         77118,   // Tier 2 precursor weapon — salvage for Spirit
  EXPERTISE_IN_SWORD_CRAFTING: 73473,   // From Tricks and Tips for Advanced Sword Crafting — Bolt II reward
  TRICKS_AND_TIPS_SWORD:       75891,   // Tricks and Tips for Advanced Sword Crafting — Bolt II achievement reward
  SPIRIT_OF_ZAP_EXPERIMENT:    73841,   // Salvage Zap Experiment (74093)
  // Jar of Luminesce Polish (75316) and Prismatic Lodestone (73517) shared with Bifrost — already defined above
  // Tier 3 — Zap (Bolt III: Zap)
  ESSENCE_OF_ENERGY:           76380,   // From Chest of Energy — Bolt III achievement reward
  SPIRIT_OF_PERFECTED_SWORD:   76269,   // Salvage Perfected Sword (77118) [wiki verified June 2026]
  CHEST_OF_ENERGY:             71585,   // Chest of Energy — Bolt III achievement reward
  ENGRAVERS_TOOLS:             72724,   // Crafted Weaponsmith 500
  ENERGY_SOURCE:               70735,   // Crafted Weaponsmith 500

  // Materials used in Zap chain [wiki verified June 2026]
  BLACK_DIAMOND:               76491,   // Rare gemstone — TP tradeable
  PILE_OF_COARSE_SAND:         71641,   // Fine crafting material — TP tradeable
  CHARGED_QUARTZ_CRYSTAL:      43772,   // Rare crafting material — daily craft, account-bound
  DELDRIMOR_STEEL_INGOT:       46738,   // Ascended material — TP tradeable
  ORICHALCUM_PLATED_DOWEL:     12988,   // Masterwork refined material — TP tradeable
  ELONIAN_LEATHER_SQUARE:      46739,   // Ascended material — TP tradeable
  THERMOCATALYTIC_REAGENT:     46747,   // Fine material — vendor 150c or TP

  // The Legend precursor chain [wiki verified June 2026]
  // Tier 1 (The Bifrost I: achievement 2530)
  ESSENCE_OF_ANCIENT_MYSTICISM: 77190,  // from Chest of Ancient Mysticism (achievement reward)
  EXPERIMENTAL_STAFF_HEAD:   71932,     // crafted, recipe from Box of Recipes First Tier
  EXPERIMENTAL_STAFF_SHAFT:  73748,     // crafted, recipe from Box of Recipes First Tier
  LEGENDARY_INSCRIPTION:     72261,     // crafted, recipe from Box of Recipes First Tier
  BOX_OF_RECIPES_LEGEND_1:   71677,     // Box of Recipes: The Legend (First Tier) — from Chest of Ancient Mysticism
  // Tier 2 (The Bifrost II: achievement 2500)
  SPIRIT_OF_LEGEND_EXPERIMENT: 75535,  // from salvaging The Legend Experiment
  THE_LEGEND_EXPERIMENT:     73431,     // crafted via Tier 1 collection
  EXPERTISE_IN_STAFF_CRAFTING: 77139,  // from Tricks and Tips for Advanced Staff Crafting
  JAR_OF_LUMINESCE_POLISH:   75316,    // crafted, recipe from Box of Recipes Second Tier
  PRISMATIC_LODESTONE:       73517,    // crafted, recipe from Box of Recipes Second Tier
  TRICKS_AND_TIPS:           74094,    // Tricks and Tips for Advanced Staff Crafting — achievement reward
  BOX_OF_RECIPES_LEGEND_2:   75752,    // Box of Recipes: The Legend (Second Tier) — from Tricks and Tips
  // Tier 3 (The Bifrost III: achievement 2187)
  ESSENCE_OF_RAINBOWS:       74378,    // from Chest of Rainbows (achievement reward)
  SPIRIT_OF_PERFECTED_STAFF: 76891,   // from salvaging Perfected Staff
  PERFECTED_STAFF:           76027,    // crafted via Tier 2 collection
  BOX_OF_RECIPES_LEGEND_3:   75752,   // same box, reused — Second Tier box unlocks Tier 3 recipes too
  CARVED_TEAR_DROP:          73809,   // crafted, recipe from Box of Recipes: The Legend (74301)
  CARVED_BEAM:               73875,   // crafted, recipe from Box of Recipes: The Legend (74301)
  BOX_OF_RECIPES_LEGEND_MAIN: 74301,  // Box of Recipes: The Legend — from Chest of Rainbows

  // Chaos Gun precursor chain (Quip) — wiki verified June 2026
  // Achievement IDs: Quip I: 2389 (16 bits), Quip II: 2498 (14 bits), Quip III: 2524 (36 bits)
  // Tier 1 (Quip I: The Experimental Pistol, achievement 2389)
  ESSENCE_OF_AUDACITY:          73332,  // from Chest of Audacity — Quip I reward; also Hobbs 10,003 karma after achievement
  EXPERIMENTAL_PISTOL_BARREL:   70874,  // crafted, recipe 11569, Huntsman 450
  EXPERIMENTAL_PISTOL_FRAME:    75330,  // crafted, recipe 10080, Huntsman 450
  CHAOS_GUN_EXPERIMENT:         75846,  // crafted, recipe 10970, Huntsman 450 — salvage for Spirit
  BOX_OF_RECIPES_CHAOS_GUN_1:   71499,  // Box of Recipes: Chaos Gun (First Tier) — from Chest of Audacity
  // Tier 2 (Quip II: The Perfected Pistol, achievement 2498)
  SPIRIT_OF_CHAOS_GUN_EXPERIMENT: 70763, // salvage Chaos Gun Experiment (75846)
  EXPERTISE_IN_PISTOL_CRAFTING: 70850,  // from Tricks and Tips for Advanced Pistol Crafting — Quip II reward
  PERFECTED_PISTOL:             73023,  // crafted, recipe 11397, Huntsman 450 — salvage for Spirit
  BOX_OF_RECIPES_CHAOS_GUN_2:   72777,  // Box of Recipes: Chaos Gun (Second Tier) — from Tricks and Tips
  // Tier 3 (Quip III: Chaos Gun, achievement 2524)
  SPIRIT_OF_PERFECTED_PISTOL:   73396,  // salvage Perfected Pistol (73023)
  ESSENCE_OF_MISCHIEF:          71163,  // from Chest of Mischief — Quip III reward; also Hobbs 1g14s32c after achievement
  ORNATE_PISTOL_FRAME:          75429,  // crafted, recipe 11424, Huntsman 500
  CONFETTI_BULLETS:             76094,  // crafted, recipe 11447, Huntsman 500
  COLORED_PAPER:                73993,  // crafted (trophy), recipe 10389, Huntsman 400 — via Recipe: Confetti Pouch (70769)
  BLACK_POWDER:                 75272,  // vendor only — Thegren Topjaw, Tela Range, Plains of Ashford, 1,500 Karma
  BOX_OF_RECIPES_CHAOS_GUN_MAIN: 72923, // Box of Recipes: Chaos Gun — from Chest of Mischief

  // Storm precursor chain (Meteorlogicus) — wiki verified July 2026
  // Achievement IDs: Meteorlogicus I: 2441 (15 bits), Meteorlogicus II: 2391 (12 bits), Meteorlogicus III: 2449 (29 bits)
  // Gift of Weather: 19637 (Armorsmith 400) — 1 Gift of Knowledge (19671) + 250 Orichalcum Ingot + 250 Hardened Leather Section + 100 Charged Lodestone
  GIFT_OF_KNOWLEDGE:             19671, // 500 Tales of Dungeon Delving (Crucible of Eternity tokens) from dungeon vendors
  // Tier 1 (Meteorlogicus I: The Experimental Scepter, achievement 2441)
  ESSENCE_OF_METEOROLOGY:        75801, // from Chest of Meteorology — Meteorlogicus I reward
  EXPERIMENTAL_SCEPTER_CORE:     70545, // crafted, recipe 10421, Artificer 450
  EXPERIMENTAL_SCEPTER_ROD:      70977, // crafted, recipe 10697, Artificer 450
  STORM_EXPERIMENT:              74655, // crafted, recipe 10527, Artificer 450 — salvage for Spirit
  BOX_OF_RECIPES_STORM_1:        72843, // Box of Recipes: Storm (First Tier) — from Chest of Meteorology
  // Tier 2 (Meteorlogicus II: The Perfected Scepter, achievement 2391)
  SPIRIT_OF_STORM_EXPERIMENT:    73891, // salvage Storm Experiment (74655)
  EXPERTISE_IN_SCEPTER_CRAFTING: 72995, // from Tricks and Tips for Advanced Scepter Crafting — Meteorlogicus II reward
  PERFECTED_SCEPTER:             71886, // crafted, recipe 10756, Artificer 450 — salvage for Spirit
  BOX_OF_RECIPES_STORM_2:        71170, // Box of Recipes: Storm (Second Tier) — from Tricks and Tips
  // Tier 3 (Meteorlogicus III: Storm, achievement 2449)
  SPIRIT_OF_PERFECTED_SCEPTER:   75336, // salvage Perfected Scepter (71886)
  ESSENCE_OF_CONTROL:            72454, // from Chest of Control — Meteorlogicus III reward
  GLOBE:                         70884, // crafted, recipe 10067, Artificer 500
  SPINNING_MECHANISM:            76229, // crafted, recipe 11448, Artificer 500
  BOX_OF_RECIPES_STORM_MAIN:     75923, // Box of Recipes: Storm — from Chest of Control

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

  // ── Tooth of Frostfang precursor chain — wiki verified June 2026 ─────────
  // Tier 1 (Frostfang I: The Experimental Axe — prereq "Revered Antiquarian", unlock "Frostfang Vol. 1", 15 bits)
  CHEST_OF_DRAGONS:          73865,   // Frostfang I reward; also Hobbs 10,003 karma after achievement
  ESSENCE_OF_DRAGONS:        73671,   // from Chest of Dragons
  BOX_OF_RECIPES_FROSTFANG_1: 76732, // Box of Recipes: Tooth of Frostfang (First Tier)
  TOOTH_OF_FROSTFANG_EXPERIMENT: 76795, // crafted, recipe 10542, Weaponsmith 450
  EXPERIMENTAL_AXE_BLADE:    70868,   // crafted, recipe 11722, Weaponsmith 450
  EXPERIMENTAL_AXE_HAFT:     70952,   // crafted, recipe 11627, Weaponsmith 450
  // Legendary Inscription already defined: LEGENDARY_INSCRIPTION = 72261

  // Tier 2 (Frostfang II: The Perfected Axe — prereq "Magister of Legends", unlock "Tooth of Frostfang Experiment", 12 bits)
  TRICKS_AND_TIPS_AXE:       75415,   // Frostfang II reward; also Hobbs 1g14s32c after achievement
  EXPERTISE_IN_AXE_CRAFTING: 76051,   // from Tricks and Tips for Advanced Axe Crafting
  SPIRIT_OF_TOOTH_FROSTFANG_EXPERIMENT: 75534, // salvage Tooth of Frostfang Experiment
  BOX_OF_RECIPES_FROSTFANG_2: 70679,  // Box of Recipes: Tooth of Frostfang (Second Tier)
  PERFECTED_AXE:             71910,   // crafted, recipe 11273, Weaponsmith 450
  SPIRIT_OF_PERFECTED_AXE:   71915,   // salvage Perfected Axe

  // Tier 3 (Frostfang III: Tooth of Frostfang — prereq "Historian of the Armaments", unlock "Perfected Axe")
  CHEST_OF_FREEZING:         72332,   // Frostfang III reward
  ESSENCE_OF_FREEZING:       75818,   // from Chest of Freezing
  BOX_OF_RECIPES_FROSTFANG_MAIN: 73126, // Box of Recipes: Tooth of Frostfang (teaches Dragon Mold, Freezing Core, Tooth of Frostfang)
  FREEZING_CORE:             76342,   // crafted, recipe 10931, Weaponsmith 500
  DRAGON_MOLD:               75619,   // crafted, recipe 11409, Weaponsmith 500

  // Freezing Core sub-ingredients
  SNOW_DIAMOND:              86627,   // Exotic festive material, TP tradeable (Wintersday vendor 1,000 Snowflakes)

  // Dragon Mold sub-ingredients
  LUMP_OF_BEESWAX:           71949,   // Account Bound, event vendor only (Fiona Hastings, Queensdale, 50c — "Defend the beehives" event, active only during Frostfang III collection)
  BRICK_OF_CLAY:             66902,   // Masterwork, Account Bound, Dry Top karma/Geode vendors

  // ── Venom precursor chain (Kraitkin) — wiki verified June 2026 ────────────
  // Tier 1 (Kraitkin I: The Experimental Trident — prereq "Revered Antiquarian", unlock "Kraitkin Vol. 1")
  CHEST_OF_TENTACLES:        75599,   // Kraitkin I reward; also Hobbs 10,003 karma after achievement
  ESSENCE_OF_TENTACLES:      75043,   // from Chest of Tentacles
  BOX_OF_RECIPES_VENOM_1:    73441,   // Box of Recipes: Venom (First Tier), from Chest of Tentacles
  EXPERIMENTAL_TRIDENT_HEAD: 76017,   // crafted, recipe 10102, Artificer 450
  EXPERIMENTAL_TRIDENT_SHAFT:74061,   // crafted, recipe 10916, Artificer 450
  LEGENDARY_UNDERWATER_INSCRIPTION: 73440, // crafted, recipe 10963, shared component (Weaponsmith/Artificer/Huntsman 450)
  VENOM_EXPERIMENT:          72629,   // crafted, recipe 11724, Artificer 450 — salvage for Spirit of the Venom Experiment

  // Tier 2 (Kraitkin II: The Perfected Trident — prereq "Magister of Legends", unlock "Venom Experiment")
  TRICKS_AND_TIPS_TRIDENT:   71788,   // Kraitkin II reward; also Hobbs 1g14s32c after achievement
  EXPERTISE_IN_TRIDENT_CRAFTING: 70757, // from Tricks and Tips for Advanced Trident Crafting
  SPIRIT_OF_VENOM_EXPERIMENT: 71720,  // salvage Venom Experiment
  BOX_OF_RECIPES_VENOM_2:    74291,   // Box of Recipes: Venom (Second Tier), from Tricks and Tips
  PERFECTED_TRIDENT:         74468,   // crafted, recipe 10586, Artificer 450 — Collection: Kraitkin III: Venom
  SPIRIT_OF_PERFECTED_TRIDENT: 76376, // salvage Perfected Trident

  // Tier 3 (Kraitkin III: Venom — achievement 2296, prereq "Historian of the Armaments", unlock "Perfected Trident")
  CHEST_OF_THE_KRAIT:        74039,   // Kraitkin III reward
  ESSENCE_OF_THE_KRAIT:      75215,   // from Chest of the Krait
  BOX_OF_RECIPES_VENOM_MAIN: 75259,   // Box of Recipes: Venom, from Chest of the Krait — teaches Congealed Water, Snake Statue, Venom
  SNAKE_STATUE:              72543,   // crafted, recipe 11347, Artificer 500
  CONGEALED_WATER:           74433,   // crafted, recipe 11254, Artificer 500

  // Snake Statue sub-ingredients — wiki verified June 2026
  CORAL_TENTACLE:            24509,   // Masterwork Gemstone, TP tradeable
  EMERALD_ORB:               24515,   // Rare Gemstone, TP tradeable
  SHEET_OF_AMBRITE:          66650,   // Rare material, TP tradeable
  // Jug of Water — Basic ingredient, vendor 10 for 80c (= 8c each) [wiki verified June 2026, API 12156]
  // NOTE: VENDOR_PRICES in App.jsx previously had 12156 → "Pouch of Black Pigment" (wrong). Fixed June 2026.
  // Pouch of Black Pigment is actually API 70426.
  JUG_OF_WATER:              12156,   // vendor only, 8c each
  RAGE:                     29179,   // Frenzy       [wiki verified]
  CARCHARIAS:               29171,   // Kamohoali'i Kotaki [wiki verified]
  THE_ANOMALY:              null,    // HOPE precursor — [MISSING]
  ARIA:                     null,    // Kotaki precursor (old name, may be Carcharias)

  // ── Spark precursor chain (Incinerator) — wiki verified June 2026 ─────────
  INCINERATOR:               30687,  // Incinerator (legendary dagger itself)
  // Tier 1 (Incinerator I: The Experimental Dagger — prereq "Revered Antiquarian", unlock "Incinerator Vol. 1")
  CHEST_OF_INDUSTRY:         76613,  // Incinerator I reward; also Hobbs 10,003 karma after achievement
  ESSENCE_OF_INDUSTRY:       74544,  // from Chest of Industry
  BOX_OF_RECIPES_SPARK_1:    76927,  // Box of Recipes: Spark (First Tier), from Chest of Industry
  EXPERIMENTAL_DAGGER_BLADE: 72017,  // crafted, recipe 11403, Weaponsmith 450
  EXPERIMENTAL_DAGGER_HILT:  74031,  // crafted, recipe 11034, Weaponsmith 450
  SPARK_EXPERIMENT:          72827,  // crafted, recipe 10563, Weaponsmith 450 — salvage for Spirit of the Spark Experiment

  // Tier 2 (Incinerator II: The Perfected Dagger — prereq "Magister of Legends", unlock "Spark Experiment")
  TRICKS_AND_TIPS_DAGGER:    71429,  // Incinerator II reward; also Hobbs 1g14s32c after achievement
  EXPERTISE_IN_DAGGER_CRAFTING: 76460, // from Tricks and Tips for Advanced Dagger Crafting
  SPIRIT_OF_SPARK_EXPERIMENT: 71203, // salvage Spark Experiment
  BOX_OF_RECIPES_SPARK_2:    73353,  // Box of Recipes: Spark (Second Tier), from Tricks and Tips
  PERFECTED_DAGGER:          77156,  // crafted, recipe 10503, Weaponsmith 450 — Collection: Incinerator III: Spark
  SPIRIT_OF_PERFECTED_DAGGER: 75064, // salvage Perfected Dagger

  // Tier 3 (Incinerator III: Spark — prereq "Historian of the Armaments", unlock "Perfected Dagger")
  CHEST_OF_CHEMISTRY:        75957,  // Incinerator III reward
  ESSENCE_OF_CHEMISTRY:      75504,  // from Chest of Chemistry
  BOX_OF_RECIPES_SPARK_MAIN: 72368,  // Box of Recipes: Spark, from Chest of Chemistry — teaches Fuel Cannister, Regulator Nozzle, Spark
  FUEL_CANNISTER:            75825,  // crafted, recipe 10734, Weaponsmith 500
  REGULATOR_NOZZLE:          73736,  // crafted, recipe 11499, Weaponsmith 500
  // Watchwork Mechanism — ingredient of Regulator Nozzle [wiki verified June 2026]
  // Refined material (Tier 6), crafted from 250 Watchwork Sprocket (Recipe: Watchwork Mechanism, 12,600 Karma from Pact Supply Network Agent)
  WATCHWORK_MECHANISM:       49782,

  // ── Energizer precursor chain (The Moot) — wiki verified June 2026 ─────────
  THE_MOOT:                  30692,  // The Moot (legendary mace itself)
  BOX_O_FUN:                 20000,  // Box o' Fun — Gem Store consumable (ingredient in Gift of Entertainment)
  // Tier 1 (Moot I: The Experimental Mace — prereq "Revered Antiquarian", unlock "The Moot Vol. 1")
  CHEST_OF_THE_HUNT_MACE:    74731,  // Moot I reward; also Hobbs 10,003 karma after achievement
  ESSENCE_OF_THE_HUNT_MACE:  72846,  // from Chest of the Hunt (mace version)
  BOX_OF_RECIPES_ENERGIZER_1: 71493, // Box of Recipes: The Energizer (First Tier), from Chest of the Hunt
  ENERGIZER_EXPERIMENT:      70610,  // crafted, recipe 11160, Weaponsmith 450 — salvage for Spirit
  EXPERIMENTAL_MACE_HEAD:    72498,  // crafted, recipe 10428, Weaponsmith 450
  EXPERIMENTAL_MACE_HAFT:    75952,  // crafted, recipe 10615, Weaponsmith 450
  // Legendary Inscription already defined: LEGENDARY_INSCRIPTION = 72261

  // Tier 2 (Moot II: The Perfected Mace — prereq "Magister of Legends", unlock "The Energizer Experiment")
  TRICKS_AND_TIPS_MACE:      72028,  // Moot II reward; also Hobbs 1g14s32c after achievement
  EXPERTISE_IN_MACE_CRAFTING: 77018, // from Tricks and Tips for Legendary Mace Crafting
  SPIRIT_OF_ENERGIZER_EXPERIMENT: 71723, // salvage The Energizer Experiment
  BOX_OF_RECIPES_ENERGIZER_2: 75704, // Box of Recipes: The Energizer (Second Tier), from Tricks and Tips
  PERFECTED_MACE:            74020,  // crafted, recipe 11265, Weaponsmith 450 — salvage for Spirit
  SPIRIT_OF_PERFECTED_MACE:  76735,  // salvage Perfected Mace

  // Tier 3 (Moot III: The Energizer — prereq "Historian of the Armaments", unlock "Perfected Mace")
  CHEST_OF_THE_CELEBRATION:  77116,  // Moot III reward
  ESSENCE_OF_THE_CELEBRATION: 73375, // from Chest of the Celebration
  BOX_OF_RECIPES_ENERGIZER_MAIN: 74984, // Box of Recipes: The Energizer, from Chest of Celebration — teaches Party Ball, Party Stick, The Energizer
  PARTY_BALL:                73774,  // crafted, recipe 10029, Weaponsmith 500
  PARTY_STICK:               71486,  // crafted, recipe 11541, Weaponsmith 500

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
  SIGIL_OF_AIR:             91520,   // Bolt, Meteorlogicus
  SIGIL_OF_STRENGTH:        24548,   // Sunrise [wiki verified — screenshot June 2026]
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
    'Purchase from Dungeon Merchant for 500 Tales of Dungeon Delving (Arah dungeon currency) — also available via Arah PvP/WvW reward track'),
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

// Legendary Inscription [wiki verified June 2026 — ID 72261]
// Shared across ALL Gen 1 precursor Tier 1 crafts (Zap, Chaos Gun, Dawn, etc.)
// Recipe from Box of Recipes: [Weapon] (First Tier)
// Crafted by Artificer/Huntsman/Weaponsmith 450
const LEGENDARY_INSCRIPTION_COMPONENT = {
  itemId: ID.LEGENDARY_INSCRIPTION,
  name: 'Legendary Inscription',
  count: 1,
  source: 'forge',
  accountBound: true,
  note: 'Crafted (Artificer/Huntsman/Weaponsmith 450) — recipe from Box of Recipes (First Tier)',
  inputs: [
    tp(ID.GLOB_OF_ECTOPLASM,       'Glob of Ectoplasm',       10),
    tp(ID.PILE_OF_CRYSTALLINE_DUST,'Pile of Crystalline Dust', 5),
    tp(ID.ORICHALCUM_PLATED_DOWEL, 'Orichalcum Plated Dowel',  1),
    tp(ID.ELONIAN_LEATHER_SQUARE,  'Elonian Leather Square',  10),
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

// Gift of Sunrise [wiki verified — screenshot June 2026]
const GIFT_OF_SUNRISE = forge(ID.GIFT_OF_SUNRISE, 'Gift of Sunrise', 1, [
  { ...GIFT_OF_METAL },
  { ...GIFT_OF_LIGHT },
  tp(ID.ICY_RUNESTONE,      'Icy Runestone',              100),
  tp(ID.SIGIL_OF_STRENGTH,  'Superior Sigil of Strength',   1),
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
  // Gift of Entertainment [wiki verified June 2026 — ID 19635]
  // Armorsmith 400 — recipe purchased from Miyani (10 Mystic Coins)
  { itemId: ID.GIFT_OF_ENTERTAINMENT, name: 'Gift of Entertainment', count: 1,
    source: 'forge', accountBound: true,
    note: 'Crafted (Armorsmith 400) — Recipe: Gift of Entertainment from Miyani for 10 Mystic Coins',
    inputs: [
      collection(ID.GIFT_OF_THE_NOBLEMAN, 'Gift of the Nobleman', 1,
        'Purchase from Dungeon Merchant for 500 Tales of Dungeon Delving (Caudecus\'s Manor tokens)'),
      tp(ID.ORICHALCUM_INGOT,  'Orichalcum Ingot',  250),
      tp(ID.BOLT_OF_GOSSAMER,  'Bolt of Gossamer',  250),
      { itemId: ID.BOX_O_FUN, name: "Box o' Fun", count: 5, source: 'tp',
        note: 'Gem Store consumable (80 gems each) — also TP tradeable', inputs: [] },
    ],
  },
  tp(ID.ICY_RUNESTONE,    'Icy Runestone',            100),
  tp(ID.SIGIL_OF_ENERGY,  'Superior Sigil of Energy',  1),
]);

// Gift of Quip [wiki verified — ID 19651]
const GIFT_OF_QUIP = forge(ID.GIFT_OF_QUIP, 'Gift of Quip', 1, [
  { ...GIFT_OF_WOOD },
  // Gift of Entertainment [wiki verified June 2026 — ID 19635, shared with The Moot]
  { itemId: ID.GIFT_OF_ENTERTAINMENT, name: 'Gift of Entertainment', count: 1,
    source: 'forge', accountBound: true,
    note: 'Crafted (Armorsmith 400) — Recipe: Gift of Entertainment from Miyani for 10 Mystic Coins',
    inputs: [
      collection(ID.GIFT_OF_THE_NOBLEMAN, 'Gift of the Nobleman', 1,
        'Purchase from Dungeon Merchant for 500 Tales of Dungeon Delving (Caudecus\'s Manor tokens)'),
      tp(ID.ORICHALCUM_INGOT,  'Orichalcum Ingot',  250),
      tp(ID.BOLT_OF_GOSSAMER,  'Bolt of Gossamer',  250),
      { itemId: ID.BOX_O_FUN, name: "Box o' Fun", count: 5, source: 'tp',
        note: 'Gem Store consumable (80 gems each) — also TP tradeable', inputs: [] },
    ],
  },
  tp(ID.ICY_RUNESTONE,    'Icy Runestone',              100),
  tp(ID.SIGIL_OF_STAMINA, 'Superior Sigil of Stamina',   1),
]);

// Gift of Meteorlogicus [wiki verified — ID 19652]
const GIFT_OF_METEORLOGICUS = forge(ID.GIFT_OF_METEORLOGICUS, 'Gift of Meteorlogicus', 1, [
  { ...GIFT_OF_ENERGY },
  {
    itemId: ID.GIFT_OF_WEATHER, name: 'Gift of Weather', count: 1,
    source: 'forge', accountBound: true,
    note: 'Crafted (Armorsmith 400) — recipe purchased from Miyani or any Mystic Forge Attendant/Keeper',
    inputs: [
      { itemId: ID.GIFT_OF_KNOWLEDGE, name: 'Gift of Knowledge', count: 1, source: 'currency',
        note: 'Purchased from dungeon vendors for 500 Tales of Dungeon Delving (Crucible of Eternity tokens)', inputs: [] },
      tp(ID.ORICHALCUM_INGOT, 'Orichalcum Ingot', 250),
      { itemId: null, name: 'Hardened Leather Section', count: 250, source: 'tp', inputs: [] },
      tp(ID.CHARGED_LODESTONE, 'Charged Lodestone', 100),
    ],
  },
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
  // Eel Statue — crafted via Legendary Component recipe (Tailor 400)
  // Recipe verified June 2026: Gift of the Forgeman + 250 Orichalcum Ingots + 250 Cured Hardened Leather Squares + 250 Armored Scales
  { itemId: ID.EEL_STATUE, name: 'Eel Statue', count: 1,
    source: 'forge', accountBound: true,
    note: 'Crafted (Tailor 400) — recipe from Recipe: Eel Statue',
    inputs: [
      collection(ID.GIFT_OF_THE_FORGEMAN, 'Gift of the Forgeman', 1,
        'Purchase from dungeon vendor for 500 Tales of Dungeon Delving (Sorrow\'s Embrace tokens)'),
      tp(ID.ORICHALCUM_INGOT,           'Orichalcum Ingot',                  250),
      tp(ID.CURED_HARDENED_LEATHER,     'Cured Hardened Leather Square',     250),
      tp(ID.ARMORED_SCALE,              'Armored Scale',                     250),
    ],
  },
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
  // Mystic Forge: Twilight + Sunrise + Philosopher's Stone ×10 + Crystalline Dust ×5
  // Twilight and Sunrise are full legendaries in their own right — their ingredient
  // trees are embedded here so Eternity shows total cost to craft from scratch.
  // [wiki verified June 2026 — full material list screenshot confirmed]
  {
    id: 'legendary_eternity',
    name: 'Eternity',
    itemId: ID.ETERNITY,
    rarity: 'Legendary', weaponType: 'Greatsword', generation: 1,
    note: 'Mystic Forge: Twilight + Sunrise + 10 Philosopher\'s Stones + 5 Crystalline Dust. Requires crafting both legendaries first.',
    inputs: [
      // ── Twilight ────────────────────────────────────────────────────────────
      {
        itemId: null,
        name: 'Twilight',
        count: 1,
        source: 'tp',
        isPrecursor: false,
        note: 'Legendary — craft from Dusk + Gift of Twilight + Gift of Fortune + Gift of Mastery, or buy from TP',
        inputs: [
          precursor(ID.DUSK, 'Dusk'),
          { ...GIFT_OF_TWILIGHT },
          { ...GIFT_OF_FORTUNE },
          { ...GIFT_OF_MASTERY },
        ],
      },
      // ── Sunrise ─────────────────────────────────────────────────────────────
      {
        itemId: null,
        name: 'Sunrise',
        count: 1,
        source: 'tp',
        isPrecursor: false,
        note: 'Legendary — craft from Dawn + Gift of Sunrise + Gift of Fortune + Gift of Mastery, or buy from TP',
        inputs: [
          precursor(ID.DAWN, 'Dawn'),
          { ...GIFT_OF_SUNRISE },
          { ...GIFT_OF_FORTUNE },
          { ...GIFT_OF_MASTERY },
        ],
      },
      // ── Forge catalysts ─────────────────────────────────────────────────────
      tp(ID.PILE_OF_CRYSTALLINE_DUST, 'Pile of Crystalline Dust', 5),
      { itemId: 20796, name: "Philosopher's Stone", count: 10, source: 'spirit_shard',
        note: '10 for 1 Spirit Shard from Miyani', inputs: [] },
    ],
  },

  // ── Bolt (Sword) ──────────────────────────────────────────────────────────
  {
    id: 'legendary_bolt',
    name: 'Bolt',
    itemId: 30699,
    rarity: 'Legendary', weaponType: 'Sword', generation: 1,
    inputs: [
      // ── Zap precursor — 3-tier Legendary Crafting collection ──────────────
      // Achievement chain: Bolt I (Experimental Sword) → Bolt II (Perfected Sword) → Bolt III (Zap)
      {
        itemId: ID.ZAP,
        name: 'Zap',
        count: 1,
        source: 'collection',
        accountBound: true,
        achievementId: null,  // Bolt III: Zap — achievement ID TBD
        note: 'Crafted once per account via Bolt III: Zap collection (Weaponsmith 500). Recipe from Box of Recipes: Zap.',
        inputs: [
          // ── Tier 3 ingredients (Bolt III: Zap) ──────────────────────────
          // Essence of Energy — from Chest of Energy, Bolt III achievement reward
          {
            itemId: ID.ESSENCE_OF_ENERGY,
            name: 'Essence of Energy',
            count: 1,
            source: 'collection',
            accountBound: true,
            note: 'From Chest of Energy — reward for completing Bolt III: Zap achievement. Also sold by Grandmaster Craftsman Hobbs after completion.',
            inputs: [],
          },
          // Spirit of the Perfected Sword — salvage Perfected Sword
          {
            itemId: ID.SPIRIT_OF_PERFECTED_SWORD,
            name: 'Spirit of the Perfected Sword',
            count: 1,
            source: 'collection',
            accountBound: true,
            note: 'Salvage Perfected Sword (ID 77118) with any salvage kit',
            inputs: [
              // ── Perfected Sword — Tier 2 (Bolt II: The Perfected Sword) ──
              {
                itemId: ID.PERFECTED_SWORD_ZAP,
                name: 'Perfected Sword',
                count: 1,
                source: 'collection',
                accountBound: true,
                note: 'Crafted via Bolt II: The Perfected Sword collection (Weaponsmith 450). Recipe from Box of Recipes: Zap (Second Tier).',
                inputs: [
                  // Expertise in Sword Crafting — from Tricks and Tips book (Bolt II reward)
                  {
                    itemId: ID.EXPERTISE_IN_SWORD_CRAFTING,
                    name: 'Expertise in Sword Crafting',
                    count: 1,
                    source: 'collection',
                    accountBound: true,
                    note: 'From Tricks and Tips for Advanced Sword Crafting (consumable) — reward for completing Bolt II: The Perfected Sword achievement',
                    inputs: [],
                  },
                  // Spirit of the Zap Experiment — salvage Zap Experiment
                  {
                    itemId: ID.SPIRIT_OF_ZAP_EXPERIMENT,
                    name: 'Spirit of the Zap Experiment',
                    count: 1,
                    source: 'collection',
                    accountBound: true,
                    note: 'Salvage Zap Experiment (ID 74093) with any salvage kit',
                    inputs: [
                      // ── Zap Experiment — Tier 1 (Bolt I: The Experimental Sword) ──
                      {
                        itemId: ID.ZAP_EXPERIMENT,
                        name: 'Zap Experiment',
                        count: 1,
                        source: 'collection',
                        accountBound: true,
                        note: 'Crafted via Bolt I: The Experimental Sword collection (Weaponsmith 450). Recipe from Box of Recipes: Zap (First Tier).',
                        inputs: [
                          // Essence of Artistry — from Chest of Artistry (Bolt I reward)
                          {
                            itemId: ID.ESSENCE_OF_ARTISTRY,
                            name: 'Essence of Artistry',
                            count: 1,
                            source: 'collection',
                            accountBound: true,
                            note: 'From Chest of Artistry — reward for completing Bolt I: The Experimental Sword achievement',
                            inputs: [],
                          },
                          // Experimental Sword Blade — crafted Weaponsmith 450
                          {
                            itemId: ID.EXPERIMENTAL_SWORD_BLADE,
                            name: 'Experimental Sword Blade',
                            count: 1,
                            source: 'forge',
                            accountBound: true,
                            note: 'Crafted (Weaponsmith 450) — recipe from Box of Recipes: Zap (First Tier)',
                            inputs: [
                              tp(ID.DELDRIMOR_STEEL_INGOT, 'Deldrimor Steel Ingot', 15),
                              { itemId: null, name: 'Memory of Battle', count: 50, source: 'wvw', accountBound: false, note: 'WvW participation currency', inputs: [] },
                              { itemId: null, name: 'Shard of Glory',   count: 50, source: 'currency', note: 'PvP participation currency', inputs: [] },
                            ],
                          },
                          // Experimental Sword Hilt — crafted Weaponsmith 450
                          {
                            itemId: ID.EXPERIMENTAL_SWORD_HILT,
                            name: 'Experimental Sword Hilt',
                            count: 1,
                            source: 'forge',
                            accountBound: true,
                            note: 'Crafted (Weaponsmith 450) — recipe from Box of Recipes: Zap (First Tier)',
                            inputs: [
                              tp(ID.DELDRIMOR_STEEL_INGOT, 'Deldrimor Steel Ingot', 15),
                              { itemId: null, name: 'Memory of Battle', count: 50, source: 'wvw', accountBound: false, note: 'WvW participation currency', inputs: [] },
                              { itemId: null, name: 'Shard of Glory',   count: 50, source: 'currency', note: 'PvP participation currency', inputs: [] },
                            ],
                          },
                          // Legendary Inscription — shared component
                          { ...LEGENDARY_INSCRIPTION_COMPONENT },
                        ],
                      },
                    ],
                  },
                  // Jar of Luminesce Polish — shared with Bifrost Tier 2
                  {
                    itemId: ID.JAR_OF_LUMINESCE_POLISH,
                    name: 'Jar of Luminesce Polish',
                    count: 1,
                    source: 'forge',
                    accountBound: true,
                    note: 'Crafted (Weaponsmith 400) — recipe from Box of Recipes: Zap (Second Tier)',
                    inputs: [
                      tp(ID.PILE_OF_BLOODSTONE_DUST,    'Pile of Bloodstone Dust',    250),
                      { itemId: null, name: 'Amalgamated Gemstone',    count: 1,  source: 'tp', inputs: [] },
                      tp(ID.THERMOCATALYTIC_REAGENT,    'Thermocatalytic Reagent',     10),
                      tp(ID.MASTER_MAINTENANCE_OIL,     'Master Maintenance Oil',      10),
                    ],
                  },
                  // Prismatic Lodestone — shared with Bifrost Tier 2
                  {
                    itemId: ID.PRISMATIC_LODESTONE,
                    name: 'Prismatic Lodestone',
                    count: 1,
                    source: 'forge',
                    accountBound: true,
                    note: 'Crafted (Weaponsmith 400) — recipe from Box of Recipes: Zap (Second Tier). Combines 4 elemental lodestones.',
                    inputs: [
                      tp(ID.GLACIAL_LODESTONE,  'Glacial Lodestone',  1),
                      tp(ID.MOLTEN_LODESTONE,   'Molten Lodestone',   1),
                      tp(ID.ONYX_LODESTONE,     'Onyx Lodestone',     1),
                      tp(ID.CHARGED_LODESTONE,  'Charged Lodestone',  1),
                    ],
                  },
                ],
              },
            ],
          },
          // Engraver's Tools — crafted Weaponsmith 500
          {
            itemId: ID.ENGRAVERS_TOOLS,
            name: "Engraver's Tools",
            count: 1,
            source: 'forge',
            accountBound: true,
            note: 'Crafted (Weaponsmith 500) — recipe from Box of Recipes: Zap',
            inputs: [
              tp(ID.MITHRIL_INGOT,            'Mithril Ingot',            100),
              tp(ID.BLACK_DIAMOND,            'Black Diamond',              5),
              tp(ID.PILE_OF_COARSE_SAND,      'Pile of Coarse Sand',       10),
              tp(ID.THERMOCATALYTIC_REAGENT,  'Thermocatalytic Reagent',   10),
            ],
          },
          // Energy Source — crafted Weaponsmith 500
          {
            itemId: ID.ENERGY_SOURCE,
            name: 'Energy Source',
            count: 1,
            source: 'forge',
            accountBound: true,
            note: 'Crafted (Weaponsmith 500) — recipe from Box of Recipes: Zap',
            inputs: [
              { itemId: ID.CHARGED_QUARTZ_CRYSTAL, name: 'Charged Quartz Crystal', count: 10,
                source: 'collection', accountBound: true,
                note: 'Daily craft — 1/day from 25 Quartz Crystal at a Resonating Terrace', inputs: [] },
              tp(ID.CHARGED_LODESTONE,         'Charged Lodestone',          1),
              tp(ID.THERMOCATALYTIC_REAGENT,   'Thermocatalytic Reagent',   10),
              tp(ID.PILE_OF_RADIANT_DUST,      'Pile of Radiant Dust',     100),
            ],
          },
        ],
      },
      { ...GIFT_OF_BOLT },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── Frostfang (Axe) ───────────────────────────────────────────────────────
  {
    id: 'legendary_frostfang',
    name: 'Frostfang',
    itemId: 30684,
    rarity: 'Legendary', weaponType: 'Axe', generation: 1,
    inputs: [
      // ── Tooth of Frostfang precursor — 3-tier collection chain ────────────
      {
        itemId: ID.TOOTH_OF_FROSTFANG,
        name: 'Tooth of Frostfang',
        count: 1,
        source: 'collection',
        accountBound: true,
        achievementId: 2393,  // Frostfang III: Tooth of Frostfang [wiki verified June 2026]
        achievementBitCount: 34,
        note: 'Crafted once per account via Frostfang III: Tooth of Frostfang collection (Weaponsmith 500). Recipe from Box of Recipes: Tooth of Frostfang.',
        inputs: [
          // ── Tier 3 (Frostfang III: Tooth of Frostfang) ───────────────────
          {
            itemId: ID.ESSENCE_OF_FREEZING,
            name: 'Essence of Freezing',
            count: 1,
            source: 'collection',
            accountBound: true,
            note: 'From Chest of Freezing — reward for completing Frostfang III: Tooth of Frostfang achievement',
            inputs: [],
          },
          // Spirit of the Perfected Axe — salvage Perfected Axe
          {
            itemId: ID.SPIRIT_OF_PERFECTED_AXE,
            name: 'Spirit of the Perfected Axe',
            count: 1,
            source: 'collection',
            accountBound: true,
            note: 'Salvage Perfected Axe (ID 71910) with any salvage kit',
            inputs: [
              // ── Perfected Axe — Tier 2 (Frostfang II: The Perfected Axe) ─
              {
                itemId: ID.PERFECTED_AXE,
                name: 'Perfected Axe',
                count: 1,
                source: 'collection',
                accountBound: true,
                achievementId: 2606,  // Frostfang II: The Perfected Axe [wiki verified June 2026]
                achievementBitCount: 12,
                note: 'Crafted via Frostfang II: The Perfected Axe collection (Weaponsmith 450). Recipe from Box of Recipes: Tooth of Frostfang (Second Tier).',
                inputs: [
                  {
                    itemId: ID.EXPERTISE_IN_AXE_CRAFTING,
                    name: 'Expertise in Axe Crafting',
                    count: 1,
                    source: 'collection',
                    accountBound: true,
                    note: 'From Tricks and Tips for Advanced Axe Crafting — reward for completing Frostfang II: The Perfected Axe achievement',
                    inputs: [],
                  },
                  {
                    itemId: ID.SPIRIT_OF_TOOTH_FROSTFANG_EXPERIMENT,
                    name: 'Spirit of the Tooth of Frostfang Experiment',
                    count: 1,
                    source: 'collection',
                    accountBound: true,
                    note: 'Salvage Tooth of Frostfang Experiment (ID 76795) with any salvage kit',
                    inputs: [
                      // ── Tooth of Frostfang Experiment — Tier 1 ───────────
                      {
                        itemId: ID.TOOTH_OF_FROSTFANG_EXPERIMENT,
                        name: 'Tooth of Frostfang Experiment',
                        count: 1,
                        source: 'collection',
                        accountBound: true,
                        achievementId: 2478,  // Frostfang I: The Experimental Axe [wiki verified June 2026]
                        achievementBitCount: 15,
                        note: 'Crafted via Frostfang I: The Experimental Axe collection (Weaponsmith 450). Recipe from Box of Recipes: Tooth of Frostfang (First Tier).',
                        inputs: [
                          {
                            itemId: ID.ESSENCE_OF_DRAGONS,
                            name: 'Essence of Dragons',
                            count: 1,
                            source: 'collection',
                            accountBound: true,
                            note: 'From Chest of Dragons — reward for completing Frostfang I: The Experimental Axe achievement',
                            inputs: [],
                          },
                          {
                            itemId: ID.EXPERIMENTAL_AXE_BLADE,
                            name: 'Experimental Axe Blade',
                            count: 1,
                            source: 'forge',
                            accountBound: true,
                            note: 'Crafted (Weaponsmith 450) — recipe from Box of Recipes: Tooth of Frostfang (First Tier)',
                            inputs: [
                              tp(ID.DELDRIMOR_STEEL_INGOT, 'Deldrimor Steel Ingot', 15),
                              { itemId: null, name: 'Memory of Battle', count: 50, source: 'wvw', accountBound: false, note: 'WvW participation currency', inputs: [] },
                              { itemId: null, name: 'Shard of Glory',   count: 50, source: 'currency', note: 'PvP participation currency', inputs: [] },
                            ],
                          },
                          {
                            itemId: ID.EXPERIMENTAL_AXE_HAFT,
                            name: 'Experimental Axe Haft',
                            count: 1,
                            source: 'forge',
                            accountBound: true,
                            note: 'Crafted (Weaponsmith 450) — recipe from Box of Recipes: Tooth of Frostfang (First Tier)',
                            inputs: [
                              tp(ID.SPIRITWOOD_PLANK, 'Spiritwood Plank', 10),
                              { itemId: null, name: 'Memory of Battle', count: 50, source: 'wvw', accountBound: false, note: 'WvW participation currency', inputs: [] },
                              { itemId: null, name: 'Shard of Glory',   count: 50, source: 'currency', note: 'PvP participation currency', inputs: [] },
                            ],
                          },
                          { ...LEGENDARY_INSCRIPTION_COMPONENT },
                        ],
                      },
                    ],
                  },
                  // Jar of Luminesce Polish — shared Tier 2 component
                  {
                    itemId: ID.JAR_OF_LUMINESCE_POLISH,
                    name: 'Jar of Luminesce Polish',
                    count: 1,
                    source: 'forge',
                    accountBound: true,
                    note: 'Crafted (Artificer/Huntsman/Weaponsmith 400) — recipe from Box of Recipes: Tooth of Frostfang (Second Tier)',
                    inputs: [
                      tp(ID.PILE_OF_BLOODSTONE_DUST,  'Pile of Bloodstone Dust',  250),
                      { itemId: null, name: 'Amalgamated Gemstone', count: 1, source: 'tp', inputs: [] },
                      tp(ID.THERMOCATALYTIC_REAGENT,  'Thermocatalytic Reagent',   10),
                      tp(ID.MASTER_MAINTENANCE_OIL,   'Master Maintenance Oil',    10),
                    ],
                  },
                  // Prismatic Lodestone — shared Tier 2 component
                  {
                    itemId: ID.PRISMATIC_LODESTONE,
                    name: 'Prismatic Lodestone',
                    count: 1,
                    source: 'forge',
                    accountBound: true,
                    note: 'Crafted (Artificer/Huntsman/Weaponsmith 400) — recipe from Box of Recipes: Tooth of Frostfang (Second Tier). Combines 4 elemental lodestones.',
                    inputs: [
                      tp(ID.GLACIAL_LODESTONE,  'Glacial Lodestone',  1),
                      tp(ID.MOLTEN_LODESTONE,   'Molten Lodestone',   1),
                      tp(ID.ONYX_LODESTONE,     'Onyx Lodestone',     1),
                      tp(ID.CHARGED_LODESTONE,  'Charged Lodestone',  1),
                    ],
                  },
                ],
              },
            ],
          },
          // Freezing Core — crafted Weaponsmith 500
          {
            itemId: ID.FREEZING_CORE,
            name: 'Freezing Core',
            count: 1,
            source: 'forge',
            accountBound: true,
            note: 'Crafted (Weaponsmith 500) — recipe from Box of Recipes: Tooth of Frostfang',
            inputs: [
              tp(ID.GLACIAL_LODESTONE,        'Glacial Lodestone',        10),
              tp(ID.ICY_RUNESTONE,             'Icy Runestone',            10),
              tp(ID.SNOW_DIAMOND,              'Snow Diamond',              1),
              tp(ID.PILE_OF_CRYSTALLINE_DUST,  'Pile of Crystalline Dust', 10),
            ],
          },
          // Dragon Mold — crafted Weaponsmith 500
          {
            itemId: ID.DRAGON_MOLD,
            name: 'Dragon Mold',
            count: 1,
            source: 'forge',
            accountBound: true,
            note: 'Crafted (Weaponsmith 500) — recipe from Box of Recipes: Tooth of Frostfang',
            inputs: [
              { itemId: ID.LUMP_OF_BEESWAX, name: 'Lump of Beeswax', count: 10, source: 'collection', accountBound: true, note: 'Event vendor — Fiona Hastings, Clayent Falls, Queensdale, 50c each. Requires "Defend the beehives from hungry bears" event. Only available while Frostfang III: Tooth of Frostfang collection is active.', inputs: [] },
              tp(ID.ELDER_WOOD_PLANK,         'Elder Wood Plank',         50),
              { itemId: ID.BRICK_OF_CLAY, name: 'Brick of Clay', count: 25, source: 'karma', note: 'Account Bound — Dry Top karma/Geode vendors', inputs: [] },
              tp(ID.THERMOCATALYTIC_REAGENT,   'Thermocatalytic Reagent',  10),
            ],
          },
        ],
      },
      { ...GIFT_OF_FROSTFANG },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── Incinerator (Dagger) ──────────────────────────────────────────────────
  {
    id: 'legendary_incinerator',
    name: 'Incinerator',
    itemId: ID.INCINERATOR,
    rarity: 'Legendary', weaponType: 'Dagger', generation: 1,
    inputs: [
      // ── Spark precursor — 3-tier Legendary Crafting collection ────────────
      // Achievement chain: Incinerator I (Experimental Dagger) → II (Perfected Dagger) → III (Spark)
      {
        itemId: ID.SPARK,
        name: 'Spark',
        count: 1,
        source: 'collection',
        accountBound: true,
        achievementId: 2502,  // Incinerator III: Spark [wiki verified June 2026]
        achievementBitCount: 24,
        note: 'Crafted once per account via Incinerator III: Spark collection (Weaponsmith 500). Recipe from Box of Recipes: Spark.',
        inputs: [
          // ── Tier 3 ingredients (Incinerator III: Spark) ──────────────────
          // Essence of Chemistry — from Chest of Chemistry, Incinerator III achievement reward
          {
            itemId: ID.ESSENCE_OF_CHEMISTRY,
            name: 'Essence of Chemistry',
            count: 1,
            source: 'collection',
            accountBound: true,
            note: 'From Chest of Chemistry — reward for completing Incinerator III: Spark achievement',
            inputs: [],
          },
          // Spirit of the Perfected Dagger — salvage Perfected Dagger
          {
            itemId: ID.SPIRIT_OF_PERFECTED_DAGGER,
            name: 'Spirit of the Perfected Dagger',
            count: 1,
            source: 'collection',
            accountBound: true,
            note: 'Salvage Perfected Dagger (ID 77156) with any salvage kit',
            inputs: [
              // ── Perfected Dagger — Tier 2 (Incinerator II: The Perfected Dagger) ──
              {
                itemId: ID.PERFECTED_DAGGER,
                name: 'Perfected Dagger',
                count: 1,
                source: 'collection',
                accountBound: true,
                achievementId: 2458,  // Incinerator II: The Perfected Dagger [wiki verified June 2026]
                achievementBitCount: 15,
                note: 'Crafted via Incinerator II: The Perfected Dagger collection (Weaponsmith 450). Recipe from Box of Recipes: Spark (Second Tier).',
                inputs: [
                  // Expertise in Dagger Crafting — from Tricks and Tips book (Incinerator II reward)
                  {
                    itemId: ID.EXPERTISE_IN_DAGGER_CRAFTING,
                    name: 'Expertise in Dagger Crafting',
                    count: 1,
                    source: 'collection',
                    accountBound: true,
                    note: 'From Tricks and Tips for Advanced Dagger Crafting (consumable) — reward for completing Incinerator II: The Perfected Dagger achievement',
                    inputs: [],
                  },
                  // Spirit of the Spark Experiment — salvage Spark Experiment
                  {
                    itemId: ID.SPIRIT_OF_SPARK_EXPERIMENT,
                    name: 'Spirit of the Spark Experiment',
                    count: 1,
                    source: 'collection',
                    accountBound: true,
                    note: 'Salvage Spark Experiment (ID 72827) with any salvage kit',
                    inputs: [
                      // ── Spark Experiment — Tier 1 (Incinerator I: The Experimental Dagger) ──
                      {
                        itemId: ID.SPARK_EXPERIMENT,
                        name: 'Spark Experiment',
                        count: 1,
                        source: 'collection',
                        accountBound: true,
                        achievementId: 2564,  // Incinerator I: The Experimental Dagger [wiki verified June 2026]
                        achievementBitCount: 18,
                        note: 'Crafted via Incinerator I: The Experimental Dagger collection (Weaponsmith 450). Recipe from Box of Recipes: Spark (First Tier).',
                        inputs: [
                          // Essence of Industry — from Chest of Industry (Incinerator I reward)
                          {
                            itemId: ID.ESSENCE_OF_INDUSTRY,
                            name: 'Essence of Industry',
                            count: 1,
                            source: 'collection',
                            accountBound: true,
                            note: 'From Chest of Industry — reward for completing Incinerator I: The Experimental Dagger achievement',
                            inputs: [],
                          },
                          // Experimental Dagger Blade — crafted Weaponsmith 450
                          {
                            itemId: ID.EXPERIMENTAL_DAGGER_BLADE,
                            name: 'Experimental Dagger Blade',
                            count: 1,
                            source: 'forge',
                            accountBound: true,
                            note: 'Crafted (Weaponsmith 450) — recipe from Box of Recipes: Spark (First Tier)',
                            inputs: [
                              tp(ID.DELDRIMOR_STEEL_INGOT, 'Deldrimor Steel Ingot', 15),
                              { itemId: null, name: 'Memory of Battle', count: 50, source: 'wvw', accountBound: false, note: 'WvW participation currency', inputs: [] },
                              { itemId: null, name: 'Shard of Glory',   count: 50, source: 'currency', note: 'PvP participation currency', inputs: [] },
                            ],
                          },
                          // Experimental Dagger Hilt — crafted Weaponsmith 450
                          {
                            itemId: ID.EXPERIMENTAL_DAGGER_HILT,
                            name: 'Experimental Dagger Hilt',
                            count: 1,
                            source: 'forge',
                            accountBound: true,
                            note: 'Crafted (Weaponsmith 450) — recipe from Box of Recipes: Spark (First Tier)',
                            inputs: [
                              tp(ID.DELDRIMOR_STEEL_INGOT, 'Deldrimor Steel Ingot', 10),
                              { itemId: null, name: 'Memory of Battle', count: 50, source: 'wvw', accountBound: false, note: 'WvW participation currency', inputs: [] },
                              { itemId: null, name: 'Shard of Glory',   count: 50, source: 'currency', note: 'PvP participation currency', inputs: [] },
                            ],
                          },
                          // Legendary Inscription — shared component
                          { ...LEGENDARY_INSCRIPTION_COMPONENT },
                        ],
                      },
                    ],
                  },
                  // Jar of Luminesce Polish — shared Tier 2 component
                  {
                    itemId: ID.JAR_OF_LUMINESCE_POLISH,
                    name: 'Jar of Luminesce Polish',
                    count: 1,
                    source: 'forge',
                    accountBound: true,
                    note: 'Crafted (Artificer/Huntsman/Weaponsmith 400) — recipe from Box of Recipes: Spark (Second Tier)',
                    inputs: [
                      tp(ID.PILE_OF_BLOODSTONE_DUST,  'Pile of Bloodstone Dust',  250),
                      { itemId: null, name: 'Amalgamated Gemstone', count: 1, source: 'tp', inputs: [] },
                      tp(ID.THERMOCATALYTIC_REAGENT,  'Thermocatalytic Reagent',   10),
                      tp(ID.MASTER_MAINTENANCE_OIL,   'Master Maintenance Oil',    10),
                    ],
                  },
                  // Prismatic Lodestone — shared Tier 2 component
                  {
                    itemId: ID.PRISMATIC_LODESTONE,
                    name: 'Prismatic Lodestone',
                    count: 1,
                    source: 'forge',
                    accountBound: true,
                    note: 'Crafted (Artificer/Huntsman/Weaponsmith 400) — recipe from Box of Recipes: Spark (Second Tier). Combines 4 elemental lodestones.',
                    inputs: [
                      tp(ID.GLACIAL_LODESTONE,  'Glacial Lodestone',  1),
                      tp(ID.MOLTEN_LODESTONE,   'Molten Lodestone',   1),
                      tp(ID.ONYX_LODESTONE,     'Onyx Lodestone',     1),
                      tp(ID.CHARGED_LODESTONE,  'Charged Lodestone',  1),
                    ],
                  },
                ],
              },
            ],
          },
          // Fuel Cannister — crafted Weaponsmith 500
          {
            itemId: ID.FUEL_CANNISTER,
            name: 'Fuel Cannister',
            count: 1,
            source: 'forge',
            accountBound: true,
            note: 'Crafted (Weaponsmith 500) — recipe from Box of Recipes: Spark',
            inputs: [
              tp(ID.ORICHALCUM_INGOT,         'Orichalcum Ingot',          50),
              tp(ID.PILE_OF_CRYSTALLINE_DUST, 'Pile of Crystalline Dust',   5),
              tp(ID.DELDRIMOR_STEEL_INGOT,    'Deldrimor Steel Ingot',      1),
              tp(ID.SHEET_OF_AMBRITE,         'Sheet of Ambrite',          10),
            ],
          },
          // Regulator Nozzle — crafted Weaponsmith 500
          {
            itemId: ID.REGULATOR_NOZZLE,
            name: 'Regulator Nozzle',
            count: 1,
            source: 'forge',
            accountBound: true,
            note: 'Crafted (Weaponsmith 500) — recipe from Box of Recipes: Spark. Watchwork Mechanism ID unconfirmed — no wiki screenshot provided yet.',
            inputs: [
              tp(ID.ORICHALCUM_INGOT,        'Orichalcum Ingot',         50),
              { itemId: ID.WATCHWORK_MECHANISM, name: 'Watchwork Mechanism', count: 1, source: 'tp', inputs: [] },
              tp(ID.THERMOCATALYTIC_REAGENT, 'Thermocatalytic Reagent',  10),
              tp(ID.GLOB_OF_ECTOPLASM,       'Glob of Ectoplasm',         5),
            ],
          },
        ],
      },
      { ...GIFT_OF_INCINERATOR },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── The Moot (Mace) ───────────────────────────────────────────────────────
  {
    id: 'legendary_moot',
    name: 'The Moot',
    itemId: ID.THE_MOOT,
    rarity: 'Legendary', weaponType: 'Mace', generation: 1,
    inputs: [
      // ── The Energizer precursor — 3-tier Legendary Crafting collection ────
      // Achievement chain: Moot I (Experimental Mace) → Moot II (Perfected Mace) → Moot III (The Energizer)
      {
        itemId: ID.THE_ENERGIZER,
        name: 'The Energizer',
        count: 1,
        source: 'collection',
        accountBound: true,
        achievementId: 2374,  // The Moot III: The Energizer [wiki verified June 2026]
        achievementBitCount: 35,
        note: 'Crafted once per account via The Moot III: The Energizer collection (Weaponsmith 500). Recipe from Box of Recipes: The Energizer.',
        inputs: [
          // ── Tier 3 ingredients (Moot III: The Energizer) ─────────────────
          {
            itemId: ID.ESSENCE_OF_THE_CELEBRATION,
            name: 'Essence of the Celebration',
            count: 1,
            source: 'collection',
            accountBound: true,
            note: 'From Chest of the Celebration — reward for completing The Moot III: The Energizer achievement',
            inputs: [],
          },
          // Spirit of the Perfected Mace — salvage Perfected Mace
          {
            itemId: ID.SPIRIT_OF_PERFECTED_MACE,
            name: 'Spirit of the Perfected Mace',
            count: 1,
            source: 'collection',
            accountBound: true,
            note: 'Salvage Perfected Mace (ID 74020) with any salvage kit',
            inputs: [
              // ── Perfected Mace — Tier 2 (Moot II: The Perfected Mace) ────
              {
                itemId: ID.PERFECTED_MACE,
                name: 'Perfected Mace',
                count: 1,
                source: 'collection',
                accountBound: true,
                achievementId: 2291,  // The Moot II: The Perfected Mace [wiki verified June 2026]
                achievementBitCount: 14,
                note: 'Crafted via The Moot II: The Perfected Mace collection (Weaponsmith 450). Recipe from Box of Recipes: The Energizer (Second Tier).',
                inputs: [
                  {
                    itemId: ID.EXPERTISE_IN_MACE_CRAFTING,
                    name: 'Expertise in Mace Crafting',
                    count: 1,
                    source: 'collection',
                    accountBound: true,
                    note: 'From Tricks and Tips for Legendary Mace Crafting — reward for completing The Moot II: The Perfected Mace achievement',
                    inputs: [],
                  },
                  {
                    itemId: ID.SPIRIT_OF_ENERGIZER_EXPERIMENT,
                    name: 'Spirit of The Energizer Experiment',
                    count: 1,
                    source: 'collection',
                    accountBound: true,
                    note: 'Salvage The Energizer Experiment (ID 70610) with any salvage kit',
                    inputs: [
                      // ── The Energizer Experiment — Tier 1 (Moot I) ───────
                      {
                        itemId: ID.ENERGIZER_EXPERIMENT,
                        name: 'The Energizer Experiment',
                        count: 1,
                        source: 'collection',
                        accountBound: true,
                        achievementId: 2177,  // The Moot I: The Experimental Mace [wiki verified June 2026]
                        achievementBitCount: 14,
                        note: 'Crafted via The Moot I: The Experimental Mace collection (Weaponsmith 450). Recipe from Box of Recipes: The Energizer (First Tier).',
                        inputs: [
                          {
                            itemId: ID.ESSENCE_OF_THE_HUNT_MACE,
                            name: 'Essence of the Hunt',
                            count: 1,
                            source: 'collection',
                            accountBound: true,
                            note: 'From Chest of the Hunt (mace) — reward for completing The Moot I: The Experimental Mace achievement',
                            inputs: [],
                          },
                          {
                            itemId: ID.EXPERIMENTAL_MACE_HEAD,
                            name: 'Experimental Mace Head',
                            count: 1,
                            source: 'forge',
                            accountBound: true,
                            note: 'Crafted (Weaponsmith 450) — recipe from Box of Recipes: The Energizer (First Tier)',
                            inputs: [
                              tp(ID.DELDRIMOR_STEEL_INGOT, 'Deldrimor Steel Ingot', 15),
                              { itemId: null, name: 'Memory of Battle', count: 50, source: 'wvw', accountBound: false, note: 'WvW participation currency', inputs: [] },
                              { itemId: null, name: 'Shard of Glory', count: 50, source: 'currency', note: 'PvP participation currency', inputs: [] },
                            ],
                          },
                          {
                            itemId: ID.EXPERIMENTAL_MACE_HAFT,
                            name: 'Experimental Mace Haft',
                            count: 1,
                            source: 'forge',
                            accountBound: true,
                            note: 'Crafted (Weaponsmith 450) — recipe from Box of Recipes: The Energizer (First Tier)',
                            inputs: [
                              tp(ID.SPIRITWOOD_PLANK, 'Spiritwood Plank', 10),
                              { itemId: null, name: 'Memory of Battle', count: 50, source: 'wvw', accountBound: false, note: 'WvW participation currency', inputs: [] },
                              { itemId: null, name: 'Shard of Glory', count: 50, source: 'currency', note: 'PvP participation currency', inputs: [] },
                            ],
                          },
                          { ...LEGENDARY_INSCRIPTION_COMPONENT },
                        ],
                      },
                    ],
                  },
                  // Jar of Luminesce Polish — shared Tier 2 component
                  {
                    itemId: ID.JAR_OF_LUMINESCE_POLISH,
                    name: 'Jar of Luminesce Polish',
                    count: 1,
                    source: 'forge',
                    accountBound: true,
                    note: 'Crafted (Artificer/Huntsman/Weaponsmith 400) — recipe from Box of Recipes: The Energizer (Second Tier)',
                    inputs: [
                      tp(ID.PILE_OF_BLOODSTONE_DUST,  'Pile of Bloodstone Dust',  250),
                      { itemId: null, name: 'Amalgamated Gemstone', count: 1, source: 'tp', inputs: [] },
                      tp(ID.THERMOCATALYTIC_REAGENT,  'Thermocatalytic Reagent',   10),
                      tp(ID.MASTER_MAINTENANCE_OIL,   'Master Maintenance Oil',    10),
                    ],
                  },
                  // Prismatic Lodestone — shared Tier 2 component
                  {
                    itemId: ID.PRISMATIC_LODESTONE,
                    name: 'Prismatic Lodestone',
                    count: 1,
                    source: 'forge',
                    accountBound: true,
                    note: 'Crafted (Artificer/Huntsman/Weaponsmith 400) — recipe from Box of Recipes: The Energizer (Second Tier). Combines 4 elemental lodestones.',
                    inputs: [
                      tp(ID.GLACIAL_LODESTONE,  'Glacial Lodestone',  1),
                      tp(ID.MOLTEN_LODESTONE,   'Molten Lodestone',   1),
                      tp(ID.ONYX_LODESTONE,     'Onyx Lodestone',     1),
                      tp(ID.CHARGED_LODESTONE,  'Charged Lodestone',  1),
                    ],
                  },
                ],
              },
            ],
          },
          // Party Ball — crafted Weaponsmith 500
          {
            itemId: ID.PARTY_BALL,
            name: 'Party Ball',
            count: 1,
            source: 'forge',
            accountBound: true,
            note: 'Crafted (Weaponsmith 500) — recipe from Box of Recipes: The Energizer',
            inputs: [
              tp(ID.OPAL_ORB,                 'Opal Orb',                  10),
              tp(ID.PILE_OF_COARSE_SAND,       'Pile of Coarse Sand',       100),
              tp(ID.PILE_OF_CRYSTALLINE_DUST,  'Pile of Crystalline Dust',   50),
              tp(ID.THERMOCATALYTIC_REAGENT,   'Thermocatalytic Reagent',    10),
            ],
          },
          // Party Stick — crafted Weaponsmith 500
          {
            itemId: ID.PARTY_STICK,
            name: 'Party Stick',
            count: 1,
            source: 'forge',
            accountBound: true,
            note: 'Crafted (Weaponsmith 500) — recipe from Box of Recipes: The Energizer. Sculptor\'s Tools: karma from Lord Joshua in Beetletun for 4,500 Karma.',
            inputs: [
              tp(ID.MITHRIL_INGOT,            'Mithril Ingot',            100),
              tp(ID.ELDER_WOOD_PLANK,          'Elder Wood Plank',         250),
              { itemId: 74909, name: "Sculptor's Tools", count: 1, source: 'karma',
                note: 'Purchased from Lord Joshua in Beetletun for 4,500 Karma — account-bound, NOT on TP', inputs: [] },
              tp(ID.PILE_OF_CRYSTALLINE_DUST,  'Pile of Crystalline Dust',  10),
            ],
          },
        ],
      },
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
      // ── Chaos Gun precursor — 3-tier Legendary Crafting collection ────────
      // Achievement chain: Quip I (Experimental Pistol) → II (Perfected Pistol) → III (Chaos Gun)
      {
        itemId: ID.CHAOS_GUN,
        name: 'Chaos Gun',
        count: 1,
        source: 'collection',
        accountBound: true,
        achievementId: 2524,  // Quip III: Chaos Gun [wiki verified June 2026]
        achievementBitCount: 36,
        note: 'Crafted once per account via Quip III: Chaos Gun collection (Huntsman 500). Recipe from Box of Recipes: Chaos Gun.',
        inputs: [
          // ── Tier 3 ingredients (Quip III: Chaos Gun) ─────────────────────
          {
            itemId: ID.ESSENCE_OF_MISCHIEF,
            name: 'Essence of Mischief',
            count: 1,
            source: 'collection',
            accountBound: true,
            note: 'From Chest of Mischief — reward for completing Quip III: Chaos Gun achievement',
            inputs: [],
          },
          // Spirit of the Perfected Pistol — salvage Perfected Pistol
          {
            itemId: ID.SPIRIT_OF_PERFECTED_PISTOL,
            name: 'Spirit of the Perfected Pistol',
            count: 1,
            source: 'collection',
            accountBound: true,
            note: 'Salvage Perfected Pistol (ID 73023) with any salvage kit',
            inputs: [
              // ── Perfected Pistol — Tier 2 (Quip II: The Perfected Pistol) ─
              {
                itemId: ID.PERFECTED_PISTOL,
                name: 'Perfected Pistol',
                count: 1,
                source: 'collection',
                accountBound: true,
                achievementId: 2498,  // Quip II: The Perfected Pistol [wiki verified June 2026]
                achievementBitCount: 14,
                note: 'Crafted via Quip II: The Perfected Pistol collection (Huntsman 450). Recipe from Box of Recipes: Chaos Gun (Second Tier).',
                inputs: [
                  // Expertise in Pistol Crafting — from Tricks and Tips book (Quip II reward)
                  {
                    itemId: ID.EXPERTISE_IN_PISTOL_CRAFTING,
                    name: 'Expertise in Pistol Crafting',
                    count: 1,
                    source: 'collection',
                    accountBound: true,
                    note: 'From Tricks and Tips for Advanced Pistol Crafting (consumable) — reward for completing Quip II: The Perfected Pistol achievement',
                    inputs: [],
                  },
                  // Spirit of the Chaos Gun Experiment — salvage Chaos Gun Experiment
                  {
                    itemId: ID.SPIRIT_OF_CHAOS_GUN_EXPERIMENT,
                    name: 'Spirit of the Chaos Gun Experiment',
                    count: 1,
                    source: 'collection',
                    accountBound: true,
                    note: 'Salvage Chaos Gun Experiment (ID 75846) with any salvage kit',
                    inputs: [
                      // ── Chaos Gun Experiment — Tier 1 (Quip I) ───────────
                      {
                        itemId: ID.CHAOS_GUN_EXPERIMENT,
                        name: 'Chaos Gun Experiment',
                        count: 1,
                        source: 'collection',
                        accountBound: true,
                        achievementId: 2389,  // Quip I: The Experimental Pistol [wiki verified June 2026]
                        achievementBitCount: 16,
                        note: 'Crafted via Quip I: The Experimental Pistol collection (Huntsman 450). Recipe from Box of Recipes: Chaos Gun (First Tier).',
                        inputs: [
                          // Essence of Audacity — from Chest of Audacity (Quip I reward)
                          {
                            itemId: ID.ESSENCE_OF_AUDACITY,
                            name: 'Essence of Audacity',
                            count: 1,
                            source: 'collection',
                            accountBound: true,
                            note: 'From Chest of Audacity — reward for completing Quip I: The Experimental Pistol achievement',
                            inputs: [],
                          },
                          // Experimental Pistol Barrel — crafted Huntsman 450
                          {
                            itemId: ID.EXPERIMENTAL_PISTOL_BARREL,
                            name: 'Experimental Pistol Barrel',
                            count: 1,
                            source: 'forge',
                            accountBound: true,
                            note: 'Crafted (Huntsman 450) — recipe from Box of Recipes: Chaos Gun (First Tier)',
                            inputs: [
                              tp(ID.DELDRIMOR_STEEL_INGOT, 'Deldrimor Steel Ingot', 15),
                              { itemId: null, name: 'Memory of Battle', count: 50, source: 'wvw', accountBound: false, note: 'WvW participation currency', inputs: [] },
                              { itemId: null, name: 'Shard of Glory',   count: 50, source: 'currency', note: 'PvP participation currency', inputs: [] },
                            ],
                          },
                          // Experimental Pistol Frame — crafted Huntsman 450
                          {
                            itemId: ID.EXPERIMENTAL_PISTOL_FRAME,
                            name: 'Experimental Pistol Frame',
                            count: 1,
                            source: 'forge',
                            accountBound: true,
                            note: 'Crafted (Huntsman 450) — recipe from Box of Recipes: Chaos Gun (First Tier)',
                            inputs: [
                              tp(ID.SPIRITWOOD_PLANK, 'Spiritwood Plank', 10),
                              { itemId: null, name: 'Memory of Battle', count: 50, source: 'wvw', accountBound: false, note: 'WvW participation currency', inputs: [] },
                              { itemId: null, name: 'Shard of Glory',   count: 50, source: 'currency', note: 'PvP participation currency', inputs: [] },
                            ],
                          },
                          // Legendary Inscription — shared component
                          { ...LEGENDARY_INSCRIPTION_COMPONENT },
                        ],
                      },
                    ],
                  },
                  // Jar of Luminesce Polish — shared Tier 2 component
                  {
                    itemId: ID.JAR_OF_LUMINESCE_POLISH,
                    name: 'Jar of Luminesce Polish',
                    count: 1,
                    source: 'forge',
                    accountBound: true,
                    note: 'Crafted (Artificer/Huntsman/Weaponsmith 400) — recipe from Box of Recipes: Chaos Gun (Second Tier)',
                    inputs: [
                      tp(ID.PILE_OF_BLOODSTONE_DUST,  'Pile of Bloodstone Dust',  250),
                      { itemId: null, name: 'Amalgamated Gemstone', count: 1, source: 'tp', inputs: [] },
                      tp(ID.THERMOCATALYTIC_REAGENT,  'Thermocatalytic Reagent',   10),
                      tp(ID.MASTER_MAINTENANCE_OIL,   'Master Maintenance Oil',    10),
                    ],
                  },
                  // Prismatic Lodestone — shared Tier 2 component
                  {
                    itemId: ID.PRISMATIC_LODESTONE,
                    name: 'Prismatic Lodestone',
                    count: 1,
                    source: 'forge',
                    accountBound: true,
                    note: 'Crafted (Artificer/Huntsman/Weaponsmith 400) — recipe from Box of Recipes: Chaos Gun (Second Tier). Combines 4 elemental lodestones.',
                    inputs: [
                      tp(ID.GLACIAL_LODESTONE,  'Glacial Lodestone',  1),
                      tp(ID.MOLTEN_LODESTONE,   'Molten Lodestone',   1),
                      tp(ID.ONYX_LODESTONE,     'Onyx Lodestone',     1),
                      tp(ID.CHARGED_LODESTONE,  'Charged Lodestone',  1),
                    ],
                  },
                ],
              },
            ],
          },
          // Ornate Pistol Frame — crafted Huntsman 500
          {
            itemId: ID.ORNATE_PISTOL_FRAME,
            name: 'Ornate Pistol Frame',
            count: 1,
            source: 'forge',
            accountBound: true,
            note: 'Crafted (Huntsman 500) — recipe from Box of Recipes: Chaos Gun. Sculptor\'s Tools: karma from Lord Joshua in Beetletun for 4,500 Karma.',
            inputs: [
              { itemId: 74909, name: "Sculptor's Tools", count: 1, source: 'karma',
                note: 'Purchased from Lord Joshua in Beetletun for 4,500 Karma — account-bound, NOT on TP', inputs: [] },
              tp(ID.ORICHALCUM_INGOT,      'Orichalcum Ingot',       10),
              tp(ID.MITHRIL_INGOT,         'Mithril Ingot',          50),
              tp(ID.DELDRIMOR_STEEL_INGOT, 'Deldrimor Steel Ingot',   1),
            ],
          },
          // Confetti Bullets — crafted Huntsman 500
          {
            itemId: ID.CONFETTI_BULLETS,
            name: 'Confetti Bullets',
            count: 1,
            source: 'forge',
            accountBound: true,
            note: 'Crafted (Huntsman 500) — recipe from Box of Recipes: Chaos Gun',
            inputs: [
              // Colored Paper — crafted (trophy), Huntsman 400, via Recipe: Confetti Pouch (bought from Hobbs for 5,005 Karma after Quip III achievement)
              {
                itemId: ID.COLORED_PAPER,
                name: 'Colored Paper',
                count: 10,
                source: 'forge',
                accountBound: true,
                note: 'Crafted (Huntsman 400) — recipe unlocked via Recipe: Confetti Pouch (5,005 Karma from Hobbs, requires Quip III: Chaos Gun achievement)',
                inputs: [
                  { itemId: null, name: 'Sheet of Coarse Paper', count: 10, source: 'tp', inputs: [] },
                  { itemId: null, name: 'Pouch of Red Pigment',    count: 15, source: 'tp', inputs: [] },
                  { itemId: null, name: 'Pouch of Yellow Pigment', count: 15, source: 'tp', inputs: [] },
                  { itemId: null, name: 'Pouch of Blue Pigment',   count: 15, source: 'tp', inputs: [] },
                ],
              },
              tp(ID.MITHRIL_INGOT, 'Mithril Ingot', 50),
              { itemId: ID.BLACK_POWDER, name: 'Black Powder', count: 1, source: 'karma',
                note: 'Purchased from Thegren Topjaw (Tela Range, Plains of Ashford) for 1,500 Karma — only purchasable once the Confetti Bullets recipe box is unlocked', inputs: [] },
              tp(24272, 'Pile of Glittering Dust', 50),
            ],
          },
        ],
      },
      { ...GIFT_OF_QUIP },
      { ...GIFT_OF_FORTUNE },
      { ...GIFT_OF_MASTERY },
    ],
  },

  // ── Meteorlogicus (Scepter) ───────────────────────────────────────────────
  {
    id: 'legendary_meteorlogicus',
    name: 'Meteorlogicus',
    itemId: 30695,
    rarity: 'Legendary', weaponType: 'Scepter', generation: 1,
    inputs: [
      // ── Storm precursor — 3-tier Legendary Crafting collection ────────────
      // Achievement chain: Meteorlogicus I (Experimental Scepter) → II (Perfected Scepter) → III (Storm)
      {
        itemId: ID.STORM,
        name: 'Storm',
        count: 1,
        source: 'collection',
        accountBound: true,
        achievementId: 2449,  // Meteorlogicus III: Storm [wiki verified July 2026]
        achievementBitCount: 29,
        note: 'Crafted once per account via Meteorlogicus III: Storm collection (Artificer 500). Recipe from Box of Recipes: Storm.',
        inputs: [
          // ── Tier 3 ingredients (Meteorlogicus III: Storm) ────────────────
          {
            itemId: ID.ESSENCE_OF_CONTROL,
            name: 'Essence of Control',
            count: 1,
            source: 'collection',
            accountBound: true,
            note: 'From Chest of Control — reward for completing Meteorlogicus III: Storm achievement',
            inputs: [],
          },
          // Spirit of the Perfected Scepter — salvage Perfected Scepter
          {
            itemId: ID.SPIRIT_OF_PERFECTED_SCEPTER,
            name: 'Spirit of the Perfected Scepter',
            count: 1,
            source: 'collection',
            accountBound: true,
            note: 'Salvage Perfected Scepter (ID 71886) with any salvage kit',
            inputs: [
              // ── Perfected Scepter — Tier 2 (Meteorlogicus II: The Perfected Scepter) ─
              {
                itemId: ID.PERFECTED_SCEPTER,
                name: 'Perfected Scepter',
                count: 1,
                source: 'collection',
                accountBound: true,
                achievementId: 2391,  // Meteorlogicus II: The Perfected Scepter [wiki verified July 2026]
                achievementBitCount: 12,
                note: 'Crafted via Meteorlogicus II: The Perfected Scepter collection (Artificer 450). Recipe from Box of Recipes: Storm (Second Tier).',
                inputs: [
                  // Expertise in Scepter Crafting — from Tricks and Tips book (Meteorlogicus II reward)
                  {
                    itemId: ID.EXPERTISE_IN_SCEPTER_CRAFTING,
                    name: 'Expertise in Scepter Crafting',
                    count: 1,
                    source: 'collection',
                    accountBound: true,
                    note: 'From Tricks and Tips for Advanced Scepter Crafting (consumable) — reward for completing Meteorlogicus II: The Perfected Scepter achievement',
                    inputs: [],
                  },
                  // Spirit of the Storm Experiment — salvage Storm Experiment
                  {
                    itemId: ID.SPIRIT_OF_STORM_EXPERIMENT,
                    name: 'Spirit of the Storm Experiment',
                    count: 1,
                    source: 'collection',
                    accountBound: true,
                    note: 'Salvage Storm Experiment (ID 74655) with any salvage kit',
                    inputs: [
                      // ── Storm Experiment — Tier 1 (Meteorlogicus I) ──────
                      {
                        itemId: ID.STORM_EXPERIMENT,
                        name: 'Storm Experiment',
                        count: 1,
                        source: 'collection',
                        accountBound: true,
                        achievementId: 2441,  // Meteorlogicus I: The Experimental Scepter [wiki verified July 2026]
                        achievementBitCount: 15,
                        note: 'Crafted via Meteorlogicus I: The Experimental Scepter collection (Artificer 450). Recipe from Box of Recipes: Storm (First Tier).',
                        inputs: [
                          // Essence of Meteorology — from Chest of Meteorology (Meteorlogicus I reward)
                          {
                            itemId: ID.ESSENCE_OF_METEOROLOGY,
                            name: 'Essence of Meteorology',
                            count: 1,
                            source: 'collection',
                            accountBound: true,
                            note: 'From Chest of Meteorology — reward for completing Meteorlogicus I: The Experimental Scepter achievement',
                            inputs: [],
                          },
                          // Experimental Scepter Core — crafted Artificer 450
                          {
                            itemId: ID.EXPERIMENTAL_SCEPTER_CORE,
                            name: 'Experimental Scepter Core',
                            count: 1,
                            source: 'forge',
                            accountBound: true,
                            note: 'Crafted (Artificer 450) — recipe from Box of Recipes: Storm (First Tier)',
                            inputs: [
                              tp(ID.SPIRITWOOD_PLANK, 'Spiritwood Plank', 10),
                              { itemId: null, name: 'Memory of Battle', count: 50, source: 'wvw', accountBound: false, note: 'WvW participation currency', inputs: [] },
                              { itemId: null, name: 'Shard of Glory',   count: 50, source: 'currency', note: 'PvP participation currency', inputs: [] },
                            ],
                          },
                          // Experimental Scepter Rod — crafted Artificer 450
                          {
                            itemId: ID.EXPERIMENTAL_SCEPTER_ROD,
                            name: 'Experimental Scepter Rod',
                            count: 1,
                            source: 'forge',
                            accountBound: true,
                            note: 'Crafted (Artificer 450) — recipe from Box of Recipes: Storm (First Tier)',
                            inputs: [
                              tp(ID.SPIRITWOOD_PLANK, 'Spiritwood Plank', 15),
                              { itemId: null, name: 'Memory of Battle', count: 50, source: 'wvw', accountBound: false, note: 'WvW participation currency', inputs: [] },
                              { itemId: null, name: 'Shard of Glory',   count: 50, source: 'currency', note: 'PvP participation currency', inputs: [] },
                            ],
                          },
                          // Legendary Inscription — shared component
                          { ...LEGENDARY_INSCRIPTION_COMPONENT },
                        ],
                      },
                    ],
                  },
                  // Jar of Luminesce Polish — shared Tier 2 component
                  {
                    itemId: ID.JAR_OF_LUMINESCE_POLISH,
                    name: 'Jar of Luminesce Polish',
                    count: 1,
                    source: 'forge',
                    accountBound: true,
                    note: 'Crafted (Artificer/Huntsman/Weaponsmith 400) — recipe from Box of Recipes: Storm (Second Tier)',
                    inputs: [
                      tp(ID.PILE_OF_BLOODSTONE_DUST,  'Pile of Bloodstone Dust',  250),
                      { itemId: null, name: 'Amalgamated Gemstone', count: 1, source: 'tp', inputs: [] },
                      tp(ID.THERMOCATALYTIC_REAGENT,  'Thermocatalytic Reagent',   10),
                      tp(ID.MASTER_MAINTENANCE_OIL,   'Master Maintenance Oil',    10),
                    ],
                  },
                  // Prismatic Lodestone — shared Tier 2 component
                  {
                    itemId: ID.PRISMATIC_LODESTONE,
                    name: 'Prismatic Lodestone',
                    count: 1,
                    source: 'forge',
                    accountBound: true,
                    note: 'Crafted (Artificer/Huntsman/Weaponsmith 400) — recipe from Box of Recipes: Storm (Second Tier). Combines 4 elemental lodestones.',
                    inputs: [
                      tp(ID.GLACIAL_LODESTONE,  'Glacial Lodestone',  1),
                      tp(ID.MOLTEN_LODESTONE,   'Molten Lodestone',   1),
                      tp(ID.ONYX_LODESTONE,     'Onyx Lodestone',     1),
                      tp(ID.CHARGED_LODESTONE,  'Charged Lodestone',  1),
                    ],
                  },
                ],
              },
            ],
          },
          // Globe — crafted Artificer 500
          {
            itemId: ID.GLOBE,
            name: 'Globe',
            count: 1,
            source: 'forge',
            accountBound: true,
            note: 'Crafted (Artificer 500) — recipe from Box of Recipes: Storm',
            inputs: [
              { itemId: 66902, name: 'Brick of Clay', count: 25, source: 'karma',
                note: 'Account Bound — Dry Top karma/Geode vendors', inputs: [] },
              tp(ID.MOLTEN_LODESTONE, 'Molten Lodestone', 3),
              { itemId: 12156, name: 'Jug of Water', count: 50, source: 'vendor',
                note: 'Vendor only, 10 for 80c (8c each)', inputs: [] },
              tp(ID.GLACIAL_LODESTONE, 'Glacial Lodestone', 5),
            ],
          },
          // Spinning Mechanism — crafted Artificer 500
          {
            itemId: ID.SPINNING_MECHANISM,
            name: 'Spinning Mechanism',
            count: 1,
            source: 'forge',
            accountBound: true,
            note: 'Crafted (Artificer 500) — recipe from Box of Recipes: Storm',
            inputs: [
              { itemId: ID.WATCHWORK_MECHANISM, name: 'Watchwork Mechanism', count: 1, source: 'tp', inputs: [] },
              tp(ID.ELDER_WOOD_PLANK, 'Elder Wood Plank', 50),
              tp(ID.MITHRIL_INGOT, 'Mithril Ingot', 50),
              tp(ID.MASTER_MAINTENANCE_OIL, 'Master Maintenance Oil', 10),
            ],
          },
        ],
      },
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
      // ── The Legend precursor — 3-tier collection chain ─────────────────────
      // Achievement chain: Bifrost I (2530) → Bifrost II (2500) → Bifrost III (2187)
      {
        itemId: ID.THE_LEGEND,
        name: 'The Legend',
        count: 1,
        source: 'collection',
        accountBound: true,
        achievementId: 2187,   // The Bifrost III: The Legend
        note: 'Crafted via 3-tier collection chain. Complete The Bifrost III: The Legend achievement.',
        inputs: [
          // ── Tier 3: The Bifrost III: The Legend (achievement 2187) ──────────
          // Chest of Rainbows — reward for completing Bifrost III achievement
          {
            itemId: ID.ESSENCE_OF_RAINBOWS,
            name: 'Essence of Rainbows',
            count: 1,
            source: 'collection',
            accountBound: true,
            achievementId: 2187,
            note: 'Obtained from Chest of Rainbows — reward for completing The Bifrost III: The Legend achievement',
            inputs: [],
          },
          // Spirit of the Perfected Staff — salvage Perfected Staff
          {
            itemId: ID.SPIRIT_OF_PERFECTED_STAFF,
            name: 'Spirit of the Perfected Staff',
            count: 1,
            source: 'collection',
            accountBound: true,
            note: 'Salvage Perfected Staff (ID 76027) with any salvage kit',
            inputs: [
              // Perfected Staff is crafted via Tier 2 collection (Bifrost II)
              {
                itemId: ID.PERFECTED_STAFF,
                name: 'Perfected Staff',
                count: 1,
                source: 'collection',
                accountBound: true,
                achievementId: 2500,  // The Bifrost II: The Perfected Staff
                note: 'Crafted via The Bifrost II: The Perfected Staff collection. Recipe from Box of Recipes: The Legend (Second Tier).',
                inputs: [
                  collection(ID.EXPERTISE_IN_STAFF_CRAFTING, 'Expertise in Staff Crafting', 1,
                    'From Tricks and Tips for Advanced Staff Crafting (consumable) — reward for completing The Bifrost II achievement'),
                  {
                    itemId: ID.SPIRIT_OF_LEGEND_EXPERIMENT,
                    name: 'Spirit of The Legend Experiment',
                    count: 1,
                    source: 'collection',
                    accountBound: true,
                    note: 'Salvage The Legend Experiment (ID 73431) with any salvage kit',
                    inputs: [
                      // The Legend Experiment is crafted via Tier 1 collection (Bifrost I)
                      {
                        itemId: ID.THE_LEGEND_EXPERIMENT,
                        name: 'The Legend Experiment',
                        count: 1,
                        source: 'collection',
                        accountBound: true,
                        achievementId: 2530,  // The Bifrost I: The Experimental Staff
                        note: 'Crafted via The Bifrost I: The Experimental Staff collection. Recipe from Box of Recipes: The Legend (First Tier).',
                        inputs: [
                          collection(ID.ESSENCE_OF_ANCIENT_MYSTICISM, 'Essence of Ancient Mysticism', 1,
                            'From Chest of Ancient Mysticism (reward for completing The Bifrost I achievement) — or buy from Grandmaster Craftsman Hobbs in Trader\'s Forum, Lion\'s Arch for 10,003 Karma (after completing Bifrost I)'),
                          // Experimental Staff Head — crafted (recipe from Box of Recipes First Tier)
                          {
                            itemId: ID.EXPERIMENTAL_STAFF_HEAD,
                            name: 'Experimental Staff Head',
                            count: 1,
                            source: 'forge',
                            accountBound: true,
                            note: 'Crafted (Artificer 450) — recipe from Box of Recipes: The Legend (First Tier)',
                            inputs: [
                              { itemId: ID.SPIRITWOOD_PLANK, name: 'Spiritwood Plank', count: 10, source: 'tp', inputs: [] },
                              { itemId: null, idName: 'Memory of Battle', name: 'Memory of Battle', count: 100, source: 'wvw', accountBound: false, note: 'WvW participation currency', inputs: [] },
                              { itemId: null, idName: 'Shard of Glory', name: 'Shard of Glory', count: 100, source: 'currency', note: 'PvP participation currency — buy from Miyani', inputs: [] },
                            ],
                          },
                          // Experimental Staff Shaft — crafted (recipe from Box of Recipes First Tier)
                          {
                            itemId: ID.EXPERIMENTAL_STAFF_SHAFT,
                            name: 'Experimental Staff Shaft',
                            count: 1,
                            source: 'forge',
                            accountBound: true,
                            note: 'Crafted (Artificer 450) — recipe from Box of Recipes: The Legend (First Tier)',
                            inputs: [
                              { itemId: ID.SPIRITWOOD_PLANK, name: 'Spiritwood Plank', count: 25, source: 'tp', inputs: [] },
                              { itemId: null, idName: 'Memory of Battle', name: 'Memory of Battle', count: 100, source: 'wvw', accountBound: false, note: 'WvW participation currency', inputs: [] },
                              { itemId: null, idName: 'Shard of Glory', name: 'Shard of Glory', count: 100, source: 'currency', note: 'PvP participation currency — buy from Miyani', inputs: [] },
                            ],
                          },
                          // Legendary Inscription — crafted (recipe from Box of Recipes First Tier)
                          {
                            itemId: ID.LEGENDARY_INSCRIPTION,
                            name: 'Legendary Inscription',
                            count: 1,
                            source: 'forge',
                            accountBound: true,
                            note: 'Crafted (Artificer/Huntsman/Weaponsmith 450) — recipe from Box of Recipes: The Legend (First Tier)',
                            inputs: [
                              tp(ID.GLOB_OF_ECTOPLASM, 'Glob of Ectoplasm', 10),
                              tp(ID.PILE_OF_CRYSTALLINE_DUST, 'Pile of Crystalline Dust', 5),
                              { itemId: null, idName: 'Orichalcum Plated Dowel', name: 'Orichalcum Plated Dowel', count: 1, source: 'tp', inputs: [] },
                              { itemId: null, idName: 'Elonian Leather Square', name: 'Elonian Leather Square', count: 10, source: 'tp', inputs: [] },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  // Jar of Luminesce Polish — crafted (recipe from Box of Recipes Second Tier)
                  {
                    itemId: ID.JAR_OF_LUMINESCE_POLISH,
                    name: 'Jar of Luminesce Polish',
                    count: 1,
                    source: 'forge',
                    accountBound: true,
                    note: 'Crafted (Artificer/Huntsman/Weaponsmith 400) — recipe from Box of Recipes: The Legend (Second Tier)',
                    inputs: [
                      { itemId: ID.PILE_OF_BLOODSTONE_DUST, name: 'Pile of Bloodstone Dust', count: 250, source: 'tp', inputs: [] },
                      { itemId: null, idName: 'Amalgamated Gemstone', name: 'Amalgamated Gemstone', count: 1, source: 'tp', inputs: [] },
                      { itemId: null, idName: 'Thermocatalytic Reagent', name: 'Thermocatalytic Reagent', count: 10, source: 'tp', inputs: [] },
                      { itemId: ID.MASTER_MAINTENANCE_OIL, name: 'Master Maintenance Oil', count: 10, source: 'tp', inputs: [] },
                    ],
                  },
                  // Prismatic Lodestone — crafted (recipe from Box of Recipes Second Tier)
                  {
                    itemId: ID.PRISMATIC_LODESTONE,
                    name: 'Prismatic Lodestone',
                    count: 1,
                    source: 'forge',
                    accountBound: true,
                    note: 'Crafted (Artificer/Huntsman/Weaponsmith 400) — recipe from Box of Recipes: The Legend (Second Tier). Combines 4 elemental lodestones.',
                    inputs: [
                      tp(ID.GLACIAL_LODESTONE,  'Glacial Lodestone',  1),
                      tp(ID.MOLTEN_LODESTONE,   'Molten Lodestone',   1),
                      tp(ID.ONYX_LODESTONE,     'Onyx Lodestone',     1),
                      tp(ID.CHARGED_LODESTONE,  'Charged Lodestone',  1),
                    ],
                  },
                ],
              },
            ],
          },
          // Carved Tear Drop — crafted (recipe from Box of Recipes: The Legend)
          {
            itemId: ID.CARVED_TEAR_DROP,
            name: 'Carved Tear Drop',
            count: 1,
            source: 'forge',
            accountBound: true,
            note: 'Crafted (Artificer 500) — recipe from Box of Recipes: The Legend (from Chest of Rainbows)',
            inputs: [
              tp(ID.GLOB_OF_ECTOPLASM,        'Glob of Ectoplasm',        1),
              { itemId: ID.SPIRITWOOD_PLANK, name: 'Spiritwood Plank', count: 1, source: 'tp', inputs: [] },
              { itemId: 74909, name: "Sculptor's Tools", count: 1, source: 'karma',
                note: 'Purchased from Lord Joshua in Beetletun for 4,500 Karma — account-bound, NOT on TP', inputs: [] },
              tp(ID.PILE_OF_CRYSTALLINE_DUST, 'Pile of Crystalline Dust', 10),
            ],
          },
          // Carved Beam — crafted (recipe from Box of Recipes: The Legend)
          {
            itemId: ID.CARVED_BEAM,
            name: 'Carved Beam',
            count: 1,
            source: 'forge',
            accountBound: true,
            note: 'Crafted (Artificer 500) — recipe from Box of Recipes: The Legend (from Chest of Rainbows)',
            inputs: [
              tp(ID.ELDER_WOOD_PLANK,   'Elder Wood Plank',   50),
              tp(ID.ANCIENT_WOOD_PLANK, 'Ancient Wood Plank', 50),
              { itemId: ID.SPIRITWOOD_PLANK, name: 'Spiritwood Plank', count: 1, source: 'tp', inputs: [] },
              { itemId: 74909, name: "Sculptor's Tools", count: 1, source: 'karma',
                note: 'Purchased from Lord Joshua in Beetletun for 4,500 Karma — account-bound, NOT on TP', inputs: [] },
            ],
          },
        ],
      },
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
    itemId: 30701,   // [wiki verified June 2026]
    rarity: 'Legendary', weaponType: 'Trident', generation: 1,
    inputs: [
      // ── Venom precursor — 3-tier Legendary Crafting collection ───────────
      // Achievement chain: Kraitkin I → Kraitkin II → Kraitkin III: Venom
      // Tier 3 recipe (Artificer 500) confirmed: Essence of the Krait + Spirit of the Perfected Trident
      //   + Snake Statue + Congealed Water [wiki verified June 2026]
      // Sub-item IDs pending confirmation — modeled as stub collection for now
      {
        itemId: ID.VENOM,
        name: 'Venom',
        count: 1,
        source: 'collection',
        accountBound: true,
        achievementId: 2296,  // Kraitkin III: Venom
        note: 'Crafted once per account via Kraitkin III: Venom collection (Artificer 500). Recipe from Box of Recipes: Venom.',
        inputs: [
          // ── Tier 3 ingredients (Kraitkin III: Venom) ─────────────────────
          // Essence of the Krait — from Chest of the Krait, Kraitkin III achievement reward
          {
            itemId: ID.ESSENCE_OF_THE_KRAIT,
            name: 'Essence of the Krait',
            count: 1,
            source: 'collection',
            accountBound: true,
            note: 'From Chest of the Krait — reward for completing Kraitkin III: Venom achievement',
            inputs: [],
          },
          // Spirit of the Perfected Trident — salvage Perfected Trident
          {
            itemId: ID.SPIRIT_OF_PERFECTED_TRIDENT,
            name: 'Spirit of the Perfected Trident',
            count: 1,
            source: 'collection',
            accountBound: true,
            note: 'Salvage Perfected Trident (ID 74468) with any salvage kit',
            inputs: [
              // ── Perfected Trident — Tier 2 (Kraitkin II: The Perfected Trident) ──
              {
                itemId: ID.PERFECTED_TRIDENT,
                name: 'Perfected Trident',
                count: 1,
                source: 'collection',
                accountBound: true,
                achievementId: 2522,  // Kraitkin II: The Perfected Trident
                note: 'Crafted via Kraitkin II: The Perfected Trident collection (Artificer 450). Recipe from Box of Recipes: Venom (Second Tier).',
                inputs: [
                  // Expertise in Trident Crafting — from Tricks and Tips book (Kraitkin II reward)
                  {
                    itemId: ID.EXPERTISE_IN_TRIDENT_CRAFTING,
                    name: 'Expertise in Trident Crafting',
                    count: 1,
                    source: 'collection',
                    accountBound: true,
                    note: 'From Tricks and Tips for Advanced Trident Crafting (consumable) — reward for completing Kraitkin II: The Perfected Trident achievement',
                    inputs: [],
                  },
                  // Spirit of the Venom Experiment — salvage Venom Experiment
                  {
                    itemId: ID.SPIRIT_OF_VENOM_EXPERIMENT,
                    name: 'Spirit of the Venom Experiment',
                    count: 1,
                    source: 'collection',
                    accountBound: true,
                    note: 'Salvage Venom Experiment (ID 72629) with any salvage kit',
                    inputs: [
                      // ── Venom Experiment — Tier 1 (Kraitkin I: The Experimental Trident) ──
                      {
                        itemId: ID.VENOM_EXPERIMENT,
                        name: 'Venom Experiment',
                        count: 1,
                        source: 'collection',
                        accountBound: true,
                        achievementId: 2483,  // Kraitkin I: The Experimental Trident
                        note: 'Crafted via Kraitkin I: The Experimental Trident collection (Artificer 450). Recipe from Box of Recipes: Venom (First Tier).',
                        inputs: [
                          // Essence of Tentacles — from Chest of Tentacles (Kraitkin I reward)
                          {
                            itemId: ID.ESSENCE_OF_TENTACLES,
                            name: 'Essence of Tentacles',
                            count: 1,
                            source: 'collection',
                            accountBound: true,
                            note: 'From Chest of Tentacles — reward for completing Kraitkin I: The Experimental Trident achievement',
                            inputs: [],
                          },
                          // Experimental Trident Head — crafted Artificer 450
                          {
                            itemId: ID.EXPERIMENTAL_TRIDENT_HEAD,
                            name: 'Experimental Trident Head',
                            count: 1,
                            source: 'forge',
                            accountBound: true,
                            note: 'Crafted (Artificer 450) — recipe from Box of Recipes: Venom (First Tier)',
                            inputs: [
                              { itemId: null, name: 'Deldrimor Steel Ingot', count: 1, source: 'tp', inputs: [] },
                              { itemId: null, name: 'Memory of Battle', count: 5, source: 'wvw', accountBound: false, note: 'WvW participation currency', inputs: [] },
                              { itemId: null, name: 'Shard of Glory',   count: 5, source: 'currency', note: 'PvP participation currency', inputs: [] },
                            ],
                          },
                          // Experimental Trident Shaft — crafted Artificer 450
                          {
                            itemId: ID.EXPERIMENTAL_TRIDENT_SHAFT,
                            name: 'Experimental Trident Shaft',
                            count: 1,
                            source: 'forge',
                            accountBound: true,
                            note: 'Crafted (Artificer 450) — recipe from Box of Recipes: Venom (First Tier)',
                            inputs: [
                              { itemId: ID.SPIRITWOOD_PLANK, name: 'Spiritwood Plank', count: 1, source: 'tp', inputs: [] },
                              { itemId: null, name: 'Memory of Battle', count: 5, source: 'wvw', accountBound: false, note: 'WvW participation currency', inputs: [] },
                              { itemId: null, name: 'Shard of Glory',   count: 5, source: 'currency', note: 'PvP participation currency', inputs: [] },
                            ],
                          },
                          // Legendary Underwater Inscription — shared component (Tier-1 box)
                          {
                            itemId: ID.LEGENDARY_UNDERWATER_INSCRIPTION,
                            name: 'Legendary Underwater Inscription',
                            count: 1,
                            source: 'forge',
                            accountBound: true,
                            note: 'Crafted (Artificer/Huntsman/Weaponsmith 450) — recipe from Box of Recipes: Venom (First Tier) or other Tier-1 box',
                            inputs: [
                              tp(ID.ELONIAN_LEATHER_SQUARE,   'Elonian Leather Square',   1),
                              tp(ID.ORICHALCUM_PLATED_DOWEL,  'Orichalcum Plated Dowel',  1),
                              tp(ID.GLOB_OF_ECTOPLASM,         'Glob of Ectoplasm',        1),
                              tp(ID.PILE_OF_CRYSTALLINE_DUST,  'Pile of Crystalline Dust', 5),
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  // Jar of Luminesce Polish — shared with Bolt/Bifrost Tier 2
                  {
                    itemId: ID.JAR_OF_LUMINESCE_POLISH,
                    name: 'Jar of Luminesce Polish',
                    count: 1,
                    source: 'forge',
                    accountBound: true,
                    note: 'Crafted (Artificer/Huntsman/Weaponsmith 400) — recipe from Box of Recipes: Venom (Second Tier)',
                    inputs: [
                      tp(ID.PILE_OF_BLOODSTONE_DUST,    'Pile of Bloodstone Dust',    250),
                      { itemId: null, name: 'Amalgamated Gemstone',    count: 1,  source: 'tp', inputs: [] },
                      tp(ID.THERMOCATALYTIC_REAGENT,    'Thermocatalytic Reagent',     10),
                      tp(ID.MASTER_MAINTENANCE_OIL,     'Master Maintenance Oil',      10),
                    ],
                  },
                  // Prismatic Lodestone — shared with Bolt/Bifrost Tier 2
                  {
                    itemId: ID.PRISMATIC_LODESTONE,
                    name: 'Prismatic Lodestone',
                    count: 1,
                    source: 'forge',
                    accountBound: true,
                    note: 'Crafted (Artificer/Huntsman/Weaponsmith 400) — recipe from Box of Recipes: Venom (Second Tier). Combines 4 elemental lodestones.',
                    inputs: [
                      tp(ID.GLACIAL_LODESTONE,  'Glacial Lodestone',  1),
                      tp(ID.MOLTEN_LODESTONE,   'Molten Lodestone',   1),
                      tp(ID.ONYX_LODESTONE,     'Onyx Lodestone',     1),
                      tp(ID.CHARGED_LODESTONE,  'Charged Lodestone',  1),
                    ],
                  },
                ],
              },
            ],
          },
          // Snake Statue — crafted Artificer 500
          {
            itemId: ID.SNAKE_STATUE,
            name: 'Snake Statue',
            count: 1,
            source: 'forge',
            accountBound: true,
            note: 'Crafted (Artificer 500) — recipe from Box of Recipes: Venom',
            inputs: [
              tp(ID.MITHRIL_INGOT,    'Mithril Ingot',    10),
              tp(ID.CORAL_TENTACLE,   'Coral Tentacle',    3),
              tp(ID.EMERALD_ORB,      'Emerald Orb',       3),
              tp(ID.SHEET_OF_AMBRITE, 'Sheet of Ambrite',  1),
            ],
          },
          // Congealed Water — crafted Artificer 500
          {
            itemId: ID.CONGEALED_WATER,
            name: 'Congealed Water',
            count: 1,
            source: 'forge',
            accountBound: true,
            note: 'Crafted (Artificer 500) — recipe from Box of Recipes: Venom. Jug of Water: vendor 10 for 80c (8c each).',
            inputs: [
              { itemId: ID.JUG_OF_WATER, name: 'Jug of Water', count: 10, source: 'vendor', note: 'Vendor 10 for 80c (8c each) — buy from any cooking vendor', inputs: [] },
              tp(ID.GLOB_OF_ECTOPLASM,        'Glob of Ectoplasm',        1),
              tp(ID.PILE_OF_CRYSTALLINE_DUST, 'Pile of Crystalline Dust', 5),
              tp(ID.THERMOCATALYTIC_REAGENT,  'Thermocatalytic Reagent',  10),
            ],
          },
        ],
      },
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
