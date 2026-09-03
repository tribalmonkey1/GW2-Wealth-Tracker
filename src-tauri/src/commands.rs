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
        DELETE FROM friend_recipes_known;
        DELETE FROM friend_discipline_levels;
        DELETE FROM friend_keys;
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

// ── Friend Recipe Lookup ────────────────────────────────────────────────────
// Read-only, single-purpose: a friend's API key is used ONLY to fetch which
// recipes they know (/v2/account/recipes). We never touch their materials,
// wallet, or characters. Materials/craftability for friend-only candidates are
// always computed from the LOCAL user's own owned materials and price data —
// see App.jsx's friendOnlyCraftItems, which reuses the existing lockedCraftItems
// (Unlearned Recipes) pipeline rather than any friend-side data.
//
// Scoring (craftAdvantage × sellFillsPerHr) for friend-only candidates uses the
// LOCAL user's own NAS market data. The friend's own collector database is never
// queried — GW2's Trading Post is a single global market, so local price/velocity
// numbers are valid for scoring a friend-known recipe too.

const GW2_API_BASE: &str = "https://api.guildwars2.com/v2";

#[derive(Serialize, Deserialize, Clone)]
pub struct FriendSummary {
    pub id: i64,
    pub name: String,
    pub added_ts: i64,
    pub last_refresh_ts: Option<i64>,
    pub last_refresh_ok: bool,
    pub recipe_count: i64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct FriendRecipesEntry {
    pub friend_id: i64,
    pub friend_name: String,
    pub recipe_ids: Vec<i64>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct FriendDisciplineEntry {
    pub friend_id: i64,
    pub friend_name: String,
    pub discipline_levels: std::collections::HashMap<String, i64>,
}

fn gw2_get(path: &str, api_key: &str) -> Result<serde_json::Value, String> {
    // `path` may already carry its own query string (e.g. "/characters?ids=all") —
    // append access_token with the right separator either way.
    let sep = if path.contains('?') { "&" } else { "?" };
    let url = format!("{}{}{}access_token={}", GW2_API_BASE, path, sep, api_key);
    let resp = ureq::get(&url)
        .timeout(std::time::Duration::from_secs(15))
        .call()
        .map_err(|e| format!("GW2 API request failed: {}", e))?;
    resp.into_json::<serde_json::Value>()
        .map_err(|e| format!("GW2 API response parse failed: {}", e))
}

// Fetches a friend's known recipe ids, after verifying their key has at least the
// `unlocks` permission (required to read recipes). Checking tokeninfo first gives
// a much clearer error than letting the recipes call fail with a generic 403, and
// lets us warn if the key is broader than necessary.
fn fetch_friend_recipe_ids(api_key: &str) -> Result<Vec<i64>, String> {
    let token_info = gw2_get("/tokeninfo", api_key)
        .map_err(|_| "Couldn't verify that API key — check it was copied correctly.".to_string())?;
    let permissions: Vec<String> = token_info["permissions"]
        .as_array()
        .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
        .unwrap_or_default();
    if !permissions.iter().any(|p| p == "unlocks") {
        return Err("This API key is missing the 'Unlocks' permission, which is required to read known recipes. Ask your friend to generate a key with at least 'Unlocks' checked.".to_string());
    }

    let recipes = gw2_get("/account/recipes", api_key)
        .map_err(|_| "Couldn't fetch recipes with that key — it may be invalid or revoked.".to_string())?;
    let ids: Vec<i64> = recipes.as_array()
        .ok_or_else(|| "Unexpected response from GW2 API (expected a list of recipe ids).".to_string())?
        .iter()
        .filter_map(|v| v.as_i64())
        .collect();
    Ok(ids)
}

// Fetches a friend's max crafting discipline ratings (one entry per discipline,
// the highest rating across all of that friend's characters — matches how the
// account owner's own disciplineLevels are computed in App.jsx's fullLoad).
// Requires the `characters` permission, checked up front for the same clearer-
// error-message reason as fetch_friend_recipe_ids checks `unlocks`. This is
// intentionally a separate, independently-failable fetch from recipe ids —
// a friend's key can have `unlocks` without `characters` (or vice versa), and
// callers (add_friend_key, refresh_friend_key) treat a failure here as
// non-fatal: the friend is still added/refreshed with whatever recipe data
// succeeded, they just won't get discipline-eligible ("could craft this via
// their own rating, even if not formally discovered") matching until the key
// is regenerated with both permissions.
fn fetch_friend_discipline_levels(api_key: &str) -> Result<std::collections::HashMap<String, i64>, String> {
    let token_info = gw2_get("/tokeninfo", api_key)
        .map_err(|_| "Couldn't verify that API key — check it was copied correctly.".to_string())?;
    let permissions: Vec<String> = token_info["permissions"]
        .as_array()
        .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
        .unwrap_or_default();
    if !permissions.iter().any(|p| p == "characters") {
        return Err("This API key is missing the 'Characters' permission, which is required to read crafting discipline levels. Ask your friend to generate a key with 'Characters' checked (in addition to 'Unlocks').".to_string());
    }

    let characters = gw2_get("/characters?ids=all", api_key)
        .map_err(|_| "Couldn't fetch characters with that key — it may be invalid or revoked.".to_string())?;
    let chars_arr = characters.as_array()
        .ok_or_else(|| "Unexpected response from GW2 API (expected a list of characters).".to_string())?;

    let mut max_levels: std::collections::HashMap<String, i64> = std::collections::HashMap::new();
    for ch in chars_arr {
        let crafting = match ch["crafting"].as_array() { Some(c) => c, None => continue };
        for c in crafting {
            let discipline = match c["discipline"].as_str() { Some(d) if !d.is_empty() => d, _ => continue };
            let rating = c["rating"].as_i64().unwrap_or(0);
            let entry = max_levels.entry(discipline.to_string()).or_insert(0);
            if rating > *entry { *entry = rating; }
        }
    }
    Ok(max_levels)
}

#[tauri::command]
pub fn add_friend_key(personal: State<'_, PersonalDbState>, name: String, api_key: String) -> Result<FriendSummary, String> {
    let name = name.trim().to_string();
    let api_key = api_key.trim().to_string();
    if name.is_empty() { return Err("Name is required.".to_string()); }
    if api_key.is_empty() { return Err("API key is required.".to_string()); }

    let recipe_ids = fetch_friend_recipe_ids(&api_key)?;
    // Best-effort: a friend's key missing the "Characters" permission shouldn't
    // block adding them at all — see fetch_friend_discipline_levels for why.
    let discipline_levels = fetch_friend_discipline_levels(&api_key).unwrap_or_default();
    let now = chrono::Utc::now().timestamp_millis();

    let mut conn = personal.0.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute(
        "INSERT INTO friend_keys (name, api_key, added_ts, last_refresh_ts, last_refresh_ok) VALUES (?,?,?,?,1)",
        params![name, api_key, now, now],
    ).map_err(|e| e.to_string())?;
    let friend_id = tx.last_insert_rowid();
    {
        let mut stmt = tx.prepare(
            "INSERT OR IGNORE INTO friend_recipes_known (friend_id, recipe_id) VALUES (?,?)"
        ).map_err(|e| e.to_string())?;
        for rid in &recipe_ids {
            stmt.execute(params![friend_id, rid]).map_err(|e| e.to_string())?;
        }
    }
    {
        let mut stmt = tx.prepare(
            "INSERT OR REPLACE INTO friend_discipline_levels (friend_id, discipline, rating) VALUES (?,?,?)"
        ).map_err(|e| e.to_string())?;
        for (discipline, rating) in &discipline_levels {
            stmt.execute(params![friend_id, discipline, rating]).map_err(|e| e.to_string())?;
        }
    }
    tx.commit().map_err(|e| e.to_string())?;

    Ok(FriendSummary {
        id: friend_id, name, added_ts: now,
        last_refresh_ts: Some(now), last_refresh_ok: true,
        recipe_count: recipe_ids.len() as i64,
    })
}

#[tauri::command]
pub fn refresh_friend_key(personal: State<'_, PersonalDbState>, id: i64) -> Result<FriendSummary, String> {
    let api_key: String = {
        let conn = personal.0.lock().map_err(|e| e.to_string())?;
        conn.query_row("SELECT api_key FROM friend_keys WHERE id=?", params![id], |r| r.get(0))
            .map_err(|_| "Friend not found.".to_string())?
    };
    let now = chrono::Utc::now().timestamp_millis();

    match fetch_friend_recipe_ids(&api_key) {
        Ok(recipe_ids) => {
            // Best-effort, independent of the recipe fetch above — a friend's key can lose/
            // gain the "Characters" permission separately from "Unlocks". On failure, existing
            // friend_discipline_levels rows are left untouched (last-known-good), same
            // philosophy as the outer Err(e) branch below preserving last-known recipes.
            let discipline_levels = fetch_friend_discipline_levels(&api_key).ok();

            let mut conn = personal.0.lock().map_err(|e| e.to_string())?;
            let tx = conn.transaction().map_err(|e| e.to_string())?;
            tx.execute("DELETE FROM friend_recipes_known WHERE friend_id=?", params![id]).map_err(|e| e.to_string())?;
            {
                let mut stmt = tx.prepare(
                    "INSERT OR IGNORE INTO friend_recipes_known (friend_id, recipe_id) VALUES (?,?)"
                ).map_err(|e| e.to_string())?;
                for rid in &recipe_ids {
                    stmt.execute(params![id, rid]).map_err(|e| e.to_string())?;
                }
            }
            if let Some(levels) = &discipline_levels {
                tx.execute("DELETE FROM friend_discipline_levels WHERE friend_id=?", params![id]).map_err(|e| e.to_string())?;
                let mut stmt = tx.prepare(
                    "INSERT OR REPLACE INTO friend_discipline_levels (friend_id, discipline, rating) VALUES (?,?,?)"
                ).map_err(|e| e.to_string())?;
                for (discipline, rating) in levels {
                    stmt.execute(params![id, discipline, rating]).map_err(|e| e.to_string())?;
                }
            }
            tx.execute("UPDATE friend_keys SET last_refresh_ts=?, last_refresh_ok=1 WHERE id=?", params![now, id]).map_err(|e| e.to_string())?;
            let name: String = tx.query_row("SELECT name FROM friend_keys WHERE id=?", params![id], |r| r.get(0)).map_err(|e| e.to_string())?;
            tx.commit().map_err(|e| e.to_string())?;
            Ok(FriendSummary { id, name, added_ts: 0, last_refresh_ts: Some(now), last_refresh_ok: true, recipe_count: recipe_ids.len() as i64 })
        }
        Err(e) => {
            // Keep last-known-good recipes on failure — just flag it so Settings
            // can show a warning instead of silently losing the friend's data.
            let conn = personal.0.lock().map_err(|e| e.to_string())?;
            conn.execute("UPDATE friend_keys SET last_refresh_ts=?, last_refresh_ok=0 WHERE id=?", params![now, id]).ok();
            Err(e)
        }
    }
}

#[tauri::command]
pub fn delete_friend_key(personal: State<'_, PersonalDbState>, id: i64) -> Result<(), String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    // Explicit delete of the child rows even though the FK has ON DELETE CASCADE —
    // belt-and-suspenders in case PRAGMA foreign_keys wasn't honored on this connection.
    conn.execute("DELETE FROM friend_recipes_known WHERE friend_id=?", params![id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM friend_discipline_levels WHERE friend_id=?", params![id]).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM friend_keys WHERE id=?", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_friends(personal: State<'_, PersonalDbState>) -> Result<Vec<FriendSummary>, String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT f.id, f.name, f.added_ts, f.last_refresh_ts, f.last_refresh_ok,
                (SELECT COUNT(*) FROM friend_recipes_known WHERE friend_id = f.id)
         FROM friend_keys f ORDER BY f.added_ts ASC"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |r| Ok(FriendSummary {
        id: r.get(0)?, name: r.get(1)?, added_ts: r.get(2)?,
        last_refresh_ts: r.get(3)?, last_refresh_ok: r.get::<_, i64>(4)? != 0,
        recipe_count: r.get(5)?,
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(rows)
}

#[tauri::command]
pub fn get_friend_recipes_known(personal: State<'_, PersonalDbState>) -> Result<Vec<FriendRecipesEntry>, String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, name FROM friend_keys ORDER BY added_ts ASC").map_err(|e| e.to_string())?;
    let friends: Vec<(i64, String)> = stmt.query_map([], |r| Ok((r.get(0)?, r.get(1)?)))
        .map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();

    let mut result = Vec::new();
    for (friend_id, friend_name) in friends {
        let mut rstmt = conn.prepare("SELECT recipe_id FROM friend_recipes_known WHERE friend_id=?").map_err(|e| e.to_string())?;
        let recipe_ids: Vec<i64> = rstmt.query_map(params![friend_id], |r| r.get(0))
            .map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
        result.push(FriendRecipesEntry { friend_id, friend_name, recipe_ids });
    }
    Ok(result)
}

// Powers App.jsx's friendDisciplineEligibleMap — per-friend max crafting discipline
// ratings, same shape/pattern as get_friend_recipes_known above. A friend with no
// friend_discipline_levels rows yet (key added before "Characters" was required, or
// their key is missing that permission) simply comes back with an empty map; the
// front end treats that as "no discipline-eligible matching for this friend" rather
// than an error, so it degrades gracefully instead of blocking anything.
#[tauri::command]
pub fn get_friend_discipline_levels(personal: State<'_, PersonalDbState>) -> Result<Vec<FriendDisciplineEntry>, String> {
    let conn = personal.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, name FROM friend_keys ORDER BY added_ts ASC").map_err(|e| e.to_string())?;
    let friends: Vec<(i64, String)> = stmt.query_map([], |r| Ok((r.get(0)?, r.get(1)?)))
        .map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();

    let mut result = Vec::new();
    for (friend_id, friend_name) in friends {
        let mut rstmt = conn.prepare("SELECT discipline, rating FROM friend_discipline_levels WHERE friend_id=?").map_err(|e| e.to_string())?;
        let discipline_levels: std::collections::HashMap<String, i64> = rstmt
            .query_map(params![friend_id], |r| Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?)))
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect();
        result.push(FriendDisciplineEntry { friend_id, friend_name, discipline_levels });
    }
    Ok(result)
}
