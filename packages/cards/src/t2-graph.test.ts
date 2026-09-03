/**
 * T2 지도 정리·배치 (04 §7.2~§7.4).
 *
 * 밴드 패턴 표는 목업(`design/src/ink/data.js`)의 12개 파일로 한꺼번에 건다 — 손으로 쓴
 * 그 표가 규칙의 정답지다. 나머지는 걸음별로 하나씩.
 */
import type { EdgeKind } from '@chickadee/store-sql';
import { describe, expect, test } from 'vitest';

import { buildGraph, condense, isEntry } from './t2-graph.js';
import { MAX_NODES } from './t2-types.js';
import type { Band, Graph, GraphEdge, GraphFile } from './t2-types.js';

let nextId = 1;
const file = (path: string, inUnit = true): GraphFile => ({ fileId: nextId++, path, inUnit });
const edge = (from: string, to: string, kind: EdgeKind = 'static'): GraphEdge =>
  ({ from, to, kind, confidence: 'syntactic' });

const bandOf = (g: Graph, path: string): Band | undefined => g.files.find((f) => f.p === path)?.r;
const paths = (g: Graph): string[] => g.files.map((f) => f.p);

/** 밴드 안 색인. 배치 결과를 읽는 유일한 창구다 — 좌표는 여기서 내지 않는다. */
function slots(g: Graph): Map<string, number> {
  const seen = new Map<Band, number>();
  const pos = new Map<string, number>();
  for (const f of g.files) {
    const n = seen.get(f.r) ?? 0;
    pos.set(f.p, n);
    seen.set(f.r, n + 1);
  }
  return pos;
}

/** 같은 밴드쌍을 잇는 두 엣지가 서로 넘어가는 횟수. barycenter 가 줄이려는 그 수다. */
function crossings(g: Graph): number {
  const pos = slots(g);
  const band = new Map(g.files.map((f) => [f.p, f.r]));
  let n = 0;
  for (let i = 0; i < g.edges.length; i += 1) {
    for (let j = i + 1; j < g.edges.length; j += 1) {
      const [a, b] = g.edges[i] ?? ['', ''];
      const [c, d] = g.edges[j] ?? ['', ''];
      if (band.get(a) !== band.get(c) || band.get(b) !== band.get(d)) continue;
      const da = (pos.get(a) ?? 0) - (pos.get(c) ?? 0);
      const db = (pos.get(b) ?? 0) - (pos.get(d) ?? 0);
      if (da * db < 0) n += 1;
    }
  }
  return n;
}

// ───────── 목업 12파일 = 밴드 패턴 표 (04 §7.2 ①) ─────────

const MOCK_FILES = [
  'app/cart/page.tsx',
  'features/cart/CartSheet.tsx',
  'features/cart/CartItemRow.tsx',
  'features/cart/QuantityStepper.tsx',
  'features/cart/useCart.ts',
  'features/cart/useCartQuantity.ts',
  'features/cart/cartApi.ts',
  'app/api/cart/route.ts',
  'components/ui/Button.tsx',
  'lib/format.ts',
  'server/cartRepo.ts',
  'server/schema.ts',
];

const MOCK_EDGES: [string, string][] = [
  ['app/cart/page.tsx', 'features/cart/CartSheet.tsx'],
  ['features/cart/CartSheet.tsx', 'features/cart/CartItemRow.tsx'],
  ['features/cart/CartSheet.tsx', 'features/cart/useCart.ts'],
  ['features/cart/CartItemRow.tsx', 'features/cart/QuantityStepper.tsx'],
  ['features/cart/CartItemRow.tsx', 'lib/format.ts'],
  ['features/cart/QuantityStepper.tsx', 'features/cart/useCartQuantity.ts'],
  ['features/cart/QuantityStepper.tsx', 'components/ui/Button.tsx'],
  ['features/cart/useCartQuantity.ts', 'features/cart/cartApi.ts'],
  ['features/cart/useCart.ts', 'features/cart/cartApi.ts'],
  ['features/cart/cartApi.ts', 'app/api/cart/route.ts'],
  ['app/api/cart/route.ts', 'server/cartRepo.ts'],
  ['server/cartRepo.ts', 'server/schema.ts'],
];

