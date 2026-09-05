---
schema_version: 1
type: feature
slug: "visual-restraint-decor-mascot-tokens"
status: done
difficulty: medium
created_at: "2026-09-05T13:26:10+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/00-overview.md"
    op: update
  - path: "apps/desktop/src/data/settings.ts"
    op: update
  - path: "apps/desktop/src/styles/physics.css"
    op: update
  - path: "packages/ui/src/dee/Dee.tsx"
    op: update
  - path: "packages/ui/src/dee/dee.css"
    op: update
  - path: "packages/ui/src/dee/useDeeMotion.ts"
    op: delete
  - path: "packages/ui/src/dee/useDeeMotion.test.tsx"
    op: delete
  - path: "packages/ui/src/index.ts"
    op: update
  - path: "packages/ui/src/dev/Gallery.tsx"
    op: update
  - path: "packages/ui/src/Passes.tsx"
    op: update
  - path: "packages/ui/src/Passes.css"
    op: update
  - path: "packages/ui/src/Pill.css"
    op: update
  - path: "apps/desktop/src/components/home/InkRail.tsx"
    op: update
  - path: "apps/desktop/src/components/home/InkRail.css"
    op: update
  - path: "apps/desktop/src/components/home/InkRail.test.tsx"
    op: update
  - path: "apps/desktop/src/components/home/InkScale.tsx"
    op: update
  - path: "apps/desktop/src/components/home/InkScale.css"
    op: update
  - path: "apps/desktop/src/components/home/ConceptList.tsx"
    op: update
  - path: "apps/desktop/src/components/home/ConceptList.css"
    op: update
  - path: "apps/desktop/src/components/home/NodeDetail.tsx"
    op: update
  - path: "apps/desktop/src/components/home/NodeDetail.css"
    op: update
  - path: "apps/desktop/src/components/home/GapsPanel.css"
    op: update
  - path: "apps/desktop/src/components/home/Masthead.test.tsx"
    op: update
  - path: "apps/desktop/src/components/plate/ProofSheet.tsx"
    op: update
  - path: "apps/desktop/src/components/plate/ProofSheet.css"
    op: update
  - path: "apps/desktop/src/components/plate/CodePlate.css"
    op: update
  - path: "apps/desktop/src/components/plate/PickToken.css"
    op: update
  - path: "apps/desktop/src/components/plate/Choices.css"
    op: update
  - path: "apps/desktop/src/components/plate/FeedbackSlot.tsx"
    op: update
  - path: "apps/desktop/src/components/plate/FeedbackSlot.css"
    op: update
  - path: "apps/desktop/src/components/plate/FeedbackSlot.test.tsx"
    op: update
  - path: "apps/desktop/src/components/plate/LiferNote.tsx"
    op: update
  - path: "apps/desktop/src/components/session/PrereqRung.tsx"
    op: update
  - path: "apps/desktop/src/components/session/PrereqRung.css"
    op: update
  - path: "apps/desktop/src/components/session/ReprintLadder.tsx"
    op: update
  - path: "apps/desktop/src/components/session/ReprintLadder.css"
    op: update
  - path: "apps/desktop/src/components/session/Summary.tsx"
    op: update
  - path: "apps/desktop/src/components/session/Summary.css"
    op: update
related: []
tags:
  - "d179"
  - "design"
  - "css"
  - "tokens"
  - "mascot"
  - "mcp-tool"
---
[x] 시각을 도구답게 — 장식 기본 끄기 · 코드 우선 위계 · 마스코트 정적화 (D179)

## 추가 기능

정본 §6·§7 개정(2026-09-05 사용자 결정 「디자인도 난잡하고 조잡한 장난스러운 디자인에 개념을 익힐 수 없다」)을 코드로 옮겼다. 등록부에 **D179** 를 먼저 올렸다.

**① 장식 기본값 끄기.** `defaultTrim()` 이 플랫폼을 안 가리고 언제나 `'on'`(숨김)을 준다. 전에는 Linux 만 껐고(D12) 이유가 WebKitGTK 합성 비용이었는데, 이제 이유는 성능이 아니라 위계다. 스위치는 그대로 남아 켤 수 있다. 등록표시 · 판 번호 어긋남 · 종이 결 · 노드 지터 · 도장 회전 · 시트 기울기가 한 줄로 다 꺼진다 — `[data-trim="on"]` 규칙이 이미 그 여섯을 덮고 있었다.

**② 코드가 화면의 주인.** 코드 판 16 → 18px, 판 번호 `.sig` 포스터 30px → 모노 20px(먹 2차), 레일 46 → 34px, `.ps-in` 왼 여백 22 → 16px. 코드 위의 색면 셋을 걷었다 — `.code .tok.ans`(황 바탕) · `.code .tk.right`(황 바탕) · `.gap .tok`(진홍·황 바탕)이 전부 종이 바탕 + 상태색 밑줄이 됐다. `.ln.hi` 의 초점 선은 `--t2` → `--state-progress`.

