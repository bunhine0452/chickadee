//! Short programs, each handed one text on standard input (D186 ⑧ · D187 ①).
//!
//! The same division as `proc.rs` and `sqlrun.rs`: Rust starts a process and reports what
//! came out; which program to start and whether the answer is right are TS
//! (`packages/grading/src/stdin-runner.ts`). Nothing here knows a language.
//!
//! Three things differ from `proc.rs`, and each difference is a fact about this layer.
//!
//! ① **Many starts, one call.** A small problem has three to five cases and a language may
//!    need a compile first, so a round trip per case would be six. The caller sends the
//!    steps in order and gets one reply.
//! ② **The scratch directory is thrown away.** `proc.rs` keeps its copy so the build
//!    tool's cache survives; here the whole input is a handful of files the caller wrote,
//!    so the directory is created and removed inside this call. It still lives under the
//!    app data dir rather than `/tmp` — "wipe everything" (06 §6.4) has to reach whatever
//!    a crash leaves behind.
//! ③ **A program that will not start is not an error.** `proc.rs` raises `RUN_SPAWN`
//!    because a repository that has a Gradle wrapper is expected to run it. Here the
//!    missing program *is* the answer to "can this computer run this language", so it
//!    comes back as `spawn_failed` and the screen says which toolchain is absent
//!    (D175 ⑤ · D186 ④).
//!
//! Nothing is downloaded, so the consent gate of D175 ④ has nothing to ask about.

use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use super::proc::{drain, io, stop, under};
use crate::error::IpcError;

