# 커리큘럼 조사 — JavaScript / TypeScript (`ts`)

`ts` 는 **이미 36개가 서 있다**(`essential` 30 + 표기 짝 6). 그래서 이 문서는 목록을 새로 만들지 않고,
선 것을 재검토하고 지금 없는 축을 더한다. 조사일 2026-09-04.

---

## 1. 언어 좌표

TIOBE 2026-08 에서 **JavaScript 6위 · 2.63%**, **TypeScript 44위 · 0.37%**. TIOBE 는 검색 신호를 세므로
TS 를 실사용보다 낮게 잡는다 — State of JS 2025 는 응답자의 **40% 가 TS 만** 쓰고 **6% 만 JS 만** 쓴다고
보고했다. 이 6% 가 §5 판단의 분모다. 만들어지는 것: 웹 프런트(React·Next.js), Node/Bun API, CLI,
Electron·Tauri 앱, 그리고 이 리포 자신.

**바이브 코딩으로 나온 TS 는 이렇게 생겼다** — `export default function Page()` · `interface Props` ·
`type Status = 'idle' | 'loading'` · `useState<T>(…)` · `const res = await fetch(url)` ·
`if (!res.ok) throw new Error(…)` · `items.map((it) => …)` · `{ ...prev, done: true }` · `a?.b ?? fallback` ·
`catch (e) { … }` · `value as SomeType`.

여기서 곧바로 읽히는 것 하나. **`interface`·`type X =`·`: string`·`throw`·`{ }` 객체 리터럴·`import` 를
가리키는 개념이 사전에 하나도 없다.** 위 목록에서 사전이 짚을 수 있는 것은 `map`·spread·`?.`·`??`·
`await`·구조분해뿐이다. 사용처는 널렸는데 항목이 없다 — D147 의 「없는 것은 재료가 아니라 재료를
가리키는 사전 항목」이 여기서 한 번 더 열린다.

| 축 | 값 |
|---|---|
| `lang` | `ts` |
| `grammars` | `typescript` · `tsx` · `javascript` |
| 확장자 | `typescript`: `.ts .mts .cts` / `tsx`: `.tsx` / `javascript`: `.js .mjs .cjs .jsx` |
| 프레임워크 | 별도 네임스페이스 `react` (`detect: { dependency: react }`) — 개념 **1장**. 그 위층(프레임워크·진입점·실행 러너)의 계획은 [`docs/plan/js-framework-axis.md`](../plan/js-framework-axis.md) 로 갈라 뒀다 |

---

## 2. 기초 — 바닥 여덟 (이미 선 것의 재검토)

`ts/_lang.yaml` 의 `essential` 은 **30줄**이다. 「D147 의 바닥 개념 여덟」 주석이 첫 줄
(`ts/const-declaration`) **아래**에 있고, 어디까지가 여덟인지는 **주석의 위치로만** 표시돼 있다.
스키마에도 린트에도 「바닥 여덟」이라는 것이 없고 `meta.essential` 은 30 전부를 뜻한다.

같은 필드가 네임스페이스마다 다른 것을 뜻한다 — `ts.essential` 은 30(필수 문법 전량),
`py.essential` 은 8(바닥 여덟 그 자체). 그리고 `essential` 을 읽는 코드가 넷이다: 구멍 지도의 분모
(`gaps.ts:62`) · 0장 후보(`zero-chapter.ts:95`) · T1 대표 개념 자격(`blocks.ts:187`, D27 첫 조건) ·
사전 부채 래칫의 분모(`lint.ts:365·379`). 그러니 `ts` 의 30을 8로 줄이면 구멍 지도가 22개를 잃는다.
**줄이는 것은 답이 아니다.**

### 여덟을 확정한다

주석 아래 여덟 줄이 그 여덟이다. D147 본문이 지목한 것은 「조건문 · 함수 정의와 `return` ·
참·거짓과 비교 · `let` 재대입 · `while`」로 **일곱**이고, 여덟째 `arithmetic` 은 D148 이 가져온
Exercism JS 트랙 깊이 0~3 목록(`arithmetic-operators`)에서 왔다.

