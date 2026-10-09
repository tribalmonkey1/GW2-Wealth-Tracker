/**
 * GW2 Legendary Armor Data — REBUILT Oct 2026.
 *
 * The previous version modelled sets that do not exist in the game ("Gift of the
 * Legendary Armorer", "Gift of Light Armor", raid armor "collections" with a TP
 * insignia). This version follows the real sets, with every legendary piece's item ID
 * taken from the GW2 API's /v2/legendaryarmory list and recipes from the wiki / API:
 *
 *  1 Raids      — Perfected Envoy:       Refined Envoy piece + Gift of Prosperity + Gift of Prowess + Gift of Dedication
 *  2 WvW        — Triumphant Hero's:     ascended Triumphant piece + Gift of War Prosperity/Prowess/Dedication
 *  3 PvP        — Glorious Hero's:       ascended Glorious piece + Gift of Competitive Prosperity/Prowess/Dedication
 *  4 Obsidian   — (Secrets of the Obscure) discipline craft at 500: Arcanum + Gift of Expertise
 *                                         + Gift of Stormy Skies + Gift of Magical/Mighty Prosperity
 *  5 Other      — Eikasia, Mists-Grasper (fractal gloves) and Selachimorpha (VoE aquatic helm)
 *
 * The Mistforged / Ardent / Sublime variants in the legendary armory are skin variants
 * of sets 2 and 3 (same crafting cost) and are not listed separately.
 */
import { MYSTIC_TRIBUTE } from "./legendary-data.js";
import { GIFT_OF_THE_MISTS } from "./legendary-data-gen2.js";
import { GIFT_OF_RESEARCH } from "./legendary-data-gen3.js";

const CONDENSED_MAGIC = { ...MYSTIC_TRIBUTE.inputs.find(i => i.name === 'Gift of Condensed Magic'), count: 1 };
const CONDENSED_MIGHT = { ...MYSTIC_TRIBUTE.inputs.find(i => i.name === 'Gift of Condensed Might'), count: 1 };
const CUBE = GIFT_OF_THE_MISTS.inputs.find(i => i.name === 'Cube of Stabilized Dark Energy');

const clover = (n) => ({ itemId: 19675, name: 'Mystic Clover', count: n, source: 'tp', inputs: [] });
const obsidian = (n) => ({ itemId: 19925, name: 'Obsidian Shard', count: n, source: 'karma', note: '1,050 Karma each (or Volatile/Unbound Magic + 96c)', inputs: [] });
const ELDRITCH = { itemId: 20852, name: 'Eldritch Scroll', count: 1, source: 'spirit_shard', accountBound: true, note: '50 Spirit Shards from Miyani', inputs: [] };
const cur = (name, count, note, itemId = null) => ({ itemId, idName: itemId ? undefined : name, name, count, source: 'currency', accountBound: true, note, inputs: [] });

export const GIFT_OF_CRAFTSMANSHIP = cur('Gift of Craftsmanship', 1, '50 Provisioner Tokens from Faction Provisioners');

// ── Raid (Perfected Envoy) gifts [wiki verified Oct 2026] ──
const GIFT_OF_PROSPERITY = { itemId: 78866, name: 'Gift of Prosperity', count: 1, source: 'forge', accountBound: true,
  note: 'Mystic Forge: Gift of Craftsmanship + 15 Mystic Clover + Gift of Condensed Magic + Gift of Condensed Might',
  inputs: [ { ...GIFT_OF_CRAFTSMANSHIP }, clover(15), { ...CONDENSED_MAGIC }, { ...CONDENSED_MIGHT } ] };
const GIFT_OF_PROWESS = { itemId: 78989, name: 'Gift of Prowess', count: 1, source: 'forge', accountBound: true,
  note: 'Bought from Scholar Glenna for 25 Legendary Insight + Eldritch Scroll + 50 Obsidian Shard + Cube of Stabilized Dark Energy',
  inputs: [ cur('Legendary Insight', 25, 'Raid boss / Strike reward currency'), { ...ELDRITCH }, obsidian(50), { ...CUBE } ] };
