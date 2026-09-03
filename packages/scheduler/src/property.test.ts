/**
 * 스케줄러 property (06 §1.3). 다섯 속성을 fast-check 1,000회로 흔든다.
 *
 * 왜 예시 테스트로 안 되나: 겹 규칙은 「그날 천장」이라는 **숨은 상태**를 지나며 쌓이고,
 * 사람이 떠올리는 순서는 언제나 몇 갈래뿐이다. 무작위 순서가 밟는 자리가 실제로 사고가
 * 나는 자리다 — 「모르겠어요를 두 번 누르면 두 겹 내려간다」 같은 것.
 */
import fc from 'fast-check';
import { describe, expect, test } from 'vitest';

import type { ConceptId, DayKey, Layer, Track } from '@chickadee/store-sql';

import { dayKey, labelFor } from './day.js';
import { makeScheduler, shownLayerOf, type UsedGrade } from './fsrs.js';
import { retryAt } from './insert.js';
import {
  LIMIT, estMinFor, planSession, plannedMin, type Candidate, type DueConcept,
} from './plan.js';
import { step, type LayerState, type Outcome } from './reducer.js';

const RUNS = 1_000;
const SEED = 20_260_902;
const opts = { numRuns: RUNS, seed: SEED } as const;

const T0 = 1_772_701_200_000; // 2026-09-03 09:00 UTC
const DAY_MS = 86_400_000;
const TZ = 'UTC';
const ROLLOVER = 4;

const outcome = fc.constantFrom<Outcome>('ok', 'wrong', 'dunno');
const layerArb = fc.integer({ min: 0, max: 4 }).map((n) => n as Layer);

/** 판 한 장 = (결과, 몇 시간 뒤). 하루를 넘기기도 한다. */
const stepArb = fc.record({ o: outcome, afterHours: fc.integer({ min: 0, max: 96 }) });

interface Walk {
  state: LayerState;
  layers: number[];
  moves: { o: Outcome; before: Layer; after: Layer; day: DayKey }[];
}

/** 무작위 판 열들을 리듀서에 흘린다. FSRS 는 만기만 정하므로 여기서는 고정 간격을 쓴다. */
function walk(start: LayerState, steps: readonly { o: Outcome; afterHours: number }[]): Walk {
  let state = start;
  let at = T0;
  const layers: number[] = [];
  const moves: Walk['moves'] = [];
  for (const s of steps) {
    at += s.afterHours * 3_600_000;
    const day = dayKey(at, TZ, ROLLOVER);
    const move = step(state, s.o, at, day);
    state = { ...move.next, dueAt: at + DAY_MS, lastOkDay: s.o === 'ok' ? day : state.lastOkDay,
      firstOkAt: state.firstOkAt ?? (move.firstOk ? at : null) };
    layers.push(move.after);
    moves.push({ o: s.o, before: move.before, after: move.after, day });
  }
  return { state, layers, moves };
}

const fresh = (layer: Layer = 0): LayerState => ({
  layer,
  dayKey: null,
  dayStartLayer: layer,
  dayCeiling: layer,
  firstOkAt: layer > 0 ? T0 - 30 * DAY_MS : null,
  lastOkDay: layer > 0 ? ('2026-08-01' as DayKey) : null,
  dueAt: layer > 0 ? T0 - DAY_MS : null,
});

describe('(a) 잉크 겹은 언제나 0~4 다', () => {
  test('어떤 순서로 얼마를 찍어도', () => {
    fc.assert(
      fc.property(layerArb, fc.array(stepArb, { maxLength: 40 }), (start, steps) => {
        const { layers } = walk(fresh(start), steps);
        return layers.every((n) => Number.isInteger(n) && n >= 0 && n <= 4);
      }),
      opts,
    );
  });
});

describe('(b) `labelFor` 는 다섯 모양 중 하나다', () => {
  const LABEL = /^(오늘 안에|내일|\d+일 뒤|\d+주 뒤)$/;

  test('만기가 언제든', () => {
    fc.assert(
      fc.property(fc.integer({ min: -400, max: 400 }), fc.integer({ min: 0, max: 86_399 }), (days, secs) => {
        const due = T0 + days * DAY_MS + secs * 1000;
        return LABEL.test(labelFor(due, T0, TZ, ROLLOVER));
      }),
      opts,
    );
  });
});

describe('(c) 「모르겠어요」는 정확히 한 겹', () => {
  test('두 번 눌러도 더 내려가지 않는다', () => {
    fc.assert(
      fc.property(layerArb, fc.integer({ min: 1, max: 6 }), (start, times) => {
        const steps = Array.from({ length: times }, () => ({ o: 'dunno' as const, afterHours: 0 }));
        const { layers } = walk(fresh(start), steps);
        const expected = Math.max(0, start - 1);
        // 첫 번째가 한 겹을 내리고, 나머지는 이미 내려간 자리에서 더 못 내린다.
        return layers.every((n) => n === expected);
      }),
      opts,
    );
  });

  test('같은 날 다시 찍기 정답은 원래 겹까지만 돌아온다', () => {
    fc.assert(
      fc.property(layerArb, (start) => {
        const { layers } = walk(fresh(start), [
          { o: 'dunno', afterHours: 0 },
          { o: 'ok', afterHours: 0 },
        ]);
        // 겹 0 은 아직 한 번도 못 맞힌 개념이라 R5 가 첫 겹을 보장한다 (LIFER).
        return layers[1] === (start === 0 ? 1 : start);
      }),
      opts,
    );
  });
});