| # | id | name.ko / en | token | universal | diff | prereq | 이 언어라서 다른 것 |
|---|---|---|---|---|---|---|---|
| 1 | `ts/reassignment` | 다시 넣기 / Reassignment | `=` | `common/reassignment` | 1 | — | `const` 로 만든 이름에 다시 넣으면 그 자리에서 멈춘다 — 만드는 낱말이 나중 일까지 정한다 |
| 2 | `ts/boolean-literal` | 참·거짓 값 / Boolean literal | `true` | `common/boolean-value` | 1 | — | `if` 가 참·거짓 아닌 값도 받는다. `0`·`''` 이 거짓 자리에 서는 것이 여기서 시작된다 |
| 3 | `ts/comparison` | 견주기 / Comparison | `===` | `common/comparison` | 1 | `boolean-literal` | 견주는 기호가 **둘**이고 답이 갈린다. 파이썬은 조건 안의 `=` 를 막지만 JS 는 통과시킨다 |
| 4 | `ts/arithmetic` | 셈하기 / Arithmetic | `+` | `common/arithmetic` | 1 | — | `+` 하나가 더하기이자 잇기다 — `1 + '1'` 이 멈추지 않고 `'11'` 이 된다 |
| 5 | `ts/if-statement` | if 문 / if statement | `if` | `common/conditional-branch` | 1 | — | 중괄호를 안 쓰면 **다음 한 문장만** 딸려 간다. 들여쓰기는 아무 뜻이 없다 |
| 6 | `ts/while-loop` | while 문 / while loop | `while` | `common/loop-while` | 2 | `comparison` | 조건 자리가 참·거짓이 아니어도 돼서 `while (queue.length)` 가 성립한다 |
| 7 | `ts/function-declaration` | 함수 정의 / Function declaration | `function` | `common/function-definition` | 1 | — | 정의가 **위로 끌어올려진다** — 정의보다 위에서 불러도 된다. `const f = () =>` 는 안 된다 |
| 8 | `ts/return-statement` | 값 돌려주기 / return statement | `return` | `common/return-value` | 1 | `function-declaration` | 안 적으면 `undefined` 가 간다. `return` 뒤에 줄을 바꿔도 세미콜론이 끼어 `undefined` 가 된다 |

**제안.** `_lang.yaml` 에 `foundation:` 필드를 더한다. `essential` 은 지금 뜻 그대로 두고 `foundation`
이 바닥을 가리킨다. 주의할 것 — **TS 의 바닥은 축 여덟에 노드 아홉이다.** `ts/const-declaration` 이
「이름에 값 묶기」 축의 뿌리인데 여덟에 없다. 파이썬은 `py/assignment` 하나로 그 축을 덮지만(D152 ⓐ)
TS 는 만드는 낱말과 옮기는 낱말이 갈려 노드가 둘이다. `foundation` 에 아홉을 적고 「축 여덟」이라고
주석에 남기는 것이 사실에 맞다.

---

## 3. 중심 — 14개

`ts/*` 접두어는 뺐다. `universal` 의 **new** 는 §6 의 신규 제안이다.

