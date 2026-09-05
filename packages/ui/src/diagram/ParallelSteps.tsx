import { Fragment, type ReactNode } from 'react';
import { cx } from '../cx';
import { Diagram } from './Diagram';
import { withLabels, type DiagramLabels } from './labels';
import type { ChannelKind, DiagramPhase, ParallelStepsModel } from './types';
import './ParallelSteps.css';

export interface ParallelStepsProps {
  model: ParallelStepsModel;
  /**
   * `predict` 는 걸음의 코드와 타입을 가린다. **간선은 남는다** — 채널 연산의 짝이 물음이고
   * 「무엇이 언제 찍히나」가 답이다(`go-learning.md` §11.3.1).
   */
  phase?: DiagramPhase | undefined;
  caption?: ReactNode | undefined;
  labels?: Partial<DiagramLabels> | undefined;
}

/** 간선 종류의 이름표. 색이 아니라 **낱말**이 넷을 가른다(정본 §6). */
export function channelLabel(kind: ChannelKind, L: DiagramLabels): string {
  if (kind === 'send') return L.send;
  if (kind === 'recv') return L.recv;
  if (kind === 'wg') return L.wait;
  return L.lock;
}

/**
 * 낭독기 한 문장. 레인을 칸칸이 읽어 주면 못 듣는다 — **무엇이 무엇보다 먼저인가**를
 * 말한다. 간선이 곧 그 순서의 근거(`synchronized before`)라 언제나 문장에 나온다.
 */
export function describeParallel(
  model: ParallelStepsModel,
  phase: DiagramPhase = 'reveal',
  labels?: Partial<DiagramLabels> | undefined,
): string {
  const L = withLabels(labels);
  const names = model.lanes.map((l) => l.name).join(', ');
  const head = `줄기 ${model.lanes.length}개 — ${names}.`;
  const edges = model.edges
    .map((e) => {
      const a = model.lanes[e.from[0]];
      const b = model.lanes[e.to[0]];
      const kind = e.label ?? channelLabel(e.kind, L);
      return `${a?.name ?? '?'} 의 ${e.from[1] + 1}번째 걸음이 ${b?.name ?? '?'} 의 ${e.to[1] + 1}번째 걸음보다 먼저입니다 (${kind})`;
    })
    .join('. ');
  if (phase === 'predict') return `${head} ${edges}. 걸음은 아직 가려져 있습니다.`;
  const lanes = model.lanes
    .map((l) => `${l.name} 은 ${l.steps.map((s) => s.code).join(' 다음 ')}`)
    .join('. ');
  return `${head} ${lanes}. ${edges}.`;
}

/**
 * `.ps` — 나란한 걸음. 레인마다 걸음 사다리 하나, 레인 사이에 채널 연산이 만드는 간선.
 *
 * **「두 언어 나란히」와 다른 이유**: 간선이 내용이고 간선은 코드에서 계산된다(채널 연산의
 * 짝). 사다리 둘을 2단 격자에 넣는 것으로는 간선을 못 그리므로 이것은 배치가 아니라
 * 그림이다(`go-learning.md` §11.3.1).
 *
 * **간선은 이웃한 레인 사이의 골에 선다.** 레인이 떨어져 있으면 사이의 레인을 가로지르고,
 * 간선 둘이 같은 골의 같은 행에 겹치면 서로를 덮는다 — 안 재 봤다(diagrams.md §7).
 */
export function ParallelSteps({ model, phase = 'reveal', caption, labels }: ParallelStepsProps) {
  const L = withLabels(labels);
  const open = phase === 'reveal';
  const lanes = model.lanes;
  // 레인과 골이 번갈아 선다 — 레인 p 는 열 `2p+1`, 골 g 는 열 `2g+2`.
  const cols = lanes.map(() => 'minmax(7rem, max-content)').join(' 4.5rem ');

  return (
    <Diagram
      className="dgm-ps"
      label={describeParallel(model, phase, labels)}
      caption={caption}
      alt={
        <>
          <table>
            <caption>{`${L.altTable} — ${L.colLane}`}</caption>
            <thead>
              <tr>
                <th scope="col">{L.colLane}</th>
                <th scope="col">{L.colStep}</th>
                <th scope="col">{L.colCode}</th>
              </tr>
            </thead>
            <tbody>
              {lanes.flatMap((lane, li) =>
                lane.steps.map((s, si) => (
                  <tr key={`${li}-${si}-${s.code}`}>
                    <th scope="row">{lane.name}</th>
                    <td>{si + 1}</td>
                    <td>{open ? `${s.code} — ${s.type}` : L.hidden}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
          <table>
            <caption>{`${L.altTable} — ${L.colEdge}`}</caption>
            <thead>
              <tr>
                <th scope="col">{L.colEdge}</th>
                <th scope="col">{L.colStep}</th>
              </tr>
            </thead>
            <tbody>
              {model.edges.map((e, i) => (
                <tr key={`e-${i}`}>
                  <th scope="row">{e.label ?? channelLabel(e.kind, L)}</th>
                  <td>
                    {`${lanes[e.from[0]]?.name ?? '?'} ${e.from[1] + 1} → ${lanes[e.to[0]]?.name ?? '?'} ${e.to[1] + 1}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      }
    >
      <div className="ps" style={{ gridTemplateColumns: cols }}>
        {lanes.map((lane, li) => (
          <Fragment key={lane.name}>
            <p className="ps-lane" style={{ gridRow: 1, gridColumn: li * 2 + 1 }}>
              {lane.name}
            </p>
            {lane.steps.map((s, si) => (
              <span
                className={cx('ps-step', !open && 'veil')}
                style={{ gridRow: si + 2, gridColumn: li * 2 + 1 }}
                key={`${lane.name}-${si}-${s.code}`}
              >
                <span className="ps-code">{open ? s.code : ''}</span>
                <span className="ps-type">{open ? s.type : ''}</span>
              </span>
            ))}
          </Fragment>
        ))}

        {model.edges.map((e, i) => {
          const [la, sa] = e.from;
          const [lb, sb] = e.to;
          const left = Math.min(la, lb);
          const right = Math.max(la, lb);
          const top = Math.min(sa, sb);
          const bottom = Math.max(sa, sb);
          const dir = sb > sa ? 'down' : sb < sa ? 'up' : 'flat';
          return (
            <span
              key={`e-${i}`}
              className={cx('ps-edge', dir, lb > la ? 'right' : 'left', e.kind)}
              style={{
                gridRow: `${top + 2} / ${bottom + 3}`,
                gridColumn: `${left * 2 + 2} / ${right * 2 + 1}`,
              }}
            >
              <span className="ps-tag">{e.label ?? channelLabel(e.kind, L)}</span>
            </span>
          );
        })}
      </div>
    </Diagram>
  );
}
