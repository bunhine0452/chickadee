# C# 커리큘럼 조사 — 네임스페이스 `csharp`

조사일 2026-09-04 · **0부 「이 언어의 값과 식」 추가 2026-09-05**(정본 §1·§4 · README §8 의 공통 축).
파일 하나만 쓴다(`dictionary/**` 는 건드리지 않았다). **§0 의 값은 .NET 10.0.302 로 실행해 잰 것**이고,
나머지 절의 「확인 못 함」 표시는 그대로다.

---

## §1 언어 좌표

### 네임스페이스 이름 충돌 — `cs` 는 못 쓴다

C# 의 자연스러운 약칭 `cs` 는 이번에 새로 만드는 **CS 기초 사전 네임스페이스 `cs/`**(§7)가 이미 쓴다.
그래서 이 언어의 `lang` 은 **`csharp`** 다. 확장자는 `.cs` 그대로라서 `_lang.yaml` 의 `extensions` 표와
네임스페이스가 처음으로 어긋난다 — `ts` 는 `.ts` 를, `py` 는 `.py` 를 쓰고 있었다.

**어긋나도 문제가 되지 않는다.** D19 가 이미 `lang`(사전 네임스페이스)과 `grammar`(tree-sitter 키)를 갈라
놓았고, `extensions` 는 `lang` 이 아니라 **`grammar` 로 키를 잡는다** — `packages/dictionary/src/schema.ts:233`
이 `z.record(grammarSchema, …)` 다. `py/_lang.yaml` 도 `python: [.py, .pyi]` 이지 `py: [...]` 가 아니다.
`ts`·`py` 에서 네임스페이스와 확장자가 같아 보인 것은 우연이고, 그 우연이 끊기는 첫 사례가 C# 이다.
`sql` 은 이미 문법 키(`sql`)와 크레이트 이름(`tree-sitter-sequel`)이 어긋나 있고 D19 가 바로 그 때문에 쓰였다.

손이 가는 곳은 한 군데다. `apps/desktop/src/session-flow.ts:559` 의 `grammarOf(path)` 가 확장자 표를 좁게
복사해 들고 있고 **모르는 확장자를 `typescript` 로 폴백**한다. `.cs` 를 더하지 않으면 C# 파일이 조용히
TypeScript 로 파싱된다 — 오류가 아니라 사용처 0으로 끝나므로 눈에 안 띈다.

### 순위와 쓰임

TIOBE 2026-08 에서 C# 는 **5위 · 4.09%** 다(전월 대비 순위 변동 없음). 위는 Python 18.53 · C 11.10 ·
C++ 8.62 · Java 8.25 이고 바로 아래가 JavaScript 2.63 이다. TIOBE 2025년의 언어이기도 하다.
언어 판은 **.NET 10 LTS + C# 14**(2025-11-11)다 — `field` 키워드, 확장 멤버(확장 프로퍼티·인덱서·정적 확장),
널 조건부 대입이 이 판에서 들어왔다.

실제로 만들어지는 것: ASP.NET Core 웹 API·Blazor, Unity 게임(Unity 자체 집계로 모바일 게임의 약 70%),
Windows 데스크톱(WPF·WinForms), Azure Functions, MAUI.

### 바이브 코딩으로 나온 C# 의 생김새 — 두 모양 중 어느 쪽을 기준으로 잡나

LLM 이 C# 를 쓰면 결과물이 **둘 중 하나**이고, 둘의 코드 생김새가 겹치지 않는다.

| | ASP.NET Core minimal API | Unity `MonoBehaviour` |
|---|---|---|
| 진입 | `Program.cs` 의 **최상위 문** (`var app = builder.Build();`) | `class X : MonoBehaviour` 의 `void Start()`·`void Update()` |
| 쏟아지는 구문 | `var` · 람다 · `async`/`await` · `Task<T>` · LINQ · `record` · `string?` · `??` · `?.` · 파일 범위 네임스페이스 | 필드 + `[SerializeField]` · 애트리뷰트 · `void` 메서드 · 코루틴(`IEnumerator` + `yield return`) · `while (true)` · `struct`(`Vector3`) · `GetComponent<T>()` |
| 없는 것 | (거의 없음) | 최상위 문 · `record` · `async`/`await` · LINQ |

**ASP.NET Core 모양을 기준으로 잡는다.** 근거 셋:

1. **인제스트가 리포를 통째로 읽는다.** Unity 프로젝트는 `.meta`·`.prefab`·`.unity`·`.asset` 이 파일 수의
   대부분이고 C# 는 `Assets/Scripts/` 아래에만 있다. `thin_threshold`(min_files 2 · min_sites 3)는 넘겨도
   사용처가 스크립트 몇 장에 몰린다.
2. **LLM 이 내는 것은 SDK 템플릿 모양이다.** `dotnet new webapi`·`console` 이 .NET 6 이후 최상위 문
   `Program.cs` 를 낸다. 학습 자료도 그 모양이다.
3. **Unity 는 C# 9 에 묶여 있다.** 레코드는 `IsExternalInit` 를 손으로 선언해야 쓸 수 있고 Unity 직렬화가
   레코드를 지원하지 않으며, 최상위 문은 안 된다. Unity 를 기준으로 잡으면 `record`·`switch` 식·최상위 문·
   `async`/`await` 를 전부 빼야 하고, 그러면 2026년의 C# 가 아니라 2020년의 C# 를 가르치게 된다.

Unity 쪽은 `_lang.yaml` 의 **`alternatives`** 로 흡수한다 — 「AI 가 대신 쓴 것」이 정확히 이 자리다.
필요한 짝 넷(§2~§4 의 34개 밖에 더 붙는 개념이다):

| gap | present | 왜 |
|---|---|---|
| `csharp/async-await` | `csharp/coroutine-yield` | Unity 는 기다리기를 코루틴으로 쓴다 |
| `csharp/property` | `csharp/public-field` | `[SerializeField]` 가 필드에만 붙는다 |
| `csharp/linq-select` | `csharp/foreach-accumulate` | Unity 는 GC 때문에 LINQ 를 기피한다 |
| `csharp/list` | `csharp/array` | 배열이 관용이다 |

### 문법 키 표

| 축 | 값 |
|---|---|
| `lang`(사전 네임스페이스) | `csharp` |
| `grammar`(tree-sitter 키, 제안) | `csharp` — 기존 키가 전부 소문자 한 낱말이다 |
| 크레이트 | `tree-sitter-c-sharp` (Rust 심볼 `tree_sitter_c_sharp::LANGUAGE`) |
| `tree-sitter.json` 의 `name` | `c-sharp` · scope `source.cs` |
| `extensions` | `csharp: [.cs]` — `.csx` 는 뺀다(§8) |

---

## §0 0부 — 이 언어의 값과 식

축 여덟의 정의와 id 조각은 [`README.md`](./README.md) §8 에 있다. **여기는 C# 에서 어긋나는
자리만** 쓴다. 여덟 축이 전부 서고 어긋남 판은 따로 안 세웠다 — **8 / 12**(상한 §8). C# 의 어긋남
넷(`checked` · `decimal` · 값/참조 타입 · `==` 가 타입마다)이 전부 축 안에서 표현된다.

**이 절의 값은 이 기계에서 실행해 잰 것이다** — .NET SDK **10.0.302**, `dotnet new console` →
`dotnet run`, 2026-09-05. 세 언어 중 C# 와 Swift 만 툴체인이 있었고 Go 는 없었다(go.md §0.4).
**이 문서의 §1 「생김새」는 여전히 템플릿·설문에 기댄 판단이고, §0 만 실측이다.**

### §0.1 여덟 장

