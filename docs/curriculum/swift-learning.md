# Swift 학습법 — `swift.md` §11

[`swift.md`](./swift.md) 의 이어지는 절이다. 본문이 800줄 상한을 넘어 분리했고 절 번호는 이어진다.
전제: 정본 §1~§4 · [`docs/program/pedagogy.md`](../program/pedagogy.md) ·
[`docs/program/exercises.md`](../program/exercises.md) · [`docs/program/fundamentals.md`](../program/fundamentals.md) ·
[`design/system/diagrams.md`](../../design/system/diagrams.md) · [`README.md`](./README.md) §8·§12.

조사일 2026-09-05. **이 절의 Swift 값은 전부 이 기계에서 실행해 잰 것이다** — Apple Swift 6.3.3
(swiftlang-6.3.3.1.3), target `arm64-apple-macosx26.0`. 교재 순서도 실측이다(`swiftlang/swift-book`
저장소에서 목차와 장 안의 절 순서를 직접 취득).

---

## §11 학습법 — 이 언어를 이해한다는 것

### §11.1 이 언어의 기계 — 한 문장과 그림 하나

> **이름에 붙는 것이 값인지 상자인지를 `struct` / `class` 가 정하고, 「없음」은 상태가 아니라 타입에 있다.**

두 조각이다 — **값 타입과 참조 타입**, **옵셔널**. du Boulay 1986 이 오개념의 큰 출처로 「학습자가
실행 기계에 대해 가정하는 성질」을 들었고 Sorva 2013 이 그것을 notional machine 으로 정리했다.
Swift 에서 그 성질은 **대입이 무엇을 하는가**와 **`nil` 이 어디에 사는가** 둘로 접힌다.

**§9 오개념 열둘을 붙여 본다. 여섯이 붙고 여섯은 다른 층이다.**

| §9 의 어느 항목 | 어느 조각 |
|---|---|
| 4 `let` 이 안쪽까지 잠근다 · 5 struct 를 넣으면 같은 것을 가리킨다 · 6 `mutating` 은 위험 표시 | **값 / 참조** — 셋 |
| 1 옵셔널은 같은 타입 · 2 `!` 는 스위치 · 3 `if let` 안쪽이 바깥 것 | **옵셔널** — 셋 |
| 7 `weak` 가 메모리를 아낀다 | ARC — 런타임이지 값 층이 아니다 |
| 8 `@State` · 9 `some View` | **SwiftUI** — 3부의 것이다 |
| 10 `try` · 11 `async` | 오류·동시성 — 2부 뒤쪽 |
| 12 `default` 가 안전하다 | 망라성 검사 — 컴파일러 기능 |

**여섯 / 열둘.** 그리고 **안 붙는 여섯의 자리가 정확히 swift.md §1 의 `swiftui/` 분리 결정과 맞는다** —
8·9 는 프레임워크이고 7·10·11 은 런타임이라 「값과 식」의 기계로는 안 잡힌다. 한 문장이 덮는 범위가
1·2부이고, 3부는 다른 기계(뷰가 매번 새로 만들어지고 상태는 밖에 있다)를 따로 세워야 한다.

**0부 여덟의 오개념 일곱**(swift.md §9 마지막 문단이 세워 둔 것)은 위 표에 안 들어간다 — 그쪽은
값 층위이고 여섯 중 하나(④)만 §9 에 있었다. 그 일곱은 이 세션에서 여섯을 실행으로 확인했다(§11.7).

**그림.** 그림 여섯이 전부 쓰인다(swift.md §0.2). 이 절이 더하는 것은 없다 — **옵셔널조차 새 그림이
필요 없다**(§11.3.2). 열 언어 중 새 그림을 한 장도 신청하지 않는 유일한 편이다.

---

### §11.2 최고의 교재·코스가 수렴한 순서

`swift-book` 저장소에서 목차와 「The Basics」 장 안의 절 순서를 직접 취득했다.

