# Go 커리큘럼 조사 — 네임스페이스 `go`

조사일 2026-09-04 · **0부 「이 언어의 값과 식」 추가 2026-09-05**(정본 §1·§4 · 사용자 요청
「기초부터, 언어의 동작 원리부터」). 사전을 쓰기 전에 **무엇을 넣을지와 왜 그것인지**를 정한다.

숫자의 출처는 셋이다. ① 실제 Go 애플리케이션 둘 — `cli/cli`(GitHub CLI, `pkg/` 아래 비테스트
429 파일 · 87,875줄)와 `lazygit`(964 파일 · 115,321줄). ② 이 리포가 고정한 문법
`tree-sitter-go 0.23.4` 를 직접 빌드해 파싱한 결과. ③ Go 명세·FAQ·설문. 못 잰 것은 §10 에
「확인 못 함」으로 모았다.

---

## §1 언어 좌표

| 항목 | 값 |
|---|---|
| TIOBE 2026-08 | **14위 · 1.07%** (2025-08 8위 → 14위, −1.04%p) |
| `lang` / `grammar` | `go` / `go` (크레이트 `tree-sitter-go`) |
| 확장자 | `.go` — **하나뿐이다** |
| 키워드 수 | **25** (Python 35 · JS 36) |
| 무엇을 만드나 | API·RPC 서비스 **74%** · CLI 도구 **63%** (Go Developer Survey 2024 H1) |

`go.mod` 는 Go 소스가 아니다(별도 문법이 필요한데 이 리포에 없다). `resolveGo` 가 그것을
텍스트로 읽어 모듈 경로만 쓴다 — `packages/concepts/src/resolve-imports.ts:269`.

### 바이브 코딩으로 나온 Go 코드의 생김새

LLM 이 Go 로 앱을 짜면 HTTP 서버 아니면 CLI 다. 설문의 74%/63% 이 그 배분과 겹치고, 그러면
쏟아지는 구문이 정해진다. `cli/cli` 실측:

| 표기 | 사용처 | 담긴 파일(429 중) | | 표기 | 사용처 | 파일 |
|---|---:|---:|---|---|---:|---:|
| `if err != nil` | **2,284** | **316 (74%)** | | `defer ` | 191 | 99 |
| `, err :=` | 1,922 | 312 | | `go func` | **29** | **19 (4.4%)** |
| `return err` | 1,498 | 247 | | `chan` | 29 | 19 |
| `:=` 전체 | 7,260 | — | | `select {` | **11** | 10 |
| `if` 문 전체 | 7,669 | — | | `sync.` | 82 | 17 |
| 포인터 리시버 | 597 | 108 | | `[T ` 제네릭 | **10** | 5 |
| 값 리시버 | 123 | 25 | | `range` | 713 | 197 |

lazygit 도 같다 — `go func` 14곳/10파일, `select` 29곳/12파일, 포인터 리시버 3,233 대 값 61.

두 가지를 읽어야 한다. ① `if err != nil` 하나가 전체 `if` 의 **30%** 다. ② Go 가 유명한
이유인 동시성은 애플리케이션 코드에 **거의 없다**.

### 사용처 2,284곳이 큐에 뜻하는 것 (D154 · 02 §6.2)

순위 키는 ① 위상 깊이 ② 미지 수 ③ **사용처 수** ④ id 다.

1. **순위는 한 칸도 안 움직인다.** 셋째 키는 앞의 둘이 동점일 때만 일하고, `go/error-check`
   는 깊이 3 이라 깊이 0~2 의 22개가 전부 먼저 나온다. D154 가 「`site_count` 는 셋째 동점
   처리일 뿐」이라고 재고 넣은 판단이 Go 에서 극단값으로 확인된다.
2. **달라지는 것은 `bestSite` 다.** 후보가 2,284개면 미지 0인 자리가 거의 확실히 있어
   `error-check` 는 언제나 가장 쉬운 자리에서 첫 노출된다. 반대로 `go/channel-select`(11곳)는
   고를 것이 없어 미지가 4 이상이면 `best.unknown <= 3` 에 걸려 **영영 안 나온다**. 사용처
   수가 정하는 것은 순위가 아니라 **오늘 낼 수 있는가**다.
3. **카드가 서로 같아진다 — 이것이 진짜 문제다.** `if` 7,669개 중 2,284개(30%)가 err 검사라,
   `go/if-statement`·`go/comparison`·`go/nil`·`go/return-multi` 의 첫 노출이 높은 확률로 **같은
   세 줄**이 된다. `bestSite` 가 개념끼리 조율되지 않기 때문이다. 대책 둘 — ⓐ 정렬의 마지막
   동점 처리에 「이미 다른 개념의 첫 노출로 쓰인 줄인가」를 넣는다 ⓑ 넷의 쿼리에서 err
   블록을 형제 앵커로 빼고 `go/error-check` 가 전담한다. **결정이 필요하다.**
4. **구멍 지도가 덜 쓸모 있어진다.** `error-check` 는 316/429 파일에 있어 절대 구멍이 안
   된다. Go 리포의 구멍은 고루틴(19파일)·채널(19)·select(10)·제네릭(5)에 몰리는데 그것들은
   대개 **없어야 맞다**. 「AI 가 안 써 준 것」 패널이 Go 사용자에게 보여 줄 것이 적다.

---

## §0 0부 — 이 언어의 값과 식

축 여덟의 정의와 id 조각은 [`README.md`](./README.md) §8 에 있다. **여기는 Go 에서 어긋나는 자리만**
쓴다. 여덟 축이 전부 서고 어긋남 판은 따로 안 세웠다 — **8 / 12**(상한 §8). Go 의 어긋남 다섯이
전부 축 안에서 표현되기 때문이고, 표현이 안 되는 것이 나오면 그때 아홉째를 세운다.

**Go 값은 실행으로 확인한 것이 하나도 없다.** 이 기계에 툴체인이 없다(`which go` → not found,
2026-09-05). 아래 값은 명세로 계산하고 2의 보수·UTF-8 부분만 파이썬으로 교차 검산했다.
같은 날 Swift(6.3.3)와 C#(.NET 10.0.302)은 실행해 쟀다 — **세 문서의 근거 강도가 다르다.**

### §0.1 여덟 장

