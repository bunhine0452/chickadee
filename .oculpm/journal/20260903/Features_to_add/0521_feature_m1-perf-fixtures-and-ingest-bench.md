---
schema_version: 1
type: feature
slug: "m1-perf-fixtures-and-ingest-bench"
status: done
difficulty: medium
created_at: "2026-09-03T05:21:12+09:00"
session_id: "20260903-002"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "fixtures/repos/large-100k.steps"
    op: create
  - path: "fixtures/repos/poly.steps"
    op: create
  - path: "scripts/make-fixture-repo.sh"
    op: update
  - path: "apps/desktop/src-tauri/benches/ingest.rs"
    op: create
  - path: "apps/desktop/src-tauri/Cargo.toml"
    op: update
  - path: "scripts/bench.sh"
    op: create
  - path: "bench/baseline.json"
    op: create
  - path: "package.json"
    op: update
  - path: ".gitignore"
    op: update
related: []
tags:
  - "m1"
  - "perf"
  - "bench"
  - "fixtures"
  - "criterion"
  - "mcp-tool"
---
[x] M1 · 성능 픽스처(large-100k · poly)와 criterion 인제스트 벤치 — 10만 줄 2.5~3.3 s

## 추가 기능

03 §7 의 예산 표를 **재는 자**를 놓았다. 목표 숫자는 문서가 정하고, 이 작업은 그 숫자와
견줄 실측을 만든다.

### 픽스처

- `fixtures/repos/large-100k.steps` — 파일 800 · 커밋 1,000 · **101,772줄** (TS 401 · TSX 399).
  `gen wave` 는 1회에 파일 1개 + 커밋 1개라 파일 수와 커밋 수를 따로 줄 수 없다. 그래서
  파도가 셋이다: 399 + 399 로 파일 798개(= 커밋 798)를 만들고, 세 번째 파도가 앞의 200개를
  다른 시드로 다시 써 **커밋만** 200 늘린다. 씨앗 2커밋을 더해 정확히 800파일 · 1,000커밋.
  생성 41 s.
- `fixtures/repos/poly.steps` — 언어당 20파일 (typescript · tsx · javascript · sql), 79커밋 6,244줄.
  Swift·Dart 는 크레이트가 없어 넣지 않았고, 「언어가 늘면 여기 파도를 하나 더」를 파일 안에
  주석으로 적었다.
- `scripts/make-fixture-repo.sh` 에 `.js` 종류를 더했다 — 지금 문법 넷 중 javascript 만
  합성기가 못 만들었다. **기존 ts/tsx/sql 함수는 손대지 않았고**, HEAD 의 옛 스크립트와
  나란히 돌려 tiny·projectox-like·two-commits 세 픽스처의 커밋+트리 해시가 바이트 단위로
  같은 것을 확인했다.

### 벤치

- `apps/desktop/src-tauri/benches/ingest.rs` (criterion, `harness = false`). 두 몫을 한다 —
  ① 계측 실행 1회로 단계별 ms(walk·parse·git·write)·피크 RSS·증분을 재서 JSON 으로 내고,
  ② criterion 이 tiny·large-100k 를 표본으로 돌려 p50 을 낸다.
- 단계는 진행 이벤트 `ingest_progress` 의 `elapsedMs` 로 쪼갠다. **한계**: sqlite 쓰기는
  500행마다 끼어들므로 `write` 창은 마지막 flush 뿐이고 배치 쓰기의 대부분은 parse·git 창
  안에 있다. 03 §7 의 「sqlite ≤ 2 s」를 따로 못 뽑는다 — 더 쪼개려면 잡이 이벤트를 더
  내야 하는데 그것은 줄 예산 문제다.
- 피크 RSS: 리눅스는 `/proc/self/status` 의 `VmHWM`(참값), macOS 는 `ps -o rss=` 를 100 ms
  마다 훑은 표본 최대. 워크스페이스가 `unsafe_code = "forbid"` 라 `getrusage`·mach 호출을
  쓸 수 없어 윈도는 **0(측정 못 함)** 이고 그 이유를 파일 주석에 적었다.
