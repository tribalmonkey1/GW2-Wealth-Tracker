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

const CONDENSED_MAGIC = MYSTIC_TRIBUTE.inputs.find(i => i.name === 'Gift of Condensed Magic');
const CONDENSED_MIGHT = MYSTIC_TRIBUTE.inputs.find(i => i.name === 'Gift of Condensed Might');

const tp = (itemId, name, count, note) => ({ itemId, name, count, source: 'tp', ...(note ? { note } : {}), inputs: [] });
const named = (name, count, source, note, inputs = [], itemId = null) =>
  ({ itemId, idName: itemId ? undefined : name, name, count, source, accountBound: true, note, inputs });
const cur = (name, count, note) => named(name, count, 'currency', note);
const BLOODSTONE = { itemId: 20797, name: 'Bloodstone Shard', count: 1, source: 'spirit_shard', accountBound: true, note: '200 Spirit Shards from Miyani', inputs: [] };
const MYSTIC_RUNESTONES = { itemId: 79418, name: 'Mystic Runestone', count: 100, source: 'vendor', accountBound: true, note: '1 gold each from Miyani / Mystic Forge Attendant', inputs: [] };
const condensed = (gift, n) => ({ ...gift, count: n });

// ── Klobjarne Geirr [wiki verified Oct 2026] ─────────────────────────────────────
const KLOBJARNE_GEIRR = {
  id: 'legendary_klobjarne_geirr', name: 'Klobjarne Geirr', itemId: 103815,
  rarity: 'Legendary', weaponType: 'Spear', generation: 3, expansion: 'Janthir Wilds',
  note: 'Mystic Forge: Nyr Hrammr + Gift of Klobjarne Geirr + Gift of Janthir Wilds + Gift of the Homesteader',
  inputs: [
    named('Nyr Hrammr', 1, 'forge', 'Precursor — Mystic Forge: Gift of Sharpened Tip + Gift of Metal + Standing Stones Timepiece + Valkyrie Bearkin War Helm (Remnant versions also accepted)', [
      named('Gift of Sharpened Tip', 1, 'forge', 'Mystic Forge: 6 Deldrimor Steel Spear Head + 6 Large Spiritwood Haft + 6 Vision Crystal + Memory of Bearkin\'s Adversaries', [
        named('Deldrimor Steel Spear Head', 6, 'craft', 'Ascended weapon component (crafted, account-bound)'),
        named('Large Spiritwood Haft', 6, 'craft', 'Ascended weapon component (crafted, account-bound)'),
        { itemId: 46746, name: 'Vision Crystal', count: 6, source: 'craft', accountBound: true, note: 'Ascended craft (account-bound)', inputs: [] },
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
        cur('Mursaat Runestone', 100, 'Janthir Wilds vendor runestone'),
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
  named('Gift of the Survivors', 1, 'currency', 'Castaway Agnes (Shipwreck Strand)', [
    named('Concentrated Chromatic Sap', 1, 'currency', 'Tyrian Alliance Rep. Sharpwhisker: 500 Chromatic Sap + 250 gold + 300,000 Karma (needs Shipwreck Strand mastery) — 250g not included in cost'),
    named('Gift of Shipwreck Strand Exploration', 1, 'exploration', 'Shipwreck Strand map completion'),
    named("Survivor's Enchanted Compass", 1, 'collection', 'Shipwreck Strand mastery achievement (36 map achievements)'),
    cur('Aether-Rich Sap', 500, 'Shipwreck Strand events, or 100 Chromatic Sap'),
  ]),
  named('Gift of the People', 1, 'currency', 'Canach (Starlit Weald)', [
    named('Patron of the Magical Arts Plaque', 1, 'currency', 'Huntmaster Arnorr: 500 Raw Enchanting Stone + 250 gold + 300,000 Karma (needs Starlit Weald mastery) — 250g not included in cost'),
    named('Gift of Starlit Weald Exploration', 1, 'exploration', 'Starlit Weald map completion'),
    named('Seer Wreath of Service', 1, 'collection', 'Starlit Weald mastery achievement (36 map achievements)'),
    cur('Antiquated Ducat', 500, 'Starlit Weald events, or 100 Raw Enchanting Stone'),
  ]),
  named('Gift of Insight', 1, 'currency', 'Magister Sirkk — NOT a Mystic Forge recipe (forging these items makes a Draconic Tribute instead)', [
    tp(19675, 'Mystic Clover', 100),
    tp(92687, 'Amalgamated Draconic Lodestone', 55),
    condensed(CONDENSED_MAGIC, 4),
    condensed(CONDENSED_MIGHT, 4),
  ]),
  named('Gift of the Elders', 1, 'currency', 'Major Emund', [
    named('Gift of the Tides', 1, 'collection', 'Visions of Eternity story chapter 8 (Path of Divinity); later copies 50 gold + 300,000 Karma'),
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

// ── Wages of Stars — recipe not yet verified ─────────────────────────────────────
const WAGES_OF_STARS = {
  id: 'legendary_wages_of_stars', name: 'Wages of Stars', itemId: 110020,
  rarity: 'Legendary', weaponType: 'Sword', generation: 3, expansion: 'Visions of Eternity',
  dataStatus: 'unverified', statusNote: 'Only confirmed: it is a legendary sword that uses Mystic Tribute. The rest of the recipe could not be read from the wiki yet.',
  note: 'Recipe not yet verified — only the Mystic Tribute ingredient is confirmed',
  inputs: [
    { ...MYSTIC_TRIBUTE },
    named('Remaining ingredients — not yet verified', 1, 'craft', 'Check the Wages of Stars wiki page'),
  ],
};

export const LEGENDARY_RECIPES_NEWER = [
  KLOBJARNE_GEIRR,
  ancora('ancora_pax', 'Ancora Pax', 105653, 'Staff'),
  ancora('ancora_bellum', 'Ancora Bellum', 106273, 'Spear'),
  WAGES_OF_STARS,
];
