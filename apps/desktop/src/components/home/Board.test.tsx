// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Board } from './Board';

afterEach(cleanup);

describe('Board', () => {
  it('main 하나에 제목·평문·본문을 담고 포커스를 받을 수 있다', () => {
    render(
      <Board title="cart-shop-web 단원" plain="= 내 리포의 기능 지도" note="문제 12개 중 5개.">
        <p>단원 더미</p>
      </Board>,
    );
    const main = screen.getByRole('main');
    expect(main.getAttribute('tabindex')).toBe('-1');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('cart-shop-web 단원');
    expect(main.textContent).toContain('= 내 리포의 기능 지도');
    expect(main.textContent).toContain('단원 더미');
    // 트랙 색 범례는 D179 로 사라졌다 — 트랙이 색을 고르지 않으니 설명할 색이 없다.
    expect(screen.queryByRole('list', { name: '범례' })).toBeNull();
  });
});
