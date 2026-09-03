/**
 * FSRS 어댑터 (02 §3.2·§3.4·§3.5). 궤적 검산이 D73 의 근거이고, 이 파일이 그 수치를 잠근다 —
 * `ts-fsrs` 를 올리다 망각 곡선이 FSRS-6 로 바뀌면 여기가 먼저 빨개진다.
 */
import { describe, expect, test } from 'vitest';

import type { Mastery } from '@chickadee/store-sql';

import {
  DEFAULT_RETENTION, FSRS5_DEFAULT_W, FSRS5_PARAM_COUNT, fadeOf, gradeFor, makeScheduler,
  okFor, shownLayer, toLibraryParams,
} from './fsrs.js';

const DAY_MS = 86_400_000;
const T0 = 1_772_701_200_000; // 2026-09-03 09:00 UTC

type Card = Pick<Mastery, 'state' | 'stability' | 'difficulty' | 'dueAt' | 'lastReviewAt' | 'reps' | 'lapses'>;

const fresh = (): Card => ({
  state: 0, stability: null, difficulty: null, dueAt: null, lastReviewAt: null, reps: 0, lapses: 0,
});

const sched = () => makeScheduler({ paramsId: 1 });

describe('파라미터', () => {
  test('02 §3.6 은 19개를 저장하고 경계에서만 21개로 늘린다 (D73)', () => {
    expect(FSRS5_DEFAULT_W).toHaveLength(FSRS5_PARAM_COUNT);
    const w = toLibraryParams(FSRS5_DEFAULT_W);
    expect(w).toHaveLength(21);
    // `w[20]` 이 FSRS-5 의 decay 다. 이 값이 아니면 같은 S 에 간격이 두 배가 된다.
    expect(w[20]).toBe(0.5);
  });

  test('21개를 그대로 넘기면 건드리지 않는다', () => {
    const already = [...FSRS5_DEFAULT_W, 0, 0.5];
    expect(toLibraryParams(already)).toEqual(already);
  });
});

describe('궤적 (02 §3.5 · D73)', () => {
  test('Hard → Good → Good → Good 를 만기 당일에 찍으면 1.18 · 3.45 · 9.42 · 25.24', () => {
    const s = sched();
    let card = fresh();
    let now = T0;
    const stability: number[] = [];
    const intervals: number[] = [];
    for (const grade of [2, 3, 3, 3] as const) {
      const r = s.review(card, grade, now);
      stability.push(Number(r.stability.toFixed(2)));
      intervals.push(Math.round((r.dueAt - now) / DAY_MS));
      card = { ...card, ...r };
      now = r.dueAt;
    }
    expect(stability).toEqual([1.18, 3.45, 9.42, 25.24]);
    expect(intervals).toEqual([1, 3, 9, 25]);
  });

  test('첫 정답의 R 은 null 이고 두 번째부터 채워진다 (원장 `r_at_review`)', () => {
    const s = sched();
    const first = s.review(fresh(), 2, T0);
    expect(first.rAtReview).toBeNull();
    expect(first.elapsedDays).toBe(0);

    const second = s.review({ ...fresh(), ...first }, 3, first.dueAt);
    expect(second.rAtReview).toBeCloseTo(0.9, 1);
    expect(second.elapsedDays).toBeCloseTo(1, 5);
  });

  test('오답은 S 를 떨어뜨리고 같은 날 다시 찍기 정답이 ×1.4 를 곱한다 (02 §4)', () => {
    const s = sched();
    let card = fresh();
    let now = T0;
    for (const grade of [2, 3, 3] as const) {
      const r = s.review(card, grade, now);
      card = { ...card, ...r };
      now = r.dueAt;
    }
    expect(card.stability).toBeCloseTo(9.42, 1);

    const lapsed = s.review(card, 1, now);
    expect(lapsed.stability).toBeLessThan(card.stability ?? 0);
    expect(lapsed.lapses).toBe(1);

    const retry = s.review({ ...card, ...lapsed }, 3, now + 3_600_000);
    expect(retry.stability / lapsed.stability).toBeCloseTo(1.4, 1);

    const retryWrong = s.review({ ...card, ...lapsed }, 1, now + 3_600_000);
    expect(retryWrong.stability / lapsed.stability).toBeCloseTo(0.5, 1);
  });

  test('학습 단계가 비어 있어 판이 몇 분 뒤로 잡히지 않는다 (D73)', () => {
    const first = sched().review(fresh(), 3, T0);
    expect(first.dueAt - T0).toBeGreaterThanOrEqual(DAY_MS);
  });

  test('결정적이다 — 같은 입력이면 같은 due (fuzz 꺼짐, 06 §1.3)', () => {
    const a = sched().review(fresh(), 3, T0);
    const b = sched().review(fresh(), 3, T0);
    expect(a).toEqual(b);
  });
});

