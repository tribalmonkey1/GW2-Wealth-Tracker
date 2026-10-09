/**
 * Settings window — sidebar-sections layout.
 *
 * Opens as a modal over the tracker with a left-hand section list (Account &
 * Data, Alerts, Sound & Voice, Friends, Maintenance, About & Updates) and a
 * sticky footer that tracks unsaved edits (Discard / Save Changes). Import /
 * Export and the two database resets live under Maintenance now instead of
 * in the app header.
 *
 * What still saves through the footer (unchanged keys/behaviour): api_key,
 * drfToken, nas_ssh (+ set_market_db_path), alert_threshold,
 * gem_alert_threshold_gold, customSoundPath, piperVoiceFile, piperSpeakerId.
 * Friends, recipe rescans, import/export, resets and updates act immediately,
 * exactly as before.
 *
 * Caller is responsible for the `showSettings &&` gate (see App.jsx) and
 * passes onClose. (Split out of App.jsx.)
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { renderMarkdown } from "../lib/markdown.jsx";
import { importFromBrowser, exportAllData, getDbStats } from "../lib/storage.js";
import { playAlert } from "../lib/alertSound.js";
import "../styles/settings.css";

// Permissions the tracker reads (same list as the first-run screen in App.jsx).
const REQUIRED_PERMS = ["account", "builds", "characters", "inventories", "progression", "tradingpost", "unlocks", "wallet"];

const IS_LINUX = typeof navigator !== "undefined"
  && /Linux/i.test(navigator.userAgent || "") && !/Android/i.test(navigator.userAgent || "");

async function openExternal(url) {
  try {
    const { open } = await import("@tauri-apps/plugin-shell");
    await open(url);
  } catch {
    try { window.open(url, "_blank", "noopener"); } catch { /* nothing else to try */ }
  }
}

