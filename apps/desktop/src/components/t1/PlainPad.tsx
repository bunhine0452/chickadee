import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { cx } from '@chickadee/ui';

import { cloneAriaLabel, MIN_ROWS, SAVE_DEBOUNCE_MS, TAB_TEXT } from './monacoOptions';
import type { ClonePadProps } from './ClonePad';
import './ClonePad.css';

/** 목업 `bindEditor` 의 Enter 처리 — 들여쓰기를 물려받고 `{([` 뒤엔 2칸 더. */
export function nextIndent(line: string): string {
  const indent = /^[ \t]*/.exec(line)?.[0] ?? '';
  return /[{([]\s*$/.test(line) ? indent + TAB_TEXT : indent;
}

/**
 * 되돌림 스위치의 판 — textarea + 거터 div (05 §8 마지막 문단).
 *
 * 목업 `t1.js` 의 `bindEditor`·`paintGutter`·`insert`·`updateCaret` 을 그대로 옮겼다.
 * 구문 색·줄 API·접근성 모드가 없는 대신 마운트가 공짜다 — WKWebView 에서 Monaco 마운트가
 * 250ms 예산을 넘기는 판만 이쪽으로 돌린다.
 */
export function PlainPad(props: ClonePadProps) {
  const { stage, ticks } = props;
  const label = props.ariaLabel ?? cloneAriaLabel();

  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const [text, setText] = useState(props.value);
  const [cur, setCur] = useState(0);
  const [focused, setFocused] = useState(false);

  const cb = useRef(props);
  const textRef = useRef(text);
  const curRef = useRef(0);
  const composing = useRef(false);
  const held = useRef<number | null>(null);
  const dirty = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    cb.current = props;
    textRef.current = text;
  });

  const flush = useCallback((): void => {
    if (timer.current !== undefined) window.clearTimeout(timer.current);
    timer.current = undefined;
    if (!dirty.current) return;
    dirty.current = false;
    cb.current.onChange(textRef.current);
  }, []);

  // 언마운트에서 즉시 flush.
  useEffect(() => () => flush(), [flush]);

  const schedule = useCallback((): void => {
    dirty.current = true;
    if (timer.current !== undefined) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, SAVE_DEBOUNCE_MS);
  }, [flush]);

  const leave = (index: number, all: string): void => {
    const line = all.split('\n')[index];
    if (line === undefined) return;
    cb.current.onLeaveLine(index, line);
  };

  /** 캐럿이 줄을 넘었는지 본다. 목업 `updateCaret` 의 앞부분이다. */
  const trackCaret = (): void => {
    const ta = taRef.current;
    if (ta === null) return;
    const line = ta.value.slice(0, ta.selectionStart).split('\n').length - 1;
    if (line === curRef.current) return;
    const left = curRef.current;
    curRef.current = line;
    setCur(line);
    if (composing.current) {
      held.current ??= left;
      return;
    }
    leave(left, ta.value);
  };

  /** 목업 `insert` — DOM 을 먼저 고쳐 선택 자리를 지킨 뒤 상태를 맞춘다. */
  const insert = (s: string): void => {
    const ta = taRef.current;
    if (ta === null) return;
    const at = ta.selectionStart;
    ta.value = ta.value.slice(0, at) + s + ta.value.slice(ta.selectionEnd);
    ta.selectionStart = at + s.length;
    ta.selectionEnd = at + s.length;
    setText(ta.value);
    textRef.current = ta.value;
    schedule();
    trackCaret();
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>): void => {
    // 단축키는 물리 키(`e.code`)로 본다 — 한국어 IME 에서 `e.key` 는 전부 깨진다 (05 §7).
    if (e.code === 'Tab') {
      e.preventDefault();
      insert(TAB_TEXT);
      return;
    }
    if (e.code === 'Backquote') {
      e.preventDefault();
      if (!e.repeat) cb.current.onPeek(true);
      return;
    }
    if (e.metaKey || e.ctrlKey) {
      if (e.code === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault();
        cb.current.onGrade();
        return;
      }
      if (e.code === 'Period') {
        e.preventDefault();
        cb.current.onDown();
      }
      return;
    }
    if (e.code === 'Enter' && stage < 3) {
      const ta = e.currentTarget;
      const before = ta.value.slice(0, ta.selectionStart);
      e.preventDefault();
      insert(`\n${nextIndent(before.slice(before.lastIndexOf('\n') + 1))}`);
    }
  };

  const lines = text.split('\n');
  const rows = Math.max(lines.length, MIN_ROWS);

  return (
    <div className={cx('editor', 'plain', focused && 'focus')}>
      {/* 줄 번호와 틱은 textarea 가 못 그린다 — 목업 `paintGutter` 그대로 옆에 세운다. */}
      <div className="gut" aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className={cx('gl', ticks[i], i === cur && 'cur')}>
            {i + 1}
          </div>
        ))}
      </div>
      <textarea
        ref={taRef}
        value={text}
        rows={rows + 1}
        aria-label={label}
        spellCheck={false}
        autoComplete="off"
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
          setText(e.target.value);
          textRef.current = e.target.value;
          schedule();
          trackCaret();
        }}
        onKeyDown={onKeyDown}
        onKeyUp={(e) => {
          if (e.code === 'Backquote') cb.current.onPeek(false);
        }}
        onSelect={trackCaret}
        onClick={trackCaret}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={() => {
          composing.current = false;
          const line = held.current;
          held.current = null;
          if (line !== null && taRef.current !== null) leave(line, taRef.current.value);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          flush();
          cb.current.onPeek(false);
        }}
      />
    </div>
  );
}
