/**
 * 기초 문항 — **고르지 않고 적는다** (`docs/program/fundamentals.md`).
 *
 * 지금 1·2부(D177)의 판은 전부 고르기다 — `point`(짚기) · `blank`(4지) · `meaning`(4지).
 * 그런데 정본 §1 이 재려는 것은 **강제된 능동 출력**이고, 4지선다는 소거법으로 맞을 수 있다.
 * 「`int a = 7 / 2;` 뒤 `a` 는?」에 3·3.5·4·3.0 을 늘어놓으면 소수점이 있는 둘을 지우고
 * 반올림을 지우면 답이 남는다. **적게 하면 그 길이 없다.**
 *
 * 이 파일이 내는 것은 여섯 형식 중 **`value` 하나**다. 나머지 다섯(`step`·`bits`·`table`·
 * `build`·`predict`)은 문서에 확정 명세만 있고 코드가 없다 — 한 형식이 끝까지 서는 것을
 * 먼저 본다.
 *
 * **재료는 사전이 아니라 이 카탈로그다.** 재 보고 그렇게 정했다:
 *   - 사전 예제 224개 중 **값을 들고 있는 것은 0개**다. `examples[].expect` 의 필드는
 *     `sites`·`form`·`hole`·`picks`·`ctx` 뿐이고 값을 적을 자리가 없다.
 *   - 예제의 코드가 애초에 **계산이 안 된다**. `ts/arithmetic` 의 예제는
 *     `const total = a + b` 이고 `a`·`b` 는 아무 데서도 안 묶인다.
 *   - `result.value` 는 값이 아니다. 58개 중 46개가 mustache 패턴
 *     (`"{{pick.2}} {{pick.1}} {{pick.3}}"`)이고 나머지 12개는 한국어 산문
 *     (「조건이 참인 항목만 든 새 배열」). 04 §1.3 이 「값을 계산하지 않는다」를 못박은 그대로다.
 *   - 그리고 **같은 식을 열 언어에 물어야 한다.** `7 / 2` 는 자바에서 3 이고 파이썬에서
 *     3.5 다. 사전에 두면 개념 수 × 언어 수만큼 같은 식을 복제한다 — `AbsenceReason`(D177)과
 *     `exec/order` 의 진단 넷이 사전이 아니라 카탈로그로 간 것과 같은 이유다.
 *
 * 사전이 대는 것은 여전히 있다: **개념 id 와 산문**(`rule`·`ok`·`why`)과 「네 코드의 여기가
 * 그것이다」. 카탈로그가 대는 것은 **식과 그 값**이다. 두 쪽이 갈리는 자리가 여기다.
 */
import { contentHash } from './hash.js';
import { GEN_VERSION } from './payload.js';

/**
 * 기초 문항의 `site_id`. 원장에는 `NULL` 로 들어간다 — 합성 예제와 같은 사정이고, 대응하는
 * `concept_site` 행이 없다. 합성(-1)·추적(-2)·규약(-3) 다음 음수라 넷이 안 섞인다.
 */
export const FUND_SITE_ID = -4;

/** D156 이 고른 열 언어의 사전 네임스페이스. `csharp` 은 `cs/`(기계 개념)가 아니다. */
export type FundLang = 'py' | 'c' | 'cpp' | 'java' | 'csharp' | 'ts' | 'sql' | 'rs' | 'go' | 'swift';

export const FUND_LANGS: readonly FundLang[] = [
  'py', 'c', 'cpp', 'java', 'csharp', 'ts', 'sql', 'rs', 'go', 'swift',
];

/** 여섯 형식. 코드가 있는 것은 `value` 하나다 (`fundamentals.md` §2). */
export type FundType = 'value' | 'step' | 'bits' | 'table' | 'build' | 'predict';

/**
 * 답 하나. **문자열로 든다** — 숫자로 들면 `int` 와 `float` 이 자바스크립트에서 한 타입이라
 * 「3 과 3.0 은 다른 답인가」를 표현할 수 없다. 정수는 십진 문자열, 실수는 왕복하는 최단
 * 십진 표기(`String(x)`)다.
 */
export type FundValue =
  | { t: 'int'; v: string }
  | { t: 'float'; v: string }
  | { t: 'bool'; v: boolean }
  | { t: 'string'; v: string }
  /** 값이 아니라 **사건**이 일어난다 — 예외·패닉·미정의 동작. `accept` 는 인정하는 표기. */
  | { t: 'event'; name: string; accept: readonly string[] };

