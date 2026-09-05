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
  'ingest.cardsLabel': '판 짜기',
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

  // ── 잉크 겹 이름 (정본 §6 — 은유 옆에 평문) ──────────────────────────────
  // 겹마다 셋이다: 겹 수(`n`) · 은유(`k`) · 평문(`plain`).
  'home.layer0N': '0겹',
  'home.layer0K': '미인쇄',
  'home.layer0Plain': '실루엣만',
  'home.layer1N': '1겹',
  'home.layer1K': '애벌',
  'home.layer1Plain': '흐린 하프톤',
  'home.layer2N': '2겹',
  'home.layer2K': '먹판',
  'home.layer2Plain': '윤곽이 잡힘',
  'home.layer3N': '3겹',
  'home.layer3K': '+ 청판',
  'home.layer3Plain': '색이 들어옴',
  'home.layer4N': '4겹',
  'home.layer4K': '+ 진홍',
  'home.layer4Plain': '완성',

  // 색만으로 트랙을 읽히지 않는다 — 이름에 코드를 병기한다 (05 §9).
  'home.trackT0': 'T0 문법',
  'home.trackT1': 'T1 클론 코딩',
  'home.trackT2': 'T2 구조',
  'home.trackT3': 'T3',

  // 레일에 세로로 찍히는 「N도」 (목업 JS 의 `DO`).
  'home.run0': '미인쇄',
  'home.run1': '애벌 1도',
  'home.run2': '1도',
  'home.run3': '2도',
  'home.run4': '3도',

  // ── 겹·만기 라벨 (components/home/labels.ts) ─────────────────────────────
  'home.layerLabel': '{{n}} {{k}}',
  'home.layerN': '{{n}}겹',
  'home.layerText': '잉크 {{n}}겹 / 4 · {{k}} · {{plain}}',
  'home.layerTextShort': '잉크 {{n}}겹 / 4',
  'home.railLabel': '판 {{no}} · {{run}}',
  'home.passesLabel': '{{track}} · 잉크 {{n}}겹',

  // 02 §3.5 `labelFor(due)`. 표는 라벨 근사이고 결정은 FSRS 가 한다.
  'home.dueNone': '예정 없음',
  'home.dueToday': '오늘 안에',
  'home.dueTomorrow': '내일',
  'home.dueDays': '{{n}}일 뒤',
  'home.dueWeeks': '{{n}}주 뒤',

  // ── 홈 화면 (screens/home/HomeScreen.tsx) ────────────────────────────────
  'home.guide': '다음은 「{{name}}」입니다. {{layer}}.',

  'home.reingestTitle': '재인제스트 필요',
  'home.reingestPlain': '= 리포를 다시 읽어야 합니다',
  'home.reingestNote':
    '문법·쿼리·카드 생성기·문법 사전 중 하나가 바뀌었습니다. 리포를 다시 읽으면 카드와 '
    + '사용처를 새로 만듭니다 — <b>익힌 겹은 개념에 붙어 있어 그대로 남습니다</b>.',

  'home.boardTitle': '<em>{{repo}}</em> 대지',
  'home.boardPlain': '= 내 리포의 기능 지도',
  'home.boardNote':
    '유닛 하나가 내 리포의 실제 기능 하나입니다. 커밋과 파일에서 뽑은 개념 {{concepts}}개 중 '
    + '<b>{{printed}}개</b>를 찍었습니다.',

  'home.inkTitle': '잉크 겹',
  'home.inkPlain': '= 얼마나 익혔나',
  'home.inkTag': '4겹 = 완성',
  'home.inkNote':
    '개념을 익힐수록 새가 선명해집니다. 겹은 <b>맞힌 횟수</b>가 아니라 '
    + '<b>시간을 두고 다시 맞힌 횟수</b>로 쌓입니다. 「모르겠어요」를 누르면 한 겹 내려가고 '
    + '그만큼 빨리 다시 찍습니다.',

  'home.gapsTitle': '판이 없는 문법',
  'home.gapsPlain': '= 내 코드엔 있는데 아직 안 찍은 문법',
  'home.gapsNote':
    'AI가 써준 자리라도 판을 만들면 그날 인쇄 목록에 들어갑니다. 등장 횟수가 많은 것부터 '
    + '잡으면 한 번에 여러 파일이 읽힙니다.',

  'home.noSheets': '아직 대지가 없습니다. 리포를 읽으면 기능마다 대지가 한 장씩 깔립니다.',
  // 이미 읽은 리포에 「읽으면 깔립니다」라 하면 읽으라는 말이 된다 (D170 ⑥). 왜 없는지를 말한다 —
  // 대지 하나는 한 폴더에 파일 셋(`MIN_FILES_FOR_UNIT`)부터다.
  'home.noSheetsRead':
    '파일 {{n}}개를 읽었지만 대지는 없습니다 — 한 폴더에 파일이 세 개는 있어야 기능 한 장이 '
    + '됩니다. 판은 그래도 짜입니다. 왼쪽 「오늘의 인쇄」를 보세요.',
  'home.boardNoteNoSheets':
    '유닛 하나가 내 리포의 실제 기능 하나입니다. 이 리포에는 아직 대지가 없어 개념을 대지 '
    + '단위로 세지 않습니다.',

  // ── 마스트헤드 (components/home/Masthead.tsx) ────────────────────────────
  'home.brandLine': '내 코드가 교재인 인쇄소',
  'home.ticket': '작업 지시서',
  'home.tkRepo': '리포',
  'home.tkDate': '날짜',
  'home.tkStreak': '연속 인쇄',
  'home.tkDay': '일',
  'home.tkInk': '개념 잉크',
  'home.tkAvgLayer': '겹 평균',
  'home.settings': '설정',

  // ── 범례 (components/home/Legend.tsx) ────────────────────────────────────
  'home.legend': '잉크 범례',
  'home.legendT0': '문법',
  'home.legendT1': '클론 코딩',
  'home.legendT2': '구조',

  // ── 잉크 겹 척도 (components/home/InkScale.tsx) ──────────────────────────
  // 색면 대신 문장이 정보를 나른다 (05 §9).
  'home.inkScaleSaid': '잉크 겹 5단계. {{parts}}.',
  'home.inkScalePart': '{{n}} {{k}} {{count}}개',
  // 세는 말. 한국어는 수 뒤에 단위가 붙고 영어는 붙지 않아 `en` 이 빈 문자열이다 —
  // 빈 값은 폴백을 타지 않는다(`undefined` 만 폴백한다).
  'home.countUnit': '개',

  // ── 컬러 바 (components/home/ColorBar.tsx) ───────────────────────────────
  'home.barTitle': '지난 14일 · 잉크 농도',
  'home.barNote': '칸 하나가 하루. 색이 진할수록 오래 찍었습니다.',
  'home.barSaid': '지난 14일 잉크 농도. 찍은 날 {{printed}}일, 모두 {{total}}분.',
  'home.barToday': '오늘',
  'home.barDaysAgo': '{{n}}일 전',
  'home.barCell': '{{when}} · {{amount}}',
  'home.barRest': '쉼',
  'home.mins': '{{n}}분',

  // ── 다시 찍을 개념 (components/home/ConceptList.tsx) ─────────────────────
  'home.retake': '다시 찍을 개념',
  'home.retakeEmpty': '다시 찍을 개념이 아직 없습니다. 첫 판을 찍으면 여기에 쌓입니다.',

  // ── 미조판 예고 (components/home/Forecast.tsx) ───────────────────────────
  'home.forecastNext': '{{n}}대 ~',
  // 커밋이 필요한 것은 책임 배치 한 종뿐이다 — 영향 반경·흐름·방향은 import 관계로 짜여 세션에
  // 실제로 나온다. 「T2 를 짤 수 없다」는 그 판 옆에서 거짓말이었다 (D170 ⑤).
  'home.forecastCannot':
    '<b>책임 배치 판은 아직 짤 수 없습니다.</b> 정답지가 실제 커밋인데 지금 커밋은 '
    + '<b>{{n}}개</b>입니다. import 관계로 짜는 영향 반경·흐름·방향 판은 오늘의 인쇄에 섞입니다.',
  'home.forecastLater':
    '<b>아직 판이 짜이지 않았습니다.</b> 커밋이 쌓이면 소스를 다시 읽어 대지를 자동으로 '
    + '늘립니다. 지금 읽은 파일은 <b>{{n}}개</b>입니다.',
  'home.forecastMarkCannot': '불가',
  'home.forecastMarkLater': '미조판',

  // ── 판이 없는 문법 (components/home/GapsPanel.tsx) ───────────────────────
  'home.gapsEmpty': '판이 없는 문법이 없습니다. 내 코드의 문법은 모두 판으로 짜였습니다.',
  'home.gapsCount': '<b>{{n}}</b>번 등장',
  'home.gapsMake': '판 만들기',
  'home.gapsMakeFor': '{{label}} 판 만들기',

  // ── 아직 안 열린 것 (components/home/LockedPanel.tsx · D96) ──────────────
  'home.locked': '아직 안 열린 것',
  'home.lockedTitle': 'T1 필사',
  'home.lockedBody':
    '이 리포의 문법을 조금 익힌 뒤에 열립니다. 지금은 어느 블록을 봐도 처음 보는 문법이 '
    + '너무 많아, 필사가 타자 연습이 됩니다.',
  'home.lockedHow': '문법 판(T0)을 며칠 찍으면 그 블록부터 열립니다.',

  // ── 초보 안내 (components/home/Newcomer.tsx · 02 §6.4) ───────────────────
  // 감지 규칙을 숫자 없이 옮긴 문장이다 — 규칙의 상수가 바뀌어도 거짓이 되지 않는다.
  'home.newcomer': '먼저 읽을 것',
  'home.newcomerSuspect': '오늘 뿌리 개념 판이 막혔고, 그 아래로 내려갈 판이 없었습니다.',
  'home.newcomerConfirmed':
    '두 세션 내리 뿌리 개념 판이 막혔고, 그 아래로 내려갈 판이 없었습니다.',
  // D147 — 「대상이 아니다」에서 「0장이 데려간다」로. 밖으로 내보내지 않는다.
  'home.newcomerBody':
    '뿌리 개념이 아직 안 잡혔습니다. 홈의 「0장 — 이 언어의 바닥」을 먼저 찍어 보세요 — '
    + '조건문·함수·반복부터 내 코드의 가장 단순한 줄로 짚어 갑니다. 더 천천히 가고 싶으면 '
    + '설정 「학습」에서 「프로그래밍이 처음」으로 바꾸면 0장이 길어집니다. 잠기는 것은 없습니다.',

  // ── 0장 — 이 언어의 바닥 (D136 · 정본 §4 · 방안 E-2) ──────────────────────
  // 「과정」이 아니라 유한한 프롤로그다. 장수를 문구에 적는 것이 그 약속이다.
  'home.zeroChapter': '0장 — 이 언어의 바닥',
  'home.zeroChapterSig': '0장',
  'home.zeroChapterLead':
    '이 언어를 처음 보시는군요. 뿌리부터 {{n}}장만 먼저 찍습니다. 하루 두 장이니 나흘이면 '
    + '끝나고, 그 뒤로는 다른 대지와 같습니다.',
  'home.zeroChapterMeta': '판 {{n}}장 · 끝이 있는 프롤로그',
  'home.zeroChapterDone': '0장을 마쳤습니다. 언제든 다시 열 수 있습니다.',

  // ── 스티커 (components/home/Node.tsx) ────────────────────────────────────
  'home.nodeLabel': '{{name}}. {{track}}. {{layer}}. {{state}}.',
  'home.stateDone': '찍음',
  'home.stateCurrent': '지금 여기',
  'home.stateLocked': '아직 판이 걸리지 않음',
  'home.stateOpen': '다음 차례',

  // ── 스티커 상세 (components/home/NodeDetail.tsx) ─────────────────────────
  'home.detail': '{{name}} 상세',
  'home.detailTitleLocked': '{{name}} — 아직 판이 걸리지 않았습니다',
  'home.detailLockedBody':
    '이 스티커는 앞 판이 먼저입니다. 앞 판을 찍으면 바로 도려집니다. 순서는 개념의 선행 '
    + '관계에서 나옵니다.',
  'home.detailDone': '4겹이라 완성입니다. 시간이 지나면 한 겹 흐려지고 그때 다시 찍습니다.',
  'home.detailNext': '다음 인쇄는 {{due}}입니다. 맞히면 {{n}}겹이 됩니다.',
  'home.detailGo': '이 판 찍기',
  'home.detailClose': '닫기',

  // ── 대지 (components/home/Sheet.tsx) ─────────────────────────────────────
  // 대지 색인 띠 (D133). 칩 안의 이름은 잘릴 수 있어 읽히는 이름은 따로 든다.
  'home.sheetIndex': '대지 색인',
  'home.sheetChip': '{{no}}대 · {{name}} · {{all}}개 중 {{done}}개 찍음',
  'home.sheetStamp': '인쇄 완료',
  'home.sheetSig': '{{n}}대',
  'home.sheetFeature': '기능 {{n}}',
  'home.sheetNoPath': '경로 없음',
  'home.sheetMeta': '{{where}} · 파일 {{files}}개 · 개념 {{concepts}}개',
  'home.sheetStatusLocked': '{{n}}대를 먼저',
  'home.sheetStatusPrinting': '인쇄 중 {{done}} / {{all}}',

  // ── 오늘의 인쇄 (components/home/TodayPanel.tsx) ─────────────────────────
  'home.todayTitle': '오늘의 인쇄',
  'home.todayPlain': '= 오늘 할 판',
  'home.todayEmpty':
    '오늘은 인쇄할 판이 없습니다. 리포를 더 파거나 내일 다시 오세요 — 없는 것을 억지로 '
    + '채우지 않습니다.',
  'home.todayCount': '<b>{{plates}}</b>판 · 약 <b>{{mins}}</b>분',
  'home.todayList': '오늘 걸릴 판',
  'home.todayDays': '지난 {{n}}일 인쇄 기록',
  'home.todayStart': '인쇄 시작',
  // 미리보기의 자리 이름 (D170 ④). 개념 이름은 세션이 열려야 정해지므로 자리만 말한다.
  'home.previewNewT0': '새 문법 판',
  'home.previewT1': '필사 한 판',
  'home.previewT2': '구조 한 판',
  'home.todayResume': '이어 찍기 · {{n}}번째 판부터',

  // 코스 진입 (D120·D125). 코스는 일일 큐 밖이라 「인쇄 시작」 옆이 아니라 대지와
  // 마스트헤드에 따로 선다 — 예산을 쓰는 문이 아니라는 것이 자리로 보여야 한다.
  'home.sheetCourse': '이 대지 통째로 필사',
  'home.course': '코스',
} as const;
