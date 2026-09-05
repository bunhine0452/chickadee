// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Monaco 는 jsdom 에서 뜨지 않는다 — `ResizeObserver`·실제 레이아웃·글꼴 측정이 없으면
 * `editor.create` 가 그 안에서 무너진다. 그래서 API 를 모의하고 **「우리가 Monaco 에 무엇을
 * 요구했는가」** 만 고정한다: 어떤 옵션으로 지었는지, 어떤 키를 걸었는지, 어떤 데코레이션을
 * 넘겼는지, 그리고 Monaco 가 주는 핸들러를 손으로 불렀을 때 우리 콜백이 규격대로 불리는지.
 *
 * IME 보류·백틱 홀드·줄 이탈 판정을 브라우저 없이 고정하는 방법은 이것뿐이다. 실제 렌더는
 * 05 §11 의 Playwright(webkit)가 본다.
 */
const mock = vi.hoisted(() => {
  interface Handler {
    (arg?: unknown): void;
  }

  const state = {
    themes: [] as Array<[string, unknown]>,
    setTheme: [] as string[],
    created: [] as unknown[],
    commands: [] as Array<[number, () => void]>,
    /** `addCommand` 의 세 번째 인자(문맥). 제안 위젯과의 `Tab` 다툼이 여기서 갈린다. */
    commandContext: {} as Record<number, string | undefined>,
    triggers: [] as Array<[string, string, unknown]>,
    updates: [] as unknown[],
    decorations: [] as unknown[][],
    languages: [] as string[],
    remeasured: 0,
    handlers: {} as Record<string, Handler[]>,
    lines: ['const a = 1;', 'const b = 2;', 'const c = 3;'],
  };

  const on =
    (name: string) =>
    (fn: Handler): { dispose: () => void } => {
      (state.handlers[name] ??= []).push(fn);
      return { dispose: () => undefined };
    };

  const model = {
    getValue: () => state.lines.join('\n'),
    getLineCount: () => state.lines.length,
    getLineContent: (n: number) => state.lines[n - 1] ?? '',
    dispose: () => undefined,
  };

  const editor = {
    getModel: () => model,
    getValue: () => model.getValue(),
    getPosition: () => ({ lineNumber: 1, column: 1 }),
    getContentHeight: () => 300,
    createDecorationsCollection: () => ({
      set: (d: unknown[]) => state.decorations.push(d),
      clear: () => undefined,
    }),
    onDidChangeModelContent: on('content'),
    onDidPaste: on('paste'),
    onDidChangeCursorPosition: on('cursor'),
    onDidCompositionStart: on('compStart'),
    onDidCompositionEnd: on('compEnd'),
    onKeyDown: on('keyDown'),
    onKeyUp: on('keyUp'),
    onDidFocusEditorText: on('focus'),
    onDidBlurEditorText: on('blur'),
    onDidContentSizeChange: on('size'),
    addCommand: (key: number, fn: () => void, context?: string) => {
      state.commands.push([key, fn]);
      state.commandContext[key] = context;
    },
    trigger: (source: string, command: string, payload: unknown) =>
      state.triggers.push([source, command, payload]),
    updateOptions: (options: unknown) => state.updates.push(options),
    layout: () => undefined,
    dispose: () => undefined,
  };

  class Range {
    constructor(
      readonly startLineNumber: number,
      readonly startColumn: number,
      readonly endLineNumber: number,
      readonly endColumn: number,
    ) {}
  }

  const api = {
    Range,
    KeyMod: { CtrlCmd: 2048, Shift: 1024, Alt: 512, WinCtrl: 256 },
    KeyCode: { Enter: 3, Tab: 2, Period: 84 },
    editor: {
      CursorChangeReason: { NotSet: 0, ContentFlush: 1, Explicit: 3 },
      defineTheme: (name: string, data: unknown) => state.themes.push([name, data]),
      setTheme: (name: string) => state.setTheme.push(name),
      create: (_host: HTMLElement, options: unknown) => {
        state.created.push(options);
        return editor;
      },
      setModelLanguage: (_model: unknown, language: string) => state.languages.push(language),
      remeasureFonts: () => {
        state.remeasured += 1;
      },
    },
  };

  const reset = (): void => {
    state.themes.length = 0;
    state.setTheme.length = 0;
    state.created.length = 0;
    state.commands.length = 0;
    state.commandContext = {};
    state.triggers.length = 0;
    state.updates.length = 0;
    state.decorations.length = 0;
    state.languages.length = 0;
    state.remeasured = 0;
    state.handlers = {};
    state.lines = ['const a = 1;', 'const b = 2;', 'const c = 3;'];
  };

  return { state, api, reset };
});

