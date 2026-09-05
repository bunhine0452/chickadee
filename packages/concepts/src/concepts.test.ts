import { describe, expect, test } from 'vitest';
import { loadDict } from '@chickadee/dictionary';

import { classify, isMine, suggestIdentities, type CommitFacts } from './commits.js';
import { buildGaps, HOT_COUNT, type CountableSite } from './gaps.js';
import { isTestPath } from './ingest-defaults.js';
import { topoOrder } from './prereq-graph.js';
import { assignUnits, OTHER_UNIT } from './units.js';
import {
  chooseFirst, innermostBlock, knownSet, lineIndex, unknownCount, windowRange, windowUnknown,
  type WindowSite,
} from './unknown-rank.js';

function commit(over: Partial<CommitFacts> = {}): CommitFacts {
  return {
    sha: 'abc', parentCount: 1, authorEmail: 'me@example.com', authorName: 'Kim Hyunbin',
    message: 'fix: 로그인 응답 방어', filesN: 2, insertions: 13, ...over,
  };
}

describe('커밋 분류', () => {
  test('부모가 둘이면 머지 — diff 를 계산하지 않는다', () => {
    expect(classify(commit({ parentCount: 2 }))).toBe('merge');
  });

  test('봇은 author 로도 제목으로도 잡힌다', () => {
    expect(classify(commit({ authorEmail: 'dependabot[bot]@users.noreply.github.com' }))).toBe('bot');
    expect(classify(commit({ message: 'Bump version to 1.2.3' }))).toBe('bot');
  });

  test('되돌리기는 라인 귀속엔 남고 정답지에서만 빠진다', () => {
    expect(classify(commit({ message: 'Revert "feat: 장바구니"' }))).toBe('revert');
  });

  test('스캐폴딩은 파일 수로도 추가 줄 수로도 잡힌다', () => {
    expect(classify(commit({ filesN: 200 }))).toBe('bulk');
    expect(classify(commit({ insertions: 5_000 }))).toBe('bulk');
  });

  test('머지 판정이 봇 판정보다 앞선다', () => {
    expect(classify(commit({ parentCount: 2, message: 'Merge branch main' }))).toBe('merge');
  });
});

describe('내 커밋 판정', () => {
  const me = [{ email: 'me@example.com', name: 'Kim Hyunbin' }];

  test('메일이 같으면 내 것이다', () => {
    expect(isMine(commit(), me)).toBe(true);
  });

  test('GitHub noreply 는 로그인 이름으로 맞춘다', () => {
    const c = commit({ authorEmail: '12345+hyunbin@users.noreply.github.com', authorName: '다른 이름' });
    expect(isMine(c, [{ email: 'x@y.z', name: 'hyunbin' }])).toBe(true);
  });

  test('이름은 공백과 점을 지우고 비교한다', () => {
    const c = commit({ authorEmail: 'other@example.com', authorName: 'kim.hyunbin' });
    expect(isMine(c, me)).toBe(true);
  });

  test('부분 일치는 내 것이 아니다 — 남의 커밋이 정답지가 되면 안 된다', () => {
    const c = commit({ authorEmail: 'kim@other.com', authorName: 'Kim' });
    expect(isMine(c, me)).toBe(false);
  });

  test('identity 가 비어 있으면 아무것도 내 것이 아니다', () => {
    expect(isMine(commit(), [])).toBe(false);
  });

  test('첫 열기 때 보여 줄 후보는 커밋 수 순이다', () => {
    const facts = [
      commit({ authorEmail: 'a@x.com', authorName: 'A' }),
      commit({ authorEmail: 'b@x.com', authorName: 'B' }),
      commit({ authorEmail: 'b@x.com', authorName: 'B' }),
    ];
    expect(suggestIdentities(facts).map((i) => i.email)).toEqual(['b@x.com', 'a@x.com']);
  });
});

describe('대지 탐지', () => {
  test('features/<x> 가 가장 먼저 잡힌다', () => {
    const { byPath } = assignUnits([
      'src/features/cart/a.ts', 'src/features/cart/b.ts', 'src/features/cart/c.ts',
    ]);
    expect(byPath.get('src/features/cart/a.ts')).toBe('cart');
  });

  test('Next 라우트의 api 는 대지가 아니다', () => {
    const { byPath } = assignUnits(['app/api/x/route.ts', 'app/api/y/route.ts', 'app/api/z/route.ts']);
    expect(byPath.get('app/api/x/route.ts')).not.toBe('api');
  });

  test('src/lib 같은 창고는 대지가 아니다', () => {
    const { units } = assignUnits(['src/lib/a.ts', 'src/lib/b.ts', 'src/lib/c.ts']);
    expect(units.map((u) => u.name)).not.toContain('lib');
  });

  test('파일이 셋도 안 되는 디렉터리는 기타로 간다', () => {
    const { byPath } = assignUnits(['src/tiny/a.ts', 'src/tiny/b.ts']);
    expect(byPath.get('src/tiny/a.ts')).toBe(OTHER_UNIT);
  });

  test('어디에도 안 드는 파일은 기타 대지가 받는다', () => {
    const { units, byPath } = assignUnits(['index.ts']);
    expect(byPath.get('index.ts')).toBe(OTHER_UNIT);
    expect(units.at(-1)?.name).toBe(OTHER_UNIT);
  });
});

