# ⚜ GW2 Wealth Tracker

A desktop companion app for **Guild Wars 2** that tracks your account's wealth and tells you what's actually worth crafting right now — ranked by real profit and live Trading Post demand, not guesswork.

Built with [Tauri](https://tauri.app) (Rust + React), runs natively on Windows and Linux.

---

## Features

### 💰 Wealth & Materials
- Live gold + total material value across your bank, shared inventory slots, material storage, and every character's bags
- Per-material breakdown: current TP price, price history chart, and "best crafting use" suggestions for anything you're sitting on
- Price alerts when owned materials hit their 90-day high (with flat/stale prices filtered out so a fixed vendor-floor item can't false-alarm)
- Optional **live feed via DRF** (Drop Research Facilities, a Nexus addon) — when connected, gold, material counts, and wallet currencies update the instant you pick up loot, craft, or salvage, instead of waiting on the next API poll

### 🔨 Crafting Profit Calculator
- Every recipe you know (plus auto-unlocked ones you haven't "learned" yet), organized by profession
- Ranked by **profit × market velocity** — not just raw margin, but how fast it'll actually sell, using accumulated buy/sell fill-rate data
- Full ingredient trees showing exactly what you own vs. need to buy, with cheapest acquisition path calculated automatically (including nested Mystic Forge intermediaries)
- A **Recommended** view that surfaces the single best things to craft across your entire account right now
- A **🔒 Unlearned Recipes** view that ranks recipes you *don't* know by the same profit × velocity score, so you can see what's worth learning or farming
- Optional **👥 Friend Recipe Lookup** — add a friend's API key to also surface recipes *they* know (or could make via their own crafting rating) that you don't. Read-only: only their known recipes and discipline levels are ever fetched, and only your own materials and market data are ever used to score.

### ⚗ Mystic Forge
- Material promotion chains (T1→T5 refinement) with live craft-vs-buy economics
- Rare material promotion (Sliver → Fragment → Shard → Core → Lodestone) across all seven elemental families
- Mystic Clover cost comparison: guaranteed (Spirit Shard) method vs. random forge, with weekly cap tracking
- Full ingredient trees for **every legendary weapon** (Gen 1, 2, and 3 — Aurene set), all three legendary armor tiers (PvE, WvW, Raid), and legendary back items, trinkets, relics, runes, and sigils — with cumulative missing-cost calculated down to the last Mystic Coin

### 🏪 Trading Post
- Your active sell listings, with undercut and stale-listing warnings
- Full sold-history log
- **Flip Market**: buy-low/sell-high signals based on historical price percentiles, with position tracking (buy → pending → sold/loss) and running P&L

### ⏱ Time-Gated Crafting
- Tracks daily and weekly time-gated crafts (Mawdrey chains, dragon hatchling doll parts, weekly Level 10 key, etc.) against your current discipline levels, with reset countdowns

### ⏰ Boss Timers
- Combined countdown grid + Gantt-style timeline for world bosses, meta events, and map metas — sized to each event's real duration
- Global alerts (10/15/20-minute lead time, per-event) that fire regardless of which tab is open, with Text-to-Speech, custom sound, and volume control
- Named collections for saving favorite events
- **Auto-completion** for events the GW2 API tracks (world bosses and map chests), plus a family of heuristics for events with no API signal at all — Mystic Coin drops for Ley-Line Anomaly, item-count deltas for Convergences, exact-count matching for Drakkar, and dual-threshold gold + currency matching for Dragonstorm. With DRF connected, most of these complete the instant the reward lands in your inventory.

### 👤 Characters
- View any character's **equipment templates** (gear, stats, runes, sigils, infusions, skins) and **bags** without logging in
- Browse bank, material storage, shared inventory slots, and the Legendary Armory
- Account-wide **Find an item** search across every location above

### 🔄 Auto-Update
- Checks for new versions in the background and installs them in place (Windows installer, self-replacing Linux AppImage) — no manual redownloading
- In-app changelog pulled straight from GitHub Releases

---

## Installation

Grab the latest build from the [Releases page](../../releases):

- **Windows** — download and run the `.exe` installer
- **Linux** — download the `.AppImage`, mark it executable, and run it:

    chmod +x GW2.Wealth.Tracker_*.AppImage
    ./GW2.Wealth.Tracker_*.AppImage

Works on any modern distro (Ubuntu, Fedora, Arch, etc.) — the AppImage bundles its own runtime dependencies. A `.deb` is also provided for Debian/Ubuntu-based systems if you'd rather install it through your package manager (note: `.deb` installs don't auto-update — use the AppImage if you want in-place updates).

### First launch

You'll need a **Guild Wars 2 API key**. Generate one at [account.arena.net → Applications](https://account.arena.net/applications) with these scopes:

    account, builds, characters, inventories, progression, tradingpost, unlocks, wallet

Paste it in on first launch — that's the only setup required. The app fetches your account data and live Trading Post prices directly from the official GW2 API.

> **Note:** the **Builds** scope is required for the Characters tab's equipment templates. If it's missing, the tab shows a banner telling you exactly which permission to add — everything else still works normally.

### Optional: live data via DRF

If you run the **DRF (Drop Research Facilities)** addon through Nexus, paste your DRF token in Settings to enable the live gold/materials/wallet feed. Requires Guild Wars 2 running with Nexus + DRF loaded and actively streaming. Entirely optional — with no token set, everything works exactly as before.

### Optional: price history via a NAS collector

Price history charts, market velocity data, Flip Market signals, and 90-day-high price alerts all depend on a continuously-running background collector that polls the GW2 Trading Post and serves aggregated data. That collector isn't part of this repo — it runs separately (typically on a home server or NAS) and is configured via **Settings → NAS Address**. Everything else (materials, crafting profit calculator, Mystic Forge, wealth tracking, Characters, Boss Timers) works normally without it.

---

## Building from source

**Prerequisites:** Node 20+, Rust (stable), npm

    git clone https://github.com/tribalmonkey1/GW2-Wealth-Tracker.git
    cd GW2-Wealth-Tracker
    npm install

    # Development (hot reload)
    npm run tauri dev

    # Production build (outputs to src-tauri/target/release/bundle/)
    npm run tauri build

Linux builds may need `WEBKIT_DISABLE_COMPOSITING_MODE=1` set to render correctly under some compositors (the desktop entry that ships with the AppImage handles this automatically).

---

## Tech stack

- **[Tauri 2](https://tauri.app)** — Rust backend, native webview frontend
- **React** — UI
- **SQLite** (via `rusqlite`) — local storage for cached recipes/items, flip tracking, friend keys, and app settings, entirely on-device
- **Guild Wars 2 API** ([wiki.guildwars2.com/wiki/API:Main](https://wiki.guildwars2.com/wiki/API:Main)) — account data and Trading Post prices

## Data & privacy

Your API key and all account data are stored locally in a SQLite database on your machine and are never sent anywhere except:

- The official GW2 API (`api.guildwars2.com`) to fetch your own account data and current market prices
- The DRF WebSocket (`wss://drf.rs/ws`), **only if** you've pasted a DRF token in Settings, to receive live drop/currency events
- Your own configured NAS address, **only if** you've set one up, to fetch market summary and price history data

Nothing is uploaded to any third-party server. If you've added a friend's API key for the Friend Recipe Lookup feature, that key is used read-only (to fetch their known recipes and crafting discipline levels) and is deliberately excluded from Import/Export backups.

---

## License

*No license specified yet.*
