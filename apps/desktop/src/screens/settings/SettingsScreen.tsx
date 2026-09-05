import { reclassifyCommits, suggestIdentitiesFor, type Identity } from '@chickadee/concepts';
import { ipc, log } from '@chickadee/ipc-client';
import type { AppPaths, AppVersion } from '@chickadee/ipc-client';
import type { Settings } from '@chickadee/store-sql';
import { getLocale, t, type Locale } from '@chickadee/i18n';
import { FlatButton, LiveRegion, RichText, Switch } from '@chickadee/ui';
import { useEffect, useState } from 'react';

import { EDITOR_ASSIST_DEFAULT, type EditorAssist } from '../../components/t1/monacoOptions.js';
import {
  EXPORT_DEFAULTS, exportRecords, wipeAll, type ExportOptions,
} from '../../data/maintenance.js';
import {
  DEFAULTS, loadEditorAssist, loadSettings, saveEditorAssist, saveSetting, useAppearance,
} from '../../data/settings.js';
import { useUi } from '../../store.js';
import { DictLangPanel, type DictLang } from './DictLangPanel.js';
import { GlobPanel } from './GlobPanel.js';
import { IdentityPanel } from './IdentityPanel.js';
import { KeyPanel } from './KeyPanel.js';
import { PerfTable, type PerfRow } from './PerfTable.js';
import './SettingsScreen.css';

/** 06 §8 「최근 500행 순환」. 표는 그 창 안에서만 통계를 낸다. */
const PERF_WINDOW = 500;

/**
 * 06 §3.6 의 **0.1.0 문구** — 문장을 고치지 않는다. README·이 화면·06 이 같은 문장이어야
 * 한다는 것이 그 절의 요구다. 이 판에는 네트워크 호출이 하나도 없다(D106) — 전송이 열리는
 * 0.2 에서 06 §3.6 의 두 번째 문단으로 통째로 바꾼다.
 *
 * **함수다** — 문장을 모듈 상수로 두면 `setLocale()` 보다 먼저 굳는다 (D117).
 */
const privacyNote = (): readonly string[] => [
  t('settings.privacy.p1'),
  t('settings.privacy.p2'),
  t('settings.privacy.p3'),
];

/** 제안을 뽑을 리포. 홈이 보고 있는 것이고, 없으면 목록의 첫 줄이다. */
function activeRepoId(): number | null {
  const ui = useUi.getState();
  return ui.activeId ?? ui.repos[0]?.id ?? null;
}

/**
 * 스위치 네 벌. **전부 함수다** — 라벨을 모듈 상수로 두면 그 상수는 `setLocale()` 보다
 * 먼저 굳어, 언어를 바꾼 뒤에도 옛 말이 남는다 (D117).
 */
const themeOptions = () => [
  { v: 'light' as const, label: t('settings.look.themeLight') },
  { v: 'dark' as const, label: t('settings.look.themeDark') },
];

const trimOptions = () => [
  { v: 'off' as const, label: t('settings.look.trimOff') },
  { v: 'on' as const, label: t('settings.look.trimOn') },
];

/**
 * 프로그래밍이 처음인가 (D147). 첫 실행에서 한 번 묻고, 여기서 언제든 되돌린다 —
 * `home.newcomerBody` 가 이 자리를 실명으로 가리키므로 없으면 그 문구가 거짓말이 된다.
 * 배치고사가 아니다: 답이 정하는 것은 0장이 언제 닫히는가 하나뿐이고 잠그는 것은 없다.
 */
const newcomerOptions = () => [
  { v: 'no' as const, label: t('settings.study.newcomerNo') },
  { v: 'yes' as const, label: t('settings.study.newcomerYes') },
];

/** 첫 판 안내 (D134). 켜면 다음 세션의 첫 판에서 다시 함께 걷는다. */
const coachOptions = () => [
  { v: 'off' as const, label: t('settings.study.coachOff') },
  { v: 'on' as const, label: t('settings.study.coachOn') },
];

/**
 * 편집 보조 (D143). 기본은 「단계에 맞춰」다 — 끄는 쪽이 기본이면 만들지 않은 것과 같고,
 * 켜는 쪽이 기본이라야 점수의 뜻이 한 벌로 유지된다.
 */
const assistOptions = () => [
  { v: 'stage' as const, label: t('clone.assistStage') },
  { v: 'off' as const, label: t('clone.assistOff') },
];

const motionOptions = () => [
  { v: 'system' as const, label: t('settings.look.motionSystem') },
  { v: 'reduce' as const, label: t('settings.look.motionReduce') },
];

