---
schema_version: 1
type: feature
slug: "zero-chapter-sheet-on-home"
status: done
difficulty: high
created_at: "2026-09-04T14:27:31+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/store-sql/statements/derive.sql"
    op: update
  - path: "packages/store-sql/statements/home.sql"
    op: update
  - path: "packages/store-sql/src/catalog.ts"
    op: update
  - path: "packages/concepts/src/ingest.ts"
    op: update
  - path: "packages/concepts/src/zero-chapter.ts"
    op: update
  - path: "packages/concepts/src/ingest.test.ts"
    op: update
  - path: "packages/concepts/src/index.ts"
    op: update
  - path: "apps/desktop/src/flow.ts"
    op: update
  - path: "apps/desktop/src/screens/home/data.ts"
    op: update
  - path: "apps/desktop/src/screens/home/HomeScreen.tsx"
    op: update
  - path: "apps/desktop/src/components/home/Sheet.tsx"
    op: update
  - path: "apps/desktop/src/components/home/SheetIndex.tsx"
    op: update
  - path: "packages/i18n/src/ko/home.ts"
    op: update
  - path: "packages/i18n/src/en/home.ts"
    op: update
  - path: "docs/02-data-model-and-scheduling.md"
    op: update
  - path: "docs/03-ingest-parsing-dictionary.md"
    op: update
  - path: "docs/05-frontend.md"
    op: update
related:
  - ref: "20260904/Features_to_add/1412_feature_zero-chapter-selection-and-decisions.md"
    kind: "followup"
tags:
  - "v04"
  - "zero-chapter"
  - "d136"
  - "mcp-tool"
---
[x] 0장 대지가 홈 색인 띠에 선다 — 대지 행·칩·도입 문단, 그리고 판번호를 먹지 않는다

## 추가 기능

앞 일지가 만든 선정 규칙을 실제 대지로 세웠다. **새 화면 0개 · Rust 0줄 · LLM 0회 · 새 산문 0편.**

## 동작 흐름

1. **대지 행** — `derive.unit_manual_upsert`(`source='manual'` · `root_path NULL` · `order_idx = -1`). 이름은 안정 키 `__zero__` 다. 대지 이름이 `(repo_id, name)` 유일 키라 로케일 문자열을 넣으면 언어를 바꿀 때마다 대지가 하나씩 늘어난다(D117·D118) — 라벨은 `t('home.zeroChapter')` 가 낸다.
2. **재인제스트에서 살아남는다** — `derive.unit_delete_missing` 에 `source <> 'manual'` 을 걸었다. 이게 없으면 다음 인제스트가 0장을 지운다.
3. **쓰기** — `writeZeroChapter(dict, repoId, mastery)`. `recountUnknown` **뒤**여야 한다(미지 수가 입력이다), `writeUnitNodes` **뒤**여야 한다(그쪽이 `unit_nodes_clear` 로 스티커를 통째로 비운다). 이미 열린 대지가 있으면 `shouldOpen` 을 건너뛰고 스티커만 다시 쓴다 — **끝나도 사라지지 않는다.**
4. **화면** — `home.units` 가 `u.source` 를 함께 낸다. `HomeSheet.zero` 가 서면 색인 띠 칩이 「0장」, 대지 머리가 도입 한 문단(`.note .sheet-lead`, `--measure` 36em), 머리 메타가 경로·파일 수 대신 「판 8장 · 끝이 있는 프롤로그」다. 다 찍으면 「언제든 다시 열 수 있습니다」로 바뀐다.

## 구현 중 발견 둘

**① 0장이 판번호를 먹었다.** `SheetIndex` 와 `HomeScreen` 이 배열 색인 + 1 을 판번호로 쓰고 있어서, 0장이 앞에 서자 첫 진짜 대지가 「2대」가 됐다. `sheetNo(sheets, i)` / `nextSheetNo(sheets)` 를 `screens/home/data.ts` 에 두고 0장을 건너뛰게 했다 — 「1대」는 언제나 첫 번째 진짜 대지다. 테스트로 못박았다.

