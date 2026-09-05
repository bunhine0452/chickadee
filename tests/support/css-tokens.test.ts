/**
 * `var(--x)` 가 가리키는 토큰이 실제로 있는지 본다 (D182).
 *
 * 왜 테스트까지 있나: 시각 시스템을 갈아엎은 뒤 `components/run/RunPanel.css` 가 옛 이름
 * 아홉(`--rule` · `--fs-13`~`--fs-16` · `--f-mono` · `--state-*`)을 그대로 들고 있었다.
 * **아무것도 빨갛지 않았다** — 타입체크·단위 시험·대비 게이트·e2e 가 전부 초록이었다.
 * CSS 에서 정의 없는 `var()` 는 오류가 아니라 **그 선언을 통째로 무효로 만드는 것**이라,
 * `border: 1px solid var(--rule)` 은 테두리가 없는 것이 되고 `font-size: var(--fs-14)` 는
 * 상속값이 된다. 화면이 조용히 어긋나고 게이트는 어긋난 화면을 재고 통과한다.
 *
 * stylelint 의 `no-retired-tokens` 는 **폐기된 이름**을 막지만 그것은 목록에 든 것만이다.
 * 이 시험은 반대편을 막는다 — 목록에 없더라도 **정의가 없으면** 걸린다.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'vitest';

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'target', 'dist', 'coverage', 'test-results',
  'playwright-report', '.seed', '.oculpm',
  // 목업과 폐기 시안은 앱이 안 읽는다 — 옛 토큰이 그대로 있는 것이 정상이다.
  'legacy', 'ink',
]);

/** 앱이 실제로 싣는 CSS 만. `design/` 은 이력이라 여기 없다. */
const ROOTS = ['apps/desktop/src', 'packages/ui/src'];

function repoRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i += 1) {
    try {
      statSync(join(dir, 'pnpm-workspace.yaml'));
      return dir;
    } catch {
      dir = dirname(dir);
    }
  }
  throw new Error('워크스페이스 뿌리를 못 찾았다');
}

function cssFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) cssFiles(join(dir, entry.name), out);
    } else if (entry.name.endsWith('.css')) {
      out.push(join(dir, entry.name));
    }
  }
  return out;
}

/**
 * 컴포넌트가 `style={{ '--w': … }}` 로 넣는 값. CSS 에는 정의가 없는 것이 맞다 —
 * 여기 이름을 더하려면 그 값을 넣는 `.tsx` 가 함께 있어야 한다.
 */
const INLINE = new Set(['--w', '--pct', '--fill']);

/** `var(--x)` 와 `var(--x, fallback)`. 폴백이 있으면 정의가 없어도 안 깨진다. */
const USE = /var\(\s*(--[a-z0-9-]+)\s*([,)])/gi;
/** 선언 `--x: value`. 한 줄에 여럿 있어도 잡는다. */
const DEF = /(^|[{;\s])(--[a-z0-9-]+)\s*:/g;

describe('CSS 토큰 (D182)', () => {
  const root = repoRoot();
  const files = ROOTS.flatMap((r) => cssFiles(join(root, r)));

  test('훑은 CSS 파일이 있다', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  test('폴백 없는 `var(--x)` 는 정의된 토큰만 가리킨다', () => {
    const defined = new Set(INLINE);
    const used = new Map<string, string[]>();

    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(DEF)) defined.add(m[2] as string);
      for (const m of text.matchAll(USE)) {
        if (m[2] !== ')') continue; // 폴백이 있으면 안 깨진다
        const name = m[1] as string;
        const where = file.slice(root.length + 1);
        const at = used.get(name) ?? [];
        if (!at.includes(where)) at.push(where);
        used.set(name, at);
      }
    }

    const missing = [...used.entries()]
      .filter(([name]) => !defined.has(name))
      .map(([name, where]) => `${name} ← ${where.join(' · ')}`);

    expect(missing, missing.join('\n')).toEqual([]);
  });
});
