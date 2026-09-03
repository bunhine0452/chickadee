// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PickToken } from './PickToken';

afterEach(cleanup);

describe('PickToken', () => {
  it('목업 클래스와 라디오 역할을 붙인다', () => {
    const { container } = render(<PickToken k={2} label="?." checked={false} />);
    const tk = container.querySelector('.tk');
    expect(tk?.getAttribute('data-k')).toBe('2');
    expect(tk?.getAttribute('role')).toBe('radio');
    expect(tk?.getAttribute('aria-checked')).toBe('false');
  });

  it('스크린리더에 토큰 원문을 읽힌다', () => {
    render(<PickToken k={1} label="cart" checked />);
    const radio = screen.getByRole('radio', { name: 'cart' });
    expect(radio.getAttribute('aria-checked')).toBe('true');
    expect(radio.className).toContain('sel');
  });

  it('토큰 안에서도 구문 강조는 6클래스만 쓴다', () => {
    const { container } = render(<PickToken k={1} label="const" checked={false} />);
    expect(container.querySelector('.tk i')?.className).toBe('k');
  });

  it('채점 표시는 클래스로만 갈린다', () => {
    const right = render(<PickToken k={1} label="a" checked={false} right />);
    expect(right.container.querySelector('.tk')?.className).toContain('right');
    cleanup();

    const wrong = render(<PickToken k={1} label="a" checked wrong />);
    expect(wrong.container.querySelector('.tk')?.className).toContain('wrong');
  });

  it('누르면 자기 번호를 돌려준다', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    render(<PickToken k={3} label="items" checked={false} onPick={onPick} />);

    await user.click(screen.getByRole('radio'));
    expect(onPick).toHaveBeenCalledWith(3);
  });

  it('굳은 뒤에는 눌리지 않는다', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    render(<PickToken k={3} label="items" checked={false} disabled onPick={onPick} />);

    await user.click(screen.getByRole('radio'));
    expect(onPick).not.toHaveBeenCalled();
  });
});
