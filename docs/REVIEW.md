# REVIEW · 문서별 수정 지시서

`00-overview.md` §4 결정 등록부(D1~D47)를 각 문서에 반영하기 위한 지시. 형식은 「어느 절(제목·문장 인용) → 무엇으로」. 지시에 없는 부분은 손대지 않는다. **체크리스트 항목의 제목(「 — 」 앞부분)은 바꾸지 않는다** — `00` §5 가 제목으로 참조한다. 설명(「 — 」 뒤)과 범위는 이 문서가 시키는 대로 바꾼다. 작업이 끝나면 맨 끝 「검증 방법」의 grep 을 돌린다.

공통(모든 문서): `docs/00-overview.md` §3 용어집의 「폐기」 열 이름을 본문에서 지운다. 열린 질문 절은 삭제하지 말고 각 항목 뒤에 「→ 결정: D# / 00 §6-#」 한 줄을 붙여 답을 표기한다.

---

## 01 · 아키텍처

1. §1 다이어그램 `jobs` 줄 「`walk(ignore) → blake3 → tree-sitter parse+query → git2 → 500행 tx`」 → 「`walk(ignore) → blob oid → tree-sitter parse+query → git2 → 500행 tx`」. 같은 절 문장 「Rust 가 「사실(files·captures·imports·commits·commit_files)」을 SQLite 에 쓰고, TS 가 그 사실에서 「파생(concepts·cards)」을 만들어」 → 「Rust 가 「사실(`file`·`capture`·`git_commit`·`commit_file`)」을 SQLite 에 쓰고, TS `packages/concepts` 가 캡처를 **파일 단위 페이지**로 읽어 「파생(`concept_site`·`import_edge`·`block`·`unit`·`gap`)」을 쓰고, `packages/cards` 가 `card` 를 만든다」. (D1·D2)
2. §1.1 표 「금칙어 | Rust 식별자·문자열에 … 금지 | 같은 스크립트의 grep」 → 검사 범위를 「`crates/*/src/**` + `apps/desktop/src-tauri/src/**`(tests·benches 제외)」로 명시. 표에 행 추가: 「git 바이너리 금지 | `Command::new("git")` 발견 시 실패 | 같은 스크립트」. 스크립트는 `scripts/check-rust-budget.sh` 하나(06 의 `forbid.sh` 흡수). (D40·D41)
3. §2 모듈 표: `git` 출력에 「`BlameHunk[]`」 추가; `parse` 입력 「`(lang, bytes, QuerySpec[])`」 → 「`(grammar, bytes, QuerySpec[])`」; `concepts` 출력 「`ConceptUse[]`, 선행 그래프, 미지 개념 수」 → 「`concept_site`·`import_edge`·`block`·`unit`·`gap` 행, 선행 그래프, 미지 개념 수, 커밋 `kind`·`author_matched`」; `concepts` 디렉터리 파일 목록(§4)에 `units.ts`·`commits.ts`·`blame.ts`·`ingest-defaults.ts` 추가. (D1·D21·D29)
4. §2 「크로스 경계 데이터 형식」 문단 끝에 추가: 「열(col)은 tree-sitter `Point.column`(UTF-8 바이트) 그대로이며 문자 열 변환은 TS 가 한다.」
5. §3.1 타입 블록 교체·추가:
   ```ts
   interface LangSpec { grammar: string; extensions: string[]; maxFileBytes: number; queries: { id: string; scm: string }[] }
   // queries[].id = 개념 id('ts/optional-chaining') 또는 예약 id '_imports' | '_blocks'
   interface IngestSpec { repoId: RepoId; mode: 'full' | 'incremental'; langs: LangSpec[];
     maxCommits: number /* 2000 */; maxFilesPerCommit: number /* 200 */; maxFiles: number /* 50000 */;
     maxLineBytes: number /* 20000 */; excludeGlobs: string[]; generatedMarkers: string[] /* 첫 5줄 검사 */ }
   interface IngestWarning { jobId: JobId; relPath: string; reason: 'oversize' | 'parse-poor' | 'timeout' | 'binary' | 'generated' | 'long-line' }
   interface IngestDone { …기존…; warnings: number }
   interface Capture { queryId: string; matchId: number /* 파일 안 매치 번호 */; patternIndex: number;
     name: string /* 'site' | 'pick.N' | 'hole' | 'ctx.<name>' | 'import.source' | 'block.function' | 'block.name' */;
     form: string | null /* (#set! form) */; nodeKind: string; inError: boolean /* ERROR 와 겹치거나 조상 3단 안에 ERROR */;
     startByte: number; endByte: number; startLine: number; endLine: number; startCol: number; endCol: number;
     excerpt: string /* ≤ 200자 */ }
   interface BlameHunk { start: number; end: number; sha: string }   // 1-based, 닫힌 구간
   ```
   `RepoInfo.fingerprint` 주석: 「커밋 0개면 `''`」. (D1·D12·D18·D19·D20·D44)
6. §3.2 명령 표 변경: `repo_register` 출력 설명에 「`Repository::discover` 로 루트를 찾아 `rootPath` 로 돌려준다. 커밋 0개 허용」; `parse_snippet` 입력 `{ grammar, text, queries? }`, 오류에 `PARSE_TOO_DEEP`(AstLite 깊이 512); `parse_langs` 출력 `{ grammar, grammarVersion, abi }[]`; `dict_list` 출력 `{ lang, source: 'bundled' | 'user' }[]`; `dict_read` 입력 `{ lang }`, 출력 `{ files: { relPath: string; text: string }[] }`(`_lang.yaml`·`*.yaml`·`*.scm` 원문, 파싱은 TS). 행 추가: 「`git_blame_lines` | `{ repoId, relPath, rev? }` | `{ hunks: BlameHunk[] }` | `GIT_COMMIT_NOT_FOUND` `GIT_BLAME_TIMEOUT`(2s) | 500ms | ✗ | —」. 이벤트 행에 `ingest_warning{IngestWarning}` 추가. (D15·D17·D19·D26·D44)
7. §3.3 알고리즘 교체(번호 유지):
   1. fingerprint 가 `''` 이면 비교하지 않고 첫 커밋 발견 시 채운다.
   2. 제외 규칙에 `excludeGlobs`·`generatedMarkers`(첫 5줄)·`.gitattributes linguist-generated`(`repo.get_attr`)·`maxLineBytes` 초과·`maxFiles` 초과(`truncated`) 추가. 확장자 없는 파일은 스킵.
   3. 「파일마다 blake3」 → 「파일마다 `Oid::hash_object(Blob, bytes)` = `file.content_hash`; HEAD 트리 항목 oid = `file.head_oid`(없으면 NULL); `is_dirty = head_oid IS NULL OR head_oid <> content_hash`. `incremental` 은 `content_hash` 가 같으면 건너뛴다」.
   4. 「import 는 캡처 이름 `import.source` 의 원문 문자열만 저장」 → 「시스템 쿼리 `_imports`·`_blocks` 의 캡처도 개념 캡처와 같이 `capture` 행으로 저장한다. 파일마다 `parse_quality`(ERROR+MISSING 바이트 > 5% 또는 단일 ERROR 40줄 초과 → `'poor'`)를 `file` 행에 쓴다」.
   5. 「`revwalk` HEAD 부터 topological」 → 「`TOPOLOGICAL | TIME`, first-parent 단순화 없음. 커밋마다 `sha·parent_sha·parent_count·author_email·author_name(mailmap 적용)·authored_at·subject·files_n·insertions·deletions·truncated` 저장. `parent_count > 1` 이면 diff 계산 없음. diff 옵션 `context_lines(0)`, `ignore_whitespace(true)`, `find_similar(renames, threshold 50)`; 파일별 `commit_file` 행(`status·old_path·additions·deletions·touched_json` = `'+'` 줄의 new_lineno 범위 압축)」. `isMerge` 폐기.
   6·7 유지. 카탈로그 이름 목록에서 `facts.import_insert` 삭제, `facts.file_upsert` 의 열을 「`path grammar byte_size line_count content_hash head_oid is_dirty parse_quality skip_reason`」로 명시.
   문단 추가 「**TS 파생 층**: `ingest_done` 을 받으면 `packages/concepts.derive(repoId)` 가 `derive.captures_by_file{fileId}` 로 파일 단위 페이지를 읽어 `concept_site`·`import_edge`·`block`·`unit`·`unit_node`·`gap` 을 쓰고(`store_batch` ≤ 200 op), 끝나면 `packages/concepts/blame.ts` 가 Site 가 있는 파일마다 `git_blame_lines` 를 배경에서 호출해 `concept_site.commit_id` 를 채운다. 커밋 `kind`·`author_matched` 도 이때 `git_commit` 파생 열에 쓴다.」 (D1·D18·D20·D21·D22·D25)
