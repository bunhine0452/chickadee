/**
 * T2 구조 채점 단위 테스트 (04 §8.2~§8.4).
 *
 * 04 §9 의 T2 골든 두 건이 이 파일의 뼈대다. 목업 데이터(`design/src/ink/data.js` 의 `T2`)는
 * import 하지 않고 그대로 옮겨 적었다 — `design/**` 은 앱의 의존이 아니다(`t1.test.ts` 와 같다).
 */
import { describe, expect, test } from 'vitest';

import { draftT2Appeal, pickRelation, PROMOTE_MIN, promoteToSec, t2PatternKey } from './t2-appeal.js';
import { gradeDirection, gradeFlow, gradePicks, gradeRole, toT2Detail } from './t2.js';
import { cappedNote, foldedNote, T2_ENGINE_VERSION, unchangedNote, type T2Payload } from './t2-types.js';

const PAGE = 'app/cart/page.tsx';
const SHEET = 'features/cart/CartSheet.tsx';
const ROW = 'features/cart/CartItemRow.tsx';
const STEPPER = 'features/cart/QuantityStepper.tsx';
const USE_CART = 'features/cart/useCart.ts';
const USE_QTY = 'features/cart/useCartQuantity.ts';
const API = 'features/cart/cartApi.ts';
const ROUTE = 'app/api/cart/route.ts';
const BUTTON = 'components/ui/Button.tsx';
const FORMAT = 'lib/format.ts';
const REPO = 'server/cartRepo.ts';
const SCHEMA = 'server/schema.ts';

/** 목업 `T2` — cart 폴더 책임 배치. `edges` 의 3번째 자리는 D100 으로 넓혀진 `import_edge.kind` 다. */
const CART: T2Payload = {
  track: 't2',
  kind: 'placement',
  q: '장바구니에서 상품 수량을 ＋ / − 버튼으로 바꾸는 기능을 넣는다면, 어느 파일들을 고쳐야 할까요?',
  hint: '지도에서 파일 상자를 클릭해 고릅니다. 정답 개수는 비공개입니다.',
  bands: [
    { l: '화면', s: 'app/' }, { l: '기능', s: 'features/cart/' },
    { l: '동작 · 통신', s: 'hooks · api' }, { l: '공용 · 데이터', s: 'lib · server' },
  ],
  files: [
    { p: PAGE, r: 0 },
    { p: SHEET, r: 1 },
    { p: ROW, r: 1 },
    { p: STEPPER, r: 1, isNew: true },
    { p: USE_CART, r: 2 },
    { p: USE_QTY, r: 2, isNew: true },
    { p: API, r: 2 },
    { p: ROUTE, r: 2 },
    { p: BUTTON, r: 3 },
    { p: FORMAT, r: 3 },
    { p: REPO, r: 3 },
    { p: SCHEMA, r: 3 },
  ],
  edges: [
    [PAGE, SHEET, 'static'],
    [SHEET, ROW, 'static'],
    [SHEET, USE_CART, 'static'],
    [ROW, STEPPER, 'static'],
    [ROW, FORMAT, 'static'],
    [STEPPER, USE_QTY, 'static'],
    [STEPPER, BUTTON, 'static'],
    [USE_QTY, API, 'static'],
    [USE_CART, API, 'static'],
    // 04 §7.1 의 Next HTTP 엣지 — 목업의 `cartApi → route.ts` 가 그 예다.
    [API, ROUTE, 'http'],
    [ROUTE, REPO, 'static'],
    [REPO, SCHEMA, 'static'],
  ],
  commit: { h: 'a3f19c2', d: '2026-07-14', m: 'feat(cart): 장바구니 수량 +/- 조절 기능 추가', n: '7 files changed, +181 −23' },
  core: {
    [STEPPER]: ['+64 −0', '새로 만든 파일입니다. ＋ / − 버튼 두 개와 숫자 하나. 화면 조각은 여기서 시작해요.'],
    [USE_QTY]: ['+41 −0', '새로 만든 훅입니다. 버튼을 누르면 서버에 알리고 결과를 돌려받는 동작은 화면이 아니라 여기 놓였어요.'],
    [ROW]: ['+9 −4', '한 줄짜리 항목 안에 스테퍼를 끼워 넣느라 고쳐졌습니다.'],
    [API]: ['+18 −1', '서버에 「수량 바꿔 줘」라고 말하는 함수가 하나 늘었습니다.'],
    [ROUTE]: ['+27 −2', '그 요청을 받는 서버 쪽 입구. 화면만 고쳐서는 서버가 모릅니다.'],
    [REPO]: ['+14 −0', '실제로 DB 에 수량을 쓰는 자리. 끝까지 내려와야 저장돼요.'],
  },
  sec: { [SCHEMA]: ['+4 −1', '수량 필드 타입이 같이 손봐졌어요. 몰랐어도 감점 없습니다.'] },
  trap: {
    [SHEET]: '목록을 감싸기만 해서 실제로는 한 줄도 안 바뀌었습니다. 가장 흔한 오답이에요.',
    [PAGE]: '페이지는 CartSheet 를 놓기만 합니다. 안쪽이 바뀌어도 페이지는 모릅니다.',
    [BUTTON]: '공용 부품은 웬만하면 안 건드리는 쪽이 좋아요. 스테퍼가 이 버튼을 가져다 쓸 뿐입니다.',
    [FORMAT]: '가격 표시 함수. 수량이 바뀌어도 표시 규칙은 그대로예요.',
    [USE_CART]: '아깝습니다! 장바구니 상태는 여기 있지만, 이번엔 수량 전용 훅을 새로 만들었기 때문에 이 파일은 그대로 뒀어요.',
  },
  hints: [
    '이 기능은 4개 층 중 3개 층에 걸쳐 있습니다. 화면만 고쳐서는 끝나지 않아요.',
    '새로 만들어진 파일이 2개 있습니다. 지도에 「새 판」 표시가 있어요.', '꼭 고쳐야 하는 파일은 6개입니다. (＋ 보너스 1개)',
  ],
};

