/**
 * Character snapshot — everything the Characters tab (and later the in-game
 * overlay) needs, in one compact, cacheable object:
 *
 *   - every character's bags and equipment templates (gear, stats, upgrades,
 *     infusions, skins)
 *   - bank, shared inventory slots, material storage, Legendary Armory
 *   - item / itemstat / skin name lookups for everything above
 *
 * Kept separate from App.jsx's live-update waves on purpose: the main load
 * fetches /characters without a schema version (so no equipment templates),
 * and this data is only needed when someone opens the Characters tab. It is
 * fetched lazily, cached in app_cache under SNAPSHOT_CACHE_KEY, and reused for
 * SNAPSHOT_MAX_AGE_MS before refetching.
 *
 * API key permissions used:
 *   characters  — character list, levels, professions
 *   inventories — bags, bank, shared slots, material storage
 *   builds      — equipment and equipment templates (NEW requirement)
 *   unlocks     — Legendary Armory (also needs inventories)
 * Missing permissions are reported in snapshot.missingPerms so the UI can say
 * exactly what to fix instead of showing empty panels.
 */
import { apiFetch, publicFetch, fetchIds, BASE } from "./gw2Api.js";
import { cacheSet, cacheGet } from "./storage.js";

export const SNAPSHOT_CACHE_KEY = "characterSnapshot";
export const SNAPSHOT_MAX_AGE_MS = 5 * 60_000;

// Newest response format: adds equipment_tabs, per-item `tabs`/`location`, and
// Legendary Armory locations. Older formats omit templates entirely.
const SCHEMA_VERSION = "latest";

export const REQUIRED_PERMS = ["characters", "inventories", "builds"];

// Weapon types (items' details.type) that occupy both hands of a weapon set.
const TWO_HANDED = new Set(["Greatsword", "Hammer", "LongBow", "Rifle", "ShortBow", "Staff"]);

const slotOf = (s) => (s && s.id ? { id: s.id, count: s.count || 1, binding: s.binding, boundTo: s.bound_to } : null);

function gearOf(e) {
  return {
    id: e.id,
    slot: e.slot,
    statId: e.stats?.id || null,
    upgrades: e.upgrades || [],
    infusions: e.infusions || [],
    skin: e.skin || null,
    location: e.location || null,
    binding: e.binding || null,
  };
}

/**
 * Turns a raw /characters?v=latest entry into equipment templates.
 * Items with a `tabs` list belong to those templates. Items without one
 * (gathering tools, jade bot core, and similar) are character-wide, so they
 * are shown on every template that doesn't have its own item in that slot.
 */
function buildTemplates(char) {
  const charWide = (char.equipment || []).filter((e) => !Array.isArray(e.tabs));
  const tabs = Array.isArray(char.equipment_tabs) ? char.equipment_tabs : [];

  if (tabs.length === 0) {
    // Older response or no templates: everything currently equipped as one template.
    if (!char.equipment?.length) return [];
    const gear = {};
    for (const e of char.equipment) gear[e.slot] = gearOf(e);
    return [{ tab: 1, name: "Equipped", active: true, gear }];
  }

  return tabs.map((t) => {
    const gear = {};
    for (const e of t.equipment || []) gear[e.slot] = gearOf(e);
    for (const e of charWide) if (!gear[e.slot]) gear[e.slot] = gearOf(e);
    return {
      tab: t.tab,
      name: t.name || `Template ${t.tab}`,
      active: !!t.is_active || char.active_equipment_tab === t.tab,
      gear,
    };
  });
}

function trimItem(i) {
  const d = i.details || {};
  return {
    name: i.name,
    icon: i.icon,
    rarity: i.rarity,
    type: i.type,
    weaponType: i.type === "Weapon" ? d.type : undefined,
    // Fixed-stat gear carries its stats here instead of on the equipment entry.
    statId: d.infix_upgrade?.id || undefined,
  };
}

