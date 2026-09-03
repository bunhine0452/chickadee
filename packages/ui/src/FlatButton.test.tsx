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

describe('onHold (05 §7 「원본 잠깐 보기」)', () => {
  it('누르고 있는 동안만 참이고 떼면 거짓이다', () => {
    const seen: boolean[] = [];
    render(<FlatButton variant="dunno" onHold={(down) => seen.push(down)}>잠깐 보기</FlatButton>);
    const btn = screen.getByRole('button');
    fireEvent.mouseDown(btn);
    fireEvent.mouseUp(btn);
    expect(seen).toStrictEqual([true, false]);
  });

  it('버튼을 벗어나도 풀린다 — 안 풀면 원본이 계속 보인다', () => {
    const seen: boolean[] = [];
    render(<FlatButton variant="dunno" onHold={(down) => seen.push(down)}>잠깐 보기</FlatButton>);
    const btn = screen.getByRole('button');
    fireEvent.mouseDown(btn);
    fireEvent.mouseLeave(btn);
    expect(seen).toStrictEqual([true, false]);
  });

  it('키를 누르고 있어도 한 번만 켜진다 — 횟수를 세는 쪽이 그것을 기대한다', () => {
    const seen: boolean[] = [];
    render(<FlatButton variant="dunno" onHold={(down) => seen.push(down)}>잠깐 보기</FlatButton>);
    const btn = screen.getByRole('button');
    fireEvent.keyDown(btn, { code: 'Space' });
    fireEvent.keyDown(btn, { code: 'Space', repeat: true });
    fireEvent.keyUp(btn, { code: 'Space' });
    expect(seen).toStrictEqual([true, false]);
  });

  it('onHold 가 없으면 마우스 핸들러를 달지 않는다', () => {
    const onClick = vi.fn();
    render(<FlatButton onClick={onClick}>확인</FlatButton>);
    fireEvent.mouseDown(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
