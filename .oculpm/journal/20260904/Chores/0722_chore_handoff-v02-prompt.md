---
schema_version: 1
type: chore
slug: "handoff-v02-prompt"
status: done
difficulty: low
created_at: "2026-09-04T07:22:57+09:00"
session_id: "20260904-003"
agent:
  id: "claude-code"
  version: "Opus 5 (1M)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/handoff/v02.md"
    op: create
  - path: "docs/handoff/README.md"
    op: update
related:
  - ref: "20260904/Chores/0711_chore_split-v02-plan-into-four.md"
    kind: "followup"
tags:
  - "docs"
  - "handoff"
  - "planning"
  - "mcp-tool"
---
[x] 0.2 인계 프롬프트 docs/handoff/v02.md — 새 세션이 요청 4건을 이어받도록

## 변경 요약

`docs/handoff/README.md` 규격(목표·읽을 순서·항목 id·다시 만들면 안 되는 것·밟으면 터지는 자리·규칙·이미 결정된 것·보고 형식)대로 `docs/handoff/v02.md` 152줄을 썼고, README 표에 행을 더했다. 마일스톤 파일이 아니라는 것을 표 아래 두 줄로 밝혔다 — 사용자 요청 4건이고 M6 와 배타가 아니다.

담은 것 중 문서를 읽어서는 알 수 없는 것들:

- **Rust 예산 2,300/2,300 여유 0** — 네 플랜을 전부 Rust 0줄로 설계한 이유와, 코스가 새 명령을 부르고 싶어질 때 `file_read_lines` 로 되돌아오라는 지시.
- **원장은 열을 풀 수 없다** — `review_log.session_id`·`session_item_id` 가 NOT NULL, `session_item.role` 은 CHECK 목록에 갇혀 있고 SQLite 는 CHECK 를 ALTER 로 못 고친다. 큐 밖 코스도 `session` 행을 만들어야 하고 `role` 은 `manual` 재사용.
- **행 길이 게이트·`keep-all`·`--measure`·`josa` 가 전부 한국어 전제** — en 에서 `tests/gates/design.spec.ts` 가 거짓 실패한다. D112 가 정본으로 지정한 05 §9 부터 고친다.
- **골든 픽스처가 한국어 문구를 박제하고 있다** — 로케일을 ko 로 고정하지 않으면 전부 깨진다. 다시 녹화하지 말 것.
- 마스트헤드의 죽은 버튼에는 CSS(`.repo-switch`)와 aria 가 이미 있으니 `disabled` 만 떼면 된다는 것.

## 검증

인용한 file:line 여섯을 grep 으로 대조해 셋을 고쳤다 — `App.tsx:110→109` · `Masthead.tsx:60→59` · `t1-block.ts:19→18`. 나머지(`flow.ts:89` · `store-sql/src/types.ts:162` · `Masthead.css:131`)는 맞았다. 코드 변경 없음.