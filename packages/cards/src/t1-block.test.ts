/**
 * 블록 선정 · 분절 · 대표 개념 (04 §3.1).
 */
import { describe, expect, test } from 'vitest';
import { loadDict } from '@chickadee/dictionary';

import {
  MAX_BLOCK_LINES, MIN_BLOCK_LINES, pickConcept, rankBlocks, segment, signatureRange,
} from './t1-block.js';
import type { BlockCandidate, BlockConcept } from './t1-types.js';

const dict = loadDict({ dependencies: ['react'] });
const ESSENTIAL = new Set([
  ...(dict.langs.get('ts')?.essential ?? []),
  ...(dict.langs.get('react')?.essential ?? []),
]);

function candidate(over: Partial<BlockCandidate> = {}): BlockCandidate {
  const lines = over.lines ?? Array.from({ length: 20 }, (_, i) => `  const x${i} = ${i}`);
  return {
    blockId: 1, fileId: 7, path: 'src/features/auth/LoginForm.tsx', rev: null,
    name: 'LoginForm', kind: 'function', lineStart: 1, lineEnd: lines.length,
    textHash: 'hash-1', lastCommitAt: null, concepts: [], ...over, lines,
  };
}

const blockConcept = (over: Partial<BlockConcept> & { conceptId: string }): BlockConcept =>
  ({ layer: 2, siteCount: 1, siteId: 1, ...over });

// ───────── 분절 ─────────

describe('segment', () => {
  const big = (bodyLines: number): string[] => [
    'export function big() {',
    ...Array.from({ length: bodyLines }, (_, i) => `  const step${i} = run(${i})`),
    '}',
  ];

  test('40줄 이하는 나누지 않는다 — 입력 그대로 한 조각', () => {
    const lines = big(20);
    const out = segment(lines, { grammar: 'typescript' });
    expect(out).toHaveLength(1);
    expect(out[0]?.lines).toStrictEqual(lines);
    expect(out[0]?.continued).toBe(false);
  });

  test('62줄 함수는 조각마다 12~40줄, 시그니처와 닫힘을 되풀이한다', () => {
    const out = segment(big(60), { grammar: 'typescript' });
    expect(out.length).toBeGreaterThan(1);
    for (const piece of out) {
      expect(piece.lines.length).toBeGreaterThanOrEqual(MIN_BLOCK_LINES);
      expect(piece.lines.length).toBeLessThanOrEqual(MAX_BLOCK_LINES);
      expect(piece.lines).toContain('export function big() {');
      expect(piece.lines[piece.lines.length - 1]).toBe('}');
      expect(piece.kind).toBe('segment');
    }
  });

  test('2번째 조각부터 첫 줄이 「…이어서」 주석 헤더다', () => {
    const out = segment(big(60), { grammar: 'typescript' });
    expect(out[0]?.lines[0]).toBe('export function big() {');
    for (const piece of out.slice(1)) {
      expect(piece.lines[0]).toBe('// …이어서');
      expect(piece.continued).toBe(true);
    }
  });

  test('py 는 주석 접두가 `#` 다', () => {
    const py = [
      'def big():',
      ...Array.from({ length: 60 }, (_, i) => `    step${i} = run(${i})`),
    ];
    const out = segment(py, { grammar: 'python' });
    expect(out.length).toBeGreaterThan(1);
    expect(out[1]?.lines[0]).toBe('# …이어서');
  });

  test('본문 줄은 한 번씩만 쓰이고 파일 줄 범위가 이어진다', () => {
    const lines = big(60);
    const out = segment(lines, { grammar: 'typescript', lineStart: 100 });
    const body = out.flatMap((p) => p.lines.filter((l) => l.startsWith('  const step')));
    expect(body).toStrictEqual(lines.slice(1, 61));
    expect(out[0]?.lineStart).toBe(101);
    for (const [i, piece] of out.entries()) {
      if (i === 0) continue;
      expect(piece.lineStart).toBe((out[i - 1]?.lineEnd ?? 0) + 1);
    }
    expect(out[out.length - 1]?.lineEnd).toBe(160);
  });

  test('본문이 문장 하나면 나누지 않는다 — 자를 자리가 없다', () => {
    const blob = [
      'export function big() {',
      '  return fetchAll()',
      ...Array.from({ length: 60 }, () => '    .then(next)'),
      '}',
    ];
    expect(segment(blob, { grammar: 'typescript' })).toHaveLength(1);
  });
});

