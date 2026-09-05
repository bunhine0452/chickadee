# Rust 커리큘럼 조사 — 네임스페이스 `rs`

조사일 2026-09-04. `dictionary/rs/**` 는 아직 없다. 이 문서는 그 앞의 결정 재료다.

> 2026-09-05 에 사용자 리포 넷(`ai-pm` 280장 · `file_converter` 45 · `PySpace` 8 · `ECC` 16)으로
> 실측을 붙였다 — **[`docs/plan/rust-axis.md`](../plan/rust-axis.md)**. 이 문서의 「확인 못 한 것」
> 중 둘이 그때 닫혔고(§8), 아직 안 반영한 설계 변경 둘(`async`/`await` 개념 추가 ·
> `smart-pointer → shared-thread-state` 선행 끊기)은 그 계획 §2.3 에 근거와 함께 적혀 있다.

## §1 언어 좌표

TIOBE 2026-08 에서 **10위 · 1.45%**(7월 1.34%로 첫 진입). CLI 도구 · 시스템/네트워크 서비스 ·
WASM, 그리고 **Tauri 데스크톱의 뒤쪽**을 만든다. 마지막이 이 앱에 직접 걸린다 — 바이브 코딩
사용자가 Rust 를 처음 만나는 자리는 대개 자기가 띄운 Tauri 껍데기 안이다.

| 항목 | 값 |
|---|---|
| `lang` / `grammar` | `rs` / `rust` |
| 크레이트 | `tree-sitter-rust` 0.23.3 — `crates/parse/Cargo.toml` 에 이미 있고 `langs.rs` 에 등록됨 |
| 확장자 | `.rs` 하나 |
| `grammar_abi` | **14** (§8) |

### 이 리포의 Rust 는 편향돼 있다

`crates/**` + `apps/desktop/src-tauri/src/**` 의 비시험 21파일 2,884줄 계수.

| 구문 | 수 | 구문 | 수 |
|---|---|---|---|
| `?` | **144** | `trait` 선언 | **0** |
| `let` | 284 (`let mut` 52 = 18%) | `impl … for` | 3 |
| `&mut` | 26 | `#[derive(…)]` | 33 |
| `match` | 30 | 매크로 호출 | 38 (시험엔 249) |
| `struct` / `enum` | 36 / 3 | `unsafe` | **0** |
| `.to_owned()` / `.clone()` | 47 / 21 | 명시 수명 인자 | **10** (6이 `&'static str`) |
| `for … in` / `while` | 32 / 7 | `Box` · `Rc`/`RefCell` · `Arc`/`Mutex` | 1 · 1 · 10 |

원인은 줄 예산이 아니라 **방벽 여덟**(D129)이다. `forbid(unsafe_code)` 라 `unsafe` 0,
「도메인 어휘 금지 · 1 크레이트 = 1 래핑 · 공개 함수 ≤ 8」이라 추상화를 만들 이유가 없어
`trait` 선언 0, `println!` 이 게이트에서 금지라 출력 매크로가 소스에 **한 곳도 없다**(일반 리포와 정반대).

일반 Rust 리포에서 더 나오는 것: `trait` 선언과 `impl Trait for`, 제네릭 함수와 `where`,
`async`/`.await`(tokio), `thiserror`/`anyhow`, `println!`/`log`, 명시 수명 인자, `Box<dyn Error>`, `unwrap()`.
커리큘럼은 이쪽 기준으로 짜고 이 리포는 **하한 표본**으로만 쓴다.

바이브 코딩 Rust 는 빌림 오류를 `.clone()` · `Arc<Mutex<_>>` · `'static` · `unwrap()` 으로
우회하는 경향이 보고된다(계량 근거 없음 — §10). 이 경향이 `_lang.yaml` 의 `alternatives`
(「AI 가 대신 쓴 것」)에 그대로 쓰인다.

## §0 0부 — 이 언어의 값과 식

> 2026-09-05 추가. 사용자 요청 「기초부터 심화까지, 언어의 동작 원리부터. 처음 배우는 사람이
> 정수형·실수형·연산식을 이해하고 말 그대로 언어를 이해한다는 느낌으로」에 대응한다.
> 문서 순서로도 코스 순서로도 **§2 앞**이다. 정본 §4 의 부(교재 축)를 한 칸 더 아래로 판 것이고,
> 이 문서가 §2~§4 에서 쓰던 난이도 축(기초/중심/심화)과는 다른 축이다.

**왜 Rust 에 0부가 따로 필요한가.** 다른 아홉 언어에서 0부는 「감춰진 것을 드러내는」 일인데
Rust 에서는 반대다 — **이미 드러나 있는 것을 읽는 법**이다. 폭이 타입 이름에 적혀 있고(`u8`·`i64`),
넘침이 빌드 프로필에 따라 정해져 있고, 변환이 `as` 라는 낱말로 코드에 남는다. 그래서 Rust 0부는
이 세 편 중 **유일하게 실측 근거가 붙는 0부**다(§0.7) — C·C++ 은 `sizeof` 로만 잴 수 있는 것을
Rust 는 **식별자로 센다**.

그리고 그 때문에 0부를 건너뛰면 소유권 전에 먼저 막힌다. §9 의 오개념 12 와 별개로, 컴파일러가
0부에서 내는 오류가 이미 셋이다 — E0308(`1i32 + 1i64` · `if 1`) · E0384(`let` 에 다시 대입) ·
E0381(초기화 전 사용). 소유권 오류(E0382·E0499)는 그다음이다.

### §0.1 개념 열하나

「형식」은 문항 형식 계약(`value` 값 적기 · `step` 한 걸음씩 · `bits` 비트로 보기 · `table` 표 채우기 ·
`build` 거꾸로 만들기 · `predict` 예측 후 실행)이고, 「그림」은 그림 계약(비트 배열 · 평가 트리 ·
값 상자 · 메모리 줄 · 스택 프레임 · 타입 변환 사다리 · 소유권 화살표)이다. **4지선다는 0부에 없다.**