const ALL = CART.files.map((f) => f.p);

describe('04 §9 T2 골든', () => {
  test('① 5개 선택 — found 4 · missed 2 · wrong 1 · pct 67 · repeat-soft', () => {
    const r = gradePicks({
      kind: 'placement',
      payload: CART,
      selected: [STEPPER, USE_QTY, ROW, API, SHEET],
      hints: 0,
    });

    expect(r.found).toEqual([ROW, STEPPER, USE_QTY, API]);
    expect(r.missed).toEqual([ROUTE, REPO]);
    expect(r.wrong).toEqual([SHEET]);
    expect(r.bonus).toEqual([]);
    expect(r.pct).toBe(67);
    expect(r.verdict).toBe('repeat-soft');
    expect(r.capped).toBeNull();
  });

  test('② 12개 전부 선택 — pct 100 인데 wrong 5 > 3 이라 진급 금지', () => {
    const r = gradePicks({ kind: 'placement', payload: CART, selected: ALL, hints: 0 });

    expect(r.pct).toBe(100);
    expect(r.found).toHaveLength(6);
    expect(r.missed).toEqual([]);
    expect(r.bonus).toEqual([SCHEMA]);
    expect(r.wrong).toEqual([PAGE, SHEET, USE_CART, BUTTON, FORMAT]);
    expect(r.wrong.length).toBeGreaterThan(Math.ceil(6 / 2));
    expect(r.verdict).not.toBe('advance');
    expect(r.verdict).toBe('repeat-soft');
    expect(r.capped).toBe(cappedNote());
  });
});

