/**
 * Legendary back items, trinkets, relic, rune and sigil — REBUILT Oct 2026.
 *
 * Item IDs come from the GW2 API's /v2/legendaryarmory list; recipes from the wiki
 * (Mystic Forge recipes are not in the API). Entries whose deeper levels could not be
 * fully confirmed carry dataStatus: 'partial' and say what is unverified in their note.
 *
 * Replaces the previous placeholder data (six named "Legendary Rune of …" / "Legendary
 * Sigil of …" items and a "Relic of Nayos" that do not exist — the game has ONE
 * Legendary Rune, ONE Legendary Sigil and ONE Legendary Relic, each fully selectable).
 * Aurora is kept exactly as hand-built in legendary-data-other.js.
 */
import { MYSTIC_TRIBUTE, GIFT_OF_ENERGY } from "./legendary-data.js";
import { GIFT_OF_THE_MISTS, GIFT_OF_MAGUUMA_MASTERY } from "./legendary-data-gen2.js";
import { GIFT_OF_RESEARCH, DRACONIC_TRIBUTE } from "./legendary-data-gen3.js";
import { GIFT_OF_CRAFTSMANSHIP } from "./legendary-data-armor.js";
import { GIFT_OF_THE_SURVIVORS, GIFT_OF_THE_PEOPLE } from "./legendary-data-voe-gifts.js";

const CONDENSED_MAGIC = { ...MYSTIC_TRIBUTE.inputs.find(i => i.name === 'Gift of Condensed Magic'), count: 1 };
const CONDENSED_MIGHT = { ...MYSTIC_TRIBUTE.inputs.find(i => i.name === 'Gift of Condensed Might'), count: 1 };
const CUBE = GIFT_OF_THE_MISTS.inputs.find(i => i.name === 'Cube of Stabilized Dark Energy');

const tp = (itemId, name, count, note) => ({ itemId, name, count, source: 'tp', ...(note ? { note } : {}), inputs: [] });
const named = (name, count, source, note, inputs = []) => ({ itemId: null, idName: name, name, count, source, accountBound: true, note, inputs });
const ach = (name, note) => named(name, 1, 'collection', note);
// Explicit-ID node (Oct 2026 pass 3: every ID from the wiki infobox, confirmed against /v2/items)
const item = (itemId, name, count, source, note, inputs = []) => ({ itemId, name, count, source, accountBound: source !== 'tp', ...(note ? { note } : {}), inputs });
const GIFT_OF_BATTLE = item(19678, 'Gift of Battle', 1, 'wvw', 'WvW Gift of Battle reward track');
// ── Shared leaf helpers (pass 3) ──
const gold = (n) => ({ itemId: null, name: 'Gold', count: n, source: 'vendor', vendorPrice: 10000, accountBound: true, note: 'Coin paid to the vendor', inputs: [] });
const karma = (n) => ({ itemId: null, name: 'Karma', count: n, source: 'karma', accountBound: true, inputs: [] });
const cur = (name, n, note) => ({ itemId: null, name, count: n, source: 'currency', accountBound: true, ...(note ? { note } : {}), inputs: [] });
const vendor = (itemId, name, count, note, inputs) => item(itemId, name, count, 'vendor', note, inputs);
const forgeItem = (itemId, name, count, note, inputs) => item(itemId, name, count, 'forge', note, inputs);
const extraCopy = (gp) => `extra copies: ${gp} gold + 300,000 Karma`;
const shardOfGlory = (n) => tp(70820, 'Shard of Glory', n);
const clover = (n) => tp(19675, 'Mystic Clover', n);
const ecto = (n) => tp(19721, 'Glob of Ectoplasm', n);
const obsidian = (n) => ({ itemId: 19925, name: 'Obsidian Shard', count: n, source: 'karma', note: '1,050 Karma each', inputs: [] });
const BLOODSTONE = { itemId: 20797, name: 'Bloodstone Shard', count: 1, source: 'spirit_shard', accountBound: true, note: '200 Spirit Shards from Miyani', inputs: [] };
const VISION_CRYSTAL = { itemId: 46746, name: 'Vision Crystal', count: 1, source: 'forge', accountBound: true,
  note: 'Crafted (Artificer, Weaponsmith, Huntsman 400+): 5 Dragonite Ingot + 5 Empyreal Star + Augur’s Stone + 5 Bloodstone Brick',
  inputs: [
    { itemId: 46732, name: 'Dragonite Ingot', count: 5, source: 'currency', accountBound: true, note: 'Refined from Dragonite Ore', inputs: [] },
    { itemId: 46734, name: 'Empyreal Star', count: 5, source: 'currency', accountBound: true, note: 'Refined from Empyreal Fragments', inputs: [] },
    { itemId: 46752, name: "Augur's Stone", count: 1, source: 'spirit_shard', accountBound: true, note: '20 Spirit Shards from Miyani', inputs: [] },
    { itemId: 46730, name: 'Bloodstone Brick', count: 5, source: 'forge', accountBound: true, note: 'Crafted (450): 100 Pile of Bloodstone Dust + 2 Obsidian Shard + 10 Thermocatalytic Reagent',
      inputs: [
        { itemId: 46731, name: 'Pile of Bloodstone Dust', count: 100, source: 'currency', accountBound: true, note: 'Salvaged from ascended gear / fractal rewards', inputs: [] },
        { itemId: 19925, name: 'Obsidian Shard', count: 2, source: 'karma', note: '1,050 Karma each', inputs: [] },
        { itemId: 46747, name: 'Thermocatalytic Reagent', count: 10, source: 'vendor', note: '1s 50c from master craftsmen', inputs: [] },
      ] },
  ] };

// Gen 1 Gift of Fortune (77 Clover + 250 Ecto + Gift of Might + Gift of Magic) — same as the weapons
const GIFT_OF_FORTUNE = {
  itemId: 19626, name: 'Gift of Fortune', count: 1, source: 'forge', accountBound: true,
  note: 'Mystic Forge: 77 Mystic Clover + 250 Glob of Ectoplasm + Gift of Might + Gift of Magic',
  inputs: [
    clover(77), ecto(250),
    { itemId: 19672, name: 'Gift of Might', count: 1, source: 'forge', accountBound: true, inputs: [
      tp(24357, 'Vicious Fang', 250), tp(24289, 'Armored Scale', 250), tp(24351, 'Vicious Claw', 250), tp(24358, 'Ancient Bone', 250) ] },
    { itemId: 19673, name: 'Gift of Magic', count: 1, source: 'forge', accountBound: true, inputs: [
      tp(24295, 'Vial of Powerful Blood', 250), tp(24283, 'Powerful Venom Sac', 250), tp(24300, 'Elaborate Totem', 250), tp(24277, 'Pile of Crystalline Dust', 250) ] },
  ],
};

