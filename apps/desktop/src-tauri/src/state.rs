use std::sync::atomic::AtomicBool;
use std::sync::{Arc, Mutex};

use chickadee_store::Store;

/// The one ingest pass in flight. `last` is empty while it runs and holds the
/// final report once it is over, which is what `ingest_status` answers with.
pub struct Running {
    pub id: String,
    pub stop: Arc<AtomicBool>,
    pub last: Arc<Mutex<Option<serde_json::Value>>>,
}

impl Running {
    pub fn new(id: &str) -> Running {
        Running {
            id: id.to_owned(),
            stop: Arc::new(AtomicBool::new(false)),
            last: Arc::new(Mutex::new(None)),
        }
    }
}

/// Process-wide state. `Store` is empty until `store_open`.
///
/// The store is behind an `Arc` so a caller can take a handle and drop the outer
/// lock: the ingest pass runs for seconds, and the UI has to keep reading while
/// it does. `Store` does its own locking inside (one writer, four readers).
#[derive(Default)]
pub struct AppState {
    pub store: Mutex<Option<Arc<Store>>>,
    pub job: Mutex<Option<Running>>,
}

impl AppState {
    pub fn store(&self) -> Option<Arc<Store>> {
        self.store.lock().expect("state poisoned").clone()
    }
}
