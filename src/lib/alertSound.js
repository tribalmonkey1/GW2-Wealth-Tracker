/**
 * Alert sound playback — the JS equivalent of the C# reference app's
 * IAlertSoundPlayer/WindowsAlertSoundPlayer/LinuxAlertSoundPlayer split, but
 * collapsed into one file: running inside a webview means the browser
 * engine already abstracts the platform differences that needed three
 * separate implementations over there (Web Audio and SpeechSynthesis both
 * work the same way on every OS this app runs on — MOSTLY. See the TTS
 * gotcha below for the one place that assumption breaks down.)
 *
 * Every function here follows the same "never throw back to the caller"
 * discipline the reference app's players use — a missing voice, an
 * autoplay-blocked AudioContext, or a bad custom file path should degrade
 * to silence (or beep), never crash the alert-checking tick that called this.
 *
 * ── Serial playback queue ─────────────────────────────────────────────────
 * Every alert (beep, TTS, or custom sound) is funneled through one shared
 * module-level queue (see enqueueAlert below) rather than played immediately.
 * Each queued alert only starts once the PREVIOUS one has actually finished
 * playing — not after a fixed guessed delay — which is what makes this safe
 * against overlap: a longer-than-expected TTS sentence (a verbose boss name,
 * a slower rate) used to spill into the next alert's start under the old
 * fixed-stagger design, since that stagger didn't know how long the audio
 * would actually take. Every player function below (playBeep,
 * playTextToSpeech, playCustomAudioFile) now returns a Promise that resolves
 * only when its sound has genuinely finished, and the queue awaits that
 * before advancing. This also means two separate calls to
 * playAlertsSequentially() fired close together (e.g. from two different
 * alert-check ticks) naturally serialize onto the same queue instead of
 * fighting over the audio output.
 *
 * ── Linux/WebKitGTK TTS gotcha (confirmed Sept 2026) ──────────────────────
 * `window.speechSynthesis` is undefined on stock webkit2gtk everywhere,
 * Arch included — getting it to exist requires building WebKitGTK yourself
 * with `-DUSE_SPIEL=ON`, which no distro package does. Installing
 * speech-dispatcher/espeak-ng does NOT fix this case: those are the system
 * TTS backend, but the browser-side API that would talk to them was never
 * compiled into the webview to begin with.
 * Fix: when `window.speechSynthesis` is absent, skip the browser API
 * entirely and shell out to `espeak-ng` directly via a Tauri command
 * (`speak_text`, src-tauri/src/commands.rs) instead — same approach the
 * original C# reference app used before this was collapsed to browser-only.
 * On platforms where `speechSynthesis` genuinely exists but a call silently
 * produces no speech (no onstart/onerror at all — also seen on some
 * WebKitGTK configs), a short "did it actually start" timeout below also
 * routes to the same native fallback rather than assuming success.
 *
 * `settings.piperVoiceFile` / `settings.piperSpeakerId` (set in Settings,
 * detected via the `list_piper_voices` Tauri command) select which Piper
 * voice/speaker the native path uses — see commands.rs. Both are ignored
 * on the browser-TTS path since Windows/macOS pick voices through the
 * browser's own Speech API instead.
 *
 * Boss/event names get run through ttsPronunciation.js's applyPronunciation()
 * before being spoken, on both the browser and native paths — TTS engines
 * (Piper included, since it phonemizes through espeak-ng internally) often
 * mangle GW2's invented names as spelled.
 */
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { applyPronunciation } from "./ttsPronunciation.js";

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
const BEEP_TOTAL_MS = BEEP_TONES.reduce((s, t) => s + t.durationMs, 0) + BEEP_GAP_MS * (BEEP_TONES.length - 1);

