use chickadee_store::{Catalog, ExecInfo, Op, Store, StoreInfo};
use serde_json::Value;
use tauri::{AppHandle, Manager, State};

use crate::error::IpcError;
use crate::state::AppState;

/// 프로세스당 1회만. 카탈로그 밖 SQL 은 어떤 명령으로도 실행할 수 없다 (01 §3.2).
#[tauri::command]
pub fn store_open(
    app: AppHandle,
    state: State<'_, AppState>,
    catalog: Catalog,
) -> Result<StoreInfo, IpcError> {
    let mut slot = state.store.lock().expect("state poisoned");
    if slot.is_some() {
        return Err(IpcError::new(
            "STORE_ALREADY_OPEN",
            "이미 열려 있습니다.",
            false,
        ));
    }
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| IpcError::new("FS_NOT_FOUND", e.to_string(), false))?;
    std::fs::create_dir_all(&dir)
        .map_err(|e| IpcError::new("FS_PERMISSION", e.to_string(), false))?;
    let opened = Store::open(&dir.join("chickadee.db"), catalog)?;
    let info = opened.info()?;
    *slot = Some(std::sync::Arc::new(opened));
    Ok(info)
}

/// Takes a handle and lets go of the outer lock before doing any work, so a
/// long ingest pass never blocks a read from the screen.
fn with_store<T>(
    state: &State<'_, AppState>,
    f: impl FnOnce(&Store) -> Result<T, chickadee_store::StoreError>,
) -> Result<T, IpcError> {
    let store = state.store().ok_or_else(|| {
        IpcError::new(
            "STORE_CATALOG_MISSING",
            "저장소가 열려 있지 않습니다.",
            false,
        )
    })?;
    Ok(f(&store)?)
}

#[tauri::command]
pub fn store_query(
    state: State<'_, AppState>,
    name: String,
    params: Value,
) -> Result<Vec<Value>, IpcError> {
    with_store(&state, |s| s.query(&name, &params))
}

#[tauri::command]
pub fn store_exec(
    state: State<'_, AppState>,
    name: String,
    params: Value,
) -> Result<ExecInfo, IpcError> {
    with_store(&state, |s| s.exec(&name, &params))
}

#[tauri::command]
pub fn store_batch(state: State<'_, AppState>, ops: Vec<Op>) -> Result<Vec<ExecInfo>, IpcError> {
    if ops.len() > 200 {
        return Err(IpcError::new(
            "BAD_INPUT",
            "한 배치는 200개까지입니다.",
            false,
        ));
    }
    with_store(&state, |s| s.batch(&ops))
}

#[tauri::command]
pub fn store_info(state: State<'_, AppState>) -> Result<StoreInfo, IpcError> {
    with_store(&state, chickadee_store::Store::info)
}
