# 기초 CS 사전 · `cs/`

**결정 등록부** D157. 이 문서는 `dictionary/cs/**` 의 명세이고, 언어 열 편(`docs/curriculum/<ns>.md`)이
「이건 문법이 아니라 기계다」라고 밀어낸 것을 받는 자리다.

---

## 1. 왜 새 네임스페이스인가

지금 사전에는 네 층이 있는데 **기계가 없다.**

| 네임스페이스 | 무엇을 담나 | 예 |
|---|---|---|
| `<lang>/` | 그 언어의 문법 | `py/assignment` · `ts/optional-chaining` |
| `common/` | **문법의 보편형** — 어느 언어에나 이 문법이 있다 | `common/list` = 순서 있는 목록 |
| `react/` | 프레임워크 개념 (`framework:` 필드) | `react/functional-state-update` |
| `arch/` (D142) | 프로젝트 구조 | `arch/role` · `arch/flow` |
| `exec/` (D151) | 실행 순서 | `exec/order` |
| **`cs/` (신설)** | **문법 아래에 깔린 기계와 이론** | `cs/memory-address` · `cs/complexity` |

`common/list` 는 「순서 있는 목록이라는 문법이 어느 언어에나 있다」는 말이다.
`cs/contiguous-vs-linked` 는 「그 목록이 메모리에 붙어 있느냐 흩어져 있느냐가 성능을 정한다」는 말이다.
같은 대상이지만 **층이 다르다.**

포인터가 이 구멍을 가장 잘 드러낸다. `c/pointer-dereference` 를 가르치려면 「주소」가 먼저인데,
개념 50개(`common` 30 + `ts` 30)를 다 훑어도 주소가 없다. `malloc` 을 칠 줄 아는 것과 힙을 아는 것은
다른 일이고, 지금 사전은 **앞의 것만** 가르칠 수 있다.

### 왜 `common/` 에 섞지 않나

두 규칙이 성격을 이미 갈라 놨다.

- 린트가 `common/` 에 「보편 개념은 쿼리가 없다」를 건다 (`lint.ts:139` · `dict.test.ts:59`).
- `essential: true` 면 `blank` + `@hole` 을 요구한다 — 빈칸에 채울 **낱말**이 있어야 한다는 뜻이다.

`cs/floating-point` 에 빈칸으로 채울 낱말은 없다. 한 통에 담으면 이 두 규칙이 서로를 못 만족한다.

### 왜 언어 사전에 분산하지 않나

**값과 참조의 차이는 Java·C#·Go·Swift·Python 에서 같은 기계다.** 언어별로 두면 `universal` 이 안 걸려
D4 전이가 죽고, 사용자는 같은 개념을 **다섯 번** 배운다. 파이썬이 `common/` 30 중 21(75%)을 물려받아
「두 번째 언어부터 싸진다」를 수치로 보인 것이 바로 이 자리다.

---

## 2. 사용처가 없는 개념이 어떻게 카드가 되나

`cs/` 개념에는 tree-sitter 캡처가 없다. `exec/`(D151)가 이미 같은 처지였고, 길이 나 있다.

**① 껍데기는 `exec/order.yaml` 을 그대로 따른다**

```yaml
universal: null          # 전이할 위층이 없다 — cs/ 가 맨 아래다
grammars: []
queries: []
track_default: t0
essential: false
```

새 트랙도 새 `card.kind` 도 마이그레이션도 만들지 않는다.

**② 큐에는 D154 가 이미 연 문으로 들어간다**

`queue.new_candidates` 의 UNION 가지 — 「`track_default='t0'` ∧ 미인쇄 ∧ 이 리포에 은퇴 안 한 카드가 있음
∧ 사용처 없음」. 첫 가지와 달리 **`c.kind = 'lang'` 을 안 본다**(SQL 원문 확인). `rankNewConcepts` 는
미지를 경계값 `MAX_UNKNOWN_FOR_NEW`(3)로 줘서 필터는 통과하되 **같은 깊이의 어휘 개념 뒤에** 세운다.
기존 순위 규칙을 한 글자도 안 건드린다.

**단, 이 가지는 카드가 *이미 구워져 있을 것*을 요구한다** —

```sql
AND EXISTS (SELECT 1 FROM card k
            WHERE k.repo_id = :repoId AND k.concept_id = c.id
              AND k.track = 't0' AND k.retired_at IS NULL)
```

