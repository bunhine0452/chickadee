// @vitest-environment jsdom
/**
 * 의존성 방향 5문항 (04 §8.3 · D107).
 *
 * 보기는 T0 의 `Choices` 를 그대로 쓴다 — 그래서 여기서 보는 것은 보기 상자 자체가 아니라
 * **묶음이 문항마다 따로 도는가**이다: 3번 문항에서 `2` 를 눌렀을 때 1번 문항이 안 바뀌어야
 * 하고, 고른 값이 `gradeDirection` 이 읽는 0~3 으로 나가야 한다.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { DirectionQuiz } from './DirectionQuiz';

const PAIRS = [
  { a: 'app/cart/page.tsx', b: 'features/cart/CartSheet.tsx' },
  { a: 'features/cart/CartSheet.tsx', b: 'features/cart/useCart.ts' },
  { a: 'features/cart/useCart.ts', b: 'features/cart/cartApi.ts' },
  { a: 'features/cart/cartApi.ts', b: 'app/api/cart/route.ts' },
  { a: 'app/api/cart/route.ts', b: 'server/cartRepo.ts' },
] as const;

afterEach(cleanup);

const groups = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>('.dquiz .choices')];

describe('문항 묶음', () => {
  test('5문항이 한 화면에 세로로 쌓인다 — 문항마다 4지다', () => {
    render(<DirectionQuiz pairs={PAIRS} picks={[]} onPick={vi.fn()} />);
    expect(document.querySelectorAll('.dq')).toHaveLength(5);
    expect(groups()).toHaveLength(5);
    for (const g of groups()) expect(g.querySelectorAll('.ch')).toHaveLength(4);
  });

  test('물음은 결과 줄과 같은 「A ↔ B」 모양이다', () => {
    render(<DirectionQuiz pairs={PAIRS} picks={[]} onPick={vi.fn()} />);
    expect(screen.getByText(/page\.tsx ↔ CartSheet\.tsx/)).toBeTruthy();
  });

  test('4지는 04 §8.3 그대로 — A→B · B→A · 양쪽 · 무관', () => {
    render(<DirectionQuiz pairs={[PAIRS[0]]} picks={[]} onPick={vi.fn()} />);
    expect([...groups()[0]!.querySelectorAll('.ch .t')].map((el) => el.textContent)).toEqual([
      'page.tsx → CartSheet.tsx',
      'CartSheet.tsx → page.tsx',
      '양쪽',
      '무관',
    ]);
  });
});

describe('고르기', () => {
  test('보기를 누르면 문항 번호와 0~3 이 나간다 (`gradeDirection` 의 `picks`)', () => {
    const onPick = vi.fn();
    render(<DirectionQuiz pairs={PAIRS} picks={[]} onPick={onPick} />);
    fireEvent.click(groups()[2]!.querySelectorAll('.ch')[1] as HTMLElement);
    expect(onPick).toHaveBeenCalledWith(2, 1);
  });

  test('물리 키 `1~4` 가 그 문항에만 든다 (05 §7 · `Choices` 재사용)', () => {
    const onPick = vi.fn();
    render(<DirectionQuiz pairs={PAIRS} picks={[]} onPick={onPick} />);
    fireEvent.keyDown(groups()[4] as HTMLElement, { code: 'Digit3' });
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith(4, 2);
  });

  test('이미 고른 문항만 눌린 채로 그려진다 — 구멍은 빈 채로 둔다', () => {
    render(<DirectionQuiz pairs={PAIRS} picks={[undefined, 3, undefined, 0]} onPick={vi.fn()} />);
    const checked = groups().map((g) =>
      [...g.querySelectorAll('.ch')].findIndex((c) => c.getAttribute('aria-checked') === 'true'));
    expect(checked).toEqual([-1, 3, -1, 0, -1]);
  });

  test('`onPick` 이 없으면 눌러도 아무 일도 없다', () => {
    render(<DirectionQuiz pairs={[PAIRS[0]]} picks={[]} />);
    fireEvent.click(groups()[0]!.querySelectorAll('.ch')[0] as HTMLElement);
    expect(document.querySelectorAll('.ch[aria-checked="true"]')).toHaveLength(0);
  });
});
