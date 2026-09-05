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

## §0 0부 — 이 언어의 값과 식

> 2026-09-05 추가. 사용자 요청 「기초부터 심화까지, 언어의 동작 원리부터. 처음 배우는 사람이
> 정수형·실수형·연산식을 이해하고 말 그대로 언어를 이해한다는 느낌으로」에 대응한다.
> 문서 순서로도 코스 순서로도 **§2 앞**이다. 정본 §4 의 부(교재 축)를 한 칸 더 아래로 판 것이고,
> 이 문서가 §2~§4 에서 쓰던 난이도 축(기초/중심/심화)과는 다른 축이다.

**왜 C++ 에 0부가 따로 필요한가.** §9 의 오개념 12 중 **다섯**(2·3·8·10·12)이 문이 아니라 **값과 식**
에서 난다 — 값 매개변수가 통째로 복사되는 것 · `&` 가 선언과 식에서 다른 것 · `7/2` 가 3 인 것 ·
`int x;` 가 0 이 아닌 것 · `auto` 가 참조와 `const` 를 떨어뜨리는 것. 그리고 이 다섯 중 셋이
**복사냐 아니냐**의 문제다. C++ 에서 「값이 무엇인가」를 안 깔고 클래스로 넘어가면 학습자는
`std::vector<Big> v2 = v1;` 이 무슨 일을 하는지 모르는 채로 소멸자를 배운다.

C 와의 차이도 여기서 처음 갈린다 — `sizeof('a')` 가 C 는 4, C++ 는 1 이다. 같은 `.h` 를 두 문법으로
파싱하는 이 앱에서(§8) 그 차이는 파서 문제가 아니라 **학습자가 두 언어를 섞어 읽는 문제**다.

### §0.1 개념 열셋

「형식」은 문항 형식 계약(`value` 값 적기 · `step` 한 걸음씩 · `bits` 비트로 보기 · `table` 표 채우기 ·
`build` 거꾸로 만들기 · `predict` 예측 후 실행)이고, 「그림」은 그림 계약(비트 배열 · 평가 트리 ·
값 상자 · 메모리 줄 · 스택 프레임 · 타입 변환 사다리 · 소유권 화살표)이다. **4지선다는 0부에 없다** —
정본 §1 의 「강제된 능동 출력」이 값을 적게 하는 쪽이고, 정수 폭이나 잘림은 고르기로 물으면
소거법으로 맞힐 수 있다.

