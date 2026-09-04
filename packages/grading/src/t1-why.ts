/**
 * 왜 게이트 (04 §6). 필사 뒤 **자기 말 한 줄**.
 *
 * 채점하지 않는다 — 채점하면 정답을 맞추려 쓰고, 안 하면 자기 말로 쓴다. 그 한 줄이
 * 목적이다. 그래서 여기 있는 것은 「무엇을 물을까」(문항 선정)와 「그 줄이 자기 말인가」
 * (검증 4조건)뿐이고, 정오는 없다.
 */
import { t } from '@chickadee/i18n';
import type { CardPayload } from '@chickadee/store-sql';

import { sim } from './t1-line.js';
import type { T1Result } from './t1-types.js';

/** `CardPayload` 의 t1 변형이 들고 있는 왜 게이트 문항. */
export type WhyPayload = Extract<CardPayload, { track: 't1' }>['why'];

/** 04 §6 ⓐ — 트림 후 코드포인트 하한. */
export const MIN_CHARS = 10;
/** 04 §6 ⓒ — 원본 줄과 이만큼 닮으면 「살짝 고친 복사」다. */
export const COPY_SIM_LIMIT = 0.6;

/** 02 `why_answer.question_id` 의 네 가지. */
export type QuestionId = `why_gate:${string}` | `missing:${number}` | `differ:${number}` | 'generic';

export interface Question {
  questionId: QuestionId;
  /** 0-based 원본 줄 색인. `-1` 이면 줄에 매이지 않은 문항이다. */
  line: number;
  q: string;
  help: string;
  choices: WhyPayload['choices'];
}

/** 04 §6 ②의 일반 템플릿. 상수가 아니라 함수인 이유는 로케일이다 (D117). */
export const genericQ = (): string => t('t1.whyQuestion');
export const genericHelp = (): string => t('grading.whyHelpNineMinutes');

export interface PickInput {
  /** 카드에 구워진 문항. `choices` 가 3개면 사전 `why_gate` 에서 온 것이다(04 §6 ①). */
  payload: WhyPayload;
  result: T1Result;
  /** 대표 개념 id — `why_gate:<concept>` 의 `<concept>` 가 된다. */
  conceptId: string;
  /** 시그니처 줄 색인 — ④ 「첫 비-시그니처 문장」이 이것을 피한다. */
  signatureLines?: readonly number[];
}

/**
 * 문항 선정 (04 §6 우선순위).
 *
 * ① 사전 `why_gate` 가 있는 개념의 문항 — 카드에 이미 구워져 있고 `choices` 3개가 그 표시다
 *    (D74: 문구는 생성 시점에 렌더된다).
 * ② `missing` 행 — 「왜 이 줄이 필요했나」.
 * ③ 첫 `differ` 행.
 * ④ 첫 비-시그니처 문장.
 *
 * ①만 카드에서 오고 ②③④는 채점 결과가 있어야 정해진다. 그래서 이 함수가 채점 **뒤**에
 * 불린다 — 카드는 ①이나 ④를 미리 굽고, 결과가 더 좋은 자리를 알면 그것으로 바꾼다.
 */
export function pickQuestion(input: PickInput): Question {
  const { payload, result } = input;

  if (payload.choices.length > 0) {
    return {
      questionId: `why_gate:${input.conceptId}`,
      line: payload.line,
      q: payload.q,
      help: payload.help,
      choices: payload.choices,
    };
  }

  const missing = result.rows.find((r) => r.status === 'missing');
  if (missing !== undefined) {
    return {
      questionId: `missing:${missing.oi + 1}`,
      line: missing.oi,
      q: genericQ(),
      help: payload.help === '' ? genericHelp() : payload.help,
      choices: [],
    };
  }

  const differ = result.rows.find((r) => r.status === 'differ');
  if (differ !== undefined) {
    return {
      questionId: `differ:${differ.oi + 1}`,
      line: differ.oi,
      q: genericQ(),
      help: payload.help === '' ? genericHelp() : payload.help,
      choices: [],
    };
  }

  const signature = new Set(input.signatureLines ?? []);
  const line = result.rows.find((r) => r.oi >= 0 && !signature.has(r.oi))?.oi ?? payload.line;
  return {
    questionId: 'generic',
    line,
    q: payload.q === '' ? genericQ() : payload.q,
    help: payload.help === '' ? genericHelp() : payload.help,
    choices: [],
  };
}

/** 검증 결과 — 화면의 글자 수 표시와 「저장하고 마치기」 활성이 이것 하나를 본다. */
export interface WhyCheck {
  ok: boolean;
  /** 목업 문구 그대로. `ok` 면 「n / 10자」, 아니면 막힌 이유. */
  message: string;
}

/**
 * 04 §6 검증 — 넷을 **전부** 통과해야 「저장하고 마치기」가 열린다.
 *
 * ⓐ 트림 후 코드포인트 ≥ 10 · ⓑ 원본 줄 트림과 다름 · ⓒ `Dice < 0.6`(살짝 고친 복사 차단)
 * ⓓ 한글·라틴 낱말 1개 이상.
 *
 * 코드포인트로 세는 이유: `'가'.length` 는 1 이지만 이모지 하나는 2 다. 글자 수 하한을
 * UTF-16 단위로 세면 이모지 다섯 개가 10자로 통과한다.
 */
export function checkWhy(text: string, originalLine: string): WhyCheck {
  const value = text.trim();
  const chars = [...value].length;
  const orig = originalLine.trim();

  if (value === orig && orig !== '') {
    return { ok: false, message: t('grading.whyNotCode') };
  }
  if (orig !== '' && sim(value, orig) >= COPY_SIM_LIMIT) {
    return { ok: false, message: t('grading.whyNotCode') };
  }
  const count = t('grading.whyChars', { n: String(chars), min: String(MIN_CHARS) });
  if (!hasWord(value)) return { ok: false, message: count };
  if (chars < MIN_CHARS) return { ok: false, message: count };
  return { ok: true, message: count };
}

/** ⓓ — 한글 또는 라틴 낱말이 하나라도 있나. 기호만 열 개는 자기 말이 아니다. */
export function hasWord(value: string): boolean {
  return /[가-힣]{2,}/.test(value) || /[A-Za-z]{2,}/.test(value);
}

/** 02 `why_answer` 한 행. `blockId` 는 카드가 가리키는 블록이다. */
export interface WhyDraft {
  blockId: number | null;
  lineNo: number | null;
  questionId: string;
  text: string;
  pick: number | null;
  pickOk: boolean | null;
}

/** 저장할 모양 (04 §6). `lineNo` 는 **1-based** 다 (02 `why_answer.line_no`). */
export function draftWhy(
  question: Question,
  blockId: number | null,
  text: string,
  pick: number | null,
): WhyDraft {
  const chosen = pick === null ? null : question.choices[pick];
  return {
    blockId,
    lineNo: question.line >= 0 ? question.line + 1 : null,
    questionId: question.questionId,
    text: text.trim(),
    pick,
    pickOk: chosen === undefined || chosen === null ? null : chosen.ok,
  };
}
