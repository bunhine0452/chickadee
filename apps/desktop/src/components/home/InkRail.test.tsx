// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { InkRail } from './InkRail';

afterEach(cleanup);

describe('InkRail', () => {
  it('겹을 숫자로 적고 판 번호를 붙이되 접근성 트리엔 없다 (D179)', () => {
    const { container } = render(<InkRail ly={2} label="판 02 · 1도" />);
    const rail = container.querySelector('.rail');
    expect(rail?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('.rail-ly')?.textContent).toBe('2');
    expect(container.querySelector('.vt')?.textContent).toBe('판 02 · 1도');
    // 마스코트는 진도 자리에 서지 않는다.
    expect(container.querySelector('.dee, .dee-sticker')).toBeNull();
  });
});
