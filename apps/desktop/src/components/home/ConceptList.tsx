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
    return <p className="note">다시 찍을 개념이 아직 없습니다. 첫 판을 찍으면 여기에 쌓입니다.</p>;
  }

  return (
    <ul className="conc" aria-label="다시 찍을 개념">
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
            <Passes n={row.layer} track={track} label={`${trackName(row.track)} · 잉크 ${row.layer}겹`} />
          </li>
        );
      })}
    </ul>
  );
}
