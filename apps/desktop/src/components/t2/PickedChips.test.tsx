// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PickedChips } from './PickedChips';

afterEach(cleanup);

describe('PickedChips', () => {
  it('비면 그 사실을 적는다', () => {
    const { container } = render(<PickedChips picked={[]} />);
    expect(container.querySelector('.picked .none')?.textContent).toBe('아직 고른 파일이 없습니다.');
    expect(container.querySelectorAll('.chip')).toHaveLength(0);
  });

  it('칩에는 마지막 한 칸만 낸다 — 순서는 받은 그대로', () => {
    const { container } = render(
      <PickedChips picked={['features/cart/useCart.ts', 'app/cart/page.tsx', 'lib']} />,
    );
    expect([...container.querySelectorAll('.chip')].map((el) => el.textContent)).toEqual([
      'useCart.ts',
      'page.tsx',
      'lib',
    ]);
  });
});
