---
schema_version: 1
type: refactor
slug: "lifer-veil-into-feedback-slot"
status: done
difficulty: medium
created_at: "2026-09-04T13:00:42+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  session: "98c786a8-97f4-4381-98c1-da629e144769"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/components/plate/LiferNote.tsx"
    op: create
  - path: "apps/desktop/src/components/plate/LiferNote.css"
    op: create
  - path: "apps/desktop/src/components/session/LiferVeil.tsx"
    op: delete
  - path: "apps/desktop/src/components/session/SessionOverlay.tsx"
    op: update
  - path: "apps/desktop/src/screens/session/SessionScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/session/T0Plate.tsx"
    op: update
  - path: "docs/05-frontend.md"
    op: update
  - path: ".oculpm/discussion/vibe-code-study-app/discussion.md"
    op: update
  - path: "tests/support/gates.ts"
    op: update
  - path: "tests/visual/shots.spec.ts"
    op: update
related: []
tags:
  - "D131"
  - "session"
  - "lifer"
  - "motion"
  - "mcp-tool"
---
[x] LIFER 전면 베일을 걷고 첫 기록을 판정란 안으로

사용자 보고 「정답을 맞췄을 때 모션이 이상하다」의 정체. 결정 등록부 D131, 정본 §3-6 개정.

## 동기

맞힌 순간 도장이 찍히는 0.38초(`stampdown`)와 **같은 프레임**에 `LiferVeil` 이 전면으로
올라왔다. 판정문을 읽기 전에 모달을 닫아야 했고, 닫고 나면 도장 연출은 이미 끝나 있었다.
정본 §3-9 「한 화면에 한 가지 일」과 §3-3 「답해도 위 글이 밀리지 않는다」가 같은 순간에
둘 다 깨진다. T1 은 더 나빴다 — `t1Finish` 가 베일을 세우고 곧바로 `goNext()` 를 불러
베일이 **다음 판 위에** 떴다.

보상을 없애는 것이 아니라 자리를 옮기는 것이다. 영구 기록(도장 · 일련번호 · 채집지)은
그대로 남고, 판정문과 나란히 읽힌다.

## 변경 요약

- `components/plate/LiferNote.tsx`/`.css` 신설 — 베일 카드의 속(Dee 4겹 · 머리말 · 개념 ·
  채집지 · 일련번호 · 「첫 관찰」 도장)을 판정란 크기로 옮겼다. 대화상자가 아니고 포커스를
  뺏지 않는다. `lifer:open` 계측은 여기서 닫는다.
- `FeedbackSlot` 에 `lifer` 슬롯을 더하고 `T0Plate` 이 넘긴다. `SessionScreen` 은 판을
  옮길 때 기록을 지운다.
- `LiferVeil.tsx`/`.css`/`.test.tsx` 삭제. `SessionOverlay` 에서 `lifer`·`onCloseLifer` 와
  Esc 사다리의 베일 단이 빠져 **Esc 는 3단**이 됐다(입력 → 사다리 → 나가기).
- T1 의 세션 중 연출은 뺐다 — 마치는 즉시 다음 판으로 가므로 기록을 놓을 판정란이 없다.
  첫 기록은 인쇄 완료의 「처음 기록한 문법」 칸이 그대로 나른다. 원장(`lifer` 행 ·
  `liferShown` 집계 · 세션당 3회 상한)은 손대지 않았다.
- 쓰이지 않게 된 키 둘(`session.liferWhereT1`·`lifer.anyKey`)을 ko·en 에서 지웠다 —
  `catalog.test.ts` 의 「안 쓰는 키 없음」이 그 자리에서 잡았다.
- 하네스: `closeLifer` → `settleLifer`(닫을 것이 없으니 연출이 놓일 때까지 기다리기만 한다).
  `MOTION_EXEMPT` · 시각 회귀 1장 · `perfRun` · e2e 넷의 선택자를 함께 고쳤다.
- 판정란에 도장이 둘이 되어 `.fb .stamp` 가 strict mode 위반을 냈다 — 판정 도장을 가리키는
  자리는 전부 `.fb .stampbox .stamp` 로 좁혔다(게이트 4 · e2e 5).

## 검증

`pnpm test:unit` 1,753 통과 · `pnpm lint` · `pnpm -r typecheck` · `pnpm test:gates` 114 통과
(감축 모션 게이트 6종 포함) · `pnpm test:e2e-ui` 24 통과. 브라우저에서 정답 판을 띄워
기록이 판정란 안에 놓이고 포커스가 「다음」 단추에 남는 것을 스크린샷으로 확인했다.