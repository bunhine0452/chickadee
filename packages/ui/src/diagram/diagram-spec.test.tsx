// @vitest-environment jsdom
/**
 * 명세만 다섯 + 언어 세션 신청 여섯을 합친 그림 일곱 (D187 ⑲).
 *
 * 컴포넌트마다 넷을 본다 — **그린다 · 가린다 · 한 문장 `aria-label` · 표 대체**.
 * 셋째와 넷째가 짝인 것이 중요하다: `predict` 에서 그림만 가리고 낭독 문장이나 표가 답을
 * 읽어 주면 가린 것이 아니다(diagrams.md §4).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BitOverlay } from './BitOverlay';
import { ConversionLadder } from './ConversionLadder';
import { MemoryLine } from './MemoryLine';
import { ParallelSteps } from './ParallelSteps';
import { PermissionLine } from './PermissionLine';
import { QueueLadder } from './QueueLadder';
import { StackFrames } from './StackFrames';
import { bitsOf } from './bits';
import type {
  ConversionLadderModel, MemoryLineModel, ParallelStepsModel, PermissionLineModel,
  PermPlace, QueueLadderModel, StackFramesModel,
} from './types';

afterEach(cleanup);

/* ───────── 표본 ───────── */

const ARRAY: MemoryLineModel = {
  base: '0x1000',
  stride: 4,
  slots: [
    { addr: '0x1000', value: '10', name: 'a[0]' },
    { addr: '0x1004', value: '20', name: 'a[1]' },
    { addr: '0x1008', value: '30', name: 'a[2]' },
  ],
};

const SLICE: MemoryLineModel = {
  base: '0x2000',
  stride: 8,
  slots: [
    { addr: '0x2000', value: '1' },
    { addr: '0x2008', value: '2', names: ['s[0]', 't[0]'] },
    { addr: '0x2010', value: '3' },
    { addr: '0x2018', value: '0' },
  ],
  windows: [{ name: 's', from: 1, len: 2, cap: 3 }],
};

const FRAMES: StackFramesModel = {
  steps: [
    { code: 'Widget w;', frames: [{ fn: 'main', args: [], locals: [{ name: 'w', value: '"a"', changed: true }] }] },
    {
      code: 'throw Oops{};',
      frames: [
        { fn: 'main', args: [], locals: [{ name: 'w', value: '"a"' }] },
        { fn: 'draw', args: [{ name: 'n', type: 'int', value: '2' }], locals: [{ name: 'buf', value: '8' }] },
      ],
      unwind: [
        { name: '~Buf buf', order: 1 },
        { name: '~Widget w', order: 2 },
      ],
    },
  ],
};

const LADDER: ConversionLadderModel = {
  rungs: [
    { type: 'i64', value: '300' },
    { type: 'i32', value: '300' },
    { type: 'u8', value: '44' },
  ],
  edges: [
    { from: 1, to: 0, kind: 'widen', label: 'From' },
    { from: 1, to: 2, kind: 'narrow', label: 'as', result: '44' },
    { from: 1, to: 2, kind: 'fallible', label: 'TryFrom', result: 'Err' },
  ],
};

const PERMS: PermissionLineModel = {
  steps: [
    {
      code: 'let mut v = vec![1, 2];',
      places: [
        { path: 'v', r: 'gained', w: 'gained', o: 'gained' },
        { path: '*r', r: 'none', w: 'none', o: 'none' },
      ],
    },
    {
      code: 'v.push(3);',
      places: [
        { path: 'v', r: 'has', w: 'missing', o: 'lost' },
        { path: '*r', r: 'has', w: 'none', o: 'none' },
      ],
      expects: [{ path: 'v', needs: ['r', 'w'] }],
    },
  ],
};

const QUEUE: QueueLadderModel = {
  lanes: ['script', 'micro', 'task'],
  fold: {
    expr: "log('1'); setTimeout(f); then(g); log('2');",
    steps: [
      { code: "log('1')", type: 'script' },
      { code: "log('2')", type: 'script' },
      { code: 'g()', type: 'micro' },
      { code: 'f()', type: 'task' },
    ],
  },
};

