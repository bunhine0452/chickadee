---
schema_version: 1
type: feature
slug: "stdin-runner-drills-and-build-format"
status: done
difficulty: high
created_at: "2026-09-05T21:44:19+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5 (1M)"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src-tauri/src/commands/stdin.rs"
    op: create
  - path: "apps/desktop/src-tauri/tests/stdin.rs"
    op: create
  - path: "apps/desktop/src-tauri/src/commands/mod.rs"
    op: update
  - path: "apps/desktop/src-tauri/src/lib.rs"
    op: update
  - path: "apps/desktop/src-tauri/src/commands/proc.rs"
    op: update
  - path: "packages/ipc-client/src/types.ts"
    op: update
  - path: "packages/ipc-client/src/index.ts"
    op: update
  - path: "packages/grading/src/stdin-runner.ts"
    op: create
  - path: "packages/grading/src/stdin-runner.test.ts"
    op: create
  - path: "packages/grading/src/build.ts"
    op: create
  - path: "packages/grading/src/build.test.ts"
    op: create
  - path: "packages/grading/src/runner.ts"
    op: update
  - path: "packages/grading/src/index.ts"
    op: update
  - path: "packages/dictionary/src/drills.ts"
    op: create
  - path: "packages/dictionary/src/bundle.ts"
    op: update
  - path: "packages/dictionary/src/index.ts"
    op: update
  - path: "packages/cards/src/drill.ts"
    op: create
  - path: "packages/cards/src/drill.test.ts"
    op: create
  - path: "packages/cards/src/build.ts"
    op: create
  - path: "packages/cards/src/build.test.ts"
    op: create
  - path: "packages/cards/src/index.ts"
    op: update
  - path: "packages/i18n/src/ko/drill.ts"
    op: create
  - path: "packages/i18n/src/en/drill.ts"
    op: create
  - path: "packages/i18n/src/ko.ts"
    op: update
  - path: "packages/i18n/src/en.ts"
    op: update
  - path: "apps/desktop/src/screens/course/DrillPlate.tsx"
    op: create
  - path: "apps/desktop/src/screens/course/DrillPlate.css"
    op: create
  - path: "apps/desktop/src/screens/course/DrillPlate.test.tsx"
    op: create
  - path: "apps/desktop/src/data/runner.ts"
    op: update
  - path: "dictionary/drills/README.md"
    op: create
  - path: "docs/program/fundamentals.md"
    op: update
related: []
tags:
  - "D186"
  - "D187"
  - "D175"
  - "runner"
  - "drills"
  - "build-format"
  - "fundamentals"
  - "mcp-tool"
---
[x] 표준 입력 러너 + 우리가 쓴 작은 문제 열넷 + `build` 형식 유보 해제 (S9)

## 추가 기능

0부(값과 식)를 값 적기로 배운 사람이 **그 값이 필요한 다섯 줄짜리 프로그램**을 써서 돌리는 층을 세웠다. 백준 1000번대가 하는 일과 자리가 같되 **문제는 우리 것**이다 — 대회 사이트의 지문도 케이스도 복제하지 않았고, 가져온 것은 「첫 단계가 입출력 → 사칙연산 → 조건 → 반복 → 배열 → 문자열」이라는 주제 순서 하나뿐이다.

- **셋째 러너** — `commands/stdin.rs`(251줄) + `packages/grading/src/stdin-runner.ts`. Rust 는 걸음 여럿을 한 호출에 받아 프로세스를 띄우고 stdout/stderr/종료 코드/시간만 넘기고, 판정은 전부 TS 다. 언어 셋(`py`·`ts`·`java`).
- **문제 열넷** — `dictionary/drills/<id>/{drill.yaml,reference.py}`. 케이스 56개.
- **`build` 형식** — D187 ① 의 유보를 풀었다. 과제 여섯 × 언어 셋.
- **판 둘** — `DrillPlate`(코드 창 + 케이스 표) · `BuildPlate`(식 한 칸). 한 파일에 있고 같은 러너를 탄다.
- **배치 함수** — `drillsAfterPart0({ lang, covered })`. 부 배치는 S11 소유라 끼우는 것은 코스가 한다.

## 동작 흐름

`DrillPlate` 에서 `⌘↵` → `runDrill(spec)` → `runStdin` 이 언어를 한 번 탐지하고 → `ipc.stdin.run` 한 번에 컴파일 걸음 + 케이스 걸음 전부 → Rust 가 임시 디렉터리에 코드를 쓰고 걸음마다 표준 입력을 물려 실행 → 케이스마다 나온 글을 `sameOut` 으로 견줌 → 표에 「입력 · 기대 · 실제 · 판정」.

**D175 규칙 넷이 이 층에서 달라진 자리 넷을 코드 주석과 `fundamentals.md` §14.4 에 적었다.** ① 동의 게이트가 없다(내려받는 것이 없다 — 규칙 ① 은 다운로드가 있을 때의 규칙) ② 상한이 5초(컴파일이 언어당 한 번, 프로그램이 다섯 줄) ③ 작업 디렉터리가 호출 안에서 사라진다(앱 데이터 디렉터리 아래라 「전부 지우기」가 닿는다) ④ 「테스트가 이긴다」가 「나온 글이 이긴다」가 되고 봐주는 것은 줄 끝 공백과 마지막 빈 줄 둘뿐이다.

**정답을 사람이 안 적는다.** `cases[].stdout` 은 `reference.py` 를 돌려 얻은 것이고 `drill.test.ts` 가 케이스마다 같은 참조 풀이를 다시 돌려 대조한다. 곁따르는 제약 하나 — 케이스 출력은 정수와 글자만 쓴다(같은 `3.0` 을 파이썬은 `3.0`, 자바스크립트는 `3` 으로 찍는다). 시험이 이 규칙을 강제한다.

