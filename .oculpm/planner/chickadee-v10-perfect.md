---
oculpm_plan: v1
id: chickadee-v10-perfect
title: "1.0 「완벽한 학습 소프트웨어」 — 셋을 게이트로: UX · 디자인 · 학습질 (D186 · D187)"
status: active
created: 2026-09-05
updated: 2026-09-05
owner: claude-code
---

사용자 정의: ① 학습에 불편이 없나 ② 디자인이 이상하지 않나 ③ 학습질이 좋은가. 전부 위임. 미결 스물하나는 D187 로 닫았고, 두 물결의 병렬 세션이 적용한다.

## P0 · 결정과 정본 (오케스트레이터) {#p0-decide}
- [x] D186 완성의 정의 · D187 미결 스물하나 — 등록부 {#p0-register}
- [ ] 정본 개정 — §2 2단에 값 추적 · §5 stdin 러너·방언별 SQL · §5 Rust 「내려앉음」 실측로 · §10 신설 「무엇이 완성인가」 {#p0-canon}

## W1 · 첫 물결 (여섯 동시, Opus) {#w1}
- [ ] S3 형식 둘 — order · trace-table (cards·grading·UI) + 로그인 챕터 2단에 값 추적 판 {#w1-formats}
- [ ] S4 자바 0부 사전 — java.md §1.5 의 19개를 yaml·scm·golden 으로, siblings 재료까지 {#w1-java-dict}
- [ ] S5 TS 0부 사전 — ts.md §1.5 의 21개 + prototype↔class 선행 뒤집기 + _imports.scm await 구멍 {#w1-ts-dict}
- [ ] S7 SQL — 0부 8 + self-join + Miedema 넷 + sqlite 러너(방언별) + 픽스처 행 + MyBatis #{} 결함 {#w1-sql}
- [ ] S8 결함·사전 구조 — grammarSchema 파서 미링크 거부 · quality.rs 못 · py/arithmetic 51% · number-literal 쌍개기 · common/truthiness · cs/ 둘 {#w1-defects}
- [ ] S10 그림 — 명세만 다섯 제작 + 신청 여섯 + 권한 줄 교체 + diagram.* i18n {#w1-diagrams}

## W2 · 둘째 물결 (여섯 동시 — W1 의 UI 가 선 뒤) {#w2}
- [ ] S1 UX 감사와 수리 — 학습자 여정을 실제로 밟고 막힘 0 · e9-journey e2e · ux-audit.md 갱신 (.tsx·i18n) {#w2-ux}
- [ ] S2 디자인 QA — 화면 전수 스크린샷 6판 · 이상한 곳 수리 · 코드 창 16px · 2단 상한 · 밝게/어둡게 설정 (.css·tokens) {#w2-design}
- [ ] S6 파이썬 0부 사전 — py.md §1.5 의 19개 + v06 B 바닥 여덟 + reference-binding 이동 {#w2-py-dict}
- [ ] S9 stdin 러너 + 작은 문제 층 — 자바 먼저, 0부 뒤 다섯 줄짜리 열다섯, 저작권 없는 우리 문제 {#w2-runner}
- [ ] S11 커리큨럼 적용 — §N.6 diff 열 편 반영 · curriculum.ts JAVA_PARTS · 74일 단별 탈출 · 글로서리 en {#w2-curriculum}
- [ ] S12 카탈로그 확장 — 언어별 식 늘리기 · variants · langAlt · compile-error/unspecified · 재출제 다른 식 {#w2-catalog}

## K · 통합과 세 게이트 {#k-gates}
- [ ] 성질 게이트 셋(내 코드 비율 · 값 추적 있음 · 진단 계산) + 정직성 게이트 — tests/gates {#k-quality-gates}
- [ ] 화면 전수 스크린샷 모음 design/system/shots — 사용자에게 전송 {#k-shots}
- [ ] typecheck · lint · test:unit · gates · e2e-ui · design:check · contrast · motion → 커밋 → 푸시 → CI 초록 {#k-verify}
- [ ] 최종 보고 — 세 게이트의 수치와 못 한 것 {#k-report}

<!-- oculpm:plan-log begin v1 -->
| 시각 | 항목 | 에이전트 | 변화 | 일지 | 메모 |
|---|---|---|---|---|---|
| 2026-09-05T20:01:20+09:00 | #p0-register | claude-code | ☐→x |  | D186 완성의 정의(게이트 넷) · D187 미결 스물하나 |
<!-- oculpm:plan-log end -->
