# C 커리큘럼 조사 — 네임스페이스 `c`

조사일 2026-09-04. 근거는 §10. 「확인 못 함」은 확인 못 함이라고 적었다.

## §1 언어 좌표

TIOBE 2026-08 **2위 · 11.10% · 전년 대비 +2.07p** — 상위 5개 중 유일하게 오른 언어다
(1위 Python 18.53% −7.61p, 3위 C++ 8.62%). 만들어지는 것: 커널·드라이버·펌웨어, MCU
코드(ESP-IDF·STM32 HAL), 다른 언어의 런타임 자체(CPython·Node), SQLite·ffmpeg·git.

### 바이브 코딩으로 이 언어가 나오는가 — 얇다

이 앱은 사용자 리포를 읽으므로 물을 것은 「LLM 이 C 를 쓰는가」가 아니라 「그 리포에 `.c` 가 왜
있는가」다.

| 자리 | 생김새 | 사용처 |
|---|---|---|
| 임베디드·MCU | `while(1)` 주 루프, 레지스터 비트 연산, HAL 호출 | 두껍다 |
| 파이썬 확장 모듈 | `setup.py` 옆 `*.c`, `PyObject*` | 얇다(1~3장) |
| CS 수업·알고리즘 | 한 장짜리 `main.c`, `printf`·배열·`for` | 얇지만 밀도는 높다 |
| 작은 CLI·툴 | `argc/argv`, `malloc`/`free`, `struct` | 중간 |
| **벤더링된 남의 C** | `sqlite3.c` 통합본, `stb_*.h` | **세면 안 된다** |

마지막 줄이 실무 위험이다 — `sqlite3.c` 한 장이 25만 줄이라 사용처 수를 통째로 뒤집는다.
`file.skip_reason 'generated'` 가 스키마에 이미 있으니 C 를 붙일 때 통합본·벤더 판정을 먼저 세운다.

**그래서 0장이 짧아진다.** `zeroChapterPlates` 는 `bestSiteOf(id) === null` 인 개념을 **버린다**
(D137). 사용처가 얇으면 합성이 늘어나는 게 아니라 **판 수가 준다** — 합성 판도 예고할 사용처가
리포에 있어야 만들어지기 때문이다. D154 가 연 「사용처 없는 새 판」 길은 큐 쪽이고 0장은 안 쓴다.
결론: C 의 바닥 여덟은 **한 장짜리 `main.c` 안에 다 들어 있는 것**으로 골라야 한다.

| 항목 | 값 |
|---|---|
| `lang` / `grammar` | `c` / `c` (D19) |
| 크레이트 | `tree-sitter-c` **0.24.2** (2026-04-22) |
| `grammar_abi` | **15** (측정 — §8) |
| `extensions` | `c: [.c, .h]` — `.h` 는 C++ 와 겹친다(§8) |

`grammarSchema`(`schema.ts:29`)에 `c` 가 **없고** `crates/parse` 에 크레이트 의존이 **없다**.
파이썬은 둘 다 이미 있었다(D152 「막는 것은 `.scm` 하나뿐」). C 는 그 전제가 안 선다.

---

## §2 기초 — 바닥 여덟

| # | id | name.ko / en | token | universal | diff | prereq | **C 라서 다른 것** |
|---|---|---|---|---|---|---|---|
| 1 | `c/declaration` | 타입 적고 이름 만들기 / Declaration | `int x = 0` | `common/variable-binding` | 1 | — | **타입 이름이 「만드는 낱말」이다.** `int x = 0;` 은 만들고 `x = 0;` 은 옮긴다. 파이썬은 둘이 같은 모양이고(D152 ⓐ) TS 는 `const`/`let` 으로 가른다 |
| 2 | `c/assignment` | 이름에 값 다시 넣기 / Assignment | `=` | `common/reassignment` | 1 | `c/declaration` | **조건 안의 `=` 를 막지 않는다.** `if (x = 0)` 이 컴파일된다(경고만). 파이썬은 같은 자리를 문법 오류로 막는다 — 정확히 반대 |
| 3 | `c/arithmetic` | 셈하기 / Arithmetic | `/` | `common/arithmetic` | 1 | — | **양쪽이 정수면 나누기도 정수다.** `7/2` 가 3 이다. 파이썬은 딱 떨어져도 소수를 낸다 — 정확히 반대 |
| 4 | `c/comparison` | 견주기 / Comparison | `==` | `common/comparison` | 1 | `c/arithmetic` | **견준 결과가 참·거짓이 아니라 `int` 0 또는 1 이다.** `int ok = (a == b);` 가 성립하고, 그래서 조건 자리에 숫자가 그대로 온다 |
| 5 | `c/if-statement` | 조건으로 갈라 실행하기 / if statement | `if` | `common/conditional-branch` | 1 | — | **들여쓰기가 아무 의미도 없고 중괄호도 안 써도 된다.** 중괄호 없는 `if` 에는 **다음 한 문장만** 딸려 눈에 보이는 묶음과 실제 묶음이 갈라진다. 파이썬은 들여쓰기가 의미다(D152 ⓑ) |
| 6 | `c/while-loop` | 조건이 참인 동안 되풀이 / while loop | `while` | `common/loop-while` | 2 | `c/comparison` | **조건 자리가 「참이냐」가 아니라 「0 이 아니냐」다.** `while (n--)` 이 도는 이유이고 `while (1)` 이 관용구인 이유다 |
| 7 | `c/function-definition` | 함수 정의 / Function definition | `int f(void)` | `common/function-definition` | 1 | — | **돌려줄 것의 타입을 이름 앞에 먼저 적는다.** 안 돌려주면 `void` 라고 적어야 한다 — 「없음」에 이름이 있다 |
| 8 | `c/return-statement` | 값 돌려주기 / return statement | `return` | `common/return-value` | 1 | `c/function-definition` | **안 적으면 조용히 쓰레기가 간다** — 파이썬은 조용히 `None` 이 간다(D152). `main` 의 값은 프로그램의 종료 코드라 셸이 읽는다 |

