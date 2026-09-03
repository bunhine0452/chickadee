//! T1 골든의 AST 픽스처 (04 §9 · §4.5).
//!
//! `packages/grading` 의 AST 승격층은 `AstLite` 를 인자로 받는다 — IPC 도 tree-sitter 도
//! 그 패키지 안에 없다(04 §4.5). 그래서 TS 골든이 비교할 트리를 여기서 굽는다: 케이스
//! 목록은 `fixtures/golden/t1/cases.json` 이고 결과는 `fixtures/golden/t1/ast/<id>.json` 이다.
//!
//! 손으로 쓰지 않는다:
//! `UPDATE_GOLDEN=1 cargo test -p chickadee-parse --test t1_ast` 로 다시 쓰고 눈으로 본다.
//!
//! 잡는 것: 문법 크레이트를 올리면 노드 이름이 바뀌어 승격이 조용히 멈춘다. 그때 이
//! 픽스처가 먼저 어긋난다.

mod support;

use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct Cases {
    cases: Vec<Case>,
}

#[derive(Deserialize)]
struct Case {
    id: String,
    grammar: String,
    #[serde(default)]
    ast: bool,
    original: Vec<String>,
    user: Vec<String>,
}

/// 한 케이스의 양쪽 트리. `hadError` 는 `parse_snippet` 의 그 필드와 같은 뜻이다.
/// `Ast` 는 `Serialize` 만 갖는다(01 §3.1 — TS 로 나가기만 한다) — 대조는 글로 한다.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Pair {
    grammar: String,
    original: chickadee_parse::Ast,
    original_had_error: bool,
    user: chickadee_parse::Ast,
    user_had_error: bool,
}

fn errored(node: &chickadee_parse::Ast) -> bool {
    node.kind == "ERROR" || node.kind == "MISSING" || node.children.iter().any(errored)
}

fn tree(grammar: &str, lines: &[String]) -> chickadee_parse::Ast {
    let text = lines.join("\n");
    chickadee_parse::ast(grammar, text.as_bytes(), support::BIG)
        .unwrap_or_else(|e| panic!("{grammar} 를 파싱하지 못했다: {e}"))
}

#[test]
fn t1_golden_asts_are_current() {
    let dir = support::root().join("fixtures/golden/t1");
    let listed: Cases = serde_json::from_slice(
        &std::fs::read(dir.join("cases.json")).expect("fixtures/golden/t1/cases.json"),
    )
    .expect("cases.json 이 JSON 이 아니다");

    let update = std::env::var_os("UPDATE_GOLDEN").is_some();
    let out = dir.join("ast");
    std::fs::create_dir_all(&out).expect("mkdir fixtures/golden/t1/ast");

    let mut stale = Vec::new();
    for case in listed.cases.iter().filter(|c| c.ast) {
        let original = tree(&case.grammar, &case.original);
        let user = tree(&case.grammar, &case.user);
        let pair = Pair {
            grammar: case.grammar.clone(),
            original_had_error: errored(&original),
            user_had_error: errored(&user),
            original,
            user,
        };
        let text = serde_json::to_string_pretty(&pair).expect("직렬화");
        let at = out.join(format!("{}.json", case.id));
        if update {
            std::fs::write(&at, format!("{text}\n")).expect("write");
            continue;
        }
        let have = std::fs::read_to_string(&at).unwrap_or_default();
        if have.trim() != text.trim() {
            stale.push(case.id.clone());
        }
    }

    assert!(
        stale.is_empty(),
        "AST 픽스처가 문법 크레이트와 어긋났다: {}. \
         UPDATE_GOLDEN=1 cargo test -p chickadee-parse --test t1_ast 로 다시 쓰고 diff 를 눈으로 봐라",
        stale.join(", ")
    );
}
