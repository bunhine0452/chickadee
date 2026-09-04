# C# 커리큘럼 조사 — 네임스페이스 `csharp`

조사일 2026-09-04. 파일 하나만 쓴다(`dictionary/**` 는 건드리지 않았다).

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

## §2 기초 — 바닥 여덟

| # | id | name.ko / en | token | universal | diff | prereq | **C# 라서 다른 것** |
|---|---|---|---|---|---|---|---|
| 1 | `csharp/local-declaration` | 타입을 적고 이름 만들기 / Local declaration | `int x = 0;` | `common/variable-binding` | 1 | — | 이름을 **만드는 줄에는 낱말이 하나 더** 있다 — 타입 이름 또는 `var`. 그것이 있으면 만드는 줄, 없으면 옮기는 줄이다 |
| 2 | `csharp/assignment` | 이름에 값 다시 넣기 / Assignment | `=` | `common/reassignment` | 1 | `csharp/local-declaration` | 이름에 **타입이 붙어 있다**. `var n = 0;` 다음 `n = "hi";` 는 컴파일이 막는다(CS0029) — `var` 는 동적 타입이 아니다 |
| 3 | `csharp/boolean-literal` | 참·거짓 값 / Boolean literal | `true` `false` | `common/boolean-value` | 1 | — | C# 에는 **「참 같은 값」이 없다**. 조건 자리에 오는 것은 오직 `bool` 이라 `if (count)` 도 `if (obj)` 도 컴파일 오류다 |
| 4 | `csharp/arithmetic` | 셈하기 / Arithmetic | `+ - * / %` | `common/arithmetic` | 1 | — | `5 / 2` 가 **2** 다. 값이 아니라 **피연산자의 타입**이 정한다 — `5.0 / 2` 라야 2.5 다 |
| 5 | `csharp/comparison` | 두 값 견주기 / Comparison | `== != < >` | `common/comparison` | 1 | `csharp/boolean-literal` | `==` 가 **타입마다 다른 질문**을 한다. `string` 은 내용을, 보통의 `class` 는 같은 객체인지를 묻는다 |
| 6 | `csharp/if-statement` | 조건으로 흐름 나누기 / If statement | `if` | `common/conditional-branch` | 1 | `csharp/boolean-literal` | 중괄호가 **선택**이라 없으면 **다음 한 문장만** 딸려 온다. 들여쓰기는 아무 의미가 없다 |
| 7 | `csharp/method-declaration` | 타입 안에 메서드 만들기 / Method declaration | `int F(int a)` | `common/function-definition` | 1 | `csharp/class-declaration` | **자유 함수가 없다.** 모든 메서드는 타입 안에 살고, 이름 앞에 **반환 타입을 먼저** 적는다 |
| 8 | `csharp/return-statement` | 값 돌려주기 / Return | `return` | `common/return-value` | 1 | `csharp/method-declaration` | 값 반환 메서드에서 빠뜨리면 **컴파일이 막는다**(CS0161) — 파이썬처럼 조용히 `None` 이 가지 않는다 |

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

## §3 중심 — 16개

「이 개념이 없으면 C# 로 짠 코드를 왜 못 읽나」를 마지막 열 앞에 한 줄로 붙였다.

| # | id | name.ko / en | token | universal | diff | prereq | 없으면 못 읽는 것 / **C# 라서 다른 것** |
|---|---|---|---|---|---|---|---|
| 9 | `csharp/class-declaration` | 이름 붙인 타입 만들기 / Class declaration | `class` | **신규** `common/type-definition` | 1 | — | 모든 코드가 이 껍데기 안에 있다 · **C# 는 「함수 정의」가 뿌리가 아니다** — 그 위에 타입 선언이 한 겹 더 있다 |
| 10 | `csharp/string-literal` | 글자 값 / Text literal | `"…"` | `common/text-literal` | 1 | — | 문자열이 어디부터 어디까지인지 · **따옴표 하나가 타입을 가른다** — `"a"` 는 `string`(참조형), `'a'` 는 `char`(값형) |
| 11 | `csharp/number-literal` | 숫자 값 / Number literal | `1` `1.5m` | `common/number-literal` | 1 | — | 셈의 결과 타입 · **접미사가 타입을 정한다** — `1.0` 은 `double`, `1.0f` 는 `float`, `1.0m` 은 `decimal` 이고 돈은 `decimal` 이다 |
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

**깊이 ≤ 2 = 24/24.** TS 21/24 · 파이썬 19/24 보다 꽉 찬다. 이유는 하나다 — C# 는 뿌리가 하나 더 있다.
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

### 아직 안 열린 세 곳

| 파일 | 무엇이 없나 |
|---|---|
| `crates/parse/Cargo.toml` · `crates/parse/src/langs.rs` | `lang-csharp` 피처와 등록 두 줄이 없다 (D129 예산 영향은 5줄 안쪽) |
| `packages/dictionary/src/schema.ts:29` | `grammarSchema` 에 `csharp` 가 없다 |
| `apps/desktop/src/session-flow.ts:559` | `grammarOf` 가 `.cs` 를 모르고 `typescript` 로 폴백한다 |

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