**참·거짓 값이 여기 없다.** TS·파이썬은 둘 다 `boolean-literal` 을 바닥에 넣었지만 C 에는 참·거짓
타입이 없다 — `true`/`false` 는 `<stdbool.h>` 가 주는 매크로이고 관용구는 여전히 `0`/`1` 이다.
그 자리를 `declaration`/`assignment` 분리에 줬다. 파이썬이 둘을 **합친** 것(D152 ⓐ)과 거울이다:
파이썬은 언어가 안 가르므로 안 갈랐고, C 는 언어가 가르므로 가른다.

---

## §3 중심 — 16

| # | id | name.ko / en | token | universal | diff | prereq | **C 라서 다른 것 / 없으면 못 읽는 것** |
|---|---|---|---|---|---|---|---|
| 9 | `c/number-literal` | 숫자 값 | `0` | `common/number-literal` | 1 | — | **적는 모양이 타입을 정한다** — `1`·`1.0`·`1u`·`1L`. `7/2` 가 3인 이유가 여기서 시작한다 |
| 10 | `c/string-literal` | 글자 값 | `"…"` | `common/text-literal` | 1 | — | **문자열이 타입이 아니라 관습이다.** `"hi"` 는 끝의 `\0` 까지 3칸이고 길이는 아무 데도 안 적혀 있다. 없으면 `strlen`·버퍼 계산이 안 읽힌다 |
| 11 | `c/char-literal` | 글자 하나 값 | `'a'` | null | 1 | `c/number-literal` | **`'a'` 는 글자가 아니라 숫자 97 이다.** `"a"` 와 다르다. 없으면 `c - '0'` 이 마술로 보인다 |
| 12 | `c/function-call` | 함수 부르기 | `f(x)` | `common/function-call` | 1 | `c/function-definition` | **부르려면 컴파일러가 먼저 알아야 한다.** `printf` 는 언어가 아니라 `stdio.h` 가 준다. 없으면 `#include` 가 왜 필요한지 못 읽는다 |
| 13 | `c/truthiness` | 0 이 아니면 참 | `if (p)` | `common/truthiness` (신규) | 2 | `c/comparison`·`c/number-literal` | **참·거짓 타입이 없어 조건은 「0 이냐」만 본다.** `if (p)`·`if (!n)`·`while (*s)` 가 전부 이 규칙 하나다 |
| 14 | `c/for-loop` | 세어 가며 되풀이 | `for` | `common/counted-loop` (신규) | 2 | `c/assignment`·`c/comparison` | **한 줄의 세 칸이 각각 다른 때에 돈다** — 처음 한 번, 매 바퀴 앞, 매 바퀴 뒤. `i <= n` 하나로 배열 밖을 읽는다 |
| 15 | `c/array-declaration` | 칸이 정해진 목록 | `int a[3]` | `common/list` | 1 | `c/declaration`·`c/number-literal` | **칸 수가 타입의 일부이고 아무도 범위를 안 본다.** `a[5]` 가 컴파일되고 돌아간다 |
| 16 | `c/pointer-declaration` | 자리를 담는 이름 | `int *p` | `common/reference-type` (신규) | 2 | `c/declaration` | **`*` 가 타입 쪽이 아니라 이름 쪽에 붙는다.** `int *p, q;` 에서 `q` 는 포인터가 **아니다**(§8 측정) |
| 17 | `c/address-of` | 값의 자리 얻기 | `&x` | `common/take-address` (신규) | 2 | `c/pointer-declaration` | **값을 넘기면 복사가, 자리를 넘기면 원본이 간다.** `scanf("%d", &n)` 이 `&` 를 요구하는 이유 하나로 C 의 호출 규약이 설명된다 |
| 18 | `c/dereference` | 자리를 열어 값 꺼내기 | `*p` | `common/dereference` (신규) | 2 | `c/pointer-declaration` | **같은 `*` 가 선언에서는 「포인터다」, 식에서는 「열어라」다.** 노드 종류가 아예 다르다(§8 측정) |
| 19 | `c/null-check` | 없는 자리인지 보기 | `NULL` | `common/absent-value` | 2 | `c/pointer-declaration`·`c/if-statement` | **`NULL` 은 낱말이 아니라 헤더가 주는 매크로**이고 「없음」이 아니라 0번지라 `if (p)` 로도 같은 검사가 된다 |
| 20 | `c/struct-definition` | 값 여럿 묶어 새 이름 붙이기 | `struct` | `common/record-type` (신규) | 2 | `c/declaration` | **struct 는 값이라 대입하면 통째로 복사된다.** 파이썬·JS 객체는 참조가 복사된다 — 정확히 반대 |
| 21 | `c/member-access` | 안의 이름 꺼내기 | `->` | `common/member-access` | 2 | `c/struct-definition`·`c/dereference` | **점이냐 화살이냐가 왼쪽이 값이냐 자리냐로만 정해진다.** `p->x` 는 `(*p).x` 의 줄임이다 |
| 22 | `c/sizeof` | 몇 바이트인지 묻기 | `sizeof` | null | 2 | `c/declaration` | **값이 아니라 타입에 묻고 답이 컴파일할 때 정해진다.** `sizeof(x++)` 는 `x` 를 안 늘린다 |
| 23 | `c/array-decay` | 배열이 주소로 바뀌기 | `f(a)` | null | 3 | `c/array-declaration`·`c/address-of`·`c/function-call` | **함수에 배열을 넘기면 첫 칸 주소만 간다.** 함수 안의 `sizeof(a)` 는 배열 크기가 아니다 — 길이를 따로 넘기는 관용구가 여기서 나온다 |
| 24 | `c/malloc-free` | 빌리고 돌려주기 | `malloc` | null | 3 | `c/pointer-declaration`·`c/dereference`·`c/sizeof` | **돌려주는 일을 언어가 안 한다.** 이 앱의 10개 언어 중 이걸 사람에게 맡기는 것은 C 뿐이다 |

