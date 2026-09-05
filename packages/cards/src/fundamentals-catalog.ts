/**
 * 기초 문항의 **식 카탈로그** — 0부 축 여덟 × 식 셋 이상 (`docs/program/fundamentals.md` §4·§13).
 *
 * 넷에서 스물일곱으로 늘렸다. 늘린 이유는 둘이고 둘 다 결정 등록부에 있다.
 *
 * **① 재출제가 「다른 식 같은 개념」이어야 한다** (D187 ②). 개념당 식이 하나면 틀린 판을
 * 오늘 다시 낼 때 같은 식이 나오고, 그러면 재는 것이 이해가 아니라 답의 기억이다. 개념당
 * 식이 둘 이상이어야 그 규칙이 실제로 선다.
 *
 * **② 오답마다 진단이 계산돼야 한다** (D186 ③ㄷ). 진단의 재료는 셋이다 —
 *   - `siblings` : **같은 식의 다른 언어 답.** 「그 답은 파이썬의 규칙이다」
 *   - `variants` : **같은 언어, 한 글자 다른 판.** 「그 답은 `(2 + 3) * 4` 의 답이다」
 *   - `langAlt`  : **같은 언어, 다른 규칙.** 「`Integer` 가 127 이었으면 그 답이 맞다」
 *
 * 셋째가 왜 필요한지는 표가 말한다: `2 + 3 * 4` 는 열 언어가 전부 14 라 `siblings` 가 비고,
 * 자바와 C# 은 `FUND_DIALECTS` 행이 전 열 같아 서로의 `siblings` 가 못 된다. 그 자리에서
 * 진단을 포기하지 않으려면 재료가 언어 **밖**이 아니라 언어 **안**에 있어야 한다.
 *
 * **식은 손으로 적고 사전이 검산한다.** 로더를 두어 사전을 정본으로 삼는 길도 있었는데
 * 안 갔다: ① 값을 든 꼬리 주석은 지금 **자바 하나**에만 있다(0부 20파일 · 77개). ② 사전의
 * 예제는 그 언어의 코드라 열 언어로 복제되지 않는데 이 카탈로그가 재는 것은 **같은 식의
 * 언어별 갈림**이다. ③ 카탈로그가 순수 함수여야 한다(04 §9 · D72) — 사전을 실행 중에 읽으면
 * `buildValueItems` 가 I/O 를 탄다. 대신 **시험이 두 쪽을 맞댄다**
 * (`fundamentals.test.ts` — 사전 꼬리 주석의 값과 카탈로그의 값이 어긋나면 실패한다).
 */
import {
  ERRORS, EVENTS, notExpr, valueText,
  type DeclKind, type FoldStep, type FundDialect, type FundLang, type FundValue,
} from './fundamentals-dialects.js';

/** 0부 공통 축 여덟 (`docs/curriculum/README.md` §8). */
export type FundAxis =
  | 'integer' | 'float' | 'text' | 'boolean' | 'operator' | 'conversion' | 'assignment' | 'equality';

export const FUND_AXES: readonly FundAxis[] = [
  'integer', 'float', 'text', 'boolean', 'operator', 'conversion', 'assignment', 'equality',
];

/**
 * 같은 언어 안의 다른 판. `variants` 는 **식이 한 글자 다른 것**이고 `langAlt` 는 **규칙이
 * 다른 것**이다 — 둘 다 「당신이 적은 그것이 참이 되는 조건」(정본 §3-2)을 언어 안에서 찾는다.
 *
 * `from`·`to` 는 **글자**다. 산문을 안 담는 이유는 `FoldStep` 과 같다 — 화면 문구는 i18n 이
 * 짓고 카탈로그는 무엇이 무엇으로 바뀌었나만 댄다.
 */
export interface FundAlt {
  code: readonly string[];
  from: string;
  to: string;
  value: FundValue;
}

/** 한 언어에서 구운 식 하나의 알맹이. */
export interface Made {
  code: string[];
  focus: number;
  target: { name: string; declared: string };
  expected: FundValue;
  fold: FoldStep[];
  ideal: FundValue | null;
  variants: FundAlt[];
  langAlt: FundAlt[];
}

export interface ExprSpec {
  id: string;
  axis: FundAxis;
  /** 문법 아래에 깔린 기계 (`cs/` · `docs/curriculum/README.md` §9). 없으면 `null`. */
  machineId: string | null;
  /** 이 언어에서 이 식이 안 서는 사유. 서면 `null`. */
  skip?: (d: FundDialect) => string | null;
  make: (d: FundDialect) => Made;
}

// ───────── 값을 짓는 손 ─────────

/**
 * 정수 값 하나. **TS 만 `float` 로 낸다** — 수가 double 하나뿐이라 `14` 와 `14.0` 이 같은
 * 값이고, `int` 로 내면 채점기가 `14.0` 을 「종류가 다르다」로 잡는다.
 */
const num = (d: FundDialect, v: string): FundValue =>
  (d.ty.int === d.ty.float ? { t: 'float', v } : { t: 'int', v });
const flt = (v: string): FundValue => ({ t: 'float', v });
const yes = (v: boolean): FundValue => ({ t: 'bool', v });
const str = (v: string): FundValue => ({ t: 'string', v });

