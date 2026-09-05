# 파이썬 커리큘럼 조사 — `py`

조사 시점 2026-09-04. 바닥 여덟은 이미 서 있다(D152, 커밋 `f8d00da`) — §2 는 새로 짓는 목록이 아니라
**이미 있는 것의 재검토**다. 새로 제안하는 것은 §3 부터다.

> **2026-09-05 — 코스 3부와 실측이 [`docs/plan/python-axis.md`](../plan/python-axis.md) 에 있다.**
> 이 문서는 사용자 리포를 **안 보고** 짠 설계표이고(§3·§4 의 34개), 그쪽은 사용자 리포 셋
> (`adelie` 139파일 · `ECC` 63 · `MonggleMonggle` 16, 코드 38,550줄)을 `ast` 로 전부 파싱해 잰
> 사용처 수와 그 위에 세운 부 배치다. **부 배치는 그쪽이 정본**이고 여기 §2.5 가 요약이다.
> 실측이 이 문서를 고친 자리 셋: ⓐ `py/arithmetic` 사용처의 51 %가 셈이 아니다(§2 ⓑ 의 확대판)
> ⓑ `py/type-hint` 은 심화가 아니라 2부다(2,926곳) ⓒ `py/set-and-membership` 이 새로 선다.

---

## §1 언어 좌표

| 항목 | 값 |
|---|---|
| TIOBE 2026-08 | **1위 · 18.53%** (2위 C 11.10%). 2025-08 대비 7.61%p 하락했는데도 격차가 7.4%p 다 |
| 네임스페이스 (`lang`) | `py` |
| tree-sitter `grammar` 키 | `python` (하나뿐 — TS 는 `typescript`·`tsx`·`javascript` 셋) |
| 확장자 | `.py` · `.pyi` (`_lang.yaml` 의 `extensions.python`) |
| 크레이트 | `tree-sitter-python 0.23.6` (`Cargo.lock`), `grammar_abi: 14` |

**이 언어로 실제로 만들어지는 것** — 웹 API 서버(FastAPI · Flask · Django), 데이터 처리 스크립트(pandas),
ML 서빙, 자동화·크롤러, 디스코드 봇, Streamlit 대시보드. 앱의 대상(자기 코드를 못 읽는 사람)이 파이썬으로
만드는 것은 이 중 앞 셋에 몰린다.

**바이브 코딩으로 나온 파이썬 코드의 생김새.** LLM 이 파이썬으로 앱을 짜면 쏟아지는 구문은 좁고 반복적이다.

```python
from fastapi import FastAPI          # import — 파일 맨 위 5~15줄
from pydantic import BaseModel

class Item(BaseModel):               # class + 타입 힌트, __init__ 없음
    name: str
    price: float = 0.0               # 기본값 매개변수

@app.get("/items/{item_id}")         # 데코레이터
async def read_item(item_id: int) -> Item:   # async def + 힌트 + 반환 힌트
    try:
        with open(path, encoding="utf-8") as f:   # with
            rows = [r.strip() for r in f]         # 컴프리헨션
    except FileNotFoundError as e:
        logger.error(f"not found: {e}")           # f-string
        return None                               # None
    if not rows:                                  # 빈 컨테이너 = 거짓
        raise HTTPException(404)
    return {"name": rows[0], "price": 0}          # dict 리터럴 · 인덱싱
```

여기서 실제로 사용처가 생길 개념은 `import` · `class` · 타입 힌트 · 데코레이터 · `async def` ·
`try/except` · `with` · f-string · 컴프리헨션 · `None` · 진리값 판정 · dict/list 리터럴 · 인덱싱이다.
TS 판에서 중심이던 것들(구조 분해 · 옵셔널 체이닝 · 스프레드)은 여기서 거의 안 나온다 — §6 이 그 자리를 센다.

---

## §2 기초 — 바닥 여덟 (재검토)

여덟 장 전부 읽었다. 표의 마지막 열은 사전 YAML 에 **실제로 적혀 있는** 문장을 요약한 것이다.

| # | id | name.ko / en | token | universal | diff | prereq | 이 언어라서 다른 것 |
|---|---|---|---|---|---|---|---|
| 1 | `py/assignment` | 이름에 값 넣기 / Assignment | `=` | `common/variable-binding` | 1 | — | `const`/`let` 이 없어 만드는 줄과 옮기는 줄이 같은 모양이다. 구별은 위에 같은 이름이 있었는지로만 난다 |
| 2 | `py/boolean-literal` | 참·거짓 값 / Boolean literal | `True` | `common/boolean-value` | 1 | — | 둘 다 첫 글자가 대문자다. 소문자면 값이 아니라 「그런 이름 없다」로 멈춘다 |
| 3 | `py/arithmetic` | 셈하기 / Arithmetic | `+` | `common/arithmetic` | 1 | — | 나누기가 딱 떨어져도 소수를 낸다 |
| 4 | `py/comparison` | 견주기 / Comparison | `==` | `common/comparison` | 1 | `py/boolean-literal` | 조건 안의 `=` 를 파이썬이 문법 오류로 막는다 |
| 5 | `py/if-statement` | if 문 / if statement | `if` | `common/conditional-branch` | 1 | — | 묶음의 경계가 중괄호가 아니라 들여쓰기다 |
| 6 | `py/while-loop` | while 문 / while loop | `while` | `common/loop-while` | 2 | `py/comparison` | 같음 — 들여쓰기가 몸통을 정한다 |
| 7 | `py/function-definition` | 함수 정의 / Function definition | `def` | `common/function-definition` | 1 | — | 정의한 자리에서는 돌지 않는다. `lambda`(식 하나·이름 없음)·`yield`(함수 종류가 바뀜)와의 대비로 가른다 |
| 8 | `py/return-statement` | 값 돌려주기 / return statement | `return` | `common/return-value` | 1 | `py/function-definition` | 안 적으면 멈추지 않고 조용히 `None` 이 간다 |

### 확인된 것

- 여덟 전부 `universal` 이 채워져 있고 TS 판을 옮긴 문장이 없다. `arithmetic`·`comparison`·`boolean-literal`
  의 근거는 파이썬에서만 참이다.
