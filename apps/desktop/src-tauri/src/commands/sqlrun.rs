//! One scratch database, built and asked from text the caller supplies (D175 for SQL).
//!
//! The same shape as `proc.rs`: Rust does mechanics, TS decides. What builds the
//! database, what is asked of it and whether the answer holds are all
//! `packages/grading/src/sql-runner.ts`. Nothing here knows a dialect, an exercise or a
//! pass mark, and no statement text is written in this file — the engine lives in
//! `chickadee-store` because that is where rusqlite is wrapped (01 §1.1).
//!
//! Blocking work goes to a pool thread: a person's own statement can hold for seconds.

use chickadee_store::run::{ask, AskOut, AskSpec};

use crate::error::IpcError;

#[tauri::command]
pub async fn sql_run(spec: AskSpec) -> Result<AskOut, IpcError> {
    tauri::async_runtime::spawn_blocking(move || {
        ask(&spec).map_err(|e| IpcError::new("RUN_IO", e.to_string(), true))
    })
    .await
    .map_err(|_| IpcError::new("RUN_IO", "실행이 끝나지 않았습니다.", true))?
}
