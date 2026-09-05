//! The five promises the stdin step layer makes (D186 ⑧).
//!
//! 1. the text reaches the program's standard input and its output comes back
//! 2. the five second ceiling kills, and it kills the whole group
//! 3. a program this computer does not have is a fact, not an error
//! 4. `mustPass` stops the steps after it; nothing else does
//! 5. output is capped and says so, and a path out of the scratch directory is refused
//!
//! Unix only, and no JDK is needed: every case drives `sh`, `cat` or `head`. The Java
//! adapter is exercised by `packages/grading/src/stdin-runner.test.ts` against a fake IPC.
#![cfg(unix)]

use std::path::PathBuf;

use chickadee_app_lib::stdin::{run_steps, StdinSpec, StepSpec};

struct Tmp(PathBuf);

impl Drop for Tmp {
    fn drop(&mut self) {
        drop(std::fs::remove_dir_all(&self.0));
    }
}

fn tmp(name: &str) -> Tmp {
    let at = std::env::temp_dir().join(format!("chickadee-stdin-{name}-{}", std::process::id()));
    drop(std::fs::remove_dir_all(&at));
    std::fs::create_dir_all(&at).expect("temp dir");
    Tmp(at)
}

fn step(program: &str, args: &[&str], feed: &str) -> StepSpec {
    StepSpec {
        program: program.into(),
        args: args.iter().map(|s| (*s).to_string()).collect(),
        feed: feed.into(),
        must_pass: false,
    }
}

fn spec(steps: Vec<StepSpec>) -> StdinSpec {
    StdinSpec {
        files: vec![],
        steps,
        env: vec![],
        timeout_ms: 5_000,
    }
}

#[test]
fn the_text_reaches_standard_input_and_comes_back() {
    let at = tmp("feed");
    let out = run_steps(&spec(vec![step("cat", &[], "3 4\n")]), &at.0).expect("run");
    assert_eq!(out.spawn_failed, None);
    assert_eq!(out.steps.len(), 1);
    assert_eq!(out.steps[0].stdout, "3 4\n");
    assert_eq!(out.steps[0].code, Some(0));
    assert!(!out.steps[0].timed_out);
}

#[test]
fn each_step_gets_its_own_text() {
    let at = tmp("each");
    let out = run_steps(
        &spec(vec![
            step("cat", &[], "one\n"),
            step("cat", &[], "two\n"),
            step("cat", &[], "three\n"),
        ]),
        &at.0,
    )
    .expect("run");
    let said: Vec<&str> = out.steps.iter().map(|s| s.stdout.as_str()).collect();
    assert_eq!(said, ["one\n", "two\n", "three\n"]);
}

#[test]
fn files_are_written_before_the_first_step() {
    let at = tmp("files");
    let mut s = spec(vec![step("cat", &["main.txt"], "")]);
    s.files = vec![("main.txt".into(), "written\n".into())];
    let out = run_steps(&s, &at.0).expect("run");
    assert_eq!(out.steps[0].stdout, "written\n");
}

#[test]
fn a_loop_is_cut_at_the_ceiling_and_takes_its_children_with_it() {
    let at = tmp("loop");
    let mut s = spec(vec![step(
        "sh",
        &["-c", "sleep 30 & while :; do :; done"],
        "",
    )]);
    s.timeout_ms = 300;
    let began = std::time::Instant::now();
    let out = run_steps(&s, &at.0).expect("run");
    let took = began.elapsed();
    assert!(out.steps[0].timed_out, "the step should report the cut");
    assert_eq!(out.steps[0].code, None, "a signal leaves no exit code");
    assert!(took.as_millis() < 3_000, "took {took:?}");
}

#[test]
fn a_timeout_stops_the_steps_after_it() {
    let at = tmp("halt");
    let mut s = spec(vec![
        step("sh", &["-c", "while :; do :; done"], ""),
        step("cat", &[], "never\n"),
    ]);
    s.timeout_ms = 200;
    let out = run_steps(&s, &at.0).expect("run");
    assert_eq!(out.steps.len(), 1, "the second step must not start");
}

