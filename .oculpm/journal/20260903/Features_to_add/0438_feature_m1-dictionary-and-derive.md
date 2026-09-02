---
schema_version: 1
type: feature
slug: "m1-dictionary-and-derive"
status: done
difficulty: high
created_at: "2026-09-03T04:38:50+09:00"
session_id: "20260903-002"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/dictionary/src/schema.ts"
    op: create
  - path: "packages/dictionary/src/bundle.ts"
    op: create
  - path: "packages/dictionary/src/load.ts"
    op: create
  - path: "packages/dictionary/src/lint.ts"
    op: create
  - path: "packages/dictionary/src/dict.test.ts"
    op: create
  - path: "packages/concepts/src/derive.ts"
    op: create
  - path: "packages/concepts/src/commits.ts"
    op: create
  - path: "packages/concepts/src/units.ts"
    op: create
  - path: "packages/concepts/src/gaps.ts"
    op: create
  - path: "packages/concepts/src/unknown-rank.ts"
    op: create
  - path: "packages/concepts/src/ingest.ts"
    op: create
  - path: "packages/concepts/src/repos.ts"
    op: create
  - path: "packages/concepts/src/blame.ts"
    op: create
  - path: "packages/store-sql/statements/derive.sql"
    op: create
  - path: "packages/store-sql/statements/home.sql"
    op: create
  - path: "packages/ipc-client/src/logger.ts"
    op: create
  - path: "crates/parse/tests/dictionary.rs"
    op: create
  - path: "dictionary/ts/_lang.yaml"
    op: create
  - path: ".github/workflows/ci.yml"
    op: update
related: []
tags:
  - "m1"
  - "dictionary"
  - "concepts"
  - "derive"
  - "d69"
  - "d70"
  - "d71"
  - "mcp-tool"
---
[x] M1 · 문법 사전 1차(TS 31 + 보편 22 + arch 4 + react 1) · 파생 층 · 로그 래퍼

## 추가 기능

**`packages/dictionary`** — 번들 사전(Vite 가 굽는다, D66) → zod 검증 → `LangSpec`. 스키마를 어긴 파일은 **건너뛰고 `problems` 에 남긴다**(사전 파일 하나가 앱을 못 열게 하면 커뮤니티 기여가 곧 장애다). 린트가 보는 것: 참조 존재·선행 사이클·지목형 `answer` 가 자기 쿼리의 pick 인지·빈칸 오답이 혼동 쌍 토큰인지·템플릿 변수 허용 목록·HTML 6태그 0속성·**변수 뒤 조사 금지**·「틀렸다」 금지·`trace` 가 코드를 짚는지.

**`packages/concepts`** — `derive.ts`(매치 그룹화 → ERROR 폐기 → 맥락 병합 → `lineConcepts`·`uncoveredRatio` → `shape` → `occurrence` → `siteKey`) · `commits.ts`(분류·identity) · `units.ts`(대지 4규칙) · `gaps.ts`(구멍 지도) · `unknown-rank.ts`(미지 개수·첫 노출) · `prereq-graph.ts`(위상) · `repos.ts`(장부, D65) · `blame.ts`(2차 패스) · `ingest.ts`(한 바퀴).

**사전 내용** — `ts/` 31개념(쿼리 포함) · `common/` 22 · `arch/` 4(T2 숙련도 키) · `react/functional-state-update`(D59 감지 게이트). 병렬 하위 세션 셋이 슬라이스를 나눠 썼고, 각자 `cargo test --test dictionary` 와 `pnpm dict:lint` 를 통과시킨 뒤 냈다.

**`logger.ts`** — 금지 필드를 **이름으로** 지우고 절대 경로를 마지막 두 조각으로 줄인다. 프로젝트에서 `console` 을 쓰는 유일한 파일이고, Rust 게이트에도 `println!`·`eprintln!`·`dbg!` 금지를 더했다.

## 병렬 하위 세션이 찾아 준 것 (내 버그 둘)

1. **`_lang.yaml` 이 없는 네임스페이스가 아예 로드되지 않았다.** `bundledLangs()` 가 `_lang.yaml` 이 있는 디렉터리만 언어로 쳤는데 `common/` 에는 그 파일이 없다(03 §4.1 그림이 그렇다). 그래서 **모든 언어 개념의 `universal:` 이 끊겨** 린트에 30건이 떴다. 셋이 각자 같은 증상을 보고했고 한 명은 임시로 `common/_lang.yaml` 을 만들어 원인을 증명했다. 고침: `_lang.yaml` 은 선택이고, 없는 네임스페이스는 개념만 싣는다. 시스템 쿼리는 **문법마다** 하나면 되게 바꿔 `react/`·`arch/` 의 복사본도 없앴다.
2. **`one_liner` 80자 상한을 태그까지 세고 있었다.** 문서 §4.5 의 본보기 자체가 86자로 떨어졌다. 고침: 상한은 **태그를 뺀 길이**로 잰다(진단문 300자도 같이).

## 실측

배포되는 사전 전량을 얹어 인제스트를 돌린 결과:
- `tiny` 픽스처(5파일) — 캡처 781 · 커밋 5 · **1,026 ms**
- 이 리포 자신(TS 113파일) — 캡처 **75,584** · 커밋 10 · 경고 1 · **2,942 ms** (03 §7 예산은 10만 줄 15s)

캡처가 파일당 670개인 것은 바닥 개념(`const-declaration`·`call-expression`·`property-access`·`string-literal`)이 곳곳에서 잡히기 때문이고, 이는 설계대로다(03 §3.1 — 미지 개념 개수가 이것들을 세어야 성립한다). 다만 10만 줄 리포면 `capture` 행이 50만 건 규모가 된다 — **M2 에서 볼 것**.

## 문서와 달라진 것

- **D69** 사전 스키마는 zod 가 정본, `concept.schema.json` 은 생성물(어긋나면 테스트 실패). 템플릿 필터 연쇄 허용(`{{x|code|josa:이,가}}`) — 조사 규칙 때문에 필요하다.
- **D70** `site_key` 는 sha1 이 아니라 FNV-1a 두 벌(64비트). 웹뷰의 `crypto.subtle` 이 비동기라 사용처 5만 건에 프로미스 5만 개가 생긴다.
- **D71** ESLint 의존 방향표에 `concepts → ipc-client` 를 더했다. 01 §3.3·03 §1.5 가 이미 산문으로 그렇게 적고 있었고 §2 표만 빠져 있었다.

## 검증

- `pnpm dict:lint` — 11건 통과(스키마 위반 0 · 린트 위반 0 · JSON Schema 무표류 · 필수 문법 전량 존재 · 프레임워크 게이트).
- `cargo test -p chickadee-parse --test dictionary` — 5건 통과(모든 `.scm` 컴파일 · 캡처 이름 규약 · 죽은 패턴 없음 · `examples` 전부 일치).
- `pnpm test:unit` 294건 · `cargo test --workspace` 71건 · `pnpm lint` · `pnpm typecheck` · `pnpm build` 통과.
- `bash scripts/check-rust-budget.sh` — 2036/2100(잠정, D68), 금칙어·SQL·raw output·git 바이너리 0.
- CI 에 `integration` 잡을 켰다 — 픽스처 생성 → pipeline·dictionary 테스트 → `git diff --exit-code fixtures/ipc`.