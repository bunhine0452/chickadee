/**
 * 오늘의 인쇄 큐 (02 §5). 예산·순서·빈 상태·하루 여러 세션.
 */
import { describe, expect, test } from 'vitest';

import type { ConceptId, Track } from '@chickadee/store-sql';

import {
  BUDGET_SLACK, EST_MIN, LIMIT, estMinFor, fitBudget, order, planSession, plannedMin,
  t1CadenceSays, t1Est, t2CadenceSays, type Candidate, type DueConcept, type PlanInput,
} from './plan.js';

const cid = (s: string): ConceptId => s as ConceptId;

let nextCard = 100;
function candidate(track: Track, role: Candidate['role'], conceptId = 'ts/x', estMin?: number): Candidate {
  nextCard += 1;
  return {
    cardId: nextCard,
    conceptId: cid(conceptId),
    track,
    role,
    estMin: estMin ?? estMinFor(track, role),
  };
}

function input(patch: Partial<PlanInput> = {}): PlanInput {
  return {
    budgetMin: LIMIT.budget_min,
    due: [],
    pickCard: () => null,
    newConcepts: [],
    makeNewCard: () => null,
    newCountToday: 0,
    ...patch,
  };
}

const due = (conceptId: string, r: number, layer = 2): DueConcept => ({
  conceptId: cid(conceptId), layer, track: 't0', r,
});

describe('빈 상태', () => {
  test('만기도 새 후보도 없으면 큐가 비어 있다 — 억지로 채우지 않는다', () => {
    expect(planSession(input())).toEqual([]);
  });

  test('카드를 못 고르면 그 개념은 조용히 빠진다', () => {
    const plan = planSession(input({ due: [due('ts/a', 0.5)], pickCard: () => null }));
    expect(plan).toEqual([]);
  });
});

describe('만기 복습', () => {
  test('R 낮은 순으로 고르고 20개에서 자른다 (부채는 여기서 잘린다)', () => {
    const rows = Array.from({ length: 30 }, (_, i) => due(`ts/c${String(i).padStart(2, '0')}`, i / 100));
    const picked: string[] = [];
    planSession(input({
      // 예산은 넉넉히 — 여기서 보는 것은 20개 컷이다.
      budgetMin: LIMIT.hard_cap_min,
      due: [...rows].reverse(),
      pickCard: (conceptId) => {
        picked.push(conceptId);
        return candidate('t0', 'review', conceptId);
      },
    }));
    expect(picked).toHaveLength(LIMIT.reviews_per_session);
    expect(picked[0]).toBe('ts/c00');
    expect(picked.at(-1)).toBe('ts/c19');
  });

  test('예산을 넘겨도 만기 복습은 빼지 않는다', () => {
    const rows = Array.from({ length: 20 }, (_, i) => due(`ts/c${i}`, i / 100));
    const plan = planSession(input({
      budgetMin: LIMIT.min_budget,
      due: rows,
      pickCard: (conceptId) => candidate('t0', 'review', conceptId),
    }));
    expect(plan).toHaveLength(20);
    // 상수에서 끌어온다 — 값을 박아 두면 코드 창이 넓어질 때마다(D141) 이 줄이 썩는다.
    expect(plannedMin(plan)).toBe(EST_MIN.t0_review * 20);
    // 그리고 그 합이 예산을 넘어도 한 장도 안 뺀다는 것이 이 테스트의 요점이다.
    expect(plannedMin(plan)).toBeGreaterThan(LIMIT.min_budget);
  });
});

describe('새 판', () => {
  test('하루 상한을 세션 합산으로 지킨다', () => {
    const concepts = ['ts/a', 'ts/b', 'ts/c'].map((c, i) => ({ conceptId: cid(c), bestSiteId: i + 1 }));
    const made: string[] = [];
    planSession(input({
      newConcepts: concepts,
      makeNewCard: (conceptId) => {
        made.push(conceptId);
        return candidate('t0', 'new', conceptId);
      },
      newCountToday: 1,
    }));
    expect(made).toEqual(['ts/a']); // 상한 2 − 오늘 이미 1
  });

  test('판을 못 만드는 개념은 건너뛰고 다음 후보를 본다', () => {
    const concepts = ['ts/a', 'ts/b', 'ts/c'].map((c, i) => ({ conceptId: cid(c), bestSiteId: i + 1 }));
    const plan = planSession(input({
      newConcepts: concepts,
      makeNewCard: (conceptId) => (conceptId === 'ts/a' ? null : candidate('t0', 'new', conceptId)),
    }));
    expect(plan.map((p) => p.conceptId)).toEqual(['ts/b', 'ts/c']);
  });
});

