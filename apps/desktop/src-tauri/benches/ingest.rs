//! 인제스트 벤치 (03 §7 · 06 §1.6).
//!
//! 두 가지를 한 번에 한다.
//!
//! 1. **계측 실행** — `large-100k` 를 한 번 통과시키며 단계별 ms(walk·parse·git·write)와
//!    피크 RSS 를 재고, 파일 5개를 고친 뒤 증분도 한 번 잰다. 결과는 JSON 으로 나가고
//!    `scripts/bench.sh` 가 `bench/baseline.json` 과 비교한다.
//! 2. **criterion** — 같은 통과를 표본 여러 번 돌려 p50 을 낸다. 계측 실행 하나로는
//!    러너 잡음과 진짜 회귀를 못 가른다.
//!
//! 단계별 ms 는 진행 이벤트(`ingest_progress`)의 `elapsedMs` 로 쪼갠다 — 잡이 스스로
//! 말하는 시각이라 벤치가 잡 안을 들여다볼 필요가 없다. **다만 sqlite 쓰기는 500행마다
//! 끼어들므로 `write` 창은 마지막 flush 뿐이고, 배치 쓰기의 대부분은 parse·git 창 안에
//! 들어 있다.** 단계를 더 쪼개려면 잡이 이벤트를 더 내야 하는데 그것은 줄 예산 문제다.
//!
//! 사전은 배포되는 것 그대로 읽는다(`dictionary/ts`) — 통합 테스트의 `real_langs()` 와
//! 같은 방식이다. 쿼리 하나로 잰 숫자는 예산 표와 견줄 수 없다.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use chickadee_app_lib::jobs::{self, JobSpec, LangSpec, QuerySpec, Report};
use chickadee_store::{Catalog, Migration, Store};
use criterion::{BatchSize, Criterion, SamplingMode};
use serde_json::{json, Value};

/// 03 §7 의 표. 벤치는 이 숫자를 강제하지 않고 **함께 적기만** 한다 — 차단은
/// `scripts/bench.sh` 가 기준선 대비 +30 % 로 한다(06 §1.6: 공유 러너에서 절대치로
/// PR 을 막으면 벤치를 끄게 된다).
const BUDGET_FULL_MS: u64 = 15_000;
const BUDGET_PARSE_MS: u64 = 8_000;
const BUDGET_GIT_MS: u64 = 4_000;
const BUDGET_WRITE_MS: u64 = 2_000;
const BUDGET_INCREMENTAL_MS: u64 = 500;
const BUDGET_PEAK_RSS_MB: u64 = 300;

/// 증분 예산은 「커밋 1 · 파일 5」다 (03 §7).
const TOUCHED_FILES: usize = 5;

// ───────── 경로 ─────────

fn repo_root() -> PathBuf {
    let at = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..");
    at.canonicalize().unwrap_or(at)
}

/// 픽스처가 없으면 `None` — 벤치는 안내만 하고 조용히 빠진다. CI 는 만들고 부른다.
fn fixture(name: &str) -> Option<PathBuf> {
    let at = repo_root().join("fixtures/repos").join(name);
    at.join(".git").is_dir().then_some(at)
}

// ───────── 지울 수 있는 임시 데이터베이스 ─────────

struct Bed(PathBuf);

impl Bed {
    fn new(tag: &str) -> Self {
        let at = std::env::temp_dir().join(format!(
            "chickadee-bench-{tag}-{}-{}",
            std::process::id(),
            next_id()
        ));
        drop(std::fs::remove_dir_all(&at));
        std::fs::create_dir_all(&at).expect("temp dir");
        Self(at)
    }

    fn store(&self) -> Store {
        let store = Store::open(&self.0.join("chickadee.db"), catalog()).expect("store");
        store
            .exec(
                "repo.insert",
                &json!({ "rootPath": "/fixture", "name": "fixture",
                         "fingerprint": "", "addedAt": 0 }),
            )
            .expect("repo row");
        store
    }
}

