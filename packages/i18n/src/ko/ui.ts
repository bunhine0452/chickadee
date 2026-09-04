/**
 * 프리미티브와 오류 문구 — packages/ui (error-copy · announce · Toast).
 *
 * 키 이름은 `화면.자리` 다. `ko` 가 키 집합의 정본이고 `en/ui.ts` 가 따라온다 (D117).
 * **이 파일은 그 영역을 맡은 세션만 고친다** — 카탈로그를 영역별로 가른 이유가 그것이다.
 *
 * `announce`·`Toast`·`LiveRegion`·`Dee` 는 문구를 들고 있지 않다 — 전부 인자로 받는다.
 * 그래서 이 파일은 `error-copy.ts` 의 표 하나다.
 */
export const ui = {
  'error.gitNotRepo.title': '이 폴더에는 <code>.git</code> 이 없습니다.',
  'error.gitNotRepo.detail': '리포 루트 폴더를 고르세요. 하위 폴더를 골라도 루트를 찾아 드립니다.',
  'error.gitBare.title': 'bare 리포는 파일이 없어 교재로 쓸 수 없습니다.',
  'error.gitCommitNotFound.title': '히스토리가 바뀐 것 같습니다.',
  'error.gitCommitNotFound.detail': '리포를 다시 읽어 옵니다.',
  'error.gitIo.title': '리포를 읽지 못했습니다.',
  // `GIT_IO` 와 `UNKNOWN` 이 같이 쓴다 — 한쪽만 고치고 싶어지면 그때 나눈다.
  'error.logsHaveMore': '자세한 내용은 로그에 있습니다.',
  'error.parseLangUnsupported.title': '아직 이 언어의 판이 없습니다.',
  'error.parseLangUnsupported.detail': '문법 사전에 언어를 더하면 그날부터 읽습니다.',
  'error.parseQueryInvalid.title': '문법 사전에 오류가 있습니다.',
  'error.parseQueryInvalid.detail': '어느 파일의 몇 행인지는 개발자 패널에 있습니다.',
  'error.parseTooLarge.title': '이 파일은 너무 커서 건너뛰었습니다.',
  'error.parseTimeout.title': '이 파일은 읽는 데 너무 오래 걸려 건너뛰었습니다.',
  'error.parseTooDeep.title': '이 파일은 너무 깊어 건너뛰었습니다.',
  'error.storeMigration.title': '데이터 파일을 새 판으로 옮기지 못했습니다.',
  'error.storeMigration.detail': '백업은 <code>backups/</code> 에 있습니다.',
  'error.storeConstraint.title': '저장하지 못했습니다.',
  'error.storeConstraint.detail': '화면을 새로 고쳐 주세요.',
  'error.storeCorrupt.title': '데이터 파일이 손상됐습니다.',
  'error.storeCorrupt.detail': '백업에서 복구할까요?',
  'error.jobBusy.title': '이미 읽는 중입니다.',
  'error.cancelled.title': '중단했습니다.',
  'error.cancelled.detail': '지금까지 읽은 부분은 유지됩니다.',
  'error.repoNotFound.title': '그 리포가 목록에 없습니다.',
  'error.repoDuplicate.title': '이미 등록된 리포입니다.',
  'error.repoPathMissing.title': '리포 폴더를 찾을 수 없습니다.',
  'error.repoPathMissing.detail': '옮겼다면 위치를 알려 주세요.',
  'error.repoFingerprintMismatch.title': '다른 리포입니다.',
  'error.repoFingerprintMismatch.detail': '첫 커밋이 다릅니다.',
  'error.notImplemented.title': 'T3 은 아직 없습니다.',
  'error.fsPermission.title': '폴더 접근 권한이 없습니다.',
  'error.fsPermission.detail': 'macOS 는 시스템 설정 → 개인정보 보호 및 보안에서 허용해 주세요.',
  'error.fsNotFound.title': '파일이 없습니다.',
  'error.dictNotFound.title': '문법 사전을 찾지 못했습니다.',
  'error.secretStore.title': '키를 이 컴퓨터의 비밀 저장소에 넣지 못했습니다.',
  'error.secretStore.detail': 'Linux 는 GNOME 키링 같은 Secret Service 가 있어야 합니다.',
  'error.unknown.title': '알 수 없는 오류입니다.',

  'error.actionRelocate': '위치 알려 주기',
  'error.actionReingest': '다시 읽기',
  'error.actionRestore': '백업에서 복구',
  'error.actionRevealLogs': '로그 폴더 열기',
  'error.actionContribute': '사전 기여 안내',
} as const;
