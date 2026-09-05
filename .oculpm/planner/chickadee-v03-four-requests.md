---
oculpm_plan: v1
id: chickadee-v03-four-requests
title: "0.3 요청 넷 — 클론 URL · 게이지 가독 · 창 크로뮴 · 정답 위치 편향"
status: done
created: 2026-09-04
updated: 2026-09-04
owner: claude-code
---

앱을 실제로 띄운 사용자가 낸 요청 넷. 클론 URL 은 Rust 를 건드리므로(예산 2300/2300 이 꽉 참) 결정 등록부 행이 먼저 온다.

## P0 · 결정 등록부 (문서 수정 전 선행) {#p0}
- [x] D126 — 창 크로뮴: 제목 표시줄을 숨기고 종이가 창 끝까지 간다 {#d126-chrome}
- [x] D127 — 게이지 셋(.queue·.ctoc-bar·.bar)의 가독을 목업보다 올린다 {#d127-gauge}
- [x] D128 — 지목형 정답 위치를 시드로 흩는다 (04 §1.1 오답 선정) {#d128-answer}
- [x] D129 — repo_clone 신설과 Rust 줄 예산 상향 {#d129-clone}

## P1 · 창 크로뮴 (요청 3) {#p1}
- [x] tauri.conf.json — titleBarStyle Overlay · hiddenTitle · 배경 {#chrome-conf}
- [x] 드래그 영역과 신호등 자리 확보 CSS, 화면 다섯이 모두 맞물리는지 {#chrome-css}

## P2 · 게이지 셋 (요청 2) {#p2}
- [x] .queue — 지난 칸 opacity .3 을 걷고 굵기·테두리 {#gauge-queue}
- [x] .ctoc-bar · .bar — 굵기와 채움 대비 {#gauge-bars}
- [x] 대비 게이트 · 시각 게이트 갱신 {#gauge-gates}

## P3 · 지목형 정답 위치 (요청 4) {#p3}
- [x] 오답을 정답 앞뒤에서 골라 정답 순위를 시드로 흩는다 {#answer-spread}
- [x] 빈칸·의미형·T2 방향 퀴즈 분포 실측 {#answer-measure}
- [x] 골든·분포 테스트 {#answer-tests}

## P4 · 클론 URL (요청 1) {#p4}
- [x] crates/git — clone_into(url, dir), https 만 {#clone-rust}
- [x] repo_clone 명령 + ipc-client + concepts/repos.ts {#clone-ipc}
- [x] 첫 실행·서가 두 자리의 URL 입력 UI + 문구(ko·en) {#clone-ui}
- [x] 테스트와 게이트 {#clone-tests}

<!-- oculpm:plan-log begin v1 -->
| 시각 | 항목 | 에이전트 | 변화 | 일지 | 메모 |
|---|---|---|---|---|---|
| 2026-09-04T12:37:25+09:00 | #d129-clone | claude-code | ☐→x | .oculpm/journal/20260904/Chores/1237_chore_d129-raise-rust-line-budget-2800.md | 예산 2,800 · git560/parse400/store380/app1460 · 게이트 2300/2800 초록 |
| 2026-09-04T12:39:15+09:00 | #chrome-conf | claude-code | ☐→x | 20260904/Features_to_add/1238_feature_mac-titlebar-overlay-chrome.md | Overlay + hiddenTitle. macOS 전용이라 다른 OS 는 그대로 |
| 2026-09-04T12:39:17+09:00 | #chrome-css | claude-code | ☐→x | 20260904/Features_to_add/1238_feature_mac-titlebar-overlay-chrome.md | --chrome-top 28px · .chrome-drag 는 #root 밖 · .proof 만 inset 직접 |
| 2026-09-04T12:39:22+09:00 | #gauge-queue | claude-code | ☐→x | 20260904/Bugs/1239_bug_gauges-too-faint-to-read.md | 18px · 안 지난 칸은 opacity 대신 종이 빗금 |
| 2026-09-04T12:39:24+09:00 | #gauge-bars | claude-code | ☐→x | 20260904/Bugs/1239_bug_gauges-too-faint-to-read.md | 14px · 찬 자리 끝을 선으로 끊는다 (0·100 은 data-fill 로 제외) |
| 2026-09-04T12:39:26+09:00 | #d126-chrome | claude-code | ☐→x | 20260904/Features_to_add/1238_feature_mac-titlebar-overlay-chrome.md | 00 §4.2.1 · 05 §1.2 갱신 |
| 2026-09-04T12:39:27+09:00 | #d127-gauge | claude-code | ☐→x | 20260904/Bugs/1239_bug_gauges-too-faint-to-read.md | 00 §4.2.1 · 05 §5 표 행에 목업 이탈 명시 |
| 2026-09-04T12:45:27+09:00 | #answer-spread | claude-code | ☐→x | 20260904/Bugs/1245_bug_point-answer-always-second.md | spread() — 앞 b개·뒤 3−b개, b 는 카드 시드 |
| 2026-09-04T12:45:29+09:00 | #answer-measure | claude-code | ☐→x | 20260904/Bugs/1245_bug_point-answer-always-second.md | 빈칸·의미형 292장 72/78/73/69 · T2 방향 쌍 7건 4/3/0/0 — 편향 아님 |
| 2026-09-04T12:45:33+09:00 | #answer-tests | claude-code | ☐→x | 20260904/Bugs/1245_bug_point-answer-always-second.md | 골든 둘 갱신 + 흩기·결정성 테스트 둘 |
| 2026-09-04T12:45:34+09:00 | #d128-answer | claude-code | ☐→x | 20260904/Bugs/1245_bug_point-answer-always-second.md | 00 §4.2.1 · 04 §1.1 오답 선정에 한 줄 |
| 2026-09-04T12:55:25+09:00 | #clone-rust | claude-code | ☐→x | 20260904/Features_to_add/1255_feature_clone-repo-from-url.md | clone_into 는 lib.rs 의 open 옆 · git2 https(macOS 는 SecureTransport) |
| 2026-09-04T12:55:30+09:00 | #clone-ipc | claude-code | ☐→x | 20260904/Features_to_add/1255_feature_clone-repo-from-url.md | repo_clone(async+spawn_blocking) · 오류 코드 둘 · cloneTargetName/cloneRepo |
| 2026-09-04T12:55:31+09:00 | #clone-ui | claude-code | ☐→x | 20260904/Features_to_add/1255_feature_clone-repo-from-url.md | CloneField 하나를 첫 실행·서가가 공유 · ko/en 문구 |
| 2026-09-04T12:55:33+09:00 | #d129-clone | claude-code | x→x | 20260904/Features_to_add/1255_feature_clone-repo-from-url.md | 행은 사용자가 올렸다(2,800). 남아 있던 CONTRIBUTING·01 §3.2·§4·05 §2.4·06 §4.1 을 맞췄다 |
| 2026-09-04T13:14:28+09:00 | #clone-tests | claude-code | ☐→x | 20260904/Features_to_add/1255_feature_clone-repo-from-url.md | 단위 7 + 실제 https 클론 1회(octocat/Hello-World — 임시 테스트, 남기지 않음) |
| 2026-09-04T13:14:29+09:00 | #gauge-gates | claude-code | ☐→x | 20260904/Bugs/1239_bug_gauges-too-faint-to-read.md | test:gates 114 통과(대비·행 길이·axe·모션) — 시각 기준선은 이 리포에 아직 없다 |
<!-- oculpm:plan-log end -->
