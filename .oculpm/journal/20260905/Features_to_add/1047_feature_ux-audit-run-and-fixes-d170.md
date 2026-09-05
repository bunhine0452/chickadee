---
schema_version: 1
type: feature
slug: "ux-audit-run-and-fixes-d170"
status: done
difficulty: high
created_at: "2026-09-05T10:47:48+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/ux-audit.md"
    op: create
  - path: "docs/00-overview.md"
    op: update
  - path: "apps/desktop/src/components/plate/hl.ts"
    op: update
  - path: "apps/desktop/src/components/plate/hl.test.ts"
    op: update
  - path: "apps/desktop/src/components/plate/ProofSheet.tsx"
    op: update
  - path: "apps/desktop/src/components/plate/ProofSheet.test.tsx"
    op: update
  - path: "apps/desktop/src/components/session/Summary.tsx"
    op: update
  - path: "apps/desktop/src/components/session/JobBand.css"
    op: update
  - path: "apps/desktop/src/components/session/SessionOverlay.css"
    op: update
  - path: "apps/desktop/src/components/t1/ClonePad.tsx"
    op: update
  - path: "apps/desktop/src/components/t1/PlainPad.tsx"
    op: update
  - path: "apps/desktop/src/store.ts"
    op: update
  - path: "apps/desktop/src/store.test.ts"
    op: update
  - path: "apps/desktop/src/data/session.ts"
    op: update
  - path: "apps/desktop/src/data/session.test.ts"
    op: update
  - path: "apps/desktop/src/screens/home/HomeScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/home/HomeScreen.test.tsx"
    op: update
  - path: "apps/desktop/src/components/home/Forecast.test.tsx"
    op: update
  - path: "apps/desktop/src/screens/clone/CoursePlateView.tsx"
    op: update
  - path: "apps/desktop/src/screens/clone/CourseToc.tsx"
    op: update
  - path: "apps/desktop/src/screens/clone/CourseToc.css"
    op: update
  - path: "apps/desktop/src/screens/clone/CloneScreen.test.tsx"
    op: update
  - path: "apps/desktop/src/screens/settings/SettingsScreen.tsx"
    op: update
  - path: "apps/desktop/src/screens/settings/SettingsScreen.css"
    op: update
  - path: "apps/desktop/src/screens/settings/SettingsScreen.test.tsx"
    op: update
  - path: "packages/i18n/src/ko/home.ts"
    op: update
  - path: "packages/i18n/src/en/home.ts"
    op: update
  - path: "packages/i18n/src/ko/session.ts"
    op: update
  - path: "packages/i18n/src/en/session.ts"
    op: update
  - path: "tests/support/ui.ts"
    op: update
  - path: "tests/support/gates.ts"
    op: update
  - path: "tests/e2e-ui/keyboard.spec.ts"
    op: update
  - path: "tests/e2e-ui/shell.spec.ts"
    op: update
  - path: "tests/e2e-ui/t0-session.spec.ts"
    op: update
  - path: "tests/e2e-ui/t1-t2.spec.ts"
    op: update
related: []
tags:
  - "D170"
  - "UX"
  - "감사"
  - "e2e"
  - "게이트"
  - "mcp-tool"
---
[x] UX 감사 — 앱을 실제로 돌려 21건을 찾고 13건을 고쳤다 (D170)

사용자 요청 「지금 UX 관련해서도 불편함이 많아 이를 조사하고 chickadee 를 정교한 학습 소프트웨어가
되도록」. 등록부 **D170** 을 먼저 올리고 `docs/ux-audit.md` 를 썼다.

## 추가 기능

**주행이지 추측이 아니다.** mockIPC 하네스(D108)로 Playwright 스크린샷 주행 스펙을 임시로 써서
첫 실행 → 인제스트 → 홈 → 세션(T0 둘 · 사다리 1~4단 · 오답 · 정답 · T2 영향 반경 · 요약) → 설정 →
서가 → 클론 코스 → 야간반 → 최소 창을 눌렀다. 화면마다 스크린샷 + 계측(13px 미만 활자 · 가로 넘침 ·
이름 없는 단추 · 포커스 · 스크롤 오프셋). 활자 규칙은 전부 지켜지고 있었고(0 · 0 · 0), 문제는 규칙
밖에서 났다. 찾은 21건 중 13건을 고쳤고, 3건은 사용자 결정(첫 실행 스위치 기본값 · 세션 뒤 홈 밝기 ·
WKWebView Tab), 코스 전환 충돌 9자리는 A7 에 표로 넘겼다.

