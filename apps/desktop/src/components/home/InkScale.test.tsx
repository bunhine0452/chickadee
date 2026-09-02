// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { InkScale } from './InkScale';

afterEach(cleanup);

describe('InkScale', () => {
  it('겹 5칸과 개수를 한 문장으로 읽어 준다', () => {
    render(<InkScale counts={[4, 3, 6, 5, 3]} />);
    const scale = screen.getByRole('img', { name: /잉크 겹 5단계/ });
    const label = scale.getAttribute('aria-label') ?? '';
    expect(label).toContain('0겹 미인쇄 4개');
    expect(label).toContain('1겹 애벌 3개');
    expect(label).toContain('2겹 먹판 6개');
    expect(label).toContain('3겹 + 청판 5개');
    expect(label).toContain('4겹 + 진홍 3개');
  });

  it('겹 이름을 눈으로도 다섯 칸 다 낸다', () => {
    render(<InkScale counts={[0, 0, 0, 0, 0]} />);
    for (const name of ['미인쇄', '애벌', '먹판', '+ 청판', '+ 진홍']) {
      expect(screen.getByText(name)).toBeTruthy();
    }
  });

  it('개념이 가장 많이 모인 칸을 짚는다', () => {
    const { container } = render(<InkScale counts={[1, 1, 9, 1, 1]} />);
    const hit = container.querySelectorAll('.ld.hit');
    expect(hit).toHaveLength(1);
    expect(hit[0]?.textContent).toContain('먹판');
  });
});
