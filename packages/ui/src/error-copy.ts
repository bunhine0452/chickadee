/**
 * 오류 코드 → 사용자 문구 (01 §6 표). 코드는 Rust 가 정하고 **문장은 여기가 정한다** —
 * 오류 문구는 앱 문구이므로 한국어이고(D61), 은유 옆에 평문을 병기한다(정본 §6).
 *
 * 「무엇이 잘못됐다」로 끝내지 않는다. 사용자가 **다음에 할 수 있는 일**이 있으면 `action`
 * 으로 같이 준다 — 리포를 옮겼으면 위치를 알려 주고, 히스토리가 바뀌었으면 다시 읽는다.
 */
import type { IpcErrorCode } from '@chickadee/ipc-client';

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

const COPY: Record<IpcErrorCode, ErrorCopy> = {
  GIT_NOT_REPO: {
    title: '이 폴더에는 <code>.git</code> 이 없습니다.',
    detail: '리포 루트 폴더를 고르세요. 하위 폴더를 골라도 루트를 찾아 드립니다.',
    action: null,
  },
  GIT_BARE: {
    title: 'bare 리포는 파일이 없어 교재로 쓸 수 없습니다.',
    action: null,
  },
  GIT_COMMIT_NOT_FOUND: {
    title: '히스토리가 바뀐 것 같습니다.',
    detail: '리포를 다시 읽어 옵니다.',
    action: 'reingest',
  },
  // 출처 없이 카드를 유지한다 — 사용자가 알아야 할 일이 아니다 (03 §1.5).
  GIT_BLAME_TIMEOUT: { title: '', action: null, internal: true },
  GIT_IO: {
    title: '리포를 읽지 못했습니다.',
    detail: '자세한 내용은 로그에 있습니다.',
    action: 'reveal-logs',
  },
  PARSE_LANG_UNSUPPORTED: {
    title: '아직 이 언어의 판이 없습니다.',
    detail: '문법 사전에 언어를 더하면 그날부터 읽습니다.',
    action: 'contribute',
  },
  PARSE_QUERY_INVALID: {
    title: '문법 사전에 오류가 있습니다.',
    detail: '어느 파일의 몇 행인지는 개발자 패널에 있습니다.',
    action: 'contribute',
  },
  PARSE_TOO_LARGE: { title: '이 파일은 너무 커서 건너뛰었습니다.', action: null },
  PARSE_TIMEOUT: { title: '이 파일은 읽는 데 너무 오래 걸려 건너뛰었습니다.', action: null },
  PARSE_TOO_DEEP: { title: '이 파일은 너무 깊어 건너뛰었습니다.', action: null },
  STORE_ALREADY_OPEN: { title: '', action: null, internal: true },
  STORE_MIGRATION: {
    title: '데이터 파일을 새 판으로 옮기지 못했습니다.',
    detail: '백업은 <code>backups/</code> 에 있습니다.',
    action: 'reveal-logs',
  },
  STORE_CATALOG_MISSING: { title: '', action: null, internal: true },
  STORE_BUSY: { title: '', action: null, internal: true },
  STORE_CONSTRAINT: {
    title: '저장하지 못했습니다.',
    detail: '화면을 새로 고쳐 주세요.',
    action: null,
  },
  STORE_CORRUPT: {
    title: '데이터 파일이 손상됐습니다.',
    detail: '백업에서 복구할까요?',
    action: 'restore',
  },
  BAD_INPUT: { title: '', action: null, internal: true },
  PAYLOAD_TOO_LARGE: { title: '', action: null, internal: true },
  JOB_BUSY: { title: '이미 읽는 중입니다.', action: null },
  JOB_NOT_FOUND: { title: '', action: null, internal: true },
  CANCELLED: {
    title: '중단했습니다.',
    detail: '지금까지 읽은 부분은 유지됩니다.',
    action: null,
  },
  REPO_NOT_FOUND: { title: '그 리포가 목록에 없습니다.', action: null },
  REPO_DUPLICATE: { title: '이미 등록된 리포입니다.', action: null },
  REPO_PATH_MISSING: {
    title: '리포 폴더를 찾을 수 없습니다.',
    detail: '옮겼다면 위치를 알려 주세요.',
    action: 'relocate',
  },
  REPO_FINGERPRINT_MISMATCH: {
    title: '다른 리포입니다.',
    detail: '첫 커밋이 다릅니다.',
    action: null,
  },
  NOT_IMPLEMENTED: { title: 'T3 은 아직 없습니다.', action: null },
  FS_PERMISSION: {
    title: '폴더 접근 권한이 없습니다.',
    detail: 'macOS 는 시스템 설정 → 개인정보 보호 및 보안에서 허용해 주세요.',
    action: null,
  },
  FS_NOT_FOUND: { title: '파일이 없습니다.', action: null },
  DICT_NOT_FOUND: { title: '문법 사전을 찾지 못했습니다.', action: 'contribute' },
  UNKNOWN: {
    title: '알 수 없는 오류입니다.',
    detail: '자세한 내용은 로그에 있습니다.',
    action: 'reveal-logs',
  },
};

/** 사용자에게 보이지 않는 코드 — 화면은 이것을 토스트로 띄우지 않는다. */
export const isInternal = (code: IpcErrorCode): boolean => COPY[code]?.internal === true;

export function errorCopy(code: IpcErrorCode): ErrorCopy {
  return COPY[code] ?? COPY.UNKNOWN;
}

/** 다음 동작의 버튼 라벨. `null` 이면 버튼이 없다. */
export const ACTION_LABEL: Record<Exclude<ErrorAction, null>, string> = {
  relocate: '위치 알려 주기',
  reingest: '다시 읽기',
  restore: '백업에서 복구',
  'reveal-logs': '로그 폴더 열기',
  contribute: '사전 기여 안내',
};
