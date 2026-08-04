/**
 * GW2 Legendary: Back Items, Trinkets, Relics, Runes, Sigils
 *
 * Back Items:
 *   - Ad Infinitum (Gen 1, collection-based)
 *   - Warbringer (WvW)
 *
 * Trinkets:
 *   - Aurora (Living World Season 3, account-bound collection)
 *   - Vision (Living World Season 4, account-bound collection)
 *   - Coalescence (Raids, account-bound collection)
 *   - Prismatic Champion's Regalia (PvP, account-bound)
 *
 * Legendary Relic:
 *   - Relic of Nayos (Secrets of the Obscure)
 *
 * Legendary Runes:
 *   - Rune of the Legendary Rogue, Warrior, etc. (SotO)
 *
 * Legendary Sigils:
 *   - Sigil of [type] (SotO)
 *
 * Most of these are fully account-bound collection paths —
 * gold costs come from TP-purchasable sub-ingredients only.
 */

// ── Shared helpers ─────────────────────────────────────────────────────────────
function tp(name, itemId, idName, count) {
  return { name, itemId: itemId || null, idName: idName || null, count, source: 'tp', inputs: [] };
}
function acctBound(name, idName, count, note, subInputs) {
  return { name, itemId: null, idName, count, source: 'collection', accountBound: true, note: note || null, inputs: subInputs || [] };
}
function wvw(name, idName, count, note) {
  return { name, itemId: null, idName, count, source: 'wvw', accountBound: true, note: note || null, inputs: [] };
}
function karma(name, itemId, count, note) {
  return { name, itemId: itemId || null, count, source: 'karma', note: note || null, inputs: [] };
}

// ── BACK ITEMS ─────────────────────────────────────────────────────────────────

const AD_INFINITUM = {
  id: 'legendary_back_ad_infinitum',
  name: 'Ad Infinitum',
  itemId: null, idName: 'Ad Infinitum',
  rarity: 'Legendary',
  category: 'back',
  generation: 1,
  note: '4-stage fractal collection. Each stage requires Fractal Encryption Keys + Fractal Relics + TP mats.',
  inputs: [
    acctBound('Fractal Capacitor (Infused)', 'Fractal Capacitor (Infused)', 1,
      'Stage 1 → 2 → 3 → Infused: each stage requires Pristine Fractal Relics + Fractal Encryptions + Ectos',
      [
        acctBound('Fractal Capacitor (Refined)', 'Fractal Capacitor (Refined)', 1,
          'Fractal Collection stage 3 — requires fractal progression',
          [
            acctBound('Fractal Capacitor', 'Fractal Capacitor', 1,
              'Fractal Collection stage 2',
              [
                acctBound('Prototype Fractal Capacitor', 'Prototype Fractal Capacitor', 1,
                  'Stage 1 — from Fractalist achievement + Fractal mats',
                  [
                    tp('Glob of Ectoplasm', 19721, null, 250),
                    tp('Shard of Crystallized Mists Essence', null, 'Shard of Crystallized Mists Essence', 100),
                    tp('Fractal Encryption Key', null, 'Fractal Encryption Key', 100),
                  ]
                ),
                tp('Glob of Ectoplasm', 19721, null, 250),
                tp('Fractal Encryption Key', null, 'Fractal Encryption Key', 100),
              ]
            ),
            tp('Glob of Ectoplasm', 19721, null, 250),
            tp('Fractal Encryption Key', null, 'Fractal Encryption Key', 100),
          ]
        ),
        tp('Glob of Ectoplasm', 19721, null, 250),
        tp('Fractal Encryption Key', null, 'Fractal Encryption Key', 100),
        { name: 'Agony Infusion (+9 or higher)', itemId: null, count: 1, source: 'tp', note: 'Required for Infused stage — buy cheapest +9 or above from TP', inputs: [] },
      ]
    ),
  ],
};

