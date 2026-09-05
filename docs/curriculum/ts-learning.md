# JavaScript / TypeScript 학습법 — `ts.md` §11

[`ts.md`](./ts.md) 의 §11 이다. 붙이면 본문이 800줄을 넘어 갈라 냈다.
**§1~§10 은 안 고친다** — 바꾸자는 것은 §11.6 에 diff 로만 적는다.
판정 기준은 [`pedagogy.md`](../program/pedagogy.md) §4, 형식은 [`fundamentals.md`](../program/fundamentals.md) §2,
그림은 [`diagrams.md`](../../design/system/diagrams.md) §3 이 정본이다.

---

## §11 학습법 — 이 언어를 이해한다는 것

### §11.1 이 언어의 기계 — 한 문장이 안 된다

파이썬은 한 문장으로 끝난다(「이름은 객체를 가리킬 뿐 담지 않는다」).
**JS 는 안 된다. 기계가 셋이고 서로를 설명하지 않는다.**

> ① **값** — 원시 일곱과 객체 하나. 수는 종류가 **하나**(64비트 부동소수)이고,
>   종류가 다른 둘이 만나면 **연산자가 한쪽을 바꾼다.**
> ② **한 줄기와 두 줄** — 실행 줄기는 하나다. 그 줄기가 비면 **마이크로태스크 줄을 끝까지 비우고**
>   나서 태스크 줄에서 **하나**를 꺼낸다.
> ③ **찾기** — 객체에서 이름을 못 찾으면 사슬을 한 칸 올라간다. `this` 는 **부른 자리**가 정한다.
>
> **TS 는 넷째를 더한다** — ④ 타입은 **컴파일 시각에만 살고**, `if` 한 줄이 아래에서 할 수 있는 일을 바꾼다.

「셋이다」가 이 절의 주장이고, 근거는 **오개념이 셋으로 갈린다**는 것이다.
`progmiscon.org` 정적 API 를 직접 받아 세었다 — JavaScript **33건**(공개 6 · 초안 27).
(`ts.md` §9 는 「여섯」이라 적었는데 그것은 **공개 6건**만 센 것이다 — §11.6 ②.)

| 오개념 | 어느 기계 | 공개 |
|---|---|---|
| `NullIsObject` · `TypeofNullIsNull` · `NullAndUndefinedAreTheSame` | ① 값의 종류 | 1/3 |
| `AssignmentCopiesObject` · `ConstReferenceImpliesImmutability` · `ObjectAsParameterIsCopied` | ① 원시와 객체가 다르게 움직인다 | 2/3 |
| `EqualityOperatorComparesObjectsValues` · `EqualityOperatorComparesOnlyTypes` | ① 동등 알고리즘이 넷이다 | 0/2 |
| `StringRepetitionOperator` 「문자열에 수를 곱하면 반복된다」 | ① 연산자가 타입을 보고 갈린다 | 0/1 |
| `CharType` 「한 글자는 `char` 다」 | ① 원시에 문자 타입이 없다 | 0/1 |
| `NoReturnValue` 「`return` 이 없으면 값이 없다」 | ① `undefined` 도 값이다 | 0/1 |
| `NoAtomicExpression` · `ConditionalOperatorNotExpression` · `MandatoryAssignment` | ① 식과 문 | 1/3 |
| `ThisAssignable` · `NoGlobalObject` | ③ `this` 와 전역 | 1/2 |
| `PrototypesAreClasses` · `AccessingInexistentPropertyError` | ③ 사슬 | 0/2 |
| `ClassDefinesType` | **④ TS 의 구조 타입** — JS 기계가 아니다 | 1/1 |
| `FunctionAsValueWithParentheses` · `CallbackParametersInCaller` · `FunctionsCannotBeImmediatelyInvoked` · `FunctionsMustBeNamed` · `ArrowFunctionNoImpliedReturn` · `ArrowFunctionRequiresFunctionKeyword` · `NumberOfParametersMatchArguments` · `FunctionOverloading` | 함수 — ②의 **앞자리**(함수가 값이라는 것) | 0/8 |
| `MapInPlace` · `TypeofArrayIsArray` · `NoBracketNotationForObjects` · `IdentifierAsStringInBracketNotation` · `NoFunctionCallsChaining` · `ConstDeclarationCanBeLeftUninitialized` | 표준 라이브러리·표기 — **기계 밖** | 0/6 |
| **②(두 줄·이벤트 루프)** | — | **0/0** |

**발견 하나 — 인벤토리 33건 중 기계 ②에 걸리는 것이 0건이다.**
`ts.md` §9 #10(「`await` 가 프로그램 전체를 멈춘다」)은 그 문서가 직접 적은 것이고 연구 출처가 없다.
그런데 §11.5 실측에서 `await` 는 `ai-pm` 613파일에 **1,472곳 / 191파일**이다.
**가장 많이 쓰는 것에 오개념 연구가 없다.** 그러므로 기계 ②의 근거는 인벤토리가 아니라 **명세와
도구 저자의 글**로 대야 한다 — HTML 명세의 이벤트 루프 처리 모델, Jake Archibald 2015 글과 2018 강연.
그 둘이 정확히 **「출력 순서를 적어라」**로 가르친다(§11.3).

**기계를 명시적으로 가르치면 재는가 — JS 에서 잰 유일한 실험.**
Nelson·Xie·Ko 2017(ICER)은 JS 인터프리터의 제어 흐름 경로를 그대로 보여 주는 튜터(PLTutor)를 만들어
Codecademy(쓰기 위주)와 블록 무작위 비교했다. 평균 학습 이득이 **60% 높았고**(27문항 중 3.89 대 2.42),
그 이득이 중간고사를 예측했다(R²=.64, PLTutor 조에서만). **저자들이 「a small study」라고 적었다.**
근거 등급은 **단일**이다 — 그러나 「JS 를 기계로 가르친 것을 재 본」 실험이 이것 하나다.

#### 그림 — 하나가 없고, 하나는 파이썬과 같은 신청이다

| 필요 | `diagrams.md` 의 것 | 상태 |
|---|---|---|
| ① 수가 한 종류 · `0.1 + 0.2` | **비트 배열** `BitField` | 있다 |
| ① 강제 변환 | **타입 변환 사다리** | 명세만 (§3 순서 4) |
| ① 식이 접히는 순서 | **평가 트리** | 있다 |
| ② **두 줄이 비워지는 순서** | — | **없다** (아래) |
| ③ 객체 → 객체 화살표(사슬) | — | **없다** — `py-learning.md` §11.1 의 **별칭 화살표** 신청과 같은 모델이면 선다 |
| ④ 좁히기 | 표로 충분하다 — `trace-table`(§11.3) | 그림 불필요 |

