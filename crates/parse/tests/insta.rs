//! 캡처 스냅샷 (06 §1.2 · 03 §8). 골든이 값 하나하나를 지킨다면 여기서는 파일 한 장에서
//! 무엇이 잡히는지를 통째로 굳힌다 — 문법 크레이트를 올린 PR 은 이 `.snap` diff 를 본문에
//! 붙인다.
//!
//! 언어당 15케이스: 06 §1.2 의 기본 문법 12(선언·호출·조건·반복·함수·클래스·import·
//! 에러 처리·컬렉션·문자열·비동기·타입) + 함정 3(주석 안 코드·문자열 안 코드·파싱 오류).
//! 파일은 골든과 같은 것을 본다 — 픽스처를 두 벌 두면 둘이 갈라진다.
//!
//! 스냅샷에는 절대 경로를 넣지 않는다(기계마다 달라진다). 경로는 리포 뿌리 기준이다.

mod support;

use std::fmt::Write as _;

use support::Case;

/// (칸 이름, 개념 디렉터리, 케이스). 칸 이름이 곧 스냅샷 파일 이름의 뒷부분이다.
type Slot = (&'static str, &'static str, &'static str);

/// TypeScript — 06 §1.2 의 12칸을 하나씩 채우고 함정 3칸을 더한다.
const TS: &[Slot] = &[
    ("declaration", "const-declaration", "pos-cart-total"),
    ("call", "call-expression", "pos-search-box"),
    ("condition", "conditional-ternary", "pos-badge-label"),
    ("loop", "for-of", "pos-label-rows"),
    ("function", "arrow-function", "pos-debounce"),
    ("class", "_blocks", "pos-cart-store-class"),
    ("import", "_imports", "pos-static-imports"),
    ("error-handling", "try-catch", "pos-read-settings"),
    ("collection", "array-map-immutable", "pos-set-qty"),
    ("string", "template-literal", "pos-receipt-line"),
    ("async", "async-await", "pos-refresh-stock"),
    ("type", "generics", "pos-first-of"),
    ("trap-comment", "_traps", "comment-code"),
    ("trap-string", "_traps", "string-code"),
    ("trap-broken", "_traps", "broken-parse"),
];

/// TSX — JSX 안에서 같은 개념이 어떤 모양이 되는지. 음성 케이스도 굳힌다:
/// 「아무것도 안 잡힌다」가 무너지는 것도 회귀다.
const TSX: &[Slot] = &[
    ("import", "_imports", "pos-cart-total"),
    ("import-dynamic", "_imports", "pos-lazy-panel"),
    ("import-absent", "_imports", "neg-self-contained"),
    ("condition", "conditional-ternary", "pos-cart-badge"),
    (
        "condition-attribute",
        "conditional-ternary",
        "pos-order-row",
    ),
    ("condition-absent", "conditional-ternary", "neg-and-guard"),
    ("collection", "array-map-immutable", "pos-cart-list"),
    (
        "collection-bare-param",
        "array-map-immutable",
        "pos-tag-row",
    ),
    (
        "collection-absent",
        "array-map-immutable",
        "neg-children-only",
    ),
    ("function", "arrow-function", "pos-quantity-input"),
    ("function-component", "arrow-function", "pos-search-field"),
    ("function-absent", "arrow-function", "neg-function-only"),
    ("trap-comment", "_traps", "comment-code"),
    ("trap-string", "_traps", "string-code"),
    ("trap-broken", "_traps", "broken-jsx"),
];

/// SQL — 사전에 개념이 아직 없어 케이스마다 옆의 `.query.scm` 으로 돈다.
/// 12칸은 SQL 에 있는 만큼만 대응한다: 선언은 CREATE TABLE, 조건은 WHERE, 나머지는 없다.
const SQL: &[Slot] = &[
    ("declaration", "create-table", "pos-cart-tables"),
    ("declaration-late", "create-table", "pos-stock-table"),
    ("declaration-absent", "create-table", "neg-index-and-view"),
    ("select", "select", "pos-open-carts"),
    ("select-aggregate", "select", "pos-daily-sales"),
    ("select-absent", "select", "neg-write-only"),
    ("join", "join", "pos-cart-with-items"),
    ("join-outer", "join", "pos-order-history"),
    ("join-absent", "join", "neg-single-table"),
    ("condition", "where-filter", "pos-open-only"),
    ("condition-range", "where-filter", "pos-recent-orders"),
    ("condition-absent", "where-filter", "neg-no-filter"),
    ("trap-comment", "_traps", "comment-code"),
    ("trap-string", "_traps", "string-code"),
    ("trap-broken", "_traps", "broken-parse"),
];

fn render(case: &Case) -> String {
    let out = case.scan();
    let mut text = format!(
        "{}\n{} · quality={} · lines={}\n\n",
        case.rel(),
        case.query_id(),
        out.quality,
        out.line_count
    );
    if out.captures.is_empty() {
        text.push_str("(캡처 없음)\n");
    }
    for cap in &out.captures {
        let at = format!("@{}", cap.name);
        let form = cap.form.as_deref().unwrap_or("-");
        writeln!(
            text,
            "m{match_id} p{pattern} {at:<16} form={form:<15} {:<22} {}:{}-{}:{} inError={}",
            cap.node_kind,
            cap.start_line,
            cap.start_col,
            cap.end_line,
            cap.end_col,
            cap.in_error,
            match_id = cap.match_id,
            pattern = cap.pattern_index,
        )
        .expect("문자열");
    }
    text
}

fn freeze(dir: &str, slots: &[Slot]) {
    assert_eq!(slots.len(), 15, "{dir}: 언어당 15케이스다 (06 §1.2)");
    for (slot, concept, stem) in slots {
        let case = Case::new(dir, concept, stem);
        insta::assert_snapshot!(format!("{dir}-{slot}"), render(&case));
    }
}

#[test]
fn typescript_captures_are_frozen() {
    freeze("ts", TS);
}

#[test]
fn tsx_captures_are_frozen() {
    freeze("tsx", TSX);
}

#[test]
fn sql_captures_are_frozen() {
    freeze("sql", SQL);
}
