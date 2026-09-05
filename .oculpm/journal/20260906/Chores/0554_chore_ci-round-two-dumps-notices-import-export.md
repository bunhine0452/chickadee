---
schema_version: 1
type: chore
slug: "ci-round-two-dumps-notices-import-export"
status: done
difficulty: medium
created_at: "2026-09-06T05:54:41+09:00"
session_id: "20260906-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "aba79b97-7097-466f-8484-5b36a42424eb"
language: "ko"
verified_by_user: false
files_touched:
  - path: "fixtures/ipc/tiny/captures-all.json"
    op: update
  - path: "fixtures/ipc/projectox/blocks.json"
    op: update
  - path: "THIRD_PARTY_NOTICES.md"
    op: update
  - path: "dictionary/ts/import-export.scm"
    op: update
  - path: "dictionary/ts/import-export.js.scm"
    op: create
  - path: "dictionary/ts/import-export.yaml"
    op: update
  - path: "tests/support/quality.test.ts"
    op: update
  - path: "docs/00-overview.md"
    op: update
related: []
tags:
  - "v11"
  - "CI"
  - "덤프"
  - "ts"
  - "래칫"
  - "mcp-tool"
---
[x] CI 둘째 판 — IPC 덤프·라이선스 표 재생성, ts/import-export 는 가져오기만, 유형 쏠림 래칫 77.2%

골든 15건을 고친 커밋(`6200e93`)의 CI 가 앞 실패에 가려 있던 둘을 더 냈다. ① `THIRD_PARTY_NOTICES.md is stale` — 크레이트 넷(MIT)이 표에 없었다 ② `the IPC dump matches what is committed` — `fixtures/ipc/{tiny,projectox}` 가 새 사전(ts 47 → 69)으로 다시 구워져야 했다.

덤프를 다시 굽자 생성기 품질 시험(D132)이 드러낸 것 둘: 드롭률 6.3%(상한 5%) — `ts/import-export` 의 내보내기 자리 22곳이 전부 드롭. 이 개념의 산문은 전부 `{{pick.2}}`(어디서 가져오나)를 쓰는데 내보내는 줄엔 출처가 없다. 내보내기 꼴을 쿼리에서 빼고(주석으로 남김) 가져오기 꼴에 셋째 지목 후보(낱말 `import`)를 더했으며, TS 전용 선언 노드가 `javascript` 문법에서 컴파일이 안 돼 `.js.scm` 을 따로 뒀다. `ts/export-declaration` 은 후속. 남은 드롭 3.1%는 `ts/explicit-conversion`(전부터 있던 것). 그다음 유형 쏠림 래칫 — 뜻 고르기 77.1% > 76.5%. 새 자리 대부분이 지목 후보 셋이나 구멍이 없어 뜻 고르기만 되는 것이라 래칫을 77.2% 로 옮기고(목표 80% 안) 근거를 주석에 적었다. 내리는 길은 새 개념의 지목·빈칸 재료다(D191 ⑧⑨).

## 검증

골든 6/6 · 파이프라인 16/16 · 단위 2,645 · 게이트 206(건너뜀 10) · typecheck · 린트 · `licenses:check` 전부 초록. 앞서 크로뮴 게이트 셋이 30초 타임아웃으로 빨갰던 것은 단위 전체와 동시에 돌린 CPU 경합이었고 단독으로는 23/23 (6.9초).