/** 실수 표기 — TS 는 `3.0` 을 `3` 으로 찍는다. 화면과 값이 같은 글자여야 한다. */
const fltText = (d: FundDialect, whole: string): string =>
  (d.ty.int === d.ty.float ? whole : `${whole}.0`);

/** 그 언어의 글 리터럴. SQL 만 홑따옴표다. */
const lit = (d: FundDialect, s: string): string => (d.lang === 'sql' ? `'${s}'` : `"${s}"`);

/** 32비트 두 보수로 감싼 값. `2147483647 + 1` → `-2147483648`. */
const wrap32 = (n: bigint): string => BigInt.asIntN(32, n).toString();

const step = (code: string, type: string): FoldStep => ({ code, type });

const made = (m: Partial<Made> & Pick<Made, 'code' | 'target' | 'expected' | 'fold'>): Made => ({
  focus: m.code.length - 1, ideal: null, variants: [], langAlt: [], ...m,
});

/**
 * 상수 식을 컴파일러가 먼저 잡는 언어가 있어(Go·Rust·C# 의 `1 / 0`) 씨앗 값을 변수에 한 번
 * 담는다. **SQL 은 문장 잇기가 없어 한 줄로 접는다** — 대신 SQL 에는 상수 접기 오류가 없다.
 */
function lift(
  d: FundDialect,
  seed: { name: string; kind: DeclKind; lit: string },
  build: (ref: string) => string,
  out: { name: string; kind: DeclKind },
): { code: string[]; focus: number } {
  if (d.lang === 'sql') return { code: [d.decl(out.name, out.kind, build(seed.lit))], focus: 0 };
  return {
    code: [d.decl(seed.name, seed.kind, seed.lit), d.decl(out.name, out.kind, build(seed.name))],
    focus: 1,
  };
}

/**
 * 같은 자리에 한 글자만 바꾼 판. `from` 이 **처음 나오는 줄 하나**를 갈아 끼운다 —
 * 마지막 줄만 보면 씨앗 값을 바꾸는 판(`3.9` → `-3.9`)이 조용히 원본과 같아진다.
 * 어느 줄에도 없으면 던진다: 값만 다르고 코드가 같은 「판」은 진단이 아니라 거짓말이다.
 */
function alt(code: readonly string[], from: string, to: string, value: FundValue): FundAlt {
  const at = code.findIndex((line) => line.includes(from));
  if (at === -1) throw new Error(`variant: 어느 줄에도 \`${from}\` 이 없다 — ${code.join(' / ')}`);
  return { code: code.map((line, i) => (i === at ? line.replace(from, to) : line)), from, to, value };
}

const SKIP_SQL_STMT = 'SQL 에는 값을 이름에 붙였다가 다시 붙이는 자리가 없다 — 축 7 은 SQL 에서 비어 있다';

// ───────── 축 1 정수 ─────────

const intDiv: ExprSpec = {
  id: 'int-div', axis: 'integer', machineId: 'cs/binary-representation',
  make: (d) => {
    const isInt = d.intDiv === 'trunc';
    const kind: DeclKind = isInt ? 'int' : 'float';
    const declared = isInt ? d.ty.int : d.ty.float;
    const code = [d.decl('a', kind, '7 / 2')];
    return made({
      code,
      target: { name: 'a', declared },
      expected: isInt ? { t: 'int', v: '3' } : flt('3.5'),
      fold: isInt
        ? [step('7 / 2', `${d.ty.int} / ${d.ty.int}`), step('3', d.ty.int)]
        : [step('7 / 2', `${d.ty.float} / ${d.ty.float}`), step('3.5', d.ty.float)],
      ideal: flt('3.5'),
      // 파이썬은 몫 나눗셈이 따로 있다 — 나머지 아홉에서는 오른쪽을 실수로 만드는 것이 그 자리다.
      variants: d.lang === 'py'
        ? [alt(code, '7 / 2', '7 // 2', { t: 'int', v: '3' })]
        : [alt(code, '7 / 2', '7 / 2.0', flt('3.5'))],
    });
  },
};

const modNeg: ExprSpec = {
  id: 'mod-neg', axis: 'integer', machineId: 'cs/binary-representation',
  make: (d) => {
    const floored = d.modSign === 'floored';
    const v = floored ? '1' : '-1';
    const isInt = d.intDiv === 'trunc';
    const kind: DeclKind = isInt ? 'int' : 'float';
    const declared = isInt ? d.ty.int : d.ty.float;
    const code = [d.decl('r', kind, '-7 % 2')];
    return made({
      code,
      target: { name: 'r', declared },
      expected: isInt ? { t: 'int', v } : flt(v),
      fold: [
        step('-7 % 2', `${declared} % ${declared}`),
        step(floored ? '-7 - (-4 * 2)' : '-7 - (-3 * 2)', floored ? 'floor' : 'trunc'),
        step(v, declared),
      ],
      variants: [alt(code, '-7 % 2', '7 % -2', isInt
        ? { t: 'int', v: floored ? '-1' : '1' }
        : flt(floored ? '-1' : '1'))],
    });
  },
};

