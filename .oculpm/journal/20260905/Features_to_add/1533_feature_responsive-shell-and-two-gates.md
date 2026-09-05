---
schema_version: 1
type: feature
slug: "responsive-shell-and-two-gates"
status: done
difficulty: high
created_at: "2026-09-05T15:33:10+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "tests/gates/responsive.spec.ts"
    op: create
  - path: "tests/gates/responsive.allow.json"
    op: create
  - path: "tests/gates/glyph.spec.ts"
    op: create
  - path: "tests/gates/glyph.allow.json"
    op: create
  - path: "apps/desktop/src/styles/layout.css"
    op: create
  - path: "apps/desktop/src/components/shell/Page.tsx"
    op: create
  - path: "apps/desktop/src/components/shell/Page.test.tsx"
    op: create
  - path: "design/system/responsive.md"
    op: create
  - path: "apps/desktop/src/main.tsx"
    op: update
  - path: "apps/desktop/src-tauri/tauri.conf.json"
    op: update
  - path: "package.json"
    op: update
  - path: ".github/workflows/ci.yml"
    op: update
related: []
tags:
  - "D182"
  - "D183"
  - "responsive"
  - "gates"
  - "layout"
  - "mcp-tool"
---
[x] 반응형 뼈대와 게이트 둘 — 720~2560 폭에서 안 깨지는 것을 자로 잰다 (D182·D183)

## 추가 기능

정본 §6(D182)이 「폭 720~2560 · 높이 600 이상에서 가로 스크롤 · 잘림 · 겹침 · 글자 넘침 0」을
못박았다. 그것을 **재는 자**와 **어기기 어렵게 만드는 뼈대**를 함께 넣었다.

- `tests/gates/responsive.spec.ts` — 화면 일곱(홈 · 학습 문제·판정 · 요약 · 코스 · 서가 · 설정 ·
  첫 실행)을 폭 720·900·1280·1440·1920·2560 × 높이 600(양 끝 폭은 900도)에서 훑는다. 넷을 잰다:
  가로 스크롤 · 뷰포트 이탈 · 형제 겹침 · 글자 넘침. `checked` 하한(20)으로 「검사 0건」을
  통과로 세지 않는다.
- `tests/gates/glyph.spec.ts` — D183 이 요구한 글자 무결성. 합성 굵게(`font-synthesis-weight`)가
  꺼져 있나 · 실리지 않은 굵기를 부르는 자리가 없나 · 두부(.notdef)가 없나. 자기 자신을 시험하는
  시험이 붙어 있다(틀린 요소를 하나 심고 둘 다 잡히는지).
- `apps/desktop/src/styles/layout.css` — 브레이크포인트 셋(좁음 <900 · 보통 900~1400 · 넓음 >1400),
  `.l-page`·`.l-wrap`·`.l-split`·`.l-cols`·`.l-row`·`.l-stack` 과 `.u-measure`·`.u-scroll-x`·
  `.u-truncate`·`.u-minw0`. `--pad-x`·`--pad-y`·`--gap`·`--col-min`·`--l-side-w` 를 정의한다 —
  새로 쓰인 화면 CSS 가 이미 이 이름들을 쓰고 있었고 정의가 없었다.
- `apps/desktop/src/components/shell/Page.tsx` — `Page` · `Split`. 화면이 `<main>` 을 손으로 짜지
  않게 한다.
- 최소 창 **1000×680 → 720×600**. 1440 폭 모니터의 반쪽이 720 이라 최소가 1000 이면 반쪽 타일링
  자체가 OS 수준에서 불가능하다.
- `design/system/responsive.md` — 규칙 문서(브레이크포인트 근거 · 세 규칙 · 안 재는 것).

## 동작 흐름

한 화면을 **한 번 열고 창만 바꾼다**(`setViewportSize` → rAF 둘 → `settled` → 측정). 조합마다
새로 열면 7화면 × 8조합 = 56회 항해라 게이트가 분 단위가 된다. 지금은 두 엔진 34건이 **7~8초**다.

측정에서 걸러 낸 거짓 양성 셋을 기록해 둔다.
- 두부를 **폭으로 재면 등폭 서체에서 전부 두부다**(.notdef 상자도 같은 폭). 그려서 픽셀을 견준다.
- 인라인 요소의 `getBoundingClientRect()` 는 줄바꿈 조각의 합집합이라 `<b>` 와 `<span>` 이
  겹친 것으로 읽힌다. `display: inline` 은 겹침에서 뺀다.
- 말줄임은 `title`·`aria-label` 이 있으면 잘림이 아니다(전문을 되찾을 길이 있다).

「한쪽에만 쌓인 여백」(넓은 창에서 내용이 왼쪽에 붙는 것)은 재려다 **뺐다** — 요약 화면에서
좌 160/우 24px 을 거짓 양성으로 잡고, 정작 2560 폭 코스 화면은 머리말이 창 전체를 덮어 대칭으로
읽혔다. 대신 `.l-wrap` 의 `margin-inline: auto` 가 가운데 정렬을 기본으로 만든다.

## 검증

- `pnpm typecheck` 0 · 내 파일 `eslint`·`stylelint` 0.
- 새 게이트 두 엔진 **34건 전부 통과, 7.9초**(webkit 3회 반복도 안정).
- `pnpm test:unit` 2,252건 통과(`source-bytes.test.ts` 가 잡은 리터럴 NUL 한 자리를
  `\u0000` 이스케이프로 고쳤다).
- 변경 전 실측(HEAD 기준): 홈·학습·요약·서가·설정·첫 실행 위반 0, **코스만 8건** —
  720·900 폭에서 편집기 두 단이 `right 956`(창 밖 236px)이고 `document.scrollWidth` 956.
  화면 CSS 는 다른 세션 몫이라 `responsive.allow.json` 에 만료 2026-10-05 로 적었다.
- `pnpm test:gates` 전체는 지금 병렬 세션들이 화면을 갈아엎는 중이라 다른 스펙 35건이 빨갛다
  (홈 컴포넌트 삭제·실루엣 게이트의 마스코트 부재 등). 내 두 스펙은 그 안에서도 초록이다.