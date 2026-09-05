---
schema_version: 1
type: bug
slug: "ci-red-first-run-switch-and-shelf-webkit"
status: done
difficulty: medium
created_at: "2026-09-05T12:20:45+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/screens/home/empty.tsx"
    op: update
  - path: "tests/e2e/specs/e1-first-run.e2e.ts"
    op: update
  - path: "tests/support/gates.ts"
    op: update
related: []
tags:
  - "CI"
  - "e2e"
  - "D147"
  - "D170"
  - "첫-실행"
  - "mcp-tool"
---
[x] CI 가 여섯 번째 푸시째 빨갰던 두 잡 — 첫 실행 언어 스위치 선택자와 Linux WebKit 의 서가 키 입력

## 발생 원인

`e2e-linux`(실제 Tauri 바이너리, WebdriverIO)와 `design-gates`(Playwright) 가 이 브랜치의 직전 푸시 여섯 번 모두 빨갰다. 오늘 작업의 회귀가 아니라 기존 결함 둘이다.

1. **e2e-linux** — E1 첫 실행 셋이 「`리포 등록` 기대, `Add a repo` 실측」으로 실패. D147 이 첫 실행에 「프로그래밍이 처음이신가요?」 문항을 넣으면서 언어 스위치와 **같은 클래스 `firstrun-lang`** 을 썼고, `tests/e2e/specs/e1-first-run.e2e.ts` 의 `.firstrun-lang [role="switch"]` 는 **첫 번째 블록 = 그 문항의 스위치**를 눌렀다. 한국어로 맞추려던 `before` 훅도, English 로 바꾸는 시험도 전부 엉뚱한 스위치를 토글하고 있었다. Linux 러너는 `navigator.language` 가 한국어가 아니라 첫 화면이 영어이므로 그대로 실패. `ee1ff76`(「green the three CI jobs」)이 `before` 훅으로 고치려 했으나 같은 선택자를 써서 효과가 없었다. e2e-ui 의 `shell.spec.ts` 는 `aria-label*="한국어 · English"` 로 골라 이 함정을 비켜 갔다.
2. **design-gates** — `clone-course.spec.ts` 의 첫 시험만 webkit 에서 `toShelf` 의 `ul[role="listbox"]` 대기 30초 초과. 같은 파일의 나머지 셋과 다른 파일들은 같은 헬퍼로 통과 — 파일 첫 시험이 스위처 핸들러가 붙기 전에 Enter 를 눌러 목록이 안 열리는 콜드스타트다. 직전 실행들의 여섯 건 실패(design·keyboard·en-smoke)는 A6(D170)의 수정으로 사라져 이것 하나만 남았다.

## 해결 방법

- `apps/desktop/src/screens/home/empty.tsx` — 두 블록에 `firstrun-newcomer` · `firstrun-locale` 를 덧붙였다(`.firstrun-lang` 레이아웃은 그대로). `e1-first-run.e2e.ts` 의 두 선택자를 `.firstrun-locale [role="switch"]` 로.
- `tests/support/gates.ts` `toShelf` — 포커스 + Enter 를 4초 대기로 최대 5회 반복. 클릭으로 바꾸지 않은 이유는 이 게이트가 재는 것이 「마우스 없이 열리는가」라서다.

## 검증

로컬: `pnpm typecheck`·`pnpm lint` 무출력 · 홈 화면 단위 22 · `playwright test tests/gates/clone-course.spec.ts tests/e2e-ui/shell.spec.ts` chromium+webkit **16/16**. e2e-linux 는 Linux 전용이라 CI 에서 확인한다(다음 푸시).