| # | id | name.ko / en | 한 줄 | `cs/` | 그림 | 초보가 실제로 틀리는 자리 |
|---|---|---|---|---|---|---|
| 0-1 | `go/integer-literal` | 정수 값과 그 폭 / Integer literal | 적힌 숫자는 **타입 없는 상수**이고, 이름에 담기는 순간 폭이 정해진다 | `bit-and-byte` · `integer-overflow` | 비트 배열 | **`int` 와 `int64` 를 같은 것으로 안다.** 64비트 빌드에서 크기는 같은데 **다른 타입**이라 `var a int; var b int64; a + b` 는 컴파일이 멈춘다 |
| 0-2 | `go/float-literal` | 실수 값과 근사 / Float literal | `float64` 는 2진수로 근사한 값이라 십진 소수를 정확히 못 담는다 | `floating-point` · `binary-representation` | 비트 배열 | **`float64` 를 `==` 로 견준다.** `0.1 + 0.2 == 0.3` 이 거짓인 것을 언어의 결함으로 읽는다 |
| 0-3 | `go/text-literal` | 글자 값 — 바이트와 rune / Text literal | `string` 은 **바이트열**이고 `len` 은 바이트를 센다. rune 단위로 도는 것은 `range` 뿐이다 | `text-encoding` | 값 상자 · **메모리 줄** | **`len("가나다")` 를 3 으로 안다.** 9 다. 그리고 `s[0]` 은 글자가 아니라 바이트 `234` 다 |
| 0-4 | `go/boolean-literal` | 참·거짓 값 / Boolean literal | 조건 자리에 `bool` 만 온다 — 「참 같은 값」이 이 언어에 **없다** | `type` · **`cs/truthiness` 없음** | 평가 트리 | **`if n {`** — 파이썬·JS 에서 되던 것이 컴파일에서 멈춘다 (§9 ③) |
| 0-5 | `go/operator-precedence` | 무엇이 먼저 묶이나 / Operator precedence | 이항 연산자가 **다섯 단**뿐이고, `<<` 가 `+` 보다 **위**에 있다 | **`cs/operator-precedence` 없음** (`type` 로 임시) | 평가 트리 | **`1 << 2 + 3` 을 32 로 읽는다.** Go 는 **7** 이다 — C·자바·C# 에서 온 손이 정확히 여기서 틀린다 |
| 0-6 | `go/type-conversion` | 타입은 손으로만 바꾼다 / Type conversion | **암묵 변환이 아예 없다.** 넓히는 변환조차 없고 `T(x)` 를 적어야 한다 | **`cs/type-conversion` 없음** · `static-vs-dynamic-typing` | 타입 변환 사다리 | **`var f float64 = 1` 은 되는데 `var n int = 1; var f float64 = n` 은 안 된다.** 리터럴은 타입 없는 상수라 되고 변수는 안 된다 — 같은 `1` 인데 답이 갈린다 |
| 0-7 | `go/assignment` | 이름에 값 넣기와 제로 값 / Assignment and the zero value | 선언하는 순간 **제로 값**이 들어간다 — 「아직 값이 없는 이름」이 이 언어에 없다 | `state` · `value-vs-reference` | 값 상자 · 메모리 줄 | **`var m map[string]int` 뒤 `m["a"] = 1` 이 터진다.** nil 맵은 읽기는 되고 쓰기는 죽는다 (§9 ②) |
| 0-8 | `go/equality` | 같은 값인가, 견줄 수는 있나 / Equality | 견줄 수 있는 타입이 정해져 있다 | `identity-vs-equality` · `value-vs-reference` | 평가 트리 | **슬라이스를 `==` 로 견준다.** 런타임 오류가 아니라 **컴파일이 멈춘다** — `== nil` 만 된다 |

**`cs/` 에 없는 것 셋이 이 표에 굵게 나온다** — `cs/operator-precedence` · `cs/type-conversion` ·
`cs/truthiness`. 셋 다 README §9 의 「없는 것」 표에 이미 올라 있다(I6). 규약 5 대로 이 문서는
새 `cs/` 를 만들지 않는다. **`cs/type-conversion` 이 없으면 0-6 의 타입 변환 사다리 그림이
「왜 이 계단은 저절로 오르고 저 계단은 손으로 올라야 하나」를 못 답한다** — Go 는 계단이 하나도
저절로 안 올라가는 언어라, 셋 중 이것이 Go 에서 가장 크게 빈다.

### §0.2 형식과 `universal` — 규약 4·6

| # | 형식 (I1) | `universal` |
|---|---|---|
| 0-1 | `bits` → `predict` | `common/number-literal` |
| 0-2 | `value` | `common/number-literal` |
| 0-3 | `table` | `common/text-literal` |
| 0-4 | `predict` | `common/boolean-value` |
| 0-5 | `step` | `common/arithmetic` |
| 0-6 | `build` | `common/type-cast`(신규 후보 · README §8) |
| 0-7 | `table` | `common/variable-binding` · `common/reassignment` |
| 0-8 | `predict` | `common/comparison` |

**여섯 형식이 전부 쓰인다** — 안 쓰는 것이 없다(규약 6). 그림 여섯 중 **스택 프레임만 안 쓴다**:
0부에는 함수가 아직 안 나오고(1부의 `go/func-declaration`), 프레임을 그릴 값이 없다.
`bits → predict` 는 순서다 — 비트로 먼저 보이고 그다음 「`int8` 127 에 1 을 더하면?」을 예측시킨다.

### §0.3 Go 라서 다른 다섯 자리

| 자리 | Go | 견줄 것 | 축 |
|---|---|---|---|
| **암묵 변환이 아예 없다** | `int` + `int64` 도, `int` + `float64` 도 컴파일이 멈춘다. 넓히는 변환조차 없다 | C# 는 `int` → `long` → `double` 을 자동으로 넓힌다. Swift 도 안 섞지만 **리터럴은 섞인다**(`1 + 2.0` = 3.0, 실측) | 0-6 |
| **`rune` 과 바이트** | `len` 은 바이트, `range` 만 rune. `s[0]`=바이트, `[]rune(s)[0]`=글자 | 같은 이모지 하나의 「길이」가 **Go 25 · C# 11 · Swift 1** 이다(셋 다 §0.4 표) | 0-3 |
| **제로 값** | 선언하는 순간 값이 들어간다. 「아직 값이 없는 이름」이 언어에 **없다** | C# 는 안 넣고 읽으면 컴파일 오류(CS0165). Swift 도 `var x: Int` 만 적고 읽으면 오류 | 0-7 |
| **`:=` 와 `var`** | 만드는 낱말이 둘이고 주는 것이 다르다 — `:=` 는 타입을 추론하고 `var` 는 타입을 적고 제로 값을 준다 | C# 는 하나(`int x = 0` 과 `var x = 0` 이 같은 문). Swift 는 `let`/`var` 로 **가변성**을 가른다 | 0-7 (0부) · `go/short-var-decl` (1부) |
| **정수 나눗셈** | `7 / 2` 는 **3**. 값이 아니라 **피연산자의 타입**이 정한다 | C# 도 2, Swift 도 3(실측). 파이썬만 2.5 — `common/arithmetic` 으로 전이 오는 사용자가 여기서 틀린다 | 0-1 · 0-5 |

마지막 줄이 D4 전이의 함정이다. **같은 `universal` 인데 답이 반대인 자리**라 「표기 차이 카드 먼저」
로는 안 덮인다 — 파이썬에서 3겹 쌓고 온 사용자가 1겹으로 시작해도 첫 답이 2.5 다. 대책은 0-1 의
`predict` 를 정수 나눗셈에 한 번 더 쓰는 것이고, **그렇게 할지는 I1 의 형식 설계가 정한다.**

### §0.4 값 — 계산한 것이지 실행한 것이 아니다

| 물음 | 값 | 어떻게 얻었나 |
|---|---:|---|
| `int8(127) + 1` | `-128` | 2의 보수, 파이썬 검산 |
| `int32(2147483647) + 1` | `-2147483648` | 같음 |
| `7 / 2` · `-7 / 2` · `-7 % 2` | `3` · `-3` · `-1` | 명세 — 정수 나눗셈은 0 쪽으로 버림 |
| `0.1 + 0.2` | `0.30000000000000004` | IEEE 754 binary64 — 언어와 무관, 파이썬 검산 |
| `len("가나다")` | `9` | UTF-8 3바이트 × 3, 파이썬 검산 |
| `utf8.RuneCountInString("가나다")` | `3` | 같음 |
| `"가나다"[0]` | `234` (`0xEA`) | U+AC00 의 UTF-8 첫 바이트 |
| `len("👨‍👩‍👧‍👦")` · rune 수 | `25` · `7` | 파이썬 검산 (ZWJ 넷 포함) |
| `1 << 2 + 3` | `7` | 명세 우선순위 표 — `<<` 는 5단, `+` 는 4단 |
| `unsafe.Sizeof(int(0))` | **못 쟀다** | 명세가 「32 또는 64」로만 정한다. 64비트 빌드에서 8이라고 믿지만 확인 안 했다 |

Go 의 우선순위 표가 **다섯 단뿐**인 것이 0부에서 값을 한다 — C 는 15단이라 표를 외우는 것이 과제가
되는데 Go 는 다섯 줄이라 **평가 트리 그림 한 장에 표 전체가 들어간다.** 다만 그 다섯 줄이 C 와
어긋나는 자리가 하나 있고(`<<`), 그것이 위 표의 `1 << 2 + 3` 이다.

### §0.5 0부 → 1부 → 2부 — 겹침 정리

