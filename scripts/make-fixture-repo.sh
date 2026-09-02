#!/usr/bin/env bash
# scripts/make-fixture-repo.sh <name>  — 커밋 해시가 매번 같아야 골든이 성립한다
set -euo pipefail
export GIT_AUTHOR_NAME=fixture GIT_AUTHOR_EMAIL=fixture@example.invalid
export GIT_COMMITTER_NAME=fixture GIT_COMMITTER_EMAIL=fixture@example.invalid
export GIT_AUTHOR_DATE="2026-01-01T00:00:00+0000" GIT_COMMITTER_DATE="2026-01-01T00:00:00+0000"
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null   # 사용자 훅·템플릿 차단

usage() {
  cat <<'USAGE'
사용법: scripts/make-fixture-repo.sh <name>        (git >= 2.28)

  fixtures/repos/<name>.steps 를 읽어 fixtures/repos/<name>/ 을 결정론적으로 만든다.
  대상 디렉터리가 있으면 지우고 다시 만든다 (증분 상태가 아니라 결정성이 목적).
  생성물은 커밋하지 않는다 — .gitignore `/fixtures/repos/*/` (06 §1.2).

.steps 형식 — 줄 단위, 첫 낱말이 지시자, 낱말 구분자는 공백 하나
--------------------------------------------------------------------------
  # ...                        주석. 빈 줄과 함께 무시된다 (블록 밖에서만)

  write <경로> <<EOS           파일 쓰기(없으면 생성, 있으면 통째 교체).
  ...내용...                    다음 줄부터 구분자만 있는 줄까지가 내용.
  EOS                           구분자는 `<<` 뒤의 낱말 — 관례는 EOS.

  delete <경로>                 파일/디렉터리 삭제
  rename <옛 경로> <새 경로>     이동(디렉터리는 자동 생성)
  commit <메시지...>            여기까지 쌓인 변경을 한 커밋으로. 줄 나머지 전부가 메시지.

  gen wave <횟수> <경로틀> lines=<줄수> seed=<정수> msg=<메시지틀...>
                                결정론적 합성기. <횟수>번 반복하며 매 회
                                파일 1개(약 <줄수>줄)를 쓰고 커밋 1개를 만든다.
                                경로틀·메시지틀의 {i} 는 2자리 0채움 인덱스(01..).
                                종류는 확장자로 정한다 — .ts .tsx .sql.
                                난수는 시드 LCG(x=(25173x+13849) mod 65536) 하나뿐 —
                                $RANDOM·시각·로케일을 쓰지 않으므로 어느 기계에서나 같다.
                                msg= 는 반드시 마지막 (줄 끝까지가 메시지).

규칙
  - 경로는 리포 루트 기준 상대경로. `/` 시작·`..` 포함은 거부한다.
  - 커밋 시각은 2026-01-01T00:00:00+0000 에서 커밋마다 +60초 — 순서는 있고 재현된다.
  - 저자·커미터 이름/메일/시각이 모두 고정이라 커밋 해시가 바이트 단위로 같다.
USAGE
}

