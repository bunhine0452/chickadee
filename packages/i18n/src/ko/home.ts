/**
 * 홈 · 인제스트 — screens/{home,ingest} · components/home.
 *
 * 키 이름은 `화면.자리` 다. `ko` 가 키 집합의 정본이고 `en/home.ts` 가 따라온다 (D117).
 * **이 파일은 그 영역을 맡은 세션만 고친다** — 카탈로그를 영역별로 가른 이유가 그것이다.
 *
 * 값은 `@chickadee/text` 의 템플릿 문법을 쓴다(`{{name}}` · 필터 `|josa:은,는`). 조사
 * 필터는 `ko` 에서만 쓴다 — `en` 에서는 항등이라 아무것도 나오지 않는다. 서식이 붙는 값
 * (`<b>`·`<em>`)은 화면이 `RichText` 로 그린다 (06 §4.2).
 */
export const home = {
  // ── 인제스트 (screens/ingest) ────────────────────────────────────────────
  // 칸 이름 넷은 D47 의 4단계 매핑이다. 칸 순서는 잡이 내보내는 순서고(D110) 여기서
  // 바뀌지 않는다 — 바뀌는 것은 어느 말로 적히는지뿐이다.
  'ingest.walkLabel': '코드 읽기',
  'ingest.walkSub': '파일 목록과 문법',
  'ingest.gitLabel': '히스토리',
  'ingest.gitSub': '커밋과 캡처 저장',
  'ingest.deriveLabel': '개념 추출',
  'ingest.deriveSub': '내 코드의 사용처 찾기',
  'ingest.cardsLabel': '문제 만들기',
  'ingest.cardsSub': '카드로 만들 자리 고르기',

  'ingest.done': '다 읽었습니다',
  'ingest.reading': '{{repo}}{{repo|josa:을,를}} 읽는 중',
  'ingest.doneNote': '이제 홈에서 무엇이 있고 무엇이 없는지 볼 수 있습니다.',
  'ingest.readOnly': '리포에는 아무것도 쓰지 않습니다. 읽기만 합니다.',

  'ingest.skips': '건너뛴 파일 {{n}}개',
  'ingest.more': '그 밖 {{n}}개',
  // `relPath` 가 빈 문자열로 오는 경고 하나 — 파일이 아니라 상한에 걸린 것이다.
  'ingest.fileCap': '(파일 수 상한)',
  'ingest.skipped': '{{reason}} 건너뜀',
  // 사유 목록은 01 §3.1 `IngestWarning.reason` 그대로다.
  'ingest.reasonOversize': '너무 커서',
  'ingest.reasonParsePoor': '문법으로 읽히지 않아',
  'ingest.reasonTimeout': '너무 오래 걸려',
  'ingest.reasonBinary': '텍스트가 아니라',
  'ingest.reasonGenerated': '사람이 쓴 코드가 아니라',
  'ingest.reasonLongLine': '한 줄이 너무 길어',

  'ingest.cancel': '그만 읽기',
  'ingest.cancelling': '멈추는 중…',
  // 진행은 그림이 아니라 문장으로도 나가야 한다 (05 §9).
  'ingest.saidDone': '다 읽었습니다.',
  'ingest.saidStep': '{{label}} 단계입니다.',

  // ── 공통 ────────────────────────────────────────────────────────────────
  'home.back': '홈으로',

  // ── 숙련도 0~4 (정본 §6 · D178 — 평문이 정본이다) ────────────────────────
  // 단계마다 셋이다: 단계 수(`n`) · 짧은 이름(`k`) · 한 줄 뜻(`plain`).
  'home.layer0N': '0단계',
  'home.layer0K': '아직',
  'home.layer0Plain': '한 번도 못 맞혔음',
  'home.layer1N': '1단계',
  'home.layer1K': '처음',
  'home.layer1Plain': '한 번 맞혔음',
  'home.layer2N': '2단계',
  'home.layer2K': '익히는 중',
  'home.layer2Plain': '날을 두고 다시 맞혔음',
  'home.layer3N': '3단계',
  'home.layer3K': '자리 잡음',
  'home.layer3Plain': '오래 두고도 맞힘',
  'home.layer4N': '4단계',
  'home.layer4K': '다 익힘',
  'home.layer4Plain': '완성',

  // 색만으로 트랙을 읽히지 않는다 — 이름에 코드를 병기한다 (05 §9).
  'home.trackT0': 'T0 문법',
  'home.trackT1': 'T1 클론 코딩',
  'home.trackT2': 'T2 구조',
  'home.trackT3': 'T3',

  // 단원 레일에 세로로 서는 짧은 이름. `home.layer*K` 와 같은 다섯 단계다.

  // ── 숙련도·만기 라벨 (components/home/labels.ts) ─────────────────────────
  'home.layerLabel': '{{n}} · {{k}}',
  'home.layerN': '{{n}}단계',
  'home.layerText': '숙련도 {{n}} / 4 · {{k}} · {{plain}}',
  'home.layerTextShort': '숙련도 {{n}} / 4',

  // 02 §3.5 `labelFor(due)`. 표는 라벨 근사이고 결정은 FSRS 가 한다.
  'home.dueNone': '예정 없음',
  'home.dueToday': '오늘 안에',
  'home.dueTomorrow': '내일',
  'home.dueDays': '{{n}}일 뒤',
  'home.dueWeeks': '{{n}}주 뒤',

  // ── 홈 화면 (screens/home/HomeScreen.tsx) ────────────────────────────────

  'home.reingestTitle': '재인제스트 필요',
  'home.reingestNote':
    '문법·쿼리·카드 생성기·문법 사전 중 하나가 바뀌었습니다. 리포를 다시 읽으면 카드와 '
    + '사용처를 새로 만듭니다 — <b>익힌 숙련도는 개념에 붙어 있어 그대로 남습니다</b>.',



  'home.gapsTitle': '아직 안 배운 문법',
  'home.gapsPlain': '= 내 코드엔 있는데 아직 문제로 안 나온 문법',
  'home.gapsNote':
    'AI가 써준 자리라도 문제를 만들면 그날 목록에 들어갑니다. 등장 횟수가 많은 것부터 '
    + '잡으면 한 번에 여러 파일이 읽힙니다.',

  'home.noSheets': '아직 단원이 없습니다. 리포를 읽으면 기능마다 단원이 하나씩 생깁니다.',
  // 이미 읽은 리포에 「읽으면 생깁니다」라 하면 읽으라는 말이 된다 (D170 ⑥). 왜 없는지를 말한다 —
  // 단원 하나는 한 폴더에 파일 셋(`MIN_FILES_FOR_UNIT`)부터다.
  'home.noSheetsRead':
    '파일 {{n}}개를 읽었지만 단원은 없습니다 — 한 폴더에 파일이 세 개는 있어야 기능 하나가 '
    + '됩니다. 문제는 그래도 만들어집니다. 위의 「오늘 할 것」을 보세요.',

  // ── 마스트헤드 (components/home/Masthead.tsx) ────────────────────────────
  'home.tkRepo': '리포',
  'home.settings': '설정',
  'home.repos': '서가',
  'home.nav': '주요 이동',

  // ── 숙련도 척도 (components/home/InkScale.tsx) ───────────────────────────
  // 색면 대신 문장이 정보를 나른다 (05 §9).
  // 세는 말. 한국어는 수 뒤에 단위가 붙고 영어는 붙지 않아 `en` 이 빈 문자열이다 —
  // 빈 값은 폴백을 타지 않는다(`undefined` 만 폴백한다).

  // ── 컬러 바 (components/home/ColorBar.tsx) ───────────────────────────────

  // ── 다시 풀 개념 (components/home/ConceptList.tsx) ───────────────────────

  // ── 아직 못 만든 문제 예고 (components/home/Forecast.tsx) ─────────────────
  // 커밋이 필요한 것은 책임 배치 한 종뿐이다 — 영향 반경·흐름·방향은 import 관계로 만들어져
  // 세션에 실제로 나온다. 「T2 를 낼 수 없다」는 그 문제 옆에서 거짓말이었다 (D170 ⑤).

  // ── 아직 안 배운 문법 (components/home/GapsPanel.tsx) ─────────────────────
  // ── 아직 못 하는 것 · 책임 배치 (D170 ⑤) ─────────────────────────────────
  // 커밋이 필요한 것은 책임 배치 한 종뿐이다 — 영향 반경·흐름·방향은 import 관계로
  // 만들어져 오늘 할 것에 실제로 섞인다.
  'home.forecastTitle': '책임 배치 문제',
  'home.forecastCannot':
    '정답지가 실제 커밋인데 이 리포의 커밋은 <b>{{n}}개</b>입니다. import 관계로 만드는 '
    + '영향 반경·흐름·방향 문제는 오늘 할 것에 섞입니다.',

  'home.gapsEmpty': '아직 안 배운 문법이 없습니다. 내 코드의 문법은 모두 문제로 나왔습니다.',
  'home.gapsCount': '<b>{{n}}</b>번 등장',
  'home.gapsMake': '문제 만들기',
  'home.gapsMakeFor': '{{label}} 문제 만들기',

  // ── 아직 안 열린 것 (components/home/LockedPanel.tsx · D96) ──────────────
  'home.lockedTitle': 'T1 필사',
  'home.lockedBody':
    '이 리포의 문법을 조금 익힌 뒤에 열립니다. 지금은 어느 블록을 봐도 처음 보는 문법이 '
    + '너무 많아, 필사가 타자 연습이 됩니다.',
  'home.lockedHow': '문법 문제(T0)를 며칠 풀면 그 블록부터 열립니다.',

  // ── 초보 안내 (components/home/Newcomer.tsx · 02 §6.4) ───────────────────
  // 감지 규칙을 숫자 없이 옮긴 문장이다 — 규칙의 상수가 바뀌어도 거짓이 되지 않는다.
  'home.newcomer': '먼저 읽을 것',
  'home.newcomerSuspect': '오늘 뿌리 개념 문제가 막혔고, 그 아래로 내려갈 문제가 없었습니다.',
  'home.newcomerConfirmed':
    '두 세션 내리 뿌리 개념 문제가 막혔고, 그 아래로 내려갈 문제가 없었습니다.',
  // D147 — 「대상이 아니다」에서 「0장이 데려간다」로. 밖으로 내보내지 않는다.
  'home.newcomerBody':
    '뿌리 개념이 아직 안 잡혔습니다. 홈의 「0장 — 이 언어의 바닥」을 먼저 풀어 보세요 — '
    + '조건문·함수·반복부터 내 코드의 가장 단순한 줄로 짚어 갑니다. 더 천천히 가고 싶으면 '
    + '설정 「학습」에서 「프로그래밍이 처음」으로 바꾸면 0장이 길어집니다. 잠기는 것은 없습니다.',

  // ── 0장 — 이 언어의 바닥 (D136 · 정본 §4 · 방안 E-2) ──────────────────────
  // 「과정」이 아니라 유한한 프롤로그다. 장수를 문구에 적는 것이 그 약속이다.
  'home.zeroChapter': '0장 — 이 언어의 바닥',
  'home.zeroChapterSig': '0장',
  'home.zeroChapterLead':
    '이 언어를 처음 보시는군요. 뿌리부터 {{n}}장만 먼저 배웁니다. 하루 두 장이니 나흘이면 '
    + '끝나고, 그 뒤로는 다른 단원과 같습니다.',
  'home.zeroChapterMeta': '문제 {{n}}개 · 끝이 있는 도입부',
  'home.zeroChapterDone': '0장을 마쳤습니다. 언제든 다시 열 수 있습니다.',

  // ── 개념 (components/home/Node.tsx) ──────────────────────────────────────
  'home.stateDone': '익힘',
  'home.stateCurrent': '지금 여기',
  'home.stateLocked': '아직 문제가 없음',
  'home.stateOpen': '다음 차례',

  // ── 개념 상세 (components/home/NodeDetail.tsx) ───────────────────────────
  'home.detailGo': '이 문제 풀기',

  // ── 단원 (components/home/Sheet.tsx) ─────────────────────────────────────
  // 단원 색인 띠 (D133). 칩 안의 이름은 잘릴 수 있어 읽히는 이름은 따로 든다.
  'home.unitsTitle': '단원',
  'home.unitsSummary': '개념 {{concepts}}개 중 {{learned}}개를 배웠습니다',
  'home.sheetSig': '{{n}}단원',
  'home.sheetNoPath': '경로 없음',
  'home.sheetMeta': '{{where}} · 파일 {{files}}개 · 개념 {{concepts}}개',

  // ── 오늘 할 것 (components/home/TodayPanel.tsx) ──────────────────────────
  'home.todayTitle': '오늘 할 것',
  // 「없다」로 끝내지 않고 **어디에 더 있는지**를 이름으로 가리킨다 (D186 ①). 억지로
  // 채우지는 않는다 — 문을 두 개 적어 두고 고르는 것은 사용자다.
  'home.todayEmpty':
    '오늘 몫은 다 풀었습니다. 더 하고 싶으면 아래 「아직 안 배운 문법」에서 문제를 만들거나, '
    + '맨 위 「코스」에서 다음 단을 밟으세요. 없는 것을 억지로 채우지는 않습니다 — 내일 '
    + '다시 와도 됩니다.',
  'home.todayCount': '<b>{{plates}}</b>문제 · 약 <b>{{mins}}</b>분',
  'home.todayList': '오늘 나올 문제',
  'home.todayStart': '학습 시작',
  'home.todayStreak': '연속 {{n}}일',
  // 미리보기의 자리 이름 (D170 ④). 개념 이름은 세션이 열려야 정해지므로 자리만 말한다.
  'home.previewNewT0': '새 문법 문제',
  'home.previewT1': '필사 한 문제',
  'home.previewT2': '구조 한 문제',
  'home.todayResume': '이어 풀기 · {{n}}번째 문제부터',

  // 코스 진입 (D120·D125). 코스는 일일 큐 밖이라 「학습 시작」 옆이 아니라 단원과
  // 마스트헤드에 따로 선다 — 예산을 쓰는 문이 아니라는 것이 자리로 보여야 한다.
  'home.sheetCourse': '이 단원 통째로 필사',
  'home.course': '코스',

  // 홈에서 손으로 문제를 걸 때의 결과 안내 (D178 — 이 여섯은 `App.tsx` 에 한국어로
  // 박혀 있었다. 카탈로그 밖이라 영어 화면에서도 한국어가 나왔다).
  'home.startEmpty': '오늘 풀 문제가 없습니다. 리포를 더 읽거나 내일 다시 오세요.',
  'home.makeNoPlate': '「{{label}}」 문제는 아직 만들 수 없습니다. 사유는 「아직 안 배운 문법」에 적힙니다.',
  'home.makeFailed': '「{{label}}」 문제를 걸지 못했습니다.',
  'home.makeNoQueue': '「{{label}}」 문제를 만들었습니다. 오늘 할 것이 없어 목록에는 넣지 못했습니다.',
  'home.makeReused': '「{{label}}」 문제는 이미 오늘 {{n}}번째에 있습니다.',
  'home.makeQueued': '「{{label}}」 문제를 오늘 {{n}}번째에 넣었습니다.',
} as const;
