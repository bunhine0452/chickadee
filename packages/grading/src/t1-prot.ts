/**
 * PROT — 치환할 수 없는 이름 (04 §4.4).
 *
 * 「지역 변수명을 일관되게 바꾼 것은 같은 뜻」이라는 규칙이 성립하려면 **바꿀 수 없는 이름**을
 * 먼저 알아야 한다. 속성 이름(`.value`)이나 import 한 이름(`useState`)을 바꾸면 그것은
 * 다른 코드다 — 그런데 토큰만 보면 둘 다 그냥 식별자라 구별이 안 된다.
 *
 * AST 없이 **줄 텍스트에서** 집는다. 이유는 두 가지다: 거터 판정(05 §8 — 줄을 벗어날 때마다)
 * 은 AST 를 부를 수 없고, 언어 폴백(04 §4.5 — `parse_langs` 에 없는 문법)에서도 이 집합이
 * 필요하다. 그래서 여기 있는 것은 **보수적인 근사**이고, 놓치는 쪽(치환을 허용)보다 과하게
 * 잡는 쪽(치환을 금지)으로 기울여 뒀다 — 과하면 「어긋남」이 되어 이의를 붙일 수 있지만,
 * 놓치면 `submit(password, email)` 같은 스왑이 조용히 통과한다.
 */
import { KEYWORDS, tokenize, type Tok } from '@chickadee/text';

/** 04 §4.4 의 언어 내장. 문법별로 나눠 두고 없는 문법은 공통만 쓴다. */
export const BUILTINS: Readonly<Record<string, readonly string[]>> = {
  typescript: [
    'console', 'Promise', 'Array', 'Object', 'JSON', 'Math', 'window', 'document',
    'undefined', 'NaN', 'Infinity', 'Number', 'String', 'Boolean', 'Symbol', 'Map', 'Set',
  ],
  python: [
    'print', 'len', 'range', 'dict', 'list', 'set', 'tuple', 'str', 'int', 'float', 'bool',
    'None', 'True', 'False', 'self', 'super', 'enumerate', 'zip', 'open', 'isinstance',
    'def', 'class', 'return', 'if', 'else', 'elif', 'for', 'while', 'import', 'from', 'as',
    'try', 'except', 'finally', 'with', 'lambda', 'yield', 'raise', 'pass', 'not', 'and', 'or', 'in', 'is',
  ],
  go: [
    'len', 'cap', 'append', 'make', 'new', 'error', 'nil', 'panic', 'recover', 'copy', 'delete',
    'func', 'return', 'if', 'else', 'for', 'range', 'var', 'const', 'type', 'struct', 'interface',
    'package', 'import', 'defer', 'go', 'chan', 'map', 'switch', 'case', 'default', 'string',
    'int', 'int64', 'float64', 'bool', 'byte', 'rune', 'true', 'false',
  ],
  rust: [
    'Some', 'None', 'Ok', 'Err', 'Vec', 'String', 'Option', 'Result', 'Box', 'Rc', 'Arc',
    'fn', 'let', 'mut', 'impl', 'struct', 'enum', 'trait', 'use', 'pub', 'mod', 'match',
    'if', 'else', 'for', 'while', 'loop', 'return', 'self', 'Self', 'crate', 'super',
    'true', 'false', 'usize', 'u32', 'u64', 'i32', 'i64', 'f64', 'bool', 'str',
  ],
};

/** 문법 이름 → 내장 표의 키. `tsx`·`javascript` 는 `typescript` 와 같은 표를 쓴다 (D19). */
export function builtinsFor(grammar: string): readonly string[] {
  if (grammar.startsWith('ts') || grammar.startsWith('js') || grammar === 'tsx') {
    return BUILTINS.typescript ?? [];
  }
  if (grammar.startsWith('py')) return BUILTINS.python ?? [];
  if (grammar.startsWith('go')) return BUILTINS.go ?? [];
  if (grammar.startsWith('rs') || grammar.startsWith('rust')) return BUILTINS.rust ?? [];
  return [];
}

/** 뜻이 있는 토큰만 — 공백과 주석은 자리 비교에 들지 않는다 (04 §4.2 3번). */
export const meaningful = (toks: readonly Tok[]): Tok[] =>
  toks.filter((t) => t.k !== 'ws' && t.k !== 'cmt');

/** 식별자 자리인가. 키워드는 치환 대상이 아니다. */
export const isIdent = (t: Tok | undefined): boolean => t !== undefined && t.k === 'id';

export interface ProtInput {
  /** 원본 블록의 줄들. */
  original: readonly string[];
  grammar: string;
  /**
   * 파일 모듈 수준 선언명 — import·최상위 `const`/`function` (04 §4.3 `ORIG` 의 뒷부분).
   * 블록 밖에서 보이는 이름이라 블록 안에서 바꿀 수 없다.
   */
  moduleDecls?: readonly string[];
}

/**
 * 치환 불가 이름의 집합.
 *
 * 모으는 자리(04 §4.4): 키워드 · import 된 이름 · 속성 이름(`.`·`?.` 뒤, 객체 키, JSX
 * 속성명·태그명) · import 된 호출의 구조 분해 키 · 타입 이름 · 블록이 내보내는 이름 · 내장.
 */
