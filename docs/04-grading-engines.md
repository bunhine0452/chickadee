# 04 · 채점 엔진 — T0 · T1 · T2

## 이 문서의 위치

- 정본 `.oculpm/discussion/vibe-code-study-app/discussion.md` 「결론」 §2(트랙)·§3(UX 불변 규칙)·§5(T1 = AST 비교, 없으면 정규식 폴백)의 채점 결정을 **구현 가능한 규칙**으로 정식화한다.
- 목업 `design/src/ink/t0.js · t1.js · t2.js · data.js` 에 코드로 박힌 규칙을 그대로 옮기고 빈 곳을 채운다. 목업과 다르게 정한 곳은 **「목업과 다름」** 으로 표시했다.
- 경계 — 01-architecture.md: Rust↔TS IPC 경계 · 02-data-model-and-scheduling.md: 잉크 겹·큐·FSRS·테이블·이벤트 저장 · 03-ingest-parsing-dictionary.md: 파싱 결과·사전·사용처 색인·「미지 개념 개수」 · 05-frontend.md: 렌더·키보드 · 06-quality-security-release.md: 이슈 템플릿·프라이버시. 이 문서는 **입력을 받아 판정과 이벤트를 내는 순수 함수**만 정의한다. 겹·큐에 미치는 효과는 이벤트로 통지하고 최종 규칙은 02 가 가진다.

## 읽는 순서/전제

1. discussion §2·§3(특히 1·2·7)·§5 → 2. 01 §3.1 공통 타입(`AstLite`·`parse_snippet`·`CommitFileDiff`)과 03 의 `Site`·사전 YAML 스키마(§0 에 소비 필드만 재기술) → 3. §0 → §1~2(T0) → §3~6(T1) → §7~8(T2) → §9.
전제: 채점 엔진은 전부 TypeScript · **어떤 트랙도 사용자 코드를 실행·평가하지 않는다** · 네트워크 없음 · 같은 입력 + 같은 시드 = 같은 출력 · 모든 판정은 사유 코드를 동반한다(사유 없는 「어긋남」 금지).

## 0. 공통 계약과 타입

이 문서는 타입을 새로 만들지 않고 **01·03 이 정의한 이름을 그대로 소비**한다. 아래는 채점 엔진이 읽는 필드만 추린 것이다.

```ts
// 01 §3.1 (Rust ↔ TS 공통)  — 그대로 사용
//   AstLite { kind; named; start; end /* 바이트 */; text? /* 리프만 */; children }   ← parse_snippet(grammar, text, queries?) → { ast, captures, hadError }
//   Capture { queryId; name; startByte; endByte; startLine; endLine; excerpt }
//   LinesChunk · Block(파일 바이트 구간) · CommitFileDiff { relPath; status:'A'|'M'|'D'|'R'; additions; deletions; hunks }
// 02 §8.2 ConceptSite — 사용처 레코드. 채점기가 쓰는 필드:
//   conceptId · fileId · lineStart · lineEnd · excerpt · picks · hole · ctx · lineConcepts · shape · confidence · parseQuality · commitId
//   (맥락 줄은 없음 — §1 참조)
// 03 §4.4 사전 YAML — 채점기가 쓰는 필드:
//   token · universal · prereq[] · confusions[](개념 id) · dict{one_liner, why, trace[]} · rule · result · ok · payoff · bridge
//   meaning[]{q,hint,options[첫 옵션=정답]} · point[]{q,hint,answer:pick.N,diag{pick.M}} · blank[]{q,hint,options[첫 옵션=@hole 원문]}
//   03 §4.4 why_gate{q,help,choices[{t,ok,fb}]}(확정)  — §6
// 03 §3.6 unknownCount(site, layerOf, dict) — 첫 노출 순위. 02 layerOf(conceptId) → 0..4
type Grammar = 'typescript'|'tsx'|'javascript'|'python'|'go'|'rust'|'swift'|'dart'|'sql';
interface Tok { k:'id'|'kw'|'num'|'str'|'tpl'|'op'|'punct'|'cmt'|'ws'; t:string; col:number }   // 이 문서의 토크나이저(§4.2), TS 순수 함수
const seedOf = (repoId, kind, targetId, attempt, dictVersion) => fnv1a32(`${repoId}|${kind}|${targetId}|${attempt}|${dictVersion}`); // PRNG = mulberry32
```

결정성 규칙: 셔플·동점 해소·후보 선택은 전부 `seedOf` 의 PRNG 만 쓴다. `Math.random`·시각·객체 키 순서 의존 금지. 카드 레코드에 `gen:{seed, dictVersion, attempt, siteId}` 를 저장해 **같은 카드를 언제든 재생성**할 수 있게 한다(이의·버그 재현의 전제). 사전 문장의 `{{…}}` 치환(03 §4.3)은 05 의 렌더러가 하고, 엔진은 **템플릿 + 변수 묶음**(`vars: {site, pick, hole, ctx, other, file}`)만 넘긴다.

---

## 1. T0 카드 생성

입력: 사전 항목 + 그 개념의 `Site[]`(03) + `layerOf`(02). 맥락 줄은 카드 생성 시 01 `file_read_lines(repoId, relPath, focus−4, focus+4, rev)` 로 한 번 읽어 `payload.lines`(±2, 목업 5줄)와 `payload.promptLines`(±4, ≤ 9줄)에 굽는다. `rev` 는 `file.is_dirty` 면 `null`. 출력:

```ts
interface T0Card { id; conceptId; siteId; kind:'point'|'blank'|'meaning'; file; focus:number;
  lines:{n:number; t?:string; seg?:{t?:string; pick?:number; hole?:true}[]; target?:boolean}[];
  q; hint; options:{t:string; mono?:boolean}[]; answer:number; why:(Diag|null)[]; ok; rule; result?;
  vars:Record<string,unknown>; fresh:boolean; gen:{seed; dictVersion; attempt; siteId} }
```

### 1.1 지목형 (point)

- 후보 = **캡처된 토큰**: `Site.picks[]`(사전 `.scm` 의 `@pick.N`) ∪ 같은 `lineSpan` 에 걸린 `confusions` 개념 Site 의 `picks`(예 `??` = `ts/nullish-coalescing`) ∪ 부족할 때만 초점 줄의 리터럴·식별자 토큰(**길이 ≥ 2**, 단독 `( ) , ; { } [ ]` 제외).
- 정답 = `point[].answer`(`pick.N`)의 **첫 등장 하나**. 같은 개념 Site 가 한 줄에 둘이면(`res.user?.profile?.nickname` → 03 예시 `sites: 2`) 03 이 정렬한 첫 Site 만 쓰고 두 번째 Site 의 토큰은 후보에서 빼 평문으로 합친다. 질문 템플릿이 `{{pick.1}}`(피연산자)로 자리를 특정한다. **왜**: 정답이 둘인 지목형은 「어느 걸 짚어도 맞다」가 되어 보기별 진단을 붙일 자리가 없어진다 — 목업도 첫 `?.` 만 `pick`.
- 오답 3 선정 순서: ① 사전 `diag` 가 있는 pick(진단이 준비된 것) ② 같은 줄 `confusions` Site 의 토큰(진단 = 그 개념의 `dict.one_liner` + 「멈추는 게 아니라 채우는 기호」식 구분 문장은 사전 `misconceptions`) ③ 정답과 같은 종류(op↔op, id↔id) 중 가까운 순 ④ 리터럴. 후보 < 3 이면 초점 ±1 줄로 확장, 그래도 < 3 이면 **생성 불가**.
- **오답 셋은 정답 앞뒤로 나눠 고른다** (D128). 위 순위대로 세운 뒤 「정답 앞에서 b개 · 뒤에서 3−b개」를 뽑고, b 는 카드 시드가 정한다(양쪽 후보 수가 허락하는 범위 안에서). 번호는 여전히 코드 순서이므로 **정답 번호가 곧 b** 다 — 보기를 섞을 수 없는 유형에서 정답 위치를 흩는 유일한 손잡이다. 안 하면 어떻게 되는가: 사전의 point 항목 26개 중 13개가 정답을 가운데 `pick.2` 에 두고 순위 ①이 양옆 pick 을 먼저 집으므로 **정답이 늘 2번**이 된다. 치르는 값은 한쪽 후보가 모자랄 때 순위가 낮은 오답이 들어오는 것이고, 순위는 각 쪽 안에서 그대로 지켜진다.
- `pick` 번호는 03 이 준 `n`(코드 순서, 왼→오). **셔플 없음** — 위치가 곧 정보이고 `← →` 이동과 일치해야 한다.

