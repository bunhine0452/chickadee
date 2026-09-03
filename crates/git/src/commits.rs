//! History walk and per-commit diff (03 §1.3 · §1.4).

use serde::Serialize;

use crate::{GitError, Out, Repo};

/// Renames below this similarity are left as delete + add. 50 % is git's own
/// default; counting a rename as 500 added lines poisons the answer key (03 §1.4).
const RENAME_SIMILARITY: u16 = 50;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommitMeta {
    pub sha: String,
    /// First parent only. Merges keep `parent_count` for the classifier in TS.
    pub parent_sha: Option<String>,
    pub parent_count: u32,
    pub authored_at: i64,
    pub author_email: Option<String>,
    pub author_name: Option<String>,
    /// Subject line. Bodies are never stored (03 §1.4).
    pub subject: String,
    pub files_n: u32,
    pub insertions: u32,
    pub deletions: u32,
    pub truncated: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangedFile {
    pub path: String,
    pub old_path: Option<String>,
    /// `A` `M` `D` `R`.
    pub status: char,
    pub additions: u32,
    pub deletions: u32,
    /// Compressed `[from, to]` ranges of the new side's added lines.
    pub touched: Vec<[u32; 2]>,
}

#[derive(Debug, Clone, Copy)]
pub struct HistoryOpts<'a> {
    pub limit: usize,
    pub max_files: usize,
    /// Stop before this commit — the previous head, for an incremental pass.
    pub since: Option<&'a str>,
}

impl Repo {
    /// Walks HEAD newest first and hands each commit to `on`. Returning `false`
    /// from `on` stops the walk, which is how cancellation gets in.
    ///
    /// No first-parent simplification: a merged branch would hide every commit
    /// inside it, and those are exactly the ones worth studying (03 §1.3).
    pub fn history(
        &self,
        opts: HistoryOpts<'_>,
        on: &mut dyn FnMut(CommitMeta, Vec<ChangedFile>) -> bool,
    ) -> Out<usize> {
        let mut walk = self.inner.revwalk()?;
        walk.set_sorting(git2::Sort::TOPOLOGICAL | git2::Sort::TIME)?;
        if walk.push_head().is_err() {
            return Ok(0);
        }
        if let Some(since) = opts.since {
            if let Ok(oid) = git2::Oid::from_str(since) {
                drop(walk.hide(oid));
            }
        }
        let mailmap = self.inner.mailmap().ok();
        let mut seen = 0usize;
        for oid in walk.take(opts.limit) {
            let commit = self.inner.find_commit(oid?)?;
            let author = mailmap
                .as_ref()
                .and_then(|m| commit.author_with_mailmap(m).ok())
                .unwrap_or_else(|| commit.author());
            let (files, insertions, deletions, truncated) =
                self.changed(&commit, opts.max_files)?;
            let meta = CommitMeta {
                sha: commit.id().to_string(),
                parent_sha: commit.parent_id(0).ok().map(|p| p.to_string()),
                parent_count: u32::try_from(commit.parent_count()).unwrap_or(u32::MAX),
                authored_at: author.when().seconds() * 1_000,
                author_email: author.email().ok().map(str::to_owned),
                author_name: author.name().ok().map(str::to_owned),
                subject: commit
                    .summary()
                    .ok()
                    .flatten()
                    .unwrap_or_default()
                    .to_owned(),
                files_n: u32::try_from(files.len()).unwrap_or(u32::MAX),
                insertions,
                deletions,
                truncated,
            };
            seen += 1;
            if !on(meta, files) {
                break;
            }
        }
        Ok(seen)
    }

    /// Commits reachable from `from` but not from `to`. Empty means `to` moved
    /// straight forward; anything else is a rebase or force-push (03 §1.6).
    pub fn dropped(&self, from: &str, to: &str) -> Out<Vec<String>> {
        let old =
            git2::Oid::from_str(from).map_err(|_| GitError::CommitNotFound(from.to_owned()))?;
        if self.inner.find_commit(old).is_err() {
            return Err(GitError::CommitNotFound(from.to_owned()));
        }
        let mut walk = self.inner.revwalk()?;
        walk.push(old)?;
        if let Ok(new) = git2::Oid::from_str(to) {
            drop(walk.hide(new));
        }
        walk.map(|o| Ok(o?.to_string())).collect()
    }

