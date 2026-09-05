/**
 * 홈이 쓰는 문구. 컴포넌트 여럿이 같은 말을 해야 해서 한곳에 모았다.
 *
 * 데이터 계약은 `screens/home/data.ts` 가 소유한다 — 여기서는 그 값을 사람 말로 바꾸기만
 * 하고 새 필드를 만들지 않는다.
 *
 * D182 로 지운 것 — `nodeSeed`(스티커 지터) · `sheetTilt`(대지 기울기) · `glyphOf`(스티커
 * 얼굴 글자) · `inkTrack`(트랙 색면 배정) · `railLabel`. 넷 다 형태를 흔들거나 색으로
 * 범주를 가르는 자리였고 정본 §6 이 둘 다 금지한다.
 */
import { t } from '@chickadee/i18n';
import type { Layer } from '@chickadee/store-sql';

import { layerNames, trackNames } from '../../screens/home/data';
import type { HomeNode } from '../../screens/home/data';

/** 노드·개념이 들고 다니는 트랙. T3 는 스키마 예약이라 M1 에서는 오지 않는다 (02 §2.2). */
export type HomeTrack = HomeNode['track'];

/** 하루(ms). 만기 라벨은 이 눈금으로만 센다. */
const DAY_MS = 86_400_000;

/** 「N일 뒤」로 세는 상한. 넘으면 주 단위로 (02 §3.5 `labelFor`). */
const WEEK_CUTOFF_DAYS = 14;

/** 「T0 문법」처럼 코드를 병기한 트랙 이름. 색으로 트랙을 가르지 않는다 (정본 §6). */
export function trackName(track: HomeTrack): string {
  return trackNames()[track];
}

/** 「2단계 · 익히는 중」 — 단계 수와 짧은 이름을 한 덩어리로. */
export function layerLabel(layer: Layer): string {
  const it = layerNames()[layer];
  return it === undefined
    ? t('home.layerN', { n: String(layer) })
    : t('home.layerLabel', { n: it.n, k: it.k });
}

/** 「숙련도 2 / 4 · 익히는 중 · 날을 두고 다시 맞혔음」 — 긴 형태. */
export function layerText(layer: Layer): string {
  const it = layerNames()[layer];
  if (it === undefined) return t('home.layerTextShort', { n: String(layer) });
  return t('home.layerText', { n: String(layer), k: it.k, plain: it.plain });
}

/** 지금부터 만기까지 남은 날. 하루가 덜 남았으면 0 이다. */
function daysAhead(dueAt: number, now: number): number {
  return Math.floor((dueAt - now) / DAY_MS);
}

/**
 * 02 §3.5 `labelFor(due)` — 「오늘 안에」 · 「내일」 · 「N일 뒤」(<14) · 「N주 뒤」.
 * 표는 라벨 근사이고 결정은 FSRS 가 한다 — 화면은 라벨만 고른다.
 */
export function dueLabel(dueAt: number | null, now: number): string {
  if (dueAt === null) return t('home.dueNone');
  const days = daysAhead(dueAt, now);
  if (days <= 0) return t('home.dueToday');
  if (days === 1) return t('home.dueTomorrow');
  if (days < WEEK_CUTOFF_DAYS) return t('home.dueDays', { n: String(days) });
  return t('home.dueWeeks', { n: String(Math.round(days / 7)) });
}

/** 오늘·내일이면 눈에 띄게. */
export function isSoon(dueAt: number | null, now: number): boolean {
  if (dueAt === null) return false;
  return daysAhead(dueAt, now) <= 1;
}