// ── BACK ITEMS ─────────────────────────────────────────────────────────────────
const AD_INFINITUM = {
  id: 'legendary_back_ad_infinitum', name: 'Ad Infinitum', itemId: 74155,
  rarity: 'Legendary', category: 'back', generation: 1, badge: 'Fractals', expansion: 'Fractals',
  note: 'Mystic Forge: Unbound + Gift of Infinity + Gift of Fortune + Gift of Ascension [wiki verified Oct 2026]',
  inputs: [
    named('Unbound', 1, 'collection', 'Precursor — crafted through the Ad Infinitum collections (Upper Bound → Unbound)', [
      ach('Solution: Unbound', 'Fractal collection item'),
      named('Pristine Mist Essence', 5, 'forge', 'Each: 10 Rare Essence of Luck + 1 Cube of Stabilized Dark Energy + 10 Thermocatalytic Reagent (wiki total for 5: 50 / 5 / 50)', [
        named('Rare Essence of Luck', 10, 'currency', 'Salvaged from rare gear'), { ...CUBE }, tp(46747, 'Thermocatalytic Reagent', 10) ]),
      named('Unbound Wings', 1, 'forge', '25 Ecto + 5 Shard of Crystallized Mists Essence + Vision Crystal + Spirit of the Upper Bound', [
        ecto(25), named('Shard of Crystallized Mists Essence', 5, 'currency', 'Fractal reward'), { ...VISION_CRYSTAL },
        ach('Spirit of the Upper Bound', 'Salvaged from Upper Bound') ]),
      named('Third Order Mist Frame', 1, 'forge', '5 each of Spiritwood Plank, Deldrimor Steel Ingot, Elonian Leather Square, Bolt of Damask', [
        tp(46736, 'Spiritwood Plank', 5), tp(46738, 'Deldrimor Steel Ingot', 5), tp(46739, 'Elonian Leather Square', 5),
        { itemId: null, idName: 'Bolt of Damask', name: 'Bolt of Damask', count: 5, source: 'tp', inputs: [] } ]),
    ]),
    ach('Gift of Infinity', 'Reward from the "Legendary Backpack: Ad Infinitum" achievement'),
    { ...GIFT_OF_FORTUNE },
    named('Gift of Ascension', 1, 'currency', 'Bought for 500 Fractal Relics + 25s 20c'),
  ],
};

const mysticEssence = (itemId, name, t6, t5, special, essence) => item(itemId, name, 1, 'forge',
  `Mystic Forge: 20 ${t6[1]} + 50 ${t5[1]} + ${special[2]} ${special[1]} + ${essence[1]}`, [
    tp(t6[0], t6[1], 20), tp(t5[0], t5[1], 50),
    item(special[0], special[1], special[2], 'currency', special[3]),
    item(essence[0], essence[1], 1, 'currency', essence[2]),
  ]);
const WARBRINGER = {
  id: 'legendary_back_warbringer', name: 'Warbringer', itemId: 81462,
  rarity: 'Legendary', category: 'back', generation: 2, badge: 'WvW', expansion: 'WvW',
  note: 'Mystic Forge: Warcry + Gift of Warfare + Gift of Fortune + Gift of Conquering [wiki verified Oct 2026]',
  inputs: [
    item(81467, 'Warcry', 1, 'forge', 'Precursor — Mystic Forge: the four Wings of War backpacks (Legendary Commander War Razor / Retired Commander Burn Razor, WvW)', [
      item(81455, "Recruit's Wings of War", 1, 'currency', '350 WvW Skirmish Claim Tickets — needs WvW rank 50'),
      item(81356, "Soldier's Wings of War", 1, 'currency', '525 WvW Skirmish Claim Tickets — needs WvW rank 100'),
      item(81288, "General's Wings of War", 1, 'currency', '700 WvW Skirmish Claim Tickets — needs WvW rank 200'),
      item(81294, "Commander's Wings of War", 1, 'currency', '875 WvW Skirmish Claim Tickets — needs WvW rank 350 and a commander tag'),
    ]),
    item(81478, 'Gift of Warfare', 1, 'forge', 'Mystic Forge: Mystic Essence of Strategy + Animosity + Carnage + Annihilation', [
      mysticEssence(81319, 'Mystic Essence of Strategy', [24295, 'Vial of Powerful Blood'], [24294, 'Vial of Potent Blood'],
        [46731, 'Pile of Bloodstone Dust', 250, 'Salvaged from ascended gear / fractal rewards'], [81326, 'Essence of Strategy', '1,000 Badges of Honor (WvW Commander vendors)']),
      mysticEssence(81494, 'Mystic Essence of Animosity', [24358, 'Ancient Bone'], [24341, 'Large Bone'],
        [46735, 'Empyreal Fragment', 250, 'Chests / WvW Tournament Claim Tickets'], [81522, 'Essence of Animosity', '500 Proof of Heroics (or another Testimony of Heroics)']),
      mysticEssence(81449, 'Mystic Essence of Carnage', [24289, 'Armored Scale'], [24288, 'Large Scale'],
        [46733, 'Dragonite Ore', 250, 'World bosses / WvW'], [81469, 'Essence of Carnage', '500 Memory of Battle']),
      mysticEssence(81407, 'Mystic Essence of Annihilation', [24351, 'Vicious Claw'], [24350, 'Large Claw'],
        [46681, 'Glob of Dark Matter', 10, 'Salvaged from exotic / ascended gear'], [81320, 'Essence of Annihilation', '350 WvW Skirmish Claim Tickets']),
    ]),
    { ...GIFT_OF_FORTUNE },
    item(81371, 'Gift of Conquering', 1, 'forge', 'Mystic Forge: Legendary Spike + 4 Gift of Battle + 250 Memory of Battle + 2 Vision Crystal', [
      item(81296, 'Legendary Spike', 1, 'wvw', 'Random drop from enemy players and NPCs in WvW'),
      { ...GIFT_OF_BATTLE, count: 4 },
      tp(71581, 'Memory of Battle', 250),
      { ...VISION_CRYSTAL, count: 2 },
    ]),
  ],
};

