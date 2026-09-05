---
schema_version: 1
type: feature
slug: "course-exercises-16-types"
status: done
difficulty: high
created_at: "2026-09-05T10:26:49+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/store-sql/migrations/0008_course_kinds.sql"
    op: create
  - path: "fixtures/db/v0008.db"
    op: create
  - path: "packages/store-sql/src/types.ts"
    op: update
  - path: "packages/store-sql/src/schemas.ts"
    op: update
  - path: "packages/store-sql/src/rows.ts"
    op: update
  - path: "packages/store-sql/src/rows.test.ts"
    op: update
  - path: "packages/store-sql/statements/card.sql"
    op: update
  - path: "packages/cards/src/stage-types.ts"
    op: create
  - path: "packages/cards/src/stage-common.ts"
    op: create
  - path: "packages/cards/src/stage-choice.ts"
    op: create
  - path: "packages/cards/src/stage-trace.ts"
    op: create
  - path: "packages/cards/src/stage-edit.ts"
    op: create
  - path: "packages/cards/src/stage.ts"
    op: create
  - path: "packages/cards/src/stage.test.ts"
    op: create
  - path: "packages/cards/src/exec-facts.ts"
    op: update
  - path: "packages/cards/src/index.ts"
    op: update
  - path: "packages/grading/src/stage.ts"
    op: create
  - path: "packages/grading/src/stage.test.ts"
    op: create
  - path: "packages/grading/src/index.ts"
    op: update
  - path: "packages/i18n/src/ko/cards.ts"
    op: update
  - path: "packages/i18n/src/en/cards.ts"
    op: update
  - path: "packages/i18n/src/ko/grading.ts"
    op: update
  - path: "packages/i18n/src/en/grading.ts"
    op: update
  - path: "docs/00-overview.md"
    op: update
related:
  - ref: "20260905/Features_to_add/0858_feature_request-paths-for-tracing.md"
    kind: "followup"
  - ref: "20260905/Features_to_add/0832_feature_course-storage-and-dictionary-first-chapter.md"
    kind: "followup"
tags:
  - "D164"
  - "코스"
  - "문항"
  - "마이그레이션"
  - "cards"
  - "grading"
  - "mcp-tool"
---
[x] 코스 문항 16유형 — 다섯 단의 생성기와 채점기, 새 트랙 없이 stage_no 하나로 (D164)

## 추가 기능

`docs/program/exercises.md` §2 의 다섯 단 × 16유형을 코드로 옮겼다. 원장·생성·채점·문구 넷이다.

**원장(0008).** `card.kind` 에 `twin`·`origin`·`cut`·`reorder`·`contract` 다섯을 더하고 `card.stage_no INTEGER CHECK (1~5)` 를 뒀으며 `appeal.track` 을 `('t1','t2','t3')` 로 넓혔다. 표를 다시 만드는 길은 0005 그대로(D146). 시드 `v0008.db` 는 `v0007.db` 에 0008 만 얹어 만들었다 — 행 수 보존, `integrity_check ok`, `foreign_key_check 0`.

**결정 하나가 나머지를 정했다 — 코스 카드는 열 `track = 't3'` 다.** `t0PayloadSchema.kind` 를 넓히면 `T0Kind` 로 `Record` 를 짜고 `payload.track === 't0'` 으로 좁히는 앱 코드가 전부 깨지는데 그쪽은 병렬 세션이 쥐고 있어 못 고친다. 새 변형의 `track` 을 유니온으로 두는 것도 안 된다 — 좁히기가 두 변형을 다 남긴다. 그래서 열 `track` 의 뜻을 「어느 큐가 이 판을 내나」로 읽었다: t0·t1·t2 는 예전 일일 큐, **t3 는 코스**. 큐 SQL 을 한 줄도 안 고치고 코스 카드가 예전 큐에 안 섞인다. `payload.track` 은 화면 모양이다(2단 `hop`·`caller` 는 t2 지도, `exec` 은 t0 지목형, 나머지는 t3).

