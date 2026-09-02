---
oculpm_plan: v1
id: chickadee-build
title: "Chickadee 구현 플랜 — 설계 문서 docs/00~06 의 체크리스트 87개를 마일스톤 M0~M6 로"
status: active
created: 2026-09-02
updated: 2026-09-02
owner: claude-code
---

정본은 .oculpm/discussion/vibe-code-study-app/discussion.md 「결론」, 배치 근거와 결정 등록부는 docs/00-overview.md §4·§5. 항목 제목은 각 설계 문서(docs/01~06)의 구현 체크리스트 원문이며 문서 번호가 앞에 붙는다. 규모는 1인 기준 일수.

## M0 · 골격 — 워크스페이스 · CI · 토큰 · 픽스처 (끝: 빈 창 3-OS, 0001_init 적용 DB, 토큰 게이트·Rust 예산 CI 통과, tiny 픽스처 해시 결정성) {#m0}
- [x] 01 · 워크스페이스 스캐폴드 — Cargo/pnpm 워크스페이스, Tauri 2 창 1개, CI(lint·test·check-rust-budget.sh), tauri-action 3-OS · 2일 {#m0-01-workspace}
- [x] 05 · 워크스페이스·Tauri 2 골격 — apps/desktop + packages, Vite, ESLint/Stylelint, tauri.conf.json 창·CSP 전제 · 1일 (선행: 01 스캐폴드) {#m0-05-tauri-skeleton}
- [x] 01 · ipc-client 패키지 — typed client, IpcError, 이벤트 리스너, STORE_BUSY 재시도, dev 패널 타이머 · 1일 (선행: 01 스캐폴드) {#m0-01-ipc-client}
- [x] 01 · store 크레이트 — open/migrate/catalog/query/exec/batch, 행→JSON 규칙, 인메모리 DB 테스트 · 2일 (선행: 01 스캐폴드) {#m0-01-store-crate}
- [x] 02 · 마이그레이션 러너 — user_version 순차 적용·백업·상위 버전 거부, 0001_init.sql 적용 · 1일 (선행: store 크레이트) {#m0-02-migration-runner}
- [x] 01 · store-sql 패키지 — 0001_init.sql, statement 카탈로그, build-catalog.ts 로 StatementMap 생성 · 2일 (선행: 02 DDL REVIEW 반영본) {#m0-01-store-sql}
- [x] 02 · db/sql + fromRow 계층 — 테이블별 변환기·zod 스키마·트랜잭션 헬퍼, 왕복 테스트 · 2일 (선행: store-sql) {#m0-02-db-sql-layer}
- [x] 02 · 하루 경계·시각 유틸 — dayKey·endOfDay·labelFor(due), 시간대·04:00 경계 테스트 · 0.5일 {#m0-02-day-utils}
- [x] 04 · 공통 시드·PRNG·토크나이저 — seedOf·mulberry32·다중문자 op 토크나이저, 결정성 골든 테스트 · 1일 {#m0-04-seed-tokenizer}
- [x] 01 · T3 자리 — RunnerAdapter 인터페이스, t3_run → NOT_IMPLEMENTED, track 열거형 예약 · 0.5일 (선행: store-sql) {#m0-01-t3-slot}
- [x] 05 · 토큰·리셋·인쇄 물리·폰트 동봉 — sync-design.mjs(--check), check-contrast.mjs, Stylelint 커스텀 룰 4개, fonts.css + OFL 고지, document.fonts.ready 게이트 · 2일 (선행: 05 골격) {#m0-05-tokens-fonts}
- [x] 05 · 마스코트 DeeSprite·Dee·useDeeMotion — 심볼 3종+로고, data-ly 노드 동일성 테스트, 감축·타이핑 중 규칙, ?dev=1 실루엣 검사 이식 · 1일 (선행: 토큰) {#m0-05-dee-sprite}
- [x] 05 · 프리미티브 12종 + dev/Gallery — Pill·Passes·Kbd·PressButton·FlatButton·Switch·Reg·Stamp·Say·Toast·LiveRegion·Misreg, 단위 테스트 · 2일 (선행: 토큰) {#m0-05-primitives}
- [x] 06 · Q1 픽스처 리포 생성 스크립트 — make-fixture-repo.sh + tiny·projectox-like·two-commits .steps, 해시 결정성 · 1일 (선행: 01 스캐폴드) {#m0-06-q1-fixture-repos}
- [x] 06 · Q7 ci.yml + audit 잡 — lint/type/unit/integration/gates/audit, SHA 고정, 캐시, check-rust-budget.sh · 1일 (선행: 01 스캐폴드; integration·gates 잡은 M1·M2 에서 채움) {#m0-06-q7-ci}
- [x] 06 · Q11 Tauri 보안 설정 — CSP, capabilities 최소화, deny_unknown_fields·zod, react/no-danger 규칙 · 1일 (선행: 01 스캐폴드) {#m0-06-q11-tauri-security}

## M1 · 인제스트 수직 절단 — 리포 등록 → 캡처 → concept_site → 홈에 「판이 없는 문법」 (끝: projectox 등록 15s 안, 홈이 목업과 같은 모양으로 실데이터, 리포 트리 해시 불변·로그 소스 0·IPC 덤프 diff 0·Rust ≤1500줄) {#m1}
- [x] 01 · git 크레이트 — open/fingerprint/commits/commit_files/blob, 픽스처 bundle · 2일 (선행: M0) {#m1-01-git-crate}
- [x] 03 · diff hunk → CommitRec — commit_file 쓰기·리네임 감지·touched 압축·공백 무시 통계 · 1.5일 (선행: git 크레이트) {#m1-03-diff-commitrec}
- [x] 01 · parse 크레이트 — langs.rs(TS·TSX·SQL), parse+query, AstLite, 타임아웃, 골든 스니펫 테스트 · 3일 (선행: 03 캡처 규약 D18) {#m1-01-parse-crate}
- [x] 03 · 문법 크레이트 고정 + 언어 감지 + 파서 풀 — 핀·feature·parse_quality(확장자 표는 TS) · 1.5일 (선행: parse 크레이트) {#m1-03-grammar-pool}
- [x] 01 · 인제스트 잡 러너 — 워커 스레드, parse 풀, 해시 증분, 취소 토큰, 진행 이벤트, 500행 tx · 3일 (선행: store·git·parse) {#m1-01-ingest-runner}
- [x] 03 · 워킹트리 스캔 + 진행률 채널 + 취소·이어하기 — is_dirty·ingest_warning·재스캔 3시점 · 1일 (선행: 잡 러너) {#m1-03-worktree-progress}
- [x] 03 · sqlite 쓰기·증분 — TS 재파생 증분·site_key 유지·is_reachable · 1.5일 (선행: 잡 러너·쿼리 실행기) {#m1-03-sqlite-incremental}
- [x] 01 · 파일 맥락 명령 — file_read_lines/block 작업 트리·rev 양쪽, 상한·UTF-8 lossy · 1일 (선행: git 크레이트) {#m1-01-file-context}
- [x] 03 · blame 2차 패스 — git_blame_lines 명령 + TS 배경 잡, 파일당 2초 컷 · 1일 (선행: 파일 맥락 명령) {#m1-03-blame-pass}
- [x] 01 · 사전 명령 + dictionary 패키지 — dict_list/read/cache_*, zod 스키마, 사용자 오버라이드 우선 · 2일 (선행: 03 YAML 스키마) {#m1-01-dict-commands}
- [x] 03 · 사전 스키마·린트 — JSON Schema, TS 타입 생성, pnpm dict:lint(조사·금지어·참조·템플릿 변수), Rust 쿼리 테스트 · 2일 (선행: 사전 1차) {#m1-03-dict-lint}
- [x] 03 · TS 사전 1차 — 바닥 개념 10 + 개념 11 의 yaml+scm, _lang.yaml essential/alternatives · 4일 (선행: 쿼리 실행기) {#m1-03-dict-ts-v1}
- [x] 03 · 크레이트 골격 chickadee-ingest — packages/concepts 파생 층 골격·identity 매칭·커밋 kind·필터 기본값(전부 TS) · 1.5일 (선행: dictionary 패키지) {#m1-03-ingest-skeleton}
- [x] 03 · 쿼리 실행기 — Rust inError 플래그 + TS derive.ts Site 변환·lineConcepts·uncoveredRatio·shape·site_key · 3일 (선행: parse 크레이트·04 토크나이저) {#m1-03-query-runner}
- [x] 03 · 골든 픽스처 — TS 개념 20개 양성/음성, 깨진 파일 픽스처, UPDATE_GOLDEN · 1.5일 (선행: 쿼리 실행기·Q1) {#m1-03-golden-fixtures}
- [x] 06 · Q2 Rust 파서·쿼리 골든 — insta 스냅샷 TS/TSX/SQL 각 15케이스 · 1일 (선행: 쿼리 실행기·Q1) {#m1-06-q2-parser-golden}
- [x] 03 · 미지 개념 개수·첫 노출 선택(TS) — unknownCount, 동률 규칙, shape 다양성 · 1.5일 (선행: 사전 1차·파생 층) {#m1-03-unknown-count}
- [x] 02 · 미지 개념 계산 — known 집합·전이·증분 재계산·gap 갱신 · 1.5일 (선행: 03 미지 개념 개수) {#m1-02-unknown-cache}
- [x] 03 · 문법 구멍 지도 집계(TS) — essential 집계·thin 판정·alternatives 부기·판 만들기 큐 삽입 · 1.5일 (선행: 02 미지 개념 계산·D29 대지 탐지) {#m1-03-gap-map}
- [x] 01 · 오류 모델 배선 — thiserror → IpcError → 문구 표, 로그 금지 필드 skip, 회전 · 1일 (선행: 각 크레이트) {#m1-01-error-model}
- [x] 01 · 리포 이동/삭제 흐름 — missing 상태, repo_relocate fingerprint 검증, purge 시 자산 보존 테스트 · 1일 (선행: git·store-sql) {#m1-01-repo-relocate}
- [x] 06 · Q8 로그 안전 래퍼 — Rust log_safe! + clippy 금지, TS logger.ts + no-console, 통합 테스트 grep · 1일 (선행: 오류 모델) {#m1-06-q8-log-safe}
- [x] 06 · Q10 악성 입력 방어 — 파일·행·깊이·타임아웃 상한, 심볼릭 링크·경로 탈출 거부, fixtures/evil·evil-dict, DOMPurify RichText 단일화 · 2일 (선행: 잡 러너·Q8) {#m1-06-q10-evil-input}
- [x] 05 · 홈 화면 — Masthead·RepoSwitcher·TodayPanel·TimeQueue·InkScale·ConceptList·GapsPanel·Sheet·Node·NodeDetail·Guide·Forecast·ColorBar, home.load · 3일 (선행: 프리미티브·02 홈 쿼리) {#m1-05-home}
- [!] 05 · WKWebView 성능 첫 실측 — ?stress=48 이식, __audit.perf, performance.mark 6종, Web Inspector 절차 · 1일 (선행: 홈) {#m1-05-wkwebview-perf}
- [x] 05 · 인제스트·첫 실행·안내·설정 — 폴더 선택, 진행 이벤트를 TimeQueue 로, 빈 상태, newcomer 시트, 설정(identity 포함) · 2일 (선행: 홈·01 이벤트) {#m1-05-ingest-onboarding}
- [ ] 03 · 성능 픽스처·벤치 — large-100k 생성기·criterion·CI 임계 · 1.5일 (선행: 증분까지·Q1) {#m1-03-perf-bench}
- [x] 03 · Swift·Dart·SQL 품질 검증 — 실코드 20파일 ERROR 비율, 통과 시 바닥 개념 착수, 실패 시 보류 결정 · 2일 (선행: 파서 풀) {#m1-03-swift-dart-sql}
- [x] 03 · projectox 실리포 검증 — TS/TSX/SQL 인제스트, Site 수·구멍 지도가 목업과 같은 모양인지 · 1일 (선행: 구멍 지도) {#m1-03-projectox-check}

## M2 · T0 세션 수직 절단 — 큐 → T0 카드 → 채점 → 겹 → 요약, 사다리·LIFER (끝: 인쇄 시작부터 요약까지 실데이터 한 흐름, Esc 후 이어 찍기, 검산 6건·rebuild_mastery==mastery·IPC 0회·판정란 0px·13px·7:1) {#m2}
- [ ] 02 · FSRS 어댑터 — ts-fsrs 래핑, 등급 매핑, scheduler_params 로드, 궤적 검산(1.2→3.8→11→30) · 1.5일 (선행: 시각 유틸) {#m2-02-fsrs-adapter}
- [ ] 02 · 겹 리듀서 — beginDay·applyOutcome·shownLayer, 검산 6건 테스트 · 1일 (선행: FSRS 어댑터) {#m2-02-layer-reducer}
- [ ] 02 · 새 개념 순위 — 위상 정렬·후보 SQL·bestSite·level 규칙·초보 감지 플래그 · 1.5일 (선행: M1 미지 개념 계산) {#m2-02-new-concept-rank}
- [ ] 02 · 큐 플래너 — 예산 15분 맞추기, 순서, 빈 상태, 하루 여러 세션 · 2일 (선행: 새 개념 순위·FSRS 어댑터) {#m2-02-queue-planner}
- [ ] 02 · 세션 중 삽입·복구 — insertRetry·insertPrereq·shiftPos·Esc 저장·다음 날 폐기 · 1.5일 (선행: 큐 플래너) {#m2-02-session-insert}
- [ ] 01 · 세션 저장/복원 — session.save batch 시점 5종, 기동 시 이어 찍기, 강제 종료 후 복구 E2E · 1.5일 (선행: store-sql·ipc-client·세션 중 삽입) {#m2-01-session-persist}
- [ ] 04 · T0 생성기 3종 — point/blank/meaning + 폴백 사슬 + no-plate 사유, 목업 4카드 재현 · 3일 (선행: 03 사전·Site) {#m2-04-t0-generators}
- [ ] 04 · T0 채점·진단·이벤트 — 판정, 진단 선택 표, t0.answered, 재출제 규칙 · 1일 (선행: T0 생성기) {#m2-04-t0-grading}
- [ ] 02 · 판 완료 트랜잭션 — review_log→mastery→session_item→lifer→dunno_event, 트랙별 detail_json · 1.5일 (선행: 겹 리듀서·T0 이벤트) {#m2-02-complete-tx}
- [ ] 02 · rebuild_mastery() — 원장 재생 = 캐시 검증, 시작 시 표본 검증 · 1일 (선행: 판 완료 트랜잭션) {#m2-02-rebuild-mastery}
- [ ] 04 · 사다리 데이터 조립기 — 4단 데이터, prereq 상태 판정, 프롬프트 규약(±4줄·경로 제외·파일명만) · 2일 (선행: T0 채점·02 겹 조회) {#m2-04-ladder-assembler}
- [ ] 02 · 홈·요약·사다리 쿼리 — §7 SQL 을 이름 붙여 노출, fade 적용, 노드 상태 계산 · 1.5일 (선행: db/sql 계층) {#m2-02-home-summary-queries}
- [ ] 02 · 이의·LIFER 처리 — M2 는 LIFER, appeal 기록·내보내기는 M3 에서 연결 · 1일 (선행: 판 완료 트랜잭션) {#m2-02-appeal-lifer}
- [ ] 05 · 세션 셸 — SessionOverlay(포커스 트랩·inert·Esc 4단계)·JobBand·useSessionClock·session.save/resume·키맵(e.code) · 3일 (선행: 프리미티브·02 세션 테이블) {#m2-05-session-shell}
- [ ] 05 · T0 판 — ProofSheet·CodePlate(hl·PickToken·Hole)·Choices·FeedbackSlot·Acts·Crumb · 2일 (선행: 세션 셸·04 T0 규칙) {#m2-05-t0-plate}
- [ ] 05 · 다시 찍기 사다리·아래층·LIFER — ReprintLadder 4단·점프/복귀/LinkPara·B·LiferVeil·클립보드 · 3일 (선행: T0 판) {#m2-05-ladder-lifer}
- [ ] 05 · 인쇄 완료 요약 — Summary 전부, 「오늘 판 다시 보기」는 읽기 전용 · 1일 (선행: T0 판) {#m2-05-summary}
- [ ] 06 · Q3 TS 채점기 골든·스케줄러 property — T0·스케줄러(T1·T2 골든은 M3·M4) · 2일 (선행: 04 T0·02 리듀서) {#m2-06-q3-grading-golden}
- [ ] 06 · Q4 통합 파이프라인·IPC 덤프 — M1 덤프 + T0 재생, git diff --exit-code 게이트 · 2일 (선행: Q1~Q3) {#m2-06-q4-ipc-dump}
- [ ] 06 · Q5 __audit 이식 — src/devtools/audit.ts + Playwright tests/gates 7게이트 + allowlist 만료 · 2일 (선행: 05 세션 화면) {#m2-06-q5-audit-port}
- [ ] 01 · 성능 벤치 — 3 픽스처, WKWebView 홈·세션 프레임 측정, CI 소프트 게이트 · 1.5일 (선행: 인제스트·세션 셸) {#m2-01-perf-bench}

## M3 · T1 클론 코딩 (끝: 12~40줄 블록 3단계 페이딩, 골든 28건 통과, 비공백 줄 점수, appeal·why_answer 기록, 20줄 <20ms, Monaco ≤250ms) {#m3}
- [ ] 04 · T1 블록 선정·마스크 — 언어별 노드 표, 분절, 2단계 유지 집합, 스펙 카드 · 2일 (선행: 03 _blocks 캡처·01 file_read_block·02 block) {#m3-04-t1-block-mask}
- [ ] 04 · T1 정규식층 — 정렬 A/B/C(NW), 파이프라인 11단계, PROT 구성, 치환 3조건+④ · 3일 (선행: 04 토크나이저) {#m3-04-t1-regex}
- [ ] 04 · T1 AST 승격 — 문장 단위 잘라내기, 정규화 ⓐ~ⓗ, 폴백 게이트, 성능 측정 · 3일 (선행: 정규식층·01 parse_snippet) {#m3-04-t1-ast}
- [ ] 04 · T1 결과·점수·이의 — 데이터 모델, 임계(소블록 완충), appeal·patternKey·카탈로그·이슈 URL · 2일 (선행: 정규식층·02 appeal) {#m3-04-t1-result-appeal}
- [ ] 04 · 왜 게이트 — 문항 선정, 검증 4조건, why_answer 저장, 스펙 카드 연계 · 1일 (선행: T1 결과·02 why_answer) {#m3-04-why-gate}
- [ ] 05 · T1 ClonePad Monaco — 지연 로드·테마 2종·거터 틱·줄 이탈 판정·백틱 홀드·자동 저장·Stepper·RefPlate·ScoreCard·DiffRows·WhyGate · 3일 (선행: 세션 셸·04 T1 엔진) {#m3-05-clonepad}

## M4 · T2 구조 (끝: projectox 유닛으로 문제 4종 생성, two-commits 는 그래프 3종만, 배치 결정성·2,000파일 <1.5s·24 노드·골든·IPC 재생 T1/T2 확장) {#m4}
- [ ] 04 · T2 import 해석기 resolve-imports.ts — ts/py/go/rs/dart 표, tsconfig paths, Next http 엣지, external 분류 · 3일 (선행: 03 _imports 캡처) {#m4-04-resolve-imports}
- [ ] 04 · T2 그래프 정리·배치 — SCC, 고립, 밴드 규칙, barycenter, 포트, 24 노드 축약 · 2일 (선행: 해석기) {#m4-04-graph-layout}
- [ ] 04 · T2 정답지 도출 — 커밋 후보 필터, core/sec/trap, 힌트, 질문 템플릿, 커밋 부족 폴백 · 2일 (선행: commit_file·D21 커밋 분류) {#m4-04-answer-key}
- [ ] 04 · T2 채점·문제 3종 — 3티어·wrong 상한, 영향 반경·흐름 추적·방향, 「이것도 맞다」 편입 · 2일 (선행: 정답지) {#m4-04-t2-grading}
- [ ] 05 · T2 DependencyMap — SVG 레이아웃·포트 분산·호버/포커스 강조·3티어 결과·커밋 출처, 13px 룰 · 2일 (선행: 세션 셸·그래프 배치) {#m4-05-dependency-map}
- [ ] 04 · 골든 케이스 스위트 — §9 표 28건 + T0/T2 케이스 픽스처, CI 게이트 · 1일 (선행: 위 전부) {#m4-04-golden-suite}

## M5 · 릴리스 준비 — 보안 게이트 · 3-OS 빌드 · 오픈소스 문서 (끝: v0.1.0 드래프트 릴리스 + SHA256SUMS, 첫 실행 소켓 0, 전부 지우기 검증, README 우회 안내) {#m5}
- [ ] 06 · Q9 LLM 전송 범위·키체인 — buildPrompt 골든(9줄·경로 없음·파일명만), keyring 저장/삭제, Rust 측 호출, 「보내기」 확인 UI · 2일 (선행: 05 사다리 4단·D8) {#m5-06-q9-llm-keychain}
- [ ] 06 · Q12 마이그레이션 프레임 — 백업 3개·시드 DB 테스트·ingest_fingerprint 배너·내보내기·전부 지우기 · 2일 (선행: 02 스키마) {#m5-06-q12-migration-frame}
- [ ] 06 · Q6 시각 회귀·감축 모션·키보드 완결 — 6장 기준선, emulateMedia, axe-core, 마우스 0 주행 · 2일 (선행: Q5) {#m5-06-q6-visual-a11y}
- [ ] 05 · E2E 15 시나리오 + 시각 회귀 40장 + a11y 감사 자동화 — mockIPC 픽스처, webkit 프로젝트, 골든 갱신 규칙 · 3일 (선행: 전 화면) {#m5-05-e2e-visual}
- [ ] 06 · Q15 E2E Linux 8건 + 벤치 야간 — tauri-driver·xvfb, E1~E8, bench.yml 기준선·PR 코멘트, 크래시 리포트·perf_sample·디버그 모드 · 3일 (선행: Q4·Q12) {#m5-06-q15-e2e-linux-bench}
- [ ] 06 · Q13 오픈소스 문서 세트 — LICENSE·THIRD_PARTY·OFL 전문·CONTRIBUTING·이슈 템플릿 3종·CoC·SECURITY·지원 매트릭스 · 1.5일 {#m5-06-q13-oss-docs}
- [ ] 06 · Q14 release.yml + README 우회 안내 — tauri-action 매트릭스 드래프트, SHA256SUMS.txt, git-cliff, 버전 동기 · 1.5일 (선행: Q7) {#m5-06-q14-release}
- [ ] 05 · 목업 정리 — tokens.css 분리·홈을 build.py 로 이전·.ladder 개명·D3(다시 찍기 회복)·D11·D14 반영 · 1일 (선행: 결정) {#m5-05-mockup-cleanup}

## M6 · MVP 이후 {#m6}
- [ ] 02 · FSRS 개인화 잡 — MVP 이후 · TS 우선(ts-fsrs 옵티마이저 가용성 확인 뒤), 채택 기준·롤백 · 2일 (선행: review_log ≥ 1,000행) {#m6-02-fsrs-personalize}

<!-- oculpm:plan-log begin v1 -->
| 시각 | 항목 | 에이전트 | 변화 | 일지 | 메모 |
|---|---|---|---|---|---|
| 2026-09-02T22:23:49+09:00 | #m0-01-workspace | claude-code | ☐→x | 20260902/Features_to_add/2221_feature_m0-workspace-scaffold-rust-budget-gate.md | Cargo/pnpm 워크스페이스 · check-rust-budget.sh 4장치 · tauri build --debug 통과(macOS). CI 3-OS 는 m0-06-q7-ci |
| 2026-09-02T22:23:54+09:00 | #m0-05-tauri-skeleton | claude-code | ☐→x | 20260902/Features_to_add/2221_feature_m0-workspace-scaffold-rust-budget-gate.md | Vite 6 + React 19, tauri.conf.json 창·CSP, capabilities 최소 6개, ESLint/Stylelint 배선 |
| 2026-09-02T22:23:59+09:00 | #m0-01-store-crate | claude-code | ☐→x | 20260902/Features_to_add/2221_feature_m0-store-crate-migration-runner.md | open/query/exec/batch/info, writer1+reader4, 행→JSON, 인메모리 테스트 12건. 343/350줄 |
| 2026-09-02T22:24:05+09:00 | #m0-02-migration-runner | claude-code | ☐→x | 20260902/Features_to_add/2221_feature_m0-store-crate-migration-runner.md | user_version 순차·백업 3개 상한·상위 버전 거부. 실앱에서 0001_init 적용 확인(31테이블/20인덱스) |
| 2026-09-02T22:24:11+09:00 | #m0-01-store-sql | claude-code | ☐→x | 20260902/Features_to_add/2222_feature_m0-store-sql-catalog-ipc-client.md | 0001_init.sql(02 §2.2 추출, sqlite 실행 검증) · statement 15개 · build-catalog.ts 가 Rust 필수 12개 존재 검사 |
| 2026-09-02T22:24:16+09:00 | #m0-01-ipc-client | claude-code | ☐→x | 20260902/Features_to_add/2222_feature_m0-store-sql-catalog-ipc-client.md | typed client · IpcError 30코드 · 이벤트 · STORE_BUSY 3회/50ms · dev 패널 p95. StatementMap 순환은 선언 병합(D49) |
| 2026-09-02T22:24:21+09:00 | #m0-01-t3-slot | claude-code | ☐→x | 20260902/Features_to_add/2222_feature_m0-store-sql-catalog-ipc-client.md | RunnerAdapter 인터페이스 · t3_run → NOT_IMPLEMENTED · track 열거형 t3 예약(테스트로 고정) |
| 2026-09-02T22:26:00+09:00 | #m0-02-day-utils | claude-code | ☐→x | 20260902/Features_to_add/2223_feature_m0-day-utils-seed-tokenizer-fixtures.md | dayKey·endOfDay·labelFor, 04:00 경계·NY DST 양방향 테스트. 문서 뺄셈식이 endOfDay 와 어긋나 벽시계 규칙으로 정정(D54) |
| 2026-09-02T22:26:05+09:00 | #m0-04-seed-tokenizer | claude-code | ☐→x | 20260902/Features_to_add/2223_feature_m0-day-utils-seed-tokenizer-fixtures.md | packages/text 신설(D50) — seedOf·mulberry32·shuffle·다중문자 op 토크나이저, 골든 42건 |
| 2026-09-02T22:26:11+09:00 | #m0-06-q1-fixture-repos | claude-code | ☐→x | 20260902/Features_to_add/2223_feature_m0-day-utils-seed-tokenizer-fixtures.md | make-fixture-repo.sh + tiny·two-commits·projectox-like .steps. 두 경로·다른 TZ 에서 커밋 해시 동일 확인 |
| 2026-09-02T22:26:17+09:00 | #m0-05-tokens-fonts | claude-code | ☐→x | 20260902/Features_to_add/2223_feature_m0-design-tokens-fonts-stylelint-gates.md | sync-design.mjs(--check·OVERRIDES D52) · check-contrast 46쌍 · Stylelint 4룰 · 폰트 9벌+OFL. Black Han Sans 는 TTF→woff2 컨테이너 변환(D55) |
| 2026-09-02T22:26:23+09:00 | #m0-05-dee-sprite | claude-code | ☐→x | 20260902/Features_to_add/2225_feature_m0-dee-sprite-and-12-primitives.md | 심볼 3종+로고, data-ly 노드 동일성 테스트, 감축·타이핑 규칙. dangerouslySetInnerHTML 없이 JSX 트리 |
| 2026-09-02T22:26:29+09:00 | #m0-05-primitives | claude-code | ☐→x | 20260902/Features_to_add/2225_feature_m0-dee-sprite-and-12-primitives.md | 12종 + dev/Gallery, 목업 클래스명 유지, 원색 토큰 0건, 13px 미만 0건. 판정 글자 토큰 3개 신설(D56) |
| 2026-09-02T22:32:05+09:00 | #m0-06-q7-ci | claude-code | ☐→x | 20260902/Features_to_add/2231_feature_m0-ci-workflows-and-security-config.md | lint/type/unit/audit + build-3os(D53), 액션 8개 SHA 고정, M1·M2 잡은 주석. 리포에 remote 가 없어 CI 실행은 미검증 |
| 2026-09-02T22:32:11+09:00 | #m0-06-q11-tauri-security | claude-code | ☐→x | 20260902/Features_to_add/2231_feature_m0-ci-workflows-and-security-config.md | CSP 06 §4.3 그대로 · capabilities 최소 6개 · zod 응답 검증 · no-danger 는 D42 두 파일만. deny/gitleaks/audit 전부 초록 |
| 2026-09-02T22:38:05+09:00 | #m0-02-db-sql-layer | claude-code | ☐→x | 20260902/Features_to_add/2237_feature_m0-row-converters-zod-tx-helper.md | fromRow 19개·zod 15벌·tx 헬퍼, 진짜 SQLite 왕복 테스트 44건. DDL↔§8.2 충돌 2건 수정(D57 별칭 금지·D58 picks_json) |
| 2026-09-03T03:44:56+09:00 | #m1-01-git-crate | claude-code | ☐→x | 20260903/Features_to_add/0344_feature_m1-git-parse-crates.md | 383줄 · 테스트 16건 · git_diff_text 는 M4 로 |
| 2026-09-03T03:45:01+09:00 | #m1-01-parse-crate | claude-code | ☐→x | 20260903/Features_to_add/0344_feature_m1-git-parse-crates.md | 358줄 · 골든 스니펫 17건 · parse_snippet 명령은 M3 |
| 2026-09-03T03:45:06+09:00 | #m1-03-diff-commitrec | claude-code | ☐→x | 20260903/Features_to_add/0344_feature_m1-git-parse-crates.md | 리네임 50·공백 무시·touched 압축 + 임시 리포 테스트. commit_file 쓰기는 잡 러너에서 |
| 2026-09-03T04:04:25+09:00 | #m1-01-ingest-runner | claude-code | ☐→x | 20260903/Features_to_add/0404_feature_m1-ingest-runner-and-boundary.md | 워커 스레드·해시 증분·취소·500행 tx·4단계 이벤트. pipeline 9건 |
| 2026-09-03T04:04:30+09:00 | #m1-01-file-context | claude-code | ☐→x | 20260903/Features_to_add/0404_feature_m1-ingest-runner-and-boundary.md | file_read_lines/block, 작업트리·rev 양쪽, 2000줄·64KiB 상한, UTF-8 lossy. repoId 대신 rootPath(D65) |
| 2026-09-03T04:04:36+09:00 | #m1-03-grammar-pool | claude-code | ☐→x | 20260903/Features_to_add/0404_feature_m1-ingest-runner-and-boundary.md | Cargo feature 4종·thread_local 파서 풀·2s 타임아웃·parse_quality. 확장자 표는 TS LangSpec |
| 2026-09-03T04:04:42+09:00 | #m1-03-worktree-progress | claude-code | ☐→x | 20260903/Features_to_add/0404_feature_m1-ingest-runner-and-boundary.md | is_dirty·ingest_warning 6종·취소 후 증분 재개 검증. TS 재스캔 3시점은 concepts/ingest.ts 에서 |
| 2026-09-03T04:38:59+09:00 | #m1-03-dict-ts-v1 | claude-code | ☐→x | 20260903/Features_to_add/0438_feature_m1-dictionary-and-derive.md | ts 31 + common 22 + arch 4 + react 1. 병렬 슬라이스 3개, 각자 Rust 쿼리 테스트·린트 통과 후 병합 |
| 2026-09-03T04:39:04+09:00 | #m1-03-dict-lint | claude-code | ☐→x | 20260903/Features_to_add/0438_feature_m1-dictionary-and-derive.md | zod 정본(D69)·JSON Schema 생성물·pnpm dict:lint 11건·Rust 쿼리 테스트 5건 |
| 2026-09-03T04:39:10+09:00 | #m1-03-query-runner | claude-code | ☐→x | 20260903/Features_to_add/0438_feature_m1-dictionary-and-derive.md | Rust inError·match_id + TS derive.ts(그룹화·ctx 병합·lineConcepts·uncoveredRatio·shape·site_key). 테스트 16건 |
| 2026-09-03T04:39:15+09:00 | #m1-03-ingest-skeleton | claude-code | ☐→x | 20260903/Features_to_add/0438_feature_m1-dictionary-and-derive.md | concepts 파생 층 골격 — derive·commits(identity·kind)·ingest-defaults 상수. 단위 테스트 45건 |
| 2026-09-03T04:39:23+09:00 | #m1-01-dict-commands | claude-code | ☐→x | 20260903/Features_to_add/0438_feature_m1-dictionary-and-derive.md | 범위 조정(D66) — dict_* 4개 명령 대신 Vite 번들. zod 스키마·로더는 완성. 사용자 오버라이드는 M5 |
| 2026-09-03T04:39:29+09:00 | #m1-06-q8-log-safe | claude-code | ☐→x | 20260903/Features_to_add/0438_feature_m1-dictionary-and-derive.md | logger.ts(금지 필드·절대 경로 축약) + no-console + Rust println!/dbg! 금지 + 이벤트 누출 통합 테스트 |
| 2026-09-03T04:46:54+09:00 | #m1-06-q10-evil-input | claude-code | ☐→x |  | 파서 폭탄 6건(≤3s·패닉0)·심링크·경로 탈출·악성 사전 12문자열 27건. RichText 단일 통로 유지 |
| 2026-09-03T04:47:00+09:00 | #m1-01-error-model | claude-code | ☐→x |  | thiserror→IpcError(git·parse·store) + error-copy.ts 문구 표 + 다음 동작 5종. 코드 전량 테스트 |
| 2026-09-03T04:47:06+09:00 | #m1-03-sqlite-incremental | claude-code | ☐→x |  | Rust 해시 증분·is_reachable + TS 재파생(site_key 유지·사라진 키 is_alive=0). sqlite 위 통합 18건 |
| 2026-09-03T04:47:11+09:00 | #m1-03-unknown-count | claude-code | ☐→x |  | unknownCount(03 §3.6 공식)·chooseFirst 동률 규칙·distinctShapes. 아는 개념이 늘면 값이 준다는 것까지 테스트 |
| 2026-09-03T04:47:16+09:00 | #m1-02-unknown-cache | claude-code | ☐→x |  | knownSet(1겹 ∪ 보편 3겹 전이)·recountUnknown 이 concept_site.unknown_count 를 채운다 |
| 2026-09-03T04:47:22+09:00 | #m1-03-gap-map | claude-code | ☐→x |  | essential 집계·thin 판정·alternatives 부기·테스트 파일 제외(D60). gaps.list 가 홈에 낸다 |
| 2026-09-03T04:47:28+09:00 | #m1-01-repo-relocate | claude-code | ☐→x |  | repos.ts(D65) — 등록·목록(missing 판정)·이동(fingerprint 검증)·삭제(카드는 은퇴만, D31) |
| 2026-09-03T04:47:33+09:00 | #m1-03-blame-pass | claude-code | ☐→x |  | git_blame_lines 명령 + blame.ts 배경 잡(60s 예산·파일당 2s 컷·실패는 그 파일만 포기). libgit2 에 중단 수단이 없어 컷은 사후 검사다 |
| 2026-09-03T04:51:16+09:00 | #m1-03-swift-dart-sql | claude-code | ☐→x |  | 실측 — sql 20파일 중 poor 1(5%) · ts 40/0 · tsx 20/0. Swift·Dart 는 크레이트 미탑재(03 §2.2 위험)이고 테스트가 그 사실을 고정한다 |
| 2026-09-03T04:51:23+09:00 | #m1-03-projectox-check | claude-code | ☐→x |  | 배포 사전 전량으로 실리포(이 리포, TS 113파일) 인제스트 — 캡처 75,584 · 2.9s. projectox-like 픽스처 96파일도 통과. CHICKADEE_REAL_REPO 로 다른 리포를 가리킬 수 있다 |
| 2026-09-03T04:59:37+09:00 | #m1-05-home | claude-code | ☐→x |  | 컴포넌트 14종 + HomeScreen + FirstRun, 목업 마크업·클래스 그대로. 테스트 58건. TodayPanel·StampCard·「인쇄 시작」은 큐가 M2 라 비워 둠 |
| 2026-09-03T04:59:44+09:00 | #m1-05-ingest-onboarding | claude-code | ☐→x |  | 폴더 선택→등록→인제스트 배선, 진행 4단계를 TimeQueue 로, 빈 상태 FirstRun. 설정 화면과 identity 선택 UI 는 M2 |
| 2026-09-03T04:59:50+09:00 | #m1-05-wkwebview-perf | claude-code | ☐→! |  | 계측만 넣었다 — __audit.perf·mark 6종·예산표·Web Inspector 절차. **실측은 못 했다**: WKWebView 수치는 macOS 앱 안에서만 뜻이 있고 이 세션엔 GUI 가 없다 |
| 2026-09-03T05:01:21+09:00 | #m1-03-golden-fixtures | claude-code | ☐→x | .oculpm/journal/20260903/Features_to_add/0501_feature_golden-fixtures-and-insta-snapshots.md | TS 12개념 양성3/음성2 + 함정3, TSX·SQL 각 15케이스, UPDATE_GOLDEN |
| 2026-09-03T05:01:23+09:00 | #m1-06-q2-parser-golden | claude-code | ☐→x | .oculpm/journal/20260903/Features_to_add/0501_feature_golden-fixtures-and-insta-snapshots.md | insta 스냅샷 45장 (TS/TSX/SQL 각 15), 절대 경로 없음 |
<!-- oculpm:plan-log end -->