---

## §4 심화 — 10

앞의 아홉은 **한 파일 안**의 이야기이고, 여기부터는 **파일 바깥**과 **기계**다.

| # | id | name.ko / en | token | universal | diff | prereq | **C 라서 다른 것** |
|---|---|---|---|---|---|---|---|
| 25 | `c/header-include` | 다른 파일을 그 자리에 붙여 넣기 | `#include` | null | 2 | `c/function-call` | **import 가 아니라 글자 복사다.** 두 번 넣으면 정의가 두 번 생기고, 그걸 막으려고 모든 헤더 첫 줄에 `#ifndef` 가 붙는다 |
| 26 | `c/function-prototype` | 먼저 알리고 나중에 채우기 | `int f(int);` | null | 3 | `c/function-definition`·`c/header-include` | **같은 함수가 두 번 적힌다.** 선언만 있고 정의가 없으면 컴파일은 통과하고 **링크에서** 터진다 — 오류가 나는 단계가 다르다 |
| 27 | `c/const` | 못 고치게 표시하기 | `const` | null | 3 | `c/declaration`·`c/dereference` | **`*` 어느 쪽에 적느냐로 잠기는 대상이 바뀐다** — `const char *s` 는 글자를, `char * const s` 는 이름을 잠근다 |
| 28 | `c/typedef` | 타입에 별명 붙이기 | `typedef` | null | 3 | `c/struct-definition` | **새 타입이 아니라 이름 하나 더다.** 그런데 그 이름이 생기면 **뒤 문장의 파싱이 바뀐다**(§8) |
| 29 | `c/macro-define` | 컴파일 전에 글자 바꿔치기 | `#define` | null | 3 | `c/header-include` | **함수가 아니라 글자 치환이라** `MAX(i++, j)` 가 `i` 를 두 번 늘린다. tree-sitter 는 매크로 몸통을 파싱하지 않는다(§8) |
| 30 | `c/conditional-compilation` | 갈래 하나만 컴파일하기 | `#ifdef` | null | 4 | `c/macro-define` | **한 파일에 두 갈래가 다 적혀 있는데 하나만 컴파일된다.** 어느 쪽이 사는지는 빌드 옵션이 정한다 — §8 의 가장 큰 함정 |
| 31 | `c/function-pointer` | 함수를 값으로 담기 | `(*f)()` | `common/function-value` | 4 | `c/dereference`·`c/function-call` | **선언이 안에서 밖으로 읽힌다.** `int (*f)(int)` 는 「`f` 는 포인터, 가리키는 것은 `int` 하나 받아 `int` 를 내는 함수」다 |
| 32 | `c/static-storage` | 파일 안에만 두거나 값을 남기기 | `static` | null | 3 | `c/declaration`·`c/function-definition`·`c/header-include` | **같은 낱말이 자리에 따라 다른 일을 한다** — 맨 바깥에서는 「이 파일 밖에서 안 보임」, 함수 안에서는 「부를 때마다 값이 남음」 |
| 33 | `c/integer-promotion` | 작은 타입이 int 로 올라가기 | `(int)` | null | 2 | `c/arithmetic`·`c/char-literal`·`c/sizeof` | **셈하기 전에 타입이 조용히 바뀐다.** `int` 와 `unsigned` 를 견주면 `-1 > 1u` 가 참이 된다. Go·Rust 는 암묵 변환을 막는다 |
| 34 | `c/undefined-behavior` | 규격이 답을 안 정한 자리 | — | null | 4 | `c/dereference`·`c/array-decay`·`c/integer-promotion` | **틀리면 멈추는 게 아니라 컴파일러가 무엇을 해도 되는 상태가 된다.** 최적화가 검사 코드를 지우는 일이 실제로 일어난다 |

