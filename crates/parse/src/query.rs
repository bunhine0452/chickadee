//! Compiling `.scm` files and running them over one file (03 §3.2 · §3.4).
//!
//! Rust groups nothing and interprets nothing: it hands back one row per capture,
//! tagged with the match it belongs to, and TS builds meaning from that (D1 · D18).

use serde::Serialize;
use streaming_iterator::StreamingIterator;
use tree_sitter::{Node, Query, QueryCursor, Tree};

use crate::{ParseError, EXCERPT_CHARS};

/// Beyond this a pattern is pathological rather than useful (03 §2.4).
const MATCH_LIMIT: u32 = 1024;
/// Share of ERROR + MISSING bytes above which a file is called poor (03 §2.3).
const POOR_BYTE_RATIO: f64 = 0.05;
/// A single unrecoverable region this long means the same thing (03 §2.3).
const POOR_ERROR_LINES: u32 = 40;

/// One `.scm` file with the id it answers to — an id from the dictionary, or
/// the reserved `_imports` / `_blocks`.
#[derive(Debug, Clone)]
pub struct Spec {
    pub id: String,
    pub scm: String,
}

/// Queries compiled once for one grammar and shared across threads —
/// `Query` is `Send + Sync`, `QueryCursor` is not (03 §2.4).
pub struct Queries {
    pub(crate) grammar: String,
    items: Vec<(String, Query)>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Capture {
    pub query_id: String,
    /// Running number within the file. Without it the picks and the hole of one
    /// match cannot be put back together (D18).
    pub match_id: u32,
    pub pattern_index: u32,
    /// `site` · `pick.N` · `hole` · `ctx.<name>` · `import.source` · `block.function` · `block.name`
    pub name: String,
    /// `(#set! form "…")` on the pattern.
    pub form: Option<String>,
    pub node_kind: String,
    pub in_error: bool,
    pub start_byte: u32,
    pub end_byte: u32,
    pub start_line: u32,
    pub end_line: u32,
    pub start_col: u32,
    pub end_col: u32,
    pub excerpt: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Scan {
    pub captures: Vec<Capture>,
    /// `ok` | `poor`
    pub quality: &'static str,
    pub line_count: u32,
}

/// Compiles every `.scm` for one grammar. A query that does not compile is a
/// dictionary bug and names itself (01 §6).
pub fn compile(grammar: &str, specs: &[Spec]) -> Result<Queries, ParseError> {
    let lang = crate::langs::language_of(grammar)
        .ok_or_else(|| ParseError::UnsupportedLang(grammar.to_owned()))?;
    let mut items = Vec::with_capacity(specs.len());
    for spec in specs {
        let query = Query::new(&lang, &spec.scm).map_err(|e| ParseError::QueryInvalid {
            id: spec.id.clone(),
            row: u32::try_from(e.row).unwrap_or_default() + 1,
            col: u32::try_from(e.column).unwrap_or_default() + 1,
        })?;
        items.push((spec.id.clone(), query));
    }
    Ok(Queries {
        grammar: grammar.to_owned(),
        items,
    })
}

impl Queries {
    #[must_use]
    pub fn len(&self) -> usize {
        self.items.len()
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.items.is_empty()
    }

    pub(crate) fn run(&self, tree: &Tree, src: &[u8]) -> Scan {
        let root = tree.root_node();
        let mut captures = Vec::new();
        let mut match_id = 0u32;
        for (id, query) in &self.items {
            let names = query.capture_names();
            let mut cursor = QueryCursor::new();
            cursor.set_match_limit(MATCH_LIMIT);
            let mut hits = cursor.matches(query, root, src);
            while let Some(m) = hits.next() {
                match_id += 1;
                let form = form_of(query, m.pattern_index);
                for cap in m.captures {
                    captures.push(row(
                        id,
                        match_id,
                        m.pattern_index,
                        names[cap.index as usize],
                        form.clone(),
                        cap.node,
                        src,
                    ));
                }
            }
        }
        Scan {
            captures,
            quality: quality_of(root, src.len()),
            line_count: u32::try_from(root.end_position().row).unwrap_or(u32::MAX) + 1,
        }
    }
}

fn form_of(query: &Query, pattern: usize) -> Option<String> {
    query
        .property_settings(pattern)
        .iter()
        .find(|p| &*p.key == "form")
        .and_then(|p| p.value.as_deref())
        .map(str::to_owned)
}

fn row(
    id: &str,
    match_id: u32,
    pattern: usize,
    name: &str,
    form: Option<String>,
    node: Node<'_>,
    src: &[u8],
) -> Capture {
    let start = node.start_position();
    let end = node.end_position();
    Capture {
        query_id: id.to_owned(),
        match_id,
        pattern_index: u32::try_from(pattern).unwrap_or_default(),
        name: name.to_owned(),
        form,
        node_kind: node.kind().to_owned(),
        in_error: in_error(node),
        start_byte: u32::try_from(node.start_byte()).unwrap_or(u32::MAX),
        end_byte: u32::try_from(node.end_byte()).unwrap_or(u32::MAX),
        start_line: u32::try_from(start.row).unwrap_or(u32::MAX) + 1,
        end_line: u32::try_from(end.row).unwrap_or(u32::MAX) + 1,
        start_col: u32::try_from(start.column).unwrap_or(u32::MAX),
        end_col: u32::try_from(end.column).unwrap_or(u32::MAX),
        excerpt: excerpt(src, node.start_byte(), node.end_byte()),
    }
}

/// Overlapping an ERROR, or having one within three levels of ancestry. Inside a
/// recovered region the token positions are wrong, so TS drops those matches
/// rather than pointing at the wrong character (03 §2.3).
fn in_error(node: Node<'_>) -> bool {
    let mut at = Some(node);
    for _ in 0..4 {
        let Some(n) = at else { return false };
        if n.is_error() || n.is_missing() {
            return true;
        }
        at = n.parent();
    }
    false
}

fn excerpt(src: &[u8], from: usize, to: usize) -> String {
    let slice = src.get(from..to.min(src.len())).unwrap_or_default();
    let text = String::from_utf8_lossy(slice);
    match text.char_indices().nth(EXCERPT_CHARS) {
        Some((cut, _)) => text[..cut].to_owned(),
        None => text.into_owned(),
    }
}

/// Walked only when the tree says it has an error, so clean files pay nothing.
fn quality_of(root: Node<'_>, bytes: usize) -> &'static str {
    if !root.has_error() || bytes == 0 {
        return "ok";
    }
    let mut cursor = root.walk();
    let mut broken = 0usize;
    let mut widest = 0u32;
    let mut down = true;
    loop {
        if down {
            let node = cursor.node();
            if node.is_error() || node.is_missing() {
                broken += node.end_byte().saturating_sub(node.start_byte());
                let lines = u32::try_from(node.end_position().row - node.start_position().row)
                    .unwrap_or(u32::MAX);
                widest = widest.max(lines);
                // Nothing inside a broken region tells us more than the region does.
                down = false;
                continue;
            }
        }
        if down && cursor.goto_first_child() {
            continue;
        }
        if cursor.goto_next_sibling() {
            down = true;
            continue;
        }
        if !cursor.goto_parent() {
            break;
        }
        down = false;
    }
    #[allow(clippy::cast_precision_loss)]
    let ratio = broken as f64 / bytes as f64;
    if ratio > POOR_BYTE_RATIO || widest > POOR_ERROR_LINES {
        "poor"
    } else {
        "ok"
    }
}
