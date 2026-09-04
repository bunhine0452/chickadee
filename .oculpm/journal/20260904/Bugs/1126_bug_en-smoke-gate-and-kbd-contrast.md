---
schema_version: 1
type: bug
slug: "en-smoke-gate-and-kbd-contrast"
status: done
difficulty: medium
created_at: "2026-09-04T11:26:36+09:00"
session_id: "20260904-005"
agent:
  id: "claude-code"
language: "ko"
verified_by_user: false
files_touched: []
related: []
tags:
  - "i18n"
  - "gates"
  - "a11y"
  - "contrast"
  - "mcp-tool"
---
[x] en 스모크 게이트 — 요약 화면의 kbd 대비 3.79:1 을 잡았다

## 발생 원인

`i18n-en-smoke` 를 구현하면서 첫 실행·홈·교정지·요약을 en 으로 걸었더니 요약에서 axe serious 가 하나 떴다 — `.acts > .press-btn > kbd` 가 **3.79:1** (전경 `#4e202c` / 배경 `#ff2e7e`, 기준 4.5:1).

로케일 탓이 아니었다. `design/src/ink/shared.css` 의 `kbd.k` 가 `opacity: .8` 을 걸고 있고, 이 버튼의 면은 채도 높은 `--t1` 이라 `--on-t1`(원래 4.73:1)이 합성되면서 3.79 로 내려간다. **ko 에서도 있던 버그다.**

두 겹으로 숨어 있었다:

1. **`check-contrast.mjs` 는 토큰 쌍을 재지 합성된 픽셀을 재지 않는다.** `--on-t1` on `--t1` 를 4.73:1 로 보고 통과시킨다. `--desk` 가 배경 집합에 없는 것, `--ink-mute` 를 「검사 대상 아님」으로 건너뛰는 것과 **같은 종류의 구멍**이다.
2. **`keyboard.spec.ts` 의 `AXE_SCREENS` 에 요약이 없다.** 홈·T0 교정지·야간반·서가 넷뿐이라 요약 화면은 axe 를 한 번도 받은 적이 없다.

## 해결 방법

`packages/ui/src/PressButton.css` 에서 이 자리의 `opacity` 만 1 로 되돌렸다. 캡의 크기·테두리·서체는 목업 그대로고 토큰도 안 건드렸다(`design:check` 바이트 일치 유지).

en 스모크는 `tests/gates/en-smoke.spec.ts` 로 넣었다. 재는 것은 둘뿐이다 — axe serious 이상 0, 행 길이 en 축(45~68자). **시각 기준선 40장은 ko 로만 유지한다**: 로케일이 바꾸는 것은 글자 길이지 판의 배치가 아니라, 로케일마다 기준선을 뜨면 문구 한 줄에 80장을 다시 찍는 잡일이 된다.

화면마다 **잰 건수가 0이 아닌 것**을 함께 단언한다. `hasBody()` 가 로케일별로 판정하므로 화면이 실수로 ko 로 뜨면 en 본문이 한 건도 안 잡히고 위반도 0건이라 게이트가 소리 없이 통과한다 — 이 리포가 한 번 밟은 함정이다.

## 곁다리로 고친 것

- `tests/support/gates.ts` 의 `startSession` 이 「인쇄 시작」만 찾아서 en 실행이 홈에서 30초를 기다리다 죽었다. `toSummary` 의 완료 판정도 `aria-label="인쇄 완료"` 하나였다. 둘 다 로케일 둘을 받는다.
- 시드는 `locale: ko` 를 못박는다(풀면 게이트가 러너를 탄다). 이 스펙만 **자기 워커의 시드 사본**에서 그 칸을 뒤집는다 — `makeAppDb()` 가 바이트로 열어 워커끼리 안 보인다.
- 첫 실행을 그리려면 리포가 0개여야 하는데 `DELETE FROM repo` 가 FK 로 막힌다. 지우는 순서를 손으로 적으면 스키마가 자랄 때마다 틀리므로 그 사본에서만 `foreign_keys` 를 잠깐 끈다.

## 검증

```
pnpm lint            clean
pnpm typecheck       12/12 Done
pnpm test:unit       168 files · 1754 tests passed
pnpm test:gates      114 passed   (108 + en 스모크 3 × 2 엔진)
pnpm test:e2e-ui     24 passed
pnpm check:contrast  48쌍 통과
pnpm check:motion    위반 0건
pnpm design:check    3개 생성물 바이트 일치
check-rust-budget    2300/2300 · Rust 0줄
pnpm dict:lint       11 passed
allowlist 만료 게이트  14 passed
```

첫 `test:gates` 한 번이 빨갛게 나왔다가 이어진 실행들이 114/114 였다 — 부하 아래 흔들리는 것으로, 병렬 회차에서도 같은 모양(31건 실패 뒤 세 번 연속 통과)을 봤다.