| 교재·코스 | 단위 | **옵셔널** | 넘침 | **우선순위** | 확인 |
|---|---|---|---|---|---|
| Apple *TSPL* Language Guide | 28장 | **1장 「The Basics」 안** — 그 장의 절 열다섯 중 **열두 번째** | 1장에서 한 줄, `&+` 는 **마지막 장** | **1장에 없다.** `BasicOperators` 에도 없고 **마지막 장 `AdvancedOperators`** 에 있다 | 실측 |
| Hudson, *100 Days of SwiftUI* | 100일 (언어는 1~14일) | **14일** — 언어 warm-up 의 **마지막 날** | 안 다룸 | 안 다룸 | 실측(일차별 제목 취득) |
| Stanford CS193p (2025) | 강의 16 | **4강** — 「Building CodeBreaker's Model」에서 `@State`·제스처와 함께 | 안 다룸 | 안 다룸 | 실측(강의 목록) |
| Swift Playgrounds | 앱 내 코스 | 「Get Started with Apps」가 SwiftUI 먼저 | — | — | 2차 — 목록만 |
| **이 리포 (`swift.md`)** | 0부 8 + 1부 4 + 2부 25 | **0부는 문만 열고**(0-6 의 `Int("12")`) 개념은 §3 ⑤ `swift/optional-type` | **0-1 에서 `predict`** — 죽는 것을 보인다 | **0-5 (0부)** | — |

**수렴 하나 — 옵셔널은 「값과 타입이 앉은 뒤」다.**

애플 책이 옵셔널을 1장에 두는 것은 사실이지만 **1장의 끝쪽**이다. 그 장의 절 순서를 실제로 세면
`Constants and Variables` → `Comments` → `Semicolons` → `Integers` → `Floating-Point Numbers` →
`Type Safety and Type Inference` → `Numeric Literals` → **`Numeric Type Conversion`** → `Type Aliases` →
`Booleans` → `Tuples` → **`Optionals`** → `Memory Safety` → `Error Handling` → `Assertions` 이다.
**옵셔널 앞의 열한 절이 우리 0부 여덟과 거의 일대일이다** — 정수(0-1) · 실수(0-2) · 형 변환(0-6) ·
참거짓(0-4) · 대입(0-7). Hudson 도 같다: 언어 warm-up 14일 중 **14일째**가 옵셔널이고 앞 13일이 값·타입·
흐름·구조체·클래스·프로토콜이다.

**swift.md §0.3 이 「0부는 「이런 것이 있다」만 보이고 개념을 열지 않는다」고 정한 것에 근거가 붙는다** —
정본 둘이 같은 자리에 둔다. 그 절이 「축 여덟 중 어디에도 안 들어간다(값도 식도 아니고 타입 구성자다)」로
쓴 논증은 우리 것이었는데, 애플과 Hudson 이 독립적으로 같은 배치를 골랐다.

**갈림 ① 우선순위 — 우리가 정본과 정반대다.**

TSPL 의 `BasicOperators` 장에는 우선순위 절이 **없다**(절 아홉: Terminology · Assignment · Arithmetic ·
Compound Assignment · Comparison · Ternary · Nil-Coalescing · Range · Logical). 우선순위는 Language Guide
**마지막 장** `AdvancedOperators` 의 `Precedence and Associativity` 에 있다. 우리는 0-5, 즉 맨 앞이다.

**그래도 우리가 맞다고 보는 이유** — 두 책이 다른 것을 묻는다. 애플 책의 그 절은 `precedencegroup`
선언과 사용자 정의 연산자를 가르치는 자리이고, 그것은 **연산자를 만드는 사람**의 지식이다.
우리가 묻는 것은 `1 << 2 + 3` 이 **7 인가 32 인가**(실측 7)이고 그것은 **읽는 사람**의 지식이다.
C·자바·C# 에서 온 손이 정확히 여기서 32 를 적는다. **근거는 없다 — 판단이다.** 순서를 비교한 연구를
못 찾았다.

**갈림 ② 넘침 — 자리는 같고 깊이가 다르다.**

TSPL 은 1장 `Integer Bounds` 에서 「명시적으로 넘치게 하려면 `AdvancedOperators#Overflow-Operators`
를 보라」고 한 줄 가리키고 `&+` 자체는 마지막 장에 둔다. 우리 0-1 은 그 자리에서 `predict` 로 **죽는 것을
보인다**(실측 종료 코드 133, SIGTRAP). swift.md §0.2 가 「0-1 이 이 언어에서 `predict` 가 가장 센 자리」라고
적었고, 애플 책도 사실 자체는 1장에서 말한다. **어긋나는 것은 자리가 아니라 다루는 깊이다.**

