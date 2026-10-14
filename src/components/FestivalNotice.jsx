/**
 * Small festival greeting under the header while a festival theme is showing.
 * Dismissing it hides it for that festival until a different festival shows.
 */
import React, { useState } from "react";
import { getFestival } from "../lib/theme.js";

const KEY = "gw2wt.festNoteDismissed";

export function FestivalNotice({ themeId }) {
  const fest = getFestival(themeId);
  const [dismissed, setDismissed] = useState(() => { try { return localStorage.getItem(KEY); } catch { return null; } });
  if (!fest || dismissed === fest.id) return null;

  const dismiss = () => {
    try { localStorage.setItem(KEY, fest.id); } catch { /* storage unavailable */ }
    setDismissed(fest.id);
  };

  return (
    <div className="fest-note" role="status">
      <span className="fest-note-stripe" aria-hidden="true" />
      <span className="fest-note-label">{fest.label}</span>
      <span className="fest-note-text">{fest.note}</span>
      <button className="fest-note-x" onClick={dismiss} aria-label={`Hide the ${fest.name} message`}>×</button>
    </div>
  );
}
