# Contributing to Chickadee

Chickadee is a desktop app that turns the repository you already have into grammar practice.
It reads repositories locally and sends nothing anywhere. Two rules follow from that and
they shape most of this file: **user code never leaves the machine**, and **Rust stays thin**.

The design documents are in `docs/` and are written in Korean. `docs/00-overview.md` §4 is
the decision register — when a document and this file disagree, the register is the reason.

## Language on each surface

| Surface | Language |
|---|---|
| Commit messages, PR titles and bodies, issues | English |
| `.github/**`, `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md` | English |
| Code comments and identifiers | English |
| Strings the user sees in the app, error messages, dictionary YAML | Korean |
| `docs/**` | Korean |

The app is Korean-first: the typography rules it relies on (`word-break: keep-all`, a 36em
measure, a particle helper for 은/는·이/가) assume Korean text. The repository surface is
English so that a contributor's first screen is readable.

## Development environment

| Tool | Version |
|---|---|
| Node | 26 (CI runs 26; `engines` accepts ≥ 22) |
| pnpm | 10.33.2, pinned by `packageManager` — `corepack enable` and it is picked up |
| Rust | stable, MSRV 1.81 |

Tauri needs system WebView libraries. macOS and Windows have them; on Ubuntu 22.04 install:

```sh
sudo apt-get install -y --no-install-recommends \
  build-essential curl wget file libwebkit2gtk-4.1-dev \
  libappindicator3-dev librsvg2-dev patchelf libssl-dev libxdo-dev
```

That list is the same one `.github/workflows/ci.yml` installs; keep them in step.

## The checks

Run these before opening a PR. They are what CI runs, in the same order.

```sh
pnpm install --frozen-lockfile

pnpm lint                     # eslint + stylelint
pnpm typecheck                # tsc --noEmit across the workspace
bash scripts/make-fixture-repo.sh projectox-like   # some unit tests read this repository
pnpm test:unit                # vitest

cargo fmt --all --check
cargo clippy --locked --all-targets -- -D warnings
bash scripts/check-rust-budget.sh
```

Design gates, if you touched CSS or tokens:

```sh
pnpm design:check             # tokens match design/
pnpm check:contrast           # contrast ratios from the tokens
pnpm check:motion             # no animation over 720ms, no `infinite`
```

`scripts/make-fixture-repo.sh` builds a deterministic git repository under `fixtures/repos/`
from a `.steps` file. Its commit hashes must be identical on every machine — that is what
makes the goldens work. The generated repositories are gitignored; regenerate rather than
commit them.

## Contributing to the grammar dictionary

This is the part of the project that grows by contribution, and the part that needs no Rust.

One concept is two files:

```
dictionary/<lang>/<concept>.yaml    # the three explanation layers, prerequisites, wrong-answer diagnoses
dictionary/<lang>/<concept>.scm     # the tree-sitter query that finds it in real code
```

`<lang>` is the dictionary namespace (`ts`, `py`, `go`, `rs`, `swift`, `dart`, `sql`,
`common`, `react`, `arch`). It is not the tree-sitter grammar key — `ts` covers the
`typescript`, `tsx` and `javascript` grammars, and the YAML names those in `grammars:`.

The three layers in `dict:` are `one_liner`, `why` and `trace[]`. Copy a neighbouring file
and follow its shape; `dictionary/ts/array-filter.yaml` is a complete one. `dictionary/README.md`
has the directory contract, `docs/03-ingest-parsing-dictionary.md` §5 has the field reference.

Then:

```sh
pnpm dict:lint
```

It loads every bundled concept, runs the schema and the lint rules over all of them, and
prints the authoring-debt table. The next section lists what it covers and what it leaves
to you.

Two things to know before you write:

- **Dictionary YAML is user-facing text, so it is Korean.** Write it the way you would
  explain it out loud to someone who has been vibe coding for two weeks.
- **A data-only PR still runs the design gates.** They render the affected card and measure
  it, because a long `one_liner` breaks a layout as surely as a CSS change does.

`dictionary/schema/concept.schema.json` is generated from Zod — run `pnpm dict:schema` after
changing `packages/dictionary/src/schema.ts` rather than editing the JSON.

### What checks the dictionary, and what does not

Four things check a dictionary PR. Three of them are machines.

