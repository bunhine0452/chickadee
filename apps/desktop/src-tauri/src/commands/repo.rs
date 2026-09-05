//! Everything that needs a work tree on disk (01 §3.2).
//!
//! The ledger — which repositories exist, where they moved, what to purge — is
//! SQL, so it lives in TS (D65). What is left here needs libgit2 or the file system.

use std::path::Path;

use chickadee_git::Repo;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use crate::error::IpcError;

/// Reading is capped so one call cannot cross the 1 MiB response limit (01 §2).
const MAX_LINES: u32 = 2_000;
const MAX_BLOCK: usize = 65_536;
const BLAME_MS: u64 = 2_000;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RepoProbe {
    pub root_path: String,
    pub fingerprint: String,
    pub head_commit: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LinesChunk {
    pub rel_path: String,
    pub rev: Option<String>,
    pub from: u32,
    pub to: u32,
    pub lines: Vec<String>,
    pub total_lines: u32,
    pub had_invalid_utf8: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Block {
    pub rel_path: String,
    pub rev: Option<String>,
    pub start_byte: usize,
    pub end_byte: usize,
    pub text: String,
}

/// Copies a remote repository into `into` and reports it the way `repo_probe` does —
/// the ledger side stays in TS (D65), so this writes nothing but the work tree itself.
/// `into` is a full path the caller built; it must not exist yet (D129).
///
/// Blocking work on a pool thread: libgit2 has no async form and this one call can run
/// for minutes on a large repository.
#[tauri::command]
pub async fn repo_clone(url: String, into: String) -> Result<RepoProbe, IpcError> {
    tauri::async_runtime::spawn_blocking(move || {
        let repo = Repo::clone_into(&url, Path::new(&into))?;
        let (fingerprint, head_commit) = repo.identity()?;
        Ok(RepoProbe {
            root_path: repo.root().to_string_lossy().into_owned(),
            fingerprint,
            head_commit,
        })
    })
    .await
    .map_err(|_| IpcError::new("GIT_IO", "the copy did not finish", true))?
}

/// Finds the work tree root above `path` and reports its identity. Registering,
/// listing, moving and removing are built on top of this in TS.
#[tauri::command]
pub fn repo_probe(path: String) -> Result<RepoProbe, IpcError> {
    let repo = Repo::open(Path::new(&path))?;
    let (fingerprint, head_commit) = repo.identity()?;
    Ok(RepoProbe {
        root_path: repo.root().to_string_lossy().into_owned(),
        fingerprint,
        head_commit,
    })
}

/// `rev` picks the committed bytes; without it the work tree wins, which is where
/// uncommitted work lives — and that is the user's code too (03 §1.7).
#[tauri::command]
pub fn file_read_lines(
    root_path: String,
    rel_path: String,
    from: u32,
    to: u32,
    rev: Option<String>,
) -> Result<LinesChunk, IpcError> {
    if to < from || to - from >= MAX_LINES {
        return Err(IpcError::new(
            "BAD_INPUT",
            "한 번에 2000줄까지 읽습니다.",
            false,
        ));
    }
    let repo = Repo::open(Path::new(&root_path))?;
    let (text, had_invalid_utf8) = chickadee_git::lossy(&repo.bytes(&rel_path, rev.as_deref())?);
    let all: Vec<&str> = text.split('\n').collect();
    let total = u32::try_from(all.len()).unwrap_or(u32::MAX);
    let start = from.max(1).min(total) as usize - 1;
    let end = (to.min(total) as usize).max(start);
    Ok(LinesChunk {
        rel_path,
        rev,
        from,
        to,
        lines: all[start..end].iter().map(|l| (*l).to_owned()).collect(),
        total_lines: total,
        had_invalid_utf8,
    })
}

#[tauri::command]
pub fn file_read_block(
    root_path: String,
    rel_path: String,
    start_byte: usize,
    end_byte: usize,
    rev: Option<String>,
) -> Result<Block, IpcError> {
    if end_byte < start_byte || end_byte - start_byte > MAX_BLOCK {
        return Err(IpcError::new(
            "BAD_INPUT",
            "한 번에 64 KiB까지 읽습니다.",
            false,
        ));
    }
    let repo = Repo::open(Path::new(&root_path))?;
    let bytes = repo.bytes(&rel_path, rev.as_deref())?;
    let slice = bytes
        .get(start_byte..end_byte.min(bytes.len()))
        .unwrap_or_default();
    Ok(Block {
        rel_path,
        rev,
        start_byte,
        end_byte,
        text: chickadee_git::lossy(slice).0,
    })
}

/// The second pass that gives a use site its commit. Called one file at a time in
/// the background, because blame is minutes on a large repository (03 §1.5).
#[tauri::command]
pub fn git_blame_lines(
    root_path: String,
    rel_path: String,
    rev: Option<String>,
) -> Result<chickadee_git::Blame, IpcError> {
    let repo = Repo::open(Path::new(&root_path))?;
    Ok(repo.blame(&rel_path, rev.as_deref(), BLAME_MS)?)
}

/// One file's patch inside one commit. The T2 answer key reads it to tell an
/// import-only change from a real one (04 §8.1); everything else it needs is
/// already in `commit_file` (D64).
#[tauri::command]
pub fn git_diff_text(
    root_path: String,
    sha: String,
    rel_path: String,
) -> Result<chickadee_git::FileDiff, IpcError> {
    let repo = Repo::open(Path::new(&root_path))?;
    Ok(repo.file_diff(&sha, &rel_path)?)
}

#[tauri::command]
pub fn parse_langs() -> Vec<chickadee_parse::LangInfo> {
    chickadee_parse::languages()
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnippetQuery {
    pub id: String,
    pub scm: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SnippetResult {
    pub ast: chickadee_parse::Ast,
    pub captures: Vec<chickadee_parse::Capture>,
    pub had_error: bool,
}

fn errored(node: &chickadee_parse::Ast) -> bool {
    node.kind == "ERROR" || node.children.iter().any(errored)
}

/// One block of typed-in code, parsed once at grading time (04 §4.5). Arguments
/// arrive one by one, like every other command but `ingest_start` (D87). Without
/// `queries` nothing is matched, so the snippet is parsed exactly once. The share
/// of `ERROR` nodes is counted in TS, which already has the tree.
#[tauri::command]
pub fn parse_snippet(
    grammar: String,
    text: String,
    queries: Option<Vec<SnippetQuery>>,
) -> Result<SnippetResult, IpcError> {
    let src = text.as_bytes();
    let ast = chickadee_parse::ast(&grammar, src, MAX_BLOCK)?;
    let specs: Vec<chickadee_parse::Spec> = queries
        .unwrap_or_default()
        .into_iter()
        .map(|q| chickadee_parse::Spec {
            id: q.id,
            scm: q.scm,
        })
        .collect();
    let captures = if specs.is_empty() {
        Vec::new()
    } else {
        chickadee_parse::scan(src, &chickadee_parse::compile(&grammar, &specs)?, MAX_BLOCK)?
            .captures
    };
    Ok(SnippetResult {
        had_error: errored(&ast),
        ast,
        captures,
    })
}

/// Opens a folder in the platform's file manager. The path comes from the caller,
/// so it is opened, never read.
#[tauri::command]
pub fn app_reveal(app: AppHandle, which: String, at: Option<String>) -> Result<(), IpcError> {
    use tauri_plugin_opener::OpenerExt;
    let target = match (which.as_str(), at) {
        ("repo", Some(path)) => path,
        (kind, _) => {
            let paths = crate::commands::app::app_paths(app.clone())?;
            if kind == "logs" {
                paths.log_dir
            } else {
                paths.data_dir
            }
        }
    };
    app.opener()
        .open_path(target, None::<&str>)
        .map_err(|e| IpcError::new("FS_NOT_FOUND", e.to_string(), false))
}
