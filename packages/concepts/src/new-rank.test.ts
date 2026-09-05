/**
 * 새 개념 순위 (02 §6.2·§6.3·§6.4).
 */
import { describe, expect, test } from 'vitest';

import {
  NEWCOMER_MIN_ROOT_NEW, UNKNOWN_CAP, isRockBottom, levelForLayer, newcomerFlag,
  rankNewConcepts, transferFrom, type BestSite, type NewCandidate, type RankInput,
} from './new-rank.js';

const site = (unknown: number, siteId = 1, lines = 1): BestSite =>
  ({ siteId, unknown, lineStart: 10, lineEnd: 9 + lines });

function input(
  candidates: readonly NewCandidate[],
  best: Record<string, BestSite | null>,
  prereq: Record<string, string[]> = {},
): RankInput {
  return {
    candidates,
    bestSiteOf: (id) => best[id] ?? null,
    prereqOf: (id) => prereq[id] ?? [],
  };
}

describe('순위', () => {
  test('선행이 먼저 나온다 (위상 정렬)', () => {
    const cands = [
      { conceptId: 'ts/spread', siteCount: 9 },
      { conceptId: 'ts/const', siteCount: 1 },
    ];
    const ranked = rankNewConcepts(input(cands, {
      'ts/spread': site(1), 'ts/const': site(1),
    }, { 'ts/spread': ['ts/const'] }));
    expect(ranked.map((r) => r.conceptId)).toEqual(['ts/const', 'ts/spread']);
  });

  test('같은 깊이면 미지가 적은 것 → 많이 쓰이는 것 → id (D75)', () => {
    const cands = [
      { conceptId: 'ts/c', siteCount: 1 },
      { conceptId: 'ts/b', siteCount: 9 },
      { conceptId: 'ts/a', siteCount: 9 },
    ];
    const ranked = rankNewConcepts(input(cands, {
      'ts/a': site(2), 'ts/b': site(0), 'ts/c': site(0),
    }));
    expect(ranked.map((r) => r.conceptId)).toEqual(['ts/b', 'ts/c', 'ts/a']);
  });

  test('미지 4 이상은 오늘 보류한다 — 선행이 찍히면 내려온다', () => {
    const ranked = rankNewConcepts(input(
      [{ conceptId: 'ts/hook', siteCount: 20 }],
      { 'ts/hook': site(4) },
    ));
    expect(ranked).toEqual([]);
  });

  test('사용처가 죽었으면 후보에서 빠진다', () => {
    expect(rankNewConcepts(input([{ conceptId: 'ts/x', siteCount: 3 }], { 'ts/x': null })))
      .toEqual([]);
  });
});

describe('카드 level (§6.2 끝)', () => {
  test('첫 노출 1, 2겹부터 2, 3겹부터 3', () => {
    expect([0, 1, 2, 3, 4].map(levelForLayer)).toEqual([1, 1, 2, 3, 3]);
  });

  test('level 이 오르면 미지 상한도 오른다', () => {
    expect(UNKNOWN_CAP[1]).toBe(2);
    expect(UNKNOWN_CAP[2]).toBe(3);
    expect(UNKNOWN_CAP[3]).toBeGreaterThan(100);
  });
});

describe('진짜 바닥 (E-4)', () => {
  test('선행이 다 알려졌는데 모든 사용처가 미지 4 이상이면 합성 예제를 만든다', () => {
    expect(isRockBottom({ conceptId: 'ts/x', siteCount: 3 }, site(5), ['ts/const'],
      new Set(['ts/const']))).toBe(true);
  });

  test('남은 선행이 있으면 바닥이 아니다 — 그것을 먼저 찍는다', () => {
    expect(isRockBottom({ conceptId: 'ts/x', siteCount: 3 }, site(5), ['ts/const'], new Set()))
      .toBe(false);
  });

  test('쓸 만한 사용처가 있으면 바닥이 아니다', () => {
    expect(isRockBottom({ conceptId: 'ts/x', siteCount: 3 }, site(2), [], new Set())).toBe(false);
  });
});

describe('개념 전이 (§6.3)', () => {
  const rows = [
    { conceptId: 'py/for-in', universalId: 'common/loop', layer: 3 },
    { conceptId: 'rs/for', universalId: 'common/loop', layer: 4 },
    { conceptId: 'ts/for-of', universalId: 'common/loop', layer: 0 },
    { conceptId: 'py/dict', universalId: 'common/map', layer: 4 },
  ];

  test('같은 보편 개념이 3겹 이상이면 가장 익은 것에서 전이한다', () => {
    expect(transferFrom('ts/for-of', 'common/loop', rows)).toBe('rs/for');
  });

  test('2겹까지는 전이하지 않는다', () => {
    const weak = rows.map((r) => ({ ...r, layer: Math.min(r.layer, 2) }));
    expect(transferFrom('ts/for-of', 'common/loop', weak)).toBeNull();
  });

  test('보편 개념이 없으면 전이가 없다', () => {
    expect(transferFrom('ts/decorator', null, rows)).toBeNull();
  });
});

