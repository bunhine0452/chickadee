/**
 * 언어 이름 · 첫 실행 · 설정 문구 (D117). **상위 세션이 소유한다** — 새 영역은 옆 파일에.
 *
 * 값은 `@chickadee/text` 의 템플릿 문법을 쓴다(`{{name}}` · 필터 `|code`·`|josa:은,는`).
 * 조사 필터는 `ko` 에서만 쓴다 — `en` 에서는 항등이라 아무것도 나오지 않는다.
 */
export const core = {
  // 언어 이름은 그 언어로 적는다. `en` 카탈로그가 이 둘을 비워 두면 폴백으로 같은 값이 온다.
  'locale.ko': '한국어',
  'locale.en': 'English',

  'firstRun.note':
    '바이브 코딩으로 만든 내 코드가 교재입니다. 리포를 하나 등록하면 커밋과 파일을 읽어 '
    + '기능마다 단원을 만들고, 내 코드에 실제로 쓰인 문법부터 문제를 냅니다. 읽기만 하고 '
    + '리포에는 아무것도 쓰지 않습니다.',
  // 대상 경계 (D139 · 정본 §1 「앱이 그 사실을 정직하게 말한다」). 두 세션을 헛돌고 나서야
  // 뜨던 `home.newcomer` 를 **첫 화면으로 당긴 것**이다. 외부 자료는 새로 고르지 않고
  // `home.newcomerBody` 에 이미 실명으로 있는 둘을 그대로 쓴다. 묻지 않고 잠그지 않는다.
  // D147 이 D139 의 전제를 뒤집었다 — 「대상이 아니다」가 아니라 「0장이 데려간다」다.
  // 뒤집힌 것은 「묻지 않는다」 하나뿐이라 아래 한 문항은 **레벨이 아니라 경계 안쪽인지**만
  // 묻는다. 답해도 잠기는 것은 없고 설정 「학습」에서 언제든 바꾼다.
  'firstRun.scope':
    '「변수」·「함수」가 처음이어도 됩니다. 첫 세션에 「0장 — 이 언어의 바닥」이 열려 '
    + '조건문·함수·반복부터 내 코드의 가장 단순한 줄로 짚어 갑니다.',
  'firstRun.newcomerQ': '프로그래밍이 처음이신가요?',
  'firstRun.newcomerAsk': '0장을 얼마나 길게 열지만 정합니다. 잠기는 것은 없습니다.',
  'firstRun.newcomerYes': '처음입니다',
  'firstRun.newcomerNo': '해 봤습니다',
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
    '한 줄에 하나. 기본 제외 목록(node_modules · 빌드 산출물 · 잠금 파일)에 <b>더해집니다</b> '
    + '— 여기를 비워도 그것들은 계속 빠집니다.',
  'settings.globs.reingest': '바꾼 것은 리포를 다시 읽어야 반영됩니다.',
  'settings.globs.errNegation': '{{line}} — 부정(!)은 오히려 포함시킵니다.',
  'settings.globs.errBackslash': '{{line}} — 역슬래시 대신 / 를 씁니다.',
  'settings.globs.errAbsolute': '{{line}} — 리포 안의 상대 경로여야 합니다.',
  'settings.globs.errUnbalanced': '{{line}} — 괄호 짝이 맞지 않습니다.',

  'settings.dictLangs.label': '문법 사전 언어',
  'settings.dictLangs.note':
    '끈 언어는 <b>새 문제</b>에서 빠집니다. 이미 익힌 개념의 복습은 그대로 돌아갑니다 — 껐다고 '
    + '숙련도가 멈추면 다시 켰을 때 만기가 통째로 밀립니다.',
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
    + '전환 시간만 없애고 최종 모습은 그대로 둡니다 — 채점 결과는 그대로 뜨고, 뜨는 데 '
    + '걸리는 시간만 사라집니다.',

  'settings.look.locale': '표시 언어',
  'settings.look.localeSwitch': '표시 언어 한국어 · English',
  'settings.look.localeNote':
    '언어를 바꾸면 화면을 다시 그립니다. 번역이 없는 문구는 한국어로 나옵니다.',

  // ── 모양 절. D182 가 장식을 없애면서 「장식 보이기·숨기기」 스위치가 빠졌다 —
  // 끌 수 있는 스위치가 있다는 것은 켤 값이 있다는 뜻인데 없다(정본 §6).
  'settings.look.title': '모양',
  'settings.look.plain': '= 화면 밝기와 움직임',
  'settings.look.process': '화면',
  'settings.look.themeSystem': '시스템 따름',
  'settings.look.themeLight': '밝게',
  'settings.look.themeDark': '어둡게',
  'settings.look.themeSwitch': '화면 밝기 — 시스템 따름 · 밝게 · 어둡게',
  // D187 ⑫ — 기본이 시스템 따름이고, 여기서 고른 것이 그것을 덮어쓴다. 헤더에는 스위치가 없다.
  'settings.look.themeNote':
    '기본은 「시스템 따름」입니다 — 이 컴퓨터가 밤에 어두워지면 앱도 같이 어두워집니다. '
    + '밝게·어둡게를 고르면 시스템과 상관없이 그대로 고정됩니다.',
  'settings.look.note':
    '여기서 고른 것은 저장되어 다음에 열 때도 그대로입니다. 밝기를 바꿔도 글자와 배치는 '
    + '1px 도 바뀌지 않습니다.',

  // ── 화면 머리와 절 제목 (05 §2.1 — 은유 옆에 평문) ───────────────────────
  'settings.title': '설정',
  'settings.plain': '= 이 앱이 나를 어떻게 다룰지',

  'settings.repo.title': '리포',
  'settings.repo.plain': '= 교재로 읽는 폴더',
  'settings.repo.empty': '등록된 리포가 없습니다.',
  'settings.repo.lastIngest': '마지막 인제스트 {{when}}',
  'settings.repo.never': '없음',
  'settings.repo.reingestNote':
    '문법·쿼리·생성기·사전이 바뀌면 홈에 「재인제스트 필요」 배너가 뜹니다. 다시 읽어도 '
    + '<b>숙련도는 개념 단위라 그대로 남고</b> 카드와 사용처만 새로 만듭니다.',

  'settings.study.title': '학습',
  'settings.study.plain': '= 하루에 얼마나, 언제부터',
  'settings.study.budget': '하루 예산',
  'settings.study.budgetNote': '분 (10~25)',
  'settings.study.rollover': '하루 경계',
  'settings.study.rolloverNote': '시 — 이 시각 전은 어제로 셉니다',
  'settings.study.newPerDay': '새 문제',
  'settings.study.newPerDayNote': '개/일 (상한 4)',
  // 첫 실행에서 한 번 물은 것을 여기서 되돌릴 수 있어야 한다 (D147). `home.newcomerBody`
  // 가 이 자리를 실명으로 가리키므로 없으면 문구가 거짓말이 된다.
  'settings.study.newcomer': '프로그래밍 경험',
  'settings.study.newcomerSwitch': '프로그래밍이 처음인지 고르기 — 처음입니다 · 해 봤습니다',
  'settings.study.newcomerYes': '처음입니다',
  'settings.study.newcomerNo': '해 봤습니다',
  'settings.study.newcomerNote':
    '「처음입니다」로 두면 <b>0장이 길어집니다</b> — 뿌리 문제 몇 개를 맞혀도 0장이 닫히지 '
    + '않고, 담긴 개념을 전부 한 단계 올릴 때까지 열려 있습니다. 잠기는 것은 없고, 언제 '
    + '바꿔도 됩니다.',
  'settings.study.coach': '첫 문제 안내',
  'settings.study.coachSwitch': '첫 문제 안내 켜기 · 끄기',
  'settings.study.coachOn': '켜기',
  'settings.study.coachOff': '끄기',
  'settings.study.coachNote':
    '켜면 다음 세션의 첫 문제에서 고르기 → 확인 → 채점 읽기를 한 걸음씩 다시 짚어 줍니다. 진짜 문제라 숙련도도 그대로 오릅니다.',
  'settings.study.tz': '시간대',
  'settings.study.tzNote': '여행 중에 어제 큐가 사라지지 않도록 여기 값이 기준입니다',

  'settings.key.title': 'LLM 키',
  'settings.key.plain': '= 자유 질문에 쓸 열쇠',
  'settings.perf.title': '성능',
  'settings.perf.plain': '= 이 컴퓨터에서 잰 시간',
  'settings.data.title': '데이터',
  'settings.data.plain': '= 내 기록을 꺼내거나 지우기',
  'settings.privacy.title': '프라이버시 노트',
  'settings.privacy.plain': '= 무엇이 어디에 남는가',
  'settings.about.title': '정보',
  'settings.about.plain': '= 버전',
  'settings.about.dataDir': '데이터 위치',

  // ── 데이터 절 ────────────────────────────────────────────────────────────
  'settings.data.legend': '내보낼 것',
  'settings.data.note':
    '스키마 번호·개념 숙련도·세션 요약·설정은 항상 담습니다. 아래 둘은 <b>내 코드와 내가 '
    + '쓴 글</b>이라 기본으로 빼 둡니다.',
  'settings.data.excerpts': '카드 발췌(내 코드 줄)도 담기',
  'settings.data.drafts': 'T1 필사 초안도 담기',
  'settings.data.export': '내 기록 내보내기',
  'settings.data.openData': '데이터 폴더 열기',
  'settings.data.openLogs': '로그 폴더 열기',
  'settings.data.whereNote':
    '저장 위치를 묻지 않습니다 — 앱 데이터 폴더의 <code>exports/</code> 에 만들고 그 폴더를 '
    + '엽니다. 거기서 원하는 곳으로 옮기면 됩니다.',
  'settings.data.wipe': '전부 지우기',
  'settings.data.wipeWarn':
    '<b>되돌릴 수 없습니다.</b> 학습 DB·백업·사전 캐시·로그·크래시 기록·설정과 키체인에 '
    + '넣은 API 키를 지웁니다. 리포 폴더의 파일은 건드리지 않습니다.',
  'settings.data.wipeGo': '정말 전부 지웁니다',
  'settings.data.wiping': '지우는 중…',
  'settings.data.wipeCancel': '그만두기',

  // ── 06 §3.6 의 0.1.0 문구. README·이 화면·06 이 같은 문장이어야 한다. ─────
  'settings.privacy.p1':
    '당신의 코드는 이 컴퓨터를 떠나지 않습니다. Chickadee는 리포를 읽기만 하고, 학습 기록은 '
    + '이 컴퓨터의 데이터베이스 한 파일에만 저장합니다.',
  'settings.privacy.p2':
    '이 버전은 인터넷을 아예 쓰지 않습니다 — 「자유 질문」의 프롬프트도 이 컴퓨터에서 만들어 '
    + '복사할 뿐, 앱이 스스로 보내지 않습니다.',
  'settings.privacy.p3':
    '사용 통계·오류 보고를 보내지 않고, 업데이트도 확인하지 않습니다. 「설정 → 전부 지우기」로 '
    + '모든 기록을 삭제할 수 있습니다.',

  // ── 알림 한 줄 (LiveRegion) ──────────────────────────────────────────────
  'settings.loadFailed': '설정을 다 읽지 못했습니다.',
  'settings.saveFailed': '저장하지 못했습니다.',
  'settings.exported': '{{dir}} 에 {{name}}{{name|josa:을,를}} 만들었습니다.',
  'settings.exportFailed': '내보내지 못했습니다.',
  'settings.wiped': '전부 지웠습니다. 앱을 닫아 주세요 — 다시 열면 첫 실행부터 시작합니다.',
  'settings.wipeFailed': '다 지우지 못했습니다. 앱을 닫고 다시 시도해 주세요.',
  'settings.localeFailed': '표시 언어를 저장하지 못했습니다.',

  // ── 성능 표 (06 §8) ──────────────────────────────────────────────────────
  'settings.perf.empty': '아직 잰 것이 없습니다. 리포를 읽거나 문제를 풀면 쌓입니다.',
  'settings.perf.caption': '최근 표본 {{n}}건 (밀리초)',
  'settings.perf.colItem': '항목',
  'settings.perf.colSamples': '표본',
  'settings.perf.colMax': '최대',
  'settings.perf.colBudget': '예산',
  'settings.perf.kindIngestTotal': '인제스트 총',
  'settings.perf.kindIngestFileP95': '파일당 파싱 p95',
  'settings.perf.kindQueue': '큐 생성',
  'settings.perf.kindT1Grade': 'T1 채점',
  'settings.perf.kindFrameP95': '홈 프레임 p95',
  'settings.perf.kindHomePaint': '홈 첫 그리기',
  'settings.perf.kindSessionMount': '세션 열기',
  'settings.perf.kindT0Grade': 'T0 채점',
  'settings.perf.kindT1Monaco': 'T1 편집기',
  'settings.perf.kindThemeSwitch': '밝기 전환',
  'settings.perf.kindLiferOpen': 'LIFER 열기',

  // ── LLM 키 (06 §3.5 · D106) ──────────────────────────────────────────────
  // 「보내기」는 없다 — 지금의 사실은 「전송하지 않는다」이고 프롬프트 복사는 키가 없어도 된다.
  'settings.key.apiKey': 'API 키',
  'settings.key.save': '저장',
  'settings.key.drop': '지우기',
  'settings.key.loading': '키체인을 확인하는 중입니다.',
  'settings.key.noSend':
    '지금 이 앱은 아무것도 스스로 전송하지 않습니다. 「자유 질문」에서 프롬프트를 만들고 '
    + '복사하는 것은 키가 없어도 그대로 됩니다.',
  'settings.key.none':
    '키를 넣어 두면 그 프롬프트를 앱에서 바로 보내는 문이 0.2 에서 열립니다. 지금은 저장만 '
    + '합니다.',
  'settings.key.noneNote':
    '키는 이 컴퓨터의 키체인에만 들어갑니다. 넣고 나면 화면에도 로그에도 다시 나오지 '
    + '않습니다.',
  'settings.key.stored': '이 컴퓨터의 키체인에 저장돼 있습니다.',
  'settings.key.storedSoon':
    '보내기는 0.2 에서 열립니다. 지금 할 수 있는 것은 프롬프트를 만들어 복사하는 '
    + '것까지입니다.',
  'settings.key.storedNote': '값은 다시 보여 드리지 않습니다 — 되읽는 문 자체가 없습니다.',
  'settings.key.unavailable':
    '이 컴퓨터에는 안전하게 저장할 수 없습니다(Secret Service 없음). 프롬프트 복사는 그대로 '
    + '됩니다.',
  'settings.key.unavailableNote':
    '평문 파일에는 두지 않습니다. gnome-keyring 이나 KWallet 을 설치한 뒤 이 화면을 다시 '
    + '열어 주세요.',
  'settings.key.saved': '키를 저장했습니다.',
  'settings.key.dropped': '키를 지웠습니다.',
  'settings.key.cannotStore': '이 컴퓨터에는 키를 넣지 못했습니다.',
  'settings.key.failed': '저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요.',

  // 시간 비례 진행바. 「칸」은 문제 수가 아니라 시간 단위다 — en 은 step 으로 간다.
  'queue.allDone': '{{n}}칸 모두 끝남',
  'queue.at': '{{n}}칸 중 {{i}}번째 「{{label}}」, 전체의 {{percent}}%',
  'queue.secs': '{{n}}초',
  'queue.mins': '{{n}}분',
} as const;
