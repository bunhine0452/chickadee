# The grammar dictionary

The data that decides what the app can teach. It ships inside the app bundle, so what you
commit here reaches every user whether or not they have an API key.

To add **one concept** to a language that already exists, read
[`CONTRIBUTING.md` § Contributing to the grammar dictionary](../CONTRIBUTING.md#contributing-to-the-grammar-dictionary)
— it has the two-file shape, the checks, and the authoring-debt ratchet. This file is the
directory contract underneath it: the namespace kinds, the `_lang.yaml` fields, the capture
conventions, and what it takes to open a **new language**.

The field reference for a concept YAML is `docs/03-ingest-parsing-dictionary.md` §5.
`dictionary/schema/concept.schema.json` is generated from Zod — run `pnpm dict:schema` after
changing `packages/dictionary/src/schema.ts` rather than editing the JSON by hand.

---

## 1. Layout

```
dictionary/<ns>/_lang.yaml            # grammar namespaces only
dictionary/<ns>/<concept>.yaml        # the three explanation layers, prerequisites, diagnoses
dictionary/<ns>/<concept>.scm         # the tree-sitter query that finds it in real code
dictionary/<ns>/_imports.scm          # system query: import specifiers, routes, calls
dictionary/<ns>/_blocks.scm           # system query: function/method/statement blocks
dictionary/schema/concept.schema.json # generated from Zod
dictionary/_glossary.en.yaml          # shared English terms
```

`ns` is the **dictionary namespace**. It is not the tree-sitter grammar key: `ts` covers the
`typescript`, `tsx`, `javascript` and `vue` grammars, and `_lang.yaml` names those in
`grammars:` (D19). C# is `csharp`, not `cs` — `cs/` is taken by the machine namespace (D157).

**Rust never reads this folder's YAML** (D40). Vite bakes the raw text into the bundle at
build time (`packages/dictionary/src/bundle.ts`); parsing and validation are TypeScript's job.
`app_data_dir/dict-user/<ns>/` overrides the bundle.

---

## 2. Four kinds of namespace

They look alike on disk and cost very different amounts to write.

| Kind | Has `_lang.yaml` | Has `.scm` | Where a card's code window comes from | Today |
|---|---|---|---|---|
| **Grammar** | yes | yes | its own `@site` capture | `ts` 36, `java` 29, `py` 8, `sql` 3, `css` 2 |
| **Computed** | no | no | borrowed or calculated | `common` 31, `cs` 43, `proto` 10, `arch` 6, `exec` 1 |
| **Framework** | yes (with `detect`) | optional | evidence words in a block | `spring` 15, `react` 1 |
| **Plumbing** | yes | system only | — (no concepts) | `mybatis` |

A **grammar** concept costs 200–230 lines of Korean/English YAML plus a query. A **computed**
concept costs 85–95 — no query, no `examples`, so roughly half. That gap is why `cs/` could
reach 43 entries in one pass and `java/` took four.

**Namespaces that live without queries are listed in one constant**, `COMPUTED_NAMESPACES` in
`packages/dictionary/src/schema.ts` — today `common/`, `arch/`, `exec/`, `cs/`, `proto/` and
`spring/`. Adding a namespace there is what turns off the lint rules that demand a query and
turns on the sitelessness the queue expects. Three places hardcoded the prefixes separately
before they were collected; do not add a fourth copy. `spring/` is the one entry that also
has a `_lang.yaml`, because a `detect` gate has nowhere else to go.

**Computed concepts still need somewhere to stand.** `proto/` attaches to a block where its
`evidence` words appear. `cs/` has no words either — it **borrows** the code window of a
language concept that names it in `prereq` (`packages/course/src/borrow.ts`). So a computed
concept produces no cards in a repo whose language has no dictionary. Keep that in mind before
assuming a namespace is free of language work.

---

## 3. `_lang.yaml`

Grammar, framework and plumbing namespaces have one. Computed namespaces do not.

| Field | Required | Notes |
|---|---|---|
| `lang` | yes | must equal the directory name |
| `version` | yes | semver of this namespace's data |
| `grammars` | yes | tree-sitter keys, from `crates/parse/src/langs.rs`. Must exist in `grammarSchema` |
| `grammar_abi` | yes | `{ <grammar>: <abi> }`. A Rust test compares it against the linked grammar, so a stale number fails the build rather than drifting |
| `extensions` | yes | **keyed by grammar, not by `lang`** — `python: [.py, .pyi]`, not `py: [.py]`. They look the same for `ts` and `py` by accident |
| `essential` | yes | the concepts that count as this language's floor. **A name here with no matching file stops the whole dictionary from loading**, so add the name in the same commit as the file |
| `alternatives` | no | other spellings of the same thing, for the gap map |
| `thin_threshold` | no | `{ min_files, min_sites, small_repo_files }` — when the sample is too thin to teach from |
| `detect` | framework only | either `{ dependency: <name> }` or `{ manifest: [...], contains: <substring> }`. The namespace is **not loaded at all** in a repo that fails detection (D59, D176) |
| `framework` | framework only | the framework's name |

### Extensions decide whether a file is read at all

`langSpecs()` (`packages/dictionary/src/load.ts`) drops any grammar with **zero extensions or
zero queries**, and the Rust walker only creates a `file` row for an extension in that table.
A grammar linked in `langs.rs` with no dictionary therefore reads nothing: today `go` and
`rust` are compiled in and `.go`/`.rs` files are still skipped. The extensions that reach the
parser right now are:

```
.cjs .css .cts .java .js .jsx .mjs .mts .py .pyi .sql .ts .tsx .vue .xml
```

---

## 4. Capture conventions

Concept queries (`<concept>.scm`):

| Capture | Meaning |
|---|---|
| `@site` | the code window for this concept. **Exactly one per pattern** — a Rust test enforces it |
| `@hole` | the token a blank card removes. Omit it only with `no_hole_reason` in the YAML |
| `@pick.N` | one option for a point card. A point card needs at least three |
| `@ctx.*` | context passed through to the derive layer; never shown by itself |

System queries carry a `form` instead, set per pattern:

```scheme
((import_declaration (scoped_identifier) @import.source)
 (#set! form "static"))
```

The derive layer switches on `form`, so a value it does not know is silently ignored. The
values in use today:

| Group | Values |
|---|---|
| Imports | `static` · `require` · `same-package` · `dynamic` |
| HTTP routes | `route-base` · `route-{get,post,put,patch,delete}` · `route-bare-{get,post,put,patch,delete}` |
| HTTP calls | `http-{get,post,put,patch,delete,any}` |
| Call graph | `field` · `local` · `call` · `call-self` |
| Entry points | `entry-scheduled` |
| SQL / mapper | `ddl-table` · `ddl-column` · `ddl-fk` · `from` · `reads-table` · `mapper-of` · `column-of` |

`_blocks.scm` marks the nodes that become blocks — functions, methods, mapper statements.
Without it there are no blocks, and without blocks there is no T1 window, no call graph and
no material for course stages 2 through 5. It is nominally optional and effectively required.

`_imports.scm` is where framework rules accumulate. `dictionary/java/_imports.scm` is 148
lines and most of it is Spring. This is the file the canon means by "one rule per framework,
and the count never ends" — budget for it separately from the language itself.

---

## 5. Opening a new language

Eight places are required. The rest can wait, and each one you skip turns off a named feature
rather than breaking the app. `docs/plan/extension-model.md` §1 has the full table of 29 with
what each one costs if it is missing.

**Required**

1. `crates/parse/Cargo.toml` — optional dependency, a `lang-*` feature, and the feature in
   `default`. Only for a grammar that is not linked yet.
2. `crates/parse/src/langs.rs` — one `LANGS` entry. Same condition. **Watch the Rust line
   budget**: `bash scripts/check-rust-budget.sh` prints the headroom, and an entry is 3 lines.
3. `packages/dictionary/src/schema.ts` — the grammar key in `grammarSchema`. A key not listed
   makes zod reject `_lang.yaml`, and that fails the **whole** dictionary, not one namespace.
4. `dictionary/<ns>/_lang.yaml` — §3.
5. `dictionary/<ns>/<concept>.yaml` — at least one, and every name in `essential`.
6. `dictionary/<ns>/<concept>.scm` — at least one, or nothing is read (§3).
7. `dictionary/<ns>/_blocks.scm` — §4.
8. `packages/dictionary/src/dict.test.ts` — raise `DEBT_RATCHET` once the new concepts fill
   the rules. `pnpm dict:lint` tells you the number.

**Optional, in rough order of what people notice**

`_imports.scm` and a resolver in `packages/concepts/src/resolve-imports.ts` (without them
there are no import edges, so chapters fall back to the directory rule) · masking rules in
`packages/cards/src/t1-mask.ts` · a comment prefix in `t1-block.ts` · a dialect in
`exec-facts.ts` · a runner adapter in `packages/grading/src/t3-adapter.ts` (stages 4 and 5
stay outside the gate without one) · the editor language tables under `apps/desktop/src` ·
`docs/curriculum/<ns>.md`.

**Goldens are optional.** `fixtures/golden/` covers `ts`, `tsx`, `sql` and `java`; Python's
eight concepts have none and rely on `examples[]` in the YAML, which `pnpm dict:test` runs
through the real pipeline. What goldens add is protection against a grammar upgrade quietly
emptying a query. To add them, put cases under `fixtures/golden/<grammar>/<concept>/`, add one
row to `DIRS` in `crates/parse/tests/support/mod.rs`, and write the expectations with
`UPDATE_GOLDEN=1 cargo test -p chickadee-parse --test golden` rather than by hand.

---

## 6. Checks

```sh
pnpm dict:lint    # schema, lint rules, and the authoring-debt table
pnpm dict:test    # runs examples[].code through the real pipeline
cargo test -p chickadee-parse    # queries compile against the pinned grammars; goldens
```

`CONTRIBUTING.md` § "What checks the dictionary, and what does not" lists what each one covers
and the two things only a person can settle.
