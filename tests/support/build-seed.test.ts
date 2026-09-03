/**
 * 시드를 굽고 그 안에 무엇이 들었는지 못박는다. Playwright 가 이 파일을 읽지 않는다 —
 * 굽는 것은 vitest 에서만 되고(사전 번들이 Vite 것이다), Playwright 는 결과만 연다.
 *
 * 이 테스트가 빨가면 브라우저 게이트는 전부 뜻이 없다.
 */
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import { SEED_PATH, buildSeed } from './build-seed.js';

import type BetterSqlite3 from 'better-sqlite3';

const require_ = createRequire(import.meta.url);
const Database = require_('better-sqlite3') as new (path: string) => BetterSqlite3.Database;

describe('브라우저 게이트의 시드', () => {
  test('덤프에서 구우면 사용처와 카드 재료가 선다', async () => {
    const out = join(process.cwd(), SEED_PATH);
    await buildSeed(Database, out);

    const db = new Database(out);
    const one = (sql: string): number => (db.prepare(sql).get() as { n: number }).n;
    expect(one('SELECT COUNT(*) AS n FROM concept_site')).toBeGreaterThan(0);
    expect(one('SELECT COUNT(*) AS n FROM concept')).toBeGreaterThan(0);
    expect(one('SELECT COUNT(*) AS n FROM file')).toBeGreaterThan(0);
    db.close();
  });
});
