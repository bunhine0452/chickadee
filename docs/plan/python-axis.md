# 파이썬 축 — 구현 계획

작성 2026-09-05 · 세션 F2. **이 문서는 계획이지 착수가 아니다.** 결정 등록부에 행을 올리지 않았다 —
올려야 할 행의 초안은 §7 에 있다.

전제로 읽는 것: 정본 §2·§4·§5 · `docs/00-overview.md` §4.2.1 의 D152·D156·D168·D174~D180 ·
`docs/curriculum/py.md`(2026-09-04 조사, 개념 34개 설계표) · `docs/curriculum/java.md` §2(3부의 선례).

---

## §0 한 장 요약

파이썬 사전은 **8장**이다. 자바는 D177 뒤로 1·2부 29장 + `spring/` 15장 = 44장이다.
사용자 리포 셋(파이썬 218파일 · 코드 38,550줄)에 대고 재면 이렇게 나온다.

| 무엇 | 지금 | 이 계획이 끝난 뒤 |
|---|---|---|
| 사전 장 수 | 8 | 32 (1부 16 + 2부 16) + 프레임워크 |
| 코드 줄 덮음 (adelie) | **37.6 %** | 78.6 % |
| 기능 챕터가 서는 리포 | 3 중 **1** (`MonggleMonggle`) | 3 중 3 |
| 4·5단 실행 판정 | 없음 | pytest 어댑터 |

**가장 값싼 큰 승리는 프레임워크가 아니라 중심 16장이다.** 사전 8 → 24 가 adelie 의 줄 덮음을
37.6 % → 75.9 % 로 올린다(§1.2). 프레임워크 사전은 그 절반의 절반도 못 올린다 — 표본 셋에서
FastAPI 는 한 리포 16파일에만 있고 Django·Flask·Streamlit·pandas 는 **0곳**이다(§3).

**둘째로 싼 것은 진입점 씨앗이다.** `adelie`·`ECC` 는 HTTP 라우트가 **0곳**이라 오늘
`entryUnits` 가 빈 배열을 낸다 — 기능 챕터가 한 장도 안 서고 코스가 디렉터리 규칙으로 내려앉는다.
CLI 진입점을 씨앗으로 받으면 adelie 에 챕터 7개(폐포 중앙값 11파일)가 선다(§4).

**그리고 사전 8장에 실측으로 잡힌 결함이 하나 있다** — `py/arithmetic` 사용처 1,815곳 중
**933곳(51 %)이 셈이 아니다**(§1.6). 이것은 계획이 아니라 지금 있는 버그다. → **수리됐다(2026-09-05, S8)** — 다시 재니 오검출은 51 %가 아니라 83.3 %였고(`/` 1,166곳 중 1,145곳이 `pathlib` 경로 결합), 피연산자 종류를 열거하는 쿼리로 바꿔 정밀도 16.7 % → **94.9 %**(진짜 셈 12곳을 잃는 쪽을 택했다). README §6 13번.

---

## §1 실측 — 2026-09-05

방법: 파이썬 `ast` 모듈로 218파일을 전부 파싱했다(파싱 실패 0). 정규식 근사가 아니라 노드 수다.
`.venv`·`node_modules`·`__pycache__`·`build`·`dist`·`site-packages` 는 뺐다.
스크립트는 세션 scratchpad 에 있고 리포에 커밋하지 않는다 — 다시 재려면 §1.1 의 규칙만 있으면 된다.

### 1.1 표본

| 리포 | py 파일 | 코드 줄 | 무엇인가 | 매니페스트 |
|---|---|---|---|---|
| `adelie` | 139 | 27,629 | CLI 에이전트 루프. 웹 프레임워크 없음 | `requirements.txt` · `adelie/pyproject.toml` |
| `ECC` | 63 | 8,251 | LLM 추상화 라이브러리 + 스킬 스크립트 다수 | `pyproject.toml`(pytest 설정 포함) |
| `MonggleMonggle` | 16 | 2,670 | FastAPI 서비스 둘(`AI_API`·`AI_API_GEMINI`) | `requirements.txt` × 2 |

코드 줄 = 비어 있지 않고 `#` 로 시작하지 않는 줄.

### 1.2 사전 8장이 덮는 것 — 줄 기준

누적이다. 「바닥8」은 지금 있는 8장, 그 뒤는 `docs/curriculum/py.md` 가 설계만 해 둔 것들이다.

| 리포 | 코드 줄 | 바닥 8 (지금) | +중심 16 (24장) | +심화 10 (34장) | +확장 (44장) |
|---|---|---|---|---|---|
| `adelie` | 27,629 | **37.6 %** | 75.9 % | 78.6 % | 78.8 % |
| `ECC` | 8,251 | **42.0 %** | 84.0 % | 86.5 % | 86.7 % |
| `MonggleMonggle` | 2,670 | **24.5 %** | 70.7 % | 76.7 % | 78.1 % |

읽는 법 셋.

**① 중심 16 이 덮음을 두 배로 만든다.** 8 → 24 장에서 adelie 가 +38.3 %p 다. 34 → 44 는 +0.2 %p 다.
저작 비용은 개념 한 장에 비례하는데 수확은 이렇게 앞쪽에 쏠려 있다. **순서가 이 표에 적혀 있다.**

**② 남는 21 %는 사전으로 안 줄어든다.** 닫는 괄호·`else:`·문자열 이어 붙이기·데코레이터 인자 줄 같은
「개념 노드가 안 앉는 줄」이다. TS 판의 12.5 %(D143 실측)보다 크고, 파이썬이 4.0 % 였다는 D143 의 수치와
다른 것은 그쪽이 「닫힘만 있는 줄」만 셌기 때문이다.

**③ 바닥 8 로도 카드가 한 장도 안 나오는 파일이 218 중 14개다** (adelie 5 · ECC 5 · Monggle 4).
전부 `__init__.py` 와 상수 모듈이다. 큰 문제는 아니다.

### 1.3 바닥 여덟 — 지금 있는 8장의 사용처

「곳」은 AST 노드 수, 「파일」은 세 리포 파일 수의 합(최대 218).

| id | adelie | ECC | Monggle | 합 곳 | 파일 |
|---|---|---|---|---|---|
| `py/assignment` | 4,161 | 1,449 | 323 | 5,933 | 198 |
| `py/if-statement` | 1,670 | 512 | 99 | 2,281 | 132 |
| `py/function-definition` | 1,630 | 524 | 87 | 2,241 | 193 |
| `py/comparison` | 1,321 | 483 | 24 | 1,828 | 165 |
| `py/arithmetic` | 1,341 | 423 | 51 | 1,815 | 161 |
| `py/return-statement` | 1,190 | 335 | 82 | 1,607 | 162 |
| `py/boolean-literal` | 893 | 306 | 78 | 1,277 | 163 |
| **`py/while-loop`** | **15** | **4** | **2** | **21** | **16** |

`while` 이 파이썬 사전의 여덟 중 하나인데 218파일에 21곳이다. 뒤에 나올 `for-in`(605곳)의 3.5 %다.
D152 가 TS 의 바닥 여덟을 그대로 옮긴 자리이고, **파이썬에서 반복의 자리는 `for-in` 과 컴프리헨션이
가져갔다.** 자바에서 D177 이 「`for (;;)` 0곳, 스트림이 다 가져갔다」로 만난 것과 같은 모양이다.
`while` 을 빼자는 것이 아니라(진짜 무한 루프의 자리다) **`for-in` 이 없는 것이 사고**라는 뜻이다.

### 1.4 안 덮이는 것 ① — 중심 16 (`py.md` §3 설계, 사전 0장)