describe('책임 배치 · 영향 반경 (04 §8.2)', () => {
  test('상한 안이면 진급한다 — 6개 정답 + wrong 3', () => {
    const r = gradePicks({
      kind: 'placement',
      payload: CART,
      selected: [...Object.keys(CART.core), PAGE, SHEET, USE_CART],
      hints: 2,
    });
    expect(r.pct).toBe(100);
    expect(r.wrong).toHaveLength(3);
    expect(r.verdict).toBe('advance');
    expect(r.capped).toBeNull();
    expect(r.hints).toBe(2);
  });

  test('rows 는 missed → found → wrong → sec 순이고 sec 는 안 골라도 전부 실린다', () => {
    const r = gradePicks({ kind: 'placement', payload: CART, selected: [STEPPER, SHEET], hints: 0 });
    expect(r.rows.map((x) => x.tier))
      .toEqual([...Array<string>(5).fill('missed'), 'found', 'wrong', 'sec']);
    // missed 안에서는 밴드 위→아래, 그 다음 payload.files 순서.
    expect(r.rows.filter((x) => x.tier === 'missed').map((x) => x.path))
      .toEqual([ROW, USE_QTY, API, ROUTE, REPO]);
    expect(r.rows.at(-1)).toEqual({
      path: SCHEMA,
      tier: 'sec',
      stat: '+4 −1',
      note: CART.sec[SCHEMA]?.[1],
    });
    // wrong 은 통계가 없다 — 화면이 그 자리에 「변경 없음」을 찍는다.
    expect(r.rows.find((x) => x.tier === 'wrong')).toEqual({
      path: SHEET,
      tier: 'wrong',
      stat: null,
      note: CART.trap[SHEET],
    });
  });

  test('trap 에도 없는 wrong 은 기본 사유를 받는다', () => {
    const bare: T2Payload = { ...CART, trap: {} };
    const r = gradePicks({ kind: 'placement', payload: bare, selected: [SHEET], hints: 0 });
    expect(r.rows.find((x) => x.tier === 'wrong')?.note).toBe(unchangedNote());
  });

  test('접힌 폴더를 고르면 wrong 이되 사유가 다르다 (04 §7.4)', () => {
    const folded: T2Payload = {
      ...CART,
      files: [...CART.files, { p: 'lib/', r: 3, folded: 3 }],
    };
    const r = gradePicks({
      kind: 'placement',
      payload: folded,
      selected: ['lib/'],
      hints: 0,
      foldedOf: { 'lib/': ['lib/a.ts', 'lib/b.ts', 'lib/c.ts'] },
    });
    expect(r.wrong).toEqual(['lib/']);
    expect(r.rows.find((x) => x.tier === 'wrong')?.note).toBe(foldedNote());
  });

  test('|core| = 0 이면 나누지 않는다 — pct 0 · repeat', () => {
    const empty: T2Payload = { ...CART, core: {} };
    const r = gradePicks({ kind: 'placement', payload: empty, selected: [STEPPER], hints: 0 });
    expect(r.pct).toBe(0);
    expect(Number.isNaN(r.pct)).toBe(false);
    expect(r.found).toEqual([]);
    expect(r.verdict).toBe('repeat');
    expect(r.capped).toBeNull();
  });

  test('영향 반경은 같은 식이고 kind 만 갈린다 (04 §8.3)', () => {
    const picks = [STEPPER, USE_QTY, ROW, API, SHEET];
    const a = gradePicks({ kind: 'placement', payload: CART, selected: picks, hints: 0 });
    const b = gradePicks({ kind: 'radius', payload: { ...CART, kind: 'radius' }, selected: picks, hints: 0 });
    expect(b.kind).toBe('radius');
    expect({ ...b, kind: 'placement' }).toEqual(a);
  });

  test('같은 파일을 두 번 골라도 한 번으로 센다', () => {
    const r = gradePicks({ kind: 'placement', payload: CART, selected: [SHEET, SHEET], hints: 0 });
    expect(r.wrong).toEqual([SHEET]);
  });

  test('같은 입력 두 번 → deep-equal (04 §9 결정성)', () => {
    const input = { kind: 'placement' as const, payload: CART, selected: ALL, hints: 1 };
    expect(gradePicks(input)).toEqual(gradePicks(input));
  });
});

// ───────── 흐름 추적 (04 §8.3) ─────────

const FLOW: T2Payload = {
  ...CART,
  kind: 'flow',
  flow: { answer: [PAGE, SHEET, ROW, STEPPER], deck: [PAGE, SHEET, ROW, STEPPER, USE_CART, FORMAT] },
};

