# 01 · 아키텍처

**이 문서의 위치** — Chickadee 설계 문서 6편 중 첫 편. 프로세스·모듈 경계·Tauri IPC 계약·디렉터리·상태·오류·경로·성능 예산을 고정한다. 스키마와 FSRS 는 `02-data-model-and-scheduling.md`, 파싱·문법 사전은 `03-ingest-parsing-dictionary.md`, 채점은 `04-grading-engines.md`, 화면은 `05-frontend.md`, 품질·보안·릴리스는 `06-quality-security-release.md` 가 소유하며, 이 문서는 그 사이의 **경계면(타입·명령 이름·소유권)** 만 정의한다.

**읽는 순서/전제** — `.oculpm/discussion/vibe-code-study-app/discussion.md` 의 「결론」 §2·§3·§5 를 읽었다고 전제한다. 화면이 요구하는 데이터의 정본은 목업 소스 `design/src/ink/{data,session,t0,t1,t2}.js` 와 `design/ink-home.html` 이다. 기준 스택: Tauri 2.x(cli 2.11) · Rust 1.80+ · Node 22+ · pnpm 10 · SQLite 3.45+ (개발기 실측 rustc 1.98 · Node 26.7 · pnpm 10.33 · sqlite 3.51 — D48).

---

## 1. 시스템 개요

```
┌─ Tauri 프로세스 (Rust, 크레이트 chickadee-app) ─────────────────────────────────┐
│ main 스레드      tauri 이벤트 루프 · 창 1개 (세션은 창 안의 전체화면 오버레이)      │
│ tokio 런타임     #[tauri::command] async — 인자 검증 → 크레이트 호출 → serde JSON  │
│   ├─ store      rusqlite · writer 1 (Mutex) + reader 4 · WAL · busy_timeout 5s     │
│   ├─ jobs       인제스트 워커 스레드 1개 상주 + parse 풀 N=min(4, cores-1)          │
│   │              walk(ignore) → blob oid → tree-sitter parse+query → git2 → 500행 tx│
│   │              emit("ingest_progress") ≤ 10/s · CancellationToken                │
│   └─ ipc        오류 매핑(thiserror → IpcError JSON) · 페이로드 ≤ 1 MiB              │
├─ WebView (WKWebView / WebView2 / WebKitGTK) ──────────────────────────────────────┤
│ TS: ui · cards · scheduler(FSRS·잉크 겹) · grading · concepts · dictionary        │
│     ipc-client 만 @tauri-apps/api 를 import — invoke()/listen() JSON               │
└──────────────────────────────────────────────────────────────────────────────────┘
 파일 시스템: 사용자 리포(읽기 전용, 절대 쓰지 않음) · app_data_dir(chickadee.db, logs/, dict-cache/)
 git: .git 은 git2 로만 접근 — 외부 git 바이너리 호출 없음 (PATH·버전 차이 제거)
```

무엇이 어디서 실행되나: **파싱·git·SQLite 는 Rust**(네이티브 속도·스레드·파일 접근이 필요한 것만). **개념 추출·카드 생성·스케줄·채점·화면은 TS**. 인제스트는 2단계다 — Rust 가 「사실(`file`·`capture`·`git_commit`·`commit_file`)」을 SQLite 에 쓰고, TS `packages/concepts` 가 캡처를 **파일 단위 페이지**로 읽어 「파생(`concept_site`·`import_edge`·`block`·`unit`·`gap`)」을 쓰고, `packages/cards` 가 `card` 를 만든다.

### 1.1 얇은 Rust 를 모듈 경계로 강제하는 방법

원칙: Rust 는 **크레이트 호출 껍데기**다. 도메인 어휘(개념·카드·겹·FSRS·세션·채점)를 모른다. Rust 의 명사는 파일·바이트·커밋·diff·AST 노드·캡처·행뿐이다.

왜: 사용자와 유지보수자가 바이브 코더다. Rust 는 바이브 코딩이 통하지 않는 언어이므로 **버그가 Rust 에 살면 아무도 못 고친다.** 버그가 TS 에 살도록 도메인 로직을 전부 TS 로 밀어낸다. 경험상 "얇게 하자"는 합의는 6주 안에 무너지므로 CI 로 잠근다.

| 장치 | 규칙 | 검사 |
|---|---|---|
| 줄 예산 | `crates/**` + `apps/desktop/src-tauri/src/**` 코드 줄(테스트·주석 제외) ≤ **1500** | `scripts/check-rust-budget.sh` (tokei) — 초과 시 CI 실패 |
| 금칙어 | Rust 식별자·문자열에 `concept·card·mastery·ink·fsrs·queue·session·grade·review` 금지. 검사 범위는 `crates/*/src/**` + `apps/desktop/src-tauri/src/**`(tests·benches 제외) | 같은 스크립트의 grep |
| git 바이너리 금지 | `Command::new("git")` 발견 시 실패 | 같은 스크립트 |
| SQL 금지 | Rust 소스에 `SELECT/INSERT/UPDATE/DELETE` 리터럴 없음. SQL 은 TS 카탈로그에서 **이름으로** 실행 | grep |
| 1 크레이트 = 1 래핑 | git→`git2`, parse→`tree-sitter`, store→`rusqlite`. 공개 함수 ≤ 8개 | 코드 리뷰 |
| 안전 | `#![forbid(unsafe_code)]`, `clippy::pedantic` deny | `cargo clippy -- -D warnings` |

검사 스크립트는 `scripts/check-rust-budget.sh` **하나**다(06 의 `forbid.sh` 를 흡수 — 줄 예산·금칙어·SQL 리터럴·git 바이너리를 한 번에 본다).

---

## 2. 모듈 경계와 소유권

| 모듈 | 위치 | 입력 | 출력 | 의존 |
|---|---|---|---|---|
| `git` | `crates/git` | 리포 경로, 커밋 해시, rev+경로 | `Fingerprint`, `CommitMeta[]`, `CommitFile[]`, `BlameHunk[]`, blob 바이트 | git2 |
| `parse` | `crates/parse` | `(grammar, bytes, QuerySpec[])` | `Capture[]`, `AstLite` | tree-sitter + 언어 크레이트 |
| `store` | `crates/store` | `(statementName, params JSON)` | `Row[] JSON`, `ExecInfo` | rusqlite |
| `ipc`(app) | `apps/desktop/src-tauri` | Tauri invoke 인자 | serde JSON, 이벤트 | git · parse · store |
| `ipc-client` | `packages/ipc-client` | 명령 인자(TS 타입) | 타입 있는 결과, `IpcError` | `@tauri-apps/api` **유일** |
| `store-sql` | `packages/store-sql` | — | 마이그레이션 SQL, 명명 statement 카탈로그, 행 타입 | ipc-client |
| `text` | `packages/text` | 문자열, 시드 재료 | `Tok[]`, `seedOf`·`mulberry32`·`shuffle` | **없음**(최하위, D50) |
| `dictionary` | `packages/dictionary` | YAML 텍스트 | 검증된 `Dict`(zod), `.scm` 쿼리 | ipc-client |
| `concepts` | `packages/concepts` | `Capture[]` + `Dict` | `concept_site`·`import_edge`·`block`·`unit`·`gap` 행, 선행 그래프, 미지 개념 수, 커밋 `kind`·`author_matched` | dictionary · store-sql |
| `cards` | `packages/cards` | `ConceptUse`, 파일 블록, 커밋 사실 | `T0Card / T1Card / T2Card` | concepts · store-sql |
| `scheduler` | `packages/scheduler` | `Mastery`, `ReviewLog`, 오늘 시각 | `TodayQueue`, 잉크 겹 전이, FSRS 간격 | store-sql |
| `grading` | `packages/grading` | 답안 + 카드 (+ `AstLite`) | `Verdict` | ipc-client(parse) |
| `ui` | `packages/ui` + `apps/desktop/src` | 위 전부 | DOM | 위 전부 (invoke 직접 호출 금지) |

