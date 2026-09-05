# Swift 커리큘럼 조사

네임스페이스 `swift` · 문법 키 `swift` · 조사일 2026-09-04 ·
**0부 「이 언어의 값과 식」 추가 2026-09-05**(정본 §1·§4 · 사용자 요청 「기초부터, 언어의 동작 원리부터」).
이 문서는 제안이다 — `dictionary/swift/**` 는 아직 없고, 이 문서도 아무 파일을 고치지 않는다.
**§0 의 값은 이 기계의 Swift 6.3.3 으로 실행해 잰 것**이고, 나머지 절의 「추정」 표시는 그대로다.

---

## §1 언어 좌표

| 항목 | 값 |
|---|---|
| TIOBE 2026-08 | **17위 · 0.96 %** (2025-08 25위에서 복귀) |
| 최신 릴리스 | Swift 6.3 (2026-03-24) — 안드로이드 SDK 첫 정식판, `@c` 속성, SwiftPM 의 Swift Build 미리보기 |
| 만들어지는 것 | iOS·iPadOS·macOS·watchOS·visionOS 앱이 압도적. 서버(Vapor·Hummingbird), 임베디드, 6.3 부터 안드로이드 |
| 사전 네임스페이스 | `swift` |
| tree-sitter 문법 | `swift` (단일) |
| 확장자 | `.swift` — **`Package.swift` 도 이 확장자다**(§8) |

### 바이브 코딩으로 나온 Swift 코드의 생김새 — **추정이다**

이 리포에는 `.swift` 파일이 **0개**다(`find . -name '*.swift'`). macOS 빌드를 하지만 Tauri 라 Rust·TS 뿐이다.
그래서 아래는 실측이 아니라 추정이고, 근거는 둘이다 — ① Swift 의 실질 출력면이 애플 플랫폼 앱이고
Xcode 새 프로젝트의 기본 템플릿이 2019 년부터 SwiftUI 다 ② 「iOS 앱 만들어 줘」에 LLM 이 내놓는 것도
같은 템플릿을 따른다. **확인할 방법**: 실제 리포 20개를 읽어 아래 비율을 세는 것.

```swift
struct ContentView: View {
    @State private var count = 0
    var body: some View {
        VStack(spacing: 12) {
            Text("눌린 횟수: \(count)")
            Button("누르기") { count += 1 }
        }
        .padding()
    }
}
```

열 줄 남짓에 들어 있는 것: 속성 감싸개(`@State`), 계산 속성(`var body`), 불투명 반환 타입(`some View`),
결과 빌더 블록, 후행 클로저 둘, 문자열 보간, 수식어 사슬. **평범한 Swift 처럼 안 생겼고, 이 DSL 이
코드의 대부분을 차지한다.** 함수 정의·`while`·`return` 은 거의 안 보인다 — `body` 안에서는 `return` 을
생략하고, 반복은 `ForEach` 가 대신한다.

**바닥 여덟을 SwiftUI 로 채우면 안 되지만, 중심·심화가 SwiftUI 를 못 읽으면 사용처가 안 생긴다.**

### `swiftui/` 로 가를 것인가 — **가른다**

`react/` 의 전례(D59)는 셋을 근거로 들었다: ① 문법이 아니라 프레임워크 관습 ② `package.json` 으로
감지해 비-React 리포를 오염시키지 않음 ③ `lang` 은 사전 네임스페이스이지 문법 키가 아님(D19).
①·③ 은 SwiftUI 에도 성립한다. ②가 문제다.

**결정적인 사실은 `framework:` 필드에 소비처가 없다는 것이다.** `framework` 를 grep 하면
`packages/dictionary/src/schema.ts` 두 줄뿐이고, 실제로 사전을 거르는 것은 `detect` 다
(`load.ts:85` — `if (meta?.detect && !deps.has(meta.detect.dependency)) continue`). 즉 `swift/` 안에
`framework: swiftui` 를 적어도 **아무 일도 일어나지 않는다.**

그리고 안 거르면 실제로 깨지는 자리가 있다. `ingest.ts:464` 가
`[...dict.langs.values()].flatMap(m => m.essential)` 로 **로드된 모든 네임스페이스의 `essential` 을 합쳐**
0장 후보로 쓴다. `swift/` 안에 SwiftUI 개념을 `essential` 로 두면 Vapor 서버 리포의 프롤로그에
`@State` 판이 섞인다. 네임스페이스를 가르면 그 게이트가 공짜로 붙는다.

| | `swiftui/` 네임스페이스 | `swift/` 안에 `framework: swiftui` |
|---|---|---|
| 게이트 | `detect` — **이미 있다** | 없다. 새로 만들어야 한다 |
| 0장 오염 | 안 됨 | Vapor·CLI 리포에 SwiftUI 판이 섞임 |
| 구멍 지도 분모 | 갈라짐 | 서버 리포에서 영영 0인 개념이 분모에 남음 |

**남은 문제 하나**: `detect` 스키마가 `{ dependency: string }` 이고 그 입력은 `package.json` 이다.
Swift 에는 `package.json` 이 없고, SwiftUI 는 의존성이 아니라 **OS 프레임워크라 `import SwiftUI`
한 줄이 유일한 신호**다. 그래서 `detect` 를 `{ module: 'SwiftUI' }` 로 넓히자고 제안한다 — 그 사실은
파서가 이미 만든다(`_imports.scm` → `import_declaration`, `import_edge` 테이블). 새 Rust 는 필요 없다.
**부기**: `apps/desktop/src/flow.ts:102` 이 `dependencies: []` 를 하드코딩하고 있어 `react/` 게이트는
지금 실앱에서 한 번도 통과한 적이 없다. 신호를 배선하는 사람이 두 언어를 함께 정해야 한다.

---

## §0 0부 — 이 언어의 값과 식

축 여덟의 정의와 id 조각은 [`README.md`](./README.md) §8 에 있다. **여기는 Swift 에서 어긋나는
자리만** 쓴다. 여덟 축이 전부 서고 어긋남 판은 따로 안 세웠다 — **8 / 12**(상한 §8). Swift 의
어긋남 넷(넘침 크래시 · `Int`/`Double` 못 섞음 · 옵셔널 · 자소 뭉치)이 셋은 축 안에서 표현되고,
표현이 안 되는 하나(옵셔널)는 0부가 **문만 열고** `swift/optional-type`(§3 ⑤)에 넘긴다.

**이 절의 값은 이 기계에서 실행해 잰 것이다** — Apple Swift **6.3.3**(swiftlang-6.3.3.1.3),
target `arm64-apple-macosx26.0`, 2026-09-05. 세 언어 중 Swift 와 C# 만 툴체인이 있었고
Go 는 없었다(go.md §0.4). **이 문서의 §1 「생김새」는 여전히 추정이고, §0 만 실측이다.**

### §0.1 여덟 장

| # | id | name.ko / en | 한 줄 | `cs/` | 그림 | 초보가 실제로 틀리는 자리 |
|---|---|---|---|---|---|---|
| 0-1 | `swift/integer-literal` | 정수 값과 그 폭 / Integer literal | 폭이 정해져 있고, **넘치면 감기지 않고 그 자리에서 죽는다** | `bit-and-byte` · `integer-overflow` | 비트 배열 | **「넘치면 감긴다」를 C·자바에서 물려온다.** 실측 종료 코드 **133**(SIGTRAP). 감으려면 `&+` 를 손으로 적어야 한다 |
| 0-2 | `swift/float-literal` | 실수 값과 근사 / Float literal | 2진수로 근사한 값이라 십진 소수를 정확히 못 담는다 | `floating-point` · `binary-representation` | 비트 배열 | **`Float` 는 정확하다고 믿는다.** 실측에서 `Double` 은 `0.1 + 0.2 = 0.30000000000000004` 인데 `Float` 는 **`0.3`** 으로 찍힌다 — 정확해진 게 아니라 **자릿수가 적어 반올림이 오차를 가린 것**이다 |
| 0-3 | `swift/text-literal` | 글자 값 — 자소 뭉치 / Text literal | `String` 은 **자소 뭉치의 모음**이고 `count` 는 사람이 보는 글자를 센다 | `text-encoding` | 값 상자 · **메모리 줄** | **`s[0]` 으로 첫 글자를 꺼내려 한다.** 컴파일이 멈춘다 — 실측 `'subscript(_:)' is unavailable: cannot subscript String with an Int` |
| 0-4 | `swift/boolean-literal` | 참·거짓 값 / Boolean literal | 조건 자리에 `Bool` 말고는 **아무것도 못 온다** | `type` · **`cs/truthiness` 없음** | 평가 트리 | **`if 1`·`if name` 을 쓴다.** 「참 같은 값」이 Swift 에 없다 |
| 0-5 | `swift/operator-precedence` | 무엇이 먼저 묶이나 / Operator precedence | 우선순위가 언어가 아니라 **표준 라이브러리의 `precedencegroup` 선언**에 있다 | **`cs/operator-precedence` 없음** (`type`·`abstraction` 로 임시) | 평가 트리 | **`1 << 2 + 3` 을 32 로 읽는다.** 실측 **7** — Swift 는 `<<`(`BitwiseShiftPrecedence`)를 `+` 보다 **위**에 뒀고 C·자바·C# 은 아래에 뒀다 |
| 0-6 | `swift/type-conversion` | 종류가 다른 숫자는 손으로만 섞는다 / Type conversion | 변수끼리는 못 섞고 **리터럴끼리는 섞인다** | **`cs/type-conversion` 없음** · `static-vs-dynamic-typing` | 타입 변환 사다리 | **`1 + 2.0` 은 되는데 `a + b` 는 안 된다.** 실측: 리터럴끼리는 `3.0`, `let a = 1; let b = 2.0` 뒤의 `a + b` 는 `binary operator '+' cannot be applied to operands of type 'Int' and 'Double'` |
| 0-7 | `swift/assignment` | 이름을 만들며 바뀔지까지 정한다 / Binding and assignment | 이름을 만드는 줄에 `let`/`var` 를 **골라야만** 줄이 완성된다 | `state` · `immutability` · `value-vs-reference` | 값 상자 · 메모리 줄 · **스택 프레임** | **`let` 이면 안쪽까지 못 바꾼다고 믿는다.** class 를 `let` 으로 묶으면 **다른 상자로 못 바꾸는 것**이고 안은 바뀐다. struct 면 안쪽도 안 바뀐다 — 같은 낱말이 두 결과를 낸다 (§9 ④) |
| 0-8 | `swift/equality` | 같은 값인가, 같은 상자인가 / Equality | 물음이 **낱말로** 갈려 있다 — `==` 와 `===` | `identity-vs-equality` · `value-vs-reference` | 평가 트리 · 값 상자 | **`==` 와 `===` 를 같은 물음으로 읽는다.** 실측: struct 둘의 `==` 는 참, class 둘의 `===` 는 거짓. 그리고 `1 == 1.0` 이 **참**이다(리터럴이 `Double` 로 추론된다) — 0-6 과 정반대로 보여 여기서 한 번 더 막힌다 |

