import { describe, expect, it } from 'vitest';

import type { ConceptId } from '@chickadee/store-sql';

import {
  buildDict, buildLadder, buildPrereq, buildPrompt, buildUses, fileBaseName,
  MAX_PROMPT_LINES, plainText, promptCodeLines, selectionLabel,
  type PrereqFacts, type UseMeta,
} from './ladder.js';
import type { T0Card } from './t0.js';

const cid = (s: string) => s as ConceptId;

/** 목업 `data.js` 의 `optchain`(지목형) 을 최소로 줄인 픽스처. */
function t0Card(over: Partial<T0Card> = {}): T0Card {
  return {
    track: 't0',
    kind: 'point',
    file: 'src/features/auth/useLogin.ts',
    focus: 42,
    lines: [
      { n: 41, t: '}' },
      {
        n: 42,
        target: true,
        seg: [
          { t: 'const nick = ' }, { t: 'res.user', pick: 1 }, { t: '?.', pick: 2 },
          { t: 'profile?.nickname ' }, { t: '??', pick: 3 }, { t: ' ' }, { t: "'손님'", pick: 4 },
        ],
      },
    ],
    q: '42행에서 멈추게 해 주는 기호를 짚어 보세요.',
    hint: '점선이 그어진 곳을 클릭합니다.',
    answer: 1,
    why: [{ t: '<code>res.user</code> 는 값을 꺼내는 자리입니다.' }, null, { t: '<code>??</code> 는 채우는 기호입니다.' }, { t: '마지막에 채워 넣는 값입니다.' }],
    ok: '<code>?.</code> 는 앞의 값이 없으면 멈춥니다.',
    rule: '<code>.</code> 은 없으면 터지고, <code>?.</code> 은 없으면 멈춘다.',
    prereq: [],
    uses: [],
    promptLines: [
      'const res = await login(email, password)',
      'if (!res.ok) {',
      "  return setError('아이디나 비밀번호를 확인하세요')",
      '}',
      "const nick = res.user?.profile?.nickname ?? '손님'",
    ],
    ...over,
  } as T0Card;
}

const concept = { name: '옵셔널 체이닝', token: '?.' };

const FENCE = /```\n([\s\S]*?)\n```/;
const fenceLines = (out: string): string[] => (FENCE.exec(out)?.[1] ?? '').split('\n');
const outsideFence = (out: string): string => out.replace(FENCE, '');

// ─── 4단 프롬프트 골든 (D8 · 04 §2.4 · 06 §3.3) ─────────────────────────────