const mock = (over: Partial<Parameters<typeof buildGraph>[0]> = {}): Graph =>
  buildGraph({
    files: MOCK_FILES.map((p) => file(p, p.startsWith('features/cart/'))),
    edges: MOCK_EDGES.map(([f, t]) => edge(f, t)),
    unitRoot: 'features/cart',
    ...over,
  });

describe('밴드 패턴 (04 §7.2 ①)', () => {
  const g = mock();

  test.each([
    ['app/cart/page.tsx', 0],
    ['features/cart/CartSheet.tsx', 1],
    ['features/cart/CartItemRow.tsx', 1],
    ['features/cart/QuantityStepper.tsx', 1],
    ['features/cart/useCart.ts', 2],
    ['features/cart/useCartQuantity.ts', 2],
    ['features/cart/cartApi.ts', 2],
    ['app/api/cart/route.ts', 2],
    ['components/ui/Button.tsx', 3],
    ['lib/format.ts', 3],
    ['server/cartRepo.ts', 3],
    ['server/schema.ts', 3],
  ])('%s → 밴드 %i', (path, band) => {
    expect(bandOf(g, path)).toBe(band);
  });

  test('좁은 패턴이 넓은 패턴을 이긴다 — 라우트는 app/** 밑이어도 화면이 아니다', () => {
    expect(bandOf(g, 'app/api/cart/route.ts')).toBe(2);
    expect(bandOf(g, 'components/ui/Button.tsx')).toBe(3);
  });

  test('src/ 접두는 벗기고 본다', () => {
    const g2 = buildGraph({
      files: [file('src/app/page.tsx'), file('src/lib/fmt.ts')],
      edges: [edge('src/app/page.tsx', 'src/lib/fmt.ts')],
      unitRoot: 'src/app',
    });
    expect(bandOf(g2, 'src/app/page.tsx')).toBe(0);
    expect(bandOf(g2, 'src/lib/fmt.ts')).toBe(3);
  });

  test('밴드 라벨 l 은 고정 문구, s 는 그 밴드의 최장 공통 디렉터리', () => {
    expect(g.bands.map((b) => b.l)).toEqual(['화면', '기능', '동작 · 통신', '공용 · 데이터']);
    expect(g.bands[0]?.s).toBe('app/cart/');
    expect(g.bands[1]?.s).toBe('features/cart/');
    // app/api 와 features/cart 가 섞인 밴드에는 공통 디렉터리가 없다.
    expect(g.bands[2]?.s).toBe('');
  });

  test('파일이 없는 밴드도 자리를 지킨다 — files 의 r 이 이 배열의 색인이다', () => {
    const g2 = buildGraph({
      files: [file('app/page.tsx'), file('lib/a.ts')],
      edges: [edge('app/page.tsx', 'lib/a.ts')],
      unitRoot: 'app',
    });
    expect(g2.bands).toHaveLength(4);
    expect(g2.bands[1]).toEqual({ l: '기능', s: '' });
    expect(g2.bands[2]).toEqual({ l: '동작 · 통신', s: '' });
  });
});

// ───────── 깊이 폴백 (04 §7.2 ②) ─────────

