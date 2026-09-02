//! Reading file bytes and blame (01 §3.2).

use std::time::Instant;

use serde::Serialize;

use crate::{GitError, Out, Repo};

/// 1-based, closed interval.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Span {
    pub start: u32,
    pub end: u32,
    pub sha: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Blame {
    pub hunks: Vec<Span>,
}

impl Repo {
    /// Bytes of one file: from the work tree when `rev` is `None`, else from that
    /// commit's tree. The path is checked against the root either way.
    pub fn bytes(&self, rel: &str, rev: Option<&str>) -> Out<Vec<u8>> {
        let Some(rev) = rev else {
            let at = self.locate(rel)?;
            return std::fs::read(&at).map_err(|_| GitError::BadPath(rel.to_owned()));
        };
        let oid = git2::Oid::from_str(rev).map_err(|_| GitError::CommitNotFound(rev.to_owned()))?;
        let commit = self
            .inner
            .find_commit(oid)
            .map_err(|_| GitError::CommitNotFound(rev.to_owned()))?;
        let entry = commit
            .tree()?
            .get_path(std::path::Path::new(rel))
            .map_err(|_| GitError::BadPath(rel.to_owned()))?;
        Ok(self.inner.find_blob(entry.id())?.content().to_vec())
    }

    /// Which commit each line last came from. libgit2 offers no way to interrupt
    /// a blame, so `budget_ms` is checked once it returns — the result is thrown
    /// away and the caller gives up on that file (03 §1.5).
    pub fn blame(&self, rel: &str, rev: Option<&str>, budget_ms: u64) -> Out<Blame> {
        self.locate(rel)?;
        let mut opts = git2::BlameOptions::new();
        opts.track_copies_same_file(false);
        if let Some(rev) = rev {
            let oid =
                git2::Oid::from_str(rev).map_err(|_| GitError::CommitNotFound(rev.to_owned()))?;
            opts.newest_commit(oid);
        }
        let started = Instant::now();
        let blame = self
            .inner
            .blame_file(std::path::Path::new(rel), Some(&mut opts))?;
        let elapsed = u64::try_from(started.elapsed().as_millis()).unwrap_or(u64::MAX);
        if elapsed > budget_ms {
            return Err(GitError::BlameTimeout { ms: elapsed });
        }
        let hunks = blame
            .iter()
            .map(|h| {
                let start = u32::try_from(h.final_start_line()).unwrap_or(1);
                let len = u32::try_from(h.lines_in_hunk()).unwrap_or(1);
                Span {
                    start,
                    end: start + len.saturating_sub(1),
                    sha: h.final_commit_id().to_string(),
                }
            })
            .collect();
        Ok(Blame { hunks })
    }
}

/// UTF-8 with replacement characters, plus whether anything had to be replaced.
/// Files that are not UTF-8 still make usable material — refusing them would drop
/// whole repositories over one stray byte (01 §2).
#[must_use]
pub fn lossy(bytes: &[u8]) -> (String, bool) {
    match std::str::from_utf8(bytes) {
        Ok(s) => (s.to_owned(), false),
        Err(_) => (String::from_utf8_lossy(bytes).into_owned(), true),
    }
}
