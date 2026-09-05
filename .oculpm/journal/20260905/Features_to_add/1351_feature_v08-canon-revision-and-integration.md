---
schema_version: 1
type: feature
slug: "v08-canon-revision-and-integration"
status: done
difficulty: superhigh
created_at: "2026-09-05T13:51:20+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: ".oculpm/discussion/vibe-code-study-app/discussion.md"
    op: update
  - path: "docs/00-overview.md"
    op: update
  - path: "apps/desktop/src/App.tsx"
    op: update
  - path: "packages/i18n/src/ko/home.ts"
    op: update
  - path: "packages/i18n/src/en/home.ts"
    op: update
  - path: "scripts/check-motion.mjs"
    op: update
  - path: "scripts/check-motion.test.mjs"
    op: update
  - path: "packages/cards/src/t0-synthetic.ts"
    op: update
  - path: "dictionary/java/interface.yaml"
    op: update
  - path: "dictionary/java/abstract-class.yaml"
    op: update
related: []
tags:
  - "D174"
  - "정본"
  - "스프링"
  - "실행"
  - "병렬"
  - "v0.8"
  - "mcp-tool"
---
[x] 0.8 정본 개정(D174)과 병렬 여섯의 통합

## 추가 기능

사용자의 물음: 「MonggleMonggle 을 바이브 코딩으로 만든 사람에게 자바 기초부터 스프링 개념을 전부 익히게 할 수 있나」. **답은 아니다**였고 근거는 취향이 아니라 셈이 가능한 사실 넷이었다 — `dictionary/spring/` 0장 · `t3_run` 이 언제나 `NOT_IMPLEMENTED`(스프링은 애너테이션의 런타임이 내용의 전부다) · 클론 코딩이 원본과 줄을 견주는 필사 · 한국어 UI 문구에 「판」126 · 「인쇄」24 · 「대지」19 · 「잉크」17회.

사용자가 세 갈래를 골랐고(은유를 걷어내고 도구답게 / JDK·Gradle 러너를 넣는다 / 정식 자바 코스 + 내 코드 대조) **정본 개정을 허락했다.** 2026-09-02 의 「도감」 반려에 이은 두 번째 디자인 뒤집기라 이번에는 취향을 논리로 덮지 않고 세 갈래를 물어서 받았다.

**내가 한 것 — 정본 개정(D174)**: 결론 §1(교재가 둘로) · §2(트랙 표 → 다섯 단, 4·5단 실행 판정) · §3(은유 낱말 정리) · §4(별도 입문 과정을 만든다 — 3부) · §5(실행 러너 규칙 넷 + 범용성 세 티어) · §6(평문이 정본, 은유는 시각에만 + 구문 강조 예외) · §7(마스코트를 진도에서 뺀다) · §8(앱이 정본, 목업은 이력) · §9(뒤집힌 옛 결정 넷). 토의 로그 한 행. 폐기된 넷 — 인쇄소 어휘 · T3 유보 · 「별도 입문 과정을 만들지 않는다」 · 「교재는 내 코드뿐」.

**병렬 여섯(전부 Opus 5)**: C1 실행 러너(D175) · C2 `spring/` 15장(D176) · C3 정식 코스 3부(D177) · C4 평문화(D178) · C5 시각 절제(D179) · C6 실행 채점(D180).

## 동작 흐름

세션 간 결정을 내가 갈랐다.

- **구문 강조 3색은 남긴다** — 「색은 상태에만」의 예외를 정본 §6 에 되살렸다. 2026-09-02 에 한 번 지웠다가 「판독을 거래한 미검증 도박」으로 철회한 자리다.
- **첫 기록의 마스코트는 뺀다 · 트랙 색과 범례를 걷는다** — 정본을 글자대로 읽으면 답이 정해져 있었다.
- **배포본 내려받기는 첫 회에 한해 동의를 받고 연다** — 조용히 받으면 네트워크 0 증명을 깨고, 무조건 막으면 처음 쓰는 사람이 러너를 못 켠다.
- **타임아웃 180초 / 첫 회 600초, 러너 시간은 하루 예산 밖.**
- **다형성은 개념을 새로 세우지 않는다** — `java/interface`·`abstract-class` 가 `cs/dynamic-dispatch` 를 선행으로 가리키게 했다(나머지 둘은 이미 걸려 있었다).

**내가 직접 고친 것 셋**: ① `App.tsx` 에 한국어가 여섯 줄 박혀 있어 영어 화면에서도 한국어가 나왔다 — 카탈로그로 옮겼다(D117 위반이자 D178 미적용). ② `scripts/check-motion.mjs` 의 죽은 예외 둘(`.dee.lifer`·`.dee.peek`)을 지우고, 그 자리를 지키는 시험을 「예외가 비었다」로 뒤집었다. ③ `t0-synthetic.ts` 의 사유 표에 `spring/bean-lifecycle: 'scale'` 을 더했다 — C2 가 낱말 여덟으로 재도 0곳이었고, 이 리포의 빈이 전부 무상태라 여닫을 자원이 없다는 것이 사실이었다. ④ 정본 §2 의 「네 층」이 다섯을 나열하던 내 오류.

## 검증

`pnpm typecheck`·`pnpm lint` 무출력 · `pnpm test:unit` **2,305 통과 / 실패 0**(203파일) · `cargo test --workspace` 20 스위트 ok · `cargo fmt --check`·`clippy -D warnings` 0 · `check-rust-budget.sh` **2,769/2,800**(예산 안 올림, 여유 31줄) · `dict:lint` 16/16 · `design:check`·`check:contrast` 48쌍·`check:motion` 0·`version:check`·`licenses:check` 통과 · `test:gates` **114**(chromium+webkit) · `test:e2e-ui` **26** · 파이프라인 시험 16 ok 로 `fixtures/ipc` 재생성(차이 0) · 시크릿 grep 0.

## 메모

시각 회귀는 기준선이 0장이라 CI 에 아직 안 켜져 있다 — 걱정했던 40장 빨강은 없다. 남은 것은 사용자 결정 셋(계약 테스트를 특성화 테스트로 올릴지 · 코스 74일 · `_glossary.en.yaml` 의 스프링 영어 이름)이고 전부 최종 보고에 적었다.