| # | id | name.ko / en | 한 줄 | `cs/` | 그림 | 초보가 실제로 틀리는 자리 |
|---|---|---|---|---|---|---|
| 0-1 | `csharp/integer-literal` | 정수 값과 그 폭 / Integer literal | 폭이 정해져 있고, **넘칠 때 무엇이 일어날지를 코드가 고른다**(`checked`/`unchecked`) | `bit-and-byte` · `integer-overflow` | 비트 배열 | **「넘치면 예외가 난다」고 믿는다.** 기본은 **조용히 감긴다** — 실측 `int.MaxValue + 1` = **−2147483648**. `checked` 를 적었을 때만 `OverflowException` 이다 |
| 0-2 | `csharp/float-literal` | 실수 값이 **셋** / Float literal | `float`(2진 32) · `double`(2진 64) · `decimal`(**10진 128**). 접미사가 타입을 정한다 | `floating-point` · `binary-representation` | 비트 배열 | **돈을 `double` 로 담는다.** 실측 `0.1 + 0.2 == 0.3` → **False**, `0.1m + 0.2m == 0.3m` → **True**. 접미사 `m` 하나가 답을 뒤집는다 |
| 0-3 | `csharp/text-literal` | 글자 값 — `char` 와 `string` / Text literal | **따옴표 하나가 타입을 가른다** — `'a'` 는 `char`(값형 · UTF-16 코드 단위 하나), `"a"` 는 `string`(참조형) | `text-encoding` | 값 상자 · **메모리 줄** | **`.Length` 가 사람이 보는 글자 수라고 믿는다.** 실측 이모지 하나가 **11** 이다 — UTF-16 코드 단위를 센다 |
| 0-4 | `csharp/boolean-literal` | 참·거짓 값 / Boolean literal | 조건 자리에 `bool` 만 온다 — 「참 같은 값」이 **없다** | `type` · **`cs/truthiness` 없음** | 평가 트리 | **`if (count)`·`if (obj)` 를 쓴다** (§9 ③) |
| 0-5 | `csharp/operator-precedence` | 무엇이 먼저 묶이고, 결과 타입은 누가 정하나 / Operator precedence | 결과 타입을 **값이 아니라 피연산자의 타입**이 정한다 | **`cs/operator-precedence` 없음** (`type` 로 임시) | 평가 트리 | **`5 / 2` 를 2.5 로 안다.** 실측 **2** — `5.0 / 2` 라야 2.5 다 (§9 ②). 그리고 `1 << 2 + 3` 은 **32** 인데 Go·Swift 는 7 이라 그쪽에서 온 손이 여기서 틀린다 |
| 0-6 | `csharp/type-conversion` | 넓히기는 저절로, 좁히기는 손으로 / Type conversion | 그리고 **캐스트는 조용히 값을 바꾼다** — `checked` 를 적어야 터진다 | **`cs/type-conversion` 없음** · `static-vs-dynamic-typing` · `compile-and-run` | 타입 변환 사다리 | **`(int)` 캐스트가 안전하다고 믿는다.** 실측 `(int)3000000000L` = **−1294967296**(unchecked), `checked` 면 `OverflowException`. `(int)2.9` 는 **2** 다 — 반올림이 아니라 버림이다 |
| 0-7 | `csharp/assignment` | 이름에 붙는 것이 값인가 자리인가 / Binding and assignment | 이름을 **만드는** 줄에는 낱말이 하나 더 있다(타입 이름 또는 `var`). 그리고 `=` 가 **struct 면 값 전체를, class 면 화살표만** 복사한다 | `state` · `value-vs-reference` · `stack-and-heap` | 값 상자 · 메모리 줄 · **스택 프레임** | **`class` 를 넘기면 복사된다고 믿는다.** 실측: struct 를 다른 이름에 넣고 고치면 원본 `X` = **1**, class 는 **9** (§9 ⑥·⑦) |
| 0-8 | `csharp/equality` | 같은 것인가 같은 값인가 / Equality | **`==` 가 정적 타입에 따라 다른 질문을 한다** | `identity-vs-equality` · `value-vs-reference` | 평가 트리 · 값 상자 | **`==` 는 언제나 내용을 견준다고 믿는다.** 실측: 같은 두 문자열이 `string ==` 로는 **True**, 변수 타입을 `object` 로 바꾸면 같은 값에 **False**. 코드는 한 글자도 안 바뀌고 **선언한 타입만 바뀌었다** (§9 ⑤) |

**`cs/` 에 없는 것 셋이 이 표에 굵게 나온다** — `cs/operator-precedence` · `cs/type-conversion` ·
`cs/truthiness`. 셋 다 README §9 의 「없는 것」 표에 이미 올라 있다(I6). 규약 5 대로 이 문서는
새 `cs/` 를 만들지 않는다. C# 에서 가장 크게 비는 것은 **`cs/type-conversion`** 이다 —
이 언어는 변환 규칙이 넷으로 갈리는데(암묵 넓힘 · 명시 좁힘 · `checked` 좁힘 · 박싱) 0-6 의
타입 변환 사다리가 그 넷을 한 그림에 놓으려면 「다른 타입 둘이 만나면 무엇이 일어나나」를 답하는
기계 개념이 있어야 하고, 43장에 없다.

### §0.2 형식과 `universal` — 규약 4·6

`fundamentals.md` §2.1·§2.2 가 **`bits` 와 `predict` 를 형식에서 내렸다.** `bits` 는 `table` 의
한 배치이고 `predict` 는 형식이 아니라 **`value` 의 판정란**이다 — 「예측하게 한다」는 물음의
성질이지 답을 받는 모양이 아니다. 아래 표를 그 결정에 맞춰 다시 적었다
([`csharp-learning.md`](./csharp-learning.md) §11.6 ②).

| # | 형식 (I1) | 배치 · 판정란 | `universal` |
|---|---|---|---|
| 0-1 | `table` | 비트 칸 배치 + **예측 판정란** | `common/number-literal` |
| 0-2 | `value` | — | `common/number-literal` |
| 0-3 | `table` | — | `common/text-literal` |
| 0-4 | `value` | **예측 판정란** | `common/boolean-value` |
| 0-5 | `step` | — | `common/arithmetic` |
| 0-6 | `build` | — | `common/type-cast`(신규 후보 · README §8) |
| 0-7 | `step` | — | `common/variable-binding` · `common/reassignment` |
| 0-8 | `value` | **예측 판정란** | `common/comparison` |

**남은 형식이 전부 쓰인다** — 안 쓰는 것이 없다(규약 6). 그림도 여섯이 전부 쓰인다:
스택 프레임은 0-7 에서 「struct 를 메서드에 넘기면 프레임에 복사본이 하나 더 선다」를 그린다.

**C# 에서 예측 판정란이 가장 센 자리가 0-1 과 0-8 이다.** 둘 다 예측과 실제가 갈리고, **갈리는
원인이 코드에 안 적혀 있다** — `checked` 를 안 적었다는 사실, 그리고 변수의 정적 타입.
오답 진단은 정본 §3 ② 대로 **「당신이 고른 그것이 참이 되는 조건」**을 낸다: 「예외가 나는 답은
`checked` 를 적었을 때 참이다」 + 그 한 줄. **예측이 틀리는 순간이 곧 「`checked` 라는 낱말이
왜 있나」의 답이다.**

### §0.3 C# 라서 다른 네 자리 — 전부 실측

| 자리 | C# | 견줄 것 | 축 |
|---|---|---|---|
| **`checked` / `unchecked`** | 기본은 감김(`int.MaxValue + 1` = −2147483648). `checked(…)` 면 `OverflowException`. **넘칠 때 무엇이 일어날지를 코드가 고른다** | Swift 는 고를 여지 없이 **죽는다**(종료 코드 133 · swift.md §0.4) — 감으려면 `&+`. Go 는 언제나 감기고 고를 낱말이 없다 | 0-1 |
| **`decimal` 이라는 세 번째 실수형** | 실측 `1.0m / 3` = `0.3333333333333333333333333333`(28~29자리), `1.0 / 3` = `0.3333333333333333`, `1.0f / 3` = `0.33333334` | Go 도 Swift 도 10진 실수형이 **언어에 없다.** 돈은 라이브러리로 간다 | 0-2 |
| **값 타입과 참조 타입** | 실측 struct 복사 후 원본 `X` = 1, class 는 9. `record` 는 class 인데 `==` 가 내용 비교다(실측 True) | Swift 도 struct/class 로 같은 축을 갖되 `==`/`===` 로 **낱말이 갈려 있다**. Go 는 struct 가 값이고 참조는 포인터로 **눈에 보이게** 적는다 | 0-7 |
| **`==` 가 타입마다 다르게 동작** | `string` 은 내용, 보통의 `class` 는 참조, `record` 는 내용. **같은 두 값이라도 변수를 `object` 로 선언하면 참조 비교로 바뀐다**(실측 True → False) | Swift 는 낱말로 갈랐고, Go 는 견줄 수 없는 타입을 아예 컴파일에서 막는다 | 0-8 |

셋을 한 줄에 놓으면 이렇게 된다 — **정수가 넘칠 때 C# 는 고르게 하고, Swift 는 죽고, Go 는 감긴다.**
`cs/integer-overflow` 가 셋을 한 기계로 묶고 언어 장 셋은 「이 언어는 그때 무엇을 하기로 했나」만
다르게 적는다. **D4 전이가 여기서 값을 하되 위험도 여기서 난다** — 「감긴다」를 3겹 쌓고 온 사람이
Swift 에서 1겹으로 시작하면 가장 중요한 차이가 겹 아래로 숨는다. §6 이 제네릭(소거 대 reified)에서
이미 짚은 것과 같은 종류의 문제이고, **`common/number-literal` 하나에 세 언어의 반대되는 답이
걸린다는 것이 새로 드러난 자리다.**

### §0.4 실측표 — 재현 방법을 붙여서

| 물음 | 값 | 비고 |
|---|---:|---|
| `int.MaxValue` · `sizeof(int)` · `sizeof(long)` | `2147483647` · `4` · `8` | |
| `unchecked(int.MaxValue + 1)` | `-2147483648` | **기본값이 이것이다** |
| `checked(int.MaxValue + 1)` | `OverflowException` | 「Arithmetic operation resulted in an overflow.」 |
| `byte 250 + 10` (unchecked) | `4` | 폭이 8비트라 한 바퀴 |
| `5 / 2` · `5.0 / 2` | `2` · `2.5` | 피연산자 타입이 정한다 |
| `-7 / 2` · `-7 % 2` | `-3` · `-1` | 0 쪽으로 버림 |
| `0.1 + 0.2` | `0.30000000000000004` | `== 0.3` → **False** |
| `0.1m + 0.2m` | `0.3` | `== 0.3m` → **True** |
| `1.0f / 3` · `1.0 / 3` · `1.0m / 3` | `0.33333334` · `0.3333333333333333` · `0.3333333333333333333333333333` | 자릿수가 셋 다 다르다 |
| `1.0 / 0` · `0.0 / 0.0` | `∞` · `NaN` | **예외가 아니다** |
| `1m / 0m` · `1 / 0`(변수) | 둘 다 `DivideByZeroException` | 상수 `0` 으로 나누면 **컴파일 오류**(CS0020)라 변수로 재야 한다 |
| `"가나다".Length` · UTF-8 바이트 | `3` · `9` | |
| `"👨‍👩‍👧‍👦"` Length/Rune/StringInfo/UTF-8 | `11` / `7` / `1` / `25` | **「길이」가 넷이다** |
| `2 + 3 * 4` · `1 << 2 + 3` | `14` · **`32`** | Go·Swift 는 `7` |
| `true \|\| false && false` | `True` | `&&` 가 위 |
| `(int)2.9` · `(int)-2.9` | `2` · `-2` | 버림 |
| `unchecked((int)3000000000L)` | `-1294967296` | `checked` 면 `OverflowException` |
| `int.Parse("12")` · `int.TryParse("12a", …)` | `12` · `False` | |
| struct 복사 후 원본 · class 복사 후 원본 | `1` · `9` | |
| `string ==` · `object ==` (같은 내용) | `True` · **`False`** | `.Equals` 는 둘 다 `True` |
| `record ==` | `True` | |

