---
oculpm_plan: v1
id: chickadee-v07-course
title: "0.7 코스 — 기능 경로를 다섯 단으로 가르친다 (D162 완성) + UX 감사"
status: active
created: 2026-09-05
updated: 2026-09-05
owner: claude-code
---

docs/program/ 넉 장을 코드로 옮긴다 — 문항 16유형 · 챕터 통과 판정 · 사전 proto/java/cs · 메서드 단위 경로와 스키마 · 코스 화면. 함께 앱을 실제로 돌려 UX 불편을 조사하고 고친다. 병렬 세션(D164~D171)로 진행.

## A · 문항 체계 16유형 (D164) {#a}
- [x] 마이그레이션 0008 — card.kind 다섯(twin·origin·cut·reorder·contract) + card.stage_no + appeal.track CHECK 확장. 0005 의 외래키-끄기 길 그대로 {#a-migration}
- [x] 1·2단 생성기 — point/twin/blank 재사용, exec 재사용, hop(요청 줄기 → (파일,줄) 순서, 매퍼에서 두 장으로), origin, caller {#a-stage12}
- [x] 3단 생성기 — cut(가드 카탈로그 넷) · reorder(AST 선언–사용) · contract(HTTP 간선 양끝 문자열 키) {#a-stage3}
- [x] 4·5단 생성기 — patch-line/patch-place/rollback(fix: 커밋 hunk) · reimpl-spec/reimpl-layer/handoff(채점 없음, 프롬프트 창은 앞뒤 4줄 그대로) {#a-stage45}
- [x] 채점기 — 유형마다 판정 + 오답 진단(i18n 카탈로그, LLM 0회). hop 은 인접 쌍 비율, 2단 통과는 전부 맞음 {#a-grading}
- [x] 문구 — packages/i18n ko 먼저 en 병기, 유형 16개 문항·진단 문구 {#a-i18n}

## B · 진도와 평가 (D165) {#b}
- [x] stage_log 쓰기 — 단 결과 기록 API(recordStageResult), chapter.stage_reached 갱신 {#b-record}
- [x] 챕터 통과 판정 — 1·2·3 ∧ (4단 문항이 있으면 4). 4단을 못 굽는 챕터는 3단까지가 통과(기본값, 사용자 결정 대기) {#b-pass}
- [x] 챕터 재검 — chapter 행의 S·D·due_at 에 fsrs.ts makeScheduler 그대로, 등급 Good/Hard/Again, Again 이면 stage_reached −1 {#b-review}
- [x] 오늘 15분 — 만기 재검 → 오늘 챕터의 다음 단. 예산 넘치면 다음 단을 자르고 재검은 남긴다 {#b-plan}
- [x] 막힘 — 2단은 경로 접기(5칸→3칸), 3단은 1단 개념 판 끼우기, 같은 챕터 dunno 3회면 그날 접기 {#b-stuck}
- [x] EVALS.md 갱신 — 챕터 통과·재검 원장 SQL 을 ledger 스위트에 {#b-evals}

## C · 사전 — proto · java · cs (D166 · D167) {#c}
- [x] proto/ 확장 — servlet-filter-chain · hmac-signature(HS256) · password-hashing(BCrypt) · unauthorized-vs-forbidden(401/403) · cors · rest-resource · stateless-session {#c-proto}
- [x] java/ 관문 0 — annotation · generics · import · access-modifier · interface · constructor · static · null · for-loop · try-catch (docs/curriculum/java.md) {#c-java-gate0}
- [x] java/ OOP 축 여덟 — 클래스 대 객체 · 생성 · 필드/메서드 · 상속·오버라이드 · 인터페이스 구현 · 다형성 · 캡슐화 · 의존성 주입(스프링 자리) {#c-java-oop}
- [x] fixtures/golden/java/** 개념당 양성 3·음성 2, golden.rs 목록에 java 추가, dict:lint 래칫 {#c-golden}
- [x] cs/ 신설 실체 — docs/curriculum/cs.md 의 43개, queries: [] · 사용처는 prereq 로 빌린다(D157) {#c-cs}
- [x] dict:lint — cs/·proto/ 네임스페이스 규칙(no_hole_reason) 과 관문 상한 40판 시험 {#c-lint}

## D · 그래프 — 메서드 단위 경로 · 스키마 (D168 · D169) {#d}
- [x] 요청 줄기 꼬리를 메서드 단위로 — 컨트롤러 메서드 → 서비스 메서드 → DAO 메서드 → 매퍼 id(이름 일치). 줄 번호가 import 줄이 아니라 호출 줄 {#d-callgraph}
- [x] 챕터 원소를 (fileId, byteRange) 로 — LandingView.vue 1,527줄 중 로그인 130줄만. AstLite 블록 재사용, unit_file 에 범위 {#d-byterange}
- [x] 비-HTTP 진입점 — @Scheduled(cron) · FastAPI 라우트 색인(.uri ↔ @app.post) · 프론트 라우터 뷰 {#d-entries}
- [x] 스키마 추출 — .sql DDL 의 표·열·외래키 → 표 하나, 매퍼 resultMap column ↔ DTO 필드 간선(origin 재료), 「스키마」 부록 챕터 재료 {#d-schema}
- [x] 죽은 코드 필터 — 폐포 안 파일이 실제로 호출되는가(useUserStorage 9함수 중 7 미호출), 졸업 과제 재료 {#d-dead}

## E · UX 감사와 수정 (D170) {#e}
- [x] docs/ux-audit.md — 앱을 실제로 돌려(mockIPC 하네스 + 필요하면 tauri dev) 불편을 찾고 근거(화면·파일:줄·사용자 보고 이력)와 함께 순위 {#e-audit}
- [x] 사용자 디자인 결정이 필요 없는 상위 항목 수정 — 흐름·키보드·문구·빈 상태·오류 상태·진행 표시 {#e-fixes}
- [x] 디자인 게이트·e2e-ui 통과, 사용자 결정이 필요한 항목은 표로 남긴다 {#e-gates}

## F · 코스 화면 (D171) {#f}
- [x] 코스 목차 화면 — 관문·챕터·막간·부록·졸업, 진도는 단(stage_reached)으로, 겹은 어휘 한 줄로 {#f-toc}
- [x] 단 화면 — 유형 16개 문항 컴포넌트(기존 T0 지목/빈칸·T1 편집기·T2 지도 재사용), 판정란 예약, Esc 네 겹 {#f-stages}
- [x] 어휘 관문 — 챕터 앞 6판(관문 0 은 12판), 상한 40판 {#f-gate}
- [x] App.tsx · flow.ts 배선 — 홈에서 코스로, 오늘 15분(재검 → 다음 단), 막힘 처방 화면 {#f-flow}

## G · 통합 · 검증 {#g}
- [x] 인제스트 배선 — writeUnits 가 entryUnits N:M + 디렉터리 규칙, 챕터·경로가 MonggleMonggle 에서 끝까지 서는지 {#g-ingest}
- [x] 전체 게이트 — typecheck · lint · test:unit · cargo test · dict:lint · check:rust · test:gates · test:e2e-ui {#g-gates}
- [x] IPC 덤프 재생성·커밋 {#g-ipc}
- [ ] 커밋(영어) · 푸시 · gh run watch 초록 확인 {#g-ship}
- [ ] 정본 갱신 요청 목록 — D159·D162·D170 이 정본 §2·§4·§9 에 요구하는 것을 사용자에게 {#g-canon}

<!-- oculpm:plan-log begin v1 -->
| 시각 | 항목 | 에이전트 | 변화 | 일지 | 메모 |
|---|---|---|---|---|---|
| 2026-09-05T10:08:52+09:00 | #b-record | claude-code | ☐→x | 20260905/Features_to_add/1008_feature_chapter-pass-recheck-and-today.md | chapter.sql 10 statement + recordStageResult |
| 2026-09-05T10:08:57+09:00 | #b-pass | claude-code | ☐→x | 20260905/Features_to_add/1008_feature_chapter-pass-recheck-and-today.md | 4단 없으면 3단까지 — 기본값, 사용자 결정 대기 |
| 2026-09-05T10:09:02+09:00 | #b-review | claude-code | ☐→x | 20260905/Features_to_add/1008_feature_chapter-pass-recheck-and-today.md | makeScheduler 를 챕터 행에 그대로 — 새 알고리즘 0 |
| 2026-09-05T10:09:07+09:00 | #b-plan | claude-code | ☐→x | 20260905/Features_to_add/1008_feature_chapter-pass-recheck-and-today.md | course-plan.ts — 재검은 안 잘린다. plan.ts 는 그대로 |
| 2026-09-05T10:09:13+09:00 | #b-stuck | claude-code | ☐→x | 20260905/Features_to_add/1008_feature_chapter-pass-recheck-and-today.md | stuckAction·foldPath — 새 action 값 0, 배선은 A7 |
| 2026-09-05T10:09:19+09:00 | #b-evals | claude-code | ☐→x | 20260905/Features_to_add/1008_feature_chapter-pass-recheck-and-today.md | C1~C5 신설, mastery.md 의 C4 모순을 고침 |
| 2026-09-05T10:26:51+09:00 | #a-migration | claude-code | ☐→x |  | 0008 — kind 다섯 · stage_no · appeal.track t3, v0008.db |
| 2026-09-05T10:26:53+09:00 | #a-stage12 | claude-code | ☐→x |  | twin · exec(자바 dialect) · hop · origin · caller |
| 2026-09-05T10:26:55+09:00 | #a-stage3 | claude-code | ☐→x |  | cut(가드 넷) · reorder(AstLite) · contract(+이유 4지) |
| 2026-09-05T10:26:57+09:00 | #a-stage45 | claude-code | ☐→x |  | fix 커밋 hunk 셋 · reimpl-spec/layer/handoff, 프롬프트 창 ±4 |
| 2026-09-05T10:26:59+09:00 | #a-grading | claude-code | ☐→x |  | gradeStage 하나 — 2단 100%, checkPlace, checkLinks, handoff 프롬프트 |
| 2026-09-05T10:27:01+09:00 | #a-i18n | claude-code | ☐→x |  | stage.* 113 + grading.stage* 17, ko·en |
| 2026-09-05T10:33:16+09:00 | #c-cs | claude-code | ☐→x | journal/20260905/Features_to_add/1033_feature_cs-namespace-43-concepts.md | cs/ 43장 + ts/py prereq 빌림 25편. 드롭 0. |
| 2026-09-05T10:33:22+09:00 | #c-lint | claude-code | ☐→x | journal/20260905/Features_to_add/1033_feature_cs-namespace-43-concepts.md | load.ts 주석 · D145 사유 명시 · cs 시험 둘. 스키마 무변경, 래칫 유지. |
| 2026-09-05T10:36:22+09:00 | #d-callgraph | claude-code | ☐→x | .oculpm/journal/20260905/Features_to_add/1036_feature_method-paths-schema-dead-branches.md | calls.ts + methodPaths/trunk — 로그인 등뼈 7칸, 회원가입 첫 칸부터 갈림 |
| 2026-09-05T10:36:25+09:00 | #d-byterange | claude-code | ☐→x | .oculpm/journal/20260905/Features_to_add/1036_feature_method-paths-schema-dead-branches.md | request_hop 의 line_start~line_end · path.ranges_by_unit — unit_file 은 그대로 |
| 2026-09-05T10:36:28+09:00 | #d-entries | claude-code | ☐→x | .oculpm/journal/20260905/Features_to_add/1036_feature_method-paths-schema-dead-branches.md | @Scheduled(coin) · FastAPI 라우트 색인 · 서버→서버 호출 파일은 진입점 아님. 프론트 라우터 뷰는 위로 오르기로 대신 |
| 2026-09-05T10:36:30+09:00 | #d-schema | claude-code | ☐→x | .oculpm/journal/20260905/Features_to_add/1036_feature_method-paths-schema-dead-branches.md | D169 — 표 9·외래키 10·열↔필드 74, 0009 db_* 표, schema.* statement |
| 2026-09-05T10:36:32+09:00 | #d-dead | claude-code | ☐→x | .oculpm/journal/20260905/Features_to_add/1036_feature_method-paths-schema-dead-branches.md | dead_branch 4종 표시만 — 실측 2·4·31·1 |
| 2026-09-05T10:36:34+09:00 | #g-ingest | claude-code | ☐→x | .oculpm/journal/20260905/Features_to_add/1036_feature_method-paths-schema-dead-branches.md | deriveRepo 가 줄기·스키마·갈래까지 쓴다 — 인메모리 SQLite 시험 4 + 실리포 캡처 덤프 파이프라인 실측 |
| 2026-09-05T10:40:43+09:00 | #c-proto | claude-code | ☐→x | 20260905/Features_to_add/1040_feature_java-gate0-oop-and-proto-seven.md | proto/ 일곱 — 근거 낱말을 좁게, 실리포 경로 매치는 그대로 둘 |
| 2026-09-05T10:40:51+09:00 | #c-java-gate0 | claude-code | ☐→x | 20260905/Features_to_add/1040_feature_java-gate0-oop-and-proto-seven.md | 관문 0 열 — import 759 · 애너테이션 702 · 접근 제어자 580 곳 |
| 2026-09-05T10:40:58+09:00 | #c-java-oop | claude-code | ☐→x | 20260905/Features_to_add/1040_feature_java-gate0-oop-and-proto-seven.md | OOP 축 — universal 일곱은 common/ 이 비어 null 로 두었다 |
| 2026-09-05T10:41:05+09:00 | #c-golden | claude-code | ☐→x | 20260905/Features_to_add/1040_feature_java-gate0-oop-and-proto-seven.md | fixtures/golden/java 139파일 · golden.rs 목록에 ("java", 13) |
| 2026-09-05T10:47:59+09:00 | #e-audit | claude-code | ☐→x | 20260905/Features_to_add/1047_feature_ux-audit-run-and-fixes-d170.md | docs/ux-audit.md — 21건, 스크린샷·계측 근거, D126~D147 재확인 표 |
| 2026-09-05T10:48:02+09:00 | #e-fixes | claude-code | ☐→x | 20260905/Features_to_add/1047_feature_ux-audit-run-and-fixes-d170.md | 13건 고침 — hl 글자 누락·판 머리 숨김·토스트 영구·미리보기 판 수·문구 5·띠 한 줄·코스 포커스·목차 경로·설정 홈으로 |
| 2026-09-05T10:48:05+09:00 | #e-gates | claude-code | ☐→x | 20260905/Features_to_add/1047_feature_ux-audit-run-and-fixes-d170.md | 워크트리(HEAD+변경) e2e-ui 34·gates 114 통과 두 엔진 — 기준선은 5·7 실패였다(D140·D147 이 시나리오를 안 고침). 공유 트리 vitest 2,183 통과 |
| 2026-09-05T11:51:31+09:00 | #g-ingest | claude-code | x→x | 20260905/Features_to_add/1152_feature_course-bake-package-and-borrowing.md | D172 — @chickadee/course 가 챕터 카드·사용처 없는 개념 카드를 굽는다(bakeCourse·bakeSiteless). 앱 배선(인제스트 뒤·챕터 열 때)은 A7/통합 몫 |
| 2026-09-05T11:51:39+09:00 | #g-ingest | claude-code | x→x | 20260905/Features_to_add/1151_feature_course-bake-package-and-borrowing.md | 일지 경로 정정 (앞 행의 1152 → 1151) |
| 2026-09-05T11:55:15+09:00 | #f-toc | claude-code | ☐→x |  | ChapterToc + ChapterPanel + 오늘 15분(TimeQueue) |
| 2026-09-05T11:55:18+09:00 | #f-stages | claude-code | ☐→x |  | StageOverlay + 판 다섯 모양 + StuckPanel + StageDone. hop 은 지도 없이 덱만 |
| 2026-09-05T11:55:20+09:00 | #f-gate | claude-code | ☐→x |  | planGates 12/6/40 + pickPlateNow 로 기존 교정쇄에 끼움 |
| 2026-09-05T11:55:23+09:00 | #f-flow | claude-code | ☐→x |  | App.tsx 코스 분기 · flow.ts openCourse/closeCourse + 인제스트 뒤 bakeCourse/bakeSiteless |
| 2026-09-05T12:08:29+09:00 | #g-gates | claude-code | ☐→x | .oculpm/journal/20260905/Features_to_add/1207_feature_v07-course-parallel-integration.md | typecheck·lint·unit 2231·cargo·clippy·rust 2524·dict:lint·design·contrast·motion·gates 114·e2e-ui 26 전부 통과, D173 처방 포함 |
| 2026-09-05T12:08:32+09:00 | #g-ipc | claude-code | ☐→x | .oculpm/journal/20260905/Features_to_add/1207_feature_v07-course-parallel-integration.md | 파이프라인 시험 16 ok 로 fixtures/ipc 재생성(t2.json·captures-all.json), 커밋에 포함 |
<!-- oculpm:plan-log end -->
