import { describe, expect, it } from 'vitest';

import { KEYWORDS, tokenize } from './tokenize.js';
import type { Tok } from './tokenize.js';

/** 공백을 뺀 토큰 (정규화 비교에서 실제로 보는 열). */
const bare = (line: string): Tok[] => tokenize(line).filter((t) => t.k !== 'ws');

describe('tokenize — 다중문자 연산자 (04 §4.2, 목업과 다름)', () => {
  it('`a?.b` 의 `?.` 는 한 토큰이다', () => {
    expect(tokenize('a?.b')).toEqual([
      { k: 'id', t: 'a', col: 0 },
      { k: 'op', t: '?.', col: 1 },
      { k: 'id', t: 'b', col: 3 },
    ]);
  });

  it('`?.` 와 `? .` 는 절대 같은 토큰 열이 아니다 (목업 `\\S` 단일 토큰의 버그)', () => {
    expect(bare('a?.b')).not.toEqual(bare('a ? . b'));
    expect(bare('a ? . b').map((t) => t.t)).toEqual(['a', '?', '.', 'b']);
  });

  it('`a ?? b`', () => {
    expect(tokenize('a ?? b')).toEqual([
      { k: 'id', t: 'a', col: 0 },
      { k: 'ws', t: ' ', col: 1 },
      { k: 'op', t: '??', col: 2 },
      { k: 'ws', t: ' ', col: 4 },
      { k: 'id', t: 'b', col: 5 },
    ]);
  });

  it('`x === y`', () => {
    expect(tokenize('x === y')).toEqual([
      { k: 'id', t: 'x', col: 0 },
      { k: 'ws', t: ' ', col: 1 },
      { k: 'op', t: '===', col: 2 },
      { k: 'ws', t: ' ', col: 5 },
      { k: 'id', t: 'y', col: 6 },
    ]);
  });

  it('`(...args) => x`', () => {
    expect(tokenize('(...args) => x')).toEqual([
      { k: 'punct', t: '(', col: 0 },
      { k: 'op', t: '...', col: 1 },
      { k: 'id', t: 'args', col: 4 },
      { k: 'punct', t: ')', col: 8 },
      { k: 'ws', t: ' ', col: 9 },
      { k: 'op', t: '=>', col: 10 },
      { k: 'ws', t: ' ', col: 12 },
      { k: 'id', t: 'x', col: 13 },
    ]);
  });

  it('그 밖의 2~4자 연산자도 그리디로 잡는다', () => {
    expect(bare('x >>>= 2').map((t) => t.t)).toEqual(['x', '>>>=', '2']);
    expect(bare('a **= b').map((t) => t.t)).toEqual(['a', '**=', 'b']);
    expect(bare('a !== b').map((t) => t.t)).toEqual(['a', '!==', 'b']);
    expect(bare('a ??= b').map((t) => t.t)).toEqual(['a', '??=', 'b']);
    expect(bare('a &&= b || c').map((t) => t.t)).toEqual(['a', '&&=', 'b', '||', 'c']);
    expect(bare('a >>> 1 << 2').map((t) => t.t)).toEqual(['a', '>>>', '1', '<<', '2']);
  });

  it('삼항 뒤 소수는 `?.` 로 붙이지 않는다', () => {
    expect(bare('a ? .5 : b').map((t) => `${t.k}:${t.t}`)).toEqual([
      'id:a', 'op:?', 'num:.5', 'punct::', 'id:b',
    ]);
  });

  it('멤버 접근 `.` 은 punct, 옵셔널 체이닝 `?.` 은 op 다', () => {
    expect(tokenize('a.b')).toEqual([
      { k: 'id', t: 'a', col: 0 },
      { k: 'punct', t: '.', col: 1 },
      { k: 'id', t: 'b', col: 2 },
    ]);
    expect(tokenize('this.state?.value')).toEqual([
      { k: 'kw', t: 'this', col: 0 },
      { k: 'punct', t: '.', col: 4 },
      { k: 'id', t: 'state', col: 5 },
      { k: 'op', t: '?.', col: 10 },
      { k: 'id', t: 'value', col: 12 },
    ]);
  });
});

