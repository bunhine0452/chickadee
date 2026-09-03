import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { tokens } from '../../styles/tokens';

export type InkTheme = 'light' | 'dark';

/** `defineTheme` 에 등록하는 이름. 05 §8. */
export const THEME_NAME: Record<InkTheme, string> = { light: 'ink-light', dark: 'ink-dark' };

/**
 * 토큰 하나를 hex 로 푼다.
 *
 * Monaco 는 CSS 변수를 못 받고 hex 만 받는다 — 그래서 `styles/tokens.ts`(생성물)를 읽는다.
 * 그 파일은 「값은 CSS 원문 그대로다 — `var(--blue)` 같은 별칭은 소비자가 푼다」고 적어
 * 두었으므로 별칭을 여기서 한 단계씩 따라간다. 지금 쓰는 8개 토큰은 전부 리터럴 hex 라
 * 이 고리는 한 번도 돌지 않지만, `pnpm design:sync` 가 별칭으로 바꿔 놓아도 색이 죽지
 * 않게 남겨 둔다.
 */
function hex(theme: InkTheme, name: string): string {
  const table: Record<string, string | undefined> = tokens[theme];
  let value = table[name];
  for (let hop = 0; hop < 4 && value !== undefined && value.startsWith('var('); hop += 1) {
    value = table[value.slice(4, -1).trim()];
  }
  // 토큰이 사라졌으면 색을 꾸며 내지 않는다 — 잉크 검정으로 두고 design:check 가 잡는다.
  return value ?? '#221D18';
}

/**
 * 05 §8 의 매핑 표 그대로.
 *
 * `.code` 판(`CodePlate`)의 6클래스와 같은 색이어야 좌우가 같은 종이로 보인다 — 지지대와
 * 에디터가 서로 다른 색으로 같은 코드를 그리면 그것만으로 눈이 흔들린다.
 *
 * 표에 없는데 넣은 색 둘: `editor.lineHighlightBackground` 와
 * `editorLineNumber.activeForeground`. `renderLineHighlight:'gutter'` 를 켜 놓고 색을 주지
 * 않으면 Monaco 기본색(회청)이 거터에 깔린다 — 목업 `.gl.cur{color:var(--ink);
 * background:var(--paper-2)}` 를 그대로 옮긴 값이다.
 */
export function themeData(theme: InkTheme): monaco.editor.IStandaloneThemeData {
  const c = (name: string): string => hex(theme, name);
  return {
    base: theme === 'dark' ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: c('--blue-text'), fontStyle: 'bold' },
      { token: 'string', foreground: c('--pink-text') },
      { token: 'number', foreground: c('--yellow-text') },
      { token: 'comment', foreground: c('--ink-soft'), fontStyle: 'italic' },
      { token: 'delimiter', foreground: c('--ink-soft') },
      // 타입·호출은 굵게 하지 않는다 — 판 안에서 이름이 튀면 원본 대조가 어려워진다.
      { token: 'type', foreground: c('--ink') },
      { token: 'identifier', foreground: c('--ink') },
    ],
    colors: {
      'editor.background': c('--stock'),
      'editor.foreground': c('--ink'),
      'editorLineNumber.foreground': c('--ink-soft'),
      'editorLineNumber.activeForeground': c('--ink'),
      'editorGutter.background': c('--paper-3'),
      'editorCursor.foreground': c('--ink'),
      'editor.selectionBackground': c('--paper-3'),
      'editor.lineHighlightBackground': c('--paper-2'),
    },
  };
}

/** 두 판을 등록한다. 두 번 불러도 같은 결과다 — Monaco 가 이름으로 덮어쓴다. */
export function defineInkThemes(): void {
  monaco.editor.defineTheme(THEME_NAME.light, themeData('light'));
  monaco.editor.defineTheme(THEME_NAME.dark, themeData('dark'));
}

/** 주간반/야간반 전환. Monaco 테마는 전역이라 인스턴스가 아니라 `setTheme` 이 바꾼다. */
export function setInkTheme(theme: InkTheme): void {
  monaco.editor.setTheme(THEME_NAME[theme]);
}