**CS193p 는 비교 대상이 아니다.** 프로젝트 우선이라 3강에 타입 시스템, 4강에 옵셔널이 온다.
그 과정은 **이미 프로그래밍을 아는 학생**을 전제하고, 우리 대상(프로그래밍이 처음, D147)과 다르다.
순서표에 넣되 우리 순서의 근거로는 안 쓴다.

---

### §11.3 이 언어에 특유한 연습 형태

판정은 `pedagogy.md` §4 의 셋(T1 이식 · T2 조항 · T3 사전). **답이 사라져야 통과**한다.

| 연습 | T1 | T2 | T3 | 판정 | 형식 | 그림 |
|---|---|---|---|---|---|---|
| 값·참조 복사 예측 (`struct` 대 `class`) | 부분 — C# 에도 둘 다 있다 | ○ | ○ | **부분** → 좁힌 판이 아래 | `table` | 값 상자 |
| └ **`let` 이 두 결과를 낸다** — `let [C()]` 의 원소는 바뀌고 `let [P()]` 는 컴파일이 멈춘다 | ○ C# `readonly` 는 필드에 붙고 지역 상수에 이 갈림이 없다 | ○ 값 타입의 변형 규칙 | ○ `swift/assignment` universal 둘 | **통과** | `table` (+ `event`) | 값 상자 |
| 옵셔널 풀기 경로 추적 | ✕ `?.` 는 TS·C#·Kotlin 에도 있다 | 부분 | ✕ `common/absent-value` | **탈락 — 일반론** | — | — |
| └ **옵셔널이 겹치는가** — `?.` 는 평탄해지고 첨자는 겹친다 | ○ TS·C# 에는 겹칠 층이 없다(`undefined` 가 하나다) | 부분 — 조항 미확인 | ○ `swift/optional-type` | **부분 통과** | **걸음 사다리**(§11.3.2) | 걸음 사다리 |
| `mutating` 과 `let` | ○ 아홉에 「자기 자신을 새 값으로 바꿔 담는 메서드」가 없다 | ○ | ○ `swift/mutating` | **통과** | `value`(+`event`) | 값 상자 |
| `defer` 순서 | 부분 — Go·C++ 도 역순이다 | ○ | ○ | **부분** | `order` | 스택 프레임 |
| └ **블록이 무엇을 캡처하나** — `defer { print(i) }` 는 **9** | ○ Go 의 `defer f(x)` 는 인자를 그 자리에서 계산해 물음이 성립 안 한다 | ○ | ○ | **통과** | `value` | 스택 프레임 |
| `==` 와 `===` | ○ 물음이 **낱말로** 갈려 있는 아홉이 없다 | ○ `Equatable` 대 `AnyObject` 항등 | ○ `swift/equality` | **통과** | `predict`(= `value` 판정란) | 값 상자 |

**「좁히면 통과, 넓히면 탈락」이 여기서도 되풀이된다.** swift.md 가 원래 「값/참조 복사 예측」·「옵셔널 풀기
경로 추적」으로 넓게 적어 둔 둘이 탈락하고 좁힌 판이 통과한다.

#### §11.3.1 값·참조 — 같은 코드에서 답이 갈린다

실측(6.3.3):

```swift
struct P { var n = 1 }
final class C { var n = 1 }
var s1 = P(); var s2 = s1; s2.n = 9      // s1.n → 1
let c1 = C(); let c2 = c1; c2.n = 9      // c1.n → 9
```

**같은 다섯 줄인데 `struct` 는 1 이고 `class` 는 9 다.** `table` 이 그대로 받는다 — 「식 × 입력」의
입력 축이 `{struct, class}` 이고 칸값이 `{1, 9}` 다. 두 번째 판이 더 날카롭다:

| 코드 | struct | class |
|---|---|---|
| `let xs = [T()]` 뒤 `xs[0].n = 42` | **컴파일 오류** | **42** |
| `var xs = [T()]` 뒤 `xs[0].n = 42` | 42 | 42 |
| `let q = Q(); q.inc()` (`mutating`) | **컴파일 오류** | 해당 없음 |

넷 다 실행해 확인했다. **`let` 한 낱말이 네 칸에서 세 결과를 낸다** — §9 ④ 가 말하는 것이 이 표다.
칸 하나의 답이 값이 아니라 `compile error` 이므로 `FundValue` 의 `event` 변형이 필요하다(§11.3.4).

#### §11.3.2 옵셔널 — 새 형식도 새 그림도 필요 없다