| # | id | 무엇 | `cs/` 선행 | 그림 | 형식 | 판 | **초보가 실제로 틀리는 자리 하나** |
|---|---|---|---|---|---|---|---|
| 1 | `cpp/variable-declaration` <sup>기초1에서</sup> | 자리 만들며 이름 붙이기 | `cs/type` | 값 상자 | `value`+`predict` | 2 | `int x;` 를 0 으로 읽는다. 0 이 되는 것은 `int x{};` 뿐이고, `int x;` 를 읽는 것은 정의되지 않은 동작이다 |
| 2 | `cpp/assignment` <sup>기초2에서</sup> | 이름에 값 다시 넣기 | `cs/state` | 값 상자 | `step` | 1 | `v2 = v1;` 뒤에 `v2` 를 고치면 `v1` 도 바뀐다고 읽는다. `std::vector`·`std::string` 은 대입이 **복사**라 `v1` 은 그대로다 — 파이썬 리스트 습관이 정반대로 작동한다 |
| 3 | **`cpp/integer-type`** 신규 | 정수의 폭과 부호 | `cs/bit-and-byte` · **`cs/signed-and-unsigned`(없다 — §0.5)** | 비트 배열 | `bits`+`table` | 3 | `int` 가 어디서나 32비트라고 믿는다. 규격이 보장하는 것은 `sizeof(char) == 1` 뿐이다. 폭을 적으려면 `<cstdint>` 의 `int8_t`~`int64_t`. 리터럴 접미사(`u`·`L`·`f`)와 자릿수 구분자(`1'000'000`, C++14)도 여기 |
| 4 | **`cpp/overflow`** 신규 | 자리가 모자라면 | `cs/integer-overflow` · `cs/undefined-behavior` | 비트 배열 | `predict`+`bits` | 2 | 「C++20 이 정수를 2의 보수로 고정했으니 넘침도 정해졌다」로 읽는다. **표현**은 고정됐고 **부호 있는 넘침은 여전히 UB** 다. 부호 없는 쪽만 2ⁿ 으로 감싼다 |
| 5 | **`cpp/float-type`** 신규 | 실수는 왜 안 떨어지나 | `cs/floating-point` · `cs/binary-representation` | 비트 배열 | `bits`+`value` | 2 | `0.1 + 0.2 == 0.3` 을 참으로 예상한다. 그리고 `std::cout` 기본 정밀도가 6자리라 **틀린 값이 맞게 보인다** — `setprecision(20)` 을 켜야 드러난다 |
| 6 | **`cpp/char-and-byte`** 신규 | 문자와 바이트 | `cs/text-encoding` · `cs/bit-and-byte` | 비트 배열 + 메모리 줄 | `bits`+`value` | 2 | `s.size()` 를 글자 수로 읽는다. **바이트 수**다 — `std::string("가").size() == 3`. 그리고 `char` 의 부호는 구현이 정해서 `char c = 200;` 이 −56 일 수도 200 일 수도 있다 |
| 7 | `cpp/boolean-literal` <sup>기초5에서</sup> | 참·거짓 | `cs/type` | 값 상자 | `table`+`value` | 2 | `bool` 이 있으니 참이 하나라고 읽는다. 정수로 조용히 변해서 `if (count)` 가 통과하고, 반대로 `bool b = 2;` 도 통과해 `b == true` 다 |
| 8 | `cpp/arithmetic` <sup>기초3에서</sup> | 셈하기 | `cs/integer-overflow` | 평가 트리 | `value`+`step` | 2 | `7/2` 를 3.5 로 읽는다. 그리고 `-7/2` 는 0 쪽으로 잘려 **−3** 이다 |
| 9 | `cpp/comparison` <sup>기초4에서</sup> | 견주기 | `cs/type` | 평가 트리 | `value` | 1 | `if (x = 5)` 를 비교로 읽는다. 대입이고, 결과 5 가 참으로 읽혀 조건이 늘 참이다. 컴파일은 통과한다 |
| 10 | **`cpp/operator-precedence`** 신규 | 어느 것이 먼저 묶이나 | — | 평가 트리 | `step`+`build` | 2 | `std::cout << a & b` 를 「`a & b` 를 출력」으로 읽는다. `<<` 가 `&` 보다 세서 `(std::cout << a) & b` 다 — **연산자에 뜻을 붙여도 우선순위는 원래 것**이라는 사실의 첫 노출이고, `cpp/operator-overload`(심화)의 씨앗이다 |
| 11 | **`cpp/conversion`** 신규 | 암묵·명시·잘림 | `cs/type` · `cs/integer-overflow` | 타입 변환 사다리 | `table`+`predict`+`value` | 3 | `-1 < 1u` 를 참으로 읽는다. 거짓이다. 그리고 C 와 갈리는 자리 하나 — **`{}` 는 축소 변환을 막는다**: `int x = 3.5;` 는 통과(3)하고 `int x{3.5};` 는 **컴파일 오류**다. `static_cast` 는 여전히 말없이 자른다 |
| 12 | `cpp/auto` <sup>중심18에서</sup> | 타입 안 적고 이름 만들기 | `cs/type` · `cs/compile-and-run` | 타입 변환 사다리 | `predict`+`table`+`value` | 3 | `auto` 를 「타입이 없다」·「동적 타입」으로 읽는다. 컴파일러가 오른쪽을 보고 정할 뿐 정해지면 안 바뀐다. **그리고 참조와 `const` 를 떨어뜨려** `auto x = v[0];` 이 복사가 된다 — 원본을 고치려면 `auto&` |
| 13 | **`cpp/reference-binding`** 신규 | 이름 둘이 한 값 | `cs/value-vs-reference` · `cs/aliasing` | 메모리 줄 + 값 상자 | `step`+`predict` | 2 | `int& r = x;` 의 `&` 를 「주소를 얻는다」로 읽는다. **선언의 `&`(참조 타입)와 식의 `&`(주소 연산자)는 다른 것**이고, 참조는 새 칸을 안 만든다 — `r` 은 `x` 의 두 번째 이름이다. 이 한 판이 §3 의 `reference-parameter`·`range-for`·`structured-binding` 셋을 먼저 연다 |

