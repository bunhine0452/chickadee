// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ResultGroups } from './ResultGroups';
import type { ResultRow } from './ResultGroups';

afterEach(cleanup);

const ROWS: ResultRow[] = [
  { path: 'features/cart/QuantityStepper.tsx', tier: 'found', stat: '+64 −0', note: '새로 만든 파일입니다.' },
  { path: 'features/cart/cartApi.ts', tier: 'missed', stat: '+18 −1', note: '서버에 <b>수량 바꿔 줘</b>라고 말합니다.' },
  { path: 'app/api/cart/route.ts', tier: 'missed', stat: '+27 −2', note: '요청을 받는 서버 쪽 입구.' },
  { path: 'features/cart/CartSheet.tsx', tier: 'wrong', stat: null, note: '가장 흔한 오답이에요.' },
  { path: 'server/schema.ts', tier: 'sec', stat: '+4 −1', note: '몰랐어도 감점 없습니다.' },
];

describe('ResultGroups', () => {
  it('놓친 파일이 맨 위다 — 목업 group() 순서 그대로', () => {
    const { container } = render(<ResultGroups rows={ROWS} />);
    expect([...container.querySelectorAll('.rg')].map((el) => el.getAttribute('class'))).toEqual([
      'rg missed',
      'rg ok',
      'rg wrong',
      'rg sec',
    ]);
    expect([...container.querySelectorAll('.rg h5 .sym')].map((el) => el.textContent)).toEqual(['＋', '✓', '✕', '◆']);
  });

  it('한 묶음의 줄에 경로 · 변경량 · 사유가 같이 앉는다', () => {
    const { container } = render(<ResultGroups rows={ROWS} />);
    const missed = container.querySelector('.rg.missed');
    expect(missed?.querySelectorAll('li')).toHaveLength(2);
    const first = missed?.querySelector('li');
    expect(first?.querySelector('code')?.textContent).toBe('features/cart/cartApi.ts');
    expect(first?.querySelector('.stat')?.textContent).toBe('+18 −1');
    expect(first?.querySelector('p b')?.textContent).toBe('수량 바꿔 줘');
  });

  it('정답지에 없는 파일의 통계 자리에는 「변경 없음」이 앉는다', () => {
    const { container } = render(<ResultGroups rows={ROWS} />);
    expect(container.querySelector('.rg.wrong .stat')?.textContent).toBe('변경 없음');
  });

  it('빈 묶음은 머리말도 내지 않는다', () => {
    const { container } = render(<ResultGroups rows={ROWS.filter((r) => r.tier === 'found')} />);
    expect(container.querySelectorAll('.rg')).toHaveLength(1);
    expect(container.querySelector('.rg')?.getAttribute('class')).toBe('rg ok');
    // 부제가 없는 묶음(ok)은 small 도 없다.
    expect(container.querySelector('.rg h5 small')).toBeNull();
  });

  it('부제가 있는 묶음만 small 을 낸다', () => {
    const { container } = render(<ResultGroups rows={ROWS} />);
    expect([...container.querySelectorAll('.rg h5 small')].map((el) => el.textContent)).toEqual([
      '여기가 이번 학습의 핵심입니다 — 지도에서 깜빡입니다',
      '흔한 오답과 그 이유',
      '골라도 안 골라도 감점하지 않습니다',
    ]);
  });
});
