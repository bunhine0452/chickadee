---
schema_version: 1
type: feature
slug: "course-builder"
status: done
difficulty: medium
created_at: "2026-09-05T08:24:44+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/concepts/src/course.ts"
    op: create
  - path: "packages/concepts/src/course.test.ts"
    op: create
  - path: "packages/concepts/src/index.ts"
    op: update
related:
  - ref: "20260905/Features_to_add/0816_feature_same-package-edges-and-one-step-up.md"
    kind: "followup"
tags:
  - "D162"
  - "코스"
  - "실측"
  - "MonggleMonggle"
  - "mcp-tool"
---
[x] 기능 여덟을 챕터 여덟으로 세우고 순서를 매긴다

## 순서를 바꾼 이유 — 재 보고 바꿨다

다음 일로 「`entryUnits` 원소를 바이트 범위로」를 잡아 뒀다. **재 보니 그 문제가 없다.**

auth 챕터는 23파일 **1,324줄**이고 가장 큰 파일이 `authStore.js` 187줄이다.
`LandingView.vue`(1,527줄)는 **아예 안 들어 있다** — R1(D163)이 한 단만 올라가서다.
첫 챕터 설계 세션이 파일을 손으로 나열하며 본 문제였고, 실제 알고리즘은 그것을 안 담는다.
전 챕터가 276~4,163줄로, 코스 챕터로 읽을 만한 크기다. **그래서 바이트 범위를 미루고
코스를 실물로 만드는 쪽으로 갔다.**

## 추가 기능

`buildCourse(units, opts)` — 새로 여는 파일이 적은 순으로 챕터를 세운다.
앞 챕터가 이미 연 파일은 다시 안 센다(뼈대를 작은 데서 보고 그 위에 쌓는다).

```
자동:      image 6 · ranking 9 · auth 23 · fortune 23 · dreamResult 28 · dream 32 · monthlyAnalysis 35 · notice 35
auth 고정: auth 23 · image 6(새로 3) · ranking 9 · fortune 23 · …
```

## 이 판의 진짜 내용 — 지표 셋이 다 틀렸다

`course.md` §2 는 **로그인을 1번으로 고정**하자고 했다. 근거는 「나머지 일곱이 컨트롤러 첫 줄에서
`SecurityUtil.getCurrentUserId()` 를 부르므로 로그인을 모르면 그 줄이 안 읽힌다」였다.
그것을 그래프 지표로 재현하려고 셋을 시도했고 **셋 다 다른 챕터를 골랐다.**

| 지표 | 1번으로 고른 것 |
|---|---|
| 겹치는 파일 수 | `dreamResult` |
| 밖 → 안 간선 수 | `dreamResult` |
| 공유 비율 | `dreamResult` |

진단이 수치에 있었다 — **`dreamResult` 는 28파일 중 자기 것이 3장뿐**(공유 0.89)이다.
남의 것에 얹힌 얇은 기능이라 세 지표에서 다 이겼다. auth 는 23 중 13이 자기 것(0.43)이다.

**셋 다 「내가 남에게 의존하는 정도」를 재고 있었다.** 「남이 나에게 의존하는 정도」는 폐포
의미론에서 잴 수가 없다 — `SecurityUtil`(7챕터)·`api.js`(8챕터) 같은 공유 부품에 **주인이 없기**
때문이다. 여덟 챕터가 다 자기 파일이라고 하므로 「밖에서 들어오는 간선」이 성립하지 않는다.

그래서 지표를 더 만들지 않고 **사람이 고정하는 문**(`opts.first`)을 뒀다. 그래프가 못 보는
판단이 들어오는 자리를 하나로 모은 것이고, 그 사실을 코드 주석에 근거와 함께 적었다.

## 검증

`pnpm test:unit` **180파일 / 2,054건 전량 통과**(두 번 연속, 새 시험 5) ·
`cargo test --workspace` 19개 스위트 ok · `typecheck`·`lint` 무출력.

## 남은 것

`docs/program/README.md` §7 의 넷 — `chapter`·`stage_log` 두 표(코스가 저장될 곳) ·
`appeal.track` 확장 · 문항 체계 16유형 · `card.kind` 다섯.
그리고 **`opts.first` 를 무엇이 채울지** — 지금은 아무도 안 부른다.
`proto/jwt` 의 `evidence` 가 맞는 챕터를 고르는 것이 후보다.