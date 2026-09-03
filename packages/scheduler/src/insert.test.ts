/**
 * 세션 중 삽입과 복구 (02 §5.5·§5.6).
 */
import { describe, expect, test } from 'vitest';

import type { DayKey, SessionItem } from '@chickadee/store-sql';

import { EST_MIN, LIMIT } from './plan.js';
import {
  manualAt, prereqAt, resumeOf, retryAt, shouldInsertPrereq, shouldInsertRetry,
} from './insert.js';

const TODAY = '2026-09-03' as DayKey;
const YESTERDAY = '2026-09-02' as DayKey;

describe('다시 찍기 자리', () => {
  test('현재 +3 뒤', () => {
    expect(retryAt(10, 2, 55)).toEqual({
      pos: 5, role: 'retry', estMin: EST_MIN.t0_retry, parentItemId: 55,
    });
    expect(LIMIT.retry_offset).toBe(3);
  });

  test('큐 끝을 넘으면 끝에 붙는다', () => {
    expect(retryAt(4, 3, 1).pos).toBe(4);
  });

  test('판당 한 번 — 같은 카드의 미완 retry 가 뒤에 있으면 안 넣는다', () => {
    expect(shouldInsertRetry({ role: 'review', pendingRetry: false })).toBe(true);
    expect(shouldInsertRetry({ role: 'review', pendingRetry: true })).toBe(false);
  });

  test('다시 찍기 판과 아래층 판은 또 다시 찍기를 만들지 않는다', () => {
    expect(shouldInsertRetry({ role: 'retry', pendingRetry: false })).toBe(false);
    expect(shouldInsertRetry({ role: 'prereq', pendingRetry: false })).toBe(false);
  });
});

describe('아래층 자리', () => {
  test('현재 자리 앞 — 부모는 뒤로 밀린다', () => {
    expect(prereqAt(3, 9)).toEqual({
      pos: 3, role: 'prereq', estMin: EST_MIN.t0_prereq, parentItemId: 9,
    });
  });

  test('중첩 점프는 없다 (깊이 1)', () => {
    expect(shouldInsertPrereq('review')).toBe(true);
    expect(shouldInsertPrereq('prereq')).toBe(false);
  });
});

describe('홈에서 밀어 넣기', () => {
  test('「이 판 찍기」·「판 만들기」는 현재 뒤', () => {
    expect(manualAt(2, 'manual', 0.5).pos).toBe(3);
    expect(manualAt(0, 'gap', 2).role).toBe('gap');
  });
});

describe('중단 · 복구 (§5.6)', () => {
  const item = (pos: number, status: SessionItem['status']): Pick<SessionItem, 'pos' | 'status'> =>
    ({ pos, status });

  test('세션이 없으면 새로 짠다', () => {
    expect(resumeOf(null, [], TODAY)).toEqual({ kind: 'fresh' });
  });

  test('같은 날이면 첫 미완 판부터 이어 찍는다', () => {
    const open = { id: 7, dayKey: TODAY, status: 'paused' as const };
    const items = [item(0, 'done'), item(1, 'done'), item(2, 'pending'), item(3, 'pending')];
    expect(resumeOf(open, items, TODAY)).toEqual({ kind: 'resume', sessionId: 7, pos: 2 });
  });

  test('날이 바뀌면 버린다 — 어제 큐 + 오늘 만기는 25분을 넘긴다', () => {
    const open = { id: 7, dayKey: YESTERDAY, status: 'paused' as const };
    expect(resumeOf(open, [item(0, 'pending')], TODAY)).toEqual({ kind: 'abandon', sessionId: 7 });
  });

  test('미완 판이 하나도 없으면 그 세션은 닫는다', () => {
    const open = { id: 7, dayKey: TODAY, status: 'active' as const };
    expect(resumeOf(open, [item(0, 'done')], TODAY)).toEqual({ kind: 'abandon', sessionId: 7 });
  });

  test('자리 순서가 뒤섞여 와도 가장 앞의 미완을 고른다', () => {
    const open = { id: 7, dayKey: TODAY, status: 'paused' as const };
    const items = [item(5, 'pending'), item(2, 'pending'), item(0, 'done')];
    expect(resumeOf(open, items, TODAY)).toEqual({ kind: 'resume', sessionId: 7, pos: 2 });
  });
});
