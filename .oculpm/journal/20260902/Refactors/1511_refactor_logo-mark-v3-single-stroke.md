---
schema_version: 1
type: refactor
slug: "logo-mark-v3-single-stroke"
status: done
difficulty: high
created_at: "2026-09-02T15:11:52+09:00"
session_id: "20260902-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
language: "ko"
verified_by_user: false
files_touched:
  - path: "design/logo/mark/build.py"
    op: update
  - path: "design/logo/mark/chickadee-mark.svg"
    op: update
  - path: "design/logo/mark/chickadee-mark-16.svg"
    op: update
  - path: "design/logo/mark/chickadee-icon-sticker.svg"
    op: update
  - path: "design/logo/mark/chickadee-icon-app.svg"
    op: update
  - path: "design/logo/mark/README.md"
    op: update
  - path: "design/logo/mark/contact-sheet.png"
    op: update
  - path: "design/logo/mark/verify.json"
    op: update
  - path: ".oculpm/discussion/vibe-code-study-app/discussion.md"
    op: update
related:
  - ref: "20260902/Features_to_add/1503_feature_logo-mark-parametric-svg.md"
    kind: "followup"
tags:
  - "design"
  - "logo"
  - "svg"
  - "chickadee"
  - "icon"
  - "mcp-tool"
---
[x] 로고 마크 전면 재설계

## 동기
사용자: 「전문 디자이너가 디자인한 것처럼, AI가 디자인한 것처럼 보이면 안 돼」. 1차 마크는 원·타원을 쌓은 구성이 그대로 보였고(컴퍼스 원 머리, 점무늬 덩어리, 마스코트풍 귀여움), 텍스처 세 개가 서로 싸웠다.

## 변경 요약
- 기하를 **한 획 실루엣**으로: 뒷목 → 납작한 정수리 → 짧고 뭉툭한 부리 → 목·가슴·배 → 끝이 파인 긴 꼬리 → 등. 눈 없음(실제 박새처럼 캡에 묻힘, 마스터만 작은 점).
- 캡은 「이 선 위」 폴리곤을 실루엣에 클립, 뺨은 뒤로 갈수록 넓어지는 명시적 쐐기, 턱받이는 부리 밑 물방울 + 아랫단 종이색 점 침식.
- **톤 위계**: 종이 흰색은 뺨에만 · 배 = 진홍 15% 스크린 · 등 = 청 45% 스크린 · 날개·꼬리 = 청 솔리드 · 진홍 솔리드 = 먹판 어긋남(−2.2,+1.8) 한 번. 크림 스티커 위에서 흰 배가 묻히던 문제가 이 위계로 해결.
- 소형(16~32px)은 같은 경로를 1.16배 확대, 어긋남·침식·눈 제거, 부리 강조.

## 검증
- 16px 3단 판정: 마스터 2열/뺨 2px, 소형 3열/뺨 2px 합격. 스티커 24px, 앱 아이콘 32px 부터 합격.
- 중간 실패 2회를 렌더로 잡음 — ④등 스크린을 실루엣 전체에 깔아 뺨 소실 ⑤흰 배가 스티커에 묻혀 「머리+파란 팔」. README 에 6회 교정 기록.

## 메모
- 다음: 사용자 확인 후 `ink-home.html` 의 `#dee`/`#deeHead` 를 이 기하로 교체해 마스코트·로고 통일. Dee 상태 7종(홉·거꾸로 매달리기 등)은 이 실루엣 위에 파트 트랜스폼으로 옮긴다.