**`cs/` 에 없는 것 셋이 이 표에 굵게 나온다** — `cs/operator-precedence` · `cs/type-conversion` ·
`cs/truthiness`. 셋 다 README §9 의 「없는 것」 표에 이미 올라 있다(I6). 규약 5 대로 이 문서는
새 `cs/` 를 만들지 않는다. Swift 에서 가장 크게 비는 것은 **`cs/type-conversion`** 이다 —
0-6 의 타입 변환 사다리가 「리터럴은 왜 저절로 오르고 변수는 왜 못 오르나」를 답해야 하는데,
그 답(리터럴의 타입이 늦게 정해진다)을 받쳐 줄 기계 개념이 43장에 없다.

### §0.2 형식과 `universal` — 규약 4·6

| # | 형식 (I1) | `universal` |
|---|---|---|
| 0-1 | `bits` → **`predict`** | `common/number-literal` |
| 0-2 | `value` | `common/number-literal` |
| 0-3 | `table` | `common/text-literal` |
| 0-4 | `predict` | `common/boolean-value` |
| 0-5 | `step` | `common/arithmetic` |
| 0-6 | `build` | `common/type-cast`(신규 후보 · README §8) |
| 0-7 | `step` | `common/variable-binding` · `common/reassignment` |
| 0-8 | `predict` | `common/comparison` |

**여섯 형식이 전부 쓰인다** — 안 쓰는 것이 없다(규약 6). 그림도 여섯이 전부 쓰인다:
스택 프레임은 0-7 에서 「struct 를 함수에 넘기면 프레임에 복사본이 하나 더 선다」를 그린다.

**0-1 이 이 언어에서 `predict` 가 가장 센 자리다.** 예측(「감기겠지」)과 실제(죽는다)가 갈리고,
그 간격이 곧 교훈이다. 오답 진단은 정본 §3 ② 대로 「틀렸다」가 아니라 **「당신이 고른 그것이 참이
되는 조건」**을 낸다 — 「감기는 답은 `&+` 를 적었을 때 참이다」 + `&+` 한 줄.

### §0.3 Swift 라서 다른 네 자리 — 전부 실측

| 자리 | Swift | 견줄 것 | 축 |
|---|---|---|---|
| **넘침이 기본으로 크래시** | `var x: Int8 = 127; x + 1` → 종료 코드 **133**. `x &+ 1` → **−128** | C# 는 기본이 감김이고 `checked` 로 켠다(csharp.md §0.4). Go 는 언제나 감기고 고를 낱말이 없다 | 0-1 |
| **`Int` 와 `Double` 을 못 섞는다** | `a + b` 컴파일 오류. `Double(a) / b` = **1.5** | Go 도 못 섞지만 **리터럴도 못 섞는다** — Swift 는 `1 + 2.0` 이 된다. C# 는 자동으로 넓힌다 | 0-6 |
| **옵셔널이 타입에 박혀 있다** | `Int("12")` = `Optional(12)`, `Int("12a")` = `nil` (실측) | C# `int.TryParse` 는 `bool` 을 돌려주고 값을 `out` 으로 흘린다. Go 는 `(int, error)` 둘을 돌려준다 | 0부는 **문만 연다** — 0-6 의 「문자열을 숫자로」가 옵셔널의 첫 노출이고, 개념은 `swift/optional-type`(§3 ⑤)이 받는다 |
| **문자열이 자소 뭉치 단위** | `"👨‍👩‍👧‍👦".count` = **1**, `utf16.count` = **11**, `utf8.count` = **25**, `unicodeScalars.count` = **7**. `"e" + U+0301` 은 `count` **1** 이고 `"é"` 와 **같다** | C# `.Length` 는 같은 이모지에 **11**(UTF-16 코드 단위). Go `len` 은 **25**(바이트) | 0-3 |

세 언어를 한 줄에 놓으면 이렇게 된다 — **같은 이모지 하나의 「길이」가 Swift 1 · C# 11 · Go 25 다.**
`cs/text-encoding` 이 셋을 한 기계로 묶고 언어 장 셋은 「이 언어는 어느 단위를 센다」만 다르게 적는다.
D4 전이가 여기서 값을 한다 — 세 번 배울 것을 한 번 배우고 표기 차이 카드 셋으로 끝난다.

**0부가 옵셔널을 안 갖는 이유.** 옵셔널은 축 여덟 중 어디에도 안 들어간다(값도 식도 아니고
**타입 구성자**다). 0부에 아홉째 장으로 세우면 상한 12 안에는 들지만, 그것을 배우려면 `if let`·
`guard let`·`??`·`?.` 넷이 곧바로 따라와야 하고 그것은 2부 다섯 장이다. **0부는 「이런 것이 있다」만
보이고 개념을 열지 않는다** — 0-6 의 `Int("12")` 가 그 한 번의 노출이다.

### §0.4 실측표 — 재현 방법을 붙여서

`swift <파일>` 로 돌렸다. 런타임 함정 둘은 `swiftc -Onone` 으로 빌드해 종료 코드를 봤다.

| 물음 | 값 | 비고 |
|---|---:|---|
| `Int.max` | `9223372036854775807` | `MemoryLayout<Int>.size` = 8 |
| `Int8.max` · `Int8.min` | `127` · `-128` | |
| `Int8(127) &+ 1` | `-128` | `&+` 는 감긴다 |
| `Int8(127) + 1` | **종료 코드 133** | SIGTRAP. `-Onone` 빌드에서도 stdout 은 안 남았다 |
| `7 / 2` · `-7 / 2` · `-7 % 2` | `3` · `-3` · `-1` | 0 쪽으로 버림 |
| `0.1 + 0.2` | `0.30000000000000004` | `== 0.3` → **false** |
| `Float(0.1) + Float(0.2)` | `0.3` | 정확해진 게 아니다 (0-2) |
| `1e16 + 1` | `1e+16` | 더했는데 안 늘었다 |
| `"가나다"` count/utf8/utf16/scalars | `3` / `9` / `3` / `3` | |
| `"👨‍👩‍👧‍👦"` count/utf8/utf16/scalars | `1` / `25` / `11` / `7` | |
| `2 + 3 * 4` · `1 << 2 + 3` | `14` · **`7`** | C 계열은 `32` |
| `true \|\| false && false` | `true` | `&&` 가 위 |
| `Int(2.9)` · `Int(-2.9)` | `2` · `-2` | 0 쪽으로 버림 |
| `Int("12")` · `Int("12a")` | `Optional(12)` · `nil` | |
| `[1,2,3][5]` | **종료 코드 133** | `Fatal error: Index out of range` |
| struct `==` · class `===` | `true` · `false` | |
| `1 == 1.0` | `true` | 리터럴 `1` 이 `Double` 로 추론된다 |

### §0.5 0부 → 1부 → 2부 → 3부 — 겹침 정리

**겹치는 쪽은 0부가 가져가고 §2·§3 에서 뺀다.** 경계는 하나다 — **값 하나를 만들고·보고·견주는
것까지가 0부**, 흐름을 나누는 문은 1부다. Swift 는 §2 여덟 중 **넷이 값 층위**다.

| 0부 장 | 어디에 있었나 | 부기 |
|---|---|---|
| `swift/boolean-literal` | §2 ② | **id 가 같다** — 자리만 올라간다 |
| `swift/operator-precedence` | §2 ③ `swift/arithmetic` | 넘침·정수 나눗셈은 0-1 과 0-5 로 갈라 들어간다 |
| `swift/equality` | §2 ④ `swift/comparison` | `if-statement` 의 prereq 를 `swift/equality` 로 다시 건다 |
| `swift/assignment` | §2 ① `swift/let-var` + §3 ① `swift/assignment` | 둘을 한 장으로 묶는다 — 축 7 의 `universal` 이 `variable-binding` 과 `reassignment` **둘**이라 원래 한 축이다 |
| `swift/integer-literal` | **없었다** | 신규 |
| `swift/float-literal` | **없었다** | 신규 |
| `swift/text-literal` | **없었다** | 신규. §3 ③ `array-subscript` 의 「문자열은 번호로 못 꺼낸다」가 여기로 온다 |
| `swift/type-conversion` | **없었다** | 신규 |

