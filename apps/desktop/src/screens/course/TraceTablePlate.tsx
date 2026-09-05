/**
 * `trace-table` — **시간 × 열** 격자 (D187 ⑱ · `pedagogy.md` §1.2).
 *
 * 2단의 넷(`exec`·`hop`·`origin`·`caller`)이 전부 경로라 값을 굴리는 판이 없었다. 이 판이
 * 그 자리다 — 세로는 **시간**(줄 번호)이고 가로는 **무엇을 좇나**(가리키는 상자 · 있나).
 *
 * ## 예측 모드 — 바뀐 칸만 비어 있다
 *
 * 그림의 I2 규칙(구조는 남고 값이 사라진다)과 같다. 값이 안 바뀐 칸은 채워진 채로 남아
 * **예측의 재료**가 되고, 학습자가 채우는 것은 값이 바뀌는 칸뿐이다. 「어디서 바뀌나」가
 * 곧 이 형식이 묻는 것이라 가릴 자리가 그 자리다.
 *
 * ## 키보드로 완결된다 (정본 §3-8)
 *
 * `Tab` 은 브라우저의 것이고, `↑`·`↓` 로 같은 열의 위아래 칸으로, `←`·`→` 는 **글자 끝에서만**
 * 옆 칸으로 넘어간다(가운데서는 캐럿 이동이다 — 짧은 낱말이라 그 편이 덜 놀랍다).
 * `Enter` 로 채점, `⌘↵` 도 같다.
 */
import type { StageAnswer, StageVerdict } from '@chickadee/grading';
import { t } from '@chickadee/i18n';
import type { TraceCell } from '@chickadee/store-sql';
import type { InkLayer } from '@chickadee/ui';
import { Kbd, PressButton } from '@chickadee/ui';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Ask } from '../../components/plate/Ask.js';
import { usePlateKeys } from './keys.js';
import { PlateFrame, sourceOf } from './PlateFrame.js';
import type { StageCardView } from './run.js';
import './TracePlate.css';

export interface TraceTablePlateProps {
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

const keyOf = (row: string, col: string): string => `${row}|${col}`;

/** 칸의 답을 사람이 읽는 글자로. 채워진 칸과 정답 펴기가 같은 글자를 쓴다. */
export function cellText(v: TraceCell): string {
  switch (v.t) {
    case 'box': return v.label;
    case 'none': return t('chapter.traceNone');
    case 'bool': return v.v ? t('chapter.traceYes') : t('chapter.traceNo');
    case 'unknown': return v.accept[0] ?? '?';
    default: return v.v;
  }
}

export function TraceTablePlate(props: TraceTablePlateProps): React.JSX.Element | null {
  const { card, verdict } = props;
  const p = card.payload;
  const [cells, setCells] = useState<Record<string, string>>({});
  const gridRef = useRef<HTMLTableElement | null>(null);

  useEffect(() => {
    setCells({});
  }, [card.id]);

  const answered = verdict !== null;
  const isTrace = p.track === 't3' && p.kind === 'trace';

  const grade = useCallback(() => {
    if (answered) return;
    props.onGrade({ kind: 'cells', cells });
  }, [answered, cells, props]);

  usePlateKeys({
    answered, canSubmit: true,
    onSubmit: grade, onGrade: grade, onNext: props.onNext, onDunno: props.onDunno,
  });

  /** 칸 사이 이동. 표 안에서 좌표로 찾는다 — DOM 순서가 아니라 격자의 자리다. */
  const moveTo = (row: number, col: number): void => {
    const at = gridRef.current?.querySelector<HTMLInputElement>(
      `input[data-row="${String(row)}"][data-col="${String(col)}"]`,
    );
    at?.focus();
    at?.select();
  };

  if (!isTrace) return null;

  const hidden = new Set(p.hidden);

  const onCellKey = (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number): void => {
    if (e.nativeEvent.isComposing) return;
    const el = e.currentTarget;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (answered) props.onNext();
      else grade();
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); moveTo(row + 1, col); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); moveTo(row - 1, col); return; }
    // 글자 끝에서만 옆 칸으로 — 가운데서는 캐럿이 움직이는 편이 덜 놀랍다.
    if (e.key === 'ArrowRight' && el.selectionStart === el.value.length) {
      e.preventDefault(); moveTo(row, col + 1); return;
    }
    if (e.key === 'ArrowLeft' && el.selectionStart === 0) {
      e.preventDefault(); moveTo(row, col - 1);
    }
  };

  const missed = new Set(
    verdict !== null && verdict.detail.kind === 'trace'
      ? verdict.detail.result.misses.map((m) => m.key)
      : [],
  );
  const valueAt = new Map(p.cells.map((c) => [keyOf(c.r, c.c), c.v]));

  return (
    <PlateFrame
      card={card}
      no={props.no}
      unitName={props.unitName}
      conceptName={props.conceptName}
      layer={props.layer}
      verdict={verdict}
      source={sourceOf(p.file, p.rows[0]?.line ?? null)}
      hint={answered ? t('session.hintNextPlate') : t('chapter.hintCells')}
      stuckOpen={props.stuckOpen}
      onDunno={props.onDunno}
      {...(props.after === undefined ? {} : { after: props.after })}
      right={answered ? (
        <PressButton tone="blue" onClick={props.onNext}>
          {t('session.next')} <Kbd keys="Space" />
        </PressButton>
      ) : (
        <PressButton tone="pink" onClick={grade}>
          {t('chapter.grade')} <Kbd keys="⌘↵" />
        </PressButton>
      )}
    >
      <Ask q={p.q} hint={p.hint} />

      <div className="cc-grid-wrap">
        <table className="cc-grid" ref={gridRef}>
          <caption className="cc-grid-cap">{t('chapter.traceCaption')}</caption>
          <thead>
            <tr>
              <th scope="col" className="cc-grid-when">{t('chapter.traceWhen')}</th>
              {p.cols.map((col) => (
                <th scope="col" key={col.k}>{col.t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {p.rows.map((row, ri) => (
              <tr key={row.k}>
                <th scope="row" className="cc-grid-when">
                  {row.line === null ? null : <b>{row.line}</b>}
                  <code title={row.t}>{row.t}</code>
                </th>
                {p.cols.map((col, ci) => {
                  const key = keyOf(row.k, col.k);
                  const value = valueAt.get(key);
                  const ask = hidden.has(key);
                  if (value === undefined) return <td key={col.k} />;
                  if (!ask || answered) {
                    return (
                      <td key={col.k} className={missed.has(key) ? 'cc-cell miss' : 'cc-cell'}>
                        {cellText(value)}
                      </td>
                    );
                  }
                  return (
                    <td key={col.k} className="cc-cell">
                      <input
                        className="cc-cell-in"
                        type="text"
                        inputMode="text"
                        autoComplete="off"
                        spellCheck={false}
                        data-row={ri}
                        data-col={ci}
                        aria-label={t('chapter.traceCellLabel', { row: row.t, col: col.t })}
                        value={cells[key] ?? ''}
                        onChange={(e) => setCells({ ...cells, [key]: e.target.value })}
                        onKeyDown={(e) => onCellKey(e, ri, ci)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="note cc-grid-legend">{t('chapter.traceLegend')}</p>
    </PlateFrame>
  );
}
