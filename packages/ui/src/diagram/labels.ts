/**
 * 그림이 스스로 내는 문구. **한국어가 정본**이고, 화면은 `labels` 프롭으로 `t()` 문자열을
 * 덮어쓴다 — `packages/i18n` 에 `diagram.*` 키가 생기면 이 상수는 폴백으로만 남는다
 * (diagrams.md §5).
 *
 * 여기 없는 문구(캡션·코드 줄·묶음 이름)는 **데이터가 나른다** — 그림이 문구를 지어내지
 * 않는 것이 이 파일의 요점이다.
 */
export interface DiagramLabels {
  /** 단계 이동 버튼. */
  prev: string;
  next: string;
  /** 가려진 값의 낭독기 문구. */
  hidden: string;
  /** 비트 수 단위. */
  bitUnit: string;
  /** 값 두 줄의 이름. */
  literal: string;
  stored: string;
  /** 저장된 값이 적은 값과 다를 때 붙는 한 마디. */
  lossy: string;
  /** 폭에 안 들어가 감겼을 때. */
  wrapped: string;
  /** 표 대체의 열 이름. */
  colField: string;
  colBits: string;
  colMeaning: string;
  colStep: string;
  colName: string;
  colValue: string;
  /** 표 대체의 제목. */
  altTable: string;
}

export const DIAGRAM_LABELS_KO: Readonly<DiagramLabels> = {
  prev: '이전',
  next: '다음',
  hidden: '가려짐',
  bitUnit: '비트',
  literal: '적은 값',
  stored: '저장된 값',
  lossy: '적은 값과 다릅니다',
  wrapped: '폭에 안 들어가 감겼습니다',
  colField: '묶음',
  colBits: '비트',
  colMeaning: '뜻',
  colStep: '단계',
  colName: '이름',
  colValue: '값',
  altTable: '그림을 표로 옮긴 것',
};

/** 준 것만 덮어쓴다. */
export function withLabels(over: Partial<DiagramLabels> | undefined): DiagramLabels {
  return over === undefined ? DIAGRAM_LABELS_KO : { ...DIAGRAM_LABELS_KO, ...over };
}