**걸음 사다리가 그대로 받는다.** `FoldStep = { code: string; type: string }` 이고, 옵셔널 추적에서
**`type` 열이 곧 옵셔널의 깊이**다. 변환이 하나도 없다.

| 걸음 | `code` | `type` |
|---|---|---|
| 0 | `d["a"]?.first` | `[String: [Int]]` |
| 1 | `d["a"]` | `[Int]?` |
| 2 | `?.first` | `Int?` |

실측 — `type(of: d["a"]?.first)` 는 **`Optional<Int>`** 다. `?.` 체인이 평탄하게 만든다.

**그런데 첨자는 안 평탄해진다.** 값 타입이 `Int?` 인 사전에서 `y["k"]` 의 타입은 **`Optional<Optional<Int>>`**
이고 실측 출력이 `Optional(nil)` 이다. 더 날카로운 것은 그 뒤다 — **`y["k"] ?? 7` 은 `7` 이 아니라 `nil` 이다**
(타입 `Optional<Int>`). 바깥 옵셔널이 `.some` 이므로 `??` 가 안쪽 `.none` 을 그대로 돌려준다.

**이 한 줄이 이 언어에서 가장 좋은 `value` 판이다.** 답이 `7` 이라고 적는 것이 자연스럽고 실제는 `nil` 이며,
「당신이 고른 그것이 참이 되는 조건」(정본 §3-2)이 한 줄로 나온다 — **「`7` 은 `y["k"] ?? nil ?? 7` 의 답이다」**.

**T1 판정은 「부분 통과」다.** TS 의 `?.` 와 C# 의 `?.` 에는 겹칠 층이 없어(`undefined`·`null` 이 하나다)
물음이 성립하지 않는다 → T1 통과. 그런데 **T2 를 못 채웠다** — TSPL 의 `OptionalChaining` 장이 평탄화를
어떤 문장으로 규정하는지 확인하지 않았다. 조항을 확인하기 전에는 「이 언어의 조항이 다른 아홉에 없다」고
쓰면 안 된다(`pedagogy.md` §4 의 지침).

#### §11.3.3 `defer` — Go 와의 쌍이 판정 기준을 시험한다

| | Go | Swift |
|---|---|---|
| 코드 | `i := 0; defer p(i); i = 9` | `var i = 0; defer { print(i) }; i = 9` |
| 출력 | **0** (명세 — 인자를 `defer` 줄에서 계산해 저장) | **9** (실측 — 블록이라 캡처한다) |

**넓게 적으면 둘 다 탈락한다** — 「`defer` 뒤 무엇이 찍히나」는 두 언어에 다 서고 답만 다르다.
**좁히면 둘 다 통과한다** — Go 의 「인자가 언제 계산되나」는 Swift 에 물음이 없고(인자를 안 받는다),
Swift 의 「블록이 무엇을 캡처하나」는 Go 에 물음이 없다(`defer func(){…}()` 로 감싸야 생긴다).
`go-learning.md` §11.4.3 이 같은 쌍을 반대편에서 적었다.

#### §11.3.4 「컴파일 오류」가 답인 판 — Go 와 같은 함정

Swift 는 답이 값이 아니라 컴파일 정지인 자리가 많다. 실측 넷: `s[0]`(`'subscript(_:)' is unavailable:
cannot subscript String with an Int`) · `let a = 1; let b = 2.0; a + b`(`binary operator '+' cannot be
applied to operands of type 'Int' and 'Double'`) · `let structs = [P()]; structs[0].n = 42` ·
`let q = Q(); q.inc()`.

**형식은 이미 있다** — `packages/cards/src/fundamentals.ts:58` 의 `FundValue` 에 `{ t: 'event'; name; accept }`
가 실재하고 `EVENTS` 가 `undefined behavior`·`panic` 둘을 싣는다. `compile error` 를 한 줄 더하면 된다.

**함정도 같다** — 자주 정답이면 모르면 그것을 찍는다. 대책도 같다: 사건 답 뒤에 **「무엇을 적으면 도나」**
(`build`)를 한 걸음 더 붙인다(`Double(a) + b` · `Array(s)[0]` · `var`). **Go 와 Swift 가 독립적으로 같은
요구에 닿았으므로 이것은 두 언어의 것이 아니라 정적 타입 언어 공통이다** — 언어 문서가 아니라 I1 의
형식 설계가 정할 자리다.

