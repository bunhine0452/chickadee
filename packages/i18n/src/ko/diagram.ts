/**
 * 그림이 스스로 내는 낱말 — `design/system/diagrams.md` §6 (D187 ⑳).
 *
 * 그림은 문구를 지어내지 않는다. 캡션·코드 줄·묶음 이름·자리 경로·간선 이름은 **데이터가
 * 나르고**, 여기 있는 것은 그림 자신의 어휘뿐이다 — 「이전」·「저장된 값」·「걷힐 때 도는 것」.
 *
 * `packages/ui` 의 `diagramLabels()` 가 이 키들을 `DiagramLabels` 모양으로 묶어 컴포넌트의
 * `labels` 프롭에 넘긴다. `DIAGRAM_LABELS_KO` 는 그 뒤로 폴백이라 두 곳의 한국어가 같아야
 * 한다 — 어긋나면 `packages/ui/src/diagram/i18n.test.ts` 가 잡는다.
 *
 * **낭독 문장(`aria-label`)은 아직 여기 없다.** 문장 틀이 `packages/ui` 안에서 만들어지고
 * 한국어 하나뿐이다(diagrams.md §7 에 적었다).
 */
export const diagram = {
  // ───────── 공통 ─────────
  'diagram.prev': '이전',
  'diagram.next': '다음',
  'diagram.hidden': '가려짐',
  'diagram.altTable': '그림을 표로 옮긴 것',

  // ───────── 비트 배열 · 겹친 비트 배열 ─────────
  'diagram.bitUnit': '비트',
  'diagram.literal': '적은 값',
  'diagram.stored': '저장된 값',
  'diagram.lossy': '적은 값과 다릅니다',
  'diagram.wrapped': '폭에 안 들어가 감겼습니다',
  'diagram.cut': '잘림',
  'diagram.kept': '남음',

  // ───────── 메모리 줄 ─────────
  'diagram.addr': '주소',
  'diagram.offset': '거리',
  'diagram.alias': '별칭',
  'diagram.windowLen': '길이',
  'diagram.windowCap': '용량',

  // ───────── 스택 프레임 ─────────
  'diagram.args': '인자',
  'diagram.locals': '지역',
  'diagram.unwind': '걷힐 때 도는 것',

  // ───────── 타입 변환 사다리 ─────────
  'diagram.widen': '넓어짐',
  'diagram.narrow': '잘림',
  'diagram.fallible': '갈라짐',

  // ───────── 권한 줄 ─────────
  'diagram.permRead': '읽기',
  'diagram.permWrite': '쓰기',
  'diagram.permOwn': '소유',
  'diagram.permHas': '있음',
  'diagram.permGained': '얻음',
  'diagram.permLost': '잃음',
  'diagram.permMissing': '없는데 요구됨',
  'diagram.permNone': '없음',
  'diagram.needs': '이 줄이 요구하는 것',

  // ───────── 나란한 걸음 ─────────
  'diagram.send': '보냄',
  'diagram.recv': '받음',
  'diagram.wait': '기다림',
  'diagram.lock': '잠금',

  // ───────── 표 대체의 열 이름 ─────────
  'diagram.colField': '묶음',
  'diagram.colBits': '비트',
  'diagram.colMeaning': '뜻',
  'diagram.colStep': '단계',
  'diagram.colName': '이름',
  'diagram.colValue': '값',
  'diagram.colAddr': '주소',
  'diagram.colType': '타입',
  'diagram.colEdge': '간선',
  'diagram.colPlace': '자리',
  'diagram.colLine': '줄',
  'diagram.colLane': '줄기',
  'diagram.colCode': '코드',
  'diagram.colOrder': '순서',
} as const;
