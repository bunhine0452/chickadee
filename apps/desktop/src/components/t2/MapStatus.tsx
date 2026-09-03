import type { MapEdge } from './DependencyMap';
import './MapStatus.css';

export interface MapStatusProps {
  /** 지도와 같은 엣지 목록. 「쓰는 곳 · 쓰는 것」은 여기서 센다. */
  edges: readonly MapEdge[];
  /** `DependencyMap` 의 `onHover` 가 준 경로. 아무것도 안 짚었으면 `null`. */
  hovered: string | null;
  graded: boolean;
}

/**
 * `.map-status` — 지도 아래 두 줄 (05 §5).
 *
 * **`aria-live` 를 걸지 않는다.** Tab 으로 24개를 지나가면 24번 읽어 주게 되고, 같은 사실은
 * 노드의 `aria-label` 이 이미 싣고 있다. 여기 문장은 마우스를 쓰는 사람을 위한 것이다.
 */
export function MapStatus({ edges, hovered, graded }: MapStatusProps) {
  if (hovered === null) {
    return (
      <div className="map-status">
        <span>파일 상자에 마우스를 올리면 연결이 보이고, 클릭하면 고릅니다.</span>
        <span>위쪽 = 사용자와 가까운 쪽 · 아래쪽 = 데이터와 가까운 쪽</span>
      </div>
    );
  }

  const uses = edges.filter(([, to]) => to === hovered).length;
  const used = edges.filter(([from]) => from === hovered).length;

  return (
    <div className="map-status">
      <span>
        <b>{hovered}</b> · 이 파일을 쓰는 곳 <b>{uses}</b> · 이 파일이 쓰는 것 <b>{used}</b>
      </span>
      <span>{graded ? '✓ 맞게 고름 · ＋ 놓침 · ✕ 아닌데 고름 · ◆ 같이 바뀜' : '클릭하면 선택 / 해제'}</span>
    </div>
  );
}
