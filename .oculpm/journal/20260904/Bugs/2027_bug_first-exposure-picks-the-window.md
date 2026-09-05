---
schema_version: 1
type: bug
slug: "first-exposure-picks-the-window"
status: done
difficulty: high
created_at: "2026-09-04T20:27:50+09:00"
session_id: "20260904-007"
agent:
  id: "claude-code"
  version: "Opus 5 (1M)"
  session: "48d5c10e-8d37-41af-be6f-b5ac876b1ad7"
language: "ko"
verified_by_user: false
files_touched:
  - path: "docs/00-overview.md"
    op: update
  - path: "docs/02-data-model-and-scheduling.md"
    op: update
  - path: "docs/03-ingest-parsing-dictionary.md"
    op: update
  - path: "packages/store-sql/migrations/0006_site_window_unknown.sql"
    op: create
  - path: "packages/store-sql/statements/derive.sql"
    op: update
  - path: "packages/store-sql/statements/card.sql"
    op: update
  - path: "packages/store-sql/statements/home.sql"
    op: update
  - path: "packages/store-sql/statements/queue.sql"
    op: update
  - path: "packages/store-sql/src/catalog.ts"
    op: update
  - path: "packages/store-sql/src/types.ts"
    op: update
  - path: "packages/concepts/src/unknown-rank.ts"
    op: update
  - path: "packages/concepts/src/ingest.ts"
    op: update
  - path: "packages/concepts/src/index.ts"
    op: update
  - path: "packages/concepts/src/concepts.test.ts"
    op: update
  - path: "packages/cards/src/lines.ts"
    op: update
  - path: "apps/desktop/src/data/blocks.ts"
    op: correct
  - path: "apps/desktop/src/data/maintenance.test.ts"
    op: correct
  - path: "fixtures/db/v0006.db"
    op: create
related: []
tags:
  - "D155"
  - "미지-개념"
  - "첫-노출"
  - "인제스트"
  - "마이그레이션"
  - "mcp-tool"
---
[x] 첫 노출이 가장 큰 파일로만 갔다 — 창을 재지 않아서 (D155)

사용자가 「앱을 실행하면 무슨 소리인지 하나도 모르겠다」고 했다. 추측하지 않고 실제 앱 DB
(`~/Library/Application Support/dev.chickadee.app/chickadee.db`)를 열어 무엇이 나갔는지 봤다.

## 발생 원인

등록된 리포는 `PySpace`(Tauri 앱), 읽힌 파일 5장, 그중 `src/App.tsx` 가 1,747줄이다.
`declared_newcomer=true`. 큐가 새 판으로 낸 `ts/number-literal` 카드(card 4)는 이랬다:

```
86행의 56 에 따옴표를 씌우면 56 + 1 의 값은 무엇이 될까요?

function Spark({ data, w = 56, h = 16 }: { data: number[]; w?: number; h?: number }) {
```

「숫자」를 묻는 창에 템플릿 문자열·메서드 체인·화살표 함수·기본값 붙은 구조분해·인라인 객체
타입·옵셔널 속성·스프레드가 전부 들어 있다.

원인은 **순위가 초점 줄만 재고 창은 안 재는 것**이었다. `unknownCount` 는
`site.lineConcepts`(그 줄의 다른 개념) + 선행 2단만 세는데, 판이 보여 주는 것은 D141 이후
**감싸는 블록 ∪ 초점 ±2**(상한 40줄)다. 그래서 site 98(`56`)은 같은 줄 개념이
`ts/function-declaration` 하나라 `unknown_count = 0` 을 받았다.

`card.sites_for_concept` 의 정렬이 `unknown_count, uncovered_ratio, (line_end-line_start),
is_dirty, f.path, s.id` 인데 261곳 중 미지 0 인 다섯이 앞의 넷에서 전부 동률이라
**`f.path` 알파벳순**이 승부를 갈랐다 — `src/App.tsx` < `src/components/TerminalView.tsx`.
`const MIN_FONT = 9;`(정본 §4 가 적격 예로 든 바로 그 모양)이 같은 후보 안에 있었는데 졌다.

