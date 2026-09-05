//! 문법 품질 측정 (03 §2.2 · 구현 체크리스트 「Swift·Dart·SQL 품질 검증」).
//!
//! 커뮤니티 문법은 실코드에서 ERROR 를 쏟을 수 있다. 「쓸 수 있다」는 판단은 실제 파일로
//! 재야 하고, 못 재면 못 쟀다고 말해야 한다 — 그 결정이 00 §6-2(품질 미달이면 언어 보류)다.
//!
//! 지금 빌드에 든 문법은 `typescript`·`tsx`·`javascript`·`sql` 넷이다. Swift 와 Dart 는
//! 크레이트를 아직 걸지 않았다 — 03 §2.2 가 적은 위험(수십 MB parser.c, crates.io 미배포
//! 구간) 때문에 3-OS 빌드에 얹기 전에 따로 판단할 일이다.

use std::path::{Path, PathBuf};

use chickadee_parse::compile;

/// 03 §2.3 — 파일이 `poor` 로 떨어지는 경계.
const POOR_SHARE_LIMIT: f64 = 0.20;
const MAX_BYTES: usize = 512 * 1024;

fn files_under(root: &Path, ext: &str, limit: usize) -> Vec<PathBuf> {
    let mut out = Vec::new();
    let mut stack = vec![root.to_path_buf()];
    while let Some(at) = stack.pop() {
        let Ok(entries) = std::fs::read_dir(&at) else {
            continue;
        };
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                if path.file_name().is_some_and(|n| n == ".git") {
                    continue;
                }
                stack.push(path);
            } else if path.extension().is_some_and(|e| e == ext) {
                out.push(path);
            }
        }
    }
    out.sort();
    out.truncate(limit);
    out
}

/// `(파일 수, poor 수)`
fn measure(grammar: &str, files: &[PathBuf]) -> (usize, usize) {
    let queries = compile(grammar, &[]).expect("compile");
    let mut poor = 0;
    for file in files {
        let Ok(bytes) = std::fs::read(file) else {
            continue;
        };
        match chickadee_parse::scan(&bytes, &queries, MAX_BYTES) {
            Ok(out) if out.quality == "poor" => {
                poor += 1;
                println!(
                    "  poor: {}",
                    file.file_name().unwrap_or_default().to_string_lossy()
                );
            }
            Ok(_) => {}
            Err(e) => {
                poor += 1;
                println!("  err : {e}");
            }
        }
    }
    (files.len(), poor)
}

fn fixture(name: &str) -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../fixtures/repos")
        .join(name)
        .components()
        .collect()
}

#[test]
fn sql_migrations_parse_cleanly_enough_to_ship() {
    let root = fixture("projectox-like");
    if !root.is_dir() {
        eprintln!("skip: bash scripts/make-fixture-repo.sh projectox-like 를 먼저 돌린다");
        return;
    }
    let files = files_under(&root, "sql", 20);
    assert!(files.len() >= 10, "SQL 파일이 {} 개뿐이다", files.len());
    let (n, poor) = measure("sql", &files);
    #[allow(clippy::cast_precision_loss)]
    let share = poor as f64 / n as f64;
    println!("sql: {n} 파일 중 poor {poor} ({:.0}%)", share * 100.0);
    assert!(
        share <= POOR_SHARE_LIMIT,
        "SQL 문법이 실코드에서 {poor}/{n} 을 못 읽는다"
    );
}

#[test]
fn typescript_parses_this_repository_cleanly() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../packages")
        .components()
        .collect::<PathBuf>();
    let files = files_under(&root, "ts", 40);
    assert!(files.len() >= 20, "TS 파일이 {} 개뿐이다", files.len());
    let (n, poor) = measure("typescript", &files);
    println!("typescript: {n} 파일 중 poor {poor}");
    // 기준 언어다. 실코드에서 하나라도 poor 면 문법 쪽을 봐야 한다.
    assert_eq!(poor, 0);
}

#[test]
fn tsx_parses_the_component_files_cleanly() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../packages/ui/src")
        .components()
        .collect::<PathBuf>();
    let files = files_under(&root, "tsx", 20);
    assert!(files.len() >= 10, "TSX 파일이 {} 개뿐이다", files.len());
    let (n, poor) = measure("tsx", &files);
    println!("tsx: {n} 파일 중 poor {poor}");
    assert_eq!(poor, 0);
}

/// `packages/dictionary/src/schema.ts` 의 `GRAMMARS` 표를 읽는다 — `(문법 키, 링크됐나)`.
///
/// 사전 쪽 스키마는 문법 **이름의 규약**(D19)이라 아직 안 링크된 이름도 받는다. 링크 여부의
/// 정본은 이 크레이트의 `LANGS` 이고, 두 곳이 어긋나면 사전은 「쓸 수 있다」고 하는데
/// 파서가 없는 상태가 된다. 표를 손으로 파싱하는 이유: 이 대조 하나 때문에 빌드 단계를
/// 새로 만들 값이 없다. 표는 `키: true|false,` 한 줄씩이라 모양이 단순하다.
fn declared_grammars() -> Vec<(String, bool)> {
    let at: PathBuf = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../packages/dictionary/src/schema.ts")
        .components()
        .collect();
    let text = std::fs::read_to_string(&at).expect("schema.ts");
    let body = text
        .split_once("export const GRAMMARS = {")
        .expect("schema.ts 에 GRAMMARS 표가 없다")
        .1
        .split_once("} as const")
        .expect("GRAMMARS 표가 안 닫혔다")
        .0;
    let row = regex_lite::Regex::new(r"(?m)^\s*([a-z_]+)\s*:\s*(true|false)\s*,").expect("regex");
    let out: Vec<(String, bool)> = row
        .captures_iter(body)
        .map(|c| (c[1].to_owned(), &c[2] == "true"))
        .collect();
    assert!(out.len() >= 10, "GRAMMARS 표를 {} 줄만 읽었다", out.len());
    out
}

/// **파서 없는 언어를 조용히 통과시키지 않는다** (D187 ⑨).
///
/// 예전에는 이 못이 `swift`·`dart` **두 이름만** 지켰다. 그래서 C# 문법은 아무 경고 없이
/// 들어올 수 있었고(`csharp.md` §0.7), 반대로 사전이 `grammars: [c_sharp]` 를 걸어도
/// 캡처만 0곳인 채 전부 초록이었다. 이제 목록이 아니라 **표 전체**를 양방향으로 본다:
/// 크레이트를 넣고 `schema.ts` 를 안 고쳐도, 표만 고치고 크레이트를 안 넣어도 빨개진다.
#[test]
fn the_dictionary_schema_agrees_with_the_grammars_actually_linked() {
    let linked: Vec<String> = chickadee_parse::languages()
        .into_iter()
        .map(|l| l.grammar)
        .collect();
    let declared = declared_grammars();

    for (grammar, says_linked) in &declared {
        let really = linked.contains(grammar);
        assert_eq!(
            *says_linked, really,
            "{grammar}: schema.ts 의 GRAMMARS 는 {says_linked} 인데 링크된 문법은 {really} 다 — \
             크레이트를 넣었으면 실코드 20파일 ERROR 비율을 재고 표를 true 로, \
             뺐으면 false 로 고쳐라 (00 §6-2)"
        );
    }
    for grammar in &linked {
        assert!(
            declared.iter().any(|(name, _)| name == grammar),
            "{grammar} 이 빌드에는 있는데 schema.ts 의 GRAMMARS 에 없다 — 사전이 이 문법을 못 건다"
        );
    }
}
