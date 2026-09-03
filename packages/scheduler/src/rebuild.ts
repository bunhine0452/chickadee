/**
 * `rebuildMastery()` — 원장 재생 = 캐시 검증 (02 §3.6 「모든 로그 행이 `params_id` 를 가지므로
 * 파라미터를 바꿔도 재생은 결정적이다」).
 *
 * `mastery` 는 파생 캐시다. 이 함수가 `review_log` 만으로 같은 값을 다시 만들어내지 못하면
 * 「판 완료」 트랜잭션 어딘가가 원장에 안 남긴 것이 있다는 뜻이고, 그때부터 홈의 겹은
 * 아무도 설명할 수 없는 숫자가 된다.
 *
 * **재생할 수 없는 것이 둘 있다** — `transfer_from`(로그 없는 첫 노출, 02 §4 첫 줄)과
 * `updated_at`(쓴 시각). 앞의 것은 `seeds` 로 받아 넣고, 뒤의 것은 비교에서 뺀다.
 */
import type { ConceptId, Layer, Mastery, ReviewLog } from '@chickadee/store-sql';

import { type Scheduler, shownLayerOf, type UsedGrade } from './fsrs.js';
import { step, type LayerState } from './reducer.js';

/** 로그 재생에 필요한 열만. `review.all_logs` 한 행에서 그대로 온다. */
export type ReplayLog = Pick<
  ReviewLog,
  'id' | 'conceptId' | 'track' | 'reviewedAt' | 'dayKey' | 'grade' | 'ok' | 'dunno' | 'detail' | 'paramsId'
>;

/** 로그가 설명하지 않는 초기 상태 (전이, 02 §6.3). */
export interface Seed {
  transferFrom: ConceptId | null;
}

const emptyMastery = (conceptId: ConceptId, seed: Seed | undefined): Mastery => ({
  conceptId,
  state: 0,
  stability: null,
  difficulty: null,
  dueAt: null,
  lastReviewAt: null,
  reps: 0,
  lapses: 0,
  // 전이는 첫 노출에 1겹으로 시작한다 — 로그가 아니라 사전 관계가 만든 겹이다.
  layer: (seed?.transferFrom ? 1 : 0) as Layer,
  dayKey: null,
  dayStartLayer: 0,
  dayCeiling: 0,
  firstOkAt: null,
  lastOkDay: null,
  dunnoTotal: 0,
  transferFrom: seed?.transferFrom ?? null,
  appliedLogId: 0,
  updatedAt: 0,
});

/** T1 은 3단계(백지)를 통과해야만 4겹이다 (02 §4). 다른 트랙은 상한이 없다. */
function ceilingCapOf(log: ReplayLog): Layer {
  if (log.track !== 't1') return 4;
  const detail = log.detail;
  const stage = detail.track === 't1' ? detail.stageBefore : 1;
  return stage === 3 ? 4 : 3;
}

const outcomeOf = (log: ReplayLog): 'ok' | 'wrong' | 'dunno' =>
  log.dunno ? 'dunno' : log.ok ? 'ok' : 'wrong';

/**
 * 원장 한 행을 겹·FSRS 에 반영한다. 「판 완료」 트랜잭션과 재생이 **같은 함수**를 부르게
 * 하려고 따로 뽑았다 — 두 벌로 쓰면 언젠가 갈라진다.
 */
export function applyLog(prev: Mastery, log: ReplayLog, sched: Scheduler): Mastery {
  const shown = shownLayerOf(prev, sched, log.reviewedAt);
  const move = step(
    prev as LayerState,
    outcomeOf(log),
    log.reviewedAt,
    log.dayKey,
    shown,
    ceilingCapOf(log),
  );
  const fsrs = sched.review(prev, log.grade as UsedGrade, log.reviewedAt);
  return {
    ...prev,
    ...move.next,
    state: fsrs.state,
    stability: fsrs.stability,
    difficulty: fsrs.difficulty,
    dueAt: fsrs.dueAt,
    lastReviewAt: fsrs.lastReviewAt,
    reps: fsrs.reps,
    lapses: fsrs.lapses,
    layer: move.after,
    firstOkAt: prev.firstOkAt ?? (move.firstOk ? log.reviewedAt : null),
    lastOkDay: log.ok && !log.dunno ? log.dayKey : prev.lastOkDay,
    dunnoTotal: prev.dunnoTotal + (log.dunno ? 1 : 0),
    appliedLogId: log.id,
    updatedAt: log.reviewedAt,
  };
}