| Checker | What it covers |
|---|---|
| `pnpm dict:lint` | The schema; `id` matches the path; `prereq`/`confusions`/`universal` resolve and form no cycle; a `point:` answer names a capture the query actually produces; a blank card's distractors come from `confusions`; template variables and HTML tags are on the allowed lists; no Korean particle hardcoded after a placeholder; no verdict wording; `one_liner` ≤ 80 characters and a diagnosis ≤ 300 |
| `cargo test` (`crates/parse/tests/dictionary.rs`) | Every `.scm` compiles against the pinned grammar, capture names match the naming rules, one `@site` per pattern, and no dead pattern — a query that matches nothing in any of its own `examples` fails |
| `pnpm dict:test` | Runs `examples[].code` through the real pipeline and compares the derived sites against `examples[].expect`: the site count, `form`, each `pick.N`, and `hole` |
| A person, in review | The two below |

**Only two things are left to a person, and they are the two that matter most.**

1. **Whether a `meaning:` option's claim about a value is true.** Nothing here executes code
   or reads types, so "this evaluates to `undefined`" is an assertion no checker can settle.
2. **Whether a diagnosis is true.** A wrong-answer diagnosis states what would have to be the
   case for that answer to be right — "that would be it if `user` were `null` rather than
   absent". That is a counterfactual about code nobody ran.

Everything else is already a machine's job, so review time goes to those two.

They are also the reason there is no model behind the running app (`docs/00-overview.md` §4,
D144). At authoring time these two claims get a reader; at runtime they would get nobody, and
a user of this app is by definition someone who cannot check them for themselves — a wrong
diagnosis raises their mastery layer and the scheduler brings it back three weeks later to
reinforce it.

### Drafting with a model

Encouraged, and declared in the PR. A model is good at the parts that are mechanical and
slow: `@hole` and `@pick.N` positions in a `.scm`, the four `blank:` options, `why_gate:`
wording, and a first pass at a new language's concepts. It is not good at the two claims
above, and it sounds the same either way. Run the `examples` yourself before you push.

What you commit is a YAML file in this repository, so it reaches every user whether or not
they have an API key. That is why the authoring side is where a model is welcome and the
runtime side is not.

### The debt table

`pnpm dict:lint` prints a second table, `사전 저작 부채`. It counts what is **not written yet**
rather than what is wrong, so instead of pass/fail it has a ratchet: today's measurement is
the floor, the target is the full population, and the distance between them is printed every
run. Fill a cell and you raise the matching number in `DEBT_RATCHET`
(`packages/dictionary/src/dict.test.ts`); after that nobody can quietly drop back.

| Rule | Applies to | Passes when |
|---|---|---|
| `blank-or-reason` | every `essential` concept | the concept has both a `blank:` card and an `@hole` capture, **or** `no_hole_reason` says why it cannot |
| `point-picks` | every concept with a `point:` card | its `.scm` produces at least three `@pick.N` — one answer plus three distractors needs that many |
| `why-gate` | every `essential` concept | it has a `why_gate:` |
| `zero-one-liner` | Chapter-0 candidates (`essential` at prerequisite depth ≤ 1) | its `one_liner` does not spell out the answer to its own question |

The table exists because this is the most expensive hand work in the repository — one concept
is 150 to 230 lines of YAML in two languages — and unmeasured expensive work gets deferred
forever. On 2026-09-04 two of 23 `essential` concepts had a blank card and none had a
`why_gate`, and that shows up directly in the generator: 193 of 194 generated cards were the
same card type, because the other two types have nothing to build from.

`no_hole_reason` is not a way to clear the row cheaply. It is for the case where the grammar
genuinely has no token to remove, and the lint rejects one left behind on a concept that has
since grown a blank card.

## Commits and pull requests

Commit format: `<type>: <description>`, where type is one of `feat`, `fix`, `refactor`,
`docs`, `test`, `chore`, `perf`, `ci`. The subject is English, imperative, one line. The
CHANGELOG is generated from these with git-cliff, so the subject is what a user will read.

