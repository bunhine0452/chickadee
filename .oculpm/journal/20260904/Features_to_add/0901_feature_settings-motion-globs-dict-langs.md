---
schema_version: 1
type: feature
slug: "settings-motion-globs-dict-langs"
status: done
difficulty: medium
created_at: "2026-09-04T09:01:13+09:00"
session_id: "20260904-004"
agent:
  id: "claude-code"
  version: "Opus 5 (1M)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/data/settings.ts"
    op: update
  - path: "apps/desktop/src/data/session.ts"
    op: update
  - path: "apps/desktop/src/flow.ts"
    op: update
  - path: "apps/desktop/src/screens/settings/SettingsScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/settings/SettingsScreen.css"
    op: update
  - path: "apps/desktop/src/screens/settings/GlobPanel.tsx"
    op: create
  - path: "apps/desktop/src/screens/settings/GlobPanel.test.tsx"
    op: create
  - path: "apps/desktop/src/screens/settings/DictLangPanel.tsx"
    op: create
  - path: "apps/desktop/src/screens/settings/DictLangPanel.test.tsx"
    op: create
  - path: "packages/concepts/src/ingest-defaults.ts"
    op: update
  - path: "packages/concepts/src/ingest-defaults.test.ts"
    op: create
  - path: "packages/concepts/src/ingest.ts"
    op: update
  - path: "packages/concepts/src/index.ts"
    op: update
  - path: "packages/store-sql/statements/derive.sql"
    op: update
  - path: "packages/store-sql/src/catalog.ts"
    op: update
  - path: "packages/store-sql/src/types.ts"
    op: update
  - path: "packages/store-sql/src/schemas.ts"
    op: update
  - path: "packages/store-sql/src/rows.test.ts"
    op: update
  - path: "packages/i18n/src/ko.ts"
    op: update
  - path: "packages/i18n/src/en.ts"
    op: update
  - path: "tests/gates/motion.spec.ts"
    op: update
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/02-data-model-and-scheduling.md"
    op: update
  - path: "docs/05-frontend.md"
    op: update
related:
  - ref: "20260904/Bugs/0843_bug_identities-never-reached-classify-commits.md"
    kind: "followup"
tags:
  - "settings"
  - "motion"
  - "ingest"
  - "dictionary"
  - "d122"
  - "mcp-tool"
---
[x] 설정 P1 — 모션 감축 스위치 · 제외 글롭 편집 · 문법 사전 언어 필터

## 추가 기능

05 §2.1 대비 비어 있던 칸 셋을 채웠다. Rust 0줄.

### 모션 감축 — 속성을 세우는 자리가 없었다

CSS 는 **이미 다 되어 있었다.** `prefers-reduced-motion` 블록이 있는 11개 파일 전부에
`[data-motion="reduce"]` 쌍이 붙어 있었다. 빠진 것은 그 속성을 세우는 코드뿐이라
`data-motion` 은 리포 어디에도 없었고, 설정의 `motion` 키는 저장만 되고 아무 일도 안 했다.

`applyMotion()` 을 `applyTheme`·`applyTrim`·`applyLocale` 옆에 두고 `useAppearance` 가
부른다. `'system'` 도 속성으로 적는다 — 선택자는 `="reduce"` 만 보므로 효과가 없지만,
「시스템 따름」과 「아직 안 정했다」를 DOM 밖에서 구별할 길이 그것뿐이다.

### 제외 글롭 — 덮지 않고 덧붙인다

03 §1.2 가 이미 「리포별 **추가** 제외 목록」이라고 적어 두었고 코드가 그것을 안 읽고
있었다. `EXCLUDE_GLOBS` 뒤에 사용자 목록을 잇는다 — 비어 있는 설정이 「아무것도 제외 안
함」이 되면 `node_modules` 가 딸려 온다.

`globProblem()` 은 `ignore` 크레이트의 파서를 다시 구현하지 않는다. 막는 것은 **조용히
반대로 도는 넷**이다: `!` 부정(제외 목록에서 오히려 포함시킨다) · 역슬래시(글롭이 아니라
Windows 경로 구분자) · 절대 경로 · 짝 안 맞는 괄호(파서를 던지게 해 인제스트를 세운다).
문제 있는 줄은 **막지 않고 말하되** 저장에서 뺀다 — 통과를 조건으로 걸면 정당한 글롭이
걸릴 때 빠져나갈 길이 없다.

저장은 포커스를 뗄 때 한 번이다. 「저장 버튼 없음」 규약을 여러 줄 상자에 그대로 걸면
타자마다 원장에 쓰게 된다.

### 문법 사전 언어 — 새 판에서만 뺀다

`Settings.dictLangs` 를 더했다. **빈 목록 = 전부 켜짐**이고, 그래서 마지막 하나는 끄지
못한다(값이 「전부 켜짐」과 같아진다).

끈 언어는 `queue.new_candidates` 결과에서 걸러 **새 판에서만** 빠진다. 복습은 그대로
돈다 — 원장에 쌓인 겹은 언어 설정과 무관하고, 복습까지 멈추면 다시 켰을 때 만기가 한꺼번에
밀려 하루 예산(D12)이 무너진다.

목록의 출처는 번들 사전이 아니라 원장이다(새 statement `derive.dict_langs`). 체크박스는
**실제로 카드를 만들 수 있는 것**만 보여야 거짓말을 하지 않는다.

## 밟은 것

- **게이트가 `app` 픽스처를 안 받으면 DB 가 안 깔린다.** 새로 쓴 모션 테스트가
  `async ({ page })` 였는데 `gotoDev` 가 30초 타임아웃으로 죽었다. 시드는 그 픽스처가
  깐다 — 쓰지 않아도 `app: _app` 으로 받아야 한다.
- **D117 이 02 §8.2 를 빠뜨렸다.** `Settings` 인터페이스가 문서에 `locale` 없이 남아
  있었다. `dictLangs` 와 같이 채우고 §2.2 의 키 주석도 고쳤다(D122 ④).
- 홈의 재인제스트 배너는 **버튼 없는 안내**다. 글롭도 같은 모양으로 맞췄다 — 지문
  (`ingest_run.fingerprint`)에 글롭을 넣지 않았다. 그것은 06 §6.3 이 정한 **빌드** 축이고
  사용자 설정은 다른 축이다.

## 검증

- `pnpm test:unit` — **1622 passed (156 files)**, 실패 0 (이번에 +20)
- `pnpm test:gates` — **90 passed · 8 skipped** (모션 게이트 2건 × 2엔진 추가).
  새 게이트 둘: `data-motion="reduce"` 가 미디어 쿼리와 같은 결과를 내는지, 그리고
  `data-motion="system"` 이 **아무것도 줄이지 않는지**. 뒤엣것이 없으면 앞엣것은
  「속성이 무엇이든 늘 감축」을 통과로 읽는다.
- `pnpm test:e2e-ui` — 20 passed · 12 skipped
- `pnpm lint` 통과 · `typecheck` 오류 0 · `check:rust` **2300/2300**(Rust 0줄) ·
  `check:contrast` 48쌍 · `check:motion` 0건 · `design:check` 바이트 일치 ·
  `catalog:build` **statement 148개**(`derive.dict_langs` 하나 늘었다)