const THE_ASCENSION = {
  id: 'legendary_back_ascension', name: 'The Ascension', itemId: 77474,
  rarity: 'Legendary', category: 'back', generation: 2, badge: 'PvP', expansion: 'PvP',
  note: 'Mystic Forge: Wings of Ascension + Gift of the Competitor + Gift of Fortune + Gift of Skirmishing [wiki verified Oct 2026]',
  inputs: [
    item(77536, 'Wings of Ascension', 1, 'forge', "Precursor — Mystic Forge: the four Wings of Glory backpacks (League Vendor)", [
      item(77507, "Recruit's Wings of Glory", 1, 'currency', '10 PvP League Tickets'),
      item(77522, "Veteran's Wings of Glory", 1, 'currency', '20 PvP League Tickets'),
      item(77477, "Champion's Wings of Glory", 1, 'currency', '30 PvP League Tickets'),
      item(77503, "Elite's Wings of Glory", 1, 'currency', '40 PvP League Tickets'),
    ]),
    item(77509, 'Gift of the Competitor', 1, 'forge', 'Mystic Forge: the four PvP collection rewards', [
      item(77493, 'The Thrill of Battle', 1, 'collection', 'PvP collection reward'),
      item(77497, 'Tapestry of Sacrifice', 1, 'collection', 'PvP collection reward'),
      item(77538, 'Monument of Legends', 1, 'collection', 'PvP collection reward'),
      item(77548, 'Hymn of Glory', 1, 'collection', 'PvP collection reward'),
    ]),
    { ...GIFT_OF_FORTUNE },
    item(77485, 'Gift of Skirmishing', 1, 'forge', 'Mystic Forge: 2 Vision Crystal + 250 Shard of Glory + 5 Certificate of Support + Perfect Mist Core', [
      { ...VISION_CRYSTAL, count: 2 }, tp(70820, 'Shard of Glory', 250),
      item(77486, 'Certificate of Support', 5, 'currency', '5 PvP League Tickets each'),
      item(77520, 'Perfect Mist Core', 1, 'currency', 'Combine four Mist Core Fragments (PvP reward tracks)'),
    ]),
  ],
};

const mapGiftJW = (itemId, name, map, cost) => item(itemId, name, 1, 'exploration', `${map} map completion reward (or buy: ${cost})`);
const ORRAX_MANIFESTED = {
  id: 'legendary_back_orrax', name: 'Orrax Manifested', itemId: 104857,
  rarity: 'Legendary', category: 'back', generation: 3, badge: 'Janthir Wilds', expansion: 'Janthir Wilds',
  note: 'Mystic Forge: Gift of the Mistburned Isles + Gift of Shadows + Gift of the Feast + Orrax Contained [wiki verified Oct 2026]',
  inputs: [
    forgeItem(104962, 'Gift of the Mistburned Isles', 1, 'Mystic Forge: Gift of the Mursaat Ruins + Gift of Janthir Wanderlust + 250 Mursaat Runestone + 250 Mystic Runestone', [
      forgeItem(104763, 'Gift of the Mursaat Ruins', 1, 'Mystic Forge: 100 Vial of Titan Melted Liquid Obsidian + 50 Mists Gate Residue + 100 Shard of Mistburned Barrens + 100 Shard of Bava Nisos', [
        tp(104229, 'Vial of Titan Melted Liquid Obsidian', 100), tp(105004, 'Mists Gate Residue', 50),
        tp(104282, 'Shard of Mistburned Barrens', 100), tp(104855, 'Shard of Bava Nisos', 100),
      ]),
      forgeItem(104699, 'Gift of Janthir Wanderlust', 1, 'Mystic Forge: the four Janthir Wilds map gifts', [
        mapGiftJW(102929, 'Gift of Lowland Shore', 'Lowland Shore', '100 Curious Lowland Honeycomb + 15 renown tokens + 2,000 Ursus Oblige + 51,000 Karma + 250 Ancient Coin'),
        mapGiftJW(102958, 'Gift of Janthir Syntri', 'Janthir Syntri', '100 Curious Mursaat Currency + 15 renown tokens + 2,000 Ursus Oblige + 51,000 Karma + 250 Ancient Coin'),
        mapGiftJW(104313, 'Gift of Mistburned Barrens', 'Mistburned Barrens', '100 Curious Mursaat Ruin Shard + 2 Vial of Titan Melted Liquid Obsidian + 2,000 Ursus Oblige + 51,000 Karma + 250 Ancient Coin'),
        mapGiftJW(104896, 'Gift of Bava Nisos', 'Bava Nisos', '125 Curious Mursaat Remnants + 2,500 Ursus Oblige + 51,000 Karma + 250 Ancient Coin'),
      ]),
      tp(103351, 'Mursaat Runestone', 250),
      vendor(79418, 'Mystic Runestone', 250, '1 gold each'),
    ]),
    forgeItem(104846, 'Gift of Shadows', 1, 'Mystic Forge: Gift of Darkness + Gift of Scales + Gift of Titan Understanding + Bloodstone Shard', [
      item(19631, 'Gift of Darkness', 1, 'craft', 'Crafted (Armorsmith 400): Gift of Ascalon + 250 Orichalcum Ingot + 250 Cured Hardened Leather Square + 100 Onyx Lodestone', [
        item(19664, 'Gift of Ascalon', 1, 'currency', '500 Tales of Dungeon Delving (Ascalonian Catacombs vendor)'),
        tp(19685, 'Orichalcum Ingot', 250), tp(19737, 'Cured Hardened Leather Square', 250), tp(24310, 'Onyx Lodestone', 100),
      ]),
      item(75299, 'Gift of Scales', 1, 'craft', 'Crafted (Artificer / Huntsman / Weaponsmith 400)', [
        tp(24289, 'Armored Scale', 100), tp(24288, 'Large Scale', 250), tp(24287, 'Smooth Scale', 50), tp(24286, 'Scale', 50),
      ]),
      item(104791, 'Gift of Titan Understanding', 1, 'currency', 'Kodan Landspeaker / Ward Trader Sampaguita: 25 Curious Mursaat Ruin Shard + 25 Curious Mursaat Remnants + 25 Amalgamated Rift Essence + 1,250 Ursus Oblige'),
      { ...BLOODSTONE },
    ]),
    forgeItem(104872, 'Gift of the Feast', 1, 'Mystic Forge: Gift of the Appetizer + Gift of the Entrée + Gift of the Side Course + Gift of the Dessert', [
      forgeItem(104965, 'Gift of the Appetizer', 1, 'Mystic Forge', [
        tp(87076, 'Bowl of Poultry Satay', 200), tp(84550, 'Red-Lentil Saobosa', 100),
        { ...item(41563, 'Spicy Marinated Mushroom', 50, 'craft', 'Crafted (Chef 400) — also on the TP', [
          tp(12279, 'Grilled Mushroom', 5), tp(12283, 'Grilled Portobello Mushroom', 10), tp(12504, 'Cayenne Pepper', 3), tp(12544, 'Ghost Pepper', 5) ]), accountBound: false },
        tp(104844, 'Fruit of the Shadow', 5),
      ]),
      forgeItem(104932, 'Gift of the Entrée', 1, 'Mystic Forge', [
        tp(12468, 'Plate of Orrian Steak Frittes', 200), tp(12467, 'Plate of Truffle Steak', 100),
        { ...item(41567, 'Plate of Spicy Herbed Chicken', 50, 'craft', 'Crafted (Chef 400) — also on the TP', [
          tp(12528, 'Bowl of Fancy Tangy Sautee Mix', 1), tp(12544, 'Ghost Pepper', 5),
          tp(24360, 'Slab of Poultry Meat', 3), tp(41572, 'Pile of Zesty Herbs', 1) ]), accountBound: false },
        tp(104844, 'Fruit of the Shadow', 5),
      ]),
      forgeItem(104839, 'Gift of the Side Course', 1, 'Mystic Forge', [
        { ...item(95942, 'Meaty Asparagus Skewer', 200, 'craft', 'Crafted (Chef 400) — also on the TP', [
          tp(24359, 'Slab of Red Meat', 1), tp(12505, 'Asparagus Spear', 2), tp(8576, 'Bottle of Rice Wine', 1), tp(12271, 'Bottle of Soy Sauce', 1) ]), accountBound: false },
        tp(66529, 'Bowl of Black Pepper Cactus Salad', 100), clover(30), tp(104844, 'Fruit of the Shadow', 5),
      ]),
      forgeItem(104717, 'Gift of the Dessert', 1, 'Mystic Forge', [
        tp(66539, 'Bowl of Prickly Pear Sorbet', 200), tp(71826, 'Bowl of Passion Fruit Tapioca Pudding', 50),
        item(100930, 'Amalgamated Rift Essence', 2, 'craft', 'Crafted (any discipline 400): 250 Fine + 100 Masterwork + 50 Rare Rift Essence + 50 Glob of Ectoplasm', [
          cur('Fine Rift Essence', 250, 'Rift hunting'), cur('Masterwork Rift Essence', 100, 'Rift hunting (tier 2)'), cur('Rare Rift Essence', 50, 'Rift hunting (tier 3)'), ecto(50) ]),
        tp(104844, 'Fruit of the Shadow', 5),
      ]),
    ]),
    forgeItem(104690, 'Orrax Contained', 1, 'Precursor — Mystic Forge: Binding of the Dragon + Draconic Tribute + Salmon of Knowledge Backpiece + Askur Camping Cookout Backpiece (Remnant versions also accepted)', [
      item(104777, 'Binding of the Dragon', 1, 'collection', 'Achievement reward (or 5 gold + 25 Dragonite Ore + 22,500 Karma from Gharr Leadclaw)'),
      { ...DRACONIC_TRIBUTE },
      item(102367, 'Salmon of Knowledge Backpiece', 1, 'collection', 'Janthir Wilds achievement reward'),
      item(104704, 'Askur Camping Cookout Backpiece', 1, 'collection', 'Janthir Wilds achievement reward'),
    ]),
  ],
};

