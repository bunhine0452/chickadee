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

impl From<chickadee_git::GitError> for IpcError {
    fn from(e: chickadee_git::GitError) -> Self {
        use chickadee_git::GitError as E;
        let code = match &e {
            E::NotARepo(_) => "GIT_NOT_REPO",
            E::Bare => "GIT_BARE",
            E::CommitNotFound(_) => "GIT_COMMIT_NOT_FOUND",
            E::BlameTimeout { .. } => "GIT_BLAME_TIMEOUT",
            E::BadPath(_) => "FS_NOT_FOUND",
            E::Lib(_) => "GIT_IO",
        };
        // No path or byte reaches the message — `Display` on these variants is
        // deliberately empty of user data (01 §6).
        Self::new(code, e.to_string(), matches!(e, E::Lib(_)))
    }
}

impl From<chickadee_parse::ParseError> for IpcError {
    fn from(e: chickadee_parse::ParseError) -> Self {
        use chickadee_parse::ParseError as E;
        let code = match &e {
            E::UnsupportedLang(_) => "PARSE_LANG_UNSUPPORTED",
            E::QueryInvalid { .. } => "PARSE_QUERY_INVALID",
            E::TooLarge { .. } => "PARSE_TOO_LARGE",
            E::Timeout { .. } => "PARSE_TIMEOUT",
            E::TooDeep { .. } => "PARSE_TOO_DEEP",
        };
        Self::new(code, e.to_string(), false)
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
