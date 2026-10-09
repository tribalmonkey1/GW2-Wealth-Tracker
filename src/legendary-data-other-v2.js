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
import { MYSTIC_TRIBUTE } from "./legendary-data.js";
import { GIFT_OF_THE_MISTS, GIFT_OF_MAGUUMA_MASTERY } from "./legendary-data-gen2.js";
import { GIFT_OF_RESEARCH, DRACONIC_TRIBUTE } from "./legendary-data-gen3.js";
import { GIFT_OF_CRAFTSMANSHIP } from "./legendary-data-armor.js";

const CONDENSED_MAGIC = { ...MYSTIC_TRIBUTE.inputs.find(i => i.name === 'Gift of Condensed Magic'), count: 1 };
const CONDENSED_MIGHT = { ...MYSTIC_TRIBUTE.inputs.find(i => i.name === 'Gift of Condensed Might'), count: 1 };
const CUBE = GIFT_OF_THE_MISTS.inputs.find(i => i.name === 'Cube of Stabilized Dark Energy');

const tp = (itemId, name, count, note) => ({ itemId, name, count, source: 'tp', ...(note ? { note } : {}), inputs: [] });
const named = (name, count, source, note, inputs = []) => ({ itemId: null, idName: name, name, count, source, accountBound: true, note, inputs });
const ach = (name, note) => named(name, 1, 'collection', note);
const clover = (n) => tp(19675, 'Mystic Clover', n);
const ecto = (n) => tp(19721, 'Glob of Ectoplasm', n);
const obsidian = (n) => ({ itemId: 19925, name: 'Obsidian Shard', count: n, source: 'karma', note: '1,050 Karma each', inputs: [] });
const BLOODSTONE = { itemId: 20797, name: 'Bloodstone Shard', count: 1, source: 'spirit_shard', accountBound: true, note: '200 Spirit Shards from Miyani', inputs: [] };
const VISION_CRYSTAL = { itemId: 46746, name: 'Vision Crystal', count: 1, source: 'currency', accountBound: true, note: 'Ascended craft (5 Dragonite Ingot + 5 Empyreal Star + Augur’s Stone + 5 Bloodstone Brick)', inputs: [] };

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

const WARBRINGER = {
  id: 'legendary_back_warbringer', name: 'Warbringer', itemId: 81462,
  rarity: 'Legendary', category: 'back', generation: 2, badge: 'WvW', expansion: 'WvW', dataStatus: 'partial',
  note: 'PARTIAL — WvW legendary backpack from the Warbringer collections; the wiki recipe did not load, so only the collection path is shown',
  inputs: [ ach('Warbringer collections', 'Complete the WvW Warbringer legendary backpack collections (WvW reward tracks)') ],
};

const THE_ASCENSION = {
  id: 'legendary_back_ascension', name: 'The Ascension', itemId: 77474,
  rarity: 'Legendary', category: 'back', generation: 2, badge: 'PvP', expansion: 'PvP', dataStatus: 'partial',
  note: 'PARTIAL — PvP legendary backpack. Components from the wiki material list; exact nesting still being verified',
  inputs: [
    named('Wings of Ascension', 1, 'collection', "Precursor — Recruit's, Veteran's, Champion's and Elite's Wings of Glory (PvP collections)"),
    named('Gift of the Competitor', 1, 'collection', 'The Thrill of Battle + Tapestry of Sacrifice + Monument of Legends + Hymn of Glory (PvP collections)'),
    { ...GIFT_OF_FORTUNE },
    named('Gift of Skirmishing', 1, 'forge', '2 Vision Crystal + 250 Shard of Glory + 5 Certificate of Support + Perfect Mist Core', [
      { ...VISION_CRYSTAL, count: 2 }, tp(70820, 'Shard of Glory', 250), named('Certificate of Support', 5, 'currency', 'PvP vendor'), named('Perfect Mist Core', 1, 'currency', 'PvP reward') ]),
  ],
};

