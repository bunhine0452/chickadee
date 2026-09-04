/**
 * 서가 · 리포 스위처 영문 (D117 · D119). `ko` 의 부분집합이고 없는 키는 `ko` 로 폴백한다.
 * 조사 필터(`|josa:`)는 쓰지 않는다 — `catalog.test.ts` 가 막는다.
 */

export const repos: Record<string, string> = {
  'repos.fromSettings': 'Manage in the shelf',
  'repos.fromSettingsNote':
    'Adding, relocating and removing happen in the shelf. This list only reads.',
  'repos.title': 'Shelf',
  'repos.plain': '= every repo you registered',
  'repos.back': 'Home',
  'repos.add': 'Add a repo',
  'repos.pickFolder': 'Choose a repo folder',
  'repos.pickNew': 'Choose the folder it moved to',

  'repos.cloneLabel': 'git address',
  'repos.clonePlaceholder': 'https://github.com/user/repo',
  'repos.cloneGo': 'Fetch from address',
  'repos.cloneBusy': 'Fetching…',
  'repos.pickClone': 'Choose where to put it',
  'repos.cloneNote':
    'Paste an https address and Chickadee puts it under the folder you choose, named after '
    + 'the repo, and registers it. A large repo takes a few minutes.',
  'repos.note':
    'Every repo keeps its own study record. Switching repos leaves a session where it was, '
    + 'and coming back picks it up at the same plate.',
  'repos.empty':
    'No repo registered yet. Register a folder and Chickadee reads its commits and files '
    + 'and sets plates from them.',
  'repos.open': 'Open {{name}}',
  'repos.active': 'Open now',

  'repos.statusOk': 'Readable',
  'repos.statusMissing': 'Folder gone',
  'repos.statusDetached': 'Off the list',

  'repos.lastIngest': 'Last read',
  'repos.never': 'Not yet',
  'repos.concepts': 'concepts',
  'repos.avgLayer': 'layers on average',
  'repos.due': 'Due today',

  'repos.missingNote':
    'Nothing at this path. If you moved the folder, point us at the new place — your '
    + 'study record follows it.',
  'repos.detachedNote':
    'This repo is off the list. Register the same folder again and its layers and study '
    + 'record come back.',
  'repos.locate': 'Point at the new place',
  'repos.mismatch': 'That is a different repo — its first commit does not match.',
  'repos.relocated': 'Found {{name}} at its new place.',

  'repos.remove': 'Take off the list',
  'repos.purge': 'Erase everything',
  'repos.removeAsk':
    'Takes {{name}} off the list. What was read and what you studied stays, and '
    + 'registering the same folder picks it back up.',
  'repos.purgeAsk':
    'Erases the files, commits and concept sites of {{name}}. Cards are retired, not '
    + 'deleted — what you printed and when hangs off the card, so deleting cards would cut '
    + 'the study record.',
  'repos.confirmRemove': 'Take it off',
  'repos.confirmPurge': 'Erase',
  'repos.cancel': 'Never mind',
  'repos.removed': 'Took {{name}} off the list.',
  'repos.purged': 'Erased {{name}}. What you printed stays.',

  'repos.switch': 'Switch repo',
  'repos.all': 'See all',
  'repos.inSession': 'You cannot switch repos during a session.',
};
