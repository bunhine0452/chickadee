//! 골든 픽스처를 여는 공통 부분 — `golden.rs` 와 `insta.rs` 가 같은 파일을 같은 쿼리로 읽는다.
//!
//! 두 테스트가 쓰는 것이 서로 달라 한쪽에서만 불리는 항목이 생긴다.
#![allow(dead_code)]

use std::path::{Path, PathBuf};

use chickadee_parse::{compile, Scan, Spec};

/// 픽스처는 전부 작다 — 큰 파일 정책(03 §2.5)이 걸릴 일이 없는 한도.
pub const BIG: usize = 512 * 1024;
/// 함정 케이스만 모아 두는 디렉터리 (06 §1.2).
pub const TRAPS: &str = "_traps";

/// 골든 디렉터리 하나의 뜻. `ts` 디렉터리는 문법 `typescript` 다 —
/// 디렉터리 이름·문법 키·확장자가 서로 같지 않아 표로 적는다.
pub struct Dir {
    /// `fixtures/golden/` 아래의 이름.
    pub name: &'static str,
    /// `chickadee_parse::languages()` 가 아는 문법 키.
    pub grammar: &'static str,
    /// 케이스 코드 파일의 확장자.
    pub ext: &'static str,
    /// `dictionary/<lang>/` — 쿼리를 사전에서 가져올 때의 언어 디렉터리.
    /// `None` 이면 케이스마다 `<케이스>.query.scm` 이 옆에 있어야 한다.
    pub lang: Option<&'static str>,
}

pub const DIRS: &[Dir] = &[
    Dir {
        name: "ts",
        grammar: "typescript",
        ext: "ts",
        lang: Some("ts"),
    },
    Dir {
        name: "tsx",
        grammar: "tsx",
        ext: "tsx",
        lang: Some("ts"),
    },
    Dir {
        name: "sql",
        grammar: "sql",
        ext: "sql",
        lang: None,
    },
];

pub fn root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()
        .expect("리포 뿌리")
}

pub fn dir_of(name: &str) -> &'static Dir {
    DIRS.iter()
        .find(|d| d.name == name)
        .unwrap_or_else(|| panic!("fixtures/golden/{name} 은 표에 없는 디렉터리다"))
}

/// 코드 파일 하나와 그 옆의 기대 파일.
pub struct Case {
    pub dir: &'static Dir,
    pub concept: String,
    pub stem: String,
}

impl Case {
    pub fn new(dir: &str, concept: &str, stem: &str) -> Self {
        Self {
            dir: dir_of(dir),
            concept: concept.to_owned(),
            stem: stem.to_owned(),
        }
    }

    pub fn folder(&self) -> PathBuf {
        root()
            .join("fixtures/golden")
            .join(self.dir.name)
            .join(&self.concept)
    }

    pub fn code(&self) -> PathBuf {
        self.folder()
            .join(format!("{}.{}", self.stem, self.dir.ext))
    }

    pub fn expected(&self) -> PathBuf {
        self.folder().join(format!("{}.expected.json", self.stem))
    }

    /// 리포 뿌리 기준의 경로. 절대 경로는 기계마다 달라 스냅샷에도 실패 문구에도 넣지 않는다.
    pub fn rel(&self) -> String {
        format!(
            "fixtures/golden/{}/{}/{}.{}",
            self.dir.name, self.concept, self.stem, self.dir.ext
        )
    }

    /// 사전이 이 쿼리를 부르는 이름. `_` 로 시작하는 것은 예약된 시스템 쿼리라
    /// 언어 앞머리가 붙지 않는다 (03 §3.1 · §3.2).
    pub fn query_id(&self) -> String {
        if self.concept.starts_with('_') {
            return self.concept.clone();
        }
        format!(
            "{}/{}",
            self.dir.lang.unwrap_or(self.dir.name),
            self.concept
        )
    }

    /// 케이스 옆의 `<케이스>.query.scm` 이 먼저고, 없으면 사전의 개념 쿼리다.
    pub fn scm(&self) -> String {
        let beside = self.folder().join(format!("{}.query.scm", self.stem));
        if beside.is_file() {
            return std::fs::read_to_string(&beside)
                .unwrap_or_else(|e| panic!("{}: {e}", self.rel()));
        }
        let Some(lang) = self.dir.lang else {
            panic!(
                "{}: 사전에 개념이 없는 언어다 — 옆에 {}.query.scm 을 두어라",
                self.rel(),
                self.stem
            );
        };
        let at = root()
            .join("dictionary")
            .join(lang)
            .join(format!("{}.scm", self.concept));
        std::fs::read_to_string(&at).unwrap_or_else(|_| {
            panic!(
                "{}: {} 도 옆의 {}.query.scm 도 없다",
                self.rel(),
                at.display(),
                self.stem
            )
        })
    }

    pub fn scan(&self) -> Scan {
        let src = std::fs::read(self.code()).unwrap_or_else(|e| panic!("{}: {e}", self.rel()));
        let queries = compile(
            self.dir.grammar,
            &[Spec {
                id: self.query_id(),
                scm: self.scm(),
            }],
        )
        .unwrap_or_else(|e| panic!("{}: {e}", self.rel()));
        chickadee_parse::scan(&src, &queries, BIG).unwrap_or_else(|e| panic!("{}: {e}", self.rel()))
    }
}

/// 디렉터리를 훑어 케이스를 모은다. 순서는 경로 오름차순이라 실패 목록이 매번 같다.
pub fn cases_of(dir: &str) -> Vec<Case> {
    let at = dir_of(dir);
    let base = root().join("fixtures/golden").join(at.name);
    let mut out = Vec::new();
    for concept in sorted_names(&base) {
        let folder = base.join(&concept);
        if !folder.is_dir() {
            continue;
        }
        for file in sorted_names(&folder) {
            let path = Path::new(&file);
            if !path.extension().is_some_and(|e| e == at.ext) {
                continue;
            }
            let stem = path
                .file_stem()
                .and_then(|s| s.to_str())
                .expect("파일 이름")
                .to_owned();
            out.push(Case {
                dir: at,
                concept: concept.clone(),
                stem,
            });
        }
    }
    out
}

pub fn cases() -> Vec<Case> {
    DIRS.iter().flat_map(|d| cases_of(d.name)).collect()
}

fn sorted_names(at: &Path) -> Vec<String> {
    let mut out: Vec<String> = std::fs::read_dir(at)
        .unwrap_or_else(|e| panic!("{}: {e}", at.display()))
        .filter_map(Result::ok)
        .filter_map(|e| e.file_name().into_string().ok())
        .collect();
    out.sort();
    out
}
