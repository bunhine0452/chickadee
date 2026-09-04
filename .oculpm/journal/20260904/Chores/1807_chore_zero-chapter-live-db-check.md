---
schema_version: 1
type: chore
slug: "zero-chapter-live-db-check"
status: done
difficulty: low
created_at: "2026-09-04T18:07:26+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched: []
related:
  - ref: "20260904/Features_to_add/1756_feature_zero-chapter-done-wired.md"
    kind: "followup"
tags:
  - "D147"
  - "D148"
  - "0장"
  - "실측"
  - "mcp-tool"
---
[x] 앱을 띄우고 실원장을 봤다 — 기존 0장은 8판에 머물러 있고 다시 읽어야 21판이 된다

## 한 일

`pnpm tauri dev` 로 앱을 띄우고(창 생성 18:04:30 · 종료 18:06:26, 그 사이 포커스 두 번) 실원장 `~/Library/Application Support/dev.chickadee.app/chickadee.db` 를 읽기 전용으로 조회했다.

**화면은 못 봤다** — 이 프로세스에 화면 기록 권한이 없어 `screencapture` 가 `could not create image from display` 로 거부됐다. 대지 머리·색인 띠 칩·완료 도장의 시각 확인은 사람이 해야 한다.

## 확인한 것

리포는 `after_coding` 하나, 0장 대지(`unit.id = 26`, `source='manual'`, `order_idx = -1`)가 있고 **노드가 8개**다. D147 이전 상한으로 구워진 대지다.

지금 든 여덟:

```
const-declaration · number-literal · string-literal · undefined-null
property-access · conditional-ternary · template-literal · nullish-coalescing
```

**이 목록이 사용자가 처음 말한 문제의 증거다.** 프로그래밍 초보의 「바닥」이라면서 널 병합·삼항·템플릿 리터럴·옵셔널 체이닝이 서 있고, 조건문·함수 정의·반복은 하나도 없다. D147·D148 이 고친 것이 정확히 이것이다.

## 다시 읽으면 어떻게 되나

`writeZeroChapter` 는 **이미 열린 대지도 매번 다시 계산한다** — `if (!opened && !shouldOpen…) return 0` 이라 `opened` 면 그냥 지나가고 그 아래에서 현재 상수(24 · 깊이 2)로 `zeroChapterPlates` 를 다시 굽는다. 그래서 마이그레이션 없이 다음 인제스트에 반영된다.

지금 여덟과 새 후보 21을 대조했다 — **여덟이 전부 21 안에 든다(빠지는 것 0), 다시 읽으면 13개가 더해진다.** 더해지는 것에 이번에 짠 바닥 여덟이 전부 들어 있다.

`declared_newcomer` 는 이미 `true` 로 저장돼 있다. 그러니 이 원장에서는 배선된 조건 ②가 꺼진 채로 돌아, 담긴 개념을 전부 한 겹 올릴 때까지 0장이 열려 있다 — 의도한 동작이다.

## 검증

원장 조회는 `sqlite3 -readonly` 로만 했고 쓰기는 하지 않았다. 남은 것은 리포를 다시 읽고 **눈으로 보는 것** 하나다.