### 1.2 빈칸형 (blank)

- 구멍 = `Site.hole`(`@hole` 캡처). 정답 토큰 길이 **≥ 2**(`map`, `?.`, `=>`). 1글자 구멍은 불가 → 지목형으로.
- 보기 = 사전 `blank[].options`(첫 옵션 = 구멍 원문, 오답 3 = `confusions` 개념의 `token` — 03 린트가 보장). 엔진은 ⓐ `options[0].t` 치환 결과 == `hole.text` ⓑ 4개 모두 같은 종류(id↔id) 만 검증하고, 실패하면 그 Site 는 빈칸 불가. **목업과 다름/03 정합**: 색인·내장 표에서 오답을 만드는 폴백은 두지 않는다 — 오답에는 진단이 붙어야 하고 진단은 사전에만 있다.
- 정답 토큰이 맥락 줄에 그대로 또 보이면 `leak` — 그 Site 의 순위를 낮춘다(전부 leak 면 허용).
- 보기 순서는 시드 셔플. `answer` 는 셔플 후 인덱스, `why` 배열도 같이 재배열.

### 1.3 의미형 (meaning)

- 템플릿 = 사전 `meaning[]` 한 항목(`options` 4개, 첫 옵션 정답, 나머지에 `diag`). 값 추적 질문(「`prev` 에는 무엇이 들어 있나」)의 모든 값·`result` 는 **템플릿 문장 안의 mustache 섹션(`{{#ctx.fallback}}…`)과 캡처 변수 치환**으로만 정해진다. 템플릿이 참조하는 `{{pick.N}}`·`{{ctx.*}}` 가 이 Site 에 없으면 그 템플릿은 불가(03 §4.3 허용 목록 검사). **왜**: 「진짜 값을 계산해 주자」는 실행 채점의 유혹이고, 전 언어 지원과 로컬 무실행 원칙을 한 번에 깬다. 계산이 필요한 개념은 사전이 시나리오로 적는다.
- `site.confidence === 'heuristic'` 또는 `parseQuality === 'poor'` 인 Site 는 의미형에 쓰지 않는다(값 추적은 캡처가 정확해야 한다).

### 1.4 유형 선호 · 폴백 · 생성 불가

```
prefer(ly): 0–1 → [point, blank, meaning] · 2 → [blank, meaning, point] · 3–4 → [meaning, blank, point]
for site in rank(sites):        // 03 §3.6: unknownCount 오름차순 → uncoveredRatio → dirty=false → shape 다양성 → path 사전순
  for kind in prefer(ly): if (card = gen[kind](entry, site, seed)) return card
return { noPlate:true, reason }  // 02 에 'no-plate' + 사유 기록 → 홈 「판이 없는 문법」에 사유 표시
```

**왜**: 겹이 낮을수록 인식(지목)이, 높을수록 예측(의미)이 맞다. 사전이 비면 카드가 안 나오는 것이 정상이고, 그 빈자리가 기여 표면이다.

| 대안 | 버린 이유 |
|---|---|
| LLM 으로 보기·진단 생성 | 키 없이 코어 루프 불가(정본 §5). 보기 품질이 비결정적이라 골든 케이스를 못 만든다 |
| 값 계산을 샌드박스 실행으로 | 언어별 런타임 의존, 부작용, T3 영역. 사전 템플릿이 더 정확하고 전 언어 동일 |
| 정답 여러 개 허용(answerSet) | 오답 3 + 진단을 붙일 자리가 사라진다. 대신 질문이 자리를 특정 |

---

## 2. T0 채점과 효과

### 2.1 판정과 진단 선택

`correct = sel === card.answer`. 진단은 **고른 보기**에 붙은 것 하나만 쓴다 — 「틀렸다」가 아니라 「그것이 참이 되는 조건」(정본 §3-2).

| kind | 오답 진단 출처 | 없을 때 폴백 |
|---|---|---|
| blank | `blank[].options[sel].diag`(+`edge`) | 없음 — 03 린트가 오답 3개의 `diag` 를 강제 |
| point | `point[].diag[pick.M]` → 없으면 같은 줄 혼동 개념의 `dict.one_liner` + `misconceptions` | `«{{token}}» 은 {{역할}} 입니다. {{concept}} 는 «{{answer}}»` + rule (①②밖 후보에만) |
| meaning | `meaning[].options[sel].diag`(+`edge`) | 템플릿 필수 필드라 폴백 없음(없으면 생성 단계에서 불가) |

정답이면 `ok` + `rule` + `result`(있으면). 아래층(prereq) 카드면 부모 개념 사전의 `bridge` 를 「이어보기」로 덧붙인다.

### 2.2 리뷰 로그 이벤트

```ts
interface T0Answered { type:'t0.answered'; cardId; conceptId; siteId; kind; sel:number; correct:boolean;
  dunno:boolean; rungsOpened:number[]; elapsedMs; outcome:'ok'|'wrong'|'dunno'; retry:boolean; prereq:boolean; parentCardId?; fresh:boolean; seed:number }
```

겹·FSRS·큐 삽입은 02 §3.3 `applyOutcome`·§4 표가 `outcome`·`retry`·`prereq`·`fresh` 로 계산한다. 엔진은 겹을 제안하지 않는다(다시 찍기 정답 = 회복만, 목업 `t0.js:146` 과 다름). LIFER 조건 `correct && fresh && !retry` 도 이벤트 필드로만 전달한다.

### 2.3 재출제 규칙

같은 세션의 다시 찍기 카드: **같은 개념 · 다른 Site 우선**(`rank` 에서 오늘 안 본 것, `shape` 가 다른 것), 같은 kind 유지, `attempt+1` 시드. Site 가 하나뿐이면 같은 사용처에 보기만 재셔플(지목형은 동일). 두 번 연속 어긋나면 kind 를 한 단계 쉬운 쪽으로(meaning→blank→point). **왜**: 같은 문제를 그대로 다시 내면 진단문의 정답을 외운 것을 맞힌 것으로 센다.

### 2.4 「모르겠어요」 사다리 데이터 조립

| 단 | 데이터 | 규칙 |
|---|---|---|
| 1 사전 3층 | `dict.one_liner` · `dict.why` · `dict.trace[]`(단계 목록) | 변수 치환(05). `trace` 없으면 목업처럼 `rule / ok / result` 로 대체. `misconceptions` 는 보조 |
| 2 아래층 진단 | `prereq[]` 각각 `{name, ly, status, cardId?}` | status: `known`(ly ≥ 2) · `gap`(ly ≤ 1, 카드 생성 가능 → 즉석 `prereqOnly` 카드, `mins 0.7`) · `none`(리포에 있으나 생성 불가 → 「판 없음」 / 리포에 없음 → 합성 예제 + 「곧 네 코드 어디에서」 예고, 정본 §4). 점프·복귀 후 문단 = 현재 개념의 `payoff` + 선행 개념의 `bridge`(없으면 일반 문장) |
| 3 다른 자리 | 현재 제외 같은 개념 `Site` 상위 3 | 다른 파일 우선 → `shape` 가 다른 것 → unknownCount 오름차순 → 최근 노출 제외. `concept_site.excerpt` + `file.path:line_start` |
| 4 자유 질문 | 프롬프트 텍스트 | 아래 규약. **자동 전송 없음**, 클립보드만 |

