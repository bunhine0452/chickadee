---
schema_version: 1
type: feature
slug: "multi-grammar-per-file"
status: done
difficulty: high
created_at: "2026-09-05T06:50:42+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src-tauri/src/jobs.rs"
    op: update
  - path: "crates/parse/src/lib.rs"
    op: update
  - path: "crates/parse/src/sfc.rs"
    op: update
  - path: "crates/parse/src/langs.rs"
    op: update
  - path: "packages/dictionary/src/schema.ts"
    op: update
  - path: "dictionary/schema/concept.schema.json"
    op: update
  - path: "dictionary/sql/_lang.yaml"
    op: update
  - path: "dictionary/sql/from-table.yaml"
    op: update
  - path: "dictionary/sql/comparison.yaml"
    op: update
  - path: "dictionary/sql/null-check.yaml"
    op: update
related:
  - ref: "20260905/Features_to_add/0019_feature_sql-comparison-guard-and-proto-generator.md"
    kind: "followup"
tags:
  - "D159"
  - "mybatis"
  - "sql"
  - "tree-sitter"
  - "included-ranges"
  - "MonggleMonggle"
  - "mcp-tool"
---
[x] 「파일 하나에 문법 하나」를 풀고 매퍼 안의 SQL 을 읽는다

## 추가 기능

앞 판이 자리표 함정을 막고도 매퍼 SQL 을 못 열었다. 막던 것은 함정이 아니라 **파이프라인**이었다 —
`jobs.rs` 가 `compiled.get(&file.grammar)` 로 파일 하나에 문법 하나를 썼다.
`.vue` 가 됐던 것은 그것이 *한 문법을 구간에만* 돌리는 일이었고, 매퍼는 XML 속성과 SQL 본문이라
**문법 둘**이다.

## 동작 흐름

**① 확장자 하나에 문법 여럿** (`grammars_of`). `file.grammar` 열에 적히는 **으뜸**은 하나지만
캡처는 그 확장자를 읽는 문법 **전부**에서 모은다. 품질과 줄 수는 으뜸 것을 쓴다.

**② `extension_map` 의 숨은 비결정성을 고쳤다.** `collect()` 라 같은 확장자를 두 언어가 대면
**마지막 것이 이기고** 그 순서는 로드 순서에 달려 있었다. 먼저 온 것이 이기게 바꿨다 —
`.xml` 을 `mybatis` 와 `sql` 이 함께 대는 순간 실제로 문제가 되는 자리다.

**③ 구간마다 따로 판다** (`scan_ranges`). 이게 이 판에서 제일 중요한 발견이다 —
tree-sitter 는 구간 여럿을 **이어 붙은 한 문서**로 읽는다. 그래서 매퍼의 `<select>` 두 개가
한 노드로 합쳐지고, 사용처의 글자가 `</select>` 를 넘어 다음 문까지 삼켰다(`quality: poor`).
구간당 한 번씩 파니 **`quality: ok` 로 바뀌고 문마다 따로** 잡힌다.
`.vue` 도 같이 고쳐졌다 — `<script>` 와 `<script setup>` 이 둘 다 있으면 같은 일이 났다.

**④ `mybatis_sql`** 은 sql 문법을 문 본문에만 돌리는 가상 문법이다. 동적 태그(`<if>`)가 든 본문은
**건너뛴다** — 그 안에는 XML 태그가 SQL 사이에 끼어 있어 어느 SQL 문법도 못 읽는다.
실측 리포에서 49개 문 중 2개다.

## 실측

매퍼 **9장 전부 `quality: ok`**(poor 0) · SQL 사용처 **51곳** —
`from-table` 23 · `null-check` 22 · `comparison` 6.

`comparison` 이 6곳뿐인 것이 **거름망이 일한 증거**다. 매퍼의 견주기는 대부분 `#{param}` 이고
앞 판의 `(#not-match? @site "[:#]")` 가 그것들을 뺐다 — 뺀 자리가 정확히 「값을 열 이름이라
가르쳤을」 자리다.

## 검증

`pnpm test:unit` **180파일 / 2,046건 전량 통과**(두 번 연속) · `cargo test --workspace` 19개 스위트 ok ·
`typecheck`·`lint` 무출력 · Rust 예산 **2,493/2,800**(+32 — 다중 문법 루프와 구간별 파싱).

## 남은 것

SQL 바닥 여덟 중 다섯(`text-literal`·`select-list`·`where-filter`·`order-by`·`update-set`).
막힌 것이 없고 순수 저작 분량이다.

그리고 이 판이 **CSS 를 여는 길도 함께 냈다** — `.vue` 의 `<style>` 을 `css` 문법으로 읽는 것이
이제 「`vue` 사전에 문법 하나 더」로 끝난다. 사용자가 물었던 「css 정의는 어떻고」가 그 자리다.