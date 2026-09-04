import { t } from '@chickadee/i18n';
import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import type { CloneStage } from './Stepper';

/** 05 §5 표가 정한 Monaco 의 접근성 이름. */
export const cloneAriaLabel = (): string => t('clone.padLabel');

/** `Tab` 이 넣는 것. `insertSpaces:true` · `tabSize:2` 와 같은 값이어야 한다. */
export const TAB_TEXT = '  ';

/** 자동 저장 디바운스(ms). 05 §8. */
export const SAVE_DEBOUNCE_MS = 400;

/** 한 줄의 키(px). 목업 `.editor{font-size:16px; line-height:1.85}` = 29.6 을 30 으로 굳혔다. */
export const LINE_HEIGHT = 30;

/** 내용이 짧아도 유지하는 줄 수. 목업 `paintGutter` 의 `Math.max(ls.length, 20)`. */
export const MIN_ROWS = 20;

/**
 * 05 §8 「옵션 고정」 목록 그대로.
 *
 * 자동완성 계열(`quickSuggestions` · `suggestOnTriggerCharacters` · `wordBasedSuggestions` ·
 * `parameterHints`)과 자동 닫기 계열(`autoClosingBrackets` · `autoClosingQuotes` ·
 * `autoSurround` · `formatOnType`)은 **필사의 목적을 무너뜨리기 때문에** 끈다 — 손이 아니라
 * 에디터가 코드를 만들면 이 판은 아무것도 재지 않는다.
 *
 * `unicodeHighlight` 를 끄지 않으면 **한국어 주석 전체에 노란 테두리**가 생긴다.
 * Monaco 의 기본값은 `ambiguousCharacters`·`nonBasicASCII` 를 켜 두는데, 그 판정에서
 * 한글은 전부 「비 ASCII」라 주석 한 줄이 통째로 경고 표시가 된다. 이 앱의 사전과 문구는
 * 한국어가 정본이므로(CLAUDE.md) 두 판정을 끄는 것이 맞다.
 */
export const FIXED_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions = {
  quickSuggestions: false,
  suggestOnTriggerCharacters: false,
  wordBasedSuggestions: 'off',
  parameterHints: { enabled: false },
  autoClosingBrackets: 'never',
  autoClosingQuotes: 'never',
  autoSurround: 'never',
  formatOnType: false,
  minimap: { enabled: false },
  folding: false,
  glyphMargin: false,
  // 판정 틱이 앉는 자리. `.gl-tick` 이 이 14px 안에 그려진다 (05 §8).
  lineDecorationsWidth: 14,
  lineNumbersMinChars: 3,
  renderLineHighlight: 'gutter',
  scrollBeyondLastLine: false,
  wordWrap: 'off',
  links: false,
  contextmenu: false,
  occurrencesHighlight: 'off',
  selectionHighlight: false,
  renderWhitespace: 'none',
  fontFamily: 'IBM Plex Mono',
  fontSize: 16,
  lineHeight: LINE_HEIGHT,
  fontLigatures: false,
  tabSize: 2,
  insertSpaces: true,
  unicodeHighlight: { ambiguousCharacters: false, nonBasicASCII: false },
  accessibilitySupport: 'auto',
};

/**
 * 단계별 차이는 `autoIndent` 하나다 (05 §8).
 *
 * 1·2단계는 `'brackets'` — 목업이 `{([` 뒤에 2칸을 넣던 그 동작이다. 3단계(백지)는
 * `'none'` 으로 들여쓰기까지 손이 낸다. `Tab` 은 3단계에도 남는다 — 들여쓰기 자체가
 * 학습 대상이지 자동화 대상이 아니다 (05 §7 T1 행).
 */
export function optionsFor(stage: CloneStage): monaco.editor.IStandaloneEditorConstructionOptions {
  return {
    ...FIXED_OPTIONS,
    ariaLabel: cloneAriaLabel(),
    autoIndent: stage === 3 ? 'none' : 'brackets',
  };
}