**판 27장.** 개념마다 형식 수를 세어 합한 값이다. C(23판)보다 넷 많은데, 셋이 C++ 고유의 자리다 —
`auto` · `{}` 축소 금지 · 참조.

### §0.2 세 언어가 갈리는 자리 열넷

**같은 표가 `c.md`·`rs.md` §0.2 에도 있다.** 셋은 서로의 대조군이라 한 편만 보고는 자리를 못 잡는다 —
「C++ 은 참조가 있다」는 「C 는 포인터로만 한다」·「Rust 는 빌림 규칙이 개수를 정한다」와 나란히 놓아야
뜻이 선다. 고칠 때 셋을 함께 고친다.

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

`c.md` §0.3 의 규칙 다섯이 C++ 에 그대로 적용된다(정답을 값으로 두지 않는다 · 「아무 값이나」로
가르치지 않는다 · `-O0`/`-O2` 두 결과를 나란히 보인다 · 관측 가능한 것만 `predict` 로 낸다 ·
UBSan 을 켤지는 사용자 결정). **C++ 에서 하나 더 붙는다.**

**⑥ C++ 의 UB 는 값이 아니라 객체 수명에서 더 자주 난다.** C 의 대표 UB 는 넘침·범위 밖 읽기처럼
**값**의 문제이고 0부에서 다 보인다. C++ 에서 실제로 학습자를 무는 것은 §9 의 5·6·7 이다 —
컴파일러가 만들어 준 얕은 복사본이 같은 포인터를 둘 다 지우는 것 · `virtual` 없는 소멸자 ·
객체 잘림(slicing). 셋 다 **컴파일도 되고 대개 돌아가다가** 어느 날 터진다.

그래서 C++ 의 UB 판은 **0부가 아니라 2부(객체와 소유)에 앉는다.** 0부의 `cpp/overflow` 는
「답이 없다는 답」이라는 형식 자체를 가르치는 자리이고, 2부에서 그 형식이 소멸자·복사에 다시 온다.
0부에서 셋을 미리 보여 주면 클래스를 모르는 상태라 그림이 안 그려진다.

**그리고 C++ 은 「돌아갔으니 맞다」가 C 보다 더 위험하다.** 얕은 복사 이중 해제는 대부분의 실행에서
아무 일도 안 일어나고, 그 침묵이 「내 코드가 맞다」의 증거로 읽힌다. UBSan 에 더해
**ASan(`-fsanitize=address`)** 이 이 갈래를 잡는다 — 켤지는 러너 어댑터를 열 때의 사용자 결정이고
**안 정했다**.

### §0.4 겹침 정리 — 무엇을 어디서 지우나

0부는 새 개념 7개(`integer-type`·`overflow`·`float-type`·`char-and-byte`·`operator-precedence`·
`conversion`·`reference-binding`)만 더하고 나머지 6개는 **아래에서 올려 온다.** 아래에는 남기지
않는다 — 같은 개념이 두 부에 있으면 학습자는 두 번째를 「전에 본 것」으로 흘려보내고, 큐는 같은
개념을 두 번 인쇄한다.

