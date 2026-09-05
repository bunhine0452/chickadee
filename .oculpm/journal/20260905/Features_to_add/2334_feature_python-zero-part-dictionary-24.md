---
schema_version: 1
type: feature
slug: "python-zero-part-dictionary-24"
status: done
difficulty: superhigh
created_at: "2026-09-05T23:34:12+09:00"
session_id: "20260905-003"
agent:
  id: "claude-code"
  version: "Opus 5 (1M)"
  session: "acp-20260905-d4ae2987"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/py/_lang.yaml"
    op: update
  - path: "dictionary/py/value-bits.yaml"
    op: create
  - path: "dictionary/py/number-literal.yaml"
    op: create
  - path: "dictionary/py/integer-limit.yaml"
    op: create
  - path: "dictionary/py/float-inexact.yaml"
    op: create
  - path: "dictionary/py/integer-division.yaml"
    op: create
  - path: "dictionary/py/string-literal.yaml"
    op: create
  - path: "dictionary/py/f-string.yaml"
    op: create
  - path: "dictionary/py/text-length.yaml"
    op: create
  - path: "dictionary/py/truthiness.yaml"
    op: create
  - path: "dictionary/py/operator-precedence.yaml"
    op: create
  - path: "dictionary/py/bool-op-value.yaml"
    op: create
  - path: "dictionary/py/implicit-conversion.yaml"
    op: create
  - path: "dictionary/py/explicit-conversion.yaml"
    op: create
  - path: "dictionary/py/is-identity.yaml"
    op: create
  - path: "dictionary/py/list-literal.yaml"
    op: create
  - path: "dictionary/py/reference-binding.yaml"
    op: create
  - path: "dictionary/py/assignment.yaml"
    op: update
  - path: "fixtures/golden/py"
    op: create
  - path: "crates/parse/tests/golden.rs"
    op: update
  - path: "crates/parse/tests/support/mod.rs"
    op: update
  - path: "packages/grading/src/t1-line.ts"
    op: update
  - path: "packages/grading/src/t1-result.ts"
    op: update
  - path: "packages/grading/src/stage.ts"
    op: update
  - path: "packages/grading/src/t1.test.ts"
    op: update
  - path: "packages/course/src/bake.ts"
    op: update
  - path: "docs/curriculum/py.md"
    op: update
  - path: "docs/plan/python-axis.md"
    op: update
related: []
tags:
  - "dictionary"
  - "python"
  - "zero-part"
  - "golden"
  - "t1"
  - "D152"
  - "D187"
  - "mcp-tool"
---
[x] 파이썬 사전 8 → 24장 — 0부 「값과 식」 18 + 1부 6, 골든 123장, T1 들여쓰기 분기

## 추가 기능

파이썬 사전이 **8장 → 24장**이 됐다. 신설 열여섯(0부 열다섯 + 1부 `list-literal`)에
`.scm`·YAML·골든을 붙였고, D187 ⑰(= `py-learning.md` §11.6 ①)의 순서 diff 를 사전과 문서에
함께 적용했다.

신설 — `value-bits` · `number-literal` · `integer-limit` · `float-inexact` ·
`integer-division` · `string-literal` · `f-string` · `text-length` · `truthiness` ·
`operator-precedence` · `bool-op-value` · `implicit-conversion` · `explicit-conversion` ·
`is-identity` · `list-literal` · `reference-binding`.

`reference-binding` 은 0부 축 G 가 아니라 **1부 `list-literal` 뒤**다. 별칭은 가변 객체가
있어야 관찰되므로(`a = 1; b = a; b = 2` 로는 아무 일도 안 일어난다) `prereq: [py/list-literal]`
과 `essential` 순서 둘로 못을 박았다. 그 자리를 만들려고 `py/list-literal` 을 함께 세웠다.

## 동작 흐름

**① 쿼리를 먼저 짜고 사용자 리포로 검증했다.** `crates/parse` 를 path 의존성으로 잡은
스크래치 바이너리로 `adelie`(py 139파일)·`ECC`(63)에 직접 돌렸다. 문서의 `ast` 실측과
대조했더니 `is-identity` 283/79 · `boolean-literal` 893 · `comparison` 1,321 ·
`function-definition` 1,630 · `return-statement` 1,190 · `while-loop` 15/4 가 한 곳도 안 틀렸다.

그 과정에서 쿼리 넷을 좁혔다. ⓐ `value-bits` 에서 `&`·`|`·`^` 를 뺐다 — 153곳 중 눈으로 본
표본이 거의 전부 애너테이션의 타입 합집합(`list[str] | None`)이라 `py/arithmetic` 이
`pathlib` 에서 겪은 함정과 같은 모양이다. ⓑ `truthiness` 에서 `(call)` 조건을 뺐다 —
돌아오는 것이 목록인지 참·거짓인지 줄에 안 적혀 있다. ⓒ `reference-binding` 에서
`(subscript)` 를 뺐다 — `line[2:]` 같은 자름은 새 객체라 별칭이 아니다.
ⓓ `string-literal` 에서 `concatenated_string` 을 뺐다 — 자식이 `string` 이라 한 줄이
사용처 셋이 된다.

