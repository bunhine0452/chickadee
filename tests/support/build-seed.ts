/**
 * 시드 한 벌을 굽는다 (D108). **vitest 안에서만 돈다** — `packages/dictionary` 의 번들은
 * Vite 의 `import.meta.glob` 으로 만들어져 Playwright 의 CJS 로더에서는 열리지 않는다.
 *
 * 시드의 재료는 **Rust 가 실제로 뱉은 덤프**(`fixtures/ipc/tiny/`)다 — `apps/desktop/src/
 * data/pipeline.test.ts` 가 쓰는 것과 같은 것이고 06 §2 가 게이트에 지정한 것도 이것이다.
 * 파생은 앱 코드(`deriveRepo`)가 그대로 돌린다: 화면이 보는 것이 손으로 넣은 행이 아니라
 * **앱이 만든 행**이어야 게이트가 뜻을 갖는다.
 *
 * `ipc` 는 `vi.mock` 없이 **런타임에 갈아 끼운다** — `as const` 는 타입만 읽기 전용으로
 * 만들고, 파생 층은 호출 시점에 메서드를 찾는다.
 */
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { deriveRepo, materializeDict } from '@chickadee/concepts';
import { loadDict } from '@chickadee/dictionary';
import { ipc } from '@chickadee/ipc-client';
import type { Capture } from '@chickadee/ipc-client';
import { migrations, statements, toSqliteBindings } from '@chickadee/store-sql';

import type BetterSqlite3 from 'better-sqlite3';

export { NOW, SEED_PATH, TZ } from './build-seed-const.js';
import { NOW, TZ } from './build-seed-const.js';

/** 덤프가 담은 파일은 하나다 — `derive.captures_by_file` 한 페이지가 그 계약이다. */
const DUMPED_FILE = 'src/store/repo.ts';

interface DumpCapture {
  query_id: string; match_id: number; name: string; pattern_index: number;
  form: string | null; node_kind: string; in_error: number;
  start_byte: number; end_byte: number; start_line: number; end_line: number;
  start_col: number; end_col: number; excerpt: string;
}

const toCapture = (r: DumpCapture): Capture => ({
  queryId: r.query_id, matchId: r.match_id, name: r.name, patternIndex: r.pattern_index,
  form: r.form, nodeKind: r.node_kind, inError: r.in_error === 1,
  startByte: r.start_byte, endByte: r.end_byte, startLine: r.start_line, endLine: r.end_line,
  startCol: r.start_col, endCol: r.end_col, excerpt: r.excerpt,
});

export function statementRunner(db: BetterSqlite3.Database) {
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

/** 마이그레이션을 다 적용한 빈 DB. Playwright 쪽도 이 함수로 스키마를 맞춘다. */
export function applySchema(db: BetterSqlite3.Database): void {
  for (const m of [...migrations].sort((a, b) => a.version - b.version)) db.exec(m.sql);
  db.pragma('foreign_keys = ON');
}

export async function buildSeed(Database: new (path: string) => BetterSqlite3.Database,
  outPath: string): Promise<void> {
  rmSync(outPath, { force: true });
  mkdirSync(dirname(outPath), { recursive: true });
  const db = new Database(outPath);
  applySchema(db);

  const run = statementRunner(db);
  const target = ipc as unknown as Record<string, Record<string, unknown>>;
  target['store'] = {
    ...target['store'],
    query: (name: string, params: unknown) => Promise.resolve(run(name, params)),
    exec: (name: string, params: unknown) => Promise.resolve(run(name, params)[0]),
    batch: (ops: { name: string; params: unknown }[]) =>
      Promise.resolve(db.transaction(() => ops.map((op) => run(op.name, op.params)))()),
  };
  // 맥락 줄은 못 읽는다(픽스처 리포가 없다) — 생성기는 `excerpt` 로 물러선다.
  target['file'] = { readLines: () => Promise.reject(new Error('no file')) };

  db.prepare(
    `INSERT INTO repo (id, root_path, name, fingerprint, added_at)
     VALUES (1, '/w/tiny', 'tiny', 'r', ?)`,
  ).run(NOW);
  db.prepare(`INSERT INTO settings (key, value_json, updated_at) VALUES ('tz', ?, ?)`)
    .run(JSON.stringify(TZ), NOW);

  const dict = loadDict();
  await materializeDict(dict, NOW);

  const fixture = join(process.cwd(), 'fixtures/ipc/tiny');
  const dump = <T,>(name: string): T =>
    JSON.parse(readFileSync(join(fixture, name), 'utf8')) as T;

  const files = dump<{ path: string; content_hash: string }[]>('files.json');
  const insertFile = db.prepare(
    `INSERT INTO file (id, repo_id, path, content_hash, grammar, updated_at)
     VALUES (?, 1, ?, ?, 'typescript', ?)`,
  );
  files.forEach((f, i) => insertFile.run(i + 1, f.path, f.content_hash, NOW));

  const fileId = files.findIndex((f) => f.path === DUMPED_FILE) + 1;
  if (fileId === 0) throw new Error(`덤프에 ${DUMPED_FILE} 이 없다`);
  const insertCapture = db.prepare(
    `INSERT INTO capture (file_id, query_id, match_id, pattern_index, name, form, node_kind,
       in_error, start_byte, end_byte, start_line, end_line, start_col, end_col, excerpt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const c of dump<DumpCapture[]>('captures.json')) {
    const cap = toCapture(c);
    insertCapture.run(
      fileId, cap.queryId, cap.matchId, cap.patternIndex, cap.name, cap.form, cap.nodeKind,
      cap.inError ? 1 : 0, cap.startByte, cap.endByte, cap.startLine, cap.endLine,
      cap.startCol, cap.endCol, cap.excerpt,
    );
  }

  await deriveRepo(dict, {
    repoId: 1, rootPath: '/w/tiny', mode: 'full', sinceHead: null, now: NOW,
  });
  db.close();
}