- `comparison.scm` 이 연쇄 비교를 앵커로 잘라낸 이유를 쿼리 안에 주석으로 남겼다. 사전에서 유일하게
  **파싱 결정이 문서화된** 자리다.

### 약한 자리 — 지적 다섯

**ⓐ `assignment.scm` 의 제외 범위가 어디에도 안 적혀 있다.** 쿼리가 `left: (identifier)` 를 요구하므로
`self.name = value`(속성)·`d[k] = v`(첨자)·`a, b = pair`(풀어 담기)·`n += 1`(`augmented_assignment` 는
아예 다른 노드)가 전부 사용처에서 빠진다. 그런데 §1 의 실제 코드에서 재대입의 대부분은 `+=` 이고
클래스 안의 첫 대입은 거의 다 `self.x =` 다. **개념의 자기 소개(「만드는 줄과 옮기는 줄이 같다」)가
가장 잘 보이는 두 자리를 쿼리가 못 본다.** `comparison.scm` 처럼 제외 이유를 쿼리 주석으로 남기고,
`+=` 는 §3 밖의 확장 후보로 따로 세우는 것이 맞다.

**ⓑ `arithmetic.scm` 의 연산자 목록이 개념의 규칙과 어긋난다.** 목록에 `//` 가 들어 있는데 `rule` 은
「나누기는 늘 소수를 낸다」로 고정이다. 사용처가 `a // b` 인 카드는 **그 자리에서 거짓인 규칙**을 읽는다.
더해서 `binary_operator` 는 타입을 모르므로 `"a" + "b"`(이어붙이기) · `[0] * n`(되풀이) · `"%s" % x`(서식)
가 전부 셈하기 사용처로 잡힌다. 파이썬 초심자 오개념 목록에 `PlusConcatenatesNumbers` 와
`NoSequenceRepetition` 이 따로 올라 있는 바로 그 자리다(§9). 최소한 `//` 를 목록에서 빼거나 `rule` 을
`form` 별로 갈라야 한다.

**ⓒ 여덟 중 둘은 자기 근거를 사용처로 보여 줄 수 없다.** `boolean-literal` 의 「소문자면 멈춘다」와
`return-statement` 의 「안 적으면 `None`」은 **코드에 없는 것**에 대한 주장이라 `@site` 가 생기지 않는다.
둘 다 `meaning` 문항으로만 전달되고 있다. 나쁜 설계는 아니지만, 사전 린트가 `essential` 에
`blank`+`@hole` 을 요구하는 규칙과 성격이 다르다는 것을 어딘가 적어 두어야 한다.

**ⓓ `function-definition` 의 규칙이 데코레이터 앞에서 깨진다.** 「정의한 자리에서는 돌지 않는다」는
파이썬에서 **정의된 함수 몸통**에만 참이다. `@app.get("/items")` 는 정의 시점에 실제로 실행된다.
§1 의 코드에서 최상위 `def` 는 거의 전부 데코레이터를 달고 있으므로, 사용자는 자기 코드에서
규칙의 반례를 먼저 본다. `py/decorator`(§4)가 이 예외를 받아 주는 `bridge` 를 갖는 것이 전제다.

**ⓔ `_blocks.scm` 이 데코레이터를 블록 범위 밖에 둔다.** `@block.function` 이 `function_definition` 에
붙는데 `decorated_definition` 이 그 부모라, 블록의 시작 줄은 `@` 줄이 아니라 `def` 줄이다. T1 코드 창이
블록 범위로 잘리면 `@app.get(...)` 가 화면에서 사라진다 — FastAPI 코드에서 그 한 줄이 함수가 무엇인지
말하는 유일한 줄이다. `(decorated_definition definition: (function_definition ...)) @block.function` 로
바꿔 잡는 것이 맞는지 확인이 필요하다.

> **ⓔ 는 고쳐졌다** — 2026-09-05 기준 `_blocks.scm` 이 `decorated_definition` 판 둘을 함께 잡고
> 쿼리 주석이 이유를 적고 있다. 겹쳐 잡히는 것은 `derive.ts` 가 「끝과 이름이 같으면 바깥을 남긴다」로 접는다.

---

## §2.5 코스 3부 — 부 배치 (2026-09-05 실측)

정본 §4 · D177 의 파이썬판. 전체 근거와 비용은 [`docs/plan/python-axis.md`](../plan/python-axis.md).

| 부 | 교재 | 장 | 담기는 것 |
|---|---|---|---|
| **1부 바닥** | 합성 예제 | **16** | `assignment` · `number-literal` · `string-literal` · `boolean-literal` · `none-value` · `arithmetic` · `comparison` · `truthiness` · `if-statement` · `list-literal` · `for-in` · `while-loop` · `function-definition` · `call-expression` · `return-statement` · `import` |
| **2부 자료구조와 객체** | 합성 + 내 코드 | **16** | `attribute-access` · `f-string` · `dict-literal` · `index-access` · `set-and-membership` · `tuple-unpacking` · `list-append` · `list-comprehension` · `is-identity` · `type-hint` · `class-definition` · `default-argument` · `try-except` · `with-statement` · `lambda` · `decorator` |
| **3부 프레임워크** | 내 코드 중심 | 10~12 | `pyapp/`(패키지·진입점·가상환경·설정·dataclass·enum·ABC·pytest) 먼저, `pyweb/`(FastAPI) 그 위 |

1부가 자바(13장)보다 큰 이유는 파이썬에 타입 선언문이 없어서다 — 자바가 `variable-declaration`
한 장으로 배우는 것을 파이썬은 리터럴 넷이 나눠 진다.

**부 밖으로 뺀 심화** — `async-await`(65곳) · `generator-yield`(10) · `args-kwargs`(44) ·
`conditional-expression`(214) · `augmented-assign`(268) · `slicing`(263). `essential` 을 34 로 키우면
0장 후보가 30/24 가 되어 상한이 여섯을 임의로 자른다(§5 의 반례가 그대로 성립한다).

**정식 코스가 필요한 근거 — 표본 218파일에 0곳인 것**: 왈러스 `:=` · `match` 문 ·
호출 자리 언패킹 `f(*xs)` · `async for` · `async with` · `yield from` · `for … else`.
집합 리터럴은 48곳/23파일이라 사용처만으로는 카드가 안 선다.

