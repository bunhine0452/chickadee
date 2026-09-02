---
schema_version: 1
type: chore
slug: "archive-rejected-design-drafts"
status: done
difficulty: low
created_at: "2026-09-02T13:24:27+09:00"
session_id: "20260902-001"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "design/README.md"
    op: create
  - path: "design/index.html"
    op: create
  - path: "design/fg-shell.html"
    op: create
  - path: "design/fg-t0.html"
    op: create
  - path: "design/fg-dee.html"
    op: create
  - path: "design/dir-a-arcade.html"
    op: create
  - path: "design/dir-b-riso.html"
    op: create
  - path: "design/dir-c-editorial.html"
    op: create
  - path: "design/dir-d-terminal.html"
    op: create
  - path: "design/design-shell.html"
    op: create
  - path: "design/design-t0-syntax.html"
    op: create
  - path: "design/design-t1-clone.html"
    op: create
  - path: "design/design-t2-structure.html"
    op: create
  - path: ".oculpm/discussion/vibe-code-study-app/discussion.md"
    op: update
related: []
tags:
  - "design"
  - "handoff"
  - "archive"
  - "mcp-tool"
---
[x] 반려된 디자인 시안 11건을 design/ 으로 아카이브하고 핸드오프 작성

한 세션 동안 만든 시각 디자인 시안 11건을 사용자가 전량 반려하고 다음 세션으로 인계하기로 했다. scratchpad 는 임시 디렉터리라 세션이 끝나면 사라지므로, 산출물을 프로젝트 루트로 옮기고 다음 세션이 맥락 없이도 이어받을 수 있게 정리했다.

옮긴 것: 「도감」 방향 3건(시스템+경로 홈 / T0 카드 / 마스코트 Dee), 방향 경쟁 4안(아케이드·리소그래프·에디토리얼·터미널), 방향 결정 이전 기능 설계 4건(셸·T0·T1·T2), 목차 페이지, 모듈 소스(css/js/build), 검증 스크린샷 8장. 전부 외부 의존성 0 자립형 HTML 이라 더블클릭으로 열린다.

`design/README.md` 에 핸드오프를 썼다. 핵심은 세 가지다.

- **반려 사유가 확인되지 않았다.** 그래서 "다시 만들기 전에 무엇이 안 맞았는지부터 물어라 — 안 물으면 같은 실수를 반복한다"를 첫 줄에 박았다. 검증되지 않은 원인 가설 4개를 별도로 표시해 남겼다(가독성 피드백 이후 과잉 교정으로 원래 요구인 「듀오링고」에서 멀어졌을 가능성이 가장 유력).
- **시각은 폐기 후보지만 상호작용 설계는 유효하다.** 특히 T1 클론 코딩(3단계 페이딩·diff 채점 규칙·이의제기)과 T2 구조(그래프 전략·문제 4종·채점 3티어)의 동작 설계는 `design-*.html` 에만 존재하고 새 방향으로 옮기지 못했다.
- **이 반려가 무효화하지 않는 범위를 명시했다.** 제품 결정(4트랙·Tauri·Monaco·LLM 선택사항·오픈소스 정책 등)은 discussion.md 에 있고 그대로 유효하다.

discussion.md 에는 「보류 — 시각 디자인」 절을 신설하고, 토의 로그 3건(시안 완성 / 전량 반려 / 원인 가설)을 append 했다. 다음 단계에 `#next-ask-why`(반려 사유 확인)를 재작업의 선행 조건으로 추가하고, 완료 표시했던 방향 선정 항목을 반려 상태로 정정했다.

## 검증

`design/` 에 HTML 11개 + `src/` 7파일 + `shots/` 8장, 총 2.8MB 복사 확인. 목차 `index.html` 의 링크가 전부 같은 폴더 평면 참조라 이동 후에도 유효하다. discussion.md 는 로그 21건·다음 단계 12항목으로 갱신됐고 managed block 경계와 `{#id}` 는 보존했다.

## 메모

`Chickadee` 라는 제품명과 마스코트 Dee 는 확정했으나 반려된 시안과 함께 정해진 것이라, 시각 방향이 바뀌면 같이 흔들릴 수 있다고 양쪽 문서에 표시했다.