const ORRAX_MANIFESTED = {
  id: 'legendary_back_orrax', name: 'Orrax Manifested', itemId: 104857,
  rarity: 'Legendary', category: 'back', generation: 3, badge: 'Janthir Wilds', expansion: 'Janthir Wilds', dataStatus: 'partial',
  note: 'Mystic Forge: Gift of the Mistburned Isles + Gift of Shadows + Gift of the Feast + Orrax Contained [wiki verified Oct 2026; deepest cooking steps summarised]',
  inputs: [
    named('Gift of the Mistburned Isles', 1, 'forge', '250 Mursaat Runestone + 250 Mystic Runestone + Gift of the Mursaat Ruins + Gift of Janthir Wanderlust', [
      named('Mursaat Runestone', 250, 'currency', 'Janthir Wilds material'),
      { itemId: 79418, name: 'Mystic Runestone', count: 250, source: 'vendor', accountBound: true, note: '1 gold each', inputs: [] },
      named('Gift of the Mursaat Ruins', 1, 'forge', 'Titan / Mursaat materials, 300 Ecto, 300 Ancient Wood Plank and more (Janthir Wilds)'),
      named('Gift of Janthir Wanderlust', 1, 'exploration', 'Lowland Shore, Janthir Syntri, Mistburned Barrens and Bava Nisos map gifts'),
    ]),
    named('Gift of Shadows', 1, 'forge', 'Bloodstone Shard + Gift of Darkness + Gift of Scales + Gift of Titan Understanding', [
      { ...BLOODSTONE },
      named('Gift of Darkness', 1, 'forge', 'Gift of Ascalon + 250 Orichalcum Ingot + 250 Cured Hardened Leather Square + 100 Onyx Lodestone', [
        { itemId: 19664, name: 'Gift of Ascalon', count: 1, source: 'collection', accountBound: true, note: '500 Tales of Dungeon Delving (5 Ascalonian Catacombs completions)', inputs: [] },
        tp(19685, 'Orichalcum Ingot', 250), tp(19737, 'Cured Hardened Leather Square', 250), tp(24310, 'Onyx Lodestone', 100) ]),
      { itemId: 75299, name: 'Gift of Scales', count: 1, source: 'forge', accountBound: true, inputs: [
        tp(24289, 'Armored Scale', 100), tp(24288, 'Large Scale', 250), tp(24287, 'Smooth Scale', 50), tp(24286, 'Scale', 50) ] },
      named('Gift of Titan Understanding', 1, 'forge', '25 Amalgamated Rift Essence + 25 Curious Mursaat Remnants + 25 Curious Mursaat Ruin Shards + 1,250 Ursus Oblige'),
    ]),
    named('Gift of the Feast', 1, 'forge', 'Gift of the Appetizer + Gift of the Entrée + Gift of the Side Course + Gift of the Dessert (Chef — very large ingredient lists, plus 5 Fruit of the Shadow each)', [
      named('Gift of the Appetizer', 1, 'forge', 'Chef — Poultry Satay, Red-Lentil Saobosa, Spicy Marinated Mushroom… + 5 Fruit of the Shadow'),
      named('Gift of the Entrée', 1, 'forge', 'Chef — Orrian Steak Frittes, Truffle Steak, Spicy Herbed Chicken… + 5 Fruit of the Shadow'),
      named('Gift of the Side Course', 1, 'forge', 'Chef — Meaty Asparagus Skewers, Black Pepper Cactus Salad… + 30 Mystic Clover + 5 Fruit of the Shadow'),
      named('Gift of the Dessert', 1, 'forge', 'Chef — Prickly Pear Sorbet, Passion Fruit Tapioca Pudding + 2 Amalgamated Rift Essence + 5 Fruit of the Shadow'),
    ]),
    named('Orrax Contained', 1, 'forge', 'Binding of the Dragon + Salmon of Knowledge Backpiece + Askur Camping Cookout Backpiece + Draconic Tribute', [
      ach('Binding of the Dragon', 'Unknown Nightmares: Experiments in the Shadows'),
      ach('Salmon of Knowledge Backpiece', 'Mistburned Barrens Mastery achievement'),
      ach('Askur Camping Cookout Backpiece', 'Bava Nisos Mastery achievement'),
      { ...DRACONIC_TRIBUTE },
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
      named('Gift of Desert Mastery', 1, 'forge', 'Path of Fire mastery gift (Coalescence requires the Desert version)'),
      tp(71994, 'Ball of Dark Energy', 6),
      named('Gift of Complex Emotions', 1, 'collection', 'Coalescence collection reward'),
      named('Legendary Insight', 150, 'currency', 'Raid / Strike reward currency'),
    ]),
  ],
};

