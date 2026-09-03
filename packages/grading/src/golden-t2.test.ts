/**
 * T2 채점 골든 (04 §9). `golden-t1.test.ts` 와 같은 두 겹이다:
 *
 * - `requires` — **04 §9 의 그 줄**을 손으로 옮긴 것. 문서가 정본이므로 생성하지 않는다.
 *   이 칸이 깨지면 규칙이 깨진 것이다.
 * - `expected.json` — 결과 전체의 회귀 스냅샷. `UPDATE_GOLDEN=1` 로 다시 쓰고 diff 를 눈으로
 *   본다. 이 칸이 깨지면 무엇이 달라졌는지 diff 한 줄로 보인다.
 *
 * 케이스가 JSON 인 이유는 T0·T1 과 같다 — 케이스를 늘리는 데 코드를 안 고쳐도 되고,
 * 규칙이 바뀌면 **무엇이** 바뀌었는지 diff 로 보인다.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import { gradeDirection, gradeFlow, gradePicks } from './t2.js';
import type { T2Payload, T2Result } from './t2-types.js';

interface Require {
  pct?: number;
  verdict?: T2Result['verdict'];
  found?: number;
  missed?: number;
  wrong?: number;
  bonus?: number;
  /** 진급을 막은 문장이 있는가 (04 §8.2 `|wrong|` 상한). */
  capped?: boolean;
}

type Answer =
  | { kind: 'placement' | 'radius'; selected: string[] }
  | { kind: 'flow'; ordered: string[] }
  | { kind: 'direction'; picks: (0 | 1 | 2 | 3)[] };

interface Case {
  id: string;
  rule: string;
  payload: T2Payload;
  answer: Answer;
  hints: number;
  requires: Require;
}

const DIR = join(process.cwd(), 'fixtures/golden/t2');
const cases = (JSON.parse(readFileSync(join(DIR, 'cases.json'), 'utf8')) as { cases: Case[] }).cases;
const EXPECTED = join(DIR, 'expected.json');

function grade(one: Case): T2Result {
  const { payload, hints } = one;
  if (one.answer.kind === 'flow') return gradeFlow({ payload, ordered: one.answer.ordered, hints });
  if (one.answer.kind === 'direction') {
    return gradeDirection({ payload, picks: one.answer.picks, hints });
  }
  return gradePicks({ kind: one.answer.kind, payload, selected: one.answer.selected, hints });
}

const actual: Record<string, unknown> = {};

describe('T2 골든 (04 §9)', () => {
  for (const one of cases) {
    test(`${one.id} — ${one.rule}`, () => {
      const result = grade(one);
      actual[one.id] = result;
      const want = one.requires;
      if (want.pct !== undefined) expect(result.pct).toBe(want.pct);
      if (want.verdict !== undefined) expect(result.verdict).toBe(want.verdict);
      if (want.found !== undefined) expect(result.found).toHaveLength(want.found);
      if (want.missed !== undefined) expect(result.missed).toHaveLength(want.missed);
      if (want.wrong !== undefined) expect(result.wrong).toHaveLength(want.wrong);
      if (want.bonus !== undefined) expect(result.bonus).toHaveLength(want.bonus);
      if (want.capped !== undefined) expect(result.capped !== null).toBe(want.capped);
    });
  }

  test('두 번 채점하면 같은 결과다 — 채점에 난수도 시각도 없다 (04 §9)', () => {
    for (const one of cases) expect(grade(one)).toEqual(grade(one));
  });

  test('결과 전체가 스냅샷과 같다', () => {
    const rendered = `${JSON.stringify(actual, null, 2)}\n`;
    if (process.env.UPDATE_GOLDEN === '1' || !existsSync(EXPECTED)) {
      writeFileSync(EXPECTED, rendered);
      return;
    }
    expect(rendered).toBe(readFileSync(EXPECTED, 'utf8'));
  });
});
