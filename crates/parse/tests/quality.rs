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

/// Swift·Dart 는 크레이트가 빌드에 없다. 이 테스트는 **그 사실을 고정한다** —
/// 누가 크레이트를 넣으면 여기가 빨개지고, 그때 실코드 20파일로 품질을 재야 한다.
#[test]
fn swift_and_dart_are_not_in_the_build_yet() {
    let names: Vec<String> = chickadee_parse::languages()
        .into_iter()
        .map(|l| l.grammar)
        .collect();
    for grammar in ["swift", "dart"] {
        assert!(
            !names.contains(&grammar.to_owned()),
            "{grammar} 문법이 들어왔다 — 실코드 20파일 ERROR 비율을 재고 00 §6-2 를 갱신하라"
        );
    }
}
