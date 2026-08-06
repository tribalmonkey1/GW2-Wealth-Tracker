# ⚜ GW2 Wealth Tracker

A desktop companion app for **Guild Wars 2** that tracks your account's wealth and tells you
what's actually worth crafting right now — ranked by real profit and live Trading Post
demand, not guesswork.

Built with [Tauri](https://tauri.app) (Rust + React), runs natively on Windows and Linux.

---

## Features

### 💰 Wealth & Materials
- Live gold + total material value across your bank, material storage, and every
  character's bags
- Per-material breakdown: current TP price, price history chart, and "best crafting use"
  suggestions for anything you're sitting on

### 🔨 Crafting Profit Calculator
- Every recipe you know (plus auto-unlocked ones you haven't "learned" yet), organized by
  profession
- Ranked by **profit × market velocity** — not just raw margin, but how fast it'll actually
  sell, using accumulated buy/sell fill-rate data
- Full ingredient trees showing exactly what you own vs. need to buy, with cheapest
  acquisition path calculated automatically (including nested Mystic Forge intermediaries)
- A **Recommended** view that surfaces the single best things to craft across your entire
  account right now

### ⚗ Mystic Forge
- Material promotion chains (T1→T5 refinement) with live craft-vs-buy economics
- Mystic Clover cost comparison: guaranteed (Spirit Shard) method vs. random forge, with
  weekly cap tracking
- Full ingredient trees for **every legendary weapon** (Gen 1, 2, and 3 — Aurene set), all
  three legendary armor tiers (PvE, WvW, Raid), and legendary back items, trinkets, relics,
  runes, and sigils — with cumulative missing-cost calculated down to the last Mystic Coin

### 🏪 Trading Post
- Your active sell listings, with undercut and stale-listing warnings
- Full sold-history log
- **Flip Market**: buy-low/sell-high signals based on historical price percentiles, with
  position tracking (buy → pending → sold/loss) and running P&L

### ⏱ Time-Gated Crafting
- Tracks daily and weekly time-gated crafts (Mawdrey chains, dragon hatchling doll parts,
  weekly Level 10 key, etc.) against your current discipline levels, with reset countdowns

### 🔄 Auto-Update
- Checks for new versions in the background and installs them in place (Windows installer,
  self-replacing Linux AppImage) — no manual redownloading
- In-app changelog pulled straight from GitHub Releases

---

## Installation

Grab the latest build from the [Releases page](../../releases):

- **Windows** — download and run the `.exe` installer
- **Linux** — download the `.AppImage`, mark it executable, and run it:
  ```bash
  chmod +x GW2.Wealth.Tracker_*.AppImage
  ./GW2.Wealth.Tracker_*.AppImage
  ```
  Works on any modern distro (Ubuntu, Fedora, Arch, etc.) — the AppImage bundles its own
  runtime dependencies. A `.deb` is also provided for Debian/Ubuntu-based systems if you'd
  rather install it through your package manager (note: `.deb` installs don't auto-update —
  use the AppImage if you want in-place updates).

### First launch

You'll need a **Guild Wars 2 API key**. Generate one at
[account.arena.net → Applications](https://account.arena.net/applications) with these scopes:

```
account, characters, inventories, progression, tradingpost, unlocks, wallet
```

Paste it in on first launch — that's the only setup required. The app fetches your account
data and live Trading Post prices directly from the official GW2 API.

---

## Building from source

**Prerequisites:** Node 20+, Rust (stable), npm

```bash
git clone https://github.com/tribalmonkey1/GW2-Wealth-Tracker.git
cd GW2-Wealth-Tracker
npm install

# Development (hot reload)
npm run tauri dev

# Production build (outputs to src-tauri/target/release/bundle/)
npm run tauri build
```

---

## Tech stack

- **[Tauri 2](https://tauri.app)** — Rust backend, native webview frontend
- **React** — UI
- **SQLite** (via `rusqlite`) — local storage for cached recipes/items, flip tracking, and
  app settings, entirely on-device
- **Guild Wars 2 API** ([wiki.guildwars2.com/wiki/API:Main](https://wiki.guildwars2.com/wiki/API:Main)) — account data and Trading Post prices

## Data & privacy

Your API key and all account data are stored locally in a SQLite database on your machine
and are never sent anywhere except the official GW2 API (`api.guildwars2.com`) to fetch your
own account data and current market prices. Nothing is uploaded to any third-party server.

---

## License

*No license specified yet.*
