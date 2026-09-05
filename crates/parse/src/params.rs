//! Bind placeholders, blanked before the SQL grammar reads them.
//!
//! `tree-sitter-sequel` has no rule for `:name` or for `MyBatis`'s `#{name}`, and it does
//! not fail loudly on either. `:name` leaves an `(ERROR)` sibling inside a live
//! `binary_expression`; `#{name}` is worse — the right operand is re-read as a
//! `unary_expression` whose operand is a `field`, so a query anchored on a comparison
//! matches, reports `in_error = false`, and points at a **column** where a value goes.
//! The mapper of the sample repository holds 114 of those.
//!
//! The blanking runs before the parse and keeps every byte offset: a placeholder of n
//! bytes becomes a quoted literal of n bytes. Queries and excerpts are then run against
//! the **original** bytes, so a capture still shows the person `#{userId}` — only the
//! parser ever sees the stand-in. A literal is the right stand-in because it is what the
//! placeholder is: the driver puts a value there, not a column name. (`@name` parses, but
//! as a `field`, which is the same lie in a different hat.)
//!
//! Text inside string literals, quoted identifiers and comments is left alone — a clock
//! value like `'12:30'` would otherwise be cut in half.

/// Blanks every placeholder, or `None` when the file has none — the common case, and the
/// one where a copy of the bytes would be pure cost.
pub(crate) fn blanked(grammar: &str, src: &[u8]) -> Option<Vec<u8>> {
    if !matches!(grammar, "sql" | "mybatis_sql") {
        return None;
    }
    let mut out: Option<Vec<u8>> = None;
    let mut at = 0usize;
    while at < src.len() {
        let b = src[at];
        // A skipped span is copied through untouched; only its end matters here.
        if let Some(end) = skipped(src, at) {
            at = end;
            continue;
        }
        let span = match b {
            b'#' | b'$' if src.get(at + 1) == Some(&b'{') => {
                find(src, at + 2, b'}').map(|close| close + 1)
            }
            b':' if src.get(at + 1).is_some_and(|c| word_start(*c)) => {
                Some(at + 1 + src[at + 1..].iter().take_while(|c| word(**c)).count())
            }
            _ => None,
        };
        let Some(end) = span else {
            at += 1;
            continue;
        };
        let buf = out.get_or_insert_with(|| src.to_vec());
        buf[at] = b'\'';
        buf[end - 1] = b'\'';
        for i in at + 1..end - 1 {
            buf[i] = if word(src[i]) { src[i] } else { b'_' };
        }
        at = end;
    }
    out
}

/// The end of a run the blanking must not enter, if one starts here.
fn skipped(src: &[u8], at: usize) -> Option<usize> {
    match src[at] {
        // `''` inside a string ends one run and opens the next, which is the same span.
        q @ (b'\'' | b'"' | b'`') => Some(find(src, at + 1, q).map_or(src.len(), |i| i + 1)),
        b'-' if src.get(at + 1) == Some(&b'-') => {
            Some(find(src, at + 2, b'\n').map_or(src.len(), |i| i + 1))
        }
        b'/' if src.get(at + 1) == Some(&b'*') => Some(close_comment(src, at + 2)),
        _ => None,
    }
}

fn find(src: &[u8], from: usize, byte: u8) -> Option<usize> {
    src.get(from..)?.iter().position(|b| *b == byte).map(|i| i + from)
}

fn close_comment(src: &[u8], from: usize) -> usize {
    let mut at = from;
    while at + 1 < src.len() {
        if src[at] == b'*' && src[at + 1] == b'/' {
            return at + 2;
        }
        at += 1;
    }
    src.len()
}

fn word(b: u8) -> bool {
    b.is_ascii_alphanumeric() || b == b'_'
}

fn word_start(b: u8) -> bool {
    b.is_ascii_alphabetic() || b == b'_'
}

#[cfg(test)]
mod tests {
    use super::blanked;

    fn text(src: &str) -> String {
        String::from_utf8(blanked("sql", src.as_bytes()).unwrap()).unwrap()
    }

    #[test]
    fn a_placeholder_becomes_a_literal_of_the_same_width() {
        let src = "WHERE id = #{userId}";
        let got = text(src);
        assert_eq!(got.len(), src.len());
        assert_eq!(got, "WHERE id = '_userId'");
    }

    #[test]
    fn the_sqlite_form_is_blanked_too() {
        assert_eq!(text("WHERE id = :userId"), "WHERE id = 'userI'");
    }

    #[test]
    fn a_clock_value_inside_a_string_is_left_alone() {
        assert!(blanked("sql", b"WHERE t = '12:30' AND u = :id").is_some());
        assert_eq!(text("WHERE t = '12:30' AND u = :id"), "WHERE t = '12:30' AND u = 'i'");
    }

    #[test]
    fn a_comment_is_left_alone() {
        assert!(blanked("sql", b"-- see :ref\nWHERE a = 1").is_none());
    }

    #[test]
    fn a_file_without_placeholders_copies_nothing() {
        assert!(blanked("sql", b"WHERE a = 1").is_none());
        assert!(blanked("typescript", b"WHERE a = #{x}").is_none());
    }
}
