// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { HomeRetake } from '../../screens/home/data';
import { ConceptList } from './ConceptList';

afterEach(cleanup);

const NOW = Date.UTC(2026, 8, 3, 9, 0, 0);
const DAY = 86_400_000;

const ROWS: HomeRetake[] = [
  {
    conceptId: 'ts/use-state',
    nameKo: '함수형 업데이트',
    token: 'useState',
    track: 't0',
    layer: 2,
    dueAt: NOW - DAY,
    excerpt: null,
  },
  {
    conceptId: 'react/context',
    nameKo: 'Context 경계',
    token: null,
    track: 't2',
    layer: 1,
    dueAt: NOW + 9 * DAY,
    excerpt: null,
  },
];

describe('ConceptList', () => {
  it('겹을 색이 아니라 문장으로 낸다', () => {
    render(<ConceptList rows={ROWS} now={NOW} />);
    expect(screen.getByRole('img', { name: 'T0 문법 · 잉크 2겹' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'T2 구조 · 잉크 1겹' })).toBeTruthy();
  });

  it('만기를 사람 말로 바꿔 적는다', () => {
    render(<ConceptList rows={ROWS} now={NOW} />);
    expect(screen.getByText('오늘 안에')).toBeTruthy();
    expect(screen.getByText('9일 뒤')).toBeTruthy();
  });

  it('목록에 이름을 붙여 스크린리더가 자리를 안다', () => {
    render(<ConceptList rows={ROWS} now={NOW} />);
    const list = screen.getByRole('list', { name: '다시 찍을 개념' });
    expect(list.textContent).toContain('함수형 업데이트');
    expect(list.textContent).toContain('useState');
  });

  it('비어 있으면 빈 상태 문구를 낸다', () => {
    render(<ConceptList rows={[]} now={NOW} />);
    expect(screen.getByText(/다시 찍을 개념이 아직 없습니다/)).toBeTruthy();
  });
});