의존 방향 규칙(어기면 lint 실패 — `eslint no-restricted-imports` + `dependency-cruiser`, Rust 는 `Cargo.toml` 로 자연 강제):

```
Rust:  app(ipc) → git | parse | store       (셋은 서로 의존 금지)
TS:    ui → cards | scheduler | grading → concepts → dictionary | store-sql → ipc-client → @tauri-apps/api
       cards | grading | concepts → text                    (text 는 아무것도 의존하지 않는다)
```

크로스 경계 데이터 형식: **JSON**(`serde_json` ↔ `JSON.parse`), 키는 camelCase(`#[serde(rename_all = "camelCase")]`), 응답 ≤ **1 MiB**(초과 시 `PAYLOAD_TOO_LARGE`, 커서 페이지네이션으로 나눔), 문자열 UTF-8(파일이 UTF-8 이 아니면 lossy 변환 + `hadInvalidUtf8: true`), 바이트 오프셋은 UTF-8 바이트, 줄 번호 1-based, 경로는 리포 루트 상대 `/` 구분자(Windows 도). 왜 1 MiB: WKWebView 의 invoke 는 문자열 직렬화라 MB 당 10ms 이상이 나온다. 열(col)은 tree-sitter `Point.column`(UTF-8 바이트) 그대로이며 문자 열 변환은 TS 가 한다.

---

## 3. Tauri command 계약

### 3.1 공통 타입

```ts
// packages/ipc-client/src/types.ts  (Rust 쪽은 동일 이름의 serde 구조체)
type RepoId = number; type JobId = string; type FileId = number;
interface RepoInfo { id: RepoId; rootPath: string; fingerprint: string /* 커밋 0개면 '' */; headCommit: string | null;
  status: 'ok' | 'missing' | 'detached'; lastIngestAt: string | null }
interface LangSpec { grammar: string; extensions: string[]; maxFileBytes: number; queries: { id: string; scm: string }[] }
// queries[].id = 개념 id('ts/optional-chaining') 또는 예약 id '_imports' | '_blocks'
interface IngestSpec { repoId: RepoId; mode: 'full' | 'incremental'; langs: LangSpec[];
  maxCommits: number /* 2000 */; maxFilesPerCommit: number /* 200 */; maxFiles: number /* 50000 */;
  maxLineBytes: number /* 20000 */; excludeGlobs: string[]; generatedMarkers: string[] /* 첫 5줄 검사 */ }
interface IngestWarning { jobId: JobId; relPath: string; reason: 'oversize' | 'parse-poor' | 'timeout' | 'binary' | 'generated' | 'long-line' }
interface IngestProgress { jobId: JobId; phase: 'walk' | 'parse' | 'git' | 'write';
  done: number; total: number; currentRelPath?: string; elapsedMs: number }
interface IngestDone { jobId: JobId; files: number; changed: number; deleted: number; captures: number;
  commits: number; escalatedToFull: boolean; elapsedMs: number; peakRssMb: number; cancelled: boolean; warnings: number }
interface Capture { queryId: string; matchId: number /* 파일 안 매치 번호 */; patternIndex: number;
  name: string /* 'site' | 'pick.N' | 'hole' | 'ctx.<name>' | 'import.source' | 'block.function' | 'block.name' */;
  form: string | null /* (#set! form) */; nodeKind: string; inError: boolean /* ERROR 와 겹치거나 조상 3단 안에 ERROR */;
  startByte: number; endByte: number; startLine: number; endLine: number; startCol: number; endCol: number;
  excerpt: string /* ≤ 200자 */ }
interface BlameHunk { start: number; end: number; sha: string }   // 1-based, 닫힌 구간
interface AstLite { kind: string; named: boolean; start: number; end: number;
  text?: string /* 리프(식별자·리터럴)만 */; children: AstLite[] }
interface LinesChunk { relPath: string; rev: string | null; from: number; to: number; lines: string[];
  totalLines: number; hadInvalidUtf8: boolean }
interface Block { relPath: string; rev: string | null; startByte: number; endByte: number; text: string }
interface CommitFileDiff { relPath: string; status: 'A' | 'M' | 'D' | 'R'; additions: number; deletions: number;
  hunks: { oldStart: number; newStart: number; text: string }[] }
```

### 3.2 명령 전체 목록

지연 예산은 M1 + WKWebView p95. 취소는 `ingest_*` 만 가능(나머지는 예산 안에 끝나는 동기 작업).

| 명령 | 입력 | 출력 | 오류(§6 코드) | p95 | 취소 | 이벤트 |
|---|---|---|---|---|---|---|
| `repo_register` | `{ path }` | `RepoInfo` — `Repository::discover` 로 루트를 찾아 `rootPath` 로 돌려준다. 커밋 0개 허용 | `FS_NOT_FOUND` `GIT_NOT_REPO` `GIT_BARE` `REPO_DUPLICATE` | 300ms | ✗ | — |
| `repo_list` | — | `RepoInfo[]` (경로 존재 확인 포함) | `STORE_*` | 20ms | ✗ | — |
| `repo_relocate` | `{ repoId, newPath }` | `RepoInfo` | `REPO_FINGERPRINT_MISMATCH` `GIT_NOT_REPO` | 300ms | ✗ | — |
| `repo_remove` | `{ repoId, purge }` | `{}` | `REPO_NOT_FOUND` | 200ms | ✗ | — |
| `repo_glob_read` | `{ repoId, glob, maxFiles: ≤200, maxBytesEach: ≤65536 }` | `{ relPath, text }[]` (ocul-pm 일지 `.oculpm/journal/**/*.md`) | `FS_*` `PAYLOAD_TOO_LARGE` | 50ms | ✗ | — |
| `ingest_start` | `IngestSpec` | `{ jobId }` | `JOB_BUSY`(동시 1개) `REPO_PATH_MISSING` `PARSE_QUERY_INVALID` | 50ms(큐 등록) | — | — |
| `ingest_cancel` | `{ jobId }` | `{}` | `JOB_NOT_FOUND` | 10ms(중단 완료는 ≤ 500ms) | — | `ingest_done{cancelled:true}` |
| `ingest_status` | `{ jobId }` | `IngestProgress \| IngestDone` | `JOB_NOT_FOUND` | 5ms | ✗ | — |
| (이벤트) | — | — | — | — | — | `ingest_progress`(≤ 10/s) · `ingest_done` · `ingest_warning{IngestWarning}` · `ingest_error{IpcError}` |
| `file_read_lines` | `{ repoId, relPath, from, to /* ≤ 2000줄 */, rev? }` | `LinesChunk` | `FS_NOT_FOUND` `GIT_COMMIT_NOT_FOUND` `BAD_INPUT` | 10ms(작업 트리) · 30ms(rev) | ✗ | — |
| `file_read_block` | `{ repoId, relPath, startByte, endByte /* ≤ 65536 */, rev? }` | `Block` | 위와 같음 | 10ms | ✗ | — |
| `parse_snippet` | `{ grammar, text /* ≤ 65536B */, queries?: QuerySpec[] }` | `{ ast: AstLite; captures: Capture[]; hadError: boolean }` | `PARSE_LANG_UNSUPPORTED` `PARSE_TOO_LARGE` `PARSE_TIMEOUT`(2s) `PARSE_TOO_DEEP`(AstLite 깊이 512) | 20ms | ✗ | — |
| `parse_langs` | — | `{ grammar, grammarVersion, abi }[]` | — | 1ms | ✗ | — |
| `git_diff_text` | `{ repoId, commit, relPath }` | `CommitFileDiff` | `GIT_COMMIT_NOT_FOUND` `PAYLOAD_TOO_LARGE` | 50ms | ✗ | — |
| `git_blame_lines` | `{ repoId, relPath, rev? }` | `{ hunks: BlameHunk[] }` | `GIT_COMMIT_NOT_FOUND` `GIT_BLAME_TIMEOUT`(2s) | 500ms | ✗ | — |
| `store_open` | `{ catalog: { statements: Record<name, sql>; migrations: { version, sql }[] } }` | `StoreInfo` | `STORE_ALREADY_OPEN` `STORE_MIGRATION` `STORE_CORRUPT` `STORE_CATALOG_MISSING` | 200ms(마이그레이션 제외) | ✗ | — |
| `store_query` | `{ name, params }` | `Row[]` | `STORE_CATALOG_MISSING` `STORE_BUSY` `BAD_INPUT` | 5ms(홈 번들 30ms) | ✗ | — |
| `store_exec` | `{ name, params }` | `{ changes, lastId }` | 위 + `STORE_CONSTRAINT` | 5ms | ✗ | — |
| `store_batch` | `{ ops: { name, params }[] /* ≤ 200 */ }` | `{ changes, lastId }[]` (단일 tx, 전부 아니면 무) | 위와 같음 | 10ms | ✗ | — |
| `store_info` | — | `{ userVersion, path, sizeBytes, wal: true }` | — | 1ms | ✗ | — |
| `dict_list` | — | `{ lang, source: 'bundled' \| 'user' }[]` | `FS_*` | 20ms | ✗ | — |
| `dict_read` | `{ lang }` | `{ files: { relPath: string; text: string }[] }` (`_lang.yaml`·`*.yaml`·`*.scm` 원문, 파싱은 TS) | `DICT_NOT_FOUND` | 50ms | ✗ | — |
| `dict_cache_read` / `dict_cache_write` | `{ key }` / `{ key, json /* ≤ 1 MiB */ }` | `{ json } \| null` / `{}` | `FS_*` | 10ms | ✗ | — |
| `app_paths` | — | `{ dataDir, dbPath, logDir, dictCacheDir, dictUserDir }` | — | 1ms | ✗ | — |
| `app_version` | — | `{ app, tauri, sqlite, rustc }` | — | 1ms | ✗ | — |
| `app_reveal` | `{ which: 'data' \| 'logs' \| 'repo', repoId? }` | `{}` | `FS_NOT_FOUND` | 100ms | ✗ | — |
| `t3_run` | — | — | 항상 `NOT_IMPLEMENTED` (§9) | — | — | — |

