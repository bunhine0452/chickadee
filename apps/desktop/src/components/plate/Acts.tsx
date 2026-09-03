import type { ReactNode } from 'react';
import { RichText } from '@chickadee/ui';

import './Acts.css';

export interface ActsProps {
  /** 왼쪽 — 「모르겠어요 · 다시 찍기」. 맞혀도 남는다 (정본 §3-1). */
  left?: ReactNode;
  /** 가운데 안내. 서식 글이다. */
  hint?: string | undefined;
  /** 오른쪽 — 「확인」 / 「다음」. */
  right?: ReactNode;
}

/**
 * `.acts` — 교정지 맨 아래 동작 줄 (05 §5).
 * 왼쪽은 항상 「모르겠어요」 자리다. 맞혔을 때도 사라지지 않는다 — 개운하지 않으면
 * 눌러도 감점이 없다는 것이 이 줄의 약속이다.
 */
export function Acts({ left, hint, right }: ActsProps) {
  return (
    <div className="acts">
      {left}
      {hint === undefined ? null : (
        <span className="hint">
          <RichText html={hint} />
        </span>
      )}
      <span className="sp" />
      {right}
    </div>
  );
}
