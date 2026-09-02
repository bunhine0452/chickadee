import { describe, expect, it } from 'vitest';

import { REQUIRED_BY_RUST, SCHEMA_VERSION, catalog, migrations, statements } from './index.js';

describe('카탈로그', () => {
  it('Rust 가 기동 시 요구하는 이름이 전부 있다 (01 §3.3)', () => {
    const missing = REQUIRED_BY_RUST.filter((n) => !(n in statements));
    expect(missing).toEqual([]);
  });

  it('마이그레이션 번호는 1부터 빈틈없이 오른다', () => {
    expect(migrations.map((m) => m.version)).toEqual(migrations.map((_, i) => i + 1));
  });

  it('0001 이 user_version 1 을 세운다', () => {
    expect(migrations[0]?.sql).toMatch(/PRAGMA user_version = 1;/);
    expect(SCHEMA_VERSION).toBe(1);
  });

  it('모든 statement 이름은 <group>.<snake_case> 다', () => {
    for (const name of Object.keys(statements)) {
      expect(name).toMatch(/^[a-z][a-z0-9]*\.[a-z][a-z0-9_]*$/);
    }
  });

  it('catalog() 는 statements 를 복사해 돌려준다 — 호출자가 원본을 못 바꾼다', () => {
    const c = catalog();
    c.statements['injected'] = 'DROP TABLE file';
    expect('injected' in statements).toBe(false);
  });
});