    /// The commit's diff against its first parent, renames already matched.
    /// Merges give `None` — a combined diff invents changes nobody wrote.
    ///
    /// `only` narrows it to one path. Both callers must share these options: the
    /// answer key compares `additions` from `changed()` with hunks from
    /// `file_diff()`, and different whitespace rules would make them disagree.
    fn diff_of(
        &self,
        commit: &git2::Commit<'_>,
        only: Option<&str>,
    ) -> Out<Option<git2::Diff<'_>>> {
        if commit.parent_count() > 1 {
            return Ok(None);
        }
        let mut opts = git2::DiffOptions::new();
        // Whitespace-only edits come out 0/0 and drop out of the answer key by
        // themselves; 0 context lines keeps the payload to the changed lines.
        opts.context_lines(0)
            .ignore_whitespace(true)
            .include_typechange(false);
        if let Some(path) = only {
            opts.pathspec(path);
        }
        let parent = commit.parent(0).ok();
        let parent_tree = parent.as_ref().map(git2::Commit::tree).transpose()?;
        let mut diff = self.inner.diff_tree_to_tree(
            parent_tree.as_ref(),
            Some(&commit.tree()?),
            Some(&mut opts),
        )?;
        let mut find = git2::DiffFindOptions::new();
        find.renames(true).rename_threshold(RENAME_SIMILARITY);
        diff.find_similar(Some(&mut find))?;
        Ok(Some(diff))
    }

    fn changed(
        &self,
        commit: &git2::Commit<'_>,
        max_files: usize,
    ) -> Out<(Vec<ChangedFile>, u32, u32, bool)> {
        let Some(diff) = self.diff_of(commit, None)? else {
            return Ok((Vec::new(), 0, 0, false));
        };
        let total = diff.deltas().len();
        let truncated = total > max_files;
        let mut files = Vec::with_capacity(total.min(max_files));
        let (mut insertions, mut deletions) = (0u32, 0u32);
        for idx in 0..total.min(max_files) {
            let delta = diff.get_delta(idx).ok_or(GitError::Bare)?;
            let Some(path) = delta.new_file().path().or_else(|| delta.old_file().path()) else {
                continue;
            };
            let one = git2::Patch::from_diff(&diff, idx)?;
            let (adds, dels, touched) = one.map_or((0, 0, Vec::new()), |p| lines_of(&p));
            insertions = insertions.saturating_add(adds);
            deletions = deletions.saturating_add(dels);
            let old_path = delta.old_file().path().map(rel_of);
            files.push(ChangedFile {
                path: rel_of(path),
                old_path: old_path.filter(|p| Some(p.as_str()) != Some(&rel_of(path))),
                status: status_of(delta.status()),
                additions: adds,
                deletions: dels,
                touched,
            });
        }
        Ok((files, insertions, deletions, truncated))
    }
}

/// Only the new side's `+` lines are kept: the old ones are not in HEAD any more,
/// so nothing could point at them (03 §1.4).
fn lines_of(patch: &git2::Patch<'_>) -> (u32, u32, Vec<[u32; 2]>) {
    let (mut adds, mut dels) = (0u32, 0u32);
    let mut spans: Vec<[u32; 2]> = Vec::new();
    for h in 0..patch.num_hunks() {
        let Ok(count) = patch.num_lines_in_hunk(h) else {
            continue;
        };
        for l in 0..count {
            let Ok(line) = patch.line_in_hunk(h, l) else {
                continue;
            };
            match line.origin() {
                '+' => {
                    adds += 1;
                    if let Some(n) = line.new_lineno() {
                        match spans.last_mut() {
                            Some(last) if last[1] + 1 == n => last[1] = n,
                            _ => spans.push([n, n]),
                        }
                    }
                }
                '-' => dels += 1,
                _ => {}
            }
        }
    }
    (adds, dels, spans)
}

pub(crate) fn status_of(delta: git2::Delta) -> char {
    match delta {
        git2::Delta::Added | git2::Delta::Untracked => 'A',
        git2::Delta::Deleted => 'D',
        git2::Delta::Renamed | git2::Delta::Copied => 'R',
        _ => 'M',
    }
}

/// Repository-relative, `/` separated on every platform (01 §2).
fn rel_of(path: &std::path::Path) -> String {
    path.components()
        .filter_map(|c| match c {
            std::path::Component::Normal(s) => Some(s.to_string_lossy()),
            _ => None,
        })
        .collect::<Vec<_>>()
        .join("/")
}

/// Added text one call returns. Past this the tail is dropped and `truncated`
/// says so — the reader wants to know what kind of lines were added, not to
/// rebuild the file.
const MAX_DIFF_BYTES: usize = 65_536;

/// The new side's added lines for one path in one commit (01 §3.1 · D98).
///
/// Status, `additions` and `deletions` are **not** repeated here — `commit_file`
/// stored them at ingest, and shipping the whole patch would send more of the
/// user's code across IPC than any reader needs.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileDiff {
    pub rel_path: String,
    /// `+` lines, origin byte and trailing newline stripped.
    pub added: Vec<String>,
    pub truncated: bool,
}

impl Repo {
    /// The lines one commit added to one path. Merges give nothing, same as
    /// `history()` — a combined diff invents changes nobody wrote.
    ///
    /// A path this commit did not touch comes back empty rather than as an error:
    /// the caller reads `commit_file` rows, and a truncated commit has rows for
    /// files the walk never produced (03 §1.4).
    pub fn file_diff(&self, sha: &str, rel_path: &str) -> Out<FileDiff> {
        let mut out = FileDiff {
            rel_path: rel_path.to_owned(),
            added: Vec::new(),
            truncated: false,
        };
        let oid = git2::Oid::from_str(sha).map_err(|_| GitError::CommitNotFound(sha.to_owned()))?;
        let commit = self
            .inner
            .find_commit(oid)
            .map_err(|_| GitError::CommitNotFound(sha.to_owned()))?;
        let Some(diff) = self.diff_of(&commit, Some(rel_path))? else {
            return Ok(out);
        };
        // Renames are matched on the new side, which is where the caller looks.
        let want = Some(rel_path.to_owned());
        let Some(idx) = diff.deltas().position(|d| {
            d.new_file()
                .path()
                .or_else(|| d.old_file().path())
                .map(rel_of)
                == want
        }) else {
            return Ok(out);
        };
        let Some(patch) = git2::Patch::from_diff(&diff, idx)? else {
            return Ok(out);
        };
        let mut budget = MAX_DIFF_BYTES;
        for h in 0..patch.num_hunks() {
            let Ok(count) = patch.num_lines_in_hunk(h) else {
                continue;
            };
            for l in 0..count {
                let Ok(line) = patch.line_in_hunk(h, l) else {
                    continue;
                };
                if line.origin() != '+' {
                    continue;
                }
                let text = String::from_utf8_lossy(line.content())
                    .trim_end()
                    .to_owned();
                if text.len() > budget {
                    out.truncated = true;
                    return Ok(out);
                }
                budget -= text.len();
                out.added.push(text);
            }
        }
        Ok(out)
    }
}
