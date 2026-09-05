import { describe, expect, it } from 'vitest';
import type { Dict } from '@chickadee/dictionary';
import { unknownCount } from './unknown-rank.js';

// A dictionary with only what `prereqClosure` reads: `concepts.get(id)?.prereq`.
function dictOf(prereq: Record<string, string[]>): Dict {
  const concepts = new Map(
    Object.entries(prereq).map(([id, p]) => [id, { id, prereq: p }]),
  );
  return { concepts } as unknown as Dict;
}

const site = {
  conceptId: 'ts/array-basics',
  lineConcepts: ['ts/array-basics'],
  uncoveredRatio: 0,
  lineStart: 4,
  lineEnd: 4,
};

describe('unknownCount (D173)', () => {
  it('does not count prerequisites from the computed namespaces', () => {
    const dict = dictOf({
      'ts/array-basics': ['ts/number-literal', 'cs/value-vs-reference', 'cs/contiguous-vs-linked'],
      'ts/number-literal': ['cs/binary-representation'],
    });
    const nothingKnown = () => 0;
    // Only `ts/number-literal` counts; the three `cs/` prerequisites ride along without blocking.
    expect(unknownCount(site, nothingKnown, dict)).toBe(1);
  });

  it('still counts language prerequisites two levels down', () => {
    const dict = dictOf({
      'ts/array-basics': ['ts/number-literal'],
      'ts/number-literal': ['ts/variable-binding'],
      'ts/variable-binding': ['ts/too-deep'],
    });
    const nothingKnown = () => 0;
    expect(unknownCount(site, nothingKnown, dict)).toBe(2);
  });
});