describe('흐름 추적 (04 §8.3)', () => {
  test('전부 맞으면 100 · advance', () => {
    const r = gradeFlow({ payload: FLOW, ordered: [PAGE, SHEET, ROW, STEPPER], hints: 0 });
    expect(r.pct).toBe(100);
    expect(r.verdict).toBe('advance');
    expect(r.found).toEqual([PAGE, SHEET, ROW, STEPPER]);
    expect(r.missed).toEqual([]);
    expect(r.wrong).toEqual([]);
    expect(r.bonus).toEqual([]);
  });

  test('함정 카드가 낀 자리의 쌍만 오답이다 — 3쌍 중 2쌍', () => {
    const r = gradeFlow({ payload: FLOW, ordered: [PAGE, SHEET, USE_CART, ROW, STEPPER], hints: 1 });
    expect(r.pct).toBe(67);
    expect(r.verdict).toBe('repeat-soft');
    expect(r.wrong).toEqual([USE_CART]);
    expect(r.missed).toEqual([]);
    expect(r.rows.find((x) => x.tier === 'wrong')?.stat).toBeNull();
    expect(r.hints).toBe(1);
  });

  test('노드를 빼먹으면 missed 로 잡히고 rows 는 정답 경로 순이다', () => {
    const r = gradeFlow({ payload: FLOW, ordered: [PAGE, SHEET], hints: 0 });
    expect(r.missed).toEqual([ROW, STEPPER]);
    expect(r.found).toEqual([PAGE, SHEET]);
    expect(r.pct).toBe(33);
    expect(r.verdict).toBe('repeat');
    expect(r.rows.map((x) => x.path)).toEqual([ROW, STEPPER, PAGE, SHEET]);
    expect(r.rows[0]?.stat).toBe('3번째');
  });

  test('flow 정답지가 없는 카드는 0 이다', () => {
    const r = gradeFlow({ payload: CART, ordered: [PAGE], hints: 0 });
    expect(r.pct).toBe(0);
    expect(r.wrong).toEqual([PAGE]);
    expect(r.verdict).toBe('repeat');
  });
});

// ───────── 의존성 방향 (04 §8.3) ─────────

const PAIRS: T2Payload = {
  ...CART,
  kind: 'direction',
  pairs: [
    { a: PAGE, b: SHEET, answer: 0 },
    { a: BUTTON, b: STEPPER, answer: 1 },
    { a: FORMAT, b: SCHEMA, answer: 3 },
    { a: API, b: ROUTE, answer: 0 },
    { a: REPO, b: SCHEMA, answer: 0 },
  ],
};

describe('의존성 방향 (04 §8.3)', () => {
  test('5문항 전부 맞으면 100 · advance', () => {
    const r = gradeDirection({ payload: PAIRS, picks: [0, 1, 3, 0, 0], hints: 0 });
    expect(r.pct).toBe(100);
    expect(r.verdict).toBe('advance');
    expect(r.found).toHaveLength(5);
    expect(r.missed).toEqual([]);
    expect(r.wrong).toEqual([]);
    expect(r.capped).toBeNull();
  });

  test('한 문항 틀리면 80 · repeat-soft 이고 rows 는 놓친 것부터다', () => {
    const r = gradeDirection({ payload: PAIRS, picks: [0, 0, 3, 0, 0], hints: 0 });
    expect(r.pct).toBe(80);
    expect(r.verdict).toBe('repeat-soft');
    expect(r.missed).toEqual(['Button.tsx ↔ QuantityStepper.tsx']);
    expect(r.rows[0]).toEqual({
      path: 'Button.tsx ↔ QuantityStepper.tsx',
      tier: 'missed',
      stat: 'Button.tsx → QuantityStepper.tsx',
      note: 'QuantityStepper.tsx → Button.tsx — 가져다 쓰는 쪽이 QuantityStepper.tsx 입니다.',
    });
  });

  test('답하지 않은 문항은 missed 이고 고른 보기가 없다', () => {
    const r = gradeDirection({ payload: PAIRS, picks: [0, 1, 3, 0], hints: 3 });
    expect(r.pct).toBe(80);
    expect(r.rows[0]?.stat).toBeNull();
    expect(r.hints).toBe(3);
  });

  test('4지선다라 wrong 이 없고 상한도 걸리지 않는다', () => {
    const r = gradeDirection({ payload: PAIRS, picks: [1, 0, 0, 1, 1], hints: 0 });
    expect(r.pct).toBe(0);
    expect(r.wrong).toEqual([]);
    expect(r.capped).toBeNull();
    expect(r.verdict).toBe('repeat');
  });
});