const LANES: ParallelStepsModel = {
  lanes: [
    {
      name: 'main',
      steps: [
        { code: 'ch := make(chan int)', type: 'chan int' },
        { code: 'go work(ch)', type: '' },
        { code: 'v := <-ch', type: 'int' },
      ],
    },
    {
      name: 'work',
      steps: [
        { code: 'sum := 1 + 2', type: 'int' },
        { code: 'ch <- sum', type: '' },
      ],
    },
  ],
  edges: [
    { from: [0, 1], to: [1, 0], kind: 'wg', label: 'go' },
    { from: [1, 1], to: [0, 2], kind: 'send' },
  ],
};

/* ───────── 메모리 줄 ───────── */

describe('MemoryLine — 배열이 왜 0부터인가', () => {
  it('칸마다 주소와 거리가 서고, 거리는 base 에서 stride 배로 는다', () => {
    const { container } = render(<MemoryLine model={ARRAY} />);
    expect(container.querySelectorAll('.ml-cell')).toHaveLength(3);
    expect([...container.querySelectorAll('.ml-off')].map((n) => n.textContent)).toEqual(['+0', '+4', '+8']);
    expect([...container.querySelectorAll('.ml-addr')].map((n) => n.textContent)).toEqual([
      '0x1000', '0x1004', '0x1008',
    ]);
  });

  it('이름 둘이 한 칸에 붙으면 별칭 표시가 나온다 — 값을 나란히 적으면 구별이 사라진다', () => {
    const { container } = render(<MemoryLine model={SLICE} />);
    const many = container.querySelectorAll('.ml-names.many');
    expect(many).toHaveLength(1);
    expect(many[0]?.textContent).toContain('s[0]');
    expect(many[0]?.textContent).toContain('t[0]');
    expect(container.querySelectorAll('.ml-alias')).toHaveLength(1);
  });

  it('창은 길이 구간과 용량 구간을 나눠 건다 — cap 경계가 append 를 정한다', () => {
    const { container } = render(<MemoryLine model={SLICE} />);
    const len = container.querySelector('.ml-win.len');
    const cap = container.querySelector('.ml-win.cap');
    expect(len?.getAttribute('style')).toContain('grid-column: 3 / 5');
    expect(cap?.getAttribute('style')).toContain('grid-column: 5 / 6');
  });

  it('예측은 값만 가린다 — 주소·거리·이름은 물음이라 남는다', () => {
    const { container } = render(<MemoryLine model={ARRAY} phase="predict" />);
    expect(container.querySelectorAll('.ml-cell.veil')).toHaveLength(3);
    expect(container.textContent).not.toContain('20');
    expect(container.textContent).toContain('0x1004');
    expect(screen.getByRole('img').getAttribute('aria-label')).not.toContain('은 20');
  });

  it('한 문장 aria-label 과 표 대체를 함께 낸다', () => {
    const { container } = render(<MemoryLine model={SLICE} />);
    const label = screen.getByRole('img').getAttribute('aria-label') ?? '';
    expect(label).toContain('4바이트'.replace('4', '8'));
    expect(label).toContain('같은 칸');
    expect(container.querySelectorAll('.dgm-alt tbody tr')).toHaveLength(5); // 칸 넷 + 창 하나
  });
});

/* ───────── 겹친 비트 배열 ───────── */

