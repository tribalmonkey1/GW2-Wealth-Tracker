use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::PersonalDbState;

// ── NAS API URL ───────────────────────────────────────────────────────────────
// Reads the configured NAS API URL from personal.db.
// Falls back to the default if not set.
fn get_api_url() -> String {
    let personal_path = crate::get_personal_db_path();
    if personal_path.exists() {
        if let Ok(conn) = rusqlite::Connection::open(&personal_path) {
            // Check for explicit saved API URL first
            if let Ok(url) = conn.query_row(
                "SELECT value FROM app_cache WHERE key = 'nas_api_url'",
                [], |r| r.get::<_, String>(0)
            ) {
                if !url.is_empty() { return url; }
            }
            // Fall back to deriving URL from nas_ssh (e.g. "derrick@192.168.1.212" -> "http://192.168.1.212:8745")
            if let Ok(ssh) = conn.query_row(
                "SELECT value FROM app_cache WHERE key = 'nas_ssh'",
                [], |r| r.get::<_, String>(0)
            ) {
                if !ssh.is_empty() {
                    let host = if ssh.contains('@') {
                        ssh.splitn(2, '@').nth(1).unwrap_or(&ssh).to_string()
                    } else {
                        ssh.clone()
                    };
                    return format!("http://{}:8745", host);
                }
            }
        }
    }
    "http://192.168.1.212:8745".to_string()
}

fn api_get(path: &str) -> Result<serde_json::Value, String> {
    let url = format!("{}{}", get_api_url(), path);
    let resp = ureq::get(&url)
        .timeout(std::time::Duration::from_secs(20))
        .call()
        .map_err(|e| format!("API request failed: {}", e))?;
    resp.into_json::<serde_json::Value>()
        .map_err(|e| format!("API response parse failed: {}", e))
}

fn api_post(path: &str, body: &serde_json::Value) -> Result<serde_json::Value, String> {
    let url = format!("{}{}", get_api_url(), path);
    let resp = ureq::post(&url)
        .timeout(std::time::Duration::from_secs(30))
        .send_json(body)
        .map_err(|e| format!("API request failed: {}", e))?;
    resp.into_json::<serde_json::Value>()
        .map_err(|e| format!("API response parse failed: {}", e))
}

// ── Structs ───────────────────────────────────────────────────────────────────
#[derive(Serialize, Deserialize, Clone)]
pub struct PricePoint {
    pub item_id: i64, pub ts: i64, pub sell: i64,
    pub buy: i64, pub sell_qty: i64, pub buy_qty: i64,
}
#[derive(Serialize, Deserialize, Clone)]
pub struct VelocityPoint {
    pub item_id: i64, pub ts: i64, pub sell_qty: i64, pub buy_qty: i64,
}
#[derive(Serialize, Deserialize)]
pub struct FlipPending {
    pub id: Option<i64>, pub item_id: i64, pub item_name: String,
    pub buy_price: i64, pub qty: i64, pub target_sell_price: i64,
    pub buy_time: i64, pub flagged_buy_now_ts: Option<i64>,
}
#[derive(Serialize, Deserialize)]
pub struct FlipHistory {
    pub id: Option<i64>, pub item_id: i64, pub item_name: String,
    pub buy_price: i64, pub sell_price: i64, pub qty: i64,
    pub profit: i64, pub buy_time: i64, pub sell_time: i64,
}
#[derive(Serialize, Deserialize)]
pub struct ManualDailyReset { pub item_id: i64, pub count: i64, pub reset_ts: i64 }
#[derive(Serialize, Deserialize, Clone)]
pub struct CacheEntry { pub key: String, pub value: String, pub ts: i64 }
#[derive(Serialize, Deserialize)]
pub struct ImportData {
    pub price_history: Vec<PricePoint>,
    pub velocity_snapshots: Vec<VelocityPoint>,
    pub flip_pending: Vec<FlipPending>,
    pub flip_history: Vec<FlipHistory>,
    pub manual_daily_resets: Vec<ManualDailyReset>,
    pub app_cache: Vec<CacheEntry>,
}
#[derive(Serialize)]
pub struct DbStats {
    pub size_mb: f64,
    pub price_history_count: i64,
    pub velocity_count: i64,
    pub db_path: String,
}
#[derive(Serialize)]
pub struct MarketDbInfo {
    pub path: String,
    pub exists: bool,
    pub size_mb: f64,
}
#[derive(Serialize, Clone)]
pub struct VelocityResult {
    pub item_id: i64, pub sell_fills_per_hr: f64, pub buy_fills_per_hr: f64,
    pub observations: i64, pub window_hrs: f64,
}
#[derive(Serialize, Clone)]
pub struct TrendResult {
    pub item_id: i64, pub pct: f64, pub current: i64, pub old: i64,
}
#[derive(Serialize, Clone)]
pub struct FlipResult {
    pub item_id: i64, pub p10_sell: i64, pub p25_sell: i64, pub p50_sell: i64,
    pub p75_sell: i64, pub p90_sell: i64, pub swing: f64, pub snap_count: i64,
}
#[derive(Serialize, Clone)]
pub struct MarketSummary {
    pub velocity: Vec<VelocityResult>,
    pub trends: Vec<TrendResult>,
    pub flips: Vec<FlipResult>,
}
#[derive(Serialize, Deserialize)]
pub struct PriceAlertData {
    pub item_id: i64, pub seven_day_max: i64, pub row_count: i64,
}

