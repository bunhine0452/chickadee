import { t } from '@chickadee/i18n';
import { RichText } from '@chickadee/ui';
import { useId } from 'react';

import type { HomeGap } from '../../screens/home/data';
import './GapList.css';

export interface GapListProps {
  gaps: readonly HomeGap[];
  /** 04 §3.1 순위 ②를 통과하는 필사 블록 수. 0 이면 T1 이 아직 안 열린다 (D96). */
  openable: number;
  /** 인제스트된 파일 수. 0 이면 아직 읽은 것이 없어 안내할 것도 없다. */
  files: number;
  /** 읽은 커밋 수. 0 이면 책임 배치 문제의 정답지가 없다 (D170 ⑤). */
  commits: number;
  /** 「문제 만들기」 — 이 개념으로 오늘 목록에 문제를 하나 건다. */
  onMake: (conceptId: string) => void;
}

/** 화면에 보이는 이름. 토큰이 있으면 코드가 더 잘 읽힌다. */
function labelOf(gap: HomeGap): string {
  return gap.token === null || gap.token.trim() === '' ? gap.nameKo : gap.token;
}

/**
 * `.gaps` — 아직 안 배운 문법 (02 §7.1 · 03 §6).
 *
 * 목록을 접지 않는다 — 「문제 만들기」가 홈에서 할 수 있는 두 번째 동작이고, 다른 화면의
 * 문구(`prereq.noPlate`)가 그 단추를 가리킨다.
 *
 * 뺀 것 — 등장 횟수 막대(`--f`)와 첫 줄 강조(`.hot`). 횟수가 바로 옆에 숫자로 적혀 있어
 * 막대는 같은 말을 두 번 하고, 순서가 이미 많은 것부터다.
 *
 * 「아직 못 하는 것」 둘이 여기 아래 붙는다 — T1 필사가 왜 안 열렸나(D96)와 책임 배치
 * 문제를 왜 못 만드나(D170 ⑤). 둘 다 「지금은 안 된다, 이유는 이것이다」라 한 자리에
 * 모으면 같은 문장으로 읽힌다. 미조판 예고 판 두 장이 하던 일이 이 두 문단이다.
 */
export function GapList({ gaps, openable, files, commits, onMake }: GapListProps) {
  const uid = useId();
  const locked = openable === 0 && files > 0;
  const noCommits = files > 0 && commits === 0;

  return (
    <section className="gaps-sec" aria-labelledby={`${uid}-h`}>
      <div className="gaps-head">
        <h2 id={`${uid}-h`}>{t('home.gapsTitle')}</h2>
        <p className="gaps-sum">{t('home.gapsPlain')}</p>
      </div>

      {gaps.length === 0 ? (
        <p className="note gaps-empty">{t('home.gapsEmpty')}</p>
      ) : (
        <ul className="gaps" aria-label={t('home.gapsTitle')}>
          {gaps.map((gap) => {
            const label = labelOf(gap);
            return (
              <li key={gap.conceptId} className="gap">
                <code className="tok">{label}</code>
                <RichText className="cnt" html={t('home.gapsCount', { n: String(gap.siteCount) })} />
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
      )}

      <p className="note gaps-note">{t('home.gapsNote')}</p>

      {locked ? (
        <div className="gaps-locked">
          <b className="gaps-locked-k">{t('home.lockedTitle')}</b>
          <p>{t('home.lockedBody')}</p>
          <p className="how">{t('home.lockedHow')}</p>
        </div>
      ) : null}

      {noCommits ? (
        <div className="gaps-locked forecast">
          <b className="gaps-locked-k">{t('home.forecastTitle')}</b>
          <RichText as="p" html={t('home.forecastCannot', { n: String(commits) })} />
        </div>
      ) : null}
    </section>
  );
}