/**
 * 원장 전체를 `id` 순으로 다시 흘린다. 로그는 이미 `id` 순으로 와야 한다
 * (`review.all_logs` 가 `ORDER BY id`).
 */
export function rebuildMastery(
  logs: readonly ReplayLog[],
  schedulerFor: (paramsId: number) => Scheduler,
  seeds: ReadonlyMap<ConceptId, Seed> = new Map(),
): Map<ConceptId, Mastery> {
  const out = new Map<ConceptId, Mastery>();
  for (const log of logs) {
    const prev = out.get(log.conceptId) ?? emptyMastery(log.conceptId, seeds.get(log.conceptId));
    out.set(log.conceptId, applyLog(prev, log, schedulerFor(log.paramsId)));
  }
  // 로그가 하나도 없는 전이 개념도 캐시에는 행이 있다.
  for (const [conceptId, seed] of seeds) {
    if (!out.has(conceptId) && seed.transferFrom !== null) {
      out.set(conceptId, emptyMastery(conceptId, seed));
    }
  }
  return out;
}

/** 비교에서 빼는 열. 재생이 만들 수 없거나(쓴 시각) 재생의 입력인 것(전이). */
export const UNREPLAYABLE = ['updatedAt', 'transferFrom'] as const;

export interface MasteryDiff {
  conceptId: ConceptId;
  field: string;
  cached: unknown;
  replayed: unknown;
}

const EPSILON = 1e-9;

const same = (a: unknown, b: unknown): boolean =>
  typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < EPSILON : a === b;

/**
 * 캐시와 재생 결과를 견준다. **빈 배열이 M2 의 「끝났다는 증거」** 중 하나다
 * (`rebuild_mastery == mastery`).
 */
export function diffMastery(
  cached: readonly Mastery[],
  replayed: ReadonlyMap<ConceptId, Mastery>,
): MasteryDiff[] {
  const out: MasteryDiff[] = [];
  const skip = new Set<string>(UNREPLAYABLE);
  const seen = new Set<ConceptId>();

  for (const row of cached) {
    seen.add(row.conceptId);
    const mine = replayed.get(row.conceptId);
    if (!mine) {
      // 로그도 전이도 없는데 행이 있다 = 새 개념 행(state 0). 그것만 허용한다.
      if (row.appliedLogId !== 0) {
        out.push({ conceptId: row.conceptId, field: '(missing)', cached: row.appliedLogId, replayed: null });
      }
      continue;
    }
    for (const key of Object.keys(row) as (keyof Mastery)[]) {
      if (skip.has(key)) continue;
      if (!same(row[key], mine[key])) {
        out.push({ conceptId: row.conceptId, field: key, cached: row[key], replayed: mine[key] });
      }
    }
  }
  for (const [conceptId, mine] of replayed) {
    if (!seen.has(conceptId)) {
      out.push({ conceptId, field: '(absent from cache)', cached: null, replayed: mine.appliedLogId });
    }
  }
  return out;
}

/** 기동 시 표본 검증 — 전량은 비싸므로 최근 `n` 개념만 본다 (02 체크리스트). */
export function sampleConcepts(cached: readonly Mastery[], n: number): ConceptId[] {
  return [...cached]
    .sort((a, b) => b.updatedAt - a.updatedAt || a.conceptId.localeCompare(b.conceptId))
    .slice(0, n)
    .map((m) => m.conceptId);
}
