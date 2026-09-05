---
schema_version: 1
type: refactor
slug: "d178-plain-words-over-press-metaphor"
status: done
difficulty: high
created_at: "2026-09-05T13:42:25+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/i18n/src/ko/cards.ts"
    op: update
  - path: "packages/i18n/src/ko/clone.ts"
    op: update
  - path: "packages/i18n/src/ko/core.ts"
    op: update
  - path: "packages/i18n/src/ko/course.ts"
    op: update
  - path: "packages/i18n/src/ko/grading.ts"
    op: update
  - path: "packages/i18n/src/ko/home.ts"
    op: update
  - path: "packages/i18n/src/ko/repos.ts"
    op: update
  - path: "packages/i18n/src/ko/session.ts"
    op: update
  - path: "packages/i18n/src/ko/ui.ts"
    op: update
  - path: "packages/i18n/src/en/cards.ts"
    op: update
  - path: "packages/i18n/src/en/clone.ts"
    op: update
  - path: "packages/i18n/src/en/core.ts"
    op: update
  - path: "packages/i18n/src/en/course.ts"
    op: update
  - path: "packages/i18n/src/en/grading.ts"
    op: update
  - path: "packages/i18n/src/en/home.ts"
    op: update
  - path: "packages/i18n/src/en/repos.ts"
    op: update
  - path: "packages/i18n/src/en/session.ts"
    op: update
  - path: "packages/i18n/src/en/ui.ts"
    op: update
  - path: "apps/desktop/src/session-flow.ts"
    op: update
  - path: "apps/desktop/src/devtools/perfRun.ts"
    op: update
  - path: "packages/cards/src/t2-key.test.ts"
    op: update
  - path: "packages/grading/src/__golden__/t0"
    op: update
  - path: "tests/e2e-ui"
    op: update
  - path: "tests/gates"
    op: update
  - path: "tests/support"
    op: update
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/05-frontend.md"
    op: update
related: []
tags:
  - "d178"
  - "i18n"
  - "a11y"
  - "docs"
  - "copy"
  - "mcp-tool"
---
[x] D178 — UI 문구를 인쇄소 은유에서 평문으로 (전량)

## 동기

정본 §6 이 2026-09-05 사용자 결정으로 개정됐다 — 「평문이 정본이고 은유는 시각에만 남는다」.
D174 ④ 의 실측이 근거다: 한국어 카탈로그에 「판」 126회 · 「인쇄」 24 · 「대지」 19 · 「잉크」 17 ·
「겹」 48회, en 도 `plate` 116 · `layer` 88 · `ink` 46 · `sheet` 36 · `print*` 68회.

설계 문서에 「은유엔 평문 병기」라는 규칙이 있다는 것 자체가 은유가 단독으로 뜻을 못 나른다는
진술이다(D130 이 그 규칙 때문에 판정문을 두 번 고쳤다). 학습자는 `클래스` 를 만나기 전에 `판` 을
백 번 넘게 만난다.

## 변경 요약

**낱말 대응표**(등록부 D178 에 박았다): 판 → 문제·카드 · 대지 → 단원 · 잉크 겹 N겹 → 숙련도 N단계 ·
교정쇄·오늘의 인쇄 → 오늘 학습·오늘 할 것 · 찍는다 → 푼다·배운다·익힌다 · 정합·동등·어긋남 →
같음·같은 뜻·다름 · 어긋났습니다 → 틀렸습니다 · 다시 찍기 → 다시 풀기 · 스티커 → 개념 ·
판이 없는 문법 → 아직 안 배운 문법 · 작업 띠 → 진행 띠 · 작업 지시서 → 오늘 요약 ·
주간반·야간반 → 밝게·어둡게 · 부속 숨김 → 장식 숨김 · 미인쇄·애벌·먹판·+청판·+진홍 →
아직·처음·익히는 중·자리 잡음·다 익힘 · 다음 인쇄 → 다음 복습.

