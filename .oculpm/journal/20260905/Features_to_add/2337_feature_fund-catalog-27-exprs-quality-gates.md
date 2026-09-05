---
schema_version: 1
type: feature
slug: "fund-catalog-27-exprs-quality-gates"
status: done
difficulty: high
created_at: "2026-09-05T23:37:37+09:00"
session_id: "20260905-003"
agent:
  id: "claude-code"
  session: "acp-20260905-d4ae2987"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/cards/src/fundamentals-dialects.ts"
    op: create
  - path: "packages/cards/src/fundamentals-catalog.ts"
    op: create
  - path: "packages/cards/src/fundamentals.ts"
    op: update
  - path: "packages/cards/src/fundamentals.test.ts"
    op: update
  - path: "packages/cards/src/t0-meaning.ts"
    op: update
  - path: "packages/cards/src/index.ts"
    op: update
  - path: "packages/cards/src/build.ts"
    op: update
  - path: "packages/grading/src/fundamentals.ts"
    op: update
  - path: "packages/grading/src/fundamentals.test.ts"
    op: update
  - path: "packages/grading/src/index.ts"
    op: update
  - path: "packages/i18n/src/ko/fund.ts"
    op: create
  - path: "packages/i18n/src/en/fund.ts"
    op: create
  - path: "packages/i18n/src/ko.ts"
    op: update
  - path: "packages/i18n/src/en.ts"
    op: update
  - path: "tests/support/quality.ts"
    op: create
  - path: "tests/support/quality-gate.test.ts"
    op: create
  - path: "tests/gates/quality.spec.ts"
    op: create
  - path: "tests/gates/quality.allow.json"
    op: create
  - path: "package.json"
    op: update
  - path: "docs/program/fundamentals.md"
    op: update
related: []
tags:
  - "fundamentals"
  - "D186"
  - "D187"
  - "catalog"
  - "gates"
  - "mcp-tool"
---
[x] 기초 문항 카탈로그를 식 넷에서 스물일곱으로 — 진단 재료 셋과 학습질 게이트 셋

## 추가 기능

**① 카탈로그 확장 — 38장 → 249장.** 식 넷(`int-div`·`mod-neg`·`float-add`·`int-overflow`)을
0부 축 여덟에 걸쳐 **스물일곱**으로 늘렸다. 축마다 셋 이상이고, 못 낸 식 21개에는 전부 사유가
있다. 파일을 셋으로 갈랐다 — 규칙(`fundamentals-dialects.ts`, 스물세 열) · 식
(`fundamentals-catalog.ts`) · 접는 자리(`fundamentals.ts`).

새로 갈리는 자리 몇: TS 의 `1 << 31` 이 −2147483648(수는 double 인데 비트 연산만 32칸) ·
러스트의 `!0` 이 −1(비트 뒤집기) · Go·Swift 만 `<<` 가 `+` 보다 먼저 · 파이썬만 `1 < 2 < 3` 이
사슬 · SQL 의 `0 = '0'` 은 **0**(JS 의 `0 == "0"` 은 true) · `"😀"` 의 길이가 넷으로 갈린다.

**② 진단 재료 셋.** `siblings`(언어 밖) 하나로는 안 됐다 — `2 + 3 * 4` 는 열 언어가 전부 14고
자바·C# 은 `FUND_DIALECTS` 행이 같아 서로의 형제가 못 된다. `variants`(같은 언어, 한 글자
다른 판)와 `langAlt`(같은 언어, 다른 규칙)를 더했고, `FundValue` 에 `compile-error` ·
`unspecified` 를 더해 「답이 없다」를 값으로 표현했다. 셋 다 없으면 `no-diagnosis` 로 **없다고
말한다**(D186 ④ — `unknown` 과 갈라 둔다).

값이 같은 「다른 판」은 생성기가 한 번에 거른다(`usefulAlts`) — `true + true` 자리의
`true + false` 는 자바에서 둘 다 컴파일 오류라 진단이 아니라 소음이다.

