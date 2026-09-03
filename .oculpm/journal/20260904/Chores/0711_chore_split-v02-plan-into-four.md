---
schema_version: 1
type: chore
slug: "split-v02-plan-into-four"
status: planned
difficulty: verylow
created_at: "2026-09-04T07:11:42+09:00"
session_id: "20260904-002"
agent:
  id: "claude-code"
  version: "Opus 5 (1M)"
language: "ko"
verified_by_user: false
files_touched:
  - path: ".oculpm/planner/chickadee-i18n.md"
    op: create
  - path: ".oculpm/planner/chickadee-repo-shelf.md"
    op: create
  - path: ".oculpm/planner/chickadee-settings-gaps.md"
    op: create
  - path: ".oculpm/planner/chickadee-clone-course.md"
    op: create
  - path: ".oculpm/planner/chickadee-v02-features.md"
    op: delete
related:
  - ref: "20260904/Features_to_add/0700_feature_v02-feature-survey-and-plan.md"
    kind: "followup"
tags:
  - "planning"
  - "mcp-tool"
---
[ ] 0.2 통합 플랜을 기능별 4개로 쪼갬 — 항목마다 하위 작업까지

## 변경 요약

사용자 요청으로 `chickadee-v02-features`(6단계 32항목 한 파일)를 기능별 4개 플랜으로 나누고, 항목마다 하위 작업을 붙였다. 통합 파일은 지웠다 — 만든 지 몇 분 된 미추적 파일이고 그대로 두면 같은 작업이 두 곳에 산다.

| 플랜 | 단계 | 항목(하위 포함) | 규모 |
|---|---|---|---|
| `chickadee-i18n` | 4 | 65 | 약 13.5일 |
| `chickadee-repo-shelf` | 4 | 28 | 약 3일 |
| `chickadee-settings-gaps` | 3 | 20 | 약 2.8일 |
| `chickadee-clone-course` | 5 | 37 | 약 7.8일 |

착수 순서는 `chickadee-i18n` P1(뼈대) → `chickadee-settings-gaps` → `chickadee-repo-shelf` → `chickadee-i18n` P2·P3 → `chickadee-clone-course`. 각 플랜은 자기 결정 등록부 행을 P0 로 들고 있어 독립적으로 착수할 수 있다(i18n D114·D117 · 서가 D115 · 코스 D116).

쪼개면서 원장 제약 하나를 계획에 반영했다 — 코스 결과를 `review_log` 에 남기려면 `session_id`·`session_item_id` 가 NOT NULL 이고 원장은 `ALTER ADD` 만 허용이라 열을 풀 수 없다. 코스 실행마다 `session` 행 1개 + 조각마다 `session_item` 을 만들고, `role` 은 CHECK 목록 안의 `manual` 을 쓰며 코스 소속은 `clone_step.review_log_id` 로 가른다.

## 검증

플랜 파일 4개 생성 확인, 통합 파일 삭제 확인(`ls .oculpm/planner/`). 코드 변경 없음.