vi.mock('monaco-editor/esm/vs/editor/editor.api', () => mock.api);
// 워커와 문법 기여는 실제 Monaco 를 끌고 오므로 빈 모듈로 세운다.
vi.mock('monaco-editor/esm/vs/editor/editor.worker?worker', () => ({ default: class {} }));
vi.mock('monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution', () => ({}));
vi.mock('monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution', () => ({}));
vi.mock('monaco-editor/esm/vs/basic-languages/python/python.contribution', () => ({}));
vi.mock('monaco-editor/esm/vs/basic-languages/go/go.contribution', () => ({}));
vi.mock('monaco-editor/esm/vs/basic-languages/rust/rust.contribution', () => ({}));
vi.mock('monaco-editor/esm/vs/basic-languages/sql/sql.contribution', () => ({}));
vi.mock('monaco-editor/esm/vs/basic-languages/java/java.contribution', () => ({}));

import { tokens } from '../../styles/tokens';
import { ClonePad, tickDecorations } from './ClonePad';
import type { ClonePadProps } from './ClonePad';
import { PlainPad, nextIndent } from './PlainPad';
// Vite 의 `?raw` — 이 파일의 소스를 글자 그대로 읽는다. `readFileSync` 는 jsdom 환경에서
// `import.meta.url` 이 http URL 이라 못 쓴다.
import clonePadSource from './ClonePad.tsx?raw';
import { FIXED_OPTIONS, MONACO_LANGUAGES, assistFor, optionsFor } from './monacoOptions';
import { grammarOf } from '../../screens/session/T1Plate';
import { monacoLang } from '../../screens/clone/CoursePlateView';
import { THEME_NAME, setInkTheme, themeData } from './monacoTheme';

class FakeResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