const VISION = {
  id: 'legendary_trinket_vision', name: 'Vision', itemId: 91048,
  rarity: 'Legendary', category: 'trinket', trinketSlot: 'Accessory', generation: 2, badge: 'LS4', expansion: 'Living World Season 4', dataStatus: 'partial',
  note: 'PARTIAL — needs all 6 LS4 episodes. Components from the GuildJen guide (wiki recipe did not load): Vision I/II collections, Mystic Tribute, Gift of Prescience, Gift of Arid Mastery, 100 Funerary Incense',
  inputs: [
    ach('Vision I: Awakening', 'Collection — six LS4 map sub-collections (unlock from a Volatile Magic Collector)'),
    ach('Vision II: Farsight', 'Collection — /kneel at 20 LS4 mastery insights'),
    { ...MYSTIC_TRIBUTE },
    named('Gift of Prescience', 1, 'forge', 'Includes 250 Shard of Glory + 250 Memory of Battle and WvW / crafted components'),
    named('Gift of Arid Mastery', 1, 'forge', 'Includes a 200 Spirit Shard item from a Mystic Forge Attendant'),
    named('Funerary Incense', 100, 'currency', 'Primeval Steward — 3 Elegy Mosaic + Amalgamated Gemstone + Obsidian Shard + Ecto each'),
  ],
};

const PRISMATIC_REGALIA = {
  id: 'legendary_trinket_prismatic', name: "Prismatic Champion's Regalia", itemId: 95380,
  rarity: 'Legendary', category: 'trinket', trinketSlot: 'Amulet', generation: 2, badge: 'IBS', expansion: 'The Icebrood Saga',
  note: 'Not crafted — reward from the Seasons of the Dragons meta achievement [wiki verified Oct 2026]',
  inputs: [ ach('Seasons of the Dragons', 'Meta achievement — complete the Seasons of the Dragons achievements') ],
};

const partialTrinket = (id, name, itemId, slot, badge, expansion, note) => ({
  id, name, itemId, rarity: 'Legendary', category: 'trinket', trinketSlot: slot, generation: 3, badge, expansion,
  dataStatus: 'partial', note: `PARTIAL — ${note}`,
  inputs: [ ach(`${name} collections`, note) ],
});
const CONFLUX = partialTrinket('legendary_trinket_conflux', 'Conflux', 93105, 'Ring', 'WvW', 'WvW',
  'WvW legendary ring (uses a Mystic Tribute); the wiki material list did not load cleanly — recipe still being verified');
const TRANSCENDENCE = partialTrinket('legendary_trinket_transcendence', 'Transcendence', 92991, 'Amulet', 'Fractals', 'Fractals',
  'Fractal legendary amulet (Salt-Forged Mist Diamond + Mist Pendant…); recipe still being verified');
const STELLA_RADIANS = partialTrinket('legendary_trinket_stella_radians', 'Stella Radians', 109070, 'Accessory', 'VoE', 'Visions of Eternity',
  'Visions of Eternity legendary accessory; recipe still being verified');
const STRIFE_UNENDING = partialTrinket('legendary_trinket_strife_unending', 'Strife Unending', 109012, 'Accessory', 'VoE', 'Visions of Eternity',
  'Visions of Eternity legendary accessory; recipe still being verified');

