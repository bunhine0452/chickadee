import { useId } from 'react';
import type { ReactNode } from 'react';

import './Panel.css';

export interface PanelProps {
  /** 은유 이름. 「잉크 겹」. */
  title: string;
  /** 은유 옆의 평문. 「= 얼마나 익혔나」 (정본 §6). */
  plain?: string | undefined;
  /** 오른쪽 끝의 작은 표기. 「4겹 = 완성」. */
  tag?: string | undefined;
  children: ReactNode;
}

/** `.panel` — 작업대 위의 판 하나. */
export function Panel({ title, plain, tag, children }: PanelProps) {
  const id = useId();
  return (
    <section className="panel" aria-labelledby={id}>
      <div className="panel-h">
        <b id={id}>{title}</b>
        {plain === undefined ? null : <span className="pl">{plain}</span>}
        <i className="ruleline" aria-hidden="true" />
        {tag === undefined ? null : <span className="tag-r">{tag}</span>}
      </div>
      {children}
    </section>
  );
}
