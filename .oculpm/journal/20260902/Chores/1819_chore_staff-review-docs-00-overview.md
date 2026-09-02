---
schema_version: 1
type: chore
slug: "staff-review-docs-00-overview"
status: done
difficulty: high
created_at: "2026-09-02T18:19:36+09:00"
session_id: "20260902-003"
agent:
  id: "claude-code"
  version: "Claude Fable 5.1"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/00-overview.md"
    op: create
  - path: "docs/REVIEW.md"
    op: create
related: []
tags:
  - "docs"
  - "staff-review"
  - "chickadee"
  - "handover"
  - "mcp-tool"
---
[x] 설계 문서 6편(01~06)의 상충을 결정하고 인계 문서·수정 지시서를 썼다

## 작업 요약
- `docs/00-overview.md` — 요약·시작점, 시스템 지도(문서별 소유), 용어집(은유↔평문↔코드, 폐기 이름 병기), 결정 등록부 D1~D47(제기된 14건 + 발견 33건), 정본 갱신 기록(§4.3, 정본에는 이미 반영됨), 마일스톤 M0~M6 에 체크리스트 87개(01:14·02:14·03:15·04:14·05:15·06:15) 전부 배치, 사용자 결정 8건(기본값 포함), 인계 규칙.
- `docs/REVIEW.md` — 문서별 「어느 절 → 무엇으로」 지시 (01:17 · 02:13 · 03:29 · 04:14 · 05:14 · 06:25), 새 DDL(`capture`·`commit_file`·`import_edge`·`block`·`why_answer`·`perf_sample`)·타입(`Capture` 확장·`BlameHunk`·`IngestWarning`) 원문 포함, 끝에 grep 검증 목록.
- 핵심 결정: Rust 는 캡처·커밋 사실만 SQLite 에 쓰고 TS `packages/concepts` 가 파일 단위 페이지로 읽어 03 알고리즘 그대로 `concept_site` 파생(D1) · 02 DDL 정본 + 원시 사실 테이블 추가(D2) · 겹은 02 리듀서, 04 `lyProposed` 폐기(D3) · `appeal` 통일 + 전이 3겹 임계(D4) · T1 대표 개념·T2 `arch/*` 숙련도 키(D27) · 대지 탐지 규칙 신설(D29) · 파일 해시 = git blob oid(D20) · 커밋 분류는 TS(D21) · grammar/lang 분리(D19).

## 검증
- 마일스톤 표 행 수 87, 문서별 14/14/15/14/15/15 를 grep 으로 확인. 00 본문 단어 3,779(기호 제외).
- REVIEW 의 「없음」 grep 패턴이 현재 문서에서 전부 1건 이상 히트함을 확인(검사가 공허하지 않음). 목업 인용 줄(`t0.js:146/268`, `t2.js:140`, `t1.js:180`) 실측 일치.
- 정본 discussion.md 「결론」이 §4.3 의 갱신분(15분·2장·04:00·겹 명문화·파일명만·애니 유한화·#664300·--verdict-*·Linux 숨김·1000×680)을 이미 반영했음을 diff 로 확인.

## 메모
- 02 DDL 의 실제 테이블 수는 25(요청문의 26 과 다름). 추가 6개로 31.
- 01~06 본문은 고치지 않았다(각 작성자가 REVIEW 를 적용). 적용 뒤 REVIEW 끝의 grep 을 돌릴 것.