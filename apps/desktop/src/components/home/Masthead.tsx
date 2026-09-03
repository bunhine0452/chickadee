import { useEffect, useRef, useState } from 'react';
import { DeeLogo, Switch } from '@chickadee/ui';

import { measure } from '../../devtools/audit';
import type { HomeMasthead } from '../../screens/home/data';
import './Masthead.css';

export type Theme = 'light' | 'dark';
export type Trim = 'off' | 'on';

const THEME_OPTIONS = [
  { v: 'light' as const, label: '주간반' },
  { v: 'dark' as const, label: '야간반' },
];

const TRIM_OPTIONS = [
  { v: 'off' as const, label: '부속 보임' },
  { v: 'on' as const, label: '부속 숨김' },
];

export interface MastheadProps {
  repoName: string;
  /** `YYYY-MM-DD`. 하루 경계는 `@chickadee/scheduler` 가 이미 적용한 뒤다. */
  today: string;
  /** 연속 인쇄 일수. 진도를 열지 않는다 — 숫자만 보여 준다 (정본 §3). */
  streak: number;
  masthead: HomeMasthead;
}

/**
 * `.masthead` — 인쇄 작업 지시서.
 *
 * 스위치 두 개는 여기서 상태를 들고 `<html data-theme|data-trim>` 을 직접 세운다.
 * 설정 화면(05 §2.1 `settings`)이 생기면 그쪽으로 옮겨 간다 — 그때까지 저장은 없다.
 */
export function Masthead({ repoName, today, streak, masthead }: MastheadProps) {
  const [theme, setTheme] = useState<Theme>('light');
  const firstRun = useRef(true);
  const [trim, setTrim] = useState<Trim>('off');

  useEffect(() => {
    // 05 §10 `theme:switch` 예산 100ms — 토큰을 갈아 끼우고 **다시 계산까지** 끝나는 데까지다.
    // `offsetHeight` 를 읽어 재계산을 그 자리에서 끝낸다(안 그러면 다음 프레임에 밀린다).
    //
    // **첫 실행은 재지 않는다.** 마운트 때의 이 효과는 전환이 아니라 홈 전체의 첫 조판이라
    // 같은 이름으로 세면 예산이 늘 초과로 보인다(실측 138ms 대 237ms).
    if (firstRun.current) {
      firstRun.current = false;
      document.documentElement.setAttribute('data-theme', theme);
      return;
    }
    measure('theme:switch', () => {
      document.documentElement.setAttribute('data-theme', theme);
      void document.documentElement.offsetHeight;
    });
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-trim', trim);
  }, [trim]);

  return (
    <header className="masthead grain">
      <div className="brand">
        <DeeLogo />
        <div>
          <div className="wordmark" data-w="CHICKADEE">
            <span>CHICKADEE</span>
          </div>
          <div className="brand-sub">Risograph Study Press</div>
          <div className="brand-line">내 코드가 교재인 인쇄소</div>
        </div>
      </div>

      <div className="ticket" role="group" aria-label="작업 지시서">
        <div className="tk">
          <span className="tk-k" id="tk-repo">
            리포
          </span>
          {/* 리포 전환은 M2 의 RepoSwitcher(listbox) 자리다 — 지금은 이름만 보여 준다. */}
          <button
            type="button"
            className="tk-v mono repo-switch"
            aria-haspopup="listbox"
            aria-expanded={false}
            aria-labelledby="tk-repo"
            disabled
          >
            {repoName}
          </button>
        </div>
        <div className="tk">
          <span className="tk-k">날짜</span>
          <span className="tk-v mono">{today}</span>
        </div>
        <div className="tk">
          <span className="tk-k">연속 인쇄</span>
          <span className="tk-v">
            {streak}
            <span className="u">일</span>
          </span>
        </div>
        <div className="tk">
          <span className="tk-k">개념 잉크</span>
          <span className="tk-v">
            {masthead.avgLayer.toFixed(1)}
            <span className="u">겹 평균</span>
          </span>
        </div>
      </div>

      <div className="ctl">
        <Switch
          options={TRIM_OPTIONS}
          value={trim}
          label="인쇄 부속 보이기 · 숨기기"
          onChange={setTrim}
        />
        <Switch options={THEME_OPTIONS} value={theme} label="주간반 · 야간반 전환" onChange={setTheme} />
      </div>
    </header>
  );
}
