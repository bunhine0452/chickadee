/**
 * 큐 생성 벤치 — 개념 2,000개 (06 §1.6: 목표 ≤ 50 ms · 차단 150 ms).
 *
 * `planSession` 은 순수 함수다(D72) — SQL 도 IPC 도 없다. 그래서 여기서 재는 것은 정렬 ·
 * 예산 맞추기 · 슬롯 배치의 값이고, 그것이 회귀하면 홈의 「인쇄 시작」이 그만큼 늦어진다.
 *
 * 왜 2,000 인가: 02 §6.2 의 새 개념 후보는 리포 하나의 사전 개념 수만큼 온다. 지금 사전이
 * 언어당 수십이고 여러 언어가 섞이면 수백이다 — 2,000 은 그 위쪽 끝을 넉넉히 넘긴 값이다.
 *
 * `bench/` 는 어떤 tsconfig 의 `include` 에도 없다(생성물·측정 코드라 제품 타입 검사에서
 * 뺀다). 그래서 패키지는 **상대 경로**로 가져온다 — 루트에는 `@chickadee/*` 링크가 없다.
 */
import { bench, describe } from 'vitest';

import { planSession } from '../packages/scheduler/src/plan.js';

import type { Candidate, DueConcept, PlanInput } from '../packages/scheduler/src/plan.js';
import type { ConceptId } from '../packages/store-sql/src/types.js';

const COUNT = 2_000;

const cid = (n: number): ConceptId => `ts.concept.${n}` as ConceptId;

/** 만기 복습 후보. `r`(회상 확률)은 호출자가 계산해 넣는다 — 정렬 키가 그것이다. */
const due: DueConcept[] = Array.from({ length: COUNT }, (_, i) => ({
  conceptId: cid(i),
  layer: (i % 4) + 1,
  track: 't0' as const,
  // 골고루 섞이되 결정론적으로 — 정렬이 실제로 일을 하게 만든다.
  r: ((i * 7919) % 1000) / 1000,
}));

const newConcepts = Array.from({ length: COUNT }, (_, i) => ({
  conceptId: cid(COUNT + i),
  bestSiteId: i + 1,
}));

const card = (conceptId: ConceptId, estMin: number, role: Candidate['role']): Candidate => ({
  cardId: Number(conceptId.split('.').at(-1) ?? 0) + 1,
  conceptId,
  track: 't0',
  role,
  estMin,
});

const input: PlanInput = {
  budgetMin: 15,
  due,
  pickCard: (conceptId) => card(conceptId, 0.5, 'review'),
  newConcepts,
  makeNewCard: (conceptId) => card(conceptId, 2, 'new'),
  newCountToday: 0,
};

describe('큐 생성 (06 §1.6 — 목표 50 ms · 차단 150 ms)', () => {
  bench(`planSession · 개념 ${COUNT}개`, () => {
    planSession(input);
  });

  // 예산이 꽉 찬 쪽도 함께 잰다 — `fitBudget` 의 빼내기가 도는 것은 이 경로다.
  bench(`planSession · 개념 ${COUNT}개 · 예산 25분`, () => {
    planSession({ ...input, budgetMin: 25 });
  });
});
