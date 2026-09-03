/**
 * 모션 상한 게이트 (06 §2). 게이트 자체가 맞는지 — 진짜 위반을 잡고 주석은 안 잡는지.
 */
import { describe, expect, test } from 'vitest';

import { BUDGET_MS, EXCEPTIONS, scanAll, scanCss } from './check-motion.mjs';

describe('모션 상한', () => {
  test('리포에 위반이 없다 (720ms · LIFER 1.36s · peek 1.6s)', () => {
    expect(scanAll()).toEqual([]);
  });

  test('720ms 를 넘는 애니메이션을 잡는다', () => {
    const found = scanCss('.hop { animation: hop 900ms ease }', 'x.css');
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ kind: 'animation', ms: 900, cap: BUDGET_MS });
  });

  test('초 단위도 같이 본다', () => {
    expect(scanCss('.slide { transition: transform 1.2s }', 'x.css')).toHaveLength(1);
    expect(scanCss('.slide { transition: transform .34s }', 'x.css')).toEqual([]);
  });

  test('`infinite` 는 길이와 무관하게 위반이다 (정본 §3-7)', () => {
    const found = scanCss('.spin { animation: spin 2s linear infinite }', 'x.css');
    expect(found.some((f) => f.kind === 'infinite')).toBe(true);
  });

  test('주석에 적힌 위반은 세지 않는다 — 「이것을 지웠다」는 메모다', () => {
    const css = '/* `animation: spin 2s infinite` 를 지웠다 */\n.node { color: red }';
    expect(scanCss(css, 'x.css')).toEqual([]);
  });

  test('문서가 올린 예외 둘만 720ms 를 넘을 수 있다', () => {
    expect(EXCEPTIONS.map((e) => e.ms)).toEqual([1360, 1600]);
    expect(scanCss('.dee.lifer { animation: lifer 1.35s both }', 'x.css')).toEqual([]);
    expect(scanCss('.dee.peek { animation: peek 1.6s ease 2 }', 'x.css')).toEqual([]);
    // 예외 이름을 붙였다고 무제한은 아니다.
    expect(scanCss('.dee.peek { animation: peek 3s ease 2 }', 'x.css')).toHaveLength(1);
  });

  test('`0s` 는 시간이 아니라 「없음」이다 (감축 모드)', () => {
    expect(scanCss('.x { animation-duration: 0s }', 'x.css')).toEqual([]);
  });
});
