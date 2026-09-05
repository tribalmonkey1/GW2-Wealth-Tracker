/**
 * Friend-deletion confirmation dialog. Was an inline IIFE in App.jsx's
 * render; unwrapped into a real component.
 * Caller is responsible for the `showDeleteFriendConfirm != null` gate
 * (see App.jsx).
 * (Split out of App.jsx.)
 */
import React from "react";

export function DeleteFriendConfirmDialog({
  showDeleteFriendConfirm, setShowDeleteFriendConfirm, friends, friendBusy,
  handleDeleteFriend,
}) {
      const f = friends.find(x => x.id === showDeleteFriendConfirm);
      return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "var(--bg2)", border: "2px solid var(--red2,#e05555)", borderRadius: 8, padding: 32, maxWidth: 440, width: "90%", textAlign: "center" }}>
        <div style={{ fontFamily: "Cinzel,serif", fontSize: 15, color: "var(--red2,#e05555)", letterSpacing: 1, marginBottom: 16 }}>⚠ REMOVE {f?.name?.toUpperCase() || "FRIEND"}</div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20, lineHeight: 1.6 }}>
        Deletes their API key and everything they're known to be able to craft from your Crafting Profits and Recommended tabs. Your own recipes, materials, and recommendations are not affected.
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button onClick={() => setShowDeleteFriendConfirm(null)}
        style={{ fontSize: 12, color: "var(--gold2)", background: "transparent", border: "1px solid var(--border)", borderRadius: 4, padding: "6px 20px", cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
        Cancel
        </button>
        <button onClick={() => handleDeleteFriend(showDeleteFriendConfirm)} disabled={friendBusy}
        style={{ fontSize: 12, color: "#fff", background: "var(--red2,#e05555)", border: "none", borderRadius: 4, padding: "6px 20px", cursor: friendBusy ? "not-allowed" : "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1, opacity: friendBusy ? 0.6 : 1 }}>
        🗑 Remove Friend
        </button>
        </div>
        </div>
        </div>
      );
}
