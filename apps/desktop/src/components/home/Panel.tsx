import { useId, useState } from 'react';
import type { ReactNode } from 'react';

import './Panel.css';

export interface PanelProps {
  /** 은유 이름. 「잉크 겹」. */
  title: string;
  /** 은유 옆의 평문. 「= 얼마나 익혔나」 (정본 §6). */
  plain?: string | undefined;
  /** 오른쪽 끝의 작은 표기. 「4겹 = 완성」. */
  tag?: string | undefined;
  /**
   * 접을 수 있나 (D133). 왼쪽 단이 대지가 0장일 때도 1,719px 이라, 매일 보는 것이 아닌
   * 패널은 제목 줄만 남긴다. 접힌 속은 **지우지 않고 `hidden`** 으로만 덮는다.
   */
  collapsible?: boolean | undefined;
  /** 처음에 펼쳐져 있나. `collapsible` 일 때만 뜻이 있다. */
  defaultOpen?: boolean | undefined;
  children: ReactNode;
}

/** `.panel` — 작업대 위의 판 하나. */
export function Panel({ title, plain, tag, collapsible, defaultOpen, children }: PanelProps) {
  const id = useId();
  const bodyId = `${id}-body`;
  const [open, setOpen] = useState(defaultOpen ?? true);
  const shown = collapsible !== true || open;

  const head = (
    <>
      <b id={id}>{title}</b>
      {plain === undefined ? null : <span className="pl">{plain}</span>}
      <i className="ruleline" aria-hidden="true" />
      {tag === undefined ? null : <span className="tag-r">{tag}</span>}
    </>
  );

  return (
    <section className="panel" aria-labelledby={id} data-open={shown ? 'on' : 'off'}>
      {collapsible === true ? (
        <button
          type="button"
          className="panel-h panel-toggle"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((v) => !v)}
        >
          {head}
          <span className="panel-caret" aria-hidden="true">{open ? '−' : '+'}</span>
        </button>
      ) : (
        <div className="panel-h">{head}</div>
      )}
      <div id={bodyId} hidden={!shown}>{children}</div>
    </section>
  );
}
