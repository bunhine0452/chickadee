---
schema_version: 1
type: feature
slug: "wire-feature-units"
status: done
difficulty: high
created_at: "2026-09-04T22:21:28+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/03-ingest-parsing-dictionary.md"
    op: update
  - path: "packages/concepts/src/units.ts"
    op: update
  - path: "packages/concepts/src/units.test.ts"
    op: update
  - path: "packages/concepts/src/ingest.ts"
    op: update
  - path: "packages/concepts/src/index.ts"
    op: update
  - path: "packages/store-sql/statements/derive.sql"
    op: update
  - path: "packages/store-sql/src/catalog.ts"
    op: update
  - path: "packages/cards/src/t2-perf.test.ts"
    op: update
  - path: "tests/support/source-bytes.test.ts"
    op: update
related:
  - ref: "20260904/Features_to_add/2213_feature_entry-point-feature-units.md"
    kind: "followup"
tags:
  - "D160"
  - "대지"
  - "N:M"
  - "시험-플레이크"
  - "MonggleMonggle"
  - "mcp-tool"
---
[x] `entryUnits` 를 인제스트에 붙이고, 문서의 1:1 을 고치고, 흔들리던 시험 둘을 잡는다

## 추가 기능

앞 판이 알고리즘만 내고 배선을 안 했다. 막던 것이 03 §6.5 의 「`unit_file` 은 파일→대지 1:1」
한 문장이었는데, **D160 이 등록부에 이미 올라 있으므로 설계 문서를 고치는 것은 이 판의 몫**이다
(정본은 안 건드린다).

## 실리포 결과 — 「main 107」이 사라졌다

| 전 | 후 |
|---|---|
| **main 107** · example_dataset 26 · services 24 · components 12 · views 9 · 기타 8 · src 4 · stores 4 · composables 3 (대지 9) | **auth 18 · dream 17 · dreamResult 16 · fortune 13 · image 6 · monthlyAnalysis 27 · notice 27 · ranking 7** + main 26 · example_dataset 26 · services 15 · components 12 · views 9 · 기타 8 · src 4 · stores 4 · composables 3 (대지 17) |

기능 여덟이 백엔드 **81파일**을 가져가고 `main` 은 26으로 줄었다. 남은 26이 예고한 그대로다 —
`SecurityConfig`·`JwtAuthenticationFilter`·부트 클래스·설정처럼 **Spring 이 런타임에 엮어서**
어느 폐포에도 안 드는 것들이다. **잃은 파일 0 · 겹쳐 든 파일 13.**

## 동작 흐름

**① `planUnits`** — 기능(진입점 폐포)이 먼저 서고 **어느 기능에도 안 든 파일만** 디렉터리 규칙이
받는다. 두 규칙이 경쟁하지 않고 층을 나눈다.

**② `writeEdges` 가 해석 결과를 함께 돌려준다** — 대지가 같은 것을 다시 풀지 않게. 순서는
원래 맞았다(엣지 231행 → 대지 234행).

**③ `writeUnitNodes` 가 대지를 다시 파생하지 않는다.** 전에는 `assignUnits` 를 두 번째로 돌려
같은 규칙을 두 곳에서 실행했다 — 어긋날 자리였고, 게다가 그쪽은 엣지를 못 본다.
새 질의 `derive.unit_files` 로 **방금 쓴 것을 읽는다.**

## 잡은 버그 하나 (내가 낸 것)

이름 충돌 처리에서 `units.some((u) => u.name === name)` 으로 걸렀는데, **기능이 먼저 넣은 같은
이름에 걸려** 밀려나야 할 디렉터리 파일이 그 기능 안으로 들어갔다. 시험이 잡았다
(`src/auth/x.ts` 가 `기타` 대신 `auth` 로). 이 패스가 실제로 세운 이름만 세도록 고쳤다.

## 흔들리던 시험 둘

- **`t2-perf`** — 단일 측정이라 179파일 병렬의 부하를 그대로 맞았다(5ms 예산에 10.3ms).
  **가장 빠른 한 번**(표본 5 + 워밍업)을 보게 바꿨다. 재는 것은 「이 코드가 5ms 안에 되는가」이지
  「지금 이 기계가 한가한가」가 아니다. 예산 값은 안 건드렸다.
- **`source-bytes`** — `.seed` 가 `SKIP_DIRS` 에 없어, 다른 시험이 시드 DB 를 쓰는 동안
  나타났다 사라지는 `ui.sqlite-journal` 에 `statSync` 가 ENOENT 로 터졌다. `.seed` 를 더했다.

**전체 시험 3회 연속 초록**으로 확인했다 — 고치기 전에는 세 번 중 한 번이 빨갰다.

## 검증

`pnpm test:unit` **180파일 / 2,038건 전량 통과**(2,034 → 2,038, `planUnits` 시험 4) ·
`typecheck`·`lint` 무출력 · `catalog:build` statement 179개 · 실리포 재측정(위 표).

## 남은 것

- **`t2-graph.ts` 는 아직 `assignUnits` 를 직접 쓴다** — T2 구조 카드의 대지 판정이라 홈과
  다른 답을 낼 수 있다. 같은 `planUnits` 로 옮길지는 T2 를 손댈 때 정한다.
- **`.vue` 24파일** — 지금 폐포의 진입점이 전부 `services/*.js` 인데, 사용자가 실제로 버튼을
  누르는 자리는 `.vue` 안이다. SFC 는 한 파일에 문법 셋이라 `extensions` 모델을 손대야 한다.
- 대지 이름이 `authService.js` 에서 뽑은 `auth` 다. 사람이 읽는 이름(「로그인」)으로 바꾸려면
  라우트나 사전이 있어야 한다.