/**
 * 기계가 밟은 한 걸음. **산문이 없다** — 오답 진단이 i18n 카탈로그를 안 타고 이 배열만으로
 * 서게 하려는 것이다. 읽히는 것은 「무엇이 무엇으로 접혔나」와 「그때 타입이 무엇이었나」다.
 *
 * `7 / 2` → `int / int` 다음 `3` → `int`. 두 줄이면 정수 나눗셈이 다 보인다.
 */
export interface FoldStep {
  code: string;
  type: string;
}

/** 정수 오버플로가 일어나면 그 언어가 하는 일. */
export type OverflowRule = 'wrap' | 'trap' | 'undefined' | 'bignum' | 'double';

/**
 * 언어 하나의 기계 규칙. 문항을 **만드는 쪽과 오답을 진단하는 쪽이 같은 표를 본다** —
 * 「당신의 답 3.5 는 파이썬에서 참이다」가 이 표에서 계산되지 사람이 적는 것이 아니다.
 *
 * `verified` 는 이 행의 값을 무엇으로 확인했나다. `measured` 는 이 저장소에서 실제로
 * 돌려 봤다는 뜻이고(`node` · `sqlite3`), `spec` 은 언어 명세를 읽고 적었다는 뜻이다.
 * 섞어 두면 나중에 무엇을 다시 재야 하는지 모른다.
 */
export interface FundDialect {
  lang: FundLang;
  /** 화면과 진단에 뜨는 이름. */
  name: string;
  /** 기본 정수 폭. `null` = 임의 정밀도(파이썬)이거나 정수 타입이 없다(ts). */
  intBits: 32 | 64 | null;
  /** 정수 둘을 `/` 로 나누면 정수가 남나(`trunc`), 실수가 되나(`double`). */
  intDiv: 'trunc' | 'double';
  /** 나머지의 부호를 나누는 쪽이 정하나(`truncated`), 나누어지는 쪽이 정하나(`floored`). */
  modSign: 'truncated' | 'floored';
  overflow: OverflowRule;
  /** 참·거짓 리터럴의 **정확한** 표기. 대소문자를 봐준다면 파이썬의 `true` 가 정답이 된다. */
  spell: { yes: string; no: string };
  /** 정수·실수의 선언 타입 이름. 판의 「무엇을 적나」 라벨이 이 값이다. */
  ty: { int: string; float: string };
  /** 한 줄 선언을 그 언어의 모양으로. */
  decl: (name: string, kind: 'int' | 'float', expr: string) => string;
  verified: 'measured' | 'spec';
}

/** `int a = 7 / 2;` 꼴 — C 계열 넷이 같은 모양이다. */
const cStyle = (n: string, k: 'int' | 'float', e: string): string =>
  `${k === 'int' ? 'int' : 'double'} ${n} = ${e};`;

/**
 * 열 언어의 기계 규칙.
 *
 * **`measured` 인 행은 셋뿐이다** — `ts`(이 저장소의 node 로 그대로 확인) · `sql`(설치된
 * `sqlite3` 3.x 로 `SELECT 7/2, -7%2, 0.1+0.2, 2147483647+1` 을 돌려 `3|-1|0.3|2147483648`
 * 을 받았다) · `py`(같은 규칙이 IEEE-754 와 floor 나눗셈이라 node 의 `Math.floor` 로 재현).
 * 나머지 일곱은 명세를 읽고 적은 것이고, **착수 전에 실측이 필요하다** (문서 §8).
 */
