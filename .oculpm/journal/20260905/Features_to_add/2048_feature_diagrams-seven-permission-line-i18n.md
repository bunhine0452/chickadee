---
schema_version: 1
type: feature
slug: "diagrams-seven-permission-line-i18n"
status: done
difficulty: high
created_at: "2026-09-05T20:48:37+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/ui/src/diagram/MemoryLine.tsx"
    op: create
  - path: "packages/ui/src/diagram/MemoryLine.css"
    op: create
  - path: "packages/ui/src/diagram/BitOverlay.tsx"
    op: create
  - path: "packages/ui/src/diagram/BitOverlay.css"
    op: create
  - path: "packages/ui/src/diagram/StackFrames.tsx"
    op: create
  - path: "packages/ui/src/diagram/StackFrames.css"
    op: create
  - path: "packages/ui/src/diagram/ConversionLadder.tsx"
    op: create
  - path: "packages/ui/src/diagram/ConversionLadder.css"
    op: create
  - path: "packages/ui/src/diagram/PermissionLine.tsx"
    op: create
  - path: "packages/ui/src/diagram/PermissionLine.css"
    op: create
  - path: "packages/ui/src/diagram/QueueLadder.tsx"
    op: create
  - path: "packages/ui/src/diagram/QueueLadder.css"
    op: create
  - path: "packages/ui/src/diagram/ParallelSteps.tsx"
    op: create
  - path: "packages/ui/src/diagram/ParallelSteps.css"
    op: create
  - path: "packages/ui/src/diagram/i18n.ts"
    op: create
  - path: "packages/ui/src/diagram/i18n.test.ts"
    op: create
  - path: "packages/ui/src/diagram/diagram-spec.test.tsx"
    op: create
  - path: "packages/ui/src/diagram/types.ts"
    op: update
  - path: "packages/ui/src/diagram/labels.ts"
    op: update
  - path: "packages/ui/src/diagram/index.ts"
    op: update
  - path: "packages/ui/src/index.ts"
    op: update
  - path: "packages/ui/src/dev/Gallery.tsx"
    op: update
  - path: "packages/ui/src/dev/Gallery.test.tsx"
    op: update
  - path: "packages/i18n/src/ko/diagram.ts"
    op: create
  - path: "packages/i18n/src/en/diagram.ts"
    op: create
  - path: "packages/i18n/src/ko.ts"
    op: update
  - path: "packages/i18n/src/en.ts"
    op: update
  - path: "design/system/diagrams.md"
    op: update
related:
  - ref: "20260905/Features_to_add/1818_feature_learning-diagrams-bits-tree-valuebox.md"
    kind: "followup"
  - ref: "20260905/Features_to_add/1824_feature_diagram-fold-ladder-and-cross-session-specs.md"
    kind: "followup"
tags:
  - "diagram"
  - "ui"
  - "i18n"
  - "a11y"
  - "d187"
  - "rust"
  - "curriculum"
  - "mcp-tool"
---
[x] 그림 일곱 — 명세만 다섯 + 신청 여섯, 소유권 화살표를 권한 줄로 (D187 ⑲⑳)

## 추가 기능

I2 가 만든 셋(비트 배열·평가 트리·값 상자) 위에 일곱을 얹었다. `diagrams.md` §3 의
「명세만 다섯」과 언어 세션 여섯(c·cpp·rs·go·py·ts)의 신청을 합친 것이다.

- **메모리 줄** `MemoryLine` — 주소가 붙은 칸이 간격 하나로 늘어선다. 거리 줄(`+0`·`+4`)이
  `base + i × stride` 로 나와 **「배열이 왜 0부터인가」가 그림 하나로 끝난다.**
  `names?: string[]` 가 별칭(py·ts 신청), `windows` 가 슬라이스 창(go 신청)이다.
- **겹친 비트 배열** `BitOverlay` — 두 줄이 **한 격자**를 써서 `300u32 as u8` 이 왜 44 인지가
  보인다. `.bit` 규약은 `BitField.css` 를 그대로 들여오고 더한 것은 `.bit.gone` 하나다.
- **스택 프레임** `StackFrames` — 배열의 뒤가 화면의 위다. `unwind`(cpp 신청)가 걷힐 때
  도는 코드와 순서.
- **타입 변환 사다리** `ConversionLadder` — 칸이 타입, **간선이 관계**. 간선 셋을 색이 아니라
  선 모양(실선·파선·점선)과 낱말이 가른다.
- **권한 줄** `PermissionLine` — 「소유권 화살표」를 **교체**했다(D187 ⑲).
- **큐 사다리** `QueueLadder` · **나란한 걸음** `ParallelSteps` — 걸음 사다리의 배치판 둘.

그리고 **`diagram.*` i18n 키 마흔아홉**(D187 ⑳). `labels.ts` 에 박혀 있던 한국어가
`packages/i18n/src/{ko,en}/diagram.ts` 로 옮겨 갔고, `diagram/i18n.ts` 의 `diagramLabels()`
가 다리다. `DIAGRAM_LABELS_KO` 는 폴백으로 남는다 — 그림이 문항 화면 밖(단위 시험·문서
예제)에서도 서야 하고, 그때 카탈로그를 끌고 오면 그림이 화면에 매인다.

## 동작 흐름

