import type { ReactNode } from 'react';

import './SplitPane.css';

export interface SplitPaneProps {
  /** 왼쪽 단 하나. 격자가 3열이라 조각 하나여야 한다 (여럿이면 자가 밀린다). */
  left: ReactNode;
  /** 오른쪽 단 하나. */
  right: ReactNode;
}

/**
 * `.split` — 지지대와 내 손을 나란히 놓는 2단 (05 §5).
 *
 * 이 컴포넌트의 요점은 **트랙 폭이 절대 안 바뀌는 것**이다. `minmax(300px,1fr) 2px
 * minmax(300px,1fr)` 를 CSS 가 들고 있고 드래그 손잡이는 없다 — 필사 중에 폭이 흔들리면
 * 눈이 원본에서 떨어진다. 창이 좁아도 접지 않는다(최소 1000×680, D11).
 */
export function SplitPane({ left, right }: SplitPaneProps) {
  return (
    <div className="split">
      {left}
      <div className="vr" aria-hidden="true" />
      {right}
    </div>
  );
}
