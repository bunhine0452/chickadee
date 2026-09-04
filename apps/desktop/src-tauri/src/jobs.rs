//! The ingest job (01 §3.3). Walk the work tree, hash, parse, read history,
//! write facts. It knows files, bytes, commits and captures — what a capture
//! means is decided in TS (D1).
//!
//! A statement binds a missing key as NULL, so this file names only the columns
//! it actually knows. The rest (`lang`, `dict_version`, `query_hash`, site
//! counts) are filled in by the derive layer afterwards.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::channel;
use std::sync::Arc;
use std::time::{Instant, SystemTime, UNIX_EPOCH};

use chickadee_git::{HistoryOpts, Repo};
use chickadee_parse::{Capture, Queries, Spec};
use chickadee_store::{Op, Store};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

/// One transaction per this many rows (01 §3.3-6): long enough to be fast, short
/// enough that a write from the UI never waits on the lock for more than ~20 ms.
const BATCH: usize = 500;
/// Events are capped at 10/s (01 §3.2); this is the row-count equivalent.
const TICK: u32 = 25;
/// Only the first lines decide whether a file is generated (03 §1.3).
const MARKER_BYTES: usize = 4_096;

/// Mirrors `chickadee_parse::Spec`, which is not an IPC type and so not `Deserialize`.
#[derive(Debug, Clone, Deserialize)]
pub struct QuerySpec {
    pub id: String,
    pub scm: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LangSpec {
    pub grammar: String,
    pub extensions: Vec<String>,
    pub max_file_bytes: usize,
    pub queries: Vec<QuerySpec>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JobSpec {
    pub repo_id: i64,
    pub root_path: String,
    pub mode: String,
    /// The head the last finished pass stopped at, if there was one.
    pub since_head: Option<String>,
    pub langs: Vec<LangSpec>,
    pub max_commits: usize,
    pub max_files_per_commit: usize,
    pub max_files: usize,
    pub max_line_bytes: usize,
    pub exclude_globs: Vec<String>,
    pub generated_markers: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Report {
    pub job_id: String,
    pub files: u32,
    pub changed: u32,
    pub deleted: u32,
    pub captures: u32,
    pub commits: u32,
    pub escalated_to_full: bool,
    pub elapsed_ms: u64,
    /// Left at 0 in M1 — resident memory is measured by the criterion bench.
    pub peak_rss_mb: u32,
    pub cancelled: bool,
    pub warnings: u32,
}

/// A file that survived the filters, with everything its row needs but the parse.
///
/// It holds the **path**, not the bytes. Keeping every file's contents until the
/// parse would make peak memory `files × size` — 50,000 files at the 512 KiB limit
/// is gigabytes, against a 300 MB budget (03 §7). The worker reads it again; the
/// page cache makes the second read close to free.
struct Candidate {
    rel: String,
    at: PathBuf,
    grammar: String,
    size: usize,
    hash: String,
    head_oid: Option<String>,
}

/// How a pass talks to the outside — one call per event.
pub type Emit = Box<dyn Fn(&str, Value) + Send + Sync>;

/// The event sink and the stop flag — everything a pass says to the outside.
///
/// `emit` is a closure rather than an `AppHandle` so the job does not carry the
/// runtime type through every signature, and so a test can collect the events.
pub struct Sink {
    pub emit: Emit,
    pub id: String,
    pub stop: Arc<AtomicBool>,
    pub started: Instant,
}

impl Sink {
    fn stopped(&self) -> bool {
        self.stop.load(Ordering::Relaxed)
    }

    fn ms(&self) -> u64 {
        u64::try_from(self.started.elapsed().as_millis()).unwrap_or(u64::MAX)
    }

    /// `total` is 0 while it is unknown; TS then falls back to its own estimate.
    fn step(&self, phase: &str, done: u32, total: u32, at: Option<&str>) {
        (self.emit)(
            "ingest_progress",
            json!({ "jobId": self.id, "phase": phase, "done": done, "total": total,
                    "currentRelPath": at, "elapsedMs": self.ms() }),
        );
    }

    /// Repository-relative paths only — never bytes, never an absolute path (01 §6).
    fn warn(&self, rel: &str, reason: &str, out: &mut Report) {
        out.warnings += 1;
        (self.emit)(
            "ingest_warning",
            json!({ "jobId": self.id, "relPath": rel, "reason": reason }),
        );
    }
}

/// Buffered rows, committed one transaction at a time, so a cancel keeps what is
/// already written and the next incremental pass carries on from there.
struct Writer<'a> {
    store: &'a Store,
    ops: Vec<Op>,
}

impl Writer<'_> {
    fn add(&mut self, name: &str, params: Value) -> Result<(), String> {
        self.ops.push(Op {
            name: name.to_owned(),
            params,
        });
        if self.ops.len() >= BATCH {
            self.flush()?;
        }
        Ok(())
    }

    fn flush(&mut self) -> Result<(), String> {
        if !self.ops.is_empty() {
            self.store.batch(&self.ops).map_err(|e| e.to_string())?;
            self.ops.clear();
        }
        Ok(())
    }
}

/// Runs the pass and keeps the run row around it.
pub fn run(sink: &Sink, store: &Store, spec: &JobSpec) -> Result<Report, String> {
    let repo = Repo::open(Path::new(&spec.root_path)).map_err(|e| e.to_string())?;
    let head = repo.identity().map(|i| i.1).unwrap_or_default();
    let mut out = Report {
        job_id: sink.id.clone(),
        ..Report::default()
    };
    let begin = json!({ "repoId": spec.repo_id, "startedAt": now_ms(), "mode": spec.mode,
                        "headSha": head, "appVersion": env!("CARGO_PKG_VERSION") });
    let id = store
        .exec("facts.run_start", &begin)
        .map_err(|e| e.to_string())?
        .last_id;

    let result = pass(sink, store, spec, &repo, head.as_deref(), &mut out);
    out.cancelled = sink.stopped();
    out.elapsed_ms = sink.ms();
    let status = match (result.is_ok(), out.cancelled) {
        (false, _) => "failed",
        (_, true) => "cancelled",
        _ => "done",
    };
    // Every named parameter must be present: rusqlite rejects the whole statement when one
    // is missing, and `drop()` used to hide that -- every run stayed `running` with zero
    // counts. The columns this side cannot know (sites, dictionary and generator versions)
    // are the derive layer's, and go in as null until it fills them.
    let finish = json!({
        "id": id, "finishedAt": now_ms(), "status": status,
        "filesN": out.files, "sitesN": 0, "capturesN": out.captures,
        "commitsN": out.commits, "warningsN": out.warnings,
        "peakRssMb": Value::Null, "escalatedToFull": out.escalated_to_full,
        "grammarVersionsJson": Value::Null, "queryHash": Value::Null,
        "dictVersion": Value::Null, "dictSchema": Value::Null, "genVersion": Value::Null,
        "fingerprint": Value::Null,
        "error": result.as_ref().err().map(String::as_str),
    });
    if let Err(e) = store.exec("facts.run_finish", &finish) {
        sink.warn("", &format!("run_finish: {e}"), &mut out);
    }
    result.map(|()| out)
}

fn pass(
    sink: &Sink,
    store: &Store,
    spec: &JobSpec,
    repo: &Repo,
    head: Option<&str>,
    out: &mut Report,
) -> Result<(), String> {
    let by_ext = extension_map(spec);
    let known = previous_hashes(store, spec.repo_id)?;
    let head_oids = repo.tree_oids().map_err(|e| e.to_string())?;
    let mut writer = Writer {
        store,
        ops: Vec::new(),
    };

    // ── walk ── the filters are the caller's constants, applied here (03 §1.3).
    let (mut seen, mut alive) = (Vec::new(), Vec::new());
    for entry in walker(spec, repo.root()).flatten() {
        if sink.stopped() || alive.len() >= spec.max_files {
            break;
        }
        if !entry.file_type().is_some_and(|t| t.is_file()) {
            continue;
        }
        let Some(rel) = relative(entry.path(), repo.root()) else {
            continue;
        };
        let Some(lang) = extension_of(&rel).and_then(|e| by_ext.get(&e)) else {
            continue;
        };
        alive.push(rel.clone());
        match take(spec, repo, &rel, entry.path(), lang, &head_oids, &known) {
            Ok(Some(file)) => seen.push(file),
            Ok(None) => {}
            Err(reason) => sink.warn(&rel, reason, out),
        }
        if u32::try_from(alive.len()).unwrap_or_default() % TICK == 0 {
            sink.step("walk", count(alive.len()), 0, Some(&rel));
        }
    }
    out.files = count(alive.len());
    out.changed = count(seen.len());
    sink.step("walk", out.files, out.files, None);

    // ── parse ──
    let compiled = compile_all(spec)?;
    scan_all(sink, spec, &seen, &compiled, &mut writer, out)?;

    // A file that is gone keeps its row but stops being alive — the learning
    // record still points at it (02 원장 규칙).
    for path in known.keys().filter(|p| !alive.contains(p)) {
        let row = json!({ "repoId": spec.repo_id, "path": path, "updatedAt": now_ms() });
        writer.add("facts.file_mark_deleted", row)?;
        out.deleted += 1;
    }

    // ── git ──
    history(sink, spec, repo, head, &mut writer, out)?;
    writer.flush()?;
    sink.step("write", out.captures, out.captures, None);
    Ok(())
}

/// Workers parse, this thread writes. A tree never leaves the worker that made
/// it — holding trees is what turns 100k lines into a gigabyte (03 §7).
fn scan_all(
    sink: &Sink,
    spec: &JobSpec,
    seen: &[Candidate],
    compiled: &BTreeMap<String, Queries>,
    writer: &mut Writer<'_>,
    out: &mut Report,
) -> Result<(), String> {
    let lanes = std::thread::available_parallelism()
        .map_or(1, |n| n.get() - 1)
        .clamp(1, 4);
    let chunk = seen.len().div_ceil(lanes).max(1);
    let total = count(seen.len());
    let by_ext = grammars_of(spec);
    let (tx, rx) = channel::<(&Candidate, &'static str, u32, Vec<Capture>)>();
    std::thread::scope(|scope| -> Result<(), String> {
        for files in seen.chunks(chunk) {
            let tx = tx.clone();
            let by_ext = &by_ext;
            scope.spawn(move || {
                for file in files {
                    if sink.stopped() {
                        return;
                    }
                    let Ok(bytes) = std::fs::read(&file.at) else {
                        continue;
                    };
                    // One extension can be read by more than one grammar (D159).
                    // Quality and line count come from the primary — the one written
                    // to the file row — and the rest only add captures.
                    let all = extension_of(&file.rel)
                        .and_then(|e| by_ext.get(&e))
                        .map_or(&[][..], Vec::as_slice);
                    let mut quality = "poor";
                    let mut rows = 1u32;
                    let mut caps: Vec<Capture> = Vec::new();
                    for grammar in all {
                        let Some(q) = compiled.get(grammar) else {
                            continue;
                        };
                        // The byte limit was already applied during the walk.
                        if let Ok(s) = chickadee_parse::scan(&bytes, q, usize::MAX) {
                            if *grammar == file.grammar {
                                quality = s.quality;
                                rows = s.line_count;
                            }
                            caps.extend(s.captures);
                        }
                    }
                    drop(tx.send((file, quality, rows, caps)));
                }
            });
        }
        drop(tx);
        let mut done = 0u32;
        for (file, quality, rows, caps) in rx {
            if quality == "poor" {
                sink.warn(&file.rel, "parse-poor", out);
            }
            writer.add("facts.file_upsert", file_row(spec, file, quality, rows))?;
            let at = json!({ "repoId": spec.repo_id, "path": file.rel });
            writer.add("facts.capture_delete_by_file", at)?;
            for cap in &caps {
                writer.add("facts.capture_insert", capture_row(spec, &file.rel, cap))?;
                out.captures += 1;
            }
            done += 1;
            if done % TICK == 0 || done == total {
                sink.step("parse", done, total, Some(&file.rel));
            }
        }
        Ok(())
    })
}

fn history(
    sink: &Sink,
    spec: &JobSpec,
    repo: &Repo,
    head: Option<&str>,
    writer: &mut Writer<'_>,
    out: &mut Report,
) -> Result<(), String> {
    // A previous head git no longer has means the history was rewritten, and an
    // incremental pass would read the wrong range (03 §1.6).
    let mut since = spec
        .since_head
        .as_deref()
        .filter(|_| spec.mode == "incremental");
    if let Some(old) = since {
        // The second argument is what to hide. Passing "" hides nothing, which
        // reports **every** commit reachable from the old head as dropped — on an
        // ordinary fast-forward that is the entire history.
        match repo.dropped(old, head.unwrap_or(old)) {
            Ok(gone) if !gone.is_empty() => {
                let row = json!({ "repoId": spec.repo_id, "shas": gone });
                writer.add("facts.commit_mark_unreachable", row)?;
            }
            Ok(_) => {}
            Err(_) => {
                out.escalated_to_full = true;
                since = None;
            }
        }
    }
    let opts = HistoryOpts {
        limit: spec.max_commits,
        max_files: spec.max_files_per_commit,
        since,
    };
    let mut failed = None;
    let seen = repo
        .history(opts, &mut |meta, files| {
            if sink.stopped() {
                return false;
            }
            let mut ok = writer.add("facts.commit_insert", commit_row(spec, &meta));
            for f in &files {
                let row = commit_file_row(spec, &meta.sha, f);
                ok = ok.and_then(|()| writer.add("facts.commit_file_insert", row));
            }
            if let Err(e) = ok {
                failed = Some(e);
                return false;
            }
            out.commits += 1;
            if out.commits % TICK == 0 {
                sink.step("git", out.commits, 0, None);
            }
            true
        })
        .map_err(|e| e.to_string())?;
    sink.step("git", count(seen), 0, None);
    failed.map_or(Ok(()), Err)
}

// ───────── filters ─────────

/// `Ok(Some)` to parse it, `Ok(None)` to leave the existing row alone,
/// `Err(reason)` to skip it with a warning.
fn take(
    spec: &JobSpec,
    repo: &Repo,
    rel: &str,
    at: &Path,
    lang: &LangSpec,
    head_oids: &BTreeMap<String, String>,
    known: &BTreeMap<String, Option<String>>,
) -> Result<Option<Candidate>, &'static str> {
    if repo.is_generated(rel) {
        return Err("generated");
    }
    let bytes = repo.bytes(rel, None).map_err(|_| "binary")?;
    if bytes.len() > lang.max_file_bytes {
        return Err("oversize");
    }
    if chickadee_git::looks_binary(&bytes) {
        return Err("binary");
    }
    if bytes
        .split(|b| *b == b'\n')
        .any(|l| l.len() > spec.max_line_bytes)
    {
        return Err("long-line");
    }
    let head = String::from_utf8_lossy(&bytes[..bytes.len().min(MARKER_BYTES)]).into_owned();
    let marked = |l: &str| {
        spec.generated_markers
            .iter()
            .any(|m| l.contains(m.as_str()))
    };
    if head.lines().take(5).any(marked) {
        return Err("generated");
    }
    let hash = chickadee_git::hash_bytes(&bytes);
    // Unchanged bytes mean unchanged captures (01 §3.3-3).
    if spec.mode == "incremental" && known.get(rel).is_some_and(|h| h.as_deref() == Some(&hash)) {
        return Ok(None);
    }
    let head_oid = head_oids.get(rel).cloned();
    Ok(Some(Candidate {
        rel: rel.to_owned(),
        at: at.to_path_buf(),
        grammar: lang.grammar.clone(),
        size: bytes.len(),
        hash,
        head_oid,
    }))
}

/// Walks from the canonical root, not from the path the caller typed: on macOS
/// `/var` is a symlink to `/private/var`, and the two do not strip-prefix.
fn walker(spec: &JobSpec, root: &Path) -> ignore::Walk {
    let mut over = ignore::overrides::OverrideBuilder::new(root);
    for glob in &spec.exclude_globs {
        drop(over.add(&format!("!{glob}")));
    }
    let mut build = ignore::WalkBuilder::new(root);
    // Symlinks are not followed: `evil/link -> /etc` must not show up (06 §4.1).
    build
        .follow_links(false)
        .hidden(true)
        .git_ignore(true)
        .git_global(false);
    if let Ok(rules) = over.build() {
        build.overrides(rules);
    }
    build.build()
}

fn extension_map(spec: &JobSpec) -> BTreeMap<String, &LangSpec> {
    let pairs = spec
        .langs
        .iter()
        .flat_map(|l| l.extensions.iter().map(move |e| (e, l)));
    pairs
        .map(|(e, l)| (e.trim_start_matches('.').to_ascii_lowercase(), l))
        .collect()
}

/// Every grammar that reads a given extension (D159).
///
/// `extension_map` collects into a map, so one extension keeps **one** language —
/// the row written to `file.grammar`. A MyBatis mapper needs two: XML for the
/// attributes and SQL for the statement bodies, and unlike `.vue` that cannot be
/// one grammar restricted to ranges. This one keeps them all, for captures only.
fn grammars_of(spec: &JobSpec) -> BTreeMap<String, Vec<String>> {
    let mut out: BTreeMap<String, Vec<String>> = BTreeMap::new();
    for lang in &spec.langs {
        for ext in &lang.extensions {
            let key = ext.trim_start_matches('.').to_ascii_lowercase();
            out.entry(key).or_default().push(lang.grammar.clone());
        }
    }
    out
}

fn compile_all(spec: &JobSpec) -> Result<BTreeMap<String, Queries>, String> {
    let mut out = BTreeMap::new();
    for lang in &spec.langs {
        let it = lang.queries.iter();
        let specs: Vec<Spec> = it
            .map(|q| Spec {
                id: q.id.clone(),
                scm: q.scm.clone(),
            })
            .collect();
        let done = chickadee_parse::compile(&lang.grammar, &specs).map_err(|e| e.to_string())?;
        out.insert(lang.grammar.clone(), done);
    }
    Ok(out)
}

/// The last dot segment, so `a.test.ts` is still TypeScript. `.d.ts` is taken out
/// by an exclude glob instead, which is where the rest of the skip rules live (D60).
fn extension_of(rel: &str) -> Option<String> {
    let name = rel.rsplit('/').next()?;
    let (_, ext) = name.rsplit_once('.')?;
    (!ext.is_empty()).then(|| ext.to_ascii_lowercase())
}

fn relative(at: &Path, root: &Path) -> Option<String> {
    let parts = at
        .strip_prefix(root)
        .ok()?
        .components()
        .filter_map(|c| match c {
            std::path::Component::Normal(s) => Some(s.to_string_lossy()),
            _ => None,
        });
    Some(parts.collect::<Vec<_>>().join("/"))
}

fn previous_hashes(
    store: &Store,
    repo_id: i64,
) -> Result<BTreeMap<String, Option<String>>, String> {
    let at = json!({ "repoId": repo_id });
    let rows = store
        .query("facts.file_hashes", &at)
        .map_err(|e| e.to_string())?;
    Ok(rows
        .iter()
        .filter_map(|r| {
            let path = r.get("path")?.as_str()?.to_owned();
            Some((
                path,
                r.get("content_hash")
                    .and_then(Value::as_str)
                    .map(str::to_owned),
            ))
        })
        .collect())
}

fn count(n: usize) -> u32 {
    u32::try_from(n).unwrap_or(u32::MAX)
}

// ───────── rows ─────────

fn file_row(spec: &JobSpec, file: &Candidate, quality: &str, rows: u32) -> Value {
    json!({ "repoId": spec.repo_id, "path": file.rel, "grammar": file.grammar,
            "lineCount": rows, "byteSize": file.size, "contentHash": file.hash,
            "headOid": file.head_oid, "isDirty": file.head_oid.as_deref() != Some(&file.hash),
            "parseQuality": quality, "updatedAt": now_ms() })
}

/// A capture serialises to exactly the parameter names the statement declares.
fn capture_row(spec: &JobSpec, rel: &str, cap: &Capture) -> Value {
    let mut row = serde_json::to_value(cap).unwrap_or(Value::Null);
    if let Some(o) = row.as_object_mut() {
        o.insert("repoId".to_owned(), json!(spec.repo_id));
        o.insert("path".to_owned(), json!(rel));
    }
    row
}

fn commit_row(spec: &JobSpec, meta: &chickadee_git::CommitMeta) -> Value {
    let mut row = serde_json::to_value(meta).unwrap_or(Value::Null);
    if let Some(o) = row.as_object_mut() {
        o.insert("repoId".to_owned(), json!(spec.repo_id));
        // The column is called `message` and holds the subject only (03 §1.4).
        let subject = o.remove("subject").unwrap_or(Value::Null);
        o.insert("message".to_owned(), subject);
    }
    row
}

fn commit_file_row(spec: &JobSpec, sha: &str, f: &chickadee_git::ChangedFile) -> Value {
    json!({ "repoId": spec.repo_id, "sha": sha, "path": f.path, "oldPath": f.old_path,
            "status": f.status.to_string(), "additions": f.additions, "deletions": f.deletions,
            "touchedJson": json!(f.touched).to_string() })
}

#[must_use]
pub fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| i64::try_from(d.as_millis()).unwrap_or(i64::MAX))
}
