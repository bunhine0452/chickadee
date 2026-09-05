/**
 * 모션 상한 게이트 (06 §2 · D182 로 상한 200ms). 게이트 자체가 맞는지 — 진짜 위반을 잡고 주석은 안 잡는지.
 */
import { describe, expect, test } from 'vitest';

import { BUDGET_MS, EXCEPTIONS, scanAll, scanCss, scanDurationTokens } from './check-motion.mjs';

describe('모션 상한', () => {
  test('리포에 위반이 없다 (상한 200ms · 예외 0)', () => {
    expect(scanAll()).toEqual([]);
  });

  test('200ms 를 넘는 애니메이션을 잡는다', () => {
    const found = scanCss('.hop { animation: hop 900ms ease }', 'x.css');
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ kind: 'animation', ms: 900, cap: BUDGET_MS });
  });

  test('초 단위도 같이 본다', () => {
    expect(scanCss('.slide { transition: transform 1.2s }', 'x.css')).toHaveLength(1);
    expect(scanCss('.slide { transition: transform .34s }', 'x.css')).toHaveLength(1);
    expect(scanCss('.slide { transition: transform .18s }', 'x.css')).toEqual([]);
  });

  test('`infinite` 는 길이와 무관하게 위반이다 (정본 §3-7)', () => {
    const found = scanCss('.spin { animation: spin 2s linear infinite }', 'x.css');
    expect(found.some((f) => f.kind === 'infinite')).toBe(true);
  });

  test('주석에 적힌 위반은 세지 않는다 — 「이것을 지웠다」는 메모다', () => {
    const css = '/* `animation: spin 2s infinite` 를 지웠다 */\n.node { color: red }';
    expect(scanCss(css, 'x.css')).toEqual([]);
  });

  // D179 가 마스코트 동작을 지워 예외가 0이 됐고, D182 가 상한을 720 → 200ms 로 내렸다.
  // 예외를 지운 자리를 시험이 지킨다 — 다시 무언가를 200ms 밖으로 내보내려면 문서와
  // 이 목록을 함께 고쳐야 한다.
  test('예외 목록이 비었고, 이제 아무것도 200ms 를 넘지 못한다', () => {
    expect(EXCEPTIONS).toEqual([]);
    expect(BUDGET_MS).toBe(200);
    expect(scanCss('.dee.lifer { animation: lifer 1.35s both }', 'x.css')).toHaveLength(1);
    expect(scanCss('.x { animation: fade 0.7s both }', 'x.css')).toHaveLength(1);
    expect(scanCss('.x { transition: opacity var(--dur-base) var(--ease) }', 'x.css')).toEqual([]);
  });

  test('`0s` 는 시간이 아니라 「없음」이다 (감축 모드)', () => {
    expect(scanCss('.x { animation-duration: 0s }', 'x.css')).toEqual([]);
  });

  // D182 이후 CSS 는 `var(--dur-base)` 로 시간을 쓴다. 정적 스캐너는 var() 안을 못 보므로
  // 토큰 값 자체를 재지 않으면 토큰 하나로 상한을 통째로 우회할 수 있다.
  test('--dur-* 토큰 값도 상한 안이다', () => {
    expect(scanDurationTokens()).toEqual([]);
  });
});
