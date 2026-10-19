/**
 * Legendary data — item IDs, currency icons and wiki links for tree nodes that
 * were built by name only (Oct 2026 audit).
 *
 * Why this exists: many legendary tree nodes were written as
 * `{ itemId: null, idName: 'Gift of Research', … }` and only got an icon if that
 * exact item happened to already be in the item map. The Oct 2026 audit found 222
 * distinct names with no ID (Gift of Research, Draconic Tribute, every Gift of
 * Aurene's X and Poem, the Bearkin memories, Refined Envoy pieces, …) — so those
 * rows showed a blank icon, could not be priced from the TP and never credited
 * owned copies.
 *
 * Every ID below was looked up on the wiki (Has game id) and then confirmed
 * against the GW2 API /v2/items name — Oct 2026.
 *
 * This module fills the IDs in place on import, before App.jsx collects the
 * legendary item IDs for the icon prefetch and price fetch. Import it once for the
 * side effect: `import "./legendary-item-ids.js";`
 */
import { LEGENDARY_RECIPES } from "./legendary-data.js";
import { LEGENDARY_RECIPES_GEN2 } from "./legendary-data-gen2.js";
import { LEGENDARY_RECIPES_GEN3 } from "./legendary-data-gen3.js";
import { LEGENDARY_RECIPES_NEWER } from "./legendary-data-newer.js";
import { LEGENDARY_ARMOR_RECIPES } from "./legendary-data-armor.js";
import { LEGENDARY_OTHER_RECIPES } from "./legendary-data-other.js";

