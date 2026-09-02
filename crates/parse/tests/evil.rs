//! 악성 입력 (06 §4.1). 리포는 **신뢰하지 않는 입력**이다 — 클론한 남의 리포도,
//! AI 가 만든 파일도 열린다.
//!
//! 파일은 여기서 만든다. 5 MB 짜리 한 줄을 리포에 커밋하면 그것부터가 문제이고,
//! 만드는 규칙이 곧 무엇을 막는지에 대한 설명이 된다.

use std::time::{Duration, Instant};

use chickadee_parse::{compile, ParseError, Spec};

/// 06 §4.1 — 파서 폭탄은 ≤ 3s 안에 끝나고 패닉이 0이어야 한다.
const BOMB_BUDGET: Duration = Duration::from_secs(3);
const MAX_BYTES: usize = 512 * 1024;

fn queries() -> chickadee_parse::Queries {
    compile(
        "typescript",
        &[Spec {
            id: "ts/optional-chaining".to_owned(),
            scm: "((member_expression optional_chain: (optional_chain) @pick.1) @site)".to_owned(),
        }],
    )
    .expect("compile")
}

#[test]
fn deep_nesting_is_refused_by_the_depth_limit_not_by_a_stack_overflow() {
    // 중첩 5,000단. `AstLite` 는 깊이 512 에서 멈춘다 (01 §3.2).
    let deep = format!("const a = {}1{};\n", "(".repeat(5_000), ")".repeat(5_000));
    let started = Instant::now();
    let err = chickadee_parse::ast("typescript", deep.as_bytes(), MAX_BYTES).expect_err("too deep");
    assert!(matches!(err, ParseError::TooDeep { .. }));
    assert!(started.elapsed() < BOMB_BUDGET, "{:?} 걸렸다", started.elapsed());
}

#[test]
fn a_deeply_nested_file_still_scans_without_panicking() {
    let deep = format!("const a = {}1{};\n", "(".repeat(5_000), ")".repeat(5_000));
    let started = Instant::now();
    // 쿼리 실행은 트리를 훑을 뿐이라 깊이 자체는 막지 않는다 — 막는 것은 시간이다.
    let out = chickadee_parse::scan(deep.as_bytes(), &queries(), MAX_BYTES);
    assert!(out.is_ok() || matches!(out, Err(ParseError::Timeout { .. })));
    assert!(started.elapsed() < BOMB_BUDGET, "{:?} 걸렸다", started.elapsed());
}

#[test]
fn a_five_megabyte_line_is_refused_by_the_byte_limit() {
    let long = format!("const a = \"{}\";\n", "x".repeat(5 * 1024 * 1024));
    let started = Instant::now();
    let err = chickadee_parse::scan(long.as_bytes(), &queries(), MAX_BYTES).expect_err("too large");
    assert!(matches!(err, ParseError::TooLarge { .. }));
    // 바이트 상한은 파싱 **전에** 걸린다 — 그래서 크기와 무관하게 즉시 끝난다.
    assert!(started.elapsed() < Duration::from_millis(200));
}

#[test]
fn a_file_of_nothing_but_broken_syntax_ends_and_is_called_poor() {
    let wrecked = "}{ ) ( ]] [[ ;; => => =>\n".repeat(5_000);
    let started = Instant::now();
    let out = chickadee_parse::scan(wrecked.as_bytes(), &queries(), MAX_BYTES).expect("scan");
    assert_eq!(out.quality, "poor");
    assert!(started.elapsed() < BOMB_BUDGET, "{:?} 걸렸다", started.elapsed());
}

#[test]
fn a_pathological_query_stops_at_the_match_limit() {
    // 와일드카드만으로 된 패턴은 노드마다 매치를 낸다. `set_match_limit(1024)` 가 이것을 막는다.
    let queries = compile(
        "typescript",
        &[Spec {
            id: "ts/anything".to_owned(),
            scm: "(_) @site".to_owned(),
        }],
    )
    .expect("compile");
    let src = "const a = { b: [1, 2, 3], c: { d: 'x' } };\n".repeat(2_000);
    let started = Instant::now();
    let out = chickadee_parse::scan(src.as_bytes(), &queries, MAX_BYTES).expect("scan");
    assert!(!out.captures.is_empty());
    assert!(started.elapsed() < BOMB_BUDGET, "{:?} 걸렸다", started.elapsed());
}

#[test]
fn invalid_utf8_does_not_stop_a_scan() {
    let mut bytes = b"const a = '".to_vec();
    bytes.extend_from_slice(&[0xff, 0xfe, 0xfd]);
    bytes.extend_from_slice(b"';\n");
    let out = chickadee_parse::scan(&bytes, &queries(), MAX_BYTES).expect("scan");
    assert_eq!(out.line_count, 2);
}