// ── Small inline icons (stroke = currentColor) ──────────────────────────────
const Icon = ({ d, size = 16, fill = "none", sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={fill === "none" ? "currentColor" : "none"}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {[].concat(d).map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const ICONS = {
  account: ["M12 15a4 4 0 1 0-8 0 4 4 0 0 0 8 0", "M10.8 12.2L20 3", "M16 7l3 3"],
  alerts: ["M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9", "M10.3 21a1.9 1.9 0 0 0 3.4 0"],
  sound: ["M11 5L6 9H2v6h4l5 4V5z", "M15.5 8.5a5 5 0 0 1 0 7", "M19 5a10 10 0 0 1 0 14"],
  friends: ["M13 8a4 4 0 1 0-8 0 4 4 0 0 0 8 0", "M2 21a7 7 0 0 1 14 0", "M17 11a3 3 0 1 0 0-6", "M22 21a5 5 0 0 0-4-5"],
  maintenance: ["M21 12a9 9 0 1 1-3-6.7L21 8", "M21 3v5h-5"],
  about: ["M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0", "M12 8v4", "M12 16h.01"],
  close: ["M6 6l12 12", "M18 6L6 18"],
  refresh: ["M21 12a9 9 0 1 1-3-6.7L21 8", "M21 3v5h-5"],
  trash: ["M4 7h16", "M9 7V4h6v3", "M6 7l1 13h10l1-13"],
  check: ["M5 12l5 5L20 7"],
  cross: ["M6 6l12 12", "M18 6L6 18"],
  info: ["M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0", "M12 8v4", "M12 16h.01"],
  dash: ["M5 12h14"],
  up: ["M6 15l6-6 6 6"],
  down: ["M6 9l6 6 6-6"],
};
const PlayIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>;

const SECTIONS = [
  { id: "account", label: "Account & Data" },
  { id: "alerts", label: "Alerts" },
  { id: "sound", label: "Sound & Voice" },
  { id: "friends", label: "Friends" },
  { id: "maintenance", label: "Maintenance" },
  { id: "about", label: "About & Updates" },
];

// ── API key live check (tokeninfo + account name) ───────────────────────────
function useApiKeyCheck(key) {
  const [state, setState] = useState({ status: "idle" });
  useEffect(() => {
    const k = (key || "").trim();
    if (!k) { setState({ status: "empty" }); return; }
    let cancelled = false;
    setState({ status: "checking" });
    const t = setTimeout(async () => {
      try {
        const base = "https://api.guildwars2.com/v2";
        const ti = await fetch(`${base}/tokeninfo?access_token=${encodeURIComponent(k)}`);
        if (!ti.ok) throw new Error(ti.status === 401 || ti.status === 400 ? "Key rejected by the GW2 API" : `GW2 API error ${ti.status}`);
        const info = await ti.json();
        let accountName = null;
        try {
          const ar = await fetch(`${base}/account?access_token=${encodeURIComponent(k)}`);
          if (ar.ok) accountName = (await ar.json())?.name || null;
        } catch { /* name is a nice-to-have */ }
        if (!cancelled) setState({ status: "valid", accountName, keyName: info?.name, permissions: info?.permissions || [] });
      } catch (e) {
        if (!cancelled) setState({ status: "invalid", error: e?.message || String(e) });
      }
    }, 600);
    return () => { cancelled = true; clearTimeout(t); };
  }, [key]);
  return state;
}

function SecretInput({ id, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="st-row">
      <input id={id} className="st-input mono grow" type={show ? "text" : "password"} value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" spellCheck={false} />
      <button className="st-btn" onClick={() => setShow(s => !s)} aria-pressed={show}>{show ? "HIDE" : "SHOW"}</button>
    </div>
  );
}

function Status({ tone, children }) {
  return <span className={`st-status ${tone || ""}`}><span className="dot" />{children}</span>;
}

// ── Sections ────────────────────────────────────────────────────────────────

function AccountSection(p) {
  const keyCheck = useApiKeyCheck(p.settingsApiKey);
  const [nasChecking, setNasChecking] = useState(false);
  const [nasError, setNasError] = useState(null);

  const drf = {
    connected: ["ok", "Live"],
    connecting: ["warn", "Connecting…"],
    reconnecting: ["warn", "Reconnecting…"],
    error: ["bad", "Error"],
    disconnected: ["", "Not connected"],
  }[p.drfStatus] || (p.drfStatus ? ["", p.drfStatus] : null);

  const checkNas = async () => {
    setNasChecking(true); setNasError(null);
    try { p.setDbStats(await getDbStats()); }
    catch (e) { p.setDbStats(null); setNasError(String(e)); }
    finally { setNasChecking(false); }
  };

  const perms = new Set(keyCheck.permissions || []);
  return (
    <>
      <div>
        <h2>Account &amp; Data</h2>
        <p className="st-lede">Where the app gets your account, live drops and market history from.</p>
      </div>

      <div className="st-field">
        <div className="st-field-head">
          <label htmlFor="st-api" className="st-label">GW2 API KEY</label>
          <button className="st-link" onClick={() => openExternal("https://account.arena.net/applications")}>Create a key on account.arena.net</button>
        </div>
        <SecretInput id="st-api" value={p.settingsApiKey} onChange={p.setSettingsApiKey}
          placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXXXXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" />
        <div className="st-chips">
          {keyCheck.status === "checking" && <span className="st-pill wait">Checking key…</span>}
          {keyCheck.status === "empty" && <span className="st-pill wait">No key entered</span>}
          {keyCheck.status === "invalid" && <span className="st-pill bad"><Icon d={ICONS.cross} size={12} sw={3} />{keyCheck.error}</span>}
          {keyCheck.status === "valid" && (
            <>
              <span className="st-pill ok"><Icon d={ICONS.check} size={12} sw={3} />Valid{keyCheck.accountName ? ` · ${keyCheck.accountName}` : ""}</span>
              {REQUIRED_PERMS.map(perm => (
                <span key={perm} className={`st-chip ${perms.has(perm) ? "" : "missing"}`}
                  title={perms.has(perm) ? "Granted" : "Missing — some tabs won't fill in without it"}>{perm}</span>
              ))}
            </>
          )}
        </div>
        {keyCheck.status === "valid" && REQUIRED_PERMS.some(x => !perms.has(x)) && (
          <p className="st-help dim">Crossed-out permissions are missing from this key. Make a new key with them ticked.</p>
        )}
      </div>

      <div className="st-divider" />

      <div className="st-field">
        <div className="st-field-head">
          <label htmlFor="st-drf" className="st-label">DRF TOKEN <span className="st-opt">· optional</span></label>
          <span className="st-row" style={{ gap: 16 }}>
            {p.settingsDrfToken?.trim() && drf && <Status tone={drf[0]}>{drf[1]}{p.drfStatusDetail ? ` — ${p.drfStatusDetail}` : ""}</Status>}
            <button className="st-link" onClick={() => openExternal("https://drf.rs/")}>Get a token on drf.rs</button>
          </span>
        </div>
        <SecretInput id="st-drf" value={p.settingsDrfToken} onChange={p.setSettingsDrfToken} placeholder="Token from drf.rs (not your GW2 API key)" />
        <p className="st-help">
          Instant gold, material and currency updates while GW2 runs with Nexus + the DRF addon. Leave blank to use normal API refreshes.
        </p>
      </div>

      <div className="st-divider" />

      <div className="st-field">
        <div className="st-field-head">
          <label htmlFor="st-nas" className="st-label">MARKET SERVER (NAS)</label>
          {p.dbStats
            ? <Status tone="ok">Reachable · {(p.dbStats.price_history_count || 0).toLocaleString()} price snapshots</Status>
            : <Status tone={nasError ? "bad" : ""}>{nasError ? "Not reachable" : "Not checked"}</Status>}
        </div>
        <div className="st-row">
          <input id="st-nas" className="st-input mono grow" value={p.settingsNasSsh} onChange={e => p.setSettingsNasSsh(e.target.value)}
            placeholder="192.168.1.212 or user@192.168.1.212" spellCheck={false} />
          <button className="st-btn" onClick={checkNas} disabled={nasChecking} title="Checks the saved address — save first if you changed it">
            {nasChecking ? "CHECKING…" : "TEST"}
          </button>
        </div>
        <p className="st-help">IP or SSH address of the NAS running the collector. The port is added automatically.</p>
        {nasError && <div className="st-msg bad">{nasError}</div>}
      </div>
    </>
  );
}

function AlertsSection(p) {
  return (
    <>
      <div>
        <h2>Alerts</h2>
        <p className="st-lede">When the tracker should tell you a price is worth acting on.</p>
      </div>

      <div className="st-field">
        <div className="st-row-between">
          <div>
            <label htmlFor="st-pa" className="st-label">PRICE ALERT</label>
            <p className="st-help">When a price reaches this share of its 7-day high. Default 85%.</p>
          </div>
          <div className="st-row" style={{ width: 300 }}>
            <input id="st-pa" className="st-range" type="range" min={50} max={100} step={1} value={p.settingsAlertThreshold}
              onChange={e => p.setSettingsAlertThreshold(Number(e.target.value))} />
            <span className="st-value">{p.settingsAlertThreshold}%</span>
          </div>
        </div>
      </div>

      <div className="st-divider" />

      <div className="st-field">
        <div className="st-row-between">
          <div>
            <label htmlFor="st-gem" className="st-label">GEM PRICE ALERT</label>
            <p className="st-help">When 400 gems cost this much gold or less. 0 turns it off.</p>
          </div>
          <div className="st-row">
            <input id="st-gem" className="st-input" type="number" min={0} step={1} style={{ width: 110, textAlign: "right" }}
              value={p.settingsGemAlertThresholdGold}
              onChange={e => p.setSettingsGemAlertThresholdGold(Math.max(0, Number(e.target.value) || 0))} />
            <span className="st-help">gold</span>
          </div>
        </div>
      </div>
    </>
  );
}

function PiperVoiceSettings({
  piperVoices, refreshPiperVoices,
  settingsPiperVoiceFile, setSettingsPiperVoiceFile,
  settingsPiperSpeakerId, setSettingsPiperSpeakerId,
}) {
  const [rescanning, setRescanning] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  const selectedVoice = piperVoices.find(v => v.file === settingsPiperVoiceFile);
  const hasSpeakers = selectedVoice?.speakers?.length > 0;

  const handleRescan = async () => {
    setRescanning(true);
    try { await refreshPiperVoices(); } finally { setRescanning(false); }
  };

  const handleTest = async () => {
    setTesting(true); setTestMsg(null);
    try {
      await invoke("speak_text", {
        text: "This is a test of the selected voice.",
        voiceFile: settingsPiperVoiceFile || null,
        speakerId: settingsPiperSpeakerId ?? null,
      });
      setTestMsg({ ok: true, text: "Playing. If you hear a beep instead, check the voice file names in piper-voices/." });
    } catch (e) {
      setTestMsg({ ok: false, text: String(e) });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="st-field">
      <div className="st-field-head">
        <label htmlFor="st-piper" className="st-label">SPOKEN ALERTS VOICE <span className="st-opt">· Linux</span></label>
        <button className="st-link" onClick={() => setShowHelp(s => !s)}>{showHelp ? "Hide setup steps" : "How to add a voice"}</button>
      </div>
      <p className="st-help">Used by Boss Timers' Text-to-Speech mode. Without a Piper voice it falls back to espeak-ng.</p>
      {showHelp && (
        <p className="st-help dim">
          Download a voice's two files (<code>.onnx</code> and <code>.onnx.json</code>) from huggingface.co/rhasspy/piper-voices,
          put them in <code>~/.local/share/gw2-analyzer/piper-voices/</code> with their original names, then press Rescan.
        </p>
      )}
      <div className="st-row">
        <select id="st-piper" className="st-select" style={{ minWidth: 260 }} value={settingsPiperVoiceFile || ""}
          onChange={e => { setSettingsPiperVoiceFile(e.target.value); setSettingsPiperSpeakerId(null); }}>
          <option value="">espeak-ng (no Piper voice)</option>
          {piperVoices.map(v => (
            <option key={v.file} value={v.file}>{v.file}{v.speakers?.length > 0 ? ` (${v.speakers.length} speakers)` : ""}</option>
          ))}
        </select>
        {hasSpeakers && (
          <select className="st-select" aria-label="Speaker" value={settingsPiperSpeakerId ?? ""}
            onChange={e => setSettingsPiperSpeakerId(e.target.value === "" ? null : Number(e.target.value))}>
            <option value="">Default speaker</option>
            {selectedVoice.speakers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
          </select>
        )}
        <button className="st-btn" onClick={handleRescan} disabled={rescanning}>{rescanning ? "SCANNING…" : "RESCAN"}</button>
        <button className="st-btn" onClick={handleTest} disabled={testing}><PlayIcon />{testing ? "PLAYING…" : "TEST"}</button>
      </div>
      {piperVoices.length === 0 && <p className="st-help dim">No voices found yet.</p>}
      {testMsg && <div className={`st-msg ${testMsg.ok ? "" : "bad"}`}>{testMsg.text}</div>}
    </div>
  );
}

function SoundSection(p) {
  const [playing, setPlaying] = useState(false);
  const testSound = async () => {
    setPlaying(true);
    try { await playAlert("Test", { mode: "custom", customPath: p.settingsCustomSoundPath, volume: 100 }); }
    finally { setPlaying(false); }
  };
  const showPiper = IS_LINUX || p.piperVoices.length > 0;
  return (
    <>
      <div>
        <h2>Sound &amp; Voice</h2>
        <p className="st-lede">What Boss Timers plays when an event is about to start.</p>
      </div>

      <div className="st-field">
        <label htmlFor="st-snd" className="st-label">CUSTOM ALERT SOUND</label>
        <div className="st-row">
          <input id="st-snd" className="st-input mono grow" value={p.settingsCustomSoundPath}
            onChange={e => p.setSettingsCustomSoundPath(e.target.value)}
            placeholder="C:\Sounds\alert.mp3, /home/you/alert.mp3 or https://…/alert.mp3" spellCheck={false} />
          <button className="st-btn" onClick={testSound} disabled={playing} aria-label="Play test sound"><PlayIcon />{playing ? "PLAYING…" : "PLAY"}</button>
        </div>
        <p className="st-help">Used when Boss Timers → Sound is set to Custom Sound. Leave blank to use the beep.</p>
      </div>

      {showPiper && (
        <>
          <div className="st-divider" />
          <PiperVoiceSettings
            piperVoices={p.piperVoices} refreshPiperVoices={p.refreshPiperVoices}
            settingsPiperVoiceFile={p.settingsPiperVoiceFile} setSettingsPiperVoiceFile={p.setSettingsPiperVoiceFile}
            settingsPiperSpeakerId={p.settingsPiperSpeakerId} setSettingsPiperSpeakerId={p.setSettingsPiperSpeakerId}
          />
        </>
      )}
    </>
  );
}

function friendRefreshLabel(f) {
  if (!f.last_refresh_ok) return ["bad", "Refresh failed"];
  if (!f.last_refresh_ts) return ["", "Never"];
  const d = new Date(f.last_refresh_ts);
  const today = new Date();
  return ["ok", d.toDateString() === today.toDateString() ? "Today" : d.toLocaleDateString()];
}

function Check({ tone, title, children }) {
  const icon = { ok: ICONS.check, bad: ICONS.cross, warn: ICONS.info, dim: ICONS.dash }[tone];
  return <span className={`st-check ${tone}`} title={title}><Icon d={icon} size={14} sw={tone === "ok" || tone === "bad" ? 3 : 2} />{children}</span>;
}

function RecipeTroubleshooter(p) {
  const [open, setOpen] = useState(false);
  const rid = Number(p.recipeLookupId);
  let rows = null;
  if (p.recipeLookupId && Number.isFinite(rid)) {
    const inFriendMap = p.friendRecipeMap[rid];
    const inDisciplineMap = p.friendDisciplineEligibleMap[rid];
    const inCombinedMap = p.combinedFriendRecipeMap[rid];
    const lockedEntry = p.lockedCraftItems.find(ci => ci.recipeId === rid);
    let knownDisc = null;
    for (const d of Object.keys(p.data?.byDisc || {})) {
      if ((p.data.byDisc[d] || []).some(ci => ci.recipeId === rid)) { knownDisc = d; break; }
    }
    const inFriendOnly = p.friendOnlyCraftItems.find(ci => ci.recipeId === rid);
    rows = [
      inFriendMap
        ? <Check key="1a" tone="ok" title="friendRecipeMap">{inFriendMap.map(b => b.friendName).join(", ")} learned it</Check>
        : <Check key="1a" tone="bad" title="friendRecipeMap">No friend has learned it</Check>,
      inDisciplineMap
        ? <Check key="1b" tone="ok" title="friendDisciplineEligibleMap">{inDisciplineMap.map(b => b.friendName).join(", ")}'s crafting level qualifies</Check>
        : <Check key="1b" tone="bad" title="friendDisciplineEligibleMap">No friend's crafting level qualifies (needs the Characters permission)</Check>,
      inCombinedMap?.length
        ? <Check key="1c" tone="ok" title="combinedFriendRecipeMap">Counted as a friend recipe</Check>
        : <Check key="1c" tone="bad" title="combinedFriendRecipeMap">Not counted as a friend recipe</Check>,
      lockedEntry
        ? <Check key="2" tone="ok" title={`lockedCraftItems · disciplines: ${(lockedEntry.disciplines || []).join(", ") || "none"} · canCraft: ${lockedEntry.canCraft}`}>In your unlearned-recipe list</Check>
        : <Check key="2" tone="bad" title="lockedCraftItems">Not in your unlearned list (not scanned yet, or you know it)</Check>,
      knownDisc
        ? <Check key="3" tone="warn" title="data.byDisc">You already know it ({knownDisc}), so there's no friend badge</Check>
        : <Check key="3" tone="dim" title="data.byDisc">You don't know it yourself</Check>,
      inFriendOnly
        ? <Check key="4" tone="ok" title="friendOnlyCraftItems">Shows in Crafting Profits with a friend badge</Check>
        : <Check key="4" tone="bad" title="friendOnlyCraftItems">Not showing in Crafting Profits</Check>,
    ];
  }
  return (
    <div className="st-drawer">
      <button className="st-drawer-toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        TROUBLESHOOTING · ADVANCED <Icon d={open ? ICONS.up : ICONS.down} />
      </button>
      {open && (
        <div className="st-drawer-body">
          <div className="st-row">
            <label htmlFor="st-rid" style={{ fontSize: 16 }}>Why isn't a friend's recipe showing?</label>
            <input id="st-rid" className="st-input mono" type="number" style={{ width: 140, height: 40 }} value={p.recipeLookupId}
              onChange={e => p.setRecipeLookupId(e.target.value)} placeholder="e.g. 2555" />
            <span className="st-help dim">Recipe ID from the wiki's API row</span>
          </div>
          {rows && <div className="st-checks">{rows}</div>}
        </div>
      )}
    </div>
  );
}

function FriendsSection(p) {
  return (
    <>
      <div>
        <h2>Friend Crafters</h2>
        <p className="st-lede">
          See recipes your friends can craft that you can't. Only their recipe unlocks and crafting levels are read, and their keys are never included in backups.
        </p>
      </div>

      <div className="st-row" style={{ alignItems: "flex-end" }}>
        <div className="st-field" style={{ width: 180 }}>
          <label htmlFor="st-fn" className="st-label">NAME</label>
          <input id="st-fn" className="st-input" value={p.friendNameInput} onChange={e => p.setFriendNameInput(e.target.value)} placeholder="Friend's name" />
        </div>
        <div className="st-field" style={{ flex: 1, minWidth: 240 }}>
          <label htmlFor="st-fk" className="st-label">API KEY</label>
          <input id="st-fk" className="st-input mono" value={p.friendKeyInput} onChange={e => p.setFriendKeyInput(e.target.value)}
            placeholder="Needs Unlocks + Characters permissions" spellCheck={false} />
        </div>
        <button className="st-btn primary" onClick={p.handleAddFriend} disabled={p.friendBusy}>{p.friendBusy ? "WORKING…" : "ADD FRIEND"}</button>
      </div>
      {p.friendActionMsg && <div className={`st-msg ${p.friendActionMsg.ok ? "ok" : "bad"}`}>{p.friendActionMsg.text}</div>}

      <div className="st-table">
        <div className="st-tr head"><span>FRIEND</span><span>RECIPES KNOWN</span><span>LAST REFRESH</span><span style={{ textAlign: "right" }}>ACTIONS</span></div>
        {p.friends.length === 0 && <div className="st-empty">No friends added yet.</div>}
        {p.friends.map(f => {
          const [tone, label] = friendRefreshLabel(f);
          return (
            <div key={f.id} className="st-tr">
              <span>{f.name}</span>
              <span className="muted">{(f.recipe_count || 0).toLocaleString()}</span>
              <span title={f.last_refresh_ok ? undefined : "The key may be invalid or revoked. Their last-known recipes are still used."}><Status tone={tone}>{label}</Status></span>
              <span className="actions">
                <button className="st-btn icon" onClick={() => p.handleRefreshFriend(f.id)} disabled={p.friendBusy}
                  aria-label={`Refresh ${f.name}`} title="Refresh recipes and crafting levels now"><Icon d={ICONS.refresh} size={15} /></button>
                <button className="st-btn icon danger" onClick={() => p.setShowDeleteFriendConfirm(f.id)} disabled={p.friendBusy}
                  aria-label={`Remove ${f.name}`} title="Remove this friend"><Icon d={ICONS.trash} size={15} /></button>
              </span>
            </div>
          );
        })}
      </div>
      <p className="st-help dim">Refreshes automatically once a day. It shows whether a friend knows a recipe, not whether they've used today's daily craft.</p>

      {p.friends.length > 0 && <RecipeTroubleshooter {...p} />}
    </>
  );
}

function MaintenanceSection(p) {
  const fileRef = useRef(null);
  const busy = p.migrationStatus?.state === "importing";

  const doImport = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    p.setMigrationStatus({ state: "importing", msg: "Reading file…" });
    try {
      const json = JSON.parse(await file.text());
      p.setMigrationStatus({ state: "importing", msg: "Importing…" });
      const result = await importFromBrowser(json);
      p.setMigrationStatus({ state: "done", msg: `✓ Imported ${(result.price_snapshots_imported || 0).toLocaleString()} price snapshots.` });
      getDbStats().then(p.setDbStats).catch(() => {});
    } catch (err) {
      p.setMigrationStatus({ state: "error", msg: `✕ Import failed: ${err.message || err}` });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const doExport = async () => {
    p.setMigrationStatus({ state: "importing", msg: "Exporting…" });
    try {
      const exportData = await exportAllData();
      const blob = new Blob([JSON.stringify(exportData)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gw2-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      p.setMigrationStatus({ state: "done", msg: `✓ Exported ${((exportData.price_history || []).length).toLocaleString()} price snapshots.` });
    } catch (err) {
      p.setMigrationStatus({ state: "error", msg: `✕ Export failed: ${err.message || err}` });
    }
  };

  return (
    <>
      <div>
        <h2>Maintenance</h2>
        <p className="st-lede">Recipe scans, backups and resets. These act right away and don't need Save.</p>
      </div>

      <div className="st-card">
        <div className="st-row-between">
          <span>Auto-unlocked recipes
            <span className="st-sub">Recipes like Piece of Dragon Jade that unlock from discipline level alone. Checked every few hours; a manual scan takes a minute or two.</span>
          </span>
          <button className="st-btn" onClick={p.rescanAutoUnlockedRecipes} disabled={p.rescanningRecipes}>{p.rescanningRecipes ? "SCANNING…" : "SCAN NOW"}</button>
        </div>
      </div>

      <div className="st-card">
        <div className="st-card-title">BACKUP</div>
        <div className="st-row-between">
          <span>Export everything
            <span className="st-sub">Price history, flip tracking, settings and cache, saved to a .json file. Friend keys are left out.</span>
          </span>
          <button className="st-btn" onClick={doExport} disabled={busy}>EXPORT</button>
        </div>
        <div className="st-row-between">
          <span>Import a backup
            <span className="st-sub">A .json file from this app or the browser version.</span>
          </span>
          <span>
            <input ref={fileRef} type="file" accept=".json" className="st-file-hidden" onChange={doImport} tabIndex={-1} aria-hidden="true" />
            <button className="st-btn" onClick={() => fileRef.current?.click()} disabled={busy}>IMPORT…</button>
          </span>
        </div>
        {p.migrationStatus && (
          <div className={`st-msg pre ${p.migrationStatus.state === "done" ? "ok" : p.migrationStatus.state === "error" ? "bad" : ""}`}>{p.migrationStatus.msg}</div>
        )}
      </div>

      <div className="st-card danger">
        <div className="st-card-title">DANGER ZONE</div>
        <div className="st-row-between">
          <span>Reset market database
            <span className="st-sub">Wipes price and velocity history on the NAS. Your personal data stays.</span>
          </span>
          <button className="st-btn danger" onClick={() => p.onRequestReset("market")}>RESET…</button>
        </div>
        <div className="st-row-between">
          <span>Reset personal database
            <span className="st-sub">Clears your API key, recipes, flips, alerts, friends and settings on this computer.</span>
          </span>
          <button className="st-btn danger" onClick={() => p.onRequestReset("personal")}>RESET…</button>
        </div>
      </div>
    </>
  );
}

function AboutSection(p) {
  return (
    <>
      <div>
        <h2>About &amp; Updates</h2>
        <p className="st-lede">GW2 Wealth Tracker <span style={{ color: "var(--gold2)", fontFamily: "ui-monospace, Consolas, monospace" }}>v{p.appVersion || "…"}</span></p>
      </div>

      {p.updateError && <div className="st-msg bad">{p.updateError}</div>}

      {p.updateInfo ? (
        <div className="st-update">
          <div className="st-update-title">Update available: v{p.updateInfo.version}</div>
          {p.updateInfo.body && <div className="st-update-body">{p.updateInfo.body}</div>}
          <div><button className="st-btn primary" onClick={p.handleInstallUpdate} disabled={p.updateInstalling}>
            {p.updateInstalling ? "DOWNLOADING & INSTALLING…" : "DOWNLOAD & RESTART"}
          </button></div>
        </div>
      ) : (
        <div className="st-row-between">
          <span>You're on the latest version we know of.</span>
          <button className="st-btn" onClick={p.handleCheckForUpdates} disabled={p.updateChecking}>{p.updateChecking ? "CHECKING…" : "CHECK FOR UPDATES"}</button>
        </div>
      )}

      <div className="st-divider" />

      <div className="st-field">
        <div className="st-field-head">
          <span className="st-label">CHANGELOG</span>
          <button className="st-btn small" onClick={p.handleOpenChangelog}>{p.showChangelog ? "HIDE" : "SHOW CHANGELOG"}</button>
        </div>
        {p.showChangelog && (
          <div className="st-changelog">
            {p.changelogLoading && <div className="st-help dim">Loading…</div>}
            {!p.changelogLoading && p.changelog.length === 0 && <div className="st-help dim">No releases found.</div>}
            {p.changelog.map(r => (
              <div key={r.tag} className="st-release">
                <div className="st-release-name">{r.name}</div>
                <div className="st-release-date">{new Date(r.date).toLocaleDateString()}</div>
                <div className="st-release-body">{r.body ? renderMarkdown(r.body) : "—"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Main window ─────────────────────────────────────────────────────────────

export function SettingsPanel(props) {
  const {
    settingsApiKey, setSettingsApiKey, settingsNasSsh, setSettingsNasSsh,
    settingsAlertThreshold, setSettingsAlertThreshold, settingsGemAlertThresholdGold,
    setSettingsGemAlertThresholdGold, settingsCustomSoundPath, setSettingsCustomSoundPath,
    setCustomSoundPath,
    settingsPiperVoiceFile, setSettingsPiperVoiceFile,
    settingsPiperSpeakerId, setSettingsPiperSpeakerId,
    setPiperVoiceFile, setPiperSpeakerId,
    friends, updateInfo,
    settingsMsg, setSettingsMsg,
    setAlertThreshold, setGemAlertThresholdGold, setApiKey,
    settingsDrfToken, setSettingsDrfToken, setDrfToken,
    onClose, initialSection,
  } = props;

  const [section, setSection] = useState(initialSection || "account");
  const [saving, setSaving] = useState(false);
  const [closeAsked, setCloseAsked] = useState(false);
  useEffect(() => { if (initialSection) setSection(initialSection); }, [initialSection]);

  // Snapshot of the saved values, taken when the window opens and after each
  // save — the footer compares against it to count unsaved edits.
  const current = {
    api_key: settingsApiKey, drfToken: settingsDrfToken, nas_ssh: settingsNasSsh,
    alert_threshold: settingsAlertThreshold, gem_alert_threshold_gold: settingsGemAlertThresholdGold,
    customSoundPath: settingsCustomSoundPath, piperVoiceFile: settingsPiperVoiceFile || "",
    piperSpeakerId: settingsPiperSpeakerId ?? null,
  };
  const baseline = useRef(current);
  const dirtyCount = useMemo(
    () => Object.keys(current).filter(k => current[k] !== baseline.current[k]).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settingsApiKey, settingsDrfToken, settingsNasSsh, settingsAlertThreshold, settingsGemAlertThresholdGold, settingsCustomSoundPath, settingsPiperVoiceFile, settingsPiperSpeakerId, saving],
  );

  const discard = () => {
    const b = baseline.current;
    setSettingsApiKey(b.api_key); setSettingsDrfToken(b.drfToken); setSettingsNasSsh(b.nas_ssh);
    setSettingsAlertThreshold(b.alert_threshold); setSettingsGemAlertThresholdGold(b.gem_alert_threshold_gold);
    setSettingsCustomSoundPath(b.customSoundPath); setSettingsPiperVoiceFile(b.piperVoiceFile);
    setSettingsPiperSpeakerId(b.piperSpeakerId);
    setSettingsMsg(null);
    setCloseAsked(false);
  };

  const save = async () => {
    setSettingsMsg(null);
    setSaving(true);
    try {
      const msg = await invoke("set_market_db_path", { path: settingsNasSsh });
      await invoke("cache_set", { key: "nas_ssh", value: settingsNasSsh });
      await invoke("cache_set", { key: "alert_threshold", value: String(settingsAlertThreshold) });
      await invoke("cache_set", { key: "gem_alert_threshold_gold", value: String(settingsGemAlertThresholdGold) });
      await invoke("cache_set", { key: "api_key", value: settingsApiKey.trim() });
      await invoke("cache_set", { key: "drfToken", value: settingsDrfToken.trim() });
      await invoke("cache_set", { key: "customSoundPath", value: settingsCustomSoundPath });
      await invoke("cache_set", { key: "piperVoiceFile", value: settingsPiperVoiceFile || "" });
      await invoke("cache_set", { key: "piperSpeakerId", value: settingsPiperSpeakerId != null ? String(settingsPiperSpeakerId) : "" });
      setAlertThreshold(settingsAlertThreshold);
      setGemAlertThresholdGold(settingsGemAlertThresholdGold);
      setCustomSoundPath(settingsCustomSoundPath);
      setPiperVoiceFile(settingsPiperVoiceFile);
      setPiperSpeakerId(settingsPiperSpeakerId);
      if (settingsApiKey.trim()) { setApiKey(settingsApiKey.trim()); window.__gw2ApiKey = settingsApiKey.trim(); }
      setDrfToken(settingsDrfToken.trim()); // empty string disables the live feed (useDrfLiveFeed checks !!token)
      baseline.current = { ...current };
      setSettingsMsg({ ok: true, text: msg || "Saved" });
      return true;
    } catch (e) {
      setSettingsMsg({ ok: false, text: String(e) });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const requestClose = () => {
    if (dirtyCount > 0) { setCloseAsked(true); return; }
    onClose();
  };

  useEffect(() => {
    const onKey = e => {
      if (e.key === "Escape") requestClose();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); if (dirtyCount > 0) save(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const failedFriends = friends.filter(f => !f.last_refresh_ok).length;
  const navExtra = id => {
    if (id === "friends" && friends.length > 0) return failedFriends > 0
      ? <span className="st-nav-dot bad" aria-label={`${failedFriends} friend key needs attention`} title={`${failedFriends} need attention`} />
      : <span className="st-nav-count">{friends.length}</span>;
    if (id === "about" && updateInfo) return <span className="st-nav-dot" aria-label="Update available" title={`v${updateInfo.version} available`} />;
    return null;
  };

  const Pane = { account: AccountSection, alerts: AlertsSection, sound: SoundSection, friends: FriendsSection, maintenance: MaintenanceSection, about: AboutSection }[section] || AccountSection;

  return (
    <div className="st-overlay" onMouseDown={e => { if (e.target === e.currentTarget) requestClose(); }}>
      <div className="st-modal" role="dialog" aria-modal="true" aria-label="Settings">
        <div className="st-head">
          <div className="st-title">SETTINGS</div>
          <button className="st-btn icon" onClick={requestClose} aria-label="Close settings"><Icon d={ICONS.close} /></button>
        </div>

        <div className="st-body">
          <nav className="st-nav" aria-label="Settings sections">
            {SECTIONS.map(s => (
              <button key={s.id} className={`st-nav-item ${section === s.id ? "active" : ""}`} onClick={() => setSection(s.id)}
                aria-current={section === s.id ? "page" : undefined}>
                <span className="st-nav-label"><Icon d={ICONS[s.id]} />{s.label.toUpperCase()}</span>
                {navExtra(s.id)}
              </button>
            ))}
            <div className="st-nav-version">v{props.appVersion || "…"}</div>
          </nav>

          <div className="st-pane" key={section}>
            <Pane {...props} />
          </div>
        </div>

        <div className="st-foot">
          {closeAsked && dirtyCount > 0 ? (
            <span className="st-foot-state dirty"><span className="dot" />You have unsaved changes. Save them before closing?</span>
          ) : dirtyCount > 0 ? (
            <span className="st-foot-state dirty"><span className="dot" />{dirtyCount} unsaved change{dirtyCount === 1 ? "" : "s"}</span>
          ) : settingsMsg ? (
            <span className={`st-msg ${settingsMsg.ok ? "ok" : "bad"}`}>{settingsMsg.text}</span>
          ) : (
            <span className="st-foot-state">All changes saved</span>
          )}
          <div className="st-foot-actions">
            {closeAsked && dirtyCount > 0 ? (
              <>
                <button className="st-btn" onClick={() => { discard(); onClose(); }}>DISCARD &amp; CLOSE</button>
                <button className="st-btn primary" onClick={async () => { if (await save()) onClose(); }} disabled={saving}>SAVE &amp; CLOSE</button>
              </>
            ) : (
              <>
                <button className="st-btn" onClick={discard} disabled={dirtyCount === 0 || saving}>DISCARD</button>
                <button className="st-btn primary" onClick={save} disabled={dirtyCount === 0 || saving}>{saving ? "SAVING…" : "SAVE CHANGES"}</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
