/**
 * Import / Export panel — load a backup JSON into SQLite, or export all
 * personal data + price history to a downloadable JSON file.
 * Caller is responsible for the `showMigration &&` gate (see App.jsx).
 * (Split out of App.jsx.)
 */
import React from "react";
import { importFromBrowser, exportAllData, getDbStats } from "../lib/storage.js";

export function ImportExportPanel({ migrationStatus, setMigrationStatus, setDbStats }) {
  return (
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 6, padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 280 }}>
      <div style={{ fontFamily: "Cinzel,serif", fontSize: 13, color: "var(--gold2)", letterSpacing: 2, marginBottom: 8 }}>📥 IMPORT</div>
      <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10, lineHeight: 1.6 }}>
      Load a previously exported <code>.json</code> backup — from this app or the browser version.
      </div>
      <input type="file" accept=".json"
      style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8, display: "block" }}
      onChange={async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        setMigrationStatus({ state: "importing", msg: "Reading file..." });
        try {
          const text = await file.text();
          const json = JSON.parse(text);
          setMigrationStatus({ state: "importing", msg: "Importing into SQLite..." });
          const result = await importFromBrowser(json);
          setMigrationStatus({ state: "done", msg: `✓ Imported ${(result.price_snapshots_imported || 0).toLocaleString()} price snapshots.` });
          getDbStats().then(setDbStats);
        } catch (err) {
          setMigrationStatus({ state: "error", msg: `✕ Import failed: ${err.message}` });
        }
      }} />
      {migrationStatus && (
        <div style={{ fontSize: 12, fontFamily: "monospace", whiteSpace: "pre-wrap", lineHeight: 1.7,
          color: migrationStatus.state === "done" ? "var(--green2)" : migrationStatus.state === "error" ? "var(--red)" : "var(--gold2)" }}>
          {migrationStatus.msg}
          </div>
      )}
      </div>
      <div style={{ flex: 1, minWidth: 280 }}>
      <div style={{ fontFamily: "Cinzel,serif", fontSize: 13, color: "var(--gold2)", letterSpacing: 2, marginBottom: 8 }}>📤 EXPORT</div>
      <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10, lineHeight: 1.6 }}>
      Save all your price history, flip tracking, and cache to a <code>.json</code> file. Use this before reformatting.
      </div>
      <button onClick={async () => {
        setMigrationStatus({ state: "importing", msg: "Exporting data..." });
        try {
          const exportData = await exportAllData();
          const blob = new Blob([JSON.stringify(exportData)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `gw2-backup-${new Date().toISOString().slice(0,10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
          setMigrationStatus({ state: "done", msg: `✓ Exported ${((exportData.price_history || []).length).toLocaleString()} price snapshots.` });
        } catch (err) {
          setMigrationStatus({ state: "error", msg: `✕ Export failed: ${err.message}` });
        }
      }} style={{ fontSize: 11, color: "var(--gold2)", background: "transparent", border: "1px solid var(--border)", borderRadius: 3, padding: "4px 14px", cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
      📤 Export Backup
      </button>
      </div>
      </div>
      </div>
  );
}
