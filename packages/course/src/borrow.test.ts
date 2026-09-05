/**
 * 창 빌림 (D172 ⑤ · D157 ②). 번들 사전에서 `cs/` 를 가리키는 언어 개념이 실제로 있는지,
 * 빌릴 창을 고르는 규칙이 첫 노출 규칙과 같은지 본다.
 */
import { describe, expect, test } from 'vitest';

import { PROTO_SITE_ID, genMeaning } from '@chickadee/cards';
import { loadDict } from '@chickadee/dictionary';
import type { ConceptId, ConceptSite } from '@chickadee/store-sql';

import { borrowedInput, evidenceBlock, lenders, pickLender, type LenderSite } from './borrow.js';

const dict = loadDict();

const siteOf = (id: number, conceptId: string, over: Partial<ConceptSite> = {}): LenderSite => ({
  conceptId,
  path: 'src/cart.ts',
  site: {
    id, repoId: 1, fileId: 3, conceptId: conceptId as ConceptId, siteKey: `k${id}`,
    lineStart: 10, lineEnd: 10, colStart: 0, colEnd: 0, tsNodeKind: null, form: null, shape: 's', occurrence: 0,
    excerpt: 'const total = a + b;', picks: { 1: '+' }, hole: null, ctx: {}, lineConcepts: [], uncoveredRatio: 0,
    confidence: 'syntactic', parseQuality: 'ok', isDirty: false, isOversize: false, commitId: null,
    unknownCount: 0, isAlive: true, updatedAt: 0, ...over,
  },
});

describe('lenders', () => {
  test('번들 사전에서 cs/ 를 가리키는 언어 개념이 있다 — 26장 이상이 창을 빌릴 수 있다', () => {
    const map = lenders(dict.concepts);
    expect(map.size).toBeGreaterThanOrEqual(20);
    expect(map.get('cs/floating-point')).toContain('ts/arithmetic');
    // 목록은 정렬돼 있다 — 같은 사전에 같은 순서.
    for (const ids of map.values()) expect(ids).toEqual([...ids].sort());
  });

  test('cs/ 끼리는 빌려주지 않는다', () => {
    const map = lenders(dict.concepts);
    for (const ids of map.values()) expect(ids.every((id) => !id.startsWith('cs/'))).toBe(true);
  });
});

describe('pickLender', () => {
  test('미지가 적은 것 → 짧은 줄 → id, 추정·나쁜 파싱은 뺀다', () => {
    const picked = pickLender([
      siteOf(5, 'ts/arithmetic', { unknownCount: 2 }),
      siteOf(4, 'ts/arithmetic', { unknownCount: 0, confidence: 'heuristic' }),
      siteOf(3, 'ts/arithmetic', { unknownCount: 0, lineEnd: 12 }),
      siteOf(2, 'ts/arithmetic', { unknownCount: 0 }),
      siteOf(1, 'ts/arithmetic', { unknownCount: 0, parseQuality: 'poor' }),
    ]);
    expect(picked?.site.id).toBe(2);
    expect(pickLender([])).toBeNull();
  });
});

describe('borrowedInput → genMeaning', () => {
  test('빌린 창 위에 기계 개념의 뜻 고르기가 구워진다 — 자리는 규약과 같은 자리표', () => {
    const lender = siteOf(7, 'ts/arithmetic');
    const lines = [{ n: 9, t: 'let sum = 0;' }, { n: 10, t: 'const total = a + b;' }, { n: 11, t: 'return total;' }];
    const input = borrowedInput('cs/floating-point', lender, lines, { from: 9, to: 11 });
    expect(input.site.id).toBe(PROTO_SITE_ID);
    expect(input.site.conceptId).toBe('cs/floating-point');
    expect(input.site.siteKey).toBe('borrow:ts/arithmetic:k7');
    const concept = dict.concepts.get('cs/floating-point')!;
    const out = genMeaning({ repoId: 1, dictVersion: 'x', attempt: 0, ly: 0, concept, concepts: dict.concepts, sites: [input] }, input);
    if ('reason' in out) throw new Error(out.reason);
    expect(out.card.kind).toBe('meaning');
    expect(out.card.payload.file).toBe('src/cart.ts');
  });
});

describe('evidenceBlock', () => {
  test('근거 낱말이 처음 보이는 블록', () => {
    const jwt = dict.concepts.get('proto/jwt')!;
    const blocks = [
      { lines: [{ n: 1, t: 'int n = 1;' }] },
      { lines: [{ n: 30, t: 'return Jwts.builder().signWith(key).compact();' }] },
    ];
    expect(evidenceBlock(jwt, blocks)).toBe(blocks[1]);
    expect(evidenceBlock(jwt, [blocks[0]!])).toBeNull();
  });
});