| # | id | 무엇 | `cs/` 선행 | 그림 | 형식 | 판 | **초보가 실제로 틀리는 자리 하나** |
|---|---|---|---|---|---|---|---|
| 1 | `rs/let-binding` <sup>기초1에서</sup> | 이름에 값 묶기 | `cs/immutability` · `cs/state` | 값 상자 | `value`+`predict` | 2 | 섀도잉(`let x = x + 1;`)을 「값을 바꿨다」로 읽는다. 이름이 **하나 더 생긴** 것이고 앞의 `x` 는 그대로 살아 있다(다른 타입이어도 된다) |
| 2 | `rs/mut-binding` <sup>기초2에서</sup> | 바꿀 수 있다고 적기 | `cs/state` | 값 상자 | `step` | 1 | `mut` 을 「이 값이 변한다」로 읽는다. **이름에 붙는 표시**라 `let mut v` 의 `v` 를 다른 `Vec` 로 갈아 끼우는 것도, 안의 원소를 고치는 것도 같은 한 글자가 연다 |
| 3 | **`rs/integer-type`** 신규 | 정수의 폭과 부호 | `cs/bit-and-byte` · **`cs/signed-and-unsigned`(없다 — §0.5)** | 비트 배열 | `bits`+`table` | 2 | `usize` 를 「그냥 정수」로 읽는다. **포인터 폭**이고 길이·색인 자리에만 쓴다 — `v.len()` 이 `usize` 라 `i32` 와 못 더한다(E0308). 실측에서 폭 붙은 타입 이름 2,885곳 중 `usize` 가 299곳이다(§0.7) |
| 4 | **`rs/overflow`** 신규 | 자리가 모자라면 | `cs/integer-overflow` | 비트 배열 | `predict`+`bits`+`table` | 3 | 「Rust 는 안전하니 넘침도 막힌다」로 읽는다. **디버그에서 패닉하고 릴리스에서 감싼다** — 같은 코드가 빌드 프로필에 따라 다르게 돈다. 뜻을 코드에 적는 법 넷: `wrapping_`(감싼다) `checked_`(`Option`) `saturating_`(끝에 붙는다) `overflowing_`(값 + 넘쳤나) |
| 5 | **`rs/float-type`** 신규 | 실수는 왜 안 떨어지나 | `cs/floating-point` · `cs/binary-representation` | 비트 배열 | `bits`+`value` | 2 | `0.1 + 0.2 == 0.3` 을 참으로 예상한다. **그리고 Rust 만의 결과가 하나 더** — `f64` 는 `Ord` 가 아니라 `PartialOrd` 다(NaN 이 자기 자신과도 안 같아서). 그래서 `v.sort()` 가 컴파일 안 되고 `sort_by(\|a, b\| a.partial_cmp(b).unwrap())` 를 쓴다. **근사값이라는 사실이 타입 시스템에 드러난 유일한 언어**다 |
| 6 | **`rs/char-and-byte`** 신규 | 문자와 바이트 | `cs/text-encoding` · `cs/bit-and-byte` | 비트 배열 + 메모리 줄 | `bits`+`value`+`table` | 3 | `s.len()` 을 글자 수로 읽는다. **바이트 수**다 — `"가".len() == 3`. 그리고 `s[0]` 이 아예 컴파일 안 된다(바이트 색인이 글자를 반 자를 수 있어서). 셋을 갈라야 한다 — `char`(유니코드 스칼라 **4바이트**) · `b'a'`(`u8`) · `.chars()` 대 `.bytes()` |
| 7 | `rs/boolean-literal` <sup>기초3에서</sup> | 참·거짓 | `cs/type` | 값 상자 | `value` | 1 | 「0 이면 거짓」을 기대한다. 조건 자리에 `bool` **만** 온다 — `if 1` 도 `if opt` 도 E0308. C 에서 온 사람의 첫 오류 |
| 8 | `rs/comparison` <sup>기초4에서</sup> | 견주기 | `cs/type` | 평가 트리 | `value` | 1 | `1i32 == 1u8` 을 참으로 읽는다. 타입이 같아야 견준다(E0308). 조건 안의 `=` 가 막히는 이유도 다르다 — 대입식의 값이 `()` 라 `bool` 자리에 안 맞는다 |
| 9 | `rs/arithmetic` <sup>기초5에서</sup> | 셈하기 | `cs/integer-overflow` | 평가 트리 | `value`+`step` | 2 | `7/2` 를 3.5 로 읽는다. 0 쪽으로 잘려 3 이고 `-7/2` 는 −3 이다. 그리고 **타입이 다르면 못 더한다** — `a + b` 앞에 `as` 나 `into()` 가 붙어 있으면 그건 장식이 아니다 |
| 10 | **`rs/operator-precedence`** 신규 | 어느 것이 먼저 묶이나 | — | 평가 트리 | `step`+`build` | 2 | `x as u8 + 1` 을 「`x` 를 `u8+1` 로」로 읽는다. `as` 가 이항 연산자보다 세서 `(x as u8) + 1` 이다. 그리고 **`&` 가 두 뜻**이라 `&v[0]` 은 `&(v[0])` 이지 `(&v)[0]` 이 아니고, `..` 가 가장 약해 `0..n+1` 은 `0..(n+1)` 이다 |
| 11 | **`rs/cast-as`** 신규 | 변환은 셋 중 하나다 | `cs/type` · `cs/integer-overflow` | 타입 변환 사다리 | `table`+`predict`+`value` | 3 | `as` 를 「타입을 맞춰 주는 낱말」로 읽는다. **말없이 자른다** — `300u32 as u8` 은 44 다. 셋을 갈라야 한다: `as`(잃어도 조용) · `From`/`Into`(안 잃는 것만) · `TryFrom`/`try_into`(실패가 `Result` 로 온다). 실측에서 `as` 563곳 대 `try_into`/`TryFrom` 12곳 — **47배**다(§0.7) |

**판 22장.** 개념마다 형식 수를 세어 합한 값이다. C 23 · C++ 27 보다 적은데, Rust 는 **폭·부호가
이름에 적혀 있어 표가 짧기** 때문이다. 대신 `overflow`·`char-and-byte`·`cast-as` 셋이 3판을 받는다 —
셋 다 「방법이 여럿인데 뜻이 다르다」라 표 하나로 안 끝난다.

### §0.2 세 언어가 갈리는 자리 열넷

**같은 표가 `c.md`·`cpp.md` §0.2 에도 있다.** 셋은 서로의 대조군이라 한 편만 보고는 자리를 못 잡는다 —
「Rust 는 암묵 변환이 하나도 없다」는 「C 는 조용히 돈다」와 나란히 놓아야 뜻이 선다.
고칠 때 셋을 함께 고친다.

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
| **`predict` 가 답을 갖나** | **UB 자리에서는 안 갖는다** | 같다 | **갖는다.** 넘침조차 「디버그면 패닉, 릴리스면 감싼다」로 정해져 있다 |

### §0.3 `predict` 가 Rust 에서 다른 뜻인 자리

C·C++ 의 `predict` 는 「답이 없다는 것이 답」인 문항이 섞인다(`c.md` §0.3). **Rust 에서는 안 섞인다** —
`rs/unsafe-block`(심화) 밖에서 정의되지 않은 동작이 안 나오기 때문이다. 그래서 같은 형식 이름이
여기서는 답이 하나인 문항이다. 다만 **답이 하나인데 조건이 붙는** 자리가 셋 있고, 그 셋이 Rust
`predict` 의 값이 나오는 곳이다.

| 무엇 | 예측의 정답 | 왜 이것이 교훈인가 |
|---|---|---|
| 넘침 | 「디버그면 패닉, 릴리스면 감싼다」 | **빌드 프로필이 동작을 정한다**는 것을 처음 만나는 자리. C 의 UB 와 겉모습이 비슷한데 **정해져 있다**는 것이 정반대다 — 두 언어를 나란히 보여 줄 값이 여기 있다 |
| `as` 로 자름 | 「44」(값 하나) | 예측이 맞는데 **의도와 다른** 자리. 「돌아갔으니 맞다」의 반례를 UB 없이 만드는 유일한 방법이다 |
| `f64` 비교 | 「`0.1 + 0.2 == 0.3` 은 false」 | 값 예측이 정확히 틀리는 자리. `println!("{:.20}", 0.1 + 0.2)` 로 확인시킨다 |

**러너(D175 · `docs/plan/rust-axis.md` §3 의 cargo 어댑터)가 있으면 넘침 판은 두 번 돈다** —
`cargo run` 과 `cargo run --release`. 결과가 「패닉」과 「44」로 갈리는 것을 눈으로 보이고 나서
「둘 다 정의된 동작이다」를 말한다. 러너가 없으면 이 판은 게이트에서 빠진다(정본 §2).

### §0.4 겹침 정리 — 무엇을 어디서 지우나

0부는 새 개념 6개(`integer-type`·`overflow`·`float-type`·`char-and-byte`·`operator-precedence`·
`cast-as`)만 더하고 나머지 5개는 **아래에서 올려 온다.** 아래에는 남기지 않는다.

| 어디서 | 무엇 | 어떻게 |
|---|---|---|
| §2 기초 8 | `let-binding` `mut-binding` `boolean-literal` `comparison` `arithmetic` | 0부로 올린다. §2 는 `if-expression`·`function-item`·`tail-expression` 셋이 남고 그것이 1부의 뼈대가 된다 |
| §3 중심 16 | `string-vs-str` | **안 올린다.** 0부의 `char-and-byte` 는 「글자와 바이트가 다르다」이고, `string-vs-str` 은 「가진 것과 빌린 것이 다르다」다 — 앞엣것은 인코딩, 뒤엣것은 소유권이라 층이 다르다. 다만 선행을 `rs/char-and-byte` 로 건다(지금은 `string-literal`·`borrow-shared`) |
| §3 중심 | `format-macro` | **안 올린다.** `{}` 와 `{:?}` 가 다른 트레이트를 부르는 것은 트레이트를 안 배운 0부에서 그림이 안 그려진다. 다만 0부의 `predict` 판이 출력에 `println!` 을 쓰므로 **문법만 미리 보여 주고 개념은 1부에서** — 자바 1부가 `System.out.println` 을 그렇게 쓴 것과 같다 |
| §4 심화 10 | — | 안 건드린다 |

### §0.5 그림이 특히 값을 내는 자리

