// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { InkScale } from './InkScale';

afterEach(cleanup);

describe('InkScale', () => {
  it('겹 5칸과 개수를 한 문장으로 읽어 준다', () => {
    render(<InkScale counts={[4, 3, 6, 5, 3]} />);
    const scale = screen.getByRole('img', { name: /숙련도 다섯 단계/ });
    const label = scale.getAttribute('aria-label') ?? '';
    expect(label).toContain('0단계 아직 4개');
    expect(label).toContain('1단계 처음 3개');
    expect(label).toContain('2단계 익히는 중 6개');
    expect(label).toContain('3단계 자리 잡음 5개');
    expect(label).toContain('4단계 다 익힘 3개');
  });

  it('겹 이름을 눈으로도 다섯 칸 다 낸다', () => {
    render(<InkScale counts={[0, 0, 0, 0, 0]} />);
    for (const name of ['아직', '처음', '익히는 중', '자리 잡음', '다 익힘']) {
      expect(screen.getByText(name)).toBeTruthy();
    }
  });

  it('개념이 가장 많이 모인 칸을 짚는다', () => {
    const { container } = render(<InkScale counts={[1, 1, 9, 1, 1]} />);
    const hit = container.querySelectorAll('.ld.hit');
    expect(hit).toHaveLength(1);
    expect(hit[0]?.textContent).toContain('익히는 중');
  });
});