`uncovered_ratio`(> 0.5 면 +1)가 이것을 잡았어야 했다. 그런데 4,488 사용처 평균이 **0.00**
이라 한 번도 안 걸린다 — `uncovered()` 가 `site.excerpt`(= `"56"`) 토큰만 재고, 감싸는
`function-declaration` 의 바이트 범위가 그것을 「덮은 것」으로 치기 때문이다. 이 자리는
고치지 않았다(D155 근거 열에 적어 두었다).

## 해결 방법

`concept_site.window_unknown` 을 더하고 정렬의 **둘째 키**로 넣는다.

1. 창의 정의를 `unknown-rank.ts` 의 `windowRange()` **하나**로 모으고 `cards/lines.ts` 의
   `windowOf` 가 그것을 부르게 했다. 판이 그리는 창과 순위가 재는 창이 갈라지면 이 결함이
   그대로 돌아온다.
2. `windowUnknown(site, block, index, layerOf)` — 창 안의 미지 개념 수. 사용처마다 파일
   전량을 훑으면 제곱이라 `lineIndex()`(줄 → 개념)를 파일당 한 번 만들어 돌려 쓴다.
3. `recountUnknown` 이 두 수를 **한 패스에서** 낸다. 겹이 바뀌면 둘 다 바뀐다.
4. 정렬: `unknown_count → window_unknown → uncovered_ratio → 줄 수 → is_dirty → 경로`.
   첫 키는 안 건드렸다 — 「오늘 낼 수 있는가」의 문턱(`MAX_UNKNOWN_FOR_NEW` 3)은 초점 줄
   기준 그대로이고 창은 **순서만** 정한다.
5. 마이그레이션 0006 이 열·인덱스를 더하고 살아 있는 T0 카드를 은퇴시킨다 — 0004(D141)와
   같은 이유·같은 방법(`content_hash` 접두어 `d155:`)이다.

6. 같은 이행이 `ingest_run.fingerprint` 를 `d155:` 로 비켜 세워 홈에 「재인제스트 필요」를
   띄운다. 이것이 없으면 고친 것이 사용자에게 닿지 않는다 — 새 열은 이행 직후 전부 0 이고
   채우는 것은 `recountUnknown`(인제스트 뒤·세션 뒤)인데, T0 카드를 은퇴시켰으므로 **다음
   세션이 먼저 굽는다**. 0 뿐인 열로 정렬하면 옛 순서대로 같은 자리를 골라 굽고 그 판은
   눌러앉는다. 재인제스트는 굽기 전에 recount 를 돌린다. 지우지 않고 비켜 세우는 이유는
   `needsReingest` 가 빈 지문을 「비교할 것 없음」으로 읽어 배너를 내지 않기 때문이다.

지나가다 고친 것 둘. `Settings` 에 `rootCleared` 가 빠져 있어 `pnpm typecheck` 가 HEAD 에서
빨간 상태였고, 그것이 가리고 있던 `apps/desktop/src/data/blocks.ts` 의 실제 결함이 드러났다 —
추적 카드 생성기에 `string[]` 을 넘기고 `l.t` 로 읽어 본문이 `"undefined\nundefined…"` 가
된다. 읽어 온 첫 줄이 `block.lineStart` 이므로 그 자리에서 `FocusLine` 으로 바꿔 넘긴다.

## 검증

- `pnpm typecheck` · `pnpm lint` 초록, `npx vitest run` 2,013 통과(179 파일). `concepts.test.ts`
  에 D155 다섯 건을 더했고 실제로 나갔던 판을 그대로 옮겨 적었다.
- 실 DB 사본에 0006 을 적용하고 같은 알고리즘으로 `window_unknown` 을 채운 뒤 새 ORDER BY 로
  재조회: `ts/number-literal` 이 `App.tsx:86`(창 14줄·미지 10) → `TerminalView.tsx:23`
  「`9`」(창 5줄·미지 0), `return-statement` → `return ctx;`, `boolean-literal` 미지 9 → 3.
  T0 카드 29장 은퇴. 지문이 `b8322f78…` → `d155:b8322f78…` 로 바뀌어 배너 조건이 선다.
- `migrate-seed.test.ts` 가 요구하는 `fixtures/db/v0006.db` 를 v0005 에 0006 을 적용해 넣었다.