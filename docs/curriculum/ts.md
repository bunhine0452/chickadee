# 커리큘럼 조사 — JavaScript / TypeScript (`ts`)

`ts` 는 **이미 36개가 서 있다**(`essential` 30 + 표기 짝 6). 그래서 이 문서는 목록을 새로 만들지 않고,
선 것을 재검토하고 지금 없는 축을 더한다. 조사일 2026-09-04.

> **2026-09-05 — 3부 앞에 0부 「이 언어의 값과 식」을 붙이고, 부 배치를 처음 세웠다(1.5).**
> 사용자 요청(「기초부터 심화까지 · 언어의 동작 원리부터 · 정수형·실수형·연산식」)이 지금 코스에
> 자리가 없어서다. 0부는 `cs/` 43장(D157)에 간선을 걸어 「왜」를 대고, `essential` 30 중 열 장과
> §3·§4 의 넷을 가져간다. **1.5.4 가 0·1·2·3부 배치의 정본**이다.

---

## 1. 언어 좌표

TIOBE 2026-08 에서 **JavaScript 6위 · 2.63%**, **TypeScript 44위 · 0.37%**. TIOBE 는 검색 신호를 세므로
TS 를 실사용보다 낮게 잡는다 — State of JS 2025 는 응답자의 **40% 가 TS 만** 쓰고 **6% 만 JS 만** 쓴다고
보고했다. 이 6% 가 §5 판단의 분모다. 만들어지는 것: 웹 프런트(React·Next.js), Node/Bun API, CLI,
Electron·Tauri 앱, 그리고 이 리포 자신.

**바이브 코딩으로 나온 TS 는 이렇게 생겼다** — `export default function Page()` · `interface Props` ·
`type Status = 'idle' | 'loading'` · `useState<T>(…)` · `const res = await fetch(url)` ·
`if (!res.ok) throw new Error(…)` · `items.map((it) => …)` · `{ ...prev, done: true }` · `a?.b ?? fallback` ·
`catch (e) { … }` · `value as SomeType`.

여기서 곧바로 읽히는 것 하나. **`interface`·`type X =`·`: string`·`throw`·`{ }` 객체 리터럴·`import` 를
가리키는 개념이 사전에 하나도 없다.** 위 목록에서 사전이 짚을 수 있는 것은 `map`·spread·`?.`·`??`·
`await`·구조분해뿐이다. 사용처는 널렸는데 항목이 없다 — D147 의 「없는 것은 재료가 아니라 재료를
가리키는 사전 항목」이 여기서 한 번 더 열린다.

| 축 | 값 |
|---|---|
| `lang` | `ts` |
| `grammars` | `typescript` · `tsx` · `javascript` |
| 확장자 | `typescript`: `.ts .mts .cts` / `tsx`: `.tsx` / `javascript`: `.js .mjs .cjs .jsx` |
| 프레임워크 | 별도 네임스페이스 `react` (`detect: { dependency: react }`) — 개념 **1장**. 그 위층(프레임워크·진입점·실행 러너)의 계획은 [`docs/plan/js-framework-axis.md`](../plan/js-framework-axis.md) 로 갈라 뒀다 |

---

## 1.5 0부 「이 언어의 값과 식」 — 정식 코스 3부 앞에 붙는 부

**결정 등록부 초안 (번호 미정 — 오케스트레이터가 매긴다).** 정본 §4 의 정식 코스는 3부(바닥·객체·
프레임워크)이고, 자바는 D177 로 그 셋이 실제로 섰다. **JS/TS 에는 부 배치 자체가 아직 없다** —
`ts/_lang.yaml` 의 `essential` 30줄이 평평하게 늘어서 있고 어디까지가 바닥인지가 주석 위치로만
표시된다(§2). 이 절이 하는 일은 둘이다. ① **0부를 세운다** ② 남은 것을 1·2·3부로 나눈다.

**0부가 왜 필요한가 — 이 언어에서 특히.** 지금 `ts/arithmetic` 의 규칙은 「`+` 하나가 더하기이자
잇기다 — `1 + '1'` 이 멈추지 않고 `'11'` 이 된다」이고, 이것은 **무슨 일이 일어나는지**의 답이지
**왜**의 답이 아니다. 왜의 답은 「JS 에는 숫자 타입이 하나뿐이고 연산자가 타입을 강제 변환한다」이고,
그 문장은 문법 층에 없다. 답은 `cs/` 43장(D157 · [`cs.md`](./cs.md))에 있다 — 이미 서 있는 층이다.

**그리고 §4 가 이미 이것을 알고 있었다.** 심화 아홉 중 앞의 넷(`number-is-double` ·
`type-erasure` · `type-assertion` · `prototype-chain`)을 「**버그를 설명**한다」로 묶어 뒀는데,
`number-is-double` 은 심화가 아니라 **바닥이다.** 숫자가 한 종류뿐이라는 것을 모르면 `0.1 + 0.2` 도
`7 / 2` 도 `MAX_SAFE_INTEGER` 도 설명이 안 된다. 0부가 그 셋을 앞으로 끌어온다.

### 1.5.1 축 여덟 · 21판

각 행의 다섯 열이 이 부의 계약이다 — **어느 기계에 걸리나**(`cs/`) · **어떤 그림이 그것을 보이나**
(그림 계약은 I2 세션이 `design/system/diagrams.md` 에 만드는 중: 비트 배열 · 평가 트리 · 값 상자 ·
메모리 줄 · 스택 프레임 · 타입 변환 사다리) · **초보가 실제로 틀리는 자리**(문항의 씨앗) ·
**문항 형식**(형식 계약은 I1 최종본 `docs/program/fundamentals.md` §2.1·§2.2 — `value` 값 적기 ·
`step` 한 걸음씩 · `table` 표 채우기 · `build` 거꾸로 만들기, 그리고 J0 가 낸 `order`·`trace-table`).
**`bits` 와 `predict` 는 형식에서 내려갔다** — `bits` 는 `table` 의 한 배치이고 `predict` 는
`value` 의 **판정란**이다. 아래 「형식」 열은 그 결정에 맞춰 다시 적었다
([`ts-learning.md`](./ts-learning.md) §11.6 ①). **4지선다가 아니다.**

**출처 표시** — `기존` 은 `_lang.yaml` 의 `essential` 30 에 이미 있는 것, `중심↑`/`심화↑` 는 §3·§4 의
제안에서 올라온 것, `신규` 는 이 절이 새로 세우는 것.

#### 축 A — 정수형과 그 한계 (2판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 | 사전 |
|---|---|---|---|---|---|---|
| `ts/value-bits` **신규** | 값은 켜짐·꺼짐의 묶음이고, JS 는 그 묶음이 **64비트 하나뿐**이다 | `binary-representation` · `bit-and-byte` · `type` | 비트 배열 | `0b1010` 을 「천십」으로 읽는다. `1 << 31` 이 음수가 되는 이유(비트 연산만 32비트로 내려간다)를 버그로 안다 | `table`(비트 칸 배치) | **있음** · 117곳/23파일 · 26곳/8파일 |
| `ts/number-literal` `기존` | `0x2A` · `1_000` · `1e3` · `42` 가 **전부 같은 타입**이다 | `type` | 값 상자 | `1` 은 정수이고 `1.5` 는 실수라고 믿는다. `typeof 1 === typeof 1.5` 다 | `value` | **있음** · 9,399곳/377파일 · 8,208곳/494파일 |

#### 축 B — 실수형과 왜 안 떨어지나 (3판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 | 사전 |
|---|---|---|---|---|---|---|
| `ts/number-is-double` `심화↑` | 정수 타입이 **없다.** `MAX_SAFE_INTEGER`(2⁵³−1) 위는 조용히 어긋난다 | `floating-point` · `integer-overflow` | 비트 배열 (부호·지수·가수) | `9007199254740993` 을 찍고 마지막 자리가 바뀐 것을 오타로 안다. DB 의 `bigint` id 를 JSON 으로 받으면 이 자리에서 값이 상한다 | `table`(비트 칸 배치) | **있음** · 52곳/29파일 · 5곳/5파일 |
| `ts/float-inexact` **신규** | `0.1 + 0.2 !== 0.3` — 2진수로 `0.1` 을 정확히 못 적는다 | `floating-point` · `binary-representation` | 비트 배열 | `toFixed(2)` 가 **문자열**을 낸다는 것을 모르고 다시 더해 `"0.300.30"` 을 만든다 | `value` | **있음** · 11곳/7파일 · 14곳/10파일 |
| `ts/integer-division` **신규** | `/` 가 늘 소수를 낸다. 버림은 `Math.floor`(아래)와 `Math.trunc`(0 쪽)로 **갈린다** | `floating-point` | 타입 변환 사다리 | `7 / 2` 를 `3` 으로 예상한다(자바·C 를 먼저 배운 사람). `Math.floor(-7/2)` 는 `-4`, `Math.trunc(-7/2)` 는 `-3` | `table` | **있음** · 49곳/29파일 · 89곳/54파일 |