| id | adelie | ECC | Monggle | 합 곳 | 파일 |
|---|---|---|---|---|---|
| `py/string-literal` | 15,318 | 5,278 | 1,485 | **22,081** | 208 |
| `py/attribute-access` | 9,959 | 3,497 | 1,039 | **14,495** | 189 |
| `py/call-expression` | 9,350 | 3,548 | 1,176 | **14,074** | 195 |
| `py/number-literal` | 2,493 | 850 | 213 | 3,556 | 180 |
| `py/import` | 1,730 | 312 | 143 | 2,185 | 201 |
| `py/f-string` | 1,081 | 395 | 327 | 1,803 | 119 |
| `py/index-access` | 1,103 | 508 | 107 | 1,718 | 153 |
| `py/dict-literal` | 1,001 | 323 | 70 | 1,394 | 152 |
| `py/truthiness` | 989 | 279 | 64 | 1,332 | 115 |
| `py/list-literal` | 949 | 278 | 36 | 1,263 | 171 |
| `py/none-value` | 788 | 329 | 63 | 1,180 | 149 |
| `py/for-in` | 451 | 139 | 15 | 605 | 112 |
| `py/list-append` | 376 | 157 | 9 | 542 | 86 |
| `py/is-identity` | 283 | 79 | 6 | 368 | 92 |
| `py/list-comprehension` | 107 | 66 | 8 | 181 | 72 |
| `py/tuple-unpacking` | 45 | 24 | 6 | 75 | 28 |

열여섯 중 **열넷이 지금 있는 8장의 최댓값(`assignment` 5,933)과 같은 자릿수이거나 그 이상**이다.
문자열 리터럴 22,081곳이 개념 하나도 없이 있다는 것이 이 표의 요지다.

### 1.5 안 덮이는 것 ② — 심화 (`py.md` §4 설계, 사전 0장)

| id | adelie | ECC | Monggle | 합 곳 | 파일 |
|---|---|---|---|---|---|
| `py/type-hint` | 1,923 | 654 | 349 | **2,926** | 138 |
| `py/try-except` | 367 | 76 | 77 | 520 | 111 |
| `py/class-definition` | 291 | 76 | 28 | 395 | 123 |
| `py/with-statement` | 147 | 57 | 10 | 214 | 58 |
| `py/default-argument` | 128 | 50 | 26 | 204 | 93 |
| `py/decorator` | 138 | 45 | 10 | 193 | 65 |
| `py/lambda` | 54 | 25 | 8 | 87 | 38 |
| `py/async-await` | 34 | 7 | 24 | 65 | 12 |
| `py/args-kwargs` (`**`) | 11 | 21 | 0 | 32 | 15 |
| `py/args-kwargs` (`*`) | 9 | 3 | 0 | 12 | 7 |
| `py/generator-yield` | 5 | 3 | 2 | 10 | 10 |

**`type-hint` 이 심화 열 중 첫째이고 사전 8장 전체보다 흔하다.** 세 리포 다 타입 힌트를 쓴다
(파일 138/218 = 63 %). `py.md` §4 가 이것을 「심화」로 둔 것은 실측 전 판단이었고, 표에 따르면
2부 앞쪽이 맞다.

반대로 `generator-yield` 10곳 · `args-kwargs` 44곳은 심화가 맞다.

### 1.6 이 리포엔 0곳 — 정식 코스가 필요한 근거

D177 이 자바에서 쓴 방법 그대로다. 세 리포 218파일에 대고 셌다.

| 문법 | 곳 |
|---|---|
| 왈러스 `:=` | **0** |
| `match` 문 | **0** |
| 호출 자리 언패킹 `f(*xs)` · `Starred` | **0** |
| `async for` · `async with` | **0** |
| `yield from` | **0** |
| `for … else` | **0** |
| `try … else` | 1 |
| `nonlocal` | 1 |
| 상대 import | 1 |
| 연쇄 비교 `a < b < c` | 6 |
| `except:` 맨몸 | 6 |
| `{**a, "k": v}` | 6 |
| `set` 컴프리헨션 | 19 |
| `raise … from` | 26 |
| 집합 리터럴 `{1, 2}` | 48 |

읽는 법: **「내 코드에서만 뽑는다」로는 파이썬의 절반을 영영 못 가르친다.** 집합(48곳/23파일)은
정본 §4 가 2부에 명시한 개념인데 이 규모면 사용처만으로는 카드가 안 선다. 왈러스·`match`·`async for` 는
0곳이라 아예 못 가르친다. 이것이 D177 이 자바에서 세운 것과 같은 근거다.

반대 방향의 0도 있다 — **`for (;;)` 에 해당하는 파이썬 구문(`while i < n:` 로 인덱스를 굴리는 반복)이
사실상 없다.** `while` 21곳 중 조건이 비교인 것은 절반 아래다.

### 1.7 시스템 쿼리가 잡는 것

`dictionary/py/_blocks.scm`(4쿼리) · `_imports.scm`(9쿼리)을 읽고 대조했다.

**`_blocks.scm`** — `function_definition` · `class_definition` 과 그 `decorated_definition` 판 넷.
`py.md` §2 ⓔ·§8 ③ 이 지적한 「데코레이터가 창 밖으로 잘린다」는 **이미 고쳐져 있다**
(2026-09-04 일지 `fix-silent-dictionary-defects`). 쿼리 주석이 그 이유를 적고 있다.

**`_imports.scm`** — import 3형(`from`·`static`×2) · 라우트 5형(`route-get`~`route-delete`) ·
호출 2형(`call`·`call-self`). D168 이 만든 FastAPI 라우트 색인이 **이미 있다.**

**결함 하나 — `py/arithmetic` 사용처의 절반이 셈이 아니다.**

`arithmetic.scm` 이 `binary_operator` 를 잡는데 tree-sitter 는 타입을 모른다.
`py.md` §2 ⓑ 가 「`"a" + "b"` 와 `[0] * n` 이 섞인다」로 짐작한 자리인데, 실측은 그보다 크다.

| 연산자 | 곳 | 실제로 무엇인가 |
|---|---|---|
| `/` | **1,166** | 그중 **770곳(66 %)이 `pathlib.Path` 경로 결합** — `self._dir / f"{id}.json"` |
| `+` | 228 | |
| `\|` | **169** | 그중 **163곳(96 %)이 애너테이션 안의 타입 합집합** — `str \| None` |
| `*` | 148 | |
| `-` | 73 | |
| `//` | 17 | 개념의 `rule`(「나누기는 늘 소수를 낸다」)이 여기서 거짓 |
| `%` · `&` · `**` | 14 | |

**1,815곳 중 933곳(51 %)이 셈이 아니다.** 그 자리에서 카드가 나오면 학습자는 「나누기가 딱 떨어져도
소수를 낸다」를 읽으면서 `Path / "config.json"` 을 본다. `pathlib` 은 세 리포에서 96파일이 쓴다 —
드문 우연이 아니라 요즘 파이썬의 표준 관용구다.

고치는 길 셋. ⓐ 애너테이션 안(`type:`·`return_type`·`parameters` 아래)을 제외 — `|` 163곳이 빠진다.
ⓑ `/` 의 왼쪽이 `Path(...)`·`.parent`·`.resolve()` 로 끝나는 자리를 `#match?` 로 제외 — 근사이고
전부는 못 잡는다. ⓒ `rule` 을 `form` 별로 가른다 — `py.md` §2 ⓑ 가 제안한 것이고 ⓐ·ⓑ 와 겹치지 않는다.
**ⓐ 는 순수 데이터 변경이라 `dictionary/py/arithmetic.scm` 한 파일이다.**

---

## §2 3부 커리큘럼