새로 서는 넷이 요점이다. **지금 계획에 정수의 폭도 자소 뭉치도 형 변환도 장이 없었다** —
§7 이 `cs/integer-overflow`·`cs/unicode-text` 로 밀어 뒀는데 `cs/` 는 쿼리가 없어 스스로 안 뜨고
언어 개념이 `prereq` 로 걸어야 산다(cs.md §8). **걸 데가 없었다.**
(부기: §7 의 `cs/unicode-text`·`cs/static-types`·`cs/value-and-reference`·`cs/reference-counting` 는
실재 id 가 아니다 — `dictionary/cs/` 의 이름은 `text-encoding`·`static-vs-dynamic-typing`·
`value-vs-reference`·`garbage-collection` 이다. §0.1 은 실재하는 이름만 썼다.)

| 부 | 무엇 | 장 | 교재 |
|---|---|---:|---|
| **0부 값과 식** | 위 여덟 | **8** | 사전 `examples[]` (§0.7) |
| **1부 바닥** | `if-statement` · `for-in-loop` · `function-declaration` · `return-statement` | **4** | 합성 + 내 코드 짚기 |
| **2부 Swift 의 타입** | §3 중심 남은 열다섯 + §4 심화 열 | **25** | 합성 + 내 코드 |
| **3부 프레임워크 `swiftui/`** | **아직 한 장도 안 짰다** | **0** | 내 코드 중심 |

1부가 넷으로 얇은 것은 Swift 가 얕아서가 아니라 **이 언어의 바닥이 값 쪽에 몰려 있어서**다.
옵셔널·struct/class·프로토콜이 전부 「값이 무엇인가」의 갈래이고, 흐름을 나누는 문은 정말로 넷뿐이다.

**3부를 어떻게 채울지는 안 정했다.** §1 이 `swiftui/` 로 가르기로 결정했지만 그 네임스페이스의
개념 목록은 이 문서에 없다. §4 심화 셋(`property-wrapper` · `result-builder` · `some-any`)은
**언어 기능이라 `swift/` 에 남기고**, 3부는 `@State`·`body`·수식어 사슬 같은 **프레임워크 관습**으로
따로 짠다. 그 목록을 짜는 것이 다음 물결이다.

**0장 적재량 25 → 29. 상한 24 를 다섯 장 넘긴다.** 0부 여덟은 전부 깊이 ≤ 2 이고 흡수된 넷은
원래도 깊이 ≤ 2 였으므로 순증은 새로 선 넷이다. Swift 는 0부 이전에 **이미 25 로 유일하게 넘친
언어**였고(README §5 ①) 0부가 간격을 벌린다.

**여기서 축 하나가 겹쳐 있다는 것이 드러난다 — 「0장」과 「0부」는 다른 것이다.**
0장(프롤로그)은 `zeroChapterPlates` 가 **사용처가 있는 `essential` 중 깊이 얕은 것 24판**을 고른
것이고, 0부는 **코스의 첫 부**다. 0부를 `essential` 에 넣으면 0장 후보가 되어 상한을 두고 경쟁하고,
**지면 「정수에 폭이 있다」가 프롤로그에서 빠진다.** D147 이 상한을 8→24 로 올리며 세운 뜻과 반대다.
결정거리 둘 — ⓐ 0부를 0장 정렬 밖에 두고 코스가 순서를 직접 든다 ⓑ 상한을 올린다.
README §11 의 미결 3번이 같은 물음이고, **Swift 가 그 물음이 가장 아픈 언어다.**
**어느 다섯이 잘릴지는 안 쟀다** — 이 리포에 `.swift` 가 0개라 정렬 첫 키(사용처 있음)가 전부 0이고,
그때 `zeroChapterPlates` 가 무엇을 내는지 확인하지 않았다.

→ **정해졌다(D184, 2026-09-05): 상한 폐지.** ⓐ도 ⓑ도 아니다 — `essential` 에 넣고 **자르지 않는다.**
29판이 전부 든다(하루 2장이면 15일). 잘릴 뻔한 다섯이 0부 신설 넷을 포함했으니 폐지가 곧 해결이다(§N.5).

### §0.6 판 수와 일수

정본 §2 — 하루 15분, 새 판 2장(D12). 판 수는 개념 수와 1:1 로 잡았다(java.md §2 와 같은 셈).

| 부 | 판 | 일 |
|---|---:|---:|
| 0부 | 8 | **4** |
| 1부 | 4 | 2 |
| 2부 | 25 | 13 |
| 3부 | 0 (미정) | 0 |
| **합** | **37** | **19** |

**19일은 하한이다.** 만기 재검이 먼저 예산을 먹으므로(정본 §2) 실제 달력은 더 길고, 얼마나
길어지는지는 **안 쟀다.** 3부가 서면 `swiftui/` 개수만큼 더 붙는다.

### §0.7 문법 현황 — **로드는 통과하고 캡처가 0 이다**

| 자리 | 상태 | 근거 |
|---|---|---|
| `crates/parse` 문법 | ❌ **없다.** 크레이트가 `Cargo.toml` 에 아예 없다 | `crates/parse/Cargo.toml` · `langs.rs` |
| 그 사실을 지키는 못 | ✅ `swift_and_dart_are_not_in_the_build_yet` — 넣으면 빨개진다 | `crates/parse/tests/quality.rs:125` |
| `grammarSchema` | ✅ `swift` 가 이미 있다 | `packages/dictionary/src/schema.ts:29` |
| `grammarOf('.swift')` | ✅ `swift` | `apps/desktop/src/session-flow.ts` |
| 사전을 쓰면 | **스키마도 린트도 통과하고 캡처만 0곳** | I6 확인 |
| 파싱을 시키면 | `ParseError::UnsupportedLang("swift")` — 조용히 TS 로 새지는 않는다 | `crates/parse/src/lib.rs:128` |
| `dictionary/swift/**` | ❌ 없다 | `ls dictionary/` |

**「스키마에 있으니 열려 있다」가 아니다.** `dictionary/swift/_lang.yaml` 에 `grammars: [swift]` 를
적으면 로드 단계는 통과하는데 파서가 없어 **캡처가 0곳**이고, 사용처가 0이면 카드가 안 구워진다.
**「곧 됩니다」가 아니라 순서가 있다.**

**Swift 를 세우려면 이 순서다.**

1. `crates/parse/Cargo.toml` 에 `tree-sitter-swift`(0.7.3 · MIT · alex-pinkus)를 넣고 `lang-swift`
   피처와 `langs.rs` 한 줄을 더한다. `parser.c` 가 **20.6 MB** 라 빌드 시간이 늘어난다(§8).
2. 그 순간 `quality.rs:125` 가 빨개진다. **실코드 20파일 ERROR 비율을 재고 03 §2.3 의 5 % 게이트를
   통과하는지 본다.** 통과 못 하면 여기서 멈춘다(00 §6-2 「기본 보류」). **이 세션에서도 안 쟀다.**
3. `grammar_abi` 를 `_lang.yaml` 에 **15** 로 적는다(실측 · §8). 크레이트의 dev-dependency 가
   `tree-sitter 0.23.0` 인데 이 리포는 0.25.10 이라 그 조합이 시험된 적이 없다는 것도 여기서 확인한다.
4. 시스템 쿼리 둘 — `_imports.scm`(모듈 이름) · `_blocks.scm`(`function_declaration` ·
   `init_declaration` · `class_declaration` 을 `declaration_kind` 별로 · **`computed_property`**).
   마지막 것을 빼면 SwiftUI 의 `var body` 가 블록으로 안 잡힌다(§8).
5. Monaco 에 `basic-languages/swift` 한 줄(있는 것을 확인했다 · §8). 안 더하면 T1 화면이 plaintext 로
   떨어진다.
6. 그다음에야 `dictionary/swift/**` 다.

**0부가 문법 없이 서는가 — 반만 그렇다.** 0부 판은 사전의 `examples[]` 로 카드를 굽고 파싱을
안 한다(`packages/cards/src/t0-synthetic.ts`, `SYNTHETIC_SITE_ID = -1`). 그런데 그 파일의 두 문이
**둘 다 「내 코드」 쪽 인자를 요구한다** — `makeSyntheticCard` 는 `previewSiteId`(「곧 여기서
봅니다」로 예고할 실제 사용처)가 **필수**이고, `makeAbsentCard` 는 `AbsenceReason`(framework ·
library · scale · idiom)이 필수다. 문법이 없으면 앞의 것을 못 만들고, 뒤의 것을 쓰면 **「네 코드엔
없다」와 「우리가 못 읽는다」가 섞여** D137 이 막으려던 자리로 되돌아간다.
**문법 없이 0부를 세우려면 세 번째 문이 필요하고 오늘 그것은 없다.**
채점 쪽은 덜 급하다 — 여섯 형식 중 파서를 쓰는 것은 `build` 하나이고, 그것도 문법이 없으면
정규식 정규화 폴백으로 떨어진다(정본 §5).

