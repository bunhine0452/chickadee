// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ProofSheet } from './ProofSheet';

afterEach(cleanup);

const BASE = {
  no: '3판',
  track: 't0' as const,
  concept: '옵셔널 체이닝',
  code: '?.',
  kind: '지목형 · 복습',
  source: '내 코드 <b>src/cart.ts:42</b>',
};

describe('ProofSheet', () => {
  it('마운트하면 판 자체로 포커스가 온다', () => {
    const { container } = render(<ProofSheet {...BASE} ly={[2, 2]} />);
    const ps = container.querySelector('article.ps');
    expect(ps).toBe(document.activeElement);
  });

  it('focusOnMount 를 끄면 포커스를 가져가지 않는다 — 복귀 판은 LinkPara 에 양보한다', () => {
    const { container } = render(<ProofSheet {...BASE} ly={[2, 2]} focusOnMount={false} />);
    expect(container.querySelector('article.ps')).not.toBe(document.activeElement);
  });

  it('목업 클래스를 그대로 붙인다', () => {
    const { container } = render(<ProofSheet {...BASE} ly={[2, 2]} />);
    for (const cls of ['.ps', '.ps-rail', '.ps-in', '.ps-head', '.ps-h2', '.ps-src', '.ps-ly', '.sig']) {
      expect(container.querySelector(cls), cls).not.toBeNull();
    }
  });

  it('겹이 오르면 레일에 「+1겹」이 켜진다', () => {
    const { container } = render(<ProofSheet {...BASE} ly={[2, 3]} />);
    const plus = container.querySelector('.ps-rail .plus');
    expect(plus?.textContent).toBe('+1겹');
    expect(plus?.className).toContain('on');
  });

  it('겹이 내려가면 「−1겹」, 제자리면 비어 있고 꺼져 있다', () => {
    const down = render(<ProofSheet {...BASE} ly={[3, 2]} />);
    expect(down.container.querySelector('.ps-rail .plus')?.textContent).toBe('−1겹');
    cleanup();

    const flat = render(<ProofSheet {...BASE} ly={[2, 2]} />);
    const plus = flat.container.querySelector('.ps-rail .plus');
    expect(plus?.textContent).toBe('');
    expect(plus?.className).not.toContain('on');
  });

  it('겹은 지금 값으로 그리고 평문을 병기한다', () => {
    render(<ProofSheet {...BASE} ly={[2, 3]} />);
    expect(screen.getByText('잉크 3겹 / 4 · + 청판 · 색이 들어옴')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'T0 · 잉크 3겹' })).toBeTruthy();
  });

  it('폭 3단은 클래스로만 갈린다', () => {
    const wide = render(<ProofSheet {...BASE} ly={[1, 1]} width="wide" />);
    expect(wide.container.querySelector('.ps')?.className).toContain('wide');
    cleanup();

    const x = render(<ProofSheet {...BASE} ly={[1, 1]} width="xwide" />);
    expect(x.container.querySelector('.ps')?.className).toContain('xwide');
  });

  it('기울기는 --tilt 로만 들어간다 — 부속 숨김이 CSS 한 곳에서 끈다', () => {
    const { container } = render(<ProofSheet {...BASE} ly={[1, 1]} tilt={-0.2} />);
    const ps = container.querySelector<HTMLElement>('.ps');
    expect(ps?.style.getPropertyValue('--tilt')).toBe('-0.2deg');
  });

  it('출처의 서식은 살리고 태그는 정화한다', () => {
    const { container } = render(
      <ProofSheet {...BASE} ly={[1, 1]} source={'내 코드 <b>src/cart.ts:42</b><script>x</script>'} />,
    );
    const src = container.querySelector('.ps-src');
    expect(src?.querySelector('b')?.textContent).toBe('src/cart.ts:42');
    expect(src?.querySelector('script')).toBeNull();
  });
});
