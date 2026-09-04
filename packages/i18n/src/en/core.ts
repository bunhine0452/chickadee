/**
 * `ko/core.ts` 의 영어 짝. 없는 키는 `ko` 로 폴백한다 (D117).
 *
 * 조사 필터(`|josa:`)는 쓰지 않는다 — `catalog.test.ts` 가 막는다.
 */
export const core: Record<string, string> = {
  // 'locale.ko' · 'locale.en' 은 일부러 비운다 — 언어 이름은 그 언어로 적는다.

  'firstRun.note':
    'Your own vibe-coded repo is the textbook. Register one and Chickadee reads its '
    + 'commits and files, lays a sheet per feature, and sets plates from the grammar your '
    + 'code actually uses. It only reads — nothing is written back to the repo.',
  'firstRun.language': 'Display language',
  'firstRun.languageSwitch': 'Choose a display language — 한국어 · English',
  'firstRun.pick': 'Add a repo',

  'settings.identity.label': 'My commits',
  'settings.identity.note':
    'A commit counts as yours when its author matches one of these addresses or names. '
    + 'With none set, every commit is read as someone else\u2019s and no structure question '
    + '(T2) gets an answer key.',
  'settings.identity.email': 'Email',
  'settings.identity.name': 'Name',
  'settings.identity.add': 'Add',
  'settings.identity.remove': 'Remove {{email}}',
  'settings.identity.suggest': 'Look again in this repo',
  'settings.identity.suggestions': 'Authors found in commits',
  'settings.identity.suggestNone': 'No author on the commits read. Add one by hand.',
  'settings.identity.invalid': 'That is not an email address.',
  'settings.identity.duplicate': 'That address is already listed.',
  'settings.identity.reclassified': 'Sorted {{mine}} of {{all}} commits as yours.',
  'settings.identity.reclassifyFailed': 'Could not sort them again. Re-reading the repo applies it.',

  'settings.globs.label': 'Excluded paths',
  'settings.globs.note':
    'One glob per line. These are **added to** the built-in list (node_modules, build '
    + 'output, lock files) \u2014 leaving this empty still skips those.',
  'settings.globs.reingest': 'Changes here apply the next time the repo is read.',
  'settings.globs.errNegation': '{{line}} \u2014 a negation (!) puts files back in.',
  'settings.globs.errBackslash': '{{line}} \u2014 use / rather than a backslash.',
  'settings.globs.errAbsolute': '{{line}} \u2014 must be a path inside the repo.',
  'settings.globs.errUnbalanced': '{{line}} \u2014 the brackets do not close.',

  'settings.dictLangs.label': 'Grammar dictionary languages',
  'settings.dictLangs.note':
    'A language you turn off is dropped from **new plates**. Reviews of concepts you '
    + 'already know keep running \u2014 if layers stopped, everything would be overdue at '
    + 'once when you turn it back on.',
  'settings.dictLangs.axis':
    'This is a different axis from the display language above. Here you choose what to '
    + 'learn; the display language chooses which words you read it in.',
  'settings.dictLangs.count': '{{n}} concepts',
  'settings.dictLangs.empty': 'No dictionary read yet. Reading a repo once fills this in.',

  'settings.look.motion': 'Motion',
  'settings.look.motionSwitch': 'Motion follow the system \u00b7 always reduce',
  'settings.look.motionSystem': 'Follow the system',
  'settings.look.motionReduce': 'Always reduce',
  'settings.look.motionNote':
    '\u201cFollow the system\u201d takes this computer\u2019s reduce-motion setting as is. '
    + '\u201cAlways reduce\u201d drops the transition time and keeps the end state \u2014 '
    + 'the stamp still lands, it just stops taking time to get there.',

  'settings.look.locale': 'Display language',
  'settings.look.localeSwitch': 'Display language 한국어 · English',
  'settings.look.localeNote':
    'Changing the language redraws the screen. Anything not translated yet shows in Korean.',
};
