/** `ko/clone.ts` 의 영어 짝. 없는 키는 `ko` 로 폴백한다 (D117). 조사 필터는 쓰지 않는다. */
export const clone: Record<string, string> = {
  'course.title': 'Clone course',
  'course.plain': '= transcribe one repo, in order',
  'course.scopeRepo': 'Whole repo',
  'course.scopeUnit': 'Sheet “{{name}}”',
  'course.modeCommit': 'In the order the commits built it',
  'course.modeDep': 'What gets imported comes first',
  'course.leave': 'Save and leave',
  'course.left': 'You left the course. Your progress is saved.',

  'course.tocLabel': 'Course contents',
  'course.tocCount': '{{done}} / {{total}} files',
  'course.tocCut': 'segments cut so far {{done}}/{{total}}',
  'course.tocPct': 'Course progress {{n}}%',
  'course.noUnit': 'Outside any sheet',
  'course.fileAt': 'No. {{n}}',
  'course.fileCount': '{{done}}/{{total}}',
  'course.fileUncut': 'Opens into segments',
  'course.part': 'Segment {{n}}',
  'course.partLines': 'lines {{from}}–{{to}}',
  'course.statusPending': 'Not yet',
  'course.statusActive': 'Now',
  'course.statusDone': 'Done · {{pct}}%',
  'course.statusStale': 'Source changed',
  'course.statusSkipped': 'Skipped',

  'course.emptyTitle': 'A course cannot be built from this repo',
  'course.emptyFiles':
    'A course only holds files whose language is known. This repo has none of those right now —'
    + ' either it has not been read yet, or it is all binaries and build output, or it is a single file.',
  'course.emptySteps':
    'The contents were built, but no segment came out of them. Not one function here is 12 lines'
    + ' or longer — write more of the repo and open this again.',
  'course.emptyRead':
    'The contents were built, but the source could not be read. Check whether the repo folder moved.',
  'course.emptyBack': 'Home',

  'course.plateNo': 'File {{seq}} · segment {{part}}',
  'course.plateKind': 'Stage {{stage}} · course',
  'course.plateSource': 'My code <b>{{file}}:{{from}}–{{to}}</b>',
  'course.noConcept': 'Language unknown',
  'course.resumed': 'Picking up at segment {{part}} of {{file}}.',
  'course.recut': 'The source changed, so this file was cut again.',
  'course.next': 'Next segment',
  'course.nextLast': 'Finish the course',
  'course.doneTitle': 'Course finished',
  'course.doneBody': 'You transcribed {{n}} segments. The ink layers already moved through the ledger.',
  'course.doneBack': 'Home',
  'course.noConceptNote':
    'The dictionary knows no grammar in this segment, so no ink layer moves. Only the score is kept.',

  'course.openOn': 'Open the course for “{{name}}”',
  'course.inSession': 'A course cannot open while a run is printing. Leave the session first.',
};
