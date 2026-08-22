import React, { useState, useRef, useEffect } from "react";

export const RARITY_ORDER = ["Junk", "Basic", "Fine", "Masterwork", "Rare", "Exotic", "Ascended", "Legendary"];

export const DEFAULT_RARITY_FILTER = Object.fromEntries(RARITY_ORDER.map(r => [r, true]));

// Fail-open: only explicitly-false entries are excluded. Items with an unrecognized
// or missing rarity always pass, so nothing silently vanishes.
export function passesRarityFilter(rarity, rarityFilter) {
  return rarityFilter[rarity] !== false;
}

export function RarityDropdown({ rarityFilter, setRarityFilter }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const activeCount = RARITY_ORDER.filter(r => rarityFilter[r] !== false).length;
  const toggle = (r) => setRarityFilter(prev => ({ ...prev, [r]: prev[r] === false ? true : false }));
  const setAll = (val) => setRarityFilter(Object.fromEntries(RARITY_ORDER.map(r => [r, val])));

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        className="rbtn"
        onClick={() => setOpen(o => !o)}
        style={{
          fontSize: 12,
          borderColor: activeCount < RARITY_ORDER.length ? "var(--gold)" : undefined,
          color: activeCount < RARITY_ORDER.length ? "var(--gold2)" : undefined,
        }}
      >
        Rarities ({activeCount}/{RARITY_ORDER.length}) ▾
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50,
          background: "var(--bg4)", border: "1px solid var(--gold)", borderRadius: 5,
          padding: "10px 14px", minWidth: 190, boxShadow: "0 10px 40px rgba(0,0,0,.8)",
        }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 11, fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
            <span style={{ color: "var(--gold2)", cursor: "pointer" }} onClick={() => setAll(true)}>All</span>
            <span style={{ color: "var(--text3)" }}>·</span>
            <span style={{ color: "var(--gold2)", cursor: "pointer" }} onClick={() => setAll(false)}>None</span>
          </div>
          {RARITY_ORDER.map(r => (
            <label key={r} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={rarityFilter[r] !== false} onChange={() => toggle(r)} />
              <span className={`rar-${r}`}>{r}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
