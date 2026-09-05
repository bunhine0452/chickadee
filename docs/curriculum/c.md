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

## §0 0부 — 이 언어의 값과 식

> 2026-09-05 추가. 사용자 요청 「기초부터 심화까지, 언어의 동작 원리부터. 처음 배우는 사람이
> 정수형·실수형·연산식을 이해하고 말 그대로 언어를 이해한다는 느낌으로」에 대응한다.
> 문서 순서로도 코스 순서로도 **§2 앞**이다. 정본 §4 의 부(교재 축)를 한 칸 더 아래로 판 것이고,
> 이 문서가 §2~§4 에서 쓰던 난이도 축(기초/중심/심화)과는 다른 축이다.

**왜 C 에 0부가 따로 필요한가.** §2 의 바닥 여덟은 「문을 읽는 법」이다 — `if`·`while`·함수·`return`.
그런데 §9 의 오개념 12 중 **다섯**(2·5·7·10·11·12)이 문이 아니라 **값과 식**에서 난다.
`int x;` 가 0 이 아닌 것 · `"hi"` 가 3칸인 것 · `if (a = b)` 가 컴파일되는 것 · 부호 있는 넘침이
정의되지 않은 동작인 것 · `-1 < 1u` 가 거짓인 것. 이 다섯은 `while` 을 백 번 읽어도 안 나온다.
0부는 그 다섯이 사는 층이다.

### §0.1 개념 열둘

「형식」은 문항 형식 계약(`value` 값 적기 · `step` 한 걸음씩 · `bits` 비트로 보기 · `table` 표 채우기 ·
`build` 거꾸로 만들기 · `predict` 예측 후 실행)이고, 「그림」은 그림 계약(비트 배열 · 평가 트리 ·
값 상자 · 메모리 줄 · 스택 프레임 · 타입 변환 사다리 · 소유권 화살표)이다. **4지선다는 0부에 없다** —
정본 §1 의 「강제된 능동 출력」이 값을 적게 하는 쪽이고, 정수 폭이나 잘림은 고르기로 물으면
소거법으로 맞힐 수 있다.

