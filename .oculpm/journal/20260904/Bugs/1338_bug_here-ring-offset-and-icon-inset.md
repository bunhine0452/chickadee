---
schema_version: 1
type: bug
slug: "here-ring-offset-and-icon-inset"
status: done
difficulty: medium
created_at: "2026-09-04T13:38:44+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/components/home/Node.css"
    op: update
  - path: "design/logo/chickadee-logo-macos.svg"
    op: update
  - path: "apps/desktop/src-tauri/icons/icon.icns"
    op: update
  - path: "apps/desktop/src-tauri/icons/icon.png"
    op: update
  - path: "apps/desktop/src-tauri/icons/128x128.png"
    op: update
  - path: "apps/desktop/src-tauri/icons/128x128@2x.png"
    op: update
  - path: "apps/desktop/src-tauri/icons/64x64.png"
    op: update
  - path: "apps/desktop/src-tauri/icons/32x32.png"
    op: update
related:
  - ref: "20260904/Features_to_add/1330_feature_macos-icon-rounded-tile.md"
    kind: "followup"
tags:
  - "ui"
  - "css"
  - "webkit"
  - "icon"
  - "d135"
  - "mcp-tool"
---
[x] 「지금 여기」 점선 링이 스티커에서 어긋났다 — 대체 요소의 크기를 글자로 못박았다

사용자 스크린샷 — 「지금 여기」 스티커의 진홍 점선 링이 원 밖으로 어긋나 왼쪽 위로 밀려 있었다.

## 발생 원인

```css
.node[data-state="current"] .cut { position: absolute; inset: -7px; }
```

`.cut` 은 `<svg>` 이고 **대체 요소(replaced element)** 다. 대체 요소는 `width`·`height` 가 `auto` 면 네 방향 `inset` 으로 늘어나는 대신 **고유 크기**를 쓴다 — 여기서는 담는 상자(`.die`)의 100%, 즉 82px. 자리는 `top`·`left` 만 먹어 `-7px` 로 밀리므로 링의 중심이 스티커 중심에서 **왼쪽 위로 7px** 어긋난다. 링 지름(90px)이 스티커(82px)보다 조금 크므로, 어긋난 만큼 오른쪽 호가 `.face` 뒤로 숨는다 — 스크린샷이 정확히 그 모양이다(링 지름 대 원 지름 1.27, 계산값 1.25).

**하네스에서는 재현되지 않는다.** Playwright 의 chromium·webkit 둘 다 `auto` 로 두어도 96px 로 늘려 주었다(측정: `width:auto` 를 강제해도 96px). 앱은 시스템 WKWebView 라 빌드가 다르고, 거기서만 82px 이 나온 것으로 보인다. 그래서 이것은 「어느 엔진이 옳으냐」가 아니라 **기대면 안 되는 자리**다.

## 해결 방법

폭·높이를 글자로 적는다 — `width: calc(100% + 14px)`·`height: calc(100% + 14px)`. `inset: -7px` 는 자리를 위해 남기고, 크기는 어느 엔진에서도 96px 로 확정된다.

같이 한 것 (D135 이어서) — 사용자 요청 「앱 그림을 둥근 사각형에 맞게」: 아이콘의 배지를 타일의 **0.78 배**로 놓았다. 원본은 정사각을 꽉 채우는 그림이라 그대로 얹으면 둥근 모서리 안에서 링이 벽에 붙어 보인다. 이 값이면 링 지름이 타일의 약 73% 로, Dock 에서 옆 아이콘들이 쓰는 여백과 같은 자리에 온다. 그림 자체(경로·색·비율)는 그대로다.

## 검증

- 하네스 두 엔진에서 링 중심 == 원 중심이고 계산 폭이 96px 임을 측정(고친 뒤). 앱에서는 Vite 가 CSS 를 그 자리에서 갈아 끼우므로 돌고 있는 창에 이미 들어가 있다 — 눈으로 보는 것은 사용자 몫으로 남겼다.
- 아이콘: 1.0·0.86·0.78 을 128px·32px 로 나란히 굽어 사용자에게 보냈다. 32px 3단 판정은 0.78 에서 6열/8px 합격(1.0 은 18열).
- `pnpm lint` 초록 · `Node.test.tsx` 4개 통과.

## 메모

같은 모양의 자리가 더 있는지 훑었다 — `position:absolute` 인 `<svg>` 로 네 방향 `inset` 에 기대는 곳은 이 한 곳뿐이다(`.ck svg` 는 폭·높이를 글자로 갖고 있다).