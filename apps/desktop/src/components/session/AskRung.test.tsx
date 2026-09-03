// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AskRung } from './AskRung';

afterEach(cleanup);

const BASE = {
  text: '',
  onText: () => undefined,
  onBuild: () => undefined,
  onCopy: () => undefined,
};

describe('AskRung', () => {
  it('목업 클래스를 그대로 붙이고 입력 칸에 이름을 준다', () => {
    const { container } = render(<AskRung {...BASE} />);
    expect(container.querySelector('.askbox')).not.toBeNull();
    expect(screen.getByLabelText('막힌 지점')).toBeTruthy();
  });

  it('무엇을 담고 무엇을 안 담는지 그 자리에 적는다', () => {
    const { container } = render(<AskRung {...BASE} />);
    expect(container.textContent).toContain('이 줄과 앞뒤 4줄만');
    expect(container.textContent).toContain('아무것도 스스로 전송하지 않습니다');
  });

  it('입력은 위로 올린다 — 상태를 스스로 들지 않는다', async () => {
    const onText = vi.fn();
    const user = userEvent.setup();
    render(<AskRung {...BASE} onText={onText} />);

    await user.type(screen.getByLabelText('막힌 지점'), 'ab');
    expect(onText).toHaveBeenCalledTimes(2);
  });

  it('프롬프트가 없으면 「복사」가 잠긴다', () => {
    render(<AskRung {...BASE} />);
    expect(screen.getByRole('button', { name: '복사' })).toHaveProperty('disabled', true);
  });

  it('프롬프트가 생기면 그대로 보여 주고 복사가 열린다', () => {
    const { container } = render(<AskRung {...BASE} prompt={'파일 cart.ts 42행\n막힌 지점: ...'} />);
    expect(container.querySelector('.prompt-out')?.textContent).toContain('파일 cart.ts 42행');
    expect(screen.getByRole('button', { name: '복사' })).toHaveProperty('disabled', false);
  });

  it('「프롬프트 만들기」와 「복사」는 콜백만 부른다 — 클립보드는 여기서 쓰지 않는다', async () => {
    const onBuild = vi.fn();
    const onCopy = vi.fn();
    const user = userEvent.setup();
    render(<AskRung {...BASE} prompt="만들어진 프롬프트" onBuild={onBuild} onCopy={onCopy} />);

    await user.click(screen.getByRole('button', { name: '프롬프트 만들기' }));
    await user.click(screen.getByRole('button', { name: '복사' }));

    expect(onBuild).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledTimes(1);
  });
});
