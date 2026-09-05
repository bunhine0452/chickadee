---
schema_version: 1
type: feature
slug: "course-bake-package-and-borrowing"
status: done
difficulty: high
created_at: "2026-09-05T11:51:28+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/course/package.json"
    op: create
  - path: "packages/course/tsconfig.json"
    op: create
  - path: "packages/course/src/index.ts"
    op: create
  - path: "packages/course/src/bake.ts"
    op: create
  - path: "packages/course/src/materials.ts"
    op: create
  - path: "packages/course/src/hops.ts"
    op: create
  - path: "packages/course/src/diff.ts"
    op: create
  - path: "packages/course/src/borrow.ts"
    op: create
  - path: "packages/course/src/deps.ts"
    op: create
  - path: "packages/course/src/bake.test.ts"
    op: create
  - path: "packages/course/src/materials.test.ts"
    op: create
  - path: "packages/course/src/hops.test.ts"
    op: create
  - path: "packages/course/src/diff.test.ts"
    op: create
  - path: "packages/course/src/borrow.test.ts"
    op: create
  - path: "packages/course/src/measure.test.ts"
    op: create
  - path: "packages/store-sql/statements/card.sql"
    op: update
  - path: "packages/store-sql/src/catalog.ts"
    op: update
  - path: "packages/concepts/src/index.ts"
    op: update
  - path: "eslint.config.js"
    op: update
  - path: "pnpm-lock.yaml"
    op: update
  - path: "docs/00-overview.md"
    op: update
related:
  - ref: "20260905/Features_to_add/1036_feature_method-paths-schema-dead-branches.md"
    kind: "followup"
  - ref: "20260905/Features_to_add/1026_feature_course-exercises-16-types.md"
    kind: "followup"
tags:
  - "D172"
  - "코스"
  - "course"
  - "굽기"
  - "cs"
  - "proto"
  - "MonggleMonggle"
  - "mcp-tool"
---
[x] 코스 카드를 굽는 층 `@chickadee/course` — 챕터 굽기·두 판 diff·cs/ 창 빌림 (D172)

## 추가 기능

**굽는 자리가 없었다.** 생성기·채점기(D164)와 진도(D165)가 섰는데 `card.insert_stage` 를 부르는 코드가 없고, 규약 `proto/`·기계 `cs/` 도 `makeProtoCard` 를 부르는 이가 없어 D154 의 큐 가지가 빈 채였다. 지시는 `packages/concepts/src/bake-course.ts` 였지만 **거기 둘 수 없다** — `cards` 가 `concepts` 의 `Hop` 을 import 하므로(01 §2 `cards → concepts`) 인제스트가 생성기를 부르면 순환이고, 생성기는 순수라 IPC 를 못 부른다. 그래서 **새 패키지 `@chickadee/course`** 를 `ui → course → cards | concepts` 자리에 세웠다(eslint `ALLOWED_DEPS` 에 `course` 추가, `ui` 가 import 가능).