export const FUND_DIALECTS: Readonly<Record<FundLang, FundDialect>> = {
  py: {
    lang: 'py', name: 'Python', intBits: null, intDiv: 'double', modSign: 'floored',
    overflow: 'bignum', spell: { yes: 'True', no: 'False' }, ty: { int: 'int', float: 'float' },
    decl: (n, _k, e) => `${n} = ${e}`, verified: 'measured',
  },
  c: {
    lang: 'c', name: 'C', intBits: 32, intDiv: 'trunc', modSign: 'truncated',
    overflow: 'undefined', spell: { yes: 'true', no: 'false' }, ty: { int: 'int', float: 'double' },
    decl: cStyle, verified: 'spec',
  },
  cpp: {
    lang: 'cpp', name: 'C++', intBits: 32, intDiv: 'trunc', modSign: 'truncated',
    overflow: 'undefined', spell: { yes: 'true', no: 'false' }, ty: { int: 'int', float: 'double' },
    decl: cStyle, verified: 'spec',
  },
  java: {
    lang: 'java', name: 'Java', intBits: 32, intDiv: 'trunc', modSign: 'truncated',
    overflow: 'wrap', spell: { yes: 'true', no: 'false' }, ty: { int: 'int', float: 'double' },
    decl: cStyle, verified: 'spec',
  },
  csharp: {
    lang: 'csharp', name: 'C#', intBits: 32, intDiv: 'trunc', modSign: 'truncated',
    overflow: 'wrap', spell: { yes: 'true', no: 'false' }, ty: { int: 'int', float: 'double' },
    decl: cStyle, verified: 'spec',
  },
  ts: {
    lang: 'ts', name: 'TypeScript', intBits: null, intDiv: 'double', modSign: 'truncated',
    overflow: 'double', spell: { yes: 'true', no: 'false' }, ty: { int: 'number', float: 'number' },
    decl: (n, _k, e) => `const ${n} = ${e};`, verified: 'measured',
  },
  sql: {
    lang: 'sql', name: 'SQL (SQLite)', intBits: 64, intDiv: 'trunc', modSign: 'truncated',
    overflow: 'bignum', spell: { yes: '1', no: '0' }, ty: { int: 'INTEGER', float: 'REAL' },
    decl: (n, _k, e) => `SELECT ${e} AS ${n};`, verified: 'measured',
  },
  rs: {
    lang: 'rs', name: 'Rust', intBits: 32, intDiv: 'trunc', modSign: 'truncated',
    overflow: 'trap', spell: { yes: 'true', no: 'false' }, ty: { int: 'i32', float: 'f64' },
    decl: (n, k, e) => `let ${n}: ${k === 'int' ? 'i32' : 'f64'} = ${e};`, verified: 'spec',
  },
  go: {
    lang: 'go', name: 'Go', intBits: 64, intDiv: 'trunc', modSign: 'truncated',
    overflow: 'wrap', spell: { yes: 'true', no: 'false' }, ty: { int: 'int', float: 'float64' },
    decl: (n, _k, e) => `${n} := ${e}`, verified: 'spec',
  },
  swift: {
    lang: 'swift', name: 'Swift', intBits: 64, intDiv: 'trunc', modSign: 'truncated',
    overflow: 'trap', spell: { yes: 'true', no: 'false' }, ty: { int: 'Int', float: 'Double' },
    decl: (n, k, e) => `let ${n}: ${k === 'int' ? 'Int' : 'Double'} = ${e}`, verified: 'spec',
  },
};

/** 값 하나를 사람이 읽는 글자로. 걸음(`FoldStep.code`)과 화면이 같은 글자를 쓴다. */
export const valueText = (v: FundValue): string => {
  switch (v.t) {
    case 'event': return v.name;
    case 'bool': return String(v.v);
    default: return v.v;
  }
};

/** 사건 값 하나. `accept` 에 한국어를 넣지 않는다 — 이름은 그 언어의 것이다. */
const event = (name: string, ...alias: string[]): FundValue =>
  ({ t: 'event', name, accept: [name, ...alias] });

/** 사건 값 셋. 오버플로가 값을 안 내는 언어들이 쓴다. */
const EVENTS: Readonly<Record<'undefined' | 'trap', FundValue>> = {
  undefined: event('undefined behavior', 'UB', 'undefined'),
  trap: event('panic', 'trap', 'crash', 'overflow'),
};

export interface FundItem {
  /** `<식 id>:<언어>`. 같은 입력에 같은 id 다 — 재생성 계약의 키다 (04 §0). */
  id: string;
  lang: FundLang;
  type: FundType;
  /** 이 판이 매달리는 개념. 사전이 산문과 「네 코드의 여기」를 여기서 댄다. */
  conceptId: string;
  /** 판에 뜨는 코드. */
  code: readonly string[];
  /** 물음의 대상 줄 (`code` 안 0-based). */
  focus: number;
  /** 무엇의 값을 묻나 — 이름과 그 언어의 선언 타입. 물음 문구는 화면이 짓는다. */
  target: { name: string; declared: string };
  expected: FundValue;
  /** 오답일 때 펴 보이는 기계의 걸음 (`fundamentals.md` §5). */
  fold: readonly FoldStep[];
  /** 이 언어의 참·거짓 표기. 채점기가 이 표기만 정답으로 본다. */
  spell: { yes: string; no: string };
  /**
   * **같은 식의 다른 언어 답.** 정본 §3-2 「당신이 고른 그것이 참이 되는 조건」이 값 적기에서
   * 서는 자리다 — 학습자가 3.5 를 적으면 채점기가 이 배열에서 파이썬을 찾아 「파이썬에서는
   * 참이다」를 낸다. 사람이 진단문을 적는 것이 아니라 카탈로그가 계산한다.
   */
  siblings: readonly { lang: FundLang; name: string; value: FundValue }[];
  /** 「수학적으로는 이 값이다」. `0.1 + 0.2` 의 `0.3` 이 여기 들어간다. 없으면 `null`. */
  ideal: FundValue | null;
  /** `card.content_hash` 와 같은 규약 (D70). */
  contentHash: string;
}

