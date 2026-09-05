---
schema_version: 1
type: bug
slug: "gauges-too-faint-to-read"
status: done
difficulty: low
created_at: "2026-09-04T12:39:10+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/components/shell/TimeQueue.css"
    op: update
  - path: "apps/desktop/src/screens/clone/CourseToc.css"
    op: update
  - path: "apps/desktop/src/screens/clone/CourseToc.tsx"
    op: update
  - path: "apps/desktop/src/components/home/GapsPanel.css"
    op: update
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/05-frontend.md"
    op: update
related: []
tags:
  - "ui"
  - "css"
  - "a11y"
  - "d127"
  - "mcp-tool"
---
[x] 게이지 셋이 안 읽혔다 (D127) — 진행바의 `opacity: .3` 이 종이 위에서 대비 1.4:1

사용자 요청 2 — 「게이지가 잘 안보임」. 어느 것이냐고 물었더니 셋 다였다.

## 발생 원인

셋 다 목업 수치 그대로였다. 목업은 1280px 브라우저 그림이고 앱의 최소 창은 1000×680 이라 같은 10px 이 더 좁게 읽힌다. 결정적인 것은 `.queue i[data-state="later"] { opacity: .3 }` 였다 — `--paper-3` 트랙 위에서 대비가 1.4:1 이라 「아직 안 지난 칸」이 배경과 갈리지 않는다. 그 막대가 나르는 정보가 「얼마나 남았나」 하나뿐인데 그것이 바로 안 보이는 쪽이었다.

## 해결 방법

- `.queue` — 14 → 18px. 아직 안 지난 칸은 색을 흐리는 대신 **종이 빗금**(`repeating-linear-gradient`, `--paper-2`)을 얹는다. 트랙 색은 그대로 남으므로 「어느 트랙이 남았나」도 유지된다. 인쇄 은유와도 맞는다 — 아직 안 찍힌 판.
- `.ctoc-bar`(코스 진도) — 10 → 14px, 찬 자리의 끝을 `border-right: 2px var(--rule)` 로 끊는다. 0%·100% 에서는 끊을 자리가 없어 `data-fill` 로 뺀다(0 에서 선만 남으면 「조금 찼다」로 읽힌다). `style` 속성 문자열을 CSS 선택자로 짚는 방법을 먼저 썼다가 버렸다 — 브라우저마다 인라인 커스텀 속성 직렬화가 달라 기댈 수 없다.
- `.bar`(판이 없는 문법) — 11 → 14px, 104 → 120px, 같은 방식으로 끝을 끊는다. 황 채움은 종이 위에서 밝아 경계 없이는 길이를 눈으로 못 잰다.

색은 하나도 늘리지 않았다 — 트랙 색 셋 그대로다.

## 검증

`pnpm exec stylelint` 초록. `TimeQueue`·`GapsPanel`·코스 화면 단위 테스트 43개 통과(막대는 `role=img` + 문장으로 정보를 나르므로 테스트가 짚는 것은 그 문장이고, 이 변경은 그것을 건드리지 않는다).