8. §3.4 statement 표: `review.append + mastery.upsert + session.save` 행의 설명 「(batch)」 → 「(batch: `review_log` insert · `mastery` upsert · `session_item` update · `session` update · `lifer`/`dunno_event`)」; `session.open_get / session.finish` 행 「`state_json`」 → 「`session` 행 + `session_item` 행 전부」. 행 추가: `derive.captures_by_file`(`fileId` → `Capture[]`), `derive.site_upsert`, `derive.edge_replace`, `derive.block_upsert`, `derive.blame_fill`, `t2.commit_key` 설명 「`commit_file` 조인」. (D10·D22)
9. §4 디렉터리 트리: `apps/desktop/src/ … routes/{home,session}/` → `screens/`; `packages/ui/ tokens.css(design/ink-home.html 토큰 블록에서 build 로 추출)` → 「`tokens.css`(`scripts/sync-design.mjs` 가 `design/src/ink/tokens.css` 에서 복사)」; `dictionary/<lang>/{manifest.yaml, concepts.yaml, queries/*.scm}` → 「`dictionary/{common,arch,react,<lang>}/{_lang.yaml, <concept>.yaml, <concept>.scm, <concept>.js.scm, _imports.scm, _blocks.scm}` + `dictionary/schema/concept.schema.json`; `ts/ sql/` 부터」; `fixtures/repos/{small,medium,large}.bundle` → 「`fixtures/repos/<name>.steps`(tiny · projectox-like · two-commits · large-100k · poly, 생성물은 커밋하지 않음)」; `fixtures/snippets/` → 「`fixtures/golden/<lang>/<concept>/<case>.<ext>` + `.expected.json`」; 추가 `fixtures/ipc/<fixture>/`, `fixtures/ui/run08.json`, `fixtures/evil/`, `fixtures/evil-dict/`, `fixtures/db/v0001.sqlite`; `scripts/{…}` → `{check-rust-budget.sh, build-catalog.ts, make-fixture-repo.sh, bench.sh, sync-design.mjs, check-contrast.mjs}`; 추가 `apps/desktop/src-tauri/benches/ingest.rs`(criterion), `crates/parse/tests/`(insta 스냅샷·사전 예시 덤프). (D16·D17·D36·D37·D41)
10. §5 상태 표 「진행 중 세션 … | SQLite `sessions.state_json` | 목업 `persist()` 와 동일 시점: … T1 초안은 1초 디바운스」 → 「진행 중 세션 | SQLite `session` + `session_item`(`state_json` 은 판 단위) | 저장 시점 5종: 판을 걸 때 · 채점 직후 · 큐 변경 · 5초 tick · Esc. T1 초안은 400ms 디바운스로 메모리에, tick·blur·Esc·언마운트에서 flush」. 「인제스트 잡 | … `ingest_runs` 행 | 재시작 시 미완 run 은 `aborted`」 → 「`ingest_run` 행 | 재시작 시 `running` 인 행은 `failed`」. 문단 「요약 화면은 `sessions.state_json.results` 를 다시 읽어 그린다」 → 「`review_log WHERE session_id` 를 다시 읽어 그린다」. 문단 「24시간 지난 열린 세션은 `session.finish{partial:true}` 로 닫는다」 → 「`day_key` 가 바뀐 세션은 02 §5.6 대로 `abandoned` 로 닫는다」. 「`state_json.queue` 에 그대로 있으므로」 → 「`session_item` 행으로 있으므로」. (D10·D32)
11. §6 오류 표 행 추가: 「`Git::BlameTimeout` | `GIT_BLAME_TIMEOUT` | ✗ | (표시 없음 — 출처 없이 카드 유지)」, 「`Parse::TooDeep` | `PARSE_TOO_DEEP` | ✗ | 이 파일은 너무 깊어 건너뛰었습니다」. `GitError` 열거형에 `BlameTimeout{path}`, `ParseError` 에 `TooDeep{depth}` 추가. (D26)
12. §7 표 「설정 | `settings` 테이블(단일 진실) — 하루 분량(기본 15분)·…」 에 「`identities[]`·`excludeGlobs`·`motion`·`newPerDay`(기본 2)」 추가. 문단 「`purge:true` 는 사실·카드를 지우되 `mastery`·`review_log` 는 절대 지우지 않는다」 → 「`purge:true` 는 사실(`file capture git_commit commit_file`)과 파생(`concept_site import_edge block unit* gap`)을 지우고 `card` 는 `retired_at`+`snapshot_json` 으로 은퇴시킨다(삭제 금지 — `review_log` 가 참조). `mastery`·`review_log` 는 절대 지우지 않는다」. (D31·D46)
13. §8 표 아래 「`scripts/bench-ingest.ts` 가 세 픽스처로 위 표를 찍어」 → 「`scripts/bench.sh` 가 criterion(`src-tauri/benches/ingest.rs`, `tiny`·`projectox-like`·`large-100k`)과 `vitest bench` 를 돌려 `bench/baseline.json` 과 비교해」. WKWebView 항목 「셸 스캐폴드 첫날 측정하고 p95 > 12ms 면 `data-trim` 기본값을 `on` 으로」 → 「첫날 측정하고 p95 > 12ms 면 05 §10 의 강등 순서(윈도잉 → 판번호 어긋남 끄기 → 결 `--grain-op:0`)를 적용한다」. WebKitGTK 「부속 기본 `off` 후보(결정 요청)」 → 「부속 기본 `off`(D12 확정)」. 위험표 같은 문장도 동일 교체. (D11·D12·D37)
14. §9: `LANGS` 배열 주석 「`("sql", …)` 의 첫 요소가 **grammar 키**이며 사전 `_lang.yaml.grammars` 가 이 키를 쓴다」. 사전 파일 3줄 → 「`dictionary/python/_lang.yaml` · `dictionary/python/<concept>.yaml` + `.scm` · `dictionary/python/_imports.scm`·`_blocks.scm`」. 「캡처 이름 규약: `concept.<id>` · `import.source` · `block.function`」 → 「캡처 이름 규약은 03 §3.2(`@site`·`@pick.N`·`@hole`·`@ctx.*`·`(#set! form)`); 시스템 쿼리 `_imports.scm` 은 `@import.source`, `_blocks.scm` 은 `@block.function`·`@block.name`」. (D17·D18·D19)
15. §10 「`ingest_runs(grammar_versions_json, query_hash, dict_version, app_version)`」 → 「`ingest_run(grammar_versions_json, query_hash, dict_version, dict_schema, gen_version, app_version, fingerprint)`; `fingerprint = sha256(grammar_versions_json ‖ query_hash ‖ gen_version ‖ dict_schema)`」. 「`manifest.version`(semver)」 → 「`_lang.yaml.version`(semver)」. (D2·D45)
16. 열린 질문 1~9 에 답 표기: 1→D2(`review_log.card_id NOT NULL` 유지, 카드는 은퇴) · 2→D2 수락 · 3→D18(규약은 03 것, `import.source` 는 `_imports.scm`) · 4→D14(TS 비교, `AstLite.kind` 에 `'ERROR'` 그대로) · 5→D43 · 6→D7 · 7→D12(off) · 8→D12 확인 · 9→00 §6-7 기본값.
17. 체크리스트 설명 수정(제목 유지): 「`git` 크레이트 — … `make-fixture-repo.sh` 로 bundle 3종」 → 「… blame hunks, 픽스처는 06 Q1 의 `.steps`」; 「인제스트 잡 러너 — … blake3 증분 …」 → 「… blob oid 증분·`is_dirty` …」; 「성능 벤치 — `bench-ingest.ts` 3 픽스처」 → 「`bench.sh`(criterion + vitest bench) 3 픽스처」; 「`parse` 크레이트 — … 골든 스니펫 테스트」 → 「… insta 캡처 스냅샷(`crates/parse/tests/`)」.

---

## 02 · 데이터 모델과 스케줄링