정본 §4 대로 부 셋이고, 교재가 부마다 다르다. 자바(D177 · `java.md` §2)의 형태를 그대로 쓴다.

| 부 | 교재 | 담기는 것 | 장 |
|---|---|---|---|
| **1부 바닥** | 합성 예제 | 값 넷 · 이름 · 셈 · 견줌 · 조건 · 반복 · 목록 · 함수 · 파일 나누기 | **16** |
| **2부 자료구조와 객체** | 합성 + 내 코드 | 딕트·집합·컴프리헨션·클래스·예외·컨텍스트 매니저·데코레이터·타입 힌트 | **16** |
| **3부 프레임워크** | 내 코드 중심 | §3 이 정한다 | 10~12 |

**1부가 자바(13)보다 큰 이유**: 파이썬에는 타입 선언문이 없어서 「타입」을 리터럴이 진다.
자바가 `variable-declaration` 한 장으로 배우는 것을 파이썬은 `number-literal`·`string-literal`·
`boolean-literal`·`none-value` 넷으로 나눠 배운다.

### 2.1 1부 바닥 — 16장

`✓` = 사전에 있음(8장). 나머지 8장이 새로 저작할 것이다. 「곳」은 §1 의 세 리포 합.

| # | id | 이름 ko / en | 선행 | `cs/` | 곳 | 상태 |
|---|---|---|---|---|---|---|
| 1 | `py/assignment` | 이름에 값 넣기 / Assignment | — | `scope-and-lifetime` · `value-vs-reference` | 5,933 | ✓ |
| 2 | `py/number-literal` | 숫자 값 / Number value | — | `floating-point` · `integer-overflow` | 3,556 | 신규 |
| 3 | `py/string-literal` | 글자 값 / Text literal | — | `text-encoding` | 22,081 | 신규 |
| 4 | `py/boolean-literal` | 참·거짓 값 / Boolean literal | — | `type` | 1,277 | ✓ |
| 5 | `py/none-value` | 없음이라는 값 / None | 1 | `null-reference` · `three-valued-logic` | 1,180 | 신규 |
| 6 | `py/arithmetic` | 셈하기 / Arithmetic | 2 | `floating-point` | 1,815 | ✓ (§1.7 결함) |
| 7 | `py/comparison` | 견주기 / Comparison | 4 | `identity-vs-equality` | 1,828 | ✓ |
| 8 | `py/truthiness` | 값 자체로 판단하기 / Truthiness | 4, 9 | `three-valued-logic` | 1,332 | 신규 |
| 9 | `py/if-statement` | if 문 / if statement | — | `declarative-vs-imperative` | 2,281 | ✓ |
| 10 | `py/list-literal` | 순서 있는 목록 / List literal | — | `contiguous-vs-linked` · `set-vs-sequence` | 1,263 | 신규 |
| 11 | `py/for-in` | 하나씩 훑기 / for-in | 10, 1 | `eager-vs-lazy` | 605 | 신규 |
| 12 | `py/while-loop` | while 문 / while loop | 7 | `invariant` | 21 | ✓ |
| 13 | `py/function-definition` | 함수 정의 / Function definition | — | `call-stack` · `scope-and-lifetime` | 2,241 | ✓ |
| 14 | `py/call-expression` | 함수 부르기 / Calling | 13 | `call-stack` | 14,074 | 신규 |
| 15 | `py/return-statement` | 값 돌려주기 / return statement | 13 | `call-stack` | 1,607 | ✓ |
| 16 | `py/import` | 다른 파일 것 가져오기 / import | 14 | `linking` · `compile-and-run` | 2,185 | 신규 |

선행 깊이는 최대 2 다(`truthiness` ← `if-statement`). D147 의 0장 상한 24판 · 깊이 ≤ 2 를 지킨다.

**1부에서 뺀 것과 이유** — `attribute-access`(14,495곳)는 1부에 넣고 싶을 만큼 흔하지만 `.` 이
무엇을 꺼내는지는 클래스를 봐야 뜻이 서므로 2부다. `f-string` 은 `string-literal` 을 배운 다음이라
2부 첫머리다.

### 2.2 2부 자료구조와 객체 — 16장

정본 §4 가 「리스트·딕트·집합·컴프리헨션·클래스·예외·컨텍스트 매니저·데코레이터·타입 힌트」를
명시했다. 리스트는 1부로 올렸고(반복의 재료라 먼저 필요하다) 나머지가 여기 있다.

| # | id | 이름 ko / en | 선행 | `cs/` | 곳 | 파일 |
|---|---|---|---|---|---|---|
| 17 | `py/attribute-access` | 안의 이름 꺼내기 / Attribute access | 1 | `pointer-indirection` | 14,495 | 189 |
| 18 | `py/f-string` | 문장에 값 끼워 넣기 / f-string | 3, 1 | `text-encoding` | 1,803 | 119 |
| 19 | `py/dict-literal` | 키로 담기 / Dict literal | 3, 10 | `hash-table` | 1,394 | 152 |
| 20 | `py/index-access` | 대괄호로 꺼내기 / Subscript | 10, 19 | `bounds` · `complexity` | 1,718 | 153 |
| 21 | `py/set-and-membership` | 집합과 들었는지 보기 / Set and `in` | 19 | `set-vs-sequence` · `hash-table` | 913 | 143 |
| 22 | `py/tuple-unpacking` | 한 번에 풀어 담기 / Unpacking | 1, 10 | `aliasing` | 75 | 28 |
| 23 | `py/list-append` | 있던 목록에 직접 더하기 / append | 10, 17 | `aliasing` · `immutability` | 542 | 86 |
| 24 | `py/list-comprehension` | 항목마다 바꿔 새로 만들기 / Comprehension | 11, 10 | `declarative-vs-imperative` | 181 | 72 |
| 25 | `py/is-identity` | 같은 것인지 견주기 / Identity | 5, 7 | `identity-vs-equality` · `memory-address` | 368 | 92 |
| 26 | `py/type-hint` | 종류 적어 두기 / Type hint | 13, 2 | `static-vs-dynamic-typing` · `erasure-and-reification` | 2,926 | 138 |
| 27 | `py/class-definition` | 틀 만들고 자기 자신 받기 / Class + self | 13, 17 | `abstraction` · `state` | 395 | 123 |
| 28 | `py/default-argument` | 안 넘기면 쓸 값 / Default argument | 13, 5 | `aliasing` · `scope-and-lifetime` | 204 | 93 |
| 29 | `py/try-except` | 터진 것을 받아 잇기 / try-except | 14, 9 | `error-vs-bug` · `call-stack` | 520 | 111 |
| 30 | `py/with-statement` | 다 쓰면 알아서 닫기 / with | 14, 29 | `scope-and-lifetime` | 214 | 58 |
| 31 | `py/lambda` | 이름 없는 함수 / lambda | 13, 14 | `closure-capture` | 87 | 38 |
| 32 | `py/decorator` | 함수를 감싸 바꾸기 / Decorator | 31, 14 | `dynamic-dispatch` · `closure-capture` | 193 | 65 |

`py/set-and-membership` 은 `py.md` §3 에 없던 것이고 실측으로 세웠다 — 집합 리터럴 48곳은 혼자
서기에 얇지만 `in`/`not in` 865곳(137파일)과 묶으면 두껍다. 그리고 「목록에서 `in` 은 훑고
딕트·집합에서는 안 훑는다」가 이 개념의 몸이다(`cs/complexity` · `cs/hash-table` 로 가는 간선).

