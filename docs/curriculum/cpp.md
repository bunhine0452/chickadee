# C++ 커리큘럼 조사 — 네임스페이스 `cpp`

조사일 2026-09-04. 산출 대상은 `dictionary/cpp/**` 이고 이 문서는 그 설계 근거다.
**C 세션이 따로 돈다** — 여기서는 「C 위에 C++ 가 무엇을 얹었나」만 다룬다. 포인터·`malloc`·전처리기는 §6 에서 `c/` 와의 관계로 처리한다.

## §1 언어 좌표

TIOBE 2026-08: **3위 8.62%**(7월 9.12%, 2위를 C 에 내줌). Python 18.53% · C 11.10% · Java 8.25% — Java 와 0.37p 차다. **C++26 이 2026-03-28 WG21 에서 완료**되어 연말 발행 예정이고 GCC 16.1 이 리플렉션·계약을 싣고 있다.
만들어지는 것: 게임 엔진(Unreal), 브라우저 엔진(Chromium), 데이터베이스(MySQL·ClickHouse), ML 런타임 커널(PyTorch), 임베디드 펌웨어, 거래 시스템.

**바이브 코딩으로 나온 C++ 코드의 생김새** — 이것이 사용처가 생길 개념을 정한다. `std::vector<T>`·`std::string` 이 배열보다 압도적으로 잦고, `std::` 가 파일당 수십 회 나오며 `using namespace std;` 와 섞인다. `for (const auto& x : xs)` 가 기본 반복인데 **`&` 를 붙였다 뺐다 한다.** 클래스 한 장에 `public:`/`private:` + 생성자 초기화 리스트, 출력은 `std::cout <<`, 예외는 `throw std::runtime_error`, 빌드는 `CMakeLists.txt`.
핵심은 **혼용**이다 — `std::make_unique` 와 raw `new`/`delete` 가 같은 파일에 나온다(LLM-HPC++ 평가도 스마트 포인터 취급이 불안정하다고 보고한다). 그래서 `alternatives`(§3 끝)가 이 언어에서 특히 많이 일한다.

| 축 | 값 |
|---|---|
| `lang` · `grammar` | `cpp` · `cpp` (크레이트 `tree-sitter-cpp`, MIT) |
| 확장자 → `cpp` | `.cpp` `.cc` `.cxx` `.c++` `.hpp` `.hh` `.hxx` `.h++` `.ipp` `.tpp` `.inl` |
| 다툼 나는 확장자 | `.h` — §8 |

`packages/dictionary/src/schema.ts:28` 의 `grammarSchema` 에 `cpp` 가 **없다.** 추가가 선결이다(`c` 도 마찬가지).

## §2 기초 — 바닥 여덟

축은 D147 이 TS·파이썬에 깐 것과 같다. 여덟 중 다섯이 문(statement) 수준이다.

| # | id | name.ko / en | token | universal | diff | prereq | 이 언어라서 다른 것 |
|---|---|---|---|---|---|---|---|
| 1 | `cpp/variable-declaration` | 자리 만들며 이름 붙이기 / Variable declaration | — | `common/variable-binding` | 1 | — | 이름 **앞에** 무엇을 담을지 적고, 초기화를 빼면 0 이 아니라 **정해지지 않은** 값으로 시작한다 — `int x;` 와 `int x{};` 가 다르다 |
| 2 | `cpp/assignment` | 이름에 값 다시 넣기 / Assignment | `=` | `common/reassignment` | 1 | 1 | **대입 자체가 값을 돌려주고**, 위 선언에 `const` 가 붙어 있으면 이 줄이 컴파일 오류가 된다 |
| 3 | `cpp/arithmetic` | 셈하기 / Arithmetic | `/` | `common/arithmetic` | 1 | — | 나누기가 **양쪽이 정수면 정수**를 낸다 — `7 / 2` 는 3 이다(파이썬은 3.5) |
| 4 | `cpp/comparison` | 견주기 / Comparison | `==` | `common/comparison` | 1 | 5 | 조건 안의 `=` 를 **막지 않는다** — 파이썬이 문법으로 잡는 실수를 경고 한 줄로 흘려보낸다 |
| 5 | `cpp/boolean-literal` | 참·거짓 값 / Boolean literal | `true` | `common/boolean-value` | 1 | — | `bool` 이 **정수로 조용히 변해** `if (count)` 가 통과한다 — 참이 하나가 아니다 |
| 6 | `cpp/if-statement` | 조건으로 흐름 나누기 / if statement | `if` | `common/conditional-branch` | 1 | 4 | 들여쓰기에 **아무 의미가 없다** — 중괄호를 빼면 다음 **한 문장만** 붙는다 |
| 7 | `cpp/function-definition` | 함수 정의하기 / Function definition | — | `common/function-definition` | 1 | — | **부르기 전에 선언이 위에 보여야** 한다 — 아래쪽 함수를 위에서 부르면 멈춘다. 헤더가 왜 있는지가 여기서 시작된다 |
| 8 | `cpp/return-statement` | 값 돌려주기 / return | `return` | `common/return-value` | 1 | 7 | 반환 타입이 있는데 `return` 을 빼면 빈 값이 오는 게 아니라 **무슨 일이 일어날지 정해져 있지 않다**(파이썬은 `None`) |

