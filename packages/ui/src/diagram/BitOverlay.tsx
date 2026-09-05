import type { ReactNode } from 'react';
import { cx } from '../cx';
import { Diagram } from './Diagram';
import { withLabels, type DiagramLabels } from './labels';
import type { BitOverlayModel, DiagramPhase } from './types';
import './BitField.css';
import './BitOverlay.css';

export interface BitOverlayProps {
  model: BitOverlayModel;
  /** `predict` 는 두 줄의 비트와 저장된 값을 가린다. 폭·잘리는 자리·자릿수는 남는다. */
  phase?: DiagramPhase | undefined;
  caption?: ReactNode | undefined;
  labels?: Partial<DiagramLabels> | undefined;
}

/** 살아남는 하위 비트 수. 두 폭 중 좁은 쪽을 절대 넘지 않는다. */
export function keptBits(model: BitOverlayModel): number {
  return Math.max(0, Math.min(model.keep, model.from.width, model.to.width));
}

/**
 * 낭독기 한 문장. 비트를 읽어 주면 못 듣는다 — **몇 자리가 떨어져 나가고 값이 무엇이 되나**를
 * 말한다. `300` 이 `44` 가 되는 것이 이 그림의 전부다.
 */
export function describeOverlay(model: BitOverlayModel, phase: DiagramPhase = 'reveal'): string {
  const keep = keptBits(model);
  const drop = model.from.width - keep;
  const head =
    `${model.from.width}비트 ${model.from.type} 을 ${model.to.width}비트 ${model.to.type} 로 옮깁니다.` +
    ` 하위 ${keep}비트만 남고 위 ${drop}비트가 떨어져 나갑니다.`;
  if (phase === 'predict') return `${head} 값은 아직 가려져 있습니다.`;
  return `${head} ${model.from.literal} 이 ${model.to.stored} 가 됩니다.`;
}

/** 비트 한 줄. `.bit` 규약(`on`·`off`·`veil`)을 비트 배열에서 그대로 쓴다. */
function Row({ bits, open, cut, from, row }: { bits: string; open: boolean; cut: number; from: number; row: number }) {
  return (
    <>
      {[...bits].map((b, i) => (
        <span
          key={`${from + i}`}
          className={cx('bit', i < cut && 'gone', open ? (b === '1' ? 'on' : 'off') : 'veil')}
          style={{ gridRow: row, gridColumn: from + i + 2 }}
        >
          {open ? b : ''}
        </span>
      ))}
    </>
  );
}

/**
 * `.ov` — 겹친 비트 배열. **`300u32 as u8` 이 왜 44 인가**를 두 폭의 관계로 그린다.
 *
 * 한 줄짜리 비트 배열로는 못 그린다(diagrams.md §3) — 두 `BitsModel` 을 나란히 놓으면
 * 자리가 안 맞아 「윗자리가 잘린다」가 안 보인다. 여기서는 **두 줄이 한 격자를 쓰므로**
 * 아래 폭이 위 폭의 하위 자리 바로 밑에 선다.
 */
export function BitOverlay({ model, phase = 'reveal', caption, labels }: BitOverlayProps) {
  const L = withLabels(labels);
  const open = phase === 'reveal';
  const keep = keptBits(model);
  const cut = model.from.width - keep;
  const cols = `max-content repeat(${model.from.width}, minmax(.9em, max-content))`;

  return (
    <Diagram
      className="dgm-ov"
      label={describeOverlay(model, phase)}
      caption={caption}
      alt={
        <table>
          <caption>{`${L.altTable} — ${model.from.type} ${model.from.literal} → ${model.to.type}`}</caption>
          <thead>
            <tr>
              <th scope="col">{L.colType}</th>
              <th scope="col">{L.colBits}</th>
              <th scope="col">{L.colValue}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">{`${model.from.type} ${model.from.width}${L.bitUnit}`}</th>
              <td>{open ? model.from.bits : L.hidden}</td>
              <td>{model.from.literal}</td>
            </tr>
            <tr>
              <th scope="row">{`${L.cut} ${cut}${L.bitUnit}`}</th>
              <td>{open ? model.from.bits.slice(0, cut) : L.hidden}</td>
              <td>{L.cut}</td>
            </tr>
            <tr aria-current="true">
              <th scope="row">{`${model.to.type} ${model.to.width}${L.bitUnit}`}</th>
              <td>{open ? model.to.bits : L.hidden}</td>
              <td>{open ? model.to.stored : L.hidden}</td>
            </tr>
          </tbody>
        </table>
      }
    >
      <div className="ov" style={{ gridTemplateColumns: cols }}>
        <p className="ov-name" style={{ gridRow: 1, gridColumn: 1 }}>
          <span className="ov-type">{model.from.type}</span>
          <span className="ov-w">{`${model.from.width}${L.bitUnit}`}</span>
        </p>
        <Row bits={model.from.bits} open={open} cut={cut} from={0} row={1} />

        {/* 잘리는 자리 — 아래 폭이 어디서 시작하는지를 격자 선 하나로 말한다. */}
        {cut > 0 ? (
          <span className="ov-mark" style={{ gridRow: 2, gridColumn: `2 / ${cut + 2}` }}>
            {`${L.cut} ${cut}${L.bitUnit}`}
          </span>
        ) : null}
        <span className="ov-mark keep" style={{ gridRow: 2, gridColumn: `${cut + 2} / ${model.from.width + 2}` }}>
          {`${L.kept} ${keep}${L.bitUnit}`}
        </span>

        <p className="ov-name" style={{ gridRow: 3, gridColumn: 1 }}>
          <span className="ov-type">{model.to.type}</span>
          <span className="ov-w">{`${model.to.width}${L.bitUnit}`}</span>
        </p>
        <Row bits={model.to.bits} open={open} cut={0} from={cut} row={3} />

        <dl className="bits-val ov-val" style={{ gridRow: 4, gridColumn: `1 / ${model.from.width + 2}` }}>
          <dt>{L.literal}</dt>
          <dd className="bits-lit">{model.from.literal}</dd>
          {open ? (
            <>
              <dt>{L.stored}</dt>
              <dd className={cx('bits-exact', model.to.stored !== model.from.literal && 'differ')}>
                {model.to.stored}
                {model.to.stored === model.from.literal ? null : <span className="bits-flag">{L.wrapped}</span>}
              </dd>
            </>
          ) : null}
        </dl>
      </div>
    </Diagram>
  );
}
