//! The four promises the process layer makes (D175 · 정본 §5).
//!
//! 1. the source tree is byte-identical afterwards — the answer lands in the copy
//! 2. the timeout kills, and it kills the whole group, not just the wrapper
//! 3. output is capped and says so
//! 4. a path that points out of the scratch copy is refused
//!
//! Unix only: every case drives `/bin/sh`, and the Windows half of the runner is
//! `gradlew.bat`, which needs a real JDK to say anything. Nothing here needs one.
#![cfg(unix)]

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::time::Instant;

use chickadee_app_lib::proc::{run_in, ProcSpec};

struct Tmp(PathBuf);

impl Drop for Tmp {
    fn drop(&mut self) {
        drop(std::fs::remove_dir_all(&self.0));
    }
}

fn tmp(name: &str) -> Tmp {
    let at = std::env::temp_dir().join(format!("chickadee-run-{name}-{}", std::process::id()));
    drop(std::fs::remove_dir_all(&at));
    std::fs::create_dir_all(&at).expect("temp dir");
    Tmp(at)
}

fn spec(program: &str, args: &[&str]) -> ProcSpec {
    ProcSpec {
        root_path: String::new(),
        work_id: "unused".into(),
        needs: vec![],
        keep: vec![],
        files: vec![],
        program: program.into(),
        args: args.iter().map(|s| (*s).to_string()).collect(),
        env: vec![],
        timeout_ms: 20_000,
    }
}

/// path → bytes, for every file under `at`. Comparing the whole map is the only
/// honest form of "nothing was written": a per-file check misses a new file.
fn snapshot(at: &Path) -> BTreeMap<String, Vec<u8>> {
    let mut out = BTreeMap::new();
    let mut stack = vec![at.to_path_buf()];
    while let Some(dir) = stack.pop() {
        let Ok(entries) = std::fs::read_dir(&dir) else {
            continue;
        };
        for e in entries.flatten() {
            let p = e.path();
            if p.is_dir() {
                stack.push(p);
            } else if let Ok(bytes) = std::fs::read(&p) {
                let rel = p
                    .strip_prefix(at)
                    .unwrap_or(&p)
                    .to_string_lossy()
                    .into_owned();
                out.insert(rel, bytes);
            }
        }
    }
    out
}

fn seed(root: &Path) {
    std::fs::create_dir_all(root.join("src/main/java")).expect("mkdir");
    std::fs::write(root.join("src/main/java/A.java"), "class A { int x = 1; }").expect("write");
    std::fs::write(root.join("settings.gradle"), "rootProject.name = 'x'").expect("write");
    // Ignored and hidden paths must not be mirrored — a copied `build/` would be stale
    // the moment the answer changes, and a copied `.git` doubles the repository.
    std::fs::write(root.join(".gitignore"), "build/\n").expect("write");
    std::fs::create_dir_all(root.join("build")).expect("mkdir");
    std::fs::write(root.join("build/old.class"), "stale").expect("write");
    std::fs::create_dir_all(root.join(".git")).expect("mkdir");
    std::fs::write(root.join(".git/HEAD"), "ref: refs/heads/main").expect("write");
}

#[test]
fn source_tree_is_untouched_and_the_answer_lands_in_the_copy() {
    let src = tmp("src");
    let work = tmp("work");
    let home = tmp("work-home");
    seed(&src.0);
    let before = snapshot(&src.0);

    let mut s = spec("/bin/sh", &["-c", "cat src/main/java/A.java > seen.txt"]);
    s.root_path = src.0.to_string_lossy().into_owned();
    s.files = vec![(
        "src/main/java/A.java".into(),
        "class A { int x = 42; }".into(),
    )];
    let out = run_in(&s, &work.0, &home.0).expect("run");

    assert_eq!(out.code, Some(0), "stderr: {}", out.stderr);
    assert_eq!(snapshot(&src.0), before, "the source tree changed");
    // The program saw the answer, not the original.
    let seen = std::fs::read_to_string(work.0.join("seen.txt")).expect("seen");
    assert_eq!(seen, "class A { int x = 42; }");
    // …and the ignored and hidden paths never made it across.
    assert!(!work.0.join("build/old.class").exists(), "build/ mirrored");
    assert!(!work.0.join(".git/HEAD").exists(), ".git mirrored");
    assert!(
        work.0.join("settings.gradle").exists(),
        "tracked file missing"
    );
}

