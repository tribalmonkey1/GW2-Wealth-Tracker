#!/bin/bash
# GW2 Wealth Tracker — Install / Update Script
# Run this on a fresh Arch Linux install to set up the app from scratch,
# or run it again to update to a newer version.
#
# Usage:
#   Fresh install:  bash install.sh
#   Update only:    bash install.sh --update-only
#   Dev mode:       bash install.sh --dev

set -e  # Exit on any error

SCRIPT_DIR="$(cd "$(dirname "$(realpath "${BASH_SOURCE[0]}")")" && pwd)"
INSTALL_DIR="$HOME/Applications/gw2-tracker"
UPDATE_ONLY=false
DEV_MODE=false
if [[ "$1" == "--update-only" ]]; then
  UPDATE_ONLY=true
elif [[ "$1" == "--dev" ]]; then
  DEV_MODE=true
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║      GW2 Wealth Tracker Installer        ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Step 1: System dependencies ──────────────────────────────────────────────
if [ "$UPDATE_ONLY" = false ]; then
  echo "► Installing system dependencies..."
  sudo pacman -S --needed --noconfirm \
    base-devel \
    webkit2gtk-4.1 \
    gtk3 \
    libsoup3 \
    glib2 \
    openssl \
    pkg-config \
    nodejs \
    npm \
    curl \
    fuse2

  # ── Step 2: Rust ─────────────────────────────────────────────────────────────
  if ! command -v rustc &> /dev/null; then
    echo "► Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
  else
    echo "► Rust already installed: $(rustc --version)"
  fi
  source "$HOME/.cargo/env"

  # ── Step 3: Create project directory ─────────────────────────────────────────
  echo "► Creating project directory at $INSTALL_DIR..."
  mkdir -p "$INSTALL_DIR/src-tauri/src"
  mkdir -p "$INSTALL_DIR/src-tauri/capabilities"
  mkdir -p "$INSTALL_DIR/src-tauri/icons"
  mkdir -p "$INSTALL_DIR/src"
fi

source "$HOME/.cargo/env"
cd "$INSTALL_DIR"

# ── linuxdeploy (needed for AppImage — runs on both fresh install and update) ─
# Tauri requires the raw AppImage version of linuxdeploy, not an extracted ELF
if [ ! -f "$HOME/.local/bin/linuxdeploy-x86_64.AppImage" ]; then
  echo "► Installing linuxdeploy AppImage for Tauri..."
  mkdir -p "$HOME/.local/bin"
  curl -L "https://github.com/linuxdeploy/linuxdeploy/releases/download/continuous/linuxdeploy-x86_64.AppImage" -o "$HOME/.local/bin/linuxdeploy-x86_64.AppImage"
  chmod +x "$HOME/.local/bin/linuxdeploy-x86_64.AppImage"
  echo "  ✓ linuxdeploy AppImage installed"
fi
if [ ! -f "$HOME/.local/bin/linuxdeploy-plugin-appimage-x86_64.AppImage" ]; then
  echo "► Installing linuxdeploy-plugin-appimage AppImage for Tauri..."
  mkdir -p "$HOME/.local/bin"
  curl -L "https://github.com/linuxdeploy/linuxdeploy-plugin-appimage/releases/download/continuous/linuxdeploy-plugin-appimage-x86_64.AppImage" -o "$HOME/.local/bin/linuxdeploy-plugin-appimage-x86_64.AppImage"
  chmod +x "$HOME/.local/bin/linuxdeploy-plugin-appimage-x86_64.AppImage"
  echo "  ✓ linuxdeploy-plugin-appimage AppImage installed"
fi
export LINUXDEPLOY="$HOME/.local/bin/linuxdeploy-x86_64.AppImage"

# ── Step 4: Write config files (only on fresh install) ───────────────────────
if [ "$UPDATE_ONLY" = false ]; then
  echo "► Writing project config files..."

  cat > package.json << 'EOF'
{
  "name": "gw2-analyzer",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "tauri": "tauri"
  },
  "dependencies": {
    "@tauri-apps/api": "^2",
    "@tauri-apps/plugin-http": "^2",
    "@tauri-apps/plugin-shell": "^2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "2.5.0",
    "esbuild": "0.21.5",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.0"
  }
}
EOF

  cat > vite.config.js << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  build: { target: ["chrome100", "safari15", "firefox100"], minify: "esbuild" },
});
EOF

  cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GW2 Wealth Tracker</title>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital@0;1&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

  cat > src/main.jsx << 'EOF'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
EOF

  cat > src-tauri/Cargo.toml << 'EOF'
[package]
name = "gw2-analyzer"
version = "0.1.0"
description = "GW2 Wealth Tracker"
edition = "2021"
rust-version = "1.77.2"

[lib]
name = "gw2_analyzer_lib"
crate-type = ["rlib"]

[[bin]]
name = "gw2-analyzer"
path = "src/main.rs"

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-shell = "2"
tauri-plugin-http = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rusqlite = { version = "0.31", features = ["bundled"] }
tokio = { version = "1", features = ["full"] }
dirs = "5"
chrono = "0.4"
ureq = { version = "2", features = ["json"] }

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
EOF

  cat > src-tauri/build.rs << 'EOF'
