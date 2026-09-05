// ESLint 9 flat config.
// 루트 package.json 에 "type": "module" 이 없으므로 이 파일은 CommonJS 로 읽힌다.
//
// 이 설정이 강제하는 규칙과 출처:
//   - `@tauri-apps/api/*` 는 packages/ipc-client 안에서만            (05 §1.2, 01 §2)
//   - TS 의존 방향 ui → cards|scheduler|grading → concepts → …       (01 §2)
//   - `Math.random` 금지, seeded PRNG 만                              (06 §1.3)
//   - `no-console` — logger.ts 래퍼는 나중에                          (06 §1.3 · 구현 체크리스트 Q8)
//   - `dangerouslySetInnerHTML` 은 정확히 2파일만                     (06 §4.3, 00 D42)

'use strict';

const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const jsxA11y = require('eslint-plugin-jsx-a11y');
const reactHooks = require('eslint-plugin-react-hooks');
const globals = require('globals');

// ─────────────────────────────────────────────────────────────────────────────
// 01 §2 「의존 방향 규칙」
//
//   TS: ui → cards | scheduler | grading → concepts → dictionary | store-sql
//         → ipc-client → @tauri-apps/api
//
// 01 §2 표의 「의존」 열을 그대로 옮긴 인접 목록이다. 층 건너뛰기를 일괄 금지하지
// 않는 이유: 표 자체가 grading → ipc-client(parse) 처럼 건너뛰기를 허용한다.
// 표에 없는 조합만 막는다.
// ─────────────────────────────────────────────────────────────────────────────

/** 워크스페이스 TS 패키지 전부(아직 없는 것 포함 — 규칙을 먼저 세워 둔다). */
const WORKSPACE_PACKAGES = [
  'ipc-client',
  'store-sql',
  'dictionary',
  'concepts',
  'cards',
  'scheduler',
  'grading',
  'course',
  'ui',
  'text',
  'i18n',
];

/** 각 패키지가 import 해도 되는 워크스페이스 패키지. 자기 자신과 `text`·`i18n` 은 항상 허용. */
const ALLOWED_DEPS = {
  'ipc-client': [],
  'store-sql': ['ipc-client'],
  dictionary: ['ipc-client'],
  // 01 §3.3 「`ingest_done` 을 받으면 `packages/concepts.derive(repoId)` 가 …」 와
  // 03 §1.5 「`blame.ts` 가 `git_blame_lines` 를 배경에서 호출」 이 이 층에서 명령을
  // 부르라고 정한다. §2 표의 「의존」 열에는 빠져 있었다 — 표를 문장에 맞춘다.
  concepts: ['dictionary', 'store-sql', 'ipc-client'],
  // D72 — 01 §2 표의 「의존」 열이 같은 문서의 문장과 어긋난 자리 셋을 문장에 맞춘다.
  // 04 §1 「입력: 사전 항목 + Site[] + layerOf」(cards → dictionary),
  // 02 §5.3 planSession 이 rankNewConcepts·loadKnownSet 을 부른다(scheduler → concepts),
  // 04 §2.2 t0.answered 가 만드는 ReviewDetail 은 02 §8.2 타입이다(grading → store-sql),
  // 04 §4.6 T1 판정이 02 §3.2 의 문턱(PASS_PCT·RETRY_PCT)을 쓴다(grading → scheduler, D90).
  cards: ['concepts', 'store-sql', 'dictionary'],
  scheduler: ['store-sql', 'concepts'],
  grading: ['ipc-client', 'store-sql', 'scheduler'],
  // D172 — 코스 카드를 굽는 층. cards 가 concepts 의 `Hop` 을 import 하므로 concepts 에 둘 수
  // 없고(순환), 생성기는 순수라 IPC 를 못 부른다. 그래서 cards 위·ui 아래에 한 층이 선다.
  course: ['cards', 'concepts', 'dictionary', 'store-sql', 'ipc-client'],
  // 01 §2: `ui` 는 「위 전부」 — 단 invoke 직접 호출은 금지(= @tauri-apps 는 여전히 막힌다).
  ui: ['course', 'cards', 'scheduler', 'grading', 'concepts', 'dictionary', 'store-sql', 'ipc-client'],
  // `text` 는 01 §2 표에 없다. 의존 없는 잎 유틸로 다룬다 — 누구나 쓰고, 아무것도 쓰지 않는다.
  text: [],
  // `i18n` 도 잎이다 (D117). `text` 의 render() 위에 카탈로그 한 겹을 얹은 것뿐이라
  // 화면 문구를 쓰는 층이면 어디서나 부른다.
  i18n: ['text'],
};