#[test]
fn a_second_pass_restores_the_original_and_leaves_unchanged_files_alone() {
    let src = tmp("again-src");
    let work = tmp("again-work");
    let home = tmp("again-home");
    seed(&src.0);

    let mut s = spec("/bin/sh", &["-c", "true"]);
    s.root_path = src.0.to_string_lossy().into_owned();
    s.files = vec![("src/main/java/A.java".into(), "wrong".into())];
    run_in(&s, &work.0, &home.0).expect("first");
    let stamp = std::fs::metadata(work.0.join("settings.gradle"))
        .and_then(|m| m.modified())
        .expect("mtime");

    s.files = vec![];
    run_in(&s, &work.0, &home.0).expect("second");

    let text = std::fs::read_to_string(work.0.join("src/main/java/A.java")).expect("read");
    assert_eq!(
        text, "class A { int x = 1; }",
        "the answer was not rolled back"
    );
    let after = std::fs::metadata(work.0.join("settings.gradle"))
        .and_then(|m| m.modified())
        .expect("mtime");
    // An untouched file keeps its timestamp, or the build tool recompiles everything.
    assert_eq!(stamp, after, "an unchanged file was copied again");
}

#[test]
fn the_timeout_kills_the_whole_group() {
    let work = tmp("timeout");
    let home = tmp("timeout-home");
    // The shell stands in for `gradlew`: it starts a long-lived child and waits. Killing
    // only the shell would leave that child running, which is the JVM in the real case.
    let mut s = spec(
        "/bin/sh",
        &["-c", "sleep 60 & echo $! > child.pid; sleep 60"],
    );
    s.timeout_ms = 400;

    let began = Instant::now();
    let out = run_in(&s, &work.0, &home.0).expect("run");
    let took = began.elapsed();

    assert!(out.timed_out, "the timeout did not fire");
    assert!(
        took.as_millis() >= 400,
        "it did not wait its 400ms: {took:?}"
    );
    // 400ms budget plus the 25ms poll: anything near a second means the kill did not land.
    assert!(took.as_millis() < 2_000, "the kill took {took:?}");
    let pid = std::fs::read_to_string(work.0.join("child.pid")).expect("pid");
    let alive = std::process::Command::new("kill")
        .args(["-0", pid.trim()])
        .status()
        .is_ok_and(|st| st.success());
    assert!(!alive, "the grandchild outlived the kill");
}

#[test]
fn output_is_capped_and_says_so() {
    let work = tmp("cap");
    let home = tmp("cap-home");
    // 400 KiB, well past the 128 KiB per-stream cap.
    let s = spec(
        "/bin/sh",
        &[
            "-c",
            "i=0; while [ $i -lt 400 ]; do printf '%1024d' 1; i=$((i+1)); done",
        ],
    );
    let out = run_in(&s, &work.0, &home.0).expect("run");

    assert!(out.truncated, "a 400 KiB stream was not marked truncated");
    assert!(
        out.stdout.len() <= 128 * 1024,
        "kept {} bytes",
        out.stdout.len()
    );
    assert_eq!(out.code, Some(0));
}

#[test]
fn a_path_out_of_the_copy_is_refused() {
    let work = tmp("escape");
    let home = tmp("escape-home");
    let mut s = spec("/bin/sh", &["-c", "true"]);
    s.files = vec![("../escaped.txt".into(), "no".into())];

    let err = run_in(&s, &work.0, &home.0).expect_err("the escape was allowed");
    assert_eq!(err.code, "BAD_INPUT");
    assert!(
        !work
            .0
            .parent()
            .is_some_and(|p| p.join("escaped.txt").exists()),
        "a file was written outside the copy"
    );
}