`store_open` 은 프로세스당 1회만 허용한다(두 번째 호출 → `STORE_ALREADY_OPEN`). 왜: 카탈로그는 앱 번들 JS 에서만 오는데, WebView 가 뚫렸을 때 SQL 을 갈아끼우는 경로를 막는다. 카탈로그 밖 SQL 은 어떤 명령으로도 실행할 수 없다.

### 3.3 인제스트 알고리즘 (Rust `jobs.rs`)

1. `git::open(root)`; `fingerprint()`(루트 커밋 해시들을 정렬해 `-` 로 이은 문자열) 가 `repos.fingerprint` 와 다르면 `REPO_FINGERPRINT_MISMATCH`. fingerprint 가 `''` 이면 비교하지 않고 첫 커밋 발견 시 채운다.
2. `ignore::WalkBuilder`(`.gitignore` 존중, 숨김 제외, `.git/` 제외) → 확장자로 `LangSpec` 매칭 → `maxFileBytes` 초과·바이너리(첫 8 KiB 에 NUL) 제외. 제외 규칙에 `excludeGlobs`·`generatedMarkers`(첫 5줄)·`.gitattributes linguist-generated`(`repo.get_attr`)·`maxLineBytes` 초과·`maxFiles` 초과(`truncated`) 추가. 확장자 없는 파일은 스킵.
3. 파일마다 `Oid::hash_object(Blob, bytes)` = `file.content_hash`; HEAD 트리 항목 oid = `file.head_oid`(없으면 NULL); `is_dirty = head_oid IS NULL OR head_oid <> content_hash`. `incremental` 은 `content_hash` 가 같으면 건너뛰고, 사라진 파일은 `facts.file_mark_deleted`.
4. parse 풀: 스레드마다 언어별 `Parser` 보유(`Parser` 는 `Send` 이나 `Sync` 아님), `set_timeout_micros(2_000_000)`. 쿼리 실행 → `Capture[]`. 시스템 쿼리 `_imports`·`_blocks` 의 캡처도 개념 캡처와 같이 `capture` 행으로 저장한다(`./x` 해석·tsconfig paths 는 언어 지식이므로 TS `concepts` 가 `import_edge` 로 변환). 파일마다 `parse_quality`(ERROR+MISSING 바이트 > 5% 또는 단일 ERROR 40줄 초과 → `'poor'`)를 `file` 행에 쓴다.
5. git: `revwalk` `TOPOLOGICAL | TIME`, first-parent 단순화 없음, `maxCommits` 까지. 커밋마다 `sha·parent_sha·parent_count·author_email·author_name(mailmap 적용)·authored_at·subject·files_n·insertions·deletions·truncated` 저장. `parent_count > 1` 이면 diff 계산 없음. diff 옵션 `context_lines(0)`, `ignore_whitespace(true)`, `find_similar(renames, threshold 50)`; 파일별 `commit_file` 행(`status·old_path·additions·deletions·touched_json` = `'+'` 줄의 new_lineno 범위 압축). 파일 수 > `maxFilesPerCommit` 이면 `truncated=true`.
6. 쓰기는 500행 단위 tx(`facts.*` 카탈로그 이름) — 배치마다 취소 토큰 확인. 왜 500: UI 의 `store_batch` 가 writer 뮤텍스를 20ms 이상 기다리지 않게.
7. 끝: `facts.run_finish`(grammarVersions·queryHash·elapsed), `repos.headCommit` 갱신, `ingest_done`.

`incremental` 은 직전 run 의 `queryHash`·`grammarVersions` 가 같을 때만 성립. 다르면 자동으로 `full` 로 올리고 `escalatedToFull: true` 를 보고한다.

Rust 가 사용하는 카탈로그 이름(기동 시 전부 존재해야 하며 없으면 `STORE_CATALOG_MISSING`): `facts.file_upsert`(열 `path grammar byte_size line_count content_hash head_oid is_dirty parse_quality skip_reason`) · `facts.file_mark_deleted` · `facts.capture_delete_by_file` · `facts.capture_insert` · `facts.commit_insert` · `facts.commit_file_insert` · `facts.run_start` · `facts.run_finish` · `repo.insert` · `repo.list` · `repo.update_path` · `repo.detach`.

**TS 파생 층**: `ingest_done` 을 받으면 `packages/concepts.derive(repoId)` 가 `derive.captures_by_file{fileId}` 로 파일 단위 페이지를 읽어 `concept_site`·`import_edge`·`block`·`unit`·`unit_node`·`gap` 을 쓰고(`store_batch` ≤ 200 op), 끝나면 `packages/concepts/blame.ts` 가 Site 가 있는 파일마다 `git_blame_lines` 를 배경에서 호출해 `concept_site.commit_id` 를 채운다. 커밋 `kind`·`author_matched` 도 이때 `git_commit` 파생 열에 쓴다.

### 3.4 화면이 요구하는 명명 statement (TS `store-sql` 소유, 스키마는 02)

