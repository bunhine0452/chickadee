//! Temporary repositories built with git2 itself — no `git` binary, no fixture
//! files, so these run identically on every machine and in CI (03 §8).

use std::path::{Path, PathBuf};

use chickadee_git::{GitError, HistoryOpts, Repo};

struct Tmp(PathBuf);

impl Drop for Tmp {
    fn drop(&mut self) {
        drop(std::fs::remove_dir_all(&self.0));
    }
}

fn tmp(name: &str) -> Tmp {
    let at = std::env::temp_dir().join(format!("chickadee-git-{name}-{}", std::process::id()));
    drop(std::fs::remove_dir_all(&at));
    std::fs::create_dir_all(&at).expect("temp dir");
    Tmp(at)
}

fn write(root: &Path, rel: &str, text: &str) {
    let at = root.join(rel);
    std::fs::create_dir_all(at.parent().expect("parent")).expect("mkdir");
    std::fs::write(at, text).expect("write");
}

/// Commits everything in the work tree. Fixed identity and time, so the object
/// ids are the same on every run.
fn commit(repo: &git2::Repository, message: &str) -> git2::Oid {
    let mut index = repo.index().expect("index");
    index
        .add_all(["*"], git2::IndexAddOption::DEFAULT, None)
        .expect("add");
    index.write().expect("index write");
    let tree = repo
        .find_tree(index.write_tree().expect("write tree"))
        .expect("tree");
    let who = git2::Signature::new(
        "fixture",
        "fixture@example.invalid",
        &git2::Time::new(1_767_225_600, 0),
    )
    .expect("signature");
    let parents = repo
        .head()
        .ok()
        .and_then(|h| h.target())
        .and_then(|o| repo.find_commit(o).ok());
    let parent_refs: Vec<&git2::Commit<'_>> = parents.iter().collect();
    repo.commit(Some("HEAD"), &who, &who, message, &tree, &parent_refs)
        .expect("commit")
}

fn init(at: &Path) -> git2::Repository {
    let mut opts = git2::RepositoryInitOptions::new();
    opts.initial_head("main");
    git2::Repository::init_opts(at, &opts).expect("init")
}

#[test]
fn rejects_a_folder_without_git() {
    let dir = tmp("plain");
    assert!(matches!(Repo::open(&dir.0), Err(GitError::NotARepo(_))));
}

#[test]
fn empty_repository_opens_with_an_empty_fingerprint() {
    let dir = tmp("empty");
    init(&dir.0);
    let repo = Repo::open(&dir.0).expect("open");
    let (fingerprint, head) = repo.identity().expect("identity");
    assert_eq!(fingerprint, "");
    assert_eq!(head, None);
    assert!(repo.tree_oids().expect("tree").is_empty());
}

#[test]
fn fingerprint_is_the_root_commit_and_survives_new_commits() {
    let dir = tmp("fingerprint");
    let raw = init(&dir.0);
    write(&dir.0, "a.ts", "export const a = 1;\n");
    let root = commit(&raw, "first");
    let repo = Repo::open(&dir.0).expect("open");
    let (first, head) = repo.identity().expect("identity");
    assert_eq!(first, root.to_string());
    assert_eq!(head, Some(root.to_string()));

    write(&dir.0, "b.ts", "export const b = 2;\n");
    let second = commit(&raw, "second");
    let (again, head2) = repo.identity().expect("identity");
    assert_eq!(again, first, "the root commit does not move");
    assert_eq!(head2, Some(second.to_string()));
}

#[test]
fn tree_oids_match_the_hash_of_the_bytes_on_disk() {
    let dir = tmp("oids");
    let raw = init(&dir.0);
    write(&dir.0, "src/a.ts", "export const a = 1;\n");
    commit(&raw, "first");
    let repo = Repo::open(&dir.0).expect("open");
    let oids = repo.tree_oids().expect("tree");
    let on_disk = chickadee_git::hash_bytes(b"export const a = 1;\n");
    assert_eq!(oids.get("src/a.ts"), Some(&on_disk));

    // A dirty work tree is exactly the case where the two differ (D20).
    write(&dir.0, "src/a.ts", "export const a = 2;\n");
    let dirty = chickadee_git::hash_bytes(&repo.bytes("src/a.ts", None).expect("bytes"));
    assert_ne!(oids.get("src/a.ts"), Some(&dirty));
}

#[test]
fn history_reports_added_lines_as_compressed_ranges() {
    let dir = tmp("history");
    let raw = init(&dir.0);
    write(&dir.0, "a.ts", "one\ntwo\n");
    commit(&raw, "first");
    write(&dir.0, "a.ts", "one\ntwo\nthree\nfour\n");
    commit(&raw, "second");

    let repo = Repo::open(&dir.0).expect("open");
    let mut seen: Vec<(String, Vec<[u32; 2]>)> = Vec::new();
    let n = repo
        .history(
            HistoryOpts {
                limit: 10,
                max_files: 200,
                since: None,
            },
            &mut |meta, files| {
                seen.push((
                    meta.subject.clone(),
                    files.first().map(|f| f.touched.clone()).unwrap_or_default(),
                ));
                true
            },
        )
        .expect("history");
    assert_eq!(n, 2);
    assert_eq!(seen[0].0, "second");
    assert_eq!(
        seen[0].1,
        vec![[3, 4]],
        "lines 3 and 4 collapse into one range"
    );
    assert_eq!(seen[1].0, "first");
    assert_eq!(seen[1].1, vec![[1, 2]]);
}