describe('테스트 파일 판정 (D60)', () => {
  test.each([
    ['src/a.test.ts', true],
    ['src/__tests__/a.ts', true],
    ['tests/a.ts', true],
    ['src/latest/a.ts', false],
    ['src/a.ts', false],
  ])('%s → %s', (path, expected) => {
    expect(isTestPath(path)).toBe(expected);
  });
});

describe('미지 개념 수', () => {
  const dict = loadDict();
  const site = {
    conceptId: 'ts/optional-chaining',
    lineConcepts: ['ts/const-declaration', 'ts/property-access'],
    uncoveredRatio: 0,
    lineStart: 1,
    lineEnd: 1,
  };

  test('같은 줄의 모르는 개념을 센다', () => {
    expect(unknownCount(site, () => 0, dict)).toBeGreaterThanOrEqual(2);
  });

  test('아는 개념은 세지 않는다', () => {
    expect(unknownCount(site, () => 1, dict)).toBe(0);
  });

  test('사전이 절반도 설명하지 못하면 하나 더 센다', () => {
    const dark = { ...site, uncoveredRatio: 0.8 };
    expect(unknownCount(dark, () => 1, dict)).toBe(1);
  });

  test('세 줄 이상 걸친 사용처는 하나 더 센다', () => {
    const long = { ...site, lineEnd: 5 };
    expect(unknownCount(long, () => 1, dict)).toBe(1);
  });

  test('자기 자신은 세지 않는다', () => {
    // 사전이 실물이라 선행 폐포가 값을 더한다 — 비교 대상은 「자기가 목록에 있을 때와 없을 때」다.
    const withSelf = { ...site, lineConcepts: ['ts/optional-chaining'] };
    const without = { ...site, lineConcepts: [] };
    expect(unknownCount(withSelf, () => 0, dict)).toBe(unknownCount(without, () => 0, dict));
  });

  test('선행 개념도 미지에 든다 — 사전이 실제로 물려 있다', () => {
    const bare = { ...site, lineConcepts: [] };
    expect(unknownCount(bare, () => 0, dict)).toBeGreaterThan(0);
  });
});

describe('아는 개념 집합', () => {
  test('1겹부터 아는 것이다', () => {
    const known = knownSet([{ conceptId: 'ts/a', layer: 1, universalId: null }]);
    expect(known.has('ts/a')).toBe(true);
  });

  test('같은 보편 개념이 3겹이면 다른 언어 개념도 아는 것으로 친다', () => {
    const known = knownSet([
      { conceptId: 'py/for-in', layer: 3, universalId: 'common/iterate' },
      { conceptId: 'ts/for-of', layer: 0, universalId: 'common/iterate' },
    ]);
    expect(known.has('ts/for-of')).toBe(true);
  });

  test('2겹은 전이를 부르지 않는다', () => {
    const known = knownSet([
      { conceptId: 'py/for-in', layer: 2, universalId: 'common/iterate' },
      { conceptId: 'ts/for-of', layer: 0, universalId: 'common/iterate' },
    ]);
    expect(known.has('ts/for-of')).toBe(false);
  });
});

describe('첫 노출 고르기', () => {
  const base = {
    conceptId: 'ts/x', lineConcepts: [], uncoveredRatio: 0, lineStart: 1, lineEnd: 1,
    isDirty: false,
  };

  test('미지가 적은 사용처가 이긴다', () => {
    const pick = chooseFirst([
      { ...base, siteKey: 'a', path: 'src/a.ts', unknown: 3 },
      { ...base, siteKey: 'b', path: 'src/b.ts', unknown: 1 },
    ]);
    expect(pick?.siteKey).toBe('b');
  });

  test('동률이면 사전이 더 많이 설명한 쪽', () => {
    const pick = chooseFirst([
      { ...base, siteKey: 'a', path: 'src/a.ts', unknown: 1, uncoveredRatio: 0.9 },
      { ...base, siteKey: 'b', path: 'src/b.ts', unknown: 1, uncoveredRatio: 0.1 },
    ]);
    expect(pick?.siteKey).toBe('b');
  });

  test('그다음은 커밋된 쪽 — 워크트리 사용처는 흔들린다', () => {
    const pick = chooseFirst([
      { ...base, siteKey: 'a', path: 'src/a.ts', unknown: 1, isDirty: true },
      { ...base, siteKey: 'b', path: 'src/b.ts', unknown: 1, isDirty: false },
    ]);
    expect(pick?.siteKey).toBe('b');
  });

  test('사용처가 없으면 없다고 답한다', () => {
    expect(chooseFirst([])).toBeNull();
  });
});