const ENDLESS_SUMMER = {
  id: 'legendary_trinket_endless_summer', name: 'Endless Summer', itemId: 107022,
  rarity: 'Legendary', category: 'trinket', trinketSlot: 'Ring', generation: 3, badge: 'VoE', expansion: 'Visions of Eternity', dataStatus: 'partial',
  note: 'Mystic Forge: Gift of Rays + Gift of the Survivors + Gift of the People + Gift of the Hylek [wiki verified Oct 2026; Gift of Rays nesting partial]',
  inputs: [
    named('Gift of Rays', 1, 'forge', 'Gift of the Sun (2 Gift of Light → Gift of Ascalon, 500 Orichalcum Ingot, 500 Cured Hardened Leather, 200 Charged Lodestone)'),
    named('Gift of the Survivors', 1, 'currency', 'Castaway Agnes — Concentrated Chromatic Sap + Shipwreck Strand exploration gift + Survivor’s Enchanted Compass + 500 Aether-Rich Sap'),
    named('Gift of the People', 1, 'currency', 'Canach — Patron of the Magical Arts Plaque + Starlit Weald exploration gift + Seer Wreath of Service + 500 Antiquated Ducat'),
    named('Gift of the Hylek', 1, 'collection', 'Legendary Trinkets: Radiance of the Sun God (or 250 Sun Beads + 200 gold + 300,000 Karma after the first)'),
  ],
};

// ── RELIC / RUNE / SIGIL ──────────────────────────────────────────────────────
// Each: Gift of Relics/Runes/Sigils + Gift of Craftsmanship + Gift of Condensed Magic + Gift of Condensed Might
const legendaryUpgrade = (id, name, itemId, category, gift) => ({
  id, name, itemId, rarity: 'Legendary', category, generation: 3, badge: 'SotO', expansion: 'Secrets of the Obscure', dataStatus: 'partial',
  note: `Mystic Forge: ${gift.name} + Gift of Craftsmanship + Gift of Condensed Magic + Gift of Condensed Might (sub-ingredient names partly from the GuildJen guide)`,
  inputs: [ gift, { ...GIFT_OF_CRAFTSMANSHIP }, { ...CONDENSED_MAGIC }, { ...CONDENSED_MIGHT } ],
});
const LEGENDARY_RELIC = legendaryUpgrade('legendary_relic', 'Legendary Relic', 101582, 'relic',
  named('Gift of Relics', 1, 'forge', '25 Mystic Facet + 25 Mystic Clover + 150 Glob of Ectoplasm + Gift of Research', [
    named('Mystic Facet', 25, 'forge', 'Each: Lucent materials (250/250/250) + 1 relic of any kind'), clover(25), ecto(150), { ...GIFT_OF_RESEARCH } ]));
const LEGENDARY_RUNE = legendaryUpgrade('legendary_rune', 'Legendary Rune', 91536, 'rune',
  named('Gift of Runes', 1, 'forge', '50 Mystic Aspect + 20 Mystic Clover + 100 Glob of Ectoplasm + 50 Obsidian Shard', [
    named('Mystic Aspect', 50, 'forge', 'Each: 10 of one material + 1 each of three others (see guide)'), clover(20), ecto(100), obsidian(50) ]));
const LEGENDARY_SIGIL = legendaryUpgrade('legendary_sigil', 'Legendary Sigil', 91505, 'sigil',
  named('Gift of Sigils', 1, 'forge', '75 Mystic Mote + 30 Mystic Clover + 150 Glob of Ectoplasm + 75 Obsidian Shard', [
    named('Mystic Mote', 75, 'forge', 'Each: 10 of one material + 1 each of three others (see guide)'), clover(30), ecto(150), obsidian(75) ]));

export const BACK_ITEMS_V2 = [AD_INFINITUM, WARBRINGER, THE_ASCENSION, ORRAX_MANIFESTED];
export const TRINKETS_V2 = [VISION, COALESCENCE, PRISMATIC_REGALIA, CONFLUX, TRANSCENDENCE, STELLA_RADIANS, STRIFE_UNENDING, ENDLESS_SUMMER];
export const RELICS_V2 = [LEGENDARY_RELIC];
export const RUNES_V2 = [LEGENDARY_RUNE];
export const SIGILS_V2 = [LEGENDARY_SIGIL];
