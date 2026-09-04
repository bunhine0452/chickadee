// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { HomeSheet } from '../../screens/home/data';
import { SheetIndex } from './SheetIndex';

afterEach(cleanup);

const sheet = (unitId: number, name: string, done: number, all: number): HomeSheet => ({
  unitId,
  name,
  rootPath: `src/${name}`,
  files: 3,
  avgLayer: 2,
  state: done === all ? 'done' : 'current',
  nodes: Array.from({ length: all }, (_, i) => ({
    conceptId: `c${unitId}-${i}`,
    track: 't0' as const,
    nameKo: `개념 ${i}`,
    token: null,
    layer: 1 as const,
    shownLayer: 1 as const,
    state: i < done ? ('done' as const) : ('open' as const),
    dueAt: null,
  })),
});

const SHEETS = [sheet(1, '장바구니', 2, 2), sheet(2, '로그인', 1, 4), sheet(3, '결제', 0, 3)];

describe('SheetIndex', () => {
  it('대지가 몇 장이든 칩 한 줄로 서고 고른 것만 selected 다', () => {
    render(<SheetIndex sheets={SHEETS} selected={2} onSelect={() => undefined} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('true');
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('false');
    // 칩 안의 이름은 잘릴 수 있으므로 읽히는 이름이 진행까지 든다.
    expect(tabs[1]?.getAttribute('aria-label')).toContain('4개 중 1개 찍음');
  });

  it('탭 순서에는 고른 칩 하나만 있다 (roving tabindex)', () => {
    render(<SheetIndex sheets={SHEETS} selected={3} onSelect={() => undefined} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((el) => el.getAttribute('tabindex'))).toEqual(['-1', '-1', '0']);
  });

  it('← → 로 옮기면 그 자리에서 걸리고 양 끝에서 돈다', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<SheetIndex sheets={SHEETS} selected={1} onSelect={onSelect} />);

    screen.getAllByRole('tab')[0]?.focus();
    await user.keyboard('{ArrowRight}');
    expect(onSelect).toHaveBeenLastCalledWith(2);

    await user.keyboard('{ArrowLeft}');
    // 첫 칩에서 왼쪽이면 마지막으로 돈다 — `selected` 는 밖이 들고 있으므로 아직 1 이다.
    expect(onSelect).toHaveBeenLastCalledWith(3);

    await user.keyboard('{End}');
    expect(onSelect).toHaveBeenLastCalledWith(3);
    await user.keyboard('{Home}');
    expect(onSelect).toHaveBeenLastCalledWith(1);
  });

  it('대지가 0장이면 띠 자체를 내지 않는다', () => {
    const { container } = render(<SheetIndex sheets={[]} selected={null} onSelect={() => undefined} />);
    expect(container.querySelector('.sheet-index')).toBeNull();
  });
});