const WARBRINGER = {
  id: 'legendary_back_warbringer',
  name: 'Warbringer',
  itemId: null, idName: 'Warbringer',
  rarity: 'Legendary',
  category: 'back',
  generation: 2,
  expansion: 'WvW',
  note: 'WvW legendary backpack — requires 3-stage WvW collection progression',
  inputs: [
    acctBound('Warbringer III (Perfected)', 'Warbringer III', 1,
      'Final stage of WvW back item collection',
      [
        acctBound('Warbringer II (Refined)', 'Warbringer II', 1, 'Stage 2 — WvW skirmish progression', [
          acctBound('Warbringer I (Prototype)', 'Warbringer I', 1, 'Stage 1 — WvW participation + kills', []),
        ]),
        wvw('Gift of Battle', 'Gift of Battle', 1, 'WvW Skirmish reward track'),
        { name: 'Memory of Battle', itemId: null, idName: 'Memory of Battle', count: 500, source: 'wvw', note: 'WvW participation currency', inputs: [] },
        tp('Glob of Ectoplasm', 19721, null, 250),
      ]
    ),
  ],
};

// ── TRINKETS ──────────────────────────────────────────────────────────────────

const AURORA = {
  id: 'legendary_trinket_aurora',
  name: 'Aurora',
  itemId: 81908,
  rarity: 'Legendary',
  category: 'trinket',
  trinketSlot: 'Accessory',
  generation: 1,
  expansion: 'Living World Season 3',
  note: 'Account-bound — requires all 6 Living World Season 3 episodes',
  // Achievement tracking: Aurora II: Empowering = achievement ID 3489 (21 bits, each needs 1 Xunlai Electrum Ingot)
  achievementId: 3489,
  achievementBitCount: 21,
  inputs: [
    // Spark of Sentience: reward from Aurora II: Empowering (achievement 3489)
    // Requires 21 Xunlai Electrum Ingots (ID 46743), one per achievement bit location
    // Xunlai Electrum Ingot (ID 46743) crafted: 20 Silver Ingot + 10 Gold Ingot + 20 Platinum Ingot + 1 Lump of Mithrillium
    {
      name: 'Spark of Sentience', itemId: 81729, count: 1,
      source: 'collection', accountBound: true,
      achievementId: 3489, achievementBitCount: 21,
      note: 'Reward from Aurora II: Empowering (achievement) — requires 21 Xunlai Electrum Ingots infused at specific locations',
      inputs: [
        {
          name: 'Xunlai Electrum Ingot', itemId: 46743, count: 21,
          source: 'tp',
          note: 'Can buy from TP or craft: 20 Silver Ingot + 10 Gold Ingot + 20 Platinum Ingot + 1 Lump of Mithrillium',
          inputs: [
            { name: 'Silver Ingot',       itemId: 19687, count: 420, source: 'tp', inputs: [] },
            { name: 'Gold Ingot',         itemId: 19682, count: 210, source: 'tp', inputs: [] },
            { name: 'Platinum Ingot',     itemId: 19686, count: 420, source: 'tp', inputs: [] },
            { name: 'Lump of Mithrillium',itemId: 46742, count: 21,  source: 'tp',
              note: 'Time-gated — 1/day crafted from 50 Mithril Ingot + 1 Glob of Ectoplasm + 10 Thermocatalytic Reagent',
              inputs: [
                { name: 'Mithril Ingot',            itemId: 19684, count: 1050, source: 'tp', inputs: [] },
                { name: 'Glob of Ectoplasm',         itemId: 19721, count: 21,   source: 'tp', inputs: [] },
                { name: 'Thermocatalytic Reagent',   itemId: 46747, count: 210,  source: 'tp', inputs: [] },
              ],
            },
          ],
        },
      ],
    },
    // Mystic Tribute [WIKI verified]: 2x Gift of Condensed Magic + 2x Gift of Condensed Might + 77 Mystic Clovers + 250 Mystic Coins
    {
      name: 'Mystic Tribute', itemId: 71820, count: 1,
      source: 'forge', accountBound: true,
      inputs: [
        { name: 'Gift of Condensed Magic', itemId: 76530, count: 2, source: 'forge', accountBound: true,
          inputs: [
            { name: 'Gift of Blood', itemId: 71655, count: 1, source: 'forge', accountBound: true, inputs: [
              { name: 'Vial of Powerful Blood', itemId: 24295, count: 100, source: 'tp', inputs: [] },
              { name: 'Vial of Potent Blood',   itemId: 24294, count: 250, source: 'tp', inputs: [] },
              { name: 'Vial of Thick Blood',    itemId: 24293, count: 50,  source: 'tp', inputs: [] },
              { name: 'Vial of Blood',          itemId: 24292, count: 50,  source: 'tp', inputs: [] },
            ]},
            { name: 'Gift of Venom',  itemId: 71787, count: 1, source: 'forge', accountBound: true, inputs: [
              { name: 'Powerful Venom Sac', itemId: 24283, count: 100, source: 'tp', inputs: [] },
              { name: 'Potent Venom Sac',   itemId: 24282, count: 250, source: 'tp', inputs: [] },
              { name: 'Full Venom Sac',     itemId: 24281, count: 50,  source: 'tp', inputs: [] },
              { name: 'Venom Sac',          itemId: 24280, count: 50,  source: 'tp', inputs: [] },
            ]},
            { name: 'Gift of Totems', itemId: 73236, count: 1, source: 'forge', accountBound: true, inputs: [
              { name: 'Elaborate Totem', itemId: 24300, count: 100, source: 'tp', inputs: [] },
              { name: 'Intricate Totem', itemId: 24299, count: 250, source: 'tp', inputs: [] },
              { name: 'Engraved Totem',  itemId: 24363, count: 50,  source: 'tp', inputs: [] },
              { name: 'Totem',           itemId: 24298, count: 50,  source: 'tp', inputs: [] },
            ]},
            { name: 'Gift of Dust',   itemId: 73196, count: 1, source: 'forge', accountBound: true, inputs: [
              { name: 'Pile of Crystalline Dust',  itemId: 24277, count: 100, source: 'tp', inputs: [] },
              { name: 'Pile of Incandescent Dust', itemId: 24276, count: 250, source: 'tp', inputs: [] },
              { name: 'Pile of Luminous Dust',     itemId: 24275, count: 50,  source: 'tp', inputs: [] },
              { name: 'Pile of Radiant Dust',      itemId: 24274, count: 50,  source: 'tp', inputs: [] },
            ]},
          ],
        },
        { name: 'Gift of Condensed Might', itemId: 70867, count: 2, source: 'forge', accountBound: true,
          inputs: [
            { name: 'Gift of Claws',  itemId: 70801, count: 1, source: 'forge', accountBound: true, inputs: [
              { name: 'Vicious Claw', itemId: 24351, count: 100, source: 'tp', inputs: [] },
              { name: 'Large Claw',   itemId: 24350, count: 250, source: 'tp', inputs: [] },
              { name: 'Sharp Claw',   itemId: 24349, count: 50,  source: 'tp', inputs: [] },
              { name: 'Claw',         itemId: 24348, count: 50,  source: 'tp', inputs: [] },
            ]},
            { name: 'Gift of Scales', itemId: 75299, count: 1, source: 'forge', accountBound: true, inputs: [
              { name: 'Armored Scale', itemId: 24289, count: 100, source: 'tp', inputs: [] },
              { name: 'Large Scale',   itemId: 24288, count: 250, source: 'tp', inputs: [] },
              { name: 'Smooth Scale',  itemId: 24287, count: 50,  source: 'tp', inputs: [] },
              { name: 'Scale',         itemId: 24286, count: 50,  source: 'tp', inputs: [] },
            ]},
            { name: 'Gift of Bones',  itemId: 71123, count: 1, source: 'forge', accountBound: true, inputs: [
              { name: 'Ancient Bone', itemId: 24358, count: 100, source: 'tp', inputs: [] },
              { name: 'Large Bone',   itemId: 24341, count: 250, source: 'tp', inputs: [] },
              { name: 'Heavy Bone',   itemId: 24345, count: 50,  source: 'tp', inputs: [] },
              { name: 'Bone',         itemId: 24344, count: 50,  source: 'tp', inputs: [] },
            ]},
            { name: 'Gift of Fangs',  itemId: 75744, count: 1, source: 'forge', accountBound: true, inputs: [
              { name: 'Vicious Fang', itemId: 24357, count: 100, source: 'tp', inputs: [] },
              { name: 'Large Fang',   itemId: 24356, count: 250, source: 'tp', inputs: [] },
              { name: 'Sharp Fang',   itemId: 24355, count: 50,  source: 'tp', inputs: [] },
              { name: 'Fang',         itemId: 24354, count: 50,  source: 'tp', inputs: [] },
            ]},
          ],
        },
        { name: 'Mystic Clover', itemId: 19675, count: 77,  source: 'tp', inputs: [] },
        { name: 'Mystic Coin',   itemId: 19976, count: 250, source: 'tp', inputs: [] },
      ],
    },
    // Gift of Sentience [WIKI verified]: Gift of Energy + Gift of the Mists + 100 Icy Runestones + Gift of Valor
    {
      name: 'Gift of Sentience', itemId: 81796, count: 1,
      source: 'forge', accountBound: true,
      inputs: [
        // Gift of Energy: 250 each of 4 dust tiers [API verified]
        { name: 'Gift of Energy', itemId: 19623, count: 1, source: 'forge', accountBound: true, inputs: [
          { name: 'Pile of Radiant Dust',      itemId: 24274, count: 250, source: 'tp', inputs: [] },
          { name: 'Pile of Luminous Dust',     itemId: 24275, count: 250, source: 'tp', inputs: [] },
          { name: 'Pile of Incandescent Dust', itemId: 24276, count: 250, source: 'tp', inputs: [] },
          { name: 'Pile of Crystalline Dust',  itemId: 24277, count: 250, source: 'tp', inputs: [] },
        ]},
        // Gift of the Mists: Battle + Glory + War + Cube of Stabilized Dark Energy
        { name: 'Gift of the Mists', itemId: 76427, count: 1, source: 'forge', accountBound: true, inputs: [
          { name: 'Gift of Battle', itemId: 19678, count: 1, source: 'wvw', accountBound: true,
            note: 'Reward from WvW Gift of Battle Reward Track', inputs: [] },
          { name: 'Gift of Glory', itemId: 70528, count: 1, source: 'currency',
            note: "Buy from Miyani for 250 Shard of Glory (from PvP)",
            inputs: [{ name: 'Shard of Glory', itemId: 70820, count: 250, source: 'tp', inputs: [] }] },
          { name: 'Gift of War', itemId: 71581, count: 1, source: 'currency',
            note: "Buy from Miyani for 250 Memory of Battle (from WvW)",
            inputs: [{ name: 'Memory of Battle', itemId: 71581, count: 250, source: 'wvw',
              note: 'Obtained from WvW participation and reward tracks', inputs: [] }] },
          { name: 'Cube of Stabilized Dark Energy', itemId: 73137, count: 1, source: 'craft', inputs: [
            { name: 'Ball of Dark Energy', itemId: 71994, count: 1, source: 'tp',
              note: "Salvage ascended equipment with Black Lion Salvage Kit", inputs: [] },
            { name: 'Stabilizing Matrix',  itemId: 73248, count: 75, source: 'tp', inputs: [] },
          ]},
        ]},
        // Icy Runestone: vendor only, 1g each
        { name: 'Icy Runestone', itemId: 19676, count: 100, source: 'vendor',
          note: '1 gold each from vendor', inputs: [] },
        // Gift of Valor: reward from Aurora: Awakening (achievement 3522, 7 bits)
        { name: 'Gift of Valor', itemId: 82008, count: 1,
          source: 'collection', accountBound: true,
          achievementId: 3522, achievementBitCount: 7,
          note: 'Reward from "Aurora: Awakening" achievement — collect 7 sentient items from LS3 maps',
          inputs: [] },
      ],
    },
    // Gift of Draconic Mastery [WIKI verified]
    {
      name: 'Gift of Draconic Mastery', itemId: 81861, count: 1,
      source: 'forge', accountBound: true,
      inputs: [
        // Crystalline Ingot: crafted (recipe 11358)
        { name: 'Crystalline Ingot', itemId: 46683, count: 1, source: 'tp',
          note: 'Can buy from TP or craft (recipe ID 11358)', inputs: [] },
        // Bloodstone Shard: 200 Spirit Shards from Miyani
        { name: 'Bloodstone Shard', itemId: 20797, count: 1, source: 'currency',
          note: 'Buy from Miyani for 200 Spirit Shards', inputs: [] },
        // Gift of Bloodstone Magic: buy from Miyani for LS3 map currencies
        { name: 'Gift of Bloodstone Magic', itemId: 81815, count: 1, source: 'currency',
          note: 'Buy from Miyani for 250 Blood Ruby + 250 Jade Shard + 250 Orrian Pearl',
          inputs: [
            { name: 'Blood Ruby',    itemId: 79280, count: 250, source: 'tp', note: 'LS3 map currency from Bloodstone Fen', inputs: [] },
            { name: 'Jade Shard',    itemId: 80332, count: 250, source: 'tp', note: 'LS3 map currency from Ember Bay', inputs: [] },
            { name: 'Orrian Pearl',  itemId: 81706, count: 250, source: 'tp', note: "LS3 map currency from Siren's Landing", inputs: [] },
          ],
        },
        // Gift of Dragon Magic: buy from Miyani for LS3 map currencies
        { name: 'Gift of Dragon Magic', itemId: 82036, count: 1, source: 'currency',
          note: 'Buy from Miyani for 250 Fire Orchid Blossom + 250 Fresh Winterberry + 250 Petrified Wood',
          inputs: [
            { name: 'Fire Orchid Blossom', itemId: 81127, count: 250, source: 'tp', note: 'LS3 map currency from Draconis Mons', inputs: [] },
            { name: 'Fresh Winterberry',   itemId: 79899, count: 250, source: 'tp', note: 'LS3 map currency from Bitterfrost Frontier', inputs: [] },
            { name: 'Petrified Wood',      itemId: 79469, count: 250, source: 'tp', note: 'LS3 map currency from Lake Doric', inputs: [] },
          ],
        },
      ],
    },
  ],
};

