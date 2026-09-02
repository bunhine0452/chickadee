import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

import { devPanel } from './devpanel.js';
import { IpcError, toIpcError } from './errors.js';
import type { BatchOp, ParamsOf, RowOf, StatementName } from './statements.js';
import type {
  AppPaths, AppVersion, BlameHunk, Block, Catalog, ExecInfo, IngestDone, IngestProgress,
  IngestSpec, JobId, LangInfo, LinesChunk, ReadBlockReq, ReadLinesReq, RepoProbe,
  StoreInfo,
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
    /**
     * 루트를 찾아 신원만 돌려준다. 등록·목록·이동·삭제는 `@chickadee/concepts` 의
     * `repos.ts` 가 이것과 `repo.*` statement 로 조립한다 (D65).
     */
    probe: (path: string) => call<RepoProbe>('repo_probe', { path }),
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
    /** `parse_snippet` 은 T1 AST 층과 함께 M3 에서 돌아온다 (D67). */
    langs: () => call<LangInfo[]>('parse_langs'),
  },
  git: {
    blameLines: (rootPath: string, relPath: string, rev?: string) =>
      call<{ hunks: BlameHunk[] }>('git_blame_lines', { rootPath, relPath, rev }),
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
  app: {
    paths: () => call<AppPaths>('app_paths'),
    version: () => call<AppVersion>('app_version'),
    reveal: (which: 'data' | 'logs' | 'repo', at?: string) => call<void>('app_reveal', { which, at }),
  },
  dialog: {
    /**
     * 리포 폴더 고르기. `plugin-dialog` 도 `@tauri-apps/*` 라 이 패키지 밖에서는
     * import 할 수 없다 (01 §2 · 05 §1.2). 고른 경로는 그대로 `repo_probe` 로 간다.
     */
    pickFolder: async (title: string): Promise<string | null> => {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const picked = await open({ directory: true, multiple: false, title });
      return typeof picked === 'string' ? picked : null;
    },
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
export { log, REDACTED, safeFields, scrub, setSink } from './logger.js';
export type { Fields, Level, Sink } from './logger.js';
export { on } from './events.js';
export type { IpcEvents, UnlistenFn } from './events.js';
export type { IpcErrorCode } from './errors.js';
export { IPC_ERROR_CODES } from './errors.js';
export type { BatchOp, ParamsOf, RowOf, StatementMap, StatementName } from './statements.js';
export type * from './types.js';
