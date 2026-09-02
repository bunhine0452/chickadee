---
schema_version: 1
type: chore
slug: "discussion-doc-resolved"
status: done
difficulty: low
created_at: "2026-09-02T20:30:59+09:00"
session_id: "20260902-003"
agent:
  id: "claude-code"
  version: "Fable 5.1"
language: "ko"
verified_by_user: false
files_touched:
  - path: ".oculpm/discussion/vibe-code-study-app/discussion.md"
    op: update
related:
  - ref: "20260902/Features_to_add/2012_feature_design-docs-parallel-seniors-plan.md"
    kind: "followup"
tags:
  - "discussion"
  - "docs"
  - "resolved"
  - "mcp-tool"
---
[x] 논의 문서 확정(resolved) — 방안 채택/폐기 표시, 방안 G 추가, 미해결을 플랜으로 이관

## 작업
- `.oculpm/discussion/vibe-code-study-app/discussion.md` frontmatter `status: open → resolved`.
- 「후보 해결 방안」 머리에 채택 요약을 두고, A~F 각 방안 아래 **상태** 줄(채택/폐기와 결론 절 참조)을 추가. 최종 시각 방향이 후보 목록에 없었으므로 `### 방안 G — 「잉크」(리소그래프) + 박새 {#opt-ink}` 를 은유·장점·단점·비용으로 추가(방안 F 는 폐기로 표시, 이식된 규칙과 철회된 규칙 명시).
- 「미해결」을 「미해결 → 구현 단계로 이관」 표로 바꿔 각 항목을 플랜 `chickadee-build` id 에 대응(WebKit 성능 `m1-05-wkwebview-perf`, 홈 빌드 이전 `m5-05-mockup-cleanup`, Swift/Dart `m1-03-swift-dart-sql`, projectox `m1-03-projectox-check`, AST 승격 `m3-04-t1-ast`, 사용자 결정 8건은 `docs/00` §6).
- 「다음 단계」를 닫힌 목록으로: 완료 항목 `[x]`, 구현으로 넘어간 항목은 `[>]` 이월 + 플랜 id. 로그 1행 append.

## 검증
- 규격(`.oculpm/agents/discussion-spec.md`) 대로 frontmatter 필수 키·`{#opt-*}`/`{#next-*}` id 줄 끝 유지·로그 append-only 확인. `grep` 으로 `status: resolved`, 방안 G 헤딩, `[>]` 6건 확인.

## 메모
- resolved 문서는 이후 수정 금지 — 새 결정은 `docs/00-overview.md` §4 등록부(D48~)와 플랜·일지에 쌓는다.