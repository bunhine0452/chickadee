# 러스트 축 — 구현 계획

작성 2026-09-05. **이 문서는 계획이고 착수 결정은 사용자가 한다.** 결정 등록부에는 아직 행을
올리지 않았다 — 올릴 행의 초안은 §8 에, 사용자 결정이 필요한 다섯은 §7 에 있다.

정본 §4(정식 코스 3부) · §5(실행 러너 · 범용성 세 티어)와 `docs/00-overview.md` §4.2.1 의
D156 · D174~D180 을 전제로 한다. 언어 명세는 `docs/curriculum/rs.md`(2026-09-04) 가 이미 34개를
설계해 두었고, 이 문서는 **그 위에 실측을 얹어** 부 배치·러너·기능 경로를 정한다.

## 측정 환경

| 항목 | 값 |
|---|---|
| 측정일 | 2026-09-05 |
| 기계 | aarch64-apple-darwin (`cargo -vV` 의 `host`) |
| 툴체인 | `rustc 1.98.0` · `cargo 1.98.0` |
| 문법 | `tree-sitter 0.25.10` + `tree-sitter-rust 0.23.3` — **abi 14 · node kind 355** (런타임 `abi_version()`) |
| 측정 도구 | 스크래치패드의 임시 크레이트 `rsprobe`(≈130줄, 리포에 안 들어간다) |
| 사용자 리포 | **읽기만 했다.** `CARGO_TARGET_DIR` 를 스크래치패드로 돌리고 `--locked` 를 붙였다. 측정 뒤 네 리포의 `Cargo.lock`·`target/` mtime 은 2026-08-07·08-16 그대로였다 |

한 가지 예외가 있다. `ECC/ecc2/rust-toolchain.toml` 이 `channel = "1.96"` 을 핀해 두어서
그 리포에서 `cargo metadata` 를 부른 순간 **rustup 이 툴체인 1.96 을 내려받았다**(`~/.rustup`,
리포 밖). 이것 자체가 §3.2 의 측정 결과다.

---

## 0. 한 장 요약

**지금 있는 것**: `tree-sitter-rust` 가 `crates/parse/Cargo.toml` 의 `lang-rust` 로 이미 링크돼
있고 `langs.rs` 에 `("rust", …)` 한 줄이 서 있다. **지금 0인 것**: `dictionary/rs/` 디렉터리 자체가
없다. `_lang.yaml` 도 `_imports.scm` 도 `_blocks.scm` 도 개념 YAML 도 한 장이 없다.

**이 축의 가장 값싼 큰 승리는 Tauri 의 `invoke("x")` ↔ `#[tauri::command] fn x` 다.**
사용자 리포 셋에 커맨드 정의가 **396개**, 프런트에서 문자열 리터럴로 부르는 자리가 **395개**,
이름이 정확히 일치하는 짝이 **392쌍**이다(ai-pm 350 · file_converter 17 · PySpace 25). D159 가
스프링+뷰에서 HTTP 간선을 세울 때는 클래스 수준 `@RequestMapping` 과 메서드 수준
`@PostMapping` 을 나눠 캡처하고 경로 변수를 자리표로 접어야 했는데, Tauri 는 **양쪽이 같은 문자열
하나**라 접을 것도 합칠 것도 없다. 쿼리 세 줄이면 392 간선이 선다.

**러너는 Rust 를 한 줄도 안 늘린다.** `ProcSpec`(`program`·`args`·`env`·`needs`·`keep`·`files`)이
이미 언어 중립이고, cargo 어댑터는 `packages/grading/src/rust-runner.ts` 한 장이다. 자바가 Rust
0줄로 들어간 선례(D175)가 그대로 성립한다.

**막히는 자리 셋**은 미리 적어 둔다 — ① `cargo test -- --format json` 은 **안정 채널에서 안 된다**
(§3.3) ② 러스트 시험의 88%가 **채점 대상 파일 안에** 산다(§3.4) ③ 문법이 `&raw` 를 못 읽어
ai-pm 280장 중 **29장(10.4%)**에 `ERROR` 노드가 생긴다(§1.2).

---

## 1. 실측 — 파싱과 쿼리가 실제로 잡는 것

### 1.1 표본

사용자 리포 넷. `target/`·`node_modules/` 를 뺀 `.rs` 파일이다.

| 리포 | `.rs` | 줄 | 스택 | 성격 |
|---|---|---|---|---|
| `ai-pm` | 280 | 116,979 | Tauri 2 + React + tauri-specta | 이 축의 주 표본 |
| `file_converter` | 45 | 12,281 | Tauri 2 + React | 중간 |
| `PySpace` | 8 | 1,833 | Tauri 2 + React | 하한 |
| `ECC/ecc2` | 16 | 52,139 | **Tauri 가 아닌** CLI·TUI (ratatui) | 대조군 |

`ECC` 를 넣은 이유는 대조군이 필요해서다. 셋이 다 Tauri 라 「Tauri 가 곧 러스트」로 보이면
`tauri/` 프레임워크 개념과 `rs/` 언어 개념이 섞인다.

**한 파일이 인제스트 상한에 걸린다.** `ECC/ecc2/src/tui/dashboard.rs` 는 541,173 바이트로
`ingest-defaults.ts` 의 `maxFileBytes: 512 * 1024`(524,288)를 넘는다 — 15,165줄, 그 리포 러스트의
29%가 사전에 안 들어간다. 계수에서도 뺐다.

### 1.2 파싱 — 되지만 `&raw` 한 자리가 샌다

`tree-sitter-rust 0.23.3` 으로 349장 전부를 파싱했다.

| 리포 | 파싱 | `ERROR` 노드가 있는 파일 | `ERROR` 노드 | `MISSING` | 시간 |
|---|---|---|---|---|---|
| ai-pm | 280/280 | **29 (10.4%)** | 52 | 0 | 450ms |
| file_converter | 45/45 | 1 (2.2%) | 1 | 0 | 43ms |
| PySpace | 8/8 | 0 | 0 | 0 | 7ms |
| ECC | 15/15 | 1 | 3 | 0 | 136ms |

**`ERROR` 56개가 전부 같은 원인이다 — 이름이 `raw` 인 변수를 빌리는 `&raw`.**
Rust 1.82 가 `&raw const x` / `&raw mut x`(원시 포인터 만들기)를 넣으면서 문법이 `&` 뒤의 `raw`
를 예약어처럼 읽는다. `let raw = fs::read_to_string(p)?;` 다음 줄의 `from_str(&raw)` 가 그것에
걸린다 — 바이브 코딩이 JSON·설정을 읽을 때 늘 쓰는 이름이다.

번짐은 **한 노드에서 멈춘다**. 트리를 찍어 확인했다:

```
call_expression  "from_str(&raw)"
  identifier  "from_str"
  arguments  "(&raw)"
    ERROR  "&raw"        ← 여기서 끝. 바깥 let_declaration · block · function_item 은 정상
```

그래서 그 파일의 블록·import·다른 개념 사용처는 다 살아 있고, **잃는 것은 그 줄의
`rs/borrow-shared` 사용처 하나와 그 줄이 낀 T1 AST 비교**다. 116,979줄에 52개(0.04%).

**할 일**: `crates/parse/tests/` 에 골든 한 장으로 못 박는다(문법을 올렸을 때 조용히 바뀌는 것을
막는 것이 그 시험의 목적이다 — `dictionary.rs` 머리말). 문법 상류 수정은 우리 일이 아니다.

### 1.3 시스템 쿼리 두 장 — 후보와 계수

