/**
 * 열 언어의 **기계 규칙 표** (`docs/program/fundamentals.md` §3.3).
 *
 * 이 파일이 드는 것은 값이 아니라 **규칙**이다. 「`7 / 2` 가 3 이다」는 카탈로그
 * (`fundamentals-catalog.ts`)가 이 표를 읽어 계산하고, 오답 진단도 같은 표에서 나온다 —
 * 문항을 만드는 쪽과 진단하는 쪽이 같은 표를 본다.
 *
 * 열을 늘린 이유(2026-09-05): 식이 넷일 때는 `intDiv`·`modSign`·`overflow` 셋으로 넉넉했다.
 * 0부 축 여덟에 식 셋씩을 걸면 「무엇이 참으로 쳐지나」·「문자열 길이를 무엇으로 세나」·
 * 「`<<` 가 `+` 보다 먼저 묶이나」가 전부 필요하고, 그것을 식마다 `switch (lang)` 로 적으면
 * 같은 사실이 스물일곱 군데에 흩어진다. **한 행을 고치면 스물일곱 식이 같이 움직이는 것**이
 * 이 표의 값이다.
 */

/** D156 이 고른 열 언어의 사전 네임스페이스. `csharp` 은 `cs/`(기계 개념)가 아니다. */
export type FundLang = 'py' | 'c' | 'cpp' | 'java' | 'csharp' | 'ts' | 'sql' | 'rs' | 'go' | 'swift';

export const FUND_LANGS: readonly FundLang[] = [
  'py', 'c', 'cpp', 'java', 'csharp', 'ts', 'sql', 'rs', 'go', 'swift',
];

/**
 * 답 하나. **문자열로 든다** — 숫자로 들면 `int` 와 `float` 이 자바스크립트에서 한 타입이라
 * 「3 과 3.0 은 다른 답인가」를 표현할 수 없다. 정수는 십진 문자열, 실수는 왕복하는 최단
 * 십진 표기(`String(x)`)다.
 *
 * 뒤의 셋은 **「답이 있다」는 전제를 깨는 답**이다 (D187 · 문서 §13). 이것이 없으면
 * 자바의 `Integer` 캐시 밖·Go 의 상수 넘침·C 의 미정의 동작이 전부 `unknown` 오답으로
 * 떨어지고, 앱이 「모른다」를 못 가르친다.
 */
export type FundValue =
  | { t: 'int'; v: string }
  | { t: 'float'; v: string }
  | { t: 'bool'; v: boolean }
  | { t: 'string'; v: string }
  /** 값이 아니라 **사건**이 일어난다 — 예외·패닉·미정의 동작. `accept` 는 인정하는 표기. */
  | { t: 'event'; name: string; accept: readonly string[] }
  /** 그 언어에서 이 식은 **아예 안 선다.** 컴파일러가 먼저 막는다. */
  | { t: 'compile-error'; name: string; accept: readonly string[] }
  /** 명세가 답을 **안 정한다.** 자바 `Integer` 캐시 밖(JLS 5.1.7) · 구현이 정하는 자리. */
  | { t: 'unspecified'; name: string; accept: readonly string[] };

/** 값 하나를 사람이 읽는 글자로. 걸음(`FoldStep.code`)과 화면이 같은 글자를 쓴다. */
export const valueText = (v: FundValue): string => {
  switch (v.t) {
    case 'event': case 'compile-error': case 'unspecified': return v.name;
    case 'bool': return String(v.v);
    default: return v.v;
  }
};

/**
 * 기계가 밟은 한 걸음. **산문이 없다** — 오답 진단이 i18n 카탈로그를 안 타고 이 배열만으로
 * 서게 하려는 것이다. 읽히는 것은 「무엇이 무엇으로 접혔나」와 「그때 타입이 무엇이었나」다.
 */
export interface FoldStep {
  code: string;
  type: string;
}

/** 정수 오버플로가 일어나면 그 언어가 하는 일. */
export type OverflowRule = 'wrap' | 'trap' | 'undefined' | 'bignum' | 'double';

/** 사건 값 하나. `accept` 에 한국어를 넣지 않는다 — 이름은 그 언어의 것이다. */
export const event = (name: string, ...alias: string[]): FundValue =>
  ({ t: 'event', name, accept: [name, ...alias] });

