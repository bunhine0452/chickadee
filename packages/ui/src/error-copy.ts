/**
 * 오류 코드 → 사용자 문구 (01 §6 표). 코드는 Rust 가 정하고 **문장은 여기가 정한다** —
 * 오류 문구도 앱 문구이므로 카탈로그를 거친다(D117). 은유 옆에 평문을 병기한다(정본 §6).
 *
 * 「무엇이 잘못됐다」로 끝내지 않는다. 사용자가 **다음에 할 수 있는 일**이 있으면 `action`
 * 으로 같이 준다 — 리포를 옮겼으면 위치를 알려 주고, 히스토리가 바뀌었으면 다시 읽는다.
 *
 * 표는 문장이 아니라 **키**를 든다. 모듈이 열리는 시점은 `setLocale()` 보다 이를 수 있어서
 * 문장을 여기서 굳히면 첫 화면이 늘 한국어로 나온다 — `errorCopy()` 가 부를 때 푼다.
 */
import type { IpcErrorCode } from '@chickadee/ipc-client';
import { t, type MessageKey } from '@chickadee/i18n';

/** 화면이 이어 붙일 수 있는 다음 동작. 문구는 버튼 라벨이다. */
export type ErrorAction = 'relocate' | 'reingest' | 'restore' | 'reveal-logs' | 'contribute' | null;

export interface ErrorCopy {
  /** 한 문장. 사용자가 읽는 전부일 수 있다. */
  title: string;
  /** 필요할 때만. 없으면 제목이 스스로 설명한다. */
  detail?: string;
  action: ErrorAction;
  /** 사용자에게 보이지 않고 로그와 개발자 패널에만 남는 것 (01 §6). */
  internal?: true;
}

/** 표에 적히는 것. `title` 이 `null` 이면 화면에 나가지 않는 코드다. */
interface ErrorEntry {
  title: MessageKey | null;
  detail?: MessageKey;
  action: ErrorAction;
  internal?: true;
}

const COPY: Record<IpcErrorCode, ErrorEntry> = {
  GIT_NOT_REPO: {
    title: 'error.gitNotRepo.title',
    detail: 'error.gitNotRepo.detail',
    action: null,
  },
  GIT_BARE: {
    title: 'error.gitBare.title',
    action: null,
  },
  GIT_COMMIT_NOT_FOUND: {
    title: 'error.gitCommitNotFound.title',
    detail: 'error.gitCommitNotFound.detail',
    action: 'reingest',
  },
  // 출처 없이 카드를 유지한다 — 사용자가 알아야 할 일이 아니다 (03 §1.5).
  GIT_BLAME_TIMEOUT: { title: null, action: null, internal: true },
  GIT_IO: {
    title: 'error.gitIo.title',
    detail: 'error.logsHaveMore',
    action: 'reveal-logs',
  },
  GIT_URL_UNSUPPORTED: {
    title: 'error.gitUrlUnsupported.title',
    detail: 'error.gitUrlUnsupported.detail',
    action: null,
  },
  GIT_DEST_OCCUPIED: {
    title: 'error.gitDestOccupied.title',
    detail: 'error.gitDestOccupied.detail',
    action: null,
  },
  PARSE_LANG_UNSUPPORTED: {
    title: 'error.parseLangUnsupported.title',
    detail: 'error.parseLangUnsupported.detail',
    action: 'contribute',
  },
  PARSE_QUERY_INVALID: {
    title: 'error.parseQueryInvalid.title',
    detail: 'error.parseQueryInvalid.detail',
    action: 'contribute',
  },
  PARSE_TOO_LARGE: { title: 'error.parseTooLarge.title', action: null },
  PARSE_TIMEOUT: { title: 'error.parseTimeout.title', action: null },
  PARSE_TOO_DEEP: { title: 'error.parseTooDeep.title', action: null },
  STORE_ALREADY_OPEN: { title: null, action: null, internal: true },
  STORE_MIGRATION: {
    title: 'error.storeMigration.title',
    detail: 'error.storeMigration.detail',
    action: 'reveal-logs',
  },
  STORE_CATALOG_MISSING: { title: null, action: null, internal: true },
  STORE_BUSY: { title: null, action: null, internal: true },
  STORE_CONSTRAINT: {
    title: 'error.storeConstraint.title',
    detail: 'error.storeConstraint.detail',
    action: null,
  },
  STORE_CORRUPT: {
    title: 'error.storeCorrupt.title',
    detail: 'error.storeCorrupt.detail',
    action: 'restore',
  },
  BAD_INPUT: { title: null, action: null, internal: true },
  PAYLOAD_TOO_LARGE: { title: null, action: null, internal: true },
  JOB_BUSY: { title: 'error.jobBusy.title', action: null },
  JOB_NOT_FOUND: { title: null, action: null, internal: true },
  CANCELLED: {
    title: 'error.cancelled.title',
    detail: 'error.cancelled.detail',
    action: null,
  },
  REPO_NOT_FOUND: { title: 'error.repoNotFound.title', action: null },
  REPO_DUPLICATE: { title: 'error.repoDuplicate.title', action: null },
  REPO_PATH_MISSING: {
    title: 'error.repoPathMissing.title',
    detail: 'error.repoPathMissing.detail',
    action: 'relocate',
  },
  REPO_FINGERPRINT_MISMATCH: {
    title: 'error.repoFingerprintMismatch.title',
    detail: 'error.repoFingerprintMismatch.detail',
    action: null,
  },
  NOT_IMPLEMENTED: { title: 'error.notImplemented.title', action: null },
  FS_PERMISSION: {
    title: 'error.fsPermission.title',
    detail: 'error.fsPermission.detail',
    action: null,
  },
  FS_NOT_FOUND: { title: 'error.fsNotFound.title', action: null },
  DICT_NOT_FOUND: { title: 'error.dictNotFound.title', action: 'contribute' },
  // 설정 화면이 이 상태를 스스로 말한다(「이 컴퓨터에는 안전하게 저장할 수 없습니다」) —
  // 토스트로 한 번 더 띄우면 같은 말이 두 곳에서 나온다.
  SECRET_STORE: {
    title: 'error.secretStore.title',
    detail: 'error.secretStore.detail',
    action: null,
    internal: true,
  },
  UNKNOWN: {
    title: 'error.unknown.title',
    detail: 'error.logsHaveMore',
    action: 'reveal-logs',
  },
};

/** 사용자에게 보이지 않는 코드 — 화면은 이것을 토스트로 띄우지 않는다. */
export const isInternal = (code: IpcErrorCode): boolean => COPY[code]?.internal === true;

export function errorCopy(code: IpcErrorCode): ErrorCopy {
  const entry = COPY[code] ?? COPY.UNKNOWN;
  return {
    title: entry.title === null ? '' : t(entry.title),
    ...(entry.detail === undefined ? {} : { detail: t(entry.detail) }),
    action: entry.action,
    ...(entry.internal === undefined ? {} : { internal: entry.internal }),
  };
}

const ACTION_KEY: Record<Exclude<ErrorAction, null>, MessageKey> = {
  relocate: 'error.actionRelocate',
  reingest: 'error.actionReingest',
  restore: 'error.actionRestore',
  'reveal-logs': 'error.actionRevealLogs',
  contribute: 'error.actionContribute',
};

/** 다음 동작의 버튼 라벨. `action` 이 `null` 이면 버튼이 없어 부를 일도 없다. */
export function actionLabel(action: Exclude<ErrorAction, null>): string {
  return t(ACTION_KEY[action]);
}
