/**
 * 파생 층을 **진짜 sqlite** 위에서 한 바퀴 (06 §1.4). 카탈로그의 SQL 을 그대로 돌리므로
 * statement 가 깨지면 여기서 걸린다 — 화면이 아니라.
 *
 * IPC 는 모의한다. Rust 가 캡처를 쓰고 나면 그다음은 전부 TS 이고, 그 「그다음」이 이 테스트다.
 */
import { createRequire } from 'node:module';

import { loadDict } from '@chickadee/dictionary';
import { migrations, statements, toSqliteBindings } from '@chickadee/store-sql';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type BetterSqlite3 from 'better-sqlite3';

const require_ = createRequire(import.meta.url);
type SqliteDb = BetterSqlite3.Database;
const Database = require_('better-sqlite3') as new (path: string) => SqliteDb;

const T = 1_767_225_600_000;
let db: SqliteDb;

/** 카탈로그 이름으로만 SQL 을 돌린다 — Rust 의 `store` 크레이트와 같은 규칙이다. */
function run(name: string, params: unknown): unknown[] {
  const sql = (statements as Record<string, string>)[name];
  if (sql === undefined) throw new Error(`카탈로그에 없는 이름: ${name}`);
  const bound = toSqliteBindings((params ?? {}) as Record<string, unknown>);
  const stmt = db.prepare(sql);
  return stmt.reader ? (stmt.all(bound) as unknown[]) : [stmt.run(bound)];
}

vi.mock('@chickadee/ipc-client', () => ({
  ipc: {
    store: {
      query: (name: string, params: unknown) => Promise.resolve(run(name, params)),
      exec: (name: string, params: unknown) => Promise.resolve(run(name, params)[0]),
      batch: (ops: { name: string; params: unknown }[]) =>
        Promise.resolve(ops.map((op) => run(op.name, op.params)[0])),
    },
    git: { blameLines: () => Promise.resolve({ hunks: [] }) },
    ingest: { start: () => Promise.resolve({ jobId: 'test' }) },
    repo: { probe: () => Promise.reject(new Error('probe 는 이 테스트에서 쓰지 않는다')) },
  },
  on: () => Promise.resolve(() => undefined),
  IpcError: class extends Error {},
}));

const { deriveRepo, materializeDict, recountUnknown, writeUnitNodes } = await import('./ingest.js');

const dict = loadDict();

/**
 * `_imports` 캡처 한 건을 심는다 (04 §7.1). Rust 는 지정자 문자열만 잡고 그것이 어느
 * 파일인지는 TS 가 푼다 — 그 「푼다」가 `writeEdges` 이고 이 함수가 그 입력이다.
 */
function seedImport(path: string, spec: string, form: string, matchId: number): void {
  const text = `'${spec}'`;
  db.prepare(statements['facts.capture_insert']).run(toSqliteBindings({
    repoId: 1, path, queryId: '_imports', matchId, patternIndex: 0,
    name: 'import.source', form, nodeKind: 'string', inError: false,
    startByte: 0, endByte: text.length, startLine: 1, endLine: 1,
    startCol: 0, endCol: text.length, excerpt: text,
  }));
}

/** `res.user?.profile` 한 줄이 든 파일 하나를 사실 층에 심는다. */
function seedFile(id: number, path: string, line: string): void {
  db.prepare(statements['facts.file_upsert']).run(toSqliteBindings({
    repoId: 1, path, lang: null, grammar: 'typescript', lineCount: 1, byteSize: line.length,
    contentHash: `hash-${id}`, headOid: `hash-${id}`, isDirty: false, parseQuality: 'ok',
    skipReason: null, updatedAt: T,
  }));
  const at = line.indexOf('res.user?.profile');
  const caps = [
    { name: 'site', form: 'member', start: at, end: at + 17, kind: 'member_expression' },
    { name: 'pick.1', form: 'member', start: at, end: at + 8, kind: 'member_expression' },
    { name: 'pick.2', form: 'member', start: at + 8, end: at + 10, kind: 'optional_chain' },
    { name: 'pick.3', form: 'member', start: at + 10, end: at + 17, kind: 'property_identifier' },
  ];
  for (const cap of caps) {
    db.prepare(statements['facts.capture_insert']).run(toSqliteBindings({
      repoId: 1, path, queryId: 'ts/optional-chaining', matchId: 1, patternIndex: 0,
      name: cap.name, form: cap.form, nodeKind: cap.kind, inError: false,
      startByte: cap.start, endByte: cap.end, startLine: 1, endLine: 1,
      startCol: cap.start, endCol: cap.end, excerpt: line.slice(cap.start, cap.end),
    }));
  }
}

