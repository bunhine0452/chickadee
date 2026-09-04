import { t } from '@chickadee/i18n';
import { RichText } from '@chickadee/ui';
import type { CSSProperties } from 'react';

import type { HomeGap } from '../../screens/home/data';
import './GapsPanel.css';

export interface GapsPanelProps {
  gaps: readonly HomeGap[];
  /** 「판 만들기」 — 이 개념으로 오늘 인쇄 목록에 판을 하나 짠다. */
  onMake: (conceptId: string) => void;
}

/** 화면에 보이는 이름. 토큰이 있으면 코드가 더 잘 읽힌다. */
function labelOf(gap: HomeGap): string {
  return gap.token === null || gap.token.trim() === '' ? gap.nameKo : gap.token;
}

/**
 * `.gaps` — 「판이 없는 문법」. 내 코드엔 있는데 아직 판이 없는 개념 (02 §7.1 · 03 §6).
 * 막대 길이는 `--f`(등장 횟수 / 최대 등장 횟수)로만 들어간다.
 */
export function GapsPanel({ gaps, onMake }: GapsPanelProps) {
  if (gaps.length === 0) {
    return <p className="note">{t('home.gapsEmpty')}</p>;
  }

  return (
    <ul className="gaps" aria-label={t('home.gapsTitle')}>
      {gaps.map((gap) => {
        const label = labelOf(gap);
        const fill = { '--f': `${Math.round(Math.max(0, Math.min(1, gap.fill)) * 100)}%` } as CSSProperties;
        return (
          <li key={gap.conceptId} className={gap.hot ? 'gap hot' : 'gap'}>
            <code className="tok">{label}</code>
            <span className="cnt">
              <RichText html={t('home.gapsCount', { n: String(gap.siteCount) })} />
              <i className="bar" aria-hidden="true">
                <i style={fill} />
              </i>
            </span>
            <button
              type="button"
              className="mk"
              aria-label={t('home.gapsMakeFor', { label })}
              onClick={() => onMake(gap.conceptId)}
            >
              {t('home.gapsMake')}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
