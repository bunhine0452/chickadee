/**
 * IPC 경계의 공통 타입 (01 §3.1). Rust 쪽에 같은 이름의 serde 구조체가 있다.
 *
 * 경계 규약: JSON · 키는 camelCase · 응답 ≤ 1 MiB · 문자열 UTF-8 ·
 * 바이트 오프셋은 UTF-8 바이트 · 줄 번호 1-based · 경로는 리포 루트 상대 `/` 구분자(Windows 도).
 * 열(col)은 tree-sitter `Point.column`(UTF-8 바이트) 그대로이며 문자 열 변환은 TS 가 한다.
 */
export type RepoId = number;
export type JobId = string;
export type FileId = number;

/** `repo_probe` 의 답. 장부(등록·목록·이동·삭제)는 TS 가 statement 로 조립한다 (D65). */
export interface RepoProbe {
  rootPath: string;
  /** 루트 커밋 해시들을 정렬해 `-` 로 이은 문자열. 커밋 0개면 `''`. */
  fingerprint: string;
  headCommit: string | null;
}

export interface LangSpec {
  grammar: string;
  extensions: string[];
  maxFileBytes: number;
  /** `id` = 개념 id('ts/optional-chaining') 또는 예약 id `_imports` | `_blocks`. */
  queries: { id: string; scm: string }[];
}

export interface IngestSpec {
  repoId: RepoId;
  /** 잡 러너가 경로를 SQL 로 되찾지 않게 TS 가 넘긴다 (D65). */
  rootPath: string;
  mode: 'full' | 'incremental';
  /** 직전 실행이 멈춘 head. `incremental` 에서만 쓰이고, git 이 그 커밋을 잃었으면 전체로 승격한다. */
  sinceHead: string | null;
  langs: LangSpec[];
  maxCommits: number;
  maxFilesPerCommit: number;
  maxFiles: number;
  maxLineBytes: number;
  excludeGlobs: string[];
  /** 첫 5줄을 검사한다. */
  generatedMarkers: string[];
}

export interface IngestWarning {
  jobId: JobId;
  relPath: string;
  reason: 'oversize' | 'parse-poor' | 'timeout' | 'binary' | 'generated' | 'long-line';
}

export interface IngestProgress {
  jobId: JobId;
  phase: 'walk' | 'parse' | 'git' | 'write';
  done: number;
  total: number;
  currentRelPath?: string;
  elapsedMs: number;
}

export interface IngestDone {
  jobId: JobId;
  files: number;
  changed: number;
  deleted: number;
  captures: number;
  commits: number;
  escalatedToFull: boolean;
  elapsedMs: number;
  peakRssMb: number;
  cancelled: boolean;
  warnings: number;
}

export interface Capture {
  /** 개념 id | `_imports` | `_blocks`. */
  queryId: string;
  /** 파일 안 매치 번호 — 이것 없이는 pick/hole 을 하나의 사용처로 묶지 못한다 (D18). */
  matchId: number;
  patternIndex: number;
  /** `site` | `pick.N` | `hole` | `ctx.<name>` | `import.source` | `block.function` | `block.name` */
  name: string;
  /** `(#set! form)` */
  form: string | null;
  nodeKind: string;
  /** ERROR 와 겹치거나 조상 3단 안에 ERROR. */
  inError: boolean;
  startByte: number;
  endByte: number;
  startLine: number;
  endLine: number;
  startCol: number;
  endCol: number;
  /** ≤ 200자 */
  excerpt: string;
}

/** 1-based, 닫힌 구간. */
export interface BlameHunk { start: number; end: number; sha: string }

export interface AstLite {
  kind: string;
  named: boolean;
  start: number;
  end: number;
  /** 리프(식별자·리터럴)만. */
  text?: string;
  children: AstLite[];
}

export interface LinesChunk {
  relPath: string;
  rev: string | null;
  from: number;
  to: number;
  lines: string[];
  totalLines: number;
  hadInvalidUtf8: boolean;
}

export interface StoreInfo { userVersion: number; path: string; sizeBytes: number; wal: boolean }
export interface ExecInfo { changes: number; lastId: number }

export interface Catalog {
  statements: Record<string, string>;
  migrations: readonly { version: number; sql: string }[];
}

