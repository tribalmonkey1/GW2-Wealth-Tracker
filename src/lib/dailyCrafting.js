/**
 * Daily/weekly time-gated crafting: which items are API-tracked vs.
 * manually count-tracked, discipline eligibility, and reset-timestamp math.
 * (Split out of App.jsx.)
 */
import { manualDailyGetAll, manualDailySet as manualDailySetCount } from "./storage.js";

export const DAILY_CRAFT_MAP = {
  "charged_quartz_crystal":       { itemId: 43772, disciplines: ["Artificer","Jeweler"],                                     minRating: 400 },
  "glob_of_elder_spirit_residue": { itemId: 46744, disciplines: ["Artificer","Huntsman","Weaponsmith"],                      minRating: 450 },
  "lump_of_mithrilium":           { itemId: 46742, disciplines: ["Armorsmith","Weaponsmith","Artificer"],                    minRating: 400 },
  "spool_of_silk_weaving_thread": { itemId: 46740, disciplines: ["Tailor","Leatherworker","Armorsmith"],                     minRating: 400 },
  "spool_of_thick_elonian_cord":  { itemId: 46745, disciplines: ["Leatherworker","Huntsman","Tailor","Armorsmith"],          minRating: 400 },
};

export const DAILY_CRAFT_IDS = new Set(Object.values(DAILY_CRAFT_MAP).map(v => v.itemId));

export const MANUAL_DAILY_MAP = {
  // ── Mawdrey / Cultivated Vine chain (Dry Top recipes) ──
  "clay_pot":                          { itemId: 66913, disciplines: ["Artificer","Huntsman","Chef"],           minRating: 400 },
  "grow_lamp":                         { itemId: 66993, disciplines: ["Jeweler"],                               minRating: 400 },
  "plate_of_meaty_plant_food":         { itemId: 66917, disciplines: ["Huntsman"],                              minRating: 400 },
  "plate_of_piquant_plant_food":       { itemId: 66923, disciplines: ["Chef"],                                  minRating: 400 },
  "heat_stone":                        { itemId: 67015, disciplines: ["Armorsmith"],                            minRating: 500 },
  // ── Gift of Aurene / Dragon Hatchling Doll (legendary backpiece parts) ──
  "dragon_hatchling_doll_adornments":  { itemId: 79795, disciplines: ["Jeweler"],                               minRating: 400 },
  "dragon_hatchling_doll_eye":         { itemId: 79726, disciplines: ["Artificer"],                             minRating: 450 },
  "dragon_hatchling_doll_frame":       { itemId: 79817, disciplines: ["Huntsman"],                              minRating: 450 },
  "dragon_hatchling_doll_hide":        { itemId: 79790, disciplines: ["Leatherworker"],                         minRating: 450 },
  "gossamer_stuffing":                 { itemId: 79763, disciplines: ["Tailor"],                                minRating: 450 },
  // ── Halloween seasonal (only available during Halloween) ──
  "vial_of_maize_balm":                { itemId: 9808,  disciplines: ["Artificer"],                             minRating: 400, seasonal: true },
};

export const ALL_DAILY_ITEM_IDS = new Set([
  ...Object.values(DAILY_CRAFT_MAP).map(v => v.itemId),
                                   ...Object.values(MANUAL_DAILY_MAP).map(v => v.itemId),
]);

export const ALL_DAILY_CRAFT_IDS = new Set([
  ...Object.values(DAILY_CRAFT_MAP).map(v => v.itemId),
                                    ...Object.values(MANUAL_DAILY_MAP).map(v => v.itemId),
]);

