// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Verdict, verdictTitle } from './Verdict';

afterEach(cleanup);

describe('verdictTitle', () => {
  it('100 · 66 두 문턱이 제목 셋을 가른다', () => {
    expect(verdictTitle(100)).toBe('완벽합니다');
    expect(verdictTitle(99)).toBe('거의 맞았어요');
    expect(verdictTitle(66)).toBe('거의 맞았어요');
    expect(verdictTitle(65)).toBe('다시 한 번 볼까요');
    expect(verdictTitle(0)).toBe('다시 한 번 볼까요');
  });
});

describe('Verdict', () => {
  it('큰 숫자는 어긋남 판을 지나고 글자는 한 번만 읽힌다', () => {
    const { container } = render(<Verdict pct={83} core={6} found={5} missed={1} wrong={2} bonus={1} />);
    const big = container.querySelector('.verdict .big');
    expect(big?.getAttribute('class')).toContain('mr');
    expect(big?.getAttribute('data-w')).toBe('83%');
    expect(big?.textContent).toBe('83%');
  });

  it('숫자 넷을 낱말과 함께 낸다', () => {
    const { container } = render(<Verdict pct={83} core={6} found={5} missed={1} wrong={2} bonus={1} />);
    expect(container.querySelector('.verdict p')?.textContent).toBe(
      '꼭 고쳐야 할 6개 중 5개 찾음 · 1개 놓침 · 필요 없는데 고른 것 2개 · 보너스 1개',
    );
    expect(container.querySelector('.verdict h4')?.textContent).toBe('거의 맞았어요');
  });

  it('막대는 이름 있는 그림이고 두 칸의 길이가 곧 수다', () => {
    const { container } = render(<Verdict pct={50} core={6} found={3} missed={3} wrong={0} bonus={0} />);
    const meter = screen.getByRole('img', { name: '6개 중 3개 찾음, 3개 놓침' });
    expect(meter.className).toBe('meter');
    expect(container.querySelector('.meter .f')?.getAttribute('style')).toContain('--w: 3');
    expect(container.querySelector('.meter .m')?.getAttribute('style')).toContain('--w: 3');
  });
});
