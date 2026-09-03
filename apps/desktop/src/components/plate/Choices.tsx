import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { cx, RichText } from '@chickadee/ui';

import './Choices.css';

/** 물리 키로 고르는 보기 수. 05 §7 의 `1~4` 그대로. */
const DIGIT_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4'] as const;
const NUMPAD_KEYS = ['Numpad1', 'Numpad2', 'Numpad3', 'Numpad4'] as const;

export interface ChoiceOption {
  /** 보기 글. `mono` 가 아니면 사전에서 온 서식 글이라 `RichText` 를 거친다. */
  t: string;
  /** 코드 조각 보기 — 고정폭으로 그리고 서식을 해석하지 않는다. */
  mono?: boolean | undefined;
}

export interface ChoiceProps {
  /** 보기 번호(1부터). */
  k: number;
  option: ChoiceOption;
  selected: boolean;
  right?: boolean | undefined;
  wrong?: boolean | undefined;
  disabled?: boolean | undefined;
  tabIndex?: number | undefined;
  onSelect?: ((k: number) => void) | undefined;
}

/** `.ch` — 두꺼운 종이 보기 하나. 색은 테두리·번호에만 얹는다 (05 §5). */
export function Choice({ k, option, selected, right, wrong, disabled, tabIndex, onSelect }: ChoiceProps) {
  return (
    <button
      type="button"
      className={cx(
        'ch',
        option.mono === true && 'code-choice',
        selected && 'sel',
        right === true && 'right',
        wrong === true && 'wrong',
      )}
      data-k={k}
      role="radio"
      aria-checked={selected}
      disabled={disabled === true}
      tabIndex={tabIndex}
      onClick={() => onSelect?.(k)}
    >
      <span className="n">{k}</span>
      <span className="t">{option.mono === true ? option.t : <RichText html={option.t} />}</span>
    </button>
  );
}

export interface ChoicesProps {
  options: readonly ChoiceOption[];
  /** 고른 보기 번호(1부터). 아직 안 골랐으면 `null`. */
  selected: number | null;
  /** 채점된 뒤의 정답 번호. 주면 보기가 굳는다. */
  answer?: number | null | undefined;
  /** 한 칸짜리 목록 — 목업의 `.choices.one`. */
  one?: boolean | undefined;
  onSelect?: ((k: number) => void) | undefined;
}

/**
 * `.choices` — 보기 묶음 (05 §5).
 * `1~4` 로 바로 고르고 `↑↓` 로 옮긴다. 판정은 물리 키(`e.code`)로만 한다 (05 §7).
 */
export function Choices({ options, selected, answer, one, onSelect }: ChoicesProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const graded = answer !== null && answer !== undefined;

  const focusOn = (k: number) => {
    ref.current?.querySelector<HTMLButtonElement>(`.ch[data-k="${k}"]`)?.focus();
  };

  const pick = (k: number) => {
    if (k < 1 || k > options.length) return;
    onSelect?.(k);
    focusOn(k);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // 조합 중인 글쇠는 단축키가 아니다 (05 §7).
    if (e.nativeEvent.isComposing || graded) return;

    if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
      e.preventDefault();
      const delta = e.code === 'ArrowDown' ? 1 : -1;
      const at = selected === null ? (delta > 0 ? 0 : options.length - 1) : (selected - 1 + delta + options.length) % options.length;
      pick(at + 1);
      return;
    }

    const digit = DIGIT_KEYS.indexOf(e.code as (typeof DIGIT_KEYS)[number]);
    const pad = NUMPAD_KEYS.indexOf(e.code as (typeof NUMPAD_KEYS)[number]);
    const n = digit >= 0 ? digit + 1 : pad >= 0 ? pad + 1 : 0;
    if (n === 0 || n > options.length) return;
    e.preventDefault();
    pick(n);
  };

  return (
    <div
      ref={ref}
      className={cx('choices', one === true && 'one')}
      role="radiogroup"
      aria-label="보기"
      // 탭 순서에는 넣지 않는다 — 묶음 안의 라디오가 로빙 tabindex 로 돌고,
      // 묶음 자신은 프로그램에서만 포커스를 받는다.
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      {options.map((option, i) => {
        const k = i + 1;
        return (
          <Choice
            key={k}
            k={k}
            option={option}
            selected={selected === k}
            right={graded && answer === k}
            wrong={graded && selected === k && answer !== k}
            disabled={graded}
            tabIndex={selected === null ? (k === 1 ? 0 : -1) : selected === k ? 0 : -1}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}
