# 00 · 개요 · 인계

**이 문서의 위치** — Chickadee 설계 문서 6편(01~06)의 앞머리. 6편이 서로 어긋난 결정을 하나로 정하고(§4), 구현 순서를 마일스톤에 배치하고(§5), 이 폴더만 보고 구현을 이어갈 세션이 어디서 시작할지를 적는다. 각 문서 작성자가 자기 문서에 반영할 수정 지시는 `docs/REVIEW.md` 에 있다. **정본은 `.oculpm/discussion/vibe-code-study-app/discussion.md` 의 「결론」** 이며 이 문서는 정본을 바꾸지 않는다 — 정본을 고쳐야 하는 것은 §4.3 에 따로 모았다.

---

## 1. 요약과 시작점

Chickadee 는 바이브 코딩으로 앱을 만들었지만 자기 코드를 이해하지 못하는 사람을 위한 Tauri 데스크톱 학습 앱이다. 사용자 리포를 **얇은 Rust**(git2 · tree-sitter · rusqlite 호출 껍데기, ≤ 2300줄)가 읽어 「사실」(파일 · 캡처 · 커밋 · 커밋 파일)만 SQLite 에 쓰고, **두꺼운 TypeScript** 가 그 사실에서 개념 사용처 · 카드 · 오늘의 큐 · 채점 · 잉크 겹(숙련도 0~4) · 전 UI 를 만든다. 세 트랙(T0 문법 · T1 클론 코딩 · T2 구조)은 실행 없이 채점되고, LLM 은 사다리 4단의 부가 기능일 뿐이며, 코드는 컴퓨터 밖으로 나가지 않는다. 시각은 「잉크」(리소그래프) + 박새 Dee 이고 목업 두 장이 화면의 정본이다.

**이 폴더를 처음 여는 세션이 할 일**

1. 정본 `.oculpm/discussion/vibe-code-study-app/discussion.md` 의 「결론」 §2 · §3 · §5 를 읽는다(§6~§8 은 화면을 만들 때).
2. 이 문서 §3 용어집 → §4 결정 등록부 → §5 마일스톤 순으로 읽는다. 문서 간 이름이 다르면 §3 의 **확정 이름**이 답이다.
3. 맡은 마일스톤의 문서만 읽는다 — M0·M1 은 `01` → `02` §2 → `03`, M2 는 `02` §3~§6 → `04` §1~§2 → `05`, M3·M4 는 `04` → `05`, M5 는 `06`. 읽기 전에 `REVIEW.md` 의 그 문서 절이 반영됐는지 확인한다.
4. 목업은 `design/ink-home.html` · `design/ink-session.html` · 소스 `design/src/ink/*.js`(카드가 요구하는 데이터 모양의 실물). 로고는 `design/logo/chickadee-logo.svg`(변경 금지).
5. 시작은 **M0** (§5) 의 `01 · 워크스페이스 스캐폴드` 부터. 작업 단위가 끝날 때마다 `AGENTS.md` 규칙대로 일지를 쓴다(§7).

---

## 2. 시스템 지도

```
 사용자 리포 (읽기 전용, .git 은 git2 로만)            문법 사전 dictionary/<lang>/<concept>.{yaml,scm}
        │                                                        │ (번들 리소스, dict-user/ 가 우선)
        ▼                                                        ▼
 ┌─ Rust 사실 층 ─ crates/{git,parse,store} + apps/desktop/src-tauri/jobs.rs ────────────────────┐
 │ walk(ignore) → 해시(git blob oid) → tree-sitter parse+query → git2 revwalk/diff → 500행 tx      │ 01 · 03(§1~2)
 │ 쓰는 것: repo · ingest_run · file · capture · git_commit · commit_file   (명령: repo_* ingest_*    │
 │ file_read_* parse_snippet git_diff_text git_blame_lines store_* dict_* app_*)                      │
 └────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                              ▼  IPC(JSON ≤ 1 MiB, store_query/exec/batch 는 이름으로만)
 ┌─ SQLite (app_data_dir/chickadee.db, WAL, user_version 마이그레이션) ────────────────────────────┐
 │ 사실 6 + 사전 물질화 3 + 파생(concept_site · import_edge · block · unit · unit_node · gap · card) │ 02
 │ + 원장(session · session_item · review_log · dunno_event · ladder_event · appeal · why_answer · lifer)│
 │ + 캐시(mastery · card_state · perf_sample) + settings · scheduler_params                            │
 └────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                              ▼  TS 파생 층 (packages/*)
   concepts  캡처 → concept_site(lineConcepts·uncoveredRatio·shape·site_key) · import 해석 · unit · gap   03(§3~6) · 04(§7.1)
   cards     T0 3종 · T1 블록·마스크·스펙 · T2 4종·정답지(core/sec/trap)                                 04
   scheduler FSRS(ts-fsrs) · 겹 리듀서 · 오늘의 큐 · 미지 개념 순위 · 전이                                02
   grading   T0 판정·진단 · T1 정렬→정규식→AST 승격→치환 검증 · T2 3티어 · 사다리 데이터 · 프롬프트          04
                                              ▼
 ┌─ UI (React 19 · Vite · Zustand · Monaco · 순수 CSS 토큰) ──────────────────────────────────────┐
 │ home(인쇄 대지) · session 오버레이(교정쇄: T0/T1/T2 판 · 사다리 · LIFER · 요약) · ingest · settings   │ 05
 └──────────────────────────────────────────────────────────────────────────────────────────────┘
 품질·보안·릴리스: 골든·property·IPC 덤프 재생·디자인 게이트·E2E · CSP·키체인·로그 금지 필드 · 3-OS 빌드    06
```

| 상자 | 소유 문서 | 다른 문서는 |
|---|---|---|
| Rust 크레이트 · Tauri 명령·이벤트 · 오류 코드 · 디렉터리 · 성능 예산 | 01 | 이름으로만 참조 |
| DDL 전부 · 겹 리듀서 · FSRS 매핑 · 큐 · 미지 개념 캐시 · TS 행 타입 | 02 | SQL 을 쓰지 않는다 |
| 인제스트 정책(필터·커밋 분류·증분·blame) · 캡처 규약 · Site 파생 알고리즘 · 사전 YAML · 구멍 지도 · 대지 탐지 | 03 | Rust 부분은 01 의 명령 형태를 따른다 |
| T0 생성·채점 · T1 엔진 · T2 그래프·정답지 · 사다리 데이터 · 프롬프트 규약 · 골든 | 04 | 겹·큐 효과는 이벤트로만 02 에 넘긴다 |
| 컴포넌트 · 상태 · 키맵 · 토큰 · Monaco · 접근성 강제 · 목업 이전 | 05 | `invoke` 는 `ipc-client` 밖에서 금지 |
| 테스트 피라미드 · 게이트 · 프라이버시 · 보안 · CI/CD · 릴리스 · 오픈소스 문서 | 06 | 경로·수치는 01·02·04 를 따른다 |

---

## 3. 용어집

은유(화면 문구) ↔ 평문 ↔ 코드 이름. 「폐기」는 어느 문서에 있었으나 더 쓰지 않는 이름.

| 은유 | 평문 | 확정 코드 이름 | 폐기 |
|---|---|---|---|
| 판 | 카드 | `card` (`track` t0/t1/t2/t3 · `kind`) | — |
| 잉크 겹 0~4 (미인쇄·애벌·먹판·+청판·+진홍) | 숙련도 | `mastery.layer` · `Layer` · 표시 겹 `shownLayer` | `ly`(UI 지역 변수만) |
| 다시 찍기 | 재출제(오답·모르겠어요 뒤 +3 자리) | `session_item.role='retry'` | — |
| 모르겠어요 | 다시 찍기 버튼 · 감점 없음 | `dunno` · `dunno_event` | — |
| 사다리 1~4단 | 모르겠어요 4단(사전·아래층·다른 자리·자유 질문) | `ReprintLadder` · `ladder_event.rung` | 세션 `.ladder` |
| 아래층 | 선행 개념 판 | `prereq` · `concept_prereq` · `role='prereq'` | — |
| 이어보기 문단 | 아래층에서 돌아온 뒤 연결 글 | `bridge`(사전) · `LinkPara` | — |
| 교정쇄 | 하루 세션 | `session` · `session_item` | `sessions` · `state_json` 블롭 · `runId` |
| 오늘의 인쇄 | 오늘의 큐 | `planSession` → `session_item` | `buildQueue` |
| 작업 띠 | 시간 비례 진행바 | `JobBand` · `TimeQueue`(`est_min`) | — |
| 새 판 · 판 만들기 | 새 카드 · 구멍에서 카드 생성 | `role='new'` · `role='gap'` | — |
| 판이 없는 문법 | 내 코드엔 있는데 카드 없는 개념 | `gap` | 미기록 종 |
| LIFER · 채집지 | 개념 첫 기록 의식 · 그 파일·줄 | `lifer`(id = 일련번호) · `lifer.file_path` | — |
| 정합 · 동등 · 어긋남 · 누락 · 추가 | 맞음 · 같은 뜻 · 다름 | `exact · equiv · differ · missing · extra` | — |
| 이의(「같은 뜻인데요」·「이것도 맞다」) | 판정 이의, 점수 불변 | `appeal` (`track` t1/t2) | `disputes` · `Dispute` · `t2_feedback` · `disputedLines` |
| 왜 게이트 | 필사 뒤 자기 말 한 줄 | `why_answer` · `WhyGate` | `why_answers` |
| 대지(시트) · 스티커(노드) | 내 리포의 기능 하나 · 그 안의 (개념, 트랙) | `unit` · `unit_node` PK(unit, concept, track) | — |
| 사용처 | 개념이 내 코드에 쓰인 자리 | `concept_site` · TS `ConceptSite` | `Site`(03 타입) · `captures` |
| 캡처 | tree-sitter 쿼리 결과 한 건 | `capture` · Rust `Capture` | `imports` 테이블 |
| 정답지 | 실제 커밋의 변경 파일 | `git_commit` · `commit_file` · `core/sec/trap` | `CommitRec` · `commits` · `commit_files` |
| 지도 | import 그래프 | `import_edge` · `DependencyMap` | — |
| 판 짜기 | TS 파생 + 카드 생성 | `packages/concepts` `derive` · `packages/cards` | `chickadee-ingest` 크레이트(개념어로만) |
| 리포 읽기 | 인제스트 | `ingest_run` · Rust `jobs.rs` | `ingest_runs` · `ingest_state` |
| 문법 사전 | 개념 YAML + 쿼리 | `dictionary/<lang>/<concept>.yaml`+`.scm` · `_lang.yaml` | `dictionaries/` · `manifest.yaml` · `concepts.yaml` |
| 문법(grammar) | tree-sitter 문법 키 | `grammar` = `typescript·tsx·javascript·python·go·rust·swift·dart·sql` | `LangSpec.lang` · `sequel` |
| 언어(lang) | 사전 네임스페이스 | `lang` = `ts·py·go·rs·swift·dart·sql·common·react·arch` | `dictionary/typescript/` |
| 전이 · 흐려짐 · 다음 인쇄 | 다른 언어에서 아는 개념 · 겹이 옅어짐 · 다음 복습 시점 | `universal_id`·`mastery.transfer_from` · `fade(R)` · `mastery.due_at`·`labelFor` | — |
| 원본 잠깐 보기 · 한 단계 쉽게 · 힌트 | T1 힌트 · T1 단계 내리기 · T2 힌트 | `peeks` · `downgraded` · `hints` | — |
| 블록 · 3단계 · 스펙 카드 · 대표 개념 | T1 필사 단위 · 페이딩 · 3단계 요구 목록 · T1 숙련도 키 | `block` · `card_state.stage` · `SpecCard` · `card.concept_id`(T1) | — |
| 그것이 참이 되는 조건 · 가장 날카로운 자리 | 오답 진단문 · 반례 코드 | `diag.t` · `diag.edge` | 「틀렸다」 |
| 선택의 왜 | 생성 시점 기록 | ocul-pm 일지 (`repo_glob_read`) | — |
| 도장 · 판정란 · 길잡이 | 판정 스탬프 · 피드백 슬롯 · 마스코트 말풍선 | `Stamp` · `FeedbackSlot` · `Guide`/`Say` | — |
| 잉크 겹 척도(홈) | 겹별 개념 수 | `InkScale` | 홈 `.ladder` |
| 주간반/야간반 · 부속 숨김 | 라이트/다크 · 장식 끄기 | `data-theme` · `data-trim` | — |

---

## 4. 결정 등록부

우선순위: 정본 > 검증된 것(02 DDL 은 SQLite 실행 검증, 04 는 목업 코드 정식화) > 단순한 쪽 > 나중에 바꾸기 쉬운 쪽. 정확한 문장·타입·DDL 은 `REVIEW.md` 의 해당 문서 절에 있다.

### 4.1 제기된 상충 14건

