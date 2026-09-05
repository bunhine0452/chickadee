# 파이썬 커리큘럼 조사 — `py`

조사 시점 2026-09-04. 바닥 여덟은 이미 서 있다(D152, 커밋 `f8d00da`) — §2 는 새로 짓는 목록이 아니라
**이미 있는 것의 재검토**다. 새로 제안하는 것은 §3 부터다.

> **2026-09-05 — 코스 3부와 실측이 [`docs/plan/python-axis.md`](../plan/python-axis.md) 에 있다.**
> 이 문서는 사용자 리포를 **안 보고** 짠 설계표이고(§3·§4 의 34개), 그쪽은 사용자 리포 셋
> (`adelie` 139파일 · `ECC` 63 · `MonggleMonggle` 16, 코드 38,550줄)을 `ast` 로 전부 파싱해 잰
> 사용처 수와 그 위에 세운 부 배치다. **부 배치는 그쪽이 정본**이고 여기 §2.5 가 요약이다.
> 실측이 이 문서를 고친 자리 셋: ⓐ `py/arithmetic` 사용처의 51 %가 셈이 아니다(§2 ⓑ 의 확대판 — **S8 이 수리, 정밀도 94.9 %**)
> ⓑ `py/type-hint` 은 심화가 아니라 2부다(2,926곳) ⓒ `py/set-and-membership` 이 새로 선다.
>
> **2026-09-05 — 3부 앞에 0부 「이 언어의 값과 식」을 붙였다(§1.5).** 사용자 요청
> (「기초부터 심화까지 · 언어의 동작 원리부터 · 정수형·실수형·연산식」)이 지금 코스에 자리가
> 없어서다. 0부는 `cs/` 43장(D157)에 간선을 걸어 「왜」를 대고, **1부에서 일곱 장 · 2부에서 두 장을
> 가져간다** — §2.5 의 부 배치가 §1.5.4 로 갱신됐다.

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

## §1.5 0부 「이 언어의 값과 식」 — 정식 코스 3부 앞에 붙는 부

**결정 등록부 초안 (번호 미정 — 오케스트레이터가 매긴다).** 정본 §4 의 정식 코스는 3부(바닥·객체·
프레임워크)인데, 그 1부가 이미 「변수·조건·반복·함수」로 시작한다. **값이 무엇인지를 안 가르치고
값을 옮기는 문법부터 가르친다.** 사용자 요청은 「정수형·실수형·연산식을 이해하고 말 그대로 언어를
이해한다는 느낌」이고, 그 자리가 지금 비어 있다. 0부는 그 자리다.

**지금 사전이 무엇을 못 하는지 한 줄로.** `py/arithmetic` 의 규칙은 「나누기가 딱 떨어져도 소수를
낸다」이고, 이것은 **무슨 일이 일어나는지**의 답이지 **왜**의 답이 아니다. 「왜 자바에서는 `7/2` 가
`3` 인데 파이썬은 `3.5` 인가」·「`0.1 + 0.2` 가 왜 안 떨어지나」·「`2 + 3 * 4` 가 어떤 순서로 접히나」는
문법 층에 답이 없다. 답은 `cs/` 43장(D157 · [`cs.md`](./cs.md))에 있고 **그 층은 이미 서 있다.**
0부가 하는 일은 새 이론을 만드는 것이 아니라 **파이썬 개념과 `cs/` 를 간선으로 잇고 그 간선마다
판을 하나씩 세우는 것**이다.

### §1.5.1 축 여덟 · 19판

각 행의 다섯 열이 이 부의 계약이다 — **어느 기계에 걸리나**(`cs/`) · **어떤 그림이 그것을 보이나**
(그림 계약은 I2 세션이 `design/system/diagrams.md` 에 만드는 중) · **초보가 실제로 틀리는 자리**
(문항의 씨앗) · **문항 형식**(형식 계약은 I1 세션이 `docs/program/fundamentals.md` 에 확정 중 —
`value` 값 적기 · `step` 한 걸음씩 · `bits` 비트로 보기 · `table` 표 채우기 · `build` 거꾸로 만들기 ·
`predict` 예측 후 실행).

**출처 표시** — `1부↑`/`2부↑` 는 §2.5 의 부 배치에서 올라온 것, `신규` 는 이 문서가 새로 세우는 것.