describe('buildPrompt — 프롬프트 골든', () => {
  it('목업 askBuild 의 4토막을 그 순서로 낸다', () => {
    const out = buildPrompt({ card: t0Card(), concept, sel: 2, stuck: '?. 가 undefined 를 내면 다음 줄은 어떻게 되나요' });
    expect(out).toContain('파일 useLogin.ts 42행 근처입니다.');
    expect(out).toContain('배우려는 문법: 옵셔널 체이닝 (?.)');
    expect(out).toContain('제가 막힌 지점: ?. 가 undefined 를 내면 다음 줄은 어떻게 되나요');
    expect(out).toContain('문제에서 「??」 를 골라 틀렸습니다.');
    expect(out.trimEnd().endsWith('프로그래밍을 막 시작한 사람에게 설명하듯, 다른 예제 말고 위 코드 그대로를 예로 들어 알려주세요.')).toBe(true);
    expect(out.indexOf('파일 useLogin.ts')).toBeLessThan(out.indexOf('```'));
    expect(out.indexOf('```')).toBeLessThan(out.indexOf('배우려는 문법'));
  });

  it('절대 경로를 넣어도 base name 만 나간다 — 디렉터리도 리포명도 새지 않는다', () => {
    const file = '/Users/kimhyunbin/Desktop/1dev/cart-shop-web/src/features/auth/useLogin.ts';
    const out = buildPrompt({ card: t0Card({ file }), concept, sel: 2 });
    expect(out).toContain('파일 useLogin.ts ');
    for (const leak of ['Users', 'kimhyunbin', 'Desktop', '1dev', 'cart-shop-web', 'src', 'features', 'auth']) {
      expect(out).not.toContain(leak);
    }
  });

  it('경로 구분자가 출력 어디에도 없다', () => {
    const out = buildPrompt({
      card: t0Card({ file: 'C:\\repos\\cart-shop-web\\src\\features\\auth\\useLogin.ts' }),
      concept,
      sel: null,
    });
    expect(out).not.toMatch(/[/\\]/);
    expect(out).toContain('아직 답을 고르지 못했습니다.');
  });

  it('코드가 «/» 를 품어도 펜스 밖은 깨끗하다 — 담는 코드는 promptLines 뿐이다', () => {
    const card = t0Card({ promptLines: ["import { login } from './api/login'", 'const res = await login(email)'] });
    const out = buildPrompt({ card, concept, sel: 1 });
    expect(outsideFence(out)).not.toMatch(/[/\\]/);
    expect(fenceLines(out)).toEqual(card.promptLines);
  });

  it('코드 펜스는 9줄을 넘지 않는다 (초점 ±4)', () => {
    const many = Array.from({ length: 14 }, (_, i) => `line ${i}`);
    const out = buildPrompt({ card: t0Card({ promptLines: many }), concept, sel: null });
    expect(fenceLines(out)).toHaveLength(MAX_PROMPT_LINES);
    expect(fenceLines(out)).toEqual(many.slice(0, 9));
  });

  it('promptLines 가 비면 카드의 lines 로 되돌아가고 빈칸은 정답으로 채운다', () => {
    const card = t0Card({
      kind: 'blank',
      answer: 0,
      options: [{ t: 'map', mono: true }, { t: 'forEach', mono: true }],
      lines: [{ n: 41, target: true, seg: [{ t: '    prev.' }, { hole: true }, { t: '((i) => i)' }] }],
      promptLines: [],
    });
    expect(promptCodeLines(card)).toEqual(['    prev.map((i) => i)']);
  });

  it('상태 한 줄 3갈래 — 맞힘 · 골라 틀림 · 미답', () => {
    const card = t0Card();
    expect(buildPrompt({ card, concept, sel: 1 })).toContain('문제는 맞혔지만, 왜 그런지는 스스로 설명하지 못하겠습니다.');
    expect(buildPrompt({ card, concept, sel: 0 })).toContain('문제에서 「res.user」 를 골라 틀렸습니다.');
    expect(buildPrompt({ card, concept })).toContain('아직 답을 고르지 못했습니다.');
  });

  it('막힌 지점을 안 쓰면 (비어 있음)', () => {
    expect(buildPrompt({ card: t0Card(), concept, sel: null, stuck: '   ' })).toContain('제가 막힌 지점: (비어 있음)');
  });
});

describe('selectionLabel · fileBaseName · plainText', () => {
  it('지목형은 짚은 토큰, 나머지는 마크업 걷은 보기 문구', () => {
    expect(selectionLabel(t0Card(), 0)).toBe('res.user');
    const meaning = t0Card({ kind: 'meaning', options: [{ t: '그 순간의 최신 <code>items</code>' }], answer: 0 });
    expect(selectionLabel(meaning, 0)).toBe('그 순간의 최신 items');
  });

  it('평문화는 엔티티까지 되돌린다 — 클립보드로 나가는 글이다', () => {
    expect(plainText('<code>a &lt; b &amp;&amp; c</code>')).toBe('a < b && c');
  });

  it('base name — 슬래시 · 역슬래시 · 자를 것이 없는 경우', () => {
    expect(fileBaseName('src/a/b/useLogin.ts')).toBe('useLogin.ts');
    expect(fileBaseName('C:\\repos\\app\\main.rs')).toBe('main.rs');
    expect(fileBaseName('useLogin.ts')).toBe('useLogin.ts');
    expect(fileBaseName('src/a/')).toBe('a');
    expect(fileBaseName('/')).toBe('(파일 이름 없음)');
  });
});

// ─── 1단 · 사전 3층 ──────────────────────────────────────────────────────────