describe('signatureRange', () => {
  test('앞머리 주석은 범위 밖, 데코레이터는 안', () => {
    const lines = ['// 로그인 폼', 'export function LoginForm() {', '  return null', '}'];
    expect(signatureRange(lines, 'typescript')).toStrictEqual({ start: 1, end: 1 });
    const py = ['# 카트', '@dataclass', 'class Cart:', '    pass'];
    expect(signatureRange(py, 'python')).toStrictEqual({ start: 1, end: 2 });
  });

  test('여러 행에 걸친 rs 시그니처는 `{` 행까지', () => {
    const rs = ['#[inline]', 'pub fn total(', '    items: &[Item],', ') -> u32 {', '    0', '}'];
    expect(signatureRange(rs, 'rust')).toStrictEqual({ start: 0, end: 3 });
  });
});

// ───────── 순위 ─────────

describe('rankBlocks — 탈락 조건', () => {
  const withConcepts = (over: Partial<BlockCandidate>): BlockCandidate =>
    candidate({ concepts: [blockConcept({ conceptId: 'ts/const-declaration' })], ...over });

  test('12~40줄 밖은 후보가 아니다', () => {
    const short = withConcepts({ blockId: 1, lines: ['a', 'b'] });
    const long = withConcepts({ blockId: 2, lines: Array.from({ length: 41 }, () => 'x') });
    const out = rankBlocks([short, long], { stage: 2 });
    expect(out.blocks).toStrictEqual([]);
    expect(out.dropped.map((d) => d.reason)).toStrictEqual([
      '2줄 — 필사 블록은 12~40줄이다',
      '41줄 — 필사 블록은 12~40줄이다',
    ]);
  });

  test('ly 0 개념이 4개면 떨어진다', () => {
    const unknown = withConcepts({
      concepts: ['a', 'b', 'c', 'd'].map((id) => blockConcept({ conceptId: `ts/${id}`, layer: 0 })),
    });
    const out = rankBlocks([unknown], { stage: 2 });
    expect(out.blocks).toStrictEqual([]);
    expect(out.dropped[0]?.reason).toBe('모르는 문법이 4개 — 3개까지만 필사한다');
  });

  test('첫 노출은 25줄까지 — stage 2 에서는 같은 블록이 통과한다', () => {
    const wide = withConcepts({ lines: Array.from({ length: 30 }, () => 'x') });
    expect(rankBlocks([wide], { stage: 1 }).dropped[0]?.reason)
      .toBe('첫 노출은 25줄까지다 (30줄)');
    expect(rankBlocks([wide], { stage: 2 }).blocks).toHaveLength(1);
    // prints 를 주면 stage 대신 그것을 본다.
    expect(rankBlocks([wide], { stage: 2, prints: 0 }).dropped).toHaveLength(1);
  });

  test('원문을 못 읽은 후보와 개념이 없는 후보는 사유를 달고 떨어진다', () => {
    const out = rankBlocks([
      candidate({ blockId: 1, lines: [] }),
      candidate({ blockId: 2, concepts: [] }),
    ], { stage: 2 });
    expect(out.dropped.map((d) => d.reason)).toStrictEqual([
      '블록 원문을 읽지 못했다',
      '블록에 걸린 문법 개념이 없다',
    ]);
  });
});

