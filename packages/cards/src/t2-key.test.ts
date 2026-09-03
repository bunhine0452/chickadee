/**
 * T2 정답지 (04 §8.1). 픽스처는 목업 `design/src/ink/data.js` 의 `T2` 지도 그대로다 —
 * 같은 커밋을 넣으면 목업의 core 6 · sec 1 · 힌트 3단이 그대로 나와야 한다.
 */
import { describe, expect, test } from 'vitest';

import {
  buildKey, candidates, isExcludedPath, question, subjectOf, trapReason,
} from './t2-key.js';
import type { CommitFileRow, CommitRow } from './t2-types.js';

// ───────── 픽스처 ─────────

const P = {
  page: 'app/cart/page.tsx', sheet: 'features/cart/CartSheet.tsx',
  row: 'features/cart/CartItemRow.tsx', stepper: 'features/cart/QuantityStepper.tsx',
  useCart: 'features/cart/useCart.ts', useQty: 'features/cart/useCartQuantity.ts',
  api: 'features/cart/cartApi.ts', route: 'app/api/cart/route.ts',
  button: 'components/ui/Button.tsx', format: 'lib/format.ts',
  repo: 'server/cartRepo.ts', schema: 'server/schema.ts',
} as const;

const MAP_PATHS = Object.values(P);

const EDGES = ([
  [P.page, P.sheet], [P.sheet, P.row], [P.sheet, P.useCart], [P.row, P.stepper],
  [P.row, P.format], [P.stepper, P.useQty], [P.stepper, P.button], [P.useQty, P.api],
  [P.useCart, P.api], [P.api, P.route], [P.route, P.repo], [P.repo, P.schema],
] as const).map(([from, to]) => ({ from, to }));

const UNIT_ROOT = 'features/cart';
const UNIT_PATHS = [P.sheet, P.row, P.stepper, P.useCart, P.useQty, P.api];

/** 밴드는 목업 `T2.files` 의 `r` 이다. */
const BAND: Record<string, number> = {
  [P.page]: 0, [P.sheet]: 1, [P.row]: 1, [P.stepper]: 1,
  [P.useCart]: 2, [P.useQty]: 2, [P.api]: 2, [P.route]: 2,
  [P.button]: 3, [P.format]: 3, [P.repo]: 3, [P.schema]: 3,
};
const bandOf = (path: string): number => BAND[path] ?? 3;

function file(path: string, over: Partial<CommitFileRow> = {}): CommitFileRow {
  return { path, oldPath: null, status: 'M', additions: 3, deletions: 0, fileId: 1, ...over };
}

function commit(over: Partial<CommitRow> = {}): CommitRow {
  return {
    id: 1,
    sha: 'a3f19c2b8d1',
    authoredAt: Date.UTC(2026, 6, 14, 9, 30),
    message: 'feat(cart): 장바구니 수량 +/- 조절 기능 추가',
    filesN: 7,
    insertions: 181,
    deletions: 23,
    truncated: false,
    ...over,
  };
}

/** 목업 커밋 a3f19c2 가 바꾼 7개 파일. */
const CART_FILES: CommitFileRow[] = [
  file(P.stepper, { status: 'A', additions: 64, deletions: 0 }),
  file(P.useQty, { status: 'A', additions: 41, deletions: 0 }),
  file(P.row, { additions: 9, deletions: 4 }),
  file(P.api, { additions: 18, deletions: 1 }),
  file(P.route, { additions: 27, deletions: 2 }),
  file(P.repo, { additions: 14, deletions: 0 }),
  file(P.schema, { additions: 3, deletions: 1 }),
];

const keyInput = (over: Partial<Parameters<typeof buildKey>[0]> = {}) => ({
  commit: commit(),
  files: CART_FILES,
  mapPaths: MAP_PATHS,
  edges: EDGES,
  unitRoot: UNIT_ROOT,
  unitPaths: UNIT_PATHS,
  recent: new Map<number, readonly string[]>(),
  ...over,
});

// ───────── 후보 커밋 필터 ─────────