---

### §11.4 연구된 오개념과 그 진단

#### §11.4.1 연구가 없다 — swift.md §9 의 단서가 그대로다

**Swift 학습자의 오개념을 잰 실증 연구를 못 찾았다.** progmiscon.org 는 Python·Java·JavaScript·Scratch
넷뿐이고 Swift 가 없다(swift.md §10 이 이미 확인). SQL 에는 Miedema 2024 의 유병률 표(n=249)가 있고
Go 에는 프로덕션 버그 연구가 있는데, **Swift 에는 둘 다 없다** — 세 언어 중 근거가 가장 얇다.

**2차로 쓰는 것** — Apple TSPL(1차 · 공식 문서) · Swift Forums · hackingwithswift · Exercism Swift
개념 문서. swift.md §10 이 이미 「문장은 가져오지 않았다」로 적어 두었고 이 절이 더할 것은 없다.

**근거가 얇은 것이 0부에는 덜 걸린다.** swift.md §9 마지막 문단이 세워 둔 0부 오개념 일곱 중 **여섯을
6.3.3 으로 실행해 확인했다**(swift.md §0.4 + 이 세션의 §11.7). 「연구가 없다」와 「값이 확인 안 됐다」는
다른 말이고, Swift 는 앞은 참이고 뒤는 거짓이다.

#### §11.4.2 어떤 오답이 나오면 어느 오개념인가

| 물음 | 실측 답 | 대표 오답 | `fundamentals.md` 분류 |
|---|---|---|---|
| `Int8(127) + 1` | **종료 코드 133** | `-128` | **✕ — `siblings` 로 못 잡는다.** `-128` 은 다른 언어가 아니라 **`&+` 의 답**이다 |
| `1 << 2 + 3` | **7** | `32` | ✓ `other-language` — C·자바·C# 이 32 |
| `"👨‍👩‍👧‍👦".count` | **1** | `11` · `25` | ✓ `other-language` — C# 11 · Go 25 |
| `let a = 1; let b = 2.0; a + b` | **컴파일 오류** | `3.0` | ✕ — `event` 값이 필요하다(§11.3.4) |
| `y["k"] ?? 7` (`[String: Int?]`) | **`nil`** | `7` | ✕ — **`variants` 가 필요하다**(아래) |
| `let xs = [C()]; xs[0].n = 42` | **42** | 「`let` 이라 안 된다」 | ✕ — 같은 판의 `struct` 답이 반증이다 |
| `1 == 1.0` | **true** | `false` | ✕ — 0-6(변수는 못 섞는다)과 정반대로 보인다 |

**일곱 중 둘만 `siblings` 로 잡힌다.** 둘은 `event` 로 풀리고, **셋은 `variants` — 같은 코드의 한 글자
다른 판 — 을 요구한다.**

| 진단 | 무엇을 바꿔 다시 돌리나 | 나오는 문장 |
|---|---|---|
| 넘침 | `+` → `&+` | 「감기는 답은 `&+` 를 적었을 때 참이다」 (swift.md §0.2 가 이미 이 문장을 적었다) |
| 이중 옵셔널 | `??` 를 두 번 | 「`7` 은 `y["k"] ?? nil ?? 7` 의 답이다」 |
| `let` 과 값/참조 | `class` ↔ `struct` | 「그 답은 이 타입이 `struct` 일 때 참이다」 |

**SQL 이 같은 결론에 닿았다** — `sql-learning.md` §11.4.2 가 `NOT IN` ↔ `NOT EXISTS` 를 돌려 진단을
계산한다. **두 언어가 독립적으로 「다른 언어」가 아니라 「한 글자 다른 판」을 요구한다.**
차이는 값을 얻는 방법이다: SQL 은 러너로 돌려 계산하고, Swift 는 **러너가 이 기계에 있다**(§11.5.2)라
같은 길이 열려 있다. Go 만 러너가 없어 손으로 적어야 한다.

**`variants` 를 `siblings` 옆에 두는 것을 권한다** — `FundItem` 에 필드 하나이고
`{ change: string; value: FundValue }[]` 면 된다. 진단문은 여전히 사람이 안 적는다.

---

### §11.5 우리 앱에서 그 학습법이 서는 자리

#### §11.5.1 다섯 단 — 문법이 없어 1단부터 안 선다

