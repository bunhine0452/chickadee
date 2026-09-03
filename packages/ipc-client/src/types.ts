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
