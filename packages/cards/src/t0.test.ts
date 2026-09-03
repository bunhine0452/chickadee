/**
 * T0 생성기 골든 (04 §9). 목업 `design/src/ink/data.js` 의 네 장을 **번들 사전 + 손으로
 * 만든 Site** 로 다시 만들어 본다. 목업은 사람이 손으로 쓴 그림이라 사전 문장과 글자까지
 * 같지는 않다 — 다른 자리는 테스트 이름에 왜 다른지 적었다.
 */
import { describe, expect, test } from 'vitest';
import { loadDict } from '@chickadee/dictionary';
import type { ConceptId, ConceptSite } from '@chickadee/store-sql';

import { contentHash, fnv1a64 } from './hash.js';
import { generateT0, prefer } from './t0.js';
import { genBlank } from './t0-blank.js';
import { genPoint } from './t0-point.js';
import { isFailure, isNoPlate, type SiteInput, type T0Card, type T0Request } from './types.js';

const dict = loadDict({ dependencies: ['react'] });
const conceptOf = (id: string) => {
  const at = dict.concepts.get(id);
  if (!at) throw new Error(`번들 사전에 ${id} 이 없다`);
  return at;
};
const diagDefault = dict.langs.get('ts')?.diag_default;

function site(
  over: Omit<Partial<ConceptSite>, 'conceptId'> & { conceptId: string; lineStart: number },
): ConceptSite {
  // id 는 픽스처마다 고정한다 — 두 번 만든 카드가 같아야 결정성 검사가 성립한다.
  return {
    id: 1, repoId: 1, fileId: 1, siteKey: `key-${over.conceptId}-${over.lineStart}`,
    lineEnd: over.lineStart, colStart: 0, colEnd: 40, tsNodeKind: null, form: null,
    shape: '_._', occurrence: 0, excerpt: '', picks: {}, hole: null, ctx: {},
    lineConcepts: [], uncoveredRatio: 0, confidence: 'syntactic', parseQuality: 'ok',
    isDirty: false, isOversize: false, commitId: null, unknownCount: 0, isAlive: true,
    updatedAt: 0, ...over, conceptId: over.conceptId as ConceptId,
  };
}

const numbered = (from: number, texts: readonly string[]) =>
  texts.map((t, i) => ({ n: from + i, t }));

function request(over: Partial<T0Request> & Pick<T0Request, 'concept' | 'ly' | 'sites'>): T0Request {
  return {
    repoId: 1, dictVersion: '0.1.0', attempt: 0, concepts: dict.concepts,
    ...(diagDefault ? { diagDefault } : {}), ...over,
  };
}

function card(req: T0Request): T0Card {
  const out = generateT0(req);
  if (isNoPlate(out)) throw new Error(`판이 없다: ${out.reason}`);
  return out;
}

// ───────── 목업 카드 1 · optchain (지목형) ─────────

const OPTCHAIN_LINES = numbered(38, [
  'const res = await login(email, password)',
  'if (!res.ok) {',
  "  return setError('아이디나 비밀번호를 확인하세요')",
  '}',
  "const nick = res.user?.profile?.nickname ?? '손님'",
  'setWelcome(`${nick} 님, 어서 오세요`)',
  'return nick',
]);

const optchainSite = (): SiteInput => ({
  site: site({
    conceptId: 'ts/optional-chaining', lineStart: 42, colStart: 13, colEnd: 40, form: 'member',
    excerpt: 'res.user?.profile', picks: { 1: 'res.user', 2: '?.', 3: 'profile' },
    ctx: { fallback: "'손님'" },
  }),
  path: 'src/features/auth/useLogin.ts',
  lines: OPTCHAIN_LINES,
  // 같은 줄에 걸린 혼동 개념 — `??` 와 `'손님'` 이 여기서 후보로 들어온다 (04 §1.1).
  lineSites: [site({
    conceptId: 'ts/nullish-coalescing', lineStart: 42, form: 'binary',
    picks: { 1: 'res.user?.profile?.nickname', 2: '??', 3: "'손님'" }, hole: '??',
  })],
  others: [{
    siteId: 90, file: 'src/features/cart/CartSheet.tsx', line: 18,
    text: 'const total = cart?.items.length ?? 0',
  }],
});