/** 못 낸 식과 사유. 사유 없는 「불가」는 없다 (04 전제). */
export interface FundDrop {
  exprId: string;
  reason: string;
}

interface Made {
  conceptId: string;
  code: string[];
  focus: number;
  target: { name: string; declared: string };
  expected: FundValue;
  fold: FoldStep[];
  ideal: FundValue | null;
}

interface ExprSpec {
  id: string;
  /** 이 언어에서 이 식이 안 서는 사유. 서면 `null`. */
  skip?: (d: FundDialect) => string | null;
  make: (d: FundDialect) => Made;
}

/** 개념 id — 언어 사전에 그 개념이 있으면 그것을, 없으면 보편 개념을. */
const arith = (d: FundDialect): string =>
  (d.lang === 'java' || d.lang === 'py' || d.lang === 'ts' ? `${d.lang}/arithmetic` : 'common/arithmetic');

/** 32비트 두 보수로 감싼 값. `2147483647 + 1` → `-2147483648`. */
const wrap32 = (n: bigint): string => BigInt.asIntN(32, n).toString();

const CATALOG: readonly ExprSpec[] = [
  {
    // 정수 나눗셈. 열 언어가 둘로 갈리는 가장 짧은 식이고, 그 갈림이 곧 교재다.
    id: 'int-div',
    make: (d) => {
      const isInt = d.intDiv === 'trunc';
      const kind = isInt ? 'int' : 'float';
      const declared = isInt ? d.ty.int : d.ty.float;
      return {
        conceptId: arith(d),
        code: [d.decl('a', kind, '7 / 2')],
        focus: 0,
        target: { name: 'a', declared },
        expected: isInt ? { t: 'int', v: '3' } : { t: 'float', v: '3.5' },
        fold: isInt
          ? [{ code: '7 / 2', type: `${d.ty.int} / ${d.ty.int}` }, { code: '3', type: d.ty.int }]
          : [{ code: '7 / 2', type: `${d.ty.float} / ${d.ty.float}` }, { code: '3.5', type: d.ty.float }],
        ideal: { t: 'float', v: '3.5' },
      };
    },
  },
  {
    // 음수의 나머지. 부호를 나누는 쪽이 정하나 나누어지는 쪽이 정하나 — 파이썬만 뒤쪽이다.
    id: 'mod-neg',
    make: (d) => {
      const floored = d.modSign === 'floored';
      const v = floored ? '1' : '-1';
      const isInt = d.intDiv === 'trunc';
      const kind = isInt ? 'int' : 'float';
      const declared = isInt ? d.ty.int : d.ty.float;
      return {
        conceptId: arith(d),
        code: [d.decl('r', kind, '-7 % 2')],
        focus: 0,
        target: { name: 'r', declared },
        expected: isInt ? { t: 'int', v } : { t: 'float', v },
        fold: [
          { code: '-7 % 2', type: `${declared} % ${declared}` },
          { code: floored ? '-7 - (-4 * 2)' : '-7 - (-3 * 2)', type: floored ? 'floor' : 'trunc' },
          { code: v, type: declared },
        ],
        ideal: null,
      };
    },
  },
  {
    // 실수 덧셈. 十진으로 딱 떨어지는 두 수를 더했는데 답이 안 떨어진다.
    id: 'float-add',
    skip: (d) => (d.lang === 'sql'
      // 값은 0.30000000000000004 인데 sqlite3 셸이 15자리로 줄여 `0.3` 을 찍는다(실측).
      // 「보인 것을 적어라」와 「값을 적어라」가 어긋나므로 이 언어에서는 이 형식으로 안 낸다.
      // `bits` 형식이 이 자리를 맡는다 (문서 §2).
      ? '클라이언트가 값을 15자리로 줄여 찍어 학습자가 본 것과 값이 다르다'
      : null),
    make: (d) => ({
      conceptId: 'cs/floating-point',
      code: [d.decl('x', 'float', '0.1 + 0.2')],
      focus: 0,
      target: { name: 'x', declared: d.ty.float },
      expected: { t: 'float', v: '0.30000000000000004' },
      fold: [
        { code: '0.1 + 0.2', type: `${d.ty.float} + ${d.ty.float}` },
        { code: '0.1000000000000000055511151231257827 + 0.2000000000000000111022302462515654', type: 'IEEE-754 binary64' },
        { code: '0.30000000000000004', type: d.ty.float },
      ],
      ideal: { t: 'float', v: '0.3' },
    }),
  },
  {
    // 정수 오버플로. 답이 넷으로 갈린다 — 감기(java·csharp) · 안 넘침(go·swift·py·ts) ·
    // 미정의(c·cpp) · 중단(rs). 한 식으로 「정수형에 폭이 있다」를 다 가르친다.
    id: 'int-overflow',
    skip: (d) => (d.lang === 'sql' ? '두 줄 선언이 없어 같은 식을 못 쓴다' : null),
    make: (d) => {
      const max32 = 2_147_483_647n;
      const expected = ((): FundValue => {
        if (d.overflow === 'undefined') return EVENTS.undefined;
        // 폭이 32비트인 언어만 넘친다. `trap` 도 32비트일 때만 도달한다.
        if (d.intBits === 32) {
          return d.overflow === 'trap' ? EVENTS.trap : { t: 'int', v: wrap32(max32 + 1n) };
        }
        return d.overflow === 'double'
          ? { t: 'float', v: '2147483648' }
          : { t: 'int', v: (max32 + 1n).toString() };
      })();
      const width = d.intBits === null ? '무한' : `${d.intBits}비트`;
      return {
        conceptId: 'cs/integer-overflow',
        code: [d.decl('a', 'int', max32.toString()), d.decl('b', 'int', 'a + 1')],
        focus: 1,
        target: { name: 'b', declared: d.ty.int },
        expected,
        fold: [
          { code: `${max32} + 1`, type: `${d.ty.int}(${width}) + ${d.ty.int}` },
          { code: '2147483648', type: '자릿수를 안 줄인 값' },
          {
            code: valueText(expected),
            type: `${d.ty.int} 에 담은 뒤`,
          },
        ],
        ideal: { t: 'int', v: (max32 + 1n).toString() },
      };
    },
  },
];