| 이름 | 파라미터 | 행 | 쓰는 화면(목업 근거) |
|---|---|---|---|
| `home.bundle_counts` | `repoId` | 개념 수·겹 분포·연속일·평균 겹 | 홈 마스트헤드·잉크 겹 사다리 `LY_COUNT` |
| `queue.due` | `repoId, now, limit` | 만기 카드 + mastery | `QUEUE` 의 `review` 항목 |
| `queue.new_candidates` | `repoId, limit` | 미지 개념 수 오름차순 후보 | `sub:'새 판'` |
| `queue.retake_pending` | `repoId` | 다시 찍기 대기 | 홈 「다시 찍을 개념」, 요약 「내일 첫 순서」 |
| `gaps.list` | `repoId, limit` | 카드 없는 개념 + 등장 횟수 | 「판이 없는 문법」 `async/await 11번` |
| `card.get_t0` / `card.get_t1` / `card.get_t2` | `cardId` | 카드 JSON(`lines·seg·options·why·uses·prereq`) | `CARDS`, `T1`, `T2` |
| `session.bundle` | `sessionId` | 큐의 카드 전부 한 번에 | 세션 시작 프리페치(카드 전환 IPC 0회) |
| `concept.uses` | `conceptId, limit` | `{file, line, excerpt}` | 사다리 3단 `uses`, 홈 노드 `내 코드 3곳` |
| `concept.prereqs` | `conceptId` | 선행 개념 + 겹 + `card` 유무 | 사다리 2단 `prereq[{s:'gap'|'known'|'none'}]` |
| `t1.block_get` | `cardId` | `original[]`, `rev`, `show2` | `T1.original` |
| `t2.graph` | `repoId, unitId` | `files[{p, r, isNew}]`, `edges[]` | `T2.files/edges` |
| `t2.commit_key` | `commitHash` | `core/sec/trap` 후보 + `+/−` (`commit_file` 조인) | `T2.core/sec/trap/commit` |
| `review.append` + `mastery.upsert` + `session.save` | (batch: `review_log` insert · `mastery` upsert · `session_item` update · `session` update · `lifer`/`dunno_event`) | — | `onDone(r)` 직후 한 tx |
| `session.open_get` / `session.finish` | `repoId` / `sessionId` | `session` 행 + `session_item` 행 전부 | `restore()` / `summary()` |
| `derive.captures_by_file` | `fileId` | `Capture[]` | TS 파생 층(§3.3) |
| `derive.site_upsert` | — | — | `concept_site` 쓰기 |
| `derive.edge_replace` | — | — | `import_edge` 쓰기 |
| `derive.block_upsert` | — | — | `block` 쓰기 |
| `derive.blame_fill` | — | — | `concept_site.commit_id` 채우기 |
| `stats.days` | `repoId, days: 14` | 일별 분 | 「지난 14일 잉크 농도」 |
| `settings.get_all` / `settings.set` | — / `key, value` | — | 주간/야간·부속·분량 |

배열 파라미터는 SQLite 가 바인딩하지 못하므로 statement 안에서 `json_each(:ids)` 를 쓴다(카탈로그 규칙).

### 3.5 TS typed client

```ts
// packages/ipc-client/src/index.ts
import { invoke } from '@tauri-apps/api/core'; import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { StatementMap } from './statements';   // 빈 인터페이스 — store-sql 의 생성 catalog.ts 가 선언 병합으로 채운다 (D49)

export class IpcError extends Error {
  constructor(readonly code: IpcErrorCode, message: string, readonly detail: Record<string, unknown> = {},
              readonly retryable = false) { super(message); }
}
async function call<T>(cmd: string, args?: object): Promise<T> {
  const t0 = performance.now();
  try { return await invoke<T>(cmd, args); }
  catch (e) { throw toIpcError(e); }                     // Rust 의 IpcError JSON → 클래스
  finally { devPanel?.record(cmd, performance.now() - t0); }
}
export const ipc = {
  repo:   { register: (path: string) => call<RepoInfo>('repo_register', { path }),
            list: () => call<RepoInfo[]>('repo_list'),
            relocate: (repoId: RepoId, newPath: string) => call<RepoInfo>('repo_relocate', { repoId, newPath }),
            remove: (repoId: RepoId, purge: boolean) => call<void>('repo_remove', { repoId, purge }),
            globRead: (req: GlobReadReq) => call<{ relPath: string; text: string }[]>('repo_glob_read', req) },
  ingest: { start: (spec: IngestSpec) => call<{ jobId: JobId }>('ingest_start', spec),
            cancel: (jobId: JobId) => call<void>('ingest_cancel', { jobId }),
            status: (jobId: JobId) => call<IngestProgress | IngestDone>('ingest_status', { jobId }),
            onProgress: (cb: (p: IngestProgress) => void): Promise<UnlistenFn> => listen('ingest_progress', e => cb(e.payload as IngestProgress)),
            onDone: (cb: (d: IngestDone) => void) => listen('ingest_done', e => cb(e.payload as IngestDone)) },
  file:   { readLines: (req: ReadLinesReq) => call<LinesChunk>('file_read_lines', req),
            readBlock: (req: ReadBlockReq) => call<Block>('file_read_block', req) },
  parse:  { snippet: (req: SnippetReq) => call<SnippetResult>('parse_snippet', req),
            langs: () => call<LangInfo[]>('parse_langs') },
  git:    { diffText: (req: DiffReq) => call<CommitFileDiff>('git_diff_text', req) },
  store:  { open: (catalog: Catalog) => call<StoreInfo>('store_open', { catalog }),
            query: <K extends keyof StatementMap>(name: K, params: StatementMap[K]['params']) =>
                     call<StatementMap[K]['row'][]>('store_query', { name, params }),
            exec:  <K extends keyof StatementMap>(name: K, params: StatementMap[K]['params']) => call<ExecInfo>('store_exec', { name, params }),
            batch: (ops: BatchOp[]) => call<ExecInfo[]>('store_batch', { ops }),
            info:  () => call<StoreInfo>('store_info') },
  dict:   { list: () => call<DictEntry[]>('dict_list'), read: (lang: string) => call<DictFiles>('dict_read', { lang }),
            cacheRead: (key: string) => call<{ json: string } | null>('dict_cache_read', { key }),
            cacheWrite: (key: string, json: string) => call<void>('dict_cache_write', { key, json }) },
  app:    { paths: () => call<AppPaths>('app_paths'), version: () => call<AppVersion>('app_version'),
            reveal: (which: 'data' | 'logs' | 'repo', repoId?: RepoId) => call<void>('app_reveal', { which, repoId }) },
} as const;
```

`StatementMap` 은 `statements/*.sql` 머리 주석(`-- @name repo.list` · `-- @params {repoId: number}` · `-- @row {...}` 또는 `void`)에서 생성한다 — 한 파일에 여러 statement 를 두고 `-- @name` 으로 자른다(D51). 생성기는 이름 중복·마이그레이션 번호 연속·Rust 필수 이름 12개(§3.3) 존재를 빌드 때 검사한다. `ipc-client` 는 **빈** `StatementMap` 을 선언하고 생성된 `store-sql/src/catalog.ts` 가 선언 병합으로 채운다 — §2 의 의존 방향(`store-sql → ipc-client`)을 순환 없이 지키기 위해서다(D49). 왜: 스키마·SQL·행 타입이 한 패키지에서 같이 바뀌고 Rust 는 한 줄도 손대지 않는다.

---

## 4. 디렉터리 구조

