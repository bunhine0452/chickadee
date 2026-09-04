/**
 * 카탈로그의 모든 statement 를 진짜 SQLite 에 붙여 본다.
 *
 * 왜: 이름·행 타입은 빌드가 검사하지만 **SQL 자체는 아무도 안 읽는다**. 이름을 잘못 쓴 열이나
 * 없는 테이블은 그 statement 를 처음 부르는 화면에서야 터진다. `prepare` 는 파서·해석기까지
 * 돌리므로 여기서 전부 걸린다.
 */
import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

import type BetterSqlite3 from 'better-sqlite3';

import { migrations, statements } from './index.js';

const require_ = createRequire(import.meta.url);
const Database = require_('better-sqlite3') as new (path: string) => BetterSqlite3.Database;

describe('statement', () => {
  it('전부 SQLite 가 prepare 한다', () => {
    const db = new Database(':memory:');
    // 마이그레이션을 전부 태운다 — statement 는 **지금 스키마**에 대고 prepare 되어야 한다.
    // 0001 만 태우면 뒤 마이그레이션이 만든 표를 쓰는 문장이 여기서 안 걸린다.
    const ordered = [...migrations].sort((a, b) => a.version - b.version);
    if (ordered[0]?.version !== 1) throw new Error('0001_init.sql 이 카탈로그에 없다');
    for (const m of ordered) db.exec(m.sql);

    const broken: { name: string; message: string }[] = [];
    for (const [name, sql] of Object.entries(statements)) {
      try {
        db.prepare(sql);
      } catch (e) {
        broken.push({ name, message: e instanceof Error ? e.message : String(e) });
      }
    }
    db.close();
    expect(broken).toEqual([]);
  });
});
