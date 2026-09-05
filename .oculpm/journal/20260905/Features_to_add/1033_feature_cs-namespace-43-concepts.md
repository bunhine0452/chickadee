---
schema_version: 1
type: feature
slug: "cs-namespace-43-concepts"
status: done
difficulty: high
created_at: "2026-09-05T10:33:10+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/cs/"
    op: create
  - path: "dictionary/ts/"
    op: update
  - path: "dictionary/py/"
    op: update
  - path: "packages/dictionary/src/load.ts"
    op: update
  - path: "packages/dictionary/src/lint.ts"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "packages/cards/src/t0-proto.test.ts"
    op: update
  - path: "packages/concepts/src/new-rank.test.ts"
    op: update
  - path: "docs/curriculum/cs.md"
    op: update
  - path: "docs/00-overview.md"
    op: update
related: []
tags:
  - "dictionary"
  - "cs"
  - "D157"
  - "D167"
  - "lint"
  - "mcp-tool"
---
[x] 기초 CS 사전 `cs/` 43장 — 문법 아래의 기계에 파일이 생겼다 (D167)

## 추가 기능

D157 이 설계한 `cs/` 네임스페이스에 **실물 43장**이 났다. 그동안 `docs/curriculum/cs.md` 에
표로만 있었고 `dictionary/cs/` 디렉터리 자체가 없었다 — `COMPUTED_NAMESPACES` 에 `'cs/'` 는
D159 가 이미 넣어 둬서 **린트는 통과하는데 잴 것이 없는** 상태였다.

- **43장** = §3~§5 의 33 + §10.2 의 10. §10.3 이 보류로 적은 `cs/search-tree` 는 안 만들었다.
- 껍데기는 `exec/order.yaml` 그대로 — `universal: null` · `grammars: []` · `queries: []` ·
  `track_default: t0` · `essential: false`. 새 트랙도 새 `card.kind` 도 마이그레이션도 없다.
- 문항은 **뜻 고르기 하나뿐**. 지목형은 짚을 자리가, 빈칸형은 뚫을 구멍이 있어야 하는데
  기계에는 둘 다 없다 (`proto/` 와 같은 이유). `misconceptions` 는 개념마다 셋.
- **템플릿 변수를 안 썼다.** `{{site.line}}` 은 빌린 창의 줄이라 그 줄이 그 기계를 짚는다는
  보장이 없다 — `ts/arithmetic` 의 창을 빌린 `cs/floating-point` 는 그 줄이 `+` 하나일 수 있다.
  창은 판에 그대로 뜨고(`payload.lines`) 문장은 기계를 묻는다.

`dictionary/schema/concept.schema.json` 은 재생성해도 한 글자도 안 바뀌었다 (D157 §7 의 예측대로).

## 동작 흐름

**사용처 빌림 (D157 ②)** — `cs/` 는 캡처가 없으므로 자기를 `prereq` 로 가리키는 언어 개념의
창에 얹힌다. 언어 쪽에서 간선을 걸었다: `ts/*` 20편 · `py/*` 5편.

```
ts/array-basics.prereq += cs/value-vs-reference · cs/contiguous-vs-linked
ts/array-push-mutate   += cs/aliasing        ts/arrow-function += cs/closure-capture
ts/undefined-null      += cs/null-reference  ts/for-of · py/while-loop += cs/complexity
```

`ts/optional-chaining` 은 직접 간선을 뺐다 — `ts/undefined-null` 을 이미 선행으로 갖고 있어
전이로 닿고, 직접 걸면 `t0.test.ts` 의 사다리 재료 골든(A1 범위)이 깨진다.

**16장은 아직 빌릴 창이 없다** (주소 계열 넷 · `stack-and-heap` · `hash-table` · SQL 계열 여섯 등).
결함이 아니다 — cs.md §2 ③이 「빌릴 창이 없으면 그 개념은 안 뜬다」고 정했고, C·Rust·SQL 사전이
들어오면 그쪽에서 선다. 지금 사전이 `ts`·`py`·`java` 뿐이라 그렇다.

**린트가 잡는 것**은 「빌려 준다고 적어 놓고 빌려 줄 창이 없는」 경우다 — 가리키는 쪽이 전부
쿼리 없는 개념이면 얹힐 자리가 영영 안 생긴다.

**c-lint** — cs.md §7 표 중 남아 있던 것은 `load.ts` 주석 하나뿐이었다(`dict.test.ts`·`lint.ts` 는
D159 가 `isComputed` 로 이미 모았다). D145 의 「`essential` 이면 `blank`+`@hole`」은 쿼리 없는
네임스페이스에서 `@hole` 을 **가질 수 없어** 통과 길이 `no_hole_reason` 하나뿐이고, 그것이 맞다 —
`authoringDebt` 에 그 이유를 적었다. 래칫은 안 내렸다.

## 검증

- `pnpm dict:lint` **15/15** — 새 시험 둘 포함(cs/ 껍데기 43장 전량 · 빌려 줄 창이 있는가).
- `pnpm vitest run packages/dictionary packages/cards/src/t0-proto.test.ts packages/concepts/src/new-rank.test.ts`
  **80/80**. 빌린 창을 지어 `genMeaning` 에 넣으니 **43장 전부가 판으로 나온다 — 드롭 0**,
  보기 넷 · 진단 셋이 전량 성립. `siteCount: 0` 인 `cs/*` 가 D154 가지를 통과하고 어휘 뒤에 선다.
- `pnpm typecheck` 오류 0 · `pnpm lint` 무출력 · `pnpm dict:schema` 재생성 후 diff 없음.
- `pnpm test:unit` **2178/2179** — 남은 하나는 `packages/grading/src/t1.test.ts` 의 성능 예산
  (0.383ms/줄 vs 0.2)이고 **단독으로 돌리면 통과한다**(48/48). 병렬 세션 여섯이 같은 기계를
  쓰는 동안의 부하다. `packages/cards/src/t2-perf.test.ts` 도 같은 이유로 한 번 흔들렸고
  단독 3/3 통과.