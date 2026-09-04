/**
 * T2 생성기 한 바퀴 (04 §7~§8). 목업 `data.js` 의 `cart/` 지도를 그대로 세우고 네 종이
 * 실제로 구워지는지 본다 — 00 §5 의 「끝났다는 증거」 첫 문장이 이것이다.
 *
 * 두 리포를 흉내 낸다: 커밋이 넉넉한 쪽(책임 배치가 나온다)과 두 건뿐인 쪽(§8.4 폴백 —
 * 책임 배치 없이 그래프 3종만 나온다).
 */
import { describe, expect, test } from 'vitest';

import { generateT2 } from './t2.js';
import { isT2Card, type CommitFileRow, type CommitRow, type GraphEdge, type GraphFile, type T2Request } from './t2-types.js';
import type { ConceptId } from '@chickadee/store-sql';

const UNIT = 'features/cart';

/** 목업 `T2.files` 그대로. 마지막 넷은 대지 밖(1-hop 이웃)이다. */
const PATHS: [string, boolean][] = [
  ['app/cart/page.tsx', false],
  ['features/cart/CartSheet.tsx', true],
  ['features/cart/CartItemRow.tsx', true],
  ['features/cart/QuantityStepper.tsx', true],
  ['features/cart/useCart.ts', true],
  ['features/cart/useCartQuantity.ts', true],
  ['features/cart/cartApi.ts', true],
  ['app/api/cart/route.ts', false],
  ['components/ui/Button.tsx', false],
  ['lib/format.ts', false],
  ['server/cartRepo.ts', false],
  ['server/schema.ts', false],
];