- `scripts/bench.sh` — 픽스처가 없으면 만들고, 벤치를 돌려 `bench/current.json` 을
  `bench/baseline.json` 과 견준다. **+30 % 면 실패**(03 §7 · 06 §1.6). 다만 비율만 보면
  1 ms 짜리 `writeMs` 가 2 ms 될 때 +100 % 로 잡히므로 절대 증가분 20(ms·MB)도 함께 넘어야
  실패로 친다. 기준선이 없으면 이번 결과를 기준선 삼고 통과, 갱신은 `--update`.
- `package.json` 에 `"bench": "bash scripts/bench.sh"`.

## 실측 (M4 macOS · 12스레드 · 다른 에이전트가 같은 기계에서 빌드 중)

| 항목 | 실측 | 03 §7 목표 |
|---|---|---|
| 첫 인제스트 총 | 2,468 ~ 3,269 ms | ≤ 15,000 ms |
| ├ walk | 77 ~ 347 ms | — |
| ├ parse (+배치 쓰기) | 1,994 ~ 2,247 ms | ≤ 8,000 ms |
| ├ git (커밋 1,000 diff) | 396 ~ 674 ms | ≤ 4,000 ms |
| └ write (마지막 flush) | 1 ~ 2 ms | ≤ 2,000 ms |
| 증분 (커밋 1 · 파일 5) | 328 ~ 342 ms | ≤ 500 ms |
| 피크 RSS | 84 ~ 89 MB | ≤ 300 MB |
| criterion p50 large-100k | 2.55 ~ 2.88 s | ≤ 15 s |
| criterion p50 tiny | 228 ~ 247 ms | — |

캡처 444,221건. **초과 항목 없음.** 폭이 넓은 것은 다른 에이전트가 같은 기계에서 cargo 를
돌리고 있었기 때문이다 — CI 기준선은 조용한 러너에서 다시 떠야 한다.

## 걸린 것 두 가지

1. **cargo #6313 output filename collision.** 루트의 `[profile.release] panic = "abort"` 때문에
   cargo 가 `chickadee_app_lib` 를 두 벌(abort·unwind) 만들고 두 rlib 이 같은 파일명을
   노린다. 경고로 끝날 때도 있고 벤치가 엉뚱한 rlib 에 링크돼 E0308 로 죽을 때도 있다
   (실제로 4회 중 1회 죽었다). `scripts/bench.sh` 안에서만
   `CARGO_PROFILE_RELEASE_PANIC=unwind` 로 통일해 라이브러리를 한 벌만 만들게 했다 —
   배포 경로(`pnpm tauri build`)는 이 변수를 보지 않으므로 그대로 abort 다.
2. **criterion 의 measurement_time.** 600 s 를 주면 남는 시간을 반복으로 채워 표본 10개를
   250회 반복으로 돌린다(11분). `표본 수 × 1회 소요` 언저리(30 s)로 낮춰 1.5분으로 줄였다.

## 남긴 발견 — 고치지 않음

`jobs.rs` 의 증분 경로가 `repo.dropped(old, "")` 를 부른다. `to` 가 빈 문자열이면
`walk.hide` 가 실패해 **`old` 에서 닿는 커밋 전부**가 「사라진 커밋」으로 돌아온다 —
large-100k 증분에서 999개가 `commit_mark_unreachable` 로 들어간다. 리베이스가 없었는데도
매번 그렇다. 증분 342 ms 안에 이 비용이 들어 있다. `crates/**`·`src/**` 는 줄 예산이
잠겨 있어 이 작업 범위 밖이라 손대지 않았다.

## 검증

`bash scripts/make-fixture-repo.sh large-100k · poly` 통과(800파일 101,772줄 1,000커밋 /
언어당 20파일). `bash scripts/bench.sh` 가 기준선 비교까지 통과. `cargo test -p chickadee-app
--test pipeline` 13건 통과 · `git diff --exit-code fixtures/ipc` 차이 없음 ·
`bash scripts/check-rust-budget.sh` 2041/2100 · `cargo fmt --all --check` · `cargo clippy
--all-targets` 무경고.