| 단 | Swift 에서 | 근거 |
|---|---|---|
| 1 읽기 | **안 선다.** `grammarSchema` 에 `swift` 가 있어 로드는 통과하고 **캡처가 0곳**이다 | swift.md §0.7 |
| 2 추적 | 안 선다. 경로는 있으나 파싱이 0이라 그래프가 안 생긴다 | 같음 |
| 3 예측 | 안 선다 | 같음 |
| 4 수정 | **러너는 있다**(아래). 그런데 재료가 없다 | §11.5.2 |
| 5 재구현 | 같음 | 같음 |

**Swift 의 벽은 러너가 아니라 문법이다.** Go 는 문법이 붙어 있고 러너가 없는데, Swift 는 그 반대다.
그리고 **문법 쪽이 더 크다** — 러너가 없으면 4·5단이 게이트에서 빠질 뿐인데(D175 규칙 ①), 문법이 없으면
1~3단이 통째로 없다. `crates/parse/tests/quality.rs:125` 의 `swift_and_dart_are_not_in_the_build_yet` 이
그 사실을 시험으로 못박아 두었다.

#### §11.5.2 「수정」과 「재구현」 — 러너는 자바 다음으로 싸다

**이 기계에 Swift 6.3.3 이 있다**(실측 — `swift --version` · `/usr/bin/swiftc`). 어댑터가 요구하는 것은
`swift <파일>` 한 줄과 `swiftc -Onone` 뒤 종료 코드 읽기이고, swift.md §0.4 가 그 방법으로 실측표를
이미 만들었다. JDK + Gradle 래퍼를 찾아야 하는 자바 어댑터보다 배관이 얇다.

**D175 규칙 ①이 걸리는 자리는 플랫폼이다.** Swift 툴체인은 macOS 사용자에게 사실상 항상 있고
(Command Line Tools) 윈도·리눅스 사용자에게는 없다. 「탐지되면 켜고 없으면 그 단을 게이트에서 뺀다」가
**운영체제 단위로** 갈린다 — SQL 이 방언 단위로 갈리는 것(`sql-learning.md` §11.5.2)과 같은 모양이다.

**막는 것은 정답지다.** 4단 `patch-line` 의 정답지는 `fix:` 커밋이고 5단 `reimpl-layer` 의 사양은 이웃 층인데,
**사용자 리포에 `.swift` 가 0개**라 둘 다 재료가 없다.

#### §11.5.3 「내 코드가 교재」 — Swift 는 성립하지 않는다

`.swift` 파일 **0개**다(`find . -name '*.swift'`). §1 의 「바이브 코딩 Swift 의 생김새」도 추정이라고
그 절이 스스로 적었다. 세 언어를 나란히 놓으면:

| | 표본 리포의 실물 | 다섯 단 |
|---|---|---|
| **SQL** | 매퍼 XML 9파일 49문장 · `.sql` 27파일 | 전부 선다 |
| **Go** | **0** — 공개 리포 둘은 남의 코드다 | 1~3단만 |
| **Swift** | **0** — 추정도 못 하고 문법도 0 | **하나도 안 선다** |

Swift 는 D158 경로(조건부 해제)이고, Go 와 같은 문제를 하나 더 갖는다 — `AbsenceReason` 의 넷
(`framework`·`library`·`scale`·`idiom`)에 **「리포 자체가 없다」가 없어** 「네 코드엔 없다」와
「우리가 못 읽는다」가 섞인다(D137 이 막으려던 자리, go.md §0.7 이 먼저 적었다).

#### §11.5.4 0장 상한 폐지(D184)의 결과 — Swift 쪽 판단

**세 언어 중 Swift 가 가장 크게 받는다.** 0부 이전에 **25 / 24 로 유일하게 넘친 언어**였고(README §5 ①),
0부 여덟이 들어오며 **29** 가 됐다(swift.md §0.5). 상한이 있었으면 다섯이 잘렸고, swift.md §0.5 가
「어느 다섯이 잘릴지는 안 쟀다 — 리포에 `.swift` 가 0개라 정렬 첫 키(사용처 있음)가 전부 0이다」로
물음을 남겨 두었다. **폐지로 그 물음이 사라진다.**

