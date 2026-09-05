/**
 * 선택형 판 — 2단 `exec`(t0 지목 모양)과 1·2·3단 t3 선택형 다섯(`twin`·`origin`·`cut`·
 * `reorder`·`contract`). 「고르기 → Enter → Space」 세 번이면 판 한 장이 끝난다 (정본 §3-8).
 *
 * `contract` 는 둘째 물음(이유 4지)이 붙는다 — 파일을 고른 뒤 「왜 그런가요?」가 열리고
 * 둘 다 골라야 확인이 켜진다. 채점은 `gradeStage` 가 두 답을 한 번에 본다.
 */
import type { StageAnswer, StageVerdict } from '@chickadee/grading';
import { t } from '@chickadee/i18n';
import type { InkLayer } from '@chickadee/ui';
import { Kbd, PressButton } from '@chickadee/ui';
import { useCallback, useEffect, useState } from 'react';

import { Ask } from '../../components/plate/Ask.js';
import { Choices, type ChoiceOption } from '../../components/plate/Choices.js';
import { CodePlate } from '../../components/plate/CodePlate.js';
import { usePlateKeys } from './keys.js';
import { PlateFrame, sourceOf } from './PlateFrame.js';
import type { StageCardView } from './run.js';

export interface ChoicePlateProps {
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

/** 보기가 파일 자리를 가리키면 그 자리를 글에 붙인다 — 「어디」가 답의 절반인 유형이 있다. */
function optionsOf(card: StageCardView): ChoiceOption[] {
  const p = card.payload;
  if (p.track === 't3' && (p.kind === 'twin' || p.kind === 'origin' || p.kind === 'cut' || p.kind === 'reorder' || p.kind === 'contract')) {
    return p.options.map((o) => ({
      t: o.f === undefined ? o.t : `${o.t} — ${baseName(o.f)}${o.l === undefined ? '' : `:${String(o.l)}`}`,
      ...(o.mono === undefined ? {} : { mono: o.mono }),
    }));
  }
  if (p.track === 't0') return (p.options ?? []).map((o) => ({ t: o.t, ...(o.mono === undefined ? {} : { mono: o.mono }) }));
  return [];
}

export function ChoicePlate(props: ChoicePlateProps): React.JSX.Element | null {
  const { card, verdict } = props;
  const p = card.payload;
  const [sel, setSel] = useState<number | null>(null);
  const [reasonSel, setReasonSel] = useState<number | null>(null);

  useEffect(() => {
    setSel(null);
    setReasonSel(null);
  }, [card.id]);

  const answered = verdict !== null;
  const pickable = p.track === 't0';
  const reason = p.track === 't3'
    && p.kind !== 'repair' && p.kind !== 'reimpl' && p.kind !== 'order' && p.kind !== 'trace'
    ? p.reason ?? null : null;
  const options = optionsOf(card);
  const canSubmit = sel !== null && (reason === null || reasonSel !== null);

  const choose = useCallback((k: number) => {
    if (answered) return;
    setSel(k - 1);
  }, [answered]);

  const submit = useCallback(() => {
    if (sel === null || !canSubmit) return;
    props.onGrade({ kind: 'choice', sel, ...(reasonSel === null ? {} : { reasonSel }) });
  }, [sel, canSubmit, reasonSel, props]);

  usePlateKeys({
    answered, canSubmit,
    onDigit: reason !== null && sel !== null ? (k) => setReasonSel(k - 1) : choose,
    onSubmit: submit, onNext: props.onNext, onDunno: props.onDunno,
  });

  // 채점하면 고른 보기가 `disabled` 가 된다 — 포커스를 다음 동작 단추로 옮긴다 (T0Plate 와 같다).
  useEffect(() => {
    if (!answered) return;
    document.querySelector<HTMLElement>('.acts .press-btn')?.focus();
  }, [answered]);

  if (p.track !== 't0' && p.track !== 't3') return null;
  // `t3` 인데 선택형이 **아닌** 판 — 4·5단 편집기 둘과 형식 둘(D187 ⑱). 집합이 아니라 비교로
  // 적는 이유는 좁히기다: `Set.has` 는 `payload` 를 안 좁히고 `!==` 연쇄는 좁힌다.
  if (p.track === 't3' && (p.kind === 'repair' || p.kind === 'reimpl' || p.kind === 'order' || p.kind === 'trace')) {
    return null;
  }

  const answer = p.answer;
  const selectedPick = sel === null ? null : sel + 1;

  return (
    <PlateFrame
      card={card}
      no={props.no}
      unitName={props.unitName}
      conceptName={props.conceptName}
      layer={props.layer}
      verdict={verdict}
      source={sourceOf(p.file, p.focus)}
      hint={answered ? t('session.hintNextPlate') : t('session.hintConfirm')}
      stuckOpen={props.stuckOpen}
      onDunno={props.onDunno}
      {...(props.after === undefined ? {} : { after: props.after })}
      right={answered ? (
        <PressButton tone="blue" onClick={props.onNext}>
          {t('session.next')} <Kbd keys="Space" />
        </PressButton>
      ) : (
        <PressButton tone="pink" disabled={!canSubmit} onClick={submit}>
          {t('session.confirm')} <Kbd keys="Enter" />
        </PressButton>
      )}
    >
      <Ask q={p.q} hint={p.hint} />
      <CodePlate
        lines={p.lines}
        pickable={pickable}
        selected={pickable ? selectedPick : null}
        answer={pickable && answered ? answer + 1 : null}
        onPick={choose}
      />
      {pickable ? null : (
        <Choices
          options={options}
          selected={selectedPick}
          answer={answered ? answer + 1 : null}
          onSelect={choose}
        />
      )}
      {reason === null || sel === null ? null : (
        <div className="cc-reason">
          <Ask q={reason.q} hint={t('chapter.reasonAsk')} />
          <Choices
            options={reason.options.map((o) => ({ t: o.t }))}
            selected={reasonSel === null ? null : reasonSel + 1}
            answer={answered ? reason.answer + 1 : null}
            onSelect={(k) => { if (!answered) setReasonSel(k - 1); }}
          />
        </div>
      )}
    </PlateFrame>
  );
}
