import { stagePasses } from '@chickadee/concepts';
import type { StageVerdict } from '@chickadee/grading';
import { describe, expect, test } from 'vitest';

import { GATE_CAP, GATE_EACH, GATE_FIRST, planGates } from './gate.js';
import { EST_MIN, tally, type StageCardView } from './run.js';

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

/**
 * 2단 통과 조건 (D187 ⑱). 값 추적 판이 2단에 들어오면서 물음이 하나 생겼다 —
 * **그것도 통과해야 하나.** 답은 그렇다. 근거 둘.
 *
 * ① `gradeStage` 가 값 추적을 `gated: true` 로 낸다. 실행이 필요 없는 판이라 4·5단처럼
 *    「러너가 없으면 게이트 밖」이 될 자리가 없다 — 모든 칸이 코드에서 결정된다.
 * ② 2단의 통과선은 `stagePasses` 가 「전부 맞음」이다(`mastery.md` §3.2). 격자의 부분 점수는
 *    **표시값**이지 통과선이 아니다 — 한 칸을 놓치면 「값이 언제 바뀌나」를 놓친 것이다.
 *
 * **못 구운 챕터는 경로 판만으로 통과한다.** 판이 없으면 셈에도 없으므로 통과선이 저절로
 * 내려앉는다 — 4단 문항이 없는 챕터의 통과선이 3으로 내려앉는 것(D165)과 같은 장치다.
 * 그 사실은 화면이 말한다(`chapter.traceMissing` · D186 ④).
 */
describe('2단 통과 조건 — 값 추적이 들어오면 (D187 ⑱)', () => {
  const card = (type: StageCardView['type']): StageCardView => ({
    id: 1, kind: 'flow', conceptId: 'exec/order' as StageCardView['conceptId'],
    stageNo: 2, type,
    payload: { track: 't2', kind: 'flow', q: '', hint: '', bands: [], files: [], edges: [], core: {}, sec: {}, trap: {}, hints: [] },
    estMin: EST_MIN[type],
  });
  const verdict = (ok: boolean, pct: number): StageVerdict =>
    ({ ok, pct, diagnosis: null, okText: null, rule: null, detail: { kind: 'wrong-shape' }, gated: true, run: null });

  const CARDS = [card('exec'), card('hop'), card('origin'), card('caller'), card('trace-table')];

  test('값 추적 판도 셈에 든다 — 그것을 틀리면 2단이 미달이다', () => {
    const t = tally(CARDS, { 0: verdict(true, 100), 1: verdict(true, 100), 2: verdict(true, 100), 3: verdict(true, 100), 4: verdict(false, 75) });
    expect(t).toEqual({ asked: 5, correct: 4 });
    expect(stagePasses(2, t.asked, t.correct)).toBe(false);
  });

  test('부분 점수는 표시값이다 — 75% 로는 2단을 못 넘는다', () => {
    const t = tally([card('trace-table')], { 0: verdict(false, 75) });
    expect(stagePasses(2, t.asked, t.correct)).toBe(false);
  });

  test('격자를 못 구운 챕터는 경로 판 넷만으로 통과한다', () => {
    const paths = CARDS.slice(0, 4);
    const t = tally(paths, { 0: verdict(true, 100), 1: verdict(true, 100), 2: verdict(true, 100), 3: verdict(true, 100) });
    expect(t).toEqual({ asked: 4, correct: 4 });
    expect(stagePasses(2, t.asked, t.correct)).toBe(true);
  });

  test('다섯 장 다 맞으면 통과다', () => {
    const t = tally(CARDS, Object.fromEntries(CARDS.map((_, i) => [i, verdict(true, 100)])));
    expect(stagePasses(2, t.asked, t.correct)).toBe(true);
  });
});