| # | id | name.ko / en | token | universal | diff | prereq | 이 언어라서 다른 것 | 없으면 왜 못 읽나 |
|---|---|---|---|---|---|---|---|---|
| 1 | `object-literal` | 이름표 붙은 묶음 만들기 / Object literal | `{ a: 1 }` | **new** `common/record` | 1 | `string-literal` | `{ id }` 가 `{ id: id }` 다 — 키를 안 적어도 된다 | 배열은 있는데 객체를 **만드는** 개념이 없다. AI 코드의 절반이 객체 리터럴이다 |
| 2 | `truthy-falsy` | 참 같은 값 / Truthiness | `if (x)` | **new** `common/truthiness` | 2 | `boolean-literal` · `undefined-null` | 거짓이 되는 값이 **여섯**(`false 0 '' null undefined NaN`)이고 `[]`·`{}` 는 참이다 | `if (!items.length)` 가 왜 되는지, `\|\|` 가 왜 `0` 을 덮어쓰는지가 이 하나로 풀린다 |
| 3 | `loose-equality` | 느슨한 같음 / Loose equality | `==` | `null` | 2 | `comparison` | 타입이 다르면 한쪽을 바꿔 견준다. `null == undefined` 는 참, `===` 로는 거짓 | AI 가 한 파일에서 `==`·`===` 를 섞는다. 다르다는 걸 모르면 그 파일을 못 읽는다 |
| 4 | `reference-sharing` | 같은 것을 둘이 가리킴 / Shared reference | `b = a` | **new** `common/reference-sharing` | 3 | `object-literal` · `const-declaration` | `const` 는 **이름**만 묶는다. `const o = {}` 여도 `o.a = 1` 이 된다 | 「복사했는데 원본이 바뀌었다」의 유일한 설명. 지금은 오개념 한 줄로만 있다 |
| 5 | `closure` | 바깥 값을 데려가는 함수 / Closure | `() => count` | **new** `common/closure` | 3 | `arrow-function` · `reassignment` | 데려가는 것이 값이 아니라 **자리**다 — 자리가 바뀌면 함수가 보는 값도 바뀐다 | `useState` setter 가 옛 값을 보는 일, `setTimeout` 안의 변수, 이벤트 핸들러가 전부 이것이다 |
| 6 | `import-export` | 파일 사이로 이름 옮기기 / import and export | `import` | **new** `common/module-import` | 2 | `const-declaration` | `import` 와 `require` 가 섞이고, 어느 쪽으로 읽힐지는 확장자와 `package.json` 의 `"type"` 이 정한다 | AI 앱은 파일 여럿이다. 「이 이름이 어디서 왔나」에 답할 개념이 없다 |
| 7 | `throw-error` | 터뜨리기 / throw | `throw` | **new** `common/raise-error` | 2 | `call-expression` | 아무 값이나 던질 수 있어 `catch (e)` 의 `e` 가 `Error` 라는 보장이 없다 — TS 가 `unknown` 을 주는 이유 | `try/catch` 는 **받는 쪽만** 있다. `if (!res.ok) throw new Error(…)` 가 AI 코드의 기본형이다 |
| 8 | `callback-argument` | 나중에 부를 함수 넘기기 / Passing a callback | `f(cb)` | `common/function-value` | 2 | `arrow-function` · `call-expression` | 넘긴 함수가 **지금 안 불린다.** 괄호를 붙이면 결과가, 안 붙이면 함수가 넘어간다 | `map`·`setTimeout`·`addEventListener`·`useEffect` 가 같은 모양이고 `await` 의 앞자리다 |
| 9 | `array-reduce` | 접어서 하나로 / reduce | `reduce` | **new** `common/fold-reduce` | 3 | `arrow-function` · `array-basics` | 인자가 둘(누적값·항목)이고 초깃값을 안 주면 **첫 항목이 누적값**이 된다 | AI 가 합계·그룹핑을 전부 `reduce` 로 짠다. `map`·`filter` 는 있는데 이것만 없다 |
| 10 | `class-declaration` | class / class declaration | `class` | **new** `common/class-definition` | 3 | `function-declaration` · `object-literal` | 문법 설탕이라 뒤에서 프로토타입으로 돈다. 끌어올려져도 **쓰기 전에 부르면 멈춘다** | Node 서버·에러 서브클래스가 전부 `class` 다. 프런트만 보면 안 보인다 |
| 11 | `type-annotation` | 타입 적기 / Type annotation | `: string` | **new** `common/type-annotation` | 1 | `const-declaration` | 이름 **뒤에** 붙고 컴파일하면 사라진다. 문법 `typescript`·`tsx` 에만 있다 | TS 파일 모든 줄에 있는데 없다. 지금 타입을 다루는 유일한 개념이 `generics`(난이도 4)다 |
| 12 | `interface-type` | 모양에 이름 붙이기 / interface and type alias | `interface` | **new** `common/named-shape` | 2 | `type-annotation` · `object-literal` | 같은 일을 하는 낱말이 둘이고 `interface` 만 나중에 다시 열어 덧붙일 수 있다 | AI 는 컴포넌트마다 `interface Props` 를 낸다. 값이 아니라 모양인 줄 모르면 파일 위쪽이 안 읽힌다 |
| 13 | `union-type` | 여럿 중 하나 / Union type | `\|` | **new** `common/union-type` | 2 | `type-annotation` | 값 자체가 타입이 된다 — `'idle' \| 'loading'` 은 그 두 문자열만 허용한다 | 상태 기계·API 응답이 전부 유니온으로 온다. 다음 항목의 전제다 |
| 14 | `narrowing` | 타입 좁히기 / Narrowing | `typeof` · `in` | **new** `common/type-narrowing` | 3 | `union-type` · `if-statement` | `if` 한 줄이 **아래에서 할 수 있는 일**을 바꾼다. 조건이 흐름만이 아니라 타입도 가른다 | 「위에선 빨간 줄이 있었는데 `if` 안에선 없다」가 TS 초심자의 첫 질문이다 |

### 새 `alternatives:` 짝 다섯

기존 다섯에 더한다. 조건은 「같은 일을 하는 다른 표기를 쿼리로 셀 수 있을 것」이다.

| gap(구멍) | present(리포에 있는 다른 표기) | 이 짝이 여는 「왜」 |
|---|---|---|
| `ts/comparison` | `ts/loose-equality` | `===` 와 `==` 를 섞었다 — 어느 줄에서 답이 갈리나 |
| `ts/narrowing` | `ts/type-assertion` | 좁히는 대신 `as` 로 눌렀다 — 검사를 끈 자리가 몇 곳인가 |
| `ts/array-reduce` | `ts/for-of` | 같은 합계를 한쪽은 접고 한쪽은 쌓는다 |
| `ts/import-export` | **new** `ts/require-call` | ESM 과 CJS 가 한 리포에 섞였다 |
| `ts/template-literal` | **new** `ts/string-concat` | `+` 로 잇기와 백틱이 같은 파일에 있다 |

