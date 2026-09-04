import { t } from '@chickadee/i18n';
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
        <span>{t('map.statusHover')}</span>
        <span>{t('map.statusAxis')}</span>
      </div>
    );
  }

  const uses = edges.filter(([, to]) => to === hovered).length;
  const used = edges.filter(([from]) => from === hovered).length;

  return (
    <div className="map-status">
      <span>
        <b>{hovered}</b> · {t('map.statusUses')} <b>{uses}</b> · {t('map.statusUsed')}{' '}
        <b>{used}</b>
      </span>
      <span>{graded ? t('map.statusLegend') : t('map.statusClick')}</span>
    </div>
  );
}
