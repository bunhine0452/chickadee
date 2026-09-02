//! Snippet goldens for the query runner (03 §3.2). The `.scm` text here is the
//! same text the dictionary ships, so a grammar bump that renames a node fails
//! right here instead of quietly matching nothing.

use chickadee_parse::{compile, Capture, ParseError, Spec};

const BIG: usize = 512 * 1024;

const OPTIONAL_CHAINING: &str = r#"
((member_expression
   object: (_) @pick.1
   optional_chain: (optional_chain) @pick.2
   property: (_) @pick.3) @site
 (#set! form "member"))

(binary_expression
  left: (_ (optional_chain)) operator: "??" right: (_) @ctx.fallback)
"#;

const IMPORTS: &str = r#"
((import_statement source: (string) @import.source) (#set! form "static"))
"#;

fn scan(grammar: &str, src: &str, id: &str, scm: &str) -> Vec<Capture> {
    let queries = compile(
        grammar,
        &[Spec {
            id: id.to_owned(),
            scm: scm.to_owned(),
        }],
    )
    .expect("compile");
    chickadee_parse::scan(src.as_bytes(), &queries, BIG)
        .expect("scan")
        .captures
}

fn named<'a>(caps: &'a [Capture], name: &str) -> Vec<&'a Capture> {
    caps.iter().filter(|c| c.name == name).collect()
}

#[test]
fn the_grammar_table_lists_what_the_features_turned_on() {
    let names: Vec<String> = chickadee_parse::languages()
        .into_iter()
        .map(|l| l.grammar)
        .collect();
    assert!(names.contains(&"typescript".to_owned()));
    assert!(names.contains(&"tsx".to_owned()));
    assert!(names.contains(&"javascript".to_owned()));
    assert!(names.contains(&"sql".to_owned()));
    assert!(chickadee_parse::languages().iter().all(|l| l.abi >= 13));
}

#[test]
fn an_unknown_grammar_is_named_in_the_error() {
    assert!(matches!(
        compile("cobol", &[]),
        Err(ParseError::UnsupportedLang(g)) if g == "cobol"
    ));
}

#[test]
fn a_broken_query_reports_its_id_and_position() {
    let bad = Spec {
        id: "ts/broken".to_owned(),
        scm: "(no_such_node) @site".to_owned(),
    };
    let Err(ParseError::QueryInvalid { id, row, col }) = compile("typescript", &[bad]) else {
        panic!("a query naming a node that does not exist must not compile");
    };
    assert_eq!(id, "ts/broken");
    assert_eq!(row, 1);
    assert!(col >= 1);
}

#[test]
fn picks_of_one_site_share_a_match_id() {
    let caps = scan(
        "typescript",
        "const nick = res.user?.profile ?? '손님'\n",
        "ts/optional-chaining",
        OPTIONAL_CHAINING,
    );
    let sites = named(&caps, "site");
    assert_eq!(sites.len(), 1);
    let id = sites[0].match_id;
    let picks: Vec<&str> = caps
        .iter()
        .filter(|c| c.match_id == id && c.name.starts_with("pick."))
        .map(|c| c.excerpt.as_str())
        .collect();
    assert_eq!(picks, vec!["res.user", "?.", "profile"]);
    assert_eq!(sites[0].form.as_deref(), Some("member"));
    assert_eq!(sites[0].start_line, 1, "lines are 1-based");
}

#[test]
fn a_context_pattern_captures_without_making_a_site() {
    let caps = scan(
        "typescript",
        "const nick = res.user?.profile ?? '손님'\n",
        "ts/optional-chaining",
        OPTIONAL_CHAINING,
    );
    let ctx = named(&caps, "ctx.fallback");
    assert_eq!(ctx.len(), 1);
    assert_eq!(ctx[0].excerpt, "'손님'");
    // The context match is its own match — it carries no site.
    assert!(!caps
        .iter()
        .any(|c| c.match_id == ctx[0].match_id && c.name == "site"));
}

#[test]
fn nested_optional_chains_come_out_innermost_first() {
    let caps = scan(
        "typescript",
        "const n = res.user?.profile?.nickname\n",
        "ts/optional-chaining",
        OPTIONAL_CHAINING,
    );
    let sites = named(&caps, "site");
    assert_eq!(sites.len(), 2);
    assert!(
        sites[0].start_byte <= sites[1].start_byte && sites[0].end_byte < sites[1].end_byte,
        "the shorter span comes first (03 §3.2)"
    );
}

#[test]
fn a_pattern_that_does_not_apply_yields_nothing() {
    let caps = scan(
        "typescript",
        "const a = obj.deep.value\n",
        "ts/optional-chaining",
        OPTIONAL_CHAINING,
    );
    assert!(caps.is_empty());
}

#[test]
fn code_inside_a_string_or_a_comment_is_not_a_site() {
    let caps = scan(
        "typescript",
        "const s = 'res.user?.profile'\n// res.user?.profile\n",
        "ts/optional-chaining",
        OPTIONAL_CHAINING,
    );
    assert!(caps.is_empty(), "the whole point of parsing over regex");
}

#[test]
fn the_system_import_query_finds_the_specifier() {
    let caps = scan(
        "typescript",
        "import { a } from './x.js'\n",
        "_imports",
        IMPORTS,
    );
    let sources = named(&caps, "import.source");
    assert_eq!(sources.len(), 1);
    assert_eq!(sources[0].excerpt, "'./x.js'");
    assert_eq!(sources[0].form.as_deref(), Some("static"));
    assert_eq!(sources[0].query_id, "_imports");
}

#[test]
fn a_capture_inside_a_recovered_region_is_flagged() {
    let caps = scan(
        "typescript",
        "function broken( {\nconst x = a.b?.c\n",
        "ts/optional-chaining",
        OPTIONAL_CHAINING,
    );
    assert!(
        caps.iter().any(|c| c.in_error),
        "positions inside recovery cannot be trusted (03 §2.3)"
    );
}

#[test]
fn quality_is_ok_for_a_clean_file_and_poor_for_a_wrecked_one() {
    let queries = compile("typescript", &[]).expect("compile");
    let good = chickadee_parse::scan(b"const a = 1;\n", &queries, BIG).expect("scan");
    assert_eq!(good.quality, "ok");
    assert_eq!(good.line_count, 2);

    let wrecked = "}{ ) ( ]] [[ ;;\n".repeat(60);
    let bad = chickadee_parse::scan(wrecked.as_bytes(), &queries, BIG).expect("scan");
    assert_eq!(bad.quality, "poor");
}

#[test]
fn sql_parses_and_a_migration_is_ordinary_input() {
    let queries = compile(
        "sql",
        &[Spec {
            id: "sql/create-table".to_owned(),
            scm: "(create_table) @site".to_owned(),
        }],
    )
    .expect("compile");
    let out = chickadee_parse::scan(b"CREATE TABLE t (id INTEGER PRIMARY KEY);\n", &queries, BIG)
        .expect("scan");
    assert_eq!(out.quality, "ok");
    assert_eq!(out.captures.len(), 1);
}

#[test]
fn tsx_and_ts_use_different_grammars() {
    let queries = compile(
        "tsx",
        &[Spec {
            id: "ts/jsx".to_owned(),
            scm: "(jsx_element) @site".to_owned(),
        }],
    )
    .expect("compile");
    let out = chickadee_parse::scan(b"const a = <div>hi</div>;\n", &queries, BIG).expect("scan");
    assert_eq!(out.captures.len(), 1);
    assert_eq!(out.quality, "ok");
}

#[test]
fn a_file_over_the_byte_limit_is_refused_before_parsing() {
    let queries = compile("typescript", &[]).expect("compile");
    let err = chickadee_parse::scan(&[b'a'; 200], &queries, 100).expect_err("too large");
    assert!(matches!(
        err,
        ParseError::TooLarge {
            bytes: 200,
            max: 100
        }
    ));
}

#[test]
fn the_flattened_tree_carries_text_on_leaves_only() {
    let tree = chickadee_parse::ast("typescript", b"const a = 1;", BIG).expect("ast");
    assert_eq!(tree.kind, "program");
    assert!(tree.text.is_none());
    let mut leaves = Vec::new();
    let mut stack = vec![&tree];
    while let Some(node) = stack.pop() {
        if let Some(t) = &node.text {
            leaves.push(t.clone());
        }
        stack.extend(node.children.iter());
    }
    assert!(leaves.contains(&"const".to_owned()));
    assert!(leaves.contains(&"1".to_owned()));
}

#[test]
fn a_tree_deeper_than_the_limit_is_refused() {
    let deep = format!("const a = {}1{};", "(".repeat(600), ")".repeat(600));
    assert!(matches!(
        chickadee_parse::ast("typescript", deep.as_bytes(), BIG),
        Err(ParseError::TooDeep { .. })
    ));
}

#[test]
fn excerpts_stop_at_two_hundred_characters_on_a_character_boundary() {
    let long = format!("const a = res.user?.{};", "가".repeat(400));
    let caps = scan(
        "typescript",
        &long,
        "ts/optional-chaining",
        OPTIONAL_CHAINING,
    );
    let sites = named(&caps, "site");
    assert_eq!(sites.len(), 1);
    assert_eq!(sites[0].excerpt.chars().count(), 200);
}
