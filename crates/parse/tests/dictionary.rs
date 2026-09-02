//! The dictionary's `.scm` files, checked against the grammars that will run them
//! (03 §5.1). Rust does not read YAML in the app (D40) — this is a test, which is
//! outside the line budget and outside the forbidden-word rule.
//!
//! What it catches is the failure that is otherwise silent: a grammar upgrade
//! renames a node, the query still compiles, and it matches nothing forever.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

use chickadee_parse::{compile, Capture, Spec};
use serde::Deserialize;

const BIG: usize = 512 * 1024;
/// 03 §3.2. Anything else in a query is a name nothing downstream knows.
const CAPTURE: &str =
    r"^(site|pick\.[1-9]|hole|ctx\.[a-z_]+|import\.source|block\.(function|name))$";

#[derive(Debug, Deserialize)]
struct Concept {
    id: String,
    grammars: Vec<String>,
    #[serde(default)]
    queries: Vec<QueryRef>,
    #[serde(default)]
    examples: Vec<Example>,
}

#[derive(Debug, Deserialize)]
struct QueryRef {
    grammars: Vec<String>,
    file: String,
}

#[derive(Debug, Deserialize)]
struct Example {
    code: String,
    expect: serde_yaml::Value,
}

fn root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../dictionary")
        .canonicalize()
        .expect("dictionary")
}

fn langs() -> Vec<String> {
    let mut out: Vec<String> = std::fs::read_dir(root())
        .expect("dictionary")
        .filter_map(|e| e.ok())
        .filter(|e| e.path().join("_lang.yaml").is_file())
        .filter_map(|e| e.file_name().into_string().ok())
        .collect();
    out.sort();
    out
}

fn concepts() -> Vec<(PathBuf, Concept)> {
    let mut out = Vec::new();
    for lang in langs() {
        let dir = root().join(&lang);
        let mut files: Vec<PathBuf> = std::fs::read_dir(&dir)
            .expect("lang dir")
            .filter_map(|e| e.ok().map(|e| e.path()))
            .filter(|p| p.extension().is_some_and(|e| e == "yaml"))
            .filter(|p| p.file_name().is_some_and(|n| n != "_lang.yaml"))
            .collect();
        files.sort();
        for file in files {
            let text = std::fs::read_to_string(&file).expect("read");
            let concept: Concept =
                serde_yaml::from_str(&text).unwrap_or_else(|e| panic!("{}: {e}", file.display()));
            out.push((file, concept));
        }
    }
    out
}

fn scm_of(file: &Path, concept: &Concept, entry: &QueryRef) -> String {
    let at = file
        .parent()
        .expect("parent")
        .join(entry.file.trim_start_matches("./"));
    std::fs::read_to_string(&at)
        .unwrap_or_else(|_| panic!("{}: {} 이 없다", concept.id, entry.file))
}

fn run(grammar: &str, id: &str, scm: &str, code: &str) -> Vec<Capture> {
    let queries = compile(
        grammar,
        &[Spec {
            id: id.to_owned(),
            scm: scm.to_owned(),
        }],
    )
    .unwrap_or_else(|e| panic!("{id} ({grammar}): {e}"));
    chickadee_parse::scan(code.as_bytes(), &queries, BIG)
        .unwrap_or_else(|e| panic!("{id}: {e}"))
        .captures
}

#[test]
fn there_is_at_least_one_language_to_check() {
    assert!(
        !langs().is_empty(),
        "dictionary/<lang>/_lang.yaml 이 하나도 없다"
    );
}

#[test]
fn every_system_query_compiles_for_every_grammar_of_its_language() {
    #[derive(Deserialize)]
    struct Meta {
        grammars: Vec<String>,
    }
    for lang in langs() {
        let dir = root().join(&lang);
        let meta: Meta = serde_yaml::from_str(
            &std::fs::read_to_string(dir.join("_lang.yaml")).expect("_lang.yaml"),
        )
        .expect("meta");
        for id in ["_imports", "_blocks"] {
            let at = dir.join(format!("{id}.scm"));
            let Ok(scm) = std::fs::read_to_string(&at) else {
                continue;
            };
            for grammar in &meta.grammars {
                let out = run(grammar, id, &scm, "");
                assert!(out.is_empty(), "빈 입력에서 매치가 나오면 패턴이 너무 넓다");
            }
        }
    }
}