// ── TRINKETS ──────────────────────────────────────────────────────────────────
const COALESCENCE = {
  id: 'legendary_trinket_coalescence', name: 'Coalescence', itemId: 91234,
  rarity: 'Legendary', category: 'trinket', trinketSlot: 'Ring', generation: 2, badge: 'Raids', expansion: 'Raids',
  note: 'Mystic Forge: Hateful Sworl + Gift of Patience + Mystic Tribute + Gift of Compassion [wiki verified Oct 2026]',
  inputs: [
    ach('Hateful Sworl', 'Reward from Coalescence I: Unbridled'),
    ach('Gift of Patience', 'Reward from Coalescence III: Culmination'),
    { ...MYSTIC_TRIBUTE },
    named('Gift of Compassion', 1, 'forge', 'Gift of Desert Mastery + 6 Ball of Dark Energy + Gift of Complex Emotions + 150 Legendary Insight', [
      forgeItem(86036, 'Gift of Desert Mastery', 1, 'Mystic Forge: Gift of the Desert + Gift of the Rider + Bloodstone Shard + 250 Funerary Incense [wiki verified Oct 2026]', [
        forgeItem(85631, 'Gift of the Desert', 1, 'Mystic Forge: the four Path of Fire region gifts (23,331 Karma each from PoF heart vendors)', [
          vendor(85961, 'Gift of the Oasis', 1, 'Priestess Karima: 23,331 Karma', [ karma(23331) ]),
          vendor(86018, 'Gift of the Highlands', 1, 'Melilla / Tendaji: 23,331 Karma', [ karma(23331) ]),
          vendor(86241, 'Gift of the Riverlands', 1, 'Follower Xunn: 23,331 Karma', [ karma(23331) ]),
          vendor(86010, 'Gift of the Desolation', 1, 'Kisha Odili: 23,331 Karma', [ karma(23331) ]),
        ]),
        forgeItem(86330, 'Gift of the Rider', 1, 'Mystic Forge: the four mount spirits (75 Elegy Mosaic each, after maxing that mount’s mastery)', [
          vendor(85707, 'Spirit of the Raptor', 1, 'Aksim: 75 Elegy Mosaic', [ cur('Elegy Mosaic', 75) ]),
          vendor(85681, 'Spirit of the Springer', 1, 'Stablemaster Unja: 75 Elegy Mosaic', [ cur('Elegy Mosaic', 75) ]),
          vendor(86115, 'Spirit of the Skimmer', 1, 'Skimmer Trainer Ardra: 75 Elegy Mosaic', [ cur('Elegy Mosaic', 75) ]),
          vendor(86177, 'Spirit of the Jackal', 1, 'Drojkor: 75 Elegy Mosaic', [ cur('Elegy Mosaic', 75) ]),
        ]),
        { ...BLOODSTONE },
        vendor(86093, 'Funerary Incense', 250, 'Each: 3 Elegy Mosaic (or 5 Trade Contract) + Amalgamated Gemstone + Obsidian Shard + Glob of Ectoplasm', [
          cur('Elegy Mosaic', 3), tp(68063, 'Amalgamated Gemstone', 1), obsidian(1), ecto(1) ]),
      ]),
      item(71994, 'Ball of Dark Energy', 6, 'currency', 'Salvaged from ascended gear'),
      named('Gift of Complex Emotions', 1, 'collection', 'Coalescence collection reward'),
      cur('Legendary Insight', 150, 'Raid / Strike reward currency'),
    ]),
  ],
};