const VISION = {
  id: 'legendary_trinket_vision',
  name: 'Vision',
  itemId: null, idName: 'Vision',
  rarity: 'Legendary',
  category: 'trinket',
  trinketSlot: 'Accessory',
  generation: 2,
  expansion: 'Living World Season 4',
  note: 'Living World Season 4 legendary — requires all 6 LS4 maps + collection progression.',
  inputs: [
    acctBound('Vision I: Awakening', 'Vision I: Awakening', 1,
      'LS4 Episode 1 — Domain of Istan',
      []
    ),
    acctBound('Vision II: Empowering', 'Vision II: Empowering', 1,
      'LS4 Episodes 2–4 collection',
      []
    ),
    acctBound('Vision III: Transcendence', 'Vision III: Transcendence', 1,
      'LS4 Episodes 5–6 collection',
      [
        tp('Glob of Ectoplasm', 19721, null, 250),
        tp('Mystic Coin', 19976, null, 100),
        tp('Mystic Clover', 19675, null, 25),
      ]
    ),
  ],
};

const COALESCENCE = {
  id: 'legendary_trinket_coalescence',
  name: 'Coalescence',
  itemId: null, idName: 'Coalescence',
  rarity: 'Legendary',
  category: 'trinket',
  trinketSlot: 'Ring',
  generation: 1,
  expansion: 'Raids',
  note: 'Raid legendary ring — requires raid progression through all 4 wings + collections.',
  inputs: [
    acctBound('Coalescence I: Unbridled', 'Coalescence I: Unbridled', 1,
      'Raid wing collection — requires kills in W1–W4',
      []
    ),
    acctBound('Coalescence II: Strength', 'Coalescence II: Strength', 1,
      'Raid challenge mode collection',
      []
    ),
    acctBound('Coalescence III: Faith', 'Coalescence III: Faith', 1,
      'Final collection stage — raid progression + crafting',
      [
        tp('Glob of Ectoplasm', 19721, null, 250),
        tp('Mystic Coin', 19976, null, 100),
        tp('Mystic Clover', 19675, null, 25),
        tp('Legendary Insight', null, 'Legendary Insight', 150),
      ]
    ),
  ],
};

