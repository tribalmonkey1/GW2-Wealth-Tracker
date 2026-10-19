/**
 * Standalone legendary weapons added after End of Dragons (Oct 2026).
 *  - Klobjarne Geirr (Janthir Wilds spear)
 *  - Ancora Pax (staff) + Ancora Bellum (spear) — both come from ONE Aetheric Anchor (Visions of Eternity)
 *  - Wages of Stars (Visions of Eternity sword) — recipe not yet verified
 *
 * Item IDs from the GW2 API /v2/legendaryarmory + /v2/items; recipes from each item's wiki page.
 * Many Janthir / VoE gifts can also be bought from Ward Crafter Lucirae (Moon Camp Covert) for the
 * same materials + Glob(s) of Ectoplasm; the Mystic Forge recipe is what's modelled here.
 */
import { MYSTIC_TRIBUTE, GIFT_OF_METAL } from "./legendary-data.js";
import { GIFT_OF_THE_MISTS } from "./legendary-data-gen2.js";
import { GIFT_OF_RESEARCH } from "./legendary-data-gen3.js";
import { GIFT_OF_EXPERTISE } from "./legendary-data-armor.js";
import { GIFT_OF_THE_SURVIVORS, GIFT_OF_THE_PEOPLE } from "./legendary-data-voe-gifts.js";

const CONDENSED_MAGIC = MYSTIC_TRIBUTE.inputs.find(i => i.name === 'Gift of Condensed Magic');
const CONDENSED_MIGHT = MYSTIC_TRIBUTE.inputs.find(i => i.name === 'Gift of Condensed Might');

const tp = (itemId, name, count, note) => ({ itemId, name, count, source: 'tp', ...(note ? { note } : {}), inputs: [] });
const named = (name, count, source, note, inputs = [], itemId = null) =>
  ({ itemId, idName: itemId ? undefined : name, name, count, source, accountBound: true, note, inputs });
const cur = (name, count, note) => named(name, count, 'currency', note);
const BLOODSTONE = { itemId: 20797, name: 'Bloodstone Shard', count: 1, source: 'spirit_shard', accountBound: true, note: '200 Spirit Shards from Miyani', inputs: [] };
const MYSTIC_RUNESTONES = { itemId: 79418, name: 'Mystic Runestone', count: 100, source: 'vendor', accountBound: true, note: '1 gold each from Miyani / Mystic Forge Attendant', inputs: [] };
const condensed = (gift, n) => ({ ...gift, count: n });
// Same tree as the Gen 2 Hobbs precursors (legendary-data-gen2.js) — was a bare
// 'craft' leaf, which left Gift of Sharpened Tip showing "no price".
const VISION_CRYSTAL = { itemId: 46746, name: 'Vision Crystal', count: 1, source: 'forge', accountBound: true,
  note: 'Crafted (Artificer, Weaponsmith, Huntsman 400+): 5 Dragonite Ingot + 5 Empyreal Star + Augur’s Stone + 5 Bloodstone Brick',
  inputs: [
    { itemId: 46732, name: 'Dragonite Ingot', count: 5, source: 'currency', note: 'Account-bound — refined from Dragonite Ore', inputs: [] },
    { itemId: 46734, name: 'Empyreal Star', count: 5, source: 'currency', note: 'Account-bound — refined from Empyreal Fragments', inputs: [] },
    { itemId: 46752, name: "Augur's Stone", count: 1, source: 'spirit_shard', note: '20 Spirit Shards from Miyani', inputs: [] },
    { itemId: 46730, name: 'Bloodstone Brick', count: 5, source: 'forge', accountBound: true, note: 'Crafted (Artificer, Weaponsmith, Huntsman 450)',
      inputs: [
        { itemId: 46731, name: 'Pile of Bloodstone Dust', count: 100, source: 'currency', note: 'Account-bound — salvaged from ascended gear / fractal rewards', inputs: [] },
        { itemId: 19925, name: 'Obsidian Shard', count: 2, source: 'karma', note: '1,050 Karma each', inputs: [] },
        { itemId: 46747, name: 'Thermocatalytic Reagent', count: 10, source: 'vendor', note: '1s 50c from master craftsmen', inputs: [] },
      ] },
  ] };

