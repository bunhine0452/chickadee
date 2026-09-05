---
schema_version: 1
type: feature
slug: "t2-repo-map-grading-and-plate"
status: done
difficulty: medium
created_at: "2026-09-04T17:12:19+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/grading/src/t2.ts"
    op: update
  - path: "packages/grading/src/t2-types.ts"
    op: update
  - path: "packages/grading/src/index.ts"
    op: update
  - path: "packages/grading/src/t2.test.ts"
    op: update
  - path: "packages/grading/src/golden-t2.test.ts"
    op: update
  - path: "fixtures/golden/t2/cases.json"
    op: update
  - path: "fixtures/golden/t2/expected.json"
    op: update
  - path: "packages/i18n/src/ko/cards.ts"
    op: update
  - path: "packages/i18n/src/en/cards.ts"
    op: update
  - path: "packages/i18n/src/ko/session.ts"
    op: update
  - path: "packages/i18n/src/en/session.ts"
    op: update
  - path: "packages/i18n/src/ko/grading.ts"
    op: update
  - path: "packages/i18n/src/en/grading.ts"
    op: update
  - path: "packages/cards/src/t2-quiz.ts"
    op: update
  - path: "packages/cards/src/t2.ts"
    op: update
  - path: "apps/desktop/src/screens/session/t2Copy.ts"
    op: update
  - path: "apps/desktop/src/screens/session/T2Plate.tsx"
    op: update
  - path: "apps/desktop/src/screens/session/T2Plate.test.tsx"
    op: update
  - path: "apps/desktop/src/screens/session/SessionScreen.tsx"
    op: update
  - path: "apps/desktop/src/components/t2/RoleQuiz.tsx"
    op: create
  - path: "apps/desktop/src/components/t2/RoleQuiz.css"
    op: create
  - path: "apps/desktop/src/components/t2/RoleQuiz.test.tsx"
    op: create
  - path: "apps/desktop/src/components/plate/CodePlate.tsx"
    op: update
  - path: "apps/desktop/src/components/plate/CodePlate.test.tsx"
    op: update
  - path: "apps/desktop/src/session-flow.ts"
    op: update
  - path: "packages/store-sql/src/types.ts"
    op: update
related: []
tags:
  - "t2"
  - "d142"
  - "d141"
  - "grading"
  - "i18n"
  - "a11y"
  - "mcp-tool"
---
[x] 리포 지도 두 종의 채점·문구·화면을 배선해 실제로 풀리게 했다 (D142) + 코드 창 되접기 (D141)

## 추가 기능

앞 세션이 `arch/entry`·`arch/role` 두 종의 **생성기와 저장 경로**를 냈지만 채점기와 화면이
없어 카드가 만들어져도 풀 수가 없었다. 그 세 겹을 이었다.

### 채점 — 새 엔진 0개 (04 §8.2 3티어 유지)

- `T2Kind` 를 여섯으로 넓혔다.
- **진입점은 채점 코드가 0줄이다.** `PicksInput.kind` 에 `'entry'` 를 더한 것이 전부고
  `gradePicks` 의 식은 한 줄도 안 고쳤다 — 노드가 파일이 아니라 폴더일 뿐 정답지
  (`core`/`sec`/`trap`)의 모양이 같다. 그 사실을 테스트 다섯으로 못박았다.
- **`gradeRole` 하나만 새로 썼다.** `gradeDirection` 을 한 문항으로 줄인 모양이고 판정은
  기존 `verdictFor` 를 그대로 쓴다. 4지선다라 「정답지 밖을 골랐다」가 없어 wrong 상한을
  끈다(의존성 방향과 같다).
- 골든 4장 추가(8 → 12). 기존 8장은 한 글자도 안 바뀌었다.

### 문구 — 임시 표를 걷었다

