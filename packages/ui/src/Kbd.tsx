import './Kbd.css';

export interface KbdProps {
  /** 물리 키 표기. 단축키 판정은 `e.code` 로 하지만 표기는 사람 말로 (05 §7). */
  keys: string;
}

/** `kbd.k` — 키 캡. */
export function Kbd({ keys }: KbdProps) {
  return <kbd className="k">{keys}</kbd>;
}
