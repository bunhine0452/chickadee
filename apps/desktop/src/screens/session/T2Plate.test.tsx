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

/**
 * 커밋 없는 payload (04 §8.3 — 그래프만으로 만드는 3종). `commit: undefined` 로 덮지 않고
 * **키를 지운다**: `exactOptionalPropertyTypes` 아래에서 선택 필드에 `undefined` 를 넣는 것은
 * 「값이 undefined 다」이지 「없다」가 아니라 `CardPayload` 에 붙지 않는다.
 */
const { commit: _commit, ...NO_COMMIT } = PAYLOAD;

/** 흐름 추적 (04 §8.3) — 정답 경로 3장 + 함정 1장이 섞인 덱. 커밋은 없다. */
const FLOW_PAYLOAD = {
  ...NO_COMMIT,
  kind: 'flow' as const,
  q: '«CartSheet.tsx» 에서 «QuantityStepper.tsx» 까지 어떤 순서로 지나가나요?',
  hint: '카드를 위에서 아래 순서로 세웁니다.',
  core: {},
  sec: {},
  trap: {},
  flow: { answer: [C, A, B], deck: [A, B, C, 'lib/format.ts'] },
  hints: ['지나가는 파일은 3개입니다.', '덱에 경로 밖 파일이 섞여 있습니다.', `첫 자리는 «CartSheet.tsx» 입니다.`],
};

/** 의존성 방향 (04 §8.3) — 5쌍 4지선다. */
const PAIRS = [
  { a: C, b: A, answer: 0 as const },
  { a: A, b: B, answer: 0 as const },
  { a: B, b: C, answer: 3 as const },
  { a: C, b: B, answer: 1 as const },
  { a: A, b: C, answer: 2 as const },
];

const DIRECTION_PAYLOAD = {
  ...NO_COMMIT,
  kind: 'direction' as const,
  q: '두 파일 사이의 방향을 고르세요.',
  hint: '5문항입니다.',
  core: {},
  sec: {},
  trap: {},
  pairs: PAIRS,
  hints: ['위쪽 층이 아래쪽 층을 가져다 씁니다.', '두 상자에 마우스를 올려 보세요.', '관계가 있는 쌍은 4개입니다.'],
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
    const noCommit = { ...PLATE, payload: NO_COMMIT };
    mount({ plate: noCommit, view: 'result', graded: RESULT, selected: [A, C] });
    expect(screen.queryByText(/실제 커밋 기록입니다/)).toBeNull();
  });
});