1번의 빈칸은 `=` 가 아니라 **타입 자리**(`int`/`auto`/`double`)다. `token` 이 없는 대신 `@hole` 이 거기 선다.
`4 → 6` 간선은 파이썬(`prereq: []`)과 다르게 매겼다. 파이썬은 조건 안의 `=` 를 문법이 막아 둘이 독립이지만, C++ 는 `if (x = 5)` 가 컴파일되므로 **`if` 를 읽으려면 `==` 와 `=` 의 구별이 먼저**다.

**두 절벽이 어디서 처음 부딪히나.** 「복사가 조용히 일어난다」와 「소유권을 언어가 말해 주지 않는다」는 **바닥 여덟에서 안 부딪힌다** — `int` 만 다루면 복사가 공짜고 소유할 것이 없다. 첫 충돌은 `cpp/std-string`·`cpp/std-vector`(깊이 1, 대입 한 줄이 통째로 복사)와 `cpp/reference-parameter`(깊이 2, `f(v)` 라는 호출부만 보고는 `v` 가 바뀔지 알 수 없다)다. 0장 21판(§5)은 두 절벽의 **앞턱까지**만 데려간다.

## §3 중심 — 15개

| # | id | name.ko / en | token | universal | diff | prereq | 이 언어라서 다른 것 · 없으면 왜 못 읽나 |
|---|---|---|---|---|---|---|---|
| 9 | `cpp/namespace-qualification` | 이름공간 안의 이름 / Namespace qualification | `::` | `common/member-access` | 2 | — | `.` 은 **값 안**을, `::` 는 **이름 안**을 연다. 모르면 표준 라이브러리 줄이 전부 안 읽힌다 |
| 10 | `cpp/std-string` | 글자 묶음 값 / std::string | `std::string` | `common/text-literal` | 2 | 9,1 | 문자열이 **값이라 대입하면 복사**된다 — C 의 `char*`(주소)와 정반대고 `==` 도 내용을 본다 |
| 11 | `cpp/std-vector` | 늘어나는 목록 / std::vector | `std::vector` | `common/list` | 2 | 9,1 | 값으로 넘기면 **원소 전부가 복사**된다. 이 한 줄이 C++ 성능 사고의 절반이다 |
| 12 | `cpp/range-for` | 하나씩 훑기 / Range-based for | `:` | `common/iterate` | 2 | 11 | `&` 를 빼면 **매 바퀴마다 항목이 복사**되고 안에서 고쳐도 원본이 안 바뀐다 |
| 13 | `cpp/reference-parameter` | 원본을 넘기기 / Reference parameter | `&` | *null* | 3 | 7,11 | 부르는 쪽 `f(v)` 에 **아무 표시가 없다** — 원본을 바꿀지가 정의부에만 적혀 있다 |
| 14 | `cpp/const-qualifier` | 못 바꾼다는 약속 / const | `const` | *null* | 3 | 1 | 「상수」가 아니라 **「이 이름으로는 못 만진다」**다 — 실행 중에 정해져도 되고 남이 원본을 바꾸는 것은 못 막는다 |
| 15 | `cpp/class-definition` | 값과 하는 일 묶기 / class | `class` | `common/class-definition`(신규) | 2 | 1,7 | `class` 와 `struct` 의 **유일한 차이가 기본 접근**이다(private/public). LLM 은 둘을 섞어 쓴다 |
| 16 | `cpp/constructor` | 만들어질 때 하는 일 / Constructor | — | `common/constructor`(신규) | 3 | 15 | `: x_(x)` 는 대입이 아니라 **만들기**고, 순서는 적은 순서가 아니라 **멤버 선언 순서**로 돈다 |
| 17 | `cpp/destructor` | 끝날 때 하는 일 / Destructor | `~` | *null* | 3 | 16 | **`}` 한 글자에서 아무 줄도 없이 불린다** — 모르면 정리가 어디서 일어나는지 안 보인다 |
| 18 | `cpp/auto` | 타입 말 안 하기 / auto | `auto` | `common/type-inference`(신규) | 2 | 1 | 타입이 **없는 게 아니라 안 적는** 것이고, `auto` 는 **참조와 `const` 를 떨어뜨려** `auto x = v[0]` 이 복사가 된다 |
| 19 | `cpp/smart-pointer` | 소유를 타입에 적기 / Smart pointer | `std::unique_ptr` | *null* | 4 | 17,9 | 언어가 소유권을 말해 주는 **몇 안 되는 자리** — `unique_ptr` 은 복사하려 하면 컴파일이 멈춘다 |
| 20 | `cpp/move` | 옮겨도 된다고 표시하기 / std::move | `std::move` | *null* | 4 | 19,13 | **아무것도 옮기지 않는다.** 표를 붙일 뿐이고 실제 이동은 받는 쪽이 한다 |
| 21 | `cpp/stream-output` | 밖으로 흘려보내기 / Stream output | `<<` | *null* | 2 | 9 | **비트 옮기기 기호가 출력**이 된다 — 연산자에 다른 뜻을 붙일 수 있다는 사실의 첫 노출 |
| 22 | `cpp/exception-handling` | 터진 것을 받아 잇기 / Exceptions | `catch` | `common/try-catch` | 4 | 17 | 던지면 사이의 **지역 객체 소멸자가 전부 불린다**. `catch` 에서 `&` 를 빼면 예외가 잘려 나간다 |
| 23 | `cpp/enum-class` | 정해진 값들에 이름 붙이기 / enum class | `enum class` | `common/enum`(신규) | 2 | 1 | C 의 `enum` 과 달리 **정수로 안 변하고 이름이 갇혀 있다** — `Color::Red` 로만 쓴다 |

