import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

import { devPanel } from './devpanel.js';
import { IpcError, toIpcError } from './errors.js';
import type { BatchOp, ParamsOf, RowOf, StatementName } from './statements.js';
import type {
  AppPaths, AppVersion, BlameHunk, Block, Catalog, CommitFileDiff, DictEntry, DictFiles,
  DiffReq, ExecInfo, GlobReadReq, IngestDone, IngestProgress, IngestSpec, JobId, LangInfo,
  LinesChunk, ReadBlockReq, ReadLinesReq, RepoId, RepoInfo, SnippetReq, SnippetResult, StoreInfo,
} from './types.js';

/** STORE_BUSY 재시도 (01 §6): 3회, 50ms 백오프. 여기가 유일한 자동 재시도다. */
const RETRIES = 3;
const BACKOFF_MS = 50;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function call<T>(cmd: string, args?: object): Promise<T> {
  const t0 = performance.now();
  try {
    for (let attempt = 0; ; attempt++) {
      try {
        // `InvokeArgs` 는 `Record<string, unknown>` 이라 interface 가 그대로는 안 붙는다
        // (인터페이스엔 암묵 인덱스 시그니처가 없다). 경계에서 한 번만 좁힌다 —
        // 여기 오는 것은 전부 §3.1 이 정한 평범한 JSON 객체다.
        return await invoke<T>(cmd, args as Record<string, unknown>);
      } catch (e) {
        const err = toIpcError(e);
        if (err.code !== 'STORE_BUSY' || attempt >= RETRIES - 1) throw err;
        await sleep(BACKOFF_MS * (attempt + 1));
      }
    }
  } finally {
    devPanel.record(cmd, performance.now() - t0);
  }
}

/**
 * Rust 로 가는 유일한 문. `@tauri-apps/api` 를 import 하는 파일은 이 패키지뿐이며
 * 그 밖에서의 import 는 ESLint `no-restricted-imports` 가 막는다 (01 §2 · 05 §1.2).
 */
export const ipc = {
  repo: {
    register: (path: string) => call<RepoInfo>('repo_register', { path }),
    list: () => call<RepoInfo[]>('repo_list'),
    relocate: (repoId: RepoId, newPath: string) => call<RepoInfo>('repo_relocate', { repoId, newPath }),
    remove: (repoId: RepoId, purge: boolean) => call<void>('repo_remove', { repoId, purge }),
    globRead: (req: GlobReadReq) => call<{ relPath: string; text: string }[]>('repo_glob_read', req),
  },
  ingest: {
    start: (spec: IngestSpec) => call<{ jobId: JobId }>('ingest_start', spec),
    cancel: (jobId: JobId) => call<void>('ingest_cancel', { jobId }),
    status: (jobId: JobId) => call<IngestProgress | IngestDone>('ingest_status', { jobId }),
  },
  file: {
    readLines: (req: ReadLinesReq) => call<LinesChunk>('file_read_lines', req),
    readBlock: (req: ReadBlockReq) => call<Block>('file_read_block', req),
  },
  parse: {
    snippet: (req: SnippetReq) => call<SnippetResult>('parse_snippet', req),
    langs: () => call<LangInfo[]>('parse_langs'),
  },
  git: {
    diffText: (req: DiffReq) => call<CommitFileDiff>('git_diff_text', req),
    blameLines: (repoId: RepoId, relPath: string, rev?: string) =>
      call<{ hunks: BlameHunk[] }>('git_blame_lines', { repoId, relPath, rev }),
  },
  store: {
    open: (catalog: Catalog) => call<StoreInfo>('store_open', { catalog }),
    query: <K extends StatementName>(name: K, params: ParamsOf<K>) =>
      call<RowOf<K>[]>('store_query', { name, params }),
    exec: <K extends StatementName>(name: K, params: ParamsOf<K>) =>
      call<ExecInfo>('store_exec', { name, params }),
    batch: (ops: BatchOp[]) => call<ExecInfo[]>('store_batch', { ops }),
    info: () => call<StoreInfo>('store_info'),
  },
  dict: {
    list: () => call<DictEntry[]>('dict_list'),
    read: (lang: string) => call<DictFiles>('dict_read', { lang }),
    cacheRead: (key: string) => call<{ json: string } | null>('dict_cache_read', { key }),
    cacheWrite: (key: string, json: string) => call<void>('dict_cache_write', { key, json }),
  },
  app: {
    paths: () => call<AppPaths>('app_paths'),
    version: () => call<AppVersion>('app_version'),
    reveal: (which: 'data' | 'logs' | 'repo', repoId?: RepoId) => call<void>('app_reveal', { which, repoId }),
  },
  win: {
    /**
     * 창은 `visible:false` 로 만들어진다 (05 §1.2). 폰트가 준비된 뒤 이것을 부른다 —
     * 폴백 서체로 한 프레임이라도 그려지면 행 길이 실측이 흔들린다.
     */
    show: () => getCurrentWindow().show(),
  },
  /** T3 은 자리만 있다 — 언제나 NOT_IMPLEMENTED 다 (01 §9). */
  t3: {
    run: () => call<never>('t3_run'),
  },
} as const;

export { devPanel, IpcError, toIpcError };
export { on } from './events.js';
export type { IpcEvents, UnlistenFn } from './events.js';
export type { IpcErrorCode } from './errors.js';
export { IPC_ERROR_CODES } from './errors.js';
export type { BatchOp, ParamsOf, RowOf, StatementMap, StatementName } from './statements.js';
export type * from './types.js';
