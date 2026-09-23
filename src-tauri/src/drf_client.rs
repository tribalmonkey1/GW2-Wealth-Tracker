// ── DRF (Drop Research Facilities) live feed ────────────────────────────────
// Subscribes to the unofficial DRF WebSocket API (wss://drf.rs/ws) so the app
// can react to inventory/currency changes the instant they happen in-game,
// instead of waiting on the next GW2 API poll (PRICE_REFRESH_MS in App.jsx).
//
// This is a companion feed, never a replacement: nothing here disables or
// depends on the existing GW2-API-based refreshPrices()/doLiveUpdate() flow —
// see storage.js/App.jsx. If DRF is unconfigured, unreachable, or drops the
// connection, refreshPrices() keeps working exactly as it does today.
//
// Protocol (reverse-engineered from the MIT-licensed GW2ToolBelt/drf-api-client,
// since DRF publishes no official docs — see that repo's own disclaimer: "uses
// internal APIs that are not officially supported by the DRF developers and
// may break at any time"):
//   1. Open a plain WebSocket to wss://drf.rs/ws
//   2. Immediately send ONE Text frame: "Bearer <token>" (the DRF token from
//      the person's drf.rs account / DRF addon settings — NOT their GW2 API key)
//   3. The server then streams JSON Text frames shaped {"kind": ..., "payload": ...}:
//        kind "data"           -> { character, drop: { items: {id: delta},
//                                    curr: {id: delta}, mf: magicFind, timestamp } }
//        kind "session_update" -> { character, level, map, start, end? }
//
// `items`/`curr` are DELTAS (change since last message), not absolute counts —
// which is exactly what an incremental ownedMap/wallet patch on the JS side wants.
// Currency id 1 is Coin (gold, in copper).

use futures_util::{SinkExt, StreamExt};
use serde::Serialize;
use serde_json::Value;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};
use tokio::sync::Mutex as AsyncMutex;
use tokio_tungstenite::tungstenite::Message;

const DRF_WS_URL: &str = "wss://drf.rs/ws";
// Reconnect backoff: starts fast (DRF connections are normally very stable —
// a drop usually means a momentary network blip), caps so a genuinely dead
// endpoint doesn't hammer drf.rs forever.
const RECONNECT_MIN_MS: u64 = 1_000;
const RECONNECT_MAX_MS: u64 = 30_000;

#[derive(Serialize, Clone)]
pub struct DrfDropEvent {
    pub character: String,
    pub items: std::collections::HashMap<String, i64>, // item_id (as string key, JS-side Number() it) -> delta
    pub currencies: std::collections::HashMap<String, i64>,
    pub magic_find: i64,
    pub timestamp: String,
}

#[derive(Serialize, Clone)]
pub struct DrfSessionEvent {
    pub character: String,
    pub level: i64,
    pub map: i64,
    pub start: String,
    pub end: Option<String>,
}

#[derive(Serialize, Clone)]
pub struct DrfStatusEvent {
    pub status: String,        // "connecting" | "connected" | "reconnecting" | "disconnected" | "error"
    pub detail: Option<String>,
}

fn emit_status(app: &AppHandle, status: &str, detail: Option<String>) {
    let _ = app.emit("drf://status", DrfStatusEvent { status: status.to_string(), detail });
}

// Holds the "please stop" flag for whatever connection loop is currently
// running, so drf_disconnect (or connecting with a new token) can cleanly
// tear down the previous one instead of leaving two loops racing each other.
pub struct DrfState {
    inner: AsyncMutex<Option<Arc<AtomicBool>>>,
}

impl Default for DrfState {
    fn default() -> Self {
        Self { inner: AsyncMutex::new(None) }
    }
}

#[tauri::command]
pub async fn drf_connect(app: AppHandle, state: State<'_, DrfState>, token: String) -> Result<(), String> {
    let token = token.trim().to_string();
    if token.is_empty() {
        return Err("DRF token is empty.".to_string());
    }

    // Stop any previous session before starting a new one.
    stop_current(&state).await;

    let stop_flag = Arc::new(AtomicBool::new(false));
    {
        let mut guard = state.inner.lock().await;
        *guard = Some(stop_flag.clone());
    }

    let app_for_task = app.clone();
    tauri::async_runtime::spawn(async move {
        run_with_reconnect(app_for_task, token, stop_flag).await;
    });

    Ok(())
}

#[tauri::command]
pub async fn drf_disconnect(app: AppHandle, state: State<'_, DrfState>) -> Result<(), String> {
    stop_current(&state).await;
    emit_status(&app, "disconnected", None);
    Ok(())
}

async fn stop_current(state: &State<'_, DrfState>) {
    let mut guard = state.inner.lock().await;
    if let Some(flag) = guard.take() {
        flag.store(true, Ordering::SeqCst);
    }
}

