import { Fragment, type ReactNode } from 'react';
import { cx } from '../cx';
import { Diagram } from './Diagram';
import { withLabels, type DiagramLabels } from './labels';
import type { DiagramPhase, QueueLadderModel } from './types';
import './QueueLadder.css';

export interface QueueLadderProps {
  model: QueueLadderModel;
  /** 보여 줄 걸음. 범위를 넘으면 잘린다. */
  step: number;
  onStep?: ((next: number) => void) | undefined;
  /**
   * `predict` 는 걸음의 코드와 **어느 줄기인지**를 함께 가린다. 줄기 이름과 걸음 수는
   * 남는다 — 「무엇이 몇 번 도나」가 물음이고 「어느 줄기에서 언제」가 답이다.
   */
  phase?: DiagramPhase | undefined;
  caption?: ReactNode | undefined;
  labels?: Partial<DiagramLabels> | undefined;
}

/**
 * 낭독기 한 문장. 줄기를 세지 않고 **순서**를 말한다 — 이 그림이 묻는 것이 출력 순서다
 * (`ts-learning.md` §11.3, Jake Archibald 2015·2018 이 그렇게 가르친다).
 */
export function describeQueue(model: QueueLadderModel, step: number, phase: DiagramPhase = 'reveal'): string {
  const steps = model.fold.steps;
  const total = Math.max(steps.length - 1, 0);
  const at = Math.min(Math.max(step, 0), total);
  const head = `${model.fold.expr}. 줄기 ${model.lanes.length}개 — ${model.lanes.join(', ')}. 걸음 ${steps.length}개.`;
  // 화면에 보이는 걸음 수와 **같은 수**를 읽어 준다 — 눈과 귀가 어긋나면 둘 중 하나가 거짓이다.
  const limit = phase === 'reveal' ? at + 1 : Math.max(at, 1);
  const ran = steps
    .slice(0, limit)
    .map((s, i) => `${i + 1}번째는 ${s.type} 줄기의 ${s.code}`)
    .join(', ');
  const tail = limit >= steps.length ? '' : ` 나머지 ${steps.length - limit}걸음은 가려져 있습니다.`;
  return `${head} ${ran}.${tail}`;
}

/**
 * `.ql` — 큐 사다리. **걸음 사다리의 배치판**이다(ts-learning.md §11.1) — 새 컴포넌트가
 * 아니라 `FoldStep.type` 이 값이 아니라 **줄기 이름**인 것이 전부이고, 그 이름이 열이 된다.
 *
 * 줄기를 열로 놓으면 「마이크로태스크 줄이 비워지고 나서 태스크 하나」가 지그재그로 보인다 —
 * 같은 것을 한 줄로 늘어놓으면 그 규칙이 사라진다.
 */
export function QueueLadder({ model, step, onStep, phase = 'reveal', caption, labels }: QueueLadderProps) {
  const L = withLabels(labels);
  const total = Math.max(model.fold.steps.length - 1, 0);
  const at = Math.min(Math.max(step, 0), total);
  const open = phase === 'reveal';
  const lanes = model.lanes;

  return (
    <Diagram
      className="dgm-ql"
      label={describeQueue(model, at, phase)}
      caption={caption}
      {...(onStep === undefined ? {} : { nav: { at, total, onStep, prev: L.prev, next: L.next } })}
      alt={
        <table>
          <caption>{`${L.altTable} — ${model.fold.expr}`}</caption>
          <thead>
            <tr>
              <th scope="col">{L.colStep}</th>
              <th scope="col">{L.colLane}</th>
              <th scope="col">{L.colCode}</th>
            </tr>
          </thead>
          <tbody>
            {model.fold.steps.map((s, i) => {
              const shown = i === 0 || i < at || (i === at && open);
              return (
                <tr key={`${i}-${s.code}`} {...(i === at ? { 'aria-current': 'step' as const } : {})}>
                  <th scope="row">{`${i + 1} / ${model.fold.steps.length}`}</th>
                  <td>{shown ? s.type : L.hidden}</td>
                  <td>{shown ? s.code : L.hidden}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      }
    >
      <div className="ql" style={{ gridTemplateColumns: `repeat(${lanes.length}, minmax(6rem, 1fr))` }}>
        {lanes.map((lane, i) => (
          <p className="ql-lane" style={{ gridRow: 1, gridColumn: i + 1 }} key={lane}>
            {lane}
          </p>
        ))}
        {model.fold.steps.map((s, i) => {
          const shown = i === 0 || i < at || (i === at && open);
          const col = lanes.indexOf(s.type) + 1;
          // 가려진 걸음은 줄기를 안 고른다 — 어느 줄기인지가 곧 답이라 자리까지 가린다.
          const place = shown && col > 0 ? { gridColumn: col } : { gridColumn: `1 / ${lanes.length + 1}` };
          return (
            <Fragment key={`${i}-${s.code}`}>
              <span
                className={cx('ql-row', i === at && shown && 'now', !shown && 'veil')}
                style={{ gridRow: i + 2, ...place }}
              >
                <span className="ql-no">{i + 1}</span>
                <span className="ql-code">{shown ? s.code : ''}</span>
              </span>
            </Fragment>
          );
        })}
      </div>
    </Diagram>
  );
}
