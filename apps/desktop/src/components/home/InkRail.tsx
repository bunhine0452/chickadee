import type { InkLayer } from '@chickadee/ui';

import './InkRail.css';

export interface InkRailProps {
  /** 시트의 새 선명도 = 노드 겹의 내림 평균. */
  ly: InkLayer;
  /** 세로로 찍히는 「판 02 · 2도」. */
  label: string;
}

/**
 * `.rail` — 대지 왼쪽의 인쇄 사양 띠.
 *
 * 겹은 **숫자**가 말한다. 전에는 겹만큼 판이 켜진 마스코트가 섰는데, 같은 정보를 시트
 * 머리의 글자와 `Passes` 막대가 이미 나르고 있었다 (D179 · 정본 §7).
 * 장식이므로 접근성 트리에서 뺀다.
 */
export function InkRail({ ly, label }: InkRailProps) {
  return (
    <div className="rail" aria-hidden="true">
      <b className="rail-ly">{ly}</b>
      <span className="vt">{label}</span>
    </div>
  );
}