`dictionary/rs/_blocks.scm`·`_imports.scm` 은 **없다**. 아래는 이 문서가 제안하는 후보이고,
계수는 그 후보를 위 표본에 실제로 돌린 값이다. 아직 리포에 파일로 넣지 않았다.

#### `_blocks.scm` — T1 필사 단위

```scheme
((function_item name: (identifier) @block.name) @block.function (#set! form "fn"))
((impl_item type: (type_identifier) @block.name) @block.function (#set! form "impl"))
((struct_item name: (type_identifier) @block.name) @block.function (#set! form "struct"))
((mod_item name: (identifier) @block.name body: (declaration_list)) @block.function (#set! form "mod"))
```

| form | ai-pm | file_conv | PySpace | ECC |
|---|---|---|---|---|
| `fn` | 4,325 | 741 | 57 | 1,021 |
| `impl` | 171 | 43 | 2 | 64 |
| `struct` | 574 | 47 | 18 | 164 |
| `mod`(본문 있는 것) | 140 | 34 | 0 | 13 |
| **합** | **5,210** | **865** | **77** | **1,262** |

자바의 `_blocks.scm` 은 `class`·`method` 둘뿐이다. 러스트에 `impl` 과 `mod` 를 더하는 이유는
§3.4 다 — 시험이 `mod tests` 안에 살아서, 그 경계를 블록으로 알아야 4·5단에서 답안과 시험을
가를 수 있다.

#### `_imports.scm` — 지정자

```scheme
((use_declaration argument: (scoped_identifier) @import.source)           (#set! form "static"))
((use_declaration argument: (scoped_use_list path: (_) @import.source))   (#set! form "static-list"))
((use_declaration argument: (use_wildcard (_) @import.source))            (#set! form "static-glob"))
((mod_item name: (identifier) @import.source !body)                       (#set! form "mod-file"))
((attribute_item (attribute (scoped_identifier) @import.source))
 (#eq? @import.source "tauri::command")                                   (#set! form "entry-command"))
((call_expression function: (field_expression
    value: (identifier) @ctx.recv field: (field_identifier) @import.source)) (#set! form "call"))
((call_expression function: (scoped_identifier
    path: (identifier) @ctx.recv name: (identifier) @import.source))        (#set! form "call-assoc"))
((field_declaration name: (field_identifier) @import.source
                    type: (type_identifier) @ctx.type))                     (#set! form "field")
((parameter pattern: (identifier) @import.source
            type: (type_identifier) @ctx.type))                             (#set! form "param")
```

| form | ai-pm | file_conv | PySpace | ECC |
|---|---|---|---|---|
| `static` (`use a::b::C`) | 859 | 122 | 28 | 92 |
| `static-list` (`use a::{B, C}`) | 610 | 80 | 15 | 74 |
| `static-glob` (`use a::*`) | 228 | 33 | 0 | 7 |
| `mod-file` (`mod x;`) | 251 | 41 | 5 | 15 |
| **`entry-command`** | **350** | **18** | **28** | **0** |
| `call` (`recv.name(…)`) | 12,319 | 987 | 254 | 3,309 |
| `call-assoc` (`Type::name(…)`) | 3,827 | 670 | 125 | 1,718 |
| `field` (이름→타입) | 1,060 | 72 | 22 | 409 |
| `param` (이름→타입) | 763 | 112 | 37 | 108 |

**빼기로 한 것 둘.**

- `((call_expression function: (identifier) @import.source) (#set! form "call-self"))` — ai-pm 에서
  8,234개인데 그 대부분이 `Ok(x)`·`Some(x)`·`Err(e)` 다. 자바에서는 `!object` 호출이 「같은
  클래스의 메서드」라는 뜻이었지만 러스트에서는 열거형 생성자와 구별이 안 된다. 자기 호출은
  `Self::name(…)` 이 `call-assoc` 로 이미 잡힌다.
- `((attribute_item (attribute (identifier) @import.source)) (#eq? @import.source "command"))` —
  `use tauri::command;` 뒤의 짧은 표기를 노렸는데, **ECC 에서 20개가 잡히고 그중 Tauri 는 0개다**
  (clap 의 `#[command(...)]`). 오탐 20/20 이라 넣지 않는다.

`let` 의 이름→타입(`((let_declaration pattern: (identifier) type: (type_identifier) …))`)도 뺐다 —
ai-pm 118 · file_converter 2 · PySpace 1 · ECC 50 으로, 러스트가 타입을 추론해 버려 자바의
`local_variable_declaration`(같은 자리에서 수백 개)만큼 안 나온다. **호출 그래프의 수신자 해석은
러스트에서 `field`(1,060)와 `param`(763)에만 기댄다.**

`macro_invocation` 안은 `rs.md` §8 ① 대로 사용처로 삼지 않는다. 대가는 크다 — ai-pm 에
`macro_invocation` 이 **7,351개**이고 그 안의 식은 전부 `token_tree` 라 노드로 안 보인다.

### 1.4 `rs.md` 의 「확인 못 한 것」 셋을 닫는다

| # | `rs.md` §10 의 물음 | 실측 답 |
|---|---|---|
| 1 | `ts` 의 `grammar_abi: 15` 대 측정 14 | **어긋난 게 아니다.** `dictionary/ts/_lang.yaml` 은 `{ typescript: 14, tsx: 14, javascript: 15 }` 이고 15 는 **javascript** 키다(tree-sitter-javascript 0.25 → abi 15). 런타임 `abi_version()` 으로 rust 14 · typescript 14 · tsx 14 · java 14 를 직접 읽었다. `rs` 는 `{ rust: 14 }` |
| 2 | `a < b` 와 `Vec<T>` 가 `.scm` 에서 섞이나 | **안 섞인다.** `(binary_expression operator: "<")` = ai-pm 76 · ECC 28, `(generic_type)` = ai-pm 4,771 · ECC 1,512. 스니펫으로도 확인했다. 파이썬처럼 형제 앵커로 자를 필요 없다. 터보피시는 `generic_function`(ai-pm 580 · ECC 212)으로 따로 선다 |
| 3 | `rs/move` 가 D154 의 UNION 가지를 타는지 | **여전히 못 쟀다.** SQL 조건이 맞는 것까지만 확인했고 돌려 보지 않았다 |

`rs.md` §7 의 신규 제안 `cs/static-vs-dynamic-dispatch` 는 **필요 없다** — `dictionary/cs/dynamic-dispatch.yaml`
이 이미 있다(`cs/` 43장 중 하나). 그 행은 「신규 제안」에서 「기존 것에 붙임」으로 고친다.

---

## 2. 개념 — 3단을 3부로 다시 앉힌다

`rs.md` 는 기초 8 · 중심 16 · 심화 10 = 34개를 **난이도 축**으로 설계했다. 정본 §4 의 부는
**교재 축**이다(1부 합성 · 2부 합성+내 코드 · 3부 내 코드 중심). 자바에서 이 둘이 갈린 이유가
러스트에서도 그대로 성립한다 — 아래 계수를 보면 `trait` 선언이 네 리포 합쳐 **9개**다.

### 2.1 부 배치와 사용처 계수

계수는 tree-sitter 쿼리로 잰 **노드 수**다(grep 이 아니다). ECC 는 대조군이라 회색으로 읽는다.

#### 1부 바닥 (12) — 전부 합성 예제

