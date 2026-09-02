---
schema_version: 1
type: feature
slug: "logo-mark-parametric-svg"
status: done
difficulty: medium
created_at: "2026-09-02T15:03:55+09:00"
session_id: "20260902-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
language: "ko"
verified_by_user: false
files_touched:
  - path: "design/logo/mark/build.py"
    op: create
  - path: "design/logo/mark/chickadee-mark.svg"
    op: create
  - path: "design/logo/mark/chickadee-mark-16.svg"
    op: create
  - path: "design/logo/mark/chickadee-icon-sticker.svg"
    op: create
  - path: "design/logo/mark/chickadee-icon-app.svg"
    op: create
  - path: "design/logo/mark/README.md"
    op: create
  - path: "design/logo/mark/contact-sheet.png"
    op: create
  - path: "design/logo/mark/verify.json"
    op: create
  - path: "design/logo/README.md"
    op: update
  - path: ".oculpm/discussion/vibe-code-study-app/discussion.md"
    op: update
related:
  - ref: "20260902/Chores/1451_chore_logo-recraft-vector-openrouter.md"
    kind: "followup"
tags:
  - "design"
  - "logo"
  - "svg"
  - "chickadee"
  - "icon"
  - "mcp-tool"
---
[x] 아이콘 로고를 API 없이 직접 설계

## 추가 기능
- `design/logo/mark/build.py`: 한 벌의 파라메트릭 기하(머리 원·몸 타원·상대 좌표 경로)에서 4개 SVG 생성 — 마스터 전신, 16~32px 전용(머리 확대·부속 제거·부리 강조), 원형 다이컷 스티커, 1024 라운드 사각 앱 아이콘(크라프트 바탕 + 종이 두께 그림자 + 진홍 어긋난 링 + 스티커).
- 리소 3도 판 순서대로 그린다: 진홍판 어긋남(−2.0,+1.7) → 옅은 청 하프톤 몸통 → 종이색 가슴 → 단색 청 꼬리 → 청 하프톤 날개 → 진홍 하프톤 배 → 다리 → 먹 머리(캡/뺨 경계 −4°) → 부리 → 턱받이 → 눈 빛. 팔레트 5색, 그라디언트·필터 0.
- Playwright 렌더 스크립트(스크래치패드 `render-mark.mjs`)로 크기 사다리 대조 시트, 16/24/32px 3단 판정, PNG 내보내기(앱 아이콘 1024~32, 마크 256~16).

## 동작 흐름
`python3 build.py` → SVG 4종 → `node render-mark.mjs` → `contact-sheet.png`·`verify.json`·`png/`.

## 검증
- 마스터·16px 전용 모두 16px 에서 3단 열 3 · 뺨 2px 합격, 24/32px 합격. 스티커·앱 아이콘은 32px 부터 합격(16px 자리는 mark-16 담당).
- 3회 육안 교정: ①턱받이가 머리에서 떨어져 「검은 알」 → 부리 밑 부착 ②크림 몸통이 종이에 묻혀 「머리+파란 소매」 → 옅은 청 하프톤 몸통·종이색 가슴 ③꼬리가 「파란 벽돌」 → 뿌리를 몸 안으로, 펴지는 쐐기.

## 메모
- 다음: 사용자 확인 후 경로 홈(`ink-home.html`)의 `#dee`/`#deeHead` 심볼을 이 기하로 교체해 마스코트·로고를 하나로 통일. 생성 후보 15종은 참고용으로 유지.