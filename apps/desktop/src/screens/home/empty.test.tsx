// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FirstRun } from './empty';

afterEach(cleanup);

describe('FirstRun', () => {
  it('로고 · 한 문단 · 버튼 하나뿐이다', () => {
    render(<FirstRun onPick={() => undefined} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Chickadee');
    expect(screen.getByText(/리포에는\s*아무것도 쓰지 않습니다/)).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('「리포 등록」이 폴더 고르기를 부른다', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    render(<FirstRun onPick={onPick} />);

    await user.click(screen.getByRole('button', { name: '리포 등록' }));
    expect(onPick).toHaveBeenCalledTimes(1);
  });
});