// Exact in-game name → item ID (wiki + /v2/items verified Oct 2026)
export const LEGENDARY_NAME_IDS = {
  // Visions of Eternity map materials (account-bound items, not wallet currencies)
  "Fledgling Constellation": 110142,
  "Chromatic Sap": 106385,
  "Raw Enchanting Stone": 105686,
  "Shadowstone Fragment": 109459,
  "Shadowstone Research Data": 110156,
  "Amalgamated Gemstone": 68063,
  "Amalgamated Rift Essence": 100930,
  "Askur Camping Cookout Backpiece": 104704,
  "Auric Ingot": 73537,
  "Binding of the Dragon": 104777,
  "Bolt of Damask": 46741,
  "Case of Captured Lightning": 100267,
  "Certificate of Heroics": 84099,
  "Certificate of Honor": 83620,
  "Certificate of Support": 77486,
  "Chak Egg": 72205,
  "Chunk of Ancient Ambergris": 96347,
  "Clot of Congealed Screams": 100098,
  "Concentrated Chromatic Sap": 105848,
  "Deldrimor Steel Ingot": 46738,
  "Deldrimor Steel Spear Head": 45853,
  "Draconic Tribute": 96137,
  "Elonian Leather Square": 46739,
  "Exotic Essence of Luck": 45178,
  "Fractalline Spark": 105196,
  "Funerary Incense": 86093,
  "Gift of Arid Mastery": 91041,
  "Gift of Ascension": 37070,
  "Gift of Aurene's Argument": 96493,
  "Gift of Aurene's Bite": 97027,
  "Gift of Aurene's Breath": 95922,
  "Gift of Aurene's Claw": 97066,
  "Gift of Aurene's Fang": 96790,
  "Gift of Aurene's Flight": 95777,
  "Gift of Aurene's Gaze": 97088,
  "Gift of Aurene's Insight": 97281,
  "Gift of Aurene's Persuasion": 97412,
  "Gift of Aurene's Rending": 97804,
  "Gift of Aurene's Scale": 96073,
  "Gift of Aurene's Tail": 95846,
  "Gift of Aurene's Weight": 96161,
  "Gift of Aurene's Wing": 96015,
  "Gift of Aurene's Wisdom": 97552,
  "Gift of Castoran Mastery": 105649,
  "Gift of Compassion": 91225,
  "Gift of Competitive Prowess": 82350,
  "Gift of Complex Emotions": 88909,
  "Gift of Craftsmanship": 77451,
  "Gift of Darkness": 19631,
  "Gift of Desert Mastery": 86036,
  "Gift of Gliding": 71311,
  "Gift of Infinity": 74377,
  "Gift of Insight": 105875,
  "Gift of Janthir Syntri": 102958,
  "Gift of Janthir Wanderlust": 104699,
  "Gift of Lowland Shore": 102929,
  "Gift of New Kaineng City": 95621,
  "Gift of Patience": 91193,
  "Gift of Prescience": 90985,
  "Gift of Rays": 107040,
  "Gift of Relics": 101519,
  "Gift of Research": 97655,
  "Gift of Runes": 89218,
  "Gift of Seitung Province": 96993,
  "Gift of Shadows": 104846,
  "Gift of Shipwreck Strand Exploration": 106467,
  "Gift of Sigils": 91449,
  "Gift of Skirmishing": 77485,
  "Gift of Starlit Weald Exploration": 106672,
  "Gift of Titan Understanding": 104791,
  "Gift of the Appetizer": 104965,
  "Gift of the Astral Ward": 100466,
  "Gift of the Chak": 74528,
  "Gift of the Competitor": 77509,
  "Gift of the Dessert": 104717,
  "Gift of the Echovald Forest": 97232,
  "Gift of the Elders": 106632,
  "Gift of the Entrée": 104932,
  "Gift of the Exalted": 76636,
  "Gift of the Feast": 104872,
  "Gift of the Homesteader": 102376,
  "Gift of the Hylek": 106986,
  "Gift of the Jungle": 70698,
  "Gift of the Mistburned Isles": 104962,
  "Gift of the Mursaat Ruins": 104763,
  "Gift of the Nuhoch": 76767,
  "Gift of the Pact": 78793,
  "Gift of the People": 105804,
  "Gift of the Seas": 106747,
  "Gift of the Side Course": 104839,
  "Gift of the Survivors": 106712,
  "Gift of the Tides": 106275,
  "Gift of the Ursus": 103236,
  "Glob of Condensed Spirit Energy": 83082,
  "Hardened Leather Section": 19732,
  "Hateful Sworl": 86104,
  "Jar of Distilled Glory": 82926,
  "Large Spiritwood Haft": 45849,
  "Legendary War Insight": 83584,
  "Memory of Battle": 71581,
  "Memory of Bearkin's Adversaries": 103793,
  "Memory of the Bearkin's Hunts": 103766,
  "Memory of the Bearkin's Victories": 103833,
  "Mist Core Fragment": 77531,
  "Mursaat Runestone": 103351,
  "Mystic Aspect": 89105,
  "Mystic Facet": 101540,
  "Mystic Mote": 89133,
  "Neutralized Titan Alloy": 102467,
  "Orichalcum Plated Dowel": 12988,
  "Orrax Contained": 104690,
  "Patron of the Magical Arts Plaque": 105933,
  "Perfect Mist Core": 77520,
  "Poem on Axes": 97160,
  "Poem on Daggers": 96187,
  "Poem on Greatswords": 96036,
  "Poem on Longbows": 97800,
  "Poem on Maces": 96035,
  "Poem on Pistols": 95809,
  "Poem on Scepters": 96173,
  "Poem on Shields": 95740,
  "Poem on Short Bows": 96849,
  "Poem on Staves": 95962,
  "Poem on Swords": 97335,
  "Poem on Torches": 97257,
  "Poem on Warhorns": 96341,
  "Pouch of Blue Pigment": 75694,
  "Pouch of Red Pigment": 71692,
  "Pouch of Stardust": 99964,
  "Pouch of Yellow Pigment": 71952,
  "Pristine Mist Essence": 75781,
  "Rare Essence of Luck": 45177,
  "Reclaimed Metal Plate": 74356,
  "Record of League Participation": 82471,
  "Refined Envoy Boots": 80177,
  "Refined Envoy Breastplate": 80648,
  "Refined Envoy Cowl": 80441,
  "Refined Envoy Gauntlets": 80673,
  "Refined Envoy Gloves": 80460,
  "Refined Envoy Greaves": 80127,
  "Refined Envoy Helmet": 80387,
  "Refined Envoy Jerkin": 80607,
  "Refined Envoy Leggings": 80675,
  "Refined Envoy Mantle": 80264,
  "Refined Envoy Mask": 80634,
  "Refined Envoy Pants": 80275,
  "Refined Envoy Pauldrons": 80236,
  "Refined Envoy Shoes": 80583,
  "Refined Envoy Shoulderpads": 80366,
  "Refined Envoy Tassets": 80427,
  "Refined Envoy Vambraces": 80658,
  "Refined Envoy Vestments": 80120,
  "Refined Homestead Fiber": 102306,
  "Refined Homestead Metal": 102205,
  "Refined Homestead Wood": 103049,
  "Salmon of Knowledge Backpiece": 102367,
  "Seer Wreath of Service": 106627,
  "Shard of Crystallized Mists Essence": 38024,
  "Shard of Glory": 70820,
  "Shard of Janthir Syntri": 103316,
  "Shard of Lowland Shore": 102569,
  "Shard of the Homestead": 103587,
  "Sheet of Coarse Paper": 72579,
  "Sheet of Premium Paper": 71148,
  "Solution: Unbound": 75469,
  "Spirit of the Upper Bound": 70642,
  "Standing Stones Timepiece": 103578,
  "Star of Glory": 83872,
  "Survivor's Enchanted Compass": 106370,
  "Sweet-Treated Pine Plank": 103103,
  "Thermocatalytic Reagent": 46747,
  "Third Order Mist Frame": 71885,
  "Unbound": 72309,
  "Unbound Wings": 72613,
  "Valkyrie Bearkin War Helm": 103257,
  "Wings of Ascension": 77536,
};