---

## §5 prereq 그래프와 0장 적재량

깊이는 후보 집합 안에서 잰다(`prereqDepth`). 사이클은 없다 — 만들지 않았다.

| 깊이 | 수 | 개념 |
|---|---|---|
| 0 | 6 | `declaration` `arithmetic` `if-statement` `function-definition` `number-literal` `string-literal` |
| 1 | 9 | `assignment` `comparison` `return-statement` `char-literal` `function-call` `array-declaration` `pointer-declaration` `struct-definition` `sizeof` |
| 2 | 9 | `while-loop` `truthiness` `for-loop` `address-of` `dereference` `null-check` `header-include` `typedef` `integer-promotion` |
| 3 | 8 | `member-access` `array-decay` `malloc-free` `const` `function-prototype` `macro-define` `static-storage` `function-pointer` |
| 4 | 2 | `conditional-compilation` `undefined-behavior` |

**깊이 ≤ 2 = 24개**, 상한이 정확히 24 다(`ZERO_CHAPTER_MAX`). TS 21/24 · 파이썬 19/24 였으니
C 가 처음으로 천장에 닿는다. `zero-chapter.ts` 가 깊이 2 를 고른 근거는 「후보가 상한 언저리에
오게 두어 무엇을 자를까가 임의의 문제가 되지 않게」인데 C 는 그 조건을 만족한다 — 자를 것이 0장.

**왜 24인가.** 뿌리가 여섯이라 넓고(문자열·숫자가 뿌리로 서고, 타입이 선언의 일부라 `sizeof`·
`struct`·포인터 선언이 전부 깊이 1), 포인터 4형제 중 셋이 깊이 2 에서 멈춘다. 포인터가 0장에
들어온다는 뜻이고 그게 맞다 — 포인터 없이 읽히는 C 코드가 거의 없다.

주의 둘. ① `essential` 에 이 24개를 다 적어야 한다 — `zeroChapterPlates` 는 `essential` 밖을
안 본다(파이썬 8개, TS 30개). ② **깊이가 어려움을 재지 않는다.** `c/integer-promotion` 이
깊이 2 인데 선행이 얕을 뿐 실제로는 C 에서 가장 자주 무는 자리다. 큐 순위(02 §6.2)는 깊이·미지·
사용처 수·id 만 보고 `difficulty` 를 안 본다 — 정수 승격이 0장 후반에 뜨는 것이 옳은지는
**사용자 결정이 필요한 자리**다.

---

## §6 `common/` 재사용 대 신규

### 재사용 — 기존 30개 중 15개 (50%)

`declaration`→`variable-binding` · `assignment`→`reassignment` · `arithmetic`→`arithmetic` ·
`comparison`→`comparison` · `if-statement`→`conditional-branch` · `while-loop`→`loop-while` ·
`function-definition`→`function-definition` · `return-statement`→`return-value` ·
`number-literal`→`number-literal` · `string-literal`→`text-literal` · `function-call`→`function-call` ·
`array-declaration`→`list` · `null-check`→`absent-value` · `member-access`→`member-access` ·
`function-pointer`→`function-value`.