beforeEach(() => {
  const init = migrations.find((m) => m.version === 1);
  if (!init) throw new Error('0001_init.sql 이 카탈로그에 없다');
  db = new Database(':memory:');
  db.exec(init.sql);
  db.pragma('foreign_keys = ON');
  db.prepare(statements['repo.insert']).run(toSqliteBindings({
    rootPath: '/fixture', name: 'fixture', defaultBranch: null, headSha: null,
    primaryLang: null, fingerprint: '', addedAt: T,
  }));
});

const options = {
  repoId: 1, rootPath: '/fixture', mode: 'full' as const, sinceHead: null, now: T,
};

describe('사전 물질화', () => {
  test('개념과 선행이 행으로 남는다 — 사용처의 외래키가 여기 걸린다', async () => {
    await materializeDict(dict, T);
    const n = db.prepare('SELECT COUNT(*) AS n FROM concept').get() as { n: number };
    expect(n.n).toBe(dict.concepts.size);
    const edges = db.prepare('SELECT COUNT(*) AS n FROM concept_prereq').get() as { n: number };
    expect(edges.n).toBeGreaterThan(0);
  });

  test('두 번 돌려도 같은 수다', async () => {
    await materializeDict(dict, T);
    await materializeDict(dict, T + 1);
    const n = db.prepare('SELECT COUNT(*) AS n FROM concept').get() as { n: number };
    expect(n.n).toBe(dict.concepts.size);
  });

  test('보편 개념은 universal_id 로 이어진다 — 개념 전이가 여기서 나온다', async () => {
    await materializeDict(dict, T);
    const row = db.prepare("SELECT universal_id FROM concept WHERE id = 'ts/optional-chaining'")
      .get() as { universal_id: string | null };
    expect(row.universal_id).toBe('common/optional-chaining');
  });
});