fn main() {
    tauri_build::build()
}
EOF

  cat > src-tauri/src/main.rs << 'EOF'
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
fn main() {
    gw2_analyzer_lib::run()
}
EOF

  cat > src-tauri/tauri.conf.json << 'EOF'
{
  "productName": "GW2 Wealth Tracker",
  "version": "0.1.0",
  "identifier": "com.gw2.analyzer",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "GW2 Wealth Tracker",
        "width": 1600,
        "height": 900,
        "minWidth": 1280,
        "minHeight": 720,
        "resizable": true
      }
    ],
    "security": { "csp": null }
  },
  "bundle": {
    "active": true,
    "targets": ["appimage", "deb"],
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png", "icons/icon.png"]
  }
}
EOF

  cat > src-tauri/capabilities/default.json << 'EOF'
{
  "identifier": "default",
  "description": "Default capabilities",
  "windows": ["main"],
  "permissions": ["core:default", "shell:allow-open", "http:default"]
}
EOF

  # Use custom icons if present next to install.sh, otherwise generate placeholders
  if [ -f "$SCRIPT_DIR/32x32.png" ] && [ -f "$SCRIPT_DIR/128x128.png" ]; then
    cp "$SCRIPT_DIR/32x32.png" "$INSTALL_DIR/src-tauri/icons/32x32.png"
    cp "$SCRIPT_DIR/128x128.png" "$INSTALL_DIR/src-tauri/icons/128x128.png"
    echo "  ✓ Custom icons copied"
  else
    # Generate placeholder RGBA PNG icons
    python3 -c "
import struct, zlib
def make_rgba_png(w, h):
    raw = b''
    for y in range(h):
        raw += b'\x00'
        for x in range(w):
            raw += bytes([200, 150, 42, 255])
    def chunk(name, data):
        crc = zlib.crc32(name + data) & 0xffffffff
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', crc)
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw))
    png += chunk(b'IEND', b'')
    return png
open('src-tauri/icons/32x32.png', 'wb').write(make_rgba_png(32, 32))
open('src-tauri/icons/128x128.png', 'wb').write(make_rgba_png(128, 128))
open('src-tauri/icons/128x128@2x.png', 'wb').write(make_rgba_png(256, 256))
open('src-tauri/icons/icon.png', 'wb').write(make_rgba_png(512, 512))
"
    echo "  ✓ Icons created (placeholder — place 32x32.png, 128x128.png, 128x128@2x.png, icon.png next to install.sh for custom icons)"
  fi
fi

# ── Always update icons in src-tauri before building ─────────────────────────
mkdir -p "$INSTALL_DIR/src-tauri/icons"
if [ -f "$SCRIPT_DIR/32x32.png" ];       then cp "$SCRIPT_DIR/32x32.png"       "$INSTALL_DIR/src-tauri/icons/32x32.png"; fi
if [ -f "$SCRIPT_DIR/128x128.png" ];     then cp "$SCRIPT_DIR/128x128.png"     "$INSTALL_DIR/src-tauri/icons/128x128.png"; fi
if [ -f "$SCRIPT_DIR/128x128@2x.png" ];  then cp "$SCRIPT_DIR/128x128@2x.png"  "$INSTALL_DIR/src-tauri/icons/128x128@2x.png"; fi
if [ -f "$SCRIPT_DIR/icon.png" ];        then cp "$SCRIPT_DIR/icon.png"         "$INSTALL_DIR/src-tauri/icons/icon.png"; fi
if [ -f "$SCRIPT_DIR/512x512.png" ];     then cp "$SCRIPT_DIR/512x512.png"      "$INSTALL_DIR/src-tauri/icons/512x512.png"; fi

# Generate any missing required placeholder icons so the build never fails on missing files
cd "$INSTALL_DIR"
python3 -c "
import struct, zlib, os
def make_rgba_png(w, h):
    raw = b''
    for y in range(h):
        raw += b'\x00'
        for x in range(w):
            raw += bytes([200, 150, 42, 255])
    def chunk(name, data):
        crc = zlib.crc32(name + data) & 0xffffffff
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', crc)
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw))
    png += chunk(b'IEND', b'')
    return png
required = [
    ('src-tauri/icons/32x32.png',       32,  32),
    ('src-tauri/icons/128x128.png',     128, 128),
    ('src-tauri/icons/128x128@2x.png',  256, 256),
    ('src-tauri/icons/icon.png',        512, 512),
]
for path, w, h in required:
    if not os.path.exists(path):
        open(path, 'wb').write(make_rgba_png(w, h))
        print('  generated placeholder: ' + path)
"
# Copy icon.png to project root — linuxdeploy uses this for the AppImage icon
if [ -f "$SCRIPT_DIR/icon.png" ]; then
  cp "$SCRIPT_DIR/icon.png" "$INSTALL_DIR/src-tauri/icons/icon.png"
  # Also copy as the app identifier name which linuxdeploy bundles
  cp "$SCRIPT_DIR/icon.png" "$INSTALL_DIR/src-tauri/icons/gw2-analyzer.png"
fi

# ── Step 5: Write Rust source files (always — this is the "update" part) ──────
echo "► Writing Rust backend..."

cat > src-tauri/src/lib.rs << 'EOF'
use rusqlite::Connection;
use std::sync::Mutex;

pub mod commands;

// Personal data DB — always local (flips, daily resets, cache)
pub struct PersonalDbState(pub Mutex<Connection>);