| # | id | 무엇 | `cs/` 선행 | 그림 | 형식 | 판 | **초보가 실제로 틀리는 자리 하나** |
|---|---|---|---|---|---|---|---|
| 1 | `c/declaration` <sup>기초1에서</sup> | 타입 적고 이름 만들기 | `cs/type` | 값 상자 | `value` | 1 | `int x;` 를 0 으로 읽는다. 0 이 되는 것은 전역이거나 `static` 일 때뿐이고, 지역 변수를 읽는 것은 정의되지 않은 동작이다 |
| 2 | `c/assignment` <sup>기초2에서</sup> | 이름에 값 다시 넣기 | `cs/state` | 값 상자 | `step` | 1 | 조건 안의 `=` 를 비교로 읽는다. `if (x = 0)` 은 컴파일되고, 넣은 값 0 이 그대로 조건이 된다 |
| 3 | `c/number-literal` <sup>중심9에서</sup> | 적는 모양이 타입을 정한다 | `cs/type` | 값 상자 | `table` | 2 | `1`·`1.0`·`1u`·`1L` 을 같은 값으로 읽는다. `7/2` 가 3 인 이유가 여기서 시작한다 |
| 4 | **`c/integer-type`** 신규 | 정수의 폭과 부호 | `cs/bit-and-byte` · **`cs/signed-and-unsigned`(없다 — §0.5)** | 비트 배열 | `bits`+`table` | 3 | `int` 가 어디서나 32비트라고 믿는다. 규격이 약속한 것은 **최소 16비트**뿐이다. 폭을 아는 방법은 둘 — `sizeof` 로 재거나 `<stdint.h>` 의 `int8_t`~`int64_t` 를 쓰거나 |
| 5 | **`c/overflow`** 신규 | 자리가 모자라면 | `cs/integer-overflow` · `cs/undefined-behavior` | 비트 배열 | `predict`+`bits` | 2 | 「넘치면 되돌아간다」로 배운다. 되돌아가는 것은 **부호 없는 쪽뿐**이고(2ⁿ 모듈로, 규격이 정함) 부호 있는 넘침은 답이 없다 |
| 6 | **`c/float-type`** 신규 | 실수는 왜 안 떨어지나 | `cs/floating-point` · `cs/binary-representation` | 비트 배열 | `bits`+`value` | 2 | `0.1 + 0.2 == 0.3` 을 참으로 예상한다. 그리고 `float f = 0.1;` 의 `0.1` 은 `double` 이라 **두 번** 잘린다 |
| 7 | `c/char-literal` <sup>중심11에서</sup> | 문자와 바이트 | `cs/text-encoding` · `cs/bit-and-byte` | 비트 배열 + 메모리 줄 | `bits`+`value` | 2 | `'a'` 를 글자 타입으로 읽는다. C 에서 `sizeof('a')` 는 **4**(=`sizeof(int)`)다 — C++ 에서는 1 이라 같은 코드가 두 언어에서 다른 값을 낸다 |
| 8 | `c/truthiness` <sup>중심13에서</sup> | 참·거짓 | `cs/type` | 값 상자 | `table` | 2 | `if (strcmp(a,b))` 를 「같으면」으로 읽는다. `strcmp` 는 같으면 0 을 내므로 그 조건은 「다르면」이다 |
| 9 | `c/arithmetic` <sup>기초3에서</sup> | 셈하기 | `cs/integer-overflow` | 평가 트리 | `value`+`step` | 2 | `7/2` 를 3.5 로 읽는다. 그리고 `-7/2` 는 0 쪽으로 잘려 **−3** 이지 −4 가 아니다(C99 이후 규격) |
| 10 | `c/comparison` <sup>기초4에서</sup> | 견주기 | `cs/type` | 평가 트리 | `value` | 1 | 견준 결과를 참·거짓 타입으로 읽는다. C 에서는 `int` 0 또는 1 이라 `int ok = (a == b);` 가 성립한다 |
| 11 | **`c/operator-precedence`** 신규 | 어느 것이 먼저 묶이나 | — | 평가 트리 | `step`+`build` | 2 | `*p++` 를 「`*p` 를 하나 늘린다」로 읽는다. `++` 가 더 세서 `*(p++)` 다. 같은 함정이 `a & b == c`(→ `a & (b == c)`)에도 있다 |
| 12 | **`c/conversion`** 신규 <sup>심화33 흡수</sup> | 암묵·명시·잘림 | `cs/type` · `cs/integer-overflow` | 타입 변환 사다리 | `table`+`predict` | 3 | `-1 < 1u` 를 참으로 읽는다. 거짓이다 — `-1` 이 `unsigned` 로 올라가 4294967295 가 된다 |

**판 23장.** 개념마다 형식 수를 세어 합한 값이다(어려운 셋 — 정수 폭·변환·리터럴 — 이 3판을 받는다).

### §0.2 세 언어가 갈리는 자리 열넷

**같은 표가 `cpp.md`·`rs.md` §0.2 에도 있다.** 셋은 서로의 대조군이라 한 편만 보고는 자리를 못 잡는다 —
「C 는 암묵 변환이 있다」는 「Rust 는 하나도 없다」와 나란히 놓아야 뜻이 선다. 고칠 때 셋을 함께 고친다.

