/**
 * 챕터 하나의 패널 — 진도 · 어휘 · 다음 걸음 (D171 ②③).
 *
 * 다음 걸음은 단이 정한다. 1단이면 어휘 관문(또는 다 찍었으면 판정), 2~5단이면 그 단의 판을
 * 건다. 4단 판이 없는 챕터는 3단까지가 통과이고(D165 기본값) 5단은 통과 조건이 아니다.
 * 재검 만기면 재검이 먼저다.
 */
import type { Dict } from '@chickadee/dictionary';
import { t } from '@chickadee/i18n';
import type { StageNo } from '@chickadee/store-sql';
import { PressButton } from '@chickadee/ui';

import type { Gate } from './gate.js';
import { conceptName, nextStage, targetOf, type ChapterView, type PathRow, type RangeRow } from './data.js';
import { EST_MIN, stageKey } from './run.js';
import { statusOf } from './ChapterToc.js';

export interface ChapterPanelProps {
  chapter: ChapterView;
  gate: Gate | null;
  paths: readonly PathRow[];
  ranges: readonly RangeRow[];
  dict: Dict;
  isDue: boolean;
  busy: boolean;
  dayKey: string;
  onGate: () => void;
  onJudgeReading: () => void;
  onStart: (stage: StageNo) => void;
  onRecheck: () => void;
}

/** 이 단의 판이 몇 분인가 — 카드 종류를 모르니 단의 평균으로 어림한다. */
const STAGE_EST: Readonly<Record<StageNo, number>> = {
  1: 0.5, 2: (EST_MIN.exec + EST_MIN.hop + EST_MIN.origin + EST_MIN.caller + EST_MIN['trace-table']) / 5,
  3: (EST_MIN.cut + EST_MIN.reorder + EST_MIN.contract) / 3,
  4: (EST_MIN['patch-line'] + EST_MIN['patch-place'] + EST_MIN.rollback) / 3,
  5: (EST_MIN['reimpl-spec'] + EST_MIN['reimpl-layer'] + EST_MIN.handoff + EST_MIN.order) / 4,
};

/** 다음에 걸 수 있는 단 — 판이 있는 첫 단. 4단이 비면 5단으로 건너뛴다. */
export function startableStage(c: ChapterView): StageNo | null {
  const from = nextStage(c);
  if (from === null || from === 1) return from;
  for (let s = from; s <= 5; s += 1) {
    if (c.counts[s as StageNo] > 0) return s as StageNo;
  }
  return null;
}

export function ChapterPanel(props: ChapterPanelProps): React.JSX.Element {
  const { chapter: c, gate } = props;
  const next = nextStage(c);
  const startable = startableStage(c);
  const target = targetOf(c);
  const vocabAll = c.vocab.total === 0 || c.vocab.zero.length === 0;
  const gateN = gate?.concepts.length ?? 0;

  return (
    <section className="cc-panel" aria-label={c.name}>
      <header className="cc-panel-head">
        <h2>{c.name}</h2>
        <span className="pl">{c.origin === 'entry' ? t('chapter.origin') : t('chapter.originDir')}</span>
        <span className="cc-panel-st">{statusOf(c, new Set(props.isDue ? [c.unitId] : []), props.dayKey)}</span>
      </header>

      <p className="cc-progress">
        {t('chapter.panelStage', { stage: c.row.stageReached === 0 ? t('chapter.stage0') : t(stageKey(c.row.stageReached as StageNo)) })}
        {c.row.passedAt === null ? null : (
          <> · {t('chapter.passedAt', { date: new Date(c.row.passedAt).toISOString().slice(0, 10) })}</>
        )}
      </p>

      <p className="note cc-vocab">
        {c.vocab.total === 0
          ? t('chapter.vocabNone')
          : vocabAll
            ? t('chapter.vocabAll', { total: String(c.vocab.total) })
            : t('chapter.vocab', { total: String(c.vocab.total), inked: String(c.vocab.inked) })}
      </p>

      {c.locked ? (
        <p className="note">{t('chapter.locked')}</p>
      ) : (
        <div className="cc-acts">
          {props.isDue ? (
            <PressButton disabled={props.busy} onClick={props.onRecheck}>
              {t('chapter.recheckBtn')}
            </PressButton>
          ) : null}

          {next === 1 ? (
            vocabAll ? (
              <PressButton disabled={props.busy} onClick={props.onJudgeReading}>
                {t('chapter.readingBtn')}
              </PressButton>
            ) : gateN > 0 ? (
              <PressButton disabled={props.busy} onClick={props.onGate}>
                {t('chapter.gateBtn', { n: String(gateN) })}
              </PressButton>
            ) : (
              <p className="note">{t('chapter.gateCap')}</p>
            )
          ) : null}

          {next !== null && next >= 2 ? (
            startable === null ? (
              <p className="note">{t('chapter.noCards')}</p>
            ) : (
              <PressButton disabled={props.busy} onClick={() => props.onStart(startable)}>
                {t('chapter.startStage', {
                  stage: t(stageKey(startable)),
                  n: String(c.counts[startable]),
                  min: String(Math.max(1, Math.round(c.counts[startable] * STAGE_EST[startable]))),
                })}
              </PressButton>
            )
          ) : null}

          {next === null ? <p className="note">{t('chapter.doneNoNext')}</p> : null}
        </div>
      )}

      {target === 3 && c.row.stageReached >= 3 && c.counts[4] === 0 ? <p className="note">{t('chapter.stage4None')}</p> : null}
      {target === 5 ? <p className="note">{t('chapter.targetRun')}</p> : null}
      {next === 5 ? <p className="note">{t('chapter.stage5Note')}</p> : null}

      {gate !== null && gate.cut > 0 && next === 1 && !vocabAll ? (
        <p className="note">{t('chapter.readingFailed', { n: String(gate.cut) })}</p>
      ) : null}

      <details className="cc-paths" open={props.paths.length <= 6}>
        <summary>{t('chapter.paths', { n: String(props.paths.length) })} · {t('chapter.ranges', { n: String(props.ranges.length) })}</summary>
        <ul>
          {props.paths.map((p) => (
            <li key={p.id}>
              <code>{p.label}</code>
              <small> · {p.path.slice(p.path.lastIndexOf('/') + 1)}:{p.entry_line} · {t('chapter.hops', { n: String(p.hop_count) })}</small>
            </li>
          ))}
        </ul>
      </details>

      {c.vocab.zero.length === 0 ? null : (
        <details className="cc-zero">
          <summary>{t('chapter.readingFailed', { n: String(c.vocab.zero.length) })}</summary>
          <ul>
            {c.vocab.zero.map((id) => <li key={id}>{conceptName(props.dict, id)}</li>)}
          </ul>
        </details>
      )}

    </section>
  );
}
