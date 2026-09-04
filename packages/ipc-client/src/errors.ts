/** 01 §6 의 오류 코드 전량. Rust `IpcError.code` 와 1:1. */
export const IPC_ERROR_CODES = [
  'GIT_NOT_REPO', 'GIT_BARE', 'GIT_COMMIT_NOT_FOUND', 'GIT_BLAME_TIMEOUT', 'GIT_IO',
  // 받아 오기 (D129) — https 가 아닌 주소, 그리고 받을 자리에 이미 뭔가 있는 경우.
  'GIT_URL_UNSUPPORTED', 'GIT_DEST_OCCUPIED',
  'PARSE_LANG_UNSUPPORTED', 'PARSE_QUERY_INVALID', 'PARSE_TOO_LARGE', 'PARSE_TIMEOUT', 'PARSE_TOO_DEEP',
  'STORE_ALREADY_OPEN', 'STORE_MIGRATION', 'STORE_CATALOG_MISSING', 'STORE_BUSY',
  'STORE_CONSTRAINT', 'STORE_CORRUPT',
  'BAD_INPUT', 'PAYLOAD_TOO_LARGE',
  'JOB_BUSY', 'JOB_NOT_FOUND', 'CANCELLED',
  'REPO_NOT_FOUND', 'REPO_DUPLICATE', 'REPO_PATH_MISSING', 'REPO_FINGERPRINT_MISMATCH',
  'NOT_IMPLEMENTED',
  'FS_PERMISSION', 'FS_NOT_FOUND',
  'DICT_NOT_FOUND',
  // OS 비밀 저장소가 없거나 거부했다 (06 §3.5 · D109). Linux 에 Secret Service 가 없으면
  // 저장 자체가 이 코드로 실패하고, 화면은 그것으로 「저장할 수 없다」를 안다.
  'SECRET_STORE',
  'UNKNOWN',
] as const;
export type IpcErrorCode = (typeof IPC_ERROR_CODES)[number];

const CODES = new Set<string>(IPC_ERROR_CODES);

export class IpcError extends Error {
  constructor(
    readonly code: IpcErrorCode,
    message: string,
    readonly detail: Record<string, unknown> = {},
    readonly retryable = false,
  ) {
    super(message);
    this.name = 'IpcError';
  }
}

/**
 * Rust 가 던진 것을 `IpcError` 로 되돌린다.
 * 모르는 모양이 와도 절대 던지지 않는다 — 오류 경로에서 오류가 나면 원인이 지워진다.
 */
export function toIpcError(e: unknown): IpcError {
  if (e instanceof IpcError) return e;
  if (typeof e === 'object' && e !== null && 'code' in e) {
    const raw = e as { code?: unknown; message?: unknown; detail?: unknown; retryable?: unknown };
    const code = typeof raw.code === 'string' && CODES.has(raw.code) ? (raw.code as IpcErrorCode) : 'UNKNOWN';
    return new IpcError(
      code,
      typeof raw.message === 'string' ? raw.message : String(raw.code),
      typeof raw.detail === 'object' && raw.detail !== null ? (raw.detail as Record<string, unknown>) : {},
      raw.retryable === true,
    );
  }
  return new IpcError('UNKNOWN', e instanceof Error ? e.message : String(e));
}