프롬프트 규약(목업 `askBuild` 그대로): 헤더 `파일 {file.base} {focus}행 근처입니다.`(**base name 만**; 디렉터리 경로·리포명·커밋 메시지·작성자는 넣지 않는다 — 06 §3.3) → 코드 펜스에 `payload.promptLines`(≤ 9줄), 빈칸은 정답으로 채움 → `배우려는 문법: {concept} ({code})` → `제가 막힌 지점: {사용자 입력|(비어 있음)}` → 상태 한 줄(맞힘/「X」를 골라 틀림/미답) → 마무리 지시문. 다른 파일·다른 줄·리포명은 넣지 않는다.

---

## 3. T1 블록 선정과 페이딩

### 3.1 블록 = 함수/클래스 경계, 12~40줄

블록 후보는 03 §3.2 `_blocks.scm` 의 `@block.function`(+`@block.name`) 캡처로 들어온다. 아래 표는 그 쿼리가 언어별로 잡아야 할 노드와 시그니처 범위의 명세다. 원본 텍스트는 `file_read_block`(01), 원본 AST 는 블록 선정 시 `parse_snippet` 으로 파싱해 02 `block.ast_json` 에 캐시한다.

| Lang | 블록 후보 노드 | 시그니처 범위 |
|---|---|---|
| ts/js(x) | `function_declaration` · `method_definition` · `lexical_declaration`(값이 `arrow_function`) · `class_declaration`(≤ 40줄) · 이를 감싼 `export_statement` | 노드 시작행 ~ 본문 `{` 행 (데코레이터 포함) |
| py | `function_definition` · `class_definition`(`decorated_definition` 포함) | `def/class` 행(+데코레이터) + docstring |
| go | `function_declaration` · `method_declaration` | `func … {` 행 |
| rs | `function_item` · `impl_item`(≤ 40줄) | `#[attr]` + `fn … {` (여러 행 가능) |
| swift / dart | `function_declaration` · `class_declaration` / `method_signature`+`function_body` | 선언행 ~ `{` |
| root=null | 정규식: 언어별 선언 접두 행 ~ 같은 들여쓰기의 닫힘 행 | 첫 행 |

규칙: 12 ≤ 줄수 ≤ 40. 41줄 이상 함수는 본문 최상위 문장 경계로 **분절**(시그니처 + 문장[i..j] + 닫힘, 각 12~40줄; 2번째 분절부터 첫 줄에 `// …이어서` 주석 헤더). 200줄 초과 파일은 블록만 낸다(파일 전체 필사 금지). 함수가 없는 ≤ 40줄 파일(상수·설정)은 파일 자체가 블록. 블록 순위: 블록 안 개념의 겹 평균 높은 순 → ly 0 개념 ≤ 3개 → 최근 커밋에 닿은 것 → 첫 노출은 ≤ 25줄. **왜**: 못 읽는 코드를 필사시키면 타자 연습이 된다(정본 「왜 게이트」의 근거와 같다). **블록 카드의 `concept_id`(숙련도 키)** = 블록 안 Site 개념 중 `_lang.yaml.essential` 에 있고 사전 `difficulty` 가 가장 높은 것, 동률은 Site 수 많은 것. 나머지 개념은 `card_concept(role='secondary')` 로만 기록(겹 반영 없음).

### 3.2 3단계 마스크

`stage 1` 전부 보임 · `stage 2` 아래 **유지 집합**만 잉크, 나머지는 들여쓰기 유지 + 폭 `min(30, max(4, len·0.56))em` 자리표(목업) · `stage 3` 스펙 카드만.

| 유지 종류 | ts/js(x) | py | go | rs | 폴백(정규식) |
|---|---|---|---|---|---|
| 주석 줄 | `comment` 단독 행 | `comment` · docstring | `comment` | `line_comment`·`///` | 언어 주석 접두 |
| 빈 줄 | ○ | ○ | ○ | ○ | ○ |
| 시그니처(중첩 포함) | 3.1 범위 + 중첩 함수 | `def` 행 | `func` 행 | `fn`·`impl` 행 | 선언 접두 행 |
| 구조 여는 줄 | 여러 행에 걸친 `return (` 행 · 최상위 JSX 루트의 여는 태그 행 | — | — | — | `return (` |
| 닫힘 줄 | 닫힘 문자만 있는 행(`}` `)` `]` `</form>` `)}` `);`) | (없음) | `}` 행 | `}` 행 | `^\s*[\)\]\}<>/;,\s]+$` |

목업 `show2=[0,1,5,6,9,10,11,12,17,18,19]` 가 정확히 이 집합이다.

### 3.3 스펙 카드(3단계)

```ts
interface SpecCard { signature:string[]; header?:string; mustHold:{ text:string; source:'user'|'dict'|'ast'; anchor:number[] }[] }
```
`mustHold` 출처 우선순위: ① **사용자** — 2단계 통과(≥ 85) 직후 「이 함수가 지켜야 할 것 2~4줄」 입력 + 왜 게이트(§6)에서 쓴 문장 ② **사전** — 블록 안 개념(Site)의 `dict.one_liner` 를 변수 치환(「`useState` 로 상태 `email` 을 가진다」) ③ **AST 휴리스틱** — 외부 호출 이름(import 된 것), 선언된 상태/지역 변수 수, 반환 루트 요소, 조기 반환 수. ①이 있으면 ②③은 3개까지만 보탠다. **왜**: 스펙을 전부 자동 생성하면 「무엇을 지키는지」를 앱이 대신 말해 능동 출력이 사라진다.

---

## 4. T1 판정 엔진 (정식화)

두 층으로 나뉜다. **타이핑 중(거터)** 은 정규식층만, 줄을 벗어날 때 그 줄만(`i−3..i+3` 원본과 비교, 목업 `evalLine`). **채점(⌘↵)** 은 정렬 → 정규식층 → AST 승격 → 전역 치환 검증 순.

### 4.1 줄 정렬

```
align(O, U):
  A. 같은 줄 우선: U[i] 있고 미사용 && sim(O[i],U[i]) ≥ 0.6 → 짝
  B. 창 탐색: j ∈ [i−2, i+2] 미사용 중 sim 최대, ≥ 0.5 이면 짝, 아니면 missing
  extra = 미사용 비공백 U 줄
  C. NW 폴백 조건: (missing + extra) > max(3, 0.25·|O|)  → A·B 결과를 버리고 Needleman-Wunsch
     점수 = 2·sim − 1 (−1..1), 갭 = −0.5, 공백↔공백 sim = 1, 공백↔비공백 0 ; 역추적 후 sim < 0.5 짝은 해제
  D. 같은 자리 강제 짝: A·B·C 뒤에 원본 i 가 missing 이고 답안 i 가 extra 면 닮음을 묻지 않고 짝짓는다 (D91)
sim(a,b) = Dice(토큰 bag(따옴표 정규화 후))   // 목업 sim. 주석 전용 줄끼리는 1 (2단계가 문구를 비교하지 않으므로)
```
**왜**: 글자 단위 diff 는 한 줄이 밀리면 아래 전부가 빨간 덩어리가 된다. 같은 줄 우선은 「내가 쓴 3행이 원본 3행」이라는 사용자의 기대와 일치하고, 창 ±2 는 한두 줄 밀림을 흡수하며, 3줄 이상 밀림(위에 줄을 끼워 넣음)만 NW 가 받는다. **목업과 다름**: C 단계 추가. **D 단계는 문서·목업에 없다**(D91) — §9 #28 의 Dice 가 0.44 라 문턱 0.5 를 못 넘어 「누락 + 추가」로 갈리는데, 학습자는 그 줄을 썼으므로 §9 가 요구한 `differ TOKEN_COUNT` 가 나오지 않는다.

