---
schema_version: 1
type: feature
slug: "swift-dictionary-session-merged"
status: done
difficulty: high
created_at: "2026-09-06T05:02:36+09:00"
session_id: "20260906-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "aba79b97-7097-466f-8484-5b36a42424eb"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/swift/_lang.yaml"
    op: create
  - path: "dictionary/swift/optional-type.yaml"
    op: create
  - path: "dictionary/swift/arc-weak.yaml"
    op: create
  - path: "dictionary/swift/struct-declaration.yaml"
    op: create
  - path: "packages/course/src/parts/swift.ts"
    op: update
  - path: "packages/cards/src/t0-synthetic.ts"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "docs/curriculum/swift.md"
    op: update
related: []
tags:
  - "v11"
  - "사전"
  - "swift"
  - "합류"
  - "mcp-tool"
---
[x] Swift 사전 37장 — 0장에서 전량, 커뮤니티 문법 첫 실측 ERROR 1.6%, node-types 필드가 쿼리에서 안 맞는 함정 (D190 swift 세션 합류)

Opus 워크트리 세션(브랜치 `worktree-agent-a2fc909dda050c7c3`, 커밋 `351d165`)의 보고를 받아 병합했다. 열 언어 중 마지막이다. 세션 한도로 한 번 멈췄다가 재개해 끝냈다.

## 추가 기능

- 0 → **37장** 7,059줄(한 장 191줄), 쿼리 패턴 66. `essential` 37(0부 8 · 1부 4 · 2부 25), `parts/swift.ts` 같음. 3부 `swiftui/` 는 없다.
- 골든 89/37(개념마다 음성 정확히 하나). 표본은 공개 SwiftUI 앱 `IceCubesApp`(.swift 428) + 사용자 리포 ECC 의 1장(앱 아닌 스크립트) — `assignment` 3,134/281 부터 `arc-weak` 0/0 까지. `struct-declaration` 이 파일 수로 1위(341), `repeat-while` 0곳(반복은 `ForEach` 와 고차 함수가), `weak`/`unowned` 저장 속성 0곳(고리는 `[weak self]` 캡처 10곳에서).
- 파서 첫 실측 — `tree-sitter-swift` 0.7.3, ABI 15: ERROR 파일 7/428(1.6%), poor 1/428(0.2%). 원인 여섯을 최소 재현으로 갈랐고 가장 흔한 것은 여러 줄 조건 뒤 홀로 선 `{`(§8 이 지목한 외부 스캐너 문 경계 — 예상 적중). `isolated deinit`(Swift 6.2)도 ERROR.
- **쿼리 함정 하나를 새로 찾았다** — `node-types.json` 의 필드 셋(`type_annotation.type`·`parameter.type`·`function_declaration.return_type`)이 쿼리에서 하나도 안 맞고 `parameter.name` 은 이름과 타입 둘 다 잡는다. 필드를 믿고 적으면 캡처가 0곳이고 아무 데서도 안 터진다(처음 쓴 네 쿼리가 그랬다). `swift.md` §8 함정 ⑨ 후보.
- ABSENCE 에 `swift/arc-weak: idiom`.

## 동작 흐름

새 `common/` 후보 넷(type-cast·unwrap-binding·tagged-union·exhaustive-match) · `schema.ts` `detect` 를 `{ module: 'SwiftUI' }` 로 넓히는 것(README §6 #3) · Monaco `basic-languages/swift` 미배선(T1 이 plaintext 로 떨어짐)은 등록부 초안. 합류에서 `DEBT_RATCHET` 406/385/406/396 — 열 언어 최종값.

## 검증

병합 뒤 `packages/dictionary`·`packages/course`·`packages/cards` 초록(래칫 재잠금 뒤), cargo 골든 6/6. 못 한 것: 3부 0장 · `alternatives` 빈 목록(`force-unwrap`↔`guard-let` 이 65:255 라 한쪽으로 안 기움) · `Package.swift` 를 사용처에서 뺄지 · `MIN_HOLE=2` 로 한 글자 구멍의 빈칸 카드 생성 비율 안 잼 · 표본이 사용자 코드가 아니다.