/**
 * 클론 코스 — screens/clone.
 *
 * 키 이름은 `화면.자리` 다. `ko` 가 키 집합의 정본이고 `en/clone.ts` 가 따라온다 (D117).
 * **이 파일은 그 영역을 맡은 세션만 고친다** — 카탈로그를 영역별로 가른 이유가 그것이다.
 *
 * 자리 이름이 `clone.` 이 아니라 **`course.`** 인 이유: `clone.` 은 이미 T1 판의 문구가
 * 60여 키로 쓰고 있고(`ko/session.ts`), 두 파일이 같은 이름을 내면 `ko.ts` 의 전개에서
 * 나중 것이 앞 것을 조용히 덮는다. 코스 화면은 그 판을 **재사용**하므로 판의 문구는
 * `clone.` 을 그대로 부르고, 코스만의 문구가 여기 `course.` 로 선다.
 */
export const clone = {
  // ───────── 화면 머리 ─────────
  'course.title': '클론 코스',
  'course.plain': '= 리포 하나를 순서대로 필사',
  'course.scopeRepo': '리포 전체',
  'course.scopeUnit': '대지 「{{name}}」',
  'course.modeCommit': '만들어진 커밋 순서',
  'course.modeDep': '불리는 파일이 먼저',
  'course.leave': '저장하고 나가기',
  'course.left': '코스에서 나왔습니다. 진행은 저장됐습니다.',

  // ───────── 목차 ─────────
  'course.tocLabel': '코스 목차',
  'course.tocCount': '{{done}} / {{total}} 파일',
  'course.tocCut': '지금까지 자른 조각 {{done}}/{{total}}',
  'course.tocPct': '코스 진행률 {{n}}%',
  'course.noUnit': '대지 밖',
  'course.fileAt': '{{n}}번',
  'course.fileCount': '{{done}}/{{total}}',
  'course.fileUncut': '열면 조각으로 나뉩니다',
  'course.part': '조각 {{n}}',
  'course.partLines': '{{from}}–{{to}}줄',
  'course.statusPending': '아직',
  'course.statusActive': '지금',
  'course.statusDone': '끝 · {{pct}}%',
  'course.statusStale': '원본이 바뀜',
  'course.statusSkipped': '건너뜀',

  // ───────── 빈 상태 ─────────
  'course.emptyTitle': '이 리포로는 코스가 서지 않습니다',
  'course.emptyFiles':
    '코스에 담는 것은 문법을 아는 파일뿐입니다. 지금 이 리포에는 그런 파일이 없습니다 —'
    + ' 아직 읽지 않았거나, 바이너리·생성물만 있거나, 파일이 하나뿐입니다.',
  'course.emptySteps':
    '목차는 섰지만 필사할 조각이 나오지 않았습니다. 12줄 이상인 함수가 한 개도 없는'
    + ' 리포입니다 — 파일을 더 쓴 뒤에 다시 열어 주세요.',
  'course.emptyRead':
    '목차는 섰는데 원문을 읽지 못했습니다. 리포 폴더가 옮겨졌는지 확인해 주세요.',
  'course.emptyBack': '홈으로',

  // ───────── 판 ─────────
  'course.plateNo': '{{seq}}번 파일 · {{part}}번째 조각',
  'course.plateKind': '{{stage}}단계 · 코스',
  'course.plateSource': '내 코드 <b>{{file}}:{{from}}–{{to}}</b>',
  'course.noConcept': '문법 미상',
  'course.resumed': '{{file}} 의 {{part}}번째 조각부터 이어 갑니다.',
  'course.recut': '원본이 바뀌어 이 파일을 다시 잘랐습니다.',
  'course.next': '다음 조각',
  'course.nextLast': '코스 마치기',
  'course.doneTitle': '코스를 마쳤습니다',
  'course.doneBody': '{{n}}개 조각을 필사했습니다. 겹은 원장을 거쳐 이미 올랐습니다.',
  'course.doneBack': '홈으로',
  'course.noConceptNote':
    '이 조각에는 사전이 아는 문법이 없어 겹은 오르지 않습니다. 점수만 남습니다.',

  // ───────── 진입 ─────────
  'course.openOn': '「{{name}}」 코스 열기',
  'course.inSession': '인쇄 중에는 코스를 열 수 없습니다. 먼저 세션에서 나와 주세요.',
} as const;