describe('파생 한 바퀴', () => {
  beforeEach(async () => {
    await materializeDict(dict, T);
    seedFile(1, 'src/features/cart/useCart.ts', "const nick = res.user?.profile\n");
    seedFile(2, 'src/features/cart/api.ts', "const a = res.user?.profile\n");
    seedFile(3, 'src/features/cart/view.ts', "const b = res.user?.profile\n");
  });

  test('캡처가 사용처가 된다', async () => {
    const out = await deriveRepo(dict, options);
    expect(out.sites).toBe(3);
    const row = db.prepare('SELECT * FROM concept_site').get() as Record<string, unknown>;
    expect(row.concept_id).toBe('ts/optional-chaining');
    expect(row.shape).toBe('_._?._');
    expect(JSON.parse(row.picks_json as string)).toEqual({ 1: 'res.user', 2: '?.', 3: 'profile' });
  });

  test('다시 돌려도 사용처가 늘지 않는다 — site_key 가 같기 때문이다', async () => {
    await deriveRepo(dict, options);
    await deriveRepo(dict, { ...options, now: T + 1 });
    const n = db.prepare('SELECT COUNT(*) AS n FROM concept_site').get() as { n: number };
    expect(n.n).toBe(3);
  });

  test('캡처가 사라지면 사용처는 죽되 남는다', async () => {
    await deriveRepo(dict, options);
    db.prepare('DELETE FROM capture').run();
    await deriveRepo(dict, { ...options, now: T + 1 });
    const rows = db.prepare('SELECT is_alive FROM concept_site').all() as { is_alive: number }[];
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.is_alive === 0)).toBe(true);
  });

  test('import 지정자가 지도 엣지가 된다 — 확장자를 붙여 파일 집합에서 찾는다', async () => {
    seedImport('src/features/cart/useCart.ts', './api', 'static', 10);
    seedImport('src/features/cart/view.ts', './useCart', 'static', 11);
    // bare 지정자는 external 이라 엣지가 없다 (04 §7.1).
    seedImport('src/features/cart/view.ts', 'react', 'static', 12);
    const out = await deriveRepo(dict, options);

    expect(out.edges).toBe(2);
    const rows = db.prepare(
      `SELECT a.path AS from_path, b.path AS to_path, e.kind
         FROM import_edge e
         JOIN file a ON a.id = e.from_file_id
         JOIN file b ON b.id = e.to_file_id
        ORDER BY a.path`,
    ).all() as { from_path: string; to_path: string; kind: string }[];
    expect(rows).toEqual([
      { from_path: 'src/features/cart/useCart.ts', to_path: 'src/features/cart/api.ts', kind: 'static' },
      { from_path: 'src/features/cart/view.ts', to_path: 'src/features/cart/useCart.ts', kind: 'static' },
    ]);
  });

  test('다시 돌려도 엣지가 늘지 않는다 — 파일마다 지우고 다시 넣는다', async () => {
    seedImport('src/features/cart/useCart.ts', './api', 'static', 10);
    await deriveRepo(dict, options);
    await deriveRepo(dict, { ...options, now: T + 1 });
    const n = db.prepare('SELECT COUNT(*) AS n FROM import_edge').get() as { n: number };
    expect(n.n).toBe(1);
  });

  test('지정자가 사라지면 엣지도 사라진다', async () => {
    seedImport('src/features/cart/useCart.ts', './api', 'static', 10);
    await deriveRepo(dict, options);
    db.prepare("DELETE FROM capture WHERE query_id = '_imports'").run();
    await deriveRepo(dict, { ...options, now: T + 1 });
    const n = db.prepare('SELECT COUNT(*) AS n FROM import_edge').get() as { n: number };
    expect(n.n).toBe(0);
  });

  test('대지가 잡히고 파일이 붙는다', async () => {
    const out = await deriveRepo(dict, options);
    expect(out.units).toBeGreaterThan(0);
    const unit = db.prepare("SELECT * FROM unit WHERE name = 'cart'").get() as { id: number };
    expect(unit).toBeDefined();
    const files = db.prepare('SELECT COUNT(*) AS n FROM unit_file WHERE unit_id = ?')
      .get(unit.id) as { n: number };
    expect(files.n).toBe(3);
  });

  test('구멍 지도가 생긴다 — 내 코드엔 있는데 겹이 0인 개념', async () => {
    await deriveRepo(dict, options);
    const row = db.prepare("SELECT * FROM gap WHERE concept_id = 'ts/optional-chaining'")
      .get() as { site_count: number; best_site_id: number | null };
    expect(row.site_count).toBe(3);
    expect(row.best_site_id).not.toBeNull();
  });

  test('스티커가 대지에 붙는다', async () => {
    await deriveRepo(dict, options);
    const n = await writeUnitNodes(1);
    expect(n).toBeGreaterThan(0);
    const node = db.prepare('SELECT * FROM unit_node').get() as { concept_id: string; track: string };
    expect(node.concept_id).toBe('ts/optional-chaining');
    expect(node.track).toBe('t0');
  });

  test('미지 개념 수가 채워진다', async () => {
    await deriveRepo(dict, options);
    const before = db.prepare('SELECT unknown_count FROM concept_site LIMIT 1')
      .get() as { unknown_count: number };
    expect(before.unknown_count).toBe(0);
    await recountUnknown(dict, 1, []);
    const after = db.prepare('SELECT unknown_count FROM concept_site LIMIT 1')
      .get() as { unknown_count: number };
    expect(after.unknown_count).toBeGreaterThan(0);
  });

  test('아는 개념이 늘면 미지 개수가 준다', async () => {
    await deriveRepo(dict, options);
    await recountUnknown(dict, 1, []);
    const before = (db.prepare('SELECT unknown_count FROM concept_site LIMIT 1')
      .get() as { unknown_count: number }).unknown_count;
    const known = [...dict.concepts.keys()].map((conceptId) => ({
      conceptId, layer: 4, universalId: null,
    }));
    await recountUnknown(dict, 1, known);
    const after = (db.prepare('SELECT unknown_count FROM concept_site LIMIT 1')
      .get() as { unknown_count: number }).unknown_count;
    expect(after).toBeLessThan(before);
  });
});

