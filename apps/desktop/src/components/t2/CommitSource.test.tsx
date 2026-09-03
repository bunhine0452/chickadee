// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { CommitSource } from './CommitSource';

afterEach(cleanup);

const COMMIT = {
  h: 'a3f19c2',
  d: '2026-07-14',
  m: 'feat(cart): 장바구니 수량 +/- 조절 기능 추가',
  n: '7 files changed, +181 −23',
};

describe('CommitSource', () => {
  it('해시 · 메시지 · 날짜와 변경량을 낸다', () => {
    const { container } = render(<CommitSource commit={COMMIT} />);
    expect(container.querySelector('.commit .h')?.textContent).toBe('a3f19c2');
    expect(container.querySelector('.commit .msg')?.textContent).toBe(COMMIT.m);
    expect(container.querySelector('.commit')?.textContent).toContain('2026-07-14 · 7 files changed, +181 −23');
    expect(container.querySelector('.commit p b')?.textContent).toBe('정답의 출처');
  });

  it('커밋이 없는 카드에서는 아무것도 그리지 않는다 (D100)', () => {
    const { container } = render(<CommitSource />);
    expect(container.innerHTML).toBe('');
  });
});