const intOverflow: ExprSpec = {
  id: 'int-overflow', axis: 'integer', machineId: 'cs/integer-overflow',
  make: (d) => {
    const max32 = 2_147_483_647n;
    const expected = ((): FundValue => {
      if (d.overflow === 'undefined') return EVENTS.undefined;
      if (d.intBits === 32) {
        return d.overflow === 'trap' ? EVENTS.trap : { t: 'int', v: wrap32(max32 + 1n) };
      }
      return num(d, (max32 + 1n).toString());
    })();
    const { code, focus } = lift(
      d, { name: 'a', kind: 'int', lit: max32.toString() }, (ref) => `${ref} + 1`, { name: 'b', kind: 'int' },
    );
    const width = d.intBits === null ? '무한' : `${d.intBits}비트`;
    return made({
      code, focus,
      target: { name: 'b', declared: d.ty.int },
      expected,
      fold: [
        step(`${max32} + 1`, `${d.ty.int}(${width}) + ${d.ty.int}`),
        step('2147483648', '자릿수를 안 줄인 값'),
        step(valueText(expected), `${d.ty.int} 에 담은 뒤`),
      ],
      ideal: { t: 'int', v: (max32 + 1n).toString() },
      variants: [alt(code, '+ 1', '+ 0', num(d, max32.toString()))],
      // 스위프트는 넘침을 감는 연산자를 따로 둔다 — 같은 언어 안의 다른 규칙이다.
      langAlt: d.lang === 'swift'
        ? [alt(code, '+ 1', '&+ 1', { t: 'int', v: wrap32(max32 + 1n) })]
        : [],
    });
  },
};

const shift31: ExprSpec = {
  id: 'shift-31', axis: 'integer', machineId: 'cs/bit-and-byte',
  make: (d) => {
    const expected = ((): FundValue => {
      if (d.overflow === 'undefined') return EVENTS.undefined;
      if (d.shiftBits === 32) return num(d, wrap32(1n << 31n));
      return num(d, (1n << 31n).toString());
    })();
    const code = [d.decl('a', 'int', '1 << 31')];
    return made({
      code,
      target: { name: 'a', declared: d.ty.int },
      expected,
      fold: [
        step('1 << 31', `${d.ty.int} << 31`),
        step('2147483648', d.shiftBits === null ? '자릿수 제한 없음' : `${d.shiftBits}칸에 담기 전`),
        step(valueText(expected), d.ty.int),
      ],
      ideal: { t: 'int', v: (1n << 31n).toString() },
      variants: [alt(code, '<< 31', '<< 30', num(d, (1n << 30n).toString()))],
    });
  },
};

// ───────── 축 2 실수 ─────────

const floatAdd: ExprSpec = {
  id: 'float-add', axis: 'float', machineId: 'cs/floating-point',
  skip: (d) => (d.lang === 'sql'
    // 값은 0.30000000000000004 인데 sqlite3 셸이 15자리로 줄여 `0.3` 을 찍는다(실측).
    // 「보인 것을 적어라」와 「값을 적어라」가 어긋나므로 이 언어에서는 이 형식으로 안 낸다.
    ? '클라이언트가 값을 15자리로 줄여 찍어 학습자가 본 것과 값이 다르다'
    : null),
  make: (d) => {
    const code = [d.decl('x', 'float', '0.1 + 0.2')];
    return made({
      code,
      target: { name: 'x', declared: d.ty.float },
      expected: flt('0.30000000000000004'),
      fold: [
        step('0.1 + 0.2', `${d.ty.float} + ${d.ty.float}`),
        step('0.1000000000000000055511151231257827 + 0.2000000000000000111022302462515654', 'IEEE-754 binary64'),
        step('0.30000000000000004', d.ty.float),
      ],
      ideal: flt('0.3'),
      // 2진수로 딱 떨어지는 두 수를 고르면 어긋남이 사라진다 — 「실수는 늘 틀린다」가 아니다.
      variants: [alt(code, '0.1 + 0.2', '0.5 + 0.25', flt('0.75'))],
    });
  },
};

const floatDivZero: ExprSpec = {
  id: 'float-div-zero', axis: 'float', machineId: 'cs/floating-point',
  make: (d) => {
    const expected: FundValue = d.lang === 'py' ? EVENTS.divZero
      : d.lang === 'sql' ? EVENTS.sqlNull
        : flt('Infinity');
    const { code, focus } = lift(
      d, { name: 'x', kind: 'float', lit: '1.0' }, (ref) => `${ref} / 0.0`, { name: 'y', kind: 'float' },
    );
    return made({
      code, focus,
      target: { name: 'y', declared: d.ty.float },
      expected,
      fold: [
        step('1.0 / 0.0', `${d.ty.float} / ${d.ty.float}`),
        step(valueText(expected), d.lang === 'py' ? '예외' : d.ty.float),
      ],
      variants: [alt(code, '/ 0.0', '/ 0.5', flt(fltText(d, '2')))],
    });
  },
};

const floatEq: ExprSpec = {
  id: 'float-eq', axis: 'float', machineId: 'cs/floating-point',
  make: (d) => {
    const code = [d.decl('b', 'bool', `0.1 + 0.2 ${d.spellEq} 0.3`)];
    return made({
      code,
      target: { name: 'b', declared: d.ty.bool },
      expected: yes(false),
      fold: [
        step(`0.30000000000000004 ${d.spellEq} 0.3`, `${d.ty.float} ${d.spellEq} ${d.ty.float}`),
        step(d.spell.no, d.ty.bool),
      ],
      variants: [
        alt(code, `0.1 + 0.2 ${d.spellEq} 0.3`, `0.5 + 0.25 ${d.spellEq} 0.75`, yes(true)),
        alt(code, `${d.spellEq} 0.3`, `${d.spellEq} 0.30000000000000004`, yes(true)),
      ],
    });
  },
};

