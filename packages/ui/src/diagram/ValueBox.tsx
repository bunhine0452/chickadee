import { Fragment, type ReactNode } from 'react';
import { cx } from '../cx';
import { Diagram } from './Diagram';
import { withLabels, type DiagramLabels } from './labels';
import type { DiagramPhase, ValueBoxModel } from './types';
import './ValueBox.css';

export interface ValueBoxProps {
  model: ValueBoxModel;
  /** 보여 줄 단계. 범위를 넘으면 잘린다. */
  step: number;
  onStep?: ((next: number) => void) | undefined;
  /**
   * `predict` 는 **이번 줄에서 바뀐 칸의 값만** 가린다(`changed`). 나머지 칸은 그대로
   * 보여야 한다 — 학습자가 예측하는 데 필요한 재료다.
   */
  phase?: DiagramPhase | undefined;
  caption?: ReactNode | undefined;
  labels?: Partial<DiagramLabels> | undefined;
}

/** 낭독기 한 문장. 상자 모양이 아니라 「이 줄 뒤에 무엇이 무엇이 되었나」를 말한다. */
export function describeValues(model: ValueBoxModel, step: number, phase: DiagramPhase): string {
  const at = model.steps[Math.min(Math.max(step, 0), model.steps.length - 1)];
  if (at === undefined) return '단계가 없습니다.';
  const head = `${step + 1}번째 줄 ${at.code} 를 실행한 뒤.`;
  if (phase === 'predict') {
    const known = at.cells.filter((c) => c.changed !== true).map((c) => `${c.name} 은 ${c.value}`);
    const ask = at.cells.filter((c) => c.changed === true).map((c) => c.name);
    return `${head} ${known.join(', ')}${known.length > 0 ? '. ' : ''}${ask.join(', ')} 의 값은 가려져 있습니다.`;
  }
  return `${head} ${at.cells.map((c) => `${c.name} 은 ${c.value}`).join(', ')}.`;
}

/** `.vb` — 값 상자. 변수는 이름표가 붙은 상자이고, 대입은 상자로 내려오는 화살표다. */
export function ValueBox({ model, step, onStep, phase = 'reveal', caption, labels }: ValueBoxProps) {
  const L = withLabels(labels);
  const total = Math.max(model.steps.length - 1, 0);
  const at = Math.min(Math.max(step, 0), total);
  const now = model.steps[at];
  const open = phase === 'reveal';
  if (now === undefined) return null;

  return (
    <Diagram
      className="dgm-vb"
      label={describeValues(model, at, phase)}
      caption={caption}
      {...(onStep === undefined ? {} : { nav: { at, total, onStep, prev: L.prev, next: L.next } })}
      alt={
        <table>
          <caption>{`${L.altTable} — ${now.code}`}</caption>
          <thead>
            <tr>
              <th scope="col">{L.colName}</th>
              <th scope="col">{L.colValue}</th>
            </tr>
          </thead>
          <tbody>
            {now.cells.map((c) => (
              <tr key={c.name} {...(c.changed === true ? { 'aria-current': 'true' as const } : {})}>
                <th scope="row">{c.type === undefined ? c.name : `${c.name} (${c.type})`}</th>
                <td>{open || c.changed !== true ? c.value : L.hidden}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <div className="vb">
        <p className="vb-code">{now.code}</p>
        <div className="vb-grid">
          {/* 화살표와 상자가 한 칸을 이룬다 — 열 단위로 채워야 화살표가 자기 상자 위에 선다. */}
          {now.cells.map((c) => (
            <Fragment key={c.name}>
              <span className={cx('vb-arrow', c.changed === true && 'on')}>
                {c.changed === true && c.from !== undefined ? <span className="vb-from">{c.from}</span> : null}
              </span>
              <span className={cx('vb-cell', c.changed === true && 'now')}>
                <span className="vb-name">
                  {c.name}
                  {c.type === undefined ? null : <span className="vb-type">{c.type}</span>}
                </span>
                <span className="vb-val">{open || c.changed !== true ? c.value : ''}</span>
              </span>
            </Fragment>
          ))}
        </div>
        {now.note === undefined ? null : <p className="vb-note">{now.note}</p>}
      </div>
    </Diagram>
  );
}