**반대로 이미 있는 여덟 중 하나가 거의 죽어 있다** — `while` 21곳(16파일)이고 `for-in` 은 605곳이다.
D152 가 TS 의 바닥 여덟을 그대로 옮긴 자리이고, 파이썬에서 반복의 자리는 `for-in` 과 컴프리헨션이 가져갔다.

---

## §3 중심 — 16개

각 행의 마지막 열은 「이 개념이 없으면 그 언어로 짠 코드를 왜 못 읽나」다.

| # | id | name.ko / en | token | universal | diff | prereq | 이 언어라서 다른 것 / 없으면 못 읽는 이유 |
|---|---|---|---|---|---|---|---|
| 9 | `py/string-literal` | 글자 값 / Text literal | `"` | `common/text-literal` | 1 | — | 따옴표 넷(`'` `"` `'''` `"""`)이 같은 값이고, **붙여 쓴 두 리터럴이 연산자 없이 하나로 이어진다**. 리스트에서 콤마 하나가 빠지면 항목 둘이 조용히 한 문자열이 된다 |
| 10 | `py/number-literal` | 숫자 값 / Number value | `0` | `common/number-literal` | 1 | — | 정수에 자릿수 한계가 없다. `1` 과 `1.0` 은 다른 종류이고 `/` 는 늘 뒤쪽을 만든다 |
| 11 | `py/none-value` | 없음이라는 값 / None | `None` | `common/absent-value` | 1 | `py/assignment` | **없음이 하나뿐이다** — `null`/`undefined` 둘로 갈리지 않는다. 함수가 아무것도 안 돌려주면 이 값이 간다 |
| 12 | `py/call-expression` | 함수 부르기 / Calling | `(` | `common/function-call` | 1 | `py/function-definition` | 괄호가 없으면 함수가 **값 그 자체**다. `f` 와 `f()` 가 둘 다 문법에 맞으므로 오타가 오류 없이 지나간다 |
| 13 | `py/attribute-access` | 안의 이름 꺼내기 / Attribute access | `.` | `common/member-access` | 1 | `py/assignment` | 없는 이름은 `AttributeError` 로 **그 자리에서 멈춘다**. 조용히 `undefined` 가 되지 않고, 그래서 파이썬에는 `?.` 가 없다 |
| 14 | `py/list-literal` | 순서 있는 목록 / List literal | `[` | `common/list` | 1 | — | 대괄호가 리스트, **콤마 하나 붙은 괄호가 튜플**이다. `(1)` 은 튜플이 아니라 숫자 1 이다 |
| 15 | `py/dict-literal` | 키로 담기 / Dict literal | `{` | 신규 `common/key-value-map` | 1 | `py/string-literal`, `py/list-literal` | 같은 중괄호가 **비면 dict, 값만 있으면 set** 이다. 키는 넣은 순서를 지킨다(3.7+) |
| 16 | `py/index-access` | 대괄호로 꺼내기 / Subscript | `[0]` | 신규 `common/index-access` | 2 | `py/list-literal`, `py/dict-literal` | 같은 대괄호가 **자리로도 키로도** 꺼낸다. 무엇을 꺼내는지는 왼쪽이 정하고, 없으면 `IndexError`/`KeyError` 로 멈춘다. **음수가 뒤에서 센다**(`xs[-1]`) |
| 17 | `py/for-in` | 하나씩 훑기 / for-in | `for` | `common/iterate` | 1 | `py/list-literal`, `py/assignment` | 세는 변수가 없다 — 인덱스가 아니라 **항목을 직접** 받는다. `range(n)` 은 `n` 을 포함하지 않는다 |
| 18 | `py/tuple-unpacking` | 한 번에 풀어 담기 / Unpacking | `,` | `common/destructuring` | 2 | `py/assignment`, `py/list-literal` | **왼쪽의 콤마 하나**로 풀린다. 괄호가 필요 없고, 개수가 안 맞으면 그 자리에서 멈춘다. `a, b = b, a` 가 임시 변수 없이 자리를 바꾼다 |
| 19 | `py/truthiness` | 값 자체로 판단하기 / Truthiness | `if x:` | 신규 `common/truthiness` | 2 | `py/boolean-literal`, `py/if-statement` | **빈 리스트·빈 글자·`0` 이 거짓이다.** `if items:` 가 「있으면」으로 읽히는 이유이자, `if x:` 와 `if x is not None:` 이 다른 답을 내는 이유 |
| 20 | `py/is-identity` | 같은 것인지 견주기 / Identity | `is` | 신규 `common/identity-vs-equality` | 2 | `py/none-value`, `py/comparison` | `==` 는 「값이 같으냐」, `is` 는 「**같은 것이냐**」. `None` 에는 `is` 를 쓴다. 작은 정수·짧은 문자열에서 `is` 가 우연히 맞아 떨어져 틀린 습관이 굳는다 |
| 21 | `py/f-string` | 문장에 값 끼워 넣기 / f-string | `f"` | `common/string-interpolation` | 1 | `py/string-literal`, `py/assignment` | 앞의 `f` 한 글자가 빠지면 **오류가 아니라** 중괄호가 글자 그대로 남는다. 조용히 틀린 문자열이 로그에 찍힌다 |
| 22 | `py/import` | 다른 파일 것 가져오기 / import | `import` | 신규 `common/module-import` | 2 | `py/call-expression`, `py/attribute-access` | 가져오는 순간 그 파일이 **위에서 아래로 한 번 실행된다**. `if __name__ == "__main__":` 가 왜 필요한지가 여기서 나온다 |
| 23 | `py/list-append` | 있던 목록에 직접 더하기 / append | `.append` | `common/mutating-append` | 2 | `py/list-literal`, `py/attribute-access` | 새 리스트를 만들지 않고 **같은 것을 고친다**. 그 리스트를 가리키던 다른 이름에서도 바뀌고, 반환값은 `None` 이라 `xs = xs.append(v)` 는 리스트를 지운다 |
| 24 | `py/list-comprehension` | 항목마다 바꿔 새로 만들기 / Comprehension | `[x for` | `common/map-transform` | 3 | `py/for-in`, `py/list-literal` | **읽는 순서와 쓰는 순서가 다르다** — 결과 식이 맨 앞이고 `for` 가 뒤다. `if` 절이 걸러내기까지 같은 괄호 안에서 한다 |