### §0.5 0부 → 1부 → 2부 → 3부 — 겹침 정리

**겹치는 쪽은 0부가 가져가고 §2·§3 에서 뺀다.** 경계는 하나다 — **값 하나를 만들고·보고·견주는
것까지가 0부**, 흐름을 나누는 문은 1부다. C# 는 §2 여덟 중 **다섯이 값 층위**로, 셋 중 가장 많다.

| 0부 장 | 어디에 있었나 | 부기 |
|---|---|---|
| `csharp/boolean-literal` | §2 ③ | **id 가 같다** — 자리만 올라간다 |
| `csharp/operator-precedence` | §2 ④ `csharp/arithmetic` | |
| `csharp/equality` | §2 ⑤ `csharp/comparison` | `if-statement` 의 prereq 를 `csharp/equality` 로 다시 건다 |
| `csharp/assignment` | §2 ① `csharp/local-declaration` + §2 ② `csharp/assignment` | 둘을 한 장으로 묶는다 — 축 7 의 `universal` 이 `variable-binding` 과 `reassignment` **둘**이라 원래 한 축이다 |
| `csharp/text-literal` | §3 ⑩ `csharp/string-literal` | 보간(`$"…"`)은 §3 ⑭ 가 계속 받는다 |
| `csharp/float-literal` | §3 ⑪ `csharp/number-literal` | 「접미사가 타입을 정한다」가 이 장의 전반부다 |
| `csharp/integer-literal` | **없었다** | 신규 |
| `csharp/type-conversion` | **없었다** | 신규 |

**§3 ⑯ `csharp/value-vs-reference` 는 2부에 남긴다.** 0-7 이 「대입이 무엇을 복사하나」를 값 층위에서
보이고, 「그래서 `struct` 와 `class` 중 무엇을 언제 쓰나」는 2부의 몫이다 — §3 이 그것을 「이 언어의
중심축」이라고 적어 둔 그대로다. 0부는 **그 축의 입구**만 연다.

새로 서는 둘이 요점이다. **지금 계획에 `checked` 도 캐스트도 장이 없었다** — §7 이 `cs/` 로 밀어
뒀는데 `cs/` 는 쿼리가 없어 스스로 안 뜨고 언어 개념이 `prereq` 로 걸어야 산다(cs.md §8).
**걸 데가 없었다.** (부기: §7 의 `cs/integer-representation`·`cs/compile-time-and-runtime`·
`cs/lazy-and-eager`·`cs/value-and-boxing` 은 실재 id 가 아니다 — 실물 이름은 `integer-overflow`·
`compile-and-run`·`eager-vs-lazy` 이고 박싱은 43장에 별도 장이 없다. §0.1 은 실재하는 이름만 썼다.)

| 부 | 무엇 | 장 | 교재 |
|---|---|---:|---|
| **0부 값과 식** | 위 여덟 | **8** | 사전 `examples[]` (§0.7) |
| **1부 바닥** | `if-statement` · `method-declaration` · `return-statement` | **3** | 합성 + 내 코드 짚기 |
| **2부 C# 의 타입과 흐름** | §3 중심 남은 열넷 + §4 심화 열 | **24** | 합성 + 내 코드 |
| **3부 프레임워크** | **없다 — 네임스페이스가 아직 없다** | **0** | 내 코드 중심 |

**1부가 셋인 것이 이 언어의 사실을 하나 드러낸다.** C# 에는 자유 함수가 없어(§2 ⑦) 「문」의 바닥이
`if`·메서드 선언·`return` 셋뿐이고, 나머지는 전부 **타입과 값** 쪽이다. §2 가 「바인딩을 둘로 가른다」
며 여덟 중 둘을 쓴 판단이 0부에서는 한 장으로 합쳐진다 — 가르는 것이 값이 아니라 **문의 모양**이라서다.

**3부를 어떻게 채울지는 안 정했다.** §1 이 ASP.NET Core minimal API 를 기준 모양으로 잡았으니
3부의 재료는 그쪽이다 — 라우팅 · 의존성 주입 · 미들웨어 파이프라인 · 모델 바인딩 · EF Core 매핑이
자바 `spring/` 15장에 대응하는 자리다. 그 목록을 짜고 `aspnet/` 같은 네임스페이스를 여는 것이
다음 물결이고, **그때까지 3부는 0판이라 코스는 2부 끝에서 곧장 기능 챕터로 넘어간다**(java.md §2 의
「스프링이 아닌 자바 리포」와 같은 자리).

**0장 적재량 24 → 26. 상한 24 를 두 장 넘긴다.** 0부 여덟은 전부 깊이 ≤ 2 이고 흡수된 여섯은
원래도 §5 의 깊이 0~2 스물넷 안에 있었으므로 순증은 새로 선 둘이다. §5 가 「24/24 는
`zero-chapter.ts` 가 원하는 상태」라고 적어 둔 균형이 0부로 깨진다.
Swift 가 25 → 29 로 더 크게 넘치므로(swift.md §0.5) **이것은 C# 만의 문제가 아니라 축이 겹친
문제다** — 0장(프롤로그, 상한 24)과 0부(코스의 첫 부)는 다른 것인데 `essential` 하나를 같이 쓴다.
결정거리 둘은 swift.md §0.5 와 README §11 미결 3번에 적힌 그대로다 — ⓐ 0부를 0장 정렬 밖에
두거나 ⓑ 상한을 올린다.

→ **정해졌다(D184, 2026-09-05): 상한 폐지.** `essential` 에 넣고 **자르지 않는다.** 넷째 정렬 키가 돌 일이 없고, 남는 것은 프롤로그 길이뿐이다(하루 2장).

### §0.6 판 수와 일수

정본 §2 — 하루 15분, 새 판 2장(D12). 판 수는 개념 수와 1:1 로 잡았다(java.md §2 와 같은 셈).

| 부 | 판 | 일 |
|---|---:|---:|
| 0부 | 8 | **4** |
| 1부 | 3 | 2 |
| 2부 | 24 | 12 |
| 3부 | 0 (미정) | 0 |
| **합** | **35** | **18** |

**18일은 하한이다.** 만기 재검이 먼저 예산을 먹으므로(정본 §2) 실제 달력은 더 길고, 얼마나
길어지는지는 **안 쟀다.** 3부가 서면 `aspnet/` 개수만큼 더 붙는다 — 자바 `spring/` 이 15장이니
같은 자릿수라면 8일쯤인데 **추정이고 안 쟀다.**

### §0.7 문법 현황 — **로드는 통과하고 캡처가 0 이다. 그리고 §8 의 「안 열린 세 곳」은 낡았다**

| 자리 | 상태 | 근거 |
|---|---|---|
| `crates/parse` 문법 | ❌ **없다.** `tree-sitter-c-sharp` 크레이트도 `lang-csharp` 피처도 없다 | `crates/parse/Cargo.toml` · `langs.rs` |
| 그 사실을 지키는 못 | ❌ **없다.** `quality.rs` 의 시험은 **`swift` 와 `dart` 만** 지킨다 | `crates/parse/tests/quality.rs:130` |
| `grammarSchema` | ✅ **이미 열려 있다 — 다만 이름이 `c_sharp` 이다** | `packages/dictionary/src/schema.ts:32` |
| `grammarOf('.cs')` | ✅ **고쳐졌다** — `c_sharp` 로 간다 | `apps/desktop/src/session-flow.ts` |
| 사전을 쓰면 | **스키마도 린트도 통과하고 캡처만 0곳** | I6 확인 |
| 파싱을 시키면 | `ParseError::UnsupportedLang("c_sharp")` — 조용히 TS 로 새지는 않는다 | `crates/parse/src/lib.rs:128` |
| `dictionary/csharp/**` | ❌ 없다 | `ls dictionary/` |

**두 자리를 고쳐 적는다.** ① §8 의 「`grammarSchema` 에 `csharp` 가 없다」와 「`grammarOf` 가
`.cs` 를 몰라 `typescript` 로 폴백한다」는 **둘 다 이미 닫혔다**(README §6 의 1번·4번).
② §8 이 제안한 문법 키 `csharp` 는 **채택되지 않았다** — 코드가 쓰는 이름은 `c_sharp` 이고 그 이유가
`schema.ts` 주석에 적혀 있다(크레이트가 쓰는 키). 사전 네임스페이스는 `csharp` 그대로다.
D19 의 `lang` ≠ `grammar` 가 이 언어에서 **양쪽 다** 벌어진 셈이다 — `csharp` / `c_sharp` / `.cs`.

**「스키마에 있으니 열려 있다」가 아니다.** `dictionary/csharp/_lang.yaml` 에 `grammars: [c_sharp]` 를
적으면 로드 단계는 통과하는데 파서가 없어 **캡처가 0곳**이고, 사용처가 0이면 카드가 안 구워진다.
**「곧 됩니다」가 아니라 순서가 있다.**

