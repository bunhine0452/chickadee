---
schema_version: 1
type: bug
slug: "write-edges-return-type"
status: done
difficulty: verylow
created_at: "2026-09-05T06:48:23+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5 (1M)"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/concepts/src/ingest.ts"
    op: correct
related: []
tags:
  - "D160"
  - "typecheck"
  - "게이트"
  - "mcp-tool"
---
[x] writeEdges 가 돌려주는 것과 적어 둔 것이 달랐다 — 브랜치 typecheck 가 빨갰다 (D160)

푸시 전에 브랜치의 미푸시 커밋 열셋을 게이트에 돌리다 잡았다.

## 발생 원인

D160 이 「대지가 같은 것을 다시 풀지 않도록」 `writeEdges` 의 반환을
`{ count, resolved }` 로 바꿨고 부르는 쪽도 그렇게 구조분해하는데, 선언은
`Promise<number>` 그대로였다.

```
packages/concepts/src/ingest.ts(282,3): error TS2322:
  Type '{ count: number; resolved: ResolvedEdge[]; }' is not assignable to type 'number'.
```

`vitest` 는 타입을 지우고 돌므로 2,046건이 전부 통과했고 `eslint` 도 조용했다 — 이 결함을
내는 게이트는 `pnpm typecheck` 하나뿐이다. CI 트리거가 `pull_request` 와 `push: [main]`
뿐이라 기능 브랜치 푸시로는 그 게이트가 돌지 않아, 손으로 돌리지 않았으면 PR 을 여는
순간에야 빨개졌을 것이다.

## 해결 방법

`ResolvedEdge` 는 이미 import 되어 있었다. 선언을
`Promise<{ count: number; resolved: ResolvedEdge[] }>` 로 고치고, 왜 결과를 함께 돌려주는지
한 줄 남겼다. 본문도 부르는 쪽도 안 건드렸다 — 틀린 것은 적어 둔 타입뿐이었다.

## 검증

`pnpm typecheck` 12 프로젝트 전부 Done · `pnpm lint` 무출력 · `npx vitest run` 2,046건 /
181 파일 통과 · `check-rust-budget.sh` 2,430/2,800 과 규칙 넷 통과. 브랜치를 원격에 올렸다
(`acc7a82`).