#[test]
fn a_missing_program_is_an_error_not_a_panic() {
    let work = tmp("missing");
    let home = tmp("missing-home");
    // This is the shape `detectRunner` leans on: no JDK on the machine is a fact to
    // report, never a crash. TS turns it into `no-runner`.
    let err =
        run_in(&spec("chickadee-no-such-program", &[]), &work.0, &home.0).expect_err("spawned");
    assert_eq!(err.code, "RUN_SPAWN");
}

#[test]
fn a_missing_precondition_stops_the_program_from_starting() {
    let work = tmp("needs");
    let home = tmp("needs-home");
    std::fs::create_dir_all(home.0.join("there")).expect("mkdir");

    // The one that exists is not reported; the one that does not stops everything. The
    // program would have written the file, so its absence is the proof it never ran.
    let mut s = spec("/bin/sh", &["-c", "echo ran > ran.txt"]);
    s.needs = vec!["there".into(), "not-there".into()];
    let out = run_in(&s, &work.0, &home.0).expect("run");

    assert_eq!(out.missing, vec!["not-there".to_string()]);
    assert_eq!(out.code, None);
    assert!(
        !work.0.join("ran.txt").exists(),
        "the program started anyway"
    );

    // With everything present it starts as usual.
    s.needs = vec!["there".into()];
    let out = run_in(&s, &work.0, &home.0).expect("run");
    assert!(out.missing.is_empty());
    assert!(work.0.join("ran.txt").exists());
}

#[test]
fn a_failing_program_reports_its_code_rather_than_failing_the_call() {
    let work = tmp("exit");
    let home = tmp("exit-home");
    let out = run_in(
        &spec("/bin/sh", &["-c", "echo nope 1>&2; exit 7"]),
        &work.0,
        &home.0,
    )
    .expect("run");
    assert_eq!(out.code, Some(7));
    assert!(out.stderr.contains("nope"));
    assert!(!out.timed_out);
}

#[test]
fn the_wrapper_comes_across_executable_and_its_marks_come_back() {
    use std::os::unix::fs::PermissionsExt;

    // The whole shape of a run, minus the JVM: a wrapper script in the source tree, an
    // answer dropped on top, and the marks the init script would print coming back on
    // stdout. `fs::copy` has to carry the 755 across or `./gradlew` is not runnable.
    let src = tmp("wrap-src");
    let work = tmp("wrap-work");
    let home = tmp("wrap-home");
    seed(&src.0);
    std::fs::write(src.0.join(".gitignore"), "build/\n/gradlew\n").expect("write");
    let wrapper = src.0.join("gradlew");
    std::fs::write(
        &wrapper,
        "#!/bin/sh\necho \"##CHICKADEE##|SUCCESS|x.ATest|reads_the_answer|\"\ncat src/main/java/A.java\n",
    )
    .expect("write");
    std::fs::set_permissions(&wrapper, std::fs::Permissions::from_mode(0o755)).expect("chmod");

    let mut s = spec("./gradlew", &["--offline", "--no-daemon", "test"]);
    s.root_path = src.0.to_string_lossy().into_owned();
    // The repository ignores its own wrapper — Flutter's template does exactly this —
    // so without `keep` the mirror drops it and nothing can start.
    s.keep = vec!["gradlew".into()];
    s.files = vec![(
        "src/main/java/A.java".into(),
        "class A { int x = 9; }".into(),
    )];
    let out = run_in(&s, &work.0, &home.0).expect("run");

    assert_eq!(out.code, Some(0), "stderr: {}", out.stderr);
    assert!(out
        .stdout
        .contains("##CHICKADEE##|SUCCESS|x.ATest|reads_the_answer|"));
    assert!(out.stdout.contains("class A { int x = 9; }"));
}
