/**
 * `order` — 조각을 순서대로 세운다 (D187 ⑱ · `pedagogy.md` §2.2).
 *
 * 자리는 **5단의 1겹**이다. T1 페이딩이 이미 3겹이고 섞기는 그 앞의 0겹이라, 이 판이 서면
 * 5단이 「백지에서 바로」가 아니라 「섞인 것을 세우고 → 지워진 것을 채우고 → 백지」가 된다.
 *
 * 덱은 `FlowDeck`(2단 흐름 추적)과 **같은 모양·같은 CSS** 다. 다른 것은 하나뿐 — 조각의
 * 이름표가 파일 경로가 아니라 카드가 들고 온 글자(`pieces[].t`)라 여기서 따로 세운다.
 * 드래그는 없다. 자리를 옮기는 것은 `↑`·`↓` **단추**이고 마우스 없이 판이 완결된다
 * (정본 §3-8 · 05 §7).
 *
 * 채점 뒤에는 조각마다 **왜 그 자리인가**(`fact`)가 펴진다 — 사람이 적은 해설이 아니라
 * 재료의 사실이다.
 */
import type { StageAnswer, StageVerdict } from '@chickadee/grading';
import { t } from '@chickadee/i18n';
import type { InkLayer } from '@chickadee/ui';
import { Kbd, PressButton } from '@chickadee/ui';
import { useCallback, useEffect, useRef, useState } from 'react';

import '../../components/t2/FlowDeck.css';
import { Ask } from '../../components/plate/Ask.js';
import {
  flowAddLabel, flowDeckEmpty, flowDeckLabel, flowDropLabel, flowEmpty, flowMoveLabel,
  flowPathLabel,
} from '../session/t2Copy.js';
import { usePlateKeys } from './keys.js';
import { PlateFrame, sourceOf } from './PlateFrame.js';
import type { StageCardView } from './run.js';

export interface OrderPlateProps {
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

export function OrderPlate(props: OrderPlateProps): React.JSX.Element | null {
  const { card, verdict } = props;
  const p = card.payload;
  const [ordered, setOrdered] = useState<readonly string[]>([]);
  const listRef = useRef<HTMLOListElement | null>(null);
  const [refocus, setRefocus] = useState<{ seat: number; dir: 'up' | 'down' } | null>(null);

  useEffect(() => {
    setOrdered([]);
  }, [card.id]);

  // 자리를 옮긴 뒤 포커스를 따라가게 한다 — 안 그러면 키보드만 쓰는 사람이 목록 밖으로 튕긴다.
  useEffect(() => {
    if (refocus === null) return;
    const row = listRef.current?.querySelector(`.fcard[data-seat="${String(refocus.seat)}"]`);
    const same = row?.querySelector<HTMLButtonElement>(`.mv-${refocus.dir}:not([disabled])`);
    (same ?? row?.querySelector<HTMLButtonElement>('.mv:not([disabled])'))?.focus();
    setRefocus(null);
  }, [refocus]);

  const answered = verdict !== null;
  const grade = useCallback(() => {
    if (answered || ordered.length === 0) return;
    props.onGrade({ kind: 'order', ordered });
  }, [answered, ordered, props]);

  usePlateKeys({
    answered, canSubmit: ordered.length > 0,
    onSubmit: grade, onGrade: grade, onNext: props.onNext, onDunno: props.onDunno,
  });

  if (p.track !== 't3' || p.kind !== 'order') return null;

  const label = new Map(p.pieces.map((piece) => [piece.id, piece.t]));
  const nameOf = (id: string): string => label.get(id) ?? id;
  const seats = answered ? p.answer : ordered;
  const rest = p.deck.filter((id) => !seats.includes(id));

  const move = (i: number, dir: 'up' | 'down'): void => {
    const j = dir === 'up' ? i - 1 : i + 1;
    const from = ordered[i];
    const to = ordered[j];
    if (answered || from === undefined || to === undefined) return;
    const next = [...ordered];
    next[i] = to;
    next[j] = from;
    setOrdered(next);
    setRefocus({ seat: j + 1, dir });
  };

  return (
    <PlateFrame
      card={card}
      no={props.no}
      unitName={props.unitName}
      conceptName={props.conceptName}
      layer={props.layer}
      verdict={verdict}
      source={sourceOf(p.pieces[0]?.id ?? '', null)}
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

      <div className="fdeck">
        <ol className="fpath" ref={listRef} aria-label={flowPathLabel()}>
          {seats.map((id, i) => (
            <li className="fcard" key={id} data-seat={i + 1}>
              <span className="seat" aria-hidden="true">{i + 1}</span>
              <span className="nm">{nameOf(id)}</span>
              <span className="mvs">
                <button
                  type="button"
                  className="mv mv-up"
                  disabled={answered || i === 0}
                  aria-label={flowMoveLabel(nameOf(id), 'up', i + 1, seats.length)}
                  onClick={() => move(i, 'up')}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="mv mv-down"
                  disabled={answered || i === seats.length - 1}
                  aria-label={flowMoveLabel(nameOf(id), 'down', i + 1, seats.length)}
                  onClick={() => move(i, 'down')}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="drop"
                  disabled={answered}
                  aria-label={flowDropLabel(nameOf(id))}
                  onClick={() => setOrdered(ordered.filter((x) => x !== id))}
                >
                  {t('map.flowRemove')}
                </button>
              </span>
            </li>
          ))}
        </ol>
        {seats.length === 0 ? <p className="none">{flowEmpty()}</p> : null}

        <ul className="frest" aria-label={flowDeckLabel()}>
          {rest.map((id) => (
            <li key={id}>
              <button
                type="button"
                className="add"
                disabled={answered}
                aria-label={flowAddLabel(nameOf(id), ordered.length + 1)}
                onClick={() => setOrdered([...ordered, id])}
              >
                {nameOf(id)}
              </button>
            </li>
          ))}
        </ul>
        {rest.length === 0 ? <p className="none">{flowDeckEmpty()}</p> : null}
      </div>

      {answered ? (
        <details className="cc-facts" open={!verdict.ok}>
          <summary>{t('chapter.orderFacts')}</summary>
          <ol>
            {p.pieces.map((piece) => (
              <li key={piece.id}>
                <code>{piece.t}</code> — {piece.fact}
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </PlateFrame>
  );
}
