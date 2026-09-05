import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import { tokens } from '../../styles/tokens';

export type InkTheme = 'light' | 'dark';

/** `defineTheme` 에 등록하는 이름. 05 §8. */
export const THEME_NAME: Record<InkTheme, string> = { light: 'ink-light', dark: 'ink-dark' };

/** 토큰이 사라졌을 때의 마지막 색. 꾸며 내지 않고 본문 먹으로 두면 design:check 가 잡는다. */
const FALLBACK: Record<InkTheme, string> = { light: '#14171A', dark: '#E8EBEF' };

/**
 * 토큰 하나를 hex 로 푼다.
 *
 * Monaco 는 CSS 변수를 못 받고 hex 만 받는다 — 그래서 `styles/tokens.ts`(생성물)를 읽는다.
 * 그 파일은 「값은 CSS 원문 그대로다 — `var(--surface)` 같은 별칭은 소비자가 푼다」고 적어
 * 두었으므로 별칭을 여기서 한 단계씩 따라간다. 지금 쓰는 열두 토큰은 전부 리터럴 hex 라
 * 이 고리는 한 번도 돌지 않지만, `pnpm design:sync` 가 별칭으로 바꿔 놓아도 색이 죽지
 * 않게 남겨 둔다.
 */
function hex(theme: InkTheme, name: string): string {
  const table: Record<string, string | undefined> = tokens[theme];
  let value = table[name];
  for (let hop = 0; hop < 4 && value !== undefined && value.startsWith('var('); hop += 1) {
    value = table[value.slice(4, -1).trim()];
  }
  return value ?? FALLBACK[theme];
}

/**
 * 에디터의 색은 **코드 판(`CodePlate`)과 같은 토큰**이다 (D182).
 *
 * 정본 §6 은 구문 강조를 「판독 보조」로서 색의 유일한 예외로 남겼고, 그 색은 `--syn-*`
 * 여섯이다. 지지대(`.code`)와 편집기가 같은 코드를 다른 색으로 그리면 그것만으로 눈이
 * 흔들리므로, 여기의 매핑은 `CodePlate.css` 의 여섯 클래스와 한 줄씩 짝이다 —
 * key↔`.k` · str↔`.s` · num↔`.n` · com↔`.c` · type↔`.type` · fn↔`.f`.
 *
 * 표에 없는데 넣은 색 둘: `editor.lineHighlightBackground` 와
 * `editorLineNumber.activeForeground`. `renderLineHighlight:'gutter'` 를 켜 놓고 색을 주지
 * 않으면 Monaco 기본색(회청)이 거터에 깔린다.
 */
export function themeData(theme: InkTheme): monaco.editor.IStandaloneThemeData {
  const c = (name: string): string => hex(theme, name);
  return {
    base: theme === 'dark' ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: c('--syn-key') },
      { token: 'string', foreground: c('--syn-str') },
      { token: 'number', foreground: c('--syn-num') },
      { token: 'comment', foreground: c('--syn-com'), fontStyle: 'italic' },
      { token: 'delimiter', foreground: c('--text-muted') },
      { token: 'type', foreground: c('--syn-type') },
      // 이름은 굵게 하지 않는다 — 판 안에서 이름이 튀면 원본 대조가 어려워진다.
      { token: 'identifier', foreground: c('--text') },
    ],
    colors: {
      'editor.background': c('--code-bg'),
      'editor.foreground': c('--text'),
      'editorLineNumber.foreground': c('--text-muted'),
      'editorLineNumber.activeForeground': c('--text'),
      'editorGutter.background': c('--surface-2'),
      'editorCursor.foreground': c('--text'),
      'editor.selectionBackground': c('--surface-3'),
      'editor.lineHighlightBackground': c('--surface-3'),
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
