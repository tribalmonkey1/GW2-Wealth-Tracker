/**
 * Time Gated tab — daily/weekly time-gated crafting checklist (API-tracked
 * + manual count-tracked items) with discipline-eligibility badges.
 * Was an inline IIFE in App.jsx's render; unwrapped into a real component.
 * Caller is responsible for the `activeTab === "daily" && data` gate
 * (see App.jsx).
 * (Split out of App.jsx.)
 */
import React from "react";
import { invoke } from "@tauri-apps/api/core";
import { Gold } from "../components/Gold.jsx";
import { getDailyResetTs, getWeeklyResetTs } from "../lib/dailyCrafting.js";

export function TimeGatedTab({
  data, cacheRef, dailyCrafted, manualDailyCrafted, mySoldHistory,
  resetCountdown, weeklyKeyDone, setWeeklyKeyDone, extraDailyItems,
}) {
        const discLevels = cacheRef.current.disciplineLevels || {};
        const eligible = data.timegatedList || [];
        // Combine API-tracked completions and manual count-delta completions
        const isDone = (r) => {
          if (r.trackByCount ? manualDailyCrafted.has(r.itemId) : dailyCrafted.has(r.itemId)) return true;
          // Also check if sold on TP today (since last reset at 00:00 UTC)
          const resetTs = getDailyResetTs();
          return mySoldHistory.some(s => s.item_id === r.itemId && new Date(s.purchased).getTime() >= resetTs);
        };
        const doneCount = eligible.filter(r => isDone(r)).length + (weeklyKeyDone ? 1 : 0);
        const totalCount = eligible.length + 1; // +1 for weekly key
        const allDone = doneCount === totalCount && totalCount > 1;
        // Weekly reset countdown
        const weeklyResetTs = getWeeklyResetTs() + 7 * 86400000; // next reset
        const weeklyMsLeft = weeklyResetTs - Date.now();
        const weeklyDays = Math.floor(weeklyMsLeft / 86400000);
        const weeklyHrs = Math.floor((weeklyMsLeft % 86400000) / 3600000);
        const weeklyCountdown = weeklyMsLeft > 0 ? `${weeklyDays}d ${weeklyHrs}h` : "now";
        return (
          <div>
          {/* Header bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
          <span style={{ fontFamily: "Cinzel,serif", fontSize: 13, letterSpacing: 1, color: "var(--gold2)" }}>
          DAILY TIME-GATED CRAFTS
          </span>
          <span style={{ marginLeft: 12, fontSize: 12, color: "var(--text3)" }}>
          Resets at midnight UTC · count-tracked items update within 1 minute
          </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {allDone
            ? <span style={{ fontSize: 12, color: "var(--green2)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>✓ ALL DONE</span>
            : <span style={{ fontSize: 12, color: "var(--text3)" }}>{doneCount}/{totalCount} done</span>
          }
          <span style={{ fontSize: 13, color: "var(--gold)", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
          ⏱ {resetCountdown}
          </span>
          </div>
          </div>

          {eligible.length === 0 && (
            <div className="empty">No time-gated recipes available at your current discipline levels.</div>
          )}

          {/* Weekly Level 10 Key */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            padding: "14px 20px", marginBottom: 8, borderRadius: 6,
            background: weeklyKeyDone ? "rgba(30,50,30,0.5)" : "var(--bg3)",
                border: `1px solid ${weeklyKeyDone ? "rgba(60,140,60,0.4)" : "var(--border)"}`,
                opacity: weeklyKeyDone ? 0.75 : 1,
                transition: "all .2s",
          }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: weeklyKeyDone ? "rgba(60,160,60,0.2)" : "rgba(100,140,200,0.1)",
                border: `2px solid ${weeklyKeyDone ? "var(--green2)" : "rgba(100,140,200,0.4)"}`,
                fontSize: 18,
          }}>
          {weeklyKeyDone ? "✓" : "🗝"}
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 4, background: "rgba(100,140,200,0.15)", border: "1px solid rgba(100,140,200,0.3)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
          🗝
          </div>
          <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: weeklyKeyDone ? "var(--text3)" : "var(--text1)", marginBottom: 4 }}>
          Weekly Level 10 Key
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)" }}>
          Level any character to 10 · Resets Monday 07:30 UTC · Next reset in {weeklyCountdown}
          </div>
          </div>
          <button
          onClick={() => {
            const newDone = !weeklyKeyDone;
            setWeeklyKeyDone(newDone);
            invoke("cache_set", { key: "weekly_key_done", value: JSON.stringify({ done: newDone, weeklyResetTs: getWeeklyResetTs() }) }).catch(() => {});
          }}
          style={{
            fontSize: 12, fontFamily: "Cinzel,serif", letterSpacing: 1,
            padding: "5px 14px", borderRadius: 4, cursor: "pointer",
            background: weeklyKeyDone ? "rgba(60,160,60,0.15)" : "rgba(100,140,200,0.15)",
                border: `1px solid ${weeklyKeyDone ? "rgba(60,160,60,0.4)" : "rgba(100,140,200,0.4)"}`,
                color: weeklyKeyDone ? "var(--green2)" : "var(--text2)",
          }}>
          {weeklyKeyDone ? "✓ Done" : "Mark Done"}
          </button>
          </div>

          {/* One card per eligible recipe */}
          {eligible.map(r => {
            const done = isDone(r);
            const item = data.itemMap[r.itemId] || extraDailyItems[r.itemId];
            const price = data.priceMap[r.itemId];
            const sellNet = price?.sells?.unit_price ? Math.floor(price.sells.unit_price * 0.85) : null;
            return (
              <div key={r.itemId} style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "14px 20px", marginBottom: 8, borderRadius: 6,
                background: done ? "rgba(30,50,30,0.5)" : "var(--bg3)",
                    border: `1px solid ${done ? "rgba(60,140,60,0.4)" : "var(--border)"}`,
                    opacity: done ? 0.75 : 1,
                    transition: "all .2s",
              }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? "rgba(60,160,60,0.2)" : "rgba(200,150,42,0.1)",
                    border: `2px solid ${done ? "var(--green2)" : "rgba(200,150,42,0.4)"}`,
                    fontSize: 18,
              }}>
              {done ? "✓" : "·"}
              </div>

              {item?.icon
                ? <img src={item.icon} style={{ width: 40, height: 40, borderRadius: 4, border: "1px solid var(--border2)", flexShrink: 0 }} alt="" />
                : <div style={{ width: 40, height: 40, borderRadius: 4, background: "var(--bg4)", flexShrink: 0 }} />
              }

              <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: done ? "var(--text3)" : "var(--text1)", marginBottom: 4 }}>
              {r.name}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {(r.allDiscs || r.qualDiscs.map(d => ({name:d,level:0,qualifies:true}))).map(d => (
                <span key={d.name} style={{
                  fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1,
                  padding: "2px 8px", borderRadius: 3,
                  background: d.qualifies ? "rgba(200,150,42,0.12)" : "rgba(80,80,80,0.15)",
                                                                                                 border: `1px solid ${d.qualifies ? "rgba(200,150,42,0.4)" : "rgba(100,100,100,0.3)"}`,
                                                                                                 color: d.qualifies ? "var(--gold2)" : "var(--text3)",
                }}>{d.name} {d.level > 0 ? d.level : ""}</span>
              ))}
              {r.trackByCount && (
                <span style={{ fontSize: 10, fontFamily: "Cinzel,serif", color: "var(--text3)", letterSpacing: 1, padding: "2px 7px", border: "1px solid var(--border)", borderRadius: 3 }}>
                📦 count-tracked
                </span>
              )}
              </div>
              </div>

              {sellNet != null && (
                <div style={{ textAlign: "right", minWidth: 120 }}>
                <div style={{ fontSize: 10, fontFamily: "Cinzel,serif", letterSpacing: 1, color: "var(--text3)", marginBottom: 3 }}>TP VALUE (NET)</div>
                <Gold v={sellNet} size={15} />
                </div>
              )}

              <div style={{ minWidth: 110, textAlign: "right" }}>
              {done
                ? <span style={{ fontSize: 11, fontFamily: "Cinzel,serif", letterSpacing: 1, color: "var(--green2)", background: "rgba(60,160,60,0.12)", border: "1px solid rgba(60,160,60,0.3)", padding: "4px 10px", borderRadius: 3 }}>✓ CRAFTED</span>
                : <span style={{ fontSize: 11, fontFamily: "Cinzel,serif", letterSpacing: 1, color: "var(--gold2)", background: "rgba(200,150,42,0.1)", border: "1px solid rgba(200,150,42,0.3)", padding: "4px 10px", borderRadius: 3 }}>⚡ AVAILABLE</span>
              }
              </div>
              </div>
            );
          })}

          {eligible.length > 0 && (
            <div style={{ marginTop: 16, padding: "10px 16px", borderRadius: 4, background: "var(--bg2)", border: "1px solid var(--border)", fontSize: 12, color: "var(--text3)" }}>
            Only recipes you can craft at your current discipline levels are shown. Time-gated items reset daily at 4:00 PM Pacific (00:00 UTC).
            </div>
          )}
          </div>
        );
}
