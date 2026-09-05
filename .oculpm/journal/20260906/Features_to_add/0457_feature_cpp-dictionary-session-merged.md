---
schema_version: 1
type: feature
slug: "cpp-dictionary-session-merged"
status: done
difficulty: high
created_at: "2026-09-06T04:57:12+09:00"
session_id: "20260906-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "aba79b97-7097-466f-8484-5b36a42424eb"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/cpp/_lang.yaml"
    op: create
  - path: "dictionary/cpp/rule-of-five.yaml"
    op: create
  - path: "dictionary/cpp/move.yaml"
    op: create
  - path: "dictionary/cpp/structured-binding.yaml"
    op: create
  - path: "packages/course/src/parts/cpp.ts"
    op: update
  - path: "packages/cards/src/t0-synthetic.ts"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "docs/curriculum/cpp.md"
    op: update
related: []
tags:
  - "v11"
  - "사전"
  - "cpp"
  - "합류"
  - "mcp-tool"
---
[x] C++ 사전 38장 — 0장에서 전량, fmt·json 527파일 실측, ERROR 의 원인은 템플릿이 아니라 매크로 (D190 cpp 세션 합류)

Opus 워크트리 세션(브랜치 `worktree-agent-a64b0a1932007dfc3`, 커밋 `2fdaef3`)의 보고를 받아 병합했다. 세션 한도로 한 번 멈췄다가 재개해 끝냈다.

## 추가 기능

- 0 → **38장** 6,705줄(개념당 176줄), 쿼리 패턴 105. `essential` 38(0부 13 · 1부 3 · 2부 22), `parts/cpp.ts` 같음. 문서 §0.6 의 네 부(0:13·1:9·2:12·3:4)는 3부가 프레임워크 전량이어야 하는 규칙 때문에 0:13·1:3·2:22·3:0 이 됐다.
- 골든 77/38. 표본은 공개 리포 둘(`fmtlib/fmt` 47 · `nlohmann/json` 480) — `namespace-qualification` 27,621/425 부터 `structured-binding` 0/0 까지. `thin_threshold` 를 못 넘는 것은 `structured-binding` 하나.
- 파서 첫 실측 — `tree-sitter-cpp` 0.23.4, ABI 14 일치: 20파일 1/20(5%), 527파일 24(4.6%). **템플릿 원인 0** — 네임스페이스를 여는 매크로(`NLOHMANN_JSON_NAMESPACE_BEGIN`) 11/24 · C++20 모듈 1 · gtest 매크로. 셋 다 매크로가 문법을 만드는 자리다.
- `.h` 는 c 소유로 두고 cpp 는 `.cpp .cc .cxx .hpp .hh .hxx` 여섯 — 두 사전이 같은 확장자를 걸면 인제스트 표에서 마지막 것이 조용히 이긴다. `c/` 와 겹치는 여섯 개념(include·pointer·macro·for·array-index·sizeof)은 cpp 에 안 만들고 c 의 것을 잇는다.
- ABSENCE 에 `cpp/structured-binding: idiom` — 둘 다 C++11 을 바닥 표준으로 지켜 `auto [` 가 0곳.

## 동작 흐름

`char-and-byte` 의 `universal` 을 null 로 둔 이유(「바이트로 센다」가 py·java 와 답이 갈려 전이하면 거짓) · id 조각 다섯이 README §8 과 다른 것 · `alternatives` 여섯이 present `c/` 부재로 못 올라간 것(c 가 섰으니 다음) · `common/` 후보 다섯과 `cs/signed-and-unsigned` · 스택 프레임 `unwind` 그림 신청 · pedagogy §13 ④ 권고는 등록부 초안. 합류에서 `DEBT_RATCHET` 369/348/369/360.

## 검증

병합 뒤 `packages/dictionary`·`packages/course`·`packages/cards` 초록(래칫 재잠금 뒤), cargo 골든 6/6. 못 한 것: 사용자 리포 ERROR 비율(표본 없음) · `ingest.file_p95` 안 잼 · 특유 연습 둘(소멸 순서·복사 횟수)은 `trace-table` 열 축 파라미터화가 먼저라 판으로 안 만듦 · `Widget w(x);` 파싱 미확인(쿼리가 그 모양을 안 잡는다).