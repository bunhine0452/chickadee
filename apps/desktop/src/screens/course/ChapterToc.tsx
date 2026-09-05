/**
 * 코스 목차 — 챕터 · 막간과 부록 · 졸업 (D171 ①). 진도는 **단**으로 적는다 — 겹이 아니다.
 *
 * 해금은 열이 아니라 순서다(`chapter.today`): 앞 챕터가 통과 전이면 뒤는 「앞 챕터부터」로
 * 적히고 눌러도 시작 단추가 안 뜬다. 막간·부록(디렉터리 챕터)은 순서에 안 걸린다.
 */
import { t } from '@chickadee/i18n';
import { cx } from '@chickadee/ui';

import type { ChapterView, DeadRow } from './data.js';
import { stageKey } from './run.js';

/** 「졸업」 행의 선택값. 챕터 id 는 양수라 겹치지 않는다. */
export const GRAD_ID = -1;

export interface ChapterTocProps {
  chapters: readonly ChapterView[];
  selected: number | null;
  todayUnitId: number | null;
  due: ReadonlySet<number>;
  dead: readonly DeadRow[];
  onSelect: (unitId: number) => void;
}

/** 챕터 한 줄의 상태 낱말 — 통과 · 재검 만기 · 오늘은 접음 · 앞 챕터부터 · N단. */
export function statusOf(c: ChapterView, due: ReadonlySet<number>, dayKey?: string): string {
  if (due.has(c.unitId)) return t('chapter.dueNow');
  if (c.row.passedAt !== null) return t('chapter.passed');
  if (c.locked) return t('chapter.locked');
  if (dayKey !== undefined && c.deferredDay === dayKey) return t('chapter.deferred');
  const reached = c.row.stageReached;
  return reached === 0 ? t('chapter.stage0') : t(stageKey(reached as 1 | 2 | 3 | 4 | 5));
}

export function ChapterToc(props: ChapterTocProps): React.JSX.Element {
  const entry = props.chapters.filter((c) => c.origin === 'entry');
  const extra = props.chapters.filter((c) => c.origin === 'dir');
  const passed = entry.filter((c) => c.row.passedAt !== null).length;
  const pct = entry.length === 0 ? 0 : Math.round((passed / entry.length) * 100);

  const row = (c: ChapterView, no: string): React.JSX.Element => {
    const here = props.selected === c.unitId;
    return (
      <li key={c.unitId} className={cx('cc-row', here && 'cur', c.locked && 'locked', c.unitId === props.todayUnitId && 'today')}>
        <button
          type="button"
          className="cc-rowbtn"
          aria-current={here ? 'true' : undefined}
          onClick={() => props.onSelect(c.unitId)}
        >
          <span className="cc-no">{no}</span>
          <span className="cc-name">{c.name}</span>
          <span className="cc-st">{statusOf(c, props.due)}</span>
        </button>
      </li>
    );
  };

  return (
    <aside className="cc-toc" aria-label={t('chapter.tocLabel')}>
      <div className="cc-toc-head">
        <b>{t('chapter.count', { done: String(passed), total: String(entry.length) })}</b>
        <div
          className="cc-bar"
          role="img"
          aria-label={t('chapter.pct', { n: String(pct) })}
          data-fill={pct === 0 ? 'empty' : pct === 100 ? 'full' : 'part'}
          style={{ '--pct': `${pct}%` } as React.CSSProperties}
        >
          <i aria-hidden="true" />
        </div>
      </div>

      <h3>{t('chapter.secChapters')}</h3>
      <ol className="cc-rows">
        {entry.map((c, i) => row(c, t('chapter.no', { n: String(i + 1) })))}
      </ol>

      {extra.length === 0 ? null : (
        <>
          <h3>{t('chapter.secExtra')}</h3>
          <ol className="cc-rows">
            {extra.map((c) => row(c, '·'))}
          </ol>
        </>
      )}

      <h3>{t('chapter.secGrad')}</h3>
      <ol className="cc-rows">
        <li className={cx('cc-row', props.selected === GRAD_ID && 'cur')}>
          <button
            type="button"
            className="cc-rowbtn"
            aria-current={props.selected === GRAD_ID ? 'true' : undefined}
            onClick={() => props.onSelect(GRAD_ID)}
          >
            <span className="cc-no">·</span>
            <span className="cc-name">{t('chapter.grad')}</span>
            <span className="cc-st">{String(props.dead.length)}</span>
          </button>
        </li>
      </ol>
    </aside>
  );
}
