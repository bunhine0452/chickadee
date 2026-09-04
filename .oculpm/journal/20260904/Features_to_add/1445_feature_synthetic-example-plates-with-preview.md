---
schema_version: 1
type: feature
slug: "synthetic-example-plates-with-preview"
status: done
difficulty: high
created_at: "2026-09-04T14:45:46+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/cards/src/t0-synthetic.ts"
    op: create
  - path: "packages/cards/src/t0-synthetic.test.ts"
    op: create
  - path: "packages/cards/src/index.ts"
    op: update
  - path: "packages/grading/src/ladder.ts"
    op: correct
  - path: "packages/grading/src/ladder.test.ts"
    op: correct
  - path: "packages/store-sql/statements/home.sql"
    op: update
  - path: "packages/store-sql/src/catalog.ts"
    op: update
  - path: "apps/desktop/src/data/ladder.ts"
    op: update
  - path: "apps/desktop/src/data/cards.ts"
    op: update
  - path: "apps/desktop/src/session-flow.ts"
    op: update
  - path: "apps/desktop/src/components/session/PrereqRung.tsx"
    op: update
  - path: "apps/desktop/src/components/session/PrereqRung.test.tsx"
    op: update
  - path: "apps/desktop/src/screens/session/T0Plate.tsx"
    op: update
  - path: "apps/desktop/src/screens/session/SessionScreen.tsx"
    op: update
  - path: "packages/i18n/src/ko/session.ts"
    op: update
  - path: "packages/i18n/src/en/session.ts"
    op: update
  - path: "packages/i18n/src/ko/cards.ts"
    op: update
  - path: "packages/i18n/src/en/cards.ts"
    op: update
  - path: "tests/support/quality.test.ts"
    op: update
  - path: "docs/04-grading-engines.md"
    op: update
  - path: "docs/05-frontend.md"
    op: update
  - path: ".oculpm/discussion/vibe-code-study-app/discussion.md"
    op: update
  - path: "docs/00-overview.md"
    op: update
related:
  - ref: "20260904/Features_to_add/1427_feature_zero-chapter-sheet-on-home.md"
    kind: "followup"
tags:
  - "v04"
  - "zero-chapter"
  - "d137"
  - "mcp-tool"
---
[x] 합성 예제 판 — 예고를 타입과 큐로 강제하고, 뒤집혀 있던 판정 방향을 바로잡았다

## 추가 기능

D137 — 합성 예제 판. 사용처는 내 코드에 있는데 미지가 많아 아직 못 여는 개념에, 사전이 든 **가장 단순한 모양**을 먼저 보여 주고 그 사용처를 예고한다. **LLM 0회 · Rust 0줄.**

## 바로잡은 것 — 판정 방향이 뒤집혀 있었다

`packages/grading/src/ladder.ts` 의 `buildPrereq` 가 이렇게 적혀 있었다:

```
none: fact?.inRepo ? 'no-plate' : 'synthetic'
```

즉 **리포에 사용처가 없을 때** 합성 예제를 내라는 뜻이었다. 그런데 방안 E-4 는 합성 예제에 「곧 네 코드 **어디에서** 이걸 보게 된다」를 반드시 붙이라고 조건을 걸었다 — 사용처가 없으면 그 **어디**가 없다. 조건을 지킬 수 없는 경우에만 합성을 내고 있었던 셈이다.

D137 이 방향을 뒤집었다. 사용처가 **있어야** 합성이고, 없으면 「판 없음」이다.

## 동작 흐름