describe('candidates', () => {
  const threeSource = [file(P.row), file(P.api), file(P.stepper)];

  const run = (rows: CommitRow[], filesOf: ReadonlyMap<number, readonly CommitFileRow[]>) =>
    candidates({ commits: rows, filesOf, unitPaths: UNIT_PATHS });

  const only = (c: CommitRow, files: CommitFileRow[] = threeSource) =>
    run([c], new Map([[c.id, files]]));

  test('접두가 없는 정상 커밋은 통과한다', () => {
    expect(only(commit())).toHaveLength(1);
  });

  test.each([
    ['chore: 의존성 올림 작업입니다'], ['style: 들여쓰기를 정리했습니다'], ['docs: 읽기 문서를 고쳤습니다'],
    ['ci: 워크플로를 고쳤습니다요'], ['build: 번들 설정을 바꿨습니다'], ['Merge branch \'main\' into feature'],
    ['Revert "feat(cart): 수량 조절 추가"'],
  ])('접두 %s 는 후보가 아니다', (message) => {
    expect(only(commit({ message }))).toHaveLength(0);
  });

  test('접두를 뗀 제목이 8자 미만이면 후보가 아니다', () => {
    expect(subjectOf('feat: 짧다')).toBe('짧다');
    expect(only(commit({ message: 'feat: 짧다' }))).toHaveLength(0);
  });

  test('소스 파일이 3개 미만이거나 12개를 넘으면 후보가 아니다', () => {
    expect(only(commit(), [file(P.row), file(P.api)])).toHaveLength(0);
    const many = Array.from({ length: 13 }, (_, i) => file(`features/cart/f${i}.ts`));
    expect(only(commit(), many)).toHaveLength(0);
  });

  test('유닛 폴더에 닿지 않으면 후보가 아니다', () => {
    const outside = [file('server/a.ts'), file('server/b.ts'), file('server/c.ts')];
    expect(only(commit(), outside)).toHaveLength(0);
  });

  test('additions+deletions 가 0 인 파일은 세지 않는다', () => {
    const files = [file(P.row), file(P.api), file(P.stepper, { additions: 0, deletions: 0 })];
    expect(only(commit(), files)).toHaveLength(0);
  });

  test('테스트·스냅샷·락파일·생성물은 세지 않는다', () => {
    const files = [
      file(P.row), file(P.api),
      file('features/cart/useCart.test.ts'),
      file('features/cart/__snapshots__/CartSheet.tsx.snap'),
      file('pnpm-lock.yaml'),
      file('features/cart/schema.generated.ts'),
    ];
    expect(only(commit(), files)).toHaveLength(0);
  });

  test('인제스트가 읽지 않은 파일(fileId null)은 세지 않는다', () => {
    const files = [file(P.row), file(P.api), file('features/cart/logo.svg', { fileId: null })];
    expect(only(commit(), files)).toHaveLength(0);
  });

  test('feat·fix 가 앞, 그 안에서 최근 순이다', () => {
    const rows = [
      commit({ id: 1, message: 'perf: 목록 렌더를 줄였습니다', authoredAt: 300 }),
      commit({ id: 2, message: 'feat: 수량 조절을 넣었습니다', authoredAt: 100 }),
      commit({ id: 3, message: 'fix: 수량이 0 이 되던 문제', authoredAt: 200 }),
    ];
    const filesOf = new Map(rows.map((c) => [c.id, threeSource]));
    expect(run(rows, filesOf).map((c) => c.id)).toStrictEqual([3, 2, 1]);
  });
});

describe('isExcludedPath', () => {
  test.each<[string, boolean]>([
    ['src/useCart.test.ts', true], ['src/__tests__/a.ts', true], ['src/__snapshots__/a.snap', true],
    ['a.snap', true], ['Cargo.lock', true], ['yarn.lock', true], ['dist/index.js', true],
    ['vendor/jquery.min.js', true], ['src/api.generated.ts', true],
    ['features/cart/useCart.ts', false], ['server/schema.ts', false],
  ])('%s → %s', (path, expected) => {
    expect(isExcludedPath(path)).toBe(expected);
  });
});

// ───────── core ─────────