| # | 쟁점 | 결정 | 근거 | 반영 |
|---|---|---|---|---|
| D1 | Rust↔TS 경계 | 01 채택. Rust 는 `file·capture·git_commit·commit_file` 만 SQLite 에 직접 쓴다. TS `packages/concepts` 가 캡처를 **파일 단위 페이지**로 읽어 03 §3.3~3.6 알고리즘(Site 필드·shape+occurrence·lineConcepts·uncoveredRatio·unknownCount) 그대로 `concept_site` 를 파생해 쓴다. blame 은 `git_blame_lines` 명령 추가. 크레이트는 `crates/git·parse·store`+`jobs.rs`; `chickadee-ingest` 는 두 층을 가리키는 말로만. `Capture` 에 `matchId·patternIndex·form·inError·startCol·endCol·nodeKind` 추가 | 정본 §5; 03 알고리즘은 검증된 자산 | 01 §3.1·3.3·9 · 03 §1·§3 |
| D2 | 테이블 이름·열 | 02 DDL 정본(단수형). 01 의 복수형 이름 폐기. 02 에 `capture`·`commit_file`·`import_edge`·`block`·`why_answer`·`perf_sample` 추가, `ingest_run` 에 fingerprint 구성 열, `concept_site.excerpt TEXT ≤ 200자` | 02 는 실행 검증됨 | 02 §2 · 01 §3.3~3.4 · 06 §6.3·§8 |
| D3 | 겹 규칙 | 02 리듀서: 다시 찍기 정답 = 회복만, 모르겠어요 = −1 + Again, 하루 최대 +1, T1 4겹 = 3단계 통과, T2 진급 85. 04 `lyProposed` 폐기 → 이벤트에 `outcome:'ok'|'wrong'|'dunno'` 만, 02 `applyOutcome` 이 계산. 목업 `t0.js:146` 은 다시 찍기에도 +1 → 앱과 다름을 05 에 명시, 수정은 05 「목업 정리」 | 정본 §2 「시간을 두고 다시 맞힌 횟수」 | 02 §3.3 · 04 §2.2 · 05 §3 |
| D4 | 이름 · 숙련도 키 | `appeal` 통일(`disputes`·`Dispute`·`t2_feedback` 폐기). 겹은 **언어 개념 id** 에 쌓는다. 전이: 같은 `universal_id` 의 어떤 언어 개념이 **3겹 이상**이면 새 언어 개념은 첫 노출 때 `mastery{layer:1, transfer_from}` 로 시작 + 「표기 차이」 카드 우선, 첫 정답 Good | 02 열린 질문 10 · 정본 §4 | 02 §6.3·DDL · 03 §3.1 · 04 §5 |
| D5 | T2 core 임계 | `core = { status==='A' ∨ additions+deletions ≥ 5 ∨ 유닛 진입점 }` | import 한 줄 파일이 core 가 되는 것을 막음 | 03 열린 질문 7 · 04 §8.1 |
| D6 | 사전 스키마 | 개념 필드 `why_gate:{q,help,choices[{t,ok,fb}]}`(선택) + `_lang.yaml.diag_default:{point,blank}` 일반 진단 템플릿 | 04 §6 | 03 §4.4·§6 · 04 §2.1 |
| D7 | 폰트·네트워크 | 확인만: OFL 원본 woff2 9파일 번들(≈8 MB), CSP `default-src 'self'`+`worker-src 'self' blob:`(Monaco), 네트워크 0(예외: 사용자가 켠 LLM 4단) | 01·05·06 일치 | 06 §4.3 |
| D8 | LLM 프롬프트 | 「이 줄+앞뒤 4줄(≤9줄), 디렉터리 경로·리포명·커밋 메시지·작성자 제외」. **파일 base name 허용** — 첫 줄 `파일 {file.base} {focus}행 근처입니다.` (§6-4 기본값) | base name 은 답 품질을 올리고 경로를 새지 않음 | 04 §2.4 · 05 `AskRung` · 06 §3.3·§3.6 |
| D9 | FSRS 개인화 | MVP 밖. `ts-fsrs` 옵티마이저 확인 뒤 TS 로; Rust `fsrs` 크레이트 안 씀 | 01 금칙어 · 임계 1,000행 = 6주 뒤 | 02 §3.6·체크리스트 14 |
| D10 | 세션 저장 | 02 `session`+`session_item` 정본; 01 `session.save` = 두 테이블 `store_batch`. 블롭 열 없음 — `session_item.state_json`·`session.plan_json` 으로 복구 | 원장이 곧 큐 | 01 §5 · 05 §3 |
| D11 | 05 디자인 8건 | `--yellow-text:#664300` · 상시 애니 3건 유한화(`blink`→정적+「오늘」, `spin`→정지 링, `peek`→2회) · 잠긴 노드 `shake` 제거 · T1 3단계 Tab 유지 · 사다리 `1~4` 는 포커스가 사다리 안일 때만 · 최소 창 1000×680 · 홈 Enter 는 `main` 포커스일 때만 · `--verdict-exact/-equiv/-differ` 신설. 성능 강등은 05 안(윈도잉→판번호 어긋남 끄기→결 op 0), 01 의 「p95>12ms 면 `data-trim` on」 폐기 | 05 정적 대비 40쌍 · 정본 §3-7 | 05 §4·6·7·10 · 01 §8 · §4.3 |
| D12 | 기본값 | 예산 **15분**(10~25) · 새 판 **2장**(상한 4) · 경계 **04:00** · `maxCommits 2000 / maxFileBytes 512 KiB / maxFilesPerCommit 200 / maxFiles 50000 / maxLineBytes 20000` · Linux 부속 기본 **off** · 개인화 1,000행 | 목업 「약 15분·새 판 1」 | 02 §5.1 · 01 §3.1·§8 · 05 §4.3 |
| D13 | 06 열린 질문 | 서명·공증 = 다운로드 500회 또는 「열리지 않아요」 10건 · Windows E2E 는 릴리스 스모크(0.2 재검토) · 크래시 자동 전송 없음 · 마이그레이션 전진 전용+백업 3개 | 06 제안 채택 | 06 §5.4·1.5·8·6.1 |
| D14 | 04 잔여 | T1 `total` = 비공백 줄(목업 20→18) · 원본 AST 캐시 = 02 `block.ast_json` · 소블록 완충 `min(85, 100 − 200/total)`(T1 만; T2 는 85 고정) | 04 열린 질문 2·5·6 | 02 DDL · 04 §4.6 · 05 §11 |

### 4.2 읽으면서 발견한 상충

| # | 쟁점 | 결정 | 근거 | 반영 |
|---|---|---|---|---|
| D15 | 인제스트 이벤트 | 01 이벤트(`ingest_progress/done/error`) 채택 + `ingest_warning{jobId,relPath,reason}` 추가. 03 의 `Channel<IngestEvent>` 폐기 | 01 이 IPC 소유 | 03 §1.8 · 01 §3.2 |
| D16 | 저장소 경로 | 01 레이아웃 정본. 06 의 `src-tauri/`·`src/**`·`dictionaries/`·`src-tauri/migrations/`·`tests/golden/` → `apps/desktop/src-tauri/`·`packages/*`·`dictionary/`·`packages/store-sql/migrations/`·`crates/parse/tests/`. 01 `routes/`→`screens/` | 06 스스로 「이름이 다르면 01」 | 06 전체 · 01 §4 |
| D17 | 사전 파일 배치 | 03: 개념당 `yaml+scm` + `_lang.yaml`, `common/`·`react/`·`arch/`. 01 의 `manifest.yaml`·`concepts.yaml`·`queries/` 폐기. `dict_read{lang}` → `{files:[{relPath,text}]}` | 기여 단위 = 파일 하나 | 01 §3.2·§4·§9 · 06 §7.2 |
| D18 | 캡처 규약 | 03 의 `@site·@pick.N·@hole·@ctx.*·(#set! form)`. `Capture.queryId` = 개념 id; 시스템 쿼리 `_imports`(`@import.source`, form = static/type/dynamic/require)·`_blocks`(`@block.function`·`@block.name`). 01 `concept.<id>` 폐기. `inError` = ERROR 겹침 또는 조상 3단 안 ERROR | matchId 없이는 pick/hole 을 Site 로 못 묶음 | 01 §3.1·§9 · 03 §3.2 |
| D19 | grammar vs lang | `grammar` = tree-sitter 키(`sql`; `sequel` 은 크레이트명), `lang` = 사전 네임스페이스. `LangSpec.lang`→`grammar`, `parse_snippet{grammar}`, 04 `Lang`→`Grammar` | `ts` vs `typescript` 혼선 제거 | 01 §3.1·§9 · 03 §2.1 · 04 §0 |
| D20 | 파일 해시 | blake3 폐기. `file.content_hash` = 워크트리 바이트의 git blob oid, `head_oid` = HEAD 항목, `is_dirty = head_oid IS NULL OR head_oid<>content_hash` | 해시 하나로 증분+dirty | 01 §3.3 · 02 `file` · 03 §1.7 |
| D21 | 커밋 분류·author | Rust 는 `author_email/name`(mailmap 후)·`parent_count`·`subject`·통계 저장. `kind`·`author_matched` 는 TS 판정 → 파생 열. 머지 diff 없음, 리네임 50, 통계는 공백 무시 | 정규식·identity 는 도메인 | 03 §1.2~1.4 · 01 §3.3 · 02 `git_commit` |
| D22 | import·블록 | 원시 테이블 없음 — `_imports`·`_blocks` 캡처 행. TS 파생 `import_edge`·`block` | 삽입 경로 하나 | 02 DDL · 04 §3.1·§7.1 |
| D23 | `concept_site` 열 | 02 열 + `site_key`(UNIQUE) `form shape occurrence excerpt picks_json hole_json ctx_json line_concepts_json uncovered_ratio confidence parse_quality is_dirty is_oversize`. 앞뒤 4줄은 저장 안 하고 카드 생성 때 읽어 `payload_json` 에 굽는다 | 사다리 3단은 excerpt, 프롬프트는 payload | 02 DDL · 03 §3.3 |
| D24 | unknownCount | 03 §3.6 이 공식(자기 제외, `uncoveredRatio>0.5` +1, 3줄↑ +1), 02 `unknown_count` 는 캐시, 재계산은 02(세션 종료 후 증분). 02 §6.1 의 SQL 겹침·예시 숫자 폐기 | 03 이 알고리즘 소유 | 02 §6.1 · 03 §3.6 |
| D25 | 배치·취소·재개 | 500행 tx. `ingest_run.status` 에 `'cancelled'`, 재개 = 다음 `incremental`. 03 `ingest_state`·`partial`·`resumeFrom`·200파일 폐기 | 상태 하나 줄임 | 03 §1.6·1.8 · 02 |
| D26 | 파서 상한 | 타임아웃 2s, 파일 512 KiB, 행 20,000B 초과 스킵, `AstLite` 깊이 512, 파일 50,000, 풀 `min(4, cores−1)`. 06 의 `200_000µs`·1 MB·`num_cpus−1` 폐기 | 01·03 소유 | 06 §4.1 · 03 §2.4 |
| D27 | T1·T2 숙련도 키 | T1 `concept_id` = **대표 개념**(블록 안 `essential` 중 `difficulty` 최고, 동률은 Site 수), 부수 개념은 `card_concept(secondary)` 겹 미반영. T2 = `arch/placement·radius·flow·direction` 4개(`dictionary/arch/`, universal, t2, 전역) | 새 테이블 없이 전역 mastery 유지 | 02 열린 질문 3 · 03 §3.1 · 04 §3.1·§8 |
| D28 | `unit_node` 키 | PK `(unit_id, concept_id, track)` | T0·T1 노드가 같은 개념 가능 | 02 DDL |
| D29 | 대지 탐지 | 어느 문서도 정의 안 함 → 03 §6.5 신설. `source='dir'`: `features/<x>`·`app|pages/<seg>`·`src/<x>` 첫 매치, 없으면 파일 ≥3 인 2단계 디렉터리; `commit-cluster` 는 MVP 밖 | 홈 대지·T2 범위가 걸림 | 03 §6.5 |
| D30 | 원장·파생 보강 | `why_answer` 신설; T2 「이것도 맞다」 = `appeal(track='t2', auto_verdict='wrong-pick')`, 3회 → sec 편입 제안; `appeal` 에 `pattern_key engine_version dict_version norm_original norm_user reasons_json`, 04 `held/proposed` → `open`; `gap.reason` | 테이블 하나에 T1·T2 이의 | 02 DDL · 04 §5·§8.4 |
| D31 | purge | 사실·파생은 지우되 `card` 는 `retired_at`+`snapshot_json` 은퇴. `review_log.card_id NOT NULL` 유지 | 02 원장 규칙 | 01 §7 |
| D32 | 세션 저장 시점 | 05 의 5시점 + T1 초안 400ms 디바운스(flush: tick·blur·Esc·언마운트). 01 「1초 디바운스」·「24h 뒤 finish」 폐기 → `day_key` 바뀌면 `abandoned` | 05·02 소유 | 01 §5 |
| D33 | 요약 「다시 보기」 | 읽기 전용. 05 `session.discard` 폐기 | 원장에 이미 기록 | 05 §3·체크리스트 10 |
| D34 | E2E 분담 | 05 Playwright+`mockIPC` 15건(chromium+webkit, PR 차단) **과** 06 tauri-driver Linux E1~E8(PR 차단, retries 1) 둘 다. 05 「스모크 1개」 폐기. 시각 회귀 = 05 의 40장 | 결정론 층 05, 실 바이너리 06 | 05 §11 · 06 §1.5·1.7 |
| D35 | 성능 수치 | 인제스트 100k 예산 15s·RSS 300 MB, CI 경고 1.5×·실패 2×. 홈 p95 ≤ 12ms. T1 = 04 수치. 06 §1.6 표 교체 | 01·04 소유 | 06 §1.6 |
| D36 | 픽스처·골든 | 06 `.steps` 방식. 이름 `tiny·projectox-like·two-commits·large-100k·poly`. 01 `.bundle`·03 `repo-100k/poly` 폐기. 골든 `fixtures/golden/<lang>/<concept>/`, insta 는 `crates/parse/tests/snapshots/`, IPC 덤프 `fixtures/ipc/<fixture>/`, UI `fixtures/ui/run08.json` | 하나로 | 01 §4 · 03 §7~8 · 05 §11 · 06 §1.2 |
| D37 | 벤치 도구 | `chickadee-cli` 없음. Rust criterion `src-tauri/benches/ingest.rs` + `vitest bench` + `scripts/bench.sh`·`bench/baseline.json`. 01 `bench-ingest.ts` 폐기 | 바이너리 추가 없음 | 01 §8 · 03 §7 |
| D38 | 앱 id·경로·로그 | 01: `dev.chickadee.app`, `chickadee.db`, `logs/` 5×5 MiB, `dict-cache/`, `dict-user/`, 설정은 `settings` 테이블. 06 의 `com.chickadee.app`·`chickadee.sqlite`·`settings.json` 폐기. 로그 리포 식별 = `repoId` | 01 §7 소유 | 06 §3.1·3.4·6.2 |
| D39 | 템플릿·태그 | 03 mustache 부분집합(변수·1단 섹션·부정·`josa`/`code`) 채택, 태그 6종 `code b i em br kbd`. 06 「플레이스홀더 3개」 폐기 | 섹션 없이는 `ctx.fallback` 분기 불가 | 03 §4.3 · 06 §4.2 |
| D40 | Rust 와 YAML | Rust 는 YAML 을 읽지 않는다. 사전 Rust 테스트는 `crates/parse/tests/`(test-only serde_yaml)가 `.scm` 검사 + 예시 캡처를 `fixtures/ipc/dict-examples/` 로 덤프, `pnpm dict:test` 가 Site 로 파생해 `expect` 비교. 금칙어 grep 은 `src/**` 만 | 테스트는 예산 밖 | 03 §5.1 · 01 §1.1 |
| D41 | 스크립트 이름 | `forbid.sh`→`check-rust-budget.sh`, `dict:check`→`dict:lint`, `extract-tokens.ts`→`sync-design.mjs` | 하나씩 | 06 · 01 §4 |
| D42 | `dangerouslySetInnerHTML` | 허용 2파일: `packages/ui/src/RichText.tsx`·`components/dee/DeeSprite.tsx` | 스프라이트 인라인 필요 | 06 §4.3 · 05 §6 |
| D43 | 05 패키지 참조 | `packages/core`·`src/ipc/commands.ts` 폐기 → `@chickadee/grading·scheduler·cards·ipc-client`. UI id 는 `number`, `runId`→`sessionId` | 01 패키지 정본 | 05 §1.2·§3 |
| D44 | 리포 등록 | `repo_register` 는 `discover` 로 루트를 찾아 돌려줌; 커밋 0개면 `fingerprint=''`, 첫 인제스트에서 채움 | 03 §1.1 | 01 §3.2·§7 |
| D45 | 사전 버전 | 개념 파일 `schema: 1`, 언어 버전 `_lang.yaml.version`(semver)+태그 `dict-vX.Y.Z`. 06 의 `schema: 2·dict_version` 예시 폐기 | 03 소유 | 06 §6.2 · 01 §10 |
| D46 | 설정 키 | `Settings` 에 `motion`·`identities[]`·`excludeGlobs` 추가; 05 설정에 「내 커밋 identity」 절 | 03 §1.2·05 §2.1 | 02 §8 · 05 §2.1 |
| D47 | 진행 화면 4단계 | Rust `walk·parse·git·write` → 「git 읽기」「파싱」 2칸, TS `derive·cards` → 「개념 추출」「판 짜기」 2칸. blame 은 배경 | 05 §2.1 | 05 §2.1 |

