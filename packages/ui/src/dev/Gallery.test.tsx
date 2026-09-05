// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Gallery } from './Gallery';

afterEach(cleanup);

describe('Gallery (DEV 전용)', () => {
  it('DEV 에서만 그린다 — 프로덕션 가드가 실제로 걸려 있다', () => {
    const { container } = render(<Gallery />);
    if (import.meta.env.DEV) {
      expect(container.querySelector('.gallery')).not.toBeNull();
    } else {
      expect(container.innerHTML).toBe('');
    }
  });

  it('D182 프리미티브 여섯을 모두 진열한다', () => {
    const { container } = render(<Gallery />);
    for (const sel of ['.btn.primary', '.card', '.field', '.tag.ok', '.prog', '.callout.bad']) {
      expect(container.querySelector(sel), sel).not.toBeNull();
    }
  });

  it('남은 프리미티브도 나란히 둔다', () => {
    const { container } = render(<Gallery />);
    // 리소 프리미티브(`.reg`·`.stamp`·`.say`·`.mr`)와 마스코트는 D182 로 사라졌다.
    for (const sel of ['.pill', '.passes', 'kbd.k', '.press-btn', '.flat-btn', '.sw', '.toast', '.vh#live']) {
      expect(container.querySelector(sel), sel).not.toBeNull();
    }
  });

  it('테마 스위치가 살아 있다', () => {
    render(<Gallery />);
    expect(screen.getByRole('switch', { name: '밝게 · 어둡게' })).not.toBeNull();
    expect(screen.getByRole('radiogroup', { name: '판정 거르개' })).not.toBeNull();
  });
});