`exec/*` 는 `t0-exec.ts` 가 AST 에서 문항을 계산해 굽기 때문에 이 조건을 넘는다.
`cs/` 에는 그런 굽는 이가 없다. **문이 열려 있다는 것과 들어갈 수 있다는 것은 다르다** —
큐는 안 고쳐도 되지만 **카드 생성기는 있어야 한다.** 무엇으로 구울지는 §9 의 첫 미해결이다.

**③ 사용처는 빌린다 — 이 문서의 핵심 장치**

`cs/` 개념은 자기 캡처 대신 **자기를 `prereq` 로 가리키는 언어 개념의 창**에 얹힌다.

```
c/pointer-dereference.prereq = [cs/memory-address]
        │  사용처 있음 (tree-sitter 가 `*p` 를 잡는다)
        ▼
cs/memory-address 가 그 창(D155 의 window_unknown 이 고른 40줄)에 올라탄다
```

언어 개념이 먼저 자리를 찾고, `cs/` 가 그 자리를 쓴다. 그래서 **`cs/` 카드에는 언제나 볼 코드가 있다** —
합성 예제가 아니라 사용자가 직접 짠(짜게 시킨) 줄이다. 이것이 이 앱이 CS 를 교과서와 다르게 가르치는 방식이다.

빌릴 창이 하나도 없으면(그 언어에 그 개념을 가리키는 사용처가 0) 그 `cs/` 개념은 안 뜬다.
가비지 컬렉션을 C 만 쓰는 사용자에게 안 가르치는 것이 맞다.

**단, 이 장치는 아직 코드에 없다.** 지금 `bestSiteOf(conceptId)` 는 그 개념 **자신의** 사용처만 찾는다.
`cs/` 가 빌리려면 「이 개념을 `prereq` 로 가리키는 개념들의 사용처 중 가장 좋은 것」으로 넓혀야 한다 —
`prereq` 의 **역방향** 조회다. `prereq-graph.ts` 가 이미 `dependents` 맵을 만들고 있으므로(`:21`)
재료는 있다. 이것이 `cs/` 구현의 첫 조각이다.

---

## 3. 기초 — 열

기계를 처음 보는 사람이 딛는 자리. 전부 `prereq` 깊이 ≤ 2 라 0장(D147, 상한 24)에 들어간다.

| id | name.ko / en | 난이도 | prereq | 한 줄 | 이것을 요구하는 언어 개념 |
|---|---|---|---|---|---|
| `cs/binary-representation` | 0과 1로만 적기 / Binary representation | 1 | — | 컴퓨터가 가진 것은 켜짐·꺼짐 둘뿐이고 숫자·글자·색이 전부 그 묶음이다 | 전 언어 리터럴 |
| `cs/bit-and-byte` | 자리와 묶음 / Bits and bytes | 1 | binary-representation | 여덟 자리를 한 덩이로 세고, 덩이 수가 값의 크기다 | `c/sizeof` · `rs/u8` |
| `cs/type` | 값에 붙은 「무엇으로 다룰지」 / Type | 1 | — | 같은 비트 묶음도 타입이 정수라 하면 정수고 글자라 하면 글자다 | 전 언어 |
| `cs/state` | 시간에 따라 변하는 것 / State | 1 | — | 같은 코드가 같은 답을 안 내는 이유는 대개 값이 아니라 **시점** 이다 | `common/reassignment` · `common/mutating-append` |
| `cs/call-stack` | 돌아올 곳을 쌓아 두기 / Call stack | 2 | — | 함수를 부르면 돌아올 자리가 쌓인다. 너무 쌓이면 넘친다(스택 오버플로) | 전 언어 `function-call` · 재귀 |
| `cs/scope-and-lifetime` | 이름이 보이는 범위와 값이 사는 기간 / Scope and lifetime | 2 | call-stack | **둘은 다르다** — 이름이 안 보여도 값은 살아 있을 수 있다 | `rs/lifetime` · `ts/closure` · `c/static` |
| `cs/value-vs-reference` | 복사되나 같은 것을 가리키나 / Value or reference | 2 | type | 넘길 때 값이 복사되는지 자리만 복사되는지 | `java/equals` · `csharp/struct-class` · `swift/struct-class` · `go/pointer-receiver` · `py/mutable-default` |
| `cs/compile-and-run` | 번역하는 때와 도는 때 / Compile time and run time | 2 | — | 오류가 두 시점에 난다. 어느 쪽이냐가 **무엇을 고칠지**를 정한다 | `ts/type-annotation` · `java/compile-error` · `c/header` |
| `cs/error-vs-bug` | 예상한 실패와 안 예상한 실패 / Expected failure and defect | 2 | — | 파일이 없는 것은 실패고, 없을 수 있다는 걸 안 다룬 것은 결함이다 | `common/try-catch` · `go/error-return` · `rs/result` |
| `cs/abstraction` | 안을 안 보고 쓰기 / Abstraction | 2 | — | 이름 하나가 안의 열 줄을 대신한다. 새는 자리가 어디인지가 공학이다 | `common/function-definition` · `arch/role` |