// Wallet currencies used in legendary trees: no item, so the icon comes from
// /v2/currencies (icon URLs copied from the API, Oct 2026).
const R = "https://render.guildwars2.com/file/";
export const LEGENDARY_CURRENCIES = {
  "Legendary Insight":       { currencyId: 70, icon: R + "6D33B7387BAF2E2CC9B5D37D1D1B01246AB6FA22/1302744.png" },
  "Research Note":           { currencyId: 61, icon: R + "BC2EACDA78BC950263F901E8EBA6E74D08E97E23/2596976.png" },
  "Research Notes":          { currencyId: 61, icon: R + "BC2EACDA78BC950263F901E8EBA6E74D08E97E23/2596976.png" },
  "Antiquated Ducat":        { currencyId: 81, icon: R + "F891B355BC31BD7B4103FE5DF9ACB2FCF928F4CB/3710051.png" },
  "Aether-Rich Sap":         { currencyId: 83, icon: R + "79F23C52AF0AA29A976877285FF904BCA2D122FE/3710050.png" },
  "Fine Rift Essence":       { currencyId: 78, icon: R + "41D633F8F0CCFAD7FDADEF7CE84BF7C312AA1B49/3630022.png" },
  "Rare Rift Essence":       { currencyId: 79, icon: R + "A6012206459C56680D1BD4D23E0B706F0B0AE40D/3630024.png" },
  "Masterwork Rift Essence": { currencyId: 80, icon: R + "E0A96441F8405ABEF06114BE750154583CF3B1D2/3630023.png" },
  "Unbound Magic":           { currencyId: 32, icon: R + "55CBF5154BC749F0BE7B01F9C75C04F2CD4BC561/1465799.png" },
  "Volatile Magic":          { currencyId: 45, icon: R + "57F51A1F62E3FBB7B5E02CBD7C9717371D1CC8F2/1894697.png" },
  "Provisioner Token":       { currencyId: 29, icon: R + "5CF6FC0B62554EBECAC6752AAFA2B8D80F726077/1302745.png" },
  "PvP League Ticket":       { currencyId: 30, icon: R + "DB05F5F20B94A3D12AF11041F60E194D66584957/1313248.png" },
  "Ascended Shards of Glory":{ currencyId: 33, icon: R + "1AAD230BF65AE92C000E0C18D26D404022092C35/1614710.png" },
  "Karma":                   { currencyId: 2,  icon: R + "94953FA23D3E0D23559624015DFEA4CFAA07F0E5/155026.png" },
  "Gold":                    { currencyId: 1,  icon: R + "98457F504BA2FAC8457F532C4B30EDC23929ACF9/619316.png" },
  "Unusual Coin":            { currencyId: 62, icon: R + "662D371A6C145EDDDA2DE6B53BC05F5F08CE386F/2596977.png" },
  "Elegy Mosaic":            { currencyId: 35, icon: R + "4C5D08BCD7F55B250B413F98A9FB4C323E3B0F93/1766338.png" },
  "Testimony of Castoran Heroics": { currencyId: 82, icon: R + "D6BC79630AFF64123ED10DF9D065CCA657E0767E/3710074.png" },
  "Spirit Shard":            { currencyId: 23, icon: R + "0AD608DE7FDEE0B909905C0AF9401321CF65CD94/1010701.png" },
};