| # | 개념 | 잡는 노드 | ai-pm | file_conv | PySpace | ECC |
|---|---|---|---|---|---|---|
| 1 | `rs/let-binding` | `let_declaration` | 11,338 | 1,121 | 203 | 2,904 |
| 2 | `rs/mut-binding` | `let_declaration (mutable_specifier)` | 1,356 | 98 | 48 | 346 |
| 3 | `rs/boolean-literal` | `boolean_literal` | 1,104 | 71 | 18 | 315 |
| 4 | `rs/comparison` | `binary_expression` 비교 6종 | 1,208 | 69 | 20 | 319 |
| 5 | `rs/arithmetic` | `binary_expression` 산술 5종 | 522 | 43 | 4 | 184 |
| 6 | `rs/if-expression` | `if_expression` | 2,485 | 207 | 95 | 983 |
| 7 | `rs/function-item` | `function_item` | 4,325 | 741 | 57 | 1,021 |
| 8 | `rs/tail-expression` | 블록 마지막 자식 − 문(statement) | **2,221** | 332 | 31 | 726 |
| 9 | `rs/string-literal` | `string_literal` | 19,484 | 1,538 | 302 | 7,380 |
| 10 | `rs/vec` | `Vec` 타입 이름 | 1,351 | 86 | 22 | 284 |
| 11 | `rs/for-in` | `for_expression` | 808 | 60 | 18 | 202 |
| 12 | `rs/format-macro` | `format!`·`println!`·`write!` 류 | 1,209 | 91 | 45 | 649 |

8번은 두 번 재서 뺐다 — 블록의 마지막 명명 자식 4,323 − 그중 `expression_statement`/`let_declaration`
2,102 = 2,221. 함수 4,325개 중 **51%가 꼬리식으로 값을 낸다**(ECC 는 71%).

`rs.md` 의 바닥 여덟에 `string-literal`·`vec`·`for-in`·`format-macro` 넷을 더해 1부를 12로 만든다.
자바 1부가 13(변수·타입·조건·반복·메서드·배열·import)인 것과 같은 크기다. **0장(프롤로그) 상한
24판은 여전히 바닥 여덟만 쓴다** — 1부 ≠ 0장이다.

#### 2부 소유권과 타입 (14) — 합성 + 내 코드

| # | 개념 | 잡는 노드 | ai-pm | file_conv | PySpace | ECC |
|---|---|---|---|---|---|---|
| 13 | `rs/borrow-shared` | `reference_expression` − `&mut` | 6,753 | 617 | 136 | 2,375 |
| 14 | `rs/move` | **없다**(§2.3) | — | — | — | — |
| 15 | `rs/clone` | `.clone()` 호출 | 1,150 | 72 | 48 | 444 |
| 16 | `rs/borrow-mut` | `reference_expression (mutable_specifier)` | 179 | 21 | 8 | 31 |
| 17 | `rs/string-vs-str` | `String` 3,515 / `&str` 1,840 | 5,355 | 368 | 132 | 1,470 |
| 18 | `rs/struct-item` | `struct_item` | 574 | 47 | 18 | 164 |
| 19 | `rs/impl-method` | `parameters (self_parameter)` | 641 | 152 | 3 | 189 |
| 20 | `rs/enum-item` | `enum_item` | 118 | 35 | **0** | 41 |
| 21 | `rs/match` | `match_expression` | 775 | 80 | 3 | 227 |
| 22 | `rs/option` | `Option` 타입 이름 | 1,250 | 105 | 12 | 466 |
| 23 | `rs/result` | `Result` 타입 이름 | 1,006 | 119 | 33 | 589 |
| 24 | `rs/question-mark` | `try_expression` | 2,903 | 163 | 34 | 2,588 |
| 25 | `rs/module-visibility` | `visibility_modifier` | 4,375 | 445 | 86 | 917 |
| 26 | `rs/closure-capture` | `closure_expression` | 3,306 | 257 | 48 | 685 |

`borrow-mut` 이 `borrow-shared` 의 **2.6%**(179/6,932)다. 「빌림은 대개 읽기다」가 계수로 나온다 —
카드 본문이 그 비율을 쓰면 `&mut` 이 왜 하나뿐인지가 덜 추상적이다.

#### 3부 비동기와 프레임워크 (10 + 프레임워크) — 내 코드 중심

| # | 개념 | 잡는 노드 | ai-pm | file_conv | PySpace | ECC |
|---|---|---|---|---|---|---|
| 27 | `rs/iterator-adapters` | `.map`·`.filter`·`.collect` 류 | 3,430 | 189 | 28 | 608 |
| 28 | **`rs/async-await`(신규)** | `await_expression` | **2,571** | 7 | 52 | 209 |
| 29 | **`rs/async-fn`(28에 합침)** | `function_modifiers` 에 `async` | 1,109 | 3 | 29 | 122 |
| 30 | `rs/trait-item` | `trait_item` | **3** | **6** | **0** | **0** |
| 31 | `rs/impl-trait-for` | `impl_item trait:` 48 / `#[derive]` 615 | 663 | 90 | 14 | 220 |
| 32 | `rs/generic-bounds` | `type_parameter (trait_bounds)` + `where_predicate` | **17** | **15** | **2** | **34** |
| 33 | `rs/lifetime-annotation` | `lifetime` | 615 | 56 | 14 | 69 |
| 34 | `rs/smart-pointer` | `Box`·`Rc`·`RefCell`·`Cow` | **13** | **2** | **0** | **11** |
| 35 | `rs/shared-thread-state` | `Arc`·`Mutex`·`RwLock` | 223 | 45 | 29 | 3 |
| 36 | `rs/unsafe-block` | `unsafe_block`·`foreign_mod_item` | **6** | **0** | **1** | **4** |

**3부에 무엇이 실제로 있나** — `async`/`await` 은 ai-pm 에서 `?`(2,903) 다음으로 흔한 개념이고
(2,571 + 1,109), 네 리포 중 셋에 있다. 반대로 `trait` 선언은 네 리포 합쳐 **9개**, 제네릭 경계는
**68개**, `Box`/`Rc`/`RefCell` 은 **26개**, `unsafe` 는 **11개**다. **3부는 「내 코드 중심」인데
`trait`·제네릭·스마트 포인터는 내 코드에 없다** — 그래서 이 넷은 정본 §4 규칙 ①의 「네 코드엔
없다」쪽으로 명시하고 합성으로 가르친다.

### 2.2 러스트 고유의 어려운 자리 ↔ `cs/`

`cs/` 43장은 이미 있고 `rs/` 개념의 `prereq` 에 `cs/…` 를 적으면 그쪽이 사용처를 빌린다(D157).
`cs/*.yaml` 은 `rs/` 를 한 번도 언급하지 않으므로(0장) **간선은 전부 `rs/` 쪽에서 건다.**

