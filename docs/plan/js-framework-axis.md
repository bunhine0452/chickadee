# 자바스크립트·타입스크립트 프레임워크 축 — 착수 계획

**상태: 계획. 결정 등록부에 행이 없다** — §7 이 올려야 할 행의 초안이고, 착수 결정은 사용자가 한다.
조사일 2026-09-05. 대상은 사용자 리포 다섯이고 전부 읽기만 했다.

이 문서가 답하는 것은 「자바 말고 다른 언어도 지원하려면 무엇을 해야 하나」의 JS·TS 몫이다.
**언어 어휘는 이미 가장 두껍다**(`dictionary/ts/` 38장, `docs/curriculum/ts.md` 가 그 재검토다).
비어 있는 것은 그 위층 — 프레임워크와 진입점이다.

---

## 1. 실측 — 브리프의 전제가 하나 틀렸다

### 1.1 다섯 리포가 실제로 쓰는 것

`package.json` 의 `dependencies`·`devDependencies`·`scripts`·`bin` 을 읽은 값이다.

| 리포 | 파일(소스) | 커밋 | 실제 스택 | 테스트 명령 |
|---|---|---|---|---|
| `ECC` | js 410 · py 63 · ts 18 · rs 16 · mjs 12 | 2,271 | **Node CLI** — `bin` 4개, 스크립트 30개가 전부 `node scripts/*.js`. deps 셋(`ajv`·`@iarna/toml`·`sql.js`) | `node tests/run-all.js` (+ 검증 스크립트 8개) |
| `ai-pm` | ts 322 · tsx 291 · rs 280 | 746 | **React 19 + Vite + Tauri** | `vitest run` |
| `bunhine_web` | ts 27 · astro 26 · mjs 18 | 258 | **Astro** (`@astrojs/vercel`·`@astrojs/mdx`) | 없음 |
| `file_converter` | rs 45 · tsx 25 · ts 24 | 31 | **React + Vite + Tauri** | `vitest run` |
| `MonggleMonggle` | vue 24 · js 22 · py 16 | 254 | **Vue 3 + Pinia + axios** (백엔드는 Spring) | 없음 |

**Express·NestJS·SvelteKit 은 한 리포에도 없다.** 정규식으로 `app.get('/…')`·`@Controller` 를
다섯 리포 전량에서 찾아 **0건**이다. 브리프가 이름을 댄 다섯 프레임워크 중 실제로 있는 것은
Astro 하나이고, 대신 브리프에 없던 것이 둘 있다 — **Tauri IPC**(두 리포)와 **Node CLI**(한 리포).
계획은 실측을 따른다.

### 1.2 오늘 진입점이 몇 개 서나 — 다섯 중 넷이 0이다

`entryUnits`(`packages/concepts/src/units.ts:151`)는 `kind === 'http'` 인 엣지의 `from` 을 진입점으로
삼는다. 그 엣지를 만드는 것은 `dictionary/ts/_imports.scm` 의 `http-*` 쿼리 다섯인데, 그 쿼리는
**`member_expression` 형태만** 잡는다 — `api.post("/x")`·`axios.get("/y")`.

| 리포 | 지금 잡히는 HTTP 호출 | 안 잡히는 진입 표기 | 오늘 `entryUnits` |
|---|---|---|---|
| `ECC` | **0** | `bin` 4 · `scripts` 30 · shebang 148파일 | **0** |
| `ai-pm` | **0** | `commands.X()` 488자리 · 103파일 (Tauri) | **0** |
| `bunhine_web` | **0** | `fetch('/api/…')` 19자리 · 파일 라우트 11개 | **0** |
| `file_converter` | **0** | `invoke('cmd')` 17자리 | **0** |
| `MonggleMonggle` | 39자리 · 8파일 | — | 선다 |

**서는 리포는 규칙을 만들 때 대고 만든 그 리포 하나뿐이다.** 진입점이 0이면 기능 폐포가 안 서고,
챕터는 디렉터리 규칙(`assignUnits`)으로 내려앉는다 — 정본 §5 의 **티어 A**다. 학습 단위가 기능이라는
D159·D160 이 네 리포에서 실제로는 작동하지 않는다.

### 1.3 이음매가 정확히 맞는다 — `bunhine_web`

이 리포가 이 계획에서 가장 값싼 자리다.

- 프런트가 부르는 것: `fetch('/api/…')` **19자리 · 9파일 · 고유 경로 11개**
- 서버가 받는 것: `src/pages/api/*.ts` **11파일 · 핸들러 12개**(`export const POST: APIRoute = …`,
  `visit.ts` 만 GET·POST 둘)
- **경로 11개가 11개와 정확히 맞는다.** 접미 휴리스틱도 필요 없다 — 글자가 같다.

그런데 `resolveTs` 는 이미 `spec.startsWith('/api/')` 를 받아 `nextRoute()` 로 보내고,
`NEXT_ROOTS = ['', 'src/']` 라 `src/pages/api/delete.ts` 를 **이미 찾을 수 있다**
(`resolve-imports.ts:265`). 부족한 것은 **부르는 쪽의 캡처 하나**뿐이다.

### 1.4 죽은 갈래가 공짜로 나온다 — Tauri

`invoke('name')` ↔ `#[tauri::command]` 는 양쪽 다 글자다.

| 리포 | TS 쪽 호출 | Rust 쪽 선언 | 안 불리는 것 |
|---|---|---|---|
| `file_converter` | 17 (손으로 쓴 리터럴) | 18 | **`list_jobs` 하나** |
| `ai-pm` | 488자리 · 103파일 → 고유 293 | 350 (`bindings.ts` 선언 315) | **22개** |

