// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';

import { Page, Split } from './Page.js';

afterEach(cleanup);

/**
 * jsdom 은 배치를 계산하지 않는다 — 실제 폭에서 깨지는지는
 * `tests/gates/responsive.spec.ts` 가 브라우저에서 잰다. 여기서 지키는 것은
 * **뼈대가 실제로 걸렸는가** 하나다. 클래스가 빠지면 규칙 전체가 조용히 사라진다.
 */
describe('화면 뼈대', () => {
  test('바깥 상자와 가운데 정렬이 늘 걸린다', () => {
    const { container } = render(<Page className="board">내용</Page>);
    const main = container.querySelector('main');
    expect(main?.className).toBe('l-page board');
    expect(container.querySelector('.l-page-body')?.className).toContain('l-wrap');
  });

  test('폭 갈래가 상한을 고른다 — 격자 화면은 더 넓게, 편집기는 상한 없이', () => {
    const cls = (width: 'read' | 'wide' | 'full'): string =>
      render(<Page width={width}>x</Page>).container.querySelector('.l-page-body')?.className ?? '';
    expect(cls('read')).toBe('l-wrap l-page-body');
    expect(cls('wide')).toContain('l-wrap-wide');
    expect(cls('full')).toContain('l-wrap-full');
  });

  test('머리말이 없으면 빈 상자를 만들지 않는다', () => {
    const { container } = render(<Page>x</Page>);
    expect(container.querySelector('.l-page-head')).toBeNull();
  });

  test('옆 패널은 늘 `aside` 이고 본문 칸에 `min-width: 0` 이 걸린다', () => {
    const { container } = render(<Split side={<nav>목차</nav>}>본문</Split>);
    expect(container.querySelector('.l-split > aside.l-side')).not.toBeNull();
    // 이 한 줄이 없으면 긴 경로 하나가 칸을 부풀려 창 밖으로 민다 — 720 사고의 원인이다.
    expect(container.querySelector('.l-content')?.className).toContain('u-minw0');
  });

  test('옆 패널의 자리와 쌓는 순서를 고를 수 있다', () => {
    const { container } = render(<Split side="s" sideEnd stackLast sticky>본문</Split>);
    expect(container.querySelector('.l-split')?.className)
      .toBe('l-split l-split-side-end l-split-stack-last');
    expect(container.querySelector('.l-side')?.className).toContain('l-side-sticky');
  });
});
