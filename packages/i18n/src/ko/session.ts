/**
 * 세션 · 문제 화면 — components/{plate,session,t1,t2} · screens/session.
 *
 * 키 이름은 `화면.자리` 다. `ko` 가 키 집합의 정본이고 `en/session.ts` 가 따라온다 (D117).
 * **이 파일은 그 영역을 맡은 세션만 고친다** — 카탈로그를 영역별로 가른 이유가 그것이다.
 *
 * 앞머리가 자리를 가른다 — `session` 세 트랙이 함께 쓰는 것 · `plate` 문제 화면 부속 ·
 * `clone` T1 · `map` T2 · 나머지는 사다리 네 단(`dict`·`prereq`·`uses`·`ask`)과
 * 진행 띠(`band`) · 사다리 껍데기(`ladder`) · 첫 기록(`lifer`) · 학습 완료(`summary`).
 * `t0`·`t1`·`t2` 를 안 쓰는 이유는 `cards.ts` 가 이미 그 앞머리를 쓰기 때문이다.
 */
export const session = {
  // ───────── 세 트랙이 함께 쓰는 것 ─────────
  'session.plateNo': '{{n}}번',
  // T1 줄 판정 셋. 「정합·동등·어긋남」이었다 (D178 — 평문이 정본이다).
  'session.exact': '같음',
  'session.equiv': '같은 뜻',
  'session.differ': '다름',
  'session.missing': '누락',
  'session.extra': '추가',
  'session.swap': '이름 맞바꿈',
  'session.right': '맞았습니다',
  'session.wrong': '틀렸습니다',
  'session.printDone': '오늘 학습 완료',

  'session.roleReview': '복습',
  'session.roleNew': '새 문제',
  'session.roleRetry': '다시 풀기',
  'session.rolePrereq': '아래층',
  'session.roleManual': '이 문제 풀기',
  'session.roleGap': '문제 만들기',

  'session.kindPoint': '지목형',
  'session.kindBlank': '빈칸형',
  'session.kindMeaning': '의미형',
  'session.kindAndRole': '{{kind}} · {{role}}',
  'session.stageAndRole': '{{stage}}단계 · {{role}}',
  'session.conceptTranscribe': '{{name}} 필사',
  'session.sourceT0': '내 코드 <b>{{file}}:{{focus}}</b>',
  'session.sourceT1': '내 코드 <b>{{file}}</b> · <b>{{fn}}</b> · {{lines}}줄',

  'session.next': '다음',
  'session.confirm': '확인',
  'session.grade': '채점하기',
  'session.leave': '나가기',
  'session.dunnoReprint': '모르겠어요 · 다시 풀기',
  'session.dunnoPeek': '모르겠어요 · 원본 잠깐 보기',
  'session.hintNextPlate': '<b>Space</b> 로 다음 문제',
  'session.hintConfirm': '<b>Enter</b> 로 확인',
  'session.copyFailed': '클립보드에 복사하지 못했습니다.',

  // 낭독 한 줄 (05 §7). 평문 한 마디면 된다 — 병기할 은유가 없다 (D178).
  'session.liveRight': '맞았습니다',
  'session.liveWrong': '틀렸습니다',
  'session.liveNext': 'Space 로 다음',

  'session.liferWhereT0': '당신의 <b>{{file}}:{{focus}}</b> 에서 채집 · T0 문법',

  // ───────── 문제 화면 부속 (components/plate) ─────────
  'plate.choices': '보기',
  'plate.pickTargets': '짚을 곳',
  'plate.hole': '빈칸',
  'plate.foldMore': '… {{n}}줄 더',
  'plate.foldLess': '접기',
  'plate.rule': '규칙',
  'plate.afterLine': '이 줄이 끝난 뒤',
  // 학습자에게는 무엇이 적힐지만 말한다 — 「미리 비워 둔 자리라 위쪽 글이 밀리지 않는다」는
  // 구현 규칙(정본 §3-3)이지 학습자가 읽을 문장이 아니다 (D170 ⑧).
  'plate.idleNote':
    '채점 결과 — 답을 고르고 Enter 를 누르면 맞았는지, 왜 그런지, 숙련도가 몇 단계 오르는지가 여기 적힙니다.',
  'plate.linkPara': '이어보기',
  'plate.linkNew': '새로 열림',
  'plate.linkHeading': '↩ 방금 배운 것과 이어보기',
  'plate.crumbBack': '↩ 지금 위로 돌아가기',
  'plate.crumbPrereqNote': '1문제만 보고 같이 올라갑니다.',
  'plate.crumbReprintNote': '지난번에 틀린 문제입니다. 진단은 그대로 두고 <b>다시 고릅니다</b>.',
  'plate.layerN': '{{n}}단계',
  'plate.layerPlus': '+{{n}}단계',
  'plate.layerMinus': '−{{n}}단계',
  'plate.railVertical': '{{no}} · {{n}}단계 · {{name}}',
  'plate.inkLabel': '{{track}} · 숙련도 {{n}}단계',

  // ───────── 진행 띠 ─────────
  'band.label': '진행 띠',
  'band.title': '오늘 학습',
  'band.runNo': '{{n}}번째 학습',
  'band.now': '지금',
  'band.seconds': '{{n}}초',
  'band.minutes': '{{n}}분',
  'band.today': '오늘 {{time}}',
  'band.left': '남은 시간 약 {{n}}분 · 이 문제 {{time}}',

  // ───────── 다시 풀기 사다리 ─────────
  'ladder.label': '다시 풀기 사다리',
  'ladder.heading': '모르겠어요 = 다시 풀기',
  'ladder.note':
    '모르는 문제를 다시 푸는 건 실패가 아니라 <b>과정</b>입니다. 부끄러운 일이 아니라 그 자리로 다시 데려다 달라는 신호예요.',
  'ladder.ink': '숙련도',
  'ladder.today': '오늘 안에',
  'ladder.tabs': '다시 풀기 4단',
  'ladder.rungNo': '{{n}}단',
  'ladder.rung1': '더 자세히',
  'ladder.rung1Sub': '사전 3층 — 한 줄로 · 왜 필요한가 · 이 줄 안에서',
  'ladder.rung2': '여전히 모르겠어요',
  'ladder.rung2Sub': '아래층이 비어 있는지 진단하고, 비었으면 그 문제로 내려갑니다',
  'ladder.rung3': '다른 예시로',
  'ladder.rung3Sub': '내 리포에서 같은 문법이 쓰인 다른 자리',
  'ladder.rung4': '자유 질문',
  'ladder.rung4Sub': '키가 있으면 대화, 없으면 복사해서 물어보기',

  // ───────── 사다리 ①단 · 사전 3층 ─────────
  'dict.heading': '사전 3층 — 한 줄로 시작해 이 줄 안까지',
  'dict.note': '1~3단은 인터넷도 API 키도 없이 동작합니다. 4단만 선택 사항입니다.',

  // ───────── 사다리 ②단 · 아래층 진단 ─────────
  'prereq.heading': '아래층 진단 — 무엇이 비어 있나',
  'prereq.allPrinted':
    '이 개념의 아래층은 모두 익혔습니다. 이건 「이해 못 한」 것이 아니라 아직 익숙하지 않은 것입니다. 설명을 더 읽기보다 3단으로 내려가 같은 문법이 쓰인 내 코드를 여러 개 보는 편이 빠릅니다.',
  'prereq.someEmpty':
    '「모르겠어요」의 대부분은 이 개념이 어려워서가 아니라 아래층이 비어 있어서입니다. 이 개념을 떠받치는 {{n}}개 중 {{gaps}}개를 아직 안 익혔습니다.',
  'prereq.justFilled':
    '비어 있던 층을 방금 채웠습니다. 아래층이 다 찼으니 위 「이어보기」 문단을 한 번 더 읽고 다시 짚어 보세요.',
  'prereq.justSeen': '방금 봄 · {{n}}단계',
  'prereq.beenThere': '✓ 방금 보고 왔습니다',
  'prereq.goDown': '↳ 이 문제로 내려가기 · 1문제 · 약 40초',
  'prereq.noPlate': '문제 없음 · 홈에서 「문제 만들기」',
  // 합성 예제 (D137 · 방안 E-4). 사용처는 있는데 아직 못 여는 개념에 사전의 가장 단순한
  // 모양을 먼저 보여 주고, **반드시** 내 코드의 어디에서 이걸 보게 되는지를 함께 적는다.
  'prereq.goSimplest': '↳ 가장 단순한 모양으로 먼저 보기 · 1문제 · 약 40초',
  'prereq.previewNote':
    '{{name}}{{name|josa:은,는}} 내 코드에 있지만 지금 열면 모르는 문법이 여럿입니다. 가장 단순한 모양으로 먼저 보고, 그 자리는 오늘 안에 다시 만납니다.',
  // 곁말 넷 (04 §2.4). 전에는 화면 코드에 한국어로 박혀 있었다 — D117 위반이었다.
  'prereq.noteLayers': '{{n}}단계',
  'prereq.noteUnprinted': '아직 안 익힘',
  'prereq.noteAgain': '{{n}}단계 — 한 번 더',
  'prereq.notePreview': '문제가 없습니다',
  'prereq.noteNoSite': '내 코드엔 아직 없습니다',
  'prereq.printed': '익혔음',
  'prereq.note':
    '내려가도 지금 문제는 사라지지 않습니다. 아래층을 마치면 <b>이 자리로 자동으로 돌아오고</b>, 돌아오면 이어보기 문단이 새로 열립니다.',

  // ───────── 사다리 ③단 · 다른 자리 ─────────
  'uses.heading': '내 리포의 같은 문법 — 다른 자리',
  'uses.note': '같은 규칙이 다른 모양으로 쓰인 곳입니다. 설명을 더 읽기보다 이쪽이 빠를 때가 많아요.',
  'uses.none': '이 문법이 쓰인 다른 자리는 아직 찾지 못했습니다.',
  'uses.line': '{{n}}행',

  // ───────── 사다리 ④단 · 자유 질문 ─────────
  'ask.heading': '직접 물어보기',
  'ask.note':
    '키가 없어도 됩니다. 아래 칸에 막힌 지점을 적으면 <b>이 줄과 앞뒤 4줄만</b> 담은 프롬프트를 만들어 드립니다. 이 앱은 아무것도 스스로 전송하지 않습니다 — 복사해서 붙여넣는 순간에만 밖으로 나갑니다.',
  'ask.field': '막힌 지점',
  'ask.placeholder': '예: ?. 가 undefined 를 내면 그 다음 줄은 어떻게 되는지 모르겠어요',
  'ask.build': '프롬프트 만들기',
  'ask.copy': '복사',
  'ask.noKey': 'API 키 없음 · 로컬 사전과 내 코드만 사용',

  // ───────── 첫 문제 안내 (D134) ─────────
  'coach.label': '첫 문제 안내',
  'coach.step': '{{n}} / 3',
  'coach.pick':
    '<b>보기 넷 중 하나</b>를 고르세요 — 숫자 키 <b>1~4</b> 도 됩니다. 위에 있는 코드는 '
    + '설명용 예제가 아니라 <b>당신 리포에서 그대로 떠 온 줄</b>이에요.',
  'coach.confirm':
    '<b>Enter</b> 로 확인합니다. 틀려도 잃는 것은 없어요 — 다시 풀 문제가 오늘 목록에 하나 '
    + '들어갈 뿐입니다. 모르겠으면 왼쪽 아래 <b>모르겠어요 · 다시 풀기</b> 로 내려가도 됩니다.',
  'coach.read':
    '아래가 <b>채점 결과</b>입니다. 맞았는지, 왜 그런지, 숙련도가 몇 단계 올랐는지가 여기 '
    + '적혀요. 다 읽었으면 <b>Space</b> 로 다음 문제 — 남은 문제는 맨 위 진행 띠가 셉니다.',

  // ───────── 첫 기록 ─────────
  'lifer.label': '처음 기록한 개념',
  'lifer.kicker': '첫 기록 · LIFER',
  'lifer.stamp': '첫 관찰',

  // ───────── 학습 완료 ─────────
  'summary.railVertical': '{{runNo}} · 완료',
  'summary.line': '{{printed}}문제를 풀었고 {{mins}}분 걸렸습니다. 이 정도가 딱 좋습니다.',
  'summary.tallyPrinted': '푼 문제',
  'summary.tallyTime': '걸린 시간',
  'summary.tallyStreak': '연속 학습',
  'summary.unitPlate': '문제',
  'summary.unitMinute': '분',
  'summary.unitDay': '일',
  'summary.inkMoved': '오늘 오른 숙련도',
  'summary.inkNote': '%가 아니라 단계로 셉니다. 숙련도는 시간을 두고 다시 맞힐 때만 쌓입니다.',
  'summary.layerMinusReprint': '−{{n}}단계 · 다시 풀기',
  'summary.layerSame': '제자리',
  'summary.nextPrint': '다음 복습',
  'summary.liferHeading': '처음 기록한 문법 —',
  'summary.liferWhere': '#{{serial}} · 당신의 <b>{{file}}:{{line}}</b> 에서 채집',
  'summary.streakNote':
    '연속 <b>{{n}}일</b>. 연속 기록은 진도를 열지 않습니다 — 진도는 숙련도로만 열립니다. 하루 쉬어도 다음 날 이어집니다.',
  'summary.tomorrow': '내일은 <b>{{n}}</b> 개념이 다시 올라옵니다.',
  'summary.again': '오늘 문제 다시 보기',
  'summary.hint': '수고했습니다. 내일 같은 시간에 이어서.',
  'summary.home': '홈으로',

  // ───────── T1 필사 ─────────
  'clone.padLabel': '필사 입력',
  'clone.lines': '{{n}}줄',
  'clone.autoSave': '자동 저장',
  'clone.savedAt': '저장됨 {{time}}',
  'clone.indent': '들여쓰기',
  'clone.peekHold': '누르고 있기 = 원본 잠깐 보기',
  'clone.grade': '채점',
  'clone.peekCount': '원본 본 횟수',
  'clone.handPct': '손으로 앉힌 글자',
  'clone.editHint': '힌트는 감점이 아니라 이 문제를 더 자주 보여줄 신호로만 쓰입니다.',
  'clone.tooShort': '아직 너무 짧습니다 ({{n}}줄). 한 번 더 누르면 그대로 채점합니다.',
  'clone.downgraded': '한 단계 쉽게 — 기록만 남고 감점은 없습니다.',

  // 설정 「편집 보조」 (D143). 설정 화면의 문구지만 이 판의 어휘라 여기 둔다.
  'clone.assistLabel': '편집 보조',
  'clone.assistSwitch': '편집 보조',
  'clone.assistStage': '단계에 맞춰',
  'clone.assistOff': '전부 끄기',
  'clone.assistNote':
    '기본은 <b>단계에 맞춰</b>입니다. 괄호와 따옴표 자동 닫기는 1·2단계에만 켜고 백지에서는 끕니다. 이미 이 문제에 친 낱말을 다시 내주는 제안 목록은 모든 단계에 켭니다.',
  'clone.assistCost':
    '끄면 타건 수가 늘 뿐 점수 계산은 한 자도 달라지지 않습니다. 다만 <b>같은 85%가 서로 다른 조건에서 나온 값</b>이 되므로, 판정 이의는 보조 상태별로 따로 모입니다.',

  'clone.stage1Name': '보고 치기',
  'clone.stage1Sub': '원본을 보면서 그대로',
  'clone.stage2Name': '뼈대만',
  'clone.skeletonOnly': '주석과 시그니처만',
  'clone.stage3Name': '백지',
  'clone.stage3Sub': '한 줄 스펙만',
  'clone.refStage1': '원본 — 보면서 그대로 치세요',
  'clone.refMeta': '{{lang}} · {{lines}}',
  'clone.refHidden': '본문은 가려져 있습니다',

  'clone.ask1': '원본을 보면서 그대로 옮겨 쓰세요.',
  'clone.ask2': '주석과 시그니처만 보고, 내가 썼던 코드를 다시 써 보세요.',
  'clone.ask3': '스펙만 보고 처음부터 써 보세요.',
  'clone.askHint':
    '손으로 쓰는 것 자체가 목적입니다. 100 % 일치하지 않아도 됩니다. '
    + '줄을 벗어날 때만 판정하고, 타이핑 중에는 아무 일도 일어나지 않습니다.',

  'clone.scoreOf': '{{total}}분의 {{meaning}}',
  'clone.scoreCaption': '의미가 맞은 줄',
  'clone.scoreNote':
    '이 중 글자까지 같은 줄은 <b>{{exact}}줄</b>. <b>같은 뜻</b>은 형태만 다르고 뜻이 같아 인정한 줄 — 공백·들여쓰기, 따옴표 종류, 세미콜론, 주석 문구, 지역 변수명 일관 치환.',
  'clone.verdictAdvance': '다음 단계로 가도 좋습니다',
  'clone.verdictRepeatSoft': '한 번 더 같은 단계를 권합니다',
  'clone.verdictRepeat': '같은 단계를 한 번 더 하는 편이 빠릅니다',

  'clone.filterLabel': '보기',
  'clone.filterNotExact': '다름 + 같은 뜻만',
  'clone.filterAll': '전체',
  'clone.filterDiffer': '다름만',
  'clone.appealNote':
    '판정이 억울하면 각 줄의 <b>「같은 뜻인데요」</b>로 이의를 남길 수 있습니다. 점수는 그대로 두고 규칙 쪽을 고칩니다.',
  'clone.rowsLabel': '줄별 결과',
  'clone.rowsEmpty': '이 조건에 맞는 줄이 없습니다.',
  'clone.rowNotWritten': '이 줄을 안 썼습니다',
  'clone.rowNotInOriginal': '원본에 없는 줄입니다',
  'clone.appealIdle': '같은 뜻인데요',
  'clone.appealDone': '이의 접수됨 · 판정 보류',
  'clone.appealHeld': '이의 <b>{{n}}건</b>은 판정 보류로 기록합니다.',
  'clone.peekHint': '원본 본 횟수 <b>{{n}}</b> · 감점 없음',
  'clone.backToEditor': '에디터로 돌아가기',
  'clone.backToResult': '채점 결과로',
  'clone.nextWhy': '다음 — 왜 이렇게 생겼는지 한 줄',
  'clone.saveAndFinish': '저장하고 마치기',
  'clone.whyHint': '고르고 나서도 <b>자기 말로 한 줄</b> 옮겨야 마칩니다. 옮겨 적는 그 순간이 목적입니다.',
  'clone.whyField': '왜 이렇게 생겼는지 한 줄',
  'clone.whyReveal': '모르겠어요 · 보기 보기',
  'clone.whyPlaceholder': '예: 브라우저가 폼을 보내면서 페이지를 새로 고치는 걸 막으려고',
  'clone.whyAfterPick': '<b>이제 같은 내용을 위 칸에 자기 말로 한 줄만 옮겨 주세요.</b> 답을 보고 써도 됩니다.',

  // 04 §4.2 사유 코드 → 사람이 읽는 한 줄.
  'clone.reasonCommentText': '주석 문구는 비교하지 않습니다',
  'clone.reasonCommentMissing': '원본의 주석이 없습니다',
  'clone.reasonCommentExtra': '원본에 없는 주석입니다',
  'clone.reasonTrailingComment': '줄 끝 주석',
  'clone.reasonBlankMismatch': '한쪽이 빈 줄입니다',
  'clone.reasonIndent': '들여쓰기 폭',
  'clone.reasonTerminator': '세미콜론 · 후행 쉼표',
  'clone.reasonQuote': '따옴표 종류',
  'clone.reasonWhitespace': '공백',
  'clone.reasonTokenCount': '토큰 수가 다릅니다',
  'clone.reasonTokenMismatch': '토큰 불일치',
  'clone.reasonRename': '지역 변수명 일관 치환',
  'clone.reasonSwap': '바꾼 이름이 원본에 이미 있습니다 — 뜻이 달라집니다',
  'clone.reasonRenameInconsistent': '변수명 치환이 블록 전체에서 일관되지 않습니다',
  'clone.reasonAstEquiv': '구문 나무가 같습니다',
  'clone.reasonTemplateVsConcat': '템플릿 리터럴과 문자열 연결은 다릅니다',
  'clone.reasonParseError': '이 줄은 문법이 깨져 구문 비교를 못 했습니다',
  'clone.reasonParseLangUnsupported': '이 언어는 글자 비교만 합니다',
  'clone.reasonParseTimeout': '구문 비교가 시간을 넘겨 글자 비교만 했습니다',
  'clone.reasonDetail': '{{base}} ({{detail}})',
  'clone.astParen': '괄호',
  'clone.astBlock': '중괄호',
  'clone.astArrowParens': '화살표 매개변수 괄호',
  'clone.astLineBreak': '줄 나눔',

  'clone.whyEquiv': '형태만 다릅니다. <b>틀린 게 아닙니다.</b>',
  'clone.whyEquivReasons': '형태만 다릅니다. <b>틀린 게 아닙니다.</b> 사유: {{reasons}}',
  'clone.whyMissing': '이 줄이 빠졌습니다. 원본이 왜 이 줄을 필요로 했는지 확인해 보세요.',
  'clone.whyExtra':
    '원본에 없는 줄입니다. 틀렸다는 뜻은 아니지만, 원본이 왜 이게 없어도 됐는지 확인해 보세요.',
  'clone.whyDiffer': '뜻이 달라지거나 자동으로 같음을 증명할 수 없습니다.',
  'clone.whyDifferReasons': '뜻이 달라지거나 자동으로 같음을 증명할 수 없습니다. 사유: {{reasons}}',

  // ───────── T2 구조 ─────────
  'map.label': '의존 지도',
  'map.plateLabel': '{{name}} 의존 지도',
  'map.kindPlacement': '책임 배치',
  'map.kindRadius': '영향 반경',
  'map.kindFlow': '흐름 추적',
  'map.kindDirection': '의존성 방향',
  'map.subPlacement': '정답지 = 실제 커밋 · 부분 점수',
  'map.subRadius': '정답지 = 지도의 화살표 방향 · 부분 점수',
  'map.subFlow': '정답지 = 지도의 경로',
  'map.subDirection': '5문항 · 지도를 보고 답해도 됩니다',
  'map.kindEntry': '진입점',
  'map.kindRole': '폴더의 역할',
  'map.subEntry': '정답지 = 들어오는 화살표가 없는 폴더 · 부분 점수',
  'map.subRole': '1문항 · 물어보는 폴더는 지도에서 빠져 있습니다',
  'map.sourceT2':
    '{{sub}} · 파일 {{files}} · 연결 {{edges}} · 층 {{bands}} · 화살표는 언제나 <b>가져다 쓴다(import)</b> 방향',
  'map.mapHint':
    '정답을 맞히는 게 목적이 아니라, 내 프로젝트가 어떻게 나뉘어 있는지 감을 잡는 게 목적입니다.',

  'map.stateOk': '맞게 고름',
  'map.stateMissed': '놓침',
  'map.stateWrong': '아닌데 고름',
  'map.stateSec': '같이 바뀜',
  'map.folded': '접힌 폴더',
  'map.foldedFiles': '접힌 폴더 · 파일 {{n}}개',
  'map.cycle': '순환',
  'map.cycleTag': '⟲ 순환',
  'map.newFile': '새 파일',
  'map.newTag': '＋ 새 파일',

  'map.statusHover': '파일 상자에 마우스를 올리면 연결이 보이고, 클릭하면 고릅니다.',
  'map.statusAxis': '위쪽 = 사용자와 가까운 쪽 · 아래쪽 = 데이터와 가까운 쪽',
  'map.statusUses': '이 파일을 쓰는 곳',
  'map.statusUsed': '이 파일이 쓰는 것',
  'map.statusLegend': '✓ 맞게 고름 · ＋ 놓침 · ✕ 아닌데 고름 · ◆ 같이 바뀜',
  'map.statusClick': '클릭하면 선택 / 해제',
  'map.pickedNone': '아직 고른 파일이 없습니다.',

  'map.hint': '힌트 {{n}}',
  'map.hintNote': '힌트는 감점이 아닙니다. 놓친 파일은 채점 뒤 지도에서 깜빡입니다.',
  'map.hintLast': '이제 개수까지 알려 드렸어요.',
  'map.hintFree': '힌트는 감점이 아니에요.',
  'map.dunnoHint': '모르겠어요 · 힌트 {{n}}/{{max}}',

  'map.verdictPerfect': '완벽합니다',
  'map.verdictClose': '거의 맞았어요',
  'map.verdictAgain': '다시 한 번 볼까요',
  'map.verdictLine':
    '꼭 고쳐야 할 {{core}}개 중 <b>{{found}}개 찾음</b> · <b>{{missed}}개 놓침</b> · 필요 없는데 고른 것 <b>{{wrong}}개</b> · 보너스 <b>{{bonus}}개</b>',
  'map.meterLabel': '{{core}}개 중 {{found}}개 찾음, {{missed}}개 놓침',
  'map.guidePerfect': '완벽해요. 층을 다 짚었어요.',
  'map.guideClose': '거의 맞았어요. 놓친 자리가 깜빡여요.',
  'map.guideMissed': '놓친 파일부터 봐요. 거기가 오늘의 핵심이에요.',
  'map.liveFlow': '채점했습니다. 경로 {{total}}개 중 {{found}}개를 세웠습니다.',
  'map.liveDirection': '채점했습니다. {{total}}문항 중 {{found}}문항을 맞혔습니다.',
  'map.livePlacement': '채점했습니다. 꼭 고쳐야 할 {{total}}개 중 {{found}}개를 찾았습니다.',

  'map.groupMissed': '놓친 파일',
  'map.groupMissedSub': '여기가 이번 학습의 핵심입니다 — 지도에서 깜빡입니다',
  'map.groupFound': '맞게 고른 파일',
  'map.groupWrong': '안 고쳐도 됐던 파일',
  'map.groupWrongSub': '흔한 오답과 그 이유',
  'map.groupSec': '같이 바뀐 파일',
  'map.groupSecSub': '골라도 안 골라도 감점하지 않습니다',
  'map.noChange': '변경 없음',

  'map.commitSource': '정답의 출처',
  'map.commitNote': '— LLM 채점이 아니라 실제 커밋 기록입니다.',

  'map.appealIdle': '이것도 맞다고 생각해요',
  'map.appealDone': '「이것도 맞다」 의견 접수됨',
  'map.appealNote':
    '정답지는 커밋 1건이라 더 넓은 정답이 있을 수 있어요. 같은 의견이 쌓이면 이 문제의 정답지를 넓힙니다.',

  'map.flowPathLabel': '세운 경로',
  'map.flowDeckLabel': '남은 카드',
  'map.flowEmpty': '아직 세운 카드가 없습니다. 아래에서 지나가는 순서대로 고르세요.',
  'map.flowDeckEmpty': '남은 카드가 없습니다.',
  'map.flowNote': '덱에는 경로에 없는 파일도 섞여 있습니다. 다 세우지 않아도 됩니다.',
  'map.flowSeat': '{{total}}개 중 {{seat}}번째',
  'map.flowUp': '위로',
  'map.flowDown': '아래로',
  'map.flowMove': '{{name}} — {{seat}}. {{dir}} 옮기기',
  'map.flowDrop': '{{name}} — 경로에서 빼기',
  'map.flowAdd': '{{name}} — 경로 {{seat}}번째로 세우기',
  'map.flowRemove': '빼기',

  'map.directionLeft': '아직 {{n}}문항 남았습니다. 다 답하면 채점할 수 있습니다.',
  'map.directionDone': '지도를 보고 답해도 됩니다 — 외우는 문제가 아닙니다.',
} as const;
