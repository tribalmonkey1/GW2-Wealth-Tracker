/**
 * Color themes + seasonal themes.
 *
 * The chosen theme and the seasonal auto-switch settings live in localStorage
 * (they're per-computer display preferences, and reading them synchronously at
 * startup avoids a flash of the default theme). The active theme is applied as
 * <html data-theme="…">; src/styles/themes.css does the rest.
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

export const SEASONAL_THEMES = [
  { id: "halloween1", name: "Halloween 1", desc: "Harvest moon over the haunted woods.",
    tagline: "Shadow of the Mad King · Something stirs beneath the harvest moon" },
  { id: "halloween2", name: "Halloween 2", desc: "A burning pumpkin fiend with ember gold accents.",
    tagline: "Shadow of the Mad King · The harvest bites back" },
];

const ALL_IDS = new Set([...THEMES, ...SEASONAL_THEMES].map(t => t.id));
const KEY_THEME = "gw2wt.theme";
const KEY_SEASONAL = "gw2wt.seasonalAuto";
const EVT = "gw2wt-theme-change";

export const DEFAULT_SEASONAL = { enabled: false, theme: "halloween1", start: "10-15", end: "11-05" };

function read(key) { try { return localStorage.getItem(key); } catch { return null; } }
function write(key, val) { try { localStorage.setItem(key, val); } catch { /* storage unavailable */ } }

export function getChosenTheme() {
  const t = read(KEY_THEME);
  return t && ALL_IDS.has(t) ? t : "tyrian";
}

export function getSeasonalAuto() {
  try {
    const v = JSON.parse(read(KEY_SEASONAL) || "null");
    return v ? { ...DEFAULT_SEASONAL, ...v } : { ...DEFAULT_SEASONAL };
  } catch { return { ...DEFAULT_SEASONAL }; }
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
// wrap the new year, e.g. 12-15 → 01-05.
export function inSeason(cfg, date = new Date()) {
  const a = parseMonthDay(cfg.start), b = parseMonthDay(cfg.end);
  if (a == null || b == null) return false;
  const now = (date.getMonth() + 1) * 100 + date.getDate();
  return a <= b ? (now >= a && now <= b) : (now >= a || now <= b);
}

/** The theme that should be showing right now. */
export function resolveTheme(date = new Date()) {
  const s = getSeasonalAuto();
  if (s.enabled && ALL_IDS.has(s.theme) && inSeason(s, date)) return s.theme;
  return getChosenTheme();
}

export function applyTheme(id = resolveTheme()) {
  if (typeof document === "undefined") return id;
  if (id === "tyrian") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = id;
  window.dispatchEvent(new CustomEvent(EVT, { detail: id }));
  return id;
}

export function setChosenTheme(id) {
  if (!ALL_IDS.has(id)) return;
  write(KEY_THEME, id);
  applyTheme();
}

export function setSeasonalAuto(cfg) {
  write(KEY_SEASONAL, JSON.stringify({ ...DEFAULT_SEASONAL, ...cfg }));
  applyTheme();
}

/** React hook: the theme currently applied (re-renders on change). */
export function useActiveTheme() {
  const [id, setId] = useState(() => (typeof document !== "undefined" && document.documentElement.dataset.theme) || "tyrian");
  useEffect(() => {
    const h = e => setId(e.detail);
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []);
  return id;
}

/** Call once at startup: applies the theme and re-checks the season hourly. */
export function startThemeWatcher() {
  applyTheme();
  const timer = setInterval(() => {
    const want = resolveTheme();
    const have = document.documentElement.dataset.theme || "tyrian";
    if (want !== have) applyTheme(want);
  }, 60 * 60 * 1000);
  return () => clearInterval(timer);
}