const PRISMATIC_REGALIA = {
  id: 'legendary_trinket_prismatic',
  name: "Prismatic Champion's Regalia",
  itemId: null, idName: "Prismatic Champion's Regalia",
  rarity: 'Legendary',
  category: 'trinket',
  trinketSlot: 'Amulet',
  generation: 1,
  expansion: 'PvP',
  note: 'PvP legendary amulet — requires PvP League Season participation + collection.',
  inputs: [
    acctBound("Prismatic Champion's Regalia I", "Prismatic Champion's Regalia I", 1,
      'PvP League collection stage 1',
      []
    ),
    acctBound("Prismatic Champion's Regalia II", "Prismatic Champion's Regalia II", 1,
      'PvP League collection stage 2',
      []
    ),
    acctBound("Prismatic Champion's Regalia III", "Prismatic Champion's Regalia III", 1,
      'PvP League collection stage 3 — requires Diamond rank + season tokens',
      [
        tp('Glob of Ectoplasm', 19721, null, 250),
        tp('Mystic Coin', 19976, null, 100),
      ]
    ),
  ],
};

// ── LEGENDARY RELIC ────────────────────────────────────────────────────────────

const RELIC_OF_NAYOS = {
  id: 'legendary_relic_nayos',
  name: 'Relic of Nayos',
  itemId: null, idName: 'Relic of Nayos',
  rarity: 'Legendary',
  category: 'relic',
  generation: 1,
  expansion: 'Secrets of the Obscure',
  note: 'Legendary relic — allows swapping relic effect freely. Requires SotO progression.',
  inputs: [
    acctBound('Relic of Nayos I', 'Relic of Nayos I', 1,
      'SotO collection stage 1 — Skywatch Archipelago + Amnytas map progression',
      []
    ),
    acctBound('Relic of Nayos II', 'Relic of Nayos II', 1,
      'SotO collection stage 2 — Wizard\'s Tower progression',
      []
    ),
    acctBound('Relic of Nayos III', 'Relic of Nayos III', 1,
      'Final stage — requires SotO masteries + crafted components',
      [
        tp('Glob of Ectoplasm', 19721, null, 250),
        tp('Mystic Coin', 19976, null, 100),
        tp('Mystic Clover', 19675, null, 25),
        { name: 'Rift Stabilizer', itemId: null, idName: 'Rift Stabilizer', count: 100, source: 'tp', note: 'From SotO rift hunting rewards or TP', inputs: [] },
      ]
    ),
  ],
};

