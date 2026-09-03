---
schema_version: 1
type: bug
slug: "four-known-defects-fixed"
status: done
difficulty: high
created_at: "2026-09-04T07:21:30+09:00"
session_id: "20260904-003"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/data/ladder.ts"
    op: update
  - path: "apps/desktop/src/screens/session/SessionScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/session/T0Plate.tsx"
    op: update
  - path: "packages/concepts/src/ingest.ts"
    op: update
  - path: "apps/desktop/src/flow.ts"
    op: update
  - path: "apps/desktop/src/components/session/SessionOverlay.tsx"
    op: update
  - path: "apps/desktop/src/components/plate/FeedbackSlot.tsx"
    op: update
  - path: "packages/ui/src/dee/Dee.tsx"
    op: update
  - path: "packages/ui/src/dee/deeStandalone.ts"
    op: create
  - path: "packages/ui/src/dee/deeImage.ts"
    op: create
  - path: "packages/ui/src/dee/symbols.ts"
    op: create
  - path: "packages/ui/src/dee/deeImage.test.ts"
    op: create
  - path: "apps/desktop/src/devtools/gates.ts"
    op: update
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/05-frontend.md"
    op: update
  - path: "CHANGELOG.md"
    op: update
related: []
tags:
  - "m5"
  - "a11y"
  - "perf"
  - "dee"
  - "decision"
  - "D114"
  - "D115"
  - "D116"
  - "mcp-tool"
---
[x] [x] CHANGELOG 의 알려진 결함 네 개 — 사다리·인제스트·낭독·홈 프레임

M5 E2E 가 남긴 결함 여섯 중 넷을 고쳤다. 고치는 길에 다섯째가 나왔다.

## 발생 원인

**① 사다리가 「2겹 → 2겹 · 오늘 안에 → 오늘 안에」.** 원인이 둘이다. 겹 쌍이 답하기 전에는
`plate.layer` 를 양쪽에 그대로 써서 「모르겠어요」가 옮길 자리를 아예 못 보여 줬고, 호출부가
`dueAt: null` **리터럴**을 넘겨 「원래 예정」이 언제나 「오늘 안에」였다.

**② 인제스트가 파일 이름을 안 말한다.** 화면(`IngestScreen`)도 스토어도 `currentPath` 를
갖고 있는데 `runIngest` 가 Rust 이벤트의 `currentRelPath` 를 **한 층 위에서 버리고** 있었다.

**③ 세션에 낭독 지점이 없다.** 판정을 읽던 것은 판정란 자신의 `aria-live` 였고, 그것은 도장·
규칙·코드판까지 통째로 읽는다 — 05 §7 은 「한 곳, 60자, `[상태]. [수치]. [다음 행동]`」이다.
게다가 앱의 유일한 `.vh#live` 는 홈에 있고 `.proof` 가 `aria-modal` 이라 세션 중에는 가려진다.

**④ 홈 19ms.** 개념 줄마다 스티커 하나 = `<use>` 391개. `<use>` 는 인스턴스마다 6 경로(수천
점)를 캐시 없이 다시 래스터한다. 05 §10 의 상한이 40인데 열 배였고, D105 의 윈도잉은 그 수를
못 줄였다.

**⑤ (④를 고치다 나온 것) `Dee` 가 목업의 `viewBox` 를 빠뜨렸다.** 목업 두 장의 `.dee` 는
**하나도 빠짐없이** `viewBox="0 0 100 100"` 을 단다. 없으면 `<use>` 가 심볼의 430 좌표계를 써
배지가 칸 밖으로 흘러 **잉크 겹 척도의 이름표를 덮는다**. 주간에는 크림 원판이 종이색과 가까워
덜 보였고 야간 스냅샷에서 드러났다.

## 해결 방법

- ① 겹 이동을 **감축기에게 물어본다** — `applyOutcome(mastery, 'dunno')`. 화면이 「한 겹」을
  따로 세면 R4(같은 날 두 번째는 더 안 내림)와 갈라진다. `dueAt` 은 그 개념의 숙련도에서 오고,
  예정이 없던 판은 그 절을 **아예 뺀다**(없는 이득을 있다고 적지 않는다).
- ② `onProgress` 에 `currentRelPath` 를 실었다. 파일 단위가 아닌 단계(`git`)는 그 자리를
  비운다 — 앞 단계 이름이 남으면 거짓말이다. 그 파일에 **날 NUL 바이트**가 박혀 있어
  `file(1)` 이 data 로 보고 grep 이 통째로 건너뛰고 있었다(찾는 데 시간을 썼다). 같은 문자열을
  이스케이프로 적었다.
- ③ **D114** — 오버레이 안에 `.vh#live` 를 두고 `announce()` 한 줄로 읽는다. 판정란의
  `aria-live` 는 뗀다. 05 §7 포커스 항목의 문장을 그에 맞춰 고쳤다.
- ④ **D115** — 움직이지 않는 스티커는 **그림 한 장**으로 굽는다(`deeImageUrl`, 판마다 한 장).
  굽는 함수 `deeStandalone` 은 `devtools/gates.ts` 에서 `packages/ui/src/dee/` 로 내렸다 —
  16px 실루엣 게이트가 재는 문자열과 화면에 뜨는 문자열이 같아야 한다.
- ⑤ **D116** — `viewBox="0 0 100 100"` 복원.

## 검증

- 하네스 실측(Playwright WebKit · 200프레임 · 매 프레임 컨테이너 무효화):
  스티커 1,600개 **p50 21 → 16 ms · p95 28 → 17 ms**(0개일 때가 16~17), 400개 p95 25 → 17.
- **픽셀 동일 확인** — 로컬에서 기준선 40장(10화면 × 주·야 × 엔진 2)을 ⑤만 적용한 빌드로
  굽고, ④까지 적용한 빌드로 `pnpm test:visual` → **40장 전부 통과**. (기준선 PNG 는 리눅스
  것만 두므로 확인 뒤 지웠다 — `tests/visual/README.md`.)
- `pnpm lint` · `typecheck` · `test:unit`(149파일 1,566건) · `test:gates`(86) ·
  `test:e2e-ui`(20) · `check:rust` · `check:motion` · `design:check` 전부 통과.
- CI 33812579577 확인 중.

## 남은 것

- 사다리 4단이 「막힌 지점」 입력을 안 담는 결함(프롬프트가 사다리를 열 때 한 번만 조립된다)은
  그대로 남겼다 — 사용자가 고르라고 한 넷에 없었다.
- 05 §10 표의 `frame_p95` 19 ms 는 **릴리스 빌드·이 리포에서 다시 재야** 최신이 된다. 지금
  적어 둔 수치는 브라우저 하네스의 것이다.