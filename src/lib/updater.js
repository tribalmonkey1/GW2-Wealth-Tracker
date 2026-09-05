/**
 * Auto-update + changelog support (tauri-plugin-updater + GitHub Releases).
 * Repo: tribalmonkey1/GW2-Wealth-Tracker — must be public for anonymous fetch/download to work.
 */
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";
import { cacheGet, cacheSet } from "./storage.js";

const REPO = "tribalmonkey1/GW2-Wealth-Tracker";
const CHANGELOG_CACHE_KEY = "changelogReleases";
const CHANGELOG_TTL_MS = 60 * 60 * 1000; // 1 hour — avoids hammering the unauthenticated GitHub API rate limit

export async function getCurrentVersion() {
  try { return await getVersion(); } catch { return null; }
}

// Returns null if up to date, or { version, date, body, install } if an update is available.
export async function checkForUpdate() {
  const update = await check();
  if (!update) return null;
  return {
    version: update.version,
    date: update.date,
    body: update.body || "",
    install: async (onProgress) => {
      await update.downloadAndInstall(onProgress);
      await relaunch();
    },
  };
}

export async function getChangelog(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = await cacheGet(CHANGELOG_CACHE_KEY);
    if (cached && Date.now() - cached.ts < CHANGELOG_TTL_MS) return cached.value;
  }
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases`);
  if (!res.ok) throw new Error(`GitHub API error ${res.status}`);
  const raw = await res.json();
  const releases = raw
    .filter(r => !r.draft)
    .map(r => ({ tag: r.tag_name, name: r.name || r.tag_name, date: r.published_at, body: r.body || "", url: r.html_url }));
  await cacheSet(CHANGELOG_CACHE_KEY, releases);
  return releases;
}