**부 배치의 규칙 셋은 자바와 같다** (D177): ① 개념마다 내 코드의 자리를 짚고 없으면 사유를 댄다
(`framework`·`library`·`scale`·`idiom` 넷 — `packages/cards/src/t0-synthetic.ts` 의 `AbsenceReason`)
② 3부는 내 코드가 먼저 ③ 순서는 위상 정렬.

### 2.3 심화 — 부 밖에 둘 것

`essential` 에 넣지 않고 사용처가 있을 때만 낸다. `py.md` §5 의 「`essential` 34 는 깨진다」가
이유다 — 0장 후보가 30/24 가 되어 상한이 여섯을 자르고, 무엇이 잘릴지가 리포마다 달라진다.

| id | 곳 | 왜 심화인가 |
|---|---|---|
| `py/async-await` | 65 / 12파일 | 세 리포 다 쓰지만 한 리포에 한두 파일이다 |
| `py/generator-yield` | 10 / 10파일 | 낱말 하나가 함수 종류를 바꾸는 자리인데 사용처가 열이다 |
| `py/args-kwargs` | 44 / 20파일 | |
| `py/conditional-expression` | 214 / 73파일 | `a if c else b`. `py.md` §6 의 확장 1순위이고 실측이 그것을 지지한다 |
| `py/augmented-assign` | 268 / 52파일 | `+=`. `py.md` §2 ⓐ 가 남긴 자리 — `assignment.scm` 이 못 보는 노드다 |
| `py/slicing` | 263 / 64파일 | `xs[1:]`. `index-access` 와 노드가 같아 갈라야 한다 |

### 2.4 `common/` 과 `cs/`

`py.md` §6 이 22/30 재사용 · 신규 10을 이미 셌다. 이 계획은 거기에 둘을 더한다 —
`common/set-membership`(TS `Set.has` · Go `_, ok := m[k]` · Rust `HashSet::contains` · Java `Set.contains`)
과 `common/index-access`(이미 §6 신규 목록에 있다).

`cs/` 는 **한 장도 새로 만들지 않는다.** 위 표의 `cs/` 열은 전부 지금 있는 44장 안이다
(`hash-table`·`bounds`·`aliasing`·`closure-capture`·`three-valued-logic`·`set-vs-sequence` 포함).
`py.md` §7 이 신규 10장을 제안했는데 그중 일곱은 이름만 다르고 같은 것이 이미 있다 —
`cs/reference-vs-value` = `cs/value-vs-reference`, `cs/object-identity` = `cs/identity-vs-equality`,
`cs/float-representation` = `cs/floating-point`, `cs/name-scope` = `cs/scope-and-lifetime`,
`cs/complexity-order` = `cs/complexity`, `cs/eager-vs-lazy` · `cs/text-encoding` 은 이름까지 같다.
**남는 것은 `cs/integer-representation` 하나이고 그것도 `cs/integer-overflow` 로 충분하다.**

---

## §3 프레임워크 축 — 파이썬의 「스프링 자리」

### 3.1 실측 — 무엇을 실제로 쓰나

`spring/` 15장의 선례를 그대로 쓰려면 먼저 무엇이 그 자리인지 재야 한다. 근거 낱말을 세었다
(`spring/` 이 `evidence` 로 쓰는 방식과 같다).

| 프레임워크 | adelie 곳/파일 | ECC | Monggle | 판정 |
|---|---|---|---|---|
| **Django** | 1/1 | 2/1 | 0/0 | **없다** (문자열 언급뿐) |
| **Flask** | 0/0 | 0/0 | 0/0 | **없다** |
| **Streamlit** | 0/0 | 0/0 | 0/0 | **없다** |
| **SQLAlchemy** | 1/1 | 0/0 | 0/0 | **없다** |
| **pandas · numpy** | 0/0 | 0/0 | 0/0 | **없다** |
| **FastAPI** | 1/1 | 0/0 | **54/10** | 한 리포에만 |
| **pydantic** | 0/0 | 1/1 | **80/4** | 한 리포에만 (FastAPI 와 붙어 온다) |
| `dataclasses` | 54/21 | 23/9 | 2/2 | **셋 다** |
| `enum` | 43/17 | 5/2 | 0/0 | 둘 |
| `abc` · `Protocol` | 10/3 | 6/2 | 0/0 | 둘 |
| `asyncio` | 98/7 | 22/2 | 65/8 | **셋 다** |
| `pathlib` | 94/68 | 45/18 | 20/10 | **셋 다** (96파일) |
| `argparse` | 52/1 | 36/3 | — | 둘 |
| **pytest** (`fixture`·`monkeypatch`·`raises`) | 341/28 | 163/14 | 0/0 | 둘 · 989 테스트 함수 |

`click` · `typer` 는 0곳이다.

### 3.2 결론 — 파이썬에 「스프링 자리」는 하나가 아니다

자바에서 스프링이 그 자리였던 이유는 **표본 리포의 자바 99장이 전부 스프링 위에 있었기 때문**이다
(D176: `@Transactional` 13파일 · `@RequiredArgsConstructor` 29파일). 파이썬은 다르다 —
표본 218파일 중 FastAPI 가 닿는 것은 **10파일(4.6 %)** 이다.

그래서 3부를 둘로 나눈다.

**`pyweb/` — FastAPI 열 장 (감지되는 리포에서만).** `MonggleMonggle` 에서 선다.

| id 초안 | 무엇 | 근거 낱말 | Monggle 곳 |
|---|---|---|---|
| `pyweb/app-and-router` | `FastAPI()` 하나가 앱이고 `APIRouter` 가 접두를 나눈다 | `FastAPI(` · `APIRouter(` · `include_router` | 12 |
| `pyweb/route-decorator` | `@app.post("/x")` 가 **정의 시점에** 함수를 표에 꽂는다 | `@app.` · `@router.` | 8 |
| `pyweb/path-and-query-param` | 경로의 `{id}` 가 매개변수 이름으로 들어온다 | `{` in path · `Query(` · `Path(` | — |
| `pyweb/request-body-model` | 본문이 `BaseModel` 로 들어오고 **타입 힌트가 검사한다** | `BaseModel` | 22 |
| `pyweb/validation-error` | 검사가 터지면 422 가 자동으로 나간다 | `ValidationError` · `422` | — |
| `pyweb/dependency-injection` | `Depends(f)` 가 요청마다 `f` 를 부른다 | `Depends(` | — |
| `pyweb/http-exception` | `raise HTTPException(404)` 가 상태 코드가 된다 | `HTTPException` | 4 |
| `pyweb/async-endpoint` | `async def` 라우트와 `def` 라우트가 다른 자리에서 돈다 | `async def` + 데코레이터 | 8 |
| `pyweb/response-model` | 반환 힌트가 나가는 모양을 자른다 | `response_model` | — |
| `pyweb/lifespan-and-startup` | 앱이 뜰 때 한 번 도는 자리 | `lifespan` · `asynccontextmanager` | 2 |

「Monggle 곳」의 빈칸은 **못 쟀다** — 근거 낱말 목록을 확정하지 않았고, 열 장 중 여섯은 표본 한 리포로는
자리도 사유도 못 댈 수 있다. `spring/bean-lifecycle` 이 `MonggleMonggle` 에서 판이 안 선 것과
같은 위험이다(`java.md` §2). **착수 전에 근거 낱말을 확정하고 다시 세어야 한다.**

**`pyapp/` — 파이썬 애플리케이션 골격 열두 장 (모든 파이썬 리포).** 실측이 가리키는 진짜 3부다.
「파이썬을 쓰는 사람」과 「파이썬으로 앱을 만드는 사람」을 가르는 자리이고, 세 리포 전부에서 선다.