// ───────── 축 3 문자 ─────────

const textLen: ExprSpec = {
  id: 'text-len', axis: 'text', machineId: 'cs/text-encoding',
  make: (d) => {
    const n = { utf16: '2', byte: '4', codepoint: '1', grapheme: '1' }[d.textUnit];
    const unit = { utf16: 'UTF-16 코드 단위', byte: '바이트', codepoint: '코드포인트', grapheme: '글자' }[d.textUnit];
    const { code, focus } = lift(
      d, { name: 's', kind: 'text', lit: lit(d, '😀') }, (ref) => d.len(ref), { name: 'n', kind: 'int' },
    );
    return made({
      code, focus,
      target: { name: 'n', declared: d.ty.int },
      expected: num(d, n),
      fold: [step(d.len(lit(d, '😀')), `${d.ty.text} → ${d.ty.int}`), step(n, unit)],
      ideal: { t: 'int', v: '1' },
      // ASCII 세 글자로 바꾸면 열 언어가 전부 3 이다 — 갈리는 것은 글자 수가 아니라 담는
      // 방식이다. 두 글자로 두면 UTF-16 인 셋에서 답이 2 로 겹쳐 진단이 안 된다.
      variants: [alt(code, '😀', 'abc', num(d, '3'))],
    });
  },
};

const strPlusNum: ExprSpec = {
  id: 'str-plus-num', axis: 'text', machineId: 'cs/type-conversion',
  make: (d) => {
    const expected: FundValue = ((): FundValue => {
      switch (d.strPlusNum) {
        case 'concat': return str('12');
        case 'numeric': return num(d, '3');
        case 'runtime-error': return EVENTS.typeError;
        case 'ptr': return ERRORS.unspecified;
        default: return ERRORS.compile;
      }
    })();
    // `ptr` 는 값이 안 정해질 뿐 식은 선다 — 선언 자리는 그 언어의 글 타입이 맞다.
    const kind: DeclKind = d.strPlusNum === 'concat' || d.strPlusNum === 'ptr' ? 'text'
      : d.strPlusNum === 'numeric' ? 'int' : 'auto';
    const declared = kind === 'text' ? d.ty.text : kind === 'int' ? d.ty.int : '—';
    const code = [d.decl('r', kind, `${lit(d, '1')} + 2`)];
    return made({
      code,
      target: { name: 'r', declared },
      expected,
      fold: [
        step(`${lit(d, '1')} + 2`, `${d.ty.text} + ${d.ty.int}`),
        step(valueText(expected), declared),
      ],
      variants: [alt(code, `${lit(d, '1')} + 2`, '1 + 2', num(d, '3'))],
    });
  },
};

const textIndex: ExprSpec = {
  id: 'text-index', axis: 'text', machineId: 'cs/text-encoding',
  skip: (d) => (d.index === null
    ? '문자열이 정수로 색인되지 않는다 — 인덱스 타입을 거쳐야 한다'
    : null),
  make: (d) => {
    const at = d.index ?? ((n: string) => n);
    const expected: FundValue = d.indexYields === 'byte' ? num(d, '98') : str('b');
    const declared = d.indexYields === 'char' ? 'char' : d.indexYields === 'byte' ? 'byte' : d.ty.text;
    const { code, focus } = lift(
      d, { name: 's', kind: 'text', lit: lit(d, 'abc') }, (ref) => at(ref, 1),
      { name: 'c', kind: d.indexYields === 'char' ? 'char' : d.indexYields === 'byte' ? 'int' : 'text' },
    );
    return made({
      code, focus,
      target: { name: 'c', declared },
      expected,
      fold: [
        step(at(lit(d, 'abc'), 1), `${d.ty.text} → ${declared}`),
        step(valueText(expected), declared),
      ],
      ideal: str('b'),
      variants: [alt(code, at(d.lang === 'sql' ? lit(d, 'abc') : 's', 1), at(d.lang === 'sql' ? lit(d, 'abc') : 's', 0),
        d.indexYields === 'byte' ? num(d, '97') : str('a'))],
    });
  },
};

// ───────── 축 4 참거짓 ─────────

const notZero: ExprSpec = {
  id: 'not-zero', axis: 'boolean', machineId: 'cs/type',
  make: (d) => {
    const expected: FundValue = ((): FundValue => {
      switch (d.unaryNot) {
        case 'bool': return yes(true);
        case 'int': return num(d, '1');
        case 'bitwise': return num(d, '-1');
        default: return ERRORS.compile;
      }
    })();
    const kind: DeclKind = d.unaryNot === 'bool' ? 'bool' : d.unaryNot === 'none' ? 'auto' : 'int';
    const declared = d.unaryNot === 'bool' ? d.ty.bool : d.unaryNot === 'none' ? '—' : d.ty.int;
    const code = [d.decl('b', kind, notExpr(d, '0'))];
    const flipped: FundValue = ((): FundValue => {
      switch (d.unaryNot) {
        case 'bool': return yes(false);
        case 'int': return num(d, '0');
        case 'bitwise': return num(d, '-2');
        default: return ERRORS.compile;
      }
    })();
    return made({
      code,
      target: { name: 'b', declared },
      expected,
      fold: [
        step(notExpr(d, '0'), d.unaryNot === 'bitwise' ? `비트 뒤집기 ${d.ty.int}` : `${d.spellNot} ${d.ty.int}`),
        step(valueText(expected), declared),
      ],
      variants: [alt(code, notExpr(d, '0'), notExpr(d, '1'), flipped)],
    });
  },
};