const GIFT_OF_DEDICATION = { itemId: 78936, name: 'Gift of Dedication', count: 1, source: 'forge', accountBound: true,
  note: 'Mystic Forge: 5 Auric Ingot + 5 Reclaimed Metal Plate + 5 Chak Egg + Gift of the Pact',
  inputs: [
    { itemId: null, idName: 'Auric Ingot', name: 'Auric Ingot', count: 5, source: 'tp', inputs: [] },
    { itemId: null, idName: 'Reclaimed Metal Plate', name: 'Reclaimed Metal Plate', count: 5, source: 'tp', inputs: [] },
    { itemId: null, idName: 'Chak Egg', name: 'Chak Egg', count: 5, source: 'tp', inputs: [] },
    cur('Gift of the Pact', 1, 'Account-bound gift (Heart of Thorns)'),
  ] };

// ── WvW (Triumphant Hero's) gifts [wiki verified Oct 2026] ──
const GIFT_OF_WAR_PROSPERITY = { itemId: 82746, name: 'Gift of War Prosperity', count: 1, source: 'forge', accountBound: true,
  note: 'Mystic Forge: Gift of Battle + 15 Mystic Clover + Gift of Condensed Might + Gift of Condensed Magic',
  inputs: [ { itemId: 19678, name: 'Gift of Battle', count: 1, source: 'wvw', accountBound: true, note: 'WvW Gift of Battle reward track', inputs: [] },
            clover(15), { ...CONDENSED_MIGHT }, { ...CONDENSED_MAGIC } ] };
const GIFT_OF_WAR_PROWESS = { itemId: 84168, name: 'Gift of War Prowess', count: 1, source: 'forge', accountBound: true,
  note: 'Mystic Forge: Legendary War Insight + Eldritch Scroll + 50 Obsidian Shard + Cube of Stabilized Dark Energy',
  inputs: [ { itemId: null, idName: 'Legendary War Insight', name: 'Legendary War Insight', count: 1, source: 'wvw', accountBound: true, note: 'WvW legendary armor reward track', inputs: [] },
            { ...ELDRITCH }, obsidian(50), { ...CUBE } ] };
const GIFT_OF_WAR_DEDICATION = { itemId: 83259, name: 'Gift of War Dedication', count: 1, source: 'forge', accountBound: true,
  note: 'Mystic Forge: Certificate of Honor + Certificate of Heroics + Glob of Condensed Spirit Energy + 250 Memory of Battle',
  inputs: [ cur('Certificate of Honor', 1, 'WvW vendor (Skirmish Claim Tickets)'), cur('Certificate of Heroics', 1, 'WvW vendor (Skirmish Claim Tickets)'),
            cur('Glob of Condensed Spirit Energy', 1, 'Mistlock / WvW vendor'),
            { itemId: 71581, name: 'Memory of Battle', count: 250, source: 'tp', inputs: [] } ] };

// ── PvP (Glorious Hero's) gifts ──
const GIFT_OF_COMPETITIVE_PROSPERITY = { itemId: 84174, name: 'Gift of Competitive Prosperity', count: 1, source: 'forge', accountBound: true,
  note: 'Mystic Forge: Mist Core Fragment + 15 Mystic Clover + Gift of Condensed Might + Gift of Condensed Magic [wiki verified Oct 2026]',
  inputs: [ cur('Mist Core Fragment', 1, 'PvP reward'), clover(15), { ...CONDENSED_MIGHT }, { ...CONDENSED_MAGIC } ] };
const GIFT_OF_COMPETITIVE_PROWESS = { itemId: null, idName: 'Gift of Competitive Prowess', name: 'Gift of Competitive Prowess', count: 1, source: 'forge', accountBound: true,
  note: 'PARTIAL — same pattern as Gift of War Prowess (league insight item from 30 League Tickets + Eldritch Scroll + 50 Obsidian + Cube); wiki page did not load',
  inputs: [ cur('PvP League insight item', 1, 'Ascended Armor League Vendor — 30 PvP League Tickets'), { ...ELDRITCH }, obsidian(50), { ...CUBE } ] };
