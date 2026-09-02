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
        // `.git` churns on its own (index mtime, logs) and is not the user's code.
        if rel.starts_with(".git/") || rel == ".git" {
            continue;
        }
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