describe('예산 맞추기 (§5.3 5번)', () => {
  test('새 T0 → 새 T1 → 새 T2 순으로 뺀다', () => {
    const items = [
      candidate('t0', 'review'),
      candidate('t1', 'new', 'ts/t1', 9),
      candidate('t2', 'new', 'ts/t2', 4),
      candidate('t0', 'new', 'ts/n1'),
      candidate('t0', 'new', 'ts/n2'),
    ];
    // 합 17.5 → 예산 10 이면 새 T0 둘(4), 새 T1(9) 을 빼고 4.5 가 남는다.
    const kept = fitBudget(items, 10);
    expect(kept.map((i) => i.conceptId)).toEqual(['ts/x', 'ts/t2']);
  });

  /**
   * D140 회귀 — 만기가 쌓인 날의 산수가 다시 뒤집히면 여기서 잡힌다.
   *
   * 만기 20건 + 새 T1 + 새 T2 + 새 T0 두 장의 합이 예산(15 × 1.15 = 17.25)을 넘는 날이다.
   * 옛 순서(`new:t0 → new:t2 → new:t1`)는 T0 둘과 T2 를 빼 새 T2 를 없앴다. 새 순서는
   * T0 둘과 T1 을 빼고 T2 를 남긴다. **숫자를 박지 않는다** — `EST_MIN` 은 코드 창이
   * 바뀌면 함께 움직인다(D141). 이 테스트가 재는 것은 합계가 아니라 **빼는 순서**다.
   */
  test('만기 20건인 날에도 새 T2 가 남는다 (D140)', () => {
    const rows = Array.from({ length: 20 }, (_, i) => due(`ts/c${String(i).padStart(2, '0')}`, i / 100));
    const plan = planSession(input({
      budgetMin: LIMIT.budget_min,
      due: rows,
      pickCard: (conceptId) => candidate('t0', 'review', conceptId),
      newConcepts: [
        { conceptId: cid('ts/n1'), bestSiteId: 1 },
        { conceptId: cid('ts/n2'), bestSiteId: 2 },
      ],
      makeNewCard: (conceptId) => candidate('t0', 'new', conceptId),
      t1Slot: candidate('t1', 'new', 'ts/t1', t1Est(20, 1)),
      t2Slot: candidate('t2', 'new', 'arch/placement', EST_MIN.t2_new),
    }));

    // 잘리기 전 합이 실제로 예산을 넘는 상황이어야 이 테스트가 뜻이 있다.
    const before = EST_MIN.t0_review * 20 + t1Est(20, 1) + EST_MIN.t2_new + EST_MIN.t0_new * 2;
    expect(before).toBeGreaterThan(LIMIT.budget_min * BUDGET_SLACK);

    expect(plan.filter((p) => p.track === 't2')).toHaveLength(1);
    expect(plan.filter((p) => p.role === 'new' && p.track === 't0')).toHaveLength(0);
    expect(plan.filter((p) => p.track === 't1')).toHaveLength(0);
    // 만기 20건은 한 장도 안 빠진다.
    expect(plan.filter((p) => p.role === 'review')).toHaveLength(20);
    // 남는 것은 만기 20건 + T2 한 장뿐이다. 값이 아니라 **구성**을 적는다.
    expect(plannedMin(plan)).toBe(EST_MIN.t0_review * 20 + EST_MIN.t2_new);
  });

  test('15 % 는 넘겨 둔다', () => {
    const plan = planSession(input({
      budgetMin: 10,
      due: [due('ts/a', 0.1)],
      pickCard: (conceptId) => candidate('t0', 'review', conceptId, 11),
    }));
    expect(plannedMin(plan)).toBe(11);
    expect(11).toBeLessThanOrEqual(10 * BUDGET_SLACK);
  });

  test('예산은 10~25 로 잘린다', () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ conceptId: cid(`ts/n${i}`), bestSiteId: i }));
    const plan = planSession(input({
      budgetMin: 999,
      newConcepts: many,
      newPerDay: 40,
      makeNewCard: (conceptId) => candidate('t0', 'new', conceptId),
    }));
    expect(plannedMin(plan)).toBeLessThanOrEqual(LIMIT.hard_cap_min * BUDGET_SLACK);
  });
});

