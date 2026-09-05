---
oculpm_plan: v1
id: chickadee-v06-learning-order
title: "0.6 학습 순서를 바로잡는다 — D151 추적 · D152 파이썬 · D153 시간축"
status: active
created: 2026-09-04
updated: 2026-09-04
owner: claude-code
---

병렬 fork 넷의 설계와 학습과학 조사에서 나온 나머지. 등록부 D149~D153 은 올라갔고 D149(EVALS)·D150(첫 만남 게이트)은 구현이 끝났다. 순서의 원칙: **가장 값싼 것이 아니라 가장 근본적인 것부터** — BRACElet 이 「추적이 쓰기보다 앞선다」고 하는데 우리 트랙에는 추적이 없다. 그것이 D151 이고 나머지 둘보다 먼저다.

## A · D151 — 빠진 추적층 (`dictionary/exec/`) {#a}
- [x] t0-exec.ts — AstLite 에서 정답지를 뽑는다. **이것부터 짠다** — fork 가 재료가 있다는 것까지만 확인했고 생성기는 안 짜 봤다. 안정적이지 않으면 개념 목록을 줄인다 {#a-generator}
- [x] exec/order · exec/unreachable — 실행 순서와 안 도는 줄. 둘 다 statement 순서와 return/throw 위치만 쓰므로 가장 단단하다 {#a-order}
- [ ] state/mutation — 「이 줄 뒤 xs 는」. common/mutating-append ↔ map-transform 이 이미 갈라 둔 것을 정답지로 쓴다 {#a-state}
- [ ] scope/visibility — 선언 노드와 사용 노드의 조상 블록 비교. AstLite 에 조상이 있는지 먼저 확인 {#a-scope}
- [~] 린트와 스키마 — 「보편 개념은 쿼리가 없다」가 common/·arch/ 접두어를 하드코딩한다(dict.test.ts). essential 이면 blank+@hole 을 요구하는 규칙도 이 네임스페이스에는 no_hole_reason 으로 {#a-lint}
- [ ] EVALS L5 갱신 — 추적층이 생기면 트랙 커버리지의 뜻이 바뀜다 {#a-evals}

## B · D152 — 파이썬 바닥 여덟 짝 {#b}
- [x] py/_lang.yaml — grammar_abi 는 **14** 다(ts 는 15). 확장자 표·essential·alternatives·diag_default {#b-lang}
- [x] scm 10장 배치 — fork 가 검증해 scratchpad/py-scm/ 에 둔 것을 가져온다. comparison 은 형제 앵커로 연쇄 비교를 제외한 판이다 {#b-scm}
- [x] py 개념 8장 + 새 보편 7장(import·truthiness·dict-literal·index-access·method-def-self·default-arg·decorator). assignment 는 D152 대로 **가르지 않는다** {#b-yaml}
- [x] fixtures/golden/py/** — 개념당 양성 3·음성 2 강제. golden.rs 의 (dir, least) 목록에 py 추가 {#b-golden}
- [x] t1-line.ts 파이썬 분기 — D152 대로 탭·공백만 정규화하고 들여쓰기 깊이는 유지. 탭 1개 = 공백 4개 {#b-t1-indent}
- [!] 래칫 — 파이썬이 들어오면 네 규칙의 대상이 전부 늘어난다. 다 채우고 올려 잠그기 {#b-ratchet}

## C · D153 — 시간축 (`arch/growth`) {#c}
- [ ] t2.file_birth — file.first_commit_id → git_commit.authored_at. 카탈로그에 statement 하나 {#c-stmt}
- [ ] t2-quiz.ts 에 growth — 시간순 배열, 함정은 큰 파일과 core·base 류 이름. 게이트는 서로 다른 첫 커밋 ≥ 4 {#c-quiz}
- [ ] T2_ORDER 끝에 growth · REPO_TARGETS 에 growth: 3 · dictionary/arch/growth.yaml {#c-wire}
- [ ] 회전 시험 — 리포종 목표 3 이 한 바퀴를 +6일만 늘리는지 {#c-rotate}

## D · 사람이 봐야 하는 것 (EVALS human) {#d}
- [ ] IPC 덤프 커밋 — 재생성분이 미커밋이다. 다만 diff 에 동시 세션의 .scm 변경이 섞여 있어 갈라 보아야 한다 {#d-commit}
- [ ] H1 — 실리포를 다시 읽고 0장 21판을 끝까지 밟아 본다. L2·L5 가 표본을 얻는 유일한 길이다 {#d-h1}
- [ ] H3 — 오늘 더한 여덟과 D150 의 첫 만남 한 줄이 화면에서 읽힐는지 {#d-h3}

<!-- oculpm:plan-log begin v1 -->
| 시각 | 항목 | 에이전트 | 변화 | 일지 | 메모 |
|---|---|---|---|---|---|
| 2026-09-04T19:01:39+09:00 | #a-generator | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/1901_feature_exec-facts-analysis-layer.md | 게이트 통과 — 분석층 exec-facts.ts 가 진짜 파스 트리 10건으로 검증됨. 개념 목록 안 줄인다. 익명 노드 버그 하나를 그 자리에서 잡음 |
| 2026-09-04T19:13:20+09:00 | #a-order | claude-code | ☐→~ | .oculpm/journal/20260904/Features_to_add/1913_feature_exec-order-question-builder.md | exec/order 출제층 완료(시험 5). exec/unreachable 은 실측으로 뺐다 — 238파일·함수 802개에서 0건이라 카드가 안 나온다. 남은 것은 사전 편찬과 배선 |
| 2026-09-04T19:32:44+09:00 | #a-order | claude-code | ~→! | .oculpm/journal/20260904/Features_to_add/1928_feature_exec-lazy-baking-wired.md | 생성·조립·굽기 완료(커밋 4). 막힌 곳은 큐 진입 — queue.new_candidates 가 concept_site 를 JOIN 하고 kind='lang' 을 요구해 exec 이 둘 다 못 넘는다. UNION 가지 하나면 되지만 「새 판 2장」의 경쟁자를 바꾸는 문장이라 site_count 순위 영향 실측이 선행 |
| 2026-09-04T19:45:06+09:00 | #a-order | claude-code | !→x | .oculpm/journal/20260904/Features_to_add/1928_feature_exec-lazy-baking-wired.md | D154 로 큐 진입까지 뚫음 — UNION 가지 + 랭커가 사용처 없는 후보를 경계 미지로 받는다. 어휘 판을 안 밀어내는 것을 순위 규칙으로 확인하고 넣음. 실제 SQLite 시험 3건(그 문장은 시험이 아예 없었다) |
| 2026-09-04T20:54:57+09:00 | #a-lint | claude-code | ☐→~ | 20260904/Chores/2054_chore_ten-language-curriculum-and-cs-dictionary.md | D157 이 답을 확정 — COMPUTED 에 'cs/' 를 더해 넷으로(dict.test.ts:59 · lint.ts:139 · load.ts:82). 네 번째 추가라 접두어를 상수 하나로 모은다. 명세는 docs/curriculum/cs.md §7. 구현 미착수 |
| 2026-09-04T20:56:53+09:00 | #a-state | claude-code | ☐→☐ | 20260904/Chores/2054_chore_ten-language-curriculum-and-cs-dictionary.md | Go 편이 세 번째 경우를 더한다 — append 가 용량에 따라 원본을 고치기도 새로 만들기도 해서 mutating-append ↔ map-transform 두 갈래로 안 갈린다. docs/curriculum/go.md §6 (전이 끊고 universal null 권고) |
| 2026-09-05T23:34:26+09:00 | #b-lang | claude-code | ☐→x | 20260905/Features_to_add/2334_feature_python-zero-part-dictionary-24.md | grammar_abi 14 확인(시험이 대조) · essential 24장, 얇은 열둘을 둘씩 흩음 · alternatives 는 근거 없어 빈 채로 사유 기재 |
| 2026-09-05T23:34:34+09:00 | #b-scm | claude-code | ☐→x | 20260905/Features_to_add/2334_feature_python-zero-part-dictionary-24.md | scm 26장(개념 24 + 시스템 2). 사용자 리포로 캡처 수를 재 좁힌 자리 넷을 쿼리 주석에 남김 |
| 2026-09-05T23:34:41+09:00 | #b-yaml | claude-code | ☐→x | 20260905/Features_to_add/2334_feature_python-zero-part-dictionary-24.md | 신설 16장 + assignment 갱신 = 24장. 새 보편형은 안 만들고 D187 ④⑤ 가 낸 common/ 셋을 씀. assignment 는 D152 대로 안 가름 |
| 2026-09-05T23:34:48+09:00 | #b-golden | claude-code | ☐→x | 20260905/Features_to_add/2334_feature_python-zero-part-dictionary-24.md | 개념 24 × (양성 3 · 음성 2) + 함정 3 = 123장. golden.rs 에 ("py", 24), support/mod.rs 의 DIRS 에 py 행 |
| 2026-09-05T23:34:55+09:00 | #b-t1-indent | claude-code | ☐→x | 20260905/Features_to_add/2334_feature_python-zero-part-dictionary-24.md | compareLine 이 grammar 를 받는다. python 은 탭 1 = 공백 4, 깊이가 다르면 differ. 시험 셋 추가. 거터(evalLine)는 인자가 선택이라 화면은 안 건드림 |
| 2026-09-05T23:35:02+09:00 | #b-ratchet | claude-code | ☐→! | 20260905/Features_to_add/2334_feature_python-zero-part-dictionary-24.md | 부채는 0으로 다 채웠다(120/120 · 116/117 · 120/120 · 111/111). 숫자를 올려 잠그는 것은 오케스트레이터 몫 — 병렬 세션이 끝나야 확정된다 |
<!-- oculpm:plan-log end -->
