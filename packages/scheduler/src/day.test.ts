import { describe, expect, it } from 'vitest';

import { DEFAULT_ROLLOVER_HOUR, dayKey, endOfDay, labelFor } from './day.js';
import type { DayKey } from './day.js';

const SEOUL = 'Asia/Seoul';
const NY = 'America/New_York';

/** ISO(오프셋 포함) → unix ms. 테스트 인스턴트를 애매하지 않게 쓰기 위한 헬퍼. */
function at(iso: string): number {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) throw new Error(`bad ISO in test: ${iso}`);
  return ms;
}

const day = (s: string): DayKey => s as DayKey;

describe('dayKey — 04:00 경계 (02 §5.6)', () => {
  it('기본 rolloverHour 는 4다', () => {
    expect(DEFAULT_ROLLOVER_HOUR).toBe(4);
    expect(dayKey(at('2026-09-03T00:30:00+09:00'), SEOUL)).toBe(
      dayKey(at('2026-09-03T00:30:00+09:00'), SEOUL, 4),
    );
  });

  it('같은 밤의 23:59 · 00:30 · 03:59 는 전날, 04:00 부터 새 날 (Asia/Seoul)', () => {
    expect(dayKey(at('2026-09-02T23:59:00+09:00'), SEOUL)).toBe('2026-09-02');
    expect(dayKey(at('2026-09-03T00:30:00+09:00'), SEOUL)).toBe('2026-09-02');
    expect(dayKey(at('2026-09-03T03:59:59+09:00'), SEOUL)).toBe('2026-09-02');
    expect(dayKey(at('2026-09-03T04:00:00+09:00'), SEOUL)).toBe('2026-09-03');
    expect(dayKey(at('2026-09-03T04:01:00+09:00'), SEOUL)).toBe('2026-09-03');
  });

  it('월·연 경계를 넘는다', () => {
    expect(dayKey(at('2027-01-01T02:00:00+09:00'), SEOUL)).toBe('2026-12-31');
    expect(dayKey(at('2027-01-01T04:00:00+09:00'), SEOUL)).toBe('2027-01-01');
    expect(dayKey(at('2028-03-01T01:00:00+09:00'), SEOUL)).toBe('2028-02-29'); // 윤년
  });

  it('rolloverHour 를 0 으로 주면 자정 경계가 된다', () => {
    expect(dayKey(at('2026-09-03T00:30:00+09:00'), SEOUL, 0)).toBe('2026-09-03');
    expect(dayKey(at('2026-09-02T23:59:00+09:00'), SEOUL, 0)).toBe('2026-09-02');
  });

  it('잘못된 rolloverHour 는 거부한다', () => {
    expect(() => dayKey(at('2026-09-03T04:00:00+09:00'), SEOUL, 24)).toThrow(RangeError);
    expect(() => dayKey(at('2026-09-03T04:00:00+09:00'), SEOUL, -1)).toThrow(RangeError);
    expect(() => dayKey(at('2026-09-03T04:00:00+09:00'), SEOUL, 4.5)).toThrow(RangeError);
  });

  it('UTC 인스턴트가 같아도 시간대가 다르면 날짜 키가 다르다', () => {
    const instant = at('2026-09-02T20:00:00Z'); // 서울 05:00(9/3) · 뉴욕 16:00(9/2)
    expect(dayKey(instant, SEOUL)).toBe('2026-09-03');
    expect(dayKey(instant, NY)).toBe('2026-09-02');
    expect(dayKey(at('2026-09-02T18:00:00Z'), SEOUL)).toBe('2026-09-02'); // 서울 03:00 — 아직 전날
  });
});

