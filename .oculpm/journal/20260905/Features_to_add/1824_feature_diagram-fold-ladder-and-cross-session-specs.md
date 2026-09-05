---
schema_version: 1
type: feature
slug: "diagram-fold-ladder-and-cross-session-specs"
status: done
difficulty: medium
created_at: "2026-09-05T18:24:49+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/ui/src/diagram/types.ts"
    op: update
  - path: "packages/ui/src/diagram/bits.ts"
    op: update
  - path: "packages/ui/src/diagram/tree.ts"
    op: update
  - path: "packages/ui/src/diagram/EvalTree.tsx"
    op: update
  - path: "packages/ui/src/diagram/EvalTree.css"
    op: update
  - path: "packages/ui/src/diagram/index.ts"
    op: update
  - path: "packages/ui/src/diagram/bits.test.ts"
    op: update
  - path: "packages/ui/src/diagram/diagram.test.tsx"
    op: update
  - path: "packages/ui/src/index.ts"
    op: update
  - path: "packages/ui/src/dev/Gallery.tsx"
    op: update
  - path: "design/system/diagrams.md"
    op: update
related:
  - ref: "20260905/Features_to_add/1818_feature_learning-diagrams-bits-tree-valuebox.md"
    kind: "followup"
tags:
  - "diagram"
  - "ui"
  - "fundamentals"
  - "sql"
  - "rust"
  - "mcp-tool"
---
[x] 그림을 문항 계약에 맞춘다 — 걸음 사다리 · 문자열 값 · 명세 여섯

## 추가 기능

병렬 세션 셋(I1 형식 · I4 C/C++/러스트 · I6 SQL)의 결정이 앞 일지의 전제를 바꿨다.
그림 자체는 옳았고 **입구와 명세**를 고쳤다.

- **걸음 사다리** — `EvalTree` 의 입구가 둘이 됐다. `model=`(트리)이거나 `fold=`(평평한 걸음
  배열)이고, 후자가 문항 형식 `step` 의 payload `fold: FoldStep[]` 그대로다. 변환이 없다.
  트리는 「왜 그 순서인가」까지 말하고 사다리는 「무엇이 되었나」만 말한다 — 낮은 해상도로
  같은 것을 그린다.
- **값은 문자열로 받는다.** `bitsOf('3.0', 'f64')` 가 서고 적힌 글자가 `literal` 로 남는다.
  `FundValue` 가 값을 문자열로 드는 이유(`3` 과 `3.0` 이 `number` 로는 같다)가 그대로 그림에
  적용된다. `i64` 는 문자열이라야 자릿수를 안 잃는다.
- **비트 배열은 입력 위젯이 아니다.** I1 이 `bits` 를 형식에서 내렸다 — 「비트 그림이 값을
  갖는 자리는 틀린 다음」. 그림의 자리는 `value` 의 판정란 · `table` 문항의 지문 · 챕터 해설
  셋이고 `predict`/`reveal` 이 곧 「답 내기 전/뒤」다. 문서에 못 박았다.

## 동작 흐름

사다리의 예측 규칙이 다른 셋과 다르다 — **첫 줄(주어진 식)은 `predict` 에서도 남는다.**
그 줄이 물음이기 때문이다. 지난 걸음은 보이고, 지금 걸음부터 뒤가 자리만 남는다.

명세만 받아 둔 것(구현 없음): 겹친 비트 배열 · 메모리 줄 · 스택 프레임 · 타입 변환 사다리 ·
소유권 화살표 · SQL 넷(행 격자 · 진리표 3×3 · 절 파이프 · 곱 격자). 순서는 I4 가 실제 개념
수로 정했다 — 메모리 줄이 먼저다(C 2부 아홉 중 여섯이 쓴다).

안 만들기로 하고 이유를 적은 것 둘. **두 언어 비교**와 **「답이 없다」(UB)** 는 배치이지
그림이 아니다 — 사다리 둘을 2단 격자에 넣고 판정란이 한 문장을 말하면 끝이다. 그림에
「답 없음」 배지를 달면 그것이 오히려 하나의 답처럼 보인다.

## 검증

`pnpm vitest run packages/ui` 121통과(그림 35) · `pnpm typecheck` `packages/ui` 통과 ·
`pnpm lint` 0 · `pnpm check:contrast` 142쌍 · `pnpm check:motion` 0건 ·
`pnpm test:unit` 2305통과. 사다리를 얹어 폭 720/1440/2560 × 밝게/어둡게 여섯 장을 다시 찍고
가로 넘침 0px · 이탈 요소 0 · 콘솔 오류 0 을 확인했다.

## 메모

I4 가 답해 준 것 — 타입 변환 사다리를 비트 배열 둘로 못 대신한다. 화살표가 셋이고
(`as` 뛰어내림 · `From` 올라감 · `TryFrom` 갈라짐) 그것은 값이 아니라 **관계**라 값 하나를
그리는 비트 배열로는 안 나온다. 모델에 `edges` 를 따로 뒀다.