| id 초안 | 무엇 | 세 리포 근거 |
|---|---|---|
| `pyapp/package-and-init` | 디렉터리가 `__init__.py` 로 패키지가 된다. import 가 그 파일을 **실행한다** | `__init__.py` 다수 |
| `pyapp/module-vs-script` | `if __name__ == "__main__":` — 같은 파일이 부를 때와 실행할 때 다르게 돈다 | 17곳/17파일 |
| `pyapp/entry-point` | `[project.scripts]` 가 명령 이름을 함수에 붙인다 | adelie · ECC 매니페스트 |
| `pyapp/virtualenv` | 인터프리터마다 패키지가 다르다. `.venv` 가 그 경계다 | `adelie/.venv` 실물 |
| `pyapp/dependency-manifest` | `pyproject.toml` 과 `requirements.txt` 가 같은 일을 다르게 적는다 | 6개 매니페스트 |
| `pyapp/cli-subcommand` | `add_parser("run")` 하나가 명령 하나 | adelie 22곳 |
| `pyapp/config-and-env` | `.env` 와 `os.environ` — 코드 밖에 두는 값 | `dotenv` 세 리포 |
| `pyapp/logging` | `print` 와 로거는 다른 것이다 | `logging` 15곳 |
| `pyapp/dataclass` | `@dataclass` 가 `__init__`·`__repr__`·`__eq__` 를 만들어 준다 | 53곳/32파일 |
| `pyapp/enum` | 값 목록을 타입으로 못 박는다 | 48곳/19파일 |
| `pyapp/abc-and-protocol` | 「이 모양이면 된다」를 코드로 적는 두 길 | 16곳/5파일 |
| `pyapp/test-fixture` | `@pytest.fixture` 가 준비를 함수 밖으로 뺀다 | 39곳/29파일 |

**어느 쪽을 먼저 만드나는 사용자 결정이다** (§7 결정 초안 ②). 실측은 `pyapp/` 을 가리킨다 —
세 리포 전부에서 서고, `pyapp/virtualenv` 와 `pyapp/test-fixture` 가 §5 의 러너와 같은 재료를 쓴다.
`pyweb/` 은 자바-스프링과 대칭이 예뻐서 먼저 하고 싶어지는 쪽인데 표본에서 10파일이다.

### 3.3 감지 — 이미 열려 있다

`packages/dictionary/src/load.ts:159` 의 `detected()` 가 두 모양을 받는다.

```
{ dependency: "…" }                          // package.json 의 의존성 이름 (react/, D59)
{ manifest: ["build.gradle", …], contains }  // 매니페스트 원문에 그 글자가 보이는가 (spring/, D176)
```

파이썬은 뒤쪽을 그대로 쓴다. **코드 0줄이다.**

```yaml
# dictionary/pyweb/_lang.yaml
framework: fastapi
detect: { manifest: [pyproject.toml, requirements.txt], contains: fastapi }
```

```yaml
# dictionary/pyapp/_lang.yaml — 매니페스트가 있으면 파이썬 프로젝트다
framework: python-app
detect: { manifest: [pyproject.toml, requirements.txt, setup.py, Pipfile], contains: "" }
```

`contains: ""` 는 「파일이 있기만 하면」이다. `String.includes('')` 가 참이라 지금 코드로 그대로 돈다.
**다만 이것은 스키마가 의도한 뜻이 아니다** — 빈 문자열을 허용할지, `{ manifest: [...] }` 만 있는
셋째 모양을 여는지는 `packages/dictionary/src/schema.ts` 쪽 결정이고 이 계획의 범위 밖이다.
schema 를 안 열면 `contains: python` 같은 약한 글자를 쓰게 되고 그건 거짓 음성이 난다.

호출부가 `manifests` 에 무엇을 넣는지도 확인해야 한다 — 지금 `LoadOptions.manifests` 는
파일명 → 원문 표이고, 인제스트가 `build.gradle`·`pom.xml`·`package.json` 을 넣는지
`pyproject.toml` 도 넣는지는 **못 쟀다**(호출부를 안 읽었다. `packages/**` 는 이 세션의 범위 밖이다).

---

## §4 라우트 간선과 기능 폐포

### 4.1 지금 상태 — 파이썬 리포 셋 중 둘이 챕터 0개

`_imports.scm` 의 `route-*` 다섯이 잡는 것을 실측했다(scm 과 같은 규격 — `@<이름>.<동사>("문자열")`).

| 리포 | HTTP 라우트 | 라우트 파일 | `entryUnits` 가 내는 것 |
|---|---|---|---|
| `adelie` | **0** | 0 | **`[]`** |
| `ECC` | **0** | 0 | **`[]`** |
| `MonggleMonggle` | 8 (`POST` 8) | 4 | 4개 후보 |

`entryUnits`(`packages/concepts/src/units.ts:148`)는 `kind === 'http'` 엣지의 `from` 과
`EntrySeed`(= `entry-scheduled` form 이 있는 파일) 둘만 후보로 삼는다. 파이썬에는 `@Scheduled` 가
없으므로 씨앗도 0이다. **그래서 `adelie`·`ECC` 에서 기능 챕터가 한 장도 안 서고 `planUnits` 가
`assignUnits`(디렉터리 규칙)로 내려앉는다.** 정본 §5 의 「A 로 내려앉는다」가 지금 여기서 일어난다.

`adelie` 는 사용자 리포 중 파이썬이 가장 두꺼운 것(139파일)이고 거기서 코스의 절반(기능 챕터)이 없다.

### 4.2 Django · Flask 를 더하는 비용

**Flask** — `@app.route("/x", methods=["POST"])`. `decorated_definition` 안의 `call` 이라
FastAPI 쿼리와 **모양이 같다.** 쿼리 한 줄이면 되는데 동사가 데코레이터 이름이 아니라
`methods=` 키워드 인자 안에 있다. `#eq?` 로 못 읽으므로 `route-any`(동사 미상)로 잡고
`HTTP_FORM` 의 `http-any` 처럼 취급하거나, `@app.get`/`@app.post`(Flask 2.0+ 축약형)만 잡는다.
**비용: `_imports.scm` 4~6줄. 표본 리포 사용처 0곳.**

**Django** — `urls.py` 의 `path("login/", views.login)`. 데코레이터가 아니라 **리스트 안의 호출**이라
모양이 다르다. 라우트 문자열과 뷰 함수가 같은 호출의 인자 둘이라 오히려 잡기 쉽고,
`urlpatterns` 안인지는 조상을 봐야 하는데 tree-sitter 쿼리에 조상 조건이 없어서
「파일 이름이 `urls.py` 인가」를 TS 쪽에서 걸러야 한다.
**비용: `_imports.scm` 6~8줄 + `resolve-imports.ts` 의 파일명 가드. 표본 리포 사용처 0곳.**

**둘 다 표본에서 0곳이다.** 정본 §5 의 티어 B(「덮은 스택만 · 프레임워크마다 규칙 하나씩이라
개수가 안 끝난다」)가 정확히 이 자리다. **지금 하지 않는다.**

### 4.3 CLI 진입점 — 재 보고 판단한 결과

「HTTP 진입점이 없으면 CLI 가 그 자리일 수 있다」를 실측했다. 결과는 **그렇다, 다만 파일 단위로는 안 된다.**

`if __name__ == "__main__":` 를 씨앗으로 놓고 import 폐포를 재면 이렇게 나온다
(`resolvePy` 의 해석 규칙을 근사한 것).