if [ $# -ne 1 ]; then usage >&2; exit 2; fi
case "$1" in
  -h|--help|help) usage; exit 0 ;;
  ""|*/*|.*) printf 'make-fixture-repo: 이름에 경로를 쓸 수 없다: %s\n' "$1" >&2; exit 2 ;;
esac

SCRIPT_DIR=$(cd -- "$(dirname -- "$0")" && pwd)
ROOT=$(cd -- "$SCRIPT_DIR/.." && pwd)
REPOS_DIR="$ROOT/fixtures/repos"
STEPS="$REPOS_DIR/$1.steps"
if [ ! -f "$STEPS" ]; then
  printf 'make-fixture-repo: 단계 파일이 없다: %s\n' "$STEPS" >&2
  exit 2
fi

BASE_EPOCH=1767225600      # 2026-01-01T00:00:00+0000
STEP_SECONDS=60            # 커밋마다 +60초 — 순서는 생기고 값은 고정
COMMIT_N=0

umask 022                  # 파일 모드 644 고정 (git 이 실행 비트만 기록한다)
rm -rf -- "$REPOS_DIR/$1"
mkdir -p -- "$REPOS_DIR"
cd -- "$REPOS_DIR"
git init -q --initial-branch=main "$1" && cd "$1"
# 이후 fixtures/repos/<name>.steps 파일의 단계(파일 쓰기 → 커밋 메시지)를 순서대로 재생

# 트리·해시를 OS 간 동일하게: 줄바꿈 변환·모드·심볼릭 링크·대소문자·서명·훅 모두 명시.
git config core.autocrlf false          # Windows 에서도 LF 그대로 (CRLF 면 blob 해시가 달라진다)
git config core.eol lf
git config core.fileMode false
git config core.symlinks false          # 픽스처에 링크를 두지 않는다 (06 §4.1 심볼릭 링크)
git config core.ignorecase false
git config core.precomposeunicode true
git config commit.gpgsign false
git config tag.gpgsign false
rm -rf .git/hooks && mkdir -p .git/hooks   # init 템플릿의 훅 표본 제거 (06 §4.1 git 훅 실행)
git config core.hooksPath .git/hooks

die() { printf 'make-fixture-repo: %s\n' "$1" >&2; exit 1; }

check_path() {
  case "$1" in
    /*)     die "절대경로 금지 ($STEPS:$LINENO_STEPS): $1" ;;
    *..*)   die "상위 경로 탈출 금지 ($STEPS:$LINENO_STEPS): $1" ;;
    "")     die "경로가 비었다 ($STEPS:$LINENO_STEPS)" ;;
  esac
}

do_commit() {
  local msg="$1" when
  [ -n "$msg" ] || die "빈 커밋 메시지 ($STEPS:$LINENO_STEPS)"
  COMMIT_N=$((COMMIT_N + 1))
  when=$((BASE_EPOCH + (COMMIT_N - 1) * STEP_SECONDS))
  git add -A .
  GIT_AUTHOR_DATE="@$when +0000" GIT_COMMITTER_DATE="@$when +0000" \
    git commit -q --no-verify --no-gpg-sign -m "$msg"
}

# ---- 합성기: BEGIN 블록만 쓰는 awk (입력을 읽지 않는다) --------------------
SYNTH_AWK=$(cat <<'AWK'
function cap(s) { return toupper(substr(s, 1, 1)) substr(s, 2) }
function rnd() { rs = (rs * 25173 + 13849) % 65536; return rs }
function pick(n) { return rnd() % n }
function p(s) { print s; L++ }
function nsym() { return noun[pick(nnoun) + 1] }
function vsym() { return verb[pick(nverb) + 1] }

function tsHeader() {
  p("// fixture(seed=" seed ") — scripts/make-fixture-repo.sh 의 gen wave 가 만든 파일")
  p("import { clamp, DAY_MS } from " q "../core/time" q ";")
  p("")
}
function tsUnit(k,   n, N, v, w, m) {
  n = nsym(); N = cap(n); v = vsym(); w = vsym(); m = 2 + pick(7)
  p("export const LIMIT_" k " = " (10 + pick(90)) ";")
  p("")
  p("export interface " N k " {")
  p("  id: number;")
  p("  " n ": string;")
  p("  ready: boolean;")
  p("}")
  p("")
  p("export function " v k "(rows: " N k "[], q?: string): " N k "[] {")
  p("  const out: " N k "[] = [];")
  p("  for (let i = 0; i < rows.length; i += 1) {")
  p("    const row = rows[i];")
  p("    if (row.ready && row." n ".startsWith(q ?? " q q ")) {")
  p("      out.push(row);")
  p("    }")
  p("  }")
  p("  return out.slice(0, clamp(LIMIT_" k ", 1, rows.length));")
  p("}")
  p("")
  p("export class " N k "Service {")
  p("  private cache = new Map<number, " N k ">();")
  p("")
  p("  async " w k "(id: number): Promise<" N k " | null> {")
  p("    const hit = this.cache.get(id);")
  p("    if (hit) return hit;")
  p("    const rows = await this.fetch" k "(id);")
  p("    this.cache.set(id, rows[0]);")
  p("    return rows[0] ?? null;")
  p("  }")
  p("")
  p("  private async fetch" k "(id: number): Promise<" N k "[]> {")
  p("    const age = Date.now() - id * DAY_MS;")
  p("    return [{ id, " n ": " q "seed-" q " + id, ready: age % " m " === 0 }];")
  p("  }")
  p("}")
  p("")
}

function tsxHeader() {
  p("// fixture(seed=" seed ") — scripts/make-fixture-repo.sh 의 gen wave 가 만든 파일")
  p("import { useState } from " q "react" q ";")
  p("import { clamp } from " q "../core/time" q ";")
  p("")
}
function tsxUnit(k,   n, N) {
  n = nsym(); N = cap(n)
  p("export interface " N k "Props {")
  p("  items: string[];")
  p("  active?: number;")
  p("  onPick: (index: number) => void;")
  p("}")
  p("")
  p("export function " N k "Panel({ items, active, onPick }: " N k "Props) {")
  p("  const [open, setOpen] = useState(false);")
  p("  const label = items[active ?? 0] ?? " q "비어 있음" q ";")
  p("  const shown = items.slice(0, clamp(items.length, 0, " (3 + pick(9)) "));")
  p("  return (")
  p("    <section className={" q "panel panel--" k q "} data-open={open}>")
  p("      <header onClick={() => setOpen(!open)}>{label}</header>")
  p("      {open ? (")
  p("        <ul>")
  p("          {shown.map((it, i) => (")
  p("            <li key={it} data-active={i === active} onClick={() => onPick(i)}>")
  p("              {it}")
  p("            </li>")
  p("          ))}")
  p("        </ul>")
  p("      ) : null}")
  p("    </section>")
  p("  );")
  p("}")
  p("")
}

function sqlHeader() {
  p("-- fixture(seed=" seed ") — scripts/make-fixture-repo.sh 의 gen wave 가 만든 파일")
  p("PRAGMA foreign_keys = ON;")
  p("")
}
function sqlUnit(k,   n, t) {
  n = nsym(); t = n "_" k
  p("CREATE TABLE IF NOT EXISTS " t " (")
  p("  id          INTEGER PRIMARY KEY,")
  p("  repo_id     INTEGER NOT NULL REFERENCES repo(id) ON DELETE CASCADE,")
  p("  " n "_key    TEXT    NOT NULL,")
  p("  weight      REAL    NOT NULL DEFAULT 0." (10 + pick(80)) ",")
  p("  created_at  INTEGER NOT NULL")
  p(");")
  p("")
  p("CREATE INDEX IF NOT EXISTS ix_" t "_repo ON " t "(repo_id, " n "_key);")
  p("")
  p("INSERT INTO " t " (id, repo_id, " n "_key, weight, created_at)")
  p("VALUES (" k ", 1, 'seed-" k "', 0." (10 + pick(80)) ", 1767225600);")
  p("")
}

BEGIN {
  q = "\""
  rs = seed % 65536
  nnoun = split("order,card,queue,session,repo,concept,deck,streak,ingest,ladder", noun, ",")
  nverb = split("load,build,merge,filter,scan,render,collect,resolve", verb, ",")
  L = 0
  if (kind == "ts")       tsHeader()
  else if (kind == "tsx") tsxHeader()
  else                    sqlHeader()
  k = 0
  while (L < want + 0) {
    k++
    if (kind == "ts")       tsUnit(k)
    else if (kind == "tsx") tsxUnit(k)
    else                    sqlUnit(k)
  }
}
AWK
)

synth() {
  local path="$1" seed="$2" want="$3" kind
  case "$path" in
    *.tsx) kind=tsx ;;
    *.ts)  kind=ts ;;
    *.sql) kind=sql ;;
    *) die "gen wave: 확장자로 종류를 정할 수 없다 (.ts/.tsx/.sql): $path" ;;
  esac
  awk -v kind="$kind" -v seed="$seed" -v want="$want" "$SYNTH_AWK" </dev/null
}

# gen wave <횟수> <경로틀> lines=<n> seed=<n> msg=<...>
gen_wave() {
  local args="$1" count tmpl head kv lines="" seed="" msg="" i idx path message
  count="${args%% *}"; args="${args#* }"
  tmpl="${args%% *}";  args="${args#* }"
  case "$args" in *msg=*) : ;; *) die "gen wave: msg= 가 없다 ($STEPS:$LINENO_STEPS)" ;; esac
  msg="${args#*msg=}"
  head="${args%%msg=*}"
  for kv in $head; do
    case "$kv" in
      lines=*) lines="${kv#lines=}" ;;
      seed=*)  seed="${kv#seed=}" ;;
      *) die "gen wave: 모르는 인자 '$kv' ($STEPS:$LINENO_STEPS)" ;;
    esac
  done
  case "$count$lines$seed" in ''|*[!0-9]*) die "gen wave: 횟수·lines·seed 는 정수 ($STEPS:$LINENO_STEPS)" ;; esac
  [ -n "$msg" ] || die "gen wave: 메시지가 비었다 ($STEPS:$LINENO_STEPS)"
  i=1
  while [ "$i" -le "$count" ]; do
    idx=$(printf '%02d' "$i")
    path="${tmpl//\{i\}/$idx}"
    message="${msg//\{i\}/$idx}"
    check_path "$path"
    mkdir -p -- "$(dirname -- "$path")"
    synth "$path" "$((seed + i))" "$lines" > "$path"
    do_commit "$message"
    i=$((i + 1))
  done
}

# ---- .steps 재생 ---------------------------------------------------------
in_block=0
delim=""
target=""
LINENO_STEPS=0

while IFS= read -r line || [ -n "$line" ]; do
  LINENO_STEPS=$((LINENO_STEPS + 1))

  if [ "$in_block" -eq 1 ]; then
    if [ "$line" = "$delim" ]; then in_block=0; continue; fi
    printf '%s\n' "$line" >> "$target"
    continue
  fi

  case "$line" in
    ''|'#'*) continue ;;
  esac

  op="${line%% *}"
  rest="${line#* }"
  [ "$rest" != "$line" ] || rest=""

  case "$op" in
    write)
      path="${rest%% *}"
      tail="${rest#* }"
      [ "$tail" != "$rest" ] || die "write: 히어독 구분자가 없다 ($STEPS:$LINENO_STEPS)"
      case "$tail" in '<<'?*) delim="${tail#<<}" ;; *) die "write: '<<구분자' 가 필요하다 ($STEPS:$LINENO_STEPS)" ;; esac
      check_path "$path"
      mkdir -p -- "$(dirname -- "$path")"
      : > "$path"
      target="$path"
      in_block=1
      ;;
    delete)
      check_path "$rest"
      [ -e "$rest" ] || die "delete: 없는 경로 ($STEPS:$LINENO_STEPS): $rest"
      rm -rf -- "$rest"
      ;;
    rename)
      from="${rest%% *}"
      to="${rest#* }"
      [ "$to" != "$rest" ] || die "rename: 대상 경로가 없다 ($STEPS:$LINENO_STEPS)"
      check_path "$from"; check_path "$to"
      [ -e "$from" ] || die "rename: 없는 경로 ($STEPS:$LINENO_STEPS): $from"
      mkdir -p -- "$(dirname -- "$to")"
      mv -- "$from" "$to"
      ;;
    commit)
      do_commit "$rest"
      ;;
    gen)
      case "$rest" in
        wave\ *) gen_wave "${rest#wave }" ;;
        *) die "gen: 아는 생성기는 wave 뿐이다 ($STEPS:$LINENO_STEPS)" ;;
      esac
      ;;
    *)
      die "모르는 지시자 '$op' ($STEPS:$LINENO_STEPS)"
      ;;
  esac
done < "$STEPS"

[ "$in_block" -eq 0 ] || die "닫히지 않은 히어독 블록 '$delim' ($STEPS)"
[ "$COMMIT_N" -gt 0 ] || die "커밋이 하나도 없다 ($STEPS)"

printf '%s: 커밋 %d개 · 파일 %d개 · %s\n' \
  "$1" "$COMMIT_N" "$(git ls-files | wc -l | tr -d ' ')" "$PWD"