describe('홈 쿼리가 파생 결과를 읽는다', () => {
  beforeEach(async () => {
    await materializeDict(dict, T);
    seedFile(1, 'src/features/cart/useCart.ts', "const nick = res.user?.profile\n");
    seedFile(2, 'src/features/cart/api.ts', "const a = res.user?.profile\n");
    seedFile(3, 'src/features/cart/view.ts', "const b = res.user?.profile\n");
    await deriveRepo(dict, options);
    await writeUnitNodes(1);
  });

  test('마스트헤드가 개념 수를 센다', () => {
    const [row] = run('home.bundle_counts', { repoId: 1 }) as { concepts: number }[];
    expect(row?.concepts).toBe(1);
  });

  test('잉크 겹 척도가 0겹에 몰린다 — 아직 아무것도 안 찍었다', () => {
    const rows = run('home.layer_scale', { repoId: 1 }) as { layer: number; n: number }[];
    expect(rows).toEqual([{ layer: 0, n: 1 }]);
  });

  test('대지 쿼리가 시트와 스티커를 함께 낸다', () => {
    const rows = run('home.units', { repoId: 1 }) as { name: string; concept_id: string }[];
    expect(rows[0]?.name).toBe('cart');
    expect(rows[0]?.concept_id).toBe('ts/optional-chaining');
  });

  test('「판이 없는 문법」 패널이 등장 횟수를 낸다', () => {
    const rows = run('gaps.list', { repoId: 1, limit: 5 }) as
      { concept_id: string; site_count: number; name_ko: string }[];
    expect(rows[0]?.concept_id).toBe('ts/optional-chaining');
    expect(rows[0]?.site_count).toBe(3);
    expect(rows[0]?.name_ko).toBe('옵셔널 체이닝');
  });

  test('사용처 목록이 파일과 줄을 준다', () => {
    const rows = run('concept.uses', { repoId: 1, conceptId: 'ts/optional-chaining', limit: 3 }) as
      { path: string; line_start: number }[];
    expect(rows).toHaveLength(3);
    expect(rows[0]?.line_start).toBe(1);
  });

  test('선행 개념 목록이 겹과 카드 유무를 함께 준다', () => {
    const rows = run('concept.prereqs', { repoId: 1, conceptId: 'ts/optional-chaining' }) as
      { prereq_id: string; layer: number; has_card: number }[];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]?.layer).toBe(0);
    expect(rows[0]?.has_card).toBe(0);
  });

  test('파일 수와 마지막 실행을 읽는다', () => {
    const files = run('home.file_count', { repoId: 1 }) as { n: number }[];
    expect(files[0]?.n).toBe(3);
    expect(run('home.last_run', { repoId: 1 })).toEqual([]);
  });
});

describe('증분 재파생', () => {
  beforeEach(async () => {
    await materializeDict(dict, T);
    seedFile(1, 'src/features/cart/useCart.ts', "const nick = res.user?.profile\n");
    seedFile(2, 'src/features/cart/api.ts', "const a = res.user?.profile\n");
    seedFile(3, 'src/features/cart/view.ts', "const b = res.user?.profile\n");
    await deriveRepo(dict, options);
  });

  test('아무것도 안 바뀌었으면 아무것도 다시 파생하지 않는다', async () => {
    const out = await deriveRepo(dict, { ...options, mode: 'incremental', now: T + 1_000 });
    expect(out.sites).toBe(0);
    // 그래도 사용처는 살아 있다 — 손대지 않았을 뿐이다.
    const n = db.prepare('SELECT COUNT(*) AS n FROM concept_site WHERE is_alive = 1')
      .get() as { n: number };
    expect(n.n).toBe(3);
  });

  test('바뀐 파일 하나만 다시 파생한다', async () => {
    const later = T + 1_000;
    // Rust 가 바뀐 파일 하나를 다시 쓴 것과 같은 상태로 만든다.
    db.prepare('UPDATE file SET updated_at = ? WHERE path = ?')
      .run(later, 'src/features/cart/api.ts');
    const out = await deriveRepo(dict, { ...options, mode: 'incremental', now: later });
    expect(out.sites).toBe(1);
  });

  test('증분이어도 구멍 지도의 분모는 리포 전체다', async () => {
    const later = T + 1_000;
    db.prepare('UPDATE file SET updated_at = ? WHERE path = ?')
      .run(later, 'src/features/cart/api.ts');
    await deriveRepo(dict, { ...options, mode: 'incremental', now: later });
    const row = db.prepare("SELECT site_count FROM gap WHERE concept_id = 'ts/optional-chaining'")
      .get() as { site_count: number };
    expect(row.site_count).toBe(3);
  });
});