`file_converter` 는 **17개 이름이 3파일에 리터럴로 적혀 있어** 그대로 이을 수 있다.
`ai-pm` 은 다르다 — 이름이 전부 **Tauri Specta 가 생성한 `src/lib/bindings.ts` 6,206줄** 안에 있고,
앱 코드는 `commands.dbHealth()` 로 부른다. 생성 파일을 챕터의 두 번째 칸으로 가르치면 학습자에게
「이 줄이 무엇인가」의 답이 「도구가 만든 줄」이 된다. 두 리포는 같은 규칙으로 못 덮는다(§4.3).

### 1.5 커밋 원장 — `ECC` 가 4단 문항의 가장 큰 공급원이다

`fix:` 커밋 **699건**. 각 커밋이 고친 JS/TS 파일 수:

| JS/TS 파일 수 | 건수 | 비율 |
|---|---|---|
| 0 (문서·설정만) | 304 | 43% |
| **1** | **136** | **19%** |
| 2 | 136 | 19% |
| 3 이상 | 123 | 18% |

**1파일만 고친 `fix:` 136건**이 4단(수정) 문항의 1차 후보다. 다섯 리포 중 압도적으로 많다
(`ai-pm` 746커밋 · `MonggleMonggle` 254커밋 전체보다 이 하나가 크다). 다만 43%가 JS 를 안 건드리는
문서 커밋이라 원장을 그대로 쓰면 절반 가까이가 빈 문항이 된다 — 거르는 규칙이 먼저다.

### 1.6 Rust 예산 — 31줄 남았다

```
$ bash scripts/check-rust-budget.sh
ok   line budget: 2769/2800 lines
```

**이 숫자가 §5(Astro)와 §4(러너)의 설계를 정한다.** 아래 조각 중 Rust 를 건드리는 것은 둘뿐이고,
합쳐서 예산 안에 들어야 한다. 예산 상향은 D129 를 여는 것이라 사용자 결정이다.

---

## 2. `react/` 사전 — 개념 하나에서 아홉으로

`dictionary/react/` 는 지금 **개념 한 장**이다(`functional-state-update`). `dictionary/spring/` 이
열다섯인 것과 견주면 비어 있는 것에 가깝다.

### 2.1 `spring/` 을 그대로 베끼면 안 된다

`spring/` 은 `COMPUTED_NAMESPACES`(`schema.ts:56`)에 든다 — **쿼리가 없고 사용처도 없다.**
애너테이션이 런타임에 하는 일이 내용의 전부라 짚을 노드가 없기 때문이고(D176), 그래서 창을
자바 개념에서 빌린다.

**React 훅은 다르다. 문법이다.** `useEffect(() => {…}, [deps])` 는 짚을 수 있는 호출식이고,
`key={…}` 는 JSX 속성 노드다. `react/` 는 이미 `.scm` 두 장을 갖고 있고 `COMPUTED_NAMESPACES` 에
없다. **그대로 둔다** — 쿼리 네임스페이스다.

대가가 하나 있고 이것이 아래 표의 마지막 열을 정한다: `COMPUTED_NAMESPACES` 가 아니면
**사용처 0인 개념은 조용히 사라진다** — 구멍 지도는 `gaps.ts:65` 에서 `continue` 하고 0장 합성판은
`zero-chapter.ts:100` 에서 `return []` 한다(`docs/curriculum/ts.md` §5 가 코드를 읽고 확인한 사실).
그러니 **근거 없는 개념은 목록에 올리지 않는다.**

### 2.2 더할 개념 여덟 — 실측 자리 수와 함께

`ai-pm/src`(613 TS·TSX 파일)와 `file_converter/src`(49 파일)에서 정규식으로 센 값이다.
정규식은 tree-sitter 보다 헐거우므로 **하한**으로 읽어야 한다.

| # | id | 무엇을 묻나 | 근거 모양 | `ai-pm` | `file_converter` |
|---|---|---|---|---|---|
| 1 | `react/state-declaration` | 화면이 기억하는 값은 보통 변수와 무엇이 다른가 | `useState(` | **154파일** | 6파일 |
| 2 | `react/effect-deps` | 이 이펙트는 **언제** 다시 도나 | `}, [deps])` 458자리 · `}, [])` 116자리 | **130파일** | 12자리 |
| 3 | `react/list-key` | 목록이 바뀔 때 무엇이 같은 항목인가 | `key={` | **130파일** · 358자리 | 11자리 |
| 4 | `react/effect-cleanup` | 이펙트가 남긴 것을 누가 걷나 | `useEffect(… return () =>` | 66파일 · 98자리 | 5파일 |
| 5 | `react/memo-and-callback` | 왜 같은 함수를 다시 만들지 않으려 하나 | `useCallback(` 368 · `useMemo(` 138 | 95 / 59파일 | 16 / 0자리 |
| 6 | `react/ref-escape-hatch` | 다시 그리지 않고 기억하는 자리 | `useRef(` | 74파일 · 120자리 | 7자리 |
| 7 | `react/custom-hook` | `use` 로 시작하는 내 함수는 무엇인가 | `export (function\|const) use[A-Z]` | 47파일 · 56자리 | 0 |
| 8 | `react/context-provider` | 값이 트리를 타고 내려가는 길 | `createContext(` 5 · `<*Provider` 76 · `useContext(` 7 | 2파일 (얇음) | 0 |
| — | `react/functional-state-update` | (있음) | `setX(prev =>` | — | — |

