import { memo } from 'react';
import { t, type MessageKey } from '@chickadee/i18n';
import { Passes } from '@chickadee/ui';

import type { HomeNode } from '../../screens/home/data';
import { glyphOf, inkTrack, layerLabel, nodeSeed, trackName } from './labels';
import './Node.css';

export interface NodeProps {
  node: HomeNode;
  /** 시트 안에서 몇 번째인가. 도장이 내려앉는 순서에만 쓴다. */
  index: number;
  /** 이 스티커의 상세가 열려 있는가. */
  expanded: boolean;
  onOpen: (conceptId: string) => void;
}

const TRACK_TAG: Readonly<Record<HomeNode['track'], string>> = {
  t0: 'T0',
  t1: 'T1',
  t2: 'T2',
  t3: 'T3',
};

/** 표가 문장이 아니라 **키**를 드는 이유는 로케일이다 (D117). */
const STATE_KEY: Readonly<Record<HomeNode['state'], MessageKey>> = {
  done: 'home.stateDone',
  current: 'home.stateCurrent',
  locked: 'home.stateLocked',
  open: 'home.stateOpen',
};

/**
 * `.node` — 대지 위의 스티커 하나.
 *
 * 잠긴 스티커도 **포커스를 받고 상세가 열린다**. 흔들지 않는다 — 이유를 상세에 적는다 (D11).
 * `--dy/--rot/--d` 는 개념 id 해시로 정해져 리렌더에 흔들리지 않는다 (05 §10).
 */
export const Node = memo(function Node({ node, index, expanded, onOpen }: NodeProps) {
  const locked = node.state === 'locked';
  const track = inkTrack(node.track);
  const label = t('home.nodeLabel', {
    name: node.nameKo,
    track: trackName(node.track),
    layer: layerLabel(node.shownLayer),
    state: t(STATE_KEY[node.state]),
  });

  return (
    <button
      type="button"
      className="node"
      data-concept={node.conceptId}
      data-state={node.state}
      data-track={node.track}
      style={nodeSeed(node.conceptId, index)}
      aria-label={label}
      aria-expanded={expanded}
      aria-disabled={locked || undefined}
      onClick={() => onOpen(node.conceptId)}
    >
      <span className="die" aria-hidden="true">
        {node.state === 'current' ? (
          <>
            <svg className="cut" viewBox="0 0 100 100" focusable="false">
              <circle cx="50" cy="50" r="47" />
            </svg>
            <span className="now-flag">{t('home.stateCurrent')}</span>
          </>
        ) : null}
        <span className="tag">{TRACK_TAG[node.track]}</span>
        <span className="face">
          <span className="g">{glyphOf(node)}</span>
        </span>
        {node.state === 'done' ? (
          <span className="ck">
            <svg viewBox="0 0 20 20" fill="none" focusable="false">
              <path
                d="M3 10.5l4.5 4.5L17 5"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        ) : null}
      </span>
      <span className="n-label">{node.nameKo}</span>
      <Passes n={node.shownLayer} track={track} label={layerLabel(node.shownLayer)} compact />
    </button>
  );
});
