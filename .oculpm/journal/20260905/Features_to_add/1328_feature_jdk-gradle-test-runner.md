---
schema_version: 1
type: feature
slug: "jdk-gradle-test-runner"
status: done
difficulty: high
created_at: "2026-09-05T13:28:31+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/01-architecture.md"
    op: update
  - path: "apps/desktop/src-tauri/src/commands/proc.rs"
    op: create
  - path: "apps/desktop/src-tauri/src/commands/mod.rs"
    op: update
  - path: "apps/desktop/src-tauri/src/commands/app.rs"
    op: update
  - path: "apps/desktop/src-tauri/src/commands/maint.rs"
    op: update
  - path: "apps/desktop/src-tauri/src/lib.rs"
    op: update
  - path: "apps/desktop/src-tauri/src/error.rs"
    op: update
  - path: "apps/desktop/src-tauri/tests/proc.rs"
    op: create
  - path: "packages/ipc-client/src/types.ts"
    op: update
  - path: "packages/ipc-client/src/errors.ts"
    op: update
  - path: "packages/ipc-client/src/index.ts"
    op: update
  - path: "packages/ui/src/error-copy.ts"
    op: update
  - path: "packages/grading/src/runner.ts"
    op: create
  - path: "packages/grading/src/java-runner.ts"
    op: create
  - path: "packages/grading/src/runner.test.ts"
    op: create
  - path: "packages/grading/src/t3-adapter.ts"
    op: update
  - path: "packages/grading/src/t3-adapter.test.ts"
    op: update
  - path: "packages/grading/src/index.ts"
    op: update
  - path: "apps/desktop/src/data/runner.ts"
    op: create
  - path: "apps/desktop/src/components/run/RunPanel.tsx"
    op: create
  - path: "apps/desktop/src/components/run/RunPanel.css"
    op: create
  - path: "apps/desktop/src/components/run/RunPanel.test.tsx"
    op: create
  - path: "packages/i18n/src/ko/run.ts"
    op: create
  - path: "packages/i18n/src/en/run.ts"
    op: create
  - path: "packages/i18n/src/ko.ts"
    op: update
  - path: "packages/i18n/src/en.ts"
    op: update
related: []
tags:
  - "D175"
  - "runner"
  - "java"
  - "gradle"
  - "tauri"
  - "rust"
  - "mcp-tool"
---
[x] 4·5단을 실제 실행으로 판정한다 — JDK·Gradle 러너 (D175)

## 추가 기능

D174 ② 를 코드로 옮겼다. 그전까지 `t3_run` 은 언제나 `NOT_IMPLEMENTED` 였고 `runners` 는 빈
배열이라 실행이 0이었다. 스프링에서 이것이 특히 나쁜 이유는 애너테이션이 컴파일 시점에
아무 일도 하지 않기 때문이다 — `@Transactional` 이 붙은 소스와 안 붙은 소스는 AST 노드
하나 차이이고, 그 한 노드가 만드는 프록시·롤백은 돌려 봐야 드러난다.

경계는 **프로세스 대 판정**으로 그었다.

- **Rust `t3_run`**(`commands/proc.rs`, 229줄) — 작업본 동기화 → 답안 주입 → 자식 실행 →
  시간·바이트 상한 → 프로세스 그룹 종료 → 출력 반환. Tauri `shell` 플러그인은 쓰지 않았다.
  스코프 문법으로 임의 실행을 여는 대신 `std::process` 로 명령 하나만 노출하니
  `capabilities/default.json` 이 0 줄 늘었다.
- **TS `runner.ts`**(계약) · **`java-runner.ts`**(탐지·인자·출력 읽기, 215줄) —
  언어가 늘 때 늘어나는 쪽이 여기다. 자바 어댑터가 Rust 에 더한 줄은 **0**이다.
- **화면** — `data/runner.ts` 가 상태 일곱을 만들고 `components/run/RunPanel` 이 그린다.
  문구는 `packages/i18n/src/{ko,en}/run.ts` 에 평문으로 (정본 §6).

