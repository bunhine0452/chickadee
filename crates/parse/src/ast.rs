//! The tree, flattened to plain data (01 §3.1 `AstLite`).
//!
//! Only leaves carry text. Interior nodes would repeat the whole file at every
//! level, and the comparison in TS only ever reads the leaves.

use serde::Serialize;
use tree_sitter::Node;

use crate::{ParseError, MAX_DEPTH};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Ast {
    pub kind: String,
    pub named: bool,
    pub start: u32,
    pub end: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    pub children: Vec<Ast>,
}

pub(crate) fn flatten(root: Node<'_>, src: &[u8]) -> Result<Ast, ParseError> {
    step(root, src, 0)
}

fn step(node: Node<'_>, src: &[u8], depth: usize) -> Result<Ast, ParseError> {
    if depth > MAX_DEPTH {
        return Err(ParseError::TooDeep { depth });
    }
    let mut cursor = node.walk();
    let mut children = Vec::new();
    for child in node.children(&mut cursor) {
        children.push(step(child, src, depth + 1)?);
    }
    let text = children.is_empty().then(|| {
        String::from_utf8_lossy(
            src.get(node.start_byte()..node.end_byte().min(src.len()))
                .unwrap_or_default(),
        )
        .into_owned()
    });
    Ok(Ast {
        kind: node.kind().to_owned(),
        named: node.is_named(),
        start: u32::try_from(node.start_byte()).unwrap_or(u32::MAX),
        end: u32::try_from(node.end_byte()).unwrap_or(u32::MAX),
        text,
        children,
    })
}
