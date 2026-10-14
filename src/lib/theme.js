/**
 * Color schemes + festival themes.
 *
 * Everything here is a per-computer display preference, kept in localStorage
 * and read synchronously at startup so there's no flash of the default theme.
 *
 *   gw2wt.theme      chosen theme id (a color scheme or a festival)
 *   gw2wt.festStyle  "banner" (Option 1) or "wallpaper" (Option 2, full background)
 *   gw2wt.festAuto   { enabled, festivals: { <id>: { on, start, end } } }  (MM-DD dates)
 *
 * Applied as attributes on <html>:
 *   data-theme="<id>"  (absent for the default Tyrian Gold)
 *   data-fest="<id>" data-fest-style="banner|wallpaper"  (festivals only)
 * src/styles/themes.css does the rest.
 */
import { useEffect, useState } from "react";

export const THEMES = [
  { id: "tyrian",    name: "Tyrian Gold",        desc: "The original look. Warm gold on dark leather.",
    swatch: { bg: "#0e0c09", panel: "#1e1a14", acc: "#c8962a", acc2: "#e8b84b", text: "#e8dcc8", dim: "#786858" } },
  { id: "mists",     name: "Mistlock Azure",     desc: "Cool slate and sky blue, like the Mists.",
    swatch: { bg: "#090d13", panel: "#131a24", acc: "#4f9fd8", acc2: "#7cc4f0", text: "#dde7f2", dim: "#74869b" } },
  { id: "jade",      name: "Maguuma Jade",       desc: "Deep jungle green with bright jade.",
    swatch: { bg: "#090e0b", panel: "#131d17", acc: "#3fae7a", acc2: "#6fd6a0", text: "#e0ece4", dim: "#75907e" } },
  { id: "legendary", name: "Ley-line Violet",    desc: "Legendary purple and dusk tones.",
    swatch: { bg: "#0d0a14", panel: "#1a1426", acc: "#9f6cf0", acc2: "#c29bff", text: "#ebe3f6", dim: "#857898" } },
  { id: "parchment", name: "Divinity’s Reach", desc: "Light mode. Cream parchment, ink and bronze.",
    swatch: { bg: "#f2e8d4", panel: "#fbf6ea", acc: "#8a5a12", acc2: "#6e4508", text: "#2b2216", dim: "#6e5d45" } },
];

// Listed in calendar order. Default auto-switch dates are rough guesses:
// ArenaNet moves festivals around every year, so users edit them in Settings.
export const FESTIVALS = [
  { id: "lunarnewyear",   name: "Lunar New Year",             tagline: "Lunar New Year · Lanterns over the city",
    label: "LUNAR NEW YEAR", note: "Lucky envelopes are flowing. May your coffers overflow this year.", start: "01-27", end: "02-17" },
  { id: "superadventure", name: "Super Adventure Festival",   tagline: "Super Adventure Festival · World 1, Zone 1",
    label: "SUPER ADVENTURE FESTIVAL", note: "Press start! Time to grab some festival loot.", start: "03-31", end: "04-21" },
  { id: "dragonbash",     name: "Dragon Bash",                tagline: "Dragon Bash · Fireworks and effigies",
    label: "DRAGON BASH", note: "Light the effigies, race the moas, and open those Dragon Coffers.", start: "06-16", end: "07-07" },
  { id: "fourwinds",      name: "Festival of the Four Winds", tagline: "Festival of the Four Winds · Kites over the bay",
    label: "FESTIVAL OF THE FOUR WINDS", note: "The Zephyrites are in port. The trade winds are blowing your way.", start: "08-04", end: "08-25" },
  { id: "halloween",      name: "Halloween",                  tagline: "Shadow of the Mad King · Trick or treat, Tyria",
    label: "SHADOW OF THE MAD KING", note: "The Lunatic Court thanks you for your patronage.", start: "10-15", end: "11-05" },
  { id: "wintersday",     name: "Wintersday",                 tagline: "Wintersday · Lights in the square",
    label: "WINTERSDAY", note: "Snowflakes and Wintersday Gifts are piling up. Happy Wintersday!", start: "12-09", end: "01-06" },
];

export const FEST_STYLES = [
  { id: "banner",    name: "Option 1 · Banner",          desc: "Art across the top, solid panels below." },
  { id: "wallpaper", name: "Option 2 · Full background", desc: "Art fills the whole window behind see-through panels." },
];

const FEST_IDS = new Set(FESTIVALS.map(f => f.id));
const ALL_IDS = new Set([...THEMES.map(t => t.id), ...FEST_IDS]);
const KEY_THEME = "gw2wt.theme";
const KEY_STYLE = "gw2wt.festStyle";
const KEY_AUTO = "gw2wt.festAuto";
const KEY_OLD_AUTO = "gw2wt.seasonalAuto"; // 0.7.4 Halloween-only auto-switch
const EVT = "gw2wt-theme-change";

export const isFestival = id => FEST_IDS.has(id);
export const getFestival = id => FESTIVALS.find(f => f.id === id) || null;

