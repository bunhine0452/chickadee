// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Guide } from './Guide';

afterEach(cleanup);

describe('Guide', () => {
  it('말풍선은 장식이다 — 같은 문구는 LiveRegion 이 읽는다', () => {
    const { container } = render(<Guide msg="다음은 「옵셔널 체이닝」입니다." />);
    const guide = container.querySelector('.guide');
    expect(guide?.getAttribute('aria-hidden')).toBe('true');
    expect(guide?.textContent).toBe('다음은 「옵셔널 체이닝」입니다.');
  });
});
