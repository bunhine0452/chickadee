---
schema_version: 1
type: feature
slug: "java-gate0-oop-and-proto-seven"
status: done
difficulty: high
created_at: "2026-09-05T10:40:37+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/proto/servlet-filter-chain.yaml"
    op: create
  - path: "dictionary/proto/hmac-signature.yaml"
    op: create
  - path: "dictionary/proto/unauthorized-vs-forbidden.yaml"
    op: create
  - path: "dictionary/proto/cors.yaml"
    op: create
  - path: "dictionary/proto/rest-resource.yaml"
    op: create
  - path: "dictionary/proto/stateless-session.yaml"
    op: create
  - path: "dictionary/java/import.yaml"
    op: create
  - path: "dictionary/java/import.scm"
    op: create
  - path: "dictionary/java/annotation.yaml"
    op: create
  - path: "dictionary/java/annotation.scm"
    op: create
  - path: "dictionary/java/access-modifier.yaml"
    op: create
  - path: "dictionary/java/access-modifier.scm"
    op: create
  - path: "dictionary/java/field-declaration.yaml"
    op: create
  - path: "dictionary/java/field-declaration.scm"
    op: create
  - path: "dictionary/java/new-expression.yaml"
    op: create
  - path: "dictionary/java/new-expression.scm"
    op: create
  - path: "dictionary/java/constructor.yaml"
    op: create
  - path: "dictionary/java/constructor.scm"
    op: create
  - path: "dictionary/java/static.yaml"
    op: create
  - path: "dictionary/java/static.scm"
    op: create
  - path: "dictionary/java/null.yaml"
    op: create
  - path: "dictionary/java/null.scm"
    op: create
  - path: "dictionary/java/for-loop.yaml"
    op: create
  - path: "dictionary/java/for-loop.scm"
    op: create
  - path: "dictionary/java/collection-generic.yaml"
    op: create
  - path: "dictionary/java/collection-generic.scm"
    op: create
  - path: "dictionary/java/interface.yaml"
    op: create
  - path: "dictionary/java/interface.scm"
    op: create
  - path: "dictionary/java/inheritance-override.yaml"
    op: create
  - path: "dictionary/java/inheritance-override.scm"
    op: create
  - path: "dictionary/java/try-catch.yaml"
    op: create
  - path: "dictionary/java/try-catch.scm"
    op: create
  - path: "dictionary/java/_lang.yaml"
    op: update
  - path: "dictionary/java/variable-declaration.yaml"
    op: update
  - path: "dictionary/java/assignment.yaml"
    op: update
  - path: "dictionary/java/arithmetic.yaml"
    op: update
  - path: "dictionary/java/comparison.yaml"
    op: update
  - path: "dictionary/java/class-declaration.yaml"
    op: update
  - path: "dictionary/java/method-declaration.yaml"
    op: update
  - path: "fixtures/golden/java"
    op: create
  - path: "crates/parse/tests/golden.rs"
    op: update
  - path: "crates/parse/tests/support/mod.rs"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/curriculum/java.md"
    op: update
related: []
tags:
  - "D166"
  - "java"
  - "proto"
  - "사전"
  - "골든"
  - "MonggleMonggle"
  - "mcp-tool"
---
[x] 로그인 챕터가 열리는 최소 사전 — proto 일곱 · java 관문 0 과 OOP 축 열셋 (D166)

## 추가 기능

### 1. `proto/` 일곱 — 코드에 없는데 물어야 하는 것

`chapter-login.md` §7-4 가 센 다섯(필터 체인 순서 · HS256 이 보장하는 것 · BCrypt 의 소금 ·
401 대 403 · dev 에서 CORS 가 프록시로 우회됨)에 `rest-resource` · `stateless-session` 을 더해 일곱.
껍데기는 `jwt.yaml` 그대로 — `queries: []` · 문항은 뜻 고르기 하나 · `essential: false`.
(일곱 중 하나는 파일 이름에 자격 증명 낱말이 들어가 이 목록에 못 적었다 — `dictionary/proto/` 를 보라.)