**넣지 않는 것 둘.**

- **서버 컴포넌트 대 클라이언트 컴포넌트.** 브리프가 이름을 댔지만 `'use client'` 가
  **다섯 리포 전량에서 0자리**다. Next.js 를 쓰는 리포가 없다. 근거가 없으므로 개념을 만들면
  사용처 0으로 사라진다 — 만들지 않는다.
- **훅의 규칙(조건부 훅 금지).** `if (…) { use… }` 를 찾아 `ai-pm` 에서 **0자리**다. 규칙을
  어긴 자리가 없으니 「짚어 보세요」의 대상이 없다. §2.2 의 1·2·4 가 이 규칙의 *왜* 를 나눠 갖는다.

`react/context-provider` 는 `ai-pm` 에서만 서고 `thin_threshold`(`min_files: 2, min_sites: 3`)를 겨우
넘는다. 티어 B 의 아래쪽이다 — 나중에.

### 2.3 `node/` 신설 — `express/` 가 아니다

`ECC` 는 웹 프레임워크가 없다. 그런데 JS 440파일이고 다섯 중 가장 크다. 무엇이 걸리나:

| 근거 낱말 | 자리 | 파일 (440 중) |
|---|---|---|
| `path.join`·`path.resolve` | 3,960 | 297 |
| `fs.readFileSync` 류 동기 API | 2,140 | 257 |
| **`require(` — CJS 들이기** | **1,594** | **384 (87%)** |
| `process.exit(` | 467 | 289 |
| `process.env` | 949 | 175 |
| `module.exports` | 189 | 178 |
| `#!/usr/bin/env node` | 148 | **148** |
| `process.argv` | 86 | 71 |
| ESM `export …` | 127 | 20 |

**`ECC` 는 CommonJS 다.** 384/440 파일이 `require()` 를 쓰고 ESM `export` 는 20파일뿐이다.
`docs/curriculum/ts.md` §3 은 `ts/require-call` 을 「표기 짝의 부기」로 `essential: false` 에 두자고
제안했는데, 이 리포에서는 부기가 아니라 **주 표기**다. 그 제안은 그대로 두되(`ts` 의 분모는
`import` 가 맞다) `node/` 쪽에서 다시 만난다.

**개념 여섯을 제안한다.** 전부 `ECC` 에 100자리 이상 있다.

| id | 무엇을 묻나 | 근거 | `ECC` |
|---|---|---|---|
| `node/cli-entry` | 이 파일이 명령이 되는 이유 | shebang · `package.json` 의 `bin` | 148파일 |
| `node/argv` | 명령줄에서 온 값이 들어오는 자리 | `process.argv` | 71파일 |
| `node/exit-code` | 끝내는 방식이 결과를 말한다 | `process.exit(` | 289파일 |
| `node/env-config` | 설정이 코드 밖에서 온다 | `process.env` | 175파일 |
| `node/sync-vs-async-fs` | 같은 일에 표기가 둘인 이유 | `readFileSync` ↔ `promises.readFile` | 257파일 |
| `node/module-system` | `require` 와 `import` 가 한 리포에 있다 | `require(` · `module.exports` · `"type"` | 384파일 |

**`node/` 는 `react/` 와 같은 쿼리 네임스페이스다** — 전부 짚을 노드가 있다.
감지는 `detect: { manifest: [package.json], contains: … }` 가 아니라 **`bin` 필드나 shebang 의 존재**여야
하는데, 지금 `detect` 스키마는 `dependency` 하나와 `manifest`+`contains` 짝뿐이다(§7 D183 초안).

