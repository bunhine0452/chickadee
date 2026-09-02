// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Say } from './Say';

afterEach(cleanup);

describe('Say', () => {
  it('말풍선은 장식이라 낭독되지 않는다 (같은 문구는 LiveRegion 이 읽는다)', () => {
    const { container } = render(<Say>필사 중엔 조용히 있을게요</Say>);
    const el = container.querySelector('.say');
    expect(el?.getAttribute('aria-hidden')).toBe('true');
    expect(el?.textContent).toBe('필사 중엔 조용히 있을게요');
  });
});