**겹치는 쪽은 0부가 가져가고 §2·§3 에서 뺀다.** 경계는 하나다 — **값 하나를 만들고·보고·견주는
것까지가 0부**, 이름이 여러 줄에 걸쳐 사는 규칙(재선언·가리기)과 흐름을 나누는 문은 1부다.

| 0부 장 | 어디에 있었나 | 부기 |
|---|---|---|
| `go/boolean-literal` | §2 ③ | **id 가 같다** — 자리만 올라간다 |
| `go/equality` | §2 ④ `go/comparison` | `if-statement`·`for-loop` 의 prereq 를 `go/equality` 로 다시 건다 |
| `go/assignment` | §3 ⑨ `go/assignment` + §2 ② `go/var-zero-value` | 둘을 한 장으로 묶는다. **`go/short-var-decl`(§2 ①)은 1부에 남는다** — 재선언·가리기는 스코프 규칙이지 값이 아니다 |
| `go/operator-precedence` | §3 ⑩ `go/arithmetic` | |
| `go/integer-literal` | §3 ⑪ `go/number-literal` 의 전반부 | 「타입 없는 상수」가 이 장으로 온다 |
| `go/text-literal` | §3 ⑫ `go/string-literal` | `fmt.Sprintf` 이야기는 `go/call-expression`(§3 ⑬)이 받는다 |
| `go/float-literal` | **없었다** | 신규 |
| `go/type-conversion` | **없었다** | 신규 |

새로 서는 둘이 요점이다. **지금 계획에 정수의 폭도 실수의 근사도 형 변환도 장이 없었다** —
§7 이 `cs/integer-width`·`cs/floating-point` 로 밀어 뒀는데 `cs/` 는 쿼리가 없어 스스로 안 뜨고
언어 개념이 `prereq` 로 걸어야 산다(cs.md §8). **걸 데가 없었다.**

| 부 | 무엇 | 장 | 교재 |
|---|---|---:|---|
| **0부 값과 식** | 위 여덟 | **8** | 사전 `examples[]` (§0.7) |
| **1부 바닥** | `short-var-decl` · `if-statement` · `for-loop` · `func-declaration` · `return-multi` | **5** | 합성 + 내 코드 짚기 |
| **2부 Go 의 값** | §3 중심 남은 열둘 + §4 심화 여덟 | **20** | 합성 + 내 코드 |
| **3부 프레임워크** | **없다 — 네임스페이스 후보가 없다** | **0** | — |

3부가 0판인 이유는 자바에서 이미 본 자리다 — 스프링이 아닌 자바 리포에서 `spring/` 이 로드되지
않아 3부가 0판이 되는 것과 같다(java.md §2). Go 에는 `spring/` 에 해당하는 네임스페이스가 아직
없고, `net/http`·chi·gin 중 무엇을 덮을지가 결정거리다. **정본 §5 의 티어 B 에 Go 가 한 줄도 없다는
뜻이고**, 코스는 2부 끝에서 곧장 기능 챕터로 넘어간다.

**0장 적재량 22 → 24 / 24.** 0부 여덟은 전부 깊이 ≤ 2 이고, 여섯은 원래도 깊이 ≤ 2 였으므로
순증은 새로 선 둘(`float-literal`·`type-conversion`)이다. **상한에 정확히 붙되 안 넘긴다** —
Swift(25 → 29)와 C#(24 → 26)은 넘긴다. 셋 중 Go 만 안 넘기는 이유는 §3 에서 넷을 0부로 올려
`essential` 총수가 24 → 25 로만 늘기 때문이다.

### §0.6 판 수와 일수

정본 §2 — 하루 15분, 새 판 2장(D12). 판 수는 개념 수와 1:1 로 잡았다(java.md §2 와 같은 셈).

| 부 | 판 | 일 |
|---|---:|---:|
| 0부 | 8 | **4** |
| 1부 | 5 | 3 |
| 2부 | 20 | 10 |
| 3부 | 0 | 0 |
| **합** | **33** | **17** |

**17일은 하한이다.** 만기 재검이 먼저 예산을 먹으므로(정본 §2) 실제 달력은 더 길고, 얼마나
길어지는지는 **안 쟀다.**

### §0.7 문법 현황 — **셋 중 Go 만 오늘 파싱된다**

| 자리 | Go | Swift | C# |
|---|---|---|---|
| `crates/parse` 문법 | ✅ `lang-go` **기본 켜짐**, abi 14 | ❌ 크레이트 없음 | ❌ 크레이트 없음 |
| `grammarSchema` | ✅ `go` | ✅ `swift` | ✅ `c_sharp` |
| `grammarOf` | ✅ `.go` | ✅ `.swift` | ✅ `.cs` |
| 사전을 쓰면 | **캡처가 난다** | **로드는 통과하고 캡처 0** | 같음 |

**「스키마에 있으니 열려 있다」가 아니다.** `grammarSchema`(`schema.ts:29-32`)는 파서에 안 붙은
문법도 받아 주므로, `dictionary/swift/_lang.yaml` 에 `grammars: [swift]` 를 적으면 스키마도 린트도
통과하고 **캡처만 0곳**이 된다(I6 확인). Go 에는 그 함정이 없다 — `langs.rs:26` 에 실제로 등록돼 있다.

**Go 에서 막는 것은 `.scm` 과 YAML 뿐이다.** 시스템 쿼리 둘이 필요하다 — `_imports.scm` ·
`_blocks.scm`(메서드는 이름 필드가 `field_identifier` 라 한 줄로 못 쓴다 · §8). T2 배선은 이미
서 있다(`resolveGo`·`goLeadFiles` — `resolve-imports.ts:269`).

**0부가 문법 없이 서는가 — 반만 그렇다.** 0부 판은 사전의 `examples[]` 로 카드를 굽고 파싱을
안 한다(`packages/cards/src/t0-synthetic.ts`, `SYNTHETIC_SITE_ID = -1`). 그런데 그 파일의 두 문이
**둘 다 「내 코드」 쪽 인자를 요구한다** — `makeSyntheticCard` 는 `previewSiteId`(「곧 여기서
봅니다」로 예고할 실제 사용처)가 **필수**이고, `makeAbsentCard` 는 `AbsenceReason`(framework ·
library · scale · idiom)이 필수다. 문법이 없으면 앞의 것을 못 만들고, 뒤의 것을 쓰면 **「네 코드엔
없다」와 「우리가 못 읽는다」가 섞여** D137 이 막으려던 자리로 되돌아간다. **문법 없이 0부를 세우려면
세 번째 문이 필요하고 오늘 그것은 없다** — Go 는 이 문단이 여유이고 Swift·C# 에서는 코스가
서느냐 마느냐다(swift.md §0.7 · csharp.md §0.7 의 순서표).

형식 여섯 중 채점에 파서를 쓰는 것은 `build` 하나다. 나머지 다섯은 답이 값이라 파서가 필요 없고,
`build` 도 문법이 없으면 정규식 정규화 폴백으로 떨어진다(정본 §5).

**표본이 없다는 것의 값 — 티어 한 줄.** Go 는 셋 중 형편이 가장 낫다. **A(모든 리포)는 선다** —
어휘 33장이 공개 리포 둘(`cli/cli` 87,875줄 · `lazygit` 115,321줄)의 실측 위에 서고 `cs/` 간선
열하나가 붙는다(§7). **B(덮은 스택만)는 한 줄도 없다** — 라우팅 규칙이 없어 기능 폐포가 안 나오고
실행 러너도 없다(§0.4 가 Go 값을 하나도 실행으로 못 잰 것과 같은 원인이다). **C** 는 설계 의도 그대로.
다만 **사용자 리포에 `.go` 가 0개**라는 사실은 남는다 — 위 실측은 남의 리포이고, 「내가 만든 코드가
교재」(정본 §1)는 사용자가 Go 리포를 가져올 때 비로소 성립한다. 그때까지 0·1부는 온전히 서고
2부의 「네 리포의 여기가 그것이다」 절반이 빈다.