// Wiki page for rows whose display name isn't a wiki page title (collection
// placeholders). Anything not listed links to its own name.
export const LEGENDARY_WIKI_PAGES = {
  "Conflux collections": "Conflux",
  "Stella Radians collections": "Stella Radians",
  "Strife Unending collections": "Strife Unending",
  "Transcendence collections": "Transcendence",
  "Warbringer collections": "Warbringer",
};

/** Wiki URL for a legendary tree node (collections, gifts, anything with a name). */
export function legendaryWikiUrl(node) {
  const title = node?.wikiPage || LEGENDARY_WIKI_PAGES[node?.name] || node?.achievementName || node?.idName || node?.name;
  if (!title) return null;
  // index.php?search= jumps straight to the page when the title exists and falls
  // back to search results (instead of a dead link) when it doesn't.
  return `https://wiki.guildwars2.com/index.php?search=${encodeURIComponent(title)}`;
}

// ── Source fixes from the live-API check (pass 3, Oct 2026) ────────────────────
// Leaves whose item IS on the Trading Post but were modelled as a no-gold source
// (so their cost was silently left out). They now price from the TP.
const TRADEABLE_LEAVES = new Set([
  70820,  // Shard of Glory
  71581,  // Memory of Battle
  96151,  // Tale of Adventure
  97790,  // Lamplighter's Badge
  102467, // Neutralized Titan Alloy
  102569, // Shard of Lowland Shore
  103103, // Sweet-Treated Pine Plank
  103316, // Shard of Janthir Syntri
  103587, // Shard of the Homestead
]);
// Leaves modelled as "buy on the TP" that are NOT on the TP (account-bound), so they
// showed "no price". They are now a no-gold source with a note on how to get them.
const NOT_ON_TP = {
  20000: "Gem Store (80 gems)",                                                   // Box o' Fun
  46683: 'Crafted from Crystalline Ore + Fulgurite + Glob of Ectoplasm + Amalgamated Gemstone', // Crystalline Ingot
  46731: 'Salvaged from ascended gear / fractal rewards',                         // Pile of Bloodstone Dust
  71994: 'Salvaged from ascended gear',                                            // Ball of Dark Energy
  72205: "Tangled Depths map reward",                                              // Chak Egg
  73537: 'Crafted from 30 Pile of Auric Dust + 30 Auric Sliver (Verdant Brink)',   // Auric Ingot
  74356: "Verdant Brink map reward",                                               // Reclaimed Metal Plate
  79280: 'Living World Season 3 map currency', 79469: 'Living World Season 3 map currency',
  79899: 'Living World Season 3 map currency', 80332: 'Living World Season 3 map currency',
  81127: 'Living World Season 3 map currency', 81706: 'Living World Season 3 map currency',
};
// Account-bound items with a fixed recipe: give the bare leaf its children so the cost is real.
const LEAF_RECIPES = {
  // Mystic Clover — guaranteed purchase from Miyani / Lyhr / Ward Crafter Lucirae
  19675: { source: 'vendor', note: 'Each: 3 Mystic Coin + 3 Obsidian Shard + 5 Glob of Ectoplasm + 3 Spirit Shards (Miyani / Lyhr)', inputs: () => [
    { itemId: 19976, name: 'Mystic Coin', count: 3, source: 'tp', inputs: [] },
    { itemId: 19925, name: 'Obsidian Shard', count: 3, source: 'karma', note: '1,050 Karma each', inputs: [] },
    { itemId: 19721, name: 'Glob of Ectoplasm', count: 5, source: 'tp', inputs: [] },
    { itemId: null, name: 'Spirit Shard', count: 3, source: 'spirit_shard', shardCost: { count: 1, shards: 1 }, accountBound: true, inputs: [] },
  ] },
  // Lump of Mithrillium — crafted (any 400 discipline)
  46742: { source: 'craft', note: 'Crafted: 50 Mithril Ingot + Glob of Ectoplasm + 10 Thermocatalytic Reagent', inputs: () => [
    { itemId: 19684, name: 'Mithril Ingot', count: 50, source: 'tp', inputs: [] },
    { itemId: 19721, name: 'Glob of Ectoplasm', count: 1, source: 'tp', inputs: [] },
    { itemId: 46747, name: 'Thermocatalytic Reagent', count: 10, source: 'vendor', note: '1s 50c from master craftsmen', inputs: [] },
  ] },
};
const NO_GOLD = new Set(['currency', 'collection', 'exploration', 'wvw', 'heroics', 'karma']);

