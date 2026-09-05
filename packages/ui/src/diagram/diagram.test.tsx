// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BitField } from './BitField';
import { EvalTree } from './EvalTree';
import { ValueBox } from './ValueBox';
import { bitsOf } from './bits';
import type { EvalTreeModel, ValueBoxModel } from './types';

afterEach(cleanup);

const EXPR: EvalTreeModel = {
  expr: '2 + 3 * 4',
  root: {
    kind: 'op',
    op: '+',
    result: '14',
    kids: [
      { kind: 'leaf', text: '2' },
      { kind: 'op', op: '*', result: '12', kids: [{ kind: 'leaf', text: '3' }, { kind: 'leaf', text: '4' }] },
    ],
  },
};

const VARS: ValueBoxModel = {
  steps: [
    { code: 'int x = 3;', cells: [{ name: 'x', type: 'int', value: '3', changed: true, from: '3' }] },
    {
      code: 'int y = x + 1;',
      cells: [
        { name: 'x', type: 'int', value: '3' },
        { name: 'y', type: 'int', value: '4', changed: true, from: 'x + 1' },
      ],
    },
  ],
};

describe('BitField', () => {
  it('묶음마다 한 줄이고 비트 수가 폭과 맞는다', () => {
    const { container } = render(<BitField model={bitsOf(0.1, 'f64')} />);
    expect(container.querySelectorAll('.bits-row')).toHaveLength(3);
    expect(container.querySelectorAll('.bit')).toHaveLength(64);
    expect(container.querySelectorAll('.bit.on').length).toBeGreaterThan(0);
  });

  it('예측 상태는 비트도 저장된 값도 안 보여 준다 — 답을 흘리지 않는다', () => {
    const { container } = render(<BitField model={bitsOf(0.1, 'f64')} phase="predict" />);
    expect(container.querySelectorAll('.bit.veil')).toHaveLength(64);
    expect(container.querySelectorAll('.bit.on')).toHaveLength(0);
    expect(container.textContent).not.toContain('0.1000000000000000055');
    // 구조(묶음 이름·폭)는 남는다 — 무엇을 물었는지는 보여야 한다.
    expect(container.textContent).toContain('가수');
  });

  it('공개 상태에서 「적은 값과 다르다」가 글자로 나온다 (색으로만 말하지 않는다)', () => {
    render(<BitField model={bitsOf(0.1, 'f64')} />);
    expect(screen.getByText('적은 값과 다릅니다')).not.toBeNull();
  });

  it('한 문장 aria-label 과 표 대체를 함께 낸다', () => {
    const { container } = render(<BitField model={bitsOf(0.1, 'f64')} />);
    const img = screen.getByRole('img');
    expect(img.getAttribute('aria-label')).toContain('가수 52비트');
    expect(container.querySelector('.dgm-alt table')).not.toBeNull();
    expect(container.querySelectorAll('.dgm-alt tbody tr')).toHaveLength(5);
  });
});

describe('EvalTree', () => {
  it('0단계는 트리 전체, 1단계는 곱셈만 접힌다', () => {
    const { container, rerender } = render(<EvalTree model={EXPR} step={0} />);
    expect(container.querySelectorAll('.tn-box.op')).toHaveLength(2);
    expect(container.querySelectorAll('.tn-box.val')).toHaveLength(0);
    rerender(<EvalTree model={EXPR} step={1} />);
    expect(container.querySelectorAll('.tn-box.op')).toHaveLength(1);
    expect(screen.getByText('12').className).toContain('now');
  });

  it('마지막 단계는 값 하나만 남는다', () => {
    const { container } = render(<EvalTree model={EXPR} step={9} />);
    expect(container.querySelectorAll('.tn-box')).toHaveLength(1);
    expect(container.querySelector('.tree-line')?.textContent).toBe('14');
  });

  it('예측 상태는 접히는 순서만 보여 주고 값은 가린다', () => {
    const { container } = render(<EvalTree model={EXPR} step={1} phase="predict" />);
    expect(container.querySelector('.tn-box.val')?.textContent).toBe('');
    expect(container.querySelector('.tree-line')?.textContent).toBe('2 + 3 * 4');
  });

  it('onStep 을 준 때만 단계 버튼이 생기고, 버튼은 그림 밖에 있다', () => {
    const onStep = vi.fn();
    const { container, rerender } = render(<EvalTree model={EXPR} step={0} />);
    expect(container.querySelector('.dgm-nav')).toBeNull();
    rerender(<EvalTree model={EXPR} step={1} onStep={onStep} />);
    expect(screen.getByRole('img').querySelector('button')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '다음' }));
    expect(onStep).toHaveBeenCalledWith(2);
  });
});

describe('ValueBox', () => {
  it('칸마다 이름표와 값이 있고, 바뀐 칸에만 화살표가 선다', () => {
    const { container } = render(<ValueBox model={VARS} step={1} />);
    expect(container.querySelectorAll('.vb-cell')).toHaveLength(2);
    expect(container.querySelectorAll('.vb-arrow.on')).toHaveLength(1);
    expect(container.querySelector('.vb-cell.now .vb-name')?.textContent).toContain('y');
    expect(screen.getByText('x + 1')).not.toBeNull();
  });

  it('예측 상태는 **바뀐 칸만** 가린다 — 나머지는 예측의 재료다', () => {
    const { container } = render(<ValueBox model={VARS} step={1} phase="predict" />);
    const vals = [...container.querySelectorAll('.vb-val')].map((n) => n.textContent);
    expect(vals).toEqual(['3', '']);
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('가려져');
  });

  it('범위를 넘는 단계는 잘린다', () => {
    render(<ValueBox model={VARS} step={99} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('2번째 줄');
  });

  it('표 대체가 칸마다 한 줄이다', () => {
    const { container } = render(<ValueBox model={VARS} step={1} />);
    expect(container.querySelectorAll('.dgm-alt tbody tr')).toHaveLength(2);
    expect(container.querySelector('.dgm-alt [aria-current="true"]')).not.toBeNull();
  });
});

describe('EvalTree — 걸음 사다리 (문항 형식 `step` 의 fold 를 그대로 받는다)', () => {
  const FOLD = {
    expr: '7 / 2',
    steps: [
      { code: '7 / 2', type: 'int / int' },
      { code: '3', type: 'int' },
    ],
  };

  it('걸음마다 한 줄이고 코드와 타입을 나눠 싣는다', () => {
    const { container } = render(<EvalTree fold={FOLD} step={1} />);
    expect(container.querySelectorAll('.fold-row')).toHaveLength(2);
    expect(container.querySelector('.fold-row.now .fold-type')?.textContent).toBe('int');
  });

  it('주어진 식은 예측에서도 남는다 — 물음까지 가리면 안 된다', () => {
    const { container } = render(<EvalTree fold={FOLD} step={1} phase="predict" />);
    const codes = [...container.querySelectorAll('.fold-code')].map((n) => n.textContent);
    expect(codes).toEqual(['7 / 2', '']);
    expect(screen.getByRole('img').getAttribute('aria-label')).not.toContain('타입은 int');
  });

  it('트리도 걸음도 없으면 아무것도 안 그린다', () => {
    const { container } = render(<EvalTree step={0} />);
    expect(container.innerHTML).toBe('');
  });
});