1. §0 표 5 「새 판 하루 4장 · 복습 세션당 20장 상한 · 예산 13분(10~25)」 → 「새 판 하루 **2장**(설정 상한 4) · 복습 세션당 20장 · 예산 **15분**(10~25)」. (D12)
2. §1 ERD 에 줄 추가: `file 1─n capture` · `git_commit 1─n commit_file` · `file 1─n import_edge(from) / import_edge n─1 file(to)` · `file 1─n block` · `review_log 1─n why_answer` · `perf_sample`(독립). `unit_node` 설명 「unit × concept」 → 「unit × concept × track」. 「인제스트 산출」 목록에 `capture · commit_file · import_edge · block` 추가. (D2·D22·D28·D30)
3. §2.2 DDL 변경(열 추가는 `CREATE TABLE` 본문에 직접):
   - `repo`: `fingerprint TEXT NOT NULL DEFAULT ''`, `detached_at INTEGER` 추가.
   - `ingest_run`: `status … IN ('running','done','failed','cancelled')`; 열 추가 `mode TEXT NOT NULL DEFAULT 'full' CHECK (mode IN ('full','incremental'))`, `captures_n INTEGER NOT NULL DEFAULT 0`, `commits_n INTEGER NOT NULL DEFAULT 0`, `warnings_n INTEGER NOT NULL DEFAULT 0`, `peak_rss_mb INTEGER`, `escalated_to_full INTEGER NOT NULL DEFAULT 0`, `grammar_versions_json TEXT`, `query_hash TEXT`, `dict_version TEXT`, `dict_schema INTEGER`, `gen_version INTEGER`, `app_version TEXT`, `fingerprint TEXT`.
   - `git_commit`: `message` 주석 「제목 줄만」; 열 추가 `parent_count INTEGER NOT NULL DEFAULT 1`, `author_email TEXT`, `author_name TEXT`, `truncated INTEGER NOT NULL DEFAULT 0`, `is_reachable INTEGER NOT NULL DEFAULT 1 CHECK (is_reachable IN (0,1))`, `kind TEXT CHECK (kind IN ('normal','merge','revert','bot','bulk'))` 와 `author_matched INTEGER CHECK (author_matched IN (0,1))` — 둘은 TS 파생, NULL 허용.
   - 새 테이블(`git_commit` 뒤):
     ```sql
     CREATE TABLE commit_file (
       commit_id    INTEGER NOT NULL REFERENCES git_commit(id) ON DELETE CASCADE,
       path         TEXT    NOT NULL,
       old_path     TEXT,
       status       TEXT    NOT NULL CHECK (status IN ('A','M','D','R')),
       additions    INTEGER NOT NULL,            -- 공백 무시 diff 통계
       deletions    INTEGER NOT NULL,
       touched_json TEXT    NOT NULL,            -- [[from,to],…] 새 쪽 줄 범위
       PRIMARY KEY (commit_id, path)
     );
     CREATE INDEX ix_commit_file_path ON commit_file(path);
     ```
   - `file`: `content_sha256` → `content_hash TEXT`(git blob oid); 열 추가 `head_oid TEXT`, `is_dirty INTEGER NOT NULL DEFAULT 0 CHECK (is_dirty IN (0,1))`, `grammar TEXT`, `byte_size INTEGER NOT NULL DEFAULT 0`, `parse_quality TEXT CHECK (parse_quality IN ('ok','poor'))`, `skip_reason TEXT`. `lang` 주석 「TS 가 grammar 에서 파생」.
   - 새 테이블(`file` 뒤):
     ```sql
     CREATE TABLE capture (                      -- Rust 사실. TS 는 파일 단위로 읽어 concept_site 를 파생
       id            INTEGER PRIMARY KEY AUTOINCREMENT,
       file_id       INTEGER NOT NULL REFERENCES file(id) ON DELETE CASCADE,
       query_id      TEXT    NOT NULL,           -- 개념 id | '_imports' | '_blocks'
       match_id      INTEGER NOT NULL,
       pattern_index INTEGER NOT NULL,
       name          TEXT    NOT NULL,           -- site | pick.N | hole | ctx.<name> | import.source | block.function | block.name
       form          TEXT,
       node_kind     TEXT    NOT NULL,
       in_error      INTEGER NOT NULL DEFAULT 0 CHECK (in_error IN (0,1)),
       start_byte    INTEGER NOT NULL, end_byte INTEGER NOT NULL,
       start_line    INTEGER NOT NULL, end_line INTEGER NOT NULL,
       start_col     INTEGER NOT NULL, end_col  INTEGER NOT NULL,
       excerpt       TEXT    NOT NULL            -- ≤ 200자
     );
     CREATE INDEX ix_capture_file ON capture(file_id, query_id, match_id);
     CREATE INDEX ix_capture_query ON capture(query_id, file_id);
     ```
   - `unit` 주석 「탐지 규칙은 03 문서」 → 「03 §6.5」. `unit_node` 의 `PRIMARY KEY (unit_id, concept_id)` → `PRIMARY KEY (unit_id, concept_id, track)`.
   - `concept_site`: 주석 「텍스트는 저장하지 않는다」 → 「`excerpt` ≤ 200자만 저장」; 열 추가 `site_key TEXT NOT NULL`(sha1(concept, path, shape, occurrence)), `form TEXT`, `shape TEXT NOT NULL`, `occurrence INTEGER NOT NULL DEFAULT 0`, `excerpt TEXT NOT NULL`, `picks_json TEXT NOT NULL DEFAULT '[]'`, `hole_json TEXT`, `ctx_json TEXT NOT NULL DEFAULT '{}'`, `line_concepts_json TEXT NOT NULL DEFAULT '[]'`, `uncovered_ratio REAL NOT NULL DEFAULT 0`, `confidence TEXT NOT NULL DEFAULT 'syntactic' CHECK (confidence IN ('syntactic','heuristic'))`, `parse_quality TEXT NOT NULL DEFAULT 'ok'`, `is_dirty INTEGER NOT NULL DEFAULT 0`, `is_oversize INTEGER NOT NULL DEFAULT 0`; `CREATE UNIQUE INDEX ux_site_key ON concept_site(repo_id, site_key);`.
   - 새 테이블(`concept_site` 뒤):
     ```sql
     CREATE TABLE import_edge (                  -- TS 파생 (04 §7.1)
       repo_id      INTEGER NOT NULL REFERENCES repo(id),
       from_file_id INTEGER NOT NULL REFERENCES file(id) ON DELETE CASCADE,
       to_file_id   INTEGER NOT NULL REFERENCES file(id) ON DELETE CASCADE,
       kind         TEXT    NOT NULL CHECK (kind IN ('static','type','dynamic','http')),
       confidence   TEXT    NOT NULL DEFAULT 'syntactic' CHECK (confidence IN ('syntactic','heuristic')),
       PRIMARY KEY (from_file_id, to_file_id, kind)
     );
     CREATE INDEX ix_edge_to ON import_edge(to_file_id);
     CREATE TABLE block (                        -- T1 필사 단위 (04 §3.1), 원본 AST 캐시
       id          INTEGER PRIMARY KEY AUTOINCREMENT,
       repo_id     INTEGER NOT NULL REFERENCES repo(id),
       file_id     INTEGER NOT NULL REFERENCES file(id),
       rev         TEXT,                          -- NULL = 워크트리
       name        TEXT    NOT NULL,
       kind        TEXT    NOT NULL,              -- function | method | class | file | segment
       line_start  INTEGER NOT NULL, line_end INTEGER NOT NULL,
       text_hash   TEXT    NOT NULL,
       ast_json    TEXT,                          -- AstLite (parse_snippet 결과)
       is_alive    INTEGER NOT NULL DEFAULT 1 CHECK (is_alive IN (0,1)),
       updated_at  INTEGER NOT NULL,
       UNIQUE (file_id, line_start, text_hash)
     );
     ```
   - `card` 주석 추가: 「T1 의 `concept_id` = 블록 대표 개념(00 D27), T2 의 `concept_id` = `arch/placement|radius|flow|direction`」.
   - `mastery`: 열 추가 `transfer_from TEXT REFERENCES concept(id)`.
   - `appeal`: 열 추가 `pattern_key TEXT`, `engine_version TEXT`, `dict_version TEXT`, `norm_original TEXT`, `norm_user TEXT`, `reasons_json TEXT`; 주석 「T2 「이것도 맞다」 = `track='t2', auto_verdict='wrong-pick', user_text=파일 경로`」; `CREATE INDEX ix_appeal_pattern ON appeal(pattern_key, status);`.
   - 새 테이블(`appeal` 뒤):
     ```sql
     CREATE TABLE why_answer (                   -- T1 왜 게이트 (04 §6). 채점·겹 효과 없음
       id             INTEGER PRIMARY KEY AUTOINCREMENT,
       review_log_id  INTEGER NOT NULL REFERENCES review_log(id),
       card_id        INTEGER NOT NULL REFERENCES card(id),
       block_id       INTEGER REFERENCES block(id),
       line_no        INTEGER,
       question_id    TEXT    NOT NULL,           -- 'why_gate:<concept>' | 'missing:<line>' | 'differ:<line>' | 'generic'
       text           TEXT    NOT NULL,
       pick           INTEGER,
       pick_ok        INTEGER CHECK (pick_ok IN (0,1)),
       created_at     INTEGER NOT NULL
     );
     CREATE TABLE perf_sample (                  -- 06 §8, 최근 500행 순환
       id    INTEGER PRIMARY KEY AUTOINCREMENT,
       kind  TEXT    NOT NULL,                    -- ingest.total | ingest.file_p95 | queue | t1.grade | frame_p95
       ms    REAL    NOT NULL,
       n     INTEGER NOT NULL DEFAULT 1,
       at    INTEGER NOT NULL
     );
     ```
   - `gap`: 열 추가 `reason TEXT`(04 `no-plate` 사유).
   - `settings` 주석 키 목록에 `'motion' | 'identities' | 'exclude_globs'` 추가. `concept.lang` 주석에 `go react arch` 추가, `dictionary_version.lang` 도 같이. (D2·D6·D20~D30·D46)
4. §2.3 크기 표: 행 추가 「`capture` | 180,000(사이트당 ≈4) | 140 B | 25 MB」; `concept_site` 행 크기 「160 B」 → 「420 B(excerpt·json)」, 합계 「≈ 19 MB」; 총합 「≈ 12 MB」 → 「≈ 55 MB(WAL 피크 ×2)」. 문장 「텍스트를 넣지 않는 이유가 이것이다 — 스니펫 200 B 를 넣는 순간 16 MB 가 더 붙는다」 → 「`excerpt` 200자는 사다리 3단이 파일 읽기 없이 그려지는 값이라 감수한다(01 열린 질문 1 절충). 앞뒤 맥락 줄은 넣지 않는다」. (D2·D23)
5. §3.6 「개인화 시점: … Rust 쪽 `fsrs` 크레이트(fsrs-rs)로 로컬 최적화」 → 「개인화는 **MVP 이후**. TS `ts-fsrs` 의 옵티마이저 가용성을 확인한 뒤 TS 에서 주 1회 최적화(Rust `fsrs` 크레이트는 쓰지 않는다 — 01 §1.1)」. (D9)
6. §4 표 행 추가(「T0 정답 · 개념 첫 성공」 위): 「전이 첫 노출 | `mastery{layer:1, state:0, transfer_from}` 행 생성 | 없음 | 없음 | 로그 없음. 같은 `universal_id` 의 어떤 언어 개념이 **3겹 이상**일 때만. 카드 payload `transferFrom`」. (D4)
7. §5.1 상수 「`budget_min: 13`」 → `15`, 「`new_per_day: 4`」 → `2`. 위험표 「상한 6 하드코딩 + 4 초과 시」 → 「상한 4 하드코딩 + 2 초과 시」. (D12)
8. §6.1 코드 블록: `loadKnownSet` 의 「`r.layer >= 2 && r.universal_id`」 → 「`r.layer >= 3 && r.universal_id`」; `unknownCount` 함수와 그 SQL 삭제 → 「`unknownCount` 는 03 §3.6 의 함수를 `@chickadee/concepts` 에서 import 해 쓴다(입력 `ConceptSite.lineConcepts`·`uncoveredRatio`, 사전 선행 2단). 결과를 `concept_site.unknown_count` 에 캐시한다」. 예시 문장 「`const MAX = 10` → {ts/const, ts/number-literal} = **2**; … = **6**. `ts/const` 를 1겹 찍으면 각각 1·5」 → 「예시와 숫자는 03 §3.6 을 따른다(`const MAX = 10` → 0~1, `useState` 줄 → 3~4)」. 재계산 시점 문장은 유지. (D4·D24)
9. §6.3 「`concept.universal_id` 가 같은 다른 언어 개념이 2겹 이상이면 그 개념은 §6.1 에서 known 취급」 → 「… **3겹 이상**이면 첫 노출 때 `mastery` 행을 `layer=1, transfer_from=<그 개념>` 으로 만들고(§4 표) §6.1 에서 known 취급」. 나머지 유지. (D4)
10. §7.1 「다시 찍을 개념」·§7.3 SELECT 에 `s.excerpt` 추가. §7.3 아래 「코드 줄은 Rust 가 HEAD 파일에서 … 읽어 돌려준다(DB 에 텍스트 없음)」 → 「한 줄은 `excerpt` 로 그리고, 앞뒤 맥락이 필요할 때만 `file_read_lines(rev)` 를 부른다」. (D23)
11. §8.2 타입: `ConceptSite` 에 `siteKey form shape occurrence excerpt picks hole ctx lineConcepts uncoveredRatio confidence parseQuality isDirty isOversize` 추가; `Mastery` 에 `transferFrom: ConceptId | null`; `Settings` 에 `motion: 'system' | 'reduce'; identities: { email: string; name: string }[]; excludeGlobs: string[]`, `newPerDay` 기본 2, `budgetMin` 기본 15; `ReviewDetail.t1.disputedLines` → `appealedLines`; `Appeal` 에 `patternKey engineVersion dictVersion normOriginal normUser reasons` 추가; `Gap.reason: string | null`; `CardPayload.t0` 에 `promptLines: string[]`(focus±4, 사다리 4단용) 추가; 새 타입 `CommitFile`·`ImportEdge`·`Block`·`WhyAnswer`·`PerfSample`(열과 1:1), `Capture` 는 01 §3.1 을 import. (D4·D14·D23·D30·D46)
12. 열린 질문에 답 표기: 1→D3(회복만, 목업 수정은 05) · 2→D3(Again) · 3→D27 · 4→D27(반영 안 함) · 5→D12(04:00 · 15분 · 2장) · 6→D9(MVP 밖) · 7→02 안 채택 + E-4 합성 예제는 04 §1.4 `no-plate` 와 §6.2 대로 MVP 포함 · 8→TS 계산(Rust 함수 등록 안 함) · 9→D2(단수형, `excerpt` 채택, `capture`·`commit_file` 추가) · 10→D4 · 11→D24.
13. 체크리스트 「FSRS 개인화 잡 — Rust `fsrs` 크레이트로 주 1회 최적화, 채택 기준·롤백 (선행: 원장 1,000행 이상 · 01 크레이트 구성)」 → 「FSRS 개인화 잡 — **MVP 이후 · TS 우선**: `ts-fsrs` 옵티마이저 가용성 확인 뒤 주 1회 최적화, 채택 기준·롤백 (선행: 원장 1,000행 이상)」. 「미지 개념 계산 — `unknownCount`·known 집합·…」 → 「미지 개념 계산 — known 집합·전이(3겹)·증분 재계산·`gap` 갱신 (`unknownCount` 함수 자체는 03 항목)」. (D9·D24)