const GIFT_OF_COMPETITIVE_DEDICATION = { itemId: 84203, name: 'Gift of Competitive Dedication', count: 1, source: 'forge', accountBound: true,
  note: 'Mystic Forge: Record of League Participation + Star of Glory + Glob of Condensed Spirit Energy + Jar of Distilled Glory [wiki verified Oct 2026]',
  inputs: [ cur('Record of League Participation', 1, 'Ascended Armor League Vendor (PvP League Tickets)'),
            cur('Star of Glory', 1, 'Ascended Armor League Vendor (Spirit Shards)'),
            cur('Glob of Condensed Spirit Energy', 1, 'Ascended Armor League Vendor (Ascended Shards of Glory)'),
            cur('Jar of Distilled Glory', 1, 'Ascended Armor League Vendor (Shards of Glory)') ] };

// ── Obsidian (SotO) gifts [wiki + API verified Oct 2026] ──
export const GIFT_OF_EXPERTISE = { itemId: 100852, name: 'Gift of Expertise', count: 1, source: 'forge', accountBound: true,
  note: 'Mystic Forge / Wizard’s Tower: 12 Amalgamated Rift Essence + Eldritch Scroll + 50 Obsidian Shard + Cube of Stabilized Dark Energy',
  inputs: [ cur('Amalgamated Rift Essence', 12, 'SotO rift hunting currency'), { ...ELDRITCH }, obsidian(50), { ...CUBE } ] };
const GIFT_OF_STORMY_SKIES = { itemId: 100288, name: 'Gift of Stormy Skies', count: 1, source: 'forge', accountBound: true,
  note: 'Sold by Lyhr (Wizard’s Tower) for Gift of the Astral Ward + 5 Case of Captured Lightning + 5 Clot of Congealed Screams + 5 Pouch of Stardust + 10 Glob of Ectoplasm',
  inputs: [ { itemId: null, idName: 'Gift of the Astral Ward', name: 'Gift of the Astral Ward', count: 1, source: 'exploration', accountBound: true,
              note: 'Skywatch Archipelago, Amnytas and Inner Nayos map gifts + Gift of Persistence', inputs: [] },
            cur('Case of Captured Lightning', 5, 'SotO map material'), cur('Clot of Congealed Screams', 5, 'SotO map material'), cur('Pouch of Stardust', 5, 'SotO map material'),
            { itemId: 19721, name: 'Glob of Ectoplasm', count: 10, source: 'tp', inputs: [] } ] };
const prosperityObsidian = (magical) => ({
  itemId: magical ? 100512 : 100933, name: magical ? 'Gift of Magical Prosperity' : 'Gift of Mighty Prosperity', count: 1, source: 'forge', accountBound: true,
  note: `Mystic Forge: 9 Mystic Clover + Gift of Condensed ${magical ? 'Magic' : 'Might'} + Gift of Research + Gift of Craftsmanship`,
  inputs: [ clover(9), { ...(magical ? CONDENSED_MAGIC : CONDENSED_MIGHT) }, { ...GIFT_OF_RESEARCH }, { ...GIFT_OF_CRAFTSMANSHIP } ] });
const ARCANUM = {
  Helm: [100706, 'Arcanum of Astral Thought'], Shoulders: [100524, 'Arcanum of Astral Bearing'], Chest: [100509, 'Arcanum of Astral Heartbeat'],
  Gloves: [100050, 'Arcanum of Astral Grasp'], Leggings: [100198, 'Arcanum of Astral Stride'], Boots: [100946, 'Arcanum of Astral Footprints'],
};

