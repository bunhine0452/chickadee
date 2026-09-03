---
schema_version: 1
type: chore
slug: "d117-d118-locale-axis-registry"
status: done
difficulty: medium
created_at: "2026-09-04T07:53:43+09:00"
session_id: "20260904-003"
agent:
  id: "claude-code"
  version: "Opus 5 (1M)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/02-data-model-and-scheduling.md"
    op: update
  - path: "docs/03-ingest-parsing-dictionary.md"
    op: update
  - path: "docs/05-frontend.md"
    op: update
  - path: "docs/06-quality-security-release.md"
    op: update
  - path: "docs/handoff/v02.md"
    op: correct
  - path: "CLAUDE.md"
    op: update
  - path: ".oculpm/planner/chickadee-i18n.md"
    op: update
  - path: ".oculpm/planner/chickadee-repo-shelf.md"
    op: update
  - path: ".oculpm/planner/chickadee-clone-course.md"
    op: update
related:
  - ref: "20260904/Chores/0711_chore_split-v02-plan-into-four.md"
    kind: "followup"
  - ref: "20260904/Features_to_add/0700_feature_v02-feature-survey-and-plan.md"
    kind: "followup"
tags:
  - "i18n"
  - "docs"
  - "decision"
  - "locale"
  - "dictionary"
  - "mcp-tool"
---
[x] i18n P0 — 로케일 축(D117)·사전 이중 언어(D118) 등록부 행과 문서 반영

## 변경 요약

사용자가 착수 순서를 정했다 — **요청 넷 먼저**(M6 잔여는 뒤로), 사전 검수는 **용어집 먼저 확정**. 그에 따라 `chickadee-i18n` P0 을 끝냈다. 코드는 한 줄도 고치지 않았다.

### 번호가 어긋나 있었다

인계 문서가 「다음 번호는 D114」라고 적었지만 **D114~D116 은 이미 M5 가 쓴 번호**다(세션 낭독 지점 · 스티커 `<use>` · `Dee` viewBox). 인계 문서를 쓴 세션이 그 세 행이 올라오기 전 상태를 본 것이다. 넷을 통째로 밀었다.

| 결정 | 옛 번호 | 새 번호 |
|---|---|---|
| 로케일 축 | D114 | **D117** |
| 사전 이중 언어 | D117 | **D118** |
| 리포 서가 화면 | D115 | **D119** |
| 큐 밖 클론 코스 | D116 | **D120** |

이번에 쓰는 둘을 D117·D118 로 **붙여** 등록부에 구멍을 내지 않았다. 서가·코스는 각 플랜의 P0 이 올린다. 플랜 세 개의 항목 id 도 같이 밀었다(`i18n-d114*`→`i18n-d117*` 등) — 플랜 로그가 비어 있어 안전했다.

### D117 — 앱 UI 문구에 로케일 축

`ko` 가 정본, `en` 병기. `Settings.locale` · 첫 실행 0단계 · `packages/i18n` 의 `t()` 는 `@chickadee/text` 의 `render()` **위에** 올린다(새 엔진 금지). 카탈로그는 ko 가 키 집합 정본이고 en 은 `Partial`, 누락은 ko 폴백. `josa` 는 en 에서 항등. `data-locale` 은 `applyTheme`/`applyTrim` 과 같은 자리. **D61 의 「앱 UI 문구 = 한국어」를 개정한다.**

행 길이 게이트에 로케일 축을 넣었다 — `ko` 30~45, `en` 45~68(좁은 패널 22 / 33). en 숫자의 근거는 같은 `--measure` 에서 한글 1자 ≈ 라틴 1.5자 폭이라는 환산이고 통상 권장 범위(45~75) 안에 든다. D112 가 05 §9 를 이 규칙의 정본으로 지정했으므로 거기부터 고치고 06 §2 를 맞췄다.

### D118 — 사전도 이중 언어

**조사에서 정정 하나**: 인계 문서는 「사전 2.7만 자를 영문화」라고만 적었는데 `name: { ko, en }` 은 **이미 57 중 55 파일에 채워져 있다**. 비어 있는 것은 `dict.*` 산문과 문항 쪽이다.

문자열마다 `{ ko, en }` 두 벌로 열되 **스칼라를 쓰면 ko 로 읽는다** — 기존 57 파일이 손대지 않고 통과하고 en 은 채우는 대로 붙는다. 스키마 출처는 `packages/dictionary/src/schema.ts` 의 zod(D69)이고 `*_en` 접미 필드가 아니다. 원장은 `0002_name_en.sql` 의 `ALTER TABLE concept ADD COLUMN name_en TEXT` — 02 §2.1 의 「추가만」 그대로이고 `name_ko` 는 개명하지 않는다. 개념 이름 en 의 정본은 `dictionary/_glossary.en.yaml`, 사용자가 검수하는 지점은 그 파일 하나다.

### 문서 반영

- `docs/00-overview.md` §4.2.1 D117·D118 행 + 절 머리말 대역 표기 + §7-1 인계 규칙
- `docs/05-frontend.md` §2.1 `settings`·`first-run` 행, §9 행 길이 로케일 축
- `docs/06-quality-security-release.md` §2 게이트 표와 머리말(en 스모크 3화면, 시각 기준선은 ko 만)
- `docs/03-ingest-parsing-dictionary.md` §4.4 로케일 문단, §5.1 린트 항목
- `docs/02-data-model-and-scheduling.md` §2.1 적용된 마이그레이션 목록, §2.2 `concept` 주석
- `CLAUDE.md` 언어 표의 앱 문구 행 — D61 을 세션마다 강제하는 자리라 여기를 안 고치면 다음 세션이 옛 규칙을 읽는다
- `docs/handoff/v02.md` 번호 정정과 「다음 번호는 D121」

플랜 항목 둘도 결정에 맞게 제목을 고쳤다 — `i18n-dict-schema-fields`(`*_en` 필드 → `{ ko, en }` 유니온), `i18n-dict-review`(끝의 검수 1회 → 번역 **전** 용어집 확정).

## 검증

- `python3` 로 `docs/REVIEW.md` 「검증 방법」 grep 목록 전수 실행 — 새로 걸린 것 0건. 남은 3건은 `t2.commit_files`·`home.bundle_counts`·`IngestDone.captures` 를 잡는 기존 오탐이고 이번에 고친 줄이 아니다.
- `git diff --stat` — 문서 7 · 플랜 3, 소스 0. `crates/**`·`apps/**` 변경 없음.
- `bash scripts/check-rust-budget.sh` — `2300/2300`, 금칙어·SQL 리터럴·raw output·git 바이너리 전부 초록(이번 작업은 Rust 를 건드리지 않았고 예산에 여유가 없음을 재확인).