**표본이 없다는 것의 값 — 티어 한 줄.** 정본 §5 의 셋 중 **A(모든 리포)만 선다.**
0·1부는 합성 교재로 설 수 있고 `cs/` 간선 아홉(§7)이 붙는다. **B 는 통째로 비어 있다** —
문법이 없으니 HTTP 간선도 기능 폐포도 스키마 추출도 없고 실행 러너도 없다.
그리고 이 리포에 `.swift` 가 **0개**라 **「내가 만든 코드가 교재」(정본 §1)가 이 언어에서는 설계
단계부터 성립하지 않았다** — §1 의 「생김새」가 추정인 것, 0장 정렬의 첫 키를 못 재는 것(§0.5),
오개념 열둘의 근거가 얇은 것(§9)이 전부 같은 구멍에서 나온다.
**코스는 위 순서 2번에서 멈춘다** — ERROR 비율을 재기 전에는 0부조차 실물로 못 세우고,
2부는 사용자가 Swift 리포를 가져온 뒤에야 「내 코드」 절반이 채워진다.

---

## §2 기초 — 바닥 여덟 → **1부 바닥 넷** (0부가 넷을 가져갔다)

①·②·③·④ 는 값 층위라 §0.5 대로 0부로 올라간다. 아래 표는 여덟 그대로 두되 올라간 넷에
**↑0부**를 붙였고, 1부에 남는 것은 `if-statement` · `for-in-loop` · `function-declaration` ·
`return-statement` 넷이다.

| # | id | name.ko / en | token | universal | diff | prereq | 이 언어라서 다른 것 |
|---|---|---|---|---|---|---|---|
| 1 ↑0부 | `swift/let-var` → 0부에서 §3 ① `swift/assignment` 와 한 장 | 이름에 값 묶고 바뀔지 정하기 / Binding with let or var | `let` | `common/variable-binding` | 1 | — | 이름을 만드는 줄에 **바뀔 이름인지까지 함께 적는다.** 안 바꿀 거면 `let`, 바꿀 거면 `var` — 골라야만 줄이 완성된다 |
| 2 ↑0부 | `swift/boolean-literal` (0부에서 **id 그대로**) | 참·거짓 값 / Boolean literal | `true` | `common/boolean-value` | 1 | — | 조건 자리에 `Bool` 말고는 **아무것도 못 온다.** `if 1` 도 `if name` 도 컴파일이 멈춘다 — 다른 언어의 「참 같은 값」이 Swift 에는 없다 |
| 3 ↑0부 | `swift/arithmetic` → 0부에서 `swift/operator-precedence`(+ 넘침은 `swift/integer-literal`) | 셈하기 / Arithmetic | `+` | `common/arithmetic` | 1 | — | **종류가 다른 숫자는 그냥 못 더한다.** `let a = 1`·`let b = 2.0` 뒤의 `a + b` 가 오류다(리터럴끼리인 `1 + 2.0` 은 된다 — 그래서 더 헷갈린다). 그리고 정수끼리 나누면 소수를 버리고, 넘치면 감기지 않고 **그 자리에서 죽는다** |
| 4 ↑0부 | `swift/comparison` → 0부에서 `swift/equality` | 두 값 견주기 / Comparison | `==` | `common/comparison` | 1 | `swift/boolean-literal` | **`==` 와 `===` 가 다른 물음이다** — 값이 같은가와 같은 상자인가. `struct` 에는 `===` 를 쓸 수조차 없다 |
| 5 | `swift/if-statement` | 조건으로 흐름 나누기 / If statement | `if` | `common/conditional-branch` | 1 | `swift/boolean-literal` | 조건의 **괄호는 없어도 되고 몸통의 중괄호는 한 줄이어도 반드시 있다.** C·자바에서 온 손이 정확히 반대로 쓴다 |
| 6 | `swift/for-in-loop` | 하나씩 훑기 / For-in loop | `for` | `common/iterate` | 2 | `swift/let-var` | Swift 에는 `for (i = 0; i < n; i++)` 가 **없다.** 3.0 에서 삭제됐고 `for i in 0..<n` 이 그 자리를 전부 가져갔다 |
| 7 | `swift/function-declaration` | 함수 정의하기 / Function declaration | `func` | `common/function-definition` | 1 | — | **인자마다 부르는 이름이 따로 있다.** `func greet(to name: String)` 를 `greet(to: "곽")` 로 부른다 — 정의에 적힌 이름과 부를 때 쓰는 이름이 다르다 |
| 8 | `swift/return-statement` | 값 돌려주기 / Return | `return` | `common/return-value` | 1 | `swift/function-declaration` | 몸통이 **한 줄이면 `return` 을 안 적는다.** SwiftUI 의 `var body` 에 `return` 이 없는 이유가 이것이다 |

**0부가 이 절의 전제를 하나 바꾼다.** ③ `swift/arithmetic` 의 마지막 열이 「넘치면 감기지 않고
그 자리에서 죽는다」인데, 그것은 산술이 아니라 **정수에 폭이 있다는 사실**이다. 0부가 그 사실을
`swift/integer-literal` 로 따로 세우고(실측 종료 코드 133), 여기 남는 것은 우선순위와
정수 나눗셈이다.

**여덟에서 뺀 것 둘과 그 이유.** ① `while` — 바이브 코딩 SwiftUI 코드에 거의 안 나온다. 사용처가
0이면 카드가 안 구워지므로 §3 으로 내렸다. ② 재대입(`x = 5`) — 파이썬과 달리 Swift 는 만드는 줄과
옮기는 줄이 **다른 문법 노드**라 개념이 갈리는데(§8), `let`/`var` 고르기가 먼저다. §3 첫 줄에 뒀다.

---

## §3 중심 (16) → **2부 열다섯** (0부가 하나를 가져갔다)

① `swift/assignment` 가 §2 ① `let-var` 와 한 장으로 묶여 0부로 올라간다(§0.5). 남는 열다섯이
§4 심화 열과 합쳐 **2부 스물다섯**이 된다.

| # | id | name.ko / en | token | universal | diff | prereq | 이 언어라서 다른 것 · 없으면 왜 못 읽나 |
|---|---|---|---|---|---|---|---|
| 1 ↑0부 | `swift/assignment` | 이름에 값 다시 넣기 / Reassignment → 0부에서 `let-var` 와 한 장 | `=` | `common/reassignment` | 1 | `swift/let-var` | `let` 에 다시 넣으면 **돌리기 전에** 멈춘다. 실행 오류가 아니라 빌드 오류다 — 없으면 「왜 어떤 줄은 `var` 인가」가 영영 안 풀린다 |
| 2 | `swift/string-interpolation` | 문장에 값 끼워 넣기 / String interpolation | `\(` | `common/string-interpolation` | 2 | `swift/let-var` | `\(...)` 안에 **아무 식이나** 온다. Swift 에서 글자에 값을 넣는 사실상 유일한 표기 — `+` 로 잇는 코드는 거의 안 나온다 |
| 3 | `swift/array-subscript` | 순서 있는 목록에서 꺼내기 / Array subscript | `[` | `common/list` | 2 | `swift/let-var` | **같은 대괄호인데 배열은 죽고 딕셔너리는 옵셔널을 준다.** `arr[5]` 는 크래시, `dict["k"]` 는 `V?` — 없으면 옵셔널이 어디서 튀어나오는지 못 짚는다 |
| 4 | `swift/while-repeat` | 조건이 참인 동안 되풀이 / While and repeat | `while` | `common/loop-while` | 2 | `swift/comparison` | 다른 언어의 `do-while` 이 여기서는 **`repeat-while`** 이다 — Swift 의 `do` 는 오류를 받는 블록이라 이름을 뺏겼다 |
| 5 | `swift/optional-type` | 없을 수 있는 값 / Optional type | `?` | `common/absent-value` | 2 | `swift/let-var` | **`String` 과 `String?` 은 다른 타입이다.** 없음이 값이 아니라 타입에 적힌다 — 없으면 「왜 이 줄에 `?` 가 붙었나」가 전부 미궁이다 |
| 6 | `swift/if-let` | 없음을 벗겨 이름 붙이기 / Optional binding | `if let` | `common/unwrap-binding`(신규) | 2 | `swift/optional-type` · `swift/if-statement` | 벗겨진 값에 **새 이름**이 생긴다. `if let name = name` 의 안쪽 `name` 은 바깥과 다른 이름이다 |
| 7 | `swift/guard-let` | 아니면 여기서 나가기 / Guard | `guard` | null | 3 | `swift/if-let` · `swift/return-statement` | **성공한 값만 아래로 내보내고, `else` 안에서는 반드시 나가야 한다** — 안 나가면 컴파일이 멈춘다. Swift 함수가 「검사 → 검사 → 본문」 모양인 이유 |
| 8 | `swift/nil-coalescing` | 없을 때 채우기 / Nil coalescing | `??` | `common/nullish-default` | 2 | `swift/optional-type` | 왼쪽을 벗긴 타입과 오른쪽 타입이 같아야 하고, **결과는 더 이상 옵셔널이 아니다.** 타입이 한 겹 벗겨지는 것이 눈에 보인다 |
| 9 | `swift/optional-chaining` | 없을 수 있는 값 건너뛰기 / Optional chaining | `?.` | `common/optional-chaining` | 2 | `swift/optional-type` | **한 번이라도 `?.` 를 거치면 사슬 전체의 결과가 옵셔널이 된다.** `a?.b.c` 의 타입은 `C?` 다 |
| 10 | `swift/force-unwrap` | 있다고 보증하기 / Force unwrap | `!` | null | 2 | `swift/optional-type` | **앱이 죽는 가장 흔한 한 글자.** 「값이 있다고 내가 보증한다」는 문장이고 틀리면 그 줄에서 끝난다 |
| 11 | `swift/closure-trailing` | 마지막 인자를 괄호 밖에 / Trailing closure | `{ ` | `common/function-value` | 2 | `swift/function-declaration` | 마지막 인자가 함수면 **괄호 밖으로 나온다.** `Button("누르기") { }` 가 함수 호출로 안 보이는 이유 — SwiftUI 코드가 낯선 첫째 원인이다 |
| 12 | `swift/map-filter` | 항목마다 바꿔 새로 만들기 / Map and filter | `.map` | `common/map-transform` | 2 | `swift/closure-trailing` · `swift/array-subscript` | **`map` 이 배열에도 옵셔널에도 있다.** `[1,2].map{}` 와 `name?.map{}` 이 같은 이름인데 하나는 목록을, 하나는 값 하나를 훑는다 |
| 13 | `swift/struct-declaration` | 값으로 도는 묶음 만들기 / Struct declaration | `struct` | null | 2 | `swift/let-var` · `swift/function-declaration` | **`struct` 는 넘길 때 복사되고 `class` 는 같은 상자를 가리킨다.** 낱말 하나가 「고치면 저쪽도 바뀌나」를 통째로 뒤집는다 |
| 14 | `swift/mutating-method` | 자기 값을 바꾸는 메서드 / Mutating method | `mutating` | null | 3 | `swift/struct-declaration` · `swift/assignment` | 값 타입 안에서 자기 속성을 고치려면 **`mutating` 이라고 적어야 하고**, `let` 으로 묶인 값에는 그 메서드를 부를 수조차 없다 |
| 15 | `swift/protocol-conformance` | 규약 지키기 / Protocol conformance | `:` | null | 3 | `swift/struct-declaration` | 상속과 **똑같은 콜론**을 쓴다. `struct X: View` 는 상속이 아니라 「이 규약을 지킨다」인데 문법으로는 구별이 안 된다 |
| 16 | `swift/enum-associated-value` | 경우마다 값 데리고 다니기 / Enum with associated values | `case` | `common/tagged-union`(신규) | 3 | `swift/struct-declaration` | 다른 언어의 `enum` 은 이름표 하나인데 **Swift 는 경우마다 다른 값을 데리고 다닌다.** `.success(User)` 와 `.failure(Error)` 가 한 타입이다 |

