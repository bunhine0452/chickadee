---
oculpm_plan: v1
id: chickadee-v04-four-requests
title: "0.4 요청 넷 — 0장(왕초보) · 구조 출제 · 자동완성 · LLM 저작 시점"
status: done
created: 2026-09-04
updated: 2026-09-04
owner: claude-code
---

앱을 쓴 사용자가 낸 요청 넷. 병렬 세션 넷의 조사 결과(일지 20260904/Chores/1402), 셋은 설계 논쟁이 아니라 미구현·고장이었다. 사용자가 착수 순서로 0장을 골랐다. 결정 넷은 확정 — AI 는 저작 시점만 · 코드 창은 감싸는 블록 접기 · 자동완성은 설정으로 열되 기본값은 권고안 · 0장부터.

## P0 · 결정 등록부 (문서 수정 전 선행) {#p0}
- [x] D136 — 「0장 — 이 언어의 바닥」을 대지 한 장으로 구현한다 {#d136-zero-chapter}
- [x] D137 — 합성 예제는 previewSiteId 가 있을 때만 만든다 (E-4 규칙의 코드화) {#d137-synthetic-preview}
- [x] D138 — 「먼저 읽기」는 0장 판에만 얹는다 — 전역 초보 모드를 만들지 않는다 {#d138-read-first}
- [x] D139 — 대상 경계를 첫 실행에서 먼저 말한다 (정본 §1 미구현 보수) {#d139-scope-notice}

## P1 · 0장 대지 (요청 4) {#p1}
- [x] packages/concepts/src/zero-chapter.ts — 개념 8개 선정(essential ∩ prereqDepth ≤ 1), 켜짐·끝남 조건 {#zero-select}
  - [x] chooseFirst 로 내 코드 뿌리 사용처를 먼저 채운다 {#zero-select-pick}
  - [x] 끝나는 조건 셋 — 8개 1겹 / newcomerFlag none + 뿌리 3/4 / 설정에서 끔 {#zero-select-done}
  - [x] 상한 8과 끝 조건을 테스트로 못박는다 (「과정」으로 자라나는 것을 막는 유일한 방벽) {#zero-select-test}
- [x] unit(source='manual') 로 대지 한 장을 만들고 unit_file 이 빈 대지를 홈·클론 코스가 견디는지 확인 {#zero-unit}
- [x] components/home/SheetIndex.tsx — 맨 앞 칩, 끝나면 완료 도장으로 남는다 {#zero-chip}
- [x] 대지 머리에 common/* 도입 문단 3편을 렌더 (새 산문 0편) {#zero-intro}
- [x] i18n ko/en 새 키 ~12 — 행 길이 35~45자 · keep-all · josa {#zero-i18n}

## P2 · 합성 예제 (D137) {#p2}
- [x] packages/cards/src/t0-synthetic.ts — makeSyntheticCard(conceptId, previewSiteId), previewSiteId 는 필수 인자 {#syn-card}
- [x] 재료는 사전 examples[].code + expect.picks (ts 28/28, LLM 0회) {#syn-material}
- [x] PrereqRung.tsx — none==='synthetic' 을 「판 없음」 알약 대신 예고 한 줄로 {#syn-rung}
- [x] 합성 판을 맞히면 그 previewSite 카드가 그날 큐에 role='gap' 으로 들어간다 {#syn-queue}
- [x] 품질 게이트에 수치 추가 — site_id IS NULL 인 카드 중 previewSiteId 없는 것 = 0 {#syn-gate}

## P3 · 먼저 읽기와 경계 문구 (D138 · D139) {#p3}
- [x] 0장 8판에 한해 사전 1층(one_liner)을 문제 위에 편다 {#read-first-plate}
- [x] 사전 린트 — 0장 대상 개념의 one_liner 에 그 개념 point 정답 토큰이 있으면 실패 {#read-first-lint}
- [x] 누설되는 사전 8편을 고쳐 쓴다 (const-declaration 등) {#read-first-dict}
- [x] 첫 실행 문단 아래 경계 한 줄 — 묻지 않고 잠그지 않는다 {#scope-empty}
- [x] README 「누구를 위한 것인가」 한 줄 (영어) {#scope-readme}

## P4 · 구조 출제 (요청 1) — 0장 뒤 {#p4}
- [>] T2 회전 수리 — queue.sql LIMIT 1 과 은퇴 없음, forUnit·generateT2 가 첫 성공에서 멈추는 것 {#t2-rotate}
- [>] plan.ts DROP_ORDER — 새 T2 를 T1 보다 먼저 버리지 않는다 {#t2-budget}
- [>] 사전 저작 부채를 dict:lint 게이트로 (D132 식 래칫) — @hole 2/29 · why_gate 0/29 · @pick<3 이 11/29 {#dict-gate}
- [>] 코드 창을 감싸는 블록 접기로 (block 테이블 + file_read_block), LINES_WINDOW=2 은퇴 {#code-window}
- [>] dictionary/arch 확충 — 지금 문법 30 : 구조 4 {#arch-dict}

## P5 · 자동완성 (요청 2) — 0장 뒤 {#p5}
- [>] 먼저 버그 — T1Plate.tsx:297 · CoursePlateView.tsx:41 이 Monaco 에 없는 언어 id 'tsx' 를 넘긴다 {#ac-tsx-bug}
- [>] 실측 선행 — IME × 자동 닫기 (WKWebView, 미측정) {#ac-ime}
- [>] L0b 자동 닫기 · L1 단어 기반 제안. L3 언어 서비스는 폐기(ts.worker 1.29MB > 예산 1.2MB) {#ac-layers}
- [>] 키 규칙 셋 — 캡처 Esc · addCommand(Tab) 문맥 인자 · acceptSuggestionOnEnter {#ac-keys}
- [>] 설정으로 열기 (사용자 결정) — 기본값은 권고안, 이의 patternKey 가 설정 상태를 같이 기록 {#ac-settings}
- [>] AssistCount{keyed, assisted, pasted, accepted} 를 peeks 와 같은 규칙으로 (감점 없음) {#ac-assist}

## P6 · LLM 저작 시점 (요청 3) {#p6}
- [>] 등록부 행 — LLM 은 저작 시점에만, 런타임 생성·채점 경로는 열지 않는다. D106 유지 {#llm-decision}
- [>] docs/03 §5.2 「허용」을 「권장」으로, PR 템플릿에 「LLM 초안 여부」 체크 {#llm-contributing}

<!-- oculpm:plan-log begin v1 -->
| 시각 | 항목 | 에이전트 | 변화 | 일지 | 메모 |
|---|---|---|---|---|---|
| 2026-09-04T14:12:26+09:00 | #d136-zero-chapter | claude-code | ☐→x | 20260904/Features_to_add/1412_feature_zero-chapter-selection-and-decisions.md | 00 §4.2.1 행 + 머리말. 정본 §4 한 문장은 §4.3 경유 — 사용자 확인 대기 |
| 2026-09-04T14:12:29+09:00 | #d137-synthetic-preview | claude-code | ☐→x | 20260904/Features_to_add/1412_feature_zero-chapter-selection-and-decisions.md | 00 §4.2.1 행 — previewSiteId 필수 인자, 예고는 그날의 큐로 |
| 2026-09-04T14:12:32+09:00 | #d138-read-first | claude-code | ☐→x | 20260904/Features_to_add/1412_feature_zero-chapter-selection-and-decisions.md | 00 §4.2.1 행 — 0장 8판 한정 + 누설 린트 |
| 2026-09-04T14:12:34+09:00 | #d139-scope-notice | claude-code | ☐→x | 20260904/Features_to_add/1412_feature_zero-chapter-selection-and-decisions.md | 00 §4.2.1 행 — 첫 실행·README, 묻지 않고 잠그지 않는다 |
| 2026-09-04T14:12:42+09:00 | #zero-select-pick | claude-code | ☐→x | 20260904/Features_to_add/1412_feature_zero-chapter-selection-and-decisions.md | zeroChapterPlates — 내 코드 사용처가 합성보다 먼저, 사용처 0 개념은 제외 |
| 2026-09-04T14:12:45+09:00 | #zero-select-done | claude-code | ☐→x | 20260904/Features_to_add/1412_feature_zero-chapter-selection-and-decisions.md | isDone 셋 + rootCleared 는 NEWCOMER_* 재사용 (새 임계 0) |
| 2026-09-04T14:12:47+09:00 | #zero-select-test | claude-code | ☐→x | 20260904/Features_to_add/1412_feature_zero-chapter-selection-and-decisions.md | 20개 통과 — 상한 8·끝 조건 셋·「묻지 않는다」(인자 수) |
| 2026-09-04T14:27:41+09:00 | #zero-unit | claude-code | ☐→x | 20260904/Features_to_add/1427_feature_zero-chapter-sheet-on-home.md | unit_manual_upsert + unit_delete_missing 에 source<>'manual'. 재인제스트 생존 테스트 있음 |
| 2026-09-04T14:27:43+09:00 | #zero-chip | claude-code | ☐→x | 20260904/Features_to_add/1427_feature_zero-chapter-sheet-on-home.md | .sx-zero + sheetNo()/nextSheetNo() — 0장이 판번호를 먹던 것을 고쳤다 |
| 2026-09-04T14:27:46+09:00 | #zero-intro | claude-code | ☐→x | 20260904/Features_to_add/1427_feature_zero-chapter-sheet-on-home.md | .sheet-lead — 장수와 끝을 먼저 말한다. common/* 산문 렌더는 P2 로 미룸 |
| 2026-09-04T14:27:49+09:00 | #zero-i18n | claude-code | ☐→x | 20260904/Features_to_add/1427_feature_zero-chapter-sheet-on-home.md | ko/en 5키. zeroPreview* 둘은 쓰는 자리(P2)와 함께 들어온다 |
| 2026-09-04T14:45:55+09:00 | #syn-card | claude-code | ☐→x | 20260904/Features_to_add/1445_feature_synthetic-example-plates-with-preview.md | t0-synthetic.ts — previewSiteId 필수 인자, 타입이 E-4 를 강제 |
| 2026-09-04T14:45:58+09:00 | #syn-material | claude-code | ☐→x | 20260904/Features_to_add/1445_feature_synthetic-example-plates-with-preview.md | examples[].code + picks. 유형 고정은 실측이 뒤집었다 — prefer() 사슬을 탄다 |
| 2026-09-04T14:46:01+09:00 | #syn-rung | claude-code | ☐→x | 20260904/Features_to_add/1445_feature_synthetic-example-plates-with-preview.md | preview 상태 신설 + 예고 한 줄. buildPrereq 의 뒤집힌 방향도 바로잡았다 |
| 2026-09-04T14:46:03+09:00 | #syn-queue | claude-code | ☐→x | 20260904/Features_to_add/1445_feature_synthetic-example-plates-with-preview.md | 맞히면 makePlateFor 로 role='gap' 삽입. 실제 세션 확인은 남았다 |
| 2026-09-04T14:46:06+09:00 | #syn-gate | claude-code | ☐→x | 20260904/Features_to_add/1445_feature_synthetic-example-plates-with-preview.md | quality.test.ts 여섯째 수치 — 원장을 직접 센다. 지금은 0/0 회귀 방벽 |
| 2026-09-04T14:55:07+09:00 | #t2-rotate | claude-code | ☐→> |  | → chickadee-v04-structure-editor-llm #b-next-card·#b-for-unit·#b-four-kinds 로 상세화 |
| 2026-09-04T14:55:10+09:00 | #t2-budget | claude-code | ☐→> |  | → chickadee-v04-structure-editor-llm #a-drop-order |
| 2026-09-04T14:55:13+09:00 | #dict-gate | claude-code | ☐→> |  | → chickadee-v04-structure-editor-llm #g-d145·#g-lint |
| 2026-09-04T14:55:16+09:00 | #code-window | claude-code | ☐→> |  | → chickadee-v04-structure-editor-llm 단계 D (사용자 확인 뒤) |
| 2026-09-04T14:55:18+09:00 | #arch-dict | claude-code | ☐→> |  | → chickadee-v04-structure-editor-llm 단계 E (정본 §2 갱신 필요) |
| 2026-09-04T14:55:22+09:00 | #ac-tsx-bug | claude-code | ☐→> |  | → chickadee-v04-structure-editor-llm #a-tsx-bug |
| 2026-09-04T14:55:24+09:00 | #ac-ime | claude-code | ☐→> |  | → chickadee-v04-structure-editor-llm #f-ime |
| 2026-09-04T14:55:33+09:00 | #ac-layers | claude-code | ☐→> |  | → chickadee-v04-structure-editor-llm #f-l0b·#f-l1·#f-l3-no |
| 2026-09-04T14:55:36+09:00 | #ac-keys | claude-code | ☐→> |  | → chickadee-v04-structure-editor-llm #f-keys (Esc·Tab·Enter 셋) |
| 2026-09-04T14:55:38+09:00 | #ac-settings | claude-code | ☐→> |  | → chickadee-v04-structure-editor-llm #f-settings |
| 2026-09-04T14:55:40+09:00 | #ac-assist | claude-code | ☐→> |  | → chickadee-v04-structure-editor-llm #f-assist |
| 2026-09-04T14:55:43+09:00 | #llm-decision | claude-code | ☐→> |  | → chickadee-v04-structure-editor-llm #g-d144 |
| 2026-09-04T14:55:45+09:00 | #llm-contributing | claude-code | ☐→> |  | → chickadee-v04-structure-editor-llm #g-contributing |
| 2026-09-04T15:09:24+09:00 | #read-first-plate | claude-code | ☐→x | 20260904/Features_to_add/1509_feature_read-first-and-scope-notice.md | data/read-first.ts — 0장 개념 + 사전 1층 + 누설 없음 셋이 다 참일 때만 |
| 2026-09-04T15:09:27+09:00 | #read-first-dict | claude-code | ☐→x | 20260904/Features_to_add/1509_feature_read-first-and-scope-notice.md | 여덟 중 실제 누설은 const-declaration 하나뿐 — 기호 정답은 오탐이었다 |
| 2026-09-04T15:09:30+09:00 | #read-first-lint | claude-code | ☐→> |  | 같은 파일(lint.ts)을 둘이 고치지 않으려고 병렬 세션 G 로 넘겼다 → v04-structure-editor-llm |
| 2026-09-04T15:09:32+09:00 | #scope-empty | claude-code | ☐→x | 20260904/Features_to_add/1509_feature_read-first-and-scope-notice.md | firstRun.scope — 묻지 않고 잠그지 않는다. 스위치가 하나뿐인 것을 테스트가 지킨다 |
| 2026-09-04T15:09:35+09:00 | #scope-readme | claude-code | ☐→x | 20260904/Features_to_add/1509_feature_read-first-and-scope-notice.md | README 「Who it is not for」 — 영어, CS50 링크 |
| 2026-09-04T15:48:27+09:00 | #read-first-lint | claude-code | >→x | 20260904/Chores/1548_chore_v04-integrate-three-parallel-sessions.md | 병렬 세션 G 가 구현. 부모가 revealsToken 을 내보내 화면과 규칙을 하나로 합쳤다 |
<!-- oculpm:plan-log end -->