const VISION = {
  id: 'legendary_trinket_vision', name: 'Vision', itemId: 91048,
  rarity: 'Legendary', category: 'trinket', trinketSlot: 'Accessory', generation: 2, badge: 'LS4', expansion: 'Living World Season 4',
  note: 'Mystic Forge: Glimpse + Mystic Tribute + Gift of Prescience + Gift of Arid Mastery [wiki verified Oct 2026]',
  inputs: [
    { ...item(91035, 'Glimpse', 1, 'collection', 'Precursor — reward from the Vision II: Farsight collection'), achievementName: 'Vision II: Farsight' },
    { ...MYSTIC_TRIBUTE },
    forgeItem(90985, 'Gift of Prescience', 1, 'Mystic Forge: Gift of Energy + Gift of the Mists + 100 Icy Runestone + Shattered Gift of Prescience', [
      { ...GIFT_OF_ENERGY }, { ...GIFT_OF_THE_MISTS },
      vendor(19676, 'Icy Runestone', 100, '1 gold each (Miyani / Mystic Forge Attendant)'),
      { ...item(91010, 'Shattered Gift of Prescience', 1, 'collection', 'Reward from the Vision I: Awakening collection'), achievementName: 'Vision I: Awakening' },
    ]),
    forgeItem(91041, 'Gift of Arid Mastery', 1, 'Mystic Forge: 100 Funerary Incense + Bloodstone Shard + Gift of Crystalline Magic + Gift of Ephemeral Magic', [
      vendor(86093, 'Funerary Incense', 100, 'Each: 3 Elegy Mosaic (or 5 Trade Contract) + Amalgamated Gemstone + Obsidian Shard + Glob of Ectoplasm (Primeval Steward / Amusement Adjunct Cagri)', [
        cur('Elegy Mosaic', 3), tp(68063, 'Amalgamated Gemstone', 1), obsidian(1), ecto(1) ]),
      { ...BLOODSTONE },
      forgeItem(91124, 'Gift of Crystalline Magic', 1, 'Mystic Forge: 100 each of Kralkatite Ore, Difluorite Crystal, Inscribed Shard + Bottle of Elonian Wine', [
        item(86069, 'Kralkatite Ore', 100, 'currency', 'Living World Season 4 map currency'),
        item(86977, 'Difluorite Crystal', 100, 'currency', 'Living World Season 4 map currency'),
        item(87645, 'Inscribed Shard', 100, 'currency', 'Living World Season 4 map currency'),
        tp(19663, 'Bottle of Elonian Wine', 1),
      ]),
      forgeItem(91112, 'Gift of Ephemeral Magic', 1, 'Mystic Forge: 100 each of Lump of Mistonium, Branded Mass, Mistborn Mote + Bottle of Elonian Wine', [
        item(88955, 'Lump of Mistonium', 100, 'currency', 'Living World Season 4 map currency'),
        item(89537, 'Branded Mass', 100, 'currency', 'Living World Season 4 map currency'),
        item(90783, 'Mistborn Mote', 100, 'currency', 'Living World Season 4 map currency'),
        tp(19663, 'Bottle of Elonian Wine', 1),
      ]),
    ]),
  ],
};

const PRISMATIC_REGALIA = {
  id: 'legendary_trinket_prismatic', name: "Prismatic Champion's Regalia", itemId: 95380,
  rarity: 'Legendary', category: 'trinket', trinketSlot: 'Amulet', generation: 2, badge: 'IBS', expansion: 'The Icebrood Saga',
  note: 'Not crafted — reward from the Seasons of the Dragons meta achievement [wiki verified Oct 2026]',
  inputs: [ ach('Seasons of the Dragons', 'Meta achievement — complete the Seasons of the Dragons achievements') ],
};

const WARFARE_ESSENCES = () => [
  mysticEssence(81319, 'Mystic Essence of Strategy', [24295, 'Vial of Powerful Blood'], [24294, 'Vial of Potent Blood'],
    [46731, 'Pile of Bloodstone Dust', 250, 'Salvaged from ascended gear / fractal rewards'], [81326, 'Essence of Strategy', '1,000 Badges of Honor (WvW Commander vendors)']),
  mysticEssence(81494, 'Mystic Essence of Animosity', [24358, 'Ancient Bone'], [24341, 'Large Bone'],
    [46735, 'Empyreal Fragment', 250, 'Chests / WvW Tournament Claim Tickets'], [81522, 'Essence of Animosity', '500 Proof of Heroics (or another Testimony of Heroics)']),
  mysticEssence(81449, 'Mystic Essence of Carnage', [24289, 'Armored Scale'], [24288, 'Large Scale'],
    [46733, 'Dragonite Ore', 250, 'World bosses / WvW'], [81469, 'Essence of Carnage', '500 Memory of Battle']),
  mysticEssence(81407, 'Mystic Essence of Annihilation', [24351, 'Vicious Claw'], [24350, 'Large Claw'],
    [46681, 'Glob of Dark Matter', 10, 'Salvaged from exotic / ascended gear'], [81320, 'Essence of Annihilation', '350 WvW Skirmish Claim Tickets']),
];
const CONFLUX = {
  id: 'legendary_trinket_conflux', name: 'Conflux', itemId: 93105,
  rarity: 'Legendary', category: 'trinket', trinketSlot: 'Ring', generation: 2, badge: 'WvW', expansion: 'WvW',
  note: 'Mystic Forge: Gift of the World + Mist Band (Infused) + Mystic Tribute + Gift of Conquering [wiki verified Oct 2026]',
  inputs: [
    forgeItem(93190, 'Gift of the World', 1, 'Mystic Forge: War Commendation + Gift of the Mists + Gift of War Dedication + 100 Icy Runestone', [
      forgeItem(93101, 'War Commendation', 1, 'Mystic Forge: Gift of Warfare + Emblem of the Conqueror + Mist Pearl + Mist-Enhanced Mithril', [
        forgeItem(81478, 'Gift of Warfare', 1, 'Mystic Forge: the four Mystic Essences', WARFARE_ESSENCES()),
        item(93146, 'Emblem of the Conqueror', 1, 'collection', 'WvW achievement reward (or 100 Emblem of the Avenger)'),
        item(93147, 'Mist Pearl', 1, 'currency', '750 WvW Skirmish Claim Tickets + 250 Memory of Battle (Legendary Commander War Razor)'),
        item(93248, 'Mist-Enhanced Mithril', 1, 'currency', '750 WvW Skirmish Claim Tickets + 250 Memory of Battle (Legendary Commander War Razor)'),
      ]),
      { ...GIFT_OF_THE_MISTS },
      forgeItem(83259, 'Gift of War Dedication', 1, 'Mystic Forge: Certificate of Honor + Certificate of Heroics + Glob of Condensed Spirit Energy + 250 Memory of Battle', [
        item(83620, 'Certificate of Honor', 1, 'currency', 'WvW vendor (Skirmish Claim Tickets)'),
        item(84099, 'Certificate of Heroics', 1, 'currency', 'WvW vendor (Skirmish Claim Tickets)'),
        item(83082, 'Glob of Condensed Spirit Energy', 1, 'currency', 'Mistlock / WvW vendor'),
        tp(71581, 'Memory of Battle', 250),
      ]),
      vendor(19676, 'Icy Runestone', 100, '1 gold each (Miyani / Mystic Forge Attendant)'),
    ]),
    item(80058, 'Mist Band (Infused)', 1, 'currency', 'Precursor — Ascended Armor League Vendor: 150 Ascended Shards of Glory + 170 Shard of Glory'),
    { ...MYSTIC_TRIBUTE },
    forgeItem(81371, 'Gift of Conquering', 1, 'Mystic Forge: Legendary Spike + 4 Gift of Battle + 250 Memory of Battle + 2 Vision Crystal', [
      item(81296, 'Legendary Spike', 1, 'wvw', 'Random drop from enemy players and NPCs in WvW'),
      { ...GIFT_OF_BATTLE, count: 4 }, tp(71581, 'Memory of Battle', 250), { ...VISION_CRYSTAL, count: 2 },
    ]),
  ],
};