---

## §2 기초 — 바닥 여덟 → **1부 바닥 다섯** (0부가 셋을 가져갔다)

여덟 중 넷(`if`·`for`·`func`·`return`)이 문(statement) 수준이다. **그 「문 수준」이 0부를 붙인 뒤의
경계선이 됐다** — 값 층위인 ②·③·④(`var-zero-value`·`boolean-literal`·`comparison`)는 §0.5 대로
0부로 올라가고 여기 남는 것은 다섯이다. 아래 표는 여덟 그대로 두되 올라간 셋에 **↑0부**를 붙였다.

| # | id | name.ko / en | token | universal | diff | prereq | **Go 라서 다른 것** |
|---|---|---|---|---|---|---|---|
| 1 | `go/short-var-decl` | 이름 만들며 값 넣기 / Short variable declaration | `:=` | `common/variable-binding` | 1 | — | 같은 블록에 이름이 이미 있고 왼쪽에 새 이름이 하나라도 있으면 **새로 만들지 않고 값만 넣는다**. 안쪽 블록이면 반대로 바깥을 **가린다** |
| 2 ↑0부 | `go/var-zero-value` | 타입만 적고 이름 만들기 / Declaration by type → 0부에서 `go/assignment` 와 한 장 | `var` | `null` | 1 | — | `var n int` 은 비어 있지 않다. 선언하는 순간 **제로 값**이 들어간다 — 「아직 값이 없는 이름」이 이 언어에 없다 |
| 3 ↑0부 | `go/boolean-literal` | 참·거짓 값 / Boolean literal (0부에서 **id 그대로**) | `true` | `common/boolean-value` | 1 | — | 조건 자리에 `bool` 만 온다. `if n {` 는 파이썬·JS 에선 되고 Go 에선 **컴파일이 멈춘다** |
| 4 ↑0부 | `go/comparison` | 두 값 견주기 / Comparison → 0부에서 `go/equality` | `==` | `common/comparison` | 1 | 3 | 슬라이스·맵·함수는 `==` 로 **못 견준다**(`== nil` 만 된다) |
| 5 | `go/if-statement` | 조건으로 흐름 나누기 / If statement | `if` | `common/conditional-branch` | 1 | 4 | 조건에 괄호가 없고 중괄호는 필수다. **여는 중괄호가 같은 줄에 있어야 한다** — 내리면 다른 프로그램이 된다(§8) |
| 6 | `go/for-loop` | 되풀이하기 / Looping | `for` | `common/loop-while` | 2 | 1, 4 | 반복 낱말이 **하나뿐**이다. `while` 이 없어 `for cond {}` 가 while 이고 `for {}` 가 무한 반복이다 |
| 7 | `go/func-declaration` | 함수 정의하기 / Function declaration | `func` | `common/function-definition` | 1 | — | **타입이 이름 뒤**에 오고 반환 타입은 괄호 뒤에 온다. `func f(a, b int)` 은 인자 둘이 타입 하나를 나눠 쓴 것이다 |
| 8 | `go/return-multi` | 값 여럿 돌려주기 / Returning several values | `return` | `common/return-value` | 2 | 7 | 값을 **둘 이상** 돌려준다. 마지막이 `error` 라 `return v, nil` 과 `return 0, err` 이 짝이다 |

`go/arithmetic` 을 뺐다. Go 의 산술 차이(`7/2 == 3`)는 산술이 아니라 **타입 체계**의 사실이고,
`common/arithmetic` 으로 TS·파이썬에서 전이(D4)된다. 여덟 자리는 **전이할 데가 없는 것**에
쓰는 편이 낫다 — `go/var-zero-value` 가 그것이다.

**0부가 이 판단을 반쯤 뒤집는다.** 「산술이 아니라 타입 체계의 사실」이 맞고, 그래서 그 사실을
가르칠 자리가 §2 가 아니라 **0부의 `go/integer-literal`·`go/operator-precedence`** 다. `common/arithmetic`
으로 전이 오는 파이썬 사용자가 `7 / 2` 에서 틀리는 것은 D4 의 「표기 차이」가 아니라 **답이 반대**인
자리라, 1겹으로 시작시키는 것만으로는 안 덮인다(§0.3 마지막 문단).

---

## §3 중심 — 16개 → **2부 열둘** (0부가 넷을 가져갔다)

⑨ `assignment` · ⑩ `arithmetic` · ⑪ `number-literal` · ⑫ `string-literal` 넷이 0부로 올라간다(§0.5).
여기 남는 것은 열둘이고, §4 심화 여덟과 합쳐 **2부 스물**이 된다.

| # | id | name.ko / en | token | universal | diff | prereq | **없으면 왜 못 읽나** |
|---|---|---|---|---|---|---|---|
| 9 ↑0부 | `go/assignment` | 이름에 값 다시 넣기 / Assignment → 0부에서 `go/var-zero-value` 와 한 장 | `=` | `common/reassignment` | 1 | 1 | `=` 는 **있는 이름에만** 쓴다. 없는 이름에 `=` 해도, 다 있는 이름에 `:=` 해도 멈춘다. 파이썬은 이 구별이 아예 없고(D152 ⓐ) Go 는 토큰 둘로 갈랐다 — 같은 축의 정반대 답 |
| 10 ↑0부 | `go/arithmetic` | 셈하기 / Arithmetic → 0부에서 `go/operator-precedence` | `+` | `common/arithmetic` | 1 | 11 | 정수끼리 나누면 **정수**가 나온다(`7/2 == 3`). 파이썬 「딱 떨어져도 소수」의 거울 |
| 11 ↑0부 | `go/number-literal` | 숫자 값 / Number literal → 0부에서 `go/integer-literal`(+ 형 변환은 `go/type-conversion`) | `1` | `common/number-literal` | 1 | — | 적힌 숫자는 **타입 없는 상수**라 `var f float64 = 1` 이 되는데, `int` 변수를 넣으면 안 된다 |
| 12 ↑0부 | `go/string-literal` | 글자 값 / Text literal → 0부에서 `go/text-literal` | `"…"` | `common/text-literal` | 1 | — | 끼워 넣기 문법이 없다. 값이 든 문장은 전부 `fmt.Sprintf` 라는 **함수 호출**이다 |
| 13 | `go/call-expression` | 함수 부르기 / Calling a function | `f()` | `common/function-call` | 1 | 7 | 인자는 **언제나 값 복사**다. 바꾸려면 포인터를 명시적으로 넘긴다 |
| 14 | `go/selector` | 점 찍어 꺼내기 / Selector | `.` | `common/member-access` | 1 | 15, 13 | 같은 점이 **패키지**(`fmt.Println`)에도 **필드**(`x.Name`)에도 쓰인다. `->` 가 없어 포인터여도 점이다 |
| 15 | `go/struct-type` | 칸에 이름 붙여 묶기 / Struct type | `struct` | `null` | 2 | 2 | 구조체는 **값**이다. 대입하면 통째로 복사되고 함수에 넘겨도 복사본이 간다 |
| 16 | `go/slice` | 순서 있는 목록 / Slice | `[]T` | `common/list` | 2 | 2, 11 | 목록이 아니라 **뒷배열을 보는 창**이다. `s[1:3]` 은 복사가 아니라 같은 배열의 다른 창이다 |
| 17 | `go/append` | 목록 뒤에 붙이기 / Append | `append` | `null` | 2 | 16 | **반환값을 다시 담지 않으면 아무 일도 안 난다.** 담더라도 용량이 남으면 원본을 고치고 모자라면 새 배열이 생긴다 |
| 18 | `go/map-type` | 열쇠로 값 찾기 / Map | `map[K]V` | `null` | 2 | 2, 12 | 없는 열쇠를 읽으면 오류가 아니라 **제로 값**이다. 있었는지는 `v, ok := m[k]` 로만 안다. nil 맵은 읽기는 되고 쓰기는 터진다 |
| 19 | `go/range-loop` | 하나씩 훑기 / Range loop | `range` | `common/iterate` | 2 | 6, 16 | 맵을 훑으면 **순서가 매번 다를 수 있다**(명세). 값 변수는 **복사본**이라 고쳐도 원본이 안 바뀐다 |
| 20 | `go/nil` | 값이 없음 / Nil | `nil` | `common/absent-value` | 2 | 2, 21 | `nil` 이 여섯 가지다 — 포인터·슬라이스·맵·채널·함수·인터페이스. nil 슬라이스는 `append` 가 되고 nil 맵은 쓰기가 터진다 |
| 21 | `go/pointer` | 값 있는 자리 가리키기 / Pointer | `*` `&` | `null` | 2 | 2 | 값 복사가 기본이라, 바꾸거나 큰 것을 안 베끼려면 **주소를 명시적으로** 넘긴다. 산술은 못 한다 |
| 22 | `go/method-receiver` | 타입에 함수 붙이기 / Method with a receiver | `func (r T)` | `null` | 2 | 7, 15, 21 | 이름 앞에 **받는 값**을 하나 더 적은 함수다. 값 리시버는 복사본, 포인터 리시버는 원본. 실코드는 포인터가 83%(cli)~98%(lazygit) |
| 23 | `go/func-literal` | 값으로서의 함수 / Function literal | `func(){}` | `common/function-value` | 2 | 7 | 이름 없는 함수가 값이다. `http.HandlerFunc` 과 `go func()` 이 전부 이 위에 선다 |
| 24 | `go/error-check` | 실패를 값으로 받아 확인하기 / Checking the returned error | `if err != nil` | `null` | 2 | 5, 8, 20 | **예외가 없다.** 실패는 던져지지 않고 마지막 반환값으로 온다. 안 보고 지나가도 컴파일이 안 멈춘다 — 가장 흔한 세 줄이자 가장 조용한 함정 |