export function buildTimegatedInfo(itemMap, disciplineLevels) {
  // API-tracked items (completion via /v2/account/dailycrafting)
  const apiItems = Object.entries(DAILY_CRAFT_MAP)
  .map(([key, info]) => {
    const qualDiscs = info.disciplines.filter(d => (disciplineLevels[d] || 0) >= info.minRating);
    const allDiscs = info.disciplines.map(d => ({ name: d, level: disciplineLevels[d] || 0, qualifies: (disciplineLevels[d] || 0) >= info.minRating }));
    const itemName = itemMap[info.itemId]?.name || key.replace(/_/g, " ");
    const icon = itemMap[info.itemId]?.icon || null;
    return { key, ...info, qualDiscs, allDiscs, name: itemName, icon, trackByCount: false };
  })
  .filter(r => r.qualDiscs.length > 0);

  // Manually-tracked items (completion via material count delta since reset)
  const manualItems = Object.entries(MANUAL_DAILY_MAP)
  .map(([key, info]) => {
    const qualDiscs = info.disciplines.filter(d => (disciplineLevels[d] || 0) >= info.minRating);
    const allDiscs = info.disciplines.map(d => ({ name: d, level: disciplineLevels[d] || 0, qualifies: (disciplineLevels[d] || 0) >= info.minRating }));
    const itemName = itemMap[info.itemId]?.name || key.replace(/_/g, " ");
    const icon = itemMap[info.itemId]?.icon || null;
    return { key, ...info, qualDiscs, allDiscs, name: itemName, icon, trackByCount: true };
  })
  .filter(r => r.qualDiscs.length > 0);

  return [...apiItems, ...manualItems].sort((a, b) => b.minRating - a.minRating || a.name.localeCompare(b.name));
}

export function normalizeDailyKey(s) {
  return s.toLowerCase().replace(/[\s\-]+/g, "_");
}

export const DAILY_CRAFT_MAP_LOWER = Object.fromEntries(
  Object.entries(DAILY_CRAFT_MAP).map(([k, v]) => [k.toLowerCase(), v])
);

export function buildDailyCraftedSet(dailyNames, itemMap) {
  const ids = new Set();
  console.log("[Daily] API returned:", dailyNames);
  for (const name of (dailyNames || [])) {
    const entry = DAILY_CRAFT_MAP[name] || DAILY_CRAFT_MAP_LOWER[name.toLowerCase()];
    if (entry) ids.add(entry.itemId);
    else console.log("[Daily] No map match for:", name);
  }
  console.log("[Daily] Matched crafted IDs:", [...ids]);
  return ids;
}

export function getDailyResetTs() {
  const now = new Date();
  const resetToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0);
  return now.getTime() >= resetToday ? resetToday : resetToday - 86400000;
}

export function getWeeklyResetTs() {
  const now = new Date();
  const nowMs = now.getTime();
  // Find the most recent Monday at 07:30 UTC
  const day = now.getUTCDay(); // 0=Sun, 1=Mon...
  const daysToMonday = (day === 0 ? 6 : day - 1); // days since last Monday
  const lastMonday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysToMonday, 7, 30, 0, 0);
  if (nowMs >= lastMonday) return lastMonday;
  return lastMonday - 7 * 86400000;
}

export function checkManualDailyCrafted(resetMap, currentOwnedMap, currentResetTs) {
  const crafted = new Set();
  for (const info of Object.values(MANUAL_DAILY_MAP)) {
    const id = info.itemId;
    const baseline = resetMap[id];
    if (!baseline) continue; // no baseline yet
    if (baseline.resetTs < currentResetTs) continue; // baseline from before this reset
    const countNow = currentOwnedMap[id] || 0;
    if (countNow > baseline.count) crafted.add(id);
  }
  return crafted;
}

export async function recordManualDailyBaseline(ownedMap) {
  const resetTs = getDailyResetTs();
  const existing = await manualDailyGetAll().catch(() => ({}));
  for (const info of Object.values(MANUAL_DAILY_MAP)) {
    const id = info.itemId;
    const existingEntry = existing[id];
    // Only record baseline if we don't have one for this reset yet
    // (prevents overwriting a higher count with a lower one mid-session)
    if (!existingEntry || existingEntry.resetTs < resetTs) {
      await manualDailySetCount(id, ownedMap[id] || 0, resetTs).catch(() => {});
    }
  }
}