const boolPlusBool: ExprSpec = {
  id: 'bool-plus-bool', axis: 'boolean', machineId: 'cs/type',
  make: (d) => {
    const ok = d.boolArith;
    const code = [d.decl('n', ok ? 'int' : 'auto', `${d.spell.yes} + ${d.spell.yes}`)];
    return made({
      code,
      target: { name: 'n', declared: ok ? d.ty.int : '—' },
      expected: ok ? num(d, '2') : ERRORS.compile,
      fold: [
        step(`${d.spell.yes} + ${d.spell.yes}`, `${d.ty.bool} + ${d.ty.bool}`),
        step(ok ? '1 + 1' : 'compile error', ok ? d.ty.int : '—'),
      ],
      variants: [alt(code, `+ ${d.spell.yes}`, `+ ${d.spell.no}`, ok ? num(d, '1') : ERRORS.compile)],
    });
  },
};

const eqLiteral: ExprSpec = {
  id: 'eq-literal', axis: 'boolean', machineId: 'cs/identity-vs-equality',
  make: (d) => {
    const code = [d.decl('b', 'bool', `1 ${d.spellEq} 1`)];
    return made({
      code,
      target: { name: 'b', declared: d.ty.bool },
      expected: yes(true),
      fold: [step(`1 ${d.spellEq} 1`, `${d.ty.int} ${d.spellEq} ${d.ty.int}`), step(d.spell.yes, d.ty.bool)],
      variants: [alt(code, `${d.spellEq} 1`, `${d.spellEq} 2`, yes(false))],
    });
  },
};

// ───────── 축 5 연산자 ─────────

const precMulAdd: ExprSpec = {
  id: 'prec-mul-add', axis: 'operator', machineId: 'cs/operator-precedence',
  make: (d) => {
    const code = [d.decl('n', 'int', '2 + 3 * 4')];
    return made({
      code,
      target: { name: 'n', declared: d.ty.int },
      expected: num(d, '14'),
      fold: [step('2 + 3 * 4', d.ty.int), step('2 + 12', d.ty.int), step('14', d.ty.int)],
      // 열 언어가 전부 14 라 `siblings` 가 비는 자리다 — 진단은 괄호 하나 넣은 판이 낸다.
      variants: [alt(code, '2 + 3 * 4', '(2 + 3) * 4', num(d, '20'))],
    });
  },
};

const precShiftAdd: ExprSpec = {
  id: 'prec-shift-add', axis: 'operator', machineId: 'cs/operator-precedence',
  make: (d) => {
    const tight = d.shiftBindsTighter;
    const code = [d.decl('n', 'int', '1 + 2 << 3')];
    return made({
      code,
      target: { name: 'n', declared: d.ty.int },
      expected: num(d, tight ? '17' : '24'),
      fold: [
        step('1 + 2 << 3', tight ? '`<<` 가 `+` 보다 먼저' : '`+` 가 `<<` 보다 먼저'),
        step(tight ? '1 + (2 << 3)' : '(1 + 2) << 3', d.ty.int),
        step(tight ? '17' : '24', d.ty.int),
      ],
      variants: [alt(code, '1 + 2 << 3', '1 + (2 << 3)', num(d, '17'))],
    });
  },
};

const precCmpChain: ExprSpec = {
  id: 'prec-cmp-chain', axis: 'operator', machineId: 'cs/operator-precedence',
  make: (d) => {
    const expected: FundValue = d.chainCompare === 'error' ? ERRORS.compile : yes(true);
    const code = [d.decl('b', d.chainCompare === 'error' ? 'auto' : 'bool', '1 < 2 < 3')];
    return made({
      code,
      target: { name: 'b', declared: d.chainCompare === 'error' ? '—' : d.ty.bool },
      expected,
      fold: [
        step('1 < 2 < 3', d.chainCompare === 'chained' ? '사슬 비교' : d.chainCompare === 'folds' ? '왼쪽부터 접힌다' : '—'),
        step(d.chainCompare === 'folds' ? `${d.spell.yes} < 3` : valueText(expected), d.chainCompare === 'folds' ? `${d.ty.bool} < ${d.ty.int}` : '—'),
        step(valueText(expected), d.chainCompare === 'error' ? '—' : d.ty.bool),
      ],
      // 다른 판은 언어마다 다른 것을 보여야 한다 — 값이 같은 판은 진단이 아니다.
      //   사슬(파이썬)  : `1 < 2 < 0` 이 거짓이 되는 것이 사슬의 증거다
      //   접힘(C·TS·SQL): `3 > 2 > 1` 이 **거짓**이다 — 참 하나가 1 로 접혀 1 > 1 이 된다
      //   오류(다섯)    : 이어 쓰기 대신 `&&` 로 나눠 쓰면 그제야 선다
      variants: [d.chainCompare === 'chained'
        ? alt(code, '1 < 2 < 3', '1 < 2 < 0', yes(false))
        : d.chainCompare === 'folds'
          ? alt(code, '1 < 2 < 3', '3 > 2 > 1', yes(false))
          : alt(code, '1 < 2 < 3', '1 < 2 && 2 < 3', yes(true))],
    });
  },
};

