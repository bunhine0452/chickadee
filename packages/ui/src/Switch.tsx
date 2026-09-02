import type { KeyboardEvent } from 'react';
import './Switch.css';

export interface SwitchOption<V extends string = string> {
  v: V;
  label: string;
}

export interface SwitchProps<V extends string = string> {
  options: ReadonlyArray<SwitchOption<V>>;
  value: V;
  /** 스크린리더 이름. **필수** — 색면 하나로 상태를 읽을 수 없다 (05 §9). */
  label: string;
  onChange: (v: V) => void;
}

function step<V extends string>(options: ReadonlyArray<SwitchOption<V>>, value: V, delta: number): V | null {
  const at = options.findIndex((o) => o.v === value);
  if (at < 0) return null;
  const next = options[(at + delta + options.length) % options.length];
  return next === undefined ? null : next.v;
}

/**
 * `.sw` — 주간반/야간반 · 부속 보임/숨김 같은 두 갈래 스위치.
 * 2개면 `role=switch`(하나의 버튼), 3개(`.dfilter`)면 `role=radiogroup` (05 §5).
 */
export function Switch<V extends string = string>({ options, value, label, onChange }: SwitchProps<V>) {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code !== 'ArrowLeft' && e.code !== 'ArrowRight') return;
    const next = step(options, value, e.code === 'ArrowLeft' ? -1 : 1);
    if (next === null) return;
    e.preventDefault();
    onChange(next);
  };

  if (options.length === 2) {
    const [first, second] = options;
    if (first === undefined || second === undefined) return null;
    const onSecond = value === second.v;
    return (
      <button
        type="button"
        className="sw"
        role="switch"
        aria-checked={onSecond}
        aria-label={label}
        onKeyDown={onKeyDown}
        onClick={() => onChange(onSecond ? first.v : second.v)}
      >
        {options.map((o) => (
          <span key={o.v} className={o.v === value ? 'on' : undefined}>
            {o.label}
          </span>
        ))}
      </button>
    );
  }

  // 화살표·Space·Enter 는 라디오(=포커스가 실제로 앉는 곳)에서 받는다.
  // radiogroup 컨테이너에 핸들러를 달면 포커스 없는 대화형 요소가 된다.
  return (
    <div className="sw" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <span
          key={o.v}
          role="radio"
          aria-checked={o.v === value}
          tabIndex={o.v === value ? 0 : -1}
          className={o.v === value ? 'on' : undefined}
          onClick={() => onChange(o.v)}
          onKeyDown={(e) => {
            if (e.code === 'Space' || e.code === 'Enter') {
              e.preventDefault();
              onChange(o.v);
              return;
            }
            onKeyDown(e);
          }}
        >
          {o.label}
        </span>
      ))}
    </div>
  );
}