/** Fetches a fresh snapshot from the GW2 API. Throws only if characters can't be read at all. */
export async function fetchCharacterSnapshot(knownItems = {}) {
  const tokeninfo = await apiFetch(`${BASE}/tokeninfo`).catch(() => null);
  const perms = tokeninfo ? new Set(tokeninfo.permissions || []) : null;
  const has = (p) => !perms || perms.has(p); // unknown → try anyway
  const missingPerms = perms ? REQUIRED_PERMS.filter((p) => !perms.has(p)) : [];

  if (!has("characters")) {
    return emptySnapshot(missingPerms);
  }

  const [rawChars, rawBank, rawShared, rawMats, rawArmory, matCats] = await Promise.all([
    apiFetch(`${BASE}/characters?ids=all&v=${SCHEMA_VERSION}`),
    has("inventories") ? apiFetch(`${BASE}/account/bank`).catch(() => null) : null,
    has("inventories") ? apiFetch(`${BASE}/account/inventory`).catch(() => null) : null,
    has("inventories") ? apiFetch(`${BASE}/account/materials`).catch(() => null) : null,
    has("inventories") && has("unlocks") ? apiFetch(`${BASE}/account/legendaryarmory`).catch(() => null) : null,
    publicFetch(`${BASE}/materials?ids=all`).catch(() => []),
  ]);

  const characters = (Array.isArray(rawChars) ? rawChars : []).map((c) => ({
    name: c.name,
    race: c.race,
    profession: c.profession,
    level: c.level,
    bags: (c.bags || []).map((b) => (b ? { id: b.id, size: b.size, slots: (b.inventory || []).map(slotOf) } : null)),
    templates: buildTemplates(c),
  }));

  const catName = Object.fromEntries((matCats || []).map((m) => [m.id, { name: m.name, order: m.order }]));
  const matGroups = {};
  for (const m of rawMats || []) {
    if (!m || !m.count) continue;
    (matGroups[m.category] ||= []).push({ id: m.id, count: m.count });
  }
  const materials = Object.entries(matGroups)
    .map(([cat, slots]) => ({ category: Number(cat), name: catName[cat]?.name || "Other materials", order: catName[cat]?.order ?? 999, slots }))
    .sort((a, b) => a.order - b.order);

  // ── Name lookups ──
  const allIds = new Set();
  const gearIds = new Set();
  const statIds = new Set();
  const skinIds = new Set();
  const addSlots = (arr) => (arr || []).forEach((s) => s && allIds.add(s.id));
  for (const c of characters) {
    for (const b of c.bags) if (b) { allIds.add(b.id); addSlots(b.slots); }
    for (const t of c.templates) {
      for (const g of Object.values(t.gear)) {
        gearIds.add(g.id);
        g.upgrades.forEach((u) => gearIds.add(u));
        g.infusions.forEach((u) => gearIds.add(u));
        if (g.statId) statIds.add(g.statId);
        if (g.skin) skinIds.add(g.skin);
      }
    }
  }
  const bank = (rawBank || []).map(slotOf);
  const shared = (rawShared || []).map(slotOf);
  const armory = (rawArmory || []).filter((a) => a && a.count > 0).map((a) => ({ id: a.id, count: a.count }));
  addSlots(bank); addSlots(shared);
  materials.forEach((g) => addSlots(g.slots));
  armory.forEach((a) => gearIds.add(a.id));

  // Gear needs full details (weapon type, fixed stats), so always fetch it.
  // Everything else can reuse names the app already has in its itemMap.
  const items = {};
  for (const id of allIds) {
    const k = knownItems[id];
    if (k && k.name) items[id] = { name: k.name, icon: k.icon, rarity: k.rarity, type: k.type };
  }
  const toFetch = [...new Set([...gearIds, ...[...allIds].filter((id) => !items[id])])];
  const fetched = await fetchIds("/items", toFetch);
  for (const i of fetched) {
    items[i.id] = trimItem(i);
    if (gearIds.has(i.id) && i.details?.infix_upgrade?.id) statIds.add(i.details.infix_upgrade.id);
  }

  const [rawStats, rawSkins] = await Promise.all([
    fetchIds("/itemstats", [...statIds]),
    fetchIds("/skins", [...skinIds]),
  ]);
  const stats = Object.fromEntries(rawStats.map((s) => [s.id, s.name]));
  const skins = Object.fromEntries(rawSkins.map((s) => [s.id, s.name]));

  const snapshot = { ts: Date.now(), missingPerms, characters, bank, shared, materials, armory, items, stats, skins };
  cacheSet(SNAPSHOT_CACHE_KEY, snapshot);
  return snapshot;
}

function emptySnapshot(missingPerms) {
  return { ts: Date.now(), missingPerms, characters: [], bank: [], shared: [], materials: [], armory: [], items: {}, stats: {}, skins: {} };
}

