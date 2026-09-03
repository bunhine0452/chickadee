// @vitest-environment jsdom
/**
 * 오늘의 인쇄 패널 (05 §5 · 정본 §3-5·§3-7).
 */
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { TodayPanel, type TodayPreview } from './TodayPanel';

const preview = (over: Partial<TodayPreview> = {}): TodayPreview => ({
  items: [
    { kind: 't0', label: '선택적 체이닝', mins: 0.5, sub: '복습', review: true },
    { kind: 't0', label: '배열 map', mins: 2, sub: '새 판', review: false },
  ],
  mins: 2.5,
  resumeAt: null,
  streak: 4,
  days: [0, 12, 0, 8, 15, 0, 0],
  ...over,
});

afterEach(cleanup);

describe('TodayPanel', () => {
  test('판 수와 예상 시간을 적는다', () => {
    render(<TodayPanel today={preview()} onStart={() => undefined} date="2026-09-03" />);
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByRole('button', { name: /인쇄 시작/ })).toBeTruthy();
  });

  test('진행바는 시간 비례다 — 칸 너비가 예상 시간이다 (정본 §3-5)', () => {
    const { container } = render(
      <TodayPanel today={preview()} onStart={() => undefined} date="2026-09-03" />,
    );
    const bars = [...container.querySelectorAll<HTMLElement>('.queue i')];
    expect(bars).toHaveLength(2);
    expect(bars[0]?.style.getPropertyValue('--w')).toBe('0.5');
    expect(bars[1]?.style.getPropertyValue('--w')).toBe('2');
  });

  test('이어 찍을 세션이 있으면 버튼 글이 바뀐다', () => {
    render(
      <TodayPanel today={preview({ resumeAt: 2 })} onStart={() => undefined} date="2026-09-03" />,
    );
    expect(screen.getByRole('button', { name: /이어 찍기 · 3번째 판부터/ })).toBeTruthy();
  });

  test('찍을 것이 없으면 버튼이 잠기고 이유를 적는다 (02 §5.3)', () => {
    render(
      <TodayPanel
        today={preview({ items: [], mins: 0 })}
        onStart={() => undefined}
        date="2026-09-03"
      />,
    );
    expect(screen.getByText(/오늘은 인쇄할 판이 없습니다/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /인쇄 시작/ }).hasAttribute('disabled')).toBe(true);
  });

  test('연속 인쇄는 숫자로만 적는다 — 끊겨도 연출이 없다 (정본 §3-7)', () => {
    const { container } = render(
      <TodayPanel today={preview({ streak: 0 })} onStart={() => undefined} date="2026-09-03" />,
    );
    expect(container.querySelector('.stampcard')?.textContent).toContain('연속 인쇄');
    expect(container.querySelectorAll('.cb-mini i.on')).toHaveLength(3);
  });

  test('누르면 콜백이 온다', async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    render(<TodayPanel today={preview()} onStart={onStart} date="2026-09-03" />);
    await user.click(screen.getByRole('button', { name: /인쇄 시작/ }));
    expect(onStart).toHaveBeenCalledOnce();
  });
});