| 어디서 | 무엇 | 어떻게 |
|---|---|---|
| §2 기초 8 | `variable-declaration` `assignment` `arithmetic` `comparison` `boolean-literal` | 0부로 올린다. §2 는 `if-statement`·`function-definition`·`return-statement` 셋이 남고 그것이 1부의 뼈대가 된다 |
| §3 중심 15 | `auto` | 0부로 올린다. 중심 14. **근거**: `auto` 를 중심에 두면 학습자가 `std::vector<std::pair<int,std::string>>::const_iterator` 를 만나기 전에는 왜 있는지 모르는데, 0부의 「이름과 타입」 자리에서는 **타입을 적는 것과 안 적는 것의 대조**로 한 판에 선다 |
| §3 중심 | `reference-parameter` | **안 올린다.** 0부의 `reference-binding` 은 `int& r = x;`(이름 둘이 한 값)이고, 중심의 그것은 `void f(std::vector<T>& v)`(부르는 쪽에 표시가 없다)다. 뒤엣것은 함수를 배운 뒤라야 그림이 그려진다. 선행을 `cpp/reference-binding` 으로 건다 |
| §4 심화 8 | — | 안 건드린다 |

### §0.5 그림이 특히 값을 내는 자리

C++ 에서 그림이 가장 많은 일을 하는 자리는 **복사냐 아니냐**다. §9 의 오개념 12 중 넷(2·5·7·11)이
거기 있고, 넷 다 그림 하나로 끝난다.