**`alternatives` — AI 가 대신 쓴 것.** C 관용과 현대 C++ 가 한 파일에 섞인다.

| 구멍(gap) | 대신 있는 것(present) |
|---|---|
| `cpp/smart-pointer` | `cpp/new-delete` |
| `cpp/reference-parameter` | `c/pointer-parameter` |
| `cpp/range-for` | `c/for-loop` (첨자 반복) |
| `cpp/std-vector` · `cpp/std-string` | `c/array` · `c/char-pointer` |
| `cpp/namespace-qualification` | `cpp/using-namespace` |
| `cpp/const-qualifier` | `c/macro-define` (`#define` 상수) |
| `cpp/enum-class` | `c/enum` |

## §4 심화 — 8개

| # | id | name.ko / en | token | universal | diff | prereq | 이 언어라서 다른 것 |
|---|---|---|---|---|---|---|---|
| 24 | `cpp/lambda` | 그 자리에서 만든 함수 / Lambda | `[]` | `common/function-value` | 3 | 7,18,13 | 대괄호 안이 **무엇을 복사하고 무엇을 빌릴지** 적는 자리다 — `[=]` 와 `[&]` 가 복사 절벽 그 자체 |
| 25 | `cpp/template-function` | 타입 자리 비워 두기 / Function template | `template` | `common/generics` | 4 | 7,11,13 | **부르는 곳마다 함수가 새로 만들어진다** — 그래서 몸통이 헤더에 있어야 하고 오류가 쓴 줄이 아니라 만들어진 자리에서 난다 |
| 26 | `cpp/operator-overload` | 연산자에 뜻 붙이기 / Operator overloading | `operator` | `common/operator-overload`(신규) | 4 | 15,13,21 | `+` 나 `<<` 가 **무슨 일을 할지 타입이 정한다** — `std::cout << x` 가 왜 되는지의 답 |
| 27 | `cpp/virtual-override` | 같은 이름 다른 몸통 / virtual | `virtual` | `common/method-override`(신규) | 4 | 15,17 | 소멸자에 `virtual` 이 없으면 기반 포인터로 지울 때 **파생 쪽 정리가 안 불린다** |
| 28 | `cpp/new-delete` | 손으로 잡고 손으로 놓기 / new · delete | `new` | *null* | 4 | 16,17 | `malloc` 과 달리 **생성자·소멸자를 부르고**, `new[]` 는 `delete[]` 로만 놓아야 한다 |
| 29 | `cpp/rule-of-five` | 다섯을 함께 정하기 / Rule of five | — | *null* | 4 | 17,20 | 하나를 적으면 나머지 넷도 적어야 한다 — **안 적으면 컴파일러가 얕은 복사본을 대신 만든다** |
| 30 | `cpp/structured-binding` | 한 번에 꺼내 이름 붙이기 / Structured binding | `[` | `common/destructuring` | 3 | 18,11 | `auto [k, v]` 는 기본이 **복사**다 — map 을 훑으며 고치려면 `auto&` 여야 한다 |
| 31 | `cpp/std-optional` | 없을 수도 있는 값 / std::optional | `std::optional` | `common/absent-value` | 3 | 9,8 | 「없음」이 언어에 **뒤늦게** 왔다 — 그전엔 특별한 값·널 포인터·`bool` 반환이 그 일을 했고 코드에 셋 다 남아 있다 |

