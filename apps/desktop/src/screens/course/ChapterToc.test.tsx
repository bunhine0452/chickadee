// @vitest-environment jsdom
import { t } from '@chickadee/i18n';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { ChapterToc, GRAD_ID, statusOf } from './ChapterToc.js';
import type { ChapterView } from './data.js';

const chapter = (over: Partial<ChapterView> & { unitId: number; name: string }): ChapterView => ({
  orderIdx: over.unitId, origin: 'entry',
  row: {
    unitId: over.unitId, stageReached: 0, passedAt: null, state: 0, stability: null, difficulty: null,
    dueAt: null, lastReviewAt: null, reps: 0, lapses: 0,
  },
  deferredDay: null, counts: { 1: 0, 2: 1, 3: 1, 4: 0, 5: 0 },
  vocab: { total: 3, inked: 1, zero: [] }, hasRepair: false, locked: false,
  ...over,
});

afterEach(cleanup);

describe('코스 목차 (D171 ①)', () => {
  test('진도는 단으로 적고, 통과·재검·잠김이 단보다 앞선다', () => {
    const passed = chapter({ unitId: 1, name: '로그인', row: { unitId: 1, stageReached: 3, passedAt: 1, state: 2, stability: 1, difficulty: 5, dueAt: 9, lastReviewAt: 1, reps: 1, lapses: 0 } });
    const mid = chapter({ unitId: 2, name: '이미지', row: { ...chapter({ unitId: 2, name: '' }).row, stageReached: 2 } });
    const locked = chapter({ unitId: 3, name: '랭킹', locked: true });
    const due = new Set([1]);
    expect(statusOf(passed, due)).toBe(t('chapter.dueNow'));
    expect(statusOf(passed, new Set())).toBe(t('chapter.passed'));
    expect(statusOf(mid, new Set())).toBe(t('chapter.stage2'));
    expect(statusOf(locked, new Set())).toBe(t('chapter.locked'));
    expect(statusOf(chapter({ unitId: 4, name: 'x', deferredDay: '2026-09-05' }), new Set(), '2026-09-05')).toBe(t('chapter.deferred'));
  });

  test('막간·부록은 따로 서고, 졸업 행은 죽은 갈래 수를 낸다', () => {
    const onSelect = vi.fn();
    render(
      <ChapterToc
        chapters={[chapter({ unitId: 1, name: '로그인' }), chapter({ unitId: 9, name: '부록 α', origin: 'dir' })]}
        selected={1}
        todayUnitId={1}
        due={new Set()}
        dead={[{ id: 1, kind: 'uncalled-route', file_id: 1, path: 'a.js', line: null, label: 'GET /x' }]}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText(t('chapter.count', { done: '0', total: '1' }))).toBeTruthy();
    expect(screen.getByText(t('chapter.secExtra'))).toBeTruthy();
    fireEvent.click(screen.getByText(t('chapter.grad')));
    expect(onSelect).toHaveBeenCalledWith(GRAD_ID);
    expect(screen.getByRole('button', { name: /로그인/ }).getAttribute('aria-current')).toBe('true');
  });
});
