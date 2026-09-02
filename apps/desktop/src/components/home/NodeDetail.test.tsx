// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { HomeNode } from '../../screens/home/data';
import { NodeDetail } from './NodeDetail';

afterEach(cleanup);

const NOW = Date.UTC(2026, 8, 3, 9, 0, 0);
const DAY = 86_400_000;

const NODE: HomeNode = {
  conceptId: 'ts/optional-chaining',
  track: 't0',
  nameKo: '옵셔널 체이닝',
  token: '?.',
  layer: 2,
  shownLayer: 2,
  state: 'current',
  dueAt: NOW + 3 * DAY,
};

const LOCKED: HomeNode = { ...NODE, conceptId: 'arch/auth', nameKo: 'auth 경계', state: 'locked' };

describe('NodeDetail', () => {
  it('열리면 포커스가 상세로 온다', () => {
    render(<NodeDetail node={NODE} onClose={() => undefined} now={NOW} />);
    const region = screen.getByRole('region', { name: '옵셔널 체이닝 상세' });
    expect(region).toBe(document.activeElement);
  });

  it('겹과 다음 인쇄를 평문으로 적는다', () => {
    render(<NodeDetail node={NODE} onClose={() => undefined} now={NOW} />);
    expect(screen.getByText('잉크 2겹 / 4 · 먹판 · 윤곽이 잡힘')).toBeTruthy();
    expect(screen.getByText(/다음 인쇄는 3일 뒤입니다/)).toBeTruthy();
  });

  it('Esc 로 닫는다', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<NodeDetail node={NODE} onClose={onClose} now={NOW} />);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('「닫기」 버튼도 같은 일을 한다', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<NodeDetail node={NODE} onClose={onClose} now={NOW} />);

    await user.click(screen.getByRole('button', { name: /닫기/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('잠긴 스티커는 이유만 적고 「이 판 찍기」를 내지 않는다', () => {
    render(<NodeDetail node={LOCKED} onGo={() => undefined} onClose={() => undefined} now={NOW} />);
    expect(screen.getByText(/아직 판이 걸리지 않았습니다/)).toBeTruthy();
    expect(screen.getByText(/앞 판이 먼저입니다/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: '이 판 찍기' })).toBeNull();
  });

  it('「이 판 찍기」는 개념 id 를 돌려준다', async () => {
    const onGo = vi.fn();
    const user = userEvent.setup();
    render(<NodeDetail node={NODE} onGo={onGo} onClose={() => undefined} now={NOW} />);

    await user.click(screen.getByRole('button', { name: '이 판 찍기' }));
    expect(onGo).toHaveBeenCalledWith('ts/optional-chaining');
  });
});
