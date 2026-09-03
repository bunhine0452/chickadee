---
schema_version: 1
type: feature
slug: "t2-flow-direction-screens"
status: done
difficulty: medium
created_at: "2026-09-03T19:53:44+09:00"
session_id: "20260903-008"
agent:
  id: "claude-code"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/components/t2/FlowDeck.tsx"
    op: create
  - path: "apps/desktop/src/components/t2/FlowDeck.css"
    op: create
  - path: "apps/desktop/src/components/t2/FlowDeck.test.tsx"
    op: create
  - path: "apps/desktop/src/components/t2/DirectionQuiz.tsx"
    op: create
  - path: "apps/desktop/src/components/t2/DirectionQuiz.css"
    op: create
  - path: "apps/desktop/src/components/t2/DirectionQuiz.test.tsx"
    op: create
  - path: "apps/desktop/src/screens/session/T2Plate.tsx"
    op: update
  - path: "apps/desktop/src/screens/session/T2Plate.test.tsx"
    op: update
  - path: "apps/desktop/src/screens/session/t2Copy.ts"
    op: update
  - path: "apps/desktop/src/data/graph.ts"
    op: update
  - path: "apps/desktop/src/data/graph.test.ts"
    op: update
related: []
tags:
  - "t2"
  - "05-frontend"
  - "04-grading"
  - "d107"
  - "mcp-tool"
---
[x] D107 — 흐름 추적·의존성 방향 입력 화면과 makeT2Card 네 종 굽기

## 추가 기능

04 §8.3 의 나머지 두 종에 입력 화면을 줬다 (D107).

- **흐름 추적** `FlowDeck` — 「세운 경로」(`<ol>`)와 「남은 카드」(`<ul>`) 두 자리. 자리를 옮기는 것은 `↑`·`↓` **버튼**이고 드래그는 없다(정본 §3-8 마우스 0 주행). 버튼 이름이 「CartSheet.tsx — 3개 중 2번째. 위로 옮기기」로 자리와 총 개수를 말한다. 옮긴 뒤 포커스가 그 카드를 따라가고, 끝자리에 닿아 그 방향이 잠기면 반대쪽 버튼으로 넘긴다. 두 자리로 나눈 이유: `gradeFlow` 는 **세운 것만** `ordered` 로 보므로 함정 카드를 빼는 자리가 있어야 만점이 나온다.
- **의존성 방향** `DirectionQuiz` — 5문항을 한 화면에 세로로 쌓고 보기는 T0 의 `Choices` 를 그대로 재사용한다(`1~4` 물리 키·`↑↓` 로빙이 이미 05 §7 대로다). 04 §8.3 이 넘기는 방식을 정하지 않아 「한 화면에 다섯」으로 정했다 — 채점 단위가 묶음이라 「채점하기」가 한 번뿐이고, 힌트 ②가 지도를 보라고 해서 지도와 문항이 같이 보여야 한다.
- `T2Plate` 은 `payload.kind` 로 **고르기 화면만** 가른다. 지도·결과 화면은 네 종이 같이 쓴다. 흐름 추적·의존성 방향에서 지도는 읽는 자리라 상자를 눌러도 고르기가 아니다. 채점 자물쇠도 종마다 다르다 — 의존성 방향만 5문항을 다 풀어야 열린다(안 푼 문항은 `gradeDirection` 이 조용히 오답으로 세므로 이유가 화면에 남지 않는다).
- `Verdict` 의 분모를 `payload.core` 가 아니라 `found + missed` 에서 센다. 그래프만으로 만드는 두 종은 `core` 가 비어 「0개 중」이 나오던 자리다.
- `liveAfter` 가 종을 본다 — 「경로 5개 중 4개를 세웠습니다」·「5문항 중 3문항을 맞혔습니다」.
- `makeT2Card` 가 종을 고르지 않는다. 04 §8.3·§8.4 의 시도 순서와 「만들 수 없는 종은 건너뛴다」는 생성기가 이미 갖고 있어 앱이 한 번 더 아는 자리를 없앴다 — 이것으로 네 종이 다 큐에 실린다.

## 남은 것

`SessionScreen.tsx` 는 이 하위 세션의 소유가 아니라 손대지 않았다. `t2Grade` 가 아직 `payload.kind !== 'placement' && kind !== 'radius'` 에서 되돌아오므로, **그 열두 줄을 잇기 전까지 `makeT2Card` 의 네 종 굽기를 켜면 흐름 추적·의존성 방향 판에서 세션이 멈춘다.** `t2Ordered`·`t2Picks` 상태 두 개와 `T2Answer` 분기, `<T2Plate>` 의 `ordered`/`onOrder`/`picks`/`onPick` 네 prop 이 필요하다.

## 검증

`npx vitest run apps/desktop/src/components/t2 apps/desktop/src/screens/session apps/desktop/src/data/graph.test.ts` → 13파일 121건 통과(기존 T2Plate 14건 유지 + 새 34건). 전체 `npx vitest run` 은 143파일 1,484건 중 다른 하위 세션의 미완 파일 둘(`prompt-golden.test.ts` 8건 · `SettingsScreen` 이 아직 없는 `KeyPanel` 을 import)만 빨갛고 이 작업 범위는 전부 초록. `tsc`·`eslint`·`stylelint`·`check-motion`·`check-contrast` 전부 통과(tsc 의 `App.tsx` 오류 1건은 설정 화면 세션의 진행 중 코드).