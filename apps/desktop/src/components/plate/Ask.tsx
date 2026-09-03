import { RichText } from '@chickadee/ui';

import './Ask.css';

export interface AskProps {
  /** 물음 한 줄. 문법 사전에서 온 서식 글이라 `RichText` 를 거친다 (D42). */
  q: string;
  /** 물음 아래 작은 줄. 고른 것이 바뀔 때마다 갈아 끼운다. */
  hint: string;
}

/**
 * `.ask` — 교정지의 물음 (05 §5).
 *
 * `<p>` 이므로 `reset.css` 의 `max-width: var(--measure)` 가 자동으로 걸린다 —
 * 한글 35~45자에서 행이 접힌다 (05 §4.2). 본문 단이라 인쇄 물리는 얹지 않는다.
 */
export function Ask({ q, hint }: AskProps) {
  return (
    <p className="ask">
      <RichText html={q} />
      <small>
        <RichText html={hint} />
      </small>
    </p>
  );
}