#### 축 C — 문자열과 인코딩 (3판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 | 사전 |
|---|---|---|---|---|---|---|
| `ts/string-literal` `기존` | 따옴표 셋(`'` `"` `` ` ``)이 같은 값이다 | `text-encoding` | 값 상자 | 백틱이 다른 타입이라고 믿는다 | `value` | **있음** · 46,354곳/410파일 · 46,929곳/603파일 |
| `ts/template-literal` `기존` | `${}` 안이 **식**이라 그 자리에서 계산된다 | — | 평가 트리 | 작은따옴표에 `${}` 를 써서 글자 그대로 남는다 — 오류가 아니라 조용히 틀린 문자열이 로그에 찍힌다 | `value`(예측 판정란) | **있음** · 5,509곳/351파일 · 1,297곳/258파일 |
| `ts/text-length` **신규** | `.length` 는 글자 수가 아니라 **UTF-16 코드 단위** 수다 | `text-encoding` · `bit-and-byte` | 비트 배열 | `'👍'.length` 를 1 로 예상한다(실제 2). `'가'.length` 는 1 인데 UTF-8 바이트로는 3 — 「길이」가 셋인 것을 모른다 | `value` | **있음** · 94곳/38파일 · 35곳/24파일 |

#### 축 D — 참·거짓 (3판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 | 사전 |
|---|---|---|---|---|---|---|
| `ts/boolean-literal` `기존` | `true`/`false` 두 값 | `type` | 값 상자 | `Boolean("false")` 가 `true` 다 — 빈 문자열만 거짓이다 | `value` | **있음** · 3,345곳/300파일 · 2,876곳/359파일 |
| `ts/truthy-falsy` `중심↑` | 거짓이 되는 값이 **여섯**(`false 0 '' null undefined NaN`)이고 `[]`·`{}` 는 참이다 | — | 값 상자 (거짓 여섯 칸) | `if (arr)` 로 빈 배열을 거르려 한다. `if (arr.length)` 여야 한다 | `table` | **있음** · 1,290곳/218파일 · 1,676곳/282파일 |
| `ts/undefined-null` `기존` | 「없음」이 **둘**이고 뜻이 다르다 — 안 넣은 것과 없다고 넣은 것 | `null-reference` | 값 상자 | `undefined == null` 은 참인데 `undefined === null` 은 거짓 — 어느 쪽이 답인지 모른다 | `table` | **있음** · 1,926곳/231파일 · 5,420곳/470파일 |

#### 축 E — 연산자와 우선순위 (3판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 | 사전 |
|---|---|---|---|---|---|---|
| `ts/arithmetic` `기존` | `+` 하나가 더하기이자 잇기다 | — | 평가 트리 | `1 + '1'` 은 `'11'` 인데 `'3' - 1` 은 `2` 다 — `+` 만 문자열 쪽으로 기운다 | `value`(예측 판정란) | **있음** · 1,236곳/215파일 · 1,541곳/270파일 |
| `ts/operator-precedence` **신규** | `2 + 3 * 4` 가 어떤 순서로 접히나. `&&` 가 `\|\|` 보다 세고 둘 다 **단락 평가**한다 | — | 평가 트리 | `a \|\| b && c` 를 왼쪽부터 읽는다. 실제는 `a \|\| (b && c)` 다 | `step` | **있음** · 57곳/20파일 · 61곳/30파일 |
| `ts/conditional-ternary` `기존` | `? :` 는 **식**이라 값을 낸다. 중첩하면 **오른쪽부터** 묶인다 | — | 평가 트리 | 중첩 삼항을 왼쪽부터 묶어 읽는다 | `step` | **있음** · 1,364곳/303파일 · 2,697곳/339파일 |

#### 축 F — 형 변환 (2판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 | 사전 |
|---|---|---|---|---|---|---|
| `ts/implicit-conversion` **신규** | 타입이 다르면 **언어가 한쪽을 바꿔서** 계산한다 | `type` · `static-vs-dynamic-typing` | 타입 변환 사다리 | `'5' * 2 === 10` 인데 `'5' + 2 === '52'` 다. 연산자마다 어느 쪽으로 바뀌는지가 다르다 | `value`(예측 판정란) | **있음** · 0곳 · 합성(`idiom`) |
| `ts/explicit-conversion` **신규** | `Number()` · `parseInt()` · `String()` · `!!` 는 **새 값을 만든다** | `type` | 타입 변환 사다리 | `Number('')` 가 `0` 이고 `Number(null)` 도 `0` 인데 `Number(undefined)` 는 `NaN` 이다. `parseInt('12px')` 는 `12`, `Number('12px')` 는 `NaN` | `table` | **있음** · 537곳/135파일 · 255곳/95파일 |

#### 축 G — 대입과 이름 (3판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 | 사전 |
|---|---|---|---|---|---|---|
| `ts/const-declaration` `기존` | 만드는 낱말이 **나중 일까지** 정한다 | `scope-and-lifetime` | 메모리 줄 | `const` 를 「값이 안 바뀜」으로 읽는다. **이름만** 묶는다 | `value`(예측 판정란) | **있음** · 16,223곳/405파일 · 9,235곳/578파일 |
| `ts/reassignment` `기존` | 다시 넣기는 이름이 가리키는 곳을 바꾼다 | `state` | 메모리 줄 | `const` 에 다시 넣어 그 자리에서 멈춘다 | `step` | **있음** · 659곳/141파일 · 533곳/152파일 |
| `ts/reference-sharing` `중심↑` | `b = a` 는 **가리키는 곳만** 복사한다 | `value-vs-reference` · `aliasing` | 메모리 줄 (화살표 둘이 한 상자로) | `{ ...obj }` 가 안쪽까지 새로 만든다고 믿는다. **한 겹**뿐이다 | `value`(예측 판정란) | **있음** · 33곳/23파일 · 43곳/32파일 |

#### 축 H — 비교와 같음 (2판)

| id | 한 줄 | `cs/` 간선 | 그림 | 초보가 틀리는 자리 | 형식 | 사전 |
|---|---|---|---|---|---|---|
| `ts/comparison` `기존` | `===` 는 타입까지 같아야 참이다 | `identity-vs-equality` | 값 상자 | 객체 둘을 `===` 로 견주고 내용이 같으면 참일 거라 믿는다. 객체는 **자리**를 견준다 | `value` | **있음** · 4,422곳/372파일 · 3,924곳/399파일 |
| `ts/loose-equality` `중심↑` | `==` 는 타입이 다르면 한쪽을 바꿔 견준다. **`NaN !== NaN`** 이다 | `identity-vs-equality` | 표 (강제 변환표) | `NaN === NaN` 을 참으로 예상한다. `0 == ''` 참, `0 == []` 참인데 `'' == []` 도 참이고 `null == 0` 은 거짓 | `table` | **있음** · 1곳/1파일 · 390곳/121파일 |

**그림 여섯 중 다섯만 쓴다.** 비트 배열 · 평가 트리 · 값 상자 · 메모리 줄 · 타입 변환 사다리.
**스택 프레임은 0부에 없다** — 함수가 아직 안 나왔다. 1부 `ts/function-declaration`·
`ts/return-statement` 가 그 그림의 첫 소비자이고, 2부 `ts/closure`·3부 `await-resume` 이 그 위에 쌓인다.

### 1.5.2 언어마다 다른 자리

세 언어(파이썬 · JS/TS · 자바)를 같은 여덟 축으로 대조한다. **JS/TS 열이 이 문서의 몫**이고
나머지 둘은 [`py.md`](./py.md) §1.5 · [`java.md`](./java.md) §1.5 가 같은 표를 든다.
이 표가 0부의 존재 이유다 — 같은 축에서 세 언어의 답이 **서로 다르고**, 그 차이를 모르면
두 번째 언어에서 첫 언어의 습관이 그대로 틀린 답이 된다.

| 축 | 파이썬 | **JS / TS** | 자바 |
|---|---|---|---|
| 정수형 | 자릿수 한계가 없다 — `2**100` 이 그대로 | **정수 타입이 없다.** 전부 64비트 부동소수이고 `MAX_SAFE_INTEGER`(2⁵³−1) 위는 조용히 어긋난다 | `int` 32비트 고정. `MAX_VALUE + 1` 이 가장 작은 음수 |
| 나눗셈 | `/` 는 늘 `float`, `//` 는 **아래로** 버림 (`-7 // 2 == -4`) | **`/` 는 늘 소수.** 버림이 `Math.floor`(아래)와 `Math.trunc`(0 쪽)로 갈린다 | `/` 가 정수끼리면 **0 쪽으로** 버림 (`-7 / 2 == -3`) |
| 실수 | `0.1 + 0.2 != 0.3`. 정확한 소수는 표준 라이브러리 `decimal` | 같음. **정수도 같은 타입이라 큰 정수까지 샌다** | 같음. `float`/`double` 둘이고 리터럴 기본이 `double`. 돈은 `BigDecimal` |
| 문자열 길이 | `len` 이 **코드 포인트** — `len("가") == 1` | **`.length` 가 UTF-16 코드 단위** — `'👍'.length === 2` | `.length()` 도 UTF-16 코드 단위. **`char` 타입이 따로 있고** 이모지 하나가 `char` 둘 |
| 참·거짓 | `bool` ⊂ `int` (`True + True == 2`). 빈 것이 거짓 | **거짓이 여섯**(`false 0 '' null undefined NaN`)이고 `[]`·`{}` 는 참 | `boolean` 이 숫자가 **아니고** 조건 자리에 `boolean` 말고는 못 온다 |
| 형 변환 | 수 사이는 올라가지만 **문자열과 숫자는 안 섞인다** (`"1" + 1` 이 멈춘다) | **자동으로 섞인다** — `1 + '1' === '11'`, `'3' - 1 === 2` | 넓히기는 자동, 좁히기는 `(int)` 명시. 문자열은 `+` 로만 자동 |
| 대입 | 대입은 **문**이라 값이 없다 (`:=` 만 식) | **대입이 식** — `a = b = 0` 이 된다 | 대입이 **식** — `if (done = true)` 가 `boolean` 일 때만 통과한다 |
| 같음 | `==` 는 값, `is` 는 자리 | **`===` 는 타입까지, `==` 는 강제 변환. `NaN !== NaN`** | `==` 는 **자리**, `.equals` 는 내용. `Integer` 는 −128~127 만 캐시 |

**이 표에서 JS/TS 가 혼자인 자리 셋.** ① 숫자 타입이 하나뿐 ② 문자열과 숫자가 자동으로 섞임
③ 같음이 두 개의 연산자로 갈림. 셋 다 **다른 언어에서 오는 사람이 가장 크게 틀리는 자리**이고,
동시에 **JS 를 먼저 배운 사람이 다음 언어에서 틀리는 자리**다 — `7 / 2` 를 `3.5` 로 예상하고
자바에서 `3` 을 받는다. 0부 문항이 다른 언어의 답을 오답 선택지로 쓴다.

### 1.5.3 실측 — 0부 개념이 사용자 리포에 몇 곳 나오나

`ECC`(js 410파일 127,786줄) · `ai-pm`(ts 322 + tsx 291 = 613파일 125,376줄) 두 리포를 정규식으로 셌다.
**주석과 문자열·템플릿·정규식 리터럴을 먼저 지우고** 셌다. 정규식은 tree-sitter 보다 헐거우므로
**하한**으로 읽는다.

| 0부 판 | 근거 모양 | `ECC` js (410) | `ai-pm` ts·tsx (613) | 판정 |
|---|---|---|---|---|
| `value-bits` · `number-literal` | 정수 리터럴 | 8,837곳 / 375파일 | 7,699 / 493 | 내 코드에서 확인 |
| `number-is-double` | `BigInt` · `MAX_SAFE_INTEGER` · 2⁶³ 넘는 리터럴 | 7곳 / 1파일 | **0곳** | **합성 + 「네 코드엔 없다」**(`scale`) |
| `float-inexact` | `.toFixed(` | 4곳 / 3파일 | 4 / 3 | 얇다 — `thin_threshold`(min_sites 3)에 걸린다 |
| `integer-division` | `Math.floor` · `Math.trunc` · `Math.round` | 42곳 / 26파일 | 81 / 52 | 내 코드에서 확인 |
| `string-literal` · `template-literal` | 문자열·템플릿 리터럴 | 4,882 / 362 · 백틱 4,267 / 356 | 38,265 / 604 · 백틱 915 / 263 | 내 코드에서 확인 |
| `text-length` | `.length` · `charCodeAt` · `codePointAt` · `normalize` | `.length` 1,412 / 245 · 인코딩 26 / 18 | 1,132 / 272 · 35 / 20 | 내 코드에서 확인 |
| `boolean-literal` | `true` · `false` | 3,164곳 / 297파일 | 2,788 / 358 | 내 코드에서 확인 |
| `truthy-falsy` | 비교 없는 `if (x)` | 1,512곳 / 229파일 | 1,139 / 282 | 내 코드에서 확인 |
| `undefined-null` | `??` · `?.` | 231곳 / 68파일 | 1,786 / 308 | 내 코드에서 확인 |
| `arithmetic` | 나눗셈(피연산자 사이의 `/`) | 571곳 / 196파일 | 148 / 73 | 내 코드에서 확인 |
| `operator-precedence` | `+` 와 `*` 가 섞인 식 | 157곳 / 65파일 | 177 / 84 | 내 코드에서 확인 |
| `conditional-ternary` | `? :` | 1,039곳 / 296파일 | 1,721 / 328 | 내 코드에서 확인 |
| `implicit-conversion` | (두 피연산자의 타입을 알아야 한다) | **못 쟀다** | **못 쟀다** | 아래 |
| `explicit-conversion` | `Number(` · `parseInt(` · `String(` · `Boolean(` · `!!` | 531곳 / 131파일 | 222 / 92 | 내 코드에서 확인 |
| `const-declaration` · `reassignment` | `const`/`let`/`var` · 재대입 | 15,989 / 405 · 재대입 1,515 / 268 | 9,311 / 581 · 5,963 / 343 | 내 코드에서 확인 |
| `reference-sharing` | `...` 펼치기 | 761곳 / 206파일 | 1,036 / 234 | 내 코드에서 확인 |
| `comparison` | `===` · `!==` | 3,026곳 / 305파일 | 2,651 / 356 | 내 코드에서 확인 |
| `loose-equality` | `==` · `!=` | **1곳 / 1파일** | 375 / 120 | **리포마다 갈린다** — 아래 |

**세 가지가 읽힌다.**

**① `loose-equality` 가 리포에 따라 0 이 되거나 375 가 된다.** `ECC` 는 410파일에 `==` 가 **1곳**뿐이고
(ESLint `eqeqeq` 가 도는 리포로 보인다) `ai-pm` 은 613파일에 375곳이다. §3 이 이 개념을 「AI 가 한
파일에서 `==`·`===` 를 섞는다」로 제안했는데 **그것은 `ai-pm` 에서만 참이다.** `ECC` 에서는
`alternatives:` 짝(§3 의 `gap: ts/comparison, present: ts/loose-equality`)이 부기할 것이 없다.
0부에서는 그래도 가르친다 — 「이 리포는 한쪽만 쓴다」 자체가 배울 것이고, D158 ②의 `idiom` 사유다.

**② `number-is-double` 이 `ai-pm` 에서 0곳이다.** 613파일에 `BigInt` 도 `MAX_SAFE_INTEGER` 도 2⁶³ 넘는
리터럴도 없다. 이것이 이 부가 존재하는 이유의 자리다 — 리포가 안 쓰니 옛 방식(리포가 쓰는 문법만)
으로는 영영 못 가르치는데, **모르면 DB id 를 JSON 으로 받는 날 값이 상한다.** 합성으로 가르치고
「네 코드엔 없다」를 명시한다. 사유는 `scale`.

**③ `float-inexact` 는 둘 다 얇다.** `toFixed` 가 각 4곳이다. 소수를 다루는 코드가 거의 없다는 뜻이고,
그것 자체가 「없어서 안 만나는 버그」다. 얇은 대로 두되 합성이 정본이다.

**못 잰 것 하나.** `implicit-conversion`(`'5' * 2` · `1 + '1'`)은 정규식으로 못 센다 — 두 피연산자의
타입을 알아야 하는데 정규식도 tree-sitter 도 모른다(§8 의 파싱 함정과 같은 뿌리다).
**실행 없이는 못 재는 개념**이고, 그러면 사용처 대신 합성이 정본이다.

### 1.5.3-a 사전이 섰다 — 같은 21판을 tree-sitter 로 다시 쟀다 (2026-09-05)

1.5.3 의 수는 **정규식**이고 하한이라고 적혀 있었다. 21판의 `.scm` 이 실제로 서면서 같은 두
표본을 **그 쿼리로** 다시 쟀다(`ECC` js/jsx 410파일 · `ai-pm` ts 322 + tsx 291 = 613파일).
아래 표의 「사전」 열이 그 값이고, 정규식과 다른 자리 넷을 여기 적는다.

| 자리 | 정규식(1.5.3) | 쿼리 실측 | 왜 다른가 |
|---|---|---|---|
| `string-literal` | ECC 4,882 / ai-pm 38,265 | **46,354 / 46,929** | 정규식은 문자열을 **먼저 지우고** 셌다. 쿼리는 `(string)` 노드를 세므로 import 경로·JSX 속성까지 든다 |
| `number-is-double` | 7 / **0** | **52 / 5** | 근거를 넓혔다 — `BigInt`·`123n` 만이 아니라 `Number.MAX_SAFE_INTEGER`·`isSafeInteger`·`isInteger`·`MAX_VALUE` 까지. 「정수 타입이 없다」를 코드가 아는 자리가 그 이름들이다. **`ai-pm` 은 여전히 5곳이라 그쪽에서는 얇다** |
| `implicit-conversion` | **못 쟀다** | **0 / 0** | 이제 잰다. 다만 쿼리가 잡는 것은 **한쪽이 리터럴인 식**(`'5' * 2`)뿐이고, 실제 강제 변환은 `'…' + name` 처럼 한쪽이 이름이라 소스에 타입이 없다. 0곳은 「없다」가 아니라 「정적으로 보이는 자리가 0곳」이다 — 사유는 `idiom`(그 자리를 명시 변환 537곳/255곳이 가져갔다) |
| `reference-sharing` | 761 / 1,036 (펼치기) | **33 / 43** | 근거를 바꿨다. 펼치기는 `ts/object-spread` 가 이미 맡고 있어 겹친다 — 이쪽은 `const b = a` 꼴의 **별칭 선언**만 잡는다 |

`loose-equality` 는 정규식과 붙는다: `ECC` **1곳/1파일**, `ai-pm` **390곳/121파일**(문서의 375와
같은 자리). 리포마다 갈린다는 1.5.3 ①의 발견이 쿼리로도 그대로 선다.

### 1.5.4 부 배치 — 이 문서가 처음 세운다

`ts/_lang.yaml` 의 `essential` 30 은 순서만 있고 부가 없다. 0부를 세우면서 나머지도 나눈다.
**자바(D177)·파이썬과 같은 규칙 셋**이 걸린다 — ① 개념마다 내 코드의 자리를 짚고 없으면 사유를
댄다 ② 3부는 내 코드가 먼저다 ③ 순서는 개념 그래프의 위상 정렬이다.

| 부 | 이름 | 판 | 담기는 것 |
|---|---|---|---|
| **0부** | 이 언어의 값과 식 | **21** | 위 축 여덟. 기존 10(`const-declaration`·`reassignment`·`boolean-literal`·`comparison`·`arithmetic`·`string-literal`·`number-literal`·`undefined-null`·`template-literal`·`conditional-ternary`) + §3·§4 에서 올린 4(`truthy-falsy`·`loose-equality`·`reference-sharing`·`number-is-double`) + 신규 7 |
| **1부** | 흐름과 묶기 | **13** | `if-statement` · `while-loop` · `for-of` · `function-declaration` · `arrow-function` · `return-statement` · `call-expression` · `property-access` · `array-basics` · `array-destructuring` · `object-destructuring` · `try-catch` · `object-literal`(§3 신규) |
| **2부** | 타입과 객체 | **18** | **타입 축 셋이 맨 앞이다**(§3 「순서 하나」 · D187 ⑰) — `type-annotation` → `union-type` → `narrowing`. 그다음 `object-spread` · `optional-chaining` · `nullish-coalescing` · `array-map-immutable` · `array-filter` · `array-method-chain` · `async-await` · `generics` + §3 신규 나머지 7(`closure` · `import-export` · `throw-error` · `callback-argument` · `array-reduce` · `class-declaration` · `interface-type`) |
| **3부** | 프레임워크 | **9 또는 6** | 리포가 정한다 — React 면 `react/` 9([`js-framework-axis.md`](../plan/js-framework-axis.md) §2.2), Node CLI 면 `node/` 6(§2.3). 둘 다면 15 |

**`essential` 30 이 전량 배치된다** — 0부 10 · 1부 12 · 2부 8. 1부의 `object-literal` 과 2부의 열은
§3 이 제안한 신규이고 아직 사전에 없다. **§4 심화 아홉 중 하나
(`number-is-double`)만 0부로 올라가고 나머지 여덟은 부 밖에 남는다** — `type-erasure` ·
`type-assertion` · `prototype-chain` · `structural-typing` · `generic-constraint` · `any-unknown` ·
`this-binding` · `await-resume`. 파이썬이 심화 열을 `essential` 밖에 둔 것과 같은 판단이다(§5 의 반례).

**판 수와 일수** (하루 새 판 2장 · D12 · 정본 §2 의 하루 15분):

| 부 | 판 | 일 |
|---|---|---|
| 0부 | 21 | **11** (마지막 날 1장) |
| 1부 | 13 | 7 (마지막 날 1장) |
| 2부 | 18 | 9 |
| 3부 | 6~15 | 3~8 |
| **합** | **58~67** | **30~35** |

**`ai-pm`(React) 이면 61판 = 31일**, **`ECC`(Node CLI) 면 58판 = 29일**이다. 그 뒤로 기능 챕터가
이어진다. 자바가 부 셋 43판 = 22일이었고 0부를 더하면 58판 = 29일이니([`java.md`](./java.md) §1.5.4)
세 언어가 29~31일로 붙는다. **한 달이 맞는 값인지는 사용자 결정이다** — 줄이려면 0부의 축 A·B 를
각 1판으로 접어 17판(9일)까지 내려간다. 접으면 잃는 것은 비트 배열 그림이 걸리는 자리 셋
(`value-bits` · `number-is-double` · `float-inexact`)이 하나로 뭉쳐, 「숫자가 한 종류뿐」과
「소수가 안 떨어진다」를 한 판에서 둘 다 보여야 한다는 것이다.

**축 A·B 다섯 판을 연속으로 두지 않는다** (D187 ⑰ · [`ts-learning.md`](./ts-learning.md) §11.5).
축 A 2판 + 축 B 3판이 붙어 있는데 그 다섯 중 셋이 이 리포에서 **얇다** — `number-is-double`
52곳/29파일 · `float-inexact` 11곳/7파일, 그리고 `Math.trunc` 는 **0~2곳**인데 `Math.floor` 는
25~30곳이라 `integer-division` 의 두 방향 중 하나가 재료가 없다. 다섯을 연속으로 내면
**사흘에서 나흘 연속으로 「네 코드엔 없다」만** 나오고, 그동안 D177 규칙 ①(내 코드의 자리를 짚는다)이
한 번도 안 걸린다.

**섞는 규칙 하나** — 축 A·B 의 얇은 셋 사이에 두꺼운 축의 판을 끼운다. 0부의 두꺼운 자리는
`string-literal`(46,354곳) · `const-declaration`(16,223곳) · `template-literal`(5,509곳) ·
`comparison`(4,422곳)이다. 축의 **묶음은 그대로 두고 내는 날만 흩는다** — 축이 여덟인 것은
설계의 단위이지 하루치가 아니다.

### 1.5.5 0장(프롤로그)과의 관계 — 안 건드린다

`ZERO_CHAPTER_MAX = 24` 의 0장과 이 0부는 **다른 것**이다. 0장은 `zeroChapterPlates` 가 `_lang.yaml` 의
`essential` 에서 깊이 ≤ 2 를 뽑아 만드는 예고이고, 0부는 코스의 부다. 이름이 닮아 헷갈리므로 적어 둔다.

TS 의 0장 후보는 지금 **21/24** 이고(§5 · `zero-chapter.test.ts` 가 잰다) 마진이 셋이다.
0부의 신규 일곱을 `essential` 에 올리면 **28** 이 되어 상한이 넷을 자르고, 넷째 정렬 키(id 알파벳순)가
실제로 돌기 시작한다 — D147 이 피하려던 자리다. [`py.md`](./py.md) §1.5.5 와 **같은 결정**이고
[`cs.md`](./cs.md) §6 의 미해결과도 같다. **세 갈래(0부를 `essential` 밖에 두기 / 상한을 30 으로
올리기 / 입력을 두 목록으로 가르기)를 함께 재야 하고, 이 문서에서는 안 정했다.**

→ **정해졌다(D184, 2026-09-05): 상한 폐지.** `essential` 에 넣고 **자르지 않는다.** 0장 후보 28~32 가 전부
든다(하루 2장이면 14~16일). 넷째 키가 돌 일이 없다.

---

### 1.5.6 I6 조정 규약 — 공통 id 조각 · 0부 상한 · `cs/` 신청

세 언어(그리고 나머지 일곱)가 **같은 축에 같은 id 조각**을 쓴다. 조각이 같으면 `universal` 로
`common/` 에 묶기 쉽고, 다르면 [`cs.md`](./cs.md) §10.1 이 적은 사고 — 「같은 기계에 여덟 가지 이름이
붙었다」 — 가 0부에서 되풀이된다.

| 조각 | 축 | `py` | **`ts`** | `java` |
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
기초 8 을 뺀 값이고, 이 상한이 없으면 1.5.5 가 적은 「후보가 넘쳐 id 알파벳순이 실제로 돈다」가
그대로 일어난다.
→ D184(2026-09-05)로 그 근거는 사라졌다 — 0장 상한이 폐지됐다. 12 는 저작 규모의 상한으로만 남는다(README §12 규약 8).

`essential` 에 새로 드는 것은 **열한 장**이다 — 신규 일곱(`value-bits` · `float-inexact` ·
`integer-division` · `text-length` · `operator-precedence` · `implicit-conversion` ·
`explicit-conversion`)과 §3·§4 가 제안했으나 아직 사전에 없는 넷(`truthy-falsy` · `loose-equality` ·
`reference-sharing` · `number-is-double`). 나머지 열은 `essential` 30 에 **이미 들어 있고** 부만
옮긴 것이라 0장 후보를 안 늘린다. **11 ≤ 12 — 상한을 지킨다.**

**0부의 판 수(21)와 이 12는 다른 수다.** 판은 **코스에서 며칠 걸리나**를 재고,
12는 **0장 후보와 구멍 지도 분모가 얼마나 커지나**를 잰다. 이미 `essential`(30)에 있던 것을
0부로 옮기는 것은 후자를 한 톨도 안 늘린다 — 부는 **교재 축**이고 `essential` 은 **분모 축**이다.

#### 선행 방향 하나 — 걸 자리가 아직 없다 (D187 ⑰)

[`ts-learning.md`](./ts-learning.md) §11.6 ③ 이 `prototype-chain` ↔ `class-declaration` 의
선행을 **뒤집자**고 적었고 D187 ⑰ 이 그것을 채택했다. 근거는 교재 셋(Eloquent JS 7장 ·
javascript.info 8→9장 · YDKJS)이 전부 프로토타입 먼저이고, 실측이 §4 의 재료 근거
(「학습자가 실제로 보는 것은 `class` 다」)를 부순다는 것이다 — `ECC` 422파일에 `class` 선언
**1곳** 대 `prototype` **36곳/26파일**.

**그런데 사전에 걸 자리가 없다.** 2026-09-05 현재 `dictionary/ts/` 에 `prototype-chain.yaml`
도 `class-declaration.yaml` 도 **없다** — 둘 다 §3·§4 의 제안 단계이고 0부 21판에 안 든다.
`_lang.yaml` 의 `essential` 에도 없다. 그래서 이 판에서는 방향만 여기 적어 둔다:

> 둘을 저작할 때 `ts/class-declaration` 의 `prereq` 에 `ts/prototype-chain` 을 넣는다.
> 반대 방향(`prototype-chain` → `class-declaration`)은 **적지 않는다.**

**해시 영향은 저작 시점에 생긴다.** `prereq` 는 카드 페이로드에 실린다
(`packages/cards/src/payload.ts` 의 `prereqOf` → `commonPayload`)고, `content_hash` 는
`{conceptId, kind, siteId, genVersion, payload}` 를 통째로 해싱한다
(`packages/cards/src/hash.ts`). **그러므로 선행을 고치면 그 개념의 카드 해시가 전부 바뀐다.**
지금은 두 개념이 없어 바뀐 해시가 0건이고, 0부 21판에서는 기존 열 장의 `prereq` 를 한 줄도
안 고쳤으므로 역시 0건이다.

#### `cs/` 에 없는 것 셋 — 신청 목록

`cs/` 43장(D157)을 0부의 간선으로 쓰려고 대조했더니 **셋이 없다.**

| 신청 `cs/` id | 한 줄 | 이 문서에서 이것을 요구하는 판 | 그림 |
|---|---|---|---|
| `cs/operator-precedence` | 식은 왼쪽부터 읽히지 않는다 — 연산자마다 세기와 방향이 있고, 그것이 **접히는 순서**를 정한다 | `ts/operator-precedence` · `ts/arithmetic` | **평가 트리** |
| `cs/type-conversion` | 타입이 다른 값을 만나면 ① 언어가 바꾸거나 ② 사람이 적거나 ③ 멈춘다 — 셋 중 무엇이냐가 언어를 가른다 | `ts/implicit-conversion` · `ts/explicit-conversion` | **타입 변환 사다리** |
| `cs/truthiness` | 참·거짓이 아닌 값을 조건 자리에 두면 무슨 일이 일어나나 | `ts/truthy-falsy` | 값 상자 |

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

**이 문서의 언어는 그 자리가 아니다.** `Cargo.toml` 을 직접 확인했다 — 문법 `typescript` · `tsx` · `javascript` 는
`lang-typescript` = `tree-sitter-typescript 0.23` · `lang-javascript` = `tree-sitter-javascript 0.25` 로 실제 링크되어 있고, 1.5.3 의 실측이 그 위에서 돈 것이 아니라 **정규식으로 돈 것**이므로
(정규식은 파서 유무와 무관하다) 두 사실을 섞지 않는다. 파서가 붙어 있다는 것은 **0부 판이
사용처를 실제로 얻는다**는 뜻이고, 사용처가 0 인 판(1.5.3 의 「합성 + 「네 코드엔 없다」」)은
파서가 없어서가 아니라 **그 코드가 리포에 없어서** 0 이다. 그 둘은 다른 결론으로 이어진다 —
앞의 것은 크레이트를 붙이면 풀리고, 뒤의 것은 D177 규칙 ①(합성 + 사유 명시)이 답이다.

---

## 2. 기초 — 바닥 여덟 (이미 선 것의 재검토)

`ts/_lang.yaml` 의 `essential` 은 **30줄**이다. 「D147 의 바닥 개념 여덟」 주석이 첫 줄
(`ts/const-declaration`) **아래**에 있고, 어디까지가 여덟인지는 **주석의 위치로만** 표시돼 있다.
스키마에도 린트에도 「바닥 여덟」이라는 것이 없고 `meta.essential` 은 30 전부를 뜻한다.

같은 필드가 네임스페이스마다 다른 것을 뜻한다 — `ts.essential` 은 30(필수 문법 전량),
`py.essential` 은 8(바닥 여덟 그 자체). 그리고 `essential` 을 읽는 코드가 넷이다: 구멍 지도의 분모
(`gaps.ts:62`) · 0장 후보(`zero-chapter.ts:95`) · T1 대표 개념 자격(`blocks.ts:187`, D27 첫 조건) ·
사전 부채 래칫의 분모(`lint.ts:365·379`). 그러니 `ts` 의 30을 8로 줄이면 구멍 지도가 22개를 잃는다.
**줄이는 것은 답이 아니다.**

### 여덟을 확정한다

주석 아래 여덟 줄이 그 여덟이다. D147 본문이 지목한 것은 「조건문 · 함수 정의와 `return` ·
참·거짓과 비교 · `let` 재대입 · `while`」로 **일곱**이고, 여덟째 `arithmetic` 은 D148 이 가져온
Exercism JS 트랙 깊이 0~3 목록(`arithmetic-operators`)에서 왔다.

| # | id | name.ko / en | token | universal | diff | prereq | 이 언어라서 다른 것 |
|---|---|---|---|---|---|---|---|
| 1 | `ts/reassignment` | 다시 넣기 / Reassignment | `=` | `common/reassignment` | 1 | — | `const` 로 만든 이름에 다시 넣으면 그 자리에서 멈춘다 — 만드는 낱말이 나중 일까지 정한다 |
| 2 | `ts/boolean-literal` | 참·거짓 값 / Boolean literal | `true` | `common/boolean-value` | 1 | — | `if` 가 참·거짓 아닌 값도 받는다. `0`·`''` 이 거짓 자리에 서는 것이 여기서 시작된다 |
| 3 | `ts/comparison` | 견주기 / Comparison | `===` | `common/comparison` | 1 | `boolean-literal` | 견주는 기호가 **둘**이고 답이 갈린다. 파이썬은 조건 안의 `=` 를 막지만 JS 는 통과시킨다 |
| 4 | `ts/arithmetic` | 셈하기 / Arithmetic | `+` | `common/arithmetic` | 1 | — | `+` 하나가 더하기이자 잇기다 — `1 + '1'` 이 멈추지 않고 `'11'` 이 된다 |
| 5 | `ts/if-statement` | if 문 / if statement | `if` | `common/conditional-branch` | 1 | — | 중괄호를 안 쓰면 **다음 한 문장만** 딸려 간다. 들여쓰기는 아무 뜻이 없다 |
| 6 | `ts/while-loop` | while 문 / while loop | `while` | `common/loop-while` | 2 | `comparison` | 조건 자리가 참·거짓이 아니어도 돼서 `while (queue.length)` 가 성립한다 |
| 7 | `ts/function-declaration` | 함수 정의 / Function declaration | `function` | `common/function-definition` | 1 | — | 정의가 **위로 끌어올려진다** — 정의보다 위에서 불러도 된다. `const f = () =>` 는 안 된다 |
| 8 | `ts/return-statement` | 값 돌려주기 / return statement | `return` | `common/return-value` | 1 | `function-declaration` | 안 적으면 `undefined` 가 간다. `return` 뒤에 줄을 바꿔도 세미콜론이 끼어 `undefined` 가 된다 |

**제안.** `_lang.yaml` 에 `foundation:` 필드를 더한다. `essential` 은 지금 뜻 그대로 두고 `foundation`
이 바닥을 가리킨다. 주의할 것 — **TS 의 바닥은 축 여덟에 노드 아홉이다.** `ts/const-declaration` 이
「이름에 값 묶기」 축의 뿌리인데 여덟에 없다. 파이썬은 `py/assignment` 하나로 그 축을 덮지만(D152 ⓐ)
TS 는 만드는 낱말과 옮기는 낱말이 갈려 노드가 둘이다. `foundation` 에 아홉을 적고 「축 여덟」이라고
주석에 남기는 것이 사실에 맞다.

---

## 3. 중심 — 14개

`ts/*` 접두어는 뺐다. `universal` 의 **new** 는 §6 의 신규 제안이다.

| # | id | name.ko / en | token | universal | diff | prereq | 이 언어라서 다른 것 | 없으면 왜 못 읽나 |
|---|---|---|---|---|---|---|---|---|
| 1 | `object-literal` | 이름표 붙은 묶음 만들기 / Object literal | `{ a: 1 }` | **new** `common/record` | 1 | `string-literal` | `{ id }` 가 `{ id: id }` 다 — 키를 안 적어도 된다 | 배열은 있는데 객체를 **만드는** 개념이 없다. AI 코드의 절반이 객체 리터럴이다 |
| 2 | `truthy-falsy` | 참 같은 값 / Truthiness | `if (x)` | **new** `common/truthiness` | 2 | `boolean-literal` · `undefined-null` | 거짓이 되는 값이 **여섯**(`false 0 '' null undefined NaN`)이고 `[]`·`{}` 는 참이다 | `if (!items.length)` 가 왜 되는지, `\|\|` 가 왜 `0` 을 덮어쓰는지가 이 하나로 풀린다 |
| 3 | `loose-equality` | 느슨한 같음 / Loose equality | `==` | `null` | 2 | `comparison` | 타입이 다르면 한쪽을 바꿔 견준다. `null == undefined` 는 참, `===` 로는 거짓 | AI 가 한 파일에서 `==`·`===` 를 섞는다. 다르다는 걸 모르면 그 파일을 못 읽는다 |
| 4 | `reference-sharing` | 같은 것을 둘이 가리킴 / Shared reference | `b = a` | **new** `common/reference-sharing` | 3 | `object-literal` · `const-declaration` | `const` 는 **이름**만 묶는다. `const o = {}` 여도 `o.a = 1` 이 된다 | 「복사했는데 원본이 바뀌었다」의 유일한 설명. 지금은 오개념 한 줄로만 있다 |
| 5 | `closure` | 바깥 값을 데려가는 함수 / Closure | `() => count` | **new** `common/closure` | 3 | `arrow-function` · `reassignment` | 데려가는 것이 값이 아니라 **자리**다 — 자리가 바뀌면 함수가 보는 값도 바뀐다 | `useState` setter 가 옛 값을 보는 일, `setTimeout` 안의 변수, 이벤트 핸들러가 전부 이것이다 |
| 6 | `import-export` | 파일 사이로 이름 옮기기 / import and export | `import` | **new** `common/module-import` | 2 | `const-declaration` | `import` 와 `require` 가 섞이고, 어느 쪽으로 읽힐지는 확장자와 `package.json` 의 `"type"` 이 정한다 | AI 앱은 파일 여럿이다. 「이 이름이 어디서 왔나」에 답할 개념이 없다 |
| 7 | `throw-error` | 터뜨리기 / throw | `throw` | **new** `common/raise-error` | 2 | `call-expression` | 아무 값이나 던질 수 있어 `catch (e)` 의 `e` 가 `Error` 라는 보장이 없다 — TS 가 `unknown` 을 주는 이유 | `try/catch` 는 **받는 쪽만** 있다. `if (!res.ok) throw new Error(…)` 가 AI 코드의 기본형이다 |
| 8 | `callback-argument` | 나중에 부를 함수 넘기기 / Passing a callback | `f(cb)` | `common/function-value` | 2 | `arrow-function` · `call-expression` | 넘긴 함수가 **지금 안 불린다.** 괄호를 붙이면 결과가, 안 붙이면 함수가 넘어간다 | `map`·`setTimeout`·`addEventListener`·`useEffect` 가 같은 모양이고 `await` 의 앞자리다 |
| 9 | `array-reduce` | 접어서 하나로 / reduce | `reduce` | **new** `common/fold-reduce` | 3 | `arrow-function` · `array-basics` | 인자가 둘(누적값·항목)이고 초깃값을 안 주면 **첫 항목이 누적값**이 된다 | AI 가 합계·그룹핑을 전부 `reduce` 로 짠다. `map`·`filter` 는 있는데 이것만 없다 |
| 10 | `class-declaration` | class / class declaration | `class` | **new** `common/class-definition` | 3 | `function-declaration` · `object-literal` | 문법 설탕이라 뒤에서 프로토타입으로 돈다. 끌어올려져도 **쓰기 전에 부르면 멈춘다** | Node 서버·에러 서브클래스가 전부 `class` 다. 프런트만 보면 안 보인다 |
| 11 | `type-annotation` | 타입 적기 / Type annotation | `: string` | **new** `common/type-annotation` | 1 | `const-declaration` | 이름 **뒤에** 붙고 컴파일하면 사라진다. 문법 `typescript`·`tsx` 에만 있다 | TS 파일 모든 줄에 있는데 없다. 지금 타입을 다루는 유일한 개념이 `generics`(난이도 4)다 |
| 12 | `interface-type` | 모양에 이름 붙이기 / interface and type alias | `interface` | **new** `common/named-shape` | 2 | `type-annotation` · `object-literal` | 같은 일을 하는 낱말이 둘이고 `interface` 만 나중에 다시 열어 덧붙일 수 있다 | AI 는 컴포넌트마다 `interface Props` 를 낸다. 값이 아니라 모양인 줄 모르면 파일 위쪽이 안 읽힌다 |
| 13 | `union-type` | 여럿 중 하나 / Union type | `\|` | **new** `common/union-type` | 2 | `type-annotation` | 값 자체가 타입이 된다 — `'idle' \| 'loading'` 은 그 두 문자열만 허용한다 | 상태 기계·API 응답이 전부 유니온으로 온다. 다음 항목의 전제다 |
| 14 | `narrowing` | 타입 좁히기 / Narrowing | `typeof` · `in` | **new** `common/type-narrowing` | 3 | `union-type` · `if-statement` | `if` 한 줄이 **아래에서 할 수 있는 일**을 바꾼다. 조건이 흐름만이 아니라 타입도 가른다 | 「위에선 빨간 줄이 있었는데 `if` 안에선 없다」가 TS 초심자의 첫 질문이다 |

### 순서 하나 — `union-type`·`narrowing` 을 앞으로 (D187 ⑰ · 저작이 먼저)

위 표의 번호는 **설계 순서**이고 실제 코스 순서는 부 안의 위상 정렬이 정한다(§1.5.4 규칙 ③).
그 순서를 여기서 못박는다: **`narrowing` 은 2부의 끝(#14)이 아니라 `if-statement` 직후다.**

**근거는 이유를 적은 유일한 자료다.** 다섯 자료 중 배치의 이유를 쓴 것은 TS Handbook 하나이고,
그 책은 좁히기를 본편 **셋째**(Everyday Types → Narrowing → More on Functions)에 두면서 이유를
「JS 의 런타임 제어 흐름 **위에 겹친다**」로 적는다. `if` 를 배운 직후가 그 겹침이 처음 보이는
자리다. javascript.info 는 이벤트 루프를 Part 2 브라우저 → 기타로 밀었고 순서의 이유는 안 적는다
([`ts-learning.md`](./ts-learning.md) §11.2 ④).

**비용은 3판 이동이다** — 원래 진단이 2판(`union-type`·`narrowing`)이었는데 재 보니 셋이다.
`narrowing` 의 선행이 `union-type` 이고 `union-type` 의 선행이 `type-annotation` 이라, 위상 정렬이
`type-annotation` 도 함께 끌어올린다. 셋을 앞으로 옮기면 2부의 첫 셋이 타입 축이 되고, 그것이
**TS 파일 모든 줄에 있는 것**(`: string`)을 2부 끝이 아니라 시작에서 만나게 한다.

**사전 저작이 먼저다.** 2026-09-05 현재 `dictionary/ts/` 에 `type-annotation.yaml` ·
`union-type.yaml` · `narrowing.yaml` 이 **하나도 없다** — `_lang.yaml` 의 `essential` 에도 없다.
그래서 이 판은 순서만 적어 둔다:

> 셋을 저작할 때 `essential` 에서 `ts/type-annotation` → `ts/union-type` → `ts/narrowing` 을
> `ts/if-statement` **바로 뒤**에 둔다. `ts/interface-type` 은 따라오지 않는다 —
> `narrowing` 의 선행이 아니고, `interface` 가 없어도 `'idle' | 'loading'` 은 좁혀진다.

### 새 `alternatives:` 짝 다섯

기존 다섯에 더한다. 조건은 「같은 일을 하는 다른 표기를 쿼리로 셀 수 있을 것」이다.

| gap(구멍) | present(리포에 있는 다른 표기) | 이 짝이 여는 「왜」 |
|---|---|---|
| `ts/comparison` | `ts/loose-equality` | `===` 와 `==` 를 섞었다 — 어느 줄에서 답이 갈리나 |
| `ts/narrowing` | `ts/type-assertion` | 좁히는 대신 `as` 로 눌렀다 — 검사를 끈 자리가 몇 곳인가 |
| `ts/array-reduce` | `ts/for-of` | 같은 합계를 한쪽은 접고 한쪽은 쌓는다 |
| `ts/import-export` | **new** `ts/require-call` | ESM 과 CJS 가 한 리포에 섞였다 |
| `ts/template-literal` | **new** `ts/string-concat` | `+` 로 잇기와 백틱이 같은 파일에 있다 |
| `ts/narrowing` | **new** `ts/typeof-guard` | 같은 `typeof` 가 한쪽에서는 **타입을 좁히고** 한쪽에서는 **값을 가른다**. `ECC`(JS) 283곳/108파일 — TS 가 아닌 파일에서 이 모양이 그만큼 나온다([`ts-learning.md`](./ts-learning.md) §11.5 ④) |

표기 개념 셋(`ts/require-call` · `ts/string-concat` · `ts/typeof-guard`)이 더 필요하다. `promise-then`·`logical-or-default`
처럼 `essential: false` 로 둔다 — 분모가 아니라 **부기**다.

---

## 4. 심화 — 9개

| # | id | name.ko / en | token | universal | diff | prereq | 이 언어라서 다른 것 |
|---|---|---|---|---|---|---|---|
| 1 | `number-is-double` | 숫자가 한 종류뿐 / One number type | `0.1 + 0.2` | `null` | 3 | `arithmetic` · `number-literal` | 정수 타입이 **없다.** `1` 도 `1.5` 도 같은 64비트 부동소수라 `0.1 + 0.2 !== 0.3` 이고 큰 정수가 조용히 어긋난다 |
| 2 | `type-erasure` | 타입은 돌기 전에 사라진다 / Type erasure | `tsc` | `null` | 2 | `type-annotation` | 실행 중에는 타입이 **없다.** API 응답이 `interface` 와 달라도 아무도 안 막는다 |
| 3 | `type-assertion` | `as` 는 검사를 끄는 것 / Type assertion | `as` | `null` | 3 | `type-annotation` · `type-erasure` | 변환이 아니다. 값은 그대로 두고 **컴파일러 입만 막는다** |
| 4 | `prototype-chain` | class 뒤의 사슬 / Prototype chain | `prototype` | `null` | 3 | `property-access` (**`class-declaration` 을 뺐다** — 방향이 반대다, §1.5.4 「선행 방향 하나」) | 속성을 못 찾으면 **위로 한 칸 올라가** 다시 찾는다. `class` 는 이 사슬을 짓는 설탕이다. **자리가 없을 때의 사유는 `idiom`** — `ECC` 422파일에 `prototype` 36곳이 있으므로 「스케일이 작아서」가 아니다 |
| 5 | `structural-typing` | 이름 말고 모양이 맞으면 / Structural typing | — | `null`(§6) | 4 | `interface-type` | 두 `interface` 가 이름이 달라도 모양이 같으면 대입된다. Java·C# 을 알던 사람이 가장 크게 헷갈린다 |
| 6 | `generic-constraint` | 타입 자리에 조건 걸기 / Generic constraint | `T extends` | `common/generics` | 4 | `generics` · `interface-type` | `extends` 가 상속이 아니라 **「적어도 이 모양은 되어야 한다」**다. 같은 낱말이 `class` 에서는 상속이다 |
| 7 | `any-unknown` | `any` 와 `unknown` / any and unknown | `unknown` | `null` | 4 | `type-annotation` · `narrowing` | 둘 다 「모른다」인데 `any` 는 검사를 끄고 전염되며 `unknown` 은 **좁히기를 강제한다** |
| 8 | `this-binding` | `this` 가 가리키는 것 / this binding | `this` | `null` | 4 | `class-declaration` · `callback-argument` | 정의한 자리가 아니라 **부른 자리**가 정한다. `cb = obj.m; cb()` 의 `this` 는 `obj` 가 아니다. **자리가 없을 때의 사유는 `idiom`** — 실측 `this` **85곳/16파일** 대 화살표 **16,063곳**이라, 없는 이유가 규모가 아니라 **LLM 이 화살표로 짜기 때문**이다(D158 의 사유 축에서 `scale` 과 갈리는 자리) |
| 9 | `await-resume` | `await` 다음 줄은 언제 도나 / When await resumes | `await` | `null` | 4 | `async-await` · `callback-argument` | 함수가 그 줄에서 **접히고** 나머지는 마이크로태스크 대기줄로 간다 — `setTimeout(…, 0)` 보다 먼저 온다 |

앞의 넷은 **버그를 설명**하고(부동소수·타입 소거·`as`·프로토타입) 뒤의 다섯은 **설계를 설명**한다.

---

## 5. prereq 그래프와 0장 적재량

`prereqDepth` 는 후보 집합 **안에서만** 선행을 세므로 집합이 커지면 깊이가 달라진다. 세 경우를 돌렸다.

| 집합 | 개수 | 깊이 0/1/2/3/4/5 | 깊이 ≤ 2 |
|---|---|---|---|
| 지금 `ts.essential` | 30 | 9 / 6 / 6 / 5 / 3 / 1 | **21** |
| + 중심 14 | 44 | 9 / 10 / 11 / 7 / 6 / 1 | **30** |
| + 심화 9 | 53 | 9 / 11 / 12 / 10 / 8 / 3 | **32** |

`ZERO_CHAPTER_MAX` 는 24다. 지금 21/24 는 「자르는 규칙이 거의 일하지 않는」 자리이고
(`zero-chapter.ts` 주석이 그 근거로 이 값을 골랐다), 중심 14를 전부 `essential` 에 넣으면 **30/24** 가
되어 여섯 장이 잘린다. 자르는 순서는 ① 사용처 있는 것 ② 깊이 ③ 미지 ④ id 인데, ④가 실제로 도는
순간 「무엇을 자를까」가 임의가 된다 — D147 이 피하려던 상태다.

사이클은 없다. `narrowing ← union-type ← type-annotation` 과 `any-unknown ← narrowing` 은 이었고
`narrowing ← any-unknown` 은 **긋지 않았다** — `unknown` 을 몰라도 `typeof` 좁히기는 읽을 수 있다.

**제안 — `essential` 은 30 → 37.** 중심 14 중 일곱만 올린다: `object-literal` · `truthy-falsy` ·
`import-export` · `reference-sharing` · `closure` · `throw-error` · `callback-argument`. 깊이 ≤ 2 후보가
**25/24** 로 지금 띠(21/24)에 가깝게 남는다. 나머지 일곱과 심화 아홉은 `essential: false` 다 —
사용처가 있으면 카드는 그대로 구워지고 큐에도 들어간다. `essential` 이 정하는 것은 §2 에 적은 넷뿐이다.
→ **D184 뒤에는 「25/24 로 띠 안에 남긴다」는 이유가 사라졌다** — 자르지 않으니 열넷을 다 올려도 잘리는 것이
없다. 일곱인지 열넷인지는 이제 프롤로그 길이(하루 2장)로만 정한다.

### 가장 중요한 판단 — `ts` 가 문법 셋을 안고 있는 문제

타입 개념 아홉은 `typescript`·`tsx` 에만 있다. **코드를 읽고 확인한 것 — 순수 `.js` 리포에서 타입
개념은 새지 않는다.**

| 자리 | 무엇이 막나 |
|---|---|
| 쿼리 실행 | `concept.grammars` 에 `javascript` 가 없으면 `.js` 에 쿼리가 안 돈다 (`load.ts:173` 이 `(concept, grammar)` 키로 등록) |
| 구멍 지도 | `gaps.ts:65` — `if (sites.length === 0) continue;` 로 **행 자체가 안 생긴다** |
| 0장 | `zero-chapter.ts:100` — `if (best === null) return [];` 로 **합성 판도 안 만들어진다**(D137) |

브리프의 전제(「0장 합성 후보에는 들어간다」)는 지금 코드에서 **성립하지 않는다.** 사용처 0 인 개념은
합성 판도 못 되고 조용히 빠진다. `ts/generics` 가 이미 `grammars: [typescript, tsx]` 로 그렇게 서 있다.

**그래서 네임스페이스를 쪼개지 않는다.** 근거 셋:

1. **간선이 경계를 계속 넘는다.** `narrowing` 의 선행이 `if-statement`(JS)이고, `type-erasure` 를
   설명하려면 `throw-error`(JS)의 `catch (e: unknown)` 이 필요하다. `alternatives` 짝
   `narrowing ↔ type-assertion` 도 마찬가지다. 쪼개면 `prereq` 가 네임스페이스를 가로지르는데
   `prereqDepth` 는 한 집합 안에서만 센다.
2. **`detect` 로는 못 가른다.** 지금 감지 신호는 `{ dependency: … }` 하나뿐이다(`schema.ts:236`).
   `typescript` 를 devDependency 로 안 두는 `.ts` 리포(Deno·Bun)가 있어 의존성으로 가르면 틀린다.
   확장자로 가르려면 스키마를 늘려야 하는데, 그 대가로 얻는 것이 위 표에 이미 있다.
3. **JS 만 쓰는 사용자가 6% 다.** 소수를 위해 축을 하나 더 여는 것보다 그 6% 에게 타입 개념이
   **안 보이는지**를 테스트로 못박는 편이 싸다.

**대신 할 것 둘.** ① 타입 개념 아홉을 `essential` 에 넣지 않는다 — `essential` 은 「이 언어 리포라면
어디나 있는 것」이어야 구멍 지도의 분모가 거짓말을 안 한다. ② `.js` 만 있는 픽스처로 인제스트해
`ts/type-*` 의 사용처가 0이고 구멍 지도에 안 뜨는지 확인하는 회귀 시험. 지금 이 성질은 `grammars` 를
손으로 맞춰 둔 덕에 **우연히** 성립한다.

---

## 6. `common/` 재사용 대 신규

`ts` 36개 중 **35개(97%)**가 `universal` 을 갖고 `common/` 30개를 **전부** 쓴다. 안 쓰이는 `common/` 은
없다. 이 수치는 파이썬의 21/30 과 뜻이 다르다 — `common/` 이 `ts` 에서 뽑혀 나왔기 때문에 100% 이고,
TS 가 **남에게서 물려받은 것은 0개**다. `universal: null` 은 `ts/index-access-pair` 하나뿐이다.
여럿에 걸린 `common/` 은 다섯이다: `destructuring`(배열·객체) · `iterate`(`forEach`·`for…of`) ·
`map-transform`(`map`·체인) · `nullish-default`(`??`·`||`) · `optional-chaining`(`?.`·`&&`).

### 신규 제안 11개 — 마지막 열이 「다른 언어 최소 둘에서도 성립하는가」다

| 새 `common/` id | name.ko / en | diff | `ts` 쪽 | 근거 |
|---|---|---|---|---|
| `record` | 이름표 붙은 묶음 / Keyed record | 1 | `object-literal` | py `dict` · go `map`/`struct` · rust `struct` · swift `Dictionary` |
| `truthiness` | 참 같은 값 / Truthiness | 2 | `truthy-falsy` | py(`if []`) · dart · lua. **rust·go 에는 없다** |
| `reference-sharing` | 같은 것을 둘이 가리킴 / Shared reference | 3 | `reference-sharing` | py 리스트 별칭 · go 슬라이스 backing · swift class vs struct |
| `closure` | 바깥 값을 데려가는 함수 / Closure | 3 | `closure` | py · rust(`move`) · swift(capture list) · go(반복 변수) |
| `module-import` | 파일 사이로 이름 옮기기 / Module import | 2 | `import-export` | py `import` · go `import` · rust `use` |
| `raise-error` | 터뜨리기 / Raising an error | 2 | `throw-error` | py `raise` · swift `throw` · dart `throw`. rust 는 `Result` 라 축이 다르다 |
| `fold-reduce` | 접어서 하나로 / Fold | 3 | `array-reduce` | py `functools.reduce` · rust `fold` · swift `reduce` |
| `class-definition` | 틀 정의하기 / Class definition | 3 | `class-declaration` | py · swift · dart · java |
| `type-annotation` | 값에 타입 적기 / Type annotation | 1 | `type-annotation` | py `x: int` · rust `let x: i32` · go `var x int` |
| `union-type` | 여럿 중 하나 / Union type | 2 | `union-type` | py `int \| str` · rust `enum` · swift `enum` |
| `type-narrowing` | 타입 좁히기 / Narrowing | 3 | `narrowing` | py `isinstance` 좁히기 · rust `match` · swift `if let` |

**보류 둘.** `common/named-shape`(`interface`/`type`)는 py `TypedDict`·rust `struct`·go `type` 이 있지만
`common/record` 와 겹치는 폭이 커서 `record` 만 먼저 낸다. `common/structural-typing` 은 성립하는 언어가
**`ts` 와 `go` 둘뿐**이라 「최소 2개」를 간신히 넘는다 — Go 사전을 쓸 때까지 `universal: null` 로 둔다.

**`universal: null` 로 둘 것 (8개).** `loose-equality`(`==` 강제 변환은 JS 고유) ·
`number-is-double`(정수 타입 없는 언어가 우리 목록에 없다) · `type-erasure` · `type-assertion` ·
`any-unknown` · `prototype-chain` · `this-binding`(파이썬 `self` 는 명시라 전이하면 왜곡된다) ·
`await-resume`(마이크로태스크 대기줄은 JS 실행 모델의 것).

---

## 7. `cs/` 로 밀어낼 것

`docs/curriculum/cs.md` 가 같은 날 별도로 서 있고, 거기 `cs/scope-and-lifetime` 과 `cs/compile-and-run`
의 소비자로 **`ts/closure` 와 `ts/type-annotation` 이 이미 적혀 있다** — 둘 다 아직 존재하지 않는
개념이고, 이 문서 §3 이 그 둘을 제안한 것과 독립적으로 겹쳤다. 간선은 **`ts/*` → `cs/*`** 방향이다.

| `cs/` id (cs.md 에 이미 있음) | 이 개념을 요구하는 `ts` 개념 |
|---|---|
| `cs/floating-point` | `number-is-double` · `arithmetic` |
| `cs/value-vs-reference` · `cs/aliasing` | `reference-sharing` · `object-spread` |
| `cs/closure-capture` · `cs/scope-and-lifetime` | `closure` · `this-binding` |
| `cs/compile-and-run` · `cs/static-vs-dynamic-typing` | `type-annotation` · `type-erasure` · `any-unknown` |
| `cs/call-stack` | `return-statement` · `throw-error` · `this-binding` |
| `cs/blocking-and-async` | `async-await` · `await-resume` · `callback-argument` |
| `cs/text-encoding` | `string-literal` — `'👍'.length` 가 2다 (UTF-16 코드 유닛) |
| `cs/hash-table` | `object-literal` — 키 순회 순서를 왜 약속 안 하나 |
| `cs/complexity` | `array-method-chain` · `array-reduce` |

**cs.md 에 없는데 필요한 것 하나** — `cs/task-queue`: 「지금 도는 일이 끝난 뒤 무엇을 먼저 꺼내나 —
대기줄이 하나가 아니다」. 선행 `cs/blocking-and-async`, 요구하는 쪽 `await-resume`·`callback-argument`.
`blocking-and-async`(기다림이 스택을 붙잡나 놓나)만으로는 `await` 다음 줄이 `setTimeout(…, 0)` 보다
**먼저** 도는 이유를 설명 못 한다.

---

## 8. tree-sitter 현실

### `grammar_abi: 15` 는 세 문법 중 하나에만 맞다

`Cargo.lock` 의 실제 의존성에서 `parser.c` 의 `LANGUAGE_VERSION` 을 직접 읽었다.

| grammar | 크레이트 | `LANGUAGE_VERSION` | node kind | `langs.rs` 의 `grammar_version` |
|---|---|---|---|---|
| `typescript` | `tree-sitter-typescript 0.23.2` | **14** | 316 | `14-316` |
| `tsx` | 같은 크레이트 | **14** | 326 | `14-326` |
| `javascript` | `tree-sitter-javascript 0.25.0` | **15** | 224 | `15-224` |
| (참고) `python` | `tree-sitter-python 0.23.6` | 14 | — | — |

`ts/_lang.yaml` 과 `react/_lang.yaml` 이 둘 다 `grammar_abi: 15` 다. `javascript` 에만 맞고
`typescript`·`tsx` 에는 **틀렸다.** D152 가 「틀리면 조용히 어긋난다」고 적은 그 자리인데, `ts` 는 한
네임스페이스가 문법 셋을 안아 **스칼라로는 애초에 맞출 수 없다.** 안 터지는 이유는 이 값이 검사에
안 쓰이기 때문이다 — `ingest.ts:84` 가 `` `${version}:${grammar_abi}` `` 로 사전 판 식별자를 만드는
데만 쓴다. 문법이 올라가도 이 값을 안 고치면 판 키가 그대로라 **다시 파싱해야 할 것을 캐시가 맞다고 한다.**

**제안:** `grammar_abi: { typescript: 14, tsx: 14, javascript: 15 }` 로 문법별 맵을 연다. 스키마가 지금
`z.number().int().positive()`(`schema.ts:231`)라 레코드와의 유니온이 필요하다. `py` 는 문법이 하나라
스칼라를 계속 받는다.

### 파싱 함정

| 함정 | 무엇이 어긋나나 | 상태 |
|---|---|---|
| `.ts` 를 `tsx` 로 읽기 | `type_assertion` 노드가 **`typescript` 에는 있고 `tsx` 에는 없다.** `<T>x` 캐스트가 tsx 에서 JSX 로 오파싱된다 | **확인** — `node-types.json` 대조. `_lang.yaml` 주석의 근거가 이것 |
| `f<A>(b)` | `typescript` 에서는 타입 인자를 가진 호출, `javascript` 에서는 `(f < A) > (b)`. **같은 글자가 문법에 따라 다른 나무**가 된다 | **확인** — 파이썬 연쇄 비교에 대응. 쿼리에서 `type_arguments` 를 명시해 잘라야 한다 |
| `.js` 에 타입 쿼리 | `javascript` 에는 `type_annotation`·`type_alias_declaration` 노드가 아예 없다(224 vs 316) | **확인** — `grammars:` 를 손으로 맞추는 것이 유일한 방벽 |
| 세미콜론 자동 삽입 | `return` 뒤 줄바꿈이 `return;` 이 된다. T1 줄 채점이 「같은 줄들」로 보면 **뜻이 다른 프로그램을 맞다고 한다** | **추정** — `t1-line.ts` 가 이 차이를 보는지 확인 필요 |
| `a ? .5 : 1` | `?` 다음 `.5` 를 `?.` 로 볼지 삼항으로 볼지. JS 렉서에 예외 규칙이 있다 | **추정** — `optional_chain` 으로 잡히는지 픽스처 필요 |
| `satisfies`·`accessor`·`using` | 0.23.2 의 `define-grammar.js` 에 셋 다 있고 `satisfies_expression` 노드도 있다 | **확인** — `const_type_parameter`(`<const T>`)는 **없다** |
| 데코레이터 `@Injectable()` | `decorator` 노드가 `javascript` 문법에도 있다 | **확인** — `.ts`·`.js` 어느 쪽으로 읽혀도 나무는 선다 |

---

## 9. 오개념 16개

progmiscon.org 의 JavaScript 항목은 **33건**이다 — 공개 6 · **초안 27**(2026-09-05 정적 API 실측 ·
[`ts-learning.md`](./ts-learning.md) §11.1). 전에 「여섯」이라 적었던 것은 공개분만 센 값이다.
공개 여섯은 `AssignmentCopiesObject` · `ClassDefinesType` · `ConstReferenceImpliesImmutability` ·
`NoAtomicExpression` · `NullIsObject` · `ThisAssignable` 이고 그중 넷이 아래와 겹친다 —
**이름만 인용하고 문장은 가져오지 않는다**(재사용 라이선스 없음, D148). **이벤트 루프 항목은
33건 중 0건**이다 — 이 리포 `await` 1,472곳의 축을 받쳐 줄 오개념 연구가 없다.

| # | 믿는 것 | 실제로는 | 걸리는 개념 |
|---|---|---|---|
| 1 | `const` 로 만들었으니 안의 값도 안 바뀐다 | 이름만 묶인다. `const o = {}` 여도 `o.a = 1` 은 된다 (`ConstReferenceImpliesImmutability`) | `reference-sharing` |
| 2 | `b = a` 로 객체를 복사했다 | 같은 것을 가리키는 이름이 하나 더 생겼을 뿐이다 (`AssignmentCopiesObject`) | `reference-sharing` |
| 3 | `{ ...obj }` 가 안쪽까지 새로 만든다 | **한 겹**만이다. 안쪽 객체는 원본과 같은 것을 가리킨다 | `object-spread` |
| 4 | `0` 과 `''` 도 「없음」이다 | 있는 값이다. `if` 에서 거짓처럼 보일 뿐이라 `\|\|` 가 덮어쓴다 — `??` 가 생긴 이유 | `truthy-falsy` · `nullish-coalescing` |
| 5 | `==` 와 `===` 는 같다 | 타입이 다르면 `==` 가 한쪽을 바꿔 견준다. `null == undefined` 는 참 | `loose-equality` |
| 6 | `interface` 는 이름이 다르면 못 넣는다 | 모양이 같으면 들어간다. TS 는 이름이 아니라 구조를 본다 (`ClassDefinesType` 과 같은 뿌리) | `structural-typing` |
| 7 | 타입을 적었으니 실행 중에도 확인해 준다 | 컴파일하면 사라진다. 응답이 `interface` 와 달라도 아무도 안 막는다 | `type-erasure` |
| 8 | `as` 를 쓰면 그 타입으로 바뀐다 | 값은 그대로다. 컴파일러 입만 막으므로 다음 줄에서 런타임에 터진다 | `type-assertion` |
| 9 | 메서드를 변수에 담아 불러도 `this` 는 같다 | 부른 자리가 정한다. `cb = obj.m; cb()` 의 `this` 는 `obj` 가 아니다 (`ThisAssignable`) | `this-binding` |
| 10 | `await` 가 프로그램 전체를 멈춘다 | 그 함수만 접힌다. 나머지는 계속 돌고 접힌 쪽은 마이크로태스크 대기줄에서 이어진다 | `await-resume` |
| 11 **초안** | `null` 과 `undefined` 는 같은 것이다 | 다르다 — 안 넣은 것(`undefined`)과 없다고 넣은 것(`null`)이다. `==` 로만 같고 `===` 로는 다르다 (`NullAndUndefinedAreTheSame`) | `undefined-null` |
| 12 **초안** | `typeof null` 은 `'null'` 이다 | `'object'` 다. 첫 판의 버그가 표준에 남았다 (`TypeofNullIsNull`) | `undefined-null` · `implicit-conversion` |
| 13 **초안** | `'ab' * 3` 이 문자열을 세 번 잇는다 | `NaN` 이다. JS 에는 문자열 반복 연산자가 없고 `repeat(3)` 이 그 자리다 (`StringRepetitionOperator`) | `implicit-conversion` · `arithmetic` |
| 14 **초안** | `==` 는 객체의 **값**을 견준다 | 객체끼리는 `==` 도 `===` 도 **자리**를 견준다. 강제 변환은 타입이 다를 때만 돈다 (`EqualityOperatorComparesObjectsValues`) | `loose-equality` · `reference-sharing` |
| 15 **초안** | 프로토타입은 클래스다 | 사슬로 이어진 **객체**다. `class` 가 그 사슬을 짓는 설탕이고 실측이 반대 방향을 가리킨다 — `ECC` 422파일에 `class` 1곳 대 `prototype` 36곳 (`PrototypesAreClasses`) | `prototype-chain` · `class-declaration` |
| 16 **초안** | `map` 은 원본을 고친다 | 새 배열을 만든다. 원본을 고치는 것은 `forEach` 안의 대입이나 `sort`·`splice` 다 (`MapInPlace`) | `array-map-immutable` |

**11~16 은 전부 progmiscon 의 초안(draft) 항목이다** — 공개분이 아니라서 「초안」이라고 표시했다.
더한 이유는 **0부 축 D(참·거짓)에 붙일 오개념이 하나도 없었기** 때문이고, 11·12·14 가 그 자리를
채운다([`ts-learning.md`](./ts-learning.md) §11.4).

1·4·10 은 이미 기존 YAML 의 `misconceptions:` 한 줄로 들어가 있다. 한 줄과 개념은 다르다 —
**한 줄에는 카드도 사용처도 겹도 안 붙는다.** §3 이 넷(`reference-sharing`·`truthy-falsy`·
`loose-equality`·`closure`)을 개념으로 올리자는 것이 이 뜻이다.

---

## 10. 근거와 출처

| 무엇 | URL / 경로 | 확인 |
|---|---|---|
| Exercism JS 트랙 (MIT · © 2021 Exercism) | `github.com/exercism/javascript/blob/main/config.json` | 확인 — 개념 37 · 개념 연습 29. 깊이 0~3: `basics · booleans · numbers · strings · arithmetic-operators · arrays · comparison · conditionals · for-loops · while-loops · increment-decrement`. `prerequisites` 간선은 **안 가져옴**(D148) |
| Exercism TS 트랙 | `github.com/exercism/typescript/blob/main/config.json` | 확인 — **모양이 다르다.** `concepts` 가 `basics` 하나, `status.concept_exercises: false`, 연습 131개가 전부 practice. **TS 트랙에서 가져올 목록은 없다** |
| tree-sitter-typescript | `~/.cargo/registry/…/tree-sitter-typescript-0.23.2/{typescript,tsx}/src/{parser.c,node-types.json}` | 확인 — ABI 14 / 316·326 kinds |
| tree-sitter-javascript | `~/.cargo/registry/…/tree-sitter-javascript-0.25.0/src/{parser.c,node-types.json}` | 확인 — ABI 15 / 224 kinds |
| TIOBE 2026-08 | `tiobe.com/tiobe-index/` · TechRepublic 2026-08 보도 | JS 6위 2.63% 는 확인. **TS 44위 0.37% 는 검색 요약에서만 봤다** — 원 페이지의 21~50 표를 못 열었다 |
| State of JS 2025 | `2025.stateofjs.com/en-US/usage/` | TS 만 40% · JS 만 6% — 2차 보도 경유, 원 페이지 재확인 필요 |
| JavaScript 오개념 | `progmiscon.org/misconceptions/JavaScript/` | 확인 — 6건, 이름만 인용 |
| 앱 쪽 근거 | `packages/concepts/src/{gaps.ts,zero-chapter.ts,ingest.ts}` · `packages/dictionary/src/{load.ts,lint.ts,schema.ts}` · `apps/desktop/src/data/blocks.ts` · `crates/parse/src/langs.rs` | 확인 — 줄 번호는 본문에 |

**확인 못 한 것.** ① TIOBE 원 페이지의 TypeScript 행 ② State of JS 2025 원 페이지 수치 ③ ASI 가 T1 줄
채점(`t1-line.ts`)에 실제로 새는지 ④ `a ? .5 : 1` 의 나무 모양 ⑤ Deno·Bun 리포에서 `typescript` 가
`package.json` 에 없는 비율 — §5 의 「`detect` 로는 못 가른다」를 수치로 못 댔다.

---

## §11 학습법 — 이 언어를 이해한다는 것

800줄 상한 때문에 갈라 냈다 → **[`ts-learning.md`](./ts-learning.md)**.
기계 넷(값 · 두 줄 · 사슬 · 컴파일 시각 타입) · 교재 다섯의 순서 대조 · 이 언어 특유의 연습
(`pedagogy.md` §4 의 세 시험) · 오개념 33건과 계산된 진단의 구멍 · 실측 · §1.5~§4 에 낼 diff 여덟.
