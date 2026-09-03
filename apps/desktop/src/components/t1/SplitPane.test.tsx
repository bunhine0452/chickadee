// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SplitPane } from './SplitPane';

afterEach(cleanup);

describe('SplitPane', () => {
  it('좌 · 자 · 우 세 조각을 그 순서로 낸다 — 격자가 3열이다', () => {
    const { container } = render(<SplitPane left={<div id="L">왼쪽</div>} right={<div id="R">오른쪽</div>} />);
    const split = container.querySelector('.split');
    expect(split).not.toBeNull();
    expect([...(split?.children ?? [])].map((el) => el.id || el.className)).toEqual(['L', 'vr', 'R']);
  });

  it('세로 자는 장식이라 낭독하지 않는다', () => {
    const { container } = render(<SplitPane left={<div />} right={<div />} />);
    expect(container.querySelector('.vr')?.getAttribute('aria-hidden')).toBe('true');
  });
});
