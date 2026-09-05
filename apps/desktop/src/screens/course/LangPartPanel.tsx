/**
 * 부 하나의 패널 — 판 목록과 「이 판 풀기」 (D190).
 *
 * 판마다 어디서 오는지를 적는다: 내 코드의 자리 · 사전 예제(곧 내 코드에서) · 「네 코드엔
 * 없다」와 그 사유. 셋 중 무엇이든 열린다 — 여는 일은 `pickCoursePlateNow` 가 하고 이 패널은
 * 단추를 잇는다. 접힌 부도 판을 지우지 않는다(D136 의 칩과 같다) — 열면 열린다.
 */
import type { AbsenceReason } from '@chickadee/cards';
import { t, type MessageKey } from '@chickadee/i18n';
import { FlatButton } from '@chickadee/ui';

import { PART_KEY } from './LangCourse.js';
import type { LangPartView, LangPlateView } from './lang-data.js';

const ABSENT_SHORT: Readonly<Record<AbsenceReason, MessageKey>> = {
  framework: 'chapter.absentFramework',
  library: 'chapter.absentLibrary',
  scale: 'chapter.absentScale',
  idiom: 'chapter.absentIdiom',
  'no-files': 'chapter.absentNoFiles',
};

/** 판 한 장의 출처 한 줄. */
export function plateStatus(p: LangPlateView): string {
  if (p.siteId !== null) return t('chapter.plateMine');
  if (p.previewSiteId !== null) return t('chapter.platePreview');
  if (p.absent !== null) return `${t('chapter.plateAbsent')} · ${t(ABSENT_SHORT[p.absent])}`;
  return t('chapter.platePreview');
}

export interface LangPartPanelProps {
  part: LangPartView;
  busy: boolean;
  onOpen: (plate: LangPlateView) => void;
}

export function LangPartPanel(props: LangPartPanelProps): React.JSX.Element {
  const { part } = props;
  const mine = part.plates.filter((p) => p.siteId !== null).length;
  const absent = part.plates.filter((p) => p.absent !== null).length;
  const synthetic = part.plates.length - mine - absent;

  return (
    <section className="cc-panel cc-part" aria-label={t(PART_KEY[part.part])}>
      <header className="cc-panel-head">
        <h2>
          {t('chapter.partNo', { n: String(part.part) })} {t(PART_KEY[part.part])}
          <span className="pl">{t('chapter.partPlain')}</span>
        </h2>
      </header>

      {part.plates.length === 0 ? (
        <p className="note">{t('chapter.partNoPlates')}</p>
      ) : (
        <p className="note">
          {t('chapter.partTally', {
            total: String(part.plates.length), mine: String(mine),
            synthetic: String(synthetic), absent: String(absent),
          })}
        </p>
      )}
      {part.folded ? <p className="note">{t('chapter.partFoldedNote')}</p> : null}

      {part.plates.length === 0 ? null : (
        <ol className="cc-plates">
          {part.plates.map((p) => (
            <li key={p.conceptId} className="cc-plate">
              <span className="cc-plate-name u-truncate" title={p.conceptId}>{p.name}</span>
              <span className="cc-plate-st">
                {plateStatus(p)}
                {p.layer > 0 ? ` · ${t('chapter.plateLayer', { n: String(p.layer) })}` : ''}
              </span>
              <FlatButton ghost disabled={props.busy} onClick={() => props.onOpen(p)}>
                {t('chapter.plateOpen')}
              </FlatButton>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