#[test]
fn history_stops_when_the_callback_says_so() {
    let dir = tmp("cancel");
    let raw = init(&dir.0);
    for i in 0..4 {
        write(&dir.0, "a.ts", &format!("line {i}\n"));
        commit(&raw, &format!("c{i}"));
    }
    let repo = Repo::open(&dir.0).expect("open");
    let mut count = 0;
    repo.history(
        HistoryOpts {
            limit: 10,
            max_files: 200,
            since: None,
        },
        &mut |_, _| {
            count += 1;
            count < 2
        },
    )
    .expect("history");
    assert_eq!(count, 2);
}

#[test]
fn since_hides_everything_up_to_the_previous_head() {
    let dir = tmp("since");
    let raw = init(&dir.0);
    write(&dir.0, "a.ts", "one\n");
    let first = commit(&raw, "first");
    write(&dir.0, "b.ts", "two\n");
    commit(&raw, "second");

    let repo = Repo::open(&dir.0).expect("open");
    let mut subjects = Vec::new();
    repo.history(
        HistoryOpts {
            limit: 10,
            max_files: 200,
            since: Some(&first.to_string()),
        },
        &mut |meta, _| {
            subjects.push(meta.subject);
            true
        },
    )
    .expect("history");
    assert_eq!(subjects, vec!["second".to_owned()]);
}

#[test]
fn a_rename_is_one_file_not_a_delete_plus_an_add() {
    let dir = tmp("rename");
    let raw = init(&dir.0);
    let body = "export const value = 1;\n".repeat(40);
    write(&dir.0, "old.ts", &body);
    commit(&raw, "first");
    std::fs::remove_file(dir.0.join("old.ts")).expect("remove");
    write(&dir.0, "new.ts", &body);
    let mut index = raw.index().expect("index");
    index.remove_all(["*"], None).expect("remove all");
    index.write().expect("write");
    commit(&raw, "moved");

    let repo = Repo::open(&dir.0).expect("open");
    let mut latest = Vec::new();
    repo.history(
        HistoryOpts {
            limit: 1,
            max_files: 200,
            since: None,
        },
        &mut |_, files| {
            latest = files;
            true
        },
    )
    .expect("history");
    assert_eq!(latest.len(), 1, "one entry, not a delete and an add");
    assert_eq!(latest[0].status, 'R');
    assert_eq!(latest[0].path, "new.ts");
    assert_eq!(latest[0].old_path.as_deref(), Some("old.ts"));
}

#[test]
fn whitespace_only_edits_count_as_zero() {
    let dir = tmp("whitespace");
    let raw = init(&dir.0);
    write(&dir.0, "a.ts", "const a = 1;\n");
    commit(&raw, "first");
    write(&dir.0, "a.ts", "const    a   =   1;\n");
    commit(&raw, "reformat");

    let repo = Repo::open(&dir.0).expect("open");
    let mut stats = (1u32, 1u32);
    repo.history(
        HistoryOpts {
            limit: 1,
            max_files: 200,
            since: None,
        },
        &mut |meta, _| {
            stats = (meta.insertions, meta.deletions);
            true
        },
    )
    .expect("history");
    assert_eq!(stats, (0, 0));
}

#[test]
fn max_files_truncates_and_says_so() {
    let dir = tmp("truncate");
    let raw = init(&dir.0);
    for i in 0..5 {
        write(&dir.0, &format!("f{i}.ts"), "const x = 1;\n");
    }
    commit(&raw, "many");

    let repo = Repo::open(&dir.0).expect("open");
    let mut truncated = false;
    let mut n = 0;
    repo.history(
        HistoryOpts {
            limit: 1,
            max_files: 2,
            since: None,
        },
        &mut |meta, files| {
            truncated = meta.truncated;
            n = files.len();
            true
        },
    )
    .expect("history");
    assert!(truncated);
    assert_eq!(n, 2);
}

#[test]
fn dropped_lists_the_commits_a_rebase_left_behind() {
    let dir = tmp("dropped");
    let raw = init(&dir.0);
    write(&dir.0, "a.ts", "one\n");
    let base = commit(&raw, "base");
    write(&dir.0, "a.ts", "two\n");
    let gone = commit(&raw, "will be dropped");

    let repo = Repo::open(&dir.0).expect("open");
    assert_eq!(
        repo.dropped(&gone.to_string(), &gone.to_string())
            .expect("dropped"),
        Vec::<String>::new(),
        "moving straight forward drops nothing"
    );
    let left = repo
        .dropped(&gone.to_string(), &base.to_string())
        .expect("dropped");
    assert_eq!(left, vec![gone.to_string()]);
}

