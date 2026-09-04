#![forbid(unsafe_code)]

//! tree-sitter shell (01 §2). Its nouns are grammars, bytes, AST nodes and
//! captures. It never opens a `.scm` file or a `.yaml` file — the caller hands it
//! query text, and what a query means is decided in TS (D1 · D40).

mod ast;
mod langs;
mod query;
mod sfc;

use std::cell::RefCell;
use std::collections::HashMap;
use std::time::{Duration, Instant};

use tree_sitter::{Parser, Tree};

pub use ast::Ast;
pub use langs::{languages, LangInfo, LANGS};
pub use query::{compile, Capture, Queries, Scan, Spec};

/// Excerpts are for showing one line back, not for storing the file (D2).
pub const EXCERPT_CHARS: usize = 200;
/// Deeper than this and a file is an attack, not a program (06 §4.1).
pub const MAX_DEPTH: usize = 512;
/// Per file, checked while parsing (03 §2.3).
pub const TIMEOUT: Duration = Duration::from_secs(2);

#[derive(Debug, thiserror::Error)]
pub enum ParseError {
    #[error("no grammar for {0}")]
    UnsupportedLang(String),
    #[error("query {id} does not compile at {row}:{col}")]
    QueryInvalid { id: String, row: u32, col: u32 },
    #[error("{bytes} bytes is over the {max} byte limit")]
    TooLarge { bytes: usize, max: usize },
    #[error("parsing took longer than {ms} ms")]
    Timeout { ms: u64 },
    #[error("tree is deeper than {depth}")]
    TooDeep { depth: usize },
}

thread_local! {
    /// One parser per grammar per thread. `Parser` is `Send` but not `Sync`, so a
    /// shared pool would have to lock on every file (03 §2.4).
    static PARSERS: RefCell<HashMap<String, Parser>> = RefCell::new(HashMap::new());
}

/// Every query in `queries` over one file. The tree is dropped before returning —
/// holding trees is what turns a 100k-line repository into a gigabyte (03 §7).
pub fn scan(src: &[u8], queries: &Queries, max_bytes: usize) -> Result<Scan, ParseError> {
    if src.len() > max_bytes {
        return Err(ParseError::TooLarge {
            bytes: src.len(),
            max: max_bytes,
        });
    }
    if sfc::is_embedded(&queries.grammar) {
        return scan_ranges(src, queries);
    }
    with_tree(&queries.grammar, src, |tree| Ok(queries.run(tree, src)))
}

/// One parse per embedded range.
///
/// tree-sitter reads several included ranges as **one joined document**, so a node
/// can span two of them and report an excerpt covering the gap between. That is
/// wrong for a MyBatis mapper, where each statement is its own SQL, and for a Vue
/// file with both `<script>` and `<script setup>`. Parsing them one at a time costs
/// a parse per range and gives each its own tree.
fn scan_ranges(src: &[u8], queries: &Queries) -> Result<Scan, ParseError> {
    let lines = u32::try_from(src.iter().filter(|&&b| b == b'\n').count()).unwrap_or(u32::MAX) + 1;
    let mut captures = Vec::new();
    let mut quality = "ok";
    for range in sfc::ranges_for(&queries.grammar, src) {
        let one = with_tree_ranged(&queries.grammar, src, Some(&[range]), |tree| {
            Ok(queries.run(tree, src))
        })?;
        if one.quality == "poor" {
            quality = "poor";
        }
        captures.extend(one.captures);
    }
    Ok(Scan {
        captures,
        quality,
        line_count: lines,
    })
}

/// The flattened tree of a snippet — what TS compares two blocks with (04).
pub fn ast(grammar: &str, src: &[u8], max_bytes: usize) -> Result<Ast, ParseError> {
    if src.len() > max_bytes {
        return Err(ParseError::TooLarge {
            bytes: src.len(),
            max: max_bytes,
        });
    }
    with_tree(grammar, src, |tree| ast::flatten(tree.root_node(), src))
}

/// Parses, hands the tree to `f`, then drops it. The progress callback is the only
/// place a runaway parse can be stopped; without it a crafted file never returns.
fn with_tree<T>(
    grammar: &str,
    src: &[u8],
    f: impl FnOnce(&Tree) -> Result<T, ParseError>,
) -> Result<T, ParseError> {
    with_tree_ranged(grammar, src, None, f)
}

/// `ranges` narrows what is read. `None` reads the whole file.
fn with_tree_ranged<T>(
    grammar: &str,
    src: &[u8],
    ranges: Option<&[tree_sitter::Range]>,
    f: impl FnOnce(&Tree) -> Result<T, ParseError>,
) -> Result<T, ParseError> {
    let lang = langs::language_of(grammar)
        .ok_or_else(|| ParseError::UnsupportedLang(grammar.to_owned()))?;
    PARSERS.with(|cell| {
        let mut pool = cell.borrow_mut();
        if !pool.contains_key(grammar) {
            let mut fresh = Parser::new();
            fresh
                .set_language(&lang)
                .map_err(|_| ParseError::UnsupportedLang(grammar.to_owned()))?;
            pool.insert(grammar.to_owned(), fresh);
        }
        let parser = pool.get_mut(grammar).expect("just inserted");
        // 한 파일에 언어가 여럿이면 읽을 자리를 좁힌다 (D159). 파서는 문법마다 재사용되므로
        // **매번 새로 지정한다** — 앞 파일의 구간이 남으면 조용히 틀린다. 비우면 tree-sitter 가
        // 문서 전체를 읽으므로, 좁힐 것이 없을 때는 빈 구간을 줘서 아무것도 안 읽게 한다.
        if sfc::is_embedded(grammar) {
            let empty = [tree_sitter::Range {
                start_byte: 0,
                end_byte: 0,
                start_point: tree_sitter::Point::new(0, 0),
                end_point: tree_sitter::Point::new(0, 0),
            }];
            let _ = parser.set_included_ranges(ranges.unwrap_or(&empty));
        }
        let started = Instant::now();
        let mut over = |_: &tree_sitter::ParseState| started.elapsed() > TIMEOUT;
        let opts = tree_sitter::ParseOptions::new().progress_callback(&mut over);
        let tree = parser
            .parse_with_options(
                &mut |at, _| src.get(at..).unwrap_or_default(),
                None,
                Some(opts),
            )
            .ok_or_else(|| ParseError::Timeout {
                ms: u64::try_from(started.elapsed().as_millis()).unwrap_or(u64::MAX),
            })?;
        f(&tree)
    })
}