/**
 * 「답이 없다」 둘. 이름은 영어이고 그 자리에 뜨는 **화면 문구는 i18n 이 댄다** —
 * 여기 있는 글자는 채점기가 견주는 인정 표기이지 화면에 그대로 쓰는 문장이 아니다.
 * 학습자가 자기 말로 적으므로 한국어 표기를 인정 목록에만 둔다.
 */
export const ERRORS: Readonly<Record<'compile' | 'unspecified', FundValue>> = {
  compile: {
    t: 'compile-error',
    name: 'compile error',
    accept: ['compile error', 'compile-error', 'does not compile', 'syntax error', '컴파일 오류', '컴파일 에러'],
  },
  unspecified: {
    t: 'unspecified',
    name: 'unspecified',
    accept: ['unspecified', 'implementation-defined', 'undefined', 'not specified', '미정', '정해져 있지 않다'],
  },
};

/** 사건 값 셋. 오버플로가 값을 안 내는 언어들이 쓴다. */
export const EVENTS: Readonly<Record<'undefined' | 'trap' | 'divZero' | 'typeError' | 'sqlNull', FundValue>> = {
  undefined: event('undefined behavior', 'UB', 'undefined'),
  trap: event('panic', 'trap', 'crash', 'overflow'),
  divZero: event('ZeroDivisionError', 'division by zero', 'zero division'),
  typeError: event('TypeError', 'type error'),
  sqlNull: event('NULL', 'null'),
};

/**
 * 언어 하나의 기계 규칙. `verified` 는 이 행의 값을 무엇으로 확인했나다 — `measured` 는
 * 이 저장소에서 실제로 돌려 봤다는 뜻이고, `spec` 은 언어 명세를 읽고 적었다는 뜻이다.
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
  ty: { int: string; float: string; bool: string; text: string };
  /** 한 줄 선언을 그 언어의 모양으로. */
  decl: (name: string, kind: DeclKind, expr: string) => string;
  /** **다시 대입할 수 있는** 선언. `const` 로 굳는 언어(ts)와 `mut` 이 필요한 언어(rs)만 다르다. */
  declVar: (name: string, kind: DeclKind, expr: string) => string;
  /** 선언 없는 대입 한 줄. 축 7 이 이것으로 「이름에 붙는 것이 값인가 자리인가」를 묻는다. */
  assign: (name: string, expr: string) => string;
  /** 같음을 묻는 연산자. SQL 은 `=` 하나고 TS 는 `===` 가 정본이다. */
  spellEq: string;
  verified: 'measured' | 'spec';

  // ── 축 1 정수 ──
  /** 시프트가 접히는 폭. `null` = 안 접힌다(파이썬). **ts 는 정수 타입이 없는데 32다** — 비트
   * 연산만 int32 로 내려간다. 그 한 칸이 이 표가 잡는 가장 큰 함정이다. */
  shiftBits: 32 | 64 | null;

  // ── 축 3 문자 ──
  /** 문자열 길이를 무엇으로 세나. */
  textUnit: 'utf16' | 'byte' | 'codepoint' | 'grapheme';
  /** 길이 식을 그 언어의 모양으로. */
  len: (expr: string) => string;
  /** 글자 하나 집기. `null` = 정수로 색인이 안 된다(스위프트). */
  index: ((name: string, i: number) => string) | null;
  /** 집은 것이 무엇인가 — 글자인가(`char`·`string`), 바이트인가(`byte`). */
  indexYields: 'char' | 'string' | 'byte' | 'none';
  /** 문자열에 수를 더하면 — 이어 붙나 · 수로 바꾸나 · 오류인가 · 포인터 셈이 되나. */
  strPlusNum: 'concat' | 'numeric' | 'compile-error' | 'runtime-error' | 'ptr';
  /** 문자열에 수를 곱하면 — 되풀이하나(파이썬) · 수로 바꾸나 · 오류인가. */
  strTimesInt: 'repeat' | 'numeric' | 'compile-error';

  // ── 축 4 참거짓 ──
  /** 단항 부정의 표기. */
  spellNot: string;
  /** `!0` 이 무엇이 되나 — 참(`bool`) · 1(`int`) · 비트 뒤집기(`bitwise`) · 오류(`none`). */
  unaryNot: 'bool' | 'int' | 'bitwise' | 'none';
  /** 참·거짓을 수처럼 더할 수 있나. */
  boolArith: boolean;

  // ── 축 5 연산자 ──
  /** `<<` 가 `+` 보다 먼저 묶이나. Go·Swift 만 그렇다. */
  shiftBindsTighter: boolean;
  /** 비교를 이어 쓰면 — 파이썬처럼 사슬인가 · 왼쪽부터 접히나 · 오류인가. */
  chainCompare: 'chained' | 'folds' | 'error';

  // ── 축 6 형 변환 ──
  /** 정수와 실수를 섞으면 조용히 넓히나. 거짓이면 컴파일이 막는다. */
  implicitNumWiden: boolean;
  /** 실수를 정수로 깎는 식. `null` = 없다. */
  toInt: ((expr: string) => string) | null;

  // ── 축 7 대입 ──
  /** 대입이 이 언어에 있나. SQL 만 없다. */
  hasAssign: boolean;
  /** `a = b = 1` 이 서나 — 값을 내는 식인가(`expr`) · 이어 쓰기만 되나(`chain`) · 안 서나. */
  assignChain: 'expr' | 'chain' | 'none';
  /** `n++` 가 있나 — 값을 내는 식인가 · 문장뿐인가(Go) · 없나. */
  increment: 'expr' | 'statement' | 'none';

  // ── 축 8 비교 ──
  /** 원시값을 상자에 넣는 자동 변환 — 캐시가 있나(java·py) · 늘 새 상자인가(csharp) · 없나. */
  boxing: 'cache' | 'reference' | 'none';
  /** 빈 값의 표기. */
  spellNull: string;
  /** 빈 값 둘을 견주면 — 참인가, 모름인가. SQL 만 모름이다. */
  nullEq: 'true' | 'unknown';
}

