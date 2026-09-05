## What changed

<!-- One or two sentences. What a user or a maintainer would notice. -->

## Why

<!-- The problem, or the decision row in docs/00-overview.md §4 that asked for this. -->

## Checklist

- [ ] **Tests.** New behaviour has a test; a fix has a test that failed before it.
      `pnpm lint && pnpm typecheck && pnpm test:unit` and
      `cargo clippy --locked --all-targets -- -D warnings` are green locally.
- [ ] **Re-ingest.** This does **not** change grammar versions, the query hash, the
      generator version or the dictionary schema. If it does, untick this, say so here, and
      the CHANGELOG entry gets the ⚠ marker — users' cards will be rebuilt while their
      mastery is kept.
- [ ] **Logs carry no paths and no code.** Nothing added to a log or a crash report beyond
      integers, ids, counts, durations and error codes. No file path, repository name,
      source line or identifier from user code.
- [ ] **Allowed tags only.** Any HTML in dictionary YAML or in card wording uses only
      `code b i em br kbd` with no attributes. `pnpm dict:lint` passes.
- [ ] **CHANGELOG.** The commit subject is the line a user will read, or an entry is added
      by hand for anything the generated line would not explain.

## Dictionary

<!-- Delete this section if you did not touch dictionary/**. -->

- [ ] **LLM draft declared.** If a model drafted any of this, say which files and which
      fields here: ______ . Drafting is encouraged (`docs/03` §5.2) — a model is good at
      `@hole`/`@pick.N` placement, `blank:` options and `why_gate:` wording. Shipping a draft
      nobody ran is not. Tick this even when the answer is "none".
- [ ] **A human checked the two things no checker can.** Every claim a `meaning:` option makes
      about a value, and whether each "what would make that true" diagnosis is actually true.
      `pnpm dict:lint`, `cargo test` and the `examples[].expect` comparison cover the rest —
      see [Contributing](../CONTRIBUTING.md#what-checks-the-dictionary-and-what-does-not).
- [ ] **The debt table did not go backwards.** `pnpm dict:lint` prints "사전 저작 부채". If you
      filled a cell, raise the matching number in `DEBT_RATCHET`
      (`packages/dictionary/src/dict.test.ts`) so it cannot slip back.

## Goldens, snapshots, IPC dumps

<!-- Delete this section if none of them moved. -->

- [ ] `fixtures/ipc` changed — **the Rust ↔ TypeScript contract moved.** What moved:
- [ ] insta `.snap` files changed, reviewed hunk by hunk with `cargo insta review`. Why:
- [ ] TypeScript goldens changed. Why the previous output was wrong:

## Thin Rust

<!-- Only if this PR touches crates/** or apps/desktop/src-tauri/src/**. -->

- [ ] `bash scripts/check-rust-budget.sh` passes. Lines now:      / 2800
