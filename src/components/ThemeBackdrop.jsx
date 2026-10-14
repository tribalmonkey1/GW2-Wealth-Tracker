/**
 * Festival artwork behind the app. Renders nothing for the plain color schemes.
 *   Option 1 (banner):    an art strip at the top of the page that scrolls away.
 *   Option 2 (wallpaper): the art fixed behind the whole window, lightly shaded.
 * Sits behind .app (z-index 0); see "Backdrop layers" in themes.css.
 */
import React from "react";
import { useThemeState, isFestival } from "../lib/theme.js";
import { FESTIVAL_ART } from "../lib/festivalArt.js";

export function ThemeBackdrop() {
  const { id, style } = useThemeState();
  if (!isFestival(id)) return null;
  const src = FESTIVAL_ART[id];

  if (style === "wallpaper") {
    return (
      <div className="theme-backdrop" aria-hidden="true">
        <img className="tb-wall-img" src={src} alt="" />
        <div className="tb-wall-shade" />
      </div>
    );
  }
  return (
    <div className="tb-banner" aria-hidden="true"><img src={src} alt="" /></div>
  );
}