/** 목업 `T2.edges` 그대로. */
const LINKS: [string, string][] = [
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

const files: GraphFile[] = PATHS.map(([path, inUnit], i) => ({ fileId: i + 1, path, inUnit }));
const edges: GraphEdge[] = LINKS.map(([from, to]) => ({
  from, to, kind: 'static', confidence: 'syntactic',
}));

const commit = (id: number, message: string, at: number): CommitRow => ({
  id, sha: `sha${id}`.padEnd(7, '0'), authoredAt: at, message,
  filesN: 6, insertions: 181, deletions: 23, truncated: false,
});

/** 목업 커밋 `a3f19c2` 의 변경 파일 — 통계까지 그대로. */
const CART_CHANGE: CommitFileRow[] = [
  { path: 'features/cart/QuantityStepper.tsx', oldPath: null, status: 'A', additions: 64, deletions: 0, fileId: 4 },
  { path: 'features/cart/useCartQuantity.ts', oldPath: null, status: 'A', additions: 41, deletions: 0, fileId: 6 },
  { path: 'features/cart/CartItemRow.tsx', oldPath: null, status: 'M', additions: 9, deletions: 4, fileId: 3 },
  { path: 'features/cart/cartApi.ts', oldPath: null, status: 'M', additions: 18, deletions: 1, fileId: 7 },
  { path: 'app/api/cart/route.ts', oldPath: null, status: 'M', additions: 27, deletions: 2, fileId: 8 },
  { path: 'server/cartRepo.ts', oldPath: null, status: 'M', additions: 14, deletions: 0, fileId: 11 },
  { path: 'server/schema.ts', oldPath: null, status: 'M', additions: 4, deletions: 1, fileId: 12 },
];

/** 후보 필터를 통과하는 다른 커밋 — 3건 문턱을 넘기려고 둔다. */
const OTHER_CHANGE: CommitFileRow[] = [
  { path: 'features/cart/CartSheet.tsx', oldPath: null, status: 'M', additions: 12, deletions: 3, fileId: 2 },
  { path: 'features/cart/useCart.ts', oldPath: null, status: 'M', additions: 8, deletions: 2, fileId: 5 },
  { path: 'features/cart/cartApi.ts', oldPath: null, status: 'M', additions: 6, deletions: 1, fileId: 7 },
];

function request(overrides: Partial<T2Request> = {}): T2Request {
  const commits = [
    commit(1, 'feat(cart): 장바구니 수량 +/- 조절 기능 추가', 3_000),
    commit(2, 'fix(cart): 시트가 빈 목록에서 깨지는 것', 2_000),
    commit(3, 'feat(cart): 수량 상한 처리', 1_000),
  ];
  const filesOf = new Map<number, CommitFileRow[]>([
    [1, CART_CHANGE], [2, OTHER_CHANGE], [3, OTHER_CHANGE],
  ]);
  return {
    repoId: 1, unitId: 7, unitName: 'cart', unitRoot: UNIT,
    conceptId: 'arch/placement' as ConceptId,
    seed: 42,
    files, edges, commits, filesOf,
    recent: new Map<number, string[]>(),
    ...overrides,
  };
}

describe('generateT2 — 문제 4종', () => {
  test('책임 배치는 실제 커밋을 정답지로 쓴다', () => {
    const made = generateT2(request(), 'placement');
    if (!isT2Card(made)) throw new Error(made.reason);
    expect(made.kind).toBe('placement');
    // 정답지가 커밋에서 나왔으므로 `card.commit_id` 가 채워진다.
    expect(made.commitId).toBe(1);
    expect(made.payload.commit?.h).toBe('sha1000');
    // 04 §8.1 core — 새 파일 둘과 5줄 이상 바뀐 것들.
    expect(Object.keys(made.payload.core)).toContain('features/cart/QuantityStepper.tsx');
    expect(Object.keys(made.payload.core)).toContain('server/cartRepo.ts');
    expect(made.payload.hints).toHaveLength(3);
    expect(made.payload.q).toContain('어느 파일들을 고쳐야 할까요?');
    // 접두는 떨어져 있어야 한다 — 질문에 `feat(cart):` 가 남으면 안 된다.
    expect(made.payload.q).not.toContain('feat(cart)');
  });

  test('정답지에 든 파일은 지도에 남는다 — 고를 수 없는 정답을 만들지 않는다', () => {
    const made = generateT2(request(), 'placement');
    if (!isT2Card(made)) throw new Error(made.reason);
    const nodes = new Set(made.payload.files.map((f) => f.p));
    for (const path of Object.keys(made.payload.core)) expect(nodes.has(path)).toBe(true);
    for (const path of Object.keys(made.payload.sec)) expect(nodes.has(path)).toBe(true);
  });

  test('영향 반경은 커밋 없이 나온다 — 화살표 방향이 정답지다', () => {
    const made = generateT2(request(), 'radius');
    if (!isT2Card(made)) throw new Error(made.reason);
    expect(made.kind).toBe('radius');
    expect(made.payload.commit).toBeUndefined();
    expect(made.commitId).toBeNull();
    expect(Object.keys(made.payload.core).length).toBeGreaterThan(0);
    // 함정은 대상이 **쓰는** 쪽이라 core·sec 와 겹치지 않는다.
    for (const path of Object.keys(made.payload.trap)) {
      expect(made.payload.core[path]).toBeUndefined();
      expect(made.payload.sec[path]).toBeUndefined();
    }
  });

  test('흐름 추적은 3~6 노드 경로와 함정이 섞인 덱을 낸다', () => {
    const made = generateT2(request(), 'flow');
    if (!isT2Card(made)) throw new Error(made.reason);
    expect(made.kind).toBe('flow');
    const flow = made.payload.flow;
    expect(flow).toBeDefined();
    expect(flow!.answer.length).toBeGreaterThanOrEqual(3);
    expect(flow!.answer.length).toBeLessThanOrEqual(6);
    // 덱은 정답을 전부 담고 그보다 크거나 같다.
    for (const path of flow!.answer) expect(flow!.deck).toContain(path);
    // 경로의 인접 쌍은 전부 실제 엣지여야 한다 — 아니면 정답이 틀린 것이다.
    for (let i = 0; i + 1 < flow!.answer.length; i += 1) {
      const from = flow!.answer[i] as string;
      const to = flow!.answer[i + 1] as string;
      expect(LINKS.some(([a, b]) => a === from && b === to)).toBe(true);
    }
  });

  test('의존성 방향은 5문항이고 답이 지도와 맞는다', () => {
    const made = generateT2(request(), 'direction');
    if (!isT2Card(made)) throw new Error(made.reason);
    expect(made.kind).toBe('direction');
    expect(made.payload.pairs).toHaveLength(5);
    for (const pair of made.payload.pairs ?? []) {
      const ab = LINKS.some(([a, b]) => a === pair.a && b === pair.b);
      const ba = LINKS.some(([a, b]) => a === pair.b && b === pair.a);
      const want = ab && ba ? 2 : ab ? 0 : ba ? 1 : 3;
      expect(pair.answer).toBe(want);
    }
  });
});

describe('커밋 부족 폴백 (04 §8.4)', () => {
  test('후보 커밋이 3건 미만이면 책임 배치를 만들지 않는다', () => {
    const two = request({
      commits: [
        commit(1, 'feat(cart): 장바구니 수량 +/- 조절 기능 추가', 3_000),
        commit(2, 'fix(cart): 시트가 빈 목록에서 깨지는 것', 2_000),
      ],
      filesOf: new Map<number, CommitFileRow[]>([[1, CART_CHANGE], [2, OTHER_CHANGE]]),
    });
    const made = generateT2(two, 'placement');
    expect(isT2Card(made)).toBe(false);
  });

  test('그래도 그래프 3종은 나온다 — 종을 안 고르면 첫 번째로 되는 것을 낸다', () => {
    const two = request({
      commits: [commit(1, 'feat(cart): 수량 조절', 3_000)],
      filesOf: new Map<number, CommitFileRow[]>([[1, CART_CHANGE]]),
    });
    const made = generateT2(two);
    if (!isT2Card(made)) throw new Error(made.reason);
    expect(made.kind).not.toBe('placement');
    expect(made.payload.commit).toBeUndefined();
  });
});

describe('결정성 (04 §9)', () => {
  test('같은 입력으로 두 번 구우면 deep-equal 이다 — 배치에 난수가 없다', () => {
    for (const kind of ['placement', 'radius', 'flow', 'direction'] as const) {
      const a = generateT2(request(), kind);
      const b = generateT2(request(), kind);
      expect(a).toEqual(b);
    }
  });

  test('파일·엣지 입력 순서를 뒤집어도 같은 카드가 나온다', () => {
    const straight = generateT2(request(), 'placement');
    const shuffled = generateT2(request({
      files: [...files].reverse(),
      edges: [...edges].reverse(),
    }), 'placement');
    if (!isT2Card(straight) || !isT2Card(shuffled)) throw new Error('판이 안 나왔다');
    expect(shuffled.contentHash).toBe(straight.contentHash);
  });
});

describe('리포 지도 두 종 (04 §7.5·§8.5 · D142)', () => {
  /** 목업 지도를 리포 범위로 본 것 — 대지 밖 이웃까지 전부 「이 리포의 파일」이다. */
  const repoFiles: GraphFile[] = PATHS.map(([path], i) => ({ fileId: i + 1, path, inUnit: true }));
  const req = (kind: 'entry' | 'role', targetIndex = 0): T2Request => ({
    repoId: 1, unitId: 1, unitName: 'cart', unitRoot: UNIT,
    conceptId: 'arch/placement' as ConceptId, seed: 7, targetIndex,
    files: repoFiles, edges, commits: [], filesOf: new Map(), recent: new Map(),
  });

  test('지도가 파일 12장 대신 폴더 여섯으로 접힌다', () => {
    const made = generateT2(req('entry'), 'entry');
    if (!isT2Card(made)) throw new Error(made.reason);
    expect(made.payload.files.map((f) => f.p).sort()).toEqual([
      'app/api/cart/', 'app/cart/', 'components/ui/', 'features/cart/', 'lib/', 'server/',
    ]);
    // 폴더 노드는 안에 든 파일 수를 배지로 든다.
    expect(made.payload.files.every((f) => (f.folded ?? 0) > 0)).toBe(true);
  });

  test('진입점 — 정답은 들어오는 화살표가 없는 폴더이고 개념은 `arch/entry` 다', () => {
    const made = generateT2(req('entry'), 'entry');
    if (!isT2Card(made)) throw new Error(made.reason);
    expect(made.kind).toBe('entry');
    expect(made.conceptId).toBe('arch/entry');
    expect(Object.keys(made.payload.core)).toEqual(['app/cart/']);
    // 나머지는 전부 함정이고 사유가 붙는다 — 고른 것마다 왜 아닌지 말할 수 있어야 한다.
    expect(Object.keys(made.payload.trap).sort()).toEqual([
      'app/api/cart/', 'components/ui/', 'features/cart/', 'lib/', 'server/',
    ]);
    expect(made.payload.hints).toHaveLength(3);
    expect(made.payload.commit).toBeUndefined();
  });

  test('많이 쓰이는 폴더는 정답이 아니다 — 그게 이 문제의 함정이다', () => {
    // `lib/` 를 셋이 가져다 쓰게 만든다. 들어오는 화살표가 가장 많은 노드가 된다.
    const hubbed: GraphEdge[] = [
      ...edges,
      { from: 'app/cart/page.tsx', to: 'lib/format.ts', kind: 'static', confidence: 'syntactic' },
      { from: 'server/cartRepo.ts', to: 'lib/format.ts', kind: 'static', confidence: 'syntactic' },
    ];
    const made = generateT2({ ...req('entry'), edges: hubbed }, 'entry');
    if (!isT2Card(made)) throw new Error(made.reason);
    expect(made.payload.core['lib/']).toBeUndefined();
    expect(made.payload.trap['lib/']).toContain('3');
    // 마지막 힌트가 그 창고의 이름을 댄다.
    expect(made.payload.hints[2]).toContain('lib/');
  });

  test('폴더 역할 — 정답은 밴드 색인이고 그 폴더는 지도에서 빠져 있다', () => {
    const made = generateT2(req('role'), 'role');
    if (!isT2Card(made)) throw new Error(made.reason);
    expect(made.kind).toBe('role');
    expect(made.conceptId).toBe('arch/role');
    const role = made.payload.role;
    expect(role).toBeDefined();
    // 밴드 행 라벨이 곧 보기다 — 물어볼 폴더가 지도에 있으면 정답을 읽어 주는 셈이다.
    expect(made.payload.files.some((f) => f.p === role!.folder)).toBe(false);
    expect(made.payload.bands[role!.answer]?.l.length).toBeGreaterThan(0);
    // 근거는 층 라벨이 아니라 방향 집계다.
    expect(made.payload.hints[0]).toMatch(/\d+개 폴더가 이 폴더를 가져다 쓰고/);
  });

  test('폴더 역할은 04 §7.2 ① 로 층이 정해진 폴더에만 낸다', () => {
    const made = generateT2(req('role'), 'role');
    if (!isT2Card(made)) throw new Error(made.reason);
    // `server/**` 는 04 §7.2 ① 이 「공용 · 데이터」로 못박은 이름이다.
    // (`lib/`·`components/ui/` 는 이 지도에서 파일이 한 장뿐이라 `MIN_ROLE_MEMBERS` 에 걸린다.)
    expect(made.payload.role?.folder).toBe('server/');
    expect(made.payload.role?.answer).toBe(3);
    // ② 깊이로 **추정된** 폴더는 물으면 안 된다 — 추정이 틀리면 신뢰가 한 번에 무너진다.
    expect(made.payload.role?.folder).not.toBe('features/cart/');
  });

  test('후보가 떨어지면 같은 판을 두 번 굽지 않는다', () => {
    const first = generateT2(req('role', 0), 'role');
    expect(isT2Card(first)).toBe(true);
    // 이 지도에서 04 §7.2 ① 이 이름을 아는 폴더는 몇 개뿐이다. 색인이 넘치면 판이 없다.
    expect(isT2Card(generateT2(req('role', 9), 'role'))).toBe(false);
  });

  test('같은 요청을 두 번 구우면 deep-equal 이다 (04 §9)', () => {
    for (const kind of ['entry', 'role'] as const) {
      expect(generateT2(req(kind), kind)).toEqual(generateT2(req(kind), kind));
    }
  });

  test('대지가 「기타」 하나뿐인 리포에는 내지 않는다 (#e-guard)', () => {
    // 뿌리 바로 밑 파일들 — `assignUnits` 의 네 규칙이 전부 물지 않는다.
    const flat = ['a.ts', 'b.ts', 'c.ts', 'd.ts', 'e.ts', 'f.ts', 'g.ts', 'h.ts'];
    const flatFiles: GraphFile[] = flat.map((path, i) => ({ fileId: i + 1, path, inUnit: true }));
    const flatEdges: GraphEdge[] = flat.slice(1).map((to, i) => ({
      from: flat[i] as string, to, kind: 'static' as const, confidence: 'syntactic' as const,
    }));
    for (const kind of ['entry', 'role'] as const) {
      const made = generateT2({ ...req(kind), files: flatFiles, edges: flatEdges }, kind);
      expect(isT2Card(made)).toBe(false);
    }
  });

  test('종을 안 주면 리포 지도 두 종은 나오지 않는다 — 입력이 대지 것이기 때문이다', () => {
    const made = generateT2({
      repoId: 1, unitId: 1, unitName: 'cart', unitRoot: UNIT,
      conceptId: 'arch/placement' as ConceptId, seed: 7,
      files, edges, commits: [], filesOf: new Map(), recent: new Map(),
    });
    if (!isT2Card(made)) throw new Error(made.reason);
    expect(['entry', 'role']).not.toContain(made.kind);
  });
});
