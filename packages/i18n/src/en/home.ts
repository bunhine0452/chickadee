/**
 * `ko/home.ts` 의 영어 짝. 없는 키는 `ko` 로 폴백한다 (D117). 조사 필터는 쓰지 않는다.
 *
 * 인쇄소 은유(대지 = sheet · 판 = plate · 겹 = layer · 인쇄 = print)를 그대로 간다 —
 * 화면 전체가 그 은유 위에 서 있어서 여기만 평범한 낱말로 풀면 나머지와 어긋난다.
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
  'ingest.cardsLabel': 'Setting plates',
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

  // ── Ink layer names ─────────────────────────────────────────────────────
  'home.layer0N': '0 layers',
  'home.layer0K': 'Unprinted',
  'home.layer0Plain': 'silhouette only',
  'home.layer1N': '1 layer',
  'home.layer1K': 'First pass',
  'home.layer1Plain': 'faint halftone',
  'home.layer2N': '2 layers',
  'home.layer2K': 'Black plate',
  'home.layer2Plain': 'the outline holds',
  'home.layer3N': '3 layers',
  'home.layer3K': '+ Cyan',
  'home.layer3Plain': 'colour arrives',
  'home.layer4N': '4 layers',
  'home.layer4K': '+ Crimson',
  'home.layer4Plain': 'finished',

  'home.trackT0': 'T0 Grammar',
  'home.trackT1': 'T1 Clone coding',
  'home.trackT2': 'T2 Structure',
  'home.trackT3': 'T3',

  'home.run0': 'Unprinted',
  'home.run1': 'First pass',
  'home.run2': '1 pass',
  'home.run3': '2 passes',
  'home.run4': '3 passes',

  // ── Layer and due labels ────────────────────────────────────────────────
  'home.layerLabel': '{{n}} {{k}}',
  'home.layerN': '{{n}} layers',
  'home.layerText': 'Ink {{n}} of 4 · {{k}} · {{plain}}',
  'home.layerTextShort': 'Ink {{n}} of 4',
  'home.railLabel': 'Plate {{no}} · {{run}}',
  'home.passesLabel': '{{track}} · ink {{n}} layers',

  'home.dueNone': 'Not scheduled',
  'home.dueToday': 'Today',
  'home.dueTomorrow': 'Tomorrow',
  'home.dueDays': 'In {{n}} days',
  'home.dueWeeks': 'In {{n}} weeks',

  // ── Home screen ─────────────────────────────────────────────────────────
  'home.guide': '“{{name}}” is next. {{layer}}.',

  'home.reingestTitle': 'Needs re-reading',
  'home.reingestPlain': '= the repo has to be read again',
  'home.reingestNote':
    'One of the grammar, queries, card generator or dictionary changed. Reading the repo '
    + 'again rebuilds the cards and their sites — <b>the layers you earned stay, '
    + 'because they belong to the concept</b>.',

  'home.boardTitle': '<em>{{repo}}</em> sheets',
  'home.boardPlain': '= the feature map of your repo',
  'home.boardNote':
    'One unit is one real feature of your repo. Of the {{concepts}} concepts pulled from '
    + 'your commits and files, <b>{{printed}} are printed</b>.',

  'home.inkTitle': 'Ink layers',
  'home.inkPlain': '= how much has stuck',
  'home.inkTag': '4 layers = finished',
  'home.inkNote':
    'The bird sharpens as a concept sticks. Layers count <b>times you got it right after '
    + 'a gap</b>, not <b>times you got it right</b>. Pressing “No idea” drops one '
    + 'layer and brings the plate back sooner.',

  'home.gapsTitle': 'Grammar without a plate',
  'home.gapsPlain': '= in your code, not yet printed',
  'home.gapsNote':
    'A line the AI wrote still counts — make a plate and it joins that day’s run. '
    + 'Starting with the most frequent one covers several files at once.',

  'home.noSheets': 'No sheets yet. Reading the repo lays one sheet per feature.',

  // ── Masthead ────────────────────────────────────────────────────────────
  'home.brandLine': 'A print shop where your code is the textbook',
  'home.ticket': 'Job ticket',
  'home.tkRepo': 'Repo',
  'home.tkDate': 'Date',
  'home.tkStreak': 'Printing streak',
  'home.tkDay': 'd',
  'home.tkInk': 'Concept ink',
  'home.tkAvgLayer': 'layers avg',
  'home.settings': 'Settings',

  // ── Legend ──────────────────────────────────────────────────────────────
  'home.legend': 'Ink legend',
  'home.legendT0': 'Grammar',
  'home.legendT1': 'Clone coding',
  'home.legendT2': 'Structure',

  // ── Ink scale ───────────────────────────────────────────────────────────
  'home.inkScaleSaid': 'Ink layers, five steps. {{parts}}.',
  'home.inkScalePart': '{{n}} {{k}} {{count}}',
  // 한국어는 수 뒤에 세는 말이 붙고 영어는 붙지 않는다. 빈 값은 폴백을 타지 않는다.
  'home.countUnit': '',

  // ── Colour bar ──────────────────────────────────────────────────────────
  'home.barTitle': 'Last 14 days · ink density',
  'home.barNote': 'One cell is a day. Darker means a longer run.',
  'home.barSaid': 'Ink density over 14 days. {{printed}} days printed, {{total}} minutes.',
  'home.barToday': 'Today',
  'home.barDaysAgo': '{{n}} days ago',
  'home.barCell': '{{when}} · {{amount}}',
  'home.barRest': 'rest',
  'home.mins': '{{n}} min',

  // ── Concepts to reprint ─────────────────────────────────────────────────
  'home.retake': 'Concepts to print again',
  'home.retakeEmpty': 'Nothing to print again yet. The first plate fills this in.',

  // ── Forecast ────────────────────────────────────────────────────────────
  'home.forecastNext': 'Sheet {{n}} –',
  'home.forecastCannot':
    '<b>This repo cannot carry T2 yet.</b> Structure questions need more commits. '
    + 'There are <b>{{n}}</b> so far.',
  'home.forecastLater':
    '<b>No plate set yet.</b> As commits build up the source is read again and sheets are '
    + 'added. <b>{{n}}</b> files have been read so far.',
  'home.forecastMarkCannot': 'not yet',
  'home.forecastMarkLater': 'unset',

  // ── Gaps panel ──────────────────────────────────────────────────────────
  'home.gapsEmpty': 'No gaps. Every piece of grammar in your code has a plate.',
  'home.gapsCount': '<b>{{n}}</b> uses',
  'home.gapsMake': 'Make a plate',
  'home.gapsMakeFor': 'Make a plate for {{label}}',

  // ── Not open yet ────────────────────────────────────────────────────────
  'home.locked': 'Not open yet',
  'home.lockedTitle': 'T1 transcription',
  'home.lockedBody':
    'This opens once some of the repo’s grammar has stuck. Right now every block has '
    + 'too much unfamiliar grammar, and transcribing would just be typing practice.',
  'home.lockedHow': 'Print grammar plates (T0) for a few days and those blocks open.',

  // ── Newcomer notice ─────────────────────────────────────────────────────
  'home.newcomer': 'Read this first',
  'home.newcomerSuspect':
    'A root-concept plate stalled today, and there was nothing below it to step down to.',
  'home.newcomerConfirmed':
    'A root-concept plate stalled two sessions running, with nothing below to step down to.',
  'home.newcomerBody':
    'This app uses your own code as the textbook — if “variable” and '
    + '“function” are themselves new, there is no textbook yet. CS50 '
    + '(cs50.harvard.edu) first, and the plates here will read. Nothing is locked.',

  // ── Node sticker ────────────────────────────────────────────────────────
  'home.nodeLabel': '{{name}}. {{track}}. {{layer}}. {{state}}.',
  'home.stateDone': 'printed',
  'home.stateCurrent': 'you are here',
  'home.stateLocked': 'no plate hung yet',
  'home.stateOpen': 'up next',

  // ── Node detail ─────────────────────────────────────────────────────────
  'home.detail': '{{name}} detail',
  'home.detailTitleLocked': '{{name}} — no plate hung yet',
  'home.detailLockedBody':
    'The plate before this one comes first. Print it and this sticker is cut out right '
    + 'away. The order comes from how the concepts depend on each other.',
  'home.detailDone': 'Four layers, so it is finished. It fades in time and comes back then.',
  'home.detailNext': 'Next print is {{due}}. Getting it right makes {{n}} layers.',
  'home.detailGo': 'Print this plate',
  'home.detailClose': 'Close',

  // ── Sheet ───────────────────────────────────────────────────────────────
  'home.sheetIndex': 'Sheet index',
  'home.sheetChip': 'Sheet {{no}} · {{name}} · {{done}} of {{all}} printed',
  'home.sheetStamp': 'PRINTED',
  'home.sheetSig': 'Sheet {{n}}',
  'home.sheetFeature': 'Feature {{n}}',
  'home.sheetNoPath': 'no path',
  'home.sheetMeta': '{{where}} · {{files}} files · {{concepts}} concepts',
  'home.sheetStatusLocked': 'Sheet {{n}} first',
  'home.sheetStatusPrinting': 'Printing {{done}} / {{all}}',

  // ── Today's run ─────────────────────────────────────────────────────────
  'home.todayTitle': 'Today’s run',
  'home.todayPlain': '= the plates for today',
  'home.todayEmpty':
    'No plates to print today. Dig into the repo some more, or come back tomorrow — '
    + 'nothing gets padded out to fill the time.',
  'home.todayCount': '<b>{{plates}}</b> plates · about <b>{{mins}}</b> min',
  'home.todayList': 'Plates queued for today',
  'home.todayDays': 'Printing record for the last {{n}} days',
  'home.todayStart': 'Start printing',
  'home.todayResume': 'Carry on · from plate {{n}}',

  'home.sheetCourse': 'Copy this whole sheet',
  'home.course': 'Course',
};