const TAURI_GROUP = ['@tauri-apps/api', '@tauri-apps/api/**'];
const TAURI_MESSAGE =
  '@tauri-apps/api 는 packages/ipc-client 안에서만 import 한다 (05 §1.2 · 01 §2). ' +
  '화면·패키지는 @chickadee/ipc-client 의 타입 있는 래퍼를 쓴다.';

/** `zone` 이 import 하면 안 되는 워크스페이스 패키지 목록. */
function forbiddenPackages(zone) {
  const allowed = new Set([zone, 'text', 'i18n', ...(ALLOWED_DEPS[zone] ?? [])]);
  return WORKSPACE_PACKAGES.filter((pkg) => !allowed.has(pkg));
}

/** `zone` 에 적용할 no-restricted-imports 규칙 값. */
function restrictedImportsFor(zone) {
  const patterns = [];

  if (zone !== 'ipc-client') {
    patterns.push({ group: TAURI_GROUP, message: TAURI_MESSAGE });
  }

  const forbidden = forbiddenPackages(zone);
  if (forbidden.length > 0) {
    patterns.push({
      group: forbidden.flatMap((pkg) => [`@chickadee/${pkg}`, `@chickadee/${pkg}/**`]),
      message:
        `01 §2 의존 방향 위반 — ${zone} 이 import 해도 되는 것은 ` +
        `[${[...(ALLOWED_DEPS[zone] ?? []), 'text', 'i18n'].join(', ')}] 뿐이다.`,
    });
  }

  return patterns.length > 0 ? ['error', { patterns }] : 'off';
}

// D42 — 이 두 파일에서만 dangerouslySetInnerHTML 을 허용한다 (06 §4.3).
const DANGEROUS_HTML_ALLOWLIST = [
  'packages/ui/src/RichText.tsx',
  'apps/desktop/src/components/dee/DeeSprite.tsx',
];

const NO_DANGER_SYNTAX = [
  {
    // eslint-plugin-react 없이 react/no-danger 와 같은 것을 막는다(§보고 참조).
    selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
    message:
      'dangerouslySetInnerHTML 은 packages/ui/src/RichText.tsx 와 ' +
      'apps/desktop/src/components/dee/DeeSprite.tsx 에서만 쓴다 (06 §4.3 · D42). ' +
      '나머지는 RichText 를 거친다.',
  },
  {
    // React.createElement(props) 경로도 같이 막는다.
    selector: "Property[key.name='dangerouslySetInnerHTML']",
    message:
      'dangerouslySetInnerHTML 은 packages/ui/src/RichText.tsx 와 ' +
      'apps/desktop/src/components/dee/DeeSprite.tsx 에서만 쓴다 (06 §4.3 · D42).',
  },
];

const NO_RANDOM_PROPERTIES = [
  {
    object: 'Math',
    property: 'random',
    message:
      '무작위는 주입된 seeded PRNG 만 쓴다 (06 §1.3). ' +
      'planSession 은 같은 입력에 같은 큐를 내야 재현이 된다.',
  },
];

const SOURCE_GLOB = '**/*.{ts,tsx,js,jsx,mjs,cjs}';

