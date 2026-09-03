import { describe, expect, it } from 'vitest';

import type { ConceptId } from '@chickadee/store-sql';

import { isLifer, outcomeOf, t0Answered, toReviewDetail, type T0AnsweredInput } from './t0-event.js';

const base: T0AnsweredInput = {
  cardId: 12,
  conceptId: 'ts/optional-chaining' as ConceptId,
  siteId: 340,
  kind: 'point',
  sel: 2,
  correct: false,
  dunno: false,
  rungsOpened: [],
  elapsedMs: 4200,
  retry: false,
  prereq: false,
  fresh: true,
  seed: 0x1234_5678,
};

describe('outcome 진리표 (04 §2.2 · 02 §4)', () => {
  it('정답 · dunno 없음 → ok', () => {
    const e = t0Answered({ ...base, correct: true });
    expect(e.outcome).toBe('ok');
    expect(e.correct).toBe(true);
  });

  it('오답 · dunno 없음 → wrong', () => {
    const e = t0Answered({ ...base, correct: false });
    expect(e.outcome).toBe('wrong');
    expect(e.correct).toBe(false);
  });

  it('정답 · dunno → dunno 이고 correct 는 그대로 1', () => {
    const e = t0Answered({ ...base, correct: true, dunno: true });
    expect(e.outcome).toBe('dunno');
    expect(e.correct).toBe(true);
  });

  it('오답 · dunno → dunno 이고 correct 는 그대로 0', () => {
    const e = t0Answered({ ...base, correct: false, dunno: true });
    expect(e.outcome).toBe('dunno');
    expect(e.correct).toBe(false);
  });

  it('outcomeOf 만으로도 같은 표가 나온다', () => {
    expect([
      outcomeOf(true, false), outcomeOf(false, false), outcomeOf(true, true), outcomeOf(false, true),
    ]).toEqual(['ok', 'wrong', 'dunno', 'dunno']);
  });
});

describe('t0Answered — 이벤트 모양', () => {
  it('type 을 박고 나머지는 그대로 싣는다', () => {
    const e = t0Answered({ ...base, rungsOpened: [1, 2], parentCardId: 7, prereq: true });
    expect(e.type).toBe('t0.answered');
    expect(e.rungsOpened).toEqual([1, 2]);
    expect(e.parentCardId).toBe(7);
    expect(e.seed).toBe(base.seed);
  });
});

describe('toReviewDetail (02 §8.2)', () => {
  it('t0 detail 은 sel · answer · kind 셋이다', () => {
    expect(toReviewDetail(t0Answered({ ...base, sel: 3 }), 1)).toEqual({
      track: 't0', sel: 3, answer: 1, kind: 'point',
    });
  });
});

describe('isLifer — correct && fresh && !retry (04 §2.2)', () => {
  const lifer = (over: Partial<T0AnsweredInput>) => isLifer(t0Answered({ ...base, correct: true, ...over }));

  it('셋이 다 참일 때만 참이다', () => {
    expect(lifer({})).toBe(true);
    expect(lifer({ correct: false })).toBe(false);
    expect(lifer({ fresh: false })).toBe(false);
    expect(lifer({ retry: true })).toBe(false);
  });

  // 04 §2.2 의 조건에 `dunno` 는 없다. outcome 이 'dunno' 여도 `correct` 가 참이면 참이다.
  it('조건은 outcome 이 아니라 correct 를 본다', () => {
    expect(lifer({ dunno: true })).toBe(true);
  });
});
