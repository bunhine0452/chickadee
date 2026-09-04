---
schema_version: 1
type: chore
slug: "commit-i18n-and-refresh-handoff"
status: done
difficulty: low
created_at: "2026-09-04T08:28:37+09:00"
session_id: "20260904-003"
agent:
  id: "claude-code"
  version: "Opus 5 (1M)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/handoff/v02.md"
    op: update
  - path: "docs/handoff/README.md"
    op: update
related:
  - ref: "20260904/Chores/0722_chore_handoff-v02-prompt.md"
    kind: "followup"
tags:
  - "docs"
  - "handoff"
  - "i18n"
  - "multi-session"
  - "mcp-tool"
---
[x] i18n P0·P1 커밋 분할과 0.2 인계 문서 갱신

## 변경 요약

병행 세션이 끝낸 `chickadee-i18n` P0·P1 을 검증하고 커밋한 뒤, 인계 문서를 지금 상태로 갱신했다.

- `e34534b` — 47파일. `packages/i18n` · `Settings.locale` · 첫 실행 0단계 · 설정 스위치 · `<html lang·data-locale>` · 게이트 로케일 축 · 등록부 D117·D118 반영 · 플랜 3개 · 일지 2건.
- `b5ea819` — `docs/handoff/v02.md`(진행 상태·재사용 지점·지뢰·정해야 할 것 갱신) · `README.md` 표 상태.

**커밋 분할** — 그 세션은 「다른 세션 작업이 섞여 커밋하지 못한다」고 보고했으나, 그 사이 `8dc9955`(사다리 4단)가 들어가 이미 해소돼 있었다. 트리에 남은 소스는 전부 i18n 것이었고 빼야 할 것은 그 세션의 일지 `0820` 하나뿐이었다.

**보고 검증** — 등록부 D117·D118 행 존재 확인(D114~D116 은 다른 것이 차지했다), 사전 `name: { ko, en }` 이 57 중 55 파일에 이미 있음 확인, 게이트가 05 §9(ko 30~45)로 왔고 allowlist 4→2 확인. 재실행: typecheck 12개 Done · 1585 통과 · `check:rust` 2300/2300.

**정정 하나** — 사전 `name` 이 이미 이중 언어라도 P3 의 6일은 줄지 않는다. YAML 의 한글 2.7만 자는 대부분 `one_liner`·템플릿·문항 산문이고 그것이 그대로 남아 있다. 그 세션의 정정이 실제로 바꾼 것은 규모가 아니라 스키마(스칼라면 ko 로 읽는 유니온이라 기존 57 파일이 손대지 않고 통과한다)다.

인계 문서에 새로 적은 지뢰 둘: `measure()` 가 「한글 15자 이상」으로 본문을 판정해 en 화면에서 **0건을 재고 초록**이 떴다는 것, 로케일 기본값이 OS 추정이라 하네스가 러너를 탔다는 것. 그리고 「등록부 번호는 읽는 순간 낡는다 — 행을 쓰기 직전에 다시 세라」.

## 검증

`git show --stat` 로 두 커밋의 파일 집합 확인, `0820` 이 미추적으로 남아 있는 것 확인. typecheck·test:unit·check:rust 재실행 결과는 위와 같다.