// ── Pieces: [weight, slot, legendaryId, legendaryName] per set (IDs from /v2/legendaryarmory) ──
const ENVOY = [
  ['Light','Helm',80248,'Perfected Envoy Cowl'],['Light','Shoulders',80131,'Perfected Envoy Mantle'],['Light','Chest',80190,'Perfected Envoy Vestments'],
  ['Light','Gloves',80111,'Perfected Envoy Gloves'],['Light','Leggings',80356,'Perfected Envoy Pants'],['Light','Boots',80399,'Perfected Envoy Shoes'],
  ['Medium','Helm',80296,'Perfected Envoy Mask'],['Medium','Shoulders',80145,'Perfected Envoy Shoulderpads'],['Medium','Chest',80578,'Perfected Envoy Jerkin'],
  ['Medium','Gloves',80161,'Perfected Envoy Vambraces'],['Medium','Leggings',80252,'Perfected Envoy Leggings'],['Medium','Boots',80281,'Perfected Envoy Boots'],
  ['Heavy','Helm',80384,'Perfected Envoy Helmet'],['Heavy','Shoulders',80435,'Perfected Envoy Pauldrons'],['Heavy','Chest',80254,'Perfected Envoy Breastplate'],
  ['Heavy','Gloves',80205,'Perfected Envoy Gauntlets'],['Heavy','Leggings',80277,'Perfected Envoy Tassets'],['Heavy','Boots',80557,'Perfected Envoy Greaves'],
];
const TRIUMPHANT = [
  ['Light','Helm',82902,"Triumphant Hero's Masque"],['Light','Shoulders',82173,"Triumphant Hero's Epaulets"],['Light','Chest',83036,"Triumphant Hero's Raiment"],
  ['Light','Gloves',84629,"Triumphant Hero's Armguards"],['Light','Leggings',83497,"Triumphant Hero's Leggings"],['Light','Boots',83289,"Triumphant Hero's Footgear"],
  ['Medium','Helm',82437,"Triumphant Hero's Faceguard"],['Medium','Shoulders',82994,"Triumphant Hero's Shoulderguards"],['Medium','Chest',84578,"Triumphant Hero's Brigandine"],
  ['Medium','Gloves',84110,"Triumphant Hero's Wristplates"],['Medium','Leggings',82903,"Triumphant Hero's Legguards"],['Medium','Boots',82093,"Triumphant Hero's Shinplates"],
  ['Heavy','Helm',84176,"Triumphant Hero's Warhelm"],['Heavy','Shoulders',82963,"Triumphant Hero's Pauldrons"],['Heavy','Chest',83394,"Triumphant Hero's Breastplate"],
  ['Heavy','Gloves',82456,"Triumphant Hero's Gauntlets"],['Heavy','Leggings',82196,"Triumphant Hero's Legplates"],['Heavy','Boots',82801,"Triumphant Hero's Wargreaves"],
];
const GLORIOUS = [
  ['Light','Helm',82423,"Glorious Hero's Crown"],['Light','Shoulders',84723,"Glorious Hero's Epaulets"],['Light','Chest',83729,"Glorious Hero's Raiment"],
  ['Light','Gloves',84461,"Glorious Hero's Armguards"],['Light','Leggings',84341,"Glorious Hero's Leggings"],['Light','Boots',84427,"Glorious Hero's Footgear"],
  ['Medium','Helm',82401,"Glorious Hero's Cap"],['Medium','Shoulders',82268,"Glorious Hero's Shoulderguards"],['Medium','Chest',82098,"Glorious Hero's Brigandine"],
  ['Medium','Gloves',83676,"Glorious Hero's Wristplates"],['Medium','Leggings',83240,"Glorious Hero's Legguards"],['Medium','Boots',82272,"Glorious Hero's Shinplates"],
  ['Heavy','Helm',82698,"Glorious Hero's Plate Helm"],['Heavy','Shoulders',84561,"Glorious Hero's Pauldrons"],['Heavy','Chest',82334,"Glorious Hero's Breastplate"],
  ['Heavy','Gloves',82410,"Glorious Hero's Gauntlets"],['Heavy','Leggings',84748,"Glorious Hero's Legplates"],['Heavy','Boots',83957,"Glorious Hero's Wargreaves"],
];
const OBSIDIAN = [
  ['Light','Helm',101516,'Obsidian Light Crown'],['Light','Shoulders',101462,'Obsidian Light Mantle'],['Light','Chest',101499,'Obsidian Light Regalia'],
  ['Light','Gloves',101536,'Obsidian Light Gloves'],['Light','Leggings',101501,'Obsidian Light Pants'],['Light','Boots',101535,'Obsidian Light Shoes'],
  ['Medium','Helm',101614,'Obsidian Medium Mask'],['Medium','Shoulders',101645,'Obsidian Medium Shoulders'],['Medium','Chest',101556,'Obsidian Medium Jacket'],
  ['Medium','Gloves',101570,'Obsidian Medium Gloves'],['Medium','Leggings',101579,'Obsidian Medium Leggings'],['Medium','Boots',101602,'Obsidian Medium Boots'],
  ['Heavy','Helm',101544,'Obsidian Heavy Helmet'],['Heavy','Shoulders',101551,'Obsidian Heavy Pauldrons'],['Heavy','Chest',101521,'Obsidian Heavy Breastplate'],
  ['Heavy','Gloves',101609,'Obsidian Heavy Gauntlets'],['Heavy','Leggings',101568,'Obsidian Heavy Cuisses'],['Heavy','Boots',101460,'Obsidian Heavy Greaves'],
];
const DISCIPLINE = { Light: 'Tailor', Medium: 'Leatherworker', Heavy: 'Armorsmith' };

