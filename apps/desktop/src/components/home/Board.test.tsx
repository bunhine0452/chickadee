// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Board } from './Board';

afterEach(cleanup);

describe('Board', () => {
  it('main 하나에 제목·평문·범례를 담고 포커스를 받을 수 있다', () => {
    render(
      <Board title="cart-shop-web 대지" plain="= 내 리포의 기능 지도" note="판 12장 중 5장.">
        <p>대지 더미</p>
      </Board>,
    );
    const main = screen.getByRole('main');
    expect(main.getAttribute('tabindex')).toBe('-1');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('cart-shop-web 대지');
    expect(main.textContent).toContain('= 내 리포의 기능 지도');
    expect(screen.getByRole('list', { name: '잉크 범례' })).toBeTruthy();
    expect(main.textContent).toContain('대지 더미');
  });
});
