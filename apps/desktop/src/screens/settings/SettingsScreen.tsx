import { ipc, log } from '@chickadee/ipc-client';
import type { AppPaths, AppVersion } from '@chickadee/ipc-client';
import type { Settings } from '@chickadee/store-sql';
import { getLocale, t, type Locale } from '@chickadee/i18n';
import { FlatButton, LiveRegion, Switch } from '@chickadee/ui';
import { useEffect, useState } from 'react';

import {
  EXPORT_DEFAULTS, exportRecords, wipeAll, type ExportOptions,
} from '../../data/maintenance.js';
import { DEFAULTS, loadSettings, saveSetting, useAppearance } from '../../data/settings.js';
import { KeyPanel } from './KeyPanel.js';
import { PerfTable, type PerfRow } from './PerfTable.js';
import './SettingsScreen.css';

/** 06 §8 「최근 500행 순환」. 표는 그 창 안에서만 통계를 낸다. */
const PERF_WINDOW = 500;

/**
 * 06 §3.6 의 **0.1.0 문구** — 문장을 고치지 않는다. README·이 화면·06 이 같은 문장이어야
 * 한다는 것이 그 절의 요구다. 이 판에는 네트워크 호출이 하나도 없다(D106) — 전송이 열리는
 * 0.2 에서 06 §3.6 의 두 번째 문단으로 통째로 바꾼다.
 */
const PRIVACY_NOTE = [
  '당신의 코드는 이 컴퓨터를 떠나지 않습니다. Chickadee는 리포를 읽기만 하고, 학습 기록은 이 컴퓨터의 데이터베이스 한 파일에만 저장합니다.',
  '이 판은 인터넷을 아예 쓰지 않습니다 — 「자유 질문」의 프롬프트도 이 컴퓨터에서 만들어 복사할 뿐, 앱이 스스로 보내지 않습니다.',
  '사용 통계·오류 보고를 보내지 않고, 업데이트도 확인하지 않습니다. 「설정 → 전부 지우기」로 모든 기록을 삭제할 수 있습니다.',
];

const THEME_OPTIONS = [
  { v: 'light' as const, label: '주간반' },
  { v: 'dark' as const, label: '야간반' },
];

const TRIM_OPTIONS = [
  { v: 'off' as const, label: '부속 보임' },
  { v: 'on' as const, label: '부속 숨김' },
];