#[test]
fn bytes_reads_the_work_tree_and_a_revision_separately() {
    let dir = tmp("bytes");
    let raw = init(&dir.0);
    write(&dir.0, "a.ts", "committed\n");
    let sha = commit(&raw, "first");
    write(&dir.0, "a.ts", "edited but not committed\n");

    let repo = Repo::open(&dir.0).expect("open");
    assert_eq!(
        repo.bytes("a.ts", None).expect("work tree"),
        b"edited but not committed\n"
    );
    assert_eq!(
        repo.bytes("a.ts", Some(&sha.to_string())).expect("rev"),
        b"committed\n"
    );
}

#[test]
fn paths_cannot_leave_the_work_tree() {
    let dir = tmp("escape");
    let raw = init(&dir.0);
    write(&dir.0, "a.ts", "x\n");
    commit(&raw, "first");
    let repo = Repo::open(&dir.0).expect("open");
    for bad in ["../secret", "a/../../secret", "/etc/hosts"] {
        assert!(
            matches!(repo.bytes(bad, None), Err(GitError::BadPath(_))),
            "{bad} should be refused"
        );
    }
}

#[test]
fn a_symlink_out_of_the_tree_is_refused() {
    let dir = tmp("symlink");
    let raw = init(&dir.0);
    write(&dir.0, "a.ts", "x\n");
    commit(&raw, "first");
    let outside = std::env::temp_dir().join("chickadee-git-outside.txt");
    std::fs::write(&outside, "secret\n").expect("write outside");
    #[cfg(unix)]
    std::os::unix::fs::symlink(&outside, dir.0.join("link.txt")).expect("symlink");
    #[cfg(not(unix))]
    return;

    let repo = Repo::open(&dir.0).expect("open");
    assert!(matches!(
        repo.bytes("link.txt", None),
        Err(GitError::BadPath(_))
    ));
    drop(std::fs::remove_file(&outside));
}

#[test]
fn blame_covers_every_line_with_the_commit_that_wrote_it() {
    let dir = tmp("blame");
    let raw = init(&dir.0);
    write(&dir.0, "a.ts", "one\ntwo\n");
    let first = commit(&raw, "first");
    write(&dir.0, "a.ts", "one\ntwo\nthree\n");
    let second = commit(&raw, "second");

    let repo = Repo::open(&dir.0).expect("open");
    let blame = repo.blame("a.ts", None, 10_000).expect("blame");
    let mut lines: Vec<(u32, String)> = Vec::new();
    for h in &blame.hunks {
        for line in h.start..=h.end {
            lines.push((line, h.sha.clone()));
        }
    }
    lines.sort_unstable();
    assert_eq!(lines.len(), 3);
    assert_eq!(lines[0].1, first.to_string());
    assert_eq!(lines[2].1, second.to_string());
}

#[test]
fn binary_and_text_are_told_apart_by_a_nul_byte() {
    assert!(chickadee_git::looks_binary(b"abc\0def"));
    assert!(!chickadee_git::looks_binary(b"abcdef"));
    let (text, replaced) = chickadee_git::lossy(&[0xff, b'a']);
    assert!(replaced);
    assert!(text.ends_with('a'));
}

#[test]
fn file_diff_returns_only_the_added_lines_of_one_path() {
    let dir = tmp("filediff");
    let repo = init(&dir.0);
    write(&dir.0, "a.ts", "const a = 1;\n");
    write(&dir.0, "b.ts", "const b = 1;\n");
    commit(&repo, "feat: two files");
    write(
        &dir.0,
        "a.ts",
        "import { x } from './x';\nconst a = 2;\nconst c = 3;\n",
    );
    write(&dir.0, "b.ts", "const b = 9;\n");
    let sha = commit(&repo, "feat: touch both").to_string();

    let open = Repo::open(&dir.0).expect("open");
    let out = open.file_diff(&sha, "a.ts").expect("diff");
    // The other file's change must not leak in — the pathspec is the whole point.
    assert_eq!(
        out.added,
        vec!["import { x } from './x';", "const a = 2;", "const c = 3;"]
    );
    assert!(!out.truncated);
    assert_eq!(out.rel_path, "a.ts");

    // A path the commit never touched is empty, not an error (03 §1.4).
    write(&dir.0, "c.ts", "const c = 1;\n");
    let last = commit(&repo, "feat: third").to_string();
    assert!(open.file_diff(&last, "a.ts").expect("diff").added.is_empty());
}

#[test]
fn file_diff_refuses_a_sha_that_is_not_there() {
    let dir = tmp("filediff-missing");
    let repo = init(&dir.0);
    write(&dir.0, "a.ts", "const a = 1;\n");
    commit(&repo, "feat: one");
    let open = Repo::open(&dir.0).expect("open");
    assert!(matches!(
        open.file_diff("0123456789012345678901234567890123456789", "a.ts"),
        Err(GitError::CommitNotFound(_))
    ));
}
