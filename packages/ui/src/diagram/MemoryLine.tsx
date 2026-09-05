import { Fragment, type ReactNode } from 'react';
import { cx } from '../cx';
import { Diagram } from './Diagram';
import { withLabels, type DiagramLabels } from './labels';
import type { DiagramPhase, MemoryLineModel, MemorySlot } from './types';
import './MemoryLine.css';

export interface MemoryLineProps {
  model: MemoryLineModel;
  /**
   * `predict` 는 **칸의 값만** 가린다. 주소·거리·이름표·창은 남는다 — 그것이 물음이고,
   * 「`a[2]` 자리에 무엇이 있나」를 물으려면 그 자리가 어디인지는 보여야 한다.
   */
  phase?: DiagramPhase | undefined;
  caption?: ReactNode | undefined;
  labels?: Partial<DiagramLabels> | undefined;
}

/** 이 칸에 붙은 이름 전부. `names` 가 있으면 그것이 이기고, 없으면 `name` 하나다. */
export function slotNames(slot: MemorySlot): readonly string[] {
  if (slot.names !== undefined && slot.names.length > 0) return slot.names;
  return slot.name === undefined ? [] : [slot.name];
}

/**
 * 낭독기 한 문장. 주소를 하나씩 읽어 주면 못 듣는다 — **간격과 별칭**을 말한다.
 * 별칭이 이 그림의 요점이라(py·ts 신청) 있으면 문장에 반드시 나온다.
 */
export function describeMemory(model: MemoryLineModel, phase: DiagramPhase = 'reveal'): string {
  const head = `기준 주소 ${model.base} 에서 ${model.stride}바이트 간격으로 놓인 칸 ${model.slots.length}개.`;
  const aliased = model.slots
    .map((s) => ({ names: slotNames(s), addr: s.addr }))
    .filter((s) => s.names.length > 1)
    .map((s) => `이름 ${s.names.join(' 과 ')} 가 같은 칸 ${s.addr} 을 가리킵니다.`)
    .join(' ');
  const wins = (model.windows ?? [])
    .map((w) => `창 ${w.name} 은 ${w.from}번째 칸부터 길이 ${w.len}, 용량 ${w.cap} 입니다.`)
    .join(' ');
  const tail = [aliased, wins].filter((s) => s !== '').join(' ');
  if (phase === 'predict') return `${head} ${tail}${tail === '' ? '' : ' '}값은 아직 가려져 있습니다.`;
  const cells = model.slots
    .map((s, i) => {
      const names = slotNames(s);
      return `${names.length === 0 ? `${model.base}+${i * model.stride}` : names.join('·')} 은 ${s.value}`;
    })
    .join(', ');
  return `${head} ${cells}. ${tail}`.trimEnd();
}

/**
 * `.ml` — 메모리 줄. 주소가 붙은 칸이 간격 하나로 늘어서고, 그 위에 이름표와 창이 얹힌다.
 *
 * **배열이 왜 0부터인가**가 이 그림 하나로 끝난다 — `a[i]` 의 주소가 `base + i × stride` 라
 * 인덱스는 순번이 아니라 **거리**다. `c-learning.md` §11.1 이 C 오개념 여섯을 이 그림 하나가
 * 덮는다고 셌다.
 */
export function MemoryLine({ model, phase = 'reveal', caption, labels }: MemoryLineProps) {
  const L = withLabels(labels);
  const open = phase === 'reveal';
  const n = model.slots.length;
  const windows = model.windows ?? [];

  return (
    <Diagram
      className="dgm-ml"
      label={describeMemory(model, phase)}
      caption={caption}
      alt={
        <table>
          <caption>{`${L.altTable} — ${model.base}`}</caption>
          <thead>
            <tr>
              <th scope="col">{L.colAddr}</th>
              <th scope="col">{L.offset}</th>
              <th scope="col">{L.colName}</th>
              <th scope="col">{L.colValue}</th>
            </tr>
          </thead>
          <tbody>
            {model.slots.map((s, i) => {
              const names = slotNames(s);
              return (
                <tr key={s.addr}>
                  <th scope="row">{s.addr}</th>
                  <td>{`+${i * model.stride}`}</td>
                  <td>{names.length > 1 ? `${names.join(', ')} (${L.alias})` : (names[0] ?? '')}</td>
                  <td>{open ? s.value : L.hidden}</td>
                </tr>
              );
            })}
            {windows.map((w) => (
              <tr key={`w-${w.name}`}>
                <th scope="row">{w.name}</th>
                <td colSpan={3}>
                  {`${model.slots[w.from]?.addr ?? model.base} · ${L.windowLen} ${w.len} · ${L.windowCap} ${w.cap}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      {/* 열 눈금이 데이터에서 나온다 — 칸 하나가 한 열이고, 창은 그 열을 그대로 걸친다. */}
      <div className="ml" style={{ gridTemplateColumns: `max-content repeat(${n}, minmax(3.5rem, max-content))` }}>
        <p className="ml-head">{L.addr}</p>
        {model.slots.map((s) => (
          <p className="ml-addr" key={`a-${s.addr}`}>
            {s.addr}
          </p>
        ))}

        <p className="ml-head">{L.colValue}</p>
        {model.slots.map((s) => (
          <span className={cx('ml-cell', !open && 'veil')} key={`v-${s.addr}`}>
            {open ? s.value : ''}
          </span>
        ))}

        {/* 거리 줄 — `a[i]` 가 순번이 아니라 거리인 것이 이 한 줄에 있다. */}
        <p className="ml-head">{L.offset}</p>
        {model.slots.map((s, i) => (
          <p className="ml-off" key={`o-${s.addr}`}>{`+${i * model.stride}`}</p>
        ))}

        <p className="ml-head">{L.colName}</p>
        {model.slots.map((s) => {
          const names = slotNames(s);
          return (
            <p className={cx('ml-names', names.length > 1 && 'many')} key={`n-${s.addr}`}>
              {names.map((nm) => (
                <span className="ml-name" key={nm}>
                  {nm}
                </span>
              ))}
              {names.length > 1 ? <span className="ml-alias">{L.alias}</span> : null}
            </p>
          );
        })}

        {/* 창은 줄 위에 얹힌다 — 자리를 못박아야(`gridRow`) 자동 배치가 순서를 흔들지 않는다. */}
        {windows.map((w, wi) => (
          <Fragment key={`w-${w.name}`}>
            <p className="ml-head" style={{ gridRow: 5 + wi, gridColumn: 1 }}>
              {w.name}
            </p>
            <span
              className="ml-win len"
              style={{ gridRow: 5 + wi, gridColumn: `${w.from + 2} / ${w.from + w.len + 2}` }}
            >
              {`${L.windowLen} ${w.len}`}
            </span>
            {w.cap > w.len ? (
              <span
                className="ml-win cap"
                style={{ gridRow: 5 + wi, gridColumn: `${w.from + w.len + 2} / ${w.from + w.cap + 2}` }}
              >
                {`${L.windowCap} ${w.cap}`}
              </span>
            ) : null}
          </Fragment>
        ))}
      </div>
    </Diagram>
  );
}
