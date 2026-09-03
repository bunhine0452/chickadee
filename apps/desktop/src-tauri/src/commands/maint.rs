//! 유지 보수 표면 — OS 비밀 저장소 · 산출 파일 쓰기 · 전부 지우기 (06 §3.5 · §6.4 · §8).
//!
//! 셋 다 **경로를 인자로 받지 않는다**. 앱 데이터 디렉터리 아래 정해진 두 칸에만 쓰고,
//! 이름은 문자 집합으로 좁힌다 — `WebView` 가 뚫렸을 때 「아무 데나 파일을 만드는 문」이
//! 열려 있지 않게 (06 §4.1 경로 탈출 · §4.3 최소 권한).
use std::path::PathBuf;

use tauri::{AppHandle, Manager, State};

use crate::error::IpcError;
use crate::state::AppState;

/// 키체인 항목의 서비스 이름. 계정 이름은 호출자가 준다 (지금은 LLM 공급자 하나).
const SERVICE: &str = "dev.chickadee.app";

/// 산출 파일이 갈 수 있는 두 칸. 그 밖의 이름은 거부한다.
const BOXES: [&str; 2] = ["exports", "logs/crash"];

pub fn data_dir(app: &AppHandle) -> Result<PathBuf, IpcError> {
    app.path()
        .app_data_dir()
        .map_err(|e| IpcError::new("FS_NOT_FOUND", e.to_string(), false))
}

fn io(e: std::io::Error) -> IpcError {
    // 메시지에 경로가 실리지 않게 종류만 남긴다 (01 §6).
    IpcError::new("FS_PERMISSION", e.kind().to_string(), false)
}

fn secret(account: &str) -> Result<keyring::Entry, IpcError> {
    keyring::Entry::new(SERVICE, account)
        .map_err(|e| IpcError::new("SECRET_STORE", e.to_string(), false))
}

/// OS 비밀 저장소에 넣는다. 값은 로그·오류 메시지 어디에도 실리지 않는다 (06 §3.5).
#[tauri::command]
pub fn secret_set(account: String, value: String) -> Result<(), IpcError> {
    secret(&account)?
        .set_password(&value)
        .map_err(|e| IpcError::new("SECRET_STORE", e.to_string(), false))
}

/// 없으면 성공으로 본다 — 「지우기」는 멱등해야 한다 (전부 지우기가 이것을 부른다).
#[tauri::command]
pub fn secret_delete(account: String) -> Result<(), IpcError> {
    match secret(&account)?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(IpcError::new("SECRET_STORE", e.to_string(), false)),
    }
}

/// 값을 꺼내지 않고 **있는지만** 답한다 — 키가 `WebView` 로 내려가지 않는다 (06 §4.3).
///
/// Secret Service 가 없는 Linux 에서는 `false` 로 답한다: 저장 자체가 안 되므로
/// 화면은 「이 컴퓨터에는 저장할 수 없습니다」를 내야 하고, 그 판단은 `secret_set`
/// 의 오류가 준다 (06 §3.5).
#[tauri::command]
pub fn secret_has(account: String) -> Result<bool, IpcError> {
    match secret(&account)?.get_password() {
        Ok(_) => Ok(true),
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(e) => Err(IpcError::new("SECRET_STORE", e.to_string(), false)),
    }
}

/// 내보내기(06 §6.4)와 크래시 리포트(06 §8)가 같이 쓰는 문 하나.
///
/// `box_` 는 `BOXES` 의 원소여야 하고 `name` 은 `[A-Za-z0-9._-]` 만 허용한다 —
/// `..` 도 `/` 도 통과하지 못한다. 돌려주는 것은 만든 파일의 **디렉터리**이고,
/// 화면은 그것을 `app_reveal` 로 연다.
#[tauri::command]
pub fn app_write_json(
    app: AppHandle,
    r#box: String,
    name: String,
    json: String,
) -> Result<String, IpcError> {
    let named = !name.is_empty()
        && name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-'));
    if !named || !BOXES.contains(&r#box.as_str()) {
        return Err(IpcError::new(
            "BAD_INPUT",
            "자리나 이름이 규칙 밖입니다.",
            false,
        ));
    }
    let dir = data_dir(&app)?.join(r#box);
    std::fs::create_dir_all(&dir).map_err(io)?;
    std::fs::write(dir.join(name), json).map_err(io)?;
    Ok(dir.to_string_lossy().into_owned())
}

/// 전부 지우기 (06 §6.4). DB · 백업 · 사전 캐시 · 로그 · 크래시 · 내보내기 순.
///
/// 먼저 열려 있는 DB 핸들을 놓는다 — Windows 는 열린 파일을 지우지 못한다. 키체인
/// 항목은 화면이 `secret_delete` 로 따로 지운다(계정 이름을 아는 쪽이 화면이다).
/// 지운 뒤 앱을 닫는 것도 화면의 몫이다 — 반쯤 지워진 DB 위에서 계속 도는 것을 막는다.
#[tauri::command]
pub fn app_wipe(app: AppHandle, state: State<'_, AppState>) -> Result<(), IpcError> {
    state.store.lock().expect("state poisoned").take();
    let dir = data_dir(&app)?;
    // 이미 없는 것은 지운 것과 같다 — 한 번 실패한 뒤 다시 눌러도 끝까지 간다.
    let ok = |e: std::io::Error| match e.kind() {
        std::io::ErrorKind::NotFound => Ok(()),
        _ => Err(io(e)),
    };
    for f in ["chickadee.db", "chickadee.db-wal", "chickadee.db-shm"] {
        std::fs::remove_file(dir.join(f)).or_else(ok)?;
    }
    for d in ["backups", "dict-cache", "logs", "exports"] {
        std::fs::remove_dir_all(dir.join(d)).or_else(ok)?;
    }
    Ok(())
}
