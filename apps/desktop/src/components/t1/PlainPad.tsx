import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { cx } from '@chickadee/ui';

import { addAssist, countChange, emptyAssist } from './assist';
import {
  assistFor, cloneAriaLabel, EDITOR_ASSIST_DEFAULT, MIN_ROWS, SAVE_DEBOUNCE_MS, TAB_TEXT,
} from './monacoOptions';
import type { ClonePadProps } from './ClonePad';
import './ClonePad.css';

/** 목업 `bindEditor` 의 Enter 처리 — 들여쓰기를 물려받고 `{([` 뒤엔 2칸 더. */
export function nextIndent(line: string): string {
  const indent = /^[ \t]*/.exec(line)?.[0] ?? '';
  return /[{([]\s*$/.test(line) ? indent + TAB_TEXT : indent;
}

/**
 * L0b 자동 닫기 (D143). `` ` `` 는 없다 — 이 판에서 백틱은 「원본 잠깐 보기」 글쇠다.
 *
 * 언어를 모르는 채로 닫으므로 Monaco 의 `'languageDefined'` 보다 거칠다. 그래도 여기 두는
 * 이유는 1단계가 `PlainPad` 이기 때문이다(D93) — 이 목록이 없으면 「1단계에만 괄호가 안
 * 닫힌다」가 되어 단계를 오를수록 보조가 늘어나는 거꾸로 된 사다리가 된다.
 */
const CLOSE_OF: Readonly<Record<string, string>> = {
  '(': ')', '[': ']', '{': '}', "'": "'", '"': '"',
};
const CLOSERS = new Set(Object.values(CLOSE_OF));

/**
 * 캐럿 뒤가 이 중 하나(또는 줄 끝)일 때만 닫아 준다 — Monaco 의 `autoCloseBefore` 기본값과
 * 같은 집합이다. 없으면 `don't` 를 칠 때 `don''t` 가 된다.
 */
const CLOSE_BEFORE = ';:.,=}])> \t\n';

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
  const closing = assistFor(stage, props.editorAssist ?? EDITOR_ASSIST_DEFAULT).closing;

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
  // 이 판에는 제안 위젯도 자동 닫기도 없다 (textarea 라 못 단다 — D93). 그래도 세는 이유는
  // 「손으로 앉힌 글자」가 판마다 있어야 판끼리 견줄 수 있기 때문이다 (D143).
  const tally = useRef(props.assistSeed ?? emptyAssist());
  const pasting = useRef(false);

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
    cb.current.onAssist?.(tally.current);
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

  const count = (change: { rangeLength: number; text: string }, pasted = false): void => {
    tally.current = addAssist(tally.current, countChange(change, {
      composing: composing.current, pasted, flush: false,
    }));
  };

  /**
   * 방금 친 한 글자가 여는 짝이면 닫는 짝을 캐럿 뒤에 앉히고, 닫는 짝인데 바로 뒤에 같은
   * 글자가 있으면 그 위를 지나간다 (L0b · D143).
   *
   * **조합 중에는 돌지 않는다** — 한글 조합 도중에 캐럿 뒤로 글자를 밀어 넣으면 조합이
   * 끊긴다. Monaco 도 인터셉터 전부를 `isDoingComposition` 으로 막는다.
   *
   * 고른 영역을 감싸는 surround 는 없다 — textarea 는 바뀐 값만 주므로 무엇이 선택돼
   * 있었는지 이 시점에 알 수 없다. Monaco 판(2·3단계)에는 있다.
   */
  const autoClose = (ta: HTMLTextAreaElement, typed: string): void => {
    if (!closing || typed === '' || composing.current) return;
    const at = ta.selectionStart;
    const next = ta.value[at];
    const close = CLOSE_OF[typed];
    if (close !== undefined && (next === undefined || CLOSE_BEFORE.includes(next))) {
      ta.value = ta.value.slice(0, at) + close + ta.value.slice(at);
      ta.selectionStart = at;
      ta.selectionEnd = at;
      // 친 글자는 부른 쪽에서 이미 손으로 세었다 — 닫는 짝 하나만 보조로 얹는다.
      tally.current = addAssist(tally.current, { keyed: 0, assisted: 1, pasted: 0, accepted: 0 });
      return;
    }
    if (CLOSERS.has(typed) && next === typed) {
      ta.value = ta.value.slice(0, at) + ta.value.slice(at + 1);
      ta.selectionStart = at;
      ta.selectionEnd = at;
    }
  };

  /** 목업 `insert` — DOM 을 먼저 고쳐 선택 자리를 지킨 뒤 상태를 맞춘다. */
  const insert = (s: string): void => {
    const ta = taRef.current;
    if (ta === null) return;
    const at = ta.selectionStart;
    // `Tab` 2칸도 `Enter` + 들여쓰기도 글쇠 하나가 여러 글자를 앉히는 자리다.
    count({ rangeLength: ta.selectionEnd - at, text: s });
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
        // 코스가 켠다 (D170 ⑧) — 판이 걸리는 순간 손이 편집기에 있어야 한다.
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={props.focusOnMount === true}
        value={text}
        rows={rows + 1}
        aria-label={label}
        spellCheck={false}
        autoComplete="off"
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
          const ta = e.target;
          // `insert()` 가 만든 변화는 그쪽에서 이미 셌다 — 여기서는 글쇠가 낸 것만 센다.
          // 삭제와 「고른 곳을 덮어쓰기」는 세지 않는다: 지운 것은 앉힌 것이 아니고,
          // textarea 는 그 둘을 구별할 신호를 주지 않는다 (`assist.ts` 머리 주석).
          const grown = ta.value.length - textRef.current.length;
          const at = ta.selectionStart;
          if (grown > 0) count({ rangeLength: 0, text: ta.value.slice(at - grown, at) }, pasting.current);
          const typed = grown === 1 && !pasting.current ? ta.value[at - 1] ?? '' : '';
          pasting.current = false;
          autoClose(ta, typed);
          setText(ta.value);
          textRef.current = ta.value;
          schedule();
          trackCaret();
        }}
        onPaste={() => {
          pasting.current = true;
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
