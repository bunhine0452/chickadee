import { t } from '@chickadee/i18n';

import { RepoSwitcher } from '../../screens/repos/RepoSwitcher.js';
import './Topbar.css';

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
 * 밝게·어둡게도 없앴다 (D187 ⑫): 기본이 **시스템 따름**이라 방이 어두워지면 앱이 알아서
 * 따라가고, 그것을 덮어쓰는 것은 한 번 정하고 마는 일이라 설정 화면 몫이다. 헤더에 남겨
 * 두면 매일 바꾸라는 뜻이 되고, 그 한 칸이 「어디로 갈 수 있는가」 옆에서 항해가 아닌
 * 것을 항해처럼 보이게 한다. 감축 모션·표시 언어와 같은 자리에 있다.
 */
export function Topbar({ repoName, onCourse, onRepos, onSettings }: TopbarProps) {
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
        </nav>
      </div>
    </header>
  );
}