describe('목업 optchain — 지목형', () => {
  const made = card(request({ concept: conceptOf('ts/optional-chaining'), ly: 1, sites: [optchainSite()] }));

  test('겹 1 이면 지목형이 먼저다 (04 §1.4)', () => {
    expect(made.kind).toBe('point');
    expect(made.payload.kind).toBe('point');
  });

  test('정답은 목업과 같이 두 번째 보기(`?.`)다', () => {
    expect(made.payload.answer).toBe(1);
    expect(made.payload.why[1]).toBeNull();
    expect(made.payload.options).toBeUndefined(); // 지목형의 보기는 코드 자체다
  });

  test('짚는 자리는 코드 순서로 번호가 붙는다 — 목업과 다름: `profile` 이 들어가고 `\'손님\'` 이 빠진다', () => {
    // 04 §1.1 오답 ①은 「사전 diag 가 있는 pick」이라 pick.3(`profile`)이 혼동 토큰보다 앞선다.
    // 목업은 손으로 고른 것이라 `res.user · ?? · '손님'` 셋을 오답으로 뒀다.
    const focus = made.payload.lines.find((l) => l.n === 42);
    expect(focus).toEqual({
      n: 42,
      target: true,
      seg: [
        { t: 'const nick = ' },
        { t: 'res.user', pick: 1 },
        { t: '?.', pick: 2 },
        { t: 'profile', pick: 3 },
        { t: '?.nickname ' },
        { t: '??', pick: 4 },
        { t: " '손님'" },
      ],
    });
  });

  test('질문은 사전 템플릿을 푼 것이다 — 목업과 다름: 목업은 `user`·「코드 위에서」로 손질했다', () => {
    expect(made.payload.q).toBe(
      '42행에서 <code>res.user</code>이 없을 때 '
      + '<b>터지지 않고 그 자리에서 멈추게 해 주는 기호</b>를 짚어 보세요.',
    );
  });

  test('혼동 개념 토큰의 진단은 그 개념의 한 줄 + 오해다 (04 §2.1)', () => {
    const why = made.payload.why[3];
    expect(why?.t).toContain('<code>a ?? b</code> 는 <code>a</code> 가 없을 때만 <code>b</code>.');
    expect(why?.t).toContain('falsy');
  });

  test('맥락 줄은 ±2 다 — 목업과 다름: 목업 optchain 만 38~43행 여섯 줄이다', () => {
    expect(made.payload.lines.map((l) => l.n)).toEqual([40, 41, 42, 43, 44]);
    expect(made.payload.promptLines).toHaveLength(7); // 파일이 44행에서 끝난 픽스처
  });

  test('사다리 재료가 함께 구워진다 (04 §2.4)', () => {
    expect(made.payload.dict?.map((d) => d.k)).toEqual(['한 줄로', '왜 필요한가', '42행 안에서']);
    expect(made.payload.prereq).toEqual([
      { conceptId: 'ts/property-access', n: '점 표기 속성 읽기 <code>.</code>' },
      { conceptId: 'ts/undefined-null', n: 'undefined 와 null <code>undefined</code>' },
    ]);
    expect(made.payload.uses).toEqual([{ siteId: 90, f: 'src/features/cart/CartSheet.tsx', l: 18 }]);
    expect(made.payload.payoff).toContain('없으면 멈춤');
    // 치환된 값은 이스케이프된다 — 화면에는 목업과 같은 `'손님'` 으로 보인다.
    expect(made.payload.result?.value).toBe('&#39;손님&#39;');
  });
});

// ───────── 목업 카드 2 · mapupdate (빈칸형) ─────────

const mapSite = (): SiteInput => ({
  site: site({
    conceptId: 'ts/array-map-immutable', lineStart: 41, colStart: 4, colEnd: 54, form: 'map',
    excerpt: 'prev.map((i) => …)', hole: 'map',
    picks: { 1: 'prev', 2: '(i) => (i.id === id ? { ...i, qty } : i)' },
  }),
  path: 'src/features/cart/useCart.ts',
  lines: numbered(37, [
    '',
    '',
    'function setQty(id: string, qty: number) {',
    '  setItems((prev) =>',
    '    prev.map((i) => (i.id === id ? { ...i, qty } : i)),',
    '  )',
    '}',
  ]),
  others: [{
    siteId: 77, file: 'src/features/cart/useCart.ts', line: 34,
    text: 'prev.filter((i) => i.id !== id)',
  }],
});

