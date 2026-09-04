/**
 * 설정과 스케줄러 파라미터. SQLite `settings` 한 곳이 진실이고(01 §7) 여기가 그 문이다.
 *
 * `tz` 는 첫 실행에 OS 값을 저장하고 이후 시스템 시간대가 바뀌어도 사용자가 설정에서
 * 바꾸기 전까지 유지한다 (02 §5.6) — 여행 중에 어제 큐가 통째로 사라지는 것을 막는다.
 */
import { guessLocale, setLocale as setI18nLocale, type Locale } from '@chickadee/i18n';
import { ipc, log } from '@chickadee/ipc-client';
import { FSRS5_DEFAULT_W, DEFAULT_RETENTION, makeScheduler, type Scheduler } from '@chickadee/scheduler';
import { fromSettingsRows, type Settings } from '@chickadee/store-sql';
import { useCallback, useEffect, useState } from 'react';

import { measure } from '../devtools/audit.js';

/**
 * 부속 기본값은 **플랫폼별**이다 (D12 · 05 §4.3) — Linux(WebKitGTK)는 `'on'`(부속 숨김),
 * macOS·Windows 는 `'off'`. 부속(등록표시·기울기·결·어긋남·절취선·도장 회전)은 블렌드와
 * 필터를 쓰는데 WebKitGTK 가 그것을 가장 비싸게 그린다.
 *
 * `navigator.userAgent` 로 가른다 — `@tauri-apps/plugin-os` 를 붙이면 권한 표면이 하나
 * 늘어나는데(06 §4.3), 얻는 것은 이 한 줄뿐이다. 브라우저 게이트에서도 같은 값이 나온다.
 */
function defaultTrim(): Settings['trim'] {
  return typeof navigator !== 'undefined' && /Linux|X11/.test(navigator.userAgent)
    && !/Android/.test(navigator.userAgent)
    ? 'on'
    : 'off';
}

/** D12 기본값. `settings` 에 행이 없을 때 쓰는 값이며 화면이 바꾸면 행이 생긴다. */
export const DEFAULTS: Omit<Settings, 'tz'> = {
  // 아직 아무 리포도 안 열었다 — 부팅이 첫 줄을 고른다 (D119).
  lastRepoId: null,
  budgetMin: 15,
  rolloverHour: 4,
  desiredRetention: DEFAULT_RETENTION,
  newPerDay: 2,
  t1PerWeek: 2,
  newcomerFlag: 'none',
  theme: 'light',
  trim: defaultTrim(),
  motion: 'system',
  identities: [],
  excludeGlobs: [],
  // 저장된 값이 없을 때만 쓰는 추정이다 (D117). 첫 실행 0단계가 다시 묻는다.
  locale: guessLocale(),
  // 아직 첫 판을 함께 걸어 본 적이 없다 (D134).
  tutorialSeen: false,
  // 비면 전부 켜진 것이다 (D122).
  dictLangs: [],
};

export async function loadSettings(): Promise<Settings> {
  const rows = await ipc.store.query('settings.get_all', {});
  const stored = fromSettingsRows(rows);
  return {
    ...DEFAULTS,
    tz: stored.tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...stored,
  };
}

export async function saveSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K],
  now: number,
): Promise<void> {
  await ipc.store.exec('settings.set', {
    key: KEY_OF[key],
    valueJson: JSON.stringify(value),
    updatedAt: now,
  });
}

/** `Settings` 필드 → `settings.key`. `store-sql` 의 `SETTINGS_KEYS` 를 뒤집은 것이다. */
const KEY_OF: Record<keyof Settings, string> = {
  budgetMin: 'budget_min',
  tz: 'tz',
  rolloverHour: 'rollover_hour',
  desiredRetention: 'desired_retention',
  newPerDay: 'new_per_day',
  t1PerWeek: 't1_per_week',
  newcomerFlag: 'newcomer_flag',
  theme: 'theme',
  trim: 'trim',
  motion: 'motion',
  identities: 'identities',
  excludeGlobs: 'exclude_globs',
  locale: 'locale',
  tutorialSeen: 'tutorial_seen',
  dictLangs: 'dict_langs',
  lastRepoId: 'last_repo_id',
};

// ───────── 모양 (테마 · 부속) ─────────

export type Theme = Settings['theme'];
export type Trim = Settings['trim'];
export type Motion = Settings['motion'];

/**
 * `<html data-theme>` 을 세우는 **유일한** 자리 (05 §4.3 — 테마는 이 속성 하나로만 바뀐다).
 *
 * `measured` 는 사용자가 스위치를 눌렀을 때만 참이다. 마운트와 부팅 복원은 전환이 아니라
 * 화면 전체의 첫 조판이라 같은 이름으로 세면 예산이 늘 초과로 보인다(실측 138ms 대 237ms).
 */
export function applyTheme(theme: Theme, measured = false): void {
  const set = (): void => {
    document.documentElement.setAttribute('data-theme', theme);
    // 05 §10 `theme:switch` 예산 100ms — 토큰을 갈아 끼우고 **다시 계산까지** 끝나는 데까지다.
    // `offsetHeight` 를 읽어 재계산을 그 자리에서 끝낸다(안 그러면 다음 프레임에 밀린다).
    void document.documentElement.offsetHeight;
  };
  if (measured) measure('theme:switch', set);
  else document.documentElement.setAttribute('data-theme', theme);
}