`node/module-system` 은 `ts/import-export`(ts.md §3 #6 제안)와 겹친다. 겹치는 것이 맞다 —
`ts` 쪽은 「이 이름이 어디서 왔나」이고 `node` 쪽은 「왜 두 표기가 한 리포에 있나」다. `prereq` 로
잇고 `confusions` 에 서로를 넣는다.

---

## 3. 진입점과 라우트 — 규칙 넷, 줄 수까지

「밖에서 처음 들어오는 문」이 프레임워크마다 다르다. 기존 모양(문자열 양끝 잇기)에 어떻게 앉히나.

### 3.1 지금 코드가 어떻게 생겼나

두 갈래가 있고 **서로 안 만난다**(`resolve-imports.ts:127~132`).

```
raw.form 이 http-* 냐 →  예 → routeHit()  … ctx.routes(=routeIndex) 에서만 찾는다
                       └ 아니오 → resolveOne() → resolveTs() → '/api/' 로 시작하면 nextRoute()
```

- `routeIndex()`(:281)는 **java·py 파일만** 본다(`if (lang !== 'java' && lang !== 'py') continue`).
  라우트 경로가 **문자열 리터럴**(`@RequestMapping("/api/auth")`)인 프레임워크의 모양이다.
- `nextRoute()`(:262)는 라우트 경로가 **파일 경로**인 프레임워크의 모양이고, `ctx.routes` 를 안 쓴다.
  대신 `toLine` 을 못 준다 — 2단 추적의 둘째 칸이 「어느 줄」을 묻는데 그 줄이 없다(D162).

**Astro 는 파일 라우트인데 핸들러 줄이 따로 있다** — 두 모양의 사이다. 그래서 아래 규칙 1이
`routeIndex` 에 파일 라우트 갈래를 더한다.

### 3.2 규칙 넷

| # | 규칙 | 어디 | 줄 수 | 켜지는 것 |
|---|---|---|---|---|
| **1a** | `fetch("/…", {method})` 캡처 | `dictionary/ts/_imports.scm` | **~14줄** (동사 5 × 블록, 기존 `http-*` 와 같은 모양) | `bunhine_web` 19자리 · `ai-pm` 5 · `ECC` 5 |
| **1b** | 파일 라우트 색인 | `resolve-imports.ts` `routeIndex()` | **~18줄** | `bunhine_web` 라우트 11개 + `toLine` |
| **2** | `invoke("cmd")` ↔ `#[tauri::command]` | `.scm` ~4줄 + `resolve-imports.ts` ~20줄 + `dictionary/rs/_imports.scm` ~6줄 | **~30줄** | `file_converter` 17자리 → 18선언 |
| **3** | CLI 진입점 씨앗 | `units.ts` 의 `EntrySeed` 를 채우는 쪽 (`ingest.ts`) ~12줄 | **~12줄** | `ECC` 진입점 4~34개 |

**규칙 1a·1b 가 이 계획에서 가장 값싼 큰 승리다.** 32줄로 `bunhine_web` 이 티어 A 에서 티어 B 로
올라간다 — 진입점 11개, 기능 폐포 11개, 요청 줄기 19줄기. 지금은 0이다.

#### 규칙 1a — `fetch` 캡처

지금 `.scm` 의 `http-get` 블록은 `function: (member_expression property: …)` 를 요구한다.
`fetch("/x")` 는 `function: (identifier)` 라 안 걸린다. 같은 파일에 `call-self` 규칙이
`function: (identifier) @import.source` 를 잡지만 그것은 **함수 이름**을 캡처하지 URL 을 안 잡는다.

동사는 둘째 인자의 `method:` 에 있다. tree-sitter 쿼리로 객체 속성을 읽는 것은 되지만 블록이
동사 수만큼 늘어난다. **`method` 를 안 읽고 `http-any` 하나로 낸다** — `routeHit()` 이 이미
`verb === 'ANY'` 를 받는다(:334, D168 의 `.uri("…")` 자리). `bunhine_web` 은 라우트 경로가
전부 유일해서 동사를 몰라도 답이 하나다(11/11). 블록 하나, **~7줄**이면 된다.

동사가 필요해지는 날은 같은 경로에 GET·POST 가 둘 다 있고 그 둘이 다른 챕터일 때다.
`visit.ts` 가 유일한 그 자리이고, `fetch("/api/visit")` 호출은 1개뿐이라 지금은 안 갈린다.

#### 규칙 1b — 파일 라우트 색인

`routeIndex()` 에 갈래 하나를 더한다. 자바·파이썬은 라우트 **문자열**을 `_imports.scm` 이 내고,
TS 파일 라우트는 **파일 경로**가 라우트이고 `.scm` 은 **핸들러 이름과 줄**만 내면 된다.

```
;  dictionary/ts/_imports.scm — 파일 라우트 핸들러
((export_statement (lexical_declaration (variable_declarator name: (identifier) @import.source)))
 (#match? @import.source "^(GET|POST|PUT|PATCH|DELETE|ALL)$") (#set! form "route-file"))
((export_statement declaration: (function_declaration name: (identifier) @import.source))
 (#match? @import.source "^(GET|POST|PUT|PATCH|DELETE|ALL)$") (#set! form "route-file"))
```

`routeIndex()` 쪽은 `lang === 'ts'` 이고 경로가 `(src/)?pages/api/**` 또는 `app/api/**/route.*` 면
파일 경로에서 라우트를 뽑아 `${verb} ${path}` 키로 넣는다. `nextRoute()` 가 이미 쓰는 경로 규칙과
같으므로 두 곳이 같은 답을 내는지가 시험 하나다.

**`bunhine_web` 은 `export const POST: APIRoute = …` 한 모양으로 12개가 전부다** — 표기가 갈리지
않아 쿼리 둘이면 덮는다.

#### 규칙 2 — Tauri

`invoke("cmd")` 는 HTTP 가 아니지만 **성질이 같다**: 밖에서 들어오는 문이고, 양끝이 문자열이며,
`import_edge.kind` 에 `'http'` 가 이미 있다. 새 `kind` 를 만들 것인지는 결정이 필요하다(§7 D184).

Rust 쪽 캡처가 필요한데 **`dictionary/rs/` 가 아예 없다.** 지금 있는 네임스페이스는 열셋이고
(`arch common cs css exec java mybatis proto py react schema spring sql ts`) 러스트는 그중에 없다.
문법은 등록돼 있다(`langs.rs:28` 이 `tree_sitter_rust`) — 사전이 없을 뿐이다.

그래서 **J6 은 러스트 축에 매인다.** 같은 날 병렬 세션 F1 이 `dictionary/rs/**` 를 잡고 있고,
`_lang.yaml` 과 `_imports.scm` 이 거기서 서야 이 규칙이 올라갈 자리가 생긴다. 이 계획 단독으로는
못 한다 — 순서에서 마지막인 이유다.

**`ai-pm` 은 이 규칙으로 안 켜진다.** 이름이 생성 파일 `bindings.ts` 안에만 있어서, 이으면
488개 호출이 전부 그 한 파일을 지나고 기능 폐포가 6,206줄짜리 파일 하나로 뭉친다. 규칙 2 는
**`file_converter` 를 위한 것**이고, `ai-pm` 은 §6 의 뒤로 미룬다(생성 파일을 통과 처리하는
별도 규칙이 필요하고 그것은 이 계획의 범위가 아니다).

#### 규칙 3 — CLI 진입점

`entryUnits(edges, seeds)` 의 둘째 인자가 이미 비어 있다(`EntrySeed`, D168 의 `@Scheduled` 자리).
`package.json` 의 `bin` 값 4개를 씨앗으로 넣으면 `ECC` 에 진입점 넷이 선다. `scripts` 30개까지
넣을지는 판단이 갈린다 — 30개면 챕터 30개이고 하루 15분에 안 맞는다. **`bin` 만 씨앗으로 쓴다.**

`ECC` 의 폐포가 실제로 얼마나 크게 서는지는 **못 쟀다** — `require()` 해석이 필요하고
`resolveTs` 는 `require` 를 이미 정적 import 로 다루므로(`kindOf`) 될 가능성이 높지만,
`ECC` 에서 돌려 보지 않았다. 착수 전 첫 측정이 이것이어야 한다.

---

## 4. 실행 러너 — node 어댑터

### 4.1 실측: 자바보다 훨씬 싸다

`file_converter` 에서 실제로 돌린 값이다.

```
$ node_modules/.bin/vitest run --reporter=json
  152 테스트 · 49 스위트 · 19 파일 · 2.2초 (wall) · exit 0 · 네트워크 없음
  stdout 첫 글자가 `{` — 파일로 안 빼도 된다:
  {"numTotalTestSuites":49,…,"numTotalTests":152,"numPassedTests":152,"numFailedTests":0,…}
```

**`--outputFile` 없이 stdout 으로 온전한 JSON 이 나온다.** `t3_run` 은 stdout 만 돌려주므로
(`ProcOut.stdout`) 어댑터가 파일을 안 만들어도 되고, 이것이 자바와 갈리는 결정적 자리다 —
자바는 결과를 stdout 으로 빼내려고 초기화 스크립트 한 장을 작업본에 심어야 했다.

자바 어댑터가 한 일 셋 중 **둘이 필요 없다**.

| 자바 어댑터 | node 어댑터 |
|---|---|
| 초기화 스크립트 `chickadee-run.gradle` 을 작업본에 던진다 | **불필요** — `--reporter=json` 이 이미 있다 |
| stdout 에 `##CHICKADEE##\|SUCCESS\|cls\|name\|msg` 표시줄을 심고 파싱한다 | **불필요** — `--outputFile` 로 구조화된 JSON |
| 배포본(Gradle dist)이 받아져 있는지 `needs` 로 확인하고 없으면 사람에게 묻는다 | **불필요** — 러너가 `node_modules/.bin` 안에 이미 있다 |
| 상한 180초 / 첫 회 600초 | 실측 2.2초. **20초면 넉넉하다** |

`RunSpec.lang` 을 `'java' | 'node'` 로 넓히고 `node-runner.ts` 를 더한다. 하는 일:

- **탐지** — `package.json` 에 `scripts.test` 가 있고, `node_modules/.bin/` 에 `vitest`·`jest` 중
  하나가 있거나 `scripts.test` 가 `node --test` 다. `ipc.file.readLines` 로 읽는다(자바가 `gradlew`
  를 그렇게 본다). 없으면 `reason: 'not-detected'`.
- **인자** — vitest: `run --reporter=json`(실측 확인). jest: `--json`. `node:test`:
  `--test-reporter=tap`.
- **읽기** — `numPassedTests` · `numFailedTests` · `testResults[].assertionResults[]` 의
  `fullName`·`failureMessages`. `RunFailure { test, message }` 로 그대로 옮겨진다.
- **오프라인** — 인자가 필요 없다. 네트워크를 쓰는 것은 설치이고 설치를 안 한다.

**어댑터 본문은 100줄 안쪽으로 본다** (`java-runner.ts` 259줄의 절반 이하).

### 4.2 유일한 방벽 — `node_modules` 가 작업본에 없다

`apps/desktop/src-tauri/src/commands/proc.rs` 를 읽었다.

```rust
// mirror() :117
let walk = ignore::WalkBuilder::new(src).follow_links(false).hidden(true).git_ignore(true)…
// keep 처리 :288
for rel in &spec.keep { … if from.is_file() && stale(&from, &to) { std::fs::copy(…) } }
// needs 처리 :261
for rel in &spec.needs { if !under(home, rel)?.exists() { missing.push(…) } }
```

세 가지가 동시에 막는다.

1. `git_ignore(true)` — `node_modules` 는 어느 리포에서나 `.gitignore` 에 있으므로 **복사되지 않는다.**
2. `keep` 은 `from.is_file()` 만 처리한다 — **디렉터리를 못 받는다.**
3. `needs` 는 **home 기준**이다(Gradle 배포본 자리). 리포 안의 `node_modules` 유무를 못 묻는다.

`node_modules` 실측: `ai-pm` **480MB · 최상위 44개**, `file_converter` **246MB · 27개**,
`bunhine_web` **242MB · 383개**. `ECC`·`MonggleMonggle` 은 설치 안 됨.

**갈래 셋.** 전부 Rust 를 건드리고 예산은 31줄뿐이다(§1.6).

| 갈래 | Rust 줄 | 첫 회 비용 | 위험 |
|---|---|---|---|
| A. `keep` 에 디렉터리 재귀 복사 | ~10 | 246~480MB 복사. 이후는 `stale()` 이 걸러 증분 | 디스크 두 배 |
| B. `node_modules` 를 **심볼릭 링크**로 건다 | ~6 | 0 | **원본 리포에 쓸 수 있는 길이 열린다** — 정본 §5 ②를 정면으로 건드린다 |
| C. `env` 에 `NODE_PATH` 를 주고 원본을 참조 | ~0 (`spec.env` 가 이미 있다) | 0 | ESM·vitest 해석에 `NODE_PATH` 가 안 듣는다. **거의 확실히 실패한다** |

**갈래 B 가 싸고 갈래 A 가 안전하다. 이것이 이 계획의 첫 사용자 결정이다**(§8-①).
갈래 B 를 고르면 「실행은 리포 밖 임시 작업본에서만, 원본 리포에 쓰지 않는다」가
「원본 리포의 `node_modules` 만 예외」가 된다 — 정본 §5 의 문장을 고쳐야 하고 그것은 사용자 몫이다.

`needs` 를 리포 상대로도 물을 수 있게 넓히는 것은 어느 갈래든 필요하다(**~4줄**) —
`node_modules` 가 없는 리포(`ECC`·`MonggleMonggle`)에서 「설치를 강요하지 않는다」를 지키려면
탐지가 그 사실을 말해야 한다.

### 4.3 어느 리포에서 4·5단이 켜지나

| 리포 | `scripts.test` | 러너 | 테스트 파일 | 4·5단 |
|---|---|---|---|---|
| `file_converter` | `vitest run` | vitest 4.1.10 (설치됨) | 19 | **켜진다** (실측 2.2초) |
| `ai-pm` | `vitest run` | 설치됨 | 182 | 켜진다 (시간 미측정) |
| `ECC` | `node tests/run-all.js` | **커스텀 러너** | 181 | 출력 형식 미상 — 조사 필요 |
| `bunhine_web` | 없음 | — | 0 | 안 켜진다 (게이트에서 뺀다) |
| `MonggleMonggle` | 없음 | — | 0 | 안 켜진다 |

`ECC` 의 `tests/run-all.js` 를 열어 봤다. `tests/**/*.test.js` 를 찾아 파일마다
`spawnSync('node', [파일])` 하고, 자식의 출력에서 `/Passed:\s*(\d+)/` · `/Failed:\s*(\d+)/` 를
정규식으로 긁어 합산한다. **통과·실패 수는 정규식 둘로 읽히지만 실패한 테스트의 이름이 없다** —
`RunFailure { test, message }` 를 못 채운다. 채점은 되고 「어느 테스트가 왜 틀렸나」는 못 보여 준다.

**탐지에서 떨어뜨린다.** 정본 §5 ① 이 「탐지되면 켜고 없으면 그 단을 게이트에서 뺀다」이고,
리포마다의 커스텀 러너를 쫓기 시작하면 개수가 안 끝난다. 이름 없는 실패만 주는 러너를 켜면
4단의 피드백이 「몇 개 틀렸습니다」가 되는데, 그것은 정본 §3-2(오답 진단은 「틀렸다」가 아니라
「당신이 고른 그것이 참이 되는 조건」)를 못 지킨다.

---

## 5. Astro 문법 — 크레이트냐 구간 파싱이냐

`bunhine_web` 의 `.astro` 26장은 지금 **통째로 안 읽힌다**. 확장자가 `langs.rs` 에 없다.

### 5.1 실측

- 26파일 · **전부 `---` 프런트매터로 시작한다**(26/26). 없는 파일 0.
- 총 236,166바이트 중 **프런트매터가 24,323바이트(10%)**. 나머지 90%는 템플릿(HTML+JSX 식)과
  `<style>`.
- `<script` 태그 22개(클라이언트 JS).

프런트매터가 TS 이고 거기 `import`·`await getCollection(…)`·`getStaticPaths` 가 산다.
**기능 경로에 필요한 것은 전부 그 10% 안에 있다.**

### 5.2 갈래 둘

**A. `tree-sitter-astro-next` 크레이트.**
crates.io 에 있다 — `0.1.1` · tree-sitter 0.25+ 호환 · 다운로드 169,052 · 최초 게시 2026-02-14.
`langs.rs` 에 **1줄**, `Cargo.toml` 에 2줄(줄 예산은 `.rs` 만 센다 — §1.6).

위험: **버전이 하나뿐이고 게시 6개월**이다. `num_versions: 1` 은 「한 번 올리고 손 뗀 것」과
「아직 고칠 게 없는 것」을 구별해 주지 않는다. npm 에는 `tree-sitter-astro` 가 **없다**(패키지 부재).
설계 문서가 이미 `m1-03-swift-dart-sql`(커뮤니티 문법 품질, 미달 시 언어 보류)이라는 자리를 만들어
뒀으니 그 절차를 그대로 적용한다 — 픽스처 26장을 파싱해 실패율을 재고 나서 정한다.

**B. 구간 파싱 — `sfc.rs` 의 선례.**
`crates/parse/src/sfc.rs` 는 `.vue` 를 `set_included_ranges` 로 `<script>` 구간만 읽는다.
Astro 는 태그가 아니라 `---` 구분자다.

```rust
// 새 함수 — 첫 `---` 줄부터 다음 `---` 줄까지 한 구간.
fn frontmatter_range(src: &[u8]) -> Vec<Range>   // ~15줄
```

- `is_embedded` 에 `"astro"` 추가 — 기존 `matches!` 에 낱말 하나(**0줄**)
- `ranges_for` 에 갈래 하나(**~2줄**)
- `langs.rs` 에 `("astro", || tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into())`(**1줄**)
- 합계 **~18줄**

같은 방식으로 `<script>` 본문도 `tag_bodies(src, b"<script")` 로 이미 잡히므로, `astro_script`
문법을 하나 더 두면 클라이언트 JS 22자리도 열린다(**+2줄**).

대가는 명확하다. **템플릿 90%를 안 읽는다** — `.astro` 의 컴포넌트 사용(`<BaseHead …>`)이
지도에 안 뜬다. 다만 `import BaseHead from "…"` 는 프런트매터에 있으므로 **의존 엣지는 선다.**
기능 경로에는 그것으로 충분하다.

### 5.3 권고

**B(구간 파싱)로 시작한다.** 근거 셋 — ① 새 크레이트 없이 `sfc.rs` 선례 그대로다 ② 기능 경로에
필요한 것이 전부 프런트매터 안에 있다(§5.1) ③ 크레이트 하나의 품질 판정을 착수 전에 안 해도 된다.
템플릿이 필요해지면 그때 A 를 재고, 그 시점에는 `tree-sitter-astro-next` 가 버전을 더 쌓았을 것이다.

**두 갈래 다 예산 31줄 안이지만 합쳐 쓸 수는 없다** — B(18줄) + §4.2 갈래 A(10줄) + `needs` 확장
(4줄) = **32줄로 이미 1줄 넘는다.** §6 의 순서가 이 산수를 지고 있다.

---

## 6. 비용과 순서

### 6.1 조각

| 조각 | 크기 | 선행 | 안 하면 무엇이 안 되나 | 티어 |
|---|---|---|---|---|
| **J1** `fetch` 캡처 + 파일 라우트 색인 | `.scm` ~7줄 · TS ~18줄 | 없음 | `bunhine_web` 이 영영 티어 A. 진입점 0 → 기능 챕터 0 | **B** |
| **J2** `react/` 개념 일곱 (`context-provider` 는 얇아 뒤로) | YAML 7장 · `.scm` ~10장 | 없음 | React 리포 둘에서 훅이 「그냥 함수 호출」로 읽힌다. D59 의 전제가 안 선다 | **B** |
| **J3** node 실행 러너 | TS ~100줄 · **Rust 10~14줄** | §8-① 결정 | `file_converter`·`ai-pm` 에서 4·5단이 안 열린다 | **B** |
| **J4** Astro 프런트매터 파싱 | **Rust ~18줄** | 없음 | `.astro` 26장이 안 읽힌다. J1 이 켜져도 라우트만 보이고 페이지가 안 보인다 | **B** |
| **J5** `node/` 개념 여섯 | YAML 6장 · `.scm` 6장 · `detect` 스키마 ~8줄 | `detect` 확장 | `ECC`(가장 큰 리포)가 어휘 층만 남는다 | **B** |
| **J6** Tauri `invoke` 간선 | `.scm` ~10줄 · TS ~20줄 | **`dictionary/rs/` 신설** (없다 · 러스트 축) | `file_converter` 진입점 0. 죽은 커맨드를 못 센다 | **B** |
| **J7** CLI 진입점 씨앗 | TS ~12줄 | J5 | `ECC` 진입점 0 | **B** |
| **J8** `ECC` 커밋 원장 문항 | 미상 | 커밋 필터 규칙 | 4단 문항 136건을 못 쓴다 | C→B |

**전부 티어 B 다.** 티어 A(언어 어휘·기계·규약·판단)는 이 축에서 이미 서 있다 —
`docs/curriculum/ts.md` 가 그 몫이고 이 문서는 손대지 않는다.

### 6.2 순서

**Rust 예산 31줄이 순서를 정한다.** Rust 를 쓰는 것은 J3(10~14) · J4(18) 둘뿐이고 합이 28~32다.
**둘 중 하나가 예산을 넘기면 D129 를 여는 사용자 결정이 먼저**다(§8-②).

1. **J1** — Rust 0줄. 가장 값싼 큰 승리. 32줄로 리포 하나가 티어 A→B.
2. **J2** — Rust 0줄. 사전 데이터라 코드 위험이 없고, 걸리는 파일이 130개로 가장 넓다.
3. **J4** — Rust 18줄. J1 이 켠 `bunhine_web` 라우트에 페이지를 붙인다. J1 없이 J4 만 하면
   `.astro` 가 읽히되 진입점은 여전히 0이다. **J1 → J4 순서가 맞다.**
4. **J3** — Rust 10~14줄. §8-① 결정을 받은 뒤. 남은 예산을 여기서 다 쓴다.
5. **J5 → J7** — Rust 0줄. `ECC` 를 연다. `detect` 스키마 확장이 J5 안에 있다.
6. **J6** — `file_converter` 를 연다. **`dictionary/rs/` 가 서기 전에는 못 한다**(러스트 축 선행).
7. **J8** — 커밋 필터 규칙을 정한 뒤. 43%가 빈 커밋이라 거르는 규칙이 먼저다.

### 6.3 이 계획이 끝나면 무엇이 달라지나

| 리포 | 지금 진입점 | J1~J7 뒤 | 4·5단 |
|---|---|---|---|
| `bunhine_web` | 0 | **11** (J1) | 안 켜짐 (테스트 없음) |
| `file_converter` | 0 | **17** (J6) | **켜짐** (J3, 2.2초) |
| `ECC` | 0 | **4** (J7, 폐포 크기 미측정) | 안 켜짐 (커스텀 러너) |
| `ai-pm` | 0 | 0 — **생성 파일 문제로 미해결** | 켜짐 (J3) |
| `MonggleMonggle` | 선다 | 그대로 | 안 켜짐 |

---

## 7. 결정 등록부에 올려야 할 행 (초안 — 아직 안 올렸다)

`docs/00-overview.md` §4.2.1 의 다음 번호로. **착수 결정은 사용자가 하므로 여기 초안으로만 둔다.**

| 초안 | 무엇을 정하나 | 제안 |
|---|---|---|
| **D181** | JS·TS 프레임워크 축의 실제 표적 | 실측 다섯 리포에 Express·Nest·Svelte 가 **0건**이고 대신 Astro·Tauri IPC·Node CLI 가 있다. 규칙을 **실측이 있는 셋**에만 만든다 |
| **D182** | 파일 라우트를 `routeIndex` 가 받는다 | 라우트 경로가 문자열이 아니라 **파일 경로**인 프레임워크(Astro·Next)를 `routeIndex` 의 둘째 갈래로 넣고 `nextRoute()` 와 답을 맞춘다. `toLine` 이 이때 생긴다 |
| **D183** | `detect` 신호를 셋째로 넓힌다 | 지금 `dependency` 와 `manifest`+`contains` 둘. `node/` 는 **`bin` 필드·shebang**으로 잡아야 한다 |
| **D184** | Tauri IPC 를 `kind: 'http'` 로 볼 것인가 | HTTP 가 아니지만 성질이 같다. 새 `kind` 를 만들면 `entryUnits`·`dead.ts`·`path.ts` 가 전부 따라 바뀐다 — **`'http'` 로 접는 쪽을 제안**하고 이름만 UI 에서 가른다 |
| **D185** | node 러너의 `node_modules` 처리 | §8-① 의 사용자 결정을 받아 적는다 |
| **D186** | Astro 를 구간 파싱으로 읽는다 | `tree-sitter-astro-next` 는 버전 하나·6개월이라 보류. `sfc.rs` 의 `---` 프런트매터 구간(~18줄)으로 시작하고, 템플릿이 필요해지면 재고 |
| **D187** | `react/` 는 쿼리 네임스페이스로 남는다 | `spring/`(`COMPUTED_NAMESPACES`)과 다르다 — 훅은 짚을 노드가 있다. 대신 **사용처 0인 개념은 목록에 올리지 않는다**(`'use client'` 0자리 → 서버 컴포넌트 개념 없음) |

---

## 8. 사용자 결정이 필요한 것

**① `node_modules` 를 작업본에 어떻게 넣나 (J3 를 막는다).**
갈래 A(디렉터리 재귀 복사 · Rust ~10줄 · 첫 회 246~480MB · 안전)와 갈래 B(심볼릭 링크 ·
Rust ~6줄 · 0바이트 · **정본 §5 ②「원본 리포에 쓰지 않는다」를 고쳐야 한다**). 갈래 C(NODE_PATH)는
거의 확실히 실패한다.

**② Rust 예산 2,800줄을 여나 (J3+J4 가 28~32줄인데 남은 것이 31줄이다).**
안 열면 J3 와 J4 중 하나가 다음 예산 확보까지 밀린다. D129 는 「줄 수는 대리 지표이고 실제 방벽은
금칙어·SQL·git 바이너리 금지」라고 적었으니 상향의 근거는 있으나, 상향 자체는 사용자 결정이다.

**③ `ai-pm` 의 생성 파일(`bindings.ts` 6,206줄)을 어떻게 다루나.**
488개 호출이 전부 그 한 파일을 지난다. 통과 처리하면 폐포가 서고, 안 하면 `ai-pm` 은 진입점 0으로
남는다. 이 계획의 범위 밖이라 규칙을 안 만들었다 — 다음 축의 문제로 넘길지 여기서 풀지.

**④ `ECC` 의 `scripts` 30개를 진입점으로 볼 것인가.**
`bin` 4개만 쓰기로 제안했다. 30개를 다 쓰면 챕터가 30개이고 하루 15분에 안 맞는다.

---

## 9. 못 잰 것

정직하게 적는다. 아래는 착수 전에 재야 하고, 재기 전에는 위 숫자를 근거로 쓰면 안 된다.

- **`ECC` 의 기능 폐포 크기.** `bin` 4개에서 `require()` 를 따라간 폐포가 몇 파일인지 안 돌려 봤다.
  440파일 중 하나의 폐포가 300파일을 삼키면 챕터가 안 된다. **첫 측정이 이것이어야 한다.**
- **`ai-pm` 의 vitest 실행 시간.** `file_converter` 는 19파일 2.2초인데 `ai-pm` 은 **182파일**이다.
  상한을 20초로 잡을지 60초로 잡을지가 이 값에 달렸다.
- **`tree-sitter-astro-next` 의 실제 파싱 품질.** 크레이트가 있다는 사실만 확인했고
  `.astro` 26장을 물려 보지 않았다. §5.3 의 권고는 「품질을 몰라서 안 쓴다」이지
  「나빠서 안 쓴다」가 아니다.
- **정규식과 tree-sitter 의 차이.** §1·§2 의 자리 수는 전부 정규식이다. 실제 쿼리는 더 적게
  잡는다(문자열·주석 안의 가짜 매치가 빠지고, 대신 여러 줄에 걸친 참 매치가 더 잡힌다).
  **하한으로 읽어야 한다.**
- **J1~J7 의 줄 수.** 기존 코드의 모양을 보고 센 추정이다. `.scm` 은 블록 수 × 줄로 정확한 편이고
  `routeIndex` 확장(~18줄)은 갈래 하나를 더하는 값이라 실제로는 더 클 수 있다.

조사 중에 닫힌 것 넷은 본문으로 옮겼다 — `vitest` 의 stdout JSON(§4.1) · `ECC/tests/run-all.js` 의
출력 형식(§4.3) · `dictionary/rs/` 부재(§3.2 규칙 2) · `tree-sitter-astro-next` 의 존재(§5.2).
