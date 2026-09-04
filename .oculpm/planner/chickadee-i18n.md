---
oculpm_plan: v1
id: chickadee-i18n
title: "언어 선택(한/영) — i18n 뼈대 · 문구 전수 · 사전 영문화"
status: active
created: 2026-09-04
updated: 2026-09-04
owner: claude-code
---

요청 1. 지금은 i18n 층이 없다 — 비주석 한글 약 4만 자가 197 파일에 하드코딩이고 Settings 에 locale 키가 없다. 사용자 결정: 사전(57 YAML · 한글 2.7만 자)까지 전부 영문화. 네 플랜 중 **이것이 먼저다** — 뼈대(P1)를 깔아야 chickadee-repo-shelf · chickadee-settings-gaps · chickadee-clone-course 가 만드는 새 문구가 처음부터 t() 로 들어가고 번역 대상이 두 번 늘지 않는다. P2·P3 은 그 셋과 병행해도 된다. Rust 추가 0줄.

## P0 · 결정 등록부 — D117 · D118 (사용자 확인이 선행, 문서 수정은 그 뒤) {#p0}
- [x] D117 — 앱 UI 문구에 로케일 축을 연다(ko 정본 · en 병기) · 0.2일 {#i18n-d117}
  - [x] docs/00-overview.md §4.2.1 에 D117 행 — 결정·사유·반영 세 열 {#i18n-d117-row}
  - [x] 사용자 확인 — D61「앱 UI 문구 = 한국어」를 여는 행이라 확인 없이 문서를 고치지 않는다 {#i18n-d117-confirm}
  - [x] 반영 — docs/05 §2.1 설정 화면 행에「표시 언어」, docs/06 §2 게이트 표에 로케일 축 {#i18n-d117-apply}
- [x] D118 — 사전 이중 언어(name_en · one_liner_en · 템플릿 en)와 concept.name_en ALTER ADD COLUMN · 0.1일 {#i18n-d118}
  - [x] docs/00 §4.2.1 에 D118 행 {#i18n-d118-row}
  - [x] 반영 — docs/03 사전 스키마 절과 docs/02 §2.2 원장 변경 규칙(추가만) {#i18n-d118-apply}
- [x] docs/05 §9 본문 행 길이(30~45자)에 로케일 축 — D112 가 이 자리를 정본으로 지정했고 06 §2 가 따라온다 · 0.1일 {#i18n-measure-axis}

## P1 · i18n 뼈대와 첫 실행 언어 선택 (끝: 첫 실행에서 고른 언어가 재실행에도 남는다) {#p1}
- [x] packages/i18n 신설 · 0.5일 (선행: D117) {#i18n-package}
  - [x] t(key, vars) — @chickadee/text 의 render() 필터 연쇄 위에 올린다(새 엔진 금지) {#i18n-package-t}
  - [x] 카탈로그 타입 — ko 를 정본으로 키 집합을 넣고 en 은 Partial, 누락 키는 ko 폴백 {#i18n-package-catalog}
  - [x] josa 필터를 en 에서 항등으로 — packages/text/src/template.ts {#i18n-package-josa}
  - [x] 누락 키·고아 키 린트 테스트 + 워크스페이스 등록(tsconfig · eslint 의존 방향) {#i18n-package-lint}
- [x] Settings.locale('ko'|'en') 추가 · 0.3일 {#i18n-locale-setting}
  - [x] store-sql types.ts · schemas.ts zod · SETTINGS_KEYS 에 locale {#i18n-locale-store}
  - [x] data/settings.ts DEFAULTS — navigator.language 로 추정(ko 아니면 en) {#i18n-locale-default}
  - [x] 왜복 테스트 — 저장 뒤 loadSettings 가 같은 값을 돌려준다 {#i18n-locale-test}
- [x] 첫 실행 0단계 — 언어 고르기 · 0.5일 {#i18n-first-run}
  - [x] screens/home/empty.tsx 에 한국어/English 두 버튼을 「리포 등록」 앞에 {#i18n-first-run-ui}
  - [x] DB 는 boot.ts 가 이미 열어 둔다 — 리포 0개에서도 settings 쓰기가 된다는 것을 테스트로 고정 {#i18n-first-run-persist}
  - [x] E2E E1(첫 실행) 시나리오에 언어 선택 한 걸음 추가 {#i18n-first-run-e2e}
- [x] 설정 「모양」 절에 언어 스위치 · 0.3일 {#i18n-settings-switch}
  - [x] Switch 프리미티브 재사용 + saveSetting('locale') {#i18n-settings-switch-ui}
  - [x] 전환은 location.reload() — 프로바이더를 200 파일에 꿰는 비용을 피한다 {#i18n-settings-switch-reload}
- [x] 조판 로케일 축 · 0.5일 (선행: 05 §9 갱신) {#i18n-typography}
  - [x] <html lang · data-locale> 를 세우는 자리를 한 곳으로(applyTheme 옵에) {#i18n-typo-attr}
  - [x] en 에서 word-break: normal · --measure 재조정 — keep-all 은 한국어 전제다 {#i18n-typo-css}
  - [x] tests/gates/design.spec.ts 행 길이 검사에 로케일 분기 + measure.allow.json 정리 {#i18n-typo-gate}

## P2 · 문구 전수 추출 (끝: 사전을 끘 앱의 모든 문구가 t() 를 거친다) {#p2}
- [x] 화면 문구 — screens/ 6.8천 자 · 1일 {#i18n-extract-screens}
  - [x] screens/home (HomeScreen · data.ts · empty) {#i18n-extract-home}
  - [x] screens/ingest (phases 라벨 4칸 포함) {#i18n-extract-ingest}
  - [x] screens/settings (8절 + KeyPanel · PerfTable) {#i18n-extract-settings}
  - [x] screens/session (t1Copy · t2Copy · 세 판) {#i18n-extract-session}
- [x] 컴포넌트 문구 — components/ 11.8천 자 · 1일 {#i18n-extract-components}
  - [x] components/home 16종(마스트헤드·패널·대지·라벨) {#i18n-extract-comp-home}
  - [x] components/plate · components/session (사다리 4단 문구 포함) {#i18n-extract-comp-plate}
  - [x] components/t1 · components/t2 {#i18n-extract-comp-t12}
- [x] 프리미티브·오류 문구 · 0.5일 {#i18n-extract-ui}
  - [x] packages/ui/src/error-copy.ts — IpcError 코드별 문구 표 {#i18n-extract-errorcopy}
  - [x] announce · Toast · LiveRegion · Dee 문구 {#i18n-extract-primitives}
- [x] 카드 생성기 문구 — packages/cards 5.4천 자 · 0.8일 {#i18n-extract-cards}
  - [x] t0 3종(meaning · blank · point) {#i18n-extract-cards-t0}
  - [x] t1 스펙 카드 · 마스크 ·「…이어서」헤더 {#i18n-extract-cards-t1}
  - [x] t2 4종(배치 · 반경 · 흐름 · 방향)과 사유 템플릿 {#i18n-extract-cards-t2}
  - [x] 골든 픽스처는 ko 로 고정 — 하네스가 로케일을 ko 로 세우고 재생해 diff 0 {#i18n-extract-cards-golden}
- [x] 채점 피드백 문구 — packages/grading 3.9천 자 · 0.7일 {#i18n-extract-grading}
  - [x] t0 오답 문구·사다리 단별 문구 {#i18n-extract-grading-t0}
  - [x] t1 줄 판정·이의·왜 게이트 문항 {#i18n-extract-grading-t1}
  - [x] t2 티어별 문구와「이것도 맞다」 {#i18n-extract-grading-t2}

## P3 · 사전 영문화와 마이그레이션 (끝: en 으로 열면 카드 본문까지 영어다) {#p3}
- [x] 사전 스키마·린트 확장 · 0.5일 (선행: D118) {#i18n-dict-schema}
  - [x] zod 를 문자열마다 `{ ko, en }` 유니온(스칼라 = ko)으로 넓히고 pnpm dict:schema 재생성 — *_en 접미 필드가 아니다(03 §4.4) {#i18n-dict-schema-fields}
  - [x] dict:lint — 조사 검사는 ko 에만 걸고 en 은 금지어·변수 참조만 검사 {#i18n-dict-schema-lint}
- [x] 57 YAML 영문화 · 6일 {#i18n-dict-translate}
  - [x] **먼저** dictionary/_glossary.en.yaml — 개념 이름 ko→en 용어집을 만들어 사용자가 확정한다. 나머지 문자열은 이 용어집에 고정해 번역한다 (사용자 결정 2026-09-04) {#i18n-dict-review}
  - [x] dictionary/common (보편 개념) {#i18n-dict-common}
  - [x] dictionary/ts · dictionary/react {#i18n-dict-ts-react}
  - [x] dictionary/arch (T2 개념 4종) {#i18n-dict-arch}
  - [-] 나머지 언어 사전 {#i18n-dict-rest}
- [x] loader 폴백과 고지 — en 결측 개념은 ko 로 내도로 보이고 그 사실을 판에 한 줄로 · 0.3일 {#i18n-dict-fallback}
- [x] 0002 마이그레이션 · 0.5일 {#i18n-migration}
  - [x] concept.name_en ADD COLUMN — 원장은 추가만(02 §2.2) {#i18n-migration-ddl}
  - [x] SCHEMA_VERSION · catalog 갱신, 백업·상위 버전 거부 경로 테스트 {#i18n-migration-runner}
- [ ] en 스모크 게이트 · 0.5일 {#i18n-en-smoke}
  - [ ] E2E 3화면(첫 실행 · 홈 · 세션)을 en 으로 한 번 {#i18n-en-smoke-e2e}
  - [ ] 시각 기준선 40장은 ko 만 유지 — en 은 axe serious 0 과 행 길이만 재다 {#i18n-en-smoke-visual}

<!-- oculpm:plan-log begin v1 -->
| 시각 | 항목 | 에이전트 | 변화 | 일지 | 메모 |
|---|---|---|---|---|---|
| 2026-09-04T07:53:49+09:00 | #i18n-d117-row | claude-code | ☐→x | .oculpm/journal/20260904/Chores/0753_chore_d117-d118-locale-axis-registry.md | D114 는 M5 가 이미 씀 — D117 로 밀어 올림 |
| 2026-09-04T07:53:56+09:00 | #i18n-d117-confirm | claude-code | ☐→x | .oculpm/journal/20260904/Chores/0753_chore_d117-d118-locale-axis-registry.md | 사용자 확인 2026-09-04 — 요청 넷 먼저 착수 |
| 2026-09-04T07:54:03+09:00 | #i18n-d117-apply | claude-code | ☐→x | .oculpm/journal/20260904/Chores/0753_chore_d117-d118-locale-axis-registry.md | 05 §2.1 두 행 · 06 §2 표와 머리말 · CLAUDE.md · 00 §7-1 |
| 2026-09-04T07:54:09+09:00 | #i18n-d118-row | claude-code | ☐→x | .oculpm/journal/20260904/Chores/0753_chore_d117-d118-locale-axis-registry.md | 옛 D117 → D118. name.en 은 이미 55/57 에 있음 |
| 2026-09-04T07:54:15+09:00 | #i18n-d118-apply | claude-code | ☐→x | .oculpm/journal/20260904/Chores/0753_chore_d117-d118-locale-axis-registry.md | 03 §4.4 로케일 문단 · §5.1 린트 · 02 §2.1 마이그레이션 목록 · §2.2 concept 주석 |
| 2026-09-04T07:54:23+09:00 | #i18n-measure-axis | claude-code | ☐→x | .oculpm/journal/20260904/Chores/0753_chore_d117-d118-locale-axis-registry.md | 05 §9 ko 30~45 / en 45~68 (좁은 패널 22 / 33), 06 §2 가 따라옴 |
| 2026-09-04T08:19:09+09:00 | #i18n-package-t | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0819_feature_i18n-skeleton-and-first-run-locale.md | render() 위의 얇은 층 — 새 엔진 없음 |
| 2026-09-04T08:19:16+09:00 | #i18n-package-catalog | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0819_feature_i18n-skeleton-and-first-run-locale.md | ko 가 MessageKey 정본 · en 은 Partial · 폴백 |
| 2026-09-04T08:19:22+09:00 | #i18n-package-josa | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0819_feature_i18n-skeleton-and-first-run-locale.md | render(tpl, vars, {josa:false}) — text 는 로케일 이름을 모른다 |
| 2026-09-04T08:19:28+09:00 | #i18n-package-lint | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0819_feature_i18n-skeleton-and-first-run-locale.md | catalog.test.ts 5종(고아·빈값·변수집합·josa·안 쓰는 키) + eslint 잎 등록 |
| 2026-09-04T08:19:33+09:00 | #i18n-locale-store | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0819_feature_i18n-skeleton-and-first-run-locale.md | types.ts · schemas.ts zod · SETTINGS_KEYS · KEY_OF |
| 2026-09-04T08:19:38+09:00 | #i18n-locale-default | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0819_feature_i18n-skeleton-and-first-run-locale.md | DEFAULTS.locale = guessLocale() — defaultTrim() 과 같은 꼴 |
| 2026-09-04T08:19:44+09:00 | #i18n-locale-test | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0819_feature_i18n-skeleton-and-first-run-locale.md | rows.test.ts 왕복이 locale 을 포함 · 행 수를 SETTINGS_KEYS 에서 파생 |
| 2026-09-04T08:19:50+09:00 | #i18n-first-run-ui | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0819_feature_i18n-skeleton-and-first-run-locale.md | Switch 재사용 · 언어 이름은 그 언어로 · empty.test.tsx 4건 |
| 2026-09-04T08:19:57+09:00 | #i18n-first-run-persist | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0819_feature_i18n-skeleton-and-first-run-locale.md | e2e-ui 14 가 리포 0개에서 settings.locale 행을 확인 (CI 에서 매번 돈다) |
| 2026-09-04T08:20:03+09:00 | #i18n-first-run-e2e | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0819_feature_i18n-skeleton-and-first-run-locale.md | E1 에 0단계 한 걸음 추가 — 실 바이너리라 리눅스 CI 에서 처음 돈다 |
| 2026-09-04T08:20:09+09:00 | #i18n-settings-switch-ui | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0819_feature_i18n-skeleton-and-first-run-locale.md | 「모양」 절에 표시 언어 행 — 저장 버튼 없는 규약 그대로 |
| 2026-09-04T08:20:15+09:00 | #i18n-settings-switch-reload | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0819_feature_i18n-skeleton-and-first-run-locale.md | 저장이 끝난 뒤 reload — 먼저 새로 고치면 쓰기가 잘린다 |
| 2026-09-04T08:20:21+09:00 | #i18n-typo-attr | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0819_feature_i18n-skeleton-and-first-run-locale.md | applyLocale() 이 lang·data-locale 을 세우는 유일한 자리 |
| 2026-09-04T08:20:27+09:00 | #i18n-typo-css | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0819_feature_i18n-skeleton-and-first-run-locale.md | reset.css 에 word-break:normal · --measure 30em (토큰 파일은 design:sync 것이라 손대지 않음) |
| 2026-09-04T08:20:33+09:00 | #i18n-typo-gate | claude-code | ☐→x | .oculpm/journal/20260904/Features_to_add/0819_feature_i18n-skeleton-and-first-run-locale.md | MEASURE 로케일 표 + 0건 통과 구멍 막음 + allow 4→2 (D112 잔여 정리) |
| 2026-09-04T09:55:26+09:00 | #i18n-extract-session | claude-code | ☐→x |  |  |
| 2026-09-04T09:55:27+09:00 | #i18n-extract-comp-plate | claude-code | ☐→x |  |  |
| 2026-09-04T09:55:29+09:00 | #i18n-extract-comp-t12 | claude-code | ☐→x |  |  |
| 2026-09-04T09:55:33+09:00 | #i18n-extract-errorcopy | claude-code | ☐→x |  |  |
| 2026-09-04T09:55:34+09:00 | #i18n-extract-primitives | claude-code | ☐→x |  | announce·Toast·LiveRegion·Dee 는 문구를 props 로만 받아 옮길 것이 없었다 |
| 2026-09-04T09:55:36+09:00 | #i18n-extract-cards-t0 | claude-code | ☐→x |  | t0-point 의 josa 중복 출력 버그를 여기서 잡았다 |
| 2026-09-04T09:55:38+09:00 | #i18n-extract-cards-t1 | claude-code | ☐→x |  |  |
| 2026-09-04T09:55:39+09:00 | #i18n-extract-cards-t2 | claude-code | ☐→x |  |  |
| 2026-09-04T09:55:41+09:00 | #i18n-extract-cards-golden | claude-code | ☐→x |  | 골든 63건이 재녹화 없이 통과 — 로케일 ko 고정 |
| 2026-09-04T09:55:42+09:00 | #i18n-extract-grading-t0 | claude-code | ☐→x |  |  |
| 2026-09-04T09:55:44+09:00 | #i18n-extract-grading-t1 | claude-code | ☐→x |  |  |
| 2026-09-04T09:55:46+09:00 | #i18n-extract-grading-t2 | claude-code | ☐→x |  |  |
| 2026-09-04T09:55:47+09:00 | #i18n-dict-schema-fields | claude-code | ☐→x |  | why_gate.help·diag.edge.h 도 열었다 — 안 열면 번역 불가 |
| 2026-09-04T09:55:49+09:00 | #i18n-dict-schema-lint | claude-code | ☐→x |  | 태그·속성 검사는 en 에도 건다 — HTML 은 언어가 없다 |
| 2026-09-04T09:55:50+09:00 | #i18n-dict-fallback | claude-code | ☐→x |  | 개념이 untranslated[] 로 어느 필드가 폴백했는지 들고 온다 |
| 2026-09-04T09:55:52+09:00 | #i18n-migration-ddl | claude-code | ☐→x |  |  |
| 2026-09-04T09:55:53+09:00 | #i18n-migration-runner | claude-code | ☐→x |  |  |
| 2026-09-04T09:55:55+09:00 | #i18n-dict-review | claude-code | ☐→~ |  | _glossary.en.yaml 초안 55행. 이름 충돌 3건·대문자 5건·의도적 차이 24쌍을 사용자가 확정해야 나머지가 돈다 |
| 2026-09-04T11:17:09+09:00 | #i18n-extract-home | claude-code | ☐→x | 20260904/Features_to_add/1116_feature_parallel-v03-course-screen-i18n-dict.md | HomeScreen · data.ts · empty. ko/home.ts 147키 신설 |
| 2026-09-04T11:17:11+09:00 | #i18n-extract-ingest | claude-code | ☐→x | 20260904/Features_to_add/1116_feature_parallel-v03-course-screen-i18n-dict.md | phases 4칸 포함. 제목의 조사를 josa 필터로 — 옛 문구는 띄어 쓰고 을 로 고정했다 |
| 2026-09-04T11:17:14+09:00 | #i18n-extract-settings | claude-code | ☐→x | 20260904/Features_to_add/1116_feature_parallel-v03-course-screen-i18n-dict.md | 8절 + KeyPanel · PerfTable. **bold** 가 그대로 보이던 두 곳을 &lt;b&gt;+RichText 로 |
| 2026-09-04T11:17:16+09:00 | #i18n-extract-comp-home | claude-code | ☐→x | 20260904/Features_to_add/1116_feature_parallel-v03-course-screen-i18n-dict.md | 16종 + 상위가 TimeQueue 를 queue.* 로. 화면 문구 2,513자 → 0 |
| 2026-09-04T11:17:18+09:00 | #i18n-dict-review | claude-code | ~→x | 20260904/Features_to_add/1116_feature_parallel-v03-course-screen-i18n-dict.md | 사용자 확정 — status: confirmed, 규칙 셋을 rules: 로 파일에 박았다. name.en 5개 변경 |
| 2026-09-04T11:17:19+09:00 | #i18n-dict-common | claude-code | ☐→x | 20260904/Features_to_add/1116_feature_parallel-v03-course-screen-i18n-dict.md | 22/22 · 113 문자열 |
| 2026-09-04T11:17:24+09:00 | #i18n-dict-ts-react | claude-code | ☐→x | 20260904/Features_to_add/1116_feature_parallel-v03-course-screen-i18n-dict.md | ts 29/29 + react 2/2 · 875 문자열 |
| 2026-09-04T11:17:26+09:00 | #i18n-dict-arch | claude-code | ☐→x | 20260904/Features_to_add/1116_feature_parallel-v03-course-screen-i18n-dict.md | 4/4 · 16 문자열 |
| 2026-09-04T11:17:29+09:00 | #i18n-dict-rest | claude-code | ☐→- | 20260904/Features_to_add/1116_feature_parallel-v03-course-screen-i18n-dict.md | 남은 것이 없다 — dictionary/ 는 네 네임스페이스뿐이고 57 = 55 개념 + _lang 둘, 앞 세 항목이 다 덮었다. 다른 언어 사전(python·rust)은 아직 없다 |
<!-- oculpm:plan-log end -->
