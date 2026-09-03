/**
 * T0 리뷰 로그 이벤트 (04 §2.2).
 *
 * 엔진은 겹을 계산하지 않는다. `outcome`·`retry`·`prereq`·`fresh` 까지만 만들고,
 * 겹·FSRS·큐 삽입은 02 §3.3 `applyOutcome` 과 §4 표가 이 필드들로 계산한다.
 */
import type { ConceptId, ReviewDetail } from '@chickadee/store-sql';

import type { T0Kind } from './t0.js';

export type T0Outcome = 'ok' | 'wrong' | 'dunno';

/** 04 §2.2 그대로. 필드 이름·순서를 바꾸지 않는다 — 02 가 이 이름으로 읽는다. */
export interface T0Answered {
  type: 't0.answered';
  cardId: number;
  conceptId: ConceptId;
  siteId: number | null;
  kind: T0Kind;
  sel: number;
  correct: boolean;
  dunno: boolean;
  /** 사다리에서 연 단 번호들(1~4). 02 `ladder_event` 와 §6.4 초보 감지가 읽는다. */
  rungsOpened: number[];
  elapsedMs: number;
  outcome: T0Outcome;
  retry: boolean;
  prereq: boolean;
  parentCardId?: number;
  fresh: boolean;
  seed: number;
}

/** `outcome` 을 뺀 나머지 — 만드는 쪽은 정오와 「모르겠어요」만 알면 된다. */
export type T0AnsweredInput = Omit<T0Answered, 'type' | 'outcome'>;

/**
 * 02 §4: 「모르겠어요는 그 판의 결과를 `dunno` 로 덮어쓴다(답을 맞혔어도 `grade=Again`,
 * `ok` 는 원래 값)」. 그래서 `outcome` 만 덮이고 `correct` 는 원래 값으로 남는다 —
 * 요약의 「정합 n/N」과 LIFER 는 `correct` 를 세고, 겹과 FSRS 는 `outcome` 을 본다.
 */
export function outcomeOf(correct: boolean, dunno: boolean): T0Outcome {
  if (dunno) return 'dunno';
  return correct ? 'ok' : 'wrong';
}

export function t0Answered(input: T0AnsweredInput): T0Answered {
  return { type: 't0.answered', ...input, outcome: outcomeOf(input.correct, input.dunno) };
}

/**
 * 02 §8.2 `ReviewDetail`. `answer` 는 이벤트에 없어서 따로 받는다 — 04 §2.2 의
 * `T0Answered` 에 `answer` 필드가 없고, 그 인터페이스는 「그대로 쓴다」가 지시다.
 */
export function toReviewDetail(event: T0Answered, answer: number): ReviewDetail {
  return { track: 't0', sel: event.sel, answer, kind: event.kind };
}

/**
 * LIFER — 개념 하나당 평생 한 번 (02 §4 「T0 정답 · 개념 첫 성공」).
 * 04 §2.2 가 정한 조건 그대로: 맞혔고, 처음 만나는 판이고, 다시 찍기가 아니다.
 * 의식(모달)을 띄울지(세션 3회 상한·아래층 판 제외)는 05·02 가 정한다.
 */
export function isLifer(event: T0Answered): boolean {
  return event.correct && event.fresh && !event.retry;
}