---

## §4 심화 — 8개, 그리고 이 절이 비어 있을 위험

Go 가 작은 언어라 심화가 얇다는 예상은 반만 맞다. 문법으로 셀 때 얇은 것은 맞다. 그런데 그
자리를 흔히 채우는 것(고루틴·채널·select)이 §1 실측대로 실제 코드에 **거의 없다**. 사용처가
0이면 카드가 안 구워지므로, 심화를 동시성으로 채우면 대부분의 사용자에게 §4 는 **선언만 되고
비어 있는 절**이 된다.

그래서 §4 를 **코드에 낱말로 안 적히는 것**으로 채운다. 암묵 구현·대문자 가시성·nil
인터페이스는 파일마다 있는데 눈에 안 보인다.

| # | id | name.ko / en | token | universal | diff | prereq | **Go 라서 다른 것** | 밀도(cli) |
|---|---|---|---|---|---|---|---|---|
| 25 | `go/defer` | 나중에 할 일 미뤄 두기 / Defer | `defer` | `null` | 3 | 13, 7 | **인자는 지금 계산되어 저장된다.** 호출만 함수 끝으로 미뤄지고, 여럿이면 **역순**이다 | 191 / 99파일 |
| 26 | `go/package-visibility` | 첫 글자로 공개 정하기 / Exported names | `Name` | `null` | 3 | 7, 15 | `public`·`private` 낱말이 없다. **첫 글자가 대문자인가**가 패키지 밖에서 보이는지를 정한다 | 전 파일 |
| 27 | `go/interface-implicit` | 적지 않고 만족하기 / Implicit interfaces | `interface` | `null` | 3 | 22, 15 | `implements` 를 **어디에도 안 적는다**. 어떤 타입이 어떤 인터페이스를 만족하는지 파일을 봐서는 모른다 | 선언 92 / 69파일 |
| 28 | `go/nil-interface` | 비었는데 비지 않은 것 / The non-nil nil interface | `!= nil` | `null` | 4 | 27, 20, 21 | 인터페이스는 (타입, 값) **둘**이다. nil 포인터를 담으면 값은 nil 인데 타입이 남아 `!= nil` 이 참이 된다 | 쿼리로 못 잡음(§10) |
| 29 | `go/error-wrap` | 실패를 감싸 올려보내기 / Wrapping errors | `%w` | `null` | 4 | 24, 12 | `%w` 로 감싼 것만 `errors.Is`·`errors.As` 가 벗겨 낸다. `%v` 로 감싸면 문장은 같은데 **안이 사라진다** | `%w` 486 · `Is` 60 · `As` 80 |
| 30 | `go/goroutine` | 기다리지 않고 띄우기 / Goroutine | `go` | `null` | 3 | 23, 13 | `go f()` 는 곧바로 다음 줄로 간다. `main` 이 끝나면 남은 고루틴은 **결과 없이 죽는다** | **29 / 19파일** |
| 31 | `go/channel-select` | 채널로 주고받기 / Channels and select | `chan` `select` | `null` | 4 | 30, 2 | 채널에 **방향**이 있다(`chan<-` · `<-chan`). nil 채널에서 받으면 영원히 멈춘다 | **`chan` 29 · `select` 11** |
| 32 | `go/generics` | 타입 자리 비워 두기 / Type parameters | `[T any]` | `common/generics` | 4 | 7, 16 | 1.18 에서야 들어와 아직 얇다. **메서드에는 못 붙인다** — 함수와 타입에만 온다 | **10 / 5파일** |

### 32개인데 왜 안 줄었나

| | TS | py(설계) | go |
|---|---:|---:|---:|
| 개념 수 | 36 | 28 | **32** |
| `common/` 재사용 | — | 21 | **18 / 30 (60%)** |

Go 키워드는 25개로 셋 중 가장 적은데 개념 수는 안 줄었다. 세는 단위가 「낱말이 몇 개인가」가
아니라 **「무엇을 모르면 이 줄을 못 읽나」**여서다.

- **TS 36개 중 15개(42%)가 Go 에 대응물이 없다** — 배열/객체 구조 분해 · 스프레드 · 삼항 ·
  `?.` · `??` · `||` 기본값 · `&&` 가드 · 템플릿 리터럴 · `try/catch` · `.then` · `async/await` ·
  `.map` · `.filter` · 메서드 체인.
- 그 자리에 **TS 에 이름이 없는 14개**가 들어온다 — 제로 값 · 포인터 · 메서드 리시버 ·
  구조체 · 맵 · `append` 의 두 얼굴 · `defer` · 대문자 가시성 · 다중 반환 · 오류 값 검사 ·
  오류 감싸기 · 암묵 구현 · nil 인터페이스 · 고루틴/채널.

「작다」는 **쓰는 방법의 가짓수**에서 참이고 **읽을 때 알아야 하는 것의 수**에서는 거짓이다.

**뺀 것과 이유** — `go/switch`(다른 것이 「`break` 없이도 안 흘러내린다」 하나뿐이라 §9 로
보냈다) · `go/type-conversion`(`go/number-literal` 의 2겹) · `go/type-switch`·
`go/type-assertion`(인터페이스 없이는 뜻이 없어 27의 3겹) · `go/context`(242곳/28파일이지만
배우는 것이 문법이 아니라 규약이다) · `go/embedding`·`go/variadic`·`go/const-iota`·
`go/struct-tag`(사용처가 얇다) · `go/method-set`·`go/slice-aliasing`(각각 22·17 의 **깊은
겹**이지 다른 개념이 아니다 — 잉크 겹 0~4 가 이미 그 층을 낸다).

---

## §5 prereq 그래프와 0장 적재량

아래는 32개 전체의 깊이다. `essential` 후보는 §2 여덟 + §3 열여섯 = **24개**(§4 는 안 넣는다).