#### 축 A — 정수형과 그 한계 (3판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 |
|---|---|---|---|---|---|
| `py/value-bits` **신규** | 값은 켜짐·꺼짐의 묶음이고, 같은 묶음을 타입이 다르게 읽는다 | `binary-representation` · `bit-and-byte` · `type` | 비트 배열 | `0b1010` 을 「천십」으로 읽는다 | `bits` |
| `py/number-literal` `1부↑` | `1` 과 `1.0` 은 **다른 종류**다 | `type` | 값 상자 | `1 == 1.0` 은 참인데 `type(1) is type(1.0)` 은 거짓 — 둘을 같은 사실로 안다 | `value` |
| `py/integer-limit` **신규** | 파이썬 정수에는 자릿수 한계가 없다. **그것이 예외다** | `integer-overflow` | 비트 배열 (자리가 늘어난다) | `2**100` 이 되는 것을 「컴퓨터는 원래 그렇다」로 일반화한다 — 다음 언어에서 되감기를 만난다 | `bits` |

#### 축 B — 실수형과 왜 안 떨어지나 (2판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 |
|---|---|---|---|---|---|
| `py/float-inexact` **신규** | `0.1 + 0.2` 가 `0.30000000000000004` 다 — 2진수로 `0.1` 을 정확히 못 적는다 | `floating-point` · `binary-representation` | 비트 배열 (부호·지수·가수 세 칸) | `round(a+b, 2) == 0.3` 으로 넘어가고 `==` 로 소수를 견주는 습관이 남는다 | `value` |
| `py/integer-division` **신규** | 나누기가 **둘**이다 — `/` 는 늘 `float`, `//` 는 **아래로** 버린다 | `floating-point` · `integer-overflow` | 타입 변환 사다리 | `-7 // 2` 를 `-3` 으로 예상한다. 실제는 `-4` — 0 쪽이 아니라 **아래**로 내린다 | `table` |

#### 축 C — 문자열과 인코딩 (3판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 |
|---|---|---|---|---|---|
| `py/string-literal` `1부↑` | 따옴표 넷이 같은 값이고, **붙여 쓴 두 리터럴이 연산자 없이 이어진다** | `text-encoding` | 값 상자 | 리스트에서 콤마 하나가 빠지면 항목 둘이 조용히 한 문자열이 된다 | `value` |
| `py/f-string` `2부↑` | 중괄호 안이 **식**이라 그 자리에서 계산된다 | — | 평가 트리 | 앞의 `f` 가 빠지면 오류가 아니라 중괄호가 글자로 남는다 | `predict` |
| `py/text-length` **신규** | `str` 은 글자, `bytes` 는 바이트. `.encode()` 가 그 사이의 다리다 | `text-encoding` · `bit-and-byte` | 타입 변환 사다리 | `len("가")` 는 1 인데 `len("가".encode())` 는 3 — 「길이」가 둘인 것을 모른다 | `value` |

#### 축 D — 참·거짓 (2판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 |
|---|---|---|---|---|---|
| `py/boolean-literal` `1부↑` | 첫 글자가 대문자이고, **`bool` 은 `int` 의 부분집합**이다 | `type` | 값 상자 | `True + True == 2` · `sum([True, False, True]) == 2` 를 오류로 예상한다 | `value` |
| `py/truthiness` `1부↑` | 빈 것이 거짓이다 — 빈 리스트·빈 글자·`0` | — | 값 상자 (참 칸·거짓 칸) | `x = 0` 일 때 `if x:` 와 `if x is not None:` 이 갈린다 | `table` |

#### 축 E — 연산자와 우선순위 (3판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 |
|---|---|---|---|---|---|
| `py/arithmetic` `1부↑` | 연산자가 값 둘을 받아 값 하나를 낸다 | — | 평가 트리 | `"ab" * 3` 이 되는 줄 몰라 `+` 로만 잇는다. `[0] * n` 도 같은 자리다 | `step` |
| `py/operator-precedence` **신규** | `2 + 3 * 4` 가 어떤 순서로 접히나 | — | 평가 트리 | `2 ** 3 ** 2` 를 왼쪽부터 접어 64 로 읽는다. `**` 만 **오른쪽부터**라 512 다 | `step` |
| `py/bool-op-value` **신규** | `and`/`or` 는 참·거짓이 아니라 **피연산자 하나**를 돌려준다 | — | 평가 트리 (가지 하나가 안 열린다) | `x = a or 0` 이 `a = 0` 일 때도 `0` 이라 「기본값」이 안 먹는다 | `value` |