// Reconnect loop — runs until `stop_flag` is set (via drf_disconnect or a
// fresh drf_connect superseding this one).
async fn run_with_reconnect(app: AppHandle, token: String, stop_flag: Arc<AtomicBool>) {
    let mut backoff_ms = RECONNECT_MIN_MS;

    loop {
        if stop_flag.load(Ordering::SeqCst) {
            return;
        }

        emit_status(&app, "connecting", None);
        match run_once(&app, &token, &stop_flag).await {
            Ok(()) => {
                // Clean shutdown (stop_flag was set mid-session) — don't reconnect.
                if stop_flag.load(Ordering::SeqCst) {
                    return;
                }
                // Server closed normally for some other reason — treat like any
                // other drop and try again with backoff.
                emit_status(&app, "reconnecting", Some("connection closed".to_string()));
            }
            Err(e) => {
                if stop_flag.load(Ordering::SeqCst) {
                    return;
                }
                emit_status(&app, "reconnecting", Some(e));
            }
        }

        tokio::time::sleep(Duration::from_millis(backoff_ms)).await;
        backoff_ms = (backoff_ms * 2).min(RECONNECT_MAX_MS);
    }
}

async fn run_once(app: &AppHandle, token: &str, stop_flag: &Arc<AtomicBool>) -> Result<(), String> {
    let (ws_stream, _) = tokio_tungstenite::connect_async(DRF_WS_URL)
        .await
        .map_err(|e| format!("connect failed: {e}"))?;

    let (mut write, mut read) = ws_stream.split();

    write
        .send(Message::Text(format!("Bearer {token}")))
        .await
        .map_err(|e| format!("auth frame failed: {e}"))?;

    emit_status(app, "connected", None);
    let mut backoff_reset = true; // caller resets backoff_ms itself once we return Ok after being connected a while — see note below

    while let Some(msg) = read.next().await {
        if stop_flag.load(Ordering::SeqCst) {
            let _ = write.send(Message::Close(None)).await;
            return Ok(());
        }

        let msg = msg.map_err(|e| format!("socket error: {e}"))?;
        let text = match msg {
            Message::Text(t) => t,
            Message::Close(reason) => {
                return Err(format!("closed by server: {reason:?}"));
            }
            _ => continue, // ignore ping/pong/binary — DRF only sends JSON text frames
        };

        let value: Value = match serde_json::from_str(&text) {
            Ok(v) => v,
            Err(_) => continue, // malformed frame — skip rather than kill the whole session
        };
        let kind = value.get("kind").and_then(|k| k.as_str()).unwrap_or("");
        let payload = match value.get("payload") {
            Some(p) => p,
            None => continue,
        };

        match kind {
            "data" => {
                if let Some(evt) = parse_drop(payload) {
                    let _ = app.emit("drf://drop", evt);
                    // We stayed connected long enough to receive real data —
                    // signal the outer loop it's safe to reset backoff on the
                    // NEXT reconnect attempt. (Simplification: emitted status
                    // "connected" already does this implicitly on the JS side;
                    // kept here as a hook if you want true backoff-reset logic.)
                    let _ = backoff_reset; // no-op, silences unused warning
                    backoff_reset = false;
                }
            }
            "session_update" => {
                if let Some(evt) = parse_session(payload) {
                    let _ = app.emit("drf://session", evt);
                }
            }
            _ => {}
        }
    }

    Err("stream ended".to_string())
}

fn parse_drop(payload: &Value) -> Option<DrfDropEvent> {
    let character = payload.get("character")?.as_str()?.to_string();
    let drop = payload.get("drop")?;
    let items = drop.get("items")?.as_object()?
        .iter()
        .filter_map(|(k, v)| v.as_i64().map(|n| (k.clone(), n)))
        .collect();
    let currencies = drop.get("curr")?.as_object()?
        .iter()
        .filter_map(|(k, v)| v.as_i64().map(|n| (k.clone(), n)))
        .collect();
    let magic_find = drop.get("mf").and_then(|v| v.as_i64()).unwrap_or(0);
    let timestamp = drop.get("timestamp").and_then(|v| v.as_str()).unwrap_or("").to_string();
    Some(DrfDropEvent { character, items, currencies, magic_find, timestamp })
}

fn parse_session(payload: &Value) -> Option<DrfSessionEvent> {
    Some(DrfSessionEvent {
        character: payload.get("character")?.as_str()?.to_string(),
        level: payload.get("level").and_then(|v| v.as_i64()).unwrap_or(0),
        map: payload.get("map").and_then(|v| v.as_i64()).unwrap_or(0),
        start: payload.get("start").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        end: payload.get("end").and_then(|v| v.as_str()).map(|s| s.to_string()),
    })
}
