---
schema_version: 1
type: feature
slug: "design-system-primitives-d182"
status: done
difficulty: high
created_at: "2026-09-05T15:31:33+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "design/system/README.md"
    op: create
  - path: "scripts/sync-design.mjs"
    op: update
  - path: "scripts/check-contrast.mjs"
    op: update
  - path: "scripts/check-motion.mjs"
    op: update
  - path: "scripts/check-motion.test.mjs"
    op: update
  - path: "scripts/third-party.mjs"
    op: update
  - path: "scripts/third-party.test.mjs"
    op: update
  - path: "THIRD_PARTY_NOTICES.md"
    op: update
  - path: "apps/desktop/src/styles/fonts.css"
    op: update
  - path: "apps/desktop/src/styles/reset.css"
    op: update
  - path: "apps/desktop/src/styles/app.css"
    op: update
  - path: "apps/desktop/src/styles/physics.css"
    op: update
  - path: "apps/desktop/index.html"
    op: update
  - path: "apps/desktop/src/assets/fonts/BlackHanSans-Regular.woff2"
    op: delete
  - path: "apps/desktop/src/assets/fonts/OFL-BlackHanSans.txt"
    op: delete
  - path: "apps/desktop/src/assets/fonts/README.md"
    op: update
  - path: "packages/ui/src/Button.tsx"
    op: create
  - path: "packages/ui/src/Card.tsx"
    op: create
  - path: "packages/ui/src/Field.tsx"
    op: create
  - path: "packages/ui/src/Tag.tsx"
    op: create
  - path: "packages/ui/src/Progress.tsx"
    op: create
  - path: "packages/ui/src/Callout.tsx"
    op: create
  - path: "packages/ui/src/primitives.test.tsx"
    op: create
  - path: "packages/ui/src/index.ts"
    op: update
  - path: "packages/ui/src/dev/Gallery.tsx"
    op: update
  - path: "packages/ui/src/Stamp.css"
    op: update
  - path: "packages/ui/src/PressButton.css"
    op: update
  - path: "packages/ui/src/FlatButton.css"
    op: update
related: []
tags:
  - "design-system"
  - "typography"
  - "contrast"
  - "d182"
  - "mcp-tool"
---
[x] 디자인 시스템 뿌리 재구축 — 토큰 출처 이전 · 활자 재검토 · 프리미티브 여섯 (D182)

## 추가 기능

정본 §6(2026-09-05 전면 교체)이 정한 원칙을 값으로 옮겼다. 리소그래프 시각 시스템을 걷고
「학습에 최적화된 화면」의 토큰·활자·프리미티브를 새로 만들었다.

**토큰 단일 출처 이전** — `design/src/ink/` 아래에서 **`design/system/`** 으로 옮겼다.
`scripts/sync-design.mjs` 가 새 출처를 읽고, 야간 body 그라디언트 블록을 함께 지웠다.
옛 이름 78개는 새 토큰을 가리키는 별칭 한 판으로 남겼다(리소 고유값 질감·발광·어긋남·
기울기는 별칭이 아니라 0·none·normal 로 **무효화**). 실측: 옛 이름을 아직 쓰는 곳은
**23개 토큰 · 57회 · 파일 5개**(`components/run/RunPanel.css` · `shell/TimeQueue.css` ·
`t2/DependencyMap.{css,tsx}` · `t2/FlowDeck.css` · `t1/monacoTheme.ts`)뿐이다.

**활자 — IBM Plex Sans KR 유지, Black Han Sans 삭제.** `fontTools` 로 직접 쟀다.
Plex Sans KR 은 현대 한글 음절 **11,172/11,172** 전부를 덮고, 짝인 Plex Mono 와
upem·x높이(516)·대문자높이(698)가 **같다** — 산문과 코드가 나란히 서는 화면에서 기준선이
안 흔들린다. Pretendard(OFL·9굵기·같은 11,172자)는 정적 3굵기가 약 3.3 MB 로 지금 번들의
두 배이고 짝 모노가 없어 채택하지 않았다. Black Han Sans 는 굵기 400 하나뿐이라 합성
굵게 사고(D183)를 냈고 한글도 **2,581/11,172**(23%)만 덮었다. 번들 9파일 1.99 MB →
8파일 **1.80 MB**.

**색 — 중립 표면 + 액센트 하나 + 상태 넷 + 코드 여섯.** 밝게/어둡게 두 벌.
`scripts/check-contrast.mjs` 를 다시 써서 층 넷(본문 7:1 · 보조 4.5 · 뜻을 나르는 색 7 ·
UI 경계 3)으로 **142쌍**을 잰다. 옛 게이트는 46쌍이었고 `--ink-mute`/`--ink-faint` 는
「텍스트 금지」라고 적어 두고 수치를 아예 안 쟀다.

**모션 상한 720ms → 200ms, 예외 0.** 시간 토큰 값 자체도 재게 했다 — D182 이후 CSS 가
`var()` 로 시간을 쓰므로 정적 스캔만으로는 토큰 하나로 상한을 통째로 우회할 수 있다.

**프리미티브** — 새로 `Button`(변형 넷) · `Card` · `Field` · `Tag` · `Progress` · `Callout`.
`FlatButton`·`PressButton`·`Pill`·`Passes`·`Kbd`·`Switch`·`Toast` 를 새 시스템으로 다시 그렸고,
`Stamp`·`Reg`·`Misreg`·`Say`·`dee/**` 는 `@deprecated` 로 표시하고 장식을 뺐다(호출처가
있어 지우지 않았다 — 옮기는 것은 화면 세션의 몫).

**문서** — `design/system/README.md`. 근거(인지 부하 · 일관성 23/23 d=0.86 · 매력적 곁가지
g=−0.16 · 신호 주기 g+=0.53/0.33) → 화면 결정 표, 활자 눈금, 색 역할·값·대비, 간격,
컴포넌트 목록, 금지 목록, 「아직 모르는 것」.

## 동작 흐름

`design/system/` 의 출처 → `pnpm design:sync` → 앱 생성물 → `reset.css`·`app.css`·프리미티브
CSS 가 토큰만 참조 → `design:check` 가 드리프트를 막고 `check:contrast`·`check:motion` 이
값을 잰다.

## 검증

- `pnpm typecheck` 13개 프로젝트 전부 통과 · `pnpm exec eslint packages/ui scripts` 0건 ·
  `stylelint` 내 파일 0건
- `pnpm design:check` 통과(생성물 3개 바이트 일치) · `pnpm check:contrast` **142쌍 통과**
  (가장 빠듯 7.15:1) · `pnpm licenses:check` 통과
- `pnpm vitest run packages/ui` 21파일 107테스트 통과(새 `primitives.test.tsx` 12건 포함)
- Playwright 로 밝게/어둡게 전판을 찍어 눈으로 확인, 폭 720·1440·2560 에서 가로 넘침 **0px**
- 남은 실패 2건은 범위 밖: `check-motion` 이 `components/t2/DependencyMap.css` 의 500ms 를
  잡고(G4 몫), `tests/support/source-bytes` 가 `tests/gates/glyph.spec.ts` 의 NUL 바이트를 잡는다

## 메모

`--syn-fn`(#17418F)과 `--accent`(#0E47A6)가 둘 다 파랑이다. 하나는 코드 판 안, 하나는
크로뮴이라 붙어 나올 일이 없다고 보았으나 붙여 놓고 확인하지는 않았다.