| 자리 | C | C++ | Rust |
|---|---|---|---|
| 정수 폭 | `int` 는 **최소 16비트**만 규격이 정한다. 실폭은 `sizeof` 로 잰다 | C 와 같다. 보장되는 것은 `sizeof(char) == 1` 뿐 | **이름에 적혀 있다** — `i8`~`i128`·`u8`~`u128`. 안 적힌 것은 `usize`/`isize` 둘뿐이고 그건 포인터 폭이다 |
| 부호 있는 넘침 | **정의되지 않은 동작** | C 와 같다. C++20 이 표현을 2의 보수로 고정했지만 **넘침은 여전히 UB** 다 | **디버그 패닉 · 릴리스 감싸기.** 둘 다 정의돼 있다 |
| 부호 없는 넘침 | 2ⁿ 으로 감싼다(정의됨) | 같다 | 릴리스에서 감싼다. 뜻을 적으려면 `wrapping_add` |
| 정수 나눗셈 | 0 쪽으로 자른다 — `-7/2 == -3` | 같다 | 같다 |
| 암묵 변환 | **있다.** 정수 승격 + usual arithmetic conversions 가 조용히 돈다 | 더 있다 — 사용자 정의 변환 생성자까지 | **하나도 없다.** `1i32 + 1i64` 가 E0308 |
| 명시 변환의 잘림 | `(char)300` 이 말없이 자른다 | `static_cast<char>(300)` 도 말없이. 다만 `char c{300}` 은 **컴파일 오류**(축소 금지) | `300u32 as u8` 이 말없이 44. 안 잃으려면 `u8::try_from` |
| 참·거짓 | **타입이 없다.** 0 이 아니면 참 | `bool` 이 있는데 정수로 조용히 변한다 | `bool` 만 온다. `if 1` 이 E0308 |
| 문자 하나 | `'a'` 는 `int`. `sizeof('a') == 4` | `'a'` 는 `char`. `sizeof('a') == 1` | `'a'` 는 `char` = 유니코드 스칼라 **4바이트**. 바이트가 필요하면 `b'a'` |
| 문자열 길이 | 아무 데도 안 적혀 있다. `\0` 까지 세는 `strlen` 이 O(n) | `std::string::size()` — 바이트 수, O(1) | `s.len()` — 바이트 수. `"가".len() == 3`, 글자 수는 `chars().count()` |
| 초기화 안 한 지역 변수 | 아무 값. 읽으면 UB | 같다. `int x{}` 만 0 | **컴파일이 막는다**(E0381) |
| 조건 안의 `=` | 컴파일된다(경고만) | 컴파일된다 | 막힌다 — 대입식의 값이 `()` 라 `bool` 자리에 안 맞는다 |
| 이름 둘이 한 값 | 포인터로만 — `int *p = &x` | **참조** `int& r = x`. 부르는 쪽 `f(v)` 에는 표시가 없다 | `&x`. 빌림 규칙이 **몇 개까지**를 정한다(`&mut` 은 하나) |
| 우선순위 함정 | `*p++` · `a & b == c` | 위 둘 + `std::cout << a & b`(`<<` 가 `&` 보다 세다) | `a as u8 + b`(`as` 가 가장 세다) · `&` 가 빌림과 비트AND 두 뜻 |
| **`predict` 가 답을 갖나** | **UB 자리에서는 안 갖는다**(§0.3) | 같다 | **갖는다.** 넘침조차 「디버그면 패닉, 릴리스면 감싼다」로 정해져 있다 |

마지막 줄이 이 세 편의 형식 배분을 정한다. Rust 에서 `predict` 는 답이 하나인 문항이고,
C·C++ 에서는 **답이 없다는 것이 답인 문항**이 섞인다. 같은 형식 이름을 쓰되 채점이 보는 것이 다르다.

### §0.3 정의되지 않은 동작을 `predict` 로 어떻게 내나

C 계열에서 `predict` 가 가장 센 형식인데, 잘못 내면 **틀린 모형을 가르친다.** 규칙 다섯.

**① 정답을 값으로 두지 않는다.** `int x = INT_MAX; x + 1` 의 정답은 −2147483648 이 아니다. 정답은
「이 식은 답을 약속하지 않는다」이고, 그 선택지가 0부 내내 **항상** 답란에 있어야 한다. 없다가
UB 판에서만 나타나면 그 등장 자체가 힌트가 된다.

**② 「아무 값이나 나온다」로 가르치면 안 된다.** 그렇게 배운 학습자는 `if (x + 1 < x)` 로 넘침을
검사할 수 있다고 믿는다. 실제로는 컴파일러가 「부호 있는 넘침은 없다」를 가정하고 그 `if` 를 통째로
지운다. **UB 는 값의 문제가 아니라 프로그램 전체에서 약속이 사라지는 것**이고, 지워지는 코드가 UB 가
일어난 줄보다 **앞**에 있을 수도 있다. 「비결정적 값」과 「약속 없음」은 다른 모형이고, 앞엣것을 주면
학습자는 방어 코드를 짤 수 있다고 믿게 된다 — 정확히 §9 의 오개념 12 다.

