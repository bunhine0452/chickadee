import type { ReactNode } from 'react';
import { cx } from '../cx';
import { Diagram } from './Diagram';
import { withLabels, type DiagramLabels } from './labels';
import type { ConversionEdge, ConversionKind, ConversionLadderModel, DiagramPhase } from './types';
import './ConversionLadder.css';

export interface ConversionLadderProps {
  model: ConversionLadderModel;
  /** `predict` 는 칸의 **값**과 간선의 결과를 가린다. 타입·간선·간선 이름은 남는다. */
  phase?: DiagramPhase | undefined;
  caption?: ReactNode | undefined;
  labels?: Partial<DiagramLabels> | undefined;
}

/** 간선 종류의 이름표. 색이 아니라 **낱말과 선 모양**이 셋을 가른다(정본 §6). */
export function kindLabel(kind: ConversionKind, labels: DiagramLabels): string {
  if (kind === 'widen') return labels.widen;
  if (kind === 'narrow') return labels.narrow;
  return labels.fallible;
}

/** 간선 하나를 한 마디로. 표 대체와 낭독 문장이 같은 문장을 쓴다. */
function edgeText(model: ConversionLadderModel, e: ConversionEdge, L: DiagramLabels): string {
  const from = model.rungs[e.from]?.type ?? '?';
  const to = model.rungs[e.to]?.type ?? '?';
  const name = e.label === undefined ? '' : `${e.label} 로 `;
  return `${from} 에서 ${to} 로는 ${name}${kindLabel(e.kind, L)}`;
}

/**
 * 낭독기 한 문장. 칸을 세지 않고 **어느 방향이 되고 어느 방향이 잘리나**를 말한다 —
 * 이 그림이 나르는 것은 값이 아니라 관계다(diagrams.md §3 상자).
 */
export function describeLadder(
  model: ConversionLadderModel,
  phase: DiagramPhase = 'reveal',
  labels?: Partial<DiagramLabels> | undefined,
): string {
  const L = withLabels(labels);
  const types = model.rungs.map((r) => r.type).join(', ');
  const head = `타입 ${model.rungs.length}칸 — ${types}.`;
  const edges = model.edges.map((e) => edgeText(model, e, L)).join('. ');
  if (phase === 'predict') return `${head} ${edges}. 값은 아직 가려져 있습니다.`;
  const vals = model.rungs.map((r) => `${r.type} 은 ${r.value}`).join(', ');
  return `${head} ${edges}. ${vals}.`;
}

/**
 * `.cl` — 타입 변환 사다리. 칸이 타입이고 **간선이 관계**다.
 *
 * 비트 배열 둘로 못 대신한다(diagrams.md §3 상자 · I4 확인) — 비트 배열은 값 하나를
 * 그리므로 `as` 뛰어내림 · `From` 올라감 · `TryFrom` 갈라짐 셋을 못 그린다. 그래서
 * `edges` 가 모델에 따로 있고, **언어별 간선 집합을 프롭으로 받는다.**
 */
export function ConversionLadder({ model, phase = 'reveal', caption, labels }: ConversionLadderProps) {
  const L = withLabels(labels);
  const open = phase === 'reveal';

  return (
    <Diagram
      className="dgm-cl"
      label={describeLadder(model, phase, labels)}
      caption={caption}
      alt={
        <>
          <table>
            <caption>{`${L.altTable} — ${L.colType}`}</caption>
            <thead>
              <tr>
                <th scope="col">{L.colType}</th>
                <th scope="col">{L.colValue}</th>
                <th scope="col">{L.colMeaning}</th>
              </tr>
            </thead>
            <tbody>
              {model.rungs.map((r, i) => (
                <tr key={`${i}-${r.type}`}>
                  <th scope="row">{r.type}</th>
                  <td>{open ? r.value : L.hidden}</td>
                  <td>{open ? (r.note ?? '') : L.hidden}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table>
            <caption>{`${L.altTable} — ${L.colEdge}`}</caption>
            <thead>
              <tr>
                <th scope="col">{L.colEdge}</th>
                <th scope="col">{L.colValue}</th>
              </tr>
            </thead>
            <tbody>
              {model.edges.map((e, i) => (
                <tr key={`e-${i}-${e.from}-${e.to}`}>
                  <th scope="row">{edgeText(model, e, L)}</th>
                  <td>{open ? (e.result ?? (model.rungs[e.to]?.value ?? '')) : L.hidden}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      }
    >
      <div
        className="cl"
        style={{ gridTemplateColumns: `max-content repeat(${Math.max(model.edges.length, 1)}, 6.5rem)` }}
      >
        {model.rungs.map((r, i) => (
          <span className={cx('cl-rung', !open && 'veil')} style={{ gridRow: i + 1, gridColumn: 1 }} key={`${i}-${r.type}`}>
            <span className="cl-type">{r.type}</span>
            <span className="cl-val">{open ? r.value : ''}</span>
            {open && r.note !== undefined ? <span className="cl-note">{r.note}</span> : null}
          </span>
        ))}

        {/* 간선마다 자기 열을 쓴다 — 겹치면 어느 화살이 어느 것인지 못 읽는다. */}
        {model.edges.map((e, i) => {
          const top = Math.min(e.from, e.to);
          const bottom = Math.max(e.from, e.to);
          const up = e.to < e.from;
          // 결과가 도착 칸의 값과 같으면 두 번 안 적는다 — 같은 값을 두 자리에 적으면 눈이 센다.
          const extra = e.result !== undefined && e.result !== model.rungs[e.to]?.value ? e.result : null;
          return (
            <span
              key={`e-${i}-${e.from}-${e.to}`}
              className={cx('cl-edge', e.kind, up ? 'up' : 'down')}
              style={{ gridRow: `${top + 1} / ${bottom + 2}`, gridColumn: i + 2 }}
            >
              <span className="cl-tag">
                <span className="cl-op">{e.label ?? kindLabel(e.kind, L)}</span>
                <span className="cl-kind">
                  {kindLabel(e.kind, L)}
                  {open && extra !== null ? <span className="cl-res">{extra}</span> : null}
                </span>
              </span>
            </span>
          );
        })}
      </div>
    </Diagram>
  );
}
