import { t } from '@chickadee/i18n';
import { Switch } from '@chickadee/ui';

import { useAppearance } from '../../data/settings.js';
import { RepoSwitcher } from '../../screens/repos/RepoSwitcher.js';
import './Topbar.css';

/**
 * 밝게 · 어둡게. **함수다** — 라벨을 모듈 상수로 두면 `setLocale()` 보다 먼저 굳는다 (D117).
 * 설정 화면이 같은 벌을 쓰므로 키는 `core` 카탈로그에 하나씩만 있다.
 */
const themeOptions = () => [
  { v: 'light' as const, label: t('settings.look.themeLight') },
  { v: 'dark' as const, label: t('settings.look.themeDark') },
];

export interface TopbarProps {
  repoName: string;
  /** 코스 열기 (D171). */
  onCourse: () => void;
  /** 서가 열기 (D119). */
  onRepos: () => void;
  onSettings: () => void;
}

/**
 * `.masthead` — 화면 맨 위의 한 줄 (정본 §6 「하나의 초점」).
 *
 * 여기 있는 것은 **어느 리포인가**와 **어디로 갈 수 있는가** 둘뿐이다. 날짜·연속 학습·
 * 평균 숙련도가 있던 「오늘 요약」 넉 칸은 뺐다 — 넷 다 읽고 나서 할 일이 바뀌지 않는
 * 숫자라 작업 기억만 쓴다. 연속 학습은 오늘 카드가 한 줄로 말한다.
 *
 * 장식 스위치(D179 의 「장식 숨김」)는 없앴다 — D182 가 장식을 토큰째 지웠으니 끌 것이 없다.
 * 밝게·어둡게는 남는다: 방의 밝기에 따라 실제로 매일 바뀌는 값이고, 설정까지 두 걸음을
 * 걸어야 한다면 안 바꾸게 된다. 감축 모션·표시 언어는 설정 한 곳에 있다.
 */
export function Topbar({ repoName, onCourse, onRepos, onSettings }: TopbarProps) {
  // 스위치의 상태와 저장은 `useAppearance` 가 들고, `<html>` 을 만지는 것도 그쪽뿐이다 —
  // 설정 화면이 같은 스위치를 들고 있어 둘이 각자 속성을 세우면 나중에 켠 쪽이 이긴다.
  const { theme, setTheme } = useAppearance();

  return (
    <header className="masthead">
      <div className="mh-in l-wrap l-row">
        {/* 상표 한 자리 (정본 §7). 로고 마크는 `packages/ui` 가 다시 만드는 중이라
            지금은 글자 상표만 선다 — 색을 UI 팔레트로 퍼뜨리지 않는다. */}
        <span className="mh-name">Chickadee</span>

        <div className="mh-repo">
          <span className="mh-repo-k" id="tk-repo">{t('home.tkRepo')}</span>
          <RepoSwitcher repoName={repoName} />
        </div>

        <nav className="mh-nav l-push" aria-label={t('home.nav')}>
          <button type="button" className="mh-link" onClick={onCourse}>{t('home.course')}</button>
          <button type="button" className="mh-link" onClick={onRepos}>{t('home.repos')}</button>
          <button type="button" className="mh-link" onClick={onSettings}>{t('home.settings')}</button>
          <Switch
            options={themeOptions()}
            value={theme}
            label={t('settings.look.themeSwitch')}
            onChange={setTheme}
          />
        </nav>
      </div>
    </header>
  );
}