#[test]
fn every_concept_query_compiles_for_the_grammars_it_claims() {
    for (file, concept) in concepts() {
        for entry in &concept.queries {
            let scm = scm_of(&file, &concept, entry);
            for grammar in &entry.grammars {
                assert!(
                    concept.grammars.contains(grammar),
                    "{}: queries 가 grammars 에 없는 {grammar} 을 건다",
                    concept.id
                );
                run(grammar, &concept.id, &scm, "");
            }
        }
    }
}

#[test]
fn every_capture_name_is_one_the_pipeline_knows() {
    let allowed = regex_lite::Regex::new(CAPTURE).expect("regex");
    for (file, concept) in concepts() {
        for entry in &concept.queries {
            let scm = scm_of(&file, &concept, entry);
            for name in scm.match_indices('@').filter_map(|(at, _)| {
                scm[at + 1..]
                    .split(|c: char| !(c.is_ascii_alphanumeric() || c == '.' || c == '_'))
                    .next()
            }) {
                assert!(
                    allowed.is_match(name),
                    "{}: @{name} 은 규약 밖이다",
                    concept.id
                );
            }
        }
    }
}

/// A pattern that matches nothing in any of its own examples is dead — that is the
/// shape a silent grammar break takes (03 §5.1).
#[test]
fn no_pattern_is_dead_and_every_example_matches_what_it_says() {
    for (file, concept) in concepts() {
        if concept.examples.is_empty() {
            continue;
        }
        for entry in &concept.queries {
            let scm = scm_of(&file, &concept, entry);
            let grammar = entry.grammars.first().expect("one grammar");
            let mut positive = 0usize;
            for example in &concept.examples {
                let caps = run(grammar, &concept.id, &scm, &example.code);
                let sites = caps.iter().filter(|c| c.name == "site").count();
                check(&concept.id, example, sites, &caps);
                positive += sites;
            }
            assert!(
                positive > 0,
                "{} ({grammar}): 어떤 예시에서도 매치가 없다 — 죽은 패턴이다",
                concept.id
            );
        }
    }
}

fn check(id: &str, example: &Example, sites: usize, caps: &[Capture]) {
    if example.expect.as_str() == Some("none") {
        assert_eq!(
            sites, 0,
            "{id}: 음성 예시에서 매치가 났다\n{}",
            example.code
        );
        return;
    }
    let map = example
        .expect
        .as_mapping()
        .expect("expect 는 매핑이거나 none");
    let get = |key: &str| map.get(serde_yaml::Value::String(key.to_owned()));
    if let Some(n) = get("sites").and_then(serde_yaml::Value::as_u64) {
        assert_eq!(sites as u64, n, "{id}: sites\n{}", example.code);
    } else {
        assert!(
            sites > 0,
            "{id}: 양성 예시인데 매치가 없다\n{}",
            example.code
        );
    }
    // picks·ctx·form·hole 은 정렬 첫 Site 기준이다 (03 §4.4).
    let Some(first) = caps
        .iter()
        .filter(|c| c.name == "site")
        .min_by_key(|c| (c.start_byte, c.end_byte))
    else {
        return;
    };
    if let Some(form) = get("form").and_then(serde_yaml::Value::as_str) {
        assert_eq!(first.form.as_deref(), Some(form), "{id}: form");
    }
    let same: BTreeMap<&str, &str> = caps
        .iter()
        .filter(|c| c.match_id == first.match_id)
        .map(|c| (c.name.as_str(), c.excerpt.as_str()))
        .collect();
    if let Some(hole) = get("hole").and_then(serde_yaml::Value::as_str) {
        assert_eq!(same.get("hole"), Some(&hole), "{id}: hole");
    }
    for (group, prefix) in [("picks", "pick."), ("ctx", "ctx.")] {
        let Some(wanted) = get(group).and_then(serde_yaml::Value::as_mapping) else {
            continue;
        };
        for (key, value) in wanted {
            let name = format!("{prefix}{}", scalar(key));
            let text = value.as_str().expect("문자열");
            let seen = same.get(name.as_str()).copied().unwrap_or_else(|| {
                // ctx 는 맥락 패턴에서 올 수도 있어 매치가 다르다 (03 §3.2).
                caps.iter()
                    .find(|c| c.name == name)
                    .map_or("", |c| c.excerpt.as_str())
            });
            assert_eq!(seen, text, "{id}: @{name}\n{}", example.code);
        }
    }
}

fn scalar(v: &serde_yaml::Value) -> String {
    v.as_str().map(str::to_owned).unwrap_or_else(|| {
        v.as_u64()
            .map(|n| n.to_string())
            .unwrap_or_else(|| String::new())
    })
}
