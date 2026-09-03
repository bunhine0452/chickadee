// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CodeLine } from '@chickadee/store-sql';

import { CodePlate } from './CodePlate';

afterEach(cleanup);

const PLAIN: CodeLine[] = [
  { n: 41, t: 'const cart = load();' },
  { n: 42, t: 'const n = cart?.items.length;', target: true },
];

const PICK: CodeLine[] = [
  { n: 42, seg: [{ t: 'const n = ' }, { t: 'cart', pick: 1 }, { t: '?.', pick: 2 }, { t: 'items', pick: 3 }, { t: ';' }] },
];

const BLANK: CodeLine[] = [{ n: 42, seg: [{ t: 'const n = cart' }, { hole: true }, { t: 'items;' }] }];

/** 짚을 수 있는 토큰에 포커스를 준다 — 키는 라디오에서 묶음으로 올라간다. */
function focusToken(root: HTMLElement, k: number): void {
  root.querySelector<HTMLButtonElement>(`.tk[data-k="${k}"]`)?.focus();
}

describe('CodePlate', () => {
  it('목업 클래스를 그대로 붙인다', () => {
    const { container } = render(<CodePlate lines={PLAIN} />);
    expect(container.querySelector('.code')).not.toBeNull();
    expect(container.querySelectorAll('.code .ln')).toHaveLength(2);
    expect(container.querySelector('.ln[data-n="42"]')?.className).toContain('hi');
  });

  it('줄번호와 코드 원문을 그대로 낸다', () => {
    const { container } = render(<CodePlate lines={PLAIN} />);
    const line = container.querySelector('.ln[data-n="41"]');
    expect(line?.querySelector('i')?.textContent).toBe('41');
    expect(line?.querySelector('span')?.textContent).toBe('const cart = load();');
  });

  it('구문 강조는 6클래스만 쓴다', () => {
    const { container } = render(<CodePlate lines={PLAIN} />);
    const classes = [...container.querySelectorAll('.code i')]
      .map((el) => el.className)
      .filter((c) => c !== '');
    expect(classes.length).toBeGreaterThan(0);
    expect(classes.every((c) => ['k', 's', 'n', 'c', 'p', 'f'].includes(c))).toBe(true);
  });

  it('읽기 전용 판은 라디오 묶음이 아니다', () => {
    render(<CodePlate lines={PLAIN} />);
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

  it('pickable 이면 「짚을 곳」 라디오 묶음이 된다', () => {
    render(<CodePlate lines={PICK} pickable selected={null} />);
    expect(screen.getByRole('radiogroup', { name: '짚을 곳' })).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('← → 로 토큰을 옮긴다', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<CodePlate lines={PICK} pickable selected={2} onPick={onPick} />);

    focusToken(container, 2);
    await user.keyboard('{ArrowRight}');
    expect(onPick).toHaveBeenLastCalledWith(3);

    await user.keyboard('{ArrowLeft}');
    expect(onPick).toHaveBeenLastCalledWith(1);
  });

  it('→ 는 끝에서 처음으로 돈다', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<CodePlate lines={PICK} pickable selected={3} onPick={onPick} />);

    focusToken(container, 3);
    await user.keyboard('{ArrowRight}');
    expect(onPick).toHaveBeenLastCalledWith(1);
  });

  it('아직 안 짚었으면 → 는 첫 토큰, ← 는 마지막 토큰', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<CodePlate lines={PICK} pickable selected={null} onPick={onPick} />);

    focusToken(container, 1);
    await user.keyboard('{ArrowRight}');
    expect(onPick).toHaveBeenLastCalledWith(1);

    await user.keyboard('{ArrowLeft}');
    expect(onPick).toHaveBeenLastCalledWith(3);
  });

  it('1~4 로 바로 짚는다 — 물리 키(e.code)로 판정한다', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<CodePlate lines={PICK} pickable selected={null} onPick={onPick} />);

    focusToken(container, 1);
    await user.keyboard('[Digit2]');
    expect(onPick).toHaveBeenLastCalledWith(2);
  });

  it('없는 번호를 눌러도 아무 일이 없다', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<CodePlate lines={PICK} pickable selected={null} onPick={onPick} />);

    focusToken(container, 1);
    await user.keyboard('[Digit4]');
    expect(onPick).not.toHaveBeenCalled();
  });

  it('채점되면 판이 굳는다 — pickable 클래스가 빠지고 라디오가 잠긴다', () => {
    const onPick = vi.fn();
    const { container } = render(<CodePlate lines={PICK} pickable selected={1} answer={2} onPick={onPick} />);

    const code = container.querySelector<HTMLElement>('.code');
    expect(code?.className).not.toContain('pickable');
    expect(screen.getAllByRole('radio').every((el) => (el as HTMLButtonElement).disabled)).toBe(true);

    fireEvent.keyDown(code as HTMLElement, { code: 'ArrowRight', key: 'ArrowRight' });
    fireEvent.keyDown(code as HTMLElement, { code: 'Digit2', key: '2' });
    expect(onPick).not.toHaveBeenCalled();
  });

  it('채점 뒤 정답에 right, 내가 짚은 어긋난 자리에 wrong 이 붙는다', () => {
    const { container } = render(<CodePlate lines={PICK} pickable selected={1} answer={2} />);
    expect(container.querySelector('.tk[data-k="2"]')?.className).toContain('right');
    expect(container.querySelector('.tk[data-k="1"]')?.className).toContain('wrong');
    expect(container.querySelector('.tk[data-k="3"]')?.className).not.toContain('wrong');
  });

  it('빈칸은 판에 뚫린 자리로 그린다', () => {
    const { container } = render(<CodePlate lines={BLANK} hole={{ value: '?.', state: 'filled' }} />);
    const hole = container.querySelector('.hole');
    expect(hole?.textContent).toBe('?.');
    expect(hole?.className).toContain('filled');
  });
});
