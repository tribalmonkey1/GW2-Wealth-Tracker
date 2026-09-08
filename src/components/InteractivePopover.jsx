/**
 * InteractivePopover — same portal + getBoundingClientRect positioning
 * technique as TooltipPortal.jsx, but for popovers with real interactive
 * content (checkboxes, buttons, text inputs) instead of a hover-only,
 * pointer-events:none tooltip. Used by the Boss Timers bell (alert lead
 * time) and star (collection picker) popovers, which live inside
 * horizontally-scrolling cell rows where a plain absolutely-positioned div
 * would get clipped by the row's own overflow:auto.
 */
import React, { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

export function InteractivePopover({ anchorRef, open, onClose, children, minWidth = 180 }) {
  const [pos, setPos] = useState(null);

  const measure = useCallback(() => {
    const el = anchorRef.current;
    if (!el) { setPos(null); return; }
    const rect = el.getBoundingClientRect();
    let left = rect.left;
    const overflowRight = left + minWidth - (window.innerWidth - 12);
    if (overflowRight > 0) left = Math.max(12, left - overflowRight);
    const top = rect.bottom + 4;
    setPos({ top, left });
  }, [anchorRef, minWidth]);

  useEffect(() => {
    if (!open) return;
    measure();
    const onDocClick = (e) => {
      if (anchorRef.current?.contains(e.target)) return;
      onClose();
    };
    const onMove = () => measure();
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, measure, onClose, anchorRef]);

  if (!open || !pos) return null;
  return createPortal(
    <div
      style={{
        position: "fixed", top: pos.top, left: pos.left, minWidth, zIndex: 9999,
        background: "var(--bg4)", border: "1px solid var(--gold)", borderRadius: 5,
        padding: "8px 10px", boxShadow: "0 10px 40px rgba(0,0,0,.8)",
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}
