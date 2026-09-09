/**
 * Alert sound playback — the JS equivalent of the C# reference app's
 * IAlertSoundPlayer/WindowsAlertSoundPlayer/LinuxAlertSoundPlayer split, but
 * collapsed into one file: running inside a webview means the browser
 * engine already abstracts the platform differences that needed three
 * separate implementations over there (Web Audio and SpeechSynthesis both
 * work the same way on every OS this app runs on, including Linux — no
 * paplay/aplay/espeak-ng process-shelling required).
 *
 * Every function here follows the same "never throw back to the caller"
 * discipline the reference app's players use — a missing voice, an
 * autoplay-blocked AudioContext, or a bad custom file path should degrade
 * to silence, never crash the alert-checking tick that called this.
 */
import { convertFileSrc } from "@tauri-apps/api/core";

let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { audioCtx = null; }
  }
  return audioCtx;
}

// Three short ascending tones — same shape (frequency/duration) as the
// reference app's AlertToneSynthesizer, reproduced with an oscillator
// instead of a synthesized WAV buffer.
const BEEP_TONES = [
  { freq: 660, durationMs: 150 },
  { freq: 880, durationMs: 150 },
  { freq: 1100, durationMs: 220 },
];
const BEEP_GAP_MS = 40;

function playBeep() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    let t = ctx.currentTime;
    for (const { freq, durationMs } of BEEP_TONES) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + durationMs / 1000);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + durationMs / 1000);
      t += (durationMs + BEEP_GAP_MS) / 1000;
    }
  } catch { /* autoplay policy or unsupported — silently do nothing */ }
}

function playTextToSpeech(bossName) {
  try {
    if (!window.speechSynthesis) { playBeep(); return; }
    const utter = new SpeechSynthesisUtterance(`${bossName} is spawning soon`);
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  } catch { playBeep(); }
}

// Custom sound file — path comes from Settings → Alert Sound (see
// SettingsPanel.jsx / App.jsx's customSoundPath). Absolute local paths need
// to go through Tauri's asset protocol (convertFileSrc) before a plain
// <audio> element can load them; http(s)/asset URLs are used as-is.
function playCustomAudioFile(path) {
  try {
    if (!path) { playBeep(); return; }
    const isUrl = /^(https?|asset):\/\//i.test(path);
    let src = path;
    if (!isUrl) {
      try { src = convertFileSrc(path); } catch { src = path; }
    }
    const audio = new Audio(src);
    audio.play().catch(() => playBeep()); // e.g. file missing/unsupported — fall back
  } catch { playBeep(); }
}

// mode: "beep" | "tts" | "custom". Falls back to beep for "custom" with no
// path configured yet — same reasoning as the reference app: a silent
// alert looks identical to a broken one, so degrade audibly instead.
export function playAlert(bossName, settings) {
  const mode = settings?.mode || "beep";
  if (mode === "tts") return playTextToSpeech(bossName);
  if (mode === "custom") return playCustomAudioFile(settings?.customPath);
  return playBeep();
}

// Plays a batch of alerts staggered so simultaneous spawns don't overlap
// audibly — same purpose as the reference app's AlertStaggerDelay/
// PlayAlertsSequentiallyAsync.
const ALERT_STAGGER_MS = 2000;
export function playAlertsSequentially(bossNames, settings) {
  bossNames.forEach((name, i) => {
    setTimeout(() => playAlert(name, settings), i * ALERT_STAGGER_MS);
  });
}
