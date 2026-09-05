use std::path::PathBuf;

use chickadee_store::{Catalog, ExecInfo, Migration, Op, Store, StoreError, StoreInfo};
use serde_json::{json, Value};
use tempfile::TempDir;

const STEPS: [&str; 5] = [
    "CREATE TABLE note (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, n INTEGER, r REAL);",
    "ALTER TABLE note ADD COLUMN tag TEXT;",
    "CREATE TABLE k1 (a INTEGER);",
    "CREATE TABLE k2 (a INTEGER);",
    "CREATE TABLE k3 (a INTEGER);",
];

const STATEMENTS: [(&str, &str); 10] = [
    (
        "note.add",
        "INSERT INTO note (name, n, r) VALUES (:name, :n, :r)",
    ),
    ("note.all", "SELECT id, name, n, r FROM note ORDER BY id"),
    ("note.tagged", "SELECT id, tag FROM note ORDER BY id"),
    (
        "note.pick",
        "SELECT id, name FROM note WHERE id IN (SELECT value FROM json_each(:ids)) ORDER BY id",
    ),
    (
        "note.types",
        "SELECT NULL AS a, 7 AS b, 1.5 AS c, 'hi' AS d",
    ),
    ("note.blob", "SELECT x'00ff' AS raw"),
    ("note.flags", "SELECT :t AS t, :f AS f, :missing AS m"),
    ("note.obj", "SELECT :o AS o"),
    ("pragma.fk", "PRAGMA foreign_keys"),
    ("pragma.sync", "PRAGMA synchronous"),
];

fn catalog(upto: usize) -> Catalog {
    Catalog {
        statements: STATEMENTS
            .iter()
            .map(|(k, v)| ((*k).to_owned(), (*v).to_owned()))
            .collect(),
        migrations: STEPS
            .iter()
            .take(upto)
            .enumerate()
            .map(|(i, sql)| Migration {
                version: i32::try_from(i).unwrap() + 1,
                sql: (*sql).to_owned(),
            })
            .collect(),
    }
}

fn db_path(dir: &TempDir) -> PathBuf {
    dir.path().join("data").join("chickadee.db")
}

fn backups(dir: &TempDir) -> Vec<String> {
    let mut names: Vec<String> = std::fs::read_dir(dir.path().join("data").join("backups"))
        .into_iter()
        .flatten()
        .flatten()
        .map(|e| e.file_name().to_string_lossy().into_owned())
        .collect();
    names.sort();
    names
}

fn seed(store: &Store) {
    for (name, n) in [("alpha", 1), ("beta", 2), ("gamma", 3)] {
        store
            .exec("note.add", &json!({ "name": name, "n": n, "r": 0.5 }))
            .unwrap();
    }
}

#[test]
fn open_applies_migrations_in_order() {
    let dir = TempDir::new().unwrap();
    let store = Store::open(&db_path(&dir), catalog(2)).unwrap();
    let info = store.info().unwrap();
    assert_eq!(info.user_version, 2);
    assert!(info.wal);
    assert!(info.size_bytes > 0);
    assert!(info.path.ends_with("chickadee.db"));
    // 2번 이행이 붙인 열이 있어야 한다 — 순서대로 돌았다는 뜻.
    seed(&store);
    let rows = store.query("note.tagged", &Value::Null).unwrap();
    assert_eq!(rows[0]["tag"], Value::Null);
    // 새 파일에는 백업을 뜨지 않는다.
    assert!(backups(&dir).is_empty());
}

#[test]
fn reopen_is_a_no_op() {
    let dir = TempDir::new().unwrap();
    let first = Store::open(&db_path(&dir), catalog(2)).unwrap();
    seed(&first);
    drop(first);

    let again = Store::open(&db_path(&dir), catalog(2)).unwrap();
    assert_eq!(again.info().unwrap().user_version, 2);
    assert_eq!(again.query("note.all", &Value::Null).unwrap().len(), 3);
    // 적용할 것이 없으면 백업도 뜨지 않는다.
    assert!(backups(&dir).is_empty());
}

#[test]
fn newer_file_is_refused() {
    let dir = TempDir::new().unwrap();
    drop(Store::open(&db_path(&dir), catalog(3)).unwrap());

    let err = Store::open(&db_path(&dir), catalog(1)).unwrap_err();
    match err {
        StoreError::Migration { from, to, src } => {
            assert_eq!((from, to, src.as_str()), (3, 1, "db-newer"));
        }
        other => panic!("wrong: {other:?}"),
    }
}

#[test]
fn backups_are_taken_and_capped_at_three() {
    let dir = TempDir::new().unwrap();
    drop(Store::open(&db_path(&dir), catalog(1)).unwrap());
    assert!(backups(&dir).is_empty(), "새 파일은 백업 없음");

    for step in 2..=5 {
        drop(Store::open(&db_path(&dir), catalog(step)).unwrap());
    }
    let names = backups(&dir);
    assert_eq!(names.len(), 3, "{names:?}");
    // v1 은 밀려나고 v2·v3·v4 가 남는다.
    assert!(names.iter().all(|n| n.starts_with("chickadee-v")));
    assert!(names.iter().any(|n| n.starts_with("chickadee-v4-")));
    assert!(!names.iter().any(|n| n.starts_with("chickadee-v1-")));
    for n in &names {
        let tail = n.rsplit('-').next().unwrap();
        let stamp = tail
            .strip_suffix(".db")
            .unwrap_or_else(|| panic!("확장자가 없다: {n}"));
        assert_eq!(stamp.len(), 12, "yyyymmddHHMM 이어야 한다: {n}");
        assert!(stamp.chars().all(|c| c.is_ascii_digit()));
    }
}

