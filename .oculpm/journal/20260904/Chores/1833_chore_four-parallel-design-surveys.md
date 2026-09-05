---
schema_version: 1
type: chore
slug: "four-parallel-design-surveys"
status: done
difficulty: high
created_at: "2026-09-04T18:33:32+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "fixtures/ipc/tiny/captures-all.json"
    op: update
  - path: "fixtures/ipc/projectox/blocks.json"
    op: update
related:
  - ref: "20260904/Chores/1807_chore_zero-chapter-live-db-check.md"
    kind: "followup"
tags:
  - "설계조사"
  - "EVALS"
  - "파이썬"
  - "0장"
  - "구조"
  - "mcp-tool"
---
[x] 병렬 fork 넷으로 남은 넷을 설계 조사 — 그리고 원장이 정본 §2 의 핵심 정의가 한 번도 성립한 적 없음을 보여 줬다

## 한 일

사용자 요청으로 fork 넷을 병렬로 띄워 남은 넷(① 언어 확장 · ② 0장 이후 · ③ 구조 트랙 · ④ EVALS)을 설계 조사시켰다. 공유 파일(정본·등록부·플랜·일지)은 넷 다 못 건드리게 하고 설계만 받았다 — 앞서 병렬 세션이 `empty.tsx`·i18n 을 동시에 고쳐 시험이 빨개진 일이 있었다.

## ① 언어 확장 — 막는 것은 사전 하나뿐이다

내가 코드로 확인했다: `grammarSchema`(`schema.ts:29`)에 `python`·`go`·`rust`·`swift`·`dart`·`sql` 이 **이미 허용 목록**이고, T2 import 해석기 `resolvePy` 가 **이미 구현돼 있으며**(`resolve-imports.ts:233`, `__init__.py` 폴백까지), `t1-block.ts:57` 이 파이썬 주석 `#` 를 안다. 문법 크레이트도 탑재돼 있다.

`.scm` 10장을 실제 문법에 돌려 검증했고 진짜 함정이 하나 나왔다 — 파이썬 `comparison_operator` 는 `left`/`right` 필드가 없고 연쇄(`a < b < c`)를 한 노드에 담아, TS 방식으로 쓰면 **사이트가 4개로 터진다.** 형제 앵커로 「자식이 정확히 둘」만 잡아 해결.

`grammar_abi` 가 언어마다 다르다 — 파이썬 **14**(`parser.c` 의 `LANGUAGE_VERSION` 확인), TS 15.

`common/` 30개 중 **21개(75%)를 물려받는다.** D148 의 「두 번째 언어부터 싸진다」가 수치로 확인됐다. 0장 후보 19/24 로 TS(21/24)와 같은 띠. **바닥 8짝 = 하루치.**

미해결 둘 — 파이썬엔 `const`/`let` 이 없어 최초 바인딩과 재대입이 같은 `assignment` 노드라 쿼리로 못 가른다. 그리고 들여쓰기가 의미인데 탭·공백 혼용이 `parse_quality: ok` 로 통과해 T1 채점에 분기가 필요하다.

## ② 0장 이후 — (가)와 (나)는 같은 문제다

**내가 사용자에게 한 말 둘이 틀렸고 코드로 확인해 정정했다.**

- 「설명이 사라진다」가 아니다. `reducer.ts:64` 의 `dunno` 는 `layer − 1` 이라 사다리는 밖에서도 열린다. **절벽의 정체는 정보 소멸이 아니라 가격 변화다** — 0장은 공짜로 읽고 밖은 한 겹을 낸다.
- 정본 §3-3 은 이 문단을 막지 않는다. 그 게이트는 판정란(`FeedbackSlot.css` 의 `min-height:118px` + 겹친 `grid-area` 둘)에만 걸려 있고, `CoachBand.css` 주석에 선례가 그대로 적혀 있다 — 「정본 §3-3 이 지키는 것은 판정란이고, 이 띠는 판정란보다 위에서 처음부터 서 있다」.

절벽 너머 9개의 `misconceptions` 가 거의 전부 문법이 아니다(실행 순서 4 · 원본 변경 3 · 암묵 반환 2). **절벽 너머가 어려운 이유가 곧 (나)가 없기 때문**이라 (가)를 문단으로 때우면 증상만 가린다.

