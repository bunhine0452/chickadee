---
schema_version: 1
type: feature
slug: "m0-day-utils-seed-tokenizer-fixtures"
status: done
difficulty: medium
created_at: "2026-09-02T22:23:14+09:00"
session_id: "20260902-004"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/scheduler/src/day.ts"
    op: create
  - path: "packages/scheduler/src/day.test.ts"
    op: create
  - path: "packages/text/src/seed.ts"
    op: create
  - path: "packages/text/src/seed.test.ts"
    op: create
  - path: "packages/text/src/index.ts"
    op: create
  - path: "scripts/make-fixture-repo.sh"
    op: create
  - path: "fixtures/repos/tiny.steps"
    op: create
  - path: "fixtures/repos/two-commits.steps"
    op: create
  - path: "fixtures/repos/projectox-like.steps"
    op: create
related: []
tags:
  - "m0"
  - "determinism"
  - "dst"
  - "prng"
  - "fixtures"
  - "mcp-tool"
---
[x] M0 · 하루 경계·시드·토크나이저·픽스처 리포 — 결정성이 필요한 네 가지

## 추가 기능

- `packages/scheduler/src/day.ts` — `dayKey`·`endOfDay`·`labelFor`. 날짜 라이브러리 없이 `Intl.DateTimeFormat` + `timeZone` 만 쓴다.
- `packages/text` — 신설(D50). `fnv1a32`·`seedOf`·`mulberry32`·`shuffle` + 04 §4.2 토크나이저(`src/tokenize.ts`, 파일명이 시크릿 스캐너 글롭 `**/*token*` 에 걸려 이 목록엔 못 올린다). 의존 0인 최하위 패키지라 `cards`·`grading`·`concepts` 셋이 형제 import 없이 쓴다.
- `scripts/make-fixture-repo.sh` + `.steps` 3종(`tiny`·`two-commits`·`projectox-like`). 06 §1.2 의 헤더를 그대로 쓰고, 커밋마다 날짜를 60초씩 고정 증가시킨다.

## 동작 흐름

**하루 경계와 DST 가 문서 안에서 어긋나 있었다(→ D54).** 02 §5.6 은 `dayKey = toZoned(now − rollover_hour·3600e3)` 라고 쓰면서 동시에 `due_at ≤ endOfDay(day)` 를 만기 기준으로 쓴다. 고정 4시간 빼기는 그 창에 DST 전이가 들어오면 둘이 어긋난다 — `America/New_York` `2026-03-08T04:30-04:00` 은 뺄셈식으로 `2026-03-07` 인데 이미 `endOfDay('2026-03-07')`(= `03-08T04:00-04:00`)를 지났다. **벽시계 규칙**(로컬 날짜에서, 로컬 시각이 `rollover_hour` 보다 이르면 하루 빼기)으로 구현했다 — 전이 없는 모든 순간에 뺄셈식과 같고 `endOfDay(d−1) ≤ t < endOfDay(d) ⟺ dayKey(t) = d` 를 유일하게 만족한다.

토크나이저는 목업과 의도적으로 다르다(04 §4.2) — 목업의 `\S` 단일 토큰은 `?.` 를 `?`+`.` 로 쪼개 `? .` 공백 삽입을 동등으로 본다. 다중문자 연산자를 길게 먼저 물고, 문자열 안 `//` 는 주석으로 자르지 않는다.

`.steps` 형식은 줄 단위 지시어(`write`/`delete`/`rename`/`commit`/`gen wave`)다. `projectox-like` 의 12,533줄은 `gen wave` 한 줄이 만든다 — 씨앗 LCG `x = (25173x + 13849) mod 65536` 로, 모듈러스를 double 에 정확히 담기는 크기로 골라 awk 구현이 달라도 같은 바이트가 나온다. `$RANDOM`·시계·로케일 의존 0.

## 검증

- `npx vitest run packages/text packages/scheduler` → 76 passed. 04:00 경계 3점(23:59·00:30·04:01), NY 봄·가을 전이, `endOfDay` 왕복, 라벨 5종, FNV-1a 표준 벡터, mulberry32 골든 8개, 토크나이저 골든.
- 픽스처 결정성: `tiny` 를 프로젝트 안/밖 두 경로에서, TZ·umask 를 바꿔 생성해도 `rev-list --all | shasum` 이 `e7d3f8d2…` 로 동일. `projectox-like` 도 `cd26485a…` 로 동일. 커밋 95개·파일 96개·12,533줄.
- `git status --untracked-files=all fixtures/` → `.steps` 3개만 뜬다. 생성물은 `.gitignore` 가 막는다.