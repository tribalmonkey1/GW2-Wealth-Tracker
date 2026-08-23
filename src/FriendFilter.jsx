import React, { useState, useRef, useEffect } from "react";

// friendFilter shape: { enabled: boolean, byFriend: { [friendId]: boolean } }
//
// enabled       = master "show recipes only a friend knows" toggle. Off means
//                 friend-only cards never appear, full stop — today's exact
//                 behavior with zero friend involvement.
// byFriend[id]  = false to exclude that specific friend while enabled is true.
//                 Fail-open per friend (same convention as RarityFilter): a
//                 missing/undefined entry defaults to included, so a newly-added
//                 friend shows up immediately without needing to backfill this
//                 object.
export const DEFAULT_FRIEND_FILTER = { enabled: false, byFriend: {} };

// A craft item only needs to pass this filter if it's friend-only — i.e. the
// user doesn't know the recipe themselves (ci.isFriendOnly / ci.friendBadges is
// how App.jsx tags these). Cards the user already knows are never touched by
// this filter and always pass straight through, since "I can craft this myself"
// doesn't need a friend callout per the product decision that drove this filter.
export function passesFriendFilter(ci, friendFilter) {
  if (!ci?.isFriendOnly) return true;
  if (!friendFilter.enabled) return false;
  const badges = ci.friendBadges || [];
  if (badges.length === 0) return false;
  return badges.some(b => friendFilter.byFriend[b.friendId] !== false);
}

export function FriendFilterDropdown({ friends, friendFilter, setFriendFilter }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Only renders once at least one friend key has been added — no empty/disabled
  // control cluttering the bar for everyone else.
  if (!friends || friends.length === 0) return null;

  const activeFriendCount = friends.filter(f => friendFilter.byFriend[f.id] !== false).length;
  const toggleMaster = () => setFriendFilter(prev => ({ ...prev, enabled: !prev.enabled }));
  const toggleFriend = (id) => setFriendFilter(prev => ({
    ...prev,
    byFriend: { ...prev.byFriend, [id]: prev.byFriend[id] === false ? true : false },
  }));

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        className="rbtn"
        onClick={() => setOpen(o => !o)}
        style={{
          fontSize: 12,
          borderColor: friendFilter.enabled ? "#9f4dff" : undefined,
          color: friendFilter.enabled ? "#c9a0ff" : undefined,
        }}
      >
        🛠 Friend Can Craft (I Can't) {friendFilter.enabled ? `(${activeFriendCount}/${friends.length})` : "· off"} ▾
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50,
          background: "var(--bg4)", border: "1px solid #9f4dff", borderRadius: 5,
          padding: "10px 14px", minWidth: 240, boxShadow: "0 10px 40px rgba(0,0,0,.8)",
        }}>
          <label style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: friendFilter.enabled ? 8 : 0, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
            <input type="checkbox" checked={friendFilter.enabled} onChange={toggleMaster} />
            <span style={{ color: "#c9a0ff" }}>Show recipes only a friend knows</span>
          </label>
          {friendFilter.enabled && (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 2 }}>
              {friends.map(f => (
                <label key={f.id} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={friendFilter.byFriend[f.id] !== false} onChange={() => toggleFriend(f.id)} />
                  <span>{f.name}</span>
                  {f.last_refresh_ok === false && (
                    <span title="Last refresh failed — showing last-known recipes" style={{ fontSize: 10, color: "var(--red2,#e05555)" }}>⚠</span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
