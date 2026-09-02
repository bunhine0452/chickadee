---
schema_version: 1
type: feature
slug: "ink-home-riso-chickadee"
status: done
difficulty: high
created_at: "2026-09-02T14:21:40+09:00"
session_id: "20260902-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
language: "ko"
verified_by_user: false
files_touched:
  - path: "design/ink-home.html"
    op: create
  - path: "design/README.md"
    op: update
  - path: "design/index.html"
    op: update
  - path: "design/shots/ink-home-light.png"
    op: create
  - path: "design/shots/ink-home-dark.png"
    op: create
  - path: "design/shots/ink-home-trim.png"
    op: create
  - path: "design/shots/ink-home-detail.png"
    op: create
  - path: "design/shots/ink-home-dee-sizes.png"
    op: create
  - path: ".oculpm/discussion/vibe-code-study-app/discussion.md"
    op: update
related:
  - ref: "20260902/Chores/1324_chore_archive-rejected-design-drafts.md"
    kind: "followup"
tags:
  - "design"
  - "riso"
  - "chickadee"
  - "path-home"
  - "readability"
  - "a11y"
  - "mcp-tool"
---
[x] 「잉크」+박새 경로 홈 1차 완성

## 추가 기능
- `design/ink-home.html` — 자립형 경로 홈. `dir-b-riso.html` 의 시각 언어를 기준으로 하되 마스코트 Dee(`fg-dee.html`)를 리소 3도 인쇄로 다시 입힘.
- **잉크 겹 = 숙련도 = 박새 선명도**: `.dee[data-ly=0..4]` 한 심볼로 0 실루엣 · 1 애벌(먹 하프톤) · 2 먹판 · 3 +청판 · 4 +진홍판(어긋남 유령 가장자리·가슴 워시). 범례 사다리, 대지 레일(유닛 평균), 개념 행, 노드 상세에 동일 적용. 야간반에서도 새는 크림 스티커 위에 찍힌다.
- 16~20px 은 머리 마크 `#deeHead` 로 분기, 파비콘에 적용.
- 밀도 완화(3주째 피로): 등록표시 장당 1개(완성 판은 진홍 정합), 레일 축소, 노드 지터 ±4px, `filter:drop-shadow` 전량 `box-shadow` 로, 블렌드는 워드마크·도장에만. 「부속 숨김」 스위치(기본 보임, localStorage).
- 야간반: 어두운 판지(#1F1915/#29211B) + 뜨거운 형광 잉크(#3B82FF/#FF3A86) + 스티커 글로우(box-shadow) + 작업 램프. 판지 위 새는 먹 캡을 #4E453C 로 한 단 올림. 저장값 없으면 시스템 테마 따름.
- 은유 평문 병기(대지 = 내 리포의 기능 지도 등), 조사 헬퍼 `josa()`, 길잡이 Dee 가 현재 노드를 가리키는 말풍선.
- 오늘의 인쇄 큐 바를 시간 비례로 그려 「세션 진행바 T1 칸 왜곡」 충돌을 홈에서 먼저 해소.
- 검수 도구 `window.__audit` (활자 하한·대비·행 길이·16px 실루엣 래스터·부하 시험), `?dev=1` 패널, `?stress=48` 모드.

## 동작 흐름
노드 클릭 → 상세 펼침(그 개념의 겹만큼 선명한 새 + 다음 인쇄 안내 + 「이 판 찍기」). 잠긴 노드 → 흔들림 + 선행 안내. 「인쇄 시작」(Enter) → Dee 홉 + 토스트. 주간반/야간반·부속 보임/숨김은 localStorage 로 유지. Esc 로 상세·토스트 닫기.

## 검증
- Chrome 실측: 활자 192개 전수 13px 미만 0 · 종이 위 텍스트 최소 7:1 이상(예외: 완료 스티커 오버프린트 위 글리프 4.9:1, 잉크 배지 위 글자 4.73:1=AA) · 본문 행 길이 Plex Sans KR 16px 40자(측면 노트 22~24자).
- 16px: 전신은 24px부터 합격(3단 열 3·뺨 2px), 16px 전신 불합격(뺨 1px) → 머리 마크 합격.
- 부하: headless Chromium 노드 49개 스크롤+hover 3초 — 평균 8.3ms · p95 8.4ms · 최대 9.5ms · 16.7ms 초과 0 (주간/야간 동일). **WebKit 미측정** — Playwright webkit 다운로드가 20분 넘게 진척 없어 중단.

## 메모
- 로고: OpenRouter 래스터 모델은 호출하지 않음(사용자 메모 「svg 를 주는 모델」과 충돌). 리소 박새 SVG 자체가 로고 후보.
- 다음: 사용자 반응 → T0 교정쇄 카드(4단 사다리) → 데일리 세션 오버레이 → T1·T2 이식.