표기 개념 둘(`ts/require-call` · `ts/string-concat`)이 더 필요하다. `promise-then`·`logical-or-default`
처럼 `essential: false` 로 둔다 — 분모가 아니라 **부기**다.

---

## 4. 심화 — 9개

| # | id | name.ko / en | token | universal | diff | prereq | 이 언어라서 다른 것 |
|---|---|---|---|---|---|---|---|
| 1 | `number-is-double` | 숫자가 한 종류뿐 / One number type | `0.1 + 0.2` | `null` | 3 | `arithmetic` · `number-literal` | 정수 타입이 **없다.** `1` 도 `1.5` 도 같은 64비트 부동소수라 `0.1 + 0.2 !== 0.3` 이고 큰 정수가 조용히 어긋난다 |
| 2 | `type-erasure` | 타입은 돌기 전에 사라진다 / Type erasure | `tsc` | `null` | 2 | `type-annotation` | 실행 중에는 타입이 **없다.** API 응답이 `interface` 와 달라도 아무도 안 막는다 |
| 3 | `type-assertion` | `as` 는 검사를 끄는 것 / Type assertion | `as` | `null` | 3 | `type-annotation` · `type-erasure` | 변환이 아니다. 값은 그대로 두고 **컴파일러 입만 막는다** |
| 4 | `prototype-chain` | class 뒤의 사슬 / Prototype chain | `prototype` | `null` | 3 | `class-declaration` · `property-access` | 속성을 못 찾으면 **위로 한 칸 올라가** 다시 찾는다. `class` 는 이 사슬을 짓는 설탕이다 |
| 5 | `structural-typing` | 이름 말고 모양이 맞으면 / Structural typing | — | `null`(§6) | 4 | `interface-type` | 두 `interface` 가 이름이 달라도 모양이 같으면 대입된다. Java·C# 을 알던 사람이 가장 크게 헷갈린다 |
| 6 | `generic-constraint` | 타입 자리에 조건 걸기 / Generic constraint | `T extends` | `common/generics` | 4 | `generics` · `interface-type` | `extends` 가 상속이 아니라 **「적어도 이 모양은 되어야 한다」**다. 같은 낱말이 `class` 에서는 상속이다 |
| 7 | `any-unknown` | `any` 와 `unknown` / any and unknown | `unknown` | `null` | 4 | `type-annotation` · `narrowing` | 둘 다 「모른다」인데 `any` 는 검사를 끄고 전염되며 `unknown` 은 **좁히기를 강제한다** |
| 8 | `this-binding` | `this` 가 가리키는 것 / this binding | `this` | `null` | 4 | `class-declaration` · `callback-argument` | 정의한 자리가 아니라 **부른 자리**가 정한다. `cb = obj.m; cb()` 의 `this` 는 `obj` 가 아니다 |
| 9 | `await-resume` | `await` 다음 줄은 언제 도나 / When await resumes | `await` | `null` | 4 | `async-await` · `callback-argument` | 함수가 그 줄에서 **접히고** 나머지는 마이크로태스크 대기줄로 간다 — `setTimeout(…, 0)` 보다 먼저 온다 |

앞의 넷은 **버그를 설명**하고(부동소수·타입 소거·`as`·프로토타입) 뒤의 다섯은 **설계를 설명**한다.

---

## 5. prereq 그래프와 0장 적재량

`prereqDepth` 는 후보 집합 **안에서만** 선행을 세므로 집합이 커지면 깊이가 달라진다. 세 경우를 돌렸다.

| 집합 | 개수 | 깊이 0/1/2/3/4/5 | 깊이 ≤ 2 |
|---|---|---|---|
| 지금 `ts.essential` | 30 | 9 / 6 / 6 / 5 / 3 / 1 | **21** |
| + 중심 14 | 44 | 9 / 10 / 11 / 7 / 6 / 1 | **30** |
| + 심화 9 | 53 | 9 / 11 / 12 / 10 / 8 / 3 | **32** |

`ZERO_CHAPTER_MAX` 는 24다. 지금 21/24 는 「자르는 규칙이 거의 일하지 않는」 자리이고
(`zero-chapter.ts` 주석이 그 근거로 이 값을 골랐다), 중심 14를 전부 `essential` 에 넣으면 **30/24** 가
되어 여섯 장이 잘린다. 자르는 순서는 ① 사용처 있는 것 ② 깊이 ③ 미지 ④ id 인데, ④가 실제로 도는
순간 「무엇을 자를까」가 임의가 된다 — D147 이 피하려던 상태다.

사이클은 없다. `narrowing ← union-type ← type-annotation` 과 `any-unknown ← narrowing` 은 이었고
`narrowing ← any-unknown` 은 **긋지 않았다** — `unknown` 을 몰라도 `typeof` 좁히기는 읽을 수 있다.

