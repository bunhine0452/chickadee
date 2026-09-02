/**
 * 한 줄 토크나이저 — 04 §4.2.
 *
 * `id [A-Za-z_$][\w$]*` · `num` · `str`/`tpl` · `op`(2~3자 연산자 우선) · `punct` · `cmt` · `ws`.
 * **목업과 다름**: 목업의 `\S` 단일 토큰은 `?.` 를 `?` + `.` 로 쪼개 `? .`(공백 삽입)을 동등으로
 * 봤다. 여기서는 다중문자 연산자를 **먼저 그리디로** 잡아 `?.` 를 한 토큰으로 유지한다.
 * 문자열 안의 `//` 는 `str` 토큰 안에 남는다(줄 끝 주석 제거 단계의 전제, §4.2 3번).
 *
 * 입력은 **한 줄**이다(개행 없음). 줄에서 닫히지 않은 문자열·템플릿·블록 주석은 줄 끝까지를
 * 그 토큰으로 본다. 정규식 리터럴은 별도 종류가 없으므로(§0 `Tok.k` 고정) 나누어 토큰화된다.
 */

export type TokKind = 'id' | 'kw' | 'num' | 'str' | 'tpl' | 'op' | 'punct' | 'cmt' | 'ws';

/** 04 §0 그대로. `col` 은 0부터 세는 시작 열. */
export interface Tok {
  k: TokKind;
  t: string;
  col: number;
}

/** JS/TS 예약어 · 문맥 키워드 · 내장 타입 이름. `id` 매치가 여기 있으면 `kw` 다. */
export const KEYWORDS: ReadonlySet<string> = new Set([
  // ECMAScript 예약어
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
  'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import',
  'in', 'instanceof', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try',
  'typeof', 'var', 'void', 'while', 'with',
  // strict / 문맥 예약어
  'as', 'async', 'await', 'from', 'get', 'implements', 'let', 'of', 'package', 'private',
  'protected', 'public', 'set', 'static', 'yield',
  // TypeScript
  'abstract', 'accessor', 'any', 'asserts', 'bigint', 'boolean', 'declare', 'infer', 'interface',
  'is', 'keyof', 'module', 'namespace', 'never', 'number', 'object', 'out', 'override', 'readonly',
  'require', 'satisfies', 'string', 'symbol', 'type', 'undefined', 'unique', 'unknown', 'using',
]);

/** 긴 것부터 — 그리디 매치의 전제. */
const OPERATORS: readonly string[] = [
  '>>>=',
  '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??=',
  '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--',
  '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '**', '<<', '>>',
  '+', '-', '*', '/', '%', '=', '<', '>', '!', '&', '|', '^', '~', '?',
];

const NUMBER = /0[xX][0-9a-fA-F][0-9a-fA-F_]*n?|0[bB][01][01_]*n?|0[oO][0-7][0-7_]*n?|(?:\d[\d_]*)?\.\d[\d_]*(?:[eE][+-]?\d[\d_]*)?|\d[\d_]*(?:\.[\d_]*)?(?:[eE][+-]?\d[\d_]*)?n?/y;

function isSpace(c: string): boolean {
  return c === ' ' || c === '\t' || c === '\f' || c === '\v' || c === '\u00a0' || c === '\ufeff';
}

function isDigit(c: string): boolean {
  return c >= '0' && c <= '9';
}

function isIdStart(c: string): boolean {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_' || c === '$';
}

function isIdPart(c: string): boolean {
  return isIdStart(c) || isDigit(c);
}

/** `'…'` · `"…"` 끝 다음 위치. 닫히지 않으면 줄 끝. */
function scanQuoted(line: string, start: number, quote: string): number {
  let i = start + 1;
  while (i < line.length) {
    const c = line.charAt(i);
    if (c === '\\') {
      i += 2;
      continue;
    }
    if (c === quote) return i + 1;
    i += 1;
  }
  return line.length;
}

/** 템플릿 리터럴 끝 다음 위치. `${…}` 안의 중괄호·문자열·중첩 템플릿을 건너뛴다. */
function scanTemplate(line: string, start: number): number {
  let i = start + 1;
  while (i < line.length) {
    const c = line.charAt(i);
    if (c === '\\') {
      i += 2;
      continue;
    }
    if (c === '`') return i + 1;
    if (c === '$' && line.charAt(i + 1) === '{') {
      i = scanInterpolation(line, i + 2);
      continue;
    }
    i += 1;
  }
  return line.length;
}

/** `${` 다음부터 짝이 맞는 `}` 다음 위치. */
function scanInterpolation(line: string, start: number): number {
  let depth = 1;
  let i = start;
  while (i < line.length) {
    const c = line.charAt(i);
    if (c === '\\') {
      i += 2;
      continue;
    }
    if (c === '"' || c === "'") {
      i = scanQuoted(line, i, c);
      continue;
    }
    if (c === '`') {
      i = scanTemplate(line, i);
      continue;
    }
    if (c === '{') depth += 1;
    if (c === '}') {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
    i += 1;
  }
  return line.length;
}

function scanNumber(line: string, start: number): number {
  NUMBER.lastIndex = start;
  const m = NUMBER.exec(line);
  return m === null ? start + 1 : start + m[0].length;
}

/** 다중문자 우선. `a ? .5 : b` 의 `?` 는 `?.` 로 붙이지 않는다. */
function matchOperator(line: string, start: number): string | null {
  for (const op of OPERATORS) {
    if (!line.startsWith(op, start)) continue;
    if (op === '?.' && isDigit(line.charAt(start + 2))) continue;
    return op;
  }
  return null;
}

export function tokenize(line: string): Tok[] {
  const out: Tok[] = [];
  const push = (k: TokKind, col: number, end: number): void => {
    out.push({ k, t: line.slice(col, end), col });
  };

  let i = 0;
  while (i < line.length) {
    const col = i;
    const c = line.charAt(i);

    if (isSpace(c)) {
      while (i < line.length && isSpace(line.charAt(i))) i += 1;
      push('ws', col, i);
      continue;
    }

    if (c === '/' && line.charAt(i + 1) === '/') {
      i = line.length;
      push('cmt', col, i);
      continue;
    }

    if (c === '/' && line.charAt(i + 1) === '*') {
      const end = line.indexOf('*/', i + 2);
      i = end === -1 ? line.length : end + 2;
      push('cmt', col, i);
      continue;
    }

    if (c === '"' || c === "'") {
      i = scanQuoted(line, i, c);
      push('str', col, i);
      continue;
    }

    if (c === '`') {
      i = scanTemplate(line, i);
      push('tpl', col, i);
      continue;
    }

    if (isDigit(c) || (c === '.' && isDigit(line.charAt(i + 1)))) {
      i = scanNumber(line, i);
      push('num', col, i);
      continue;
    }

    if (isIdStart(c)) {
      i += 1;
      while (i < line.length && isIdPart(line.charAt(i))) i += 1;
      push(KEYWORDS.has(line.slice(col, i)) ? 'kw' : 'id', col, i);
      continue;
    }

    const op = matchOperator(line, i);
    if (op !== null) {
      i += op.length;
      push('op', col, i);
      continue;
    }

    // `( ) [ ] { } , ; : .` 등 나머지 한 글자
    i += 1;
    push('punct', col, i);
  }

  return out;
}