/** 언어 이름은 그 언어로 적는다 (D117) — 두 카탈로그가 같은 값을 낸다. */
const LOCALE_OPTIONS = [
  { v: 'ko' as const, label: t('locale.ko') },
  { v: 'en' as const, label: t('locale.en') },
];

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
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const [s, repoRows, perfRows, v, p] = await Promise.all([
          loadSettings(),
          ipc.store.query('repo.list', {}),
          ipc.store.query('perf.list', { limit: PERF_WINDOW }),
          ipc.app.version(),
          ipc.app.paths(),
        ]);
        if (!live) return;
        setSettings(s);
        setRepos(repoRows.map((r) => ({
          id: r.id, name: r.name, rootPath: r.root_path, lastIngestAt: r.last_ingest_at,
        })));
        setPerf(perfRows.map((r) => ({ kind: r.kind, ms: r.ms })));
        setVersion(v);
        setPaths(p);
      } catch {
        // 설정을 다 못 읽어도 화면은 뜬다 — 읽힌 것만 보인다 (01 §6).
        if (live) setNote('설정을 다 읽지 못했습니다.');
      }
    })();
    return () => { live = false; };
  }, []);

  /** 한 칸을 바꾸고 그 자리에서 저장한다. 「저장」 버튼이 없다 — 되돌릴 수 있는 값이다. */
  const put = <K extends keyof Settings>(key: K, value: Settings[K]): void => {
    setSettings((prev) => (prev === null ? prev : { ...prev, [key]: value }));
    void saveSetting(key, value, Date.now()).catch(() => {
      log.warn('설정을 저장하지 못했다');
      setNote('저장하지 못했습니다.');
    });
  };

  const doExport = (): void => {
    setBusy(true);
    void exportRecords(opts)
      .then(async ({ dir, name }) => {
        setNote(`${dir} 에 ${name} 을 만들었습니다.`);
        await ipc.app.reveal('data');
      })
      .catch(() => setNote('내보내지 못했습니다.'))
      .finally(() => setBusy(false));
  };

  const doWipe = (): void => {
    setBusy(true);
    void wipeAll()
      .then(() => setNote('전부 지웠습니다. 앱을 닫아 주세요 — 다시 열면 첫 실행부터 시작합니다.'))
      .catch(() => setNote('다 지우지 못했습니다. 앱을 닫고 다시 시도해 주세요.'))
      .finally(() => { setBusy(false); setConfirming(false); });
  };

  const s = settings ?? { ...DEFAULTS, tz: Intl.DateTimeFormat().resolvedOptions().timeZone };

  return (
    <main className="settings" tabIndex={-1}>
      <header className="set-head">
        <h1>
          설정<span className="pl">= 이 앱이 나를 어떻게 다룰지</span>
        </h1>
        <FlatButton onClick={onBack} ghost>
          홈으로
        </FlatButton>
      </header>

      <Section id="set-repo" title="리포" plain="= 교재로 읽는 폴더">
        {repos.length === 0 ? (
          <p className="set-empty">등록된 리포가 없습니다.</p>
        ) : (
          <ul className="set-repos">
            {repos.map((r) => (
              <li key={r.id}>
                <b>{r.name}</b>
                <code>{r.rootPath}</code>
                <span className="set-note">
                  마지막 인제스트{' '}
                  {r.lastIngestAt === null ? '없음' : new Date(r.lastIngestAt).toLocaleString('ko-KR')}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="set-note">
          문법·쿼리·생성기·사전이 바뀌면 홈에 「재인제스트 필요」 배너가 뜹니다. 다시 읽어도{' '}
          <b>숙련도는 개념 단위라 그대로 남고</b> 카드와 사용처만 새로 만듭니다.
        </p>
      </Section>

      <Section id="set-study" title="학습" plain="= 하루에 얼마나, 언제부터">
        <NumberRow
          label="하루 예산"
          note="분 (10~25)"
          value={s.budgetMin}
          min={10}
          max={25}
          onChange={(n) => put('budgetMin', n)}
        />
        <NumberRow
          label="하루 경계"
          note="시 — 이 시각 전은 어제로 셉니다"
          value={s.rolloverHour}
          min={0}
          max={23}
          onChange={(n) => put('rolloverHour', n)}
        />
        <NumberRow
          label="새 판"
          note="장/일 (상한 4)"
          value={s.newPerDay}
          min={0}
          max={4}
          onChange={(n) => put('newPerDay', n)}
        />
        <label className="set-row">
          <span className="set-k">시간대</span>
          <input
            type="text"
            className="set-text"
            value={s.tz}
            onChange={(e) => put('tz', e.currentTarget.value)}
          />
          <span className="set-note">여행 중에 어제 큐가 사라지지 않도록 여기 값이 기준입니다</span>
        </label>
      </Section>

      <Section id="set-look" title="모양" plain="= 화면의 공정">
        <div className="set-row">
          <span className="set-k">공정</span>
          <Switch
            options={THEME_OPTIONS}
            value={appearance.theme}
            label="주간반 · 야간반 전환"
            onChange={appearance.setTheme}
          />
          <Switch
            options={TRIM_OPTIONS}
            value={appearance.trim}
            label="인쇄 부속 보이기 · 숨기기"
            onChange={appearance.setTrim}
          />
        </div>
        <div className="set-row">
          <span className="set-k">{t('settings.look.locale')}</span>
          <Switch
            options={LOCALE_OPTIONS}
            value={getLocale()}
            label={t('settings.look.localeSwitch')}
            onChange={(v) => void onLocale(v).catch(() => setNote('표시 언어를 저장하지 못했습니다.'))}
          />
        </div>
        <p className="set-note">{t('settings.look.localeNote')}</p>
        <p className="set-note">
          여기서 고른 것은 저장되어 다음에 열 때도 그대로입니다. 「부속 숨김」은 등록표시·절취선·
          결·도장 회전만 끄고 글자와 배치는 1px 도 바꾸지 않습니다.
        </p>
      </Section>

      <Section id="set-key" title="LLM 키" plain="= 자유 질문에 쓸 열쇠">
        <KeyPanel />
      </Section>

      <Section id="set-perf" title="성능" plain="= 이 컴퓨터에서 잰 시간">
        <PerfTable rows={perf} />
      </Section>

      <Section id="set-data" title="데이터" plain="= 내 기록을 꺼내거나 지우기">
        <fieldset className="set-fields">
          <legend>내보낼 것</legend>
          <p className="set-note">
            스키마 번호·개념 숙련도·세션 요약·설정은 항상 담습니다. 아래 둘은 <b>내 코드와 내가
            쓴 글</b>이라 기본으로 빼 둡니다.
          </p>
          <label className="set-check">
            <input
              type="checkbox"
              checked={opts.cardExcerpts}
              onChange={(e) => setOpts({ ...opts, cardExcerpts: e.currentTarget.checked })}
            />
            카드 발췌(내 코드 줄)도 담기
          </label>
          <label className="set-check">
            <input
              type="checkbox"
              checked={opts.t1Drafts}
              onChange={(e) => setOpts({ ...opts, t1Drafts: e.currentTarget.checked })}
            />
            T1 필사 초안도 담기
          </label>
        </fieldset>

        <div className="set-acts">
          <FlatButton onClick={doExport} disabled={busy}>
            내 기록 내보내기
          </FlatButton>
          <FlatButton onClick={() => void ipc.app.reveal('data')} ghost>
            데이터 폴더 열기
          </FlatButton>
          <FlatButton onClick={() => void ipc.app.reveal('logs')} ghost>
            로그 폴더 열기
          </FlatButton>
        </div>
        <p className="set-note">
          저장 위치를 묻지 않습니다 — 앱 데이터 폴더의 <code>exports/</code> 에 만들고 그 폴더를
          엽니다. 거기서 원하는 곳으로 옮기면 됩니다.
        </p>

        <div className="set-wipe">
          {confirming ? (
            <>
              <p className="set-warn">
                <b>되돌릴 수 없습니다.</b> 학습 DB·백업·사전 캐시·로그·크래시 기록·설정과 키체인에
                넣은 API 키를 지웁니다. 리포 폴더의 파일은 건드리지 않습니다.
              </p>
              <div className="set-acts">
                <FlatButton onClick={doWipe} disabled={busy}>
                  {busy ? '지우는 중…' : '정말 전부 지웁니다'}
                </FlatButton>
                <FlatButton onClick={() => setConfirming(false)} ghost>
                  그만두기
                </FlatButton>
              </div>
            </>
          ) : (
            <FlatButton onClick={() => setConfirming(true)} ghost>
              전부 지우기
            </FlatButton>
          )}
        </div>
      </Section>

      <Section id="set-privacy" title="프라이버시 노트" plain="= 무엇이 어디에 남는가">
        {PRIVACY_NOTE.map((line) => (
          <p key={line.slice(0, 12)}>{line}</p>
        ))}
      </Section>

      <Section id="set-about" title="정보" plain="= 판 번호">
        <dl className="set-about">
          <dt>Chickadee</dt>
          <dd>{version?.app ?? '—'}</dd>
          <dt>Tauri</dt>
          <dd>{version?.tauri ?? '—'}</dd>
          <dt>SQLite</dt>
          <dd>{version?.sqlite ?? '—'}</dd>
          <dt>rustc</dt>
          <dd>{version?.rustc ?? '—'}</dd>
          <dt>데이터 위치</dt>
          <dd>
            <code>{paths?.dataDir ?? '—'}</code>
          </dd>
        </dl>
      </Section>

      <LiveRegion text={note} />
    </main>
  );
}