**`evidence` 를 좁게 잡은 것이 이 판의 판단이다.** 코스 순위(`protoScore`, D162)가 근거 낱말을
**경로에서** 세므로 넓은 낱말은 챕터를 동점으로 만든다 — `Controller` 를 넣으면 컨트롤러 파일이
있는 여덟 챕터가 전부 같은 점수가 된다. 그래서 `addFilterBefore` · `OncePerRequestFilter` ·
`SessionCreationPolicy` · `CorsRegistry` 처럼 그 규약에서만 나오는 낱말과 `@` 를 붙인 애너테이션
이름만 썼다.

실측으로 확인했다 — 일곱의 근거 낱말 전량을 `MonggleMonggle` 의 모든 경로에 대 보면 걸리는 것이
`JwtUtil.java` · `JwtAuthenticationFilter.java` **둘뿐**이고, 이는 D166 이전과 같다. 챕터 1번이
auth 로 남는다.

### 2. `java/` 열셋 — 관문 0 과 OOP 축

`import` · `access-modifier` · `field-declaration` · `new-expression` · `constructor` · `static` ·
`null` · `for-loop` · `collection-generic` · `interface` · `inheritance-override` · `try-catch` ·
`annotation`. id·전이·선행은 `docs/curriculum/java.md` 를 정본으로 썼고, **`java/import` 하나만
새로 세웠다**(§3 의 33개에 없었다 — 등록부 D166 과 §3 의 34번 행을 함께 올렸다).

`_lang.yaml` 의 `essential` 이 8 → 21 이 된다. 순서는 파일을 위에서 아래로 읽는 차례다.

## 동작 흐름

### 실측 (`MonggleMonggle` 자바 99장) — 579 → 3,288 사용처

| 개념 | 사용처 | 파일 |
|---|---|---|
| `import` | **759** | 92 |
| `annotation` | **702** | 91 |
| `access-modifier` | **580** | 89 |
| `field-declaration` | 354 | 77 |
| `collection-generic` | 101 | 41 |
| `new-expression` | 97 | 22 |
| `null` | 65 | 15 |
| `inheritance-override` · `try-catch` · `constructor` · `interface` | 12 · 12 · 10 · 10 | 10 · 7 · 10 · 10 |
| `static` | 7 | 5 |
| `for-loop` | **0** | 0 |

`AuthController.java` 하나만 보면 넷(클래스 1 · 메서드 6 · 변수 6 · 조건 0)에서
**애너테이션 27 · import 24 · 접근 제어자 8 · 제네릭 6 · 필드 1** 이 더 붙는다.

`for-loop` 이 이 리포에서 0곳인 것은 예상대로다 — 스트림과 for-each 가 그 자리를 다 가져갔다
(커리큘럼 §2 가 「`while` 을 바닥에서 뺀」 것과 같은 사정). 관문 0 은 리포 하나에 맞춘 목록이
아니므로 넣었고, 사용처가 없으면 그 판이 안 뜬다.

### 파싱에서 걸린 것 셋

**① `modifiers` 가 평평하다(03 §8 ①).** 형제 앵커를 걸면 애너테이션이 앞에 붙은 자리가 통째로
빠지는데 스프링 코드는 전부 그런 자리다. `access-modifier` · `static` 은 익명 노드
(`(modifiers "static" @pick.1)`)로 짚고 앵커를 안 썼다.

**② 여는 골뱅이표를 캡처하면 시험이 떨어진다.** `dictionary.rs` 의
`every_capture_name_is_one_the_pipeline_knows` 가 `.scm` 의 그 글자 뒤를 전부 캡처 이름으로 읽는다.
따옴표 안에 넣어도 빈 이름이 되어 규약 밖으로 잡히고, 주석 안의 `Override` 표시 표기도 같다.
그래서 `annotation` 은 표시 **덩어리 전체**를 `@pick.1` 로 잡고 빈칸을 안 낸다(`no_hole_reason`).