---

## §4 심화 (10)

| # | id | name.ko / en | token | universal | diff | prereq | 이 언어라서 다른 것 |
|---|---|---|---|---|---|---|---|
| 1 | `swift/switch-exhaustive` | 모든 경우를 적기 / Exhaustive switch | `switch` | `common/exhaustive-match`(신규) | 3 | `swift/enum-associated-value` | **빠뜨린 경우가 있으면 컴파일이 멈춘다.** 그래서 `default` 를 적어 두는 습관이 오히려 손해다 — `case` 가 늘어도 안 알려 준다 |
| 2 | `swift/extension` | 나중에 붙이기 / Extension | `extension` | null | 3 | `swift/protocol-conformance` | **남이 만든 타입에 내 메서드를 나중에 붙인다.** 그래서 「이 메서드 어디서 왔지」가 선언 한 군데를 봐서는 안 나온다 |
| 3 | `swift/throws-try` | 터질 수 있다고 표시하기 / throws and try | `try` | `common/try-catch` | 3 | `swift/function-declaration` · `swift/optional-type` | **부르는 줄마다 `try` 를 적어야 한다.** 어디서 터질 수 있는지가 호출 줄에 남는다. `try?` 는 오류를 옵셔널로 바꾸고 `try!` 는 죽인다 |
| 4 | `swift/async-await` | 기다렸다 값 꺼내기 / async and await | `await` | `common/async-await` | 3 | `swift/closure-trailing` · `swift/throws-try` | `await` 를 적을 수 있는 곳이 `async` 함수 안뿐이라 **한 번 쓰면 부르는 쪽까지 전부 `async` 가 된다** |
| 5 | `swift/generics` | 타입 자리 비워 두기 / Generics | `<T>` | `common/generics` | 4 | `swift/protocol-conformance` | 비워 둔 자리에 **조건을 걸 수 있다** — `where T: Equatable`. 그래서 「아무 타입이나」가 아니라 「이 규약을 지키는 아무 타입」이다 |
| 6 | `swift/arc-weak` | 세지 않는 참조 / weak and unowned | `weak` | null | 4 | `swift/struct-declaration` · `swift/closure-trailing` | **가리키는 수를 세어 0이 되면 지운다** — 둘이 서로를 가리키면 영영 0이 안 된다. `weak` 는 메모리를 아끼는 게 아니라 **세는 것을 그만두는 것**이다 |
| 7 | `swift/capture-list` | 클로저가 붙잡는 것 정하기 / Capture list | `[weak self]` | null | 4 | `swift/arc-weak` | 클로저는 바깥 이름을 **붙잡아 둔다.** 그것이 `self` 면 화면이 사라져도 안 지워진다 — `[weak self]` 가 코드마다 붙어 있는 이유 |
| 8 | `swift/some-any` | 하나로 정해진 타입과 그때그때 다른 타입 / some and any | `some` | null | 4 | `swift/generics` | **`some View` 는 「하나로 정해진 어떤 타입」이다.** 「아무 뷰나」가 아니다 — `if` 갈래마다 다른 뷰를 돌려주면 안 되는 이유가 여기 있다 |
| 9 | `swift/property-wrapper` | `@` 하나로 저장 방식 바꾸기 / Property wrapper | `@` | null | 4 | `swift/generics` · `swift/struct-declaration` | **`@` 하나가 그 이름의 저장 위치와 읽기·쓰기 규칙을 통째로 바꾼다.** `@State` 가 값을 View 바깥에 두는 장치가 이것이다 |
| 10 | `swift/result-builder` | 줄줄이 세워 두면 합쳐 주는 것 / Result builder | `@ViewBuilder` | null | 5 | `swift/closure-trailing` · `swift/property-wrapper` | 중괄호 안에 값을 **쉼표도 `return` 도 없이** 줄줄이 세워 두면 컴파일러가 그것을 합치는 호출로 바꾼다. SwiftUI 가 Swift 처럼 안 보이는 마지막 조각 |

다음 차수 후보 둘: `swift/codable`(규약 한 줄로 JSON 변환 코드가 생기고 **그 코드가 파일에 없다**),
`swift/actor-isolation`(actor 의 속성은 읽기만 해도 `await` 가 붙는다).

---

## §5 prereq 그래프와 0장 적재량

뿌리 넷: `let-var` · `boolean-literal` · `arithmetic` · `function-declaration`.

| 깊이 | 개수 | 개념 |
|---|---|---|
| 0 | 4 | `arithmetic` `boolean-literal` `function-declaration` `let-var` |
| 1 | 10 | `array-subscript` `assignment` `closure-trailing` `comparison` `for-in-loop` `if-statement` `optional-type` `return-statement` `string-interpolation` `struct-declaration` |
| 2 | 11 | `arc-weak` `enum-associated-value` `force-unwrap` `if-let` `map-filter` `mutating-method` `nil-coalescing` `optional-chaining` `protocol-conformance` `throws-try` `while-repeat` |
| 3 | 6 | `async-await` `extension` `guard-let` `capture-list` `generics` `switch-exhaustive` |
| 4 | 2 | `property-wrapper` `some-any` |
| 5 | 1 | `result-builder` |

**깊이 ≤ 2 = 25개. 상한은 24 다 — 처음으로 넘쳤다.**
(**0부를 붙이면 29 가 된다 — 다섯 장 넘친다.** 셈과 결정거리 ⓐ/ⓑ 는 §0.5 마지막 문단.)

| 언어 | 깊이 ≤ 2 / 상한 |
|---|---|
| TS | 21 / 24 |
| 파이썬 | 19 / 24 |
| **Swift** | **25 / 24** |

**왜 넘쳤나.** 개념 대부분이 `optional-type`(깊이 1) 아니면 `struct-declaration`(깊이 1) 바로 밑에
붙는다 — 옵셔널 하나에 넷, 구조체 하나에 셋이 매달린다. 사슬이 깊지 않고 부챗살이 넓다.
「배우는 계단이 길다」가 아니라 「같은 계단에 문이 여럿이다」.

**떨어지는 한 장.** `zeroChapterPlates` 의 정렬은 ① 사용처 있음 ② 깊이 ③ 미지 적음 ④ id 다.
25번째가 잘리는데, 깊이 2 열한 개 중 넷째 키가 id 라 **`swift/while-repeat` 이 알파벳 꼴찌로 떨어질
공산이 크다**(리포마다 ③이 달라 확정은 아니다). 그게 원하는 결과인지 물어야 한다 — 「조건이 참인 동안」이
프롤로그에서 빠지는 것이라서.