`py/list-comprehension` 은 `common/filter-select` 도 겸한다. 파이썬에는 `.filter()` 메서드가 없고
내장 `filter()` 는 게으른 이터레이터를 돌려주어 LLM 이 거의 쓰지 않는다 — 걸러내기는 컴프리헨션의
`if` 절 하나로 산다. TS 의 `array-filter` 를 옮겨 오면 없는 문법을 가르치게 된다.

---

## §4 심화 — 10개

| # | id | name.ko / en | token | universal | diff | prereq | 이 언어라서 다른 것 |
|---|---|---|---|---|---|---|---|
| 25 | `py/class-definition` | 틀 만들고 자기 자신 받기 / Class + self | `class` | 신규 `common/class-definition` | 3 | `py/function-definition`, `py/attribute-access` | **수신자를 매개변수로 직접 적는다**(`def m(self)`). 부를 때는 안 넘긴다. 속성을 미리 적어 두는 자리가 없어 `self.x = ...` 가 도는 순간 속성이 처음 생긴다 |
| 26 | `py/decorator` | 함수를 감싸 바꾸기 / Decorator | `@` | `null` | 4 | `py/lambda`, `py/call-expression` | `@deco` 한 줄이 `f = deco(f)` 와 같고 **정의 시점에 실행된다**. §2 ⓓ 의 예외가 여기다. 웹 라우트가 붙는 자리라 자기 코드에서 가장 먼저 보이는 심화 문법이다 |
| 27 | `py/default-argument` | 안 넘기면 쓸 값 / Default argument | `=` (매개변수 안) | 신규 `common/default-parameter` | 3 | `py/function-definition`, `py/none-value` | **기본값은 정의할 때 딱 한 번 만들어진다.** 리스트를 기본값으로 두면 부를 때마다 같은 리스트가 오고 쌓인다. `= None` 관용구가 존재하는 이유 전부가 이것이다 |
| 28 | `py/args-kwargs` | 남은 인자 묶기 / *args, **kwargs | `*` | `null` | 4 | `py/default-argument`, `py/dict-literal` | 별 하나는 남은 위치 인자를 **튜플**로, 둘은 남은 이름 인자를 **dict** 로 묶는다. 별만 있는 매개변수 뒤는 이름으로만 넘길 수 있다 |
| 29 | `py/with-statement` | 다 쓰면 알아서 닫기 / with | `with` | 신규 `common/scoped-cleanup` | 3 | `py/call-expression`, `py/try-except` | 블록을 나가는 **모든 길**에서 닫힌다 — `return` 으로 나가도, 예외로 튕겨도. `open()` 을 `with` 없이 쓴 코드와 쓴 코드의 차이가 여기서만 보인다 |
| 30 | `py/try-except` | 터진 것을 받아 잇기 / try-except | `except` | `common/try-catch` | 3 | `py/call-expression`, `py/if-statement` | 잡을 **종류를 적어야** 한다. `except:` 만 쓰면 `Ctrl+C` 와 메모리 부족까지 삼킨다. `finally` 는 `return` 뒤에도 돈다 |
| 31 | `py/generator-yield` | 그때그때 하나씩 내주기 / yield | `yield` | 신규 `common/lazy-sequence` | 4 | `py/return-statement`, `py/for-in` | **낱말 하나가 함수 전체의 종류를 바꾼다.** 몸통에 `yield` 가 하나라도 있으면 부를 때 몸통이 한 줄도 안 돌고 제너레이터가 나온다 |
| 32 | `py/async-await` | 기다렸다 값 꺼내기 / async-await | `await` | `common/async-await` | 4 | `py/call-expression`, `py/try-except` | `async def` 안에서만 `await` 를 쓸 수 있다. 코루틴은 `await` 하거나 `asyncio.run` 에 넣기 전에는 **아무것도 안 한다** — 부르기만 하면 경고 한 줄이 뜨고 끝난다 |
| 33 | `py/type-hint` | 종류 적어 두기 / Type hint | `: int` | 신규 `common/type-annotation` | 3 | `py/function-definition`, `py/number-literal` | **적어도 실행 시에는 검사하지 않는다.** 그런데 pydantic·FastAPI 는 이 힌트를 읽어서 진짜로 검사한다 — 같은 문법이 어떤 파일에서는 주석이고 어떤 파일에서는 동작이다 |
| 34 | `py/lambda` | 이름 없는 함수 / lambda | `lambda` | `common/function-value` | 3 | `py/function-definition`, `py/call-expression` | **식 하나만 담는다** — `return` 도 여러 줄도 못 넣는다. `sorted(key=...)` 자리에서만 거의 산다 |

---

## §5 prereq 그래프와 0장 적재량

`zeroChapterPlates` 는 `_lang.yaml` 의 **`essential` 목록 안에서만** 깊이를 잰다
(`prereqDepth` 가 `known.has(p)` 로 바깥 선행을 건너뛴다). 그러니 「깊이 ≤ 2 가 몇 개냐」는
개념 34개 전부가 아니라 `essential` 을 어디까지 넣느냐가 정한다.

**제안: `essential` = 바닥 여덟 + §3 열여섯 = 24개.** 그때의 깊이 분포다.

| 깊이 | 개수 | 개념 |
|---|---|---|
| 0 | 8 | `assignment` · `boolean-literal` · `arithmetic` · `if-statement` · `function-definition` · `string-literal` · `number-literal` · `list-literal` |
| 1 | 9 | `comparison` · `return-statement` · `none-value` · `call-expression` · `attribute-access` · `dict-literal` · `f-string` · `truthiness` · `for-in` |
| 2 | 7 | `while-loop` · `index-access` · `tuple-unpacking` · `is-identity` · `list-append` · `import` · `list-comprehension` |
| **≤ 2 합** | **24 / 24** | 상한이 자를 것이 하나도 없다 |

