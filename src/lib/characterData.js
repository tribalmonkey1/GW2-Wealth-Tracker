/**
 * Character inventory / discipline / wallet-currency extraction from raw
 * GW2 API character and wallet responses.
 * (Split out of App.jsx.)
 */

export function extractCharacterItems(characters) {
  const counts = {};
  for (const char of characters) {
    for (const bag of (char.bags || [])) {
      if (!bag) continue;
      for (const slot of (bag.inventory || [])) {
        if (!slot || !slot.id || slot.count <= 0) continue;
        counts[slot.id] = (counts[slot.id] || 0) + slot.count;
      }
    }
  }
  return counts;
}

export function extractCharacterItemsByChar(characters) {
  const byChar = {};
  for (const char of characters) {
    const counts = {};
    for (const bag of (char.bags || [])) {
      if (!bag) continue;
      for (const slot of (bag.inventory || [])) {
        if (!slot || !slot.id || slot.count <= 0) continue;
        counts[slot.id] = (counts[slot.id] || 0) + slot.count;
      }
    }
    if (Object.keys(counts).length > 0) byChar[char.name] = counts;
  }
  return byChar;
}

export function extractCharacterDisciplines(characters) {
  const byChar = {};
  for (const char of characters) {
    const discs = (char.crafting || []).map(c => c.discipline);
    if (discs.length > 0) byChar[char.name] = discs;
  }
  return byChar;
}

// Extract forge-relevant currencies from wallet by fetching currency names once
// Returns { spirit_shards, volatile_magic, unbound_magic, karma, laurels }
let _currencyMap = null; // name(lowercase) -> currency_id, cached after first fetch

export const CURRENCY_IDS = {
  spirit_shards:  23,
  volatile_magic: 45,
  unbound_magic:  32,
  karma:          2,
  laurels:        3,
};

export function extractForgeWallet(walletArr) {
  if (!Array.isArray(walletArr)) return {};
  const get = (id) => walletArr.find(w => w.id === id)?.value || 0;
  return {
    spirit_shards:  get(CURRENCY_IDS.spirit_shards),
    volatile_magic: get(CURRENCY_IDS.volatile_magic),
    unbound_magic:  get(CURRENCY_IDS.unbound_magic),
    karma:          get(CURRENCY_IDS.karma),
    laurels:        get(CURRENCY_IDS.laurels),
  };
}
