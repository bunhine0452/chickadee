use std::sync::Mutex;

use chickadee_store::Store;

/// 프로세스 전역 상태. `Store` 는 열리기 전까지 비어 있다.
#[derive(Default)]
pub struct AppState {
    pub store: Mutex<Option<Store>>,
}
