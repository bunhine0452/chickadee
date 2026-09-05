---
schema_version: 1
type: feature
slug: "t2-repo-map-entry-role"
status: in_progress
difficulty: high
created_at: "2026-09-04T16:28:18+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/cards/src/t2-graph.ts"
    op: update
  - path: "packages/cards/src/t2-quiz.ts"
    op: update
  - path: "packages/cards/src/t2-types.ts"
    op: update
  - path: "packages/cards/src/t2.ts"
    op: update
  - path: "packages/cards/src/t2-graph.test.ts"
    op: update
  - path: "packages/cards/src/t2.test.ts"
    op: update
  - path: "apps/desktop/src/data/graph.ts"
    op: update
  - path: "apps/desktop/src/data/graph.test.ts"
    op: update
  - path: "apps/desktop/src/data/t2.test.ts"
    op: update
  - path: "dictionary/arch/entry.yaml"
    op: create
  - path: "dictionary/arch/role.yaml"
    op: create
  - path: "docs/04-grading-engines.md"
    op: update
related: []
tags:
  - "t2"
  - "graph"
  - "dictionary"
  - "arch"
  - "mcp-tool"
---
[ ] 리포 지도 — 파일 69장이 폴더 6노드로 접히고 「문」과 「이 폴더는 왜 있나」가 그 위에 선다 (D142)

## 동기

D140 이 T2 회전을 고쳤지만 네 종(책임 배치·영향 반경·흐름 추적·의존성 방향)은 전부 **파일
단위**라 사용자가 말한 「이 프로젝트는 이런 구조구나」에 답하지 않는다. 지도의 범위가
04 §7.4 의 「대지 + 1-hop」뿐이고, 리포 전체를 보여 주는 화면이 앱에 하나도 없었다.

## 추가 기능

**1. `buildGraph({ scope: 'repo' })`** — 노드가 파일이 아니라 대지·폴더다.

- 접기는 `assignUnits`(03 §6.5 · D29)를 그대로 쓴다. 새 휴리스틱을 만들지 않았다 — 홈이
  인쇄 시트를 세는 규칙과 지도가 폴더를 세는 규칙이 갈라지면 같은 리포의 두 그림이 다른
  이야기를 한다. 대지 이름이 같은 뿌리 둘(`app/cart/`·`features/cart/`)은 `assignUnits` 가
  한 이름으로 합치므로, 그 뿌리 밑에 없는 파일은 제 디렉터리로 접는다.
- 엣지는 폴더 쌍으로 집계하고 쌍마다 선 하나. 종은 `static > http > dynamic > type`.
- **접기는 밴드가 정해진 뒤에** 한다. 폴더 층은 ① `folderBand` ② 없으면 안에 든 파일이
  가장 많이 앉은 층. 그 뒤 `band ≥ importer` 를 폴더 엣지로 한 번 더 돌린다.
- 순환·고립은 접은 뒤 폴더 단위로 다시 센다.
- 24 노드 상한(D102)은 접기가 저절로 지킨다. `DependencyMap` 은 손대지 않았다.

**2. `arch/entry`** — 「밖에서 처음 들어오는 문」. core = in-degree 0 인 폴더 중
(out-degree > 0 ∨ 진입점 이름을 품음), sec = 이름은 품었는데 안에서도 부르는 폴더,
trap = 나머지 전부. 채점은 기존 `gradePicks` 3티어 그대로.

**3. `arch/role`** — 「«lib/» 폴더는 왜 있나요?」 4지. 보기는 `payload.bands` 의 네 라벨,
정답은 그 색인. **물어볼 폴더는 지도에서 뺀다** — 밴드 행 라벨이 곧 보기라 그려 두면 정답을
읽어 주는 셈이다. 그래서 지도를 두 번 짓는다.

**4. 사전** `dictionary/arch/{entry,role}.yaml` — ko 정본 + en 병기 (D117·D118).

## 초안을 고친 세 군데