```
chickadee/
├── Cargo.toml                    # [workspace] members = ["crates/*", "apps/desktop/src-tauri"]
├── pnpm-workspace.yaml           # packages/*, apps/*
├── crates/
│   ├── git/     src/{lib.rs, fingerprint.rs, commits.rs, blob.rs}          # chickadee-git  ≤ 400줄
│   ├── parse/   src/{lib.rs, langs.rs, query.rs, ast_lite.rs} · tests/     # chickadee-parse ≤ 450줄 (tests/ = insta 스냅샷·사전 예시 덤프)
│   └── store/   src/{lib.rs, catalog.rs, migrate.rs, json.rs}              # chickadee-store ≤ 350줄
├── apps/desktop/
│   ├── src-tauri/  src/{main.rs, error.rs, state.rs, jobs.rs, commands/{repo,ingest,file,parse,git,store,dict,app}.rs}
│   │               benches/ingest.rs (criterion)
│   │               tauri.conf.json · capabilities/default.json · Cargo.toml   # chickadee-app ≤ 300줄
│   └── src/        main.ts · screens/ …                                      # UI 셸 (프레임워크는 05)
├── packages/
│   ├── ipc-client/  src/{index.ts, types.ts, errors.ts, events.ts}
│   ├── store-sql/   migrations/0001_init.sql … · statements/{facts,repo,home,queue,card,session,…}.sql · src/rows.ts
│   ├── dictionary/  src/{schema.ts (zod), load.ts, cache.ts}
│   ├── concepts/    src/{derive.ts, prereq-graph.ts, unknown-rank.ts, resolve-imports.ts, units.ts, commits.ts, blame.ts, ingest-defaults.ts}
│   ├── cards/       src/{t0.ts, t1.ts, t2.ts}
│   ├── scheduler/   src/{fsrs.ts, ink-layers.ts, today-queue.ts}
│   ├── grading/     src/{t0.ts, t1-ast.ts, t1-regex.ts, t2.ts, t3-adapter.ts}
│   ├── text/        src/{seed.ts, tokenize.ts}   # 의존 0 — cards·grading·concepts 가 다 쓴다 (D50)
│   └── ui/          tokens.css(scripts/sync-design.mjs 가 design/src/ink/tokens.css 에서 복사) · components/
├── dictionary/{common,arch,react,<lang>}/{_lang.yaml, <concept>.yaml, <concept>.scm, <concept>.js.scm, _imports.scm, _blocks.scm}
│   dictionary/schema/concept.schema.json                                     # ts/ sql/ 부터
├── fixtures/
│   ├── repos/<name>.steps                    # tiny · projectox-like · two-commits · large-100k · poly (생성물은 커밋하지 않음)
│   ├── golden/<lang>/<concept>/<case>.<ext> + .expected.json   # parse_snippet · T1 채점 골든
│   ├── ipc/<fixture>/ · ui/run08.json · evil/ · evil-dict/ · db/v0001.sqlite
│   └── dictionary-min/                       # 스키마 검증용 최소 사전
├── scripts/{check-rust-budget.sh, build-catalog.ts, make-fixture-repo.sh, bench.sh, sync-design.mjs, check-contrast.mjs}
├── design/  docs/
└── .github/workflows/{ci.yml (lint·test·budget), release.yml (tauri-action 3-OS)}
```

문법 사전은 앱 번들 리소스(`tauri.conf.json` `bundle.resources: ["../../dictionary/**"]`)로 들어가고, 사용자 오버라이드는 `app_data_dir/dict-user/<lang>/` 이 우선한다.

---

## 5. 상태 모델

**SQLite 가 유일한 진실.** UI 메모리 상태는 파생 캐시이며 언제든 버리고 다시 조회할 수 있어야 한다.

| 상태 | 위치 | 규칙 |
|---|---|---|
| 리포·사실·개념·카드·숙련도·리뷰 로그·설정 | SQLite | 쓰기는 `store_batch` 로 원자적 |
| 진행 중 세션(`pos·queue·results·elapsed·liferN·carry`, T1 초안) | SQLite `session` + `session_item`(`state_json` 은 판 단위) | 저장 시점 5종: 판을 걸 때 · 채점 직후 · 큐 변경 · 5초 tick · Esc. T1 초안은 400ms 디바운스로 메모리에, tick·blur·Esc·언마운트에서 flush |
| 주간/야간 · 부속 숨김 | `localStorage`(`ink.theme`, `ink.trim`) **및** `settings` | 첫 페인트 전에 읽어야 하므로 localStorage 를 캐시로, 진실은 `settings` |
| 창 크기·위치 | `tauri-plugin-window-state` | — |
| 인제스트 잡 | Rust `state.rs` 메모리 + `ingest_run` 행 | 재시작 시 `running` 인 행은 `failed` |

**낙관적 갱신은 하지 않는다.** 로컬 DB 라 `store_batch` 가 10ms 안에 끝나므로 write-through 후 렌더한다. 유일한 예외는 1초 경과 타이머(메모리, 5초마다 저장). 왜: 낙관적 UI 는 실패 되돌리기 코드가 필요한데 그 코드가 가장 안 테스트된다.

**카드 완료는 세션 끝이 아니라 카드마다 기록한다.** `onDone(r)` 순간 `review.append + mastery.upsert + session.save` 를 한 tx 로 쓴다. 크래시가 나도 채점된 판은 사라지지 않고, 요약 화면은 `review_log WHERE session_id` 를 다시 읽어 그린다.

**중단/복구**: 기동 시 `session.open_get` 이 있으면 홈이 「N번째 판부터 이어 찍기」를 제안한다(목업 `restore()`). `day_key` 가 바뀐 세션은 02 §5.6 대로 `abandoned` 로 닫는다. 다시 찍기·아래층 판이 끼운 큐 항목은 `session_item` 행으로 있으므로 복구 후에도 시간 비례 진행바가 같다.

---

## 6. 오류 모델

Rust: 크레이트별 `thiserror` 열거형 → `app/error.rs` 의 `IpcError { code, message, detail, retryable }` 로 `From` 변환 → serde JSON → TS `IpcError` 클래스 → `ui` 의 문구 표(`packages/ui/src/error-copy.ts`).

```rust
// crates/git/src/lib.rs        // crates/parse                        // crates/store
#[derive(thiserror::Error)]     #[derive(thiserror::Error)]            #[derive(thiserror::Error)]
pub enum GitError {             pub enum ParseError {                  pub enum StoreError {
  NotARepo(PathBuf),              UnsupportedLang(String),               AlreadyOpen,
  Bare,                           QueryInvalid{id:String,row:u32,col:u32}, Migration{from:i32,to:i32,src:String},
  CommitNotFound(String),         TooLarge{bytes:usize,max:usize},       CatalogMissing(String),
  BlameTimeout{path:PathBuf},     Timeout{ms:u64},                       Busy, Constraint(String), Corrupt(String),
  Lib(#[from] git2::Error),       TooDeep{depth:usize},                  Sqlite(#[from] rusqlite::Error) }
}                               }
```