### 4.2 정규화 파이프라인 (한 짝, 순서 고정)

| # | 단계 | 동작 | 사유 코드 | 결과 |
|---|---|---|---|---|
| 1 | 후행 공백 | `rstrip` 후 같으면 | — | `exact` |
| 2 | 주석 줄 | 둘 다 주석 전용 → `COMMENT_TEXT` / 한쪽만 → `COMMENT_MISSING`·`COMMENT_EXTRA` | | `equiv` / `differ` |
| 3 | 줄 끝 주석 | 토크나이저 `cmt` 토큰 제거(문자열 안 `//` 안전) | `TRAILING_COMMENT` | 계속 |
| 4 | 빈 줄 | 둘 다 빈 줄 → exact / 한쪽만 → `BLANK_MISMATCH` | | 종료 |
| 5 | 들여쓰기 | 폭 다르면 사유만 | `INDENT` | 계속 |
| 6 | 종결자 | 끝 `;`·`,` 유무 다르면 둘 다 제거 | `TERMINATOR` | 계속 |
| 7 | 따옴표 | `'…'` · `` `…` ``(`${` 없음) → `"…"` | `QUOTE` | 계속 |
| 8 | 토큰 열 | 같으면 | 남은 사유 또는 `WHITESPACE` | `equiv` |
| 9 | 토큰 수 | 다르면 → **AST 승격(4.5)** 시도, 실패 시 | `TOKEN_COUNT` | `differ` |
| 10 | 자리별 비교 | 둘 중 하나가 비식별자·PROT·`.`/`?.` 뒤 → `TOKEN_MISMATCH(a↔b)`; 아니면 `maps.push([a,b])` | | `pending` |
| 11 | 전역 치환(4.3) | | `RENAME` / `SWAP` / `RENAME_INCONSISTENT` | `equiv` / `differ` |

토크나이저: `id [A-Za-z_$][\w$]*` · `num` · `str/tpl` · `op`(2~3자 연산자 우선 `?.` `??` `=>` `===` `!==` `...`) · `punct` · `cmt`. **목업과 다름**: 3(줄 끝 주석)과 연산자 다중문자 토큰 추가 — 목업 `\S` 단일 토큰은 `?.` 를 `?`+`.` 로 쪼개 `? .` 공백 삽입을 동등으로 본다.

### 4.3 변수명 치환 3조건 + 검증

```
maps    = pending 행의 [a→b] 전부 (블록 전체가 범위)
fwd[a]  = {b…}, bwd[b] = {a…}
ORIG    = 원본 블록의 식별자 ∪ 파일 모듈 수준 선언명(import·최상위 const/function)   // 블록 안에서 보이는 이름
ANS     = 답안 전체 식별자
행 판정:  ① |fwd[a]| = 1   ② |bwd[b]| = 1   ③ b ∉ ORIG          → 셋 다 → equiv RENAME(a→b, …)
         ③ 위반 → differ SWAP (swap=true)  ①②위반 → differ RENAME_INCONSISTENT
검증 ④:  a ∈ ANS (원본 이름이 답안에 남아 있음, PROT 자리 제외) → RENAME_INCONSISTENT
```
**왜**: ③이 없으면 `submit(password, email)` 이 「email→password, password→email 치환」으로 통과한다 — 스왑 버그. ④가 없으면 `email` 을 한 줄만 `mail` 로 바꾼 답안이 통과한다(목업 누락, **목업과 다름**). 이름 맞바꿈은 뜻이 바뀌므로 어떤 규칙 추가로도 동등이 될 수 없다.

### 4.4 PROT 보호 집합 (치환 불가 이름)

키워드 표 ∪ **import 된 이름** ∪ **속성 이름**(원본에서 `.`·`?.` 뒤, 객체 키, JSX 속성명·태그명) ∪ **import 된 호출의 구조 분해 키**(`const {submit,error,pending} = useLogin()`) ∪ **타입 이름**(주석·제네릭 자리) ∪ **블록이 내보내는 이름**(`export function LoginForm`) ∪ 언어 내장(ts: `console Promise Array Object JSON Math window document undefined NaN` · py: builtins · go: `len append make error nil` · rs: prelude `Some None Ok Err Vec String`). 목업 `PROT` 문자열은 이 규칙의 손계산 결과다.

### 4.5 AST 동등 판정 승격

발동: 9~10 단계에서 `differ` 이고 양쪽 AST 가 있으며(원본 = 캐시, 답안 = 채점 시 `parse_snippet` 1회) 답안 `AstLite` 중 `kind==='ERROR'` 노드 비율 ≤ 20%. `AstLite.start/end` 는 바이트라 줄 시작 오프셋 표로 행에 매핑한다(01 열린 질문 4 수락: Rust 는 `AstLite` 만 주고 비교는 TS). 비교 단위는 **줄이 아니라 문장** — 정렬 후 연속된 비-exact 행 묶음(최대 8행)을 덮는 `statement` 노드들을 양쪽에서 잘라 문장별로 비교하고, 같으면 덮인 행 전부 `equiv`.

정규화 노드열: 전위 순회, 노드 `type` + 잎 텍스트. 규칙 — ⓐ 식별자 α-변환(블록 안 첫 등장 순 번호, 4.3 맵과 PROT 준수) ⓑ 문자열 리터럴 따옴표 정규화(내용은 그대로) ⓒ `;` `,` 후행 · 단일 자식 `parenthesized_expression` 언랩 ⓓ 문장 하나짜리 `statement_block` ≡ 그 문장 ⓔ 단일 매개변수 화살표 `x =>` ≡ `(x) =>` ⓕ 줄 나눔 무시(행 정보는 결과 표시에만) ⓖ **템플릿 리터럴 vs 문자열 연결은 다름**(`TEMPLATE_VS_CONCAT`) ⓗ 연산자·인자 순서·`await`·`?.` 유무·리터럴 값 변화는 언제나 다름. 성공 사유 `AST_EQUIV(세부: PAREN|BLOCK|ARROW_PARENS|LINE_BREAK)`. ERROR 노드가 덮인 행에 있으면 `PARSE_ERROR` 를 사유에 추가하고 정규식 결과 유지.

언어 폴백: `PARSE_LANG_UNSUPPORTED`·`parse_langs` 에 없음·`PARSE_TIMEOUT`·ERROR > 20% → 정규식층만, 결과 `engine:'regex'`, UI 에 「이 언어는 글자 비교만 합니다」.

성능: 파싱은 채점 시 답안 블록 **한 번**(`parse_snippet`, 01 예산 p95 20ms 는 IPC 포함 별도 계정), 비교는 O(노드 수). 예산 — **비교 엔진 자체**(정렬+정규식+AST 비교) 20줄 블록 < 20ms, 40줄 < 35ms; 채점 버튼 → 결과 표시 총합은 IPC 를 더해 < 60ms(05 가 결과 슬롯에 「채점 중」을 두지 않아도 되는 상한). 거터는 한 줄 < 0.2ms(정규식만).

### 4.6 결과 데이터 모델 · 점수 · 진급