#[test]
fn the_ceiling_cannot_be_raised_by_the_caller() {
    let at = tmp("ceiling");
    let mut s = spec(vec![step("sh", &["-c", "while :; do :; done"], "")]);
    // 600 s is what `proc.rs` allows; this layer clamps to 5 s whatever is asked.
    s.timeout_ms = 600_000;
    let began = std::time::Instant::now();
    let out = run_steps(&s, &at.0).expect("run");
    assert!(out.steps[0].timed_out);
    assert!(began.elapsed().as_secs() < 9, "clamped to five seconds");
}

#[test]
fn a_program_this_computer_does_not_have_is_a_fact() {
    let at = tmp("absent");
    let out = run_steps(
        &spec(vec![
            step("cat", &[], "first\n"),
            step("chickadee-no-such-program", &[], ""),
            step("cat", &[], "third\n"),
        ]),
        &at.0,
    )
    .expect("not an error");
    assert_eq!(out.spawn_failed, Some(1));
    assert_eq!(out.steps.len(), 1, "nothing after the missing program ran");
}

#[test]
fn must_pass_stops_the_rest_and_a_plain_failure_does_not() {
    let at = tmp("mustpass");
    let mut gate = step("sh", &["-c", "exit 1"], "");
    gate.must_pass = true;
    let out = run_steps(&spec(vec![gate, step("cat", &[], "after\n")]), &at.0).expect("run");
    assert_eq!(out.steps.len(), 1, "a failed mustPass stops the rest");

    let out = run_steps(
        &spec(vec![
            step("sh", &["-c", "exit 1"], ""),
            step("cat", &[], "after\n"),
        ]),
        &at.0,
    )
    .expect("run");
    assert_eq!(out.steps.len(), 2, "a plain non-zero exit does not stop it");
    assert_eq!(out.steps[1].stdout, "after\n");
}

#[test]
fn output_past_the_cap_is_cut_and_says_so() {
    let at = tmp("cap");
    let out = run_steps(
        &spec(vec![step(
            "sh",
            &["-c", "head -c 200000 /dev/zero | tr '\\0' 'x'"],
            "",
        )]),
        &at.0,
    )
    .expect("run");
    assert!(out.steps[0].truncated);
    assert!(out.steps[0].stdout.len() <= 16 * 1024);
}

#[test]
fn a_path_out_of_the_scratch_directory_is_refused() {
    let at = tmp("escape");
    for path in ["../escaped.txt", "/etc/escaped.txt"] {
        let mut s = spec(vec![]);
        s.files = vec![(path.into(), "no".into())];
        let e = run_steps(&s, &at.0).expect_err("must refuse");
        assert_eq!(e.code, "BAD_INPUT");
    }
}

#[test]
fn a_program_named_by_path_is_refused() {
    let at = tmp("bypath");
    let e = run_steps(&spec(vec![step("/bin/cat", &[], "")]), &at.0).expect_err("must refuse");
    assert_eq!(e.code, "BAD_INPUT");
}

#[test]
fn more_steps_than_the_ceiling_are_refused() {
    let at = tmp("many");
    let steps = (0..17).map(|_| step("cat", &[], "")).collect();
    let e = run_steps(&spec(steps), &at.0).expect_err("must refuse");
    assert_eq!(e.code, "BAD_INPUT");
}

/// The one case that uses a real toolchain. Skipped where Python is absent, because "no
/// Python" is exactly what the runner is allowed to report (D175 ⑤).
#[test]
fn a_real_python_program_reads_its_input_and_prints() {
    let at = tmp("python");
    let mut s = spec(vec![
        step("python3", &["main.py"], "3 4\n"),
        step("python3", &["main.py"], "10 -3\n"),
    ]);
    s.files = vec![(
        "main.py".into(),
        "import sys\na, b = sys.stdin.read().split()\nprint(int(a) + int(b))\n".into(),
    )];
    let out = run_steps(&s, &at.0).expect("run");
    if out.spawn_failed.is_some() {
        return;
    }
    assert_eq!(out.steps[0].stdout, "7\n");
    assert_eq!(out.steps[1].stdout, "7\n");
}
