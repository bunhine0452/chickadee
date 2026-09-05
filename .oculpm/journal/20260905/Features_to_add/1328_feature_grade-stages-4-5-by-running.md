---
schema_version: 1
type: feature
slug: "grade-stages-4-5-by-running"
status: done
difficulty: high
created_at: "2026-09-05T13:28:41+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/00-overview.md"
    op: update
  - path: "packages/grading/src/stage.ts"
    op: update
  - path: "packages/grading/src/stage.test.ts"
    op: update
  - path: "packages/grading/src/index.ts"
    op: update
  - path: "packages/cards/src/stage-tests.ts"
    op: create
  - path: "packages/cards/src/stage-tests.test.ts"
    op: create
  - path: "packages/cards/src/stage-edit.ts"
    op: update
  - path: "packages/cards/src/stage-types.ts"
    op: update
  - path: "packages/cards/src/index.ts"
    op: update
  - path: "packages/store-sql/src/types.ts"
    op: update
  - path: "packages/store-sql/src/schemas.ts"
    op: update
  - path: "packages/course/src/bake.ts"
    op: update
  - path: "packages/course/src/materials.ts"
    op: update
  - path: "packages/course/src/deps.ts"
    op: update
  - path: "packages/course/src/index.ts"
    op: update
  - path: "packages/course/src/measure.test.ts"
    op: update
  - path: "packages/course/src/materials.test.ts"
    op: update
  - path: "packages/concepts/src/progress.ts"
    op: update
  - path: "packages/concepts/src/progress.test.ts"
    op: update
  - path: "apps/desktop/src/screens/course/run.ts"
    op: update
  - path: "apps/desktop/src/screens/course/run.test.ts"
    op: update
  - path: "apps/desktop/src/screens/course/data.ts"
    op: update
  - path: "apps/desktop/src/screens/course/StageOverlay.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/RepairPlate.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/ReimplPlate.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/RunStrip.tsx"
    op: create
  - path: "apps/desktop/src/screens/course/CourseScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/ChapterPanel.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/ChapterToc.test.tsx"
    op: update
  - path: "apps/desktop/src/screens/course/ChoicePlate.test.tsx"
    op: update
  - path: "packages/i18n/src/ko/course.ts"
    op: update
  - path: "packages/i18n/src/en/course.ts"
    op: update
  - path: "packages/i18n/src/ko/grading.ts"
    op: update
  - path: "packages/i18n/src/en/grading.ts"
    op: update
related: []
tags:
  - "D180"
  - "course"
  - "grading"
  - "runner"
  - "spring"
  - "mcp-tool"
---
[x] 4·5단을 실행으로 판정한다 — 필사를 버리고 구성을 잰다 (D180)

## 추가 기능

정본 §2 개정(4·5단 정답지 = AST 제약 + 테스트 통과 / 테스트 통과)을 코드로 옮겼다.

- **판정 우선순위 — 테스트가 이긴다.** `gradeStage` 의 4·5단은 이제 `gated: false` 로 나가고,
  러너가 돈 뒤 `mergeRun` 이 최종 판정을 만든다. 테스트가 통과하면 AST 제약이 어긋나도 정답,
  실패하면 제약을 다 맞혀도 오답. `no-runner` 만 예외 — 오답이 아니라 게이트 밖이다.
- **5단에서 줄 비교를 걷어냈다.** `gradeReimpl` 이 더는 `gradeT1(payload.original, …)` 을 부르지
  않는다. 남은 정적 검사는 `reimpl-layer` 의 연결 검사 하나이고, 테스트가 없으면 `handoff` 와
  같이 채점 없음(`pct: null`)이다. `original` 은 채점 뒤 접어 펼치는 참고 자료로 내려갔다.
- **판정용 테스트** — 새 순수 모듈 `stage-tests.ts`. 갈래 셋을 순서대로 본다: ⓐ `fix:` 커밋이
  같이 고친 테스트 파일 ⓑ 이름이 맞는 리포 테스트(`AuthService` → `AuthServiceTest`)
  ⓒ 생성한 계약 테스트(공개 메서드의 이름·인자 수·인자와 반환 타입의 단순 이름을 리플렉션으로
  못박는 JUnit 한 장). 자바면 스프링 컨텍스트 로드 테스트를 늘 함께 붙인다 — 애너테이션 배선은
  컨텍스트가 떠 봐야 드러난다. 뽑힌 것이 0장이면 그 판은 게이트 밖이다.
- **게이트** — `passTarget(hasRepair, hasRun)` 이 3·4·5 를 돌려준다. 정본 §2 의 식 그대로
  「1·2·3 ∧ (문항을 구울 수 있으면 4) ∧ (러너가 있으면 5)」. `tally` 는 `gated` 가 아닌 판정을
  묻지 않은 것으로 세고, 5단에서 판정한 판이 0이면 그 챕터의 통과선은 4로 내려앉는다.
- **화면** — `RunStrip` 이 실행 상태 넷(실행 중·통과·실패·러너 없음)과 첫 실패 셋의 테스트 이름·
  메시지를 싣는다. 게이트 밖이면 그 사실을 말한다.
- **`spring/` 카드 배선** (오케스트레이터 요청 · B `b-evidence`) — `bakeSiteless` 가 `proto` 를
  하드코딩하던 자리를 `COMPUTED_NAMESPACES` 단일 출처로 바꿨다(`SITELESS_NAMESPACES` — 자기
  생성기가 있는 `common/`·`arch/`·`exec/` 만 뺀다). 갈래는 개념이 든 재료가 정한다: 근거 낱말이
  있으면 그 낱말이 보이는 블록, 없으면 빌린 창. 여기에 **클래스 머리 창**(첫 칸 앞 60줄)을
  블록으로 더했다 — 줄기의 칸은 메서드 본문이라 `@Service`·`@RequiredArgsConstructor` 가 창 밖이었다.

## 동작 흐름

채점 → (4·5단이고 테스트가 있으면) 답을 파일 창으로 옮겨(`answerWindow`) 원본 전문에 끼우고
(`spliceWindow`) `runTests` → `mergeRun` 으로 판정란을 덮어쓴다. 원본 리포에는 쓰지 않는다.

## 검증

`pnpm typecheck` · `pnpm lint` · `pnpm test:unit` (202파일 2,277시험) 전부 초록.
실측(MonggleMonggle 로그인): 4단 3장 · 5단 3장 · 판정용 테스트는 자바 판마다 2장(생성한 계약
테스트 + `FinalProjectApplicationTests`), 프런트 판은 0장. `fix:` 커밋 82개 중 테스트를 건드린
것은 0개라 갈래 ⓐⓑ 는 이 리포에서 안 걸린다. `spring/` 15개 중 근거 낱말이 리포에서 보이는 것
14개(`bean-lifecycle` 만 0), 머리 창을 더해 메서드 창 안에서 걸리는 것이 3 → 11 로 늘었다.

## 메모

실행이 잡는 것은 **컴파일·시그니처·빈 배선**이고, 리포에 행위 테스트가 없으면 「본문의 값이
옳은가」는 여전히 못 잰다. 화면이 그 한계를 말한다.