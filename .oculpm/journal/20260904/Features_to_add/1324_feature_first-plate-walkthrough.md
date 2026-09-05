---
schema_version: 1
type: feature
slug: "first-plate-walkthrough"
status: done
difficulty: medium
created_at: "2026-09-04T13:24:50+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  session: "98c786a8-97f4-4381-98c1-da629e144769"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/components/plate/CoachBand.tsx"
    op: create
  - path: "apps/desktop/src/components/plate/CoachBand.css"
    op: create
  - path: "apps/desktop/src/components/plate/CoachBand.test.tsx"
    op: create
  - path: "apps/desktop/src/screens/session/T0Plate.tsx"
    op: update
  - path: "apps/desktop/src/screens/session/SessionScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/settings/SettingsScreen.tsx"
    op: update
  - path: "packages/store-sql/src/schemas.ts"
    op: update
  - path: "packages/store-sql/src/types.ts"
    op: update
  - path: "apps/desktop/src/data/settings.ts"
    op: update
  - path: "docs/02-data-model-and-scheduling.md"
    op: update
related: []
tags:
  - "D134"
  - "session"
  - "onboarding"
  - "settings"
  - "mcp-tool"
---
[x] 첫 판을 함께 걷는 안내 띠 — 별도 튜토리얼 화면을 만들지 않았다

사용자 보고 「이 앱의 튜토리얼을 정교하게 만들어야 할 것 같다」. 결정 등록부 D134.

## 추가 기능

- `components/plate/CoachBand.tsx`/`.css` — 이 리포의 첫 세션 **첫 판** 위에 얹히는 안내 띠.
  세 걸음이다: ① 보기 넷 중 하나 고르기(숫자 키 `1~4`) ② `Enter` 로 확인 — 틀려도 잃는
  것이 없다는 것과 「모르겠어요」로 내려가는 길 ③ 판정란이 무엇을 적는지와 `Space`.
- `Settings.tutorialSeen: boolean` 신설(`tutorial_seen`). 첫 판을 답하는 순간 참이 되고,
  설정 「학습」의 스위치로 다시 켤 수 있다.

## 동작 흐름

걸음은 **사용자의 동작으로만** 넘어간다 — 넘기기 버튼도 타이머도 없다. `T0Plate` 이
`sel`·`answered` 로 걸음을 파생시키므로 새 상태가 하나도 없다.

별도 화면과 번들 샘플 코드를 고르지 않은 이유가 둘이다. ① 이 앱의 전제가 「내 코드로
배운다」인데 튜토리얼만 남의 코드면 첫인상이 그 전제와 어긋난다. ② 화면을 하나 더 만들면
05 §2.3 의 이탈 규칙과 §7 의 포커스 규약을 그 화면에도 다시 세워야 한다. 진짜 판을 쓰는 것이
손해가 아닌 근거는 정본 §3-1 이다 — 오답은 벌이 아니라 다시 찍기 판 한 장을 부를 뿐이다.

지금까지 첫 실행은 표시 언어 + 폴더 고르기뿐이었고, 홈의 `Newcomer` 는 뿌리 개념이 막힌
**뒤에야** 떴다 — 앱의 어휘(대지 · 겹 · 판 · 정합 · 다시 찍기)를 처음 만나는 자리가 없었다.

## 검증

`pnpm test:unit` 1,760 통과 — `CoachBand.test.tsx` 2건 신설, `SessionScreen.test.tsx` 에
「첫 판이면 띠가 3걸음까지 가고 `tutorial_seen` 이 참으로 저장되며 다음 판에는 안 뜬다」를
더했다. `pnpm lint` · `pnpm -r typecheck` · `pnpm test:gates` 114 · `pnpm test:e2e-ui` 24 통과.
브라우저로 첫 판을 띄워 띠가 1걸음으로 서는 것을 스크린샷으로 확인했다.