describe('깊이 폴백', () => {
  test('패턴에 안 걸리면 축약 DAG 의 최장 경로, min(3, depth)', () => {
    const chain = ['pkg/a.ts', 'pkg/b.ts', 'pkg/c.ts', 'pkg/d.ts', 'pkg/e.ts'];
    const g = buildGraph({
      files: chain.map((p) => file(p)),
      edges: chain.slice(1).map((p, i) => edge(chain[i] ?? '', p)),
      unitRoot: 'pkg',
    });
    expect(chain.map((p) => bandOf(g, p))).toEqual([0, 1, 2, 3, 3]);
  });

  test('최장 경로다 — 지름길이 있어도 긴 쪽을 센다', () => {
    const g = buildGraph({
      files: ['pkg/a.ts', 'pkg/b.ts', 'pkg/c.ts'].map((p) => file(p)),
      edges: [edge('pkg/a.ts', 'pkg/b.ts'), edge('pkg/b.ts', 'pkg/c.ts'), edge('pkg/a.ts', 'pkg/c.ts')],
      unitRoot: 'pkg',
    });
    expect(bandOf(g, 'pkg/c.ts')).toBe(2);
  });

  test('band ≥ 모든 importer 의 band — 패턴 밴드는 안 움직인다', () => {
    // hooks/use.ts(밴드 2)가 pkg/dep.ts 를 가져다 쓰면 dep 는 2 아래로 못 간다.
    const g = buildGraph({
      files: [file('hooks/useThing.ts'), file('pkg/dep.ts'), file('app/page.tsx')],
      edges: [edge('app/page.tsx', 'hooks/useThing.ts'), edge('hooks/useThing.ts', 'pkg/dep.ts')],
      unitRoot: 'app',
    });
    expect(bandOf(g, 'hooks/useThing.ts')).toBe(2);
    expect(bandOf(g, 'pkg/dep.ts')).toBe(2);
  });

  test('패턴 밴드는 importer 규칙으로도 안 밀린다', () => {
    // lib/util.ts(3)가 app/page.tsx(0)를 가져다 써도 page 는 화면에 남는다.
    const g = buildGraph({
      files: [file('app/page.tsx'), file('lib/util.ts')],
      edges: [edge('lib/util.ts', 'app/page.tsx')],
      unitRoot: 'app',
    });
    expect(bandOf(g, 'app/page.tsx')).toBe(0);
  });
});

// ───────── 순환 (04 §7.2) ─────────

describe('SCC 순환', () => {
  const cyc = ['mod/a.ts', 'mod/b.ts', 'mod/c.ts'];
  const g = buildGraph({
    files: [...cyc, 'mod/index.ts', 'mod/leaf.ts'].map((p) => file(p)),
    edges: [
      edge('mod/index.ts', 'mod/a.ts'),
      edge('mod/a.ts', 'mod/b.ts'),
      edge('mod/b.ts', 'mod/c.ts'),
      edge('mod/c.ts', 'mod/a.ts'),
      edge('mod/c.ts', 'mod/leaf.ts'),
    ],
    unitRoot: 'mod',
  });

  test('크기 > 1 인 SCC 의 노드만 cycle: true', () => {
    for (const p of cyc) expect(g.files.find((f) => f.p === p)?.cycle).toBe(true);
  });

  test('순환 밖 노드에는 cycle 키 자체가 없다 (exactOptionalPropertyTypes)', () => {
    const leaf = g.files.find((f) => f.p === 'mod/leaf.ts');
    expect(leaf).toBeDefined();
    expect('cycle' in (leaf ?? {})).toBe(false);
    expect('isNew' in (leaf ?? {})).toBe(false);
    expect('folded' in (leaf ?? {})).toBe(false);
  });

  test('condense — 멤버는 사전순, id 는 대표 경로, sccs 는 위상 순서', () => {
    const c = condense(
      ['mod/a.ts', 'mod/b.ts', 'mod/c.ts', 'mod/index.ts', 'mod/leaf.ts'],
      [
        edge('mod/index.ts', 'mod/a.ts'),
        edge('mod/a.ts', 'mod/b.ts'),
        edge('mod/b.ts', 'mod/c.ts'),
        edge('mod/c.ts', 'mod/a.ts'),
        edge('mod/c.ts', 'mod/leaf.ts'),
      ],
    );
    const ring = c.sccs.find((s) => s.members.length > 1);
    expect(ring).toEqual({ id: 'mod/a.ts', members: ['mod/a.ts', 'mod/b.ts', 'mod/c.ts'] });
    expect(c.of.get('mod/c.ts')).toBe('mod/a.ts');
    expect(c.out.get('mod/a.ts')).toEqual(['mod/leaf.ts']);
    // 위상 순서: 가져다 쓰는 쪽이 먼저.
    const order = c.sccs.map((s) => s.id);
    expect(order.indexOf('mod/index.ts')).toBeLessThan(order.indexOf('mod/a.ts'));
    expect(order.indexOf('mod/a.ts')).toBeLessThan(order.indexOf('mod/leaf.ts'));
  });

  test('2,000 노드 사슬에서도 콜스택이 안 터진다', () => {
    const chain = Array.from({ length: 2000 }, (_, i) => `pkg/f${String(i).padStart(4, '0')}.ts`);
    const c = condense(chain, chain.slice(1).map((p, i) => edge(chain[i] ?? '', p)));
    expect(c.sccs).toHaveLength(2000);
  });
});