// ── LEGENDARY RUNES (SotO) ────────────────────────────────────────────────────
// 6 legendary runes available — allow swapping rune bonuses freely
// All follow identical recipe: Legendary Rune Crafter's Kit + T6 mats + Ectos + Mystic Coins
// [INFERRED] — exact ingredients; follow the SotO rune pattern

function legendaryRune(name, idName) {
  return {
    id: `legendary_rune_${idName.replace(/\s+/g,'_').toLowerCase()}`,
    name,
    itemId: null, idName,
    rarity: 'Legendary',
    category: 'rune',
    generation: 1,
    expansion: 'Secrets of the Obscure',
    note: 'Legendary rune — allows free rune swap. Requires SotO progression.',
    inputs: [
      acctBound('Legendary Rune Collection', null, 1,
        'Complete the Secrets of the Obscure rune collection chain',
        []
      ),
      tp('Glob of Ectoplasm', 19721, null, 250),
      tp('Mystic Coin', 19976, null, 100),
      tp('Mystic Clover', 19675, null, 25),
      { name: 'Rift Stabilizer', itemId: null, idName: 'Rift Stabilizer', count: 50, source: 'tp', note: 'SotO rift hunting or TP', inputs: [] },
    ],
  };
}

const LEGENDARY_RUNES = [
  legendaryRune('Legendary Rune of the Adventurer', 'Legendary Rune of the Adventurer'),
  legendaryRune('Legendary Rune of the Afflicted',  'Legendary Rune of the Afflicted'),
  legendaryRune('Legendary Rune of the Air',         'Legendary Rune of the Air'),
  legendaryRune('Legendary Rune of the Aristocracy', 'Legendary Rune of the Aristocracy'),
  legendaryRune('Legendary Rune of the Baelfire',    'Legendary Rune of the Baelfire'),
  legendaryRune('Legendary Rune of the Centaur',     'Legendary Rune of the Centaur'),
];

