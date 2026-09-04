---
oculpm_plan: v1
id: chickadee-settings-gaps
title: "설정창 보완 — identity 배선 버그와 05 §2.1 대비 빈 네 칸"
status: active
created: 2026-09-04
updated: 2026-09-04
owner: claude-code
---

요청 3. 설정 화면은 이미 8절로 있다(screens/settings/SettingsScreen.tsx). 없는 것은 05 §2.1 이 요구한 모션 감축 · 문법 사전 언어 · 내 커밋 identity · 제외 글롭 넷이고, 그중 identity 는 단순 누락이 아니라 배선 버그다 — 설정 타입·isMine()·classifyCommits 까지 다 있는데 flow.ts:89 가 identities: [] 를 넘겨 모든 커밋이 「내 것 아님」으로 분류된다. 네 플랜 중 가장 싸고 다른 셋의 그릇이 되므로 chickadee-i18n P1 직후에 하는 것이 좋다. Rust 추가 0줄.

## P0 · identity 배선 (버그 — 먼저) {#p0}
- [x] 내 커밋 identity — 편집 UI + 자동 제안 + 인제스트 배선 · 1일 {#set-identities}
  - [x] 증상 확인 — flow.ts:89 가 identities: [] 를 넘겨 isMine() 이 항상 false, git_commit.author_matched 가 전부 0 임을 테스트로 고정 {#set-identities-repro}
  - [x] 상위 저자 5명 제안 쿼리 — git_commit 에서 author_email·author_name 빈도순 (03 §1.2 의 git config 는 Rust 명령이 없어 몸리는다) {#set-identities-suggest}
  - [x] 설정 「학습」절에 identity 목록 편집(추가·삭제·제안 받기) + settings.identities 저장 {#set-identities-ui}
  - [x] flow.ts 가 저장된 값을 runIngest 로 넘기고, 바꿔도 재인제스트 없이 classifyCommits 만 다시 돌 수 있게 {#set-identities-wire}
  - [x] 검증 — 픽스처 리포에서 identity 하나를 넣으면 author_matched 가 기대 건수만큼 1 이 된다 {#set-identities-verify}

## P1 · 05 §2.1 대비 빈 칸 셋 {#p1}
- [x] 모션 감축 스위치 · 0.5일 {#set-motion}
  - [x] settings.motion('system'|'reduce')를 <html data-motion> 으로 세우는 자리 하나(applyTheme · applyTrim 옆) {#set-motion-apply}
  - [x] styles/physics.css 가 data-motion=reduce 에서 prefers-reduced-motion 과 같은 결과를 내도록 {#set-motion-css}
  - [x] check-motion 정적 게이트·감축 모션 E2E 와 정합 확인 {#set-motion-gate}
- [x] 제외 글롭 편집 · 0.5일 {#set-globs}
  - [x] 지금 하드코딩인 concepts/ingest.ts 의 EXCLUDE_GLOBS 를 기본값으로 내리고 settings.excludeGlobs 를 올려보낸다 {#set-globs-wire}
  - [x] 설정에 줄 단위 편집 + 잘못된 글롭 거부 {#set-globs-ui}
  - [x] 바꾸면「다시 읽어야 반영됩니다」— 홈의 재인제스트 배너와 같은 길 {#set-globs-reingest}
- [x] 문법 사전 언어 필터 · 0.5일 {#set-dict-langs}
  - [x] dictionary_version 의 lang 목록을 체크박스로 — 끈 언어는 카드 생성에서 빠진다 {#set-dict-langs-ui}
  - [x] UI 표시 언어(chickadee-i18n 의 locale)와 다른 축임을 절 문구로 명시 {#set-dict-langs-copy}

## P2 · 검증 {#p2}
- [ ] SettingsScreen.test 확장과 설정 왕복 E2E · 0.3일 {#set-tests}
  - [ ] 네 칸이 저장되고 재실행에 남는지(E7 과 같은 모양) {#set-tests-persist}
  - [ ] 읽기 실패해도 화면이 기본값으로 뜼는 기존 규칙을 깨지 않는지 {#set-tests-fallback}

<!-- oculpm:plan-log begin v1 -->
| 시각 | 항목 | 에이전트 | 변화 | 일지 | 메모 |
|---|---|---|---|---|---|
| 2026-09-04T08:43:09+09:00 | #set-identities-repro | claude-code | ☐→x | .oculpm/journal/20260904/Bugs/0843_bug_identities-never-reached-classify-commits.md | flow.test.tsx — 배선을 되돌리면 실제로 빨개지는 것을 확인 |
| 2026-09-04T08:43:17+09:00 | #set-identities-suggest | claude-code | ☐→x | .oculpm/journal/20260904/Bugs/0843_bug_identities-never-reached-classify-commits.md | suggestIdentitiesFor() — 기존 derive.commits 재사용, 새 statement 0. git config 는 D121 로 뺌 |
| 2026-09-04T08:43:25+09:00 | #set-identities-ui | claude-code | ☐→x | .oculpm/journal/20260904/Bugs/0843_bug_identities-never-reached-classify-commits.md | IdentityPanel — 「학습」절, 새 문구 13개 전부 t() · ko 카탈로그. 테스트 9건 |
| 2026-09-04T08:43:32+09:00 | #set-identities-wire | claude-code | ☐→x | .oculpm/journal/20260904/Bugs/0843_bug_identities-never-reached-classify-commits.md | flow.ts 가 loadSettings 로 읽어 넘김 · reclassifyCommits 로 재인제스트 없이 반영 |
| 2026-09-04T08:43:41+09:00 | #set-identities-verify | claude-code | ☐→x | .oculpm/journal/20260904/Bugs/0843_bug_identities-never-reached-classify-commits.md | flow 통합에서 커밋 둘 중 하나만 author_matched=1 · identities.test 6건이 원장 왕복 |
| 2026-09-04T09:01:20+09:00 | #set-motion-apply | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0901_feature_settings-motion-globs-dict-langs.md | applyMotion() — applyTheme·applyTrim·applyLocale 옆. 'system' 도 속성으로 적는다 |
| 2026-09-04T09:01:28+09:00 | #set-motion-css | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0901_feature_settings-motion-globs-dict-langs.md | CSS 는 이미 다 되어 있었다 — 11개 파일 전부에 [data-motion=reduce] 쌍이 있었다 |
| 2026-09-04T09:01:36+09:00 | #set-motion-gate | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0901_feature_settings-motion-globs-dict-langs.md | 게이트 2건 추가 — 속성 경로가 미디어 쿼리와 같은지 · system 은 아무것도 줄이지 않는지 |
| 2026-09-04T09:01:44+09:00 | #set-globs-wire | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0901_feature_settings-motion-globs-dict-langs.md | EXCLUDE_GLOBS 뒤에 덧붙인다 — 03 §1.2 의「추가 제외 목록」을 코드로 확정(D122) |
| 2026-09-04T09:01:52+09:00 | #set-globs-ui | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0901_feature_settings-motion-globs-dict-langs.md | GlobPanel — 줄 단위 · blur 저장 · globProblem 넷은 막지 않고 말하되 저장에서 뺀다 |
| 2026-09-04T09:02:00+09:00 | #set-globs-reingest | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0901_feature_settings-motion-globs-dict-langs.md | 홈 배너와 같은 모양의 안내(버튼 없음). 지문에는 넣지 않았다 — 06 §6.3 은 빌드 축이다 |
| 2026-09-04T09:02:08+09:00 | #set-dict-langs-ui | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0901_feature_settings-motion-globs-dict-langs.md | DictLangPanel + Settings.dictLangs + derive.dict_langs. 빈 목록 = 전부 켜짐, 새 판에서만 뺀다 |
| 2026-09-04T09:02:15+09:00 | #set-dict-langs-copy | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0901_feature_settings-motion-globs-dict-langs.md | settings.dictLangs.axis — 「무엇을 배울지」와 「어느 말로 읽을지」를 갈라 적었다 |
<!-- oculpm:plan-log end -->
