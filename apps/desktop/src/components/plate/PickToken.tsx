import { cx } from '@chickadee/ui';

import { hl } from './hl';
import './PickToken.css';

export interface PickTokenProps {
  /** 토큰 번호(1부터). `1~4` 물리 키와 짝이다 (05 §7). */
  k: number;
  /** 토큰 원문. 그대로 강조해 그리고 스크린리더에는 이 글자를 읽힌다. */
  label: string;
  checked: boolean;
  /** 채점 뒤 — 정답 자리. */
  right?: boolean | undefined;
  /** 채점 뒤 — 내가 짚었는데 어긋난 자리. */
  wrong?: boolean | undefined;
  disabled?: boolean | undefined;
  tabIndex?: number | undefined;
  onPick?: ((k: number) => void) | undefined;
}

/**
 * `.tk` — 코드 판 안에서 짚을 수 있는 토큰 (05 §5).
 * 지목형에서 이 버튼이 곧 보기다. 라디오이므로 묶음 안에서 하나만 켜진다.
 */
export function PickToken({ k, label, checked, right, wrong, disabled, tabIndex, onPick }: PickTokenProps) {
  return (
    <button
      type="button"
      className={cx('tk', checked && 'sel', right === true && 'right', wrong === true && 'wrong')}
      data-k={k}
      role="radio"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled === true}
      tabIndex={tabIndex}
      onClick={() => onPick?.(k)}
    >
      {hl(label).map((tk, i) =>
        tk.cls === null ? (
          <span key={i}>{tk.t}</span>
        ) : (
          <i key={i} className={tk.cls}>
            {tk.t}
          </i>
        ),
      )}
    </button>
  );
}