describe('buildDict — 1단', () => {
  it('payload.dict 가 있으면 그대로', () => {
    const dict = [{ k: '한 줄로', t: '…' }, { k: '42행 안에서', steps: ['하나', '둘'] }];
    expect(buildDict(t0Card({ dict }))).toEqual(dict);
  });

  it('없으면 rule / ok / result 로 대체하고 코드 조각은 escape 한다', () => {
    const card = t0Card({ result: { label: 'useState<Item[]>', value: '[]', note: '초기값' } });
    const layers = buildDict(card);
    expect(layers[0]).toEqual({ k: '한 줄로', t: card.rule });
    expect(layers[1]).toEqual({ k: '왜 필요한가', t: card.ok });
    expect(layers[2]).toEqual({
      k: '42행 뒤의 값',
      t: '<code>useState&lt;Item[]&gt;</code> = <code>[]</code> — 초기값',
    });
  });

  it('result 가 없으면 두 층만', () => {
    expect(buildDict(t0Card())).toHaveLength(2);
  });
});

// ─── 2단 · 아래층 진단 ───────────────────────────────────────────────────────

describe('buildPrereq — 2단 상태 판정 4갈래 (04 §2.4)', () => {
  const card = t0Card({
    prereq: [
      { conceptId: cid('ts/member-access'), n: '속성 접근 <code>.</code>' },
      { conceptId: cid('ts/undefined'), n: '<code>undefined</code> 와 <code>null</code>' },
      { conceptId: cid('ts/nullish'), n: '널 병합 <code>??</code>' },
      { conceptId: cid('ts/truthiness'), n: '참 같은 값' },
    ],
  });
  const facts = new Map<ConceptId, PrereqFacts>([
    [cid('ts/member-access'), { layer: 3, cardId: null, inRepo: true }],
    [cid('ts/undefined'), { layer: 0, cardId: 91, inRepo: true }],
    [cid('ts/nullish'), { layer: 0, cardId: null, inRepo: true }],
    [cid('ts/truthiness'), { layer: 1, cardId: null, inRepo: false }],
  ]);

  it('known(ly ≥ 2) · gap(ly ≤ 1 + 카드 있음) · none(합성 예제) · none(판 없음)', () => {
    const rung = buildPrereq(card, facts);
    expect(rung.items.map((i) => i.status)).toEqual(['known', 'gap', 'none', 'none']);
    expect(rung.items[1]?.cardId).toBe(91);
    // 리포에 사용처가 **있어야** 합성이다 — 그 자리가 곧 예고할 자리다 (D137 · E-4).
    expect(rung.items[2]?.none).toBe('synthetic');
    // 사용처가 없으면 예고할 자리가 없으므로 아무것도 만들지 않는다.
    expect(rung.items[3]?.none).toBe('no-plate');
    expect(rung.items[0]?.ly).toBe(3);
    expect(rung.items[0]?.name).toBe('속성 접근 <code>.</code>');
  });

  it('ly ≥ 2 면 카드가 있어도 known 이다 — 내려갈 자리가 아니다', () => {
    const known = new Map<ConceptId, PrereqFacts>([[cid('ts/member-access'), { layer: 2, cardId: 5, inRepo: true }]]);
    expect(buildPrereq(t0Card({ prereq: [{ conceptId: cid('ts/member-access'), n: '.' }] }), known).items[0]?.status).toBe('known');
  });

  it('gapCount 와 「내려갈 곳이 없다」 — 02 §6.4 초보 감지가 센다', () => {
    expect(buildPrereq(card, facts).gapCount).toBe(1);
    expect(buildPrereq(card, facts).nowhereToGo).toBe(false);
    // 선행이 아예 없는 개념도, 있지만 전부 찍혀 있는 개념도 「내려갈 곳이 없다」
    expect(buildPrereq(t0Card()).nowhereToGo).toBe(true);
    expect(buildPrereq(t0Card()).gapCount).toBe(0);
    const allKnown = new Map<ConceptId, PrereqFacts>([[cid('ts/member-access'), { layer: 4, cardId: null, inRepo: true }]]);
    expect(buildPrereq(t0Card({ prereq: [{ conceptId: cid('ts/member-access'), n: '.' }] }), allKnown).nowhereToGo).toBe(true);
  });

  it('사실을 모르는 선행은 0겹 · 리포에 없음으로 본다 — 모르면 합성을 만들지 않는다', () => {
    const rung = buildPrereq(card);
    expect(rung.items.map((i) => i.status)).toEqual(['none', 'none', 'none', 'none']);
    expect(rung.items[0]?.none).toBe('no-plate');
  });

  it('payoff 는 복귀 문단의 앞 절반으로 실려 나간다', () => {
    expect(buildPrereq(t0Card({ payoff: '이어보기 문단' })).payoff).toBe('이어보기 문단');
    expect('payoff' in buildPrereq(t0Card())).toBe(false);
  });
});