**파이썬 21/30(75%) → C 15/30(50%).** D148 의 「두 번째 언어부터 싸진다」가 **언어가 같은 종류일
때만** 참이라는 것이 수치로 나온다. 안 쓰인 15개 중 13개는 C 에 문법이 없고(`map-transform`·
`filter-select`·`destructuring`·`optional-chaining`·`try-catch`·`generics`·`async-await` 등),
`boolean-value` 는 타입이 없다(§2). `conditional-expression`(`? :`)은 C 에도 있지만 뺐다 —
찾은 C 고유 사실이 「양쪽이 usual arithmetic conversions 를 거친다」뿐이고 그건
`c/integer-promotion` 의 되풀이라 규칙 ①을 못 넘는다.

### 신규 제안 — 6개

**이 앱의 언어 집합 안에서** 최소 2개 언어에 성립하는지로 판정했다.

| 새 id | name.ko / en | 다른 언어 근거 |
|---|---|---|
| `common/counted-loop` | 세어 가며 되풀이 / Counted loop | Go `for i := 0; i < n; i++`(C 와 같은 세 칸) · 파이썬 `range(n)` · JS 고전 `for` |
| `common/truthiness` | 참·거짓 아닌 값이 조건에 오기 / Truthiness | 파이썬 `if xs:` · JS `if (s)`. 무엇이 거짓인지는 다르지만 개념은 같다 |
| `common/take-address` | 값의 자리 얻기 / Take address | Go `p := &x` · Rust `let r = &x` |
| `common/dereference` | 자리를 열어 값 꺼내기 / Dereference | Go `*p` · Rust `*r` |
| `common/reference-type` | 값이 아니라 자리를 담는 타입 / Reference type | Go `var p *T` · Rust `let r: &T` |
| `common/record-type` | 값 여럿 묶어 새 타입 만들기 / Record type | Go `type P struct` · Rust `struct P` · Swift `struct` |

파이썬이 새 보편 7개를 냈으니(D152) 6개는 같은 결이다.

### `universal: null` — 전이할 데가 없는 것 13개

`char-literal`(`'a'` 가 `int` 인 것은 C 뿐) · `sizeof` · `array-decay`(Go 슬라이스도 Rust 배열도
붕괴 안 한다) · `malloc-free`(수동 해제가 C 뿐) · `header-include`(글자를 복사하는 모듈 시스템) ·
`function-prototype` · `const` · `typedef` · `macro-define` · `conditional-compilation` ·
`static-storage` · `integer-promotion`(Go·Rust 는 암묵 변환을 막는다) · `undefined-behavior`.

`conditional-compilation` 은 Rust `#[cfg]`·Go 빌드 태그라는 대응물이 있어 보편 후보로 봤다가
뺐다. 그쪽은 **항목 단위**라 갈래가 각각 온전한 구문이고 C 는 **글자 범위**라 갈래가 구문 중간을
자른다(§8). 전이시키면 「양쪽이 다 온전하다」는 틀린 기대를 옮긴다.

---

## §7 `cs/` 로 밀어낼 것

C 는 이 앱의 10개 언어 중 **기계가 눈에 보이는 유일한 자리**다. 다른 언어에서 `cs/` 는 「밀어내면
좋은 것」이지만 C 에서는 **밀어내지 않으면 설명이 성립하지 않는다** — `c/sizeof` 의 한 줄에서
「바이트」를 빼면 남는 문장이 없다.

