import { describe, expect, it } from 'vitest';
import { ANNOUNCE_MAX_LEN, announce } from './announce';

/** 05 §9 스크린리더 행 · §7 문구 규약. */
describe('announce()', () => {
  it('60자를 넘지 않는다', () => {
    const long = announce(
      '정합 — 맞았습니다',
      '잉크 3겹 · 다음 인쇄 2026년 9월 14일 · 연속 인쇄 12일째 · 오늘 남은 판 4장',
      'Space 로 다음',
    );
    expect(long.length).toBeLessThanOrEqual(ANNOUNCE_MAX_LEN);
  });

  it('태그가 남지 않는다', () => {
    const out = announce('<b>정합</b> — 맞았습니다', '<script>alert(1)</script>잉크 3겹');
    expect(out).not.toMatch(/<[^>]*>/);
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
  });

  it('마침표로 끝나는 완결 문장이다', () => {
    const out = announce('정합 — 맞았습니다', '잉크 3겹', 'Space 로 다음');
    expect(out).toBe('정합 — 맞았습니다. 잉크 3겹. Space 로 다음.');
    expect(out.endsWith('.')).toBe(true);
  });

  it('조각마다 붙은 마침표를 겹쳐 찍지 않는다', () => {
    expect(announce('나왔습니다.', '진행은 저장됐습니다.')).toBe('나왔습니다. 진행은 저장됐습니다.');
  });

  it('빈 조각은 버리고, 전부 비면 빈 문자열', () => {
    expect(announce('정합', '', null, undefined)).toBe('정합.');
    expect(announce('', null)).toBe('');
  });

  it('잘라낸 뒤에도 마침표 하나로 끝난다', () => {
    const out = announce('가'.repeat(200));
    expect(out.length).toBeLessThanOrEqual(ANNOUNCE_MAX_LEN);
    expect(out.endsWith('.')).toBe(true);
    expect(out.endsWith('..')).toBe(false);
  });
});
