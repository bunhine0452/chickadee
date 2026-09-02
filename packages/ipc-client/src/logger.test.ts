import { beforeEach, describe, expect, test } from 'vitest';

import { log, REDACTED, safeFields, scrub, setSink, type Fields, type Level } from './logger.js';

let seen: { level: Level; message: string; fields: Fields }[] = [];

beforeEach(() => {
  seen = [];
  setSink((level, message, fields) => seen.push({ level, message, fields }), 'debug');
});

describe('절대 경로 지우기', () => {
  test.each([
    ['/Users/kim/repo/src/a.ts 를 읽었다', '…/src/a.ts 를 읽었다'],
    ['at C:\\Users\\kim\\repo\\src\\a.ts', 'at …/src/a.ts'],
    ['file:///Users/kim/x/y.ts', '…/x/y.ts'],
  ])('%s', (input, expected) => {
    expect(scrub(input)).toBe(expected);
  });

  test('리포 상대 경로는 그대로 둔다 — 그것은 허용 필드다', () => {
    expect(scrub('src/features/cart/useCart.ts')).toBe('src/features/cart/useCart.ts');
  });
});

describe('금지 필드', () => {
  test('이름만으로 지운다 — 무엇을 담았든 나가지 않는다', () => {
    const out = safeFields({ text: 'const a = 1', excerpt: 'res.user?.x', answer: '2' });
    expect(out).toEqual({ text: REDACTED, excerpt: REDACTED, answer: REDACTED });
  });

  test('대소문자를 가리지 않는다', () => {
    expect(safeFields({ Excerpt: 'x' })).toEqual({ Excerpt: REDACTED });
  });

  test('허용 필드는 값을 유지한다', () => {
    const out = safeFields({ repoId: 1, relPath: 'src/a.ts', ms: 12, code: undefined });
    expect(out).toEqual({ repoId: 1, relPath: 'src/a.ts', ms: 12 });
  });

  test('허용 필드 안의 절대 경로도 줄인다', () => {
    expect(safeFields({ at: '/Users/kim/repo/a.ts' })).toEqual({ at: '…/repo/a.ts' });
  });
});

describe('레벨', () => {
  test('문턱 아래는 나가지 않는다', () => {
    setSink((level, message, fields) => seen.push({ level, message, fields }), 'warn');
    log.info('보이지 않는다');
    log.warn('보인다');
    expect(seen.map((s) => s.level)).toEqual(['warn']);
  });

  test('메시지 자체의 절대 경로도 지운다', () => {
    log.error('열지 못했다: /Users/kim/secret/repo');
    expect(seen[0]?.message).toBe('열지 못했다: …/secret/repo');
  });
});