| 깊이 | 개수 | 개념 |
|---:|---:|---|
| 0 | 6 | `boolean-literal` · `func-declaration` · `number-literal` · `short-var-decl` · `string-literal` · `var-zero-value` |
| 1 | 10 | `arithmetic` · `assignment` · `call-expression` · `comparison` · `func-literal` · `map-type` · `pointer` · `return-multi` · `slice` · `struct-type` |
| 2 | 10 | `append` · `defer`\* · `for-loop` · `generics`\* · `goroutine`\* · `if-statement` · `method-receiver` · `nil` · `package-visibility`\* · `selector` |
| 3 | 4 | `channel-select`\* · `error-check` · `interface-implicit`\* · `range-loop` |
| 4 | 2 | `error-wrap`\* · `nil-interface`\* |

\* 는 §4 라 `essential` 밖. 사이클은 없다.

**0장 적재량 = 22 / 24.** (**0부를 붙이면 24 / 24 로 상한에 붙는다** — 셈은 §0.5 마지막 문단.)
TS 21/24 · 파이썬 19/24 보다 높다. 뿌리가 6개로 넓고 사슬이 짧기
때문이다 — Go 에는 옵셔널 체이닝 → 널 병합 → 삼항 같은 **표기가 표기를 요구하는 사슬**이
없어 `if` 의 선행은 `comparison` 하나에서 끝난다.

밀려나는 둘이 문제다. **`go/error-check`(깊이 3)와 `go/range-loop`(깊이 3)** — Go 에서 가장
흔한 두 줄이 프롤로그에 못 들어간다. `error-check` 는 `if`·`return-multi`·`nil` 셋을, `range`
는 `for`·`slice` 를 요구해서다. 규칙이 옳게 도는 결과지만 「가장 자주 보는 줄을 가장 늦게
배운다」가 되므로, 0장 22장 뒤 첫 정규 판이 `error-check` 가 되는지는 실측으로 확인해야 한다.

`go/goroutine` 은 깊이 2 다(선행이 「함수를 값으로 두기」와 「부르기」뿐). `essential` 밖이라
0장에는 안 들어간다 — 어려운 부분이 문법이 아니라 `cs/concurrency-model` 이라 §7 로 보냈다.

---

## §6 `common/` 재사용 대 신규

### 재사용 — 18 / 30 (60%)

| go 개념 → universal | go 개념 → universal | go 개념 → universal |
|---|---|---|
| `short-var-decl` → `variable-binding` | `assignment` → `reassignment` | `boolean-literal` → `boolean-value` |
| `comparison` → `comparison` | `if-statement` → `conditional-branch` | `for-loop` → `loop-while` |
| `func-declaration` → `function-definition` | `return-multi` → `return-value` | `arithmetic` → `arithmetic` |
| `number-literal` → `number-literal` | `string-literal` → `text-literal` | `call-expression` → `function-call` |
| `selector` → `member-access` | `slice` → `list` | `range-loop` → `iterate` |
| `nil` → `absent-value` | `func-literal` → `function-value` | `generics` → `generics` |

파이썬 21개에서 **18개로 내려간다.** 남은 12개 중 11개가 TS·JS 모양이라 Go 에 대응물이 없다
(`async-await` · `promise-chain` · `optional-chaining` · `nullish-default` ·
`conditional-expression` · `copy-with-changes` · `destructuring` · `filter-select` ·
`map-transform` · `string-interpolation` · `try-catch`). D148 의 「두 번째 언어부터 싸진다」는
**두 번째까지만** 확인된 문장이다. 재사용률은 그 언어가 앞의 둘과 얼마나 가까운가에 달렸고
Go 는 멀다.

### 쓰지 않는 것 하나 — `common/mutating-append`

`go/append` 를 여기 붙이지 **않는다**. 그 보편 개념의 한 줄은 「원본이 바뀐다. 새 묶음은
생기지 않는다」인데 Go 에서는 **둘 다 일어난다** — 용량이 남으면 원본 배열을 고치고 모자라면
새 배열이 생긴다. TS `array-push-mutate` 에서 3겹 쌓은 사용자가 D4 로 1겹을 물려받으면 **틀린
실행 모델을 물려받는다**. `universal: null` 로 두고 `go/append` 가 「어느 쪽인지는 용량이
정한다」를 직접 가르친다. (플랜 `chickadee-v06-learning-order` `{#a-state}` 의 `mutating-append`
↔ `map-transform` 축에 Go 가 **세 번째 경우**를 더한다.)

### 신규 제안 셋

| 후보 | 한 줄 | 다른 언어 근거 | 판정 |
|---|---|---|---|
| `common/key-value-map` | 열쇠로 값을 찾는 묶음. 순서는 보장되지 않는다 | Python `dict` · TS `Map`/객체 · Rust `HashMap` · Swift `Dictionary` · Dart `Map` — **다섯** | **채택 권고.** `common/list` 만 있고 맵이 없는 것이 지금 사전의 구멍 |
| `common/record-type` | 이름 붙은 칸 여럿을 값 하나로 묶는다 | Rust · Swift `struct` · Dart `class` · TS `interface` — **넷** | **채택 권고.** `go/struct-type` 이 붙는다 |
| `common/error-as-value` | 실패가 던져지지 않고 **반환값**으로 온다 | Rust `Result`+`?` — **하나뿐**. Swift `Result` 는 있으나 주된 길이 `throws` | **보류.** 「최소 2개」를 못 넘는다. Rust 사전이 실제로 들어올 때 다시 올린다 |

### `universal: null` (14개)

`var-zero-value` · `struct-type`\*\* · `append` · `map-type`\*\* · `pointer` · `method-receiver` ·
`error-check` · `defer` · `package-visibility` · `interface-implicit` · `nil-interface` ·
`error-wrap` · `goroutine` · `channel-select`. (\*\* 위 신규가 서면 옮긴다.)

### `alternatives` — 「AI 가 대신 쓴 것」

| 구멍 | 대신 쓴 표기 | 부기 |
|---|---|---|
| `go/range-loop` | `for i := 0; i < len(xs); i++` | 같은 일을 옛 표기로 |
| `go/error-wrap` | `fmt.Errorf("…: %v", err)` | 감쌌는데 `errors.Is` 가 못 벗긴다 |
| `go/error-check` | `v, _ := f()` | 실패를 **버리는** 자리 |
| `go/channel-select` | `sync.Mutex` · `WaitGroup` | 공유로 풀었다 (cli: `sync.` 82 대 `select` 11) |

---

## §7 `cs/` 로 밀어낼 것

Go 는 이 목록이 다른 언어보다 **길다**. 실행 모델을 문법 뒤에 숨기지 않는 언어라, 문법을 다
알아도 기계를 모르면 못 읽는 줄이 남는다.

| cs id | 한 줄 정의 | 이것이 필요로 한다 |
|---|---|---|
| `cs/value-and-reference` | 값을 넘기면 복사되고 주소를 넘기면 같은 것을 본다 | `call-expression` · `pointer` · `method-receiver` · `struct-type` |
| `cs/stack-and-heap` | 함수가 끝나면 사라지는 자리와 남는 자리 | `pointer` · `func-literal` · `goroutine` |
| `cs/contiguous-array` | 값이 메모리에 줄지어 놓이고 길이와 **용량**이 다르다 | `slice` · `append` |
| `cs/integer-width` | 정수에 폭이 있고 넘치면 돌아간다. 나누기는 버림이다 | `number-literal` · `arithmetic` |
| `cs/floating-point` | 소수는 2진수로 근사돼 `==` 로 견주면 어긋난다 | `arithmetic` · `comparison` |
| `cs/text-encoding` | 글자는 바이트가 아니다. UTF-8 은 글자 하나가 여러 바이트다 | `string-literal` · `range-loop` |
| `cs/hashing-unordered` | 해시로 찾는 자료구조는 순서를 안 지킨다 | `map-type` · `range-loop` |
| `cs/compile-and-link` | 소스가 실행 파일 하나로 묶이고 그 경계가 패키지다 | `package-visibility` |
| `cs/dynamic-dispatch` | 어떤 코드가 돌지 실행 때 정해지고, 그러려면 값 옆에 타입이 따라다닌다 | `interface-implicit` · `nil-interface` |
| `cs/concurrency-model` | 공유 메모리로 나누는 방식과 메시지로 나누는 방식 | `goroutine` · `channel-select` |
| `cs/data-race` | 두 흐름이 같은 자리를 동시에 만지면 결과가 정해지지 않는다 | `goroutine` |

