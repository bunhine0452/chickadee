#![forbid(unsafe_code)]

//! libgit2 shell (01 §2). Its nouns are paths, bytes, commits, diffs and blame
//! hunks — nothing above that. Everything it returns is plain data.
//!
//! Repositories are untrusted input (06 §4.1): libgit2 never runs hooks, and no
//! path leaves this crate without being checked against the work tree root.

mod blob;
mod commits;

use std::collections::BTreeMap;
use std::path::{Component, Path, PathBuf};

pub use blob::{lossy, Blame, Span};
pub use commits::{ChangedFile, CommitMeta, FileDiff, HistoryOpts};

#[derive(Debug, thiserror::Error)]
pub enum GitError {
    #[error("no repository at the given path")]
    NotARepo(PathBuf),
    #[error("repository has no work tree")]
    Bare,
    #[error("no such commit")]
    CommitNotFound(String),
    #[error("blame took longer than {ms} ms")]
    BlameTimeout { ms: u64 },
    #[error("path escapes the work tree")]
    BadPath(String),
    #[error("only https:// is fetched")]
    BadUrl,
    #[error("there is already something at the destination")]
    Occupied,
    #[error("libgit2: {}", .0.class() as i32)]
    Lib(#[from] git2::Error),
}

type Out<T> = Result<T, GitError>;

/// An opened work tree. Not `Sync` — libgit2 objects are per-thread.
pub struct Repo {
    inner: git2::Repository,
    root: PathBuf,
}

impl Repo {
    /// `discover` walks up, so choosing a subfolder still finds the root (03 §1.1).
    pub fn open(path: &Path) -> Out<Repo> {
        let inner =
            git2::Repository::discover(path).map_err(|_| GitError::NotARepo(path.to_path_buf()))?;
        let root = inner
            .workdir()
            .ok_or(GitError::Bare)?
            .canonicalize()
            .map_err(|_| GitError::Bare)?;
        Ok(Repo { inner, root })
    }

    /// Copies the repository at `url` into `into` and opens it (D129). Only `https://`:
    /// ssh would need keys, a local path is what `open` is for, and every extra scheme is
    /// one more thing to trust. libgit2 runs no hooks, so nothing in what arrives executes
    /// (06 §4.1) — it is read as data, like any other work tree.
    ///
    /// `into` must not exist. Writing into a folder that already holds something is how a
    /// half-written tree gets mixed with someone else's files, and neither side survives.
    pub fn clone_into(url: &str, into: &Path) -> Out<Repo> {
        if !url.starts_with("https://") {
            return Err(GitError::BadUrl);
        }
        if into.exists() {
            return Err(GitError::Occupied);
        }
        git2::Repository::clone(url, into)?;
        Repo::open(into)
    }

    #[must_use]
    pub fn root(&self) -> &Path {
        &self.root
    }

    /// `(fingerprint, head)`. The fingerprint is the sorted parentless commits
    /// joined with `-`; it is `""` while the repository has no commits (D44).
    pub fn identity(&self) -> Out<(String, Option<String>)> {
        let Some(head) = self.head_oid()? else {
            return Ok((String::new(), None));
        };
        let mut walk = self.inner.revwalk()?;
        walk.push(head)?;
        let mut roots: Vec<String> = Vec::new();
        for oid in walk {
            let oid = oid?;
            if self.inner.find_commit(oid)?.parent_count() == 0 {
                roots.push(oid.to_string());
            }
        }
        roots.sort_unstable();
        Ok((roots.join("-"), Some(head.to_string())))
    }

    /// `path -> blob oid` for every file in the HEAD tree. Absent HEAD gives an
    /// empty map, which makes every work tree file read as untracked.
    pub fn tree_oids(&self) -> Out<BTreeMap<String, String>> {
        let mut out = BTreeMap::new();
        let Some(head) = self.head_oid()? else {
            return Ok(out);
        };
        let tree = self.inner.find_commit(head)?.tree()?;
        tree.walk(git2::TreeWalkMode::PreOrder, |dir, entry| {
            if entry.kind() == Some(git2::ObjectType::Blob) {
                if let Ok(name) = entry.name() {
                    out.insert(format!("{dir}{name}"), entry.id().to_string());
                }
            }
            git2::TreeWalkResult::Ok
        })?;
        Ok(out)
    }

    /// `.gitattributes linguist-generated` — the GitHub convention, reused (03 §1.3).
    #[must_use]
    pub fn is_generated(&self, rel: &str) -> bool {
        self.inner
            .get_attr(
                Path::new(rel),
                "linguist-generated",
                git2::AttrCheckFlags::empty(),
            )
            .ok()
            .flatten()
            .is_some_and(|v| v == "true" || v == "set")
    }

    fn head_oid(&self) -> Out<Option<git2::Oid>> {
        match self.inner.head() {
            Ok(r) => Ok(r.target()),
            // An unborn branch is a repository without commits, not a failure.
            Err(e) if e.code() == git2::ErrorCode::UnbornBranch => Ok(None),
            Err(e) if e.code() == git2::ErrorCode::NotFound => Ok(None),
            Err(e) => Err(e.into()),
        }
    }

    /// Absolute path inside the work tree, or `BadPath`. Rejects absolute inputs,
    /// `..`, and anything that resolves outside the root — symlinks included (06 §4.1).
    fn locate(&self, rel: &str) -> Out<PathBuf> {
        let candidate = Path::new(rel);
        let escapes = candidate.is_absolute()
            || candidate
                .components()
                .any(|c| matches!(c, Component::ParentDir | Component::Prefix(_)));
        if escapes {
            return Err(GitError::BadPath(rel.to_owned()));
        }
        let joined = self.root.join(candidate);
        match joined.canonicalize() {
            Ok(full) if full.starts_with(&self.root) => Ok(full),
            // A path that does not exist yet cannot be a traversal: the component
            // check above already rejected the ways out of the root.
            Err(_) => Ok(joined),
            Ok(_) => Err(GitError::BadPath(rel.to_owned())),
        }
    }
}

/// The blob oid git would give these bytes. One hash carries both change
/// detection and the work tree/HEAD comparison (D20).
#[must_use]
pub fn hash_bytes(bytes: &[u8]) -> String {
    git2::Oid::hash_object(git2::ObjectType::Blob, bytes)
        .map(|o| o.to_string())
        .unwrap_or_default()
}

/// NUL in the first 8 KiB, the same rule libgit2 applies to blobs (03 §1.3).
#[must_use]
pub fn looks_binary(bytes: &[u8]) -> bool {
    bytes.iter().take(8_000).any(|b| *b == 0)
}
