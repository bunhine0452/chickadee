import { listen, type UnlistenFn } from '@tauri-apps/api/event';

import type { IngestDone, IngestProgress, IngestWarning } from './types.js';
import { toIpcError } from './errors.js';
import type { IpcError } from './errors.js';

/** Rust 가 내보내는 이벤트 이름 (01 §3.2 · D15). */
export interface IpcEvents {
  ingest_progress: IngestProgress;
  ingest_done: IngestDone;
  ingest_warning: IngestWarning;
  ingest_error: IpcError;
}

export function on<K extends keyof IpcEvents>(
  name: K,
  cb: (payload: IpcEvents[K]) => void,
): Promise<UnlistenFn> {
  return listen(name, (e) => {
    cb(name === 'ingest_error' ? (toIpcError(e.payload) as IpcEvents[K]) : (e.payload as IpcEvents[K]));
  });
}

export type { UnlistenFn };
