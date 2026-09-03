import { describe, expect, it } from 'vitest';

import { hl } from './hl';

/** 조각을 `클래스:글자` 로 눌러 비교하기 쉽게 만든다. */
function marks(src: string): string[] {
  return hl(src)
    .filter((t) => t.cls !== null)
    .map((t) => `${t.cls}:${t.t}`);
}

describe('hl', () => {
  it('쪼갠 글자를 이어 붙이면 원문이 그대로 나온다', () => {
    const src = "const total = items.reduce((a, b) => a + b.price, 0); // 합계";
    expect(hl(src).map((t) => t.t).join('')).toBe(src);
  });

  it('키워드·문자열·숫자·주석·구두점·호출 6종만 붙인다', () => {
    const got = new Set(hl("const s = f('x', 12); // 왜").map((t) => t.cls));
    got.delete(null);
    expect([...got].every((c) => ['k', 's', 'n', 'c', 'p', 'f'].includes(c as string))).toBe(true);
  });

  it('키워드는 k', () => {
    expect(marks('const x')).toContain('k:const');
    expect(marks('await go()')).toContain('k:await');
  });

  it('따옴표 3종을 문자열로 본다', () => {
    expect(marks("'a'")).toContain("s:'a'");
    expect(marks('"a"')).toContain('s:"a"');
    expect(marks('`a`')).toContain('s:`a`');
  });

  it('여는 괄호가 붙은 식별자는 호출(f)', () => {
    expect(marks('sum(1)')).toContain('f:sum');
    expect(marks('sum (1)')).toContain('f:sum');
    // 괄호가 없으면 맨 글자다 — 변수는 색을 얻지 않는다.
    expect(marks('sum + 1')).not.toContain('f:sum');
  });

  it('JSX 여는 태그·닫는 태그 이름도 f', () => {
    expect(marks('<Card />')).toContain('f:Card');
    expect(marks('</Card>')).toContain('f:Card');
  });

  it('주석은 줄 끝까지 c 하나로 묶는다', () => {
    expect(marks('x = 1; // 값을 담는다')).toContain('c:// 값을 담는다');
  });

  it('숫자는 소수점까지 한 조각', () => {
    expect(marks('r = 0.35')).toContain('n:0.35');
  });

  it('한국어 주석의 글자는 잘리지 않는다', () => {
    const src = '// 없을 때의 기본값';
    expect(hl(src)).toEqual([{ cls: 'c', t: src }]);
  });

  it('빈 줄은 조각이 없다', () => {
    expect(hl('')).toEqual([]);
  });

  it('호출마다 정규식 상태가 새로 시작한다 — 같은 줄을 두 번 넣어도 같은 값', () => {
    const src = 'export function go(){ return 1 }';
    expect(hl(src)).toEqual(hl(src));
  });
});