```ts
type Status = 'exact'|'equiv'|'differ'|'missing'|'extra';
interface Reason { code:string; detail?:string }
interface T1Row { oi:number; ui:number; status:Status; reasons:Reason[]; maps:[string,string][]; swap?:boolean; engine:'regex'|'ast'; appealed?:boolean }
interface T1Result { blockId; stage:1|2|3; rows:T1Row[]; n:Record<Status,number>; total:number; meaning:number; pct:number;
  verdict:'advance'|'repeat-soft'|'repeat'; peeks:number; downgraded:boolean; engine:'regex'|'ast'; elapsedMs; appeals:number }
```
- `total` = 원본 **비공백** 줄 수 · `meaning = exact + equiv` · `pct = round(100·meaning/total)`. **목업과 다름**: 빈 줄 제외 — 빈 줄이 분모에 들면 20줄 중 2줄이 공짜라 85 문턱이 실질 83 이 된다.
- 판정: `pct ≥ advanceThreshold(total) → advance`(다음 단계), `advanceThreshold(total) = max(65, min(85, round(100 − 200/total)))`(12줄 블록 83, 14줄 85.7→85) · `65 ≤ pct < 85 → repeat-soft`(같은 단계 한 번 더 권함) · `< 65 → repeat`. **정수로 반올림하고 하한을 65 로 잡는다**(D83) — 실수 문턱 83.333 은 `pct`(= `round`) 83 이 못 넘어 공식이 허락한 「두 줄」이 반올림에서 사라지고, 하한이 없으면 3줄 블록의 문턱이 33 이 되어 40 %가 합격이면서 동시에 「한 번 더」가 된다. 이 문턱은 판정뿐 아니라 `ok`(02 §3.2)와 `card_state.stage` 도 같이 본다. 겹 4 는 **3단계 통과에서만**(그 전엔 3 상한). `swap` 행이 하나라도 있으면 pct 와 무관하게 advance 금지 → repeat-soft(인자 순서 오류는 뜻이 바뀐 코드다).
- 힌트: `` ` `` 홀드 = `peeks` 카운트, `⌘.` = `downgraded` — 감점 없음, 이벤트로만 02 에 전달(더 자주 보여줄 신호). 6줄 미만 채점은 1회 경고 후 두 번째 누름에 채점(목업).
- 이벤트 `t1.graded` 는 `T1Result` 요약 + `outcome` + 스테이지.

| 대안 | 버린 이유 |
|---|---|
| 글자 단위 diff(LCS) 점수 | 한 줄 밀림·이름 하나 바꿈에 빨간 덩어리. 학습자에게 「무엇이 다른가」를 못 말한다 |
| 블록 전체 AST 동일성 한 판 | 한 곳만 틀려도 0/1. 줄별 사유가 없어 이의를 붙일 자리가 없다 |
| 테스트 실행 채점 | T3 영역. 실행 환경·언어별 러너 필요, 전 언어 불가 |
| LLM 「같은 뜻인가」 판단 | 키 의존·비결정. 골든 케이스와 이의 루프가 성립 안 함 |
| 편집 거리 임계 하나로 동등 | `==`/`===` 처럼 거리 1 의 의미 차이를 통과시킨다 |

---

## 5. 이의(「같은 뜻인데요」) 루프

```ts
interface Appeal {
  // 02 §8.2 Appeal 원장 그대로
  id; reviewLogId; cardId; track:'t1'|'t2'; lineNo:number|null; originalText:string|null; userText:string|null;
  autoVerdict:'differ'|'missing'|'extra'|'wrong-pick'; autoReason:string|null;
  status:'open'|'accepted'|'rejected'; createdAt; resolvedAt; note;
  // 04 가 더하는 판정 메타
  patternKey:string; engineVersion:string; dictVersion:string; normOriginal:string; normUser:string; reasons:Reason[] }
```
- `differ` 행에서만 접수(목업). **점수 불변**, 행은 「이의 접수됨 · 판정 보류」, 결과에 `appeals` 수. 02 `appeal` 테이블에 저장.
- `patternKey = hash(grammar, 정렬된 reason 코드, 형태 서명)` · 형태 서명 = 토큰 종류 열(식별자→`I`, 리터럴→`L`, 연산자는 그대로) 원본↔답안. 「규칙 제안」은 상태가 아니라 **파생** — 같은 `patternKey` 의 `open` 행이 **3건 이상**이면 설정 화면에 뜬다: 예시 3건(로컬 코드) + 정규화 **카탈로그**(기본 꺼짐, 언어별 토글: `TRAILING_COMMA_ARGS` · `ARROW_BODY_BRACES` · `OPTIONAL_PARENS_RETURN` · `SELF_CLOSING_JSX` · `QUOTE_IN_JSX_ATTR` …) 중 매칭되는 것을 켜자고 제안. 매칭 없으면 「이슈로 보내기」.
- **절대 동등이 될 수 없는 목록**(카탈로그 밖): 연산자 변경(`==`↔`===`, `&&`↔`||`), 인자 순서, 호출 유무, 템플릿↔연결, `await`·`?.` 유무, 리터럴 값, 이름 맞바꿈.
- 오픈소스 이슈: `issues/new?template=t1-rule.yml` URL 을 브라우저로 열거나 복사. 본문 = grammar · reason 코드 · 형태 서명 · engineVersion · dictVersion · patternKey · 로컬 누적 수. **코드 두 줄은 기본 미포함**(체크박스 opt-in). 자동 전송 없음(06). 수용된 이의는 골든 케이스로 추가되고 카탈로그 기본값이 바뀐다.
- **왜**: 실제 학습자 데이터에서 판정 불만의 80% 는 규칙 5개 안에 몰린다. 점수를 고치면 학습자를 달래고, 규칙을 고치면 다음 학습자를 구한다.

---

## 6. 왜 게이트

- 문항 선정(우선순위): ① 원본 줄 중 사전 `why_gate`(03 스키마에 **추가 요청**, 열린 질문 3)가 있는 개념의 Site 가 걸린 줄(의미 차이 태그) ② `missing` 행(「왜 이 줄이 필요했나」 — `why_gate` 없으면 일반 템플릿 `이 줄이 없으면 무엇이 달라질까요?`) ③ 첫 `differ` 행 ④ 첫 비-시그니처 문장. 동순위는 시드로.
- 검증(전부 통과해야 「저장하고 마치기」 활성): ⓐ 트림 후 코드포인트 **≥ 10** ⓑ ≠ 원본 줄 트림 ⓒ `Dice(tokens(답), tokens(원본 줄)) < 0.6`(살짝 고친 복사 차단) ⓓ 한글·라틴 단어 1개 이상. 메시지는 목업(`코드를 그대로 옮기지 말고 말로 써 주세요` / `n / 10자`).
- 흐름: 자기 말 → 「모르겠어요 · 보기 보기」 → 3지선다(`choices`, 고르면 `fb`) → **여전히 자기 말 한 줄**(답 보고 써도 됨). 보기 없는 문항은 그 줄 주 개념의 `dict.one_liner` 를 보여 준다.
- 저장(02 `why_answer`): `{reviewLogId, cardId, blockId, lineNo, questionId, text, pick?, pickOk?, createdAt}`, `questionId` 는 `why_gate:<concept>` | `missing:<line>` | `differ:<line>` | `generic`. **채점·겹 효과 없음.** 홈 「내가 쓴 왜」와 3단계 `mustHold(source:'user')` 의 재료. **왜**: 채점하면 정답을 맞추려 쓰고, 안 하면 자기 말로 쓴다 — 이 한 줄이 목적이다.

---

## 7. T2 그래프

### 7.1 import 해석

| Lang | 규칙 | 노드 |
|---|---|---|
| ts/js | 상대 `./x ../x` → 확장자 `[.ts .tsx .js .jsx .mjs .cjs .d.ts]` → `x/index.*` · `tsconfig` `baseUrl+paths`(선언 순, 첫 매치) · `package.json#imports`(`#x`) · bare(`react`) → external(지도 제외) · `import type`/`{type X}` → `kind:'type'` · `import()`→`dynamic` · `require`·`export * from` → 정적과 동일 | 파일 |
| **프레임워크: Next** | `app/**/page.tsx` 는 루트. **HTTP 엣지**: `fetch/axios` 인자 문자열 `'/api/…'` → `app/api/<path>/route.*` 또는 `pages/api/<path>.*` 가 존재하면 `kind:'http'`(목업 `cartApi → route.ts`). 다른 프레임워크는 표에 행 추가로 확장 | 파일 |
| py | `import a.b` · `from a.b import c` → 소스 루트(`pyproject/setup.py` 위치 또는 `src/`) 기준 `a/b/c.py` → `a/b.py` → `a/b/__init__.py` · 상대 `from ..a` · 외부 → external | 파일 |
| go | `go.mod` `module` 접두 매칭 → **패키지 디렉터리**가 노드(같은 패키지 파일은 한 노드) · 표준·외부 → external | 패키지 |
| rs | `mod x;` → `x.rs`/`x/mod.rs` · `use crate::a::b` → 가장 긴 파일 접두(`src/a/b.rs`→`src/a.rs`) · `super::`/`self::` · 외부 크레이트 → external | 파일 |
| dart | `package:app/x.dart` → `lib/x.dart` · 상대 | 파일 |
| swift | 파일 import 없음 → **타입 참조 휴리스틱**(다른 파일이 선언한 타입명 사용) `confidence:'heuristic'` UI 표기 | 파일 |
| sql / other | 그래프 없음 → T2 미생성 | — |