Rust 에서 그림이 가장 많은 일을 하는 자리는 **값이 어디 있고 누가 그것을 볼 수 있나**다.
소유권은 §3~§4 의 주제인데, **그 그림의 절반이 0부에서 이미 필요하다** — `String` 이 왜 색인이
안 되는지를 그리려면 스택의 세 칸과 힙의 줄을 먼저 그려야 한다.

| 그림 | 어느 개념 | 그림 하나가 답하는 질문 |
|---|---|---|
| **메모리 줄 + 스택 프레임** (함께) | `char-and-byte` `string-vs-str` `vec` `borrow-shared` | 「`"가".len()` 은 왜 3인가」 — 힙에 바이트 줄을 그리고 `EA B0 80` 세 칸을 칠한다. 스택에는 칸 셋(ptr·len·cap). `&str` 은 그 줄의 **일부를 가리키는 화살표 + 길이**라, `s[0]` 을 막는 이유가 「반 자를 수 있어서」로 그림에서 나온다 |
| **비트 배열** | `integer-type` `overflow` `float-type` `char-and-byte` | 「`300u32 as u8` 이 왜 44인가」 — 32칸을 그리고 뒤 8칸만 남기고 지운다. 넘침도 같은 그림이다(맨 앞 칸에서 떨어져 나가는 자리올림). `f64` 는 부호1·지수11·가수52 로 나눠 「0.1 을 적을 칸이 모자란다」 |
| **타입 변환 사다리** (화살표 셋) | `cast-as` `arithmetic` `comparison` | Rust 의 사다리는 **화살표 종류가 셋**이라 C 와 다르게 그린다 — `as` 는 계단을 **뛰어내리는**(잃어도 조용) 화살표, `From`/`Into` 는 **올라가는**(안 잃는) 화살표, `TryFrom` 은 **갈라지는**(성공·실패) 화살표. 셋이 한 그림에 있으면 「왜 셋이나 있나」를 안 물어도 된다. 그리고 **계단 사이에 자동으로 도는 화살표가 하나도 없다**는 것이 이 그림의 요점이다 |
| 소유권 화살표 | `let-binding` `move` `clone` `borrow-shared` `borrow-mut` | 0부에서는 `let b = a;` 한 줄에만 쓴다 — 화살표가 **옮겨 가고 원래 이름이 회색이 되는** 그림. 규칙(몇 개까지)은 §3 |
| 값 상자 | `let-binding` `mut-binding` `boolean-literal` | 섀도잉은 상자를 **하나 더 그린다**(덮어쓰지 않는다). 이 그림 하나가 「값을 바꿨다」는 오독을 막는다 |
| 평가 트리 | `arithmetic` `comparison` `operator-precedence` | `x as u8 + 1` 을 트리로 그리면 `as` 가 아래에 묶이는 것이 보인다 |

**타입 변환 사다리는 비트 배열 둘로 대신 안 된다 (Rust 근거).** `design/system/diagrams.md` §3 이
그 그림을 명세만 두고 「비트 배열 둘로 대신 되는지 먼저 확인할 것」이라 적었다. C·C++ 에서는 될지도
모르지만 **Rust 에서는 안 된다** — 비트 배열 둘은 「32칸이 8칸이 됐다」(값의 변화)를 보이는데,
Rust 0부가 가르쳐야 하는 것은 **화살표 종류가 셋이고 자동으로 도는 화살표가 하나도 없다**는 것이다.
그건 값이 아니라 **관계**라 계단 그림이라야 한다. `rs/cast-as` 한 개념이 이 그림의 유일한 필수
사용처다.

**막힌 것 하나 — `cs/signed-and-unsigned` 가 43장에 없다.** `c.md` §7 이 그 이름을 제안했는데
`cs.md` §10 이 받지도 물리지도 않고 지나갔다. `rs/integer-type` 이 걸 데가 지금 `cs/bit-and-byte`
하나뿐인데, 그 장은 「여덟 자리를 한 덩이로 센다」이지 「같은 비트를 음수로 읽을지 큰 양수로
읽을지」가 아니다. **43 → 44 로 늘리는 제안이고 `cs.md` 는 이 세션 범위 밖이다.**

### §0.6 사슬 — 0부에서 3부까지

부 배치는 `docs/plan/rust-axis.md` §2.1 이 실측으로 세운 것을 그대로 쓰되, **1부에서 다섯을
0부로 올린다.**

| 부 | 이름 | 개념 | 무엇을 읽게 되나 | 판 | 일 |
|---|---|---|---|---|---|
| 0부 | 값과 식 | 11 | 한 줄 안의 값 | 22 | 11 |
| 1부 | 문과 흐름 | 7 | 한 함수 | 14 | 7 |
| 2부 | 소유권과 타입 | 14 | 한 파일 | 42 | 21 |
| 3부 | 비동기와 프레임워크 | 9 | 한 프로젝트 | 27 | 14 |
| | | **41** | | **105** | **53** |

1부(7) `if-expression` `function-item` `tail-expression` `string-literal` `vec` `for-in` `format-macro`
2부(14) rust-axis §2.1 그대로 — `borrow-shared` `move` `clone` `borrow-mut` `string-vs-str`
`struct-item` `impl-method` `enum-item` `match` `option` `result` `question-mark` `module-visibility`
`closure-capture`
3부(9) `iterator-adapters` `async-await`(rust-axis 가 `async-fn` 을 여기 합쳤다) `trait-item`
`impl-trait-for` `generic-bounds` `lifetime-annotation` `smart-pointer` `shared-thread-state`
`unsafe-block` + Tauri 프레임워크 경로(rust-axis §4)

**판 수의 근거는 부마다 다르다.** 0부 22 는 §0.1 표의 「판」 열을 더한 값이다. **1~3부 는 안 쟀다** —
1부 개념당 2판, 2·3부 개념당 3판으로 가정한 값이다. 일수는 D12 의 하루 새 판 2장으로 나눈 것이고
**재검·복습을 안 센 하한**이다. 세 언어 중 Rust 가 가장 길다(53일 · C 47 · C++ 47) — 2부 열넷이
전부 소유권이라 개념당 3판이 특히 얇게 잡힌 값이다.

**0부 11일이 첫 `if` 앞을 막는다.** `c.md`·`cpp.md` 와 같은 문제이고 답도 같아야 한다 —
ⓐ 0부와 1부를 **엇갈려 낸다** ⓑ 0부를 자른다. **안 정했다.** Rust 에서는 ⓐ 가 조금 더 쉽다:
`rs/if-expression` 의 선행이 비어 있어(§2) 0부를 안 끝내도 열린다.

**0장(프롤로그) 상한이 깨진다.** §5 가 깊이 ≤ 2 = **22/24** 라고 적었다. 신규 6개의 깊이는
`integer-type` 1 · `float-type` 1 · `overflow` 2 · `char-and-byte` 2 · `operator-precedence` 2 ·
`cast-as` 2 로 전부 상한 안이므로 **22 → 28 이다. 상한을 4 넘는다.**
`packages/concepts/src/zero-chapter.test.ts` 가 잡는다. (`c.md` 24→28 · `cpp.md` 21→28 로 셋이
같은 값에 닿는다 — 0부가 얕은 개념만 더하기 때문이다. **세 언어가 독립적으로 28 인 것이
README §7 ① 「0장 상한은 사용자 결정」을 강제로 여는 근거다.** 28판이면 14일이다.)

→ **정해졌다(D184, 2026-09-05): 상한 폐지.** `essential` 에 넣고 **자르지 않는다.** 위 문단의 「상한을 넘는다」는
더는 문제가 아니고, 넷째 정렬 키(id 알파벳순)가 돌 일도 없다. 남는 것은 프롤로그 길이뿐이다 — 하루 2장이면 28판 = 14일.

§5 가 정한 동률 깨기 순서(바닥 여덟 → `borrow-shared` → `move` → `string-vs-str`)는 0부가 앞에
서면 다시 짜야 한다 — 0부 열하나가 전부 앞이고, 그 뒤가 1부 일곱, 그다음이 소유권 넷이다.

### §0.7 실측 — 0부 개념이 내 리포에 얼마나 있나

`docs/plan/rust-axis.md` §2.1 이 tree-sitter 로 잰 계수는 §2~§4 개념용이라 **0부 개념이 표에 없다.**
0부용으로 다시 쟀다(2026-09-05). 표본은 rust-axis 와 같다 — `ai-pm` rs 280장 · `file_converter` 45 ·
`PySpace` 8 · `ECC` 16(대조군).

