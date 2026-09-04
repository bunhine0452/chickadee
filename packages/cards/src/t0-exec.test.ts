/**
 * 출제층 (D151). 이 파일은 **문법 이름을 모른다** — `exec-facts` 가 낸 사실만 받는다.
 * 그래서 사실을 손으로 만들어도 안전하다: 노드 이름이 틀릴 위험은 전부 아래층에 있고
 * 그쪽은 `exec-facts.test.ts` 가 진짜 파스 트리로 잰다.
 *
 * 다만 **게이트가 실제 코드에서 실제로 닫히는지**는 진짜 트리로 한 번 확인한다.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

import type { AstLite } from '@chickadee/store-sql';
import { blockOf, dialectOf, execFacts, lineIndex } from './exec-facts.js';
import { EXEC_SITE_ID, buildFirstRun, makeExecCard, renderFirstRun } from './t0-exec.js';
import type { ExecFacts } from './exec-facts.js';
import type { FocusLine } from './types.js';

const node = (start: number, kind = 'expression_statement'): AstLite =>
  ({ kind, named: true, start, end: start + 1, children: [] });

/** 줄 하나가 10바이트인 가짜 소스 — 오프셋 10n 이 n+1 줄이다. */
const at = (offset: number): number => Math.floor(offset / 10) + 1;
const WINDOW = { from: 1, to: 20 };

const facts = (over: Partial<ExecFacts> = {}): ExecFacts => ({
  unconditional: [], unreachable: [], conditional: [], first: null, ...over,
});

describe('가장 먼저 도는 줄', () => {
  test('오답 셋을 채우면 낸다 — 줄 오름차순이고 정답 자리가 맞는다', () => {
    const first = node(10);          // 2행
    const q = buildFirstRun({
      facts: facts({
        first,
        unconditional: [first, node(20)],   // 2·3행
        conditional: [node(30)],            // 4행
      }),
      fn: node(0, 'function_declaration'),  // 1행 — 정의 줄
      at,
      window: WINDOW,
    });
    expect(q).not.toBeNull();
    expect(q?.focus).toBe(2);
    expect(q?.picks.map((p) => p.line)).toEqual([1, 2, 3, 4]);
    expect(q?.picks.map((p) => p.because)).toEqual(['definition', null, 'runs', 'conditional']);
    expect(q?.answer).toBe(1);
    expect(q?.picks[q.answer]?.because).toBeNull();
  });

  test('정답 줄은 오답으로 다시 나오지 않는다 — 같은 줄을 짚고 틀렸다 할 수 없다', () => {
    const first = node(10);
    const q = buildFirstRun({
      facts: facts({ first, unconditional: [first, node(11)], conditional: [node(20), node(30)] }),
      fn: node(0, 'function_declaration'),
      at,
      window: WINDOW,
    });
    // node(11) 도 2행이라 정답과 겹친다 — 후보에서 빠져야 한다.
    expect(q?.picks.filter((p) => p.line === 2)).toHaveLength(1);
    expect(q?.picks.find((p) => p.line === 2)?.because).toBeNull();
  });

  test('오답이 셋에 못 미치면 안 낸다', () => {
    const first = node(10);
    expect(buildFirstRun({
      facts: facts({ first, unconditional: [first] }),
      fn: node(0, 'function_declaration'),
      at,
      window: WINDOW,
    })).toBeNull();
  });

  test('실행 단위가 하나도 없으면 안 낸다', () => {
    expect(buildFirstRun({
      facts: facts(), fn: node(0, 'function_declaration'), at, window: WINDOW,
    })).toBeNull();
  });
});

describe('진짜 코드에서 게이트가 닫힌다', () => {
  function repoRoot(): string {
    let dir = dirname(fileURLToPath(import.meta.url));
    for (let i = 0; i < 8; i += 1) {
      try { readFileSync(join(dir, 'pnpm-workspace.yaml')); return dir; } catch { dir = dirname(dir); }
    }
    throw new Error('리포 뿌리를 못 찾았다');
  }
  const load = (id: string): { grammar: string; original: AstLite } =>
    JSON.parse(readFileSync(join(repoRoot(), 'fixtures/golden/t1/ast', `${id}.json`), 'utf8'));
  function find(n: AstLite, kind: string): AstLite | null {
    if (n.kind === kind) return n;
    for (const c of n.children) { const h = find(c, kind); if (h) return h; }
    return null;
  }

  // 줄 둘짜리 함수는 오답이 둘(정의 줄 · 남은 statement)뿐이라 안 나온다. 작은 함수에서
  // 조용히 약한 문제를 내느니 안 내는 편이 맞다.
  test('직계 statement 둘짜리 함수에서는 안 낸다', () => {
    const { grammar, original } = load('16-ast-paren');
    const d = dialectOf(grammar);
    const fn = find(original, 'function_declaration');
    const block = d && fn ? blockOf(fn, d) : null;
    expect(d && fn && block).toBeTruthy();
    if (!d || !fn || !block) return;

    const f = execFacts(block, d);
    expect(f.unconditional.length + f.conditional.length).toBe(2);
    expect(buildFirstRun({
      facts: f, fn, at: lineIndex(''), window: { from: 1, to: 3 },
    })).toBeNull();
  });
});

