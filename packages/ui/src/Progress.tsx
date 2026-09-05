import { cx } from './cx';
import './Progress.css';

export type ProgressTone = 'accent' | 'ok' | 'warn' | 'bad';

export interface ProgressProps {
  /** 지금 값. `max` 로 나눠 폭이 된다. */
  value: number;
  max?: number | undefined;
  /**
   * 스크린리더 문장. **필수** — 막대의 길이는 색이나 폭으로만 읽히므로
   * 글자가 같은 정보를 따로 날라야 한다 (05 §9 색맹 행).
   */
  label: string;
  tone?: ProgressTone | undefined;
  size?: 'sm' | 'md' | 'lg' | undefined;
  /** 칸으로 나눈 판 — 「몇 개 중 몇 개」가 뜻인 자리. `max` 가 칸 수가 된다. */
  steps?: boolean | undefined;
}

/** `.prog` — 진행 막대. */
export function Progress({ value, max = 100, label, tone = 'accent', size = 'md', steps }: ProgressProps) {
  const cap = Math.max(1, max);
  const at = Math.min(Math.max(value, 0), cap);
  return (
    <span
      className={cx('prog', tone !== 'accent' && tone, size !== 'md' && size, steps === true && 'steps')}
      role="progressbar"
      aria-valuenow={at}
      aria-valuemin={0}
      aria-valuemax={cap}
      aria-label={label}
    >
      <span className="prog-track">
        {steps === true
          ? Array.from({ length: cap }, (_, i) => (
              <span key={i} className={cx('prog-step', i < at && 'on')} />
            ))
          : <span className="prog-fill" style={{ width: `${(at / cap) * 100}%` }} />}
      </span>
    </span>
  );
}
