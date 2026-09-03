/**
 * 스케줄러 성능 (01 §8 · 05 §10). **헤드리스로 잴 수 있는 것만** 잰다 — 큐를 짜고 판을
 * 마치는 순수 계산이다. 프레임 예산(홈 p95 12ms · `session:mount` 50ms · `t0:grade` 30ms)은
 * WKWebView 안에서만 뜻이 있어 `devtools/audit.ts` 의 `perf()` 가 따로 잰다.
 *
 * 임계는 넉넉하다. 이 테스트가 잡으려는 것은 「20 % 느려짐」이 아니라 **자릿수가 바뀌는
 * 사고**다 — 큐 하나에 사용처 5만 건을 훑는 코드가 들어오는 것 같은.
 */
import { describe, expect, test } from 'vitest';

import type { ConceptId, DayKey, Layer, Mastery } from '@chickadee/store-sql';

import { makeScheduler } from './fsrs.js';
import { LIMIT, estMinFor, planSession, type Candidate, type DueConcept } from './plan.js';
import { step } from './reducer.js';
import { rebuildMastery, type ReplayLog } from './rebuild.js';

const T0 = 1_772_701_200_000;
const DAY = '2026-09-03' as DayKey;

/** 하루 큐 하나를 짜는 예산. 홈 프레임(12ms) 안에 들어가야 「인쇄 시작」이 즉시 열린다. */
const PLAN_BUDGET_MS = 12;
/** 판 하나를 마치는 계산(겹 + FSRS) 예산. 판정 표시는 이것보다 훨씬 뒤에 온다. */
const PLATE_BUDGET_MS = 5;
/** 원장 1,000행 재생 — 기동 시 표본 검증이 이 안에서 끝나야 한다 (02 체크리스트). */
const REPLAY_BUDGET_MS = 200;
const REPLAY_ROWS = 1_000;

const cid = (n: number): ConceptId => `ts/c${n}` as ConceptId;

const card = (n: number, role: Candidate['role']): Candidate => ({
  cardId: n, conceptId: cid(n), track: 't0', role, estMin: estMinFor('t0', role),
});

const mastery = (n: number): Mastery => ({
  conceptId: cid(n), state: 2, stability: 5, difficulty: 6, dueAt: T0 - 1, lastReviewAt: T0 - 5 * 86_400_000,
  reps: 3, lapses: 0, layer: 2 as Layer, dayKey: null, dayStartLayer: 2, dayCeiling: 2,
  firstOkAt: T0 - 30 * 86_400_000, lastOkDay: '2026-09-01' as DayKey, dunnoTotal: 0,
  transferFrom: null, appliedLogId: 0, updatedAt: T0,
});

/** 실측값. 마지막 테스트가 한 번에 적어 인계 문서가 숫자를 그대로 옮길 수 있게 한다. */
const measured: [string, number, number][] = [];

function ms(run: () => void): number {
  const at = performance.now();
  run();
  return performance.now() - at;
}

describe('성능', () => {
  test(`만기 60건·후보 200개에서 큐 짜기가 ${PLAN_BUDGET_MS}ms 안이다`, () => {
    const due: DueConcept[] = Array.from({ length: 60 }, (_, i) => ({
      conceptId: cid(i), layer: 2, track: 't0', r: i / 100,
    }));
    const newConcepts = Array.from({ length: 200 }, (_, i) => ({
      conceptId: cid(1_000 + i), bestSiteId: i,
    }));

    const took = ms(() => {
      for (let i = 0; i < 20; i += 1) {
        planSession({
          budgetMin: LIMIT.budget_min,
          due,
          pickCard: (conceptId) => card(Number(String(conceptId).slice(4)), 'review'),
          newConcepts,
          makeNewCard: (conceptId) => card(Number(String(conceptId).slice(4)), 'new'),
          newCountToday: 0,
        });
      }
    }) / 20;

    measured.push(['큐 짜기 (만기 60 · 후보 200)', took, PLAN_BUDGET_MS]);
    expect(took).toBeLessThan(PLAN_BUDGET_MS);
  });

  test(`판 하나를 마치는 계산이 ${PLATE_BUDGET_MS}ms 안이다`, () => {
    const scheduler = makeScheduler({ paramsId: 1 });
    const m = mastery(1);
    const took = ms(() => {
      for (let i = 0; i < 200; i += 1) {
        const move = step(m, 'ok', T0, DAY);
        scheduler.review({ ...m, ...move.next }, 3, T0);
      }
    }) / 200;
    measured.push(['판 완료 계산', took, PLATE_BUDGET_MS]);
    expect(took).toBeLessThan(PLATE_BUDGET_MS);
  });

  test(`원장 ${REPLAY_ROWS}행 재생이 ${REPLAY_BUDGET_MS}ms 안이다`, () => {
    const logs: ReplayLog[] = Array.from({ length: REPLAY_ROWS }, (_, i) => ({
      id: i + 1,
      conceptId: cid(i % 50),
      track: 't0',
      reviewedAt: T0 + i * 3_600_000,
      dayKey: DAY,
      grade: ((i % 3) + 1) as 1 | 2 | 3,
      ok: i % 3 !== 0,
      dunno: false,
      detail: { track: 't0', sel: 0, answer: 0, kind: 'point' },
      paramsId: 1,
    }));

    let size = 0;
    const took = ms(() => {
      size = rebuildMastery(logs, (paramsId) => makeScheduler({ paramsId })).size;
    });
    expect(size).toBe(50);
    measured.push([`원장 ${REPLAY_ROWS}행 재생`, took, REPLAY_BUDGET_MS]);
    expect(took).toBeLessThan(REPLAY_BUDGET_MS);
  });

  test('실측 요약 — 인계 문서가 이 숫자를 옮긴다', () => {
    expect(measured).toHaveLength(3);
    for (const [name, took, budget] of measured) {
      expect(took, `${name}: ${took.toFixed(3)}ms (예산 ${budget}ms)`).toBeLessThan(budget);
    }
    // 실패했을 때만 보이게 이름과 값을 단언문에 실어 둔다 — 통과할 때 로그를 남기지 않는다.
    expect(measured.map(([name]) => name)).toEqual([
      '큐 짜기 (만기 60 · 후보 200)', '판 완료 계산', '원장 1000행 재생',
    ]);
  });
});
