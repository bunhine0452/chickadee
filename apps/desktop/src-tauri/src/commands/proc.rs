//! One child process, started in a scratch copy of a work tree (D175).
//!
//! Rust does mechanics only — mirror the tree, drop the caller's files on top, start the
//! program, cap wall time and bytes, take the whole process group down. Which program to
//! start, what its output means and whether the answer passed are TS
//! (01 §1.1 · `packages/grading/src/runner.ts`).
//!
//! Two rules are enforced here rather than by the caller, because an argument the
//! `WebView` supplies is an argument a broken `WebView` can drop (06 §4.3): the ceilings
//! below, and the fact that the source tree is only ever read.

use std::io::Read;
use std::path::{Component, Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

use crate::error::IpcError;

/// Ceilings the caller can lower but not raise. 128 KiB per stream keeps the reply under
/// the 1 MiB limit (01 §2) even when both streams fill and lossy UTF-8 triples them.
const MAX_MS: u64 = 600_000;
const MAX_BYTES: usize = 128 * 1024;
const POLL: Duration = Duration::from_millis(25);

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcSpec {
    /// Tree to mirror from. Empty means "do not mirror" — a bare probe in an empty dir.
    pub root_path: String,
    /// Stable name of the scratch copy under the app data dir. Reused between calls so
    /// the build tool's own caches survive; a fresh directory costs minutes.
    pub work_id: String,
    /// Home-relative paths that must exist **before** the program starts. Any that do
    /// not come back in `missing` and nothing is started — the caller asks the person
    /// first. A build tool that fetches itself on first use is the case this covers, and
    /// failing closed is the only way an "ask before the network" promise holds.
    pub needs: Vec<String>,
    /// Paths to copy even when the mirror's ignore rules would drop them. The wrapper a
    /// build tool needs is often ignored by the repository itself — Flutter's template
    /// ignores `/gradlew` and `gradle-wrapper.jar` — and without them nothing starts.
    /// Which paths those are is language knowledge, so the caller names them.
    pub keep: Vec<String>,
    /// `(root-relative path, text)` written into the scratch copy before the start.
    pub files: Vec<(String, String)>,
    pub program: String,
    pub args: Vec<String>,
    /// Added to the inherited environment.
    pub env: Vec<(String, String)>,
    pub timeout_ms: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcOut {
    pub code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
    pub work_dir: String,
    /// Non-empty means the program was never started (01 §6 — a fact, not an error).
    pub missing: Vec<String>,
    pub truncated: bool,
    pub timed_out: bool,
    pub duration_ms: u64,
}

fn io(e: &std::io::Error) -> IpcError {
    // Only the kind — no path reaches the message (01 §6).
    IpcError::new("FS_PERMISSION", e.kind().to_string(), false)
}

fn bad(message: &'static str) -> IpcError {
    IpcError::new("BAD_INPUT", message, false)
}

/// Root-relative, no `..`, no root, no drive prefix.
fn under(root: &Path, rel: &str) -> Result<PathBuf, IpcError> {
    let p = Path::new(rel);
    let plain = !rel.is_empty() && p.components().all(|c| matches!(c, Component::Normal(_)));
    if plain {
        Ok(root.join(p))
    } else {
        Err(bad("경로가 작업본 밖을 가리킵니다."))
    }
}

/// The scratch copy lives under the app data dir, not `/tmp`: "wipe everything"
/// (06 §6.4) has to reach it, or a deleted install leaves gigabytes behind.
fn work_dir(app: &AppHandle, id: &str) -> Result<PathBuf, IpcError> {
    let named = !id.is_empty()
        && id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-'));
    if !named {
        return Err(bad("작업본 이름이 규칙 밖입니다."));
    }
    let dir = super::maint::data_dir(app)?.join("run").join(id);
    std::fs::create_dir_all(&dir).map_err(|e| io(&e))?;
    Ok(dir)
}

/// `fs::copy` does not carry the timestamp over, so a fresh copy is always newer than
/// its source. That is what makes "older, or a different size" a usable test.
fn stale(from: &Path, to: &Path) -> bool {
    let (Ok(a), Ok(b)) = (from.metadata(), to.metadata()) else {
        return true;
    };
    let (Ok(am), Ok(bm)) = (a.modified(), b.modified()) else {
        return true;
    };
    a.len() != b.len() || bm < am
}

/// Mirrors the source tree into the scratch copy. The source is opened read-only and
/// never written to. Hidden and ignored paths are skipped — that is what keeps `.git`,
/// `build` and `.gradle` out — and symlinks are not followed (06 §4.1).
fn mirror(src: &Path, dst: &Path) -> Result<(), IpcError> {
    let walk = ignore::WalkBuilder::new(src)
        .follow_links(false)
        .hidden(true)
        .git_ignore(true)
        .git_global(false)
        .build();
    for entry in walk.flatten() {
        let Ok(rel) = entry.path().strip_prefix(src) else {
            continue;
        };
        if rel.as_os_str().is_empty() {
            continue;
        }
        let to = dst.join(rel);
        let kind = entry.file_type();
        if kind.is_some_and(|t| t.is_dir()) {
            std::fs::create_dir_all(&to).map_err(|e| io(&e))?;
        } else if kind.is_some_and(|t| t.is_file()) && stale(entry.path(), &to) {
            if let Some(p) = to.parent() {
                std::fs::create_dir_all(p).map_err(|e| io(&e))?;
            }
            std::fs::copy(entry.path(), &to).map_err(|e| io(&e))?;
        }
    }
    Ok(())
}

/// Reading past the cap and throwing it away is deliberate: a full pipe blocks the
/// child, and a blocked child never reaches its own timeout.
fn drain<R: Read + Send + 'static>(
    mut r: R,
    cap: usize,
) -> std::thread::JoinHandle<(Vec<u8>, bool)> {
    std::thread::spawn(move || {
        let mut buf: Vec<u8> = Vec::new();
        let mut over = false;
        let mut chunk = [0u8; 8192];
        while let Ok(n) = r.read(&mut chunk) {
            if n == 0 {
                break;
            }
            let room = cap.saturating_sub(buf.len());
            buf.extend_from_slice(&chunk[..n.min(room)]);
            over = over || n > room;
        }
        (buf, over)
    })
}

/// A wrapper script is a shell that starts a JVM; killing only the shell leaves the JVM
/// running. `unsafe_code` is forbidden workspace-wide, so `killpg` is out and the
/// group signal goes through `kill(1)` instead.
#[cfg(unix)]
fn stop(child: &mut Child) {
    drop(
        Command::new("kill")
            .args(["-KILL", &format!("-{}", child.id())])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status(),
    );
    drop(child.kill());
}

#[cfg(not(unix))]
fn stop(child: &mut Child) {
    drop(child.kill());
}

fn start(spec: &ProcSpec, cwd: &Path) -> Result<ProcOut, IpcError> {
    let limit = Duration::from_millis(spec.timeout_ms.clamp(1, MAX_MS));
    // A program with more than one path component is a file inside the copy —
    // `./gradlew`. Resolving it here rather than leaving it to the child keeps the
    // meaning the same on every OS; a bare name still goes through `PATH`.
    let named = Path::new(&spec.program);
    let program = if named.is_absolute() || named.components().count() == 1 {
        named.to_path_buf()
    } else {
        cwd.join(named)
    };
    let mut cmd = Command::new(&program);
    cmd.args(&spec.args)
        .current_dir(cwd)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    for (k, v) in &spec.env {
        cmd.env(k, v);
    }
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        // Its own group, so the timeout can take the JVM down with the wrapper script.
        cmd.process_group(0);
    }

    let began = Instant::now();
    let mut child = cmd
        .spawn()
        .map_err(|e| IpcError::new("RUN_SPAWN", e.kind().to_string(), false))?;
    let out = child.stdout.take().map(|s| drain(s, MAX_BYTES));
    let err = child.stderr.take().map(|s| drain(s, MAX_BYTES));

    let mut timed_out = false;
    let code = loop {
        match child.try_wait() {
            Ok(Some(st)) => break st.code(),
            Ok(None) => {}
            Err(e) => return Err(IpcError::new("RUN_IO", e.kind().to_string(), true)),
        }
        if began.elapsed() >= limit {
            timed_out = true;
            stop(&mut child);
            drop(child.wait());
            break None;
        }
        std::thread::sleep(POLL);
    };

    let (o, oc) = out
        .map(|h| h.join().unwrap_or_default())
        .unwrap_or_default();
    let (e, ec) = err
        .map(|h| h.join().unwrap_or_default())
        .unwrap_or_default();
    Ok(ProcOut {
        code,
        stdout: String::from_utf8_lossy(&o).into_owned(),
        stderr: String::from_utf8_lossy(&e).into_owned(),
        work_dir: cwd.to_string_lossy().into_owned(),
        missing: vec![],
        truncated: oc || ec,
        timed_out,
        duration_ms: u64::try_from(began.elapsed().as_millis()).unwrap_or(u64::MAX),
    })
}

