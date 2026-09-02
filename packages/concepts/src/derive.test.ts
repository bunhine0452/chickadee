import { describe, expect, test } from 'vitest';
import type { Capture } from '@chickadee/ipc-client';

import { deriveFile, shapeOf, siteKey } from './derive.js';

/** 캡처 한 건. 기본값은 Rust 가 실제로 채우는 값과 같은 모양이다. */
function cap(over: Partial<Capture> & Pick<Capture, 'queryId' | 'matchId' | 'name'>): Capture {
  return {
    patternIndex: 0,
    form: null,
    nodeKind: 'member_expression',
    inError: false,
    startByte: 0,
    endByte: 10,
    startLine: 1,
    endLine: 1,
    startCol: 0,
    endCol: 10,
    excerpt: '',
    ...over,
  };
}

/** `const nick = res.user?.profile ?? '손님'` 한 줄의 캡처를 손으로 적은 것. */
function oneChain(): Capture[] {
  const q = 'ts/optional-chaining';
  return [
    cap({ queryId: q, matchId: 1, name: 'site', form: 'member', startByte: 13, endByte: 30, excerpt: 'res.user?.profile' }),
    cap({ queryId: q, matchId: 1, name: 'pick.1', startByte: 13, endByte: 21, excerpt: 'res.user' }),
    cap({ queryId: q, matchId: 1, name: 'pick.2', startByte: 21, endByte: 23, excerpt: '?.' }),
    cap({ queryId: q, matchId: 1, name: 'pick.3', startByte: 23, endByte: 30, excerpt: 'profile' }),
    cap({ queryId: q, matchId: 2, name: 'ctx.fallback', startByte: 34, endByte: 39, excerpt: "'손님'" }),
  ];
}

describe('deriveFile', () => {
  test('한 매치의 캡처가 사용처 하나로 묶인다', () => {
    const { sites } = deriveFile('src/a.ts', oneChain());
    expect(sites).toHaveLength(1);
    expect(sites[0]?.conceptId).toBe('ts/optional-chaining');
    expect(sites[0]?.form).toBe('member');
    expect(sites[0]?.picks).toEqual({ 1: 'res.user', 2: '?.', 3: 'profile' });
    expect(sites[0]?.lineStart).toBe(1);
  });

  test('맥락 패턴의 값이 같은 개념 사용처에 붙는다', () => {
    const { sites } = deriveFile('src/a.ts', oneChain());
    expect(sites[0]?.ctx).toEqual({ fallback: "'손님'" });
  });

  test('사용처가 스스로 잡은 ctx 가 맥락 패턴보다 우선한다', () => {
    const own = cap({
      queryId: 'ts/optional-chaining', matchId: 1, name: 'ctx.fallback',
      startByte: 13, endByte: 30, excerpt: "'내 것'",
    });
    const { sites } = deriveFile('src/a.ts', [...oneChain(), own]);
    expect(sites[0]?.ctx.fallback).toBe("'내 것'");
  });

  test('복구 영역 안의 매치는 버린다', () => {
    const broken = oneChain().map((c) => (c.name === 'site' ? { ...c, inError: true } : c));
    expect(deriveFile('src/a.ts', broken).sites).toHaveLength(0);
  });

  test('같은 자리에서 시작하면 안쪽(짧은 것)이 먼저다', () => {
    const q = 'ts/optional-chaining';
    const outer = cap({ queryId: q, matchId: 1, name: 'site', startByte: 0, endByte: 30, excerpt: 'a?.b?.c' });
    const inner = cap({ queryId: q, matchId: 2, name: 'site', startByte: 0, endByte: 10, excerpt: 'a?.b' });
    const { sites } = deriveFile('src/a.ts', [outer, inner]);
    expect(sites.map((s) => s.endByte)).toEqual([10, 30]);
  });

  test('시스템 쿼리는 사용처가 아니라 원시 목록으로 나간다', () => {
    const captures = [
      cap({ queryId: '_imports', matchId: 1, name: 'import.source', form: 'static', excerpt: "'./x.js'" }),
      cap({ queryId: '_blocks', matchId: 2, name: 'block.function', startLine: 3, endLine: 9 }),
      cap({ queryId: '_blocks', matchId: 2, name: 'block.name', excerpt: 'load' }),
    ];
    const out = deriveFile('src/a.ts', captures);
    expect(out.sites).toHaveLength(0);
    expect(out.imports).toEqual([{ specifier: './x.js', form: 'static', line: 1 }]);
    expect(out.blocks[0]).toMatchObject({ name: 'load', lineStart: 3, lineEnd: 9 });
  });

  test('같은 모양의 두 번째부터 occurrence 가 오른다', () => {
    const q = 'ts/array-map-immutable';
    const captures = [
      cap({ queryId: q, matchId: 1, name: 'site', startByte: 0, endByte: 20, excerpt: 'a.map(x => x.n)' }),
      cap({ queryId: q, matchId: 2, name: 'site', startByte: 40, endByte: 60, startLine: 2, endLine: 2, excerpt: 'b.map(y => y.m)' }),
    ];
    const { sites } = deriveFile('src/a.ts', captures);
    // 식별자가 다르지만 모양은 같다 — 두 번째는 카드 대상이 아니다 (03 §3.5).
    expect(sites[0]?.shape).toBe(sites[1]?.shape);
    expect(sites.map((s) => s.occurrence)).toEqual([0, 1]);
    expect(sites[0]?.siteKey).not.toBe(sites[1]?.siteKey);
  });

  test('같은 줄의 다른 개념이 lineConcepts 에 들어간다', () => {
    const captures = [
      cap({ queryId: 'ts/optional-chaining', matchId: 1, name: 'site', startByte: 13, endByte: 30, excerpt: 'res.user?.profile' }),
      cap({ queryId: 'ts/const-declaration', matchId: 2, name: 'site', startByte: 0, endByte: 40, excerpt: 'const nick = res.user?.profile' }),
    ];
    const { sites } = deriveFile('src/a.ts', captures);
    const chain = sites.find((s) => s.conceptId === 'ts/optional-chaining');
    expect(chain?.lineConcepts).toEqual(['ts/const-declaration']);
  });

  test('아무도 덮지 않은 사용처는 uncoveredRatio 가 1 이다', () => {
    const { sites } = deriveFile('src/a.ts', oneChain());
    expect(sites[0]?.uncoveredRatio).toBe(1);
  });

  test('덮개 개념이 있으면 uncoveredRatio 가 내려간다', () => {
    const captures = [
      cap({ queryId: 'ts/optional-chaining', matchId: 1, name: 'site', startByte: 13, endByte: 30, excerpt: 'res.user?.profile' }),
      cap({ queryId: 'ts/property-access', matchId: 2, name: 'site', startByte: 13, endByte: 30, excerpt: 'res.user?.profile' }),
    ];
    const { sites } = deriveFile('src/a.ts', captures);
    expect(sites[0]?.uncoveredRatio).toBe(0);
  });

  test('12줄을 넘는 사용처는 카드 대상에서 빠진다', () => {
    const big = cap({
      queryId: 'ts/try-catch', matchId: 1, name: 'site',
      startLine: 1, endLine: 20, excerpt: 'try {',
    });
    expect(deriveFile('src/a.ts', [big]).sites[0]?.isOversize).toBe(true);
  });
});

