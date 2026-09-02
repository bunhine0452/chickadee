//! 골든 픽스처 (03 §8 · 06 §1.2). `fixtures/golden/<문법>/<개념>/<케이스>` 를 그 개념의
//! `.scm` 으로 돌려 `<케이스>.expected.json` 과 맞춰 본다.
//!
//! 잡는 것은 조용한 실패다: 문법 크레이트를 올리면 쿼리는 그대로 컴파일되는데 매치가
//! 0건이 되거나 노드 종류가 바뀐다. `dictionary.rs` 의 예시는 한 줄짜리라 그 줄에서만
//! 확인하고, 여기서는 함수 안·조건문 안·체인 중간 같은 실제 코드 모양에서 확인한다.
//!
//! 기대 파일은 손으로 쓰지 않는다:
//! `UPDATE_GOLDEN=1 cargo test -p chickadee-parse --test golden` 으로 다시 쓰고 눈으로 본다.

mod support;

use std::collections::BTreeSet;
use std::fmt::Write as _;

use chickadee_parse::Capture;
use serde::{Deserialize, Serialize};

use support::{Case, TRAPS};

/// 한 줄에 몇 건까지 어긋남을 보여 줄지. 전부 갈아엎힌 파일에서 화면을 덮지 않게 자른다.
const SHOWN: usize = 5;

/// 기대 파일 한 줄. 06 §1.2 가 정한 필드 그대로이고 순서도 그대로다 — Rust 는 Site 를
/// 모르므로 여기까지다. 발췌·바이트 오프셋은 넣지 않는다(사용자 코드를 리포에 두 벌 두게 된다).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Row {
    query_id: String,
    match_id: u32,
    pattern_index: u32,
    name: String,
    form: Option<String>,
    start_line: u32,
    start_col: u32,
    end_line: u32,
    end_col: u32,
    node_kind: String,
    in_error: bool,
}

impl Row {
    fn of(cap: &Capture) -> Self {
        Self {
            query_id: cap.query_id.clone(),
            match_id: cap.match_id,
            pattern_index: cap.pattern_index,
            name: cap.name.clone(),
            form: cap.form.clone(),
            start_line: cap.start_line,
            start_col: cap.start_col,
            end_line: cap.end_line,
            end_col: cap.end_col,
            node_kind: cap.node_kind.clone(),
            in_error: cap.in_error,
        }
    }

    fn show(&self) -> String {
        format!(
            "m{} p{} @{} form={} {} {}:{}-{}:{} inError={}",
            self.match_id,
            self.pattern_index,
            self.name,
            self.form.as_deref().unwrap_or("-"),
            self.node_kind,
            self.start_line,
            self.start_col,
            self.end_line,
            self.end_col,
            self.in_error,
        )
    }
}

fn rows(case: &Case) -> Vec<Row> {
    case.scan().captures.iter().map(Row::of).collect()
}

fn updating() -> bool {
    std::env::var("UPDATE_GOLDEN").is_ok_and(|v| v == "1")
}

/// 어긋난 자리를 사람이 읽을 수 있게 적는다 — 어느 파일의 몇 번째 캡처가 어떻게 다른지.
fn mismatch(case: &Case, want: &[Row], got: &[Row]) -> Option<String> {
    if want == got {
        return None;
    }
    let mut out = format!("{}  ({})", case.rel(), case.query_id());
    if want.len() != got.len() {
        write!(
            out,
            "\n  캡처 수: 골든 {}건, 지금 {}건",
            want.len(),
            got.len()
        )
        .expect("문자열");
    }
    let mut shown = 0usize;
    for i in 0..want.len().max(got.len()) {
        if want.get(i) == got.get(i) {
            continue;
        }
        if shown == SHOWN {
            out.push_str("\n  … 나머지 생략");
            break;
        }
        let one = |row: Option<&Row>| row.map_or_else(|| "(없음)".to_owned(), Row::show);
        write!(
            out,
            "\n  #{i}\n    골든: {}\n    지금: {}",
            one(want.get(i)),
            one(got.get(i))
        )
        .expect("문자열");
        shown += 1;
    }
    Some(out)
}

#[test]
fn the_golden_files_still_describe_what_the_queries_capture() {
    let update = updating();
    let mut bad = Vec::new();
    let mut seen = 0usize;
    for case in support::cases() {
        seen += 1;
        let got = rows(&case);
        if update {
            let mut text = serde_json::to_string_pretty(&got).expect("직렬화");
            text.push('\n');
            std::fs::write(case.expected(), text).unwrap_or_else(|e| panic!("{}: {e}", case.rel()));
            continue;
        }
        let Ok(text) = std::fs::read_to_string(case.expected()) else {
            bad.push(format!(
                "{}\n  기대 파일이 없다 — UPDATE_GOLDEN=1 로 만든 뒤 눈으로 보라",
                case.rel()
            ));
            continue;
        };
        let want: Vec<Row> =
            serde_json::from_str(&text).unwrap_or_else(|e| panic!("{}: {e}", case.rel()));
        if let Some(msg) = mismatch(&case, &want, &got) {
            bad.push(msg);
        }
    }
    assert!(
        seen > 0,
        "fixtures/golden 이 비어 있다 — 그물이 없는 것과 같다"
    );
    assert!(
        bad.is_empty(),
        "골든 {}건이 어긋난다. 문법을 올렸다면 UPDATE_GOLDEN=1 로 다시 쓰고 diff 를 읽어라.\n\n{}",
        bad.len(),
        bad.join("\n\n")
    );
}

