---
schema_version: 1
type: bug
slug: "wkwebview-perf-and-three-real-app-bugs"
status: done
difficulty: high
created_at: "2026-09-03T13:42:13+09:00"
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
  - "perf"
  - "wkwebview"
  - "ipc"
  - "ingest"
  - "mcp-tool"
---
[x] WKWebView 첫 실측 — 그리고 실제 앱을 처음 띄우자 드러난 버그 셋

## 발생 원인 · 해결 방법

M1·M2 내내 비어 있던 WKWebView 수치를 재려면 **빌드한 앱을 실제로 띄워야** 했다. 그런데 아무도 그런 적이 없었고, 띄우자마자 리포 등록 → 인제스트가 통째로 안 돌았다.

### 1. `ingest_start` 인자 모양 — 실제 앱에서 인제스트가 한 번도 안 돌았다

Rust 는 `ingest_start(app, state, spec: JobSpec)` 로 **구조체 하나**를 받는데 클라이언트가 `call('ingest_start', spec)` 로 필드를 펼쳐 보냈다. Tauri 가 `missing required key spec` 으로 되던진다.

왜 아무 테스트도 못 잡았나: TS 테스트는 전부 `ipc` 를 모의하고, Rust `pipeline.rs` 는 잡 러너를 **직접** 부른다. 양쪽 다 Tauri 의 명령 디스패치를 지나가지 않아 인자 모양을 검사한 적이 없다. 명령 중 이것 하나만 구조체를 받는다.

### 2. `facts.run_finish` 가 한 번도 적용된 적 없다

statement 는 이름 붙은 인자 **17개**를 요구하는데 `jobs.rs` 는 **8개**만 넘겼다. rusqlite 는 그런 문장을 통째로 거부하고, 호출은 `drop(store.exec(...))` 였다 — 오류가 버려졌다. 결과로 모든 인제스트 행이 `status='running'`, `files_n=0` 으로 영원히 남았다. 이제 모르는 열(사용처 수·사전 판본 등 파생 층 소관)은 `null` 로 채우고 실패하면 경고를 낸다.

### 3. blame 2차 패스가 200 op 상한을 넘겼다

`blame.ts` 가 파일 하나의 op 를 자르지 않고 `ipc.store.batch(ops)` 로 보냈다. 사용처가 많은 파일 하나면 바로 넘고 `BAD_INPUT` 이 나며, 그 오류는 배경 패스의 `catch` 에 먹혀 **출처가 영영 안 채워진다**. M2 인계 문서가 경고한 바로 그 지뢰가 M1 코드 안에 있었다. `inBatches` 를 내보내 공유한다.

### 진단을 막고 있던 것 — 로그의 `code`

셋 다 화면 토스트 한 줄로만 끝났고 로그에는 `리포 읽기 실패 ([redacted])` 만 남았다. 금칙어 목록의 `code`(소스 조각 차단용)와 01 §6 이 **허용**한 「오류 코드」가 이름이 같아서다. `errorCode` 로 바꾸고 `report()` 가 메시지도 남기게 했다(D79).

## 실측 (릴리스 빌드 · 격리된 `HOME` · 창을 앞에 세운 채)

홈: 대지 18장 · 스티커 **384개** · 사용처 55,438.

| mark | 실측 p95 | 예산 | |
|---|---|---|---|
| `frame_p95` | **18 ms** (178프레임) | 12 | **초과** |
| `home:paint` | 150 ms | 400 | 통과 |
| `session:mount` | 4 ms | 50 | 통과 |
| `t0:grade` | < 1 ms | 30 | 통과 |
| `theme:switch` | 45 ms (n=2) | 100 | 통과 |

인제스트 실측: 377파일 · 캡처 170,185 · 사용처 55,438 · 출처 채움 55,027.

정본 §6 의 「Chromium 49노드 p95 8.5ms 확인, **WebKit 미측정**」이 이제 사실이 아니다(D80). 노드가 49개가 아니라 384개라 같은 조건이 아니고, 05 §10 이 이 경우의 강등 사다리를 이미 갖고 있다 — **어느 단을 밟을지는 사용자 결정**이다.

## 지뢰

- **가려진 WKWebView 는 `requestAnimationFrame` 을 멈춘다.** 창이 뒤에 있으면 프레임이 0개로 나오고, 그것이 「빠르다」로 보인다. 실측 내내 `osascript` 로 frontmost 를 계속 세웠다.
- **`theme:switch` 를 마운트 효과에서 재면 안 된다.** 첫 실행은 전환이 아니라 홈 전체의 첫 조판이라 237 ms 가 나온다(실제 전환은 45 ms).
- **`tauri dev` 로 잰 `home:paint` 는 뜻이 없다.** 번들되지 않은 ESM 을 세는 값이다.
- **하네스는 `define` 리터럴로 꺼야 지워진다.** `import.meta.env.VITE_PERF` 로 두면 런타임 조회라 죽은 가지가 릴리스 번들에 남는다.

## 검증

`pnpm vitest run` 98파일 873테스트 통과 · `eslint`·`stylelint`·`typecheck` 무출력 · Rust 예산 2,050/2,300. 고친 뒤 실제 앱에서 `ingest_run.status='done'`, 출처 55,027건 채움을 확인했다.