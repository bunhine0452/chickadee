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
 * `ClonePad.tsx` 가 싣는 `basic-languages` 여섯. **여기 없는 id 는 낼 수 없다** —
 * 등록 안 된 언어 id 로 `setModelLanguage` 를 부르면 모델이 조용히 plaintext 가 된다
 * (`.tsx` 에 `'tsx'` 를 주던 버그가 그것이었다).
 *
 * 05 §8 의 목록도 이 일곱이어야 한다. Swift·Dart 는 `m1-03-swift-dart-sql` 로 보류 중이다.
 * `ClonePad.test.tsx` 가 이 배열과 `ClonePad.tsx` 의 contribution import 를 대조한다.
 */
export const MONACO_LANGUAGES = [
  'typescript', 'javascript', 'python', 'go', 'rust', 'sql', 'java',
] as const;

/**
 * 설정 「편집 보조」 (D143).
 *
 * `'stage'` — 층마다 단계에 맞춰 켠다(기본). `'off'` — 전부 끈다(0.1.0 까지의 동작).
 * 값이 둘뿐인 이유는 세 번째 값이 셀 것을 하나 더 늘리기 때문이다 — 같은 85점이
 * 서로 다른 조건에서 나오면 `patternKey` 가 다른 판정을 한 통에 섞는다(04 §5).
 */
export type EditorAssist = 'stage' | 'off';

export const EDITOR_ASSIST_DEFAULT: EditorAssist = 'stage';

/** 이 판에서 실제로 켜지는 층 (D143 매트릭스). */
export interface AssistLayers {
  /** L0a — 자동 들여쓰기. */
  indent: boolean;
  /** L0b — 자동 닫기 · surround. */
  closing: boolean;
  /** L1 — 단어 기반 제안. */
  suggest: boolean;
}

/**
 * 층 × 단계 (D143).
 *
 * 규칙 한 줄: **학습자가 고르지 않은 텍스트를 만드는 보조는 단계와 함께 페이딩하고,
 * 이미 고른 텍스트의 타건 수만 줄이는 보조는 페이딩하지 않는다.**
 *
 * - **L0a·L0b 는 3단계에서 꺼진다.** 이 리포를 표본으로 세었을 때 「닫힘만 있는 줄」이
 *   TS 비공백 줄의 12.5 %·Rust 15.9 % 다. 04 §4.6 의 분모가 비공백 줄이므로 그 몫은 곧
 *   에디터가 채우는 점수인데, 실제로 공짜인 단계는 3단계뿐이다 — 1단계는 원본이
 *   `RefPlate` 에 펼쳐져 있고, 2단계는 04 §3.2 유지 집합이 닫힘 줄을 이미 잉크로 준다.
 *   그리고 **겹 4 는 3단계 통과에서만** 나온다.
 * - **L1 은 페이딩하지 않는다.** 제안의 정보량 상한이 「이미 이 버퍼에 있는 낱말」이라
 *   (`wordBasedSuggestions:'currentDocument'`) 백지에서도 학습자가 한 번 떠올려 친 이름만
 *   담고, 최종 텍스트가 같으므로 `pct` 가 구조적으로 안 움직인다.
 * - **L2 사전 스니펫·L3 언어 서비스는 없다.** L3(`ts.worker`)는 1,286,340 B gzip 으로
 *   05 §1.3 의 Monaco 청크 예산을 워커 하나가 넘고, T1 이 주는 12~40줄 떼어낸 블록에서는
 *   「Cannot find name」 융단밖에 못 낸다.
 */
export function assistFor(stage: CloneStage, assist: EditorAssist): AssistLayers {
  if (assist === 'off') return { indent: false, closing: false, suggest: false };
  return { indent: stage < 3, closing: stage < 3, suggest: true };
}

/**
 * 05 §8 「옵션 고정」 목록 — **층에 따라 갈리지 않는 값만** 여기 있다.
 * 자동 닫기·제안은 `optionsFor()` 가 단계와 설정을 보고 정한다 (D143).
 *
 * 여기 남은 셋은 층 판정과 무관하게 언제나 꺼져 있어야 한다:
 * - `parameterHints` — 언어 서비스가 없으니 낼 것이 없고, 켜 두면 빈 위젯이 뜬다.
 * - `formatOnType` — 손이 앉힌 줄을 뒤에서 고쳐 쓴다. 필사가 재는 것이 그 줄이다.
 * - `acceptSuggestionOnEnter` — Monaco 기본값이 `'on'` 이라 **위젯이 열린 채 `Enter` 를
 *   치면 줄바꿈 대신 제안이 들어간다.** 필사 중 가장 위험한 오작동이라 못 박는다.
 *   수락은 `Tab` 하나로만. `acceptSuggestionOnCommitCharacter` 도 같은 이유로 끈다 —
 *   `.` 이나 `(` 가 제안을 확정하면 같은 사고가 난다.
 *
 * `unicodeHighlight` 를 끄지 않으면 **한국어 주석 전체에 노란 테두리**가 생긴다.
 * Monaco 의 기본값은 `ambiguousCharacters`·`nonBasicASCII` 를 켜 두는데, 그 판정에서
 * 한글은 전부 「비 ASCII」라 주석 한 줄이 통째로 경고 표시가 된다. 이 앱의 사전과 문구는
 * 한국어가 정본이므로(CLAUDE.md) 두 판정을 끄는 것이 맞다.
 */
export const FIXED_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions = {
  parameterHints: { enabled: false },
  formatOnType: false,
  acceptSuggestionOnEnter: 'off',
  acceptSuggestionOnCommitCharacter: false,
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
 * 단계 × 설정 → Monaco 옵션 (05 §8 · D143).
 *
 * `autoIndent` 1·2단계 `'brackets'` 는 목업이 `{([` 뒤에 2칸을 넣던 그 동작이고,
 * 3단계(백지)는 `'none'` 으로 들여쓰기까지 손이 낸다 — **이 한 줄이 D143 규칙의 첫 사례**라
 * 새 층 둘(L0b·L1)을 그 옆에 나란히 놓았다. `Tab` 은 3단계에도 남는다: 들여쓰기 자체가
 * 학습 대상이지 자동화 대상이 아니다 (05 §7 T1 행).
 *
 * `quickSuggestions` 의 `comments:false, strings:false` 는 **한국어 주석을 위한 값**이다 —
 * 주석 안에서 위젯을 아예 안 열면 조합 중인 한글이 필터 문자열로 새어 들어갈 자리가 없다.
 * `wordBasedSuggestions` 는 반드시 `'currentDocument'` — `'matchingDocuments'` 이상은
 * 나중에 원본 판이 Monaco 모델이 되는 날 **원본이 그대로 제안 목록에 뜬다.**
 */
export function optionsFor(
  stage: CloneStage,
  assist: EditorAssist = EDITOR_ASSIST_DEFAULT,
): monaco.editor.IStandaloneEditorConstructionOptions {
  const on = assistFor(stage, assist);
  return {
    ...FIXED_OPTIONS,
    ariaLabel: cloneAriaLabel(),
    autoIndent: on.indent ? 'brackets' : 'none',
    autoClosingBrackets: on.closing ? 'languageDefined' : 'never',
    autoClosingQuotes: on.closing ? 'languageDefined' : 'never',
    autoSurround: on.closing ? 'languageDefined' : 'never',
    quickSuggestions: on.suggest ? { other: true, comments: false, strings: false } : false,
    suggestOnTriggerCharacters: on.suggest,
    wordBasedSuggestions: on.suggest ? 'currentDocument' : 'off',
  };
}