**신청 — 「큐 사다리」는 새 컴포넌트가 아니라 걸음 사다리의 배치판이다.**
`diagrams.md` 가 SQL 의 「절 파이프」를 `FoldModel` 그대로(「`steps[i].code` 가 절, `type` 이 그 시점의
행 수」) 잡은 것과 같은 수법을 쓴다.

| 신청 | 무엇 | 모델 | 아홉 언어도 쓰나 |
|---|---|---|---|
| **큐 사다리** | 줄기 → 마이크로태스크 줄 → 태스크 하나 → 다시 마이크로태스크… 가 비워지는 순서 | `FoldModel` 그대로 — `steps[i].code` 가 실행된 콜백, `type` 이 **어느 줄인가**(`script`·`micro`·`task`) | **안 쓴다.** 파이썬 `asyncio`·C# 은 줄이 하나다 |

---

### §11.2 최고의 교재·코스가 수렴한 순서

다섯을 원문 목차로 읽었다.

| 순 | Eloquent JS 4e (Part 1) | javascript.info Part 1 | MDN Core Scripting | YDKJS 2e | **우리** (`ts.md` §1.5.4) |
|---|---|---|---|---|---|
| 1 | 1 서문 | 1 소개 | 1 JS 란 · 2 첫 실습 · 3 문제 해결 | Get Started | **0부** 값과 식 (21판) |
| 2 | **2 값·타입·연산자** (자동 형 변환 포함) | 2 기초 18장 — 변수(4) · 데이터 타입(5) · **형 변환(7)** · 연산자(8) · 비교(9) · `if`(10) · 논리(11) · `??`(12) · 반복(13) · `switch`(14) · 함수(15~17) | 4 변수 · 6 수와 연산자 · 8 문자열 | Scope & Closures | **1부** 흐름과 묶기 (13판) |
| 3 | 3 프로그램 구조 | 3 코드 품질 | 11 배열 | Objects & Classes | **2부** 타입과 객체 (18판) |
| 4 | 4 함수 | 4 객체 기초 | 14 조건 · 16 반복 · 18 함수 | Types & Grammar | **3부** 프레임워크 (6~15판) |
| 5 | 5 객체와 배열 | 5 데이터 타입 | 22 이벤트 | (Sync & Async 는 **취소**) | |
| 6 | 6 고차 함수 | 6 고급 함수 (클로저 · 스케줄링) | 26 객체 | | |
| 7 | **7 객체의 비밀 생활** (프로토타입 → class) | **8 프로토타입** → **9 클래스** | 28 DOM | | |
| 8 | 9 버그와 오류 | 10 오류 처리 | 29 네트워크 요청 · 30 JSON | | |
| 9 | 11 모듈 | **11 프로미스·async/await** (「Microtasks」가 이 절 안) | 33 디버깅 | | |
| 10 | **12 비동기** | 12 제너레이터 · 13 모듈 · 14 기타 | — | | |
| — | | **「Event loop: microtasks and macrotasks」는 Part 2(브라우저) → 기타** | **이벤트 루프 강의가 없다** | | |

TS 는 별도다. **TS Handbook 본편 여섯**: The Basics → Everyday Types → **Narrowing** → More on Functions →
Object Types → (타입 조작 8편) → Classes → Modules.

#### 갈리는 자리 넷

**① 형 변환을 언제 — javascript.info 는 `if` 보다 앞에, MDN 은 아예 안 한다.**
javascript.info 는 기초 18장 중 **7장**에 「Type Conversions」를 놓는다. 비교(9)·`if`(10)보다 앞이다.
Eloquent JS 는 2장 「Values, Types, and Operators」 안에서 자동 형 변환을 다룬다.
**MDN Core Scripting 34강에는 형 변환 강의가 없다.**
우리 0부 축 F(`implicit-conversion`·`explicit-conversion`)는 앞이다 — javascript.info·Eloquent 쪽이다.
**셋 중 이유를 적은 곳은 없다.**

**② 이벤트 루프를 어디 — 셋 다 뒤로 밀었고 하나는 브라우저 파트로 보냈다.**
javascript.info 가 이 물음을 **둘로 쪼갰다**. 「Microtasks」(프로미스 절 안, Part 1 §11)는
`Promise.resolve().then(...)` 이 동기 코드 뒤에 온다는 것만 가르치고, **두 줄의 전체 순서**
(「Event loop: microtasks and macrotasks」)는 **Part 2 브라우저 → 기타**에 있다 — DOM·이벤트·선택 영역
다음이다. Eloquent 는 Language 파트의 **끝**(12장), MDN 은 안 가르친다.

**어긋난다.** §11.5 실측에서 `await` 는 `ai-pm` 613파일에 1,472곳(191파일), `ECC` 422파일에 701곳(45파일)이다.
**교재가 맨 뒤에 두는 것을 학습자는 첫날부터 쓰고 있다.** 우리 2부(9일차 근처)도 뒤쪽이라 같은 문제를 진다.
다만 이 어긋남을 「교재가 틀렸다」로 읽으면 안 된다 — 교재의 독자는 코드가 없고, 이 앱의 학습자는
**이미 `await` 가 191개 파일에 박힌 리포**를 갖고 있다. 순서를 정하는 축이 다르다.

**③ 프로토타입이 class 앞인가 — 셋 다 「먼저」이고 우리만 반대다.**
javascript.info 8장 → 9장, Eloquent 7장 안에서 프로토타입 먼저, YDKJS 는 「Objects & Classes」 한 권.
**우리 §4 는 `prototype-chain` 의 prereq 를 `class-declaration` 으로 적어 반대로 세웠다.**
`ts.md` 의 근거는 재료다 — 「`class` 는 이 사슬을 짓는 설탕이고, 학습자가 실제로 보는 것은 `class` 다」.
**실측이 그 근거를 부순다**(§11.5): `ECC` 422파일에 `class` 선언 **1곳** · `prototype` **36곳/26파일**.
`ai-pm` 613파일에 `class` 17곳/17파일 · `prototype` 11곳/6파일. **JS 리포에서는 프로토타입이 더 많다.**
→ §11.6 ③.

**④ 좁히기(narrowing)를 언제 — Handbook 은 셋째, 우리는 열넷째.**
TS Handbook 은 `Narrowing` 을 **함수·객체 타입보다 앞**에 둔다. 그리고 **이유를 챕터 안에 적었다** —
TS 는 「JavaScript's runtime control flow constructs like `if/else`, conditional ternaries, loops,
truthiness checks」 위에 타입 분석을 **겹친다**. 즉 **`if` 를 배운 직후가 좁히기의 자리**다.
챕터가 가르치는 열둘은 순서대로 `typeof` · truthiness · 동등 · `in` · `instanceof` · 대입 ·
**control flow analysis** · 타입 술어 · 단언 함수 · 판별 유니온 · `never` · 완전성 검사다.

