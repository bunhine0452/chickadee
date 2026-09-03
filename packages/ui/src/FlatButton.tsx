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
  /**
   * **누르고 있는 동안**만 참인 동작 — T1 의 「원본 잠깐 보기」가 그렇다 (05 §7 · §8).
   * 마우스와 키보드를 같이 받는다: 떼거나 버튼을 벗어나면 `false` 다. `repeat` 는 무시하므로
   * 키를 누르고 있어도 한 번만 켜진다(횟수를 세는 쪽이 그것을 기대한다).
   */
  onHold?: ((down: boolean) => void) | undefined;
  children: ReactNode;
}

/** `.flat-btn` — 얇은 종이 보조 버튼. */
export function FlatButton({
  ghost, variant, on, disabled, onClick, onHold, children,
}: FlatButtonProps) {
  const isToggle = variant === 'dunno';
  const hold = onHold === undefined
    ? {}
    : {
        onMouseDown: () => onHold(true),
        onMouseUp: () => onHold(false),
        onMouseLeave: () => onHold(false),
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.repeat || (e.code !== 'Enter' && e.code !== 'Space')) return;
          e.preventDefault();
          onHold(true);
        },
        onKeyUp: (e: React.KeyboardEvent) => {
          if (e.code === 'Enter' || e.code === 'Space') onHold(false);
        },
      };
  return (
    <button
      type="button"
      className={cx('flat-btn', ghost && 'ghost', isToggle && 'dunno', isToggle && on === true && 'on')}
      disabled={disabled === true}
      onClick={onClick}
      {...hold}
      {...(isToggle ? { 'aria-pressed': on === true } : {})}
    >
      {children}
    </button>
  );
}