**24/24 가 나온 것은 우연이 아니라 `essential` 을 24 로 고른 결과다.** D147 이 깊이 상한 2 를 고른 근거가
「후보가 상한 언저리에 오게 두어 무엇을 자를까가 임의의 문제가 되지 않게」였다. TS 는 21/24, D152 의
파이썬 초안은 19/24 였다 — 둘 다 후보가 상한보다 적어 자르는 규칙이 놀았다. 24/24 는 그 조건을 정확히
만족한다.

**반례: `essential` 을 34 로 하면 깨진다.** §4 를 다 넣으면 깊이 3 이 4개(`with-statement` ·
`async-await` · `args-kwargs` · `decorator`)뿐이라 후보가 **30/24** 가 되고 상한이 6개를 자른다.
자르는 순서는 ① 사용처 있는 것 먼저 ② 깊이 ③ 미지 ④ id 라 무엇이 잘릴지가 사용자 리포마다 달라진다 —
D147 이 피하려던 「임의의 문제」가 그대로 돌아온다. §4 열 개는 `essential` 밖에 둔다.

`essential` 은 구멍 지도가 세는 대상이기도 하다(03 §6). 24 는 TS 의 30 보다 작다. 그 차이는 §6 이
설명한다 — TS 의 `essential` 에 든 옵셔널 체이닝·널 병합·스프레드·구조 분해 넷이 파이썬에는 대응 문법이
없거나 하나로 접힌다.

**사이클.** 끊은 자리 셋을 적는다. ① `none-value` ↔ `return-statement`(빈 `return` 이 `None` 을 내고
`None` 은 빈 `return` 의 뜻이다) → `none-value` 의 선행을 `assignment` 로 돌려 한쪽만 남겼다.
② `for-in` ↔ `generator-yield`(제너레이터는 `for` 가 소비한다) → `generator-yield` 만 `for-in` 을
선행으로 갖는다. ③ `attribute-access` ↔ `class-definition`(`self.x` 는 속성 접근이고 속성은 클래스가
만든다) → `class-definition` 이 `attribute-access` 를 선행으로 갖는 쪽만 남겼다. 셋 다 §3/§4 경계를
넘는 방향으로 끊어서 `essential` 24개 안에는 사이클이 없다.

---

## §6 common/ 재사용 대 신규

### 재사용 — 22/30 (73%)

| `common/<id>` | 파이썬 개념 | | `common/<id>` | 파이썬 개념 |
|---|---|---|---|---|
| `variable-binding` | `py/assignment` | | `member-access` | `py/attribute-access` |
| `boolean-value` | `py/boolean-literal` | | `list` | `py/list-literal` |
| `arithmetic` | `py/arithmetic` | | `iterate` | `py/for-in` |
| `comparison` | `py/comparison` | | `destructuring` | `py/tuple-unpacking` |
| `conditional-branch` | `py/if-statement` | | `string-interpolation` | `py/f-string` |
| `loop-while` | `py/while-loop` | | `mutating-append` | `py/list-append` |
| `function-definition` | `py/function-definition` | | `map-transform` | `py/list-comprehension` |
| `return-value` | `py/return-statement` | | `try-catch` | `py/try-except` |
| `text-literal` | `py/string-literal` | | `async-await` | `py/async-await` |
| `number-literal` | `py/number-literal` | | `function-value` | `py/lambda` |
| `absent-value` | `py/none-value` | | | |
| `function-call` | `py/call-expression` | | | |

D152 는 21/30 을 적었다. 22 로 하나 늘어난 것은 `py/lambda` → `common/function-value` 를 세었기
때문이다. 겹 전이(D4)로 보면 **TS 를 먼저 한 사용자는 파이썬 34개 중 22개를 첫 노출에 1겹으로 시작한다.**

### 안 쓰는 `common/` 8개 — 하나씩 이유

| `common/<id>` | 왜 안 쓰나 |
|---|---|
| `optional-chaining` | 파이썬에 `?.` 가 없다. PEP 505 가 보류 상태다. `getattr(x, "y", None)` 은 문법이 아니라 함수 호출이라 개념으로 세울 자리가 아니다 |
| `promise-chain` | `.then` 이 없다. 콜백 등록은 `asyncio` API 호출이지 문법이 아니다 |
| `reassignment` | **D152 ⓐ 로 `py/assignment` 에 접었다.** 그 결정의 값이 여기서 보인다 — `ts/reassignment` 로 3겹을 쌓은 사용자는 파이썬에서 **전이를 하나도 못 받는다**. `common/reassignment` 를 지고 있는 파이썬 개념이 없기 때문이다. ⓐ 가 옳다고 보지만, 전이 손실은 D152 가 적지 않은 대가다 |
| `nullish-default` | 파이썬의 `x or default` 는 `None` 만이 아니라 `0`·`""`·`[]` 에서도 대체값을 쓴다. `??` 와 같은 개념으로 묶으면 **틀린 등가를 가르친다.** 이 사실은 `py/truthiness` 가 진다 |
| `filter-select` | `py/list-comprehension` 의 `if` 절로 접었다. `.filter()` 메서드가 없다 |
| `conditional-expression` | `a if c else b` 가 있다. 34개 예산 밖으로 밀었을 뿐 대응 문법은 있다 — **확장 1순위** |
| `copy-with-changes` | `{**a, "k": v}` 와 `dataclasses.replace` 가 있다. 확장 2순위 |
| `generics` | `list[int]` 는 `py/type-hint` 에 접었다. `TypeVar`·`Generic` 은 바이브 코딩 산출물에 거의 안 나온다 |

### 신규 `common/` 제안 10개

각각 「다른 언어 최소 2개에서도 성립하는가」를 붙였다.