일곱 전부 I2 의 규약을 그대로 따른다 — `role="img"` + 한 문장 `aria-label`(값이 아니라 뜻) ·
화면에서만 숨긴 `<table>` 대체 · `phase` 로 「구조는 남고 값이 사라진다」 · 애니메이션 0.

**세 자리에서 가리기 규칙이 뒤집혀 보이는데 같은 규칙이다.**

1. 스택 프레임의 걷힘은 **이름을 가리고 번호를 남긴다** — 「여기서 셋이 돈다」가 물음이고
   「무엇이 몇 번째인가」가 답이다. 이름을 남기고 순서만 섞으면 데이터에 없는 것을 그리게 된다.
2. 큐 사다리는 **어느 줄기인지까지** 가린다. 코드만 가리고 줄기를 남기면 「마이크로태스크가
   먼저」가 격자에 이미 적혀 있다. 가려진 걸음은 전체 폭을 걸친 점선 막대가 된다.
3. 권한 줄의 `expects` 는 `predict` 에서도 남는다 — 「이 줄이 무슨 권한을 요구하나」가 물음이다.

**권한 줄의 표기는 재구현이다.** Brown/Aquascope 의 `+`·`/`·채운 글자는 아이디어이지
지문이 아니므로 우리 규약으로 다시 만들었다: 칸에는 권한 이름의 첫 글자(읽/쓰/소 · r/w/o),
상태는 부호(`+`·`−`·`·`)와 면·파선이 말한다. 다섯이 **색 없이도 갈리고**, 색은 `gained`
(액센트 — 「이번 줄에서 바뀐 것」)와 `missing`(주의색 — 비트 배열의 `lossy` 와 같은 자리)
두 자리에서만 거든다. 배운 적 없는 규약이라 `.pl-key` 한 줄이 다섯을 그대로 풀어 준다.

## 검증

`pnpm --filter @chickadee/{ui,i18n} typecheck` 초록 · `pnpm lint` 0(eslint + stylelint) ·
`vitest packages/ui packages/i18n` **169통과**(그림 신규 33 + i18n 대조 3 + 진열대 1) ·
`pnpm check:contrast` 142쌍 · `pnpm check:motion` 0건 · `tests/support/css-tokens.test.ts` 통과.

Vite 하네스로 **폭 720·900·1280·1440·1920·2560 × 밝게·어둡게 × 예측·공개**를 재서
**가로 넘침 0px · 뷰포트 이탈 0 · 스크롤 못 하는 잘림 0 · 콘솔 오류 0**. 스크래치패드에
`s10-*.png` 열둘 + 그림별 크롭.

`pnpm test:unit` 은 `packages/course/curriculum.test.ts` 2건, `pnpm test:gates` 는
`design.spec.ts` 의 「모션 상한」 2건이 빨간데 **둘 다 내 범위 밖**이다 — 앞은 사전 세션이
고치는 중인 `dictionary/java/**`, 뒤는 홈 화면의 「학습 시작」 버튼을 못 찾는 타임아웃
(코스 화면 세션의 진행 중 변경)이다. 정적 모션 검사(`check:motion`)는 내 CSS 를 포함해 0건이다.

## 메모

**실측 하나가 설계를 바꿨다.** 겹친 비트 배열의 첫 판은 폭 720 에서 653px 이 필요해
`.dgm-view`(604px) 밖으로 밀렸고, 스크롤은 됐지만 **아래 폭이 화면 밖이라 그림의 요점이
안 보였다.** 접을 수는 없다(접는 순간 위아래 자리가 어긋나 그림이 거짓말을 한다). 칸을
`.9em`, 열 간격을 1px, 이름표를 두 줄로 줄여 604px 에 넣었다. 대가는 비트 배열의
「넷마다 벌리기」 리듬을 여기서만 끈 것이고, 자리 세기는 「잘림 24비트 · 남음 8비트」 두
구간이 대신한다. D187 ⑳ 이 허락한 접힘은 비트 배열의 52비트 가수 얘기지 이 그림에는 안 온다.

**신청 여섯 중 새 컴포넌트를 요구한 것은 둘뿐**(권한 줄 · 나란한 걸음)이고 넷은 기존 모델의
칸 하나였다 — 별칭은 `names`, 창은 `windows`, 소멸 순서는 `unwind`. `diagrams.md` §3 의
「새 종류를 늘리는 것보다 배운 규약을 다시 쓰는 쪽이 싸다」가 한 번 더 확인됐다.

**남은 구멍 — 낭독 문장이 아직 한국어 하나다.** 낱말은 `diagram.*` 로 옮겼지만 `aria-label`
문장을 짜는 `describe*` 열하나는 `packages/ui` 안에 있고 한국어 어순이 박혀 있다. `en`
로케일에서 낱말은 영어인데 문장 틀이 한국어로 나온다. 문장 틀을 `t()` 키로 올리면 그림이
카탈로그에 매여 「폴백」 설계가 깨진다 — 어느 쪽이 나은지 안 재 봤고 `diagrams.md` §6·§7 에
적어 뒀다. 그 밖에 안 잰 것: 권한 줄 표기를 사람에게 안 보였다 · 나란한 걸음에서 레인 셋
이상일 때 간선이 겹치는지 · 열 그림 중 실제 문항이 쓰는 것이 아직 하나도 없다.

**등록부는 안 건드렸다** — D186·D187 이 이 작업을 이미 덮고, 번호 배정은 오케스트레이터 몫이다.