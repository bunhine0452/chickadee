/**
 * scripts/stylelint-chickadee.mjs 의 4개 규칙 단위 테스트 (05 §4.2 · §4.3).
 * 규칙마다 「걸린다」와 「멀쩡한 것은 통과한다」를 짝으로 둔다.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import stylelint from 'stylelint';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = path.join(ROOT, 'scripts', 'stylelint-chickadee.mjs');

/** 규칙 하나만 켜고 CSS 문자열을 검사한다. codeFilename 으로 파일 위치 규칙도 시험한다. */
async function lint(rule, code, codeFilename) {
  const { results } = await stylelint.lint({
    code,
    ...(codeFilename ? { codeFilename } : {}),
    config: { plugins: [PLUGIN], rules: { [rule]: true } },
  });
  return results[0].warnings.map((w) => ({ rule: w.rule, text: w.text, line: w.line }));
}

/* ═════════ chickadee/no-font-size-below-13 ═════════ */

describe('chickadee/no-font-size-below-13', () => {
  const RULE = 'chickadee/no-font-size-below-13';

  test('목업의 `.map .nd .dir{font-size:12.5px}` 가 걸린다', async () => {
    const found = await lint(RULE, '.map .nd .dir { font-size: 12.5px; }');
    expect(found).toHaveLength(1);
    expect(found[0].rule).toBe(RULE);
    expect(found[0].text).toContain('12.5px');
  });

  test('목업의 `.newtag{font-size:12px}` 가 걸린다', async () => {
    const found = await lint(RULE, '.newtag { font-size: 12px; }');
    expect(found).toHaveLength(1);
    expect(found[0].text).toContain('12px');
  });

  test('목업의 `.band-s{font-size:13px}` 는 통과한다 — 하한은 13px 포함', async () => {
    expect(await lint(RULE, '.band-s { font-size: 13px; }')).toEqual([]);
  });

  test('var() 토큰은 통과한다', async () => {
    expect(await lint(RULE, '.tag { font-size: var(--fs-13); }')).toEqual([]);
  });

  test('rem 리터럴도 16px 기준으로 환산해 잡는다', async () => {
    const found = await lint(RULE, '.x { font-size: .75rem; }');
    expect(found).toHaveLength(1);
    expect(found[0].text).toContain('12px');
  });

  test('font-size 가 아닌 선언의 작은 px 는 건드리지 않는다', async () => {
    expect(await lint(RULE, '.x { padding: 4px; border-width: 2px; }')).toEqual([]);
  });
});

/* ═════════ chickadee/track-alias-only ═════════ */

describe('chickadee/track-alias-only', () => {
  const RULE = 'chickadee/track-alias-only';
  const COMPONENT = path.join(ROOT, 'packages', 'ui', 'src', 'Stamp.css');
  const STYLES = path.join(ROOT, 'apps', 'desktop', 'src', 'styles', 'tokens.css');

  test('컴포넌트가 var(--pink) 를 직접 쓰면 걸린다', async () => {
    const found = await lint(RULE, '.gl.exact { background: var(--pink); }', COMPONENT);
    expect(found).toHaveLength(1);
    expect(found[0].text).toContain('--pink');
  });

  test('-deep · -text 변형도 걸린다', async () => {
    const found = await lint(RULE, '.a { color: var(--yellow-text); border-color: var(--blue-deep); }', COMPONENT);
    expect(found).toHaveLength(2);
  });

  test('컴포넌트에서 원색을 재정의해도 걸린다', async () => {
    const found = await lint(RULE, '.a { --pink: #FF2E7E; }', COMPONENT);
    expect(found).toHaveLength(1);
    expect(found[0].text).toContain('재정의');
  });

  test('트랙 별칭 · on-t* · verdict-* 는 통과한다', async () => {
    const code = '.pill { background: var(--t1); color: var(--on-t1); border-color: var(--t1-deep); }\n' +
      '.rtag { color: var(--verdict-exact); }';
    expect(await lint(RULE, code, COMPONENT)).toEqual([]);
  });

  test('styles/ 안(토큰 정의)에서는 원색을 써도 된다', async () => {
    expect(await lint(RULE, ':root { --t1: var(--pink); }', STYLES)).toEqual([]);
  });
});

