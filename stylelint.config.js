/**
 * Stylelint — stylelint-config-standard + Chickadee 4개 규칙 (05 §4.2 · §4.3).
 *
 * 규칙은 scripts/stylelint-chickadee.mjs 에 있고 단위 테스트는
 * scripts/stylelint-chickadee.test.mjs 에 있다 (pnpm test:unit).
 */
module.exports = {
  extends: ['stylelint-config-standard'],
  plugins: ['./scripts/stylelint-chickadee.mjs'],
  rules: {
    'chickadee/no-font-size-below-13': true,
    'chickadee/track-alias-only': true,
    'chickadee/dark-selector-allowlist': true,
    'chickadee/print-physics-scope': true,

    /* 목업에서 그대로 옮겨 온 CSS(05 §12 「그대로 옮기는 것」)는 legacy 표기를 쓴다.
       표기를 modern/percentage 로 바꾸면 목업과 앱의 CSS 가 눈으로 대조되지 않는다. */
    'alpha-value-notation': null,
    'color-function-notation': null,

    /* 토큰 hex 는 목업 표기(대문자)를 유지한다 — 05 §4.1 토큰 표와 문자 단위로 대조된다. */
    'color-hex-length': 'long',

    /* SVG data URI(feTurbulence 결)는 한 줄로 둔다. */
    'function-url-quotes': 'always',

    /* Tauri 의 WKWebView(macOS) · WebKitGTK(Linux) 는 표준 text-size-adjust 를 아직 안 받는다.
       목업의 -webkit- 접두 선언을 그대로 둔다 — 없으면 시스템 글자 크기 설정에 조판이 흔들린다. */
    'property-no-vendor-prefix': [true, { ignoreProperties: ['text-size-adjust'] }],

    /* --f-ui/--f-mono/--f-poster 는 서체 스택이라 이름 대소문자가 값의 일부다
       (SFMono-Regular · Menlo · Consolas). 05 §1.4 「폴백 스택은 목업 그대로」. */
    'value-keyword-case': ['lower', { ignoreProperties: ['/^--f-/'], ignoreKeywords: ['optimizeLegibility'] }],
  },
  /* design/ 은 목업(사용자 확정 자산, 고정) — 앱 규칙으로 재단하지 않는다. dist·target 은 산출물. */
  ignoreFiles: ['**/node_modules/**', 'design/**', '**/target/**', '**/dist/**'],
};