impl Drop for Bed {
    fn drop(&mut self) {
        drop(std::fs::remove_dir_all(&self.0));
    }
}

fn next_id() -> u64 {
    static N: AtomicU64 = AtomicU64::new(0);
    N.fetch_add(1, Ordering::Relaxed)
}

// ───────── 카탈로그와 사전 (통합 테스트와 같은 읽기) ─────────

fn catalog() -> Catalog {
    let root = repo_root().join("packages/store-sql");
    let mut statements = BTreeMap::new();
    let mut files = sorted_files(&root.join("statements"), "sql");
    for file in files.drain(..) {
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
    let migrations = sorted_files(&root.join("migrations"), "sql")
        .iter()
        .enumerate()
        .map(|(i, file)| Migration {
            version: i32::try_from(i).unwrap_or_default() + 1,
            sql: std::fs::read_to_string(file).expect("read"),
        })
        .collect();
    Catalog {
        statements,
        migrations,
    }
}

fn sorted_files(dir: &Path, ext: &str) -> Vec<PathBuf> {
    let mut out: Vec<PathBuf> = std::fs::read_dir(dir)
        .expect("read dir")
        .filter_map(|e| e.ok().map(|e| e.path()))
        .filter(|p| p.extension().is_some_and(|e| e == ext))
        .collect();
    out.sort();
    out
}

/// `dictionary/ts/` 를 읽어 인제스트가 받는 것과 같은 `LangSpec` 을 만든다.
/// (통합 테스트 `tests/pipeline.rs` 의 `real_langs()` 와 같은 규칙 — 벤치는 테스트
/// 크레이트를 import 할 수 없어 같은 읽기를 여기에 둔다.)
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

    let dir = repo_root().join("dictionary/ts");
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
    for file in sorted_files(&dir, "yaml") {
        if file.file_name().is_some_and(|n| n == "_lang.yaml") {
            continue;
        }
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

fn spec(root: &Path, mode: &str, since: Option<String>) -> JobSpec {
    JobSpec {
        repo_id: 1,
        root_path: root.to_string_lossy().into_owned(),
        mode: mode.to_owned(),
        since_head: since,
        langs: real_langs(),
        max_commits: 2_000,
        max_files_per_commit: 200,
        max_files: 50_000,
        max_line_bytes: 20_000,
        exclude_globs: vec![
            "node_modules/**".to_owned(),
            "dist/**".to_owned(),
            "*.d.ts".to_owned(),
        ],
        generated_markers: vec!["@generated".to_owned(), "DO NOT EDIT".to_owned()],
    }
}

// ───────── 한 번 통과 ─────────

/// 한 통과가 낸 단계별 시각. 값은 「그 단계가 끝난 시각」이 아니라 **그 단계에 든 ms** 다.
#[derive(Debug, Clone, Copy, Default)]
struct Phases {
    walk: u64,
    parse: u64,
    git: u64,
    write: u64,
    total: u64,
}

fn ingest(store: &Store, at: &JobSpec) -> (Report, Phases) {
    let seen: Arc<Mutex<Vec<(String, Value)>>> = Arc::default();
    let sink_seen = Arc::clone(&seen);
    let sink = jobs::Sink {
        emit: Box::new(move |name, payload| {
            sink_seen
                .lock()
                .expect("events poisoned")
                .push((name.to_owned(), payload));
        }),
        id: "bench".to_owned(),
        stop: Arc::new(AtomicBool::new(false)),
        started: Instant::now(),
    };
    let report = jobs::run(&sink, store, at).expect("ingest");
    let events = seen.lock().expect("events poisoned").clone();
    let phases = split(&events, report.elapsed_ms);
    (report, phases)
}

/// 진행 이벤트를 단계 창으로 쪼갠다. 잡은 walk → parse → git → write 순으로만 말하므로
/// 각 단계의 마지막 `elapsedMs` 가 그 단계의 끝이다.
fn split(events: &[(String, Value)], total: u64) -> Phases {
    let end = |phase: &str| -> u64 {
        events
            .iter()
            .filter(|(name, e)| name == "ingest_progress" && e["phase"] == phase)
            .filter_map(|(_, e)| e["elapsedMs"].as_u64())
            .max()
            .unwrap_or(0)
    };
    let walk = end("walk");
    let parse = end("parse").max(walk);
    let git = end("git").max(parse);
    let write = end("write").max(git);
    Phases {
        walk,
        parse: parse - walk,
        git: git - parse,
        write: write - git,
        total,
    }
}

// ───────── 피크 RSS ─────────
//
// 리눅스는 커널이 최고치를 들고 있다 — `/proc/self/status` 의 `VmHWM` 한 줄이면 끝이고
// 표본이 아니라 참값이다. macOS 에는 그 창구가 없어 `ps -o rss=` 로 현재값을 훑는다.
// 그래서 macOS 수치는 **표본의 최대**이고, 100 ms 사이에 솟았다 꺼진 봉우리는 놓친다.
//
// 그 밖의 OS(윈도)는 **0 을 낸다** — 워크스페이스가 `unsafe_code = "forbid"` 라
// `GetProcessMemoryInfo` 를 부를 수 없고, 벤치 하나 때문에 `windows-sys` 를 의존성에
// 들이지는 않는다. 0 은 「측정 못 함」이지 「메모리를 안 썼음」이 아니다.

struct Rss {
    peak: Arc<AtomicU64>,
    stop: Arc<AtomicBool>,
    worker: Option<std::thread::JoinHandle<()>>,
}

impl Rss {
    fn start() -> Self {
        let peak = Arc::new(AtomicU64::new(0));
        let stop = Arc::new(AtomicBool::new(false));
        let worker = cfg!(target_os = "macos").then(|| {
            let (peak, stop) = (Arc::clone(&peak), Arc::clone(&stop));
            std::thread::spawn(move || {
                while !stop.load(Ordering::Relaxed) {
                    peak.fetch_max(ps_rss_kb(), Ordering::Relaxed);
                    std::thread::sleep(Duration::from_millis(100));
                }
            })
        });
        Self { peak, stop, worker }
    }

    /// MB. 0 이면 이 OS 에서는 재지 못했다는 뜻이다 (위 주석).
    fn finish(mut self) -> u64 {
        self.stop.store(true, Ordering::Relaxed);
        if let Some(worker) = self.worker.take() {
            drop(worker.join());
        }
        let kb = self.peak.load(Ordering::Relaxed).max(proc_hwm_kb());
        kb / 1024
    }
}

#[cfg(target_os = "linux")]
fn proc_hwm_kb() -> u64 {
    std::fs::read_to_string("/proc/self/status")
        .ok()
        .and_then(|text| {
            text.lines()
                .find_map(|l| l.strip_prefix("VmHWM:"))
                .and_then(|v| v.split_whitespace().next().map(str::to_owned))
        })
        .and_then(|n| n.parse().ok())
        .unwrap_or(0)
}

#[cfg(not(target_os = "linux"))]
fn proc_hwm_kb() -> u64 {
    0
}

/// `ps -o rss= -p <자기 pid>` — KB. 실패하면 0 이고 최대값 갱신에 영향이 없다.
fn ps_rss_kb() -> u64 {
    if !cfg!(target_os = "macos") {
        return 0;
    }
    std::process::Command::new("/bin/ps")
        .args(["-o", "rss=", "-p", &std::process::id().to_string()])
        .output()
        .ok()
        .and_then(|out| String::from_utf8(out.stdout).ok())
        .and_then(|text| text.trim().parse().ok())
        .unwrap_or(0)
}

// ───────── 계측 실행 ─────────

struct Record {
    files: u32,
    changed: u32,
    commits: u32,
    captures: u32,
    full: Phases,
    peak_rss_mb: u64,
    incremental: Phases,
}

/// 첫 인제스트 한 번 + 파일 5개를 고친 증분 한 번.
///
/// 고친 파일은 통과가 끝나면 **원래 바이트로 되돌린다** — 픽스처는 결정론적이어야 하고,
/// 벤치가 리포를 남겨 두면 다음 실행이 다른 것을 재게 된다.
fn profile(root: &Path) -> Record {
    let bed = Bed::new("profile");
    let store = bed.store();

    let watch = Rss::start();
    let (full, phases) = ingest(&store, &spec(root, "full", None));
    let peak_rss_mb = watch.finish();

    let touched = touch(root, TOUCHED_FILES);
    let (_, inc) = ingest(&store, &spec(root, "incremental", parent_of_head(root)));
    for (at, bytes) in touched {
        std::fs::write(at, bytes).expect("픽스처를 되돌리지 못했다");
    }

    Record {
        files: full.files,
        changed: full.changed,
        commits: full.commits,
        captures: full.captures,
        full: phases,
        peak_rss_mb,
        incremental: inc,
    }
}

/// `.ts` 파일 앞에서 `n` 개를 골라 줄 하나를 덧붙이고, 원래 바이트를 돌려준다.
fn touch(root: &Path, n: usize) -> Vec<(PathBuf, Vec<u8>)> {
    let mut out = Vec::new();
    let mut names: Vec<PathBuf> = std::fs::read_dir(root.join("src/gen"))
        .map(|dir| {
            dir.filter_map(|e| e.ok().map(|e| e.path()))
                .filter(|p| p.extension().is_some_and(|e| e == "ts"))
                .collect()
        })
        .unwrap_or_default();
    names.sort();
    for at in names.into_iter().take(n) {
        let Ok(before) = std::fs::read(&at) else {
            continue;
        };
        let mut after = before.clone();
        after.extend_from_slice(b"\nexport const BENCH_TOUCH = 1;\n");
        if std::fs::write(&at, &after).is_ok() {
            out.push((at, before));
        }
    }
    out
}

/// HEAD 의 부모. 증분 예산의 「커밋 1」을 리포를 건드리지 않고 만든다 —
/// 부모를 마지막으로 본 것으로 치면 새 커밋은 HEAD 하나뿐이다.
fn parent_of_head(root: &Path) -> Option<String> {
    let repo = git2::Repository::open(root).ok()?;
    let head = repo.head().ok()?.peel_to_commit().ok()?;
    head.parent(0).ok().map(|p| p.id().to_string())
}

// ───────── JSON ─────────

fn record_json(name: &str, r: &Record) -> Value {
    json!({
        "schema": 1,
        "fixture": { "name": name, "files": r.files, "changed": r.changed,
                     "commits": r.commits, "captures": r.captures },
        "host": { "os": std::env::consts::OS, "arch": std::env::consts::ARCH,
                  "parallelism": std::thread::available_parallelism().map_or(0, std::num::NonZero::get) },
        // scripts/bench.sh 가 보는 것은 여기뿐이다 — 이름이 바뀌면 기준선도 바뀐다.
        "metrics": {
            "fullTotalMs":   r.full.total,
            "walkMs":        r.full.walk,
            "parseMs":       r.full.parse,
            "gitMs":         r.full.git,
            "writeMs":       r.full.write,
            "incrementalMs": r.incremental.total,
            "peakRssMb":     r.peak_rss_mb,
        },
        // 03 §7 의 목표. 비교에는 쓰지 않고 사람이 읽으라고 같이 적는다.
        "budget": {
            "fullTotalMs": BUDGET_FULL_MS, "parseMs": BUDGET_PARSE_MS,
            "gitMs": BUDGET_GIT_MS, "writeMs": BUDGET_WRITE_MS,
            "incrementalMs": BUDGET_INCREMENTAL_MS, "peakRssMb": BUDGET_PEAK_RSS_MB,
        },
    })
}

/// 기본 출력은 `bench/current.json`. `CHICKADEE_BENCH_OUT` 로 옮길 수 있다 —
/// 기준선을 새로 뜰 때 `scripts/bench.sh --update` 가 쓴다.
fn write_json(value: &Value) -> PathBuf {
    let at = std::env::var("CHICKADEE_BENCH_OUT")
        .map_or_else(|_| repo_root().join("bench/current.json"), PathBuf::from);
    if let Some(dir) = at.parent() {
        drop(std::fs::create_dir_all(dir));
    }
    let text = format!("{}\n", serde_json::to_string_pretty(value).expect("json"));
    std::fs::write(&at, text).expect("벤치 결과를 쓰지 못했다");
    at
}

fn report(r: &Record, at: &Path) {
    let over = |value: u64, budget: u64| {
        if value > budget {
            "  ← 예산 초과"
        } else {
            ""
        }
    };
    println!("\n─── large-100k (03 §7) ───");
    println!(
        "  파일 {} · 파싱 {} · 커밋 {} · 캡처 {}",
        r.files, r.changed, r.commits, r.captures
    );
    println!(
        "  총 {} ms{}",
        r.full.total,
        over(r.full.total, BUDGET_FULL_MS)
    );
    println!("    walk  {:>6} ms", r.full.walk);
    println!(
        "    parse {:>6} ms{}",
        r.full.parse,
        over(r.full.parse, BUDGET_PARSE_MS)
    );
    println!(
        "    git   {:>6} ms{}",
        r.full.git,
        over(r.full.git, BUDGET_GIT_MS)
    );
    println!(
        "    write {:>6} ms (마지막 flush 만 — 배치 쓰기는 parse·git 안에 있다)",
        r.full.write
    );
    println!(
        "  증분(커밋 1 · 파일 {TOUCHED_FILES}) {} ms{}",
        r.incremental.total,
        over(r.incremental.total, BUDGET_INCREMENTAL_MS)
    );
    if r.peak_rss_mb == 0 {
        println!("  피크 RSS 측정 안 됨 (이 OS 에는 창구가 없다 — 파일 위 주석)");
    } else {
        println!(
            "  피크 RSS {} MB{}",
            r.peak_rss_mb,
            over(r.peak_rss_mb, BUDGET_PEAK_RSS_MB)
        );
    }
    println!("  → {}\n", at.display());
}

// ───────── criterion ─────────

/// 통과 하나를 표본으로 돌린다. 표본마다 데이터베이스를 새로 만든다 — 같은 것을 두 번
/// 인제스트하면 두 번째는 증분이 되어 다른 것을 재게 된다.
fn bench_full(c: &mut Criterion, name: &str, root: &Path, samples: usize, cap: Duration) {
    let mut group = c.benchmark_group("ingest");
    group
        .sample_size(samples)
        .sampling_mode(SamplingMode::Flat)
        .warm_up_time(Duration::from_millis(500))
        .measurement_time(cap);
    group.bench_function(name, |b| {
        b.iter_batched(
            || Bed::new(name),
            |bed| {
                let store = bed.store();
                ingest(&store, &spec(root, "full", None)).0
            },
            BatchSize::PerIteration,
        );
    });
    group.finish();
}

fn main() {
    let Some(large) = fixture("large-100k") else {
        println!("skip: bash scripts/make-fixture-repo.sh large-100k 를 먼저 돌린다");
        return;
    };

    // 1. 계측 — 단계별 ms · 피크 RSS · 증분. criterion 이전에 한다: criterion 이
    //    표본을 여러 번 돌리고 나면 페이지 캐시가 데워져 첫 인제스트가 아니게 된다.
    let record = profile(&large);
    let at = write_json(&record_json("large-100k", &record));
    report(&record, &at);

    // 2. criterion — p50. `cargo bench -- --sample-size 10 tiny` 처럼 걸러 부를 수 있다.
    let mut c = Criterion::default().configure_from_args();
    if let Some(tiny) = fixture("tiny") {
        bench_full(&mut c, "tiny", &tiny, 20, Duration::from_secs(20));
    }
    bench_full(&mut c, "large-100k", &large, 10, Duration::from_secs(600));
    c.final_summary();
}
