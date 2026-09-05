---
schema_version: 1
type: feature
slug: "csharp-dictionary-session-merged"
status: done
difficulty: high
created_at: "2026-09-06T04:54:17+09:00"
session_id: "20260906-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "aba79b97-7097-466f-8484-5b36a42424eb"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/csharp/_lang.yaml"
    op: create
  - path: "dictionary/csharp/value-vs-reference.yaml"
    op: create
  - path: "dictionary/csharp/switch-expression.yaml"
    op: create
  - path: "dictionary/csharp/nullable-reference.yaml"
    op: create
  - path: "packages/course/src/parts/csharp.ts"
    op: update
  - path: "packages/cards/src/t0-synthetic.ts"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "docs/curriculum/csharp.md"
    op: update
related: []
tags:
  - "v11"
  - "사전"
  - "csharp"
  - "합류"
  - "mcp-tool"
---
[x] C# 사전 35장 — 0장에서 전량, 표본 eShopOnWeb 254파일 ERROR 0% (D190 csharp 세션 합류)

Opus 워크트리 세션(브랜치 `worktree-agent-a45d188a0bfd41e3e`, 커밋 `ba6fa7e`)의 보고를 받아 병합했다. 세션 한도로 한 번 멈췄다가 재개해 끝냈다.

## 추가 기능

- 0 → **35장** 5,884줄(한 장 168줄 — 첫 물결 213 의 79%). `essential` 35(0부 8 · 1부 3 · 2부 24), `parts/csharp.ts` 같음. 자유 함수가 없어 1부가 셋뿐이고 3부(`aspnet/`)는 없다.
- 골든 81/35, 빈칸형 26 · `no_hole_reason` 9. 표본은 공개 리포 `dotnet-architecture/eShopOnWeb`(.cs 254) — `member-access` 3,291/165 부터 `switch-expression` 0/0 까지. 값/참조 대비가 C# 의 축인데 표본에 `struct` 선언이 0곳이라 `value-vs-reference` 와 `class-declaration` 이 239/235 로 글자까지 같다 — 한쪽 날개만 보인다.
- 파서 첫 실측 — `tree-sitter-c-sharp` 0.23.5, ABI 15(`parser.c` 직접 확인): 20파일 0%, 254파일 0%, poor 0. 전처리기 `#if`·`partial` 은 표본에 없어 못 쟀다.
- ABSENCE 에 `csharp/switch-expression: idiom` — 같은 리포의 `switch` 는 한 번뿐이고 문이며, 갈래는 `if` 142곳과 삼항 4곳이 쓴다.

## 동작 흐름

문서와 어긋나 바꾼 여섯은 `csharp.md` §12.5 표로 — 1부 판이 2부를 선행으로 갖지 않게 `method-declaration` 의 선행을 `cs/call-stack` 으로 · `alternatives` 넷은 present 개념이 없어 비움 · 축 4 는 `common/boolean-value` 만(C# 엔 truthiness 가 없어 걸면 거짓이 전이된다). 새 `common/` 후보 다섯은 등록부 초안. 합류에서 `DEBT_RATCHET` 290/272/290/281.

## 검증

병합 뒤 `packages/dictionary`·`packages/course`·`packages/cards` 초록(래칫 재잠금 뒤), cargo 골든 6/6. 못 한 것: 3부 0판 · 넓히기 쿼리 없음(좁히기 캐스트만) · `_imports.scm` 의 ASP.NET 라우트 패턴이 실제 HTTP 간선을 만드는지는 인제스트를 안 돌려 미검증 · 「내 코드가 교재」 비율은 사용자 리포에 `.cs` 가 0장이라 분모가 없다.