describe('BitOverlay — 300u32 as u8 이 왜 44 인가', () => {
  const M = { from: bitsOf(300, 'u32'), to: bitsOf(44, 'u8'), keep: 8 };

  it('두 줄이 한 격자를 쓰고, 아래 폭이 위 폭의 하위 자리에 정확히 선다', () => {
    const { container } = render(<BitOverlay model={M} />);
    const bits = [...container.querySelectorAll('.bit')];
    expect(bits).toHaveLength(40); // 32 + 8
    const low = bits[32];
    expect(low?.getAttribute('style')).toContain('grid-column: 26'); // 24(잘림) + 2
  });

  it('떨어져 나가는 윗자리에 표시가 붙는다', () => {
    const { container } = render(<BitOverlay model={M} />);
    expect(container.querySelectorAll('.bit.gone')).toHaveLength(24);
    expect(container.querySelector('.ov-mark.keep')?.textContent).toContain('8');
  });

  it('두 폭이 같은 값을 안 담으면 감겼다고 글자로 말한다 (색으로만 말하지 않는다)', () => {
    render(<BitOverlay model={M} />);
    expect(screen.getByText('폭에 안 들어가 감겼습니다')).not.toBeNull();
  });

  it('예측은 두 줄의 비트와 저장된 값을 함께 가린다', () => {
    const { container } = render(<BitOverlay model={M} phase="predict" />);
    expect(container.querySelectorAll('.bit.veil')).toHaveLength(40);
    expect(container.querySelector('.dgm-alt')?.textContent).not.toContain('00101100');
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('가려져');
  });

  it('한 문장 aria-label 은 몇 자리가 떨어지는지를 말하고, 표 대체가 세 줄이다', () => {
    const { container } = render(<BitOverlay model={M} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('하위 8비트만 남고 위 24비트');
    expect(container.querySelectorAll('.dgm-alt tbody tr')).toHaveLength(3);
  });
});

/* ───────── 스택 프레임 ───────── */

describe('StackFrames — 쌓이고 걷힌다', () => {
  it('맨 위가 지금 도는 프레임이다 — 배열의 뒤를 화면의 위에 그린다', () => {
    const { container } = render(<StackFrames model={FRAMES} step={1} />);
    const frames = [...container.querySelectorAll('.sf-frame')];
    expect(frames).toHaveLength(2);
    expect(frames[0]?.className).toContain('top');
    expect(frames[0]?.querySelector('.sf-fn')?.textContent).toBe('draw');
  });

  it('걷힘은 순서대로 늘어서고 인자와 지역이 갈린다', () => {
    const { container } = render(<StackFrames model={FRAMES} step={1} />);
    expect([...container.querySelectorAll('.sf-run-name')].map((n) => n.textContent)).toEqual([
      '~Buf buf', '~Widget w',
    ]);
    expect(container.querySelectorAll('.sf-row')).toHaveLength(3); // main 지역 · draw 인자 · draw 지역
  });

  it('예측은 걷힘의 **이름**을 가리고 번호는 남긴다 — 몇 개가 도는지는 물음이다', () => {
    const { container } = render(<StackFrames model={FRAMES} step={1} phase="predict" />);
    expect(container.querySelectorAll('.sf-run.veil')).toHaveLength(2);
    expect(container.textContent).not.toContain('~Buf buf');
    expect([...container.querySelectorAll('.sf-num')].map((n) => n.textContent)).toEqual(['1', '2']);
    const label = screen.getByRole('img').getAttribute('aria-label') ?? '';
    expect(label).toContain('2개가 돕니다');
    expect(label).not.toContain('~Buf');
  });

  it('onStep 을 준 때만 단계 버튼이 생기고, 버튼은 그림 밖에 있다', () => {
    const onStep = vi.fn();
    const { container, rerender } = render(<StackFrames model={FRAMES} step={0} />);
    expect(container.querySelector('.dgm-nav')).toBeNull();
    rerender(<StackFrames model={FRAMES} step={0} onStep={onStep} />);
    expect(screen.getByRole('img').querySelector('button')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(onStep).toHaveBeenCalledWith(1);
  });

  it('표 대체가 프레임마다 한 줄, 걷힘마다 한 줄이다', () => {
    const { container } = render(<StackFrames model={FRAMES} step={1} />);
    expect(container.querySelectorAll('.dgm-alt tbody tr')).toHaveLength(4);
  });
});

/* ───────── 타입 변환 사다리 ───────── */

describe('ConversionLadder — 값이 아니라 관계', () => {
  it('칸마다 한 행, 간선마다 한 열이다 — 겹치면 어느 화살인지 못 읽는다', () => {
    const { container } = render(<ConversionLadder model={LADDER} />);
    expect(container.querySelectorAll('.cl-rung')).toHaveLength(3);
    const edges = [...container.querySelectorAll('.cl-edge')];
    expect(edges).toHaveLength(3);
    expect(edges.map((e) => e.getAttribute('style')?.includes('grid-column: 2'))).toEqual([true, false, false]);
  });

  it('방향과 종류가 색이 아니라 클래스로 갈린다 — 올라감·잘림·갈라짐', () => {
    const { container } = render(<ConversionLadder model={LADDER} />);
    const edges = [...container.querySelectorAll('.cl-edge')];
    expect(edges[0]?.className).toContain('up');
    expect(edges[0]?.className).toContain('widen');
    expect(edges[1]?.className).toContain('down');
    expect(edges[1]?.className).toContain('narrow');
    expect(edges[2]?.className).toContain('fallible');
  });

  it('예측은 칸의 값과 간선의 결과를 가리고 타입·간선 이름은 남긴다', () => {
    const { container } = render(<ConversionLadder model={LADDER} phase="predict" />);
    expect([...container.querySelectorAll('.cl-val')].map((n) => n.textContent)).toEqual(['', '', '']);
    expect(container.querySelectorAll('.cl-res')).toHaveLength(0);
    expect(container.textContent).toContain('TryFrom');
    expect(container.querySelector('.dgm-alt')?.textContent).not.toContain('Err');
  });

  it('한 문장 aria-label 이 관계를 말하고, 표 대체가 둘이다 (칸과 간선)', () => {
    const { container } = render(<ConversionLadder model={LADDER} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('i32 에서 u8 로는 as 로 잘림');
    expect(container.querySelectorAll('.dgm-alt table')).toHaveLength(2);
  });
});

/* ───────── 권한 줄 ───────── */

describe('PermissionLine — 소유권 화살표의 교체판 (D187 ⑲)', () => {
  it('자리마다 권한 셋, 줄마다 한 행이다 — 권한은 이름이 아니라 자리에 붙는다', () => {
    const { container } = render(<PermissionLine model={PERMS} />);
    expect(container.querySelectorAll('.pl-path')).toHaveLength(2);
    expect(container.querySelectorAll('.pl-perm')).toHaveLength(6);
    // 격자 칸 12 (줄 둘 × 자리 둘 × 권한 셋) + 표기 풀이 다섯
    expect(container.querySelectorAll('.pl-cell')).toHaveLength(17);
  });

  it('다섯 상태가 부호와 면으로 갈린다 — 색만으로 말하지 않는다', () => {
    const { container } = render(<PermissionLine model={PERMS} />);
    const cells = [...container.querySelectorAll('.pl-cell')].slice(0, 12);
    expect(cells[0]?.className).toContain('gained');
    expect(cells[0]?.textContent).toBe('+읽');
    expect(cells[3]?.textContent).toBe('·'); // none
    const push = cells.slice(6);
    expect(push[1]?.className).toContain('missing');
    expect(push[2]?.textContent).toBe('−소'); // lost
  });

  it('요구(expects)는 예측에서도 남는다 — 물음이 무엇인지는 보여야 한다', () => {
    const { container } = render(<PermissionLine model={PERMS} phase="predict" />);
    expect(container.querySelectorAll('.pl-need')).toHaveLength(1);
    expect(container.querySelector('.pl-need')?.textContent).toContain('v:');
    expect(container.querySelectorAll('.pl .pl-cell.veil')).toHaveLength(12);
    expect(container.querySelectorAll('.pl .pl-cell.missing')).toHaveLength(0);
  });

  it('예측에서는 낭독 문장도 표 대체도 상태를 안 흘린다', () => {
    const { container } = render(<PermissionLine model={PERMS} phase="predict" />);
    const label = screen.getByRole('img').getAttribute('aria-label') ?? '';
    expect(label).toContain('요구합니다');
    expect(label).not.toContain('없는데 요구됨');
    expect(container.querySelector('.dgm-alt')?.textContent).not.toContain('없는데 요구됨');
  });

  it('표 대체는 자리마다 한 줄이고 요구를 따로 싣는다', () => {
    const { container } = render(<PermissionLine model={PERMS} />);
    expect(container.querySelectorAll('.dgm-alt tbody tr')).toHaveLength(5); // 2×2 + 요구 하나
    expect(container.querySelector('.dgm-alt')?.textContent).toContain('없는데 요구됨');
  });

  it('자리 다섯이면 열이 열다섯이다 — 720 에서 접지 않고 틀이 가로로 스크롤된다', () => {
    const five: PermPlace[] = ['a', '*b', 'v[0]', 's.f', '*c'].map((path) => ({
      path, r: 'has' as const, w: 'none' as const, o: 'none' as const,
    }));
    const { container } = render(<PermissionLine model={{ steps: [{ code: 'x', places: five }] }} />);
    const grid = container.querySelector('.pl');
    expect(grid?.getAttribute('style')).toContain('repeat(15,');
    // 칸마다 열이 못박혀 있어 폭이 좁아도 줄바꿈으로 어긋나지 않는다.
    expect(container.querySelectorAll('.pl .pl-cell[style*="grid-column"]')).toHaveLength(15);
    expect(container.querySelector('.dgm-view')).not.toBeNull();
  });
});

/* ───────── 큐 사다리 ───────── */

describe('QueueLadder — 두 줄이 비워지는 순서', () => {
  it('걸음이 자기 줄기의 열에 선다', () => {
    const { container } = render(<QueueLadder model={QUEUE} step={3} />);
    expect(container.querySelectorAll('.ql-lane')).toHaveLength(3);
    const rows = [...container.querySelectorAll('.ql-row')];
    expect(rows).toHaveLength(4);
    expect(rows[0]?.getAttribute('style')).toContain('grid-column: 1');
    expect(rows[2]?.getAttribute('style')).toContain('grid-column: 2');
    expect(rows[3]?.getAttribute('style')).toContain('grid-column: 3');
  });

  it('아직 안 돈 걸음은 줄기까지 가려진다 — 어느 줄기인지가 곧 답이다', () => {
    const { container } = render(<QueueLadder model={QUEUE} step={1} />);
    const rows = [...container.querySelectorAll('.ql-row')];
    expect(rows[2]?.className).toContain('veil');
    expect(rows[2]?.getAttribute('style')).toContain('grid-column: 1 / 4');
    expect(rows[2]?.querySelector('.ql-code')?.textContent).toBe('');
  });

  it('예측은 지금 걸음부터 가린다 — 지난 걸음까지 가리면 재료가 사라진다', () => {
    const { container } = render(<QueueLadder model={QUEUE} step={3} phase="predict" />);
    const codes = [...container.querySelectorAll('.ql-code')].map((n) => n.textContent);
    // 지난 걸음은 예측의 재료라 남고, **지금 걸음부터** 사라진다 (걸음 사다리와 같은 규약).
    expect(codes).toEqual(["log('1')", "log('2')", 'g()', '']);
    const label = screen.getByRole('img').getAttribute('aria-label') ?? '';
    expect(label).toContain('3번째는 micro');
    expect(label).not.toContain('f()');
    expect(label).toContain('나머지 1걸음은 가려져');
  });

  it('한 문장 aria-label 과 표 대체를 함께 낸다', () => {
    const { container } = render(<QueueLadder model={QUEUE} step={3} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('4번째는 task 줄기의 f()');
    expect(container.querySelectorAll('.dgm-alt tbody tr')).toHaveLength(4);
    expect(container.querySelector('.dgm-alt [aria-current="step"]')).not.toBeNull();
  });
});

/* ───────── 나란한 걸음 ───────── */

describe('ParallelSteps — 간선이 곧 순서의 근거', () => {
  it('레인이 열, 걸음이 행이고 레인 사이에 골이 있다', () => {
    const { container } = render(<ParallelSteps model={LANES} />);
    expect(container.querySelectorAll('.ps-lane')).toHaveLength(2);
    expect(container.querySelectorAll('.ps-step')).toHaveLength(5);
    const grid = container.querySelector('.ps');
    expect(grid?.getAttribute('style')).toContain('4.5rem');
  });

  it('간선이 두 걸음을 잇고 방향이 클래스에 남는다', () => {
    const { container } = render(<ParallelSteps model={LANES} />);
    const edges = [...container.querySelectorAll('.ps-edge')];
    expect(edges).toHaveLength(2);
    expect(edges[0]?.className).toContain('right');
    expect(edges[0]?.className).toContain('up'); // main[1] → work[0]
    expect(edges[1]?.className).toContain('left');
    expect(edges[1]?.className).toContain('down'); // work[1] → main[2] 는 아래로
    expect(edges[0]?.querySelector('.ps-tag')?.textContent).toBe('go');
    expect(edges[1]?.querySelector('.ps-tag')?.textContent).toBe('보냄');
  });

  it('예측은 걸음을 가리고 간선은 남긴다 — 채널 연산의 짝이 물음이다', () => {
    const { container } = render(<ParallelSteps model={LANES} phase="predict" />);
    expect(container.querySelectorAll('.ps-step.veil')).toHaveLength(5);
    expect(container.textContent).not.toContain('sum := 1 + 2');
    expect(container.querySelectorAll('.ps-edge')).toHaveLength(2);
    expect(container.querySelector('.dgm-alt')?.textContent).not.toContain('sum := 1 + 2');
  });

  it('한 문장 aria-label 이 순서를 말하고, 표 대체가 둘이다 (걸음과 간선)', () => {
    const { container } = render(<ParallelSteps model={LANES} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('보다 먼저입니다');
    expect(container.querySelectorAll('.dgm-alt table')).toHaveLength(2);
    expect(container.querySelectorAll('.dgm-alt tbody tr')).toHaveLength(7); // 걸음 다섯 + 간선 둘
  });
});