**③ 다름을 눈으로 보여 준다.** 러너(D175)가 C 를 열면 같은 소스를 `-O0` 과 `-O2` 로 두 번 돌려
결과 둘을 나란히 낸다. 그때 화면이 말할 문장은 「컴파일러마다 다르다」가 아니라
**「이 코드에는 답이 없고, 이 둘이 다른 것이 그 증거다」**다. 앞 문장은 「어떤 컴파일러에서는 맞다」로
읽히고, 그게 UB 를 이식성 문제로 오해하게 만든다. 러너가 없으면 이 판은 게이트에서 빠진다(정본 §2).

**④ 관측 가능한 것만 `predict` 로 낸다.** 부호 있는 넘침 · `a[10]` · `i = i++` 는 두 최적화 수준에서
결과가 실제로 갈린다. strict aliasing 이나 UB 로 인한 무한 루프 제거처럼 특정 플래그에서만 드러나는
것은 `table`(무엇이 정의됐고 무엇이 안 됐나)로 낸다. 예측을 냈는데 두 번 다 같은 값이 나오면
학습자는 「정의돼 있구나」를 배운다 — 정반대다.

**⑤ UBSan 을 켤지는 사용자 결정이다.** `-fsanitize=undefined` 는 「돌아갔으니 맞다」의 반례를 만드는
가장 싼 장치다(`runtime error: signed integer overflow` 를 런타임에 찍는다). 켜면 UB 판이 확실해지고,
대신 학습자가 자기 빌드에서 보는 것과 화면이 달라진다. **안 정했다.**

### §0.4 겹침 정리 — 무엇을 어디서 지우나

0부는 새 개념 5개(`integer-type`·`overflow`·`float-type`·`operator-precedence`·`conversion`)만 더하고
나머지 7개는 **아래에서 올려 온다.** 아래에는 남기지 않는다 — 같은 개념이 두 부에 있으면 학습자는
두 번째를 「전에 본 것」으로 흘려보내고, 큐는 같은 개념을 두 번 인쇄한다.

| 어디서 | 무엇 | 어떻게 |
|---|---|---|
| §2 기초 8 | `declaration` `assignment` `arithmetic` `comparison` | 0부로 올린다. §2 는 4개가 남고 그 넷이 1부의 뼈대가 된다 |
| §3 중심 16 | `number-literal` `char-literal` `truthiness` | 0부로 올린다. 중심 13 |
| §4 심화 10 | `integer-promotion` | **`c/conversion` 이 흡수하고 지운다.** 심화 9 |
| §4 심화 | `undefined-behavior` | **안 지운다.** 0부의 `c/overflow` 는 UB 를 한 자리에서 보여 주고, 심화의 그것은 「규격이 답을 안 정한다」는 개념 자체다 — 같은 사실의 두 층이지 중복이 아니다 |

`integer-promotion` 을 흡수한 근거: 규격에서 정수 승격은 usual arithmetic conversions 의 **첫 단계**다.
개념을 둘로 두면 학습자가 「승격」과 「변환」을 다른 기계로 읽는데 하나의 절차다. 이름은 카드 본문에
남는다(컴파일러 경고 문구가 `-Wconversion` 이라 낱말을 알아야 오류를 검색할 수 있다).

### §0.5 그림이 특히 값을 내는 자리

C 는 이 앱의 열 언어 중 기계가 눈에 보이는 유일한 자리다(§7). 그림 세 종이 여기서 대부분의 일을 한다.