1. **d-i18n** — `packages/i18n/src/{ko,en}/*.ts` 9쌍, 값 179건. **키 이름은 한 자도 안 바꿨다.**
   조사 필터(`|josa:`)와 템플릿 변수는 그대로다. C5 가 `Legend` 컴포넌트를 지워 죽은 키가 된
   `home.legend*` 넷은 삭제했다(카탈로그 시험이 잡았다).
2. **d-aria** — 낭독 한 줄이 「정합 — 맞았습니다. 잉크 3겹」에서 「맞았습니다. 숙련도 3단계」가
   됐다. 병기가 빠지면서 60자 예산이 는다. 수치 절을 만드는 `gainText` 가 **카탈로그 밖**
   (`session-flow.ts`)에 하드코딩돼 있어 거기도 고쳤다 — 세 줄이다.
3. **d-tests** — 기대 문자열만 새 문구로 옮겼다. 시험의 뜻은 한 건도 안 바꿨다.
   `apps/desktop/src/**/*.test.tsx` 33개 · `packages/cards/src/t2-key.test.ts` ·
   `packages/grading/src/__golden__/t0/*.json` 6개 · `tests/{e2e-ui,gates,support}/**` 9개.
4. **d-docs** — `docs/00-overview.md` §3 용어집(첫 열이 「은유」에서 「화면 문구(평문)」로) +
   §4.2.1 D178 행. `docs/05-frontend.md` §2.1·§2.3·§3·§4.3·§5·§7·§9·§10·§11.
5. **C5 뒤처리** — 05 §4.3(부속 기본값이 플랫폼별이라 했으나 이제 전 플랫폼 꺼짐) · §6(마스코트
   동작 클래스 다섯과 `useDeeMotion` 이 코드에서 삭제됨) · §10(상시 애니메이션 표)을 현재 코드에
   맞췄고, `tests/gates/design.spec.ts` 의 `MOTION_EXEMPT` 에서 죽은 `.dee.lifer`·`.dee.peek` 를 뺐다.
6. **C3 뒤처리** — 「네 코드엔 없다」 넷(`t0.absentFramework|Library|Scale|Idiom`)의 값을 ko·en 에
   채웠다. 사과문이 아니라 안내문으로 썼다 — 왜 없는지와 **어디서 다시 만나는지**를 말한다.

CSS 클래스 · 컴포넌트 파일명 · DB 열 이름은 그대로 뒀다. 이력이고, 코드가 참조하며, 바꾸면
병렬 세션과 전면 충돌한다.

## 검증

`pnpm lint` 초록 · `pnpm typecheck` 13/13 Done · `pnpm test:unit` 2,304 통과(실패 0) ·
`pnpm test:gates` 114 통과(chromium+webkit) · `pnpm test:e2e-ui` 26 통과 · `pnpm check:contrast`
48쌍 통과 · `pnpm vitest run packages/i18n` 11 통과.

잔량 실측(값만, 주석·키 제외): ko 은유 낱말 **0건** — 남은 「판」 12건은 전부 `판정`(평문)이고
「정합」 3건은 `정하다` 활용이다. en **0건** — 남은 `layer` 는 아키텍처 층, `register` 는 등록,
`{{printed}}`·`{{plates}}` 는 템플릿 변수 이름이다.

## 메모

고치지 못한 것 둘, 다른 세션 소관이다.
- `apps/desktop/src/App.tsx` 에 한국어 토스트가 하드코딩돼 있다(96·251·281~295행 — 「오늘의 인쇄」
  「오늘은 인쇄할 판이 없습니다」「판을 걸지 못했습니다」 등). 카탈로그 밖이라 D117 위반이고
  D178 도 안 걸린다. `.tsx` 본문은 C5·C6 범위라 손대지 않았다.
- `scripts/check-motion.mjs` 의 `EXCEPTIONS` 두 줄(lifer 1,360ms · peek 1,600ms)이 D179 로 사라진
  클래스를 가리킨다. 게이트는 초록이지만 남겨 두면 다음 사람이 그 애니메이션이 있는 줄 안다.
- `packages/cards/src/t0-synthetic.ts` 의 주석 「지금은 그 키 넷이 아직 없어서 `t()` 로 부르지
  않는다」가 이제 낡았다 — 키 넷을 채웠다.