**C# 를 세우려면 이 순서다.**

1. `crates/parse/Cargo.toml` 에 `tree-sitter-c-sharp = "=0.23.5"` 를 **판을 못 박아** 넣고
   `lang-csharp` 피처와 `langs.rs` 한 줄(`("c_sharp", …)` — 스키마와 같은 이름)을 더한다.
   캐럿(`"0.23"`)으로 적으면 안 된다 — **같은 마이너 안에서 ABI 가 14 → 15 로 올라간 언어다**(§8).
2. **`quality.rs:130` 의 목록에 `"c_sharp"` 을 더한다.** 지금 그 시험은 `swift`·`dart` 만 지켜서
   C# 문법은 **아무 경고 없이 들어올 수 있다.** 1번 전에 이 한 줄을 넣어야 순서가 뒤집히지 않는다.
   (범위 밖이라 이 세션에서는 안 고쳤다.)
3. 실코드 20파일 ERROR 비율을 재고 03 §2.3 의 5 % 게이트를 통과하는지 본다. **안 쟀다.**
   특히 전처리기(`#if`)가 든 파일과 `partial` 클래스가 어떻게 나오는지를 여기서 본다(§8).
4. `grammar_abi` 를 `_lang.yaml` 에 **15** 로 적는다(0.23.5 실측 · §8).
5. 시스템 쿼리 둘 — `_imports.scm` · `_blocks.scm`. `_blocks.scm` 은 **`global_statement`**(최상위 문)를
   반드시 넣는다. ASP.NET Core 모양을 기준으로 잡았으므로 **그 노드가 첫 화면의 대부분**이다(§8 ⑥).
