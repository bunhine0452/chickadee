/**
 * Node 쪽 IPC 응답기 (D108). 브라우저의 `window.__ipc` 가 여기로 온다.
 *
 * 시드를 **굽지는 않는다** — 굽는 것은 `build-seed.ts` 이고 vitest 에서만 된다
 * (`packages/dictionary` 의 번들이 Vite 의 `import.meta.glob` 으로 만들어진다).
 * 여기서는 구워 둔 `.seed/ui.sqlite` 를 테스트마다 **메모리로 복사해** 연다:
 * 한 테스트가 큐를 소모해도 다음 테스트의 홈이 그대로여야 한다.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import Database from 'better-sqlite3';
import { statements, toSqliteBindings } from '@chickadee/store-sql';

import type BetterSqlite3 from 'better-sqlite3';

/** 고정 시각·시간대. `build-seed.ts` 와 같은 값이어야 한다. */
export { NOW, TZ, SEED_PATH } from './build-seed-const.js';
import { SEED_PATH } from './build-seed-const.js';

const SCHEMA_VERSION = 1;

export interface AppDb {
  /** 브라우저가 부르는 명령 하나. 모르는 이름은 던진다 — 조용히 `null` 을 주지 않는다. */
  handle: (cmd: string, args: Record<string, unknown>) => unknown;
  /** 검사용 직통 SQL. 화면 밖 사실을 확인할 때만 쓴다. */
  db: BetterSqlite3.Database;
  close: () => void;
}

function runner(db: BetterSqlite3.Database) {
  return (name: string, params: unknown): unknown[] => {
    const sql = (statements as Record<string, string>)[name];
    if (sql === undefined) throw new Error(`카탈로그에 없는 이름: ${name}`);
    const stmt = db.prepare(sql);
    const bound = toSqliteBindings((params ?? {}) as Record<string, unknown>);
    if (stmt.reader) return stmt.all(bound) as unknown[];
    const info = stmt.run(bound);
    return [{ changes: info.changes, lastId: Number(info.lastInsertRowid) }];
  };
}

export function makeAppDb(): AppDb {
  const seed = join(process.cwd(), SEED_PATH);
  if (!existsSync(seed)) {
    throw new Error(
      `시드가 없다: ${SEED_PATH} — 먼저 \`pnpm test:seed\` 를 돌려라 (D108).`,
    );
  }
  // 파일이 아니라 **바이트로** 연다 — better-sqlite3 는 버퍼에서 바로 열 수 있고,
  // 그러면 워커가 여럿이어도 서로의 쓰기를 보지 않는다. 시드 파일은 읽기만 한다.
  const db = new Database(readFileSync(seed) as unknown as string);
  db.pragma('foreign_keys = ON');

  const run = runner(db);
  const info = { userVersion: SCHEMA_VERSION, path: '/w/data/chickadee.db', sizeBytes: 0, wal: true };

  const handle = (cmd: string, args: Record<string, unknown>): unknown => {
    switch (cmd) {
      case 'store_open': case 'store_info':
        return info;
      case 'store_query':
        return run(args['name'] as string, args['params']);
      case 'store_exec':
        return run(args['name'] as string, args['params'])[0];
      case 'store_batch':
        return db.transaction(() =>
          (args['ops'] as { name: string; params: unknown }[])
            .map((op) => run(op.name, op.params)))();
      case 'app_paths':
        return {
          dataDir: '/w/data', dbPath: '/w/data/chickadee.db', logDir: '/w/data/logs',
          dictCacheDir: '/w/data/dict-cache', dictUserDir: '/w/data/dict-user',
        };
      case 'app_version':
        return { app: '0.1.0', tauri: '2', sqlite: '3.51.0', rustc: 'test' };
      case 'app_reveal': case 'app_wipe': case 'secret_set': case 'secret_delete':
        return null;
      case 'secret_has':
        return false;
      case 'app_write_json':
        return '/w/data/exports';
      case 'parse_langs':
        return [];
      // 파일을 읽는 명령은 실패한다 — 픽스처 리포가 없고, 생성기는 그때 `excerpt` 로
      // 물러선다. 그 갈래가 화면에 뜨는 것도 게이트가 봐야 하는 것이다.
      case 'file_read_lines': case 'file_read_block': case 'parse_snippet':
      case 'git_blame_lines': case 'git_diff_text':
        throw Object.assign(new Error('FS_NOT_FOUND'), { code: 'FS_NOT_FOUND' });
      default:
        throw new Error(`하네스가 모르는 명령: ${cmd}`);
    }
  };

  return { handle, db, close: () => db.close() };
}
