import type { ReactNode } from 'react';
import { cx } from './cx';
import { Kbd } from './Kbd';
import './PressButton.css';

/** 제출이 거부됐을 때 버튼만 눌렸다 떼는 시간 (05 §5 `down`). */
export const PRESS_DOWN_MS = 120;

export interface PressButtonProps {
  /** 목업 클래스 그대로: 기본(진홍) 또는 `.blue`. */
  tone?: 'pink' | 'blue' | undefined;
  /** 오른쪽에 붙는 키 캡. */
  kbd?: string | undefined;
  disabled?: boolean | undefined;
  /** 눌린 포즈 유지 — 제출 거부 때 `PRESS_DOWN_MS` 동안 켠다. */
  down?: boolean | undefined;
  onClick?: (() => void) | undefined;
  children: ReactNode;
}

/** `.press-btn` — 두꺼운 종이가 눌리는 촉각 버튼. */
export function PressButton({ tone = 'pink', kbd, disabled, down, onClick, children }: PressButtonProps) {
  return (
    <button
      type="button"
      className={cx('press-btn', tone === 'blue' && 'blue', down && 'down')}
      disabled={disabled === true}
      onClick={onClick}
    >
      {children}
      {kbd === undefined ? null : <Kbd keys={kbd} />}
    </button>
  );
}
