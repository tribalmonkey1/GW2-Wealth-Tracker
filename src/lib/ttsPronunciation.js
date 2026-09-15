/**
 * Manual phonetic respellings for boss/event names that TTS engines — both
 * the browser's Web Speech API (Windows/macOS) and the native espeak-ng/
 * Piper fallback (Linux — see alertSound.js) — mispronounce as spelled.
 * Piper itself phonemizes through espeak-ng internally (see the "espeak":
 * {"voice": ...} field in any piper voice's .onnx.json), so a single plain-
 * text respelling here nudges both backends toward the right sound; this
 * isn't true IPA/SSML phoneme control, just a best-effort respelling using
 * ordinary letters that rule-based/phoneme-based engines read sensibly.
 *
 * Keyed by the EXACT display name used in worldBossScheduleData.js /
 * metaEventScheduleData.js. The respelling only affects what's *spoken* —
 * it never touches what's displayed anywhere in the UI, since callers
 * apply this only at the point of building the spoken alert text.
 *
 * Add more entries here as you notice mispronunciations; no other code
 * needs to change — alertSound.js already routes every alert name through
 * applyPronunciation() before speaking it, for both the browser and native
 * TTS paths.
 */
export const TTS_PRONUNCIATION_OVERRIDES = {
  "Tequatl the Sunless": "Te-kwah-tuhl the Sunless",
  "Admiral Taidha Covington": "Admiral Tie-ee-duh Cuv-ington",
  "Svanir Shaman Chief": "Svahn-eer shaman chief",
  "Golem Mark II": "Golem Mark 2",
  "Karka Queen": "Carr-Kuh Queen",
  "Defeat Scarlet's Minions (Public)": "Defeat Scarlets Minions (Public)",
  "Sandstorm": "Sand-storm",
  "Pylons": "Py-lawns",
  "Chake Garent": "Chak Garentt",
  "Choya Pinata": "Choya Pin-yata",
  "Aetherblade Assault": "Ae-therblade Assault",
  "Kaineng Blackout": "Ky-neng Blackout",
};

export function applyPronunciation(name) {
  return TTS_PRONUNCIATION_OVERRIDES[name] || name;
}