---

## 03 · 인제스트 · 파싱 · 문법 사전

1. 「이 문서의 위치」 「Rust 크레이트 `chickadee-ingest`(git2 + tree-sitter + rusqlite 쓰기)와 사전 저장소 `dictionary/` 가 이 문서의 산출물이다」 → 「산출물은 셋이다: Rust 사실 층(01 의 `crates/git`·`crates/parse` + `apps/desktop/src-tauri/jobs.rs`)의 **정책**, TS 파생 층 `packages/concepts`(캡처 → `concept_site`·`import_edge`·`block`·`unit`·`gap`), 사전 저장소 `dictionary/`. 이 문서에서 「chickadee-ingest」는 앞의 두 층을 합쳐 부르는 이름이지 크레이트가 아니다.」 다이어그램 「Site 레코드 ─ sqlite」 → 「capture ─ sqlite ─ TS derive ─ concept_site」. (D1)
2. §1.1 첫 문장에 「(01 `repo_register` 가 `discover` 를 수행한다)」 추가. (D44)
3. §1.2 「결과는 `commit.author_matched: bool` 로 저장」 → 「Rust 는 mailmap 을 적용한 `author_email`·`author_name` 을 `git_commit` 에 저장하고, 매칭 (2)~(4) 는 TS `packages/concepts/commits.ts` 가 `settings.identities` 로 판정해 `git_commit.author_matched` 파생 열에 쓴다」. (D21)
4. §1.3 분류 표 위에 「판정은 TS `commits.ts` 가 `parent_count·author_*·subject·files_n·insertions` 로 하고 `git_commit.kind` 에 쓴다. Rust 는 분류를 모른다」 추가. 파일 필터 목록 앞에 「아래 목록은 `packages/concepts/ingest-defaults.ts` 의 `EXCLUDE_GLOBS`·`GENERATED_MARKERS` 상수이며 `IngestSpec` 으로 Rust 에 전달된다. `linguist-generated` 는 Rust 가 `repo.get_attr` 로 본다」 추가. 「리포별 추가 제외 목록은 설정(sqlite, 02)에 둔다」 → 「`settings.exclude_globs`」. (D21·D46)
5. §1.4 `DiffOptions` 「`ignore_whitespace_eol(true)`」 → 「`ignore_whitespace(true)` — 포맷팅만 바뀐 파일은 0/0 이 되어 T2 후보에서 자연히 빠진다」. `CommitRec` 인터페이스 블록 삭제 → 「저장 형태는 02 `git_commit`(`kind`·`author_matched` 는 TS 파생 열) + `commit_file`(`path old_path status additions deletions touched_json`). TS 타입은 02 §8.2 `CommitFile`」. 「`files` 가 곧 T2 정답지의 재료」 → 「`commit_file` 이 곧 …」. (D21·D22)
6. §1.5 「2차 패스는 배경에서 … `repo.blame_file(…)` 로 한 번씩 돌리고」 → 「2차 패스는 TS `packages/concepts/blame.ts` 가 Site 가 있는 파일마다 01 `git_blame_lines{repoId, relPath, rev}` 를 배경에서 호출해 `BlameHunk[]` 로 `concept_site.commit_id` 를 채운다. Rust 쪽은 `blame_file(BlameOptions::newest_commit(HEAD).track_copies_same_file(false))`, 2초 초과 시 `GIT_BLAME_TIMEOUT` 이고 그 파일은 포기(경고 이벤트 아님, TS 로그)」. (D1)
7. §1.6 「`ingest_state { … }` 하나만 유지한다」 → 「상태는 02 `ingest_run` + `repo.head_sha` + `file.content_hash`(git blob oid) 뿐이다」. 3 「`reachable = false` 로 표시」 → 「`git_commit.is_reachable = 0`」. 4 「blob oid 가 같으면 건너뛴다」 → 「`file.content_hash` 가 같으면 건너뛴다(01 §3.3)」. 5 「Site 의 정체성은 … `id = sha1(concept, path, shape, occurrence)`」 → 「`concept_site.site_key = sha1(concept, path, shape, occurrence)`(TS 파생). 재파생 후 같은 key 는 갱신, 사라진 key 는 `is_alive = 0`」. (D20·D25)
8. §1.7 「`site.dirty = true`, `blob = "worktree"`」 → 「Rust 가 `file.head_oid` 와 `content_hash` 를 비교해 `file.is_dirty` 를 쓰고 TS 가 `concept_site.is_dirty` 로 복사한다. 카드의 `rev` 는 dirty 파일이면 `null`(워크트리)」. 「재스캔 시점은 … 세 곳」 뒤에 「— 셋 다 TS 가 `ingest_start{mode:'incremental'}` 를 부른다」. (D20)
9. §1.8 `IngestEvent` 코드 블록 삭제 → 「이벤트는 01 §3.2 의 `ingest_progress`(phase `walk|parse|git|write`) · `ingest_warning{jobId, relPath, reason}` · `ingest_done` · `ingest_error`. `reason` = `oversize | parse-poor | timeout | binary | generated | long-line`」. 「sqlite 는 200파일마다 트랜잭션 커밋」 → 「500행 tx(01 §3.3)」. 「`ingest_state.partial = true` 와 마지막 완료 커밋을 남겨」 → 「`ingest_run.status = 'cancelled'` 로 남기고, 다음 실행은 `incremental` 이 해시로 이어간다」. (D15·D25)
10. §2.1 표 제목 「문법(grammar)」, `.sql` 행 「`sequel`」 → 「`sql`(크레이트 `tree-sitter-sequel`)」. 「확장자가 없으면 첫 줄 shebang」 → 「확장자가 없으면 스킵(shebang 감지는 MVP 밖)」. 표 아래 문장 추가 「확장자 → grammar 는 TS `dictionary` 패키지가 `_lang.yaml.grammars`·`extensions` 로 `LangSpec` 을 만들어 Rust 에 넘긴다」. (D19)
11. §2.3 「사용처: `@site` 노드의 바이트 범위가 ERROR 와 겹치거나 조상 3단 안에 ERROR 가 있으면 **버린다**」 → 「Rust 는 캡처마다 `inError`(ERROR 겹침 또는 조상 3단 안 ERROR)만 표시하고, 버리는 것은 TS `derive.ts` 가 한다」. 파일 판정 문장 끝에 「값은 `file.parse_quality` 에 쓴다」. (D18)
12. §2.4 「`rayon` 풀(`num_cpus - 1`, 최소 2)」 → 「parse 풀 `min(4, cores − 1)`(01)」. 「결과 Site 는 채널로 모아 메인 스레드가 200개씩 sqlite 에 쓴다」 → 「캡처는 500행 tx 로 쓴다(01 §3.3)」. 「크레이트 공개 API 에 `parse_snippet(grammar, text) -> Tree` 를 둔다」 → 「01 `parse_snippet` 명령(`AstLite`)을 쓴다」. (D26)
13. §2.5 표 「> 5,000 줄 | 파싱은 하되 `oversize = true`」 → 「… TS 가 `file.line_count` 로 `concept_site.is_oversize` 를 세운다」; 「`@site` 가 12줄 초과 | Site 는 남기되 카드 대상 제외」 → 「… `is_oversize = 1`, 카드 대상 제외(TS)」.
14. §3.1 「숙련도를 어느 id 에 매달지는 02 가 정한다(열린 질문 1)」 → 「겹은 **언어 개념 id** 에 쌓인다. 전이(같은 `universal` 이 3겹 이상이면 1겹 애벌로 시작 + 「표기 차이」 카드 우선)는 02 §6.3」. 문단 추가 「**구조 개념 `arch/`**: T2 의 숙련도 키. `dictionary/arch/{placement,radius,flow,direction}.yaml` 4개, 필드는 `id·name·dict·rule·ok·track_default: t2` 만, `queries: []`, `kind='universal'`, 전 언어 공용」. (D4·D27)
15. §3.2 캡처 표 뒤에 절 추가 「**시스템 쿼리(언어당 2파일)**: `_imports.scm` — 패턴마다 `@import.source`(지정자 문자열 노드) 1개와 `(#set! form "static"|"type"|"dynamic"|"require")`; `_blocks.scm` — `@block.function`(04 §3.1 표의 노드) 1개 + `@block.name` 0~1개. 캡처 이름 정규식 `^(site|pick\.[1-9]|hole|ctx\.[a-z_]+|import\.source|block\.(function|name))$`. 경로 해석·블록 분절은 TS(04)」. 「매치 정렬은 `(span.start, span.end)` 오름차순」 뒤에 「(TS `derive.ts` 가 `match_id`·`start_byte` 로 정렬)」. (D18·D22)
16. §3.3 첫 문장 「Rust 가 만들고 sqlite 에 쓴다. TS 는 읽기만 한다」 → 「TS `packages/concepts/derive.ts` 가 `capture` 행(01 `Capture`, 파일 단위 페이지)에서 만들어 `concept_site` 에 쓴다. Rust 는 캡처만 쓴다」. `interface Site` → 「TS 타입은 02 §8.2 `ConceptSite` 가 정본」으로 바꾸고 아래 매핑 표를 둔다: `id`→`siteKey` · `concept`→`conceptId` · `path`→`fileId`(+`file.path`) · `blob`→`file.contentHash` · `line`→`lineStart` · `lineSpan`→`lineStart/lineEnd` · `span`→(삭제, 캡처 행에 있음) · `text`→`excerpt`(≤ 200자) · `context`→(저장 안 함, 카드 생성 때 `file_read_lines(rev)` 로 읽어 `payload.lines`·`payload.promptLines` 에) · `picks`→`picks` · `hole`→`hole` · `ctx`→`ctx` · `lineConcepts`·`uncoveredRatio`·`shape`·`confidence`·`parseQuality` 그대로 · `dirty`→`isDirty` · `oversize`→`isOversize` · `stale`→`isAlive=false` · `commit`→`commitId`. (D1·D23)
17. §3.4 「실행 절차 (파일 하나)」 → 두 층으로 재작성: 「Rust(01 §3.3): 언어 감지된 파일을 파싱 → 등록된 모든 쿼리 실행 → 캡처를 `match_id`·`pattern_index`·`form`·`in_error`·행/열과 함께 저장 → `parse_quality` 저장 → 트리 폐기. TS `derive.ts`(파일 단위): 캡처를 `match_id` 로 묶고 `inError` 인 `site` 매치 폐기 → 맥락 패턴 ctx 병합(Site 자체 ctx 우선) → 행 인덱스로 `lineConcepts`·`uncoveredRatio` → `shape`(04 §0 토크나이저로 `id`→`_`, 리터럴→`#`) → `(concept, path, shape)` 별 `occurrence` → `site_key` → `concept_site` upsert」. (D1)
18. §3.6 「(TS, 값은 Rust 가 준비)」 → 「(TS, 값은 `derive.ts` 가 준비)」; 시그니처 `unknownCount(site: ConceptSite, …)`. 이 절이 공식의 정본임을 한 줄로: 「02 `unknown_count` 는 이 함수의 캐시다」. (D24)
19. §4.1 트리에 `arch/placement.yaml …`, `ts/_imports.scm`, `ts/_blocks.scm` 추가. (D17·D22·D27)
20. §4.3 「HTML 은 `<code> <b> <kbd>` 만 허용」 → 「`<code> <b> <i> <em> <br> <kbd>` 6종(06 §4.2 와 같은 목록), 속성 0」. (D39)
21. §4.4 필드 목록에 추가:
    ```yaml
    why_gate:                                   # 선택 · T1 왜 게이트 문항 (04 §6)
      q: "이 줄이 없으면 무엇이 달라질까요?"
      help: "…"
      choices: [ { t: "…", ok: true, fb: "…" }, { t: "…", ok: false, fb: "…" }, { t: "…", ok: false, fb: "…" } ]   # 3개, ok 정확히 1개
    ```
    `_lang.yaml` 예시(§6)에 추가:
    ```yaml
    diag_default:          # point[].diag 가 없는 pick · blank 폴백 진단 (04 §2.1)
      point: "«{{pick}}» 은 {{role}} 자리입니다. {{concept}} 는 «{{answer}}» 입니다. {{rule}}"
      blank: "«{{pick}}» 은 이 자리에 오지 않습니다. {{rule}}"
    ```
    린트 규칙 문장에 「`why_gate.choices` 는 3개·`ok` 1개」 추가. (D6)
