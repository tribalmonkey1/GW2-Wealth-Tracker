/**
 * GW2 API auto-completion support for World Bosses.
 *
 * `/v2/account/worldbosses` (requires an API key with account+progression)
 * returns the list of Core Tyria world-boss API ids the account has killed
 * since the last daily reset — this is the ONLY GW2 API endpoint that
 * exposes real per-boss daily completion state. It covers exactly the 13
 * bosses below (the ones with a Hero's Choice Chest); nothing else in this
 * app — meta events, Ley-Line Anomaly, Living World/HoT/PoF/EoD/SotO metas,
 * Hardcore Meta Bosses beyond these three, Invasions — has any equivalent
 * API-exposed completion signal, so those stay manually-checked only.
 *
 * IDs verified against wiki.guildwars2.com/wiki/API:2/worldbosses (Sept 2026).
 */
export const WORLD_BOSS_API_IDS = {
  'Admiral Taidha Covington':              'admiral_taidha_covington',
  'Svanir Shaman Chief':                   'svanir_shaman_chief',
  'Megadestroyer':                         'megadestroyer',
  'Fire Elemental':                        'fire_elemental',
  'The Shatterer':                         'the_shatterer',
  'Great Jungle Wurm':                     'great_jungle_wurm',
  'Modniir Ulgoth':                        'modniir_ulgoth',
  'Shadow Behemoth':                       'shadow_behemoth',
  'Golem Mark II':                         'inquest_golem_mark_ii',
  'Claw of Jormag':                        'claw_of_jormag',
  'Tequatl the Sunless':                   'tequatl_the_sunless',
  'Evolved Jungle Wurm (Triple Trouble)':  'triple_trouble_wurm',
  'Karka Queen':                           'karka_queen',
};

// Reverse lookup — API id -> display name (matches WORLD_BOSS_SCHEDULE's bossName).
export const WORLD_BOSS_API_ID_TO_NAME = Object.fromEntries(
  Object.entries(WORLD_BOSS_API_IDS).map(([name, id]) => [id, name])
);