beforeEach(() => {
  mock.reset();
  globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function props(over: Partial<ClonePadProps> = {}): ClonePadProps {
  return {
    value: 'const a = 1;\nconst b = 2;\nconst c = 3;',
    stage: 1,
    grammar: 'typescript',
    theme: 'light',
    ticks: {},
    onChange: () => {},
    onLeaveLine: () => {},
    onPeek: () => {},
    onGrade: () => {},
    onDown: () => {},
    ...over,
  };
}

/** `onDidChangeModelContent` 가 주는 모양 중 우리가 읽는 것만. */
function change(text = 'x', rangeLength = 0, isFlush = false): unknown {
  return { changes: [{ rangeLength, text }], isFlush };
}

/** Monaco 가 준 핸들러를 손으로 부른다. */
function fire(name: string, arg?: unknown): void {
  for (const fn of mock.state.handlers[name] ?? []) fn(arg);
}

function keyEvent(code: string, repeat = false): unknown {
  return {
    browserEvent: { code, repeat },
    preventDefault: () => undefined,
    stopPropagation: () => undefined,
  };
}

function created(): Record<string, unknown> {
  return (mock.state.created[0] ?? {}) as Record<string, unknown>;
}

describe('optionsFor', () => {
  it('05 §8 「옵션 고정」 목록을 그대로 낸다', () => {
    const o = optionsFor(1);
    expect(o.parameterHints).toEqual({ enabled: false });
    expect(o.formatOnType).toBe(false);
    expect(o.minimap).toEqual({ enabled: false });
    expect(o.folding).toBe(false);
    expect(o.glyphMargin).toBe(false);
    expect(o.lineDecorationsWidth).toBe(14);
    expect(o.lineNumbersMinChars).toBe(3);
    expect(o.renderLineHighlight).toBe('gutter');
    expect(o.scrollBeyondLastLine).toBe(false);
    expect(o.wordWrap).toBe('off');
    expect(o.links).toBe(false);
    expect(o.contextmenu).toBe(false);
    expect(o.occurrencesHighlight).toBe('off');
    expect(o.selectionHighlight).toBe(false);
    expect(o.renderWhitespace).toBe('none');
    expect(o.fontFamily).toBe('IBM Plex Mono');
    expect(o.fontSize).toBe(16);
    expect(o.lineHeight).toBe(30);
    expect(o.fontLigatures).toBe(false);
    expect(o.tabSize).toBe(2);
    expect(o.insertSpaces).toBe(true);
    expect(o.accessibilitySupport).toBe('auto');
    expect(o.ariaLabel).toBe('필사 입력');
  });

  it('한국어 주석에 노란 테두리가 안 생기게 unicodeHighlight 두 판정을 끈다', () => {
    expect(FIXED_OPTIONS.unicodeHighlight).toEqual({
      ambiguousCharacters: false,
      nonBasicASCII: false,
    });
  });

  it('제안을 켜도 Enter 는 절대 수락하지 않는다 (D143) — 필사 중 가장 위험한 오작동', () => {
    for (const stage of [1, 2, 3] as const) {
      expect(optionsFor(stage).acceptSuggestionOnEnter).toBe('off');
      expect(optionsFor(stage).acceptSuggestionOnCommitCharacter).toBe(false);
    }
  });

  it('L0a·L0b 는 3단계에서 꺼지고 L1 은 페이딩하지 않는다 (D143 매트릭스)', () => {
    for (const stage of [1, 2] as const) {
      const o = optionsFor(stage);
      expect(o.autoIndent).toBe('brackets');
      expect(o.autoClosingBrackets).toBe('languageDefined');
      expect(o.autoClosingQuotes).toBe('languageDefined');
      expect(o.autoSurround).toBe('languageDefined');
    }
    const blank = optionsFor(3);
    expect(blank.autoIndent).toBe('none');
    expect(blank.autoClosingBrackets).toBe('never');
    expect(blank.autoClosingQuotes).toBe('never');
    expect(blank.autoSurround).toBe('never');

    // L1 은 세 단계 모두 같다 — 정보량 상한이 「이미 이 버퍼에 있는 낱말」이라 백지에서도
    // 새는 것이 없고, 최종 텍스트가 같아 `pct` 가 구조적으로 안 움직인다.
    for (const stage of [1, 2, 3] as const) {
      const o = optionsFor(stage);
      expect(o.wordBasedSuggestions).toBe('currentDocument');
      expect(o.suggestOnTriggerCharacters).toBe(true);
      expect(o.quickSuggestions).toEqual({ other: true, comments: false, strings: false });
    }
  });

  it('한국어 주석 안에서는 제안 위젯을 아예 열지 않는다', () => {
    expect(optionsFor(2).quickSuggestions).toMatchObject({ comments: false, strings: false });
  });

  it('설정이 off 면 세 층이 전부 꺼진다 — 0.1.0 까지의 동작', () => {
    for (const stage of [1, 2, 3] as const) {
      const o = optionsFor(stage, 'off');
      expect(o.autoIndent).toBe('none');
      expect(o.autoClosingBrackets).toBe('never');
      expect(o.autoClosingQuotes).toBe('never');
      expect(o.autoSurround).toBe('never');
      expect(o.quickSuggestions).toBe(false);
      expect(o.suggestOnTriggerCharacters).toBe(false);
      expect(o.wordBasedSuggestions).toBe('off');
    }
  });

  it('assistFor 가 규칙 한 줄을 그대로 낸다', () => {
    expect(assistFor(1, 'stage')).toEqual({ indent: true, closing: true, suggest: true });
    expect(assistFor(3, 'stage')).toEqual({ indent: false, closing: false, suggest: true });
    expect(assistFor(1, 'off')).toEqual({ indent: false, closing: false, suggest: false });
  });
});

/**
 * `.tsx`/`.jsx` 에 `'tsx'` 를 주면 **모델이 조용히 plaintext 가 된다** — Monaco 0.52 에
 * 그 언어 id 가 없기 때문이다. 표본 리포가 React 라 실제로 가장 자주 걸리던 길이었다.
 */
describe('Monaco 언어 id', () => {
  it('화면 둘이 내는 id 는 ClonePad 가 싣는 여섯 안에만 있다', () => {
    const paths = [
      'a/b.tsx', 'a/b.jsx', 'a/b.ts', 'a/b.mts', 'a/b.cts', 'a/b.js', 'a/b.mjs', 'a/b.cjs',
      'a/b.py', 'a/b.go', 'a/b.rs', 'a/b.sql', 'a/b.unknown', 'noext',
    ];
    for (const path of paths) {
      expect(MONACO_LANGUAGES).toContain(grammarOf(path));
      expect(MONACO_LANGUAGES).toContain(monacoLang(path));
      expect(grammarOf(path)).toBe(monacoLang(path));
    }
  });

  it('React 파일은 typescript 문법으로 칠한다 — tsx 라는 id 는 없다', () => {
    expect(grammarOf('src/App.tsx')).toBe('typescript');
    expect(grammarOf('src/App.jsx')).toBe('typescript');
  });

  it('MONACO_LANGUAGES 가 ClonePad 의 contribution import 와 같다', () => {
    const loaded = [...clonePadSource.matchAll(/basic-languages\/([a-z]+)\/\1\.contribution/g)]
      .map((m) => m[1]);
    expect([...loaded].sort()).toEqual([...MONACO_LANGUAGES].sort());
  });
});

describe('ink 테마', () => {
  it('05 §8 매핑 표대로 토큰 hex 를 심는다', () => {
    const d = themeData('light');
    const rule = (token: string) => d.rules.find((r) => r.token === token);
    expect(d.base).toBe('vs');
    expect(rule('keyword')).toEqual({
      token: 'keyword',
      foreground: tokens.light['--blue-text'],
      fontStyle: 'bold',
    });
    expect(rule('string')?.foreground).toBe(tokens.light['--pink-text']);
    expect(rule('number')?.foreground).toBe(tokens.light['--yellow-text']);
    expect(rule('comment')).toEqual({
      token: 'comment',
      foreground: tokens.light['--ink-soft'],
      fontStyle: 'italic',
    });
    expect(rule('delimiter')?.foreground).toBe(tokens.light['--ink-soft']);
    expect(rule('type')?.foreground).toBe(tokens.light['--ink']);
    expect(d.colors['editor.background']).toBe(tokens.light['--stock']);
    expect(d.colors['editorLineNumber.foreground']).toBe(tokens.light['--ink-soft']);
    expect(d.colors['editorGutter.background']).toBe(tokens.light['--paper-3']);
    expect(d.colors['editorCursor.foreground']).toBe(tokens.light['--ink']);
    expect(d.colors['editor.selectionBackground']).toBe(tokens.light['--paper-3']);
  });

  it('야간반은 base 와 값이 함께 바뀐다', () => {
    const d = themeData('dark');
    expect(d.base).toBe('vs-dark');
    expect(d.colors['editor.background']).toBe(tokens.dark['--stock']);
    expect(d.rules.find((r) => r.token === 'string')?.foreground).toBe(tokens.dark['--pink-text']);
  });

  it('setInkTheme 은 이름으로 갈아 끼운다', () => {
    setInkTheme('dark');
    expect(mock.state.setTheme).toEqual([THEME_NAME.dark]);
  });
});

describe('tickDecorations', () => {
  it('0부터 세는 색인이 1부터 세는 줄이 되고 빈 판정은 빠진다', () => {
    const out = tickDecorations({ 0: 'exact', 1: '', 2: 'differ' }, 3) as Array<{
      range: { startLineNumber: number };
      options: { linesDecorationsClassName: string; isWholeLine: boolean };
    }>;
    expect(out).toHaveLength(2);
    expect(out[0]?.range.startLineNumber).toBe(1);
    expect(out[0]?.options).toEqual({
      linesDecorationsClassName: 'gl-tick gl-exact',
      isWholeLine: false,
    });
    expect(out[1]?.range.startLineNumber).toBe(3);
    expect(out[1]?.options.linesDecorationsClassName).toBe('gl-tick gl-differ');
  });

  it('줄 수를 넘는 색인은 버린다 — 지운 줄의 틱이 유령으로 남지 않게', () => {
    expect(tickDecorations({ 0: 'equiv', 9: 'exact' }, 2)).toHaveLength(1);
  });
});

describe('ClonePad — Monaco 에 무엇을 요구하는가', () => {
  it('고정 옵션·언어·테마·초안을 들고 에디터를 짓는다', () => {
    render(<ClonePad {...props({ stage: 3, grammar: 'python', theme: 'dark' })} />);
    const o = created();
    expect(o['value']).toBe('const a = 1;\nconst b = 2;\nconst c = 3;');
    expect(o['language']).toBe('python');
    expect(o['theme']).toBe(THEME_NAME.dark);
    expect(o['autoIndent']).toBe('none');
    // 백지라 자동 닫기는 꺼지고 제안은 남는다 (D143).
    expect(o['autoClosingBrackets']).toBe('never');
    expect(o['wordBasedSuggestions']).toBe('currentDocument');
    expect(o['ariaLabel']).toBe('필사 입력');
    expect(mock.state.themes.map(([name]) => name)).toEqual([THEME_NAME.light, THEME_NAME.dark]);
  });

  it('ariaLabel 을 받으면 그것이 이긴다', () => {
    render(<ClonePad {...props({ ariaLabel: '2단계 필사 입력' })} />);
    expect(created()['ariaLabel']).toBe('2단계 필사 입력');
  });

  it('폰트를 마운트 직후에 다시 잰다 — WKWebView 의 커서가 글자 사이에 뜨지 않게', () => {
    render(<ClonePad {...props()} />);
    expect(mock.state.remeasured).toBeGreaterThanOrEqual(1);
  });

  it('t1:monaco 를 찍는다 (05 §10 예산 250ms)', () => {
    const measure = vi.spyOn(performance, 'measure');
    render(<ClonePad {...props()} />);
    expect(measure.mock.calls.some(([name]) => name === 't1:monaco')).toBe(true);
    measure.mockRestore();
  });

  it('⌘↵ 채점 · ⌘. 한 단계 쉽게 · Tab 2칸을 에디터 명령으로 건다', () => {
    const onGrade = vi.fn();
    const onDown = vi.fn();
    render(<ClonePad {...props({ onGrade, onDown })} />);

    const bound = new Map(mock.state.commands);
    const cmdEnter = mock.api.KeyMod.CtrlCmd | mock.api.KeyCode.Enter;
    const cmdPeriod = mock.api.KeyMod.CtrlCmd | mock.api.KeyCode.Period;
    expect(bound.has(cmdEnter)).toBe(true);
    expect(bound.has(cmdPeriod)).toBe(true);
    expect(bound.has(mock.api.KeyCode.Tab)).toBe(true);

    bound.get(cmdEnter)?.();
    bound.get(cmdPeriod)?.();
    bound.get(mock.api.KeyCode.Tab)?.();
    expect(onGrade).toHaveBeenCalledTimes(1);
    expect(onDown).toHaveBeenCalledTimes(1);
    // Tab 은 포커스를 옮기지 않고 2칸을 넣는다.
    expect(mock.state.triggers).toEqual([['clonepad', 'type', { text: '  ' }]]);
  });

  it('Tab 은 제안 위젯이 없을 때만 2칸이다 (D143) — 문맥을 안 넘기면 제안을 못 받는다', () => {
    render(<ClonePad {...props()} />);
    expect(mock.state.commandContext[mock.api.KeyCode.Tab]).toBe('!suggestWidgetVisible');
  });

  it('틱이 바뀌면 데코레이션 묶음 하나를 갈아 끼운다', () => {
    const { rerender } = render(<ClonePad {...props()} />);
    expect(mock.state.decorations).toEqual([[]]);
    rerender(<ClonePad {...props({ ticks: { 1: 'equiv' } })} />);
    const last = mock.state.decorations.at(-1) as Array<{
      options: { linesDecorationsClassName: string };
    }>;
    expect(last).toHaveLength(1);
    expect(last[0]?.options.linesDecorationsClassName).toBe('gl-tick gl-equiv');
  });

  it('줄을 벗어날 때만 판정을 올린다 — 같은 줄 안의 이동은 조용하다', () => {
    const onLeaveLine = vi.fn();
    render(<ClonePad {...props({ onLeaveLine })} />);

    fire('cursor', { position: { lineNumber: 1, column: 5 }, reason: 3 });
    expect(onLeaveLine).not.toHaveBeenCalled();

    fire('cursor', { position: { lineNumber: 2, column: 1 }, reason: 3 });
    expect(onLeaveLine).toHaveBeenCalledExactlyOnceWith(0, 'const a = 1;');

    fire('cursor', { position: { lineNumber: 3, column: 1 }, reason: 3 });
    expect(onLeaveLine).toHaveBeenLastCalledWith(1, 'const b = 2;');
  });

  it('ContentFlush(전체 교체)는 판정하지 않는다', () => {
    const onLeaveLine = vi.fn();
    render(<ClonePad {...props({ onLeaveLine })} />);
    fire('cursor', {
      position: { lineNumber: 3, column: 1 },
      reason: mock.api.editor.CursorChangeReason.ContentFlush,
    });
    expect(onLeaveLine).not.toHaveBeenCalled();
    // 기준 줄은 옮겨 갔으므로 다음 이탈은 3행이 된다.
    fire('cursor', { position: { lineNumber: 1, column: 1 }, reason: 3 });
    expect(onLeaveLine).toHaveBeenCalledExactlyOnceWith(2, 'const c = 3;');
  });

  it('IME 조합 중엔 판정을 보류하고, 조합이 끝나면 밀린 줄을 한 번 올린다', () => {
    const onLeaveLine = vi.fn();
    render(<ClonePad {...props({ onLeaveLine })} />);

    fire('compStart');
    fire('cursor', { position: { lineNumber: 2, column: 1 }, reason: 3 });
    fire('cursor', { position: { lineNumber: 3, column: 1 }, reason: 3 });
    expect(onLeaveLine).not.toHaveBeenCalled();

    fire('compEnd');
    expect(onLeaveLine).toHaveBeenCalledExactlyOnceWith(0, 'const a = 1;');

    // 조합이 끝난 뒤에는 다시 곧바로 판정한다.
    fire('cursor', { position: { lineNumber: 1, column: 1 }, reason: 3 });
    expect(onLeaveLine).toHaveBeenLastCalledWith(2, 'const c = 3;');
  });

  it('조합 중에 줄을 넘지 않았으면 조합이 끝나도 아무 일이 없다', () => {
    const onLeaveLine = vi.fn();
    render(<ClonePad {...props({ onLeaveLine })} />);
    fire('compStart');
    fire('compEnd');
    expect(onLeaveLine).not.toHaveBeenCalled();
  });

  it('백틱을 누르면 원본 보기, 떼면 놓는다 — 오토리피트로는 다시 세지 않는다', () => {
    const onPeek = vi.fn();
    render(<ClonePad {...props({ onPeek })} />);

    fire('keyDown', keyEvent('Backquote'));
    expect(onPeek).toHaveBeenCalledExactlyOnceWith(true);

    fire('keyDown', keyEvent('Backquote', true));
    expect(onPeek).toHaveBeenCalledTimes(1);

    fire('keyUp', keyEvent('Backquote'));
    expect(onPeek).toHaveBeenLastCalledWith(false);

    // 다른 키는 홀드와 무관하다.
    onPeek.mockClear();
    fire('keyDown', keyEvent('KeyB'));
    fire('keyUp', keyEvent('KeyB'));
    expect(onPeek).not.toHaveBeenCalled();
  });

  it('창이 흐려지면 원본 보기를 놓는다 — WKWebView 는 ⌘ 조합 중 keyup 을 잃는다', () => {
    const onPeek = vi.fn();
    const { unmount } = render(<ClonePad {...props({ onPeek })} />);

    fire('keyDown', keyEvent('Backquote'));
    onPeek.mockClear();
    fireEvent.blur(window);
    expect(onPeek).toHaveBeenCalledExactlyOnceWith(false);

    // 언마운트에서 리스너를 뗀다.
    unmount();
    onPeek.mockClear();
    fireEvent.blur(window);
    expect(onPeek).not.toHaveBeenCalled();
  });

  it('내용이 바뀌면 400ms 뒤에 한 번 저장한다', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<ClonePad {...props({ onChange })} />);

    fire('content', change());
    fire('content', change());
    vi.advanceTimersByTime(399);
    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledExactlyOnceWith('const a = 1;\nconst b = 2;\nconst c = 3;');

    // 디바운스가 비었으면 다시 부르지 않는다.
    vi.advanceTimersByTime(1_000);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('블러와 언마운트에서는 즉시 저장한다', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const { unmount } = render(<ClonePad {...props({ onChange })} />);

    fire('content', change());
    act(() => {
      fire('blur');
    });
    expect(onChange).toHaveBeenCalledTimes(1);

    fire('content', change());
    unmount();
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('단계·테마·문법이 바뀌면 다시 짓지 않고 갈아 끼운다', () => {
    const { rerender } = render(<ClonePad {...props()} />);
    rerender(<ClonePad {...props({ stage: 3, theme: 'dark', grammar: 'rust' })} />);

    expect(mock.state.created).toHaveLength(1);
    expect(mock.state.setTheme.at(-1)).toBe(THEME_NAME.dark);
    expect(mock.state.languages.at(-1)).toBe('rust');
    expect((mock.state.updates.at(-1) as { autoIndent?: string }).autoIndent).toBe('none');
  });

  it('fallback 이면 Monaco 를 짓지 않고 textarea 판을 그린다', () => {
    const { container } = render(<ClonePad {...props({ fallback: true })} />);
    expect(mock.state.created).toHaveLength(0);
    expect(container.querySelector('.editor.plain')).not.toBeNull();
    expect(container.querySelector('.editor.mono')).toBeNull();
  });
});

describe('nextIndent', () => {
  it('들여쓰기를 물려받고 `{([` 뒤엔 2칸 더', () => {
    expect(nextIndent('  const a = 1;')).toBe('  ');
    expect(nextIndent('  if (ok) {')).toBe('    ');
    expect(nextIndent('foo(')).toBe('  ');
    expect(nextIndent('')).toBe('');
  });
});

describe('PlainPad — 되돌림 스위치', () => {
  const ta = (): HTMLTextAreaElement =>
    screen.getByRole('textbox', { name: '필사 입력' }) as HTMLTextAreaElement;

  it('거터는 최소 20줄이고 판정 틱 클래스가 붙는다', () => {
    const { container } = render(
      <PlainPad {...props({ ticks: { 0: 'exact', 1: 'equiv', 2: 'differ' } })} />,
    );
    const rows = container.querySelectorAll('.gut .gl');
    expect(rows).toHaveLength(20);
    expect(rows[0]?.className).toBe('gl exact cur');
    expect(rows[1]?.className).toBe('gl equiv');
    expect(rows[2]?.className).toBe('gl differ');
    expect(rows[3]?.className).toBe('gl');
  });

  it('Tab 은 2칸을 넣고 포커스를 옮기지 않는다', () => {
    render(<PlainPad {...props()} />);
    const box = ta();
    box.selectionStart = 0;
    box.selectionEnd = 0;
    fireEvent.keyDown(box, { code: 'Tab' });
    expect(box.value.startsWith('  const a = 1;')).toBe(true);
    expect(document.activeElement === box || document.activeElement === document.body).toBe(true);
  });

  it('⌘↵ 는 채점, ⌘. 는 한 단계 쉽게', () => {
    const onGrade = vi.fn();
    const onDown = vi.fn();
    render(<PlainPad {...props({ onGrade, onDown })} />);
    fireEvent.keyDown(ta(), { code: 'Enter', metaKey: true });
    fireEvent.keyDown(ta(), { code: 'Period', metaKey: true });
    expect(onGrade).toHaveBeenCalledTimes(1);
    expect(onDown).toHaveBeenCalledTimes(1);
  });

  it('캐럿이 줄을 넘으면 떠난 줄을 판정에 올린다', () => {
    const onLeaveLine = vi.fn();
    render(<PlainPad {...props({ onLeaveLine })} />);
    const box = ta();
    const at = box.value.indexOf('const b');
    box.selectionStart = at;
    box.selectionEnd = at;
    fireEvent.select(box);
    expect(onLeaveLine).toHaveBeenCalledExactlyOnceWith(0, 'const a = 1;');
  });

  it('IME 조합 중엔 보류하고 조합이 끝나면 올린다', () => {
    const onLeaveLine = vi.fn();
    render(<PlainPad {...props({ onLeaveLine })} />);
    const box = ta();
    fireEvent.compositionStart(box);
    const at = box.value.indexOf('const b');
    box.selectionStart = at;
    box.selectionEnd = at;
    fireEvent.select(box);
    expect(onLeaveLine).not.toHaveBeenCalled();
    fireEvent.compositionEnd(box);
    expect(onLeaveLine).toHaveBeenCalledExactlyOnceWith(0, 'const a = 1;');
  });

  it('백틱 홀드가 원본 보기를 켜고 끈다', () => {
    const onPeek = vi.fn();
    render(<PlainPad {...props({ onPeek })} />);
    fireEvent.keyDown(ta(), { code: 'Backquote' });
    expect(onPeek).toHaveBeenCalledExactlyOnceWith(true);
    fireEvent.keyUp(ta(), { code: 'Backquote' });
    expect(onPeek).toHaveBeenLastCalledWith(false);
  });

  it('1·2단계 Enter 는 들여쓰기를 물려받고 3단계는 그대로 둔다', () => {
    const { unmount } = render(<PlainPad {...props({ value: '  if (ok) {', stage: 2 })} />);
    const box = ta();
    box.selectionStart = box.value.length;
    box.selectionEnd = box.value.length;
    fireEvent.keyDown(box, { code: 'Enter' });
    expect(box.value).toBe('  if (ok) {\n    ');
    unmount();

    render(<PlainPad {...props({ value: '  if (ok) {', stage: 3 })} />);
    const blank = ta();
    blank.selectionStart = blank.value.length;
    blank.selectionEnd = blank.value.length;
    fireEvent.keyDown(blank, { code: 'Enter' });
    expect(blank.value).toBe('  if (ok) {');
  });

  /**
   * textarea 에 한 글자를 친 것처럼 값과 캐럿을 밀어 넣는다. 값을 직접 대입하면 React 의
   * 값 추적기가 먼저 갱신돼 `onChange` 가 아예 안 뜬다 — `target` 으로 넘겨야 한다.
   */
  function type(box: HTMLTextAreaElement, ch: string): void {
    const at = box.selectionStart;
    const next = box.value.slice(0, at) + ch + box.value.slice(box.selectionEnd);
    fireEvent.change(box, {
      target: { value: next, selectionStart: at + 1, selectionEnd: at + 1 },
    });
  }

  it('1·2단계는 괄호를 닫아 주고 3단계 백지는 닫지 않는다 (D143)', () => {
    const { unmount } = render(<PlainPad {...props({ value: '', stage: 1 })} />);
    const box = ta();
    box.selectionStart = 0;
    box.selectionEnd = 0;
    type(box, '(');
    expect(box.value).toBe('()');
    expect(box.selectionStart).toBe(1);
    unmount();

    render(<PlainPad {...props({ value: '', stage: 3 })} />);
    const blank = ta();
    blank.selectionStart = 0;
    blank.selectionEnd = 0;
    type(blank, '(');
    expect(blank.value).toBe('(');
  });

  it('닫는 짝 위는 지나간다 — 손으로 쳐도 두 개가 되지 않는다', () => {
    render(<PlainPad {...props({ value: '', stage: 2 })} />);
    const box = ta();
    box.selectionStart = 0;
    box.selectionEnd = 0;
    type(box, '(');
    type(box, ')');
    expect(box.value).toBe('()');
    expect(box.selectionStart).toBe(2);
  });

  it("낱말 한가운데서는 닫지 않는다 — don't 가 don''t 가 되면 안 된다", () => {
    render(<PlainPad {...props({ value: 'dont', stage: 2 })} />);
    const box = ta();
    box.selectionStart = 3;
    box.selectionEnd = 3;
    type(box, "'");
    expect(box.value).toBe("don't");
  });

  it('설정을 끄면 닫지 않는다', () => {
    render(<PlainPad {...props({ value: '', stage: 1, editorAssist: 'off' })} />);
    const box = ta();
    box.selectionStart = 0;
    box.selectionEnd = 0;
    type(box, '{');
    expect(box.value).toBe('{');
  });

  it('입력은 400ms 뒤에 저장되고 블러에서는 즉시 저장된다', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<PlainPad {...props({ onChange })} />);
    const box = ta();
    fireEvent.change(box, { target: { value: 'x' } });
    vi.advanceTimersByTime(399);
    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledExactlyOnceWith('x');

    fireEvent.change(box, { target: { value: 'xy' } });
    fireEvent.blur(box);
    expect(onChange).toHaveBeenLastCalledWith('xy');
  });
});