**학습법 쪽 판단 — 문제가 아니라 해결이다.** 잘렸을 후보는 0부가 신설한 넷
(`integer-literal`·`float-literal`·`text-literal`·`type-conversion`)이고, 그 넷이 swift.md §9 마지막 문단의
값 층위 오개념 일곱 중 **다섯**을 짊어진다(넘침 · `Float` 가 정확하다 · `s[0]` · `1 << 2 + 3` ·
리터럴은 섞이는데 변수는 안 섞임). 상한이 살아 있었으면 **정렬 넷째 키인 id 알파벳순이 그 다섯 중 무엇을
가르칠지 정했을 것**이다. 그것이 D147 이 상한을 8→24 로 올리며 피하려던 바로 그 일이다.

**대가는 날수다.** Swift 프롤로그가 29판 15일이 되고 코스 전체가 37판 19일이다(swift.md §0.6) — 세 언어
중 가장 길다(SQL 16판 8일 · Go 33판 17일). `pedagogy.md` §5 는 「하루 15분 × 15~17일이 동기 연구와
충돌하는지는 직접 근거로 판정 불가」로 닫았고 **Swift 는 그 범위의 위쪽 밖에 있다.** 그리고 같은 절의
완화 장치 둘 중 하나(D177 규칙 ① — 「네 리포의 여기가 그것이다」)가 **Swift 에서는 분자가 0이다.**
그러니 `pedagogy.md` §5 가 권고한 성질 게이트(내 코드를 짚는 판의 비율)를 Swift 에 걸면 못 넘는다 —
Go 와 같은 이유이고, 게이트를 만들 때 **리포에 그 언어가 0개인 경우의 예외 규칙이 함께 필요하다.**

---

### §11.6 바꿀 것 — diff

본문 §0~§10 은 고치지 않았다. 아래가 다음 물결에 넘기는 목록이다.

| 어디 | 무엇 | 왜 |
|---|---|---|
| §0.3 옵셔널 문단 | 「0부는 문만 연다」에 **정본 둘의 배치**(TSPL 1장 열두 번째 절 · 100 Days 14일째)를 근거로 단다 | §11.2 — 우리 논증이었던 것에 외부 근거가 붙었다 |
| §0.1 0-5 | 「우선순위가 표준 라이브러리 선언에 있다」에 **애플 책은 마지막 장에 둔다**는 사실과 **우리가 앞에 두는 이유**를 한 줄 | §11.2 갈림 ① — 정본과 반대인 자리는 이유를 적어 둔다 |
| §3 ⑤ `swift/optional-type` | **「옵셔널은 겹친다」**를 항목에 더한다 — `?.` 는 평탄해지고 첨자는 안 그렇다 | 실측. `y["k"] ?? 7` 이 `nil` 인 것이 이 언어에서 가장 좋은 `value` 판이다 |
| §9 오개념 | ①②③ 을 **「겹치는 옵셔널」** 한 줄로 보강한다. 열둘을 늘리지 않는다 | 근거가 실측이고 §9 는 이미 옵셔널에 셋을 썼다 |
| §0.2 형식 표 | 0-1·0-3·0-6 옆에 **`event` 값(`compile error`)** 을 부기 | 실측 넷이 값이 아니라 컴파일 정지다 |
| `packages/cards/src/fundamentals.ts` | `EVENTS` 에 `compile error` · `FundItem` 에 **`variants`** 필드 | Go 편이 같은 것을 요구한다. 정적 타입 언어 공통이라 I1 의 자리다 |
| `design/system/diagrams.md` | **신청 없음** | 그림 여섯이 전부 서고 옵셔널은 걸음 사다리가 받는다(§11.3.2) |
| **등록부 초안** (번호 미정 · 마지막이 D184) | **오답 진단의 재료를 둘로 한다 — `siblings`(다른 언어의 답)와 `variants`(같은 코드의 한 글자 다른 판).** Swift 일곱 중 둘만 `siblings` 로 잡히고 셋이 `variants` 를 요구하며, SQL 이 독립적으로 같은 결론에 닿았다(`NOT IN` ↔ `NOT EXISTS`). 진단문은 여전히 사람이 안 적는다 | 실측 — `Int8(127)+1` 의 오답 `-128` 은 어느 언어의 답도 아니라 `&+` 의 답이다 |

---

### §11.7 출처

**1차 · 저장소에서 직접 취득** (2026-09-05)

