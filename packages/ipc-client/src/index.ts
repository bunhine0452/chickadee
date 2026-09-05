import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';

import { devPanel } from './devpanel.js';
import { IpcError, toIpcError } from './errors.js';
import type { BatchOp, ParamsOf, RowOf, StatementName } from './statements.js';
import type {
  AppPaths, AppVersion, AskOut, AskSpec, BlameHunk, Block, Catalog, ExecInfo, IngestDone, IngestProgress,
  FileDiff, IngestSpec, JobId, LangInfo, LinesChunk, ProcOut, ProcSpec, ReadBlockReq,
  ReadLinesReq, RepoProbe, SnippetReq, SnippetResult, StoreInfo,
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
    /**
     * 주소 하나를 받아 `into` 에 통째로 내려받고, 받은 것을 `probe` 와 같은 모양으로
     * 돌려준다 (D129). `into` 는 **아직 없어야 하는 전체 경로**다 — 어디에 받을지 고르고
     * 폴더 이름을 정하는 것은 TS 쪽 일이다(`@chickadee/concepts` 의 `cloneRepo`).
     * 리포가 크면 분 단위로 걸린다.
     */
    clone: (url: string, into: string) => call<RepoProbe>('repo_clone', { url, into }),
  },
  ingest: {
    /**
     * `ingest_start(spec: JobSpec)` 는 인자를 **구조체 하나**로 받는다 — 펼쳐 보내면
     * Tauri 가 `missing required key spec` 으로 되던진다. 다른 명령들은 인자를 낱개로
     * 받아 그대로 펼치므로 이 하나만 모양이 다르다.
     */
    start: (spec: IngestSpec) => call<{ jobId: JobId }>('ingest_start', { spec }),
    cancel: (jobId: JobId) => call<void>('ingest_cancel', { jobId }),
    status: (jobId: JobId) => call<IngestProgress | IngestDone>('ingest_status', { jobId }),
  },
  file: {
    readLines: (req: ReadLinesReq) => call<LinesChunk>('file_read_lines', req),
    readBlock: (req: ReadBlockReq) => call<Block>('file_read_block', req),
  },
  parse: {
    /**
     * 답안 블록 하나를 파싱한다 (04 §4.5). 인자를 낱개로 펼쳐 보낸다 (D87) —
     * `req` 를 그대로 넘기면 필드 이름이 그대로 인자 이름이 된다.
     */
    snippet: (req: SnippetReq) => call<SnippetResult>('parse_snippet', req),
    langs: () => call<LangInfo[]>('parse_langs'),
  },
  git: {
    blameLines: (rootPath: string, relPath: string, rev?: string) =>
      call<{ hunks: BlameHunk[] }>('git_blame_lines', { rootPath, relPath, rev }),
    /** 커밋 하나가 파일 하나에 더한 줄 (04 §8.1 의 「추가 줄이 전부 import 문」). */
    diffText: (rootPath: string, sha: string, relPath: string) =>
      call<FileDiff>('git_diff_text', { rootPath, sha, relPath }),
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
    /**
     * 산출 파일 하나 (D109). 경로가 아니라 **자리와 이름**을 준다 — 임의 경로 쓰기를
     * IPC 에 열지 않는다. 돌려받는 것은 만든 파일의 디렉터리이고, 화면은 그것을 연다.
     */
    writeJson: (box: 'exports' | 'logs/crash', name: string, json: string) =>
      call<string>('app_write_json', { box, name, json }),
    /** 전부 지우기 (06 §6.4). 키체인 항목과 앱 종료는 부르는 쪽의 몫이다. */
    wipe: () => call<void>('app_wipe'),
  },
  /**
   * OS 비밀 저장소 (06 §3.5). **값을 되읽는 문은 없다** — 있는지만 물을 수 있다.
   * 키는 `WebView` 로 내려오지 않는다 (06 §4.3).
   */
  secret: {
    set: (account: string, value: string) => call<void>('secret_set', { account, value }),
    delete: (account: string) => call<void>('secret_delete', { account }),
    has: (account: string) => call<boolean>('secret_has', { account }),
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
  clip: {
    /**
     * 4단 프롬프트 복사 (05 §6). `navigator.clipboard` 는 **패키징된 WKWebView 에서
     * 조용히 거절한다** — 보안 컨텍스트가 아니어서다. 플러그인은 Rust 를 거치므로 세 OS 에서
     * 같게 돈다. `@tauri-apps/plugin-*` 도 이 패키지 밖에서는 import 할 수 없다 (01 §2).
     */
    write: async (text: string): Promise<void> => {
      const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
      await writeText(text);
    },
  },
  win: {
    /**
     * 창은 `visible:false` 로 만들어진다 (05 §1.2). 폰트가 준비된 뒤 이것을 부른다 —
     * 폴백 서체로 한 프레임이라도 그려지면 행 길이 실측이 흔들린다.
     */
    show: () => getCurrentWindow().show(),
  },
  /**
   * 4·5단을 실제로 실행해 판정한다 (D175). 여기는 **프로세스 한 겹**이고, 무엇을
   * 실행할지·통과인지는 `@chickadee/grading` 의 `runTests` 가 정한다.
   *
   * 실패한 자식은 오류가 아니다 — 종료 코드로 돌아온다. 오류로 던지는 것은 시작조차
   * 못 한 경우(`RUN_SPAWN`)와 입출력 실패(`RUN_IO`)뿐이다.
   */
  t3: {
    run: (spec: ProcSpec) => call<ProcOut>('t3_run', { spec }),
  },
  /**
   * 임시 sqlite 하나를 세우고 묻는다 (D175 를 SQL 로). 여기는 **엔진 한 겹**이고,
   * 무엇을 세울지·기대 표와 맞는지는 `@chickadee/grading` 의 `runSql` 이 정한다.
   *
   * 잘못 적힌 문장은 오류가 아니다 — `failedAt` 과 `message` 로 돌아온다. 오류로 던지는
   * 것은 엔진 자체를 못 연 경우(`RUN_IO`)뿐이다.
   */
  sql: {
    run: (spec: AskSpec) => call<AskOut>('sql_run', { spec }),
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