describe('core', () => {
  test('목업 커밋은 core 6개 · sec 1개를 낸다', () => {
    const key = buildKey(keyInput());
    expect(Object.keys(key.core).sort()).toStrictEqual(
      [P.route, P.api, P.row, P.stepper, P.useQty, P.repo].sort(),
    );
    expect(Object.keys(key.sec)).toStrictEqual([P.schema]);
  });

  test('status A 는 한 줄만 바뀌어도 core 다', () => {
    const files = [file(P.stepper, { status: 'A', additions: 1, deletions: 0 }), ...CART_FILES.slice(2)];
    const key = buildKey(keyInput({ files }));
    expect(Object.keys(key.core)).toContain(P.stepper);
  });

  test('additions+deletions ≥ 5 면 core, 4 면 sec 다', () => {
    const files = [file(P.row, { additions: 3, deletions: 2 }), file(P.api, { additions: 2, deletions: 2 })];
    const key = buildKey(keyInput({ files }));
    expect(Object.keys(key.core)).toStrictEqual([P.row]);
    expect(Object.keys(key.sec)).toStrictEqual([P.api]);
  });

  test('유닛 진입점은 두 줄만 바뀌어도 core 다', () => {
    const entry = 'features/cart/index.ts';
    const files = [file(entry, { additions: 1, deletions: 1 }), file(P.api, { additions: 1, deletions: 1 })];
    const key = buildKey(keyInput({ files, unitPaths: [...UNIT_PATHS, entry] }));
    expect(Object.keys(key.core)).toStrictEqual([entry]);
    expect(Object.keys(key.sec)).toStrictEqual([P.api]);
  });
});

// ───────── sec 세 경로 ─────────

describe('sec', () => {
  test('① F ∖ core — 작게 바뀐 파일', () => {
    const key = buildKey(keyInput());
    expect(key.sec[P.schema]?.[0]).toBe('+3 −1');
  });

  test('② 공변경 — core 2개 이상과 함께 바뀐 비율 ≥ 0.5', () => {
    const recent = new Map<number, readonly string[]>([
      [90, [P.stepper, P.api, P.format]],
      [91, [P.row, P.route, P.format]],
      [92, ['README.md']],
    ]);
    const key = buildKey(keyInput({ recent }));
    expect(Object.keys(key.sec)).toContain(P.format);
    expect(key.sec[P.format]?.[0]).toBe('—');
  });

  test('② 비율이 0.5 미만이면 sec 가 아니다', () => {
    const recent = new Map<number, readonly string[]>([
      [90, [P.stepper, P.api, P.format]],
      [91, [P.format]],
      [92, [P.format]],
    ]);
    const key = buildKey(keyInput({ recent }));
    expect(Object.keys(key.sec)).not.toContain(P.format);
  });

  test('② 지도 밖 파일은 sec 가 되지 않는다', () => {
    const recent = new Map<number, readonly string[]>([
      [90, [P.stepper, P.api, 'tools/gen.ts']],
      [91, [P.row, P.route, 'tools/gen.ts']],
    ]);
    const key = buildKey(keyInput({ recent }));
    expect(Object.keys(key.sec)).not.toContain('tools/gen.ts');
  });

  test('③ 추가 줄이 전부 import 문이면 core 에서 sec 로 내려간다', () => {
    const added = ['import { qty } from "./useCartQuantity";', '', '// 주석', 'export { qty } from "./q";'];
    const files = [file(P.row, { additions: 9, deletions: 4, added }), ...CART_FILES.slice(3)];
    const key = buildKey(keyInput({ files }));
    expect(Object.keys(key.core)).not.toContain(P.row);
    expect(Object.keys(key.sec)).toContain(P.row);
  });

  test('③ import 아닌 줄이 하나라도 있으면 core 로 남는다', () => {
    const added = ['import { qty } from "./useCartQuantity";', 'const n = qty(1);'];
    const files = [file(P.row, { additions: 9, deletions: 4, added }), ...CART_FILES.slice(3)];
    expect(Object.keys(buildKey(keyInput({ files })).core)).toContain(P.row);
  });

  test('③ added 가 없으면 그 걸음을 건너뛴다 — core 로 남는다', () => {
    const key = buildKey(keyInput());
    expect(Object.keys(key.core)).toContain(P.row);
  });

  test('③ 지우기만 한 파일은 「전부 import」로 세지 않는다', () => {
    const files = [file(P.row, { additions: 0, deletions: 9, added: [] }), ...CART_FILES.slice(3)];
    expect(Object.keys(buildKey(keyInput({ files })).core)).toContain(P.row);
  });

  test('③ py·go·rs 의 import 문도 본다', () => {
    const cases: [string, string[]][] = [
      ['features/cart/svc.py', ['from .cart import qty', 'import os', '# 주석']],
      ['features/cart/svc.go', ['import (', '\t"fmt"', '\tio "io/ioutil"', ')']],
      ['features/cart/svc.rs', ['use crate::cart::qty;', 'pub use crate::cart::Qty;']],
    ];
    for (const [path, added] of cases) {
      const files = [file(path, { additions: 9, deletions: 0, added }), ...CART_FILES.slice(3)];
      const key = buildKey(keyInput({ files, mapPaths: [...MAP_PATHS, path] }));
      expect(Object.keys(key.sec), path).toContain(path);
    }
  });
});