/** 선언의 종류. 판의 라벨(`target.declared`)이 이 값으로 정해진다. */
export type DeclKind = 'int' | 'float' | 'bool' | 'text' | 'char' | 'auto';

const pick = (k: DeclKind, t: Record<Exclude<DeclKind, 'auto'>, string>, auto: string): string =>
  (k === 'auto' ? auto : t[k]);

const cTy = (k: DeclKind): string =>
  pick(k, { int: 'int', float: 'double', bool: 'bool', text: 'const char*', char: 'char' }, 'auto');

/** `int a = 7 / 2;` 꼴 — C 계열 넷이 같은 모양이다. */
const cStyle = (n: string, k: DeclKind, e: string): string => `${cTy(k)} ${n} = ${e};`;

/** C++ 는 글 자리만 다르다 — `const char*` 가 아니라 `std::string` 이다. */
const cppStyle = (n: string, k: DeclKind, e: string): string =>
  `${k === 'text' ? 'std::string' : cTy(k)} ${n} = ${e};`;

/** 단항 부정을 붙인다 — `not 0` 은 사이가 벌고 `!0` 은 안 벌어진다. */
export const notExpr = (d: FundDialect, x: string): string =>
  (/^[a-zA-Z]/u.test(d.spellNot) ? `${d.spellNot} ${x}` : `${d.spellNot}${x}`);

const javaTy = (k: DeclKind): string =>
  pick(k, { int: 'int', float: 'double', bool: 'boolean', text: 'String', char: 'char' }, 'var');
const javaStyle = (n: string, k: DeclKind, e: string): string => `${javaTy(k)} ${n} = ${e};`;

const csTy = (k: DeclKind): string =>
  pick(k, { int: 'int', float: 'double', bool: 'bool', text: 'string', char: 'char' }, 'var');
const csStyle = (n: string, k: DeclKind, e: string): string => `${csTy(k)} ${n} = ${e};`;

const rsTy = (k: DeclKind): string =>
  pick(k, { int: 'i32', float: 'f64', bool: 'bool', text: '&str', char: '&str' }, '_');
const swTy = (k: DeclKind): string =>
  pick(k, { int: 'Int', float: 'Double', bool: 'Bool', text: 'String', char: 'Character' }, '_');
const goTy = (k: DeclKind): string =>
  pick(k, { int: 'int', float: 'float64', bool: 'bool', text: 'string', char: 'byte' }, '');

