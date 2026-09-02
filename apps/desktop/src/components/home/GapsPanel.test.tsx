// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { HomeGap } from '../../screens/home/data';
import { GapsPanel } from './GapsPanel';

afterEach(cleanup);

const GAPS: HomeGap[] = [
  {
    conceptId: 'common/async-await',
    nameKo: '비동기 기다리기',
    token: 'async / await',
    siteCount: 11,
    minUnknown: 0,
    hot: true,
    fill: 1,
  },
  {
    conceptId: 'ts/nullish-default',
    nameKo: '없을 때의 기본값',
    token: '??',
    siteCount: 5,
    minUnknown: 1,
    hot: false,
    fill: 0.46,
  },
];

describe('GapsPanel', () => {
  it('「판 만들기」를 누르면 그 개념 id 로 onMake 를 부른다', async () => {
    const onMake = vi.fn();
    const user = userEvent.setup();
    render(<GapsPanel gaps={GAPS} onMake={onMake} />);

    await user.click(screen.getByRole('button', { name: '?? 판 만들기' }));

    expect(onMake).toHaveBeenCalledTimes(1);
    expect(onMake).toHaveBeenCalledWith('ts/nullish-default');
  });

  it('등장 횟수를 글자로 낸다 — 막대는 장식이다', () => {
    render(<GapsPanel gaps={GAPS} onMake={() => undefined} />);
    const list = screen.getByRole('list', { name: '판이 없는 문법' });
    expect(list.textContent).toContain('11');
    expect(list.textContent).toContain('번 등장');
    expect(screen.getByText('async / await')).toBeTruthy();
  });

  it('막대 길이는 --f 로만 들어간다', () => {
    const { container } = render(<GapsPanel gaps={GAPS} onMake={() => undefined} />);
    const bars = container.querySelectorAll<HTMLElement>('.bar i');
    expect(bars[0]?.style.getPropertyValue('--f')).toBe('100%');
    expect(bars[1]?.style.getPropertyValue('--f')).toBe('46%');
  });

  it('구멍이 없으면 빈 상태 문구를 낸다', () => {
    render(<GapsPanel gaps={[]} onMake={() => undefined} />);
    expect(screen.getByText(/판이 없는 문법이 없습니다/)).toBeTruthy();
  });
});
