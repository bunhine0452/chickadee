---
schema_version: 1
type: bug
slug: "real-binary-e2e-missed-redesign"
status: done
difficulty: low
created_at: "2026-09-05T16:37:48+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "tests/e2e/specs/e4-home.e2e.ts"
    op: update
  - path: "tests/e2e/specs/e6-escape.e2e.ts"
    op: update
  - path: "tests/e2e/specs/e8-settings.e2e.ts"
    op: update
related: []
tags:
  - "CI"
  - "e2e"
  - "D182"
  - "재발"
  - "mcp-tool"
---
[x] 시각 교체가 실제 바이너리 e2e 를 또 안 지나갔다

## 발생 원인

D182 의 병렬 넷(G1~G4)이 `tests/e2e-ui/**`(Playwright)와 `tests/gates/**` 는 맞췄는데 **`tests/e2e/**`(WebdriverIO + 실제 Tauri 바이너리, 리눅스 전용)는 이번에도 빠졌다.** 옛 마크업의 선택자를 들고 있어 세 자리에서 30초 대기 후 실패했다.

- `.today .qlist` — 큐 목록이 `.today-list` 가 됐다(홈 재설계, G3).
- `header.masthead button.flat-btn` — 마스트헤드 이동 단추가 `nav.mh-nav button.mh-link` 가 됐다.
- `main.settings` — 화면이 `Page` 셸을 쓰면서 `main.l-page.settings` 가 됐다(G2 의 `Page`/`Split`).

**2026-09-05 에 이 잡이 같은 이유로 두 번째 빨갛다.** 앞의 것은 D178(평문화)이 문자열을 바꿨는데 이 스펙들이 옛 문구를 박제하고 있던 것이고, 이번은 구조가 바뀐 것이다. 원인이 같다 — **개발기(macOS)에서 이 잡이 안 돌아 로컬 게이트가 전부 초록인 채로 푸시된다.**

## 해결 방법

세 선택자를 새 마크업으로 맞췄다. 그리고 **재발을 막으려고 전수 대조를 했다** — 실제 바이너리 스펙이 쓰는 선택자 29개와 기대 문자열 11개를 전부 뽑아 현재 `apps/desktop/src`·`packages/ui/src`·`packages/i18n` 에 있는지 기계로 확인했고, 빠진 것은 위 셋뿐이었다. 나머지(`.proof .ps` · `.fb.on` · `.acts` · `.dunno` · `.reprint` · `.set-wipe` · `section[aria-labelledby="set-data"]` · 문구 여덟)는 재설계를 지나고도 살아 있다.

## 검증

`npx tsc --noEmit -p tests/tsconfig.json` 오류 0. 선택자 29 · 문구 11 전수 대조에서 잔여 0. **실제 판정은 리눅스 CI 다** — 이 기계에서는 그 잡이 안 돈다(다음 푸시에서 확인).

## 메모

같은 사고가 두 번 났으므로 다음 판에서 막을 자리를 적어 둔다 — 실제 바이너리 스펙의 선택자·문구를 **정적으로** 소스와 대조하는 검사를 `pnpm test:unit` 안에 두면 macOS 에서도 잡힌다. 이번에 손으로 한 대조가 그 검사의 초안이다.