const piece = (setKey, gen, badge, expansion, [weight, slot, itemId, name], inputs, note) => ({
  id: `legendary_armor_${setKey}_${weight.toLowerCase()}_${slot.toLowerCase()}`,
  name, itemId, rarity: 'Legendary', armorSlot: slot, weightClass: weight,
  generation: gen, badge, category: 'armor', expansion, note, inputs,
});

const RAID_ARMOR = ENVOY.map(p => piece('raid', 1, 'Raids', 'Raids', p, [
  { itemId: null, name: p[3].replace('Perfected', 'Refined'), count: 1, source: 'forge', accountBound: true,
    note: `Crafted (${DISCIPLINE[p[0]]} 500) from Envoy Insignia + Lesser Vision Crystal + 2 ascended armor parts, or from a Chest of ${p[0]} Refined Envoy Armor (raid collections)`, inputs: [] },
  { ...GIFT_OF_PROSPERITY }, { ...GIFT_OF_PROWESS }, { ...GIFT_OF_DEDICATION },
], 'Mystic Forge: Refined Envoy piece + Gift of Prosperity + Gift of Prowess + Gift of Dedication'));

const WVW_ARMOR = TRIUMPHANT.map(p => piece('wvw', 2, 'WvW', 'WvW', p, [
  { itemId: null, name: `${p[3]} (Ascended)`, count: 1, source: 'wvw', accountBound: true,
    note: 'Ascended precursor — bought from WvW armor vendors (Grandmaster Armorsmith/Leatherworker/Tailor Marks + WvW Skirmish Claim Tickets + 250 Memory of Battle + 2 gold)', inputs: [] },
  { ...GIFT_OF_WAR_PROSPERITY }, { ...GIFT_OF_WAR_PROWESS }, { ...GIFT_OF_WAR_DEDICATION },
], 'Mystic Forge: ascended Triumphant piece + Gift of War Prosperity + Gift of War Prowess + Gift of War Dedication'));

const PVP_ARMOR = GLORIOUS.map(p => piece('pvp', 3, 'PvP', 'PvP', p, [
  { itemId: null, name: `${p[3]} (Ascended)`, count: 1, source: 'currency', accountBound: true,
    note: 'Ascended precursor — Ascended Armor League Vendor (Ascended Shards of Glory + Shards of Glory + Grandmaster Marks + 2 gold)', inputs: [] },
  { ...GIFT_OF_COMPETITIVE_PROSPERITY }, { ...GIFT_OF_COMPETITIVE_PROWESS }, { ...GIFT_OF_COMPETITIVE_DEDICATION },
], 'Mystic Forge: ascended Glorious piece + Gift of Competitive Prosperity + Gift of Competitive Prowess + Gift of Competitive Dedication'));

const OBSIDIAN_ARMOR = OBSIDIAN.map(p => {
  const [aid, aname] = ARCANUM[p[1]];
  const magical = ['Helm', 'Shoulders', 'Chest'].includes(p[1]);
  return piece('obsidian', 4, 'Obsidian', 'Secrets of the Obscure', p, [
    { itemId: aid, name: aname, count: 1, source: 'currency', accountBound: true, note: 'Bought from Lyhr (Wizard’s Tower) for 1 Lesser Vision Crystal after the matching Astral achievement', inputs: [] },
    { ...GIFT_OF_EXPERTISE }, { ...GIFT_OF_STORMY_SKIES }, prosperityObsidian(magical),
  ], `Crafted (${DISCIPLINE[p[0]]} 500, Recipe: Legendary Obsidian Armor from Lyhr) [API verified Oct 2026]`);
});

