/**
 * 하루 경계 · 시각 유틸 — 02 §5.6(하루 경계), §3.5(`labelFor(due)`).
 *
 * - 전부 인자만의 순수 함수다. 내부에서 `Date.now()` 를 읽지 않고 `Math.random` 도 쓰지 않는다
 *   (06 §1.3 결정성 규칙).
 * - 시간대 변환은 플랫폼 `Intl.DateTimeFormat({ timeZone })` 만 쓴다 — 날짜 라이브러리 의존 없음.
 * - DST: 벽시계 → 인스턴트 변환은 **그 인스턴트의 오프셋**으로 두 번 풀어 맞춘다.
 */

/** 'YYYY-MM-DD' 로컬 날짜 키 (02 §8.2). */
export type DayKey = string & { readonly __brand: 'DayKey' };

/** D12 · 02 §5.6: 하루 경계 기본값 04:00. */
export const DEFAULT_ROLLOVER_HOUR = 4;

/** 02 §3.5: 이 일수 미만이면 `N일 뒤`, 이상이면 `N주 뒤`. */
const WEEK_LABEL_THRESHOLD_DAYS = 14;
const DAYS_PER_WEEK = 7;
const MS_PER_DAY = 86_400_000;
const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

interface CivilDate {
  readonly year: number;
  readonly month: number; // 1-12
  readonly day: number; // 1-31
}

