---
schema_version: 1
type: chore
slug: "logo-confirmed-derived-assets"
status: done
difficulty: low
created_at: "2026-09-02T16:43:42+09:00"
session_id: "20260902-003"
agent:
  id: "claude-code"
  version: "Fable 5.1"
language: "ko"
verified_by_user: false
files_touched:
  - path: "design/logo/chickadee-logo-badge.svg"
    op: create
  - path: "design/logo/chickadee-logo-square.svg"
    op: create
  - path: "design/logo/chickadee-logo-favicon.svg"
    op: create
  - path: "design/logo/favicon.ico"
    op: create
  - path: "design/logo/export.cjs"
    op: create
  - path: "design/logo/README.md"
    op: create
  - path: "design/logo/contact-sheet.png"
    op: create
  - path: "design/logo/verify.json"
    op: create
  - path: "design/logo/png"
    op: create
  - path: "design/ink-home.html"
    op: update
related:
  - ref: "20260902/Refactors/1511_refactor_logo-mark-v3-single-stroke.md"
    kind: "followup"
tags:
  - "design"
  - "logo"
  - "chickadee"
  - "favicon"
  - "user-decision"
  - "mcp-tool"
---
[x] 로고 확정(사용자 결정) — 디자인은 그대로, 파생 에셋만 생성

## 작업
- 사용자가 `design/logo/` 를 비우고 `chickadee-logo.svg` 하나를 넣은 뒤 「이 svg 파일로 로고 확정, 다른 거 절대 안 함」으로 못박음. 진행 중이던 v4 재설계는 중단하고 **디자인은 한 획도 바꾸지 않았다**.
- 파생만: `chickadee-logo-badge.svg`(배경 사각형 → 링 안쪽 크림 원판, 바깥 투명) · `chickadee-logo-square.svg`(메타데이터만 제거) · `chickadee-logo-favicon.svg`(같은 파일의 머리 크롭 viewBox `190 80 180 180`) · `png/` 14종 · `favicon.ico`(16/32/48, PIL) · `export.cjs`(재생성 스크립트, playwright 는 npx 캐시에서 탐색) · `contact-sheet.png` · `verify.json` · `README.md`.
- 원본 27KB 중 22KB 가 C2PA 메타데이터(Claude 생성 표식)라 파생본에서 제거.
- 적용: `ink-home.html` 마스트헤드 브랜드(Dee 스티커 → 로고 배지 66px) + 정적 파비콘, `ink-session.html` 작업 띠(46px) + 파비콘.

## 검증
- 16px 3단(캡–뺨–턱받이) 판정: 전신(배지·정사각·원본)은 16px 1열 불합격 → 32px 24열 합격. 머리 크롭 파비콘은 16px 4열·뺨 3px, 24px 8열, 32px 14열 합격 (`design/logo/verify.json`).
- 후보 3종(viewBox 178/190/170 기준) 중 fav-b 가 16px 판독과 128px 미관 모두 최선이라 채택.

## 메모
- 마스코트 Dee(`#dee` 심볼)는 아직 이전 기하. 로고의 새에 맞춰 다시 그리는 일은 discussion #next-mascot-design.