#### 축 F — 형 변환 (2판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 |
|---|---|---|---|---|---|
| `py/implicit-conversion` **신규** | 섞으면 넓은 쪽으로 올라간다 — `bool` ⊂ `int` ⊂ `float` | `type` | 타입 변환 사다리 | `1 + 2.0` 을 `3` 으로 예상한다. 실제는 `3.0` 이고, **문자열과 숫자는 자동으로 안 섞인다**(`"1" + 1` 이 그 자리에서 멈춘다) | `table` |
| `py/explicit-conversion` **신규** | `int()`·`float()`·`str()` 은 바꾸는 것이 아니라 **새 값을 만든다** | `type` · `static-vs-dynamic-typing` | 타입 변환 사다리 | `int("3.7")` 을 3 으로 예상한다. `int(3.7)` 은 3 이지만 `int("3.7")` 은 `ValueError` 다 | `predict` |

#### 축 G — 대입과 이름 (2판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 |
|---|---|---|---|---|---|
| `py/assignment` `1부↑` | 만드는 줄과 옮기는 줄이 같은 모양이다 | `state` | 메모리 줄 | 대입이 **문**이라 값이 없다 — `if x = 1:` 이 문법 오류인 이유(자바·JS 는 통과한다) | `step` |
| `py/reference-binding` **신규** | 이름은 값을 **담지 않고 가리킨다** | `value-vs-reference` · `aliasing` | 메모리 줄 (화살표 둘이 한 상자로) | `b = a` 로 리스트를 복사했다고 믿는다. `b.append(1)` 뒤 `a` 도 늘어난다 | `predict` |

#### 축 H — 비교와 같음 (2판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 |
|---|---|---|---|---|---|
| `py/comparison` `1부↑` | `==` 는 값을 견주고, **연쇄 비교**가 문법으로 있다 | — | 평가 트리 | `a == b == c` 를 `(a == b) == c` 로 읽는다. 파이썬은 `a == b and b == c` 다 | `step` |
| `py/is-identity` `2부↑` | `is` 는 같은 **자리**냐를 묻는다 | `identity-vs-equality` · `value-vs-reference` | 메모리 줄 | 작은 정수·짧은 문자열에서 `is` 가 우연히 맞아 습관이 굳는다. `256 is 256` 은 참, `257 is 257` 은 구현에 따라 갈린다 | `predict` |

**그림 여섯 중 다섯만 쓴다.** 비트 배열 · 평가 트리 · 값 상자 · 메모리 줄 · 타입 변환 사다리.
**스택 프레임은 0부에 없다** — 함수가 아직 안 나왔다. 1부 `py/function-definition`·
`py/return-statement` 가 그 그림의 첫 소비자다.

### §1.5.2 언어마다 다른 자리

세 언어(파이썬 · JS/TS · 자바)를 같은 여덟 축으로 대조한다. **파이썬 열이 이 문서의 몫**이고
나머지 둘은 [`ts.md`](./ts.md) §1.5 · [`java.md`](./java.md) §1.5 가 같은 표를 든다.
이 표가 0부의 존재 이유다 — 같은 축에서 세 언어의 답이 **서로 다르고**, 그 차이를 모르면
두 번째 언어에서 첫 언어의 습관이 그대로 틀린 답이 된다.

