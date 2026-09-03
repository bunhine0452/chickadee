// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LiferVeil } from './LiferVeil';

afterEach(cleanup);

const CARD = {
  concept: '옵셔널 체이닝',
  code: '?.',
  where: '당신의 <b>src/cart.ts:42</b> 에서 채집 · T0 문법',
  serial: '#047 · 2026-09-03 · 14:22',
};

describe('LiferVeil', () => {
  it('목업 클래스를 그대로 붙이고 대화상자로 읽힌다', () => {
    const { container } = render(<LiferVeil {...CARD} onClose={() => undefined} />);
    expect(container.querySelector('.lifer-veil')).not.toBeNull();
    expect(container.querySelector('.lifer-card')).not.toBeNull();
    expect(screen.getByRole('dialog', { name: '처음 기록한 개념' })).toBeTruthy();
  });

  it('영구 기록 셋을 낸다 — 도장 · 일련번호 · 채집지 (정본 §3-6)', () => {
    const { container } = render(<LiferVeil {...CARD} onClose={() => undefined} />);
    expect(container.querySelector('.stamp')?.textContent).toContain('첫 관찰');
    expect(container.querySelector('.lifer-serial')?.textContent).toBe('#047 · 2026-09-03 · 14:22');
    expect(container.querySelector('.lifer-card p')?.textContent).toContain('src/cart.ts:42');
  });

  it('열리면 포커스가 카드로 온다', () => {
    render(<LiferVeil {...CARD} onClose={() => undefined} />);
    expect(screen.getByRole('dialog')).toBe(document.activeElement);
  });

  it('아무 키나 누르면 닫힌다', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<LiferVeil {...CARD} onClose={onClose} />);

    await user.keyboard('a');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Esc 도 Enter 도 Tab 도 닫기만 한다', async () => {
    for (const key of ['{Escape}', '{Enter}', '{Tab}']) {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<LiferVeil {...CARD} onClose={onClose} />);

      await user.keyboard(key);
      expect(onClose, key).toHaveBeenCalledTimes(1);
      cleanup();
    }
  });

  it('수식키 단독으로는 닫히지 않는다', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<LiferVeil {...CARD} onClose={onClose} />);

    await user.keyboard('{Shift}');
    await user.keyboard('{Control}');
    await user.keyboard('{Alt}');
    await user.keyboard('{Meta}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('Tab 이 먹지 않으므로 포커스가 카드 밖으로 새지 않는다', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">밖</button>
        <LiferVeil {...CARD} onClose={() => undefined} />
      </>,
    );

    const card = screen.getByRole('dialog');
    await user.keyboard('{Tab}');
    expect(document.activeElement).toBe(card);
  });

  it('눌러도 닫힌다', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<LiferVeil {...CARD} onClose={onClose} />);

    await user.click(container.querySelector('.lifer-card') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('닫히면 포커스가 열기 전 자리로 돌아간다', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    const { unmount } = render(<LiferVeil {...CARD} onClose={() => undefined} />);
    expect(document.activeElement).not.toBe(opener);

    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