## §5 prereq 그래프와 0장 적재량

| 깊이 | 수 | 개념 |
|---|---|---|
| 0 | 5 | `variable-declaration` · `arithmetic` · `boolean-literal` · `function-definition` · `namespace-qualification` |
| 1 | 10 | `assignment` · `comparison` · `return-statement` · `std-string` · `std-vector` · `auto` · `const-qualifier` · `class-definition` · `stream-output` · `enum-class` |
| 2 | 6 | `if-statement` · `range-for` · `reference-parameter` · `constructor` · `structured-binding` · `std-optional` |
| 3 | 4 | `destructor` · `lambda` · `template-function` · `operator-overload` |
| 4 | 4 | `smart-pointer` · `exception-handling` · `virtual-override` · `new-delete` |
| 5–6 | 2 | `move` · `rule-of-five` |

**깊이 ≤ 2 = 21개 → 21/24.** TS 와 같은 수치, 파이썬(19/24)보다 둘 위다. 자르는 규칙이 일하지 않아 「무엇을 자를까」가 임의의 문제가 되지 않는다.

왜 21 인가. **깊이 3 의 `destructor` 아래로 사슬이 한 줄로 늘어선다** — `destructor → smart-pointer → move → rule-of-five` 가 5단이고 `exception-handling`·`virtual-override`·`new-delete` 도 전부 `destructor` 를 지난다. C++ 개념의 3분의 1이 「누가 언제 정리하는가」에 매달려 있고 뿌리가 하나다. 그래서 0장은 **소리 내어 읽을 수 있는 데까지**만 담고 소유·수명은 통째로 0장 밖이다. §2~§4 의 배열은 읽는 순서이고 적재는 깊이가 정하므로 `structured-binding`·`std-optional` 은 심화에 있어도 0장 후보다.

**사이클 둘을 끊었다.** `destructor ↔ smart-pointer` 는 `destructor` 를 앞에 둔다 — 소멸자는 문법(`~T(){}`)이고 `unique_ptr` 은 그 문법을 쓰는 라이브러리 타입이다. `move ↔ rule-of-five` 는 `move` 를 앞에 둔다 — 다섯 중 둘이 이동 생성자·이동 대입이라 `std::move` 없이는 다섯을 셀 수 없다.

**Exercism 대조** — 간선을 안 가져오는 이유(D148)가 이 언어에서 특히 선명하다. 트랙 깊이는 `functions` **8** · `pointers` 8 · `references` 7 · `vector-arrays` 6 인데 우리는 `function-definition` **0** · `reference-parameter` 2 · `std-vector` 1 이다. 트랙의 8 은 「그 연습을 열려면 앞의 연습을 풀어야 한다」이지 「함수가 배열보다 어렵다」가 아니다. 베끼면 함수 정의가 0장에 영영 못 들어간다. 깊이 0~3 목록(`basics · booleans · namespaces · includes · strings · numbers`)만 참고했다.

## §6 common/ 재사용 대 신규

**재사용 17개** — `variable-declaration`→`variable-binding` · `assignment`→`reassignment` · `arithmetic`→`arithmetic` · `comparison`→`comparison` · `boolean-literal`→`boolean-value` · `if-statement`→`conditional-branch` · `function-definition`→`function-definition` · `return-statement`→`return-value` · `namespace-qualification`→`member-access` · `std-string`→`text-literal` · `std-vector`→`list` · `range-for`→`iterate` · `exception-handling`→`try-catch` · `lambda`→`function-value` · `template-function`→`generics` · `structured-binding`→`destructuring` · `std-optional`→`absent-value`.

**재사용 17/30 (57%)** — 개념 31개 중 55%가 전이를 받는다. 파이썬은 21/30 (70%)였다. **낮은 것이 실패가 아니라 이 언어가 가르치는 것 자체다** — 나머지 45%가 「소유·수명·복사」인데 파이썬·TS 에 대응물이 없다. D148 의 「두 번째 언어부터 싸진다」가 C++ 에서는 덜 싸진다.

**신규 제안 6개** — 각각 다른 언어 최소 2개에서 성립한다.

