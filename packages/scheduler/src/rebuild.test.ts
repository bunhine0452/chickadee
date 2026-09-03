/**
 * 원장 재생 = 캐시 검증. **`diffMastery` 가 빈 배열인 것이 M2 의 「끝났다는 증거」** 중 하나다.
 */
import { describe, expect, test } from 'vitest';

import type { ConceptId, DayKey, Mastery } from '@chickadee/store-sql';

import { makeScheduler } from './fsrs.js';
import { applyLog, diffMastery, rebuildMastery, sampleConcepts, type ReplayLog } from './rebuild.js';

const cid = (s: string): ConceptId => s as ConceptId;
const T0 = 1_772_701_200_000; // 2026-09-03 09:00 UTC
const DAY_MS = 86_400_000;
const schedulerFor = () => makeScheduler({ paramsId: 1 });

let nextId = 0;
function log(patch: Partial<ReplayLog> & Pick<ReplayLog, 'conceptId'>): ReplayLog {
  nextId += 1;
  return {
    id: nextId,
    track: 't0',
    reviewedAt: T0,
    dayKey: '2026-09-03' as DayKey,
    grade: 3,
    ok: true,
    dunno: false,
    detail: { track: 't0', sel: 0, answer: 0, kind: 'point' },
    paramsId: 1,
    ...patch,
  };
}

const fresh = (conceptId: string): Mastery => ({
  conceptId: cid(conceptId), state: 0, stability: null, difficulty: null, dueAt: null,
  lastReviewAt: null, reps: 0, lapses: 0, layer: 0, dayKey: null, dayStartLayer: 0,
  dayCeiling: 0, firstOkAt: null, lastOkDay: null, dunnoTotal: 0, transferFrom: null,
  appliedLogId: 0, updatedAt: 0,
});

/** 「판 완료」가 쓰는 것과 같은 함수로 캐시를 만든다 — 그래서 재생과 어긋날 수 없다. */
function cacheOf(logs: readonly ReplayLog[]): Mastery[] {
  const by = new Map<ConceptId, Mastery>();
  for (const l of logs) {
    const prev = by.get(l.conceptId) ?? fresh(l.conceptId);
    by.set(l.conceptId, applyLog(prev, l, schedulerFor()));
  }
  return [...by.values()];
}

describe('재생', () => {
  test('빈 원장이면 빈 결과', () => {
    expect(rebuildMastery([], schedulerFor).size).toBe(0);
    expect(diffMastery([], new Map())).toEqual([]);
  });

  test('만기마다 정답이면 4겹까지 오르고 재생이 캐시와 같다', () => {
    // 흐려짐이 끼지 않게 **만기 당일**에 찍는다 — 만기의 2.4배를 넘겨 찍으면 한 겹 흐려지고
    // 그날의 +1 이 그 손실을 메우는 데 쓰인다(설계대로다).
    const logs: ReplayLog[] = [];
    let state = fresh('ts/a');
    let at = T0;
    for (let i = 0; i < 4; i += 1) {
      const l = log({
        conceptId: cid('ts/a'),
        reviewedAt: at,
        dayKey: new Date(at).toISOString().slice(0, 10) as DayKey,
        grade: i === 0 ? 2 : 3,
      });
      logs.push(l);
      state = applyLog(state, l, schedulerFor());
      at = state.dueAt ?? at;
    }
    expect(state.layer).toBe(4);

    const cached = cacheOf(logs);
    expect(cached[0]?.layer).toBe(4);
    expect(diffMastery(cached, rebuildMastery(logs, schedulerFor))).toEqual([]);
  });

  test('오답·모르겠어요가 섞여도 재생이 같다', () => {
    const logs = [
      log({ conceptId: cid('ts/a'), grade: 2 }),
      log({ conceptId: cid('ts/b'), grade: 1, ok: false }),
      log({ conceptId: cid('ts/b'), grade: 1, ok: true, dunno: true, reviewedAt: T0 + 60_000 }),
      log({ conceptId: cid('ts/a'), grade: 3, reviewedAt: T0 + 4 * DAY_MS, dayKey: '2026-09-07' as DayKey }),
    ];
    const cached = cacheOf(logs);
    expect(diffMastery(cached, rebuildMastery(logs, schedulerFor))).toEqual([]);
    expect(cached.find((m) => m.conceptId === 'ts/b')?.dunnoTotal).toBe(1);
  });

  test('캐시가 한 칸이라도 어긋나면 잡는다', () => {
    const logs = [log({ conceptId: cid('ts/a') })];
    const cached = cacheOf(logs);
    const broken = cached.map((m) => ({ ...m, layer: 3 as const }));
    const diff = diffMastery(broken, rebuildMastery(logs, schedulerFor));
    expect(diff).toHaveLength(1);
    expect(diff[0]?.field).toBe('layer');
  });

  test('로그 없는 새 개념 행은 어긋남이 아니다', () => {
    expect(diffMastery([fresh('ts/never')], new Map())).toEqual([]);
  });

  test('로그가 있는데 재생에 없으면 어긋남이다', () => {
    const stale = { ...fresh('ts/a'), appliedLogId: 9 };
    expect(diffMastery([stale], new Map())).toHaveLength(1);
  });
});

describe('전이 (재생할 수 없는 입력)', () => {
  test('`transfer_from` 은 seeds 로 들어오고 겹 1 에서 시작한다', () => {
    const seeds = new Map([[cid('ts/for-of'), { transferFrom: cid('py/for-in') }]]);
    const replayed = rebuildMastery([], schedulerFor, seeds);
    expect(replayed.get(cid('ts/for-of'))?.layer).toBe(1);
  });

  test('전이 개념의 첫 정답은 2겹이 된다', () => {
    const seeds = new Map([[cid('ts/for-of'), { transferFrom: cid('py/for-in') }]]);
    const logs = [log({ conceptId: cid('ts/for-of'), grade: 3 })];
    const replayed = rebuildMastery(logs, schedulerFor, seeds);
    expect(replayed.get(cid('ts/for-of'))?.layer).toBe(2);
  });

  test('`updatedAt`·`transferFrom` 은 비교에서 뺀다', () => {
    const logs = [log({ conceptId: cid('ts/a') })];
    const cached = cacheOf(logs).map((m) => ({
      ...m, updatedAt: 123, transferFrom: cid('py/x'),
    }));
    expect(diffMastery(cached, rebuildMastery(logs, schedulerFor))).toEqual([]);
  });
});

describe('표본 검증', () => {
  test('최근에 만진 개념부터 고른다', () => {
    const rows = [
      { ...fresh('ts/a'), updatedAt: 10 },
      { ...fresh('ts/b'), updatedAt: 30 },
      { ...fresh('ts/c'), updatedAt: 20 },
    ];
    expect(sampleConcepts(rows, 2)).toEqual(['ts/b', 'ts/c']);
  });
});