**측정 방법이 rust-axis 와 다르다.** rust-axis 는 tree-sitter 노드 수인데 이것은 `grep -o` 줄 안의
일치 수다. 주석·문자열·문서 주석 안의 글자도 세므로 **실제 노드 수보다 크다.** 그래서 아래 값은
개념끼리의 **크기 비교**로만 쓰고 rust-axis 표와 같은 줄에 놓지 않는다.

| 개념 | 잡은 것 | ai-pm | file_conv | PySpace | ECC |
|---|---|---|---|---|---|
| `rs/integer-type` | `u8`~`u128`·`i8`~`i128`·`usize`·`isize` | **2,885** | 192 | 35 | 785 |
| ㄴ 그중 `usize` | | 299 | 27 | 2 | 424 |
| `rs/cast-as` | ` as <숫자 타입>` | **563** | 23 | 0 | 146 |
| ㄴ 대조 — `TryFrom`·`try_from`·`try_into` | | **12** | 1 | 0 | 2 |
| `rs/overflow` | `wrapping_`·`checked_`·`saturating_`·`overflowing_` | 36 | 4 | 0 | 69 |
| `rs/float-type` | `f32`·`f64` | 162 | 10 | 2 | 55 |
| `rs/char-and-byte` | `char` | 32 | 4 | 0 | 15 |
| ㄴ `.len()` | | 918 | 49 | 16 | 329 |
| ㄴ `.chars()`·`.bytes()`·`.as_bytes()` | | 282 | 13 | 1 | 36 |

**이 표가 말하는 것 셋.**

**① `as` 563 대 `try_into` 12 — 47배다.** `ECC` 는 146 대 2 로 73배다. AI 가 짜 준 코드는
**안 잃는 변환보다 말없이 자르는 변환을 47배 쓴다.** `rs/cast-as` 가 0부에 있어야 하는 근거가 이
한 줄이고, 카드 본문이 이 비율을 그대로 쓸 수 있다. `_lang.yaml` 의 `alternatives`(「AI 가 대신 쓴
것」)에 `as` 를 올릴 근거이기도 하다 — `.clone()`(1,150 · rust-axis)과 같은 성격이다.

**② 폭 붙은 정수 타입이 2,885곳이다.** `rs/let-binding` 11,338(rust-axis)의 25% 다 — **네 번에 한
번은 폭이 코드에 적혀 있다.** C·C++ 에서 `int` 의 폭을 가르치려면 `sizeof` 를 먼저 가르쳐야 하는데
Rust 는 사용처가 이미 두껍다. 0부에 실측 근거가 붙는 유일한 언어인 이유다.

**③ `.len()` 918곳 · `char` 32곳.** 「글자와 바이트」를 가르칠 재료가 `char` 쪽이 아니라 `.len()`
쪽에 있다. 카드의 사용처를 `char` 로 고르면 32곳에서 뽑아야 하고 대부분 파서 코드라 초보에게
안 읽힌다. **`.len()` 쪽을 고르고 「이 918곳 중 문자열에 부른 것은 전부 바이트 수다」로 가는 것이
맞다** — 다만 그 918 중 몇 개가 문자열인지는 **안 셌다**(수신자 타입을 알아야 하는데 tree-sitter 는
타입을 모른다. `rs/move` 와 같은 한계 — §5 「사용처가 없는 개념」).

**`rs/overflow` 는 사용처가 얇지만 0 은 아니다.** 네 리포 합쳐 109곳이고 `ECC` 69곳이 그 대부분이다
(암호 코드라 자리올림을 손으로 다룬다). 넘침 **그 자체**는 구문에 안 남으므로(`a + b` 의 트리는
넘치든 아니든 같다) 사용처는 이 넷의 메서드 이름뿐이다. `rs/move` 와 같은 처지이고
**D154 가 연 「사용처 없는 새 판」 경로를 타는 두 번째 언어 개념**이 된다.

### §0.8 `rust-axis.md` §2.3 에 붙는 여섯째

rust-axis §2.3 이 「`rs.md` 에 고칠 것」 다섯을 적었다. 0부 신설이 여섯째를 만든다.

**6. 1부 12 에서 다섯을 0부로 올린다.** rust-axis 1부는 `let-binding`·`mut-binding`·`boolean-literal`·
`comparison`·`arithmetic`·`if-expression`·`function-item`·`tail-expression`·`string-literal`·`vec`·
`for-in`·`format-macro` 열둘인데, 앞의 다섯이 0부로 간다. 1부는 일곱이 되고 **부 구성이 자바 1부
13과 어긋난다** — 그래도 맞다. 자바 1부의 「변수·타입·조건·반복」이 Rust 에서는 0부(타입)와
1부(조건·반복)로 갈리는데, 그 이유가 §0.2 표에 있다: 자바는 `int` 하나로 끝나고 Rust 는 열둘이다.

