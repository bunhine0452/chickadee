---
schema_version: 1
type: feature
slug: "java-bottom-three"
status: done
difficulty: high
created_at: "2026-09-04T22:48:00+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/common/class-definition.yaml"
    op: create
  - path: "dictionary/java/class-declaration.yaml"
    op: create
  - path: "dictionary/java/class-declaration.scm"
    op: create
  - path: "dictionary/java/method-declaration.yaml"
    op: create
  - path: "dictionary/java/method-declaration.scm"
    op: create
  - path: "dictionary/java/if-statement.yaml"
    op: create
  - path: "dictionary/java/if-statement.scm"
    op: create
  - path: "dictionary/java/_lang.yaml"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
related:
  - ref: "20260904/Features_to_add/2230_feature_vue-sfc-script-ranges.md"
    kind: "followup"
tags:
  - "D156"
  - "D159"
  - "java"
  - "사전"
  - "래칃"
  - "MonggleMonggle"
  - "mcp-tool"
---
[x] Java 99파일이 파싱만 되고 카드가 안 나오던 것 (D156 · `docs/curriculum/java.md` §2)

## 추가 기능

바닥 여덟 중 **셋**을 담았다 — `class-declaration` · `method-declaration` · `if-statement`.
조사가 설계해 둔 「이 언어라서 다른 것」을 그대로 근거로 썼다.

| 개념 | 자바라서 다른 것 |
|---|---|
| `class-declaration` | **상자 밖에는 코드를 못 둔다.** 그리고 `public` 상자 이름은 파일 이름과 같아야 한다 |
| `method-declaration` | 「함수다」라고 여는 낱말이 **없다** — 그 자리를 돌려줄 종류가 대신하고, **비울 수 없다**(`void` 도 적어야 한다) |
| `if-statement` | 조건 자리에 **참·거짓 말고는 못 온다.** `if (list)`·`if (count)` 가 전부 컴파일이 멈춘다 |

새 보편 개념 `common/class-definition` 도 함께 세웠다(설계가 「신규」로 표시해 둔 것).

## 실리포에서 확인한 것

`MonggleMonggle` 의 `BACK/src/main/java` **98파일 전부 `quality: ok`**(poor 0), T0 사용처 **283곳** —
클래스 108 · 메서드 118 · 조건문 57. Spring 백엔드가 가르칠 수 있게 됐다.

## 설계에서 하나 바꿨다 — 빈칸의 정답은 고정 낱말이어야 한다

`docs/curriculum/java.md` 는 `method-declaration` 의 요점을 「돌려줄 타입이 이름 앞에」로 잡았고
자연히 그 타입이 구멍이 된다. 그런데 **`t0-blank.ts:50` 이 「첫 보기가 구멍 원문과 다르면 카드를
버린다」**고 검사한다 — 타입은 사용처마다 다르므로(`void`·`int`·`ResponseEntity<LoginResponse>`)
보기 넷을 사전에 고정할 수 없다. 그래서 `no_hole_reason` 으로 갔고(이미 20개 개념의 선례가 있다),
같은 것을 짚기와 뜻으로 낸다. **`variable-declaration` 도 같은 이유로 다음 판에서 이 판단이 필요하다.**

## 린트가 다섯 번 잡았다

한 번에 통과하지 못했고, 걸린 것이 전부 규칙이 있는 자리였다.

1. **조사 필터** — 변수 뒤 조사는 `|josa:` 로. 네 곳.
2. **`one_liner.en` 80자** — 이건 **린트가 아니라 스키마**라 개념이 통째로 드롭됐다.
   `essential-exists` 가 그 결과로 실패했고, 파일은 멀쩡한데 사전에 안 실려 한참 헤맸다.
   `load.ts` 가 「스키마를 어긴 개념은 건너뛰고 기록한다」고 적어 둔 그대로다 — `problems` 를 찍어 보고 알았다.
3. **금칙어** — `wrong|incorrect|failed`. 영문에 「right and wrong」이 있었다.
4. **`expect.hole: null`** — 스키마가 `optional` 이지 `nullable` 이 아니다. 키를 빼야 한다.
5. **조사 뒤 관형사** — `{{…|josa:은,는}} 이 일의` 에서 「이」를 조사로 봤다. 「그 일에 붙인」으로 고쳤다.

## 부채 래칫을 올려 잠갔다

**39/37/39/33 → 42/40/42/36.** 넷 중 셋이 대상 전량이라 하드 규칙이고, 새 개념 셋이 그 전량을 늘렸다.

## 검증

`pnpm test:unit` **180파일 / 2,038건 전량 통과** · `cargo test --workspace` 19개 스위트 전부 ok
(사전 시험이 예시를 **진짜 문법에 돌려** 검증) · `pnpm dict:lint` 13/13 · `typecheck`·`lint` 무출력 ·
Rust 예산 2,405/2,800(안 바뀜 — 이 판은 전부 사전이다).

## 남은 것

바닥 여덟 중 다섯 — `variable-declaration` · `assignment` · `arithmetic` · `boolean-literal` ·
`comparison`. `variable-declaration` 은 위의 구멍 문제를 다시 만난다.
그리고 `docs/curriculum/java.md` §3 의 중심 16개(`static`·`access-modifier`·인터페이스·제네릭 소거 …)가
Spring 코드를 읽는 데 실제로 필요한 것들이다.