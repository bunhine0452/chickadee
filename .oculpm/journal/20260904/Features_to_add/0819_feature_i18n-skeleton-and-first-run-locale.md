---
schema_version: 1
type: feature
slug: "i18n-skeleton-and-first-run-locale"
status: done
difficulty: high
created_at: "2026-09-04T08:19:04+09:00"
session_id: "20260904-003"
agent:
  id: "claude-code"
  version: "Opus 5 (1M)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/i18n/src/index.ts"
    op: create
  - path: "packages/i18n/src/locale.ts"
    op: create
  - path: "packages/i18n/src/ko.ts"
    op: create
  - path: "packages/i18n/src/en.ts"
    op: create
  - path: "packages/i18n/src/t.ts"
    op: create
  - path: "packages/i18n/src/t.test.ts"
    op: create
  - path: "packages/i18n/src/catalog.test.ts"
    op: create
  - path: "packages/text/src/template.ts"
    op: update
  - path: "packages/text/src/template.test.ts"
    op: update
  - path: "packages/store-sql/src/types.ts"
    op: update
  - path: "packages/store-sql/src/schemas.ts"
    op: update
  - path: "packages/store-sql/src/rows.test.ts"
    op: update
  - path: "apps/desktop/src/data/settings.ts"
    op: update
  - path: "apps/desktop/src/boot.ts"
    op: update
  - path: "apps/desktop/src/store.ts"
    op: update
  - path: "apps/desktop/src/App.tsx"
    op: update
  - path: "apps/desktop/src/screens/home/empty.tsx"
    op: update
  - path: "apps/desktop/src/screens/home/empty.css"
    op: update
  - path: "apps/desktop/src/screens/home/empty.test.tsx"
    op: update
  - path: "apps/desktop/src/screens/settings/SettingsScreen.tsx"
    op: update
  - path: "apps/desktop/src/devtools/gates.ts"
    op: update
  - path: "apps/desktop/src/devtools/gates.test.ts"
    op: update
  - path: "apps/desktop/src/styles/reset.css"
    op: update
  - path: "tests/support/build-seed.ts"
    op: update
  - path: "tests/gates/design.spec.ts"
    op: update
  - path: "tests/gates/measure.allow.json"
    op: update
  - path: "tests/e2e-ui/shell.spec.ts"
    op: update
  - path: "tests/e2e/specs/e1-first-run.e2e.ts"
    op: update
  - path: "eslint.config.js"
    op: update
  - path: "apps/desktop/package.json"
    op: update
related:
  - ref: "20260904/Chores/0753_chore_d117-d118-locale-axis-registry.md"
    kind: "blocked_by"
tags:
  - "i18n"
  - "locale"
  - "first-run"
  - "settings"
  - "gates"
  - "mcp-tool"
---
[x] i18n P1 — packages/i18n 뼈대 · Settings.locale · 첫 실행 0단계 언어 선택 · 조판 로케일 축

## 추가 기능

D117 의 로케일 축을 코드로 세웠다. 첫 실행에서 고른 언어가 재실행에도 남고, 화면 문구가
`t()` 를 거치며, 행 길이 게이트가 로케일마다 다른 기준으로 돈다. Rust 는 0줄이다.

### `packages/i18n` (잎 패키지)

`t(key, vars)` 는 `@chickadee/text` 의 `render()` **위에** 올린 얇은 층이고 더하는 것은
셋뿐이다 — 카탈로그 고르기, `ko` 폴백, `en` 에서 조사 필터 끄기. 새 템플릿 엔진은 없다.

`ko.ts` 가 키 집합의 정본이고 `en.ts` 는 `Partial<Record<MessageKey, string>>` 이다.
언어 이름(`locale.ko`·`locale.en`)은 **일부러 en 카탈로그에서 비웠다** — 못 읽는 언어로
적힌 이름은 고를 수가 없으니 폴백으로 같은 자기 이름이 나오는 편이 맞다.

로케일은 모듈 상태다. 프로바이더로 200 파일을 꿰지 않는 이유는 설정에서의 전환이
`location.reload()` 이기 때문이다 — 한 번 세우면 프로세스가 사는 동안 바뀌지 않는다.
예외가 첫 실행 0단계인데, 거기는 `store.locale` 을 같이 올려 그 자리에서 다시 그린다.

