---
schema_version: 1
type: feature
slug: "canon-opens-to-first-time-programmers"
status: done
difficulty: medium
created_at: "2026-09-04T17:07:22+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/00-overview.md"
    op: update
  - path: ".oculpm/discussion/vibe-code-study-app/discussion.md"
    op: update
  - path: "README.md"
    op: update
  - path: "packages/concepts/src/zero-chapter.ts"
    op: update
  - path: "packages/concepts/src/zero-chapter.test.ts"
    op: update
  - path: "packages/dictionary/src/lint.ts"
    op: update
  - path: "packages/dictionary/src/lint.test.ts"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "dictionary/ts/array-basics.yaml"
    op: update
  - path: "dictionary/ts/optional-chaining.yaml"
    op: update
  - path: "apps/desktop/src/flow.test.tsx"
    op: update
related: []
tags:
  - "정본"
  - "0장"
  - "D147"
  - "사전"
  - "mcp-tool"
---
[x] 정본이 프로그래밍 초보를 대상에 넣었다 — 0장 8 → 24판, 깊이 1 → 2 (D147)

## 추가 기능

사용자 결정으로 정본 §1 의 「프로그래밍이 완전히 처음인 사용자는 대상이 아니다」를 연다. 등록부 **D147** 이 먼저 올라갔고(§4.2.1), 그 다음 정본·README·코드 순으로 내려왔다.

사용자 답 셋 (물어서 받음):
1. **입문은 0장 확장으로** — 새 대지·새 트랙을 만들지 않는다. 정본 §4 「별도 입문 과정을 만들지 않는다」가 유지된다.
2. **첫 실행에서 한 번 묻는다** — 방안 E-5 의 「묻지 않는다」가 이 한 문항에 한해 뒤집힌다. 배치고사는 여전히 폐기 상태다(§9 에 그 구분을 적어 뒀다).
3. **설명은 0장 판에만** — D138 의 범위를 늘어난 판에 그대로 적용하고 그 밖의 판은 안 건드린다.

## 동작 흐름

- `ZERO_CHAPTER_MAX` 8 → **24** (하루 새 판 2장이라 4일 → 12일). 이것은 길이가 아니라 **천장**이다 — 그 언어를 이미 아는 사람은 `isDone` 둘째 조건(뿌리 4장 중 3장)으로 네댓 장에서 빠져나간다.
- `ZERO_CHAPTER_MAX_DEPTH` 1 → **2**. 고르는 근거는 안 바뀌었다(후보가 상한 언저리에 오게 두어 「무엇을 자를까」가 임의가 되지 않게).
- `isDone` 에 `declaredNewcomer` 를 더해 **둘째 조건을 끈다**. 안 그러면 초보가 뿌리 넉 장을 운으로 맞혀 12일치 프롤로그가 나흘에 닫힌다.
- `lint.ts` 의 `ZERO_CHAPTER_DEPTH` 복사본도 2 로. 그 파일 주석이 「값을 고칠 때는 두 파일을 함께 고친다」고 적어 뒀는데 실제로 어긋나 있었다 — 시험이 통과한 것은 복사본이 낡아서였다.

## 이 변경이 만든 부채와 그 자리에서 갚은 것

깊이가 2 가 되며 **0장 후보가 6 → 11** 로 늘었고, 새로 든 둘이 D138 을 어겼다 (0장 판은 문제보다 `one_liner` 를 먼저 읽히므로 정답 토큰을 글자로 내면 안 된다):

- `ts/array-basics` — 「첫 자리는 0 번이다」가 정답 `0` 을 냈다. 세는 법이 곧 문항이므로 숫자를 빼고 「번호는 맨 앞자리부터 센다」로.
- `ts/optional-chaining` — `a?.b` 를 글자로 적어 정답 `?.` 을 냈다. 하는 일로 다시 썼다.

두 `en` 이 `one_liner` 의 **태그 뺀 80자 상한**에 걸려 한 번 되돌아갔다(스키마가 파일을 통째로 떨구면서 부채 표의 대상 수가 23 → 21 로 줄어 다른 규칙이 먼저 빨개졌다). 줄여서 78·59 자로 맞췄다.

D145 규칙대로 다 채운 규칙은 래칫을 올려 잠갔다 — `zero-one-liner` 6 → **11 (11/11)**. 이제 이 규칙은 D138 이 요구한 하드 실패다.

## 아직 안 된 것

`declaredNewcomer` 를 **넘겨주는 쪽이 없다** — `isDone`(`zeroChapterDone`) 은 아직 앱에서 불리지 않는다. 첫 실행 문항 UI·설정 저장·`firstRun.scope` 와 `home.newcomerBody` 문구 교체, 그리고 바닥 개념 사전(조건문·함수 정의·`return`·비교·재대입·반복문)이 전부 남았다. 지금 문구는 아직 「대상이 아니다」라고 말하므로 **정본과 앱이 어긋난 상태**다. 플랜 `chickadee-v05-first-time-programmers` 로 옮겼다.

## 검증

`pnpm typecheck` 무출력 통과 · `pnpm dict:lint` 통과(부채 표 4행, `zero-one-liner` 11/11 잠김) · 전체 단위 시험 1,975건 중 1,974 통과. 유일한 실패 `T2 성능 > 24 노드 배치가 5ms 안에`는 **단독 실행 시 통과**하는 기존 타이밍 플레이크이고 이 변경과 무관하다(같은 성격으로 `catalog > 아무도 안 쓰는 키가 없다`도 전체 실행에서만 빨개졌다가 단독으로 통과 — `plate.foldMore` 는 D141 접기 작업 것이다).

고친 시험 셋은 전부 D147 이 바꾼 값을 못박고 있던 것들이다 — 0장 상한 8, 깊이 상한 1(두 곳), 그리고 `flow.test.tsx` 의 「첫 대지가 `cart`」(이제 프롤로그가 그 앞에 선다).