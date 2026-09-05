---
schema_version: 1
type: chore
slug: "abolish-zero-chapter-cap"
status: done
difficulty: medium
created_at: "2026-09-05T19:00:45+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/concepts/src/zero-chapter.ts"
    op: update
  - path: "packages/concepts/src/zero-chapter.test.ts"
    op: update
  - path: "packages/concepts/src/index.ts"
    op: update
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/curriculum/README.md"
    op: update
  - path: "apps/desktop/src/screens/home/data.ts"
    op: update
related: []
tags:
  - "0장"
  - "프롤로그"
  - "사용자 결정"
  - "D184"
  - "mcp-tool"
---
[x] 프롤로그 상한 24 폐지 (D184)

사용자 결정 「프롤로그 상한선 없애」. 열 언어 0부 세션 셋(I3·I4·I5)이 독립적으로 같은 벽에 부딪혔던 것 — 후보가 py·java 34 · ts 32 · swift 29 · cpp 28 로 전부 `ZERO_CHAPTER_MAX = 24` 를 넘친다.

## 무엇을 지웠고 무엇을 남겼나

- 지움: `ZERO_CHAPTER_MAX` 상수, `zeroChapterPlates` 의 `.slice(0, MAX)`, D156 시험 「상한이 조용히 넘치지 않는다」.
- 남김: `ZERO_CHAPTER_MAX_DEPTH = 2` — 이제 이것이 「바닥」의 **유일한 정의**다(뿌리 + 두 단). D137 「예고할 자리가 없으면 만들지 않는다」와 `isDone` 조건 셋도 그대로.

## 왜 D156 시험을 살리지 않고 지웠나

그 시험의 전제는 「후보가 상한을 넘으면 `.slice` 가 자르고, 동점을 가르는 넷째 키가 알파벳순이라 **이름이 프롤로그를 정한다**」였다. 자르지 않으니 전제가 통째로 사라진다. 살려 두면 무엇을 지키는지 모르는 시험이 된다. 대신 실제 사전 크기로 「언어마다 판 수 = essential ∧ 깊이 ≤ 2 인 개념 수」를 못박았다 — 누가 상한을 다시 넣으면 여기서 걸린다.

## 「끝이 있다」는 어떻게 지켜지나

파일 머리가 「상한과 `isDone` 이 일반 튜토리얼로의 변질을 막는 유일한 방벽」이라고 적혀 있었다. 상한을 빼면 방벽이 하나 준다는 뜻이다. 그러나 끝은 여전히 둘이 정한다 — essential 은 `_lang.yaml` 이 열거하는 **유한 집합**이고, `isDone` 은 그대로다. 변질을 막는 실제 방벽은 상수가 아니라 **D137**(리포에 예고할 자리가 없는 개념은 안 들어온다)이었다. 머리글을 그렇게 고쳤다.

## 대가 — 사용자에게 보고할 것

첫 기능 챕터까지의 날수가 **언어마다 다르다**: py·java 17일 · ts 16일 · go 11일(D12 하루 2장). 그 수는 이제 상한이 아니라 커리큘럼 문서 §1.5 가 정한다. 판 수는 세지만 강제하지 않는다 — D181 이 Rust 줄 수에 한 것과 같은 태도.

## 부수로 답이 된 것

README §12 미결 3 「0부를 0장에 넣을지」 → 넣는다(상한 경쟁이 없다). 규약 8 「0부 12장 상한」은 근거(24에서 여덟을 뺀 자리)가 사라졌는데 **숫자는 남겼다** — 저작 규모 상한으로 재근거화했다. 그 재근거화는 내 판단이라 보고에 적는다.

## 검증

`zero-chapter.test.ts` 24 통과 · `pnpm typecheck`·`pnpm lint` 무출력 · 전체 `test:unit` 통과.

## 손대지 않은 것

`docs/curriculum/<lang>.md` 의 「상한 24」 언급 — 같은 시간에 J1~J4 세션이 그 파일들을 쓰고 있어 충돌을 피했다. 세션이 끝난 뒤 통합에서 고친다.