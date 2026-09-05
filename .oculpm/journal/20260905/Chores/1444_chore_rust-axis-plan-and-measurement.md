---
schema_version: 1
type: chore
slug: "rust-axis-plan-and-measurement"
status: done
difficulty: high
created_at: "2026-09-05T14:44:33+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/plan/rust-axis.md"
    op: create
  - path: "docs/curriculum/rs.md"
    op: correct
related: []
tags:
  - "rust"
  - "plan"
  - "curriculum"
  - "runner"
  - "tauri"
  - "measurement"
  - "mcp-tool"
---
[x] 러스트 축 계획 — 사용자 리포 넷 실측과 docs/plan/rust-axis.md

사용자 요청 「자바 말고 다른 언어·프로젝트도 지원할 계획을 세워 달라」의 **러스트 축**.
산출물은 코드가 아니라 계획이고, 코드는 측정을 막는 자리(스크래치패드의 임시 크레이트)에만 썼다.

## 무엇을 했나

`dictionary/rs/` 가 **0장**인 상태에서 사용자 리포 넷(`ai-pm` 280장·116,979줄 · `file_converter`
45·12,281 · `PySpace` 8·1,833 · `ECC/ecc2` 16·52,139 — 앞 셋은 Tauri, ECC 는 대조군 CLI)을
읽기만 하며 실측하고 `docs/plan/rust-axis.md`(731줄) 를 썼다. 결정 등록부에는 행을 안 올렸다 —
초안만 §8 에 적었다.

## 실측 (전부 tree-sitter · rustc 1.98.0)

- **파싱은 된다.** 349장 전부. 그러나 `ERROR` 노드 56개가 **전부 같은 원인** — 이름이 `raw` 인
  변수를 빌리는 `&raw` 를 문법이 못 읽는다(Rust 1.82 의 원시 포인터 문법). ai-pm 280장 중
  **29장(10.4%)**. 번짐은 한 노드에서 멈춘다(트리로 확인).
- **`invoke("x")` ↔ `#[tauri::command] fn x`**: 커맨드 정의 **396** · 문자열 리터럴 호출 자리
  **395** · 이름이 맞는 짝 **392**. D159 의 스프링 HTTP 간선이 12패턴 + 자리표 접기였던 것에
  견줘 패턴 셋이면 선다. **이 축에서 가장 값싼 큰 승리.**
- **`cargo test -- --format json` 은 안정 채널에서 안 된다**(직접 돌려 확인). 대신 libtest 의
  `test x ... ok|FAILED` 한 줄이 병렬에서도 원자적이라 정규식 둘이면 읽힌다 — 자바가 필요했던
  init 스크립트가 필요 없다.
- **러스트 시험의 88%가 채점 대상 파일 안**(`#[cfg(test)] mod`)에 산다: ai-pm 1,287/1,457.
- **시간·디스크**: file_converter 첫 빌드 39.1초 → 따뜻할 때 1.69초(시험 343개 0.22초).
  ai-pm 첫 빌드 **166.6초** → 따뜻한 재빌드 12.1초 · `cargo test --lib` 12.9초(1,347 통과).
  ai-pm `target/` **6.3 GB**.
- **오프라인이 넷 중 둘에서 실패**: PySpace(`js-sys` 캐시 없음) · ECC(`rust-toolchain.toml` 이
  1.96 을 핀해 rustup 이 툴체인을 받으러 감).
- **개념 39종 사용처 계수**를 냈다. `async`/`await` 이 ai-pm 에서 2,571 + 1,109 로 `?`(2,903)
  다음인데 `rs.md` 에 개념이 없다. 반대로 `trait` 선언은 네 리포 합쳐 **9개**.
- **D180 ⓒ(계약 시험)의 러스트판**을 찾아 검증했다 — 리플렉션 대신
  `const _: fn(i32,i32) -> i32 = 경로;` 한 줄이 컴파일 시에 이름·인자·반환을 못 박고,
  틀리면 `E0308` 이 난다.

## `docs/curriculum/rs.md` 정정 (실측이 닫은 것만)

- §8 `grammar_abi`: **어긋남이 없었다.** `ts` 의 15 는 `typescript` 가 아니라 `javascript` 키였다
  (tree-sitter-javascript 0.25 → abi 15). 런타임 `abi_version()` 으로 rust/ts/tsx/java 전부 14 확인.
- §8 ④ `<` 의 두 뜻: **안 섞인다.** `(binary_expression operator: "<")` 76 대 `(generic_type)` 4,771.
- §7 `cs/static-vs-dynamic-dispatch` 신규 제안 → `cs/dynamic-dispatch` 가 이미 있다.
- 설계 변경 둘(`async`/`await` 추가 · `smart-pointer → shared-thread-state` 선행 끊기)은
  **안 고쳤다** — 계획 §2.3 에 근거만 적고 착수 결정을 기다린다.

## 계획의 뼈대

R1 사전 골격 → R2·R3 1·2부 26장 → (R5 Tauri 간선 · R7 cargo 러너 병렬) → R6 `kind='ipc'` →
R8·R9 → R4 3부 → R10 `tauri/` → R11 골든. 총 YAML ≈ 7,900줄 + TS ≈ 490줄, **Rust 0줄**.
티어는 R1~R4·R11 이 A, 나머지가 B.

## 검증

- `docs/plan/rust-axis.md` 의 수치는 전부 이 세션에서 직접 잰 값이고, 못 잰 것 일곱은 §6 에
  「못 쟀다」로 남겼다.
- **사용자 리포에 한 바이트도 안 썼다.** `CARGO_TARGET_DIR` 를 스크래치패드로 돌리고 `--locked`
  를 붙였다. 네 리포의 변경된 파일 mtime 최신값이 2026-09-03 으로, 오늘 날짜(09-05)가 하나도 없다.
- 이 리포의 변경은 `docs/plan/rust-axis.md`(신규)와 `docs/curriculum/rs.md`(+17/−10) 둘뿐이다.