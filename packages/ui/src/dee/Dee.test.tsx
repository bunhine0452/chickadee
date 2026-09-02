// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { InkLayer } from '../types';
import { DEE_HEAD_SIZE_LIMIT, Dee } from './Dee';

afterEach(cleanup);

/** `data-ly` 를 뺀 DOM 뼈대 — 태그·속성 이름·속성 값(겹 제외)까지 찍는다. */
function skeleton(root: Element): string {
  return Array.from(root.querySelectorAll('*'))
    .map((el) => {
      const attrs = Array.from(el.attributes)
        .filter((a) => a.name !== 'data-ly' && a.name !== 'class')
        .map((a) => `${a.name}=${a.value}`)
        .sort()
        .join(',');
      return `${el.tagName}[${attrs}]`;
    })
    .join('|');
}

describe('Dee — 잉크 겹', () => {
  it('겹은 data-ly 속성 하나로만 표현된다', () => {
    const { container } = render(<Dee ly={2} />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg.getAttribute('class')).toBe('dee');
    expect(svg.getAttribute('data-ly')).toBe('2');
  });

  it('겹 0 과 겹 4 의 DOM 뼈대가 완전히 같다 (색만 바뀐다)', () => {
    const zero = render(<Dee ly={0} size={64} />);
    const zeroSkeleton = skeleton(zero.container);
    cleanup();

    const four = render(<Dee ly={4} size={64} />);
    expect(skeleton(four.container)).toBe(zeroSkeleton);
  });

  it('겹을 0→4 로 올려도 <use> 노드가 같은 노드로 남는다', () => {
    const { container, rerender } = render(<Dee ly={0} size={64} />);
    const before = container.querySelector('use');
    const beforeSvg = container.querySelector('svg');
    const beforeSkeleton = skeleton(container);

    for (const ly of [1, 2, 3, 4] as InkLayer[]) {
      rerender(<Dee ly={ly} size={64} />);
    }

    expect(container.querySelector('use')).toBe(before);
    expect(container.querySelector('svg')).toBe(beforeSvg);
    expect(skeleton(container)).toBe(beforeSkeleton);
    expect(container.querySelector('svg')?.getAttribute('data-ly')).toBe('4');
  });
});

describe('Dee — 심볼', () => {
  it('심볼별로 다른 use href 를 건다', () => {
    const cases = [
      ['badge', '#dee'],
      ['bird', '#deeBird'],
      ['head', '#deeHead'],
    ] as const;
    for (const [symbol, href] of cases) {
      const { container, unmount } = render(<Dee ly={4} symbol={symbol} size={64} />);
      expect(container.querySelector('use')?.getAttribute('href')).toBe(href);
      unmount();
    }
  });

  it(`${DEE_HEAD_SIZE_LIMIT}px 아래면 자동으로 머리 심볼이 된다`, () => {
    const { container } = render(<Dee ly={4} symbol="badge" size={DEE_HEAD_SIZE_LIMIT - 1} />);
    expect(container.querySelector('use')?.getAttribute('href')).toBe('#deeHead');
  });

  it('스티커면 크림 원판으로 감싼다', () => {
    const { container } = render(<Dee ly={3} size={46} sticker />);
    const wrap = container.querySelector('.dee-sticker') as HTMLElement;
    expect(wrap).not.toBeNull();
    expect(wrap.style.width).toBe('46px');
    expect(wrap.querySelector('svg.dee')).not.toBeNull();
  });

  it('마스코트는 장식이라 낭독되지 않는다', () => {
    const { container } = render(<Dee ly={4} />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});