// Resolves once the beep sequence has actually finished playing (or immediately if
// no AudioContext is available/allowed — e.g. blocked by autoplay policy).
function playBeep(volume = 1) {
  const ctx = getAudioCtx();
  if (!ctx || volume <= 0) return Promise.resolve();
  try {
    let t = ctx.currentTime;
    for (const { freq, durationMs } of BEEP_TONES) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25 * volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + durationMs / 1000);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + durationMs / 1000);
      t += (durationMs + BEEP_GAP_MS) / 1000;
    }
    return new Promise(resolve => setTimeout(resolve, BEEP_TOTAL_MS));
  } catch {
    // autoplay policy or unsupported — silently do nothing, but don't block the queue
    return Promise.resolve();
  }
}

// Waits (briefly) for the voice list to populate. Some engines — including
// WebKitGTK — return an empty array from getVoices() synchronously and only
// fill it in asynchronously via the 'voiceschanged' event, if at all. This
// does NOT guarantee TTS will work (a truly missing backend never fires the
// event and never gets voices), it just avoids racing a same-tick call that
// would otherwise always see zero voices even on a working system.
function getVoicesAsync(synth, timeoutMs = 250) {
  return new Promise((resolve) => {
    const existing = synth.getVoices();
    if (existing && existing.length > 0) { resolve(existing); return; }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      synth.removeEventListener?.("voiceschanged", onVoices);
      resolve(synth.getVoices());
    };
    const onVoices = () => finish();
    synth.addEventListener?.("voiceschanged", onVoices);
    setTimeout(finish, timeoutMs);
  });
}

// Confirmed (Sept 2026): stock webkit2gtk builds — Arch's included — are not
// compiled with Web Speech Synthesis support at all (it requires building
// WebKitGTK yourself with -DUSE_SPIEL=ON). `window.speechSynthesis` being
// undefined there is not a missing-backend problem installing
// speech-dispatcher/espeak-ng can fix — the frontend API itself doesn't
// exist. In that case, shell out to espeak-ng directly via a Tauri command
// instead of going through the (absent) browser API. Returns a Promise that
// resolves once the native command's playback has finished (or, on failure,
// once the beep fallback has finished) — the Tauri `speak_text` command
// blocks until the spoken audio actually completes, so awaiting its own
// promise is enough; no extra timing guess needed here.
function speakNative(text, settings, volume = 1) {
  return invoke("speak_text", {
    text,
    voiceFile: settings?.piperVoiceFile || null,
    speakerId: settings?.piperSpeakerId ?? null,
    volume,
  }).catch((e) => {
    console.warn("[alertSound] native speak_text failed, falling back to beep:", e);
    return playBeep(volume);
  });
}

// Longest we'll ever wait on a single browser TTS utterance before treating it as
// hung and moving the queue on — a genuine "onstart fired but onend never does"
// stall should never be able to silence every alert behind it forever.
const SPEECH_SAFETY_TIMEOUT_MS = 15_000;

// Resolves once the utterance has genuinely finished speaking (onend), or once
// whatever fallback path (native TTS, then beep) it took has itself finished.
function playTextToSpeech(bossName, settings, volume = 1) {
  const text = `${applyPronunciation(bossName)} starting soon`;
  const synth = window.speechSynthesis;
  if (!synth) {
    console.warn(
      "[alertSound] window.speechSynthesis is undefined in this webview (expected on stock " +
      "webkit2gtk) — using native espeak-ng/Piper via the Rust backend instead."
    );
    return speakNative(text, settings, volume);
  }

  return getVoicesAsync(synth).then(() => new Promise((resolve) => {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.95;
      utter.volume = volume;

      let started = false;
      let settled = false;
      const finish = () => { if (!settled) { settled = true; resolve(); } };
      const fallbackToBeep = (reason) => {
        if (settled) return;
        settled = true;
        console.warn(`[alertSound] TTS did not produce speech (${reason}) — trying native TTS instead.`);
        speakNative(text, settings, volume).then(resolve);
      };

      utter.onstart = () => { started = true; };
      utter.onend = finish;
      utter.onerror = (e) => fallbackToBeep(`error: ${e?.error || "unknown"}`);

      // WebKitGTK with no working backend can accept the utterance and never
      // fire onstart, onend, or onerror at all — it just silently does
      // nothing. Treat "never started within a short window" as failure too,
      // so a dead TTS backend degrades to an audible beep (and the queue
      // still advances) instead of hanging forever with no alert at all.
      setTimeout(() => { if (!started) fallbackToBeep("no onstart event within 1.2s"); }, 1200);
      // Separate safety net for the rarer case where it DID start but never
      // fires onend — never let one stuck utterance block every alert behind it.
      setTimeout(finish, SPEECH_SAFETY_TIMEOUT_MS);

      synth.speak(utter);
    } catch (e) {
      console.warn("[alertSound] speechSynthesis threw, falling back to beep:", e);
      playBeep(volume).then(resolve);
    }
  }));
}