function read(key) { try { return localStorage.getItem(key); } catch { return null; } }
function write(key, val) { try { localStorage.setItem(key, val); } catch { /* storage unavailable */ } }
function remove(key) { try { localStorage.removeItem(key); } catch { /* storage unavailable */ } }

function defaultAuto() {
  const festivals = {};
  for (const f of FESTIVALS) festivals[f.id] = { on: true, start: f.start, end: f.end };
  return { enabled: false, festivals };
}

// One-time upgrade from the 0.7.4 themes (Halloween 1 / Halloween 2).
function migrate() {
  const t = read(KEY_THEME);
  if (t === "halloween1" || t === "halloween2") {
    write(KEY_THEME, "halloween");
    if (!read(KEY_STYLE)) write(KEY_STYLE, t === "halloween1" ? "wallpaper" : "banner");
  }
  const old = read(KEY_OLD_AUTO);
  if (old && !read(KEY_AUTO)) {
    try {
      const o = JSON.parse(old);
      const a = defaultAuto();
      a.enabled = !!o.enabled;
      if (o.start && o.end) a.festivals.halloween = { on: true, start: o.start, end: o.end };
      write(KEY_AUTO, JSON.stringify(a));
    } catch { /* ignore a bad old value */ }
  }
  if (old) remove(KEY_OLD_AUTO);
}

export function getChosenTheme() {
  const t = read(KEY_THEME);
  return t && ALL_IDS.has(t) ? t : "tyrian";
}

export function getFestStyle() {
  return read(KEY_STYLE) === "wallpaper" ? "wallpaper" : "banner";
}

export function getFestAuto() {
  const base = defaultAuto();
  try {
    const v = JSON.parse(read(KEY_AUTO) || "null");
    if (!v) return base;
    const festivals = { ...base.festivals };
    for (const id of FEST_IDS) if (v.festivals?.[id]) festivals[id] = { ...base.festivals[id], ...v.festivals[id] };
    return { enabled: !!v.enabled, festivals };
  } catch { return base; }
}

// "MM-DD" → comparable number MMDD; null if malformed.
export function parseMonthDay(s) {
  const m = /^(\d{1,2})-(\d{1,2})$/.exec(String(s || "").trim());
  if (!m) return null;
  const mo = +m[1], d = +m[2];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return mo * 100 + d;
}

// True when `date` falls inside start..end (inclusive). Handles ranges that
// wrap the new year, e.g. 12-09 → 01-06.
export function inRange(start, end, date = new Date()) {
  const a = parseMonthDay(start), b = parseMonthDay(end);
  if (a == null || b == null) return false;
  const now = (date.getMonth() + 1) * 100 + date.getDate();
  return a <= b ? (now >= a && now <= b) : (now >= a || now <= b);
}

/** The festival the auto-switch wants right now, or null. */
export function activeFestivalByDate(date = new Date()) {
  const a = getFestAuto();
  if (!a.enabled) return null;
  for (const f of FESTIVALS) {
    const r = a.festivals[f.id];
    if (r?.on && inRange(r.start, r.end, date)) return f.id;
  }
  return null;
}

/** The theme that should be showing right now. */
export function resolveTheme(date = new Date()) {
  return activeFestivalByDate(date) || getChosenTheme();
}

export function applyTheme(id = resolveTheme()) {
  if (typeof document === "undefined") return id;
  const root = document.documentElement;
  if (id === "tyrian") delete root.dataset.theme; else root.dataset.theme = id;
  if (isFestival(id)) { root.dataset.fest = id; root.dataset.festStyle = getFestStyle(); }
  else { delete root.dataset.fest; delete root.dataset.festStyle; }
  window.dispatchEvent(new CustomEvent(EVT, { detail: { id, style: getFestStyle() } }));
  return id;
}

export function setChosenTheme(id) {
  if (!ALL_IDS.has(id)) return;
  write(KEY_THEME, id);
  applyTheme();
}

export function setFestStyle(style) {
  write(KEY_STYLE, style === "wallpaper" ? "wallpaper" : "banner");
  applyTheme();
}

export function setFestAuto(cfg) {
  write(KEY_AUTO, JSON.stringify(cfg));
  applyTheme();
}

function currentState() {
  const root = typeof document !== "undefined" ? document.documentElement : null;
  return { id: root?.dataset.theme || "tyrian", style: getFestStyle() };
}

/** React hook: { id, style } of the theme currently applied (re-renders on change). */
export function useThemeState() {
  const [state, setState] = useState(currentState);
  useEffect(() => {
    const h = e => setState(e.detail);
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []);
  return state;
}

/** React hook: id of the theme currently applied. */
export function useActiveTheme() {
  return useThemeState().id;
}

/** Call once at startup: migrates old settings, applies the theme, re-checks dates hourly. */
export function startThemeWatcher() {
  migrate();
  applyTheme();
  const timer = setInterval(() => {
    const want = resolveTheme();
    const have = document.documentElement.dataset.theme || "tyrian";
    if (want !== have) applyTheme(want);
  }, 60 * 60 * 1000);
  return () => clearInterval(timer);
}
