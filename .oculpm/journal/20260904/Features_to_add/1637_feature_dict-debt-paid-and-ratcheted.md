---
schema_version: 1
type: feature
slug: "dict-debt-paid-and-ratcheted"
status: done
difficulty: high
created_at: "2026-09-04T16:37:10+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/ts/const-declaration.yaml"
    op: update
  - path: "dictionary/ts/const-declaration.scm"
    op: update
  - path: "dictionary/ts/optional-chaining.yaml"
    op: update
  - path: "dictionary/ts/optional-chaining.scm"
    op: update
  - path: "dictionary/ts/nullish-coalescing.yaml"
    op: update
  - path: "dictionary/ts/property-access.yaml"
    op: update
  - path: "dictionary/ts/array-filter.yaml"
    op: update
  - path: "dictionary/ts/array-push-mutate.yaml"
    op: update
  - path: "dictionary/ts/generics.scm"
    op: update
  - path: "dictionary/ts/async-await.scm"
    op: update
  - path: "dictionary/ts/template-literal.scm"
    op: update
  - path: "dictionary/ts/object-spread.scm"
    op: update
  - path: "dictionary/react/functional-state-update.scm"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "tests/support/quality.test.ts"
    op: update
  - path: "fixtures/ipc/tiny/captures-all.json"
    op: update
  - path: "fixtures/golden"
    op: update
  - path: "crates/parse/tests/snapshots"
    op: update
related: []
tags:
  - "dictionary"
  - "d145"
  - "d138"
  - "quality-gate"
  - "blank"
  - "why-gate"
  - "mcp-tool"
---
[x] 사전 저작 부채를 갚고 래칫으로 잠갔다 — 유형 쏠림 99.5% → 76.4% (D145)

## 추가 기능

어제 세운 부채 게이트(D145)가 찍던 네 줄을 실제로 갚았다. 생성기 코드는 한 줄도 안 고쳤다 —
사전 데이터만 채웠는데 판 유형 쏠림이 **99.5% → 76.4%** 로 내려가 목표 80.0% 를 지났다.

### 부채 표 전후

```
                                                 전       후      래칫
essential 에 blank+@hole 또는 no_hole_reason    2/23   → 23/23    2 → 23  잠김
point 가 있으면 @pick.N 3개 이상               18/26   → 25/26   18 → 25
essential 에 why_gate                           0/23   → 23/23    0 → 23  잠김
0장 후보의 one_liner 가 정답을 안 낸다 (D138)   4/6    → 6/6      3 → 6   잠김
```

셋이 대상 전량에 닿아 하드 규칙이 됐다. D138 이 「사전 린트가 실패한다」고 적은 규칙이
이제 실제로 그렇게 된다.

### 무엇이 쏠림을 내렸나

`ts/const-declaration`·`ts/optional-chaining`·`ts/array-push-mutate`·`ts/nullish-coalescing`
넷에 `blank:`+`@hole` 이 생겨 의미형에서 빈칸형으로 넘어갔고, `ts/generics` 의 `.scm` 이
`@pick.3`(호출 인자)을 내면서 지목형이 하나 섰다.

`ts/nullish-coalescing` 은 빈칸형이 이미 있었는데 보기 넷째가 `? :` 라 토큰 둘이었고
`t0-blank.ts` 의 `sameKind` 에서 매번 떨어지고 있었다(「보기 4개의 종류가 서로 다르다 20×」).
그 자리를 `?.` 로 바꿨다 — 초보가 `??` 와 가장 자주 바꿔 쓰는 것이고, 같은 물음표로
시작하는데 방향이 반대(건너뛰기 ↔ 채우기)라 진단이 날카롭다.

빈칸형을 못 내는 열여덟 개념은 `no_hole_reason` 에 사유를 적었다. 갈래는 다섯이다 —
구멍이 값 자체(리터럴·타입 인자) · 구멍이 한 글자(`.`·`?`·`:`) · 지우면 문법 오류
(`=>`·`...`) · 개념이 낱말이 아니라 모양(분해·체인·`try`/`catch`) · 바꿔 끼울 낱말이
부족(`of`↔`in`).

### 0장 누설 둘 해결

