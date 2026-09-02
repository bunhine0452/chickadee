// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PASS_SLOTS, Passes } from './Passes';

afterEach(cleanup);

describe('Passes', () => {
  it('겹 수만큼만 칸을 켠다', () => {
    render(<Passes n={3} track="t0" label="T0 · 잉크 3겹" />);
    const el = screen.getByRole('img', { name: 'T0 · 잉크 3겹' });
    expect(el.querySelectorAll('i')).toHaveLength(PASS_SLOTS);
    expect(el.querySelectorAll('i.on')).toHaveLength(3);
  });

  it('0겹이면 아무 칸도 켜지지 않는다', () => {
    render(<Passes n={0} track="t2" label="T2 · 잉크 0겹" />);
    expect(screen.getByRole('img').querySelectorAll('i.on')).toHaveLength(0);
  });

  it('노드 안 작은 판은 .n-pass 클래스를 쓴다', () => {
    render(<Passes n={2} track="t1" label="T1 · 잉크 2겹" compact />);
    expect(screen.getByRole('img').className).toBe('n-pass t1');
  });

  // 05 §9 색맹 행: label 없이 쓰면 **타입 오류**다. 아래 주석이 그 계약이다.
  // @ts-expect-error label 은 필수 prop 이다
  const _missingLabelIsATypeError = <Passes n={1} track="t0" />;
  void _missingLabelIsATypeError;
});
