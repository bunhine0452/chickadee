---
schema_version: 1
type: chore
slug: "ten-language-curriculum-and-cs-dictionary"
status: done
difficulty: high
created_at: "2026-09-04T20:54:50+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/curriculum/README.md"
    op: create
  - path: "docs/curriculum/cs.md"
    op: create
  - path: "docs/curriculum/py.md"
    op: create
  - path: "docs/curriculum/ts.md"
    op: create
  - path: "docs/curriculum/c.md"
    op: create
  - path: "docs/curriculum/cpp.md"
    op: create
  - path: "docs/curriculum/java.md"
    op: create
  - path: "docs/curriculum/csharp.md"
    op: create
  - path: "docs/curriculum/sql.md"
    op: create
  - path: "docs/curriculum/rs.md"
    op: create
  - path: "docs/curriculum/go.md"
    op: create
  - path: "docs/curriculum/swift.md"
    op: create
related:
  - ref: "20260904/Features_to_add/1959_feature_python-bottom-eight.md"
    kind: "followup"
tags:
  - "D156"
  - "D157"
  - "커리큘럼"
  - "사전"
  - "cs-네임스페이스"
  - "병렬세션"
  - "TIOBE"
  - "mcp-tool"
---
[x] 사전을 열 언어로 넓히는 명세와 그 아래 깔 기초 CS 사전 (D156·D157)

## 동기

사전이 `ts`+`py`+`react` 뿐이라 나머지 언어 리포는 판이 0장이다. 그리고 **단계 구분이 없다** —
`essential` 불리언 하나로 「바닥이냐 아니냐」만 갈리고 그 위는 평평해서, TS 30개가 `_lang.yaml` 에
한 줄로 늘어서 있고 어디까지가 바닥인지 **주석 위치로만** 표시된다.

## 결정 둘

**D156** — TIOBE 2026-08 상위 20에서 열을 골라 언어마다 기초 8 · 중심 12~16 · 심화 6~10 으로 설계한다.
상위 10 에서 **Visual Basic**(7위)·**R**(9위)을 빼고 **Go**(14위)·**Swift**(17위)를 넣었다.
근거는 이 앱의 재료가 사용자 리포라는 것 — 사용처가 0인 개념은 카드가 안 구워지고,
**TIOBE 순위는 검색량이지 「AI 가 짜 주는 코드」의 분포가 아니다.**

**D157** — `cs/` 네임스페이스를 신설한다. `common/` 은 「어느 언어에나 이 문법이 있다」이고
`cs/` 는 「문법 아래에 이것이 깔려 있다」다. `exec/`(D151)의 선례를 따라 쿼리 없이 살고,
사용처는 **자기를 `prereq` 로 가리키는 언어 개념의 창에서 빌린다.**
C# 은 `cs` 가 아니라 `csharp` 로 간다.

## 한 언어 한 세션, 열 세션 병렬

각 편이 §1 언어 좌표 ~ §10 출처의 같은 목차를 따르고, 개념마다 **「이 언어라서 다른 것」** 한 문장을
단다(D152 가 파이썬에 깐 규칙). 산출은 `docs/curriculum/<ns>.md` 열한 장 + 색인.

| 언어 | 개념 | 0장 (≤2 / 24) | `common/` 재사용 | 측정 abi |
|---|---|---|---|---|
| Python | 34 | **24** | 22/30 (73%) | 14 ✓ |
| C | 34 | **24** | 15/30 (50%) | 15 |
| C++ | 31 | 21 | 17/30 (57%) | 14 |
| Java | 33 | **24** | 18/30 (60%) | 14 |
| C# | 34 | **24** | 27/30 (90%) | 15 |
| JS/TS | 30+23 | 21 (제안 25) | 30/30 쓰되 물려받은 것 0 | 14·14·15 ✗ |
| SQL | — | **14** | **10/30 (33%)** | 14 |
| Rust | 34 | 22 | 17/30 (57%) | 14 |
| Go | — | 22 | 18/30 (60%) | 14 |
| Swift | 34 | **25** ← 넘침 | 20/30 (67%) | 15 |

## 세션들이 찾은 것 — 배포된 코드의 결함 여섯 (전량 원본으로 재확인)

| # | 무엇 | 자리 |
|---|---|---|
| 1 | **`id = :id` 가 `binary_expression(field, ERROR, field)` 로 파싱되는데 캡처는 정상 매치되어 값 자리를 「열 이름」이라고 가르친다.** 이 리포 SQL 의 94%가 `:name` 자리표다 | tree-sitter-sequel · SQL 편 실측 |
| 2 | `grammar_abi: 15` 가 세 문법 중 하나에만 맞다 — Cargo.lock 이 고정한 실제 값은 typescript **14** · tsx **14** · javascript 15 | `dictionary/{ts,react}/_lang.yaml` |
| 3 | `arithmetic.scm` 이 `//` 를 잡는데 `rule` 은 「나누기는 늘 소수를 낸다」로 고정 — `a // b` 사용처에서 **그 자리에서 거짓인 규칙**을 읽는다 | `dictionary/py/arithmetic.{scm,yaml}` |
| 4 | `_blocks.scm` 이 `function_definition` 에 붙어 데코레이터 줄이 블록 밖 — FastAPI 라우트 줄이 T1 창에서 잘린다. `function-definition` 의 「정의한 자리에서는 돌지 않는다」도 데코레이터 앞에서 거짓 | `dictionary/py/_blocks.scm` |
| 5 | `grammarOf()` 가 확장자 표를 좁게 복사해 모르면 `typescript` 로 폴백 — **`.pyi` 가 오늘 이미 샌다**(`_lang.yaml` 은 `python: [.py, .pyi]`) | `apps/desktop/src/session-flow.ts:559` |
| 6 | `commentPrefix()` 가 파이썬 아니면 전부 `//` — SQL 은 `--` 다 | `packages/cards/src/t1-block.ts:56` |

