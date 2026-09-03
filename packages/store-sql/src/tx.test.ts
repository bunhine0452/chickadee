import { describe, expect, test } from 'vitest';

import type { ParamsOf } from '@chickadee/ipc-client';

import { statements } from './catalog.js';
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

describe('「판 완료」 (02 §8.1 · D77)', () => {
  const reviewLog = {
    sessionId: 1, sessionItemId: 2, cardId: 3, conceptId: 'ts/a', track: 't0', role: 'review',
    reviewedAt: 1, dayKey: '2026-09-03', grade: 3, ok: 1, dunno: 0, early: 0, elapsedDays: 1,
    scheduledDays: 1, rAtReview: 0.9, layerBefore: 1, layerAfter: 2, sBefore: 1, dBefore: 6,
    sAfter: 3, dAfter: 6, dueAfter: 9, paramsId: 1, durationMs: 100, detailJson: '{}',
  } satisfies ParamsOf<'review.append'>;
  const sessionItem = { id: 2, status: 'done', elapsedS: 12, stateJson: null };
  const mastery = {
    conceptId: 'ts/a', state: 2, stability: 3, difficulty: 6, dueAt: 9, lastReviewAt: 1,
    reps: 2, lapses: 0, layer: 2, dayKey: '2026-09-03', dayStartLayer: 1, dayCeiling: 2,
    firstOkAt: 1, lastOkDay: '2026-09-03', dunnoTotal: 0, transferFrom: null, updatedAt: 1,
  } satisfies ParamsOf<'review.mastery_upsert_last'>;

  test('잇는 UPDATE 가 원장 INSERT 바로 뒤에 온다 — 그 사이의 INSERT 는 rowid 를 바꾼다', () => {
    expect(PLATE_DONE_STEPS.map((s) => s.table)).toStrictEqual([
      'review_log', 'session_item', 'dunno_event', 'mastery', 'lifer',
      'why_answer', 'appeal',
    ]);
    expect(PLATE_DONE_STEPS.filter((s) => s.optional).map((s) => s.table))
      .toStrictEqual(['dunno_event', 'lifer', 'why_answer', 'appeal']);
    // T1 이 더한 뒤의 둘은 `last_insert_rowid()` 를 쓰지 않는다 (D84) — 그래서 자리가
    // 맨 뒤여도 되고, 이의가 몇 건이든 앞의 두 UPDATE 가 흔들리지 않는다.
    const t1 = ['why_answer', 'appeal'];
    expect(PLATE_DONE_STEPS.slice(-2).map((s) => s.table)).toStrictEqual(t1);
  });

  test('T1 은 왜 한 줄과 이의를 같은 tx 에 싣는다 (D84)', () => {
    const ops = buildPlateDoneTx({
      reviewLog,
      sessionItem,
      mastery,
      whyAnswer: {
        sessionItemId: 2, cardId: 1, blockId: 9, lineNo: 8, questionId: 'generic',
        text: '자기 말 한 줄', pick: null, pickOk: null, createdAt: 1,
      },
      appeals: [0, 1].map((i) => ({
        sessionItemId: 2, cardId: 1, track: 't1', lineNo: i + 1,
        originalText: 'a', userText: 'b', normOriginal: 'I', normUser: 'I',
        autoVerdict: 'differ', autoReason: 'TOKEN_COUNT', reasonsJson: '["TOKEN_COUNT"]',
        patternKey: 'k', engineVersion: '1', dictVersion: 'ts@1.0.0', createdAt: 1,
      })),
    }).build();
    expect(ops.map((o) => o.name)).toStrictEqual([
      'review.append', 'session.item_link_last', 'review.mastery_upsert_last',
      'why.insert_for_item', 'appeal.insert_for_item', 'appeal.insert_for_item',
    ]);
  });

  test('가장 짧은 판은 op 세 개다', () => {
    const ops = buildPlateDoneTx({ reviewLog, sessionItem, mastery }).build();
    expect(ops.map((o) => o.name)).toStrictEqual([
      'review.append', 'session.item_link_last', 'review.mastery_upsert_last',
    ]);
  });

  test('LIFER 와 모르겠어요는 있을 때만 붙고 자리가 정해져 있다', () => {
    const ops = buildPlateDoneTx({
      reviewLog,
      sessionItem,
      mastery,
      dunnoEvent: { sessionItemId: 2, maxRung: 2, layerAfter: 0 },
      lifer: {
        conceptId: 'ts/a', cardId: 3, repoId: 1, filePath: 'src/a.ts', lineNo: 4,
        at: 1, shownAt: null,
      },
    }).build();
    expect(ops.map((o) => o.name)).toStrictEqual([
      'review.append',
      'session.item_link_last',
      'review.dunno_link_last',
      'review.mastery_upsert_last',
      'review.lifer_insert',
    ]);
  });

  test('`last_insert_rowid()` 를 쓰는 두 문장은 그것을 실제로 담고 있다', () => {
    expect(statements['session.item_link_last']).toMatch(/last_insert_rowid\(\)/);
    expect(statements['review.dunno_link_last']).toMatch(/last_insert_rowid\(\)/);
    // 뒤에 오는 두 INSERT 는 그 값을 덮어쓴다 — 순서가 계약인 이유다.
    expect(statements['review.mastery_upsert_last']).toMatch(/^INSERT INTO mastery/);
    expect(statements['review.lifer_insert']).toMatch(/^INSERT INTO lifer/);
  });
});
