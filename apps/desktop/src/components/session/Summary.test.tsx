// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Summary } from './Summary';
import type { SummaryShift } from './Summary';

afterEach(cleanup);

const RESULTS: SummaryShift[] = [
  { conceptId: 'ts/optional', concept: '옵셔널 체이닝', code: '?.', track: 't0', lyFrom: 2, lyTo: 3, next: '11일 뒤' },
  { conceptId: 'ts/nullish', concept: '없을 때의 기본값', code: '??', track: 't0', lyFrom: 3, lyTo: 2, next: '오늘 안에' },
  { conceptId: 'fn/format', concept: 'formatPrice', code: 'fn', track: 't1', lyFrom: 1, lyTo: 2, next: '3일 뒤', extra: ' · 12줄 중 11줄 의미 일치' },
];

const BASE = {
  runNo: 'Run 08',
  repo: 'cart-shop-web',
  date: '2026-09-03',
  day: '03',
  results: RESULTS,
  printed: 5,
  ok: 4,
  mins: 15,
  streak: 7,
  tomorrow: '<b>내일은 <code>async / await</code> 부터</b> 시작합니다.',
};

describe('Summary', () => {
  it('목업 클래스를 그대로 붙인다', () => {
    const { container } = render(<Summary {...BASE} onHome={() => undefined} />);
    for (const cls of ['.done-head', '.tally', '.shifts', '.streak-line', '.hintbox', '.acts']) {
      expect(container.querySelector(cls), cls).not.toBeNull();
    }
  });

  it('집계 네 칸을 숫자로 적는다', () => {
    const { container } = render(<Summary {...BASE} onHome={() => undefined} />);
    const cells = [...container.querySelectorAll('.tally > div')].map((el) => el.textContent);
    expect(cells[0]).toContain('5판');
    expect(cells[1]).toContain('4 / 5');
    expect(cells[2]).toContain('15분');
    expect(cells[3]).toContain('7일');
  });

  it('겹으로 센다 — 오른 판 · 내린 판 · 제자리', () => {
    const { container } = render(<Summary {...BASE} onHome={() => undefined} />);
    const rows = [...container.querySelectorAll('.shift')];
    expect(rows).toHaveLength(3);
    expect(rows[0]?.textContent).toContain('+1겹');
    expect(rows[1]?.textContent).toContain('−1겹 · 다시 찍기');
    expect(rows[2]?.textContent).toContain('12줄 중 11줄 의미 일치');
  });

  it('겹 이름은 평문으로 병기한다', () => {
    const { container } = render(<Summary {...BASE} onHome={() => undefined} />);
    expect(container.querySelector('.shift')?.textContent).toContain('먹판 → + 청판');
  });

  it('다음 인쇄가 코앞인 판만 soon 이 붙는다', () => {
    const { container } = render(<Summary {...BASE} onHome={() => undefined} />);
    const nexts = [...container.querySelectorAll('.shift .next')];
    expect(nexts[0]?.className).not.toContain('soon');
    expect(nexts[1]?.className).not.toContain('soon');
    cleanup();

    const low = render(
      <Summary
        {...BASE}
        results={[{ ...(RESULTS[0] as SummaryShift), lyFrom: 2, lyTo: 1 }]}
        onHome={() => undefined}
      />,
    );
    expect(low.container.querySelector('.shift .next')?.className).toContain('soon');
  });

  it('LIFER 가 있을 때만 첫 기록 상자를 낸다', () => {
    const without = render(<Summary {...BASE} onHome={() => undefined} />);
    expect(without.container.querySelector('.lifer-box')).toBeNull();
    cleanup();

    const withLifer = render(
      <Summary
        {...BASE}
        lifer={{ concept: '옵셔널 체이닝', code: '?.', where: '당신의 <b>src/cart.ts:42</b> 에서 채집' }}
        onHome={() => undefined}
      />,
    );
    expect(withLifer.container.querySelector('.lifer-box')?.textContent).toContain('처음 기록한 문법');
    expect(withLifer.container.querySelector('.lifer-box b')?.textContent).toBe('src/cart.ts:42');
  });

  it('연속 인쇄는 숫자로만 적고 진도를 열지 않는다고 말한다 (정본 §3-7)', () => {
    const { container } = render(<Summary {...BASE} onHome={() => undefined} />);
    const line = container.querySelector('.streak-line');
    expect(line?.querySelector('.st')?.textContent).toBe('03');
    expect(line?.textContent).toContain('연속 기록은 진도를 열지 않습니다');
  });

  it('내일 예고의 서식은 살리고 위험한 태그는 정화한다', () => {
    const { container } = render(
      <Summary {...BASE} tomorrow={'<b>내일</b><script>x</script>'} onHome={() => undefined} />,
    );
    expect(container.querySelector('.hintbox b')?.textContent).toBe('내일');
    expect(container.querySelector('script')).toBeNull();
  });

  it('뜨면 포커스가 「홈으로」 버튼으로 온다', () => {
    render(<Summary {...BASE} onHome={() => undefined} />);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /홈으로/ }));
  });

  it('Enter 로 홈에 간다 — 버튼 위에서도 한 번만 부른다', async () => {
    const onHome = vi.fn();
    const user = userEvent.setup();
    render(<Summary {...BASE} onHome={onHome} />);

    await user.keyboard('{Enter}');
    expect(onHome).toHaveBeenCalledTimes(1);
  });

  it('요약 판 안 어디서 Enter 를 눌러도 홈으로 간다', async () => {
    const onHome = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<Summary {...BASE} onHome={onHome} />);

    container.querySelector<HTMLElement>('article.ps')?.focus();
    await user.keyboard('{Enter}');
    expect(onHome).toHaveBeenCalledTimes(1);
  });

  it('「오늘 판 다시 보기」는 콜백이 있을 때만 나온다', async () => {
    const onAgain = vi.fn();
    const user = userEvent.setup();
    render(<Summary {...BASE} onHome={() => undefined} onAgain={onAgain} />);

    await user.click(screen.getByRole('button', { name: '오늘 판 다시 보기' }));
    expect(onAgain).toHaveBeenCalledTimes(1);
    cleanup();

    render(<Summary {...BASE} onHome={() => undefined} />);
    expect(screen.queryByRole('button', { name: '오늘 판 다시 보기' })).toBeNull();
  });
});
