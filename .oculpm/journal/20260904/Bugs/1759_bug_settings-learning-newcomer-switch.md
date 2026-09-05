---
schema_version: 1
type: bug
slug: "settings-learning-newcomer-switch"
status: done
difficulty: low
created_at: "2026-09-04T17:59:25+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  session: "a53441be-3b5f-4f6a-b880-8e6fb2b0714a"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/screens/settings/SettingsScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/settings/SettingsScreen.test.tsx"
    op: update
  - path: "packages/i18n/src/ko/core.ts"
    op: update
  - path: "packages/i18n/src/en/core.ts"
    op: update
related:
  - ref: "20260904/Features_to_add/1756_feature_zero-chapter-done-wired.md"
    kind: "followup"
tags:
  - "D147"
  - "설정"
  - "문구"
  - "0장"
  - "mcp-tool"
---
[x] 홈 문구가 없는 자리를 가리키고 있었다 — 설정 「학습」에 「프로그래밍이 처음」 스위치가 없었다

## 발생 원인

`home.newcomerBody` 가 「더 천천히 가고 싶으면 **설정 「학습」에서** 「프로그래밍이 처음」으로 바꾸면 0장이 길어집니다」라고 안내하고, `en` 도 `Settings › Learning` 이라고 실명으로 적는다. 그런데 **설정 화면에 그 스위치가 없었다** — `SettingsScreen.tsx` 를 `declaredNewcomer` 로 grep 하면 0건이다.

첫 실행 문항(`firstRun.newcomerQ`)과 저장(`App.tsx` → `saveSetting('declaredNewcomer', …)`)은 들어와 있었고 되돌리는 자리만 빠졌다. 플랜 `a-settings` 가 「첫 실행 문항 + 설정 스위치」 둘을 한 항목으로 묶고 있어 앞쪽만 되고 뒤쪽이 남은 채로 지나갔다.

정본 §3 의 「묻되 잠그지 않는다」와도 어긋난다 — 첫 화면에서 한 번 묻고 되돌릴 길이 없으면 그건 잠근 것이다.

## 해결 방법

설정 「학습」 절의 「첫 판 안내」 바로 위에 스위치 한 줄을 더했다. `coachOptions` 와 같은 모양(`newcomerOptions`)이고, 값은 `s.declaredNewcomer`, 저장은 다른 학습 설정과 같은 `put('declaredNewcomer', …)` 경로다.

문구는 ko 정본 + en 병기로 다섯 키를 새로 뒀다(`settings.study.newcomer*`). 문안이 **무엇을 잃고 얻는지**를 적는다 — 「처음입니다」로 두면 뿌리 판 몇 개를 맞혀도 0장이 안 닫히고 담긴 개념을 전부 한 겹 올릴 때까지 열려 있다는 것. 그게 `zeroChapterDone` 의 조건 ② 가 꺼진다는 말의 사람 말 버전이다.

## 검증

`SettingsScreen.test.tsx` 에 회귀 하나 — 스위치를 눌렀을 때 `settings` 테이블의 `declared_newcomer` 가 `true` 가 되는지 실제 SQLite 로 확인한다. 그 파일 24건 통과.

`pnpm typecheck` 무출력 · **TS 전체 1,980건 / 177 파일 전량 통과**. 카탈로그 시험(「아무도 안 쓰는 키가 없다」·「두 언어의 변수 집합이 같다」)이 새 키 다섯을 그대로 통과했다.