| 리포 | 씨앗 | 폐포 크기 |
|---|---|---|
| `adelie` | `adelie/cli.py` | **67파일 (리포의 48 %)** |
| `adelie` | `adelie/main.py` | 1파일 |
| `ECC` | 11개 | 10개가 **1~2파일**, 최대 2 |
| `MonggleMonggle` | `AI_API/main.py` · `AI_API_GEMINI/main.py` | 각 7파일 (44 %) |
| `MonggleMonggle` | `services/Naver_fortune_api.py` × 2 | 각 1파일 |

**둘 다 실패한다.** adelie 에서는 한 챕터가 리포의 절반을 삼킨다 —
D160 이 「대지 하나가 백엔드 107파일을 통째로 삼켰다」로 고친 바로 그 병이다.
ECC 에서는 열한 씨앗 중 열이 1파일이고 `MIN_FILES_FOR_UNIT = 3` 에 걸려 전부 「기타」로 간다.

**진입점의 단위는 파일이 아니라 하위 명령이다.** `adelie/cli.py` 는 `subparsers.add_parser(...)` 를
**22번** 부르고 그때마다 `set_defaults(func=cmd_x)` 로 처리기를 붙인다 — HTTP 라우트 표와 같은 모양이다.
처리기가 사는 모듈(`adelie/commands/*.py` 7장)을 씨앗으로 놓고 다시 재면 이렇게 된다.

| 씨앗 | 폐포 |
|---|---|
| `adelie/commands/run.py` | 58 |
| `adelie/commands/knowledge.py` | 31 |
| `adelie/commands/integrations.py` | 14 |
| `adelie/commands/monitoring.py` | 11 |
| `adelie/commands/workspace.py` | 8 |
| `adelie/commands/config.py` | 7 |
| `adelie/commands/_helpers.py` | 6 |

**중앙값 11 · 최소 6 · `MIN_FILES_FOR_UNIT` 에 걸리는 것 0개.** 챕터 7개가 선다.
`MonggleMonggle` 의 로그인 챕터가 24파일이었으니(`java.md` §2) 규모도 같은 자리다.

`run.py` 58 은 여전히 크다. `add_parser` 22개까지 내려가면 더 갈리는데, 그러려면
`p_run = subparsers.add_parser("run")` 의 지역 변수 `p_run` 과
`p_run.set_defaults(func=_dispatch_run)` 의 수신자를 이어야 한다. **그 기계는 이미 있다** —
D168 이 만든 `local`(이름 → 타입) · `call`(수신자 + 이름) 캡처와 `calls.ts` 의 결합이 그것이다.

### 4.4 무엇을 하면 되나

셋을 순서대로 적는다. **첫째만 이 세션의 claim 안(데이터)이고 나머지는 `packages/**` 다.**

**ⓐ `_imports.scm` 에 `entry-*` 셋을 더한다** — `dictionary/py/_imports.scm`, 12~18줄.

```
; if __name__ == "__main__":
((if_statement condition: (comparison_operator
   (identifier) @import.source (string) @ctx.main))
 (#eq? @import.source "__name__") (#set! form "entry-main"))

; p = subparsers.add_parser("run")   → 명령 이름
((assignment left: (identifier) @ctx.recv
   right: (call function: (attribute attribute: (identifier) @ctx.verb)
                arguments: (argument_list . (string) @import.source)))
 (#eq? @ctx.verb "add_parser") (#set! form "entry-cli"))

; @cli.command("run") — click·typer. 표본 리포에 0곳이지만 FastAPI 쿼리와 모양이 같다
```

**ⓑ 새 `form` 을 통과시킨다** — `resolve-imports.ts:82` 의 `GRAPH_FORM` 정규식에
`entry-main|entry-cli` 를 더한다(1줄). 안 더하면 파일 간선 해석기가 `__main__` 이라는 모듈을
찾아 나선다.

**ⓒ 씨앗을 만든다** — `ingest.ts:251` 이 `form === 'entry-scheduled'` 만 보고 있다.
`entry-main`·`entry-cli` 도 받게 한다(1줄). `calls.ts:187` 의 `entry-scheduled` 갈래에
라벨을 더한다(3~4줄).

**여기까지가 TS 6줄 + scm 18줄이고 adelie·ECC 의 챕터 0 → 7 이 된다.**
`entry-cli` 를 처리기 모듈까지 잇는 것(§4.3 의 22칸)은 그다음 물결이다.

**ⓓ 안 할 것** — `entry-scheduled` 를 재활용해서 TS 0줄로 끝내는 길이 있다. 쿼리에
`(#set! form "entry-scheduled")` 를 쓰면 지금 코드가 그대로 받는다. **하지 않는다** —
화면 라벨이 `scheduled` 로 뜨고, 그것은 학습자에게 거짓말이다.

---

## §5 실행 러너 — pytest 어댑터

D175 의 계약(`packages/grading/src/runner.ts`)과 자바 어댑터(`java-runner.ts` 259줄)를 읽고 설계했다.
**자바가 Rust 0줄로 들어간 것이 선례다** — Rust `t3_run` 은 작업본 동기화 · 파일 주입 · 자식 실행 ·
상한 · 프로세스 그룹 종료만 하고, 무엇을 실행할지와 통과 여부는 TS 어댑터가 정한다.

### 5.1 계약에 무엇을 더해야 하나

| 자리 | 지금 | 파이썬을 넣으면 |
|---|---|---|
| `RunSpec.lang` | `'java'` | `'java' \| 'py'` |
| `RunnerReason` | `no-jdk` · `no-gradle-wrapper` · … | `no-python` · `no-pytest` 둘 추가 |
| `runTests` | `if (spec.lang !== 'java') return no-runner` | 언어별 갈래 |
| `detectRunner` | `detectJava` 하나 | 확장자·매니페스트로 고른다 |

**계약 자체는 안 바꾼다.** `RunResult`·`RunFailure`·`RunStatus`·`RUN_TIMEOUT_MS` 가 그대로 맞는다.

### 5.2 탐지

「탐지되면 켜고 없으면 그 단을 게이트에서 뺀다」(정본 §5 ①). **설치를 강요하지 않고 설치도 하지 않는다.**

찾는 순서(먼저 걸리는 것이 이긴다):

1. `<repo>/.venv/bin/python` (Windows `Scripts\python.exe`) — **`adelie` 에 실물로 있다** (pytest 9.0.3)
2. `<repo>/venv/bin/python`
3. `python3` (PATH) — `ECC` 는 가상환경이 없으므로 여기로 온다

고른 인터프리터로 `-c "import pytest, sys; print(pytest.__version__)"` 를 한 번 돌린다.
자바가 `java -version` 한 번으로 JDK 를 확인한 것과 같은 자리다. 실패하면 `no-pytest` 다.

**pip 도 uv 도 부르지 않는다.** 자바의 `askDownload`(Gradle 배포본 한 번 받기)에 해당하는 것이
파이썬에는 없다 — 파이썬 패키지 설치는 「한 번 받으면 끝」이 아니라 리포마다 환경이 갈리고,
학습자의 `.venv` 에 우리가 쓰면 정본 §5 ②(원본 리포에 쓰지 않는다)를 깬다.
**pytest 가 없으면 그 리포에서 4·5단은 게이트 밖이고 화면이 그 사실을 말한다.**

표본 판정: `adelie` **켜짐**(.venv + pytest 9.0.3, 테스트 함수 757개) ·
`ECC` **조건부**(pyproject 에 pytest 설정과 232개 테스트가 있는데 가상환경이 없다 —
사용자의 전역 파이썬에 pytest 가 있으면 켜지고 없으면 `no-pytest`) ·
`MonggleMonggle` **꺼짐**(테스트 0개).

### 5.3 작업본 · 오프라인

