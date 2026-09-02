// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Stamp } from './Stamp';

afterEach(cleanup);

describe('Stamp', () => {
  it('기본은 진홍(정합) 도장이고 aria-hidden 이다', () => {
    const { container } = render(<Stamp text="정합" sub="EXACT" />);
    const el = container.querySelector('.stamp');
    expect(el?.className).toBe('stamp');
    expect(el?.getAttribute('aria-hidden')).toBe('true');
    expect(el?.querySelector('small')?.textContent).toBe('EXACT');
  });

  it('tone·big·hit 이 목업 클래스로 나간다', () => {
    const { container } = render(<Stamp text="어긋남" tone="yellow" big hit rotate={-9} />);
    const el = container.querySelector('.stamp') as HTMLElement;
    expect(el.className).toBe('stamp yellow big hit');
    expect(el.style.getPropertyValue('--r')).toBe('-9deg');
  });
});
