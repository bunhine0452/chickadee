// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { InkRail } from './InkRail';

afterEach(cleanup);

describe('InkRail', () => {
  it('겹에 맞는 새와 판 번호를 그리되 접근성 트리엔 없다', () => {
    const { container } = render(<InkRail ly={2} label="판 02 · 1도" />);
    const rail = container.querySelector('.rail');
    expect(rail?.getAttribute('aria-hidden')).toBe('true');
    expect(rail?.textContent).toBe('판 02 · 1도');
    expect(container.querySelector('.dee')?.getAttribute('data-ly')).toBe('2');
  });
});