자바와 같다. `run/<workId>` 에 증분 복사, 원본은 읽기만, `.git`·`__pycache__`·`.venv`·`build` 제외.
`java-runner.ts` 의 `KEEP`(복사 규칙이 떨어뜨려도 반드시 가져올 것)에 해당하는 것:
`pyproject.toml` · `setup.cfg` · `pytest.ini` · `conftest.py` · `tox.ini`.
`.gitignore` 가 이것들을 무시하는 일은 드물지만 `conftest.py` 는 생성물로 취급하는 리포가 있다.

**가상환경은 복사하지 않는다.** `.venv` 는 수천 파일이고 절대 경로가 박혀 있어 복사하면 깨진다.
대신 **원본 리포의 `.venv/bin/python` 을 절대 경로로 그대로 부르고 cwd 만 작업본**으로 둔다.
읽기 전용 사용이라 정본 §5 ②를 안 깬다.

**네트워크**: pytest 자체는 네트워크를 안 쓴다. `--offline` 같은 인자가 없으므로
환경 변수로 막는다 — `PYTHONDONTWRITEBYTECODE=1` · `PIP_NO_INDEX=1` · `PIP_DISABLE_PIP_VERSION_CHECK=1`.
학습자 코드가 스스로 HTTP 를 부르는 것은 못 막는다(자바도 같다). **이것은 못 막는 것이라고 적어 둔다.**

### 5.4 출력 파싱 — 플러그인 없이

`--json-report` 는 별도 플러그인(`pytest-json-report`)이라 못 쓴다. `--junit-xml` 은 파일을 만드는데
그 파일을 읽으려면 임의 경로 읽기가 IPC 에 열려야 한다(자바가 같은 이유로 XML 을 버렸다).

**`-rA` 가 답이다.** pytest 내장이고 stdout 으로 나온다. 실측(pytest 9.0.3):

```
$ python -m pytest --tb=no -q -rA -p no:cacheprovider
.FFs                                                                  [100%]
=========================== short test summary info ============================
PASSED test_demo.py::test_ok
SKIPPED [1] test_demo.py:5: nope
FAILED test_demo.py::test_bad - AssertionError: assert 'ABC' == 'ABD'
FAILED test_demo.py::test_err - ValueError: boom
2 failed, 1 passed, 1 skipped in 0.00s
```

`readMarks()` 에 해당하는 파서가 정규식 하나다 —
`/^(PASSED|FAILED|ERROR|XFAIL|XPASS) (\S+?)(?: - (.*))?$/`.
`test` 는 nodeid(`tests/test_auth.py::test_login`)이고 `RunFailure.test` 에 그대로 들어간다.

**갈래 셋을 실측으로 확인했다.**

| 상황 | 출력 | `RunStatus` |
|---|---|---|
| 정상 | `PASSED`/`FAILED` 줄 | `passed` / `failed` |
| 수집 오류(답안이 import 안 됨) | `ERROR test_x.py` + `Interrupted: 1 error during collection` | **`error`** — 답 안에 있다 |
| 테스트 0개 | `no tests ran` | **`no-runner`** — 이 리포의 사정이다 |

자바의 `cannotHost()` 에 해당하는 판정이 이 표의 셋째 줄이다.
파이썬판 정규식: `/no tests ran|ModuleNotFoundError: No module named 'pytest'|ERROR: file or directory not found/`.

**인자**: `['-m', 'pytest', '--tb=no', '-q', '-rA', '-p', 'no:cacheprovider', '--color=no']`.
`-p no:cacheprovider` 는 `.pytest_cache` 를 안 만들게 한다(작업본에 쓰레기를 안 남긴다).
`--tb=no` 는 트레이스백 전문을 지워 로그를 작게 유지한다 — 실패 이유 한 줄은 `-rA` 가 준다.
**`--tb=no` 로 지운 정보가 아쉬우면 `--tb=line`**(실패마다 한 줄)이 다음 후보다. 둘 중 무엇이
학습자에게 나은지는 안 재 봤다.

### 5.5 시간

자바의 `RUN_TIMEOUT_MS = 180_000` · `FIRST_RUN_TIMEOUT_MS = 600_000` 은 Gradle 첫 빌드가
분 단위라서 나온 값이다. **pytest 에는 빌드가 없다.** 첫 회와 그 뒤가 다르지 않다.

`adelie` 의 757개 테스트를 전부 돌리면 얼마인지는 **안 재 봤다** — 사용자 리포에서 테스트를 실행하는
것은 부작용(파일 쓰기·네트워크)이 있을 수 있어 이 세션에서는 돌리지 않았다.
다만 4·5단은 리포 전체가 아니라 **판정용 테스트만** 돌린다(D180 ③) — `pytest <nodeid>` 로 좁힌다.
그러면 `RUN_TIMEOUT_MS` 180초로 충분할 가능성이 높고, `FIRST_RUN_TIMEOUT_MS` 는 파이썬에서 안 쓴다.

### 5.6 판정용 테스트 세 갈래 (D180 ③)

자바의 ⓐ `fix:` 커밋이 고친 테스트 ⓑ 이름이 맞는 테스트(`AuthService` → `AuthServiceTest`)
ⓒ 계약 테스트 생성 — 셋 다 파이썬에 옮겨진다.

- ⓑ 의 이름 규약: `src/llm/router.py` → `tests/test_router.py` · `tests/llm/test_router.py`.
  `ECC` 실측으로 확인 가능한 규약이다(테스트 17파일).
- ⓒ 계약 테스트: 자바는 리플렉션으로 시그니처를 못 박았다. 파이썬은 `inspect.signature` 로 같은 일을 한다 —
  `inspect.signature(mod.fn).parameters` 의 이름과 개수, `__annotations__` 의 단순 이름.
  **다만 파이썬은 타입 힌트가 실행 시 검사되지 않으므로 ⓒ 가 자바보다 헐겁다.**
  이름과 인자 개수까지가 못 박을 수 있는 전부다.

---

## §6 비용과 순서

「크기」는 그 조각이 만드는 파일과 대략의 줄 수. 사전 한 장은 `py/assignment.yaml` 기준 250~300줄이다.

| # | 조각 | 크기 | 선행 | 안 하면 무엇이 안 되나 | 티어 |
|---|---|---|---|---|---|
| **0** | `arithmetic.scm` 결함 수리 (§1.7 ⓐ) — **됐다(S8)** | scm 3~5줄 | — | 셈하기 카드의 51 %가 거짓 규칙을 단다 → 정밀도 94.9 % | **A** |
| **1** | 1부 새 개념 8장 + scm 8 | ~2,400줄 YAML | 0 | 줄 덮음 37.6 % 에 머문다 | **A** |
| **2** | `_lang.yaml` 의 `essential` 8 → 16 · `PY_PARTS` 1부 | 데이터 + TS ~20줄 | 1 | 0장(프롤로그)이 여덟 판뿐 | A |
| **3** | 2부 16장 + scm 16 | ~4,800줄 YAML | 1 | 클래스·예외·데코레이터·타입 힌트가 코스에 없다 | **A** |
| **4** | 파이썬 골든 40~80장 | `fixtures/golden/py/**` | 1·3 | 쿼리가 조용히 썩는다 (`golden.rs:165` 에 `py` 가 없다) | A |
| **5** | CLI 진입점 씨앗 (§4.4 ⓐⓑⓒ) | scm 18 + TS 6줄 | — | `adelie`·`ECC` 에 기능 챕터 0개 | **B** |
| **6** | pytest 러너 (§5) | `py-runner.ts` ~200줄 + `runner.ts` ~15줄 | — | 4·5단이 AST 제약까지만, 게이트 밖 | **B** |
| **7** | `pyapp/` 12장 (§3.2) | ~1,400줄 (쿼리 없는 개념은 짧다) | 3 | 3부가 없다 — 파이썬 리포는 2부에서 기능 챕터로 | **B** |
| **8** | `pyweb/` 10장 | ~1,200줄 | 3·7 | FastAPI 리포에서 라우트·검증·DI 를 못 가르친다 | B |
| **9** | `entry-cli` 를 하위 명령까지 (§4.3) | `calls.ts` ~30줄 | 5 | 챕터 하나가 58파일 | B |
| **10** | Flask · Django 라우트 | scm 12줄 + TS 가드 | 5 | 표본 리포에 사용처 0곳 | B |
| — | 설계 의도 | — | — | — | **C** |

