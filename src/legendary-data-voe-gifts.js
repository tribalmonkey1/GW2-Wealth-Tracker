/**
 * Visions of Eternity gifts shared by Endless Summer, Selachimorpha and the Aetheric Anchor
 * (Ancora Pax / Bellum). Kept in their own module so the armor and trinket data files can
 * both import them without an import cycle. [wiki + API verified Oct 2026]
 */
const node = (itemId, name, count, source, note, inputs = []) => ({ itemId, name, count, source, accountBound: source !== 'tp', ...(note ? { note } : {}), inputs });
const gold = (n) => ({ itemId: null, name: 'Gold', count: n, source: 'vendor', vendorPrice: 10000, accountBound: true, note: 'Coin paid to the vendor', inputs: [] });
const karma = (n) => ({ itemId: null, name: 'Karma', count: n, source: 'karma', accountBound: true, inputs: [] });
const cur = (name, n, note) => ({ itemId: null, name, count: n, source: 'currency', accountBound: true, note, inputs: [] });
const voeGift = (itemId, name, src, how, gp) => node(itemId, name, 1, src, `${how} (extra copies: ${gp} gold + 300,000 Karma)`);

export const GIFT_OF_THE_SURVIVORS = node(106712, 'Gift of the Survivors', 1, 'vendor', 'Castaway Agnes (Shipwreck Strand): Concentrated Chromatic Sap + Gift of Shipwreck Strand Exploration + Survivor’s Enchanted Compass + 500 Aether-Rich Sap', [
  node(105848, 'Concentrated Chromatic Sap', 1, 'vendor', 'Tyrian Alliance Representative Sharpwhisker (needs Shipwreck Strand Mastery): 500 Chromatic Sap + 250 gold + 300,000 Karma', [
    node(106385, 'Chromatic Sap', 500, 'currency', 'Shipwreck Strand map material'), gold(250), karma(300000) ]),
  voeGift(106467, 'Gift of Shipwreck Strand Exploration', 'exploration', 'Shipwreck Strand map completion', 50),
  voeGift(106370, "Survivor's Enchanted Compass", 'collection', 'Shipwreck Strand Mastery achievement', 50),
  cur('Aether-Rich Sap', 500, 'Shipwreck Strand events, or consume 100 Chromatic Sap'),
]);

export const GIFT_OF_THE_PEOPLE = node(105804, 'Gift of the People', 1, 'vendor', 'Canach (Shipwreck Strand): Patron of the Magical Arts Plaque + Gift of Starlit Weald Exploration + Seer Wreath of Service + 500 Antiquated Ducat', [
  node(105933, 'Patron of the Magical Arts Plaque', 1, 'vendor', 'Huntmaster Arnorr (needs Starlit Weald Mastery): 500 Raw Enchanting Stone + 250 gold + 300,000 Karma', [
    node(105686, 'Raw Enchanting Stone', 500, 'currency', 'Starlit Weald map material'), gold(250), karma(300000) ]),
  voeGift(106672, 'Gift of Starlit Weald Exploration', 'exploration', 'Starlit Weald map completion', 50),
  voeGift(106627, 'Seer Wreath of Service', 'collection', 'Starlit Weald Mastery achievement', 50),
  cur('Antiquated Ducat', 500, 'Starlit Weald events, or consume 100 Raw Enchanting Stone'),
]);