그리고 rust-axis §2.2 의 표(러스트에서 막히는 자리 ↔ `cs/`) 마지막 줄
「정수 나눗셈이 버린다 · 넘치면 패닉 ↔ `cs/integer-overflow`(522)」는 **두 줄로 갈린다** —
나눗셈은 `rs/arithmetic`(0부 #9), 넘침은 `rs/overflow`(0부 #4)이고 후자의 사용처는 522 가 아니라
109 다. 그 표에 0부 행 셋을 더한다:

| 러스트에서 막히는 자리 | `cs/` 개념 | 사용처(grep) |
|---|---|---|
| `usize` 와 `i32` 를 못 더한다 (E0308) | `cs/bit-and-byte` · **`cs/signed-and-unsigned`(신설 제안)** | 2,885 |
| `as` 가 말없이 자른다 | `cs/integer-overflow` · `cs/type` | 563 |
| `"가".len() == 3` · `s[0]` 이 막힌다 | `cs/text-encoding` | 918 |
| `f64` 가 `Ord` 가 아니라 `sort()` 가 안 된다 | `cs/floating-point` | 229 |

### §0.9 결정 등록부에 올릴 행

**초안은 `c.md` §0.8 에 한 벌만 있다** — 세 편(`c`·`cpp`·`rs`)의 §0 을 한 행이 함께 덮으므로
복제하지 않는다. 아직 등록부에 안 올렸고, 함께 열리는 사용자 결정 넷도 거기 적혀 있다.

---

## §2 기초 — 바닥 여덟

> **§0 신설 뒤 다섯이 위로 갔다** — `let-binding`·`mut-binding`·`boolean-literal`·`comparison`·
> `arithmetic` 은 §0.1 에 있다. 아래 표는 신설 전 기록으로 남긴다. 1부에 남는 것은
> `if-expression`·`function-item`·`tail-expression` 셋이고 나머지는 §0.6 이 배치한다.

`prereq` 관례는 기존 사전을 따랐다 — `if` 와 `fn` 은 뿌리(`ts`·`py` 둘 다 `prereq: []`), 비교는 참·거짓 뒤.

| # | id | name.ko / en | token | universal | diff | prereq | **Rust 라서 다른 것** |
|---|---|---|---|---|---|---|---|
| 1 | `rs/let-binding` | 이름에 값 묶기 / Let binding | `let` | `variable-binding` | 1 | — | `let` 이 만든 이름은 **기본이 못 바뀐다**. 같은 이름을 `let` 으로 또 만들 수 있는데(섀도잉) 그건 바꾼 게 아니라 이름이 하나 더 생긴 것이다 |
| 2 | `rs/mut-binding` | 바꿀 수 있다고 적기 / Mutable binding | `mut` | `reassignment` | 1 | 1 | 바꿀 수 있음을 **선언 쪽에** 적는다. 안 적고 다시 넣으면 E0384 로 멈춘다 — 다른 언어엔 이 오류가 없다 |
| 3 | `rs/boolean-literal` | 참·거짓 값 / Boolean literal | `true` `false` | `boolean-value` | 1 | — | 조건 자리에 `bool` **만** 온다. `if 1` 도 `if opt` 도 E0308 — 「0이면 거짓」이 없다 |
| 4 | `rs/comparison` | 두 값 견주기 / Comparison | `==` `<` | `comparison` | 1 | 3 | 양쪽 **타입이 같아야** 견준다(`1i32 == 1u8` 은 E0308). 조건 안의 `=` 가 막히는 이유도 다르다 — 대입식의 값이 `()` 라 `bool` 자리에 안 맞는다 |
| 5 | `rs/arithmetic` | 셈하기 / Arithmetic | `+ - * /` | `arithmetic` | 1 | — | 정수끼리 나누면 소수점을 **버린다**(파이썬과 정반대). 타입이 다르면 못 더하고, 넘치면 디버그 빌드에서 패닉한다 |
| 6 | `rs/if-expression` | 조건으로 흐름 나누기 / If expression | `if` | `conditional-branch` | 1 | — | 조건에 괄호가 없고 중괄호는 생략 못 한다. 그리고 `if` 가 **값을 낸다** — `? :` 가 없어 `let x = if c { 1 } else { 2 };` 가 그 자리다 |
| 7 | `rs/function-item` | 함수 정의하기 / Function item | `fn` | `function-definition` | 1 | — | 매개변수·반환 **타입을 반드시 적는다**. 추론이 함수 경계를 안 넘어 몸 안의 `let` 은 생략해도 서명은 못 한다 |
| 8 | `rs/tail-expression` | 마지막 식이 답이다 / Tail expression | (세미콜론 없음) | `return-value` | 1 | 7 | `return` 을 대개 **안 쓴다**. 마지막 식에 세미콜론을 붙이면 반환값이 `()` 가 되어 E0308 로 멈춘다 — 초심자가 가장 자주 붙이는 한 글자 |

`while` 이 빠진 이유: Rust 의 반복은 `for … in` 과 이터레이터가 쓴다(이 리포 32 대 7). 바닥에
넣으면 사용처가 얇은 개념이 뿌리에 앉는다. `common/loop-while` 대신 `rs/for-in` 이 `common/iterate` 를 받는다.
`return` 은 개념이 아니라 `alternatives` 로 둔다 — `{ gap: rs/tail-expression, present: rs/return-statement }`.

## §3 중심 (16)

> **§0 는 여기서 아무것도 안 가져갔다.** `string-vs-str`·`format-macro` 를 올릴지 검토했고 둘 다 남겼다 —
> 근거는 §0.4. 다만 `string-vs-str` 의 선행에 `rs/char-and-byte` 가 붙는다.

| id | name.ko / en | token | universal | diff | prereq | **없으면 왜 못 읽나** |
|---|---|---|---|---|---|---|
| `rs/string-literal` | 글자 값 / Text literal | `"…"` | `text-literal` | 1 | — | 큰따옴표의 타입이 `String` 이 아니라 `&'static str` 이다 |
| `rs/format-macro` | 문장에 값 끼워 넣기 / Format macro | `format!` | `string-interpolation` | 2 | string-literal | 문자열을 만드는 유일한 관용구가 매크로다. `{}`·`{:?}`·`{name}` 이 각각 다른 트레이트를 부른다 |
| `rs/borrow-shared` | 잠깐 빌려 읽기 / Shared borrow | `&` | `null` | 2 | let-binding | Rust 서명에서 `&` 없는 인자를 찾는 게 더 어렵다. 이 한 글자를 못 읽으면 서명 절반을 못 읽는다 |
| `rs/move` | 값째로 넘기기 / Move | (`&` 없는 자리) | `null` | 3 | let-binding | `&` 가 **없는** 인자는 값을 넘긴 것이고 그 뒤로 원래 이름은 못 쓴다. 첫 컴파일 오류 E0382 가 여기서 난다 |
| `rs/borrow-mut` | 고칠 수 있게 빌리기 / Mutable borrow | `&mut` | `null` | 3 | borrow-shared, mut-binding | 같은 값에 `&mut` 는 하나뿐이고 `&` 와 겹치지도 않는다. E0499·E0502 의 자리 |
| `rs/clone` | 복사해서 벗어나기 / Clone | `.clone()` | `null` | 2 | move | AI 가 빌림 오류를 지우려고 가장 자주 넣는 한 줄. 왜 통하는지 모르면 왜 느린지도, 왜 두 값이 갈라졌는지도 모른다 |
| `rs/string-vs-str` | 가진 글자와 빌린 글자 / String vs &str | `String` `&str` | `null` | 3 | string-literal, borrow-shared | 소유와 빌림의 차이가 **처음 눈에 보이는** 자리. `.to_string()`·`.as_str()`·`&s[..]` 가 다 여기서 나온다 |
| `rs/struct-item` | 값 묶어 이름 붙이기 / Struct | `struct` | `null` | 2 | let-binding | 필드마다 타입이 있고 전부 채워야 만들어진다. 부분만 채운 객체가 존재할 수 없다 |
| `rs/impl-method` | 값에 붙은 함수 / Method | `impl` `&self` | `null` | 3 | struct-item, borrow-shared | 첫 인자가 `self`·`&self`·`&mut self` 중 무엇인지가 「이 메서드가 값을 먹는가」를 정한다. `into_`·`as_`·`to_` 이름 규칙의 근거 |
| `rs/enum-item` | 갈래마다 다른 값 / Enum | `enum` | `null` | 2 | struct-item | Rust 의 `enum` 은 갈래마다 **값을 담는다**. `Option`·`Result` 가 특별한 문법이 아니라 그냥 이 `enum` 임을 모르면 둘이 마법으로 보인다 |
| `rs/match` | 모양으로 갈라 꺼내기 / Match | `match` | `pattern-match` (신규) | 2 | enum-item, if-expression | 갈래를 빠뜨리면 **컴파일이 멈춘다**(E0004). 다른 언어의 `switch` 는 빠뜨려도 조용히 지나간다 |
| `rs/option` | 없을 수 있는 값 / Option | `Option` `Some` | `absent-value` | 2 | enum-item | Rust 에 `null` 이 없다. 「없을 수 있음」이 타입에 적혀 있고 꺼내려면 반드시 갈라야 한다 |
| `rs/result` | 실패가 값으로 온다 / Result | `Result` `Ok` `Err` | `try-catch` | 3 | enum-item | 실패가 던져지지 않고 **반환값으로** 온다. `try`/`catch` 가 없어 오류 경로가 서명에 다 적혀 있다 |
| `rs/question-mark` | 실패면 여기서 나가기 / Question mark | `?` | `null` | 3 | result | 이 리포 2,884줄에 144번 — 스무 줄에 하나꼴이다. 한 글자가 「실패면 나가고 아니면 값을 꺼낸다」를 다 한다 |
| `rs/vec` | 순서 있는 목록 / Vec | `Vec<T>` `vec![]` | `list` | 2 | let-binding | 길이가 변하는 목록은 전부 `Vec` 이고 `[T; 3]` 배열과 **다른 타입**이다. `push` 하려면 `let mut` 이어야 한다 |
| `rs/for-in` | 하나씩 훑기 / For-in | `for … in` | `iterate` | 2 | vec | `for x in v` 는 **`v` 를 먹는다**. `&v` 나 `v.iter()` 를 안 쓰면 반복 뒤 `v` 가 사라져 있다 — 초심자의 첫 E0382 가 대개 여기다 |

## §4 심화 (10)

| id | name.ko / en | token | universal | diff | prereq | 가르는 자리 |
|---|---|---|---|---|---|---|
| `rs/trait-item` | 할 수 있는 일로 묶기 / Trait | `trait` | `interface-contract` (신규) | 4 | impl-method | 타입이 아니라 **행동**으로 경계를 긋기 시작하는 자리 |
| `rs/impl-trait-for` | 트레이트를 붙이기 / Trait impl | `impl X for Y` | `null` | 4 | trait-item | `#[derive(Debug, Clone)]` 한 줄이 구현을 **생성한다**. 이 리포도 `derive` 33 대 손으로 쓴 3 |
| `rs/generic-bounds` | 타입 자리 비우고 조건 걸기 / Bounds | `<T: Trait>` | `generics` | 4 | trait-item | 「아무 타입」이 아니라 「이 일을 할 줄 아는 타입」이라고 적는 것 |
| `rs/closure-capture` | 클로저가 무엇을 데려가나 / Capture | `\|x\|` `move` | `function-value` | 4 | borrow-shared, function-item | 캡처를 `&`·`&mut`·값 중 무엇으로 할지 **컴파일러가 정한다**. `move` 가 그 결정을 값 쪽으로 강제한다 |
| `rs/iterator-adapters` | 이어 붙여 바꾸기 / Adapters | `.map().collect()` | `map-transform` | 3 | for-in, closure-capture | 어댑터는 **아무것도 안 한다**. 소비자(`collect`·`for`·`sum`)가 오기 전엔 한 항목도 안 흐른다 |
| `rs/lifetime-annotation` | 얼마나 오래 빌리나 / Lifetimes | `'a` | `null` | 4 | borrow-shared, generic-bounds | 수명은 값의 생존을 **설명**할 뿐 늘리지 않는다 |
| `rs/module-visibility` | 밖에 낼 것만 내보내기 / Modules | `mod` `pub` | `module-export` (신규) | 3 | function-item | **모든 것이 기본 비공개**다. 파일이 곧 모듈이지만 `mod` 로 등록 안 하면 컴파일 대상에 아예 안 든다 |
| `rs/smart-pointer` | 규칙을 실행 시로 옮기기 / Smart pointers | `Box` `Rc` `RefCell` | `null` | 4 | borrow-mut, generic-bounds | `RefCell` 은 빌림 규칙을 **없애는 게 아니라** 어길 때 패닉으로 바꾼다 |
| `rs/shared-thread-state` | 스레드끼리 나눠 갖기 / Shared state | `Arc<Mutex<T>>` | `null` | 4 | smart-pointer | AI 가 스레드를 쓰면 거의 반드시 나오는 두 겹. 이 리포도 10곳 |
| `rs/unsafe-block` | 내가 대신 보증하기 / Unsafe | `unsafe` | `null` | 4 | borrow-mut | 검사를 끄는 게 아니라 「컴파일러가 확인하던 것을 내가 보증한다」는 표시다. 빌림 검사기는 그대로 돈다 |

## §5 prereq 그래프와 0장 적재량

> **아래 22/24 는 §0 신설 전 값이다.** 신설 뒤 깊이 ≤ 2 가 **28** 이라 상한을 4 넘고,
> 이 절이 정한 동률 깨기 순서도 다시 짜야 한다 — §0.6 끝.
> → D184 로 상한이 폐지됐다. 28 은 이제 「넘친 수」가 아니라 프롤로그 판 수다.

깊이 = 뿌리에서의 최장 경로. 34개 중 **깊이 ≤ 2 가 22개**다 (TS 21/24 · 파이썬 19/24).

| 깊이 | 수 | 개념 |
|---|---|---|
| 0 | 6 | `let-binding` `boolean-literal` `arithmetic` `if-expression` `function-item` `string-literal` |
| 1 | 9 | `mut-binding` `comparison` `tail-expression` `borrow-shared` `move` `vec` `struct-item` `module-visibility` `format-macro` |
| 2 | 7 | `clone` `borrow-mut` `enum-item` `for-in` `string-vs-str` `impl-method` `closure-capture` |
| 3 | 6 | `match` `option` `result` `trait-item` `iterator-adapters` `unsafe-block` |
| 4 | 3 | `question-mark` `generic-bounds` `impl-trait-for` |
| 5~6 | 3 | `lifetime-annotation` `smart-pointer` `shared-thread-state` |

**소유권은 깊이 1~2 에 앉는다** — `borrow-shared` 1 · `move` 1 · `borrow-mut` 2 · `clone` 2.
넷 다 0장 상한 안이고, 그래야 한다고 본다: 다른 언어에서 심화인 것이 Rust 에서는 **첫날
컴파일이 멈추는 자리**라 0장 밖으로 밀면 사용자가 첫 화면에서 못 읽는 코드를 본다.
22/24 는 자르는 규칙이 거의 일하지 않는 값이다(`zero-chapter.ts` 가 상한을 고른 근거와 같다).
잘리는 둘이 넷째 정렬 키까지 가므로 `essential` 순서를 바닥 여덟 → `borrow-shared` → `move` →
`string-vs-str` 로 두어 동률을 깬다.

끊은 사이클 셋:

| 순환 | 끊은 곳 |
|---|---|
| `move` ↔ `for-in` (`for x in v` 가 `v` 를 먹는다) | `for-in` 의 선행을 `vec` 하나로. 소유권은 카드 **본문**이 다루고 선행으로는 안 건다 |
| `match` ↔ `option`/`result` | 셋 다 `enum-item` 만 선행으로 두고 서로 간선 없음 |
| `borrow-shared` ↔ `string-vs-str` | `borrow-shared` → `string-vs-str` 한 방향만 |

### 사용처가 없는 개념 하나 — `rs/move`

`let b = a;` 의 트리는 `a` 가 `String` 이든 `i32` 든 **똑같다**. 이동인지 복사인지는 타입이 정하고
tree-sitter 는 타입을 모른다. `.scm` 으로 사용처를 뽑으면 `Copy` 타입에 전부 오탐이다.

**D154 가 이 자리를 이미 열어 뒀다** — `queue.new_candidates` 의 UNION 가지가 「`track_default='t0'`
∧ 미인쇄 ∧ 은퇴 안 한 카드 있음 ∧ 사용처 없음」인 개념을 새 판 후보로 받고, 랭커가 미지를
경계값 `MAX_UNKNOWN_FOR_NEW`(3)로 준다. `rs/move` 는 이 경로를 타는 첫 **언어** 개념이 된다
(지금은 `exec/*` 만 탄다). 구문으로 잡히는 소유권의 자국은 `&` · `&mut` · `.clone()` 셋뿐이고
나머지는 카드 본문에서만 다룬다.

## §6 `common/` 재사용 대 신규

**재사용 17/30 (57%)**

| `rs/…` → `common/…` | | `rs/…` → `common/…` |
|---|---|---|
| `let-binding` → `variable-binding` | | `format-macro` → `string-interpolation` |
| `mut-binding` → `reassignment` | | `option` → `absent-value` |
| `boolean-literal` → `boolean-value` | | `result` → `try-catch` |
| `comparison` → `comparison` | | `vec` → `list` |
| `arithmetic` → `arithmetic` | | `for-in` → `iterate` |
| `if-expression` → `conditional-branch` | | `closure-capture` → `function-value` |
| `function-item` → `function-definition` | | `iterator-adapters` → `map-transform` |
| `tail-expression` → `return-value` | | `generic-bounds` → `generics` |
| `string-literal` → `text-literal` | | |

**파이썬 21/30(75%)보다 낮다.** 중심·심화의 절반이 소유권 계열이고 거기엔 물려받을 데가 없다.
바닥 여덟만 보면 8/8 전부 재사용이라 **첫 화면까지는 파이썬과 같은 값으로 싸지고 3판째부터
비싸진다** — 0장 24판 중 `borrow-shared`·`move`·`clone`·`borrow-mut`·`string-vs-str` 다섯이
전이 없는 첫 노출이다.

안 쓴 13개 중 `member-access` 는 다음 묶음의 후보다 — Rust 의 `.` 은 `p` 가 `Point` 든 `&Point` 든
`&&Point` 든 자동으로 역참조해 C 의 `->` 구별이 없다. `async-await`·`promise-chain` 은 tokio 리포를
만나면 재검토한다.

**신규 제안 셋** — 각각 다른 언어 둘 이상에서 성립

| 제안 id | name.ko / en | 다른 언어 근거 |
|---|---|---|
| `common/pattern-match` | 모양으로 갈라 꺼내기 / Pattern matching | Swift `switch`+`case let`(소진성 검사 있음) · Python 3.10 `match` · Dart 3 `switch` 표현식 |
| `common/interface-contract` | 할 수 있는 일로 묶기 / Behaviour contract | TS `interface` · Go `interface` · Swift `protocol` · Dart `abstract class` |
| `common/module-export` | 밖에 낼 것만 내보내기 / Module boundary | TS `export` · Go 대문자 규칙 · Dart `library` |

`common/owned-vs-borrowed` 는 **제안하지 않는다** — 대응물이 C++ 참조 하나뿐이라 보편이 아니라
Rust 개념이다. 그 아래의 기계 사실은 §7 로 민다.

**`universal: null` 14개**: `borrow-shared` `borrow-mut` `move` `clone` `string-vs-str`
`question-mark` `struct-item` `impl-method` `enum-item` `impl-trait-for` `lifetime-annotation`
`smart-pointer` `shared-thread-state` `unsafe-block`

## §7 `cs/` 로 밀어낼 것

병렬 세션이 `docs/curriculum/cs.md`(D157)로 `cs/` 명세를 먼저 냈다. **거기 있는 id 를 쓰고
없는 것만 새로 제안한다.**

| `cs/` id | 상태 | ← 필요로 하는 `rs/` |
|---|---|---|
| `cs/undefined-behavior` | 있음 | `unsafe-block` `move` |
| `cs/stack-and-heap` | 있음 | `move` `clone` `string-vs-str` `smart-pointer` |
| `cs/value-vs-reference` | 있음 | `borrow-shared` `clone` |
| `cs/aliasing` | 있음 | `borrow-mut` — **E0499·E0502 의 존재 이유가 이 한 줄이다** |
| `cs/scope-and-lifetime` | 있음 | `lifetime-annotation` (E0597) |
| `cs/integer-overflow` | 있음 | `arithmetic` |
| `cs/memory-address` · `cs/pointer-indirection` | 있음 | `borrow-shared` `smart-pointer` |
| `cs/garbage-collection` | 있음 | `move` `clone` — Rust 는 **셋째 갈래(규칙이 치운다)**이고, 소유권이 존재하는 이유가 여기다 |
| `cs/null-reference` | 있음 | `option` — Rust 는 이 개념을 **타입으로 없앤 쪽**의 예다 |
| `cs/immutability` | 있음 | `let-binding` `mut-binding` |
| `cs/closure-capture` | 있음 | `closure-capture` (`move` 키워드) |
| `cs/race-condition` | 있음 | `shared-thread-state` (`Send`/`Sync`) |
| `cs/text-encoding` | 있음 | `string-vs-str` — `&str` 이 UTF-8 을 보증해서 바이트 색인이 막힌다 |
| `cs/error-vs-bug` | 있음 | `result` `question-mark` |
| `cs/compile-and-run` · `cs/linking` | 있음 | `module-visibility` |
| **`cs/dynamic-dispatch`** | **있음** — 2026-09-05 확인. 신규 제안이 아니었다(`docs/plan/rust-axis.md` §1.4) | `generic-bounds` `impl-trait-for` (`impl Trait` 대 `dyn Trait`) |

`cs/undefined-behavior` 가 Rust 쪽에서 가장 무겁다: Crichton 외(2023)가 36명에게서 찾은
**1번 오개념이 정확히 이것**이다 — 학습자는 왜 거부되는지는 대체로 말하지만 거부 안 했으면
무슨 일이 났을지를 모르고, 그래서 고치는 방법이 틀린다.

### `cs.md` 가 추측해 적은 `rs/` id 를 이 문서 기준으로 맞출 것

`cs.md` 는 `rs/**` 가 없는 상태에서 쓰였다. 다음 열둘은 이 문서의 id 로 고친다.

| `cs.md` 의 표기 | 이 문서 | | `cs.md` 의 표기 | 이 문서 |
|---|---|---|---|---|
| `rs/let` | `rs/let-binding` | | `rs/box` | `rs/smart-pointer` |
| `rs/borrow` | `rs/borrow-shared` | | `rs/str` | `rs/string-vs-str` |
| `rs/borrow-exclusive` | `rs/borrow-mut` | | `rs/send-sync` | `rs/shared-thread-state` |
| `rs/lifetime` | `rs/lifetime-annotation` | | `rs/unsafe` | `rs/unsafe-block` |
| `rs/move-closure` | `rs/closure-capture` | | `rs/u8` | (`rs/arithmetic` 안) |

`rs/drop` · `rs/repr` · `rs/newtype` 셋은 이 커리큘럼 34개에 **없다**. `Drop`/RAII 는 심화
후보로 남길 만하고(그러면 `cs/garbage-collection` 의 간선이 `move` 에서 그리로 옮겨간다),
`#[repr]` 과 뉴타입은 `cs/memory-layout`·`cs/invariant` 쪽 예시로만 두는 것이 맞다고 본다.

## §8 tree-sitter 현실

### `grammar_abi` — 14 (2026-09-05 런타임으로 확정)

`~/.cargo/registry` 에 이미 받아진 크레이트의 `src/parser.c` 를 직접 읽었다.

| 크레이트 | `#define LANGUAGE_VERSION` | 사전에 적힌 값 |
|---|---|---|
| `tree-sitter-rust` 0.23.3 | **14** | (없음) |
| `tree-sitter-python` 0.23.6 | 14 | `py` = 14 ✓ |
| `tree-sitter-go` 0.23.4 | 14 | (없음) |
| `tree-sitter-typescript` 0.23.2 (`typescript/src`·`tsx/src` 둘 다) | **14** | `ts` = `{ typescript: 14, tsx: 14 }` ✓ |

`rs` 는 `{ rust: 14 }` 로 적는다. **어긋남은 없었다** — `dictionary/ts/_lang.yaml` 의 15 는
`typescript` 가 아니라 **`javascript` 키**의 값이다(tree-sitter-javascript 0.25 → abi 15).
런타임 `Language::abi_version()` 을 2026-09-05 에 직접 돌려 rust 14 · typescript 14 · tsx 14 ·
java 14 를 확인했다(`docs/plan/rust-axis.md` §1.4).

named node kinds 169개. 시스템 쿼리는 `use_declaration`(`_imports.scm`)과
`function_item`·`impl_item`·`mod_item`·`struct_item`(`_blocks.scm`)으로 선다.

### 파싱 함정 다섯

**① 매크로 몸통은 토큰 수프다 — Rust 최대의 함정.** `macro_invocation` 의 인자는 `delim_token_tree`
(`token_tree` 로 별칭)이고 그 자식으로 허용된 것은 `_literal · identifier · metavariable ·
mutable_specifier · primitive_type · self · super · token_tree` 뿐이다. **`_expression` 이 없다.**
`println!("{}", items.len())` 안에는 `call_expression` 도 `field_expression` 도 없고 `items`·`len` 이
맨 `identifier` 로 흩어져 있다. `vec![]`·`format!`·`json!`·`assert_eq!` 전부 같다(이 리포 소스 38곳,
시험 249곳). → **모든 `.scm` 은 `token_tree` 안을 사용처로 삼지 않는다.** `rs/format-macro` 만 예외로
`(macro_invocation macro: (identifier) @… (token_tree (string_literal) @…))` 처럼 토큰 수준으로만 잡는다.

**② `#[derive(…)]` 는 구현을 만들지만 `impl_item` 이 아니다.** 트리에서는 `attribute_item >
attribute > token_tree` 다. 「이 구조체가 `Clone` 을 구현한다」를 `impl` 로 세면 놓친다 — 이 리포는
`derive` 33 대 `impl … for` 3 으로 9할이 안 보이는 쪽에 있다.

**③ 소유권에는 노드가 없다.** §5 참조. `rs/move` 는 사용처 없이 D154 경로로 간다.

**④ `<` 의 두 뜻.** `a < b` 의 비교와 `Vec<T>` 의 타입 인자가 같은 글자다. tree-sitter-rust 는
`binary_expression` 과 `generic_type` 을 따로 내므로 파이썬의 연쇄 비교처럼 형제 앵커로 잘라낼
필요가 **없다** — 2026-09-05 에 실측했다. `(binary_expression operator: "<")` 가 ai-pm 116,979줄에서
**76개**, `(generic_type)` 이 **4,771개**로 갈리고 스니펫에서도 안 섞인다. turbofish
`collect::<Vec<_>>()` 는 또 다른 노드(`generic_function`, ai-pm 580개)다.

**⑤ `mut` 이 두 자리에서 같은 이름이다.** `let mut x` 는 `let_declaration` + `mutable_specifier`,
`&mut x` 는 `reference_expression` + 같은 `mutable_specifier` 라 부모로 갈라야 한다. `if let` 은
별도 노드가 아니라 `if_expression` 의 condition 이 `let_condition` 인 형태이고(`if_let` 노드 없음),
`let … else` 는 `let_declaration` 의 `alternative` 필드다.

## §9 오개념 12

| 무엇을 믿나 | 실제로는 | 오류 |
|---|---|---|
| 빌림 검사기가 막는 건 스타일 문제다 | 막는 것은 실행 시 정의되지 않은 동작이다. 학습자 36명 중 겹치는 빌림이 **실제로는 안전한** 경우를 알아본 사람이 3/15, 수명 인자가 빠진 함수의 반례를 만든 사람은 **0명** | — |
| `.clone()` 을 붙이면 해결된다 | 오류는 사라지고 값이 둘로 갈라져 원래 의도가 깨진다. 같은 연구에서 16명 중 2명이 겹치는 빌림을 입력 벡터 복제로 「해결」했다 | E0502 |
| `&` 는 C 의 주소 연산자다 | 주소를 얻는 게 아니라 **읽을 권한을 잠시 빌리는** 것이다. 빌린 동안 원래 이름은 그 값을 못 옮긴다 | E0505 |
| `mut` 은 「이 값이 변한다」는 뜻이다 | `mut` 은 **그 이름**에 붙는다. `let mut v` 를 `&` 로 넘기면 그 자리에선 못 고치고, `RefCell` 은 `mut` 없이도 안이 바뀐다 | E0596 |
| 세미콜론은 있으나 없으나 같다 | 마지막 식의 세미콜론이 반환값을 `()` 로 바꾼다 | E0308 |
| 숫자나 `Option` 도 조건이 된다 | `bool` 만 온다. `if opt` 가 아니라 `if let Some(v) = opt` 다 | E0308 |
| `String` 과 `&str` 은 같은 것의 두 이름이다 | 소유한 버퍼와 빌린 조각이다. `&str` 은 자라지 못하고 `String` 은 함수 사이를 그냥 못 지나간다 | E0308 |
| 이동한 값은 메모리에서 사라진다 | 값은 그대로 있고 **이름의 권한만** 옮겨 간다. 옛 이름을 못 쓰게 막는 것이 전부다 | E0382 |
| 수명 `'a` 를 적으면 값이 더 오래 산다 | 수명은 생존을 **설명**할 뿐 늘리지 않는다. 같은 연구는 더 유연한 인자가 필요한 자리에 `'static` 을 붙이는 것을 반복 관찰했다 | E0597 |
| `unsafe` 는 검사를 끈다 | 빌림 검사기는 그대로 돈다. 풀리는 것은 원시 포인터 역참조 같은 몇 가지 금지뿐이다 | — |
| `Rc<RefCell<T>>` 를 쓰면 규칙에서 벗어난다 | 규칙이 실행 시로 옮겨간 것뿐이라 어기면 컴파일 대신 **패닉**한다 | (런타임) |
| 이터레이터 어댑터를 부르면 돈다 | `.map()` 은 아무것도 안 한다. `collect`·`for`·`sum` 이 와야 한 항목이라도 흐른다 | `#[must_use]` |

「컴파일러가 교사」인 것이 이 앱의 모델과 맞물리는 자리: 오답 진단 `diag` 에 **오류 코드를 그대로
적는 것**이 다른 언어에 없는 자산이다. 학습자가 실제로 만나는 문장이 정해져 있고, 사용자가 자기
리포에서 그 코드를 다시 만났을 때 카드가 이미 그 이름을 알려 준 상태가 된다. 반대 방향의 제약도
있다 — Crichton 외의 실측이 「거부 예측 64% · 반례 만들기 31% · 고치기 46%」라 **「왜 막히는가」는
이미 절반 넘게 맞히고 「그럼 어떻게 되나」가 안 맞는다.** `meaning:` 과 `why_gate:` 를 그쪽으로 기울인다.

### Exercism Rust 트랙은 바닥의 근거로 못 쓴다

`config.json` 을 받아 세었다 — 개념 **27** · 개념 연습 **11**(하나는 `work-in-progress`) · 연습문제 106.
27개 안에 `ownership`·`borrowing`·`lifetimes`·`traits`·`generics`·`result`·`error-handling` 이
**하나도 없다.** 그 낱말들은 연습문제 `topics` 태그로만 나온다. 개념 연습 11개가 덮는 깊이 0~3 은
`functions · integers · floating-point-numbers · enums · strings · structs · methods · option ·
destructuring · tuples · vec-macro` 인데, 이건 Rust 의 바닥이 아니라 **아직 안 쓰인 트랙**의 앞부분이다.
D148 ③ 대로 목록만 참고했고, 여기서는 **겹치지 않는 쪽이 정보다** — 이 문서의 바닥 여덟 중
`let-binding`·`mut-binding`·`tail-expression`·`if-expression` 넷이 그쪽에 없다. 파이썬·JS 트랙에서
얻었던 「독립 검증」을 Rust 에서는 못 얻는다.

## §10 근거와 출처

- Exercism Rust — https://github.com/exercism/rust/blob/main/config.json (MIT · © 2021 Exercism). 2026-09-04 에 받아 직접 파싱. 산문은 가져오지 않았다.
- tree-sitter-rust 0.23.3 — `~/.cargo/registry/.../tree-sitter-rust-0.23.3/{grammar.js, src/parser.c, src/node-types.json}` 직접 읽음. `LANGUAGE_VERSION 14` · named node kinds 169 · `macro_invocation → delim_token_tree` 규칙(grammar.js:975-1001).
- Crichton, Gray, Krishnamurthi, *A Grounded Conceptual Model for Ownership Types in Rust*, OOPSLA 2023 — https://arxiv.org/abs/2309.04134 . 형성 평가 N=36(StackOverflow 프로그램 8개 · 네 범주), Table 1: 거부 예측 64% · 반례 31% · 고치기 46% · 정당화 15~31%. 본 평가 N=342, 향상 ~9%(d=0.56).
- Crichton, *The Usability of Ownership*, HATRA 2020 — https://arxiv.org/abs/2011.06171
- TIOBE 2026-08 — Rust 10위 · 1.45%(7월 1.34%, 7월에 첫 10위 진입). **TechRepublic 요약으로만 확인했고 tiobe.com 원문은 확인 못 했다.**
- JetBrains, *The Most Common Rust Compiler Errors as Encountered in RustRover*(2023-12) — E0277 32% · E0308 30% · E0599 27.5% · E0425 20.5% · E0433 17.5%. **표본 크기와 기간이 공개돼 있지 않다.**
- progmiscon.org — **Rust 항목이 없다**(Python·Java·JavaScript·Scratch 만, 총 247건). 재사용 라이선스 명시도 없어 인용만 한다(Chiodini 외, ITiCSE '21, DOI 10.1145/3430665.3456343). Rust 오개념의 1차 출처는 위 OOPSLA 논문으로 대신했다.
- 이 리포 실측 — 비시험 21파일 2,884줄에 대한 grep 계수. `while` 7 등 일부는 주석·문자열 안의 것을 포함할 수 있다(상한값으로 읽을 것).

**확인 못 한 것**

1. ~~`dictionary/ts/_lang.yaml` 의 `grammar_abi: 15` 대 측정값 14~~ — **닫혔다**(§8). 15 는 `javascript` 키였다.
2. ~~`a < b` 와 `Vec<T>` 가 `.scm` 에서 실제로 안 섞이는지~~ — **닫혔다**(§8 ④). 실측 76 대 4,771.
3. 「E0382 ~30%」처럼 도는 빌림 오류 빈도. 2차 요약뿐이라 본문에 수치로 쓰지 않았다.
4. 바이브 코딩 Rust 의 `.clone()`·`Arc<Mutex<_>>`·`unwrap()` 편향. 블로그·기술 보고서 수준의 관찰이고 계량 근거가 없다.
5. `rs/move` 가 D154 의 UNION 가지를 실제로 타는지 — SQL 조건이 맞는 것까지만 확인했고 돌려 보지 않았다.

---

## §11 학습법 — 이 언어를 이해한다는 것

800줄 상한을 넘어 [`rs-learning.md`](./rs-learning.md) 로 분리했다 — 권한(R/W/O) 모형과 Brown 실험판의
근거 · The Book 3장에 없는 셋 · 「이 줄이 컴파일되나」를 `bool` 로 내면 안 되는 이유 ·
「소유권 화살표 → 권한 줄」 그림 신청 · `rs` 전용 오답 카탈로그 · 바꿀 것 diff.
