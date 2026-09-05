// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { CoachBand } from './CoachBand';

afterEach(cleanup);

describe('CoachBand', () => {
  it('걸음마다 다른 말을 하고, 셋 다 3걸음 중 몇째인지를 든다', () => {
    const { container, rerender } = render(<CoachBand step={1} />);
    const band = screen.getByRole('complementary', { name: '첫 문제 안내' });
    expect(band.textContent).toContain('1 / 3');
    expect(band.textContent).toContain('보기 넷 중 하나');

    rerender(<CoachBand step={2} />);
    expect(container.textContent).toContain('2 / 3');
    expect(container.textContent).toContain('Enter');
    // 「틀려도 손해가 없다」가 이 걸음의 요점이다 (정본 §3-1).
    expect(container.textContent).toContain('틀려도 잃는 것은 없어요');

    rerender(<CoachBand step={3} />);
    expect(container.textContent).toContain('3 / 3');
    expect(container.textContent).toContain('채점 결과');
    expect(container.textContent).toContain('Space');
  });

  it('넘기기 버튼이 없다 — 걸음은 사용자의 동작으로만 넘어간다', () => {
    const { container } = render(<CoachBand step={1} />);
    expect(container.querySelector('button')).toBeNull();
  });
});