Fill in the pull request template. The allowed-tags box is `pnpm dict:lint`. The re-ingest
box decides whether the CHANGELOG entry carries the ⚠ marker that tells users their cards
will be rebuilt. The log box is the one no machine checks yet, which is why it is worded as
a claim you are making — see [Privacy rules](#privacy-rules-that-apply-to-contributors).

**No AI-sounding prose.** No `seamless`, `robust`, `powerful`, `leverage`, `delve`, no
"It's not just X — it's Y", no superlatives without a number behind them, no emoji headings.
Write short declarative sentences with concrete nouns. Before you keep a sentence, ask
whether deleting it would cost the reader anything; if not, delete it. The test for a claim
is whether you can attach a number or a file path to it.

## Thin Rust

The Rust layer is a shell around libgit2, tree-sitter and SQLite. It knows nothing about the
domain — no concepts, no cards, no sessions. `bash scripts/check-rust-budget.sh` enforces
that in CI and prints what it measured:

| Rule | What fails |
|---|---|
| Line budget | more than 2,800 lines of Rust code across `crates/*/src` and `apps/desktop/src-tauri/src` (comments and blanks excluded) |
| No domain vocabulary | `concept`, `card`, `mastery`, `ink`, `fsrs`, `queue`, `session`, `grade`, `review` in a Rust identifier or string |
| No SQL literals | `SELECT`, `INSERT INTO`, `UPDATE`, `DELETE FROM`, `CREATE TABLE` — SQL lives in `packages/store-sql` and runs by catalog name |
| No git binary | `Command::new("git")` — libgit2 does not execute hooks, and a repository is untrusted input |
| No raw output | `println!`, `eprintln!`, `dbg!` — they bypass every redaction rule |

Tests and benches are outside the budget and outside the vocabulary check.

If a change seems to need more Rust, the usual answer is that the logic belongs in
TypeScript with a smaller command underneath it. If it genuinely does not, raise it as a
decision row in `docs/00-overview.md` §4 before writing the code.

## Goldens, snapshots and IPC dumps

Three kinds of committed expected-output live in this repository. All three are reviewed as
code, not refreshed on sight.

- **`fixtures/ipc/**`** — a dump of what the Rust commands returned for a fixture
  repository. `git diff --exit-code fixtures/ipc` is a CI gate. **A change here means the
  Rust ↔ TypeScript contract moved.** Say in the PR what moved and why the TypeScript side
  matches; a diff with no explanation gets rejected even when the tests are green.
  One file in there is not a contract: `tiny/captures-all.json` is the material the browser
  seed derives from (every file's capture page, from the shipped dictionary), so it also
  moves when `dictionary/ts/**` changes. Say which of the two moved.
- **insta snapshots (`crates/*/tests/snapshots/*.snap`)** — parser and query output. Update
  with `cargo insta review` and read each hunk. `cargo insta accept` on a whole run defeats
  the point of having them.
- **TypeScript goldens (`packages/*/src/__golden__/`, `fixtures/golden/`)** — grading and
  scheduler output. Same rule: a diff is a claim that the old output was wrong.

`.snap` and `fixtures/ipc` changes need a CODEOWNERS review (`.github/CODEOWNERS`).

## Privacy rules that apply to contributors

The app's promise is that a user's code stays on their machine. That promise is kept by
mechanisms, and those mechanisms are easy to break by accident.

- **Nothing in a log but numbers and ids.** Allowed: `repoId` (integer), file and line
  counts, concept ids, durations, error codes. Not allowed: source text, file paths,
  repository names, identifiers from user code. What enforces it today: ESLint's
  `no-console` plus the single `packages/ipc-client/src/logger.ts` on the TypeScript side,
  and `scripts/check-rust-budget.sh` rejecting `println!`, `eprintln!` and `dbg!` on the
  Rust side. The Rust `log_safe!` wrapper that refuses `path`/`code`/`src` fields and the
  integration test that greps the log file after an ingest are specified in
  `docs/06-quality-security-release.md` §3.4 and not written yet — until they are, this
  rule is on you in review.
- **No user code in issues either.** The issue forms are built so the useful part of a
  report — masked shape signatures, reason codes, a pattern key — arrives without any code.
  If you are pasting from your own repository to explain a bug, replace it with the smallest
  synthetic file that shows the same thing.
- **No secrets anywhere.** `.env` is for design scripts and is gitignored; the app does not
  read it and must not gain a `dotenv` dependency. API keys go in the OS keychain. gitleaks
  runs on every PR.

## Reporting things

- A bug, a dictionary explanation that did not help, or a T1 grading appeal: use the
  matching form in [new issue](../../issues/new/choose).
- A vulnerability: **not** a public issue. See [SECURITY.md](SECURITY.md).
- Conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

By contributing you agree that your contribution is licensed under the MIT License, the same
as the rest of the repository.
