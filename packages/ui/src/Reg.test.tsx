// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Reg } from './Reg';

afterEach(cleanup);

describe('Reg', () => {
  it('장식이라 접근성 트리에 없다', () => {
    const { container } = render(<Reg />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toBe('reg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
  });

  it('정합이면 .hit 이 붙는다', () => {
    const { container } = render(<Reg hit />);
    expect(container.querySelector('svg')?.getAttribute('class')).toBe('reg hit');
  });
});