// ─── 3단 · 다른 자리 ─────────────────────────────────────────────────────────

describe('buildUses — 3단 (04 §2.4)', () => {
  const card = t0Card({
    uses: [
      { siteId: 1, f: 'src/features/auth/useLogin.ts', l: 19 },   // 같은 파일
      { siteId: 2, f: 'src/features/cart/CartSheet.tsx', l: 18 },
      { siteId: 3, f: 'src/features/catalog/ProductCard.tsx', l: 31 },
      { siteId: 4, f: 'src/features/checkout/useOrder.ts', l: 57 },
    ],
  });
  const meta = new Map<number, UseMeta>([
    [1, { shape: 'call-arg', unknownCount: 0 }],
    [2, { shape: 'call-arg', unknownCount: 0 }],
    [3, { shape: 'jsx-attr', unknownCount: 2 }],
    [4, { shape: 'binary', unknownCount: 1 }],
  ]);

  it('다른 파일 → shape 다른 것 → unknownCount 오름차순, 상위 3', () => {
    const picked = buildUses(card, { currentShape: 'call-arg', meta });
    expect(picked.map((u) => u.siteId)).toEqual([4, 3, 2]);
  });

  it('지금 사용처는 뺀다', () => {
    expect(buildUses(card, { currentSiteId: 4, currentShape: 'call-arg', meta }).map((u) => u.siteId)).toEqual([3, 2, 1]);
  });

  it('최근에 보여 준 자리는 뒤로 — 그래도 3단이 비지는 않는다', () => {
    const recent = new Map<number, UseMeta>([
      [3, { shape: 'jsx-attr', unknownCount: 2, shownRecently: true }],
      [4, { shape: 'binary', unknownCount: 1, shownRecently: true }],
    ]);
    expect(buildUses(card, { currentShape: 'call-arg', meta: recent }).map((u) => u.siteId)).toEqual([2, 1, 4]);
    const allRecent = new Map<number, UseMeta>([[2, { shape: 'x', unknownCount: 0, shownRecently: true }]]);
    expect(buildUses(t0Card({ uses: [{ siteId: 2, f: 'a.ts', l: 1 }] }), { meta: allRecent })).toHaveLength(1);
  });

  it('메타가 없어도 다른 파일 우선 · siteId 순으로 결정적이다', () => {
    expect(buildUses(card, {}).map((u) => u.siteId)).toEqual([2, 3, 4]);
  });
});

// ─── 조립 ───────────────────────────────────────────────────────────────────

describe('buildLadder', () => {
  it('4단을 한 번에 낸다', () => {
    const card = t0Card({
      prereq: [{ conceptId: cid('ts/undefined'), n: 'undefined' }],
      uses: [{ siteId: 2, f: 'src/features/cart/CartSheet.tsx', l: 18 }],
    });
    const ladder = buildLadder({
      card,
      concept,
      currentSiteId: 1,
      prereqFacts: new Map([[cid('ts/undefined'), { layer: 0, cardId: 91, inRepo: true }]]),
      sel: 2,
      stuck: '모르겠어요',
    });
    expect(ladder.dict).toHaveLength(2);
    expect(ladder.prereq.items[0]?.status).toBe('gap');
    expect(ladder.prereq.nowhereToGo).toBe(false);
    expect(ladder.uses.map((u) => u.siteId)).toEqual([2]);
    expect(ladder.prompt).toContain('파일 useLogin.ts 42행 근처입니다.');
    expect(ladder.prompt).toContain('제가 막힌 지점: 모르겠어요');
  });
});
