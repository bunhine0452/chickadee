// @vitest-environment jsdom
/**
 * 흐름 추적 덱의 **마우스 0 주행** (정본 §3-8 · 05 §7 · 04 §8.3).
 *
 * 여기서 보는 것은 「드래그 없이 순서가 세워지는가」다 — 자리를 옮기는 것도, 덱에서 꺼내는
 * 것도, 도로 넣는 것도 전부 버튼이라 Tab 과 Enter 만으로 판이 끝난다. 자리를 옮긴 뒤
 * 포커스가 따라가는지도 여기서 고정한다(안 따라가면 두 번째 이동부터 마우스가 필요하다).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { FlowDeck } from './FlowDeck';

const A = 'app/cart/page.tsx';
const B = 'features/cart/CartSheet.tsx';
const C = 'features/cart/useCart.ts';
const D = 'lib/format.ts';
const DECK = [A, B, C, D];

afterEach(cleanup);

/** 부모가 순서를 들고 있는 진짜 배치. 옮김이 실제로 먹히는지 보려면 상태가 있어야 한다. */
function Harness({ start = [] as readonly string[] }) {
  const [ordered, setOrdered] = useState<readonly string[]>(start);
  return <FlowDeck deck={DECK} ordered={ordered} onOrder={setOrdered} />;
}

const seats = (): string[] =>
  [...document.querySelectorAll('.fcard .nm')].map((el) => el.textContent ?? '');

describe('덱에서 꺼내 세우기', () => {
  test('아무것도 안 세웠으면 그 사실을 적고 덱을 다 낸다', () => {
    render(<FlowDeck deck={DECK} ordered={[]} onOrder={vi.fn()} />);
    expect(screen.getByText(/아직 세운 카드가 없습니다/)).toBeTruthy();
    expect(document.querySelectorAll('.frest .add')).toHaveLength(4);
    expect(document.querySelectorAll('.fcard')).toHaveLength(0);
  });

  test('「세우기」는 경로 **끝**에 붙인다 — 넣은 차례가 곧 순서다', () => {
    const onOrder = vi.fn();
    render(<FlowDeck deck={DECK} ordered={[A]} onOrder={onOrder} />);
    fireEvent.click(screen.getByRole('button', { name: /useCart\.ts — 경로 2번째로 세우기/ }));
    expect(onOrder).toHaveBeenCalledWith([A, C]);
  });

  test('세운 카드는 덱에서 빠진다 — 같은 파일을 두 번 세울 수 없다', () => {
    render(<FlowDeck deck={DECK} ordered={[A, C]} onOrder={vi.fn()} />);
    expect([...document.querySelectorAll('.frest .add')].map((el) => el.textContent))
      .toEqual(['CartSheet.tsx', 'format.ts']);
  });

  test('덱을 다 쓰면 그 사실을 적는다', () => {
    render(<FlowDeck deck={[A]} ordered={[A]} onOrder={vi.fn()} />);
    expect(screen.getByText('남은 카드가 없습니다.')).toBeTruthy();
  });
});

describe('자리 옮기기 — 키보드만으로', () => {
  test('↑ 가 앞자리와 바꾼다', () => {
    render(<Harness start={[A, B, C]} />);
    fireEvent.click(screen.getByRole('button', { name: /useCart\.ts — 3개 중 3번째\. 위로/ }));
    expect(seats()).toEqual(['page.tsx', 'useCart.ts', 'CartSheet.tsx']);
  });

  test('↓ 가 뒷자리와 바꾼다', () => {
    render(<Harness start={[A, B, C]} />);
    fireEvent.click(screen.getByRole('button', { name: /page\.tsx — 3개 중 1번째\. 아래로/ }));
    expect(seats()).toEqual(['CartSheet.tsx', 'page.tsx', 'useCart.ts']);
  });

  test('버튼 이름이 지금 자리와 총 개수를 말한다 (05 §9 — 화살표만으로는 안 읽힌다)', () => {
    render(<FlowDeck deck={DECK} ordered={[A, B]} onOrder={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'CartSheet.tsx — 2개 중 2번째. 위로 옮기기' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'page.tsx — 경로에서 빼기' })).toBeTruthy();
  });

  test('끝자리에서는 그 방향이 잠긴다', () => {
    render(<FlowDeck deck={DECK} ordered={[A, B]} onOrder={vi.fn()} />);
    const up = screen.getByRole('button', { name: /page\.tsx — 2개 중 1번째\. 위로/ });
    const down = screen.getByRole('button', { name: /CartSheet\.tsx — 2개 중 2번째\. 아래로/ });
    expect(up.hasAttribute('disabled')).toBe(true);
    expect(down.hasAttribute('disabled')).toBe(true);
  });

  test('옮긴 뒤 포커스가 그 카드를 따라간다 — 안 그러면 두 번째 이동에 마우스가 필요하다', () => {
    render(<Harness start={[A, B, C]} />);
    const down = screen.getByRole('button', { name: /page\.tsx — 3개 중 1번째\. 아래로/ });
    down.focus();
    fireEvent.click(down);
    expect(seats()).toEqual(['CartSheet.tsx', 'page.tsx', 'useCart.ts']);
    expect(document.activeElement?.getAttribute('aria-label'))
      .toBe('page.tsx — 3개 중 2번째. 아래로 옮기기');
  });

  test('끝자리에 닿아 버튼이 잠기면 반대쪽 버튼으로 포커스를 넘긴다', () => {
    render(<Harness start={[A, B]} />);
    const down = screen.getByRole('button', { name: /page\.tsx — 2개 중 1번째\. 아래로/ });
    down.focus();
    fireEvent.click(down);
    expect(document.activeElement?.getAttribute('aria-label'))
      .toBe('page.tsx — 2개 중 2번째. 위로 옮기기');
  });
});

describe('경로에서 빼기', () => {
  test('뺀 카드는 덱으로 돌아간다', () => {
    render(<Harness start={[A, B]} />);
    fireEvent.click(screen.getByRole('button', { name: 'page.tsx — 경로에서 빼기' }));
    expect(seats()).toEqual(['CartSheet.tsx']);
    expect([...document.querySelectorAll('.frest .add')].map((el) => el.textContent))
      .toEqual(['page.tsx', 'useCart.ts', 'format.ts']);
  });
});

describe('읽기 전용', () => {
  test('`onOrder` 가 없으면 모든 버튼이 잠긴다', () => {
    render(<FlowDeck deck={DECK} ordered={[A, B]} />);
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('.fdeck button')];
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons.every((b) => b.hasAttribute('disabled'))).toBe(true);
  });
});
