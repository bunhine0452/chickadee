//! Starting, stopping and asking after the one ingest job (01 §3.2).

use std::sync::atomic::Ordering;
use std::sync::Arc;
use std::time::Instant;

use serde_json::Value;
use tauri::{AppHandle, Emitter, State};

use crate::error::IpcError;
use crate::jobs::{self, JobSpec, Sink};
use crate::state::{AppState, Running};

/// One job at a time. Two passes over the same repository would race on the same
/// rows, and there is nothing to gain from a second one.
#[tauri::command]
pub fn ingest_start(
    app: AppHandle,
    state: State<'_, AppState>,
    spec: JobSpec,
) -> Result<Value, IpcError> {
    {
        let slot = state.job.lock().expect("state poisoned");
        if slot
            .as_ref()
            .is_some_and(|r| r.last.lock().is_ok_and(|l| l.is_none()))
        {
            return Err(IpcError::new("JOB_BUSY", "이미 읽는 중입니다.", false));
        }
    }
    let id = format!("job-{}", jobs::now_ms());
    let running = Running::new(&id);
    let to = app.clone();
    let sink = Sink {
        emit: Box::new(move |name, payload| drop(to.emit(name, payload))),
        id: id.clone(),
        stop: Arc::clone(&running.stop),
        started: Instant::now(),
    };
    let last = Arc::clone(&running.last);
    *state.job.lock().expect("state poisoned") = Some(running);

    let handle = app.clone();
    std::thread::spawn(move || {
        let held = tauri::Manager::state::<AppState>(&handle).store();
        let outcome = match held {
            Some(store) => jobs::run(&sink, &store, &spec),
            None => Err("저장소가 열려 있지 않습니다.".to_owned()),
        };
        match outcome {
            Ok(report) => {
                *last.lock().expect("report poisoned") = serde_json::to_value(&report).ok();
                drop(handle.emit("ingest_done", &report));
            }
            Err(message) => {
                let failed = IpcError::new("GIT_IO", message, false);
                *last.lock().expect("report poisoned") = serde_json::to_value(&failed).ok();
                drop(handle.emit("ingest_error", &failed));
            }
        }
    });
    Ok(serde_json::json!({ "jobId": id }))
}

/// Sets the flag; the pass notices it at the next file, commit or batch and stops.
/// What is already committed stays, and the next incremental run continues (03 §1.8).
#[tauri::command]
pub fn ingest_cancel(state: State<'_, AppState>, job_id: String) -> Result<(), IpcError> {
    let slot = state.job.lock().expect("state poisoned");
    let running = slot.as_ref().filter(|r| r.id == job_id);
    running.ok_or_else(|| IpcError::new("JOB_NOT_FOUND", "그 작업이 없습니다.", false))?;
    slot.as_ref()
        .expect("checked")
        .stop
        .store(true, Ordering::Relaxed);
    Ok(())
}

#[tauri::command]
pub fn ingest_status(state: State<'_, AppState>, job_id: String) -> Result<Value, IpcError> {
    let slot = state.job.lock().expect("state poisoned");
    let running = slot
        .as_ref()
        .filter(|r| r.id == job_id)
        .ok_or_else(|| IpcError::new("JOB_NOT_FOUND", "그 작업이 없습니다.", false))?;
    let last = running.last.lock().expect("report poisoned").clone();
    Ok(last.unwrap_or_else(|| serde_json::json!({ "jobId": job_id, "phase": "walk" })))
}