// ── LEGENDARY SIGILS (SotO) ───────────────────────────────────────────────────
// Legendary sigils — allow free sigil swap
// [INFERRED] same structure as runes

function legendarySigil(name, idName) {
  return {
    id: `legendary_sigil_${idName.replace(/\s+/g,'_').toLowerCase()}`,
    name,
    itemId: null, idName,
    rarity: 'Legendary',
    category: 'sigil',
    generation: 1,
    expansion: 'Secrets of the Obscure',
    note: 'Legendary sigil — allows free sigil swap. Requires SotO progression.',
    inputs: [
      acctBound('Legendary Sigil Collection', null, 1,
        'Complete the Secrets of the Obscure sigil collection chain',
        []
      ),
      tp('Glob of Ectoplasm', 19721, null, 250),
      tp('Mystic Coin', 19976, null, 100),
      tp('Mystic Clover', 19675, null, 25),
      { name: 'Rift Stabilizer', itemId: null, idName: 'Rift Stabilizer', count: 50, source: 'tp', note: 'SotO rift hunting or TP', inputs: [] },
    ],
  };
}

const LEGENDARY_SIGILS = [
  legendarySigil('Legendary Sigil of Air',          'Legendary Sigil of Air'),
  legendarySigil('Legendary Sigil of Battle',        'Legendary Sigil of Battle'),
  legendarySigil('Legendary Sigil of Bloodlust',     'Legendary Sigil of Bloodlust'),
  legendarySigil('Legendary Sigil of Cleansing',     'Legendary Sigil of Cleansing'),
  legendarySigil('Legendary Sigil of Demon Summoning','Legendary Sigil of Demon Summoning'),
  legendarySigil('Legendary Sigil of Energy',        'Legendary Sigil of Energy'),
];

export const LEGENDARY_OTHER_RECIPES = {
  backItems: [AD_INFINITUM, WARBRINGER],
  trinkets: [AURORA, VISION, COALESCENCE, PRISMATIC_REGALIA],
  relics: [RELIC_OF_NAYOS],
  runes: LEGENDARY_RUNES,
  sigils: LEGENDARY_SIGILS,
};

export const LEGENDARY_OTHER_CATEGORIES = ['Back Items', 'Trinkets', 'Relics', 'Runes', 'Sigils'];
