import type { ReactNode } from 'react';
import './Say.css';

export interface SayProps {
  children: ReactNode;
}

/**
 * `.say` — 길잡이 Dee 의 말풍선.
 * 장식이므로 `aria-hidden`; 같은 문구는 `LiveRegion` 이 따로 읽는다 (05 §5).
 */
export function Say({ children }: SayProps) {
  return (
    <span className="say" aria-hidden="true">
      {children}
    </span>
  );
}