describe('초보 감지 (§6.4)', () => {
  const miss = (id: string) => ({ conceptId: id, ok: false, dunno: false });
  const hit = (id: string) => ({ conceptId: id, ok: true, dunno: false });

  test('뿌리 새 판 4장 중 3장을 놓치고 내려갈 층이 없으면 suspect', () => {
    const flag = newcomerFlag({
      rootResults: [miss('a'), miss('b'), miss('c'), hit('d')],
      emptyPrereqReports: 3,
      previous: 'none',
    });
    expect(flag).toBe('suspect');
  });

  test('다음 세션에서도 참이면 confirmed', () => {
    const flag = newcomerFlag({
      rootResults: [miss('a'), miss('b'), miss('c'), miss('d')],
      emptyPrereqReports: 4,
      previous: 'suspect',
    });
    expect(flag).toBe('confirmed');
  });

  test('내려갈 층이 있었으면 초보가 아니라 선행이 빈 것이다', () => {
    const flag = newcomerFlag({
      rootResults: [miss('a'), miss('b'), miss('c'), miss('d')],
      emptyPrereqReports: 1,
      previous: 'none',
    });
    expect(flag).toBe('none');
  });

  test('뿌리 4장 중 3장을 맞히는 세션이 나오면 플래그를 지운다', () => {
    const flag = newcomerFlag({
      rootResults: [hit('a'), hit('b'), hit('c'), miss('d')],
      emptyPrereqReports: 1,
      previous: 'confirmed',
    });
    expect(flag).toBe('none');
  });

  test('표본이 모자라면 판단하지 않는다', () => {
    expect(NEWCOMER_MIN_ROOT_NEW).toBe(4);
    expect(newcomerFlag({ rootResults: [miss('a')], emptyPrereqReports: 1, previous: 'suspect' }))
      .toBe('suspect');
  });
});

describe('사용처 없이 카드만 있는 후보 (D154)', () => {
  const rank = (candidates: { conceptId: string; siteCount: number }[]) =>
    rankNewConcepts({
      candidates,
      bestSiteOf: (id) =>
        (id === 'ts/a' ? { siteId: 1, unknown: 0, lineStart: 1, lineEnd: 1 } : null),
      prereqOf: () => [],
    }).map((c) => c.conceptId);

  test('걸러지지 않고 후보로 남는다', () => {
    expect(rank([{ conceptId: 'exec/order', siteCount: 0 }])).toEqual(['exec/order']);
  });

  // 추적을 더하되 이미 잰 곡선을 흔들지 않는다 — 미지 경계값이라 어휘 뒤에 선다.
  test('같은 깊이의 어휘 개념보다 뒤에 선다', () => {
    expect(rank([
      { conceptId: 'exec/order', siteCount: 0 },
      { conceptId: 'ts/a', siteCount: 5 },
    ])).toEqual(['ts/a', 'exec/order']);
  });

  test('사용처가 있는데 죽어 best 가 없으면 그대로 걸러진다 — 예전 행동이 안 바뀐다', () => {
    expect(rank([{ conceptId: 'ts/dead', siteCount: 3 }])).toEqual([]);
  });

  /**
   * 기계 개념도 같은 가지로 들어온다 (D157 · D167). `cs/` 는 캡처가 없어 `siteCount` 가 0 이고,
   * 창은 자기를 `prereq` 로 가리키는 언어 개념에서 빌린다 — 큐 SQL 도 순위 규칙도
   * 한 글자 안 고친다. `exec/` 와 **같은 자리에 같은 값으로** 서는지만 본다.
   */
  test('cs/ 도 사용처 없이 후보로 남고 어휘 뒤에 선다', () => {
    expect(rank([{ conceptId: 'cs/memory-address', siteCount: 0 }])).toEqual(['cs/memory-address']);
    expect(rank([
      { conceptId: 'cs/memory-address', siteCount: 0 },
      { conceptId: 'ts/a', siteCount: 5 },
    ])).toEqual(['ts/a', 'cs/memory-address']);
  });

  /**
   * 빌린 창의 선행은 여전히 순위를 정한다 — `cs/pointer-indirection` 은 `cs/memory-address`
   * 뒤다. 사용처가 없다고 깊이가 죽지 않는다는 것을 못박는다.
   */
  test('cs/ 끼리는 선행 깊이가 그대로 순서를 정한다', () => {
    const ranked = rankNewConcepts({
      candidates: [
        { conceptId: 'cs/pointer-indirection', siteCount: 0 },
        { conceptId: 'cs/memory-address', siteCount: 0 },
      ],
      bestSiteOf: () => null,
      prereqOf: (id) => (id === 'cs/pointer-indirection' ? ['cs/memory-address'] : []),
    });
    expect(ranked.map((c) => c.conceptId)).toEqual(['cs/memory-address', 'cs/pointer-indirection']);
  });
});
