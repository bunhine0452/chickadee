/**
 * 카드 생성기 — packages/cards (t0 3종 · t1 스펙/마스크 · t2 4종).
 *
 * 키 이름은 `화면.자리` 다. `ko` 가 키 집합의 정본이고 `en/cards.ts` 가 따라온다 (D117).
 * **이 파일은 그 영역을 맡은 세션만 고친다** — 카탈로그를 영역별로 가른 이유가 그것이다.
 *
 * 두 갈래가 섞여 있다. 카드에 구워져 화면에 그대로 뜨는 문장(질문·힌트·진단)과, 판을
 * 만들지 못한 사유(`drop*`·`no*`)다. 사유도 화면 문구다 — `gap.reason` 으로 내려가 홈의
 * 「판이 없는 문법」이 읽는다(04 §1.4). 어투가 다른 것은 그대로 뒀다: 사유는 「없다」,
 * 카드 본문은 「없습니다」다.
 */
export const cards = {
  // ───────── 사전 3층 라벨 (payload.ts · 채점 사다리도 앞의 둘을 쓴다) ─────────
  'card.dictOneLiner': '한 줄로',
  'card.dictWhy': '왜 필요한가',
  'card.dictTrace': '{{focus}}행 안에서',
  'card.varsMissing': '템플릿이 이 사용처에 없는 변수를 쓴다: {{names}}',

  // ───────── T0 ─────────
  't0.roleOp': '기호',
  't0.roleId': '이름',
  't0.roleLit': '값',
  't0.roleOther': '조각',
  // 조사는 짚은 토큰이 정한다 — 「«map» 은」과 「«useState» 는」이 같이 나오지 않게.
  't0.pointDiag': '«{{pick}}»{{pick|josa:은,는}} {{role}} 자리입니다. 정답은 «{{answer}}» 입니다.',

  't0.noSiteInRepo': '리포에 이 문법의 사용처가 없다',
  't0.noSiteUsable': '쓸 수 있는 사용처가 없다',
  't0.dropNoHole': '이 사용처에는 구멍(@hole)이 없다',
  't0.dropHoleTooShort': '구멍이 한 글자라 빈칸으로 못 낸다',
  't0.dropNoBlankEntry': '사전에 빈칸형 문항이 없다',
  't0.dropNoMeaningEntry': '사전에 의미형 문항이 없다',
  't0.dropNoPointEntry': '사전에 지목형 문항이 없다',
  't0.dropFirstOptionDiffers': '첫 보기가 구멍 원문({{hole}})과 다르다',
  't0.dropOptionKinds': '보기 4개의 종류가 서로 다르다',
  't0.dropNoWrongDiag': '오답 보기에 진단이 없다',
  't0.dropNoFocusLine': '초점 줄을 못 읽었다',
  't0.dropHoleNotInFocus': '구멍({{hole}})을 초점 줄에서 못 찾았다',
  't0.dropHeuristicSite': '추정으로 잡은 사용처라 의미형에 못 쓴다',
  't0.dropPoorParse': '파싱이 온전치 않은 파일이라 의미형에 못 쓴다',
  't0.dropAnswerNotInFocus': '정답 토큰 {{token}} 이 초점 줄에 없다',
  't0.dropFewCandidates': '짚을 후보가 {{n}}개에 못 미친다',

  // ───────── T1 ─────────
  // 조각 카드 첫 줄의 주석 표시. 앞의 `//`·`#` 는 언어가 정한다.
  't1.continued': '…이어서',
  't1.whyQuestion': '이 줄이 없으면 무엇이 달라질까요?',
  't1.whyHelpTranscribe':
    '한 줄이면 됩니다. 채점하지 않습니다. 다만 건너뛸 수는 없습니다 — '
    + '여기서 뇌가 안 켜지면 앞의 필사는 타자 연습이 됩니다.',
  // `{{list}}` 는 `<code>` 로 감싼 이름 목록이다. 조사 필터가 태그를 벗기고 재므로
  // 목록의 마지막 이름이 조사를 정한다.
  't1.specCalls': '{{list}} {{list|josa:을,를}} 부른다',
  't1.specLocals': '지역 변수 {{n}}개를 선언한다 — {{names}}',
  't1.specReturnRoot': '<code>&lt;{{tag}}&gt;</code> {{tag|josa:을,를}} 루트로 돌려준다',
  't1.specEarlyReturns': '조기 반환이 {{n}}군데 있다',

  't1.noBlockInRepo': '리포에 필사할 블록 후보가 없다',
  't1.noBlockUsable': '필사할 블록이 없다',
  't1.dropNoLines': '블록 원문을 읽지 못했다',
  't1.dropLineCount': '{{n}}줄 — 필사 블록은 {{min}}~{{max}}줄이다',
  't1.dropNoConcepts': '블록에 걸린 문법 개념이 없다',
  't1.dropTooManyUnknown': '모르는 문법이 {{n}}개 — {{max}}개까지만 필사한다',
  't1.dropFirstPrintTooLong': '첫 노출은 {{max}}줄까지다 ({{n}}줄)',
  't1.dropNoDictConcept': '블록 안에 사전에 있는 필수 문법 개념이 없다',
  't1.dropNothingToMask': '2단계에 지울 줄이 없다 — 전부 시그니처·주석·닫힘이다',

  // ───────── T2 — 층 이름 ─────────
  't2.bandScreen': '화면',
  't2.bandFeature': '기능',
  't2.bandAction': '동작 · 통신',
  't2.bandShared': '공용 · 데이터',

  // ───────── T2 — 책임 배치 ─────────
  't2.question': '«{{subject}}» 기능을 넣는다면, 어느 파일들을 고쳐야 할까요?',
  't2.placementHint': '지도에서 파일 상자를 클릭해 고릅니다. 정답 개수는 비공개입니다.',
  't2.changeAdded': '새로 만든 파일입니다.',
  't2.changeDeleted': '지워진 파일입니다.',
  't2.changeRenamed': '이름이 바뀌면서 함께 고쳐졌습니다.',
  't2.changeLines': '{{n}}줄이 바뀌었습니다.',
  't2.changeFew': '몇 줄만 고쳐졌습니다.',
  't2.relationUsedBy': '«{{name}}» 가 이 파일을 가져다 씁니다.',
  't2.relationUses': '«{{name}}» 를 가져다 씁니다.',
  't2.relationBand': '{{band}} 층입니다.',
  't2.coChanged': '이번 커밋에서는 안 바뀌었지만, 최근 커밋에서 이 파일들과 함께 자주 바뀌었습니다.',
  't2.trapPlacesOnly':
    '«{{self}}» 는 «{{child}}» 를 놓기만 합니다. 안쪽이 바뀌어도 «{{self}}» 는 모릅니다',
  't2.trapShared': '공용 부품. «{{name}}» 가 가져다 쓸 뿐입니다',
  't2.trapStateMoved': '«{{self}}» 에 상태가 있지만 이번엔 새 파일 «{{taker}}» 이 그 일을 맡았습니다',
  't2.trapUnchanged': '이번 커밋에서는 바뀌지 않은 파일입니다',
  't2.hintSpreadUnknown': '이 기능은 여러 층에 걸쳐 있습니다. 화면만 고쳐서는 끝나지 않아요.',
  't2.hintSpread':
    '이 기능은 {{bands}}개 층 중 <b>{{n}}개 층</b>에 걸쳐 있습니다. 화면만 고쳐서는 끝나지 않아요.',
  't2.hintNoNewFiles': '이번 커밋에서 새로 만들어진 파일은 없습니다. 있던 파일만 고쳤어요.',
  't2.hintNewFiles': '<b>새로 만들어진 파일이 {{n}}개</b> 있습니다. 지도에 「새 판」 표시가 있어요.',
  't2.hintCoreCount': '꼭 고쳐야 하는 파일은 <b>{{n}}개</b>입니다.',
  't2.hintCoreCountBonus': '{{count}} (＋ 보너스 {{n}}개)',
  't2.commitStat': '파일 {{files}}개 · +{{ins}} −{{del}}',

  // ───────── T2 — 영향 반경 ─────────
  't2.radiusQuestion': '«{{target}}» 를 바꾸면 어느 파일이 영향을 받나요?',
  't2.radiusHint': '지도에서 파일 상자를 클릭해 고릅니다. 화살표 방향이 답을 가릅니다.',
  't2.radiusDirect': '직접',
  't2.radiusDirectNote': '«{{name}}» 가 «{{target}}» 를 직접 가져다 씁니다.',
  't2.radiusHop': '건너서',
  't2.radiusHopNote': '한 다리 건너 닿습니다. 골라도 안 골라도 감점하지 않습니다.',
  't2.radiusTrap':
    '«{{name}}» 는 «{{target}}» 가 가져다 쓰는 쪽이라 «{{target}}» 가 바뀌어도 모릅니다.',
  't2.radiusHint1': '영향을 받는 파일은 {{n}}개 층에 걸쳐 있습니다.',
  't2.radiusHint2': '화살표가 이 파일로 **들어오는** 쪽만 영향을 받습니다. 나가는 쪽은 아닙니다.',
  't2.radiusHint3': '직접 영향을 받는 파일은 {{one}}개입니다. (＋ 한 다리 건너 {{two}}개)',

  // ───────── T2 — 흐름 추적 ─────────
  't2.flowQuestion': '«{{first}}» 에서 «{{last}}» 까지 어떤 순서로 지나가나요?',
  't2.flowHint': '카드를 위에서 아래 순서로 세웁니다. 덱에는 경로에 없는 파일도 섞여 있습니다.',
  't2.flowHint1': '지나가는 파일은 {{n}}개입니다.',
  't2.flowHint2': '덱에 경로 밖 파일이 섞여 있습니다. 화살표가 이어지는지 보세요.',
  't2.flowHint3': '첫 자리는 «{{first}}» 입니다.',

  // ───────── T2 — 의존성 방향 ─────────
  't2.directionQuestion': '두 파일 사이의 방향을 고르세요. 화살표는 언제나 「가져다 쓴다」 방향입니다.',
  't2.directionHint': '{{n}}문항입니다. 지도를 보고 답해도 됩니다 — 외우는 문제가 아닙니다.',
  't2.directionHint1': '위쪽 층이 아래쪽 층을 가져다 쓰는 것이 보통입니다.',
  't2.directionHint2': '지도에서 두 상자에 마우스를 올리면 이어진 선만 진해집니다.',
  't2.directionHint3': '관계가 있는 쌍은 {{n}}개입니다.',

  't2.noCommits': '후보 커밋 {{n}}건 — {{min}}건은 있어야 한다',
  't2.noCommitFiles': '후보 커밋의 변경 파일을 찾지 못했다',
  't2.mapTooSmall': '지도 노드 {{n}}개 — 너무 작다',
  't2.noRadiusTarget': '들어오는 화살표가 있는 대지 파일이 없다',
  't2.noFlowPath': '{{n}}개 이상 이어지는 경로가 없다',
  't2.noDirectionPairs': '방향을 물을 쌍이 {{n}}개가 안 된다',
} as const;
