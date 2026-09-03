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

  'settings.look.locale': '표시 언어',
  'settings.look.localeSwitch': '표시 언어 한국어 · English',
  'settings.look.localeNote':
    '언어를 바꾸면 화면을 다시 그립니다. 번역이 없는 문구는 한국어로 나옵니다.',
} as const;

/** 카탈로그가 가진 키 전부. `en` 은 이 중 일부만 가진다. */
export type MessageKey = keyof typeof ko;
