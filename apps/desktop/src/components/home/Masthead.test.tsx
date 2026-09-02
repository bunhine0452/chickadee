// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { Masthead } from './Masthead';

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-trim');
});

const MASTHEAD = { concepts: 21, printed: 9, avgLayer: 2.4 };

function setup() {
  return render(
    <Masthead repoName="cart-shop-web" today="2026-09-03" streak={7} masthead={MASTHEAD} />,
  );
}

describe('Masthead', () => {
  it('작업 지시서에 리포·날짜·연속일·겹 평균을 적는다', () => {
    setup();
    const ticket = screen.getByRole('group', { name: '작업 지시서' });
    expect(ticket.textContent).toContain('cart-shop-web');
    expect(ticket.textContent).toContain('2026-09-03');
    expect(ticket.textContent).toContain('7');
    expect(ticket.textContent).toContain('2.4');
  });

  it('리포 칸은 전환 자리다 — 목록은 아직 없다', () => {
    setup();
    const button = screen.getByRole('button', { name: '리포' });
    expect(button.getAttribute('aria-haspopup')).toBe('listbox');
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('스위치 두 개가 <html> 의 data-theme · data-trim 을 세운다', async () => {
    const user = userEvent.setup();
    setup();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-trim')).toBe('off');

    await user.click(screen.getByRole('switch', { name: '주간반 · 야간반 전환' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    await user.click(screen.getByRole('switch', { name: '인쇄 부속 보이기 · 숨기기' }));
    expect(document.documentElement.getAttribute('data-trim')).toBe('on');
  });
});
