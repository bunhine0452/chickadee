---
schema_version: 1
type: chore
slug: "js-framework-axis-plan"
status: done
difficulty: high
created_at: "2026-09-05T14:27:54+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  version: "Opus 5"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/plan/js-framework-axis.md"
    op: create
  - path: "docs/curriculum/ts.md"
    op: update
related: []
tags:
  - "plan"
  - "framework-detect"
  - "react"
  - "astro"
  - "node"
  - "runner"
  - "measurement"
  - "mcp-tool"
---
[x] JS·TS 프레임워크 축 착수 계획 — 실측 다섯 리포와 규칙 넷의 비용

병렬 세션 F3. 「자바 말고 다른 언어도 지원할 계획을 세워 달라」의 JS·TS 몫이다.
코드는 안 고쳤다 — **계획이 산출물**이고 착수 결정은 사용자가 한다.

## 한 것

`docs/plan/js-framework-axis.md`(544줄) 신규. 사용자 리포 다섯(`/Users/kimhyunbin/Desktop/git/`)을
읽기만 하며 실측하고, 조각 여덟(J1~J8)의 크기·선행·티어와 결정 등록부 초안 일곱(D181~D187),
사용자 결정 넷을 적었다. `docs/curriculum/ts.md` 에는 상호 참조 한 줄만 더했다.

## 실측이 뒤집은 것

**브리프의 전제가 틀렸다.** Express·NestJS·SvelteKit 을 다섯 리포 전량에서 찾아 **0건**이다.
실제 분포는 React 2 · Astro 1 · Vue 1 · **Node CLI 1**(`ECC`)이고, 브리프에 없던 **Tauri IPC** 가
두 리포에 있다. 규칙은 실측이 있는 셋에만 만든다.

**다섯 중 넷이 오늘 진입점 0개다.** `entryUnits` 는 `kind==='http'` 엣지의 `from` 을 쓰는데,
`ts/_imports.scm` 의 `http-*` 쿼리가 `member_expression`(`api.post("/x")`)만 잡는다. 그래서
규칙을 대고 만든 `MonggleMonggle`(39자리)만 선다. 나머지 넷은 기능 폐포가 안 서고 티어 A 로 내려앉는다.

**가장 값싼 큰 승리 — `bunhine_web`.** `fetch('/api/…')` 19자리가 파일 라우트 11개와 **11/11 정확히**
맞는다. `resolveTs` 는 이미 `/api/` 를 `nextRoute()` 로 보내고 `NEXT_ROOTS=['','src/']` 가
`src/pages/api/delete.ts` 를 찾는다 — **부족한 것은 부르는 쪽 캡처 하나**다. `.scm` ~7줄 +
`routeIndex` 확장 ~18줄, Rust 0줄로 리포 하나가 티어 A→B.

**러너는 자바보다 훨씬 싸다.** `file_converter` 에서 실제로 돌려 vitest 152테스트·19파일이
**2.2초**, `--reporter=json` 이 `--outputFile` 없이 stdout 첫 글자 `{` 로 온다. 자바가 필요했던
초기화 스크립트·표시줄 파싱·배포본 확인 셋이 전부 불필요하다. 유일한 방벽은 `node_modules`
(246~480MB)가 `proc.rs:117` 의 `git_ignore(true)` 에 걸려 작업본에 없고, `keep` 은 `is_file()`
만 처리하며, `needs` 는 home 기준이라 리포 안을 못 묻는다는 것.

**Rust 예산 2769/2800 — 31줄 남았다.** Rust 를 쓰는 조각은 러너(10~14줄)와 Astro(~18줄)뿐인데
합이 28~32라 둘 중 하나가 예산을 넘길 수 있다. 이것이 순서를 정한다.

기타 — `file_converter` 는 `invoke` 17 ↔ command 18 로 **`list_jobs` 하나가 죽은 갈래**,
`ai-pm` 은 315 선언 중 22개가 안 불린다. `ai-pm` 은 이름이 전부 Specta 생성 파일
`bindings.ts` 6,206줄 안이라 같은 규칙으로 못 덮는다. `ECC` 는 `fix:` 커밋 699건 중 JS/TS
1파일만 고친 것이 136건(19%). `'use client'` 는 다섯 리포 전량 0자리라 서버 컴포넌트 개념은
목록에서 뺐다 — 사용처 0인 개념은 `gaps.ts:65`·`zero-chapter.ts:100` 에서 조용히 사라진다.

## 검증

산출물이 문서라 실행 검증은 없다. 대신 숫자마다 근거를 붙였다 — `package.json` 파싱,
정규식 계수(하한이라고 명시), `vitest run --reporter=json` 실제 실행, `check-rust-budget.sh`
실행, `proc.rs`·`resolve-imports.ts`·`units.ts`·`sfc.rs` 원문 확인. AI 말투 금칙어 검사 통과.
조사 중 닫힌 미측정 항목 넷(vitest stdout · `ECC/tests/run-all.js` 형식 · `dictionary/rs/` 부재 ·
`tree-sitter-astro-next` 존재)은 §9 에서 본문으로 옮겼고, 남은 미측정 넷은 §9 에 그대로 남겼다.

## 메모

`dictionary/rs/` 가 **아예 없다**(네임스페이스 열셋에 rust 없음). J6(Tauri 간선)은 같은 날
병렬 세션 F1 의 러스트 축에 매인다. 순서에서 마지막인 이유다.