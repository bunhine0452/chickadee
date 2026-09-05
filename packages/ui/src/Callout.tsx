import type { ReactNode } from 'react';
import { cx } from './cx';
import './Callout.css';

export type CalloutTone = 'neutral' | 'ok' | 'bad' | 'warn' | 'info';

export interface CalloutProps {
  tone?: CalloutTone | undefined;
  /**
   * 종류를 말하는 글자. 아이콘·이모지를 쓰지 않는 이유는 색맹 규약(05 §9)과 같다 —
   * 색과 그림은 뜻을 절반만 나른다.
   */
  title?: ReactNode | undefined;
  /** 오답 진단처럼 스스로 알려야 하는 자리는 `status` 로 (05 §7). */
  live?: boolean | undefined;
  children: ReactNode;
}

/** `.callout` — 한 문단짜리 알림·진단. */
export function Callout({ tone = 'neutral', title, live, children }: CalloutProps) {
  return (
    <div
      className={cx('callout', tone !== 'neutral' && tone)}
      {...(live === true ? { role: 'status', 'aria-live': 'polite' as const } : {})}
    >
      {title === undefined ? null : <p className="callout-title">{title}</p>}
      {children}
    </div>
  );
}