// ───────── 축 6 형 변환 ─────────

const mixIntFloat: ExprSpec = {
  id: 'mix-int-float', axis: 'conversion', machineId: 'cs/type-conversion',
  make: (d) => {
    const widen = d.implicitNumWiden;
    const { code, focus } = lift(
      d, { name: 'a', kind: 'int', lit: '1' }, (ref) => `${ref} + 2.0`, { name: 's', kind: widen ? 'float' : 'auto' },
    );
    return made({
      code, focus,
      target: { name: 's', declared: widen ? d.ty.float : '—' },
      expected: widen ? flt(fltText(d, '3')) : ERRORS.compile,
      fold: [
        step('1 + 2.0', `${d.ty.int} + ${d.ty.float}`),
        step(widen ? `${fltText(d, '1')} + 2.0` : 'compile error', widen ? `${d.ty.float} + ${d.ty.float}` : '타입이 안 맞는다'),
        step(valueText(widen ? flt(fltText(d, '3')) : ERRORS.compile), widen ? d.ty.float : '—'),
      ],
      variants: [alt(code, '+ 2.0', '+ 2', num(d, '3'))],
    });
  },
};

const truncFloat: ExprSpec = {
  id: 'trunc-float', axis: 'conversion', machineId: 'cs/type-conversion',
  skip: (d) => (d.toInt === null ? '실수를 정수로 깎는 식이 없다' : null),
  make: (d) => {
    const to = d.toInt ?? ((e: string) => e);
    const { code, focus } = lift(
      d, { name: 'x', kind: 'float', lit: '3.9' }, (ref) => to(ref), { name: 'n', kind: 'int' },
    );
    return made({
      code, focus,
      target: { name: 'n', declared: d.ty.int },
      expected: num(d, '3'),
      fold: [step(to('3.9'), `${d.ty.float} → ${d.ty.int}`), step('3', `${d.ty.int} — 반올림이 아니라 버리기`)],
      ideal: { t: 'int', v: '4' },
      variants: [alt(code, '3.9', '-3.9', num(d, '-3'))],
    });
  },
};

const strTimesInt: ExprSpec = {
  id: 'str-times-int', axis: 'conversion', machineId: 'cs/type-conversion',
  make: (d) => {
    const expected: FundValue = d.strTimesInt === 'repeat' ? str('55')
      : d.strTimesInt === 'numeric' ? num(d, '10') : ERRORS.compile;
    const kind: DeclKind = d.strTimesInt === 'repeat' ? 'text' : d.strTimesInt === 'numeric' ? 'int' : 'auto';
    const declared = d.strTimesInt === 'repeat' ? d.ty.text : d.strTimesInt === 'numeric' ? d.ty.int : '—';
    const code = [d.decl('r', kind, `${lit(d, '5')} * 2`)];
    return made({
      code,
      target: { name: 'r', declared },
      expected,
      fold: [step(`${lit(d, '5')} * 2`, `${d.ty.text} * ${d.ty.int}`), step(valueText(expected), declared)],
      variants: [alt(code, `${lit(d, '5')} * 2`, '5 * 2', num(d, '10'))],
    });
  },
};

// ───────── 축 7 대입 ─────────

const reassign: ExprSpec = {
  id: 'reassign', axis: 'assignment', machineId: 'cs/state',
  skip: (d) => (d.hasAssign ? null : SKIP_SQL_STMT),
  make: (d) => {
    const code = [d.declVar('n', 'int', '1'), d.assign('n', 'n + 1')];
    return made({
      code, focus: 1,
      target: { name: 'n', declared: d.ty.int },
      expected: num(d, '2'),
      fold: [step('n + 1', `${d.ty.int} + ${d.ty.int}`), step('2', `n 에 다시 붙는다`)],
      // 부호 하나만 뒤집으면 답이 0 이다 — 같은 자리에서 「무엇이 다시 붙었나」를 되묻는다.
      variants: [alt(code, 'n + 1', 'n - 1', num(d, '0'))],
    });
  },
};

const chainAssign: ExprSpec = {
  id: 'chain-assign', axis: 'assignment', machineId: 'cs/state',
  skip: (d) => (d.hasAssign ? null : SKIP_SQL_STMT),
  make: (d) => {
    const ok = d.assignChain !== 'none';
    const code = [d.declVar('b', 'int', '0'), d.declVar('a', ok ? 'int' : 'auto', 'b = 1')];
    return made({
      code, focus: 1,
      target: { name: 'a', declared: ok ? d.ty.int : '—' },
      expected: ok ? num(d, '1') : ERRORS.compile,
      fold: [
        step('b = 1', d.assignChain === 'expr' ? `대입이 값을 낸다 → ${d.ty.int}`
          : d.assignChain === 'chain' ? '대입을 이어 쓴다' : '대입은 값을 안 낸다'),
        step(ok ? '1' : 'compile error', ok ? d.ty.int : '—'),
      ],
    });
  },
};