| 신규 `common/` | 이름 ko / en | 다른 언어 근거 |
|---|---|---|
| `type-inference` | 타입을 알아서 정하기 / Type inference | Go `x := 1` · Rust `let x = 1` · Swift `let x = 1` · TS 초기화 추론 |
| `class-definition` | 값과 하는 일 묶기 / Class definition | Python · TS · Dart · Swift 전부 `class` |
| `constructor` | 만들어질 때 하는 일 / Constructor | Python `__init__` · TS `constructor` · Swift `init` · Dart 이름 있는 생성자 |
| `enum` | 정해진 값들에 이름 붙이기 / Enumeration | TS · Swift · Rust · Dart `enum` |
| `method-override` | 같은 이름 다른 몸통 / Method override | Python · TS · Dart · Swift 전부 하위 클래스 재정의 |
| `operator-overload` | 연산자에 뜻 붙이기 / Operator overloading | Python `__add__` · Swift 연산자 함수 · Rust `impl Add` |

앞의 셋은 **C++ 만의 부채가 아니다** — 지금 사전이 TS·파이썬을 다루면서도 클래스 축이 통째로 비어 있어서 안 만들어졌을 뿐이고, C++ 를 넣으면 그 구멍이 먼저 드러난다.

**`universal: null` 8개**

| `cpp/` | 전이 안 시키는 이유 |
|---|---|
| `reference-parameter` | 파이썬·TS 의 「객체는 참조로 넘어간다」는 **선택이 없는 사실**이고 C++ 의 `&` 는 **줄마다 고르는 것**이다. 전이하면 틀린 것을 옳다고 하게 된다 |
| `const-qualifier` | TS `const` 는 **이름을 다시 못 묶는다**라 이미 `common/variable-binding` 에 붙어 있다. C++ `const` 는 **이 이름으로 대상을 못 만진다**로 다른 것이다 |
| `destructor` · `smart-pointer` · `move` · `rule-of-five` | 결정적 소멸과 소유권 표기를 가진 언어가 C++·Rust 둘뿐이다. 파이썬 `__del__` 은 시점이 정해져 있지 않고 `with` 는 문법이 다르다. **Rust 사전이 들어오면 승격 재검토** |
| `stream-output` | 다른 언어에서는 함수 호출(`print`·`console.log`)이라 표면이 완전히 다르다. `common/function-call` 로 전이하면 `<<` 를 못 배운다 |
| `new-delete` | `c/malloc-free` 와 **일부러** 안 묶는다 — `new` 는 생성자를, `delete` 는 소멸자를 부른다. 그 차이가 개념의 전부인데 전이가 그것을 지운다 |

### `c/` 와의 관계 — 같은 `universal` 이 아니라 **같은 개념**

`tree-sitter-cpp` 의 `grammar.js:59` 는 `module.exports = grammar(C, { name: 'cpp', … })` 다. **C++ 문법이 C 문법을 상속한다.** `cast_expression`·`preproc_include`·`pointer_declarator` 같은 노드 이름이 C++ 파일에서 그대로 유효하다. 그래서 제안은 `universal` 공유보다 한 단계 강하다.

- 문법이 그대로인 C 개념(`c/include-directive` · `c/pointer-declaration` · `c/macro-define` · `c/for-loop` · `c/array-index` · `c/sizeof`)은 **`grammars: [c, cpp]` 로 선언한다.** 개념 하나가 두 문법에서 사용처를 낸다 — `ts` 가 `[typescript, tsx, javascript]` 를 한 개념으로 받는 것과 같은 형태다.
- 그러면 겹이 전이가 아니라 **같은 개념에 그대로 쌓인다**(3겹에서 1겹을 받는 게 아니라 쌓인 겹을 그대로 쓴다).
- **예외 = C++ 에서 의미가 바뀌는 것.** `struct` 는 C++ 에서 멤버 함수를 가질 수 있는 클래스고 `malloc`/`free` 는 생성자·소멸자를 안 부른다. 이런 것은 `cpp/` 에 따로 둔다.

**순서 위험.** `c/` 보다 `cpp/` 가 먼저 나오면 겹치는 개념을 `cpp/` 에 만들게 되고, 나중에 `c/` 로 승격할 때 `concept.is_retired` 로 은퇴시켜야 한다 — 그러면 쌓인 겹이 전이로만 이어진다. **두 세션이 같이 도는 지금이 겹치는 것을 처음부터 `c/` 에 두기 좋은 유일한 시점이다.**

## §7 `cs/` 로 밀어낼 것

문법이 아니라 기계·이론이라 쿼리로 못 잡는데, 그런데도 이 언어를 읽으려면 필요한 것들이다.