Rust 는 `_imports.scm` 캡처(`import.source`, `form` = static/type/dynamic/require)만 `capture` 행으로 저장하고 **경로 해석은 TS `concepts/resolve-imports.ts`** 가 파일 집합(Set)으로 한다. 결과는 02 `import_edge` 에 쓴다(`kind`·`confidence`). 2,000 파일 · 5만 조회 < 1.5s.

### 7.2 순환 · 고립 · 밴드

- **순환**: Tarjan SCC. 크기 > 1 SCC 는 `⟲` 표시, 밴드 역방향(아래→위) 엣지는 목업의 위쪽 베지어(제어점 ±30)로 그린다. 흐름 추적에서는 SCC 를 한 노드로 접는다.
- **고립**: in=out=0 → 지도 제외, 단 진입점(`page.*`·`main.*`·`index.*`)은 유지. 제외 수는 「지도 밖 N」으로.
- **밴드**(0 화면 · 1 기능 · 2 동작·통신 · 3 공용·데이터): ① 경로 패턴 우선 — 0: `app/** pages/** views/** screens/**` · 1: `features/**/*.tsx components/**`(ui 제외) · 2: `hooks/** **/use*.ts **/api/** **/*Api.* services/** app/api/**/route.*` · 3: `lib/** utils/** server/** db/** components/ui/** types/** **/schema*`. ② 미매칭 → 그래프 깊이: SCC 축약 DAG 에서 루트로부터 최장 경로 `min(3, depth)`, 그리고 `band ≥ 모든 importer 의 band`(패턴 밴드는 고정). 밴드 라벨·설명(`features/cart/`)은 그 밴드 파일들의 최장 공통 디렉터리.

### 7.3 결정론적 배치(목업 `t2.js` 상수)

`NW 178 · NH 46 · GX 16 · GY 60 · PADL 128 · PADT 22 · PADR 22 · PADB 18`. 밴드 행 `y = PADT + r·(NH+GY)`, 밴드 안 노드는 가로 중앙 정렬. **밴드 내 순서**: 초기 = 경로 사전순 → 무게중심(barycenter) 스윕 아래 2회·위 2회(부모 x 중앙값), 동점은 경로 사전순 — 난수 없음. **포트 분산**: 나가는 선은 아래 변, 들어오는 선은 위 변, 슬롯 순서 = 상대 노드 x, `span = min(NW−40, (n−1)·22)`. 엣지: 아래로 갈 때 `dy = max(18, (ty−sy)·0.42)` 3차 베지어, 위로(역방향) 제어점 30. `type` 엣지는 점선, `http` 엣지는 이중선(05).

### 7.4 노드 상한과 축약

한 문제 지도 **≤ 24 노드**. 범위 = 유닛(기능 폴더) + 1-hop 이웃. 초과 시 ① 유닛 밖 노드를 디렉터리로 접어 폴더 노드 `lib/ (3)` — **정답지(core/sec)에 든 파일은 절대 접지 않음** ② 그래도 초과면 정답지 밖 · in-degree 1 인 밴드 3 잎을 「지도 밖」 각주로 ③ 그래도 초과면(①②가 둘 다 안 무는 입력이 있다) 정답지·유닛 진입점을 뺀 나머지를 유닛 밖 → 아래 밴드 → 낮은 차수 → 경로 사전순으로 24 까지 뺀다 (D102). 접힌 노드를 고르면 그 안 파일이 core 에 없으므로 wrong 처리하되 사유 「접힌 폴더 — 안쪽 파일을 묻는 문제가 아님」.

| 대안 | 버린 이유 |
|---|---|
| dagre / elk 자동 배치 | 밴드(층) 의미가 사라지고 리포마다 모양이 튀어 「내 지도」 기억이 안 쌓인다. 결정성도 라이브러리 버전에 묶임 |
| force-directed | 매번 다른 그림. 같은 문제를 복습할 때 지도가 달라지면 복습이 아니다 |

---

## 8. T2 문제 4종과 정답지

### 8.1 책임 배치 — 커밋에서 core / sec / trap 도출

후보 커밋: `git_commit.kind='normal' ∧ author_matched=1 ∧ is_reachable=1` · 03 §1.3 분류에서 `bot`·머지 제외 · 소스 파일 변경 3~12개 · 유닛 폴더에 닿음 · 메시지 접두가 `chore|style|docs|ci|build|Merge|Revert` 아님(`feat|fix` 우선) · 접두 제거 후 메시지 ≥ 8자 · `additions+deletions = 0` 인 파일(통계가 이미 공백 무시) 제외 · 테스트·스냅샷·락파일·생성물 제외(패턴 표).

```
F = commit_file WHERE commit_id 중 소스 파일
core = { f ∈ F : status==='A' ∨ additions+deletions ≥ 5 ∨ 유닛 진입점 }   // 「꼭 고쳐야 할」 — 03 열린 질문 7 의 답
sec  = (F ∖ core)  ∪  { g ∉ F : 최근 50 커밋에서 core 파일 ≥ 2개와 함께 바뀐 비율 ≥ 0.5 }   // 「같이 바뀜」, 감점·가산 없음
     ; F 안에서 추가 줄이 전부 import 문인 파일도 sec
trap = 지도 안 ∖ (core ∪ sec) → 관계별 사유 템플릿   // 「core 의 1-hop 이웃」 단서는 뺐다 (D101)
```
trap 사유 템플릿: **부모 미변경** `«X» 는 «Y» 를 놓기만 합니다. 안쪽이 바뀌어도 «X» 는 모릅니다` · **공용 의존 미변경** `공용 부품. «Y» 가 가져다 쓸 뿐입니다` · **같은 폴더 형제(상태 보유) 미변경 + 신규 파일 존재** `«X» 에 상태가 있지만 이번엔 새 파일 «N» 이 그 일을 맡았습니다` · 기본 `이번 커밋에서는 바뀌지 않은 파일입니다`. 목업 `trap` 다섯 문장은 이 템플릿의 손계산이다. 질문 = 접두 뗀 커밋 메시지 → `«{msg}» 기능을 넣는다면, 어느 파일들을 고쳐야 할까요?`. 힌트 3단(목업): ① core 가 걸친 밴드 수 ② 신규 파일 수(2단부터 「새 파일」 배지 노출) ③ core 수 (+ sec 수).

