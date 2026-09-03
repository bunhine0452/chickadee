---
oculpm_plan: v1
id: chickadee-clone-course
title: "프로젝트 전체 클론 코스 — 리포 하나를 순서대로 통째로 필사"
status: active
created: 2026-09-04
updated: 2026-09-04
owner: claude-code
---

요청 4. 지금 T1 은 12~40줄 블록 하나짜리다(cards/src/t1-block.ts). 사용자 결정: 일일 큐(D12 10~25분) 밖 별도 모드, 결과는 review_log 로 개념 겹에 반영. 재사용이 핵심이라 새로 짜는 것은 순서·진행 원장·화면 셋뿐이다 — 41줄 이상을 12~40줄 조각으로 자르고 「…이어서」 헤더를 붙이는 segment() 와 채점기 t1-align·t1-ast·t1-result 는 그대로 쓴다. Rust 추가 0줄(예산 2300/2300, 여유 0): 원문은 기존 file_read_lines 로 읽는다. 네 플랜 중 가장 크고, 새 문구가 많으므로 chickadee-i18n P1 뒤에 착수한다.

## P0 · 결정 등록부와 정본 (사용자 확인이 선행) {#p0}
- [ ] D116 — 클론 코스는 일일 큐 밖 별도 모드 · 0.3일 {#clone-d116}
  - [ ] docs/00-overview.md §4.2.1 에 D116 행 — 예산 D12 를 건드리지 않고 겹만 공유하는 근거 {#clone-d116-row}
  - [ ] 정본 §2 트랙 표에 코스 행이 필요하므로 docs/00 §4.3「정본 갱신」후보로 먼저 올리고 사용자 확인 {#clone-d116-canon}
  - [ ] docs/00 §5 에 M7 배치 행 추가 {#clone-d116-milestone}

## P1 · 원장과 순서 (끝: 같은 리포를 두 번 열면 같은 코스 순서가 나온다) {#p1}
- [ ] 0003_clone.sql 마이그레이션 · 0.5일 (선행: D116) {#clone-migration}
  - [ ] clone_run(repo_id · mode 'commit'|'dep' · scope 'repo'|'unit' · unit_id · status · order_json · started_at · finished_at) {#clone-migration-run}
  - [ ] clone_step(run_id · seq · file_id · line_start · line_end · status · pct · elapsed_s · draft_text · review_log_id · done_at) {#clone-migration-step}
  - [ ] SCHEMA_VERSION · catalog 갱신 + 마이그레이션 테스트(백업 · 상위 버전 거부). 새 테이블이라 02 §2.2 의「원장은 추가만」을 어기지 않는다 {#clone-migration-runner}
- [ ] 코스 순서 산출 · 1.5일 {#clone-order}
  - [ ] 커밋 순 — git_commit(authored_at) · commit_file 의 A/M 만, 삭제된 파일과 머지 커밋 제외 {#clone-order-commit}
  - [ ] 위상 폴백 — 커밋 20개 미만이면 unit.order_idx → import_edge 위상 정렬(T2 가 이미 만든 그래프 재사용) {#clone-order-dep}
  - [ ] 순환·동률 처리 — SCC 는 경로 사전순으로 깨고 난수 0 {#clone-order-cycle}
  - [ ] 결정성 골든 — 같은 픽스처를 두 번 돌려 order_json diff 0 {#clone-order-golden}

## P2 · 판 생성과 채점 (끝: 조각 하나를 치면 기존 T1 과 같은 기준으로 채점된다) {#p2}
- [ ] 판 생성 — 원문 → 조각 → 스펙/마스크 · 1일 {#clone-plate-gen}
  - [ ] ipc.file.readLines 로 원문을 읽는다 — Rust 명령 추가 0줄, 경로 검사는 기존 canonicalize 가 맡는다 {#clone-plate-read}
  - [ ] segment()(t1-block.ts) 그대로 — 12~40줄·「…이어서」헤더·시그니처 범위까지 이미 있다 {#clone-plate-segment}
  - [ ] t1-spec · t1-mask 재사용하여 조각마다 스펙 카드 {#clone-plate-spec}
  - [ ] 지연 생성 — 코스를 열 때 목차만 계산하고 판은 필요할 때 한 장씩 {#clone-plate-lazy}
- [ ] 페이딩 단계 규칙 — 코스 기본은 2단계(뼈대만), 대표 개념이 겹 3 이상이면 3단계(백지). card_state.stage 와 충돌하지 않게 · 0.3일 {#clone-fading}
- [ ] 채점과 겹 반영 · 0.7일 {#clone-grading}
  - [ ] t1-align · t1-ast · t1-result 재사용, 문턱 D83 그대로 {#clone-grading-reuse}
  - [ ] 원장 제약 — review_log.session_id·session_item_id 가 NOT NULL 이고 원장은 ALTER ADD 만 허용이라 열을 풀 수 없다. 코스 실행마다 session 행 1개 + 조각마다 session_item 을 만들고, role 은 CHECK 목록 안의 'manual' 을 쓰며 코스 소속은 clone_step.review_log_id 로 가른다 {#clone-grading-ledger}
  - [ ] 중복 방지 — 같은 블록이 오늘 큐에도 있으면 겹을 두 번 올리지 않는다 {#clone-grading-dedup}

## P3 · 화면 {#p3}
- [ ] screens/clone/CloneScreen · 2.5일 {#clone-screen}
  - [ ] 왼쪽 코스 목차 — 대지 → 파일 → 조각, 조각별 상태와 진행률 {#clone-screen-toc}
  - [ ] 오른쪽은 기존 T1Plate 재사용 — 판 내부를 다시 지지 않는다 {#clone-screen-plate}
  - [ ] 세션 오버레이가 아니라 별도 화면 — Esc 는「저장 후 나가기」한 겹만(세션의 4단계 규칙을 복사하지 않는다) {#clone-screen-esc}
  - [ ] 진입 — 홈의 대지 카드에「이 대지 통째로 필사」, 서가·마스트헤드에「코스」 {#clone-screen-entry}
  - [ ] 빈 상태 — 파일 하나짜리 리포처럼 코스가 서지 않는 경우를 정직하게 {#clone-screen-empty}

## P4 · 진행 저장과 게이트 (끝: 나갔다 와도 그 조각부터, 강제 종료에도 초안이 산다) {#p4}
- [ ] 진행 저장·이어하기 · 1일 {#clone-resume}
  - [ ] 조각마다 draft_text 자동 저장(T1 의 자동 저장 주기를 따른다) {#clone-resume-draft}
  - [ ] 강제 종료 뒤 다시 열면 마지막 조각과 그 초안으로 복귀 {#clone-resume-crash}
  - [ ] 재인제스트로 원본 파일이 바뀜 때 — text_hash 로 조각 무효화하고 그 자리를 다시 자른다 {#clone-resume-stale}
- [ ] 게이트 · 1일 {#clone-gates}
  - [ ] 순서 결정성 골든 · 조각 분할 골든 {#clone-gates-golden}
  - [ ] 2,000 파일 리포 목차 계산 < 1.5s (T2 해석기와 같은 기준) {#clone-gates-perf}
  - [ ] 이어하기 E2E 1건 — 조각 중간에 나갔다 돌아오면 그 자리 {#clone-gates-e2e}

<!-- oculpm:plan-log begin v1 -->
| 시각 | 항목 | 에이전트 | 변화 | 일지 | 메모 |
|---|---|---|---|---|---|
<!-- oculpm:plan-log end -->
