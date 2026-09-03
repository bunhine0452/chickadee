// @vitest-environment jsdom
/**
 * T2 판의 **키보드 완결** (정본 §3-8 · 05 §7).
 *
 * `T1Plate.test.tsx` 와 같은 틀이다 — M3 인계 문서가 T2 도 이 틀로 붙이라고 적었다.
 * Playwright 하네스는 M5(`m5-05-e2e-visual`)의 것이라 여기서는 **브라우저 없이** 판 두
 * 화면의 키를 고정한다.
 *
 * 지도 자체의 키(노드 위 Enter·Space·Tab)는 `components/t2/DependencyMap.test.tsx` 가 본다.
 * 여기서 보는 것은 **판이 그 키를 가로채지 않는가**이다 — 노드에 포커스가 있는데 판이
 * Enter 를 먹으면 파일을 못 고른다.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import type { T2Result } from '@chickadee/grading';

const { T2Plate } = await import('./T2Plate.js');
const { asConceptId } = await import('@chickadee/store-sql');

const A = 'features/cart/CartItemRow.tsx';
const B = 'features/cart/QuantityStepper.tsx';
const C = 'features/cart/CartSheet.tsx';

const PAYLOAD = {
  track: 't2' as const,
  kind: 'placement' as const,
  q: '«수량 조절» 기능을 넣는다면, 어느 파일들을 고쳐야 할까요?',
  hint: '지도에서 파일 상자를 클릭해 고릅니다.',
  bands: [{ l: '기능', s: 'features/cart/' }, { l: '동작 · 통신', s: '' }],
  files: [{ p: C, r: 0 }, { p: A, r: 0 }, { p: B, r: 1, isNew: true }],
  edges: [[C, A, 'static'] as [string, string, 'static'], [A, B, 'static'] as [string, string, 'static']],
  commit: { h: 'a3f19c2', d: '2026-07-14', m: 'feat: 수량 조절', n: '파일 2개 · +64 −0' },
  core: { [A]: ['+9 −4', '스테퍼를 끼웠습니다.'] as [string, string], [B]: ['+64 −0', '새로 만든 파일입니다.'] as [string, string] },
  sec: {},
  trap: { [C]: '«CartSheet.tsx» 는 «CartItemRow.tsx» 를 놓기만 합니다' },
  hints: ['2개 층에 걸쳐 있습니다.', '새 파일이 1개 있습니다.', '꼭 고쳐야 하는 파일은 2개입니다.'],
};

const PLATE = {
  id: 1,
  pos: 0,
  cardId: 1,
  conceptId: asConceptId('arch/placement'),
  track: 't2' as const,
  role: 'new' as const,
  estMin: 4,
  parentItemId: null,
  status: 'active' as const,
  elapsedS: 0,
  state: null,
  kind: 'placement' as const,
  level: 1 as const,
  siteId: null,
  payload: PAYLOAD,
  nameKo: '책임 배치',
  token: 'cart/',
  layer: 1 as const,
};

const RESULT: T2Result = {
  kind: 'placement',
  pct: 50,
  found: [A],
  missed: [B],
  wrong: [C],
  bonus: [],
  verdict: 'repeat',
  capped: null,
  hints: 0,
  rows: [
    { path: B, tier: 'missed', stat: '+64 −0', note: '새로 만든 파일입니다.' },
    { path: A, tier: 'found', stat: '+9 −4', note: '스테퍼를 끼웠습니다.' },
    { path: C, tier: 'wrong', stat: null, note: '«CartSheet.tsx» 는 «CartItemRow.tsx» 를 놓기만 합니다' },
  ],
};

type Props = Parameters<typeof T2Plate>[0];

function mount(over: Partial<Props> = {}) {
  const spies = {
    onView: vi.fn(), onToggle: vi.fn(), onHint: vi.fn(),
    onGrade: vi.fn(), onAppeal: vi.fn(), onFinish: vi.fn(),
  };
  const props: Props = {
    plate: PLATE, no: 1, result: null, graded: null, view: 'pick',
    selected: [], hints: 0, appealed: [], ...spies, ...over,
  };
  return { ...render(<T2Plate {...props} />), spies };
}

afterEach(cleanup);

describe('고르기 화면', () => {
  test('지도와 질문이 뜬다', () => {
    mount();
    expect(screen.getByText(/어느 파일들을 고쳐야 할까요/)).toBeTruthy();
    expect(screen.getByLabelText('cart/ 의존 지도')).toBeTruthy();
  });

  test('아무것도 안 골랐으면 채점 버튼이 잠기고 Enter 도 안 먹는다', () => {
    const { spies } = mount({ selected: [] });
    expect(screen.getByRole('button', { name: /채점하기/ }).hasAttribute('disabled')).toBe(true);
    fireEvent.keyDown(document, { code: 'Enter' });
    expect(spies.onGrade).not.toHaveBeenCalled();
  });

  test('하나라도 골랐으면 Enter 가 채점한다 (05 §7)', () => {
    const { spies } = mount({ selected: [A] });
    fireEvent.keyDown(document, { code: 'Enter' });
    expect(spies.onGrade).toHaveBeenCalledTimes(1);
  });

  test('`H` 가 힌트를 연다 — 3단까지', () => {
    const { spies } = mount({ selected: [A], hints: 1 });
    fireEvent.keyDown(document, { key: 'h' });
    expect(spies.onHint).toHaveBeenCalledTimes(1);
  });

  test('힌트 3단이면 `H` 도 버튼도 더 안 연다', () => {
    const { spies } = mount({ selected: [A], hints: 3 });
    fireEvent.keyDown(document, { key: 'H' });
    expect(spies.onHint).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /힌트/ }).hasAttribute('disabled')).toBe(true);
  });

  test('열린 힌트만 보인다', () => {
    mount({ selected: [A], hints: 2 });
    expect(screen.getByText(/2개 층에 걸쳐 있습니다/)).toBeTruthy();
    expect(screen.getByText(/새 파일이 1개 있습니다/)).toBeTruthy();
    expect(screen.queryByText(/꼭 고쳐야 하는 파일은 2개/)).toBeNull();
  });

  test('지도 노드에 포커스가 있으면 판이 Enter 를 가로채지 않는다', () => {
    const { spies, container } = mount({ selected: [A] });
    const node = container.querySelector('.map .nd') as HTMLElement;
    expect(node).toBeTruthy();
    fireEvent.keyDown(node, { code: 'Enter', bubbles: true });
    expect(spies.onGrade).not.toHaveBeenCalled();
  });

  test('고른 파일이 칩으로 보인다', () => {
    // 지도 노드에도 같은 이름이 있으므로 칩 상자 안에서만 찾는다.
    const { container } = mount({ selected: [A, B] });
    const chips = [...container.querySelectorAll('.picked .chip')].map((c) => c.textContent);
    expect(chips).toEqual(['CartItemRow.tsx', 'QuantityStepper.tsx']);
  });
});

describe('결과 화면', () => {
  test('점수·묶음·커밋 출처가 함께 뜬다', () => {
    mount({ view: 'result', graded: RESULT, selected: [A, C] });
    expect(screen.getByText('50%')).toBeTruthy();
    expect(screen.getByText(/놓친 파일/)).toBeTruthy();
    expect(screen.getByText(/실제 커밋 기록입니다/)).toBeTruthy();
  });

  test('`Enter` 와 `Space` 가 다음 판으로 간다 (정본 §3-8)', () => {
    const { spies } = mount({ view: 'result', graded: RESULT, selected: [A, C] });
    fireEvent.keyDown(document, { code: 'Enter' });
    fireEvent.keyDown(document, { code: 'Space' });
    expect(spies.onFinish).toHaveBeenCalledTimes(2);
  });

  test('「이것도 맞다」는 wrong 전부를 한 번에 접수한다 (04 §8.4)', () => {
    const { spies } = mount({ view: 'result', graded: RESULT, selected: [A, C] });
    fireEvent.click(screen.getByRole('button', { name: /이것도 맞다/ }));
    expect(spies.onAppeal).toHaveBeenCalledWith(C);
    expect(spies.onAppeal).toHaveBeenCalledTimes(1);
  });

  test('틀리게 고른 것이 없으면 「이것도 맞다」가 잠긴다', () => {
    const clean: T2Result = { ...RESULT, wrong: [], pct: 100, verdict: 'advance' };
    mount({ view: 'result', graded: clean, selected: [A, B] });
    expect(screen.getByRole('button', { name: /이것도 맞다/ }).hasAttribute('disabled')).toBe(true);
  });

  test('진급이 막히면 왜 막혔는지 문장이 함께 나온다 (04 §8.2)', () => {
    const capped: T2Result = {
      ...RESULT, pct: 100, found: [A, B], missed: [], verdict: 'repeat-soft',
      capped: '고른 것 중 절반 이상이 안 바뀐 파일 — 범위를 좁혀 보세요',
    };
    mount({ view: 'result', graded: capped, selected: [A, B, C] });
    expect(screen.getByText(/범위를 좁혀 보세요/)).toBeTruthy();
  });

  test('커밋 없이 만든 문제는 출처 블록을 그리지 않는다 (04 §8.3)', () => {
    const noCommit = { ...PLATE, payload: { ...PAYLOAD, commit: undefined } };
    mount({ plate: noCommit, view: 'result', graded: RESULT, selected: [A, C] });
    expect(screen.queryByText(/실제 커밋 기록입니다/)).toBeNull();
  });
});
