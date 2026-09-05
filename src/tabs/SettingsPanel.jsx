/**
 * Settings panel — API key, NAS address, alert thresholds, recipe rescan,
 * Friend Crafters management + diagnostic recipe lookup, update checking,
 * and changelog viewer. Saves several fields directly via Tauri invoke().
 * Caller is responsible for the `showSettings &&` gate (see App.jsx).
 * (Split out of App.jsx.)
 */
import React from "react";
import { invoke } from "@tauri-apps/api/core";
import { renderMarkdown } from "../lib/markdown.jsx";

export function SettingsPanel({
  settingsApiKey, setSettingsApiKey, settingsNasSsh, setSettingsNasSsh,
  settingsAlertThreshold, setSettingsAlertThreshold, settingsGemAlertThresholdGold,
  setSettingsGemAlertThresholdGold, rescanningRecipes, rescanAutoUnlockedRecipes,
  friends, friendNameInput, setFriendNameInput, friendKeyInput, setFriendKeyInput,
  friendBusy, handleAddFriend, friendActionMsg, handleRefreshFriend,
  setShowDeleteFriendConfirm, recipeLookupId, setRecipeLookupId, friendRecipeMap,
  friendDisciplineEligibleMap, combinedFriendRecipeMap, lockedCraftItems, data,
  friendOnlyCraftItems, appVersion, updateInfo, updateChecking, updateInstalling,
  updateError, handleCheckForUpdates, handleInstallUpdate, showChangelog,
  handleOpenChangelog, changelog, changelogLoading, settingsMsg, setSettingsMsg,
  setAlertThreshold, setGemAlertThresholdGold, setApiKey,
}) {
  return (
      <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 6, padding: 20, marginBottom: 16 }}>
      <div style={{ fontFamily: "Cinzel,serif", fontSize: 13, color: "var(--gold2)", letterSpacing: 2, marginBottom: 16 }}>⚙ SETTINGS</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 12, color: "var(--text2)" }}>
      <strong style={{ color: "var(--gold1)" }}>GW2 API Key</strong>
      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6 }}>
      Your personal GW2 API key. Generate one at account.arena.net - Applications.
      </div>
      <input value={settingsApiKey} onChange={e => setSettingsApiKey(e.target.value)}
      placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXXXXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
      style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 10px", color: "var(--text1)", fontSize: 12, fontFamily: "monospace" }} />
      </div>

      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8 }}>
      <strong style={{ color: "var(--gold1)" }}>NAS Address</strong>
      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6 }}>Your NAS IP or SSH address (e.g. 192.168.1.212 or derrick@192.168.1.212). Used to fetch market data from the API on your NAS, and for restarting the collector when resetting the market database. Port is automatic.</div>
      <input value={settingsNasSsh} onChange={e => setSettingsNasSsh(e.target.value)}
      style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 10px", color: "var(--text1)", fontSize: 12, fontFamily: "monospace" }} />
      </div>
      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8 }}>
      <strong style={{ color: "var(--gold1)" }}>Price Alert Threshold</strong>
      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6 }}>
      Alert when current price is at or above this % of the 7-day high. Default: 85%.
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <input type="range" min={50} max={100} step={1} value={settingsAlertThreshold}
      onChange={e => setSettingsAlertThreshold(Number(e.target.value))}
      style={{ flex: 1 }} />
      <span style={{ width: 40, color: "var(--gold2)", fontFamily: "monospace", fontSize: 13 }}>{settingsAlertThreshold}%</span>
      </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8 }}>
      <strong style={{ color: "var(--gold1)" }}>Gem Price Alert</strong>
      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6 }}>
      Alert when the gold cost for 400 gems (cheapest exchange rate) drops to or below this. Set to 0 to disable.
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <input type="number" min={0} step={1} value={settingsGemAlertThresholdGold}
      onChange={e => setSettingsGemAlertThresholdGold(Math.max(0, Number(e.target.value) || 0))}
      style={{ width: 100, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 10px", color: "var(--text1)", fontSize: 13 }} />
      <span style={{ color: "var(--text3)", fontSize: 12 }}>gold</span>
      </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
      <strong style={{ color: "var(--gold1)" }}>Rescan Auto-Unlocked Recipes</strong>
      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8, lineHeight: 1.6 }}>
      A small number of recipes (e.g. Piece of Dragon Jade) never need to be "learned" — they become usable the moment a discipline hits the required rating. These never show up in the normal recipe refresh, so if you've leveled a discipline since your very first launch, run this to catch anything newly available. Can take a minute or two — it scans every recipe in the game.
      </div>
      <button onClick={rescanAutoUnlockedRecipes} disabled={rescanningRecipes}
      style={{ fontSize: 11, color: "var(--gold2)", background: "transparent", border: "1px solid var(--border)", borderRadius: 3, padding: "5px 14px", cursor: rescanningRecipes ? "not-allowed" : "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1, opacity: rescanningRecipes ? 0.5 : 1 }}>
      {rescanningRecipes ? "⏳ Scanning all recipes..." : "🔍 Rescan Auto-Unlocked Recipes"}
      </button>
      </div>

      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
      <strong style={{ color: "var(--gold1)" }}>👥 Friend Crafters</strong>
      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10, lineHeight: 1.6 }}>
      Add a friend's GW2 API key to see recipes <em>they</em> know — or could make right now via their own crafting
      discipline levels, even without having formally discovered it — that you don't. Crafting Profits and Recommended
      will tag those cards with their name. Only their known-recipe list and crafting discipline levels are ever read;
      your materials, prices, and market data are always what's used to score and craft the item — nothing about your
      friend's account beyond "does this recipe show up in their unlocks, or does their discipline rating qualify them"
      is fetched or stored.
      Ask them to generate a key with the <strong style={{ color: "var(--text2)" }}>Unlocks</strong> and{" "}
      <strong style={{ color: "var(--text2)" }}>Characters</strong> permissions checked.
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
      <input value={friendNameInput} onChange={e => setFriendNameInput(e.target.value)} placeholder="Friend's name"
      style={{ width: 140, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 10px", color: "var(--text1)", fontSize: 12 }} />
      <input value={friendKeyInput} onChange={e => setFriendKeyInput(e.target.value)} placeholder="Friend's API key"
      style={{ flex: 1, minWidth: 220, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 10px", color: "var(--text1)", fontSize: 12, fontFamily: "monospace" }} />
      <button onClick={handleAddFriend} disabled={friendBusy}
      style={{ fontSize: 11, color: "#fff", background: "#7a4fb8", border: "none", borderRadius: 3, padding: "5px 14px", cursor: friendBusy ? "not-allowed" : "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1, opacity: friendBusy ? 0.6 : 1 }}>
      {friendBusy ? "⏳ Working..." : "+ Add Friend"}
      </button>
      </div>
      {friendActionMsg && (
        <div style={{ fontSize: 12, color: friendActionMsg.ok ? "#4caf50" : "var(--red2,#e05555)", marginBottom: 8 }}>{friendActionMsg.text}</div>
      )}
      {friends.length === 0 && <div style={{ fontSize: 12, color: "var(--text3)", fontStyle: "italic" }}>No friends added yet.</div>}
      {friends.map(f => (
        <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--text1)", flex: 1, minWidth: 100 }}>{f.name}</span>
        <span style={{ fontSize: 11, color: "var(--text3)" }}>{f.recipe_count.toLocaleString()} recipes known</span>
        {!f.last_refresh_ok && (
          <span title="Last refresh failed — the key may be invalid or revoked. Still showing their last-known recipes." style={{ fontSize: 10, color: "var(--red2,#e05555)", border: "1px solid rgba(200,60,60,.4)", borderRadius: 3, padding: "1px 6px", cursor: "help" }}>⚠ refresh failed</span>
        )}
        <span style={{ fontSize: 10, color: "var(--text3)" }}>{f.last_refresh_ts ? `updated ${new Date(f.last_refresh_ts).toLocaleDateString()}` : "never refreshed"}</span>
        <button onClick={() => handleRefreshFriend(f.id)} disabled={friendBusy} title="Refresh this friend's known recipes and crafting discipline levels now"
        style={{ fontSize: 11, color: "var(--gold2)", background: "transparent", border: "1px solid var(--border)", borderRadius: 3, padding: "3px 9px", cursor: friendBusy ? "not-allowed" : "pointer" }}>
        🔄
        </button>
        <button onClick={() => setShowDeleteFriendConfirm(f.id)} disabled={friendBusy} title="Remove this friend"
        style={{ fontSize: 11, color: "var(--red2,#e05555)", background: "transparent", border: "1px solid rgba(200,60,60,.4)", borderRadius: 3, padding: "3px 9px", cursor: friendBusy ? "not-allowed" : "pointer" }}>
        🗑
        </button>
        </div>
      ))}
      {friends.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6, lineHeight: 1.6 }}>
            <strong style={{ color: "var(--gold1)" }}>🔍 Diagnostic: check a specific recipe ID</strong> — for a "friend
            knows this but it's not showing" case, this checks each stage of the pipeline directly instead of guessing.
            Find the recipe's numeric ID on the wiki page (in the "API" row of the Recipes table).
          </div>
          <input type="number" value={recipeLookupId} onChange={e => setRecipeLookupId(e.target.value)}
            placeholder="Recipe ID, e.g. 2555"
            style={{ width: 180, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "5px 10px", color: "var(--text1)", fontSize: 12, fontFamily: "monospace" }} />
          {recipeLookupId && (() => {
            const rid = Number(recipeLookupId);
            const inFriendMap = friendRecipeMap[rid];
            const inDisciplineMap = friendDisciplineEligibleMap[rid];
            const inCombinedMap = combinedFriendRecipeMap[rid];
            const lockedEntry = lockedCraftItems.find(ci => ci.recipeId === rid);
            let knownEntry = null, knownDisc = null;
            for (const d of Object.keys(data?.byDisc || {})) {
              const hit = (data.byDisc[d] || []).find(ci => ci.recipeId === rid);
              if (hit) { knownEntry = hit; knownDisc = d; break; }
            }
            const inFriendOnlyItems = friendOnlyCraftItems.find(ci => ci.recipeId === rid);
            return (
              <div style={{ marginTop: 10, fontSize: 12, lineHeight: 2, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "10px 14px" }}>
                <div>
                  <strong style={{ color: "var(--text2)" }}>1a. friendRecipeMap</strong> (does a friend genuinely have this recipe id in their /account/recipes, per last refresh): {" "}
                  {inFriendMap
                    ? <span style={{ color: "var(--green2)" }}>✓ yes — {inFriendMap.map(b => b.friendName).join(", ")}</span>
                    : <span style={{ color: "var(--red2,#e05555)" }}>✗ not found for any friend</span>}
                </div>
                <div>
                  <strong style={{ color: "var(--text2)" }}>1b. friendDisciplineEligibleMap</strong> (does a friend's own crafting discipline rating meet this recipe's requirement, regardless of formal discovery): {" "}
                  {inDisciplineMap
                    ? <span style={{ color: "var(--green2)" }}>✓ yes — {inDisciplineMap.map(b => b.friendName).join(", ")}</span>
                    : <span style={{ color: "var(--red2,#e05555)" }}>✗ no friend's discipline rating qualifies (or no friend has discipline data — needs the "Characters" permission)</span>}
                </div>
                <div>
                  <strong style={{ color: "var(--text2)" }}>1c. combinedFriendRecipeMap</strong> (union of 1a + 1b — what everything downstream actually reads): {" "}
                  {inCombinedMap?.length
                    ? <span style={{ color: "var(--green2)" }}>✓ yes — {inCombinedMap.map(b => `${b.friendName}${b.viaDiscipline ? " (via rating)" : ""}`).join(", ")}</span>
                    : <span style={{ color: "var(--red2,#e05555)" }}>✗ not present</span>}
                </div>
                <div>
                  <strong style={{ color: "var(--text2)" }}>2. lockedCraftItems</strong> (your own unlearned-recipe catalog): {" "}
                  {lockedEntry
                    ? <span style={{ color: "var(--green2)" }}>✓ present — disciplines: [{(lockedEntry.disciplines || []).join(", ") || "none, falls back to Uncategorized"}], canCraft: {String(lockedEntry.canCraft)}, rarity: {lockedEntry.rarity || "—"}</span>
                    : <span style={{ color: "var(--red2,#e05555)" }}>✗ not in your locked catalog at all — not yet scanned, or you already know it</span>}
                </div>
                <div>
                  <strong style={{ color: "var(--text2)" }}>3. Your own known recipes</strong> (data.byDisc, any discipline): {" "}
                  {knownEntry
                    ? <span style={{ color: "var(--gold2)" }}>⚠ already known under {knownDisc} — this is why no friend badge shows: you know it yourself</span>
                    : <span style={{ color: "var(--text3)" }}>not found — you don't know it yourself</span>}
                </div>
                <div>
                  <strong style={{ color: "var(--text2)" }}>4. friendOnlyCraftItems</strong> (the actual merged list Crafting Profits/Recommended read from): {" "}
                  {inFriendOnlyItems
                    ? <span style={{ color: "var(--green2)" }}>✓ present — disciplines: [{(inFriendOnlyItems.disciplines || []).join(", ") || "none"}]</span>
                    : <span style={{ color: "var(--red2,#e05555)" }}>✗ not present</span>}
                </div>
              </div>
            );
          })()}
        </div>
      )}
      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 8, fontStyle: "italic" }}>
      Refreshes automatically once a day, or use 🔄 above anytime. A friend's known-recipe list doesn't reflect whether
      they've already used today's daily-crafting cooldown — just whether they know how to make it.
      Friend API keys are intentionally excluded from Import/Export backups below, so a shared backup file never contains a friend's credentials.
      </div>
      </div>

      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
        <strong style={{ color: "var(--gold1)" }}>Updates & Changelog</strong>
        <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8, lineHeight: 1.6 }}>
          Current version: <span style={{ color: "var(--gold2)", fontFamily: "monospace" }}>{appVersion || "…"}</span>
        </div>

        {updateError && <div style={{ fontSize: 11, color: "var(--red2,#e05555)", marginBottom: 8 }}>{updateError}</div>}

        {updateInfo ? (
          <div style={{ background: "rgba(200,150,42,0.08)", border: "1px solid rgba(200,150,42,0.3)", borderRadius: 4, padding: "10px 14px", marginBottom: 10 }}>
            <div style={{ fontSize: 13, color: "var(--gold2)", fontWeight: 600, marginBottom: 4 }}>Update available: v{updateInfo.version}</div>
            {updateInfo.body && <div style={{ fontSize: 12, color: "var(--text2)", whiteSpace: "pre-wrap", marginBottom: 8, maxHeight: 140, overflowY: "auto" }}>{updateInfo.body}</div>}
            <button onClick={handleInstallUpdate} disabled={updateInstalling}
              style={{ fontSize: 11, color: "#fff", background: "var(--gold3,#7a5c1e)", border: "none", borderRadius: 3, padding: "5px 14px", cursor: updateInstalling ? "not-allowed" : "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1, opacity: updateInstalling ? 0.6 : 1 }}>
              {updateInstalling ? "⏳ Downloading & installing..." : "⬇ Download & Restart to Update"}
            </button>
          </div>
        ) : (
          <button onClick={handleCheckForUpdates} disabled={updateChecking}
            style={{ fontSize: 11, color: "var(--gold2)", background: "transparent", border: "1px solid var(--border)", borderRadius: 3, padding: "5px 14px", cursor: updateChecking ? "not-allowed" : "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1, opacity: updateChecking ? 0.6 : 1, marginBottom: 10 }}>
            {updateChecking ? "⏳ Checking..." : "🔍 Check for Updates"}
          </button>
        )}

        <div>
          <button onClick={handleOpenChangelog}
            style={{ fontSize: 11, color: "var(--text2)", background: "transparent", border: "1px solid var(--border)", borderRadius: 3, padding: "5px 14px", cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
            {showChangelog ? "▲ Hide Changelog" : "📜 View Changelog"}
          </button>
          {showChangelog && (
            <div style={{ marginTop: 10, maxHeight: 260, overflowY: "auto", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4, padding: "10px 14px" }}>
              {changelogLoading && <div style={{ fontSize: 12, color: "var(--text3)" }}>Loading...</div>}
              {!changelogLoading && changelog.length === 0 && <div style={{ fontSize: 12, color: "var(--text3)" }}>No releases found.</div>}
              {changelog.map(r => (
                <div key={r.tag} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 13, color: "var(--gold2)", fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4 }}>{new Date(r.date).toLocaleDateString()}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>{r.body ? renderMarkdown(r.body) : "—"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
      <button onClick={async () => {
        setSettingsMsg(null);
        try {
          const nasHost = settingsNasSsh.includes("@") ? settingsNasSsh.split("@")[1] : settingsNasSsh;
          const nasApiUrl = `http://${nasHost}:8745`;
          const msg = await invoke("set_market_db_path", { path: settingsNasSsh });
          await invoke("cache_set", { key: "nas_ssh", value: settingsNasSsh });
          await invoke("cache_set", { key: "alert_threshold", value: String(settingsAlertThreshold) });
          await invoke("cache_set", { key: "gem_alert_threshold_gold", value: String(settingsGemAlertThresholdGold) });
          await invoke("cache_set", { key: "api_key", value: settingsApiKey.trim() });
          setAlertThreshold(settingsAlertThreshold);
          setGemAlertThresholdGold(settingsGemAlertThresholdGold);
          if (settingsApiKey.trim()) { setApiKey(settingsApiKey.trim()); window.__gw2ApiKey = settingsApiKey.trim(); }
          setSettingsMsg({ ok: true, text: msg });
        } catch(e) { setSettingsMsg({ ok: false, text: String(e) }); }
      }} style={{ fontSize: 12, color: "#fff", background: "var(--gold3,#7a5c1e)", border: "none", borderRadius: 4, padding: "6px 16px", cursor: "pointer", fontFamily: "Cinzel,serif", letterSpacing: 1 }}>
      Save
      </button>
      </div>
      {settingsMsg && <div style={{ fontSize: 12, color: settingsMsg.ok ? "#4caf50" : "var(--red2,#e05555)" }}>{settingsMsg.text}</div>}
      </div>
      </div>
  );
}
