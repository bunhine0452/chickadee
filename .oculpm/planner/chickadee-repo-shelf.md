---
oculpm_plan: v1
id: chickadee-repo-shelf
title: "리포 서가 — 여러 리포를 추가·전환·이동·삭제하는 화면"
status: done
created: 2026-09-04
updated: 2026-09-04
owner: claude-code
---

요청 2. 데이터 층은 이미 다 있다 — packages/concepts/src/repos.ts 의 register·list·relocate·remove 와 status(ok|missing|detached) 파생. 없는 것은 화면뿐이고, 지금은 첫 리포를 등록하고 나면 두 번째 리포를 추가할 문이 UI 에 없다(FirstRun 은 repos.length === 0 에서만 뜬다). 마스트헤드 리포 칸은 disabled 스텁이다(Masthead.tsx:60). 사용자 결정: 서가 화면 신설 + 스위처 둘 다. chickadee-i18n 의 P1(뼈대) 뒤에 착수해 새 문구를 처음부터 t() 로 쓴다. Rust 추가 0줄, SQL 은 TS 쪽이라 예산과 무관.

## P0 · 결정 등록부 — D119 (문서 수정 전 선행) {#p0}
- [x] D119 — 리포 서가(repos) 화면 신설 · 0.3일 {#shelf-d119}
  - [x] docs/00-overview.md §4.2.1 에 D119 행 {#shelf-d119-row}
  - [x] docs/05-frontend.md §2.1 화면 표에 repos 행 추가 {#shelf-d119-screen-table}
  - [x] docs/05 §2.4「창 크기 · 다중 리포」를 서가 + 스위쳐 두 길로 갱신 {#shelf-d119-multi-repo}

## P1 · 데이터와 화면 상태 {#p1}
- [x] statements/repo.sql 에 repo.overview 추가 · 0.5일 {#shelf-overview-sql}
  - [x] 리포별 마지막 인제스트 · 개념 수 · 평균 겹 · 오늘 큐 길이를 한 번에 — listRepos 처럼 리포마다 probe 를 부르지 않는다 {#shelf-overview-sql-shape}
  - [x] pnpm catalog:build 재생성 + rows/zod 타입 {#shelf-overview-sql-catalog}
  - [x] 단위 테스트 — 리포 0개·다수, 인제스트 전 리포의 NULL 처리 {#shelf-overview-sql-test}
- [x] store.ts — 'repos' 화면과 리포 전환 액션 · 0.3일 {#shelf-store}
  - [x] Screen 유니온에 'repos' {#shelf-store-screen}
  - [x] setActive(id) — activeId 교체 + home 을 null 로 비워 재조회 유도 {#shelf-store-setactive}
  - [x] 세션 중 전환 금지 가드 — 05 §2.4, 진행 중 세션은 리포별로 저장되므로 다녀와도 이어진다 {#shelf-store-guard}

## P2 · 화면 (끝: 리포 둘을 등록해 오가며 학습하고, 옮긴 리포를 다시 붙이고, 하나를 지운다) {#p2}
- [x] screens/repos/ReposScreen · 1.2일 (선행: D119 · repo.overview) {#shelf-screen}
  - [x] 리포 카드 — 이름·경로·상태 배지(ok·missing·detached)·마지막 인제스트·평균 겹·오늘 큐 {#shelf-screen-cards}
  - [x] 「리포 추가」— App.tsx 의 pickFolder 를 공유로 올리고 addRepo 재사용 {#shelf-screen-add}
  - [x] missing 이면「위치 알려주기」→ relocateRepo (첫 커밋 불일치 오류 문구 포함) {#shelf-screen-relocate}
  - [x] 「목록에서 빼기 / 전부 지우기」→ removeRepo(purge) 2단 확인 — purge 에도 카드는 은퇴만 된다는 것을 문구로 {#shelf-screen-remove}
  - [x] 빈 상태·접근성 — 키보드만으로 전부 주행, axe serious 0 {#shelf-screen-a11y}
- [x] Masthead 의 disabled 스텁을 RepoSwitcher 로 · 0.5일 {#shelf-switcher}
  - [x] 05 §2.4 그대로 button[aria-haspopup=listbox] + ul[role=listbox], 방향키·Esc {#shelf-switcher-listbox}
  - [x] 목록 끝에「전부 보기」→ repos 화면 {#shelf-switcher-all}
  - [x] 세션 중 비활성 — 작업 띄에는 리포명만 {#shelf-switcher-session}
- [x] 진입 규칙 — 리포 0개면 first-run, 1개 이상이면 마지막으로 본 리포로 바로 홈. 서가는 스위쳐·설정에서 열린다 · 0.2일 {#shelf-entry}
- [x] 설정 화면「리포」절을 읽기 전용으로 남기고 서가로 가는 문만 둔다 — 관리 자리가 둘이 되지 않게 · 0.2일 {#shelf-settings-link}

## P3 · 검증 {#p3}
- [x] 테스트 · 0.5일 {#shelf-tests}
  - [x] ReposScreen 단위 — 세 상태 배지·삭제 확인 2단·missing 흐름 {#shelf-tests-unit}
  - [x] 전환 후 홈과 오늘의 인쇄가 새 리포 것으로 갱신되는지(refreshHome · previewToday) {#shelf-tests-switch}
  - [x] tests/gates 에 서가 화면 한 장 추가(대비·행 길이·폰트) {#shelf-tests-gates}

<!-- oculpm:plan-log begin v1 -->
| 시각 | 항목 | 에이전트 | 변화 | 일지 | 메모 |
|---|---|---|---|---|---|
| 2026-09-04T09:53:01+09:00 | #shelf-d119-row | claude-code | ☐→x |  | 상위가 팬아웃 전에 올렸다 — 워크트리가 그 커밋보다 앞서 갈라져서 |
| 2026-09-04T09:53:02+09:00 | #shelf-d119-screen-table | claude-code | ☐→x |  |  |
| 2026-09-04T09:53:04+09:00 | #shelf-d119-multi-repo | claude-code | ☐→x |  | §2.4 를 스위처·서가 두 길 + 진입 규칙으로 다시 씀 |
| 2026-09-04T09:53:05+09:00 | #shelf-overview-sql-shape | claude-code | ☐→x |  | CTE 셋(placed·ink·due). probe 는 첫 그림 뒤에만 |
| 2026-09-04T09:53:07+09:00 | #shelf-overview-sql-catalog | claude-code | ☐→x |  |  |
| 2026-09-04T09:53:08+09:00 | #shelf-overview-sql-test | claude-code | ☐→x |  |  |
| 2026-09-04T09:53:10+09:00 | #shelf-store-screen | claude-code | ☐→x |  |  |
| 2026-09-04T09:53:12+09:00 | #shelf-store-setactive | claude-code | ☐→x |  | 보던 리포가 목록에서 사라질 때 first-run 으로 떨어지던 버그도 같이 |
| 2026-09-04T09:53:13+09:00 | #shelf-store-guard | claude-code | ☐→x |  |  |
| 2026-09-04T09:53:15+09:00 | #shelf-screen-cards | claude-code | ☐→x |  |  |
| 2026-09-04T09:53:16+09:00 | #shelf-screen-add | claude-code | ☐→x |  | pickFolder 를 screens/repos/data.ts 로 올려 FirstRun 과 공유 |
| 2026-09-04T09:53:18+09:00 | #shelf-screen-relocate | claude-code | ☐→x |  |  |
| 2026-09-04T09:53:20+09:00 | #shelf-screen-remove | claude-code | ☐→x |  | 카드 안 2단 확인(모달 없음 — Esc 주인을 하나로) |
| 2026-09-04T09:53:22+09:00 | #shelf-screen-a11y | claude-code | ☐→x |  | --ink-soft 가 --desk 위에서 6.19:1 이라 서가를 종이 패널로 올림 |
| 2026-09-04T09:53:23+09:00 | #shelf-switcher-listbox | claude-code | ☐→x |  |  |
| 2026-09-04T09:54:39+09:00 | #shelf-switcher-all | claude-code | ☐→x |  |  |
| 2026-09-04T09:54:41+09:00 | #shelf-switcher-session | claude-code | ☐→x |  |  |
| 2026-09-04T09:54:43+09:00 | #shelf-entry | claude-code | ☐→x |  | settings.lastRepoId 로 마지막 리포 복귀까지 — 저장은 activeId 한 자리에서 |
| 2026-09-04T09:54:44+09:00 | #shelf-settings-link | claude-code | ☐→x |  | 설정 「리포」 절은 읽기 전용 + 서가로 가는 문 하나 |
| 2026-09-04T09:54:46+09:00 | #shelf-tests-unit | claude-code | ☐→x |  |  |
| 2026-09-04T09:54:48+09:00 | #shelf-tests-switch | claude-code | ☐→x |  |  |
| 2026-09-04T09:54:49+09:00 | #shelf-tests-gates | claude-code | ☐→x |  |  |
<!-- oculpm:plan-log end -->
