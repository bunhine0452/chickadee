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

/* ═════════ chickadee/no-retired-tokens ═════════ */

describe('chickadee/no-retired-tokens', () => {
  const RULE = 'chickadee/no-retired-tokens';
  const COMPONENT = path.join(ROOT, 'packages', 'ui', 'src', 'Card.css');

  test('폐기된 리소 토큰을 쓰면 걸린다', async () => {
    const found = await lint(RULE, '.x { background: var(--paper-2); }', COMPONENT);
    expect(found).toHaveLength(1);
    expect(found[0].text).toContain('--paper-2');
  });

  test('트랙 색과 판정 색도 걸린다', async () => {
    const found = await lint(RULE, '.x { color: var(--t1); border-color: var(--verdict-exact); }', COMPONENT);
    expect(found).toHaveLength(2);
  });

  test('재정의해도 걸린다 — 이름을 되살리는 것이 가장 위험하다', async () => {
    const found = await lint(RULE, '.x { --ink: #14171A; }', COMPONENT);
    expect(found).toHaveLength(1);
    expect(found[0].text).toContain('--ink');
  });

  test('토큰 파일도 예외가 아니다 — 정의가 사라진 것이 요점이다', async () => {
    const styles = path.join(ROOT, 'apps', 'desktop', 'src', 'styles', 'tokens.css');
    const found = await lint(RULE, ':root { --paper: #fff; }', styles);
    expect(found).toHaveLength(1);
  });

  test('새 이름은 통과한다', async () => {
    const code = '.x { background: var(--surface-2); color: var(--text-muted); border-color: var(--border); }\n' +
      '.y { color: var(--ok); background: var(--accent-weak); }';
    expect(await lint(RULE, code, COMPONENT)).toEqual([]);
  });

  test('접두어가 같아도 다른 이름이면 통과한다', async () => {
    // `--t1` 은 폐기됐지만 `--text` 는 아니다. 경계가 글자 단위로 서야 한다.
    expect(await lint(RULE, '.x { color: var(--text); }', COMPONENT)).toEqual([]);
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
    const code = '[data-theme="dark"] { --text: #E8EBEF; }';
    expect(await lint(RULE, code, p('apps', 'desktop', 'src', 'styles', 'tokens.css'))).toEqual([]);
  });

  test('예외 컴포넌트는 이제 없다 — 테마 분기는 토큰 한 곳에서 끝난다 (D182)', async () => {
    for (const name of ['PressButton', 'Switch', 'TimeQueue', 'Crumb']) {
      const code = '[data-theme="dark"] .x { box-shadow: 0 0 12px var(--accent); }';
      const found = await lint(RULE, code, p('packages', 'ui', 'src', `${name}.css`));
      expect(found, name).toHaveLength(1);
    }
  });

  test('다크 선택자가 없으면 어느 파일이든 통과한다', async () => {
    expect(await lint(RULE, '.masthead { background: var(--surface); }', p('packages', 'ui', 'src', 'Masthead.css'))).toEqual([]);
  });
});

/* ═════════ chickadee/no-decoration ═════════ */

describe('chickadee/no-decoration', () => {
  const RULE = 'chickadee/no-decoration';

  test('mix-blend-mode 는 어디서든 걸린다', async () => {
    const found = await lint(RULE, '.sig { mix-blend-mode: multiply; }');
    expect(found).toHaveLength(1);
    expect(found[0].text).toContain('mix-blend-mode');
  });

  test('반복 그러데이션(질감·빗금)은 걸린다', async () => {
    const found = await lint(RULE, '.q { background-image: repeating-linear-gradient(-45deg, transparent 0 3px, #eee 3px 6px); }');
    expect(found).toHaveLength(1);
    expect(found[0].text).toContain('repeating-linear-gradient');
  });

  test('drop-shadow 필터는 걸린다', async () => {
    const found = await lint(RULE, '.x { filter: drop-shadow(0 2px 2px #000); }');
    expect(found).toHaveLength(1);
  });

  test('0 이 아닌 회전은 걸린다', async () => {
    const found = await lint(RULE, '.stamp { transform: rotate(-5deg); }');
    expect(found).toHaveLength(1);
    expect(found[0].text).toContain('rotate');
  });

  test('rotate(0deg) 는 통과한다 — 되돌리는 선언까지 막지 않는다', async () => {
    expect(await lint(RULE, '.x { transform: rotate(0deg); }')).toEqual([]);
  });

  test('평범한 면·선·그림자는 통과한다', async () => {
    const code = '.card { background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-1); }';
    expect(await lint(RULE, code)).toEqual([]);
  });
});

/* ═════════ 실제 산출물이 네 규칙을 다 통과한다 ═════════ */

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