export interface AppPaths {
  dataDir: string;
  dbPath: string;
  logDir: string;
  dictCacheDir: string;
  dictUserDir: string;
}
export interface AppVersion { app: string; tauri: string; sqlite: string; rustc: string }

export interface LangInfo { grammar: string; grammarVersion: string; abi: number }

/** 경로는 리포 루트 절대 경로다 — 장부가 TS 에 있으므로 id 를 되돌릴 곳이 Rust 에 없다 (D65). */
/**
 * `t3_run` (D175). Rust 는 여기까지만 안다 — 무엇을 실행할지, 결과가 통과인지는
 * `@chickadee/grading` 의 `runner.ts` 가 정한다.
 *
 * `rootPath` 가 빈 문자열이면 복사를 건너뛴다 — `java -version` 같은 탐지용 호출이다.
 * 상한(600초 · 스트림당 128 KiB)은 Rust 가 깎으므로 여기서 올려 보낼 수 없다.
 */
export interface ProcSpec {
  /** 복사해 올 원본. **한 바이트도 쓰지 않는다.** */
  rootPath: string;
  /** 작업본 이름 (`[A-Za-z0-9._-]`). 같은 이름은 같은 작업본이라 빌드 캐시가 남는다. */
  workId: string;
  /**
   * 프로그램이 시작하기 **전에** 있어야 하는 것, 홈 디렉터리 상대 경로. 하나라도 없으면
   * `missing` 으로 돌려주고 **아무것도 시작하지 않는다** — 「묻기 전에 네트워크를 쓰지
   * 않는다」를 지키려면 여는 쪽이 아니라 닫는 쪽이 기본이어야 한다.
   */
  needs: string[];
  /**
   * 복사 규칙이 떨어뜨렸어도 **반드시 가져올** 경로. 빌드 도구의 래퍼는 리포가 스스로
   * `.gitignore` 에 넣는 일이 흔하고(Flutter 템플릿이 `/gradlew` 와 `gradle-wrapper.jar`
   * 를 그렇게 한다) 그러면 아무것도 시작되지 않는다. 무엇이 그런 파일인지는 언어 지식이라
   * 부르는 쪽이 적는다.
   */
  keep: string[];
  /** 실행 직전에 작업본에 덮어쓸 것. 경로는 작업본 루트 상대이고 `..` 는 거부된다. */
  files: [path: string, text: string][];
  /** 한 조각짜리 이름은 `PATH` 로, `./gradlew` 처럼 여러 조각이면 작업본 안의 파일로 푼다. */
  program: string;
  args: string[];
  env: [name: string, value: string][];
  timeoutMs: number;
}

export interface ProcOut {
  /** 신호로 죽었으면 `null`. 시간 초과가 그 경우다. */
  code: number | null;
  stdout: string;
  stderr: string;
  workDir: string;
  /** 비어 있지 않으면 프로그램은 **시작조차 안 했다**. 오류가 아니라 사실이다. */
  missing: string[];
  /** 스트림 하나라도 상한에서 잘렸다. */
  truncated: boolean;
  timedOut: boolean;
  durationMs: number;
}

/**
 * `sql_run` (D175 를 SQL 로). Rust 는 문장 목록과 상한만 안다 — 무엇을 세우고 무엇을 묻고
 * 결과 표가 맞는지는 `@chickadee/grading` 의 `sql-runner.ts` 가 정한다.
 *
 * 데이터베이스는 **메모리에만** 선다. 학습자 리포의 파일을 열지 않으므로 작업본을 지우고
 * 말고 할 것이 없고, 문장이 잘못돼도 고장 낼 원본이 없다.
 */
export interface AskSpec {
  /** 데이터베이스를 세우는 문장들 — 스키마와 시드. 순서대로 돈다. */
  setup: string[];
  /** 결과 표를 받을 문장들. 첫 실패에서 멈춘다. */
  asks: string[];
  timeoutMs: number;
  /** 표 하나의 행 상한. 넘으면 `truncated` 로 표시된 채 잘려 온다. */
  maxRows: number;
}

