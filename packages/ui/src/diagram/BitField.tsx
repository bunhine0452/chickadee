import type { ReactNode } from 'react';
import { cx } from '../cx';
import { Diagram } from './Diagram';
import { describeBits } from './bits';
import { withLabels, type DiagramLabels } from './labels';
import type { BitsModel, DiagramPhase } from './types';
import './BitField.css';

export interface BitFieldProps {
  /** `bitsOf(0.1, 'f64')` 가 낸 것. 손으로 적은 비트열을 넘기지 마라. */
  model: BitsModel;
  /**
   * `predict` 는 **비트와 저장된 값을 가린다.** 묶음 이름·폭·순서는 남는다 —
   * 무엇을 물었는지는 보여야 하고 답은 안 보여야 한다(diagrams.md §2 원칙 2).
   */
  phase?: DiagramPhase | undefined;
  caption?: ReactNode | undefined;
  labels?: Partial<DiagramLabels> | undefined;
}

/** `.bits` — 비트 배열. 묶음마다 한 줄이라 폭 720 에서도 안 깨지고 낭독 순서가 곧 뜻이다. */
export function BitField({ model, phase = 'reveal', caption, labels }: BitFieldProps) {
  const L = withLabels(labels);
  const open = phase === 'reveal';

  return (
    <Diagram
      className="dgm-bits"
      label={describeBits(model, phase)}
      caption={caption}
      alt={
        <table>
          <caption>{`${L.altTable} — ${model.type} ${model.literal}`}</caption>
          <thead>
            <tr>
              <th scope="col">{L.colField}</th>
              <th scope="col">{L.colBits}</th>
              <th scope="col">{L.colMeaning}</th>
            </tr>
          </thead>
          <tbody>
            {model.fields.map((f) => (
              <tr key={`${f.kind}-${f.from}`}>
                <th scope="row">{`${f.label} ${f.to - f.from}${L.bitUnit}`}</th>
                <td>{open ? model.bits.slice(f.from, f.to) : L.hidden}</td>
                <td>{open ? (f.note ?? '') : L.hidden}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">{L.literal}</th>
              <td colSpan={2}>{model.literal}</td>
            </tr>
            <tr>
              <th scope="row">{L.stored}</th>
              <td colSpan={2}>{open ? model.stored : L.hidden}</td>
            </tr>
          </tbody>
        </table>
      }
    >
      <div className="bits">
        {model.fields.map((f) => (
          <div className="bits-row" key={`${f.kind}-${f.from}`}>
            <p className="bits-name">
              <span className="bits-label">{f.label}</span>
              <span className="bits-w">{`${f.to - f.from}${L.bitUnit}`}</span>
            </p>
            <div className="bits-cells">
              {[...model.bits.slice(f.from, f.to)].map((b, i) => (
                <span
                  key={`${f.from + i}`}
                  className={cx('bit', open ? (b === '1' ? 'on' : 'off') : 'veil')}
                >
                  {open ? b : ''}
                </span>
              ))}
            </div>
            {open && f.note !== undefined ? <p className="bits-note">{f.note}</p> : null}
          </div>
        ))}
        <dl className="bits-val">
          <dt>{L.literal}</dt>
          <dd className="bits-lit">{model.literal}</dd>
          {open ? (
            <>
              <dt>{L.stored}</dt>
              <dd className={cx('bits-exact', (model.lossy || model.wrapped) && 'differ')}>
                {model.stored}
                {model.lossy ? <span className="bits-flag">{L.lossy}</span> : null}
                {model.wrapped ? <span className="bits-flag">{L.wrapped}</span> : null}
              </dd>
            </>
          ) : null}
        </dl>
      </div>
    </Diagram>
  );
}