// ───────── trap ─────────

describe('trap', () => {
  test('지도 안 ∖ (core ∪ sec) 전부다 — 목업의 다섯 문장이 그 집합이다 (D101)', () => {
    const key = buildKey(keyInput());
    expect(Object.keys(key.trap).sort()).toStrictEqual(
      [P.page, P.sheet, P.useCart, P.button, P.format].sort(),
    );
    // sec 인 schema.ts 는 함정이 아니다 — 골라도 감점하지 않는 파일이다.
    expect(Object.keys(key.trap)).not.toContain(P.schema);
    // core 도 아니다.
    expect(Object.keys(key.trap)).not.toContain(P.row);
  });

  test('core 에서 2-hop 인 파일도 사유를 받는다 — 목업 page.tsx 가 그 경우다', () => {
    const key = buildKey(keyInput());
    expect(key.trap[P.page]).toBe(
      '«page.tsx» 는 «CartSheet.tsx» 를 놓기만 합니다. 안쪽이 바뀌어도 «page.tsx» 는 모릅니다',
    );
  });

  test('① 부모 미변경 — core 를 놓기만 하는 파일', () => {
    const key = buildKey(keyInput());
    expect(key.trap[P.sheet]).toBe(
      '«CartSheet.tsx» 는 «CartItemRow.tsx» 를 놓기만 합니다. 안쪽이 바뀌어도 «CartSheet.tsx» 는 모릅니다',
    );
  });

  test('② 공용 의존 미변경 — core 가 가져다 쓰는 파일', () => {
    const key = buildKey(keyInput());
    expect(key.trap[P.button]).toBe('공용 부품. «QuantityStepper.tsx» 가 가져다 쓸 뿐입니다');
    expect(key.trap[P.format]).toBe('공용 부품. «CartItemRow.tsx» 가 가져다 쓸 뿐입니다');
  });

  test('③ 같은 폴더 형제(상태 보유) + 신규 파일', () => {
    const reason = trapReason({
      path: P.useCart,
      core: new Set([P.row]),
      edges: [],
      newFiles: [P.useQty],
    });
    expect(reason).toBe('«useCart.ts» 에 상태가 있지만 이번엔 새 파일 «useCartQuantity.ts» 이 그 일을 맡았습니다');
  });

  test('④ 기본 — 관계도, 상태도, 새 파일도 없는 파일', () => {
    const core = new Set([P.row]);
    // 상태는 있는데 새 파일이 없는 자리와, 관계도 상태도 없는 자리 둘 다 기본으로 떨어진다.
    expect(trapReason({ path: P.useCart, core, edges: [], newFiles: [] }))
      .toBe('이번 커밋에서는 바뀌지 않은 파일입니다');
    expect(trapReason({ path: P.format, core, edges: [], newFiles: [P.useQty] }))
      .toBe('이번 커밋에서는 바뀌지 않은 파일입니다');
  });
});

// ───────── 힌트 · 출처 · 설명 ─────────