fn get_local_data_dir() -> std::path::PathBuf {
    let data_dir = dirs::data_local_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("gw2-analyzer");
    std::fs::create_dir_all(&data_dir).ok();
    data_dir
}

pub fn get_personal_db_path() -> std::path::PathBuf {
    get_local_data_dir().join("personal.db")
}

fn open_personal_db(path: &std::path::Path) -> Connection {
    let conn = Connection::open(path).expect("Failed to open personal database");
    conn.execute_batch("
        PRAGMA journal_mode=WAL;
        PRAGMA synchronous=NORMAL;
        PRAGMA cache_size=-8000;
        PRAGMA temp_store=MEMORY;
    ").expect("Failed to set pragmas");
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS app_cache (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            ts INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS flip_pending (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER NOT NULL,
            item_name TEXT NOT NULL,
            buy_price INTEGER NOT NULL,
            qty INTEGER NOT NULL DEFAULT 1,
            target_sell_price INTEGER NOT NULL,
            buy_time INTEGER NOT NULL,
            flagged_buy_now_ts INTEGER
        );
        CREATE TABLE IF NOT EXISTS flip_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER NOT NULL,
            item_name TEXT NOT NULL,
            buy_price INTEGER NOT NULL,
            sell_price INTEGER NOT NULL,
            qty INTEGER NOT NULL DEFAULT 1,
            profit INTEGER NOT NULL,
            buy_time INTEGER NOT NULL,
            sell_time INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS manual_daily_resets (
            item_id INTEGER PRIMARY KEY,
            count INTEGER NOT NULL,
            reset_ts INTEGER NOT NULL
        );
    ").expect("Failed to create personal tables");
    conn
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let personal_conn = open_personal_db(&get_personal_db_path());

    tauri::Builder::default()
        .manage(PersonalDbState(Mutex::new(personal_conn)))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            commands::save_price_snapshots,
            commands::save_velocity_snapshots,
            commands::load_price_history,
            commands::load_velocity_for_items,
            commands::load_price_history_bulk,
            commands::prune_old_data,
            commands::get_db_stats,
            commands::cache_set,
            commands::cache_get,
            commands::cache_get_bulk,
            commands::get_price_alert_data,
            commands::flip_pending_add,
            commands::flip_pending_get_all,
            commands::flip_pending_delete,
            commands::flip_history_add,
            commands::flip_history_get_all,
            commands::flip_history_delete,
            commands::manual_daily_set,
            commands::manual_daily_get_all,
            commands::import_from_browser,
            commands::reset_database,
            commands::reset_market_db_files,
            commands::restart_collector,
            commands::get_tracked_item_ids,
            commands::append_log,
            commands::get_market_db_info,
            commands::set_market_db_path,
            commands::get_market_summary,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
EOF

echo "  ✓ Rust backend written"

cat > src-tauri/src/commands.rs << 'EOF'
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::PersonalDbState;

// ── NAS API URL ───────────────────────────────────────────────────────────────
// Reads the configured NAS API URL from personal.db.
// Falls back to the default if not set.
fn get_api_url() -> String {
    let personal_path = crate::get_personal_db_path();
    if personal_path.exists() {
        if let Ok(conn) = rusqlite::Connection::open(&personal_path) {
            // Check for explicit saved API URL first
            if let Ok(url) = conn.query_row(
                "SELECT value FROM app_cache WHERE key = 'nas_api_url'",
                [], |r| r.get::<_, String>(0)
            ) {
                if !url.is_empty() { return url; }
            }
            // Fall back to deriving URL from nas_ssh (e.g. "derrick@192.168.1.212" -> "http://192.168.1.212:8745")
            if let Ok(ssh) = conn.query_row(
                "SELECT value FROM app_cache WHERE key = 'nas_ssh'",
                [], |r| r.get::<_, String>(0)
            ) {
                if !ssh.is_empty() {
                    let host = if ssh.contains('@') {
                        ssh.splitn(2, '@').nth(1).unwrap_or(&ssh).to_string()
                    } else {
                        ssh.clone()
                    };
                    return format!("http://{}:8745", host);
                }
            }
        }
    }
    "http://192.168.1.212:8745".to_string()
}

fn api_get(path: &str) -> Result<serde_json::Value, String> {
    let url = format!("{}{}", get_api_url(), path);
    let resp = ureq::get(&url)
        .timeout(std::time::Duration::from_secs(30))
        .call()
        .map_err(|e| format!("API request failed: {}", e))?;
    resp.into_json::<serde_json::Value>()
        .map_err(|e| format!("API response parse failed: {}", e))
}

fn api_post(path: &str, body: &serde_json::Value) -> Result<serde_json::Value, String> {
    let url = format!("{}{}", get_api_url(), path);
    let resp = ureq::post(&url)
        .timeout(std::time::Duration::from_secs(60))
        .send_json(body)
        .map_err(|e| format!("API request failed: {}", e))?;
    resp.into_json::<serde_json::Value>()
        .map_err(|e| format!("API response parse failed: {}", e))
}

// ── Structs ───────────────────────────────────────────────────────────────────
#[derive(Serialize, Deserialize, Clone)]
pub struct PricePoint {
    pub item_id: i64, pub ts: i64, pub sell: i64,
    pub buy: i64, pub sell_qty: i64, pub buy_qty: i64,
}
#[derive(Serialize, Deserialize, Clone)]
pub struct VelocityPoint {
    pub item_id: i64, pub ts: i64, pub sell_qty: i64, pub buy_qty: i64,
}
#[derive(Serialize, Deserialize)]
pub struct FlipPending {
    pub id: Option<i64>, pub item_id: i64, pub item_name: String,
    pub buy_price: i64, pub qty: i64, pub target_sell_price: i64,
    pub buy_time: i64, pub flagged_buy_now_ts: Option<i64>,
}
#[derive(Serialize, Deserialize)]
pub struct FlipHistory {
    pub id: Option<i64>, pub item_id: i64, pub item_name: String,
    pub buy_price: i64, pub sell_price: i64, pub qty: i64,
    pub profit: i64, pub buy_time: i64, pub sell_time: i64,
}
#[derive(Serialize, Deserialize)]
pub struct ManualDailyReset { pub item_id: i64, pub count: i64, pub reset_ts: i64 }
#[derive(Serialize, Deserialize, Clone)]
pub struct CacheEntry { pub key: String, pub value: String, pub ts: i64 }
#[derive(Serialize, Deserialize)]
pub struct ImportData {
    pub price_history: Vec<PricePoint>,
    pub velocity_snapshots: Vec<VelocityPoint>,
    pub flip_pending: Vec<FlipPending>,
    pub flip_history: Vec<FlipHistory>,
    pub manual_daily_resets: Vec<ManualDailyReset>,
    pub app_cache: Vec<CacheEntry>,
}
#[derive(Serialize)]
pub struct DbStats {
    pub size_mb: f64,
    pub price_history_count: i64,
    pub velocity_count: i64,
    pub db_path: String,
}
#[derive(Serialize)]
pub struct MarketDbInfo {
    pub path: String,
    pub exists: bool,
    pub size_mb: f64,
}
#[derive(Serialize, Clone)]
pub struct VelocityResult {
    pub item_id: i64, pub sell_fills_per_hr: f64, pub buy_fills_per_hr: f64,
    pub observations: i64, pub window_hrs: f64,
}
#[derive(Serialize, Clone)]
pub struct TrendResult {
    pub item_id: i64, pub pct: f64, pub current: i64, pub old: i64,
}
#[derive(Serialize, Clone)]
pub struct FlipResult {
    pub item_id: i64, pub p10_sell: i64, pub p25_sell: i64, pub p50_sell: i64,
    pub p75_sell: i64, pub p90_sell: i64, pub swing: f64, pub snap_count: i64,
}
#[derive(Serialize, Clone)]
pub struct MarketSummary {
    pub velocity: Vec<VelocityResult>,
    pub trends: Vec<TrendResult>,
    pub flips: Vec<FlipResult>,
}
#[derive(Serialize, Deserialize)]
pub struct PriceAlertData {
    pub item_id: i64, pub seven_day_max: i64, pub row_count: i64,
}

// ── Price Snapshots (no-op — collector handles writes) ────────────────────────
#[tauri::command]
pub fn save_price_snapshots(_points: Vec<PricePoint>) -> Result<u32, String> { Ok(0) }

#[tauri::command]
pub fn save_velocity_snapshots(_points: Vec<VelocityPoint>) -> Result<(), String> { Ok(()) }

// ── Market data — all routed through NAS API ──────────────────────────────────

#[tauri::command]
pub fn load_price_history(item_id: i64, since_ts: i64) -> Result<Vec<PricePoint>, String> {
    let val = api_post("/price-history", &serde_json::json!({
        "item_id": item_id, "since_ts": since_ts
    }))?;
    serde_json::from_value(val).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_price_history_bulk(item_ids: Vec<i64>, since_ts: i64) -> Result<Vec<PricePoint>, String> {
    if item_ids.is_empty() { return Ok(vec![]); }
    let val = api_post("/price-history-bulk", &serde_json::json!({
        "item_ids": item_ids, "since_ts": since_ts
    }))?;
    serde_json::from_value(val).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_velocity_for_items(item_ids: Vec<i64>, since_ts: i64) -> Result<Vec<VelocityPoint>, String> {
    if item_ids.is_empty() { return Ok(vec![]); }
    let val = api_post("/velocity-for-items", &serde_json::json!({
        "item_ids": item_ids, "since_ts": since_ts
    }))?;
    serde_json::from_value(val).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_price_alert_data(item_ids: Vec<i64>, since_ts: i64) -> Result<Vec<PriceAlertData>, String> {
    if item_ids.is_empty() { return Ok(vec![]); }
    let val = api_post("/price-alert-data", &serde_json::json!({
        "item_ids": item_ids, "since_ts": since_ts
    }))?;
    serde_json::from_value(val).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_db_stats() -> Result<DbStats, String> {
    let val = api_get("/db-stats")?;
    Ok(DbStats {
        size_mb: val["size_mb"].as_f64().unwrap_or(0.0),
        price_history_count: val["price_history_count"].as_i64().unwrap_or(0),
        velocity_count: val["velocity_count"].as_i64().unwrap_or(0),
        db_path: val["db_path"].as_str().unwrap_or("").to_string(),
    })
}

#[tauri::command]
pub fn prune_old_data() -> Result<(), String> {
    // Collector handles pruning on the NAS side
    Ok(())
}

#[tauri::command]
pub fn reset_market_db_files() -> Result<(), String> {
    api_post("/reset", &serde_json::json!({}))?;
    Ok(())
}

// ── Background market summary ─────────────────────────────────────────────────
use std::sync::{Mutex as StdMutex, OnceLock};

struct MarketSummaryCache {
    last_computed_ms: i64,
    is_computing: bool,
    cached: Option<MarketSummary>,
}

fn market_cache() -> &'static StdMutex<MarketSummaryCache> {
    static MARKET_CACHE: OnceLock<StdMutex<MarketSummaryCache>> = OnceLock::new();
    MARKET_CACHE.get_or_init(|| StdMutex::new(MarketSummaryCache {
        last_computed_ms: 0, is_computing: false, cached: None,
    }))
}

#[tauri::command]
pub fn get_market_summary() -> Result<MarketSummary, String> {
    let now_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64;
    let cache_ttl_ms: i64 = 60 * 1000;

    let (cached_result, should_spawn) = {
        let cache = market_cache().lock().unwrap();
        let stale = now_ms - cache.last_computed_ms >= cache_ttl_ms;
        let result = cache.cached.as_ref().map(|c| MarketSummary {
            velocity: c.velocity.clone(),
            trends:   c.trends.clone(),
            flips:    c.flips.clone(),
        });
        (result, stale && !cache.is_computing)
    };

    if should_spawn {
        { market_cache().lock().unwrap().is_computing = true; }
        std::thread::spawn(move || {
            let result = fetch_market_summary_from_api();
            let mut cache = market_cache().lock().unwrap();
            cache.is_computing = false;
            cache.last_computed_ms = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as i64;
            if let Ok(r) = result { cache.cached = Some(r); }
        });
    }

    Ok(cached_result.unwrap_or_else(|| MarketSummary {
        velocity: vec![], trends: vec![], flips: vec![],
    }))
}

fn fetch_market_summary_from_api() -> Result<MarketSummary, String> {
    let val = api_get("/market-summary")?;

    let velocity = val["velocity"].as_array().unwrap_or(&vec![]).iter().filter_map(|v| {
        Some(VelocityResult {
            item_id:          v["item_id"].as_i64()?,
            sell_fills_per_hr: v["sell_fills_per_hr"].as_f64()?,
            buy_fills_per_hr:  v["buy_fills_per_hr"].as_f64()?,
            observations:      v["observations"].as_i64()?,
            window_hrs:        v["window_hrs"].as_f64()?,
        })
    }).collect();

    let trends = val["trends"].as_array().unwrap_or(&vec![]).iter().filter_map(|t| {
        Some(TrendResult {
            item_id: t["item_id"].as_i64()?,
            pct:     t["pct"].as_f64()?,
            current: t["current"].as_i64()?,
            old:     t["old"].as_i64()?,
        })
    }).collect();

    let flips = val["flips"].as_array().unwrap_or(&vec![]).iter().filter_map(|f| {
        Some(FlipResult {
            item_id:    f["item_id"].as_i64()?,
            p10_sell:   f["p10_sell"].as_i64()?,
            p25_sell:   f["p25_sell"].as_i64()?,
            p50_sell:   f["p50_sell"].as_i64()?,
            p75_sell:   f["p75_sell"].as_i64()?,
            p90_sell:   f["p90_sell"].as_i64()?,
            swing:      f["swing"].as_f64()?,
            snap_count: f["snap_count"].as_i64()?,
        })
    }).collect();

    Ok(MarketSummary { velocity, trends, flips })
}

// ── NAS API URL setting ───────────────────────────────────────────────────────
#[tauri::command]
pub fn get_market_db_info(personal: State<'_, PersonalDbState>) -> Result<MarketDbInfo, String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    // Return the saved NAS SSH address for display in the settings NAS Address field
    let saved_ssh: String = conn.query_row(
        "SELECT value FROM app_cache WHERE key = 'nas_ssh'",
        [], |r| r.get(0)
    ).unwrap_or_default();
    // Test connectivity using the derived API URL
    let api_url = get_api_url();
    let exists = ureq::get(&format!("{}/health", api_url))
        .timeout(std::time::Duration::from_secs(3))
        .call().is_ok();
    Ok(MarketDbInfo { path: saved_ssh, exists, size_mb: 0.0 })
}

#[tauri::command]
pub fn set_market_db_path(personal: State<'_, PersonalDbState>, path: String) -> Result<String, String> {
    // `path` is the NAS address entered in settings (e.g. "192.168.1.212" or "derrick@192.168.1.212")
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().timestamp_millis();
    if path.is_empty() {
        conn.execute("DELETE FROM app_cache WHERE key='nas_api_url'", []).map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM app_cache WHERE key='nas_ssh'", []).map_err(|e| e.to_string())?;
        Ok("NAS address cleared — restart app to apply".to_string())
    } else {
        // Derive API URL: strip user@ prefix if present, append port 8745
        let host = if path.contains('@') {
            path.splitn(2, '@').nth(1).unwrap_or(&path).to_string()
        } else {
            path.clone()
        };
        let api_url = format!("http://{}:8745", host);
        // Quick connectivity check using derived URL
        let reachable = ureq::get(&format!("{}/health", api_url))
            .timeout(std::time::Duration::from_secs(3))
            .call().is_ok();
        if !reachable {
            return Err(format!("Cannot reach API at {} — is gw2-api running?", api_url));
        }
        // Save both the derived API URL and the raw address (for SSH restart commands)
        conn.execute(
            "INSERT OR REPLACE INTO app_cache (key,value,ts) VALUES ('nas_api_url',?,?)",
            params![api_url, now]
        ).map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT OR REPLACE INTO app_cache (key,value,ts) VALUES ('nas_ssh',?,?)",
            params![path, now]
        ).map_err(|e| e.to_string())?;
        Ok(format!("NAS address saved — connecting to {}", api_url))
    }
}

// ── Import / Export ───────────────────────────────────────────────────────────
#[tauri::command]
pub fn import_from_browser(personal: State<'_, PersonalDbState>, data: ImportData) -> Result<serde_json::Value, String> {
    // Send market data to API
    let market_payload = serde_json::json!({
        "price_history": data.price_history,
        "velocity_snapshots": data.velocity_snapshots,
    });
    let api_result = api_post("/import", &market_payload).unwrap_or(serde_json::json!({}));
    let price_count = api_result["price_history"].as_i64().unwrap_or(0);
    let vel_count   = api_result["velocity_snapshots"].as_i64().unwrap_or(0);

    // Personal data goes to local personal.db as before
    let pconn = personal.0.lock().map_err(|e| e.to_string())?;
    let ptx = pconn.unchecked_transaction().map_err(|e| e.to_string())?;
    for f in &data.flip_pending {
        ptx.execute(
            "INSERT OR IGNORE INTO flip_pending (item_id,item_name,buy_price,qty,target_sell_price,buy_time,flagged_buy_now_ts) VALUES (?,?,?,?,?,?,?)",
            params![f.item_id, f.item_name, f.buy_price, f.qty, f.target_sell_price, f.buy_time, f.flagged_buy_now_ts],
        ).ok();
    }
    for f in &data.flip_history {
        ptx.execute(
            "INSERT OR IGNORE INTO flip_history (item_id,item_name,buy_price,sell_price,qty,profit,buy_time,sell_time) VALUES (?,?,?,?,?,?,?,?)",
            params![f.item_id, f.item_name, f.buy_price, f.sell_price, f.qty, f.profit, f.buy_time, f.sell_time],
        ).ok();
    }
    for m in &data.manual_daily_resets {
        ptx.execute(
            "INSERT OR REPLACE INTO manual_daily_resets (item_id,count,reset_ts) VALUES (?,?,?)",
            params![m.item_id, m.count, m.reset_ts],
        ).ok();
    }
    let now = chrono::Utc::now().timestamp_millis();
    for c in &data.app_cache {
        if c.key == "market_db_path" || c.key == "nas_api_url" { continue; }
        ptx.execute(
            "INSERT OR REPLACE INTO app_cache (key,value,ts) VALUES (?,?,?)",
            params![c.key, c.value, now],
        ).ok();
    }
    ptx.commit().map_err(|e| e.to_string())?;
    Ok(serde_json::json!({ "price_snapshots_imported": price_count, "velocity_snapshots_imported": vel_count }))
}

// ── Cache (personal.db) ───────────────────────────────────────────────────────
#[tauri::command]
pub fn cache_get_bulk(personal: State<'_, PersonalDbState>, keys: Vec<String>) -> Result<Vec<Option<CacheEntry>>, String> {
    if keys.is_empty() { return Ok(vec![]); }
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    let placeholders = keys.iter().map(|_| "?").collect::<Vec<_>>().join(",");
    let sql = format!("SELECT key,value,ts FROM app_cache WHERE key IN ({})", placeholders);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let found: std::collections::HashMap<String, CacheEntry> = stmt
        .query_map(rusqlite::params_from_iter(keys.iter()), |r| {
            Ok(CacheEntry { key: r.get(0)?, value: r.get(1)?, ts: r.get(2)? })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .map(|e| (e.key.clone(), e))
        .collect();
    Ok(keys.iter().map(|k| found.get(k).cloned()).collect())
}

#[tauri::command]
pub fn cache_set(personal: State<'_, PersonalDbState>, key: String, value: String) -> Result<(), String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().timestamp_millis();
    conn.execute(
        "INSERT OR REPLACE INTO app_cache (key,value,ts) VALUES (?,?,?)",
        params![key, value, now]
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn cache_get(personal: State<'_, PersonalDbState>, key: String) -> Result<Option<CacheEntry>, String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    let result = conn.query_row(
        "SELECT key,value,ts FROM app_cache WHERE key=?", params![key],
        |r| Ok(CacheEntry { key: r.get(0)?, value: r.get(1)?, ts: r.get(2)? })
    );
    match result {
        Ok(e) => Ok(Some(e)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

// ── Flip Tracking ─────────────────────────────────────────────────────────────
#[tauri::command]
pub fn flip_pending_add(personal: State<'_, PersonalDbState>, entry: FlipPending) -> Result<i64, String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO flip_pending (item_id,item_name,buy_price,qty,target_sell_price,buy_time,flagged_buy_now_ts) VALUES (?,?,?,?,?,?,?)",
        params![entry.item_id, entry.item_name, entry.buy_price, entry.qty, entry.target_sell_price, entry.buy_time, entry.flagged_buy_now_ts],
    ).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn flip_pending_get_all(personal: State<'_, PersonalDbState>) -> Result<Vec<FlipPending>, String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id,item_id,item_name,buy_price,qty,target_sell_price,buy_time,flagged_buy_now_ts FROM flip_pending ORDER BY buy_time DESC"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |r| Ok(FlipPending {
        id: r.get(0)?, item_id: r.get(1)?, item_name: r.get(2)?,
        buy_price: r.get(3)?, qty: r.get(4)?, target_sell_price: r.get(5)?,
        buy_time: r.get(6)?, flagged_buy_now_ts: r.get(7)?,
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(rows)
}

#[tauri::command]
pub fn flip_pending_delete(personal: State<'_, PersonalDbState>, id: i64) -> Result<(), String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM flip_pending WHERE id=?", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn flip_history_add(personal: State<'_, PersonalDbState>, entry: FlipHistory) -> Result<i64, String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO flip_history (item_id,item_name,buy_price,sell_price,qty,profit,buy_time,sell_time) VALUES (?,?,?,?,?,?,?,?)",
        params![entry.item_id, entry.item_name, entry.buy_price, entry.sell_price, entry.qty, entry.profit, entry.buy_time, entry.sell_time],
    ).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn flip_history_get_all(personal: State<'_, PersonalDbState>) -> Result<Vec<FlipHistory>, String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id,item_id,item_name,buy_price,sell_price,qty,profit,buy_time,sell_time FROM flip_history ORDER BY sell_time DESC"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |r| Ok(FlipHistory {
        id: r.get(0)?, item_id: r.get(1)?, item_name: r.get(2)?,
        buy_price: r.get(3)?, sell_price: r.get(4)?, qty: r.get(5)?,
        profit: r.get(6)?, buy_time: r.get(7)?, sell_time: r.get(8)?,
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(rows)
}

#[tauri::command]
pub fn flip_history_delete(personal: State<'_, PersonalDbState>, id: i64) -> Result<(), String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM flip_history WHERE id=?", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

// ── Manual Daily Resets ───────────────────────────────────────────────────────
#[tauri::command]
pub fn manual_daily_set(personal: State<'_, PersonalDbState>, item_id: i64, count: i64, reset_ts: i64) -> Result<(), String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO manual_daily_resets (item_id,count,reset_ts) VALUES (?,?,?)",
        params![item_id, count, reset_ts]
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn manual_daily_get_all(personal: State<'_, PersonalDbState>) -> Result<Vec<ManualDailyReset>, String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT item_id,count,reset_ts FROM manual_daily_resets").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |r| Ok(ManualDailyReset {
        item_id: r.get(0)?, count: r.get(1)?, reset_ts: r.get(2)?
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(rows)
}

// ── Reset personal data ───────────────────────────────────────────────────────
#[tauri::command]
pub fn reset_database(personal: State<'_, PersonalDbState>) -> Result<(), String> {
    let pconn = personal.0.lock().map_err(|e| e.to_string())?;
    pconn.execute_batch("
        DELETE FROM flip_pending;
        DELETE FROM flip_history;
        DELETE FROM manual_daily_resets;
        DELETE FROM app_cache WHERE key NOT IN ('nas_api_url','nas_ssh');
        VACUUM;
    ").map_err(|e| e.to_string())?;
    Ok(())
}

// ── Restart collector via SSH ─────────────────────────────────────────────────
#[tauri::command]
pub fn restart_collector(personal: State<'_, PersonalDbState>, ssh_target: String) -> Result<(), String> {
    let now = chrono::Utc::now().timestamp_millis();
    if let Ok(conn) = personal.0.lock() {
        conn.execute(
            "INSERT OR REPLACE INTO app_cache (key,value,ts) VALUES ('nas_ssh',?,?)",
            rusqlite::params![ssh_target, now]
        ).ok();
    }
    let cmd = format!(
        "ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 {} \
         'cd /volume1/docker/gw2-collector && sudo docker-compose down && sudo docker-compose up -d'",
        ssh_target
    );
    let output = std::process::Command::new("sh")
        .arg("-c").arg(&cmd)
        .output()
        .map_err(|e| format!("Failed to run SSH: {}", e))?;
    if output.status.success() { Ok(()) }
    else { Err(format!("SSH failed: {}", String::from_utf8_lossy(&output.stderr))) }
}

#[tauri::command]
pub fn get_tracked_item_ids() -> Result<Vec<i64>, String> {
    // Not needed with API architecture — return empty
    Ok(vec![])
}

#[tauri::command]
pub fn append_log(_message: String) -> Result<(), String> { Ok(()) }

EOF

echo "  ✓ commands.rs written"

# ── Step 6: Copy frontend files (caller must supply App.jsx and storage.js) ─── (caller must supply App.jsx and storage.js) ───
echo ""
echo "► Checking for App.jsx and storage.js in current directory..."

if [ -f "$SCRIPT_DIR/App.jsx" ]; then
  cp "$SCRIPT_DIR/App.jsx" "$INSTALL_DIR/src/App.jsx"
  echo "  ✓ App.jsx copied"
else
  echo "  ⚠ App.jsx not found next to install.sh — skipping (keep existing or copy manually)"
fi

if [ -f "$SCRIPT_DIR/storage.js" ]; then
  cp "$SCRIPT_DIR/storage.js" "$INSTALL_DIR/src/storage.js"
  echo "  ✓ storage.js copied"
else
  echo "  ⚠ storage.js not found next to install.sh — skipping"
fi

if [ -f "$SCRIPT_DIR/market-worker.js" ]; then
  cp "$SCRIPT_DIR/market-worker.js" "$INSTALL_DIR/src/market-worker.js"
  echo "  ✓ market-worker.js copied"
else
  echo "  ⚠ market-worker.js not found next to install.sh — skipping"
fi

if [ -f "$SCRIPT_DIR/main.jsx" ] && [ ! -f "$INSTALL_DIR/src/main.jsx" ]; then
  cp "$SCRIPT_DIR/main.jsx" "$INSTALL_DIR/src/main.jsx"
fi

# ── Step 7: npm install ───────────────────────────────────────────────────────
if [ "$UPDATE_ONLY" = false ]; then
  echo "► Running npm install..."
  cd "$INSTALL_DIR"
  npm install
fi

# ── Step 8: Build ─────────────────────────────────────────────────────────────
echo ""
cd "$INSTALL_DIR"
if [[ "$DEV_MODE" == "true" ]]; then
  echo "► Launching in dev mode (devtools enabled, no build needed)..."
  echo "  Open devtools with F12 or right-click → Inspect"
  WEBKIT_DISABLE_COMPOSITING_MODE=1 cargo tauri dev
  exit 0
fi
echo "► Building release binary (this takes 5-10 minutes on first run)..."
export LINUXDEPLOY="$HOME/.local/bin/linuxdeploy-x86_64.AppImage"
export LINUXDEPLOY_PLUGIN_APPIMAGE="$HOME/.local/bin/linuxdeploy-plugin-appimage-x86_64.AppImage"
export APPIMAGE_EXTRACT_AND_RUN=1
export NO_STRIP=true
WEBKIT_DISABLE_COMPOSITING_MODE=1 cargo tauri build
echo "  ✓ Build complete"

# ── Step 9: Copy AppImage and clean up everything ────────────────────────────
APPIMAGE_SRC=$(find "$INSTALL_DIR/src-tauri/target/release/bundle/appimage" -name "*.AppImage" | head -1)
APPIMAGE_DEST="$HOME/Applications/GW2-Wealth-Tracker.AppImage"

if [ -n "$APPIMAGE_SRC" ]; then
  echo "► Copying AppImage to ~/Applications/..."
  mkdir -p "$HOME/Applications"
  cp "$APPIMAGE_SRC" "$APPIMAGE_DEST"
  chmod +x "$APPIMAGE_DEST"
  echo "  ✓ AppImage installed at $APPIMAGE_DEST"

  echo "► Cleaning up build directory..."
  rm -rf "$INSTALL_DIR"
  echo "  ✓ Build directory removed"
else
  echo "  ⚠ AppImage not found — keeping build directory"
  APPIMAGE_DEST="$HOME/Applications/GW2-Wealth-Tracker.AppImage"
fi

# ── Step 10: Desktop entry and icons ─────────────────────────────────────────
echo "► Installing icons and desktop entry..."
mkdir -p "$HOME/.local/share/applications"
mkdir -p "$HOME/.local/share/icons/hicolor/32x32/apps"
mkdir -p "$HOME/.local/share/icons/hicolor/128x128/apps"
mkdir -p "$HOME/.local/share/icons/hicolor/256x256/apps"
mkdir -p "$HOME/.local/share/icons/hicolor/512x512/apps"

if [ -f "$SCRIPT_DIR/32x32.png" ];   then cp "$SCRIPT_DIR/32x32.png"   "$HOME/.local/share/icons/hicolor/32x32/apps/gw2-tracker.png"; fi
if [ -f "$SCRIPT_DIR/128x128.png" ]; then
  cp "$SCRIPT_DIR/128x128.png" "$HOME/.local/share/icons/hicolor/128x128/apps/gw2-tracker.png"
  cp "$SCRIPT_DIR/128x128.png" "$HOME/.local/share/icons/gw2-tracker.png"
fi
if [ -f "$SCRIPT_DIR/256x256.png" ]; then cp "$SCRIPT_DIR/256x256.png" "$HOME/.local/share/icons/hicolor/256x256/apps/gw2-tracker.png"; fi
if [ -f "$SCRIPT_DIR/512x512.png" ]; then cp "$SCRIPT_DIR/512x512.png" "$HOME/.local/share/icons/hicolor/512x512/apps/gw2-tracker.png"; fi

cat > "$HOME/.local/share/applications/gw2-tracker.desktop" << DESKTOPEOF
[Desktop Entry]
Name=GW2 Wealth Tracker
Exec=env WEBKIT_DISABLE_COMPOSITING_MODE=1 "$APPIMAGE_DEST"
Icon=gw2-tracker
Type=Application
Categories=Game;
Terminal=false
DESKTOPEOF

gtk-update-icon-cache "$HOME/.local/share/icons/hicolor" 2>/dev/null || true
kbuildsycoca6 2>/dev/null || true
echo "  ✓ Icons and desktop entry installed"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║           Installation complete!         ║"
echo "║                                          ║"
echo "║  Launch: GW2 Wealth Tracker in KDE menu  ║"
echo "║  AppImage: ~/Applications/               ║"
echo "║  Data:   ~/.local/share/gw2-analyzer/    ║"
echo "║  Update: bash install.sh --update-only   ║"
echo "╚══════════════════════════════════════════╝"
