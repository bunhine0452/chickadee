//! Single-file components: three languages in one file (D159).
//!
//! A `.vue` file holds `<template>`, `<script>` and `<style>`. Only the script is
//! JavaScript, so the parser is told to read **just those byte ranges**
//! (`set_included_ranges`). Positions stay absolute to the whole file, which is
//! what keeps a capture pointing at the right line of the real source.
//!
//! The scan is bytes, not a parse: `<script>` inside a template string or a
//! comment would fool it. That is the trade for not carrying a fourth grammar.

use tree_sitter::{Point, Range};

/// Grammars whose files are read range by range rather than whole.
pub(crate) fn is_embedded(grammar: &str) -> bool {
    matches!(grammar, "vue" | "mybatis_sql")
}

/// The ranges a given embedded grammar reads.
pub(crate) fn ranges_for(grammar: &str, src: &[u8]) -> Vec<Range> {
    match grammar {
        "mybatis_sql" => statement_bodies(src),
        _ => script_ranges(src),
    }
}

fn find(hay: &[u8], needle: &[u8], from: usize) -> Option<usize> {
    if from >= hay.len() || needle.len() > hay.len() - from {
        return None;
    }
    hay[from..]
        .windows(needle.len())
        .position(|w| w == needle)
        .map(|i| i + from)
}

fn point_at(src: &[u8], at: usize) -> Point {
    let before = &src[..at.min(src.len())];
    let row = before.iter().filter(|&&b| b == b'\n').count();
    let start = before.iter().rposition(|&b| b == b'\n').map_or(0, |i| i + 1);
    Point::new(row, before.len() - start)
}

/// The `<script>` bodies, in order. Empty when there is none — the caller then
/// parses nothing rather than reading the template as JavaScript.
pub(crate) fn script_ranges(src: &[u8]) -> Vec<Range> {
    let mut out = Vec::new();
    let mut at = 0usize;
    while let Some(open) = find(src, b"<script", at) {
        let Some(gt) = find(src, b">", open) else { break };
        let start = gt + 1;
        let Some(end) = find(src, b"</script", start) else { break };
        if end > start {
            out.push(Range {
                start_byte: start,
                end_byte: end,
                start_point: point_at(src, start),
                end_point: point_at(src, end),
            });
        }
        at = end;
    }
    out
}

/// The SQL inside a MyBatis mapper's statement elements.
///
/// A body holding `<` is a dynamic statement (`<if>`, `<foreach>`): XML tags sit
/// inside the SQL and no SQL grammar reads that. Those are skipped rather than
/// fed in broken — on the repo this was built against, 2 of 49 statements.
pub(crate) fn statement_bodies(src: &[u8]) -> Vec<Range> {
    const TAGS: [&[u8]; 4] = [b"<select", b"<insert", b"<update", b"<delete"];
    let mut out = Vec::new();
    let mut at = 0usize;
    loop {
        let Some(open) = TAGS.iter().filter_map(|t| find(src, t, at)).min() else {
            break;
        };
        let Some(gt) = find(src, b">", open) else { break };
        let start = gt + 1;
        let Some(end) = find(src, b"</", start) else { break };
        if end > start && !src[start..end].contains(&b'<') {
            out.push(Range {
                start_byte: start,
                end_byte: end,
                start_point: point_at(src, start),
                end_point: point_at(src, end),
            });
        }
        at = end;
    }
    out
}