export function buildProt(input: ProtInput): Set<string> {
  const prot = new Set<string>([...KEYWORDS, ...builtinsFor(input.grammar)]);
  for (const name of input.moduleDecls ?? []) prot.add(name);

  // 모듈 수준 이름은 밖에서 온 이름으로 본다 — 구조 분해 규칙(아래)이 이 집합을 본다.
  const imported = new Set<string>(input.moduleDecls ?? []);

  for (const line of input.original) {
    const toks = meaningful(tokenize(line));
    const isImport = /^\s*(import|from|use|#include|require)\b/.test(line)
      || /\brequire\s*\(/.test(line);

    for (let i = 0; i < toks.length; i += 1) {
      const tok = toks[i] as Tok;
      const prev = toks[i - 1];
      const next = toks[i + 1];

      // import 줄의 모든 식별자는 밖에서 온 이름이다.
      if (isImport && tok.k === 'id') {
        imported.add(tok.t);
        prot.add(tok.t);
        continue;
      }
      if (tok.k !== 'id') continue;

      // 속성 접근 — `.` 또는 `?.` 바로 뒤.
      if (prev !== undefined && (prev.t === '.' || prev.t === '?.')) {
        prot.add(tok.t);
        continue;
      }
      // JSX 태그명 — `<` 또는 `</` 바로 뒤.
      if (prev !== undefined && (prev.t === '<' || prev.t === '/') && looksLikeJsx(line)) {
        prot.add(tok.t);
        continue;
      }
      // JSX 속성명 — 태그 안에서 `=` 앞. `==`·`===` 는 비교라 제외한다.
      if (next !== undefined && next.t === '=' && looksLikeJsx(line)) {
        prot.add(tok.t);
        continue;
      }
      // 객체 리터럴 키 — `{` 또는 `,` 바로 뒤에서 `:` 를 물고 있는 이름.
      // **매개변수 주석(`e: FormEvent`)을 잡지 않는 것이 요점이다** — 04 §9 골든 5 가
      // `e → ev` 치환을 동등으로 요구하므로 「`:` 앞이면 키」로 잡으면 그 케이스가 깨진다.
      if (next?.t === ':' && (prev?.t === '{' || prev?.t === ',')) {
        prot.add(tok.t);
        continue;
      }
      // 타입 이름 — `:` 뒤, 또는 제네릭 `<…>` 안. 값이 아니라 이름이라 바꿀 수 없다.
      if (prev?.t === ':' || (prev?.t === '<' && !looksLikeJsx(line))) {
        prot.add(tok.t);
        continue;
      }
      // 블록이 내보내는 이름 — `export function LoginForm` 처럼 밖에서 부르는 이름.
      if (prev?.t === 'function' || prev?.t === 'class' || prev?.t === 'interface'
        || prev?.t === 'type' || prev?.t === 'enum') {
        if (/\bexport\b/.test(line)) prot.add(tok.t);
        continue;
      }
    }
  }

  // import 된 호출의 구조 분해 키 — `const { submit, error } = useLogin()`.
  // 오른쪽이 import 된 이름의 호출일 때만이다. 지역 함수의 결과를 분해한 이름은 지역
  // 이름이라 바꿀 수 있다.
  for (const line of input.original) {
    const m = /\{([^}]*)\}\s*=\s*([A-Za-z_$][\w$]*)\s*\(/.exec(line);
    if (m === null) continue;
    const callee = m[2] as string;
    if (!imported.has(callee)) continue;
    for (const part of (m[1] as string).split(',')) {
      const name = part.split(':')[0]?.trim();
      if (name !== undefined && /^[A-Za-z_$][\w$]*$/.test(name)) prot.add(name);
    }
  }

  return prot;
}

/** JSX 가 있는 줄인가. `<` 가 비교 연산자인지 태그인지를 이것으로 가른다. */
export function looksLikeJsx(line: string): boolean {
  return /<\/?[A-Za-z][\w.-]*(\s|\/?>)/.test(line) || /\/>/.test(line);
}

/**
 * 이 자리의 토큰이 **보호된 자리**인가 — 04 §4.2 10단계의 판정 그대로:
 * 비식별자 · PROT 에 든 이름 · `.`/`?.` 뒤.
 */
export function protectedAt(toks: readonly Tok[], i: number, prot: ReadonlySet<string>): boolean {
  const tok = toks[i];
  if (tok === undefined) return true;
  if (tok.k !== 'id') return true;
  if (prot.has(tok.t)) return true;
  const prev = toks[i - 1];
  return prev !== undefined && (prev.t === '.' || prev.t === '?.');
}

/**
 * 04 §4.3 `ANS` — 답안 전체의 식별자 중 **PROT 자리가 아닌** 것.
 * 검증 ④(원본 이름이 답안에 그대로 남아 있음)가 이 집합을 본다.
 */
export function freeIdents(lines: readonly string[], prot: ReadonlySet<string>): Set<string> {
  const out = new Set<string>();
  for (const line of lines) {
    const toks = meaningful(tokenize(line));
    for (let i = 0; i < toks.length; i += 1) {
      if (protectedAt(toks, i, prot)) continue;
      out.add((toks[i] as Tok).t);
    }
  }
  return out;
}

/** 04 §4.3 `ORIG` — 원본 블록의 식별자 ∪ 파일 모듈 수준 선언명. */
export function origIdents(input: ProtInput): Set<string> {
  const out = new Set<string>(input.moduleDecls ?? []);
  for (const line of input.original) {
    for (const tok of meaningful(tokenize(line))) {
      if (tok.k === 'id') out.add(tok.t);
    }
  }
  return out;
}