22. §5.1 「`cargo test -p chickadee-ingest --test dictionary`(Rust) 가 검사하는 것」 → 「`crates/parse/tests/dictionary.rs`(테스트 전용 `serde_yaml` dev-dependency, 예산 밖)가 검사하는 것: 모든 `.scm` 컴파일 · 캡처 이름 정규식 · 패턴마다 `@site` 1개(맥락 패턴은 `@ctx.*` 만; `_imports`·`_blocks` 는 각자 규약) · 죽은 패턴(모든 `examples` 에서 0매치) · `examples[].code` 의 캡처를 `fixtures/ipc/dict-examples/<id>.json` 로 덤프. Site 수준 `expect`(sites·form·picks·hole·ctx) 는 `pnpm dict:test`(vitest)가 그 덤프에서 `derive.ts` 로 파생해 비교한다」. 「Rust 는 `id`·`grammars`·`queries` 만 serde 로 읽는다」 → 「Rust 앱 코드는 YAML 을 읽지 않는다(01). `LangSpec` 은 TS 가 만든다」. (D40)
23. §5.3 「사전 별도 배포(앱 업데이트 없이 갱신)는 06 의 결정」 → 「MVP 는 번들만, 사용자 오버라이드 `dict-user/<lang>/`(00 §6-6 기본값)」.
24. §6 `_lang.yaml` 예시에 `diag_default`(위 21) 추가. 「오늘 큐 앞에 삽입(data.js `QUEUE` 의 `sub:'새 판'`). 큐 삽입과 FSRS 초기화는 02」 → 「02 §5.5 `role='gap'` 으로 삽입」.
25. 신설 **§6.5 대지(unit) 탐지** (D29): 「TS `packages/concepts/units.ts`, 인제스트 파생 때 실행. `source='dir'` 만 MVP. 규칙(첫 매치): ① `features/<x>/**` → 대지 `x` ② `app/<seg>/**`·`pages/<seg>/**`(Next 라우트 첫 세그먼트, `api` 는 제외) → 대지 `seg` ③ `src/<x>/**`(`x` 가 `lib·utils·types·components/ui` 가 아닐 때) → 대지 `x` ④ 그 밖은 인제스트 파일 ≥ 3 인 2단계 디렉터리 → 디렉터리명. 어디에도 안 들면 대지 「기타」. `unit_file` 은 파일→대지 1:1. `unit_node` = 대지 파일에 살아 있는 사용처가 있는 T0 개념 + 대지 블록의 대표 개념(T1) + `arch/*` 4개(T2, 후보 커밋 ≥ 3 또는 그래프가 있을 때). `order_idx` 는 02 §6 위상 정렬(대지 개념의 최소 위상). `commit-cluster` 는 MVP 밖」.
26. §7 「`fixtures/repo-100k` … `fixtures/repo-poly`」 → 「`fixtures/repos/large-100k.steps`(생성 스크립트) · `fixtures/repos/poly.steps`(언어당 20파일)」; 「`chickadee-cli ingest <path> --bench`」 → 「criterion 벤치 `apps/desktop/src-tauri/benches/ingest.rs` 가 jobs 를 직접 불러 단계별 ms·피크 RSS 를 JSON 으로 내고 `scripts/bench.sh` 가 `bench/baseline.json` 과 비교」; 피크 메모리 「≤ 400 MB」 → 「≤ 300 MB(01)」. (D35·D36·D37)
27. §8 골든 「`<case>.expected.json`(Site 배열에서 `id`·`blob`·`commit` 제외). `cargo test` 가 비교」 → 「`.expected.json`(`ConceptSite` 배열에서 `siteKey`·`fileId`·`commitId` 제외). Rust 는 같은 파일의 **캡처**를 insta 스냅샷(`crates/parse/tests/snapshots/`)으로 고정하고, Site 비교는 vitest(`pnpm dict:test`)가 캡처 덤프에서 파생해 한다」. (D36·D40)
28. 열린 질문에 답 표기: 1→D4(언어 id) · 2→00 §6-2(기본 보류) · 3→00 §6-3(기본 허용) · 4→00 §6-5 · 5→D1(캡처는 직접, Site 는 TS) · 6→00 §6-6(번들만) · 7→D5.
29. 체크리스트 설명(「 — 」 뒤) 재작성, 제목 유지:
    - 「크레이트 골격 `chickadee-ingest` — …」 → 「— `packages/concepts` 파생 층 골격(`derive.ts`·`commits.ts`·`ingest-defaults.ts`): identity 매칭·커밋 분류 `kind`·필터 기본값 상수 + 단위 테스트 (선행: 01 `ipc-client`·`dictionary` 패키지)」
    - 「diff hunk → `CommitRec` — …」 → 「— Rust `git` 크레이트 안: 리네임 감지·`touched_json` 압축·공백 무시 통계·`commit_file` 쓰기, 임시 리포 테스트 (선행: 01 `git` 크레이트)」
    - 「문법 크레이트 고정 + 언어 감지 + 파서 풀 — …」 → 「— Cargo 핀·feature·ABI 검사, `parse_quality`, `thread_local` 파서, 타임아웃(01 `parse` 크레이트 안); 확장자 표는 TS `dictionary` (선행: 01 `parse` 크레이트)」
    - 「쿼리 실행기 — …」 → 「— Rust: `.scm` 로드·`inError`·`match_id` 저장(01 `parse` 안) / TS `derive.ts`: 매치 그룹화·ERROR 폐기·ctx 병합·`lineConcepts`/`uncoveredRatio`/`shape`/`site_key` (선행: 01 `parse` 크레이트, 04 토크나이저)」
    - 「sqlite 쓰기·증분 — `ingest_state`, 200파일 배치, …」 → 「— TS 재파생 증분(바뀐 파일만)·`site_key` 유지·`is_alive`, Rust `is_reachable` rebase 처리 (선행: 02 DDL 확정, 01 잡 러너)」
    - 「워킹트리 스캔 + 진행률 채널 + 취소·이어하기」 → 「— Rust `head_oid`/`is_dirty`, `ingest_warning` 이벤트, TS 재스캔 3시점 트리거, 취소 후 증분 재개 검증 (선행: 01 잡 러너)」
    - 「blame 2차 패스 — 배경 실행, 파일당 2초 컷, `site.commit` 채움」 → 「— 01 `git_blame_lines` 명령 + TS `blame.ts` 배경 잡, 파일당 2초 컷, `concept_site.commit_id` 채움 (선행: 01 파일 맥락 명령)」
    - 「성능 픽스처·벤치 — `repo-100k` 생성기, `--bench`, CI 임계」 → 「— `large-100k.steps` 생성기, criterion 벤치, CI 임계」
    - 「골든 픽스처 — …」 뒤에 「(Rust insta 캡처 + TS Site 비교)」.

---

## 04 · 채점 엔진

