---
schema_version: 1
type: feature
slug: "ten-language-courses-foundation-and-picker"
status: done
difficulty: high
created_at: "2026-09-06T00:52:41+09:00"
session_id: "20260906-001"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "aba79b97-7097-466f-8484-5b36a42424eb"
language: "ko"
verified_by_user: false
files_touched:
  - path: "crates/parse/Cargo.toml"
    op: update
  - path: "crates/parse/src/langs.rs"
    op: update
  - path: "packages/dictionary/src/schema.ts"
    op: update
  - path: "packages/course/src/parts/index.ts"
    op: create
  - path: "packages/course/src/parts/index.test.ts"
    op: create
  - path: "packages/course/src/curriculum.ts"
    op: update
  - path: "apps/desktop/src/screens/course/LangCourse.tsx"
    op: create
  - path: "apps/desktop/src/screens/course/LangPartPanel.tsx"
    op: create
  - path: "apps/desktop/src/screens/course/lang-data.ts"
    op: create
  - path: "apps/desktop/src/screens/course/CourseScreen.tsx"
    op: update
  - path: "apps/desktop/src/data/manual.ts"
    op: update
  - path: "apps/desktop/src/data/cards.ts"
    op: update
  - path: "packages/cards/src/t0-synthetic.ts"
    op: update
  - path: "packages/store-sql/src/schemas.ts"
    op: update
  - path: "packages/store-sql/src/types.ts"
    op: update
  - path: "packages/i18n/src/ko/course.ts"
    op: update
  - path: "packages/i18n/src/en/course.ts"
    op: update
  - path: "tests/gates/honesty.spec.ts"
    op: update
  - path: "docs/00-overview.md"
    op: update
related: []
tags:
  - "v11"
  - "코스"
  - "사전"
  - "파서"
  - "언어선택"
  - "D190"
  - "mcp-tool"
---
[x] 열 언어 코스 — 파서 넷 · 언어별 부 등록부 · 코스 화면의 언어 선택과 부 목차 (D190)

사용자 요청 「언어를 선택하고 그 언어의 기초부터 쭉 배우는 코스 — docs 의 열 언어 전부, 병렬 세션으로」.

## 추가 기능

조사에서 나온 것 둘이 방향을 정했다. ① 정식 코스(D177)의 `JAVA_PARTS`·`buildCurriculum`·`courseOutline` 은 **순수 함수와 시험뿐**이고 앱 화면 어디도 부르지 않았다 ② c·cpp·csharp·swift 는 파서 크레이트가 없어 사전을 써도 캡처가 0곳이다.

**기반(커밋 1f8bda6).** `tree-sitter-c` 0.24.2 · `-cpp` 0.23.4 · `-c-sharp` 0.23.5 · `-swift` 0.7.3 을 `lang-*` 피처로 링크(ABI c 15 · cpp 14 · c_sharp 15 · swift 15). `GRAMMARS` 표는 넷을 `true`, 파서 없는 이름은 `dart` 하나 — 린트 표본도 그것으로. 부 배치를 `packages/course/src/parts/<lang>.ts` 열 장 + `parts/index.ts`(`COURSE_LANGS`·`PARTS_BY_LANG`·`partsOf`·`hasParts`)로 옮기고 `JAVA_PARTS` 는 재수출. ts(21/12/8)·py(18/6)·sql(8/3)은 지금 `essential` 을 그대로 갈랐고 나머지 여섯은 빈 뼈대. 시험 하나가 열 언어 전부에 「0·1·2부 = essential 전량·같은 순서」를 대조한다.

**앱(이 커밋).** 코스 화면 목차 머리에 「언어 코스」 — 열 언어 선택지(사전 장수 · 내 파일 수 · 저작 전), 고른 언어의 부 넷이 기능 챕터 앞에 선다. 부 패널이 판마다 출처(내 코드 · 사전 예제+예고 · 「네 코드엔 없다」+사유)를 적고 「이 판 풀기」로 오늘 세션에 끼운다. 설정 키 `courseLang`(null = 리포 주 언어, 파일 수 최다). `AbsenceReason` 에 `no-files` — 리포에 그 언어의 파일이 없다는 사유는 표가 아니라 리포가 정하므로 카드 payload 에 싣고 `T0Plate` 가 payload 를 먼저 읽는다. 정직성 게이트가 사유 다섯을 센다. `makeAbsentPlate` + `pickCoursePlateNow`(자리 → 예고 자리 → 사유 순).

## 동작 흐름

코스 화면 열기 → `loadLangCourse` 가 `derive.files` 로 리포 언어를 세고 설정/주 언어를 고른다 → `partsOf(lang)` + `queue.best_site`(개념마다) + `loadMastery` → `buildCurriculum`(파일 없으면 `absenceOf` 가 `no-files`) → 부 줄 넷 → 부 패널 → 「이 판 풀기」 → `pickCoursePlateNow` → 세션 열림 → 닫히면 겹이 올라 다시 읽는다.

## 검증

typecheck 초록 · vitest 전체 2,625/2,626(1 skip) · dict-schema 재생성 · honesty·quality 게이트 8/8(chromium) · cargo test 초록. 잡은 것: `LangCourse.tsx` 와 `langcourse.ts` 가 대소문자 무시 파일시스템에서 같은 모듈로 풀려 `partId is not a function` — `lang-data.ts` 로 개명. 아직 못 본 것: 실제 앱에서 부 판을 열어 세션까지 가는 것(하네스 아님) · 리포 없는 언어에서 `no-files` 문구가 판 머리에 실제로 뜨는 것.

## 메모

열 언어 저작은 워크트리 세션 열이 병렬로 진행 중(rs·c Fable 포크, 나머지 Opus). 합류 때 ABSENCE 초안·등록부 초안·README §4 를 넣는다.