---
schema_version: 1
type: chore
slug: "pedagogy-evidence-baseline"
status: done
difficulty: medium
created_at: "2026-09-05T19:06:12+09:00"
session_id: "20260905-002"
agent:
  id: "claude-code"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/program/pedagogy.md"
    op: create
  - path: "docs/program/README.md"
    op: update
related: []
tags:
  - "pedagogy"
  - "research"
  - "program"
  - "evidence"
  - "mcp-tool"
---
[x] 학습 과학 근거 기준선 — pedagogy.md 신규 (J0)

## 동기

사용자 요청 「각 언어별로 완벽한 학습법」에서 「완벽한」을 지우고, 병렬로 도는 언어별 세션 넷
(py·ts / java·csharp / c·cpp·rs / go·swift·sql)이 일반론을 「이 언어 특유」로 우기는 것을
거를 기준을 만든다. 언어와 무관하게 **재현된** 근거만 남긴다.

## 추가 내용

`docs/program/pedagogy.md` 신규 303줄, `docs/program/README.md` 표에 행 하나(`fundamentals.md` 뒤).

- **§1** 후보 20개를 재현 등급(메타 / 다중 / 단일 / 불일치 / 반증 / 개입이 아니다)으로 분류.
  메타·다중이 10개, 그중 앱에 이미 있는 것 6개.
- **§2** 다섯 단 대조. 발견 하나 — 연구의 tracing 은 값을 굴리는 것인데 앱의 2단은 경로 추적이라
  `exec`·`hop`·`origin`·`caller` 넷 중 값을 굴리는 것이 하나도 없다. Parsons 는 4·5단 사이가
  아니라 **5단의 1겹**이고 `patch-place` 는 이미 한 줄짜리 Parsons.
- **§3** 형식 넷 대조 + 새 형식 둘 제안(`order`·`trace-table`), 안 만드는 것 둘(`subgoal`·`eipe-pick`).
- **§4** 「언어 특유」 시험 셋(이식·조항·사전). 넷을 시험 — SQL 통과, Rust 는 오류 코드로 좁히면
  통과, C 는 언어군의 것, JS 이벤트 루프는 탈락.
- **§5** 안 하는 것 여덟 + 0장 상한 폐지의 결과 판단 한 단락(상한 대신 성질 게이트 권고).
- **§7** 출처 25건, 전문 확인 2건.

## 검증

- `wc -l docs/program/pedagogy.md` = 303 (요구 300~500 안).
- 인용한 파일 경로 6개를 `ls` 로 실재 확인 — `packages/scheduler/src/{fsrs,reducer}.ts` ·
  `packages/{cards,grading}/src/fundamentals.ts` · `packages/cards/src/{t0-exec,stage}.ts`.
- 인용한 D 번호를 `docs/00-overview.md` §4.2.1 에서 grep 으로 확인(D4·D106·D136·D144·D145·
  D147·D151·D157·D164·D165·D167·D175·D177·D181). 등록부에 행은 **올리지 않았다** — 초안은 §6 의 물음이다.
- Ericson 2022 SLR 은 PDF 를 `pdftotext` 로 펴서 §4.4.1·§4.4.5 를 직접 읽었다. 처음 적은
  「편수만 세고 방향을 요약하지 않았다」가 틀려서 고쳤다 — 리뷰는 방향을 적고, 대신 22편 중
  9편이 Parsons 의 기여를 다른 연습에서 분리하지 않았다.