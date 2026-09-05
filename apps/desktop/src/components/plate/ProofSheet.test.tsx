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

  it('판은 머리와 내용뿐이다 — 레일·판번호·알약은 내려갔다 (D182)', () => {
    const { container } = render(<ProofSheet {...BASE} ly={[2, 2]} />);
    for (const cls of ['.ps', '.ps-head', '.ps-h2', '.ps-meta', '.ps-src', '.ps-ly']) {
      expect(container.querySelector(cls), cls).not.toBeNull();
    }
    for (const cls of ['.ps-rail', '.sig', '.pill', '.passes', '.reg', '.dee']) {
      expect(container.querySelector(cls), cls).toBeNull();
    }
  });

  it('숙련도가 오른 것은 판 머리가 아니라 판정란이 말한다 (D182)', () => {
    const { container } = render(<ProofSheet {...BASE} ly={[2, 3]} />);
    expect(container.querySelector('.plus')).toBeNull();
    // 머리에 남는 것은 **지금** 값 하나다.
    expect(container.querySelector('.ps-ly')?.getAttribute('data-ly')).toBe('3');
  });

  it('겹은 지금 값으로 그리고 평문을 병기한다', () => {
    render(<ProofSheet {...BASE} ly={[2, 3]} />);
    expect(screen.getByText(/숙련도 3 \/ 4 · 자리 잡음/)).toBeTruthy();
  });

  it('폭 3단은 클래스로만 갈린다', () => {
    const wide = render(<ProofSheet {...BASE} ly={[1, 1]} width="wide" />);
    expect(wide.container.querySelector('.ps')?.className).toContain('wide');
    cleanup();

    const x = render(<ProofSheet {...BASE} ly={[1, 1]} width="xwide" />);
    expect(x.container.querySelector('.ps')?.className).toContain('xwide');
  });

  it('판에는 인라인 스타일이 하나도 없다 — 기울기·그림자·질감을 없앴다 (D182)', () => {
    const { container } = render(<ProofSheet {...BASE} ly={[1, 1]} />);
    const ps = container.querySelector<HTMLElement>('.ps');
    expect(ps?.getAttribute('style')).toBeNull();
    expect(container.querySelector('.ps-rail')).toBeNull();
    expect(container.querySelector('.pill')).toBeNull();
    expect(container.querySelector('.passes')).toBeNull();
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

describe('ProofSheet — 판이 바뀌면 작업대는 맨 위다 (D170 ②)', () => {
  it('앞 판이 내려 둔 스크롤을 0 으로 되돌리고 새 판으로 포커스를 옮긴다', () => {
    const bench = document.createElement('main');
    bench.className = 'bench';
    document.body.appendChild(bench);
    Object.defineProperty(bench, 'scrollTop', { value: 0, writable: true });

    const { rerender } = render(<ProofSheet {...BASE} ly={[0, 0]} />, { container: bench });
    bench.scrollTop = 138;
    rerender(<ProofSheet {...BASE} no="4판" concept="숫자 리터럴" ly={[0, 0]} />);

    expect(bench.scrollTop).toBe(0);
    expect(document.activeElement).toBe(bench.querySelector('article.ps'));
    bench.remove();
  });
});
