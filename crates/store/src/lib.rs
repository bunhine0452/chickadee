#![forbid(unsafe_code)]

//! rusqlite 얇은 껍데기 (01 §2). 도메인 어휘를 모른다 — 아는 것은
//! 이름 붙은 문장, JSON 매개변수, JSON 행뿐이다.

mod migrate;
// 학습자가 쓴 SQL 을 임시 sqlite 에 돌린다 (D175 의 러너를 SQL 로). `Store` 와 달리
// 카탈로그에 없는 문장을 받지만, 파일을 안 열고 메모리에만 산다.
pub mod run;

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, PoisonError};
use std::time::Duration;

use rusqlite::types::{Value as SqlValue, ValueRef};
use rusqlite::{Connection, ErrorCode, Row, Statement};
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

// 쓰기 1 + 읽기 4, 잠금 대기 5초 (01 §1, 02 §2.1).
const READERS: usize = 4;
const BUSY: Duration = Duration::from_millis(5_000);
// PRAGMA 값은 낱말 대신 숫자로 준다 — rusqlite 가 낱말에 인용부호를 붙인다.
// foreign_keys 는 ON(1), synchronous 는 NORMAL(1).
const ON: i32 = 1;
const OFF: i32 = 0;
const NORMAL: i32 = 1;

type Out<T> = Result<T, StoreError>;

