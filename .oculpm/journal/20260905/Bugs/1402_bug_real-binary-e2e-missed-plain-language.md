---
schema_version: 1
type: bug
slug: "real-binary-e2e-missed-plain-language"
status: done
difficulty: low
created_at: "2026-09-05T14:02:46+09:00"
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
  - path: "tests/e2e/specs/e5-session.e2e.ts"
    op: update
  - path: "tests/e2e/specs/e6-escape.e2e.ts"
    op: update
  - path: "tests/e2e/specs/e7-night.e2e.ts"
    op: update
related: []
tags:
  - "CI"
  - "e2e"
  - "D178"
  - "평문화"
  - "mcp-tool"
---
[x] 평문화가 실제 바이너리 e2e 를 안 지나갔다 — CI 의 e2e-linux 만 빨갰다

## 발생 원인

D178(평문화) 세션의 범위가 `tests/e2e-ui/**`(Playwright, mockIPC)와 `tests/gates/**` 였고, **`tests/e2e/**`(WebdriverIO + 실제 Tauri 바이너리, 리눅스 전용)는 빠졌다.** 그 스펙들이 옛 문구를 문자열로 박제하고 있었다.

- E4 홈 — 정규식 `/(\d+)\s*판\s*·\s*약\s*(\d+)\s*분/` 이 「3문제 · 약 6분」과 안 맞는다. 「인쇄 시작」 단추 문구도.
- E5 세션 — 사다리 제목 「모르겠어요 = 다시 찍기」.
- E6 Esc — 「이어 찍기 · N번째 판부터」.
- E7 — 스위처 선택자 `aria-label="주간반 · 야간반 전환"`.

로컬에서 못 잡힌 이유는 이 잡이 리눅스에서만 돌기 때문이다(`tauri-driver` + xvfb). macOS 개발기의 `pnpm test:unit`·`test:gates`·`test:e2e-ui` 는 전부 초록이었다.

## 해결 방법

네 스펙의 기대 문자열과 선택자를 새 문구로 맞췄다. 실패 메시지와 주석의 은유 낱말도 같이 고쳤다 — 시험이 옛 어휘로 말하면 다음 사람이 그 어휘가 아직 산다고 읽는다. 36곳.

`tests/e2e/specs/e8-settings.e2e.ts` 는 손대지 않았다. 그 스펙이 기대하는 문구 아홉을 카탈로그와 대조해 전부 그대로임을 확인했다 — 설정 화면은 은유를 쓰지 않았다.

## 검증

`npx tsc --noEmit -p tests/tsconfig.json` 오류 0 · `pnpm lint` 무출력 · `grep` 으로 `tests/e2e/specs/**` 의 기대 문자열·선택자에 남은 은유 낱말 **0건**. 실제 판정은 리눅스 CI 다(다음 푸시).