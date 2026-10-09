/**
 * Gold/silver/copper currency display.
 * (Split out of App.jsx — also duplicated in MysticForgeTab.jsx; that copy
 * should now import this one instead.)
 */
import React from "react";

export const Gold = ({ v, size = 14 }) => {
  if (v == null || isNaN(v)) return <span style={{ color: "var(--text3)" }}>—</span>;
  const neg = v < 0;
  const abs = Math.abs(Math.round(v));
  const g = Math.floor(abs / 10000);
  const s = Math.floor((abs % 10000) / 100);
  const c = abs % 100;
  const col = neg ? "var(--red)" : undefined;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: size, color: col }}>
    {neg && <span>−</span>}
    {g > 0 && <><b>{g}</b><span style={{ fontSize: 10, background: "var(--coin-g-bg)", color: "var(--coin-g)", padding: "0 3px", borderRadius: 2, fontFamily: "Cinzel,serif" }}>g</span></>}
    {s > 0 && <><b>{s}</b><span style={{ fontSize: 10, background: "var(--coin-s-bg)", color: "var(--coin-s)", padding: "0 3px", borderRadius: 2, fontFamily: "Cinzel,serif" }}>s</span></>}
    <b>{c}</b><span style={{ fontSize: 10, background: "var(--coin-c-bg)", color: "var(--coin-c)", padding: "0 3px", borderRadius: 2, fontFamily: "Cinzel,serif" }}>c</span>
    </span>
  );
};
