---
schema_version: 1
type: feature
slug: "m2-t0-generators-and-template"
status: done
difficulty: high
created_at: "2026-09-03T10:10:44+09:00"
session_id: "20260903-003"
agent:
  id: "claude-code"
  version: "Opus 5 (1M context)"
language: "ko"
verified_by_user: false
files_touched:
  - path: "packages/text/src/template.ts"
    op: create
  - path: "packages/text/src/template.test.ts"
    op: create
  - path: "packages/text/src/index.ts"
    op: update
  - path: "packages/cards/src/types.ts"
    op: create
  - path: "packages/cards/src/hash.ts"
    op: create
  - path: "packages/cards/src/lines.ts"
    op: create
  - path: "packages/cards/src/vars.ts"
    op: create
  - path: "packages/cards/src/payload.ts"
    op: create
  - path: "packages/cards/src/t0-point.ts"
    op: create
  - path: "packages/cards/src/t0-blank.ts"
    op: create
  - path: "packages/cards/src/t0-meaning.ts"
    op: create
  - path: "packages/cards/src/t0.ts"
    op: create
  - path: "packages/cards/src/index.ts"
    op: create
  - path: "packages/cards/src/t0.test.ts"
    op: create
related: []
tags:
  - "m2"
  - "cards"
  - "t0"
  - "template"
  - "dictionary"
  - "mcp-tool"
---
[x] T0 카드 생성기 3종 + 사전 템플릿 렌더러 (D74)

## 추가 기능

04 §1 의 T0 카드 생성기 셋(지목·빈칸·의미)과 그 앞단인 사전 템플릿 렌더러.

- `packages/text/src/template.ts` — 03 §4.3 mustache 부분집합. `{{var}}` · 섹션 · 부정 ·
  필터 연쇄(`code`·`josa`). 치환된 **값만** 이스케이프하고 사전 원문의 허용 태그는 건드리지
  않는다. 없는 변수는 빈 문자열이 아니라 `missing` 으로 돌려준다 — 04 §1.3 의 「이 템플릿은
  이 Site 에 못 쓴다」 판정이 이것 위에 선다.
- `packages/cards/src/` — `prefer(ly)` 폴백 사슬, `noPlate` 사유, `CardPayload`(t0) 조립.
  사다리 재료(`dict` 3층 · `prereq` · `uses` · `payoff` · `bridge`)까지 굽는다.
  해시는 FNV-1a 두 벌(D70), 셔플·문항 선택은 `seedOf`→`mulberry32` 만 쓴다.

## 동작 흐름

`generateT0(req)` 가 `rank` 순 사용처를 돌며 `prefer(ly)` 순서로 유형을 시도하고 처음
성공한 카드를 돌려준다. 빈칸형이 leak(정답이 맥락 줄에 또 보임)이면 한 바퀴 미뤄 두고,
끝내 아무것도 없으면 가장 자주 나온 사유로 `{ noPlate, reason }` 을 낸다.
다시 찍기(04 §2.3)는 사슬을 타지 않으므로 `generateKind(req, kind, input)` 을 따로 뒀다.

## 문서와 어긋난 자리 (등록부 행이 필요하다)

1. **`josa` 필터의 뜻.** 번들 사전 191곳 중 185곳이 `{{x|code}}{{x|josa:은,는}}` 처럼
   값과 조사를 나눠 쓴다. 조사가 값을 다시 내면 「res.userres.user 은」이 된다. 그래서
   `josa` 는 **조사만** 내되 앞선 필터가 있으면 그 뒤에 붙이도록 했다 — D69 가 드는
   `{{x|code|josa:이,가}}` 는 그대로 `<code>x</code>이` 가 된다.
   남은 6곳(`array-map-immutable` · `array-method-chain` ×2 · `array-push-mutate` ·
   `for-of` ×2)은 값이 함께 나올 것을 기대하고 있어 명사가 빠진 문장이 된다.
2. **목업 `mapupdate` 는 `ly:3` 인데 빈칸형이다.** 04 §1.4 `prefer(3)` 은
   `[meaning, blank, point]` 이고 그 개념에는 의미형이 있으므로 사슬은 의미형을 고른다.
3. **`_lang.yaml.diag_default` 에 `blank` 폴백이 있다.** 04 §2.1 표는 빈칸형에 폴백이
   없다고 적는다(진단은 사전 필수). 코드는 04 를 따랐고 `diag_default.blank` 는 안 쓴다.
4. **`diag_default.point` 가 변수 뒤에 조사를 하드코딩한다**(`«{{pick}}» 은`).
   03 §4.3 이 금지하는 형태인데 린트는 `_lang.yaml` 을 보지 않는다.
5. **`packages/concepts/src/derive.ts` 의 `siteKey` 는 사실상 32비트다.**
   `hi` 와 `lo` 가 같은 문자열을 해싱해 16자리 hex 의 앞뒤 8자리가 언제나 같다.
   D70 은 「접두어를 달리해 64비트」다. 담당 밖이라 고치지 않았다.

## 검증

- `pnpm vitest run packages/cards packages/text` — 4 파일 88 테스트 통과.
- `pnpm --filter @chickadee/cards typecheck` · `npx eslint packages/cards packages/text` — 둘 다 무출력.
- 리포 전체 `pnpm vitest run` — 80 파일 719 테스트 통과(생성기 추가 전 기준에서 회귀 없음).