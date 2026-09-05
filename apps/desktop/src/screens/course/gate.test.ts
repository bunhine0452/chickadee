import { describe, expect, test } from 'vitest';

import { GATE_CAP, GATE_EACH, GATE_FIRST, planGates } from './gate.js';

const ids = (prefix: string, n: number): string[] =>
  Array.from({ length: n }, (_, i) => `${prefix}/${String(i)}`);

describe('어휘 관문 (D171 ③ · course.md §3.2)', () => {
  test('관문 0 은 12판, 그다음은 6판', () => {
    const gates = planGates([
      { unitId: 1, zero: ids('a', 20) },
      { unitId: 2, zero: ids('b', 20) },
    ]);
    expect(gates[0]?.concepts).toHaveLength(GATE_FIRST);
    expect(gates[0]?.cut).toBe(8);
    expect(gates[1]?.concepts).toHaveLength(GATE_EACH);
    expect(gates[1]?.cut).toBe(14);
  });

  test('코스 전체 40판 — 뒤 챕터의 관문이 잘린다', () => {
    // 첫 챕터는 20개(12 로 잘린다), 나머지는 10개씩(6 으로 잘린다).
    const chapters = Array.from({ length: 9 }, (_, i) => ({ unitId: i + 1, zero: ids(`c${String(i)}`, i === 0 ? 20 : 10) }));
    const gates = planGates(chapters);
    const total = gates.reduce((s, g) => s + g.concepts.length, 0);
    expect(total).toBe(GATE_CAP);
    // 12 + 6×4 = 36, 여섯째는 4, 그 뒤는 0.
    expect(gates.map((g) => g.concepts.length)).toEqual([12, 6, 6, 6, 6, 4, 0, 0, 0]);
    expect(gates[5]?.cut).toBe(6);
    expect(gates[8]?.cut).toBe(10);
  });

  test('0겹이 없는 챕터는 관문이 비고 상한을 안 쓴다', () => {
    const gates = planGates([
      { unitId: 1, zero: [] },
      { unitId: 2, zero: ids('b', 3) },
    ]);
    expect(gates[0]?.concepts).toEqual([]);
    expect(gates[1]?.concepts).toHaveLength(3);
    expect(gates[1]?.cut).toBe(0);
  });

  test('순서를 지킨다 — 앞에 온 개념이 먼저 든다', () => {
    const gates = planGates([{ unitId: 1, zero: ['x/2', 'x/1', 'x/0'] }]);
    expect(gates[0]?.concepts).toEqual(['x/2', 'x/1', 'x/0']);
  });
});
