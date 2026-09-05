/**
 * 실행 사실 층 (D151). **손으로 만든 트리로 재지 않는다** — 그러면 내 가정을 그대로 베낀다.
 * `crates/parse/tests/t1_ast.rs` 가 구워 둔 진짜 파스 트리(`fixtures/golden/t1/ast/`)를 읽는다.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

import type { AstLite } from '@chickadee/store-sql';
import { blockOf, dialectOf, execFacts, functionsIn, lineIndex, statementsOf } from './exec-facts.js';

function repoRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i += 1) {
    try {
      readFileSync(join(dir, 'pnpm-workspace.yaml'));
      return dir;
    } catch { dir = dirname(dir); }
  }
  throw new Error('리포 뿌리를 못 찾았다');
}

interface Pair { grammar: string; original: AstLite }
const load = (id: string): Pair =>
  JSON.parse(readFileSync(join(repoRoot(), 'fixtures/golden/t1/ast', `${id}.json`), 'utf8')) as Pair;

/** 트리 어디든 첫 번째로 나오는 그 종류의 노드. */
function find(node: AstLite, kind: string): AstLite | null {
  if (node.kind === kind) return node;
  for (const c of node.children) {
    const hit = find(c, kind);
    if (hit) return hit;
  }
  return null;
}

describe('문법표는 진짜 트리와 맞는다', () => {
  test('typescript — 함수 본문이 statement_block 이다', () => {
    const { grammar, original } = load('14-ast-block');
    expect(grammar).toBe('typescript');
    const d = dialectOf(grammar);
    const fn = find(original, 'function_declaration');
    expect(d && fn && blockOf(fn, d)?.kind).toBe('statement_block');
  });

  test('python — 함수 본문이 block 이다', () => {
    const { grammar, original } = load('25-py-whitespace');
    expect(grammar).toBe('python');
    const d = dialectOf(grammar);
    const fn = find(original, 'function_definition');
    expect(d && fn && blockOf(fn, d)?.kind).toBe('block');
  });

  // 「모르면 안 낸다」 — 표에 없는 문법은 null 이고, 부르는 쪽이 그걸 보고 판을 안 만든다.
  test('go 는 표에 없다 — 아는 척하지 않는다', () => {
    expect(dialectOf(load('27-go-line-break').grammar)).toBeNull();
  });
});

describe('실행 사실', () => {
  test('조건 안의 return 은 블록의 끊김이 아니다 — 직계만 보는 것이 이 층의 정확성이다', () => {
    const { grammar, original } = load('14-ast-block');
    const d = dialectOf(grammar);
    const fn = find(original, 'function_declaration');
    const block = d && fn ? blockOf(fn, d) : null;
    expect(d && block).toBeTruthy();
    if (!d || !block) return;

    // 트리 사실 확인 — return 은 있지만 if 안에 있다.
    expect(find(block, 'return_statement')).not.toBeNull();
    expect(statementsOf(block).map((s) => s.kind)).toEqual(['if_statement']);

    const f = execFacts(block, d);
    // 끊김이 직계가 아니므로 도달 못 하는 줄은 없다. 안쪽 return 을 끊김으로 세면 여기가 깨진다.
    expect(f.unreachable).toEqual([]);
    // 그 줄은 「반드시 돈다」가 아니라 「돌 수도 있다」 — 오답 진단이 이 칸에서 나온다.
    expect(f.unconditional).toEqual([]);
    expect(f.conditional.map((s) => s.kind)).toEqual(['if_statement']);
    expect(f.first?.kind).toBe('if_statement');
  });

  test('python — 직계 return 은 끊김이고 그 앞은 반드시 돈다', () => {
    const { grammar, original } = load('25-py-whitespace');
    const d = dialectOf(grammar);
    const fn = find(original, 'function_definition');
    const block = d && fn ? blockOf(fn, d) : null;
    expect(d && block).toBeTruthy();
    if (!d || !block) return;

    const f = execFacts(block, d);
    expect(f.unconditional.map((s) => s.kind)).toEqual(['return_statement']);
    expect(f.unreachable).toEqual([]);
    expect(f.first?.kind).toBe('return_statement');
  });

  test('이름 없는 노드는 실행 단위가 아니다 — 중괄호가 줄로 세어지면 안 된다', () => {
    const { grammar, original } = load('14-ast-block');
    const d = dialectOf(grammar);
    const fn = find(original, 'function_declaration');
    const block = d && fn ? blockOf(fn, d) : null;
    if (!block) throw new Error('본문 없음');
    expect(block.children.some((c) => !c.named)).toBe(true);   // 중괄호가 자식으로 있다
    expect(statementsOf(block).every((s) => s.named)).toBe(true);
  });
});

describe('함수 찾기', () => {
  test('정의를 전부 찾고 중첩 깊이를 센다 — 「정의는 실행이 아니다」가 가장 잘 보이는 자리다', () => {
    const { grammar, original } = load('14-ast-block');
    const d = dialectOf(grammar);
    if (!d) throw new Error('표 없음');
    const fns = functionsIn(original, d);
    expect(fns).toHaveLength(1);
    expect(fns[0]?.node.kind).toBe('function_declaration');
    expect(fns[0]?.depth).toBe(0);
  });

  // 이 시험이 실제로 버그를 잡았다 — `fn` 표의 `'function'` 이 TS 에서는 함수식의 종류이면서
  // 동시에 `function` **키워드의 익명 노드 이름**이라, 이름을 안 보면 키워드가 함수로 세어졌다.
  test('function 키워드는 함수가 아니다', () => {
    const { grammar, original } = load('14-ast-block');
    const d = dialectOf(grammar);
    if (!d) throw new Error('표 없음');
    const keyword = find(original, 'function');
    expect(keyword?.named).toBe(false);
    expect(functionsIn(original, d).some((f) => !f.node.named)).toBe(false);
  });
});

describe('오프셋 → 줄', () => {
  test('줄 시작과 줄 안쪽이 같은 줄로 간다', () => {
    const at = lineIndex('a\nbb\n\nccc');
    expect([0, 1, 2, 3, 5, 6, 7].map(at)).toEqual([1, 1, 2, 2, 3, 4, 4]);
  });

  test('빈 줄과 끝을 넘어가도 마지막 줄로 떨어진다', () => {
    const at = lineIndex('x\n');
    expect(at(0)).toBe(1);
    expect(at(2)).toBe(2);
    expect(at(99)).toBe(2);
  });

  // tree-sitter 오프셋은 **바이트**다. 문자로 세면 한국어 주석 한 줄 아래부터 전부 밀린다 —
  // 이 리포는 주석이 한국어가 정본이라(D117) 실제로 늘 일어나는 일이다.
  test('멀티바이트 위의 줄도 맞는다 — 바이트로 센다', () => {
    const src = '// 한국어 주석\nconst x = 1';
    const at = lineIndex(src);
    const second = new TextEncoder().encode('// 한국어 주석\n').length;
    expect(second).toBeGreaterThan('// 한국어 주석\n'.length); // 실제로 멀티바이트다
    expect(at(0)).toBe(1);
    expect(at(second)).toBe(2);
    expect(at(second + 5)).toBe(2);
  });
});