| `cs/` id | 한 줄 정의 | ← 필요로 하는 C 개념 |
|---|---|---|
| `cs/memory-address` | 값은 어딘가에 있고 그 자리에 번호가 붙어 있다 | `address-of` `pointer-declaration` `null-check` |
| `cs/byte-and-word` | 값의 크기를 바이트로 세고 타입마다 칸 수가 다르다 | `sizeof` `array-declaration` `malloc-free` |
| `cs/stack-and-heap` | 함수가 도는 동안만 사는 자리와, 직접 빌리고 돌려주는 자리 | `malloc-free` `array-declaration` `static-storage` |
| `cs/lifetime` | 값이 언제부터 언제까지 살아 있는가 | `malloc-free` `static-storage` |
| `cs/call-stack` | 부른 자리로 돌아오는 방법. 지역 변수가 여기 쌓인다 | `function-definition` `return-statement` |
| `cs/value-and-reference` | 복사해 넘기느냐 자리를 넘기느냐 | `struct-definition` `address-of` `array-decay` |
| `cs/integer-representation` | 정수는 정해진 칸 수에 담기고 넘치면 되돌아간다(2의 보수) | `integer-promotion` `arithmetic` |
| `cs/signed-unsigned` | 같은 비트를 음수로 읽을지 큰 양수로 읽을지 | `integer-promotion` `comparison` |
| `cs/floating-point` | 소수는 근사값이라 `0.1 + 0.2 != 0.3` 이다 | `number-literal` `arithmetic` |
| `cs/binary-and-bits` | 숫자를 비트로 보면 `&`·`\|`·`<<` 가 뜻을 갖는다 | `arithmetic`(임베디드 리포에서 두껍다) |
| `cs/character-encoding` | 글자는 숫자다(ASCII·UTF-8) | `char-literal` `string-literal` |
| `cs/null-terminated-string` | 길이를 따로 안 적고 0 바이트로 끝을 표시하는 방식 | `string-literal` `array-decay` |
| `cs/bounds` | 배열 밖을 읽으면 「오류」가 아니라 옆의 무언가가 나온다 | `array-declaration` `for-loop` |
| `cs/compile-and-link` | 소스가 오브젝트가 되고 오브젝트가 묶여 실행 파일이 된다 | `function-prototype` `static-storage` `header-include` |
| `cs/preprocessing` | 컴파일 전에 글자를 바꾸는 단계가 하나 더 있다 | `macro-define` `conditional-compilation` `header-include` |
| `cs/alignment-and-padding` | struct 크기가 멤버 합보다 큰 이유 | `struct-definition` `sizeof` |
| `cs/spec-and-undefined` | 규격이 답을 안 정한 자리에서 구현은 무엇을 해도 된다 | `undefined-behavior` |

간선이 34개 중 **19개**에 닿는다. 파이썬·TS 로 같은 표를 만들면 훨씬 적을 것이다(추정 —
세어 보지 않았다). `cs/` 를 열 근거로는 C 하나로 충분해 보인다.

---

## §8 tree-sitter 현실

`tree-sitter-c` 0.24.2 의 `src/parser.c`·`grammar.js` 를 읽고, 같은 버전 파이썬 바인딩
(`tree_sitter` 0.26.0)으로 실제 파싱해 확인했다.

| 항목 | 값 |
|---|---|
| `LANGUAGE_VERSION` = `grammar_abi` | **15** (파이썬 14 · TS 15 와 다르다) |
| `STATE_COUNT` / `SYMBOL_COUNT` | 2015 / 360 |
| `node_kind_count` | 363 → `grammar_version` = `"15-363"` |

`grammar_version` 은 파이썬 빌드에서 잰 값이다. Rust 크레이트도 같은 생성 파서라 같아야 하지만
`languages()` 로 한 번 확인해야 한다.

### 함정 — 전부 측정

**① `a * b;` 가 곱셈이 아니라 선언으로 파싱된다.** 파이썬 연쇄 비교에 대응하는 자리인데 더
나쁘다 — **오류가 안 난다.** `void f(int a,int b){ a * b; }` →
`(declaration type: (type_identifier) declarator: (pointer_declarator …))`, `has_error: false`.
이 모호성은 심볼 테이블(lexer hack)로만 풀리는데 tree-sitter 는 그게 없어 **선언 쪽을 항상 고른다**
— `typedef` 를 본 적 없어도 그렇다. `c/arithmetic` 의 `.scm` 은 `binary_expression` 안에서만 `*` 를
잡고 문 자리의 `*` 는 포기해야 한다. `int c = a * b;` 는 정상이다.

**② `#ifdef` 로 갈린 두 갈래에서 캡처가 둘 다 뜬다.** `#ifdef WIN32 / int a=1; / #else /
int b=2; / #endif` 에 `(init_declarator declarator: (identifier) @n)` 을 걸면 **`a` 와 `b` 를 둘
다** 잡는다 — 빌드에서는 하나만 컴파일되는데 사용처는 둘이 된다. `#not-has-ancestor?` 는 안
걸렸다(이 바인딩 기준. Rust 쪽 확인 필요). 현실적 대응은 `preproc_if`/`preproc_ifdef` 의
`alternative:` 안쪽을 패턴에서 배제하는 것이다.

