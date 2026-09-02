#!/usr/bin/env bash
# 얇은 Rust 를 CI 로 잠근다 — 01 §1.1 의 장치 4개를 한 번에 본다.
#   1. 줄 예산   crates/*/src/** + apps/desktop/src-tauri/src/** 코드 줄 <= 1500
#   2. 금칙어    도메인 어휘가 Rust 식별자·문자열에 나타나지 않는다
#   3. SQL 금지  Rust 소스에 SQL 리터럴이 없다 (SQL 은 TS 카탈로그에서 이름으로 실행)
#   4. git 바이너리 금지  Command::new("git")
# tests·benches 는 예산·금칙어 밖이다 (D40).
set -euo pipefail
cd "$(dirname "$0")/.."

BUDGET=${RUST_LINE_BUDGET:-1500}
SRC_GLOBS=(crates/*/src apps/desktop/src-tauri/src)
fail=0

files() { find "${SRC_GLOBS[@]}" -name '*.rs' -type f 2>/dev/null | sort; }

# ── 1. 줄 예산 ── 주석·빈 줄 제외. tokei 가 있으면 쓰고, 없으면 같은 규칙을 awk 로.
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
if [ "$LINES" -gt "$BUDGET" ]; then
  echo "FAIL 줄 예산: Rust 코드 ${LINES}줄 > ${BUDGET}줄 (01 §1.1)"; fail=1
else
  echo "ok   줄 예산: ${LINES}/${BUDGET}줄"
fi

# ── 2. 금칙어 ── Rust 는 도메인 어휘를 모른다. 파일·바이트·커밋·diff·AST 노드·캡처·행만 안다.
FORBIDDEN='concept|card|mastery|ink|fsrs|queue|session|grade|review'
if hits=$(files | xargs -r grep -nEi "\b(${FORBIDDEN})" 2>/dev/null) && [ -n "$hits" ]; then
  echo "FAIL 금칙어: 도메인 어휘가 Rust 에 있다 (01 §1.1)"; echo "$hits"; fail=1
else
  echo "ok   금칙어 없음"
fi

# ── 3. SQL 리터럴 금지 ── SQL 은 packages/store-sql 카탈로그가 소유한다.
if hits=$(files | xargs -r grep -nE '\b(SELECT|INSERT[[:space:]]+INTO|UPDATE|DELETE[[:space:]]+FROM|CREATE[[:space:]]+TABLE)\b' 2>/dev/null) && [ -n "$hits" ]; then
  echo "FAIL SQL 리터럴: Rust 소스에 SQL 이 있다 (01 §1.1)"; echo "$hits"; fail=1
else
  echo "ok   SQL 리터럴 없음"
fi

# ── 4. git 바이너리 금지 ── libgit2 는 훅을 실행하지 않는다 (06 §4.1).
if hits=$(files | xargs -r grep -nE 'Command::new\("git"' 2>/dev/null) && [ -n "$hits" ]; then
  echo "FAIL git 바이너리 호출 (06 §4.1)"; echo "$hits"; fail=1
else
  echo "ok   git 바이너리 호출 없음"
fi

exit "$fail"
