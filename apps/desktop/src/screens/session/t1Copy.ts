/**
 * T1 결과 화면의 한국어 문구 (04 §4.2 사유 코드 → 목업 `renderResult` 의 글).
 *
 * 엔진은 **코드**만 낸다(`packages/grading` 의 `ReasonCode`) — 그것이 골든이 비교할 수 있는
 * 값이고 `patternKey` 가 해시하는 값이다(04 §5). 사람이 읽는 문장은 화면의 것이므로 여기 둔다.
 *
 * 문구의 규칙 하나: **`equiv` 는 「틀린 게 아니다」를 말한다**(정본 §3-2 · 목업). 형태가
 * 다른 것을 어긋남처럼 읽히게 두면 학습자가 자기 코드를 고치기 시작한다.
 */
import type { Reason, ReasonCode, Status, T1Row } from '@chickadee/grading';

/** 판정 태그. 목업 `.rtag` 의 글자 그대로. */
export function tagOf(row: T1Row): string {
  if (row.swap === true) return '이름 맞바꿈';
  if (row.status === 'exact') return '정합';
  if (row.status === 'equiv') return '동등';
  if (row.status === 'missing') return '누락';
  if (row.status === 'extra') return '추가';
  return '어긋남';
}

/** 사유 코드 한 개의 한국어. 세부(`detail`)는 붙는 자리가 있으면 괄호로 붙인다. */
const REASON_TEXT: Record<ReasonCode, string> = {
  COMMENT_TEXT: '주석 문구는 비교하지 않습니다',
  COMMENT_MISSING: '원본의 주석이 없습니다',
  COMMENT_EXTRA: '원본에 없는 주석입니다',
  TRAILING_COMMENT: '줄 끝 주석',
  BLANK_MISMATCH: '한쪽이 빈 줄입니다',
  INDENT: '들여쓰기 폭',
  TERMINATOR: '세미콜론 · 후행 쉼표',
  QUOTE: '따옴표 종류',
  WHITESPACE: '공백',
  TOKEN_COUNT: '토큰 수가 다릅니다',
  TOKEN_MISMATCH: '토큰 불일치',
  RENAME: '지역 변수명 일관 치환',
  SWAP: '바꾼 이름이 원본에 이미 있습니다 — 뜻이 달라집니다',
  RENAME_INCONSISTENT: '변수명 치환이 블록 전체에서 일관되지 않습니다',
  AST_EQUIV: '구문 나무가 같습니다',
  TEMPLATE_VS_CONCAT: '템플릿 리터럴과 문자열 연결은 다릅니다',
  PARSE_ERROR: '이 줄은 문법이 깨져 구문 비교를 못 했습니다',
  PARSE_LANG_UNSUPPORTED: '이 언어는 글자 비교만 합니다',
  PARSE_TIMEOUT: '구문 비교가 시간을 넘겨 글자 비교만 했습니다',
};

/** `AST_EQUIV` 의 세부 — 무엇이 달랐길래 같은가. */
const AST_DETAIL: Record<string, string> = {
  PAREN: '괄호',
  BLOCK: '중괄호',
  ARROW_PARENS: '화살표 매개변수 괄호',
  LINE_BREAK: '줄 나눔',
};

export function reasonText(reason: Reason): string {
  const base = REASON_TEXT[reason.code];
  if (reason.detail === undefined) return base;
  if (reason.code === 'AST_EQUIV') return `${base} (${AST_DETAIL[reason.detail] ?? reason.detail})`;
  return `${base} (${reason.detail})`;
}

/** 목업 `.drow .why` 한 줄. `exact` 는 설명이 필요 없다. */
export function whyOf(row: T1Row): string {
  const reasons = row.reasons.map(reasonText).join(' · ');
  if (row.status === 'exact') return '';
  if (row.status === 'equiv') {
    return `형태만 다릅니다. <b>틀린 게 아닙니다.</b>${reasons === '' ? '' : ` 사유: ${reasons}`}`;
  }
  if (row.status === 'missing') {
    return '이 줄이 빠졌습니다. 원본이 왜 이 줄을 필요로 했는지 확인해 보세요.';
  }
  if (row.status === 'extra') {
    return '원본에 없는 줄입니다. 틀렸다는 뜻은 아니지만, 원본이 왜 이게 없어도 됐는지 확인해 보세요.';
  }
  return reasons === ''
    ? '뜻이 달라지거나 자동으로 같음을 증명할 수 없습니다.'
    : `뜻이 달라지거나 자동으로 같음을 증명할 수 없습니다. 사유: ${reasons}`;
}

/** 판정에 붙는 한 줄 (목업 `.score .pills` 의 마지막 알약). */
export const VERDICT_TEXT: Record<'advance' | 'repeat-soft' | 'repeat', string> = {
  advance: '다음 단계로 가도 좋습니다',
  'repeat-soft': '한 번 더 같은 단계를 권합니다',
  repeat: '같은 단계를 한 번 더 하는 편이 빠릅니다',
};

/** 어긋남으로 세는 것 — 04 §4.6 은 `meaning = exact + equiv` 이고 나머지가 이 셋이다. */
export const wrongCount = (n: Record<Status, number>): number => n.differ + n.missing + n.extra;

/** 3단계 문구. 목업 `STAGES` 의 물음 그대로. */
export const ASK_TEXT: Record<1 | 2 | 3, string> = {
  1: '원본을 보면서 그대로 옮겨 쓰세요.',
  2: '주석과 시그니처만 보고, 내가 썼던 코드를 다시 써 보세요.',
  3: '스펙만 보고 처음부터 써 보세요.',
};

export const ASK_HINT =
  '손으로 쓰는 것 자체가 목적입니다. 100 % 일치하지 않아도 됩니다. '
  + '줄을 벗어날 때만 판정하고, 타이핑 중에는 아무 일도 일어나지 않습니다.';
