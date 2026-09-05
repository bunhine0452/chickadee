/**
 * 그림이 스스로 내는 문구. **한국어가 정본**이고, 화면은 `labels` 프롭으로 `t()` 문자열을
 * 덮어쓴다 — `diagramLabels()`(`./i18n`)가 `packages/i18n` 의 `diagram.*` 키를 그 모양으로
 * 만든다(D187 ⑳). 이 상수는 그 뒤로 **폴백**이다: `t()` 를 안 거치는 자리(단위 시험·
 * 그림만 떼어 쓰는 문항)에서도 그림이 빈 글자를 내지 않는다.
 *
 * 여기 없는 문구(캡션·코드 줄·묶음 이름·자리 경로·간선 이름)는 **데이터가 나른다** —
 * 그림이 문구를 지어내지 않는 것이 이 파일의 요점이다.
 */
export interface DiagramLabels {
  /* ───────── 공통 ───────── */
  /** 단계 이동 버튼. */
  prev: string;
  next: string;
  /** 가려진 값의 낭독기 문구. */
  hidden: string;
  /** 표 대체의 제목. */
  altTable: string;

  /* ───────── 비트 배열 · 겹친 비트 배열 ───────── */
  /** 비트 수 단위. */
  bitUnit: string;
  /** 값 두 줄의 이름. */
  literal: string;
  stored: string;
  /** 저장된 값이 적은 값과 다를 때 붙는 한 마디. */
  lossy: string;
  /** 폭에 안 들어가 감겼을 때. */
  wrapped: string;
  /** 겹친 비트 배열 — 위 폭에서 떨어져 나가는 자리와 살아남는 자리. */
  cut: string;
  kept: string;

  /* ───────── 메모리 줄 ───────── */
  addr: string;
  /** 기준 주소에서의 거리 — 「`a[i]` 가 거리 `i`」가 이 줄이다. */
  offset: string;
  /** 이름 둘이 한 칸을 가리키는 것. */
  alias: string;
  /** 슬라이스 창의 세 수. */
  windowLen: string;
  windowCap: string;

  /* ───────── 스택 프레임 ───────── */
  args: string;
  locals: string;
  /** 프레임이 걷힐 때 도는 코드. */
  unwind: string;

  /* ───────── 타입 변환 사다리 ───────── */
  widen: string;
  narrow: string;
  fallible: string;

  /* ───────── 권한 줄 ───────── */
  permRead: string;
  permWrite: string;
  permOwn: string;
  permHas: string;
  permGained: string;
  permLost: string;
  permMissing: string;
  permNone: string;
  /** 이 줄이 요구하는 권한. */
  needs: string;

  /* ───────── 나란한 걸음 ───────── */
  send: string;
  recv: string;
  wait: string;
  lock: string;

  /* ───────── 표 대체의 열 이름 ───────── */
  colField: string;
  colBits: string;
  colMeaning: string;
  colStep: string;
  colName: string;
  colValue: string;
  colAddr: string;
  colType: string;
  colEdge: string;
  colPlace: string;
  colLine: string;
  colLane: string;
  colCode: string;
  colOrder: string;
}

export const DIAGRAM_LABELS_KO: Readonly<DiagramLabels> = {
  prev: '이전',
  next: '다음',
  hidden: '가려짐',
  altTable: '그림을 표로 옮긴 것',

  bitUnit: '비트',
  literal: '적은 값',
  stored: '저장된 값',
  lossy: '적은 값과 다릅니다',
  wrapped: '폭에 안 들어가 감겼습니다',
  cut: '잘림',
  kept: '남음',

  addr: '주소',
  offset: '거리',
  alias: '별칭',
  windowLen: '길이',
  windowCap: '용량',

  args: '인자',
  locals: '지역',
  unwind: '걷힐 때 도는 것',

  widen: '넓어짐',
  narrow: '잘림',
  fallible: '갈라짐',

  permRead: '읽기',
  permWrite: '쓰기',
  permOwn: '소유',
  permHas: '있음',
  permGained: '얻음',
  permLost: '잃음',
  permMissing: '없는데 요구됨',
  permNone: '없음',
  needs: '이 줄이 요구하는 것',

  send: '보냄',
  recv: '받음',
  wait: '기다림',
  lock: '잠금',

  colField: '묶음',
  colBits: '비트',
  colMeaning: '뜻',
  colStep: '단계',
  colName: '이름',
  colValue: '값',
  colAddr: '주소',
  colType: '타입',
  colEdge: '간선',
  colPlace: '자리',
  colLine: '줄',
  colLane: '줄기',
  colCode: '코드',
  colOrder: '순서',
};

/** 준 것만 덮어쓴다. */
export function withLabels(over: Partial<DiagramLabels> | undefined): DiagramLabels {
  return over === undefined ? DIAGRAM_LABELS_KO : { ...DIAGRAM_LABELS_KO, ...over };
}
