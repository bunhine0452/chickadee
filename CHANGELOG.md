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

## [0.1.0] - 2026-09-03

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
- **Korean interface** on design tokens generated from the mockups: dark theme, reduced
  motion honored, and every screen reachable without a mouse.
- **Downloads** for macOS (Apple silicon and Intel), Windows, and Linux (AppImage and
  `.deb`), with `SHA256SUMS.txt` attached to the release.

### Fixed after the first end-to-end run

The suite that landed with this release found six defects. Five are fixed here.

- The ladder said "ink 2 passes → 2 passes" and "next print today → today". It now reads
  the layer that pressing "I don't know" actually moves you to, and names the interval it
  replaces — or leaves that line out on a card that had no schedule yet.
- The ingest screen names the file it is reading. The path was travelling in the Rust
  event and being dropped one layer above the screen.
- The session has a live region. It reads one sentence — "정합 — 맞았습니다. 잉크 1겹 ·
  다음 인쇄 내일. Space 로 다음." — instead of the whole verdict panel, which is what the
  feedback box's own `aria-live` was doing.
- The ladder's fourth step carries what you type. The prompt was assembled once when the
  ladder opened, so "where I am stuck" always read "(비어 있음)" no matter what you wrote;
  "프롬프트 만들기" now builds it from the box, and nothing is shown until you press it.
- The home no longer draws a separate SVG per concept sticker. Each ink layer is baked
  once and reused, which took the repaint of 1,600 stickers from 28 ms to 17 ms per frame
  in the WebKit harness — the same as drawing none. Fixing it surfaced a second bug: the
  badge was missing the mockup's `viewBox` and had been overflowing its box onto the ink
  scale's labels.

### Known issues

- On macOS, Tab does not reach buttons unless "Keyboard navigation" is on in System
  Settings. That is the platform default for WebKit, not something the app sets; every
  screen is still reachable with Option+Tab and the documented shortcuts.
- The 19 ms per frame above still needs re-measuring on a release build against a
  repository with 18 sheets; the number above comes from the browser harness.
