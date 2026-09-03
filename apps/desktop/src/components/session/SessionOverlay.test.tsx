// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SessionOverlay } from './SessionOverlay';

afterEach(cleanup);

/** Esc 4단계를 한자리에서 보기 위한 최소 무대. 사다리와 입력 칸이 함께 있다. */
function Stage(props: {
  lifer?: boolean;
  ladderOpen?: boolean;
  onCloseLifer?: () => void;
  onCloseLadder?: () => void;
  onExit: () => void;
}) {
  return (
    <SessionOverlay
      band={<div>작업 띠</div>}
      lifer={props.lifer === true ? <div data-testid="veil">LIFER</div> : undefined}
      onCloseLifer={props.onCloseLifer}
      ladderOpen={props.ladderOpen}
      onCloseLadder={props.onCloseLadder}
      onExit={props.onExit}
    >
      <button type="button" className="flat-btn dunno">
        모르겠어요
      </button>
      <section className="reprint" aria-label="다시 찍기 사다리">
        <button type="button" className="rung">
          1단
        </button>
        <textarea aria-label="막힌 지점" />
      </section>
      <button type="button">확인</button>
    </SessionOverlay>
  );
}

describe('SessionOverlay', () => {
  it('교정쇄 대화상자다 — 홈은 그 밖에 남는다', () => {
    render(<Stage onExit={() => undefined} />);
    const dialog = screen.getByRole('dialog', { name: '교정쇄' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.className).toContain('proof');
    expect(dialog.querySelector('main.bench')).not.toBeNull();
  });

  describe('Esc 4단계 (05 §2.3)', () => {
    it('① 입력 중이면 입력에서만 빠져나온다', async () => {
      const onExit = vi.fn();
      const onCloseLadder = vi.fn();
      const user = userEvent.setup();
      render(<Stage ladderOpen onCloseLadder={onCloseLadder} onExit={onExit} />);

      const box = screen.getByLabelText('막힌 지점');
      box.focus();
      await user.keyboard('{Escape}');

      expect(document.activeElement).not.toBe(box);
      expect(onCloseLadder).not.toHaveBeenCalled();
      expect(onExit).not.toHaveBeenCalled();
    });

    it('② LIFER 가 열려 있으면 베일만 닫는다', async () => {
      const onExit = vi.fn();
      const onCloseLifer = vi.fn();
      const onCloseLadder = vi.fn();
      const user = userEvent.setup();
      render(<Stage lifer ladderOpen onCloseLifer={onCloseLifer} onCloseLadder={onCloseLadder} onExit={onExit} />);

      await user.keyboard('{Escape}');

      expect(onCloseLifer).toHaveBeenCalledTimes(1);
      expect(onCloseLadder).not.toHaveBeenCalled();
      expect(onExit).not.toHaveBeenCalled();
    });

    it('③ 포커스가 사다리 안이면 사다리를 접고 「모르겠어요」로 보낸다', async () => {
      const onExit = vi.fn();
      const onCloseLadder = vi.fn();
      const user = userEvent.setup();
      const { container } = render(<Stage ladderOpen onCloseLadder={onCloseLadder} onExit={onExit} />);

      container.querySelector<HTMLButtonElement>('.rung')?.focus();
      await user.keyboard('{Escape}');

      expect(onCloseLadder).toHaveBeenCalledTimes(1);
      expect(onExit).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(container.querySelector('.dunno'));
    });

    it('③ 사다리가 열려 있어도 포커스가 밖이면 나가기로 간다', async () => {
      const onExit = vi.fn();
      const onCloseLadder = vi.fn();
      const user = userEvent.setup();
      const { container } = render(<Stage ladderOpen onCloseLadder={onCloseLadder} onExit={onExit} />);

      container.querySelector<HTMLButtonElement>('.dunno')?.focus();
      await user.keyboard('{Escape}');

      expect(onCloseLadder).not.toHaveBeenCalled();
      expect(onExit).toHaveBeenCalledTimes(1);
    });

    it('④ 그 밖에는 확인 모달 없이 바로 나간다', async () => {
      const onExit = vi.fn();
      const user = userEvent.setup();
      render(<Stage onExit={onExit} />);

      await user.keyboard('{Escape}');
      expect(onExit).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });

    it('네 단계는 한 번에 한 겹씩만 벗겨진다', async () => {
      const onExit = vi.fn();
      const onCloseLifer = vi.fn();
      const onCloseLadder = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(
        <Stage lifer ladderOpen onCloseLifer={onCloseLifer} onCloseLadder={onCloseLadder} onExit={onExit} />,
      );

      // ① 입력 중
      screen.getByLabelText('막힌 지점').focus();
      await user.keyboard('{Escape}');
      expect([onCloseLifer.mock.calls.length, onCloseLadder.mock.calls.length, onExit.mock.calls.length]).toEqual([0, 0, 0]);

      // ② LIFER
      await user.keyboard('{Escape}');
      expect([onCloseLifer.mock.calls.length, onCloseLadder.mock.calls.length, onExit.mock.calls.length]).toEqual([1, 0, 0]);

      // ③ 사다리 (베일이 닫힌 뒤, 포커스는 사다리 안)
      rerender(<Stage ladderOpen onCloseLifer={onCloseLifer} onCloseLadder={onCloseLadder} onExit={onExit} />);
      screen.getByRole('button', { name: '1단' }).focus();
      await user.keyboard('{Escape}');
      expect([onCloseLifer.mock.calls.length, onCloseLadder.mock.calls.length, onExit.mock.calls.length]).toEqual([1, 1, 0]);

      // ④ 나가기
      rerender(<Stage onCloseLifer={onCloseLifer} onCloseLadder={onCloseLadder} onExit={onExit} />);
      await user.keyboard('{Escape}');
      expect([onCloseLifer.mock.calls.length, onCloseLadder.mock.calls.length, onExit.mock.calls.length]).toEqual([1, 1, 1]);
    });
  });

  describe('포커스 트랩', () => {
    it('마지막에서 Tab 을 누르면 처음으로 돈다', async () => {
      const user = userEvent.setup();
      const { container } = render(<Stage onExit={() => undefined} />);

      const items = [...container.querySelectorAll<HTMLElement>('button, textarea')];
      const last = items[items.length - 1] as HTMLElement;
      last.focus();
      await user.keyboard('{Tab}');

      expect(document.activeElement).toBe(items[0]);
    });

    it('처음에서 Shift+Tab 을 누르면 마지막으로 돈다', async () => {
      const user = userEvent.setup();
      const { container } = render(<Stage onExit={() => undefined} />);

      const items = [...container.querySelectorAll<HTMLElement>('button, textarea')];
      (items[0] as HTMLElement).focus();
      await user.keyboard('{Shift>}{Tab}{/Shift}');

      expect(document.activeElement).toBe(items[items.length - 1]);
    });
  });
});
