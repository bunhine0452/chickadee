// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Hole, HOLE_GLYPH } from './Hole';

afterEach(cleanup);

describe('Hole', () => {
  it('비어 있으면 뚫린 자리 글자를 남긴다', () => {
    const { container } = render(<Hole state="empty" />);
    const hole = container.querySelector('.hole');
    expect(hole?.textContent).toBe(HOLE_GLYPH);
    expect(hole?.className).toBe('hole');
    expect(hole?.getAttribute('aria-label')).toBe('빈칸');
  });

  it('써 넣으면 그 글자가 자리를 채운다', () => {
    const { container } = render(<Hole value="?." state="filled" />);
    const hole = container.querySelector('.hole');
    expect(hole?.textContent).toBe('?.');
    expect(hole?.className).toContain('filled');
  });

  it('채점 상태는 클래스로만 갈린다', () => {
    const right = render(<Hole value="?." state="right" />);
    expect(right.container.querySelector('.hole')?.className).toContain('right');
    cleanup();

    const wrong = render(<Hole value="." state="wrong" />);
    expect(wrong.container.querySelector('.hole')?.className).toContain('wrong');
  });
});
