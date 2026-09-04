---
schema_version: 1
type: feature
slug: "write-chapters-during-ingest"
status: done
difficulty: medium
created_at: "2026-09-05T08:41:47+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/store-sql/statements/derive.sql"
    op: update
  - path: "packages/store-sql/src/catalog.ts"
    op: update
  - path: "packages/concepts/src/units.ts"
    op: update
  - path: "packages/concepts/src/units.test.ts"
    op: update
  - path: "packages/concepts/src/ingest.ts"
    op: update
related:
  - ref: "20260905/Features_to_add/0832_feature_course-storage-and-dictionary-first-chapter.md"
    kind: "followup"
tags:
  - "D162"
  - "코스"
  - "인제스트"
  - "proto"
  - "mcp-tool"
---
[x] 마이그레이션 0007 이 만든 표에 행을 쓰는 코드

## 추가 기능

인제스트가 `chapter` 행을 쓴다. **대지마다 한 행**이고 `origin` 이 `entry`(기능 폐포)와
`dir`(디렉터리 규칙)을 가른다 — 코스의 챕터와 막간·부록이 같은 표에 산다.

**`unit.order_idx` 가 곧 챕터 번호다.** `planUnits` 가 기능을 `buildCourse` 순서로 세우므로
새 열도 새 정렬도 없다 — 홈이 이미 `order_idx` 로 정렬한다.

**진도 열은 안 건드린다.** `chapter_upsert` 는 `origin` 과 `updated_at` 만 갱신한다 —
다시 인제스트해도 `stage_reached` 와 재검 일정이 안 지워진다. 사용자가 배운 것을 파생이
덮으면 안 된다.

## 규약 근거를 경로에서 찾는다 — 그리고 왜 그것으로 충분한가

1번 챕터를 사전이 고르려면 `proto/` 의 근거 낱말을 파일에서 찾아야 하는데, **인제스트의 TS 층에
파일 본문이 없다** — 러스트가 읽어 캡처만 넘기고 `sites_for_rank` 도 발췌를 안 준다.

그래서 **경로**에서 찾는다. 실측 리포에서 걸리는 것은 둘 — `JwtUtil.java` ·
`JwtAuthenticationFilter.java` — 이고 **본문으로 셀 때와 같은 순서**(auth 1번)가 나온다.
이름에 안 드러나는 리포에서는 아무것도 안 걸리고 규칙(새로 여는 파일 적은 순)이 정한다.
약한 신호지만 **틀린 답을 내지 않고 조용히 물러난다** — I/O 는 0이다.

## 검증

`pnpm test:unit` **180파일 / 2,062건 전량 통과**(두 번 연속, 새 시험 3 — origin 이 갈린다 ·
근거가 경로에 있는 기능이 1번 · 근거가 없으면 규칙이 정한다) · `cargo test --workspace` 19개 ok ·
`typecheck`·`lint` 무출력 · Rust 예산 2,512/2,800.

## 남은 것

- **`appeal.track` 확장** — 지금 `('t1','t2')` 라 4·5단 이의가 저장이 안 된다.
- 문항 체계 16유형 + `card.kind` 다섯 + `card.stage_no`.
- `stage_log` 에 쓰는 코드 — 단을 판정하는 코드가 아직 없다(문항이 있어야 판정이 있다).
- 화면 — 홈이 아직 「판」을 보여 준다. 코스가 보이려면 05 를 손대야 한다.