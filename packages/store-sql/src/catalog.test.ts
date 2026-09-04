import { describe, expect, it } from 'vitest';

import { REQUIRED_BY_RUST, SCHEMA_VERSION, catalog, migrations, statements } from './index.js';

describe('카탈로그', () => {
  it('Rust 가 기동 시 요구하는 이름이 전부 있다 (01 §3.3)', () => {
    const missing = REQUIRED_BY_RUST.filter((n) => !(n in statements));
    expect(missing).toEqual([]);
  });

  // 「빈틈없이」가 아니라 「오르기만」이다 — 갈래를 나눠 병렬로 만드는 동안 각 갈래가
  // 번호를 하나씩 예약하므로 아직 안 들어온 번호가 생긴다. 러너는 `user_version` 보다 큰
  // 것만 순서대로 적용하니 빈틈은 무해하고, 빠뜨린 마이그레이션은 `migrate-seed.test.ts` 가
  // 마이그레이션마다 시드 하나를 요구해 잡는다.
  it('마이그레이션 번호는 1부터 오르고 겹치지 않는다', () => {
    const versions = migrations.map((m) => m.version);
    expect(versions[0]).toBe(1);
    expect(versions).toEqual([...versions].sort((a, b) => a - b));
    expect(new Set(versions).size).toBe(versions.length);
  });

  it('파일마다 자기 번호를 user_version 으로 세우고 SCHEMA_VERSION 은 마지막 것이다', () => {
    for (const m of migrations) {
      expect(m.sql).toMatch(new RegExp(`PRAGMA user_version = ${m.version};`));
    }
    expect(SCHEMA_VERSION).toBe(migrations[migrations.length - 1]?.version);
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