### `render()` 에 옵션 둘 (`packages/text`)

- `josa: false` — 조사 필터가 아무것도 내지 않는다. `text` 는 로케일 이름을 모르고
  켜고 끄는 판단은 `i18n` 이 한다.
- `escape: false` — 치환값을 이스케이프하지 않는다. `t()` 결과는 React 자식으로 그대로
  들어가는 **평문**이라 `&` 가 `&amp;` 로 보이면 안 된다. 사전 문장(HTML 로 그려진다)은
  기본값 그대로 켜져 있다.

### 저장과 부팅

`Settings.locale('ko'|'en')` 을 타입·zod·`SETTINGS_KEYS`·`KEY_OF` 에 더했다. 기본값은
`navigator.language` 추정이고 첫 실행이 다시 묻는다. `applyLocale()` 이 `<html lang>` 과
`data-locale` 을 세우는 **유일한** 자리이며 `applyTheme`/`applyTrim` 옆에 산다.

`boot()` 이 창을 보이기 전에 언어를 세운다 — 창은 `visible:false` 로 떠 있으므로 사용자는
다른 언어의 한 프레임을 보지 않는다.

### 조판과 게이트

`html[data-locale="en"]` 에서 `word-break: normal` · `--measure: 30em`. 30em 인 이유는
라틴 평균 자폭 ≈0.5em 이라 ≈60자가 되고 05 §9 의 en 범위(45~68) 한가운데이기 때문이다.
토큰 파일은 `pnpm design:sync` 만 건드리므로 덮어쓰기는 `reset.css` 에 뒀다.

`gates.ts` 의 행 길이 상수를 `MEASURE = { ko: 30~45(note 22), en: 45~68(note 33) }` 로
바꿨다. 옛 값(35~45 · `.note` 22~24)은 06 §2 의 것이었고 **D112 가 이미 05 §9 로 정본을
옮겼는데 코드가 안 따라와 있었다** — 그래서 `measure.allow.json` 의 예외 넷 중 둘이
「두 문서가 어긋난다」를 사유로 달고 있었다. 그 둘을 지웠고 게이트는 초록이다.

## 밟은 것 둘 (다음 세션이 알아야 한다)

1. **게이트가 아무것도 안 재고 통과할 수 있었다.** `measure()` 의 본문 판정이
   「한글 15자 이상」이라 `en` 화면에서는 대상이 0건이 되고, 위반도 0건이라 초록이 뜬다.
   판정을 로케일별로 갈랐고(`hasBody`), `design.spec.ts` 에 **잰 것이 0건이면 실패**를
   더했다.
2. **하네스가 로케일을 타고 있었다.** 기본값이 `navigator.language` 추정이라 게이트·
   e2e-ui 가 러너의 로케일에 따라 다른 문구로 돌았다(실제로 `test:e2e-ui` 가 영어 화면을
   보고 2건 실패했다). `build-seed.ts` 가 `settings.locale = 'ko'` 를 심어 고정한다 —
   골든과 게이트가 러너를 타면 그것은 게이트가 아니다. `en` 은 06 §2 에 적은 별도
   스모크 3화면이 본다.

## 검증

- `pnpm lint` 통과 · `pnpm typecheck` 12개 프로젝트 전부 Done
- `pnpm test:unit` — **1585 passed (151 files)**, 실패 0
- `pnpm test:gates` — **86 passed · 8 skipped**, 실패 0. skip 8건은 tiny 시드에 커밋·
  블록·import 가 없어서 생긴 기존 구멍이다(m6 ①). 앞선 실행에서 webkit axe 1건이 병렬
  부하로 흔들렸으나 단독 재실행·전체 재실행 모두 통과했다.
- `pnpm test:e2e-ui` — **20 passed · 12 skipped**, 실패 0. 시나리오 14 에 「리포 0개에서
  언어를 바꾸면 `settings` 에 내려간다」를 더했다.
- `pnpm check:rust` 2300/2300 · 금칙어·SQL 리터럴 0 (Rust 0줄 추가)
- `pnpm check:contrast` 48쌍 · `pnpm check:motion` 위반 0 · `pnpm design:check` 3개 생성물
  바이트 일치 · `pnpm catalog:build` statement 147 (변화 없음)