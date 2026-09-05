/**
 * 코스 문항 생성 진입점 (D164). 단 하나를 주면 그 단의 유형들을 돌려 판을 굽는다.
 *
 * 1단은 `twin` 만 새로 굽는다 — `point`·`blank` 는 예전 T0 카드 그대로이고(D164 ③), 그 개념
 * 목록은 `conceptsOnPath` 가 준다. 5단은 문항은 내되 통과 게이트가 아니다(README §3) — 그 판단은
 * 여기가 아니라 진도(D165)가 한다.
 */
import type { StageNo } from '@chickadee/store-sql';

import { buildOrders } from './order.js';
import { buildContracts, buildCuts, buildOrigins, buildReorders, buildTwins, conceptsOnPath } from './stage-choice.js';
import { buildReimpls, buildRepairs } from './stage-edit.js';
import { buildCallers, buildExecs, buildHops } from './stage-trace.js';
import { buildTraces } from './trace-table.js';
import type { StageCard, StageDrop, StageRequest, StageResult, StageType } from './stage-types.js';

type Builder = (req: StageRequest) => { cards: StageCard[]; drops: StageDrop[] };

/** 단마다 도는 생성기 — 표의 순서가 판의 순서다 (`exercises.md` §2). */
const BUILDERS: Readonly<Record<StageNo, readonly Builder[]>> = {
  1: [buildTwins],
  2: [buildExecs, buildHops, buildOrigins, buildCallers, buildTraces],
  3: [buildCuts, buildReorders, buildContracts],
  4: [buildRepairs],
  5: [buildReimpls, buildOrders],
};

/** 그 단이 낼 수 있는 유형 — 화면의 「이 단에 없는 문항」 목록과 진도의 「4단 문항이 있는가」가 본다. */
export const TYPES_OF_STAGE: Readonly<Record<StageNo, readonly StageType[]>> = {
  1: ['point', 'twin', 'blank'],
  2: ['exec', 'hop', 'origin', 'caller', 'trace-table'],
  3: ['cut', 'reorder', 'contract'],
  4: ['patch-line', 'patch-place', 'rollback'],
  5: ['reimpl-spec', 'reimpl-layer', 'handoff', 'order'],
};

export function buildStageCards(req: StageRequest, stageNo: StageNo): StageResult {
  const cards: StageCard[] = [];
  const dropped: StageDrop[] = [];
  for (const build of BUILDERS[stageNo]) {
    const out = build(req);
    cards.push(...out.cards);
    dropped.push(...out.drops);
  }
  return { stageNo, cards, dropped };
}

/** 다섯 단 전부. 챕터를 처음 열 때 한 번에 굽는다. */
export function buildCourseCards(req: StageRequest): StageResult[] {
  return ([1, 2, 3, 4, 5] as const).map((n) => buildStageCards(req, n));
}

export { conceptsOnPath };
