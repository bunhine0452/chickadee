import { t } from '@chickadee/i18n';
import { DeeLogo, FlatButton, Switch } from '@chickadee/ui';

import { useAppearance, type Theme, type Trim } from '../../data/settings.js';
import type { HomeMasthead } from '../../screens/home/data';
import { RepoSwitcher } from '../../screens/repos/RepoSwitcher.js';
import './Masthead.css';

export type { Theme, Trim };

/**
 * 스위치 두 벌. **함수다** — 라벨을 모듈 상수로 두면 `setLocale()` 보다 먼저 굳는다 (D117).
 * 설정 화면이 같은 두 벌을 쓰므로 키는 `core` 카탈로그에 하나씩만 있다.
 */
const themeOptions = () => [
  { v: 'light' as const, label: t('settings.look.themeLight') },
  { v: 'dark' as const, label: t('settings.look.themeDark') },
];

const trimOptions = () => [
  { v: 'off' as const, label: t('settings.look.trimOff') },
  { v: 'on' as const, label: t('settings.look.trimOn') },
];

export interface MastheadProps {
  repoName: string;
  /** `YYYY-MM-DD`. 하루 경계는 `@chickadee/scheduler` 가 이미 적용한 뒤다. */
  today: string;
  /** 연속 인쇄 일수. 진도를 열지 않는다 — 숫자만 보여 준다 (정본 §3). */
  streak: number;
  masthead: HomeMasthead;
  /** 설정 화면 열기 (05 §2.1 `settings`). */
  onSettings: () => void;
}

/**
 * `.masthead` — 인쇄 작업 지시서.
 *
 * 스위치 두 개의 상태와 저장은 `data/settings.ts` 의 `useAppearance` 가 들고, `<html>` 을
 * 만지는 것도 그쪽 한 곳뿐이다 — 설정 화면이 같은 스위치를 들고 있어서 둘이 각자 속성을
 * 세우면 나중에 켠 쪽이 이긴다. 값은 `settings` 테이블에 남아 재실행해도 유지된다 (E7).
 */
export function Masthead({ repoName, today, streak, masthead, onSettings }: MastheadProps) {
  const { theme, trim, setTheme, setTrim } = useAppearance();

  return (
    <header className="masthead grain">
      <div className="brand">
        <DeeLogo />
        <div>
          <div className="wordmark" data-w="CHICKADEE">
            <span>CHICKADEE</span>
          </div>
          <div className="brand-sub">Risograph Study Press</div>
          <div className="brand-line">{t('home.brandLine')}</div>
        </div>
      </div>

      <div className="ticket" role="group" aria-label={t('home.ticket')}>
        <div className="tk">
          <span className="tk-k" id="tk-repo">
            {t('home.tkRepo')}
          </span>
          <RepoSwitcher repoName={repoName} />
        </div>
        <div className="tk">
          <span className="tk-k">{t('home.tkDate')}</span>
          <span className="tk-v mono">{today}</span>
        </div>
        <div className="tk">
          <span className="tk-k">{t('home.tkStreak')}</span>
          <span className="tk-v">
            {streak}
            <span className="u">{t('home.tkDay')}</span>
          </span>
        </div>
        <div className="tk">
          <span className="tk-k">{t('home.tkInk')}</span>
          <span className="tk-v">
            {masthead.avgLayer.toFixed(1)}
            <span className="u">{t('home.tkAvgLayer')}</span>
          </span>
        </div>
      </div>

      <div className="ctl">
        <Switch
          options={trimOptions()}
          value={trim}
          label={t('settings.look.trimSwitch')}
          onChange={setTrim}
        />
        <Switch
          options={themeOptions()}
          value={theme}
          label={t('settings.look.themeSwitch')}
          onChange={setTheme}
        />
        {/* 목업에는 이 자리가 없다 — 스위치 옆에 조용히 붙인다(로고와 지시서의 시각은 그대로). */}
        <FlatButton onClick={onSettings} ghost>
          {t('home.settings')}
        </FlatButton>
      </div>
    </header>
  );
}
