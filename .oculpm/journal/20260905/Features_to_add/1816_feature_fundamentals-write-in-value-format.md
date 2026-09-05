---
schema_version: 1
type: feature
slug: "fundamentals-write-in-value-format"
status: done
difficulty: high
created_at: "2026-09-05T18:16:47+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/program/fundamentals.md"
    op: create
  - path: "packages/cards/src/fundamentals.ts"
    op: create
  - path: "packages/cards/src/fundamentals.test.ts"
    op: create
  - path: "packages/grading/src/fundamentals.ts"
    op: create
  - path: "packages/grading/src/fundamentals.test.ts"
    op: create
  - path: "packages/cards/src/index.ts"
    op: update
  - path: "packages/grading/src/index.ts"
    op: update
related: []
tags:
  - "fundamentals"
  - "course"
  - "grading"
  - "cards"
  - "design"
  - "mcp-tool"
---
[x] 기초 문항을 고르기에서 적기로 — 형식 넷 확정과 value 생성기·채점기

## 추가 기능

정식 코스 1·2부(D177)의 판이 전부 고르기다 — `makeSyntheticCard` 가 `point`·`blank`·`meaning`
중 하나를 굽는다. 4지선다는 소거법으로 맞을 수 있어 정본 §1 「강제된 능동 출력」과 충돌한다.
사전은 이미 「`7 / 2` 가 `3` 입니다」를 **설명**하는데 앱이 그것을 **묻지** 않는다.

`docs/program/fundamentals.md` 로 여섯 형식을 **넷으로 깎아** 확정했다 —
`value`·`step`·`table`·`build`. `bits` 는 `table` 의 한 배치로, `predict` 는 `value` 의
판정란으로 내렸다. `build` 는 D175 러너로 못 선다(코드 확인: `RunSpec` 이 `repoId`·`lang:'java'`
고정, 어댑터가 `javaRunner` 하나)라 조건부로 남겼다.

작동하는 조각으로 `value` 한 형식만 만들었다 — 열 언어 규칙표 + 식 넷(`int-div`·`mod-neg`·
`float-add`·`int-overflow`) → 38장, 그리고 타입 인지 정규화와 오답 분류 아홉.

## 동작 흐름

1. `buildValueItems(lang)` 가 `FUND_DIALECTS[lang]` 의 규칙으로 식 넷을 굽는다. 못 내면
   사유를 단다(SQL 은 둘 — 셸이 실수를 15자리로 줄여 찍고, 두 줄 선언이 없다).
2. 문항이 `siblings`(같은 식의 다른 언어 답)와 `fold`(기계의 걸음)를 함께 싣는다.
3. `gradeValue(item, raw)` 가 정규화 후 값 일치를 본다. 실수는 엡실론이 아니라
   `Number()` 파싱의 **같은 double 인가**로 — `0.30000000000000005` 는 통과하고 `0.3` 은 안 된다.
4. 틀리면 분류가 진단을 고른다. `other-language` 는 `siblings` 에서 언어를 찾아 낸다 —
   진단문을 사람이 안 적는다.

## 결정과 근거

- **저장** — `card.kind` 에 `value` 하나만 더하고 넷은 `payload.type` 으로 가른다.
  D151 의 DDL-0 길은 그 문항이 선택형이라 가능했던 것이고 값 적기는 `CardPayload` 의 어느
  변형에도 안 들어간다. 죽은 `meaning` 재활용은 통계·은퇴 규약이 두 뜻을 섞어서 뺐다.
  마이그레이션 `0010` 은 **설계만 적고 만들지 않았다**.
- **다섯 단 밖이다** — `0007` 의 `stage_reached BETWEEN 0 AND 5` 에서 0 이 「아직」이라
  0단을 만들 자리가 없고, `chapter` 가 `unit` 과 1:1 이라 합성 예제에 줄 행이 없다.
  정본 §4 의 1부에 앉고 진도는 잉크 겹이 잰다.
- **재료는 카탈로그** — 사전 `examples[]` 224개 중 값을 든 것 **0개**, `expect` 에 값을 적을
  필드가 없고 예제 코드가 계산도 안 된다(`const total = a + b`). `result.value` 58개 중 46개가
  mustache 패턴이고 진짜 값은 넷뿐. `cs/` 43장은 예제 0개.

## 검증

`pnpm typecheck` · `pnpm lint` 통과, 새 시험 36개(cards 19 · grading 17) 통과,
`pnpm test:unit` 2299 통과 1 skip. 시험이 버그 둘을 잡았다 — `-inf` 가 접미사 규칙에 걸려
`-in` 이 되던 것과, `7 / 2` 의 `3.5` 를 `ideal-math` 로 분류하던 것(`other-language` 가
앞이어야 한다).

## 메모

앱에 아직 안 붙였다 — 순수 함수 둘이고 payload 변형·i18n 키·화면은 없다.
`FUND_DIALECTS` 열 행 중 일곱이 명세를 읽고 적은 것이라 착수 전 실측이 필요하다.
`docs/program/README.md` 의 문서 표에 행 하나가 빠져 있다(범위 밖이라 안 건드렸다).