// Custom sound file — path comes from Settings → Alert Sound (see
// SettingsPanel.jsx / App.jsx's customSoundPath). Absolute local paths need
// to go through Tauri's asset protocol (convertFileSrc) before a plain
// <audio> element can load them; http(s)/asset URLs are used as-is. Resolves
// once playback actually ends (or once the beep fallback finishes).
function playCustomAudioFile(path, volume = 1) {
  return new Promise((resolve) => {
    try {
      if (!path) { playBeep(volume).then(resolve); return; }
      const isUrl = /^(https?|asset):\/\//i.test(path);
      let src = path;
      if (!isUrl) {
        try { src = convertFileSrc(path); } catch { src = path; }
      }
      const audio = new Audio(src);
      audio.volume = volume;
      audio.addEventListener("ended", resolve, { once: true });
      audio.addEventListener("error", () => playBeep(volume).then(resolve), { once: true });
      audio.play().catch(() => playBeep(volume).then(resolve)); // e.g. file missing/unsupported — fall back
    } catch {
      playBeep(volume).then(resolve);
    }
  });
}

// mode: "off" | "beep" | "tts" | "custom". "off" plays nothing at all. Falls back to
// beep for "custom" with no path configured yet — same reasoning as the reference
// app: a silent alert looks identical to a broken one, so degrade audibly instead.
// Returns a Promise that resolves once playback has actually finished — callers that
// need alerts not to overlap should go through enqueueAlert/playAlertsSequentially
// below rather than calling this directly.
export function playAlert(bossName, settings) {
  const mode = settings?.mode || "beep";
  if (mode === "off") return Promise.resolve();
  const rawVolume = settings?.volume;
  const volume = Math.min(100, Math.max(0, rawVolume == null ? 100 : rawVolume)) / 100;
  if (mode === "tts") return playTextToSpeech(bossName, settings, volume);
  if (mode === "custom") return playCustomAudioFile(settings?.customPath, volume);
  return playBeep(volume);
}

// Serial playback queue — every alert, from any call site, funnels through this one
// shared tail so nothing ever plays on top of anything else. Each entry waits for the
// real completion of whatever came before it (not a guessed duration), plus a short
// fixed QUEUE_GAP_MS pause so consecutive alerts stay clearly separated instead of
// blurring together. A failure in one alert (e.g. a rejected promise somewhere) can
// never wedge the rest of the queue — it's swallowed and the queue moves on.
const QUEUE_GAP_MS = 300;
let queueTail = Promise.resolve();

function enqueueAlert(bossName, settings) {
  queueTail = queueTail
    .then(() => playAlert(bossName, settings), () => playAlert(bossName, settings))
    .catch(() => {})
    .then(() => new Promise(resolve => setTimeout(resolve, QUEUE_GAP_MS)));
  return queueTail;
}

// Queues a batch of alerts to play one after another, waiting for each one's actual
// playback to finish (see enqueueAlert) rather than a fixed per-item delay — this is
// what prevents overlap, especially for TTS where speech duration varies with the
// name being spoken. Safe to call again while a previous batch is still draining;
// the new names simply join the end of the same queue.
export function playAlertsSequentially(bossNames, settings) {
  for (const name of bossNames) enqueueAlert(name, settings);
}
