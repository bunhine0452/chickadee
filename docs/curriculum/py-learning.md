# 파이썬 학습법 — `py.md` §11

[`py.md`](./py.md) 의 §11 이다. 붙이면 본문이 800줄을 넘어 갈라 냈다.
**§1~§10 은 안 고친다** — 바꾸자는 것은 §11.6 에 diff 로만 적는다.
판정 기준은 [`pedagogy.md`](../program/pedagogy.md) §4, 형식은 [`fundamentals.md`](../program/fundamentals.md) §2,
그림은 [`diagrams.md`](../../design/system/diagrams.md) §3 이 정본이다.

---

## §11 학습법 — 이 언어를 이해한다는 것

### §11.1 이 언어의 기계 — 한 문장과 그림

> **파이썬을 이해한다 = 「이름은 객체를 가리킬 뿐 담지 않는다」를 손으로 그릴 수 있다.**
> 상태는 둘이다 — **이름표 묶음**(프레임)과 **객체 창고**(힙). 대입은 화살표를 옮기고
> **값은 복사되지 않는다.** 식은 대입 **전에** 접혀 객체 하나가 되고, 호출은 이름표 묶음을 하나 더 쌓는다.

표기 기계(notional machine)라는 말은 du Boulay 1986 의 것이고, 그가 그 개념으로 가장 길게 다룬 예가
**대입**이다. Sorva 2013 은 그 뒤 30년의 연구를 모아 「표기 기계를 **명시적 학습 목표**로 삼아야
한다」로 닫는다 — 즉 이 한 문장을 학습자에게 **말해야** 하고, 코드 뒤에 저절로 생기기를 기다리면 안 된다.

**이 문장을 지어낸 것이 아니다. 파이썬 명세가 그렇게 적었다.**

| 근거 | 문장 |
|---|---|
| 언어 참조 7.2 | "Assignment statements are used to (re)bind names to values" — **bind** 이지 store 가 아니다 |
| 데이터 모델 3.1 | "All data in a Python program is represented by objects or by relations between objects. Even code is represented by objects." |
| 데이터 모델 3.1 | "Every object has an identity, a type and a value. … The `is` operator compares the identity of two objects" — `is` 와 `==` 의 차이가 **정의**로 적혀 있다 |
| 공식 FAQ | "Remember that arguments are passed by assignment in Python." — 인자 전달이 대입의 특수한 경우일 뿐이다 |

**파이썬에서 이 기계가 특별한 이유는 예외가 없다는 것이다.** 자바는 `int` 가 원시라 화살표 없는
값이 있고 JS 도 원시 일곱이 그렇다. 파이썬은 `1` 도 객체다(데이터 모델 3.1). 그래서 파이썬만
**화살표 하나짜리 기계로 전부**가 설명된다 — 다른 언어는 「원시는 상자, 객체는 화살표」 이중 기계를
가르쳐야 한다. 이것이 §11.3 에서 「특유」로 판정되는 유일한 근거다.

#### 기계가 설명하는 것과 못 하는 것

`progmiscon.org` 정적 API 를 직접 받아 세었다 — 파이썬 **32건**(공개 30 · 초안 2). `py.md` §9 의 14건과
합쳐 「기계의 어느 부분을 잘못 가졌나」로 갈랐다.

