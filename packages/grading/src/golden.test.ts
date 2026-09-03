/**
 * T0 채점기 골든 (06 §1.3). 케이스는 `__golden__/t0/*.json` 이고 각 파일이 04 문서의 규칙을
 * `rule` 로 참조한다.
 *
 * 왜 JSON 인가: 케이스를 늘리는 데 코드를 안 고쳐도 되고, 채점 규칙이 바뀌면 **무엇이**
 * 바뀌었는지 diff 한 줄로 보인다. 사전 기여자가 케이스를 보내는 표면도 이 모양이다.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import { gradeT0, type T0Card } from './t0.js';

interface GoldenCase {
  name: string;
  /** 04 문서의 규칙 번호·문장. 케이스가 왜 있는지가 여기 적힌다. */
  rule: string;
  card: T0Card;
  parent?: T0Card;
  choice: number;
  expect: {
    ok: boolean;
    /** 진단이 `card.why[i]` 그대로여야 하면 그 i. 폴백이거나 정답이면 `null`. */
    why_index: number | null;
    diag_is_rule?: boolean;
    has_edge?: boolean;
    has_result: boolean;
    has_bridge: boolean;
    bridge?: string;
  };
}

const DIR = new URL('./__golden__/t0/', import.meta.url).pathname;

const cases: GoldenCase[] = readdirSync(DIR)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => JSON.parse(readFileSync(join(DIR, f), 'utf8')) as GoldenCase);

describe('T0 채점 골든', () => {
  test('케이스가 비어 있지 않다 — 디렉터리를 잘못 잡으면 조용히 0건이 된다', () => {
    expect(cases.length).toBeGreaterThanOrEqual(6);
  });

  test.each(cases.map((c) => [c.name, c] as const))('%s', (_name, c) => {
    const verdict = gradeT0(c.card, c.choice, c.parent ?? null);

    expect(verdict.correct).toBe(c.expect.ok);

    if (c.expect.why_index === null) {
      if (c.expect.ok) expect(verdict.diag).toBeNull();
      else if (c.expect.diag_is_rule === true) expect(verdict.diag?.t).toBe(c.card.rule);
    } else {
      expect(verdict.diag).toStrictEqual(c.card.why[c.expect.why_index]);
    }

    expect(verdict.diag?.edge !== undefined).toBe(c.expect.has_edge === true);
    expect('result' in verdict).toBe(c.expect.has_result);
    expect('bridge' in verdict).toBe(c.expect.has_bridge);
    if (c.expect.bridge !== undefined) expect(verdict.bridge).toBe(c.expect.bridge);

    // 어느 케이스든 판정란은 채워진다 — 05 가 `min-height` 를 예약한 자리다.
    expect(verdict.ok.length).toBeGreaterThan(0);
    expect(verdict.rule.length).toBeGreaterThan(0);
  });

  test('모든 케이스가 04 문서의 규칙을 참조한다', () => {
    for (const c of cases) expect(c.rule).toMatch(/04 §/);
  });

  test('같은 카드를 두 번 채점하면 같은 판정이다', () => {
    for (const c of cases) {
      expect(gradeT0(c.card, c.choice, c.parent ?? null))
        .toStrictEqual(gradeT0(c.card, c.choice, c.parent ?? null));
    }
  });
});