| 그림 | 어느 개념 | 그림 하나가 답하는 질문 |
|---|---|---|
| **비트 배열** | `integer-type` `overflow` `float-type` `char-literal` | 「`int8_t` 에 200 을 넣으면 왜 −56 인가」 — 8칸을 그리고 맨 앞 칸이 부호라고 말하면 끝난다. 부동소수는 같은 그림을 부호1·지수8·가수23 으로 나눠 「0.1 을 적을 칸이 모자란다」를 보인다 |
| **메모리 줄** | `array-declaration` `pointer-declaration` `address-of` `dereference` `array-decay` `char-literal` | 「배열은 왜 0부터인가」 — 칸을 나란히 그리고 `a` 를 첫 칸 주소라고 두면 `a[i]` 가 `*(a + i)` 이고 `i` 는 **떨어진 거리**다. 0부터인 게 규칙이 아니라 **거리 0** 이라는 뜻이 된다. 같은 그림에 `"hi"` 를 얹으면 `\0` 한 칸이 보인다 |
| **스택 프레임** | `function-definition` `return-statement` `malloc-free` `static-storage` | 「스택과 힙이 왜 갈리나」 — 프레임이 쌓이고 `return` 에서 통째로 사라지는 것을 그리면, 지역 배열 주소를 돌려주는 코드가 왜 틀렸는지가 설명 없이 보인다. `malloc` 은 그 프레임 밖에 있는 칸이다 |
| 평가 트리 | `arithmetic` `comparison` `operator-precedence` | `*p++` 를 트리로 그리면 `++` 가 `p` 에 붙는 것이 눈에 보인다 |
| 값 상자 | `declaration` `assignment` `number-literal` `truthiness` | 상자에 타입 이름을 적어 두면 `int x;` 의 상자가 **비어 있지 않고 쓰레기가 들어 있다**를 그릴 수 있다 |
| 타입 변환 사다리 | `conversion` | `char` → `int` → `unsigned` → `long` 을 계단으로 그리고, `-1 < 1u` 에서 `-1` 이 어느 칸으로 올라가는지를 화살표로 |

**막힌 것 둘 — 필요한 그림 넷이 아직 컴포넌트가 없다.** `design/system/diagrams.md` §3 은 만든 것
셋(비트 배열 · 평가 트리 · 값 상자)과 명세만 있는 넷(메모리 줄 · 스택 프레임 · 타입 변환 사다리 ·
소유권 화살표)을 갈라 놓았다. **위 표에서 C 가 기대는 그림 여섯 중 셋이 아직 안 만든 쪽**이고,
그 셋이 하필 「배열이 왜 0부터인가」·「스택과 힙이 왜 갈리나」·「`-1 < 1u` 가 왜 거짓인가」를
맡는다. 만든 셋만으로 0부를 열면 `integer-type`·`overflow`·`float-type`·`char-literal` 넷은 서고
`conversion` 과 2부 전체가 안 선다. **순서가 있다** — 메모리 줄이 먼저다(2부 아홉 중 여섯이 그것을
쓴다).

**막힌 것 하나 — `cs/signed-and-unsigned` 가 43장에 없다.** `c.md` §7 이 그 이름을 제안했는데
`cs.md` §10 이 받지도 물리지도 않고 지나갔다(§10.3 의 「안 받은 것」 목록에도 없다). 0부의
`c/integer-type` 과 `c/conversion` 이 걸 데가 지금 `cs/bit-and-byte` 하나뿐인데, 그 장은
「여덟 자리를 한 덩이로 센다」이지 「같은 비트를 음수로 읽을지 큰 양수로 읽을지」가 아니다.
**43 → 44 로 늘리는 제안이고 `cs.md` 는 이 세션 범위 밖이라 여기 적어만 둔다.**

### §0.6 사슬 — 0부에서 3부까지

정본 §4 의 부는 **교재 축**이다(1부 합성 · 2부 합성+내 코드 · 3부 내 코드 중심). C 에서는 그 축이
한 자리에서 무너진다 — **3부에 넣을 내 코드가 없다**(§0.7). 그래서 부 이름을 교재가 아니라
**무엇을 읽게 되는가**로 붙였다.

