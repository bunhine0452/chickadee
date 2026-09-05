/**
 * 2단 `hop` — 「버튼을 누르면 어느 파일이 순서대로 도나」. 카드 덱(`FlowDeck`)을 위에서 아래로
 * 세운다. 지도 판(`DependencyMap`)의 껍데기는 세션의 것이라 안 빌리고 덱만 쓴다 — 2단이
 * 재는 것은 순서이고 지도는 읽는 자리다 (04 §8.3).
 *
 * 2단은 부분점수가 없다 (`mastery.md` §3.2) — 채점 뒤 정답 순서를 그대로 편다.
 * 막힘이면 경로가 3칸으로 접혀 다시 온다(`foldFlow`) — 덱이 짧아지고 문구가 그것을 말한다.
 */
import type { StageAnswer, StageVerdict } from '@chickadee/grading';
import { t } from '@chickadee/i18n';
import type { InkLayer } from '@chickadee/ui';
import { Kbd, PressButton, RichText } from '@chickadee/ui';
import { useCallback, useEffect, useState } from 'react';

import { Ask } from '../../components/plate/Ask.js';
import { FlowDeck } from '../../components/t2/FlowDeck.js';
import { usePlateKeys } from './keys.js';
import { PlateFrame, sourceOf } from './PlateFrame.js';
import type { StageCardView } from './run.js';

export interface HopPlateProps {
  card: StageCardView;
  no: number;
  unitName: string;
  conceptName: string;
  layer: InkLayer;
  verdict: StageVerdict | null;
  stuckOpen: boolean;
  /** 막힘으로 접힌 판이면 참 — 덱 위에 한 줄을 낸다. */
  folded: boolean;
  onGrade: (answer: StageAnswer) => void;
  onNext: () => void;
  onDunno: () => void;
  after?: React.ReactNode;
}

const baseName = (p: string): string => p.slice(p.lastIndexOf('/') + 1);

export function HopPlate(props: HopPlateProps): React.JSX.Element | null {
  const { card, verdict } = props;
  const p = card.payload;
  const [ordered, setOrdered] = useState<readonly string[]>([]);

  useEffect(() => {
    setOrdered([]);
  }, [card.id, props.folded]);

  const answered = verdict !== null;
  const grade = useCallback(() => {
    if (answered || ordered.length === 0) return;
    props.onGrade({ kind: 'order', ordered });
  }, [answered, ordered, props]);

  usePlateKeys({
    answered, canSubmit: ordered.length > 0,
    onSubmit: grade, onGrade: grade, onNext: props.onNext, onDunno: props.onDunno,
  });

  if (p.track !== 't2' || p.flow === undefined) return null;
  const entry = p.files[0]?.p ?? '';

  return (
    <PlateFrame
      card={card}
      no={props.no}
      unitName={props.unitName}
      conceptName={props.conceptName}
      layer={props.layer}
      verdict={verdict}
      source={sourceOf(entry, null)}
      hint={answered ? t('session.hintNextPlate') : t('chapter.hintOrder')}
      stuckOpen={props.stuckOpen}
      onDunno={props.onDunno}
      {...(props.after === undefined ? {} : { after: props.after })}
      right={answered ? (
        <PressButton tone="blue" onClick={props.onNext}>
          {t('session.next')} <Kbd keys="Space" />
        </PressButton>
      ) : (
        <PressButton tone="pink" disabled={ordered.length === 0} onClick={grade}>
          {t('chapter.grade')} <Kbd keys="⌘↵" />
        </PressButton>
      )}
    >
      <Ask q={p.q} hint={p.hint} />
      {props.folded ? <p className="note cc-folded">{t('chapter.stuckFolded')}</p> : null}
      <FlowDeck
        deck={p.flow.deck}
        ordered={answered ? p.flow.answer : ordered}
        {...(answered ? {} : { onOrder: setOrdered })}
      />
      <details className="cc-files">
        <summary>{t('chapter.files')}</summary>
        <ul>
          {p.files.map((f) => (
            <li key={f.p}><code title={f.p}>{baseName(f.p)}</code></li>
          ))}
        </ul>
      </details>
      {answered && verdict.detail.kind === 't2' && !verdict.ok ? (
        <p className="note cc-answer">
          <RichText html={verdict.detail.result.missed.concat(verdict.detail.result.wrong)
            .map((x) => `<b>${baseName(x)}</b>`).join(' · ')} />
        </p>
      ) : null}
    </PlateFrame>
  );
}
