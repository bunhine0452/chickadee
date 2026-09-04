/** `ko/ui.ts` 의 영어 짝. 없는 키는 `ko` 로 폴백한다 (D117). 조사 필터는 쓰지 않는다. */
export const ui: Record<string, string> = {
  'error.gitNotRepo.title': 'There is no <code>.git</code> in this folder.',
  'error.gitNotRepo.detail':
    'Pick the repo root. Picking a subfolder works too — the root is found from there.',
  'error.gitBare.title': 'A bare repo has no files, so it cannot be the textbook.',
  'error.gitCommitNotFound.title': 'The history looks rewritten.',
  'error.gitCommitNotFound.detail': 'Reading the repo again.',
  'error.gitIo.title': 'Could not read the repo.',
  'error.gitUrlUnsupported.title': 'Only https addresses are fetched.',
  'error.gitUrlUnsupported.detail':
    'Copy the HTTPS address from the Code button on GitHub. An ssh address (git@…) needs a key, '
    + 'so it is not fetched yet.',
  'error.gitDestOccupied.title': 'Something is already at that spot.',
  'error.gitDestOccupied.detail':
    'A folder of that name is already there. If you have the repo on disk already, add it with '
    + 'Add a repo instead.',
  'error.logsHaveMore': 'The log has the details.',
  'error.parseLangUnsupported.title': 'No plates for this language yet.',
  'error.parseLangUnsupported.detail':
    'Add the language to the grammar dictionary and it is read from that day on.',
  'error.parseQueryInvalid.title': 'The grammar dictionary has an error.',
  'error.parseQueryInvalid.detail': 'The developer panel says which file and which line.',
  'error.parseTooLarge.title': 'This file was skipped — too large.',
  'error.parseTimeout.title': 'This file was skipped — it took too long to read.',
  'error.parseTooDeep.title': 'This file was skipped — too deeply nested.',
  'error.storeMigration.title': 'Could not move the data file to the new plate.',
  'error.storeMigration.detail': 'The backup is in <code>backups/</code>.',
  'error.storeConstraint.title': 'Could not save.',
  'error.storeConstraint.detail': 'Reload the screen.',
  'error.storeCorrupt.title': 'The data file is damaged.',
  'error.storeCorrupt.detail': 'Restore from a backup?',
  'error.jobBusy.title': 'Already reading.',
  'error.cancelled.title': 'Stopped.',
  'error.cancelled.detail': 'What was read so far is kept.',
  'error.repoNotFound.title': 'That repo is not in the list.',
  'error.repoDuplicate.title': 'That repo is already registered.',
  'error.repoPathMissing.title': 'Cannot find the repo folder.',
  'error.repoPathMissing.detail': 'If you moved it, point to the new place.',
  'error.repoFingerprintMismatch.title': 'This is a different repo.',
  'error.repoFingerprintMismatch.detail': 'The first commit differs.',
  'error.notImplemented.title': 'T3 does not exist yet.',
  'error.fsPermission.title': 'No permission to open that folder.',
  'error.fsPermission.detail':
    'On macOS, allow it in System Settings → Privacy & Security.',
  'error.fsNotFound.title': 'No such file.',
  'error.dictNotFound.title': 'Could not find the grammar dictionary.',
  'error.secretStore.title': 'Could not put the key in this computer’s secret store.',
  'error.secretStore.detail':
    'On Linux a Secret Service such as the GNOME keyring has to be running.',
  'error.unknown.title': 'Something went wrong.',

  'error.actionRelocate': 'Point to it',
  'error.actionReingest': 'Read again',
  'error.actionRestore': 'Restore from backup',
  'error.actionRevealLogs': 'Open the log folder',
  'error.actionContribute': 'How to contribute a dictionary',
};
