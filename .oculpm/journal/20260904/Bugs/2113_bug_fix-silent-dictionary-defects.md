---
schema_version: 1
type: bug
slug: "fix-silent-dictionary-defects"
status: done
difficulty: high
created_at: "2026-09-04T21:13:07+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/dictionary/src/schema.ts"
    op: update
  - path: "packages/dictionary/src/lint.test.ts"
    op: update
  - path: "dictionary/schema/concept.schema.json"
    op: update
  - path: "dictionary/ts/_lang.yaml"
    op: update
  - path: "dictionary/py/_lang.yaml"
    op: update
  - path: "dictionary/react/_lang.yaml"
    op: update
  - path: "dictionary/py/arithmetic.scm"
    op: update
  - path: "dictionary/py/arithmetic.yaml"
    op: update
  - path: "dictionary/py/_blocks.scm"
    op: update
  - path: "packages/concepts/src/ingest.ts"
    op: update
  - path: "packages/concepts/src/derive.ts"
    op: update
  - path: "packages/concepts/src/derive.test.ts"
    op: update
  - path: "packages/concepts/src/zero-chapter.test.ts"
    op: update
  - path: "packages/cards/src/t1-block.ts"
    op: update
  - path: "apps/desktop/src/session-flow.ts"
    op: update
  - path: "crates/parse/tests/dictionary.rs"
    op: update
  - path: "docs/curriculum/README.md"
    op: update
related:
  - ref: "20260904/Chores/2054_chore_ten-language-curriculum-and-cs-dictionary.md"
    kind: "followup"
tags:
  - "D156"
  - "D157"
  - "grammar_abi"
  - "사전"
  - "tree-sitter"
  - "0장"
  - "mcp-tool"
---
[x] 열 언어 조사가 찾은 결함을 고치고, 같은 것이 다시 조용히 들어오는 것을 막는다

## 발생 원인

D156 조사(열 언어 병렬 세션)가 아홉을 찾았고 **넷이 「안 터지고 조용히 틀린다」**였다.
안 터지니 시험도 없었고, 시험이 없으니 틀린 채로 살았다.

## 해결 방법

### 고친 다섯

**① `grammar_abi` 가 한 언어에 하나였다.** `ts` 는 문법 셋(`typescript`·`tsx`·`javascript`)을 물고 있고
실제 ABI 는 **14·14·15** 로 갈리는데 `15` 하나가 적혀 있었다. `py/_lang.yaml` 의 주석이
「ts 는 15」라고 적어 **틀린 값을 정답으로 박아** 두고 있었다.
값을 정하는 것은 언어가 아니라 `Cargo.lock` 이 고정한 크레이트다 —
`tree-sitter-go` 0.23.4 는 14 인데 master 는 15, `tree-sitter-c-sharp` 은 0.23.1 이 14 · 0.23.5 가 15 다.
→ 스키마를 `z.record(grammarSchema, …)` 로 바꾸고 `_lang.yaml` 셋을 문법별 표로.
사전 판 캐시 키(`ingest.ts`)는 **키를 정렬해** 넣는다 — 객체 순서가 흔들리면 같은 사전이 다른 해시를 얻는다.

**② `py/arithmetic.scm` 이 `//` 를 잡는데 `rule` 은 「나누기는 늘 소수를 낸다」였다.**
`a // b` 사용처에 카드가 뜨면 학습자가 **그 자리에서 거짓인 규칙**을 읽는다. 이 개념이 자리를 번
근거가 바로 그 문장(D152)이라 규칙을 무르는 대신 쿼리에서 뺐다. yaml 도 `//` 를 이미
「버림은 기호가 따로 있다」는 **대조**로 쓰지 사례로 쓰지 않는다. `pages = total // size → expect: none`
예시로 못박았다(`assignment` 의 `obj.attr = 1` 과 같은 자리).
타입 문제(`"a" + "b"`·`[0] * n`·`"%s" % x` 를 셈하기로 잡는 것)는 **반쯤 고치지 않았다** —
노드 종류를 부정하는 문법이 쿼리에 없고 텍스트 술어로 흉내 내면 `f"…"` 에서 다시 샌다. 한계로 적었다.

**③ `py/_blocks.scm` 이 `function_definition` 에 붙어 데코레이터 줄이 블록 밖이었다.**
tree-sitter-python 에서 `@app.get(...)` 은 `decorated_definition` 의 자식이라 FastAPI 라우트 줄이
T1 창에서 잘렸다. `decorated_definition` 패턴 둘을 더했는데, 그러면 한 정의가 **안팎 둘**에 걸린다 —
쿼리에 「부모가 X 가 아닌 것」이 없다. `derive.ts` 가 **「끝과 이름이 같으면 바깥만 남긴다」**로 접는다.
클래스와 그 안의 메서드는 끝이 같아도 **이름이 달라 안 접힌다** — 그 둘은 일부러 겹치는 블록이다.