describe('dayKey · endOfDay — DST (America/New_York)', () => {
  it('봄 전환일(2026-03-08, 02:00 EST → 03:00 EDT)', () => {
    // 전환 전후 모두 04:00 로컬 이전 → 아직 전날
    expect(dayKey(at('2026-03-08T01:30:00-05:00'), NY)).toBe('2026-03-07');
    expect(dayKey(at('2026-03-08T03:30:00-04:00'), NY)).toBe('2026-03-07');
    // 04:00 EDT 부터 새 날. (문서의 「now − 4h」 고정 감산은 여기서 03-07 을 주어
    //  같은 문서의 endOfDay 만기 판정과 어긋난다 — day.ts 주석 참조)
    expect(dayKey(at('2026-03-08T04:30:00-04:00'), NY)).toBe('2026-03-08');
    expect(endOfDay(day('2026-03-07'), NY)).toBe(at('2026-03-08T04:00:00-04:00'));
    expect(endOfDay(day('2026-03-07'), NY)).toBe(at('2026-03-08T08:00:00Z'));
    // 짧은 하루: 03-07 04:00 → 03-08 04:00 는 23시간
    expect(endOfDay(day('2026-03-07'), NY) - endOfDay(day('2026-03-06'), NY)).toBe(23 * 3_600_000);
  });

  it('가을 전환일(2026-11-01, 02:00 EDT → 01:00 EST)', () => {
    expect(dayKey(at('2026-11-01T01:30:00-04:00'), NY)).toBe('2026-10-31'); // 첫 번째 01:30
    expect(dayKey(at('2026-11-01T01:30:00-05:00'), NY)).toBe('2026-10-31'); // 두 번째 01:30
    expect(dayKey(at('2026-11-01T04:00:00-05:00'), NY)).toBe('2026-11-01');
    expect(endOfDay(day('2026-10-31'), NY)).toBe(at('2026-11-01T04:00:00-05:00'));
    // 긴 하루: 전환(02:00)이 04:00 경계보다 앞이므로 25시간짜리 원장 날짜는 10-31 이다
    expect(endOfDay(day('2026-10-31'), NY) - endOfDay(day('2026-10-30'), NY)).toBe(25 * 3_600_000);
    expect(endOfDay(day('2026-11-01'), NY) - endOfDay(day('2026-10-31'), NY)).toBe(24 * 3_600_000);
  });

  it('DST 없는 지역은 항상 24시간이다 (Asia/Seoul)', () => {
    expect(endOfDay(day('2026-03-08'), SEOUL) - endOfDay(day('2026-03-07'), SEOUL)).toBe(24 * 3_600_000);
    expect(endOfDay(day('2026-09-02'), SEOUL)).toBe(at('2026-09-03T04:00:00+09:00'));
  });
});

describe('endOfDay ↔ dayKey 왕복', () => {
  const days = [
    '2026-09-02',
    '2026-03-07', // 뉴욕 봄 전환 직전
    '2026-03-08',
    '2026-10-31', // 뉴욕 가을 전환 직전
    '2026-11-01',
    '2026-12-31',
    '2028-02-28', // 윤년
    '2028-02-29',
  ] as const;

  for (const tz of [SEOUL, NY, 'UTC', 'Europe/Berlin', 'Australia/Sydney', 'Asia/Kathmandu']) {
    for (const rolloverHour of [0, 4, 23]) {
      it(`dayKey(endOfDay(d) − 1) === d · dayKey(endOfDay(d)) === d+1 — ${tz} @${rolloverHour}`, () => {
        for (const d of days) {
          const boundary = endOfDay(day(d), tz, rolloverHour);
          expect(dayKey(boundary - 1, tz, rolloverHour)).toBe(d);
          expect(dayKey(boundary, tz, rolloverHour)).not.toBe(d);
          // 경계 시각은 정확히 다음 날의 시작이다
          expect(endOfDay(dayKey(boundary, tz, rolloverHour), tz, rolloverHour)).toBeGreaterThan(boundary);
        }
      });
    }
  }

  it('잘못된 DayKey 는 거부한다', () => {
    expect(() => endOfDay('2026-9-2' as DayKey, SEOUL)).toThrow(RangeError);
    expect(() => endOfDay('' as DayKey, SEOUL)).toThrow(RangeError);
    expect(() => endOfDay('2026-13-01' as DayKey, SEOUL)).toThrow(RangeError);
  });
});

