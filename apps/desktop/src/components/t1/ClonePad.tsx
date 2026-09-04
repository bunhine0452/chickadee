import { useEffect, useRef, useState } from 'react';
import { cx } from '@chickadee/ui';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
/* 문법은 basic-languages 만 싣는다. **언어 서비스 워커(`ts.worker`)는 싣지 않는다** —
   자동완성이 붙으면 필사가 재는 것이 사라진다 (05 §8). */
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution';
import 'monaco-editor/esm/vs/basic-languages/go/go.contribution';
import 'monaco-editor/esm/vs/basic-languages/rust/rust.contribution';
import 'monaco-editor/esm/vs/basic-languages/sql/sql.contribution';

import { measureSince } from '../../devtools/audit.js';
import { PlainPad } from './PlainPad';
import {
  cloneAriaLabel,
  LINE_HEIGHT,
  MIN_ROWS,
  SAVE_DEBOUNCE_MS,
  TAB_TEXT,
  optionsFor,
} from './monacoOptions';
import { THEME_NAME, defineInkThemes, setInkTheme } from './monacoTheme';
import type { InkTheme } from './monacoTheme';
import type { CloneStage } from './Stepper';
import './ClonePad.css';

/** 줄 하나의 판정. `''` 은 「아직 판정 안 함」 — 빈 줄과 어긋남을 섞지 않는다. */
export type LineTick = '' | 'exact' | 'equiv' | 'differ';

export interface ClonePadProps {
  /** 초안. **마운트 때만** model 에 들어간다 — 제어 컴포넌트가 아니다. */
  value: string;
  stage: CloneStage;
  /** Monaco 언어 id. `'typescript' | 'python' | 'go' | 'rust' | 'sql' | …` */
  grammar: string;
  theme: InkTheme;
  /** **0부터** 세는 줄 → 판정. */
  ticks: Readonly<Record<number, LineTick>>;
  /** 400ms 디바운스 뒤. 블러·언마운트에서는 즉시. */
  onChange: (value: string) => void;
  /** 캐럿이 그 줄을 **떠났을 때** 한 번. 색인은 0부터. */
  onLeaveLine: (index: number, text: string) => void;
  /** `` ` `` 홀드. 원본을 드러내는 것은 `RefPlate` 의 몫이다. */
  onPeek: (on: boolean) => void;
  onGrade: () => void;
  onDown: () => void;
  ariaLabel?: string | undefined;
  /** true 면 textarea 판을 그린다 (05 §8 마지막 문단). 기본값은 Monaco 다. */
  fallback?: boolean | undefined;
}

const TICK_CLASS: Record<Exclude<LineTick, ''>, string> = {
  exact: 'gl-tick gl-exact',
  equiv: 'gl-tick gl-equiv',
  differ: 'gl-tick gl-differ',
};

/**
 * `ticks` 를 Monaco 데코레이션으로. 0부터 세는 색인이 1부터 세는 줄 번호가 된다.
 *
 * 틱은 `lineDecorationsWidth:14` 가 비워 둔 자리에 그린다 — 목업처럼 거터의 `.gl::before`
 * 로 그리면 줄 번호를 우리가 그려야 하고, 그러면 Monaco 의 접기·스크롤과 어긋난다.
 */
export function tickDecorations(
  ticks: Readonly<Record<number, LineTick>>,
  lineCount: number,
): monaco.editor.IModelDeltaDecoration[] {
  return Object.keys(ticks)
    .map((key) => Number(key))
    .filter((i) => Number.isInteger(i) && i >= 0 && i < lineCount)
    .sort((a, b) => a - b)
    .flatMap((i) => {
      const tick = ticks[i];
      if (tick === undefined || tick === '') return [];
      return [
        {
          range: new monaco.Range(i + 1, 1, i + 1, 1),
          options: { linesDecorationsClassName: TICK_CLASS[tick], isWholeLine: false },
        },
      ];
    });
}

/**
 * `.editor` — 필사 입력칸 (05 §5 · §8).
 *
 * 이 파일 자체가 `React.lazy` 의 대상이다 — T1 판을 걸 때만 Monaco 가 내려온다(05 §1.3).
 * `fallback` 이 켜지면 같은 props 로 textarea 판을 그린다. 그 판은 400줄 상한 때문에
 * `PlainPad.tsx` 로 나눠 두었다.
 */
export function ClonePad(props: ClonePadProps) {
  return props.fallback === true ? <PlainPad {...props} /> : <MonacoPad {...props} />;
}

