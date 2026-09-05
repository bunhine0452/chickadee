import type { ReactNode } from 'react';
import { cx } from '../cx';
import { Diagram } from './Diagram';
import { annotate, describeFold, describeTree, foldSteps, foldedText, isFolded, type FoldNode } from './tree';
import { withLabels, type DiagramLabels } from './labels';
import type { DiagramPhase, EvalTreeModel, FoldModel } from './types';
import './EvalTree.css';

export interface EvalTreeProps {
  /** 트리를 주면 트리를 그린다. `fold` 와 **하나만** 준다. */
  model?: EvalTreeModel | undefined;
  /**
   * 평평한 걸음 배열을 주면 사다리를 그린다 — 문항 형식 `step` 의 payload `fold` 가 이것이다.
   * 트리보다 해상도가 낮다(왜 그 순서인지를 못 말한다) 대신 문항이 이미 들고 있다.
   */
  fold?: FoldModel | undefined;
  /** 접은 단계. 0 이면 아무것도 안 접었다. 범위를 넘으면 잘린다. */
  step: number;
  /** 주면 단계 버튼이 생긴다. 안 주면 부르는 쪽이 키보드까지 가져간다. */
  onStep?: ((next: number) => void) | undefined;
  /** `predict` 는 접힌 마디의 **값**을 가린다. 접히는 순서는 그대로 보인다. */
  phase?: DiagramPhase | undefined;
  caption?: ReactNode | undefined;
  labels?: Partial<DiagramLabels> | undefined;
}

function Sub({ at, step, open }: { at: FoldNode; step: number; open: boolean }) {
  if (at.node.kind === 'leaf') {
    return (
      <div className="tn">
        <span className="tn-box leaf">{at.node.text}</span>
      </div>
    );
  }
  if (isFolded(at, step)) {
    return (
      <div className="tn">
        <span className={cx('tn-box', 'val', at.order === step && 'now')}>{open ? at.node.result : ''}</span>
      </div>
    );
  }
  return (
    <div className="tn kids">
      <span className="tn-box op">{at.node.op}</span>
      <div className="tn-kids">
        {at.kids.map((k, i) => (
          <Sub key={`${k.order}-${i}`} at={k} step={step} open={open} />
        ))}
      </div>
    </div>
  );
}

/** `.fold` — 걸음 사다리. 첫 줄(주어진 식)은 물음이라 `predict` 에서도 남는다. */
function Ladder({ fold, at, open }: { fold: FoldModel; at: number; open: boolean }) {
  return (
    <ol className="fold">
      {fold.steps.map((s, i) => {
        const shown = i === 0 || i < at || (i === at && open);
        return (
          <li key={`${i}-${s.code}`} className={cx('fold-row', i === at && 'now', !shown && 'veil')}>
            <span className="fold-code">{shown ? s.code : ''}</span>
            <span className="fold-type">{shown ? s.type : ''}</span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * `.tree` — 평가 트리. 한 번에 한 마디씩 접히고, 접히는 순서는 후위 순회로 결정론이다.
 * `fold` 만 준 문항에는 같은 것을 사다리로 그린다.
 */
export function EvalTree({ model, fold, step, onStep, phase = 'reveal', caption, labels }: EvalTreeProps) {
  const L = withLabels(labels);
  if (model === undefined) return fold === undefined ? null : <FoldLadder fold={fold} step={step} {...(onStep === undefined ? {} : { onStep })} phase={phase} caption={caption} labels={labels} />;
  const total = foldSteps(model.root);
  const at = Math.min(Math.max(step, 0), total);
  const root = annotate(model.root);
  const open = phase === 'reveal';

  return (
    <Diagram
      className="dgm-tree"
      label={describeTree(model, at, phase)}
      caption={caption}
      {...(onStep === undefined ? {} : { nav: { at, total, onStep, prev: L.prev, next: L.next } })}
      alt={
        <table>
          <caption>{`${L.altTable} — ${model.expr}`}</caption>
          <thead>
            <tr>
              <th scope="col">{L.colStep}</th>
              <th scope="col">{L.colValue}</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: total + 1 }, (_, i) => (
              <tr key={i} {...(i === at ? { 'aria-current': 'step' as const } : {})}>
                <th scope="row">{`${i} / ${total}`}</th>
                <td>{open || i <= at ? foldedText(root, open ? i : 0) : L.hidden}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <div className="tree">
        <Sub at={root} step={at} open={open} />
      </div>
      <p className="tree-line">{open ? foldedText(root, at) : model.expr}</p>
    </Diagram>
  );
}


interface FoldLadderProps {
  fold: FoldModel;
  step: number;
  onStep?: ((next: number) => void) | undefined;
  phase?: DiagramPhase | undefined;
  caption?: ReactNode | undefined;
  labels?: Partial<DiagramLabels> | undefined;
}

function FoldLadder({ fold, step, onStep, phase = 'reveal', caption, labels }: FoldLadderProps) {
  const L = withLabels(labels);
  const total = Math.max(fold.steps.length - 1, 0);
  const at = Math.min(Math.max(step, 0), total);
  const open = phase === 'reveal';

  return (
    <Diagram
      className="dgm-fold"
      label={describeFold(fold, at, phase)}
      caption={caption}
      {...(onStep === undefined ? {} : { nav: { at, total, onStep, prev: L.prev, next: L.next } })}
      alt={
        <table>
          <caption>{`${L.altTable} — ${fold.expr}`}</caption>
          <thead>
            <tr>
              <th scope="col">{L.colStep}</th>
              <th scope="col">{L.colValue}</th>
              <th scope="col">{L.colMeaning}</th>
            </tr>
          </thead>
          <tbody>
            {fold.steps.map((s, i) => {
              const shown = i === 0 || i < at || (i === at && open);
              return (
                <tr key={`${i}-${s.code}`} {...(i === at ? { 'aria-current': 'step' as const } : {})}>
                  <th scope="row">{`${i} / ${total}`}</th>
                  <td>{shown ? s.code : L.hidden}</td>
                  <td>{shown ? s.type : L.hidden}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      }
    >
      <Ladder fold={fold} at={at} open={open} />
    </Diagram>
  );
}