// ── Klobjarne Geirr [wiki verified Oct 2026] ─────────────────────────────────────
const KLOBJARNE_GEIRR = {
  id: 'legendary_klobjarne_geirr', name: 'Klobjarne Geirr', itemId: 103815,
  rarity: 'Legendary', weaponType: 'Spear', generation: 3, expansion: 'Janthir Wilds',
  note: 'Mystic Forge: Nyr Hrammr + Gift of Klobjarne Geirr + Gift of Janthir Wilds + Gift of the Homesteader',
  inputs: [
    named('Nyr Hrammr', 1, 'forge', 'Precursor — Mystic Forge: Gift of Sharpened Tip + Gift of Metal + Standing Stones Timepiece + Valkyrie Bearkin War Helm (Remnant versions also accepted)', [
      named('Gift of Sharpened Tip', 1, 'forge', 'Mystic Forge: 6 Deldrimor Steel Spear Head + 6 Large Spiritwood Haft + 6 Vision Crystal + Memory of Bearkin\'s Adversaries', [
        // Ascended weapon components — recipes from /v2/recipes 7804 / 7800 (Weaponsmith 500) [API verified Oct 2026]
        named('Deldrimor Steel Spear Head', 6, 'craft', 'Crafted (Weaponsmith 500): 3 Deldrimor Steel Ingot + 5 Pile of Crystalline Dust + 50 Thermocatalytic Reagent', [
          tp(46738, 'Deldrimor Steel Ingot', 3), tp(24277, 'Pile of Crystalline Dust', 5),
          { itemId: 46747, name: 'Thermocatalytic Reagent', count: 50, source: 'vendor', note: '1s 50c from master craftsmen', inputs: [] },
        ], 45853),
        named('Large Spiritwood Haft', 6, 'craft', 'Crafted (Weaponsmith 500): 2 Spiritwood Plank + 5 Pile of Crystalline Dust + 50 Thermocatalytic Reagent', [
          tp(46736, 'Spiritwood Plank', 2), tp(24277, 'Pile of Crystalline Dust', 5),
          { itemId: 46747, name: 'Thermocatalytic Reagent', count: 50, source: 'vendor', note: '1s 50c from master craftsmen', inputs: [] },
        ], 45849),
        { ...VISION_CRYSTAL, count: 6 },
        named("Memory of Bearkin's Adversaries", 1, 'collection', 'Janthir Wilds collection reward'),
      ], 103308),
      { ...GIFT_OF_METAL },
      named('Standing Stones Timepiece', 1, 'collection', 'Janthir Wilds collection item (or its Remnant)'),
      named('Valkyrie Bearkin War Helm', 1, 'collection', 'Janthir Wilds collection item — any weight (or Bearkin War Helm Remnant)'),
    ], 103973),
    named('Gift of Klobjarne Geirr', 1, 'forge', 'Mystic Forge: Gift of Recollector of Memories + 100 Mystic Runestone + Gift of the Mists + Gift of Research', [
      named('Gift of Recollector of Memories', 1, 'forge', 'Mystic Forge: 25 Tale of Adventure + Gift of Bones + Memory of the Bearkin\'s Hunts + Memory of the Bearkin\'s Victories', [
        { itemId: 96151, name: 'Tale of Adventure', count: 25, source: 'currency', accountBound: true, note: 'Story reward currency', inputs: [] },
        named('Gift of Bones', 1, 'craft', 'Crafted: 100 Ancient Bone + 250 Large Bone + 50 Heavy Bone + 50 Bone', [
          tp(24358, 'Ancient Bone', 100), tp(24341, 'Large Bone', 250), tp(24345, 'Heavy Bone', 50), tp(24344, 'Bone', 50),
        ], 71123),
        named("Memory of the Bearkin's Hunts", 1, 'collection', 'Janthir Wilds collection reward'),
        named("Memory of the Bearkin's Victories", 1, 'collection', 'Janthir Wilds collection reward'),
      ], 102342),
      { ...MYSTIC_RUNESTONES },
      { ...GIFT_OF_THE_MISTS },
      { ...GIFT_OF_RESEARCH },
    ], 102901),
    named('Gift of Janthir Wilds', 1, 'forge', 'Mystic Forge: Gift of Gatherer of the Hunt + Gift of Uncovered Grounds + Gift of Expertise + Bloodstone Shard', [
      named('Gift of Gatherer of the Hunt', 1, 'forge', 'Mystic Forge: 100 each of Sweet-Treated Pine Plank, Neutralized Titan Alloy, Shard of Lowland Shore, Shard of Janthir Syntri', [
        cur('Sweet-Treated Pine Plank', 100, 'Janthir Wilds refined map material'),
        cur('Neutralized Titan Alloy', 100, 'Janthir Wilds refined map material'),
        cur('Shard of Lowland Shore', 100, 'Lowland Shore map currency'),
        cur('Shard of Janthir Syntri', 100, 'Janthir Syntri map currency'),
      ], 102515),
      named('Gift of Uncovered Grounds', 1, 'forge', 'Mystic Forge: 100 Mursaat Runestone + Gift of Lowland Shore + Gift of Janthir Syntri + Gift of the Ursus', [
        tp(103351, 'Mursaat Runestone', 100),
        named('Gift of Lowland Shore', 1, 'exploration', 'Lowland Shore map completion'),
        named('Gift of Janthir Syntri', 1, 'exploration', 'Janthir Syntri map completion'),
        named('Gift of the Ursus', 1, 'heroics', 'Janthir Wilds masteries'),
      ], 102411),
      { ...GIFT_OF_EXPERTISE },
      { ...BLOODSTONE },
    ], 102514),
    named('Gift of the Homesteader', 1, 'forge', 'Mystic Forge: Gift of Embracing Refuge + Gift of Condensed Might + Gift of Condensed Magic + 38 Mystic Clover', [
      named('Gift of Embracing Refuge', 1, 'forge', 'Mystic Forge: 250 each of Refined Homestead Metal, Refined Homestead Fiber, Refined Homestead Wood, Shard of the Homestead', [
        cur('Refined Homestead Metal', 250, 'Homestead refinement'),
        cur('Refined Homestead Fiber', 250, 'Homestead refinement'),
        cur('Refined Homestead Wood', 250, 'Homestead refinement'),
        cur('Shard of the Homestead', 250, 'Homestead currency'),
      ], 103242),
      condensed(CONDENSED_MIGHT, 1),
      condensed(CONDENSED_MAGIC, 1),
      tp(19675, 'Mystic Clover', 38),
    ]),
  ],
};

