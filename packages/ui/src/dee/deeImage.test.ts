/**
 * 구운 스티커의 전제 — Dee 팔레트에는 **야간반 갈래가 없다** (D115).
 *
 * `deeImageUrl` 은 판(심볼 × 겹)마다 그림 한 장을 만들어 두고 다시 쓴다. 그 캐시가 옳으려면
 * 같은 겹이 주간·야간에 같은 색이어야 한다. 지금은 그렇다 — `tokens.css` 의
 * `[data-theme="dark"]` 블록이 `--dee-*` 를 다시 정의하지 않는다. 누가 그것을 바꾸면
 * 캐시가 밤에 낮 그림을 내놓게 되므로, 그 순간 이 테스트가 먼저 깨진다.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const TOKENS = join(process.cwd(), 'apps/desktop/src/styles/tokens.css');

describe('Dee 팔레트', () => {
  it('야간반이 `--dee-*` 를 다시 정의하지 않는다 (구운 스티커의 전제 · D115)', () => {
    const css = readFileSync(TOKENS, 'utf8');
    const dark = /\[data-theme="dark"\]\s*\{([^}]*)\}/g;
    const redefined: string[] = [];
    for (const block of css.matchAll(dark)) {
      for (const line of (block[1] ?? '').split('\n')) {
        const name = /^\s*(--dee-[\w-]+)\s*:/.exec(line)?.[1];
        if (name !== undefined) redefined.push(name);
      }
    }
    expect(redefined).toEqual([]);
  });
});