describe('rankBlocks — 정렬 키', () => {
  const at = (blockId: number, layers: number[], lastCommitAt: number | null): BlockCandidate =>
    candidate({
      blockId, lastCommitAt,
      concepts: layers.map((layer, i) => blockConcept({ conceptId: `ts/c${i}`, layer })),
    });

  test('겹 평균 높은 순이 먼저다', () => {
    const out = rankBlocks([at(1, [1, 1], null), at(2, [4, 4], null), at(3, [2, 2], null)], { stage: 2 });
    expect(out.blocks.map((b) => b.blockId)).toStrictEqual([2, 3, 1]);
  });

  test('겹 평균이 같으면 최근 커밋에 닿은 것, 커밋을 모르면 뒤', () => {
    const out = rankBlocks([at(1, [3], null), at(2, [3], 1_000), at(3, [3], 5_000)], { stage: 2 });
    expect(out.blocks.map((b) => b.blockId)).toStrictEqual([3, 2, 1]);
  });

  test('전부 같으면 blockId 순 — 같은 입력에 같은 순서', () => {
    const out = rankBlocks([at(3, [2], 9), at(1, [2], 9), at(2, [2], 9)], { stage: 2 });
    expect(out.blocks.map((b) => b.blockId)).toStrictEqual([1, 2, 3]);
  });
});

// ───────── 대표 개념 (D27) ─────────

describe('pickConcept — D27', () => {
  const opts = { essential: ESSENTIAL, concepts: dict.concepts };
  const difficultyOf = (id: string): number => dict.concepts.get(id)?.difficulty ?? 0;

  test('필수 문법 중 difficulty 가 가장 높은 것이 대표, 나머지는 부수', () => {
    // 번들 사전의 실제 난이도로 고른다 — 숫자를 여기 박으면 사전이 바뀔 때 조용히 어긋난다.
    const ids = ['ts/const-declaration', 'ts/optional-chaining', 'ts/string-literal'];
    const hardest = [...ids].sort((a, b) => difficultyOf(b) - difficultyOf(a))[0];
    const picked = pickConcept(
      candidate({ concepts: ids.map((conceptId) => blockConcept({ conceptId })) }),
      opts,
    );
    expect('reason' in picked).toBe(false);
    if ('reason' in picked) return;
    expect(picked.primary.conceptId).toBe(hardest);
    expect(picked.secondary.map((k) => k.conceptId))
      .toStrictEqual(ids.filter((id) => id !== hardest).sort());
  });

  test('동률은 Site 수 많은 것', () => {
    const id = 'ts/const-declaration';
    const other = [...ESSENTIAL].find((k) => k !== id && difficultyOf(k) === difficultyOf(id));
    expect(other).toBeDefined();
    const picked = pickConcept(candidate({
      concepts: [
        blockConcept({ conceptId: id, siteCount: 1 }),
        blockConcept({ conceptId: other as string, siteCount: 9 }),
      ],
    }), opts);
    if ('reason' in picked) throw new Error(picked.reason);
    expect(picked.primary.conceptId).toBe(other);
  });

  test('필수 문법이 아닌 개념만 있으면 대표가 없다', () => {
    const picked = pickConcept(
      candidate({ concepts: [blockConcept({ conceptId: 'ts/array-foreach' })] }),
      opts,
    );
    expect(picked).toStrictEqual({ reason: '블록 안에 사전에 있는 필수 문법 개념이 없다' });
  });

  test('사전에 없는 필수 문법은 대표가 못 되고 부수로만 남는다', () => {
    const picked = pickConcept(candidate({
      concepts: [
        blockConcept({ conceptId: 'ts/const-declaration' }),
        blockConcept({ conceptId: 'ts/not-in-dict' }),
      ],
    }), { essential: new Set([...ESSENTIAL, 'ts/not-in-dict']), concepts: dict.concepts });
    if ('reason' in picked) throw new Error(picked.reason);
    expect(picked.primary.conceptId).toBe('ts/const-declaration');
    expect(picked.secondary.map((k) => k.conceptId)).toStrictEqual(['ts/not-in-dict']);
  });
});