**깊이가 못 거른 것 하나.** `swift/arc-weak` 가 깊이 2 에 들어 0장 후보다. 선행이 짧은데 어려운
개념이고(`difficulty: 4`), 「순환 참조」를 프롤로그에서 만나는 것은 D147 의 뜻이 아니다. 제안은 둘 중
하나 — ⓐ `cs/reference-counting`(§7)을 선행으로 걸고 `cs/` 도 깊이 계산에 넣는다 ⓑ 정렬에 `difficulty`
를 키로 더한다. ⓑ 가 싸다.

**사이클 둘과 끊은 자리.**
- `struct-declaration` ↔ `mutating-method` — 「값이라 복사된다」를 가장 잘 보여 주는 것이 `mutating` 이
  필요한 이유인데, `mutating` 을 읽으려면 struct 를 먼저 알아야 한다. **선언을 위에 두고 끊었다.**
- `optional-type` ↔ `if-let` — 옵셔널의 정의가 「벗겨야 쓴다」이고 벗기는 표기가 `if let` 이다.
  **타입을 위에 두고 끊었다.**

**Exercism Swift 트랙과의 대조.** 트랙은 있다(개념 43 · 개념 연습 18). 깊이 0~3 은 `basics ·
booleans · numbers · characters-and-strings · conditionals · ternary-operator` **여섯뿐**이고,
`optionals` 가 깊이 8 · `while` 이 깊이 9 다 — D148 이 경고한 그대로 그쪽 간선은 연습을 여는
조건이라 베끼면 옵셔널이 프롤로그에 영영 못 들어온다. 목록만 가져왔다. 43개 중 8개(`classes`
`conditionals-guard` `initializers` `loops` `opaque-indices` `repeat-while` `stored-properties`
`strings`)는 문서만 있고 연습이 없으며, **프로토콜·확장·제네릭·오류 처리·ARC·`async`/`await`·
`Codable`·속성 감싸개는 트랙에 아예 없다** — 이 언어를 가르는 절반이다.

---

## §6 `common/` 재사용 대 신규

### 재사용 — **30개 중 20개(67 %)**

| `swift/<concept>` | `common/<id>` |
|---|---|
| `let-var` | `variable-binding` |
| `assignment` | `reassignment` |
| `boolean-literal` | `boolean-value` |
| `arithmetic` | `arithmetic` |
| `comparison` | `comparison` |
| `if-statement` | `conditional-branch` |
| `for-in-loop` | `iterate` |
| `while-repeat` | `loop-while` |
| `function-declaration` | `function-definition` |
| `return-statement` | `return-value` |
| `string-interpolation` | `string-interpolation` |
| `array-subscript` | `list` |
| `optional-type` | `absent-value` |
| `nil-coalescing` | `nullish-default` |
| `optional-chaining` | `optional-chaining` |
| `closure-trailing` | `function-value` |
| `map-filter` | `map-transform` |
| `throws-try` | `try-catch` |
| `async-await` | `async-await` |
| `generics` | `generics` |

파이썬은 21개였다. Swift 가 하나 적은 것은 개념 34개 슬롯 안에 리터럴 넷(`text-literal`
`number-literal` `member-access` `function-call`)을 못 넣어서지 Swift 에 그것이 없어서가 아니다 —
다음 차수 후보다. `destructuring`(튜플 분해 `let (a, b) = pair`)·`conditional-expression`(`a ? b : c`)·
`mutating-append`(`arr.append`)도 같다.

**전이가 안 되는 것 둘, 근거를 붙여서.**
- `common/copy-with-changes` — **Swift 에서 사라진다.** struct 가 값이라 `var copy = original` 이
  곧 복사본이고, 「복사하며 바꾸기」라는 별도 표기가 필요 없다. 다른 언어에서 이걸 3겹 쌓고 온 사람에게
  전이할 Swift 개념이 없다.
- `common/promise-chain` — Swift 에는 `.then` 체인 관습이 없다. 완료 핸들러는 있지만 체인이 아니다.

### 옵셔널은 `common/` 을 써도 되나 — **셋 중 둘은 쓴다**

브리프의 시험대다. 답을 하나씩.

| | 판정 | 근거 |
|---|---|---|
| `common/absent-value` | **쓴다** | 그 개념의 핵심 문장이 「없는 값의 안을 읽으려 하면 그 자리에서 멈춘다」이고, Swift 의 강제 해제 크래시가 정확히 그것이다. D4 전이는 「1겹으로 시작 + 표기 차이 카드 먼저」인데, **「여기서는 없음이 타입이다」가 바로 그 표기 차이 카드의 내용**이다. 0겹에서 다시 시작시키는 것보다 낫다 |
| `common/optional-chaining` | **쓴다** | 「없으면 건너뛰고 결과가 없음이 된다」가 언어와 무관하게 같다. Swift 만의 것은 「사슬 전체의 타입이 옵셔널이 된다」인데, 그것이 이 개념의 `bridge` 에 들어갈 문장이다 |
| `common/nullish-default` | **쓴다** | `??` 의 동작이 TS 와 같다. Swift 만의 것은 결과 타입이 벗겨진다는 것 — 역시 다리 문장이다 |
| `if let`/`guard let` | **못 쓴다** | `common/` 에 대응이 없다. `absent-value` 는 「없음이란 무엇인가」이고 이것은 「벗겨 이름을 붙이는 표기」다. 신규 제안 ↓ |

즉 **Swift 의 옵셔널은 다른 기계가 아니라 같은 기계에 타입 검사가 붙은 것이다.** 전이는 성립하고,
전이할 수 없는 것은 「벗기기」라는 표기 하나다.

### 신규 보편 제안 셋

| id | name.ko / en | 다른 언어 둘 이상에서 성립하는가 |
|---|---|---|
| `common/unwrap-binding` | 없음을 벗겨 이름 붙이기 / Unwrap and bind | Rust `if let Some(x) = opt` · Kotlin `x?.let { }` 와 스마트 캐스트 · TS `if (x != null)` 의 타입 좁히기. **셋** |
| `common/tagged-union` | 경우마다 다른 값을 데리고 다니는 종류 / Tagged union | Rust `enum` · TS 판별 유니온 · Kotlin `sealed class`. **셋** |
| `common/exhaustive-match` | 빠뜨린 경우를 컴파일러가 센다 / Exhaustiveness | Rust `match` · Kotlin `when`(식일 때) · TS 의 `never` 소진 검사. **셋** |

뒤의 둘은 붙어 다니지만 다른 것이다 — 하나는 **값의 모양**이고 하나는 **읽는 쪽의 의무**다.
TS 판별 유니온은 앞의 것만 있고 뒤의 것은 관용(`never`)으로 흉내 낸다.

### `universal: null` 로 둘 것

`guard-let`(성공만 아래로 — Swift 만) · `force-unwrap`(보증하고 틀리면 죽는다 — Rust `.unwrap()` 이
비슷하나 TS `!` 는 안 죽어서 전이하면 거짓말이 된다) · `mutating-method`(Rust `&mut self` 하나뿐) ·
`struct-declaration` · `protocol-conformance` · `extension` · `arc-weak` · `capture-list` ·
`some-any` · `property-wrapper` · `result-builder`.

---

## §7 `cs/` 로 밀어낼 것

문법이 아니라 기계·이론인 것. 각 행의 마지막 열이 **어느 Swift 개념이 이것을 필요로 하는지**다.

| id | 한 줄 정의 | 이 개념들이 필요로 한다 |
|---|---|---|
| `cs/static-types` | 값의 종류를 돌리기 전에 정하고, 안 맞으면 돌기 전에 막는다 | `swift/let-var` · `swift/optional-type` · `swift/generics` |
| `cs/value-and-reference` | 값을 넘기면 복사되고 참조를 넘기면 같은 것을 가리킨다 | `swift/struct-declaration` · `swift/mutating-method` · `swift/comparison`(`===`) |
| `cs/reference-counting` | 가리키는 수를 세어 0이 되면 지운다 | `swift/arc-weak` · `swift/capture-list` |
| `cs/stack-and-heap` | 지금 도는 함수의 자리와 오래 남는 자리는 다르다 | `swift/struct-declaration` · `swift/closure-trailing` |
| `cs/compile-and-run` | 돌리기 전에 걸러지는 것과 돌다가 터지는 것은 다르다 | `swift/assignment`(빌드에서 멈춤) · `swift/force-unwrap`(런타임 크래시) · `swift/switch-exhaustive` |
| `cs/integer-overflow` | 정수에는 끝이 있고, 넘었을 때 무슨 일이 나는지는 언어가 정한다 | `swift/arithmetic`(Swift 는 죽고 C 는 감긴다) |
| `cs/floating-point` | 소수는 정확히 못 담는다 | `swift/arithmetic` |
| `cs/unicode-text` | 글자 하나가 바이트 하나가 아니다 | `swift/array-subscript` · `swift/string-interpolation` |
| `cs/concurrency-model` | 같은 것을 둘이 동시에 만지면 무슨 일이 나는가 | `swift/async-await` · (`swift/actor-isolation`) |

Swift 는 `cs/unicode-text` 가 특히 급하다 — `String` 이 바이트가 아니라 자소 뭉치의 모음이라
`name[3]` 이 **아예 안 된다.** 다른 언어에서 온 사람이 가장 먼저 부딪히는 벽인데, 이 사실을 모르면
「왜 문자열만 번호로 못 꺼내나」에 답할 문법 개념이 없다.