// ── Aetheric Anchor → Ancora Pax + Ancora Bellum [wiki verified Oct 2026] ──────────
// ONE Aetheric Anchor (105497) gives BOTH weapons. Both cards show the full Anchor cost.
const AETHERIC_ANCHOR = named('Aetheric Anchor', 1, 'forge',
  'Mystic Forge: Gift of the Survivors + Gift of the People + Gift of Insight + Gift of the Elders — opens into BOTH Ancora Pax and Ancora Bellum', [
  { ...GIFT_OF_THE_SURVIVORS },
  { ...GIFT_OF_THE_PEOPLE },
  named('Gift of Insight', 1, 'vendor', 'Bought from Magister Sirkk (Starlit Weald) — NOT a Mystic Forge recipe (forging these items makes a Draconic Tribute instead)', [
    tp(19675, 'Mystic Clover', 100),
    tp(92687, 'Amalgamated Draconic Lodestone', 55),
    condensed(CONDENSED_MAGIC, 4),
    condensed(CONDENSED_MIGHT, 4),
  ]),
  named('Gift of the Elders', 1, 'vendor', 'Bought from Captain Emund (Starlit Weald)', [
    named('Gift of the Tides', 1, 'collection', 'Visions of Eternity story step Path of Divinity (extra copies: 50 gold + 300,000 Karma)'),
    { ...BLOODSTONE },
    { ...GIFT_OF_RESEARCH },
    { ...GIFT_OF_THE_MISTS },
  ]),
], 105497);

const ancora = (key, name, itemId, weaponType) => ({
  id: `legendary_${key}`, name, itemId,
  rarity: 'Legendary', weaponType, generation: 3, expansion: 'Visions of Eternity',
  note: 'Comes from an Aetheric Anchor, which gives BOTH Ancora Pax and Ancora Bellum — the cost shown covers the pair',
  inputs: [{ ...AETHERIC_ANCHOR }],
});