const pvpEssence = (itemId, name, t6, t5, special, essence) => forgeItem(itemId, name, 1,
  `Mystic Forge: ${essence[1]} + 20 ${t6[1]} + 50 ${t5[1]} + ${special[2]} ${special[1]}`, [
    vendor(essence[0], essence[1], 1, `League Vendor: ${essence[2]} Shard of Glory`, [ shardOfGlory(essence[2]) ]),
    tp(t6[0], t6[1], 20), tp(t5[0], t5[1], 50),
    item(special[0], special[1], special[2], 'currency', special[3]),
  ]);
const TRANSCENDENCE = {
  id: 'legendary_trinket_transcendence', name: 'Transcendence', itemId: 92991,
  rarity: 'Legendary', category: 'trinket', trinketSlot: 'Amulet', generation: 2, badge: 'PvP', expansion: 'PvP',
  note: 'Mystic Forge: Gift of the Champion + Mist Pendant + Mystic Tribute + Gift of Skirmishing [wiki verified Oct 2026]',
  inputs: [
    forgeItem(93036, 'Gift of the Champion', 1, 'Mystic Forge: Salt-Forged Mist Diamond + Gift of the Mists + Gift of Competitive Dedication + Tome of the Mists', [
      forgeItem(93016, 'Salt-Forged Mist Diamond', 1, 'Mystic Forge: Vial of Salt + Emblem of Victory + Mist Diamond + Mist-Enhanced Orichalcum', [
        forgeItem(77482, 'Vial of Salt', 1, 'Mystic Forge: the four PvP Mystic Essences', [
          pvpEssence(77479, 'Mystic Essence of Determination', [24295, 'Vial of Powerful Blood'], [24294, 'Vial of Potent Blood'], [46731, 'Pile of Bloodstone Dust', 250, 'Salvaged from ascended gear / fractal rewards'], [77552, 'Essence of Determination', 25]),
          pvpEssence(77492, 'Mystic Essence of Challenge', [24358, 'Ancient Bone'], [24341, 'Large Bone'], [46735, 'Empyreal Fragment', 250, 'Chests / reward tracks'], [77488, 'Essence of Challenge', 50]),
          pvpEssence(77510, 'Mystic Essence of Discipline', [24289, 'Armored Scale'], [24288, 'Large Scale'], [46733, 'Dragonite Ore', 250, 'World bosses / reward tracks'], [77541, 'Essence of Discipline', 75]),
          pvpEssence(77519, 'Mystic Essence of Success', [24351, 'Vicious Claw'], [24350, 'Large Claw'], [46681, 'Glob of Dark Matter', 10, 'Salvaged from exotic / ascended gear'], [77535, 'Essence of Success', 100]),
        ]),
        item(93022, 'Emblem of Victory', 1, 'collection', 'PvP achievement reward'),
        vendor(93034, 'Mist Diamond', 1, 'League Vendor: 25 PvP League Tickets + 250 Ascended Shards of Glory + 250 Shard of Glory', [
          cur('PvP League Ticket', 25), cur('Ascended Shards of Glory', 250), shardOfGlory(250) ]),
        vendor(93151, 'Mist-Enhanced Orichalcum', 1, 'League Vendor: 250 Ascended Shards of Glory + 250 Shard of Glory + 250 Orichalcum Ingot', [
          cur('Ascended Shards of Glory', 250), shardOfGlory(250), tp(19685, 'Orichalcum Ingot', 250) ]),
      ]),
      { ...GIFT_OF_THE_MISTS },
      forgeItem(84203, 'Gift of Competitive Dedication', 1, 'Mystic Forge: Record of League Participation + Star of Glory + Glob of Condensed Spirit Energy + Jar of Distilled Glory', [
        item(82471, 'Record of League Participation', 1, 'currency', 'Ascended Armor League Vendor (PvP League Tickets)'),
        item(83872, 'Star of Glory', 1, 'currency', 'Ascended Armor League Vendor (Spirit Shards)'),
        item(83082, 'Glob of Condensed Spirit Energy', 1, 'currency', 'Ascended Armor League Vendor (Ascended Shards of Glory)'),
        item(82926, 'Jar of Distilled Glory', 1, 'currency', 'Ascended Armor League Vendor (Shards of Glory)'),
      ]),
      item(93284, 'Tome of the Mists', 1, 'currency', 'League Vendor: 100 Tomes of Knowledge'),
    ]),
    item(79980, 'Mist Pendant', 1, 'currency', 'Precursor — Ascended Armor League Vendor: 125 Ascended Shards of Glory + 170 Shard of Glory'),
    { ...MYSTIC_TRIBUTE },
    forgeItem(77485, 'Gift of Skirmishing', 1, 'Mystic Forge: 2 Vision Crystal + 250 Shard of Glory + 5 Certificate of Support + Perfect Mist Core', [
      { ...VISION_CRYSTAL, count: 2 }, shardOfGlory(250),
      item(77486, 'Certificate of Support', 5, 'currency', '5 PvP League Tickets each'),
      item(77520, 'Perfect Mist Core', 1, 'currency', 'Combine four Mist Core Fragments (PvP reward tracks)'),
    ]),
  ],
};