**제안 — `essential` 은 30 → 37.** 중심 14 중 일곱만 올린다: `object-literal` · `truthy-falsy` ·
`import-export` · `reference-sharing` · `closure` · `throw-error` · `callback-argument`. 깊이 ≤ 2 후보가
**25/24** 로 지금 띠(21/24)에 가깝게 남는다. 나머지 일곱과 심화 아홉은 `essential: false` 다 —
사용처가 있으면 카드는 그대로 구워지고 큐에도 들어간다. `essential` 이 정하는 것은 §2 에 적은 넷뿐이다.

### 가장 중요한 판단 — `ts` 가 문법 셋을 안고 있는 문제

타입 개념 아홉은 `typescript`·`tsx` 에만 있다. **코드를 읽고 확인한 것 — 순수 `.js` 리포에서 타입
개념은 새지 않는다.**

| 자리 | 무엇이 막나 |
|---|---|
| 쿼리 실행 | `concept.grammars` 에 `javascript` 가 없으면 `.js` 에 쿼리가 안 돈다 (`load.ts:173` 이 `(concept, grammar)` 키로 등록) |
| 구멍 지도 | `gaps.ts:65` — `if (sites.length === 0) continue;` 로 **행 자체가 안 생긴다** |
| 0장 | `zero-chapter.ts:100` — `if (best === null) return [];` 로 **합성 판도 안 만들어진다**(D137) |

브리프의 전제(「0장 합성 후보에는 들어간다」)는 지금 코드에서 **성립하지 않는다.** 사용처 0 인 개념은
합성 판도 못 되고 조용히 빠진다. `ts/generics` 가 이미 `grammars: [typescript, tsx]` 로 그렇게 서 있다.

**그래서 네임스페이스를 쪼개지 않는다.** 근거 셋:

1. **간선이 경계를 계속 넘는다.** `narrowing` 의 선행이 `if-statement`(JS)이고, `type-erasure` 를
   설명하려면 `throw-error`(JS)의 `catch (e: unknown)` 이 필요하다. `alternatives` 짝
   `narrowing ↔ type-assertion` 도 마찬가지다. 쪼개면 `prereq` 가 네임스페이스를 가로지르는데
   `prereqDepth` 는 한 집합 안에서만 센다.
2. **`detect` 로는 못 가른다.** 지금 감지 신호는 `{ dependency: … }` 하나뿐이다(`schema.ts:236`).
   `typescript` 를 devDependency 로 안 두는 `.ts` 리포(Deno·Bun)가 있어 의존성으로 가르면 틀린다.
   확장자로 가르려면 스키마를 늘려야 하는데, 그 대가로 얻는 것이 위 표에 이미 있다.
3. **JS 만 쓰는 사용자가 6% 다.** 소수를 위해 축을 하나 더 여는 것보다 그 6% 에게 타입 개념이
   **안 보이는지**를 테스트로 못박는 편이 싸다.

**대신 할 것 둘.** ① 타입 개념 아홉을 `essential` 에 넣지 않는다 — `essential` 은 「이 언어 리포라면
어디나 있는 것」이어야 구멍 지도의 분모가 거짓말을 안 한다. ② `.js` 만 있는 픽스처로 인제스트해
`ts/type-*` 의 사용처가 0이고 구멍 지도에 안 뜨는지 확인하는 회귀 시험. 지금 이 성질은 `grammars` 를
손으로 맞춰 둔 덕에 **우연히** 성립한다.

---

## 6. `common/` 재사용 대 신규

`ts` 36개 중 **35개(97%)**가 `universal` 을 갖고 `common/` 30개를 **전부** 쓴다. 안 쓰이는 `common/` 은
없다. 이 수치는 파이썬의 21/30 과 뜻이 다르다 — `common/` 이 `ts` 에서 뽑혀 나왔기 때문에 100% 이고,
TS 가 **남에게서 물려받은 것은 0개**다. `universal: null` 은 `ts/index-access-pair` 하나뿐이다.
여럿에 걸린 `common/` 은 다섯이다: `destructuring`(배열·객체) · `iterate`(`forEach`·`for…of`) ·
`map-transform`(`map`·체인) · `nullish-default`(`??`·`||`) · `optional-chaining`(`?.`·`&&`).

### 신규 제안 11개 — 마지막 열이 「다른 언어 최소 둘에서도 성립하는가」다