권고: (가) 게이트를 「0장 소속」에서 「그 개념의 겹이 0」으로 — 데이터는 이미 모든 T0 페이로드에 구워져 있고(`payload.ts` `dictLayers`) 막힌 것은 렌더뿐이라 생성기·DDL 변경 0. 비용은 `one_liner` 6편 재작성(실측 6/9 누설). (나) `dictionary/exec/` 를 `queries: []` · `track_default: 't0'` 로 신설 — `arch/*` 가 선례이되 그쪽은 `t2` 라 `card.kind` 를 새로 파느라 표 재생성이 필요했고(D146) 그 값을 다시 치를 이유가 없다.

## ③ 구조 트랙 — 시간축이 통째로 없다

여섯 종이 전부 **현재 단면**이다. 권고는 `arch/growth`(자란 순서) — 재료는 `file.first_commit_id` + `git_commit.authored_at`, statement 하나. **실제 커밋을 정답지로 쓰는 두 번째 종**이 되고(지금은 `placement` 하나), 바이브 코딩 리포에서 「무엇이 먼저 생겼나」는 「AI 가 무엇을 먼저 정했나」라 정본 §1 의 통증 (c)에 닿는 유일한 구조 종이다.

회전 비용: 세션당 비용은 안 는다(T2 자리는 세션당 하나, 4분 그대로). 느는 것은 한 바퀴 기간이고 **리포종 목표 3 이면 +6일 고정**, 대지종이면 대지 8에서 +16일.

곁다리로 `#e-d142` 글리프가 낡아 있었다 — 코드(`T2_ORDER` 6종·`REPO_TARGETS`)와 정본 결론 §2 표 둘 다 이미 반영돼 있어 확인 후 `done` 으로 고쳤다.

## ④ EVALS — 오늘의 진짜 뉴스

네 스위트(`gates` 13 · `ledger` 9 · `human` 4 · `blocked` 4) 초안을 받았고 실측까지 돌렸다. **`gates` 9/13 · `ledger` 0/9.**

원장이 셋을 보여 줬다:

1. **L2 = 0.000.** 정본 §2 의 핵심 정의 —「겹은 맞힌 횟수가 아니라 **시간을 두고** 다시 맞힌 횟수로 쌓인다」— 가 이 원장에서 **한 번도 성립한 적이 없다.** 겹이 오른 복습 6건 중 `elapsed_days ≥ 1` 이 0건, 최대 간격 0.08일.
2. **`review_log` 의 track 이 전부 `t0`.** T1·T2 는 실사용 표본 **0건**. 트랙 셋 중 둘이 한 번도 안 돌았다.
3. **오늘 더한 여덟 개념은 카드로 한 번도 구워지지 않았다.** 품질 게이트가 도는 시드에 없어서다. `.scm` 매칭과 사전 린트만 통과했고 **판 본문·보기·진단·템플릿 치환은 미검증**이다.

그리고 `tests/visual` 의 기준선 40장이 아직 없다(README 가 그렇게 적고 `test:visual` 이 CI 에 안 걸려 있다).

## 내가 만든 결함 하나 — 찾아서 고쳤다

④가 「커밋된 IPC 덤프가 스테일하다」고 지목했다. 확인해 보니 맞다. CI 는 `cargo test -p chickadee-app --test pipeline` 으로 덤프를 재생성한 뒤 `git diff --exit-code fixtures/ipc` 로 검사하는데(`ci.yml:388`), **나는 오늘 `-p chickadee-parse` 만 돌리고 `--test pipeline` 을 한 번도 안 돌렸다.** 개념 여덟을 더했으니 덤프가 바뀌는 것이 당연한데 그 게이트를 안 본 채로 「전량 통과」라고 보고했다.

재생성했다 — `fixtures/ipc/tiny/captures-all.json` 과 `fixtures/ipc/projectox/blocks.json` 둘이 바뀐다. 두 번 돌려 해시가 같은 것을 확인해 **결정적**임을 검증했다. 커밋하면 게이트를 통과한다.

다만 diff 규모(19,852 추가 · 6,884 삭제)에 **동시 세션의 `.scm` 변경도 섞여 있다**(예: `async-await.scm` 에 `@pick.3` 추가). 커밋 전에 한 번 갈라 봐야 한다.

## 검증

`cargo test -p chickadee-app --test pipeline` 16건 통과 · 덤프 재생성 결정적 확인 · fork 넷의 주장 중 코드로 확인 가능한 것(파이썬 기반 4건 · `dunno` 겹 비용 · 판정란 게이트 범위 · `dictLayers` 페이로드 · `T2_ORDER` 6종 · IPC 게이트)은 전부 직접 확인했다. 확인 안 한 것은 각 보고가 「추정」·「미확인」으로 밝힌 것들이다.