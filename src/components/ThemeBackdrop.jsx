/**
 * Background art for the seasonal themes. Renders nothing for the plain color
 * schemes. Sits behind .app (z-index 0); see "Backdrop layers" in themes.css.
 */
import React from "react";
import { useActiveTheme } from "../lib/theme.js";
import moonlight from "../assets/themes/halloween1-moonlight.webp";
import pumpkin from "../assets/themes/halloween2-pumpkin.webp";

export function ThemeBackdrop() {
  const theme = useActiveTheme();

  if (theme === "halloween1") {
    return (
      <div className="theme-backdrop" aria-hidden="true">
        <img className="tb-moon-img" src={moonlight} alt="" />
        <div className="tb-moon-shade" />
        <div className="tb-moon-title" />
      </div>
    );
  }

  if (theme === "halloween2") {
    return (
      <>
        <div className="theme-backdrop" aria-hidden="true"><div className="tb-pumpkin-bg" /></div>
        <div className="tb-banner" aria-hidden="true"><img src={pumpkin} alt="" /></div>
      </>
    );
  }

  return null;
}
