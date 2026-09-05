import { describe, expect, it } from 'vitest';

import { dueLabel, isSoon, layerLabel, layerText, trackName } from './labels';

const NOW = Date.UTC(2026, 8, 3, 9, 0, 0);
const DAY = 86_400_000;

describe('dueLabel', () => {
  it('만기가 지났거나 오늘 안이면 「오늘 안에」', () => {
    expect(dueLabel(NOW - DAY, NOW)).toBe('오늘 안에');
    expect(dueLabel(NOW + 3600_000, NOW)).toBe('오늘 안에');
  });

  it('하루 뒤는 「내일」, 2주 미만은 「N일 뒤」, 그 위는 「N주 뒤」', () => {
    expect(dueLabel(NOW + DAY, NOW)).toBe('내일');
    expect(dueLabel(NOW + 9 * DAY, NOW)).toBe('9일 뒤');
    expect(dueLabel(NOW + 21 * DAY, NOW)).toBe('3주 뒤');
  });

  it('만기가 없으면 예정 없음이라고 말한다', () => {
    expect(dueLabel(null, NOW)).toBe('예정 없음');
    expect(isSoon(null, NOW)).toBe(false);
  });

  it('오늘·내일만 soon 이다', () => {
    expect(isSoon(NOW + DAY, NOW)).toBe(true);
    expect(isSoon(NOW + 2 * DAY, NOW)).toBe(false);
  });
});

describe('layerLabel · layerText', () => {
  it('단계 수와 짧은 이름을 한 덩어리로 낸다', () => {
    expect(layerLabel(2)).toBe('2단계 · 익히는 중');
    expect(layerLabel(0)).toBe('0단계 · 아직');
  });

  it('긴 형태는 분모와 뜻을 함께 낸다', () => {
    expect(layerText(3)).toBe('숙련도 3 / 4 · 자리 잡음 · 오래 두고도 맞힘');
  });
});

describe('trackName', () => {
  it('트랙은 색이 아니라 이름으로 갈린다', () => {
    expect(trackName('t0')).toBe('T0 문법');
    expect(trackName('t2')).toBe('T2 구조');
  });
});
