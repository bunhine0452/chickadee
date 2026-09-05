---
oculpm_plan: v1
id: chickadee-v09-learning-methods
title: "0.9 열 언어를 근거 있는 학습법으로 — 값 적기 형식 · 그림 · 0부 · 언어별 학습법 (D183~D184)"
status: active
created: 2026-09-05
updated: 2026-09-05
owner: claude-code
---

사용자 요청 둘 — 「10개 언어를 동작 원리부터, 시각 자료 많이, 4지선다 말고 다른 형식으로」(I 라운드, 커밋 1921710) 와 「각 언어별로 근거 있는 학습법으로 학습할 수 있게, 병렬 조사」(J 라운드). 프롤로그 상한은 D184 로 폐지했다(89ce5aa).

## J · 언어별 학습법 조사 (Opus 다섯, 동시) {#j-research}
- [x] J0 — 언어 무관 학습 과학 근거 목록과 다섯 단·형식 넷 대조 · 「언어 특유」 판정 기준 → docs/program/pedagogy.md {#j0-pedagogy}
- [x] J1 — 파이썬·JS/TS: 기계 한 문장 · 교재 수렴 순서 · 특유 연습 · 오개념 연구 · diff → py.md·ts.md §N {#j1-py-ts}
- [~] J2 — 자바·C#: objects-first 논쟁 결론 · DI 추적 · 로그인 챕터가 기계를 쓰는지 → java-learning.md·csharp.md {#j2-java-cs}
- [~] J3 — C·C++·러스트: 하나의 기계 · Brown 실험판 Rust Book 근거 · UB 연습 · C 를 가르칠 자격 판단 → c.md·cpp.md·rs.md {#j3-c-cpp-rs}
- [~] J4 — Go·Swift·SQL: SQL 의 「추적」「수정」 정의 · Miedema 오개념 대조 · 고루틴 비결정론 형식 → go.md·swift.md·sql.md {#j4-go-swift-sql}

## K · 통합 — 다섯 보고를 하나의 결정으로 {#k-integrate}
- [ ] J0 의 「언어 특유」 기준으로 J1~J4 의 특유 연습 주장을 거른다 — 통과·탈락 표 {#k-conflicts}
- [ ] 새 형식 제안을 모아 fundamentals.md 에 후보 표로 — 결정론 채점 가능한 것과 LLM 필요한 것을 가른다 {#k-formats}
- [ ] 각 언어 §N.6 diff 를 등록부 행 하나(D185)로 묶고, 순서 변경은 curriculum 문서 본문에 반영 {#k-diffs}
- [ ] docs/curriculum/<lang>.md 의 「상한 24」 언급을 D184 로 고친다 (세션 중 충돌 회피로 미뤄 둔 것) {#k-cap-mentions}
- [ ] docs/curriculum/README.md 에 §13 학습법 요약 표(언어 · 기계 한 문장 · 특유 연습 · 근거 강도) · docs/program/README.md 에 pedagogy.md 행 {#k-readme}
- [ ] typecheck · lint · test:unit · gates · design:check · contrast · motion → 커밋(영어) → 푸시 → gh run watch {#k-gates}

## Q · 사용자 결정 (멈춤표) {#q-user}
- [ ] 물을 것 — build 형식(거꾸로 만들기)을 열려면 러너를 리포 밖 스니펫·자바 외 언어로 넓혀야 한다. 지금 여나 {#q-build-format}
- [ ] 물을 것 — 알고리즘 첫 단계(표준 입력 러너 + 우리가 쓴 작은 문제 층)를 다음 판에 넣나 {#q-stdin-runner}
- [ ] 물을 것 — 사전 실제 저작의 첫 언어 (순서는 TS → SQL → 파이썬 → 자바 → 러스트, 첫 언어 23~31일) {#q-first-lang}
- [ ] 물을 것 — cs/ 에 없는 셋(operator-precedence · type-conversion · truthiness)을 43→46 으로 신설하나 {#q-cs-three}
- [ ] 물을 것 — 새 결함 둘 수리 시점: grammarSchema 가 파서 없는 언어를 통과시키는 것 · MyBatis #{} 자리표가 sql/comparison 에 틀린 답을 내는 것 {#q-defects}

<!-- oculpm:plan-log begin v1 -->
| 시각 | 항목 | 에이전트 | 변화 | 일지 | 메모 |
|---|---|---|---|---|---|
| 2026-09-05T19:02:26+09:00 | #j0-pedagogy | claude-code | ☐→~ |  | Opus 세션 착수 — 상한 폐지(D184) 전달 |
| 2026-09-05T19:02:29+09:00 | #j1-py-ts | claude-code | ☐→~ |  | Opus 세션 착수 |
| 2026-09-05T19:02:31+09:00 | #j2-java-cs | claude-code | ☐→~ |  | Opus 세션 착수 — java.md 903줄이라 java-learning.md 로 분리 지시 |
| 2026-09-05T19:02:32+09:00 | #j3-c-cpp-rs | claude-code | ☐→~ |  | Opus 세션 착수 — Crichton 2023·Brown 실험판 필독 지시 |
| 2026-09-05T19:02:34+09:00 | #j4-go-swift-sql | claude-code | ☐→~ |  | Opus 세션 착수 — SQL 먼저, Miedema 2022 필독 지시 |
| 2026-09-05T19:07:51+09:00 | #j0-pedagogy | claude-code | ~→x | .oculpm/journal/20260905/Chores/1906_chore_pedagogy-evidence-baseline.md | pedagogy.md 303줄 · 근거 20 중 재현 10, 앱에 6 · 2단에 값 추적 없음 · order/trace-table 제안 · 기준: 옮기면 답이 사라져야 특유 |
| 2026-09-05T19:24:24+09:00 | #j1-py-ts | claude-code | ~→x |  | py-learning.md 463 · ts-learning.md 427 · py 기계 하나(명세 근거) · JS 기계 셋, 인벤토리 33건 중 이벤트 루프 0 · 축 E·G·H 는 형식의 한계 · 1차 94% |
<!-- oculpm:plan-log end -->