| 새 `common/` id | name.ko / en | diff | `ts` 쪽 | 근거 |
|---|---|---|---|---|
| `record` | 이름표 붙은 묶음 / Keyed record | 1 | `object-literal` | py `dict` · go `map`/`struct` · rust `struct` · swift `Dictionary` |
| `truthiness` | 참 같은 값 / Truthiness | 2 | `truthy-falsy` | py(`if []`) · dart · lua. **rust·go 에는 없다** |
| `reference-sharing` | 같은 것을 둘이 가리킴 / Shared reference | 3 | `reference-sharing` | py 리스트 별칭 · go 슬라이스 backing · swift class vs struct |
| `closure` | 바깥 값을 데려가는 함수 / Closure | 3 | `closure` | py · rust(`move`) · swift(capture list) · go(반복 변수) |
| `module-import` | 파일 사이로 이름 옮기기 / Module import | 2 | `import-export` | py `import` · go `import` · rust `use` |
| `raise-error` | 터뜨리기 / Raising an error | 2 | `throw-error` | py `raise` · swift `throw` · dart `throw`. rust 는 `Result` 라 축이 다르다 |
| `fold-reduce` | 접어서 하나로 / Fold | 3 | `array-reduce` | py `functools.reduce` · rust `fold` · swift `reduce` |
| `class-definition` | 틀 정의하기 / Class definition | 3 | `class-declaration` | py · swift · dart · java |
| `type-annotation` | 값에 타입 적기 / Type annotation | 1 | `type-annotation` | py `x: int` · rust `let x: i32` · go `var x int` |
| `union-type` | 여럿 중 하나 / Union type | 2 | `union-type` | py `int \| str` · rust `enum` · swift `enum` |
| `type-narrowing` | 타입 좁히기 / Narrowing | 3 | `narrowing` | py `isinstance` 좁히기 · rust `match` · swift `if let` |

**보류 둘.** `common/named-shape`(`interface`/`type`)는 py `TypedDict`·rust `struct`·go `type` 이 있지만
`common/record` 와 겹치는 폭이 커서 `record` 만 먼저 낸다. `common/structural-typing` 은 성립하는 언어가
**`ts` 와 `go` 둘뿐**이라 「최소 2개」를 간신히 넘는다 — Go 사전을 쓸 때까지 `universal: null` 로 둔다.

**`universal: null` 로 둘 것 (8개).** `loose-equality`(`==` 강제 변환은 JS 고유) ·
`number-is-double`(정수 타입 없는 언어가 우리 목록에 없다) · `type-erasure` · `type-assertion` ·
`any-unknown` · `prototype-chain` · `this-binding`(파이썬 `self` 는 명시라 전이하면 왜곡된다) ·
`await-resume`(마이크로태스크 대기줄은 JS 실행 모델의 것).

---

## 7. `cs/` 로 밀어낼 것

`docs/curriculum/cs.md` 가 같은 날 별도로 서 있고, 거기 `cs/scope-and-lifetime` 과 `cs/compile-and-run`
의 소비자로 **`ts/closure` 와 `ts/type-annotation` 이 이미 적혀 있다** — 둘 다 아직 존재하지 않는
개념이고, 이 문서 §3 이 그 둘을 제안한 것과 독립적으로 겹쳤다. 간선은 **`ts/*` → `cs/*`** 방향이다.

| `cs/` id (cs.md 에 이미 있음) | 이 개념을 요구하는 `ts` 개념 |
|---|---|
| `cs/floating-point` | `number-is-double` · `arithmetic` |
| `cs/value-vs-reference` · `cs/aliasing` | `reference-sharing` · `object-spread` |
| `cs/closure-capture` · `cs/scope-and-lifetime` | `closure` · `this-binding` |
| `cs/compile-and-run` · `cs/static-vs-dynamic-typing` | `type-annotation` · `type-erasure` · `any-unknown` |
| `cs/call-stack` | `return-statement` · `throw-error` · `this-binding` |
| `cs/blocking-and-async` | `async-await` · `await-resume` · `callback-argument` |
| `cs/text-encoding` | `string-literal` — `'👍'.length` 가 2다 (UTF-16 코드 유닛) |
| `cs/hash-table` | `object-literal` — 키 순회 순서를 왜 약속 안 하나 |
| `cs/complexity` | `array-method-chain` · `array-reduce` |

**cs.md 에 없는데 필요한 것 하나** — `cs/task-queue`: 「지금 도는 일이 끝난 뒤 무엇을 먼저 꺼내나 —
대기줄이 하나가 아니다」. 선행 `cs/blocking-and-async`, 요구하는 쪽 `await-resume`·`callback-argument`.
`blocking-and-async`(기다림이 스택을 붙잡나 놓나)만으로는 `await` 다음 줄이 `setTimeout(…, 0)` 보다
**먼저** 도는 이유를 설명 못 한다.

---

## 8. tree-sitter 현실

### `grammar_abi: 15` 는 세 문법 중 하나에만 맞다

`Cargo.lock` 의 실제 의존성에서 `parser.c` 의 `LANGUAGE_VERSION` 을 직접 읽었다.

