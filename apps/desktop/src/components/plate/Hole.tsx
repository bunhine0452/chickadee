import { cx } from '@chickadee/ui';

import './Hole.css';

/** 빈칸 한 자리의 상태. 채점 전은 `empty`/`filled`, 채점 뒤는 `right`/`wrong`. */
export type HoleState = 'empty' | 'filled' | 'right' | 'wrong';

/** 아직 아무것도 안 써 넣은 빈칸에 찍히는 글자. 목업 그대로. */
export const HOLE_GLYPH = '▢';

export interface HoleProps {
  /** 써 넣은 글자. 없으면 `▢` 가 남는다. */
  value?: string | undefined;
  state: HoleState;
}

/**
 * `.hole` — 빈칸형에서 판에 뚫린 자리 (05 §5).
 * 판 안의 유일한 색 면(정답 표시)이 여기와 `.tok.ans` 다 — 그 밖에는 글자 색만 쓴다.
 */
export function Hole({ value, state }: HoleProps) {
  const filled = value !== undefined && value !== '';
  return (
    <span className={cx('hole', state !== 'empty' && state)} aria-label="빈칸" data-hole>
      {filled ? value : HOLE_GLYPH}
    </span>
  );
}