| `cs/` id | 한 줄 정의 | 필요로 하는 `cpp/` |
|---|---|---|
| `stack-and-heap` | 블록이 끝나면 사라지는 자리와, 놓을 때까지 남는 자리 | `destructor` · `new-delete` · `smart-pointer` |
| `value-vs-reference` | 값 그 자체를 담는가, 값이 있는 곳을 담는가 | `reference-parameter` · `std-vector` · `auto` |
| `object-lifetime` | 만들어진 때부터 지워질 때까지, 그리고 누가 지우는가 | `destructor` · `smart-pointer` · `move` |
| `undefined-behavior` | 규칙을 어기면 오류가 아니라 **무엇이 일어날지 정해져 있지 않다** | `variable-declaration` · `arithmetic` · `return-statement` |
| `compile-and-link` | 여러 파일이 하나의 실행 파일이 되는 과정. 선언과 정의가 왜 다른가 | `function-definition` · `template-function` |
| `integer-representation` | 정수는 자리 수가 정해져 있고 넘치면 돈다 | `arithmetic` |
| `floating-point` | 소수는 근사값이라 `0.1 + 0.2` 가 `0.3` 이 아니다 | `arithmetic` |
| `memory-layout` | 값들이 메모리에 이어 놓인다 — `std::vector` 가 빠른 이유 | `std-vector` |
| `amortized-cost` | `push_back` 이 대개 싸고 가끔 전체를 옮긴다 | `std-vector` |
| `character-encoding` | `std::string` 은 **바이트 열이지 글자 열이 아니다** — 한글 한 글자가 3바이트 | `std-string` |
| `dynamic-dispatch` | 어느 몸통이 불릴지 실행할 때 정해진다 | `virtual-override` |

`cs/character-encoding` 은 실전 우선순위가 높다. 한국어 사용자가 `s.length()` 를 처음 재는 순간 부딪힌다.

## §8 tree-sitter 현실

크레이트 `tree-sitter-cpp` **0.23.4**(최신 릴리스, 2024-11-11) · **`grammar_abi: 14`** · `STATE_COUNT 11734` · `SYMBOL_COUNT 570`(master).

**ABI 는 릴리스 태그에서 읽는다.** master 의 `src/parser.c` 는 **15**, 릴리스 `v0.23.4` 는 **14** 다. 파이썬도 같고(master 15, `v0.23.6` 14, `_lang.yaml` 은 14) 크레이트를 `"0.23"` 으로 고정하므로 봐야 하는 곳은 태그다.

```
curl -sL https://raw.githubusercontent.com/tree-sitter/tree-sitter-cpp/v0.23.4/src/parser.c \
  | grep -m1 LANGUAGE_VERSION      # → #define LANGUAGE_VERSION 14
```

`tree-sitter-c` 는 최신 릴리스 **v0.24.2**(2026-04)가 **ABI 15**, `v0.23.6` 이 14 다. **C 세션과 값이 갈릴 수 있으니 서로 확인할 것.**

### 파싱 함정 넷

**① 템플릿 각괄호 대 비교 연산자.** 문법 자신의 시험 파일 `test/corpus/ambiguities.txt` 가 예제 줄에 `// No way to tell` 이라고 적어 둔 자리다.

| 입력 | 나오는 트리 |
|---|---|
| `T1 a = b < c > d;` | 중첩 `binary_expression` — **비교로 읽는다** |
| `T2 e = f<T3>(g);` | `call_expression(template_function(identifier, template_argument_list), argument_list)` |
| `int a = std::get<0>(t);` | 같은 모양 + `qualified_identifier` |

판정은 `template_argument_list` 안의 `prec.dynamic(3/2/1)` — 확정 규칙이 아니라 **가중치**다.
→ **`cpp/comparison` 쿼리는 `==` · `!=` · `<=` · `>=` 넷으로 제한하고 `<` · `>` 단독은 사용처에서 뺀다.** 파이썬이 연쇄 비교를 형제 앵커로 잘라낸 것과 같은 결이다(D152). 잃는 것이 없다 — 교육 목표는 「`=` 와 `==`」이고 `==` 만으로 다 선다.

**② 가장 성가신 파싱(vexing parse).** C++ 가 `init_declarator` 를 세 모양으로 늘려 놓았고(`grammar.js:522`) 셋째가 함수 선언과 표면이 같다.

| 입력 | 나오는 트리 |
|---|---|
| `T1 a(T2 *b);` | `declaration → function_declarator` — **함수 선언** |
| `T7 f(g.h);` | `declaration → init_declarator + argument_list` — **변수 초기화** |
| `T6 i{j};` | `declaration → init_declarator + initializer_list` |

