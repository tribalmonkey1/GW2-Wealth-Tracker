#!/bin/bash
# GW2 Wealth Tracker — Linux Build Script
# Run this from inside the repo. It assumes the project (package.json, index.html,
# src/, src-tauri/) is already checked into git — nothing is generated on the fly.
#
# Usage:
#   Build:          bash install.sh
#   Clean rebuild:  bash install.sh --clean
#   Dev mode:       bash install.sh --dev

set -e

SCRIPT_DIR="$(cd "$(dirname "$(realpath "${BASH_SOURCE[0]}")")" && pwd)"
cd "$SCRIPT_DIR"

CLEAN=false
DEV_MODE=false
if [[ "$1" == "--clean" ]]; then
  CLEAN=true
elif [[ "$1" == "--dev" ]]; then
  DEV_MODE=true
fi

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║      GW2 Wealth Tracker — Linux Build    ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── System dependencies (safe to re-run) ──────────────────────────────────────
echo "► Checking system dependencies..."
sudo pacman -S --needed --noconfirm \
  base-devel webkit2gtk-4.1 gtk3 libsoup3 glib2 openssl pkg-config \
  nodejs npm curl fuse2

if ! command -v rustc &> /dev/null; then
  echo "► Installing Rust..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
fi
source "$HOME/.cargo/env"

# ── linuxdeploy (needed for AppImage bundling) ────────────────────────────────
mkdir -p "$HOME/.local/bin"
if [ ! -f "$HOME/.local/bin/linuxdeploy-x86_64.AppImage" ]; then
  echo "► Installing linuxdeploy..."
  curl -L "https://github.com/linuxdeploy/linuxdeploy/releases/download/continuous/linuxdeploy-x86_64.AppImage" -o "$HOME/.local/bin/linuxdeploy-x86_64.AppImage"
  chmod +x "$HOME/.local/bin/linuxdeploy-x86_64.AppImage"
fi
if [ ! -f "$HOME/.local/bin/linuxdeploy-plugin-appimage-x86_64.AppImage" ]; then
  echo "► Installing linuxdeploy-plugin-appimage..."
  curl -L "https://github.com/linuxdeploy/linuxdeploy-plugin-appimage/releases/download/continuous/linuxdeploy-plugin-appimage-x86_64.AppImage" -o "$HOME/.local/bin/linuxdeploy-plugin-appimage-x86_64.AppImage"
  chmod +x "$HOME/.local/bin/linuxdeploy-plugin-appimage-x86_64.AppImage"
fi
export LINUXDEPLOY="$HOME/.local/bin/linuxdeploy-x86_64.AppImage"
export LINUXDEPLOY_PLUGIN_APPIMAGE="$HOME/.local/bin/linuxdeploy-plugin-appimage-x86_64.AppImage"

# ── Install JS deps ───────────────────────────────────────────────────────────
if [ "$CLEAN" = true ]; then
  rm -rf node_modules
fi
if [ ! -d node_modules ]; then
  echo "► Installing npm dependencies..."
  npm install
fi

# ── Dev mode: launch and exit, no build/bundle step ───────────────────────────
if [ "$DEV_MODE" = true ]; then
  echo "► Launching in dev mode (devtools enabled)..."
  WEBKIT_DISABLE_COMPOSITING_MODE=1 cargo tauri dev
  exit 0
fi

# ── Build ──────────────────────────────────────────────────────────────────────
echo "► Building release binary (this takes a few minutes)..."
export APPIMAGE_EXTRACT_AND_RUN=1
export NO_STRIP=true
WEBKIT_DISABLE_COMPOSITING_MODE=1 cargo tauri build
echo "  ✓ Build complete"

# ── Install AppImage ──────────────────────────────────────────────────────────
APPIMAGE_SRC=$(find "src-tauri/target/release/bundle/appimage" -name "*.AppImage" | head -1)
APPIMAGE_DEST="$HOME/Applications/GW2-Wealth-Tracker.AppImage"
if [ -n "$APPIMAGE_SRC" ]; then
  mkdir -p "$HOME/Applications"
  cp "$APPIMAGE_SRC" "$APPIMAGE_DEST"
  chmod +x "$APPIMAGE_DEST"
  echo "  ✓ AppImage installed at $APPIMAGE_DEST"
else
  echo "  ⚠ AppImage not found — check build output above"
  exit 1
fi

# ── Desktop entry ──────────────────────────────────────────────────────────────
mkdir -p "$HOME/.local/share/applications" "$HOME/.local/share/icons/hicolor/128x128/apps"
if [ -f "src-tauri/icons/128x128.png" ]; then
  cp "src-tauri/icons/128x128.png" "$HOME/.local/share/icons/hicolor/128x128/apps/gw2-tracker.png"
  cp "src-tauri/icons/128x128.png" "$HOME/.local/share/icons/gw2-tracker.png"
fi
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

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║           Build complete!                ║"
echo "║  Launch: GW2 Wealth Tracker in app menu  ║"
echo "║  AppImage: ~/Applications/               ║"
echo "╚══════════════════════════════════════════╝"