describe('labelFor — 02 §3.5', () => {
  // 오늘 = 2026-09-02, 다음 경계 = 2026-09-03T04:00+09:00
  const now = at('2026-09-02T10:00:00+09:00');

  it('다음 경계 전이면 「오늘 안에」 (이미 지난 만기 포함)', () => {
    expect(labelFor(now + 60_000, now, SEOUL)).toBe('오늘 안에');
    expect(labelFor(at('2026-09-03T03:59:00+09:00'), now, SEOUL)).toBe('오늘 안에');
    expect(labelFor(at('2026-08-20T09:00:00+09:00'), now, SEOUL)).toBe('오늘 안에'); // 밀린 만기
  });

  it('다음 경계부터 그 다음 경계까지는 「내일」', () => {
    expect(labelFor(at('2026-09-03T04:00:00+09:00'), now, SEOUL)).toBe('내일');
    expect(labelFor(at('2026-09-03T20:00:00+09:00'), now, SEOUL)).toBe('내일');
    expect(labelFor(at('2026-09-04T03:59:00+09:00'), now, SEOUL)).toBe('내일');
  });

  it('14일 미만은 「N일 뒤」', () => {
    expect(labelFor(at('2026-09-04T09:00:00+09:00'), now, SEOUL)).toBe('2일 뒤');
    expect(labelFor(at('2026-09-05T09:00:00+09:00'), now, SEOUL)).toBe('3일 뒤');
    expect(labelFor(at('2026-09-11T09:00:00+09:00'), now, SEOUL)).toBe('9일 뒤');
    expect(labelFor(at('2026-09-15T09:00:00+09:00'), now, SEOUL)).toBe('13일 뒤');
  });

  it('14일부터는 「N주 뒤」 (반올림)', () => {
    expect(labelFor(at('2026-09-16T09:00:00+09:00'), now, SEOUL)).toBe('2주 뒤');
    expect(labelFor(at('2026-09-23T09:00:00+09:00'), now, SEOUL)).toBe('3주 뒤');
    expect(labelFor(at('2026-10-02T09:00:00+09:00'), now, SEOUL)).toBe('4주 뒤'); // 30일 → 반올림 4주
  });

  it('§3.5 표의 라벨 5개를 그대로 만들어 낸다', () => {
    const labels = [
      labelFor(at('2026-09-02T23:00:00+09:00'), now, SEOUL), // 0겹 · 오늘 안에
      labelFor(at('2026-09-03T09:00:00+09:00'), now, SEOUL), // 1겹 · 내일
      labelFor(at('2026-09-05T09:00:00+09:00'), now, SEOUL), // 2겹 · 3일 뒤
      labelFor(at('2026-09-11T09:00:00+09:00'), now, SEOUL), // 3겹 · 9일 뒤
      labelFor(at('2026-09-23T09:00:00+09:00'), now, SEOUL), // 4겹 · 3주 뒤
    ];
    expect(labels).toEqual(['오늘 안에', '내일', '3일 뒤', '9일 뒤', '3주 뒤']);
  });

  it('DST 전환을 건너뛰어도 일수가 밀리지 않는다 (America/New_York)', () => {
    const beforeSpring = at('2026-03-06T10:00:00-05:00'); // 오늘 = 2026-03-06
    expect(labelFor(at('2026-03-07T09:00:00-05:00'), beforeSpring, NY)).toBe('내일');
    expect(labelFor(at('2026-03-09T09:00:00-04:00'), beforeSpring, NY)).toBe('3일 뒤'); // 전환 통과
    const beforeFall = at('2026-10-30T10:00:00-04:00'); // 오늘 = 2026-10-30
    expect(labelFor(at('2026-11-02T09:00:00-05:00'), beforeFall, NY)).toBe('3일 뒤');
  });
});