| grammar | 크레이트 | `LANGUAGE_VERSION` | node kind | `langs.rs` 의 `grammar_version` |
|---|---|---|---|---|
| `typescript` | `tree-sitter-typescript 0.23.2` | **14** | 316 | `14-316` |
| `tsx` | 같은 크레이트 | **14** | 326 | `14-326` |
| `javascript` | `tree-sitter-javascript 0.25.0` | **15** | 224 | `15-224` |
| (참고) `python` | `tree-sitter-python 0.23.6` | 14 | — | — |

`ts/_lang.yaml` 과 `react/_lang.yaml` 이 둘 다 `grammar_abi: 15` 다. `javascript` 에만 맞고
`typescript`·`tsx` 에는 **틀렸다.** D152 가 「틀리면 조용히 어긋난다」고 적은 그 자리인데, `ts` 는 한
네임스페이스가 문법 셋을 안아 **스칼라로는 애초에 맞출 수 없다.** 안 터지는 이유는 이 값이 검사에
안 쓰이기 때문이다 — `ingest.ts:84` 가 `` `${version}:${grammar_abi}` `` 로 사전 판 식별자를 만드는
데만 쓴다. 문법이 올라가도 이 값을 안 고치면 판 키가 그대로라 **다시 파싱해야 할 것을 캐시가 맞다고 한다.**

**제안:** `grammar_abi: { typescript: 14, tsx: 14, javascript: 15 }` 로 문법별 맵을 연다. 스키마가 지금
`z.number().int().positive()`(`schema.ts:231`)라 레코드와의 유니온이 필요하다. `py` 는 문법이 하나라
스칼라를 계속 받는다.

### 파싱 함정

| 함정 | 무엇이 어긋나나 | 상태 |
|---|---|---|
| `.ts` 를 `tsx` 로 읽기 | `type_assertion` 노드가 **`typescript` 에는 있고 `tsx` 에는 없다.** `<T>x` 캐스트가 tsx 에서 JSX 로 오파싱된다 | **확인** — `node-types.json` 대조. `_lang.yaml` 주석의 근거가 이것 |
| `f<A>(b)` | `typescript` 에서는 타입 인자를 가진 호출, `javascript` 에서는 `(f < A) > (b)`. **같은 글자가 문법에 따라 다른 나무**가 된다 | **확인** — 파이썬 연쇄 비교에 대응. 쿼리에서 `type_arguments` 를 명시해 잘라야 한다 |
| `.js` 에 타입 쿼리 | `javascript` 에는 `type_annotation`·`type_alias_declaration` 노드가 아예 없다(224 vs 316) | **확인** — `grammars:` 를 손으로 맞추는 것이 유일한 방벽 |
| 세미콜론 자동 삽입 | `return` 뒤 줄바꿈이 `return;` 이 된다. T1 줄 채점이 「같은 줄들」로 보면 **뜻이 다른 프로그램을 맞다고 한다** | **추정** — `t1-line.ts` 가 이 차이를 보는지 확인 필요 |
| `a ? .5 : 1` | `?` 다음 `.5` 를 `?.` 로 볼지 삼항으로 볼지. JS 렉서에 예외 규칙이 있다 | **추정** — `optional_chain` 으로 잡히는지 픽스처 필요 |
| `satisfies`·`accessor`·`using` | 0.23.2 의 `define-grammar.js` 에 셋 다 있고 `satisfies_expression` 노드도 있다 | **확인** — `const_type_parameter`(`<const T>`)는 **없다** |
| 데코레이터 `@Injectable()` | `decorator` 노드가 `javascript` 문법에도 있다 | **확인** — `.ts`·`.js` 어느 쪽으로 읽혀도 나무는 선다 |

---

## 9. 오개념 10개

progmiscon.org 의 JavaScript 항목은 여섯이다(`AssignmentCopiesObject` · `ClassDefinesType` ·
`ConstReferenceImpliesImmutability` · `NoAtomicExpression` · `NullIsObject` · `ThisAssignable`).
이 중 넷이 아래와 겹친다 — **이름만 인용하고 문장은 가져오지 않는다**(재사용 라이선스 없음, D148).