**이 열이 왜 이 열인가.** 「침팬지를 공학자로」의 첫 관문은 `malloc` 이 아니라 **「내가 적은 글자가
기계에서 무엇이 되는가」**다. 위 열 중 여섯(binary · bit · type · call-stack · compile-and-run · value-vs-reference)이
그 질문의 조각이고, 나머지 넷(state · scope · error-vs-bug · abstraction)은 **자기 코드가 왜 안 도는지**를
스스로 좁히는 데 필요한 어휘다. 바이브 코딩으로 앱을 만든 사람이 가장 자주 막히는 자리가 뒤의 넷이다.

---

## 4. 중심 — 열둘

언어를 하나라도 제대로 읽으려면 필요한 것.

| id | name.ko / en | 난이도 | prereq | 한 줄 | 요구하는 언어 개념 |
|---|---|---|---|---|---|
| `cs/memory-address` | 값이 사는 자리에 번호가 있다 / Memory address | 2 | bit-and-byte | 값 자체가 아니라 값이 놓인 칸의 번호 | `c/pointer` · `cpp/reference` · `rs/borrow` |
| `cs/pointer-indirection` | 값 대신 자리를 들고 다니기 / Indirection | 3 | memory-address | 한 번 더 건너가서 값에 닿는다. 건너갈 곳이 없으면 터진다 | `c/pointer-dereference` · `cpp/smart-pointer` |
| `cs/null-reference` | 가리킬 것이 없는 자리 / Null reference | 2 | value-vs-reference | 「없음」을 **값**으로 두는 설계(Java·C)와 **타입**으로 두는 설계(Swift·Rust)가 갈린다 | `swift/optional` · `java/null` · `rs/option` · `common/absent-value` |
| `cs/aliasing` | 이름 둘이 한 값을 가리키면 / Aliasing | 3 | value-vs-reference | 한쪽에서 고치면 다른 쪽이 바뀐다. **버그의 가장 큰 갈래** | `go/slice-backing` · `py/shallow-copy` · `rs/borrow-exclusive` · `java/collection-share` |
| `cs/immutability` | 안 바꾸고 새로 만들기 / Immutability | 2 | aliasing | aliasing 을 원천에서 없애는 방법 | `common/copy-with-changes` · `common/map-transform` · `rs/let` · `swift/let` |
| `cs/stack-and-heap` | 저절로 치워지는 자리와 아닌 자리 / Stack and heap | 3 | memory-address · call-stack | 함수가 끝나면 사라지는 자리와, 치우라고 해야 사라지는 자리 | `c/malloc` · `cpp/new` · `rs/box` · `go/escape` |
| `cs/integer-overflow` | 자리가 모자라면 도로 돈다 / Integer overflow | 2 | bit-and-byte | 자릿수가 정해져 있어 **가장 큰 값 다음이 가장 작은 값** 이다 | `c/arithmetic` · `java/int` · `rs/arithmetic`(디버그에서 패닉) |
| `cs/floating-point` | 소수는 근사값이다 / Floating point | 2 | binary-representation | 0.1 을 2진수로 정확히 못 적어서 `0.1 + 0.2 != 0.3` 이다 | 전 언어 `arithmetic` |
| `cs/text-encoding` | 글자와 바이트는 다르다 / Text encoding | 2 | bit-and-byte | 「가」는 한 글자지만 UTF-8 로 3바이트다. **길이를 어느 쪽으로 세는지가 언어마다 다르다** | `c/string` · `py/str` · `go/rune` · `swift/character` · `rs/str` |
| `cs/static-vs-dynamic-typing` | 언제 확인하나 / Static or dynamic typing | 2 | type · compile-and-run | 미리 막느냐 돌다가 터지느냐 | `ts/type-annotation` · `py/type-hint` · `java/generics` |
| `cs/complexity` | 입력이 커지면 얼마나 느려지나 / Complexity | 3 | — | 열 개에서 멀쩡하던 것이 만 개에서 멈추는 이유 | `common/iterate` · `common/filter-select` · 중첩 반복 |
| `cs/blocking-and-async` | 기다리는 동안 무엇을 하나 / Blocking and async | 3 | call-stack | 기다림이 스택을 붙잡느냐 놓아 주느냐 | `common/async-await` · `common/promise-chain` · `go/goroutine` |