/// 06 §1.2 — 언어당 기본 문법 12케이스 + 함정 3케이스. TS 하한은 03 §8 의 「첫 대상:
/// TS 개념 20개」를 따른다(06 의 12칸은 insta 가 칸별로 따로 지킨다). TSX·SQL 은 아직
/// 개념이 적어 하한만 지킨다.
#[test]
fn each_grammar_brings_its_concepts_and_its_three_traps() {
    for (dir, least) in [("ts", 20usize), ("tsx", 3), ("sql", 3)] {
        let cases = support::cases_of(dir);
        let concepts: BTreeSet<&str> = cases
            .iter()
            .map(|c| c.concept.as_str())
            .filter(|c| *c != TRAPS)
            .collect();
        assert!(
            concepts.len() >= least,
            "fixtures/golden/{dir}: 개념 {}개 — {least}개 이상이어야 한다 (06 §1.2)",
            concepts.len()
        );
        let traps = cases.iter().filter(|c| c.concept == TRAPS).count();
        assert_eq!(
            traps, 3,
            "fixtures/golden/{dir}/{TRAPS}: 주석 안 코드·문자열 안 코드·파싱 오류 세 케이스 (06 §1.2)"
        );
    }
}

/// 03 §8 — 개념당 양성 3 · 음성 2 이상.
#[test]
fn every_typescript_concept_has_three_positive_and_two_negative_cases() {
    let cases = support::cases_of("ts");
    let concepts: BTreeSet<&str> = cases
        .iter()
        .map(|c| c.concept.as_str())
        .filter(|c| *c != TRAPS)
        .collect();
    for concept in concepts {
        let mine = || cases.iter().filter(|c| c.concept == concept);
        let pos = mine().filter(|c| c.stem.starts_with("pos-")).count();
        let neg = mine().filter(|c| c.stem.starts_with("neg-")).count();
        assert!(
            pos >= 3,
            "fixtures/golden/ts/{concept}: 양성 {pos}개 — 3개 이상"
        );
        assert!(
            neg >= 2,
            "fixtures/golden/ts/{concept}: 음성 {neg}개 — 2개 이상"
        );
    }
}

/// 죽은 패턴과 넓은 패턴을 동시에 본다: 양성에서 한 건도 못 잡으면 쿼리가 죽은 것이고,
/// 음성에서 한 건이라도 잡으면 개념의 경계가 무너진 것이다 (03 §5.1).
#[test]
fn a_positive_case_captures_and_a_negative_case_captures_nothing() {
    for case in support::cases() {
        if case.concept == TRAPS {
            continue;
        }
        let found = case.scan().captures.len();
        if case.stem.starts_with("pos-") {
            assert!(
                found > 0,
                "{}: 양성인데 한 건도 안 잡힌다 — 죽은 패턴이다",
                case.rel()
            );
        } else if case.stem.starts_with("neg-") {
            assert_eq!(
                found,
                0,
                "{}: 음성인데 {found}건이 잡힌다 — 패턴이 너무 넓다",
                case.rel()
            );
        } else {
            panic!("{}: 케이스 이름은 pos- 나 neg- 로 시작한다", case.rel());
        }
    }
}

/// 함정 3케이스 (06 §1.2). 주석·문자열 판은 「잡히면 안 되는 것이 안 잡히는지」를,
/// 깨진 판은 `inError` 가 서는지를 본다 (03 §2.3).
#[test]
fn the_three_traps_hold() {
    for case in support::cases().iter().filter(|c| c.concept == TRAPS) {
        let out = case.scan();
        let sites = out.captures.iter().filter(|c| c.name == "site").count();
        if case.stem.starts_with("comment-") || case.stem.starts_with("string-") {
            assert_eq!(
                sites,
                1,
                "{}: 사용처는 실제 코드 한 곳뿐이어야 한다 — 주석·문자열 안까지 잡혔다",
                case.rel()
            );
            assert!(
                out.captures.iter().all(|c| !c.in_error),
                "{}: 멀쩡히 파싱되는 파일인데 복구 표시가 섰다",
                case.rel()
            );
            assert_eq!(
                out.quality,
                "ok",
                "{}: 멀쩡한 파일의 품질이 ok 가 아니다",
                case.rel()
            );
        } else if case.stem.starts_with("broken-") {
            assert!(
                out.captures.iter().any(|c| c.in_error),
                "{}: 깨진 파일인데 inError 가 하나도 없다 (03 §2.3)",
                case.rel()
            );
        } else {
            panic!(
                "{}: 함정 이름은 comment- · string- · broken- 으로 시작한다",
                case.rel()
            );
        }
    }
}