1. §0 「`type Lang = 'ts'|'tsx'|…`」 → 「`type Grammar = 'typescript'|'tsx'|'javascript'|'python'|'go'|'rust'|'swift'|'dart'|'sql'`」, 본문의 `lang` 인자를 `grammar` 로. 「03 §3.3 Site — 사용처 레코드. 채점기가 쓰는 필드: `concept · path · line · lineSpan · text · context{…}` …」 → 「02 §8.2 `ConceptSite`: `conceptId · fileId · lineStart · lineEnd · excerpt · picks · hole · ctx · lineConcepts · shape · confidence · parseQuality · commitId`(맥락 줄은 없음 — §1 참조)」. 「(요청) why_gate{…} — §6 · 열린 질문 3」 → 「03 §4.4 `why_gate`(확정)」. (D19·D23·D6)
2. §1 「맥락 줄 = `context.before(4) + text + context.after(4)` 중 **초점 ±2 만 카드에** …, 나머지 4줄은 사다리 4단 프롬프트용」 → 「맥락 줄은 카드 생성 시 01 `file_read_lines(repoId, relPath, focus−4, focus+4, rev)` 로 한 번 읽어 `payload.lines`(±2, 목업 5줄)와 `payload.promptLines`(±4, ≤ 9줄)에 굽는다. `rev` 는 `file.is_dirty` 면 `null`」. §1.3 「`Site.confidence === 'heuristic'`」 → `site.confidence`. (D23)
3. §2.2 `T0Answered` 에서 `lyFrom:number; lyProposed:number` 삭제, `outcome:'ok'|'wrong'|'dunno'` 추가. 문단 「`lyProposed` 는 목업 규칙(…)으로 계산해 **제안**만 한다. 저장·FSRS 반영·큐 삽입(…)은 02 규칙」 → 「겹·FSRS·큐 삽입은 02 §3.3 `applyOutcome`·§4 표가 `outcome`·`retry`·`prereq`·`fresh` 로 계산한다. 엔진은 겹을 제안하지 않는다(다시 찍기 정답 = 회복만, 목업 `t0.js:146` 과 다름)」. `t1.graded`(§4.6)·T2 이벤트도 같은 방식으로 `lyFrom/lyProposed` 삭제. (D3)
4. §2.4 표 3단 「`Site.text` 한 줄 + `path:line`(파일 읽기 없음)」 → 「`concept_site.excerpt` + `file.path:line_start`」. 프롬프트 규약 「헤더 `파일 {file} {focus}행 근처입니다.` → 코드 펜스에 **`context.before(4) + text + context.after(4)`**」 → 「헤더 `파일 {file.base} {focus}행 근처입니다.`(**base name 만**; 디렉터리 경로·리포명·커밋 메시지·작성자는 넣지 않는다 — 06 §3.3) → 코드 펜스에 `payload.promptLines`(≤ 9줄)」. 끝 문장 「다른 파일·다른 줄·리포명은 넣지 않는다」 유지. (D8)
5. §3.1 「블록 후보는 03 쿼리의 `block.function` 캡처(01 열린 질문 3 규약)로 들어온다」 → 「블록 후보는 03 §3.2 `_blocks.scm` 의 `@block.function`(+`@block.name`) 캡처로 들어온다」. 「원본 AST 는 블록 선정 시 `parse_snippet` 으로 **미리 파싱해 캐시**한다」 → 「… 파싱해 02 `block.ast_json` 에 캐시한다」. 규칙 문단 끝에 추가 「**블록 카드의 `concept_id`(숙련도 키)** = 블록 안 Site 개념 중 `_lang.yaml.essential` 에 있고 사전 `difficulty` 가 가장 높은 것, 동률은 Site 수 많은 것. 나머지 개념은 `card_concept(role='secondary')` 로만 기록(겹 반영 없음)」. (D14·D18·D27)
6. §4.6 「`pct ≥ 85 → advance`(다음 단계, `lyProposed +1`)」 → 「`pct ≥ advanceThreshold(total) → advance`, `advanceThreshold(total) = min(85, 100 − 200/total)`(12줄 블록 83.3, 14줄 85.7→85). `65 ≤ pct` 는 그대로」. `T1Row.disputed?` → `appealed?`, `T1Result.disputes` → `appeals`. (D14·D4)
7. §5 `interface Dispute {…}` → `interface Appeal`: 02 §8.2 `Appeal` 에 `patternKey engineVersion dictVersion normOriginal normUser reasons: Reason[]` 를 더한 형태; `state:'held'|'proposed'|'accepted'|'rejected'` → `status:'open'|'accepted'|'rejected'`, 「`proposed`」 는 「같은 `patternKey` 의 open 이 3건 이상」이라는 파생 상태로 문장화. 「02 의 `disputes` 테이블에 저장」 → 「02 `appeal` 테이블에 저장」. (D4·D30)
8. §6 「저장(02 `why_answers`): `{blockId, line, questionId, text, pick?, pickOk?, createdAt}`」 → 「저장(02 `why_answer`): `{reviewLogId, cardId, blockId, lineNo, questionId, text, pick?, pickOk?, createdAt}`, `questionId` 는 `why_gate:<concept>` | `missing:<line>` | `differ:<line>` | `generic`」. (D30)
9. §7.1 「Rust 는 캡처 `import.source`(원문 지정자, 01 열린 질문 3)만 저장하고」 → 「Rust 는 `_imports.scm` 캡처(`import.source`, `form` = static/type/dynamic/require)만 `capture` 행으로 저장하고」; 결과는 「02 `import_edge` 에 쓴다(`kind`·`confidence`)」 추가. (D18·D22)
10. §8.1 「`F = 커밋 변경 소스 파일 (03 CommitRec / 01 CommitFileDiff)`」 → 「`F = commit_file WHERE commit_id` 중 소스 파일」. 후보 커밋 조건 첫머리에 「`git_commit.kind='normal' ∧ author_matched=1 ∧ is_reachable=1`」 명시. 「공백 무시 diff 가 빈 파일(포맷팅)은 변경 집합에서 제외」 → 「`additions+deletions = 0` 인 파일(통계가 이미 공백 무시) 제외」. (D5·D21)
11. §8.4 「02 `t2_feedback {problemId, commit, extraFiles, createdAt}` 에 저장」 → 「02 `appeal(track='t2', auto_verdict='wrong-pick', user_text=파일 경로, review_log_id, card_id)` 에 파일마다 1행 저장」; 「같은 파일이 **3회** 누적되면」 → 「같은 `(card_id, user_text)` open 행이 3개면」. (D30)
12. 위험표 「06 의 시크릿 스캔은 붙이지 않음」 유지. 「「미지 개념 개수」(03) 지연 시」 유지.
13. 열린 질문에 답 표기: 1→D3(02 채택, `lyProposed` 폐기; T1 4겹 = 3단계 통과 확인) · 2→D14(채택) · 3→D6(둘 다 채택) · 4→D5 · 5→D14(`block.ast_json`; 01 `AstLite.kind` 에 `'ERROR'` 유지) · 6→D14(T1 만 완충, T2 wrong 상한 유지) · 7→06 §7.3 필드 + opt-in 문구 「원본·답안 두 줄을 포함합니다(기본 꺼짐)」.
14. 체크리스트 설명 수정(제목 유지): 「T1 결과·점수·이의 — 데이터 모델, 판정 임계, Dispute·patternKey·카탈로그·이슈 URL」 → 「… Appeal·patternKey·…」; 「사다리 데이터 조립기 — 4단 데이터, prereq 상태 판정, 프롬프트 규약 ±4줄」 → 「… 프롬프트 규약 ±4줄·base name」; 「T2 정답지 도출 — 커밋 후보 필터, …」 → 「— `commit_file`·`kind`·`author_matched` 로 후보 필터, …」; 「T1 블록 선정·마스크 — …」 끝에 「대표 개념 선정」 추가.

---

## 05 · 프런트엔드

