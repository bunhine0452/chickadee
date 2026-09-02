---
schema_version: 1
type: feature
slug: "ink-session-proof-mockup"
status: done
difficulty: high
created_at: "2026-09-02T16:44:23+09:00"
session_id: "20260902-003"
agent:
  id: "claude-code"
  version: "Fable 5.1"
language: "ko"
verified_by_user: false
files_touched:
  - path: "design/ink-session.html"
    op: create
  - path: "design/src/ink/build.py"
    op: create
  - path: "design/src/ink/ink-session.src.html"
    op: create
  - path: "design/src/ink/shared.css"
    op: create
  - path: "design/src/ink/session.css"
    op: create
  - path: "design/src/ink/data.js"
    op: create
  - path: "design/src/ink/util.js"
    op: create
  - path: "design/src/ink/t0.js"
    op: create
  - path: "design/src/ink/t1.js"
    op: create
  - path: "design/src/ink/t2.js"
    op: create
  - path: "design/src/ink/session.js"
    op: create
  - path: "design/src/ink/logo.svg.html"
    op: create
  - path: "design/ink-home.html"
    op: update
  - path: "design/index.html"
    op: update
  - path: "design/README.md"
    op: update
  - path: "design/shots/ink-session-flow.png"
    op: create
  - path: ".oculpm/discussion/vibe-code-study-app/discussion.md"
    op: update
related:
  - ref: "20260902/Features_to_add/1421_feature_ink-home-riso-chickadee.md"
    kind: "followup"
tags:
  - "design"
  - "ink"
  - "session"
  - "t0"
  - "t1"
  - "t2"
  - "mockup"
  - "playwright"
  - "mcp-tool"
---
[x] 잉크 교정쇄(데일리 세션) 목업 — T0 3종 · 다시 찍기 사다리 · T1 필사 · T2 책임 배치 · 인쇄 완료

## 추가 기능
- `design/ink-session.html` — 홈의 「인쇄 시작」이 여는 전체화면 오버레이. 오늘의 인쇄 5판(T0 의미형 `함수형 업데이트` · 빈칸형 `map` · 지목형 `?.` · T1 `LoginForm` 필사 2단계 · T2 `cart/` 책임 배치)이 한 흐름으로 걸리고 「인쇄 완료」 요약으로 끝난다.
- 작업 띠: 확정 로고 배지 · **시간 비례 큐**(칸 너비 = 분, 지금 칸은 실제 경과로 차오름) · 어긋남/모르겠어요가 「다시 찍기」 칸을, 사다리 2단이 「아래층」 칸을 큐에 끼움 · Esc 즉시 이탈(확인 모달 없음, localStorage 에 진행 저장 → 이어 찍기).
- T0: 판정란 예약(답해도 위 글 0px 밀림 없음) · 진단문 = 「그것이 참이 되는 조건」 + 「가장 날카로운 자리」 최소 코드 · 정합/어긋남 도장 · 잉크 겹 +1(맞힘) 또는 그대로 + 다시 찍기(어긋남).
- 「모르겠어요 = 다시 찍기」: 맞혀도 남는 버튼 · 한 겹 내려감 + 오늘로 당김을 이득으로 표시 · Dee 거꾸로 매달림 · 4단(사전 3층 / 아래층 진단 → 선행 판 점프 → 자동 복귀 + 「방금 배운 것과 이어보기」 문단 / 내 리포 다른 사용처 / 자유 질문 = 키 없으면 프롬프트 생성).
- LIFER: 새 판 첫 정합 시 도장 + 일련번호 타이핑, 배경 흐림(지우지 않음), 아무 키나 닫힘, 세션당 3회.
- T1: 고정 골격/가변 잉크(가려진 줄 = 하프톤 막대) · 줄을 벗어날 때만 판정(거터 틱) · `` ` `` 홀드 = 원본 잠깐 보기(횟수만) · 채점 = 정합/동등/어긋남(공백·따옴표·세미콜론·주석·**변수명 1:1 일관 치환**, 원본에 있는 이름이면 「이름 맞바꿈」) · 「같은 뜻인데요」 이의 · 「왜」 게이트(10자·코드 복사 금지·모르겠어요 → 보기 → 자기 말로).
- T2: 결정론적 4층 밴드 SVG 지도(포트 분산, 호버 강조) · 책임 배치 · 힌트 3단 · 3티어 채점(필수 6 / 함께 바뀜 1 / 흔한 오답 5 + 이유) · 놓친 파일 먼저 + 깜빡임 · 정답 출처 = 실제 커밋 · 「이것도 맞다고 생각해요」.
- 요약: 판·정합·시간·연속 → 개념별 Dee 전/후 + 다음 인쇄 날짜 → LIFER 기록 → 내일 예고.

## 동작 흐름
`design/src/ink/*.src.html + css/js` → `python3 design/src/ink/build.py` 가 **`ink-home.html` 에서 토큰·조판·Dee 심볼 블록을 경계 문자열로 추출**해 인라인 → 자립형 `design/ink-session.html`(외부 의존성은 폰트 CDN 뿐). 홈은 5판/15분 큐 + T2 행 + 「인쇄 시작」/「이 판 찍기」 → 세션 링크, 「판이 없는 문법」의 `?.` 를 `??` 로 교체(세션에서 `?.` 판이 걸리므로).

## 검증
- Playwright Chromium 으로 5판 전 흐름 자동 주행(정답 → 오답 → 사다리 4단 → 아래층 점프 → 복귀 → LIFER → 필사 예시 답안 채점 → 이의 → 왜 → 다시 찍기 2판 → 구조 채점 → 요약 → 야간반): 콘솔·페이지 오류 0, 큐 5 → 8칸으로 늘어남 확인, T1 20줄 중 18줄 의미 일치(동등 5 · 이름 맞바꿈 1 · 누락 1), T2 50%.
- `?dev=1` 검수: 13px 미만 활자 0(85개), 본문 한 줄 최대 40자(36em 강제).
- 도중 잡은 결함 3건: `[hidden]` LIFER 베일이 클릭을 가로챔(`.lifer-veil[hidden]{display:none}`), 지목형 정답 인덱스 불일치(answer 2 → 1), T1 결과표가 사라진 textarea 를 다시 읽음(답안을 결과에 보관). T1 줄 짝짓기는 같은 줄 번호 우선(유사도 .6 이상)으로 바꿔 email/password 줄이 엇갈리던 문제 해결.

## 메모
- 데이터(카드·필사 원본·의존 그래프)는 목업용 하드코딩. 홈 자체는 아직 빌드 밖(다음: `ink-home.html` 을 `src/ink/` 로 이전). Dee ↔ 로고 통일 남음.
- 스크린샷: `design/shots/ink-session-*.png`, 흐름 몽타주 `design/shots/ink-session-flow.png`.