**③ `#ifdef` 가 묶음을 반으로 자르면 파일이 통째로 무너진다 — 가장 큰 위험.**
`#ifdef A / if (x) { / #else / while (y) { / #endif` 를 넣은 13행 파일에서 ERROR 노드 하나가
**167바이트 중 147바이트(88%)**, 2~13행을 삼켰다 — `#ifdef` 와 상관없는 뒤쪽 함수까지.
파일은 `parse_quality: poor` 로 잡히지만(0.88 > 0.05) **개별 캡처는 안 잡힌다**: `query.rs` 의
`in_error` 가 조상을 **4단까지만** 보는데 ERROR 아래 5단 이상의 `n = n + 1`·`printf`·`a * 2` 가
전부 `in_error: false` 였다. `derive.ts:117` 이 `!match.site.inError` 로만 거르므로 이 캡처들은
**줄 번호가 어긋난 채 사용처가 된다.** `poor` 파일의 캡처를 통째로 버릴지 `in_error` 상한을 늘릴지
C 를 붙이기 전에 정해야 한다.

**④ 매크로 몸통은 트리에 없다.** `#define MAX(a,b) ((a)>(b)?(a):(b))` 는
`(preproc_function_def … value: (preproc_arg))` 하나로 끝나고 `preproc_arg` 는 문법에서
`token(prec(-1, /\S…/))` 인 **불투명 토큰 하나**다. 매크로 안의 `? :`·`if`·호출은 영영 안 보인다.
임베디드 C 는 로직이 매크로에 상당량 들어가 사용처가 실제보다 적게 잡힌다.

**⑤ 같은 글자 다른 노드, 같은 노드 다른 뜻.**

| 소스 | 노드 | 갈라내는 법 |
|---|---|---|
| `int *p` | `pointer_declarator` | 노드 종류가 다름 |
| `*p` | `pointer_expression` | `(pointer_expression operator: "*")` — 확인 |
| `&x` | `pointer_expression` | **같은 노드.** `operator: "&"` 로만 갈린다 |
| `t.a` / `p->a` | `field_expression` | **같은 노드.** `operator: "."` / `"->"` 로만 갈린다 |

`dereference` 와 `address-of` 를 노드 종류만으로 잡으면 서로를 먹는다. 파이썬이 형제 앵커
「자식이 정확히 둘」로 연쇄 비교를 잘라낸 것에 대응한다.

**⑥ 정수 나눗셈은 구문이 아니다.** `7/2` 와 `7/2.0` 이 같은 트리다. `#match?` 로 갈랐다 —
`(#match? @l "^[0-9]+$")` 둘이면 `7/2` 만 잡힌다(확인). 리포가 `#eq?`·`#any-of?`·`#match?` 를
이미 쓰므로(`dictionary/ts/*.scm`) 이 길은 열려 있다.

**⑦ 문법이 참·거짓을 지어낸다.** `grammar.js` 에 `true: token(choice('TRUE','true'))` ·
`null: choice('NULL','nullptr')` 가 하드코딩돼 있다. `<stdbool.h>` 없이 쓴 `true` 도
`(true)` 노드가 되고, 반대로 관용구인 `0`/`1` 은 그냥 `number_literal` 이라 안 잡힌다.
`c/boolean` 개념을 만들지 않은 실무적 이유이기도 하다.

### 확인 못 한 것

- `.h` 충돌. 지금은 C++ 문법이 없어 안 부딪치지만, `_lang.yaml` 의 `extensions` 에서
  **한 확장자를 두 언어가 주장하면 무엇이 이기는지 확인 못 했다.**
- `#not-has-ancestor?` 를 Rust 바인딩(tree-sitter 0.25)이 지원하는지.
- 벤더링된 통합본을 `skip_reason: 'generated'` 로 거르는 기존 규칙이 C 에 통하는지 —
  판정 규칙을 읽지 않았다.

---

## §9 오개념

**progmiscon.org 에는 C 항목이 없다** — Java·Python·JavaScript·Scratch 넷뿐이다(직접 확인).
그래서 C 는 그 카탈로그를 못 쓴다.

| # | 무엇을 믿나 | 실제로는 |
|---|---|---|
| 1 | `int *p, q;` 는 포인터 둘을 만든다 | `q` 는 그냥 `int` 다. `*` 는 타입이 아니라 이름 하나에 붙는다 |
| 2 | `int x;` 로 만든 이름은 0 이다 | 지역 변수는 아무 값이고, 읽는 순간 정의되지 않은 동작이다 |
| 3 | 포인터에는 「값이 들어 있다」 | 들어 있는 것은 번호다. 값은 그 번호가 가리키는 자리에 있다 |
| 4 | 배열을 함수에 넘기면 배열이 간다 | 첫 칸 주소만 간다. 함수 안의 `sizeof(a)` 는 배열 크기가 아니다 |
| 5 | `char s[] = "hi"` 는 2칸이다 | 3칸이다. 끝의 `\0` 이 문자열의 일부다 |
| 6 | `strcmp(a,b)` 가 참이면 같다 | 같으면 0 을 낸다. `if (strcmp(a,b))` 는 「다르면」이다 |
| 7 | `if (a = b)` 는 문법 오류다 | 컴파일된다. `b` 를 넣고 그 값이 조건이 된다 |
| 8 | `a[10]` 을 읽으면 오류가 난다 | 아무 일도 안 나거나, 옆 변수가 나오거나, 나중에 엉뚱한 데서 터진다 |
| 9 | `free(p)` 하면 `p` 가 `NULL` 이 된다 | `p` 는 옛 번호를 그대로 들고 있다. 그래서 `p = NULL;` 을 손으로 적는다 |
| 10 | 정수는 넘치면 커진 채로 남는다 | 부호 있는 정수의 넘침은 정의되지 않은 동작이다. 되돌아가는 것은 부호 없는 쪽뿐이다 |
| 11 | `-1 < 1u` 는 참이다 | 거짓이다. `-1` 이 `unsigned` 로 올라가 아주 큰 수가 된다 |
| 12 | 컴파일이 되면 맞는 코드다 | UB 가 있으면 최적화가 검사 코드를 지우기도 한다 |