| 러스트에서 막히는 자리 | `cs/` 개념 | 왜 그것이 답인가 | 사용처 |
|---|---|---|---|
| `&` 가 주소가 아니다 | `cs/value-vs-reference` · `cs/memory-address` | C 를 아는 사람의 첫 오독. 「주소를 얻는다」가 아니라 「읽을 권한을 잠시 빌린다」 | 6,753 |
| `&mut` 이 하나뿐이다 (E0499·E0502) | **`cs/aliasing`** | 「이름 둘이 한 값을 가리키면」이 그 규칙의 **존재 이유** 그 자체다. `aliasing.yaml` 의 한 줄 요약이 그대로 러스트 컴파일 오류의 근거다 | 179 |
| `move` 뒤에 옛 이름을 못 쓴다 (E0382) | `cs/stack-and-heap` · `cs/garbage-collection` | 값은 그대로 있고 **권한만** 옮긴다. GC 셋째 갈래(「규칙이 치운다」)가 소유권이 있는 이유다 | 사용처 없음 |
| `String` 과 `&str` (E0308) | `cs/stack-and-heap` · `cs/text-encoding` | 가진 버퍼와 빌린 조각. `&str` 이 UTF-8 을 보증해서 바이트 색인이 막힌다 | 5,355 |
| `'a` 를 적어도 값이 안 오래 산다 (E0597) | `cs/scope-and-lifetime` | 수명은 생존을 **설명**할 뿐 늘리지 않는다 | 615 |
| `Result` + `?` | `cs/error-vs-bug` | 실패가 던져지지 않고 반환값으로 온다 — 오류 경로가 서명에 다 적혀 있다 | 3,909 |
| `Option` 에 `null` 이 없다 | `cs/null-reference` | 러스트는 이 개념을 **타입으로 없앤 쪽**의 예다 | 1,250 |
| `trait` 의 `impl Trait` 대 `dyn Trait` | **`cs/dynamic-dispatch`**(이미 있다) | 컴파일 시 복제냐 실행 시 표냐 | 9 |
| `Arc<Mutex<T>>` | `cs/race-condition` · `cs/blocking-and-async` | `Send`/`Sync` 가 무엇을 막는지 | 223 |
| `unsafe` 가 검사를 안 끈다 | `cs/undefined-behavior` | Crichton 외(2023)의 1번 오개념이 정확히 이것이다 | 6 |
| `let` 이 기본 불변 (E0384) | `cs/immutability` | 「바꿀 수 있음」을 선언 쪽에 적는 언어 | 1,356 |
| 정수 나눗셈이 버린다 · 넘치면 패닉 | `cs/integer-overflow` | 디버그 빌드에서만 패닉한다는 것이 그 개념의 좋은 예다 | 522 |

`cs/aliasing` 하나가 이 축에서 가장 값이 크다 — 러스트 컴파일 오류 두 개(E0499·E0502)의 근거가
그 한 장에 이미 한국어로 쓰여 있고, 지금 그것을 `prereq` 로 가리키는 언어 개념이 하나도 없다.

### 2.3 `rs.md` 에 고칠 것 (실측 근거)

이 문서의 계수로 `docs/curriculum/rs.md` 를 다섯 군데 고친다. **아직 안 고쳤다** — 착수 결정 뒤에
한다.