---

## §8 tree-sitter 현실

### 크레이트와 ABI — 실측

크레이트 `tree-sitter-swift` 0.7.3 (alex-pinkus, **MIT**, 2026-06-01 배포). crates.io 배포본을 받아
직접 쟀다.

| 항목 | Swift | 비교 |
|---|---|---|
| `grammar_abi`(`parser.c` 의 `LANGUAGE_VERSION`) | **15** | python 14 · typescript 14 · tsx 14 · go 14 · rust 14 · sequel 14 · **javascript 15** |
| `parser.c` 크기 | **20,642,243 B (20.6 MB)** | sequel 17.4 MB · tsx 8.8 MB · rust 6.5 MB · python 3.4 MB · go 1.5 MB |
| `STATE_COUNT` | 10,321 | tsx 5,986 · python 2,809 · go 1,425 |
| `SYMBOL_COUNT` | 558 | — |
| 규칙 수 · conflicts · 외부 토큰 | 304 · 39 · **33** | python 150·9·12 · typescript 229·48·10 |
| **supertypes** | **0개** | python 6 · typescript 7 |

**세 가지가 바로 걸린다.**

① **저장소에 `parser.c` 가 없다.** GitHub 의 `src/` 는 `grammar.json`·`node-types.json`·`scanner.c`
뿐이고 `parser.c` 는 배포 시 생성돼 crates.io 타르볼에만 들어간다 — ABI 를 보려면 `.crate` 를 받아야 한다.

② **`grammar_abi` 필드가 이미 어긋나 있다.** `dictionary/ts/_lang.yaml` 은 `grammar_abi: 15` 인데
그 `grammars` 셋의 실측은 **14·14·15** 다. 숫자 하나로 문법 셋을 적을 수 없고, 이 값을 **검사하는
코드가 없어**(소비처 grep 0건) 조용히 틀린 채였다. Swift 를 넣기 전에 문법별로 나누거나 `ts` 를 고쳐야 한다.

③ **크레이트의 dev-dependency 가 `tree-sitter 0.23.0` 인데 우리는 0.25.10 이다.** ABI 15 는 0.25 가
읽지만 이 크레이트가 0.25 에서 시험된 적은 없다. `crates/parse/tests/quality.rs:125` 의
`swift_and_dart_are_not_in_the_build_yet` 이 크레이트를 넣는 순간 빨개지며 실코드 20파일 ERROR
비율을 재라고 시킨다 — 그 순서를 지켜야 한다(03 §2.3 · 00 §6-2).

### 파싱 함정 — 파이썬 연쇄 비교의 대응물

파이썬은 `a < b < c` 를 「자식이 정확히 둘」로 잘라냈다. Swift 에는 **같은 노드 이름이 여러 개념을
겸하는 자리**가 여럿이고, 이쪽은 더 위험하다 — 쿼리가 0건을 내는 게 아니라 **틀린 것을 잡는다.**

| # | 함정 | 실제 노드 | 막는 법 |
|---|---|---|---|
| ① | **`class_declaration` 이 다섯을 겸한다** | `declaration_kind` 필드의 익명 토큰이 `class` `struct` `enum` `extension` `actor` | `(class_declaration declaration_kind: "struct")` 로 못을 박는다. `(class_declaration)` 만 적으면 넷을 덤으로 잡는다 — **Swift 판 「자식이 정확히 둘」이 이것이다** |
| ② | **`control_transfer_statement` 이 다섯을 겸한다** | `return` `continue` `break` `yield` + `throw` | `return-statement` 쿼리는 익명 `"return"` 에 앵커를 건다 |
| ③ | **`?.` 과 `.` 이 트리에서 같다** | `navigation_suffix` = `_dot` + suffix. `_dot` 는 외부 토큰 `_dot_custom` 을 익명 `"."` 로 **별칭**한 것 | 구조로는 못 가른다. 잡은 토큰의 **바이트**를 봐야 한다 — `optional-chaining` 은 `#match? "\\?\\."`, `member-access` 는 그것을 뺀다 |
| ④ | **`try` · `try?` · `try!` 이 하나다** | `try_operator` 안의 `!`/`?` 가 IMMEDIATE_TOKEN 이라 이름이 없다 | ③과 같은 처리 |
| ⑤ | **`let` 과 `var` 가 하나다** | `value_binding_pattern` 의 `mutability` 필드가 익명 `let`/`var` | `(value_binding_pattern mutability: "let")` |
| ⑥ | **지역 바인딩과 저장 속성이 같은 노드다** | 둘 다 `property_declaration` | 조상이 `function_body`/`statements` 인지 `class_body` 인지 봐야 한다 — 플랜 `{#a-scope}` 의 「AstLite 에 조상이 있는지 먼저 확인」이 이 자리다 |
| ⑦ | **상속과 프로토콜 채택이 같다** | 둘 다 `inheritance_specifier` | 트리로 못 가른다. 이름 관습밖에 없다 — `swift/protocol-conformance` 의 사용처가 부정확해진다는 것을 받아들이거나, 알려진 프로토콜 이름 목록을 쿼리에 박는다 |
| ⑧ | **supertypes 가 0개다** | `_expression` 이 숨은 규칙이라 쿼리에서 못 쓴다 | 「어떤 식이든」을 적을 방법이 없어 `[(call_expression) (simple_identifier) …]` 로 나열해야 한다. `node-types.json` 의 필드 타입 목록이 57~78개인 이유가 이것이다 |

### 후행 클로저와 결과 빌더가 캡처에 하는 일

**후행 클로저.** `call_suffix` 는 `value_arguments` | `lambda_literal` | 둘 다, 셋 중 하나다. 그래서
`VStack { }` 에는 **`value_arguments` 가 아예 없다** — 호출을 `(call_expression (call_suffix
(value_arguments)))` 로 적으면 SwiftUI 의 호출을 통째로 놓치고, `(call_expression)` 만 적으면
`.padding()` 같은 수식어 사슬까지 잡혀 한 파일에 사용처가 수백 개 나 03 §2.5 의 「개념당 Site 상한
20」에 걸린다. 다중 후행 클로저(5.3)는 `lambda_literal (name ":" lambda_literal)*` 다.

**결과 빌더는 문법에 흔적이 없다.** `@ViewBuilder` 는 그냥 `attribute` 고, `VStack { Text("a")
Text("b") }` 의 안쪽은 `lambda_literal → statements` 이며 각 줄은 평범한 `call_expression` 이다.
**쉼표도 `return` 도 없는 코드가 「식 여럿을 세워 둔 문 목록」으로 파싱된다** — 트리만 봐서는 결과
빌더인지 그냥 클로저인지 알 수 없다. 앵커는 둘뿐이다: 반환 타입의 `opaque_type`(`some View`) 과
`attribute` 의 `@ViewBuilder`.

**가장 위험해 보이는 자리 — 확인 필요.** 문 경계가 외부 스캐너의 `_implicit_semi` 다(줄바꿈으로 문을
끊는다). 수식어 사슬을 여러 줄로 접는 것이 SwiftUI 의 기본 서식인데, 그때 앞 줄을 문으로 끊지 않는
판단이 `_dot_custom` 스캐너에 달려 있다. 외부 토큰이 33개(python 12·typescript 10)이고 연산자
공백 규칙까지 스캐너가 본다(`_plus_then_ws`·`_minus_then_ws`·`_eq_custom`). **실코드 20파일 ERROR
비율을 재기 전에는 이 문법을 쓴다고 말하면 안 된다.**

### Swift 6 커버리지 — grammar.json 실측

있는 것: `actor` · `nonisolated(nonsending)` · `consuming`/`borrowing` · `distributed` ·
`package`(접근 수준) · `throws(E)`(타입 있는 throws, `throws_clause`) · `some`(`opaque_type`) ·
`any`(`existential_type`) · `each`(파라미터 팩) · `macro_invocation`(`#Preview`) · `macro_declaration` ·
`async let`(`_async_modifier`) · `weak`/`unowned(safe)`/`unowned(unsafe)`(`ownership_modifier`).

**없는 것**: `isolated` 파라미터 수식어(SE-0313)와 `sending`(SE-0430) — grammar.json 에 0건이다.
그 문법을 쓴 파일은 `ERROR` 를 낸다. 6.3 코드에서 얼마나 흔한지는 **확인 못 했다.**

### 그 밖의 배선

| 자리 | 지금 | 해야 할 것 |
|---|---|---|
| 확장자 표(03 §2.1) | `.swift` → `swift` | 그대로. 단 **`Package.swift` 는 앱 코드가 아니라 빌드 매니페스트다** — D60 의 「테스트는 사용처로 세되 `essential` 집계에서 뺀다」와 같은 처리를 물어야 한다 |
| Monaco(05 §1.3) | 여섯 언어에 swift 없음 | `monaco-editor@0.52.2` 에 `basic-languages/swift/swift.contribution.js` 가 **있다**(확인함). 한 줄 더하면 된다. 안 더하면 T1 클론 코딩 화면이 조용히 plaintext 로 떨어진다 |
| 04 §144 블록 표 | `swift / dart` 한 행에 `function_declaration · class_declaration / method_signature+function_body` | `method_signature` 는 Swift 문법에 없다(Dart 것이다). 그리고 `class_declaration` 이 함정 ①이라 `declaration_kind` 를 함께 적어야 한다 |
| `_imports.scm` | 없음 | `(import_declaration (identifier) @import.source)` 하나면 된다 — Swift 의 import 는 파일이 아니라 **모듈**이라 04 §300 이 이미 「타입 참조 휴리스틱 · `confidence:'heuristic'`」으로 적어 뒀다 |
| `_blocks.scm` | 없음 | `function_declaration` · `init_declaration` · `class_declaration`(kind 별) · `computed_property`. **SwiftUI 의 `var body` 는 함수가 아니라 계산 속성이라** `computed_property` 를 안 넣으면 T1 이 화면 코드에서 블록을 못 고른다 |