/// Ceilings the caller can lower but not raise. Five seconds is two orders of magnitude
/// under the 600 s of `proc.rs` for the same reason the SQL runner is: there is no build
/// here. A five-line program that has not finished in five seconds is not slow, it is
/// looping, and five seconds catches every loop.
const MAX_MS: u64 = 5_000;
/// Per stream, per step. Sixteen steps that each fill both streams stay under the 1 MiB
/// reply limit (01 §2) even after lossy UTF-8 triples them.
const MAX_BYTES: usize = 16 * 1024;
const MAX_STEPS: usize = 16;
/// Two milliseconds, not the 25 of `proc.rs`. A Python start is 16 ms measured, so a
/// 25 ms poll would report double what it took.
const POLL: Duration = Duration::from_millis(2);

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StepSpec {
    /// A bare name goes through `PATH`; anything with a separator is refused, because a
    /// path here would name a program outside the scratch directory.
    pub program: String,
    pub args: Vec<String>,
    /// Handed to the program on standard input, then the pipe is closed so its read
    /// reaches the end of the input. Empty means "nothing to read".
    pub feed: String,
    /// If this step does not exit 0, the steps after it are not started. The caller sets
    /// it on a compile step: once compiling failed there is nothing left to run.
    pub must_pass: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StdinSpec {
    /// `(relative path, text)` written into the scratch directory before the first step.
    pub files: Vec<(String, String)>,
    pub steps: Vec<StepSpec>,
    /// Added to the inherited environment.
    pub env: Vec<(String, String)>,
    /// Per step, not for the whole call.
    pub timeout_ms: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StepOut {
    /// `null` when a signal ended it — a timeout is that case.
    pub code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
    pub truncated: bool,
    pub timed_out: bool,
    pub duration_ms: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StdinOut {
    /// One per step that was started, in order. Shorter than `steps` when a step timed
    /// out, failed a `mustPass`, or could not start.
    pub steps: Vec<StepOut>,
    /// The step that could not be started at all. A fact about this computer, not an
    /// error — usually "the language is not installed".
    pub spawn_failed: Option<usize>,
}

fn bad(message: &'static str) -> IpcError {
    IpcError::new("BAD_INPUT", message, false)
}

/// A counter so two calls in the same millisecond do not land in the same directory.
static NEXT: AtomicU64 = AtomicU64::new(0);

/// Removes itself. A panic between the first write and the last step must not leave the
/// files behind — they are the person's own code.
struct Scratch(PathBuf);

impl Drop for Scratch {
    fn drop(&mut self) {
        drop(std::fs::remove_dir_all(&self.0));
    }
}

fn scratch(app: &AppHandle) -> Result<Scratch, IpcError> {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| d.as_nanos());
    let n = NEXT.fetch_add(1, Ordering::Relaxed);
    let dir = super::maint::data_dir(app)?
        .join("run")
        .join("stdin")
        .join(format!("{nanos:x}-{n:x}"));
    std::fs::create_dir_all(&dir).map_err(|e| io(&e))?;
    Ok(Scratch(dir))
}

/// One start. `Ok(None)` is "the program is not on this computer" — see ③ in the header.
fn one(
    step: &StepSpec,
    cwd: &Path,
    limit: Duration,
    env: &[(String, String)],
) -> Result<Option<StepOut>, IpcError> {
    if step.program.contains('/') || step.program.contains('\\') {
        return Err(bad("실행할 프로그램은 이름 하나여야 합니다."));
    }
    let mut cmd = Command::new(&step.program);
    cmd.args(&step.args)
        .current_dir(cwd)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    for (k, v) in env {
        cmd.env(k, v);
    }
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        // Its own group, so the timeout takes any child the program started with it.
        cmd.process_group(0);
    }

    let began = Instant::now();
    let Ok(mut child) = cmd.spawn() else {
        return Ok(None);
    };
    // The write goes on its own thread: a program that never reads leaves the pipe full,
    // and a blocking write here would then wait for a reader that never comes.
    let feed = step.feed.clone();
    let pipe = child.stdin.take();
    let writer = std::thread::spawn(move || {
        if let Some(mut p) = pipe {
            drop(p.write_all(feed.as_bytes()));
        }
    });
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

    drop(writer.join());
    let (o, oc) = out
        .map(|h| h.join().unwrap_or_default())
        .unwrap_or_default();
    let (e, ec) = err
        .map(|h| h.join().unwrap_or_default())
        .unwrap_or_default();
    Ok(Some(StepOut {
        code,
        stdout: String::from_utf8_lossy(&o).into_owned(),
        stderr: String::from_utf8_lossy(&e).into_owned(),
        truncated: oc || ec,
        timed_out,
        duration_ms: u64::try_from(began.elapsed().as_millis()).unwrap_or(u64::MAX),
    }))
}

/// Every step in one scratch directory. The integration test drives this, the way the
/// runner test drives `proc::run_in` (06 §1.4).
pub fn run_steps(spec: &StdinSpec, work: &Path) -> Result<StdinOut, IpcError> {
    if spec.steps.len() > MAX_STEPS {
        return Err(bad("한 번에 돌릴 수 있는 수를 넘었습니다."));
    }
    for (path, text) in &spec.files {
        let at = under(work, path)?;
        if let Some(p) = at.parent() {
            std::fs::create_dir_all(p).map_err(|e| io(&e))?;
        }
        std::fs::write(&at, text).map_err(|e| io(&e))?;
    }
    let limit = Duration::from_millis(spec.timeout_ms.clamp(1, MAX_MS));
    let mut steps = Vec::with_capacity(spec.steps.len());
    for (at, step) in spec.steps.iter().enumerate() {
        let Some(done) = one(step, work, limit, &spec.env)? else {
            return Ok(StdinOut {
                steps,
                spawn_failed: Some(at),
            });
        };
        // A timeout stops the rest whatever the caller asked: the next case would run the
        // same loop with different numbers and spend the same five seconds saying so.
        let halt = done.timed_out || (step.must_pass && done.code != Some(0));
        steps.push(done);
        if halt {
            break;
        }
    }
    Ok(StdinOut {
        steps,
        spawn_failed: None,
    })
}

/// Runs the steps in a scratch directory that is removed when the call returns (D186 ⑧).
/// Blocking work goes to a pool thread — five cases of five seconds is half a minute.
#[tauri::command]
pub async fn stdin_run(app: AppHandle, spec: StdinSpec) -> Result<StdinOut, IpcError> {
    tauri::async_runtime::spawn_blocking(move || {
        let at = scratch(&app)?;
        run_steps(&spec, &at.0)
    })
    .await
    .map_err(|_| IpcError::new("RUN_IO", "실행이 끝나지 않았습니다.", true))?
}