// ───────── 고립 (04 §7.2) ─────────

describe('고립 제거', () => {
  const g = buildGraph({
    files: [
      file('mod/hub.ts'),
      file('mod/used.ts'),
      file('mod/lonely.ts'),
      file('mod/index.ts'),
      file('mod/main.go'),
    ],
    edges: [edge('mod/hub.ts', 'mod/used.ts')],
    unitRoot: 'mod',
  });

  test('in=out=0 은 지도에서 빠지고 offMap 으로 센다', () => {
    expect(paths(g)).not.toContain('mod/lonely.ts');
    expect(g.offMap).toBe(1);
  });

  test('진입점(page.*·main.*·index.*)은 고립이어도 남는다', () => {
    expect(paths(g)).toEqual(expect.arrayContaining(['mod/index.ts', 'mod/main.go']));
  });

  test('정답지에 든 파일도 남긴다 — core 가 지도에 없으면 문제가 성립하지 않는다', () => {
    const g2 = buildGraph({
      files: [file('mod/hub.ts'), file('mod/used.ts'), file('mod/lonely.ts')],
      edges: [edge('mod/hub.ts', 'mod/used.ts')],
      unitRoot: 'mod',
      keep: ['mod/lonely.ts'],
    });
    expect(paths(g2)).toContain('mod/lonely.ts');
    expect(g2.offMap).toBe(0);
  });

  test('isEntry', () => {
    expect(['page.tsx', 'main.rs', 'index.ts', 'a/b/page.jsx'].map(isEntry))
      .toEqual([true, true, true, true]);
    expect(['pages.tsx', 'mainly.ts', 'indexer.ts', 'index'].map(isEntry))
      .toEqual([false, false, false, false]);
  });
});

// ───────── barycenter (04 §7.3) ─────────

describe('barycenter 스윕', () => {
  test('교차를 줄인다 — 사전순 초기 배치는 1번 꼬이고 스윕 뒤에는 0번', () => {
    const g = buildGraph({
      files: ['app/a.tsx', 'app/b.tsx', 'lib/x.ts', 'lib/y.ts'].map((p) => file(p)),
      edges: [edge('app/a.tsx', 'lib/y.ts'), edge('app/b.tsx', 'lib/x.ts')],
      unitRoot: 'app',
    });
    // 사전순 그대로였다면 lib/x.ts 가 앞이라 선 두 개가 교차한다.
    const pos = slots(g);
    expect(pos.get('lib/y.ts')).toBe(0);
    expect(pos.get('lib/x.ts')).toBe(1);
    expect(crossings(g)).toBe(0);
  });

  test('부모가 없는 노드는 제자리 — 동점은 경로 사전순', () => {
    const g = buildGraph({
      files: ['app/a.tsx', 'lib/m.ts', 'lib/n.ts', 'lib/z.ts'].map((p) => file(p)),
      edges: [edge('app/a.tsx', 'lib/m.ts'), edge('app/a.tsx', 'lib/n.ts'), edge('app/a.tsx', 'lib/z.ts')],
      unitRoot: 'app',
    });
    expect(g.files.filter((f) => f.r === 3).map((f) => f.p))
      .toEqual(['lib/m.ts', 'lib/n.ts', 'lib/z.ts']);
  });

  test('files 배열은 밴드 오름차순으로 이어 붙는다', () => {
    const rs = mock().files.map((f) => f.r);
    expect(rs).toEqual([...rs].sort((a, b) => a - b));
  });
});

// ───────── 24 노드 축약 (04 §7.4) ─────────

