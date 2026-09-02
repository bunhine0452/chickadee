use serde::Serialize;

/// TS 로 건너가는 오류의 유일한 형태 (01 §6).
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IpcError {
    pub code: &'static str,
    pub message: String,
    pub detail: serde_json::Value,
    pub retryable: bool,
}

impl IpcError {
    pub fn new(code: &'static str, message: impl Into<String>, retryable: bool) -> Self {
        Self {
            code,
            message: message.into(),
            detail: serde_json::Value::Null,
            retryable,
        }
    }
}

impl From<chickadee_store::StoreError> for IpcError {
    fn from(e: chickadee_store::StoreError) -> Self {
        use chickadee_store::StoreError as E;
        // `Display` 는 사용자 데이터를 담지 않는다 (01 §6 로그 원칙).
        let (code, retryable) = match &e {
            E::AlreadyOpen => ("STORE_ALREADY_OPEN", false),
            E::Migration { .. } => ("STORE_MIGRATION", false),
            E::CatalogMissing(_) => ("STORE_CATALOG_MISSING", false),
            E::Busy => ("STORE_BUSY", true),
            E::Constraint(_) => ("STORE_CONSTRAINT", false),
            E::BadInput(_) => ("BAD_INPUT", false),
            // rusqlite 가 분류하지 못한 것은 손상으로 본다 — 조용히 넘기지 않는다.
            E::Corrupt(_) | E::Sqlite(_) => ("STORE_CORRUPT", false),
        };
        Self::new(code, e.to_string(), retryable)
    }
}

/// 아직 구현하지 않은 자리 (T3 — 01 §9).
pub fn not_implemented(what: &str) -> IpcError {
    IpcError::new(
        "NOT_IMPLEMENTED",
        format!("{what} 은 아직 없습니다."),
        false,
    )
}