`cs/dynamic-dispatch` 가 없으면 `go/nil-interface` 는 **설명이 불가능하다** — 「인터페이스는
(타입, 값) 둘이다」가 그 개념의 전부이고 그건 문법이 아니다. Go 에서 `cs/` 는 있으면 좋은
것이 아니라 **없으면 §4 의 절반이 안 서는** 것이다.

---

## §8 tree-sitter 현실

| 항목 | 값 | 근거 |
|---|---|---|
| `grammars` | `[go]` | `crates/parse/src/langs.rs:26` 에 **이미 등록돼 있다** |
| 크레이트 | `tree-sitter-go = "0.23"` (해석 0.23.4) | `crates/parse/Cargo.toml:18`. 기본 피처 `lang-go` **켜져 있다** |
| **`grammar_abi`** | **14** | `parser.c` 의 `LANGUAGE_VERSION 14`(0.23.1~0.23.4 전부). 직접 빌드해 `abi_version()=14`·`node_kind_count()=219` 확인 |
| `grammar_version` | `14-219` | `langs.rs:57` 형식 |
| `extensions` | `go: [.go]` | |

**틀리기 쉬운 자리.** `tree-sitter-go` 의 GitHub `master` 는 v0.25.8 로 재생성돼 **15** 다.
저장소를 보고 15 를 적으면 실제로 쓰는 0.23 계열과 조용히 어긋난다. 파이썬 14 · TS 15 에서
유추해도 틀린다 — TS 의 15 는 `grammars` 에 든 `javascript`(**0.25**) 때문이고
`typescript`/`tsx` 자체는 14 다. 값을 정하는 것은 언어가 아니라 **고정한 크레이트 버전**이다.

**T2 는 이미 서 있다.** `resolveGo`·`goLeadFiles`(`resolve-imports.ts:269`)가 `go.mod` 모듈
경로로 리포 안 import 를 가른다. 파이썬 때와 같아 **막는 것은 `.scm` 뿐**이다. 시스템 쿼리
둘이 필요하다 — `_imports.scm`(`import_spec` 의 문자열과 별칭) · `_blocks.scm`
(`function_declaration` 과 `method_declaration`. 메서드는 이름 필드가 `identifier` 가 아니라
**`field_identifier`** 라 한 줄로 못 쓴다).

### 파싱 함정 — 실측

**① 세미콜론 자동 삽입이 ERROR 없이 다른 프로그램을 만든다.** 명세의 규칙은 두 줄이다 — 줄의
마지막 토큰이 식별자·리터럴·`break`/`continue`/`fallthrough`/`return`·`++`/`--`/`)`/`]`/`}`
이면 뒤에 세미콜론이 들어간다. 직접 파싱한 결과:

```go
func k() *int
{               // 여는 중괄호를 다음 줄로 내렸다
	return nil
}
```

→ `function_declaration`(**body 없음**) + 옆에 떠 있는 `block`. **ERROR 노드 0개.** `return`
다음 줄에 값을 쓴 것도 같다(`return_statement` 빈 것 + `expression_statement`). Go 컴파일러는
둘 다 거부하는데 우리 `parse_quality` 는 `ok` 를 낸다 — **ERROR 비율만으로 Go 파일의 건강을
못 잰다.**

**② 이름이 묶여 있는 노드 — 파이썬 연쇄 비교(D152)의 Go 판.** `func f(a, b int)` 은
`parameter_declaration` **한 노드**에 `identifier` 가 둘이다. 순진하게 잡으면 사용처 하나가
둘로 늘어난다. 같은 모양이 `var_spec`(`var a, b int`) · `expression_list`(`x, y := 1, 2`) ·
`field_declaration`(`A, B int`) 에 있다. 파이썬이 「자식이 정확히 둘」로 잘라냈듯 Go 는 **「이름이
정확히 하나」**를 형제 앵커로 요구해야 한다.

**③ `selector_expression` 이 패키지와 필드를 못 가른다.** `fmt.Println` 과 `x.Name` 이 같은
노드다. AST 만으로는 불가능하고 `_imports.scm` 이 낸 패키지 이름 집합과 대조해야 한다 —
**추정이며 그런 대조를 넣을 자리가 지금 쿼리 층에 있는지 확인하지 못했다.** 못 가르면
`go/selector` 사용처가 부풀고 `go/package-visibility` 쿼리도 흔들린다.

**④ `short_var_declaration` 이 「만들기」와 「재선언」을 구분하지 않는다.** 명세의 재선언 규칙은
스코프 해석이라 문법이 모른다. 파이썬 `assignment`(D152 ⓐ)와 같은 자리인데 **원인이 반대다** —
파이썬은 가르는 낱말이 **없어서**, Go 는 낱말이 **있는데 그 낱말이 두 일을 해서** 같아 보인다.

**⑤ 복합 리터럴 모호성 — 위험 낮음.** `if x == T{} {` 는 ERROR 를 낸다(실측). Go 컴파일러도
거부하므로 실코드엔 괄호가 붙어 있고, 붙으면 정상 파싱된다. **⑥ 제네릭 `type T[P *C]`** 는
명세가 배열 타입으로 파싱된다고 못박아 둔 자리다(드묾). **⑦ `go`·`defer` 는 필드가 없다** —
자식이 `_expression` 하나뿐이라 자식 위치로 앵커를 잡아야 한다.

### gofmt·ASI 가 T1 채점에 뜻하는 것 — 파이썬 D152 ⓑ 의 대응물

실측: 탭·공백을 섞고 깊이를 마음대로 바꾼 Go 파일이 **ERROR 0개**로 똑같이 파싱된다.
들여쓰기는 Go 에서 의미가 **없다**. 그래서 답이 파이썬과 정확히 반대다.

| | 파이썬 (D152 ⓑ) | Go |
|---|---|---|
| 들여쓰기 | **의미다** — 무시하면 틀린 것을 맞다고 한다 | **의미가 아니다** — 정규화 안 하면 맞는 것을 틀리다고 한다 |
| 줄바꿈 위치 | 자유 | **의미다** — `{` 를 내리면 다른 프로그램인데 ERROR 도 안 난다 |
| T1 정규화 | 탭·공백만 고르고 **깊이 유지** | **앞쪽 공백을 통째로 지우고 줄바꿈은 손대지 않는다** |

**「서식이 하나로 강제되면 T1 이 쉬워지나 무의미해지나?」 — 쉬워지되 무의미해지지 않는다.**
gofmt 가 고정하는 것은 공백·정렬이고 T1 이 재는 것은 「어느 토큰이 어느 순서로 오는가」다.
오히려 gofmt 는 정답을 **유일하게** 만들어, 「같은 뜻인데 다르게 쓴 답」을 오답으로 처리하던
잡음을 없앤다 — TS·파이썬 T1 의 「따옴표를 `'` 로 썼는데 원본은 `"`」 같은 다툼이 Go 엔 없다.

무의미해지는 것은 다른 쪽이다. gofmt 가 강제하는 **들여쓰기를 채점 대상에 넣으면** 그 항목은
정보가 0이다 — 사용자가 뭘 치든 gofmt 를 돌리면 같아진다. 그러니 Go 의 T1 은 앞쪽 공백을
지우고 **토큰 순서와 줄바꿈 위치**만 본다. 그 둘이 Go 에서 유일하게 의미를 나르는 서식이다.
단서 — 사용자 리포가 gofmt 를 안 돌렸을 수 있으므로 공백 제거는 **기준선과 답 양쪽에** 건다.

---

## §9 오개념 12