/**
 * 열 언어의 기계 규칙.
 *
 * **`measured` 인 행은 셋뿐이다** — `ts`(이 저장소의 node) · `sql`(설치된 `sqlite3` 3.x) ·
 * `py`(규칙이 IEEE-754 와 floor 나눗셈이라 node 로 재현). 나머지 **일곱 중 둘**(csharp ·
 * swift)은 I5 가 .NET 10.0.302 · Swift 6.3.3 으로 실측했고 그 결과가 이 표에 들어와 있지만
 * **이 표를 그 툴체인으로 다시 돌린 것은 아니라 `spec` 으로 남긴다.** 남은 다섯
 * (c · cpp · java · rs · go)은 명세를 읽고 적은 것이고 착수 전에 실측이 필요하다(문서 §10).
 */
export const FUND_DIALECTS: Readonly<Record<FundLang, FundDialect>> = {
  py: {
    lang: 'py', name: 'Python', intBits: null, intDiv: 'double', modSign: 'floored',
    overflow: 'bignum', spell: { yes: 'True', no: 'False' },
    ty: { int: 'int', float: 'float', bool: 'bool', text: 'str' },
    decl: (n, _k, e) => `${n} = ${e}`,
    declVar: (n, _k, e) => `${n} = ${e}`, assign: (n, e) => `${n} = ${e}`, spellEq: '==',
    verified: 'measured',
    shiftBits: null,
    textUnit: 'codepoint', len: (e) => `len(${e})`, index: (n, i) => `${n}[${String(i)}]`,
    indexYields: 'string', strPlusNum: 'runtime-error', strTimesInt: 'repeat',
    spellNot: 'not', unaryNot: 'bool', boolArith: true,
    shiftBindsTighter: false, chainCompare: 'chained',
    implicitNumWiden: true, toInt: (e) => `int(${e})`,
    hasAssign: true, assignChain: 'chain', increment: 'none',
    boxing: 'cache', spellNull: 'None', nullEq: 'true',
  },
  c: {
    lang: 'c', name: 'C', intBits: 32, intDiv: 'trunc', modSign: 'truncated',
    overflow: 'undefined', spell: { yes: 'true', no: 'false' },
    ty: { int: 'int', float: 'double', bool: 'bool', text: 'const char*' },
    decl: cStyle,
    declVar: cStyle, assign: (n, e) => `${n} = ${e};`, spellEq: '==',
    verified: 'spec',
    shiftBits: 32,
    textUnit: 'byte', len: (e) => `strlen(${e})`, index: (n, i) => `${n}[${String(i)}]`,
    indexYields: 'char', strPlusNum: 'ptr', strTimesInt: 'compile-error',
    spellNot: '!', unaryNot: 'int', boolArith: true,
    shiftBindsTighter: false, chainCompare: 'folds',
    implicitNumWiden: true, toInt: (e) => `(int) ${e}`,
    hasAssign: true, assignChain: 'expr', increment: 'expr',
    boxing: 'none', spellNull: 'NULL', nullEq: 'true',
  },
  cpp: {
    lang: 'cpp', name: 'C++', intBits: 32, intDiv: 'trunc', modSign: 'truncated',
    overflow: 'undefined', spell: { yes: 'true', no: 'false' },
    ty: { int: 'int', float: 'double', bool: 'bool', text: 'std::string' },
    decl: cppStyle,
    declVar: cppStyle, assign: (n, e) => `${n} = ${e};`, spellEq: '==',
    verified: 'spec',
    shiftBits: 32,
    textUnit: 'byte', len: (e) => `${e}.size()`, index: (n, i) => `${n}[${String(i)}]`,
    indexYields: 'char', strPlusNum: 'ptr', strTimesInt: 'compile-error',
    spellNot: '!', unaryNot: 'bool', boolArith: true,
    shiftBindsTighter: false, chainCompare: 'folds',
    implicitNumWiden: true, toInt: (e) => `(int) ${e}`,
    hasAssign: true, assignChain: 'expr', increment: 'expr',
    boxing: 'none', spellNull: 'nullptr', nullEq: 'true',
  },
  java: {
    lang: 'java', name: 'Java', intBits: 32, intDiv: 'trunc', modSign: 'truncated',
    overflow: 'wrap', spell: { yes: 'true', no: 'false' },
    ty: { int: 'int', float: 'double', bool: 'boolean', text: 'String' },
    decl: javaStyle,
    declVar: javaStyle, assign: (n, e) => `${n} = ${e};`, spellEq: '==',
    verified: 'spec',
    shiftBits: 32,
    textUnit: 'utf16', len: (e) => `${e}.length()`, index: (n, i) => `${n}.charAt(${String(i)})`,
    indexYields: 'char', strPlusNum: 'concat', strTimesInt: 'compile-error',
    spellNot: '!', unaryNot: 'none', boolArith: false,
    shiftBindsTighter: false, chainCompare: 'error',
    implicitNumWiden: true, toInt: (e) => `(int) ${e}`,
    hasAssign: true, assignChain: 'expr', increment: 'expr',
    boxing: 'cache', spellNull: 'null', nullEq: 'true',
  },
  csharp: {
    lang: 'csharp', name: 'C#', intBits: 32, intDiv: 'trunc', modSign: 'truncated',
    overflow: 'wrap', spell: { yes: 'true', no: 'false' },
    ty: { int: 'int', float: 'double', bool: 'bool', text: 'string' },
    decl: csStyle,
    declVar: csStyle, assign: (n, e) => `${n} = ${e};`, spellEq: '==',
    verified: 'spec',
    shiftBits: 32,
    textUnit: 'utf16', len: (e) => `${e}.Length`, index: (n, i) => `${n}[${String(i)}]`,
    indexYields: 'char', strPlusNum: 'concat', strTimesInt: 'compile-error',
    spellNot: '!', unaryNot: 'none', boolArith: false,
    shiftBindsTighter: false, chainCompare: 'error',
    implicitNumWiden: true, toInt: (e) => `(int) ${e}`,
    hasAssign: true, assignChain: 'expr', increment: 'expr',
    boxing: 'reference', spellNull: 'null', nullEq: 'true',
  },
  ts: {
    lang: 'ts', name: 'TypeScript', intBits: null, intDiv: 'double', modSign: 'truncated',
    overflow: 'double', spell: { yes: 'true', no: 'false' },
    ty: { int: 'number', float: 'number', bool: 'boolean', text: 'string' },
    decl: (n, _k, e) => `const ${n} = ${e};`,
    declVar: (n, _k, e) => `let ${n} = ${e};`, assign: (n, e) => `${n} = ${e};`, spellEq: '===',
    verified: 'measured',
    // 수는 double 하나뿐인데 **비트 연산만 int32 로 내려간다**. 이 한 칸이 `1 << 31` 의 답을
    // 파이썬(2147483648)과 갈라 놓는다 — 실측했다.
    shiftBits: 32,
    textUnit: 'utf16', len: (e) => `${e}.length`, index: (n, i) => `${n}[${String(i)}]`,
    indexYields: 'string', strPlusNum: 'concat', strTimesInt: 'numeric',
    spellNot: '!', unaryNot: 'bool', boolArith: true,
    shiftBindsTighter: false, chainCompare: 'folds',
    implicitNumWiden: true, toInt: (e) => `Math.trunc(${e})`,
    hasAssign: true, assignChain: 'expr', increment: 'expr',
    boxing: 'none', spellNull: 'null', nullEq: 'true',
  },
  sql: {
    lang: 'sql', name: 'SQL (SQLite)', intBits: 64, intDiv: 'trunc', modSign: 'truncated',
    overflow: 'bignum', spell: { yes: '1', no: '0' },
    ty: { int: 'INTEGER', float: 'REAL', bool: 'INTEGER', text: 'TEXT' },
    decl: (n, _k, e) => `SELECT ${e} AS ${n};`,
    declVar: (n, _k, e) => `SELECT ${e} AS ${n};`, assign: (n, e) => `SELECT ${e} AS ${n};`, spellEq: '=',
    verified: 'measured',
    shiftBits: 64,
    textUnit: 'codepoint', len: (e) => `length(${e})`, index: (n, i) => `substr(${n}, ${String(i + 1)}, 1)`,
    indexYields: 'string', strPlusNum: 'numeric', strTimesInt: 'numeric',
    spellNot: 'NOT', unaryNot: 'int', boolArith: true,
    shiftBindsTighter: false, chainCompare: 'folds',
    implicitNumWiden: true, toInt: (e) => `CAST(${e} AS INTEGER)`,
    hasAssign: false, assignChain: 'none', increment: 'none',
    boxing: 'none', spellNull: 'NULL', nullEq: 'unknown',
  },
  rs: {
    lang: 'rs', name: 'Rust', intBits: 32, intDiv: 'trunc', modSign: 'truncated',
    overflow: 'trap', spell: { yes: 'true', no: 'false' },
    ty: { int: 'i32', float: 'f64', bool: 'bool', text: '&str' },
    decl: (n, k, e) => (k === 'auto' ? `let ${n} = ${e};` : `let ${n}: ${rsTy(k)} = ${e};`),
    declVar: (n, k, e) => (k === 'auto' ? `let mut ${n} = ${e};` : `let mut ${n}: ${rsTy(k)} = ${e};`), assign: (n, e) => `${n} = ${e};`, spellEq: '==',
    verified: 'spec',
    shiftBits: 32,
    textUnit: 'byte', len: (e) => `${e}.len()`, index: (n, i) => `&${n}[${String(i)}..${String(i + 1)}]`,
    indexYields: 'string', strPlusNum: 'compile-error', strTimesInt: 'compile-error',
    // `!` 는 러스트에서 **비트 뒤집기**다. 정수에 걸면 `-1` 이 나오지 컴파일이 안 막는다.
    spellNot: '!', unaryNot: 'bitwise', boolArith: false,
    shiftBindsTighter: false, chainCompare: 'error',
    implicitNumWiden: false, toInt: (e) => `${e} as i32`,
    hasAssign: true, assignChain: 'none', increment: 'none',
    boxing: 'none', spellNull: 'None', nullEq: 'true',
  },
  go: {
    lang: 'go', name: 'Go', intBits: 64, intDiv: 'trunc', modSign: 'truncated',
    overflow: 'wrap', spell: { yes: 'true', no: 'false' },
    ty: { int: 'int', float: 'float64', bool: 'bool', text: 'string' },
    decl: (n, k, e) => (k === 'auto' ? `${n} := ${e}` : `var ${n} ${goTy(k)} = ${e}`),
    declVar: (n, k, e) => (k === 'auto' ? `${n} := ${e}` : `var ${n} ${goTy(k)} = ${e}`), assign: (n, e) => `${n} = ${e}`, spellEq: '==',
    verified: 'spec',
    shiftBits: 64,
    textUnit: 'byte', len: (e) => `len(${e})`, index: (n, i) => `${n}[${String(i)}]`,
    indexYields: 'byte', strPlusNum: 'compile-error', strTimesInt: 'compile-error',
    spellNot: '!', unaryNot: 'none', boolArith: false,
    // Go 는 `<<` 를 `*` 와 같은 층에 둔다 — `1 + 2 << 3` 이 24 가 아니라 17 이다.
    shiftBindsTighter: true, chainCompare: 'error',
    implicitNumWiden: false, toInt: (e) => `int(${e})`,
    hasAssign: true, assignChain: 'none', increment: 'statement',
    boxing: 'none', spellNull: 'nil', nullEq: 'true',
  },
  swift: {
    lang: 'swift', name: 'Swift', intBits: 64, intDiv: 'trunc', modSign: 'truncated',
    overflow: 'trap', spell: { yes: 'true', no: 'false' },
    ty: { int: 'Int', float: 'Double', bool: 'Bool', text: 'String' },
    decl: (n, k, e) => (k === 'auto' ? `let ${n} = ${e}` : `let ${n}: ${swTy(k)} = ${e}`),
    declVar: (n, k, e) => (k === 'auto' ? `var ${n} = ${e}` : `var ${n}: ${swTy(k)} = ${e}`), assign: (n, e) => `${n} = ${e}`, spellEq: '==',
    verified: 'spec',
    shiftBits: 64,
    textUnit: 'grapheme', len: (e) => `${e}.count`, index: null,
    indexYields: 'none', strPlusNum: 'compile-error', strTimesInt: 'compile-error',
    spellNot: '!', unaryNot: 'none', boolArith: false,
    shiftBindsTighter: true, chainCompare: 'error',
    implicitNumWiden: false, toInt: (e) => `Int(${e})`,
    hasAssign: true, assignChain: 'none', increment: 'none',
    boxing: 'none', spellNull: 'nil', nullEq: 'true',
  },
};