describe('목업 mapupdate — 빈칸형', () => {
  const req = request({ concept: conceptOf('ts/array-map-immutable'), ly: 3, sites: [mapSite()] });
  const out = genBlank(req, mapSite());
  if ('reason' in out) throw new Error(out.reason);
  const made = out.card;

  test('구멍 줄 조각이 목업과 글자까지 같다', () => {
    expect(made.payload.lines.find((l) => l.n === 41)).toEqual({
      n: 41,
      target: true,
      seg: [
        { t: '    prev.' },
        { hole: true },
        { t: '((i) => (i.id === id ? { ...i, qty } : i)),' },
      ],
    });
  });

  test('보기 넷은 사전이 준 것뿐이고 정답은 구멍 원문이다', () => {
    expect(made.payload.options?.map((o) => o.t).sort()).toEqual(['filter', 'forEach', 'map', 'push']);
    expect(made.payload.options?.[made.payload.answer]?.t).toBe('map');
    expect(made.payload.options?.every((o) => o.mono === true)).toBe(true);
  });

  test('보기는 시드 셔플이고 진단도 같이 재배열된다', () => {
    expect(made.payload.why[made.payload.answer]).toBeNull();
    expect(made.payload.why.filter((w) => w !== null)).toHaveLength(3);
    const forEach = made.payload.options?.findIndex((o) => o.t === 'forEach') ?? -1;
    expect(made.payload.why[forEach]?.t).toContain('아무것도 돌려주지 않습니다');
  });

  test('`{{#other}}` 섹션은 다른 자리가 있을 때만 펴진다', () => {
    const filter = made.payload.options?.findIndex((o) => o.t === 'filter') ?? -1;
    expect(made.payload.why[filter]?.t).toContain('useCart.ts:34');
  });

  test('겹 3 에서는 폴백 사슬이 의미형을 먼저 고른다 — 목업과 다름: 목업 mapupdate 는 ly 3 인데 빈칸형이다', () => {
    // 04 §1.4 prefer(3) = [meaning, blank, point]. 목업 데이터가 그 표와 어긋난다.
    expect(card(req).kind).toBe('meaning');
    expect(card(request({ concept: conceptOf('ts/array-map-immutable'), ly: 2, sites: [mapSite()] })).kind)
      .toBe('blank');
  });
});

// ───────── 목업 카드 3·4 · fnupdate · undef (의미형) ─────────

const fnSite = (): SiteInput => ({
  site: site({
    conceptId: 'react/functional-state-update', lineStart: 27, form: 'paren',
    excerpt: 'setItems((prev) => [...prev, item])',
    picks: { 1: 'prev', 2: '[...prev, item]' }, ctx: { setter: 'setItems' },
  }),
  path: 'src/features/cart/useCart.ts',
  lines: numbered(24, [
    'const [items, setItems] = useState<Item[]>([])',
    '',
    'function addItem(item: Item) {',
    '  setItems((prev) => [...prev, item])',
    '}',
    '',
  ]),
});

const undefSite = (): SiteInput => ({
  site: site({
    conceptId: 'ts/undefined-null', lineStart: 14, form: 'undefined',
    excerpt: 'undefined', picks: { 1: 'undefined' },
  }),
  path: 'src/features/auth/useLogin.ts',
  lines: numbered(12, [
    'import { useState } from "react"',
    'export function useLogin() {',
    '  const [user, setUser] = useState<User | undefined>(undefined)',
    "  const [error, setError] = useState<string | null>(null)",
    '  const [pending, setPending] = useState(false)',
  ]),
});

describe('목업 fnupdate · undef — 의미형', () => {
  test('겹 2 에서 빈칸형이 불가하면 의미형으로 내려온다 (04 §1.4 폴백 사슬)', () => {
    const made = card(request({
      concept: conceptOf('react/functional-state-update'), ly: 2, sites: [fnSite()],
    }));
    expect(made.kind).toBe('meaning');
    expect(made.payload.q).toBe('27행 같은 갱신을 한 번에 두 번 부르면 결과는 어떻게 될까요?');
    expect(made.payload.options).toHaveLength(4);
    expect(made.payload.options?.[made.payload.answer]?.t)
      .toBe('두 번 모두 반영된다 — 각자 바로 앞 결과 위에 쌓인다');
  });

  test('선행 판(undef)은 사전에 의미형뿐이라 겹 0 에서도 의미형이다', () => {
    const made = card(request({ concept: conceptOf('ts/undefined-null'), ly: 0, sites: [undefSite()] }));
    expect(made.kind).toBe('meaning');
    expect(made.payload.q).toBe('14행 뒤에 <code>undefined === null</code> 을 물으면 무엇이 나올까요?');
    expect(made.payload.bridge).toContain('?.');
    expect(made.payload.lines.map((l) => l.n)).toEqual([12, 13, 14, 15, 16]);
  });

  test('추정으로 잡힌 사용처는 의미형에 쓰지 않는다 (04 §1.3)', () => {
    const shaky = undefSite();
    const out = generateT0(request({
      concept: conceptOf('ts/undefined-null'), ly: 3,
      sites: [{ ...shaky, site: { ...shaky.site, confidence: 'heuristic' } }],
    }));
    expect(isNoPlate(out) && out.reason).toBe('추정으로 잡은 사용처라 의미형에 못 쓴다');
  });
});