---

## 5. 심화 — 열하나

| id | name.ko / en | 난이도 | prereq | 한 줄 | 요구하는 언어 개념 |
|---|---|---|---|---|---|
| `cs/garbage-collection` | 안 쓰는 값을 누가 치우나 / Automatic memory management | 3 | stack-and-heap | 세 갈래 — 사람이(C) · 규칙이(Rust·C++ RAII) · 청소부가(Java·Go·C#·Python) | `rs/drop` · `cpp/raii` · `swift/arc` |
| `cs/closure-capture` | 함수가 바깥 값을 데려간다 / Closure capture | 3 | scope-and-lifetime · value-vs-reference | 데려가는 것이 **값이냐 자리냐** 로 언어가 갈린다 | `ts/closure` · `swift/capture-list` · `rs/move-closure` · `go/loop-var` |
| `cs/contiguous-vs-linked` | 붙어 있나 흩어져 있나 / Contiguous or linked | 3 | memory-address | 같은 「목록」이라도 메모리 배치가 다르면 빠른 연산이 다르다 | `common/list` · `cpp/vector` · `java/ArrayList-LinkedList` |
| `cs/hash-table` | 키로 곧장 찾기 / Hash table | 3 | contiguous-vs-linked | 왜 빠른지와, **왜 순회 순서를 약속하지 않는지** | `py/dict` · `java/HashMap` · `go/map` · `csharp/Dictionary` |
| `cs/linking` | 흩어진 조각이 하나로 붙는 자리 / Linking | 3 | compile-and-run | 컴파일은 됐는데 실행이 안 되는 오류가 사는 곳 | `c/header` · `cpp/odr` |
| `cs/memory-layout` | 값이 나란히 놓이는 규칙 / Memory layout | 4 | memory-address | 구조체 크기가 필드 크기의 합보다 큰 이유 | `c/struct` · `cpp/struct` · `rs/repr` |
| `cs/concurrency-vs-parallelism` | 번갈아 하나 동시에 하나 / Concurrency and parallelism | 3 | blocking-and-async | 하나의 일꾼이 번갈아 하는 것과 여럿이 같이 하는 것은 다른 문제다 | `go/goroutine` · `py/gil` · `java/thread` |
| `cs/race-condition` | 순서가 안 정해져 있으면 / Race condition | 4 | aliasing · concurrency-vs-parallelism | 같은 코드가 대개 맞고 가끔 틀리는 자리 | `go/mutex` · `java/synchronized` · `rs/send-sync` |
| `cs/deadlock` | 서로를 기다리며 멈추기 / Deadlock | 4 | race-condition | 아무도 안 터지는데 아무것도 안 도는 상태 | `csharp/task-result` · `go/channel` |
| `cs/invariant` | 언제나 참이어야 하는 것 / Invariant | 3 | state | 「이 값은 절대 음수가 아니다」를 어디서 지키나 | `rs/newtype` · `java/constructor` · `arch/role` |
| `cs/undefined-behavior` | 언어가 답을 약속하지 않는 자리 / Undefined behaviour | 4 | memory-address | 틀린 답이 아니라 **답이 없다.** 최적화가 코드를 지워도 규칙 위반이 아니다 | `c/ub` · `cpp/ub` · `rs/unsafe` |

---

## 6. prereq 그래프와 0장 적재량

선언한 선행으로 깊이를 계산했다(33개 전량).

```
깊이 0 (8)  abstraction · binary-representation · call-stack · compile-and-run
            complexity · error-vs-bug · state · type
깊이 1 (8)  bit-and-byte · blocking-and-async · floating-point · invariant
            linking · scope-and-lifetime · static-vs-dynamic-typing · value-vs-reference
깊이 2 (7)  aliasing · closure-capture · concurrency-vs-parallelism · integer-overflow
            memory-address · null-reference · text-encoding
깊이 3 (7)  contiguous-vs-linked · immutability · memory-layout · pointer-indirection
            race-condition · stack-and-heap · undefined-behavior
깊이 4 (3)  deadlock · garbage-collection · hash-table
```

**깊이 ≤ 2 에 23/33.** TS 21/24 · 파이썬 19/24 와 같은 띠다(D152).

### 계산이 잡아낸 것 — 깊이와 단계는 다른 축이다

세어 보니 §3~§5 의 3단 배치와 그래프 깊이가 **네 곳에서 어긋났다.** 셋은 어긋난 채로 두고 하나는 고쳤다.

| 개념 | 단계 | 깊이 | 판정 |
|---|---|---|---|
| `null-reference` | 중심 | ~~4~~ → 2 | **선행이 틀렸다. 고쳤다** — 아래 |
| `complexity` | 중심 | 0 | 그대로 — `cs/` 안에 선행이 없을 뿐, 진짜 선행은 `common/iterate` 다 |
| `linking` | 심화 | 1 | 그대로 — 구조상 `compile-and-run` 바로 다음이지만, **파일이 여러 장이 되기 전에는 만날 일이 없다** |
| `invariant` | 심화 | 1 | 그대로 — `state` 바로 다음이지만 지킬 것이 생겨야 배운다 |

`null-reference` 의 선행을 `pointer-indirection` 으로 걸어 뒀던 것은 **C 를 먼저 생각한 배치**다.
Java·Swift·Python 사용자는 주소가 무엇인지 한 번도 모른 채 `null` 을 만나고, 실제로 그렇게 만난다.
`value-vs-reference` 로 고치면 깊이가 4에서 2로 내려오고 아홉 언어에서 같은 자리에 선다.
**남은 셋은 「깊이는 이해의 선행이고 단계는 만날 시점」이라 갈리는 것**이라 고치지 않는다 —
D148 이 Exercism 의 `prerequisites` 를 안 가져온 것과 같은 구분이다.

`complexity` 와 `linking` 은 `cs/` **밖으로** 선행이 나간다(`common/iterate` · `arch/placement`).
**이 간선은 이미 성립한다** — `react/functional-state-update` 가 `prereq: [ts/arrow-function, ts/object-spread]`
로 벌써 넘고 있고, 린트는 `dict.sources.has(ref)` 로 **존재만** 본다(`lint.ts:92`).
`prereq-graph.ts:16` 도 `known.has(p)` 로 문자열 id 만 쓴다. 네임스페이스 제약이 코드 어디에도 없다.

그러면 `cs/complexity` 의 선행에 `common/iterate` 를 걸 수 있고, 걸면 깊이가 0에서 밀려 내려간다.
**§6 의 23은 `cs/` 안에서만 센 값이라 상한이다** — 밖으로 거는 간선을 다 채우면 줄어든다.
`lint.ts:207` 의 `prereq-cycle` 검사가 네임스페이스를 넘는 순환도 잡으므로 안전하다.

### 0장은 지금 구조로는 `cs/` 를 아예 못 받는다

`zeroChapterPlates` 를 읽고 나서 이 절을 다시 썼다. 두 문이 닫혀 있다.

**① 입력이 `_lang.yaml` 의 `essential` 이다** (`zero-chapter.ts:69·96`).
`cs/` 는 `common/`·`arch/`·`exec/` 와 마찬가지로 `_lang.yaml` 이 없다(`load.ts:82`). 목록에 못 든다.

**② 사용처가 없으면 그냥 빠진다** (`zero-chapter.ts:99`) —

```ts
const best = input.bestSiteOf(conceptId);
// 리포에 사용처가 없다 — 예고할 자리가 없으므로 0장에 넣지 않는다 (D137).
if (best === null) return [];
const synthetic = best.unknown > MAX_UNKNOWN_FOR_NEW;
```

**`synthetic` 은 「사용처 없이 지어낸다」가 아니다.** 사용처는 **있는데** 미지가 너무 많아
풀리는 판 대신 **예고**(`previewSiteId`)로 돌린다는 뜻이다. 사용처 0인 개념에 합성 판은 없다.
D137 의 「예고할 자리가 없으면 만들지 않는다」가 그대로 서 있다.

그래서 §2 의 사용처 빌리기가 **0장의 전제조건**이다. 빌리기가 서면 `cs/` 개념도 `best` 를 갖게 되고
두 문 중 ②가 열린다. ①은 별도로 정해야 한다 — `zeroChapterPlates` 의 입력을 「그 언어 essential
**+ 그것들이 `prereq` 로 가리키는 `cs/`**」로 넓히는 것이 가장 작은 변경이다.

**그때 넣을 넷**: `cs/state` · `cs/call-stack` · `cs/compile-and-run` · `cs/error-vs-bug`.
근거는 §3 끝과 같다 — 이 넷이 **자기 코드가 왜 안 도는지 스스로 좁히는 어휘**이고,
비트·주소 계열 여섯은 그것을 요구하는 언어 개념이 나타난 뒤에 빌린 창으로 뜨면 된다.
비트를 아는 것보다 「정의는 실행이 아니다」(`exec/order`)를 아는 것이 먼저다.

> **미해결.** 상한이 24판인데 `cs/` 깊이 ≤ 2 만 23이다. D147 이 상한을 8→24 로 올린 근거가
> 「깊이 2 에서 TS 후보가 24 언저리라 자르는 규칙이 거의 일하지 않는다」였는데, `cs/` 를 더하면
> 그 전제가 깨지고 넷째 키(id 알파벳순)가 실제로 돌기 시작한다. **재는 것이 다음 일이다.**

## 7. 린트·스키마에 필요한 변경

| 자리 | 지금 | 바꿀 것 |
|---|---|---|
| `packages/dictionary/src/dict.test.ts:59` | `COMPUTED = ['common/', 'arch/', 'exec/']` | `'cs/'` 를 더해 넷으로 |
| `packages/dictionary/src/lint.ts:139` | 주석이 「보편·구조 개념(`common/`·`arch/`)」 | `cs/` 포함으로 고치고 규칙도 같이 |
| `packages/dictionary/src/load.ts:82` | 「`_lang.yaml` 이 없는 네임스페이스(`common/`·`arch/`)」 | 같음 |
| `dictionary/schema/concept.schema.json` | — | 변경 없음. `queries: []` · `universal: null` 이 이미 허용된다 |

플랜 `chickadee-v06-learning-order` §A `{#a-lint}` 가 이미 세어 둔 자리다 —
「보편 개념은 쿼리가 없다」가 접두어를 하드코딩한다는 지적이 여기서 현금화된다.
**접두어 목록을 상수 하나로 모으는 것**이 네 번째 추가에서 할 일이다. 세 번은 참았지만 넷은 아니다.

---

## 8. 언어 사전이 여기로 거는 간선

`cs/` 는 스스로 뜨지 않는다. 언어 사전이 `prereq` 로 가리켜야 산다.
아래는 열 편 조사(`docs/curriculum/<ns>.md`)가 확정할 간선의 **초안**이다.

| `cs/` 개념 | 이 개념을 요구하는 언어가 | 없는 언어 |
|---|---|---|
| `memory-address` · `pointer-indirection` · `memory-layout` · `undefined-behavior` | C · C++ · Rust | Python · Java · C# · Go · Swift · SQL · TS |
| `stack-and-heap` · `garbage-collection` | C · C++ · Rust · Java · C# · Go · Swift | SQL |
| `value-vs-reference` · `aliasing` | **전부** (SQL 제외) | SQL |
| `null-reference` | Java · C# · C · C++ · Go · Swift · TS · Python | Rust(타입으로 없앴다) · SQL(삼치 논리로 다르다) |
| `integer-overflow` | C · C++ · Rust · Java · C# · Go | Python(정수가 무한) · TS(부동소수뿐) · SQL |
| `text-encoding` | 전부 — **다만 언어마다 「길이」의 뜻이 다르다** | — |
| `blocking-and-async` · `concurrency-vs-parallelism` | Python · TS · C# · Go · Rust · Java · Swift | C · SQL |
| `complexity` · `hash-table` · `contiguous-vs-linked` | 전부 | — |

`value-vs-reference` 가 **아홉 언어에 걸린다** — 이 하나가 D4 전이의 최대 수혜다.
언어별로 뒀다면 같은 기계를 아홉 번 배웠을 것이다.

---

## 9. 아직 못 정한 것

1. **`cs/` 개념의 문항 형태.** `exec/order` 는 T0 지목형을 AST 계산으로 만들었다(`t0-exec.ts`).
   `cs/floating-point` 에는 짚을 노드가 없다 — `meaning`(뜻 고르기)과 `why_gate` 만으로 카드가 서는지,
   아니면 새 문항 종류가 필요한지 정해야 한다. **새 `card.kind` 를 안 만든다는 D151·D154 선을 지킬 수 있는지가 관건.**
2. **빌린 창의 겹 귀속.** `cs/memory-address` 를 `c/pointer-dereference` 의 창에서 풀었을 때 겹이 어디에 쌓이나.
   D4 는 「겹은 **언어 개념 id** 에 쌓는다」고 못 박았는데 `cs/` 는 언어 개념이 아니다.
3. **0장 배분**(§6 의 미해결). 재기 전에는 넷이 추정이다.
4. **열 편 조사의 §7 합류.** 이 문서의 33개는 언어 열 편이 밀어낼 것을 받기 전의 초안이다.
   합류 뒤 개수와 이름이 바뀐다.

---

## 10. 열 편에서 합류한 것

§3~§5 의 33개는 언어 열 편을 받기 전의 초안이었다. 열 편이 각자 §7 에서 「이건 문법이 아니라 기계다」로
밀어낸 것을 여기서 받는다.

### 10.1 같은 개념에 여덟 가지 이름이 붙었다 — 이것이 D157 의 사후 증명이다

열 세션은 서로를 안 보고 돌았다. 그런데 **같은 기계를 다 지목했고, 이름만 제각각이었다.**

| 무엇 | 세션들이 붙인 이름 | 정본 |
|---|---|---|
| 값이 복사되나 자리가 복사되나 | `reference-vs-value`(py) · `value-vs-reference`(ts·rs) · `value-and-reference`(c·java·go·swift) · `value-and-boxing`(csharp) | **`cs/value-vs-reference`** |
| 글자와 바이트 | `text-encoding`(py·ts·csharp·rs·go·sql) · `character-encoding`(c·cpp·java) · `unicode-text`(swift) | **`cs/text-encoding`** |
| 소수는 근사값 | `floating-point`(ts·c·java·csharp·rs·go·swift) · `float-representation`(py) | **`cs/floating-point`** |
| 자릿수가 정해져 있다 | `integer-representation`(py·c·csharp) · `integer-width`(java·go) · `integer-overflow`(rs·swift) · `signed-unsigned`(c) | **`cs/integer-overflow`** (표현은 `cs/bit-and-byte` 가 덮는다) |
| 번역하는 때와 도는 때 | `compile-and-run`(ts·rs·swift) · `compile-time-and-run-time`(java) · `compile-time-and-runtime`(csharp) · `compile-and-link`(c·go) | **`cs/compile-and-run`** + **`cs/linking`** |
| 이름이 보이는 범위 | `scope-and-lifetime`(ts·rs) · `name-scope`(py) · `lifetime`(c) | **`cs/scope-and-lifetime`** |
| 안 쓰는 값을 누가 치우나 | `garbage-collection`(java·rs) · `gc-and-lifetime`(csharp) · `reference-counting`(swift) | **`cs/garbage-collection`** |
| 키로 곧장 찾기 | `hash-table`(ts) · `hashing`(java) · `hashing-unordered`(go) | **`cs/hash-table`** |
| 커지면 얼마나 느려지나 | `complexity`(ts·sql) · `complexity-order`(py) | **`cs/complexity`** |
| 동시에 도는 것 | `concurrency-model`(py·csharp·swift·go) · `blocking-and-async`+`task-queue`(ts) · `data-race`(go) · `race-condition`(rs·sql) | **`cs/concurrency-vs-parallelism`** · **`cs/blocking-and-async`** · **`cs/race-condition`** |

**이름이 안 갈린 축은 `stack-and-heap` 하나뿐이다** — 여섯 세션이 똑같이 적었다.

D157 의 근거가 「언어별로 두면 같은 개념을 열 번 배운다」였는데, 열 세션이 **실제로 열 번 이름을 지었다.**
사전을 언어별로 뒀다면 사용자는 「값과 참조」를 여덟 개의 다른 이름으로 여덟 번 만났을 것이고,
`universal_id` 가 안 걸려 겹도 여덟 번 따로 쌓였을 것이다.

### 10.2 더하는 열

| id | name.ko / en | 단계 | 선행 | 밀어낸 편 | 한 줄 |
|---|---|---|---|---|---|
| `cs/identity-vs-equality` | 같은 것인가 같은 값인가 / Identity and equality | 중심 | value-vs-reference | py · csharp | 파이썬 `is` 대 `==`, Java `Integer` 캐시(−128~127), C# 참조 대 내용 — **답이 언어마다 뒤집힌다** |
| `cs/eager-vs-lazy` | 지금 계산하나 물을 때 계산하나 / Eager and lazy | 중심 | complexity | py · java · csharp · sql | 제너레이터 · LINQ · 스트림 · SQL 커서가 같은 기계다. 「돌려받은 것이 값인가 약속인가」 |
| `cs/dynamic-dispatch` | 어느 몸통이 불릴지 언제 정해지나 / Static and dynamic dispatch | 심화 | abstraction · type | java · csharp · go · rs | 컴파일 때 정하면 빠르고, 돌 때 정하면 갈아 끼울 수 있다. vtable · 트레이트 객체 · 인터페이스가 한 기계다 |
| `cs/erasure-and-reification` | 타입이 실행까지 남나 지워지나 / Erasure and reification | 심화 | static-vs-dynamic-typing | csharp · java | Java 제네릭은 지워지고 C# 은 남는다. **`common/generics` 로 묶으면 D4 전이가 틀린 모형을 물려준다** |
| `cs/set-vs-sequence` | 순서가 있나 없나 / Set and sequence | 중심 | — | sql | SQL 이 `ORDER BY` 없이는 순서를 약속하지 않는 이유. 해시맵 순회 순서도 같은 자리 |
| `cs/three-valued-logic` | 참·거짓·모름 / Three-valued logic | 중심 | boolean(common) · null-reference | sql | `NULL = NULL` 이 참도 거짓도 아니다. 「모름」이 값에 섞이면 논리가 셋이 된다 |
| `cs/declarative-vs-imperative` | 무엇을 말하나 어떻게를 말하나 / Declarative and imperative | 기초 | — | sql | SQL · CSS · React 가 같은 편이다. 「순서를 내가 쓰지 않는다」가 무슨 뜻인지 |
| `cs/cardinality` | 하나가 여럿과 만나면 몇 줄인가 / Cardinality | 심화 | set-vs-sequence | sql | `JOIN` 이 행을 늘리는 이유. 1:N 을 모르면 결과 줄 수가 마술로 보인다 |
| `cs/transaction-isolation` | 도중에 남이 보면 무엇이 보이나 / Transaction isolation | 심화 | race-condition | sql | 경쟁 조건의 데이터베이스판. 「전부 되거나 전부 안 되거나」 |
| `cs/bounds` | 끝을 넘어 읽으면 / Bounds | 중심 | contiguous-vs-linked · memory-address | c | 경계를 언어가 검사하는지 안 하는지. 검사 안 하면 남의 값이 읽히고 그것이 조용하다 |

**총 43개** (기초 11 · 중심 18 · 심화 14).

### 10.3 안 받은 것과 그 이유

| 제안 | 밀어낸 편 | 판정 |
|---|---|---|
| `cs/null-terminated-string` | c | **`c/` 에 둔다.** 널 종단은 C 의 선택이지 기계의 성질이 아니다 — 다른 아홉이 길이를 따로 든다 |
| `cs/preprocessing` | c | **`c/` 에 둔다.** 전처리기를 가진 것이 C·C++ 둘뿐이라 보편이 아니다 |
| `cs/alignment-and-padding` | c | `cs/memory-layout` 과 같다. 이름을 `memory-layout` 으로 둔다 |
| `cs/spec-and-undefined` | c | `cs/undefined-behavior` 와 같다 |
| `cs/static-types` | swift | `cs/static-vs-dynamic-typing` 과 같다 |
| `cs/search-tree` | sql | **보류.** 인덱스의 자료구조는 `cs/tree` 인데 초안에서 이미 뺐다. `cs/complexity` 가 「인덱스가 왜 빠른가」를 답하는지 재고 정한다 |
| `cs/static-vs-dynamic-dispatch` | rs | `cs/dynamic-dispatch` 로 받았다(둘을 한 개념의 두 끝으로 본다) |
| `cs/contiguous-array` | go | `cs/contiguous-vs-linked` 와 같다 |

### 10.4 SQL 이 가장 적게 물려받고 가장 많이 보탠다

SQL 의 `common/` 재사용은 **10/30(33%)** 으로 열 중 최저다(최고는 C# 27/30). 문법 층에서는 거의
아무것도 못 물려받는다 — 변수·반복·함수·조건이 통째로 안 맞는 선언형 언어라서다.

그런데 `cs/` 로 밀어낸 것은 여섯(`set-vs-sequence` · `three-valued-logic` · `declarative-vs-imperative` ·
`cardinality` · `transaction-isolation` · `search-tree`)으로 열 중 최다다.
**전이가 문법 층에서 끊긴 자리가 기계 층에서는 오히려 두껍다** — 이것이 `cs/` 층을 판 값을 가장 잘 보여 준다.