`grammar_abi` 를 실제 문법과 대조하는 시험이 없다(`schema.ts:231` 이 「양의 정수」만 본다).
세 세션(TS·Rust·Swift)이 서로를 안 보고 같은 결론에 닿았다.

## 선결 과제 여덟 (색인 §6)

가장 큰 것은 `grammarSchema`(`schema.ts:29`)에 **`c`·`cpp`·`java`·`c_sharp` 가 없다**는 것 —
열 중 넷이 로드 단계에서 막힌다. `framework:` 필드는 **읽는 코드가 아예 없고**(`schema.ts:155·235` 선언뿐)
실제 게이트인 `detect.dependency` 는 `package.json` 만 봐서 Swift·Java·C# 에는 쓸 수 없다.
`in_error` 는 조상을 넷까지만 봐서(`query.rs:171`) 큰 복구 영역 안의 캡처가 통과한다.

## 세 가지 수확

**① D148 의 「두 번째 언어부터 싸진다」는 패러다임이 같을 때만 참이다.**
C# 90% → SQL 33% 로 세 배 가까이 벌어진다. `common/` 30개의 다수가 명령형 어휘라서 선언형인
SQL 은 물려받을 데가 없다. 그런데 SQL 이 `cs/` 로 밀어낸 것은 여섯으로 열 중 **최다**다 —
문법 층에서 끊긴 전이가 기계 층에서는 오히려 두껍다.

**② `ZERO_CHAPTER_MAX = 24` 는 두 번째 언어부터 마진이 0이다.**
넷이 정확히 24에 붙고 Swift 는 25로 넘친다. 넘치면 넷째 정렬 키(id 알파벳순)가 돌아
**이름이 프롤로그 자리를 정한다** — D147 이 상한을 8→24 로 올린 근거가 깨진다.
못 배우는 것은 아니고 프롤로그 대접을 못 받을 뿐이지만, 상한을 올릴지는 사용자 결정이다(24판 = 12일).

**③ 열 세션이 같은 기계에 여덟 가지 이름을 붙였다.**
「값이 복사되나 자리가 복사되나」가 `reference-vs-value`·`value-vs-reference`·`value-and-reference`·
`value-and-boxing` 넷으로, 「글자와 바이트」가 `text-encoding`·`character-encoding`·`unicode-text` 셋으로 갈렸다.
이름이 안 갈린 축은 `stack-and-heap` 하나뿐이다. **D157 이 「언어별로 두면 같은 개념을 열 번 배운다」고
적은 것을, 열 세션이 실제로 열 번 이름을 지어 증명했다.**

## 스스로 고친 것 둘

`cs.md` 초안에서 `cs/null-reference` 의 선행을 `pointer-indirection` 으로 걸어 뒀는데 **C 를 먼저 생각한
배치**였다 — Java·Swift·Python 사용자는 주소를 모른 채 `null` 을 만난다. `value-vs-reference` 로 고치니
깊이가 4에서 2로 내려오고 아홉 언어에서 같은 자리에 섰다.

그리고 `zero-chapter.ts:99` 의 `synthetic` 을 「사용처 없이 지어낸다」로 읽었는데 틀렸다 —
사용처는 **있는데** 미지가 많아 예고(`previewSiteId`)로 돌린다는 뜻이다. 사용처 0인 개념에 합성 판은 없다.
그래서 `cs/` 의 사용처 빌리기가 0장의 전제조건이고, D154 의 UNION 가지도 `EXISTS (… FROM card …)` 를
요구하므로 **큐는 열려 있어도 카드 생성기가 없으면 못 들어간다.**

## 검증

`docs/curriculum/` 12장(총 39.4만 자) + 등록부 2행. 날 제어문자 0(`source-bytes.test.ts` 규칙 직접 적용),
표 행 파이프 수 이상 0건, 등록부 D156·D157 열 수 5 정합.
결함 1~6 은 전부 원본 파일(`.scm`·`_lang.yaml`·`Cargo.lock`·`parser.c`·`query.rs`·`t1-block.ts`)로
직접 재확인했다. 코드는 한 줄도 안 고쳤다 — 이 판은 명세까지다.

## 남은 것

사전 YAML 실물(개념 한 장이 `py/assignment.yaml` 기준 250줄 한·영 병기라 10×30 = 300장),
`grammarSchema` 넷 추가, `grammar_abi` 를 문법별 맵으로 여는 것, 결함 1~6 수정,
그리고 `cs/` 의 카드 생성기 — 새 `card.kind` 없이 될지가 D151·D154 선을 지킬 수 있는지의 관건이다.