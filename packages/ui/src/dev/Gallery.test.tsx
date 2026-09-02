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

  it('프리미티브 12종을 모두 진열한다', () => {
    const { container } = render(<Gallery />);
    const classes = [
      '.pill',
      '.passes',
      'kbd.k',
      '.press-btn',
      '.flat-btn',
      '.sw',
      '.reg',
      '.stamp',
      '.say',
      '.toast',
      '.vh#live',
      '.mr',
    ];
    for (const sel of classes) {
      expect(container.querySelector(sel), sel).not.toBeNull();
    }
  });

  it('Dee 를 겹 0~4 로 나란히 놓는다', () => {
    const { container } = render(<Gallery />);
    for (const ly of [0, 1, 2, 3, 4]) {
      expect(container.querySelector(`svg.dee[data-ly="${ly}"]`)).not.toBeNull();
    }
  });

  it('테마·부속 스위치가 살아 있다', () => {
    render(<Gallery />);
    expect(screen.getByRole('switch', { name: '주간반 · 야간반' })).not.toBeNull();
    expect(screen.getByRole('switch', { name: '부속 보임 · 숨김' })).not.toBeNull();
    expect(screen.getByRole('radiogroup', { name: '판정 거르개' })).not.toBeNull();
  });
});
