---
schema_version: 1
type: feature
slug: "rs-dictionary-session-merged"
status: done
difficulty: high
created_at: "2026-09-06T04:55:57+09:00"
session_id: "20260906-002"
agent:
  id: "claude-code"
  version: "Fable 5.1"
  session: "aba79b97-7097-466f-8484-5b36a42424eb"
language: "ko"
verified_by_user: false
files_touched:
  - path: "dictionary/rs/_lang.yaml"
    op: create
  - path: "dictionary/rs/move.yaml"
    op: create
  - path: "dictionary/rs/borrow-shared.yaml"
    op: create
  - path: "dictionary/rs/question-mark.yaml"
    op: create
  - path: "packages/course/src/parts/rs.ts"
    op: update
  - path: "packages/cards/src/t0-synthetic.ts"
    op: update
  - path: "packages/dictionary/src/dict.test.ts"
    op: update
  - path: "docs/curriculum/rs.md"
    op: update
related: []
tags:
  - "v11"
  - "사전"
  - "rs"
  - "합류"
  - "mcp-tool"
---
[x] Rust 사전 42장 — 0장에서 전량, ai-pm 280파일 실측, 2부 첫 판은 UB 뒤의 move (D190 rs 세션 합류)

Fable 포크 워크트리 세션(브랜치 `worktree-agent-ab142c602888aed18`, 커밋 `38c97e0`)의 보고를 받아 병합했다. 세션 한도로 한 번 멈췄다가 재개해 끝냈다.

## 추가 기능

- 0 → **42장** 7,746줄(한 장 184줄). `essential` 41(0부 11 · 1부 7 · 2부 23) + `rs/return-statement`(`tail-expression` 의 `alternatives` 짝, 비필수). `parts/rs.ts` 같음. `rs.md` §0.6 의 3부 아홉은 2부 끝에 — 3부는 `tauri/` 가 서면.
- 골든 105/44, `no_hole_reason` 6. 표본은 사용자 리포 넷(ai-pm 280 · file_converter 45 · PySpace 8 · ECC 15) — 0곳 없음, `borrow-shared` 9,474/256 · `let-binding` 8,740/256 · `question-mark` 4,281/188. 얇은 여섯(ai-pm 100곳 미만)은 essential 에서 서로 안 붙는다.
- `rs/move` 에 쿼리를 걸었다(문서 §5 는 「사용처 없음 · D154 경로」) — `let t = s;` 3곳 · `f(s)` 1,161곳인데 후자는 표본 12 중 9 가 `&Path` 복사라 정밀도가 낮다. 카드는 규칙(`Copy` 면 복사)으로 정답을 낸다. 2부 첫 판이 UB(`cs/undefined-behavior` 선행)인 것은 결정대로.
- 파서 ERROR ai-pm 29/280(10.4%) — 전부 `&raw`(rust-axis §1.2 가 적어 둔 것), poor 0.
- ABSENCE 에 `rs/unsafe-block: idiom` — file_converter 0곳 · PySpace 1곳, `forbid(unsafe_code)` 관습.

## 동작 흐름

`rs/async-await` 신설 · `smart-pointer → shared-thread-state` 선행 끊음(rust-axis §2.3) · 0부 id 조각은 문서 §0.1 을 따르고 `universal` 은 README §8 값 · `cs/signed-and-unsigned` 부재 · `common/` 후보 넷(type-cast · pattern-match · interface-contract · module-export) · §0.7 grep 계수와 노드 계수의 어긋남은 등록부 초안. 합류에서 `DEBT_RATCHET` 331/314/331/322.

## 검증

병합 뒤 `packages/dictionary`·`packages/course`·`packages/cards` 초록(래칫 재잠금 뒤), cargo 골든 6/6. 못 한 것: 화면에서 안 돌림 · `tail-expression` 이 `if`·`match` 꼬리를 못 잡음(3,601 은 하한) · `cast-as` 의 `from`/`into` 가 수 아닌 변환도 잡음 · Tauri `entry-command` TS 짝짓기·cargo 러너·`tauri/` 는 범위 밖.