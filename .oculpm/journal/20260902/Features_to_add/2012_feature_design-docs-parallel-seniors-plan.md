---
schema_version: 1
type: feature
slug: "design-docs-parallel-seniors-plan"
status: done
difficulty: superhigh
created_at: "2026-09-02T20:12:37+09:00"
session_id: "20260902-003"
agent:
  id: "claude-code"
  version: "Fable 5.1"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/00-overview.md"
    op: create
  - path: "docs/01-architecture.md"
    op: create
  - path: "docs/02-data-model-and-scheduling.md"
    op: create
  - path: "docs/03-ingest-parsing-dictionary.md"
    op: create
  - path: "docs/04-grading-engines.md"
    op: create
  - path: "docs/05-frontend.md"
    op: create
  - path: "docs/06-quality-security-release.md"
    op: create
  - path: "docs/REVIEW.md"
    op: create
  - path: ".oculpm/planner/chickadee-build.md"
    op: create
  - path: ".oculpm/discussion/vibe-code-study-app/discussion.md"
    op: update
  - path: "design/logo/chickadee-logo-no-background.svg"
    op: create
  - path: "design/logo/README.md"
    op: update
  - path: "design/logo/export.cjs"
    op: update
related:
  - ref: "20260902/Refactors/1700_refactor_mascot-from-logo-legacy-cleanup.md"
    kind: "followup"
tags:
  - "design-docs"
  - "architecture"
  - "plan"
  - "parallel-agents"
  - "opus"
  - "review"
  - "mcp-tool"
---
[x] 설계 문서 6편(병렬 시니어 세션) + 스태프 리뷰 + 구현 플랜 chickadee-build

## 추가 기능
- `docs/01-architecture.md` … `06-quality-security-release.md`: 역할별 시니어 세션 6개가 동시에 작성(아키텍트 · 데이터/FSRS · tree-sitter/사전 · 채점 엔진 · 프런트엔드 · 품질/보안/릴리스). 정본(`discussion.md` 결론)을 전제로 타입·DDL·IPC 계약·쿼리(.scm)·YAML 예시·알고리즘·골든 케이스·체크리스트(각 14~15개, 총 87)까지 적음. 02 의 DDL 은 SQLite 에 실제 적용해 검증(최종 31 테이블·인덱스 20).
- `docs/00-overview.md`: 스태프 리뷰 세션이 6편을 대조해 상충 47건을 결정(D1~D47 등록부 — Rust↔TS 경계는 얇은 Rust 쪽으로, 03 의 Site 파생 알고리즘은 TS 로 이전 · 02 DDL 정본 · 겹 리듀서 02 채택 · appeal 통일 · 언어 개념 id 에 숙련도 + 전이 규칙 · 프롬프트 파일명만 · 기본값 15분/새 판 2장/04:00 등), 용어집(은유↔평문↔코드 이름), 마일스톤 M0~M6 에 87 항목 배치, 사용자 결정 8건(기본값 포함), 인계 규칙.
- `docs/REVIEW.md`: 문서별 수정 지시서(01:17 · 02:13 · 03:29 · 04:14 · 05:14 · 06:25) + 검증 grep 목록. 각 작성자 세션이 자기 문서에 반영.
- 플랜 `.oculpm/planner/chickadee-build.md`(plan_create): 7 phase · 87 항목, id `m<N>-<doc>-<slug>`.
- 정본 `discussion.md` 에 리뷰의 「정본 갱신 필요」 항목을 반영(겹 규칙 명문화, 프롬프트 범위, 상시 애니 유한화, 사다리 키 스코프, T1 분모·완충, 황 글자 `#664300`·`--verdict-*`, Linux 부속 기본 숨김, 최소 창) + 로그 2행 + 다음 단계(#next-plan 완료, #next-user-decisions 신설).

## 동작 흐름
새 세션은 `docs/00-overview.md` §1 의 5줄대로 시작 → 용어집·결정 등록부 → 맡은 마일스톤의 문서만 읽고 플랜 항목을 잡는다. 문서 수정은 등록부에 먼저 적고(D48~), 체크리스트 제목은 플랜이 참조하므로 불변.

## 검증
- 리뷰의 검증 grep 전부 실행: 폐기 이름은 「열린 질문 → 결정」 주석의 인용 외 0건, 확정 이름 6편 모두 검출, 체크리스트 수 14/14/15/14/15/15 = 87, 00 §5 의 87 행이 각 문서 제목과 1:1 대응(스크립트 대조).
- 1차 병렬(Fable)은 세션 토큰 한도(8pm 리셋)에 걸려 6 세션 모두 중단됨 → 사용자 지시로 Opus 5 세션 6개로 재실행(각 11~14만 토큰). 이후 병렬 세션은 기본 `opus`.

## 메모
- 사용자 결정 8건은 `docs/00` §6(서명·공증 시점, Swift/Dart 보류, `react/` 네임스페이스, 프롬프트 파일명, 포함 파일, 사전 별도 배포, ocul-pm 연동 범위, 복습 부채 모드) — 결정 없으면 기본값으로 진행.
- 목업(`design/src/ink/t0.js`)의 「다시 찍기 정답 +1」은 정본과 달라졌음 → 플랜 `m5-05-mockup-cleanup`.