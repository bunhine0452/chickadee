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

/** 창이 감싸는 블록이 된 뒤의 판 (D141). 30줄이라 20줄 상한에 걸린다. */
const LONG: CodeLine[] = Array.from({ length: 30 }, (_, i) => ({
  n: 100 + i,
  t: `const v${i} = ${i}`,
  ...(i === 14 ? { target: true as const } : {}),
}));

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

describe('CodePlate — 20줄 접기 (D141)', () => {
  const visible = (root: HTMLElement) =>
    [...root.querySelectorAll('.ln[data-n]')].map((el) => Number(el.getAttribute('data-n')));

  it('20줄까지는 접지 않는다', () => {
    const { container } = render(<CodePlate lines={LONG.slice(0, 20)} />);
    expect(visible(container)).toHaveLength(20);
    expect(container.querySelectorAll('.unfold')).toHaveLength(0);
  });

  it('20줄을 넘으면 초점 둘레 20줄만 펴 두고 나머지를 접는다', () => {
    const { container } = render(<CodePlate lines={LONG} />);
    const shown = visible(container);
    expect(shown).toHaveLength(20);
    expect(shown).toContain(114); // 초점
    // 위아래로 갈라 접는다 — 한쪽으로 쏠리지 않는다.
    expect(container.querySelectorAll('.unfold')).toHaveLength(2);
    expect(shown[0]).toBe(105);
    expect(shown[19]).toBe(124);
  });

  it('접힌 줄 수를 그대로 적는다 — 위 5줄 · 아래 5줄', () => {
    const { container } = render(<CodePlate lines={LONG} />);
    const labels = [...container.querySelectorAll('.unfold')].map((el) => el.textContent);
    expect(labels).toEqual(['… 5줄 더', '… 5줄 더']);
  });

  it('초점이 맨 앞이면 위로는 접을 것이 없다', () => {
    const head: CodeLine[] = LONG.map((l, i) => (
      i === 0 ? { n: l.n, t: `const v${i} = ${i}`, target: true as const } : { n: l.n, t: `const v${i} = ${i}` }
    ));
    const { container } = render(<CodePlate lines={head} />);
    expect(container.querySelectorAll('.unfold')).toHaveLength(1);
    expect(visible(container)[0]).toBe(100);
  });

  it('펼치면 전부 보이고 접힘 자리 대신 접기 단추가 하나 남는다', async () => {
    const user = userEvent.setup();
    const { container } = render(<CodePlate lines={LONG} />);
    await user.click(container.querySelector('.unfold') as HTMLElement);
    expect(visible(container)).toHaveLength(30);
    expect(container.querySelectorAll('.unfold:not(.less)')).toHaveLength(0);
    expect(container.querySelector('.unfold.less')?.textContent).toBe('접기');
  });

  it('다시 접는다 — 편 판은 되돌아갈 길이 있다', async () => {
    const user = userEvent.setup();
    const { container } = render(<CodePlate lines={LONG} />);
    await user.click(container.querySelector('.unfold') as HTMLElement);
    await user.click(container.querySelector('.unfold.less') as HTMLElement);
    expect(visible(container)).toHaveLength(20);
    expect(container.querySelectorAll('.unfold')).toHaveLength(2);
  });

  it('접기도 키보드만으로 된다 — Space 로 펴고 Space 로 접는다 (05 §7)', async () => {
    const user = userEvent.setup();
    const { container } = render(<CodePlate lines={LONG} />);
    await user.tab();
    await user.keyboard('[Space]');
    // 편 뒤 포커스가 접기 단추로 옮겨 간다 — 손이 그 자리에 그대로 있다.
    expect(document.activeElement?.className).toContain('less');
    await user.keyboard('[Space]');
    expect(visible(container)).toHaveLength(20);
    expect(document.activeElement?.className).toContain('unfold');
    expect(document.activeElement?.className).not.toContain('less');
  });

  it('접을 수 없는 판에는 접기 단추도 없다', async () => {
    const user = userEvent.setup();
    const { container } = render(<CodePlate lines={LONG.slice(0, 20)} />);
    await user.tab();
    expect(container.querySelectorAll('.unfold')).toHaveLength(0);
  });

  it('키보드만으로 펼친다 — 탭으로 닿고 Space 로 펴진다 (05 §7)', async () => {
    const user = userEvent.setup();
    const { container } = render(<CodePlate lines={LONG} />);
    await user.tab();
    expect(document.activeElement?.className).toContain('unfold');
    await user.keyboard('[Space]');
    expect(visible(container)).toHaveLength(30);
  });

  it('펼침 단추의 키는 판 밖으로 새지 않는다 — Enter 가 「제출」로 올라가면 안 된다', async () => {
    const onDocKey = vi.fn();
    document.addEventListener('keydown', onDocKey);
    const user = userEvent.setup();
    const { container } = render(<CodePlate lines={LONG} pickable selected={null} />);
    (container.querySelector('.unfold') as HTMLButtonElement).focus();
    await user.keyboard('[Enter]');
    document.removeEventListener('keydown', onDocKey);
    expect(onDocKey).not.toHaveBeenCalled();
    expect(visible(container)).toHaveLength(30);
  });

  it('짚을 토큰은 접힘 뒤로 숨지 않는다', () => {
    const picky: CodeLine[] = LONG.map((l, i) => (i === 14
      ? { n: l.n, target: true as const, seg: [{ t: 'const n = ' }, { t: 'cart', pick: 1 }] }
      : l));
    const { container } = render(<CodePlate lines={picky} pickable selected={null} />);
    expect(container.querySelector('.tk[data-k="1"]')).not.toBeNull();
    expect(screen.getAllByRole('radio')).toHaveLength(1);
  });
});
