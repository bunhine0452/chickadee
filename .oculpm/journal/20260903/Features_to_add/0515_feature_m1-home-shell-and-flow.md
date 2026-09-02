---
schema_version: 1
type: feature
slug: "m1-home-shell-and-flow"
status: done
difficulty: high
created_at: "2026-09-03T05:15:22+09:00"
session_id: "20260903-002"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/components/home/"
    op: create
  - path: "apps/desktop/src/screens/home/HomeScreen.tsx"
    op: create
  - path: "apps/desktop/src/screens/home/data.ts"
    op: create
  - path: "apps/desktop/src/screens/home/empty.tsx"
    op: create
  - path: "apps/desktop/src/components/shell/TimeQueue.tsx"
    op: create
  - path: "apps/desktop/src/screens/ingest/IngestScreen.tsx"
    op: create
  - path: "apps/desktop/src/screens/ingest/phases.ts"
    op: create
  - path: "apps/desktop/src/store.ts"
    op: create
  - path: "apps/desktop/src/flow.ts"
    op: create
  - path: "apps/desktop/src/App.tsx"
    op: update
  - path: "apps/desktop/src/devtools/audit.ts"
    op: create
  - path: "apps/desktop/src/flow.test.tsx"
    op: create
  - path: "packages/store-sql/statements/home.sql"
    op: create
related: []
tags:
  - "m1"
  - "frontend"
  - "home"
  - "ingest"
  - "zustand"
  - "mcp-tool"
---
[x] M1 · 홈 화면·시간 비례 큐·판 짜기 화면 배선 — 등록부터 홈까지 한 흐름

## 추가 기능

- **홈 컴포넌트 14종**(하위 세션) — `Masthead`·`InkScale`·`GapsPanel`·`ConceptList`·`Sheet`·`Node`·`NodeDetail`·`InkRail`·`ColorBar`·`Forecast`·`Guide`·`Board`·`Panel`·`Legend` + `HomeScreen` + `FirstRun`. 목업 `design/ink-home.html` 의 마크업·클래스명 그대로.
- **`TimeQueue`** — 시간 비례 진행바. 홈과 판 짜기 화면이 같은 것을 쓴다. 칸 너비는 예상 시간(`--w`)이고, 접근 이름이 「5칸 중 3번째 「파싱」, 전체의 40%」 한 문장으로 상태 전부를 말한다.
- **`IngestScreen`** — Rust 의 `walk·parse·git·write` 와 TS 의 `derive`·`cards` 를 네 칸으로 접는다(D47). 스피너 없음, 리포에 쓰지 않는다는 것을 먼저 말하고, 건너뛴 파일은 사유를 사람 말로 낸다.
- **`store.ts`(zustand) · `flow.ts`** — 라우터 없이 상태가 화면을 고른다(05 §2.2). `flow.ts` 가 IPC 를 아는 유일한 앱 코드다: 등록 → 인제스트 → 파생 → 미지 개수 → 홈, 그리고 **화면이 이미 쓸 만해진 뒤** 배경에서 blame.
- **`devtools/audit.ts`** — `performance.mark` 6종·예산표·목업 `__audit.perf` 이식·Web Inspector 절차. `?dev=1` 에서만 붙는다.
- **`packages/store-sql/statements/home.sql`** — 02 §7.1 의 쿼리를 이름 붙여 노출.

## 밟은 지뢰

1. **`vitest.config.ts` 의 `include` 에 `apps/**` 가 없었다.** 하위 세션이 홈 테스트 17파일을 쓰는 동안 `pnpm test:unit` 은 **조용히 그것들을 건너뛰고** 초록이었다. 넣고 나니 430건이 됐다.
2. **`packages/ui` 테스트는 `// @vitest-environment jsdom` 이 필요하다.** 루트가 `node` 라서 DOMPurify 가 `sanitize is not a function` 으로 죽는다.
3. **`import.meta.glob` 의 전역 선언이 앱에서 중복이 된다** — 앱에는 `vite/client` 타입이 이미 있다. 별도 `.d.ts` 로 빼면 이 패키지를 **원본으로** 컴파일하는 `concepts` 에 안 들어간다. 국소 캐스트가 유일한 답이었다(타입을 지우고 나면 `import.meta.glob(...)` 그대로라 Vite 변환은 그대로 걸린다).
4. **판 짜기 화면이 막다른 골목이었다.** 끝나면 취소 버튼이 사라지는데 그 자리에 아무것도 없어서, 성공한 뒤 나갈 문이 없었다. 성공하면 홈으로 넘어가고 실패하면 이유와 함께 「홈으로」를 준다.
5. **`store` 를 `Arc` 뒤로 옮기지 않았으면** 인제스트 내내 화면의 `store_query` 가 막혔을 것이다(앞 일지).

## 고친 성능 버그 하나

**순회가 모든 파일의 바이트를 파싱 때까지 들고 있었다.** 피크 메모리가 `파일 수 × 크기` 라, 상한(파일 50,000 · 파일당 512 KiB)에서는 기가바이트가 된다 — 03 §7 예산은 300 MB 다. 큰 모노리포에서는 파싱을 시작하기도 전에 메모리가 났을 것이다. 이제 후보는 **경로와 크기**만 들고, 워커가 파싱할 때 다시 읽고 곧바로 버린다. 피크는 `레인 수 × 파일 크기` ≈ 2 MB 다.

## 실측

- 앱 JS **214 KB gzip**(05 §1.3 예산 350) · CSS **8 KB gzip**(예산 60)
- 대비 46쌍 통과 (가장 빠듯한 것 `--pink-text on --paper-3` 7.04:1)
- 실리포 인제스트(TS 240파일, 골든 픽스처 포함) — 캡처 96,966 · **4.1 s**

## 못 한 것

**WKWebView 실측을 못 했다.** 계측은 다 넣었지만 그 수치는 macOS 앱 안에서만 뜻이 있고 이 세션엔 GUI 가 없다. 플랜 항목 `m1-05-wkwebview-perf` 를 `blocked` 로 두고 절차를 `audit.ts` 의 `HOW` 에 적었다.

홈의 「오늘의 인쇄」 패널(`TodayPanel`·`StampCard`·「인쇄 시작」)은 비어 있다 — 큐 플래너가 M2 라서다.

## 검증

- `apps/desktop/src/flow.test.tsx` 7건 — **Rust 만 모의하고 나머지는 진짜다**(카탈로그 SQL·사전·파생 층·홈 쿼리·화면). 리포 하나를 등록하면 사용처 3건이 대지 한 장과 스티커 하나가 되고, 「판이 없는 문법」이 3번 등장을 말하고, 네 단계가 모두 지나간다.
- `pnpm test:unit` 448건 · `pnpm lint` · `pnpm typecheck` · `pnpm build` · `node scripts/check-contrast.mjs` 통과.
- `cargo test --workspace` 81건 통과.