const postInc: ExprSpec = {
  id: 'post-inc', axis: 'assignment', machineId: 'cs/state',
  skip: (d) => (d.hasAssign ? null : SKIP_SQL_STMT),
  make: (d) => {
    const ok = d.increment === 'expr';
    const code = [d.declVar('n', 'int', '1'), d.decl('m', ok ? 'int' : 'auto', 'n++')];
    return made({
      code, focus: 1,
      target: { name: 'm', declared: ok ? d.ty.int : '—' },
      expected: ok ? num(d, '1') : ERRORS.compile,
      fold: [
        step('n++', d.increment === 'expr' ? '먼저 값을 내고 그다음 늘린다'
          : d.increment === 'statement' ? '문장이라 값을 못 낸다' : '이 언어에는 `++` 가 없다'),
        step(ok ? '1' : 'compile error', ok ? d.ty.int : '—'),
      ],
      variants: ok ? [alt(code, 'n++', '++n', num(d, '2'))] : [],
    });
  },
};

// ───────── 축 8 비교 ─────────

const eqIntFloat: ExprSpec = {
  id: 'eq-int-float', axis: 'equality', machineId: 'cs/type-conversion',
  make: (d) => {
    const widen = d.implicitNumWiden;
    const code = d.lang === 'sql'
      ? [d.decl('same', 'bool', `1 ${d.spellEq} 1.0`)]
      : [d.decl('a', 'int', '1'), d.decl('b', 'float', '1.0'), d.decl('same', widen ? 'bool' : 'auto', `a ${d.spellEq} b`)];
    return made({
      code, focus: code.length - 1,
      target: { name: 'same', declared: widen ? d.ty.bool : '—' },
      expected: widen ? yes(true) : ERRORS.compile,
      fold: [
        step(`1 ${d.spellEq} 1.0`, `${d.ty.int} ${d.spellEq} ${d.ty.float}`),
        step(widen ? `${fltText(d, '1')} ${d.spellEq} ${fltText(d, '1')}` : 'compile error', widen ? d.ty.float : '타입이 안 맞는다'),
        step(widen ? d.spell.yes : 'compile error', widen ? d.ty.bool : '—'),
      ],
      variants: [alt(code, `${d.spellEq}`, '<', widen ? yes(false) : ERRORS.compile)],
    });
  },
};

/** 자바·파이썬은 상자를 캐시하고 C# 은 늘 새로 만든다. 나머지 일곱에는 이 자리가 없다. */
const BOXED: Partial<Record<FundLang, { code: string[]; expected: FundValue; alt: FundAlt }>> = {
  java: {
    code: ['Integer a = 128;', 'Integer b = 128;', 'boolean same = a == b;'],
    expected: ERRORS.unspecified,
    alt: {
      code: ['Integer a = 127;', 'Integer b = 127;', 'boolean same = a == b;'],
      from: '128', to: '127', value: { t: 'bool', v: true },
    },
  },
  py: {
    code: ['a = 128', 'b = 128', 'same = a is b'],
    expected: ERRORS.unspecified,
    alt: { code: ['a = 127', 'b = 127', 'same = a is b'], from: '128', to: '127', value: { t: 'bool', v: true } },
  },
  csharp: {
    code: ['object a = 128;', 'object b = 128;', 'bool same = a == b;'],
    expected: { t: 'bool', v: false },
    alt: {
      code: ['object a = 128;', 'object b = 128;', 'bool same = a.Equals(b);'],
      from: 'a == b', to: 'a.Equals(b)', value: { t: 'bool', v: true },
    },
  },
};

const boxedEq: ExprSpec = {
  id: 'boxed-eq', axis: 'equality', machineId: 'cs/identity-vs-equality',
  skip: (d) => (BOXED[d.lang] === undefined
    ? '원시값을 상자에 담는 자동 변환이 없다 — 128 은 어디서 봐도 같은 값이다'
    : null),
  make: (d) => {
    const b = BOXED[d.lang];
    if (b === undefined) throw new Error(`boxed-eq: ${d.lang} 은 skip 이어야 한다`);
    return made({
      code: [...b.code], focus: 2,
      target: { name: 'same', declared: d.ty.bool },
      expected: b.expected,
      fold: [
        step('128 → 상자', `${d.ty.int} → 상자`),
        step(d.boxing === 'cache' ? '캐시 범위 밖(-128~127)' : '늘 새 상자', '명세가 정하는 자리'),
        step(valueText(b.expected), d.ty.bool),
      ],
      // 「같은 언어 안의 다른 규칙」 — 127 이면 답이 정해진다. 이것이 `langAlt` 의 원형이다.
      langAlt: [b.alt],
    });
  },
};

/** 빈 값의 선언 한 벌. 언어마다 이름이 다를 뿐 규칙은 `nullEq` 한 열이 정한다. */
const NULL_DECL: Record<FundLang, readonly [string, string]> = {
  py: ['a = None', 'b = None'],
  c: ['const char* a = NULL;', 'const char* b = NULL;'],
  cpp: ['const char* a = nullptr;', 'const char* b = nullptr;'],
  java: ['String a = null;', 'String b = null;'],
  csharp: ['string a = null;', 'string b = null;'],
  ts: ['const a = null;', 'const b = null;'],
  sql: ['', ''],
  rs: ['let a: Option<i32> = None;', 'let b: Option<i32> = None;'],
  go: ['var a *int = nil', 'var b *int = nil'],
  swift: ['let a: Int? = nil', 'let b: Int? = nil'],
};