module.exports = tseslint.config(
  // ── 무시 목록 ──────────────────────────────────────────────────────────────
  {
    ignores: [
      '**/node_modules/**',
      // 병렬 세션이 쓰는 격리 워크트리. 리포 전체의 사본이라 여기까지 훑으면 `design/**`
      // 같은 무시 대상이 경로가 달라져 되살아난다.
      '.claude/worktrees/**',
      '**/dist/**',
      '**/target/**',
      '**/.venv/**',
      'design/**', // 목업은 원본 그대로 둔다 — 05 가 옮겨 심는 대상이지 린트 대상이 아니다.
      'fixtures/repos/*/', // make-fixture-repo.sh 생성물. `.steps` 만 커밋한다(06 §1.2).
      // 파서 골든의 입력. 일부러 미선언 식별자·파싱이 깨진 파일을 담으므로 린트 대상이 아니다(06 §1.2).
      'fixtures/golden/**',
      'packages/*/src/catalog.ts', // catalog:build 생성물
    ],
  },

  // ── 기본 ───────────────────────────────────────────────────────────────────
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: [SOURCE_GLOB],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.es2023 },
    },
    rules: {
      'no-console': 'error',
      'no-restricted-properties': ['error', ...NO_RANDOM_PROPERTIES],
      'no-restricted-syntax': ['error', ...NO_DANGER_SYNTAX],
      'no-restricted-imports': ['error', { patterns: [{ group: TAURI_GROUP, message: TAURI_MESSAGE }] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },

  // ── JSX: 접근성 + 훅 ───────────────────────────────────────────────────────
  {
    ...jsxA11y.flatConfigs.recommended,
    files: ['**/*.{jsx,tsx}'],
  },
  {
    ...reactHooks.configs['recommended-latest'],
    files: ['**/*.{jsx,tsx}'],
  },

  // ── 01 §2 의존 방향 ────────────────────────────────────────────────────────
  ...Object.keys(ALLOWED_DEPS).map((zone) => ({
    files: [`packages/${zone}/**/*.{ts,tsx,js,jsx,mjs,cjs}`],
    rules: { 'no-restricted-imports': restrictedImportsFor(zone) },
  })),
  {
    // 01 §2 의 `ui` 는 packages/ui + apps/desktop/src 둘 다다.
    files: ['apps/desktop/src/**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    rules: { 'no-restricted-imports': restrictedImportsFor('ui') },
  },

  // ── D42 예외 2파일 ─────────────────────────────────────────────────────────
  {
    files: DANGEROUS_HTML_ALLOWLIST,
    rules: { 'no-restricted-syntax': 'off' },
  },

  // ── 빌드 스크립트·설정 파일: Node 전역, console 허용 ────────────────────────
  {
    files: ['scripts/**/*.{ts,mts,js,mjs,cjs}', '**/*.config.{ts,mts,js,mjs,cjs}', 'eslint.config.js', 'stylelint.config.js'],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'module',
    },
    rules: {
      'no-console': 'off', // 빌드 스크립트의 출력은 로그가 아니라 UI 다.
    },
  },
  {
    files: ['eslint.config.js', 'stylelint.config.js', '**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },

  // ── 테스트 ─────────────────────────────────────────────────────────────────
  // 계약 테스트는 경계를 건너 읽는다(예: grading 의 테스트가 store-sql 마이그레이션에
  // t3 예약이 남아 있는지 확인). 01 §2 는 **제품 코드의** 의존 방향 규칙이므로
  // 테스트에는 층 규칙을 걸지 않는다 — 대신 @tauri-apps 금지는 테스트에도 그대로 남긴다.
  {
    files: ['**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-restricted-imports': ['error', { patterns: [{ group: TAURI_GROUP, message: TAURI_MESSAGE }] }],
    },
  },
  {
    // ipc-client 의 테스트는 자기 유일한 의존(@tauri-apps/api)을 당연히 import 한다.
    files: ['packages/ipc-client/**/*.{test,spec}.{ts,tsx}'],
    rules: { 'no-restricted-imports': 'off' },
  },
);
