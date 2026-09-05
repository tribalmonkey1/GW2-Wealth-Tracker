/**
 * Reset Database confirmation dialog (market DB or personal DB).
 * Was an inline IIFE in App.jsx's render; unwrapped into a real component.
 * Caller is responsible for the `showResetConfirm &&` gate (see App.jsx).
 * (Split out of App.jsx.)
 */
import React from "react";
import { invoke } from "@tauri-apps/api/core";

export function ResetConfirmDialog({
  resetType, setShowResetConfirm, setDbStats, setMigrationStatus, setShowMigration,
  settingsNasSsh,
}) {
      const isMarket = resetType === "market";
      const title = isMarket ? "RESET MARKET DATABASE" : "RESET PERSONAL DATABASE";
      const description = isMarket
        ? (<>Deletes all collected price history, velocity data, and market summary from your NAS.<br /><br />
           Your crafting recommendations, flip signals, price charts, and trend data will be gone until the collector rebuilds them.<br /><br />
           You will need to restart the collector on your NAS after resetting.<br /><br />
           <span style={{ color: "var(--gold2)" }}>Your personal data (flip tracking, sold history, API key) is NOT affected.</span></>)
        : (<>Deletes all your personal app data stored locally.<br /><br />
           This removes: known crafting recipes, your GW2 API key, flip tracking history, sold order history, daily crafting records, price alerts, added friend API keys, and all app settings.<br /><br />
           <span style={{ color: "var(--gold2)" }}>Market price history on your NAS is NOT affected.</span><br /><br />
           <span style={{ color: "var(--red2,#e05555)" }}>You will need to re-enter your API key, settings, and any friend API keys after resetting.</span></>);
      const confirmLabel = isMarket ? "🗑 Reset Market DB" : "🗑 Reset Personal DB";
      const doReset = async () => {
        try {
          if (isMarket) {
            await invoke("reset_market_db_files");
            setDbStats(null);
            setMigrationStatus({ state: "done", msg: `✓ Market database deleted. Now restart the collector on your NAS:\n\nssh ${settingsNasSsh} "cd /volume1/docker/gw2-collector && sudo docker-compose down && sudo docker-compose up -d"\n\nThen wait a few minutes for data to rebuild.` });
          } else {
            await invoke("reset_database");
            setMigrationStatus({ state: "done", msg: "✓ Personal database cleared. Please re-enter your API key in Settings." });
          }
          setShowResetConfirm(false);
          setShowMigration(true);
        } catch (err) {
          setShowResetConfirm(false);
          setMigrationStatus({ state: "error", msg: `✕ Reset failed: ${err}` });
          setShowMigration(true);
        }
      };
      return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "var(--bg2)", border: "2px solid var(--red2,#e05555)", borderRadius: 8, padding: 32, maxWidth: 500, width: "90%", textAlign: "center" }}>
        <div style={{ fontFamily: "Cinzel,serif", fontSize: 16, color: "var(--red2,#e05555)", letterSpacing: 2, marginBottom: 16 }}>⚠ {title}</div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16, lineHeight: 1.7, textAlign: "left" }}>{description}</div>
        <div style={{ fontSize: 11, color: "var(--red2,#e05555)", marginBottom: 20 }}>This cannot be undone.</div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button onClick={() => setShowResetConfirm(false)}
        style={{ fontSize: 12, color: "var(--gold2)", background: "transparent", border: "1px solid var(--border)", borderRadius: 4, padding: "6px 20px", cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
        Cancel
        </button>
        <button onClick={doReset}
        style={{ fontSize: 12, color: "#fff", background: "var(--red2,#e05555)", border: "none", borderRadius: 4, padding: "6px 20px", cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
        {confirmLabel}
        </button>
        </div>
        </div>
        </div>
      );
}