| 출처 | 어떻게 |
|---|---|
| Apple, *The Swift Programming Language* (6.4 beta) — Language Guide 28장의 순서 | `swiftlang/swift-book` 의 `TSPL.docc/The-Swift-Programming-Language.md` 를 GitHub API 로 받아 Topics 목록을 읽었다 |
| 같은 책 「The Basics」 장의 절 열다섯과 그 순서 | 같은 저장소 `TSPL.docc/LanguageGuide/TheBasics.md` 의 `^## `·`^### ` 줄. `Optionals` 가 2,298줄 중 1,324행 |
| 같은 책 `BasicOperators` 에 **우선순위 절이 없다**는 사실 | 같은 저장소 `LanguageGuide/BasicOperators.md` 의 절 아홉을 세었다 |
| 우선순위가 `AdvancedOperators` 에 있다는 사실 | 같은 저장소 `LanguageGuide/AdvancedOperators.md` 의 `Precedence and Associativity` |
| Hudson, P. *100 Days of SwiftUI* — 1~21일의 일차별 제목 | <https://www.hackingwithswift.com/100/swiftui> 목록. 언어 warm-up 은 1~14일, **14일 = Optionals, nil coalescing, and checkpoint 9**, 15일 = Swift review, 16일부터 Project 1 |
| Stanford CS193p Spring 2025 — 강의 16개 제목 | <https://cs193p.stanford.edu/> |

**2차 · 목록만** — Swift Playgrounds 의 코스 구성. 앱 안에서만 볼 수 있어 목록만 참조했다.

**학습 과학** — `pedagogy.md` §7 의 25건. 이 절이 직접 대는 것은 du Boulay 1986 · Sorva 2013 ·
`pedagogy.md` §4 의 판정 기준 셋이다.

**이 세션의 실측** — Apple Swift 6.3.3, `swift <파일>` 로 실행

| 물음 | 값 |
|---|---|
| `struct` 복사 대 `class` 공유 (같은 다섯 줄) | **1** 대 **9** |
| `let xs = [C()]; xs[0].n = 42` 뒤 `xs[0].n` | **42** |
| `let xs = [P()]; xs[0].n = 42` | **컴파일 오류** |
| `var xs = [P()]; xs[0].n = 42` 뒤 `xs[0].n` | **42** |
| `let q = Q(); q.inc()` (`mutating`) | **컴파일 오류** |
| `type(of: d["a"]?.first)` (`[String: [Int]]`) | **`Optional<Int>`** — `?.` 가 평탄하게 만든다 |
| `type(of: y["k"])` (`[String: Int?]`) | **`Optional<Optional<Int>>`**, 출력 `Optional(nil)` |
| **`y["k"] ?? 7`** | **`nil`** (타입 `Optional<Int>`) — `7` 이 아니다 |
| `var i = 0; defer { print(i) }; i = 9` | **9** — 블록이 캡처한다 |
| `a === b` · `a === a` (class 둘) | **false** · **true** |
| `"abc".count` · `Array("abc")[0]` · `"abc".first!` | **3** · **a** · **a** |
| 클로저 캡처 (`var count = 0; let inc = { count += 1 }`, 두 번) | **2** |
| 배열을 함수에 넘기고 안에서 `append` | 원본 **2** 그대로 |
| `which swiftc` · `swift --version` | `/usr/bin/swiftc` · 6.3.3 (swiftlang-6.3.3.1.3) |

swift.md §0.4 의 열일곱 줄(넘침 133 · `0.1+0.2` · 자소 뭉치 · `1 << 2 + 3` = 7 등)은 그 절의 실측이고
이 표와 겹치지 않는다.

**확인 못 한 것**

- **Swift 학습자 오개념의 실증 연구.** 없다. swift.md §10 의 결론이 그대로다.
- **옵셔널 평탄화의 명세 조항.** `OptionalChaining` 장을 안 읽었다 — §11.3 의 그 줄이 「부분 통과」인 이유다.
- **우선순위를 언제 가르치나**를 비교한 연구. 못 찾았다. §11.2 갈림 ① 은 근거가 아니라 판단이다.
- **Swift Playgrounds 의 실제 진행 순서.** 목록만 봤다.
- **tree-sitter-swift 의 실코드 ERROR 비율.** swift.md §10 의 「확인 못 함」이 그대로다 — 이 값을 재기 전에는
  `dictionary/swift/**` 를 쓰면 안 된다는 판단도 그대로다.
