/**
 * 한국어 카탈로그 — **키 집합의 정본**이다 (D117).
 *
 * 키를 여기 먼저 넣고 `en.ts` 가 따라온다. 값은 `@chickadee/text` 의 템플릿 문법을 쓴다
 * (`{{name}}` · `{{#section}}` · 필터 `|code`·`|josa:은,는`). 조사 필터는 이 파일에서만
 * 쓴다 — `en` 에서는 항등이라 아무것도 나오지 않는다.
 *
 * 키 이름은 `화면.자리` 다. 같은 문구를 두 화면이 쓰면 키를 나누지 않고 하나를 공유한다 —
 * 나중에 한쪽만 고치고 싶어지면 그때 나눈다.
 */
export const ko = {
  // 언어 이름은 그 언어로 적는다. `en` 카탈로그가 이 둘을 비워 두면 폴백으로 같은 값이 온다.
  'locale.ko': '한국어',
  'locale.en': 'English',

  'firstRun.note':
    '바이브 코딩으로 만든 내 코드가 교재입니다. 리포를 하나 등록하면 커밋과 파일을 읽어 '
    + '기능마다 대지를 깔고, 내 코드에 실제로 쓰인 문법부터 판을 짭니다. 읽기만 하고 '
    + '리포에는 아무것도 쓰지 않습니다.',
  'firstRun.language': '표시 언어',
  'firstRun.languageSwitch': '표시 언어 고르기 — 한국어 · English',
  'firstRun.pick': '리포 등록',

  'settings.identity.label': '내 커밋',
  'settings.identity.note':
    '커밋 author 가 여기 있는 메일·이름과 맞으면 「내 커밋」으로 셉니다. 비어 있으면 전부 '
    + '남의 것으로 갈리고, 구조 문제(T2)의 정답지가 한 장도 서지 않습니다.',
  'settings.identity.email': '메일',
  'settings.identity.name': '이름',
  'settings.identity.add': '추가',
  'settings.identity.remove': '{{email}} 지우기',
  'settings.identity.suggest': '이 리포에서 다시 찾기',
  'settings.identity.suggestions': '커밋에 남은 author',
  'settings.identity.suggestNone': '읽은 커밋에 author 가 없습니다. 손으로 넣어 주세요.',
  'settings.identity.invalid': '메일 주소 형태가 아닙니다.',
  'settings.identity.duplicate': '이미 있는 메일입니다.',
  'settings.identity.reclassified': '커밋 {{mine}} / {{all}} 건을 내 것으로 갈랐습니다.',
  'settings.identity.reclassifyFailed': '다시 가르지 못했습니다. 리포를 다시 읽으면 반영됩니다.',

  'settings.globs.label': '제외 글롭',
  'settings.globs.note':
    '한 줄에 하나. 기본 제외 목록(node_modules · 빌드 산출물 · 잠금 파일)에 **더해집니다** '
    + '— 여기를 비워도 그것들은 계속 빠집니다.',
  'settings.globs.reingest': '바꾼 것은 리포를 다시 읽어야 반영됩니다.',
  'settings.globs.errNegation': '{{line}} — 부정(!)은 오히려 포함시킵니다.',
  'settings.globs.errBackslash': '{{line}} — 역슬래시 대신 / 를 씁니다.',
  'settings.globs.errAbsolute': '{{line}} — 리포 안의 상대 경로여야 합니다.',
  'settings.globs.errUnbalanced': '{{line}} — 괄호 짝이 맞지 않습니다.',

  'settings.dictLangs.label': '문법 사전 언어',
  'settings.dictLangs.note':
    '끈 언어는 **새 판**에서 빠집니다. 이미 익힌 개념의 복습은 그대로 돌아갑니다 — 껐다고 '
    + '겹이 멈추면 다시 켰을 때 만기가 통째로 밀립니다.',
  'settings.dictLangs.axis':
    '화면에 보이는 글의 언어(위 「표시 언어」)와는 다른 축입니다. 여기서 고르는 것은 '
    + '무엇을 배울지이고, 표시 언어는 그것을 어느 말로 읽을지입니다.',
  'settings.dictLangs.count': '개념 {{n}}개',
  'settings.dictLangs.empty': '아직 읽은 사전이 없습니다. 리포를 한 번 읽으면 여기 찹니다.',

  'settings.look.motion': '모션',
  'settings.look.motionSwitch': '모션 시스템 따름 · 항상 줄이기',
  'settings.look.motionSystem': '시스템 따름',
  'settings.look.motionReduce': '항상 줄이기',
  'settings.look.motionNote':
    '「시스템 따름」은 이 컴퓨터의 「동작 줄이기」 설정을 그대로 씁니다. 「항상 줄이기」는 '
    + '전환 시간만 없애고 최종 모습은 그대로 둡니다 — 도장은 찍히고, 찍히는 데 걸리는 '
    + '시간만 사라집니다.',

  'settings.look.locale': '표시 언어',
  'settings.look.localeSwitch': '표시 언어 한국어 · English',
  'settings.look.localeNote':
    '언어를 바꾸면 화면을 다시 그립니다. 번역이 없는 문구는 한국어로 나옵니다.',
} as const;

/** 카탈로그가 가진 키 전부. `en` 은 이 중 일부만 가진다. */
export type MessageKey = keyof typeof ko;
