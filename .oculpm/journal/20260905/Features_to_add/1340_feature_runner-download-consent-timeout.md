---
schema_version: 1
type: feature
slug: "runner-download-consent-timeout"
status: done
difficulty: medium
created_at: "2026-09-05T13:40:32+09:00"
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
  - path: "apps/desktop/src-tauri/src/commands/proc.rs"
    op: update
  - path: "apps/desktop/src-tauri/tests/proc.rs"
    op: update
  - path: "packages/ipc-client/src/types.ts"
    op: update
  - path: "packages/grading/src/runner.ts"
    op: update
  - path: "packages/grading/src/java-runner.ts"
    op: update
  - path: "packages/grading/src/runner.test.ts"
    op: update
  - path: "packages/grading/src/index.ts"
    op: update
  - path: "apps/desktop/src/data/runner.ts"
    op: update
  - path: "apps/desktop/src/components/run/RunPanel.tsx"
    op: update
  - path: "apps/desktop/src/components/run/RunPanel.css"
    op: update
  - path: "apps/desktop/src/components/run/RunPanel.test.tsx"
    op: update
  - path: "packages/i18n/src/ko/run.ts"
    op: update
  - path: "packages/i18n/src/en/run.ts"
    op: update
related:
  - ref: "20260905/Features_to_add/1328_feature_jdk-gradle-test-runner.md"
    kind: "followup"
tags:
  - "D175"
  - "runner"
  - "gradle"
  - "network"
  - "consent"
  - "mcp-tool"
---
[x] 러너 — 배포본 내려받기 동의 게이트와 상한 기본값 (D175 사용자 결정 둘)

## 추가 기능

앞 일지의 러너에 사용자 결정 둘을 얹었다. 그리고 C6 의 D180(러너가 돌면 테스트가 이긴다)이
`error` 의 뜻을 바꾼 것을 반영해 상태 매핑을 고쳤다.

**① 배포본 내려받기는 첫 회에 한해 동의를 받는다.** 앞 판은 조용히 받고 사후에 로그로
말했는데, 그것은 정본 §5 의 「네트워크는 끈다」와 06 의 네트워크 0 증명을 깬다. 반대로
「배포본 없으면 무조건 `no-runner`」는 처음 쓰는 사람에게서 러너를 영영 뺏는다.

그 사이를 Rust 에 **일반적인 선행 조건**으로 만들었다 — `ProcSpec.needs`(홈 상대 경로)가
하나라도 없으면 `ProcOut.missing` 으로 돌려주고 **프로그램을 시작조차 하지 않는다**.
Rust 는 Gradle 을 모른다. 무엇을 봐야 하는지는 `java-runner.ts` 의 `distPath()` 가 안다.

**② 상한은 기본 180초, 작업본을 처음 만드는 회만 600초.** Rust 의 600초는 그대로 두었다 —
그것은 방벽이지 기본값이 아니다. 기다리는 동안 화면이 무엇을 하는 중인지 말하고,
**러너가 도는 시간은 하루 예산에 넣지 않는다**(학습자가 푼 시간이 아니라 기계가 컴파일한
시간이다). 이 판단도 D175 행에 적었다.

**③ `error` 와 `no-runner` 의 경계를 다시 그었다.** D180 에서 `error` 는 「학습자의 답이
틀렸다」로 세어진다. 그래서 실행기가 시작조차 못 했거나(`RUN_SPAWN`), 캐시에 없는
의존성·없는 `test` 태스크로 빌드가 못 선 경우는 `no-runner` 로 내린다(`cannotHost`).
컴파일 오류만 `error` 다 — 그것 하나가 답 안에 있다.

## 동작 흐름

1. `runJava` 가 탐지 때 읽어 둔 Gradle 버전으로 `needs: ['.gradle/wrapper/dists/gradle-8.7-bin']`
   을 건다. 허락을 이미 받았거나 버전을 못 읽었으면 조건을 걸지 않는다.
2. 없으면 Rust 가 아무것도 시작하지 않고 `missing` 을 돌려준다 →
   `status: 'no-runner'` + `askDownload: { name: 'Gradle 8.7' }`. **오답이 아니다.**
3. 화면이 「Gradle 8.7 배포본을 한 번 내려받아야 합니다」를 묻는다. 「아니오」면 그 단은
   게이트 밖. 「예」는 `settings` 의 `runner.allowDownload` 에 남아 다시 묻지 않는다
   (`saveEditorAssist` 가 쓰는 것과 같은 방식이라 `Settings` 타입을 넓히지 않았다).
4. 테스트 실행 자체의 `--offline` 은 허락과 무관하게 그대로다.

## 검증

- `cargo test --workspace` 초록(`tests/proc.rs` 9건 — 선행 조건이 실제로 시작을 막고, 조건이
  다 차면 평소대로 도는 것을 한 시험이 둘 다 본다). `clippy -D warnings` · `fmt --check` 통과.
- `bash scripts/check-rust-budget.sh` — **2,769/2,800**. 예산을 올리지 않았지만 여유가 31줄까지
  줄었다. 다음에 Rust 를 건드리는 판은 예산부터 봐야 한다.
- `pnpm typecheck` · `pnpm lint` **오류 0**. `pnpm test:unit` **2,304 통과 · 0 실패**.
- 앞서 보고된 빨간 셋(`java-runner` 의 `gradle?: string`, `RunPanel` 의 `t()` number,
  `error-copy` 의 `RUN_SPAWN`·`RUN_IO`)은 앞 판에서 이미 고쳐져 있었고, 지금 게이트가 그것을
  확인한다.

## 메모

기다리는 동안의 「작업본 준비 · 컴파일 · 테스트」 3단계 진행 표시는 **넣지 않았다.** 실행이
IPC 한 번의 블로킹 호출이라 중간 단계를 관측할 수 없고, 관측 못 하는 것을 단계로 그리면
화면이 거짓말을 한다. 대신 관측되는 것 하나 — **첫 회인가 아닌가** — 로 갈라 첫 회에만
「작업본을 만들고 처음부터 컴파일하고 있습니다」와 「기다린 시간은 오늘 학습 시간에 넣지
않습니다」를 낸다. 진짜 3단계가 필요하면 Gradle 출력을 스트리밍 이벤트로 올려야 하고,
그것은 `t3_run` 에 이벤트 채널을 다는 별도 판이다.