### 8.2 채점 3티어 · 부분 점수 · 놓친 파일 우선

```
found = core ∩ sel · missed = core ∖ sel · bonus = sec ∩ sel · wrong = sel ∖ (core ∪ sec)
pct = round(100·|found|/|core|)                       // 목업. sec 는 분모·분자 어디에도 없음
verdict: pct ≥ 85 && |wrong| ≤ ceil(|core|/2) → advance · pct ≥ 65 → repeat-soft · else repeat   // 목업 66 → T1 과 같은 65 로 통일
```
**목업과 다름**: `|wrong|` 상한 — 없으면 전부 고르면 100% 다(3일 안에 뚫린다). 표시 pct 는 목업 그대로 두고 진급만 막으며 문장 「고른 것 중 절반 이상이 안 바뀐 파일 — 범위를 좁혀 보세요」. 결과 순서 = **missed → found → wrong → sec**, `missed` 는 밴드 위→아래, x 순으로 정렬해 첫 항목을 스크롤·깜빡임(05). 출처 블록 `{hash, date, msg, stat}` 항상 표시(「LLM 채점이 아니라 실제 커밋」).

### 8.3 나머지 3종(그래프만으로 생성)

| 문제 | 질문 | 정답지 | 함정 | 채점 |
|---|---|---|---|---|
| 영향 반경 | `«X» 를 바꾸면 어느 파일이 영향을 받나요?` | core = 역방향 1-hop(importers), sec = 2-hop · type·http 엣지 포함 | X 가 **쓰는** 파일(방향 반대) — `«Y» 는 «X» 가 가져다 쓰는 쪽이라 «X» 가 바뀌어도 모릅니다` | 8.2 와 동일 |
| 흐름 추적 | `«진입점» 에서 «싱크» 까지 어떤 순서로 지나가나요?` | SCC 축약 DAG 에서 유닛 진입점→최심 노드 최장 단순 경로, 3~6 노드 · type 엣지 제외 | 경로 옆 형제 노드 2장을 카드 덱에 섞음 | `pct = 맞은 인접 쌍 / (len−1)`, 함정 카드가 들어간 자리는 그 쌍 오답 |
| 의존성 방향 | `«A» 와 «B» — 어느 쪽이 어느 쪽을 가져다 쓰나요?` 5문항 묶음 | 4지(A→B · B→A · 양쪽 · 무관) · 밴드 차 ≥ 1 인 쌍 우선, 시드로 5쌍 | — | `pct = 맞은 문항/5·100` |

### 8.4 커밋 부족 폴백 · 「이것도 맞다」

유닛의 후보 커밋 **< 3** → 책임 배치 미생성, 홈에 「커밋이 적어 정답지가 그래프에서만 나옵니다」(정본이 든 project06 반례). 「이것도 맞다고 생각해요」는 02 `appeal(track='t2', auto_verdict='wrong-pick', user_text=파일 경로, review_log_id, card_id)` 에 파일마다 1행 저장; 같은 `(card_id, user_text)` open 행이 3개면 그 문제의 sec 에 로컬 편입 제안(사용자 확인). 원격 집계는 없다(06) — 이슈 템플릿으로만. **왜**: 정답지가 커밋 1건이면 「정답 하나뿐인 정답지」다. 커밋은 한 사람이 그날 고른 경로일 뿐이므로 sec 와 피드백으로 넓힐 통로가 처음부터 있어야 한다.

---

## 9. 공통 — 결정성 · 골든 케이스 · 성능

**결정성 검사**: 같은 `(repoId, target, attempt, dictVersion)` 로 두 번 생성·채점 → 결과 deep-equal 을 CI 골든 테스트로 고정. T2 배치는 난수 자체가 없다.

**T1 골든 케이스**(원본 / 답안 / 기대 상태 / 사유). ts 기본, 치환 사례는 블록 전체가 일관됐다고 가정.

| # | 원본 | 답안 | 기대 | 사유 |
|---|---|---|---|---|
| 1 | `const x = 1` | `const x = 1   ` | exact | — |
| 2 | `const { submit, error, pending } = useLogin()` | `… = useLogin();` | equiv | TERMINATOR |
| 3 | `useState('')` | `useState("")` | equiv | QUOTE |
| 4 | `  e.preventDefault()` | `e.preventDefault()` | equiv | INDENT |
| 5 | `async function onSubmit(e: FormEvent) {` + `e.preventDefault()` | `…(ev: FormEvent) {` + `ev.preventDefault()` | equiv | RENAME e→ev |
| 6 | `await submit(email, password)` | `await submit(password, email)` | differ | SWAP |
| 7 | `setEmail(e.target.value)` | `setEmail(e.target.val)` | differ | TOKEN_MISMATCH(PROT 속성) |
| 8 | `const [email, setEmail] = …` + `value={email}` | `const [mail, setEmail] = …` + `value={email}` | differ | RENAME_INCONSISTENT(검증 ④) |
| 9 | `// 로그인 폼…` | `// login form` | equiv | COMMENT_TEXT |
| 10 | `// 로그인 폼…` | (없음) | missing | — |
| 11 | `<button disabled={pending}>로그인</button>` | `…>Login</button>` | differ | TOKEN_COUNT (JSX 텍스트는 뜻) |
| 12 | `{error && <p className="err">{error}</p>}` | (없음) | missing | — |
| 13 | (없음) | `console.log(email)` | extra | — |
| 14 | `if (!res.ok) return` | `if (!res.ok) { return }` | equiv | AST_EQUIV:BLOCK |
| 15 | `return (` / `  <form …>` (2행) | `return <form …>` (1행) | equiv×2 | AST_EQUIV:LINE_BREAK |
| 16 | `const t = a + b` | `const t = (a + b)` | equiv | AST_EQUIV:PAREN |
| 17 | `` `${nick} 님` `` | `nick + ' 님'` | differ | TEMPLATE_VS_CONCAT |
| 18 | `x == null` | `x === null` | differ | TOKEN_MISMATCH(연산자) |
| 19 | `items.map((i) => i.id)` | `items.map(i => i.id)` | equiv | AST_EQUIV:ARROW_PARENS |
| 20 | `setItems((prev) => [...prev, item])` | `setItems((p) => [...p, item])` | equiv | RENAME prev→p |
| 21 | `setItems((prev) => [...prev, item])` | `setItems([...items, item])` | differ | TOKEN_COUNT (AST 도 다름) |
| 22 | `res.user?.profile` | `res.user ?. profile` | equiv | WHITESPACE (다중문자 op 토큰) |
| 23 | `res.user?.profile` | `res.user.profile` | differ | TOKEN_MISMATCH(`?.` 유무) |
| 24 | 3행 위에 주석 2줄 끼워 넣고 나머지 동일 | | 전부 exact | NW 폴백 정렬 |
| 25 py | `def f(x):` | `def f( x ):` | equiv | WHITESPACE |
| 26 py | `return x` | `return (x)` | equiv(ast) / differ(regex) | AST_EQUIV:PAREN / TOKEN_COUNT |
| 27 go | `if err != nil { return err }` | 3행으로 나눔 | equiv | AST_EQUIV:LINE_BREAK |
| 28 rs | `let v = Vec::new();` | `let v = vec![];` | differ | TOKEN_COUNT (매크로 ≠ 호출) |

