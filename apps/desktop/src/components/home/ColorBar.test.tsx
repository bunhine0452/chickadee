// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ColorBar } from './ColorBar';

afterEach(cleanup);

const DAYS = [0, 14, 22, 0, 9, 18, 25, 12, 16, 20, 11, 24, 19, 12];

describe('ColorBar', () => {
  it('14칸을 낸다', () => {
    render(<ColorBar days={DAYS} />);
    expect(screen.getAllByTitle(/·/)).toHaveLength(14);
  });

  it('빈 날과 오늘을 구분해 말한다', () => {
    render(<ColorBar days={DAYS} />);
    const rest = screen.getByTitle('13일 전 · 쉼');
    const today = screen.getByTitle('오늘 · 12분');
    expect(rest.getAttribute('data-v')).toBe('0');
    expect(today.getAttribute('data-v')).toBe('1');
    expect(today.hasAttribute('data-today')).toBe(true);
    expect(rest.hasAttribute('data-today')).toBe(false);
  });

  it('총량을 한 문장으로 읽어 준다', () => {
    render(<ColorBar days={DAYS} />);
    const bar = screen.getByRole('img', { name: /지난 14일 잉크 농도/ });
    expect(bar.getAttribute('aria-label')).toBe('지난 14일 잉크 농도. 찍은 날 12일, 모두 202분.');
  });

  it('칸이 모자라게 와도 14칸을 채운다', () => {
    render(<ColorBar days={[5]} />);
    expect(screen.getAllByTitle(/·/)).toHaveLength(14);
    expect(screen.getByTitle('오늘 · 쉼')).toBeTruthy();
  });
});