describe('흐름 추적 (04 §8.3 · D107)', () => {
  const flowPlate = { ...PLATE, kind: 'flow' as const, payload: FLOW_PAYLOAD, nameKo: '흐름 추적' };
  const flow = (over: Partial<Props> = {}) => mount({ plate: flowPlate, ...over });

  test('덱과 지도가 함께 뜬다 — 지도는 이 종에서도 문제의 일부다', () => {
    flow();
    expect(screen.getByText(/어떤 순서로 지나가나요/)).toBeTruthy();
    expect(screen.getByLabelText('cart/ 의존 지도')).toBeTruthy();
    expect(screen.getByLabelText('남은 카드')).toBeTruthy();
    expect(document.querySelectorAll('.frest .add')).toHaveLength(4);
  });

  test('파일 칩은 안 뜬다 — 이 종의 답은 「고른 것」이 아니라 「세운 순서」다', () => {
    flow({ selected: [A] });
    expect(document.querySelector('.picked')).toBeNull();
  });

  test('지도 상자를 눌러도 고르기가 아니다 (답은 덱에만 들어간다)', () => {
    const { spies, container } = flow();
    fireEvent.click(container.querySelector('.map .nd') as HTMLElement);
    expect(spies.onToggle).not.toHaveBeenCalled();
  });

  test('한 장도 안 세웠으면 채점이 잠기고 Enter 도 안 먹는다', () => {
    const { spies } = flow({ ordered: [] });
    expect(screen.getByRole('button', { name: /채점하기/ }).hasAttribute('disabled')).toBe(true);
    fireEvent.keyDown(document, { code: 'Enter' });
    expect(spies.onGrade).not.toHaveBeenCalled();
  });

  test('한 장이라도 세웠으면 Enter 가 채점한다', () => {
    const { spies } = flow({ ordered: [C] });
    fireEvent.keyDown(document, { code: 'Enter' });
    expect(spies.onGrade).toHaveBeenCalledTimes(1);
  });

  test('덱 버튼에 포커스가 있으면 판이 Enter 를 가로채지 않는다', () => {
    const { spies, container } = flow({ ordered: [C, A] });
    const up = container.querySelector('.fcard[data-seat="2"] .mv-up') as HTMLElement;
    fireEvent.keyDown(up, { code: 'Enter', bubbles: true });
    expect(spies.onGrade).not.toHaveBeenCalled();
  });

  test('세운 순서가 그대로 보인다 — 자리를 옮기면 부모에게 새 순서가 간다', () => {
    const onOrder = vi.fn();
    flow({ ordered: [C, A, B], onOrder });
    expect([...document.querySelectorAll('.fcard .nm')].map((el) => el.textContent))
      .toEqual(['CartSheet.tsx', 'CartItemRow.tsx', 'QuantityStepper.tsx']);
    fireEvent.click(screen.getByRole('button', { name: /QuantityStepper\.tsx — 3개 중 3번째\. 위로/ }));
    expect(onOrder).toHaveBeenCalledWith([C, B, A]);
  });

  test('동작 줄이 「다 세우지 않아도 된다」를 말한다 (함정 카드가 섞여 있다)', () => {
    flow({ ordered: [C] });
    expect(screen.getByText(/다 세우지 않아도 됩니다/)).toBeTruthy();
  });

  test('결과 화면의 분모는 정답 경로의 길이다 — `core` 가 비어 있어도 0 이 아니다', () => {
    const graded: T2Result = {
      kind: 'flow', pct: 50, found: [C, A], missed: [B], wrong: ['lib/format.ts'],
      bonus: [], verdict: 'repeat', capped: null, hints: 0,
      rows: [{ path: B, tier: 'missed', stat: '3번째', note: '정답 경로의 3번째인데 빠졌습니다.' }],
    };
    flow({ view: 'result', graded, ordered: [C, A] });
    expect(screen.getByText(/꼭 고쳐야 할 3개 중/)).toBeTruthy();
  });
});

describe('의존성 방향 (04 §8.3 · D107)', () => {
  const dirPlate = {
    ...PLATE, kind: 'direction' as const, payload: DIRECTION_PAYLOAD, nameKo: '의존성 방향',
  };
  const dir = (over: Partial<Props> = {}) => mount({ plate: dirPlate, ...over });

  test('5문항이 한 화면에 뜨고 지도도 같이 뜬다 (04 §8.3 힌트 ②)', () => {
    dir();
    expect(document.querySelectorAll('.dq')).toHaveLength(5);
    expect(screen.getByLabelText('cart/ 의존 지도')).toBeTruthy();
  });

  test('다 안 풀면 채점이 잠기고 남은 문항 수를 적는다', () => {
    const { spies } = dir({ picks: [0, 1] });
    expect(screen.getByRole('button', { name: /채점하기/ }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByText(/아직 3문항 남았습니다/)).toBeTruthy();
    fireEvent.keyDown(document, { code: 'Enter' });
    expect(spies.onGrade).not.toHaveBeenCalled();
  });

  test('다 풀면 Enter 가 채점한다', () => {
    const { spies } = dir({ picks: [0, 1, 2, 3, 0] });
    expect(screen.getByRole('button', { name: /채점하기/ }).hasAttribute('disabled')).toBe(false);
    fireEvent.keyDown(document, { code: 'Enter' });
    expect(spies.onGrade).toHaveBeenCalledTimes(1);
  });

  test('보기에 포커스가 있으면 판이 Enter 를 가로채지 않는다', () => {
    const { spies, container } = dir({ picks: [0, 1, 2, 3, 0] });
    const choice = container.querySelector('.dquiz .ch') as HTMLElement;
    fireEvent.keyDown(choice, { code: 'Enter', bubbles: true });
    expect(spies.onGrade).not.toHaveBeenCalled();
  });

  test('보기를 고르면 문항 번호와 0~3 이 부모로 간다', () => {
    const onPick = vi.fn();
    dir({ picks: [], onPick });
    const groups = document.querySelectorAll('.dquiz .choices');
    fireEvent.click(groups[1]!.querySelectorAll('.ch')[3] as HTMLElement);
    expect(onPick).toHaveBeenCalledWith(1, 3);
  });

  test('파일 칩은 안 뜬다 — 이 종의 답은 문항이다', () => {
    dir();
    expect(document.querySelector('.picked')).toBeNull();
  });
});
