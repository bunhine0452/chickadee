use serde::Serialize;
use tauri::{AppHandle, Manager};

use crate::error::IpcError;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppPaths {
    pub data_dir: String,
    pub db_path: String,
    pub log_dir: String,
    pub dict_cache_dir: String,
    pub dict_user_dir: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppVersion {
    pub app: String,
    pub tauri: String,
    pub sqlite: String,
    pub rustc: String,
}

#[tauri::command]
pub fn app_paths(app: AppHandle) -> Result<AppPaths, IpcError> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| IpcError::new("FS_NOT_FOUND", e.to_string(), false))?;
    let s = |p: std::path::PathBuf| p.to_string_lossy().into_owned();
    Ok(AppPaths {
        db_path: s(dir.join("chickadee.db")),
        log_dir: s(dir.join("logs")),
        dict_cache_dir: s(dir.join("dict-cache")),
        dict_user_dir: s(dir.join("dict-user")),
        data_dir: s(dir),
    })
}

#[tauri::command]
pub fn app_version() -> AppVersion {
    AppVersion {
        app: env!("CARGO_PKG_VERSION").to_owned(),
        tauri: tauri::VERSION.to_owned(),
        sqlite: chickadee_store::sqlite_version(),
        rustc: option_env!("CHICKADEE_RUSTC")
            .unwrap_or("unknown")
            .to_owned(),
    }
}

/// T3 자리 — 인터페이스만 예약한다 (01 §9).
#[tauri::command]
pub fn t3_run() -> Result<(), IpcError> {
    Err(crate::error::not_implemented("T3"))
}
