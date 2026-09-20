/**
 * GW2 API auto-completion support for zone Hero's Choice Chests.
 *
 * `/v2/account/mapchests` (requires an API key with account+progression — the
 * same permissions this app already requires elsewhere) returns the list of
 * Hero's Choice Chest API ids the account has claimed since the last daily
 * reset. Unlike `/v2/account/worldbosses` (see worldBossApiIds.js), this is
 * ZONE-level, not per-individual-event — one chest per zone per day, awarded
 * for completing that zone's meta chain — so it only gets wired to a Boss
 * Timers row below where the wiki confirms exactly ONE named event as the
 * chest's trigger.
 *
 * Deliberately NOT included, and why (verified against the wiki Sept 19
 * 2026, not guessed):
 * - The Desolation (`the_desolation_heros_choice_chest`): shared trigger
 *   between "Junundu Rising" and "Maws of Torment" — claiming the chest
 *   doesn't tell you which of the two you actually did, so wiring it to
 *   either row risks auto-marking the wrong one "done".
 * - Domain of Vabbi (`domain_of_vabbi_heros_choice_chest`): same shared-
 *   trigger situation, between "Forged with Fire" and "Serpents' Ire".
 * - Seitung Province, New Kaineng City, The Echovald Wilds, Amnytas: EoD/
 *   SotO zones expected to have their own chest ids (an EoD coverage gap in
 *   the public `/v2/mapchests` reference list was confirmed fixed via a
 *   closed GitHub issue), but their exact single-event trigger criteria
 *   haven't been individually confirmed against the wiki the way the zones
 *   below have. Add them here once verified, rather than guessing.
 *
 * `/v2/mapchests` (public, no key needed) is the reference list of valid
 * chest ids — deliberately not fetched/cached here. This app only needs to
 * check whether each specific id it cares about below shows up in the
 * account's claimed list, so there's no need to trust that reference list's
 * completeness at all.
 */
export const MAP_CHEST_API_IDS = {
  // Heart of Thorns — each zone's Hero's Choice Chest ties to one specific
  // named boss fight that is also that zone's meta chain finale.
  'Night Bosses':                      'verdant_brink_heros_choice_chest',
  'Octovine':                          'auric_basin_heros_choice_chest',
  'Chak Gerent':                       'tangled_depths_heros_choice_chest',
  'Advancing on the Blighting Towers': 'dragons_stand_heros_choice_chest',

  // Path of Fire — only the two zones with a single confirmed trigger event.
  'Choya Pinata':                      'crystal_oasis_heros_choice_chest',
  'Doppelganger':                      'elon_riverlands_heros_choice_chest',

  // End of Dragons — Dragon's End's trigger ("Defeat Soo-Won") is confirmed
  // and maps to this app's tracked finale event for that zone.
  'The Battle for the Jade Sea':       'dragons_end_heros_choice_chest',
};

// Reverse lookup — chest id -> display name (matches META_EVENT_SCHEDULE's eventName).
export const MAP_CHEST_ID_TO_NAME = Object.fromEntries(
  Object.entries(MAP_CHEST_API_IDS).map(([name, id]) => [id, name])
);
