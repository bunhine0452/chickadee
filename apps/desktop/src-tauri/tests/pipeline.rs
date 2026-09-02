//! The ingest pass end to end (06 §1.4): a temporary repository, the real
//! catalog, the real job. What it proves is the milestone's own evidence —
//! captures land in sqlite, an incremental pass skips unchanged bytes, a cancel
//! keeps what was written, and **the repository is byte-identical afterwards**.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Instant;

use chickadee_store::{Catalog, Store};
use serde_json::json;

// The job module is private to the library; the test drives it through the same
// entry point the command does.
use chickadee_app_lib::jobs::{self, JobSpec, LangSpec, QuerySpec, Report};

const OPTIONAL_CHAINING: &str = r#"
((member_expression
   object: (_) @pick.1
   optional_chain: (optional_chain) @pick.2
   property: (_) @pick.3) @site
 (#set! form "member"))
"#;

struct Tmp(PathBuf);

impl Drop for Tmp {
    fn drop(&mut self) {
        drop(std::fs::remove_dir_all(&self.0));
    }
}

fn tmp(name: &str) -> Tmp {
    let at = std::env::temp_dir().join(format!("chickadee-pipe-{name}-{}", std::process::id()));
    drop(std::fs::remove_dir_all(&at));
    std::fs::create_dir_all(&at).expect("temp dir");
    Tmp(at)
}

fn write(root: &Path, rel: &str, text: &str) {
    let at = root.join(rel);
    std::fs::create_dir_all(at.parent().expect("parent")).expect("mkdir");
    std::fs::write(at, text).expect("write");
}

fn commit(repo: &git2::Repository, message: &str) -> git2::Oid {
    let mut index = repo.index().expect("index");
    index
        .add_all(["*"], git2::IndexAddOption::DEFAULT, None)
        .expect("add");
    index.write().expect("index write");
    let tree = repo
        .find_tree(index.write_tree().expect("write tree"))
        .expect("tree");
    let when = git2::Time::new(1_767_225_600, 0);
    let who = git2::Signature::new("fixture", "fixture@example.invalid", &when).expect("signature");
    let parent = repo
        .head()
        .ok()
        .and_then(|h| h.target())
        .and_then(|o| repo.find_commit(o).ok());
    let parents: Vec<&git2::Commit<'_>> = parent.iter().collect();
    repo.commit(Some("HEAD"), &who, &who, message, &tree, &parents)
        .expect("commit")
}

fn init(at: &Path) -> git2::Repository {
    let mut opts = git2::RepositoryInitOptions::new();
    opts.initial_head("main");
    git2::Repository::init_opts(at, &opts).expect("init")
}

/// Reads the catalog the app ships: the same `-- @name` split the TS generator
/// does, so the test runs against the SQL that is actually deployed.
fn catalog() -> Catalog {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../../packages/store-sql")
        .canonicalize()
        .expect("store-sql");
    let mut statements = BTreeMap::new();
    let mut files: Vec<PathBuf> = std::fs::read_dir(root.join("statements"))
        .expect("statements")
        .filter_map(|e| e.ok().map(|e| e.path()))
        .filter(|p| p.extension().is_some_and(|e| e == "sql"))
        .collect();
    files.sort();
    for file in files {
        let text = std::fs::read_to_string(&file).expect("read");
        for chunk in text.split("-- @name ").skip(1) {
            let (name, body) = chunk.split_once('\n').expect("name line");
            let sql: String = body
                .lines()
                .filter(|l| !l.starts_with("-- @"))
                .collect::<Vec<_>>()
                .join("\n");
            statements.insert(name.trim().to_owned(), sql.trim().to_owned());
        }
    }
    let mut migrations = Vec::new();
    let mut versions: Vec<PathBuf> = std::fs::read_dir(root.join("migrations"))
        .expect("migrations")
        .filter_map(|e| e.ok().map(|e| e.path()))
        .collect();
    versions.sort();
    for (i, file) in versions.iter().enumerate() {
        migrations.push(chickadee_store::Migration {
            version: i32::try_from(i).unwrap_or_default() + 1,
            sql: std::fs::read_to_string(file).expect("read"),
        });
    }
    Catalog {
        statements,
        migrations,
    }
}

fn spec(root: &Path, mode: &str, since: Option<String>) -> JobSpec {
    JobSpec {
        repo_id: 1,
        root_path: root.to_string_lossy().into_owned(),
        mode: mode.to_owned(),
        since_head: since,
        langs: vec![LangSpec {
            grammar: "typescript".to_owned(),
            extensions: vec!["ts".to_owned()],
            max_file_bytes: 512 * 1024,
            queries: vec![QuerySpec {
                id: "ts/optional-chaining".to_owned(),
                scm: OPTIONAL_CHAINING.to_owned(),
            }],
        }],
        max_commits: 2_000,
        max_files_per_commit: 200,
        max_files: 50_000,
        max_line_bytes: 20_000,
        exclude_globs: vec!["node_modules/**".to_owned(), "dist/**".to_owned()],
        generated_markers: vec!["@generated".to_owned(), "DO NOT EDIT".to_owned()],
    }
}

/// A repository the store needs before facts can reference it.
fn open_store(at: &Path) -> Arc<Store> {
    let store = Store::open(&at.join("chickadee.db"), catalog()).expect("store");
    store
        .exec(
            "repo.insert",
            &json!({ "rootPath": "/fixture", "name": "fixture", "fingerprint": "",
                     "addedAt": 0 }),
        )
        .expect("repo row");
    Arc::new(store)
}

/// Every tracked and untracked file, hashed. Ingest must not change this.
fn tree_hash(root: &Path) -> Vec<(String, String)> {
    let mut out = Vec::new();
    for entry in ignore::WalkBuilder::new(root)
        .hidden(false)
        .git_ignore(false)
        .build()
        .flatten()
    {
        if !entry.file_type().is_some_and(|t| t.is_file()) {
            continue;
        }
        let rel = entry
            .path()
            .strip_prefix(root)
            .expect("under root")
            .to_string_lossy()
            .into_owned();
        // `.git` is included on purpose. libgit2 reads; it does not write. If a
        // future change makes it write — a re-packed odb, a written index — this
        // is where it shows up, and "we never touch the repository" is the whole
        // promise (00 §5 M1 evidence).
        let bytes = std::fs::read(entry.path()).unwrap_or_default();
        out.push((rel, chickadee_git::hash_bytes(&bytes)));
    }
    out.sort();
    out
}

/// Runs a pass and hands back the report plus every event it emitted.
fn ingest_with_events(
    store: &Store,
    spec: &JobSpec,
    stop: &Arc<AtomicBool>,
) -> (Report, Vec<(String, serde_json::Value)>) {
    let seen: Arc<std::sync::Mutex<Vec<(String, serde_json::Value)>>> = Arc::default();
    let sink_seen = Arc::clone(&seen);
    let sink = jobs::Sink {
        emit: Box::new(move |name, payload| {
            sink_seen
                .lock()
                .expect("events poisoned")
                .push((name.to_owned(), payload));
        }),
        id: "test".to_owned(),
        stop: Arc::clone(stop),
        started: Instant::now(),
    };
    let report = jobs::run(&sink, store, spec).expect("ingest");
    let events = seen.lock().expect("events poisoned").clone();
    (report, events)
}

fn ingest(store: &Store, spec: &JobSpec, stop: &Arc<AtomicBool>) -> Report {
    ingest_with_events(store, spec, stop).0
}

fn count(store: &Store, name: &str) -> usize {
    store
        .query(name, &json!({ "repoId": 1 }))
        .expect("query")
        .len()
}

fn seed(root: &Path) -> git2::Repository {
    let raw = init(root);
    write(root, "src/a.ts", "const nick = res.user?.profile\n");
    write(root, "src/b.ts", "export const plain = 1;\n");
    commit(&raw, "first");
    raw
}

#[test]
fn a_pass_writes_files_captures_and_commits() {
    let dir = tmp("basic");
    let data = tmp("basic-db");
    seed(&dir.0);
    let store = open_store(&data.0);

    let out = ingest(
        &store,
        &spec(&dir.0, "full", None),
        &Arc::new(AtomicBool::new(false)),
    );
    assert_eq!(out.files, 2);
    assert_eq!(out.changed, 2);
    assert_eq!(out.commits, 1);
    assert!(!out.cancelled);
    // a.ts has one optional chain: one @site plus three @pick captures.
    assert_eq!(out.captures, 4);
    assert_eq!(count(&store, "facts.file_hashes"), 2);
}

#[test]
fn the_repository_is_byte_identical_afterwards() {
    let dir = tmp("readonly");
    let data = tmp("readonly-db");
    seed(&dir.0);
    let before = tree_hash(&dir.0);
    let store = open_store(&data.0);

    ingest(
        &store,
        &spec(&dir.0, "full", None),
        &Arc::new(AtomicBool::new(false)),
    );
    assert_eq!(
        before,
        tree_hash(&dir.0),
        "ingest never writes to the repository"
    );
}

#[test]
fn an_incremental_pass_skips_bytes_that_did_not_change() {
    let dir = tmp("incremental");
    let data = tmp("incremental-db");
    let raw = seed(&dir.0);
    let store = open_store(&data.0);
    let stop = Arc::new(AtomicBool::new(false));

    let first = ingest(&store, &spec(&dir.0, "full", None), &stop);
    assert_eq!(first.changed, 2);

    let head = raw
        .head()
        .ok()
        .and_then(|h| h.target())
        .map(|o| o.to_string());
    let again = ingest(&store, &spec(&dir.0, "incremental", head.clone()), &stop);
    assert_eq!(
        again.changed, 0,
        "nothing was edited, so nothing is reparsed"
    );
    assert_eq!(
        again.commits, 0,
        "and no commit is newer than the last head"
    );

    write(&dir.0, "src/b.ts", "const x = obj.deep?.value\n");
    let third = ingest(&store, &spec(&dir.0, "incremental", head), &stop);
    assert_eq!(third.changed, 1);
    assert_eq!(count(&store, "facts.file_hashes"), 2);
}

#[test]
fn a_deleted_file_is_marked_not_alive_rather_than_removed() {
    let dir = tmp("deleted");
    let data = tmp("deleted-db");
    seed(&dir.0);
    let store = open_store(&data.0);
    let stop = Arc::new(AtomicBool::new(false));

    ingest(&store, &spec(&dir.0, "full", None), &stop);
    std::fs::remove_file(dir.0.join("src/b.ts")).expect("remove");
    let out = ingest(&store, &spec(&dir.0, "full", None), &stop);
    assert_eq!(out.deleted, 1);
    assert_eq!(
        count(&store, "facts.file_hashes"),
        1,
        "the row stops being alive"
    );
}

#[test]
fn a_cancel_stops_the_pass_and_keeps_what_was_written() {
    let dir = tmp("cancel");
    let data = tmp("cancel-db");
    seed(&dir.0);
    let store = open_store(&data.0);

    let stop = Arc::new(AtomicBool::new(true));
    let out = ingest(&store, &spec(&dir.0, "full", None), &stop);
    assert!(out.cancelled);
    assert_eq!(out.files, 0, "the walk stops at the first check");
    // The run row is still closed out, so the next pass is an ordinary incremental.
    assert_eq!(count(&store, "facts.file_hashes"), 0);
    stop.store(false, Ordering::Relaxed);
    let after = ingest(&store, &spec(&dir.0, "full", None), &stop);
    assert_eq!(after.files, 2);
}

#[test]
fn hostile_and_generated_files_are_skipped_with_a_reason() {
    let dir = tmp("evil");
    let data = tmp("evil-db");
    let raw = init(&dir.0);
    write(&dir.0, "src/ok.ts", "const a = 1;\n");
    write(&dir.0, "src/gen.ts", "// @generated\nconst b = 2;\n");
    write(
        &dir.0,
        "src/long.ts",
        &format!("const c = \"{}\";\n", "x".repeat(30_000)),
    );
    write(&dir.0, "src/binary.ts", "const d = 1;\u{0}\u{0}\n");
    write(&dir.0, "node_modules/pkg/index.ts", "const e = 1;\n");
    write(&dir.0, "src/huge.ts", &"const f = 1;\n".repeat(60_000));
    commit(&raw, "first");
    let store = open_store(&data.0);

    let out = ingest(
        &store,
        &spec(&dir.0, "full", None),
        &Arc::new(AtomicBool::new(false)),
    );
    assert_eq!(out.files, 5, "node_modules never enters the walk");
    assert_eq!(out.changed, 1, "only ok.ts survives the filters");
    assert_eq!(out.warnings, 4, "generated · long-line · binary · oversize");
}

#[test]
fn a_symlink_pointing_out_of_the_tree_is_not_followed() {
    let dir = tmp("symlink");
    let data = tmp("symlink-db");
    let raw = init(&dir.0);
    write(&dir.0, "src/a.ts", "const a = 1;\n");
    commit(&raw, "first");
    let outside = tmp("symlink-outside");
    write(&outside.0, "secret.ts", "const secret = 1;\n");
    #[cfg(unix)]
    std::os::unix::fs::symlink(&outside.0, dir.0.join("src/away")).expect("symlink");
    #[cfg(not(unix))]
    return;

    let store = open_store(&data.0);
    let out = ingest(
        &store,
        &spec(&dir.0, "full", None),
        &Arc::new(AtomicBool::new(false)),
    );
    assert_eq!(
        out.files, 1,
        "only src/a.ts — the link is not walked through"
    );
}

#[test]
fn a_repository_without_commits_still_ingests_its_work_tree() {
    let dir = tmp("nocommits");
    let data = tmp("nocommits-db");
    init(&dir.0);
    write(&dir.0, "src/a.ts", "const nick = res.user?.profile\n");
    let store = open_store(&data.0);

    let out = ingest(
        &store,
        &spec(&dir.0, "full", None),
        &Arc::new(AtomicBool::new(false)),
    );
    assert_eq!(out.files, 1);
    assert_eq!(out.commits, 0);
    assert_eq!(
        out.captures, 4,
        "uncommitted work is still the user's code (03 §1.7)"
    );
}

#[test]
fn the_pass_reports_every_phase_and_no_source_line_leaks_into_an_event() {
    let dir = tmp("events");
    let data = tmp("events-db");
    let raw = init(&dir.0);
    write(&dir.0, "src/a.ts", "const secret = res.user?.profile\n");
    write(&dir.0, "src/gen.ts", "// @generated\nconst b = 2;\n");
    commit(&raw, "first");
    let store = open_store(&data.0);

    let (_, events) = ingest_with_events(
        &store,
        &spec(&dir.0, "full", None),
        &Arc::new(AtomicBool::new(false)),
    );
    let phases: Vec<String> = events
        .iter()
        .filter(|(name, _)| name == "ingest_progress")
        .filter_map(|(_, e)| e["phase"].as_str().map(str::to_owned))
        .collect();
    for phase in ["walk", "parse", "git", "write"] {
        assert!(
            phases.iter().any(|p| p == phase),
            "{phase} was never reported"
        );
    }
    assert!(events
        .iter()
        .any(|(name, e)| name == "ingest_warning" && e["reason"] == "generated"));

    // 01 §6 forbidden fields: no file content, no code, no absolute path.
    let text = serde_json::to_string(&events).expect("events");
    assert!(!text.contains("secret"), "a source line reached an event");
    assert!(
        !text.contains(&dir.0.to_string_lossy().into_owned()),
        "an absolute path leaked"
    );
    assert!(
        text.contains("src/a.ts"),
        "repository-relative paths are allowed"
    );
}

#[test]
fn declaration_files_are_excluded_but_test_files_are_not() {
    let dir = tmp("suffixes");
    let data = tmp("suffixes-db");
    let raw = init(&dir.0);
    write(&dir.0, "src/a.ts", "const a = 1;\n");
    write(&dir.0, "src/a.test.ts", "const b = 1;\n");
    write(&dir.0, "src/types.d.ts", "declare const c: number;\n");
    commit(&raw, "first");
    let store = open_store(&data.0);

    let mut only = spec(&dir.0, "full", None);
    only.exclude_globs.push("*.d.ts".to_owned());
    let out = ingest(&store, &only, &Arc::new(AtomicBool::new(false)));
    // D60: a declaration file gets no row at all; a test file is ordinary input.
    assert_eq!(out.files, 2);
    assert_eq!(out.changed, 2);
}

// ───────── IPC 덤프 (06 §1.4) ─────────
//
// `tiny` 픽스처를 읽고 Rust 가 돌려주는 것을 `fixtures/ipc/tiny/` 에 적는다. CI 가
// `git diff --exit-code` 로 비교하므로, 파일이 바뀌었다는 것은 **Rust 계약이 바뀌었다**는 뜻이다.
//
// 쿼리는 사전이 아니라 이 파일에 고정돼 있다 — 사전이 개념을 늘릴 때마다 덤프가 흔들리면
// 그것은 계약의 변화가 아니라 데이터의 변화이고, 사전 쪽은 `fixtures/golden/` 이 본다.

fn dump_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../../fixtures/ipc/tiny")
        .components()
        .collect()
}

fn write_dump(name: &str, value: &serde_json::Value) {
    let at = dump_dir();
    std::fs::create_dir_all(&at).expect("mkdir");
    let text = format!("{}\n", serde_json::to_string_pretty(value).expect("json"));
    std::fs::write(at.join(name), text).expect("write dump");
}

#[test]
fn tiny_ipc_dump_is_stable() {
    let repos = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../../fixtures/repos/tiny")
        .components()
        .collect::<PathBuf>();
    if !repos.join(".git").is_dir() {
        eprintln!("skip: bash scripts/make-fixture-repo.sh tiny 를 먼저 돌린다");
        return;
    }
    let data = tmp("dump-db");
    let store = open_store(&data.0);
    let mut only = spec(&repos, "full", None);
    only.exclude_globs.push("*.d.ts".to_owned());
    let out = ingest(&store, &only, &Arc::new(AtomicBool::new(false)));

    // 파일 사실 — 시각과 자동 증가 id 는 뺀다. 나머지는 바이트에서 나온 값이라 결정적이다.
    let mut files: Vec<serde_json::Value> = store
        .query("facts.file_hashes", &json!({ "repoId": 1 }))
        .expect("files")
        .into_iter()
        .collect();
    files.sort_by_key(|f| f["path"].as_str().unwrap_or_default().to_owned());
    write_dump("files.json", &json!(files));

    // 캡처 한 페이지 — 화면이 실제로 읽는 단위다 (01 §3.4 `derive.captures_by_file`).
    let page = store
        .query(
            "derive.captures_by_file",
            &json!({ "fileId": file_id(&store, "src/store/repo.ts") }),
        )
        .expect("captures");
    write_dump("captures.json", &json!(page));

    write_dump(
        "report.json",
        &json!({
            "files": out.files, "changed": out.changed, "captures": out.captures,
            "commits": out.commits, "deleted": out.deleted, "warnings": out.warnings,
            "cancelled": out.cancelled, "escalatedToFull": out.escalated_to_full,
        }),
    );
    assert!(out.files > 0, "픽스처에서 파일을 하나도 읽지 못했다");
}

fn file_id(store: &Store, path: &str) -> i64 {
    store
        .query("derive.files", &json!({ "repoId": 1 }))
        .expect("files")
        .into_iter()
        .find(|r| r["path"].as_str() == Some(path))
        .and_then(|r| r["id"].as_i64())
        .unwrap_or_default()
}

// ───────── 실제 사전으로 (03 §7 · M1 「끝났다는 증거」) ─────────
//
// 위의 테스트들은 쿼리 하나로 계약을 고정한다. 여기서는 **배포되는 사전 전량**을 얹어
// 실제로 몇 개의 사용처가 나오고 얼마나 걸리는지를 잰다.

/// `dictionary/ts/` 를 읽어 인제스트가 받는 것과 같은 `LangSpec` 을 만든다.
fn real_langs() -> Vec<LangSpec> {
    #[derive(serde::Deserialize)]
    struct Meta {
        extensions: BTreeMap<String, Vec<String>>,
    }
    #[derive(serde::Deserialize)]
    struct Concept {
        id: String,
        #[serde(default)]
        queries: Vec<QueryRef>,
    }
    #[derive(serde::Deserialize)]
    struct QueryRef {
        grammars: Vec<String>,
        file: String,
    }

    let dir = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../../dictionary/ts")
        .components()
        .collect::<PathBuf>();
    let meta: Meta =
        serde_yaml::from_str(&std::fs::read_to_string(dir.join("_lang.yaml")).expect("_lang.yaml"))
            .expect("meta");

    let mut by_grammar: BTreeMap<String, Vec<QuerySpec>> = BTreeMap::new();
    for id in ["_imports", "_blocks"] {
        let scm = std::fs::read_to_string(dir.join(format!("{id}.scm"))).expect("system query");
        for grammar in meta.extensions.keys() {
            by_grammar
                .entry(grammar.clone())
                .or_default()
                .push(QuerySpec {
                    id: id.to_owned(),
                    scm: scm.clone(),
                });
        }
    }
    let mut files: Vec<PathBuf> = std::fs::read_dir(&dir)
        .expect("dict dir")
        .filter_map(|e| e.ok().map(|e| e.path()))
        .filter(|p| p.extension().is_some_and(|e| e == "yaml"))
        .filter(|p| p.file_name().is_some_and(|n| n != "_lang.yaml"))
        .collect();
    files.sort();
    for file in files {
        let concept: Concept =
            serde_yaml::from_str(&std::fs::read_to_string(&file).expect("read")).expect("concept");
        for entry in &concept.queries {
            let scm = std::fs::read_to_string(dir.join(entry.file.trim_start_matches("./")))
                .expect("query file");
            for grammar in &entry.grammars {
                by_grammar
                    .entry(grammar.clone())
                    .or_default()
                    .push(QuerySpec {
                        id: concept.id.clone(),
                        scm: scm.clone(),
                    });
            }
        }
    }
    by_grammar
        .into_iter()
        .filter_map(|(grammar, queries)| {
            let extensions = meta.extensions.get(&grammar)?.clone();
            Some(LangSpec {
                grammar,
                extensions,
                max_file_bytes: 512 * 1024,
                queries,
            })
        })
        .collect()
}

fn real_spec(root: &Path) -> JobSpec {
    let mut out = spec(root, "full", None);
    out.langs = real_langs();
    out.exclude_globs.push("*.d.ts".to_owned());
    out
}

#[test]
fn the_shipped_dictionary_finds_sites_in_the_fixture() {
    let repos = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../../fixtures/repos/tiny")
        .components()
        .collect::<PathBuf>();
    if !repos.join(".git").is_dir() {
        eprintln!("skip: bash scripts/make-fixture-repo.sh tiny 를 먼저 돌린다");
        return;
    }
    let data = tmp("real-db");
    let store = open_store(&data.0);
    let started = std::time::Instant::now();
    let out = ingest(
        &store,
        &real_spec(&repos),
        &Arc::new(AtomicBool::new(false)),
    );

    println!(
        "tiny: 파일 {} · 캡처 {} · 커밋 {} · {} ms",
        out.files,
        out.captures,
        out.commits,
        started.elapsed().as_millis()
    );
    assert!(
        out.captures > 100,
        "사전 전량이 캡처를 {} 개밖에 못 냈다",
        out.captures
    );
    // 개념마다 최소 한 곳은 잡혀야 사전이 픽스처에 대해 살아 있는 것이다.
    let ids: std::collections::BTreeSet<String> = store
        .query(
            "derive.captures_by_file",
            &json!({ "fileId": file_id(&store, "src/index.ts") }),
        )
        .expect("captures")
        .into_iter()
        .filter_map(|r| r["query_id"].as_str().map(str::to_owned))
        .collect();
    assert!(
        ids.len() >= 5,
        "한 파일에서 개념 {} 종만 잡혔다: {ids:?}",
        ids.len()
    );
}

/// 실제 리포 검증 (03 구현 체크리스트 「projectox 실리포 검증」).
/// 이 리포 자신이 TypeScript 실물이다 — `CHICKADEE_REAL_REPO` 로 다른 리포를 가리킬 수 있다.
#[test]
fn a_real_repository_ingests_within_the_budget() {
    let at = std::env::var("CHICKADEE_REAL_REPO").unwrap_or_else(|_| {
        Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../..")
            .components()
            .collect::<PathBuf>()
            .to_string_lossy()
            .into_owned()
    });
    let root = Path::new(&at);
    if !root.join(".git").is_dir() {
        eprintln!("skip: {at} 는 git 리포가 아니다");
        return;
    }
    let data = tmp("real-repo-db");
    let store = open_store(&data.0);
    let started = std::time::Instant::now();
    let out = ingest(&store, &real_spec(root), &Arc::new(AtomicBool::new(false)));
    let ms = started.elapsed().as_millis();

    println!(
        "실리포: 파일 {} · 파싱 {} · 캡처 {} · 커밋 {} · 경고 {} · {ms} ms",
        out.files, out.changed, out.captures, out.commits, out.warnings
    );
    assert!(out.files > 20, "실리포에서 파일 {} 개만 읽었다", out.files);
    assert!(
        out.captures > 500,
        "실리포에서 캡처 {} 개만 냈다",
        out.captures
    );
    // 03 §7 의 예산은 10만 줄에 15s 다. 이 리포는 그보다 훨씬 작으므로 넉넉히 잡아도
    // 넘으면 무언가 잘못된 것이다.
    assert!(ms < 15_000, "{ms} ms 걸렸다 — 03 §7 예산을 넘는다");
}