- `bake.ts` — `bakeChapter(deps, unitId)`: statement 로 재료를 긷고(`t2.unit_files` · `path.list_by_unit`+`path.hops` · `t2.edges` · 새 `card.sites_in_files` · `block.by_file`(+`parse_snippet`·`block.ast_set` 캐시) · `review.mastery_all` · `schema.bindings/tables/columns` · 새 `card.fix_commits`+`t2.commit_files`) → 순수 `assembleStageRequest` → `buildCourseCards` → `card.insert_stage`. `ON CONFLICT DO NOTHING` 의 `changes` 로 새 판/건너뜀을 센다. `bakeCourse`(챕터 전부) · `ensureChapterBaked`(판이 없을 때만) · `bakeSiteless`(규약은 줄기 위 블록의 근거 낱말, 기계는 빌린 창 → `card.insert` track `t0`).
- `hops.ts` — `path.hops` 행에서 `MethodHop` 복원(`calledAt.path` 는 직전의 한 단계 얕은 칸), `trunk` 로 등뼈, 문항 `Hop` 의 `line` 은 **다음 칸을 부른 줄**, 같은 파일 연속은 한 칸.
- `diff.ts` — `git_diff_text` 가 더한 줄만 주므로(D98) 부모·자식 두 판을 `file_read_lines{rev}` 로 읽어 TS 에서 LCS 줄 diff(문맥 4) → `Hunk[]`. Rust 0줄.
- `materials.ts` — `origin` 의 이름 자리(매퍼 `column↔property` 가 define, DDL 열 define, 엔티티 필드·빌더 carry, getter·프런트 `.name` read)와 `contract` 의 응답 키(`*Response|Dto.java` 의 `private` 필드 ↔ 프런트 `.key`)를 글자로. 큰 파일(>800줄)은 줄기 칸 ±8 만 읽고, 읽은 줄 밖의 사용처는 버린다.
- `borrow.ts` — `lenders(dict)`: `cs/x` ← 자기를 `prereq` 로 가리키는 언어 개념 역방향 조회. `pickLender` 는 첫 노출 규칙(미지 최소 → 짧은 줄 → id). `borrowedInput` 은 `PROTO_SITE_ID` 자리표 + `siteKey: borrow:<lender>:<key>`.
- statement 둘(`card.sites_in_files` · `card.fix_commits`), `concepts/index.ts` 에 `methodPaths`·`trunk`·`buildCallGraph`·`extractSchema`·`EntrySeed` export.

## 동작 흐름

앱(A7)이 챕터를 열 때 `ensureChapterBaked({ repoId, rootPath, dict, now }, unitId)` → 판이 없으면 굽는다. 인제스트 뒤에는 `bakeCourse` + `bakeSiteless`. 화면은 `card.by_unit_stage {unitId, stageNo}` 로 읽고 채점은 A1 의 `gradeStage`, 기록은 A2 의 `recordStageResult`.

## 실측 — MonggleMonggle (A5 의 캡처 덤프 → 순수 파이프라인, `measure.test.ts`, `COURSE_DUMP`·`COURSE_ROOT` 로만 돈다)

auth 챕터(파일 24 · 줄기 6 · 간선 41 · 블록 85 · 바인딩 14 · fix 커밋 10): **hop 10 · caller 2 · origin 2 · contract 2 · cut 3 · patch-line 1 · patch-place 1 · rollback 1 · reimpl-spec 1 · reimpl-layer 1 · handoff 1**. 등뼈 예: `LandingView.vue:504 → authStore.js:64 → authService.js:21 → AuthController.java:58 → AuthService.java:78 → UserDao.java:17 → UserMapper.xml`. 규약 카드 7(jwt·hmac-signature·password-hashing·stateless-session·http-method·rest-resource·status-code). **덤프에 `_imports`·`_blocks` 캡처만 있어**(개념 쿼리 없음) 사용처가 0 이라 1단(twin)·`cs/` 는 실리포에서 못 쟀다 — sqlite 시험이 픽스처로 대신 잰다. `exec`·`reorder` 는 vitest 에 파서가 없어 0(앱은 `parse_snippet`).

## 검증

`pnpm vitest run packages/course` 31/31(diff 6 · hops 8 · materials 5 · borrow 5 · bake 7 — bake 는 진짜 sqlite 위에서 다섯 단 전부 구워지고, 두 번 구우면 0, `queue.new_candidates` 가 `proto/jwt`·`cs/floating-point` 를 집는다). `pnpm typecheck` 0 · `pnpm lint` 0 · `pnpm check:rust` 2524/2800 · `pnpm dict:lint` 15/15(래칫 blank-or-reason 65 · point-picks 59 · why-gate 65 · zero-one-liner 57) · `rows.test.ts` 36/36(표 42). `pnpm test:unit` 2227 통과 / 3 실패 — 전부 `apps/desktop/src/screens/course/**`(A7 진행 중, 내 범위 밖).

## 메모

- `proto/jwt` 의 근거 `jwt` 가 파이썬 서비스(`comprehensive_service.py:27`)에 먼저 걸렸다 — 근거 낱말이 넓다(A3 몫).
- `card.fix_commits` 는 `author_matched` 를 요구하지 않는다(팀원의 fix 도 정답지).