/**
 * `ko/home.ts` 의 영어 짝. 없는 키는 `ko` 로 폴백한다 (D117). 조사 필터는 쓰지 않는다.
 *
 * 낱말은 평문이다 (D178 · 정본 §6) — unit · question · mastery level · today's plan.
 * 인쇄소 어휘(sheet · plate · ink layer · print)는 화면 문구에서 전량 빠졌다.
 * 행 길이는 05 §9 의 로케일 축(본문 45~68자)을 따른다.
 */
export const home: Record<string, string> = {
  // ── Ingest (screens/ingest) ─────────────────────────────────────────────
  'ingest.walkLabel': 'Reading code',
  'ingest.walkSub': 'File list and grammar',
  'ingest.gitLabel': 'History',
  'ingest.gitSub': 'Commits and excerpts',
  'ingest.deriveLabel': 'Concepts',
  'ingest.deriveSub': 'Finding where your code uses them',
  'ingest.cardsLabel': 'Writing questions',
  'ingest.cardsSub': 'Choosing what becomes a card',

  'ingest.done': 'Finished reading',
  'ingest.reading': 'Reading {{repo}}',
  'ingest.doneNote': 'Home now shows what is there and what is missing.',
  'ingest.readOnly': 'Nothing is written to the repo. It is only read.',

  'ingest.skips': '{{n}} files skipped',
  'ingest.more': '{{n}} more',
  'ingest.fileCap': '(file count limit)',
  'ingest.skipped': 'skipped — {{reason}}',
  'ingest.reasonOversize': 'too large',
  'ingest.reasonParsePoor': 'the grammar did not read it',
  'ingest.reasonTimeout': 'took too long',
  'ingest.reasonBinary': 'not text',
  'ingest.reasonGenerated': 'not written by a person',
  'ingest.reasonLongLine': 'a line too long',

  'ingest.cancel': 'Stop reading',
  'ingest.cancelling': 'Stopping…',
  'ingest.saidDone': 'Finished reading.',
  'ingest.saidStep': 'At {{label}}.',

  // ── Shared ──────────────────────────────────────────────────────────────
  'home.back': 'Home',

  // ── Mastery levels 0–4 ──────────────────────────────────────────────────
  'home.layer0N': 'Level 0',
  'home.layer0K': 'Not yet',
  'home.layer0Plain': 'never got it right',
  'home.layer1N': 'Level 1',
  'home.layer1K': 'First time',
  'home.layer1Plain': 'right once',
  'home.layer2N': 'Level 2',
  'home.layer2K': 'Learning',
  'home.layer2Plain': 'right again after a gap',
  'home.layer3N': 'Level 3',
  'home.layer3K': 'Settled',
  'home.layer3Plain': 'right after a long gap',
  'home.layer4N': 'Level 4',
  'home.layer4K': 'Learned',
  'home.layer4Plain': 'finished',

  'home.trackT0': 'T0 Grammar',
  'home.trackT1': 'T1 Clone coding',
  'home.trackT2': 'T2 Structure',
  'home.trackT3': 'T3',


  // ── Mastery and due labels ──────────────────────────────────────────────
  'home.layerLabel': '{{n}} · {{k}}',
  'home.layerN': 'Level {{n}}',
  'home.layerText': 'Mastery {{n}} of 4 · {{k}} · {{plain}}',
  'home.layerTextShort': 'Mastery {{n}} of 4',

  'home.dueNone': 'Not scheduled',
  'home.dueToday': 'Today',
  'home.dueTomorrow': 'Tomorrow',
  'home.dueDays': 'In {{n}} days',
  'home.dueWeeks': 'In {{n}} weeks',

  // ── Home screen ─────────────────────────────────────────────────────────

  'home.reingestTitle': 'Needs re-reading',
  'home.reingestNote':
    'One of the grammar, queries, card generator or dictionary changed. Reading the repo '
    + 'again rebuilds the cards and their sites — <b>the mastery you earned stays, '
    + 'because it belongs to the concept</b>.',



  'home.gapsTitle': 'Grammar not covered yet',
  'home.gapsPlain': '= in your code, no question for it yet',
  'home.gapsNote':
    'A line the AI wrote still counts — make a question and it joins that day’s list. '
    + 'Starting with the most frequent one covers several files at once.',

  'home.noSheets': 'No units yet. Reading the repo makes one unit per feature.',
  'home.noSheetsRead':
    'Read {{n}} files, but no unit yet — a folder needs at least three files to become one '
    + 'feature. Questions are still written; see “Today’s plan” above.',

  // ── Masthead ────────────────────────────────────────────────────────────
  'home.tkRepo': 'Repo',
  'home.settings': 'Settings',
  'home.repos': 'Repos',
  'home.nav': 'Main navigation',

  // ── Mastery scale ───────────────────────────────────────────────────────
  // 한국어는 수 뒤에 세는 말이 붙고 영어는 붙지 않는다. 빈 값은 폴백을 타지 않는다.

  // ── Colour bar ──────────────────────────────────────────────────────────

  // ── Concepts to redo ────────────────────────────────────────────────────

  // ── Forecast ────────────────────────────────────────────────────────────

  // ── Gaps panel ──────────────────────────────────────────────────────────
  // ── Not available yet: ownership placement (D170 ⑤) ────────────────────
  'home.forecastTitle': 'Ownership-placement questions',
  'home.forecastCannot':
    'The answer key is a real commit, and this repo has <b>{{n}}</b> of them. Blast-radius, '
    + 'flow and direction questions come from import edges and do show up in today\u2019s plan.',

  'home.gapsEmpty': 'No gaps. Every piece of grammar in your code has a question.',
  'home.gapsCount': '<b>{{n}}</b> uses',
  'home.gapsMake': 'Make a question',
  'home.gapsMakeFor': 'Make a question for {{label}}',

  // ── Not open yet ────────────────────────────────────────────────────────
  'home.lockedTitle': 'T1 transcription',
  'home.lockedBody':
    'This opens once some of the repo’s grammar has stuck. Right now every block has '
    + 'too much unfamiliar grammar, and transcribing would just be typing practice.',
  'home.lockedHow': 'Answer grammar questions (T0) for a few days and those blocks open.',

  // ── Newcomer notice ─────────────────────────────────────────────────────
  'home.newcomer': 'Read this first',
  'home.newcomerSuspect':
    'A root-concept question stalled today, and there was nothing below it to step down to.',
  'home.newcomerConfirmed':
    'A root-concept question stalled two sessions running, with nothing below to step down to.',
  'home.newcomerBody':
    'The root concepts have not stuck yet. Start with “Chapter 0 — the floor of this '
    + 'language” on the home screen: conditionals, functions and loops, pointed at through '
    + 'the simplest lines in your own code. To go slower, switch Settings › Learning to '
    + '“programming is new” and Chapter 0 gets longer. Nothing is locked.',

  // ── Chapter 0 — the floor of this language (D136) ───────────────────────
  'home.zeroChapter': 'Chapter 0 — the floor of this language',
  'home.zeroChapterSig': 'Ch. 0',
  'home.zeroChapterLead':
    'This language is new to you. {{n}} chapters from the roots first — two a day, '
    + 'so four days. After that it is like any other unit.',
  'home.zeroChapterMeta': '{{n}} questions · an opening with an end',
  'home.zeroChapterDone': 'Chapter 0 is done. You can reopen it any time.',

  // ── Concept node ────────────────────────────────────────────────────────
  'home.stateDone': 'learned',
  'home.stateCurrent': 'you are here',
  'home.stateLocked': 'no question yet',
  'home.stateOpen': 'up next',

  // ── Concept detail ──────────────────────────────────────────────────────
  'home.detailGo': 'Answer this question',

  // ── Unit ────────────────────────────────────────────────────────────────
  'home.unitsTitle': 'Units',
  'home.unitsSummary': 'Learned {{learned}} of {{concepts}} concepts',
  'home.sheetSig': 'Unit {{n}}',
  'home.sheetNoPath': 'no path',
  'home.sheetMeta': '{{where}} · {{files}} files · {{concepts}} concepts',

  // ── Today's plan ────────────────────────────────────────────────────────
  'home.todayTitle': 'Today’s plan',
  'home.todayEmpty':
    'Today’s share is done. If you want more, make a question from “Grammar you have not met yet” '
    + 'below, or take the next stage under “Course” at the top. Nothing gets padded out to fill '
    + 'the time — coming back tomorrow is fine.',
  'home.todayCount': '<b>{{plates}}</b> questions · about <b>{{mins}}</b> min',
  'home.todayList': 'Questions queued for today',
  'home.todayStart': 'Start studying',
  'home.todayStreak': '{{n}} days in a row',
  'home.previewNewT0': 'New syntax question',
  'home.previewT1': 'One transcription',
  'home.previewT2': 'One structure question',
  'home.todayResume': 'Carry on · from question {{n}}',

  'home.sheetCourse': 'Copy this whole unit',
  'home.course': 'Course',

  'home.startEmpty': 'Nothing to practice today. Read more of the repo, or come back tomorrow.',
  'home.makeNoPlate': 'A question for "{{label}}" cannot be built yet. The reason is listed under "Not learned yet".',
  'home.makeFailed': 'Could not queue a question for "{{label}}".',
  'home.makeNoQueue': 'Built a question for "{{label}}". There is nothing scheduled today, so it was not added to the list.',
  'home.makeReused': 'A question for "{{label}}" is already number {{n}} today.',
  'home.makeQueued': 'Added a question for "{{label}}" as number {{n}} today.',
};