/* ═════════ chickadee/dark-selector-allowlist ═════════ */

describe('chickadee/dark-selector-allowlist', () => {
  const RULE = 'chickadee/dark-selector-allowlist';
  const p = (...seg) => path.join(ROOT, ...seg);

  test('허용 목록에 없는 컴포넌트의 다크 선택자는 걸린다', async () => {
    const found = await lint(RULE, '[data-theme="dark"] .masthead { box-shadow: none; }', p('packages', 'ui', 'src', 'Masthead.css'));
    expect(found).toHaveLength(1);
    expect(found[0].text).toContain('data-theme');
  });

  test('tokens.css 는 통과한다', async () => {
    const code = '[data-theme="dark"] { --ink: #F3EADB; }';
    expect(await lint(RULE, code, p('apps', 'desktop', 'src', 'styles', 'tokens.css'))).toEqual([]);
  });

  test('글로우가 필요한 6개 컴포넌트는 통과한다', async () => {
    for (const name of ['PressButton', 'Switch', 'TimeQueue', 'Node', 'Stamp', 'Crumb']) {
      const code = `[data-theme="dark"] .x { box-shadow: 0 0 12px var(--glow-t0); }`;
      expect(await lint(RULE, code, p('packages', 'ui', 'src', `${name}.css`))).toEqual([]);
    }
  });

  test('다크 선택자가 없으면 어느 파일이든 통과한다', async () => {
    expect(await lint(RULE, '.masthead { background: var(--paper); }', p('packages', 'ui', 'src', 'Masthead.css'))).toEqual([]);
  });
});

/* ═════════ chickadee/print-physics-scope ═════════ */

describe('chickadee/print-physics-scope', () => {
  const RULE = 'chickadee/print-physics-scope';

  test('본문 단 안의 mix-blend-mode 는 걸린다', async () => {
    const found = await lint(RULE, '.fb p { mix-blend-mode: multiply; }');
    expect(found).toHaveLength(1);
    expect(found[0].text).toContain('mix-blend-mode');
  });

  test('.ps-in 하위에 .grain 을 걸면 걸린다', async () => {
    const found = await lint(RULE, '.ps-in .grain { isolation: isolate; }');
    expect(found).toHaveLength(1);
    expect(found[0].text).toContain('.grain');
  });

  test('.rung-body 안의 .mr 도 걸린다', async () => {
    const found = await lint(RULE, '.rung-body .mr::before { content: ""; }');
    expect(found).toHaveLength(1);
    expect(found[0].text).toContain('.mr');
  });

  test('본문 단 밖(판 번호 .sig)의 인쇄 물리는 통과한다', async () => {
    expect(await lint(RULE, '.sig .mr::before { mix-blend-mode: var(--blend); }')).toEqual([]);
  });

  test('본문 단 안이라도 인쇄 물리가 아니면 통과한다', async () => {
    expect(await lint(RULE, '.ask { max-width: var(--measure); color: var(--ink); }')).toEqual([]);
  });
});

/* ═════════ 실제 산출물이 4개 규칙을 다 통과한다 ═════════ */

describe('apps/desktop/src/styles/*.css', () => {
  test('생성·이식한 스타일시트에 규칙 위반이 없다', async () => {
    const { results } = await stylelint.lint({
      files: 'apps/desktop/src/styles/*.css',
      cwd: ROOT,
      configFile: path.join(ROOT, 'stylelint.config.js'),
    });
    const warnings = results.flatMap((r) => r.warnings.map((w) => `${path.basename(r.source)} ${w.line}:${w.column} ${w.rule} ${w.text}`));
    expect(warnings).toEqual([]);
  });
});