/// 앱 번들이 넘겨주는 SQL 전부. 이 밖의 SQL 은 실행할 길이 없다 (01 §3.2).
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Catalog {
    pub statements: BTreeMap<String, String>,
    #[serde(default)]
    pub migrations: Vec<Migration>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Migration {
    pub version: i32,
    pub sql: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Op {
    pub name: String,
    #[serde(default)]
    pub params: Value,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StoreInfo {
    pub user_version: i32,
    pub path: String,
    pub size_bytes: i64,
    pub wal: bool,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecInfo {
    pub changes: i64,
    pub last_id: i64,
}

/// 문구에 행 값·파일 내용·절대 경로를 담지 않는다 (01 §6 로그 원칙).
#[derive(Debug, thiserror::Error)]
pub enum StoreError {
    #[error("이미 열려 있다")]
    AlreadyOpen,
    #[error("이행 실패 {from}→{to}: {src}")]
    Migration { from: i32, to: i32, src: String },
    #[error("카탈로그에 없는 이름: {0}")]
    CatalogMissing(String),
    #[error("잠겨 있다")]
    Busy,
    #[error("제약 위반: {0}")]
    Constraint(String),
    #[error("파일이 손상됐다: {0}")]
    Corrupt(String),
    #[error("입력이 잘못됐다: {0}")]
    BadInput(String),
    #[error("sqlite 오류 {:?}", .0.sqlite_error_code())]
    Sqlite(#[from] rusqlite::Error),
}

/// 열린 데이터 파일. 쓰기 연결 1개와 읽기 연결 여러 개를 쥔다.
#[derive(Debug)]
pub struct Store {
    writer: Mutex<Connection>,
    readers: Vec<Mutex<Connection>>,
    statements: BTreeMap<String, String>,
    path: PathBuf,
}

impl Store {
    pub fn open(path: &Path, catalog: Catalog) -> Result<Store, StoreError> {
        if let Some(dir) = path.parent() {
            drop(std::fs::create_dir_all(dir));
        }
        let existed = path.is_file();
        let mut writer = connect(path)?;
        migrate::run(&mut writer, existed.then_some(path), &catalog.migrations)?;
        let readers = (0..READERS)
            .map(|_| connect(path).map(Mutex::new))
            .collect::<Result<Vec<_>, _>>()?;
        Ok(Store {
            writer: Mutex::new(writer),
            readers,
            statements: catalog.statements,
            path: path.to_path_buf(),
        })
    }

    pub fn query(&self, name: &str, params: &Value) -> Result<Vec<Value>, StoreError> {
        let sql = self.sql(name)?;
        self.with_reader(|conn| {
            let mut stmt = conn.prepare_cached(sql).map_err(wrap)?;
            bind(&mut stmt, params)?;
            let cols: Vec<String> = stmt.column_names().into_iter().map(str::to_owned).collect();
            let mut rows = stmt.raw_query();
            let mut out = Vec::new();
            while let Some(row) = rows.next().map_err(wrap)? {
                out.push(to_json(row, &cols)?);
            }
            Ok(out)
        })
    }

    pub fn exec(&self, name: &str, params: &Value) -> Result<ExecInfo, StoreError> {
        let sql = self.sql(name)?;
        let conn = self.writer.lock().unwrap_or_else(PoisonError::into_inner);
        run_one(&conn, sql, params)
    }

    /// 전부 아니면 무 — 하나의 트랜잭션 (01 §3.2).
    pub fn batch(&self, ops: &[Op]) -> Result<Vec<ExecInfo>, StoreError> {
        let mut conn = self.writer.lock().unwrap_or_else(PoisonError::into_inner);
        let tx = conn.transaction().map_err(wrap)?;
        let mut out = Vec::with_capacity(ops.len());
        for op in ops {
            out.push(run_one(&tx, self.sql(&op.name)?, &op.params)?);
        }
        tx.commit().map_err(wrap)?;
        Ok(out)
    }

    pub fn info(&self) -> Result<StoreInfo, StoreError> {
        let conn = self.writer.lock().unwrap_or_else(PoisonError::into_inner);
        let user_version = migrate::version_of(&conn)?;
        let mode: String = conn
            .pragma_query_value(None, "journal_mode", |r| r.get(0))
            .map_err(wrap)?;
        let len = std::fs::metadata(&self.path).map_or(0, |m| m.len());
        Ok(StoreInfo {
            user_version,
            path: self.path.to_string_lossy().into_owned(),
            size_bytes: i64::try_from(len).unwrap_or(i64::MAX),
            wal: mode.eq_ignore_ascii_case("wal"),
        })
    }

    fn sql(&self, name: &str) -> Out<&str> {
        let s = self.statements.get(name).map(String::as_str);
        s.ok_or_else(|| StoreError::CatalogMissing(name.to_owned()))
    }

    // 비어 있는 읽기 연결부터. 전부 바쁘면 첫 번째를 기다린다.
    fn with_reader<T>(&self, f: impl FnOnce(&Connection) -> Out<T>) -> Out<T> {
        for slot in &self.readers {
            if let Ok(conn) = slot.try_lock() {
                return f(&conn);
            }
        }
        let conn = self.readers[0]
            .lock()
            .unwrap_or_else(PoisonError::into_inner);
        f(&conn)
    }
}

#[must_use]
pub fn sqlite_version() -> String {
    rusqlite::version().to_owned()
}

fn connect(path: &Path) -> Out<Connection> {
    let conn = Connection::open(path).map_err(wrap)?;
    conn.busy_timeout(BUSY).map_err(wrap)?;
    conn.pragma_update_and_check(None, "journal_mode", "WAL", |_| Ok(()))
        .map_err(wrap)?;
    conn.pragma_update(None, "foreign_keys", ON).map_err(wrap)?;
    conn.pragma_update(None, "synchronous", NORMAL)
        .map_err(wrap)?;
    Ok(conn)
}

fn run_one(conn: &Connection, sql: &str, params: &Value) -> Out<ExecInfo> {
    let mut stmt = conn.prepare_cached(sql).map_err(wrap)?;
    bind(&mut stmt, params)?;
    let changes = stmt.raw_execute().map_err(wrap)?;
    Ok(ExecInfo {
        changes: i64::try_from(changes).unwrap_or_default(),
        last_id: conn.last_insert_rowid(),
    })
}

// 문장이 실제로 선언한 이름만 묶는다 — 남는 키는 조용히 버린다.
fn bind(stmt: &mut Statement<'_>, params: &Value) -> Out<()> {
    let empty = Map::new();
    let obj = match params {
        Value::Object(m) => m,
        Value::Null => &empty,
        _ => return Err(StoreError::BadInput("params".to_owned())),
    };
    let wanted: Vec<(usize, String)> = (1..=stmt.parameter_count())
        .filter_map(|i| stmt.parameter_name(i).map(|n| (i, n.to_owned())))
        .collect();
    for (i, name) in wanted {
        let cell = to_sql(obj.get(&name[1..]).unwrap_or(&Value::Null))?;
        stmt.raw_bind_parameter(i, cell).map_err(wrap)?;
    }
    Ok(())
}

// 배열·객체는 JSON 본문 그대로 — 문장이 json_each 로 풀어 쓴다.
fn to_sql(v: &Value) -> Out<SqlValue> {
    Ok(match v {
        Value::Null => SqlValue::Null,
        Value::Bool(b) => SqlValue::Integer(i64::from(*b)),
        Value::Number(n) => match (n.as_i64(), n.as_f64()) {
            (Some(i), _) => SqlValue::Integer(i),
            (_, Some(f)) => SqlValue::Real(f),
            _ => return Err(StoreError::BadInput("number".to_owned())),
        },
        Value::String(s) => SqlValue::Text(s.clone()),
        other => SqlValue::Text(other.to_string()),
    })
}

fn to_json(row: &Row<'_>, cols: &[String]) -> Out<Value> {
    let mut obj = Map::with_capacity(cols.len());
    for (i, name) in cols.iter().enumerate() {
        let cell = match row.get_ref(i).map_err(wrap)? {
            ValueRef::Null => Value::Null,
            ValueRef::Integer(n) => Value::from(n),
            ValueRef::Real(f) => serde_json::Number::from_f64(f).map_or(Value::Null, Value::Number),
            ValueRef::Text(t) => Value::String(String::from_utf8_lossy(t).into_owned()),
            // 바이트 열은 뽑지 않는다 — 뽑았다면 카탈로그 쪽 버그다.
            ValueRef::Blob(_) => return Err(StoreError::BadInput(name.clone())),
        };
        obj.insert(name.clone(), cell);
    }
    Ok(Value::Object(obj))
}

fn wrap(e: rusqlite::Error) -> StoreError {
    let msg = sqlite_msg(&e);
    match e.sqlite_error_code() {
        Some(ErrorCode::DatabaseBusy | ErrorCode::DatabaseLocked) => StoreError::Busy,
        Some(ErrorCode::ConstraintViolation) => StoreError::Constraint(msg),
        Some(ErrorCode::DatabaseCorrupt | ErrorCode::NotADatabase) => StoreError::Corrupt(msg),
        _ => StoreError::Sqlite(e),
    }
}

// sqlite 가 붙이는 짧은 설명 — 표·열·토큰 이름만 담긴다.
fn sqlite_msg(e: &rusqlite::Error) -> String {
    match e {
        rusqlite::Error::SqliteFailure(_, Some(m)) => m.clone(),
        rusqlite::Error::SqlInputError { msg, .. } => msg.clone(),
        _ => String::new(),
    }
}