| # | 무엇을 믿나 | 실제로는 |
|---|---|---|
| 1 | `:=` 는 언제나 새 이름을 만든다 | 같은 블록에 이미 있고 왼쪽에 새 이름이 하나라도 있으면 **재선언**이라 원래 이름에 값만 들어간다. 안쪽 블록이면 반대로 바깥을 **가린다** — `err` 이 이렇게 사라진다 |
| 2 | 선언만 하면 값이 비어 있다 | 선언하는 순간 **제로 값**이 들어간다. `var m map[string]int` 은 nil 맵이라 **읽기는 되고 쓰기는 터진다** |
| 3 | 조건 자리에 아무 값이나 놓을 수 있다 | `bool` 만 온다. `if n {`·`if s {` 는 컴파일이 멈춘다 |
| 4 | `append(xs, v)` 를 부르면 `xs` 가 늘어난다 | 반환값을 다시 담지 않으면 **아무 일도 안 난다**. 담더라도 용량이 남으면 원본을 고치고 모자라면 새 배열이 생긴다 |
| 5 | 슬라이스를 잘라 넘기면 복사본이다 | `s[1:3]` 은 **같은 뒷배열**의 다른 창이다. 한쪽을 고치면 다른 쪽이 바뀐다 |
| 6 | 맵을 훑으면 넣은 순서로 나온다 | 「맵의 순회 순서는 정해져 있지 않고 한 순회와 다음 순회가 같다고 보장되지 않는다」(명세) |
| 7 | `err == nil` 이면 값이 정상이다 | 둘 다 돌아오므로 `err` 을 안 보고 지나가도 컴파일이 안 멈춘다. 설문 응답자 **19%** 가 「오류를 통째로 무시하기 쉽다」를 문제로 꼽았다 |
| 8 | `nil` 을 담은 인터페이스는 nil 이다 | 인터페이스는 (타입, 값) 둘이라 타입이 남으면 `!= nil` 이다 (FAQ `#nil_error`) |
| 9 | 인터페이스를 만족시키려면 어딘가에 적어야 한다 | 메서드 서명이 맞으면 끝이고 **적는 곳이 없다** (FAQ `#inheritance`) |
| 10 | 값 리시버 메서드에서 필드를 고치면 원본이 바뀐다 | 값 리시버는 **복사본**을 받는다. 그리고 타입 `T` 의 메서드 집합에는 `*T` 리시버 메서드가 없다(명세 「Method sets」) |
| 11 | `defer f(x)` 는 함수가 끝날 때 `x` 를 읽는다 | `defer` 를 만나는 **그 순간** 인자를 계산해 저장한다. 여럿이면 **역순**으로 돈다 |
| 12 | 반복 변수는 하나를 계속 고쳐 쓴다 | **1.22 부터 반복마다 새로 만든다**(명세 「Each iteration has its own separate declared variable (or variables) [Go 1.22]」). 1.21 이하로 빌드되면 옛 규칙이라 **같은 코드가 `go.mod` 의 버전에 따라 다르게 돈다** |

nil 관련이 넷(2·5·8·12 중 2·8), 값 복사 관련이 넷(4·5·10·11)이다. 오답 진단(`diag`)의 재료가
여기서 나온다.

**이 열둘은 1·2부의 것이다.** 값 층위 오개념은 여기 둘뿐이라(② 제로 값 · ③ 조건 자리) **0부 여덟
장의 것을 §0.1 의 마지막 열에 따로 세웠다** — 폭·넘침 · 실수 근사 · 바이트 대 rune · 우선순위 ·
암묵 변환 없음 · 견줄 수 없는 타입 여섯이다. 근거의 한계는 §10 그대로다(progmiscon.org 에 Go 가 없다).

---

## §10 근거와 출처

- **Exercism Go 트랙 `config.json`** (MIT · © 2021 Exercism) —
  `https://raw.githubusercontent.com/exercism/go/main/config.json` (2026-09-04 취득). 개념 연습
  **29** · 개념 **38** · 연습문제 148. 그쪽 `prerequisites` 로 계산한 깊이 0~3 은 `basics` /
  `arithmetic-operators`·`booleans`·`comments`·`numbers`·`strings`·`strings-package` /
  `comparison`·`conditionals-if`·`packages`·`string-formatting` /
  `conditionals-switch`·`slices`·`structs`·`variadic-functions`. **간선은 안 가져왔다**(D148) —
  그쪽 `functions` 는 깊이 5, `for-loops` 는 4 로 §5 와 어긋난다. 산문도 안 가져왔다.
  주목할 것: 38개 개념에 **고루틴·채널·select·defer·context 가 하나도 없다.** Go 를 가르치는
  트랙조차 동시성을 개념 트리에 안 넣는다.
- **tree-sitter** — `crates/parse/Cargo.toml` 의 `tree-sitter-go = "0.23"`(해석 0.23.4),
  `.../tree-sitter-go-0.23.4/src/parser.c` 의 `#define LANGUAGE_VERSION 14`. 파서를 직접 빌드해
  `abi_version()=14`·`node_kind_count()=219` 확인. `master`(v0.25.8 생성)는 **15**.
  `https://github.com/tree-sitter/tree-sitter-go`
- **Go 언어 명세** `https://go.dev/ref/spec` — 세미콜론 삽입 두 규칙 · 짧은 변수 선언의 재선언
  규칙 · 맵 순회 순서 · `defer` 인자 평가 시점 · 메서드 집합 · 반복 변수의 반복별 선언
  `[Go 1.22]` · `type T[P *C]` 모호성. 사실 확인용이고 문장은 옮기지 않았다.
- **Go FAQ** `https://go.dev/doc/faq` — `#nil_error` · `#inheritance` · `#exceptions`.
- **Go 1.22** `https://go.dev/doc/go1.22` · `https://go.dev/blog/loopvar-preview` — 반복 변수 스코프.
- **슬라이스 내부** `https://go.dev/blog/slices-intro` — 뒷배열 공유와 용량.
- **Go Developer Survey** 2024 H1 `https://go.dev/blog/survey2024-h1-results` (API·RPC 74% ·
  CLI 63%, 난점: 효과적으로 쓰는 법 15% · 오류 처리 장황함 13%) · 2023 Q1
  `https://go.dev/blog/survey2023-q1-results` (오류 검사 상용구가 지겹다 43% · 어떤 오류 타입을
  볼지 모르겠다 28% · **오류를 통째로 무시하기 쉽다 19%**).
- **TIOBE Index** `https://www.tiobe.com/tiobe-index/` (2026-08) — Go 14위 1.07%, 전년 8위.
- **동시성 버그 실증** — Tu·Liu·Song·Zhang, *Understanding Real-World Concurrency Bugs in Go*,
  ASPLOS 2019. Go 애플리케이션 6개 분석, 블로킹 버그의 약 58%가 **메시지 전달** 쪽.
  `https://songlh.github.io/paper/go-study.pdf`
- **밀도 실측** — `cli/cli`(trunk) · `lazygit`(master), 각 `pkg/**` 에서 `_test.go` 제외.
  2026-09-04 codeload 스냅숏에 `grep -c`/`grep -l`. **구문이 아니라 텍스트 기반**이라 주석·문자열
  안의 일치가 섞여 있다 — 자릿수를 보는 용도다.

**확인 못 한 것** — ① `selector_expression` 에서 패키지 한정과 필드 접근을 가르는 방법이 지금
쿼리 층에서 되는지(`#match?` 로 import 이름 집합과 대조할 자리가 있는지). ② 인제스트가
`_test.go` 를 제외하는지 — 안 하면 `if err != nil` 수가 더 는다. ③ `go/nil-interface` 를
tree-sitter 쿼리로 잡을 수 있는지. 타입 정보가 필요해 보이며, 못 잡으면 사용처가 0이라 **합성
카드(D137)로만** 설 수 있다. ④ LLM 이 낸 Go 코드의 구문 분포를 직접 잰 공개 연구는 찾지
못했다 — §1 의 「생김새」는 설문의 용도 분포와 실제 애플리케이션 둘의 실측으로 대신했다.