**순서.** 0 → 1 → 2 → 5 → 3 → 6 → 4 → 7 → 8 → 9 → 10.

근거 넷.

**① 0 이 맨 앞인 이유** — 지금 나가는 카드의 절반이 거짓 규칙을 단다. 새 장을 쌓기 전에 고친다.
scm 3~5줄이고 `dictionary/py/**` 안이다.

**② 1·2·3 이 그다음인 이유** — §1.2 의 표가 순서다. 8 → 24 가 +38 %p, 34 → 44 가 +0.2 %p.

**③ 5 를 3 앞에 끼운 이유** — TS 6줄 + scm 18줄로 `adelie` 의 챕터가 0 → 7 이 된다.
2부 16장(~4,800줄)보다 스무 배 싸고, 그것이 없으면 사전을 아무리 채워도 정본 §2 의 다섯 단이
`adelie` 에서 안 돈다.

**④ 7 이 8 앞인 이유** — `pyapp/` 은 세 리포 전부에서 서고 `pyweb/` 은 하나에서 10파일이다.

**「가장 값싼 큰 승리」 하나만 고른다면 5 다** — 24줄로 리포 둘의 코스가 열린다. **다음이 0** (5줄).
그다음이 1·3(사전 24장)이고 그건 싸지 않지만 §1.2 가 값어치를 못 박는다.

---

## §7 결정 등록부에 올릴 행 — 초안

**아직 올리지 않았다.** 착수 결정은 사용자 것이다(`docs/00-overview.md` §4.2.1 다음 번호로).

**① 파이썬 정식 코스 3부 (D177 의 파이썬판).**
문제 — 파이썬 사전이 8장이고 표본 218파일에서 코드 줄의 37.6 %(adelie)만 덮는다.
`while` 이 여덟 중 하나인데 21곳이고 `for-in`(605곳)·`call-expression`(14,074곳)·
`string-literal`(22,081곳)은 개념이 없다. 왈러스·`match`·`async for`·`yield from` 은 **0곳**이라
「내 코드에서만 뽑는다」로는 영영 못 가르친다.
결정 — 1부 16 · 2부 16 · 3부(§3)로 세우고 `PY_PARTS` 를 `curriculum.ts` 에 더한다.
`_lang.yaml` 의 `essential` 은 8 → 32.

**② 파이썬 3부의 자리 — `pyapp/` 이 먼저다.**
문제 — 자바에서 스프링이 3부였던 근거는 표본 자바 99장이 전부 스프링 위였기 때문인데,
파이썬 표본 218파일 중 FastAPI 가 닿는 것은 10파일(4.6 %)이고 Django·Flask·Streamlit·pandas 는 0곳이다.
결정 — `pyapp/`(패키지·진입점·가상환경·설정·dataclass·enum·ABC·pytest) 12장을 3부로 세우고
`pyweb/`(FastAPI) 10장을 그 위에 얹는다. 감지는 `spring/` 의 `{ manifest, contains }` 를 그대로 쓴다.
**이 행이 이 계획에서 가장 확신이 낮다** — §3.2 의 표에 빈칸이 여섯이다.

**③ CLI 진입점을 기능 폐포의 씨앗으로.**
문제 — `entryUnits` 가 HTTP 엣지와 `entry-scheduled` 씨앗만 받아서 `adelie`(139파일)·`ECC`(63파일)에
기능 챕터가 0개다. `__main__` 가드를 그냥 씨앗으로 쓰면 adelie 에서 한 챕터가 67파일(48 %)을 삼키고
ECC 에서는 열한 씨앗 중 열이 1파일이라 `MIN_FILES_FOR_UNIT` 에 걸린다.
결정 — `entry-main`·`entry-cli` 두 form 을 더하고, 씨앗은 `__main__` 파일이 아니라
**하위 명령 처리기가 사는 모듈**로 잡는다(adelie 실측: 폐포 중앙값 11 · 최소 6 · 걸리는 것 0개).

**④ pytest 어댑터로 파이썬 4·5단을 실행 판정.**
문제 — `runTests` 가 `lang !== 'java'` 면 `no-runner` 라 파이썬 리포에서 4·5단이 게이트 밖이다.
adelie 는 `.venv` 에 pytest 9.0.3 과 테스트 함수 757개를 가지고 있다.
결정 — `py-runner.ts` 를 더한다. 탐지는 `.venv/bin/python` → `venv/bin/python` → `python3` 순,
출력은 `-rA` 의 「short test summary info」를 정규식 하나로 읽는다(플러그인 없음).
가상환경은 복사하지 않고 원본을 절대 경로로 부르며 cwd 만 작업본이다.

---

## §8 못 잰 것

정직하게 적는다. 이 목록은 착수 전에 채워야 한다.

1. **`pyweb/` 열 장 중 여섯의 사용처.** §3.2 표의 빈칸이다. 근거 낱말을 확정하지 않았고,
   `spring/bean-lifecycle` 이 표본에서 판이 안 선 것과 같은 일이 여기서 여섯 번 날 수 있다.
2. **`LoadOptions.manifests` 의 호출부.** 인제스트가 `pyproject.toml`·`requirements.txt` 를
   실제로 그 표에 넣는지 안 읽었다(`packages/**` 가 이 세션 범위 밖). 안 넣으면 §3.3 의 감지가
   조용히 실패한다.
3. **`detect` 스키마가 `contains: ""` 를 허용하는지.** `String.includes('')` 는 참이지만
   `z.string().min(1)` 같은 제약이 있으면 거절된다. `schema.ts:284` 근처를 읽어야 한다.
4. **adelie 757개 테스트의 실행 시간.** 사용자 리포에서 테스트를 돌리지 않았다(부작용 위험).
   `RUN_TIMEOUT_MS` 180초가 충분한지는 판정용 테스트만 돌릴 때의 얘기이고 실측이 아니다.
5. **`--tb=no` 대 `--tb=line`.** 학습자에게 어느 로그가 나은지 안 재 봤다.
6. ~~`.pyi` 스텁 파일~~ — **쟀다. 세 리포 다 0장이다.** `py.md` §8 ⑤ 의 위험(스텁이 교재가 된다)은
   이 표본에서는 안 일어난다. 다만 `mypy` 를 쓰는 리포에서는 생길 수 있어 규칙 자체는 남는다.
7. **f-string 의 `f` 한 글자를 tree-sitter 로 따로 캡처할 수 있는지.** `py.md` §8 ⑥ 이 남긴 것이고
   여전히 미확인이다. `py/f-string` 의 `@hole` 자리가 여기 걸린다.
8. **`grammar_abi` 대조.** `_lang.yaml` 이 `python: 14` 인데 업스트림 master 는 15 다
   (`py.md` §8). 대조하는 시험이 아직 없다.
9. **표본이 셋이다.** 세 리포 다 사용자 것이고 둘은 LLM 도구다. 「바이브 코딩으로 나온 파이썬」의
   일반 분포가 아니다 — `pathlib` 96파일·타입 힌트 138파일은 이 셋의 성격일 수 있다.