describe('사람 말로', () => {
  test('진단이 picks 와 같은 자리에 오고 정답 자리는 비어 있다', () => {
    const first = node(10);
    const q = buildFirstRun({
      facts: facts({ first, unconditional: [first, node(20)], conditional: [node(30)] }),
      fn: node(0, 'function_declaration'),
      at,
      window: WINDOW,
    });
    if (!q) throw new Error('문항이 안 나왔다');
    const r = renderFirstRun(q);
    expect(r.why).toHaveLength(q.picks.length);
    expect(r.why[q.answer]).toBeNull();
    expect(r.why.filter((w) => w !== null)).toHaveLength(3);
    // 정의 줄 진단은 「부를 때 돈다」를 말해야 한다 — 이 오해가 이 문항의 존재 이유다.
    expect(r.why[0]).toContain('정의');
    expect(r.q.length).toBeGreaterThan(0);
  });
});

describe('카드 한 장 (끝에서 끝까지)', () => {
  /** 소스 한 덩이에서 줄과 오프셋을 같이 만든다 — 손으로 센 숫자를 안 쓰기 위해서다. */
  function source(text: string, from: number): { lines: FocusLine[]; offsetOf: (needle: string) => number } {
    const lines = text.split('\n').map((t, i) => ({ n: from + i, t }));
    const enc = new TextEncoder();
    return { lines, offsetOf: (needle) => enc.encode(text.slice(0, text.indexOf(needle))).length };
  }

  test('exec/order 카드가 나오고 페이로드가 스키마를 통과한다', async () => {
    const { loadDict } = await import('@chickadee/dictionary');
    const { cardPayloadSchema } = await import('@chickadee/store-sql');
    const dict = loadDict();
    const concept = dict.concepts.get('exec/order');
    expect(concept).toBeDefined();
    if (!concept) return;

    const text = [
      'function total(items) {',
      '  const n = items.length;',
      '  const sum = add(items);',
      '  if (n === 0) { return 0; }',
      '  return sum;',
      '}',
    ].join('\n');
    const { lines, offsetOf } = source(text, 10);   // 파일 10행부터
    const stmt = (needle: string, kind = 'lexical_declaration'): AstLite =>
      ({ kind, named: true, start: offsetOf(needle), end: offsetOf(needle) + 1, children: [] });

    const body: AstLite = {
      kind: 'statement_block', named: true, start: offsetOf('{'), end: text.length,
      children: [
        { kind: '{', named: false, start: offsetOf('{'), end: offsetOf('{') + 1, children: [] },
        stmt('const n'),
        stmt('const sum'),
        stmt('if (n', 'if_statement'),
        stmt('return sum', 'return_statement'),
      ],
    };
    const fn: AstLite = {
      kind: 'function_declaration', named: true, start: 0, end: text.length, children: [body],
    };

    const out = makeExecCard({
      repoId: 1, dictVersion: 'x', attempt: 0, concept, concepts: dict.concepts, ly: 0,
      lines, ast: fn, grammar: 'typescript', path: 'src/cart.ts',
      window: { from: 10, to: 15 }, blockHash: 'deadbeef',
    });
    if ('reason' in out) throw new Error(`판이 안 나왔다: ${out.reason}`);

    const card = out.card;
    expect(card.kind).toBe('point');
    expect(card.siteId).toBe(EXEC_SITE_ID);
    // 재생성 계약 — 시드가 블록 해시에 걸린다 (D70). 줄이 밀려도 같은 카드다.
    expect(card.gen.siteId).toBe(EXEC_SITE_ID);
    expect(card.contentHash.length).toBeGreaterThan(0);

    const p = card.payload;
    expect(p.track).toBe('t0');
    // 정답은 첫 실행 줄(11행 `const n`)이고, 진단은 정답 자리만 비어 있다.
    expect(p.focus).toBe(11);
    expect(p.why[p.answer]).toBeNull();
    expect(p.why.filter((w) => w !== null)).toHaveLength(3);
    // 정의 줄(10행)이 오답으로 들어가 있어야 한다 — 이 문항의 존재 이유다.
    const picked = p.lines.filter((l) => 'seg' in l).map((l) => l.n);
    expect(picked).toContain(10);
    expect(picked).toContain(11);

    // 진짜로 저장 가능한가.
    expect(() => cardPayloadSchema.parse(p)).not.toThrow();
  });
});
