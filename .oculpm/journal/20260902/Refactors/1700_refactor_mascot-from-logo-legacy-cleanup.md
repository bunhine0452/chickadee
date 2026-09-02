---
schema_version: 1
type: refactor
slug: "mascot-from-logo-legacy-cleanup"
status: done
difficulty: medium
created_at: "2026-09-02T17:00:51+09:00"
session_id: "20260902-003"
agent:
  id: "claude-code"
  version: "Fable 5.1"
language: "ko"
verified_by_user: false
files_touched:
  - path: "design/src/ink/mascot.svg.html"
    op: create
  - path: "design/src/ink/logo.svg.html"
    op: delete
  - path: "design/ink-home.html"
    op: update
  - path: "design/ink-session.html"
    op: update
  - path: "design/src/ink/session.css"
    op: update
  - path: "design/src/ink/t0.js"
    op: update
  - path: "design/src/ink/t1.js"
    op: update
  - path: "design/src/ink/t2.js"
    op: update
  - path: "design/src/ink/session.js"
    op: update
  - path: "design/src/ink/ink-session.src.html"
    op: update
  - path: "design/legacy"
    op: create
  - path: "design/index.html"
    op: update
  - path: "design/README.md"
    op: update
  - path: "design/logo/README.md"
    op: update
  - path: ".oculpm/discussion/vibe-code-study-app/discussion.md"
    op: update
related:
  - ref: "20260902/Features_to_add/1644_feature_ink-session-proof-mockup.md"
    kind: "followup"
  - ref: "20260902/Chores/1643_chore_logo-confirmed-derived-assets.md"
    kind: "followup"
tags:
  - "design"
  - "mascot"
  - "logo"
  - "legacy"
  - "discussion"
  - "ink"
  - "mcp-tool"
---
[x] 마스코트를 확정 로고 SVG 복사본으로 통일 · 폐기 시안 legacy 이동 · 논의 문서 결론 재작성

## 동기
사용자 질문 「dee 심볼이라니 그게 뭐야?」— 홈의 손그림 마스코트 `<symbol id="dee">` 가 확정 로고와 다른 그림이었다. 지시: 「다른 디자인들 폐기(레거시로 이동)」, 「내가 제공한 svg 를 복사하고 수정해서 제작」, 「이 서비스 문서를 논의에 제대로 만들어줘」.

## 변경 요약
- `design/src/ink/mascot.svg.html`: `logo/chickadee-logo.svg` 의 경로 6개를 그대로 복사해 `#deePlates` 한 벌로 두고, 색만 판 변수(`--lk 먹 · --lg 회색 · --lb 청 · --lt 황갈 · --lp 진홍 · --ly 황 · --lpaper 종이`)로 바꿈. 심볼 3종이 공유: `#dee` 배지, `#deeBird` 새+가지(새 판들의 볼록 껍질로 크림 다이컷 + 클립 — 링은 밖), `#deeHead` 머리 크롭, `#logo` 고정색. 홈의 옛 `#dee`/`#deeHead`/`deeClip` 과 앞서 넣은 `#logo` 블록을 이 블록 하나로 교체(세션은 빌드가 홈에서 추출).
- 잉크 겹 CSS 재정의: 0 전부 빈 판(`--dee-blank`) · 1 회색 스크린(`#htGrayL`, 16px 셀) · 2 먹판(먹·회색, 청은 스크린) · 3 +청판 · 4 +진홍·황판(어긋난 링·바닥·황갈 배). `.dee-sticker` 는 배지가 링·원판을 가지므로 투명 틀 + 종이 두께 그림자만, 안의 새는 100%(홈 4·세션 7 규칙). 맨몸 새(횃대·길잡이)는 `#deeBird`, 판지 위 먹 캡 올리기 규칙 제거(다이컷이 크림이라 불필요).
- 검수 코드 `audit.deeStandalone` 을 DOM 심볼에서 자립형 SVG 를 만들도록 재작성(공유 경로 인라인).
- 레거시: `design/legacy/` 로 도감 3 · 방향 4안 · 기능 설계 4 · NEXT-SESSION-PROMPT · fg 소스 · 옛 스크린샷 이동. `design/` 에는 `ink-home.html` · `ink-session.html` · `src/ink/` · `logo/` · `shots/` · `index.html` · `README.md` 만.
- 문서: `discussion.md` 결론을 현재 유효한 결정만으로 전면 재작성(제품·트랙·UX 불변 규칙·언어 초심자·스택·잉크 디자인 시스템·로고/마스코트·화면·폐기 결정·미해결) + 다음 단계 갱신, 로그 2행. `design/README.md` 를 현재 상태 안내로 재작성, `index.html` 레거시 한 줄로 축소, `logo/README.md` 마스코트 절.

## 검증
- 1차 빌드에서 마스코트가 빈 원판으로 렌더 — 경로 공유 정리 시 `#deePlates` 의 경로가 잘못 제거된 탓(머리 심볼만 살아남음). 블록을 직접 생성하는 방식으로 재작성해 해결.
- 홈 `?dev=1`: 배지 24px 3단 14열·뺨 13px, 32px 24열·18px 합격, 16px 머리 크롭 4열·3px 합격(전신 16px 은 불합격 → 머리 크롭 사용). 활자 13px 미만 0, 페이지 오류 0. 세션 Playwright 전 흐름 재주행 오류 0.
- 스크린샷 `design/shots/ink-home-*.png`, `ink-session-*.png`, `ink-session-flow.png` 갱신.

## 메모
- 파일 크기: 홈 137KB, 세션 214KB(공유 경로 한 벌 22KB).
- 남은 것: 홈을 `src/ink/` 빌드로 이전, WebKit 성능, 세션 데이터 실제 연결.