→ **`cpp/variable-declaration` 쿼리는 `= 값` 과 `initializer_list` 두 모양만 잡고 `argument_list` 모양은 잡지 않는다.** 문법이 스스로 못 가르는 것을 사전이 가르는 척하지 않는다.
**확인 필요(추정):** `Widget w(x);` 처럼 인자가 식별자 하나일 때가 corpus 에 없다. 위 둘은 인자가 「타입 + 선언자」인지로 갈렸으므로 `w(x)` 는 변수 쪽일 것으로 보이지만 **확인하지 않았다.** `crates/parse/tests/` 사전 시험에 한 줄 넣어 트리를 찍으면 바로 갈린다.

**③ 캐스트 네 가지에 전용 노드가 없다.** `static_cast<int>(x)` 외 셋은 `call_expression(template_function(identifier "static_cast", …))` 로 오는데 `f<T>(g)` 와 **완전히 같은 모양**이다(C 스타일 `(int)x` 는 `cast_expression`, 함수형 `int(x)` 는 `call_expression`). 노드 종류만으로는 못 가르고 **식별자 텍스트를 `#eq?` 로 걸러야** 하는데 그러면 다른 쿼리들과 규칙이 어긋난다. **그래서 캐스트를 개념 목록에 넣지 않았다** — 넣으려면 `#eq?` 예외를 결정 등록부에 먼저 올릴 것.

**④ 전처리기는 실행되지 않는다.** `#ifdef` 로 갈린 코드의 **양쪽이 다 파싱된다** — 실제로는 한쪽만 컴파일되는데 사용처는 양쪽에서 난다. 매크로 본문(`preproc_arg`)은 정규식 토큰 하나로 통째 삼켜져 **안이 안 보이므로** 매크로 안의 C++ 코드는 사용처가 0이다. LLM 코드에 매크로가 드물어 손해는 작지만 C 세션과 규칙을 맞춰야 한다.

### 시스템 쿼리와 `.h`

`_blocks.scm` 은 `function_definition` · `class_specifier` · `struct_specifier` · `namespace_definition`. **확인 필요:** 클래스 안 인라인 메서드가 `function_definition` 인지 `inline_method_definition` 인지(문법 규칙 목록에 후자가 있다). `_imports.scm` 은 `preproc_include` 의 `path:`(`system_lib_string`·`string_literal` 둘 다) — C++20 `import_declaration` 은 실코드에 드물어 미룬다.
**헤더와 소스가 같은 함수를 두 번 센다** — `void f(int);`(헤더)와 `void f(int) { … }`(소스)는 다른 파일의 다른 사용처다. `cpp/function-definition` 은 **`function_definition` 노드만** 잡고 `declaration` 안의 `function_declarator` 는 잡지 않는다.

**`.h` 를 어느 문법으로 읽나.** 비대칭이 답을 정한다 — C 문법으로 C++ 헤더를 읽으면 템플릿·네임스페이스·클래스가 통째로 ERROR 지만, C++ 문법으로 C 헤더를 읽으면 대개 통과한다(`restrict` 처럼 어긋나는 것은 소수다). → **제안: `.h` 는 리포에 `.cpp` 류가 하나라도 있으면 `cpp`, 아니면 `c`.** TS 가 「`.ts` 를 TSX 로 읽지 않는다」를 오파싱 근거로 정한 것과 같은 자리이고 **C 세션과 합의가 필요한 유일한 항목**이다.

**C++26** 리플렉션(`^^T`)·splice(`[: :]`) 노드는 master 에만 있고 0.23.4 에는 없다 — 만나면 ERROR 다. GCC 16.1 이 이미 싣고 있으니 시계는 돌지만 2026년 바이브 코딩 산출물에는 아직 안 나온다.

## §9 오개념