export interface SqlTable {
  columns: string[];
  /** `null` 은 **없는 값**이다 — 빈 글자와 다르고, 이 층이 가르치는 것이 그 차이다. */
  rows: (string | null)[][];
  truncated: boolean;
}

export interface AskOut {
  /** `asks` 하나마다 하나. 도중에 실패하면 그보다 짧다. */
  tables: SqlTable[];
  /** 음수면 `setup` 의 (−n−1)번째, 0 이상이면 `asks` 의 그 번째가 실패했다. */
  failedAt: number | null;
  /** 엔진이 한 말. 부른 쪽이 보낸 글에 대한 것이라 그대로 돌아온다. */
  message: string | null;
  timedOut: boolean;
  durationMs: number;
}

/**
 * `stdin_run` (D186 ⑧ · D187 ①). Rust 는 걸음 목록과 상한만 안다 — 무엇을 돌리고 나온 글이
 * 맞는지는 `@chickadee/grading` 의 `stdin-runner.ts` 가 정한다.
 *
 * 작업 디렉터리는 이 호출 안에서 만들어졌다가 **지워진다**. 학습자 리포는 열지도 않으므로
 * 「원본은 읽기만 한다」가 「원본을 안 본다」가 된다 (sqlite 러너와 같은 자리).
 * 내려받는 것이 없어 D175 ④ 의 동의 게이트는 이 길에 없다.
 */
export interface StepSpec {
  /** `PATH` 를 타는 이름 하나. 경로 구분자가 들면 거부된다. */
  program: string;
  args: string[];
  /** 표준 입력으로 넣어 줄 글. 다 넣고 파이프를 닫아 프로그램의 읽기가 끝에 닿는다. */
  feed: string;
  /** 0 으로 안 끝나면 **뒤 걸음을 시작하지 않는다**. 부르는 쪽이 컴파일 걸음에 건다. */
  mustPass: boolean;
}

export interface StdinSpec {
  /** 첫 걸음 전에 작업 디렉터리에 쓸 것. 경로는 상대이고 `..` 는 거부된다. */
  files: [path: string, text: string][];
  steps: StepSpec[];
  env: [name: string, value: string][];
  /** **걸음마다**의 상한이지 전체가 아니다. Rust 가 5초에서 깎는다. */
  timeoutMs: number;
}

export interface StepOut {
  /** 신호로 죽었으면 `null`. 시간 초과가 그 경우다. */
  code: number | null;
  stdout: string;
  stderr: string;
  truncated: boolean;
  timedOut: boolean;
  durationMs: number;
}

export interface StdinOut {
  /** 시작된 걸음마다 하나, 순서대로. 시간 초과·`mustPass` 실패·못 시작에서 짧아진다. */
  steps: StepOut[];
  /** 시작조차 못 한 걸음. **오류가 아니라 사실이다** — 대개 「그 언어가 안 깔렸다」. */
  spawnFailed: number | null;
}

export interface ReadLinesReq { rootPath: string; relPath: string; from: number; to: number; rev?: string }
export interface ReadBlockReq { rootPath: string; relPath: string; startByte: number; endByte: number; rev?: string }

/**
 * `parse_snippet` (01 §3.2 · D87). 인자를 **낱개로** 보낸다 — 구조체 하나를 받는 것은
 * `ingest_start` 뿐이다. `queries` 를 주지 않으면 캡처를 돌리지 않고 파싱만 한다.
 */
export interface SnippetReq { grammar: string; text: string; queries?: { id: string; scm: string }[] }
/** `hadError` 는 `ERROR` 노드의 **유무**다. 비율(04 §4.5 의 ≤ 20 %)은 `ast` 를 세어 TS 가 낸다. */
export interface SnippetResult { ast: AstLite; captures: Capture[]; hadError: boolean }
export interface Block { relPath: string; rev: string | null; startByte: number; endByte: number; text: string }

/**
 * `git_diff_text` (01 §3.2 · D98). 그 커밋이 그 경로에 **더한 줄**만 돌려준다 —
 * `status`·`additions`·`deletions` 는 인제스트가 이미 `commit_file` 에 썼다.
 * 머지 커밋과 그 커밋이 손대지 않은 경로는 빈 배열이다(오류가 아니다).
 */
export interface FileDiff { relPath: string; added: string[]; truncated: boolean }
