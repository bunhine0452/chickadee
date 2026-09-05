---
schema_version: 1
type: feature
slug: "evals-installed-and-first-meeting-gate"
status: done
difficulty: high
created_at: "2026-09-04T18:47:09+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "EVALS.md"
    op: create
  - path: "docs/00-overview.md"
    op: update
  - path: "apps/desktop/src/data/read-first.ts"
    op: update
  - path: "apps/desktop/src/data/read-first.test.ts"
    op: update
  - path: "apps/desktop/src/screens/session/SessionScreen.tsx"
    op: update
  - path: "packages/dictionary/src/lint.ts"
    op: update
  - path: "packages/dictionary/src/lint.test.ts"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "dictionary/ts/array-destructuring.yaml"
    op: update
  - path: "dictionary/ts/array-filter.yaml"
    op: update
  - path: "dictionary/ts/array-map-immutable.yaml"
    op: update
  - path: "dictionary/ts/arrow-function.yaml"
    op: update
related:
  - ref: "20260904/Chores/1833_chore_four-parallel-design-surveys.md"
    kind: "followup"
tags:
  - "EVALS"
  - "D149"
  - "D150"
  - "학습과학"
  - "0장"
  - "mcp-tool"
---
[x] EVALS.md 를 세우고 「먼저 읽기」를 첫 만남으로 넓혔다 — 학습과학이 두 결정을 갈랐다 (D149·D150)

## 추가 기능

사용자가 「인간의 학습력 조사를 근거로 네 판단하에 모든 계획을 진행해」라고 했다. 조사한 셋이 결정을 실제로 갈랐고, 등록부 **D149~D153** 다섯 행을 올린 뒤 앞의 둘을 구현했다.

## 조사가 바꾼 것 셋

| 문헌 | 우리 결정 |
|---|---|
| **간격 효과** — 같은 날 몰아친 반복은 즉시 성능만 올리고 장기 파지는 안 올린다 | EVALS 의 **L2 = 0.000 을 「실패」에서 「표본 미달」로 고쳤다.** 규칙이 틀린 것이 아니라 규칙이 옳게 돈 결과다 — 하루에 몰린 복습에 겹을 안 준 것이 정확한 행동이다 |
| **완성 예제 효과와 역전** — 초보는 완성 풀이를 먼저 보는 편이 낫고 숙련되면 역전되어 해롭다. 페이딩이 특히 효과적 | **D150** 의 근거. 「겹 0」이 숙련도의 대리 지표이고 「개념당 한 번」이 곧 페이딩이다 |
| **추적 → 설명 → 쓰기**(BRACElet) + notional machine | **D151** 의 근거. 우리는 T0 어휘 → T1 **필사(=쓰기, 가장 위층)** → T2 구조라 **추적이 통째로 없다.** 이건 개념 몇 개가 빠진 게 아니라 순서가 뒤집힌 것이다 |

셋째가 가장 무겁다. `EVALS.md` 의 L5 가 「t1·t2 원장 0건」을 찍는 것이 스케줄러 설정 탓만은 아닐 수 있다 — 순서가 뒤집혀 있으면 표본이 안 차는 것이 정상이다.

## D149 — `EVALS.md`

fork 가 낸 초안(ocul-pm 규격 준수, 네 스위트)에 셋을 고쳐 설치했다.

- **L2 재해석** — 위 표 첫 줄. 실패가 아니라 표본 미달이고, 그런 원장이 생겼는데도 낮으면 그때는 원인이 규칙이 아니라 재출제 간격(L9)에 있다고 적었다.
- **G10 정정** — fork 는 「실패 예상·미측」으로 뒀는데 내가 실제로 돌려 보니 맞았고, 재생성해서 통과 상태로 만들었다. 두 번 돌려 해시가 같아 결정적임을 확인했다.
- **「지표를 고른 근거 — 학습과학」 절 신설** — 문헌 셋과 우리 지표를 잇는 표. 지표를 발명하지 않았다는 것을 보이는 자리다.

## D150 — 「먼저 읽기」를 첫 만남으로

게이트를 「0장 소속」에서 **「그 개념의 겹이 0」**으로 옮겼다.

- `loadZeroChapterConcepts`(대지를 훑음) → `loadFirstMeetingConcepts`(`queue.known_rows` 의 `COALESCE(m.layer,0)` 를 그대로 씀). **새 statement 0장** — 그 문장이 이미 개념 전량의 겹을 준다. `packages/concepts` 의 `knownSet`(겹 ≥ 1 이면 아는 것)과 **같은 선**을 쓴다.
- 세션 머리에서 한 번만 긷는다. 겹은 하루 최대 +1(D3)이라 도중에 바뀌어도 그 판은 이미 첫 만남이었다.
- **린트도 함께 넓혔다** — 안 넓히면 부채 표는 초록인데 화면이 정답을 흘린다. `zero-one-liner` 의 대상을 「0장 후보(깊이 ≤ 2)」에서 **`essential` 전량**으로.

실측으로 넷이 걸렸다(fork 는 6을 예측했는데 실제는 4다): `array-filter`(`filter`) · `array-map-immutable`(`map`) · `arrow-function`(`=>`) · 그리고 `array-destructuring` 은 **영문 관사 `a` 가 정답 토큰과 겹쳤다.** 넷 다 하는 일로 다시 쓰고 래칫을 18 → **26** 으로 올려 잠갔다.

**곁다리로 죽은 코드 둘을 지웠다** — `lint.ts` 의 `ZERO_CHAPTER_DEPTH` 와 `depthWithin`. 대상이 깊이가 아니라 소속으로 정해지니 죽었고, `zero-chapter.ts` 의 상수를 여기 복사해 두던 **동기화 부담도 같이 사라졌다**(오늘 아침 그 복사본이 낡아 있던 바로 그 자리다).

## 검증

`pnpm typecheck` 무출력 · `pnpm lint` 무출력 · **TS 전체 1,981건 / 177 파일 전량 통과** · 부채 표 네 줄 전부 래칫에 잠김(31/31 · 31/32 · 31/31 · 26/26).

## 남은 것

D151(`exec/*`) · D152(파이썬) · D153(`arch/growth`)는 등록부 행만 섰고 구현이 남았다. 셋 다 오늘 TS 여덟 짝에 든 것과 같거나 큰 저작량이라 한 번에 밀어 넣지 않는다.