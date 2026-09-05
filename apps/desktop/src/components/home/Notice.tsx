import type { ReactNode } from 'react';
import { useId } from 'react';

import './Notice.css';

export interface NoticeProps {
  title: string;
  children: ReactNode;
}

/**
 * `.notice` — 홈 위쪽의 안내 한 덩이 (재인제스트 · 초보 안내).
 *
 * **아무것도 잠그지 않는다.** 게이트가 아니라 안내이므로 단추도 닫기도 없고, 조건이
 * 풀리면 스스로 사라진다. 경고 색을 쓰지 않는 것도 같은 이유다 — 색은 뜻에만 쓰고
 * (정본 §6), 이것은 잘못된 상태가 아니다.
 */
export function Notice({ title, children }: NoticeProps) {
  const id = useId();
  return (
    <aside className="notice" aria-labelledby={id}>
      <b id={id} className="notice-k">{title}</b>
      {children}
    </aside>
  );
}