/** 언어 이름은 그 언어로 적는다 (D117) — 두 카탈로그가 같은 값을 낸다. */
const localeOptions = () => [
  { v: 'ko' as const, label: t('locale.ko') },
  { v: 'en' as const, label: t('locale.en') },
];

/** 목록의 시각 표기도 로케일을 탄다. `Intl` 이 아는 태그로만 넘긴다. */
const dateTag = (): string => (getLocale() === 'ko' ? 'ko-KR' : 'en-US');

/**
 * 언어를 바꾸면 저장하고 **다시 그린다**.
 *
 * `t()` 는 모듈 상태를 읽으므로 프로바이더로 200 파일을 꿰면 화면을 안 새로 그려도 되지만,
 * 그 배선의 값이 「설정에서 언어를 바꾸는 드문 한 번」뿐이다 (D117). 저장이 끝난 뒤에
 * 새로 고쳐야 부팅이 그 값을 읽는다 — 먼저 새로 고치면 쓰기가 잘린다.
 */
async function onLocale(locale: Locale): Promise<void> {
  await saveSetting('locale', locale, Date.now());
  location.reload();
}

export interface SettingsScreenProps {
  onBack: () => void;
}

/** 목록에 필요한 것만. `listRepos()` 는 리포마다 `repo_probe` 를 부르므로 여기서 쓰지 않는다. */
interface RepoRow {
  id: number;
  name: string;
  rootPath: string;
  lastIngestAt: number | null;
}

/** 절 하나. 제목 옆에 평문을 병기한다 (정본 §6 — 은유 옆에 평문). */
function Section(props: { id: string; title: string; plain: string; children: React.ReactNode }) {
  return (
    <section className="set-sec" aria-labelledby={props.id}>
      <h2 id={props.id}>
        {props.title}
        <span className="pl">{props.plain}</span>
      </h2>
      {props.children}
    </section>
  );
}

/**
 * 숫자 한 칸. 범위를 벗어난 값은 저장하지 않는다 — 큐 계산이 그 범위를 전제한다 (D12).
 *
 * 친 글자를 그대로 들고 있는 이유: 저장값만 붙들면 「20」을 치는 중간의 「2」가 범위 밖이라
 * 거부되고 칸이 옛 값으로 튕겨 두 자리 수를 아예 입력할 수 없다.
 */
