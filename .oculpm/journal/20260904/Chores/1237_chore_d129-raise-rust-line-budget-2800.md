---
schema_version: 1
type: chore
slug: "d129-raise-rust-line-budget-2800"
status: done
difficulty: low
created_at: "2026-09-04T12:37:19+09:00"
session_id: "20260904-006"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/01-architecture.md"
    op: update
  - path: ".oculpm/discussion/vibe-code-study-app/discussion.md"
    op: update
  - path: "scripts/check-rust-budget.sh"
    op: update
  - path: "README.md"
    op: update
  - path: "CLAUDE.md"
    op: update
related: []
tags:
  - "D129"
  - "rust-budget"
  - "decision-registry"
  - "canonical"
  - "mcp-tool"
---
[x] D129 — Rust 줄 예산 2,300 → 2,800, 크레이트별 재배분

## 동기

로컬 모델(Gemma)을 사다리 4단에 넣을 수 있는지 묻는 대화에서 예산이 **2,300/2,300 으로 여유 0** 인 것이 드러났고, 사용자가 상한 상향을 결정했다. 플랜 `chickadee-v03-four-requests` 의 P0 에 `D129 — repo_clone 신설과 Rust 줄 예산 상향`이 이미 대기 중이었다(클론 URL 요청이 `crates/git` 을 건드린다).

2,300 이 마찰이 된 증거가 최근 결정 셋에 남아 있다 — D109 가 정확히 2,300/2,300 으로 채웠고, D121 이 `git config` 한 줄을 예산 때문에 접었고, D120 이 「Rust 는 0줄이다」로 우회했다. D68 이 남긴 여유는 67줄(3%)이었고 두 마일스톤 만에 0 이 됐다.

값은 실측 2,300 + 아직 안 쓴 Rust ~305 = ~2,605 위에 ~195(7%)를 남긴 것이다. 열거: `clone_into`+`repo_clone` ~90 · `repo_glob_read` ~30(D65) · `dict_*` ~65(D66) · `llm_ask`+reqwest ~70(D106) · 로컬 모델 provider ~40 · identity ~10.

4,000 같은 큰 값을 고르지 않은 이유는 상한의 일이 「못 넘게 막기」가 아니라 「이것은 Rust 인가 TS 인가를 제때 묻기」이고, 그 질문이 D14·D87 를 만들었기 때문이다.

## 변경 요약

- `docs/00-overview.md` §4.2.1 에 **D129 행**을 올렸다(§7-2 규칙대로 문서 수정 전 선행). §4.2.1 머리말의 번호대 안내에 `D126~ 은 0.3 요청 넷`을 더했고, §4.3 에 정본 §5 갱신 문단을 넣었다. §1 요약과 §5 M1 게이트 줄의 수치를 맞췄다.
- 정본 `discussion.md` 「결론」 §5 를 `≤ 2,800줄`로 고치고 로그 행을 남겼다.
- `docs/01-architecture.md` — §1.1 줄 예산 표, §3.2 의 「D68 을 다시 열지 않고는 안 들어간다」 문단, §4 디렉터리 트리의 크레이트별 상한, 「열린 질문」 4번의 괄호 수치.
- **크레이트별 재배분** `git 560 · parse 400 · store 380 · app 1460`(합 2,800). 실측이 `app 1135/1080` 으로 이미 자기 몫을 55줄 넘긴 채였다 — 게이트가 합계만 보므로 초록이었고 01 §4 의 배분이 현실을 설명하지 못했다.
- `scripts/check-rust-budget.sh` 기본값 2300 → 2800, 근거 주석을 D129 내용으로 다시 썼다.
- `README.md`(≤ 2800 lines) · 루트 `CLAUDE.md`(≤ 2800줄, D129).
- **움직인 것은 대리 지표뿐**이다. 네 grep(도메인 어휘·SQL 리터럴·git 바이너리·raw output)과 1크레이트=1래핑·공개 함수 ≤ 8·`forbid(unsafe_code)`·`clippy::pedantic` 은 손대지 않았다.
- `docs/handoff/**` 의 「2,300/2,300」은 고치지 않았다 — 그 회차가 실제로 통과한 게이트의 기록이다(D68 이 M1 플랜 제목을 남겨 둔 것과 같은 이유).

## 검증

`bash scripts/check-rust-budget.sh` — `ok line budget: 2300/2800`, 나머지 네 검사 전부 초록(`git 458 · parse 364 · store 343 · app 1135`). 등록부 표는 D125 와 같은 6 파이프로 열 수가 맞고, 살아 있는 문서·스크립트에 남은 `2300` 은 전부 내력 서술이다(`grep -rn 2300` 로 확인, handoff 제외).

## 메모

`crates/git/Cargo.toml` 의 `git2 features = ["https"]` 와 그 `Cargo.lock` 은 이 세션 이전부터 워킹 트리에 있던 P4(클론 URL) 준비분이고, 이번 커밋 범위에 넣지 않았다. `repo_clone`·`clone_into` 구현 자체는 P4 항목으로 남아 있다 — D129 는 그 자리를 만들었을 뿐이다.