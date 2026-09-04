/**
 * 서가 · 리포 스위처 문구 (D119). `ko` 가 정본이라 키를 여기 먼저 넣는다 (D117).
 *
 * 영역별로 파일을 나눈 이유는 하나다 — 화면이 늘 때마다 카탈로그 한 파일을 여럿이 고치면
 * 문구가 아니라 병합이 일이 된다. 합치는 자리는 `ko.ts` 하나뿐이고 그 파일은 상위 세션이 소유한다.
 */
export const repos = {
  'repos.fromSettings': '서가에서 관리',
  'repos.fromSettingsNote':
    '추가·이동·삭제는 서가에서 합니다. 여기 목록은 읽기만 합니다.',
  'repos.title': '서가',
  'repos.plain': '= 등록한 리포 전부',
  'repos.back': '홈으로',
  'repos.add': '리포 추가',
  'repos.pickFolder': '리포 폴더 고르기',
  'repos.pickNew': '옮긴 리포 폴더 고르기',

  // 주소로 받기 (D129). 첫 실행과 서가가 같은 문구를 쓴다.
  'repos.cloneLabel': 'git 주소',
  'repos.clonePlaceholder': 'https://github.com/사용자/리포',
  'repos.cloneGo': '주소로 받기',
  'repos.cloneBusy': '받는 중…',
  'repos.pickClone': '받을 자리 고르기',
  'repos.cloneNote':
    'https 주소를 붙여 넣으면 고른 폴더 아래에 리포 이름으로 받아서 그대로 등록합니다. '
    + '큰 리포는 몇 분 걸립니다.',
  'repos.note':
    '리포마다 학습 기록이 따로 쌓입니다. 리포를 바꿔도 진행 중인 세션은 그 리포에 남아, '
    + '돌아오면 그 자리에서 이어 찍힙니다.',
  'repos.empty': '등록된 리포가 없습니다. 폴더를 하나 등록하면 커밋과 파일을 읽어 판을 짭니다.',
  'repos.open': '「{{name}}」 리포 열기',
  'repos.active': '보는 중',

  'repos.statusOk': '읽을 수 있음',
  'repos.statusMissing': '폴더 없음',
  'repos.statusDetached': '목록에서 뺌',

  'repos.lastIngest': '마지막 읽기',
  'repos.never': '아직 없음',
  'repos.concepts': '개념',
  'repos.avgLayer': '겹 평균',
  // 오늘 큐의 복습 몫이다. 새 개념은 하루 상한과 선행 판정이 걸려 세션을 열어야 정해진다.
  'repos.due': '오늘 만기',

  'repos.missingNote':
    '이 경로에 폴더가 없습니다. 옮겼다면 새 위치를 알려 주세요 — 학습 기록은 그대로 이어집니다.',
  'repos.detachedNote':
    '목록에서 뺀 리포입니다. 같은 폴더를 다시 등록하면 개념 겹과 학습 기록이 그대로 돌아옵니다.',
  'repos.locate': '위치 알려주기',
  'repos.mismatch': '다른 리포입니다 — 첫 커밋이 다릅니다.',
  'repos.relocated': '「{{name}}」 리포의 새 위치를 잡았습니다.',

  'repos.remove': '목록에서 빼기',
  'repos.purge': '전부 지우기',
  'repos.removeAsk':
    '「{{name}}」 리포를 목록에서 뺍니다. 읽은 내용과 학습 기록은 그대로 남고, 같은 폴더를 '
    + '다시 등록하면 이어집니다.',
  'repos.purgeAsk':
    '「{{name}}」 리포의 파일·커밋·개념 사용처를 지웁니다. 카드는 지우지 않고 은퇴시킵니다 — '
    + '언제 무엇을 찍었는지가 카드에 매여 있어 카드를 지우면 학습 기록이 끊깁니다.',
  'repos.confirmRemove': '뺍니다',
  'repos.confirmPurge': '지웁니다',
  'repos.cancel': '그만두기',
  'repos.removed': '「{{name}}」 리포를 목록에서 뺐습니다.',
  'repos.purged': '「{{name}}」 리포를 지웠습니다. 찍은 기록은 남습니다.',

  'repos.switch': '리포 전환',
  'repos.all': '전부 보기',
  'repos.inSession': '세션 중에는 리포를 바꿀 수 없습니다.',
} as const;