| 부 | 이름 | 개념 | 무엇을 읽게 되나 | 판 | 일 |
|---|---|---|---|---|---|
| 0부 | 값과 식 | 12 | 한 줄 안의 값 | 23 | 12 |
| 1부 | 문과 흐름 | 8 | 한 함수 | 16 | 8 |
| 2부 | 포인터와 메모리 | 9 | 한 파일 | 27 | 14 |
| 3부 | 빌드와 규격 | 9 | 한 프로젝트 | 27 | 14 |
| | | **38** | | **93** | **47** |

1부(8) `if-statement` `while-loop` `for-loop` `function-definition` `function-call` `return-statement`
`string-literal` `array-declaration`
2부(9) `pointer-declaration` `address-of` `dereference` `null-check` `sizeof` `struct-definition`
`member-access` `array-decay` `malloc-free`
3부(9) `header-include` `function-prototype` `macro-define` `conditional-compilation` `static-storage`
`function-pointer` `const` `typedef` `undefined-behavior`

**판 수의 근거는 부마다 다르다.** 0부 23 은 §0.1 표의 「판」 열을 더한 값이다 — 개념마다 어느 형식을
낼지 정했으므로 셀 수 있다. **1~3부 는 안 쟀다** — 1부 개념당 2판, 2·3부 개념당 3판으로 가정한
값이고, 2·3부에 3판을 준 근거는 「그림이 둘 이상 필요하다」는 판단뿐이다. 일수는 D12 의 하루 새 판
2장으로 나눈 것이고 **재검·복습을 안 센 하한**이다(정본 §2 는 만기 재검을 먼저 내고 남은 예산으로
새 판을 낸다). 실제로는 이보다 길다.

**0부 12일이 첫 `if` 앞을 막는다.** 이것이 이 설계의 가장 큰 값이자 가장 큰 위험이다 — 열이틀 동안
`if` 한 줄을 못 본 학습자가 남아 있을지는 모른다. 대안 둘 중 **안 정했다**: ⓐ 0부를 12로 두고 1부와
**엇갈려 낸다**(하루 2장 중 한 장은 0부, 한 장은 1부 — 정본 §4 규칙 ③ 「부 안에서 선행이 먼저」는
지키되 부 사이 순서를 푼다) ⓑ 0부를 자른다(정수 폭·넘침·변환만 남기고 나머지를 1부로 미룬다).
ⓐ 는 「기초부터」의 체감을 살리면서 첫날 `if` 를 보게 하고, ⓑ 는 부 경계를 깨끗하게 둔다.

**0장(프롤로그) 상한이 깨진다.** §5 가 깊이 ≤ 2 = **24 개로 상한(`ZERO_CHAPTER_MAX`)에 정확히 붙어**
있다고 적었다. 신규 5개의 깊이는 `integer-type` 1 · `float-type` 1 · `overflow` 2 ·
`operator-precedence` 2 · `conversion` 2 이고 흡수로 `integer-promotion` 하나가 빠지므로
**24 → 28 이다. 상한을 4 넘는다.** `packages/concepts/src/zero-chapter.test.ts` 가 이것을 잡는다.
README §7 ①의 「0장 상한은 사용자 결정」이 C 에서 강제로 열린다 — 28판이면 14일이다.
(`cpp.md`·`rs.md` 도 각각 21→28 · 22→28 로 같은 값에 닿는다. 셋이 독립적으로 28 인 것은
0부가 얕은 개념만 더하기 때문이다.)

### §0.7 교재 — C 는 내 리포에 없다 (실측 2026-09-05)

정본 §4 규칙 ①은 「개념마다 내 코드의 자리를 짚고, 없으면 「네 코드엔 없다」를 명시한다」이다.
C 는 그 「없다」가 거의 전부다.

사용자 리포 열(`~/Desktop/git/`)에서 `.c` **14장** · `.h` **468장**이 잡히지만
**사람이 쓴 것은 0장**이다.