/** Cached snapshot, or null. `stale` is true once it's older than SNAPSHOT_MAX_AGE_MS. */
export async function loadCachedSnapshot() {
  const entry = await cacheGet(SNAPSHOT_CACHE_KEY);
  if (!entry?.value?.characters) return null;
  return { snapshot: entry.value, stale: Date.now() - (entry.value.ts || 0) > SNAPSHOT_MAX_AGE_MS };
}

// ── Helpers shared by the tab and the overlay ────────────────────────────────

export const ARMOR_SLOTS = [
  ["Helm", "Head"], ["Shoulders", "Shoulders"], ["Coat", "Chest"],
  ["Gloves", "Gloves"], ["Leggings", "Legs"], ["Boots", "Boots"],
];
export const TRINKET_SLOTS = [
  ["Backpack", "Back"], ["Amulet", "Amulet"], ["Accessory1", "Accessory 1"],
  ["Accessory2", "Accessory 2"], ["Ring1", "Ring 1"], ["Ring2", "Ring 2"],
];
export const OTHER_SLOT_GROUPS = [
  { label: "Weapon set 1", slots: [["WeaponA1", "Main hand"], ["WeaponA2", "Off hand"]] },
  { label: "Weapon set 2", slots: [["WeaponB1", "Main hand"], ["WeaponB2", "Off hand"]] },
  { label: "Relic", slots: [["Relic", "Relic"]] },
  { label: "Aquatic", slots: [["HelmAquatic", "Breather"], ["WeaponAquaticA", "Weapon 1"], ["WeaponAquaticB", "Weapon 2"]] },
  { label: "Gathering", slots: [["Sickle", "Sickle"], ["Axe", "Axe"], ["Pick", "Pick"]] },
];

/** True when `slot` is an off-hand blocked by a two-handed main hand in the same set. */
export function isBlockedOffhand(gear, slot, items) {
  const main = slot === "WeaponA2" ? gear.WeaponA1 : slot === "WeaponB2" ? gear.WeaponB1 : null;
  return !!(main && TWO_HANDED.has(items[main.id]?.weaponType));
}

/** Stat combo name for a piece of gear (selectable stats first, then fixed item stats). */
export function gearStatName(g, snapshot) {
  const id = g.statId || snapshot.items[g.id]?.statId;
  return id ? snapshot.stats[id] || null : null;
}

/**
 * Every owned stack on the account as flat rows, for search:
 * { id, count, where, kind, char? } — kind is Characters | Equipped | Bank | Materials | Shared | Armory.
 */
export function flattenOwned(snapshot) {
  const rows = [];
  for (const c of snapshot.characters) {
    c.bags.forEach((b, bi) => b && b.slots.forEach((s, si) => {
      if (s) rows.push({ id: s.id, count: s.count, where: `${c.name}, bag ${bi + 1} slot ${si + 1}`, kind: "Characters", char: c.name });
    }));
    const seen = {};
    for (const t of c.templates) {
      for (const g of Object.values(t.gear)) {
        if (g.location === "LegendaryArmory" || g.location === "EquippedFromLegendaryArmory") continue; // counted under Armory
        const key = `${g.id}|${g.slot}`;
        (seen[key] ||= { id: g.id, slot: g.slot, tabs: [] }).tabs.push(t.name);
      }
    }
    for (const s of Object.values(seen)) {
      rows.push({ id: s.id, count: 1, where: `${c.name}, equipped (${s.tabs.join(", ")})`, kind: "Equipped", char: c.name });
    }
  }
  snapshot.bank.forEach((s, i) => s && rows.push({ id: s.id, count: s.count, where: `Bank tab ${Math.floor(i / 30) + 1}, slot ${(i % 30) + 1}`, kind: "Bank" }));
  for (const g of snapshot.materials) for (const s of g.slots) rows.push({ id: s.id, count: s.count, where: `Material storage, ${g.name}`, kind: "Materials" });
  snapshot.shared.forEach((s, i) => s && rows.push({ id: s.id, count: s.count, where: `Shared slot ${i + 1}`, kind: "Shared" }));
  for (const a of snapshot.armory) rows.push({ id: a.id, count: a.count, where: "Legendary Armory", kind: "Armory" });
  return rows;
}