`ts/property-access`(정답 `.`)와 `ts/nullish-coalescing`(정답 `??`)의 `one_liner` 를
하는 일로 다시 썼다. 런타임이 린트와 같은 `revealsToken` 을 쓰므로 이제 두 판에서
0장 「먼저 읽기」가 열린다.

### why_gate 23편

전부 「이 줄은 **왜 이렇게 쓰였나**」를 묻는다. 답을 채점하지 않는다는 설계를 지켜
`ok` 의 `fb` 는 전부 「그 방향입니다 — 이제 …도 적어 보세요」로 자기 말 한 줄을 요구하며
끝난다. 오답 보기는 초보가 실제로 대는 이유(「빨라서」·「규칙이라서」·「그렇게밖에 못 써서」)로
골랐다. `help` 는 안 적어 `genericWhyHelp()` 를 쓰게 뒀고, 변수는 T1 블록이 채울 수 있는
넷(`site.line`·`site.text`·`file`·`file.base`)만 썼다.

## 동작 흐름 — 재료를 다시 떠야 숫자가 움직인다

품질 게이트가 읽는 것은 살아 있는 파서가 아니라 `fixtures/ipc/tiny/captures-all.json`
(러스트가 배포 사전으로 뜬 덤프)이다. `.scm` 만 고치면 게이트는 어제 숫자를 그대로 찍는다.
`cargo test -p chickadee-app --test pipeline the_shipped_dictionary_finds_sites_in_the_fixture`
로 다시 떴다 — 캡처 781 → 827.

## 쿼리에서 배운 것 둘 (실물로 확인)

- 캡처 대안 `[A B]` 에서 한 노드가 둘 다에 맞으면 **매치가 둘 난다** → 사용처가 갈라진다.
  `console.log(name)` 이 `sites: 2` 가 됐다.
- **필드 위의 `?`**(`arguments: (arguments)? @pick.3`)는 안전하지만 **필드 없는 `(_)?`** 는
  매치를 둘로 늘린다. `template-literal` 이 6캡처 → 12캡처로 갈라졌다.

그래서 `ts/call-expression` 은 못 채웠다(25/26). 짚을 자리를 넷으로 나누려면 패턴을 둘로
갈라야 하는데 서로 배제할 길이 텍스트 술어(`#not-match?`)뿐이고, 그러면 `obj["a.b"]()` ·
`(a.b || c)()` 같은 호출이 조용히 사라진다. 조용한 커버리지 손실은 이 표가 막으려는 것보다
나쁘다.

## 목록 밖에서 고친 파일 — 전부 생성물

`fixtures/golden/**` 26편(`UPDATE_GOLDEN=1`) · `crates/parse/tests/snapshots/*.snap` 7편
(`INSTA_UPDATE=always`) · `fixtures/ipc/tiny/captures-all.json`. 골든 diff 가 **+610줄 -0줄**
이라 사용처가 하나도 안 사라진 것이 증거다.

## 부모가 고쳐야 하는 것 — `packages/cards/**` 5건 (내 금지 목록)

전부 낡은 기대값이고 제품 결함은 없다. `t0-synthetic.test.ts:45`(빈칸형이라 `lines` 가 `t`
대신 `seg`) · `t0.test.ts`(옛 `one_liner` 하드코딩) · `t1.test.ts` 세 건(「번들 사전에는
`why_gate` 가 없다」는 전제가 깨졌다). 정확한 패치는 보고서 ⑪에 적었다.

## 검증

- `pnpm dict:lint` 13 통과(린트 위반 0), 부채 표 23/23 · 25/26 · 23/23 · 6/6.
- `npx vitest run tests/support/quality.test.ts` 통과, 최대 유형 76.4%(래칫 0.765).
- `cargo test -p chickadee-parse` 5스위트 · `cargo test -p chickadee-app` 16 전부 통과.
  eslint·tsc 무결. 전량 vitest 175파일 중 5 실패(위 `packages/cards`).
- 기계가 못 보는 둘은 직접 읽었다: 빈칸형 다섯의 값 주장 전량과 진단문 69개의 참·거짓.
  `for-of` 의 「속도는 거의 같습니다」 한 곳이 과했어서 고쳤다. 구워진 빈칸 판 넷은
  화면에 나갈 모양 그대로 눈으로 확인했다.