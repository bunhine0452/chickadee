---
schema_version: 1
type: feature
slug: "study-screen-visual-rebuild-d182"
status: done
difficulty: high
created_at: "2026-09-05T15:55:24+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/components/session/SessionOverlay.css"
    op: update
  - path: "apps/desktop/src/components/session/JobBand.tsx"
    op: update
  - path: "apps/desktop/src/components/session/JobBand.css"
    op: update
  - path: "apps/desktop/src/components/plate/ProofSheet.tsx"
    op: update
  - path: "apps/desktop/src/components/plate/ProofSheet.css"
    op: update
  - path: "apps/desktop/src/components/plate/FeedbackSlot.tsx"
    op: update
  - path: "apps/desktop/src/components/plate/FeedbackSlot.css"
    op: update
  - path: "apps/desktop/src/components/plate/CodePlate.css"
    op: update
  - path: "apps/desktop/src/components/plate/PickToken.css"
    op: update
  - path: "apps/desktop/src/components/plate/Choices.css"
    op: update
  - path: "apps/desktop/src/components/plate/Hole.css"
    op: update
  - path: "apps/desktop/src/components/plate/Ask.css"
    op: update
  - path: "apps/desktop/src/components/plate/Acts.css"
    op: update
  - path: "apps/desktop/src/components/plate/LiferNote.tsx"
    op: update
  - path: "apps/desktop/src/components/plate/LiferNote.css"
    op: update
  - path: "apps/desktop/src/components/session/ReprintLadder.css"
    op: update
  - path: "apps/desktop/src/components/session/PrereqRung.tsx"
    op: update
  - path: "apps/desktop/src/components/session/Summary.tsx"
    op: update
  - path: "apps/desktop/src/components/session/Summary.css"
    op: update
  - path: "apps/desktop/src/components/t1/monacoTheme.ts"
    op: update
  - path: "apps/desktop/src/components/t1/ScoreCard.tsx"
    op: update
  - path: "apps/desktop/src/components/t2/Verdict.tsx"
    op: update
  - path: "apps/desktop/src/components/t2/DependencyMap.css"
    op: update
  - path: "apps/desktop/src/screens/course/StagePlate.css"
    op: create
  - path: "apps/desktop/src/screens/course/PlateFrame.tsx"
    op: update
  - path: "apps/desktop/src/screens/session/T0Plate.tsx"
    op: update
  - path: "packages/i18n/src/ko/session.ts"
    op: update
  - path: "packages/i18n/src/en/session.ts"
    op: update
  - path: "tests/e2e-ui/t0-session.spec.ts"
    op: update
  - path: "tests/gates/motion.spec.ts"
    op: update
related: []
tags:
  - "d182"
  - "ui"
  - "session"
  - "plate"
  - "responsive"
  - "contrast"
  - "mcp-tool"
---
[x] 학습 화면을 학습에 최적화된 시각으로 다시 세웠다 (D182 · G4)

## 추가 기능

**① 오버레이가 실제로 전체화면이 됐다.** `.proof` 는 `inset: var(--chrome-top) 0 0` 에 배경이 없어 **뒤의 홈이 좌우로 그대로 비쳤다** — 정본 §3-4 는 전체화면 오버레이를 요구하는데 화면은 가운데 상자였다. `inset: 0` · `background: var(--bg)` 로 바꿨다. 문제를 푸는 동안 앱의 다른 표면이 한 조각도 안 보인다.

**② 틀은 코드 창 하나만 남겼다.** 판(`.ps`)에서 뺀 것 열둘 — 2.5px 겹테두리 · 6px 오프셋 그림자 · 회전(`--tilt`) · 등장 애니메이션 · 왼쪽 레일(겹 숫자·세로 글자·`+1겹` 뱃지) · 판 번호 어긋남 · 트랙 알약 · 겹 막대 · 등록표시. 진행 띠에서 로고 46px · 디스플레이 서체 제목 · 이름표 줄을 빼 세로 96 → 52px. 요약에서 로고 84px · 도장 둘 · 마스코트 셋 · 알약 · 막대 넷 · 기울어진 연속 원을 뺐다.

**③ 판정에서 도장을 버렸다.** 143px 회전 도장이 판정란에서 가장 큰 요소였는데, 학습자가 배우는 것은 도장이 아니라 **왜 그런가**다. 새 순서가 값의 순서다 — 낱말 하나(`정답`/`오답`) + 왼쪽 3px 선 → **`.fb-why`**(정본 §3-2 의 「당신이 고른 그것이 참이 되는 조건」, `--fs-4`·`--text`·`--measure`) → 최소 코드 → 규칙(muted) → 숙련도. 진단이 흐린 15px 회색에서 진한 16px 본문으로 올라왔다.