| 축 | **파이썬** | JS / TS | 자바 |
|---|---|---|---|
| 정수형 | **자릿수 한계가 없다** — `2**100` 이 그대로 | 정수 타입이 **없다**. 전부 64비트 부동소수이고 `MAX_SAFE_INTEGER`(2⁵³−1) 위는 조용히 어긋난다 | `int` 32비트 고정. `MAX_VALUE + 1` 이 가장 작은 음수 |
| 나눗셈 | `/` 는 늘 `float`, `//` 는 **아래로** 버림 (`-7 // 2 == -4`) | `/` 는 늘 소수. 버림은 `Math.floor`(아래) 와 `Math.trunc`(0 쪽)로 갈린다 | `/` 가 정수끼리면 **0 쪽으로** 버림 (`-7 / 2 == -3`) |
| 실수 | `0.1 + 0.2 != 0.3`. 정확한 소수는 표준 라이브러리 `decimal` | 같음. 정수도 같은 타입이라 **큰 정수까지 샌다** | 같음. `float`/`double` 둘이고 리터럴 기본이 `double`. 돈은 `BigDecimal` |
| 문자열 길이 | `len` 이 **코드 포인트** — `len("가") == 1`, 바이트는 `.encode()` 로 3 | `.length` 가 **UTF-16 코드 단위** — `'👍'.length === 2` | `.length()` 도 UTF-16 코드 단위. **`char` 타입이 따로 있고** 이모지 하나가 `char` 둘 |
| 참·거짓 | `bool` ⊂ `int` (`True + True == 2`). 빈 것이 거짓 | 거짓이 **여섯**(`false 0 '' null undefined NaN`)이고 `[]`·`{}` 는 참 | `boolean` 이 숫자가 **아니고** 조건 자리에 `boolean` 말고는 못 온다 |
| 형 변환 | 수 사이는 자동으로 올라가지만 **문자열과 숫자는 안 섞인다** (`"1" + 1` 이 멈춘다) | **자동으로 섞인다** — `1 + '1' === '11'`, `'3' - 1 === 2` | 넓히기는 자동, 좁히기는 `(int)` 명시. 문자열은 `+` 로만 자동 |
| 대입 | 대입은 **문**이라 값이 없다 (`:=` 만 식) | 대입이 **식** — `a = b = 0` 이 된다 | 대입이 **식** — `if (done = true)` 가 `boolean` 일 때만 통과한다 |
| 같음 | `==` 는 값, `is` 는 자리. `is` 가 작은 정수에서 우연히 맞는다 | `===` 는 타입까지, `==` 는 강제 변환. `NaN !== NaN` | `==` 는 **자리**, `.equals` 는 내용. `Integer` 는 −128~127 만 캐시 |

**이 표에서 파이썬이 혼자인 자리 둘.** ① 정수에 한계가 없는 것 ② 대입이 문인 것.
둘 다 「파이썬이 관대하다」로 배우면 다음 언어에서 정확히 그 자리에서 막힌다.
0부 `integer-limit` 과 `assignment` 의 문항이 **다른 언어의 답을 오답 선택지로 쓴다** —
D4 전이의 반대 방향이고, 이것이 이 부가 하는 일 중 하나다.

### §1.5.3 실측 — 0부 개념이 사용자 리포에 몇 곳 나오나

`adelie`(py 139파일 35,553줄) · `ECC`(py 63파일 10,901줄) 두 리포를 정규식으로 셌다.
**주석과 문자열을 먼저 지우고** 셌으므로 §1.6 의 원시 계수와 값이 다르다. 정규식은 tree-sitter 보다
헐거우므로 **하한**으로 읽는다.

| 0부 판 | 근거 모양 | `adelie` (py 139) | `ECC` py (63) | 판정 |
|---|---|---|---|---|
| `value-bits` · `number-literal` | 정수 리터럴 | 2,157곳 / 118파일 | 718 / 45 | 내 코드에서 확인 |
| `integer-limit` | `**` · 2⁶³ 넘는 정수 리터럴 | `**` **0곳** · 2⁶³ 초과 **0개** | `**` 1곳 · 2⁶³ 초과 **0개** | **합성 + 「네 코드엔 없다」**(`scale`) |
| `float-inexact` | `round(` · `decimal` | `round` 11 / 4 · `decimal` **0곳** | 둘 다 **0곳** | **합성 + 「네 코드엔 없다」**(`scale`) |
| `integer-division` | `//` | 10곳 / 4파일 | 5 / 2 | 얇다 — `thin_threshold`(min_sites 3)를 겨우 넘는다 |
| `string-literal` | 따옴표 리터럴 | 14,197곳 / 135파일 | 4,792 / 59 | 내 코드에서 확인 |
| `f-string` | `f"` · `f'` | 1,276곳 / 80파일 | 377 / 27 | 내 코드에서 확인 |
| `text-length` | `.encode(` · `.decode(` · `encoding=` | 310곳 / 82파일 | 49 / 9 | 내 코드에서 확인 |
| `boolean-literal` | `True` · `False` | 891곳 / 109파일 | 306 / 42 | 내 코드에서 확인 |
| `truthiness` | 비교 없는 `if x:` | 438곳 / 68파일 | 134 / 22 | 내 코드에서 확인 |
| `arithmetic` | `/` (셈하기 대표) | 899곳 / 86파일 | 240 / 17 | 내 코드에서 확인 |
| `operator-precedence` | `+` 와 `*` 가 섞인 식 | 10곳 / 5파일 | 10 / 3 | 얇다 |
| `bool-op-value` | `and` · `or` · `not` | 1,076곳 / 104파일 | 346 / 40 | 내 코드에서 확인 |
| `implicit-conversion` | (정수·실수가 섞인 식) | **못 쟀다** | **못 쟀다** | 아래 |
| `explicit-conversion` | `int(` · `float(` · `str(` · `bool(` | 208곳 / 59파일 | 70 / 21 | 내 코드에서 확인 |
| `assignment` · `reference-binding` | 대입 | 6,396곳 / 131파일 | 2,078 / 56 | 내 코드에서 확인 |
| `comparison` | `==` · `!=` | 1,053곳 / 106파일 | 403 / 39 | 내 코드에서 확인 |
| `is-identity` | `is` · `is not` | 283곳 / 63파일 | 79 / 27 | 내 코드에서 확인 |

