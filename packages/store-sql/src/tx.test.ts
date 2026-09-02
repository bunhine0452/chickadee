import { describe, expect, test } from 'vitest';

import {
  BatchTooLargeError, MAX_BATCH_OPS, PLATE_DONE_STEPS, buildPlateDoneTx, tx,
} from './tx.js';

const op = (n: number) => ({ key: `k${n}`, valueJson: String(n), updatedAt: 0 });

describe('Tx — store_batch 빌더', () => {
  test('op 을 넣은 순서대로 모은다', () => {
    const t = tx().add('settings.set', op(1)).add('settings.set', op(2));
    expect(t.size).toBe(2);
    expect(t.build()).toStrictEqual([
      { name: 'settings.set', params: op(1) },
      { name: 'settings.set', params: op(2) },
    ]);
  });

  test('빈 tx', () => {
    expect(tx().isEmpty).toBe(true);
    expect(tx().build()).toStrictEqual([]);
  });

  test('build() 는 복사본을 준다 — 부른 뒤 더 넣어도 앞의 배열은 그대로다', () => {
    const t = tx().add('settings.set', op(1));
    const first = t.build();
    t.add('settings.set', op(2));
    expect(first).toHaveLength(1);
    expect(t.build()).toHaveLength(2);
  });

  test(`op ${MAX_BATCH_OPS}개까지는 통과, 넘으면 보내기 전에 던진다`, () => {
    const at = (n: number) => {
      const t = tx();
      for (let i = 0; i < n; i++) t.add('settings.set', op(i));
      return t;
    };
    expect(at(MAX_BATCH_OPS).build()).toHaveLength(MAX_BATCH_OPS);
    expect(() => at(MAX_BATCH_OPS + 1).build()).toThrow(BatchTooLargeError);
    expect(() => at(MAX_BATCH_OPS + 1).build()).toThrow(/chunks\(\)/);
  });

  test('chunks() 는 상한 이하로 자른다', () => {
    const t = tx();
    for (let i = 0; i < 250; i++) t.add('settings.set', op(i));
    const chunks = t.chunks();
    expect(chunks.map((c) => c.length)).toStrictEqual([200, 50]);
    expect(t.chunks(100).map((c) => c.length)).toStrictEqual([100, 100, 50]);
    expect(() => t.chunks(0)).toThrow(RangeError);
    expect(() => t.chunks(MAX_BATCH_OPS + 1)).toThrow(RangeError);
  });
});

describe('「판 완료」 (02 §8.1)', () => {
  test('쓰기 순서가 문서 그대로다', () => {
    expect(PLATE_DONE_STEPS.map((s) => s.table)).toStrictEqual([
      'review_log', 'mastery', 'session_item', 'lifer', 'dunno_event',
    ]);
    expect(PLATE_DONE_STEPS.filter((s) => s.optional).map((s) => s.table)).toStrictEqual(['lifer', 'dunno_event']);
  });

  test('아직 만들 수 없다 — statement 가 카탈로그에 없다 (M2)', () => {
    expect(() => buildPlateDoneTx({ reviewLog: {}, mastery: {}, sessionItem: {} })).toThrow(/M2/);
  });
});
