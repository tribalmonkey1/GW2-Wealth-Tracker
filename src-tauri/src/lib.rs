use rusqlite::Connection;
use std::sync::Mutex;

pub mod commands;

// Personal data DB — always local (flips, daily resets, cache)
pub struct PersonalDbState(pub Mutex<Connection>);

fn get_local_data_dir() -> std::path::PathBuf {
    let data_dir = dirs::data_local_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."))
        .join("gw2-analyzer");
    std::fs::create_dir_all(&data_dir).ok();
    data_dir
}

pub fn get_personal_db_path() -> std::path::PathBuf {
    get_local_data_dir().join("personal.db")
}

fn open_personal_db(path: &std::path::Path) -> Connection {
    let conn = Connection::open(path).expect("Failed to open personal database");
    conn.execute_batch("
        PRAGMA journal_mode=WAL;
        PRAGMA synchronous=NORMAL;
        PRAGMA cache_size=-8000;
        PRAGMA temp_store=MEMORY;
        PRAGMA foreign_keys=ON;
    ").expect("Failed to set pragmas");
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS app_cache (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            ts INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS flip_pending (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER NOT NULL,
            item_name TEXT NOT NULL,
            buy_price INTEGER NOT NULL,
            qty INTEGER NOT NULL DEFAULT 1,
            target_sell_price INTEGER NOT NULL,
            buy_time INTEGER NOT NULL,
            flagged_buy_now_ts INTEGER
        );
        CREATE TABLE IF NOT EXISTS flip_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_id INTEGER NOT NULL,
            item_name TEXT NOT NULL,
            buy_price INTEGER NOT NULL,
            sell_price INTEGER NOT NULL,
            qty INTEGER NOT NULL DEFAULT 1,
            profit INTEGER NOT NULL,
            buy_time INTEGER NOT NULL,
            sell_time INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS manual_daily_resets (
            item_id INTEGER PRIMARY KEY,
            count INTEGER NOT NULL,
            reset_ts INTEGER NOT NULL
        );
        -- Friend Recipe Lookup — read-only, single-purpose. Stores a friend's GW2
        -- API key ONLY to read which recipes they know (/v2/account/recipes).
        -- We never fetch their materials, wallet, or characters — this is
        -- intentionally narrow and is NOT multi-account support. Scoring for
        -- friend-only recipe candidates always uses the LOCAL user's own materials
        -- and NAS market data; the friend's own collector/database is never queried
        -- (GW2's Trading Post is a single global market, so local price/velocity
        -- data is valid regardless of whose collector gathered it).
        CREATE TABLE IF NOT EXISTS friend_keys (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            name            TEXT NOT NULL,
            api_key         TEXT NOT NULL,
            added_ts        INTEGER NOT NULL,
            last_refresh_ts INTEGER,
            last_refresh_ok INTEGER NOT NULL DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS friend_recipes_known (
            friend_id INTEGER NOT NULL REFERENCES friend_keys(id) ON DELETE CASCADE,
            recipe_id INTEGER NOT NULL,
            PRIMARY KEY (friend_id, recipe_id)
        );
    ").expect("Failed to create personal tables");
    conn
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let personal_conn = open_personal_db(&get_personal_db_path());

    tauri::Builder::default()
        .manage(PersonalDbState(Mutex::new(personal_conn)))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            commands::save_price_snapshots,
            commands::save_velocity_snapshots,
            commands::load_price_history,
            commands::load_velocity_for_items,
            commands::load_price_history_bulk,
            commands::prune_old_data,
            commands::get_db_stats,
            commands::cache_set,
            commands::cache_get,
            commands::cache_get_bulk,
            commands::get_price_alert_data,
            commands::flip_pending_add,
            commands::flip_pending_get_all,
            commands::flip_pending_delete,
            commands::flip_history_add,
            commands::flip_history_get_all,
            commands::flip_history_delete,
            commands::manual_daily_set,
            commands::manual_daily_get_all,
            commands::import_from_browser,
            commands::reset_database,
            commands::reset_market_db_files,
            commands::restart_collector,
            commands::get_tracked_item_ids,
            commands::append_log,
            commands::get_market_db_info,
            commands::set_market_db_path,
            commands::get_market_summary,
            commands::add_friend_key,
            commands::refresh_friend_key,
            commands::delete_friend_key,
            commands::get_friends,
            commands::get_friend_recipes_known,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