**19판 중 셋이 사용처가 없거나 얇다** — `integer-limit`(0) · `float-inexact`(0~11) · `integer-division`(5~10).
셋 다 **정확히 이 부가 존재하는 이유의 자리**다. 리포에 없어서 옛 방식(리포가 쓰는 문법만)으로는
영영 못 가르치던 것들이고, D177 규칙 ①(합성으로 가르치고 「네 코드엔 없다」를 명시)이 그대로 걸린다.
사유는 셋 다 `scale` 이다 — 웹 API 서버는 큰 정수도 정밀 소수도 안 쓴다.

**못 잰 것 하나.** `implicit-conversion`(`1 + 2.0`)은 정규식으로 못 센다 — 두 피연산자의 타입을 알아야
하는데 정규식은 모른다. tree-sitter 로도 못 센다(`binary_operator` 가 타입을 모른다 — §2 ⓑ 가 같은
이유로 지적한 자리다). **실행 없이는 못 재는 개념**이고, 그러면 사용처 대신 합성이 정본이다.

### §1.5.4 부 배치가 어떻게 바뀌나 — 겹침 정리

0부는 새 개념 열 장을 세우고 **아홉 장을 위에서 내려받는다.** 내려받은 자리는 원래 부에서 **지운다** —
같은 개념이 두 부에 서면 판이 두 번 나오고, 그 순간 「기초부터 심화까지 이어진다」가 깨진다.

| 어디서 | 무엇이 0부로 | 몇 장 |
|---|---|---|
| §2.5 1부 바닥 (16장) | `assignment` · `number-literal` · `string-literal` · `boolean-literal` · `arithmetic` · `comparison` · `truthiness` | **7** |
| §2.5 2부 자료구조와 객체 (16장) | `f-string` · `is-identity` | **2** |
| 신규 | `value-bits` · `integer-limit` · `float-inexact` · `integer-division` · `text-length` · `operator-precedence` · `bool-op-value` · `implicit-conversion` · `explicit-conversion` · `reference-binding` | **10** |

**부 경계가 「값과 식」 / 「흐름과 묶기」 / 「자료구조와 객체」로 다시 그어진다.** 이 선은 임의가
아니라 [`README.md`](./README.md) §2 가 이미 적어 둔 것이다 — 기초 단계에 「식(expression)만이 아니라
문(statement)이 들어간다」. 0부가 식을 가져가면 1부에 문만 남고, 그것이 이 부의 경계다.

| 부 | 이름 | 판 | 담기는 것 |
|---|---|---|---|
| **0부** | 이 언어의 값과 식 | **19** | 위 축 여덟 |
| **1부** | 흐름과 묶기 | **9** | `none-value` · `if-statement` · `while-loop` · `for-in` · `list-literal` · `function-definition` · `call-expression` · `return-statement` · `import` |
| **2부** | 자료구조와 객체 | **14** | `attribute-access` · `dict-literal` · `index-access` · `set-and-membership` · `tuple-unpacking` · `list-append` · `list-comprehension` · `type-hint` · `class-definition` · `default-argument` · `try-except` · `with-statement` · `lambda` · `decorator` |
| **3부** | 프레임워크 | 10~12 | `pyapp/` · `pyweb/` (§3.2 — 변경 없음) |

**판 수와 일수** (하루 새 판 2장 · D12 · 정본 §2 의 하루 15분):

