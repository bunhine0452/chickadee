/**
 * T1 결과 화면의 문구 자리 (04 §4.2 사유 코드 → 목업 `renderResult` 의 글).
 *
 * 엔진은 **코드**만 낸다(`packages/grading` 의 `ReasonCode`) — 그것이 골든이 비교할 수 있는
 * 값이고 `patternKey` 가 해시하는 값이다(04 §5). 사람이 읽는 문장은 화면의 것이므로 여기서
 * 코드를 카탈로그 키로 옮긴다. 표가 문장이 아니라 **키**를 드는 이유는 로케일이다 —
 * 모듈이 열리는 시점은 `setLocale()` 보다 이르다 (D117).
 *
 * 문구의 규칙 하나: **`equiv` 는 「틀린 게 아니다」를 말한다**(정본 §3-2 · 목업). 형태가
 * 다른 것을 어긋남처럼 읽히게 두면 학습자가 자기 코드를 고치기 시작한다.
 */
import { t, type MessageKey } from '@chickadee/i18n';
import type { Reason, ReasonCode, Status, T1Row } from '@chickadee/grading';

/** 판정 태그. 목업 `.rtag` 의 글자 그대로. */
export function tagOf(row: T1Row): string {
  if (row.swap === true) return t('session.swap');
  if (row.status === 'exact') return t('session.exact');
  if (row.status === 'equiv') return t('session.equiv');
  if (row.status === 'missing') return t('session.missing');
  if (row.status === 'extra') return t('session.extra');
  return t('session.differ');
}

/** 사유 코드 한 개의 문장. 세부(`detail`)는 붙는 자리가 있으면 괄호로 붙인다. */
const REASON_KEY: Record<ReasonCode, MessageKey> = {
  COMMENT_TEXT: 'clone.reasonCommentText',
  COMMENT_MISSING: 'clone.reasonCommentMissing',
  COMMENT_EXTRA: 'clone.reasonCommentExtra',
  TRAILING_COMMENT: 'clone.reasonTrailingComment',
  BLANK_MISMATCH: 'clone.reasonBlankMismatch',
  INDENT: 'clone.reasonIndent',
  TERMINATOR: 'clone.reasonTerminator',
  QUOTE: 'clone.reasonQuote',
  WHITESPACE: 'clone.reasonWhitespace',
  TOKEN_COUNT: 'clone.reasonTokenCount',
  TOKEN_MISMATCH: 'clone.reasonTokenMismatch',
  RENAME: 'clone.reasonRename',
  SWAP: 'clone.reasonSwap',
  RENAME_INCONSISTENT: 'clone.reasonRenameInconsistent',
  AST_EQUIV: 'clone.reasonAstEquiv',
  TEMPLATE_VS_CONCAT: 'clone.reasonTemplateVsConcat',
  PARSE_ERROR: 'clone.reasonParseError',
  PARSE_LANG_UNSUPPORTED: 'clone.reasonParseLangUnsupported',
  PARSE_TIMEOUT: 'clone.reasonParseTimeout',
};

/** `AST_EQUIV` 의 세부 — 무엇이 달랐길래 같은가. */
const AST_DETAIL_KEY: Record<string, MessageKey> = {
  PAREN: 'clone.astParen',
  BLOCK: 'clone.astBlock',
  ARROW_PARENS: 'clone.astArrowParens',
  LINE_BREAK: 'clone.astLineBreak',
};

export function reasonText(reason: Reason): string {
  const base = t(REASON_KEY[reason.code]);
  if (reason.detail === undefined) return base;
  const key = reason.code === 'AST_EQUIV' ? AST_DETAIL_KEY[reason.detail] : undefined;
  return t('clone.reasonDetail', { base, detail: key === undefined ? reason.detail : t(key) });
}

/** 목업 `.drow .why` 한 줄. `exact` 는 설명이 필요 없다. */
export function whyOf(row: T1Row): string {
  const reasons = row.reasons.map(reasonText).join(' · ');
  if (row.status === 'exact') return '';
  if (row.status === 'equiv') {
    return reasons === '' ? t('clone.whyEquiv') : t('clone.whyEquivReasons', { reasons });
  }
  if (row.status === 'missing') return t('clone.whyMissing');
  if (row.status === 'extra') return t('clone.whyExtra');
  return reasons === '' ? t('clone.whyDiffer') : t('clone.whyDifferReasons', { reasons });
}

/** 어긋남으로 세는 것 — 04 §4.6 은 `meaning = exact + equiv` 이고 나머지가 이 셋이다. */
export const wrongCount = (n: Record<Status, number>): number => n.differ + n.missing + n.extra;

/** 3단계 문구. 목업 `STAGES` 의 물음 그대로. */
const ASK_KEY: Record<1 | 2 | 3, MessageKey> = {
  1: 'clone.ask1',
  2: 'clone.ask2',
  3: 'clone.ask3',
};

export const askText = (stage: 1 | 2 | 3): string => t(ASK_KEY[stage]);

export const askHint = (): string => t('clone.askHint');