// ───────── 리포 지도 두 종 (04 §8.5 · D142) ─────────

const APP = 'src/app/';
const CLI = 'src/cli/';
const FEAT = 'src/features/cart/';
const CORE = 'src/core/';
const GEN = 'src/gen/';
const LIB = 'src/lib/';

/**
 * 노드가 파일이 아니라 **폴더**다 (04 §7.5). 정답지 모양은 책임 배치와 똑같아서
 * `gradePicks` 가 한 줄도 안 고치고 그대로 돈다 — 이 표가 그 사실의 증거다.
 *
 * 문 둘(`core`) · 문처럼 생긴 곳 하나(`sec`) · 나머지 셋(`trap`). `src/lib/` 가 들어오는
 * 화살표 셋을 받는 창고라 이 문제의 대표 오답이다.
 */
const ENTRY: T2Payload = {
  track: 't2',
  kind: 'entry',
  q: '이 리포에서 밖에서 처음 들어오는 문은 어느 폴더인가요?',
  hint: '지도에서 골라 보세요. 여럿일 수 있습니다.',
  bands: CART.bands,
  files: [
    { p: APP, r: 0, folded: 4 },
    { p: CLI, r: 0, folded: 2 },
    { p: FEAT, r: 1, folded: 5 },
    { p: CORE, r: 2, folded: 3 },
    { p: GEN, r: 3, folded: 30 },
    { p: LIB, r: 3, folded: 6 },
  ],
  edges: [
    [APP, FEAT, 'static'],
    [APP, LIB, 'static'],
    [CLI, CORE, 'static'],
    [FEAT, CORE, 'static'],
    [FEAT, LIB, 'static'],
    [CORE, LIB, 'static'],
    [CORE, GEN, 'type'],
  ],
  core: {
    [APP]: ['문', '«page.tsx» — 밖에서 부르는 파일이 여기 있고 들어오는 화살표가 없습니다.'],
    [CLI]: ['문', '들어오는 화살표가 없고 1곳을 가져다 씁니다.'],
  },
  sec: {
    [FEAT]: ['문처럼 생긴 곳', '문 이름은 «index.ts» 인데 리포 안에서 1곳이 이 폴더를 가져다 씁니다.'],
  },
  trap: {
    [CORE]: '2곳이 이 폴더를 가져다 씁니다. 많이 쓰이는 것과 처음 들어오는 것은 다릅니다.',
    [GEN]: '1곳이 이 폴더를 가져다 씁니다. 많이 쓰이는 것과 처음 들어오는 것은 다릅니다.',
    [LIB]: '3곳이 이 폴더를 가져다 씁니다. 많이 쓰이는 것과 처음 들어오는 것은 다릅니다.',
  },
  hints: [
    '문은 2곳입니다.',
    '들어오는 화살표가 없는 폴더를 찾으세요. 많이 쓰이는 폴더는 문이 아닙니다.',
    '가장 많이 쓰이는 곳은 «src/lib/» 입니다 — 그건 창고입니다.',
  ],
};

describe('진입점 (04 §8.5) — 채점 코드가 0줄이다', () => {
  test('`gradePicks` 가 그대로 돈다 — 문 둘을 고르면 100 · advance', () => {
    const r = gradePicks({ kind: 'entry', payload: ENTRY, selected: [APP, CLI], hints: 0 });
    expect(r.kind).toBe('entry');
    expect(r.pct).toBe(100);
    expect(r.verdict).toBe('advance');
    expect(r.found).toEqual([APP, CLI]);
    expect(r.missed).toEqual([]);
    expect(r.wrong).toEqual([]);
    expect(r.capped).toBeNull();
  });

  test('문처럼 생긴 곳은 골라도 감점이 없다 — bonus 로 간다', () => {
    const r = gradePicks({ kind: 'entry', payload: ENTRY, selected: [APP, CLI, FEAT], hints: 0 });
    expect(r.pct).toBe(100);
    expect(r.verdict).toBe('advance');
    expect(r.bonus).toEqual([FEAT]);
    expect(r.wrong).toEqual([]);
  });

  test('가장 많이 쓰이는 창고를 고르면 wrong 이고 사유가 trap 문장이다', () => {
    const r = gradePicks({ kind: 'entry', payload: ENTRY, selected: [LIB], hints: 2 });
    expect(r.pct).toBe(0);
    expect(r.verdict).toBe('repeat');
    expect(r.wrong).toEqual([LIB]);
    expect(r.missed).toEqual([APP, CLI]);
    expect(r.rows.find((x) => x.tier === 'wrong')?.note).toBe(ENTRY.trap[LIB]);
    expect(r.hints).toBe(2);
  });

  test('폴더 노드여도 §7.4 접힘 사유가 뜨지 않는다 — 여기서는 접힌 폴더가 곧 보기다', () => {
    const r = gradePicks({ kind: 'entry', payload: ENTRY, selected: [LIB, GEN], hints: 0 });
    expect(r.rows.filter((x) => x.note === foldedNote())).toEqual([]);
  });

  test('지도를 통째로 고르면 100 이지만 wrong 상한이 진급을 막는다', () => {
    const all = ENTRY.files.map((f) => f.p);
    const r = gradePicks({ kind: 'entry', payload: ENTRY, selected: all, hints: 0 });
    expect(r.pct).toBe(100);
    expect(r.verdict).toBe('repeat-soft');
    expect(r.capped).toBe(cappedNote());
  });
});

