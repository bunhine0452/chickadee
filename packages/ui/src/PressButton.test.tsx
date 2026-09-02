// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PressButton } from './PressButton';

afterEach(cleanup);

describe('PressButton', () => {
  it('키 캡을 곁들이고 눌리면 알린다', () => {
    const onClick = vi.fn();
    render(
      <PressButton kbd="Enter" onClick={onClick}>
        인쇄 시작
      </PressButton>,
    );
    const btn = screen.getByRole('button', { name: /인쇄 시작/ });
    expect(btn.className).toBe('press-btn');
    expect(btn.querySelector('kbd.k')?.textContent).toBe('Enter');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('청판 버튼은 .blue, 눌린 포즈는 .down', () => {
    render(
      <PressButton tone="blue" down>
        이 판 찍기
      </PressButton>,
    );
    expect(screen.getByRole('button').className).toBe('press-btn blue down');
  });

  it('disabled 면 클릭이 흐르지 않는다', () => {
    const onClick = vi.fn();
    render(
      <PressButton disabled onClick={onClick}>
        제출
      </PressButton>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