**② 사전 규약은 자바·TS 의 새 장을 그대로 따랐다.** `examples[].code` 꼬리 주석
`# 식 -> 값 (타입)` · `misconceptions` 산문 · `confusions` 는 conceptId[] · 구멍을 못 뚫는
열 장은 `no_hole_reason`. `universal` 은 리터럴·진릿값·텍스트 여섯만 채우고
(`common/integer-literal` · `common/float-literal` · `common/text-literal` ·
`common/string-interpolation` · `common/truthiness` · `common/list`) 나머지 열은 `null` 에
이유를 적었다.

**③ `_lang.yaml` 의 `essential` 은 24장이고 배치에 규칙이 하나 더 있다.** S5 가
`ts/_lang.yaml` 에 세운 것 — 얇은 판(두 리포 중 한쪽에서라도 100곳 미만)을 셋 이상 잇대지
않는다. 얇은 열둘을 두꺼운 판 사이에 둘씩 흩었고 셋이 붙는 자리가 없다. 24장 전부 선행 깊이
≤ 2 라 0장 후보가 24/24, 하루 두 장이면 12일이다.

**④ 골든이 처음 섰다.** `fixtures/golden/py/` 에 개념 24 × (양성 3 · 음성 2) + 함정 3.
`support/mod.rs` 의 `DIRS` 에 `py → python → .py` 행을, `golden.rs` 의 `(dir, least)` 목록에
`("py", 24)` 를 넣었다. 음성 하나(`value-bits/neg-type-union.py`)가 `str | None` 을
안 잡는지를 지킨다.

**⑤ T1 파이썬 분기 (D152 ⓑ · v06 `b-t1-indent`).** `compareLine(o, u, prot, grammar)` 가
문법을 받고, `python` 이면 ⓐ 탭 하나를 공백 넷으로 재고(다른 문법은 둘) ⓑ 깊이가 다르면
`INDENT` 사유와 함께 `differ` 로 끝난다. 다른 문법은 지금처럼 사유만 남기고 계속한다.
넘기는 자리는 `t1-result.ts`(`input.grammar`)와 `stage.ts`(`payload.grammar`)이고,
화면 거터(`evalLine`)는 인자가 선택이라 옛 동작 그대로다 — 그쪽 `.tsx` 는 이 세션의 소유가 아니다.

## 발생 원인 — `bake.test.ts` 가 빨개진 이유

`py/float-inexact`·`py/integer-division` 이 `cs/floating-point` 를 `prereq` 로 가리키자
`packages/course/src/bake.test.ts` 의 「`cs/floating-point` 는 `ts/arithmetic` 의 창을 빌려
선다」가 깨졌다. `bakeSiteless` 가 `lenders()` 의 **id 알파벳순** 목록을 `slice(0, 6)` 으로
자르는데, `cs/floating-point` 의 빌려 주는 쪽이 열이 되면서 앞의 여섯이 java·py 로만 찼다.
TS 리포에는 그 여섯의 사용처가 0행이라 창을 못 찾는다.

**이것은 파이썬 때문에 생긴 결함이 아니다.** 같은 자리에서 `cs/type` 은 py 가 들어오기
**전에** 이미 java 일곱에 밀려 TS 리포에서 못 서고 있었다. 규칙이 **리포의 언어를 안 본다**.

## 해결 방법

`bake.ts` 가 자르기 **전에** 리포에 실제로 있는 언어로 후보를 거른다. 확장자 표는
`_lang.yaml` 이 이미 들고 있으므로 새 질의가 없다. 리포의 언어가 하나도 안 걸리면 옛 동작
그대로 앞에서 자른다. `slice` 의 6 은 `LENDER_PROBES` 상수로 이름을 붙이고 이유를 적었다.
시험의 기대치는 **안 낮췄다** — TS 리포가 `ts/arithmetic` 을 빌리는 것이 그대로 참이 됐다.

## 검증

`cargo test -p chickadee-parse` 전부 초록(골든 5 · 사전 6 포함) · `pnpm lint` 초록 ·
`pnpm test:unit` 2,581 통과 / 1 실패 — 그 하나가 `DEBT_RATCHET` 이고 **일부러 안 고쳤다**
(오케스트레이터가 합류 때 옮겨 적는 숫자다. 내 개념의 부채는 0: blank-or-reason 120/120 ·
why-gate 120/120 · zero-one-liner 111/111 · point-picks 116/117 — 남은 하나는
`ts/call-expression` 으로 내 것이 아니다).
`pnpm typecheck` 는 `tests/gates/shots.spec.ts` 하나가 빨간데 그 파일과
`scripts/shoot-screens.mjs` 는 untracked 인 다른 세션 것이고, `packages/grading`·
`packages/course`·`packages/dictionary` 는 각각 직접 돌려 초록을 확인했다.

## 메모

`packages/cards/src/t0-synthetic.ts` 의 `ABSENCE` 표에 한 줄이 필요하다 —
`'py/implicit-conversion': 'idiom'`. 두 리포 202파일에서 캡처가 0곳인데, 없어서가 아니라
**정적으로 볼 수 있는 자리가 0곳**이다(양쪽 타입을 알아야 하는데 tree-sitter 도 정규식도
모른다). 그 자리를 명시 변환이 가져갔다(`py/explicit-conversion` 285곳/80파일)라 사유는
`scale` 이 아니라 `idiom` 이다. 그 파일은 이 세션의 소유가 아니라 오케스트레이터가 넣는다.