describe('tokenize — 문자열 · 주석 (§4.2 3번의 전제)', () => {
  it('문자열 안의 `//` 는 str 토큰에 남는다', () => {
    expect(tokenize('const s = "http://x"')).toEqual([
      { k: 'kw', t: 'const', col: 0 },
      { k: 'ws', t: ' ', col: 5 },
      { k: 'id', t: 's', col: 6 },
      { k: 'ws', t: ' ', col: 7 },
      { k: 'op', t: '=', col: 8 },
      { k: 'ws', t: ' ', col: 9 },
      { k: 'str', t: '"http://x"', col: 10 },
    ]);
  });

  it('문자열 안의 `//` 와 진짜 줄 끝 주석이 함께 있어도 구분한다', () => {
    expect(tokenize('const p = "a // b"; // real')).toEqual([
      { k: 'kw', t: 'const', col: 0 },
      { k: 'ws', t: ' ', col: 5 },
      { k: 'id', t: 'p', col: 6 },
      { k: 'ws', t: ' ', col: 7 },
      { k: 'op', t: '=', col: 8 },
      { k: 'ws', t: ' ', col: 9 },
      { k: 'str', t: '"a // b"', col: 10 },
      { k: 'punct', t: ';', col: 18 },
      { k: 'ws', t: ' ', col: 19 },
      { k: 'cmt', t: '// real', col: 20 },
    ]);
  });

  it('줄 끝 주석은 줄 끝까지 한 토큰이다', () => {
    expect(tokenize('let n = 1; // trailing')).toEqual([
      { k: 'kw', t: 'let', col: 0 },
      { k: 'ws', t: ' ', col: 3 },
      { k: 'id', t: 'n', col: 4 },
      { k: 'ws', t: ' ', col: 5 },
      { k: 'op', t: '=', col: 6 },
      { k: 'ws', t: ' ', col: 7 },
      { k: 'num', t: '1', col: 8 },
      { k: 'punct', t: ';', col: 9 },
      { k: 'ws', t: ' ', col: 10 },
      { k: 'cmt', t: '// trailing', col: 11 },
    ]);
    expect(tokenize('// whole line')).toEqual([{ k: 'cmt', t: '// whole line', col: 0 }]);
  });

  it('블록 주석은 한 토큰, 닫히지 않으면 줄 끝까지', () => {
    expect(bare('a /* mid */ b').map((t) => `${t.k}:${t.t}`)).toEqual(['id:a', 'cmt:/* mid */', 'id:b']);
    expect(tokenize('x /* open')).toEqual([
      { k: 'id', t: 'x', col: 0 },
      { k: 'ws', t: ' ', col: 1 },
      { k: 'cmt', t: '/* open', col: 2 },
    ]);
  });

  it('이스케이프된 따옴표와 닫히지 않은 문자열', () => {
    expect(tokenize(String.raw`'it\'s'`)).toEqual([{ k: 'str', t: String.raw`'it\'s'`, col: 0 }]);
    expect(tokenize('"never closed')).toEqual([{ k: 'str', t: '"never closed', col: 0 }]);
  });
});

describe('tokenize — 템플릿 리터럴', () => {
  it('`${…}` 를 품은 채 한 토큰이다', () => {
    expect(tokenize('const x=`v${n+1}`;')).toEqual([
      { k: 'kw', t: 'const', col: 0 },
      { k: 'ws', t: ' ', col: 5 },
      { k: 'id', t: 'x', col: 6 },
      { k: 'op', t: '=', col: 7 },
      { k: 'tpl', t: '`v${n+1}`', col: 8 },
      { k: 'punct', t: ';', col: 17 },
    ]);
  });

  it('보간 안의 중괄호 · 문자열 · 중첩 템플릿을 건너뛴다', () => {
    const line = 'const msg = `hi ${o.a} ${c ? "y" : `${z}`}!`;';
    const tpl = tokenize(line).find((t) => t.k === 'tpl');
    expect(tpl).toEqual({ k: 'tpl', t: '`hi ${o.a} ${c ? "y" : `${z}`}!`', col: 12 });
    expect(bare(line).at(-1)).toEqual({ k: 'punct', t: ';', col: 44 });
  });

  it('보간 안의 `//` 도 템플릿 안에 남는다', () => {
    expect(tokenize('`${base}//x`')).toEqual([{ k: 'tpl', t: '`${base}//x`', col: 0 }]);
  });
});

