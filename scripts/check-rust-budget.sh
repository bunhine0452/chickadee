#!/usr/bin/env bash
# locks thin Rust in with CI — checks all 4 devices of 01 §1.1 in one pass.
#   1. line budget      crates/*/src/** + apps/desktop/src-tauri/src/** code lines <= BUDGET
#   2. forbidden words  no domain vocabulary in Rust identifiers or strings
#   3. no SQL           no SQL literal in Rust source (SQL runs by name from the TS catalog)
#   4. no git binary    Command::new("git")
#   5. no raw output    println!/eprintln!/dbg! — logs go through tracing (01 §6)
# tests and benches are outside the budget and the forbidden words (D40).
set -euo pipefail
cd "$(dirname "$0")/.."

# 2300 is the ceiling the owner settled on in D68, replacing the 1500 that 01 §1.1 and
# 정본 §5 carried until M1 was written. M1 measured 2043 — git 383 · parse 358 · store 343 ·
# app 959 — with the ingest job and 12 commands in place, after D64~D67 had already moved
# ten commands to TypeScript or to a later milestone.
#
# Still unwritten and counted against the same number, ~190 lines in all:
#   parse_snippet (M3, ~25) · git_diff_text (M4, ~67) · dict_* (M5, ~65) · repo_glob_read (M6, ~30)
#
# Per-crate caps in 01 §4 add up to exactly this number: git 460 · parse 400 · store 360 ·
# app 1080. Only the total is enforced here; the split is printed so growth is attributable.
# Raise either only with a decision row — the line count is a proxy, and the walls that
# actually keep Rust thin are the four checks below.
BUDGET=${RUST_LINE_BUDGET:-2300}
SRC_GLOBS=(crates/*/src apps/desktop/src-tauri/src)
fail=0

files() { find "${SRC_GLOBS[@]}" -name '*.rs' -type f 2>/dev/null | sort; }

# ── 1. line budget ── comments and blank lines excluded. use tokei if present, else the same rule in awk.
count_lines() {
  if command -v tokei >/dev/null 2>&1; then
    tokei --output json "${SRC_GLOBS[@]}" 2>/dev/null \
      | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);process.stdout.write(String((j.Rust||{code:0}).code))})'
  else
    files | xargs -r cat | awk '
      /^[[:space:]]*$/       { next }
      /^[[:space:]]*\/\//    { next }
      /^[[:space:]]*\/\*/    { inblk=1 }
      inblk                  { if ($0 ~ /\*\//) inblk=0; next }
      { n++ } END { print n+0 }'
  fi
}
LINES=$(count_lines)
# the per-crate split is printed every run: the total alone hides where growth landed.
for dir in "${SRC_GLOBS[@]}"; do
  n=$(find "$dir" -name '*.rs' -type f 2>/dev/null | sort | xargs -r cat | awk '
    /^[[:space:]]*$/ { next } /^[[:space:]]*\/\// { next }
    /^[[:space:]]*\/\*/ { inblk=1 } inblk { if ($0 ~ /\*\//) inblk=0; next } { n++ } END { print n+0 }')
  printf '     %-34s %s\n' "$dir" "$n"
done
if [ "$LINES" -gt "$BUDGET" ]; then
  echo "FAIL line budget: ${LINES} lines of Rust code > ${BUDGET} (01 §1.1)"; fail=1
else
  echo "ok   line budget: ${LINES}/${BUDGET} lines"
fi

# ── 2. forbidden words ── Rust knows no domain vocabulary. only files · bytes · commits · diffs · AST nodes · captures · lines.
FORBIDDEN='concept|card|mastery|ink|fsrs|queue|session|grade|review'
# `\b` alone is not enough: `_` is a word character, so `\bcard` misses `_card` and
# `card_probe` slips past a naive anchor. Two patterns instead, matching how the word can
# appear as an *identifier component*:
#   A. snake_case / standalone / quoted — bounded by anything that is not alphanumeric.
#      This still spares `discard`, `wildcard`, `link`, `upgrade`, `enqueue`: those have an
#      alphanumeric character immediately before the word.
#   B. camelCase — a lowercase or digit followed by the capitalised word (`myCard`, `okInk`).
FORBIDDEN_SNAKE="(^|[^A-Za-z0-9])(${FORBIDDEN})([^A-Za-z0-9]|$)"
FORBIDDEN_CAMEL='[a-z0-9](Concept|Card|Mastery|Ink|Fsrs|Queue|Session|Grade|Review)'
hits=$( { files | xargs -r grep -nEi "${FORBIDDEN_SNAKE}" 2>/dev/null || true
           files | xargs -r grep -nE  "${FORBIDDEN_CAMEL}" 2>/dev/null || true; } | sort -u || true)
if [ -n "$hits" ]; then
  echo "FAIL forbidden words: domain vocabulary present in Rust (01 §1.1)"; echo "$hits"; fail=1
else
  echo "ok   no forbidden words"
fi

# ── 3. no SQL literals ── SQL is owned by the packages/store-sql catalog.
if hits=$(files | xargs -r grep -nE '\b(SELECT|INSERT[[:space:]]+INTO|UPDATE|DELETE[[:space:]]+FROM|CREATE[[:space:]]+TABLE)\b' 2>/dev/null) && [ -n "$hits" ]; then
  echo "FAIL SQL literal: SQL present in Rust source (01 §1.1)"; echo "$hits"; fail=1
else
  echo "ok   no SQL literals"
fi

# ── 5. no raw output ── logs go through tracing with the forbidden fields skipped (01 §6).
# println!/eprintln!/dbg! write straight to the terminal, past every redaction rule there is.
if hits=$(files | xargs -r grep -nE '\b(println!|eprintln!|dbg!)' 2>/dev/null) && [ -n "$hits" ]; then
  echo "FAIL raw output: use tracing, not println!/eprintln!/dbg! (01 §6)"; echo "$hits"; fail=1
else
  echo "ok   no raw output"
fi

# ── 4. no git binary ── libgit2 does not run hooks (06 §4.1).
if hits=$(files | xargs -r grep -nE 'Command::new\("git"' 2>/dev/null) && [ -n "$hits" ]; then
  echo "FAIL git binary call (06 §4.1)"; echo "$hits"; fail=1
else
  echo "ok   no git binary calls"
fi

exit "$fail"