describe('순서 (§5.3 6번)', () => {
  test('T0 복습 → T0 새 판 → T1 → T2', () => {
    const items = [
      candidate('t2', 'new', 'ts/t2'),
      candidate('t0', 'new', 'ts/n'),
      candidate('t1', 'review', 'ts/t1'),
      candidate('t0', 'review', 'ts/r'),
    ];
    expect(order(items).map((i) => i.conceptId)).toEqual(['ts/r', 'ts/n', 'ts/t1', 'ts/t2']);
  });

  test('같은 칸 안에서는 만기 급한 순서를 지킨다', () => {
    const plan = planSession(input({
      due: [due('ts/late', 0.9), due('ts/urgent', 0.1)],
      pickCard: (conceptId) => candidate('t0', 'review', conceptId),
    }));
    expect(plan.map((p) => p.conceptId)).toEqual(['ts/urgent', 'ts/late']);
  });
});

describe('T1 · T2 슬롯', () => {
  test('만기 T1 이 이미 있으면 새 T1 을 더 걸지 않는다', () => {
    const plan = planSession(input({
      due: [due('ts/t1', 0.2)],
      pickCard: (conceptId) => candidate('t1', 'review', conceptId, 9),
      t1Slot: candidate('t1', 'new', 'ts/other', 9),
    }));
    expect(plan.filter((p) => p.track === 't1')).toHaveLength(1);
  });

  test('M2 에는 T1·T2 카드가 없으므로 슬롯이 비어 있어도 큐가 선다', () => {
    const plan = planSession(input({
      due: [due('ts/a', 0.2)],
      pickCard: (conceptId) => candidate('t0', 'review', conceptId),
      t1Slot: null,
      t2Slot: null,
    }));
    expect(plan).toHaveLength(1);
  });
});

describe('리듬 (§5.2)', () => {
  test('T1 은 주 2회를 넘기지 않고 최소 2일을 띄운다', () => {
    expect(t1CadenceSays({ recent: 2, lastDay: '2026-08-20', today: '2026-09-03' })).toBe(false);
    expect(t1CadenceSays({ recent: 1, lastDay: '2026-09-02', today: '2026-09-03' })).toBe(false);
    expect(t1CadenceSays({ recent: 1, lastDay: '2026-09-01', today: '2026-09-03' })).toBe(true);
    expect(t1CadenceSays({ recent: 0, lastDay: null, today: '2026-09-03' })).toBe(true);
  });

  test('T2 는 2일 간격', () => {
    expect(t2CadenceSays({ recent: 0, lastDay: '2026-09-02', today: '2026-09-03' })).toBe(false);
    expect(t2CadenceSays({ recent: 0, lastDay: '2026-09-01', today: '2026-09-03' })).toBe(true);
  });
});

describe('예상 시간', () => {
  test('역할이 트랙보다 먼저다 — 다시 찍기·아래층은 0.5·0.7분', () => {
    expect(estMinFor('t0', 'retry')).toBe(EST_MIN.t0_retry);
    expect(estMinFor('t0', 'prereq')).toBe(EST_MIN.t0_prereq);
    expect(estMinFor('t0', 'review')).toBe(EST_MIN.t0_review);
    expect(estMinFor('t0', 'new')).toBe(EST_MIN.t0_new);
    expect(estMinFor('t2', 'new')).toBe(EST_MIN.t2_new);
  });

  test('실측 EMA 가 있으면 그것이 이긴다 — 9분 예상이 19분이면 진행바가 거짓이 된다', () => {
    expect(estMinFor('t1', 'review', 19)).toBe(19);
  });

  test('T1 예상은 7~16분으로 잘린다', () => {
    expect(t1Est(10, 1)).toBe(7);
    expect(t1Est(40, 3)).toBe(16);
    expect(t1Est(30, 2)).toBe(15);
  });
});