describe('24 노드 축약', () => {
  const unit = Array.from({ length: 10 }, (_, i) => `features/cart/a${i}.tsx`);
  const vendor = Array.from({ length: 20 }, (_, i) => `vendor/lib/v${String(i).padStart(2, '0')}.ts`);
  const folded = buildGraph({
    files: [...unit.map((p) => file(p, true)), ...vendor.map((p) => file(p, false))],
    edges: unit.flatMap((p, i) => [edge(p, vendor[i] ?? ''), edge(p, vendor[i + 10] ?? '')]),
    unitRoot: 'features/cart',
    keep: ['vendor/lib/v03.ts'],
  });

  test('대지 밖 노드를 디렉터리로 접어 24 아래로 내린다', () => {
    expect(folded.files.length).toBeLessThanOrEqual(MAX_NODES);
    const node = folded.files.find((f) => f.p === 'vendor/lib/');
    expect(node?.folded).toBe(19);
    expect(folded.foldedOf['vendor/lib/']).toHaveLength(19);
  });

  test('keep 에 든 파일은 절대 접지 않는다', () => {
    expect(folded.foldedOf['vendor/lib/']).not.toContain('vendor/lib/v03.ts');
    expect(paths(folded)).toContain('vendor/lib/v03.ts');
  });

  test('접힌 파일에 닿던 엣지는 폴더로 옮겨 붙고 중복이 사라진다', () => {
    const keys = folded.edges.map(([f, t, k]) => `${f} ${t} ${k}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain('features/cart/a0.tsx vendor/lib/ static');
    expect(keys).toContain('features/cart/a3.tsx vendor/lib/v03.ts static');
    // 폴더 자신으로 가는 엣지는 없다.
    expect(folded.edges.some(([f, t]) => f === t)).toBe(false);
  });

  test('접을 게 없으면 밴드 3 잎을 지도 밖으로 — keep 은 남는다', () => {
    const leaves = Array.from({ length: 29 }, (_, i) => `lib/l${String(i).padStart(2, '0')}.ts`);
    const g = buildGraph({
      files: [file('features/cart/index.ts'), ...leaves.map((p) => file(p, true))],
      edges: leaves.map((p) => edge('features/cart/index.ts', p)),
      unitRoot: 'features/cart',
      keep: ['lib/l00.ts', 'lib/l01.ts'],
    });
    expect(g.files).toHaveLength(MAX_NODES);
    expect(g.offMap).toBe(30 - MAX_NODES);
    expect(paths(g)).toEqual(expect.arrayContaining(['lib/l00.ts', 'lib/l01.ts']));
    // 대지 진입점은 잎이 아니지만, 지도 밖으로 빼지도 않는다.
    expect(paths(g)).toContain('features/cart/index.ts');
  });

  test('24 이하면 아무것도 접지 않는다', () => {
    expect(mock().foldedOf).toEqual({});
    expect(mock().files).toHaveLength(12);
  });
});

// ───────── 배지 ─────────

test('isNew 는 참일 때만 키가 생긴다', () => {
  const g = mock({ newFiles: ['features/cart/QuantityStepper.tsx'] });
  expect(g.files.find((f) => f.p === 'features/cart/QuantityStepper.tsx')?.isNew).toBe(true);
  expect('isNew' in (g.files.find((f) => f.p === 'features/cart/CartSheet.tsx') ?? {})).toBe(false);
});

// ───────── 결정성 (04 §9) ─────────

describe('결정성', () => {
  test('두 번 부르면 deep-equal', () => {
    expect(mock({ newFiles: ['features/cart/QuantityStepper.tsx'] }))
      .toEqual(mock({ newFiles: ['features/cart/QuantityStepper.tsx'] }));
  });

  test('입력 순서를 섞어도 같은 결과 — 난수가 없다', () => {
    const files = MOCK_FILES.map((p) => file(p, p.startsWith('features/cart/')));
    const edges = MOCK_EDGES.map(([f, t]) => edge(f, t));
    const straight = buildGraph({ files, edges, unitRoot: 'features/cart' });
    const shuffled = buildGraph({
      files: [...files].reverse(),
      // 뒤집기만으로는 「사전순 정렬을 안 했다」를 못 잡는다 — 자리를 뒤섞는다.
      edges: [...edges].sort((a, b) => (a.to < b.to ? 1 : -1)),
      unitRoot: 'features/cart',
    });
    expect(shuffled).toEqual(straight);
    expect(JSON.stringify(shuffled)).toBe(JSON.stringify(straight));
  });

  test('중복 파일·중복 엣지·자기 참조를 넣어도 같은 결과', () => {
    const files = MOCK_FILES.map((p) => file(p, p.startsWith('features/cart/')));
    const edges = MOCK_EDGES.map(([f, t]) => edge(f, t));
    const noisy = buildGraph({
      files: [...files, ...files],
      edges: [...edges, ...edges, edge('lib/format.ts', 'lib/format.ts')],
      unitRoot: 'features/cart',
    });
    expect(noisy).toEqual(buildGraph({ files, edges, unitRoot: 'features/cart' }));
  });

  test('24 노드 축약도 입력 순서를 안 탄다', () => {
    const unit = Array.from({ length: 10 }, (_, i) => `features/cart/a${i}.tsx`);
    const vendor = Array.from({ length: 20 }, (_, i) => `vendor/lib/v${String(i).padStart(2, '0')}.ts`);
    const files = [...unit.map((p) => file(p, true)), ...vendor.map((p) => file(p, false))];
    const edges = unit.flatMap((p, i) => [edge(p, vendor[i] ?? ''), edge(p, vendor[i + 10] ?? '')]);
    const a = buildGraph({ files, edges, unitRoot: 'features/cart', keep: ['vendor/lib/v03.ts'] });
    const b = buildGraph({
      files: [...files].reverse(),
      edges: [...edges].reverse(),
      unitRoot: 'features/cart',
      keep: ['vendor/lib/v03.ts'],
    });
    expect(b).toEqual(a);
  });
});

describe('24 노드 상한은 상한이다 (04 §7.4 · 00 §5 게이트)', () => {
  /** 전부 대지 안이라 접을 것이 없고, 잎이 밴드 3 도 아니라 ①②가 물지 않는 입력. */
  function crowded(n: number): { files: GraphFile[]; edges: GraphEdge[] } {
    const files: GraphFile[] = Array.from({ length: n }, (_, i) => ({
      fileId: i + 1,
      path: `features/cart/part${String(i).padStart(3, '0')}.tsx`,
      inUnit: true,
    }));
    // 사슬 하나로 이어 고립을 없앤다 — 고립 제거가 대신 일하지 않게.
    const edges: GraphEdge[] = files.slice(0, -1).map((f, i) => ({
      from: f.path,
      to: files[i + 1]!.path,
      kind: 'static' as const,
      confidence: 'syntactic' as const,
    }));
    return { files, edges };
  }

  test('①②가 물지 않는 60 노드에서도 24를 넘지 않는다', () => {
    const { files, edges } = crowded(60);
    const graph = buildGraph({ files, edges, unitRoot: 'features/cart' });
    expect(graph.files.length).toBeLessThanOrEqual(MAX_NODES);
    // 뺀 것은 「지도 밖 N」으로 셈이 맞아야 한다.
    expect(graph.files.length + graph.offMap).toBe(60);
  });

  test('정답지에 든 파일은 상한을 채우면서도 남는다', () => {
    const { files, edges } = crowded(60);
    const keep = files.slice(40, 50).map((f) => f.path);
    const graph = buildGraph({ files, edges, unitRoot: 'features/cart', keep });
    expect(graph.files.length).toBeLessThanOrEqual(MAX_NODES);
    const nodes = new Set(graph.files.map((f) => f.p));
    for (const path of keep) expect(nodes.has(path)).toBe(true);
  });

  test('잘라 내도 결정성은 남는다 — 입력 순서를 뒤집어도 같은 지도다', () => {
    const { files, edges } = crowded(60);
    const a = buildGraph({ files, edges, unitRoot: 'features/cart' });
    const b = buildGraph({
      files: [...files].reverse(), edges: [...edges].reverse(), unitRoot: 'features/cart',
    });
    expect(b).toEqual(a);
  });
});