**④ `grammarOf()` 가 확장자 표를 좁게 복사해 모르면 `typescript` 로 폴백했다.**
`py/_lang.yaml` 은 처음부터 `python: [.py, .pyi]` 인데 `grammarOf` 는 `.py` 만 봤다 —
**`.pyi` 스텁이 오늘 이미 TypeScript 로 파싱되고 있었다.** 표로 바꾸고 `.pyi` + 새 언어 여덟을 넣었다.
`.h` 는 `c` 로 두고 리포 단위 판정은 인제스트에 맡긴다고 적었다.

**⑤ `commentPrefix()` 가 파이썬 아니면 전부 `//` 였다.** SQL 은 `--` 라 「이어서」 헤더가
주석이 아니라 구문 오류로 붙는다. `isContinuedHeader` 의 패턴도 함께 넓혔다.

그리고 `grammarSchema` enum 에 **`c`·`cpp`·`java`·`c_sharp`** 를 더했다 — 이 넷이 없어 D156 의
열 언어 중 넷이 로드 단계에서 막혀 있었다.

### 세운 방벽 둘

**`declared_grammar_abi_matches_the_linked_grammar`** (`crates/parse/tests/dictionary.rs`) —
`_lang.yaml` 의 `grammar_abi` 를 `languages()` 가 보고하는 실제 `abi_version()` 과 대조한다.
Rust 는 앱에서 YAML 을 안 읽지만(D40) 시험은 예산 밖이고, **문법과 선언을 둘 다 볼 수 있는 유일한 자리**다.

**0장 후보가 상한을 안 넘는다** (`packages/concepts/src/zero-chapter.test.ts`) —
언어마다 `essential` 중 선행 깊이 ≤ 2 를 세어 `ZERO_CHAPTER_MAX` 와 견준다.
넘으면 `.slice(0, 24)` 의 넷째 키가 **`conceptId` 알파벳순**이라 이름이 프롤로그를 정한다.

## 안 고친 것과 그 이유

- **SQL `:name` 자리표가 `binary_expression(field, ERROR, field)` 로 파싱되는 것** —
  `dictionary/sql/` 이 아직 없어 고칠 쿼리가 없다. `sql/comparison` 을 쓸 때의 제약으로 `sql.md` §8 에 남는다.
- **`in_error` 가 조상을 넷까지만 보는 것**(`query.rs:171`) — 깊이를 늘리면 전 언어 인제스트 비용이 바뀐다. 별도 결정.
- **`ZERO_CHAPTER_MAX` 숫자** — 오늘 아무것도 안 넘친다(py 8 · ts 21). 24판 = 12일이고 30판이면 15일이라
  **교육 판단이지 버그가 아니다.** 넘치는 순간 시험이 걸리게 해 뒀으니 결정을 미루되 조용히 지나가지는 않는다.
- **`framework:` 필드에 소비처가 없는 것** — `detect` 를 무엇으로 넓힐지(Swift 는 `import SwiftUI`, Java 는 Maven)가 먼저다.

## 검증

`pnpm test:unit` **179 파일 / 2,016건 전량 통과**(2,013 → 2,016, 새 시험 셋) ·
`cargo test --workspace` 전량 통과(사전 시험 5 → 6) · `pnpm typecheck`·`pnpm lint` 무출력 ·
`pnpm dict:lint` 13/13 · `scripts/check-rust-budget.sh` 2,352/2,800.

**방벽이 진짜 잡는지 증명했다** — `ts/_lang.yaml` 을 옛 값(`15` 셋)으로 되돌리니
`ts/_lang.yaml: typescript 의 grammar_abi 가 Some(15) 인데 링크된 문법은 14 다` 로 실패했고,
되돌리니 통과했다. 0장 방벽도 헛돌지 않는다 — 실제로 `py 8/24 · ts 21/24` 를 세고 있고
이 수치는 D156 조사의 TS 21/24 와 같다.

무관한 기존 플레이크 하나를 발견했다 — `tests/support/source-bytes.test.ts` 가 `.seed` 를
`SKIP_DIRS` 에 안 넣어, 다른 시험이 시드 DB 를 쓰는 동안 나타났다 사라지는 `ui.sqlite-journal` 에
`ENOENT` 로 걸린다. 재실행하면 통과한다. 내 변경과 무관해 손대지 않았다.