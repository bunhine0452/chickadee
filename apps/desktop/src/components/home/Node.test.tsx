// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { HomeNode } from '../../screens/home/data';
import { Node } from './Node';

afterEach(cleanup);

const CURRENT: HomeNode = {
  conceptId: 'ts/optional-chaining',
  track: 't0',
  nameKo: '옵셔널 체이닝',
  token: '?.',
  layer: 1,
  shownLayer: 1,
  state: 'current',
  dueAt: null,
};

const LOCKED: HomeNode = {
  conceptId: 'arch/auth-boundary',
  track: 't2',
  nameKo: 'auth 경계',
  token: null,
  layer: 0,
  shownLayer: 0,
  state: 'locked',
  dueAt: null,
};

describe('Node', () => {
  it('이름·트랙·겹·상태를 라벨 한 줄로 말한다', () => {
    render(<Node node={CURRENT} index={0} expanded={false} onOpen={() => undefined} />);
    const button = screen.getByRole('button', {
      name: '옵셔널 체이닝. T0 문법. 1단계 · 처음. 지금 여기.',
    });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('data-state')).toBe('current');
  });

  it('Enter 로 상세를 연다', async () => {
    const onOpen = vi.fn();
    const user = userEvent.setup();
    render(<Node node={CURRENT} index={0} expanded={false} onOpen={onOpen} />);

    await user.tab();
    expect(screen.getByRole('button', { name: /옵셔널 체이닝/ })).toBe(document.activeElement);
    await user.keyboard('{Enter}');

    expect(onOpen).toHaveBeenCalledWith('ts/optional-chaining');
  });

  it('잠긴 스티커는 aria-disabled 지만 포커스는 받고 흔들지 않는다', async () => {
    const onOpen = vi.fn();
    const user = userEvent.setup();
    render(<Node node={LOCKED} index={1} expanded={false} onOpen={onOpen} />);

    const button = screen.getByRole('button', { name: /auth 경계/ });
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(button.className).toBe('node');

    await user.tab();
    expect(button).toBe(document.activeElement);
    await user.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalledWith('arch/auth-boundary');
  });

  it('지터는 개념 id 로 정해져 다시 그려도 그대로다', () => {
    const { container, rerender } = render(
      <Node node={CURRENT} index={0} expanded={false} onOpen={() => undefined} />,
    );
    const before = container.querySelector<HTMLElement>('button.node')?.getAttribute('style');
    rerender(<Node node={CURRENT} index={0} expanded onOpen={() => undefined} />);
    const after = container.querySelector<HTMLElement>('button.node')?.getAttribute('style');
    expect(after).toBe(before);
  });
});