// ───────── 폴더의 역할 (04 §8.5) ─────────

const ROLE: T2Payload = {
  ...ENTRY,
  kind: 'role',
  q: '«src/core/» 폴더는 왜 있나요?',
  hint: '지도에는 이 폴더가 빠져 있습니다. 네 층 중 어디에 놓을지 고르세요.',
  core: {},
  sec: {},
  trap: {},
  files: ENTRY.files.filter((f) => f.p !== CORE),
  role: { folder: CORE, answer: 2 },
};

describe('폴더의 역할 (04 §8.5)', () => {
  test('맞히면 100 · advance 이고 결과 줄은 하나다', () => {
    const r = gradeRole({ payload: ROLE, pick: 2, hints: 0 });
    expect(r.kind).toBe('role');
    expect(r.pct).toBe(100);
    expect(r.verdict).toBe('advance');
    expect(r.found).toEqual([CORE]);
    expect(r.missed).toEqual([]);
    expect(r.rows).toEqual([
      { path: CORE, tier: 'found', stat: '동작 · 통신', note: '이 폴더는 «동작 · 통신» 층입니다.' },
    ]);
  });

  test('틀리면 0 · repeat 이고 고른 보기가 결과 줄에 남는다', () => {
    const r = gradeRole({ payload: ROLE, pick: 0, hints: 1 });
    expect(r.pct).toBe(0);
    expect(r.verdict).toBe('repeat');
    expect(r.missed).toEqual([CORE]);
    expect(r.rows[0]?.tier).toBe('missed');
    expect(r.rows[0]?.stat).toBe('화면');
    expect(r.hints).toBe(1);
  });

  test('안 고르면 고른 보기가 없다', () => {
    const r = gradeRole({ payload: ROLE, pick: null, hints: 0 });
    expect(r.rows[0]?.stat).toBeNull();
    expect(r.pct).toBe(0);
  });

  test('4지선다라 wrong 이 없고 상한도 걸리지 않는다', () => {
    for (const pick of [0, 1, 2, 3]) {
      const r = gradeRole({ payload: ROLE, pick, hints: 0 });
      expect(r.wrong).toEqual([]);
      expect(r.bonus).toEqual([]);
      expect(r.capped).toBeNull();
    }
  });

  test('role 정답지가 없는 카드는 무엇을 골라도 0 이다', () => {
    for (const pick of [0, 1, 2, 3, null]) {
      expect(gradeRole({ payload: ENTRY, pick, hints: 0 }).pct).toBe(0);
    }
  });

  test('같은 입력 두 번 → deep-equal (04 §9 결정성)', () => {
    const input = { payload: ROLE, pick: 2, hints: 0 };
    expect(gradeRole(input)).toEqual(gradeRole(input));
  });
});

// ───────── 원장 · 이의 ─────────