/** 같은 식의 다른 언어 답. `expected` 가 같은 언어는 안 담는다 — 진단이 될 게 없다. */
function siblingsOf(spec: ExprSpec, self: FundDialect): FundItem['siblings'] {
  const mine = JSON.stringify(spec.make(self).expected);
  const out: { lang: FundLang; name: string; value: FundValue }[] = [];
  for (const lang of FUND_LANGS) {
    if (lang === self.lang) continue;
    const d = FUND_DIALECTS[lang];
    if (spec.skip?.(d) != null) continue;
    const value = spec.make(d).expected;
    if (JSON.stringify(value) === mine) continue;
    out.push({ lang, name: d.name, value });
  }
  return out;
}

/**
 * 한 언어의 `value` 형식 문항 전부. **순수 함수다** — 같은 언어에 언제나 같은 문항이 나오고
 * IPC·SQL·난수를 부르지 않는다 (04 §9 · D72).
 */
export function buildValueItems(lang: FundLang): { items: FundItem[]; dropped: FundDrop[] } {
  const d = FUND_DIALECTS[lang];
  const items: FundItem[] = [];
  const dropped: FundDrop[] = [];

  for (const spec of CATALOG) {
    const skip = spec.skip?.(d) ?? null;
    if (skip !== null) {
      dropped.push({ exprId: spec.id, reason: skip });
      continue;
    }
    const made = spec.make(d);
    const id = `${spec.id}:${lang}`;
    items.push({
      id,
      lang,
      type: 'value',
      conceptId: made.conceptId,
      code: made.code,
      focus: made.focus,
      target: made.target,
      expected: made.expected,
      fold: made.fold,
      spell: d.spell,
      siblings: siblingsOf(spec, d),
      ideal: made.ideal,
      contentHash: contentHash({
        conceptId: made.conceptId,
        kind: 'value',
        siteId: FUND_SITE_ID,
        genVersion: GEN_VERSION,
        payload: { id, code: made.code, expected: made.expected },
      }),
    });
  }
  return { items, dropped };
}

/** 열 언어 전부. 문서의 표와 시험이 이것을 본다. */
export function buildAllValueItems(): FundItem[] {
  return FUND_LANGS.flatMap((lang) => buildValueItems(lang).items);
}