describe('tokenize — 숫자', () => {
  it('진수 · 소수 · 지수 · 구분자 · BigInt', () => {
    expect(tokenize('[0,42,3.14,.5,1e10,0xFF,1_000,10n]')).toEqual([
      { k: 'punct', t: '[', col: 0 },
      { k: 'num', t: '0', col: 1 },
      { k: 'punct', t: ',', col: 2 },
      { k: 'num', t: '42', col: 3 },
      { k: 'punct', t: ',', col: 5 },
      { k: 'num', t: '3.14', col: 6 },
      { k: 'punct', t: ',', col: 10 },
      { k: 'num', t: '.5', col: 11 },
      { k: 'punct', t: ',', col: 13 },
      { k: 'num', t: '1e10', col: 14 },
      { k: 'punct', t: ',', col: 18 },
      { k: 'num', t: '0xFF', col: 19 },
      { k: 'punct', t: ',', col: 23 },
      { k: 'num', t: '1_000', col: 24 },
      { k: 'punct', t: ',', col: 29 },
      { k: 'num', t: '10n', col: 30 },
      { k: 'punct', t: ']', col: 33 },
    ]);
  });

  it('부호와 지수 부호는 별개 토큰/숫자의 일부다', () => {
    expect(bare('-1.5e-3').map((t) => `${t.k}:${t.t}`)).toEqual(['op:-', 'num:1.5e-3']);
    expect(bare('0b1010 + 0o17').map((t) => `${t.k}:${t.t}`)).toEqual(['num:0b1010', 'op:+', 'num:0o17']);
  });
});

describe('tokenize — 식별자 vs 키워드', () => {
  it('키워드로 시작하는 식별자는 id 로 남는다', () => {
    expect(tokenize('constant = const2 + typeof x')).toEqual([
      { k: 'id', t: 'constant', col: 0 },
      { k: 'ws', t: ' ', col: 8 },
      { k: 'op', t: '=', col: 9 },
      { k: 'ws', t: ' ', col: 10 },
      { k: 'id', t: 'const2', col: 11 },
      { k: 'ws', t: ' ', col: 17 },
      { k: 'op', t: '+', col: 18 },
      { k: 'ws', t: ' ', col: 19 },
      { k: 'kw', t: 'typeof', col: 20 },
      { k: 'ws', t: ' ', col: 26 },
      { k: 'id', t: 'x', col: 27 },
    ]);
  });

  it('`$`·`_` 로 시작하는 이름도 id 다', () => {
    expect(bare('$el._x1 = _;').map((t) => `${t.k}:${t.t}`)).toEqual([
      'id:$el', 'punct:.', 'id:_x1', 'op:=', 'id:_', 'punct:;',
    ]);
  });

  it('선언 · 제어 · TS 타입 키워드', () => {
    expect(bare('export default class Foo extends Bar {}').map((t) => t.k)).toEqual([
      'kw', 'kw', 'kw', 'id', 'kw', 'id', 'punct', 'punct',
    ]);
    expect(bare('const s: string = await fn();').map((t) => t.k)).toEqual([
      'kw', 'id', 'punct', 'kw', 'op', 'kw', 'id', 'punct', 'punct', 'punct',
    ]);
    for (const kw of ['const', 'function', 'return', 'if', 'else', 'import', 'from', 'type', 'interface', 'await', 'async']) {
      expect(KEYWORDS.has(kw)).toBe(true);
      expect(tokenize(kw)[0]?.k).toBe('kw');
    }
    expect(KEYWORDS.has('useState')).toBe(false);
  });
});

describe('tokenize — 공백 · 열 위치 불변식', () => {
  it('공백은 하나의 ws 토큰으로 묶인다', () => {
    expect(tokenize('  a\t b')).toEqual([
      { k: 'ws', t: '  ', col: 0 },
      { k: 'id', t: 'a', col: 2 },
      { k: 'ws', t: '\t ', col: 3 },
      { k: 'id', t: 'b', col: 5 },
    ]);
  });

  it('빈 줄은 빈 배열이다', () => {
    expect(tokenize('')).toEqual([]);
  });

  const lines = [
    'a?.b',
    'const s = "http://x"; // note',
    'const msg = `hi ${o.a} ${c ? "y" : `${z}`}!`;',
    'if (a && b || !c) return await fn?.(x);',
    'export const t1Est = (lines: number, stage: 1|2|3) => clamp(7, 16, Math.round(lines * 0.35));',
    '  /* open',
    "  return { ...rest, 'k-1': [0x1F, .5e3], };",
    '@Decorator() class A<T extends B> implements C {}',
  ];

  it('토큰을 이어 붙이면 원래 줄이 되고, col 은 그 위치와 같다', () => {
    for (const line of lines) {
      const toks = tokenize(line);
      expect(toks.map((t) => t.t).join('')).toBe(line);
      let at = 0;
      for (const tok of toks) {
        expect(tok.col).toBe(at);
        expect(line.slice(tok.col, tok.col + tok.t.length)).toBe(tok.t);
        expect(tok.t.length).toBeGreaterThan(0);
        at += tok.t.length;
      }
    }
  });

  it('결정적이다 — 같은 줄은 항상 같은 토큰 열', () => {
    for (const line of lines) {
      expect(tokenize(line)).toEqual(tokenize(line));
    }
  });
});
