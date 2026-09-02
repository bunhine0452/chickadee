import { cx } from './cx';
import './Toast.css';

/** 토스트가 떠 있는 시간 (목업 `toast()` 3.6s). */
export const TOAST_MS = 3600;

export interface ToastProps {
  /** 한 줄 문구. 부제는 `sub`. */
  msg: string;
  sub?: string | undefined;
  /** 떠 있는가. `ui.toast !== null` 을 그대로 넘긴다 (05 §3). */
  on: boolean;
}

/**
 * `.toast` — 조작 결과. 절대 포커스를 받지 않는다 (05 §7).
 * 부제(`sub`)는 `LiveRegion` 으로 보내지 않는다 (05 §7 문구 규약).
 */
export function Toast({ msg, sub, on }: ToastProps) {
  return (
    <div className={cx('toast', on && 'on')} role="status" aria-live="polite">
      {msg}
      {sub === undefined ? null : <small>{sub}</small>}
    </div>
  );
}
