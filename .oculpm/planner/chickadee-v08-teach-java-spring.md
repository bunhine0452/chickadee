---
oculpm_plan: v1
id: chickadee-v08-teach-java-spring
title: "0.8 자바·스프링을 실제로 가르친다 — 실행 · 정식 코스 · 은유 제거 (D174)"
status: active
created: 2026-09-05
updated: 2026-09-05
owner: claude-code
---

사용자 판정: 지금 앱으로는 자바 기초부터 스프링까지 못 가르친다. 정본 개정(D174) 뒤 여섯 갈래를 병렬로 — 실행 러너 · spring 사전 · 정식 자바 코스 · 평문화 · 시각 절제 · 실행 채점.

## A · 실행 러너 (D175) {#a}
- [x] Rust — t3_run 구현: 리포 밖 임시 작업본에서 프로세스 실행 · 시간·출력 상한 · 죽이기 · 네트워크 차단. Tauri shell 스코프와 예산(2,524/2,800) 재보고 {#a-rust}
- [x] 탐지 — JDK·Gradle 래퍼 유무, 없으면 4·5단을 게이트에서 뺀다(설치 강요 금지) {#a-detect}
- [x] 자바 어댑터 — 임시 작업본 구성 · 학습자 답안 주입 · gradle test · 통과/실패 파싱. 오프라인 {#a-adapter}
- [x] 안전 — 원본 리포에 안 씀·네트워크 0·상한 초과 종료를 시험으로 못박기 {#a-safety}
- [x] 화면 — 실행 중·통과·실패·러너 없음 네 상태와 출력 보기 {#a-ui}

## B · spring/ 사전 (D176) {#b}
- [x] 핵심 — 의존성 주입 · 빈과 컨테이너 · 생명주기 · 프록시와 AOP · 트랜잭션 전파 · 설정 바인딩 {#b-core}
- [x] 웹 — 요청 디스패치 · 컨트롤러 매핑 · 필터와 인터셉터 · 예외 핸들러 · 검증 {#b-web}
- [x] 데이터 — 영속성 매핑(MyBatis·JPA) · 커넥션과 트랜잭션 경계 · 리포지터리 {#b-data}
- [x] 프레임워크 감지 — build.gradle 의 spring-boot 로 켜고 아니면 로드하지 않는다(react/ 선례) {#b-detect}
- [x] 근거 낱말과 사용처 — 자바 개념의 창을 빌리고 실제 리포에서 몇 장이 서는지 실측 {#b-evidence}

## C · 정식 자바 코스 3부 (D177) {#c}
- [x] 커리큘럼 — 1부 바닥(합성) · 2부 객체(합성+내 코드) · 3부 프레임워크(내 코드 중심). 개념 목록과 위상 정렬 {#c-curriculum}
- [x] 합성 예제 생성 — 개념마다 최소 예제와 문항, 그리고 「네 리포의 여기가 그것이다」 연결 {#c-synth}
- [x] 내 코드에 없는 개념 — 「네 코드엔 없다」를 명시하는 자리와 문구 {#c-absent}
- [x] 아는 것 건너뛰기 — 첫 문항과 원장으로 1부를 접는다. 배치고사는 만들지 않는다 {#c-skip}
- [x] 코스 빌더 배선 — 3부가 끝나면 기능 챕터로 넘어간다. 어휘 관문 흡수 {#c-wire}

## D · 평문화 (D178) {#d}
- [x] UI 문구 전량 — 판·대지·잉크 겹·교정쇄·정합·어긋남·오늘의 인쇄를 카드·단원·숙련도·연습·정답·오답으로. ko 정본 en 병기 {#d-i18n}
- [x] 낭독 문구와 접근성 이름도 같이 {#d-aria}
- [x] 문구를 박제한 시험·골든 갱신 {#d-tests}
- [x] docs/05 의 은유 표와 용어집을 평문으로 {#d-docs}

## E · 시각 절제 (D179) {#e}
- [x] 장식 기본값 끄기 — 등록표시·판번호 어긋남·질감·노드 지터. 색은 상태 넷에만 {#e-decor}
- [x] 코드가 주인 — 문제 화면에서 코드·다이어그램을 가장 크게, 여백 재배분 {#e-code}
- [x] 마스코트 정적화 — 진도 표시에서 빼고 빈 상태·완료·표지에만 {#e-mascot}
- [x] 토큰 — design/src/ink 단일 출처를 고치고 design:sync, 대비·모션 게이트 통과 {#e-tokens}

## F · 실행 채점 (D180) {#f}
- [x] 4단 수정 — AST 제약 위에 테스트 통과를 더한다. 러너 없으면 제약까지 {#f-repair}
- [x] 5단 재구현 — 필사 비교를 버리고 스펙과 테스트로. 백지에서 구성하는지를 잰다 {#f-reimpl}
- [x] 과제 테스트 만들기 — fix 커밋과 스펙에서 판정용 테스트를 뽑는다 {#f-tests}
- [x] 통과 판정에 5단 편입 — 러너가 있는 언어에서만 {#f-gate}

## G · 통합·검증 {#g}
- [x] MonggleMonggle 로 1부→3부→로그인 챕터가 끝까지 서는지 {#g-course}
- [x] 전체 게이트 · e2e · CI 초록 {#g-gates}
- [x] 커밋·푸시·CI 확인 {#g-ship}

<!-- oculpm:plan-log begin v1 -->
| 시각 | 항목 | 에이전트 | 변화 | 일지 | 메모 |
|---|---|---|---|---|---|
| 2026-09-05T13:20:53+09:00 | #b-core | claude-code | ☐→x | .oculpm/journal/20260905/Features_to_add/1320_feature_spring-namespace-dictionary.md | 핵심 일곱 — 컴포넌트 스캔까지 더해 7장. proxy-and-aop · transaction-propagation 이 REQUIRES_NEW 자기호출을 설명한다 |
| 2026-09-05T13:20:58+09:00 | #b-web | claude-code | ☐→x | .oculpm/journal/20260905/Features_to_add/1320_feature_spring-namespace-dictionary.md | 웹 다섯. filter-vs-interceptor 의 rule 이 「permitAll 은 인가를 면제하지 필터를 건너뛰지 않는다」 |
| 2026-09-05T13:21:03+09:00 | #b-data | claude-code | ☐→x | .oculpm/journal/20260905/Features_to_add/1320_feature_spring-namespace-dictionary.md | 데이터 셋. persistence-mapping 이 MyBatis resultMap 과 JPA 엔티티를 한 개념의 두 모양으로 담는다 |
| 2026-09-05T13:21:09+09:00 | #b-detect | claude-code | ☐→x | .oculpm/journal/20260905/Features_to_add/1320_feature_spring-namespace-dictionary.md | detect 를 두 모양의 합집합으로 열고 LoadOptions.manifests 추가. 인제스트·flow.ts 배선은 범위 밖 — curriculum/spring.md §3 에 적음 |
| 2026-09-05T13:21:15+09:00 | #b-evidence | claude-code | ☐→! | .oculpm/journal/20260905/Features_to_add/1320_feature_spring-namespace-dictionary.md | 근거 낱말·실측은 끝(15개 표, MonggleMonggle). 빌림이 안 돈다 — bake.ts:335 가 'proto' 하드코딩, :345 가 lenders 기본값 'cs'. packages/course 는 C6 범위 |
| 2026-09-05T13:26:17+09:00 | #e-decor | claude-code | ☐→x | 20260905/Features_to_add/1326_feature_visual-restraint-decor-mascot-tokens.md | defaultTrim() 을 전 플랫폼 'on' 으로 — 스위치는 유지 |
| 2026-09-05T13:26:23+09:00 | #e-code | claude-code | ☐→x | 20260905/Features_to_add/1326_feature_visual-restraint-decor-mascot-tokens.md | 코드 18px · 판번호 20px 모노 · 레일 34px · 코드 위 색면 셋 제거 |
| 2026-09-05T13:26:29+09:00 | #e-mascot | claude-code | ☐→x | 20260905/Features_to_add/1326_feature_visual-restraint-decor-mascot-tokens.md | 진도 자리 9곳을 숫자·막대로 · 모션 5종과 useDeeMotion 제거 |
| 2026-09-05T13:26:36+09:00 | #e-tokens | claude-code | ☐→x | 20260905/Features_to_add/1326_feature_visual-restraint-decor-mascot-tokens.md | 출처에 상태 별칭 8개 + design:sync · 대비 48쌍·모션 0건 통과 |
| 2026-09-05T13:28:38+09:00 | #a-rust | claude-code | ☐→x | 20260905/Features_to_add/1328_feature_jdk-gradle-test-runner.md | t3_run 구현 — 작업본 동기화·주입·상한·그룹 종료. std::process, shell 플러그인 없음. 2,744/2,800 (예산 유지) |
| 2026-09-05T13:28:47+09:00 | #a-detect | claude-code | ☐→x | 20260905/Features_to_add/1328_feature_jdk-gradle-test-runner.md | detectRunner — gradlew/gradlew.bat · wrapper.properties 버전 · 빈 작업본에서 java -version. 없으면 no-runner |
| 2026-09-05T13:28:48+09:00 | #f-tests | claude-code | ☐→x | 20260905/Features_to_add/1328_feature_grade-stages-4-5-by-running.md | stage-tests.ts — 커밋 테스트 · 이름 맞는 리포 테스트 · 생성 계약 테스트 + 스프링 컨텍스트 |
| 2026-09-05T13:28:54+09:00 | #f-repair | claude-code | ☐→x | 20260905/Features_to_add/1328_feature_grade-stages-4-5-by-running.md | AST 제약 + 테스트 통과 · 테스트가 이긴다 · 러너 없으면 게이트 밖 |
| 2026-09-05T13:28:59+09:00 | #f-reimpl | claude-code | ☐→x | 20260905/Features_to_add/1328_feature_grade-stages-4-5-by-running.md | gradeT1(original) 제거 — 시그니처·mustHold 만 주고 판정은 테스트 |
| 2026-09-05T13:28:59+09:00 | #a-adapter | claude-code | ☐→x | 20260905/Features_to_add/1328_feature_jdk-gradle-test-runner.md | java-runner.ts — 작업본 주입 · gradlew test --offline --no-daemon · 초기화 스크립트 표시줄로 통과/실패. XML 안 읽음 |
| 2026-09-05T13:29:06+09:00 | #a-safety | claude-code | ☐→x | 20260905/Features_to_add/1328_feature_jdk-gradle-test-runner.md | tests/proc.rs 8건 — 원본 불변·경로 탈출·타임아웃이 손자까지·출력 상한·래퍼 실행권. JDK 없이 돈다 |
| 2026-09-05T13:29:11+09:00 | #f-gate | claude-code | ☐→x | 20260905/Features_to_add/1328_feature_grade-stages-4-5-by-running.md | passTarget(hasRepair, hasRun) 3·4·5 · tally 가 게이트 밖 판정을 안 센다 · RunStrip |
| 2026-09-05T13:29:17+09:00 | #b-evidence | claude-code | !→x | 20260905/Features_to_add/1328_feature_grade-stages-4-5-by-running.md | bakeSiteless 가 COMPUTED_NAMESPACES 를 돈다 + 클래스 머리 창 — 실측 3 → 11 (15개 중 14개가 리포에 보임) |
| 2026-09-05T13:29:17+09:00 | #a-ui | claude-code | ☐→x | 20260905/Features_to_add/1328_feature_jdk-gradle-test-runner.md | data/runner.ts + components/run/RunPanel — 상태 일곱 · run.* 평문 문구 · 아직 화면에 안 꽂았다(C6 이 꽂는다) |
| 2026-09-05T13:37:07+09:00 | #c-curriculum | claude-code | ☐→x | 20260905/Features_to_add/1336_feature_formal-java-course-three-parts.md | java.md 3부 재편 · essential 21→29 (신규 개념 여덟) |
| 2026-09-05T13:37:13+09:00 | #c-synth | claude-code | ☐→x | 20260905/Features_to_add/1336_feature_formal-java-course-three-parts.md | 예제·문항은 사전 examples[] 그대로 · 스키마 무변경 |
| 2026-09-05T13:37:18+09:00 | #c-absent | claude-code | ☐→x | 20260905/Features_to_add/1336_feature_formal-java-course-three-parts.md | makeAbsentCard + AbsenceReason 넷. 문구 키 넷은 C4 몫 |
| 2026-09-05T13:37:24+09:00 | #c-skip | claude-code | ☐→x | 20260905/Features_to_add/1336_feature_formal-java-course-three-parts.md | foldsPart1 — 한 문항 + 원장(전이 겹 포함). 배치고사 없음 |
| 2026-09-05T13:37:30+09:00 | #c-wire | claude-code | ☐→x | 20260905/Features_to_add/1336_feature_formal-java-course-three-parts.md | courseOutline · chapterGates(관문 0 흡수) · 실측 1부13→2부16→3부14→로그인 |
| 2026-09-05T13:40:41+09:00 | #a-adapter | claude-code | x→x | 20260905/Features_to_add/1340_feature_runner-download-consent-timeout.md | 사용자 결정 둘 반영 — 배포본 내려받기 동의 게이트(Rust needs/missing) · 상한 180s/첫 회 600s · error↔no-runner 경계 재조정(D180) |
| 2026-09-05T13:42:31+09:00 | #d-i18n | claude-code | ☐→x | 20260905/Refactors/1342_refactor_d178-plain-words-over-press-metaphor.md | ko·en 9쌍 값 179건. 키 이름 불변, 잔량 0 |
| 2026-09-05T13:42:37+09:00 | #d-aria | claude-code | ☐→x | 20260905/Refactors/1342_refactor_d178-plain-words-over-press-metaphor.md | 낭독 병기 제거 + 카탈로그 밖 gainText 세 줄 |
| 2026-09-05T13:42:43+09:00 | #d-tests | claude-code | ☐→x | 20260905/Refactors/1342_refactor_d178-plain-words-over-press-metaphor.md | 기대 문자열만 교체 · 시험 뜻 불변 · 전 스위트 초록 |
| 2026-09-05T13:42:49+09:00 | #d-docs | claude-code | ☐→x | 20260905/Refactors/1342_refactor_d178-plain-words-over-press-metaphor.md | 00 §3 용어집 + D178 행 · 05 여덟 절 · C5 뒤처리 세 절 |
| 2026-09-05T13:46:22+09:00 | #b-evidence | claude-code | x→! | .oculpm/journal/20260905/Features_to_add/1346_feature_spring-lifecycle-and-conditional-prereq.md | 실측 15/15 재료 확보(14 근거 낱말 + bean-lifecycle 합성 예제). 남은 셋 다 범위 밖 — bake.ts:335/:345 · t0-synthetic.ts 의 ABSENCE 행 |
| 2026-09-05T13:46:34+09:00 | #b-evidence | claude-code | !→x | .oculpm/journal/20260905/Features_to_add/1346_feature_spring-lifecycle-and-conditional-prereq.md | 되돌림 — 낱말·실측은 끝(15/15 재료). 남은 배선 셋은 C6 항목으로 따로 봐야 한다: bake.ts:335/:345 · t0-synthetic.ts ABSENCE |
| 2026-09-05T13:51:26+09:00 | #g-gates | claude-code | ☐→x | .oculpm/journal/20260905/Features_to_add/1351_feature_v08-canon-revision-and-integration.md | unit 2305/0 · cargo 20 · rust 2769/2800 · dict 16 · gates 114 · e2e-ui 26 · 디자인·대비·모션·버전·라이선스 통과 |
| 2026-09-05T13:51:29+09:00 | #g-course | claude-code | ☐→x | .oculpm/journal/20260905/Features_to_add/1351_feature_v08-canon-revision-and-integration.md | C3 실측 — 1부 13판·2부 16·3부 14 → 로그인 챕터, 부가 어휘를 다 흡수해 챕터 관문 자바 0개. 총 74일 |
| 2026-09-05T14:09:54+09:00 | #g-ship | claude-code | ☐→x | .oculpm/journal/20260905/Bugs/1402_bug_real-binary-e2e-missed-plain-language.md | 커밋 9개 푸시(a1f127a), CI run 33946176944 8잡 전부 초록 — 실제 바이너리 e2e 포함 |
<!-- oculpm:plan-log end -->