/// The whole pass in one scratch directory. `t3_run` only picks the directory; the
/// integration test drives this, the same way the pipeline test drives `jobs` (06 §1.4).
pub fn run_in(spec: &ProcSpec, work: &Path, home: &Path) -> Result<ProcOut, IpcError> {
    let mut missing = Vec::new();
    for rel in &spec.needs {
        if !under(home, rel)?.exists() {
            missing.push(rel.clone());
        }
    }
    if !missing.is_empty() {
        return Ok(ProcOut {
            code: None,
            stdout: String::new(),
            stderr: String::new(),
            work_dir: work.to_string_lossy().into_owned(),
            missing,
            truncated: false,
            timed_out: false,
            duration_ms: 0,
        });
    }
    if !spec.root_path.is_empty() {
        let root = PathBuf::from(&spec.root_path);
        if !root.is_dir() {
            return Err(IpcError::new(
                "FS_NOT_FOUND",
                "리포 경로가 없습니다.",
                false,
            ));
        }
        mirror(&root, work)?;
        for rel in &spec.keep {
            let from = under(&root, rel)?;
            let to = under(work, rel)?;
            if from.is_file() && stale(&from, &to) {
                if let Some(p) = to.parent() {
                    std::fs::create_dir_all(p).map_err(|e| io(&e))?;
                }
                std::fs::copy(&from, &to).map_err(|e| io(&e))?;
            }
        }
    }
    for (path, text) in &spec.files {
        let at = under(work, path)?;
        if let Some(p) = at.parent() {
            std::fs::create_dir_all(p).map_err(|e| io(&e))?;
        }
        std::fs::write(&at, text).map_err(|e| io(&e))?;
    }
    start(spec, work)
}

/// Runs one program in the scratch copy and reports what it wrote and how it ended
/// (D175). Blocking work goes to a pool thread — this call can hold for minutes.
#[tauri::command]
pub async fn t3_run(app: AppHandle, spec: ProcSpec) -> Result<ProcOut, IpcError> {
    tauri::async_runtime::spawn_blocking(move || {
        let work = work_dir(&app, &spec.work_id)?;
        let home = app
            .path()
            .home_dir()
            .map_err(|e| IpcError::new("FS_NOT_FOUND", e.to_string(), false))?;
        run_in(&spec, &work, &home)
    })
    .await
    .map_err(|_| IpcError::new("RUN_IO", "실행이 끝나지 않았습니다.", true))?
}
