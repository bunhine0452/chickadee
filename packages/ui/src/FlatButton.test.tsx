// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FlatButton } from './FlatButton';

afterEach(cleanup);

describe('FlatButton', () => {
  it('보조 버튼은 aria-pressed 를 갖지 않는다', () => {
    render(<FlatButton ghost>건너뛰기</FlatButton>);
    const btn = screen.getByRole('button', { name: '건너뛰기' });
    expect(btn.className).toBe('flat-btn ghost');
    expect(btn.getAttribute('aria-pressed')).toBeNull();
  });

  it('모르겠어요는 토글이라 aria-pressed 로 상태를 말한다', () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <FlatButton variant="dunno" on={false} onClick={onClick}>
        모르겠어요
      </FlatButton>,
    );
    const btn = screen.getByRole('button', { name: '모르겠어요' });
    expect(btn.className).toBe('flat-btn dunno');
    expect(btn).toHaveProperty('ariaPressed', 'false');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <FlatButton variant="dunno" on onClick={onClick}>
        모르겠어요
      </FlatButton>,
    );
    expect(screen.getByRole('button').className).toBe('flat-btn dunno on');
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');
  });
});
