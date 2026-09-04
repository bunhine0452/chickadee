/**
 * 홈이 쓰는 문구·시드. 컴포넌트 여럿이 같은 말을 해야 해서 한곳에 모았다.
 *
 * 데이터 계약은 `screens/home/data.ts` 가 소유한다 — 여기서는 그 값을 사람 말로 바꾸기만 하고
 * 새 필드를 만들지 않는다. 은유 옆에 평문을 병기하는 규칙(정본 §6)도 여기서 지킨다.
 */
import { t, type MessageKey } from '@chickadee/i18n';
import type { Layer } from '@chickadee/store-sql';
import { fnv1a32, mulberry32 } from '@chickadee/text';
import type { Track } from '@chickadee/ui';
import type { CSSProperties } from 'react';

import { layerNames, trackNames } from '../../screens/home/data';
import type { HomeNode } from '../../screens/home/data';

/** 노드·개념이 들고 다니는 트랙. T3 는 스키마 예약이라 M1 에서는 오지 않는다 (02 §2.2). */
export type HomeTrack = HomeNode['track'];

/** 하루(ms). 만기 라벨은 이 눈금으로만 센다. */
const DAY_MS = 86_400_000;

/** 「N일 뒤」로 세는 상한. 넘으면 주 단위로 (02 §3.5 `labelFor`). */
const WEEK_CUTOFF_DAYS = 14;

/** 스티커 지터 폭 — 목업의 `--dy` −4~4px · `--rot` −3~3deg. */
const JITTER_DY_PX = 4;
const JITTER_ROT_DEG = 3;
/** 도장이 내려앉는 간격(목업 `--d` 0·60·120·180·240ms). */
const STAMP_STEP_MS = 60;
const STAMP_STEP_MAX = 8;

/** 색면이 있는 트랙은 셋뿐이다. T3 가 오면 먹판(T0) 자리를 빌린다. */
export function inkTrack(track: HomeTrack): Track {
  return track === 't3' ? 't0' : track;
}

/** 「T0 문법」처럼 라벨을 병기한 트랙 이름. 색만으로 트랙을 읽히지 않는다 (05 §9). */
export function trackName(track: HomeTrack): string {
  return trackNames()[track];
}

/** 「3겹 + 청판」 — 은유와 겹 수를 한 덩어리로. */
export function layerLabel(layer: Layer): string {
  const it = layerNames()[layer];
  return it === undefined
    ? t('home.layerN', { n: String(layer) })
    : t('home.layerLabel', { n: it.n, k: it.k });
}

/** 「잉크 3겹 / 4 · + 청판 · 색이 들어옴」 — 상세·레일이 쓰는 긴 형태. */
export function layerText(layer: Layer): string {
  const it = layerNames()[layer];
  if (it === undefined) return t('home.layerTextShort', { n: String(layer) });
  return t('home.layerText', { n: String(layer), k: it.k, plain: it.plain });
}

/**
 * 목업 JS 의 `DO` — 레일에 세로로 찍히는 「N도」. 표가 문장이 아니라 **키**를 드는 이유는
 * 로케일이다: 모듈이 열리는 시점은 `setLocale()` 보다 이르다 (D117).
 */
const RUN_KEYS: readonly MessageKey[] = [
  'home.run0', 'home.run1', 'home.run2', 'home.run3', 'home.run4',
];

/** 레일 문구 「판 02 · 2도」. */
export function railLabel(no: number, layer: Layer): string {
  const keys = RUN_KEYS[layer] ?? RUN_KEYS[0];
  return t('home.railLabel', {
    no: String(no).padStart(2, '0'),
    run: keys === undefined ? '' : t(keys),
  });
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

/** 오늘·내일이면 눈에 띄게 (목업 `.due.soon`). */
export function isSoon(dueAt: number | null, now: number): boolean {
  if (dueAt === null) return false;
  return daysAhead(dueAt, now) <= 1;
}

/** 트랙마다의 기본 글리프. 목업의 `✎`(필사) · `/ /`(구조)를 그대로 쓴다. */
const TRACK_GLYPH: Readonly<Record<HomeTrack, string>> = {
  t0: '{ }',
  t1: '✎',
  t2: '/ /',
  t3: '※',
};

/** 스티커 얼굴에 찍히는 글자. 짧은 토큰(`?.` · `??`)이 있으면 그것이 가장 잘 읽힌다. */
export function glyphOf(node: Pick<HomeNode, 'track' | 'token'>): string {
  const token = node.token === null ? '' : node.token.trim();
  if (node.track === 't0' && token.length > 0 && token.length <= 3) return token;
  return TRACK_GLYPH[node.track];
}

/**
 * 스티커가 손으로 붙은 것처럼 보이게 하는 지터. **개념 id 해시로 결정된다** —
 * 리렌더마다 흔들리면 안 되고(05 §10), `Math.random` 은 금지다(06 §1.3).
 */
export function nodeSeed(conceptId: string, index: number): CSSProperties {
  const rng = mulberry32(fnv1a32(conceptId));
  const dy = Math.round((rng() * 2 - 1) * JITTER_DY_PX * 10) / 10;
  const rot = Math.round((rng() * 2 - 1) * JITTER_ROT_DEG * 10) / 10;
  return {
    '--dy': `${dy}px`,
    '--rot': `${rot}deg`,
    '--d': `${Math.min(index, STAMP_STEP_MAX) * STAMP_STEP_MS}ms`,
  } as CSSProperties;
}

/** 대지가 얹힌 각도. 시트 순서로만 정해 매 렌더 같은 값이 나온다. */
export function sheetTilt(index: number): CSSProperties {
  const steps = ['-.25deg', '.2deg', '-.15deg', '.15deg'];
  return { '--tilt': steps[index % steps.length] ?? '0deg' } as CSSProperties;
}