| # | 무엇을 믿나 | 실제로는 |
|---|---|---|
| 1 | `std::move(x)` 가 x 를 옮긴다 | 아무것도 옮기지 않는다. 「가져가도 된다」는 표를 붙일 뿐이고 옮기는 일은 받는 쪽 생성자가 한다. 아무 데도 안 주면 x 는 그대로다 |
| 2 | 큰 객체를 함수에 넘기면 주소만 간다 | 매개변수에 `&` 가 없으면 **통째로 복사**된다. 파이썬·자바에서 온 사람이 가장 많이 부딪히는 자리 |
| 3 | `&` 는 「주소를 얻는다」다 | 선언에 붙은 `&`(참조 타입)와 식에 붙은 `&`(주소 연산자)는 다른 것이다. 같은 글자가 자리에 따라 뜻이 바뀐다 |
| 4 | `delete p;` 가 p 를 지운다 | p 는 그대로 남고 가리키던 메모리만 돌려준다. p 는 이제 쓸 수 없는 주소를 들고 있다 |
| 5 | 소멸자·복사 생성자를 안 쓰면 아무 일도 안 일어난다 | 컴파일러가 대신 만든다. 자동 복사는 **얕은 복사**라 포인터 멤버가 있으면 두 객체가 같은 것을 가리키고 **둘 다 지운다** |
| 6 | 기반 클래스 포인터로 `delete` 하면 파생 소멸자가 불린다 | 소멸자에 `virtual` 이 없으면 안 불린다. 조용히 샌다 |
| 7 | 값 매개변수에 파생 객체를 넘기면 그대로 간다 | 기반 클래스 크기만큼만 복사되고 나머지가 잘린다. `catch (std::exception e)` 도 같은 자리다 |
| 8 | `7 / 2` 는 3.5 다 | 양쪽이 정수면 정수 나누기라 3 이다. 파이썬을 먼저 배운 사람이 반드시 겪는다 |
| 9 | `if (x = 5)` 는 비교다 | 대입이고, 결과 5 가 참으로 읽혀 조건이 늘 참이다. 컴파일은 통과한다 |
| 10 | `int x;` 는 0 이다 | 지역 변수는 아무 값이나 들고 있다. 0 이 되는 것은 `int x{};` 다 |
| 11 | `v2 = v1;` 뒤에 v2 를 고치면 v1 도 바뀐다 | `std::vector`·`std::string` 은 대입이 복사라 v1 은 그대로다. 파이썬 리스트 습관이 정반대로 작동한다 |
| 12 | `auto` 는 타입이 없다 / 동적 타입이다 | 컴파일러가 오른쪽을 보고 정할 뿐 정해지면 안 바뀐다. 그리고 **참조와 `const` 를 떨어뜨려** `auto x = v[0]` 이 복사가 된다 |

5·7 은 입문 C++ 교재 절반이 얕은/깊은 복사를 다루지 않는다는 조사(Bruce-Lockhart & Norvell, ACM inroads)에 대응하고, 2·3 은 Milne & Rowe(2002, 학생·교원 66명, C++ 대상)에서 포인터·참조가 가장 어려운 항목으로 나온 자리다. 나머지는 문헌이 아니라 **언어 명세와 컴파일러 동작에서 직접 나온 사실**이다.
**progmiscon.org 에는 C++ 가 없다** — Java·JavaScript·Python·Scratch 넷뿐이다. 이 언어에는 인용할 카탈로그 자체가 없다.

## §10 근거와 출처

**확인함**

| 무엇 | 어디 |
|---|---|
| Exercism C++ `config.json`(MIT · © 2021 Exercism) — 개념 20 · 개념 연습 15 · 연습문제 86, 트랙 깊이(§5 에서 계산) | `raw.githubusercontent.com/exercism/cpp/main/config.json` |
| `LANGUAGE_VERSION` 14(v0.23.4) / 15(master) · `grammar(C, …)` 상속(`grammar.js:59`) · `init_declarator` 세 모양(`:522`) · 모호성 트리(`test/corpus/ambiguities.txt`) | `github.com/tree-sitter/tree-sitter-cpp` |
| `tree-sitter-c` v0.24.2 = ABI 15, v0.23.6 = ABI 14 | `github.com/tree-sitter/tree-sitter-c` |
| TIOBE 2026-08 순위·비율 | techrepublic.com `news-tiobe-august-2026-java-nears-c-plus-plus` |
| C++26 완료(2026-03-28) · GCC 16.1 | herbsutter.com 2026-03-29 트립 리포트 · isocpp.org/blog/2026/04/gcc-16.1 |
| progmiscon.org 언어 목록에 C++ 없음(Java·JS·Python·Scratch) | progmiscon.org |
| `grammarSchema` 에 `cpp` 없음 | `packages/dictionary/src/schema.ts:28` |

**확인 못 함**

- `Widget w(x);` 의 실제 파싱 결과(§8 ②). corpus 에 없다 — 사전 시험에 한 줄 넣어 찍어야 한다.
- 클래스 안 인라인 메서드가 `function_definition` 인지 `inline_method_definition` 인지.
- 0.23.4 의 파싱 시간·메모리. `STATE_COUNT` 가 우리가 쓰는 문법 중 가장 커서 `ingest.file_p95` 예산에 걸릴 수 있다. 실측 안 함.
- LLM C++ 산출물의 관용 분포(스마트 포인터 대 raw `new` 비율). LLM-HPC++(arXiv 2512.17023)이 「스마트 포인터를 자주 잘못 다룬다」고 보고하지만 **비율 수치는 확인 못 했다** — §1 의 「혼용한다」는 그 논문의 정성 서술과 이 문서 저자의 관찰이다.
- Milne & Rowe(2002)·Bruce-Lockhart & Norvell 은 초록·2차 인용으로만 확인했고 **원문 전문은 안 읽었다.**
