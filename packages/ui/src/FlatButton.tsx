import type { ReactNode } from 'react';
import { cx } from './cx';
import './FlatButton.css';

export interface FlatButtonProps {
  ghost?: boolean | undefined;
  /** `.dunno` = 「모르겠어요」 토글. 감점 없음 (00 §3 용어집). */
  variant?: 'dunno' | undefined;
  /** `dunno` 일 때의 눌림 상태 → `aria-pressed`. */
  on?: boolean | undefined;
  disabled?: boolean | undefined;
  onClick?: (() => void) | undefined;
  children: ReactNode;
}

/** `.flat-btn` — 얇은 종이 보조 버튼. */
export function FlatButton({ ghost, variant, on, disabled, onClick, children }: FlatButtonProps) {
  const isToggle = variant === 'dunno';
  return (
    <button
      type="button"
      className={cx('flat-btn', ghost && 'ghost', isToggle && 'dunno', isToggle && on === true && 'on')}
      disabled={disabled === true}
      onClick={onClick}
      {...(isToggle ? { 'aria-pressed': on === true } : {})}
    >
      {children}
    </button>
  );
}