describe('창의 미지 (D155)', () => {
  // 실제로 나갔던 판을 그대로 옮겼다 — `App.tsx:86` 의 `56` 은 초점 줄이 깨끗한데
  // (같은 줄의 개념은 `ts/function-declaration` 하나) 창은 12줄짜리 함수 전체다.
  const spark: WindowSite[] = [
    { conceptId: 'ts/function-declaration', lineStart: 86, lineEnd: 97 },
    { conceptId: 'ts/number-literal', lineStart: 86, lineEnd: 86 },
    { conceptId: 'ts/if-statement', lineStart: 87, lineEnd: 87 },
    { conceptId: 'ts/comparison', lineStart: 87, lineEnd: 87 },
    { conceptId: 'ts/return-statement', lineStart: 87, lineEnd: 87 },
    { conceptId: 'ts/const-declaration', lineStart: 88, lineEnd: 88 },
    { conceptId: 'ts/call-expression', lineStart: 88, lineEnd: 88 },
    { conceptId: 'ts/arrow-function', lineStart: 91, lineEnd: 91 },
    { conceptId: 'ts/template-literal', lineStart: 91, lineEnd: 91 },
  ];
  // `TerminalView.tsx:23` 의 `9` — 최상위 상수라 감싸는 블록이 없다.
  const consts: WindowSite[] = [
    { conceptId: 'ts/const-declaration', lineStart: 22, lineEnd: 22 },
    { conceptId: 'ts/string-literal', lineStart: 22, lineEnd: 22 },
    { conceptId: 'ts/const-declaration', lineStart: 23, lineEnd: 23 },
    { conceptId: 'ts/number-literal', lineStart: 23, lineEnd: 23 },
    { conceptId: 'ts/const-declaration', lineStart: 24, lineEnd: 24 },
    { conceptId: 'ts/number-literal', lineStart: 24, lineEnd: 24 },
  ];
  const nothingKnown = (): number => 0;

  test('창은 감싸는 블록 ∪ 초점 ±2 이고, 블록이 없으면 초점 ±2 다', () => {
    expect(windowRange(86, { from: 86, to: 97 })).toEqual({ from: 84, to: 97 });
    expect(windowRange(23)).toEqual({ from: 21, to: 25 });
  });

  test('감싸는 블록 중 가장 안쪽을 고른다', () => {
    const blocks = [{ from: 1, to: 200 }, { from: 86, to: 97 }, { from: 300, to: 400 }];
    expect(innermostBlock(blocks, 90)).toEqual({ from: 86, to: 97 });
    expect(innermostBlock(blocks, 350)).toEqual({ from: 300, to: 400 });
    expect(innermostBlock(blocks, 250)).toBeUndefined();
  });

  test('초점 줄이 같이 깨끗해도 창이 갈라 준다 — 이것이 없어 큰 파일이 늘 이겼다', () => {
    const inSpark = windowUnknown(
      { conceptId: 'ts/number-literal', lineStart: 86 },
      { from: 86, to: 97 }, lineIndex(spark), nothingKnown,
    );
    const atTop = windowUnknown(
      { conceptId: 'ts/number-literal', lineStart: 23 },
      undefined, lineIndex(consts), nothingKnown,
    );
    expect(inSpark).toBe(8);
    expect(atTop).toBe(2);
    expect(atTop).toBeLessThan(inSpark);
  });

  test('자기 개념은 세지 않고, 아는 개념도 세지 않는다', () => {
    const known = new Set(['ts/const-declaration', 'ts/string-literal']);
    const layerOf = (id: string): number => (known.has(id) ? 1 : 0);
    expect(windowUnknown(
      { conceptId: 'ts/number-literal', lineStart: 23 },
      undefined, lineIndex(consts), layerOf,
    )).toBe(0);
  });

  test('창에 걸치기만 하는 사용처도 센다 — 창 안에 글자가 보인다', () => {
    const sites: WindowSite[] = [
      { conceptId: 'ts/number-literal', lineStart: 10, lineEnd: 10 },
      { conceptId: 'ts/array-method-chain', lineStart: 8, lineEnd: 12 },
    ];
    expect(windowUnknown(
      { conceptId: 'ts/number-literal', lineStart: 10 },
      undefined, lineIndex(sites), nothingKnown,
    )).toBe(1);
  });
});

