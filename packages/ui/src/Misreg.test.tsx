// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Misreg } from './Misreg';

afterEach(cleanup);

describe('Misreg', () => {
  it('data-w 로 유령 판을 복제하고 진짜 글자는 span 하나뿐이다', () => {
    const { container } = render(<Misreg as="b" text="5판" />);
    const el = container.querySelector('.mr') as HTMLElement;
    expect(el.tagName).toBe('B');
    expect(el.getAttribute('data-w')).toBe('5판');
    expect(el.querySelectorAll('span')).toHaveLength(1);
    expect(el.textContent).toBe('5판');
  });

  it('as 를 생략하면 span 이다', () => {
    const { container } = render(<Misreg text="CHICKADEE" />);
    expect((container.querySelector('.mr') as HTMLElement).tagName).toBe('SPAN');
  });
});