| 신규 id | name.ko / en | 다른 언어 근거 |
|---|---|---|
| `common/key-value-map` | 키로 담기 / Key-value map | TS `Record`·`Map` · Go `map[K]V` · Rust `HashMap` · Swift `Dictionary` |
| `common/index-access` | 자리로 꺼내기 / Index access | TS `xs[0]` · Go `s[i]` · Rust `v[i]` · Swift `a[i]` |
| `common/truthiness` | 값 자체로 판단하기 / Truthiness | JS/TS(`0`·`""`·`null` 거짓) · Lua·Ruby(`nil`·`false` 만 거짓) · C(`0` 만 거짓). **규칙은 언어마다 다르지만 「값이 그대로 조건이 된다」는 같다** — 다름 자체가 전이할 값어치다. Go·Rust 는 이 개념이 아예 없다 |
| `common/identity-vs-equality` | 같은 값이냐 같은 것이냐 / Identity vs equality | Java `==`/`equals` · JS `===`/`Object.is` · Swift `===`/`==` · C# `ReferenceEquals` |
| `common/module-import` | 다른 파일 것 가져오기 / Module import | TS `import` · Go `import` · Rust `use` · Dart `import` |
| `common/class-definition` | 틀 만들기 / Class definition | TS·Swift·Dart·Java 전부 `class` |
| `common/default-parameter` | 안 넘기면 쓸 값 / Default parameter | TS `f(a = 1)` · Swift `func f(a: Int = 1)` · Dart · Ruby. Go·Rust 에는 없다 |
| `common/scoped-cleanup` | 나갈 때 알아서 정리 / Scoped cleanup | Go `defer` · Swift `defer` · C# `using` · Java try-with-resources · Rust `Drop` |
| `common/lazy-sequence` | 그때그때 하나씩 / Lazy sequence | JS `function*`+`yield` · C# `yield return` · Rust `Iterator` |
| `common/type-annotation` | 종류 적어 두기 / Type annotation | TS `x: number` · Dart · Swift · Kotlin. TS 쪽에 대응 개념이 아직 없으므로 이 행을 넣으면 `ts/type-annotation` 이 뒤따라야 짝이 맞는다 |

### `universal: null` 로 둘 것

| id | 왜 전이할 데가 없나 |
|---|---|
| `py/decorator` | `@` 로 함수를 감싸 **바꿔치기**하는 문법이 다른 대상 언어에 없다. Java 애너테이션은 메타데이터라 동작을 바꾸지 않고, TS 데코레이터는 표준화가 다른 길로 갔다. 억지로 묶으면 「애너테이션도 함수를 감싼다」는 틀린 전이가 생긴다 |
| `py/args-kwargs` | `*args`(나머지 위치 인자)는 JS rest 와 통하지만 `**kwargs`(나머지 **이름** 인자)는 이름 인자 자체가 있는 언어에만 있다(파이썬·루비). 반쪽만 겹치는 것은 전이 근거로 약하다 |

---

## §7 cs/ 로 밀어낼 것

문법이 아니라 기계·이론인 것. 「어느 파이썬 개념이 이것을 필요로 하는가」를 간선으로 적었다.

| 신규 `cs/<id>` | 한 줄 정의 | ← 필요로 하는 파이썬 개념 |
|---|---|---|
| `cs/reference-vs-value` | 이름이 값을 담는 것이 아니라 **가리킨다**. 같은 것을 둘이 가리킬 수 있다 | `py/assignment` · `py/list-append` · `py/default-argument` · `py/tuple-unpacking` |
| `cs/object-identity` | 값이 같은 것과 같은 자리에 있는 것은 다르다 | `py/is-identity` · `py/none-value` |
| `cs/float-representation` | 소수는 이진수로 정확히 못 담는다. `0.1 + 0.2 != 0.3` | `py/arithmetic` · `py/comparison` · `py/number-literal` |
| `cs/integer-representation` | 정수는 보통 자릿수 한계가 있다 — 파이썬이 그 한계를 없앤 것이 예외다 | `py/number-literal` · `py/arithmetic` |
| `cs/text-encoding` | 글자와 바이트는 다르다. 한 글자가 여러 바이트일 수 있다 | `py/string-literal` · `py/f-string` |
| `cs/call-stack` | 부른 자리가 쌓이고, 돌아갈 때 하나씩 걷힌다. 너무 쌓이면 터진다 | `py/return-statement` · `py/function-definition` · `py/generator-yield` |
| `cs/name-scope` | 이름이 보이는 범위는 **적힌 자리**가 정한다 | `py/function-definition` · `py/class-definition` · `py/list-comprehension` |
| `cs/complexity-order` | 자료가 커질 때 연산 횟수가 어떻게 늘어나는가 | `py/index-access`(list `in` 은 훑고 dict 는 안 훑는다) · `py/list-comprehension` |
| `cs/eager-vs-lazy` | 값을 지금 다 만들 것인가, 필요할 때 하나씩 만들 것인가 | `py/generator-yield` · `py/for-in` |
| `cs/concurrency-model` | 한 번에 하나만 도는가, 여럿이 도는가, 기다리는 동안만 넘기는가 | `py/async-await`(GIL — 파이썬 스레드는 CPU 일을 동시에 못 한다. `async` 는 기다릴 때만 양보한다) |

`cs/name-scope` 는 다른 것들과 성격이 조금 다르다 — 이론이라기보다 실행 모델이다. 다만 파이썬의
`UnboundLocalError`·`global`·컴프리헨션의 자체 범위를 문법 개념 하나에 담을 수 없어 여기에 둔다.
활성 플랜의 `{#a-scope}`(선언 노드와 사용 노드의 조상 블록 비교)와 같은 대상이다.

---

## §8 tree-sitter 현실

### 확인된 사실

| 항목 | 값 | 근거 |
|---|---|---|
| `grammar` 키 | `python` | `dictionary/py/_lang.yaml` |
| 크레이트 | `tree-sitter-python 0.23.6` | `Cargo.lock` |
| `grammar_abi` | **14** | `v0.23.6` 태그의 `src/parser.c` 에서 `LANGUAGE_VERSION` 확인. `_lang.yaml` 값과 일치 |
| 확장자 | `.py` · `.pyi` | `_lang.yaml.extensions` |
| 쿼리 | **10개** — 개념 8 + `_imports.scm` + `_blocks.scm` | `dictionary/py/*.scm` |
| T2 import 해석 | `resolvePy` 구현됨. `a.b` → `a/b.py` → `a/b/__init__.py`, 마지막 조각을 붙인 것과 뗀 것을 둘 다 후보로, 상대 import 의 점 개수만큼 올라감 | `packages/concepts/src/resolve-imports.ts:233` |

### 함정

