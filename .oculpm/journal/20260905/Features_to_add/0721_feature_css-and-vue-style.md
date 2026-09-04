---
schema_version: 1
type: feature
slug: "css-and-vue-style"
status: done
difficulty: high
created_at: "2026-09-05T07:21:21+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "crates/parse/Cargo.toml"
    op: update
  - path: "crates/parse/src/langs.rs"
    op: update
  - path: "crates/parse/src/sfc.rs"
    op: update
  - path: "dictionary/css/_lang.yaml"
    op: create
  - path: "dictionary/css/_imports.scm"
    op: create
  - path: "dictionary/css/_blocks.scm"
    op: create
  - path: "dictionary/css/declaration.yaml"
    op: create
  - path: "dictionary/css/declaration.scm"
    op: create
  - path: "dictionary/css/rule-set.yaml"
    op: create
  - path: "dictionary/css/rule-set.scm"
    op: create
  - path: "packages/dictionary/src/schema.ts"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "dictionary/schema/concept.schema.json"
    op: update
related:
  - ref: "20260905/Features_to_add/0650_feature_multi-grammar-per-file.md"
    kind: "followup"
tags:
  - "D159"
  - "css"
  - "vue"
  - "tree-sitter"
  - "MonggleMonggle"
  - "mcp-tool"
---
[x] 「css 정의는 어떻고」 (사용자 질문 넷 중 마지막)

## 추가 기능

앞 판이 예고한 대로 **사전에 문법 하나 더**로 끝났다. 파이프라인은 한 줄도 안 고쳤다 —
다중 문법과 구간별 파싱이 이미 서 있어서다.

`vue_style` 은 css 문법을 `.vue` 의 `<style>` 구간에만 돌리는 가상 문법이다.
`sfc.rs` 의 `script_ranges` 를 **`tag_bodies(src, tag)`** 로 일반화해 `<script>` 와 `<style>` 이
같은 함수를 쓴다 — 여는 태그만 다르다.

**`.vue` 한 파일이 문법 셋에 걸리는 첫 사례다** — `vue`(script) · `vue_style`(style) ·
그리고 `ts` 사전이 잡는 확장자. 으뜸 문법(파일 행)은 먼저 온 쪽이고 캡처는 전부에서 나온다.

## 개념 둘

| | 이 언어라서 다른 것 |
|---|---|
| `css/declaration` | **모르는 속성·값은 조용히 버려진다.** 오류도 경고도 없이 그 줄만 없던 것이 된다 — 「분명히 적었는데 안 먹는다」의 절반이 여기다 |
| `css/rule-set` | 앞부분은 이름이 아니라 **조건**이다. 몇 개가 걸리는지 이 파일만 봐서는 모르고, 겹치면 더 구체적인 것이·같으면 뒤엣것이 이긴다 |

둘 다 `no_hole_reason` 이다 — 속성 이름도 선택자도 사용처마다 글자가 다르다.
`declaration` 은 쌍점을 `pick.2` 로 잡아 지목형 세 자리를 채웠다.

## 실측

| | 파일 | 사용처 |
|---|---|---|
| `css` (`.css`) | 1 | 409 |
| `vue_style` (`.vue` 의 `<style>`) | **24** | **6,115** |

전부 `quality: ok`. **눈에 띄는 것은 6,115 라는 수 자체다** — 자바 577 · SQL 229 와 견주면
한 자릿수가 크다. CSS 는 줄마다 선언이라 사용처 밀도가 다른 언어와 다르다.
큐가 이것을 어떻게 다룰지는 아직 안 쟀다 — `thin_threshold` 도 순위도 이 밀도를 전제로 고른 값이 아니다.

## 검증

`pnpm test:unit` **180파일 / 2,046건 전량 통과**(두 번 연속) · `cargo test --workspace` 19개 스위트 ok ·
`pnpm dict:lint` 13/13 · `typecheck`·`lint` 무출력 · Rust 예산 **2,501/2,800**(+8 — 문법 두 줄과 태그 일반화).

래칫 50/46/50/43 → **52/47/52/44**. `zero-one-liner` 를 45 로 적었다가 44 로 내렸다 —
대상이 44 인데 45 로 잠그면 영영 못 지나간다(시험이 그것을 막았다).

## 남은 것

- SQL 바닥 여덟 중 다섯. 막힌 것 없음.
- **CSS 사용처 밀도** — 6,115곳이 큐에 어떻게 들어오는지 재야 한다. 다른 언어를 밀어낼 수 있다.
- `.vue` 의 `<template>` — 아직 안 읽는다. HTML 문법이 하나 더 든다.