#[test]
fn rows_come_back_as_json_objects() {
    let dir = TempDir::new().unwrap();
    let store = Store::open(&db_path(&dir), catalog(2)).unwrap();
    let rows = store.query("note.types", &Value::Null).unwrap();
    assert_eq!(
        rows,
        vec![json!({ "a": null, "b": 7, "c": 1.5, "d": "hi" })]
    );

    seed(&store);
    let all = store.query("note.all", &Value::Null).unwrap();
    assert_eq!(all.len(), 3);
    assert_eq!(all[1], json!({ "id": 2, "name": "beta", "n": 2, "r": 0.5 }));
}

#[test]
fn unknown_name_is_catalog_missing() {
    let dir = TempDir::new().unwrap();
    let store = Store::open(&db_path(&dir), catalog(1)).unwrap();
    for e in [
        store.query("nope.read", &Value::Null).unwrap_err(),
        store.exec("nope.write", &Value::Null).unwrap_err(),
        store
            .batch(&[Op {
                name: "nope.batch".to_owned(),
                params: Value::Null,
            }])
            .unwrap_err(),
    ] {
        match e {
            StoreError::CatalogMissing(name) => assert!(name.starts_with("nope.")),
            other => panic!("wrong: {other:?}"),
        }
    }
}

#[test]
fn batch_is_all_or_nothing() {
    let dir = TempDir::new().unwrap();
    let store = Store::open(&db_path(&dir), catalog(1)).unwrap();
    store
        .exec("note.add", &json!({ "name": "alpha", "n": 1, "r": 0.5 }))
        .unwrap();

    let ops = vec![
        Op {
            name: "note.add".to_owned(),
            params: json!({ "name": "delta", "n": 4, "r": 1.0 }),
        },
        // 유일 제약 위반 — 앞의 행까지 통째로 되돌아가야 한다.
        Op {
            name: "note.add".to_owned(),
            params: json!({ "name": "alpha", "n": 9, "r": 1.0 }),
        },
    ];
    match store.batch(&ops).unwrap_err() {
        StoreError::Constraint(msg) => assert!(msg.contains("UNIQUE"), "{msg}"),
        other => panic!("wrong: {other:?}"),
    }
    let rows = store.query("note.all", &Value::Null).unwrap();
    assert_eq!(rows.len(), 1, "되돌아가지 않았다: {rows:?}");

    let ok = store
        .batch(&[Op {
            name: "note.add".to_owned(),
            params: json!({ "name": "delta", "n": 4, "r": 1.0 }),
        }])
        .unwrap();
    assert_eq!(ok.len(), 1);
    assert_eq!(ok[0].changes, 1);
    assert_eq!(ok[0].last_id, 2);
    assert_eq!(store.query("note.all", &Value::Null).unwrap().len(), 2);
}

#[test]
fn named_params_bind_by_key() {
    let dir = TempDir::new().unwrap();
    let store = Store::open(&db_path(&dir), catalog(1)).unwrap();
    seed(&store);

    // 배열은 JSON 본문으로 넘어가 json_each 가 푼다.
    let picked = store.query("note.pick", &json!({ "ids": [1, 3] })).unwrap();
    assert_eq!(
        picked,
        vec![
            json!({ "id": 1, "name": "alpha" }),
            json!({ "id": 3, "name": "gamma" })
        ]
    );

    // 참/거짓은 0·1, 문장이 쓰지 않는 키는 무시, 없는 키는 NULL.
    let flags = store
        .query(
            "note.flags",
            &json!({ "t": true, "f": false, "unused": "x" }),
        )
        .unwrap();
    assert_eq!(flags, vec![json!({ "t": 1, "f": 0, "m": null })]);

    // 객체도 JSON 본문 그대로.
    let obj = store
        .query("note.obj", &json!({ "o": { "k": 1 } }))
        .unwrap();
    assert_eq!(obj[0]["o"], json!("{\"k\":1}"));
}

#[test]
fn bad_input_is_rejected() {
    let dir = TempDir::new().unwrap();
    let store = Store::open(&db_path(&dir), catalog(1)).unwrap();

    // 객체도 null 도 아닌 매개변수.
    match store.query("note.all", &json!([1, 2])).unwrap_err() {
        StoreError::BadInput(what) => assert_eq!(what, "params"),
        other => panic!("wrong: {other:?}"),
    }
    // 바이트 열은 JSON 으로 옮기지 않는다.
    match store.query("note.blob", &Value::Null).unwrap_err() {
        StoreError::BadInput(col) => assert_eq!(col, "raw"),
        other => panic!("wrong: {other:?}"),
    }
}