interface CivilTime extends CivilDate {
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatterFor(tz: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(tz);
  if (cached) return cached;
  const made = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  formatterCache.set(tz, made);
  return made;
}

/** 인스턴트를 `tz` 의 벽시계 값으로 분해한다. */
function civilAt(instant: number, tz: string): CivilTime {
  let year = 1970;
  let month = 1;
  let day = 1;
  let hour = 0;
  let minute = 0;
  let second = 0;
  for (const part of formatterFor(tz).formatToParts(instant)) {
    const value = Number(part.value);
    switch (part.type) {
      case 'year':
        year = value;
        break;
      case 'month':
        month = value;
        break;
      case 'day':
        day = value;
        break;
      case 'hour':
        hour = value % 24; // 일부 런타임이 자정을 24 로 준다
        break;
      case 'minute':
        minute = value;
        break;
      case 'second':
        second = value;
        break;
      default:
        break;
    }
  }
  return { year, month, day, hour, minute, second };
}

/** 벽시계 값을 그대로 UTC 로 읽었을 때의 ms (0~99년도 안전). */
function asUtcMs(c: CivilTime): number {
  const d = new Date(0);
  d.setUTCFullYear(c.year, c.month - 1, c.day);
  d.setUTCHours(c.hour, c.minute, c.second, 0);
  return d.getTime();
}

/** 그 인스턴트에서 `tz` 의 UTC 오프셋(ms). */
function offsetMsAt(instant: number, tz: string): number {
  return asUtcMs(civilAt(instant, tz)) - instant;
}

/**
 * `tz` 의 벽시계 값 → 인스턴트. 오프셋을 두 번 풀어 DST 전환을 넘긴다.
 * 존재하지 않는 시각(봄 전환)은 전환 뒤로, 두 번 있는 시각(가을 전환)은 앞선 쪽으로 해석한다.
 */
function instantOf(c: CivilTime, tz: string): number {
  const naive = asUtcMs(c);
  const guess = naive - offsetMsAt(naive, tz);
  return naive - offsetMsAt(guess, tz);
}

function pad(n: number, width: number): string {
  return String(Math.abs(n)).padStart(width, '0');
}

function toDayKey(d: CivilDate): DayKey {
  return `${pad(d.year, 4)}-${pad(d.month, 2)}-${pad(d.day, 2)}` as DayKey;
}

function addDays(d: CivilDate, delta: number): CivilDate {
  const t = new Date(0);
  t.setUTCFullYear(d.year, d.month - 1, d.day + delta);
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
}

function parseDayKey(day: string): CivilDate {
  const m = DAY_KEY_PATTERN.exec(day);
  if (!m) throw new RangeError(`invalid DayKey (expected YYYY-MM-DD): ${JSON.stringify(day)}`);
  const year = Number(m[1]);
  const month = Number(m[2]);
  const dayOfMonth = Number(m[3]);
  if (month < 1 || month > 12 || dayOfMonth < 1 || dayOfMonth > 31) {
    throw new RangeError(`invalid DayKey (out of range): ${JSON.stringify(day)}`);
  }
  return { year, month, day: dayOfMonth };
}

function assertRolloverHour(rolloverHour: number): void {
  if (!Number.isInteger(rolloverHour) || rolloverHour < 0 || rolloverHour > 23) {
    throw new RangeError(`rolloverHour must be an integer in 0..23, got ${rolloverHour}`);
  }
}

function daysBetween(from: CivilDate, to: CivilDate): number {
  const a = asUtcMs({ ...from, hour: 0, minute: 0, second: 0 });
  const b = asUtcMs({ ...to, hour: 0, minute: 0, second: 0 });
  return Math.round((b - a) / MS_PER_DAY);
}

/**
 * 02 §5.6 하루 경계. `now` 가 속한 원장 날짜 키.
 *
 * 문서 식은 `format(toZoned(now − rollover_hour·3600e3, tz), 'yyyy-MM-dd')` 이지만, 고정 4시간을
 * 빼는 방식은 DST 전환일에 같은 문서의 만기 판정(`due_at ≤ endOfDay(day)`)과 어긋난다(전환 폭만큼
 * 하루가 겹치거나 빈다). 여기서는 같은 결과를 벽시계로 계산한다 — `tz` 로컬 시각이
 * `rolloverHour` 보다 이르면 전날. 전환이 없는 모든 인스턴트에서 문서 식과 동일하고,
 * `endOfDay` 와는 항상 일관된다(`endOfDay(d−1) ≤ t < endOfDay(d) ⟺ dayKey(t) = d`).
 */
export function dayKey(now: number, tz: string, rolloverHour: number = DEFAULT_ROLLOVER_HOUR): DayKey {
  assertRolloverHour(rolloverHour);
  const c = civilAt(now, tz);
  return toDayKey(c.hour >= rolloverHour ? c : addDays(c, -1));
}

/**
 * 02 §5.6 만기 판정에 쓰는 **다음 경계 시각**(unix ms) — `day` 다음 날 `rolloverHour:00` 로컬.
 * `due_at ≤ endOfDay(day)` 로 그날 만기를 고른다.
 */
export function endOfDay(day: DayKey, tz: string, rolloverHour: number = DEFAULT_ROLLOVER_HOUR): number {
  assertRolloverHour(rolloverHour);
  const next = addDays(parseDayKey(day), 1);
  return instantOf({ ...next, hour: rolloverHour, minute: 0, second: 0 }, tz);
}

/**
 * 02 §3.5 「다음 인쇄」 라벨. `오늘 안에`(다음 경계 전) · `내일` · `N일 뒤`(14일 미만) · `N주 뒤`.
 * 주 수는 반올림한다(30일 → `4주 뒤`).
 */
export function labelFor(
  dueAt: number,
  now: number,
  tz: string,
  rolloverHour: number = DEFAULT_ROLLOVER_HOUR,
): string {
  const today = dayKey(now, tz, rolloverHour);
  if (dueAt < endOfDay(today, tz, rolloverHour)) return '오늘 안에';

  const due = dayKey(dueAt, tz, rolloverHour);
  const days = daysBetween(parseDayKey(today), parseDayKey(due));
  if (days <= 1) return '내일';
  if (days < WEEK_LABEL_THRESHOLD_DAYS) return `${days}일 뒤`;
  return `${Math.round(days / DAYS_PER_WEEK)}주 뒤`;
}
