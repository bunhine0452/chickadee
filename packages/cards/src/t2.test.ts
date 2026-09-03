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
