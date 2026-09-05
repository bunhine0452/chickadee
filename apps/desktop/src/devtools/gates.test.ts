// @vitest-environment jsdom
/**
 * 디자인 게이트의 계산 부분 (06 §2). DOM 을 읽는 함수는 브라우저에서만 뜻이 있지만,
 * 색 합성과 비율·행 길이 판정은 순수 함수라 여기서 못박는다 — 게이트가 틀리면
 * 통과도 실패도 거짓말이 된다.
 */
import { describe, expect, test } from 'vitest';

import {
  INK_RATIO, MEASURE, MIN_FONT_PX, PAPER_RATIO,
  MOTION_BUDGET_MS,
  contrastRatio, effectiveBg, hex, longestMs, measureViolations, over, parseColor, pathOf,
} from './gates.js';

const WHITE = { r: 255, g: 255, b: 255, a: 1 };
const BLACK = { r: 0, g: 0, b: 0, a: 1 };

describe('색 파싱', () => {
  test('rgb · rgba · color(srgb) 를 읽는다', () => {
    expect(parseColor('rgb(253, 250, 240)')).toEqual({ r: 253, g: 250, b: 240, a: 1 });
    expect(parseColor('rgba(28, 26, 23, 0.5)')).toEqual({ r: 28, g: 26, b: 23, a: 0.5 });
    expect(parseColor('color(srgb 1 0 0 / 0.5)')).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
  });

  test('모르는 표기는 `null` 이다 — 0 으로 넘기면 대비가 거짓으로 통과한다', () => {
    expect(parseColor('transparent')).toBeNull();
    expect(parseColor('')).toBeNull();
  });
});

describe('대비', () => {
  test('검정 위 흰색은 21:1', () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 5);
  });

  test('같은 색은 1:1', () => {
    expect(contrastRatio(WHITE, WHITE)).toBeCloseTo(1, 5);
  });

  test('반투명 글자는 배경 위에 합성해서 잰다 — 잉크는 겹쳐 찍힌다', () => {
    const half = { r: 0, g: 0, b: 0, a: 0.5 };
    const flat = over(half, WHITE);
    expect(hex(flat)).toBe('#808080');
    expect(contrastRatio(flat, WHITE)).toBeLessThan(contrastRatio(BLACK, WHITE));
  });

  test('임계는 정본 §6 그대로다', () => {
    expect(PAPER_RATIO).toBe(7);
    expect(INK_RATIO).toBe(4.5);
    expect(MIN_FONT_PX).toBe(13);
  });
});

describe('실효 배경', () => {
  test('투명한 조상을 건너뛰고 실제로 칠해진 색을 찾는다', () => {
    document.body.innerHTML = '<div id="outer"><span id="inner">글자</span></div>';
    const outer = document.getElementById('outer') as HTMLElement;
    const inner = document.getElementById('inner') as HTMLElement;
    document.body.style.backgroundColor = 'rgb(253, 250, 240)';
    outer.style.backgroundColor = 'transparent';
    expect(hex(effectiveBg(inner))).toBe('#FDFAF0');
  });
});

describe('행 길이', () => {
  const row = (chars: number, note = false) => ({
    sel: 'p', px: 0, chars, fs: '16px', lh: '1.7', font: 'IBM Plex Sans KR', note,
  });

  test('ko 본문은 30~45자 (05 §9 · D112)', () => {
    const ko = MEASURE.ko;
    expect(measureViolations([row(ko.min), row(40), row(ko.max)], 'ko')).toEqual([]);
    expect(measureViolations([row(ko.min - 1), row(ko.max + 1)], 'ko')).toHaveLength(2);
  });

  test('`.note` 류는 하한만 낮다 — 상한은 본문과 같다', () => {
    const ko = MEASURE.ko;
    expect(measureViolations([row(ko.noteMin, true), row(40, true)], 'ko')).toEqual([]);
    expect(measureViolations([row(ko.noteMin - 1, true), row(ko.max + 1, true)], 'ko'))
      .toHaveLength(2);
  });

  test('en 은 45~68자 — 같은 폭을 라틴으로 환산한 것이다 (D117)', () => {
    const en = MEASURE.en;
    expect(measureViolations([row(en.min), row(60), row(en.max)], 'en')).toEqual([]);
    // ko 에서 통과하던 40자가 en 에서는 너무 짧다. 반대로 60자는 ko 에서 위반이다.
    expect(measureViolations([row(40)], 'en')).toHaveLength(1);
    expect(measureViolations([row(60)], 'ko')).toHaveLength(1);
  });
});

describe('선택자 경로', () => {
  test('실패 보고가 어느 요소인지 말한다', () => {
    document.body.innerHTML = '<section class="panel"><p class="note x">글자</p></section>';
    const p = document.querySelector('p') as HTMLElement;
    expect(pathOf(p)).toBe('section.panel > p.note.x');
  });
});

// 실루엣 시험은 D182 로 사라졌다 — 마스코트가 화면에 없다.

describe('모션 지속 파싱', () => {
  test('쉼표로 늘어선 값 중 가장 긴 것을 ms 로 읽는다', () => {
    expect(longestMs('0.52s')).toBe(520);
    expect(longestMs('200ms, 1.36s, 90ms')).toBe(1360);
    expect(longestMs('0s')).toBe(0);
  });

  test('상한은 정본 §3-9 그대로다', () => {
    expect(MOTION_BUDGET_MS).toBe(720);
  });
});