// Visions of Eternity gifts: first copy from the map / achievement, extra copies from VoE vendors.
const voeGift = (itemId, name, src, how, gp) => item(itemId, name, 1, src, `${how} (${extraCopy(gp)})`);
const SEER_RUNESTONE = (n) => vendor(109666, 'Seer Runestone', n, 'Each: 1 Mystic Runestone + 10 Glob of Ectoplasm + 250 Research Note + 35,000 Karma (VoE heart vendors)', [
  vendor(79418, 'Mystic Runestone', 1, '1 gold each'), ecto(10), cur('Research Note', 250, 'Wallet currency'), karma(35000) ]);
const STELLA_RADIANS = {
  id: 'legendary_trinket_stella_radians', name: 'Stella Radians', itemId: 109070,
  rarity: 'Legendary', category: 'trinket', trinketSlot: 'Accessory', generation: 3, badge: 'VoE', expansion: 'Visions of Eternity',
  note: 'Mystic Forge: Mystic Tribute + Gift of Galdra + Gift of Shadowstones + Vial of Liquid Shadowstone [wiki verified Oct 2026]',
  inputs: [
    { ...MYSTIC_TRIBUTE },
    vendor(109469, 'Gift of Galdra', 1, 'Historian Meliza (Pilgrim’s Rest): Gift of Research + Preserved Eidolon Hide + Gift of Eternity’s Garden Exploration + Gift of Regrowth', [
      { ...GIFT_OF_RESEARCH },
      voeGift(109141, 'Preserved Eidolon Hide', 'collection', 'Eternity’s Garden achievement reward', 50),
      voeGift(109114, "Gift of Eternity's Garden Exploration", 'exploration', 'Eternity’s Garden map completion', 50),
      voeGift(109361, 'Gift of Regrowth', 'collection', 'Eternity’s Garden achievement reward', 25),
    ]),
    vendor(109161, 'Gift of Shadowstones', 1, 'Steward Brizio (Artificer’s Islet): Shadowstone Orb + Shadowstone Containment Frame + Gift of Restoration + 200 Seer Runestone', [
      vendor(109274, 'Shadowstone Orb', 1, 'Historian Meliza: 500 Shadowstone Fragment', [ item(109459, 'Shadowstone Fragment', 500, 'currency', 'Visions of Eternity map material') ]),
      vendor(109715, 'Shadowstone Containment Frame', 1, 'Steward Brizio: 2,500 each of Mithril Ingot, Elder Wood Plank, Cured Thick Leather Square, Bolt of Silk', [
        tp(19684, 'Mithril Ingot', 2500), tp(19709, 'Elder Wood Plank', 2500), tp(19735, 'Cured Thick Leather Square', 2500), tp(19747, 'Bolt of Silk', 2500) ]),
      voeGift(109489, 'Gift of Restoration', 'collection', 'Eternity’s Garden achievement reward', 25),
      SEER_RUNESTONE(200),
    ]),
    vendor(109391, 'Vial of Liquid Shadowstone', 1, 'Acolyte of Balance Dexx / Historian Meliza: 25 gold + 250 Shadowstone Fragment', [
      gold(25), item(109459, 'Shadowstone Fragment', 250, 'currency', 'Visions of Eternity map material') ]),
  ],
};

const STRIFE_UNENDING = {
  id: 'legendary_trinket_strife_unending', name: 'Strife Unending', itemId: 109012,
  rarity: 'Legendary', category: 'trinket', trinketSlot: 'Accessory', generation: 3, badge: 'WvW', expansion: 'Visions of Eternity',
  note: 'Bought from Dugan (WvW): Gift of the Warclaw + Gift of the Mist Warrior + Gift of the Mistwalker [wiki verified Oct 2026]',
  inputs: [
    item(109363, 'Gift of the Warclaw', 1, 'collection', 'Reward from the Mists Research: Strife Unending achievements'),
    vendor(109686, 'Gift of the Mist Warrior', 1, 'Dugan: 500 Testimony of Castoran Heroics + 50 Grandmaster Mark Shard + 25 Pile of Recycled Siege Equipment + 3 Gift of War Prosperity', [
      cur('Testimony of Castoran Heroics', 500, 'WvW Wizard’s Vault / reward tracks'),
      item(87557, 'Grandmaster Mark Shard', 50, 'currency', 'WvW events and reward tracks'),
      tp(103913, 'Pile of Recycled Siege Equipment', 25),
      forgeItem(82746, 'Gift of War Prosperity', 3, 'Mystic Forge: Gift of Battle + 15 Mystic Clover + Gift of Condensed Might + Gift of Condensed Magic', [
        { ...GIFT_OF_BATTLE }, clover(15), { ...CONDENSED_MIGHT }, { ...CONDENSED_MAGIC } ]),
    ]),
    vendor(109618, 'Gift of the Mistwalker', 1, 'Dugan: 2 Emblem of the Conqueror + Mistwalker Infusion (any stat) + 40 Emblem of the Avenger + 2 Gift of the Mists', [
      item(93146, 'Emblem of the Conqueror', 2, 'currency', 'WvW achievements, or 100 Emblem of the Avenger each'),
      { itemId: null, noItem: true, name: 'Mistwalker Infusion (any stat)', count: 1, source: 'currency', accountBound: true,
        note: 'Dugan: 20 Emblem of the Avenger + 2 Emblem of the Conqueror + 3,000 WvW Skirmish Claim Tickets + 5,000 Badges of Honor', inputs: [] },
      item(93075, 'Emblem of the Avenger', 40, 'currency', 'WvW achievements and reward tracks'),
      { ...GIFT_OF_THE_MISTS, count: 2 },
    ]),
  ],
};

