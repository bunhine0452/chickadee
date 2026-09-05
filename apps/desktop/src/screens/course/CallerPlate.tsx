/**
 * 2단 `caller` — 「이 함수를 부르는 자리는」. 파일 목록에서 고른다 (t2 `radius` 모양).
 * 채점은 `gradePicks` 를 빌린다 — 빠뜨린 것도 잘못 고른 것도 없어야 통과다.
 */
import type { StageAnswer, StageVerdict } from '@chickadee/grading';
import { t } from '@chickadee/i18n';
import type { InkLayer } from '@chickadee/ui';
import { cx, Kbd, PressButton } from '@chickadee/ui';
import { useCallback, useEffect, useState } from 'react';

import { Ask } from '../../components/plate/Ask.js';
import { usePlateKeys } from './keys.js';
import { PlateFrame, sourceOf } from './PlateFrame.js';
import type { StageCardView } from './run.js';

export interface CallerPlateProps {
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

const baseName = (p: string): string => p.slice(p.lastIndexOf('/') + 1);

export function CallerPlate(props: CallerPlateProps): React.JSX.Element | null {
  const { card, verdict } = props;
  const p = card.payload;
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setSelected([]);
  }, [card.id]);

  const answered = verdict !== null;
  const toggle = useCallback((path: string) => {
    if (answered) return;
    setSelected((prev) => (prev.includes(path) ? prev.filter((x) => x !== path) : [...prev, path]));
  }, [answered]);

  const grade = useCallback(() => {
    if (answered || selected.length === 0) return;
    props.onGrade({ kind: 'picks', selected });
  }, [answered, selected, props]);

  usePlateKeys({
    answered, canSubmit: selected.length > 0,
    onSubmit: grade, onGrade: grade, onNext: props.onNext, onDunno: props.onDunno,
  });

  if (p.track !== 't2' || p.kind !== 'radius') return null;
  const target = Object.keys(p.core).find((k) => p.core[k]?.[0] === 'target') ?? p.files[0]?.p ?? '';
  const right = answered ? new Set([...Object.keys(p.core), ...Object.keys(p.sec)]) : null;

  return (
    <PlateFrame
      card={card}
      no={props.no}
      unitName={props.unitName}
      conceptName={props.conceptName}
      layer={props.layer}
      verdict={verdict}
      source={sourceOf(target, null)}
      hint={answered ? t('session.hintNextPlate') : t('chapter.hintPicks')}
      stuckOpen={props.stuckOpen}
      onDunno={props.onDunno}
      {...(props.after === undefined ? {} : { after: props.after })}
      right={answered ? (
        <PressButton tone="blue" onClick={props.onNext}>
          {t('session.next')} <Kbd keys="Space" />
        </PressButton>
      ) : (
        <PressButton tone="pink" disabled={selected.length === 0} onClick={grade}>
          {t('chapter.grade')} <Kbd keys="⌘↵" />
        </PressButton>
      )}
    >
      <Ask q={p.q} hint={p.hint} />
      <ul className="cc-picks" aria-label={t('chapter.pickFiles')}>
        {p.files.map((f) => {
          const on = selected.includes(f.p);
          const isRight = right?.has(f.p) ?? false;
          return (
            <li key={f.p}>
              <button
                type="button"
                className={cx('cc-pick', on && 'on', answered && isRight && 'right', answered && on && !isRight && 'wrong')}
                aria-pressed={on}
                disabled={answered}
                onClick={() => toggle(f.p)}
                title={f.p}
              >
                <code>{baseName(f.p)}</code>
                <small>{f.p}</small>
              </button>
            </li>
          );
        })}
      </ul>
    </PlateFrame>
  );
}