1. §1.2 「IPC 는 `src/ipc/commands.ts` 의 타입 래퍼로만 부른다: `invoke` 직접 사용은 `ipc/` 밖에서 린트 금지」 → 「IPC 는 01 의 `@chickadee/ipc-client` 로만 부른다. `@tauri-apps/api/core` import 는 `packages/ipc-client` 밖에서 린트 금지」. 「`src/data/*.ts` 의 리포지토리 함수로, `01` 의 `store_batch/store_query` 를 통해」 → 「`apps/desktop/src/data/*.ts` 의 리포지토리 함수로, `ipc.store.query/batch` 와 01 §3.4 statement 이름을 통해」. CSP 문장 끝에 「(06 §4.3 에 `worker-src` 가 반영됐다)」. (D43·D7)
2. §2.1 `ingest` 행 「단계 4(git 읽기 · 파싱 · 개념 추출 · 판 짜기)」 → 「단계 4 = Rust `walk·parse·git·write` 를 「git 읽기」「파싱」 2칸으로, TS 파생 `derive`·`cards` 를 「개념 추출」「판 짜기」 2칸으로. blame 은 배경(표시 없음)」. `settings` 행 내용에 「내 커밋 identity(`email·name` 목록, 첫 열기 때 `git config` + author 상위 5명 자동 제안, 03 §1.2)」 추가. (D46·D47)
3. §2.4 「최소 1000×680」 문단 첫머리에 「(확정 — 00 D11)」.
4. §3 코드 블록: `RepoSummary.id`·`activeId`·`QueueItem.id/cardId/parentId`·`SessionSlice.repoId` 를 `number` 로, `runId: string` → `sessionId: number`, `t1Draft.cardId: number`. 「`lyTo` 계산·큐 삽입 위치(`pos+3`)·FSRS 는 **`packages/core`(순수 TS)**. 프런트는 `core.gradeT0(card, choice)` 를 부르고」 → 「판정은 `@chickadee/grading`(`gradeT0`), 겹·큐 삽입(`pos+3`)·FSRS 는 `@chickadee/scheduler`(`applyOutcome`·`insertRetry`). 프런트는 `grading.gradeT0(card, choice)` → `scheduler.applyOutcome(mastery, outcome)` 순으로 부르고」. 문장 추가 「**목업과 다름**: `t0.js:146` 은 다시 찍기 판 정답에도 `+1겹` 을 표시하지만 앱은 02 §3.3(회복만)을 따른다. `gain` 문구(「잉크 N겹 · 다음 인쇄 …」)는 `applyOutcome` 결과로만 그린다」. 「목업 `?reset=1` 은 요약의 「오늘 판 다시 보기」(= `session.discard`)로만 남긴다」 → 「요약의 「오늘 판 다시 보기」는 `review_log` 를 읽기 전용으로 다시 그린다. `?reset=1` 은 DEV 전용」. (D3·D33·D43)
5. §4.1 표: `--yellow-text` 주간 「#6B4600」 → 「**#664300**」, 비고 「(**paper-3 위 6.82:1** — 열린 질문 1)」 → 「(paper-3 위 7.20:1, 확정)」. 행 추가 「`--verdict-exact` / `--verdict-equiv` / `--verdict-differ` | #FF2E7E / #1250C8 / #C08F00 | #FF3A86 / #3B82FF / #C09600 | 판정 색(도장·거터 틱·`.rtag`) — 트랙 색과 독립 | ✗(면)」. `--dee-k/…` 행 「미사용 … 삭제」 → 「삭제 확정」. (D11)
6. §4.3 문단 끝에 「Linux(WebKitGTK)는 `data-trim` 기본 `on`(D12); macOS·Windows 는 `off`」.
7. §5 표: `.node` 행 접근성 열 끝에 「잠긴 노드는 흔들지 않고 상세에 이유만 연다」; `.score …` 행 상태 「disputed」 → 「appealed」, props 「`disputed`, `onDispute`」 → 「`appealed`, `onAppeal`」; `.whybox` 역할 열에 「저장 = 02 `why_answer`」. (D4·D11)
8. §6 「`peek` 은 목업에서 `infinite` — … `iteration-count: 2`(3.2s)로 바꾼다(열린 질문 2)」 → 「… 로 바꾼다(확정, D11)」.
9. §7 표: T0 미답 `1~4` 행 충돌 해결 열 「…」 뒤에 「(확정)」; T1 `Tab` 행 「(**3단계에선 자동 들여쓰기만 제거, Tab 은 유지**)」 뒤에 「(확정)」; 홈 `Enter` 행 「(포커스가 버튼/링크/입력이 아닐 때만)」 → 「(포커스가 `main` 일 때만)」.
10. §10 표 「상시 애니메이션 | 0개 — … **정적/유한**으로 (열린 질문 2)」 → 「… (확정: `blink` → 정적 점선 + 「오늘」 라벨, `spin` → 정지 점선 링, `peek` → 2회)」.
11. §11 「`tauri-driver` 는 Linux/Windows 만 지원하므로 … CI 는 Linux `xvfb` 에서 `tauri-driver` 스모크 1개(창 뜸 · 홈 렌더 · Esc)만 돈다」 → 「실 바이너리 E2E 는 06 §1.5 의 E1~E8(Linux, PR 차단, `retries:1`)이 맡는다. 이 문서의 15 시나리오는 `mockIPC` 로 chromium·webkit 에서 돌며 PR 차단, `retries:0`」. 「`tests/fixtures/run08.json`」 → 「`fixtures/ui/run08.json`」. 시나리오 7 「20줄 중 18 의미 일치 · 동등 5 · 이름 맞바꿈 1 · 누락 1」 → 「비공백 줄 기준 — 단언 숫자는 04 §9 골든 픽스처 값을 그대로 쓴다」. §9 표의 「`tests/a11y/measure.spec.ts`」 → 「`tests/gates/measure.spec.ts`」. (D14·D34·D36)
12. §12 「`compareLine/sim`(→ `04` 의 정규식 폴백으로 `core` 에)」 → 「(→ `@chickadee/grading` 의 정규식층)」. (D43)
13. 열린 질문 1~8 에 답 표기: 전부 「→ 결정: D11」 + 값(1 `#664300` · 2 유한화 3건 · 3 흔들지 않음 · 4 Tab 유지 · 5 포커스가 사다리 안일 때만 · 6 1000×680 · 7 `main` 포커스일 때만 · 8 신설).
14. 체크리스트 설명 수정(제목 유지): 「인쇄 완료 요약 — `Summary` 전부, 「오늘 판 다시 보기」=discard」 → 「… 「오늘 판 다시 보기」= 읽기 전용」; 「목업 정리 — `design/src/ink/tokens.css` 분리·홈을 `build.py` 로 이전(README 미결 항목), `.ladder` 개명 반영, 열린 질문 1·2·3 결정 반영」 → 「목업 정리 — `design/src/ink/tokens.css` 분리·홈을 `build.py` 로 이전, `.ladder` 개명, 그리고 앱과 어긋난 목업 동작 수정: `t0.js:146` 다시 찍기 판(`T.retry`)은 `lyTo = lyFrom`(문구 「원래 겹으로 돌아옴」) · `t0.js:268` 프롬프트 헤더 `c.file` → base name · `t2.js:140` `66` → `65` · `t1.js:180` `total` 비공백 줄 · `blink`/`spin`/`peek` 유한화 · 잠긴 노드 `shake` 제거 · `--yellow-text #664300` · `--verdict-*` 별칭 · Google Fonts `<link>` 는 목업 전용 주석」; 「E2E 15 시나리오 … Linux `tauri-driver` 스모크」 → 「… (실 바이너리 E2E 는 06 Q15)」.

---

## 06 · 품질 · 보안 · 릴리스