6. 확장자는 `.cs` 만. `.csx` 는 빼고(이슈 #241), `.cshtml`·`.razor` 는 **이 문법이 아예 못 읽는다.**
7. 그다음에야 `dictionary/csharp/**` 다.

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
0·1부는 합성 교재로 설 수 있고 `cs/` 간선 열둘(§7)이 붙는다. **B 는 통째로 비어 있다** —
문법이 없어 HTTP 간선도 기능 폐포도 스키마 추출도 없고 실행 러너도 없다.
그 위에 C# 만의 구멍이 하나 더 있다 — **`.cshtml`·`.razor` 를 못 읽으므로 Blazor 리포에서는
B 이전에 UI 파일이 통째로 안 보인다.** 그리고 이 리포에 `.cs` 가 **0개**라 §1 의 「생김새」는
템플릿·설문에 기댄 판단이고(§10), 오개념 열둘도 명세와 커뮤니티 문헌 기반이다.
**코스는 위 순서 3번에서 멈춘다** — ERROR 비율을 재기 전에는 0부조차 실물로 못 세우고,
2부는 사용자가 C# 리포를 가져온 뒤에야 「내 코드」 절반이 채워진다.

---

## §2 기초 — 바닥 여덟 → **1부 바닥 셋** (0부가 다섯을 가져갔다)

①~⑤ 가 값 층위라 §0.5 대로 0부로 올라간다. 아래 표는 여덟 그대로 두되 올라간 다섯에 **↑0부**를
붙였고, 1부에 남는 것은 `if-statement` · `method-declaration` · `return-statement` 셋이다.
**셋인 것이 이 언어의 사실이다** — 자유 함수가 없어 「문」의 바닥이 그만큼뿐이고 나머지는 값 쪽이다.

| # | id | name.ko / en | token | universal | diff | prereq | **C# 라서 다른 것** |
|---|---|---|---|---|---|---|---|
| 1 ↑0부 | `csharp/local-declaration` → 0부에서 §2 ② 와 한 장(`csharp/assignment`) | 타입을 적고 이름 만들기 / Local declaration | `int x = 0;` | `common/variable-binding` | 1 | — | 이름을 **만드는 줄에는 낱말이 하나 더** 있다 — 타입 이름 또는 `var`. 그것이 있으면 만드는 줄, 없으면 옮기는 줄이다 |
| 2 ↑0부 | `csharp/assignment` → 0부에서 §2 ① 과 한 장 | 이름에 값 다시 넣기 / Assignment | `=` | `common/reassignment` | 1 | `csharp/local-declaration` | 이름에 **타입이 붙어 있다**. `var n = 0;` 다음 `n = "hi";` 는 컴파일이 막는다(CS0029) — `var` 는 동적 타입이 아니다 |
| 3 ↑0부 | `csharp/boolean-literal` | 참·거짓 값 / Boolean literal | `true` `false` | `common/boolean-value` | 1 | — | C# 에는 **「참 같은 값」이 없다**. 조건 자리에 오는 것은 오직 `bool` 이라 `if (count)` 도 `if (obj)` 도 컴파일 오류다 |
| 4 ↑0부 | `csharp/arithmetic` → 0부에서 `csharp/operator-precedence` | 셈하기 / Arithmetic | `+ - * / %` | `common/arithmetic` | 1 | — | `5 / 2` 가 **2** 다. 값이 아니라 **피연산자의 타입**이 정한다 — `5.0 / 2` 라야 2.5 다 |
| 5 ↑0부 | `csharp/comparison` → 0부에서 `csharp/equality` | 두 값 견주기 / Comparison | `== != < >` | `common/comparison` | 1 | `csharp/boolean-literal` | `==` 가 **타입마다 다른 질문**을 한다. `string` 은 내용을, 보통의 `class` 는 같은 객체인지를 묻는다 |
| 6 | `csharp/if-statement` | 조건으로 흐름 나누기 / If statement | `if` | `common/conditional-branch` | 1 | `csharp/boolean-literal` | 중괄호가 **선택**이라 없으면 **다음 한 문장만** 딸려 온다. 들여쓰기는 아무 의미가 없다 |
| 7 | `csharp/method-declaration` | 타입 안에 메서드 만들기 / Method declaration | `int F(int a)` | `common/function-definition` | 1 | `csharp/class-declaration` | **자유 함수가 없다.** 모든 메서드는 타입 안에 살고, 이름 앞에 **반환 타입을 먼저** 적는다 |
| 8 | `csharp/return-statement` | 값 돌려주기 / Return | `return` | `common/return-value` | 1 | `csharp/method-declaration` | 값 반환 메서드에서 빠뜨리면 **컴파일이 막는다**(CS0161) — 파이썬처럼 조용히 `None` 이 가지 않는다 |

**0부가 이 절의 판단 하나를 접는다.** 아래 「바인딩을 둘로 가른다」는 §2 안에서는 옳지만
0부에서는 한 장으로 합쳐진다 — 가르는 것이 값이 아니라 **문의 모양**이고(만드는 줄에 낱말이 하나 더),
축 7 의 `universal` 이 `variable-binding` 과 `reassignment` 둘이라 원래 한 축이기 때문이다(§0.5).

**여덟을 이렇게 고른 이유 둘.**

- **바인딩을 둘로 가른다.** 파이썬은 `const`/`let` 이 없어 하나로 합쳤고(D152 ⓐ), TS 는 `const`/`let` 때문에
  갈랐다. C# 도 가르지만 **가르는 낱말이 다르다** — 타입 이름이다. 여덟 자리 중 둘이 여기에 간다.
- **`while` 을 여덟에서 뺐다.** 사용처가 0인 개념은 카드가 안 구워지는데, ASP.NET Core 모양의 C# 에서
  실제로 쏟아지는 반복은 `foreach` 이고 맨 `while` 은 드물다. `while` 은 §3 에 두고 `common/loop-while` 로
  전이를 받는다 — TS·파이썬에서 3겹인 사용자는 첫 노출에 1겹으로 시작하므로 여덟 자리를 쓸 필요가 없다.
  깊이 2 라 0장 24판에는 그대로 든다(§5).

Exercism C# 트랙(개념 72 · 개념 연습 42)의 깊이 0~3 은 13개다 — `basics` / `booleans` · `strings` /
`extension-methods` · `if-statements` · `numbers` · `tuples` / `classes` · `do-while-loops` ·
`floating-point-numbers` · `nullability` · `randomness` · `while-loops`.

겹치는 자리 둘이 쓸모 있다. 그쪽 `basics` **하나**가 클래스·메서드·`return`·변수를 통째로 안는데, 이것이
**C# 에는 자유 함수가 없어 클래스 껍데기를 바닥에서 피할 수 없다**는 우리 판정과 같은 말이다.
`nullability` 가 깊이 3 으로 아주 이른 것도 우리가 `csharp/nullable-reference` 를 심화가 아니라
중심(깊이 1)에 둔 것을 뒷받침한다.

간선은 가져오지 않았다(D148 ③). 그쪽 **`extension-methods` 가 깊이 2** 인 것이 왜 그런지를 그대로 보여
준다 — 확장 메서드가 배열보다 쉬워서가 아니라 그 연습(`log-analysis`)의 선행이 `strings` 하나뿐이기
때문이다. D148 이 JS 트랙의 `functions` 로 든 반례가 C# 트랙에도 그대로 있다.

---

## §3 중심 — 16개 → **2부 열넷** (0부가 둘을 가져갔다)

⑩ `string-literal` · ⑪ `number-literal` 둘이 0부로 올라간다(§0.5). **⑯ `value-vs-reference` 는
여기 남는다** — 0부 0-7 이 「대입이 무엇을 복사하나」를 값 층위에서 보이고, 「그래서 `struct` 와
`class` 중 무엇을 언제 쓰나」는 2부의 몫이다. 남는 열넷이 §4 심화 열과 합쳐 **2부 스물넷**이 된다.

「이 개념이 없으면 C# 로 짠 코드를 왜 못 읽나」를 마지막 열 앞에 한 줄로 붙였다.

| # | id | name.ko / en | token | universal | diff | prereq | 없으면 못 읽는 것 / **C# 라서 다른 것** |
|---|---|---|---|---|---|---|---|
| 9 | `csharp/class-declaration` | 이름 붙인 타입 만들기 / Class declaration | `class` | **신규** `common/type-definition` | 1 | — | 모든 코드가 이 껍데기 안에 있다 · **C# 는 「함수 정의」가 뿌리가 아니다** — 그 위에 타입 선언이 한 겹 더 있다 |
| 10 ↑0부 | `csharp/string-literal` → 0부에서 `csharp/text-literal` | 글자 값 / Text literal | `"…"` | `common/text-literal` | 1 | — | 문자열이 어디부터 어디까지인지 · **따옴표 하나가 타입을 가른다** — `"a"` 는 `string`(참조형), `'a'` 는 `char`(값형) |
| 11 ↑0부 | `csharp/number-literal` → 0부에서 `csharp/float-literal` | 숫자 값 / Number literal | `1` `1.5m` | `common/number-literal` | 1 | — | 셈의 결과 타입 · **접미사가 타입을 정한다** — `1.0` 은 `double`, `1.0f` 는 `float`, `1.0m` 은 `decimal` 이고 돈은 `decimal` 이다 |
| 12 | `csharp/member-access` | 안의 이름 꺼내기 / Member access | `.` | `common/member-access` | 1 | `csharp/local-declaration` | 점 뒤가 무엇인지 · 점 하나가 **필드·프로퍼티·메서드**를 다 가리켜서, 읽기만으로는 그 자리에 코드가 도는지 안 도는지 모른다 |
| 13 | `csharp/method-call` | 메서드 부르기 / Method call | `()` | `common/function-call` | 1 | `csharp/member-access` | 그 줄에서 실제로 무엇이 도는지 · **같은 이름이 여럿일 수 있다**(오버로딩) — 어느 것이 불릴지는 인자 타입이 정한다 |
| 14 | `csharp/interpolated-string` | 문장에 값 끼워 넣기 / Interpolated string | `$"…{x}…"` | `common/string-interpolation` | 2 | `csharp/string-literal` | 로그·응답 문구 · **`$` 를 빠뜨리면 조용히 틀린다** — 중괄호가 글자 그대로 남고 오류는 안 난다 |
| 15 | `csharp/property` | 필드처럼 보이는 메서드 둘 / Property | `{ get; set; }` | `null` | 2 | `csharp/class-declaration` | DTO·모델의 대부분이 이것이다 · **자동 프로퍼티는 뒤 필드를 감춘다** — 이름 없는 필드가 하나 생기고, `x.N++` 은 원자적이지 않다 |
| 16 | `csharp/value-vs-reference` | 복사되는 값과 가리키는 값 / Value vs reference | `struct` `class` | **신규** `common/value-vs-reference` | 3 | `csharp/class-declaration` | **이 언어의 중심축** · 같은 `=` 가 두 일을 한다 — `struct` 는 값 전체를, `class` 는 가리키는 화살표만 복사한다 |
| 17 | `csharp/nullable-reference` | 없을 수 있다고 적어 두기 / Nullable reference | `string?` | `common/absent-value` | 2 | `csharp/local-declaration` | 경고가 왜 뜨는지 · **`string` 과 `string?` 는 런타임에 같은 타입이다.** `?` 는 컴파일러에게 하는 말이고 경고만 낸다 |
| 18 | `csharp/while-loop` | 조건이 참인 동안 되풀이 / While loop | `while` | `common/loop-while` | 2 | `csharp/comparison` | 끝나지 않는 코드를 읽는 법 · 조건이 `bool` 이어야 해서 `while (n)` 이 안 되고, **조건을 뒤에서 재는 `do…while`** 이 따로 있다 |
| 19 | `csharp/list` | 순서 있는 목록 / List | `List<T>` | `common/list` | 1 | `csharp/local-declaration`, `csharp/member-access` | 데이터가 담긴 자리 · **길이가 고정된 배열과 늘어나는 `List<T>` 가 다른 타입**이고, `Count` 와 `Length` 로 이름부터 갈린다 |
| 20 | `csharp/conditional-ternary` | 조건으로 값 고르기 / Ternary | `?:` | `common/conditional-expression` | 2 | `csharp/if-statement`, `csharp/local-declaration` | 한 줄에 접힌 갈림 · 양쪽 갈래의 **타입이 맞아야** 컴파일된다 — 한쪽만 `null` 이면 거기서 막힌다 |
| 21 | `csharp/null-coalescing` | 없을 때 채우기 / Null coalescing | `??` `??=` | `common/nullish-default` | 2 | `csharp/nullable-reference`, `csharp/local-declaration` | 기본값이 어디서 오는지 · **`null` 만 걸린다** — 빈 문자열과 `0` 은 그대로 통과한다 |
| 22 | `csharp/null-conditional` | 없을 수 있는 값 건너뛰기 / Null conditional | `?.` | `common/optional-chaining` | 2 | `csharp/nullable-reference`, `csharp/member-access` | 왜 예외가 안 나는지 · 값 타입 멤버에 붙이면 결과가 **`int` 가 아니라 `int?`** 로 바뀐다 |
| 23 | `csharp/lambda` | 값으로서의 함수 / Lambda | `=>` | `common/function-value` | 2 | `csharp/method-declaration`, `csharp/local-declaration` | 라우트 핸들러·LINQ 인자가 전부 이 모양 · **`=>` 가 두 가지 일을 한다** — 람다이기도 하고 식 본문 멤버이기도 하다 |
| 24 | `csharp/record` | 값으로 견주는 타입 / Record | `record` `with` | `common/copy-with-changes` | 3 | `csharp/property`, `csharp/value-vs-reference` | DTO 가 왜 한 줄인지 · **`==` 의 뜻이 바뀐다** — 같은 `class` 였다면 참조를 묻던 것이 `record` 에서는 내용을 묻는다 |

---

## §4 심화 — 10개

| # | id | name.ko / en | token | universal | diff | prereq | **C# 라서 다른 것** |
|---|---|---|---|---|---|---|---|
| 25 | `csharp/foreach-loop` | 하나씩 훑기 / Foreach | `foreach` | `common/iterate` | 2 | `csharp/list`, `csharp/local-declaration` | 도는 동안 원본을 고치면 **`InvalidOperationException` 으로 터진다** — 조용히 이상해지지 않는다 |
| 26 | `csharp/interface` | 할 수 있는 일만 정하기 / Interface | `interface` | **신규** `common/interface-contract` | 3 | `csharp/property`, `csharp/method-call` | 이름 앞의 `I` 는 관용일 뿐이고, **명시적 구현**을 쓰면 그 메서드가 클래스 이름으로는 아예 안 보인다 |
| 27 | `csharp/generics` | 타입 자리 비워 두기 / Generics | `<T>` | `common/generics` | 4 | `csharp/method-call`, `csharp/list` | **소거가 없다.** 타입이 실행 시각까지 남아 `typeof(T)`·`new T[]`·`is List<string>` 이 전부 된다. 값 타입은 타입마다 전용 코드가 나와 박싱이 없다 |
| 28 | `csharp/try-catch` | 터진 것을 받아 잇기 / Try-catch | `try` `catch` | `common/try-catch` | 3 | `csharp/method-call`, `csharp/nullable-reference` | **검사 예외가 없다** — 시그니처에 무엇이 터질지 안 적히므로 `catch` 를 붙일 자리를 코드만 봐서는 못 찾는다 |
| 29 | `csharp/linq-where` | 조건으로 골라내기 / Where | `.Where(…)` | `common/filter-select` | 3 | `csharp/lambda`, `csharp/list` | **List 의 메서드가 아니라 확장 메서드**다 — `using System.Linq;` 가 없으면 같은 코드가 컴파일되지 않는다 |
| 30 | `csharp/linq-select` | 항목마다 바꿔 새로 만들기 / Select | `.Select(…)` | `common/map-transform` | 3 | `csharp/lambda`, `csharp/list` | 결과가 `List` 가 아니라 **`IEnumerable<T>`** 라 `Count` 도 인덱서도 없다. `ToList()` 를 붙여야 목록이 된다 |
| 31 | `csharp/deferred-execution` | 계산 계획을 들고 있기 / Deferred execution | `IEnumerable<T>` | **신규** `common/lazy-sequence` | 4 | `csharp/linq-where`, `csharp/foreach-loop` | `Where`·`Select` 는 그 자리에서 **아무것도 안 돈다**. `foreach`·`ToList()`·`Count()` 가 돌리고, 두 번 훑으면 두 번 돈다 |
| 32 | `csharp/async-await` | 기다렸다 값 꺼내기 / Async-await | `async` `await` | `common/async-await` | 3 | `csharp/method-declaration`, `csharp/generics` | 반환 타입이 **`Task<T>` 로 한 겹 감싸진다** — `await` 없이 쓰면 값이 아니라 「아직 오지 않은 것」이 나오고, `.Result` 로 꺼내면 교착한다 |
| 33 | `csharp/using-disposable` | 블록을 벗어나면 정리하기 / Using | `using` | **신규** `common/scoped-cleanup` | 3 | `csharp/interface`, `csharp/method-call` | **낱말 하나가 두 가지다** — 파일 맨 위의 `using` 은 이름 가져오기이고 블록 안의 `using` 은 정리다 |
| 34 | `csharp/switch-expression` | 모양으로 갈래 고르기 / Switch expression | `switch { … }` | **신규** `common/pattern-match` | 3 | `csharp/conditional-ternary`, `csharp/value-vs-reference` | **`switch` 가 문일 수도 식일 수도 있다.** 식 쪽은 모든 갈래가 값을 내야 하고 빠진 경우가 있으면 컴파일러가 경고한다 |

**여기에 넣지 않고 미룬 것.** 각각 지금 빼는 이유가 있다.

| 개념 | 왜 미뤘나 |
|---|---|
| 확장 메서드 | 정의를 읽는 것보다 **쓰는 것**이 먼저다. LINQ 두 장(29·30)이 「인스턴스 메서드처럼 보이는데 아니다」를 이미 가르친다 |
| 델리게이트·이벤트 | ASP.NET Core 모양에서는 사용처가 얇다. Unity 를 기준으로 잡았다면 §3 에 들어갔을 자리다 |
| 연산자 오버로딩 | 정의가 리포에 거의 없다. 다만 **결과**는 `csharp/comparison` 이 이미 다룬다(`string ==`) |
| 박싱 | 문법 개념이 아니라 기계다 → §7 의 `cs/value-and-boxing` |

---

## §5 prereq 그래프와 0장 적재량

깊이는 뿌리(prereq 없음)에서부터 잰다. **사이클은 없다** — `class-declaration` 을 뿌리로 두고
`method-declaration` 을 그 아래에 걸면 「메서드가 먼저냐 타입이 먼저냐」가 풀린다.

| 깊이 | 개수 | 개념 |
|---|---|---|
| 0 | 6 | `local-declaration` · `arithmetic` · `boolean-literal` · `string-literal` · `number-literal` · `class-declaration` |
| 1 | 9 | `assignment` · `comparison` · `if-statement` · `member-access` · `method-declaration` · `interpolated-string` · `property` · `value-vs-reference` · `nullable-reference` |
| 2 | 9 | `return-statement` · `method-call` · `while-loop` · `list` · `conditional-ternary` · `null-coalescing` · `null-conditional` · `lambda` · `record` |
| 3 | 7 | `foreach-loop` · `interface` · `generics` · `try-catch` · `linq-where` · `linq-select` · `switch-expression` |
| 4 | 3 | `deferred-execution` · `async-await` · `using-disposable` |

**깊이 ≤ 2 = 24/24.** (**0부를 붙이면 26 이 되어 두 장 넘친다** — 셈은 §0.5 마지막 문단.) TS 21/24 · 파이썬 19/24 보다 꽉 찬다. 이유는 하나다 — C# 는 뿌리가 하나 더 있다.
`class-declaration` 이 깊이 0 에 서면서 `method-declaration`·`property`·`value-vs-reference` 셋을 깊이 1 로
끌어올렸다. 파이썬·TS 에서는 `function-definition` 이 뿌리라 그 위에 아무것도 없었다.

24/24 는 `zero-chapter.ts` 가 원하는 상태다 — 「후보가 상한 언저리에 오게 두어 무엇을 자를까가 임의의
문제가 되지 않게」. 다만 경계에 있는 것을 밝혀 둔다: **`csharp/record` 가 유일한 흔들리는 자리**다.
난이도 3 인데 깊이 2 라 0장에 든다. prereq 에 `csharp/method-call` 을 더하면 깊이 3 으로 내려가고
23/24 가 된다. 어느 쪽이든 자르는 규칙은 일하지 않는다. 난이도와 깊이가 다른 축인 것은 이미 있는
일이다 — `ts/conditional-ternary` 가 난이도 3 인데 깊이 1 이다.

---

## §6 `common/` 재사용 대 신규

### 재사용 — 27/30 (90%)

| C# 개념 | `common/` |
|---|---|
| `local-declaration` | `variable-binding` |
| `assignment` | `reassignment` |
| `boolean-literal` | `boolean-value` |
| `arithmetic` | `arithmetic` |
| `comparison` | `comparison` |
| `if-statement` | `conditional-branch` |
| `method-declaration` | `function-definition` |
| `return-statement` | `return-value` |
| `string-literal` | `text-literal` |
| `number-literal` | `number-literal` |
| `member-access` | `member-access` |
| `method-call` | `function-call` |
| `interpolated-string` | `string-interpolation` |
| `nullable-reference` | `absent-value` |
| `while-loop` | `loop-while` |
| `list` | `list` |
| `conditional-ternary` | `conditional-expression` |
| `null-coalescing` | `nullish-default` |
| `null-conditional` | `optional-chaining` |
| `lambda` | `function-value` |
| `record` | `copy-with-changes` |
| `foreach-loop` | `iterate` |
| `generics` | `generics` |
| `try-catch` | `try-catch` |
| `linq-where` | `filter-select` |
| `linq-select` | `map-transform` |
| `async-await` | `async-await` |

30개 중 **27개(90%)**를 물려받는다. 파이썬 21/30(75%)보다 높다 — C# 가 큰 언어라 `common/` 의 거의 전부에
대응물이 있다. 남은 셋도 실은 사용처가 있다: `common/mutating-append` 는 `list.Add(x)`,
`common/destructuring` 은 `var (a, b) = point;`(튜플 분해·위치 레코드 분해)다. §3 을 16개로 잘라서 뺐을
뿐이고, 자리를 늘리면 **29/30** 이 된다. `common/promise-chain` 만 C# 에서 얇다(`ContinueWith` 는 드물다).

### 신규 제안 — 6개

각각 **다른 언어 최소 2개**에서 성립하는지 붙였다.

| 신규 id | name.ko / en | 한 줄 | 다른 언어 근거 |
|---|---|---|---|
| `common/type-definition` | 이름 붙인 타입 만들기 / Type definition | 필드와 동작을 묶어 새 이름 하나로 만든다 | TS `interface`·`class` · Python `class` · Go `struct` · Rust `struct` |
| `common/value-vs-reference` | 복사되는 값과 가리키는 값 / Value vs reference | 넘길 때 값 전체가 가는지 화살표만 가는지 | Go 값 대 포인터 · Swift `struct` 대 `class`(거의 같은 구분) · Rust 이동과 빌림 |
| `common/interface-contract` | 할 수 있는 일만 정하기 / Interface contract | 구현을 안 정하고 이름과 모양만 정한다 | TS `interface` · Go `interface` · Rust `trait` · Swift `protocol` |
| `common/lazy-sequence` | 계산 계획을 들고 있기 / Lazy sequence | 값이 아니라 계산 방법을 들고 있다가 훑을 때 돈다 | Python 제너레이터 · Rust `Iterator` 어댑터 · JS 제너레이터 |
| `common/scoped-cleanup` | 블록을 벗어나면 정리하기 / Scoped cleanup | 블록을 벗어나는 순간 정리 코드가 반드시 돈다 | Python `with` · Go `defer` · Rust `Drop` |
| `common/pattern-match` | 모양으로 갈래 고르기 / Pattern match | 값이 아니라 모양으로 갈래를 고르고 그 자리에서 이름을 붙인다 | Rust `match` · Python `match` · Swift `switch case let` |

### `universal: null` 로 둘 것

- **`csharp/property`** — 다른 언어에도 계산 프로퍼티는 있지만(Swift·Kotlin·Python `@property`) 전부
  **몸체를 적는다**. C# 의 `{ get; set; }` 이 가르치는 것은 「메서드인데 필드처럼 보인다」가 아니라
  「**자동 프로퍼티가 이름 없는 필드를 하나 만든다**」이고, 그 모양은 C# 에만 있다. 전이할 데가 없다.

### Java 세션과의 접합 — 같은 `universal` 을 쓸 것과 못 쓸 것

Java 세션이 따로 돈다. D4 는 같은 `universal_id` 에서 3겹 이상이면 **첫 노출에 1겹**으로 시작시키므로,
같은 이름이 다른 기계인 자리는 함정이 된다.

**그대로 공유해도 되는 것** — 같은 기계, 표기만 다르거나 그것도 같다.

| `universal` | 왜 안전한가 |
|---|---|
| `variable-binding` · `reassignment` | 둘 다 타입을 먼저 적는다 |
| `boolean-value` | **둘 다 truthiness 가 없다** — Java 도 `if (1)` 이 안 된다. 완전히 일치한다 |
| `arithmetic` | 둘 다 정수 나누기가 버림이고 둘 다 조용히 넘친다 |
| `conditional-branch` · `conditional-expression` | 중괄호 선택·세미콜론·`?:` 가 같다 |
| `function-definition` · `return-value` | 둘 다 자유 함수가 없고, 둘 다 모든 경로 반환을 강제한다 |
| `list` · `iterate` | `List<T>` 대 `List<E>`, `foreach (var x in xs)` 대 `for (T x : xs)` — 표기 차이다 |
| `function-value` | `x -> x+1` 대 `x => x+1` — 화살표 모양만 다르다 |
| `scoped-cleanup` | `try-with-resources` 대 `using` — 같은 기계다 |
| `pattern-match` | Java 21 의 `switch` 패턴과 C# 의 `switch` 식이 거의 같다 |

**못 쓰거나 위험한 것** — 같은 이름이 다른 기계인 자리.

| `universal` | 어긋나는 곳 | 전이 위험 |
|---|---|---|
| `generics` | Java 는 **소거**라 `List<String>` 이 런타임에 `List` 다(`new T[]` 불가, `instanceof List<String>` 불가). C# 는 **reified** 라 `typeof(T)` 도 `new T[]` 도 된다 | Java 3겹 사용자가 C# 제네릭을 1겹으로 시작하면 **가장 중요한 차이가 겹 아래로 숨는다.** D4 는 전이 시 「표기 차이」 카드를 우선한다고만 적혀 있어 이 자리를 못 덮는다 → 결정 등록부 행 후보 |
| `comparison` | Java 는 객체 `==` 가 언제나 참조 비교이고 `String` 도 그렇다(인턴 때문에 우연히 맞을 뿐). C# 는 `string ==` 가 연산자 오버로딩으로 **내용 비교** | 반대 답을 이미 아는 채로 시작한다. `universal` 은 공유하되 오답 진단에 이 차이를 박아야 한다 |
| `value-vs-reference` | Java 에는 사용자 정의 값 타입이 없다(프리미티브 8개뿐, Valhalla 는 아직) | 전이가 아예 안 붙는다. Go·Swift 에서만 붙는다 |
| `absent-value` | Java 는 `Optional<T>` 와 애너테이션이고 언어 차원의 `String?` 이 없다 | 표기 차이가 크다. 「경고일 뿐 런타임은 안 바뀐다」는 TS 와는 겹치고 Java 와는 안 겹친다 |
| `try-catch` | Java 는 검사 예외라 시그니처에 `throws` 가 적힌다. C# 에는 없다 | 「어디를 감쌀지 코드에 안 적혀 있다」가 C# 쪽에만 있는 문제다 |
| `async-await` | Java 에는 없다(가상 스레드는 블로킹 코드를 그대로 쓴다) | 전이 없음 |
| `property` | Java 는 `getX()`/`setX()` 메서드다 | `universal: null` 로 둔 이유 그대로 |

TS·파이썬 쪽에서 오는 함정도 하나 적어 둔다. **`common/arithmetic`** 이다 — 파이썬은 `5/2` 가 2.5 이고
C# 는 2 다. 같은 `universal` 인데 답이 반대라 첫 정답이 Good 으로 잡히는 자리다.

---

## §7 `cs/` 로 밀어낼 것

문법이 아니라 기계·이론인 것. 새 네임스페이스 `cs/` 후보와, **C# 의 어느 개념이 이것을 필요로 하는지** 간선.

| `cs/` id | 한 줄 정의 | ← 필요로 하는 C# 개념 |
|---|---|---|
| `cs/stack-and-heap` | 값이 어디에 놓이고 언제 사라지는가 | `csharp/value-vs-reference` |
| `cs/identity-vs-equality` | 「같은 것인가」와 「같은 값인가」는 다른 질문이다 | `csharp/comparison` · `csharp/record` |
| `cs/integer-representation` | 정수는 고정 폭 이진수라 범위 끝에서 되돌아간다 | `csharp/arithmetic` |
| `cs/floating-point` | 이진 소수는 십진 소수를 정확히 담지 못한다 | `csharp/number-literal`(`decimal` 이 왜 따로 있나) |
| `cs/text-encoding` | 글자 하나와 코드 단위 하나는 다르다 — C# `char` 는 UTF-16 코드 단위라 이모지 하나가 `char` 둘이다 | `csharp/string-literal` |
| `cs/compile-time-and-runtime` | 컴파일 시각에 아는 것과 실행 시각에 아는 것이 다르다 | `csharp/nullable-reference` · `csharp/local-declaration`(`var`) |
| `cs/erasure-and-reification` | 타입 정보가 실행 시각까지 남는가 지워지는가 | `csharp/generics` |
| `cs/value-and-boxing` | 값 타입을 참조 자리에 넣으면 감싸는 상자가 하나 생긴다 | `csharp/value-vs-reference` · `csharp/generics` |
| `cs/lazy-and-eager` | 지금 계산하는가 계산 방법만 들고 있는가 | `csharp/deferred-execution` |
| `cs/gc-and-lifetime` | 메모리는 자동으로 돌아오지만 파일·소켓은 아니다 | `csharp/using-disposable` |
| `cs/concurrency-model` | 스레드·스레드풀·동기화 컨텍스트가 무엇인가 | `csharp/async-await`(`.Result` 교착) |
| `cs/dynamic-dispatch` | 이름 하나가 실행 시각에 어느 코드로 가는가 | `csharp/interface` |

---

## §8 tree-sitter 현실

### 판본과 ABI — **여기가 가장 위험하다**

직접 확인한 값이다(`src/parser.c` 머리의 `#define`):

| 태그 | `LANGUAGE_VERSION` |
|---|---|
| `tree-sitter-c-sharp` v0.23.1 (2024-11) | **14** |
| `tree-sitter-c-sharp` v0.23.5 (2026-04) | **15** |
| `master` (2026-09-04 기준) | 15 |

**같은 마이너 안에서 ABI 가 올라갔다.** 파이썬(0.23 → 14)·JavaScript(0.25 → 15)는 크레이트 버전 문자열로
ABI 를 짐작할 수 있었지만 C# 는 **못 한다**. `crates/parse/Cargo.toml` 이 지금 쓰는 캐럿 요구
(`tree-sitter-python = "0.23"`)를 그대로 흉내 내면 카고가 고르는 패치에 따라 14 도 15 도 된다.

→ **`tree-sitter-c-sharp = "=0.23.5"` 로 못 박고 `grammar_abi: 15` 로 적는다.** 우리 `tree-sitter = "0.25"` 는
ABI 15 를 이미 쓰고 있다(`tree-sitter-javascript = "0.25"`). 버전을 올릴 때 `grammar_abi` 를 같이 확인해야
하는 첫 문법이다.

참고로 확인한 규모: `STATE_COUNT 8495` · `SYMBOL_COUNT 542` · `EXTERNAL_TOKEN_COUNT 13` ·
**`SUPERTYPE_COUNT 9`**. 마지막 것이 쓸모 있다 — `(expression)`·`(statement)` 같은 상위 타입을 쿼리에서
바로 쓸 수 있어서, 파이썬 문법에는 없던 도구가 생긴다.

### 확장자

`.cs` 만 넣는다.

- **`.csx`(C# 스크립트)는 뺀다** — tree-sitter-c-sharp 이슈 #241 이 `#r` 지시자에서 파싱이 깨진다고 열려 있다.
- `.cshtml`·`.razor` 는 **이 문법이 아예 못 읽는다**(HTML + C# 혼합이라 별도 문법이 필요하다). Blazor 리포를
  읽으면 UI 파일이 통째로 안 잡힌다는 뜻이다.

### 파싱 함정

파이썬이 연쇄 비교(`a < b < c`)를 형제 앵커 「자식이 정확히 둘」로 잘라낸 것(D152)의 C# 대응물.

1. **전처리기 `#if` 는 조건을 평가하지 않는다.** 문법이 지시자를 노드로 읽을 뿐이라 `#if DEBUG` 안팎이
   **둘 다 트리에 남는다** — 실제로 컴파일되지 않는 코드에 사용처가 붙는다. 알려진 이슈로 중첩 전처리기가
   메서드 매개변수를 조건부로 정의하는 경우와, 조건부 애트리뷰트가 같은 블록에 없는 경우가 남아 있다.
   → **모든 개념 쿼리에 「조상에 `preproc_if` 가 없을 것」 앵커가 필요하다.** Unity 코드는 `#if UNITY_EDITOR`
   가 널려 있어 이것이 특히 물린다.
2. **제네릭 `<` 대 비교 `<`.** `a < b > (c)` 는 문법 수준에서 모호하고 C# 명세는 「제네릭 이름 해석」 규칙으로
   푼다 — 파서는 타입을 모른다. → `csharp/comparison` 쿼리는 **`(binary_expression operator: "<")` 로 앵커를
   걸어** `generic_name`/`type_argument_list` 를 배제해야 한다. 파이썬 연쇄 비교와 정확히 같은 종류의 잘라내기다.
3. **캐스트 대 괄호식.** `(x)-y` 가 캐스트인지 뺄셈인지는 `x` 가 타입인지에 달렸다. 스니펫만 보고는 못 푼다.
4. **문맥 키워드.** `var`·`record`·`async`·`await`·`nameof`·`value`·`field`(C# 14)는 예약어가 아니다.
   `var var = 1;` 이 합법이다. → `csharp/local-declaration` 쿼리에서 `var` 를 그냥 `identifier` 로 잡으면 안 된다.
5. **보간·축자·raw 문자열.** 외부 스캐너(외부 토큰 13개)가 처리하고, 보간 축자 문자열(`$@"…"`) 파싱 실패와
   raw 보간 문자열(`$"""…"""`) 하이라이트 오류가 이슈로 열려 있다. → `csharp/interpolated-string` 은
   `interpolated_string_expression` 만 잡고 raw 형은 골든으로 따로 확인한다.
6. **최상위 문.** `Program.cs` 는 클래스 없이 문이 바로 온다 — `compilation_unit` 바로 아래의
   `global_statement` 다. `_blocks.scm` 이 이것을 블록으로 잡아야 T1 코드 창이 성립한다. ASP.NET Core 모양을
   기준으로 잡았으므로 **이 노드가 첫 화면의 대부분**이다.
7. **`partial` 클래스.** Blazor·WinForms·소스 생성기가 한 타입을 여러 파일에 흩는다. 사용처 세기가 파일
   경계를 넘는다 — 지금 파이프라인이 파일 단위라 어떻게 되는지 **확인하지 않았다**.

### 아직 안 열린 세 곳 — **둘은 닫혔고 하나는 이름이 바뀌었다 (2026-09-05 재확인)**

| 파일 | 조사 때 | 지금 |
|---|---|---|
| `crates/parse/Cargo.toml` · `crates/parse/src/langs.rs` | `lang-csharp` 피처와 등록 두 줄이 없다 | **그대로 없다.** 판을 `=0.23.5` 로 못 박아야 한다(위 ABI 표) · D129 줄 예산은 **폐지됐다**(정본 §5 · D181) |
| `packages/dictionary/src/schema.ts` | `grammarSchema` 에 `csharp` 가 없다 | **열렸다. 다만 이름이 `csharp` 가 아니라 `c_sharp` 이다** — 아래 제안이 채택되지 않았다 |
| `apps/desktop/src/session-flow.ts` | `grammarOf` 가 `.cs` 를 모르고 `typescript` 로 폴백한다 | **고쳐졌다** — `.cs` → `c_sharp` |

**문법 키 제안(`csharp`)은 채택되지 않았다.** 코드가 쓰는 이름은 `c_sharp` 이고 근거가 `schema.ts`
주석에 있다(크레이트가 쓰는 키). 사전 네임스페이스는 `csharp` 그대로라, 이 언어만 **`csharp` /
`c_sharp` / `.cs`** 셋이 다 다르다. 위 §1 의 「문법 키 표」에서 `grammar` 행을 `c_sharp` 로 읽어야 한다.

**그리고 못이 없다.** `crates/parse/tests/quality.rs:130` 의 시험은 `swift`·`dart` 만 지켜서
C# 문법은 아무 경고 없이 들어올 수 있다 — 넣기 전 순서는 §0.7 에 적었다.

---

## §9 오개념 12

`misconceptions:` 와 오답 진단 `diag` 가 그대로 쓸 데이터다.

| # | 무엇을 믿나 | 실제로는 |
|---|---|---|
| 1 | `var` 는 동적 타입이라 나중에 다른 타입을 넣어도 된다 | 컴파일 시각에 타입이 정해지고 그 뒤 안 바뀐다. `var n = 0; n = "hi";` 는 CS0029 로 막힌다 |
| 2 | 나누기는 소수를 낸다 | `5 / 2` 는 `2` 다. **값이 아니라 피연산자의 타입**이 정한다 |
| 3 | 조건 자리에 아무 값이나 온다 | `bool` 만 온다. `if (count)`·`if (obj)` 는 컴파일 오류다 — 「참 같은 값」이 없다 |
| 4 | `string?` 로 적으면 `null` 이 못 들어온다 | `string` 과 `string?` 는 런타임에 **같은 타입**이다. `?` 는 컴파일러에게 하는 말이고 경고만 낸다 |
| 5 | `==` 는 언제나 내용을 견준다 | `string` 과 `record` 는 내용을, 보통의 `class` 는 **같은 객체인지**를 묻는다 |
| 6 | 객체를 넘기면 복사된다(또는 안 된다) | `class` 는 화살표만, `struct` 는 값 전체가 복사된다. 같은 `=` 가 두 일을 한다 |
| 7 | `List` 를 메서드에 넘기면 원본이 안 바뀐다 | 화살표가 가므로 `Add` 는 원본을 늘린다. 「참조를 값으로 넘긴다」와 「값을 참조로 넘긴다」는 다르다 |
| 8 | LINQ 한 줄이 그 자리에서 돈다 | `Where`·`Select` 는 계획만 만든다. `foreach`·`ToList()`·`Count()` 가 돌리고, **두 번 훑으면 두 번 돈다** |
| 9 | `async` 를 붙이면 빨라지거나 다른 스레드에서 돈다 | 기다리는 동안 스레드를 놓아 주는 것이다. `await` 전까지는 부른 스레드에서 그대로 돈다 |
| 10 | 급하면 `.Result`·`.Wait()` 로 꺼내면 된다 | UI 스레드나 구형 ASP.NET 요청 스레드에서는 **교착**한다. 이어질 코드가 그 스레드로 돌아오려는데 그 스레드가 기다리며 잠겨 있다. ASP.NET Core 에는 동기화 컨텍스트가 없어 안 터지므로 「내 웹 프로젝트에서는 됐는데」가 생긴다 |
| 11 | `Dispose`·`using` 은 메모리를 반환한다 | 메모리는 GC 가 맡는다. `Dispose` 는 파일·소켓·잠금처럼 **GC 가 모르는 자원**을 놓는 일이다 |
| 12 | 제네릭은 Java 처럼 지워진다 | 실행 시각까지 남는다. `typeof(T)`·`new T[]`·`is List<string>` 이 전부 되고, 값 타입은 타입마다 전용 코드가 나온다 |

**이 열둘은 1·2부의 것이다.** 값 층위는 ②(나누기)·③(조건 자리)·⑤(`==`)·⑥(복사) 넷뿐이고
**0부 여덟 장의 오개념은 §0.1 의 마지막 열에 따로 세웠다** — 그중 넷(`checked` 를 안 적으면
조용히 감김 · `double` 로 담은 돈 · `.Length` 가 글자 수 · `(int)` 캐스트가 안전함)은 §9 에 없던
것이고 **이 세션에서 .NET 10 으로 실행해 확인했다**(§0.4).

**출처에 대한 정직한 기록.** `progmiscon.org` 의 오개념 목록에는 Java(52)·Python(33)·Scratch(14)·
JavaScript(6)만 있고 **C# 는 없다**. C# 전용 오개념을 다룬 동료 심사 연구를 찾지 못했다 — 위 12개는
Microsoft Learn 의 언어 참조·명세와 널리 인용되는 커뮤니티 문헌을 근거로 정리한 것이고, 실측 데이터가
아니다. Java 의 52개를 그대로 옮기면 안 된다: 5번(`==`)과 12번(제네릭)은 Java 에서 **답이 반대**다.

---

## §10 근거와 출처

**확인한 것**

- Exercism C# 트랙 `config.json` — 개념 **72** · 개념 연습 **42**(내려받아 직접 셌다). 깊이 0~3 의 13개는
  그쪽 `prerequisites` 로 계산했고, 그 간선 자체는 D148 ③ 대로 가져오지 않았다.
  <https://github.com/exercism/csharp/blob/main/config.json> (MIT · © 2021 Exercism)
- `LANGUAGE_VERSION` — `src/parser.c` 를 직접 읽어 확인. v0.23.1 = 14, v0.23.5 = 15, master = 15.
  <https://github.com/tree-sitter/tree-sitter-c-sharp>
- 크레이트 판본 — `tree-sitter-c-sharp` 최신 0.23.5 (2026-04-14). <https://crates.io/crates/tree-sitter-c-sharp>
- `tree-sitter.json` — `name: c-sharp` · `file-types: [cs]` · `scope: source.cs`
- `.csx` 파싱 실패 — tree-sitter-c-sharp 이슈 #241
- TIOBE 2026-08 — C# 5위 4.09%.
  <https://www.techrepublic.com/article/news-tiobe-august-2026-java-nears-c-plus-plus/> · <https://www.tiobe.com/tiobe-index/>
- C# 14 / .NET 10 (2025-11-11, LTS) — <https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-14>
- 널 허용 참조 타입이 런타임을 안 바꾼다 —
  <https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/nullable-reference-types>
- 값 타입 대입이 복사다 — <https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/struct>
- `var` 가 정적 타입이다 —
  <https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/implicitly-typed-local-variables>
- Unity 의 C# 판 한계(레코드에 `IsExternalInit` 필요·직렬화 불가, 최상위 문 불가) —
  <https://docs.unity3d.com/2021.2/Documentation/Manual/CSharpCompiler.html> ·
  <https://discussions.unity.com/t/using-language-version-9-0-in-c-code/899992>
- ASP.NET Core minimal API 템플릿이 최상위 문을 낸다 —
  <https://learn.microsoft.com/en-us/aspnet/core/tutorials/min-web-api>
- `progmiscon.org` 에 C# 없음 — <https://progmiscon.org/misconceptions/> (문장은 가져오지 않았다)

**확인 못 한 것**

- **C# 전용 오개념 연구.** 동료 심사 문헌을 찾지 못했다. §9 는 명세와 커뮤니티 문헌 기반이다.
- **`partial` 클래스가 우리 사용처 세기에 어떻게 잡히는지.** 파이프라인이 파일 단위라 한 타입이 여러 파일에
  흩어질 때의 동작을 확인하지 않았다.
- **Unity 대 ASP.NET Core 의 리포 비율.** JetBrains 조사에서 Unity 를 주요 도구로 든 응답이 5.9% 라는 값은
  2023년 것이고 2026년 수치는 못 찾았다. §1 의 결정은 이 비율이 아니라 **파싱 가능한 파일 밀도**와
  **Unity 의 C# 9 고정**에 근거한다.
- **`grammar` 키를 `csharp` 로 할지 `c_sharp` 로 할지.** 우리 선택이고 아직 결정된 바 없다 — 기존 키가 전부
  소문자 한 낱말이라 `csharp` 를 제안한다.

---

## §11 학습법 — 이 언어를 이해한다는 것

이 파일이 680줄이라 §11 만 분리했다 → **[`csharp-learning.md`](./csharp-learning.md)**
(`java.md` → `java-learning.md` 와 같은 처리). 기계 한 문장 · Microsoft Learn 여섯 부에 클래스가
없다는 것 · T1/T2/T3 판정(통과는 `checked` 와 `==` 둘) · 자바와 C# 이 서로의 `siblings` 로 못
쓰인다는 것 · diff 일곱이 거기 있다. §0.2 의 형식 표가 `fundamentals.md` 와 어긋나 있다는 지적도
그 문서 §11.6 ②에 있다.