### 4.2.1 구현 중 발견 (M0~M3)

구현하며 문서와 어긋난 것. §7-2 규칙대로 여기 먼저 올리고 해당 문서를 고쳤다.
D48~D62 는 M0(골격), D63~D71 은 M1(인제스트), D72~D82 는 M2(T0 세션), D83~D93 은 M3(T1 클론 코딩), D94~ 는 M4(T2 구조)에서 나왔다.

| # | 쟁점 | 결정 | 근거 | 반영 |
|---|---|---|---|---|
| D48 | 툴체인 실제 버전 | 기준 스택을 **Node 22+ (개발기 26.7) · pnpm 10 · Rust 1.80+ (개발기 1.98) · tauri-cli 2.11 · SQLite 3.45+ (개발기 3.51)** 로 적는다. CI 는 개발기와 같은 메이저를 쓴다 | 문서 전제(Node 22 · pnpm 9)가 설치본과 다르고, pnpm 10 은 lockfile v9 로 `--frozen-lockfile` 동작이 다르다 | 01 「읽는 순서/전제」 · 06 §5.1 |
| D49 | `StatementMap` 순환 | `packages/ipc-client` 가 **빈 `interface StatementMap`** 을 선언하고, 생성된 `store-sql/src/catalog.ts` 가 **선언 병합**으로 채운다. 01 §3.5 의 `import type … from '@chickadee/store-sql/catalog'` 폐기 | 01 §2 의 의존 방향은 `store-sql → ipc-client` 인데 §3.5 코드는 반대로 import 해 순환이다. 병합은 방향을 지키면서 같은 타입 안전성을 준다 | 01 §2·§3.5 |
| D50 | 시드·토크나이저 위치 | `packages/text` 신설 (의존 0, 최하위). `seedOf`·`fnv1a32`·`mulberry32`·`shuffle`·`tokenize` 가 산다 | 04 §0 의 이 세 가지를 `cards`(생성 결정성)·`grading`(T1 정규식층)·`concepts`(shape 파생) 셋이 모두 쓴다. cards 와 grading 은 형제라 한쪽에 두면 형제 import 가 된다 | 01 §2·§4 · 04 §0 |
| D51 | statement 파일 규약 | 파일 하나에 여러 statement 를 두고 `-- @name <group>.<snake_case>` 로 자른다. `-- @params`·`-- @row`(또는 `void`) 는 그 아래에 붙는다. `scripts/build-catalog.ts` 가 이름 중복·번호 연속·**Rust 필수 이름 12개 존재**를 빌드 때 검사한다 | 01 §4 는 `statements/{facts,repo,home,…}.sql` 처럼 그룹 파일을 그리는데 §3.5 는 이름 분리자를 정하지 않았다 | 01 §3.5 |
| D52 | 토큰 오버라이드 | `sync-design.mjs` 는 목업에서 뽑은 값 위에 **선언된 `OVERRIDES` 표**를 얹는다: `--yellow-text` → `#664300` · `--verdict-*` 신설 · 주간 `--glow-t*` → `transparent` · `--dee-k/-blue/-blue-deep/-pink` 삭제 | D11 이 정한 네 가지가 아직 목업에 반영되지 않았다(「05 · 목업 정리」는 뒤 마일스톤). 표가 없으면 `--check` 가 영구히 빨갛거나, 목업을 지금 고쳐 D11 의 순서를 깬다 | 05 §4.1·§12 |
| D53 | M0 CI 잡 | `ci.yml` 에 `build-3os`(macos-14 · windows-2022 · ubuntu-22.04 에서 `tauri build --debug`) 를 넣는다. `integration`·`design-gates`·`e2e-linux` 는 M1·M2 에서 채울 자리로 남긴다 | M0 의 「끝났다는 증거」 1번이 3-OS 빈 창인데 06 §5.1 의 잡 목록엔 빌드 잡이 없다 | 06 §5.1 |
| D54 | `dayKey` 와 DST | `dayKey` 는 **벽시계 규칙**이다 — `now` 의 로컬 날짜에서, 로컬 시각이 `rollover_hour` 보다 이르면 하루 뺀다. 02 §5.6 의 「`now − rollover_hour·3600e3` 를 존 변환」 표현은 폐기 | 고정 4시간 빼기는 그 창 안에 DST 전이가 있으면 `endOfDay` 와 어긋난다. `America/New_York` `2026-03-08T04:30-04:00` 은 뺄셈식으로 `2026-03-07` 인데 이미 `endOfDay('2026-03-07')`(= `03-08T04:00-04:00`)를 지났다. 벽시계 규칙은 전이가 없는 모든 순간에 뺄셈식과 같고, `endOfDay(d−1) ≤ t < endOfDay(d) ⟺ dayKey(t) = d` 를 유일하게 만족한다 | 02 §5.6 |
| D55 | Black Han Sans woff2 | 상류에 woff2 가 **없다** — `google/fonts/ofl/blackhansans` 는 TTF 만 준다. TTF 를 `ttf2woff2` 로 **컨테이너만** 바꿔 동봉한다(글리프 2,734개 불변, `name` 테이블 불변 → RFN 유효, `DSIG` 만 빠짐 = WOFF2 규격). gstatic 의 한국어 서브셋은 쓰지 않는다. 9파일 합계는 ≈8 MB 가 아니라 **2.0 MB** | 05 §1.4 는 「원본 woff2 를 그대로」인데 원본 woff2 가 존재하지 않는다. 서브셋이 아니므로 OFL 의 RFN 조항(수정본에 예약명 금지)에 걸리지 않는다 | 05 §1.3·§1.4 |
| D56 | 판정 글자 토큰 | `--verdict-exact-text/-equiv-text/-differ-text` 3개를 **신설**한다 (주간 `#960B42`/`#0F3F9E`/`#664300`, 야간 `#FFA3CE`/`#9CC2FF`/`#FFD866` — `--pink-text`/`--blue-text`/`--yellow-text` 와 같은 값). 앱 `tokens.css` 가 6개 전부를 소유하고 `packages/ui` 는 재정의하지 않는다 | D11 의 `--verdict-*` 는 **면**(도장 테두리·거터 틱·`.rtag`) 색인데 `.stamp` 의 **글자**는 종이 위 7:1 이 필요하다. 컴포넌트가 `--pink-text` 를 직접 쓰면 `chickadee/track-alias-only` 에 걸리고, 05 §4.2 의 「판정 색은 트랙 색과 독립」도 깨진다 | 05 §4.1·§4.2 |
| D57 | statement 별칭 금지 | `statements/*.sql` 의 `SELECT` 는 **열 이름을 그대로** 돌려준다 — `AS rootPath` 같은 camelCase 별칭을 붙이지 않는다. `repo.list`·`settings.get_all` 의 별칭을 걷어냈다 | 02 §8.1 은 「Rust 가 열 이름 키로 돌려주고 TS 는 **테이블마다** `fromRow()` 하나로 변환한다」고 정한다. statement 마다 별칭이 다르면 변환기가 테이블당 하나일 수 없다 | 01 §3.4 · 02 §8.1 |
| D58 | `picks_json` 기본값 | `concept_site.picks_json` 의 DEFAULT 를 `'[]'` → `'{}'` 로 고친다 | 02 §8.2 는 `picks: Record<number, string>` 인데 DDL 기본값이 배열이라 서로 어긋난다. 파생 층(M1)이 쓰는 값도 객체다 | 02 §2.2 |
| D59 | `react/` 네임스페이스 (§6-3) | **허용한다.** `dictionary/react/` 를 두고 `_lang.yaml` 에 `framework: react` + 감지 조건(`package.json` 의 `dependencies.react`)을 적는다. 감지 실패한 리포에서는 이 사전을 아예 로드하지 않는다 | 대상 사용자의 코드가 바이브 코딩 산물이면 그 안에서 가장 자주 등장하는 것이 훅·컴포넌트 관습이다. `useState` 를 「함수 호출」로만 보면 「내 코드가 교재」라는 전제가 무너진다. `lang` 은 이미 사전 네임스페이스이지 문법 키가 아니므로(D19) 구조 변경도 없다. 감지 게이트가 있어 비-React 리포를 오염시키지 않는다 | 03 §4.4 · 00 §6-3 |
| D60 | 인제스트 파일 범위 (§6-5) | **`.d.ts` 제외 · SQL 마이그레이션 포함 · 테스트 포함하되 `essential` 집계에서 제외.** 「제외」는 `file` 행조차 만들지 않는 것이고, 「집계 제외」는 `concept_site` 는 만들되 구멍 지도(03 §6)의 `essential` 카운트에 넣지 않는 것이다 | `.d.ts` 는 대개 생성물이거나 남의 타입이라 「내가 쓴 코드」가 아니다. 마이그레이션은 사람이 쓴 SQL 이고 `sql` 이 지원 문법이라 뺄 이유가 없다. 테스트는 사람이 썼으니 사용처로는 valid 하지만, 테스트에만 있는 개념을 「내 앱의 핵심 문법」으로 세면 구멍 지도가 거짓말을 한다 | 03 §1.2·§6 · 00 §6-5 |
| D61 | 표면 언어 | **GitHub 표면은 영어**(커밋 메시지 · PR · `.github/**` 워크플로·템플릿 · `README`/`CONTRIBUTING`/`SECURITY`/`CHANGELOG` · 코드 주석·식별자). **한국어로 남는 것**: 앱 UI 문구·오류 문구·사전 YAML, `docs/**` 설계 6편, `.oculpm/**` 일지·플랜. 루트 `CLAUDE.md` 가 이 규칙을 세션마다 강제한다 | 리포는 MIT 오픈소스로 나간다(정본 §5). 기여자가 처음 보는 표면이 한국어면 기여 표면이 닫힌다 — 사전 YAML 로 언어를 늘리는 커뮤니티 전략과 정면으로 싸운다. 반대로 앱 문구는 한국어 조판 규칙(`keep-all`·`--measure 36em`·조사 헬퍼)이 전제이고, 설계·일지는 유지보수자의 작업 언어다 | `CLAUDE.md` · §7 · 06 §7 |
| D62 | 사람이 읽는 글의 말투 | README · 커밋 메시지 · PR · 이슈 답글 · 릴리스 노트 · 문서 산문에서 **AI 말투를 금지**한다. 금지 낱말(`seamless`·`robust`·`powerful`·`leverage`·`delve`·`혁신적인` …)과 금지 문형(`It's not just X — it's Y` · 근거 없는 최상급 · 3항 나열 습관 · 이모지 제목 · 절마다 요약 문장 · 제목 되풀이)을 루트 `CLAUDE.md` 에 목록으로 둔다. 판정 기준: 「이 문장을 지우면 독자가 잃는 정보가 있나?」 — 없으면 지운다 | 기여자가 처음 보는 글이 내용 없는 홍보문이면 리포의 신뢰가 먼저 깎인다. 이 프로젝트는 「설명은 이미 Claude 가 한다, 없는 것은 강제된 능동 출력」이라고 주장하는 제품이라(정본 §1) 자기 문서가 공허하면 주장과 정면으로 싸운다 | `CLAUDE.md` · §7 |
| D63 | 인계 프롬프트를 파일로 | 마일스톤마다 `docs/handoff/<milestone>.md` 하나. 다음 세션에 **그대로 붙여 넣는** 프롬프트이며, 끝난 마일스톤 파일도 지우지 않는다. 마일스톤을 끝낸 세션이 다음 파일을 쓴다 | 인계를 대화에 남기면 사라진다. 다음 세션은 앞 세션이 무엇을 정했는지·어디에 지뢰를 남겼는지 모른 채 시작한다 — M0 에서 실제로 나온 것들(빈 `crates/*` 디렉터리가 cargo 를 통째로 깨뜨림 · `git2 < 0.21` 이 CI 를 빨갛게 함 · 이미 있는 패키지를 다시 만들려 듦)은 문서를 읽어서는 알 수 없고 겪어야만 아는 것들이다 | `docs/handoff/README.md` · §7 |
| D64 | Rust 하위 예산 재배분 · `git_diff_text` 이관 | 01 §4 의 크레이트별 상한을 `git ≤ 400` · `parse ≤ 400` · `store ≤ 350` · **`app ≤ 500`** 으로 다시 나눈다. 합계 상한 1500 은 그대로다(정본 §5 「500~1500줄」). 함께: `git_diff_text` 명령과 `crates/git` 의 diff 본문 읽기를 **M4** 로 옮긴다 | 01 §4 는 앱을 300줄로 잡았는데, 잡 러너 하나가 워킹트리 순회·해시 증분·파서 풀·500행 tx·진행 이벤트·취소를 전부 들고 있어 그 안에 들어가지 않는다. 상한을 지키는 방법은 두 가지뿐이고(총량을 늘리거나, 앱에서 뺄 것을 빼거나) 총량은 정본이 정한 값이라 건드리지 않는다. `git_diff_text` 는 읽는 쪽이 T2 뿐이라 지금 있어야 할 이유가 없다 | 01 §1.1·§3.2·§4 |
| D65 | 리포 장부는 TS 가 | `repo_register`·`repo_list`·`repo_relocate`·`repo_remove`·`repo_glob_read` 5개를 **폐기**하고 Rust 는 `repo_probe { path } → { rootPath, fingerprint, headCommit }` 하나만 갖는다. 등록·목록·이동·삭제는 `packages/concepts/src/repos.ts` 가 `repo_probe` + `repo.*` statement 로 조립한다. `IngestSpec` 에 `rootPath` 를 더해 잡 러너가 경로를 SQL 로 되찾지 않게 한다. `repo.*` 4개는 「Rust 가 요구하는 카탈로그 이름」에서 빠지고 `facts.*` 8개만 남는다 | 다섯 명령의 내용은 SELECT·INSERT·UPDATE 와 상태 판정이다. 정본 §5 가 「두꺼운 TypeScript」에 넘긴 것이 정확히 그 종류이고, 남는 것(`Repository::discover` 와 fingerprint)만 파일 시스템을 필요로 한다. `repo_glob_read` 는 「선택의 왜」(ocul-pm 일지 연동)의 부품인데 그 기능이 M6 이라 지금 표면을 열 이유가 없다 | 01 §3.2·§3.3·§3.5 · 02 §8.1 |
| D66 | 번들 사전은 JS 번들에 | `dict_list`·`dict_read`·`dict_cache_read`·`dict_cache_write` 4개를 **폐기**한다. 번들 사전은 Vite 가 빌드 때 `import.meta.glob('../../dictionary/**', { query: '?raw', eager: true })` 로 JS 에 굽고 `packages/dictionary` 가 그 맵을 읽는다. `tauri.conf.json` 의 `bundle.resources` 도 함께 뺀다. 사용자 오버라이드 `dict-user/` 와 디스크 캐시 `dict-cache/` 는 **M5** 로 미루고, 그때 Tauri `fs` 플러그인을 `$APPDATA` 스코프로 연다 | 00 §6-6 이 이미 「MVP 는 번들만」으로 정했으므로 MVP 에 남는 경로는 읽기 전용 번들 하나뿐이다. 그것을 굳이 Rust 명령으로 돌리면 파일 4종을 읽는 코드 · 리소스 경로 해석 · 오류 코드가 예산에서 나가는데, 얻는 것이 없다. 번들에 구우면 사전이 타입 검사·트리 셰이킹·해시의 대상이 되고 「리소스 경로가 빌드마다 어긋난다」는 M0 의 실패 자리도 사라진다 | 01 §3.2·§4·§7 · 00 §6-6 · 03 §5.3 |
| D67 | `parse_snippet` 은 M3 에 | 명령 `parse_snippet` 을 **M3**(T1 AST 승격)로 옮긴다. `crates/parse` 의 `ast()` 는 M1 에 있고 깊이 512·바이트 상한 테스트도 M1 에 있다 — 명령 표면만 미룬다 | 읽는 쪽이 `packages/grading` 의 T1 AST 층(04 §4)뿐이고 그것이 M3 이다. M1 에서 이 명령이 하는 일은 예산을 쓰는 것뿐이다 | 01 §3.2 · 06 §4.1 |
| D68 | Rust 줄 예산 2,300 (사용자 결정) | 합계 상한을 **2,300** 으로 올린다. 정본 §5 의 「500~1500줄」·01 §1.1 의 1500·게이트 기본값(잠정 2100)을 모두 이 값으로 고친다. 01 §4 의 크레이트별 상한도 다시 나눈다 — `git ≤ 460` · `parse ≤ 400` · `store ≤ 360` · `app ≤ 1080`, 넷을 더하면 정확히 2,300 이다 | M1 실측: `git 383` + `parse 358` + `store 343` + `app 959` = **2,043**. 남은 마일스톤이 더할 양은 `parse_snippet` M3 ~25 · `git_diff_text` M4 ~67 · `dict_*` M5 ~65 · `repo_glob_read` M6 ~30 → MVP 예상 ~2,230 이고 상한까지 70줄이 남는다. 1,500 에 맞추는 길은 인제스트 자체를 빼는 것뿐이었다 — D64~D67 로 명령 10개를 TS·다음 마일스톤으로 이미 덜어낸 뒤에도 잡 러너 하나가 순회·필터·해시 증분·파서 풀·500행 tx·진행 이벤트·취소를 들고 463줄이다. **줄 수는 대리 지표였다.** 실제 방벽인 도메인 어휘 금지·SQL 리터럴 금지·git 바이너리 금지·`1 크레이트 = 1 래핑`·`forbid(unsafe_code)`·`clippy::pedantic` 은 그대로 초록이고, Rust 는 여전히 개념·판·겹·세션을 모른다 | 정본 §5 · 01 §1.1·§4 · 00 §1·§5 · `scripts/check-rust-budget.sh` · `README.md` · `CLAUDE.md` |
| D69 | 사전 스키마는 zod 가 정본 | `packages/dictionary/src/schema.ts` 의 zod 가 정본이고 `dictionary/schema/concept.schema.json` 은 **거기서 생성**한다(`pnpm dict:schema`, 어긋나면 테스트가 실패). 03 §5.1 의 「JSON Schema 가 정본, TS 타입은 `json-schema-to-typescript` 로 생성」은 방향이 뒤집혔다. 함께: 템플릿 필터 **연쇄를 허용**한다(`{{pick.1|code|josa:이,가}}`) | 앱이 실제로 검증에 쓰는 것은 zod 이고(01 §2 「검증된 `Dict`(zod)」), 생성 방향을 반대로 잡으면 앱이 쓰는 코드가 생성물이 되어 오류 메시지·기본값·`.strict()` 를 손댈 수 없다. 기여자가 읽는 계약은 JSON Schema 로 남되 사람이 두 벌을 맞추지 않게 한쪽에서 뽑는다. 필터 연쇄는 조사 규칙 때문에 필요하다 — `<code>` 로 감싸면서 조사를 고르려면 두 필터가 한 변수에 걸려야 한다 | 03 §4.3·§5.1 |
| D70 | `site_key` 는 sha1 이 아니다 | `concept_site.site_key` = **FNV-1a 32비트 두 벌**(접두어를 달리해 64비트, 16자리 hex). 02 DDL 주석과 03 §3.3 의 「sha1」 표기를 고친다 | 웹뷰의 `crypto.subtle` 은 비동기라 사용처 5만 건에 프로미스 5만 개가 생긴다. 이 값에 필요한 성질은 **줄 번호와 무관한 안정성**과 충돌 회피뿐이고(03 §1.6), 리포 하나의 5만 건에서 64비트 충돌 확률은 1e-10 수준이다. 암호학적 강도는 어디에도 쓰이지 않는다 | 02 §2.2 · 03 §3.3 |
| D71 | `concepts` 는 명령을 부른다 | ESLint 의존 방향 표에서 `concepts` 의 허용 목록에 `ipc-client` 를 더한다 | 01 §3.3 이 「`ingest_done` 을 받으면 `packages/concepts.derive(repoId)` 가 `derive.captures_by_file` 로 읽어…」라고 적고 03 §1.5 가 「`blame.ts` 가 `git_blame_lines` 를 배경에서 호출」이라고 적는데, 01 §2 표의 「의존」 열에는 그 줄이 없었다. 표를 문장에 맞춘다 | `eslint.config.js` · 01 §2 |
| D72 | 의존 표 보강 3건 (M2) | ESLint 의존 방향 표에 **`cards → dictionary`** · **`scheduler → concepts`** · **`grading → store-sql`** 를 더한다 | 셋 다 01 §2 표의 「의존」 열이 같은 문서·이웃 문서의 문장과 어긋난 자리다(D71 과 같은 형태). ① 04 §1 은 T0 생성기의 입력이 「**사전 항목** + `Site[]` + `layerOf`」라고 적는데 표에는 `cards → dictionary` 가 없다 — 카드 문구·보기·진단이 전부 사전 YAML 에서 나오므로 이 줄 없이는 생성기가 성립하지 않는다. ② 02 §5.3 `planSession()` 이 본문에서 `rankNewConcepts(repo, known)` 를 부르고 §6.1·§6.2 가 `loadKnownSet`·`topoOrder` 를 쓰는데 그 셋은 `concepts` 에 산다. ③ `gradeT0` 가 만드는 `ReviewDetail`·`Layer`·`ConceptId` 는 02 §8.2 타입이고 그 소유자가 `store-sql` 이다. 순환은 생기지 않는다 — `dictionary`·`store-sql`·`concepts` 중 누구도 `cards`·`scheduler`·`grading` 을 모른다. **카드 생성은 여전히 주입 포트다**: `planSession` 은 `cards` 를 import 하지 않고 `getOrGenerateCard` 를 인자로 받는다 | `eslint.config.js` · 01 §2 |
| D73 | FSRS 어댑터 구성 (ts-fsrs 5.4.2) | `ts-fsrs@5.4.2` 를 `enable_short_term: true` + **`learning_steps: []` · `relearning_steps: []`** · `enable_fuzz: false` 로 쓰고, `scheduler_params` 의 19개 FSRS-5 파라미터에 `[0, 0.5]` 를 붙여 21개로 넘긴다(`migrateParameters` 가 내놓는 것과 같은 값 — `w[20] = 0.5` 가 FSRS-5 의 decay 다). 02 §3.5 궤적 표의 「3.8일」을 **「3.4일」** 로 고친다 | 라이브러리 기본값(`enable_short_term:true` + 학습 단계 `1m·10m`)은 하루 한 세션인 이 앱에서 판을 6분 뒤에 다시 걸어 버린다. 그렇다고 `enable_short_term:false` 로 끄면 **같은 날 공식이 통째로 빠져** 02 §4 가 요구하는 「다시 찍기 정답 ×1.41 · 오답 ×0.5」가 사라진다(실측: S 가 한 자리도 안 움직인다). 단계 목록만 비우면 둘 다 얻는다 — 실측 ×1.39 · ×0.495. 궤적은 `Hard → Good → Good → Good` 를 **만기 당일에** 찍었을 때 **1.18 → 3.45 → 9.42 → 25.24**(간격 1·3·9·25일)다. 문서의 S 열(1.18·3.8·11·30)은 복습을 연속값 `t = S` 로 놓고 손으로 푼 값인데 실제로는 `due_at` 이 **정수 일**이라 언제나 S 보다 조금 이르게 찍힌다 — R 이 0.9 보다 높으니 S′ 가 덜 오른다. 재미있게도 이 실측 간격(1·3·9)이 같은 표의 **라벨 열**(내일·3일 뒤·9일 뒤)과 맞는다. 두 열이 서로 다른 전제로 계산돼 있었던 것이고, 실측 쪽으로 통일한다. 4겹만 25일이라 라벨이 「3주 뒤」에서 **「4주 뒤」**로 바뀐다(`labelFor` 가 `round(25/7)` 을 쓴다) | 02 §3.5·§3.6·§4 · `packages/scheduler` |
| D74 | 카드 문구는 **생성 시점에** 렌더한다 | 사전 템플릿(03 §4.3 mustache 부분집합 · `josa`·`code` 필터)은 **T0 생성기가** 풀어서 `payload_json` 에 최종 문자열로 굽는다. 04 §0 의 「엔진은 템플릿 + 변수 묶음(`vars`)만 넘기고 05 의 렌더러가 치환한다」는 **생성기 안의 단계 구분**으로 읽고, `CardPayload` 에 `vars` 를 더하지 않는다. 렌더러는 `packages/text/src/template.ts` 에 둔다 | 02 §8.2 가 `CardPayload` 의 소유자이고 그 절 마지막 문단이 「`Card.payload` 의 필드명은 목업 `data.js` 의 `CARDS` 키를 그대로 따라 05 문서가 **그대로 렌더**할 수 있게 한다」고 못박는다 — 목업의 `CARDS` 값은 전부 최종 문자열이다. 늦게 치환하면 (a) 골든이 비교할 것이 템플릿뿐이라 「조사가 틀렸다」를 못 잡고 (b) 같은 치환기를 판·사다리·요약 세 화면이 각자 부르게 되며 (c) 카드 재생성 계약(`gen:{seed,dictVersion,attempt,siteId}` 로 **같은 카드**를 다시 만든다)이 사전 판본과 무관해진다. `text` 에 두는 이유는 D50 과 같다 — `cards` 가 굽고 `ui` 가 같은 `josa` 규칙을 화면 문구에 쓰므로 형제 import 가 되지 않게 최하위에 둔다 | 02 §8.2 · 04 §0 · `packages/text` |
| D75 | 새 개념 순위는 위상 **깊이**로 (02 §6.2) | `rankNewConcepts` 의 첫 정렬 키를 `topoOrder` 의 순번이 아니라 **선행 깊이**(후보 집합 안에서 뿌리로부터의 최장 거리)로 바꾼다. `packages/concepts/src/new-rank.ts` 의 `prereqDepth` 가 그것이고 `topoOrder` 는 그대로 남는다 | 02 §6.2 의 정렬은 `order.get(a) − order.get(b) || 미지 || 사용 횟수 || id` 인데 `topoOrder` 는 **전순서**를 돌려준다 — 두 개념의 순번이 같은 일이 없으므로 뒤의 세 기준이 **한 번도 실행되지 않는다**. 실제로 테스트에서 「미지 0 짜리를 두고 미지 2 짜리가 먼저 나오는」 결과가 나왔다. 깊이로 바꾸면 형제(같은 깊이)들 사이를 문서가 적어 둔 세 기준이 가른다. 위상 관계 자체는 그대로 지켜진다 — 선행의 깊이는 언제나 자식보다 작다 | 02 §6.2 · `packages/concepts/src/new-rank.ts` |
| D76 | LIFER 행과 **의식**은 다른 조건이다 | `lifer` 행은 **개념 첫 성공이면 언제나** 쓴다(다시 찍기·아래층에서 맞혀도). 연출(`LiferVeil`)은 `첫 성공 && role 이 retry·prereq 가 아님 && session.lifer_shown < 3` 일 때만 띄우고, 나머지는 `shown_at = NULL` 로 두어 **요약에서** 보여준다 | 02 §3.3 R5 는 「오답·모르겠어요 뒤 다시 찍기에서 맞혀도 첫 겹은 찍힌다(LIFER)」이고 04 §2.2 는 LIFER 조건을 `correct && fresh && !retry` 로 적어 정면으로 부딪히는 것처럼 보인다. 02 §4 의 괄호(「세션 3회 상한; 넘거나 **아래층·다시 찍기 판이면** `shown_at=NULL` → 요약에서」)가 답이다 — 04 가 말한 것은 **연출** 조건이고 02 가 말한 것은 **행** 조건이다. 두 이름을 갈라 두지 않으면 다시 찍기로 처음 맞힌 개념의 일련번호가 영영 안 찍힌다 | 02 §3.3·§4 · 04 §2.2 |
| D77 | 「판 완료」 tx 안에서 잇는 UPDATE 를 로그 바로 뒤로 (02 §8.1) | 쓰기 순서를 `review_log INSERT → session_item UPDATE → dunno_event UPDATE → mastery UPSERT → lifer INSERT` 로 바꾼다. 두 UPDATE 는 `:reviewLogId` 대신 **`last_insert_rowid()`** 를 쓴다(`session.item_link_last`·`review.dunno_link_last`; id 를 이미 아는 경로용으로 `session.item_link_log`·`review.dunno_link_log` 도 남긴다) | 02 §8.1 은 `review_log → mastery → session_item → lifer → dunno_event` 를 **한 tx** 로 요구하는데, `store_batch` 는 op 를 **미리 만들어** 보내므로 batch 중간에 생긴 `review_log.id` 를 TS 가 알 방법이 없다. 나눠서 두 번 부르면 tx 가 둘이 되어 그 사이의 크래시가 잇지 못한 로그 행을 남긴다. SQL 안에서 `last_insert_rowid()` 로 집으면 한 tx 가 지켜지지만 그 값은 **다음 INSERT 가 성공하면 바뀐다** — `mastery` 는 UPSERT 라 INSERT 경로를 탈 수 있고 `lifer` 도 INSERT 다. 그래서 두 UPDATE 를 그 앞으로 옮긴다. 의미상의 순서(로그가 먼저, `applied_log_id` 가 커서)는 그대로이고 자리가 바뀐 둘은 서로 독립이다 | 02 §8.1 · `packages/store-sql/src/tx.ts` |
| D78 | 「모르겠어요」도 **하루 한 겹** (02 §3.3 R4) | 같은 날 두 번째 「모르겠어요」는 겹을 더 내리지 않는다. `applyOutcome` 의 R4 를 `layer = max(day_start_layer − 1, layer − 1)` 로 바꾼다 | 02 §3.3 의 의사코드는 `layer = max(0, layer − 1)` 이라 같은 개념의 판을 하루에 두 번 만나 둘 다 「모르겠어요」를 누르면 두 겹이 내려간다. 06 §1.3 의 스케줄러 property (c) 는 **「두 번 눌러도 더 안 내림」**을 명시적으로 요구하고, fast-check 가 두 번째 시도에서 반례 `[2,2]` 를 찾았다. 두 문서 중 06 이 맞다 — R1 이 「+1 은 하루 한 번」인데 −1 만 무제한이면 대칭이 깨지고, 무엇보다 「모르겠어요는 벌이 아니라 공정」(정본 §3-1)이 거짓말이 된다. 사다리를 두 번 연 사람이 더 손해를 보면 아무도 두 번 열지 않는다 | 02 §3.3 · 06 §1.3 · `packages/scheduler/src/reducer.ts` |
| D79 | 로그의 오류 코드는 `errorCode` | 로그 필드 이름을 `code` → **`errorCode`** 로 바꾼다. 금칙어 목록의 `code` 는 그대로 둔다 | 01 §6 은 「오류 코드」를 **허용** 필드로 적어 두는데, 금칙어 목록의 `code`(소스 코드 조각을 막으려던 것)와 이름이 같아 실제로는 언제나 `[redacted]` 로 나갔다. M2 의 WKWebView 실측에서 인제스트가 조용히 실패했을 때 로그에 남은 것이 `리포 읽기 실패 ([redacted])` 뿐이라 원인을 못 봤다 — 두 번째 실행에서야 오류 메시지를 따로 실어 알아냈다. 함께: `report()` 가 `message` 도 남긴다(절대 경로는 로거가 줄인다) — 코드만으로는 IPC 밖에서 난 오류가 전부 `UNKNOWN` 한 줄이 된다 | 01 §6 · `packages/ipc-client/src/logger.ts` · `apps/desktop/src/flow.ts` |
| D80 | WKWebView 프레임 실측 — **예산 초과** | 05 §10 의 홈 프레임 p95 예산 **12 ms** 에 대해 실측은 **18 ms**(warm, 178프레임 · 노드 384개)다. 나머지는 통과: `home:paint` 106 ms(예산 400) · `session:mount` 4 ms(50) · `t0:grade` < 1 ms(30) · `theme:switch` 48 ms(100) · `lifer:open` 13 ms(50). `t1:monaco`(250)는 M3 가 계측한다. **첫 실행은 blame 2차 패스가 배경에서 도는 동안 33~38 ms 까지 오른다** — 위 18 ms 는 인제스트가 끝난 뒤(warm)다. **정본 §6 의 「WebKit 미측정」은 실측 문구로 바뀌었다**(§4.3 · 사용자 승인 2026-09-03) | 재는 자를 앱 안에 두고(`VITE_PERF=1` 하네스) 릴리스 빌드를 격리된 데이터 디렉터리로 띄워 쟀다. 노드가 49개가 아니라 **384개**(대지 18장)라 같은 조건이 아니고, WebKit 이 Chromium 보다 느린 것까지 겹친다. 05 §10 은 이 경우의 강등 사다리(윈도잉 → 판번호 어긋남 끄기 → 결 op 0)를 이미 갖고 있으므로 규칙을 고칠 것이 아니라 그 사다리를 밟을 일이다 — 어느 단인지는 D81 이 재서 정했다. 정본 §6 의 그 문장은 **사용자 승인(2026-09-03)으로 실측 문구로 바뀌었다** — §4.3 참조 | 05 §10 · 정본 §6 · `apps/desktop/src/devtools/` |
| D81 | 프레임 예산 초과의 답은 **윈도잉**이다 (05 §10) | 05 §10 강등 사다리의 아래 두 단(판번호 어긋남 끄기 · 결 op 0)은 **효과가 없다** — 「부속 숨김」으로 둘을 한꺼번에 껐을 때 `frame_p95` 가 21 → **18 ms** 로 3 ms 만 줄었고 예산 12 ms 는 그대로 넘는다. 남은 것은 첫 단인 **윈도잉**이며, 그것을 M4 의 `m4-05-dependency-map`(같은 SVG 렌더 문제를 다루는 자리) 앞에 붙인다. M3 은 T1 이라 홈을 건드리지 않는다 | 재 보니 병목이 장식층이 아니라 **노드 수**다. 이 리포의 홈은 스티커 384개이고 각각이 판 변수로 칠해지는 인라인 SVG(`<use>`)다 — 정본 §6 이 확인했다는 49노드의 8배다. 장식을 다 꺼도 SVG 384개의 스타일 재계산은 그대로 남으므로 아래 두 단으로는 닿지 않는다. 반대로 화면에 보이는 대지만 그리면(윈도잉) 노드 수가 한 자릿수 대지분으로 줄어 문제 자체가 사라진다. **부속 숨김을 기본으로 켜는 안은 버린다** — 3 ms 를 얻자고 정본 §6 의 시각(등록표시·기울기·질감)을 통째로 끄는 것은 값이 안 맞고, 그 시각은 사용자 결정이다 | 05 §10 · 정본 §6 · `m4-05-dependency-map` |
| D82 | 사전의 `josa` 는 **값을 먼저 낸다** — 린트로 강제 | `{{x|josa:은,는}}` 은 조사만 낸다(D69). 값은 앞에서 `{{x}}` 나 `{{x|code}}` 로 따로 내야 하고, 안 내면 린트 `josa-without-value` 가 잡는다. 어긴 6곳(`array-map-immutable` · `array-method-chain`×2 · `array-push-mutate` · `for-of`×2)과 `_lang.yaml.diag_default` 의 하드코딩 조사(`«{{pick}}» 은`), `t0-point.ts` 의 폴백 문장을 함께 고쳤다 | 렌더러가 값까지 내면 185곳이 「res.userres.user 은」이 된다 — 다수 관행이 옳고 소수 6곳이 틀렸다. 고치는 것보다 **다시 못 하게 막는 것**이 중요해서 규칙을 넣었다: 03 §4.3 은 「변수 뒤 조사 금지」만 적고 그 반대 실수(조사만 내고 명사를 빠뜨리는 것)는 적지 않았는데, 화면에서는 「이 돌려준 것」처럼 뜻이 통째로 사라진다. `_lang.yaml` 은 원래 린트가 보지도 않았다 | 03 §4.3 · `packages/dictionary/src/lint.ts` · `dictionary/**` |
| D83 | T1 진급 문턱은 **`advanceThreshold(total)`** 이고 `ok`·겹·단계가 같은 값을 쓴다 | `packages/scheduler` 의 `gradeFor`·`okFor` 에 선택 인자 **`passPct`** 와 **`swap`** 을 더한다. T1 은 `passPct = max(65, min(85, round(100 − 200/total)))`(04 §4.6 을 **정수로 반올림**하고 하한을 65 로 잡은 것)을 넘기고, `swap` 행이 하나라도 있으면 pct 와 무관하게 불합격이다. `PASS_PCT` 상수(85)는 기본값으로 남고 T0·T2 는 그대로다 | 04 §4.6 은 소블록 완충을 「판정(다음 단계)」에만 적어 두었는데 `okFor` 는 **평 85** 였다. 그러면 12줄 블록의 10/12(83.3 %)가 04 기준으로는 `advance` 인데 원장에는 `ok=0` 으로 적히고 겹이 안 오른다 — 같은 답안을 두 규칙이 다르게 읽는다. 정본 §5 는 「진급 85(20줄 미만 소블록은 `min(85, 100−200/total)`)」라고 문턱 **하나**를 말하므로 셋을 그 하나에 맞췄다. 반올림과 하한이 붙은 이유는 실측이다 — 12줄 블록의 10/12 는 정확히 83.333…이고 `pct` 는 `round` 라 83 이 되어 실수 문턱 83.333 을 **못 넘는다**(공식이 허락한 「두 줄」이 반올림에서 사라진다). 하한 65 가 없으면 3줄 블록의 문턱이 33 이 되어 40 %가 「합격」이면서 동시에 「같은 단계를 한 번 더」가 된다. `swap` 을 여기 넣는 이유도 같다 — 04 §4.6 이 「인자 순서 오류는 뜻이 바뀐 코드다」라며 advance 를 막는데, 그것이 겹은 올려 준다면 그 문장이 거짓이 된다 | 02 §3.2 · 04 §4.6 · `packages/scheduler/src/fsrs.ts` |
| D84 | `appeal`·`why_answer` 는 「판 완료」 tx 의 **끝**에 붙고 `review_log.id` 를 **부속질의**로 집는다 | 쓰기 순서는 `review_log INSERT → session_item UPDATE → dunno_event UPDATE → mastery UPSERT → lifer INSERT → why_answer INSERT → appeal INSERT×n` 이다. 뒤의 둘은 `last_insert_rowid()` 대신 `(SELECT id FROM review_log WHERE session_item_id = :sessionItemId ORDER BY id DESC LIMIT 1)` 을 쓴다 | D77 이 쓴 `last_insert_rowid()` 는 **직전 INSERT 하나**만 집는다. 이의는 0~n 행이라 두 번째 `appeal` INSERT 는 첫 번째 `appeal` 의 id 를 review_log 로 착각한다(`lifer` 가 앞에 있으면 첫 번째부터 틀린다). 부속질의는 자리에 기대지 않아 op 를 몇 개 붙여도 안전하고, `session_item` 하나에 `review_log` 는 하나뿐이므로(판을 한 번 마친다) 값이 유일하다. 뒤에 붙이는 이유는 D77 의 두 UPDATE 를 밀어내지 않기 위해서다 | 02 §8.1 · `packages/store-sql/src/tx.ts` |
| D85 | `ReviewDetail.t1.stageBefore` 는 **채점한 단계**다 | 「한 단계 쉽게」를 누른 뒤 채점하면 `stageBefore` 는 판을 걸 때의 단계가 아니라 **실제로 채점한** 단계를 적는다. 판을 걸 때의 단계는 `stageBefore + (downgraded ? 1 : 0)` 로 읽는다 | `packages/scheduler/src/rebuild.ts` 의 `ceilingCapOf` 가 4겹 상한을 `detail.stageBefore === 3` 으로 판정하고 `finishPlate` 는 같은 판정을 `input.stage` 로 한다. 둘이 다른 값을 뜻하면 3단계에서 「한 단계 쉽게」를 누른 판에서 **재생과 캐시가 갈라진다**(M2 의 검산 `rebuild_mastery == mastery` 가 깨진다). 「내린 것을 기록한다」는 `downgraded` 가 이미 하고 있으므로 단계 필드는 채점한 단계 하나만 뜻하게 했다 | 02 §8.2 · `packages/scheduler/src/rebuild.ts` |
| D86 | T1 은 **`packages/cards` 가 굽고 `packages/grading` 이 잰다** | 블록 선정·분절·2단계 마스크·스펙 카드·왜 게이트 문항은 `packages/cards`(카드 생성), 정렬·정규화·AST 승격·점수·이의·왜 검증은 `packages/grading`(채점)이다. 새 의존은 없다 | 04 §3(블록·마스크)과 §6(왜 게이트 문항 선정)이 「채점 엔진」 문서에 있어 `grading` 의 몫으로 읽히지만, 그 셋의 출력은 전부 `CardPayload` 의 t1 변형(`original`·`show2`·`why`)이고 그것은 **생성 시점에 굽는다**(D74). `grading` 에 두면 카드가 없는데 카드 내용을 만드는 패키지가 생기고, 골든(04 §9)이 비교할 것이 payload 가 아니라 함수 호출이 된다 | 04 §3·§6 · 01 §2 |
| D87 | 답안 파싱은 **`parse_snippet(grammar, text, queries?)`** — 인자를 낱개로 받는다 | `ingest_start` 만 구조체 하나를 받고 나머지는 낱개다(M2 지뢰). `parse_snippet` 도 낱개이며 `queries` 를 안 주면 캡처를 돌리지 않는다(파싱 1회). 출력은 `{ ast, captures, hadError }` 이고 `hadError` 는 `ERROR` 노드 유무다 — **비율**(04 §4.5 의 ≤ 20 % 게이트)은 TS 가 `ast` 에서 센다. 상한은 `file_read_block` 과 같은 64 KiB | 01 §3.2 는 입력을 `{ grammar, text, queries? }` 로 적었지만 그것이 **구조체 하나**인지 낱개인지 말하지 않는다. M2 에서 `ingest_start` 가 정확히 그 모호함으로 실제 앱에서만 깨졌다(테스트는 전부 초록이었다). 비율을 Rust 에서 세지 않는 이유는 D68 예산이고, 세는 데 필요한 것(`ast`)이 이미 넘어간다 | 01 §3.2 · `apps/desktop/src-tauri/src/commands/repo.rs` |
| D88 | 홈의 「이 판 찍기」·「판 만들기」와 초보 안내는 **M3 이 먼저** 붙인다 | M2 가 흘려보낸 두 자리를 T1 앞에 끼운다: `role='manual'|'gap'` 삽입 경로 배선(02 §5.5 마지막 문단)과 홈 상단의 초보 안내 한 줄(02 §6.4). 아무것도 잠그지 않는다. 구현하며 갈린 것 셋: ① 02 §5.5 의 「없으면 **새 세션의 0번**」은 **세션을 정상 큐로 먼저 열고 그 앞 `pos:0` 에 얹는** 순서로 읽는다 — 큐를 직접 짜면 만기 복습이 오늘 통째로 빠진다(세션을 여는 유일한 문이 `planSession` 이다). 큐가 비어 세션이 안 열리면 카드만 만들고 「큐에 넣지는 못했습니다」로 안내한다 ② 02 §6.4 는 `confirmed` 만 말하지만 안내는 **`suspect` 에도** 보인다(사유 문장만 다르다) — 잠그는 것이 없으므로 이르게 보이는 쪽의 손해가 없다 ③ 자료 링크(생활코딩·CS50)는 **주소 글자**로만 보인다: 외부 링크를 여는 문이 `@chickadee/ipc-client` 에 아직 없다(05 §2.1 은 `plugin-opener` 를 요구한다) | 「판이 없는 문법」 패널의 버튼이 토스트만 내고 있어 **할 것처럼 보이면서 아무 일도 안 한다**. 그리고 `insertPlate` 의 `manual`·`gap` 갈래는 테스트가 0건이라 한 번도 돌아 본 적이 없다 — T1 이 같은 함수를 쓰기 전에 한 번은 돌려 봐야 한다 | 02 §5.5·§6.4 · `apps/desktop/src/screens/home/` |
| D89 | 이의의 정규화 카탈로그는 **토글 5개로 시작**한다 | 04 §5 가 「…」으로 열어 둔 카탈로그를 `TRAILING_COMMA_ARGS` · `ARROW_BODY_BRACES` · `OPTIONAL_PARENS_RETURN` · `SELF_CLOSING_JSX` · `QUOTE_IN_JSX_ATTR` 다섯으로 못박고, 각 항목이 **어느 사유 코드를 동등으로 승격하는지**를 표로 둔다. 기본 전부 꺼짐 | 카탈로그가 이름 목록뿐이면 「제안」이 무엇을 켜자는 것인지 코드가 모른다 — 사유 코드와의 대응이 없으면 `patternKey` 3건이 모여도 화면이 낼 말이 없다. 다섯으로 닫는 이유는 04 §5 가 「불만의 80 % 는 규칙 5개」라고 적어 둔 그 다섯이기 때문이고, 늘리는 표면은 이의(`appeal`)와 이슈 템플릿이다 | 04 §5 · `packages/grading/src/t1-appeal.ts` |
| D90 | 의존 표 보강 — **`grading → scheduler`** | ESLint 의존 방향 표에 `grading → scheduler` 를 더한다. 04 §4.6 의 T1 판정이 02 §3.2 의 문턱 상수(`PASS_PCT` 85 · `RETRY_PCT` 65)와 소블록 완충값(`advanceThreshold`)을 쓴다 | 문턱은 02 §3.2 소유이고 판정은 04 §4.6 소유다 — 둘을 잇지 않으면 같은 숫자가 두 패키지에 복사된다. 순환은 없다: `scheduler` 는 `grading` 을 모르고, 판정을 부르는 것은 언제나 화면·흐름 쪽이다. `advanceThreshold` 를 `grading` 이 아니라 `scheduler` 에 둔 이유는 그것이 `PASS_PCT` 를 **깎는** 함수라 상수 옆에 있어야 두 값이 같이 움직이기 때문이다. 하한을 `RETRY_PCT` 로 둔 것도 여기다(D83) | `eslint.config.js` · 01 §2 · `packages/scheduler/src/fsrs.ts` |
| D91 | 짝 없는 줄이 **같은 자리**에 마주 보면 강제로 짝짓는다 | 04 §4.1 의 A·B·C 뒤에 한 걸음 더 둔다: 원본 `i` 가 `missing` 이고 답안 `i` 가 `extra` 면 닮음을 묻지 않고 짝지어 정규식층에 넘긴다. 문서·목업에 없는 단계다 | 04 §9 #28(`let v = Vec::new();` / `let v = vec![];`)의 Dice 가 **0.44** 라 §4.1 의 문턱 0.5 를 못 넘어 「누락 + 추가」로 갈린다. 그런데 학습자는 그 줄을 **썼다** — 화면에 「이 줄을 안 썼습니다」와 「원본에 없는 줄입니다」를 나란히 내면 무엇이 다른지 말할 자리가 사라지고, §9 가 그 행에 요구한 `differ TOKEN_COUNT` 도 나오지 않는다. 즉 §4.1 의 문턱과 §9 의 기대가 서로 어긋나 있었고, 문턱을 낮추는 대신(밀린 줄이 엉뚱하게 붙는다) **자리가 같을 때만** 붙이는 걸음을 더했다. A 단계와 같은 근거다 — 밀린 경우는 B·C 가 이미 받았으므로 여기 남는 것은 「자리는 맞는데 내용이 많이 다른」 줄뿐이다 | 04 §4.1·§9 · `packages/grading/src/t1-align.ts` |
| D92 | T1 페이로드에 **`blockId`** 를 더한다 | 02 §8.2 `CardPayload` 의 t1 변형에 `blockId: number`(02 `block.id`)를 더한다. `t1PayloadSchema` 와 목업 대응 키가 함께 늘어난다 | 판을 마칠 때 두 곳이 블록을 알아야 한다: `why_answer.block_id`(02)와 `block.ast_json` 캐시(04 §3.1 · D14). 그런데 `card` 에는 블록을 가리키는 열이 없다 — T1 은 `file_id` 만 채우고(02 `card`) `site_id` 는 `concept_site` FK 라 쓸 수 없다. 원본 줄로 되짚는 방법(같은 파일에서 줄 수가 같은 블록 찾기)은 한 파일에 같은 길이 함수가 둘이면 틀리고, 그때 **다른 블록의 AST 를 캐시로 읽는다**. 페이로드는 카드와 함께 굽히므로(D74) 값이 어긋날 자리도 없다 | 02 §8.2 · `packages/store-sql/src/schemas.ts` · `packages/cards/src/t1.ts` |
| D93 | Monaco 마운트 실측 **314 ms** — 예산 초과, 1단계는 textarea | 05 §10 의 `t1:monaco` 예산 **250 ms** 에 대해 WKWebView 실측은 **314 ms**(n=2, 릴리스 빌드 · `projectox-like`)다. 05 §8 마지막 문단이 이 경우에 밟으라고 미리 적어 둔 단을 밟는다: **1단계(보고 치기)는 `PlainPad`(textarea + 거터)로 되돌린다**(`ClonePad` 의 `fallback` prop). 2·3단계는 Monaco 그대로다. 예산은 낮추지 않는다 | 첫 마운트가 **299 ms**, 두 번째도 그와 비슷해 p95 가 314 ms 다 — 2.3 MB 청크를 내려받는 비용이 아니라 **Monaco 의 에디터 구성 자체**가 그 값이다(M2 의 「첫 실행 vs warm」과는 다른 결론이다). 1단계를 고른 이유는 05 §8 이 그렇게 적었고, 원본이 바로 옆에 있는 단계라 구문 색이 할 일이 가장 적기 때문이다. **남은 일**은 Monaco 의 기여 집합을 줄이는 것이다 — 지금 `editor.api`(전체 에디터: find·folding·suggest·…)를 싣는데 필사는 그 대부분을 쓰지 않는다. 그것이 M4 가 이어받을 자리이고 넘어야 할 숫자는 314 다 | 05 §8·§10 · `apps/desktop/src/screens/session/T1Plate.tsx` · `devtools/perfRun.ts` |
| D94 | `t1:monaco` 예산을 **350 ms** 로 올린다 (사용자 결정) | 05 §10 의 `t1:monaco` 행을 `≤ 250ms` → **`≤ 350ms`** 로 고친다. D93 의 「1단계는 `PlainPad`」는 그대로 남고, 2·3단계 Monaco 도 그대로다. §10 의 「예산을 넘는 항목은 규칙을 강화하지 목표를 낮추지 않는다」는 **이 행에 한해** 연다 | 실측 314 ms(첫 마운트 299 · p95 314, n=2)의 정체는 청크 내려받기가 아니라 Monaco 의 에디터 구성이다. 남은 수단은 기여 집합을 `edcore.main` 으로 줄이는 것뿐인데, 그것은 반나절~하루짜리이고 실패하면 2·3단계까지 textarea 로 물러서야 한다 — 필사의 **구문 강조와 거터 API 를 잃는 값**이 40 ms 보다 크다. 350 은 실측 314 에 11 % 여유를 둔 값이고(n=2 의 변동폭이 5 % 라 330 은 깜빡인다), 홈 인터랙티브 400 ms 아래라 예산끼리의 순서도 유지된다. 마운트는 사용자가 누른 뒤에 일어나는 일이라 첫 화면 예산과 성격이 다르다 | 05 §10 · `docs/handoff/m5.md` |
| D95 | 판정 「면」 색 둘을 신설 — `--verdict-differ-face` · `--on-verdict-differ` | `--verdict-differ-face`(주간 `#FFC400` · 야간 `#FFD030`)와 `--on-verdict-differ`(`#221D18`, 양쪽 같음)를 `tokens.css` 에 더하고 `sync-design.mjs` 의 `OVERRIDES` 에 행을 올린다. `.rtag.d` 가 빌려 쓰던 `--t2`/`--on-t2` 를 이 둘로 바꾼다. `-exact-face`·`-equiv-face` 는 **만들지 않는다** | D11 이 정한 세 「면」 값 중 `--verdict-differ` 만 `--yellow-deep`(#C08F00)이고 나머지 둘은 원색이라, 태그처럼 면을 통째로 칠하는 자리에서 어긋남만 색이 어두워진다. M3 은 그 자리에서 `--t2` 를 빌려 썼는데(값은 목업과 같다) 그러면 T2 트랙 색을 바꿀 때 T1 결과 화면의 「어긋남」이 딸려 바뀐다 — 05 §4.2 가 막으려던 바로 그 결합이다. `--verdict-differ` 는 도장 테두리·거터 틱·범례처럼 **선**으로 쓰는 자리에 그대로 남으므로 값을 바꾸지 않고 면용 이름을 따로 둔다. `-exact`·`-equiv` 는 이미 원색이라 `-face` 를 더하면 한 값에 이름이 둘이 된다 | 05 §4.1·§4.2 · `styles/tokens.css` · `scripts/sync-design.mjs` · `components/t1/DiffRows.css` |
| D96 | T1 이 아직 안 열렸다는 안내는 「판이 없는 문법」 **옆**에 (사용자 결정) | 홈 오른쪽 열의 `GapsPanel` 옆에 `Panel` 하나(`LockedPanel`)를 두고 「T1 필사 — 이 리포의 문법을 조금 익힌 뒤에 열립니다」를 낸다. 조건은 04 §3.1 순위 ②가 아무 블록도 통과시키지 못할 때이고, 열리고 나면 패널 자체가 사라진다 | M3 실측: 갓 등록한 리포는 모든 개념이 0겹이라 「모르는 문법 ≤ 3개」를 넘는 블록이 하나도 없어 T1 슬롯이 조용히 빈다(`log:info:필사 판을 만들지 못했다`). 규칙의 뜻은 맞지만 화면이 아무 말도 안 하면 「고장」으로 읽힌다. 「아직 못 하는 것」을 한 자리에 모으면 구멍 지도와 같은 문장으로 읽힌다 — 「판이 없는 문법」도 「아직 카드가 없다」는 말이다 | 05 §5 · 02 §6.4 · `screens/home` |
| D97 | T2 의 패키지 경계 — 해석은 `concepts`, 지도·정답지는 `cards`, 채점은 `grading` | `packages/concepts/src/resolve-imports.ts` 가 `_imports` 캡처를 `import_edge` 로 바꾸고(인제스트 안), `packages/cards/src/t2-*.ts` 가 그래프 정리·배치·정답지·문제 4종을 구워 `CardPayload` t2 를 만들며, `packages/grading/src/t2-*.ts` 가 선택을 3티어로 잰다. 배치 **기하**(NW·NH·GX·GY·PAD*)는 카드가 아니라 `components/t2/DependencyMap` 이 갖는다 — 카드에는 밴드 행 `r` 과 밴드 안 **순서**만 굽는다 | D86 이 T1 에 그은 선(「`cards` 가 굽고 `grading` 이 잰다」)을 그대로 T2 에 쓴다. 해석기가 `concepts` 인 이유는 04 §7.1 이 그렇게 적었고 그것이 인제스트 산출(`import_edge`)이기 때문이다. 기하가 컴포넌트인 이유는 `CardPayload` t2 가 02 §8.2 에서 `files[{p,r,isNew}]`·`edges` 까지만 갖기 때문이다 — 좌표를 구워 넣으면 상수 하나를 고칠 때 카드를 전부 다시 구워야 한다. 순서는 반대로 카드에 있어야 한다: barycenter 스윕은 난수가 없어도 **입력 순서에 의존**하므로 복습 때 지도가 달라지지 않으려면 구운 값이어야 한다 | 04 §7·§8 · 02 §8.2 · 01 §2 |
| D98 | `git_diff_text` 는 **추가된 줄만** 돌려준다 | 01 §3.1 의 `CommitFileDiff { relPath, status, additions, deletions, hunks[{oldStart,newStart,text}] }` 를 **`FileDiff { relPath, added: string[], truncated: boolean }`** 로 좁힌다. `added` 는 `+` 줄의 본문(원점 바이트·줄바꿈 제거)이고 합계 64 KiB 에서 끊는다. `crates/git` 의 diff 옵션 조립은 `changed()` 와 `file_diff()` 가 `diff_of()` 하나를 나눠 쓴다 | 이 명령을 읽는 곳은 04 §8.1 의 「추가 줄이 전부 import 문인 파일도 sec」 한 군데뿐이고, 그것이 필요로 하는 것은 `+` 줄의 본문뿐이다. `status`·`additions`·`deletions` 는 인제스트가 이미 `commit_file` 에 썼으므로 되돌려 주면 같은 사실이 두 곳에서 온다. 헝크 전문을 실으면 **사용자 코드가 IPC 를 더 많이 건너간다** — 01 §6 이 로그에서 막는 것과 같은 표면이고, 읽는 쪽이 없는 넓이다. 줄 예산에서도 차이가 컸다: 헝크 형태는 `crates/git` 을 485(상한 460)로 넘겼고 좁힌 형태는 458 이다 | 01 §3.1·§3.2·§3.5 · `crates/git/src/commits.rs` |
| D99 | T2 의 statement 8개와 그 이름 | `derive.edge_clear`·`derive.edge_insert`(쓰기)와 `t2.unit_files`·`t2.edges`·`t2.commit_candidates`·`t2.commit_files`·`t2.recent_changes`·`t2.appeal_picks`(읽기). 01 §3.4 표의 `derive.edge_replace`·`t2.graph`·`t2.commit_key` 세 이름을 이 여덟로 바꾼다 | ① `edge_replace` 는 한 문장으로 못 쓴다 — 지우고 넣는 것은 두 문장이고, `derive.prereq_clear`/`_insert` 가 이미 그 짝이다. ② `t2.graph` 하나로는 24 노드 축약을 못 한다: 축약은 **정답지에 든 파일을 접지 않는다**(04 §7.4)이므로 노드와 엣지를 따로 받아 TS 가 자르고 나서 엣지를 좁혀야 한다. ③ `t2.commit_key` 는 커밋 **하나**를 전제하는데 04 §8.1 의 후보 필터는 커밋 여러 건을 훑고 sec ② 는 최근 50 커밋의 공변경을 본다 — 한 문장에 담기지 않는다. 규칙(3~12개·접두·테스트 제외·공변경 비율)은 전부 TS 에 남는다: SQL 에 넣으면 04 §8.1 이 두 곳에 살게 된다 | 01 §3.4 · `statements/derive.sql` · `statements/t2.sql` |
| D100 | `CardPayload` t2 를 문제 4종이 실제로 쓰는 모양으로 넓힌다 | 02 §8.2 의 t2 변형을 넷 고친다. ① `edges: [string, string][]` → **`[string, string, 'static'\|'type'\|'dynamic'\|'http'][]`** ② `files` 원소에 **`folded?: number`**(접힌 폴더 안 파일 수)와 **`cycle?: boolean`**(SCC 크기 > 1) ③ `commit` 을 **선택**으로 ④ `flow?: { answer: string[]; deck: string[] }` 와 `pairs?: { a, b, answer: 0\|1\|2\|3 }[]` 를 더한다. 변형을 `kind` 로 쪼개지는 않는다 | ① 04 §7.3 이 「`type` 엣지는 점선, `http` 엣지는 이중선」이라고 정했는데 2-튜플에는 그 정보가 없다 — 화면이 그릴 수 없다. ② 04 §7.2 의 `⟲` 와 §7.4 의 `lib/ (3)` 이 담길 자리가 없었다. ③ 04 §8.3 의 나머지 3종은 **그래프만으로** 생성되므로 커밋이 없다. §8.4 의 「커밋 부족 폴백」도 커밋 없는 카드를 요구한다. ④ 흐름 추적의 정답 경로·함정 덱과 의존성 방향의 5쌍이 담길 자리가 없었다 — `core/sec/trap` 은 파일을 **고르는** 두 종(책임 배치·영향 반경)의 모양이다. `kind` 로 변형을 쪼개지 않는 이유: `ReviewDetail` t2 는 이미 네 종이 한 모양이고(§8.2 의 `pct` 가 종마다 다른 식으로 나올 뿐), 화면도 `T2Plate` 하나다 — 쪼개면 zod 스키마와 골든 픽스처가 셋으로 늘고 얻는 것이 없다 | 02 §8.2 · `store-sql/src/schemas.ts` · 04 §7.3·§7.4·§8.3·§8.4 |
| D101 | T2 의 `trap` 은 **지도 안 ∖ (core ∪ sec) 전부**다 | 04 §8.1 의 `trap = … 중 core 의 1-hop 이웃` 에서 **「core 의 1-hop 이웃」 단서를 뺀다**. 사유 템플릿 ①은 core 를 직접 놓는 파일만이 아니라 **아래로 이어지는** 파일에도 붙는다 | 좁힌 집합에서는 템플릿 ③④ 가 **한 번도 나오지 않는다** — 1-hop 이웃이면 ①(core 를 import) 아니면 ②(core 가 import) 중 하나가 반드시 맞기 때문이다. 목업의 trap 다섯 문장이 그 증거다: `app/cart/page.tsx` 는 core 에서 **2-hop** 이고(`page → CartSheet → CartItemRow`), `useCart.ts` 는 ①이 맞는데도 손계산은 ③을 줬다. 04 §8.1 이 「목업 다섯 문장은 이 템플릿의 손계산이다」라고 적었으므로 어긋난 쪽은 집합 정의다. 넓힌 집합으로 계산하면 목업의 다섯이 **정확히** 나온다. 넓혀도 화면은 커지지 않는다 — `trap` 은 사용자가 **잘못 고른 파일**에만 문장을 대는 표이고(04 §8.2 `wrong` 티어), 넓히면 그 자리에서 일반 문장 대신 진짜 사유가 나온다 | 04 §8.1 · `packages/cards/src/t2-key.ts` |
| D102 | 24 노드 상한에 **세 번째 걸음**을 둔다 | 04 §7.4 의 축약 ①(폴더 접기)·②(밴드 3 잎 빼기) 뒤에 ③을 더한다: 그래도 24 를 넘으면 `keep`(정답지)과 대지 진입점을 뺀 나머지를 **대지 밖 → 아래 밴드 → 낮은 차수 → 경로 사전순**으로 24 가 될 때까지 「지도 밖」으로 보낸다 | ①과 ②는 둘 다 물지 않는 입력이 있다 — 노드가 전부 대지 안이면 접을 것이 없고(①은 대지 밖만 접는다), 잎이 밴드 3 이 아니면 ②도 안 문다. 합성 2,000 파일 입력에서 실제로 **60 노드**가 남았다. 「한 문제 지도 ≤ 24 노드」는 00 §5 의 게이트이고 권고가 아니다: 25번째부터는 지도가 스크롤 상자가 되어 「30초만 훑어본다」는 전제가 깨진다. 정렬 키의 마지막 둘(차수·경로)이 난수 없이 순서를 완전히 정하므로 결정성은 그대로다 | 04 §7.4 · `packages/cards/src/t2-graph.ts` |
| D103 | `two-commits` 에서는 **아무 T2 판도 안 나온다** — 「그래프 3종」이 아니라 「빈 상태」다 | 00 §5 M4 의 「끝났다는 증거」 문장에서 「`two-commits` 리포는 책임 배치 없이 그래프 3종만 나온다」를 **「`two-commits` 리포는 T2 판이 아예 안 나온다(빈 상태)」**로 고친다. 04 §8.4 의 커밋 부족 폴백은 그대로다 — 그 폴백이 도는 자리는 **커밋이 적고 지도는 있는** 리포다 | `two-commits` 는 파일이 **하나**다(`src/index.ts`). import 가 0건이라 노드도 엣지도 없고, 04 §8.3 의 세 종은 전부 지도를 전제한다(영향 반경은 화살표, 흐름 추적은 3~6 노드 경로, 의존성 방향은 쌍 5개). 커밋이 2건이라는 것보다 **파일이 1개라는 것**이 먼저 걸린다. 이 픽스처의 `.steps` 머리말도 원래 「T2 카드 생성 최소 조건에 못 미쳐 **「빈 상태」**가 나와야 한다」이므로(06 §1.2 · D36) 어긋난 쪽은 §5 의 문장이다 | 00 §5 M4 · `apps/desktop/src/data/graph.test.ts` |
| D104 | `projectox-like` 에 **층이 있는 대지**를 하나 더한다 | `.steps` 끝에 커밋 3개(`src/features/cart/**` 5파일 + 수량 규칙 + 서버 상한)를 더한다. 파일 96 → 102, 커밋 95 → 98. 앞 커밋의 해시는 안 바뀐다(끝에만 붙였다). `fixtures/ipc/projectox/blocks.json` 과 `fixtures/ipc/*/t2.json` 이 함께 갱신된다 | 기존 `projectox-like` 는 `gen wave` 세 줄이 만든 **별 모양**이다 — 서비스 30개와 패널 30개가 전부 `core/time.ts` 하나를 가리키고 끝이라 그래프 깊이가 **2** 다. 그 모양에서는 04 §8.3 의 영향 반경(들어오는 화살표가 있는 대지 파일이 없다)과 흐름 추적(3~6 노드 경로가 없다)이 **원리적으로** 생성되지 않는다. 00 §5 의 「projectox 유닛 하나로 4종 문제가 생성되고」는 층이 있는 대지를 전제한 문장이고, 픽스처가 그 전제를 안 갖고 있었다. 화면 → 기능 → 훅 → 통신 → 데이터로 내려가는 사슬 하나를 손으로 두면 네 종이 다 나온다(실측: 전부 생성). 규칙을 느슨하게 하는 대신 픽스처를 현실에 맞춘 이유는, 느슨하게 하면 「경로가 없는데 흐름 추적을 낸다」가 되어 문제가 거짓말을 하기 때문이다 | 06 §1.2 · `fixtures/repos/projectox-like.steps` |
| D105 | 윈도잉은 `frame_p95` 를 **못 줄였다** — D81 의 답이 틀렸다 | D81 이 「남은 것은 첫 단인 윈도잉」이라고 적은 것을 실측으로 뒤집는다. `content-visibility:auto` + `contain-intrinsic-size:auto 420px` 를 대지 12장 초과에서 걸었고(코드는 남긴다 — 스크롤 밖 대지를 안 그리는 것 자체는 옳다), **같은 리포·같은 하네스에서 18 ms → 19 ms** 로 변화가 없다. 05 §10 의 그 행을 실측 문구로 바꾼다. 다음 수단은 **가상 스크롤이 아니라 노드 자체**다 — 스티커 391개가 각각 인라인 SVG `<use>` 이고, `<use>` 를 지운 정적 배지(또는 스프라이트 한 장을 CSS 배경으로)로 바꾸는 쪽을 먼저 재 봐야 한다 | 실측(릴리스 · 격리된 `HOME` · 창을 앞에 세운 채 · 이 리포 · 대지 18 · 스티커 391): `frame_p95` **19 ms**(n=180), 부속 숨김에서 18 ms(n=181). D80 의 기준선이 같은 리포에서 18 ms(스티커 384)였으므로 **차이가 잡음 안**이다. 왜 안 들었나: `perf()` 의 합성 부하가 **스크롤 + hover 교대**라 화면에 들어오는 대지를 계속 새로 그리게 만든다 — 화면 밖을 건너뛰어 아끼는 값과 가시성 판정에 드는 값이 상쇄된다. 즉 병목은 「그리는 대지 수」가 아니라 **한 대지 안의 노드 수**다 | 05 §10 · `screens/home/HomeScreen.css` · `docs/handoff/m5.md` |

### 4.3 정본 갱신 (반영됨 — discussion.md 로그 2026-09-02T18:20, 「결론」 §2·§3·§5·§6)

아래 표는 이 리뷰가 정본에 요구한 변경의 기록이다. 정본 「결론」에 이미 반영됐으므로 새 세션은 정본을 그대로 읽으면 된다. 표의 「현재」는 반영 전 문구.

| 정본 절 | 현재 | 갱신 |
|---|---|---|
| §6 토큰 | `--yellow #FFC400 + 글자용 7:1 변형` | 황 글자 토큰 `#664300`(주간), 야간 `#FFD866` 유지 |
| §6 토큰 | 트랙 별칭만 | 판정 색 별칭 `--verdict-exact/-equiv/-differ` 신설 |
| §6 부속 숨김 | 기본 보임 | Linux(WebKitGTK) 만 기본 off |
| §2 코어 루프 | 「약 12~15분」 | 기본 15분(10~25) · 새 판 하루 2장 · 하루 경계 04:00 |
| §2 겹 | 「시간을 두고 다시 맞힌 횟수」 | 명문화: 다시 찍기 정답 = 회복만, 모르겠어요 −1 은 같은 날 회복만, 하루 최대 +1 |
| §3-1 4단 | 「이 줄과 앞뒤 4줄만」 | + 「디렉터리 경로·리포명 제외, 파일 이름만」 |
| §3-8 키맵 | `1~4 고르기` | 사다리 열림 + 포커스가 사다리 안이면 단 선택 |
| §3-7 | 상시 애니메이션 금지 | 목업 3건(`blink`·`spin`·`peek`) 위반 → 유한화 |
| §5 T1 | 줄 단위 동등 판정 | `total` 비공백 줄 · 진급 85(소블록 완충) · 4겹은 3단계 통과에서만 |
| 미해결 | 미지 개념 알고리즘 · 보편/언어고유 필드 | 03 §3.6·§4.4 로 해결 → 완료 표시 |
| 신규 | — | 최소 창 1000×680 · T2 진급 85/재도전 65 |

**정본 §6 갱신 (M2 가 올림 · D80·D81 · 사용자 승인 2026-09-03).** 「Chromium 49노드 p95 8.5ms 확인, **WebKit 미측정**」 → 「Chromium 49노드 p95 8.5ms · **WebKit(WKWebView) 384노드 p95 18ms 확인 — 예산 12ms 초과, 윈도잉으로 내린다**」. 릴리스 빌드를 격리된 데이터 디렉터리로 띄워 잰 값이고, 05 §10 의 강등 사다리 중 아래 두 단은 실측으로 탈락했다(부속 숨김 21 → 18ms). 규칙(예산 12ms)은 그대로 두고 **화면이 그것을 지키러 내려간다** — 목표를 낮추지 않는다는 05 §10 의 원칙이다.

**정본 §5 갱신 (M1 이 올림 · D68 · 사용자 승인 2026-09-03).** 「얇은 Rust … 500~1500줄」 → **≤ 2,300줄**. 실측 2,043 에 남은 마일스톤이 더할 ~190 줄을 더해 정한 값이다. 01 §1.1·§4 와 게이트(`scripts/check-rust-budget.sh` 기본값 2300)·`README.md`·루트 `CLAUDE.md` 를 같은 값으로 맞췄다. `.oculpm/planner/chickadee-build.md` 의 M1 제목에 남은 「Rust ≤1500줄」은 고치지 않는다 — 플랜이 제목으로 항목을 참조하고, M1 이 통과한 게이트가 그 값이었다는 기록이다.

---

## 5. 마일스톤 계획

87개 체크리스트 항목(01:14 · 02:14 · 03:15 · 04:14 · 05:15 · 06:15)을 빠짐없이 한 번씩 배치했다. 제목은 각 문서 원문 그대로(앞부분). 03 의 Rust 쪽 항목 7개와 02·06 의 겹치는 항목은 제목을 유지한 채 `REVIEW.md` 의 「체크리스트 범위」에서 범위만 조정했다. 규모는 1인 기준 일수.

### M0 · 골격 — 워크스페이스 · CI · 토큰 · 픽스처

| 항목(출처 · 원문 제목) | 선행 | 규모 |
|---|---|---|
| 01 · 워크스페이스 스캐폴드 | — | 2 |
| 05 · 워크스페이스·Tauri 2 골격 | 01 스캐폴드 | 1 |
| 01 · `ipc-client` 패키지 | 01 스캐폴드 | 1 |
| 01 · `store` 크레이트 | 01 스캐폴드 | 2 |
| 02 · 마이그레이션 러너 | `store` 크레이트 | 1 |
| 01 · `store-sql` 패키지 | 02 DDL(REVIEW 반영본) | 2 |
| 02 · `db/sql` + `fromRow` 계층 | `store-sql` | 2 |
| 02 · 하루 경계·시각 유틸 | — | 0.5 |
| 04 · 공통 시드·PRNG·토크나이저 | — | 1 |
| 01 · T3 자리 | `store-sql` | 0.5 |
| 05 · 토큰·리셋·인쇄 물리·폰트 동봉 | 05 골격 | 2 |
| 05 · 마스코트 `DeeSprite`·`Dee`·`useDeeMotion` | 토큰 | 1 |
| 05 · 프리미티브 12종 + `dev/Gallery` | 토큰 | 2 |
| 06 · Q1 픽스처 리포 생성 스크립트 | 01 스캐폴드 | 1 |
| 06 · Q7 `ci.yml` + `audit` 잡 | 01 스캐폴드 | 1 |
| 06 · Q11 Tauri 보안 설정 | 01 스캐폴드 | 1 |

**끝났다는 증거**: 빈 창이 3-OS 에서 뜨고, `store_open` 으로 `0001_init.sql` 이 적용된 DB 가 생기며, 토큰만 있는 화면이 `check-contrast`·Stylelint 4룰·`check-rust-budget.sh`·`clippy -D warnings`·`typecheck` 를 CI 에서 통과한다. `tiny` 픽스처 해시가 두 번 생성해도 같다.

### M1 · 인제스트 수직 절단 — 리포 등록 → 캡처 → concept_site → 홈에 「판이 없는 문법」이 뜬다

| 항목 | 선행 | 규모 |
|---|---|---|
| 01 · `git` 크레이트 | M0 | 2 |
| 03 · diff hunk → `CommitRec` | `git` 크레이트 | 1.5 |
| 01 · `parse` 크레이트 | D18 캡처 규약 | 3 |
| 03 · 문법 크레이트 고정 + 언어 감지 + 파서 풀 | `parse` 크레이트 | 1.5 |
| 01 · 인제스트 잡 러너 | store·git·parse | 3 |
| 03 · 워킹트리 스캔 + 진행률 채널 + 취소·이어하기 | 잡 러너 | 1 |
| 03 · 쿼리 실행기 | `parse` 크레이트 · 04 토크나이저 | 3 |
| 03 · sqlite 쓰기·증분 | 잡 러너 · 쿼리 실행기 | 1.5 |
| 01 · 파일 맥락 명령 | `git` 크레이트 | 1 |
| 03 · blame 2차 패스 | 파일 맥락 명령 | 1 |
| 01 · 사전 명령 + `dictionary` 패키지 | 03 YAML 스키마 | 2 |
| 03 · TS 사전 1차 | 쿼리 실행기 | 4 |
| 03 · 사전 스키마·린트 | 사전 1차 | 2 |
| 03 · 크레이트 골격 `chickadee-ingest` | `dictionary` 패키지 | 1.5 |
| 03 · 골든 픽스처 | 쿼리 실행기 · Q1 | 1.5 |
| 06 · Q2 Rust 파서·쿼리 골든 | 쿼리 실행기 · Q1 | 1 |
| 03 · 미지 개념 개수·첫 노출 선택(TS) | 사전 1차 · 파생 층 | 1.5 |
| 02 · 미지 개념 계산 | 03 미지 개념 개수 | 1.5 |
| 03 · 문법 구멍 지도 집계(TS) | 02 미지 개념 계산 · D29 | 1.5 |
| 01 · 오류 모델 배선 | 각 크레이트 | 1 |
| 01 · 리포 이동/삭제 흐름 | git · store-sql | 1 |
| 06 · Q8 로그 안전 래퍼 | 오류 모델 | 1 |
| 06 · Q10 악성 입력 방어 | 잡 러너 · Q8 | 2 |
| 05 · 홈 화면 | 프리미티브 · 02 홈 쿼리 | 3 |
| 05 · WKWebView 성능 첫 실측 | 홈 | 1 |
| 05 · 인제스트·첫 실행·안내·설정 | 홈 · 01 이벤트 | 2 |
| 03 · 성능 픽스처·벤치 | 증분 · Q1 | 1.5 |
| 03 · Swift·Dart·SQL 품질 검증 | 파서 풀 | 2 |
| 03 · projectox 실리포 검증 | 구멍 지도 | 1 |

**끝났다는 증거**: projectox 를 등록하면 진행 4단계가 시간 비례 큐로 보이고 15s(M1) 안에 끝나며, 홈 마스트헤드·대지·「판이 없는 문법」 패널이 목업과 같은 모양으로 실데이터를 보인다. 게이트: 인제스트 전후 리포 트리 해시 동일 · 로그에 픽스처 소스 줄 0 · `fixtures/ipc/tiny` 덤프 diff 0 · 골든 전부 통과 · Rust ≤ 2300줄(D68 전에는 1500).

### M2 · T0 세션 수직 절단 — 큐 → T0 카드 → 채점 → 겹 → 요약 (사다리 · LIFER 포함)

| 항목 | 선행 | 규모 |
|---|---|---|
| 02 · FSRS 어댑터 | 시각 유틸 | 1.5 |
| 02 · 겹 리듀서 | FSRS 어댑터 | 1 |
| 02 · 새 개념 순위 | M1 미지 개념 계산 | 1.5 |
| 02 · 큐 플래너 | 새 개념 순위 · FSRS 어댑터 | 2 |
| 02 · 세션 중 삽입·복구 | 큐 플래너 | 1.5 |
| 01 · 세션 저장/복원 | store-sql · 세션 중 삽입 | 1.5 |
| 04 · T0 생성기 3종 | 03 사전·Site | 3 |
| 04 · T0 채점·진단·이벤트 | T0 생성기 | 1 |
| 02 · 판 완료 트랜잭션 | 겹 리듀서 · T0 이벤트 | 1.5 |
| 02 · `rebuild_mastery()` | 판 완료 트랜잭션 | 1 |
| 04 · 사다리 데이터 조립기 | T0 채점 · 02 겹 조회 | 2 |
| 02 · 홈·요약·사다리 쿼리 | db/sql 계층 | 1.5 |
| 02 · 이의·LIFER 처리 | 판 완료 트랜잭션 | 1 |
| 05 · 세션 셸 | 프리미티브 · 02 세션 테이블 | 3 |
| 05 · T0 판 | 세션 셸 · 04 T0 | 2 |
| 05 · 다시 찍기 사다리·아래층·LIFER | T0 판 | 3 |
| 05 · 인쇄 완료 요약 | T0 판 | 1 |
| 06 · Q3 TS 채점기 골든·스케줄러 property | 04 T0 · 02 리듀서 | 2 |
| 06 · Q4 통합 파이프라인·IPC 덤프 | Q1~Q3 | 2 |
| 06 · Q5 `__audit` 이식 | 05 세션 화면 | 2 |
| 01 · 성능 벤치 | 인제스트 · 세션 셸 | 1.5 |

**끝났다는 증거**: 「인쇄 시작」 → T0 정답·오답·모르겠어요(사다리 1~4단·아래층 점프·자동 복귀·`B`)·다시 찍기·LIFER·요약이 실데이터로 한 흐름으로 돌고, Esc 후 재진입 시 N번째 판부터 이어진다. 게이트: 02 §3.3 검산 6건 · `rebuild_mastery == mastery` · fast-check 5속성 · 카드 전환 IPC 0회 · 판정란 0px · 13px 미만 0 · 대비 7:1 · 큐 결정성.

### M3 · T1 클론 코딩

| 항목 | 선행 | 규모 |
|---|---|---|
| 04 · T1 블록 선정·마스크 | 03 `_blocks` · 01 `file_read_block` · 02 `block` | 2 |
| 04 · T1 정규식층 | 04 토크나이저 | 3 |
| 04 · T1 AST 승격 | 정규식층 · 01 `parse_snippet` | 3 |
| 04 · T1 결과·점수·이의 | 정규식층 · 02 `appeal` | 2 |
| 04 · 왜 게이트 | T1 결과 · 02 `why_answer` | 1 |
| 05 · T1 `ClonePad` Monaco | 세션 셸 · 04 T1 엔진 | 3 |

**끝났다는 증거**: `projectox-like` 의 12~40줄 블록이 3단계 페이딩으로 나오고 04 §9 골든 28건이 통과하며, 목업 예시 답안이 비공백 줄 기준으로 채점되고 이의·왜 게이트가 `appeal`·`why_answer` 에 남는다. 게이트: 비교 엔진 20줄 < 20ms · Monaco 마운트 ≤ 250ms(WebKit) · IME 조합 중 판정 보류.

### M4 · T2 구조

| 항목 | 선행 | 규모 |
|---|---|---|
| 04 · T2 import 해석기 `resolve-imports.ts` | 03 `_imports` 캡처 | 3 |
| 04 · T2 그래프 정리·배치 | 해석기 | 2 |
| 04 · T2 정답지 도출 | `commit_file` · D21 | 2 |
| 04 · T2 채점·문제 3종 | 정답지 | 2 |
| 05 · T2 `DependencyMap` | 세션 셸 · 그래프 배치 | 2 |
| 04 · 골든 케이스 스위트 | 위 전부 | 1 |

**끝났다는 증거**: projectox 유닛 하나로 4종 문제가 생성되고 `two-commits` 리포는 T2 판이 아예 안 나온다(빈 상태 — 파일이 하나라 지도가 없다, D103). 게이트: 배치 결정성(난수 0) · 2,000 파일 해석 < 1.5s · 24 노드 상한 · 04 T2 골든 · Q4 재생을 T1·T2 까지 확장해 diff 0.

### M5 · 릴리스 준비 — 보안 게이트 · 3-OS 빌드 · 오픈소스 문서

| 항목 | 선행 | 규모 |
|---|---|---|
| 06 · Q9 LLM 전송 범위·키체인 | 05 사다리 4단 · D8 | 2 |
| 06 · Q12 마이그레이션 프레임 | 02 스키마 | 2 |
| 06 · Q6 시각 회귀·감축 모션·키보드 완결 | Q5 | 2 |
| 05 · E2E 15 시나리오 + 시각 회귀 40장 + a11y 감사 자동화 | 전 화면 | 3 |
| 06 · Q15 E2E Linux 8건 + 벤치 야간 | Q4 · Q12 | 3 |
| 06 · Q13 오픈소스 문서 세트 | — | 1.5 |
| 06 · Q14 `release.yml` + README 우회 안내 | Q7 | 1.5 |
| 05 · 목업 정리 | D3·D11·D14 | 1 |

**끝났다는 증거**: `v0.1.0` 태그로 3-OS 드래프트 릴리스가 생기고(`SHA256SUMS.txt`), 첫 실행 소켓 0(E1)·전부 지우기 후 파일 부재(E8)·모의 키 grep 0 이 CI 에서 통과하며, README 최상단에 서명 우회 안내가 있다.

### M6 · MVP 이후

| 항목 | 선행 | 규모 |
|---|---|---|
| 02 · FSRS 개인화 잡 (「MVP 이후 · TS 우선」) | `review_log` ≥ 1,000행 · `ts-fsrs` 옵티마이저 확인 | 2 |

---

## 6. 열린 질문 (사용자 결정 필요)

결정이 없으면 「기본값」으로 진행한다.

| # | 질문 | 기본값 |
|---|---|---|
| 1 | 서명·공증 결정 시점 — 다운로드 500회 또는 「열리지 않아요」 이슈 10건(연 $99 + $200~400)에 동의하는가 | 그 시점까지 유보, README 우회 안내 |
| 2 | Swift·Dart 가 품질 게이트에 미달하면 언어를 보류하고 「아직 판이 없습니다」라고 말하는가, 정규식 폴백으로 T0 를 내는가 | 보류 |
| 3 | ~~`react/` 처럼 프레임워크 관습을 문법 사전에 넣는 것을 허용하는가~~ | **결정됨 → D59** 허용(`framework:` + `package.json` 감지) |
| 4 | 4단 프롬프트에 파일 **이름**(base name)을 넣는가 | 넣는다(경로·리포명 제외) |
| 5 | ~~`.d.ts` · SQL 마이그레이션 · 테스트 파일의 인제스트 포함 여부~~ | **결정됨 → D60** `.d.ts` 제외 · 마이그레이션 포함 · 테스트 포함하되 `essential` 집계 제외 |
| 6 | 문법 사전을 앱과 별도로 배포하는가 | MVP 는 번들만, `dict-user/` 로 대체 |
| 7 | ocul-pm 일지 연동(「선택의 왜」)의 MVP 범위 | 최소: T2 커밋 출처와 구멍 지도 `alternatives` 행에서 커밋 해시로 `.oculpm/journal/**/*.md` 를 `repo_glob_read` 로 찾아 링크만 |
| 8 | 복습 부채 모드(`desired_retention` 0.85 제안) | MVP 제외 |

---

## 7. 인계 규칙

1. **표면 언어(D61) · 말투(D62).** 커밋 메시지 · PR · `.github/**` · `README` 류 · 코드 주석은 **영어**. 앱 UI 문구 · 사전 YAML · `docs/**` · `.oculpm/**` 는 한국어. 사람이 읽는 글에는 **AI 말투를 쓰지 않는다** — 금지 낱말·문형 목록은 루트 `CLAUDE.md`. 루트 `CLAUDE.md` 가 세션마다 이 규칙을 읽힌다.
2. **정본 우선.** 문서가 정본과 어긋나면 문서를 고친다. 정본을 고쳐야 하면 §4.3 표에 먼저 올리고 사용자 확인 뒤 고친다.
3. **결정은 등록부에 먼저.** 01~06 을 고치기 전에 §4 에 행(`D48…`)을 추가하고 「반영」 열에 절을 적은 뒤 문서를 고친다. 등록부에 없는 변경은 리뷰에서 되돌린다.
4. **체크리스트 항목 제목은 안정 id 다.** §5 표가 제목으로 참조하므로 제목을 바꾸면 이 문서 §5 와 `REVIEW.md` 를 같은 커밋에서 같이 바꾼다. 범위 조정은 제목 뒤 괄호로.
5. **이름은 §3 용어집이 정본.** 새 이름은 용어집에 행을 추가한다. 폐기 열의 이름은 새 문장에 쓰지 않는다.
6. **소유권.** §2 표의 소유 문서만 그 내용을 정의한다. 다른 문서는 이름으로 참조한다(05 는 SQL 대신 statement 이름).
7. **일지.** 작업 단위를 끝낼 때마다 `AGENTS.md` 의 ocul-pm 규칙대로 `journal_write` 를 부르고, 플랜 항목이 있으면 `plan_update` 로 글리프를 갱신한다. 시작 전에 `journal_search` 로 과거 결정을 찾는다. 시크릿은 어떤 파일에도 쓰지 않는다.
8. **구현 플랜.** M0 착수 시 §5 표를 `plan_create` 로 ocul-pm 플랜에 옮긴다(항목 id = `m0-01-workspace` 식 kebab). 그 뒤 진행 상태의 정답은 플랜 글리프이고 §5 는 배치 근거로만 남는다.
9. **검증.** 문서를 고친 뒤 `REVIEW.md` 끝의 「검증 방법」 grep 목록을 돌려 폐기 이름이 남지 않았는지 확인한다.
10. **인계 프롬프트(D63).** 마일스톤을 끝낸 세션이 다음 마일스톤의 `docs/handoff/<id>.md` 를 쓴다. 목표·읽을 순서·항목 id·끝났다는 증거·**앞 마일스톤이 남긴 지뢰**·규칙·이미 결정된 것·보고 형식. 규격은 `docs/handoff/README.md`.