| 무엇 | 몇 장 | 어디 |
|---|---|---|
| `.c` | 12 | `*/src-tauri/target/{debug,release}/build/*/out/flag_check.c` — 카고 빌드 스크립트가 만든 것 |
| `.c` | 1 | `adelie/.venv/.../websockets/speedups.c` — 파이썬 패키지 |
| `.c` | 1 | `ai-pm/.../aws-lc-sys-*/out/flag_check.c` |
| `.h` | 452 | `*/target/*/build/aws-lc-sys-*/out/include/openssl/**` — aws-lc 가 푼 헤더 |
| `.h` | 나머지 16 | `.venv/.../cffi` · `onig_sys` 빌드 산출물 |
| `.cpp` `.cc` `.cxx` `.hpp` | **0** | — |

**그래서 세 부 중 3부(내 코드 중심)가 안 선다.** D158 이 연 조건부 경로가 그대로 답이다 —
ⓐ 개념마다 「네 코드엔 없다」를 명시하고 ⓑ `previewSiteId` 자리에 예고 대신 **「왜 네 코드엔 없나」**를
넣는다. C 의 답은 구체적이다: 「네 앱은 Tauri 라 C 를 쓰는 자리가 tree-sitter 와 aws-lc 안에 있고,
그건 네가 쓴 게 아니라 빌드가 받아 온 것이다.」 이것 자체가 공학 문항이다(「왜 암호 라이브러리를
직접 안 짜는가」).

**그리고 §1 이 경고한 벤더링 판정이 여기서 필수가 된다.** `file.skip_reason 'generated'` 를 안 세우면
`aws-lc-sys` 헤더 452장이 C 사용처의 전부가 되어 「내 코드가 교재」(정본 §1)가 거짓말이 된다.
`sqlite3.c` 25만 줄을 걱정했는데 실제 표본에서는 OpenSSL 헤더 452장이 먼저 왔다.
판정 규칙 최소 셋 — 경로에 `target/`·`.venv/`·`site-packages/`·`node_modules/` 가 있으면 뺀다 ·
`out/` 아래 빌드 산출물은 뺀다 · `.gitignore` 에 걸리는 것은 뺀다.

**측정 방법.** `find` 로 확장자를 세고 경로를 눈으로 분류했다. tree-sitter 로 파싱하지 않았고
줄 수도 안 셌다 — 「사람이 썼는가」의 판정에는 경로로 충분했다.

### §0.8 결정 등록부에 올릴 행 (초안 — 세 편 공통)

**아직 안 올렸다.** 등록부(`docs/00-overview.md` §4)는 오케스트레이터가 쓴다. 번호는 D183 다음이
비어 있으나 병렬 세션 여섯이 각자 초안을 내고 있어 여기서 정하지 않는다.
이 행 하나가 `c.md`·`cpp.md`·`rs.md` 셋의 §0 을 함께 덮는다 — 세 편에 같은 초안을 복제하지 않고
여기 한 벌만 둔다(`cpp.md`·`rs.md` §0 이 이 절을 가리킨다).

