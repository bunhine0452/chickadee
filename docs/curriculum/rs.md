# Rust 커리큘럼 조사 — 네임스페이스 `rs`

조사일 2026-09-04. `dictionary/rs/**` 는 아직 없다. 이 문서는 그 앞의 결정 재료다.

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

## §2 기초 — 바닥 여덟

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
| **`cs/static-vs-dynamic-dispatch`** | **신규 제안** — 컴파일 시 복제냐 실행 시 표냐 | `generic-bounds` `impl-trait-for` (`impl Trait` 대 `dyn Trait`) |

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

### `grammar_abi` — 14, 그리고 `ts` 의 15 는 확인이 필요하다

`~/.cargo/registry` 에 이미 받아진 크레이트의 `src/parser.c` 를 직접 읽었다.

| 크레이트 | `#define LANGUAGE_VERSION` | 사전에 적힌 값 |
|---|---|---|
| `tree-sitter-rust` 0.23.3 | **14** | (없음) |
| `tree-sitter-python` 0.23.6 | 14 | `py` = 14 ✓ |
| `tree-sitter-go` 0.23.4 | 14 | (없음) |
| `tree-sitter-typescript` 0.23.2 (`typescript/src`·`tsx/src` 둘 다) | **14** | `ts` = **15** ✗ |

`rs` 는 14 로 적는다. `ts` 의 15 가 어디서 나온 값인지는 확인 못 했다 — 런타임
`Language::abi_version()`(`langs.rs` 의 `LangInfo.abi`)을 돌려 보지 않았고, `grammar_abi` 는
`ingest.ts:84` 의 캐시 키에만 쓰여 틀려도 조용하다. `rs` 를 만들기 전에 이 어긋남을 먼저 정할 것.

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
필요는 **없어 보인다** — 골든으로 확인 못 했다. `rs/comparison` 쿼리가 `(binary_expression
operator: "<")` 만 잡는지 먼저 볼 것. turbofish `collect::<Vec<_>>()` 는 또 다른 노드(`generic_function`)다.

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

1. `dictionary/ts/_lang.yaml` 의 `grammar_abi: 15` 대 측정값 14. 런타임 `abi_version()` 을 안 돌려 봤다.
2. `a < b` 와 `Vec<T>` 가 `.scm` 에서 실제로 안 섞이는지 — grammar.js 만 보고 판단했고 골든이 없다.
3. 「E0382 ~30%」처럼 도는 빌림 오류 빈도. 2차 요약뿐이라 본문에 수치로 쓰지 않았다.
4. 바이브 코딩 Rust 의 `.clone()`·`Arc<Mutex<_>>`·`unwrap()` 편향. 블로그·기술 보고서 수준의 관찰이고 계량 근거가 없다.
5. `rs/move` 가 D154 의 UNION 가지를 실제로 타는지 — SQL 조건이 맞는 것까지만 확인했고 돌려 보지 않았다.
