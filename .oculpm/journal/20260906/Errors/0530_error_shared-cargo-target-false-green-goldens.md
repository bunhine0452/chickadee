---
schema_version: 1
type: error
slug: "shared-cargo-target-false-green-goldens"
status: done
difficulty: high
created_at: "2026-09-06T05:30:41+09:00"
session_id: "20260906-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "aba79b97-7097-466f-8484-5b36a42424eb"
language: "ko"
verified_by_user: false
files_touched:
  - path: "crates/parse/tests/dictionary.rs"
    op: update
  - path: "packages/dictionary/src/lint.ts"
    op: update
  - path: "packages/dictionary/src/lint.test.ts"
    op: update
  - path: "tests/support/quality-gate.test.ts"
    op: update
  - path: "apps/desktop/src/screens/course/CourseScreen.tsx"
    op: update
  - path: "dictionary/cpp/integer-type.scm"
    op: update
  - path: "dictionary/cpp/operator-precedence.scm"
    op: update
  - path: "dictionary/cpp/return-statement.scm"
    op: update
  - path: "dictionary/csharp/interpolated-string.scm"
    op: update
  - path: "dictionary/csharp/interpolated-string.yaml"
    op: update
  - path: "dictionary/csharp/record.yaml"
    op: update
  - path: "dictionary/csharp/switch-expression.scm"
    op: update
  - path: "dictionary/go/float-literal.scm"
    op: update
  - path: "dictionary/go/package-visibility.scm"
    op: update
  - path: "dictionary/go/type-conversion.scm"
    op: update
  - path: "dictionary/go/type-conversion.yaml"
    op: update
  - path: "dictionary/rs/iterator-adapters.yaml"
    op: update
  - path: "dictionary/swift/equality.scm"
    op: update
  - path: "dictionary/swift/if-let.scm"
    op: update
  - path: "dictionary/swift/switch-exhaustive.scm"
    op: update
  - path: "dictionary/swift/type-conversion.scm"
    op: update
related: []
tags:
  - "v11"
  - "cargo"
  - "워크트리"
  - "골든"
  - "CI"
  - "mcp-tool"
---
[x] CI 가 잡은 거짓 초록 — 워크트리와 공유한 CARGO_TARGET_DIR 가 골든 시험 바이너리를 바꿔치기해 열 언어 골든 15건이 로컬에서 안 보였다

## 발생 원인

열 세션의 워크트리에 `CARGO_TARGET_DIR=<메인 트리>/target` 을 쓰게 했다(문법 크레이트 재컴파일을 피하려고). cargo 는 워크스페이스 멤버의 `-C metadata` 해시에 소스 경로를 안 넣으므로 열한 트리가 **같은 이름의 시험 바이너리**를 번갈아 덮어썼고, 그 바이너리에는 컴파일 시점의 `CARGO_MANIFEST_DIR` 가 구워져 있다. `crates/parse/tests/dictionary.rs` 는 그 경로로 `dictionary/` 를 찾으므로 메인 트리에서 돌린 「골든 6/6 초록」은 마지막으로 컴파일한 어느 세션의 워크트리 사전을 읽은 결과였다. 세션 열 개의 「cargo 초록」 보고도 같은 이유로 믿을 수 없었다. 워크트리를 지우자 `root()` 가 즉시 패닉했고, CI(깨끗한 체크아웃)는 처음부터 빨갰다.

같은 커밋에서 CI 가 잡은 나머지 둘: ① 성질 센서스가 사전 535장으로 5초 타임아웃(CI 8초) ② 코스 화면에서 언어 코스 읽기가 챕터 읽기보다 먼저 끝나면 부 0 이 먼저 선택돼 여정 게이트의 「1단 판정」 단추가 안 보이는 경쟁.

## 해결 방법

- `cargo clean -p chickadee-parse` 뒤 메인 트리에서 다시 빌드 → 골든 15건이 드러났다(cpp 2 · csharp 5 · go 3 · rs 1 · swift 4). 하네스를 고쳐 **첫 실패에서 멈추지 않고 전부** 보고하게 했고(`catch_unwind` 수집), 캡처 이름 검사는 `;` 주석과 `"…"` 문자열을 걷어낸 뒤 본다(파이썬 데코레이터의 `"@"` 노드가 잡히던 자리).
- 쿼리 잘못 아홉을 고쳤다 — `int64_t` 는 `primitive_type` · C++ 빈 `return` 은 `#match?` 로 · C# switch 식과 Swift switch 는 첫 가지만(`.` 앵커) · Go 실수 식은 왼쪽 비실수만 · Go 태그는 raw 문자열 · Swift `!=` 는 `custom_operator` · Swift 짧은 `if let` 은 `condition:` 필드 · Swift `as` 의 타입은 필드 없이(트리는 `name:` 을 찍지만 node-types 에 없어 컴파일 거부). 골든 원문 넷을 노드가 덮는 범위로 고쳤다(`$` · `Id = 2` · `<Vec<_>>` · Go 선언은 두 자리).
- 린트 결함 하나 — `revealsToken` 이 정답 토큰 `$` 를 정규식에 이스케이프 없이 넣어 「줄 끝」이 됐다. 이스케이프 + 시험.
- 센서스 타임아웃 120초 · 코스 화면은 ref 로 두 읽기의 순서를 무시하고 「챕터가 있으면 챕터 먼저」.

## 검증

`cargo test --locked -p chickadee-parse` 아홉 벌 초록(골든 6/6, 진짜) · `packages/dictionary`·`course`·센서스·코스 화면 254 초록 · 전체 단위·게이트·CI 는 이 일지 뒤 커밋에서 다시 돈다.

## 메모

교훈: 워크트리 병렬 저작에서 cargo 는 **트리마다 target 을 따로** 두거나(느려도), 공유하려면 `CARGO_TARGET_DIR` 를 트리 이름으로 나눈다. 시험이 `env!("CARGO_MANIFEST_DIR")` 로 자료를 찾는 한 바이너리 공유는 곧 자료 바꿔치기다. 등록부 D191 ⑦ 의 파서 ERROR 값은 세션이 `scan` 으로 직접 잰 것이라 이 결함과 무관하다.