| Rust 변형 | 코드 | 재시도 | UI 문구(사용자 친화, 은유 옆 평문) |
|---|---|---|---|
| `Git::NotARepo` | `GIT_NOT_REPO` | ✗ | 이 폴더에는 `.git` 이 없습니다. 리포 루트 폴더를 고르세요. |
| `Git::Bare` | `GIT_BARE` | ✗ | bare 리포는 파일이 없어 교재로 쓸 수 없습니다. |
| `Git::CommitNotFound` | `GIT_COMMIT_NOT_FOUND` | ✗ | 히스토리가 바뀐 것 같습니다. 리포를 다시 읽어 옵니다. → 재인제스트 제안 |
| `Git::BlameTimeout` | `GIT_BLAME_TIMEOUT` | ✗ | (표시 없음 — 출처 없이 카드 유지) |
| `Git::Lib` | `GIT_IO` | ✓ | 리포를 읽지 못했습니다. (상세는 로그) |
| `Parse::UnsupportedLang` | `PARSE_LANG_UNSUPPORTED` | ✗ | 아직 이 언어의 판이 없습니다. (사전 기여 링크) |
| `Parse::QueryInvalid` | `PARSE_QUERY_INVALID` | ✗ | 문법 사전 `{lang}/{id}` 에 오류가 있습니다 {row}:{col}. |
| `Parse::TooLarge` / `Timeout` | `PARSE_TOO_LARGE` / `PARSE_TIMEOUT` | ✗ | 이 파일은 너무 커서 건너뛰었습니다. |
| `Parse::TooDeep` | `PARSE_TOO_DEEP` | ✗ | 이 파일은 너무 깊어 건너뛰었습니다 |
| `Store::AlreadyOpen` | `STORE_ALREADY_OPEN` | ✗ | (내부 오류 — 표시하지 않고 로그) |
| `Store::Migration` | `STORE_MIGRATION` | ✗ | 데이터 파일을 새 판으로 옮기지 못했습니다. 백업은 `backups/` 에 있습니다. |
| `Store::CatalogMissing` | `STORE_CATALOG_MISSING` | ✗ | (버그 — 개발자 패널에 이름 표시) |
| `Store::Busy` | `STORE_BUSY` | ✓(3회, 50ms 백오프 — ipc-client 가 자동) | — |
| `Store::Constraint` | `STORE_CONSTRAINT` | ✗ | 저장하지 못했습니다. 화면을 새로 고쳐 주세요. |
| `Store::Corrupt` | `STORE_CORRUPT` | ✗ | 데이터 파일이 손상됐습니다. 백업에서 복구할까요? |
| `Ipc::Validation(field)` | `BAD_INPUT` | ✗ | (버그 — 필드명 로그) |
| `Ipc::PayloadTooLarge` | `PAYLOAD_TOO_LARGE` | ✗ | (버그 — 페이지네이션 누락) |
| `Ipc::JobBusy` / `JobNotFound` / `Cancelled` | `JOB_BUSY` / `JOB_NOT_FOUND` / `CANCELLED` | — | 이미 읽는 중입니다 / — / 중단했습니다. 지금까지 읽은 부분은 유지됩니다. |
| `Ipc::RepoPathMissing` | `REPO_PATH_MISSING` | ✗ | 리포 폴더를 찾을 수 없습니다. 옮겼다면 위치를 알려 주세요. → `repo_relocate` |
| `Ipc::RepoFingerprintMismatch` | `REPO_FINGERPRINT_MISMATCH` | ✗ | 다른 리포입니다. 첫 커밋이 다릅니다. |
| `Ipc::NotImplemented` | `NOT_IMPLEMENTED` | ✗ | T3 은 아직 없습니다. |
| `io::PermissionDenied` / `NotFound` | `FS_PERMISSION` / `FS_NOT_FOUND` | ✗ | 폴더 접근 권한이 없습니다(macOS 는 시스템 설정 → 개인정보) / 파일이 없습니다. |
| `Dict::NotFound` | `DICT_NOT_FOUND` | ✗ | 문법 사전 `{lang}` 이 없습니다. |

로그 원칙(`tracing` + `tauri-plugin-log`, JSON lines, `logs/chickadee.log` 5×5 MiB 회전, 기본 `info`, `CHICKADEE_LOG=debug` 로 상향):
- **금지 필드**: 파일 내용·코드 조각·캡처 excerpt·사용자 답안·「왜」 문장·LLM 프롬프트·절대 경로.
- **허용**: `repoId`, 리포 상대 경로, 개수, 소요 ms, 오류 코드, 커밋 해시.
- Rust 에서 `#[instrument(skip(text, bytes))]` 를 파일·스니펫 인자에 필수. `error.rs` 의 `Display` 는 코드 내용을 포함하지 않는다(`QueryInvalid` 도 위치만).

---

## 7. 설정·경로

