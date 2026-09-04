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
import { SCHEMA_VERSION, statements, toSqliteBindings } from '@chickadee/store-sql';

import type BetterSqlite3 from 'better-sqlite3';

/** 고정 시각·시간대. `build-seed.ts` 와 같은 값이어야 한다. */
export { NOW, TZ, SEED_PATH } from './build-seed-const.js';
import { SEED_PATH } from './build-seed-const.js';

/**
 * **지금 걸린** T0 판의 정답 보기 번호(1부터). 생성기가 섞은 순서를 **원장에서** 읽는다 —
 * 화면을 보고 답을 고르면 「채점이 맞나」가 아니라 「화면이 자기 말을 되풀이하나」가 된다.
 *
 * 열린 세션의 **안 끝난 첫 판**을 집는다. 「마지막 카드가 그 판」이라는 앞의 가정은 큐가 한
 * 장일 때만 맞았고, 첫날 큐가 두 판이 되면서(D113) 다음 판의 답을 집었다.
 *
 * `payload.answer` 는 0부터인 보기 인덱스다(`gradeT0` 이 `sel === card.answer` 로 잰다).
 * 05 §7 의 `1~4` 는 그 인덱스에 1 을 더한 것이다 — 이 한 칸 차이를 여기서 한 번만 넘긴다.
 */
export function answerKeyOf(db: BetterSqlite3.Database): number {
  const row = db
    .prepare(
      `SELECT c.payload_json AS p
         FROM session_item i JOIN card c ON c.id = i.card_id
        WHERE i.session_id = (SELECT MAX(id) FROM session)
          AND i.status IN ('pending', 'active')
          AND c.track = 't0'
        ORDER BY i.pos LIMIT 1`,
    )
    .get() as { p: string } | undefined;
  if (row === undefined) throw new Error('안 끝난 T0 판이 없다 — 세션을 먼저 열어라');
  return (JSON.parse(row.p) as { answer: number }).answer + 1;
}

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
      // 서가가 「폴더가 아직 있나」를 묻는 자리 (D119). 픽스처 리포는 디스크에 없지만
      // 하네스가 던지면 화면이 전부 `missing` 으로 보인다 — 원장에 적힌 그대로 답한다.
      case 'repo_probe': {
        const row = db.prepare('SELECT root_path, fingerprint, head_sha FROM repo WHERE root_path = ?')
          .get(args['path'] as string) as { root_path: string; fingerprint: string; head_sha: string | null } | undefined;
        if (row === undefined) throw Object.assign(new Error('FS_NOT_FOUND'), { code: 'FS_NOT_FOUND' });
        return { rootPath: row.root_path, fingerprint: row.fingerprint, headCommit: row.head_sha };
      }
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