**③ 재출제는 다른 식 같은 개념** (D187 ②). `planFundRetry(lang, id, seenToday)` 가 같은
`conceptId` 의 다른 식을 난수 없이 고른다. 식이 하나뿐이면 `sameExpr` 로 그 사실을 말한다.
개념 anchor 를 `cs/` 에서 축 개념으로 옮긴 것이 이것을 가능하게 했다 — `cs/floating-point` 를
`float-add` 의 개념으로 두면 그 개념에 식이 하나뿐이다. `cs/` 는 `machineId` 둘째 자리로.

**④ `meaning` 교체 범위** (D187 ③). 값이 계산되는 개념 40장에서 4지선다 대신 값 적기로
간다. 목록·근거를 `fundamentals.md` §10 ① 에 닫았다.

**⑤ 학습질 성질 게이트 셋** (D186 ③) — `tests/support/quality.ts`(엔진) ·
`quality-gate.test.ts`(시험) · `tests/gates/quality.spec.ts`(브라우저 게이트) ·
`quality.allow.json`(문턱·예외, 만료일 필수). 세 게이트 다 수치를 콘솔 표로 찍는다.

## 동작 흐름 — 막힌 자리 셋과 그 답

**`meaning` 을 `genMeaning` 에서 막았더니 시드 드롭률이 0% → 18.2% 가 됐다.** 대신 낼 판이
아직 앱에 안 붙어 있는데 판만 뺀 것이다. D187 ③ 의 범위는 **1부(합성 예제)**이므로
`site.id === SYNTHETIC_SITE` 로 좁혔고 4.5% 로 돌아왔다. `cs/` 45장도 제외했다 — 기계 개념은
값을 묻는 자리가 아니라 설명하는 자리다.

**성질 게이트를 Playwright 에 못 둔다.** 사전 번들이 `import.meta.glob` 이라 Playwright
로더에서 안 열린다(D108 과 같은 벽). 센서스는 vitest 에서 돌고 브라우저 게이트는 그 수치를
읽는다. 처음엔 스펙이 자식 vitest 를 띄웠는데 **WebKit 판 31개가 한꺼번에 죽었다** — 워커 풀
둘이 CPU 를 다투는 동안 `vite preview` 가 응답을 멈췄다(「Could not connect to the server」).
`test:gates` 가 브라우저 앞에 `pnpm test:quality` 를 한 걸음 넣도록 바꾸고, 스펙은 `builtAt`
으로 **낡았는지**만 보고 낡았으면 그때만 굽는다.

**시드로 값 추적 판을 못 굽는다.** 픽스처 리포가 없어 원문 줄이 없고 `ast_json` 도 비어 있다.
그래서 (ㄴ)는 「구워지나」가 아니라 **「구워지거나, 사유가 남거나」**를 잰다. 오늘 실제로 서는
값 추적 판은 0부 사다리 쪽이고 열 언어 전부에서 선다.

## 실측

| 잰 것 | 값 |
|---|---|
| 카탈로그 장 수 | 38 → **249** (식 4 → 27, 못 낸 식 21) |
| 개념당 식 | (언어, 개념) 79쌍 — 2식 2 · 3식 63 · 4식 14 · **1식 0** |
| 진단 재료 | siblings 219 · variants 204 · langAlt 6 (우선순위 분류: 형제 219 · 다른 판 30 · **없음 0**) |
| (ㄱ) 내 코드 비율 | `tiny` **16/16 = 100%** (문턱 50% — J2 자바 0부 53% 아래 첫 자리) |
| (ㄴ) 2단 값 추적 | 사유 없는 침묵 **0** · 0부 사다리 판 **10/10** 언어 |
| (ㄷ) 오답 진단 | **249/249** · 축 셋 미만 세 자리는 예외 목록(만료일 있음) |
| `meaning` → `value` | 개념 **40장** (사전 실재 기준) |
| 시험 | cards 19 → **42** · grading 17 → **26** · 성질 게이트 1 |

## 검증

`pnpm typecheck` 초록 · `pnpm lint` 초록 · `pnpm test:gates` **202 통과 / 10 건너뜀**.
`pnpm test:unit` 은 2,581/2,583 통과이고 남은 하나는 `packages/dictionary/src/dict.test.ts`
의 `DEBT_RATCHET`(104 → 120 으로 올려 잠글 것) — S6 가 파이썬 사전을 채우는 중이라 생긴
것이고 이 작업의 diff 에 사전 변경은 0줄이다.