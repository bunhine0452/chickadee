import type { ElementType } from 'react';
import { cx } from './cx';
import './Misreg.css';

export interface MisregProps {
  /** 감쌀 요소. 큰 활자에만 쓴다 (`b` · `span` · `em` …). */
  as?: ElementType | undefined;
  /** 본문이자 `data-w` 로 복제되는 유령 판 문구. */
  text: string;
  className?: string | undefined;
}

/**
 * `.mr` — 판 어긋남. 가상요소 복제본은 `aria-hidden` 이 아니라 아예 접근성 트리에
 * 없다(`::before` 의 `content`), 진짜 글자는 `<span>` 하나뿐이라 두 번 읽히지 않는다.
 */
export function Misreg({ as, text, className }: MisregProps) {
  const As: ElementType = as ?? 'span';
  return (
    <As className={cx('mr', className)} data-w={text}>
      <span>{text}</span>
    </As>
  );
}