function MonacoPad(props: ClonePadProps) {
  const { stage, grammar, theme, ticks } = props;
  const label = props.ariaLabel ?? cloneAriaLabel();

  const hostRef = useRef<HTMLDivElement | null>(null);
  const edRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const tickRef = useRef<monaco.editor.IEditorDecorationsCollection | null>(null);
  const [focused, setFocused] = useState(false);

  // 마운트는 시작한 자리와 끝나는 자리가 다르다 — 시작을 여기 적어 두고 effect 가 끝을 찍는다.
  const startedAt = useRef(performance.now());

  // 콜백은 최신값을 ref 로 들고 있는다. effect 를 한 번만 돌려야 에디터가 다시 안 지어진다.
  const cb = useRef(props);
  useEffect(() => {
    cb.current = props;
  });

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) return;
    const at = cb.current;

    // 워커는 편집기 워커 하나뿐이다 (05 §8).
    (self as unknown as { MonacoEnvironment: monaco.Environment }).MonacoEnvironment = {
      getWorker: () => new EditorWorker(),
    };
    defineInkThemes();

    const editor = monaco.editor.create(host, {
      ...optionsFor(at.stage),
      ariaLabel: at.ariaLabel ?? cloneAriaLabel(),
      value: at.value,
      language: at.grammar,
      theme: THEME_NAME[at.theme],
    });
    edRef.current = editor;
    tickRef.current = editor.createDecorationsCollection();

    // ── 자동 저장 ──────────────────────────────────────────────────────────
    let dirty = false;
    let timer: number | undefined;
    const flush = (): void => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
      if (!dirty) return;
      dirty = false;
      cb.current.onChange(editor.getValue());
    };
    editor.onDidChangeModelContent(() => {
      dirty = true;
      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(flush, SAVE_DEBOUNCE_MS);
    });

    // ── 줄을 벗어날 때만 판정 ──────────────────────────────────────────────
    let prevLine = editor.getPosition()?.lineNumber ?? 1;
    let composing = false;
    let held: number | null = null;

    const leave = (line: number): void => {
      const model = editor.getModel();
      if (model === null || line < 1 || line > model.getLineCount()) return;
      cb.current.onLeaveLine(line - 1, model.getLineContent(line));
    };

    editor.onDidChangeCursorPosition((e) => {
      const line = e.position.lineNumber;
      // 전체 교체(초안 복원)는 손이 움직인 것이 아니다.
      if (e.reason === monaco.editor.CursorChangeReason.ContentFlush) {
        prevLine = line;
        return;
      }
      if (line === prevLine) return;
      const left = prevLine;
      prevLine = line;
      // IME 조합 중엔 보류한다 — 조합 중인 글자는 아직 그 줄의 내용이 아니라서
      // 지금 판정하면 「어긋남」이 먼저 찍히고 조합이 끝나며 뒤집힌다.
      if (composing) {
        held ??= left;
        return;
      }
      leave(left);
    });
    editor.onDidCompositionStart(() => {
      composing = true;
    });
    editor.onDidCompositionEnd(() => {
      composing = false;
      if (held === null) return;
      const line = held;
      held = null;
      leave(line);
    });

    // ── `` ` `` 홀드 = 원본 잠깐 보기 ──────────────────────────────────────
    const release = (): void => {
      cb.current.onPeek(false);
    };
    editor.onKeyDown((e) => {
      if (e.browserEvent.code !== 'Backquote') return;
      e.preventDefault();
      e.stopPropagation();
      if (!e.browserEvent.repeat) cb.current.onPeek(true);
    });
    editor.onKeyUp((e) => {
      if (e.browserEvent.code === 'Backquote') release();
    });
    // WKWebView 는 ⌘ 조합 중 keyup 을 잃는다 — 창이 흐려지면 무조건 놓는다.
    window.addEventListener('blur', release);

    // ── 키 ────────────────────────────────────────────────────────────────
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => cb.current.onGrade());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Period, () => cb.current.onDown());
    // Tab 을 우리가 잡지 않으면 포커스가 판 밖으로 나간다 (05 §7).
    editor.addCommand(monaco.KeyCode.Tab, () => {
      editor.trigger('clonepad', 'type', { text: TAB_TEXT });
    });

    editor.onDidFocusEditorText(() => setFocused(true));
    editor.onDidBlurEditorText(() => {
      setFocused(false);
      flush();
      release();
    });

    // ── 높이는 내용이 정한다 ───────────────────────────────────────────────
    // `automaticLayout` 은 05 §8 의 고정 목록에 없다 — 폭은 ResizeObserver 로 잰다.
    let lastWidth = -1;
    const relayout = (): void => {
      const height = Math.max(editor.getContentHeight(), MIN_ROWS * LINE_HEIGHT);
      host.style.height = `${height}px`;
      lastWidth = host.clientWidth;
      editor.layout({ width: lastWidth, height });
    };
    editor.onDidContentSizeChange(relayout);
    // 우리가 높이를 바꿔도 다시 불리므로 폭이 바뀐 때만 다시 잰다.
    const ro = new ResizeObserver(() => {
      if (host.clientWidth !== lastWidth) relayout();
    });
    ro.observe(host);
    relayout();

    // ── 폰트 재측정 ────────────────────────────────────────────────────────
    // 안 부르면 WKWebView 가 폴백 폭으로 재 놓은 커서가 글자 사이에 뜬다 (05 §8).
    let alive = true;
    monaco.editor.remeasureFonts();
    void document.fonts?.ready.then(() => {
      if (alive) monaco.editor.remeasureFonts();
    });

    // 05 §10 `t1:monaco` — 예산 250ms.
    measureSince('t1:monaco', startedAt.current);

    return () => {
      alive = false;
      flush();
      window.removeEventListener('blur', release);
      ro.disconnect();
      editor.getModel()?.dispose();
      editor.dispose();
      edRef.current = null;
      tickRef.current = null;
    };
  }, []);

  useEffect(() => {
    const editor = edRef.current;
    const model = editor?.getModel() ?? null;
    if (editor === null || model === null || tickRef.current === null) return;
    tickRef.current.set(tickDecorations(ticks, model.getLineCount()));
  }, [ticks]);

  useEffect(() => {
    if (edRef.current !== null) setInkTheme(theme);
  }, [theme]);

  useEffect(() => {
    edRef.current?.updateOptions({ ...optionsFor(stage), ariaLabel: label });
  }, [stage, label]);

  useEffect(() => {
    const model = edRef.current?.getModel() ?? null;
    if (model !== null) monaco.editor.setModelLanguage(model, grammar);
  }, [grammar]);

  return (
    <div className={cx('editor', 'mono', focused && 'focus')}>
      <div ref={hostRef} className="mono-host" />
    </div>
  );
}
