---
schema_version: 1
type: chore
slug: "handoff-prompts-as-files-d63"
status: done
difficulty: low
created_at: "2026-09-03T03:38:15+09:00"
session_id: "20260903-002"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/handoff/README.md"
    op: create
  - path: "docs/handoff/m1.md"
    op: create
  - path: "docs/00-overview.md"
    op: update
related: []
tags:
  - "m0"
  - "handoff"
  - "docs"
  - "d63"
  - "mcp-tool"
---
[x] 인계 프롬프트를 docs/handoff/ 파일로 고정 (D63) — M1 인계본 작성

## 작업

M1 인계 프롬프트가 `/tmp` 에만 있었다 — 재부팅이면 사라진다. `docs/handoff/` 로 옮기고 규격을 못박았다.

- `docs/handoff/m1.md` — M1 세션에 그대로 붙여 넣는 프롬프트.
- `docs/handoff/README.md` — 마일스톤당 파일 하나, 무엇을 담는지 7항목, 끝난 파일도 지우지 않는 이유.
- **D63** 등록 + `docs/00-overview.md` §7 인계 규칙 **10번**. 마일스톤을 끝낸 세션이 다음 파일을 쓴다.
- `m1.md` 의 「보고」에 M2 인계본 작성 의무를 넣었다 — 규칙이 §7 에만 있으면 인계본만 읽는 세션이 놓친다.

## 왜

인계를 대화에 남기면 사라진다. M0 이 남긴 지뢰 셋은 설계 문서를 읽어서는 알 수 없고 밟아 봐야 아는 것들이다 — 빈 `crates/*` 디렉터리가 cargo 를 통째로 못 열게 만드는 것, `git2 < 0.21` 이 unsound 권고 3건으로 `audit` 잡을 빨갛게 하는 것(신뢰할 수 없는 리포를 파싱하므로 `deny.toml` 무시 목록에 일부러 안 넣었다), 이미 있는 `packages/text`·`fromRow` 계층을 다시 만들려 드는 것.

## 프롬프트를 보여주다 발견한 오류 4건

사용자에게 내용을 보여주려고 파일을 읽었더니 마지막 편집이 망가뜨린 자리가 있었다.

- **CI 지시가 D62 항목 끝에 붙어 있었다** — 「AI 말투 금지」 불릿 안에 「푸시하면 CI 가 돈다」가 이어져 별개 규칙이 하위 규칙처럼 보였다. 독립 항목으로 뗐다.
- `D48~D60` → `D48~D62`, `M1 항목 23개` → `29개`(플랜 실측), `M0 일지 6건` → `9건`, 새 결정 번호 `D61…` → `D63…`.

파일로 옮기지 않았으면 다음 세션이 이 상태로 받았을 것이다.

## 검증

- `git push` 성공(9e03bcf). 커밋 메시지는 D61 대로 영어.
- 결정 번호 정렬 확인 — §4.2.1 이 D48~D63 순서.
- **다른 세션이 이미 M1 을 시작했다** — `crates/git/`(Cargo.toml·lib.rs·commits.rs·blob.rs·tests/repo.rs)과 `crates/parse/` 가 생겼고 루트 `Cargo.toml` 의 `chickadee-git` 줄이 켜졌다. 진행 중인 남의 작업이라 스테이징하지 않고 `docs/` 3개 파일만 커밋했다.