| 오개념 (`progmiscon` id 또는 `py.md` §9 번호) | 기계의 어느 부분이 틀렸나 |
|---|---|
| `VariablesHoldObjects` 「변수가 객체를 통째로 담는다」 | ① **화살표가 없다** — 이름 칸 안에 객체가 있다고 본다. 기계 전체의 반대말 |
| `VariablesHoldExpressions` 「`=` 가 식을 저장한다」 | ①+② 대입 **전에** 식이 접힌다는 것을 모른다 |
| `AssignmentCopiesObject` (§9 #1) | ① 화살표는 있는데 대입이 화살표 **끝**을 복제한다고 본다 |
| `AssignCompares` 「`=` 가 견준다」 | ① 대입이 상태를 바꾸는 일이라는 것을 모른다 |
| `SelfAssignable` 「`self` 재대입이 호출자에 보인다」 | ① `self` 도 이름표다 |
| 가변 기본 인자 (§9 #2) | ① 기본값 객체가 **정의 시점에 한 번** 만들어져 함수 객체에 매달린다 |
| 함수 안 대입이 바깥을 바꾼다 (§9 #8) | ①+③ 프레임이 여럿이라는 것 |
| `is` 와 `==` 가 같다 (§9 #4) | ① 화살표가 **같은 곳**을 가리키나 vs 화살표 **끝**이 같나 |
| `NoAtomicExpression` (§9 #3) | ② 「식은 한 조각일 수 없다」 |
| `OutsideInFunctionNesting` 「중첩 호출은 바깥부터」 | ② 접히는 방향 |
| `RightToLeftChaining` 「연쇄 접근은 오른쪽부터」 | ② 결합 방향 |
| `NoShortCircuit` 「`and`/`or` 는 늘 양쪽을 본다」 | ② 가지 하나가 안 열린다 |
| `PlusConcatenatesNumbers`·`NoSequenceRepetition` (§9 #6·#7) | ② 연산자가 **피연산자의 타입을 보고** 갈린다 |
| `3 / 2` 가 `1` 이다 (§9 #5) | ② 같은 자리 — `/` 가 타입을 보지 않고 늘 `float` 를 낸다 |
| `ComparisonWithBoolLiteral` 「`x == True` 를 써야 한다」 | ② 조건 자리가 값을 그대로 받는다 |
| `DeferredReturn`·`ReturnUnwindsMultipleFrames` (§9 #9 인접) | ③ 프레임이 하나씩 걷힌다 |
| `IfIsLoop`·`ConditionalIsSequence` (§9 #11·#12) | ③ 제어 흐름 |
| `ParenthesesOnlyIfArgument` (§9 #10) | ①+② 함수도 객체이고 괄호가 **부르기**다 |
| 들여쓰기는 보기용이다 (§9 #11) | **어느 기계도 아니다** — 파서 층 |
| `f` 를 빼먹으면 오류다 (§9 #13) | **어느 기계도 아니다** — 렉서 층 |
| `{}` 는 빈 집합이다 (§9 #14) | **어느 기계도 아니다** — 리터럴 표기 |

**기계는 하나가 아니라 셋이다.** ① 이름→객체 화살표 ② 식이 접히는 순서 ③ 프레임이 쌓이고 걷힘.
①만으로는 `NoShortCircuit`·`RightToLeftChaining` 을 못 설명하고, ②만으로는 별칭을 못 설명한다.
`py.md` §1.5.1 이 축 여덟에 그림 다섯을 붙인 것이 이 셋과 이미 맞는다 —
값 상자·메모리 줄은 ①, 평가 트리는 ②, 스택 프레임은 ③이다.

**설명 못 하는 셋이 무엇인지가 이 표의 값이다.** 파서·렉서·표기 층 셋은 기계의 결함이 아니라
**기계 밖**이고, 그 셋이 정확히 `py.md` §9 가 스스로 「근거가 약하다」고 적은 #13·#14 를 포함한다.
기계 시험과 근거 시험이 같은 답을 냈다.

#### 그림 — 하나가 모자란다

| 필요 | `diagrams.md` 의 것 | 상태 |
|---|---|---|
| ① 이름 하나 → 상자 하나 | **값 상자** `ValueBox` | 있다 |
| ① 이름 **둘**이 상자 **하나**를 | — | **없다** (아래) |
| ② 식이 접히는 순서 | **평가 트리** `EvalTree` | 있다 |
| ③ 프레임이 쌓인다 | **스택 프레임** | 명세만 (`diagrams.md` §3 순서 3) |

**신청 — 「별칭」은 새 그림이 아니라 기존 둘의 모델 한 칸이다.**
`ValueBoxModel` 의 칸은 `{ name, type, value, changed, from }` 이고, **메모리 줄**의 슬롯은
`{ addr, value, name? }` 로 `name` 이 **단수**다. 둘 다 「`a` 와 `b` 가 같은 객체를 가리킨다」를 못 그린다.
값을 나란히 적으면 `[1, 2]` 와 `[1, 2]` 가 되어 별칭인지 복사인지 구별이 안 된다 — 그리고 그 구별이
파이썬 오개념 목록의 첫 항목이다.

| 신청 | 무엇 | 모델 변경 | 아홉 언어도 쓰나 |
|---|---|---|---|
| **별칭 화살표** | 이름 둘이 상자 하나로 모이는 화살표. `b = a` 뒤의 상태 | 메모리 줄 슬롯의 `name?: string` → `names?: string[]`, 또는 `ValueCell` 에 `pointsTo?: string`(상자 라벨) | **쓴다** — JS·자바·C#·Go·스위프트가 같은 그림을 요구한다. 파이썬 전용이 아니다 |

새 컴포넌트가 아니라 **모델 한 칸**이므로 `diagrams.md` §3 「새 그림 종류를 늘리는 것보다 배운
규약을 다시 쓰는 쪽이 싸다」에 맞는다.

---

### §11.2 최고의 교재·코스가 수렴한 순서

넷을 원문으로 읽었다. 다섯째(Python Tutor · UUhistle)는 순서를 정하지 않는 **도구**라 따로 본다.

| 순 | 공식 튜토리얼 | Think Python 2e (Downey) | CS50P (Malan) | **우리** (`py.md` §1.5.4) |
|---|---|---|---|---|
| 1 | 3 계산기로서의 파이썬 (수·문자열·리스트) | 1 프로그램의 길 | 0 **함수**·변수 | **0부** 값과 식 (19판) |
| 2 | 4 제어 흐름 (`if`·`for`·`range`·**함수**) | 2 변수·식·문 | 1 조건 | **1부** 흐름과 묶기 (9판) |
| 3 | 5 자료구조 (리스트·튜플·집합·dict) | 3 **함수** | 2 반복 | **2부** 자료구조와 객체 (14판) |
| 4 | 6 모듈 | 4 인터페이스 설계 | 3 예외 | **3부** 프레임워크 |
| 5 | 7 입출력 | 5 조건과 재귀 | 4 라이브러리 | |
| 6 | 8 예외 | 6 값 있는 함수 | 5 단위 테스트 | |
| 7 | 9 클래스 (**9.1 이름과 객체**) | 7 반복 | 6 파일 I/O | |
| 8 | … | 8 문자열 | 7 정규식 | |
| 9 | **15 부동소수점 (부록)** | **10 리스트 (10.x 객체와 값·별칭)** | 8 객체 지향 | |
| 10 | | 11 dict · 12 튜플 | 9 기타 | |

#### 갈리는 자리 넷 — 그리고 이유를 적은 사람은 한 명뿐이다

**① 함수를 언제 낼 것인가 — 0주차부터 4장까지 벌어진다.**
CS50P 는 **0주에 함수**를 놓고, 공식 튜토리얼은 4.8(제어 흐름의 끝), Think Python 은 3장이다.
셋 중 **이유를 본문에 적은 곳이 없다.** 우리 배치(1부, 0부 다음)는 셋 중 가장 늦다.

**② 부동소수점을 언제 말하는가 — 셋 다 미루거나 안 한다.**
공식 튜토리얼은 **부록 15장**으로 본문 밖에 두었다. Think Python 은 2장에서 `float` 타입을
소개하되 부정확성을 절로 세우지 않는다. CS50P 는 0주에 서식·반올림을 다루되 2진 표현은 안 다룬다.
**우리 0부는 `float-inexact` 를 축 B 의 첫 판으로 앞에 놓는다** — 셋과 정면으로 어긋난다.

어긋나도 되는 이유가 있다. 셋의 독자는 **아직 코드가 없고**, 이 앱의 학습자는 이미 코드를 **가지고**
있으며 그 코드가 이미 `round(...)` 를 쓰고 있다(`py.md` §1.5.3 실측 — `adelie` 11곳/4파일).
「왜 반올림하는 줄이 여기 있나」는 튜토리얼 독자가 못 던지는 물음이다. **다만 이것은 우리 쪽 근거이지
저 셋을 반박하는 근거가 아니다** — 셋은 이유를 안 적었으므로 반박할 문장이 없다.

**③ 참조 의미론을 언제 — Think Python 만 절로 세우고, 그 자리는 「리스트」다.**
공식 튜토리얼은 본문에서 안 다루고 FAQ 로 밀었다. CS50P 는 안 다룬다. Think Python 10장(리스트)이
「객체와 값」·「별칭」·「리스트 인자」를 연달아 놓는다. **우리는 `py/reference-binding` 을 0부 축 G 에
두어 리스트(1부)보다 먼저 낸다.**

**여기서는 Think Python 쪽이 맞을 가능성이 크다.** 별칭은 **가변 객체가 있어야 관찰된다**.
`a = 1; b = a; b = 2` 로는 아무 일도 안 일어나고, 파이썬에서 학습자가 만나는 첫 가변 객체가 리스트다.
0부에 리스트가 없는데 별칭을 가르치면 **관찰할 수 없는 사실을 말로만** 전하게 되고, 그것이 정본 §1 의
「읽기는 인식이지 지식이 아니다」가 금지하는 자리다. → §11.6 diff ①.

**④ `is` 를 어디서 — 아무도 본문에서 안 가르친다.**
넷 중 셋이 안 다루고 공식 문서는 **FAQ** 에 넣었다. 그 FAQ 가 이 앱에 가장 쓸모 있는 1차 문장을 갖고 있다 —
동일성이 보장되는 경우는 **셋뿐**이다(`new = old` 대입 · `s[0] = x` 컨테이너 대입 · `None` 같은 싱글턴).
그 밖에는 「우연히 맞는다」이고, 파이썬 3.8 부터 컴파일러가 리터럴과의 `is` 에
`SyntaxWarning: "is" with a literal. Did you mean "=="?` 를 낸다(bpo-34850).

#### 수렴한 것은 순서가 아니라 그림이다

Python Tutor(Guo 2013)는 순서를 안 정한다. 그런데 그 도구가 화면에 그리는 것이 §11.1 의 기계
**그대로**다 — 실행 중인 줄 · **스택 프레임과 변수** · **힙 객체의 내용과 포인터** · 출력.
논문 시점에 20만 명이 썼고 버클리·MIT·워싱턴·워털루의 CS1 이 채택했다.
Sorva 의 UUhistle 은 한 걸음 더 가서 **학습자가 컴퓨터 역할을 맡아** 그 그림을 직접 조작하게 한다
(visual program simulation).

**최고의 자료들이 합의한 것은 「무엇을 몇 번째로」가 아니라 「어떤 그림을 보며 배우나」다.**
그 그림이 `diagrams.md` 의 값 상자·메모리 줄·스택 프레임 셋이고, 셋 중 하나가 아직 명세뿐이다(§11.1).

---

### §11.3 이 언어에 특유한 연습 형태

`pedagogy.md` §4 의 세 시험으로 판정한다. **T1 이식** — 나머지 아홉 언어에 옮기면 답이 **사라지는가**
(달라지기만 하면 `siblings` 가 이미 하는 일이라 일반론). **T2 조항** — 대표 오답이 명세 조항·경고·
`progmiscon` 항목 하나로 설명되는가. **T3 사전** — `universal` 이 `null` 인가.

| # | 연습 | T1 이식 | T2 조항 | T3 사전 | 판정 |
|---|---|---|---|---|---|
| 1 | **참조 그림 그리기** (프레임·힙 화살표) | ✕ — JS·자바·루비에 그대로 선다 | ○ `VariablesHoldObjects` | ✕ `common/variable-binding` | **탈락 — 일반론** |
| 1′ | **좁힌 판: 「원시가 하나도 없다」** — `1`·`"a"`·함수까지 전부 상자를 갖는가 | ○ 자바·JS·C·Go·러스트에서 **물음이 안 선다**(원시가 있다) | ○ 데이터 모델 3.1 | ○ | **통과** |
| 2 | **가변 기본 인자** — 같은 함수를 두 번 부른 뒤의 값 | ○ JS 는 **부를 때마다** 평가하고 자바·C·Go 는 기본 인자가 없다. 답이 사라진다 | ○ 공식 FAQ 「Default values are created exactly once, when the function is defined」 | ○ `py/default-argument` 는 `common/default-parameter` 라 T3 는 **탈락**하지만 T1·T2 가 조항 수준에서 갈린다 | **조건부 통과** — `universal` 을 쪼개야 한다(§11.6 ③) |
| 3 | **`//` 의 내림 방향** — `-7 // 2` | ✕ 열 언어가 답을 낸다(파이썬만 `-4`) | ○ 공식 FAQ 「integer division has to return the floor」 + `i == (i//j)*j + (i%j)` | ✕ `common/arithmetic` | **탈락 — 이미 `siblings` 가 한다**(`mod-neg` 카탈로그) |
| 4 | **`is` 대 `==`** | 부분 — 자바 `Integer` 캐시(−128~127)에 같은 함정이 있다 | ○ 데이터 모델 3.1 + `SyntaxWarning`(3.8) + FAQ 의 보장 셋 | ✕ `common/identity-vs-equality` | **부분 통과** — 「우연히 맞는다」는 파이썬·자바 공유. **파이썬만 컴파일러가 경고한다**로 좁히면 통과 |
| 5 | **연쇄 비교** — `a == b == c` | ○ 나머지 아홉에서 `(a == b) == c` 로 파싱되거나 타입 오류다. **물음이 다른 것이 된다** | ○ 언어 참조 「비교」 절, `comparison.scm` 이 이미 앵커로 잘라 뒀다 | ○ `universal: null` 후보 | **통과** |
| 6 | **`and`/`or` 가 피연산자를 돌려준다** — `x = a or 0` | 부분 — JS 도 같다. 갈리는 것은 **거짓 목록**이다 | ○ `NoShortCircuit`(공개) | 부분 | **부분 통과** — 「거짓이 되는 값이 무엇인가」로 좁히면 `table` 의 열이지 새 연습이 아니다 |
| 7 | **가변/불변 예측** — `xs.append(1)` 뒤 `ys` 는 | ✕ 참조 언어 전부에 선다 | ○ `AssignmentCopiesObject` | ✕ `common/mutating-append` 가 이미 있다 | **탈락 — 일반론.** 플랜 `{#a-state}` 가 이미 그 자리다 |
| 8 | **`UnboundLocalError` 예측** | 부분 — 스코프는 아홉에 다 있으나 **「읽기만 하려다 넣으면 위쪽 읽기까지 막힌다」**는 파이썬의 함수 단위 정적 스코프 결정에서 나온다 | ○ 언어 참조 4.2.2(이름 결정) | ✕ `cs/scope-and-lifetime` | **부분 통과** |

**세 시험을 통과한 것은 1′·5 둘이고, 조건부·부분이 넷, 탈락이 셋이다.**
탈락한 셋(참조 그림 · `//` · 가변 예측)은 **못 가르친다는 뜻이 아니라 파이썬 문서가 그것을 「파이썬
특유」로 적으면 안 된다**는 뜻이다. `pedagogy.md` §4 가 러스트에 준 지침 그대로다 —
「이 언어에서는 X 로 배워야 한다」가 아니라 「이 언어의 Y 조항이 다른 아홉에 없다」로 쓴다.

#### 형식으로 표현되나 — 넷과 새 둘

`fundamentals.md` §2 의 확정 형식은 **넷**(`value`·`step`·`table`·`build`)이고 `bits`·`predict` 는
내려갔다. `pedagogy.md` §3.2 가 새 둘(`order`·`trace-table`)을 제안했다.

| 연습 | 형식 | 되나 |
|---|---|---|
| 1′ 원시가 없다 | `value` | ○ `type(1)` · `id(1)` · `(1).bit_length()` 를 적게 한다 |
| 2 가변 기본 인자 | `table` | ○ 행 = 호출 회차, 열 = 반환값. **`step` 이 아니다** — 호출 **사이**의 시간 축이라 「한 식 안의 접힘」이 못 잡는다 |
| 4 `is` 대 `==` | `value` | ○ 다만 답이 「구현에 따라 다르다」인 자리가 있다(FAQ 의 보장 셋 밖). `fundamentals.md` §9 의 미정의 동작 처리 그대로 — **「답이 없다」를 정답으로 받는다** |
| 5 연쇄 비교 | `step` | ○ 걸음 셋 — `1 < 2 < 3` → `(1 < 2) and (2 < 3)` → `True` |
| 8 `UnboundLocalError` | `value` | **✕ 지금은 안 된다** — 답이 값이 아니라 **예외 이름**이고, `fundamentals.md` §3.2 의 정규화 표에 예외 이름 행이 없다. §11.6 ④ |
| 참조 그림(탈락했지만 낼 것) | **`trace-table`** | 조건부 — 아래 |

**`trace-table` 로 참조를 물으려면 칸 하나가 값이 아니어야 한다.** `pedagogy.md` §3.2 의
`trace-table` 은 「시간 × 변수 격자, 칸마다 값 일치」다. 그 격자로 별칭을 물으면 `a` 칸과 `b` 칸이
둘 다 `[1, 2]` 가 되어 **별칭과 복사가 같은 답**이 된다 — §11.1 의 그림 문제와 같은 뿌리다.

**새 형식을 만들지 않는다. `trace-table` 의 칸 종류를 하나 넓힌다.**

| 넓히는 것 | 내용 |
|---|---|
| 칸의 값 | `FundValue` **또는** 상자 라벨(`①`·`②`·…) |
| 채점 | 라벨 칸은 **분할(partition) 일치**로 본다 — 학습자가 붙인 라벨 이름은 안 보고, 「같은 라벨끼리 묶인 이름의 집합」이 정답의 묶음과 같은가만 본다. `①②①` 과 `②①②` 는 **둘 다 정답** |
| 왜 넷과 `order` 로 안 되나 | `value`·`step`·`table` 은 값 일치라 「같은 객체인가」를 못 묻는다. `order` 는 답이 순열이라 다른 물음이다 |
| 비용 | 채점 규칙 한 줄(분할 비교). payload 는 `cells[]` 에 종류 태그 하나 |

#### 「이 언어 특유」로 적을 문장 — 최종

| 대신 쓸 문장 | 걸리는 판 |
|---|---|
| 「파이썬에는 **원시 값이 하나도 없다**」 (데이터 모델 3.1) | `py/reference-binding` · `py/is-identity` |
| 「기본값은 **정의 시점에 한 번** 만들어진다」 (공식 FAQ) | `py/default-argument` |
| 「`a == b == c` 는 `a == b and b == c` 다」 (언어 참조) | `py/comparison` |
| 「`is` 를 리터럴에 쓰면 **컴파일러가 경고한다**」 (3.8 · bpo-34850) | `py/is-identity` |
| 「`//` 는 몫이 아니라 **바닥**이다 — `i == (i//j)*j + (i%j)` 를 지키려고」 (공식 FAQ) | `py/integer-division` |

---

### §11.4 연구된 오개념과 그 진단

#### `py.md` §9 에 없는 것 — `progmiscon` 32건과 대조

공개 30건 중 §9 의 14건이 덮는 것은 8건이다. **더할 값이 있는 것 여섯**을 고른다.

| id | 무엇을 믿나 | 붙는 개념 | 왜 더하나 |
|---|---|---|---|
| `VariablesHoldObjects` | 변수가 객체를 통째로 담는다 | `py/assignment` · `py/reference-binding` | **§11.1 기계의 정면 반대말**이고 §9 #1(`AssignmentCopiesObject`)보다 상위다 |
| `VariablesHoldExpressions` | `=` 가 식 자체를 저장한다 | `py/assignment` | 「대입 전에 식이 접힌다」를 못 가진 상태. `step` 형식이 겨냥하는 바로 그것 |
| `NoShortCircuit` | `and`/`or` 가 늘 양쪽을 본다 | `py/bool-op-value` | 축 E 의 신규 판에 붙일 오개념이 지금 **하나도 없다** |
| `ComparisonWithBoolLiteral` | 참·거짓을 보려면 `== True` 를 써야 한다 | `py/truthiness` · `py/boolean-literal` | 실측이 뒷받침한다 — 표본 202파일에 `== True`/`== False` 가 **0곳**인데 `if x:` 가 728곳이다(아래) |
| `OutsideInFunctionNesting` | 중첩 호출은 바깥부터 돈다 | `py/call-expression` · `py/operator-precedence` | **평가 트리 그림이 겨냥하는 오개념**인데 §9 에 없다 |
| `SelfAssignable` | `self` 에 다시 넣으면 호출자의 객체가 바뀐다 | `py/class-definition` | 축 G 의 화살표 기계가 클래스에서 되풀이되는 자리 |

**정정 하나.** `py.md` §9 #4(「`is` 와 `==` 는 같다」)의 참조가 `AssignCompares` 로 적혀 있는데,
`AssignCompares` 는 「**`=` 가 두 값을 견준다**」이지 `is`/`==` 가 아니다. `progmiscon` 파이썬 32건에
`is`/`==` 오개념은 **없다.** 근거를 공식 FAQ(동일성이 보장되는 셋)와 3.8 `SyntaxWarning` 으로 갈아야 한다.

#### 「값을 적게 했을 때 어떤 오답이면 이 오개념인가」

`fundamentals.md` §5 의 계산된 진단은 문항이 실은 `siblings`(**같은 식의 다른 언어 답**)에서 오답을
찾는다. 그러므로 **오답이 다른 언어의 정답일 때만** 돈다. 0부 19판을 그 기준으로 갈랐다.

| 잡히나 | 판 | 오답 → 진단 |
|---|---|---|
| **잡힌다** (7) | `integer-limit` | `2**100` 자리에 감긴 값 → `other-language`(자바·C#·러스트) |
| | `float-inexact` | `0.3` → `ideal-math` (어느 언어도 안 낸다) |
| | `integer-division` | `3` → `other-language`(자바·C·Go·…) |
| | `arithmetic` | `"ab" * 3` 에 `NaN` → `other-language`(JS). `1 + "1"` 에 `"11"` → `other-language`(JS·자바) |
| | `implicit-conversion` | `1 + 2.0` 에 `3` → `other-language`(정수 나눗셈 언어군) |
| | `truthiness` | `if 0:` 자리의 오답 → 자바는 **컴파일 오류**라 값이 없다(아래 한계) |
| | `text-length` | `len("가")` 에 `3` → UTF-8 바이트. `2` → UTF-16(JS·자바) |
| **못 잡는다** (8) | `assignment`·`reference-binding` | 「복사됐다」의 답은 다른 아홉에서도 **정답이 아니다**(JS·자바도 참조다). `unknown` 으로 떨어진다 |
| | `operator-precedence` | `2 ** 3 ** 2` 에 `64` — **어느 언어도 64 를 안 낸다**(우결합이 표준). `ideal-math` 도 아니다 |
| | `bool-op-value` | `x = a or 0` 의 오답이 `True`/`False` — 값의 종류가 다르지 언어가 다른 게 아니다 |
| | `comparison`(연쇄) | `1 < 2 < 3` 에 `False`(= `True < 3`) — 그것이 나머지 아홉의 답이지만 **식이 파싱조차 안 되는 언어가 많다** |
| | `is-identity` | 답이 참·거짓 둘뿐이라 어느 오답이든 다른 언어의 답이 된다 — **분류가 무의미하다** |
| | `boolean-literal` | `True + True` 에 `2` 는 JS 도 `2` 다. 오답 `True` 는 어느 언어의 답도 아니다 |
| | `f-string`·`string-literal` | 표기 층이라 값 비교가 안 선다 |
| **부분** (4) | `value-bits`·`number-literal`·`explicit-conversion`·`float`쪽 나머지 | 오답의 절반만 다른 언어의 답 |

**어림 결론 — 19판 중 계산된 진단이 도는 것은 절반 안팎이고, 못 도는 여덟이 전부 축 E·G·H 다.**
(이 수는 카탈로그의 식 넷을 19판으로 늘렸을 때의 **내 추정**이지 실측이 아니다. 실측하려면
`buildValueItems` 를 19판으로 확장해 돌려야 하고 그것은 이 문서의 범위 밖이다.)

**그래서 파이썬 안의 별도 오답 카탈로그가 필요하다.** 이것은 `fundamentals.md` §5 가
「진단문을 개념마다 저작하지 않는다」로 피하려던 저작 부채가 **일부 돌아오는 것**이다.
정직하게 크기를 적는다 — 판 여덟 × 대표 오답 2~3개 = **문장 16~24개**, 언어당. 열 언어면 160~240.
그 부채를 안 지려면 축 E·G·H 의 문항을 `value` 가 아니라 `trace-table`·`order` 로 내야 한다
(구조를 물으면 오답이 「어느 언어의 답」이 아니라 「어느 구조를 골랐나」가 되어 진단이 계산된다).

| 두 갈래 | 비용 | 잃는 것 |
|---|---|---|
| ⓐ 파이썬 오답 카탈로그를 판다 | 문장 16~24개 (언어당) | 열 언어로 곱해진다 |
| ⓑ 축 E·G·H 를 `trace-table`·`order` 로 낸다 | 형식 확장(§11.3) | 「값 하나를 적는다」의 단순함 |

**권고는 ⓑ 다.** ⓐ 는 `exercises.md` §1 이 「저작 부채」 열로 이미 내린 유형들과 같은 조건이다.

#### `progmiscon` 이 파이썬에서 유독 두꺼운 것 — 그리고 얇은 곳

32건 중 **함수·호출·반환에 걸리는 것이 10건**(`DeferredReturn`·`MultipleValuesReturn`·`ReturnCall`·
`ReturnUnwindsMultipleFrames`·`ParenthesesOnlyIfArgument`·`OutsideInFunctionNesting`·
`RecursiveFunctionNeedsIfElse`·`InitCreates`·`InitReturnsObject`·`NoEmptyInit`)이다.
**전부 기계 ③(프레임)이고, 우리 0부에는 함수가 없다**(`py.md` §1.5.1 — 「스택 프레임은 0부에 없다」).
그 열 건은 1부 `function-definition`·`return-statement`·`call-expression` 셋이 받아야 한다.

반대로 **비동기·데코레이터·컴프리헨션·타입 힌트에 걸리는 항목은 0건**이다. `py.md` §3·§4 가
그 넷을 중심·심화에 두었는데 오개념 근거는 없다 — `py.md` §10 이 이미 「나머지 여섯 언어의 오개념은
근거가 얇다」로 적은 문제가 **파이썬 안에서도 위쪽 절반에 그대로** 있다.

---

### §11.5 우리 앱에서 그 학습법이 서는 자리

#### 다섯 단과 기계 셋

| 단 | 어느 기계 | 지금 상태 |
|---|---|---|
| 1 읽기 | 어휘 — 기계 밖 | 있다 |
| 2 추적 | ③ 프레임·순서 | **경로만 있고 값이 없다**(`pedagogy.md` §1.2) |
| 3 예측 | ① 화살표 — 「무엇이 달라지나」의 답이 대개 **공유된 객체**다 | 있다 (`cut`·`reorder`) |
| 4·5 산출 | 전부 | 있다 |
| 0부 | ①②③ 전부를 **처음 세운다** | fundamentals.md §7 이 「다섯 단 **밖**」으로 못박았다 |

**빈자리 하나 — 0부에서 세운 기계를 2·3단이 쓴다는 것을 적은 문서가 없다.**
`fundamentals.md` §7 이 0부를 다섯 단 밖에 둔 근거 넷은 전부 **자료 구조**(0단 자리 없음 ·
`chapter` 표 · 정답지 · `course.md`)이고, **학습 순서상 0부가 2·3단의 선행이라는 관계**는 어디에도 없다.
0부를 건너뛴 사람이 3단 `cut` 을 만나면 「이 줄을 지우면 무엇이 달라지나」에 화살표 기계 없이 답해야 한다.
→ §11.6 ⑤.

#### J0 이 짚은 빈자리에 파이썬이 답하나 — **오늘은 아니다**

`pedagogy.md` §1.2: 연구의 tracing 은 **값과 상태를 손으로 굴리는 것**이고 앱의 2단
(`exec`·`hop`·`origin`·`caller`)에는 값을 굴리는 것이 하나도 없다. 파이썬의 참조 그림은 값 추적이고
`trace-table`(§11.3 확장판)이 정확히 그 자리다. 그런데 **2단은 내 코드에서 나온다**.

| 어디 | 재료 | 정답지 | 러너 |
|---|---|---|---|
| 0부 `trace-table` | 합성 예제 (3~5줄) | 손으로 접힌다 — 결정론 | **불필요** |
| 2단 `trace-table` | **내 코드** | 값을 실제로 굴려야 나온다 | **필요** |

`t3-adapter.ts` 의 `runners` 에는 `javaRunner` 하나뿐이다(`fundamentals.md` §2.3 확인).
**파이썬 어댑터가 없으므로 2단의 `trace-table` 은 오늘 못 선다.**
`trace-table` 을 0부에 두면 「합성 예제로 값 추적을 배우고, 내 코드에서는 경로 추적만 한다」가 되고
그 어긋남을 화면이 말해야 한다(D175 규칙 ①의 모양 그대로 — 「없으면 그 단을 게이트에서 뺀다」).

#### 「내 코드가 교재」가 성립하는가 — 실측

`py.md` §1.5.3 이 19판의 사용처를 정규식으로 쟀다. 그 표가 못 잰 것을 **`ast` 로 다시 쟀다** —
정규식이 아니라 파스 트리라 주석·문자열이 애초에 안 섞이고, 「이름 = 이름」 같은 **모양**을 셀 수 있다.
표본은 `adelie` 139파일 · `ECC` 63파일(파싱 성공분).

| 모양 | `adelie` | `ECC` py | 걸리는 판 | 판정 |
|---|---|---|---|---|
| `이름 = 이름` (별칭 모양) | **49곳 / 27파일** | 62 / 11 | `py/reference-binding` | 내 코드에서 확인 |
| `.append(` 호출 | 376 / 65 | 157 / 17 | `py/list-append` | 내 코드에서 확인 |
| `self.x = …` (속성 대입) | 463 / 56 | 106 / 16 | `py/assignment`(§2 ⓐ 가 쿼리에서 빠졌다고 지적한 자리) | **쿼리가 못 본다** |
| `+=` 등 복합 대입 | 180 / 42 | 78 / 5 | 같음 — §2 ⓐ | **쿼리가 못 본다** |
| **가변 기본 인자** (`def f(x=[])`·`={}`·`=set()`) | **0곳** | **0곳** | `py/default-argument` | **합성 + 「네 코드엔 없다」** |
| 연쇄 비교 `a == b == c` | 3 / 2 | 3 / 2 | `py/comparison` | **얇다** (min_sites 3 에 겨우 걸린다) |
| `**` (거듭제곱) | 2 / 1 | 1 / 1 | `py/operator-precedence` | **얇다** |
| `**` 중첩 (`a ** b ** c`) | **0곳** | **0곳** | 같음 | **합성** |
| `is` **리터럴** (`x is 1000` 류) | **0곳** | **0곳** | `py/is-identity` | 3.8 경고가 실제로 통했다 |
| `is True` / `is False` | **162곳 / 30파일** | 29 / 8 | `py/is-identity` | **내 코드에서 확인** — 전부 `assert f(x) is True` 꼴 |
| `is None` / `is not None` | 120 / 41 | 48 / 26 | `py/is-identity` · `py/none-value` | 내 코드에서 확인 |
| `x == True` / `== False` | **0곳** | **0곳** | `py/truthiness` | 오개념은 있는데 **코드에는 없다** |
| 비교 없는 `if x:` | **558 / 70** | 170 / 23 | `py/truthiness` | 내 코드에서 확인 |
| `x = a or b` (`and`/`or` 를 값으로) | 64 / 31 | 23 / 12 | `py/bool-op-value` | 내 코드에서 확인 |
| `+` 와 `*` 가 한 식에 섞임 | 15 / 3 | 11 / 5 | `py/operator-precedence` | **얇다** |
| `//` 바닥 나눗셈 | 10 / 4 | 5 / 2 | `py/integer-division` | 얇다 (§1.5.3 과 일치) |
| 문자열/리스트 `*` 반복 | 38 / 11 | 25 / 6 | `py/arithmetic`(§2 ⓑ) | 내 코드에서 확인 |
| `global` / `nonlocal` | 11 / 7 · 1 / 1 | 1 / 1 · 0 | `cs/name-scope` | 얇다 |

**이 표가 §1.5.3 에 더하는 것 셋.**

**① 가장 유명한 파이썬 함정이 표본에 0곳이다.** 가변 기본 인자는 공식 튜토리얼과 FAQ 가 둘 다
경고를 세운 자리인데 202파일에 **0곳**이다. 사유는 `scale` 이 아니라 **`idiom`** 이다 —
LLM 이 `= None` 관용구를 쓴다. D158 의 사유 축에서 갈리는 자리이고, 「없는 것을 가르치되 왜 없는지도
말한다」가 여기서 가장 잘 선다.

**② `is` 의 사용처는 있는데 「틀리는 자리」가 없다.** `is True` 162곳은 전부 `pytest` 단정문이고
`is` 리터럴은 0곳이다. 즉 이 리포에서 `is` 는 **옳게만** 쓰였다. `py/is-identity` 의 문항을
사용처에서 뽑으면 오개념을 못 건드린다 — **합성이 정본이어야 하는 판이 하나 더 있다.**

**③ §2 ⓐ 의 지적이 수치로 확인된다.** `assignment.scm` 이 못 보는 두 모양(`self.x =` · `+=`)이
`adelie` 에서 **643곳**이고, 쿼리가 보는 단순 대입에 견주면 무시할 수 없다. §2 ⓐ 는 「대부분」이라고
적었는데 이제 곳수를 댈 수 있다.

#### 0장 상한 24 폐지의 결과 — 파이썬 학습법 쪽 판단

**문제가 아니다. 오히려 이 언어에서는 폐지가 필요했다.**

근거 둘. **첫째, 0부 19판 중 셋(`integer-limit`·`float-inexact`·`integer-division`)이 사용처가
0~10곳**이다(§1.5.3). 상한이 살아 있으면 자르는 넷째 키가 id 알파벳순이므로
`float-inexact`·`integer-division`·`integer-limit` 셋이 알파벳 앞쪽에서 **살아남고** 사용처 많은 판이
잘릴 수도, 그 반대일 수도 있었다 — 어느 쪽이든 **교육이 아니라 이름이 정한다.**
**둘째, 0부의 신규 열 장이 `essential` 에 들면 후보가 34 가 되어**(`py.md` §1.5.5) 열 개가 잘린다.
상한을 30~34 로 올리는 것과 폐지하는 것의 차이는, 폐지하면 **§11.6 의 순서 변경이 상한 경쟁을
안 일으킨다**는 것이다.

**대신 값을 잃는 자리가 하나 있다.** 상한 24 는 「0장 = 12일」이라는 **약속**이기도 했다.
30~34판이면 15~17일이고, 그동안 학습자는 자기 코드를 한 줄도 안 본다 — 0부가 합성 예제이기 때문이다.
D177 규칙 ①(「개념마다 내 코드의 자리를 짚는다」)이 0부의 **17일 내내** 걸리지 않으면
이 앱은 그 기간 동안 일반 튜토리얼이다. 파이썬은 그 위험이 셋 중 가장 낮다 —
19판 중 16판이 내 코드에서 확인됐다(§1.5.3 + 위 표). **위험한 것은 나머지 셋이고, 그 셋이
연속으로 붙지 않게 배치하는 것**이 이 결정의 실무 부담이다.

---

### §11.6 바꿀 것 — diff

**본문은 안 고쳤다.** 아래는 제안이고 근거 열이 §11.x 를 가리킨다.

| # | 무엇을 | 어디서 → 어디로 | 근거 |
|---|---|---|---|
| ① | `py/reference-binding` | **0부 축 G** → **1부**, `list-literal` **뒤** | §11.2 ③ — 별칭은 가변 객체 없이 관찰되지 않는다. Think Python 10장이 유일하게 절로 세운 자리도 리스트다. **대안**: 0부에 `list-literal` 을 올리면 축이 아홉이 된다(README §8 의 여덟을 깬다) — 권고는 내리는 쪽 |
| ② | `py.md` §9 #4 의 참조 `AssignCompares` | → 공식 FAQ(동일성 보장 셋) + 3.8 `SyntaxWarning` | §11.4 — `AssignCompares` 는 「`=` 가 견준다」이지 `is`/`==` 가 아니다. **오인용이다** |
| ③ | `py.md` §9 에 오개념 여섯 추가 | — → `VariablesHoldObjects` · `VariablesHoldExpressions` · `NoShortCircuit` · `ComparisonWithBoolLiteral` · `OutsideInFunctionNesting` · `SelfAssignable` | §11.4. 앞의 둘은 §11.1 기계의 정면 반대말이고 지금 §9 에 없다 |
| ④ | `py.md` §1.5.1 형식 열의 `bits` · `predict` | → `table` · `value` | `fundamentals.md` §2.1·§2.2 가 둘을 **형식에서 내렸다**. §1.5.1 의 형식 열에 `bits` 2곳 · `predict` 4곳이 남아 있고 머리말의 형식 목록까지 세면 3곳 · 5곳이다 — 문서가 폐기된 형식을 가리킨다 |
| ⑤ | 0부와 2·3단의 관계 한 문단 | — → `py.md` §1.5.5 뒤 | §11.5 — 0부가 세우는 기계를 2·3단이 쓴다는 것이 어느 문서에도 없다. `fundamentals.md` §7 의 근거 넷은 전부 자료 구조이지 학습 순서가 아니다 |
| ⑥ | `py/default-argument` 의 `universal` | `common/default-parameter` → **`null` 후보** | §11.3 #2 — 「정의 시점에 한 번」과 JS 의 「호출마다」는 D4 전이가 걸리면 **틀린 것을 물려준다.** `common/` 를 쪼갤지는 `dictionary/**` 몫이라 신청만 한다 |
| ⑦ | `py.md` §2 ⓐ 의 「대부분」 | → 곳수 (`self.x =` 463곳/56파일 · `+=` 180곳/42파일, `adelie`) | README §12 규약 9(수치 없는 주장 금지) |
| ⑧ | `py.md` §9 #8 의 `cs/name-scope` | → **`cs/scope-and-lifetime`** | `dictionary/cs/` 43장에 `name-scope.yaml` 이 **없다.** [`cs.md`](./cs.md) §10.1 이 `name-scope`(py) 를 `cs/scope-and-lifetime` 으로 접은 뒤 py.md 가 안 따라갔다 — 「같은 기계에 여러 이름」을 막으려던 그 접기의 잔재다 |

#### 다른 문서에 내는 신청 — 이 문서가 안 고친다

| 어디 | 무엇 |
|---|---|
| `diagrams.md` | **별칭 화살표** — 새 컴포넌트가 아니라 메모리 줄 슬롯의 `name?` → `names?[]`, 또는 `ValueCell.pointsTo` (§11.1) |
| `fundamentals.md` §3.2 | 정규화 표에 **예외 이름** 행 — `TypeError`·`ValueError`·`UnboundLocalError` 를 답으로 받는다. 없으면 축 F·G 의 문항 둘이 못 선다 (§11.3) |
| `pedagogy.md` §3.2 `trace-table` | 칸의 값에 **상자 라벨**을 허용하고 그 칸은 **분할 일치**로 채점 (§11.3) |
| `dictionary/cs/**` | `py.md` §1.5.6 의 신청 셋(`cs/operator-precedence`·`cs/type-conversion`·`cs/truthiness`)은 그대로다. §11.1 이 하나를 더한다 — **`cs/name-binding`**(이름과 객체는 다른 것이다). 지금 `cs/value-vs-reference` 는 「값이냐 참조냐」이고, 파이썬처럼 **전부 참조인** 언어에서는 그 물음이 안 서서 대신 「이름표가 몇 개 붙었나」가 답이다 |

#### 결정 등록부 초안 — **번호 미정** (오케스트레이터가 매긴다)

`docs/00-overview.md` 에 **행을 올리지 않았다**(README §12 규약 10).

| 열 | 내용 |
|---|---|
| **문제** | 파이썬 0부 19판의 근거가 「어떤 개념을 담나」까지만이고 **「어떻게 배우게 하나」가 없다.** 그 결과 셋이 어긋나 있다 — ⓐ `reference-binding` 을 리스트보다 먼저 내는데 **불변 값으로는 별칭이 관찰되지 않는다** ⓑ 계산된 진단(`siblings`)이 축 E·G·H 에서 안 돌아 오답이 전부 `unknown` 이다 ⓒ `py.md` §9 의 오개념 14건 중 셋이 오인용·미출처다 |
| **결정** | ① `py/reference-binding` 을 0부 축 G 에서 **1부 `list-literal` 뒤로** 내린다 ② 축 E·G·H 의 문항을 `value` 가 아니라 **`trace-table`·`order`**(`pedagogy.md` §3.2)로 낸다 — 그러면 오답이 「어느 언어의 답」이 아니라 「어느 구조를 골랐나」가 되어 진단이 계속 **계산된다** ③ `trace-table` 의 칸에 **상자 라벨**을 허용하고 그 칸은 **분할 일치**로 채점한다(라벨 이름은 안 본다) ④ `fundamentals.md` §3.2 정규화 표에 **예외 이름** 행을 더한다 ⑤ `py.md` §9 를 여섯 더하고 하나 정정한다 |
| **왜** | 실측 — 표본 202파일(`adelie` 139 · `ECC` 63)을 `ast` 로 파싱했다. **가변 기본 인자 0곳** · `is` 리터럴 **0곳**(3.8 경고가 통했다) · `x == True` **0곳** · `**` 중첩 **0곳** 인 반면 `if x:` **728곳** · `is True` **191곳** · 별칭 모양 `이름 = 이름` **111곳**. `assignment.scm` 이 못 보는 두 모양(`self.x =` · `+=`)이 `adelie` 에만 **643곳**이다. `progmiscon.org` 정적 API 실측 — 파이썬 **32건**(공개 30 · 초안 2)이고 그중 `is`/`==` 오개념은 **없다**(§9 #4 의 `AssignCompares` 는 「`=` 가 견준다」다). 교재 근거 — Think Python 만 참조 의미론을 절로 세우고 그 자리가 **10장 리스트**다 |
| **자리** | `docs/curriculum/py.md`(§1.5.1 형식 열 · §1.5.4 배치 · §2 ⓐ · §9) · `docs/curriculum/py-learning.md` · `docs/program/fundamentals.md` §3.2 · `docs/program/pedagogy.md` §3.2 · `design/system/diagrams.md` §3 · `packages/grading/src/fundamentals.ts` |

---

### §11.7 출처

**1차** — 명세·공식 문서·논문 원문·도구 저자의 글.

| 무엇 | 어디 | 이 문서가 쓴 자리 |
|---|---|---|
| du Boulay, B. (1986) "Some Difficulties of Learning to Program", *Journal of Educational Computing Research* 2(1), 57–73 | https://journals.sagepub.com/doi/10.2190/3LFX-9RRF-67T8-UVK9 | §11.1 표기 기계의 출처 |
| Sorva, J. (2013) "Notional Machines and Introductory Programming Education", *ACM TOCE* 13(2), 1–31. DOI 10.1145/2483710.2483713 | https://dl.acm.org/doi/10.1145/2483710.2483713 | §11.1 「명시적 학습 목표로 삼아야 한다」 |
| Sorva, J. (2012) *Visual Program Simulation in Introductory Programming Education* (박사학위논문, Aalto) | http://lib.tkk.fi/Diss/2012/isbn9789526046266/ | §11.2 UUhistle — 학습자가 컴퓨터 역할을 맡는다 |
| Guo, P. J. (2013) "Online Python Tutor: Embeddable Web-Based Program Visualization for CS Education", *SIGCSE '13*, 579–584 | https://pg.ucsd.edu/publications/Online-Python-Tutor-web-based-program-visualization_SIGCSE-2013.pdf | §11.2 도구가 그리는 것 = §11.1 의 기계. 20만 사용자·CS1 채택 |
| Xie, B., Nelson, G. L., Ko, A. J. (2018) "An Explicit Strategy to Scaffold Novice Program Tracing", *SIGCSE '18* | https://www.benjixie.com/publication/sigcse-2018/ | §11.3 손으로 메모리 표를 채우면 추적 +15%·중간고사 +7% (n=24, p<0.05, **단일 소규모**) |
| Chiodini, L. 외 (2021) "A Curated Inventory of Programming Language Misconceptions", *ITiCSE '21* | https://www.chiodini.org/publications/iticse21-progmiscon.pdf | §11.1·§11.4 인벤토리의 정의와 구조 |
| `progmiscon.org` 정적 API — 2026-09-05 내려받아 셈 | https://progmiscon.org/json/data.json | 파이썬 **32건**(공개 30 · 초안 2) · 전체 247건 / 4언어. **이름만 인용, 문장 미복제** |
| Python 언어 참조 7.2 「Assignment statements」 | https://docs.python.org/3/reference/simple_stmts.html | §11.1 「(re)bind names to values」 |
| Python 언어 참조 3.1 「Objects, values and types」 | https://docs.python.org/3/reference/datamodel.html | §11.1 「All data … is represented by objects」 · identity/type/value · `is` 의 정의 |
| Python 공식 FAQ (Programming) | https://docs.python.org/3/faq/programming.html | §11.2 ④ 동일성 보장 셋 · §11.3 #2 「created exactly once, when the function is defined」 · #3 「integer division has to return the floor」 · 「arguments are passed by assignment」 |
| Python 3.8 릴리스 노트 / bpo-34850 — 리터럴과의 `is` 에 `SyntaxWarning` | https://bugs.python.org/issue34850 | §11.2 ④ · §11.3 #4 |
| Python 공식 튜토리얼 (목차 전량) | https://docs.python.org/3/tutorial/index.html | §11.2 순서표 · 부동소수점이 **부록 15장** |
| Downey, A. *Think Python* 2e (목차 전량) | https://greenteapress.com/thinkpython2/html/index.html | §11.2 순서표 · 10장이 별칭을 절로 세운다 |
| CS50P (주차 전량) | https://cs50.harvard.edu/python/ | §11.2 순서표 · 0주에 함수 |
| Jain, M. P., Choppella, V. (2025) "SimpliPy: A Source-Tracking Notional Machine for Simplified Python", arXiv:2510.16594 | https://arxiv.org/abs/2510.16594 | §11.1 — 파이썬 전용 표기 기계가 2025년에도 새로 제안된다는 근거. **도구 논문이고 효과 실측은 못 봤다** |

**2차** — 요약·보도. 이 문서의 주장을 떠받치는 데 쓰지 않았고, 원문을 못 연 자리만 표시한다.

| 무엇 | 상태 |
|---|---|
| Bastian, M., Mühling, A. (2025) "Misconceptions in Programming: Intuitive Reasoning and Tracing Task Performance Across Experience Levels", *ICER '25*. DOI 10.1145/3702652.3744209 | **제목·저자만 확인.** ACM 이 403 을 내 초록을 못 읽었다 — 「오개념이 경력자에게도 남는가」는 이 앱의 대상(이미 앱을 만든 사람)과 직결되므로 **읽어야 할 다음 문헌**으로 남긴다 |

**확인 못 한 것**

- §11.4 의 「19판 중 절반」은 **내 추정**이다. `buildValueItems` 를 19판으로 늘려 돌린 실측이 아니다.
- Think Python·CS50P·공식 튜토리얼 셋 다 **순서의 이유를 본문에 적지 않았다**(§11.2). 「적지 않았다」는
  내가 목차와 서문에서 못 찾았다는 뜻이고, 저자 인터뷰·강의록까지 뒤지지는 않았다.
- 파이썬 실행 러너 어댑터가 붙었을 때 `trace-table` 의 정답지 생성 비용(§11.5). 재 본 적 없다.
- `is True` 162곳이 **전부** `pytest` 단정문인지 — 앞 20줄을 표본으로 봤고 전수 확인은 안 했다.
