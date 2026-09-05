/**
 * Portal-based hover tooltip — renders into document.body with
 * position:fixed, positioned from the trigger's getBoundingClientRect().
 * Escapes any ancestor's overflow:hidden clipping. Re-measures on open and
 * while visible on scroll/resize.
 * (Split out of App.jsx — also duplicated in MysticForgeTab.jsx; that copy
 * should now import this one instead.)
 */
import React, { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export function TooltipPortal({ anchorRef, visible, children, minWidth = 260, maxWidth = 460 }) {
  const [pos, setPos] = useState(null);

  const measure = useCallback(() => {
    const el = anchorRef.current;
    if (!el) { setPos(null); return; }
    const rect = el.getBoundingClientRect();
    let left = rect.left;
    const overflowRight = left + maxWidth - (window.innerWidth - 12);
    if (overflowRight > 0) left = Math.max(12, left - overflowRight);
    let top = rect.bottom + 6;
    // Flip above the trigger if there isn't room below
    if (top + 160 > window.innerHeight - 12 && rect.top > window.innerHeight - rect.bottom) {
      top = Math.max(12, rect.top - 6);
      setPos({ top, left, flip: true });
      return;
    }
    setPos({ top, left, flip: false });
  }, [anchorRef, maxWidth]);

  useEffect(() => {
    if (!visible) { setPos(null); return; }
    measure();
    const onMove = () => measure();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [visible, measure]);

  if (!visible || !pos) return null;
  return createPortal(
    <div
      className="tt-portal"
      style={{
        top: pos.flip ? undefined : pos.top,
        bottom: pos.flip ? (window.innerHeight - pos.top) : undefined,
        left: pos.left,
        minWidth, maxWidth,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
