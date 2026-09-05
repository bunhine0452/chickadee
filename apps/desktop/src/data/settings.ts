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

import { EDITOR_ASSIST_DEFAULT, type EditorAssist } from '../components/t1/monacoOptions.js';
import { measure } from '../devtools/audit.js';

/**
 * 부속 기본값은 **모든 플랫폼에서 `'on'`(숨김)** 이다 (D179 · 정본 §6).
 *
 * 부속은 등록표시 · 판 번호 어긋남 · 종이 결 · 노드 지터 · 도장 회전이다. 전에는
 * 플랫폼으로 갈랐고(D12 — Linux 만 껐다) 이유가 성능이었는데, 이제 이유는 성능이 아니라
 * 화면의 주인이 누구냐다. 코드와 다이어그램이 가장 큰 요소여야 하고 장식은 본문 단 밖에만
 * 둔다 — 그러니 기본이 꺼짐이고, 켜고 싶은 사람이 스위치를 켠다.
 *
 * 스위치는 그대로다. `applyTrim` 도 그대로다 — 바뀌는 것은 저장된 값이 없을 때의 답 하나뿐이다.
 */
function defaultTrim(): Settings['trim'] {
  return 'on';
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
  // 묻기 전에는 거짓이다 — 안 물어본 것을 「아니오」로 세지 않는다 (D147).
  declaredNewcomer: false,
  // 뿌리 넉 장 중 셋을 맞힌 세션이 **나온 적 있는가** (0장 종료 조건 ②, D136).
  // `newcomerFlag` 로는 대신할 수 없다 — 그쪽 'none' 은 「아직 안 재 봤다」와 구별되지 않는다.
  rootCleared: false,
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
  declaredNewcomer: 'declared_newcomer',
  rootCleared: 'root_cleared',
  dictLangs: 'dict_langs',
  lastRepoId: 'last_repo_id',
};

// ───────── 편집 보조 (D143) ─────────

/**
 * `settings` 테이블의 키. **`Settings` 인터페이스에는 아직 없다** — `store-sql` 의
 * `Settings`·`settingsSchema`·`SETTINGS_KEYS` 를 한꺼번에 늘리는 것은 02 §8.2 소관이라
 * 별건으로 올려 두었다. 그때까지 이 값은 같은 테이블의 같은 규약으로 여기서 직접 읽고 쓴다:
 * `fromSettingsRows` 가 「모르는 키는 건너뛴다」로 쓰여 있으므로(앞선 판본이 쓴 키를 오류로
 * 만들지 않겠다는 뜻) 이 행이 다른 읽기를 깨뜨리지 않는다.
 */
const EDITOR_ASSIST_KEY = 'editor_assist';

const isAssist = (v: unknown): v is EditorAssist => v === 'stage' || v === 'off';

/**
 * 못 읽으면 기본값이다 — 설정 한 칸 때문에 판이 안 열리면 안 된다.
 *
 * 캐시하지 않는다. 판마다 한 번 도는 작은 조회이고, 캐시를 두면 세션 도중에 설정을 바꾼
 * 값이 다음 판에 안 실리거나 시험 사이에 값이 새는 두 가지 틀릴 자리가 생긴다.
 */
export async function loadEditorAssist(): Promise<EditorAssist> {
  try {
    const rows = await ipc.store.query('settings.get_all', {});
    const row = rows.find((r) => r.key === EDITOR_ASSIST_KEY);
    if (row === undefined) return EDITOR_ASSIST_DEFAULT;
    const value: unknown = JSON.parse(row.value_json);
    return isAssist(value) ? value : EDITOR_ASSIST_DEFAULT;
  } catch {
    return EDITOR_ASSIST_DEFAULT;
  }
}

export async function saveEditorAssist(value: EditorAssist, now: number): Promise<void> {
  await ipc.store.exec('settings.set', {
    key: EDITOR_ASSIST_KEY,
    valueJson: JSON.stringify(value),
    updatedAt: now,
  });
}

/**
 * 판이 쓰는 읽기 전용 훅. 값이 늦게 와도 `ClonePad` 가 `updateOptions` 로 갈아 끼우므로
 * 처음 한 프레임은 기본값으로 뜬다.
 */
export function useEditorAssist(): EditorAssist {
  const [assist, setAssist] = useState<EditorAssist>(EDITOR_ASSIST_DEFAULT);
  useEffect(() => {
    let live = true;
    void loadEditorAssist().then((v) => { if (live) setAssist(v); });
    return () => { live = false; };
  }, []);
  return assist;
}

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