// ───────── 결정성 · 생성 불가 ─────────

describe('결정성과 생성 불가', () => {
  test('같은 (repoId, kind, site, attempt, dictVersion) 이면 두 번 만든 것이 깊은 비교로 같다', () => {
    const make = () => card(request({
      concept: conceptOf('ts/array-map-immutable'), ly: 2, sites: [mapSite()],
    }));
    expect(make()).toEqual(make());
    expect(make().contentHash).toBe(make().contentHash);
  });

  test('attempt 가 다르면 보기 순서가 달라진다 (04 §2.3)', () => {
    const at = (attempt: number) => card(request({
      concept: conceptOf('ts/array-map-immutable'), ly: 2, attempt, sites: [mapSite()],
    })).payload.options?.map((o) => o.t);
    expect(at(0)).not.toEqual(at(3));
  });

  test('짚을 후보가 셋에 못 미치면 지목형은 사유를 달고 불가다', () => {
    const bare: SiteInput = {
      site: site({
        conceptId: 'ts/optional-chaining', lineStart: 3, colStart: 0, form: 'member',
        picks: { 1: 'a', 2: '?.', 3: 'b' },
      }),
      path: 'x.ts',
      lines: numbered(2, ['', 'a?.b', '']),
    };
    const req = request({ concept: conceptOf('ts/optional-chaining'), ly: 1, sites: [bare] });
    const out = genPoint(req, bare);
    expect(isFailure(out) && out.reason).toBe('짚을 후보가 3개에 못 미친다');
    // 지목형이 막혀도 의미형이 남아 있으면 판은 나온다 — 폴백 사슬의 요점이다.
    expect(card(req).kind).toBe('meaning');
  });

  test('사용처가 없으면 사유를 달고 판이 없다', () => {
    const out = generateT0(request({ concept: conceptOf('ts/optional-chaining'), ly: 1, sites: [] }));
    expect(isNoPlate(out) && out.reason).toBe('리포에 이 문법의 사용처가 없다');
  });

  test('정답이 맥락 줄에 그대로 또 보이면 순위가 밀린다 (04 §1.2 leak)', () => {
    const leaky = mapSite();
    const lines = [...leaky.lines];
    lines[6] = { n: 43, t: '  const same = prev.map((i) => i)' };
    const out = genBlank(
      request({ concept: conceptOf('ts/array-map-immutable'), ly: 2, sites: [] }),
      { ...leaky, lines },
    );
    expect('card' in out && out.leak).toBe(true);
  });
});

describe('내용 해시 (D70)', () => {
  test('두 벌의 FNV-1a 가 서로 달라 16자리 hex 가 32비트로 접히지 않는다', () => {
    const hex = fnv1a64('ts/optional-chaining');
    expect(hex).toHaveLength(16);
    expect(hex.slice(0, 8)).not.toBe(hex.slice(8));
  });

  test('키를 넣은 순서가 달라도 같은 카드는 같은 해시다', () => {
    const a = contentHash({ conceptId: 'c', kind: 'point', siteId: 1, genVersion: 1, payload: { x: 1, y: 2 } });
    const b = contentHash({ payload: { y: 2, x: 1 }, genVersion: 1, siteId: 1, kind: 'point', conceptId: 'c' });
    expect(a).toBe(b);
  });
});

describe('유형 선호', () => {
  test('prefer(ly) 는 04 §1.4 표 그대로다', () => {
    expect(prefer(0)).toEqual(['point', 'blank', 'meaning']);
    expect(prefer(1)).toEqual(['point', 'blank', 'meaning']);
    expect(prefer(2)).toEqual(['blank', 'meaning', 'point']);
    expect(prefer(3)).toEqual(['meaning', 'blank', 'point']);
    expect(prefer(4)).toEqual(['meaning', 'blank', 'point']);
  });
});
