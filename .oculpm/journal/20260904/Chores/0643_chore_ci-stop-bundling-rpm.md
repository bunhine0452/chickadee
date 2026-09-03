---
schema_version: 1
type: chore
slug: "ci-stop-bundling-rpm"
status: done
difficulty: low
created_at: "2026-09-04T06:43:13+09:00"
session_id: "20260904-002"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: ".github/workflows/ci.yml"
    op: update
related: []
tags:
  - "ci"
  - "m5"
  - "perf"
  - "mcp-tool"
---
[x] [x] CI 40분 35초 → 5분 16초 — 아무도 안 여는 번들을 굽고 있었다

## 동기

「리눅스 빌드가 왜 이렇게 오래 걸리나」를 실측으로 쪼갰다 (run 33804384792).

- `build (ubuntu-22.04)` 32분 = Rust 컴파일 **2분 39초** + deb **8초** +
  **rpm 25분 43초** + AppImage **1분 50초**. 병목은 컴파일이 아니라 rpm 이었다 —
  `--debug` 바이너리(디버그 정보 포함)를 단일 스레드로 압축한다.
- `e2e-linux` 40분 = `tauri build --debug` **37분 25초** + 시나리오 E1~E8 **60초**.
  그 잡은 `target/debug/chickadee-app` 만 구동하는데 번들 셋을 다 만들고 있었다.

`tauri.conf.json` 의 `bundle.targets` 가 `"all"` 이고, 릴리스가 파는 리눅스 산출물은
CHANGELOG 대로 AppImage·deb 둘뿐이다 — CI 의 rpm 은 만들어서 버리는 물건이었다.

## 변경 요약

- `e2e-linux` → `pnpm tauri build --debug --no-bundle`. 상한 55 → 25분.
- `build-3os` → OS 별 번들을 매트릭스로 옮기고 리눅스는 `--bundles deb,appimage`.
  rpm 은 `release.yml` 이 계속 만든다 — macOS 가 dmg 를 릴리스로 미뤄 둔 것과 같은 갈래다.
  잃는 것: rpm 번들이 깨지면 PR 이 아니라 태그 때 보인다.

## 검증

CI 33808830343 8개 잡 전부 success. 전체 **40분 35초 → 5분 16초**,
`e2e-linux` 40분 → **2분 48초**, `build (ubuntu-22.04)` 32분 → **4분 37초**
(Rust 캐시가 채워진 것도 함께 작용했다).