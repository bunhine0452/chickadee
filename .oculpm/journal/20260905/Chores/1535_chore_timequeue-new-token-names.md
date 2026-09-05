---
schema_version: 1
type: chore
slug: "timequeue-new-token-names"
status: done
difficulty: verylow
created_at: "2026-09-05T15:35:00+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "apps/desktop/src/components/shell/TimeQueue.css"
    op: update
related: []
tags:
  - "D182"
  - "tokens"
  - "mcp-tool"
---
[x] TimeQueue.css 를 새 토큰 이름으로 옮긴다 (G1 별칭 정리)

G1 이 옛 토큰 이름 78개를 한 판만 별칭으로 남기고 마지막에 통째로 지운다. 아직 별칭을 쓰는
파일 다섯 중 하나가 셸의 `TimeQueue.css` 였다.

바꾼 짝 아홉: `--rule`→`--border` · `--paper-3`→`--surface-3` · `--paper-2`→`--surface-2` ·
`--ink`→`--text` · `--ink-soft`→`--text-muted` · `--state-progress`→`--accent` ·
`--fs-13`→`--fs-1` · `--fs-14`→`--fs-2` · `--f-mono`→`--font-mono`. 값은 별칭이 가리키던
그것과 같으므로 화면은 한 픽셀도 안 바뀐다.

## 검증

`stylelint` 0 · `TimeQueue.test.tsx` 8건 포함 셸 단위 시험 13건 통과 ·
`pnpm check:contrast` 142쌍 전부 통과 · 반응형·글자 게이트 34건 두 엔진 통과.