describe('shapeOf', () => {
  test('식별자는 _, 리터럴은 # 로 눌린다', () => {
    expect(shapeOf('res.user?.profile')).toBe(shapeOf('a.b?.c'));
    expect(shapeOf("f('x')")).toBe(shapeOf('f(1)'));
  });

  test('연산자와 키워드는 남는다 — 모양을 가르는 것이 그것이다', () => {
    expect(shapeOf('a ?? b')).not.toBe(shapeOf('a || b'));
    expect(shapeOf('const a = 1')).not.toBe(shapeOf('let a = 1'));
  });
});

describe('siteKey', () => {
  test('줄 번호가 들어가지 않는다 — 줄이 밀려도 학습 기록이 따라온다', () => {
    const a = siteKey('ts/optional-chaining', 'src/a.ts', '_._?._', 0);
    const b = siteKey('ts/optional-chaining', 'src/a.ts', '_._?._', 0);
    expect(a).toBe(b);
    expect(a).toHaveLength(16);
  });

  test('개념·경로·모양·순번 중 하나만 달라도 키가 갈린다', () => {
    const base = siteKey('ts/a', 'src/a.ts', '_', 0);
    expect(siteKey('ts/b', 'src/a.ts', '_', 0)).not.toBe(base);
    expect(siteKey('ts/a', 'src/b.ts', '_', 0)).not.toBe(base);
    expect(siteKey('ts/a', 'src/a.ts', '#', 0)).not.toBe(base);
    expect(siteKey('ts/a', 'src/a.ts', '_', 1)).not.toBe(base);
  });

  test('구분자를 넘나드는 충돌이 없다', () => {
    expect(siteKey('ts/a', 'b', 'c', 0)).not.toBe(siteKey('ts/a b', 'c', '', 0));
  });
});

describe('shapeOf — 구두점', () => {
  test('구두점은 모양에 남는다 — 구조가 다르면 다른 모양이다', () => {
    expect(shapeOf('res.user?.profile')).toBe('_._?._');
    expect(shapeOf('f(a)')).not.toBe(shapeOf('f a'));
    expect(shapeOf('[a, b]')).not.toBe(shapeOf('[a b]'));
  });

  test('공백과 주석은 모양을 바꾸지 않는다', () => {
    expect(shapeOf('a  ?.  b')).toBe(shapeOf('a?.b'));
    expect(shapeOf('a?.b // 주석')).toBe(shapeOf('a?.b'));
  });
});