describe('hints', () => {
  test('목업 그대로 3단 — 층 수 · 새 파일 수 · core 수(+ sec 수)', () => {
    const key = buildKey(keyInput({ bandOf }));
    expect(key.hints).toStrictEqual([
      '이 기능은 4개 층 중 <b>3개 층</b>에 걸쳐 있습니다. 화면만 고쳐서는 끝나지 않아요.',
      '<b>새로 만들어진 파일이 2개</b> 있습니다. 지도에 「새 판」 표시가 있어요.',
      '꼭 고쳐야 하는 파일은 <b>6개</b>입니다. (＋ 보너스 1개)',
    ]);
  });

  test('bandOf 가 없으면 1단이 층 수를 말하지 않는다', () => {
    expect(buildKey(keyInput()).hints[0]).toBe('이 기능은 여러 층에 걸쳐 있습니다. 화면만 고쳐서는 끝나지 않아요.');
  });

  test('새 파일이 없고 sec 도 없으면 2·3단이 낮아진다', () => {
    const files = [file(P.row, { additions: 9, deletions: 4 }), file(P.api, { additions: 18, deletions: 1 })];
    const key = buildKey(keyInput({ files }));
    expect(key.hints[1]).toBe('이번 커밋에서 새로 만들어진 파일은 없습니다. 있던 파일만 고쳤어요.');
    expect(key.hints[2]).toBe('꼭 고쳐야 하는 파일은 <b>2개</b>입니다.');
  });
});

describe('출처와 설명', () => {
  test('commit 블록은 목업 모양이다', () => {
    expect(buildKey(keyInput()).commit).toStrictEqual({
      h: 'a3f19c2',
      d: '2026-07-14',
      m: 'feat(cart): 장바구니 수량 +/- 조절 기능 추가',
      // 목업의 영어 문장을 한국어로 옮겼다 (D61) — 숫자와 부호는 그대로다.
      n: '파일 7개 · +181 −23',
    });
  });

  test('질문은 접두를 뗀 제목을 넣는다', () => {
    const key = buildKey(keyInput());
    expect(key.subject).toBe('장바구니 수량 +/- 조절 기능 추가');
    expect(question(key.subject)).toBe('«장바구니 수량 +/- 조절 기능 추가» 기능을 넣는다면, 어느 파일들을 고쳐야 할까요?');
  });

  test('새 파일은 사전순으로 모은다', () => {
    expect(buildKey(keyInput()).newFiles).toStrictEqual([P.stepper, P.useQty]);
  });

  test('설명은 사실만 담는다 — 새 파일 · 바뀐 줄 수 · 관계', () => {
    const key = buildKey(keyInput({ bandOf }));
    expect(key.core[P.stepper]).toStrictEqual(['+64 −0', '새로 만든 파일입니다. «CartItemRow.tsx» 가 이 파일을 가져다 씁니다.']);
    expect(key.core[P.route]).toStrictEqual(['+27 −2', '29줄이 바뀌었습니다. «cartApi.ts» 가 이 파일을 가져다 씁니다.']);
  });

  test('바뀐 파일과 이어지지 않으면 층 이름을 말한다', () => {
    const files = [file('lib/alone.ts', { additions: 9, deletions: 0 }), ...CART_FILES.slice(2)];
    const key = buildKey(keyInput({ files, mapPaths: [...MAP_PATHS, 'lib/alone.ts'], bandOf }));
    expect(key.core['lib/alone.ts']?.[1]).toBe('9줄이 바뀌었습니다. 공용 · 데이터 층입니다.');
  });
});

// ───────── 결정성 (04 §9) ─────────

describe('결정성', () => {
  test('두 번 불러도 deep-equal 이고 키 순서까지 같다', () => {
    const recent = new Map<number, readonly string[]>([
      [90, [P.stepper, P.api, P.format]],
      [91, [P.row, P.route, P.format]],
    ]);
    const a = buildKey(keyInput({ recent, bandOf }));
    const b = buildKey(keyInput({ recent, bandOf }));
    expect(a).toStrictEqual(b);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  test('입력 파일 순서가 바뀌어도 같은 정답지다', () => {
    const a = buildKey(keyInput());
    const b = buildKey(keyInput({ files: [...CART_FILES].reverse() }));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  test('candidates 는 입력 배열을 망가뜨리지 않는다', () => {
    const rows = [commit({ id: 1, authoredAt: 100 }), commit({ id: 2, authoredAt: 200 })];
    const filesOf = new Map(rows.map((c) => [c.id, [file(P.row), file(P.api), file(P.stepper)]]));
    candidates({ commits: rows, filesOf, unitPaths: UNIT_PATHS });
    expect(rows.map((c) => c.id)).toStrictEqual([1, 2]);
  });
});