**① 연쇄 비교 — 이미 처리됨.** `a < b < c` 는 `comparison_operator` 한 노드에 `left`/`right` 필드 없이
자식 여럿으로 담긴다. `comparison.scm` 이 앵커 `.` 로 「자식이 정확히 둘」만 잡아 잘라냈다.
같은 쿼리가 `in`·`not in`·`is`·`is not` 도 연산자 목록에서 빼 놓았다 — 의도된 것으로 보이지만 주석에는
연쇄 얘기만 있다. `py/is-identity`(§3)를 만들 때 그 자리를 명시하는 것이 좋다.

**② `subscript` 가 타입 힌트까지 잡는다.** `list[int]`·`Dict[str, int]` 는 `xs[0]` 과 **같은 `subscript`
노드**다(`v0.23.6` 의 `grammar.js` 확인). `py/index-access` 쿼리를 그냥 쓰면 §1 코드의 타입 힌트
전부가 인덱싱 사용처로 잡힌다. `type:` 필드 안이나 `parameters`·`return_type` 아래를 제외하는 가드가
필요하다.

**③ 데코레이터가 블록 밖에 있다.** `decorated_definition` 이 `function_definition` 의 **부모**다
(`grammar.js` 확인). `_blocks.scm` 이 자식 쪽에 붙어 있어 블록 범위가 `@` 줄을 포함하지 않는다.
§2 ⓔ 와 같은 항목이다.

**④ 셈하기 쿼리가 문자열·리스트 연산을 삼킨다.** `binary_operator` 는 타입을 모른다. §2 ⓑ.

**⑤ `.pyi` 스텁.** `extensions` 에 들어 있는데 스텁 파일의 함수 몸통은 전부 `...`(`ellipsis`)다.
`py/function-definition` 사용처가 몸통 없는 정의로 잔뜩 생기고, `py/type-hint` 는 사실상 스텁 파일에
몰린다 — **사용자 코드가 아닌 파일이 교재가 되는** 자리다. `.pyi` 를 확장자 목록에서 빼거나
사용처 순위에서 낮추는 것을 검토해야 한다.

**⑥ f-string 노드 모양 — 확인 필요.** `v0.23.6` 의 `grammar.js` 는
`string: seq(string_start, repeat(choice(interpolation, string_content)), string_end)` 이고
`interpolation` 은 `{`·`expression`·`format_specifier`·`}` 를 갖는다. 그러니 `py/f-string` 쿼리는
`(string (interpolation))` 을 잡아야 하고 `f` 접두는 `string_start` 토큰 안에 있다 — **`f` 만 따로
캡처할 수 있는지는 확인 못 했다.** `@hole` 을 `f` 한 글자에 두려면 `string_start` 의 텍스트를
`#match?` 로 걸러야 할 가능성이 크다. `cargo test -p chickadee-parse --test dictionary` 로 확인할 것.

**⑦ `:=`·`+=` 는 다른 노드.** 왈러스는 `named_expression`, 증분 대입은 `augmented_assignment` 다.
`py/assignment` 사용처에 안 잡힌다(§2 ⓐ).

**⑧ `{}` 는 dict, `{1}` 은 set.** 규칙 이름이 각각 `dictionary`·`set` 이라 쿼리로 갈린다. 다만
빈 중괄호가 dict 라는 사실은 사람이 자주 틀린다(§9).

### 남은 부채

- **파이썬 골든 40장** — 개념당 양성 3 · 음성 2. `crates/parse/tests/golden.rs:165` 의
  `[("ts", 20), ("tsx", 3), ("sql", 3)]` 에 `("py", …)` 가 없다. `fixtures/golden/` 에도 `py` 디렉터리가
  없다. 최소 개수는 개념 8개 기준으로 정한다.
- **T1 들여쓰기 분기 (D152 ⓑ)** — 탭·공백만 정규화하고 깊이는 유지. `packages/grading/src/t1-line.ts`
  에 아직 없다.
- **`grammar_abi` 를 아무도 대조하지 않는다.** `_lang.yaml` 의 이 값은 손으로 적는 수이고,
  `packages/concepts/src/ingest.ts:84` 가 `${version}:${grammar_abi}` 를 캐시 키로 쓸 뿐이다. Rust 쪽
  검사는 `crates/parse/tests/scan.rs:52` 의 `abi >= 13` 하나다. **업스트림 `tree-sitter-python` 의
  master 는 이미 `LANGUAGE_VERSION 15` 다** — 크레이트를 0.25 대로 올리면 실제 ABI 는 15 가 되는데
  `_lang.yaml` 이 14 로 남아 있어도 아무 데서도 안 걸리고, 캐시 키가 안 바뀌어 문법이 달라진 뒤에도
  옛 파생 행이 살아남는다. `languages()` 가 내는 `abi` 와 `_lang.yaml.grammar_abi` 를 대조하는 시험
  한 줄이 필요하다.

---

## §9 오개념

`misconceptions:` 와 오답 `diag` 가 그대로 쓸 데이터다. 출처는 §10.
progmiscon.org 의 이름만 참조로 붙였다 — **문장은 가져오지 않았다**(재사용 라이선스 없음).