| 부 | 판 | 일 |
|---|---|---|
| 0부 | 19 | **10** (마지막 날 1장) |
| 1부 | 9 | 5 (마지막 날 1장) |
| 2부 | 14 | 7 |
| 3부 | 10~12 | 5~6 |
| **합** | **52~54** | **27~28** |

0부 이전은 42~44판 = **21~22일**이었다. **0부가 더하는 것은 열흘**이고, 그 열흘 뒤에 사용자는
「`0.1 + 0.2` 가 왜 안 떨어지나」에 답할 수 있다. 열흘이 맞는 값인지는 **사용자 결정이다** —
줄이려면 축 A·B 를 각 1판으로 접어 15판(8일)까지 내려간다. 접으면 잃는 것은 비트 배열 그림이 걸리는
자리 셋(`value-bits`·`integer-limit`·`float-inexact`)이 하나로 뭉쳐 「값은 비트다」를 한 판에서
정수와 실수 둘 다로 보여야 한다는 것이다.

### §1.5.5 0장(프롤로그)과의 관계 — 안 건드린다

`ZERO_CHAPTER_MAX = 24` 의 0장과 이 0부는 **다른 것**이다. 0장은 `zeroChapterPlates` 가 `_lang.yaml` 의
`essential` 에서 깊이 ≤ 2 를 뽑아 만드는 예고이고, 0부는 코스의 부다. 이름이 닮아 헷갈리므로 적어 둔다.

다만 하나가 걸린다 — `essential` 을 24 로 두었을 때 0장 후보가 정확히 **24/24** 였다(§5).
0부가 신규 열 장을 `essential` 에 올리면 후보가 **34** 가 되어 상한이 열을 자르고, 자르는 순서의
넷째 키(id 알파벳순)가 실제로 돌기 시작한다 — D147 이 피하려던 자리다. **세 갈래가 있다.**

1. 0부 신규 열 장을 `essential` **밖**에 둔다. 그러면 0장은 지금 그대로 24/24 이고 0부는 코스에서만
   돈다. 대신 구멍 지도(03 §6)의 분모에서 빠진다.
2. `essential` 에 넣고 `ZERO_CHAPTER_MAX` 를 30 으로 올린다 — 0장이 12일에서 15일이 된다.
3. `zeroChapterPlates` 의 입력을 「`essential` + 0부」로 갈라 두 목록으로 만든다.

**안 정했다.** 세 갈래의 비용을 재려면 `zeroChapterPlates` 를 실제로 돌려야 하고 그것은 이 문서의
범위 밖이다. [`cs.md`](./cs.md) §6 의 미해결(「상한이 24판인데 `cs/` 깊이 ≤ 2 만 23이다」)과 **같은
결정**이라 함께 재는 것이 맞다.

→ **정해졌다(D184, 2026-09-05): 상한 폐지.** 셋 중 어느 것도 아니다 — `essential` 에 넣고 **자르지 않는다.**
0장 후보 34 가 전부 든다(하루 2장이면 17일). 넷째 키가 돌 일이 없다.

---

### §1.5.6 I6 조정 규약 — 공통 id 조각 · 0부 상한 · `cs/` 신청

세 언어(그리고 나머지 일곱)가 **같은 축에 같은 id 조각**을 쓴다. 조각이 같으면 `universal` 로
`common/` 에 묶기 쉽고, 다르면 [`cs.md`](./cs.md) §10.1 이 적은 사고 — 「같은 기계에 여덟 가지 이름이
붙었다」 — 가 0부에서 되풀이된다.

