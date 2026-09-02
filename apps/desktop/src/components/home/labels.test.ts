import { describe, expect, it } from 'vitest';

import { dueLabel, glyphOf, inkTrack, isSoon, layerText, nodeSeed, railLabel } from './labels';

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

describe('glyphOf', () => {
  it('T0 은 짧은 토큰을 그대로 얼굴에 찍는다', () => {
    expect(glyphOf({ track: 't0', token: '?.' })).toBe('?.');
  });

  it('토큰이 없거나 길면 트랙 글리프로 떨어진다', () => {
    expect(glyphOf({ track: 't0', token: null })).toBe('{ }');
    expect(glyphOf({ track: 't0', token: 'async / await' })).toBe('{ }');
    expect(glyphOf({ track: 't1', token: 'map' })).toBe('✎');
    expect(glyphOf({ track: 't2', token: null })).toBe('/ /');
  });
});

describe('nodeSeed', () => {
  it('같은 개념 id 는 언제나 같은 지터를 낸다 (05 §10)', () => {
    expect(nodeSeed('ts/optional-chaining', 2)).toEqual(nodeSeed('ts/optional-chaining', 2));
  });

  it('개념이 다르면 지터도 갈라진다', () => {
    const a = nodeSeed('ts/optional-chaining', 0);
    const b = nodeSeed('common/try-catch', 0);
    expect(a).not.toEqual(b);
  });
});

describe('그 밖의 문구', () => {
  it('레일은 판 번호와 도수를 같이 말한다', () => {
    expect(railLabel(2, 2)).toBe('판 02 · 1도');
    expect(railLabel(11, 0)).toBe('판 11 · 미인쇄');
  });

  it('겹은 은유 옆에 평문을 병기한다 (정본 §6)', () => {
    expect(layerText(3)).toBe('잉크 3겹 / 4 · + 청판 · 색이 들어옴');
  });

  it('T3 는 예약이라 먹판 자리를 빌린다', () => {
    expect(inkTrack('t3')).toBe('t0');
    expect(inkTrack('t2')).toBe('t2');
  });
});
