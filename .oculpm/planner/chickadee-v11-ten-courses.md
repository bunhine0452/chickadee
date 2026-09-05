---
oculpm_plan: v1
id: chickadee-v11-ten-courses
title: "1.1 열 언어 코스 — 언어를 고르고 기초부터 쭉 (D190)"
status: active
created: 2026-09-06
updated: 2026-09-06
owner: claude-code
---

사용자 요청 「언어를 선택하고 그 언어의 기초부터 쭉 학습하는 코스 — docs 의 열 언어 전부, 병렬 세션으로」. 기반(파서 넷·부 등록부)을 깔고 언어 열을 워크트리 세션 열로 저작한 뒤, 앱에 언어 선택과 부 목차를 붙이고 합류한다.

## F · 기반 — 파서 넷 · 부 등록부 · D190 {#f-base}
- [ ] tree-sitter c·cpp·c_sharp·swift 링크 (lang-* 피처, GRAMMARS 표 true, ABI c15·cpp14·c_sharp15·swift15) {#f-grammars}
- [ ] packages/course/src/parts/<lang>.ts 열 장 + index.ts 등록부(COURSE_LANGS·PARTS_BY_LANG·partsOf) + 열 언어 대조 시험 {#f-parts}
- [ ] docs/00-overview.md §4.2.1 D190 행 + 플랜 생성 {#f-register}
- [ ] typecheck·lint·course/dictionary 시험·cargo test 초록 → 기반 커밋 {#f-commit}

## L · 언어 열 — 워크트리 세션 하나씩 {#l-langs}
- [ ] py — 1부 남은 셋·2부 저작, parts/py.ts, 골든·린트·ABI 초록 {#l-py}
- [ ] ts — 2부 채우기(narrowing·union·class·prototype 등), parts/ts.ts {#l-ts}
- [ ] java — 0·1·2·3부 이미 섬. 남은 것(string-concat·autoboxing 자리, 골든 보강) 점검 {#l-java}
- [ ] sql — 바닥 남은 다섯 + 중심, parts/sql.ts {#l-sql}
- [ ] rs — 0부 11 + 1·2부 전량 신규(사전 0장 → 표본 ai-pm 280장), parts/rs.ts {#l-rs}
- [ ] go — 0부 + 1·2부 전량 신규, 표본은 공개 리포, parts/go.ts {#l-go}
- [ ] c — 0부(기계 층) + 1·2부 전량 신규, 파서 ERROR 비율 실측, parts/c.ts {#l-c}
- [ ] cpp — 0부 + 1·2부 전량 신규, 파서 ERROR 비율 실측, parts/cpp.ts {#l-cpp}
- [ ] csharp — 0부 + 1·2부 전량 신규, 파서 ERROR 비율 실측, parts/csharp.ts {#l-csharp}
- [ ] swift — 0부 + 1·2부 전량 신규, 파서 ERROR 비율 실측, parts/swift.ts {#l-swift}

## A · 앱 — 언어 선택과 부 목차 {#a-app}
- [ ] 설정 키 courseLang (null = 리포 주 언어) — store-sql 스키마·기본값·화면 저장 {#a-setting}
- [ ] 코스 화면 머리의 언어 선택지 열 — 사전 장수·파서 여부·내 리포 파일 수를 함께 보인다 {#a-picker}
- [ ] 고른 언어의 부 목차(0·1·2·3부 + 연습 층)가 기능 챕터 앞에 서고, 판 한 장을 열면 기존 T0 세션으로 간다 {#a-outline}
- [ ] AbsenceReason 에 no-files — 고른 언어의 파일이 어느 리포에도 없을 때의 사유가 화면에 실린다 {#a-nofiles}
- [ ] 컴포넌트 시험 + 정직성 게이트(no-files 문구) + i18n ko/en {#a-tests}

## M · 합류 {#m-merge}
- [ ] 워크트리 브랜치 열을 순서대로 병합, 충돌은 공유 파일에서만 {#m-branches}
- [ ] 세션 보고의 ABSENCE 초안을 t0-synthetic.ts 표에 넣고 사유 시험 {#m-absence}
- [ ] docs/curriculum/README.md §4 상태표·§5 실측 갱신, 세션이 낸 등록부 초안에 번호 {#m-docs}
- [ ] typecheck · lint · test:unit · dict:lint · cargo test · gates → 커밋 → 푸시 → CI 초록 {#m-verify}
- [ ] 최종 보고 — 언어별 장수·골든·사용처 실측, 못 한 것 {#m-report}

<!-- oculpm:plan-log begin v1 -->
| 시각 | 항목 | 에이전트 | 변화 | 일지 | 메모 |
|---|---|---|---|---|---|
<!-- oculpm:plan-log end -->