## 실측

| 잰 것 | 값 |
|---|---|
| 문제 · 케이스 | **14 · 56** (io 2 · arithmetic 4 · branch 2 · loop 2 · list 2 · text 2) |
| 파이썬 한 케이스 | **17 ms** · 판 하나(컴파일 + 케이스 넷) **59~63 ms** |
| 노드 한 케이스 (`.ts`, 타입 벗기기) | **56~58 ms** · 판 하나(케이스 넷) **205~208 ms** |
| 자바 | **미검증** — 이 컴퓨터에 JDK 가 없다 (`javac -version`·`java -version` 둘 다 종료 코드 1) |
| `build` 가 굽히는 0부 개념 | **8** — 전부 `common/`·`cs/` 라 언어마다 복제되지 않는다 |
| 시험 | **103** (Rust 13 · stdin-runner 20 · grading/build 18 · cards/drill 21 · cards/build 11 · DrillPlate 20) |
| Rust | `commands/stdin.rs` 251줄 · 센서스 3,239 (D181 로 보고만) |

**툴체인 없음 처리 확인** — 맥의 `/usr/bin/javac` 는 JDK 없이도 있는 빈 껍데기라 파일 존재로는 못 가린다. 탐지가 `javac -version`·`java -version` 을 실제로 돌려 종료 코드를 보고, 이 저장소에서 둘 다 1 이라 `toolchain-missing:java` 가 나온다. 화면이 「이 컴퓨터에서 javac·java 를 찾지 못했습니다」를 말하고 그 판은 게이트 밖이다.

## 결정과 근거

1. **`ts` 에 컴파일 걸음을 안 둔다** — `node --check` 가 타입 표기를 못 읽어 `const a: number = 1` 을 문법 오류로 만든다(실측, 종료 코드 1). 대신 첫 실행의 stderr 에 실린 Node 의 코드(`ERR_*_TYPESCRIPT_SYNTAX`·`SyntaxError`)로 가른다. `tsc`·`esbuild` 는 이 기계에 없고 Node 26 이 `.ts` 를 그대로 돈다.
2. **작업 디렉터리는 임시이되 앱 데이터 디렉터리 아래** — `/tmp` 를 쓰면 사고로 남은 학습자 코드에 「전부 지우기」(06 §6.4)가 못 닿는다. `Drop` 이 지우므로 임시성은 지킨다.
3. **못 시작한 프로그램은 오류가 아니라 `spawnFailed`** — `proc.rs` 는 `RUN_SPAWN` 을 던지지만, 여기서는 「없는 것」 자체가 탐지의 답이다 (D175 ⑤).
4. **`build` 는 인정 집합을 끝내 안 쓴다** — 유보의 사유가 「인정 집합은 반드시 불완전하다」였으므로, 러너 없는 일곱 언어에 인정 집합을 까는 대신 **판을 안 낸다.** 대신 실행 앞에 순수한 문 셋(빈칸·값을 그대로 적음·주어진 수 안 씀)을 두었다 — 답을 그대로 적으면 실행하면 통과해 버려서 실행 앞에서 막아야 한다.
5. **`build` 의 입력을 토큰 팔레트에서 자유 텍스트로 바꿨다** — 팔레트였던 이유가 「식은 자유 텍스트로 채점 못 한다」였고, 실행이 채점하므로 그 전제가 사라졌다. 팔레트를 두면 §3.1 의 「고르기로 되돌아가지 않는다」를 형식 하나가 깬다.
6. **`drill` 카드는 원장에 안 앉힌다** — `card.kind` 에 값을 더하려면 마이그레이션 `0010` 이 필요한데 그것이 아직 없다. `buildValueItems` 가 순수 함수로 사는 자리(§12)와 같게 두었다. 마이그레이션 0줄.
7. **문제 YAML 은 `dictionary/drills/` 에 두되 사전 로더가 안 본다** — `bundle.ts` 에 `NOT_CONCEPTS` 를 하나 두어 `bundledLangs()` 가 건너뛴다. 안 그러면 개념 스키마 검사가 문제 파일 열넷을 전부 「스키마 위반」으로 잡는다.
8. **케이스 출력에 실수를 안 싣는다** — 시험이 `\d\.\d` 를 금지한다. 실수는 입력과 판단에만 쓴다(`float-not-exact` 가 `yes`/`no` 를 낸다).

## 못 한 것

- **자바 러너는 이 기계에서 미검증이다.** JDK 가 없어 어댑터를 만들되 대본(mock)으로만 갈래를 밟았다 — 컴파일 실패 · 통과 · 껍데기 `javac` 탐지 셋.
- **코스 배선은 안 했다.** `drillsAfterPart0` 를 함수 하나로 내놓았고 `packages/course/src/curriculum.ts` 는 S11 소유라 안 건드렸다.
- **`build` 형식의 원장 자리**는 마이그레이션 `0010` 이 설 때다.

## 검증

`pnpm typecheck`(9 패키지) · `pnpm test:unit` **2,567 통과** · `cargo test --workspace`(`stdin.rs` 13 포함) · `cargo clippy --workspace --all-targets` 경고 0 · `cargo fmt --all --check` 무출력 · `bash scripts/check-rust-budget.sh` 방벽 넷 초록 · 내 파일 `eslint`·`stylelint` 0. 남은 리포 전체 lint 오류 둘(`scripts/_measure.mjs` · `tests/gates/shots.spec.ts`)과 `cargo test` 의 `py/string-literal` 하나는 동시 세션(S2 · S6)의 미완 파일이다.