| 조각 | 축 | **`py`** | `ts` | `java` |
|---|---|---|---|---|
| `value-bits` | A | `py/value-bits` **신규** | `ts/value-bits` **신규** | `java/value-bits` **신규** |
| `integer-literal` | A | `py/number-literal` | `ts/number-literal` | `java/variable-declaration` |
| `integer-limit` | A | `py/integer-limit` **신규** | `ts/number-is-double` | `java/integer-limit` **신규** |
| `float-type` | B | `py/number-literal` 이 겸한다 | `ts/number-is-double` 이 겸한다 | `java/floating-type` **신규** |
| `float-inexact` | B | `py/float-inexact` **신규** | `ts/float-inexact` **신규** | `java/float-inexact` **신규** |
| `integer-division` | B | `py/integer-division` **신규** | `ts/integer-division` **신규** | `java/arithmetic` 이 겸한다 |
| `string-literal` | C | `py/string-literal` | `ts/string-literal` | `java/string-literal` |
| `string-interpolation` | C | `py/f-string` | `ts/template-literal` | **없다** — `java/string-concat` 이 그 자리 |
| `text-length` | C | `py/text-length` **신규** | `ts/text-length` **신규** | `java/text-length` **신규** |
| `boolean-literal` | D | `py/boolean-literal` | `ts/boolean-literal` | `java/boolean-literal` |
| `truthiness` | D | `py/truthiness` | `ts/truthy-falsy` | `java/boolean-only-condition` **신규** (반대 방향 — 못 한다는 규칙) |
| `absent-value` | D | 1부 `py/none-value` | `ts/undefined-null` | 2부 `java/null` |
| `arithmetic` | E | `py/arithmetic` | `ts/arithmetic` | `java/arithmetic` |
| `operator-precedence` | E | `py/operator-precedence` **신규** | `ts/operator-precedence` **신규** | `java/operator-precedence` **신규** |
| `logical-operator-value` | E | `py/bool-op-value` **신규** | `ts/operator-precedence` 가 겸한다 | **없다** — `&&` 가 `boolean` 만 낸다 |
| `conditional-expression` | E | 부 밖 (심화) | `ts/conditional-ternary` | 부 밖 (표본 13곳) |
| `implicit-conversion` | F | `py/implicit-conversion` **신규** | `ts/implicit-conversion` **신규** | `java/implicit-conversion` **신규** |
| `explicit-conversion` | F | `py/explicit-conversion` **신규** | `ts/explicit-conversion` **신규** | `java/explicit-conversion` **신규** |
| `assignment` | G | `py/assignment` | `ts/const-declaration` · `ts/reassignment` | `java/assignment` |
| `reference-binding` | G | `py/reference-binding` **신규** | `ts/reference-sharing` | `java/reference-binding` **신규** |
| `comparison` | H | `py/comparison` | `ts/comparison` | `java/comparison` |
| `identity-equality` | H | `py/is-identity` | `ts/loose-equality` | `java/reference-equality` |

**이 표가 드러내는 구멍 셋.** ① 자바에는 문자열 보간이 없다(JEP 430 철회) — `string-concat` 이
그 자리를 진다. ② 자바의 `&&` 는 `boolean` 만 내므로 `logical-operator-value` 조각이 안 선다.
③ `truthiness` 는 자바에서 **반대 방향**이다 — 파이썬·JS 는 「무엇이 거짓이 되나」이고 자바는
「`boolean` 말고는 못 온다」다. 같은 조각 이름을 쓰되 `universal` 은 안 건다.

#### 0부 상한 — 언어당 12장

I6 규약: 0부가 `essential` 에 새로 올리는 개념은 **언어당 12장까지**다. 근거는 0장 상한 24 에서
기초 8 을 뺀 값이고, 이 상한이 없으면 §1.5.5 가 적은 「후보가 넘쳐 id 알파벳순이 실제로 돈다」가
그대로 일어난다.
→ D184(2026-09-05)로 그 근거는 사라졌다 — 0장 상한이 폐지됐다. 12 는 저작 규모의 상한으로만 남는다(README §12 규약 8).

`essential` 에 새로 드는 것은 **신규 열 장**이다 — `value-bits` · `integer-limit` ·
`float-inexact` · `integer-division` · `text-length` · `operator-precedence` · `bool-op-value` ·
`implicit-conversion` · `explicit-conversion` · `reference-binding`. 나머지 아홉은 §5 가 제안한
`essential` 24 에 **이미 들어 있고** 부만 옮긴 것이라 0장 후보를 안 늘린다. **10 ≤ 12 — 상한을 지킨다.**

**0부의 판 수(19)와 이 12는 다른 수다.** 판은 **코스에서 며칠 걸리나**를 재고,
12는 **0장 후보와 구멍 지도 분모가 얼마나 커지나**를 잰다. 이미 `essential`(24)에 있던 것을
0부로 옮기는 것은 후자를 한 톨도 안 늘린다 — 부는 **교재 축**이고 `essential` 은 **분모 축**이다.

#### `cs/` 에 없는 것 셋 — 신청 목록

`cs/` 43장(D157)을 0부의 간선으로 쓰려고 대조했더니 **셋이 없다.**

