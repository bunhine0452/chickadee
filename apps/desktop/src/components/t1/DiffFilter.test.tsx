// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DiffFilter } from './DiffFilter';

afterEach(cleanup);

describe('DiffFilter', () => {
  it('3택이므로 라디오 묶음이다 (05 §5)', () => {
    render(<DiffFilter value="ne" onChange={() => {}} />);
    const group = screen.getByRole('radiogroup', { name: '보기' });
    expect(group.className).toContain('sw');
    const radios = screen.getAllByRole('radio');
    expect(radios.map((el) => el.textContent)).toEqual(['다름 + 같은 뜻만', '전체', '다름만']);
    expect(radios.map((el) => el.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
  });

  it('기본값은 「어긋남 + 동등만」 자리에 표시된다', () => {
    const { container } = render(<DiffFilter value="d" onChange={() => {}} />);
    expect(container.querySelector('.sw span.on')?.textContent).toBe('다름만');
  });

  it('누르면 값을 올려보낸다', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DiffFilter value="ne" onChange={onChange} />);
    await user.click(screen.getByRole('radio', { name: '전체' }));
    expect(onChange).toHaveBeenCalledWith('all');
  });

  it('← → 로도 옮긴다', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DiffFilter value="ne" onChange={onChange} />);
    screen.getByRole('radio', { name: '다름 + 같은 뜻만' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('all');
  });

  it('이의 안내를 같이 적는다 — 점수는 그대로 두고 규칙을 고친다', () => {
    const { container } = render(<DiffFilter value="ne" onChange={() => {}} />);
    expect(container.querySelector('.dfilter')?.textContent).toContain('같은 뜻인데요');
    expect(container.querySelector('.dfilter')?.textContent).toContain('점수는 그대로 두고');
  });
});