**② `flow.ts` 가 mastery 를 빈 배열로 넘기고 있었다.** `recountUnknown(dict, repo.id, [])`. 훅이 같은 파일의 재발 이력(`identities` 를 `[]` 로 못 박아 「모든 커밋이 내 것 아님」이 됐던 09-04 08:43 건)을 띄워 줘서 확인했다. 재인제스트에서 이미 배운 개념이 전부 「모르는 것」이 되어 미지 수가 부풀고, 0장은 **그 언어를 이미 아는 사람에게도 열린다**. `loadMastery(dict)` 를 만들어 두 호출이 같은 값을 쓴다(`universal_id` 는 원장에 없어 사전에서 붙인다).

## 상한 8의 근거를 실측으로 확인

TS 사전 `essential` 22개의 선행 깊이를 재 보니 깊이 0 이 넷(`const-declaration`·`number-literal`·`string-literal`·`undefined-null`), 깊이 1 이 넷(`conditional-ternary`·`nullish-coalescing`·`property-access`·`template-literal`)으로 **정확히 8**이다. `ZERO_CHAPTER_MAX = 8` 은 이 실측이다.

부수 확인: 기존 픽스처가 심는 `ts/optional-chaining` 은 깊이 2 라 0장에 들지 않는다. 그래서 테스트에 `seedRoot` 를 따로 두어 `const MAX = 10` 을 심었다 — 방안 E 의 「내 코드에 기초 개념이 없는 게 아니라 묻혀 있다」가 그대로 픽스처가 됐다.

## 문서

D136 의 「반영」 열이 약속한 넷을 맞췄다 — 02 §6.2(0장의 정의·담기는 규칙·끝 조건, 소유 문서), 03 §6(02 를 가리키고 「사용처 없으면 안 담는다」 명시), 05 §5 표에 `.sx-zero`·`.sheet-lead` 두 행.

## 남은 것

P2 합성 예제(`t0-synthetic.ts` · `PrereqRung` 예고 · 큐 삽입 · 품질 게이트), P3 「먼저 읽기」와 경계 문구. `home.zeroPreview*` 키는 쓰는 자리와 함께 들어와야 하므로 지금은 넣지 않았다 — 카탈로그 테스트가 안 쓰는 키를 잡는다.

정본 §4 에 「0장」 한 문장을 더하는 것은 **§4.3 경유 · 사용자 확인 대기**. 구현에는 필요 없다(E-2 가 이미 허용).

## 검증

- `pnpm test:unit` — **1,795개 통과**(작업 전 1,780 → +15). 새로 붙인 것: 0장 대지 인제스트 6(열림·안 열림·두 번 안 열림·**재인제스트 생존**·스티커 수·`loadMastery`), 색인 띠 4(「0장」 표기·읽히는 이름·보통 대지는 「N대」·**판번호를 먹지 않는다**), 대지 5(머리 메타·도입 문단·완료 문구·「기능 N」 없음·보통 대지 회귀).
- `pnpm typecheck` 초록 · `pnpm lint` 초록(stylelint `no-descending-specificity` 로 `.sx-zero` 규칙 순서를 한 번 되돌렸다) · `pnpm -r build` 초록.
- `bash scripts/check-rust-budget.sh` — **2,331/2,800, 작업 전과 같다.** 약속한 「Rust 0줄」이 지켜졌다.
- `docs/REVIEW.md` 「검증 방법」 grep — 내가 고친 네 문서에서는 0건(히트 셋은 손대지 않은 01·04 의 기존 것이다).
- 아직 안 한 것: 실제 앱을 띄워 0장 칩을 눈으로 보지 않았다. 0장 판이 세션 큐에 실제로 실리는 것은 P2 뒤라야 끝까지 확인된다.