| 신청 `cs/` id | 한 줄 | 이 문서에서 이것을 요구하는 판 | 그림 |
|---|---|---|---|
| `cs/operator-precedence` | 식은 왼쪽부터 읽히지 않는다 — 연산자마다 세기와 방향이 있고, 그것이 **접히는 순서**를 정한다 | `py/operator-precedence` · `py/arithmetic` | **평가 트리** |
| `cs/type-conversion` | 타입이 다른 값을 만나면 ① 언어가 바꾸거나 ② 사람이 적거나 ③ 멈춘다 — 셋 중 무엇이냐가 언어를 가른다 | `py/implicit-conversion` · `py/explicit-conversion` | **타입 변환 사다리** |
| `cs/truthiness` | 참·거짓이 아닌 값을 조건 자리에 두면 무슨 일이 일어나나 | `py/truthiness` | 값 상자 |

**앞의 둘이 특히 크다** — I2 세션이 만드는 그림 여섯 중 **평가 트리와 타입 변환 사다리 둘이
이 두 개념의 그림**이다. `cs/` 에 개념이 없으면 그 그림이 걸릴 데가 없고, 언어마다 따로 그리면
`cs.md` §10.1 이 경고한 「같은 기계에 여러 이름」이 그림 층에서 되풀이된다.

셋을 세우는 것은 `dictionary/cs/**` 와 `docs/curriculum/cs.md` 의 일이라 **이 문서의 범위 밖**이다.
여기 적어 두는 것이 신청이다. 셋이 서기 전까지 위 표의 해당 칸은 「없음」으로 두고, 판은
`cs/` 간선 없이 선다 — 판은 뜨되 「왜」의 아래층이 비어 있다.

#### 파서 — 이 언어는 오늘 실제로 파싱된다

I6 이 찾은 것: `packages/dictionary/src/schema.ts:29` 의 `grammarSchema` 열거값에는 `c`·`cpp`·
`c_sharp`·`swift`·`dart` 가 있는데 `crates/parse/Cargo.toml` 의 `lang-*` 기능에는 없다. 그 다섯은
**사전이 로드되고 린트도 통과하는데 캡처가 0곳**이 된다 — [`README.md`](./README.md) §6 표의
「열었다」는 로드 단계이지 파서가 아니다.

**이 문서의 언어는 그 자리가 아니다.** `Cargo.toml` 을 직접 확인했다 — 문법 `python` 은
`lang-python` = `tree-sitter-python 0.23` 로 실제 링크되어 있고, §1.5.3 의 실측이 그 위에서 돈 것이 아니라 **정규식으로 돈 것**이므로
(정규식은 파서 유무와 무관하다) 두 사실을 섞지 않는다. 파서가 붙어 있다는 것은 **0부 판이
사용처를 실제로 얻는다**는 뜻이고, 사용처가 0 인 판(§1.5.3 의 「합성 + 「네 코드엔 없다」」)은
파서가 없어서가 아니라 **그 코드가 리포에 없어서** 0 이다. 그 둘은 다른 결론으로 이어진다 —
앞의 것은 크레이트를 붙이면 풀리고, 뒤의 것은 D177 규칙 ①(합성 + 사유 명시)이 답이다.

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

> **이 절의 1·2부 목록은 0부가 생기기 전의 것이다.** 0부(§1.5)가 1부에서 일곱 장
> (`assignment`·`number-literal`·`string-literal`·`boolean-literal`·`arithmetic`·`comparison`·
> `truthiness`) · 2부에서 두 장(`f-string`·`is-identity`)을 가져갔다. **갱신된 배치는 §1.5.4 의
> 표**이고 아래 표는 그 뺄셈의 원본으로 남긴다.

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
→ **D184 뒤에는 자를 것이 없다** — 반례의 전제(`.slice`)가 사라졌다. §4 열 개를 `essential` 에 넣을지는
이제 「프롤로그에 둘 만한가」만으로 정한다.

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

---

## §11 학습법 — 이 언어를 이해한다는 것

800줄 상한 때문에 갈라 냈다 → **[`py-learning.md`](./py-learning.md)**.
표기 기계 한 문장 · 교재 넷의 순서 대조 · 이 언어 특유의 연습(`pedagogy.md` §4 의 세 시험) ·
오개념 32건과 계산된 진단의 한계 · 실측 · §2~§5 에 낼 diff 일곱.