const nullEq: ExprSpec = {
  id: 'null-eq', axis: 'equality', machineId: 'cs/three-valued-logic',
  make: (d) => {
    const unknown = d.nullEq === 'unknown';
    const code = d.lang === 'sql'
      ? [`SELECT NULL ${d.spellEq} NULL AS same;`]
      : [...NULL_DECL[d.lang], d.decl('same', 'bool', `a ${d.spellEq} b`)];
    return made({
      code, focus: code.length - 1,
      target: { name: 'same', declared: unknown ? d.ty.bool : d.ty.bool },
      expected: unknown ? EVENTS.sqlNull : yes(true),
      fold: [
        step(`${d.spellNull} ${d.spellEq} ${d.spellNull}`, unknown ? '모름끼리는 견줄 수 없다' : '같은 빈 값'),
        step(unknown ? 'NULL' : d.spell.yes, unknown ? '삼값 논리' : d.ty.bool),
      ],
      // SQL 의 「같은 언어 안의 다른 규칙」 — `IS NULL` 은 삼값 논리를 빠져나온다.
      langAlt: unknown
        ? [{ code: [`SELECT NULL IS NULL AS same;`], from: `${d.spellEq} NULL`, to: 'IS NULL', value: num(d, '1') }]
        : [],
      variants: unknown ? [] : [alt(code, `a ${d.spellEq} b`, `a ${d.spellEq} ${lit(d, 'x')}`, yes(false))],
    });
  },
};

const looseEq: ExprSpec = {
  id: 'loose-eq', axis: 'equality', machineId: 'cs/type-conversion',
  make: (d) => {
    // 타입이 다른 둘을 `==` 로 견주면 — JS 만 조용히 맞추고, SQL 은 **안 맞춘다**(실측: 0).
    const expected: FundValue = d.lang === 'ts' ? yes(true)
      : d.lang === 'py' ? yes(false)
        : d.lang === 'sql' ? yes(false)
          : ERRORS.compile;
    const ok = expected.t === 'bool';
    const code = [d.decl('b', ok ? 'bool' : 'auto', `0 ${d.lang === 'sql' ? '=' : '=='} ${lit(d, '0')}`)];
    return made({
      code,
      target: { name: 'b', declared: ok ? d.ty.bool : '—' },
      expected,
      fold: [
        step(`0 == ${lit(d, '0')}`, `${d.ty.int} == ${d.ty.text}`),
        step(d.lang === 'ts' ? '0 == 0' : d.lang === 'sql' ? 'INTEGER 와 TEXT 는 다른 저장 종류' : valueText(expected),
          d.lang === 'ts' ? '글을 수로 바꾼 뒤' : '—'),
        step(valueText(expected), ok ? d.ty.bool : '—'),
      ],
      // JS 의 대표 오답은 다른 언어의 값이 아니라 **한 글자 더 쓴 판**이다.
      variants: d.lang === 'ts' ? [alt(code, '0 == ', '0 === ', yes(false))] : [],
    });
  },
};

const nullNotIn: ExprSpec = {
  id: 'null-not-in', axis: 'equality', machineId: 'cs/three-valued-logic',
  skip: (d) => (d.lang === 'sql'
    ? null
    : '값 하나가 아니라 집합을 묻는 식이라 나머지 아홉에는 대응하는 자리가 없다'),
  make: (d) => {
    const code = ['SELECT 3 NOT IN (1, 2, NULL) AS b;'];
    return made({
      code,
      target: { name: 'b', declared: d.ty.bool },
      expected: EVENTS.sqlNull,
      fold: [
        step('3 <> 1 AND 3 <> 2 AND 3 <> NULL', 'NOT IN 은 이 사슬이다'),
        step('1 AND 1 AND NULL', '삼값 논리'),
        step('NULL', '참도 거짓도 아니다'),
      ],
      ideal: num(d, '1'),
      // NULL 을 빼면 답이 정해진다. 목록의 길이가 아니라 **모름 하나**가 답을 지웠다.
      variants: [alt(code, ', NULL', '', num(d, '1'))],
      // 같은 물음을 `NOT EXISTS` 로 쓰면 삼값 논리를 빠져나온다 — 같은 언어 안의 다른 규칙.
      langAlt: [{
        code: ['SELECT NOT EXISTS (', '  SELECT 1 FROM (SELECT 1 AS v UNION ALL SELECT 2 UNION ALL SELECT NULL) t', '  WHERE t.v = 3', ') AS b;'],
        from: 'NOT IN', to: 'NOT EXISTS', value: num(d, '1'),
      }],
    });
  },
};

/**
 * 스물일곱 식. 축마다 셋 이상이고, 축 1 과 축 8 이 넷·다섯인 것은 그 축에서 열 언어가
 * 가장 크게 갈리기 때문이다 (문서 §4).
 */
export const CATALOG: readonly ExprSpec[] = [
  intDiv, modNeg, intOverflow, shift31,
  floatAdd, floatDivZero, floatEq,
  textLen, strPlusNum, textIndex,
  notZero, boolPlusBool, eqLiteral,
  precMulAdd, precShiftAdd, precCmpChain,
  mixIntFloat, truncFloat, strTimesInt,
  reassign, chainAssign, postInc,
  eqIntFloat, boxedEq, nullEq, looseEq, nullNotIn,
];
