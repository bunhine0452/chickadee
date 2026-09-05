/**
 * 창과 프롬프트 (04 §1 · D141 · D8).
 *
 * 이 파일이 지키는 것 하나가 나머지보다 무겁다: **창이 넓어져도 `promptLines` 는 초점 ±4 다.**
 * 정본 §3-1 이 「이 줄과 앞뒤 4줄뿐」으로 못 박은 프라이버시 규약이고, 창을 블록으로 넓힌
 * 변경(D141)이 소리 없이 깨뜨릴 수 있는 유일한 자리다.
 */
import { describe, expect, test } from 'vitest';

import {
  codeLines, inWindow, promptLines, windowOf, LINES_WINDOW, PROMPT_WINDOW, WINDOW_MAX_LINES,
} from './lines.js';
import type { FocusLine } from './types.js';

const linesFrom = (from: number, n: number): FocusLine[] =>
  Array.from({ length: n }, (_, i) => ({ n: from + i, t: `line ${from + i}` }));

describe('windowOf — 창 (D141)', () => {
  test('감싸는 블록이 없으면 초점 ±2 로 떨어진다 — 옛 동작 그대로다', () => {
    expect(windowOf(42)).toEqual({ from: 40, to: 44 });
    expect(windowOf(42, undefined)).toEqual({ from: 40, to: 44 });
  });

  test('초점이 블록 밖이면 폴백이다 — 잘못 붙은 블록으로 엉뚱한 창을 그리지 않는다', () => {
    expect(windowOf(42, { from: 60, to: 80 })).toEqual({ from: 40, to: 44 });
    expect(windowOf(42, { from: 10, to: 20 })).toEqual({ from: 40, to: 44 });
  });

  test('블록이 있으면 블록 전체가 창이다', () => {
    expect(windowOf(42, { from: 30, to: 55 })).toEqual({ from: 30, to: 55 });
  });

  test('블록이 ±2 보다 좁아도 창은 좁아지지 않는다 — 창은 넓히는 것이다', () => {
    // 목업 카드 1 의 `function addItem` 은 세 줄이었고, 목업은 그 함수가 건드리는
    // 선언까지 끌어와 다섯 줄을 그렸다 (A 조사 §1.5).
    expect(windowOf(27, { from: 26, to: 28 })).toEqual({ from: 25, to: 29 });
  });

  test('상한을 넘으면 초점을 가운데 두고 40줄로 자른다', () => {
    const win = windowOf(200, { from: 100, to: 300 });
    expect(win.to - win.from + 1).toBe(WINDOW_MAX_LINES);
    expect(win.from).toBeLessThanOrEqual(200);
    expect(win.to).toBeGreaterThanOrEqual(200);
  });

  test('자를 때도 블록 경계 밖으로는 나가지 않는다', () => {
    const head = windowOf(102, { from: 100, to: 300 });
    expect(head).toEqual({ from: 100, to: 139 });
    const tail = windowOf(298, { from: 100, to: 300 });
    expect(tail).toEqual({ from: 261, to: 300 });
  });
});

describe('promptLines — 창이 넓어져도 초점 ±4 다 (정본 §3-1 · D8)', () => {
  const lines = linesFrom(1, 200);

  test('블록이 40줄이어도 프롬프트는 9줄이다', () => {
    const focus = 100;
    const shown = codeLines(lines, focus, [], { from: 80, to: 119 });
    expect(shown).toHaveLength(40);
    expect(promptLines(lines, focus)).toEqual([
      'line 96', 'line 97', 'line 98', 'line 99', 'line 100',
      'line 101', 'line 102', 'line 103', 'line 104',
    ]);
  });

  test('창이 어떻게 잡히든 프롬프트는 같다 — 블록·폴백·상한 셋이 한 값을 낸다', () => {
    const focus = 100;
    const base = promptLines(lines, focus);
    expect(base).toHaveLength(PROMPT_WINDOW * 2 + 1);
    for (const block of [undefined, { from: 99, to: 101 }, { from: 1, to: 200 }]) {
      expect(promptLines(lines, focus)).toEqual(base);
      // 창은 달라진다 — 그래서 이 단언이 뜻이 있다.
      expect(codeLines(lines, focus, [], block).length).toBeGreaterThan(0);
    }
    expect(codeLines(lines, focus, [], undefined)).toHaveLength(LINES_WINDOW * 2 + 1);
    expect(codeLines(lines, focus, [], { from: 1, to: 200 })).toHaveLength(WINDOW_MAX_LINES);
  });

  test('읽어 온 줄이 초점 ±4 에 못 미치면 있는 만큼만 — 파일 끝이 그렇다', () => {
    expect(promptLines(linesFrom(38, 7), 42)).toHaveLength(7);
  });
});

describe('codeLines · inWindow', () => {
  test('창 밖의 줄은 판에 실리지 않는다', () => {
    const out = codeLines(linesFrom(1, 100), 50, [], { from: 45, to: 60 });
    expect(out[0]?.n).toBe(45);
    expect(out[out.length - 1]?.n).toBe(60);
  });

  test('초점 줄에만 target 이 붙는다 — 창이 넓어져도 하나뿐이다', () => {
    const out = codeLines(linesFrom(1, 100), 50, [], { from: 30, to: 69 });
    expect(out.filter((l) => l.target === true).map((l) => l.n)).toEqual([50]);
  });

  test('inWindow 와 codeLines 는 같은 줄을 고른다 — 누설 검사와 판이 어긋나지 않는다', () => {
    const lines = linesFrom(1, 100);
    const block = { from: 20, to: 44 };
    expect(inWindow(lines, 30, block).map((l) => l.n))
      .toEqual(codeLines(lines, 30, [], block).map((l) => l.n));
  });
});