| # | 무엇을 믿나 | 실제로는 | 붙는 개념 | 참조 |
|---|---|---|---|---|
| 1 | `b = a` 는 복사다 | 같은 것을 둘이 가리킨다. `a.append(1)` 이 `b` 에서도 보인다 | `py/assignment` · `py/list-append` | `AssignmentCopiesObject` |
| 2 | 기본값 `[]` 는 부를 때마다 새로 생긴다 | 정의할 때 한 번 만들어져 호출 사이에 남는다 | `py/default-argument` | 파이썬 공식 튜토리얼 「Default Argument Values」 |
| 3 | 조건 자리에는 참·거짓만 온다 | 무엇이든 온다. 빈 리스트·`""`·`0` 이 거짓이다 | `py/truthiness` | `NoAtomicExpression` |
| 4 | `is` 와 `==` 는 같다 | `is` 는 같은 자리인지를 본다. 작은 정수에서 우연히 맞아 습관이 굳는다 | `py/is-identity` | `AssignCompares` |
| 5 | `3 / 2` 는 `1` 이다 | `1.5` 다. 버림은 `//` 로 따로 적는다 | `py/arithmetic` | Ettles 외(2018)가 정수 나눗셈을 오개념 최상위군으로 보고 |
| 6 | `"3" + 4` 가 `7` 또는 `"34"` 가 된다 | `TypeError` 로 멈춘다. 파이썬은 숫자와 글자를 안 섞는다 | `py/arithmetic` · `py/string-literal` | `PlusConcatenatesNumbers` |
| 7 | `"ab" * 3` 은 오류다 | `"ababab"` 다. `*` 가 순서 있는 것에 쓰이면 되풀이다 | `py/arithmetic` | `NoSequenceRepetition` |
| 8 | 함수 안에서 이름에 넣으면 바깥이 바뀐다 | 그 함수 안의 새 이름이 된다. 읽기만 하려다 넣으면 `UnboundLocalError` 가 난다 | `py/assignment` · `cs/name-scope` | `py/assignment.yaml` 이 이미 적고 있는 오개념 |
| 9 | `return` 이 없으면 함수가 실패한다 | 조용히 `None` 을 돌려준다 | `py/return-statement` · `py/none-value` | `DeferredReturn`·`MultipleValuesReturn` 인접 |
| 10 | 함수 이름만 적으면 실행된다 | 괄호가 있어야 돈다. 이름만 적으면 함수가 값으로 남는다 | `py/call-expression` | `ParenthesesOnlyIfArgument` |
| 11 | 들여쓰기는 보기 좋으라고 하는 것이다 | 묶음의 경계 자체다. 한 칸이 어긋나면 다른 프로그램이 된다 | `py/if-statement` · `py/while-loop` | 초심자 오류 분류의 「언어 이해 부족」·「구분자 불일치」군 |
| 12 | `if` 는 조건이 참인 동안 되풀이한다 | 한 번 판단하고 끝이다 | `py/if-statement` | `IfIsLoop`·`ConditionalIsSequence` |
| 13 | `f` 를 빼먹으면 오류가 난다 | 오류가 아니라 중괄호가 글자로 남은 문자열이 된다 | `py/f-string` | 확인 못 함 — 조사에서 연구 출처를 찾지 못했다. 현장 관찰로만 넣는다 |
| 14 | `{}` 는 빈 집합이다 | 빈 dict 다. 빈 집합은 `set()` 이다 | `py/dict-literal` | 확인 못 함 — 연구 출처 없음 |

13·14 는 근거가 약하다. 사전에 넣기 전에 실제 사용자 오답 로그로 확인하는 것이 맞다.

---

## §10 근거와 출처

**확인한 것**

- TIOBE 2026-08: Python 1위 18.53%, C 2위 11.10%, 전년 대비 -7.61%p — https://www.tiobe.com/tiobe-index/python/ ·
  https://www.techrepublic.com/article/news-tiobe-august-2026-java-nears-c-plus-plus/
- Exercism Python 트랙 `config.json` (MIT · © 2021 Exercism) — https://github.com/exercism/python/blob/main/config.json
  개념 **67개**, 개념 연습 **17개**. 선행 사슬로 잰 깊이 0~3 은
  `basics`(0) → `bools`·`numbers`(1) → `conditionals`(2) → `comparisons`·`strings`(3).
  **간선은 가져오지 않았다**(D148) — 여기서도 반례가 나온다: `functions` 는 개념 목록에 있는데
  그것을 가르치는 연습이 아예 없고(`basics` 안에 접혀 있다), `loops` 는 깊이 6, `classes` 는 깊이 10 이다.
  간선을 베끼면 반복문이 0장에 못 들어간다.
- tree-sitter-python `v0.23.6` — `src/parser.c` 의 `LANGUAGE_VERSION` = **14** ·
  `grammar.js` 의 `string`/`interpolation`/`subscript`/`slice`/`dictionary`/`set`/`decorated_definition`/
  `named_expression`/`augmented_assignment` 규칙 —
  https://github.com/tree-sitter/tree-sitter-python/tree/v0.23.6
- 같은 저장소 `master` 의 `src/parser.c` — `LANGUAGE_VERSION` = **15**. 크레이트를 올릴 때 `_lang.yaml`
  이 따라가야 한다는 근거다.
- progmiscon.org 정적 API(https://progmiscon.org/json/data.json)의 파이썬 오개념 **32개** — 이름만 참조.
  전체 인벤토리는 4개 언어 · 58개 개념 · 247건. **재사용 라이선스가 없어 문장은 가져오지 않았다**(D148).
- Ettles, Luxton-Reilly, Denny, "Common logic errors made by novice programmers", ACE '18 —
  https://dl.acm.org/doi/10.1145/3160489.3160493 . 오류 있는 코드 조각 15,000건 분류. 오개념이
  논리 오류의 최다 원천이고 학생이 가장 못 고치는 종류라는 결론, 정수 나눗셈이 그 예시.
- "A Systematic Review of Common Beginner Programming Mistakes" (2025) — https://arxiv.org/html/2504.16644v1 .
  2003~2024 논문 21편. 빈도 상위 범주: 언어 이해 부족 18 · 타입 불일치 15 · 함수 오용 12 ·
  연산자 오용 12 · 구분자 불일치 11. 자바가 주 언어이고 파이썬이 그다음이다.
- 리포 안에서 확인한 것: `resolvePy`(`packages/concepts/src/resolve-imports.ts:233`) ·
  `prereqDepth` 가 `essential` 밖 선행을 무시한다(`packages/concepts/src/new-rank.ts:66`) ·
  `zeroChapterPlates` 의 정렬·상한(`packages/concepts/src/zero-chapter.ts:98`) ·
  golden 목록에 `py` 없음(`crates/parse/tests/golden.rs:165`) ·
  `grammar_abi` 대조 없음(`crates/parse/tests/scan.rs:52` 의 `abi >= 13` 이 전부).

**확인 못 한 것**

- 파이썬 f-string 의 `f` 접두 한 글자를 tree-sitter 쿼리로 따로 캡처할 수 있는지(§8 ⑥).
- LLM 이 생성한 파이썬 코드의 구문 분포를 잰 공개 실측. §1 의 「무엇이 쏟아지는가」는 관찰이고
  수치가 아니다. FastAPI 가 2025-12 에 GitHub 별 수로 Flask 를 넘었다는 2차 보도는 찾았으나
  1차 자료로 확인하지 못했다.
- 오개념 13·14 의 연구 출처.
