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
import { buildFirstRun } from './t0-exec.js';
import type { ExecFacts } from './exec-facts.js';

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
