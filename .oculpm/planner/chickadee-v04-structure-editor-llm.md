---
oculpm_plan: v1
id: chickadee-v04-structure-editor-llm
title: "0.4 남은 셋 — 구조 출제 · 클론 자동완성 · LLM 저작 시점"
status: active
created: 2026-09-04
updated: 2026-09-04
owner: claude-code
---

병렬 세션 넷(일지 20260904/Chores/1402)의 결론을 실행 순서로 옮긴 것. 0장(요청 4)은 chickadee-v04-four-requests 가 맡는다. 사용자 결정 넷은 확정 — AI 는 저작 시점만 · 코드 창은 감싸는 블록 접기 · 자동완성은 설정으로 열되 기본값은 권고안 · 0장부터. 등록부는 D140 부터(D136~D139 는 0장이 썼다). 순서의 원칙: 「지금 아예 안 보이는 것」을 먼저 보이게 하고, 값싼 버그를 그 앞에 끼운다.

## A · 먼저 다는 값싼 것 셋 (반나절 안쪽 — 합쳐서 하루치) {#a}
- [x] T1Plate.tsx:297 · CoursePlateView.tsx:41 의 언어 id 'tsx' → 'typescript' — React 파일 필사의 2·3단계 구문 색이 지금 전부 죽어 있다 (Monaco 0.52 에 'tsx' id 가 없다) {#a-tsx-bug}
- [x] 05 §8 의 basic-languages 목록을 코드에 맞춘다 — 문서는 swift·dart 를 적었고 코드는 go 를 싫는다 (Swift·Dart 는 m1-03 으로 보류 중) {#a-doc-langs}
- [x] plan.ts DROP_ORDER 를 ['new:t0','new:t1','new:t2'] 로 — 만기 20건인 날 새 T2 가 새 T1 보다 먼저 잘리는 근거 없는 순서를 바로잡는다 (02 §5.3 5번은 순서만 적었다) {#a-drop-order}
- [x] 예산 산수 회귀 테스트 — 만기 20건에서 새 T2 가 남는다 {#a-drop-test}

## B · T2 회전 수리 (요청 1 · 단독으로 수익이 가장 크다) {#b}
- [x] D140 — T2 를 회전시키고 예산에서 마지막에 뻐다 (등록부 행이 먼저) {#b-d140}
- [x] queue.next_track_card 를 「최근 N일 안에 안 찍은 카드」로 좁힌다 — 지금은 LIMIT 1 이고 은퇴 경로가 없어 카드가 한 행이라도 있으면 늘 그 행을 준다 {#b-next-card}
- [x] 비면 forUnit 이 아직 카드가 없는 대지·아직 안 만든 종을 한 장 더 굽게 한다 — 세션당 한 장씩 게으르게, 일괄 생성 금지(20대지×60커밋 = 1,200 쿼리) {#b-for-unit}
- [x] generateT2(req, kind) 로 대지 하나에서 네 종까지 — 생성기는 이미 kind 를 받는다(t2.ts:56). D107 「네 종을 다 굽는다」가 처음 실현된다 {#b-four-kinds}
- [x] 회전 테스트 — 대지 N·종 4 에서 같은 판이 반복되지 않고, 판 수가 1 → 최대 4×대지 가 된다 {#b-rotate-test}
- [x] 게으른 굽기의 세션 지연 실측 — loadCommits 가 후보 커밋마다 t2.commit_files 를 부른다 {#b-perf}

## C · 사용자 확인 (멈춤표 — 여기서 보여 주고 다음을 정한다) {#c}
- [ ] A·B 를 올리고 앱을 띄워 구조 판이 매번 다른 문제가 되는지 눈으로 본다 — 「너무 언어 중심적」이 얼마나 줄었는지가 D·E 의 규모를 정한다 {#c-show}
- [ ] 물을 것 — 하루 15분에서 구조에 몇 분을 줄 것인가. 매일 한 장으로 가려면 복습 상한 20→14 라 「부채를 미루지 않는다」를 깨는 사용자 결정이다 {#c-q-budget}
- [ ] 물을 것 — 코드 창 상한(40줄 다 보이기 vs 20줄에서 접기)과, 창이 바뀌면 해시가 전부 달라지는 기존 T0 카드를 은퇴시킬지 {#c-q-window}

## D · 코드 창을 감싸는 블록으로 (요청 1 — 사용자 결정됨) {#d}
- [x] D141 — LINES_WINDOW=2 은퇴, 창은 감싸는 블록. 목업 네 장은 5·5·6·3줄로 제각각이고 공통점은 줄 수가 아니라 함수 전체였다 {#d-d141}
- [x] block 테이블 + file_read_block 으로 초점을 감싸는 최소 의미 단위를 창으로 — 재료는 이미 있다 {#d-block}
- [x] 상한과 접기 — C 단계의 사용자 답을 그대로 구현한다 {#d-fold}
- [x] 골든 재굽기와 카드 은퇴 — 창이 바뀌면 content_hash 가 전량 달라진다. 마이그레이션 동반 {#d-golden}
- [x] 판 높이·읽는 시간·15분 예산 영향 재측 — estMinFor 가 여전히 맞는가 {#d-layout}

## E · 리포 지도와 새 문제 둘 (요청 1 — 「이 프로젝트는 이런 구조구나」의 정면) {#e}
- [x] D142 — 리포 지도 + arch/entry·arch/role. 04 §7.4 「범위 = 유닛 + 1-hop」에 repo 를 더하고 정본 §2 의 T2 4종 표를 늘린다 — 00 §4.3 경유 · 사용자 확인 필요 {#e-d142}
- [x] buildGraph 에 scope:'repo' — 파일 대신 unit·폴더를 노드로 접고 import_edge 를 폴더 쌍으로 집계. 노드 ≤ 24 상한은 지키고 DependencyMap 은 안 건드린다 {#e-scope-repo}
- [x] arch/entry — 「밖에서 처음 들어오는 문」. 정답지는 ENTRY_NAME 정규식 ∪ in-degree 0 · out-degree>0. 함정은 in-degree 최고 공용 폴더 {#e-entry}
- [x] arch/role — 「이 폴더는 왜 있나」 4지. 정답은 밴드 라벨, 근거는 in/out 방향 집계. 패턴으로 밴드가 정해진 폴더에서만 낸다(추정 밴드는 제외) {#e-role}
- [x] dictionary/arch/{entry,role}.yaml 2장 — ko 정본 + en 병기. 지금 사전은 문법 30 : 구조 4 다 {#e-dict}
- [x] 대지가 「기타」 하나뿐인 리포(MIN_FILES_FOR_UNIT 미달)에서는 이 종을 내지 않는다 {#e-guard}

## F · 자동완성 (요청 2 — 설정으로 열되 기본값은 권고안) {#f}
- [x] 실측 선행 — IME × 자동 닫기 (WKWebView, 미측정, B안 최대 위험). " 뒤 한글 조합에서 캤랿이 튀는가 {#f-ime}
- [x] D143 — 자동완성을 다섯 층으로 가르고 규칙 한 줄로 페이딩을 정한다. 설정 노출은 권고안과 다른 사용자 결정이므로 그 비용(같은 85가 사람마다 다른 것을 재게 된다)을 행에 명시 {#f-d143}
- [x] 키 규칙 셋이 선행이다 — 이것 없이 제안을 켜면 오작동한다 {#f-keys}
  - [x] Esc — SessionOverlay.tsx:99 의 캐처 단계가 제안 위젯을 앞지른다. 정본 §3-4 사다리 앞에 「위젯만 닫기」 한 단을 늘린다 {#f-key-esc}
  - [x] Tab — addCommand 의 세째 인자에 '!suggestWidgetVisible'. 지금은 문맥 인자가 없어 제안을 절대 수락할 수 없다 {#f-key-tab}
  - [x] Enter — acceptSuggestionOnEnter:'off' · acceptSuggestionOnCommitCharacter:false. 기본값이 줄바꿈을 조용히 삼킨다 {#f-key-enter}
- [x] L0b 자동 닫기·surround — 1·2단계 켬 / 3단계·코스-3 끔. 닫힘만 있는 줄이 TS 비공백 줄의 12.5%(Rust 15.9)라 3단계에서만 공짜 점수다 {#f-l0b}
- [x] L1 단어 기반 제안 — wordBasedSuggestions:'currentDocument' · quickSuggestions 에서 comments·strings 는 false(한국어 주석이 정본이다). 2·3단계·코스 전부 켬 {#f-l1}
- [x] AssistCount{keyed, assisted, pasted, accepted} 를 peeks 와 같은 자리·같은 규칙으로 — 감점 없음, 기록 + 스케줄러 신호. pct 계산은 불변 {#f-assist}
- [x] 설정 노출(사용자 결정) — 기본값은 권고안, 이의 patternKey 가 설정 상태를 같이 기록해야 서로 다른 조건의 판정이 한 통에 안 섮인다 {#f-settings}
- [x] L3 언어 서비스는 십지 않는다 — ts.worker 1.29MB gzip 이 Monaco 청크 예산 1.2MB 를 홌로 넘고, 떼어낸 12~40줄 블록에 tsconfig 가 없어 무동작이며, TS 전용이라 정본 §2 위에 못 고치는 불균형을 얹는다 {#f-l3-no}
- [!] 실측 마무리 — t1:monaco 재측정(예산 350ms, 지금 292~303) · 타이핑 중 frame_p95 · AssistCount 정확도 · golden-t1 의 pct 불변 {#f-measure}
- [ ] 물을 것 — 3단계 백지에서 ⌘V 로 원본을 통째 붙여도 지금 아무 데도 안 남는다. 기록만 / 3단계 4겹만 차단 / 아예 차단 중 무엇인가 {#f-q-paste}

## G · LLM 은 저작 시점에만 (요청 3 — 사용자 결정됨) {#g}
- [x] D144 — LLM 은 저작 시점에만 쓴다. 런타임 생성·채점 경로는 열지 않고 D106(전송 없음)을 유지한다. 정본 수정 없음 {#g-d144}
- [x] docs/03 §5.2 의 「허용」을 「권장」으로 · PR 템플릿에 「LLM 초안 여부」 체크 · CONTRIBUTING 에 검증기 목록 {#g-contributing}
- [x] D145 — 사전 저작 부채를 dict:lint 게이트로 (D132 식 래칫: 오늘 실측을 임계로, 목표를 나란히 적고 표를 매번 찍는다) {#g-d145}
- [x] dict:lint 에 검사 셋 — essential 은 @hole+blank: 를 갖거나 사유를 적는다 · point: 가 있으면 .scm 이 @pick.N 을 3개 이상 낸다 · essential 은 why_gate: 를 갖는다 {#g-lint}
- [x] 사전 채우기 — 진짜 수익은 여기다. ts essential 22개 실측: meaning 22 · point 19 · blank 2 · why_gate 0, 뿌리 개념 셋은 point 가 0개다 {#g-fill}
- [x] quality.test.ts 의 KIND_SHARE_RATCHET 0.996 을 내린다 — 사전이 채워지면 의미형 99.5% 쒠림이 저절로 내려간다 {#g-ratchet}

<!-- oculpm:plan-log begin v1 -->
| 시각 | 항목 | 에이전트 | 변화 | 일지 | 메모 |
|---|---|---|---|---|---|
| 2026-09-04T15:14:47+09:00 | #g-d144 | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1514_feature_dict-authoring-debt-gate-d144-d145.md | docs/03 §5.2 에 경계를 박고 안티패턴 네 행의 실제 위치를 표로. 등록부 행 초안은 부모에게 넘김 |
| 2026-09-04T15:14:55+09:00 | #g-contributing | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1514_feature_dict-authoring-debt-gate-d144-d145.md | 허용→권장 · PR 템플릿 Dictionary 절 · CONTRIBUTING 검증기 넷과 사람이 보는 둘 (영어) |
| 2026-09-04T15:15:03+09:00 | #g-d145 | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1514_feature_dict-authoring-debt-gate-d144-d145.md | authoringDebt + DEBT_RATCHET. 다 채운 규칙은 래칫을 대상 전량으로 올려 잠그도록 강제 |
| 2026-09-04T15:15:11+09:00 | #g-lint | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1514_feature_dict-authoring-debt-gate-d144-d145.md | 검사 셋 + 0장 누설 넷째 (D138). no_hole_reason 스키마 추가, 낡은 사유는 하드 실패 |
| 2026-09-04T15:15:25+09:00 | #g-ratchet | claude-code | ☐→! | .oculpm/journal/20260904/Features_to_add/1514_feature_dict-authoring-debt-gate-d144-d145.md | g-fill 이 먼저다 — 사전이 안 채워져 0.996 을 못 내린다. 표에 최대 유형·래칫·목표·남은 19.5% 를 찍고 부채 표와 이어 읽히게만 해 뒀다 |
| 2026-09-04T15:16:26+09:00 | #a-drop-order | claude-code | ☐→x | 20260904/Bugs/1516_bug_t2-rotation-and-budget-order.md | DROP_ORDER new:t0 → new:t1 → new:t2 |
| 2026-09-04T15:16:34+09:00 | #a-drop-test | claude-code | ☐→x | 20260904/Bugs/1516_bug_t2-rotation-and-budget-order.md | plan.test.ts 「만기 20건인 날에도 새 T2 가 남는다」 — plannedMin 14 |
| 2026-09-04T15:16:42+09:00 | #b-next-card | claude-code | ☐→x | 20260904/Bugs/1516_bug_t2-rotation-and-budget-order.md | printedBefore 파라미터 · REPRINT_GAP_DAYS t1=0 t2=7 |
| 2026-09-04T15:16:51+09:00 | #b-for-unit | claude-code | ☐→! | 20260904/Bugs/1516_bug_t2-rotation-and-budget-order.md | bakeNextT2 완성·테스트됨. cards.ts:90 forUnit 3줄 배선만 남음 (그 파일은 0장 세션 소유) |
| 2026-09-04T15:17:02+09:00 | #b-four-kinds | claude-code | ☐→x | 20260904/Bugs/1516_bug_t2-rotation-and-budget-order.md | T2_ORDER 가 바깥 고리 · 종당 대지 한 바퀴. 대지 3에서 네 종 다 나옴 |
| 2026-09-04T15:17:09+09:00 | #b-rotate-test | claude-code | ☐→x | 20260904/Bugs/1516_bug_t2-rotation-and-budget-order.md | t2.test.ts 「T2 회전 (D140 · 대지 3 × 종 4)」 8건 — 12판 전부 다름 |
| 2026-09-04T15:17:19+09:00 | #b-perf | claude-code | ☐→x | 20260904/Bugs/1516_bug_t2-rotation-and-budget-order.md | 책임 배치 4.2~8.4ms·쿼리 69 / 그래프 3종 0.5~6.5ms·쿼리 7 (커밋 조회 건너뛰기) |
| 2026-09-04T15:21:39+09:00 | #b-for-unit | claude-code | !→x | 20260904/Bugs/1516_bug_t2-rotation-and-budget-order.md | 부모가 배선 — data/cards.ts forUnit 이 home.units 훑기 대신 bakeNextT2 를 부른다 |
| 2026-09-04T15:21:42+09:00 | #b-d140 | claude-code | ☐→x | 20260904/Bugs/1516_bug_t2-rotation-and-budget-order.md | 부모가 00 §4.2.1 에 D140 행을 붙였다 |
| 2026-09-04T15:35:57+09:00 | #a-tsx-bug | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1535_feature_t1-editor-assist-layers.md | 두 화면 모두 'typescript' 로. 회귀 셋 — 확장자 14종이 MONACO_LANGUAGES 안, React 파일 검증, 목록과 ClonePad import 대조 |
| 2026-09-04T15:36:06+09:00 | #a-doc-langs | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1535_feature_t1-editor-assist-layers.md | 05 §8 목록을 typescript·javascript·python·go·rust·sql 로. 시험이 코드와 대조한다 |
| 2026-09-04T15:36:18+09:00 | #f-ime | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1535_feature_t1-editor-assist-layers.md | 안 깨진다 — 캐럿 이동 px 가 대조군과 동일, compositionend 1회. 진짜 macOS IME 는 못 쟀다 |
| 2026-09-04T15:36:26+09:00 | #f-key-esc | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1535_feature_t1-editor-assist-layers.md | 캡처 리스너가 .suggest-widget.visible 이면 지나간다. 정본 §3-4 개정은 부모 몫 |
| 2026-09-04T15:36:34+09:00 | #f-key-tab | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1535_feature_t1-editor-assist-layers.md | addCommand 세 번째 인자 '!suggestWidgetVisible'. WebKit 하네스에서 수락 확인 |
| 2026-09-04T15:36:43+09:00 | #f-key-enter | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1535_feature_t1-editor-assist-layers.md | FIXED_OPTIONS 에 못 박았다 — 층 판정과 무관하게 언제나 off. 위젯 열린 채 Enter 가 줄바꿈인 것 확인 |
| 2026-09-04T15:36:52+09:00 | #f-l0b | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1535_feature_t1-editor-assist-layers.md | Monaco 는 'languageDefined'/'never'. PlainPad(1단계)에도 넣었다 — 짝 다섯 + autoCloseBefore 조건, surround 는 없다 |
| 2026-09-04T15:37:01+09:00 | #f-l1 | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1535_feature_t1-editor-assist-layers.md | 'currentDocument' · comments/strings false. 1단계는 textarea 라 위젯 없음(D93) — 비대칭 유지 |
| 2026-09-04T15:37:12+09:00 | #f-l3-no | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1535_feature_t1-editor-assist-layers.md | 안 실었다. 근거(1,286,340 B gzip · 떼어낸 블록 무동작 · TS 전용)를 ClonePad import 머리 주석과 05 §8 에 숫자로 남겼다 |
| 2026-09-04T15:37:21+09:00 | #f-assist | claude-code | ☐→~ | .oculpm/journal/20260904/Features_to_add/1535_feature_t1-editor-assist-layers.md | 타입·계산·화면 끝. pct 불변 확인(golden 31건 무수정). 남은 것 — schemas.ts 의 zod 와 data/session.ts 배선(부모 몫, diff 초안 있음) |
| 2026-09-04T15:37:30+09:00 | #f-settings | claude-code | ☐→~ | .oculpm/journal/20260904/Features_to_add/1535_feature_t1-editor-assist-layers.md | 스위치 stage/off + 무엇을 잃는지 적는 문구까지 끝. patternKey 배선은 남았다 — t1-appeal.ts·session-flow.ts 가 이 세션 소유 밖이고 T1_ENGINE_VERSION 을 올려야 하는 변경이다 |
| 2026-09-04T15:38:22+09:00 | #f-measure | claude-code | ☐→~ | .oculpm/journal/20260904/Features_to_add/1535_feature_t1-editor-assist-layers.md | frame_p95 18.0(대조군도 18.0) · 첫 제안 116/126ms(그중 100 은 Monaco 표시 지연) · AssistCount 정확도 시험 15건 · golden pct 불변. t1:monaco 재측정만 남았다 — 릴리스 WKWebView 빌드 필요 |
| 2026-09-04T15:48:24+09:00 | #f-settings | claude-code | ~→x | 20260904/Chores/1548_chore_v04-integrate-three-parallel-sessions.md | 부모가 patternKey 배선 마무리 + T1_ENGINE_VERSION 1→2 + 04 §5 한 줄 |
| 2026-09-04T15:52:25+09:00 | #f-d143 | claude-code | ☐→x | 20260904/Chores/1548_chore_v04-integrate-three-parallel-sessions.md | 부모가 00 §4.2.1 에 D143 행을 붙였다 |
| 2026-09-04T15:52:29+09:00 | #f-assist | claude-code | ~→x | 20260904/Chores/1548_chore_v04-integrate-three-parallel-sessions.md | zod·session-flow·SessionScreen 배선까지 끝. golden-t1 무수정 통과로 pct 불변 확인 |
| 2026-09-04T15:52:31+09:00 | #f-measure | claude-code | ~→! |  | 넷 중 셋 잼(frame_p95 18.0 대조군 동일 · 첫 제안 116/126ms · golden pct 불변). t1:monaco 만 릴리스 빌드가 있어야 잰다 |
| 2026-09-04T16:17:48+09:00 | #d-block | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1617_feature_t0-code-window-enclosing-block.md | windowOf = block ∪ 초점 ±2, 폴백 ±2. block.by_file 재사용 — 새 statement 0장 |
| 2026-09-04T16:17:57+09:00 | #d-fold | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1617_feature_t0-code-window-enclosing-block.md | CodePlate 20줄 상한·위아래 균형·키보드 펼치기. 창 상한 40줄 |
| 2026-09-04T16:18:07+09:00 | #d-golden | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1617_feature_t0-code-window-enclosing-block.md | 골든 재굽기 + 마이그레이션 0004(은퇴·d141: 접두어). catalog:build 는 부모 몫 |
| 2026-09-04T16:18:18+09:00 | #d-layout | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1617_feature_t0-code-window-enclosing-block.md | 재측만 하고 안 고침(scheduler 는 남의 소유) — t0_review 0.5→0.6 권고, 20건 날 new:t1 까지 잘림 |
| 2026-09-04T16:18:27+09:00 | #d-d141 | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1617_feature_t0-code-window-enclosing-block.md | D141 행·04 §1 문안 초안은 보고서 §7 — docs 반영은 부모가 |
| 2026-09-04T16:28:28+09:00 | #e-scope-repo | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1628_feature_t2-repo-map-entry-role.md | 파일 69 → 노드 6 (projectox-like). assignUnits 재사용 · DependencyMap 무수정 · 24 상한 유지 |
| 2026-09-04T16:28:47+09:00 | #e-entry | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1628_feature_t2-repo-map-entry-role.md | 정답지를 in-degree 0 위로 좁혔다 — 폴더 단위에서 index.ts 합집합은 거의 전부다. 채점은 gradePicks 그대로 |
| 2026-09-04T16:28:58+09:00 | #e-role | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1628_feature_t2-repo-map-entry-role.md | 게이트 셋(패턴이 이름으로 아는 폴더 · 패턴 = 지도가 앉힌 층 · 파일 2장 이상). 물어볼 폴더는 지도에서 뺀다 |
| 2026-09-04T16:29:08+09:00 | #e-dict | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1628_feature_t2-repo-map-entry-role.md | arch 사전 4 → 6. ko 정본 + en 병기, dict:lint 스키마·린트 통과 · 부채 표에 새 빚 0 |
| 2026-09-04T16:29:18+09:00 | #e-guard | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1628_feature_t2-repo-map-entry-role.md | repoMapStands() + MIN_REPO_NODES 6. t2Todo 도 대지 목록에서 같은 판단을 한다 — 테스트 셋으로 못박음 |
| 2026-09-04T16:37:18+09:00 | #g-fill | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1637_feature_dict-debt-paid-and-ratcheted.md | blank/사유 23/23 · why_gate 23/23 · 누설 6/6 · picks 25/26(call-expression 남음) |
| 2026-09-04T16:37:26+09:00 | #g-ratchet | claude-code | !→x | .oculpm/journal/20260904/Features_to_add/1637_feature_dict-debt-paid-and-ratcheted.md | DEBT_RATCHET 23/25/23/6 · KIND_SHARE_RATCHET 0.996 → 0.765 (실측 76.4%, 목표 80% 통과) |
| 2026-09-04T17:12:28+09:00 | #e-d142 | claude-code | ☐→~ | .oculpm/journal/20260904/Features_to_add/1712_feature_t2-repo-map-grading-and-plate.md | 채점·문구·화면 배선 완료 — 두 종이 실제로 풀린다. 남은 것은 00 §4.3 등록부 행과 정본 §2 표(부모) |
| 2026-09-04T18:23:26+09:00 | #e-d142 | claude-code | ~→x |  | 글리프가 낡아 있었다 — 코드(T2_ORDER 6종·REPO_TARGETS)와 정본 결론 §2 표 둘 다 이미 여섯 종으로 반영됨. 확인만 하고 표시 갱신 |
<!-- oculpm:plan-log end -->