| 칸 | 내용 |
|---|---|
| **문제** | 정본 §4 의 1부(바닥)가 「변수·타입·조건·반복」인데 **타입이 무엇인지를 가르치는 자리가 없다.** 자바에서는 `int` 하나뿐이라 안 드러났고, C·C++·Rust 에서 드러난다 — 세 편의 오개념 표(각 §9) 36개 중 **열넷**이 문(statement)이 아니라 **값과 식**에서 난다. 그리고 이 셋은 다른 일곱 언어가 감춰 주는 것(폭·부호·넘침·잘림·표현 범위)을 학습자 앞에 그대로 둔다 |
| **결정** | **부 앞에 0부 「이 언어의 값과 식」을 세운다.** C 12 · C++ 13 · Rust 11 개념(신규 5·7·6, 나머지는 기존 부에서 올려 옴 — 중복 없음). 규칙 넷 — ① 개념마다 ⓐ `cs/` 선행 ⓑ 그림 ⓒ 초보가 실제로 틀리는 자리 하나 ⓓ 문항 형식을 **적는다**(빈칸이면 그 개념은 0부에 못 든다) ② 형식은 값을 적는 여섯(`value`·`step`·`bits`·`table`·`build`·`predict`)이고 **4지선다는 0부에 없다** — 정수 폭·잘림은 고르기로 물으면 소거법으로 맞힌다 ③ **UB 를 「아무 값이나 나온다」로 가르치지 않는다**: `predict` 의 정답 하나가 「이 식은 답을 약속하지 않는다」이고 그 선택지가 0부 내내 항상 답란에 있다(`c.md` §0.3 규칙 다섯) ④ 세 편이 공유하는 대조표 하나(`§0.2` 열넷 행)를 셋에 복제해 두고 함께 고친다 |
| **근거** | ① **실측** — 사용자 리포 열에 사람이 쓴 `.c`·`.cpp` 가 **0장**이다(`.c` 14장·`.h` 468장이 잡히지만 전부 `target/`·`.venv` 산출물이고 그중 452장이 aws-lc 가 푼 OpenSSL 헤더). 그래서 C·C++ 은 D158 의 조건부 경로로만 설 수 있고, 「네 코드엔 없다」를 명시하는 것이 예외가 아니라 기본이 된다 ② **Rust 는 반대로 두껍다** — 폭 붙은 정수 타입 이름이 `ai-pm` 에서 2,885곳(`let` 11,338 의 25%)이고, `as` 캐스트 563곳 대 `try_into`/`TryFrom` **12곳으로 47배**다. AI 가 짜 준 코드는 안 잃는 변환보다 말없이 자르는 변환을 47배 쓴다 — 0부에 실측 근거가 붙는 유일한 언어다 ③ 셋 다 0장 후보(깊이 ≤ 2)가 **24·21·22 → 전부 28** 이 되어 `ZERO_CHAPTER_MAX = 24` 를 4 넘긴다. 세 언어가 독립적으로 같은 값에 닿는 것은 0부가 얕은 개념만 더하기 때문이고, README §7 ① 「0장 상한은 사용자 결정」을 강제로 연다 |
| **자리** | `docs/curriculum/c.md` §0 · `cpp.md` §0 · `rs.md` §0 · (제안) `docs/curriculum/cs.md` 43 → 44 (`cs/signed-and-unsigned` 신설) · `docs/plan/rust-axis.md` §2.3 에 여섯째 · `packages/concepts/src/zero-chapter.test.ts` 가 상한 초과를 잡는다 |

**함께 열리는 사용자 결정 넷** — ① 0장 상한 24 → 28(14일)로 올릴지 ② 0부와 1부를 엇갈려 낼지
(하루 2장 중 한 장씩), 아니면 0부를 자를지 — 안 그러면 첫 `if` 를 보기까지 C 12일 · C++ 14일 ·
Rust 11일이다 ③ C·C++ 러너에서 `-fsanitize=undefined`(와 C++ 은 `-fsanitize=address`)를 기본으로
켤지 ④ C++ 은 리포 스캔이 근거가 안 되는데(0장) 코스를 무엇으로 띄울지.

---

## §2 기초 — 바닥 여덟

> **§0 신설 뒤 넷이 위로 갔다** — `declaration`·`assignment`·`arithmetic`·`comparison` 은 §0.1 에 있다.
> 아래 표는 신설 전 기록으로 남긴다(개념 내용은 그대로 쓴다). 1부에 남는 것은 `if-statement`·
> `while-loop`·`function-definition`·`return-statement` 넷이고 나머지는 §0.6 이 배치한다.

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

> **§0 신설 뒤 셋이 위로 갔다** — `number-literal`(9)·`char-literal`(11)·`truthiness`(13). 중심은 13 이다(§0.4).

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

> **§0 신설 뒤 하나가 흡수됐다** — `integer-promotion`(33)은 `c/conversion` 안이다. 심화는 9 다(§0.4).
> `undefined-behavior`(34)는 여기 남는다 — 0부의 `c/overflow` 와 층이 다르다.

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

> **아래 24/24 는 §0 신설 전 값이다.** 신설 뒤 깊이 ≤ 2 가 **28** 이라 상한을 4 넘는다 — 근거와
> 각 신규 개념의 깊이는 §0.6 끝에 있다.

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
