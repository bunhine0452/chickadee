/**
 * 4단 수정 — `patch-line`(한 줄 고치기) · `rollback`(고치기 전을 쓰기) · `patch-place`(자리 고르기).
 * 정답지는 실제 `fix:` 커밋이다. 한 줄 편집은 한 칸짜리 편집기(textarea)로 충분하다 —
 * Monaco 는 5단(`ReimplPlate`)이 든다.
 *
 * `patch-place` 는 줄 사이의 자리 단추를 고른다 — 정답은 하나가 아니다(`checkPlace` 의
 * 스코프 검사). 그래서 채점 뒤 「이 자리도 맞다」가 진단 대신 뜬다.
 */
import type { StageAnswer, StageVerdict } from '@chickadee/grading';
import { t } from '@chickadee/i18n';
import type { InkLayer } from '@chickadee/ui';
import { cx, Kbd, PressButton, RichText } from '@chickadee/ui';
import { useCallback, useEffect, useState } from 'react';

import { Ask } from '../../components/plate/Ask.js';
import { usePlateKeys } from './keys.js';
import { PlateFrame, sourceOf } from './PlateFrame.js';
import type { StageCardView } from './run.js';

export interface RepairPlateProps {
  card: StageCardView;
  no: number;
  unitName: string;
  conceptName: string;
  layer: InkLayer;
  verdict: StageVerdict | null;
  stuckOpen: boolean;
  onGrade: (answer: StageAnswer) => void;
  onNext: () => void;
  onDunno: () => void;
  after?: React.ReactNode;
}

export function RepairPlate(props: RepairPlateProps): React.JSX.Element | null {
  const { card, verdict } = props;
  const p = card.payload;
  const repair = p.track === 't3' && p.kind === 'repair' ? p : null;
  const [text, setText] = useState('');
  const [at, setAt] = useState<number | null>(null);

  useEffect(() => {
    if (repair === null) return;
    setText(repair.type === 'patch-line' ? repair.lines[repair.target] ?? '' : '');
    setAt(null);
  }, [card.id, repair]);

  const answered = verdict !== null;
  const isPlace = repair?.type === 'patch-place';
  const canSubmit = isPlace ? at !== null : text.trim() !== '';

  const grade = useCallback(() => {
    if (repair === null || answered || !canSubmit) return;
    if (repair.type === 'patch-place') {
      if (at !== null) props.onGrade({ kind: 'place', at });
      return;
    }
    const mine = text.split('\n');
    if (repair.type === 'patch-line') {
      const lines = [...repair.lines];
      lines[repair.target] = mine[0] ?? '';
      props.onGrade({ kind: 'lines', lines });
      return;
    }
    props.onGrade({ kind: 'lines', lines: mine });
  }, [repair, answered, canSubmit, at, text, props]);

  usePlateKeys({
    answered, canSubmit,
    onSubmit: grade, onGrade: grade, onNext: props.onNext, onDunno: props.onDunno,
  });

  if (repair === null) return null;
  const lineNo = (i: number): string => String(repair.from + i);
  const inserted = repair.expected[0] ?? '';

  return (
    <PlateFrame
      card={card}
      no={props.no}
      unitName={props.unitName}
      conceptName={props.conceptName}
      layer={props.layer}
      verdict={verdict}
      source={sourceOf(repair.file, repair.from + repair.target)}
      hint={answered ? t('session.hintNextPlate') : isPlace ? t('chapter.hintPlace') : t('chapter.hintEdit')}
      stuckOpen={props.stuckOpen}
      onDunno={props.onDunno}
      {...(props.after === undefined ? {} : { after: props.after })}
      right={answered ? (
        <PressButton tone="blue" onClick={props.onNext}>
          {t('session.next')} <Kbd keys="Space" />
        </PressButton>
      ) : (
        <PressButton tone="pink" disabled={!canSubmit} onClick={grade}>
          {t('chapter.grade')} <Kbd keys={isPlace ? 'Enter' : '⌘↵'} />
        </PressButton>
      )}
    >
      <Ask q={repair.q} hint={t('chapter.repairGoal', { goal: repair.goal })} />
      <p className="note cc-commit">
        <RichText html={t('chapter.repairCommit', { h: repair.commit.h, d: repair.commit.d, m: repair.commit.m })} />
      </p>

      {isPlace ? (
        <>
          <pre className="cc-inserted"><code>{inserted}</code></pre>
          <ol className="cc-window" aria-label={t('chapter.repairEditor')}>
            {repair.lines.map((line, i) => (
              <li key={i}>
                <Slot i={i} at={at} answered={answered} onPick={setAt} />
                <span className="cc-ln">{lineNo(i)}</span>
                <code>{line}</code>
              </li>
            ))}
            <li key="end">
              <Slot i={repair.lines.length} at={at} answered={answered} onPick={setAt} end />
            </li>
          </ol>
        </>
      ) : (
        <ol className="cc-window" aria-label={t('chapter.repairEditor')}>
          {repair.lines.map((line, i) => (
            <li key={i} className={cx(i === repair.target && 'target')}>
              <span className="cc-ln">{lineNo(i)}</span>
              {i === repair.target && repair.type === 'patch-line' ? (
                <textarea
                  className="cc-line"
                  aria-label={t('chapter.repairLine', { n: lineNo(i) })}
                  rows={1}
                  value={text}
                  disabled={answered}
                  spellCheck={false}
                  onChange={(e) => setText(e.target.value.replace(/\n/g, ''))}
                />
              ) : <code>{line}</code>}
            </li>
          ))}
        </ol>
      )}

      {repair.type === 'rollback' ? (
        <textarea
          className="cc-editor"
          aria-label={t('chapter.repairEditor')}
          rows={Math.max(3, repair.expected.length + 1)}
          value={text}
          disabled={answered}
          spellCheck={false}
          onChange={(e) => setText(e.target.value)}
        />
      ) : null}
    </PlateFrame>
  );
}

function Slot(props: { i: number; at: number | null; answered: boolean; onPick: (i: number) => void; end?: boolean }): React.JSX.Element {
  const on = props.at === props.i;
  return (
    <button
      type="button"
      className={cx('cc-slot', on && 'on')}
      aria-pressed={on}
      disabled={props.answered}
      onClick={() => props.onPick(props.i)}
    >
      {props.end ? t('chapter.placeEnd') : t('chapter.placeAt', { n: String(props.i + 1) })}
    </button>
  );
}