const EIKASIA = [['Light', 105317], ['Medium', 105293], ['Heavy', 105171]].map(([w, id]) =>
  piece('eikasia', 5, 'Fractals', 'Fractals', [w, 'Gloves', id, 'Eikasia, Mists-Grasper'], [
    { itemId: null, idName: 'Fractalline Spark', name: 'Fractalline Spark', count: 1, source: 'collection', accountBound: true, note: 'Incursive Investigation: Infinite Recursion (150 Fractalline Dust from Quickplay Fractals)', inputs: [] },
    prosperityObsidian(true), prosperityObsidian(false),
    { itemId: 19676, name: 'Icy Runestone', count: 200, source: 'vendor', accountBound: true, note: '1 gold each', inputs: [] },
  ], 'First weight class is free from the Incursive Investigation achievement; extra weights are bought from Mist Stranger for these items [wiki verified Oct 2026]'));

const SELACHIMORPHA = [['Light', 105921], ['Medium', 106658], ['Heavy', 106178]].map(([w, id]) =>
  piece('selachimorpha', 5, 'VoE', 'Visions of Eternity', [w, 'Aquatic Helm', id, 'Selachimorpha'], [
    { itemId: null, idName: 'Agaleus', name: 'Agaleus', count: 1, source: 'collection', accountBound: true, note: 'Precursor — Legendary Armor achievement "Acquiring Agaleus" (24 steps)', inputs: [] },
    { itemId: null, idName: 'Gift of the Survivors', name: 'Gift of the Survivors', count: 1, source: 'currency', accountBound: true, note: 'Castaway Agnes — Concentrated Chromatic Sap + Shipwreck Strand exploration gift + Survivor’s Enchanted Compass + 500 Aether-Rich Sap', inputs: [] },
    { itemId: null, idName: 'Gift of the People', name: 'Gift of the People', count: 1, source: 'currency', accountBound: true, note: 'Canach — Patron of the Magical Arts Plaque + Starlit Weald exploration gift + Seer Wreath of Service + 500 Antiquated Ducat', inputs: [] },
    { itemId: null, idName: 'Gift of Castoran Mastery', name: 'Gift of Castoran Mastery', count: 1, source: 'forge', accountBound: true, note: 'Gift of Adventure (2 Vision Crystal + 55 Mystic Clover + 100 Tale of Adventure + 500 Unusual Coin) + more', inputs: [] },
    { itemId: null, idName: 'Gift of the Seas', name: 'Gift of the Seas', count: 1, source: 'forge', accountBound: true, note: 'Gift of the Tides (Path of Divinity story) + 2 Gift of Research + 2 Gift of Condensed Might/Magic', inputs: [] },
  ], 'PARTIAL — structure from the wiki material list; exact nesting still being verified'));

export const LEGENDARY_ARMOR_RECIPES = [
  ...RAID_ARMOR, ...WVW_ARMOR, ...PVP_ARMOR, ...OBSIDIAN_ARMOR, ...EIKASIA, ...SELACHIMORPHA,
];
for (const r of [...EIKASIA, ...SELACHIMORPHA]) r.dataStatus = 'partial';
for (const r of PVP_ARMOR) r.dataStatus = 'partial'; // Gift of Competitive Prowess still unverified

const ARMOR_SLOTS = ['Helm', 'Shoulders', 'Chest', 'Gloves', 'Leggings', 'Boots', 'Aquatic Helm'];
export const ARMOR_WEIGHT_CLASSES = ['All', 'Light', 'Medium', 'Heavy'];
export const ARMOR_SLOTS_LIST = ['All', ...ARMOR_SLOTS];
export const ARMOR_GENERATIONS = ['All', '1 (Raids)', '2 (WvW)', '3 (PvP)', '4 (Obsidian)', '5 (Other)'];