1. 「읽는 순서 / 전제」 「이 문서는 `src-tauri/`(Rust), `src/`(TS), `dictionaries/`(YAML), … 만 참조한다. 이름이 다르면 01 을 따르고」 → 01 레이아웃으로 본문 전체 치환: `src-tauri/` → `apps/desktop/src-tauri/`, `src/**` → `packages/*`·`apps/desktop/src`, `dictionaries/` → `dictionary/`, `src-tauri/migrations/` → `packages/store-sql/migrations/`, `src-tauri/tests/golden/` → `crates/parse/tests/`, `src/grading/**`·`src/schedule/**`·`src/cards/**`·`src/dictionary/**`·`src/ui/**` → `packages/grading`·`packages/scheduler`·`packages/cards`·`packages/dictionary`·`packages/ui`, `src/devtools/audit.ts` → `apps/desktop/src/devtools/audit.ts`. (D16)
2. §1.2 「내용은 「추출된 개념 사용처 목록」 `{concept_id, line, col_start, col_end, node_kind, universal|lang_specific}`」 → 「내용은 **캡처 목록** `{queryId, matchId, patternIndex, name, form, startLine, startCol, endLine, endCol, nodeKind, inError}` — Rust 는 Site 를 모른다. Site 골든은 03 §8(TS)」. 픽스처 3종 문장에 「+ `large-100k`(벤치 전용, 생성 스크립트) · `poly`(언어당 20파일)」. 「`.steps`만 커밋」 유지. (D1·D36)
3. §1.3 「`src/grading/__golden__/t1/*.json`」 → 「`packages/grading/src/__golden__/t1/*.json`」; property (b) 「다음 인쇄 간격은 `[오늘, 내일, 3일, 9일, 3주]` 밖으로 안 나감」 → 「`labelFor(due)` 는 5개 라벨 중 하나」; 「`buildQueue(db_snapshot, date, seed)`」 → 「`planSession(repoId, now)`(시드는 `seedOf`)」.
4. §1.4 「`src-tauri/tests/pipeline.rs`」 → 「`apps/desktop/src-tauri/tests/pipeline.rs`」; 덤프 내용에 「`capture` 페이지(`derive.captures_by_file`)」 추가.
5. §1.5 E2 「경로가 sqlite `repos`에 저장」 → 「`repo`」. 「Windows는 첫 릴리스 뒤로 미룬다(열린 질문 4)」 → 「Windows 는 릴리스 스모크로 대체, 0.2 에서 재검토(D13)」. (D13)
6. §1.6 표 교체(D35): 「인제스트 10만 줄 | criterion `large-100k` | p50 ≤ 15s(M1) | CI p50 > 22.5s 경고, > 30s 실패; RSS > 450 MB 경고, > 600 MB 실패」 · 「홈 49노드 렌더 | … | p95 ≤ 12ms(3 WebView) | Chromium p95 > 12ms 실패, WebKit 보고 전용」 · 「T1 판정 지연 | vitest bench | 비교 엔진 20줄 < 20ms · 40줄 < 35ms · 거터 0.2ms/줄 | 2배」. 나머지 행 유지.
7. §1.7 「기준선은 **Linux Chromium 하나** … 대상 6장」 → 「기준선은 Linux 1 OS × 엔진 2(chromium·webkit) × 주간/야간 × 10장 = 40장(05 §11), 갱신은 라벨 `visual-ok` PR」. (D34)
8. §1.8 표 경로를 1 대로 치환(`packages/grading`·`packages/scheduler` 95% · `packages/dictionary` 90% · `packages/cards`·`packages/concepts` 85% · `crates/*` + `src-tauri` 80% · `packages/ui` + `apps/desktop/src` 60%).
9. §3.1 표: `<app_data>` 경로 「`com.chickadee.app`」 → 「`dev.chickadee.app`」(세 OS 모두), 「`<app_data>/chickadee.sqlite`」 → 「`chickadee.db`」, 「`<app_data>/cache/dict-<hash>.json`」 → 「`dict-cache/{lang}@{version}.json`」, 로그 「`<app_log>/chickadee.log` (5MB×3 순환)」 → 「`<app_data>/logs/chickadee.log` (5 MiB×5 회전)」, 설정 행 「`<app_data>/settings.json`」 → 「`settings` 테이블(DB 안, 별도 파일 없음)」, 학습 DB 「코드 내용 포함: 예(카드 발췌·필사 초안)」 → 「예(캡처·사용처 excerpt ≤ 200자·카드 발췌·필사 초안)」. (D38)
10. §3.2 「목업은 Google Fonts CDN을 쓰지만 … 05-frontend.md와 충돌 지점이라 「열린 질문」에 올린다」 → 「목업은 CDN 을 쓰지만 앱은 05 §1.4 대로 번들한다(합의됨)」. (D7)
11. §3.3 규칙 2 「**파일 경로·리포명·커밋 메시지·작성자 제외.** 프롬프트 첫 줄은 … `내 코드 중 한 곳(<행>행 근처)`으로 바꾼다」 → 「**디렉터리 경로·리포명·커밋 메시지·작성자 제외. 파일 base name 은 허용.** 첫 줄은 `파일 {file.base} {focus}행 근처입니다.`(04 §2.4)」. 규칙 5 테스트 「`/`·`\` 포함 경로 문자열 없음」 유지. §3.6 노트 「(파일 이름 없이)」 → 「(폴더 경로 없이, 파일 이름만)」. (D8)
12. §3.4 「허용: 리포 id(`sha256(경로)[..8]`)」 → 「허용: `repoId`(정수)」. (D38)
13. §4.1 표 「파일당 1MB·행당 20k자 초과는 건너뜀, tree-sitter `set_timeout_micros(200_000)`, 중첩 깊이 512 초과 시 파일 포기」 → 「파일 512 KiB·행 20,000바이트 초과는 건너뜀(`IngestSpec.maxFileBytes/maxLineBytes`), 파서 타임아웃 2s(01·03), `AstLite` 깊이 512 초과는 `PARSE_TOO_DEEP`」; 「파일 50k개·총 5GB 상한」 → 「`maxFiles 50000`」; 「`walkdir` `follow_links(false)`」 → 「`ignore::WalkBuilder` `follow_links(false)`」; 「`scripts/forbid.sh`의 grep」 → 「`scripts/check-rust-budget.sh` 의 grep」. (D26·D41)
14. §4.2 「`dictionaries/schema.json`」 → 「`dictionary/schema/concept.schema.json`」. 「**템플릿 인젝션**: 표현식 평가 엔진을 쓰지 않는다. 치환은 `{{line}}`·`{{ident}}`·`{{file_line}}` 3개 플레이스홀더의 단순 문자열 교체」 → 「**템플릿 인젝션**: 표현식 평가 엔진을 쓰지 않는다. 문법은 03 §4.3 의 mustache 부분집합(변수 허용 목록·1단 섹션·부정·`josa`/`code` 필터)뿐이며 변수 값은 치환 전 HTML 이스케이프한다」. 「렌더는 `RichText` 컴포넌트 하나」 경로 「`packages/ui/src/RichText.tsx`」. (D39)
15. §4.3 CSP 문자열에 `worker-src 'self' blob:` 추가(Monaco 워커). 「`dangerouslySetInnerHTML`은 `src/ui/RichText.tsx` 한 파일만 허용」 → 「`packages/ui/src/RichText.tsx` 와 `apps/desktop/src/components/dee/DeeSprite.tsx`(마스코트 스프라이트) 두 파일만 허용」. (D7·D42)
16. §5.1 YAML: `with: { workspaces: src-tauri }` → `{ workspaces: . }`; audit 잡 `bash scripts/forbid.sh` → `bash scripts/check-rust-budget.sh`. (D41)
17. §6.1 「`src-tauri/migrations/NNNN_<name>.sql`」 → 「`packages/store-sql/migrations/NNNN_<name>.sql`; 앱 시작 시 TS 가 `store_open{catalog.migrations}` 로 넘기고 Rust `store` 크레이트가 적용한다」. 백업 파일명 「`chickadee-v<이전>-<YYYYMMDD-HHMM>.sqlite`」 → 「01 §7 `backups/chickadee-v{user_version}-{yyyymmddHHMM}.db`」. (D16·D38)
18. §6.2 「사전 파일 머리에 `schema: 2`(사전 스키마) · `dict_version: 2026.09`(내용)」 → 「개념 파일 머리에 `schema: 1`(03 §5.3), 언어 버전은 `_lang.yaml.version`(semver)과 태그 `dict-vX.Y.Z`」; 매트릭스 예시는 schema 1/2 로 그대로 두되 열 이름만. 「`<app_data>/dictionaries/`」 → 「`dict-user/<lang>/`」. (D45·D38)
19. §6.3 「`ingest_fingerprint = sha256(문법 크레이트 버전들 ‖ queries/ 디렉터리 해시 ‖ 카드 생성 규칙 버전 ‖ dict schema)`를 저장한다」 → 「02 `ingest_run.fingerprint = sha256(grammar_versions_json ‖ query_hash ‖ gen_version ‖ dict_schema)` 를 저장한다」. (D2)
20. §7.2 「`dictionaries/<lang>/<concept>.yaml`」 → 「`dictionary/<lang>/<concept>.yaml` + `.scm`」, 「`pnpm dict:check`」 → 「`pnpm dict:lint`」. (D41)
21. §7.3 T1 이의 템플릿 행 자동 채움 → 「`lang · reason 코드 · 형태 서명(식별자 `IDENT` 마스킹) · engineVersion · dictVersion · patternKey · 로컬 누적 수`」, 코드 포함 열 「기본 없음」 → 「기본 없음 — 체크박스 「원본·답안 두 줄을 포함합니다(기본 꺼짐)」」(04 열린 질문 7 답).
22. §8 「`perf_samples(kind, ms, n, at)` 테이블」 → 「02 `perf_sample`」. (D2)
23. 「대안과 버린 이유」 폰트 행·「위험과 완화」 WebKit 행 「「부속 숨김」 기본값 검토」 → 「05 §10 강등 순서 적용」. (D11)
24. 열린 질문에 답 표기: 1→D7(번들, +≈8 MB 수용) · 2→D8(base name 허용) · 3→D13 · 4→D13 · 5→D13(없음) · 6→D13(전진 전용) · 7→D2(`ingest_run.fingerprint`·`perf_sample` 은 02, `schema`·`version` 은 03).
25. 체크리스트 설명 수정(제목 유지): 「Q2 Rust 파서·쿼리 골든 — insta 스냅샷 TS/TSX/SQL 각 15케이스」 → 「— insta **캡처** 스냅샷 `crates/parse/tests/`, grammar 별 15케이스」; 「Q7 … `scripts/forbid.sh`」 → 「`scripts/check-rust-budget.sh`」; 「Q12 마이그레이션 프레임 — `user_version` 러너, 백업 3개, …」 → 「— (러너는 02 「마이그레이션 러너」) 백업 3개, 시드 DB 테스트, `ingest_run.fingerprint` 배너, 내보내기·전부 지우기」; 「Q10 … `fixtures/evil`·`evil-dict`」 유지; 「Q15 … `perf_samples`」 → 「`perf_sample`」; 「Q3 … T0/T1/T2 골든 30건」 뒤에 「(T0·스케줄러는 M2, T1·T2 는 M3·M4 에서 추가)」.

---

## 검증 방법

수정을 마친 뒤 `docs/` 에서 아래를 돌린다. 「없음」은 0건이어야 하고 「있음」은 1건 이상이어야 한다. 열린 질문 항목에 답을 표기한 줄(「→ 결정」 포함)은 옛 이름을 인용할 수 있으므로 `grep -v "→ 결정"` 으로 제외한다 — 답 표기는 반드시 옛 이름과 **같은 줄**에 쓴다.

```bash
cd docs
# 폐기 이름 — 없음
grep -n "chickadee-ingest" 01-architecture.md 06-quality-security-release.md | grep -v "→ 결정"   # 없음 (03 은 개념어로만 허용)
grep -n "disputes\|Dispute\b\|t2_feedback\|why_answers\|disputedLines" 0[2-6]-*.md | grep -v "→ 결정"   # 없음
grep -n "ingest_state\|ingest_runs\|commit_files\|sessions\.\|captures\b" 0[1-6]-*.md | grep -v "→ 결정"   # 없음
grep -n "blake3" 01-architecture.md 02-*.md 03-*.md | grep -v "→ 결정"   # 없음
grep -n "packages/core\|src/ipc/commands\|session\.discard\|runId" 05-frontend.md | grep -v "→ 결정"   # 없음
grep -n "dictionaries/\|chickadee\.sqlite\|com\.chickadee\|settings\.json\|forbid\.sh\|dict:check\|perf_samples" 06-*.md | grep -v "→ 결정"   # 없음
grep -n "manifest\.yaml\|concepts\.yaml\|bench-ingest\|extract-tokens\|\.bundle" 01-architecture.md | grep -v "→ 결정"   # 없음
grep -n "lyProposed\|type Lang\b" 04-grading-engines.md | grep -v "→ 결정"   # 없음
grep -n "sequel\b" 03-*.md | grep -v "tree-sitter-sequel"   # 없음
grep -n "200_000\|num_cpus\|walkdir\|1MB" 06-*.md | grep -v "→ 결정"   # 없음
grep -n "repo-100k\|repo-poly\|chickadee-cli" 03-*.md | grep -v "→ 결정"   # 없음
grep -n "budget_min: 13\|new_per_day: 4\|하루 4장\|13분" 02-*.md | grep -v "→ 결정"   # 없음
grep -n "#6B4600" 05-frontend.md | grep -v "→\|현재\|였" ; true                        # 값으로는 없음
# 확정 이름 — 있음
grep -n "CREATE TABLE capture\|CREATE TABLE commit_file\|CREATE TABLE import_edge\|CREATE TABLE block\|CREATE TABLE why_answer\|CREATE TABLE perf_sample" 02-*.md   # 6건
grep -n "PRIMARY KEY (unit_id, concept_id, track)\|transfer_from\|site_key\|is_reachable\|content_hash\|head_oid" 02-*.md   # 있음
grep -n "git_blame_lines\|ingest_warning\|IngestWarning\|BlameHunk\|inError\|matchId\|PARSE_TOO_DEEP\|maxLineBytes" 01-architecture.md   # 있음
grep -n "_imports.scm\|_blocks.scm\|why_gate\|diag_default\|§6.5\|대지(unit) 탐지\|arch/placement" 03-*.md   # 있음
grep -n "advanceThreshold\|interface Appeal\|block.ast_json\|file.base\|promptLines\|outcome:" 04-grading-engines.md   # 있음
grep -n "#664300\|--verdict-exact\|@chickadee/grading\|@chickadee/scheduler\|fixtures/ui/run08\|t0.js:146\|t2.js:140" 05-frontend.md   # 있음
grep -n "worker-src\|check-rust-budget\|dev.chickadee.app\|packages/store-sql/migrations\|DeeSprite\|ingest_run.fingerprint\|40장" 06-*.md   # 있음
# 체크리스트 제목 불변 — 각 문서의 "- [ ] " 줄 수가 01:14 02:14 03:15 04:14 05:15 06:15
for f in 0[1-6]-*.md; do echo -n "$f "; grep -c "^- \[ \] " "$f"; done
# 00 의 마일스톤 표 제목이 각 문서 체크리스트 제목과 일치하는지 (수동 대조 — 제목을 바꿨다면 00 §5 도 같이)
```
