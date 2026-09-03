---
schema_version: 1
type: feature
slug: "m2-session-screen-and-plates"
status: done
difficulty: high
created_at: "2026-09-03T10:40:45+09:00"
session_id: "20260903-003"
agent:
  id: "claude-code"
  version: "Opus 5"
language: "ko"
verified_by_user: false
files_touched: []
related: []
tags:
  - "m2"
  - "ui"
  - "session"
  - "a11y"
  - "keyboard"
  - "mcp-tool"
---
[x] M2 · 교정쇄 화면 — 인쇄 시작부터 요약까지 한 흐름이 돈다

## 추가 기능

**컴포넌트 59개**(하위 세션) — `components/plate/` 11종(`ProofSheet`·`CodePlate`·`PickToken`·`Hole`·`Choices`·`FeedbackSlot`·`Ask`·`Crumb`·`LinkPara`·`Acts`·`hl`)과 `components/session/` 9종(`JobBand`·`ReprintLadder`+4단·`LiferVeil`·`Summary`·`SessionOverlay`). 목업 클래스명 그대로, 자체 테스트 156건.

**화면 배선** — `screens/session/`(`SessionScreen`·`T0Plate`·`useSessionClock`) · `session-flow.ts`(화면이 부르는 동사) · `data/ladder.ts`(사다리 화면 모형) · `components/home/TodayPanel`(홈의 「오늘의 인쇄」·「인쇄 시작」).

**설계 게이트** — 목업 `window.__audit` 의 `fonts`·`contrast`·`measure` 를 `devtools/gates.ts` 로 옮겼고(앱과 테스트가 같은 코드), `scripts/check-motion.mjs` 가 720ms 상한을 정적으로 본다(예외 둘: LIFER 1.36s · peek 1.6s, 둘 다 문서가 올린 것).

## 지뢰 (겪어야 아는 것)

- **판을 걸면 포커스가 `article.ps` 에 있어 `1~4` 가 `Choices`·`CodePlate` 의 자체 핸들러까지 안 내려간다.** 이벤트는 위로만 버블한다. 05 §7 이 그 키를 「T0 미답」 문맥에 준 것이므로 문맥의 주인(`T0Plate`)이 document 에서 받는다. 사다리가 열려 포커스가 그 안이면 `ReprintLadder` 가 버블에서 멈춘다(D11).
- **채점하면 고른 보기가 `disabled` 가 되고 그 위의 포커스는 죽는다.** 브라우저는 `body` 로 떨어뜨리는데 그러면 06 §2 의 「매 단계 `activeElement !== body`」가 깨진다. 채점 뒤 다음 동작 버튼으로 옮긴다.
- **`savePlate` 가 마친 판을 `active` 로 되돌리고 있었다.** Esc 로 나갈 때 5초 tick 과 나가기 저장이 둘 다 이 함수를 부르는데, 그러면 이어 찍기가 방금 푼 판을 또 건다. 화면 테스트가 잡았다.
- **`session-flow` 가 모듈 전역 `ctx` 를 들고 있으면 화면 테스트가 `startSession` 없이는 아무것도 못 한다.** 겹 캐시는 `loadMastery` 와 중복이라 지웠고, 남은 문맥(`maker`)은 **판을 만들 때만** 필요하다.
- **RTL 자동 정리가 안 걸린다.** 루트 vitest 설정이 `globals: false` 라 `cleanup()` 을 손으로 불러야 하고, 안 부르면 「같은 이름 요소가 둘」로 테스트가 깨진다.
- **첫 정답이면 LIFER 베일이 뜨고 그 뒤의 모든 키를 먹는다.** Space·Esc 가 안 먹는 것처럼 보이는데 사실은 베일이 먼저 닫히는 것이다 — 05 §2.3 그대로다.
- **`user.keyboard` 는 `disabled` 요소에 이벤트를 안 보낸다.** 포커스가 그런 요소에 남아 있으면 테스트에서만 키가 죽는다(브라우저는 포커스를 옮겨 준다).

## 화면 쪽이 문서와 어긋난다고 보고한 것

- `CardPayload`(t0)의 `prereq`·`uses` 로는 사다리 2·3단을 못 그린다 — 겹·상태·코드 원문이 없다. **스키마를 넓히지 않고** `data/ladder.ts` 가 `concept.prereqs`·`concept.uses` 로 조립한다. 2단이 보여 주는 것은 **지금의** 겹이라 카드에 굽는 것이 애초에 틀렸다.
- LIFER 베일 불투명도만 목업과 다르다(야간 .62 → .55). 다크 선택자가 금지된 파일이라 `--desk` 한 값으로 합쳤고, 야간 `--desk` 가 거의 검정이라 눈에 안 잡힌다.

## 검증

`pnpm vitest run` — 95 파일 852 테스트 통과. `eslint`·`stylelint`·`typecheck` 무출력. `check:contrast` 46쌍 통과(최저 7.04:1) · `check-motion` 위반 0 · `design:check` 통과 · Rust 예산 2043/2300(M2 가 더한 Rust 0줄). 번들 JS 256 KB gzip(예산 350) · CSS 11 KB gzip(예산 60).