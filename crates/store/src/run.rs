//! A scratch sqlite database, built and asked from statements the caller supplies.
//!
//! Separate from [`crate::Store`] on purpose. `Store` runs **named** statements from the
//! app catalogue and nothing else (01 §3.2); this runs text the learner wrote, which is
//! data, not a literal — so it may pass through, but never from a string in Rust.
//!
//! Three things make it safe to point at a person's own SQL. The database is built in
//! memory from the caller's statements, so no file on disk is opened and there is nothing
//! to write back to. A watchdog interrupts a statement that runs past its ceiling. And
//! rows come back as text with an explicit "absent" so the caller can tell an empty
//! string from an unknown value — the distinction the whole lesson turns on.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};

use rusqlite::types::ValueRef;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};

use crate::StoreError;

/// Ceilings the caller can lower but not raise.
const MAX_MS: u64 = 30_000;
const MAX_ROWS: usize = 5_000;
const POLL: Duration = Duration::from_millis(10);

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct AskSpec {
    /// Statements that build the scratch database, in order. Schema and rows both.
    pub setup: Vec<String>,
    /// Statements to run and report a table for, in order. Stops at the first failure.
    pub asks: Vec<String>,
    pub timeout_ms: u64,
    /// Rows per table. Above it the table comes back marked `truncated`.
    pub max_rows: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Table {
    pub columns: Vec<String>,
    /// `None` is an absent value — not an empty string. Telling the two apart is the
    /// point of the layer this feeds.
    pub rows: Vec<Vec<Option<String>>>,
    pub truncated: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AskOut {
    /// One per ask, in order. Shorter than `asks` when one of them failed.
    pub tables: Vec<Table>,
    /// Index into `setup` (negative) or `asks` of what failed. `None` means all ran.
    pub failed_at: Option<i64>,
    /// What the engine said. It is about the text the caller sent, so it goes back.
    pub message: Option<String>,
    pub timed_out: bool,
    pub duration_ms: u64,
}

fn text_of(value: ValueRef<'_>) -> Option<String> {
    match value {
        ValueRef::Null => None,
        ValueRef::Integer(n) => Some(n.to_string()),
        ValueRef::Real(f) => Some(f.to_string()),
        ValueRef::Text(b) => Some(String::from_utf8_lossy(b).into_owned()),
        ValueRef::Blob(b) => Some(format!("<{} bytes>", b.len())),
    }
}

fn one(conn: &Connection, sql: &str, cap: usize) -> Result<Table, rusqlite::Error> {
    let mut stmt = conn.prepare(sql)?;
    let columns: Vec<String> = stmt.column_names().into_iter().map(str::to_owned).collect();
    let width = stmt.column_count();
    let mut rows = stmt.raw_query();
    let mut out = Vec::new();
    let mut truncated = false;
    while let Some(row) = rows.next()? {
        if out.len() == cap {
            truncated = true;
            break;
        }
        let mut line = Vec::with_capacity(width);
        for i in 0..width {
            line.push(text_of(row.get_ref(i)?));
        }
        out.push(line);
    }
    Ok(Table {
        columns,
        rows: out,
        truncated,
    })
}

/// Builds the database, then runs each ask. A failure is a **result**, not an error —
/// the text came from a person and being told what is wrong with it is the lesson.
/// Only "the engine could not be started" comes back as an error.
pub fn ask(spec: &AskSpec) -> Result<AskOut, StoreError> {
    let conn = Connection::open_in_memory()?;
    let cap = spec.max_rows.clamp(1, MAX_ROWS);
    let limit = Duration::from_millis(spec.timeout_ms.clamp(1, MAX_MS));

    // The watchdog holds only the interrupt handle, so it can stop a statement that is
    // already inside the engine — a poll loop around `execute` would never get the turn.
    let handle = conn.get_interrupt_handle();
    let done = Arc::new(AtomicBool::new(false));
    let flag = Arc::clone(&done);
    let began = Instant::now();
    let watchdog = std::thread::spawn(move || {
        while !flag.load(Ordering::Relaxed) {
            if began.elapsed() >= limit {
                handle.interrupt();
                return true;
            }
            std::thread::sleep(POLL);
        }
        false
    });

    let mut out = AskOut {
        tables: Vec::with_capacity(spec.asks.len()),
        failed_at: None,
        message: None,
        timed_out: false,
        duration_ms: 0,
    };
    for (i, sql) in spec.setup.iter().enumerate() {
        if let Err(e) = conn.execute_batch(sql) {
            out.failed_at = Some(-(i64::try_from(i).unwrap_or(i64::MAX) + 1));
            out.message = Some(e.to_string());
            break;
        }
    }
    if out.failed_at.is_none() {
        for (i, sql) in spec.asks.iter().enumerate() {
            match one(&conn, sql, cap) {
                Ok(table) => out.tables.push(table),
                Err(e) => {
                    out.failed_at = Some(i64::try_from(i).unwrap_or(i64::MAX));
                    out.message = Some(e.to_string());
                    break;
                }
            }
        }
    }

    done.store(true, Ordering::Relaxed);
    out.timed_out = watchdog.join().unwrap_or(false);
    out.duration_ms = u64::try_from(began.elapsed().as_millis()).unwrap_or(u64::MAX);
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::{ask, AskSpec};

    fn spec(setup: &[&str], asks: &[&str]) -> AskSpec {
        AskSpec {
            setup: setup.iter().map(|s| (*s).to_owned()).collect(),
            asks: asks.iter().map(|s| (*s).to_owned()).collect(),
            timeout_ms: 5_000,
            max_rows: 100,
        }
    }

    const SCHEMA: &str = "create table t (id integer, name text)";
    const SEED: &str = "insert into t values (1, 'a'), (2, null), (3, 'b')";

    #[test]
    fn rows_come_back_as_text_with_absence_kept_apart() {
        let out = ask(&spec(
            &[SCHEMA, SEED],
            &["select id, name from t order by id"],
        ))
        .unwrap();
        assert_eq!(out.failed_at, None);
        let table = &out.tables[0];
        assert_eq!(table.columns, vec!["id", "name"]);
        assert_eq!(table.rows.len(), 3);
        assert_eq!(table.rows[1][1], None);
        assert_eq!(table.rows[0][1].as_deref(), Some("a"));
    }

    #[test]
    fn a_broken_ask_is_reported_not_thrown() {
        let out = ask(&spec(&[SCHEMA], &["select nope from t"])).unwrap();
        assert_eq!(out.failed_at, Some(0));
        assert!(out.message.unwrap_or_default().contains("nope"));
    }

    #[test]
    fn a_broken_setup_stops_before_any_ask() {
        let out = ask(&spec(&["create tabel t (id integer)"], &["select 1"])).unwrap();
        assert_eq!(out.failed_at, Some(-1));
        assert!(out.tables.is_empty());
    }

    #[test]
    fn rows_past_the_cap_come_back_marked() {
        let mut s = spec(&[SCHEMA, SEED], &["select id from t"]);
        s.max_rows = 2;
        let out = ask(&s).unwrap();
        assert!(out.tables[0].truncated);
        assert_eq!(out.tables[0].rows.len(), 2);
    }

    #[test]
    fn a_statement_that_will_not_end_is_stopped() {
        let mut s = spec(
            &["create table n (i integer)", "insert into n values (1)"],
            &["with recursive r(i) as (select 1 union all select i + 1 from r) select count(*) from r"],
        );
        s.timeout_ms = 200;
        let out = ask(&s).unwrap();
        assert!(out.timed_out);
        assert!(out.failed_at.is_some());
    }
}
