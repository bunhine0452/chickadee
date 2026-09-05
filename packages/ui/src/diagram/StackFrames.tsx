import type { ReactNode } from 'react';
import { cx } from '../cx';
import { Diagram } from './Diagram';
import { withLabels, type DiagramLabels } from './labels';
import type { DiagramPhase, StackFrame, StackFramesModel, ValueCell } from './types';
import './StackFrames.css';

export interface StackFramesProps {
  model: StackFramesModel;
  /** 보여 줄 단계. 범위를 넘으면 잘린다. */
  step: number;
  onStep?: ((next: number) => void) | undefined;
  /**
   * `predict` 가 가리는 것 둘 — 값 상자와 같은 규칙으로 **바뀐 칸**(`changed`)의 값,
   * 그리고 **걷힘 순서의 이름**이다. 순서 번호는 남는다: 「여기서 셋이 돈다」는 물음이고
   * 「무엇이 몇 번째로 도나」가 답이다(diagrams.md §4).
   */
  phase?: DiagramPhase | undefined;
  caption?: ReactNode | undefined;
  labels?: Partial<DiagramLabels> | undefined;
}

/** 프레임 하나가 든 이름 전부. 낭독 문장이 인자와 지역을 한 줄로 잇는다. */
function frameCells(frame: StackFrame): readonly ValueCell[] {
  return [...frame.args, ...frame.locals];
}

/**
 * 낭독기 한 문장. 상자를 세지 않고 **누가 누구를 불렀고 지금 무엇이 걷히나**를 말한다.
 */
export function describeStack(model: StackFramesModel, step: number, phase: DiagramPhase = 'reveal'): string {
  const at = model.steps[Math.min(Math.max(step, 0), model.steps.length - 1)];
  if (at === undefined) return '단계가 없습니다.';
  const chain = at.frames.map((f) => f.fn).join(' 이 부른 ');
  const head = `${at.code} 를 실행한 뒤. 프레임 ${at.frames.length}개 — ${chain}.`;
  const unwind = at.unwind ?? [];
  if (phase === 'predict') {
    const tail = unwind.length === 0 ? '' : ` 걷힐 때 ${unwind.length}개가 돕니다. 그 순서는 가려져 있습니다.`;
    return `${head} 값은 아직 가려져 있습니다.${tail}`;
  }
  const top = at.frames[at.frames.length - 1];
  const cells =
    top === undefined
      ? ''
      : ` 맨 위 ${top.fn} 안에서 ${frameCells(top).map((c) => `${c.name} 은 ${c.value}`).join(', ')}.`;
  const tail =
    unwind.length === 0
      ? ''
      : ` 걷힐 때 ${[...unwind].sort((a, b) => a.order - b.order).map((u) => u.name).join(', ')} 순서로 돕니다.`;
  return `${head}${cells}${tail}`;
}

function Cells({ cells, open, kind }: { cells: readonly ValueCell[]; open: boolean; kind: string }) {
  if (cells.length === 0) return null;
  return (
    <p className="sf-row">
      <span className="sf-kind">{kind}</span>
      {cells.map((c) => (
        <span className={cx('sf-cell', c.changed === true && 'now')} key={c.name}>
          <span className="sf-name">
            {c.name}
            {c.type === undefined ? null : <span className="sf-type">{c.type}</span>}
          </span>
          <span className="sf-val">{open || c.changed !== true ? c.value : ''}</span>
        </span>
      ))}
    </p>
  );
}

/**
 * `.sf` — 스택 프레임. 호출이 쌓이고 걷힌다.
 *
 * **맨 위가 지금 도는 프레임이다.** 배열의 뒤가 화면의 위에 오도록 뒤집어 그린다 —
 * 스택을 「쌓인다」로 배우는데 그림이 아래로 자라면 낱말과 그림이 어긋난다.
 *
 * `unwind` 는 C++ 이 신청한 칸이다(`cpp-learning.md` §11.1). C 에서는 프레임이 사라지는
 * 것이 전부라 필요 없었고, C++ 은 **사라지는 순서대로 코드가 돈다.**
 */
export function StackFrames({ model, step, onStep, phase = 'reveal', caption, labels }: StackFramesProps) {
  const L = withLabels(labels);
  const total = Math.max(model.steps.length - 1, 0);
  const at = Math.min(Math.max(step, 0), total);
  const now = model.steps[at];
  const open = phase === 'reveal';
  if (now === undefined) return null;
  const unwind = [...(now.unwind ?? [])].sort((a, b) => a.order - b.order);

  return (
    <Diagram
      className="dgm-sf"
      label={describeStack(model, at, phase)}
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
            {now.frames.map((f) => (
              <tr key={f.fn}>
                <th scope="row">{f.fn}</th>
                <td>
                  {frameCells(f)
                    .map((c) => `${c.name} = ${open || c.changed !== true ? c.value : L.hidden}`)
                    .join(', ')}
                </td>
              </tr>
            ))}
            {unwind.map((u) => (
              <tr key={`u-${u.order}`}>
                <th scope="row">{`${L.unwind} ${u.order}`}</th>
                <td>{open ? u.name : L.hidden}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <div className="sf">
        <p className="sf-code">{now.code}</p>
        <ol className="sf-stack">
          {[...now.frames].reverse().map((f, i) => (
            <li className={cx('sf-frame', i === 0 && 'top')} key={f.fn}>
              <p className="sf-fn">{f.fn}</p>
              <Cells cells={f.args} open={open} kind={L.args} />
              <Cells cells={f.locals} open={open} kind={L.locals} />
            </li>
          ))}
        </ol>
        {unwind.length === 0 ? null : (
          <div className="sf-unwind">
            <p className="sf-kind">{L.unwind}</p>
            <ol className="sf-order">
              {unwind.map((u) => (
                <li className={cx('sf-run', !open && 'veil')} key={`u-${u.order}`}>
                  <span className="sf-num">{u.order}</span>
                  <span className="sf-run-name">{open ? u.name : ''}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        {now.note === undefined ? null : <p className="sf-note">{now.note}</p>}
      </div>
    </Diagram>
  );
}
