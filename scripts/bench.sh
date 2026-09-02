#!/usr/bin/env bash
# scripts/bench.sh [--update] [criterion 인자...]
#
#   인제스트 벤치를 돌리고 bench/current.json 을 bench/baseline.json 과 견준다.
#   기준선보다 30 % 넘게 느려지거나 무거워지면 실패한다 (03 §7 · 06 §1.6).
#
#   기준선이 없으면 이번 결과로 만들고 통과시킨다 — 첫 실행은 비교할 대상이 없다.
#   기준선을 새 숫자로 갈아 끼우려면 --update. 06 §1.6 대로 그것은 사람이 PR 로 한다.
#
# 임계를 두 개로 두는 이유: 비율만 보면 1 ms 짜리 단계가 2 ms 가 됐을 때 +100 % 로
# 잡힌다. 절대 증가분(BENCH_FLOOR) 을 함께 넘겨야 실패로 친다.
set -euo pipefail
cd "$(dirname "$0")/.."

TOLERANCE=${BENCH_TOLERANCE:-30}   # %
FLOOR=${BENCH_FLOOR:-20}           # ms 또는 MB — 이보다 작은 증가는 잡음으로 본다
BASELINE=bench/baseline.json
CURRENT=bench/current.json

update=0
args=()
for arg in "$@"; do
  case "$arg" in
    --update) update=1 ;;
    -h|--help) sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) args+=("$arg") ;;
  esac
done

# 픽스처는 커밋하지 않는다 (06 §1.2) — 없으면 여기서 만든다.
for name in tiny large-100k; do
  if [ ! -d "fixtures/repos/$name/.git" ]; then
    echo "── 픽스처 생성: $name"
    bash scripts/make-fixture-repo.sh "$name"
  fi
done

echo "── cargo bench"
cargo bench -p chickadee-app --bench ingest -- ${args[@]+"${args[@]}"}

[ -f "$CURRENT" ] || { echo "bench: $CURRENT 가 없다 — 벤치가 결과를 내지 못했다"; exit 1; }

if [ "$update" -eq 1 ]; then
  cp "$CURRENT" "$BASELINE"
  echo "bench: 기준선을 이번 결과로 갱신했다 — $BASELINE"
  exit 0
fi

if [ ! -f "$BASELINE" ]; then
  mkdir -p bench
  cp "$CURRENT" "$BASELINE"
  echo "bench: 기준선이 없어 이번 결과를 기준선으로 삼았다 — $BASELINE"
  exit 0
fi

node - "$BASELINE" "$CURRENT" "$TOLERANCE" "$FLOOR" <<'NODE'
const fs = require("node:fs");
const [, , basePath, currPath, tolArg, floorArg] = process.argv;
const base = JSON.parse(fs.readFileSync(basePath, "utf8"));
const curr = JSON.parse(fs.readFileSync(currPath, "utf8"));
const tolerance = Number(tolArg);
const floor = Number(floorArg);

const hostOf = (j) => `${j.host?.os ?? "?"}/${j.host?.arch ?? "?"} x${j.host?.parallelism ?? "?"}`;
if (hostOf(base) !== hostOf(curr)) {
  console.log(`경고: 기준선은 ${hostOf(base)} 에서 떴고 지금은 ${hostOf(curr)} 다 — 비교는 참고만.`);
}

const budget = curr.budget ?? {};
const rows = [];
let failed = 0;
for (const [key, was] of Object.entries(base.metrics ?? {})) {
  const now = curr.metrics?.[key];
  if (typeof now !== "number" || typeof was !== "number") continue;
  // 0 은 「측정 못 함」이다 (피크 RSS 의 윈도 경로) — 비교하지 않는다.
  const delta = was === 0 ? 0 : ((now - was) / was) * 100;
  const bad = was !== 0 && delta > tolerance && now - was > floor;
  if (bad) failed += 1;
  rows.push({
    key,
    was,
    now,
    delta: was === 0 ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`,
    budget: budget[key] ?? "—",
    over: typeof budget[key] === "number" && now > budget[key] ? "예산 초과" : "",
    bad,
  });
}

const pad = (s, n) => String(s).padStart(n);
console.log("");
console.log(`  ${"metric".padEnd(16)}${pad("기준선", 10)}${pad("이번", 10)}${pad("차이", 9)}${pad("03 §7", 9)}`);
for (const r of rows) {
  const mark = r.bad ? "  FAIL" : r.over ? `  ${r.over}` : "";
  console.log(`  ${r.key.padEnd(16)}${pad(r.was, 10)}${pad(r.now, 10)}${pad(r.delta, 9)}${pad(r.budget, 9)}${mark}`);
}
console.log("");
if (failed > 0) {
  console.log(`bench: ${failed}개 지표가 기준선 대비 +${tolerance}% 를 넘었다 (06 §1.6)`);
  process.exit(1);
}
console.log(`bench: 모든 지표가 기준선 +${tolerance}% 안에 있다`);
NODE