**우리 §3 은 `narrowing` 을 중심 14개의 마지막(#14)에 두고, §1.5.4 는 2부에 둔다.**
`if-statement` 는 1부다. 다섯 자료 중 **이유를 적은 유일한 곳이 Handbook** 이고, 그 이유가 우리와
어긋난다 → §11.6 ④.

#### 수렴한 것

파이썬 쪽(`py-learning.md` §11.2)에서 수렴한 것은 **그림**이었다. JS 에서는 다르다 —
다섯이 수렴한 것은 **「값과 타입을 맨 앞에 놓는다」** 하나뿐이다(Eloquent 2장 · javascript.info 4~7장 ·
MDN 4~8강 · YDKJS 「Types & Grammar」 · 우리 0부). 그 밖의 모든 자리에서 갈린다.
그래서 이 언어에서는 **순서를 교재에서 빌릴 수 없다.** 빌릴 수 있는 것은 §11.1 의 기계 셋과
§11.3 의 연습 형태다.

---

### §11.3 이 언어에 특유한 연습 형태

`pedagogy.md` §4 의 세 시험. **T1 이식** — 나머지 아홉 언어에 옮기면 답이 **사라지는가**.
**T2 조항** — 대표 오답이 명세 조항·`progmiscon` 항목 하나로 설명되는가. **T3 사전** — `universal` 이 `null` 인가.

| # | 연습 | T1 이식 | T2 조항 | T3 사전 | 판정 |
|---|---|---|---|---|---|
| 1 | **이벤트 루프 추적** | ✕ 파이썬 `asyncio` · C# `async` · 러스트 `.await` 에 다 선다 | 부분 | ✕ | **탈락** — `pedagogy.md` §4 가 이미 그렇게 판정했다 |
| 1′ | **마이크로태스크가 태스크보다 먼저** — `Promise.then` 과 `setTimeout(…, 0)` 의 출력 순서 | ○ 아홉에 **줄이 둘인 언어가 없다.** 파이썬 `asyncio` 는 단일 큐이고 우선순위가 언어 의미론이 아니다. **물음이 안 선다** | ○ HTML 명세 8.1.7 「microtask checkpoint」 | ○ `exec/await-order` (D151 후보) | **통과** |
| 2 | **`this` 바인딩 예측** — `const cb = obj.m; cb()` 의 `this` | ○ 파이썬 `self` 는 **명시 매개변수**라 잃을 수 없고, 자바 `this` 는 인스턴스에 묶인다. **답이 사라진다** | ○ `ThisAssignable`(공개) + MDN 「depends on how a function is invoked (runtime binding)」 | ○ `null` | **통과** — 다만 재료가 없다(§11.5) |
| 3 | **타입 강제 값 적기** — `1 + '1'` · `'5' * 2` · `'3' - 1` | 부분 — 답이 사라지는 게 아니라 **「멈춘다」로 바뀐다** | ○ MDN 동등 비교 표 · `StringRepetitionOperator` · `PlusConcatenatesNumbers`(파이썬 항목이지만 JS 에서 참) | 부분 | **부분 통과** — 그리고 진단 기계에 구멍을 낸다(§11.4) |
| 4 | **동등 알고리즘이 넷** — `==` · `===` · `Object.is` · SameValueZero | ○ 아홉에 동등이 넷인 언어가 없다. `NaN !== NaN` 만이면 자바·C 도 같아 **탈락**하지만, **넷을 한 표에 놓으면 물음이 JS 에만 선다** | ○ MDN 「Equality comparisons and sameness」 + `EqualityOperatorComparesOnlyTypes` | ○ `ts/loose-equality` 는 `universal: null` | **통과** |
| 5 | **프로토타입 사슬 추적** | ○ 클래스 기반 아홉에 사슬이 없다 | ○ `PrototypesAreClasses`(초안) | ○ | **통과 — 그런데 재료가 얇다**(§11.5) |
| 6 | **TS 타입 좁히기 추적** — 줄마다 `x` 의 타입 | ○ 아홉에 「`if` 한 줄이 타입을 바꾼다」가 없다 | ○ Handbook 「control flow analysis」 | ○ `common/type-narrowing` 은 §3 의 **신규 제안**이라 아직 없다 | **통과 — 여섯 중 가장 깨끗하다** |
| 7 | **`===` 는 있는데 `==` 를 섞어 쓴 파일** | ✕ 리포의 성질이지 언어의 성질이 아니다 | — | — | **탈락** — 이것은 `alternatives:` 짝이지 연습이 아니다 |

**통과가 다섯이고 파이썬(둘)보다 많다.** 이유는 명세 쪽이다 — JS 는 다른 언어가 안 한 선택을
**연산자와 런타임 층에서** 했고(수 하나 · 강제 변환 · 두 큐 · 사슬), TS 는 그 위에 **컴파일 시각에만
사는 층**을 하나 더 얹었다. 파이썬의 특이점은 대부분 「전부 객체다」 하나로 접힌다.

#### 형식으로 표현되나

`fundamentals.md` §2 의 확정 형식은 **넷**(`value`·`step`·`table`·`build`)이고 `bits`·`predict` 는 내려갔다.
`pedagogy.md` §3.2 가 새 둘(`order`·`trace-table`)을 제안했다.

| 연습 | 형식 | 되나 |
|---|---|---|
| 1′ 마이크로태스크 순서 | **`order`** | ○ **새 형식을 만들지 않는다.** `pedagogy.md` §3.2 의 `order` 가 그대로 맞는다 — 답이 **순열**이고 채점이 「맞은 인접 쌍 / (N−1)」(2단 `hop` 의 규칙)이다. `step` 은 안 된다 — 이월 채점이라 첫 줄을 틀리면 뒤가 그 기준으로 채점되는데, 출력 순서는 첫 줄을 틀려도 나머지 순서가 맞을 수 있다 |
| 2 `this` | `value` | ○ 답이 `undefined` 또는 객체 이름 하나 |
| 3 강제 변환 | `value` | 조건부 — **`siblings` 가 오류를 못 싣는다**(§11.4) |
| 4 동등 넷 | `table` | ○ 행 = 값 쌍, 열 = 알고리즘 넷. MDN 표의 **구조만** 가져오고 값 쌍은 우리가 고른다(저작권) |
| 5 사슬 추적 | 기존 2단 `origin` | ○ 「이 값은 어디서 처음 정해지나」와 같은 모양이다. 새 형식 불필요 |
| 6 좁히기 추적 | **`trace-table`** | ○ 행 = 줄, 열 = 이름, 칸 = **타입 문자열**. `pedagogy.md` §3.2 의 「시간 × 변수 격자」 그대로이고 칸의 값이 값 대신 타입일 뿐이다. **정답지는 저작 시점에 `tsc` 로 한 번 뽑고 채점은 문자열 일치** — 러너 불필요 |

**`order` 의 정답지가 어디서 오나가 갈림길이다.**

| 재료 | 정답 순서 | 러너 |
|---|---|---|
| 합성 예제 (`console.log` 넷 + `setTimeout` 하나 + `.then` 둘) | 카탈로그에 적는다 — 결정론 | **불필요** |
| **내 코드** | 실제로 돌려야 나온다 | **필요** — `t3-adapter.ts` 의 `runners` 에 JS 어댑터가 없다 |

`fundamentals.md` §2.3 확인 — 어댑터는 `javaRunner` 하나다. **JS 도 파이썬과 같은 조건이다.**

---

### §11.4 연구된 오개념과 그 진단

#### `ts.md` §9 에 없는 것 — `progmiscon` 33건과 대조

`ts.md` §9 의 10건 중 인벤토리와 겹치는 것이 넷이다. **더할 값이 있는 것 여섯**을 고른다.

| id | 무엇을 믿나 | 붙는 개념 | 왜 더하나 | 상태 |
|---|---|---|---|---|
| `NullAndUndefinedAreTheSame` | `null` 과 `undefined` 는 같다 | `ts/undefined-null` | 0부 축 D 의 판에 붙일 오개념이 지금 **하나도 없다** | 초안 |
| `TypeofNullIsNull` | `typeof null` 은 `"null"` 이다 | `ts/undefined-null` · `ts/explicit-conversion` | MDN 이 **역사적 버그**로 명시하고 수정안이 기각된 것까지 적었다 — T2 조항이 가장 단단한 항목 | 초안 |
| `StringRepetitionOperator` | 문자열에 수를 곱하면 반복된다 | `ts/arithmetic` · `ts/implicit-conversion` | **파이썬의 `NoSequenceRepetition` 과 정확히 반대다** — 파이썬은 「반복이 없다」고 믿고 JS 는 「있다」고 믿는다. `siblings` 진단이 양방향으로 도는 유일한 짝 | 초안 |
| `EqualityOperatorComparesObjectsValues` | `==`/`===` 가 객체의 **내용**을 견준다 | `ts/comparison` | `ts.md` §9 는 `===` 쪽만 적었는데 인벤토리는 둘을 갈랐다 | 초안 |
| `PrototypesAreClasses` | JS 는 클래스 기반이다 | `ts/prototype-chain` | §11.2 ③ 의 순서 판단과 같은 뿌리 | 초안 |
| `MapInPlace` | `map` 이 원본을 고친다 | `ts/array-map-immutable` | `common/map-transform` ↔ `common/mutating-append` 가 이미 갈라 둔 자리(플랜 `{#a-state}`)의 JS 판 | 초안 |

**초안 27건을 어떻게 다루나.** `progmiscon` 은 `status: public`/`draft` 를 구분하고 JS 는 **6 대 27** 로
초안이 압도적이다(파이썬은 30 대 2). 초안 항목은 교실 관찰로 등록됐으나 아직 심사를 안 거쳤다는 뜻이다.
**「초안」이라고 적고 쓴다** — 안 쓰면 JS 오개념 근거가 6건으로 줄어 축 여덟 중 셋이 근거 없이 남는다.

#### 「값을 적게 했을 때 어떤 오답이면 이 오개념인가」

`fundamentals.md` §5 의 계산된 진단은 문항이 싣는 `siblings`(**같은 식의 다른 언어 답**)에서 오답을 찾는다.
**JS 에는 구조적 구멍이 하나 있다.**

> `siblings[].value` 가 `FundValue` 다 — **값**이다. 그런데 JS 의 강제 변환 문항에서 학습자가 적는
> 대표 오답은 `TypeError` 다. JS 는 열 언어 중 「멈추지 않는」 쪽이라 **오답이 다른 언어의 값이 아니라
> 다른 언어의 오류**다. `1 + '1'` 에 `TypeError` 를 적으면 그것은 **정확히 파이썬의 규칙**인데
> `siblings` 에 파이썬의 답이 없어서(값이 아니므로) `unparsable` 로 떨어진다.

| 제안 | 내용 |
|---|---|
| 넓히는 것 | `siblings[].value: FundValue` → `FundValue \| { t: 'error'; v: string }` |
| 진단문 | `fund.missOtherLanguage` 옆에 하나 — 「그 답은 <언어>의 규칙이다. <언어>는 그 자리에서 멈춘다」 |
| 왜 필요한가 | 이것 없이는 JS 0부 축 E·F 의 대표 오답이 **전부** `unknown` 이다 |
| 비용 | 타입 유니온 한 갈래 + i18n 키 하나. 진단문은 여전히 **계산된다**(사람이 개념마다 안 적는다) |

**이 하나를 넓히면 무엇이 달라지나 — 21판을 갈랐다.**

| 잡히나 | 판 |
|---|---|
| **지금도 잡힌다** (6) | `number-is-double`(`9007199254740993` → 다른 언어는 정확) · `float-inexact`(`0.3` → `ideal-math`) · `integer-division`(`3` → `other-language`) · `text-length`(`'👍'.length` 에 `1` → 파이썬) · `truthy-falsy`(빈 배열 → 파이썬은 거짓) · `value-bits` |
| **오류 sibling 을 넣으면 잡힌다** (5) | `arithmetic`(`1 + '1'` 에 `TypeError`) · `implicit-conversion`(`'5' * 2` 에 `TypeError`) · `explicit-conversion`(`Number('')` 에 `ValueError`) · `string-literal` · `boolean-literal`(`Boolean("false")`) |
| **그래도 못 잡는다** (7) | `operator-precedence`(`a \|\| b && c` 의 잘못된 묶음은 **어느 언어의 답도 아니다**) · `conditional-ternary`(중첩 결합 방향, 같은 이유) · `const-declaration`·`reassignment`·`reference-sharing`(참조 오개념 — JS·파이썬·자바가 **다 같아서** sibling 이 안 생긴다) · `comparison`·`loose-equality`(답이 참·거짓 둘뿐이라 분류가 무의미) |
| **부분** (3) | `number-literal` · `template-literal` · `undefined-null` |

**파이썬과 같은 결론이다** — 못 잡는 일곱이 전부 **평가 순서(축 E)와 참조(축 G)와 동등(축 H)** 이다.
`py-learning.md` §11.4 가 축 E·G·H 를 짚은 것과 정확히 같은 셋이다. **두 언어가 독립적으로 같은 자리를
가리킨다면 그것은 언어의 성질이 아니라 형식의 성질이다** — `value`(값 하나 적기)로는 **구조**를 못 묻는다.
축 E 는 `order`(어느 순서로 접히나), 축 G 는 `trace-table`(어느 이름이 어느 상자를), 축 H 는
`table`(알고리즘 × 값 쌍)이 답이다.

---

### §11.5 우리 앱에서 그 학습법이 서는 자리

#### 다섯 단과 기계 넷

| 단 | 어느 기계 | 지금 상태 |
|---|---|---|
| 1 읽기 | 어휘 — 기계 밖 | 있다 |
| 2 추적 | ② 두 줄 · ③ 사슬 | **경로만 있고 값·순서가 없다**(`pedagogy.md` §1.2) |
| 3 예측 | ① 강제 변환 · ④ 좁히기 | 있다 (`cut`·`reorder`·`contract`) |
| 4·5 산출 | 전부 | 있다 |
| 0부 | ①을 세우고 ②③④의 씨앗만 | `fundamentals.md` §7 이 「다섯 단 **밖**」으로 못박았다 |

#### J0 이 짚은 빈자리에 JS 가 답하나 — **절반은 답한다**

`pedagogy.md` §1.2: 연구의 tracing 은 값을 손으로 굴리는 것이고 앱의 2단
(`exec`·`hop`·`origin`·`caller`)에는 값을 굴리는 것이 없다.

| 후보 | 어느 형식 | 2단에 설 수 있나 |
|---|---|---|
| 마이크로태스크 순서 | `order` | **조건부** — 정답 순서를 내 코드에서 뽑으려면 실행이 필요하다. JS 러너 어댑터가 없다 |
| TS 좁히기 추적 | `trace-table` | **선다.** 정답지가 `tsc` 의 산출이고 **저작 시점에 한 번** 뽑으면 된다 — 학습자 기계에서 실행할 필요가 없다 |
| 프로토타입 사슬 | 기존 `origin` | 선다 — 정답지가 정적이다 |

**TS 좁히기가 2단의 빈자리를 실제로 채우는 유일한 후보다.** 값을 굴리는 것인데(줄마다 타입이 바뀐다)
정답지가 **컴파일러의 정적 산출**이라 러너가 필요 없다. 열 언어 중 이 조건을 만족하는 것은
TS 하나다 — 나머지 아홉에서 「줄마다 이 이름은 무엇인가」의 답은 실행해야 나온다.
이것이 §11.3 #6 이 「여섯 중 가장 깨끗하다」인 두 번째 이유다.

#### 「내 코드가 교재」가 성립하는가 — 실측

`ts.md` §1.5.3 이 21판의 사용처를 쟀다. **그 표에 없는 축을 다시 쟀다** — 주석·문자열·템플릿을 지운 뒤
정규식으로, 표본은 `ECC` js/jsx 422파일 · `ai-pm` ts/tsx 613파일.

| 모양 | `ECC` js (422) | `ai-pm` ts (613) | 걸리는 판 | 판정 |
|---|---|---|---|---|
| `await` | **701곳 / 45파일** | **1,472 / 191** | 2부 `async-await` · `await-resume` | 내 코드에서 확인 |
| `async` | 425 / 48 | 884 / 192 | 같음 | 내 코드에서 확인 |
| `.then(` | 40 / 25 | 189 / 83 | 같음 | 내 코드에서 확인 |
| `setTimeout`/`setInterval` | 33 / 20 | 58 / 49 | ② 태스크 줄 | 얇다 |
| `queueMicrotask` | **0곳** | 1 / 1 | ② 마이크로태스크 줄 | **합성** |
| **두 줄이 같은 파일에** (타이머·이벤트 ∧ `await`/`then`) | **16파일 / 422 (3.8%)** | **55 / 613 (9.0%)** | ② `order` 문항의 재료 | **있다 — 얇지만 있다** |
| `this` | **12곳 / 6파일** | **73 / 10** | ③ `this-binding` | **거의 없다** |
| `=>` 화살표 | 5,340 / 363 | 10,723 / 529 | 1부 `arrow-function` | 내 코드에서 확인 |
| `.bind(`/`.call(`/`.apply(` | 47 / 31 | 4 / 3 | ③ `this-binding` | 얇다 |
| `prototype` | 36 / 26 | 11 / 6 | ③ `prototype-chain` | **얇다** |
| `class X` 선언 | **1곳 / 1파일** | 17 / 17 | 2부 `class-declaration` | **`ECC` 에는 없다** |
| `Math.floor(` | 25 | 30 | 0부 `integer-division` | 내 코드에서 확인 |
| `Math.trunc(` | **0곳** | **2곳** | 같음 — **버림의 두 방향** | **합성 + 「네 코드엔 없다」** |
| `.toFixed(` | 4 / 3 | 4 / 3 | 0부 `float-inexact` | 얇다 (§1.5.3 과 일치) |
| `BigInt`·`MAX_SAFE_INTEGER`·`123n` | 7 / 1 | 3 / 2 | 0부 `number-is-double` | **합성** |
| `?.` | 184 / 58 | 942 / 202 | 2부 `optional-chaining` | 내 코드에서 확인 |
| `??` | 95 / 28 | 838 / 240 | 2부 `nullish-coalescing` | 내 코드에서 확인 |
| `typeof x ===` (좁히기 모양) | **283 / 108** | 34 / 27 | 2부 `narrowing` | 내 코드에서 확인 |
| `as` 단언 | — | **657 / 201** | 심화 `type-assertion` | 내 코드에서 확인 |
| `interface X` | — | **339 / 224** | 2부 `interface-type` | 내 코드에서 확인 |
| `type X =` | — | **529 / 128** | 같음 | 내 코드에서 확인 |
| 유니온(`: A \| B` 모양) | 21 / 10 | **1,317 / 310** | 2부 `union-type` | 내 코드에서 확인 |
| `unknown` | 9 / 5 | 302 / 94 | 심화 `any-unknown` | 내 코드에서 확인 |
| `!` non-null 단언 | — | 52 / 18 | 심화 | 얇다 |
| `Number(`/`parseInt(`/`parseFloat(` | 140 / 53 | 78 / 38 | 0부 `explicit-conversion` | 내 코드에서 확인 |
| `!!` | 3 / 2 | 18 / 12 | 같음 | 얇다 |

**이 표가 §1.5.3 에 더하는 것 넷.**

**① 바이브 코딩 JS 는 `this` 를 안 쓴다.** 화살표 함수가 `ai-pm` 에 10,723곳인데 `this` 는 **73곳 / 10파일**
(1.6%의 파일), `ECC` 는 12곳 / 6파일이다. `ts.md` §4 의 심화 `this-binding` 은 T1·T2·T3 를 전부 통과한
(§11.3 #2) **가장 깨끗한 「JS 특유」인데 내 코드에 재료가 없다.**
사유는 `scale` 이 아니라 **`idiom`** — LLM 이 화살표와 함수형으로 짠다.
D177 규칙 ①(합성 + 「네 코드엔 없다」)이 그대로 걸리고, **가르치는 값은 여전히 크다** —
`this` 를 모르면 남의 코드·라이브러리 문서를 못 읽는다.

**② 프로토타입도 같고, 그것이 §11.2 ③ 의 순서를 뒤집는다.** `ECC` 는 `class` 1곳 대 `prototype` 36곳,
`ai-pm` 은 17곳 대 11곳이다. **「학습자가 실제로 보는 것은 `class` 다」가 표본에서 성립하지 않는다.**

**③ TS 의 타입 축은 재료가 가장 두껍다.** `as` 657곳/201파일 · `interface` 339/224 · 유니온 1,317/310 ·
`unknown` 302/94. **0부·2부 중 「내 코드가 교재」가 가장 잘 서는 자리가 TS 타입 축**이고, 동시에
§11.3 에서 유일하게 세 시험을 깨끗이 통과한 자리다. 근거 둘이 같은 곳을 가리킨다.

**④ `typeof x ===` 가 JS 리포에 더 많다** — `ECC` 283곳/108파일 대 `ai-pm` 34/27.
타입이 없으니 런타임으로 확인한다. `ts/narrowing` 을 **TS 전용 개념으로 적으면 안 된다** —
JS 리포에서도 같은 모양이 돌고, 다만 그것이 타입을 좁히는 게 아니라 값을 가르는 것이다.
`alternatives:` 짝의 후보다(`gap: ts/narrowing, present: ts/typeof-guard`).

#### 0장 상한 24 폐지의 결과 — JS/TS 학습법 쪽 판단

**문제가 아니다. 다만 파이썬보다 이 언어에서 더 필요했다.**

TS 의 0장 후보는 지금 **21/24** 이고 0부 신규 일곱을 `essential` 에 올리면 **28** 이 되어
상한이 넷을 자른다(`ts.md` §1.5.5). 자르는 넷째 키가 id 알파벳순이므로
`explicit-conversion`·`float-inexact`·`implicit-conversion` 이 앞쪽에 몰려 있다 — 어느 쪽이 살고
죽는지를 **교육이 아니라 이름이 정한다.** 폐지가 그 자리를 없앤다.

**대신 값을 잃는 자리 하나.** 상한 24 는 「0장 = 12일」이라는 약속이었다. TS 0부는 **21판**으로 열 언어 중
가장 크고, 30~34판이면 15~17일이다. **그동안 학습자는 자기 코드를 한 줄도 안 본다 — 0부가 합성이기 때문이다.**

**그런데 이 언어는 그 위험이 셋 중 가장 낮다.** 21판 중 사용처가 없거나 얇은 것은 셋뿐이다 —
`number-is-double`(BigInt 3~7곳) · `float-inexact`(`toFixed` 4곳) · `integer-division` 의 절반
(`Math.trunc` 0~2곳). 나머지 18판은 위 표와 §1.5.3 이 「내 코드에서 확인」으로 잡았다.
**실무 부담은 그 셋이 연속으로 붙지 않게 배치하는 것**이고, 셋이 전부 축 A·B(정수·실수)라
**지금 배치대로면 정확히 연속으로 붙는다**(축 A 2판 + 축 B 3판 = 5판 중 3판). → §11.6 ⑥.

---

### §11.6 바꿀 것 — diff

**여덟을 전부 처분했다** (2026-09-05 · D187 ⑰). 다섯은 `ts.md` 본문에 반영했고, 셋(③④⑧)은
**개념 자체가 사전에 없어** 순서 결정만 본문에 박아 두었다 — 「저작이 먼저」다.

| # | 무엇을 | 어디서 → 어디로 | 근거 | 반영 · 어디 |
|---|---|---|---|---|
| ① | `ts.md` §1.5.1 형식 열의 `bits` · `predict` | → `table` · `value` | `fundamentals.md` §2.1·§2.2 가 둘을 **형식에서 내렸다**. §1.5.1 의 형식 열에 `bits` 2곳 · `predict` 5곳이 남아 있고 머리말의 형식 목록까지 세면 3곳 · 6곳이다 — 문서가 폐기된 형식을 가리킨다 | **반영** · `ts.md` §1.5.1 — 표에서 `bits` **2곳** → `table`(비트 칸 배치) · `predict` **5곳** → `value`(예측 판정란), 머리말 형식 목록도 다시 씀 |
| ② | `ts.md` §9 머리말 「progmiscon 의 JavaScript 항목은 여섯이다」 | → 「**33건**(공개 6 · 초안 27)」 | §11.1 — 2026-09-05 정적 API 실측. 여섯은 공개분만이다 | **반영** · `ts.md` §9 머리말 (「이벤트 루프 0건」도 함께) |
| ③ | `ts/prototype-chain` 의 prereq `class-declaration` | → `property-access` 만 남기고 `class-declaration` 을 **뺀다**. 방향을 뒤집어 `class-declaration` 이 `prototype-chain` 을 선행으로 갖는다 | §11.2 ③ + §11.5 ② — 교재 셋이 전부 프로토타입 먼저이고, 실측이 `ts.md` 의 재료 근거를 부순다(`ECC` `class` 1곳 대 `prototype` 36곳) | **저작이 먼저** · 두 개념이 `dictionary/ts/` 에 **없다**. `ts.md` §1.5.4 「선행 방향 하나」가 방향을 박았고, §4 심화 4행의 prereq 열에서 `class-declaration` 을 뺐다 |
| ④ | `ts/narrowing` | 중심 **#14**(2부 끝) → 중심 앞쪽, `if-statement` **직후** | §11.2 ④ — 다섯 자료 중 이유를 적은 유일한 곳(TS Handbook)이 「JS 의 런타임 제어 흐름 위에 겹친다」로 그 자리를 정한다. **비용**: `narrowing` 의 선행 `union-type` 도 함께 앞으로 와야 한다(2판 이동) | **저작이 먼저** · 셋 다 사전에 없다. `ts.md` §3 「순서 하나」가 순서를 박았고 §1.5.4 2부 목록이 그 순서로 다시 적혔다. **비용은 2판이 아니라 3판이다** — `union-type` 의 선행 `type-annotation` 도 위상 정렬에 끌려온다 |
| ⑤ | `ts.md` §9 에 오개념 여섯 추가 | — → `NullAndUndefinedAreTheSame` · `TypeofNullIsNull` · `StringRepetitionOperator` · `EqualityOperatorComparesObjectsValues` · `PrototypesAreClasses` · `MapInPlace` (전부 **초안**이라고 표시) | §11.4 — 0부 축 D 에 붙일 오개념이 지금 하나도 없다 | **반영** · `ts.md` §9 11~16 행(제목도 「오개념 16개」로) + 「전부 초안」 한 줄 |
| ⑥ | 0부 축 A·B 의 배치 | 축 A 2판 + 축 B 3판을 **연속으로 두지 않는다** | §11.5 — 사용처 얇은 셋(`number-is-double`·`float-inexact`·`integer-division`)이 그 다섯 안에 몰려 있어 **3~4일 연속으로 「네 코드엔 없다」만** 나온다. D177 규칙 ①이 그 기간 동안 한 번도 안 걸린다 | **반영** · `ts.md` §1.5.4 끝에 「섞는 규칙 하나」 — 축 묶음은 두고 **내는 날만** 흩는다 |
| ⑦ | `ts/this-binding`·`ts/prototype-chain` 의 사유 | (없음) → **`idiom`** | §11.5 ① — 「스케일이 작아서」가 아니라 「LLM 이 화살표로 짜서」다. D158 의 사유 축에서 갈리는 자리 | **반영** · `ts.md` §4 심화 4행·8행 |
| ⑧ | 새 `alternatives:` 짝 하나 | — → `gap: ts/narrowing, present: ts/typeof-guard` | §11.5 ④ — `ECC`(JS) 283곳/108파일. 같은 모양이 한쪽에서는 타입을 좁히고 한쪽에서는 값을 가른다 | **저작이 먼저** · `ts.md` §3 「새 `alternatives:` 짝」 표에 행을 올렸다. 표기 개념이 둘 → **셋**(`ts/typeof-guard` 추가)이 됐고 셋 다 사전에 없다 |

#### 다른 문서에 내는 신청

`docs/curriculum/**` 밖이라 **안 반영했다** — 그 문서의 소유 세션에 넘긴다.

| 어디 | 무엇 |
|---|---|
| `diagrams.md` | **큐 사다리** — 새 컴포넌트가 아니라 `FoldModel` 의 배치판. `type` 이 「어느 줄인가」(`script`·`micro`·`task`) (§11.1) |
| `diagrams.md` | **별칭 화살표** — `py-learning.md` §11.1 과 **같은 신청**이다. JS 의 프로토타입 사슬(객체 → 객체 화살표)이 같은 모델을 쓴다 |
| `fundamentals.md` §5 | `siblings[].value` 를 `FundValue \| { t: 'error'; v: string }` 로 넓힌다. 없으면 JS 0부 축 E·F 의 대표 오답이 전부 `unknown` 이다 (§11.4) |
| `pedagogy.md` §3.2 `trace-table` | 칸의 값에 **타입 문자열**을 허용한다 — TS 좁히기가 그 형식의 첫 소비자이고, **정답지가 컴파일러의 정적 산출이라 러너가 필요 없는 유일한 경우**다 (§11.5) |
| `dictionary/cs/**` | `ts.md` §1.5.6 의 신청 셋은 그대로다. **넷째를 더하는 대신 이미 내린 결정 하나를 다시 열자고 적는다** — [`cs.md`](./cs.md) §10.1 이 `task-queue`(ts) 를 `cs/blocking-and-async` + `cs/concurrency-vs-parallelism` + `cs/race-condition` 셋으로 **접었다.** 그 셋은 「기다림이 스택을 붙잡느냐」·「번갈아 하나 동시에 하나」·「순서가 안 정해져 있으면」이고, JS 의 기계 ②는 **순서가 정해져 있다** — 마이크로태스크 줄이 먼저, 그다음 태스크 하나다. 접힌 셋 중 어느 것도 그 결정성을 안 담는다. **다시 열지는 `cs.md` 가 정한다** — 이 문서는 접기가 JS 에서 무엇을 잃는지만 적는다 |

#### 결정 등록부 초안 — **번호 미정** (오케스트레이터가 매긴다)

`docs/00-overview.md` 에 **행을 올리지 않았다**(README §12 규약 10).

| 열 | 내용 |
|---|---|
| **문제** | JS/TS 0부 21판과 §3·§4 의 근거가 「어떤 개념을 담나」까지이고 **「어떻게 배우게 하나」가 없다.** 어긋난 자리 넷 — ⓐ `prototype-chain` 이 `class-declaration` 을 선행으로 갖는데 교재 셋과 실측이 **반대**다 ⓑ `narrowing` 이 중심의 마지막인데 TS Handbook 은 본편 **셋째**에 두고 이유를 적었다 ⓒ 계산된 진단(`siblings`)이 **값만 싣는데** JS 의 대표 오답은 다른 언어의 **오류**다 ⓓ 축 A·B 다섯 판 중 셋이 사용처가 0~7곳인데 **연속으로 붙어 있다** |
| **결정** | ① `prototype-chain` ↔ `class-declaration` 의 선행 방향을 **뒤집는다** ② `narrowing` 과 `union-type` 을 `if-statement` 직후로 **앞당긴다** ③ `siblings[].value` 를 `FundValue \| { t: 'error'; v: string }` 로 넓히고 진단문 하나(「그 답은 <언어>의 규칙이다 — <언어>는 그 자리에서 멈춘다」)를 더한다 ④ 축 A·B 의 얇은 셋을 흩어 배치한다 ⑤ 마이크로태스크 순서를 **`order`**(`pedagogy.md` §3.2)로, TS 좁히기를 **`trace-table`**(칸이 타입 문자열)로 낸다 — **새 형식을 만들지 않는다** ⑥ `ts.md` §9 를 여섯 더하고 항목 수를 33 으로 정정한다 |
| **왜** | 실측 — 표본 1,035파일(`ECC` js 422 · `ai-pm` ts/tsx 613)을 주석·문자열·템플릿 제거 후 셌다. **`this` 85곳 / 16파일**인데 화살표는 **16,063곳**이다(`this-binding` 은 세 시험을 통과하지만 내 코드에 재료가 없다 — 사유 `idiom`). `ECC` 는 `class` **1곳** 대 `prototype` **36곳** 이라 「학습자가 보는 것은 `class` 다」가 성립하지 않는다. `Math.trunc` **0~2곳** 대 `Math.floor` **25~30곳** — 버림의 두 방향 중 하나가 없다. 반대로 TS 타입 축은 두껍다 — `as` **657곳/201파일** · 유니온 **1,317/310** · `interface` **339/224**. `progmiscon.org` 정적 API 실측 — JavaScript **33건**(공개 6 · 초안 27)이고 **이벤트 루프 항목은 0건**이다. 교재 근거 — 다섯 중 순서의 이유를 적은 것은 TS Handbook 하나이고, javascript.info 는 이벤트 루프를 **Part 2 브라우저 → 기타**로 밀었다 |
| **자리** | `docs/curriculum/ts.md`(§1.5.1 형식 열 · §1.5.4 배치 · §3 · §4 · §9) · `docs/curriculum/ts-learning.md` · `docs/program/fundamentals.md` §5 · `docs/program/pedagogy.md` §3.2 · `design/system/diagrams.md` §3 · `packages/cards/src/fundamentals.ts` · `packages/grading/src/fundamentals.ts` |

---

### §11.7 출처

**1차** — 명세·공식 문서·논문 원문·저자의 글.

| 무엇 | 어디 | 이 문서가 쓴 자리 |
|---|---|---|
| WHATWG HTML 명세 8.1.7 「Event loops」 — 처리 모델과 microtask checkpoint | https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model | §11.1 기계 ② · §11.3 #1′ 의 T2 조항. **절 번호까지 확인, 본문은 절이 커서 전문을 못 읽었다** |
| Archibald, J. (2015) "Tasks, microtasks, queues and schedules" | https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/ | §11.1·§11.3 — `script start` → `script end` → `promise1` → `promise2` → `setTimeout` 을 **출력 순서 문제로** 제시한 원문 |
| Archibald, J. (2018) "In The Loop", JSConf.Asia | https://www.youtube.com/watch?v=cCOL7MC4Pl0 | 같음 — 태스크·마이크로태스크·`requestAnimationFrame`·`requestIdleCallback` 을 가른다 |
| Nelson, G. L., Xie, B., Ko, A. J. (2017) "Comprehension First: Evaluating a Novel Pedagogy and Tutoring System for Program Tracing in CS1", *ICER '17*, 2–11. DOI 10.1145/3105726.3106178 | https://par.nsf.gov/biblio/10107748 | §11.1 — JS 표기 기계를 명시적으로 가르친 것을 **잰 유일한 실험**. 학습 이득 +60%(3.89 대 2.42/27), R²=.64. 저자가 「a small study」라 적었다 |
| Chiodini, L. 외 (2021) "A Curated Inventory of Programming Language Misconceptions", *ITiCSE '21* | https://www.chiodini.org/publications/iticse21-progmiscon.pdf | §11.1·§11.4 인벤토리의 정의와 `public`/`draft` 구분 |
| `progmiscon.org` 정적 API — 2026-09-05 내려받아 셈 | https://progmiscon.org/json/data.json | JavaScript **33건**(공개 6 · 초안 27) · 전체 247건 / 4언어. **이름만 인용, 문장 미복제** |
| MDN 「Equality comparisons and sameness」 | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness | §11.3 #4 — 동등 알고리즘 넷(`==`·`===`·`Object.is`·SameValueZero)과 30여 쌍의 비교표. **구조만 빌리고 표는 복제하지 않는다** |
| MDN `this` | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this | §11.3 #2 — 「depends on how a function is invoked (runtime binding), not how it is defined」 |
| MDN `typeof` | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof | §11.4 — `typeof null === "object"` 가 역사적 버그이고 수정안이 기각됐다 |
| MDN 「Default parameters」 | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters | `py-learning.md` §11.3 #2 의 T1 근거 — 「The default argument is evaluated at *call time*. Unlike with Python (for example), a new object is created each time the function is called.」 |
| TypeScript Handbook — 목차와 「Narrowing」 챕터 | https://www.typescriptlang.org/docs/handbook/2/narrowing.html | §11.2 ④ — 좁히기가 본편 셋째이고 그 이유가 챕터 안에 적혀 있다. 가르치는 열둘의 순서 |
| Haverbeke, M. *Eloquent JavaScript* 4e (목차 전량) | https://eloquentjavascript.net/ | §11.2 순서표 |
| javascript.info — Part 1 목차와 「JavaScript Fundamentals」 18장 · 「Microtasks」 · 「Event loop」 | https://javascript.info/ · https://javascript.info/microtask-queue · https://javascript.info/event-loop | §11.2 — 형 변환이 7장, 이벤트 루프가 **Part 2 브라우저 → 기타** |
| MDN 「Dynamic scripting with JavaScript」 (34강 전량) | https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting | §11.2 — **형 변환·이벤트 루프 강의가 없다** |
| Simpson, K. *You Don't Know JS Yet* 2e — 저자가 명시한 읽는 순서 | https://github.com/getify/You-Dont-Know-JS | §11.2 — Get Started → Scope & Closures → Objects & Classes → Types & Grammar. **Sync & Async 는 취소됐다** |

**2차** — 이 문서의 주장을 떠받치는 데 쓰지 않았다.

| 무엇 | 상태 |
|---|---|
| Bastian, M., Mühling, A. (2025) "Misconceptions in Programming…", *ICER '25*. DOI 10.1145/3702652.3744209 | **제목·저자만 확인** — ACM 이 403 을 냈다. `py-learning.md` §11.7 과 같은 항목 |

**확인 못 한 것**

- **JS 비동기 오개념의 연구 출처를 못 찾았다.** ICER·SIGCSE·Koli 를 검색어를 바꿔 네 번 돌렸고
  나온 것은 동시성(Koli 2019 「Students' Views of Concurrency and Synchronization」)뿐이다.
  기계 ②의 근거는 **명세와 도구 저자의 글**이지 교육 연구가 아니다 — 그것이 §11.1 의 표가 말하는 것이다.
- §11.4 의 「21판 중 여섯 / 다섯 / 일곱」은 **내 추정**이다. `buildValueItems` 를 21판으로 늘려 돌린 실측이 아니다.
- 다섯 자료 중 **TS Handbook 하나만** 순서의 이유를 적었다(§11.2 ④). 「나머지 넷이 안 적었다」는
  내가 목차·서문·해당 챕터 도입부에서 못 찾았다는 뜻이다.
- §11.5 의 정규식 계수는 **하한**이다. 주석·문자열·템플릿을 지운 뒤 셌으나 tree-sitter 가 아니다.
  `ts.md` §1.5.3 과 `MAX_SAFE`/`BigInt` 항목의 수가 다른 것은 내 정규식이 `123n` 리터럴까지 잡기 때문이다.
- `ECC` 의 `prototype` 36곳이 **몇 개나 `Object.prototype.hasOwnProperty` 류 관용구인지** 안 갈랐다.
  §11.2 ③ 의 순서 뒤집기 근거로 쓰기 전에 그것부터 갈라야 한다.
