// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ScoreCard, verdictText } from './ScoreCard';
import type { CloneVerdict } from './ScoreCard';

afterEach(cleanup);

const NUMBERS = { total: 20, meaning: 17, exact: 14, equiv: 3, wrong: 3 } as const;

describe('ScoreCard', () => {
  it('포스터 활자는 「N분의 M」과 「의미가 맞은 줄」이다', () => {
    const { container } = render(<ScoreCard {...NUMBERS} verdict="advance" />);
    const big = container.querySelector('.score .big');
    expect(big?.textContent).toBe('20분의 17의미가 맞은 줄');
    expect(big?.querySelector('small')?.textContent).toBe('의미가 맞은 줄');
    expect(container.textContent).not.toContain('%');
  });

  it('정합 줄 수와 동등의 뜻을 산문으로 적는다', () => {
    const { container } = render(<ScoreCard {...NUMBERS} verdict="advance" />);
    const p = container.querySelector('.score p');
    expect(p?.textContent).toContain('이 중 글자까지 같은 줄은 14줄.');
    expect(p?.textContent).toContain('지역 변수명 일관 치환');
  });

  it('수 넷은 이름과 숫자로만 갈린다 — 색으로 안 가른다 (D182)', () => {
    const { container } = render(<ScoreCard {...NUMBERS} verdict="repeat-soft" />);
    const rows = [...container.querySelectorAll('.score-nums > div')];
    expect(rows.map((el) => el.textContent)).toEqual(['같음14', '같은 뜻3', '다름3']);
    expect(container.querySelector('.score-verdict')?.textContent).toBe('한 번 더 같은 단계를 권합니다');
    expect(container.querySelector('.pill')).toBeNull();
  });

  it('판정 문구 3종은 목업 그대로다', () => {
    expect(['advance', 'repeat-soft', 'repeat'].map((v) => verdictText(v as CloneVerdict))).toEqual([
      '다음 단계로 가도 좋습니다',
      '한 번 더 같은 단계를 권합니다',
      '같은 단계를 한 번 더 하는 편이 빠릅니다',
    ]);
    const { container } = render(<ScoreCard {...NUMBERS} verdict="repeat" />);
    expect(container.querySelector('.score-verdict')?.textContent).toBe('같은 단계를 한 번 더 하는 편이 빠릅니다');
  });
});