`packages/cards/src/t2-quiz.ts` 안에 임시로 살던 `REPO_KO`/`REPO_EN`/`say`/`repoReason`
64줄을 지우고 `packages/i18n` 으로 옮겼다(20키). 화면 문구 넷 + `grading.roleNote` +
접기 문구 둘을 더해 **총 27키, ko 정본 + en 병기**. 부르는 자리 20곳이 `t()` 로 치환됐다.

### 화면 — `role` 만 새 위젯

- 진입점은 기존 지도 짚기 경로 그대로다(`picking` 에 한 종 추가).
- `components/t2/RoleQuiz.tsx` — 지도 + 4지 한 문항. 보기는 `payload.bands` 의 네 라벨이고
  `Choices` 를 재사용해 `1~4` 물리 키·`↑↓` 로빙이 그대로 산다. 물어보는 폴더는 지도에서
  빠져 있으므로 점선 상자 하나로 세운다.
- **새 상태가 0개다.** 문항이 하나라 의존성 방향이 쓰는 `t2Picks` 의 첫 칸을 그대로 쓴다.

### 코드 창 되접기 (D141)

`clone.lines` 를 빌려 쓰던 「… 12줄」을 `plate.foldMore`(「… {{n}}줄 더」)로 바꾸고
`plate.foldLess`(「접기」) 단추를 냈다. 편 뒤에는 접기 단추로, 접은 뒤에는 펴기 단추로
**포커스가 따라간다** — 안 옮기면 키보드로 편 사람이 그 자리에서 포커스를 잃는다 (05 §7).

## 동작 흐름

`SessionScreen` 이 `payload.kind` 로 답의 모양을 고르고 → `session-flow.gradeT2Plate` 가
`entry` 는 `gradePicks`, `role` 은 `gradeRole` 로 보낸다 → 결과 화면은 여섯 종이 같이 쓴다.

## 설계안에서 고친 것 둘

1. **`noteOf` 의 우선순위.** 접힘 사유(04 §7.4)가 `trap` 사유를 먹고 있었다. 리포 지도는
   노드가 전부 접힌 폴더라, 진입점의 오답 사유(「3곳이 이 폴더를 가져다 씁니다」)가 한 줄도
   안 뜨고 여섯 노드가 다 「접힌 폴더 — 안쪽 파일을 묻는 문제가 아님」이 됐다. 이 문제가
   가르치려는 것이 정확히 그 오답이라 사유가 없으면 문제가 사라진다. 정답지에 적힌 사유가
   이기게 하고, §7.4 의 문장은 아무도 사유를 안 적어 준 폴더의 자리로 남겼다.
2. **`t2.entrySec` 의 조사.** 인계 표의 `«{{name}}» 이 있지만` 은 하드코딩 조사이고
   `josa` 로 바꿔도 받침 판정이 「…에스」를 못 읽는다(`grading.directionOneWay` 가 같은
   이유로 조사를 피한다). 조사가 붙지 않는 자리로 문장을 옮겼다 — 「문 이름은 «{{name}}»
   인데 리포 안에서 {{in}}곳이 이 폴더를 가져다 씁니다」.

## 소유 목록 밖에서 고친 것 둘

둘 다 안 고치면 `pnpm typecheck` 가 빨갛다(시작할 때 이미 빨갰다).

- `packages/store-sql/src/types.ts` — `CardKind` 에 `'entry' | 'role'`. 마이그레이션 0005 의
  CHECK 는 이미 열두 값인데 이 타입만 열 값이라 `Plate.kind` 에서 막혔다.
- `apps/desktop/src/screens/session/SessionScreen.tsx` — `T2Answer` 의 `role` 갈래 한 줄.

## 검증

```
npx vitest run packages/grading packages/cards packages/i18n \
               apps/desktop/src/screens/session apps/desktop/src/components
  87 files · 951 passed
pnpm test:unit    177 files · 1975 passed · 0 failed   (시작 시 1938)
pnpm typecheck    전 패키지 Done
npx eslint .      1건 — packages/store-sql/src/migrate-seed.test.ts (내 변경 아님)
check-rust-budget.sh   ok 2349/2800 (Rust 0줄)
```