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
- [x] tree-sitter c·cpp·c_sharp·swift 링크 (lang-* 피처, GRAMMARS 표 true, ABI c15·cpp14·c_sharp15·swift15) {#f-grammars}
- [x] packages/course/src/parts/<lang>.ts 열 장 + index.ts 등록부(COURSE_LANGS·PARTS_BY_LANG·partsOf) + 열 언어 대조 시험 {#f-parts}
- [x] docs/00-overview.md §4.2.1 D190 행 + 플랜 생성 {#f-register}
- [x] typecheck·lint·course/dictionary 시험·cargo test 초록 → 기반 커밋 {#f-commit}

## L · 언어 열 — 워크트리 세션 하나씩 {#l-langs}
- [~] py — 1부 남은 셋·2부 저작, parts/py.ts, 골든·린트·ABI 초록 {#l-py}
- [x] ts — 2부 채우기(narrowing·union·class·prototype 등), parts/ts.ts {#l-ts}
- [x] java — 0·1·2·3부 이미 섬. 남은 것(string-concat·autoboxing 자리, 골든 보강) 점검 {#l-java}
- [~] sql — 바닥 남은 다섯 + 중심, parts/sql.ts {#l-sql}
- [~] rs — 0부 11 + 1·2부 전량 신규(사전 0장 → 표본 ai-pm 280장), parts/rs.ts {#l-rs}
- [~] go — 0부 + 1·2부 전량 신규, 표본은 공개 리포, parts/go.ts {#l-go}
- [~] c — 0부(기계 층) + 1·2부 전량 신규, 파서 ERROR 비율 실측, parts/c.ts {#l-c}
- [~] cpp — 0부 + 1·2부 전량 신규, 파서 ERROR 비율 실측, parts/cpp.ts {#l-cpp}
- [~] csharp — 0부 + 1·2부 전량 신규, 파서 ERROR 비율 실측, parts/csharp.ts {#l-csharp}
- [~] swift — 0부 + 1·2부 전량 신규, 파서 ERROR 비율 실측, parts/swift.ts {#l-swift}

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
| 2026-09-06T00:38:06+09:00 | #f-grammars | claude-code | ☐→x |  | tree-sitter-c 0.24.2 · cpp 0.23.4 · c-sharp 0.23.5 · swift 0.7.3 링크, ABI c15·cpp14·c_sharp15·swift15, GRAMMARS true, 린트 표본 dart 로. cargo test 초록 (커밋 1f8bda6) |
| 2026-09-06T00:39:03+09:00 | #f-parts | claude-code | ☐→x |  | parts/{index,java,ts,py,sql,rs,go,c,cpp,csharp,swift}.ts + index.test.ts 25 시험 초록. JAVA_PARTS 재수출. ts 21/12/8 · py 18/6 · sql 8/3 분할 |
| 2026-09-06T00:39:29+09:00 | #f-register | claude-code | ☐→x |  | D190 행(파서 넷 · 부 등록부 · 워크트리 저작 규약 · courseLang/no-files) + 플랜 v11 생성 |
| 2026-09-06T00:40:46+09:00 | #f-commit | claude-code | ☐→x |  | typecheck·eslint·vitest(course/dictionary 95)·cargo test 초록, 커밋 1f8bda6. 열 세션 워크트리로 출발(rs·c Fable 포크, 나머지 Opus) |
| 2026-09-06T00:48:21+09:00 | #l-py | claude-code | ☐→~ |  | Opus 워크트리 세션 출발 — 1부 남은 넷 + 2부 |
| 2026-09-06T00:51:06+09:00 | #l-ts | claude-code | ☐→~ |  | Opus 워크트리 세션 출발 — 2부 완성 |
| 2026-09-06T00:51:21+09:00 | #l-java | claude-code | ☐→~ |  | Opus 워크트리 세션 출발 — 심화 잔여 + 골든 감사 |
| 2026-09-06T00:51:30+09:00 | #l-sql | claude-code | ☐→~ |  | Opus 워크트리 세션 출발 — 바닥 다섯 + 중심 16 + 심화 8 |
| 2026-09-06T00:51:48+09:00 | #l-rs | claude-code | ☐→~ |  | Fable 포크 워크트리 세션 출발 — 0부 11 + 1·2부 전량 |
| 2026-09-06T00:52:43+09:00 | #l-go | claude-code | ☐→~ |  | Opus 워크트리 세션 출발 — cli/cli 표본 |
| 2026-09-06T00:53:05+09:00 | #l-c | claude-code | ☐→~ |  | Fable 포크 워크트리 세션 출발 — 기계 층 0부, 파서 ERROR 비율 실측 |
| 2026-09-06T00:53:31+09:00 | #l-cpp | claude-code | ☐→~ |  | Opus 워크트리 세션 출발 — fmt/json 표본, ERROR 비율 실측 |
| 2026-09-06T00:53:50+09:00 | #l-csharp | claude-code | ☐→~ |  | Opus 워크트리 세션 출발 — 공개 리포 표본, ERROR 비율 실측 |
| 2026-09-06T00:54:14+09:00 | #l-swift | claude-code | ☐→~ |  | Opus 워크트리 세션 출발 — 커뮤니티 문법 ERROR 비율이 첫 발견 |
| 2026-09-06T01:05:29+09:00 | #l-java | claude-code | ~→x |  | 47장(0부 19·1부 8·2부 20) · 골든 114/47 · string-concat·autoboxing 0부 복귀 · ERROR 0% · 병합 f69d8e1, 남은 것 map-and-set |
| 2026-09-06T01:21:10+09:00 | #l-ts | claude-code | ~→x |  | 69장(0부 21·1부 13·2부 18) · 골든 164/84 · ERROR 0% · 병합 c2898f6 · 래칫 137/141/137/128 |
<!-- oculpm:plan-log end -->