#[test]
fn every_connection_gets_the_pragmas() {
    let dir = TempDir::new().unwrap();
    let store = Store::open(&db_path(&dir), catalog(1)).unwrap();
    // query 는 읽기 연결을 쓴다 — 그쪽에도 붙어 있어야 한다.
    assert_eq!(
        store.query("pragma.fk", &Value::Null).unwrap()[0]["foreign_keys"],
        json!(1)
    );
    assert_eq!(
        store.query("pragma.sync", &Value::Null).unwrap()[0]["synchronous"],
        json!(1)
    );
    assert!(store.info().unwrap().wal);
}

#[test]
fn wire_shapes_are_camel_case() {
    let catalog: Catalog = serde_json::from_value(json!({
        "statements": { "a.b": "SELECT 1 AS one" },
        "migrations": [{ "version": 1, "sql": "CREATE TABLE t (a INTEGER);" }],
    }))
    .unwrap();
    assert_eq!(catalog.migrations[0].version, 1);

    let op: Op = serde_json::from_value(json!({ "name": "a.b", "params": { "x": 1 } })).unwrap();
    assert_eq!(op.name, "a.b");

    let dir = TempDir::new().unwrap();
    let store = Store::open(&db_path(&dir), catalog).unwrap();
    assert_eq!(
        store.query("a.b", &Value::Null).unwrap(),
        vec![json!({ "one": 1 })]
    );

    let info: StoreInfo = store.info().unwrap();
    let wire = serde_json::to_value(&info).unwrap();
    assert!(wire.get("userVersion").is_some() && wire.get("sizeBytes").is_some());
    assert!(wire.get("path").is_some() && wire.get("wal").is_some());

    let exec = ExecInfo {
        changes: 1,
        last_id: 2,
    };
    assert_eq!(
        serde_json::to_value(exec).unwrap(),
        json!({ "changes": 1, "lastId": 2 })
    );
}

#[test]
fn version_string_is_reported() {
    assert!(chickadee_store::sqlite_version().starts_with('3'));
}

/// 표를 다시 만드는 이행이 자식 행을 지우지 않는다 (D146).
///
/// SQLite 는 `DROP TABLE` 을 「모든 행을 지운다」로 다룬다. 외래키를 켜 둔 채 부모 표를
/// 재생성하면 `ON DELETE CASCADE` 가 먼저 돌아 자식 행이 조용히 사라진다 — 이 리포에서는
/// `card` 를 참조하는 표가 아홉이라 원장이 통째로 날아간다. 러너가 루프 밖에서 외래키를
/// 끄는 것이 그것을 막는 유일한 자리다(`PRAGMA foreign_keys` 는 트랜잭션 안에서 무시된다).
#[test]
fn rebuilding_a_parent_table_keeps_child_rows() {
    let steps = [
        "CREATE TABLE parent (id INTEGER PRIMARY KEY, kind TEXT NOT NULL CHECK (kind IN ('a','b')));
         CREATE TABLE kid (parent_id INTEGER NOT NULL REFERENCES parent(id) ON DELETE CASCADE);
         INSERT INTO parent (id, kind) VALUES (1, 'a');
         INSERT INTO kid (parent_id) VALUES (1);",
        // CHECK 를 넓히려면 표를 다시 만드는 수밖에 없다 — ALTER 로는 못 고친다.
        "CREATE TABLE parent_new (id INTEGER PRIMARY KEY, kind TEXT NOT NULL CHECK (kind IN ('a','b','c')));
         INSERT INTO parent_new (id, kind) SELECT id, kind FROM parent;
         DROP TABLE parent;
         ALTER TABLE parent_new RENAME TO parent;",
    ];
    let cat = Catalog {
        statements: [
            ("kid.count", "SELECT COUNT(*) AS n FROM kid"),
            (
                "parent.add",
                "INSERT INTO parent (id, kind) VALUES (9, :kind)",
            ),
        ]
        .iter()
        .map(|(k, v)| ((*k).to_owned(), (*v).to_owned()))
        .collect(),
        migrations: steps
            .iter()
            .enumerate()
            .map(|(i, sql)| Migration {
                version: i32::try_from(i).unwrap() + 1,
                sql: (*sql).to_owned(),
            })
            .collect(),
    };
    let dir = TempDir::new().unwrap();
    let store = Store::open(&db_path(&dir), cat).unwrap();

    // 자식 행이 살아 있어야 한다. 외래키를 켜 둔 채 돌리면 여기가 0 이 된다.
    let rows = store.query("kid.count", &Value::Null).unwrap();
    assert_eq!(rows[0]["n"], json!(1));

    // 넓힌 CHECK 는 실제로 넓어졌고, 밖의 값은 여전히 막힌다.
    store.exec("parent.add", &json!({ "kind": "c" })).unwrap();
    assert!(store.exec("parent.add", &json!({ "kind": "z" })).is_err());

    // 이행이 끝나면 외래키는 다시 켜져 있어야 한다.
    assert_eq!(store.info().unwrap().user_version, 2);
}