function NumberRow(props: {
  label: string;
  note: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const [text, setText] = useState(String(props.value));
  const { value } = props;
  useEffect(() => setText(String(value)), [value]);

  return (
    <label className="set-row">
      <span className="set-k">{props.label}</span>
      <input
        type="number"
        className="set-num"
        value={text}
        min={props.min}
        max={props.max}
        onChange={(e) => {
          const raw = e.currentTarget.value;
          setText(raw);
          const n = Number(raw);
          if (raw !== '' && Number.isFinite(n) && n >= props.min && n <= props.max) props.onChange(n);
        }}
      />
      <span className="set-note">{props.note}</span>
    </label>
  );
}

/**
 * 설정 (05 §2.1 `settings`).
 *
 * 목업이 없는 화면이라 조판은 05 §4 의 토큰과 홈의 패널 규칙을 그대로 따른다 — 본문은
 * `--measure`, 값은 `tabular-nums`, 색은 트랙 별칭만.
 *
 * 데이터는 스스로 읽는다(홈처럼 부모가 넣어 주는 모양이 아니다) — 설정은 한 화면에서
 * 열고 닫히고, 여기서 바꾼 것이 곧바로 `settings` 테이블로 내려가야 하기 때문이다.
 */
export function SettingsScreen({ onBack }: SettingsScreenProps): React.JSX.Element {
  const appearance = useAppearance();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [repos, setRepos] = useState<RepoRow[]>([]);
  const [perf, setPerf] = useState<PerfRow[]>([]);
  const [version, setVersion] = useState<AppVersion | null>(null);
  const [paths, setPaths] = useState<AppPaths | null>(null);
  const [opts, setOpts] = useState<ExportOptions>(EXPORT_DEFAULTS);
  const [confirming, setConfirming] = useState(false);
  const [suggested, setSuggested] = useState<Identity[]>([]);
  const [dictLangs, setDictLangs] = useState<DictLang[]>([]);
  const [assist, setAssist] = useState<EditorAssist>(EDITOR_ASSIST_DEFAULT);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const [s, repoRows, perfRows, v, p, langRows, editorAssist] = await Promise.all([
          loadSettings(),
          ipc.store.query('repo.list', {}),
          ipc.store.query('perf.list', { limit: PERF_WINDOW }),
          ipc.app.version(),
          ipc.app.paths(),
          ipc.store.query('derive.dict_langs', {}),
          loadEditorAssist(),
        ]);
        if (!live) return;
        setSettings(s);
        setAssist(editorAssist);
        // 05 §2.1 「첫 열기 때 … author 상위 5명 자동 제안」. 이미 정해 둔 사람이 있으면
        // 부르지 않는다 — 커밋 전부를 읽는 쿼리다.
        if (s.identities.length === 0) {
          const id = repoRows[0]?.id ?? null;
          if (id !== null) {
            void suggestIdentitiesFor(id).then((v) => { if (live) setSuggested(v); }, () => undefined);
          }
        }
        setRepos(repoRows.map((r) => ({
          id: r.id, name: r.name, rootPath: r.root_path, lastIngestAt: r.last_ingest_at,
        })));
        setPerf(perfRows.map((r) => ({ kind: r.kind, ms: r.ms })));
        setDictLangs(langRows.map((r) => ({ lang: r.lang, conceptCount: r.concept_count })));
        setVersion(v);
        setPaths(p);
      } catch {
        // 설정을 다 못 읽어도 화면은 뜬다 — 읽힌 것만 보인다 (01 §6).
        if (live) setNote(t('settings.loadFailed'));
      }
    })();
    return () => { live = false; };
  }, []);

  /** 한 칸을 바꾸고 그 자리에서 저장한다. 「저장」 버튼이 없다 — 되돌릴 수 있는 값이다. */
  const put = <K extends keyof Settings>(key: K, value: Settings[K]): void => {
    setSettings((prev) => (prev === null ? prev : { ...prev, [key]: value }));
    void saveSetting(key, value, Date.now()).catch(() => {
      log.warn('failed to save a setting');
      setNote(t('settings.saveFailed'));
    });
  };

  /**
   * identity 를 바꾸면 저장하고 **그 자리에서 다시 가른다** — 리포를 다시 읽지 않는다.
   * 바뀌는 것은 `git_commit` 두 열뿐인데 재인제스트는 수천 파일을 다시 파싱한다.
   */
  const putIdentities = (next: Identity[]): void => {
    put('identities', next);
    const repoId = activeRepoId();
    if (repoId === null) return;
    void reclassifyCommits(repoId, next).then(
      ({ mine, all }) => setNote(t('settings.identity.reclassified', {
        mine: String(mine), all: String(all),
      })),
      () => setNote(t('settings.identity.reclassifyFailed')),
    );
  };

  /** 편집 보조는 `Settings` 밖에 사는 값이라 자기 문으로 저장한다 (`data/settings.ts`). */
  const putAssist = (next: EditorAssist): void => {
    setAssist(next);
    void saveEditorAssist(next, Date.now()).catch(() => {
      log.warn('failed to save the editor assist setting');
      setNote(t('settings.saveFailed'));
    });
  };

  const loadSuggestions = (): void => {
    const repoId = activeRepoId();
    if (repoId === null) return;
    void suggestIdentitiesFor(repoId).then(setSuggested, () => setSuggested([]));
  };

  const doExport = (): void => {
    setBusy(true);
    void exportRecords(opts)
      .then(async ({ dir, name }) => {
        setNote(t('settings.exported', { dir, name }));
        await ipc.app.reveal('data');
      })
      .catch(() => setNote(t('settings.exportFailed')))
      .finally(() => setBusy(false));
  };

  const doWipe = (): void => {
    setBusy(true);
    void wipeAll()
      .then(() => setNote(t('settings.wiped')))
      .catch(() => setNote(t('settings.wipeFailed')))
      .finally(() => { setBusy(false); setConfirming(false); });
  };

  const s = settings ?? { ...DEFAULTS, tz: Intl.DateTimeFormat().resolvedOptions().timeZone };

  return (
    <main className="settings" tabIndex={-1}>
      <header className="set-head">
        <h1>
          {t('settings.title')}
          <span className="pl">{t('settings.plain')}</span>
        </h1>
        <FlatButton onClick={onBack} ghost>
          {t('home.back')}
        </FlatButton>
      </header>

      <Section id="set-repo" title={t('settings.repo.title')} plain={t('settings.repo.plain')}>
        {repos.length === 0 ? (
          <p className="set-empty">{t('settings.repo.empty')}</p>
        ) : (
          <ul className="set-repos">
            {repos.map((r) => (
              <li key={r.id}>
                <b>{r.name}</b>
                <code>{r.rootPath}</code>
                <span className="set-note">
                  {t('settings.repo.lastIngest', {
                    when: r.lastIngestAt === null
                      ? t('settings.repo.never')
                      : new Date(r.lastIngestAt).toLocaleString(dateTag()),
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="set-acts">
          <FlatButton onClick={() => useUi.getState().go('repos')} ghost>
            {t('repos.fromSettings')}
          </FlatButton>
        </div>
        <p className="set-note">{t('repos.fromSettingsNote')}</p>
        <RichText as="p" className="set-note" html={t('settings.repo.reingestNote')} />
        <div className="set-row set-row-block">
          <span className="set-k">{t('settings.globs.label')}</span>
          <GlobPanel value={s.excludeGlobs} onChange={(next) => put('excludeGlobs', next)} />
        </div>
        <RichText as="p" className="set-note" html={t('settings.globs.note')} />
      </Section>

      <Section id="set-study" title={t('settings.study.title')} plain={t('settings.study.plain')}>
        <NumberRow
          label={t('settings.study.budget')}
          note={t('settings.study.budgetNote')}
          value={s.budgetMin}
          min={10}
          max={25}
          onChange={(n) => put('budgetMin', n)}
        />
        <NumberRow
          label={t('settings.study.rollover')}
          note={t('settings.study.rolloverNote')}
          value={s.rolloverHour}
          min={0}
          max={23}
          onChange={(n) => put('rolloverHour', n)}
        />
        <NumberRow
          label={t('settings.study.newPerDay')}
          note={t('settings.study.newPerDayNote')}
          value={s.newPerDay}
          min={0}
          max={4}
          onChange={(n) => put('newPerDay', n)}
        />
        <div className="set-row set-row-block">
          <span className="set-k">{t('settings.identity.label')}</span>
          <IdentityPanel
            value={s.identities}
            suggestions={suggested}
            onChange={putIdentities}
            onSuggest={loadSuggestions}
          />
        </div>
        <p className="set-note">{t('settings.identity.note')}</p>
        <div className="set-row set-row-block">
          <span className="set-k">{t('settings.dictLangs.label')}</span>
          <DictLangPanel
            langs={dictLangs}
            value={s.dictLangs}
            onChange={(next) => put('dictLangs', next)}
          />
        </div>
        <RichText as="p" className="set-note" html={t('settings.dictLangs.note')} />
        <p className="set-note">{t('settings.dictLangs.axis')}</p>
        <div className="set-row">
          <span className="set-k">{t('settings.study.newcomer')}</span>
          <Switch
            options={newcomerOptions()}
            value={s.declaredNewcomer ? 'yes' : 'no'}
            label={t('settings.study.newcomerSwitch')}
            onChange={(v) => put('declaredNewcomer', v === 'yes')}
          />
        </div>
        <RichText as="p" className="set-note" html={t('settings.study.newcomerNote')} />
        <div className="set-row">
          <span className="set-k">{t('settings.study.coach')}</span>
          <Switch
            options={coachOptions()}
            value={s.tutorialSeen ? 'off' : 'on'}
            label={t('settings.study.coachSwitch')}
            onChange={(v) => put('tutorialSeen', v === 'off')}
          />
        </div>
        <p className="set-note">{t('settings.study.coachNote')}</p>
        <div className="set-row">
          <span className="set-k">{t('clone.assistLabel')}</span>
          <Switch
            options={assistOptions()}
            value={assist}
            label={t('clone.assistSwitch')}
            onChange={putAssist}
          />
        </div>
        <RichText as="p" className="set-note" html={t('clone.assistNote')} />
        <RichText as="p" className="set-note" html={t('clone.assistCost')} />
        <label className="set-row">
          <span className="set-k">{t('settings.study.tz')}</span>
          <input
            type="text"
            className="set-text"
            value={s.tz}
            onChange={(e) => put('tz', e.currentTarget.value)}
          />
          <span className="set-note">{t('settings.study.tzNote')}</span>
        </label>
      </Section>

      <Section id="set-look" title={t('settings.look.title')} plain={t('settings.look.plain')}>
        <div className="set-row">
          <span className="set-k">{t('settings.look.process')}</span>
          <Switch
            options={themeOptions()}
            value={appearance.theme}
            label={t('settings.look.themeSwitch')}
            onChange={appearance.setTheme}
          />
          <Switch
            options={trimOptions()}
            value={appearance.trim}
            label={t('settings.look.trimSwitch')}
            onChange={appearance.setTrim}
          />
        </div>
        <div className="set-row">
          <span className="set-k">{t('settings.look.motion')}</span>
          <Switch
            options={motionOptions()}
            value={appearance.motion}
            label={t('settings.look.motionSwitch')}
            onChange={appearance.setMotion}
          />
        </div>
        <p className="set-note">{t('settings.look.motionNote')}</p>
        <div className="set-row">
          <span className="set-k">{t('settings.look.locale')}</span>
          <Switch
            options={localeOptions()}
            value={getLocale()}
            label={t('settings.look.localeSwitch')}
            onChange={(v) => void onLocale(v).catch(() => setNote(t('settings.localeFailed')))}
          />
        </div>
        <p className="set-note">{t('settings.look.localeNote')}</p>
        <p className="set-note">{t('settings.look.note')}</p>
      </Section>

      <Section id="set-key" title={t('settings.key.title')} plain={t('settings.key.plain')}>
        <KeyPanel />
      </Section>

      <Section id="set-perf" title={t('settings.perf.title')} plain={t('settings.perf.plain')}>
        <PerfTable rows={perf} />
      </Section>

      <Section id="set-data" title={t('settings.data.title')} plain={t('settings.data.plain')}>
        <fieldset className="set-fields">
          <legend>{t('settings.data.legend')}</legend>
          <RichText as="p" className="set-note" html={t('settings.data.note')} />
          <label className="set-check">
            <input
              type="checkbox"
              checked={opts.cardExcerpts}
              onChange={(e) => setOpts({ ...opts, cardExcerpts: e.currentTarget.checked })}
            />
            {t('settings.data.excerpts')}
          </label>
          <label className="set-check">
            <input
              type="checkbox"
              checked={opts.t1Drafts}
              onChange={(e) => setOpts({ ...opts, t1Drafts: e.currentTarget.checked })}
            />
            {t('settings.data.drafts')}
          </label>
        </fieldset>

        <div className="set-acts">
          <FlatButton onClick={doExport} disabled={busy}>
            {t('settings.data.export')}
          </FlatButton>
          <FlatButton onClick={() => void ipc.app.reveal('data')} ghost>
            {t('settings.data.openData')}
          </FlatButton>
          <FlatButton onClick={() => void ipc.app.reveal('logs')} ghost>
            {t('settings.data.openLogs')}
          </FlatButton>
        </div>
        <RichText as="p" className="set-note" html={t('settings.data.whereNote')} />

        <div className="set-wipe">
          {confirming ? (
            <>
              <RichText as="p" className="set-warn" html={t('settings.data.wipeWarn')} />
              <div className="set-acts">
                <FlatButton onClick={doWipe} disabled={busy}>
                  {busy ? t('settings.data.wiping') : t('settings.data.wipeGo')}
                </FlatButton>
                <FlatButton onClick={() => setConfirming(false)} ghost>
                  {t('settings.data.wipeCancel')}
                </FlatButton>
              </div>
            </>
          ) : (
            <FlatButton onClick={() => setConfirming(true)} ghost>
              {t('settings.data.wipe')}
            </FlatButton>
          )}
        </div>
      </Section>

      <Section
        id="set-privacy"
        title={t('settings.privacy.title')}
        plain={t('settings.privacy.plain')}
      >
        {privacyNote().map((line) => (
          <p key={line.slice(0, 12)}>{line}</p>
        ))}
      </Section>

      <Section id="set-about" title={t('settings.about.title')} plain={t('settings.about.plain')}>
        <dl className="set-about">
          <dt>Chickadee</dt>
          <dd>{version?.app ?? '—'}</dd>
          <dt>Tauri</dt>
          <dd>{version?.tauri ?? '—'}</dd>
          <dt>SQLite</dt>
          <dd>{version?.sqlite ?? '—'}</dd>
          <dt>rustc</dt>
          <dd>{version?.rustc ?? '—'}</dd>
          <dt>{t('settings.about.dataDir')}</dt>
          <dd>
            <code>{paths?.dataDir ?? '—'}</code>
          </dd>
        </dl>
      </Section>

      {/* 설정은 한 단으로 길다 — 맨 아래에서 다시 위로 올라가 「홈으로」를 찾게 하지 않는다 (D170 ⑧). */}
      <p className="set-foot">
        <FlatButton onClick={onBack} ghost>
          {t('home.back')}
        </FlatButton>
      </p>

      <LiveRegion text={note} />
    </main>
  );
}