describe('toT2Detail (02 §8.2)', () => {
  test('결과를 그대로 옮기고 배열은 복사한다', () => {
    const r = gradePicks({
      kind: 'placement',
      payload: CART,
      selected: [STEPPER, USE_QTY, ROW, API, SHEET, SCHEMA],
      hints: 2,
    });
    const detail = toT2Detail(r, true);
    expect(detail).toEqual({
      track: 't2',
      pct: 67,
      found: [ROW, STEPPER, USE_QTY, API],
      missed: [ROUTE, REPO],
      wrong: [SHEET],
      bonus: [SCHEMA],
      hints: 2,
      more: true,
    });
    detail.found.push('x');
    expect(r.found).toHaveLength(4);
  });

  test('흐름 추적 결과도 같은 모양으로 옮겨진다', () => {
    const r = gradeFlow({ payload: FLOW, ordered: [PAGE, SHEET, USE_CART, ROW, STEPPER], hints: 0 });
    expect(toT2Detail(r, false)).toEqual({
      track: 't2', pct: 67, found: [PAGE, SHEET, ROW, STEPPER], missed: [],
      wrong: [USE_CART], bonus: [], hints: 0, more: false,
    });
  });
});

describe('「이것도 맞다」 (04 §8.4)', () => {
  test('고른 파일과 정답지의 관계', () => {
    expect(pickRelation(SHEET, CART)).toBe('parent');      // CartSheet → CartItemRow(core)
    expect(pickRelation(BUTTON, CART)).toBe('shared');     // QuantityStepper(core) → Button
    expect(pickRelation(FORMAT, CART)).toBe('shared');
    expect(pickRelation(USE_CART, CART)).toBe('parent');   // useCart → cartApi(core)
    expect(pickRelation(PAGE, CART)).toBe('far');
    expect(pickRelation(SCHEMA, { ...CART, edges: [] })).toBe('sibling'); // server/ 형제
    expect(pickRelation('lib/', { ...CART, files: [...CART.files, { p: 'lib/', r: 3, folded: 3 }] }))
      .toBe('folded');
  });

  test('초안 한 행 — 파일 경로가 user_text 이고 line_no 는 null', () => {
    const draft = draftT2Appeal({ path: SHEET, payload: CART });
    expect(draft.track).toBe('t2');
    expect(draft.autoVerdict).toBe('wrong-pick');
    expect(draft.userText).toBe(SHEET);
    expect(draft.lineNo).toBeNull();
    expect(draft.originalText).toBeNull();
    expect(draft.autoReason).toBe('parent');
    expect(draft.reasons).toEqual(['kind:placement', 'relation:parent']);
    expect(draft.engineVersion).toBe(T2_ENGINE_VERSION);
    expect(draft.dictVersion).toBeNull();
    expect(draft.patternKey).toBe(t2PatternKey(CART, 'parent'));
  });

  test('판본은 넘겨받은 값이 이긴다', () => {
    const draft = draftT2Appeal({ path: BUTTON, payload: CART, engineVersion: '9', dictVersion: '2026-01-01' });
    expect(draft.engineVersion).toBe('9');
    expect(draft.dictVersion).toBe('2026-01-01');
  });

  test('patternKey 는 종 + 관계로 모인다 — 경로가 달라도 같은 키', () => {
    expect(draftT2Appeal({ path: BUTTON, payload: CART }).patternKey)
      .toBe(draftT2Appeal({ path: FORMAT, payload: CART }).patternKey);
    expect(t2PatternKey(CART, 'parent')).not.toBe(t2PatternKey(CART, 'shared'));
    expect(t2PatternKey(CART, 'parent')).not.toBe(t2PatternKey({ ...CART, kind: 'radius' }, 'parent'));
  });

  test('같은 파일 3건이면 sec 편입을 제안한다', () => {
    expect(PROMOTE_MIN).toBe(3);
    expect(promoteToSec([
      { userText: SHEET, n: 3 },
      { userText: USE_CART, n: 2 },
      { userText: PAGE, n: 4 },
    ])).toEqual([PAGE, SHEET]);
    expect(promoteToSec([{ userText: SHEET, n: 2 }])).toEqual([]);
  });

  test('건수가 같으면 경로 사전순', () => {
    expect(promoteToSec([{ userText: 'b.ts', n: 3 }, { userText: 'a.ts', n: 3 }]))
      .toEqual(['a.ts', 'b.ts']);
  });
});