**T0 골든**: `optchain` 에서 `??` 짚음 → wrong, 진단 = `confusions[ts.nullish]` · `mapupdate` 에서 `forEach` → wrong, `confusions[forEach]` · 같은 시드 두 번 → 보기 순서 동일 · confusions 2개뿐 + 색인 0 → 빈칸 불가 → 지목형 폴백.
**T2 골든**(목업 데이터): 선택 `{QuantityStepper, useCartQuantity, CartItemRow, cartApi, CartSheet}` → found 4 · missed `{route.ts, cartRepo.ts}` · wrong `{CartSheet}`(부모 미변경 사유) · pct 67 · repeat-soft · 12개 전부 선택 → pct 100 이지만 wrong 5 > 3 → advance 금지 · 커밋 2건 리포 → 책임 배치 없음, 그래프 3종만.

**성능 예산**: T0 카드 1장 < 5ms, 개념 50개 일괄 < 200ms · T1 거터 한 줄 < 0.2ms, 비교 엔진 20줄 < 20ms · 40줄 < 35ms(+`parse_snippet` IPC 01 예산) · T2 2,000 파일 해석 < 1.5s, 24 노드 배치 < 5ms, SCC O(V+E). 모두 메인 스레드 차단 없이(채점은 Web Worker 가능, 05).

---

## 위험과 완화

| 위험 | 완화 |
|---|---|
| tree-sitter 커뮤니티 문법(Swift·Dart) 품질 편차로 AST 승격이 오판 | ERROR 비율 20% 게이트 + `engine` 표기 + 정규식 폴백. 언어별 골든 케이스가 없으면 승격 비활성(허용 목록) |
| 정규화 카탈로그가 자라며 뜻이 다른 것을 동등으로 흡수 | 「절대 동등 불가」 목록을 코드로 고정하고 카탈로그 항목마다 반례 골든 케이스 필수 |
| 커밋 정답지가 저자 한 사람의 경로라 좁음 | sec 티어 + 공변경 이력 + 「이것도 맞다」 3회 편입 |
| HTTP 엣지 휴리스틱이 프레임워크마다 다름 | 프레임워크 표 한 행 = 한 규칙, 미등록 프레임워크는 http 엣지 없이 동작 |
| 프롬프트 생성(사다리 4단)에 코드 노출 | ±4줄·단일 파일·자동 전송 없음. 06 의 시크릿 스캔은 붙이지 않음 — 사용자 코드는 사용자 소유 |
| 「미지 개념 개수」(03) 지연 시 T0 순위 붕괴 | `unknown` 미제공이면 사전순 폴백 + 경고 로그, 인터페이스는 고정 |

## 열린 질문 / 결정 요청

1. **02**: `lyProposed` 규칙(정합 +1 · 어긋남 유지 · 모르겠어요 −1 · 다시 찍기 정합 시 +1 복귀)을 02 가 그대로 채택하는가, FSRS 로 대체하는가. T1 겹 4 = 3단계 통과 조건도 확인. **→ 결정: D3** — 02 채택, `lyProposed` 폐기(이벤트는 `outcome` 만); T1 4겹 = 3단계 통과 확인.
2. **02/05**: T1 `total` 빈 줄 제외(목업 20 → 18) — 표시 숫자가 바뀐다. **→ 결정: D14** — 채택.
3. **03**: 사전 스키마에 `why_gate: { q, help, choices[{t, ok, fb}] }` 필드 추가 요청(§6). 없으면 왜 게이트는 「누락 줄 / 첫 어긋남 + 일반 템플릿」만으로 동작한다. 아울러 `point[].diag` 가 없는 pick(①②밖 후보)에 쓰는 일반 진단 템플릿을 사전 `_lang.yaml` 에 두는 것에 동의하는지. **→ 결정: D6** — 둘 다 채택.
4. **03 열린 질문 7 답**: T2 core = `status==='A' ∨ additions+deletions ≥ 5`, sec = 나머지 F ∪ 공변경(§8.1). 03 제안 `added ≥ 3` 보다 높인 이유 — import 한 줄 추가 파일이 core 가 되는 것을 막기 위함. **→ 결정: D5**.
5. **01 열린 질문 4 수락**: AST 비교는 TS. 단 `parse_snippet` 결과에 `ERROR` 노드가 `kind` 로 남아 있어야 20% 게이트가 성립한다(01 §3.1 `AstLite` 확인). 원본 블록 AST 는 블록 선정 시 파싱해 `dict_cache_*` 가 아닌 02 의 블록 테이블에 캐시할지. **→ 결정: D14** — 02 `block.ast_json`; 01 `AstLite.kind` 에 `'ERROR'` 유지.
6. **T2 wrong 상한**과 **20줄 이하 T1 블록의 85 문턱**(17줄 중 15줄 = 88, 14줄 = 82 — 작은 블록은 한 줄이 6점): `min(85, 100 − 200/total)` 같은 완충을 둘지. **→ 결정: D14** — T1 만 완충, T2 wrong 상한 유지.
7. **06**: 이슈 템플릿 `t1-rule.yml` 필드와 코드 opt-in 문구. **→ 결정: 06 §7.3** 필드 + opt-in 문구 「원본·답안 두 줄을 포함합니다(기본 꺼짐)」.

## 구현 체크리스트

- [ ] 공통 시드·PRNG·토크나이저 — `seedOf`·mulberry32·다중문자 op 토크나이저, 결정성 골든 테스트 (선행: 없음) · 1일
- [ ] T0 생성기 3종 — point/blank/meaning + 폴백 사슬 + `no-plate` 사유, 목업 4카드를 03 예시 YAML + Site 로 재현 (선행: 03 사전 스키마·Site) · 3일
- [ ] T0 채점·진단·이벤트 — 판정, 진단 선택 표, `t0.answered`, 재출제 규칙 (선행: T0 생성기) · 1일
- [ ] 사다리 데이터 조립기 — 4단 데이터, prereq 상태 판정, 프롬프트 규약 ±4줄·base name (선행: T0 채점, 02 겹 조회) · 2일
- [ ] T1 블록 선정·마스크 — 언어별 노드 표, 분절, 2단계 유지 집합, 스펙 카드, 대표 개념 선정 (선행: 03 `block.function` 캡처·01 `file_read_block`) · 2일
- [ ] T1 정규식층 — 정렬 A/B/C(NW), 파이프라인 11단계, PROT 구성, 치환 3조건+④ (선행: 공통) · 3일
- [ ] T1 AST 승격 — 문장 단위 잘라내기, 정규화 ⓐ~ⓗ, 폴백 게이트, 성능 측정 (선행: 정규식층, 01 `parse_snippet`) · 3일
- [ ] T1 결과·점수·이의 — 데이터 모델, 판정 임계, Appeal·patternKey·카탈로그·이슈 URL (선행: 정규식층) · 2일
- [ ] 왜 게이트 — 문항 선정, 검증 4조건, 저장, 스펙 카드 연계 (선행: T1 결과) · 1일
- [ ] T2 import 해석기 `resolve-imports.ts` — ts/py/go/rs/dart 표, tsconfig paths, Next http 엣지, external 분류 (선행: 03 `import.source` 캡처) · 3일
- [ ] T2 그래프 정리·배치 — SCC, 고립, 밴드 규칙, barycenter, 포트, 24 노드 축약 (선행: 해석기) · 2일
- [ ] T2 정답지 도출 — `commit_file`·`kind`·`author_matched` 로 후보 필터, core/sec/trap, 힌트, 질문 템플릿, 커밋 부족 폴백 (선행: git2 diff 계약 01/03) · 2일
- [ ] T2 채점·문제 3종 — 3티어·wrong 상한, 영향 반경·흐름 추적·방향, 「이것도 맞다」 편입 (선행: 정답지) · 2일
- [ ] 골든 케이스 스위트 — §9 표 28건 + T0/T2 케이스를 픽스처로, CI 게이트 (선행: 위 전부) · 1일
