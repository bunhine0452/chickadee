---
schema_version: 1
type: feature
slug: "v07-course-parallel-integration"
status: done
difficulty: high
created_at: "2026-09-05T12:07:55+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/concepts/src/unknown-rank.ts"
    op: update
  - path: "packages/concepts/src/unknown-rank.test.ts"
    op: create
  - path: "tests/e2e-ui/t0-session.spec.ts"
    op: update
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/01-architecture.md"
    op: update
  - path: "docs/program/README.md"
    op: update
  - path: "fixtures/ipc/projectox-like/t2.json"
    op: update
  - path: "fixtures/ipc/tiny/captures-all.json"
    op: update
related: []
tags:
  - "D173"
  - "코스"
  - "병렬"
  - "통합"
  - "v0.7"
  - "mcp-tool"
---
[x] 0.7 코스 — 병렬 세션 여덟의 통합 검증과 D173

## 추가 기능

사용자 요청 「병렬 세션을 돌려 완성해 줘 · UX 불편도 조사해 정교한 학습 소프트웨어로」. 플랜 `chickadee-v07-course`(7단계 35항목)를 세우고 같은 작업 트리에서 여덟 세션을 돌렸다 — 범위는 파일 단위로 갈라 `claim_paths` 로 잡게 했고, 등록부 번호(D164~D172)를 미리 배정했으며, 커밋은 오케스트레이터가 한다.

| 세션 | 모델 | 결정 | 일지 |
|---|---|---|---|
| A1 문항 16유형 + 0008 | Fable | D164 | `1026_feature_course-exercises-16-types` |
| A2 챕터 통과·재검·오늘 15분 | Opus | D165 | `1008_feature_chapter-pass-recheck-and-today` |
| A3 `proto/` 7 · `java/` 13 · 골든 | Opus | D166 | `1040_feature_java-gate0-oop-and-proto-seven` |
| A4 `cs/` 43 · 린트 | Opus | D167 | `1033_feature_cs-namespace-43-concepts` |
| A5 메서드 경로·진입점·스키마·죽은 갈래 + 0009 | Fable | D168·D169 | `1036_feature_method-paths-schema-dead-branches` |
| A6 UX 감사(21건, 13건 수정) | Fable | D170 | `1047_feature_ux-audit-run-and-fixes-d170` |
| A7 코스 화면 | Fable | D171 | `1155_feature_course-screens-toc-stages-gate` |
| A8 `@chickadee/course` 굽기 + `cs/` 빌림 | Fable | D172 | `1151_feature_course-bake-package-and-borrowing` |

A7·A8 은 세션 한도(11:40 리셋)에 한 번 끊겨 재개했다. Fable 포크 셋 동시가 한도에 닿는다 — 다음엔 둘로.

## 동작 흐름

통합에서 드러난 것 하나가 **D173** 이다. A4 가 언어 개념 25개에 `prereq: [cs/…]` 를 달자 `unknownCount` 가 선행 폐포 전체를 세므로 `ts/string-literal` 같은 뿌리 개념도 미지 1, `ts/array-basics` 는 4 가 되어 새 판 문턱(3)을 넘었다. e2e `t0-session` 03 이 두 엔진에서 같은 자리로 빨갛게 되며 잡혔다. 처방은 계산 네임스페이스(`COMPUTED_NAMESPACES`)의 선행을 미지 수에서 빼는 것 — 사다리와 D154 큐 가지에는 그대로 보인다. `prereq` 의 두 뜻(읽는 데 필요한 선행 / 문법 아래의 기계)을 등록부 행에 적었다. 사다리에서 `cs/` 카드로 **내려가기**는 `jumpPrereq` 가 사용처에서 새로 굽는 구조라 아직 안 된다 — 후속.

그 밖에 오케스트레이터가 한 것: 등록부 행 순서 정리와 §4.2.1 머리말, `docs/01` §2 에 `course` 층, `docs/program/README.md` §7·§8 갱신, A6 의 격리 워크트리 제거, IPC 덤프 재생성.

## 검증

`pnpm typecheck`·`pnpm lint` 무출력 · `pnpm test:unit` 2,231/2,233(실패 1 = `grading/t1.test.ts` 성능 예산 0.2ms — 단독 재실행 통과, 부하 흔들림) · `cargo test --workspace` 전량 ok · `cargo fmt --check`·`clippy -D warnings` 0 · `check:rust` 2,524/2,800 · `dict:lint` 15/15 · `design:check`·`check:contrast` 48쌍·`check:motion` 0·`version:check`·`licenses:check` 통과 · `test:gates` 114 · `test:e2e-ui` 26 통과(chromium+webkit) · 파이프라인 시험 16 ok 로 `fixtures/ipc` 재생성 · 시크릿 grep 0.

## 메모

사용자 결정으로 남긴 것은 최종 보고에 — 4단 없는 챕터의 통과선, 프롬프트 창 폭, 잉크 겹 시각, 첫 실행 질문 기본값, 세션 뒤 홈 밝기, WKWebView Tab, 관문 0 후보 25 → 24, `java/` 보편형 7개, `card.track='t3'` 이름 충돌, 정본 §2·§4·§9 갱신.