---

## §9 오개념

`misconceptions:` 와 오답 `diag` 에 그대로 들어갈 열둘. **근거의 한계를 먼저 적는다** —
progmiscon.org 는 Python·Java·JavaScript·Scratch 넷만 다루고 **Swift 는 없다**(247건 · 58개념 · 4언어).
그래서 이 목록은 연구 목록이 아니라 실무 문헌과 Exercism 개념 문서에서 반복해 지적되는 것들이고,
파이썬·TS 판보다 근거가 약하다. **Swift 학습자 오개념의 실증 연구는 찾지 못했다.**

| # | 무엇을 믿나 | 실제로는 |
|---|---|---|
| 1 | 옵셔널은 「비어 있을 수도 있는 같은 타입」이다 | `String?` 과 `String` 은 **다른 타입**이다. `Int("3") + 1` 이 컴파일 오류인 이유가 이것이다 |
| 2 | `!` 는 옵셔널을 켜는 스위치다 | 「값이 있다고 내가 보증한다」는 문장이다. 없으면 그 줄에서 **앱이 끝난다** |
| 3 | `if let name = name` 의 안쪽 `name` 은 바깥 것이다 | 안쪽은 **벗겨진 새 이름**이고 바깥은 여전히 옵셔널이다. 블록을 나가면 새 이름은 사라진다 |
| 4 | `let` 으로 묶으면 안쪽 값도 못 바꾼다 | class 를 `let` 으로 묶으면 **다른 상자로 못 바꾸는 것**이지 상자 안은 바꿀 수 있다. struct 라면 안쪽도 못 바꾼다 — 같은 낱말이 두 결과를 낸다 |
| 5 | struct 를 다른 이름에 넣으면 같은 것을 가리킨다 | **복사된다.** 한쪽을 바꿔도 다른 쪽은 그대로다 |
| 6 | `mutating` 은 「이 메서드는 위험하다」는 표시다 | 값 타입은 기본이 못 바꾸는 것이고, `mutating` 은 **자기 자신을 새 값으로 바꿔 담겠다**는 선언이다. `let` 으로 묶인 값에는 부를 수 없다 |
| 7 | `weak` 를 붙이면 메모리를 아낀다 | 아끼는 게 아니라 **세는 것을 그만두는 것**이다. 가리키던 것이 사라지면 그 이름이 `nil` 이 되므로 반드시 옵셔널이다 |
| 8 | `@State` 를 붙이면 값이 오래 남는다 | 값은 SwiftUI 가 **View 바깥에** 보관한다. View struct 자체는 화면을 그릴 때마다 새로 만들어지고, 그래서 `@State` 없는 `var` 는 매번 초깃값으로 돌아간다 |
| 9 | `some View` 는 「아무 뷰나」다 | **하나로 정해진 어떤 타입**이고 컴파일러가 그것을 안다. `if` 갈래마다 다른 뷰를 돌려주면 안 되는 이유이고, `@ViewBuilder` 가 필요한 이유다 |
| 10 | `try` 를 적으면 오류를 처리한 것이다 | `try` 는 **여기서 터질 수 있다는 표시**일 뿐이다. 받는 것은 `do`/`catch` 나 `try?` 다 |
| 11 | `async` 함수를 부르면 백그라운드로 넘어간다 | `await` 는 그 흐름을 **거기서 멈춰 두고 자리를 내주는 것**이다. 다른 스레드로 옮기는 표시가 아니다 |
| 12 | `switch` 에 `default` 를 적어 두면 안전하다 | 오히려 나중에 `case` 가 늘었을 때 **컴파일러가 안 알려 준다.** Swift 는 빠뜨린 경우를 세어 주는데, `default` 가 그 눈을 가린다 |

**이 열둘은 1·2부의 것이다.** 옵셔널·ARC·SwiftUI 쪽에 몰려 있고 **값 층위는 ④ 하나뿐**이라
(`let` 이 안쪽까지 잠그지 않는다) **0부 여덟 장의 오개념을 §0.1 의 마지막 열에 따로 세웠다** —
넘치면 감긴다는 믿음 · `Float` 가 정확하다는 믿음 · `s[0]` · 참 같은 값 · `1 << 2 + 3` ·
리터럴은 섞이는데 변수는 안 섞임 · `==` 와 `===` 일곱이다. 그 일곱 중 여섯은 **이 세션에서
Swift 6.3.3 으로 실행해 확인했다**(§0.4) — 근거가 얇다는 위 단서가 0부에는 덜 걸린다.

---

## §10 근거와 출처

**확인한 것 — 이 리포 안에서 직접 잰 것**

- `crates/parse/Cargo.toml`·`Cargo.lock`(tree-sitter 0.25.10 · 문법 여섯 · swift 없음) ·
  `crates/parse/tests/quality.rs:125`(`swift_and_dart_are_not_in_the_build_yet`)
- `~/.cargo/registry/**/parser.c` — python·typescript·tsx·go·rust·sequel 14 · javascript 15
- `packages/dictionary/src/load.ts:85` · `schema.ts:155,235-236`(`detect` 는 소비처가 있고 `framework` 는 없다) ·
  `apps/desktop/src/flow.ts:102`(`dependencies: []`) · `packages/concepts/src/ingest.ts:464` · `zero-chapter.ts:93-125`
- `node_modules/.pnpm/monaco-editor@0.52.2/**/basic-languages/swift/` — 있다
- `docs/03` §2.1~§2.3 · `docs/04` §144·§300 · `docs/05` §1.3

**확인한 것 — 외부**

- tree-sitter-swift 0.7.3 크레이트 실측: `LANGUAGE_VERSION 15` · `parser.c` 20,642,243 B ·
  `STATE_COUNT 10321` · `SYMBOL_COUNT 558` · 규칙 304 · conflicts 39 · 외부 토큰 33 · supertypes 0.
  `https://static.crates.io/crates/tree-sitter-swift/tree-sitter-swift-0.7.3.crate` (MIT)
- 저장소: `https://github.com/alex-pinkus/tree-sitter-swift` — `src/` 에 `parser.c` 없음
- crates.io: `https://crates.io/crates/tree-sitter-swift` — 0.7.3 (2026-06-01)
- Exercism Swift 트랙: `https://raw.githubusercontent.com/exercism/swift/main/config.json`
  (MIT · © 2021 Exercism) — 개념 43 · 개념 연습 18. **목록만 가져왔고 `prerequisites` 간선과 산문은
  가져오지 않았다**(D148)
- TIOBE 2026-08: `https://www.techrepublic.com/article/news-tiobe-index-language-rankings/` — Swift 17위 0.96 %
- Swift 6.3: `https://www.swift.org/blog/whats-new-in-swift-march-2026/` · `https://www.infoworld.com/article/4150248/swift-6-3-boosts-c-interoperability-android-sdk.html`
- progmiscon.org: `https://progmiscon.org/` — Python·Java·JavaScript·Scratch 넷. **Swift 없음.**
  재사용 라이선스 명시가 없어 인용만 하고 문장을 가져오지 않았다(D148)
- 오개념 항목의 실무 근거(문장은 가져오지 않았다): `hackingwithswift.com/articles/136` ·
  `swiftbysundell.com/articles/mutating-and-nonmutating-swift-contexts` ·
  `avanderlee.com/swift/optionals-in-swift-explained-5-things-you-should-know` ·
  `exercism.org/tracks/swift/concepts/{optionals,value-and-reference-types}`

**확인 못 한 것**

- **바이브 코딩으로 나온 Swift 코드의 실제 구성비**(§1). 이 리포에 `.swift` 가 0개다. 추정이고,
  실제 리포 20개를 읽어야 확정된다.
- **tree-sitter-swift 의 실코드 ERROR 비율.** 20.6 MB 짜리 `parser.c` 를 빌드해야 재는데 이 조사에서는
  안 했다. 03 §2.3 의 5 % 게이트를 통과하는지 모른다 — **이것을 재기 전에는 `dictionary/swift/**` 를
  쓰면 안 된다**(00 §6-2 「기본 보류」).
- **`isolated`·`sending` 미지원이 실코드에서 얼마나 걸리는지.**
- **Swift 학습자 오개념의 실증 연구.** 못 찾았다.
- **`Package.swift` 를 사용처로 셀 것인가.** 사용자 결정이 필요하다.

---

## §11 학습법 — 이 언어를 이해한다는 것

800줄 상한을 넘어 [`swift-learning.md`](./swift-learning.md) 로 분리했다 — 기계 한 문장 ·
애플 책과 100 Days 의 옵셔널 자리 실측 · 좁혀야 통과하는 연습 넷 · 오답 진단이 `variants` 를 요구하는 이유 ·
문법이 러너보다 큰 벽인 것 · 바꿀 것 diff.