| 항목 | 위치 |
|---|---|
| 앱 데이터 | macOS `~/Library/Application Support/dev.chickadee.app/` · Windows `%APPDATA%\dev.chickadee.app\` · Linux `$XDG_DATA_HOME/dev.chickadee.app/` (Tauri `app_data_dir`) |
| DB | `chickadee.db` (+`-wal`, `-shm`), `PRAGMA journal_mode=WAL; synchronous=NORMAL; foreign_keys=ON` |
| 백업 | `backups/chickadee-v{user_version}-{yyyymmddHHMM}.db` — 마이그레이션 직전 자동, 최근 3개 보관 |
| 로그 | `logs/chickadee.log{,.1..5}` |
| 사전 캐시 | `dict-cache/{lang}@{version}.json` (TS 가 YAML → 정규화 JSON 으로 컴파일) |
| 사용자 사전 | `dict-user/{lang}/` (번들보다 우선) |
| 설정 | `settings` 테이블(단일 진실) — 하루 분량(기본 15분)·주간/야간·부속·`maxCommits`·`maxFileBytes`·로그 레벨·`identities[]`·`excludeGlobs`·`motion`·`newPerDay`(기본 2) |

**여러 리포**: `repos` 행 여러 개, 홈은 활성 리포 1개를 보여 주고 마스트헤드에서 전환. 숙련도는 개념 단위라 리포 간 공유된다(같은 `concept_id`).

**리포 이동**: 기동 시 `repo_list` 가 경로 존재를 확인해 `status:'missing'` 을 돌려주고, 홈이 「찾기」를 띄운다. `repo_relocate` 는 새 경로의 fingerprint(루트 커밋)가 같을 때만 갱신한다. **삭제**: `repo_remove{purge:false}` 는 `detached_at` 만 찍고 사실·카드를 남긴다(다시 붙이면 증분 인제스트). `purge:true` 는 사실(`file capture git_commit commit_file`)과 파생(`concept_site import_edge block unit* gap`)을 지우고 `card` 는 `retired_at`+`snapshot_json` 으로 은퇴시킨다(삭제 금지 — `review_log` 가 참조). `mastery`·`review_log` 는 절대 지우지 않는다(개념 자산). 리포는 **절대 쓰지 않는다** — Tauri `fs` 스코프를 `app_data_dir` 로만 열고 리포 읽기는 전부 명령 경유.

---

## 8. 성능 예산과 측정 지점

| 항목 | 예산 | 측정 지점 |
|---|---|---|
| 첫 인제스트 — 100k 줄 · 1,000 커밋 (`fixtures/repos/large`) | ≤ 15s (M1, 4 스레드) · ≤ 30s (Win i5 4코어) | `ingest_done.elapsedMs`, span `ingest.walk/parse/git/write` |
| 증분 — 파일 50 · 커밋 20 | ≤ 1.5s | 동일 |
| 인제스트 메모리 | Rust RSS ≤ 300 MB(피크) · 유휴 ≤ 60 MB | `ingest_done.peakRssMb` |
| 홈 첫 렌더 | ≤ 200ms = store 조회 묶음 ≤ 30ms + TS 파생 ≤ 50ms + 페인트 ≤ 100ms | `performance.mark('home:data')`·`'home:paint'`, `?dev=1` 패널 |
| 세션 시작(번들 프리페치) | ≤ 300ms | `'session:bundle'` |
| 카드 전환 | ≤ 100ms, **IPC 0회** | `'card:mount:{id}'` |
| 카드 완료 기록 batch | ≤ 10ms | span `store.batch` |
| invoke 왕복(≤ 4 KB) | ≤ 1ms WebView2 · ≤ 2ms WKWebView · ≤ 4ms WebKitGTK | `ipc-client` 타이머 |
| 파일 맥락 2,000줄 | ≤ 10ms | span `file.read` |
| 49 노드 홈 스크롤+hover | 프레임 p95 ≤ 12ms(3 WebView 모두) | Playwright 트레이스 (`design/README.md` 검수 절차 재사용) |

`scripts/bench.sh` 가 criterion(`src-tauri/benches/ingest.rs`, `tiny`·`projectox-like`·`large-100k`)과 `vitest bench` 를 돌려 `bench/baseline.json` 과 비교해 CI 에 소프트 게이트(예산 1.5배 초과 시 경고, 2배 초과 시 실패)로 건다.

WebView 차이 주의점:
- **WKWebView(macOS)**: invoke 페이로드는 문자열 직렬화 — 1 MiB 상한의 근거. `localStorage` 는 ITP 로 비워질 수 있으므로 진실을 두지 않는다(§5). `mix-blend-mode`·`feTurbulence` 결은 미측정(discussion 「미해결」) — 첫날 측정하고 p95 > 12ms 면 05 §10 의 강등 순서(윈도잉 → 판번호 어긋남 끄기 → 결 `--grain-op:0`)를 적용한다. `⌘` 키맵. 폰트는 **번들**(목업의 Google Fonts CDN 은 앱에서 금지 — 오프라인·무전송 원칙).
- **WebView2(Windows)**: 가장 빠름. `Ctrl` 키맵. 경로 구분자는 명령 경계에서 `/` 로 정규화(§2). 시스템 폰트 폴백이 다르므로 Plex 번들 필수.
- **WebKitGTK(Linux)**: 가장 느리고 `backdrop-filter` 미지원·블렌드 느림. 부속 기본 `off`(D12 확정). Monaco 는 세 WebView 모두 동작하나 WebKit 계열은 `-webkit-user-select` 접두사 필요.

---

## 9. 확장 지점

**언어 추가 = Rust 한 줄 + YAML + 쿼리 파일.**

```rust
// crates/parse/src/langs.rs — 여기 한 줄이 Rust 쪽 변경의 전부
// ("sql", …) 의 첫 요소가 **grammar 키**이며 사전 `_lang.yaml.grammars` 가 이 키를 쓴다
pub const LANGS: &[(&str, fn() -> tree_sitter::Language)] = &[
  ("typescript", || tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into()),
  ("tsx",        || tree_sitter_typescript::LANGUAGE_TSX.into()),
  ("sql",        || tree_sitter_sequel::LANGUAGE.into()),
  // ("python",  || tree_sitter_python::LANGUAGE.into()),   ← 언어 추가 시 이 줄 + Cargo.toml 의존성 한 줄
];
```

```
dictionary/python/_lang.yaml               # lang, version, grammars, extensions, universal/language-specific 필드(03)
dictionary/python/<concept>.yaml + .scm    # 개념 id · 설명 3층 · 선행 · 오답 진단 + 쿼리
dictionary/python/_imports.scm·_blocks.scm # 시스템 쿼리
```

캡처 이름 규약은 03 §3.2(`@site`·`@pick.N`·`@hole`·`@ctx.*`·`(#set! form)`); 시스템 쿼리 `_imports.scm` 은 `@import.source`, `_blocks.scm` 은 `@block.function`·`@block.name`.

`parse_langs` 가 등록된 언어를 알려 주고, TS `dictionary` 가 `manifest.extensions` 로 `LangSpec` 을 만든다. 언어 크레이트는 Cargo feature 로 감싼다(`features = ["lang-typescript", "lang-sql"]`) — 커뮤니티 문법(Swift·Dart)이 빌드를 깨면 빼고 릴리스할 수 있다.

**T3 자리(인터페이스만)**: `packages/grading/src/t3-adapter.ts`
```ts
export interface RunnerAdapter { id: string; detect(repo: RepoInfo, files: string[]): Promise<boolean>;
  run(spec: { repoId: RepoId; cmd: string[]; timeoutMs: number }): Promise<{ passed: number; failed: number; log: string }> }
export const runners: RunnerAdapter[] = [];   // MVP 에서 비어 있음
```
Rust 명령 `t3_run` 은 `NOT_IMPLEMENTED` 만 돌려주고, 스키마의 `track` 열거형에 `'t3'` 을 예약한다(02). 프로세스 실행이 들어오면 Tauri `shell` 스코프와 샌드박스 결정이 필요하므로 06 에서 다룬다.

**LLM 4단**: MVP 는 프롬프트 생성·복사만(목업 그대로, 전송 없음). 이후 `llm_ask` 를 Rust 에 두고 키는 OS 키체인(`keyring`)에 — 키가 WebView 에 존재하지 않게. 인터페이스만 예약: `llm_ask{ provider, messages } → 이벤트 llm_token`.

---

## 10. 버전·마이그레이션 원칙

- **스키마**: `PRAGMA user_version` 정수. `packages/store-sql/migrations/NNNN_name.sql`, 전진만. 각 파일 한 tx, 적용 전 백업(§7). `user_version` 이 앱의 최대치보다 크면 열지 않고 「더 새 버전의 Chickadee 로 만든 데이터입니다」.
- **사전 버전**: `_lang.yaml.version`(semver). 개념 `id` 는 불변(이름을 바꾸면 `aliases:` 에 남김) — 숙련도가 `id` 에 매달려 있다. major 변경은 `dict-cache` 무효화.
- **인제스트 메타**: `ingest_run(grammar_versions_json, query_hash, dict_version, dict_schema, gen_version, app_version, fingerprint)`; `fingerprint = sha256(grammar_versions_json ‖ query_hash ‖ gen_version ‖ dict_schema)`.

| 변경 | Rust 사실 재생성 | TS 파생 재생성 |
|---|---|---|
| 앱 업그레이드 — 언어 크레이트 버전 또는 `.scm` 해시 변경 | 해당 언어 전체(`full`) | 전체 |
| 사전 minor(문구·옵션) | 없음 | 카드 텍스트만 |
| 사전 major(개념 id 추가·폐기) | 쿼리가 바뀐 경우만 | 전체 |
| 리포 새 커밋 | 증분 | 영향 파일의 카드만 |
| 스키마 마이그레이션 | 없음 | 없음 |

기동 순서: 마이그레이션 → `store_open` → `parse_langs` 와 `ingest_run` 비교 → 필요하면 홈에 「리포를 다시 읽습니다」 배너와 함께 백그라운드 `ingest_start`(진행바는 홈 마스트헤드).

---

## 대안과 버린 이유

| 대안 | 버린 이유 |
|---|---|
| tree-sitter WASM 을 WebView 에서 실행 | 언어당 `.wasm` 로드, 스레드 없음, 대형 리포에서 3~5배 느림. 결론 §5 위반 |
| `tauri-plugin-sql`(WebView 에서 임의 SQL) | 임의 SQL 이 IPC 를 건너감(XSS 시 전체 DB 노출), 마이그레이션 소유가 플러그인 방식에 묶임, 오류가 문자열 |
| 도메인 조회마다 typed Rust command | 스키마가 Rust 구조체에 복제되어 마이그레이션마다 두 언어를 고침 — 얇은 Rust 예산 6주 안에 붕괴 |
| FSRS 를 Rust(`fsrs` 크레이트)로 | 스케줄링은 제품 그 자체라 TS 에서 매일 만져야 함. Rust 에 도메인 어휘 유입 |
| 인제스트를 사이드카 프로세스로 | 바이너리 추가 서명·공증, 프로세스 간 진행 이벤트 복잡. 스레드 + 취소 토큰이면 충분 |
| 세션을 별도 창으로 | 결론 §3-4(오버레이) 위반, WKWebView 창 생성 비용, 두 WebView 간 상태 동기화 |
| 파일 읽기를 raw bytes 커스텀 프로토콜로 | 2,000줄 상한 JSON 이 10ms 안에 들어옴. 필요해지면 `tauri::ipc::Response` 로 교체(계약 불변) |
| 사전 YAML 을 Rust `serde_yaml` 로 파싱 | 검증 규칙(zod)이 TS 에 있어야 기여자가 고칠 수 있음. Rust 는 바이트만 |

---

## 위험과 완화

| 위험 | 완화 |
|---|---|
| WKWebView 렌더 성능 미측정(결·블렌드) | 첫날 `design/` 목업을 Tauri 창에 띄워 p95 측정. 12ms 초과 시 05 §10 의 강등 순서(윈도잉 → 판번호 어긋남 끄기 → 결 `--grain-op:0`)를 적용한다 |
| 커뮤니티 문법(Swift·Dart) ABI 불일치·크래시 | Cargo feature 로 격리, `parse_langs.abi` 검사, 파서 타임아웃 2s, 실패 파일은 건너뛰고 `ingest_done` 에 집계 |
| 거대 모노리포 | `maxCommits 2000`·`maxFileBytes 512 KiB`·`maxFilesPerCommit 200` 상한, 초과는 `truncated` 표시 |
| writer 경합(인제스트 vs 카드 기록) | writer Mutex 1개 + 500행 tx + `busy_timeout 5s` + `STORE_BUSY` 자동 재시도 3회 |
| 줄 번호 드리프트(카드 생성 시점 vs 작업 트리) | 카드는 `rev` 를 고정하고 `file_read_*` 에 `rev` 를 넘김. 재인제스트가 카드의 `rev` 를 갱신하며 못 찾으면 카드 `stale` |
| 페이로드 1 MiB 초과 | `session.bundle` 은 카드 JSON 을 카드당 ≤ 64 KB 로 제한(T1 원본 ≤ 400줄), 초과는 두 번째 요청 |
| Rust 예산 잠식 | CI 게이트 + 리뷰 체크리스트 「이 로직이 TS 에 있으면 안 되는 이유」 한 줄 필수 |
| 사용자 리포 오염 | 리포 경로에 쓰는 API 없음. Tauri `fs` 스코프는 `app_data_dir` 한정. 통합 테스트가 인제스트 전후 리포 트리 해시 동일성을 검사 |

---

## 열린 질문 / 결정 요청

1. **(02)** 사실 테이블(`files·captures·imports·commits·commit_files·ingest_runs`)의 열을 §3.3 의 `Capture`·`CommitFile` 형태로 확정해 주기. 특히 `captures.excerpt ≤ 200자` 저장(사다리 3단이 파일 읽기 없이 그려지게)과 `review_log.concept_id NOT NULL, card_id NULL 허용`(purge 후 자산 유지). → 결정 D2: 02 DDL 단수형이 정본, `review_log.card_id NOT NULL` 유지, 카드는 `retired_at`+`snapshot_json` 으로 은퇴.
2. **(02)** 모든 DDL·SQL 을 `packages/store-sql` 한 곳이 소유하고 Rust 는 `facts.*` 이름만 참조하는 방식 수락 여부. → 결정 D2 수락.
3. **(03)** import 해석(`./x`, tsconfig paths, 배럴)을 TS `concepts/resolve-imports.ts` 가 담당하고 Rust 는 원문 문자열만 저장하는 경계 수락 여부. 캡처 이름 규약 `concept.<id>` · `import.source` · `block.function` 확정. → 결정 D18: 규약은 03 §3.2 의 것(`@site`·`@pick.N`·`@hole`·`@ctx.*`), `import.source` 는 시스템 쿼리 `_imports.scm` 소속.
4. **(04)** T1 AST 비교는 Rust 가 `AstLite` 를 주고 TS 가 비교한다. Rust 쪽 diff 가 필요하다고 판단되면 예산(1500줄)과 함께 논의. → 결정 D14: TS 비교 유지, `AstLite.kind` 에 `'ERROR'` 를 그대로 싣는다.
5. **(05)** UI 프레임워크 자유. 단 `invoke` 는 `ipc-client` 밖에서 호출 금지, 세션 카드 전환 IPC 0회(번들 프리페치) 준수. → 결정 D43: `packages/core`·`src/ipc/commands.ts` 폐기, `@chickadee/grading·scheduler·cards·ipc-client` 참조. UI id 는 `number`, `runId`→`sessionId`.
6. **(06)** 폰트 3종 번들(OFL) 및 CSP `default-src 'self'` — 외부 네트워크 0. LLM 키 저장은 OS 키체인. → 결정 D7: OFL 원본 woff2 9파일 번들(≈8 MB), CSP `default-src 'self'`+`worker-src 'self' blob:`(Monaco), 네트워크 0(예외: 사용자가 켠 LLM 4단).
7. Linux(WebKitGTK) 부속 기본값 `off` 로 할지. → 결정 D12: `off`.
8. 상한 기본값 `maxCommits 2000 / maxFileBytes 512 KiB / maxFilesPerCommit 200` 확인. → 결정 D12 확인 (+ `maxFiles 50000 / maxLineBytes 20000`).
9. ocul-pm 일지 연동(「선택의 왜」)은 `repo_glob_read` 로 `.oculpm/journal/**/*.md` 를 읽어 카드에 붙이는 범위로 MVP 에 넣을지 — 03 과 협의. → 결정 00 §6-7 기본값: 최소 범위 — T2 커밋 출처와 구멍 지도 `alternatives` 행에서 커밋 해시로 일지를 찾아 링크만.

---

## 구현 체크리스트

- [ ] 워크스페이스 스캐폴드 — Cargo/pnpm 워크스페이스, Tauri 2 창 1개, CI(lint·test·`check-rust-budget.sh`), `tauri-action` 3-OS 빌드 (선행: 없음)
- [ ] `store` 크레이트 — open/migrate/catalog/query/exec/batch, 행→JSON 규칙, 인메모리 DB 테스트 (선행: 스캐폴드)
- [ ] `store-sql` 패키지 — `0001_init.sql`, statement 카탈로그, `build-catalog.ts` 로 `StatementMap` 생성 (선행: 02 스키마 확정)
- [ ] `ipc-client` 패키지 — typed client, `IpcError`, 이벤트 리스너, `STORE_BUSY` 재시도, dev 패널 타이머 (선행: 스캐폴드)
- [ ] `git` 크레이트 — open/fingerprint/commits/commit_file/blob, blame hunks, 픽스처는 06 Q1 의 `.steps` (선행: 스캐폴드)
- [ ] `parse` 크레이트 — `langs.rs`(TS·TSX·SQL), parse+query, `AstLite`, 타임아웃, insta 캡처 스냅샷(`crates/parse/tests/`) (선행: 03 쿼리 규약)
- [ ] 인제스트 잡 러너 — 워커 스레드, parse 풀, blob oid 증분·`is_dirty`, 취소 토큰, 진행 이벤트, 500행 tx (선행: store·git·parse)
- [ ] 파일 맥락 명령 — `file_read_lines/block` 작업 트리·rev 양쪽, 상한·UTF-8 lossy (선행: git)
- [ ] 사전 명령 + `dictionary` 패키지 — `dict_list/read/cache_*`, zod 스키마, 사용자 오버라이드 우선 (선행: 03 YAML 스키마)
- [ ] 세션 저장/복원 — `session.save` batch 시점 5종, 기동 시 이어 찍기, 강제 종료 후 복구 E2E (선행: store-sql·ipc-client)
- [ ] 오류 모델 배선 — `thiserror` → `IpcError` → 문구 표, 로그 금지 필드 `skip`, 회전 (선행: 각 크레이트)
- [ ] 리포 이동/삭제 흐름 — `missing` 상태, `repo_relocate` fingerprint 검증, `purge` 시 자산 보존 테스트 (선행: git·store-sql)
- [ ] 성능 벤치 — `bench.sh`(criterion + vitest bench) 3 픽스처, WKWebView 홈·세션 프레임 측정, CI 소프트 게이트 (선행: 인제스트·UI 셸)
- [ ] T3 자리 — `RunnerAdapter` 인터페이스, `t3_run → NOT_IMPLEMENTED`, `track` 열거형 예약 (선행: store-sql)