describe('(d) 오답은 바닥까지 떨어뜨리지 않는다', () => {
  test('겹은 유지되고 그날 천장이 현재 겹으로 내려간다', () => {
    fc.assert(
      fc.property(layerArb, fc.integer({ min: 1, max: 5 }), (start, wrongs) => {
        const steps = Array.from({ length: wrongs }, () => ({ o: 'wrong' as const, afterHours: 0 }));
        const { layers } = walk(fresh(start), steps);
        return layers.every((n) => n === start);
      }),
      opts,
    );
  });

  test('오답 뒤 다시 찍기는 그날 안에서 겹을 올리지 못한다', () => {
    fc.assert(
      fc.property(layerArb, (start) => {
        const { layers } = walk(fresh(start), [
          { o: 'wrong', afterHours: 0 },
          { o: 'ok', afterHours: 0 },
        ]);
        // 첫 성공이면 R5 가 1겹을 보장한다. 그 밖에는 제자리다.
        return layers[1] === Math.max(start, start === 0 ? 1 : start);
      }),
      opts,
    );
  });

  test('다시 찍기 판은 언제나 현재 뒤에 들어간다', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 60 }).chain((count) =>
          fc.tuple(fc.constant(count), fc.integer({ min: 0, max: count - 1 }))),
        ([count, pos]) => {
          const at = retryAt(count, pos, 1);
          return at.pos > pos && at.pos <= count && at.role === 'retry';
        },
      ),
      opts,
    );
  });
});

describe('(e) 큐 총 시간은 예산 안에 있다', () => {
  const cid = (n: number): ConceptId => `ts/c${n}` as ConceptId;
  const card = (n: number, role: Candidate['role'], track: Track = 't0'): Candidate => ({
    cardId: n, conceptId: cid(n), track, role, estMin: estMinFor(track, role),
  });

  test('10~25분 · 15 % 여유를 넘지 않는다 — 만기 복습만 예외다', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }),
        fc.integer({ min: 0, max: 40 }),
        fc.integer({ min: 1, max: 40 }),
        (budget, dueCount, newCount) => {
          const due: DueConcept[] = Array.from({ length: dueCount }, (_, i) => ({
            conceptId: cid(i), layer: 1, track: 't0', r: i / 100,
          }));
          const plan = planSession({
            budgetMin: budget,
            due,
            pickCard: (conceptId) => card(Number(String(conceptId).slice(4)), 'review'),
            newConcepts: Array.from({ length: newCount }, (_, i) => ({
              conceptId: cid(100 + i), bestSiteId: i,
            })),
            makeNewCard: (conceptId) => card(Number(String(conceptId).slice(4)), 'new'),
            newCountToday: 0,
          });
          const total = plannedMin(plan);
          const reviews = plan.filter((p) => p.role === 'review');
          const floor = reviews.reduce((a, p) => a + p.estMin, 0);
          const cap = Math.max(LIMIT.min_budget, Math.min(LIMIT.hard_cap_min, budget)) * 1.15;
          // 부채(만기 복습)는 예산보다 크면 그대로 남는다 — 미루면 더 커진다.
          return total <= Math.max(cap, floor) + 1e-9;
        },
      ),
      opts,
    );
  });

  test('만기 복습은 한 장도 빠지지 않는다 (상한 20 까지)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 40 }), (dueCount) => {
        const due: DueConcept[] = Array.from({ length: dueCount }, (_, i) => ({
          conceptId: cid(i), layer: 1, track: 't0', r: i / 100,
        }));
        const plan = planSession({
          budgetMin: LIMIT.min_budget,
          due,
          pickCard: (conceptId) => card(Number(String(conceptId).slice(4)), 'review'),
          newConcepts: [],
          makeNewCard: () => null,
          newCountToday: 0,
        });
        return plan.length === Math.min(dueCount, LIMIT.reviews_per_session);
      }),
      opts,
    );
  });
});

describe('결정성 (06 §1.3)', () => {
  test('같은 입력이면 같은 큐다', () => {
    const build = () =>
      planSession({
        budgetMin: 15,
        due: [
          { conceptId: 'ts/a' as ConceptId, layer: 2, track: 't0', r: 0.4 },
          { conceptId: 'ts/b' as ConceptId, layer: 1, track: 't0', r: 0.2 },
        ],
        pickCard: (conceptId) => ({
          cardId: 1, conceptId, track: 't0', role: 'review', estMin: 0.5,
        }),
        newConcepts: [{ conceptId: 'ts/c' as ConceptId, bestSiteId: 3 }],
        makeNewCard: (conceptId) => ({
          cardId: 2, conceptId, track: 't0', role: 'new', estMin: 2,
        }),
        newCountToday: 0,
      });
    expect(build()).toStrictEqual(build());
  });

  test('FSRS 도 같은 입력이면 같은 due 다 (fuzz 꺼짐)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 3 }), fc.integer({ min: 0, max: 200 }), (grade, days) => {
        const now = T0 + days * DAY_MS;
        const card = {
          state: 2 as const, stability: 5, difficulty: 6, dueAt: T0 + DAY_MS,
          lastReviewAt: T0, reps: 2, lapses: 0, layer: 2 as Layer,
        };
        const a = makeScheduler({ paramsId: 1 }).review(card, grade as UsedGrade, now);
        const b = makeScheduler({ paramsId: 1 }).review(card, grade as UsedGrade, now);
        // 표시 겹도 같은 R 에서 같은 값이어야 한다.
        const sched = makeScheduler({ paramsId: 1 });
        return a.dueAt === b.dueAt
          && shownLayerOf(card, sched, now) === shownLayerOf(card, sched, now);
      }),
      opts,
    );
  });
});
