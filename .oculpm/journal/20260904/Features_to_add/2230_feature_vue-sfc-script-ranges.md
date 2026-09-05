---
schema_version: 1
type: feature
slug: "vue-sfc-script-ranges"
status: done
difficulty: high
created_at: "2026-09-04T22:30:11+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "crates/parse/src/sfc.rs"
    op: create
  - path: "crates/parse/src/lib.rs"
    op: update
  - path: "crates/parse/src/langs.rs"
    op: update
  - path: "packages/dictionary/src/schema.ts"
    op: update
  - path: "dictionary/schema/concept.schema.json"
    op: update
  - path: "dictionary/ts/_lang.yaml"
    op: update
  - path: "apps/desktop/src/session-flow.ts"
    op: update
  - path: "packages/concepts/src/resolve-imports.ts"
    op: update
related:
  - ref: "20260904/Features_to_add/2221_feature_wire-feature-units.md"
    kind: "followup"
tags:
  - "D159"
  - "vue"
  - "tree-sitter"
  - "included-ranges"
  - "MonggleMonggle"
  - "mcp-tool"
---
[x] 한 파일에 문법이 셋인 첫 사례 (D159 ⑤)

## 추가 기능

`.vue` 는 `<template>`·`<script>`·`<style>` 셋이 한 파일에 있다. 지금 모델은 **문법 하나 = 확장자
목록**이라 이것이 첫 반례다.

**네 번째 문법을 들이지 않았다.** tree-sitter 의 `set_included_ranges` 로 **`<script>` 구간만**
자바스크립트로 읽는다. `vue` 는 문법 키일 뿐 언어는 자바스크립트다 — 키를 따로 두는 이유는
파서 풀과 구간 지정이 그 키로 갈리기 때문이다.

**위치가 절대값으로 남는 것이 요점이다.** 998줄짜리 `NoticeModal.vue` 의 import 가 137~141행으로
잡힌다 — 잘라서 파싱했으면 1~5행이 됐을 것이고 카드가 엉뚱한 줄을 가리켰을 것이다.

## 동작 흐름

`sfc.rs` 가 `<script`…`>` 와 `</script` 사이를 바이트로 찾아 `Range` 를 만든다(줄·칸 포함).
`with_tree` 가 파싱 직전에 지정한다 — **매번 새로 지정한다.** 파서는 문법마다 재사용되므로
앞 파일의 구간이 남으면 조용히 틀린다. `<script>` 가 없으면 **빈 구간**을 준다: 비워 두면
tree-sitter 가 문서 전체를 읽어 템플릿을 자바스크립트로 파싱한다.

바이트 훑기라 템플릿 문자열이나 주석 안의 `<script>` 에 속는다. 문법 하나를 더 안 지고 가는 값이다.

## 사전 쪽 — 규칙 하나

**`javascript` 가 있는 자리에 `vue` 를 더한다.** vue 가 곧 자바스크립트라서다.
36개 파일이 바뀌었고 `generics`(`[typescript, tsx]`)는 그대로다 — 타입 노드는 vue 에 없다.
`optional-chaining` 은 `.js.scm` 쪽 쿼리에만 붙었다.

## 실측

`LandingView.vue`(**1,527줄**)에서 사용처 **73곳** — `const-declaration` 37 · `if-statement` 17 ·
`arrow-function` 12 · `async-await` 4 · `template-literal` 3. 첫 자리가 **303행**
`const router = useRouter();` 이고 `quality: ok` 다. 리포 전체 간선이 **213 → 275**(+62).

## 접은 것 — 기능 폐포를 위로 넓히기

`.vue` 가 읽히면 「로그인」 대지에 `LoginView.vue` 가 들어올 줄 알았는데 **안 들어온다.**
폐포가 진입점에서 아래로만 가는데 화면은 위쪽이다. 위로 넓히는 세 방법을 다 재 봤다:

| 방법 | auth 대지 |
|---|---|
| 아래만 (지금) | 18파일 · vue 0 |
| + 위로 전이 | 38 · **vue 14** |
| + 직접 부르는 것만 | 20 (배럴 `services/index.js` + `authStore.js`) |
| + 위로 전이하되 화면에서 멈춤 | 32 · **vue 14** |

**전부 틀렸다.** `authStore.js` 를 거의 모든 화면이 import 한다 — 「로그인을 호출한다」와
「로그인 상태를 읽는다」가 그래프에서 같은 모양이라서다. auth 가 프론트 절반이 된다.
그래서 **위로 넓히지 않는다.** 파일보다 잘게 봐야 풀리는 문제이고 지금 도구로는 안 된다.

## 검증

`pnpm test:unit` **180파일 / 2,038건 전량 통과**(두 번 연속) · `cargo test --test dictionary` 6/6
(`vue` 의 ABI 15 대조 + 36개 쿼리가 vue 문법에서 컴파일되는지) · `typecheck`·`lint` 무출력 ·
Rust 예산 **2,405/2,800**(sfc.rs 51줄).

`dict:schema` 재생성을 한 번 빠뜨려 `dict-schema.test.ts` 가 잡았다 — 시험이 제 일을 했다.

## 남은 것

- **화면 → 서비스**를 잇는 것. 파일 단위 import 로는 안 되고, 함수 단위(어느 함수가
  `authService.login` 을 부르나)가 필요하다.
- `.vue` 의 `<template>`·`<style>` 은 여전히 안 읽는다. CSS 를 가르치려면 문법이 하나 더 든다.
- 대지 이름이 `auth` 다. 사람이 읽는 「로그인」이 되려면 사전이나 라우트가 필요하다.