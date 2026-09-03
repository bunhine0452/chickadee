// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WhyGate } from './WhyGate';
import type { WhyGateProps } from './WhyGate';

afterEach(cleanup);

/** design/src/ink/data.js 의 `T1.why` 그대로. */
const CHOICES = [
  {
    t: '브라우저가 폼을 제출하며 <b>페이지를 새로 고치는 기본 동작</b>을 막으려고',
    ok: true,
    fb: '맞습니다. 이게 없으면 <code>await submit(...)</code> 이 끝나기도 전에 페이지가 통째로 다시 열립니다.',
  },
  { t: '로그인 버튼을 두 번 누르지 못하게 하려고', ok: false, fb: '그건 16행의 <code>disabled={pending}</code> 이 합니다.' },
  { t: '입력값을 비우려고', ok: false, fb: '입력값은 상태 갱신으로 비웁니다.' },
];

function props(over: Partial<WhyGateProps> = {}): WhyGateProps {
  return {
    q: '8행 <code>e.preventDefault()</code> 는 왜 필요할까요?',
    help: '한 줄이면 됩니다. 채점하지 않습니다. 다만 건너뛸 수는 없습니다.',
    orig: 'e.preventDefault()',
    text: '',
    onText: () => {},
    count: { ok: false, message: '0 / 10자' },
    choices: CHOICES,
    pick: null,
    onPick: () => {},
    onReveal: () => {},
    revealed: false,
    ...over,
  };
}

describe('WhyGate', () => {
  it('문항 · 도움말 · 원본 한 줄을 낸다', () => {
    const { container } = render(<WhyGate {...props()} />);
    expect(container.querySelector('.whybox h4')?.textContent).toBe('8행 e.preventDefault() 는 왜 필요할까요?');
    expect(container.querySelector('.whybox h4 code')?.textContent).toBe('e.preventDefault()');
    expect(container.querySelector('.whybox p')?.textContent).toContain('건너뛸 수는 없습니다');
    expect(container.querySelector('.whybox .code .ln span')?.textContent).toBe('e.preventDefault()');
  });

  it('입력 칸에는 이름이 있고, 고친 글은 그대로 올려보낸다', async () => {
    const onText = vi.fn();
    render(<WhyGate {...props({ onText })} />);
    const box = screen.getByRole('textbox', { name: '왜 이렇게 생겼는지 한 줄' });
    expect((box as HTMLTextAreaElement).placeholder).toContain('예: 브라우저가 폼을 보내면서');
    fireEvent.change(box, { target: { value: '새로 고침을 막는다' } });
    expect(onText).toHaveBeenCalledWith('새로 고침을 막는다');
  });

  it('검증은 부모가 한다 — 받은 문구와 ok 만 그린다', () => {
    const { container, rerender } = render(<WhyGate {...props()} />);
    expect(container.querySelector('.cnt')?.className).toBe('cnt');
    expect(container.querySelector('.cnt')?.textContent).toBe('0 / 10자');

    rerender(<WhyGate {...props({ count: { ok: true, message: '18 / 10자' } })} />);
    expect(container.querySelector('.cnt')?.className).toBe('cnt ok');
  });

  it('보기는 「보기 보기」를 누른 뒤에만 열린다', async () => {
    const onReveal = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<WhyGate {...props({ onReveal })} />);
    expect(screen.queryByRole('radiogroup')).toBeNull();

    await user.click(screen.getByRole('button', { name: '모르겠어요 · 보기 보기' }));
    expect(onReveal).toHaveBeenCalled();

    rerender(<WhyGate {...props({ onReveal, revealed: true })} />);
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('고른 번호는 0부터 세어 올려보낸다', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    render(<WhyGate {...props({ revealed: true, onPick })} />);
    await user.click(screen.getByRole('radio', { name: /두 번 누르지 못하게/ }));
    expect(onPick).toHaveBeenCalledWith(1);
  });

  it('고른 뒤에는 정답과 사유가 열리고 보기가 굳는다', () => {
    const { container } = render(<WhyGate {...props({ revealed: true, pick: 1 })} />);
    const chs = [...container.querySelectorAll('.ch')];
    expect(chs[0]?.className).toContain('right');
    expect(chs[1]?.className).toContain('wrong');
    expect(chs.every((el) => (el as HTMLButtonElement).disabled)).toBe(true);

    expect(chs[0]?.textContent).toContain('맞습니다.');
    expect(chs[1]?.textContent).toContain('그건 16행의');
    // 안 고른 오답의 사유는 아직 덮여 있다.
    expect(chs[2]?.textContent).not.toContain('상태 갱신으로 비웁니다');
  });

  it('보기를 본 뒤에도 자기 말 한 줄이 남는다', () => {
    const { container } = render(<WhyGate {...props({ revealed: true, pick: 0 })} />);
    const note = container.querySelector('.after-pick');
    expect(note?.textContent).toBe('이제 같은 내용을 위 칸에 자기 말로 한 줄만 옮겨 주세요. 답을 보고 써도 됩니다.');
    expect(note?.querySelector('b')?.textContent).toBe('이제 같은 내용을 위 칸에 자기 말로 한 줄만 옮겨 주세요.');
  });

  it('고르기 전에는 그 문구가 없다', () => {
    const { container } = render(<WhyGate {...props({ revealed: true })} />);
    expect(container.querySelector('.after-pick')).toBeNull();
  });
});
