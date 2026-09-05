import type { ReactNode } from 'react';

import './Board.css';

export interface BoardProps {
  /** 은유 이름. 「cart-shop-web 대지」. */
  title: ReactNode;
  /** 은유 옆의 평문. 「= 내 리포의 기능 지도」. */
  plain?: string | undefined;
  /** 머리 아래 한 문단. */
  note?: ReactNode;
  children: ReactNode;
}

/**
 * `.board` — 대지 전체를 얹는 판.
 * 화면이 홈으로 돌아올 때 포커스가 여기로 온다 (`main[tabindex=-1]`, 05 §2.2).
 *
 * 머리 오른쪽의 트랙 색 범례는 D179 로 지웠다 — 트랙이 더 이상 색을 고르지 않으므로
 * 색 범례가 설명할 것이 없다. 트랙은 노드의 `T0`·`T1`·`T2` 라벨이 말한다.
 */
export function Board({ title, plain, note, children }: BoardProps) {
  return (
    <main className="board grain" tabIndex={-1}>
      <div className="board-head">
        <div>
          <h1 className="board-title">
            {title}
            {plain === undefined ? null : <span className="pl">{plain}</span>}
          </h1>
          {note === undefined ? null : <p className="board-note">{note}</p>}
        </div>
      </div>
      {children}
    </main>
  );
}
