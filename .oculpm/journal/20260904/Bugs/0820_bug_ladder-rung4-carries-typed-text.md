---
schema_version: 1
type: bug
slug: "ladder-rung4-carries-typed-text"
status: done
difficulty: low
created_at: "2026-09-04T08:20:49+09:00"
session_id: "20260904-003"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/data/ladder.ts"
    op: update
  - path: "apps/desktop/src/screens/session/SessionScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/session/T0Plate.tsx"
    op: update
  - path: "apps/desktop/src/data/pipeline.test.ts"
    op: update
  - path: "tests/e2e-ui/t0-session.spec.ts"
    op: update
  - path: "CHANGELOG.md"
    op: update
related: []
tags:
  - "m5"
  - "session"
  - "ladder"
  - "bugfix"
  - "mcp-tool"
---
[x] [x] 사다리 4단이 적은 문장을 안 담았다 — 프롬프트를 열 때 한 번 구웠다

CHANGELOG 「알려진 결함」의 마지막 앱 결함. 앞 작업([[four-known-defects-fixed]])에서 넷을
고치고 남겨 둔 것을 사용자가 이어서 요청했다.

## 발생 원인

`loadLadder` 가 사다리를 **열 때** `stuck: ''` 로 프롬프트를 굽고, 「프롬프트 만들기」 버튼은
`onStuck(props.stuck)` — 이미 그 값인 상태를 다시 세팅하는 **빈 동작**이었다. 그래서 칸에 무엇을
적어도 프롬프트는 언제나 「제가 막힌 지점: (비어 있음)」이었고, 「복사」도 그것을 복사했다.

`rebuildPrompt`(「막힌 지점」만 바뀌었을 때 쓰라고 M2 에 만들어 둔 함수)는 **아무도 안 부르고**
있었다.

## 해결 방법

목업(`design/ink-session.html`)이 모양을 이미 갖고 있다 — `promptOut: ''` 로 시작하고,
`askBuild` 클릭이 그 시점의 `askText` 로 조립하며, 「복사」는 결과가 있을 때까지 `disabled` 다.

- `loadLadder` 는 프롬프트를 더 만들지 않는다. `LadderData.prompt` 를 없앴다 — 화면이
  갱신할 수 없는 값을 데이터가 들고 있는 것이 결함의 뿌리였다.
- `SessionScreen` 이 `prompt` 상태를 들고, 「프롬프트 만들기」가 `rebuildPrompt` 로 조립한다.
  사다리를 새로 열면 비운다(앞 판의 프롬프트를 물려받지 않는다). 「복사」는 그 상태를 쓴다.
- 토스트(목업의 「프롬프트를 만들었습니다」)는 **넣지 않았다** — 새 UI 문구는 지금 다른 세션이
  옮기고 있는 `packages/i18n` 표면을 건드리게 되고, 결함을 고치는 데 필요하지도 않다.
  프롬프트가 뜨는 것 자체가 피드백이다.

## 검증

- 05 §11 시나리오 3(사다리 1~4단)이 이제 문장을 적고 **그 문장이 프롬프트에 돌아오는지**
  단언한다. 누르기 전에는 `.prompt-out` 이 없고 「복사」가 잠겨 있다는 것도 함께 못박았다 —
  앞서는 이미 프롬프트가 떠 있었기 때문에 이 시나리오가 결함을 안고도 통과했다.
- `pipeline.test.ts` 는 `rebuildPrompt` 를 직접 불러 적은 문장이 담기는지, 그리고 D8(파일
  이름만)이 지켜지는지 본다.
- `pnpm lint` · `typecheck` · `test:unit`(151파일 1,585건) · `test:gates`(86) ·
  `test:e2e-ui`(20) 통과. CI 33817136730 확인 중.

## 밟은 것

- 작업 트리에 **다른 세션의 i18n 작업 36개 파일이 미커밋**으로 들어와 있었다. 사다리 경로와는
  안 겹쳐서 그대로 두고 내 파일만 골라 커밋했다.
- 그 상태에서 `pnpm test:gates` 를 전부 돌리면 모션 게이트 하나가 **실행마다 다른 것이** 깨졌다.
  단독으로 8/8 세 번 연속 통과하고 전체 재실행에서 86 전부 통과 — 로컬 4워커 경합이다(CI 는 2워커).