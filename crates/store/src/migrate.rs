//! 이행 러너 (02 §2.1). `PRAGMA user_version` 이 스키마 번호이고, 앞으로만 간다.

use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::Connection;

use crate::{sqlite_msg, wrap, Migration, Out, StoreError};

// 백업 보관 개수 (01 §7).
const KEEP: usize = 3;

pub fn version_of(conn: &Connection) -> Out<i32> {
    conn.pragma_query_value(None, "user_version", |r| r.get(0))
        .map_err(wrap)
}

/// `existing` 은 열기 전부터 파일이 있었을 때만 준다 — 백업 여부를 가른다.
pub fn run(conn: &mut Connection, existing: Option<&Path>, list: &[Migration]) -> Out<()> {
    let mut ordered: Vec<&Migration> = list.iter().collect();
    ordered.sort_by_key(|m| m.version);
    let from = version_of(conn)?;
    let top = ordered.last().map_or(0, |m| m.version);
    if from > top {
        // 구버전이 신버전 파일을 열면 무음 손상이 난다.
        return Err(StoreError::Migration {
            from,
            to: top,
            src: "db-newer".to_owned(),
        });
    }
    let pending: Vec<&Migration> = ordered.into_iter().filter(|m| m.version > from).collect();
    if pending.is_empty() {
        return Ok(());
    }
    if let Some(db) = existing {
        back_up(conn, db, from)?;
    }
    for m in pending {
        let tx = conn.transaction().map_err(wrap)?;
        tx.execute_batch(&m.sql)
            .map_err(|e| failed(&e, from, m.version))?;
        // 파일 안에 같은 pragma 가 있어도 여기서 정본을 찍는다.
        tx.pragma_update(None, "user_version", m.version)
            .map_err(|e| failed(&e, from, m.version))?;
        tx.commit().map_err(|e| failed(&e, from, m.version))?;
    }
    Ok(())
}

fn failed(e: &rusqlite::Error, from: i32, to: i32) -> StoreError {
    let src = sqlite_msg(e);
    StoreError::Migration {
        from,
        to,
        src: if src.is_empty() {
            "unknown".to_owned()
        } else {
            src
        },
    }
}

// 적용 직전 통째로 한 벌 뜬다 (01 §7, 02 §2.1).
fn back_up(conn: &Connection, db: &Path, version: i32) -> Out<()> {
    let dir = db
        .parent()
        .unwrap_or_else(|| Path::new("."))
        .join("backups");
    std::fs::create_dir_all(&dir).map_err(|e| StoreError::Migration {
        from: version,
        to: version,
        src: format!("{:?}", e.kind()),
    })?;
    let file = dir.join(format!("chickadee-v{version}-{}.db", stamp()));
    drop(std::fs::remove_file(&file));
    let target = file.to_string_lossy().into_owned();
    conn.execute("VACUUM INTO ?1", rusqlite::params![target])
        .map_err(|e| failed(&e, version, version))?;
    prune(&dir);
    Ok(())
}

// 가장 새것 KEEP 개만 남긴다.
fn prune(dir: &Path) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    let mut kept: Vec<(Option<SystemTime>, PathBuf)> = entries
        .flatten()
        .map(|e| e.path())
        .filter(|p| p.extension().is_some_and(|x| x == "db"))
        .map(|p| (p.metadata().and_then(|m| m.modified()).ok(), p))
        .collect();
    kept.sort();
    for (_, old) in kept.iter().rev().skip(KEEP) {
        drop(std::fs::remove_file(old));
    }
}

// yyyymmddHHMM (UTC). 달력 하나 때문에 의존성을 늘리지 않는다.
fn stamp() -> String {
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| d.as_secs());
    let day = i64::try_from(secs / 86_400).unwrap_or(0);
    let rest = i64::try_from(secs % 86_400).unwrap_or(0);
    let (y, m, d) = civil(day);
    format!(
        "{y:04}{m:02}{d:02}{:02}{:02}",
        rest / 3_600,
        (rest % 3_600) / 60
    )
}

// Howard Hinnant 의 civil_from_days — 1970-01-01 기준 일수를 달력으로.
fn civil(z: i64) -> (i64, i64, i64) {
    let z = z + 719_468;
    let (era, doe) = (z.div_euclid(146_097), z.rem_euclid(146_097));
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    (
        yoe + era * 400 + i64::from(m <= 2),
        m,
        doy - (153 * mp + 2) / 5 + 1,
    )
}