| 그림 | 어느 개념 | 그림 하나가 답하는 질문 |
|---|---|---|
| **메모리 줄** (둘을 나란히) | `assignment` `reference-binding` `std-vector` `range-for` `structured-binding` | 「`v2 = v1;` 은 몇 칸이 생기나」 — 줄 두 개를 그리면 복사고, 줄 하나에 이름 둘을 붙이면 참조다. **`&` 한 글자가 줄을 하나 그릴지 둘 그릴지를 정한다**는 것이 C++ 성능 사고의 절반이다(§3 #11) |
| **비트 배열** | `integer-type` `overflow` `float-type` `char-and-byte` | 「`char c = 200;` 이 왜 −56 인가」 — 8칸을 그리고 맨 앞 칸이 부호라고 말하면 끝난다. 부동소수는 같은 그림을 부호1·지수·가수로 나눠 「0.1 을 적을 칸이 모자란다」를 보인다 |
| **스택 프레임** | `constructor` `destructor` `new-delete` `smart-pointer` `exception-handling` | 「소멸자가 언제 불리나」 — 프레임이 `}` 에서 통째로 사라지는 것을 그리면 **아무 줄도 없이 불리는 이유**가 보인다. 예외가 던져질 때 프레임 여럿이 차례로 벗겨지는 것도 같은 그림이다 |
| **타입 변환 사다리** | `conversion` `auto` | `char`→`int`→`unsigned`→`long` 을 계단으로 그리고, `auto` 는 **오른쪽 값에서 참조와 `const` 를 떼어 내는 계단 하나**로 그린다 — `auto x = v[0]` 이 왜 복사인지가 화살표 하나다 |
| 평가 트리 | `arithmetic` `comparison` `operator-precedence` `operator-overload` | `std::cout << a & b` 를 트리로 그리면 `<<` 가 먼저 묶이는 것이 눈에 보인다 |
| 값 상자 | `variable-declaration` `boolean-literal` | `int x;` 의 상자를 **비워 두지 않고 쓰레기로 채워** 그린다. 「비어 있다」로 그리면 0 이라는 오개념이 그림에서 나온다 |
| 소유권 화살표 | `smart-pointer` `move` `rule-of-five` | `unique_ptr` 은 화살표 하나, `shared_ptr` 은 화살표 여럿 + 숫자 하나. `std::move` 는 **화살표가 옮겨 가는 것**이지 값이 옮겨 가는 게 아니다(§9 오개념 1) |

**막힌 것 둘 — 스택 프레임이 아직 컴포넌트가 없다.** `design/system/diagrams.md` §3 에서
스택 프레임·메모리 줄·소유권 화살표 셋은 명세만 있고 아직 안 만들었다. **C++ 2부 열둘 중 다섯**
(`constructor`·`destructor`·`new-delete`·`smart-pointer`·`exception-handling`)이 스택 프레임 하나에
걸린다 — 소멸자가 언제 불리는지를 글로만 쓰면 그 다섯이 전부 「외우는 규칙」이 된다.
0부는 만든 셋(비트 배열·평가 트리·값 상자)으로 열셋 중 아홉이 서고, 메모리 줄이 필요한 둘
(`char-and-byte`·`reference-binding`)과 사다리가 필요한 둘(`conversion`·`auto`)이 남는다.

**막힌 것 하나 — `cs/signed-and-unsigned` 가 43장에 없다.** `c.md` §7 이 그 이름을 제안했는데
`cs.md` §10 이 받지도 물리지도 않고 지나갔다. `cpp/integer-type` 과 `cpp/conversion` 이 걸 데가
지금 `cs/bit-and-byte` 하나뿐인데, 그 장은 「여덟 자리를 한 덩이로 센다」이지 「같은 비트를 음수로
읽을지 큰 양수로 읽을지」가 아니다. **43 → 44 로 늘리는 제안이고 `cs.md` 는 이 세션 범위 밖이다.**

### §0.6 사슬 — 0부에서 3부까지

정본 §4 의 부는 **교재 축**이다(1부 합성 · 2부 합성+내 코드 · 3부 내 코드 중심). C++ 에서는 그 축이
무너진다 — **사용자 리포에 C++ 이 한 장도 없다**(§0.7). 그래서 부 이름을 교재가 아니라
**무엇을 읽게 되는가**로 붙였다.

| 부 | 이름 | 개념 | 무엇을 읽게 되나 | 판 | 일 |
|---|---|---|---|---|---|
| 0부 | 값과 식 | 13 | 한 줄 안의 값 | 27 | 14 |
| 1부 | 문과 표준 라이브러리 | 9 | 한 함수 | 18 | 9 |
| 2부 | 객체와 소유 | 12 | 한 타입 | 36 | 18 |
| 3부 | 일반화 | 4 | 한 라이브러리 | 12 | 6 |
| | | **38** | | **93** | **47** |

1부(9) `if-statement` `function-definition` `return-statement` `namespace-qualification` `std-string`
`std-vector` `range-for` `stream-output` `enum-class`
2부(12) `class-definition` `constructor` `destructor` `reference-parameter` `const-qualifier`
`smart-pointer` `move` `new-delete` `rule-of-five` `exception-handling` `structured-binding` `std-optional`
3부(4) `lambda` `template-function` `operator-overload` `virtual-override`

**3부가 넷뿐인 것이 이 언어의 모양이다.** C++ 에서 「그 언어를 쓰는 사람과 그 언어로 공학하는 사람을
가르는 자리」는 템플릿·연산자 오버로드·가상 함수인데, 그 셋을 쓰려면 2부의 열둘이 전부 서 있어야
한다. 자바가 3부에 스프링 15를 놓은 것(D176)과 대비된다 — C++ 에는 그 자리를 채울 프레임워크가
표본에 없다.

**판 수의 근거는 부마다 다르다.** 0부 27 은 §0.1 표의 「판」 열을 더한 값이다. **1~3부 는 안 쟀다** —
1부 개념당 2판, 2·3부 개념당 3판으로 가정한 값이고, 2·3부에 3판을 준 근거는 「그림이 둘 이상
필요하다」는 판단뿐이다. 일수는 D12 의 하루 새 판 2장으로 나눈 것이고 **재검·복습을 안 센 하한**이다.

**0부 14일이 첫 `if` 앞을 막는다.** `c.md` §0.6 과 같은 문제이고 답도 같아야 한다 —
ⓐ 0부와 1부를 **엇갈려 낸다**(하루 2장 중 한 장씩) ⓑ 0부를 자른다. **안 정했다.**
C++ 은 C 보다 이틀 더 길어 이 결정이 더 아프다.

**0장(프롤로그) 상한이 깨진다.** §5 가 깊이 ≤ 2 = **21/24** 라고 적었다. 신규 7개의 깊이는
`integer-type` 1 · `float-type` 1 · `reference-binding` 1 · `overflow` 2 · `char-and-byte` 2 ·
`operator-precedence` 2 · `conversion` 2 로 전부 상한 안이므로 **21 → 28 이다. 상한을 4 넘는다.**
`packages/concepts/src/zero-chapter.test.ts` 가 잡는다. README §7 ①의 「0장 상한은 사용자 결정」이
여기서 열린다 — 28판이면 14일이다. (`c.md` 24→28 · `rs.md` 22→28 로 셋이 같은 값에 닿는다.
0부가 얕은 개념만 더하기 때문이다.)

→ **정해졌다(D184, 2026-09-05): 상한 폐지.** `essential` 에 넣고 **자르지 않는다.** 위 문단의 「상한을 넘는다」는
더는 문제가 아니고, 넷째 정렬 키(id 알파벳순)가 돌 일도 없다. 남는 것은 프롤로그 길이뿐이다 — 하루 2장이면 28판 = 14일.

### §0.7 교재 — C++ 은 내 리포에 한 장도 없다 (실측 2026-09-05)

정본 §4 규칙 ①은 「개념마다 내 코드의 자리를 짚고, 없으면 「네 코드엔 없다」를 명시한다」이다.
C++ 은 그 「없다」가 **전부**다.

사용자 리포 열(`~/Desktop/git/`)에서 `.cpp` · `.cc` · `.cxx` · `.hpp` · `.hh` — **전부 0장**이다.
`.h` 468장이 잡히지만 452장이 `target/*/build/aws-lc-sys-*/out/include/openssl/**`(빌드가 푼 C 헤더)
이고 나머지 16장도 `.venv`·`onig_sys` 산출물이다. C 는 그나마 「빌드가 받아 온 남의 C」가 있는데
C++ 은 그마저 없다.

**그래서 세 부 중 3부(내 코드 중심)가 안 서고, 2부의 「합성 + 내 코드」에서 뒤쪽 절반도 안 선다.**
D158 이 연 조건부 경로가 답이다 — ⓐ 개념마다 「네 코드엔 없다」를 명시하고 ⓑ `previewSiteId` 자리에
예고 대신 **「왜 네 코드엔 없나」**를 넣는다. C++ 의 답: 「네 앱들은 Tauri·파이썬이고, C++ 이 서는
자리(게임 엔진·수치 계산·데스크톱 네이티브 UI)를 네가 안 만들었다.」

**이것을 D177 의 자바와 비교하면 규모가 다르다.** 자바는 표본 리포에 99장이 있는데 그 안에
`abstract class` 0곳 · 제네릭 경계 0곳이라 「일부가 없다」였다. C++ 은 **파일이 0장**이라
D177 규칙 ②(「3부는 내 코드가 먼저이고 합성은 그 모양이 없을 때만」)가 항상 「없을 때」로 평가된다.
규칙이 안 깨지고 그냥 한쪽으로만 도는 것이므로 새 결정은 필요 없지만, **화면이 그 사실을 말해야
한다** — 「이 언어는 네 리포에 없어서 전 과정이 합성 예제다」를 코스 시작에 한 번.

**미결.** 그러면 C++ 코스를 띄울 근거가 무엇인가. 지금 답은 「사용자가 고르면」이고, 리포 스캔이
근거가 되는 다른 아홉 언어와 진입 경로가 다르다. **안 정했다** — 이 판단은 `docs/curriculum/README.md`
(I6 범위)와 첫 실행 화면 쪽이다.

**측정 방법.** `find` 로 확장자를 세고 경로를 눈으로 분류했다. tree-sitter 로 파싱하지 않았다 —
0장이라 파싱할 것이 없었다.

### §0.8 결정 등록부에 올릴 행

**초안은 `c.md` §0.8 에 한 벌만 있다** — 세 편(`c`·`cpp`·`rs`)의 §0 을 한 행이 함께 덮으므로
복제하지 않는다. 아직 등록부에 안 올렸고, 함께 열리는 사용자 결정 넷도 거기 적혀 있다.

---

## §2 기초 — 바닥 여덟

> **§0 신설 뒤 다섯이 위로 갔다** — `variable-declaration`·`assignment`·`arithmetic`·`comparison`·
> `boolean-literal` 은 §0.1 에 있다. 아래 표는 신설 전 기록으로 남긴다. 1부에 남는 것은
> `if-statement`·`function-definition`·`return-statement` 셋이고 나머지는 §0.6 이 배치한다.

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

> **§0 신설 뒤 하나가 위로 갔다** — `auto`(18). 중심은 14 다(§0.4).
> `reference-parameter`(13)는 여기 남되 선행이 새 개념 `cpp/reference-binding`(§0.1 #13)으로 바뀐다.

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
| 22 | `cpp/exception-handling` | 터진 것을 받아 잇기 / Exceptions | `catch` | `common/try-catch` | 4 | 17 | 던지면 사이의 **지역 객체 소멸자가 전부 불린다**. `catch` 에서 `&` 를 빼면 예외가 잘려 나간다. **이 순서를 묻는 것이 C++ 에서만 성립하는 판이다** — 나머지 아홉은 걷힐 때 도는 사용자 코드가 없다([`cpp-learning.md`](./cpp-learning.md) §11.3 ②) |
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

> **아래 21/24 는 §0 신설 전 값이다.** 신설 뒤 깊이 ≤ 2 가 **28** 이라 상한을 4 넘는다 — 근거는 §0.6 끝.
> → D184 로 상한이 폐지됐다. 28 은 이제 「넘친 수」가 아니라 프롤로그 판 수다.

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
| Stroustrup, *Programming: Principles and Practice Using C++* 3판, 2024 — 목차 전문 (2장 Objects/Types/Values · 3.6 `vector` · 15장 Free Store · 16장 Arrays, Pointers, and References) | stroustrup.com `PPP3_TOC.pdf` |
| learncpp.com 목차 — 12장 References and Pointers · 16장 `std::vector` · 19장 Dynamic Allocation | learncpp.com |
| C++ Core Guidelines In.not · In.target — **교육 지침이 없다**는 부정 결과 | isocpp.github.io/CppCoreGuidelines |

**확인 못 함**

- `Widget w(x);` 의 실제 파싱 결과(§8 ②). corpus 에 없다 — 사전 시험에 한 줄 넣어 찍어야 한다.
- 클래스 안 인라인 메서드가 `function_definition` 인지 `inline_method_definition` 인지.
- 0.23.4 의 파싱 시간·메모리. `STATE_COUNT` 가 우리가 쓰는 문법 중 가장 커서 `ingest.file_p95` 예산에 걸릴 수 있다. 실측 안 함.
- LLM C++ 산출물의 관용 분포(스마트 포인터 대 raw `new` 비율). LLM-HPC++(arXiv 2512.17023)이 「스마트 포인터를 자주 잘못 다룬다」고 보고하지만 **비율 수치는 확인 못 했다** — §1 의 「혼용한다」는 그 논문의 정성 서술과 이 문서 저자의 관찰이다.
- Milne & Rowe(2002)·Bruce-Lockhart & Norvell 은 초록·2차 인용으로만 확인했고 **원문 전문은 안 읽었다.**
- learncpp 가 포인터를 12장에 둔 **이유**. 사이트에 근거 서술이 있는지 못 찾았다 — 순서만 확인했다.

---

## §11 학습법 — 이 언어를 이해한다는 것

800줄 상한에는 안 걸리지만 C·Rust 와 같은 자리에 두려고 [`cpp-learning.md`](./cpp-learning.md) 로 분리했다 — C 의 기계에 무엇이 더해졌나 ·
PPP3 대 learncpp 의 포인터 배치 · 복사 횟수 세기가 T1 을 통과하는 이유 · 소멸 순서가 「C++ 특유」가
아닌 이유 · 「C++ 은 코스를 열지 않는다」 판단 · 바꿀 것 diff.
