# Changelog

All notable changes to Chickadee are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the version numbers follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) — in `0.x`, minor means a
feature or a schema change, patch means a fix (06 §5.3).

A release that makes the app re-derive cards from your repository is marked
**⚠ Re-ingest required** on the first line of its section. Your per-concept mastery
survives a re-ingest; the cards and concept sites are rebuilt.

The sections below are drafted with `git cliff` from the commit log and then rewritten by
hand — `cliff.toml` holds the configuration and the rules.

## [0.1.0] - unreleased

First release. The app is not code-signed on Windows and not notarized by Apple: the
Install section of the README has the per-OS workaround and the `SHA256SUMS.txt` check.
There is no automatic update — a new version is downloaded by hand.

### Added

- **Ingest.** Reads a local repository read-only — git2 for history and blame, tree-sitter
  for the syntax — and writes four fact tables into one SQLite file: `file`, `capture`,
  `commit`, `commit_file`. A later pass re-derives only the files whose blob hash moved.
- **Grammar dictionary.** 28 TypeScript concepts, React conventions, and four architecture
  concepts, each one a YAML entry plus a tree-sitter query. Six grammars are compiled in
  (TypeScript, JavaScript, Python, Go, Rust, SQL); only TypeScript has a dictionary in
  0.1.0, so a repository in the other five produces no cards yet.
- **T0 · Syntax.** Meaning, fill-in-the-blank, and point-at-it plates built from single
  lines of your own code, each with the "I don't know" ladder behind it.
- **T1 · Clone coding.** Three fading stages — copy it, skeleton only, blank page — graded
  line by line against the original, with an appeal when the grader calls an equivalent
  line wrong.
- **T2 · Structure.** Responsibility placement, blast radius, flow tracing, and dependency
  direction, taking your own commits as the answer key and grading in three tiers.
- **Scheduling.** FSRS intervals, mastery accrued per concept instead of per file, and a
  queue sized to the minutes you say you have.
- **The fourth step of the ladder** assembles a prompt from the line you are stuck on plus
  four lines on each side — file base name only, no directory path, no repository name,
  no commit message. 0.1.0 builds it for you to copy and never sends it.
- **Two interface languages.** The first run asks for Korean or English and settings can
  change it afterwards. The choice reaches the grammar dictionary too, so card text reads
  in the language you picked; a concept with no English yet falls back to Korean rather
  than leaving the panel blank. Korean is the canon — line length, word breaking and the
  particle helper are tuned for it, and English carries its own line-length rule.
- **A shelf for your repositories.** Register several and switch between them from the
  masthead. The shelf is where one gets added, pointed at a folder that moved, or taken
  out of the list. Mastery is counted per concept, so it follows you across repositories.
- **Clone course.** Transcribe a repository in the order it was built — by commit where
  there are enough of them, by dependency where there are not — in 12-to-40-line segments
  graded by the same engine as T1. It runs outside the daily queue and leaves that budget
  alone; what you get right still raises the concept's layer, and leaving mid-segment
  keeps your draft.
- **Interface** on design tokens generated from the mockups: dark theme, reduced motion
  honored, excluded paths and the commit identities that decide which commits count as
  yours, every screen reachable without a mouse, and one place per screen where what just
  happened is read aloud — a sentence, not the whole panel.
- **Downloads** for macOS (Apple silicon and Intel), Windows, and Linux (AppImage and
  `.deb`), with `SHA256SUMS.txt` attached to the release.

### Known issues

- On macOS, Tab does not reach buttons unless "Keyboard navigation" is on in System
  Settings. That is the platform default for WebKit, not something the app sets; every
  screen is still reachable with Option+Tab and the documented shortcuts.
- The home's frame budget is 12 ms and the last release-build measurement on a repository
  with 18 sheets was 19 ms. The stickers that caused it are drawn differently now — the
  browser harness puts 1,600 of them at 17 ms, the same as drawing none — but that has not
  been re-measured on a release build, so the 19 ms stands until it is.
