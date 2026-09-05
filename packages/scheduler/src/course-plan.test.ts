/**
 * 오늘 15분, 코스판 (D165). 지키는 약속 하나 — **재검은 안 잘린다.**
 */
import { describe, expect, test } from 'vitest';

import { coursePlannedMin, planCourseDay, rechecksOnly, type RecheckItem, type StageItem } from './course-plan.js';
import { recheckGrade, recheckTally, scheduleRecheck, EST_RECHECK_MIN } from './chapter-review.js';
import { makeScheduler } from './fsrs.js';

const recheck = (unitId: number, dueAt: number, estMin = EST_RECHECK_MIN): RecheckItem =>
  ({ kind: 'recheck', unitId, dueAt, estMin });
const stage = (n: number, estMin = 2.1): StageItem =>
  ({ kind: 'stage', unitId: 1, stage: 1, ref: `p${n}`, estMin });

describe('오늘 15분', () => {
  test('재검이 먼저, 그다음이 다음 단', () => {
    const out = planCourseDay({
      budgetMin: 15,
      due: [recheck(2, 200), recheck(3, 100)],
      next: [stage(1), stage(2)],
    });
    expect(out.map((i) => i.kind)).toEqual(['recheck', 'recheck', 'stage', 'stage']);
    // 만기가 오래된 것부터.
    expect((out[0] as RecheckItem).unitId).toBe(3);
  });

  test('예산이 넘치면 다음 단을 뒤에서 자르고 재검은 남긴다', () => {
    const due = [recheck(1, 1), recheck(2, 2), recheck(3, 3), recheck(4, 4), recheck(5, 5)];
    const out = planCourseDay({ budgetMin: 15, due, next: [stage(1, 2.1), stage(2, 9), stage(3, 1)] });
    // 재검 15분 + 예산 17.25 → 첫 판(2.1)까지 들어가고 거기서 멈춘다. 뒤의 작은 판을
    // 앞으로 당기지 않는다 — 단 안의 판 순서가 곧 배우는 순서다.
    expect(out.filter((i) => i.kind === 'recheck')).toHaveLength(5);
    expect(out.filter((i) => i.kind === 'stage').map((i) => (i as StageItem).ref)).toEqual(['p1']);
  });

  test('재검만으로 예산을 넘겨도 재검은 하나도 안 빠진다 — 부채를 미루지 않는다', () => {
    const due = Array.from({ length: 12 }, (_, i) => recheck(i + 1, i));
    const out = planCourseDay({ budgetMin: 15, due, next: [stage(1)] });
    expect(out).toHaveLength(12);
    expect(rechecksOnly(out)).toBe(true);
    expect(coursePlannedMin(out)).toBe(36);
  });

  test('빈 날은 빈 큐다 — 억지로 채우지 않는다', () => {
    expect(planCourseDay({ budgetMin: 15, due: [], next: [] })).toEqual([]);
    expect(rechecksOnly([])).toBe(false);
  });
});

describe('재검 등급', () => {
  test('둘 다 맞음 Good · 예측만 틀림 Hard · 추적 틀림 Again', () => {
    expect(recheckGrade({ traceOk: true, predictOk: true })).toBe(3);
    expect(recheckGrade({ traceOk: true, predictOk: false })).toBe(2);
    expect(recheckGrade({ traceOk: false, predictOk: true })).toBe(1);
    expect(recheckGrade({ traceOk: false, predictOk: false })).toBe(1);
  });

  test('추적을 틀리면 예측을 맞혀도 통과가 아니다 — 부분점수가 없다', () => {
    expect(recheckTally({ traceOk: false, predictOk: true })).toEqual({ asked: 2, correct: 1 });
  });
});

describe('재검 일정 — fsrs.ts 를 그대로 부른다', () => {
  const scheduler = makeScheduler({ paramsId: 1 });
  const fresh = {
    unitId: 1, stageReached: 3, passedAt: 1000, state: 0 as const,
    stability: null, difficulty: null, dueAt: null, lastReviewAt: null, reps: 0, lapses: 0,
  };
  const T = 1_767_225_600_000;
  const DAY = 86_400_000;

  test('첫 재검이 3일쯤 뒤를 잡고, 이어서 간격이 벌어진다', () => {
    const first = scheduleRecheck(scheduler, fresh, 3, T);
    const gap1 = (first.dueAt as number - T) / DAY;
    expect(gap1).toBeGreaterThan(2);

    const next = { ...fresh, ...first, unitId: 1, stageReached: 3, passedAt: 1000 };
    const second = scheduleRecheck(scheduler, next, 3, first.dueAt as number);
    const gap2 = (second.dueAt as number - (first.dueAt as number)) / DAY;
    expect(gap2).toBeGreaterThan(gap1);
    expect(second.elapsedDays).toBeGreaterThanOrEqual(1);
  });

  test('Again 은 간격을 줄이고 lapses 를 센다', () => {
    const good = scheduleRecheck(scheduler, fresh, 3, T);
    const after = { ...fresh, ...good, unitId: 1, stageReached: 3, passedAt: 1000 };
    const again = scheduleRecheck(scheduler, after, 1, good.dueAt as number);
    expect(again.lapses).toBe(1);
    expect((again.dueAt as number) - (good.dueAt as number))
      .toBeLessThan((good.dueAt as number) - T);
  });
});