결과를 JUnit XML 로 읽지 않았다. `build/test-results/**` 를 읽으려면 임의 경로 읽기가 IPC 에
열려야 하는데(06 §4.3), Gradle 초기화 스크립트 한 장을 작업본에 떨구면 같은 사실이 이미
열려 있는 stdout 으로 나온다(`##CHICKADEE##|SUCCESS|클래스|메서드|메시지`).

## 동작 흐름

1. `detectRunner(repoId, rootPath)` — `gradlew`(없으면 `gradlew.bat`) 가 있는지 보고,
   `gradle-wrapper.properties` 의 `distributionUrl` 에서 Gradle 버전을 읽고, **빈 작업본에서**
   `java -version` 하나를 돌린다. 복사도 안 하고 리포도 안 본다.
2. 못 켜면 `{ok:false, reason}` — 오류가 아니라 4·5단을 게이트에서 빼라는 신호다.
   화면은 「이 컴퓨터에서는 4·5단을 채점하지 않습니다」만 말하고 설치를 권하지 않는다.
3. `runTests(spec)` — 답안·테스트·초기화 스크립트를 작업본에 놓고
   `./gradlew --offline --no-daemon --console=plain --init-script … test` 를 돌린다.
4. 출력의 표시줄을 세어 `passed|failed|error|timeout`. 표시줄이 **한 줄도** 없으면
   「실패」가 아니라 「못 쟀다」(`error`)다 — 컴파일 실패·오프라인 의존성 부재·`test` 태스크
   부재가 여기 모이고, 그 구분이 게이트에서 중요하다.

원본 리포는 읽기만 한다. 작업본은 `<app_data>/run/repo-<id>` 하나이고 재사용해서 Gradle
캐시가 남는다. `app_wipe` 에 `run` 을 더해 「전부 지우기」가 여기까지 닿는다.

## 검증

- `cargo test --workspace` 전부 초록 (`tests/proc.rs` 8건 신규 — 원본 불변 · 경로 탈출 거부 ·
  타임아웃이 손자까지 죽임 · 출력 상한 · 래퍼 실행권 유지). **JDK 없이 도는 시험이다.**
- `cargo clippy --all-targets -- -D warnings` · `cargo fmt --all --check` 통과.
- `bash scripts/check-rust-budget.sh` — 2,524 → **2,744/2,800**. 예산을 올리지 않았다.
- `pnpm typecheck` · `pnpm lint` 통과. `runner.test.ts` 21건 · `t3-adapter.test.ts` 2건 ·
  `RunPanel.test.tsx` 11건 초록.
- 실측 ① 1,847 파일 복사 340~540ms(첫 회) / 80~90ms(안 바뀐 둘째 회) ② 400ms 상한을 건
  자식과 그 손자가 0.41초에 함께 죽는다 ③ **진짜 Gradle 리포에서 걸린 것**: Flutter 가 만든
  `android/.gitignore` 가 `/gradlew` 와 `gradle-wrapper.jar` 를 무시해 복사가 래퍼를
  떨어뜨렸고 `RUN_SPAWN` 이 났다. `keep`(복사 규칙이 떨어뜨려도 반드시 가져올 경로)을
  `ProcSpec` 에 더해 고쳤고, 고친 뒤 20 파일 복사 + `./gradlew` 시작까지 229ms.

## 메모

**닫지 못한 구멍 하나**: `gradlew` 는 Gradle 배포본이 `~/.gradle/wrapper/dists` 에 없으면
그것을 내려받는다. 그 시점은 Gradle 이 시작하기 **전**이라 `--offline` 이 닿지 않는다.
감출 수 없으니 로그에서 읽어(`sawDownload`) 화면이 「배포본을 내려받았습니다」로 말한다.

**이 컴퓨터에는 JDK 가 없다.** `/usr/bin/java` 는 「Unable to locate a Java Runtime」을 내는
빈 껍데기이고 `/usr/libexec/java_home` 도 못 찾는다. MonggleMonggle 도 이 기계에 없다.
그래서 `gradlew test` 가 끝까지 도는 것은 못 봤다 — 본 것은 탐지 실패 경로(정확히 `no-jdk`)와
래퍼가 실제로 시작되는 것까지다.