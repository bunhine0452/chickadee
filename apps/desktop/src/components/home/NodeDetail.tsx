import { useEffect, useRef } from 'react';
import { Dee, Kbd, Passes, Pill } from '@chickadee/ui';

import type { HomeNode } from '../../screens/home/data';
import { dueLabel, inkTrack, layerText, trackName } from './labels';
import './NodeDetail.css';

export interface NodeDetailProps {
  node: HomeNode;
  /** 「이 판 찍기」. 없으면 버튼을 내지 않는다 (잠긴 스티커). */
  onGo?: ((conceptId: string) => void) | undefined;
  onClose: () => void;
  /** 만기 문구의 기준 시각. 테스트는 고정값을 넣는다. */
  now?: number | undefined;
}

/** 잠긴 스티커가 왜 잠겼는지. 순서는 개념의 선행 관계에서 나온다 (02 §7.1). */
function lockedBody(): string {
  return '이 스티커는 앞 판이 먼저입니다. 앞 판을 찍으면 바로 도려집니다. 순서는 개념의 선행 관계에서 나옵니다.';
}

function body(node: HomeNode, at: number): string {
  if (node.shownLayer >= 4) {
    return '4겹이라 완성입니다. 시간이 지나면 한 겹 흐려지고 그때 다시 찍습니다.';
  }
  return `다음 인쇄는 ${dueLabel(node.dueAt, at)}입니다. 맞히면 ${node.shownLayer + 1}겹이 됩니다.`;
}

/**
 * `.detail` — 스티커를 누르면 펼쳐지는 상세.
 * 열리면 포커스가 여기로 오고 Esc 로 닫힌다. 닫을 때 포커스를 돌려보내는 것은 `Sheet` 의 몫이다.
 */
export function NodeDetail({ node, onGo, onClose, now }: NodeDetailProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const at = now ?? Date.now();
  const locked = node.state === 'locked';
  const track = inkTrack(node.track);

  // 닫기는 매 렌더 새 함수로 오므로 ref 로 받는다 — 리스너를 다시 걸면 포커스를 또 뺏는다.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  // 열리면 포커스가 여기로 온다 (05 §5).
  useEffect(() => {
    ref.current?.focus();
  }, [node.conceptId]);

  // Esc = 닫기. 네이티브 리스너로 건다 — `region` 은 대화형 요소가 아니라서
  // JSX 핸들러를 달면 jsx-a11y 가 막고, 막는 이유(마우스 사용자가 못 쓴다)는
  // 「닫기」 버튼이 이미 해결한다.
  useEffect(() => {
    const el = ref.current;
    if (el === null) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.code !== 'Escape') return;
      e.preventDefault();
      closeRef.current();
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="detail open">
      <div
        ref={ref}
        className="detail-in"
        role="region"
        aria-label={`${node.nameKo} 상세`}
        tabIndex={-1}
      >
        <Dee ly={locked ? 0 : node.shownLayer} sticker />
        <div>
          <h4>
            {node.nameKo}
            {locked ? ' — 아직 판이 걸리지 않았습니다' : ''}
          </h4>
          <p>{locked ? lockedBody() : body(node, at)}</p>
        </div>
        {locked ? null : (
          <div className="detail-ly">
            <Pill track={track}>{trackName(node.track)}</Pill>
            <span className="lyn">{layerText(node.shownLayer)}</span>
            <Passes
              n={node.shownLayer}
              track={track}
              label={`${trackName(node.track)} · 잉크 ${node.shownLayer}겹`}
            />
          </div>
        )}
        {locked || onGo === undefined ? null : (
          <button type="button" className="detail-go" onClick={() => onGo(node.conceptId)}>
            이 판 찍기
          </button>
        )}
        <button type="button" className="detail-x" onClick={onClose}>
          닫기 <Kbd keys="Esc" />
        </button>
      </div>
    </div>
  );
}
