---
oculpm_plan: v1
id: chickadee-v05-first-time-programmers
title: "0.5 프로그래밍 초보를 대상에 — D147 의 나머지"
status: done
created: 2026-09-04
updated: 2026-09-04
owner: claude-code
---

정본 §1·§4·§9 와 등록부 D147 은 올라갔고 0장 상한(8→24)·깊이(1→2)·`declaredNewcomer` 도 들어갔다. 남은 것은 **앱이 아직 정본과 다른 말을 한다**는 것과 **바닥 개념 사전이 통째로 없다**는 것 둘이다. 순서의 원칙: 거짓말부터 멈추고(A), 그 다음 진짜 재료를 깐다(B).

## A · 앱이 정본과 같은 말을 하게 (지금 어긋나 있다) {#a}
- [x] firstRun.scope 교체 — 지금 첫 화면이 「'변수'·'함수' 자체가 처음이라면 아직 교재가 없는 셈입니다」라고 말한다. 정본이 뒤집힌 뒤로 이건 거짓이다 (ko 정본 + en 병기) {#a-scope-copy}
- [x] home.newcomerBody 교체 — 두 세션 내리 막힌 뒤 뜨는 문구도 같은 말을 한다. 「밖으로 가라」에서 「0장이 여기 있다」로 {#a-newcomer-copy}
- [x] 첫 실행에 「프로그래밍이 처음인가요?」 예/아니오 한 문항 (empty.tsx) — 묻되 잠그지 않는다. 배치고사가 아니라는 것이 문안에서 읽혀야 한다 {#a-ask}
- [x] 설정 「학습」에 같은 스위치와 저장 — 답은 언제든 바뀌고 다음 판정부터 적용된다 {#a-settings}
- [x] zeroChapterDone 을 앱에 배선하고 declaredNewcomer 를 넘긴다 — 지금 이 함수는 export 만 되어 있고 호출자가 없다 {#a-wire}

## B · 바닥 개념 사전 (덩어리는 여기다) {#b}
- [x] 개념 목록과 선행 순서를 먼저 확정 — 우리 입자는 Exercism 보다 잘다(그쪽 conditionals 하나가 우리로는 셋). 쪼개는 규칙을 정하고 표로 남긴다 {#b-list}
- [x] common/ 에 보편 개념 — 조건 분기 · 반복 · 함수 정의 · 값 돌려주기 · 참·거짓 · 비교 · 재대입. universal 축이라 다음 언어가 절반을 물려받는다 {#b-common}
- [x] ts/ 에 언어 개념 + .scm (@site·@pick.N·@hole) — if_statement·function_declaration·return_statement·binary_expression·let {#b-ts}
- [x] ts/_lang.yaml essential 갱신 — 새 개념이 prereq 로 깊이 2 안에 들어오는지, 0장 24판이 실제로 차는지 확인 {#b-lang}
- [x] dict:lint 통과 + 래칫 올려 잠금 — 새 개념마다 blank+@hole · why_gate · @pick.N 3개 · one_liner 누설 없음 넷을 다 채운다 {#b-lint}
- [x] 골든 픽스처 양성/음성 — 새 .scm 이 매칭하는 자리와 안 하는 자리를 못박는다 {#b-golden}

## C · 눈으로 보고 재기 {#c}
- [!] 실리포에서 0장이 24판으로 서는지 — 대지 머리·색인 띠 칩·완료 도장까지 띄워 본다 {#c-real}
- [x] 판 높이·읽는 시간·15분 예산 재측 — 0장 판은 one_liner 문단이 하나 더 붙는다. estMinFor 가 여전히 맞는가 {#c-budget}
- [x] 물을 것 — 외부 교보재를 재료로 쓸 것인가. Exercism 트랙(MIT)의 개념·선행 그래프와 tree-sitter 문법 리포의 쿼리는 라이선스가 맞고, progmiscon(오개념 247건)은 라이선스 명시가 없어 못 가져온다. 쓰기로 하면 등록부 행이 먼저다 {#c-q-source}

<!-- oculpm:plan-log begin v1 -->
| 시각 | 항목 | 에이전트 | 변화 | 일지 | 메모 |
|---|---|---|---|---|---|
| 2026-09-04T17:27:12+09:00 | #c-q-source | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1727_feature_exercism-as-concept-list-source.md | 사용자 답 — Exercism 붙인다. D148 로 경계까지 박음(목록 O · prerequisites 간선 X · 산문 X). progmiscon 은 라이선스 명시 없어 제외 |
| 2026-09-04T17:27:19+09:00 | #b-list | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1727_feature_exercism-as-concept-list-source.md | 여덟 짝 확정 · 깊이 0~2 안. TS 트랙은 개념 연습 1개라 못 쓰고 JS 트랙(30/37)이 출처. 선행은 우리가 다시 매김 |
| 2026-09-04T17:27:20+09:00 | #b-ts | claude-code | ☐→~ | .oculpm/journal/20260904/Features_to_add/1727_feature_exercism-as-concept-list-source.md | ts/if-statement 1/8 — yaml + scm + examples, Rust 쿼리 검증 통과. 남은 일곱은 같은 형틀 |
| 2026-09-04T17:27:27+09:00 | #b-common | claude-code | ☐→~ | .oculpm/journal/20260904/Features_to_add/1727_feature_exercism-as-concept-list-source.md | common/conditional-branch 1/8. 「값이 아니라 흐름이 갈린다」로 기존 conditional-expression(삼항)과 갈라 놨다 |
| 2026-09-04T17:27:29+09:00 | #b-lint | claude-code | ☐→~ | .oculpm/journal/20260904/Features_to_add/1727_feature_exercism-as-concept-list-source.md | 래칫 넷 다 올려 잠금 24/26/24/12. 린트가 새 개념에서 둘 잡았다 — one_liner 80자, why_gate en 의 'wrong' |
| 2026-09-04T17:47:24+09:00 | #b-common | claude-code | ~→x | .oculpm/journal/20260904/Features_to_add/1747_feature_bottom-concepts-eight-pairs.md | 보편 8장 완료 — conditional-branch·boolean-value·comparison·arithmetic·reassignment·function-definition·return-value·loop-while |
| 2026-09-04T17:47:26+09:00 | #b-ts | claude-code | ~→x | .oculpm/journal/20260904/Features_to_add/1747_feature_bottom-concepts-eight-pairs.md | TS 8장 + .scm 8장 완료. 새 쿼리 문법 둘 검증됨 — 연산자 대안 목록 [...] 과 익명 키워드 캡처 |
| 2026-09-04T17:47:32+09:00 | #b-lang | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1747_feature_bottom-concepts-eight-pairs.md | essential 22 → 30. 깊이 재측 결과 0장 후보 21 / 상한 24 — D147 이 노린 「상한 언저리」에 앉았다 |
| 2026-09-04T17:47:35+09:00 | #b-lint | claude-code | ~→x | .oculpm/journal/20260904/Features_to_add/1747_feature_bottom-concepts-eight-pairs.md | 래칫 31/31/31/18 로 잠금. 린트 45건(josa 31 · 빈칸 오답 출처 14) 전부 해소 |
| 2026-09-04T17:47:40+09:00 | #b-golden | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1747_feature_bottom-concepts-eight-pairs.md | 골든 40장(개념당 양성 3·음성 2 강제). 음성 16장 전부 [] · 양성 24장 노드종류·픽수 대조 완료 |
| 2026-09-04T17:56:41+09:00 | #a-wire | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1756_feature_zero-chapter-done-wired.md | rootCleared 설정 신설 + afterSession 이 박고 홈이 읽는다. 조건 ③은 스위치가 없어 false 고정(주석에 명시). 회귀 시험 둘 |
| 2026-09-04T17:56:43+09:00 | #c-budget | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1756_feature_zero-chapter-done-wired.md | 먼저 읽기 한 줄 평균 38.3자 → 판당 +4.6~7.7초, 하루 2장이면 15분 예산의 1.0~1.7%. BUDGET_SLACK 15% 안이라 estMinFor 안 고침 |
| 2026-09-04T17:59:31+09:00 | #a-settings | claude-code | ☐→x | .oculpm/journal/20260904/Bugs/1759_bug_settings-learning-newcomer-switch.md | 스위치가 통째로 빠져 있었다 — home.newcomerBody 가 없는 자리를 실명으로 가리키던 중. 문구 5키(ko+en) + 회귀 1 |
| 2026-09-04T17:59:33+09:00 | #a-scope-copy | claude-code | ☐→x |  | 병렬 세션이 구현, 이 세션이 확인 — ko·en 둘 다 「'변수'·'함수'가 처음이어도 됩니다」로 교체됨 |
| 2026-09-04T17:59:38+09:00 | #a-newcomer-copy | claude-code | ☐→x |  | 병렬 세션이 구현, 이 세션이 확인 — ko·en 둘 다 「0장을 먼저 찍어 보세요」로 뒤집힘 |
| 2026-09-04T17:59:39+09:00 | #a-ask | claude-code | ☐→x |  | 병렬 세션이 구현, 이 세션이 확인 — empty.tsx 에 예/아니오 스위치 + firstRun.newcomerAsk 가 「잠기는 것은 없습니다」를 말한다 |
| 2026-09-04T18:07:33+09:00 | #c-real | claude-code | ☐→! | .oculpm/journal/20260904/Chores/1807_chore_zero-chapter-live-db-check.md | 앱은 띄웠고 원장은 확인(0장 8노드 · 다시 읽으면 +13). 화면 기록 권한이 없어 시각 확인은 사람 몫 — 리포를 다시 읽고 눈으로 볼 것 |
<!-- oculpm:plan-log end -->
