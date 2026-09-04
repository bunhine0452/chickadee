import { t } from '@chickadee/i18n';
import { Dee, Passes } from '@chickadee/ui';

import type { HomeRetake } from '../../screens/home/data';
import { dueLabel, inkTrack, isSoon, trackName } from './labels';
import './ConceptList.css';

export interface ConceptListProps {
  rows: readonly HomeRetake[];
  /**
   * 만기 라벨의 기준 시각. 기본값은 지금 — 테스트는 고정값을 넣어 문구를 못 박는다.
   */
  now?: number | undefined;
}

/** `.conc` — 「다시 찍을 개념」. 겹은 색이 아니라 `Passes` 의 문장이 나른다 (05 §9). */
export function ConceptList({ rows, now }: ConceptListProps) {
  const at = now ?? Date.now();

  if (rows.length === 0) {
    return <p className="note">{t('home.retakeEmpty')}</p>;
  }

  return (
    <ul className="conc" aria-label={t('home.retake')}>
      {rows.map((row) => {
        const track = inkTrack(row.track);
        return (
          <li key={row.conceptId} className="cn">
            <Dee ly={row.layer} sticker />
            <span className="nm">
              {row.token === null ? null : <code>{row.token}</code>}
              {row.token === null ? '' : ' '}
              {row.nameKo}
            </span>
            <span className={isSoon(row.dueAt, at) ? 'due soon' : 'due'}>{dueLabel(row.dueAt, at)}</span>
            <Passes
              n={row.layer}
              track={track}
              label={t('home.passesLabel', { track: trackName(row.track), n: String(row.layer) })}
            />
          </li>
        );
      })}
    </ul>
  );
}