1. **생성** — `packages/cards/src/t0-synthetic.ts` 의 `makeSyntheticCard(req)`. `previewSiteId` 가 **선택이 아니라 필수 인자**다(`Omit<T0Request,'sites'|'previewSiteId'> & { previewSiteId: number }`). 문서에만 있는 조건은 지켜지지 않으므로 타입이 강제한다. 재료는 사전 `examples[].code` + `expect.picks` 를 사용처 모양으로 싼 것이고, 생성기는 이것이 합성인지 모른 채 평소대로 돈다 — 오답 선정·시드·누설 검사가 그대로 걸린다.
2. **상태 넷** — `stateOf` 가 `ok`/`gap`/**`preview`**/`none` 으로 갈린다. `preview` = 사용처 있음 + 카드 없음. `concept.prereqs` 에 `best_site_id`(미지 최소 사용처)를 더해 예고 대상을 낸다.
3. **화면** — 「판 없음」 알약 대신 「가장 단순한 모양으로 먼저 보기」 단추와 예고 한 줄(`.prereq-preview`). `previewSiteId` 가 없으면 문단을 아예 안 그린다.
4. **예고를 큐로 지킨다** — 합성 판을 **맞히면** `makePlateFor` 로 예고한 사용처의 카드가 그날 큐에 `role='gap'` 으로 들어간다. 이 자리가 없으면 「곧 여기서 봅니다」는 빈말이다. `data/manual.ts` 가 `startSession` 을 가져가므로 모듈 순환을 피해 동적 import 로 부른다.
5. **게이트** — `quality.test.ts` 에 여섯째 수치: `site_id IS NULL` 인 카드 중 `previewSiteId` 없는 것 = 0. 원장을 직접 세므로 생성기를 우회한 행도 잡는다. 지금 시드에서는 0/0 이라 **회귀 방벽**이다.

## 실측이 설계를 한 번 뒤집었다

처음에 합성 유형을 **지목형 고정**으로 짰다가 뒤집혔다. 0장이 담는 뿌리 개념 넷 중 셋(`ts/string-literal`·`ts/number-literal`·`ts/undefined-null`)은 사전에 `point:` 문항이 **0개**고, `ts/const-declaration` 은 문항이 있어도 예제 `const total = 42` 에서 짚을 후보가 셋뿐이라 04 §1.1 이 요구하는 넷을 못 채운다.

ts `essential` 22개 실측: `meaning:` **22** · `point:` **19** · `blank:` **2** · `why_gate:` **0**. 병렬 세션이 낸 수치와 일치한다.

그래서 유형을 고정하지 않고 `prefer(ly)` 사슬을 그대로 태운다. 사전이 채워지면 같은 개념이 저절로 지목형으로 올라선다 — 생성기를 고칠 필요가 없다.

## 곁가지

`apps/desktop/src/data/ladder.ts` 의 `noteOf` 가 곁말 넷을 한국어로 하드코딩하고 있었다(`'아직 안 찍음'`·`'판이 없습니다'` 등, D117 위반). 어차피 고칠 함수라 `t()` 로 돌리고 `prereq.note*` 다섯 키를 ko/en 에 넣었다.

## 정본

사용자 승인(2026-09-04)으로 정본 「결론」 §4 에 0장 한 문장을 넣었다. `docs/00` §4.3 에 근거를 적고 discussion.md 로그에 한 줄, frontmatter `updated` 를 갱신했다. **뜻을 바꾼 것이 아니라 방안 E-2 가 이미 채택한 것을 결론에 적은 것**이다 — 결론에 없어서 코드 두 곳이 「0장이 안내한다」고 약속만 하고 받는 쪽이 없었다.

## 검증

- `pnpm test:unit` — **1,815개 통과**(P1 끝 1,795 → +20). 합성 생성기 14(진짜 번들 사전에 대고 돈다 — 「사전이 재료를 이미 갖고 있다」가 이 기능의 주장이라 모형 사전으로 재면 그 주장을 검사하지 않는 것이 된다), 예고 화면 6.
- `pnpm typecheck` · `pnpm lint` · `pnpm -r build` 초록. `check-rust-budget.sh` **2,331/2,800 — 변함없음**.
- `quality.test.ts` 통과, 표에 「합성 site_id 없는 판 중 예고 없는 것 0」 줄이 찍힌다.
- 전체 실행 중 `packages/grading/src/t1.test.ts` 의 「거터 한 줄 < 0.2 ms」가 한 번 빨갰다가 재실행에서 통과했다 — 부하 아래 시간 재기라 플레이크이고, 이번 변경은 T1 거터를 건드리지 않는다.
- 아직 안 한 것: 앱을 띄워 합성 판을 눈으로 보지 않았다. 예고→큐 삽입은 단위 테스트가 아니라 세션 흐름이라 실제 세션에서 한 번 확인해야 한다.