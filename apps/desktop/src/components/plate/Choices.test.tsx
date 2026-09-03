// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Choices } from './Choices';
import type { ChoiceOption } from './Choices';

afterEach(cleanup);

const OPTIONS: ChoiceOption[] = [
  { t: '앞이 <b>null</b> 이면 뒤를 건너뛴다' },
  { t: '언제나 뒤를 평가한다' },
  { t: 'cart?.items', mono: true },
];

function focusChoice(root: HTMLElement, k: number): void {
  root.querySelector<HTMLButtonElement>(`.ch[data-k="${k}"]`)?.focus();
}

describe('Choices', () => {
  it('목업 클래스를 그대로 붙인다', () => {
    const { container } = render(<Choices options={OPTIONS} selected={null} />);
    expect(container.querySelector('.choices')).not.toBeNull();
    expect(container.querySelectorAll('.ch')).toHaveLength(3);
    expect(container.querySelector('.ch[data-k="3"]')?.className).toContain('code-choice');
  });

  it('보기 묶음이고 보기마다 라디오다', () => {
    render(<Choices options={OPTIONS} selected={2} />);
    expect(screen.getByRole('radiogroup', { name: '보기' })).toBeTruthy();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(radios[1]?.getAttribute('aria-checked')).toBe('true');
    expect(radios[0]?.getAttribute('aria-checked')).toBe('false');
  });

  it('번호는 글자로도 보인다 — 색만으로 고르지 않는다', () => {
    const { container } = render(<Choices options={OPTIONS} selected={null} />);
    expect([...container.querySelectorAll('.ch .n')].map((el) => el.textContent)).toEqual(['1', '2', '3']);
  });

  it('1~4 로 바로 고른다', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<Choices options={OPTIONS} selected={null} onSelect={onSelect} />);

    focusChoice(container, 1);
    await user.keyboard('[Digit3]');
    expect(onSelect).toHaveBeenLastCalledWith(3);
  });

  it('보기 수를 넘는 번호는 무시한다', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<Choices options={OPTIONS} selected={null} onSelect={onSelect} />);

    focusChoice(container, 1);
    await user.keyboard('[Digit4]');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('↑↓ 로 옮기고 끝에서 돈다', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<Choices options={OPTIONS} selected={3} onSelect={onSelect} />);

    focusChoice(container, 3);
    await user.keyboard('{ArrowDown}');
    expect(onSelect).toHaveBeenLastCalledWith(1);

    await user.keyboard('{ArrowUp}');
    expect(onSelect).toHaveBeenLastCalledWith(2);
  });

  it('눌러서도 고른다', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Choices options={OPTIONS} selected={null} onSelect={onSelect} />);

    await user.click(screen.getAllByRole('radio')[1] as HTMLElement);
    expect(onSelect).toHaveBeenCalledWith(2);
  });

  it('채점되면 굳는다 — 정답에 right, 고른 어긋남에 wrong', () => {
    const { container } = render(<Choices options={OPTIONS} selected={2} answer={1} />);
    expect(container.querySelector('.ch[data-k="1"]')?.className).toContain('right');
    expect(container.querySelector('.ch[data-k="2"]')?.className).toContain('wrong');
    expect(screen.getAllByRole('radio').every((el) => (el as HTMLButtonElement).disabled)).toBe(true);
  });

  it('채점 뒤에는 키가 먹지 않는다', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<Choices options={OPTIONS} selected={2} answer={1} onSelect={onSelect} />);

    container.querySelector<HTMLElement>('.choices')?.focus();
    await user.keyboard('[Digit3]');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('한 칸짜리 목록은 .one 으로만 갈린다', () => {
    const { container } = render(<Choices options={OPTIONS} selected={null} one />);
    expect(container.querySelector('.choices')?.className).toContain('one');
  });

  it('서식 보기는 정화해 그리고 mono 보기는 원문 그대로 둔다', () => {
    const { container } = render(<Choices options={[{ t: '<b>굵게</b><script>x</script>' }, { t: '<b>a</b>', mono: true }]} selected={null} />);
    expect(container.querySelector('.ch[data-k="1"] b')?.textContent).toBe('굵게');
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('.ch[data-k="2"] .t')?.textContent).toBe('<b>a</b>');
  });
});