- **진입점 정답지.** 초안의 「`ENTRY_NAME` ∪ (in-degree 0 ∧ out-degree > 0)」은 폴더 단위에서
  거의 모든 폴더를 정답으로 만든다 — TS 리포의 `index.ts` 는 문이 아니라 재수출 통이고
  폴더마다 하나씩 있다. 이름을 in-degree 0 위의 확인으로 내리고, 이름만 있는 폴더는 sec 로.
- **폴더 층을 안 파일의 최댓값으로** 잡으면 `.tsx` 넷과 `types.ts` 하나가 든 기능 폴더가
  통째로 「공용 · 데이터」로 가라앉는다(실측: 여섯 노드 중 넷). 최솟값은 아무도 안 쓰는 파일
  하나가 폴더를 꼭대기로 끌어올린다. 최빈값 + `relax` 로 갔다.
- **모노리포**: `patternBand` 는 리포 뿌리에 매달려 있어 `apps/desktop/src/components/` 를
  모른다(실측: 다섯 노드 전부 미매칭). 폴더 노드에만 마지막 `src/` 까지 벗기는 `folderBand`
  를 따로 뒀다 — 파일 쪽 규칙은 안 건드렸다. 건드리면 이미 구운 카드의 해시가 전량 바뀐다.

## 휴리스틱 약점을 막은 자리

「왜 있나」의 정답이 경로 패턴(04 §7.2 ①)에 기댄다. 게이트를 셋 걸었다.

1. 폴더 경로 자체가 §7.2 ① 에 걸려야 한다 — **깊이로 추정된 층(②)은 묻지 않는다.**
2. 그 패턴이 지도가 실제로 앉힌 층과 **같아야** 한다. 다르면 패턴이 거짓말한 것이다.
3. `MIN_ROLE_MEMBERS`(2) — 파일 한 장짜리는 폴더가 아니다.

지도가 안 서는 리포(대지가 `기타` 하나뿐, `MIN_FILES_FOR_UNIT` 미달)와 노드가
`MIN_REPO_NODES`(6)에 못 미치는 리포에는 두 종 다 내지 않는다.

## 실측

`fixtures/ipc/projectox-like` 의 Rust 덤프: **파일 69 → 노드 6 · 엣지 71 → 6**, 지도 밖 0.
가장 큰 폴더가 파일 30장을 노드 하나로 접는다. `apps/desktop/src`(파일 106 · 엣지 193)는
노드 5. 그 리포에서 진입점은 나오지 않는다 — in-degree 0 인 폴더가 넷이라 「정답이 지도의
절반」 조건에 걸린다. 문이 넷이라는 뜻이고, 안 내는 것이 맞는 답이다.

Rust 0줄(2331/2800 그대로) · LLM 0회 · 새 statement 0개(노드는 `clone.course_files`, 엣지는
`t2.edges` 에 파일 id 전부를 넘겨 받는다 — 카탈로그를 다시 굽지 않아도 된다).

## 아직 안 된 것 (부모 몫 — 소유 밖 파일)

이 세션은 `packages/store-sql`·`packages/i18n`·`packages/grading`·마이그레이션을 소유하지
않는다. 그 넷이 들어오기 전까지 두 종은 **DB 에 저장되지 않는다** — `card.kind` 의 CHECK 가
여섯 값만 허용한다. 보고서에 옮길 SQL·키·문안을 전부 적어 두었다.

## 검증

- `npx vitest run` — T2 6파일 162 테스트 전부 통과 (새 테스트 15).
- `tsc --noEmit` — cards · grading · concepts · desktop 넷 다 깨끗.
- `eslint` 변경 9파일 0건 · `check-rust-budget.sh` 2331/2800.
- `dict:lint` — 스키마·린트 통과. 부채 래칫 1건은 다른 세션(`dictionary/ts/**`)이
  `blank-or-reason` 을 23/23 으로 채워 생긴 것이고 내 두 파일과 무관하다(파일을 빼고 돌려
  확인). `t0`·`t1` 테스트 5건 실패도 같은 이유로 이 변경 이전부터다.