1. **`async`/`await` 을 개념으로 올린다.** §6 이 「`async-await`·`promise-chain` 은 tokio 리포를
   만나면 재검토한다」고 유보했다. 만났고, ai-pm 2,571 · PySpace 52 · ECC 209 다. `common/async-await`
   재사용(TS·파이썬·C#·스위프트에 다 있다).
2. **`smart-pointer` 를 `shared-thread-state` 의 선행에서 뺀다.** §4 가 `Arc<Mutex<T>>` 의 선행을
   `smart-pointer` 로 걸었는데 계수가 반대다 — `Box`/`Rc`/`RefCell` 26 대 `Arc`/`Mutex`/`RwLock` 300.
   내 코드에 `Arc` 는 있고 `Box` 는 없는 상태에서 선행이 걸리면 `Arc` 카드가 영영 안 뜬다.
3. **`cs/static-vs-dynamic-dispatch` 신규 제안을 지운다.** `cs/dynamic-dispatch` 가 이미 있다.
4. **§8 의 `grammar_abi` 절을 닫는다.** `ts` 의 15 는 `javascript` 키였다(§1.4). `rs: { rust: 14 }`.
5. **§8 ④ 의 「골든으로 확인 못 했다」를 확인으로 바꾼다.** `<` 는 안 섞인다(§1.4).

그리고 **새로 생긴 미결 하나** — `.unwrap()`/`.expect()` 가 ai-pm 2,797 · file_converter 235 ·
ECC 209 로 `.clone()`(1,150/72/444)보다 리포마다 2.4배·3.3배·0.5배다 — ai-pm 에서 특히 크다. `rs.md` 는 이것을 개념이 아니라 `alternatives`
(「AI 가 대신 쓴 것」)로만 두자고 했다. 계수가 그 결정을 다시 열 만큼 크다 — **사용자 결정 대상**
(§6).

---

## 3. 실행 러너 — cargo 어댑터

### 3.1 계약에 어떻게 앉나

`packages/grading/src/runner.ts` 의 계약은 언어 중립이다. 바꿀 곳이 정확히 넷이고 전부 TS 다.

| 자리 | 지금 | 러스트가 더하는 것 |
|---|---|---|
| `RunSpec.lang` | `'java'` | `'java' \| 'rust'` |
| `RunnerReason` | `no-jdk` · `no-gradle-wrapper` · `unsupported-lang` · `not-detected` | `+ no-cargo` · `no-toolchain` · `no-deps` |
| `detectRunner` | `detectJava` 호출 하나 | `lang` 에 따라 `detectRust` 로 갈린다 |
| `runTests` | `spec.lang !== 'java'` 면 `no-runner` | `'rust'` 갈래 추가 |

`ProcSpec`(`rootPath`·`workId`·`needs`·`keep`·`files`·`program`·`args`·`env`·`timeoutMs`)은
**한 필드도 안 늘어난다.** `t3_run` 은 손대지 않는다. **Rust 0줄** — D175 의 선례 그대로다.

새 파일은 `packages/grading/src/rust-runner.ts` 한 장(예상 200~240줄, `java-runner.ts` 가 259줄).

### 3.2 탐지 `detectRust(rootPath)`

자바의 `detectJava` 와 같은 모양이다 — 파일이 있나 → 프로그램이 도나 → 배포본이 받아져 있나.

1. **매니페스트.** `Cargo.toml` 을 리포 루트에서 찾고, 없으면 `src-tauri/Cargo.toml`. 네 리포
   전부 후자다(ECC 만 `ecc2/Cargo.toml`). 없으면 `not-detected`.
   → 러스트에서는 **워크스페이스 루트가 리포 루트가 아니다.** 자바의 `gradlew` 는 리포 루트에
   있어서 `rootPath` 하나로 됐지만, cargo 는 **하위 디렉터리**를 기억해야 한다. `RunnerProbe` 에
   `subdir?: string` 을 더하고 `ProcSpec.args` 앞에 `--manifest-path <subdir>/Cargo.toml` 을 붙인다.
2. **툴체인 핀.** `rust-toolchain.toml`(또는 `rust-toolchain`)의 `channel` 을 읽는다.
   실측: **ai-pm `1.98.0` · ECC `1.96` · file_converter 없음 · PySpace 없음.**
   핀이 있으면 rustup 이 그 이름의 툴체인을 **내려받으려 한다** — 측정 중에 ECC 에서 실제로
   그랬다(`info: downloading 6 components`). 그래서 자바의 Gradle 배포본과 같은 자리에
   `needs` 를 건다:
   ```ts
   needs: [`.rustup/toolchains/${channel}-${host}`]
   ```
   `host` 는 3번의 `cargo -vV` 출력 `host: aarch64-apple-darwin` 에서 읽는다.
   **이것이 D175 ④ 「묻기 전에 네트워크를 쓰지 않는다」의 러스트판이다.**
3. **cargo 자체.** 빈 작업본(`rootPath: ''`)에서 `cargo -vV`. 자바의 `java -version` 자리다.
   출력이 없거나 `RUN_SPAWN` 이면 `no-cargo`. 여기서 `host` 도 같이 얻는다.
4. **의존성 캐시.** 이것이 자바에 없던 넷째 관문이다. 실측:

   | 리포 | `cargo metadata --offline --locked` | 패키지 |
   |---|---|---|
   | ai-pm | **성공** | 817 |
   | file_converter | **성공** | 551 |
   | PySpace | **실패** — `failed to download js-sys v0.3.99` | — |
   | ECC | **실패** — 툴체인 1.96 을 받으러 감 | — |

   **넷 중 둘이 오프라인으로 못 선다.** 이 검사를 탐지에 넣을지는 값이 든다 — `cargo metadata` 는
   작업본이 있어야 하고 작업본 복사는 ai-pm 기준 2,037파일이다. **대안**: 탐지에서는 1~3만 보고,
   실패 분류를 §3.3 의 로그 정규식에 맡긴다(자바의 `cannotHost()` 와 같은 자리). 이쪽이 싸고
   자바와 모양이 같다. 그래서 **로그 분류를 정본으로 하고 `cargo metadata` 는 안 부른다.**

### 3.3 인자와 출력 읽기

**`cargo test -- --format json` 은 안정 채널에서 안 된다. 실제로 돌려 봤다.**

```
$ cargo test -- --format json
error: The "json" format is only accepted on the nightly compiler with -Z unstable-options
$ cargo test -- -Z unstable-options --format json
error: the option `Z` is only accepted on the nightly compiler
$ RUSTC_BOOTSTRAP=1 cargo test -- -Z unstable-options --format json
{ "type": "suite", "event": "started", "test_count": 4 }
{ "type": "test", "name": "tests::fails", "event": "failed", "stdout": "…panicked at src/lib.rs:7:26:…" }
{ "type": "suite", "event": "failed", "passed": 2, "failed": 1, "ignored": 1, … }
```

`RUSTC_BOOTSTRAP=1` 은 **안정 컴파일러에게 나이틀리인 척하라는 탈출구**다. 학습 도구가 사용자
컴퓨터에서 그것을 켜는 것은 안 한다 — 형식이 안정 보장 밖이라 컴파일러가 올라가면 조용히 깨진다.

**안정 채널의 대안은 libtest 의 사람용 출력이고, 그것으로 충분하다.** 자바에서는 초기화 스크립트
한 장(`INIT_GRADLE`, 13줄)을 던져 `afterTest` 표시줄을 만들어야 했는데 **러스트는 그 줄을 이미
찍는다**:

```
test tests::skipped ... ignored
test tests::ok_one ... ok
test more::a4 ... FAILED
test result: FAILED. 5 passed; 2 failed; 1 ignored; 0 measured; 0 filtered out; finished in 0.04s
```

기본이 병렬 실행인데도 **한 줄이 통째로 원자적으로 나온다**(테스트 8개로 확인). 그래서 파싱은
정규식 둘이다.

```ts
const LINE = /^test (\S+) \.\.\. (ok|FAILED|ignored)/;
const SUM  = /^test result: \w+\. (\d+) passed; (\d+) failed; (\d+) ignored/;
```

실패 메시지는 `failures:` 절의 `---- <name> stdout ----` 블록에서 뽑는다 — 패닉 줄에 파일·행과
`assertion \`left == right\` failed` 가 붙어 있어 `RunFailure.message` 로 그대로 쓸 수 있다.

**인자**:

```ts
const ARGS = [
  'test',
  '--offline',          // 의존성 해석에서 네트워크를 끈다
  '--locked',           // Cargo.lock 을 고치지 않는다 (원본 리포 불변 규칙의 연장)
  '--no-fail-fast',     // 타깃 하나가 실패해도 나머지를 센다
  '--manifest-path', `${subdir}/Cargo.toml`,
  '--', '--test-threads', '…',   // 필요하면
];
const ENV = [['CARGO_TERM_COLOR', 'never'], ['RUST_BACKTRACE', '0']];
```

`--no-daemon` 에 해당하는 것은 없다(cargo 는 데몬을 안 띄운다). `--release` 는 안 쓴다 — 디버그가
빠르고, 정수 오버플로 패닉이 켜져 있어 **학습에 더 좋은 실패**를 준다.

**로그 분류** — 자바의 `cannotHost()` 와 같은 자리. 학습자의 답과 무관한 사정만 든다.

| 로그 | 판정 |
|---|---|
| `attempting to make an HTTP request, but --offline was specified` · `failed to download` · `no matching package` | `no-runner` (`no-deps`) — PySpace 가 여기 |
| `error: rustup could not choose a version` · `toolchain '…' is not installed` | `no-runner` (`no-toolchain`) — ECC 가 여기 |
| `error: could not find \`Cargo.toml\`` | `no-runner` (`not-detected`) |
| `error[E0…]` · `could not compile` | **`error`** — 답 안에 있다 |
| 표시줄 0개 + 위 어느 것도 아님 | `error` |

종료 코드는 실패 시 101 이다(측정). 자바와 같이 「빌드가 섰는가」에만 쓴다.

### 3.4 판정용 테스트 — D180 ⓐⓑⓒ 의 러스트판

**러스트 시험의 88%가 채점 대상 파일 안에 산다.** 이것이 자바와의 가장 큰 구조 차이다.

| 리포 | `#[cfg(test)] mod` 안 | `tests/` 디렉터리 | `#[cfg(test)]` 를 품은 소스 파일 |
|---|---|---|---|
| ai-pm | **1,287** | 170 | 147 / 249 (59%) |
| file_converter | **343** | 0 | 32 / 45 (71%) |
| PySpace | **0** | 0 | 0 / 8 |
| ECC | **425** | 0 | 13 / 16 (81%) |

D180 의 세 갈래를 그대로 옮기면 이렇게 된다.

**ⓐ `fix:` 커밋이 같이 고친 시험** — 러스트에서는 **같은 파일의 `mod tests` 블록**이다. 파일이
아니라 블록이라 `_blocks.scm` 의 `form: "mod"`(§1.3)가 필요하다. 그 커밋 이후 판의 그 블록만
떼어 온다.

**ⓑ 이름이 맞는 시험** — 자바의 `AuthService` → `AuthServiceTest` 에 해당하는 것이 러스트에는
없다. 대신 **같은 파일 안**이라 찾을 것도 없다. `tests/` 디렉터리를 쓰는 170개(ai-pm)에서만
`tests/<모듈이름>*.rs` 를 이름으로 맞춘다.

**ⓒ 계약 시험 생성 — 러스트는 리플렉션이 없지만 더 나은 것이 있다.**
자바는 리플렉션으로 공개 메서드의 이름·인자 수·타입 이름을 실행 시에 못 박았다. 러스트는
**함수 포인터 강제 변환 한 줄이 컴파일 시에** 같은 일을 한다. 실제로 돌려 확인했다:

```rust
// tests/chickadee_contract.rs — 작업본에만 놓인다
#[allow(dead_code)]
const _ADD: fn(i32, i32) -> i32 = crate_name::add;
#[test] fn contract_holds() {}
```

시그니처를 하나만 틀리게 하면:

```
error[E0308]: mismatched types
 --> tests/chickadee_contract.rs:4:34
```

**이름·인자 수·인자 타입·반환 타입이 한 줄에 다 못 박히고, 값을 하나도 만들 필요가 없다.**
자바의 리플렉션 시험보다 강하다(자바는 단순 이름만 봤다). 그리고 오류 코드 `E0308` 이 그대로
나오는데, `rs.md` §9 가 「오류 코드를 그대로 적는 것이 다른 언어에 없는 자산」이라고 한 자리와
정확히 겹친다.

**5단(재구현)의 파일 합성.** 백지에서 다시 쓰게 하면 `mod tests` 도 같이 지워진다. 그래서
어댑터는 `ProcSpec.files` 에 **학습자 답안 + 원본의 `#[cfg(test)] mod tests` 블록**을 이어 붙인
전문을 넣는다. `files` 가 이미 `[path, text]` 전문이라 **계약 변경 0**이다.
부수 효과 하나가 좋다 — 내부 시험은 `use super::*` 로 **비공개 항목도 부른다**. 그래서 판정이
공개 API 만이 아니라 학습자가 만든 내부 이름까지 요구한다. 그것이 과한 자리는 ⓒ 로 내려간다.

### 3.5 시간·디스크 실측

`.gitignore` 를 따르는 복사(= `git ls-files --cached --others --exclude-standard`)로 작업본을
만들고 스크래치패드 `CARGO_TARGET_DIR` 에서 돌렸다.

| 측정 | 값 |
|---|---|
| file_converter 첫 빌드(`cargo test --no-run`, 551 패키지) | **39.1초** (user 156초 — 병렬) |
| file_converter 두 번째 이후(`cargo test`, 캐시 있음) | **1.69초**, 그중 시험 343개가 **0.22초** |
| **ai-pm 첫 빌드**(817 패키지 · 시험 바이너리 28개) | **166.6초** (user 1,235초) |
| **ai-pm 따뜻한 재빌드**(앱 크레이트 재컴파일 + 재링크) | **12.1초** |
| **ai-pm 따뜻한 `cargo test --lib`** | **12.9초**, 그중 시험 **1,347개**가 10.3초 (0 실패 · 1 무시) |
| 작업본 `target/` 디스크 | **ai-pm 6.3 GB** (file_converter 는 안 쟀다) |

**기본 상한 180초가 큰 리포의 첫 회에 아슬아슬하다.** ai-pm 이 166.6초다 — 이 기계는
`user/real` = 7.4 라 코어를 다 쓴 값이고, 코어가 적은 기계에서는 넘긴다. `FIRST_RUN_TIMEOUT_MS`
600초가 맞고, **첫 회 판정은 반드시 그 값을 써야 한다.**

**`dist/` 는 `keep` 에 안 넣어도 된다.** 세 Tauri 리포 전부 `frontendDist: "../dist"` 이고 `dist/`
가 `.gitignore` 에 있어서 작업본에 안 온다. 그래도 `cargo test --no-run` 이 통과한다 —
`tauri-build` 가 `cargo test` 에서는 프런트 산출물을 요구하지 않는다(작업본에서 직접 확인).

**`keep` 에 넣을 것**은 `Cargo.lock` 하나다. 네 리포 다 커밋돼 있어 지금은 안 필요하지만,
라이브러리 리포는 `.gitignore` 에 넣는 관례가 있고 그러면 `--locked` 가 곧장 실패한다.

**상한.** 기본 180초는 file_converter(39초)에 넉넉하고 ai-pm 에는 **첫 회 600초가 필요할 수 있다**.
`RUN_TIMEOUT_MS` / `FIRST_RUN_TIMEOUT_MS` 를 그대로 쓴다 — 값을 바꿀 근거가 아직 없다.

**디스크가 자바에 없던 비용이다.** ai-pm 하나가 6.3 GB. 작업본은 `workId` 로 재사용되므로 리포를
여럿 등록하면 곱해진다. **정리 정책이 필요하다**(§6 사용자 결정).

---

## 4. Tauri 기능 경로 — `invoke` ↔ `#[tauri::command]`

### 4.1 실측 — 짝이 392쌍이다

| 리포 | `#[tauri::command]` 정의 | 문자열 리터럴 `invoke` 자리 | 서로 다른 이름 | 이름이 일치하는 짝 | 안 불리는 커맨드 |
|---|---|---|---|---|---|
| ai-pm | **350** | 350 (전부 `src/lib/bindings.ts`) | 350 | **350** | 0 |
| file_converter | 18 | 17 (`src/lib/{settings,jobs,runtime}.ts`) | 17 | **17** | 1 (`list_jobs`) |
| PySpace | 28 | 28 (`src/App.tsx` 27 · `TerminalView.tsx` 1) | 25 | **25** | 3 (`git_fetch`·`git_pull`·`git_push`) |
| ECC | 0 | — | — | — | — |
| **합** | **396** | **395** | **392** | **392** | **4** |

계수는 tree-sitter 로 냈다(`.ts` 는 typescript 문법, `.tsx` 는 tsx 문법). 못 잇는 자리는
**PySpace 의 `invoke<string>(action, …)` 하나** — 커맨드 이름이 변수다. 안 불리는 커맨드 넷은
오류가 아니라 재료다(D169 「죽은 갈래」).

**프런트가 부르는 모양이 셋으로 갈린다.**

| 모양 | 리포 | 자리 |
|---|---|---|
| 컴포넌트에서 직접 | PySpace | `App.tsx` 에서 `invoke("run_project", …)` |
| 손으로 쓴 API 모듈 | file_converter | `src/lib/jobs.ts` 등 세 장 |
| **생성된 바인딩** | ai-pm | `src/lib/bindings.ts` 6,206줄 — tauri-specta 가 `__TAURI_INVOKE("db_health")` 를 찍는다 |

셋째가 문제다. ai-pm 의 화면은 `commands.dbHealth()` 를 부르지 `invoke("db_health")` 를 안 부른다
— **`commands.X(` 호출 자리 497개 · 서로 다른 이름 325개.** 그래서 간선이 한 칸 더 필요하다:
화면 → `bindings.ts` → Rust. 다행히 바인딩 한 줄에 **둘이 같이 있다**:

```ts
dbHealth: () => typedError<DbHealth, string>(__TAURI_INVOKE("db_health")),
```

이 모양을 한 패턴으로 잡아 봤더니 **350 중 348(99.4%)**이 잡힌다. 못 잡는 둘은 `Channel` 인자가
낀 다른 모양이다.

### 4.2 쿼리 — 세 줄

**TS 쪽** (`dictionary/ts/_imports.scm` 에 더한다):

```scheme
; Tauri 커맨드 호출. 뒤쪽 `#[tauri::command] fn <이름>` 과 **같은 문자열**이라 접을 것이 없다.
; `function:` 자리에 `await_expression` 갈래가 필요한 이유는 아래 「await 함정」.
((call_expression
   function: [(identifier) @ctx.callee (await_expression (identifier) @ctx.callee)]
   arguments: (arguments . (string) @import.source))
 (#match? @ctx.callee "^(invoke|__TAURI_INVOKE)$")
 (#set! form "tauri-invoke"))

; tauri-specta 가 만든 바인딩 한 줄 — 화면이 부르는 camelCase 별칭까지 같이 잡는다.
((pair key: (property_identifier) @ctx.alias
       value: (arrow_function body: (call_expression arguments: (arguments
         (call_expression function: (identifier) @ctx.callee
                          arguments: (arguments . (string) @import.source)))))))
 (#eq? @ctx.callee "__TAURI_INVOKE")
 (#set! form "tauri-binding"))
```

**Rust 쪽** (`dictionary/rs/_imports.scm`, §1.3 에 이미 있다):

```scheme
((attribute_item (attribute (scoped_identifier) @import.source))
 (#eq? @import.source "tauri::command") (#set! form "entry-command"))
```

#### `await` 함정 — 타입 인자가 붙으면 `function:` 이 통째로 밀린다

처음 쓴 패턴(`function: (identifier)`)이 PySpace 에서 28 중 22 만 잡았다. 원인을 찍어 보니
**`await f<T>(x)` 는 `function:` 자리에 `await_expression` 이 온다**:

```
call_expression  "await invoke<string>(\"typed\")"
  await_expression  "await invoke"      ← function: 필드가 이것이다
  type_arguments  "<string>"
  arguments  "(\"typed\")"
```

타입 인자가 **없으면** `await_expression(call_expression(…))` 로 정상 중첩되고, 있으면 뒤집힌다.
typescript·tsx 문법 둘 다 같다(둘 다 확인). 갈래를 더하니 PySpace 가 22 → **28** 로 올라 grep
계수와 정확히 맞았다.

**이 함정은 이미 있는 `dictionary/ts/_imports.scm` 의 HTTP 패턴 다섯(`http-get`…`http-delete`)에도
그대로 있다** — `await api.get<Notice[]>("/notices")` 를 쓰는 리포에서 그 간선이 조용히 안 선다.
지금 표본(스프링+뷰)에 그 모양이 없어 안 걸렸을 뿐이다. R5 에서 같이 고친다.

#### 애너테이션은 함수의 형제다

러스트에서 `attribute_item` 은 `function_item` 의 **자식이 아니라 형제**다. 트리를 찍어 확인했다:

```
attribute_item  "#[tauri::command]"
attribute_item  "#[specta::specta]"      ← 사이에 다른 애너테이션이 낀다
function_item   "pub async fn plan_list(…)"
```

자바에서는 `method_declaration > modifiers > annotation` 이라 한 패턴으로 애너테이션과 메서드
이름을 같이 잡았는데 러스트는 못 한다. 형제 앵커(`.`)를 쓰면 `#[specta::specta]` 가 낀 350개를
전부 놓치고, 앵커를 빼면 파일 안의 모든 애너테이션 × 모든 함수가 조합으로 걸린다.

**해법**: 애너테이션의 **줄 번호만** 내보내고 짝짓기는 TS 가 한다 — `_blocks.scm` 이 이미 모든
`function_item` 의 범위를 주므로, 「그 줄 다음의 첫 `fn` 블록」이 답이다. 해석을 TS 가 하는 것은
D18 이 정한 규칙 그대로이고, 자바의 `route-base` / `route-get` 분리와 같은 모양이다.

### 4.3 `import_edge.kind` — `ipc` 를 더한다

지금 `kind` 는 `CHECK (kind IN ('static','type','dynamic','http'))` 이고 TS 쪽에도 같은 유니온이
`packages/store-sql/src/types.ts:189`·`schemas.ts:155` 두 자리에 있다.

| 안 | 비용 | 문제 |
|---|---|---|
| **`http` 재사용** | **0** | 화면에 라벨이 없어(지금 `kind` 를 글자로 그리는 자리가 없다 — `DependencyMap.tsx` 가 `kind === 'http'` 로 곡선을 두 겹 그릴 뿐) 당장은 안 보인다. 그러나 `Hop.kind` 가 카드 payload 에 들어가고(`stage-types.ts:57`) 2단 문항이 그것을 쓰기 시작하면 **IPC 호출을 HTTP 라고 적어 둔 것**이 된다 |
| **`ipc` 추가** | 마이그레이션 1장 + 한 줄 수정 4곳 | `import_edge` 는 **TS 파생 테이블**이라 정본 스키마 규칙상 DROP + 재생성이 허용된다(`0001_init.sql` 머리말). `EdgeKind` 유니온·zod enum·`hops.ts` 의 `EDGE_OF`·`DependencyMap` 의 기하 분기 넷 |

**`ipc` 추가를 권한다.** 지금 값이 0에 가깝지만, `http` 로 적어 두면 나중에 되돌릴 때 이미 구운
카드의 payload 가 전부 틀린 낱말을 담고 있다. 다만 이것은 `packages/**` 를 건드리므로 **결정
등록부 행이 먼저**다(§7 의 D-초안 C).

### 4.4 왜 이것이 이 축의 가장 값싼 큰 승리인가

D159 가 스프링+뷰에서 HTTP 간선을 세울 때 든 것: 클래스 수준 `@RequestMapping` 과 메서드 수준
`@PostMapping` 을 **`form` 으로 갈라** 캡처하고, HTTP 메서드 6종마다 패턴을 따로 쓰고(경로 없는
`@GetMapping` 까지 12패턴), 경로 변수(`/{noticeId}` ↔ `` `/notices/${id}` ``)를 양쪽에서 자리표로
접어야 했다. `dictionary/java/_imports.scm` 이 그 때문에 150줄이 넘는다.

**Tauri 는 문자열 하나가 양쪽에 그대로 있다.** 패턴 3개(TS 2 · Rust 1) + TS 쪽 짝짓기 함수 하나로
**392 간선**이 선다. 그리고 그 간선이 세우는 것은 정본 §2 의 2단(추적) 정답지 그 자체다 —
「버튼을 누르면 무슨 함수가 도나」가 Tauri 앱에서 유일하게 어려운 물음이고, 지금 앱은 그 답을
못 낸다.

---

## 5. 비용과 순서

크기는 자바의 대응물에서 잰 값으로 추정했다(`java-runner.ts` 259줄 · `dictionary/java/` 29장 6,423줄).

| # | 조각 | 파일 | 예상 줄 | 선행 | 안 하면 무엇이 안 되나 | 티어 |
|---|---|---|---|---|---|---|
| **R1** | `dictionary/rs/_lang.yaml` + `_imports.scm` + `_blocks.scm` | 3 | 250 | 없음 | **러스트 리포에서 아무 카드도 안 구워진다.** 지금 상태 | A |
| **R2** | `rs/` 1부 12장 | 12 | ~2,600 | R1 | 1부(합성)가 안 선다. 러스트가 처음인 사용자에게 줄 것이 없다 | A |
| **R3** | `rs/` 2부 14장 | 14 | ~3,100 | R2 | 소유권·빌림·`?` 를 못 가르친다. **이 축의 본체** | A |
| **R4** | `rs/` 3부 10장 (+ `common/async-await` 재사용) | 10 | ~2,200 | R3 | `async`/`await` 2,571자리가 사전에 안 걸린다 | A |
| **R5** | TS 쪽 `tauri-invoke`·`tauri-binding` 패턴 + `await` 갈래 보강 + `resolve-imports.ts` 짝짓기 | 2 수정 | ~60 | R1 | **392 간선이 안 선다.** 2단(추적)이 Tauri 리포에서 파일 import 만 본다 | B |
| **R6** | `import_edge.kind` 에 `ipc` — 마이그레이션 + 유니온 4자리 | 5 | ~50 | R5 | R5 를 `http` 로 적게 된다(되돌리기 비쌈) | B |
| **R7** | `rust-runner.ts` — 탐지·인자·출력 읽기 | 1 | ~220 | R1 | 4·5단이 러스트에서 AST 제약까지만. **PySpace 는 어차피 못 켠다**(시험 0개 · 오프라인 실패) | B |
| **R8** | `runner.ts` 갈래 + `RunnerReason` 셋 + i18n `run.reason.*` | 3 수정 | ~40 | R7 | R7 이 안 붙는다 | B |
| **R9** | 계약 시험 생성기(`fn` 포인터 강제 변환) + `mod tests` 합성 | 1 | ~120 | R7 | 5단이 D180 ⓒ 없이 ⓐⓑ 만 — 시험 없는 파일에서 5단이 채점 없음 | B |
| **R10** | `tauri/` 프레임워크 네임스페이스 (`spring/` 선례 · D176) | 8~12 | ~2,000 | R5 | `invoke` 가 무엇인지, `State<'_, T>` 가 왜 필요한지를 못 가르친다. 간선은 서는데 개념이 없다 | B |
| **R11** | `&raw` 골든 · 512 KiB 초과 파일 처리 확인 | 2 | ~40 | R1 | 문법을 올렸을 때 조용히 깨진다 | A |

**순서.** R1 → R2 → R3 → (R5·R7 병렬) → R6 → R8 → R9 → R4 → R10 → R11.

**R5 를 R3 직후에 두는 이유**: 값이 가장 크고(392 간선) 값이 가장 싸다(60줄). R7(러너)과
선행 관계가 없어 병렬로 간다.

**티어**(정본 §5). R1~R4·R11 은 **A**(모든 러스트 리포에서 같은 깊이). R5~R10 은 **B**(덮은 스택
— Tauri 이거나 cargo 가 도는 리포). ECC 같은 CLI 리포는 R5·R6·R10 이 그냥 안 뜨고 A 로 내려앉는다.

**총량** 34장 YAML ≈ 7,900줄 + TS ≈ 490줄 + `tauri/` ≈ 2,000줄. **Rust 0줄.**

---

## 6. 못 잰 것

1. **ai-pm 의 통합 시험(`tests/` 31장 · 170개) 실행 시간.** `--lib` 1,347개는 10.3초로 쟀지만
   통합 시험 쪽은 안 돌렸다. LSP·프로세스를 띄우는 시험이 그쪽에 있어(`tests/lsp_rust_analyzer.rs`)
   `--test-threads` 나 `--lib` 한정이 필요할 수 있다.
2. **`rs/move` 가 D154 의 UNION 가지를 실제로 타는지.** `rs.md` 가 남긴 물음 그대로다 — SQL 조건이
   맞는 것까지만 봤고 돌려 보지 않았다.
3. **작업본 복사 시간.** ai-pm 은 2,037파일이다. `t3_run` 의 복사가 몇 초인지 안 쟀다.
4. **`.unwrap()` 을 개념으로 올렸을 때의 사용처 품질.** 계수(ai-pm 2,797)는 냈지만 그중 몇이
   「가르칠 만한 자리」인지는 안 봤다. 시험 코드의 `unwrap` 이 섞여 있다.
5. **여러 크레이트 워크스페이스.** 네 리포 다 `workspace_members` 가 1이다. `--manifest-path` 하나로
   되는지, `-p <패키지>` 가 필요한지 못 쟀다.
6. **`&raw` 를 고친 상류 문법이 있는지.** tree-sitter-rust 0.24 이상을 안 봤다.
7. **`cs/` 창 빌림이 러스트에서 실제로 도는지.** `cs/*.yaml` 에 `rs/` 참조가 0장이라 간선을
   `rs/` 쪽에서 걸어야 하는 것까지는 확인했지만, `dict:lint` 의 「빌려 준다고 적어 놓고 빌려 줄
   창이 없는」 규칙에 걸리는지는 사전을 써 봐야 안다.

## 7. 사용자 결정이 필요한 것

| # | 물음 | 실측이 주는 것 | 기본값(결정 없으면) |
|---|---|---|---|
| 1 | **`import_edge.kind` 에 `ipc` 를 더할까, `http` 를 재사용할까** | 추가는 마이그레이션 1장 + 한 줄 수정 4곳. 재사용은 0. 지금 `kind` 를 글자로 보여 주는 화면은 없다 | `ipc` 추가 |
| 2 | **`.unwrap()`/`.expect()` 를 개념 한 장으로 올릴까** | 3,279자리(네 리포 합) — `.clone()`(1,714)의 1.9배. `rs.md` 는 `alternatives` 로만 두자고 했다 | `alternatives` 유지 |
| 3 | **작업본 `target/` 정리 정책** | ai-pm 하나가 **6.3 GB**(디버그 · 시험 바이너리 28개). 자바에 없던 비용이고 등록 리포마다 곱해진다 | 등록 리포당 하나 유지, 수동 삭제 |
| 4 | **`rust-toolchain.toml` 핀이 있는 리포에서 툴체인 내려받기를 물을까** | 네 리포 중 둘에 핀이 있고 그중 하나(ECC 1.96)는 이 컴퓨터에 없었다 | D175 ④ 대로 묻는다(`needs` 로 막고 동의를 받는다) |
| 5 | **`tauri/` 네임스페이스(R10)를 이번 판에 넣을까** | 간선 392개는 R5(60줄)로 서지만, 그 간선이 무엇인지 설명하는 개념은 R10(2,000줄) | 다음 판 |

## 8. 결정 등록부에 올릴 행 (초안)

**아직 안 올렸다.** 착수가 정해지면 `docs/00-overview.md` §4.2.1 에 다음 번호로 올린다.

**D-초안 A — 러스트 축을 연다 (`dictionary/rs/` 34장 · 3부).**
왜: `tree-sitter-rust` 가 `crates/parse` 에 링크돼 있는데 사전이 0장이다. 사용자 리포 넷 중 넷에
러스트가 있고(280 · 45 · 8 · 16장), Chickadee 자신이 Tauri 다. 무엇: `rs.md` 의 34개를 정본 §4 의
3부(바닥 12 · 소유권과 타입 14 · 비동기와 프레임워크 10)로 다시 앉히고 `async-await` 을 더한다.
`smart-pointer → shared-thread-state` 선행을 끊는다(`Box`/`Rc` 26 대 `Arc`/`Mutex` 300).
어디: `dictionary/rs/**`(신규) · `docs/curriculum/rs.md` · `docs/plan/rust-axis.md`.

**D-초안 B — cargo 러너, Rust 0줄.**
왜: 4·5단이 러스트에서 AST 제약까지만이고, 러스트는 **컴파일러가 교사**인 언어라 실행 없이는
`E0382`·`E0499` 를 카드가 흉내만 낸다. 무엇: `rust-runner.ts` 한 장. `cargo test --offline
--locked --no-fail-fast`. **`--format json` 은 안정 채널에서 안 되므로**(측정) libtest 의 사람용
출력 두 정규식으로 읽는다. D180 ⓒ 의 계약 시험은 리플렉션이 아니라 **`const _: fn(..) -> _ = 경로;`
한 줄**로 컴파일 시에 못 박는다. 시험이 대상 파일 안에 사는 88%를 위해 `_blocks.scm` 에
`mod`(본문 있는 것)를 더하고, 5단은 답안 + 원본 `mod tests` 를 합성해 넣는다.
어디: `packages/grading/src/rust-runner.ts`(신규) · `runner.ts` · `packages/i18n/**` · `dictionary/rs/_blocks.scm`.

**D-초안 C — Tauri 기능 경로, `import_edge.kind = 'ipc'`.**
왜: `invoke("x")` ↔ `#[tauri::command] fn x` 가 **같은 문자열**이고 사용자 리포 셋에 392쌍이 있다
(ai-pm 350 · file_converter 17 · PySpace 25). D159 가 스프링에서 12패턴 + 자리표 접기로 세운 것을
러스트·TS 쪽 패턴 3개로 세운다. 무엇: `kind` 에 `'ipc'` 를 더한다 — `import_edge` 는 TS 파생
테이블이라 DROP + 재생성이 허용된다. `attribute_item` 이 `function_item` 의 **형제**라 애너테이션과
함수 이름을 한 패턴으로 못 잡는다 — 줄 번호를 내보내고 짝짓기는 TS 가 한다(D18).
어디: `dictionary/rs/_imports.scm` · `dictionary/ts/_imports.scm` · `packages/concepts/src/resolve-imports.ts` ·
`packages/store-sql/{migrations,src/types.ts,src/schemas.ts}` · `packages/course/src/hops.ts` ·
`apps/desktop/src/components/t2/DependencyMap.tsx`.
