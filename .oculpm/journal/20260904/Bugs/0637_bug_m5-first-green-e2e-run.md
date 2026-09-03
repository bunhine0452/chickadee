---
schema_version: 1
type: bug
slug: "m5-first-green-e2e-run"
status: done
difficulty: high
created_at: "2026-09-04T06:37:13+09:00"
session_id: "20260904-002"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "tests/e2e/scripts/first-run-sockets.sh"
    op: update
  - path: "tests/e2e/wdio.conf.ts"
    op: update
  - path: "tests/e2e/specs/e4-home.e2e.ts"
    op: update
  - path: "tests/e2e/specs/e8-settings.e2e.ts"
    op: update
  - path: "tests/e2e/helpers/driver.ts"
    op: update
  - path: "apps/desktop/src-tauri/tests/pipeline.rs"
    op: update
  - path: "fixtures/ipc/tiny/captures-all.json"
    op: create
  - path: "tests/support/build-seed.ts"
    op: update
  - path: "tests/support/app-db.ts"
    op: update
  - path: "tests/support/gates.ts"
    op: update
  - path: "tests/support/ui.ts"
    op: update
  - path: "tests/gates/design.spec.ts"
    op: update
  - path: "tests/gates/keyboard.spec.ts"
    op: update
  - path: "tests/e2e-ui/t0-session.spec.ts"
    op: update
  - path: "tests/e2e-ui/shell.spec.ts"
    op: update
  - path: "tests/e2e-ui/keyboard.spec.ts"
    op: update
  - path: "tests/e2e-ui/t1-t2.spec.ts"
    op: update
  - path: "tests/visual/shots.spec.ts"
    op: update
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/06-quality-security-release.md"
    op: update
  - path: ".github/workflows/ci.yml"
    op: update
  - path: "CONTRIBUTING.md"
    op: update
related: []
tags:
  - "m5"
  - "e2e"
  - "ci"
  - "seed"
  - "decision"
  - "D113"
  - "mcp-tool"
---
[x] [x] E1~E8 첫 완주 — 네 개의 실패는 앱이 아니라 하네스·시드였다

앞 실행(33757941338)에서 E2E 가 처음 끝까지 돌았고 8개 스펙 중 4개가 깨졌다. 넷 다 앱이
아니라 하네스와 시드였다. 리포를 퍼블릭으로 돌린 뒤(히스토리 62커밋 시크릿 스캔 통과, MIT
LICENSE 확인) 이어서 고쳤다.

## 발생 원인

**E1 — 측정 스크립트가 자기를 죽였다.** `first-run-sockets.sh` 는 12초 뒤 남은 앱을
`pkill -f "$(basename "$BIN")"` 로 치우는데, 이 스크립트 자신의 명령줄이
`bash .../first-run-sockets.sh .../target/debug/chickadee-app ...` 이라 `chickadee-app` 에
걸린다. JSON 을 쓰기 전에 죽으니 E1 은 「측정 결과가 없다」로만 실패했다. 로그의 증거:
12초 `timeout` 시작 12.05초 뒤 종료 — 뒤따르는 `sleep 1` 이 돌지 않았다.

**E8 — 낭독 문구를 화면에서 기다렸다.** 「전부 지웠습니다」는 `.vh#live`(1px·`clip`)에만
놓이고 그 자리는 WebDriver 의 rendered text 에 안 들어온다. 다음 시나리오(키체인 항목 부재)가
통과한 것이 지우기 자체는 돌았다는 증거다.

**E4·E6 — 시드에 재료가 없었다.** `build-seed.ts` 가 `fixtures/ipc/tiny/captures.json`
에서 파생하는데 그것은 `derive.captures_by_file` **한 페이지**(계약)라 한 파일치 캡처 8개뿐이고,
사용처 2개 → 홈 큐 1판 · 2분이 된다. E4 는 10~25분을 요구했고 E6 는 「중간에서 나가기」를
만들 2판이 없었다.

**E4 마스트헤드 — WebdriverIO v9.** `ElementArray.map` 이 배열이 아니라 Promise 를 주도록
덮여 있어 `Promise.all` 이 「object is not iterable」로 터졌다.

## 해결 방법

- `pkill -x -f "$BIN"` — 명령줄 **전체**가 같은 것만. 그리고 스크립트가 결과를 못 남기면
  `onPrepare` 가 사유(status·signal)를 JSON 에 적어 E1 이 그것을 실패 메시지에 싣는다.
- E8 은 화면 대신 **디스크**를 본다 (06 §6.4 가 계약으로 삼는 것이 파일이다). `waitForText`
  주석에 「보이는 글자만 읽는다」를 남겨 다음 사람이 같은 함정에 안 들어가게 했다.
- `pipeline.rs` 의 **배포 사전** 테스트가 `captures-all.json` 을 하나 더 뜬다 — 픽스처 전
  파일의 캡처 페이지(781개). 계약 페이지는 안 건드린다. 시드가 사용처 236 · 블록 18 이 되어
  큐가 2판 선다.
- **D113** — 첫날 큐는 복습 0 + 새 판 `newPerDay`(2)장 × 2분이라 **최대 4분**이다. 재료로
  못 넘는 벽이라 06 §1.5 E4 의 하한 10 을 뺐다(상한 25·큐 길이 일치는 유지). 하한은 스케줄러
  property 1,000회가 이미 잰다.

시드가 두꺼워지자 같은 시드를 쓰는 브라우저 스위트가 따라 움직였다 — `toSummary` 가 큐 끝까지
걷고, 「마지막 카드가 그 판」이던 답 조회를 `answerKeyOf` 하나로 모아 지금 걸린 판을 집는다
(e2e-ui 에 같은 함수가 셋 복사돼 있었다). 05 §11 이 못박아 둔 1판·`옵셔널 체이닝`·`repo.ts:50`
은 `ts/string-literal`·`time.ts:19` 로 옮겼고, T1 이 막힌 이유가 「블록 0행」에서 「숙련도 0」
으로 바뀐 것도 스킵 사유에 적었다.

## 덤으로 — CI 벽시계

실측(33804384792): `build (ubuntu-22.04)` 32분 중 컴파일 2분 39초, **rpm 번들 25분 43초**,
deb 8초, AppImage 1분 50초. `e2e-linux` 는 빌드 37분 25초에 시나리오 **60초**. 릴리스가 파는
리눅스 산출물은 AppImage·deb 둘뿐이라 CI 의 rpm 은 아무도 안 받는 물건이었다. e2e-linux 는
`--no-bundle`(상한 55→25), build-3os 리눅스는 `--bundles deb,appimage` — rpm 은 release.yml
이 계속 만든다. macOS 가 dmg 를 릴리스로 미뤄 둔 것과 같은 갈래다.

## 검증

로컬: `pnpm lint` · `typecheck` · `test:unit`(1565) · `test:gates`(86) · `test:e2e-ui`(20) ·
`cargo test --test pipeline`(16) · `check:rust`(2300/2300) 전부 통과.
CI 33804384792 **8개 잡 전부 success** — `e2e-linux` 포함, E1~E8 첫 완주. `integration` 이
통과했으므로 리눅스에서 다시 뜬 덤프가 커밋본과 바이트 단위로 같다.