**④ 코드 창을 다시 쟀다.** 18px → 16px(`--fs-4`), 행간 1.85 유지(`--lh-code`, 정본 §6 하한). 줄 높이 33.3 → 29.6px 이라 창 상한 20줄(D141)이 666 → 592px 로 줄어 높이 700 창에 물음·보기·판정란과 함께 선다. **줄번호를 `position: sticky` 로 붙였다** — 가로로 밀어도 「몇 행」의 답이 화면에서 안 사라진다.

**⑤ 좁은 폭 — 가로 스크롤을 코드 창 안에 가뒀다.** 코드는 줄바꿈하면 뜻이 상한다(들여쓰기가 구조다). `.code`·`.cc-window` 만 `overflow-x: auto` + `overscroll-behavior-x: contain` 이고 판도 작업대도 가로로 안 흐른다. 보기는 미디어 쿼리가 아니라 `repeat(auto-fit, minmax(min(100%, 22rem), 1fr))` 이 720 에서 한 단, 1280 이상에서 두 단으로 접는다. 넓은 화면에서는 판이 880px 에 멈추고 여백이 는다 — 산문은 그 안에서 다시 `--measure` 로 묶인다.

**⑥ 코스 다섯 단도 같은 재료로.** `screens/course/StagePlate.css` 를 새로 만들고 규칙을 `.course-run` 안에 묶었다(두 칸 특이도라 `CourseScreen.css` 의 옛 `cc-*` 와 번들 순서 다툼이 없다). 2·3·4단 코드 창, 보기 격자, 5단 편집기가 T0 판과 같은 눈금·같은 종이다.

## 동작 흐름

**색을 코드 위에서 걷어 낸 근거는 실측이다.** 구문 강조 여섯은 `--code-bg` 위에서만 7:1 을 넘는다(가장 빠듯한 어두운 `--syn-com` 7.17:1). 그 글자 밑에 `--surface-3` 을 깔면 5.81, `--accent-weak` 이면 5.67 로 떨어져 정본 §6 의 본문 7:1 이 깨진다. 그래서 초점 줄·짚은 토큰·정오 표시에서 **면을 전부 걷고** 선(왼쪽 3px 괘선·밑줄)과 줄번호 칸만 남겼다.

**고른 토큰에 `--accent` 를 안 쓴다.** `--syn-fn`(#17418F)과 `--accent`(#0E47A6)의 대비가 1.13:1(어두운 갈래 1.02:1)이라 함수 이름 밑의 액센트 밑줄이 글자와 한 덩어리로 읽힌다. 고른 것은 `--text` 3px 실선 + 굵은 글자로 바꿨다 — 여섯 구문 색 어느 것과도 갈리고 색맹 여부와 무관하다.

Monaco 테마를 `--syn-*` 여섯 + `--code-bg` 로 옮겨 지지대와 편집기가 같은 색으로 같은 코드를 그린다. `DependencyMap` 의 500ms `blip` 은 없앴다(모션 상한 200ms). `--text-faint` 를 쓰던 학습 화면 낱말은 전부 `--text-muted` 로 올려 7:1 을 만족시켰다.

## 검증

`pnpm test:unit` 2,252 통과 · `typecheck`/`lint`(내 범위) 0 · `check:contrast` 142쌍 전부 통과 · `check:motion` 위반 0 · 모션 게이트 12/12(감축 잔존 0 · 판정란 0px 게이트 포함) · `clone-course` 대비 게이트 통과 · e2e-ui 의 t0-session·course 전부 통과. 폭 720/900/1280/1600/2560 × 높이 600~1400 을 chromium·webkit 두 엔진에서 쓸어 가로 스크롤·넘침 **0**(문제·판정·사다리·코스 단 판 네 상태). 전/후 스크린샷은 scratchpad 의 `before-*`/`after-*` 21장.

## 메모

남은 실패는 전부 범위 밖이다 — `design.spec.ts` 의 홈·서가·어둡게(G3·G1 진행 중)와 `keyboard`/`shell` 의 홈 조작기. T0 판에 남은 대비 지적 하나는 `packages/ui` 의 **비활성** `PressButton`(5:1)이고 옛 게이트가 G1 의 「보조 라벨 4.5:1」 계층을 아직 모른다.