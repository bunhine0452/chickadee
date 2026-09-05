---
schema_version: 1
type: feature
slug: "learning-diagrams-bits-tree-valuebox"
status: done
difficulty: high
created_at: "2026-09-05T18:18:28+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "design/system/diagrams.md"
    op: create
  - path: "packages/ui/src/diagram/types.ts"
    op: create
  - path: "packages/ui/src/diagram/bits.ts"
    op: create
  - path: "packages/ui/src/diagram/tree.ts"
    op: create
  - path: "packages/ui/src/diagram/labels.ts"
    op: create
  - path: "packages/ui/src/diagram/Diagram.tsx"
    op: create
  - path: "packages/ui/src/diagram/Diagram.css"
    op: create
  - path: "packages/ui/src/diagram/BitField.tsx"
    op: create
  - path: "packages/ui/src/diagram/BitField.css"
    op: create
  - path: "packages/ui/src/diagram/EvalTree.tsx"
    op: create
  - path: "packages/ui/src/diagram/EvalTree.css"
    op: create
  - path: "packages/ui/src/diagram/ValueBox.tsx"
    op: create
  - path: "packages/ui/src/diagram/ValueBox.css"
    op: create
  - path: "packages/ui/src/diagram/index.ts"
    op: create
  - path: "packages/ui/src/diagram/bits.test.ts"
    op: create
  - path: "packages/ui/src/diagram/diagram.test.tsx"
    op: create
  - path: "packages/ui/src/index.ts"
    op: update
  - path: "packages/ui/src/dev/Gallery.tsx"
    op: update
related: []
tags:
  - "diagram"
  - "ui"
  - "d182"
  - "fundamentals"
  - "a11y"
  - "mcp-tool"
---
[x] 학습 내용을 나르는 그림 셋 — 비트 배열 · 평가 트리 · 값 상자

## 추가 기능

정본 §6 은 장식을 0 으로 만들었지만 같은 절이 「코드와 다이어그램이 가장 큰 요소」라고 적었다.
그 선을 `design/system/diagrams.md` §1 에 표로 박고, 그 아래에서 그림 셋을 만들었다.

- **비트 배열** `BitField` — `bitsOf(0.1, 'f64')` 가 IEEE 754 를 그대로 읽는다.
  `stored` 는 반올림 없는 정확한 십진 전개라 `0.1` 이 55자리로 펼쳐지고, `0.5` 는 `lossy: false`
  로 떨어진다. 「실수는 다 부정확」이라는 오개념을 그림이 스스로 반증한다.
  정수는 폭을 넘으면 `wrapped` 로 감긴다.
- **평가 트리** `EvalTree` — 우선순위는 트리 모양이 담고, 접히는 순서는 후위 순회라
  같은 트리가 언제나 같은 단계 수를 낸다. `2 + 3 * 4` 는 곱셈부터 접힌다.
- **값 상자** `ValueBox` — 단계마다 전체 스냅숏이고, 대입은 상자로 내려오는 화살표 하나다.

셋 다 `phase: 'predict' | 'reveal'` 을 받는다. **구조는 남고 값이 사라진다** — 학습자는 무엇을
물었는지 알아야 하고 답은 몰라야 한다. 값 상자만 「이번 줄에서 바뀐 칸」만 가리는데, 나머지
칸이 예측의 재료이기 때문이다.

## 동작 흐름

1. 문항이 값(`bitsOf(v, type)`)이나 모델(`EvalTreeModel`·`ValueBoxModel`)을 준다 —
   손으로 그린 SVG 를 두지 않는다.
2. 공통 프레임 `Diagram` 이 셋을 보장한다: `role="img"` + 한 문장 `aria-label`(뜻을 먼저 말한다) ·
   화면에서만 숨긴 `<table>` 표 대체 · 단계 버튼이 `role="img"` **밖**에 있는 것.
3. `predict` 에서는 그림·`aria-label`·표 대체가 **함께** 가려진다. 낭독기로 답이 새면 가린 것이 아니다.
4. 문구는 데이터가 나른다. 그림이 스스로 내는 낱말은 `labels.ts` 의 열몇 개뿐이고 `labels`
   프롭으로 `t()` 가 덮어쓴다 — `packages/i18n` 은 이 세션 범위 밖이라 손대지 않았다.

색은 「지금 이것」한 자리(`--accent`)와 상태 넷뿐이다. 부호·지수·가수를 세 색으로 칠하는 흔한
관행은 §6 이 금지하므로 **줄과 이름**으로 갈랐다. 애니메이션은 하나도 없다.

## 검증

`pnpm vitest run packages/ui` 115통과(그림 29 신규) · `pnpm typecheck` 에서 `packages/ui` 통과 ·
`pnpm lint` 0 · `pnpm check:contrast` 142쌍 · `pnpm check:motion` 0건 ·
`pnpm test:gates` 144통과 8건너뜀 · `pnpm test:unit` 2299통과.
Vite 하네스로 폭 720/1440/2560 × 밝게/어둡게 여섯 장을 찍어 **가로 넘침 0px · 이탈 요소 0 · 콘솔 오류 0**
을 확인했고, 첫 촬영에서 평가 트리의 연결선이 엉뚱한 자리에 찍히던 것(`.tn-box` 가
위치 기준이 아니었다)을 잡았다.

## 메모

문항 세션(I1)이 같은 시각에 `bits` 를 **형식에서 내렸다** — 「그림은 물음이 아니라 답이다」.
어긋나지 않는다. 그림의 자리는 `value` 의 판정란 · 비트를 묻는 `table` 문항 · 챕터 해설 셋이고
`predict`/`reveal` 이 곧 「답 내기 전/뒤」다. 다만 `step` 형식의 payload 는 평평한 `FoldStep[]`
이고 그림은 트리를 받는다 — 다리는 `foldedText(annotate(root), i)` 한 줄이지만 **누가 트리를
만드나**는 아직 결정이 없다(`diagrams.md` §7).