**막힘 셋** — ① `hl()` 의 숫자 정규식이 `86_400_000`·`0xFF`·`1e3` 앞자리에서 `\b` 가 안 서 어느
갈래도 못 걸고 **글자를 떨어뜨렸다**(`_400_000` 으로 보임). 숫자를 `\d[\w.]*` 로 넓히고 빠진 글자를
맨 글자로 남긴다 ② 다음 판으로 넘어가면 `.bench` scrollTop(138)이 남고 `focus()` 가 문서까지 밀어
판 머리가 작업 띠 밑에 숨었다 — 판·요약이 걸릴 때 작업대를 0 으로, `focus({ preventScroll })`
③ `say()` 토스트를 지우는 코드가 없어 T2 채점 문구가 요약·홈까지 따라왔다 — 스토어가 `TOAST_MS`
뒤 스스로 지운다.

**헛걸음** — 홈 미리보기가 T1·T2 자리를 안 세어 「2판·4분」이 세션에서 「3판·8분」이 됐다(리듬 +
재료 유무로 근사, 굽지 않음) · 「이 리포로는 T2 를 짤 수 없습니다」 옆에서 T2 판이 나왔다(책임
배치만 커밋이 필요하다고 좁힘) · 읽은 리포에 「읽으면 대지가 깔립니다」(왜 없는지를 말함) · 최소 창에서
작업 띠가 두 줄 180px(브랜드 부제를 접음) · 클론 코스 포커스가 body(지연 로드된 Monaco 가 만들어지는
순간 `ClonePad` 가 든다 — rAF 로는 못 잡았다) · 목차 경로 7자 잘림 · 설정 맨 아래 홈으로 · 빈
`<code>` 상자 · 판정란 대기 문구 · 작업대 휠이 홈으로 새기(`overscroll-behavior`).

## 동작 흐름

**게이트가 `HEAD` 에서 이미 빨갰다.** 워크트리에 pristine `HEAD` 를 두고 기준선을 재니 e2e-ui 5 실패 ·
gates 7 실패 — 전부 같은 원인 둘. D140 이 첫날 큐에 T2 한 장을 넣었는데 `finishSession`·`toSummary`
헬퍼가 T2 판에서 `answerKeyOf` 로 「안 끝난 T0 판이 없다」를 던지고, D147 이 첫 화면에 스위치를 하나
더 세워 `.firstrun-lang [role=switch]` 가 둘이 됐다. 헬퍼에 `passT2Plate`(Tab 으로 상자 하나 →
Enter → 채점, 마우스 0)를 두고, Space 뒤에는 `.fb.on` 이 아니라 **교정지 이름표가 바뀔 때까지**
기다린다 — T2 판에는 `.fb.on` 이 없어 옛 판 위에서 다음 걸음을 뗐다. 시나리오 여섯의 수치를
T0 둘 + T2 하나로 고쳤다.

**공유 트리의 함정.** 감사 중 다른 세션이 마이그레이션 0008 을 넣어 시드가 스키마 8 이 되고
하네스가 첫 실행 화면으로 떨어졌다. 그래서 주행·게이트는 **`HEAD` 워크트리에 이 변경만 얹어** 돌렸다
(`git worktree add --detach`, `pnpm install --offline`). 다음 세션도 같은 길이 맞다.

## 검증

- 워크트리(HEAD + 이 변경): `playwright tests/e2e-ui` chromium+webkit **34 통과**(기준선 5 실패) ·
  `tests/gates` chromium+webkit **114 통과**(기준선 7 실패) · 재주행 계측 판 머리 `psTop 152 > bandBottom 112`
  · 토스트 `opacity 0` · 코스 포커스 `textarea.inputarea`.
- 공유 트리: `vitest run` **190 파일 2,183 통과**(새 시험 7) · `pnpm typecheck`·`pnpm lint` 무출력 ·
  `check:contrast` 48쌍 · `check:motion` 0 · `design:check` 일치.
- 임시 주행 스펙은 트리에서 지웠다(스크래치패드 보관). 실제 Tauri 창은 안 띄웠다 — 트리가 움직이는
  중이라 그 순간의 빌드가 매번 달랐다.

## 메모

사용자 결정 셋과 A7 에 넘긴 표는 `docs/ux-audit.md` §2·§3. 남긴 거슬림 하나 — 사다리의
「잉크 0겹 → 0겹」은 e2e 골든이 문구를 박제하고 있어 다음 판으로.