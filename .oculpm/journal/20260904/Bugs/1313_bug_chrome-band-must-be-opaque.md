---
schema_version: 1
type: bug
slug: "chrome-band-must-be-opaque"
status: done
difficulty: low
created_at: "2026-09-04T13:13:42+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/styles/app.css"
    op: update
  - path: "apps/desktop/src/App.tsx"
    op: update
related:
  - ref: "20260904/Features_to_add/1238_feature_mac-titlebar-overlay-chrome.md"
    kind: "followup"
tags:
  - "ui"
  - "css"
  - "macos"
  - "d126"
  - "mcp-tool"
---
[x] 크로뮴 띠를 비워 두니 종이가 신호등 밑으로 흘렀다 — 띠를 책상색으로 덮었다 (D126)

브라우저에서 여백을 실제로 재 보다가 나왔다 — 하네스가 `Desktop Chrome` 의 **Windows UA** 로 뜨므로 macOS UA 를 갈아 끼워야 이 자리가 보인다(그래서 기존 게이트 114개는 이 변경에 영향을 받지 않는다).

## 발생 원인

오버레이 크로뮴은 웹뷰를 창 끝까지 늘린다. 여백을 준다고 그 자리가 **비는** 것이 아니라, 스크롤한 내용이 그 밑을 그대로 지나간다 — 홈처럼 긴 화면을 조금만 내려도 종이와 활자가 창 단추 뒤로 흘러간다. 여백은 「처음 자리」만 정할 뿐이다.

한 가지가 더 있었다: 홈 뿌리(`.press`)에 포커스를 주는 줄(D111)이 브라우저의 「보이게 끌어오기」를 불러 28px 을 그대로 스크롤해 버렸다. 여백을 만들자마자 그것이 접힌 셈이다.

## 해결 방법

- `.chrome-drag` 에 `background: var(--desk)`. 띠가 불투명해지면서 그 밑을 지나는 내용이 가려지고, 그 자리가 앱 색을 쓴 제목 표시줄이 된다. 다른 OS 는 높이가 0 이라 아무것도 그리지 않는다.
- `focus({ preventScroll: true })` — 포커스를 옮기는 것이 목적이고 스크롤은 목적이 아니다.
- `html { scroll-padding-top: var(--chrome-top) }` — WebKit(앱의 WKWebView)이 `preventScroll` 을 지키지 않는 자리가 있어, 앵커·`scrollIntoView` 까지 한 번에 막는 쪽을 같이 둔다.

## 검증

macOS UA 로 갈아 끼운 임시 스펙을 chromium·webkit 둘 다에서 돌려 `data-chrome=overlay · body padding 28px · 띠 높이 28 · drag 속성 · #root top 28 · 마스트헤드 top 50 · scrollY 0` 을 확인했다(둘 다 통과). 스펙은 남기지 않았다 — 06 §2 의 게이트 목록에 없는 파일을 등록부 행 없이 CI 에 얹지 않는다.

`pnpm test:gates` 114 통과 · `pnpm lint` 초록 · 앱을 띄워 로그에 오류·경고 0.