// ── Wages of Stars [wiki verified Oct 2026; item IDs API verified] ─────────────────
// Mystic Forge: Fledgling Constellation + Gift of the Tenebral Ward + Gift of Reality + Mystic Tribute.
// The two gifts are bought from Leyspring Hollows vendors (not forged); the precursor is
// an achievement reward from the Code of Creation story.
const vendorGold = (itemId, name, count, note) => ({ itemId, name, count, source: 'vendor', accountBound: true, note, inputs: [] });
const RESEARCH_NOTES = (n) => cur('Research Note', n, 'Wallet currency — salvage crafted items with the Research Kit');
const KARMA = (n) => ({ itemId: null, name: 'Karma', count: n, source: 'karma', accountBound: true, note: 'Karma — no gold cost', inputs: [] });
const SEER_RUNESTONE = named('Seer Runestone', 100, 'vendor',
  'Each: 1 Mystic Runestone + 10 Glob of Ectoplasm + 250 Research Note + 35,000 Karma (Acolyte of Balance Dexx, Snarlcrow, Historian Meliza, Steward Brizio)', [
    vendorGold(79418, 'Mystic Runestone', 1, '1 gold each'),
    tp(19721, 'Glob of Ectoplasm', 10),
    RESEARCH_NOTES(250),
    KARMA(35000),
  ], 109666);
const WAGES_OF_STARS = {
  id: 'legendary_wages_of_stars', name: 'Wages of Stars', itemId: 110020,
  rarity: 'Legendary', weaponType: 'Sword', generation: 3, expansion: 'Visions of Eternity',
  note: 'Mystic Forge: Fledgling Constellation + Gift of the Tenebral Ward + Gift of Reality + Mystic Tribute',
  inputs: [
    { ...named('Fledgling Constellation', 1, 'collection', 'Precursor — reward from the Code of Creation achievement "So Be It" (extra copies: 25 gold + 250 Shadowstone Research Data from VoE vendors)', [], 110142),
      isPrecursor: true, achievementName: 'So Be It', wikiPage: 'Fledgling Constellation' },
    named('Gift of the Tenebral Ward', 1, 'vendor', 'Bought from Astral Ward Agent Snarlcrow (Ordnance Depot, Leyspring Hollows) — needs his renown heart', [
      named('Banner of the Tenebral Ward', 1, 'vendor', 'Snarlcrow: 150 Mystic Runestone + 500 Shadowstone Fragment + 2,500 Chromatic Sap + 2,500 Raw Enchanting Stone', [
        vendorGold(79418, 'Mystic Runestone', 150, '1 gold each'),
        cur('Shadowstone Fragment', 500, 'Visions of Eternity map material'),
        cur('Chromatic Sap', 2500, 'Visions of Eternity map material'),
        cur('Raw Enchanting Stone', 2500, 'Visions of Eternity map material'),
      ], 110162),
      named('Gift of Shining Arms', 1, 'collection', 'Shining Ward Weapon Collector (unlock all 17 Shining Ward weapon skins). Extra copies: 25 gold + 300,000 Karma from VoE vendors', [], 110133),
      named('Gift of Tenebral Armor', 1, 'collection', 'Tenebral Ward Armor Collection (unlock all 6 Tenebral Ward armor skins). Extra copies: 25 gold + 300,000 Karma from VoE vendors', [], 110033),
      SEER_RUNESTONE,
    ], 110081),
    named('Gift of Reality', 1, 'vendor', 'Bought from Acolyte of Balance Dexx (Hall of Assemblage, Leyspring Hollows)', [
      named('Advanced Research Data Crystal', 1, 'vendor', 'Acolyte of Balance Dexx: 500 Shadowstone Research Data', [
        cur('Shadowstone Research Data', 500, 'Visions of Eternity map currency'),
      ], 110084),
      named('Gift of Leyspring Hollows Exploration', 1, 'exploration', 'Leyspring Hollows map completion (or 50 gold + 300,000 Karma from VoE vendors once completed)', [], 110122),
      { ...GIFT_OF_THE_MISTS },
      named('Mists Scrying Mirror', 1, 'collection', 'Leyspring Hollows Mastery achievement, tier 4 (36 map achievements). Extra copies: 50 gold + 300,000 Karma', [], 110148),
    ], 110008),
    { ...MYSTIC_TRIBUTE },
  ],
};

export const LEGENDARY_RECIPES_NEWER = [
  KLOBJARNE_GEIRR,
  ancora('ancora_pax', 'Ancora Pax', 105653, 'Staff'),
  ancora('ancora_bellum', 'Ancora Bellum', 106273, 'Spear'),
  WAGES_OF_STARS,
];
