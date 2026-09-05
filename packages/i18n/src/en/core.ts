/**
 * `ko/core.ts` 의 영어 짝. 없는 키는 `ko` 로 폴백한다 (D117).
 *
 * 조사 필터(`|josa:`)는 쓰지 않는다 — `catalog.test.ts` 가 막는다.
 */
export const core: Record<string, string> = {
  // 'locale.ko' · 'locale.en' 은 일부러 비운다 — 언어 이름은 그 언어로 적는다.

  'firstRun.note':
    'Your own vibe-coded repo is the textbook. Register one and Chickadee reads its '
    + 'commits and files, makes a unit per feature, and writes questions from the grammar '
    + 'your '
    + 'code actually uses. It only reads — nothing is written back to the repo.',
  'firstRun.scope':
    'It is fine if “variable” and “function” are new. The first session opens Chapter 0 — '
    + 'the floor of this language — and works up from the simplest lines in your own code.',
  'firstRun.newcomerQ': 'Is programming new to you?',
  'firstRun.newcomerAsk': 'This only sets how long Chapter 0 runs. Nothing is locked.',
  'firstRun.newcomerYes': 'It is new',
  'firstRun.newcomerNo': 'I have coded',
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
    'One glob per line. These are <b>added to</b> the built-in list (node_modules, build '
    + 'output, lock files) \u2014 leaving this empty still skips those.',
  'settings.globs.reingest': 'Changes here apply the next time the repo is read.',
  'settings.globs.errNegation': '{{line}} \u2014 a negation (!) puts files back in.',
  'settings.globs.errBackslash': '{{line}} \u2014 use / rather than a backslash.',
  'settings.globs.errAbsolute': '{{line}} \u2014 must be a path inside the repo.',
  'settings.globs.errUnbalanced': '{{line}} \u2014 the brackets do not close.',

  'settings.dictLangs.label': 'Grammar dictionary languages',
  'settings.dictLangs.note':
    'A language you turn off is dropped from <b>new questions</b>. Reviews of concepts you '
    + 'already know keep running \u2014 if mastery stopped, everything would be overdue at '
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
    + 'the result still lands, it just stops taking time to get there.',

  'settings.look.locale': 'Display language',
  'settings.look.localeSwitch': 'Display language 한국어 · English',
  'settings.look.localeNote':
    'Changing the language redraws the screen. Anything not translated yet shows in Korean.',

  // ── Look: the two switches the masthead shares ──────────────────────────
  'settings.look.title': 'Look',
  'settings.look.plain': '= screen brightness and decoration',
  'settings.look.process': 'Screen',
  'settings.look.themeLight': 'Light',
  'settings.look.themeDark': 'Dark',
  'settings.look.themeSwitch': 'Light \u00b7 dark',
  'settings.look.trimOff': 'Decoration shown',
  'settings.look.trimOn': 'Decoration hidden',
  'settings.look.trimSwitch': 'Show \u00b7 hide decoration',
  'settings.look.note':
    'What you pick here is saved and comes back next time. \u201cDecoration hidden\u201d drops '
    + 'only the background texture and the tilt \u2014 not one pixel of the type or the '
    + 'layout.',

  // ── Screen heading and section titles ──────────────────────────────────
  'settings.title': 'Settings',
  'settings.plain': '= how this app treats you',

  'settings.repo.title': 'Repos',
  'settings.repo.plain': '= the folders read as a textbook',
  'settings.repo.empty': 'No repo registered.',
  'settings.repo.lastIngest': 'Last read {{when}}',
  'settings.repo.never': 'never',
  'settings.repo.reingestNote':
    'When the grammar, queries, generator or dictionary change, home shows a '
    + '\u201cneeds re-reading\u201d banner. Reading again rebuilds only the cards and their '
    + 'sites \u2014 <b>mastery is per concept and stays</b>.',

  'settings.study.title': 'Study',
  'settings.study.plain': '= how much a day, and from when',
  'settings.study.budget': 'Daily budget',
  'settings.study.budgetNote': 'minutes (10\u201325)',
  'settings.study.rollover': 'Day boundary',
  'settings.study.rolloverNote': 'hour \u2014 before this counts as yesterday',
  'settings.study.newPerDay': 'New questions',
  'settings.study.newPerDayNote': 'per day (max 4)',
  'settings.study.newcomer': 'Programming experience',
  'settings.study.newcomerSwitch': 'Choose whether programming is new — It is new · I have coded',
  'settings.study.newcomerYes': 'It is new',
  'settings.study.newcomerNo': 'I have coded',
  'settings.study.newcomerNote':
    'Left on “It is new”, <b>Chapter 0 runs longer</b> — getting a few root questions right will '
    + 'not close it, and it stays open until every concept in it is at level 1. Nothing is locked, and '
    + 'you can change this at any time.',
  'settings.study.coach': 'First-question walkthrough',
  'settings.study.coachSwitch': 'First-question walkthrough on · off',
  'settings.study.coachOn': 'On',
  'settings.study.coachOff': 'Off',
  'settings.study.coachNote':
    'When on, the first question of your next session walks you through pick → submit → read the result, one step at a time. It is a real question, so mastery still counts.',
  'settings.study.tz': 'Time zone',
  'settings.study.tzNote': 'This is the reference so travelling does not drop yesterday\u2019s queue',

  'settings.key.title': 'LLM key',
  'settings.key.plain': '= the key for free questions',
  'settings.perf.title': 'Performance',
  'settings.perf.plain': '= times measured on this computer',
  'settings.data.title': 'Data',
  'settings.data.plain': '= take my records out, or delete them',
  'settings.privacy.title': 'Privacy note',
  'settings.privacy.plain': '= what is kept, and where',
  'settings.about.title': 'About',
  'settings.about.plain': '= version',
  'settings.about.dataDir': 'Data location',

  // ── Data section ───────────────────────────────────────────────────────
  'settings.data.legend': 'What to include',
  'settings.data.note':
    'Schema version, concept mastery, session summaries and settings are always included. '
    + 'The two below are <b>your code and your own writing</b>, so they are left out by '
    + 'default.',
  'settings.data.excerpts': 'Include card excerpts (lines of your code)',
  'settings.data.drafts': 'Include T1 transcription drafts',
  'settings.data.export': 'Export my records',
  'settings.data.openData': 'Open the data folder',
  'settings.data.openLogs': 'Open the log folder',
  'settings.data.whereNote':
    'You are not asked where to put it \u2014 it goes in <code>exports/</code> inside the app '
    + 'data folder, and that folder opens. Move it wherever you like from there.',
  'settings.data.wipe': 'Delete everything',
  'settings.data.wipeWarn':
    '<b>This cannot be undone.</b> It deletes the study database, backups, dictionary '
    + 'cache, logs, crash records, settings and the API key in the keychain. Files in your '
    + 'repo folders are not touched.',
  'settings.data.wipeGo': 'Yes, delete everything',
  'settings.data.wiping': 'Deleting\u2026',
  'settings.data.wipeCancel': 'Never mind',

  // ── 06 \u00a73.6 privacy note (0.1.0 wording) ─────────────────────────────
  'settings.privacy.p1':
    'Your code does not leave this computer. Chickadee only reads your repo, and keeps '
    + 'your study record in a single database file on this machine.',
  'settings.privacy.p2':
    'This build does not use the internet at all \u2014 even the prompt for a free question '
    + 'is built here for you to copy. The app never sends it.',
  'settings.privacy.p3':
    'No usage statistics, no crash reports, no update checks. Settings \u2192 Delete '
    + 'everything removes every record.',

  // ── One-line notices (LiveRegion) ──────────────────────────────────────
  'settings.loadFailed': 'Some settings could not be read.',
  'settings.saveFailed': 'Could not save that.',
  'settings.exported': 'Wrote {{name}} to {{dir}}.',
  'settings.exportFailed': 'Could not export.',
  'settings.wiped': 'Everything deleted. Please close the app \u2014 it starts fresh next time.',
  'settings.wipeFailed': 'Could not delete all of it. Close the app and try again.',
  'settings.localeFailed': 'Could not save the display language.',

  // ── Performance table ──────────────────────────────────────────────────
  'settings.perf.empty': 'Nothing measured yet. Reading a repo or answering a question fills this.',
  'settings.perf.caption': 'Last {{n}} samples (milliseconds)',
  'settings.perf.colItem': 'Item',
  'settings.perf.colSamples': 'Samples',
  'settings.perf.colMax': 'Max',
  'settings.perf.colBudget': 'Budget',
  'settings.perf.kindIngestTotal': 'Read, total',
  'settings.perf.kindIngestFileP95': 'Parse per file p95',
  'settings.perf.kindQueue': 'Queue build',
  'settings.perf.kindT1Grade': 'T1 grading',
  'settings.perf.kindFrameP95': 'Home frame p95',
  'settings.perf.kindHomePaint': 'Home first paint',
  'settings.perf.kindSessionMount': 'Session open',
  'settings.perf.kindT0Grade': 'T0 grading',
  'settings.perf.kindT1Monaco': 'T1 editor',
  'settings.perf.kindThemeSwitch': 'Theme change',
  'settings.perf.kindLiferOpen': 'LIFER open',

  // ── LLM key ────────────────────────────────────────────────────────────
  'settings.key.apiKey': 'API key',
  'settings.key.save': 'Save',
  'settings.key.drop': 'Delete',
  'settings.key.loading': 'Checking the keychain.',
  'settings.key.noSend':
    'This app sends nothing on its own. Building and copying a prompt in '
    + '\u201cFree question\u201d works without a key.',
  'settings.key.none':
    'Store a key and 0.2 opens a door to send that prompt from the app. For now it is '
    + 'only saved.',
  'settings.key.noneNote':
    'The key goes into this computer\u2019s keychain and nowhere else. Once stored it never '
    + 'appears on screen or in the logs again.',
  'settings.key.stored': 'Stored in this computer\u2019s keychain.',
  'settings.key.storedSoon':
    'Sending opens in 0.2. For now you can build a prompt and copy it, and that is all.',
  'settings.key.storedNote': 'The value is never shown again \u2014 there is no door to read it back.',
  'settings.key.unavailable':
    'This computer cannot store it safely (no Secret Service). Copying prompts still works.',
  'settings.key.unavailableNote':
    'It is not kept in a plain file. Install gnome-keyring or KWallet and open this screen '
    + 'again.',
  'settings.key.saved': 'Key saved.',
  'settings.key.dropped': 'Key deleted.',
  'settings.key.cannotStore': 'Could not put the key on this computer.',
  'settings.key.failed': 'Could not save. Try again in a moment.',

  'queue.allDone': 'All {{n}} steps done',
  'queue.at': 'Step {{i}} of {{n}}, "{{label}}", {{percent}}% of the way',
  'queue.secs': '{{n}}s',
  'queue.mins': '{{n}} min',
};