3번만 논문 근거가 있다 — Kaczmarczyk 외(SIGCSE '10)가 아홉 개념 중 첫째로 Memory Model /
References / Pointers 를 두고, 주제 1을 「언어 요소와 메모리 사용의 관계를 오해한다」로 꼽았다.
나머지는 **규격·교재에서 확인한 사실**이고 「학습자가 실제로 그렇게 믿는다」는 빈도 자료는 못
찾았다. 사전 `misconceptions:` 에 넣을 때 이 구별을 지켜야 한다.

---

## §10 근거와 출처

| 무엇 | URL | 상태 |
|---|---|---|
| Exercism C 트랙 `config.json` | https://github.com/exercism/c/blob/main/config.json | **확인** — 개념 14개, `concept_exercises: false`, 연습 85개 전부 practice. **`prerequisites` 간선이 아예 없다**(개념 연습이 0이라) — D148 의 「간선을 안 가져온다」가 C 에서는 저절로 지켜진다 |
| 그 14개 | — | `basics` `bits` `blocks` `booleans` `function-pointers` `conditionals` `dynamic-memory-management` `linkage` `loops` `pointers` `recursion` `scope` `static-functions` `storage-class-specifiers`. 우리 §2~§4 와 **독립적으로 겹친다** — 포인터·동적 메모리·링크·저장 수명·함수 포인터 |
| 연습 85개 topic 빈도 | — | `strings` 39 · `control_flow_loops` 37 · `memory_management` 27 · `control_flow_if_statements` 26 · `arrays` 25 · `structs` 23 · `pointers` 11. **`while` 계열은 1건이고 `for` 가 압도적** — `c/for-loop` 를 중심에 둔 근거 |
| tree-sitter-c `parser.c` · `grammar.js` | https://github.com/tree-sitter/tree-sitter-c | **확인** — ABI 15, 2015/360, `preproc_arg` 토큰, `preprocIf` 헬퍼, `null`/`true`/`false` 하드코딩 |
| `tree-sitter-c` 크레이트 | https://crates.io/crates/tree-sitter-c | **확인** — 0.24.2(2026-04-22)가 최신 |
| §8 함정 7종 | — | **직접 측정** (`tree_sitter` 0.26.0 + `tree_sitter_c` 0.24.2) |
| TIOBE 2026-08 | https://www.techrepublic.com/article/news-tiobe-august-2026-java-nears-c-plus-plus/ | **확인** — C 2위 11.10%, +2.07p |
| Kaczmarczyk·Petrick·East·Herman, "Identifying student misconceptions of programming", SIGCSE '10, 107–111 | https://doi.org/10.1145/1734263.1734299 | **확인**(서지·요지) |
| Adcock·Bucci·Heym·Hollingsworth·Long·Weide, "Which pointer errors do students make?", SIGCSE '07 | https://doi.org/10.1145/1227310.1227317 | 서지만 **확인**(Crossref·Semantic Scholar). **초록·본문이 유료라 확인 못 함** — 내용을 인용하지 않았다 |
| progmiscon.org | https://progmiscon.org/ | **확인** — Java·Python·JavaScript·Scratch 넷뿐, **C 는 없다** |
| C 규격(UB·정수 승격) | ISO/IEC 9899 | 원문이 **유료라 직접 확인 못 함**. §4·§9 서술은 널리 알려진 규칙에 기댔고 사전에 넣기 전 절 번호를 붙여야 한다 |

Exercism C 트랙에 개념 연습이 없어 D148 ⑤의 「같은 모양의 config.json」 가정이 C 에서 깨진다 —
목록만 가져오는 규칙 자체는 그대로 성립한다.