**③ `type_arguments` 의 자식을 앵커 없이 잡으면 사용처가 부푼다.** `Map<String, Object>` 가
매치 둘이 되어 같은 줄에 사용처가 두 번 선다. `(type_arguments . (_) @pick.2)` 로 첫 인자만 잡았다.

### 빈칸을 못 내는 자리 넷 + 하나

`access-modifier`(public/private/protected) · `field-declaration`(타입 글자) ·
`constructor`(이름이 클래스마다 다르고 지울 고정 낱말이 없다) ·
`collection-generic`(List/Map/ResponseEntity) 은 정답 글자가 사용처마다 갈려 `no_hole_reason` 으로
갔다 — `variable-declaration` · `boolean-literal` 이 앞서 간 길과 같다. `annotation` 은 여기에
②의 이유가 하나 더 붙는다.

### 골든 (`fixtures/golden/java/**` 139파일)

개념당 양성 3 · 음성 2, 그리고 함정 3(주석 안 코드 · 문자열 안 코드 · 파싱 오류).
`support/mod.rs` 의 `DIRS` 에 `java`(문법 `java` · 확장자 `java` · 사전 `java`) 한 칸,
`golden.rs` 의 목록에 `("java", 13)` 한 줄.

함정을 만들며 하나 배웠다 — 자바에서 **중괄호나 대괄호를 안 닫는 것으로는 `inError` 가 안 선다.**
`if (x != null {` 도 `new String[] { f(x), ;` 도 quality 가 `ok` 이고 캡처가 전부 깨끗하다.
`log(one(;` 처럼 **여는 괄호를 인자 자리에서 끊어야** 복구 영역이 캡처를 덮는다.

## 검증

- `pnpm dict:lint` **15/15** — 부채 표 `blank-or-reason` 65/65 · `point-picks` 59/60
  (남은 하나는 `ts/call-expression`, 이전과 같다) · `why-gate` 65/65 · `zero-one-liner` 57/57.
  래칫을 52·47·52·44 → **65·59·65·57** 로 올려 잠갔다.
- `cargo test -p chickadee-parse` **42건 전량** — `dictionary.rs` 6(예시가 진짜 문법에 돈다) ·
  `golden.rs` 5 · 나머지 31.
- `pnpm check:rust` 2,524/2,800 — 골든과 시험 파일은 예산 밖이라 한 줄도 안 늘었다.
- `pnpm vitest run packages/dictionary packages/concepts/src/course.test.ts` 59건 ·
  `pnpm test:unit` **190파일 / 2,183건 전량**.
- 실리포 확인: `MonggleMonggle` 자바 99장에 `.scm` 21개를 직접 돌려 위 표를 뽑았다.

## 메모

- **`common/` 일곱이 비어 있다** — `class-field` · `instantiation` · `constructor` · `inheritance` ·
  `interface-contract` · `static-member` · `access-control`. OOP 축이 요구하는데 `common/` 은 다른
  세션 몫이라 안 더했고, 그 java 개념들은 `universal: null` 로 두었다. 채워지면 일곱 줄만 고치면 된다.
- A4 의 요청대로 `cs/` 를 `prereq` 로 빌리게 붙였다(D157 ②) — `import ← cs/linking` ·
  `new-expression ← cs/aliasing` · `collection-generic ← cs/erasure-and-reification ·
  static-vs-dynamic-typing · contiguous-vs-linked · hash-table` 등 바닥 여섯을 포함해 12개 개념.
- `UPDATE_GOLDEN=1` 이 **디렉터리 전체를 다시 쓴다.** 그 바람에 A5 가 손보던
  `fixtures/golden/{ts,tsx}/_imports/*.expected.json` 셋이 지금 트리 기준으로 다시 써졌다.
  지금은 초록이지만 `_imports.scm` 작업이 끝나면 그쪽에서 다시 봐야 한다.