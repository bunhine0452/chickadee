import { Dee } from '@chickadee/ui';
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
 * 장식이므로 접근성 트리에서 뺀다 — 겹은 `Passes` 와 시트 머리의 글자가 나른다 (05 §5).
 */
export function InkRail({ ly, label }: InkRailProps) {
  return (
    <div className="rail" aria-hidden="true">
      <Dee ly={ly} sticker />
      <span className="vt">{label}</span>
    </div>
  );
}