/** `<html data-trim>` 을 세우는 유일한 자리. 텍스트·레이아웃은 1px 도 바뀌지 않는다 (05 §4.3). */
export function applyTrim(trim: Trim): void {
  document.documentElement.setAttribute('data-trim', trim);
}

/**
 * `<html data-motion>` 을 세우는 **유일한** 자리 (05 §2.1 · 06 §2).
 *
 * `'system'` 은 속성을 지우지 않고 그대로 적는다 — CSS 선택자는 `="reduce"` 만 보므로
 * 아무 효과가 없고, 대신 게이트와 개발자 패널이 **지금 무엇이 걸려 있는지**를 DOM 에서
 * 읽을 수 있다. 속성이 없는 상태와 「시스템 따름」을 구별하지 못하면 그 둘의 차이를
 * 화면 밖에서 증명할 수 없다.
 *
 * `'system'` 일 때 실제로 감축할지는 `@media (prefers-reduced-motion: reduce)` 가 정한다.
 * 두 길은 같은 선언을 낸다 — CSS 파일마다 media 블록과 `[data-motion="reduce"]` 규칙이
 * 짝으로 있고, `tests/gates/motion.spec.ts` 가 두 길을 따로 잰다.
 */
export function applyMotion(motion: Motion): void {
  document.documentElement.setAttribute('data-motion', motion);
}

/**
 * `<html lang · data-locale>` 을 세우는 **유일한** 자리 (D117 · 05 §9).
 *
 * `applyTheme`·`applyTrim` 옆에 두는 이유는 하나다 — 두 곳에서 속성을 세우면 나중에 켠
 * 쪽이 이긴다. 조판 CSS(`word-break`·`--measure`)가 `[data-locale="en"]` 하나만 본다.
 * `lang` 은 스크린리더가 읽을 언어를 고르는 자리라 같이 세운다.
 */
export function applyLocale(locale: Locale): void {
  document.documentElement.setAttribute('lang', locale);
  document.documentElement.setAttribute('data-locale', locale);
  setI18nLocale(locale);
}

export interface Appearance {
  theme: Theme;
  trim: Trim;
  motion: Motion;
  setTheme: (v: Theme) => void;
  setTrim: (v: Trim) => void;
  setMotion: (v: Motion) => void;
}

/**
 * 테마·부속을 `settings` 테이블에 넣고 켤 때 도로 읽는다 (E7 — 재실행해도 야간반이 유지된다).
 *
 * 마스트헤드와 설정 화면이 같이 쓴다. 둘은 App 이 서로 배타적으로 그리므로 한 번에 하나만
 * 산다 — 그래서 상태를 전역으로 올리지 않았다. 읽기에 실패하면 기본값으로 뜨고 화면은 산다.
 */
export function useAppearance(): Appearance {
  const [theme, setThemeState] = useState<Theme>(DEFAULTS.theme);
  const [trim, setTrimState] = useState<Trim>(DEFAULTS.trim);
  const [motion, setMotionState] = useState<Motion>(DEFAULTS.motion);

  useEffect(() => {
    let live = true;
    applyTheme(DEFAULTS.theme);
    applyTrim(DEFAULTS.trim);
    applyMotion(DEFAULTS.motion);
    void loadSettings().then(
      (s) => {
        if (!live) return;
        setThemeState(s.theme);
        setTrimState(s.trim);
        setMotionState(s.motion);
        applyTheme(s.theme);
        applyTrim(s.trim);
        applyMotion(s.motion);
      },
      () => log.warn('설정을 읽지 못해 기본 모양으로 연다'),
    );
    return () => {
      live = false;
    };
  }, []);

  const setTheme = useCallback((v: Theme) => {
    setThemeState(v);
    applyTheme(v, true);
    void saveSetting('theme', v, Date.now()).catch(() => log.warn('테마를 저장하지 못했다'));
  }, []);

  const setTrim = useCallback((v: Trim) => {
    setTrimState(v);
    applyTrim(v);
    void saveSetting('trim', v, Date.now()).catch(() => log.warn('부속 설정을 저장하지 못했다'));
  }, []);

  const setMotion = useCallback((v: Motion) => {
    setMotionState(v);
    applyMotion(v);
    void saveSetting('motion', v, Date.now()).catch(() => log.warn('모션 설정을 저장하지 못했다'));
  }, []);

  return { theme, trim, motion, setTheme, setTrim, setMotion };
}

/**
 * 활성 스케줄러. 행이 없으면 기본 파라미터로 한 줄 만든다 (02 §3.6).
 *
 * **모든 원장 행이 `params_id` 를 들고 있어야** 파라미터를 바꿔도 재생이 결정적이다 —
 * 그래서 스케줄러를 만들기 전에 행부터 확보한다.
 */
export async function loadScheduler(now: number, retention: number): Promise<Scheduler> {
  let rows = await ipc.store.query('review.params_active', {});
  if (rows.length === 0) {
    await ipc.store.exec('review.params_insert', {
      createdAt: now,
      algo: 'fsrs5',
      paramsJson: JSON.stringify(FSRS5_DEFAULT_W),
      source: 'default',
      reviewCount: 0,
      isActive: 1,
    });
    rows = await ipc.store.query('review.params_active', {});
  }
  const row = rows[0];
  if (!row) throw new Error('scheduler_params 를 만들지 못했다');
  const w = JSON.parse(row.params_json) as number[];
  return makeScheduler({ paramsId: row.id, w, requestRetention: retention });
}
