---
oculpm_plan: v1
id: chickadee-clone-course
title: "프로젝트 전체 클론 코스 — 리포 하나를 순서대로 통째로 필사"
status: done
created: 2026-09-04
updated: 2026-09-04
owner: claude-code
---

요청 4. 지금 T1 은 12~40줄 블록 하나짜리다(cards/src/t1-block.ts). 사용자 결정: 일일 큐(D12 10~25분) 밖 별도 모드, 결과는 review_log 로 개념 겹에 반영. 재사용이 핵심이라 새로 짜는 것은 순서·진행 원장·화면 셋뿐이다 — 41줄 이상을 12~40줄 조각으로 자르고 「…이어서」 헤더를 붙이는 segment() 와 채점기 t1-align·t1-ast·t1-result 는 그대로 쓴다. Rust 추가 0줄(예산 2300/2300, 여유 0): 원문은 기존 file_read_lines 로 읽는다. 네 플랜 중 가장 크고, 새 문구가 많으므로 chickadee-i18n P1 뒤에 착수한다.

## P0 · 결정 등록부와 정본 (사용자 확인이 선행) {#p0}
- [x] D120 — 클론 코스는 일일 큐 밖 별도 모드 · 0.3일 {#clone-d120}
  - [x] docs/00-overview.md §4.2.1 에 D120 행 — 예산 D12 를 건드리지 않고 겹만 공유하는 근거 {#clone-d120-row}
  - [x] 정본 §2 트랙 표에 코스 행이 필요하므로 docs/00 §4.3「정본 갱신」후보로 먼저 올리고 사용자 확인 {#clone-d120-canon}
  - [x] docs/00 §5 에 M7 배치 행 추가 {#clone-d120-milestone}

## P1 · 원장과 순서 (끝: 같은 리포를 두 번 열면 같은 코스 순서가 나온다) {#p1}
- [x] 0003_clone.sql 마이그레이션 · 0.5일 (선행: D120) {#clone-migration}
  - [x] clone_run(repo_id · mode 'commit'|'dep' · scope 'repo'|'unit' · unit_id · status · order_json · started_at · finished_at) {#clone-migration-run}
  - [x] clone_step(run_id · seq · file_id · line_start · line_end · status · pct · elapsed_s · draft_text · review_log_id · done_at) {#clone-migration-step}
  - [x] SCHEMA_VERSION · catalog 갱신 + 마이그레이션 테스트(백업 · 상위 버전 거부). 새 테이블이라 02 §2.2 의「원장은 추가만」을 어기지 않는다 {#clone-migration-runner}
- [x] 코스 순서 산출 · 1.5일 {#clone-order}
  - [x] 커밋 순 — git_commit(authored_at) · commit_file 의 A/M 만, 삭제된 파일과 머지 커밋 제외 {#clone-order-commit}
  - [x] 위상 폴백 — 커밋 20개 미만이면 unit.order_idx → import_edge 위상 정렬(T2 가 이미 만든 그래프 재사용) {#clone-order-dep}
  - [x] 순환·동률 처리 — SCC 는 경로 사전순으로 깨고 난수 0 {#clone-order-cycle}
  - [x] 결정성 골든 — 같은 픽스처를 두 번 돌려 order_json diff 0 {#clone-order-golden}

## P2 · 판 생성과 채점 (끝: 조각 하나를 치면 기존 T1 과 같은 기준으로 채점된다) {#p2}
- [x] 판 생성 — 원문 → 조각 → 스펙/마스크 · 1일 {#clone-plate-gen}
  - [x] ipc.file.readLines 로 원문을 읽는다 — Rust 명령 추가 0줄, 경로 검사는 기존 canonicalize 가 맡는다 {#clone-plate-read}
  - [x] segment()(t1-block.ts) 그대로 — 12~40줄·「…이어서」헤더·시그니처 범위까지 이미 있다 {#clone-plate-segment}
  - [x] t1-spec · t1-mask 재사용하여 조각마다 스펙 카드 {#clone-plate-spec}
  - [x] 지연 생성 — 코스를 열 때 목차만 계산하고 판은 필요할 때 한 장씩 {#clone-plate-lazy}
- [x] 페이딩 단계 규칙 — 코스 기본은 2단계(뼈대만), 대표 개념이 겹 3 이상이면 3단계(백지). card_state.stage 와 충돌하지 않게 · 0.3일 {#clone-fading}
- [x] 채점과 겹 반영 · 0.7일 {#clone-grading}
  - [x] t1-align · t1-ast · t1-result 재사용, 문턱 D83 그대로 {#clone-grading-reuse}
  - [x] 원장 제약 — review_log.session_id·session_item_id 가 NOT NULL 이고 원장은 ALTER ADD 만 허용이라 열을 풀 수 없다. 코스 실행마다 session 행 1개 + 조각마다 session_item 을 만들고, role 은 CHECK 목록 안의 'manual' 을 쓰며 코스 소속은 clone_step.review_log_id 로 가른다 {#clone-grading-ledger}
  - [x] 중복 방지 — 같은 블록이 오늘 큐에도 있으면 겹을 두 번 올리지 않는다 {#clone-grading-dedup}

## P3 · 화면 {#p3}
- [x] screens/clone/CloneScreen · 2.5일 {#clone-screen}
  - [x] 왼쪽 코스 목차 — 대지 → 파일 → 조각, 조각별 상태와 진행률 {#clone-screen-toc}
  - [x] 오른쪽은 기존 T1Plate 재사용 — 판 내부를 다시 지지 않는다 {#clone-screen-plate}
  - [x] 세션 오버레이가 아니라 별도 화면 — Esc 는「저장 후 나가기」한 겹만(세션의 4단계 규칙을 복사하지 않는다) {#clone-screen-esc}
  - [x] 진입 — 홈의 대지 카드에「이 대지 통째로 필사」, 서가·마스트헤드에「코스」 {#clone-screen-entry}
  - [x] 빈 상태 — 파일 하나짜리 리포처럼 코스가 서지 않는 경우를 정직하게 {#clone-screen-empty}

## P4 · 진행 저장과 게이트 (끝: 나갔다 와도 그 조각부터, 강제 종료에도 초안이 산다) {#p4}
- [x] 진행 저장·이어하기 · 1일 {#clone-resume}
  - [x] 조각마다 draft_text 자동 저장(T1 의 자동 저장 주기를 따른다) {#clone-resume-draft}
  - [x] 강제 종료 뒤 다시 열면 마지막 조각과 그 초안으로 복귀 {#clone-resume-crash}
  - [x] 재인제스트로 원본 파일이 바뀜 때 — text_hash 로 조각 무효화하고 그 자리를 다시 자른다 {#clone-resume-stale}
- [x] 게이트 · 1일 {#clone-gates}
  - [x] 순서 결정성 골든 · 조각 분할 골든 {#clone-gates-golden}
  - [x] 2,000 파일 리포 목차 계산 < 1.5s (T2 해석기와 같은 기준) {#clone-gates-perf}
  - [x] 이어하기 E2E 1건 — 조각 중간에 나갔다 돌아오면 그 자리 {#clone-gates-e2e}

<!-- oculpm:plan-log begin v1 -->
| 시각 | 항목 | 에이전트 | 변화 | 일지 | 메모 |
|---|---|---|---|---|---|
| 2026-09-04T09:54:51+09:00 | #clone-d120-row | claude-code | ☐→x |  | 상위가 팬아웃 전에 올렸다 |
| 2026-09-04T09:54:53+09:00 | #clone-d120-milestone | claude-code | ☐→x |  | docs/00 §5 에 M7 절 |
| 2026-09-04T09:54:54+09:00 | #clone-d120-canon | claude-code | ☐→! |  | 정본 §2 트랙 표에 코스 행 — 사용자 확인 대기 |
| 2026-09-04T09:54:56+09:00 | #clone-migration-run | claude-code | ☐→x |  | session_id 열을 더했다 — 이어하기가 판을 새 세션에 매달지 않도록 |
| 2026-09-04T09:54:58+09:00 | #clone-migration-step | claude-code | ☐→x |  | part·block_id·text_hash·session_item_id 를 더했다 |
| 2026-09-04T09:55:00+09:00 | #clone-migration-runner | claude-code | ☐→x |  | v0003 시드는 상위가 v0002+0003 으로 다시 구웠다 |
| 2026-09-04T09:55:07+09:00 | #clone-order-commit | claude-code | ☐→x |  |  |
| 2026-09-04T09:55:09+09:00 | #clone-order-dep | claude-code | ☐→x |  |  |
| 2026-09-04T09:55:10+09:00 | #clone-order-cycle | claude-code | ☐→x |  | 순환은 최소 경로에서 끊고 나머지 위상 관계는 유지 |
| 2026-09-04T09:55:12+09:00 | #clone-order-golden | claude-code | ☐→x |  | 입력 배열을 뒤집어 돌려도 order_json diff 0 — 픽스처 셋 |
| 2026-09-04T09:55:13+09:00 | #clone-plate-read | claude-code | ☐→x |  | Rust 0줄 — file_read_lines 만 |
| 2026-09-04T09:55:15+09:00 | #clone-plate-segment | claude-code | ☐→x |  |  |
| 2026-09-04T09:55:16+09:00 | #clone-plate-spec | claude-code | ☐→x |  |  |
| 2026-09-04T09:55:18+09:00 | #clone-plate-lazy | claude-code | ☐→x |  | 조각 수는 원문을 읽어야 알아서 part 열로 나눴다 |
| 2026-09-04T09:55:20+09:00 | #clone-fading | claude-code | ☐→x |  |  |
| 2026-09-04T09:55:21+09:00 | #clone-grading-reuse | claude-code | ☐→x |  |  |
| 2026-09-04T09:55:23+09:00 | #clone-grading-ledger | claude-code | ☐→x |  | 코스 세션은 elapsed_s 0 이라 예산 통계가 안 움직인다 |
| 2026-09-04T09:55:24+09:00 | #clone-grading-dedup | claude-code | ☐→x |  | 새 코드가 아니었다 — 스케줄러의 dayCeiling(R1)이 이미 막고 있다 |
| 2026-09-04T11:16:37+09:00 | #clone-d120-canon | claude-code | !→x | 20260904/Features_to_add/1116_feature_parallel-v03-course-screen-i18n-dict.md | 사용자 확인 — 트랙 표 아래 한 문단(행이 아니다). 00 §4.3 기록 |
| 2026-09-04T11:16:39+09:00 | #clone-screen-toc | claude-code | ☐→x | 20260904/Features_to_add/1116_feature_parallel-v03-course-screen-i18n-dict.md | CourseToc — 대지→파일→조각, 상태와 진행률 |
| 2026-09-04T11:16:41+09:00 | #clone-screen-plate | claude-code | ☐→x | 20260904/Features_to_add/1116_feature_parallel-v03-course-screen-i18n-dict.md | components/t1/* 조립. 왜 게이트·이의는 없다 — gradeCourseStep 이 안 받는다(D125) |
| 2026-09-04T11:16:44+09:00 | #clone-screen-esc | claude-code | ☐→x | 20260904/Features_to_add/1116_feature_parallel-v03-course-screen-i18n-dict.md | 한 겹, 버블 단계. 오버레이가 아니라 홈을 대신하는 화면(D125) |
| 2026-09-04T11:16:46+09:00 | #clone-screen-entry | claude-code | ☐→x | 20260904/Features_to_add/1116_feature_parallel-v03-course-screen-i18n-dict.md | 서가는 A, 홈 대지·마스트헤드 두 줄은 상위가 병합 뒤. openClone(scope) 한 문 |
| 2026-09-04T11:16:48+09:00 | #clone-screen-empty | claude-code | ☐→x | 20260904/Features_to_add/1116_feature_parallel-v03-course-screen-i18n-dict.md | 코스가 서지 않는 이유를 셋으로 갈라 말한다 |
| 2026-09-04T11:16:53+09:00 | #clone-resume-draft | claude-code | ☐→x | 20260904/Features_to_add/1116_feature_parallel-v03-course-screen-i18n-dict.md | draft_text 자동 저장. view==='edit' 일 때만 — step_save 가 status 를 active 로 되돌린다 |
| 2026-09-04T11:16:55+09:00 | #clone-resume-crash | claude-code | ☐→x | 20260904/Features_to_add/1116_feature_parallel-v03-course-screen-i18n-dict.md | 마지막 조각과 초안으로 복귀. E2E 1건이 왕복을 잡는다 |
| 2026-09-04T11:17:00+09:00 | #clone-resume-stale | claude-code | ☐→x | 20260904/Features_to_add/1116_feature_parallel-v03-course-screen-i18n-dict.md | text_hash 무효화 뒤 materializeFile 의 partFrom 오프셋으로 append — DELETE 없이, catalog 도 안 움직인다 |
| 2026-09-04T11:17:01+09:00 | #clone-gates-golden | claude-code | ☐→x | 20260904/Features_to_add/1116_feature_parallel-v03-course-screen-i18n-dict.md | 순서 결정성 7건 · 조각 분할 골든 |
| 2026-09-04T11:17:03+09:00 | #clone-gates-perf | claude-code | ☐→x | 20260904/Features_to_add/1116_feature_parallel-v03-course-screen-i18n-dict.md | 2,000 파일 목차 29~32ms / 예산 1,500ms |
| 2026-09-04T11:17:04+09:00 | #clone-gates-e2e | claude-code | ☐→x | 20260904/Features_to_add/1116_feature_parallel-v03-course-screen-i18n-dict.md | 이어하기 왕복 + 코스가 일일 큐를 건드리지 않는다. 시드의 line_count=0 을 스펙이 복원한다 |
<!-- oculpm:plan-log end -->