| # | 믿는 것 | 실제로는 | 걸리는 개념 |
|---|---|---|---|
| 1 | `const` 로 만들었으니 안의 값도 안 바뀐다 | 이름만 묶인다. `const o = {}` 여도 `o.a = 1` 은 된다 (`ConstReferenceImpliesImmutability`) | `reference-sharing` |
| 2 | `b = a` 로 객체를 복사했다 | 같은 것을 가리키는 이름이 하나 더 생겼을 뿐이다 (`AssignmentCopiesObject`) | `reference-sharing` |
| 3 | `{ ...obj }` 가 안쪽까지 새로 만든다 | **한 겹**만이다. 안쪽 객체는 원본과 같은 것을 가리킨다 | `object-spread` |
| 4 | `0` 과 `''` 도 「없음」이다 | 있는 값이다. `if` 에서 거짓처럼 보일 뿐이라 `\|\|` 가 덮어쓴다 — `??` 가 생긴 이유 | `truthy-falsy` · `nullish-coalescing` |
| 5 | `==` 와 `===` 는 같다 | 타입이 다르면 `==` 가 한쪽을 바꿔 견준다. `null == undefined` 는 참 | `loose-equality` |
| 6 | `interface` 는 이름이 다르면 못 넣는다 | 모양이 같으면 들어간다. TS 는 이름이 아니라 구조를 본다 (`ClassDefinesType` 과 같은 뿌리) | `structural-typing` |
| 7 | 타입을 적었으니 실행 중에도 확인해 준다 | 컴파일하면 사라진다. 응답이 `interface` 와 달라도 아무도 안 막는다 | `type-erasure` |
| 8 | `as` 를 쓰면 그 타입으로 바뀐다 | 값은 그대로다. 컴파일러 입만 막으므로 다음 줄에서 런타임에 터진다 | `type-assertion` |
| 9 | 메서드를 변수에 담아 불러도 `this` 는 같다 | 부른 자리가 정한다. `cb = obj.m; cb()` 의 `this` 는 `obj` 가 아니다 (`ThisAssignable`) | `this-binding` |
| 10 | `await` 가 프로그램 전체를 멈춘다 | 그 함수만 접힌다. 나머지는 계속 돌고 접힌 쪽은 마이크로태스크 대기줄에서 이어진다 | `await-resume` |

1·4·10 은 이미 기존 YAML 의 `misconceptions:` 한 줄로 들어가 있다. 한 줄과 개념은 다르다 —
**한 줄에는 카드도 사용처도 겹도 안 붙는다.** §3 이 넷(`reference-sharing`·`truthy-falsy`·
`loose-equality`·`closure`)을 개념으로 올리자는 것이 이 뜻이다.

---

## 10. 근거와 출처

| 무엇 | URL / 경로 | 확인 |
|---|---|---|
| Exercism JS 트랙 (MIT · © 2021 Exercism) | `github.com/exercism/javascript/blob/main/config.json` | 확인 — 개념 37 · 개념 연습 29. 깊이 0~3: `basics · booleans · numbers · strings · arithmetic-operators · arrays · comparison · conditionals · for-loops · while-loops · increment-decrement`. `prerequisites` 간선은 **안 가져옴**(D148) |
| Exercism TS 트랙 | `github.com/exercism/typescript/blob/main/config.json` | 확인 — **모양이 다르다.** `concepts` 가 `basics` 하나, `status.concept_exercises: false`, 연습 131개가 전부 practice. **TS 트랙에서 가져올 목록은 없다** |
| tree-sitter-typescript | `~/.cargo/registry/…/tree-sitter-typescript-0.23.2/{typescript,tsx}/src/{parser.c,node-types.json}` | 확인 — ABI 14 / 316·326 kinds |
| tree-sitter-javascript | `~/.cargo/registry/…/tree-sitter-javascript-0.25.0/src/{parser.c,node-types.json}` | 확인 — ABI 15 / 224 kinds |
| TIOBE 2026-08 | `tiobe.com/tiobe-index/` · TechRepublic 2026-08 보도 | JS 6위 2.63% 는 확인. **TS 44위 0.37% 는 검색 요약에서만 봤다** — 원 페이지의 21~50 표를 못 열었다 |
| State of JS 2025 | `2025.stateofjs.com/en-US/usage/` | TS 만 40% · JS 만 6% — 2차 보도 경유, 원 페이지 재확인 필요 |
| JavaScript 오개념 | `progmiscon.org/misconceptions/JavaScript/` | 확인 — 6건, 이름만 인용 |
| 앱 쪽 근거 | `packages/concepts/src/{gaps.ts,zero-chapter.ts,ingest.ts}` · `packages/dictionary/src/{load.ts,lint.ts,schema.ts}` · `apps/desktop/src/data/blocks.ts` · `crates/parse/src/langs.rs` | 확인 — 줄 번호는 본문에 |

**확인 못 한 것.** ① TIOBE 원 페이지의 TypeScript 행 ② State of JS 2025 원 페이지 수치 ③ ASI 가 T1 줄
채점(`t1-line.ts`)에 실제로 새는지 ④ `a ? .5 : 1` 의 나무 모양 ⑤ Deno·Bun 리포에서 `typescript` 가
`package.json` 에 없는 비율 — §5 의 「`detect` 로는 못 가른다」를 수치로 못 댔다.