// ── Price Snapshots (no-op — collector handles writes) ────────────────────────
#[tauri::command]
pub fn save_price_snapshots(_points: Vec<PricePoint>) -> Result<u32, String> { Ok(0) }

#[tauri::command]
pub fn save_velocity_snapshots(_points: Vec<VelocityPoint>) -> Result<(), String> { Ok(()) }

// ── Market data — all routed through NAS API ──────────────────────────────────

#[tauri::command]
pub fn load_price_history(item_id: i64, since_ts: i64) -> Result<Vec<PricePoint>, String> {
    let val = api_post("/price-history", &serde_json::json!({
        "item_id": item_id, "since_ts": since_ts
    }))?;
    serde_json::from_value(val).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_price_history_bulk(item_ids: Vec<i64>, since_ts: i64) -> Result<Vec<PricePoint>, String> {
    if item_ids.is_empty() { return Ok(vec![]); }
    let val = api_post("/price-history-bulk", &serde_json::json!({
        "item_ids": item_ids, "since_ts": since_ts
    }))?;
    serde_json::from_value(val).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_velocity_for_items(item_ids: Vec<i64>, since_ts: i64) -> Result<Vec<VelocityPoint>, String> {
    if item_ids.is_empty() { return Ok(vec![]); }
    let val = api_post("/velocity-for-items", &serde_json::json!({
        "item_ids": item_ids, "since_ts": since_ts
    }))?;
    serde_json::from_value(val).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_price_alert_data(item_ids: Vec<i64>, since_ts: i64) -> Result<Vec<PriceAlertData>, String> {
    if item_ids.is_empty() { return Ok(vec![]); }
    let val = api_post("/price-alert-data", &serde_json::json!({
        "item_ids": item_ids, "since_ts": since_ts
    }))?;
    serde_json::from_value(val).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_db_stats() -> Result<DbStats, String> {
    let val = api_get("/db-stats")?;
    Ok(DbStats {
        size_mb: val["size_mb"].as_f64().unwrap_or(0.0),
        price_history_count: val["price_history_count"].as_i64().unwrap_or(0),
        velocity_count: val["velocity_count"].as_i64().unwrap_or(0),
        db_path: val["db_path"].as_str().unwrap_or("").to_string(),
    })
}

#[tauri::command]
pub fn prune_old_data() -> Result<(), String> {
    // Collector handles pruning on the NAS side
    Ok(())
}

#[tauri::command]
pub fn reset_market_db_files() -> Result<(), String> {
    api_post("/reset", &serde_json::json!({}))?;
    Ok(())
}

// ── Background market summary ─────────────────────────────────────────────────
use std::sync::{Mutex as StdMutex, OnceLock};

struct MarketSummaryCache {
    last_computed_ms: i64,
    is_computing: bool,
    cached: Option<MarketSummary>,
}

fn market_cache() -> &'static StdMutex<MarketSummaryCache> {
    static MARKET_CACHE: OnceLock<StdMutex<MarketSummaryCache>> = OnceLock::new();
    MARKET_CACHE.get_or_init(|| StdMutex::new(MarketSummaryCache {
        last_computed_ms: 0, is_computing: false, cached: None,
    }))
}

#[tauri::command]
pub fn get_market_summary() -> Result<MarketSummary, String> {
    let now_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64;
    let cache_ttl_ms: i64 = 90 * 1000;

    let (cached_result, should_spawn) = {
        let cache = market_cache().lock().unwrap();
        let stale = now_ms - cache.last_computed_ms >= cache_ttl_ms;
        let result = cache.cached.as_ref().map(|c| MarketSummary {
            velocity: c.velocity.clone(),
            trends:   c.trends.clone(),
            flips:    c.flips.clone(),
        });
        (result, stale && !cache.is_computing)
    };

    if should_spawn {
        { market_cache().lock().unwrap().is_computing = true; }
        std::thread::spawn(move || {
            let result = fetch_market_summary_from_api();
            let mut cache = market_cache().lock().unwrap();
            cache.is_computing = false;
            cache.last_computed_ms = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as i64;
            if let Ok(r) = result { cache.cached = Some(r); }
        });
    }

    Ok(cached_result.unwrap_or_else(|| MarketSummary {
        velocity: vec![], trends: vec![], flips: vec![],
    }))
}

fn fetch_market_summary_from_api() -> Result<MarketSummary, String> {
    // Short timeout — if NAS is unreachable, fail fast rather than blocking for 30s
    let url = format!("{}/market-summary", get_api_url());
    let resp = ureq::get(&url)
        .timeout(std::time::Duration::from_secs(20))
        .call()
        .map_err(|e| format!("API request failed: {}", e))?;
    let val: serde_json::Value = resp.into_json()
        .map_err(|e| format!("API response parse failed: {}", e))?;

    let velocity = val["velocity"].as_array().unwrap_or(&vec![]).iter().filter_map(|v| {
        Some(VelocityResult {
            item_id:          v["item_id"].as_i64()?,
            sell_fills_per_hr: v["sell_fills_per_hr"].as_f64()?,
            buy_fills_per_hr:  v["buy_fills_per_hr"].as_f64()?,
            observations:      v["observations"].as_i64()?,
            window_hrs:        v["window_hrs"].as_f64()?,
        })
    }).collect();

    let trends = val["trends"].as_array().unwrap_or(&vec![]).iter().filter_map(|t| {
        Some(TrendResult {
            item_id: t["item_id"].as_i64()?,
            pct:     t["pct"].as_f64()?,
            current: t["current"].as_i64()?,
            old:     t["old"].as_i64()?,
        })
    }).collect();

    let flips = val["flips"].as_array().unwrap_or(&vec![]).iter().filter_map(|f| {
        Some(FlipResult {
            item_id:    f["item_id"].as_i64()?,
            p10_sell:   f["p10_sell"].as_i64()?,
            p25_sell:   f["p25_sell"].as_i64()?,
            p50_sell:   f["p50_sell"].as_i64()?,
            p75_sell:   f["p75_sell"].as_i64()?,
            p90_sell:   f["p90_sell"].as_i64()?,
            swing:      f["swing"].as_f64()?,
            snap_count: f["snap_count"].as_i64()?,
        })
    }).collect();

    Ok(MarketSummary { velocity, trends, flips })
}

// ── NAS API URL setting ───────────────────────────────────────────────────────
#[tauri::command]
pub fn get_market_db_info(personal: State<'_, PersonalDbState>) -> Result<MarketDbInfo, String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    // Return the saved NAS SSH address for display in the settings NAS Address field
    let saved_ssh: String = conn.query_row(
        "SELECT value FROM app_cache WHERE key = 'nas_ssh'",
        [], |r| r.get(0)
    ).unwrap_or_default();
    // Test connectivity using the derived API URL
    let api_url = get_api_url();
    let exists = ureq::get(&format!("{}/health", api_url))
        .timeout(std::time::Duration::from_secs(3))
        .call().is_ok();
    Ok(MarketDbInfo { path: saved_ssh, exists, size_mb: 0.0 })
}

#[tauri::command]
pub fn set_market_db_path(personal: State<'_, PersonalDbState>, path: String) -> Result<String, String> {
    // `path` is the NAS address entered in settings (e.g. "192.168.1.212" or "derrick@192.168.1.212")
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().timestamp_millis();
    if path.is_empty() {
        conn.execute("DELETE FROM app_cache WHERE key='nas_api_url'", []).map_err(|e| e.to_string())?;
        conn.execute("DELETE FROM app_cache WHERE key='nas_ssh'", []).map_err(|e| e.to_string())?;
        Ok("NAS address cleared — restart app to apply".to_string())
    } else {
        // Derive API URL: strip user@ prefix if present, append port 8745
        let host = if path.contains('@') {
            path.splitn(2, '@').nth(1).unwrap_or(&path).to_string()
        } else {
            path.clone()
        };
        let api_url = format!("http://{}:8745", host);
        // Quick connectivity check using derived URL
        let reachable = ureq::get(&format!("{}/health", api_url))
            .timeout(std::time::Duration::from_secs(3))
            .call().is_ok();
        if !reachable {
            return Err(format!("Cannot reach API at {} — is gw2-api running?", api_url));
        }
        // Save both the derived API URL and the raw address (for SSH restart commands)
        conn.execute(
            "INSERT OR REPLACE INTO app_cache (key,value,ts) VALUES ('nas_api_url',?,?)",
            params![api_url, now]
        ).map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT OR REPLACE INTO app_cache (key,value,ts) VALUES ('nas_ssh',?,?)",
            params![path, now]
        ).map_err(|e| e.to_string())?;
        Ok(format!("NAS address saved — connecting to {}", api_url))
    }
}

// ── Import / Export ───────────────────────────────────────────────────────────
#[tauri::command]
pub fn import_from_browser(personal: State<'_, PersonalDbState>, data: ImportData) -> Result<serde_json::Value, String> {
    // Send market data to API
    let market_payload = serde_json::json!({
        "price_history": data.price_history,
        "velocity_snapshots": data.velocity_snapshots,
    });
    let api_result = api_post("/import", &market_payload).unwrap_or(serde_json::json!({}));
    let price_count = api_result["price_history"].as_i64().unwrap_or(0);
    let vel_count   = api_result["velocity_snapshots"].as_i64().unwrap_or(0);

    // Personal data goes to local personal.db as before
    let pconn = personal.0.lock().map_err(|e| e.to_string())?;
    let ptx = pconn.unchecked_transaction().map_err(|e| e.to_string())?;
    for f in &data.flip_pending {
        ptx.execute(
            "INSERT OR IGNORE INTO flip_pending (item_id,item_name,buy_price,qty,target_sell_price,buy_time,flagged_buy_now_ts) VALUES (?,?,?,?,?,?,?)",
            params![f.item_id, f.item_name, f.buy_price, f.qty, f.target_sell_price, f.buy_time, f.flagged_buy_now_ts],
        ).ok();
    }
    for f in &data.flip_history {
        ptx.execute(
            "INSERT OR IGNORE INTO flip_history (item_id,item_name,buy_price,sell_price,qty,profit,buy_time,sell_time) VALUES (?,?,?,?,?,?,?,?)",
            params![f.item_id, f.item_name, f.buy_price, f.sell_price, f.qty, f.profit, f.buy_time, f.sell_time],
        ).ok();
    }
    for m in &data.manual_daily_resets {
        ptx.execute(
            "INSERT OR REPLACE INTO manual_daily_resets (item_id,count,reset_ts) VALUES (?,?,?)",
            params![m.item_id, m.count, m.reset_ts],
        ).ok();
    }
    let now = chrono::Utc::now().timestamp_millis();
    for c in &data.app_cache {
        if c.key == "market_db_path" || c.key == "nas_api_url" { continue; }
        ptx.execute(
            "INSERT OR REPLACE INTO app_cache (key,value,ts) VALUES (?,?,?)",
            params![c.key, c.value, now],
        ).ok();
    }
    ptx.commit().map_err(|e| e.to_string())?;
    Ok(serde_json::json!({ "price_snapshots_imported": price_count, "velocity_snapshots_imported": vel_count }))
}

// ── Cache (personal.db) ───────────────────────────────────────────────────────
#[tauri::command]
pub fn cache_get_bulk(personal: State<'_, PersonalDbState>, keys: Vec<String>) -> Result<Vec<Option<CacheEntry>>, String> {
    if keys.is_empty() { return Ok(vec![]); }
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    let placeholders = keys.iter().map(|_| "?").collect::<Vec<_>>().join(",");
    let sql = format!("SELECT key,value,ts FROM app_cache WHERE key IN ({})", placeholders);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let found: std::collections::HashMap<String, CacheEntry> = stmt
        .query_map(rusqlite::params_from_iter(keys.iter()), |r| {
            Ok(CacheEntry { key: r.get(0)?, value: r.get(1)?, ts: r.get(2)? })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .map(|e| (e.key.clone(), e))
        .collect();
    Ok(keys.iter().map(|k| found.get(k).cloned()).collect())
}

#[tauri::command]
pub fn cache_set(personal: State<'_, PersonalDbState>, key: String, value: String) -> Result<(), String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().timestamp_millis();
    conn.execute(
        "INSERT OR REPLACE INTO app_cache (key,value,ts) VALUES (?,?,?)",
        params![key, value, now]
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn cache_get(personal: State<'_, PersonalDbState>, key: String) -> Result<Option<CacheEntry>, String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    let result = conn.query_row(
        "SELECT key,value,ts FROM app_cache WHERE key=?", params![key],
        |r| Ok(CacheEntry { key: r.get(0)?, value: r.get(1)?, ts: r.get(2)? })
    );
    match result {
        Ok(e) => Ok(Some(e)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

// ── Flip Tracking ─────────────────────────────────────────────────────────────
#[tauri::command]
pub fn flip_pending_add(personal: State<'_, PersonalDbState>, entry: FlipPending) -> Result<i64, String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO flip_pending (item_id,item_name,buy_price,qty,target_sell_price,buy_time,flagged_buy_now_ts) VALUES (?,?,?,?,?,?,?)",
        params![entry.item_id, entry.item_name, entry.buy_price, entry.qty, entry.target_sell_price, entry.buy_time, entry.flagged_buy_now_ts],
    ).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn flip_pending_get_all(personal: State<'_, PersonalDbState>) -> Result<Vec<FlipPending>, String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id,item_id,item_name,buy_price,qty,target_sell_price,buy_time,flagged_buy_now_ts FROM flip_pending ORDER BY buy_time DESC"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |r| Ok(FlipPending {
        id: r.get(0)?, item_id: r.get(1)?, item_name: r.get(2)?,
        buy_price: r.get(3)?, qty: r.get(4)?, target_sell_price: r.get(5)?,
        buy_time: r.get(6)?, flagged_buy_now_ts: r.get(7)?,
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(rows)
}

#[tauri::command]
pub fn flip_pending_delete(personal: State<'_, PersonalDbState>, id: i64) -> Result<(), String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM flip_pending WHERE id=?", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn flip_history_add(personal: State<'_, PersonalDbState>, entry: FlipHistory) -> Result<i64, String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO flip_history (item_id,item_name,buy_price,sell_price,qty,profit,buy_time,sell_time) VALUES (?,?,?,?,?,?,?,?)",
        params![entry.item_id, entry.item_name, entry.buy_price, entry.sell_price, entry.qty, entry.profit, entry.buy_time, entry.sell_time],
    ).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn flip_history_get_all(personal: State<'_, PersonalDbState>) -> Result<Vec<FlipHistory>, String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id,item_id,item_name,buy_price,sell_price,qty,profit,buy_time,sell_time FROM flip_history ORDER BY sell_time DESC"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |r| Ok(FlipHistory {
        id: r.get(0)?, item_id: r.get(1)?, item_name: r.get(2)?,
        buy_price: r.get(3)?, sell_price: r.get(4)?, qty: r.get(5)?,
        profit: r.get(6)?, buy_time: r.get(7)?, sell_time: r.get(8)?,
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(rows)
}

#[tauri::command]
pub fn flip_history_delete(personal: State<'_, PersonalDbState>, id: i64) -> Result<(), String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM flip_history WHERE id=?", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

// ── Manual Daily Resets ───────────────────────────────────────────────────────
#[tauri::command]
pub fn manual_daily_set(personal: State<'_, PersonalDbState>, item_id: i64, count: i64, reset_ts: i64) -> Result<(), String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO manual_daily_resets (item_id,count,reset_ts) VALUES (?,?,?)",
        params![item_id, count, reset_ts]
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn manual_daily_get_all(personal: State<'_, PersonalDbState>) -> Result<Vec<ManualDailyReset>, String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT item_id,count,reset_ts FROM manual_daily_resets").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |r| Ok(ManualDailyReset {
        item_id: r.get(0)?, count: r.get(1)?, reset_ts: r.get(2)?
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(rows)
}

// ── Reset personal data ───────────────────────────────────────────────────────
#[tauri::command]
pub fn reset_database(personal: State<'_, PersonalDbState>) -> Result<(), String> {
    let pconn = personal.0.lock().map_err(|e| e.to_string())?;
    pconn.execute_batch("
        DELETE FROM flip_pending;
        DELETE FROM flip_history;
        DELETE FROM manual_daily_resets;
        DELETE FROM app_cache WHERE key NOT IN ('nas_api_url','nas_ssh');
        VACUUM;
    ").map_err(|e| e.to_string())?;
    Ok(())
}

// ── Restart collector via SSH ─────────────────────────────────────────────────
#[tauri::command]
pub fn restart_collector(personal: State<'_, PersonalDbState>, ssh_target: String) -> Result<(), String> {
    let now = chrono::Utc::now().timestamp_millis();
    if let Ok(conn) = personal.0.lock() {
        conn.execute(
            "INSERT OR REPLACE INTO app_cache (key,value,ts) VALUES ('nas_ssh',?,?)",
            rusqlite::params![ssh_target, now]
        ).ok();
    }
    let cmd = format!(
        "ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 {} \
         'cd /volume1/docker/gw2-collector && sudo docker-compose down && sudo docker-compose up -d'",
        ssh_target
    );
    let output = std::process::Command::new("sh")
        .arg("-c").arg(&cmd)
        .output()
        .map_err(|e| format!("Failed to run SSH: {}", e))?;
    if output.status.success() { Ok(()) }
    else { Err(format!("SSH failed: {}", String::from_utf8_lossy(&output.stderr))) }
}

#[tauri::command]
pub fn get_tracked_item_ids() -> Result<Vec<i64>, String> {
    // Not needed with API architecture — return empty
    Ok(vec![])
}

#[tauri::command]
pub fn append_log(_message: String) -> Result<(), String> { Ok(()) }