**생성 (`packages/cards/src/stage*.ts`).** `buildStageCards(req, stageNo)` 하나. 1단 `twin`(같은 개념의 다른 사용처 — 정답 하나·함정 셋, 문서의 「상위 3 + 함정 1」은 정답이 셋이라 진단을 붙일 자리가 없어 바꿨다) · 2단 `exec`(`t0-exec` 재사용, **자바 dialect 를 `exec-facts` 에 추가** — 이름은 `tree-sitter-java` 0.23.5 `node-types.json` 에서 확인) · `hop`(요청 줄기 → `path:line` 노드, 함정은 같은 파일의 다른 요청 줄, 여섯 칸 넘으면 매퍼에서 두 장) · `origin`(요청 순서에서 먼저 만나는 `define`, 초점은 화면 쪽 읽는 줄) · `caller`(불리는 수 적은 것부터, 코드 파일 먼저) · 3단 `cut`(가드 카탈로그 넷 — soft delete `AND col IS NULL`+`SET col = NOW()` · `if(...) throw` · `!= null &&` · `orElseThrow`, 정규식) · `reorder`(AstLite 선언–사용 · 재대입–읽기 · 무관 셋) · `contract`(응답 키를 읽는 첫 자리 + 이유 4지) · 4단 `patch-line`/`patch-place`/`rollback`(`fix:` 커밋 hunk 모양으로 가른다) · 5단 `reimpl-spec`/`handoff`(같은 블록, `buildSpec` 재사용)/`reimpl-layer`(이웃 칸 ±6줄이 사양, 연결 이름은 두 쪽이 같이 쓰는 식별자 + 매퍼 `id`).

**채점 (`packages/grading/src/stage.ts`).** `gradeStage(payload, answer)` 하나 → `{ ok, pct, diagnosis, okText, rule, detail }`. 선택형은 인덱스(+`contract` 의 이유), `hop` 은 `gradeFlow` 위에서 **100% 만 통과**, `caller` 는 `gradePicks` 위에서 missed·wrong 0, `patch-line` 은 `compareLine`, `patch-place` 는 새 `checkPlace`(쓰는 이름은 앞에서 만들어졌고 만드는 이름은 뒤에서 쓰인다 — 이름이 하나도 안 걸리면 원래 자리만), `rollback`·5단은 `gradeT1(stage 3)`, `reimpl-layer` 는 + `checkLinks`, `handoff` 는 채점 없이 프롬프트(파일 이름만 · 앞뒤 4줄 · 내 답 · 물음).

**문구.** `stage.*` 113 키(ko 정본 · en 병기) + `grading.stage*` 17 키. 오답 진단은 사전이 아니라 카탈로그다(`exec.*` 선례).

## 동작 흐름

앱이 `StageRequest`(파일 줄 · `requestPaths` 줄기 · 간선 · 사용처 · 블록 AstLite · 이름 자리 · 응답 키 · fix 커밋)를 조립해 `buildStageCards` → `card.insert_stage`(`track:'t3'`, `stageNo`) → 단 화면은 `card.by_unit_stage` 로 한 번에 긷고 → 답을 `gradeStage` 에 → 결과를 진도(D165)가 `stage_log` 에 적는다. `conceptsOnPath` 가 1단의 개념 목록(예전 T0 카드가 판을 댄다)을 준다.

## 검증

`pnpm -r typecheck` 무출력 · 내 파일 eslint 0 · `vitest run packages/cards/src/stage.test.ts packages/grading/src/stage.test.ts packages/i18n packages/store-sql` **122/122** (새 시험 34 — 로그인 챕터 축소 픽스처로 16유형 전부, 결정성, `attempt` 가 보기 순서만 바꿈, CHECK 목록) · `pnpm test:unit` 2157/2161 — 실패 4는 남의 것(`packages/dictionary` 둘은 A3·A4 의 진행 중 사전, 성능 예산 둘은 6세션 동시 부하 — 단독 재실행 51/51 통과).

## 메모

- 정규식 가드 카탈로그·식별자 뽑기는 글자 기준이다 — 문법을 아는 것은 `exec-facts` 뿐이라는 규칙을 지켰고, `reorder` 만 AstLite 를 본다.
- `card.get`·`card.by_hash` 에 `stage_no` 를 안 실었다(예전 호출자를 안 깨려고). `fromCardRow` 는 열이 실려 있을 때만 읽는다.
- `rows.ts` 의 `CARD_KINDS` 에 `entry`·`role` 이 빠져 있었다(D142 때 누락) — 함께 넣었다.
- 「4단 문항이 있는가」는 `card.stage_counts` 가 답한다. 4단은 `fix:` 커밋이 경로 파일을 고쳤을 때만 선다.