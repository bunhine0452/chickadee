import type { KeyboardEvent, ReactNode } from 'react';
import { cx } from './cx';
import { Kbd } from './Kbd';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  /**
   * `primary` 는 **한 화면에 하나**다 — 지금 해야 할 일 (정본 §6 「하나의 초점」).
   * 둘을 나란히 두면 초점이 둘이 되고, 그때 학습자가 무엇을 먼저 볼지는 색이 아니라
   * 우연이 정한다.
   */
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  /** 오른쪽에 붙는 키 캡. 표기는 사람 말로, 판정은 `e.code` 로 (05 §7). */
  kbd?: string | undefined;
  /** 폭을 부모에 맞춘다. */
  full?: boolean | undefined;
  disabled?: boolean | undefined;
  /** 눌린 채 유지되는 토글이면 `aria-pressed` 를 낸다. */
  pressed?: boolean | undefined;
  onClick?: (() => void) | undefined;
  /**
   * **누르고 있는 동안**만 참인 동작 — T1 의 「원본 잠깐 보기」가 그렇다 (05 §7 · §8).
   * 마우스와 키보드를 같이 받는다: 떼거나 버튼을 벗어나면 `false` 다. `repeat` 는 무시하므로
   * 키를 누르고 있어도 한 번만 켜진다(횟수를 세는 쪽이 그것을 기대한다).
   */
  onHold?: ((down: boolean) => void) | undefined;
  children: ReactNode;
}

/** `.btn` — 이 시스템의 단 하나의 버튼. 변형은 면과 테두리만 바꾼다. */
export function Button({
  variant = 'secondary', size = 'md', kbd, full, disabled, pressed, onClick, onHold, children,
}: ButtonProps) {
  const hold = onHold === undefined
    ? {}
    : {
        onMouseDown: () => onHold(true),
        onMouseUp: () => onHold(false),
        onMouseLeave: () => onHold(false),
        onKeyDown: (e: KeyboardEvent) => {
          if (e.repeat || (e.code !== 'Enter' && e.code !== 'Space')) return;
          e.preventDefault();
          onHold(true);
        },
        onKeyUp: (e: KeyboardEvent) => {
          if (e.code === 'Enter' || e.code === 'Space') onHold(false);
        },
      };

  return (
    <button
      type="button"
      className={cx('btn', variant, size !== 'md' && size, full === true && 'full')}
      disabled={disabled === true}
      onClick={onClick}
      {...hold}
      {...(pressed === undefined ? {} : { 'aria-pressed': pressed })}
    >
      {children}
      {kbd === undefined ? null : <Kbd keys={kbd} />}
    </button>
  );
}
