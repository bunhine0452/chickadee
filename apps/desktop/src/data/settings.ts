/**
 * 설정과 스케줄러 파라미터. SQLite `settings` 한 곳이 진실이고(01 §7) 여기가 그 문이다.
 *
 * `tz` 는 첫 실행에 OS 값을 저장하고 이후 시스템 시간대가 바뀌어도 사용자가 설정에서
 * 바꾸기 전까지 유지한다 (02 §5.6) — 여행 중에 어제 큐가 통째로 사라지는 것을 막는다.
 */
import { ipc } from '@chickadee/ipc-client';
import { FSRS5_DEFAULT_W, DEFAULT_RETENTION, makeScheduler, type Scheduler } from '@chickadee/scheduler';
import { fromSettingsRows, type Settings } from '@chickadee/store-sql';

/** D12 기본값. `settings` 에 행이 없을 때 쓰는 값이며 화면이 바꾸면 행이 생긴다. */
export const DEFAULTS: Omit<Settings, 'tz'> = {
  budgetMin: 15,
  rolloverHour: 4,
  desiredRetention: DEFAULT_RETENTION,
  newPerDay: 2,
  t1PerWeek: 2,
  newcomerFlag: 'none',
  theme: 'light',
  trim: 'on',
  motion: 'system',
  identities: [],
  excludeGlobs: [],
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
};

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
