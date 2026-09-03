---
schema_version: 1
type: chore
slug: "m2-handoff-and-closing-checks"
status: done
difficulty: low
created_at: "2026-09-03T10:55:11+09:00"
session_id: "20260903-003"
agent:
  id: "claude-code"
  version: "Opus 5"
language: "ko"
verified_by_user: false
files_touched: []
related: []
tags:
  - "m2"
  - "handoff"
  - "test"
  - "mcp-tool"
---
[x] M2 마감 — 아래층 왕복·홈 미리보기 테스트, M3 인계 문서

## 작업

M2 「끝났다는 증거」 문장을 한 줄씩 대조하며 빈 곳을 메웠다.

- **아래층 왕복 3건** — 점프가 현재 자리 **앞**에 끼고 부모를 뒤로 미는지, `B` 가 원장을 남기지 않고 그 판만 지우는지, 아래층 결과가 **선행 개념의** 숙련도에 붙고 부모 겹은 안 건드리는지.
- **홈 미리보기 3건** — `previewToday` 가 세션도 카드도 만들지 않는지(두 테이블이 비어 있는지 단언), 이어 찍을 자리를 알려 주는지, 빈 상태.
- **`TodayPanel` 6건** — 시간 비례 칸 너비(`--w`), 이어 찍기 문구, 잠긴 버튼, 연속 인쇄가 숫자뿐인지.
- **`docs/handoff/m3.md`**(D63) + `docs/handoff/README.md` 표 갱신.

## 확인한 것 (M2 끝났다는 증거)

| 증거 | 결과 |
|---|---|
| 인쇄 시작 → 채점 → 사다리 → LIFER → 요약 한 흐름 | `SessionScreen.test.tsx` 5건 · `pipeline.test.ts` 4건 |
| Esc 후 재진입 시 N번째 판부터 | `session.test.ts` — 강제 종료 경로 포함 |
| 02 §3.3 검산 6건 | `reducer.test.ts` |
| `rebuild_mastery == mastery` | 오답·다시 찍기·모르겠어요 섞인 원장에서 빈 diff |
| fast-check 5속성 | 1,000회 · seed 20260902 |
| 카드 전환 IPC 0회 | 화면 테스트가 호출 수를 센다 |
| 판정란 0px | `FeedbackSlot.test.tsx` 가 CSS 선언 셋을 직접 읽는다 |
| 13px 미만 0 · 대비 7:1 | 정적으로 초록(stylelint 규칙 · 46쌍). **런타임 게이트는 브라우저가 필요해 M5** |
| 큐 결정성 | property 테스트 |

## 검증

`pnpm vitest run` — 98 파일 873 테스트 통과. `eslint`·`stylelint`·`typecheck` 무출력. CI 4잡 초록.