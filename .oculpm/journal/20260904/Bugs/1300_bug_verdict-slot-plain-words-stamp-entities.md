---
schema_version: 1
type: bug
slug: "verdict-slot-plain-words-stamp-entities"
status: done
difficulty: low
created_at: "2026-09-04T13:00:13+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  session: "98c786a8-97f4-4381-98c1-da629e144769"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/i18n/src/ko/session.ts"
    op: update
  - path: "packages/i18n/src/en/session.ts"
    op: update
  - path: "apps/desktop/src/components/plate/FeedbackSlot.tsx"
    op: update
  - path: "apps/desktop/src/components/plate/FeedbackSlot.css"
    op: update
  - path: "docs/00-overview.md"
    op: update
  - path: "tests/e2e-ui/t0-session.spec.ts"
    op: update
related: []
tags:
  - "D130"
  - "session"
  - "i18n"
  - "feedback-slot"
  - "mcp-tool"
---
[x] 판정란 셋 — 은유뿐인 판정문 · 제목을 덮는 도장 · 글자로 새는 엔티티

사용자가 앱을 띄우고 낸 보고 두 건(「정답을 맞췄을 때 UI 가 이상하다」·「틀렸습니다인데 어긋났습니다라고 뜬다」)의 앞쪽 절반이다. 결정 등록부 D130.

## 발생 원인

**① 판정문에 평문이 없다.** `session.wrong` 이 「어긋났습니다」였다. 정본 §6 은 「모든 은유 옆에
평문을 병기한다」고 정하는데, 이 자리는 병기가 아니라 **대체**였다 — 바로 왼쪽 도장이 이미
「어긋남」을 나르므로 제목까지 은유면 그 판정의 평문이 화면에서 사라진다.

**② 도장이 제목 첫 글자를 덮는다.** `.fb .stampbox` 가 118px 인데 도장 실측 폭은 143px 이다
(회전 포함). 제목 `h4` 의 왼쪽 끝 x=434 를 도장 오른쪽 끝 x=443 이 파고들어, 회전한 모서리가
「맞았습니다」의 첫 글자에 걸쳤다. 목업(`design/ink-session.html`)을 같은 방법으로 재도 값이
같아(도장 148px · 상자 118px) 이식 버그가 아니라 물려받은 것이다.

**③ 치환값이 이스케이프된 채 글자로 뜬다.** 화면에 `19행의 값 = &quot;0&quot;` 이 그대로
찍혔다. `@chickadee/text` 의 `render()` 는 치환값을 HTML 로 이스케이프하는데(기본값), 그렇게
나온 문자열을 `FeedbackSlot` 이 `result.label/value/note` 와 `edge.h` 에서 **텍스트 노드로**
넣었다. 같은 페이로드의 다른 문구는 전부 `RichText` 를 거치므로 이 네 자리만 새고 있었다.

## 해결 방법

- `packages/i18n/src/{ko,en}/session.ts` — `session.wrong` 「틀렸습니다」/"That is wrong",
  `session.liveWrong` 「어긋남 — 틀렸습니다」. 도장 글자(`session.exact`·`session.differ`)와
  필사 채점의 줄 상태 라벨은 **그대로 뒀다** — 은유는 도장이라는 물건에만 남긴다.
- `FeedbackSlot.css` — `.fb .stampbox` 118 → 152px. 목업 파일은 고치지 않는다(D127 과 같은 자리).
- `FeedbackSlot.tsx` — `result.label/value/note` 와 `edge.h` 를 `RichText` 로 그린다.
- `tests/e2e-ui/t0-session.spec.ts` 의 단언 문구를 따라 고쳤다.

`edge.code[]` 와 `mono` 보기는 여전히 텍스트 노드로 그려지므로 같은 종류의 누출이 잠재한다 —
그 자리는 D132 의 품질 게이트가 매번 재도록 했다(현재 시드에서는 0건).

## 검증

`pnpm test:unit` 1,753 통과 · `pnpm lint` · `pnpm -r typecheck` 통과. Playwright 하네스로
정답 판을 실제로 띄워 스크린샷으로 확인했다 — 도장이 제목과 겹치지 않고 `"0"` 이 따옴표로
그려진다. `pnpm test:gates` 114 통과 · `pnpm test:e2e-ui` 24 통과.