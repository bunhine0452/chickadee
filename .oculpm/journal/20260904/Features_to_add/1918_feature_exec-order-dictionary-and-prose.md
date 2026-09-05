---
schema_version: 1
type: feature
slug: "exec-order-dictionary-and-prose"
status: done
difficulty: medium
created_at: "2026-09-04T19:18:53+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/exec/order.yaml"
    op: create
  - path: "packages/cards/src/t0-exec.ts"
    op: update
  - path: "packages/cards/src/t0-exec.test.ts"
    op: update
  - path: "packages/i18n/src/ko/cards.ts"
    op: update
  - path: "packages/i18n/src/en/cards.ts"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
related:
  - ref: "20260904/Features_to_add/1913_feature_exec-order-question-builder.md"
    kind: "followup"
tags:
  - "D151"
  - "사전"
  - "i18n"
  - "mcp-tool"
---
[x] exec/order 사전과 진단 산문 — 산문이 사전이 아니라 카탈로그로 간 이유 (D151)

## 추가 기능

`exec/order` 의 사전과 오답 진단을 냈다. 커밋 `ec1d503` 이후의 첫 작업이다.

## 고친 판단 하나 — 산문은 사전이 아니라 카탈로그로

출제층을 짤 때 헤더에 「산문은 사전이 댄다」고 적었는데 **틀렸다.** `arch/entry.yaml` 을 열어 보니 그쪽은 `point:`·`meaning:` 자체가 없고 문항은 `t2-quiz.ts` 가 만들며 진단은 i18n(`t2.*`)에 있다.

`exec/*` 도 그쪽이 맞는 이유가 더 강하다 — `WrongBecause` 네 이유는 **개념마다 다르지 않고 언어에도 안 매인다.** 「정의는 실행이 아니다」는 어느 언어에서도 참이다. 사전에 두면 개념 수 × 언어 수만큼 같은 문장을 복제하게 된다. 헤더 주석을 고치고 근거를 적었다.

## 낸 것

**i18n 6키 × 2로케일** — 문항·힌트와 오답 넷의 진단. 정본 §3-2 대로 「틀렸다」가 아니라 **참이 되는 조건**을 적었다:

- `definition` — 「그 줄은 정의다. 이름을 만들어 둘 뿐이고 안의 줄은 부를 때 돈다. **파일을 위에서 아래로 읽는 순서와 실행 순서가 다른 것이 여기서 갈린다.**」
- `runs` — 「그 줄도 **돈다** — 다만 첫 번째가 아니다.」
- `conditional` — 「조건 안이라 **돌 수도 있다**. 「반드시 먼저 돈다」와 「참이면 돈다」는 다르다.」
- `nested` — 「**안쪽 함수**라 바깥을 부른다고 도는 것이 아니다.」

**`dictionary/exec/order.yaml`** — `queries: []` · `track_default: t0` · `essential: false`. 개념 산문만 댄다. `one_liner` 는 「파일을 읽는 순서와 코드가 도는 순서는 다르다」다.

**`renderFirstRun`** — 카탈로그를 **부르는 시점**에 푼다. 모듈이 열리는 시점은 로케일이 정해지는 시점보다 이르다(`t0-point.ts` 의 `roleName` 과 같은 이유).

## 시험이 요구한 것

`dict.test.ts` 의 「보편 개념은 쿼리가 없고 언어 개념은 쿼리가 있다」가 `common/`·`arch/` 접두어를 하드코딩하고 있었다. `exec/` 를 더하고 이름을 「쿼리 없는 네임스페이스와 언어 개념이 정확히 갈린다」로 바꿨다 — 이제 셋이고 셋 다 문항을 **계산**한다는 것이 요점이라 그 뜻이 이름에 들어가야 한다.

i18n 카탈로그 시험 둘(「아무도 안 쓰는 키가 없다」·「두 언어의 변수 집합이 같다」)이 새 키 여섯을 그대로 통과했다 — 렌더 함수가 실제로 부르기 때문이다.

## 검증

`pnpm typecheck` 무출력 · `pnpm lint` 무출력 · `pnpm dict:lint` 13/13(부채 표 불변 — `exec/order` 는 `essential` 이 아니라 빚을 안 만든다) · **TS 전체 1,998건 / 179 파일 전량 통과**.

## 남은 것

카드 굽는 경로 배선. `exec/*` 는 `concept_site` 가 없고 **`block` 이 그 자리**라, `block.text_hash` 를 `siteKey` 자리에 놓는 어댑터가 필요하다 — 재생성 계약(D70)이 그 키에 걸려 있어 아무 값이나 넣으면 안 된다. 그 다음이 `state/mutation` 이다.