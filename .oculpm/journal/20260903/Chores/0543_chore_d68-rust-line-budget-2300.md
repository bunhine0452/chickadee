---
schema_version: 1
type: chore
slug: "d68-rust-line-budget-2300"
status: done
difficulty: low
created_at: "2026-09-03T05:43:11+09:00"
session_id: "20260903-002"
agent:
  id: "claude-code"
  version: "Opus 5 (1M)"
language: "ko"
verified_by_user: false
files_touched:
  - path: ".oculpm/discussion/vibe-code-study-app/discussion.md"
    op: update
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/01-architecture.md"
    op: update
  - path: "scripts/check-rust-budget.sh"
    op: update
  - path: "README.md"
    op: update
  - path: "CLAUDE.md"
    op: update
related:
  - ref: "20260903/Features_to_add/0404_feature_m1-ingest-runner-and-boundary.md"
    kind: "followup"
tags:
  - "D68"
  - "rust-budget"
  - "docs"
  - "canon"
  - "mcp-tool"
---
[x] D68 종결 — Rust 줄 예산 상한을 1,500 에서 2,300 으로

## 동기

M1 이 끝난 뒤 실측이 2,043 인데 정본 §5 는 「얇은 Rust … 500~1500줄」이었고 01 §1.1 이
그것을 CI 게이트로 잠가 두었다. M1 세션은 게이트만 잠정 2,100 으로 올리고 문서는 손대지
않은 채 사용자 결정을 기다렸다(§7-2 — 정본 변경은 사용자 확인이 먼저다).

사용자가 (a) 를 골랐다: **정본의 수치를 2,300 으로 고치고 01 과 게이트를 맞춘다.**

## 변경 요약

- **정본** `.oculpm/discussion/…/discussion.md` 「결론」 §5 — 「500~1500줄」 → 「**≤ 2,300줄**
  … 1,500 에서 올렸다, D68」. 토의 로그에 결정 행 1건 추가.
- **00 §4.2.1 D68** — 「실측 2028 · 사용자 결정 대기」 행을 결정 내용으로 다시 썼다.
  **§4.3** 의 「미확인 1건」 문단을 「정본 §5 갱신(승인 2026-09-03)」으로 바꿨다.
  **§1** 요약 문장과 **§5** M1 「끝났다는 증거」의 게이트 수치도 2300 으로.
- **01 §1.1** 줄 예산 표 ≤ **2300**. **§4** 크레이트별 상한 재배분 —
  `git 460` · `parse 400` · `store 360` · `app 1080`. **넷의 합이 정확히 2,300** 이다
  (D64 의 400/400/350/500 은 합이 1,650 이라 총량과 어긋나 있었다). §「열린 질문」 4번의
  `예산(1500줄)` 도 같이.
- **게이트** `scripts/check-rust-budget.sh` 기본값 2100 → **2300**, 주석을 잠정 문구에서
  결정 문구로. 총량만 강제하고 크레이트별 내역은 출력만 하는 동작은 그대로다.
- **README.md**(`≤ 2300 lines, CI-enforced.`) · 루트가 아닌 프로젝트 **CLAUDE.md**.

## 숫자 근거

실측 `git 383 + parse 358 + store 343 + app 959 = 2,043`. 남은 마일스톤이 더할 양은
`parse_snippet`(M3 ~25) · `git_diff_text`(M4 ~67) · `dict_*`(M5 ~65) · `repo_glob_read`
(M6 ~30) = ~190 → **MVP 예상 ~2,230**, 상한까지 70줄. 크레이트별 상한도 그 예상치 위에
여유 10~26줄로 얹었다.

## 고치지 않은 것 (의도)

- `.oculpm/planner/chickadee-build.md` 의 M1 제목에 있는 「Rust ≤1500줄」 — 플랜이 제목으로
  항목을 참조한다(제목 불변 규칙). M1 이 통과한 게이트가 그 값이었다는 기록이기도 하다.
- `docs/handoff/m1.md` · `m2.md` — 인계 파일은 그 시점의 전제를 남기는 문서다
  (`docs/handoff/README.md` 「갱신」). m2.md 의 ★ 문단은 질문이 열려 있던 시점의 기록이고,
  답은 D68 행과 이 일지에 있다.
- 00 §4.2.1 의 **D64** 행 — 하위 예산 400/400/350/500 은 D68 이 덮는다. 등록부는 이력이라
  뒤 행이 앞 행을 대체하는 형태로 둔다.

## 검증

- `bash scripts/check-rust-budget.sh` → `ok line budget: 2043/2300 lines` · 금칙어 0 ·
  SQL 리터럴 0 · raw output 0 · git 바이너리 0. 크레이트별 출력
  `git 383 · parse 358 · store 343 · app 959`.
- CI 의 `lint-type-unit` 은 이 스크립트를 그대로 부른다(`.github/workflows/ci.yml:190`) —
  워크플로에 박힌 수치는 없다.
- `grep -rn "1500"` 로 남은 표기 확인: 무관한 2건(02 §행 수 추정 `1,500`, 05 색 `#12100C`)과
  의도적으로 남긴 이력 3건(D64 행 · 정본 로그 2026-09-02 행 · 인계 파일) 뿐.