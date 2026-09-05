---
schema_version: 1
type: bug
slug: "cut-ring-two-px-lower"
status: done
difficulty: low
created_at: "2026-09-04T13:47:01+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/components/home/Node.css"
    op: update
related:
  - ref: "20260904/Bugs/1338_bug_here-ring-offset-and-icon-inset.md"
    kind: "followup"
tags:
  - "ui"
  - "css"
  - "harness"
  - "mcp-tool"
---
[x] 점선 링을 2px 내려 앉혔다 — 그리고 게이트가 옛 dist 를 재고 있었다

앞선 수정 뒤 사용자 확인 — 「아직도 살짝 안맞아, 아주 살짝 아래로」.

## 발생 원인

기하로는 맞았다(링 중심 = 원 중심). 눈이 안 맞다고 읽은 이유는 스티커가 `box-shadow: 0 5px 0` 하드 그림자를 달고 있어서다 — 종이 원의 **시각적 무게중심이 기하 중심보다 아래**에 있고, 링을 기하 중심에 맞추면 살짝 떠 보인다.

여기서 하나가 더 드러났다. **게이트는 `vite preview`, 즉 `dist/` 를 잰다.** 그래서 앞 사이클에서 「고친 뒤 96px 이더라」고 적은 측정은 13:17 에 구워진 옛 번들을 잰 것이었다 — 고치기 전 CSS 였다. 결론(엔진 둘은 `auto` 여도 늘려 준다)은 그대로지만, **고친 코드를 잰 것이 아니었다.** 이번에는 `pnpm build` 로 다시 굽고 쟀다.

## 해결 방법

- `inset: -7px` 를 `top: -5px` · `left: -7px` 로 풀었다. 폭·높이는 그대로 글자로 적혀 있으므로 상자는 96px 이고, 위 5 · 아래 9 가 되어 **2px 내려앉는다**.
- 측정(빌드 뒤, 두 엔진): `face 72×72` · `cut 96×96` · `cx` 동일 · `cut.cy − face.cy = 2`. 찍혀 내려앉는 동작(`stampdown`) 중에는 전체가 1.12 배라 2.3 으로 읽힌다 — 잴 때 애니메이션을 끄고 정확히 2 를 확인했다.

## 검증

두 엔진에서 위 숫자 그대로. `pnpm lint` 초록 · `Node.test.tsx` 4개 통과. 사용자 창은 Vite 개발 서버라 HMR 로 이미 들어가 있다.

## 메모

게이트로 CSS 를 확인할 때는 `pnpm build` 를 먼저 돌린다. 다음에 같은 함정을 밟지 않으려면 그 한 줄이 필요하다 — `test:gates` 는 시드만 굽고 번들은 굽지 않는다.