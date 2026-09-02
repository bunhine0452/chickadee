// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';

import { TimeQueue, type QueueItem } from './TimeQueue.js';

afterEach(cleanup);

const items: QueueItem[] = [
  { kind: 't0', label: '함수형 업데이트', mins: 0.5, sub: '복습', review: true },
  { kind: 't1', label: 'LoginForm 필사', mins: 9 },
  { kind: 't2', label: 'cart/ 폴더 책임', mins: 3 },
];

describe('시간 비례 큐', () => {
  test('칸의 너비가 시간에 비례한다 — 30초 칸과 9분 칸이 같으면 거짓말이다', () => {
    const { container } = render(<TimeQueue items={items} pos={0} />);
    const widths = [...container.querySelectorAll('.queue i')].map((el) =>
      (el as HTMLElement).style.getPropertyValue('--w'));
    expect(widths).toEqual(['0.5', '9', '3']);
  });

  test('읽을 수 있는 한 문장으로 자기를 설명한다', () => {
    render(<TimeQueue items={items} pos={1} progress={0.5} />);
    const bar = screen.getByRole('img');
    // 0.5 + 4.5 = 5 분 / 12.5 분 = 40%
    expect(bar.getAttribute('aria-label')).toBe('3칸 중 2번째 「LoginForm 필사」, 전체의 40%');
  });

  test('지나온 칸과 남은 칸이 구분된다', () => {
    const { container } = render(<TimeQueue items={items} pos={1} />);
    const states = [...container.querySelectorAll('.queue i')].map((el) =>
      el.getAttribute('data-state'));
    expect(states).toEqual(['done', 'now', 'later']);
  });

  test('다시 찍기 칸은 점무늬로 구분한다 — 색을 하나 더 만들지 않는다', () => {
    const { container } = render(<TimeQueue items={items} pos={0} />);
    expect(container.querySelector('.queue i.review')).not.toBeNull();
  });

  test('총량을 모르면 칸만 옮긴다', () => {
    render(<TimeQueue items={items} pos={2} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toMatch(/3번째/);
  });

  test('전부 끝나면 그렇게 말한다', () => {
    render(<TimeQueue items={items} pos={3} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('3칸 모두 끝남');
  });

  test('labels 를 켜면 이름과 시간이 함께 나온다', () => {
    render(<TimeQueue items={items} pos={0} labels />);
    expect(screen.getByText('LoginForm 필사')).toBeDefined();
    expect(screen.getByText('30초')).toBeDefined();
    expect(screen.getByText('9분')).toBeDefined();
  });

  test('칸이 하나도 없어도 깨지지 않는다', () => {
    render(<TimeQueue items={[]} pos={0} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('0칸 모두 끝남');
  });
});