describe('retrievability', () => {
  test('새 개념은 0, 만기 시점은 0.9 근처', () => {
    const s = sched();
    expect(s.retrievability(fresh(), T0)).toBe(0);
    const r = s.review(fresh(), 3, T0);
    const card = { ...fresh(), ...r };
    expect(s.retrievability(card, T0)).toBeCloseTo(1, 1);
    expect(s.retrievability(card, r.dueAt)).toBeCloseTo(0.9, 1);
  });
});

describe('등급 매핑 (02 §3.2)', () => {
  const base = { track: 't0' as const, ok: true, dunno: false, fresh: false, transfer: false, retry: false };

  test('T0 첫 정답은 Hard, 전이 개념이면 Good', () => {
    expect(gradeFor({ ...base, fresh: true })).toBe(2);
    expect(gradeFor({ ...base, fresh: true, transfer: true })).toBe(3);
  });

  test('T0 복습 정답·다시 찍기 정답은 Good, 오답은 Again', () => {
    expect(gradeFor(base)).toBe(3);
    expect(gradeFor({ ...base, retry: true })).toBe(3);
    expect(gradeFor({ ...base, ok: false })).toBe(1);
  });

  test('모르겠어요는 답을 맞혔어도 Again 이고 `ok` 는 원래 값이다', () => {
    expect(gradeFor({ ...base, dunno: true })).toBe(1);
    expect(gradeFor({ ...base, fresh: true, dunno: true })).toBe(1);
    expect(okFor({ track: 't0', ok: true })).toBe(true);
  });

  test('T1 — 85 % 이상 Good, 잠깐 보기 3회면 Hard, 65~85 는 Hard, 그 아래 Again', () => {
    const t1 = { ...base, track: 't1' as const };
    expect(gradeFor({ ...t1, pct: 90 })).toBe(3);
    expect(gradeFor({ ...t1, pct: 90, assists: 3 })).toBe(2);
    expect(gradeFor({ ...t1, pct: 90, downgraded: true })).toBe(2);
    expect(gradeFor({ ...t1, pct: 70 })).toBe(2);
    expect(gradeFor({ ...t1, pct: 60 })).toBe(1);
  });

  test('T2 — 85 % 이상 Good, 힌트 2회면 Hard', () => {
    const t2 = { ...base, track: 't2' as const };
    expect(gradeFor({ ...t2, pct: 90 })).toBe(3);
    expect(gradeFor({ ...t2, pct: 90, assists: 2 })).toBe(2);
    expect(gradeFor({ ...t2, pct: 70 })).toBe(2);
    expect(gradeFor({ ...t2, pct: 64 })).toBe(1);
  });

  test('T1·T2 의 `ok` 는 85 % 가 기준이다', () => {
    expect(okFor({ track: 't1', ok: false, pct: 85 })).toBe(true);
    expect(okFor({ track: 't2', ok: true, pct: 84 })).toBe(false);
  });
});

describe('흐려짐 (02 §3.4)', () => {
  test('R 0.8 이상은 0겹, 0.6 이상은 1겹, 그 아래는 2겹', () => {
    expect(fadeOf(0.95)).toBe(0);
    expect(fadeOf(0.8)).toBe(0);
    expect(fadeOf(0.7)).toBe(1);
    expect(fadeOf(0.6)).toBe(1);
    expect(fadeOf(0.3)).toBe(2);
  });

  test('표시 겹은 0 아래로 내려가지 않는다', () => {
    expect(shownLayer(4, 0.3)).toBe(2);
    expect(shownLayer(1, 0.3)).toBe(0);
  });

  test('만기의 약 2.4배가 지나면 한 겹 흐려진다 (4겹 S=30 → 72일)', () => {
    const s = makeScheduler({ paramsId: 1, requestRetention: DEFAULT_RETENTION });
    const card = {
      state: 2 as const, stability: 30, difficulty: 6.4, dueAt: T0 + 30 * DAY_MS,
      lastReviewAt: T0, reps: 4, lapses: 0,
    };
    expect(fadeOf(s.retrievability(card, T0 + 30 * DAY_MS))).toBe(0);
    expect(fadeOf(s.retrievability(card, T0 + 72 * DAY_MS))).toBe(1);
    expect(fadeOf(s.retrievability(card, T0 + 228 * DAY_MS))).toBe(2);
  });
});