const ENDLESS_SUMMER = {
  id: 'legendary_trinket_endless_summer', name: 'Endless Summer', itemId: 107022,
  rarity: 'Legendary', category: 'trinket', trinketSlot: 'Ring', generation: 3, badge: 'VoE', expansion: 'Visions of Eternity',
  note: 'Mystic Forge: Gift of Rays + Gift of the Survivors + Gift of the People + Gift of the Hylek [wiki verified Oct 2026]',
  inputs: [
    forgeItem(107040, 'Gift of Rays', 1, 'Mystic Forge: Gift of the Sun + Gift of the Beach + Gift of Infused Gems + 10 Purified Rift Essence', [
      forgeItem(107136, 'Gift of the Sun', 1, 'Mystic Forge: 2 Gift of Light + 2 Gift of Condensed Might + 2 Gift of Condensed Magic + 250 Sun Bead', [
        item(19632, 'Gift of Light', 2, 'craft', 'Crafted (Armorsmith 400): Gift of Ascalon + 250 Orichalcum Ingot + 250 Cured Hardened Leather Square + 100 Charged Lodestone', [
          item(19664, 'Gift of Ascalon', 1, 'currency', '500 Tales of Dungeon Delving (Ascalonian Catacombs vendor)'),
          tp(19685, 'Orichalcum Ingot', 250), tp(19737, 'Cured Hardened Leather Square', 250), tp(24305, 'Charged Lodestone', 100) ]),
        { ...CONDENSED_MIGHT, count: 2 }, { ...CONDENSED_MAGIC, count: 2 },
        item(19717, 'Sun Bead', 250, 'currency', '21 Karma each from Cuadinti (or salvage)'),
      ]),
      forgeItem(107201, 'Gift of the Beach', 1, 'Mystic Forge: 250 Pile of Coarse Sand + 100 Ley-Infused Sand + 250 Coral Orb + Relic of the Sunless', [
        tp(71641, 'Pile of Coarse Sand', 250), tp(83284, 'Ley-Infused Sand', 100), tp(24510, 'Coral Orb', 250), tp(100400, 'Relic of the Sunless', 1) ]),
      forgeItem(106975, 'Gift of Infused Gems', 1, 'Mystic Forge: 250 Obsidian Shard + 250 Beryl Orb + Bloodstone Shard + 100 Mystic Runestone', [
        obsidian(250), tp(24520, 'Beryl Orb', 250), { ...BLOODSTONE }, vendor(79418, 'Mystic Runestone', 100, '1 gold each') ]),
      item(100569, 'Purified Rift Essence', 10, 'craft', 'Crafted (any discipline 400): Amalgamated Rift Essence + Mystic Clover', [
        item(100930, 'Amalgamated Rift Essence', 1, 'craft', 'Crafted (any discipline 400): 250 Fine + 100 Masterwork + 50 Rare Rift Essence + 50 Glob of Ectoplasm', [
          cur('Fine Rift Essence', 250, 'Rift hunting'), cur('Masterwork Rift Essence', 100, 'Rift hunting (tier 2)'), cur('Rare Rift Essence', 50, 'Rift hunting (tier 3)'), ecto(50) ]),
        clover(1) ]),
    ]),
    { ...GIFT_OF_THE_SURVIVORS },
    { ...GIFT_OF_THE_PEOPLE },
    item(106986, 'Gift of the Hylek', 1, 'collection', 'Legendary Trinkets: Radiance of the Sun God achievement (extra copies: 250 Sun Bead + 200 gold + 300,000 Karma from Palak)'),
  ],
};

// ── RELIC / RUNE / SIGIL [wiki + API verified Oct 2026] ────────────────────────
// Each: Gift of Relics/Runes/Sigils + Gift of Craftsmanship + Gift of Condensed Magic + Gift of Condensed Might.
// Facets / Aspects / Motes are on the TP, so the engine compares buying them with forging them.
const legendaryUpgrade = (id, name, itemId, category, gift) => ({
  id, name, itemId, rarity: 'Legendary', category, generation: 3, badge: 'SotO', expansion: 'Secrets of the Obscure',
  note: `Mystic Forge: ${gift.name} + Gift of Craftsmanship + Gift of Condensed Magic + Gift of Condensed Might`,
  inputs: [ gift, { ...GIFT_OF_CRAFTSMANSHIP }, { ...CONDENSED_MAGIC }, { ...CONDENSED_MIGHT } ],
});
const lucent = (n) => tp(89271, 'Pile of Lucent Crystal', n);
const tradeableCraft = (itemId, name, count, note, inputs) => ({ itemId, name, count, source: 'forge', accountBound: false, note, inputs });
const LEGENDARY_RELIC = legendaryUpgrade('legendary_relic', 'Legendary Relic', 101582, 'relic',
  { itemId: 101519, name: 'Gift of Relics', count: 1, source: 'forge', accountBound: true,
    note: 'Mystic Forge: 25 Mystic Facet + 25 Mystic Clover + 150 Glob of Ectoplasm + Gift of Research',
    inputs: [
      tradeableCraft(101540, 'Mystic Facet', 25, 'Mystic Forge: 1 exotic Relic (any) + 3 × 250 Pile of Lucent Crystal (small chance of 5 Facets)', [
        { itemId: null, noItem: true, name: 'Exotic Relic (any)', count: 1, source: 'craft', note: 'Any exotic relic — no single price', inputs: [] },
        lucent(750) ]),
      clover(25), ecto(150), { ...GIFT_OF_RESEARCH } ] });
const LEGENDARY_RUNE = legendaryUpgrade('legendary_rune', 'Legendary Rune', 91536, 'rune',
  { itemId: 89218, name: 'Gift of Runes', count: 1, source: 'forge', accountBound: true,
    note: 'Mystic Forge: 50 Mystic Aspect + 20 Mystic Clover + 100 Glob of Ectoplasm + 50 Obsidian Shard',
    inputs: [
      tradeableCraft(89105, 'Mystic Aspect', 50, 'Crafted (Armorsmith / Leatherworker / Tailor 75, recipe sheet): 10 Pile of Lucent Crystal + Charm of Brilliance + Charm of Potence + Charm of Skill', [
        lucent(10), tp(89103, 'Charm of Brilliance', 1), tp(89258, 'Charm of Potence', 1), tp(89216, 'Charm of Skill', 1) ]),
      clover(20), ecto(100), obsidian(50) ] });
const LEGENDARY_SIGIL = legendaryUpgrade('legendary_sigil', 'Legendary Sigil', 91505, 'sigil',
  { itemId: 91449, name: 'Gift of Sigils', count: 1, source: 'forge', accountBound: true,
    note: 'Mystic Forge: 75 Mystic Mote + 30 Mystic Clover + 150 Glob of Ectoplasm + 75 Obsidian Shard',
    inputs: [
      tradeableCraft(89133, 'Mystic Mote', 75, 'Crafted (Artificer / Huntsman / Weaponsmith, recipe sheet): 10 Pile of Lucent Crystal + Symbol of Control + Symbol of Enhancement + Symbol of Pain', [
        lucent(10), tp(89098, 'Symbol of Control', 1), tp(89141, 'Symbol of Enhancement', 1), tp(89182, 'Symbol of Pain', 1) ]),
      clover(30), ecto(150), obsidian(75) ] });

export const BACK_ITEMS_V2 = [AD_INFINITUM, WARBRINGER, THE_ASCENSION, ORRAX_MANIFESTED];
export const TRINKETS_V2 = [VISION, COALESCENCE, PRISMATIC_REGALIA, CONFLUX, TRANSCENDENCE, STELLA_RADIANS, STRIFE_UNENDING, ENDLESS_SUMMER];
export const RELICS_V2 = [LEGENDARY_RELIC];
export const RUNES_V2 = [LEGENDARY_RUNE];
export const SIGILS_V2 = [LEGENDARY_SIGIL];
