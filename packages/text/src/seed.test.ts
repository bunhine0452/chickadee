import { describe, expect, it } from 'vitest';

import { fnv1a32, mulberry32, seedOf, shuffle } from './seed.js';

describe('fnv1a32', () => {
  it('공개된 FNV-1a 32 테스트 벡터와 일치한다', () => {
    expect(fnv1a32('')).toBe(0x811c9dc5); // offset basis
    expect(fnv1a32('a')).toBe(0xe40c292c);
    expect(fnv1a32('b')).toBe(0xe70c2de5);
    expect(fnv1a32('foobar')).toBe(0xbf9cf968);
  });

  it('고정 골든 값 (회귀 방지)', () => {
    expect(fnv1a32('hello')).toBe(1_335_831_723);
    expect(fnv1a32('chickadee')).toBe(2_527_489_676);
    expect(fnv1a32('0|t0.meaning|ts.usestate|0|2026.09.02')).toBe(1_410_400_774);
  });

  it('UTF-8 바이트로 해싱한다 (비 ASCII 도 결정적)', () => {
    expect(fnv1a32('한글')).toBe(3_865_498_753);
  });

  it('언제나 부호 없는 32비트다', () => {
    for (const s of ['', 'a', 'zzzz', 'x'.repeat(1000), '한글', '💡']) {
      const h = fnv1a32(s);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(2 ** 32);
    }
  });
});

describe('seedOf — 04 §0', () => {
  const base = () => seedOf(1, 't0.meaning', 'ts.usestate', 0, '2026.09.02');

  it('문서의 조립 식과 정확히 같다', () => {
    expect(base()).toBe(fnv1a32('1|t0.meaning|ts.usestate|0|2026.09.02'));
    expect(seedOf(1, 't0.meaning', 42, 0, '2026.09.02')).toBe(fnv1a32('1|t0.meaning|42|0|2026.09.02'));
  });

  it('같은 입력이면 항상 같은 시드다', () => {
    expect(base()).toBe(base());
    expect(base()).toBe(1_789_883_817);
  });

  it('어떤 입력이 바뀌어도 시드가 달라진다', () => {
    const seeds = new Set([
      base(),
      seedOf(2, 't0.meaning', 'ts.usestate', 0, '2026.09.02'),
      seedOf(1, 't0.blank', 'ts.usestate', 0, '2026.09.02'),
      seedOf(1, 't0.meaning', 'ts.usereducer', 0, '2026.09.02'),
      seedOf(1, 't0.meaning', 'ts.usestate', 1, '2026.09.02'),
      seedOf(1, 't0.meaning', 'ts.usestate', 0, '2026.09.03'),
    ]);
    expect(seeds.size).toBe(6);
  });

  it('숫자 targetId 와 그 문자열 표현은 같은 시드다 (템플릿 리터럴 조립)', () => {
    expect(seedOf(1, 't1', 42, 0, 'v1')).toBe(seedOf(1, 't1', '42', 0, 'v1'));
  });
});

describe('mulberry32', () => {
  it('시드 0 의 앞 8개 골든 수열', () => {
    const rng = mulberry32(0);
    const got = Array.from({ length: 8 }, () => rng());
    expect(got).toEqual([
      0.26642920868471265, 0.0003297457005828619, 0.2232720274478197, 0.1462021479383111,
      0.46732782293111086, 0.5450490827206522, 0.6152513844426721, 0.6489853798411787,
    ]);
  });

  it('FNV offset basis 시드의 앞 8개 골든 수열', () => {
    const rng = mulberry32(fnv1a32(''));
    const got = Array.from({ length: 8 }, () => rng());
    expect(got).toEqual([
      0.6112444521859288, 0.4935242917854339, 0.7740248835179955, 0.4122861116193235,
      0.8122657814528793, 0.05720820324495435, 0.9159039182122797, 0.19360002595931292,
    ]);
  });

  it('같은 시드는 같은 수열, 다른 시드는 다른 수열', () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    const c = mulberry32(12346);
    const take = (rng: () => number): number[] => Array.from({ length: 16 }, () => rng());
    expect(take(a)).toEqual(take(b));
    expect(take(mulberry32(12345))).not.toEqual(take(c));
  });

  it('항상 [0, 1) 안에 있다', () => {
    for (const seed of [0, 1, 2 ** 31, 4_294_967_295, seedOf(7, 't2', 'x', 3, 'v9')]) {
      const rng = mulberry32(seed);
      for (let i = 0; i < 2000; i += 1) {
        const v = rng();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    }
  });
});

describe('shuffle', () => {
  const items = ['a', 'b', 'c', 'd', 'e'] as const;

  it('같은 시드면 같은 결과 (골든)', () => {
    const seed = seedOf(1, 't0.meaning', 'ts.usestate', 0, '2026.09.02');
    expect(shuffle(items, mulberry32(seed))).toEqual(['b', 'd', 'a', 'e', 'c']);
    expect(shuffle(items, mulberry32(seed))).toEqual(shuffle(items, mulberry32(seed)));
    expect(shuffle([1, 2, 3, 4, 5, 6, 7, 8], mulberry32(0))).toEqual([5, 8, 4, 6, 7, 2, 1, 3]);
  });

  it('입력을 건드리지 않고 새 배열을 준다', () => {
    const input = [...items];
    const out = shuffle(input, mulberry32(99));
    expect(input).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(out).not.toBe(input);
  });

  it('언제나 순열이다', () => {
    const source = Array.from({ length: 24 }, (_, i) => i);
    for (let seed = 0; seed < 50; seed += 1) {
      const out = shuffle(source, mulberry32(seed));
      expect(out).toHaveLength(source.length);
      expect([...out].sort((x, y) => x - y)).toEqual(source);
    }
  });

  it('빈 배열·한 원소도 안전하다', () => {
    expect(shuffle([], mulberry32(1))).toEqual([]);
    expect(shuffle(['only'], mulberry32(1))).toEqual(['only']);
  });

  it('rng 가 경계값 1 을 주어도 범위를 넘지 않는다', () => {
    const out = shuffle([1, 2, 3, 4], () => 1);
    expect([...out].sort((x, y) => x - y)).toEqual([1, 2, 3, 4]);
  });
});
