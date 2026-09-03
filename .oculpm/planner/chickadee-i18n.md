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

## P0 · 결정 등록부 — D114 · D117 (사용자 확인이 선행, 문서 수정은 그 뒤) {#p0}
- [ ] D114 — 앱 UI 문구에 로케일 축을 연다(ko 정본 · en 병기) · 0.2일 {#i18n-d114}
  - [ ] docs/00-overview.md §4.2.1 에 D114 행 — 결정·사유·반영 세 열 {#i18n-d114-row}
  - [ ] 사용자 확인 — D61「앱 UI 문구 = 한국어」를 여는 행이라 확인 없이 문서를 고치지 않는다 {#i18n-d114-confirm}
  - [ ] 반영 — docs/05 §2.1 설정 화면 행에「표시 언어」, docs/06 §2 게이트 표에 로케일 축 {#i18n-d114-apply}
- [ ] D117 — 사전 이중 언어(name_en · one_liner_en · 템플릿 en)와 concept.name_en ALTER ADD COLUMN · 0.1일 {#i18n-d117}
  - [ ] docs/00 §4.2.1 에 D117 행 {#i18n-d117-row}
  - [ ] 반영 — docs/03 사전 스키마 절과 docs/02 §2.2 원장 변경 규칙(추가만) {#i18n-d117-apply}
- [ ] docs/05 §9 본문 행 길이(30~45자)에 로케일 축 — D112 가 이 자리를 정본으로 지정했고 06 §2 가 따라온다 · 0.1일 {#i18n-measure-axis}

## P1 · i18n 뼈대와 첫 실행 언어 선택 (끝: 첫 실행에서 고른 언어가 재실행에도 남는다) {#p1}
- [ ] packages/i18n 신설 · 0.5일 (선행: D114) {#i18n-package}
  - [ ] t(key, vars) — @chickadee/text 의 render() 필터 연쇄 위에 올린다(새 엔진 금지) {#i18n-package-t}
  - [ ] 카탈로그 타입 — ko 를 정본으로 키 집합을 넣고 en 은 Partial, 누락 키는 ko 폴백 {#i18n-package-catalog}
  - [ ] josa 필터를 en 에서 항등으로 — packages/text/src/template.ts {#i18n-package-josa}
  - [ ] 누락 키·고아 키 린트 테스트 + 워크스페이스 등록(tsconfig · eslint 의존 방향) {#i18n-package-lint}
- [ ] Settings.locale('ko'|'en') 추가 · 0.3일 {#i18n-locale-setting}
  - [ ] store-sql types.ts · schemas.ts zod · SETTINGS_KEYS 에 locale {#i18n-locale-store}
  - [ ] data/settings.ts DEFAULTS — navigator.language 로 추정(ko 아니면 en) {#i18n-locale-default}
  - [ ] 왜복 테스트 — 저장 뒤 loadSettings 가 같은 값을 돌려준다 {#i18n-locale-test}
- [ ] 첫 실행 0단계 — 언어 고르기 · 0.5일 {#i18n-first-run}
  - [ ] screens/home/empty.tsx 에 한국어/English 두 버튼을 「리포 등록」 앞에 {#i18n-first-run-ui}
  - [ ] DB 는 boot.ts 가 이미 열어 둔다 — 리포 0개에서도 settings 쓰기가 된다는 것을 테스트로 고정 {#i18n-first-run-persist}
  - [ ] E2E E1(첫 실행) 시나리오에 언어 선택 한 걸음 추가 {#i18n-first-run-e2e}
- [ ] 설정 「모양」 절에 언어 스위치 · 0.3일 {#i18n-settings-switch}
  - [ ] Switch 프리미티브 재사용 + saveSetting('locale') {#i18n-settings-switch-ui}
  - [ ] 전환은 location.reload() — 프로바이더를 200 파일에 꿰는 비용을 피한다 {#i18n-settings-switch-reload}
- [ ] 조판 로케일 축 · 0.5일 (선행: 05 §9 갱신) {#i18n-typography}
  - [ ] <html lang · data-locale> 를 세우는 자리를 한 곳으로(applyTheme 옵에) {#i18n-typo-attr}
  - [ ] en 에서 word-break: normal · --measure 재조정 — keep-all 은 한국어 전제다 {#i18n-typo-css}
  - [ ] tests/gates/design.spec.ts 행 길이 검사에 로케일 분기 + measure.allow.json 정리 {#i18n-typo-gate}

## P2 · 문구 전수 추출 (끝: 사전을 끘 앱의 모든 문구가 t() 를 거친다) {#p2}
- [ ] 화면 문구 — screens/ 6.8천 자 · 1일 {#i18n-extract-screens}
  - [ ] screens/home (HomeScreen · data.ts · empty) {#i18n-extract-home}
  - [ ] screens/ingest (phases 라벨 4칸 포함) {#i18n-extract-ingest}
  - [ ] screens/settings (8절 + KeyPanel · PerfTable) {#i18n-extract-settings}
  - [ ] screens/session (t1Copy · t2Copy · 세 판) {#i18n-extract-session}
- [ ] 컴포넌트 문구 — components/ 11.8천 자 · 1일 {#i18n-extract-components}
  - [ ] components/home 16종(마스트헤드·패널·대지·라벨) {#i18n-extract-comp-home}
  - [ ] components/plate · components/session (사다리 4단 문구 포함) {#i18n-extract-comp-plate}
  - [ ] components/t1 · components/t2 {#i18n-extract-comp-t12}
- [ ] 프리미티브·오류 문구 · 0.5일 {#i18n-extract-ui}
  - [ ] packages/ui/src/error-copy.ts — IpcError 코드별 문구 표 {#i18n-extract-errorcopy}
  - [ ] announce · Toast · LiveRegion · Dee 문구 {#i18n-extract-primitives}
- [ ] 카드 생성기 문구 — packages/cards 5.4천 자 · 0.8일 {#i18n-extract-cards}
  - [ ] t0 3종(meaning · blank · point) {#i18n-extract-cards-t0}
  - [ ] t1 스펙 카드 · 마스크 ·「…이어서」헤더 {#i18n-extract-cards-t1}
  - [ ] t2 4종(배치 · 반경 · 흐름 · 방향)과 사유 템플릿 {#i18n-extract-cards-t2}
  - [ ] 골든 픽스처는 ko 로 고정 — 하네스가 로케일을 ko 로 세우고 재생해 diff 0 {#i18n-extract-cards-golden}
- [ ] 채점 피드백 문구 — packages/grading 3.9천 자 · 0.7일 {#i18n-extract-grading}
  - [ ] t0 오답 문구·사다리 단별 문구 {#i18n-extract-grading-t0}
  - [ ] t1 줄 판정·이의·왜 게이트 문항 {#i18n-extract-grading-t1}
  - [ ] t2 티어별 문구와「이것도 맞다」 {#i18n-extract-grading-t2}

## P3 · 사전 영문화와 마이그레이션 (끝: en 으로 열면 카드 본문까지 영어다) {#p3}
- [ ] 사전 스키마·린트 확장 · 0.5일 (선행: D117) {#i18n-dict-schema}
  - [ ] JSON Schema 에 name_en · one_liner_en · 템플릿 en 필드, pnpm dict:schema 재생성 {#i18n-dict-schema-fields}
  - [ ] dict:lint — 조사 검사는 ko 에만 걸고 en 은 금지어·변수 참조만 검사 {#i18n-dict-schema-lint}
- [ ] 57 YAML 영문화 · 6일 {#i18n-dict-translate}
  - [ ] dictionary/common (보편 개념) {#i18n-dict-common}
  - [ ] dictionary/ts · dictionary/react {#i18n-dict-ts-react}
  - [ ] dictionary/arch (T2 개념 4종) {#i18n-dict-arch}
  - [ ] 나머지 언어 사전 {#i18n-dict-rest}
  - [ ] 용어 일관성 검수 1회 — 같은 개념이 파일마다 다른 영단어로 나가지 않게 {#i18n-dict-review}
- [ ] loader 폴백과 고지 — en 결측 개념은 ko 로 내도로 보이고 그 사실을 판에 한 줄로 · 0.3일 {#i18n-dict-fallback}
- [ ] 0002 마이그레이션 · 0.5일 {#i18n-migration}
  - [ ] concept.name_en ADD COLUMN — 원장은 추가만(02 §2.2) {#i18n-migration-ddl}
  - [ ] SCHEMA_VERSION · catalog 갱신, 백업·상위 버전 거부 경로 테스트 {#i18n-migration-runner}
- [ ] en 스모크 게이트 · 0.5일 {#i18n-en-smoke}
  - [ ] E2E 3화면(첫 실행 · 홈 · 세션)을 en 으로 한 번 {#i18n-en-smoke-e2e}
  - [ ] 시각 기준선 40장은 ko 만 유지 — en 은 axe serious 0 과 행 길이만 재다 {#i18n-en-smoke-visual}

<!-- oculpm:plan-log begin v1 -->
| 시각 | 항목 | 에이전트 | 변화 | 일지 | 메모 |
|---|---|---|---|---|---|
<!-- oculpm:plan-log end -->
