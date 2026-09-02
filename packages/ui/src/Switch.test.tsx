// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Switch } from './Switch';

afterEach(cleanup);

const THEME = [
  { v: 'light', label: '주간반' },
  { v: 'dark', label: '야간반' },
] as const;

const FILTER = [
  { v: 'all', label: '전부' },
  { v: 'differ', label: '어긋남' },
  { v: 'extra', label: '추가' },
] as const;

describe('Switch', () => {
  it('두 갈래는 role=switch 로 상태를 말한다', () => {
    const onChange = vi.fn();
    render(<Switch options={THEME} value="light" label="주간반 · 야간반" onChange={onChange} />);
    const sw = screen.getByRole('switch', { name: '주간반 · 야간반' });
    expect(sw.className).toBe('sw');
    expect(sw.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith('dark');
  });

  it('←→ 로 값을 옮긴다 (물리 키 e.code 판정)', () => {
    const onChange = vi.fn();
    render(<Switch options={THEME} value="light" label="주간반 · 야간반" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole('switch'), { code: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('dark');
  });

  it('세 갈래는 radiogroup 이 된다', () => {
    const onChange = vi.fn();
    render(<Switch options={FILTER} value="differ" label="판정 거르개" onChange={onChange} />);
    const group = screen.getByRole('radiogroup', { name: '판정 거르개' });
    expect(group.className).toBe('sw');
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(radios[1]?.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(radios[2] as HTMLElement);
    expect(onChange).toHaveBeenCalledWith('extra');
  });
});