describe('위상 정렬', () => {
  const nodes = [
    { id: 'ts/optional-chaining', prereq: ['ts/property-access'], difficulty: 2 },
    { id: 'ts/property-access', prereq: [], difficulty: 1 },
    { id: 'ts/nullish-coalescing', prereq: ['ts/undefined-null'], difficulty: 2 },
    { id: 'ts/undefined-null', prereq: [], difficulty: 1 },
  ];

  test('선행이 먼저 나온다', () => {
    const order = topoOrder(nodes, []);
    expect(order.indexOf('ts/property-access')).toBeLessThan(order.indexOf('ts/optional-chaining'));
  });

  test('동률은 사전의 essential 순서가 깬다', () => {
    const order = topoOrder(nodes, ['ts/undefined-null', 'ts/property-access']);
    expect(order[0]).toBe('ts/undefined-null');
  });

  test('사이클이 있어도 멈추지 않고 전부 돌려준다', () => {
    const cyclic = [
      { id: 'a/x', prereq: ['a/y'], difficulty: 1 },
      { id: 'a/y', prereq: ['a/x'], difficulty: 1 },
    ];
    expect(topoOrder(cyclic, []).sort()).toEqual(['a/x', 'a/y']);
  });

  test('없는 선행은 무시한다 — 사전이 줄어도 순서는 나온다', () => {
    const order = topoOrder([{ id: 'a/x', prereq: ['a/gone'], difficulty: 1 }], []);
    expect(order).toEqual(['a/x']);
  });
});

describe('구멍 지도', () => {
  const dict = loadDict();

  function sites(n: number, conceptId = 'ts/optional-chaining'): CountableSite[] {
    return Array.from({ length: n }, (_, i) => ({
      conceptId, path: `src/f${i}.ts`, siteKey: `k${i}`, unknown: i,
    }));
  }

  test('내 코드에 있고 겹이 0인 필수 문법만 나온다', () => {
    const rows = buildGaps(dict, {
      lang: 'ts', sites: sites(3), langFileCount: 3, layerOf: () => 0,
    });
    expect(rows.map((r) => r.conceptId)).toEqual(['ts/optional-chaining']);
    expect(rows[0]?.siteCount).toBe(3);
  });

  test('겹이 오른 개념은 더 이상 구멍이 아니다', () => {
    const rows = buildGaps(dict, {
      lang: 'ts', sites: sites(3), langFileCount: 3, layerOf: () => 1,
    });
    expect(rows).toEqual([]);
  });

  test('내 코드에 없는 필수 문법은 패널에 나오지 않는다', () => {
    const rows = buildGaps(dict, { lang: 'ts', sites: [], langFileCount: 3, layerOf: () => 0 });
    expect(rows).toEqual([]);
  });

  test('테스트 파일의 사용처는 세지 않는다 (D60)', () => {
    const inTests = sites(3).map((s) => ({ ...s, path: s.path.replace('.ts', '.test.ts') }));
    expect(buildGaps(dict, { lang: 'ts', sites: inTests, langFileCount: 3, layerOf: () => 0 })).toEqual([]);
  });

  test('가장 많이 나오는 하나는 개수와 무관하게 눈에 띈다', () => {
    const rows = buildGaps(dict, { lang: 'ts', sites: sites(1), langFileCount: 1, layerOf: () => 0 });
    expect(rows[0]?.hot).toBe(true);
  });

  test('10곳 이상이면 hot 이다', () => {
    const rows = buildGaps(dict, {
      lang: 'ts', sites: sites(HOT_COUNT), langFileCount: 30, layerOf: () => 0,
    });
    expect(rows[0]?.hot).toBe(true);
  });

  test('작은 리포에서는 표본 부족을 따지지 않는다', () => {
    const rows = buildGaps(dict, { lang: 'ts', sites: sites(1), langFileCount: 5, layerOf: () => 0 });
    expect(rows[0]?.thin).toBe(false);
  });

  test('큰 리포에서 한 파일에만 있으면 표본 부족이다', () => {
    const oneFile = sites(2).map((s) => ({ ...s, path: 'src/only.ts' }));
    const rows = buildGaps(dict, {
      lang: 'ts', sites: oneFile, langFileCount: 40, layerOf: () => 0,
    });
    expect(rows[0]?.thin).toBe(true);
  });
});
