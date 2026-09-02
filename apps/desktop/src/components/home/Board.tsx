import type { ReactNode } from 'react';

import { Legend } from './Legend';
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
        <Legend />
      </div>
      {children}
    </main>
  );
}