**③ 마스코트 정적화.** 진도 자리 아홉에서 Dee 를 빼고 숫자·막대로 갈았다 — 레일 둘(`InkRail`·`ProofSheet`)은 겹 숫자 상자, 목록 셋(`ConceptList`·`PrereqRung`·`InkScale`)과 이동 둘(`FeedbackSlot`·`Summary` 겹 이동)은 `Passes` 막대, `NodeDetail` 은 옆의 `Passes` 가 이미 같은 말을 해서 지웠다. 남은 자리는 셋 — 홈 길잡이 · 요약(완료) 머리와 첫 기록 상자 · 판정란의 `LiferNote`. 동작 다섯(`hop`·`tilt`·`hang`·`peek`·`lifer`)과 `useDeeMotion` 훅·시험·keyframes·감축 모드 블록을 통째로 지웠다.

**④ 색 역할 줄이기.** 토큰 출처(`design/src/ink/tokens.css`)에 상태 별칭 여덟(`--state-right/-text` · `--state-wrong/-text` · `--state-progress/-text` · `--state-locked/-text`)을 더하고 `pnpm design:sync` 로 앱 `tokens.css`·`tokens.ts` 를 다시 냈다. 값은 새로 만들지 않고 이미 있는 것(`--verdict-*`·`--blue`·`--ink-faint`)을 가리킨다 — 야간반은 `var()` 가 쓰는 자리에서 풀려 그대로 따라간다. 쓰는 쪽에서는 겹 막대 `Passes` 의 트랙 3색을 진행 한 색으로, 트랙 배지 `Pill` 의 색면을 종이+먹에 왼쪽 3px 선으로, `GapsPanel` 의 등장 횟수 막대를 먹 하프톤으로 내렸다.

## 동작 흐름

1. 앱이 뜨면 `settings` 에 `trim` 행이 없다 → `DEFAULTS.trim = 'on'` → `applyTrim` 이 `<html data-trim="on">` → 장식 CSS 여섯 갈래가 전부 꺼진 채 첫 화면이 선다.
2. 마스트헤드 스위치를 「장식 보임」으로 옮기면 그때부터 `settings` 행이 생기고 예전 모양이 돌아온다. 텍스트·레이아웃은 1px 도 안 바뀐다(05 §4.3 그대로).
3. 문제 화면에서 겹은 레일의 숫자 상자와 머리의 `Passes` 막대가 말한다. 마스코트는 서지 않는다.

## 검증

- `pnpm lint` · `pnpm --filter @chickadee/desktop typecheck` · `pnpm --filter @chickadee/ui typecheck` 통과.
- `pnpm design:check` 3개 생성물 바이트 일치 · `pnpm check:contrast` 48쌍 통과(최저 `--on-t1 on --t1` 4.73:1) · `pnpm check:motion` 위반 0건.
- `pnpm vitest run apps/desktop packages/ui` 118파일 951건 전부 통과. `pnpm test:unit` 2,273건 중 실패 1(`packages/i18n/catalog.test.ts` 의 안 쓰는 키 `chapter.targetRun` — 코스 세션 몫).
- `playwright test tests/gates --project=chromium` 57 통과 4 스킵(활자 하한·대비·행 길이·axe·모션·키보드 완결 전부 초록).
- `playwright test tests/e2e-ui --project=chromium` 8 통과 5 실패 — 다섯 다 병렬 세션 C4 의 문구 개정에 걸린 문자열 단언이고(`3판 · 약 8분` vs `3문제 · 약 8분` 등) 내 변경과 무관하다. 하나(`02 2판 오답`)는 단독 실행에서 통과하는 병렬 타임아웃.
- 눈으로: 릴리스 빌드를 `vite preview` 에 올리고 홈·문제 화면·사다리를 전/후로 찍어 비교했다. 전(前) 이미지는 내가 만진 파일만 잠시 HEAD 판으로 바꿔 빌드해 찍고 되돌렸다(되돌린 뒤 전부 바이트 일치 확인). 스크린샷은 세션 scratchpad 의 `shots-before/` · `shots-after/`.

## 메모

남긴 판단 둘 — 구문 강조 세 색(`--t0-text`·`--t1-text`·`--t2-text`)은 「판독 보조지 장식이 아니다」라 그대로 뒀고, `LiferNote` 의 Dee 는 문제 화면 안이지만 진도계가 아니라 영구 기록(D131)이라 정지 상태로 남겼다. 둘 다 사용자 확인이 필요하면 되돌릴 수 있다.

`docs/05-frontend.md` §4.3(부속 기본값 플랫폼별) · §6(마스코트 동작 클래스) · §10(상시 애니메이션 표)은 지금 코드와 어긋난다 — 그 파일은 C4 세션이 잡고 있어 손대지 않았다.