/** Fill itemId / currency icon on every node that only has a name. Mutates in place. */
export function applyLegendaryItemIds(...recipeLists) {
  const seen = new Set();
  let filled = 0;
  const walk = (n) => {
    if (!n || typeof n !== "object" || seen.has(n)) return;
    seen.add(n);
    const key = n.idName || n.name;
    if (!n.itemId && key) {
      const id = LEGENDARY_NAME_IDS[key];
      const cur = LEGENDARY_CURRENCIES[key];
      if (id) { n.itemId = id; filled++; }
      else if (cur && !n.currencyId) { n.currencyId = cur.currencyId; n.iconUrl = cur.icon; filled++; }
    }
    if (!n.itemId && LEGENDARY_CURRENCIES[n.name] && !n.iconUrl) n.iconUrl = LEGENDARY_CURRENCIES[n.name].icon;
    const leaf = !(n.inputs && n.inputs.length);
    if (leaf && n.itemId) {
      if (TRADEABLE_LEAVES.has(n.itemId) && NO_GOLD.has(n.source)) { n.source = 'tp'; n.accountBound = false; }
      else if (NOT_ON_TP[n.itemId] && n.source === 'tp') { n.source = 'currency'; n.accountBound = true; n.note = n.note || NOT_ON_TP[n.itemId]; }
      else if (LEAF_RECIPES[n.itemId]) { const r = LEAF_RECIPES[n.itemId]; n.source = r.source; n.accountBound = true; n.note = r.note; n.inputs = r.inputs(); }
    }
    (n.anyOf || []).forEach(walk);
    (n.inputs || []).forEach(walk);
  };
  recipeLists.flat().forEach(walk);
  return filled;
}

export const LEGENDARY_IDS_FILLED = applyLegendaryItemIds(
  LEGENDARY_RECIPES, LEGENDARY_RECIPES_GEN2, LEGENDARY_RECIPES_GEN3, LEGENDARY_RECIPES_NEWER,
  LEGENDARY_ARMOR_RECIPES, ...Object.values(LEGENDARY_OTHER_RECIPES),
);
