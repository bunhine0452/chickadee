import { describe, expect, it } from 'vitest';
import { bitsOf, describeBits, exactDecimal } from './bits';
import { annotate, describeTree, foldSteps, foldedText, isFolded } from './tree';
import type { EvalTreeModel } from './types';

describe('exactDecimal — 반올림 없는 십진 전개', () => {
  it('0.1 은 안 떨어진다. 이 55자리가 수업 자체다', () => {
    expect(exactDecimal(0.1)).toBe('0.1000000000000000055511151231257827021181583404541015625');
  });

  it('2의 거듭제곱 분수는 정확히 떨어진다 — 「실수는 다 부정확」이 아니다', () => {
    expect(exactDecimal(0.5)).toBe('0.5');
    expect(exactDecimal(0.25)).toBe('0.25');
    expect(exactDecimal(3)).toBe('3');
  });

  it('부호와 0 을 잃지 않는다', () => {
    expect(exactDecimal(-0.5)).toBe('-0.5');
    expect(exactDecimal(0)).toBe('0');
    expect(exactDecimal(-0)).toBe('-0');
  });

  it('0.1 + 0.2 가 0.3 이 아닌 이유가 글자로 보인다', () => {
    expect(exactDecimal(0.1 + 0.2)).not.toBe(exactDecimal(0.3));
    expect(exactDecimal(0.1 + 0.2).startsWith('0.30000000000000004')).toBe(true);
  });
});

describe('bitsOf — 값에서 그림이 나온다', () => {
  it('f64 0.1 의 비트와 묶음', () => {
    const m = bitsOf(0.1, 'f64');
    expect(m.width).toBe(64);
    expect(m.bits.length).toBe(64);
    expect(m.bits.slice(0, 12)).toBe('001111111011');
    expect(m.fields.map((f) => [f.kind, f.from, f.to])).toEqual([
      ['sign', 0, 1],
      ['exponent', 1, 12],
      ['mantissa', 12, 64],
    ]);
    expect(m.lossy).toBe(true);
    expect(m.fields[1]?.note).toContain('2^-4');
  });

  it('0.5 는 손실이 없다 — 그림이 거짓말을 하지 않는다', () => {
    expect(bitsOf(0.5, 'f64').lossy).toBe(false);
    expect(bitsOf(0.5, 'f64').stored).toBe('0.5');
  });

  it('f32 는 f64 보다 먼저 잃는다', () => {
    const m = bitsOf(0.1, 'f32');
    expect(m.width).toBe(32);
    expect(m.lossy).toBe(true);
    expect(m.stored).not.toBe(bitsOf(0.1, 'f64').stored);
  });

  it('i32 는 2의 보수다 — 음수의 최상위가 1', () => {
    expect(bitsOf(1, 'i32').bits).toBe('0'.repeat(31) + '1');
    expect(bitsOf(-1, 'i32').bits).toBe('1'.repeat(32));
    expect(bitsOf(-1, 'i32').fields[0]?.note).toContain('음수');
  });

  it('폭을 넘으면 감긴다 — 오버플로가 「에러」가 아니라 값이 되는 자리', () => {
    const m = bitsOf(2_147_483_648, 'i32');
    expect(m.wrapped).toBe(true);
    expect(m.stored).toBe('-2147483648');
  });

  it('부호 없는 정수는 부호 묶음이 아예 없다', () => {
    const m = bitsOf(255, 'u8');
    expect(m.fields).toHaveLength(1);
    expect(m.bits).toBe('11111111');
  });

  it('묶음 이름을 화면이 덮어쓸 수 있다 — t() 자리', () => {
    const m = bitsOf(0.1, 'f64', { labels: { exponent: 'exponent' }, literal: '0.1f' });
    expect(m.fields[1]?.label).toBe('exponent');
    expect(m.literal).toBe('0.1f');
  });
});

describe('describeBits — 낭독기는 「1 0 1 1」이 아니라 뜻을 듣는다', () => {
  it('공개 상태는 저장된 값까지 말한다', () => {
    const s = describeBits(bitsOf(0.1, 'f64'));
    expect(s).toContain('64비트 f64');
    expect(s).toContain('가수 52비트');
    expect(s).toContain('적은 값과 다릅니다');
  });

  it('예측 상태는 값을 말하지 않는다 — 낭독기로 답이 새면 문제가 죽는다', () => {
    const s = describeBits(bitsOf(0.1, 'f64'), 'predict');
    expect(s).toContain('가려져');
    expect(s).not.toContain('0.1000000000000000055');
  });
});

/** `2 + 3 * 4` — 우선순위는 트리 모양이 담고, 접히는 순서는 후위 순회다. */
const EXPR: EvalTreeModel = {
  expr: '2 + 3 * 4',
  root: {
    kind: 'op',
    op: '+',
    result: '14',
    kids: [
      { kind: 'leaf', text: '2' },
      {
        kind: 'op',
        op: '*',
        result: '12',
        kids: [
          { kind: 'leaf', text: '3' },
          { kind: 'leaf', text: '4' },
        ],
      },
    ],
  },
};

describe('평가 트리의 접히는 순서', () => {
  it('연산 마디 수가 곧 단계 수다', () => {
    expect(foldSteps(EXPR.root)).toBe(2);
    expect(foldSteps({ kind: 'leaf', text: '7' })).toBe(0);
  });

  it('후위 순회 — 곱셈이 먼저 접힌다', () => {
    const at = annotate(EXPR.root);
    const mul = at.kids[1];
    expect(at.order).toBe(2);
    expect(mul?.order).toBe(1);
    expect(mul === undefined ? null : isFolded(mul, 1)).toBe(true);
    expect(isFolded(at, 1)).toBe(false);
  });

  it('단계마다 남는 식', () => {
    const at = annotate(EXPR.root);
    expect(foldedText(at, 0)).toBe('2 + (3 * 4)');
    expect(foldedText(at, 1)).toBe('2 + 12');
    expect(foldedText(at, 2)).toBe('14');
  });

  it('낭독기는 지금 무엇이 접히는지를 듣는다', () => {
    expect(describeTree(EXPR, 1)).toContain('3 * 4');
    expect(describeTree(EXPR, 1)).toContain('12');
    expect(describeTree(EXPR, 0)).toContain('아직 아무것도');
    expect(describeTree(EXPR, 2, 'predict')).not.toContain('14');
  });
});

describe('문항의 값은 문자열이다 — 3 과 3.0 이 갈린다', () => {
  it('문자열을 그대로 받고 적힌 글자를 잃지 않는다', () => {
    expect(bitsOf('3.0', 'f64').literal).toBe('3.0');
    expect(bitsOf('3', 'f64').literal).toBe('3');
    expect(bitsOf('3.0', 'f64').bits).toBe(bitsOf(3, 'f64').bits);
    expect(bitsOf('3.0', 'f64').lossy).toBe(false);
  });

  it('정수 타입에 소수 문자열이 오면 잘렸다고 표시한다', () => {
    const m = bitsOf('3.7', 'i32');
    expect(m.stored).toBe('3');
    expect(m.wrapped).toBe(true);
  });

  it('i64 는 문자열이라야 자릿수를 안 잃는다', () => {
    expect(bitsOf('9007199254740993', 'i64').stored).toBe('9007199254740993');
  });
});
