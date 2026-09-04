/**
 * 내보내기 · 전부 지우기 · 재인제스트 판별 (06 §6.3 · §6.4).
 *
 * 조회는 **진짜 SQLite** 위에서 돈다 — 카탈로그의 statement 이름과 파라미터가 실제로 맞물리는지가
 * 여기서 걸린다. 파일 쓰기(`app_write_json`)와 키체인만 모의한다: 둘 다 Rust 명령이고 이 층이
 * 확인할 것은 「무엇을 어떤 이름으로 넘겼나」다 (D109).
 */
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

import { migrations, statements, toSqliteBindings } from '@chickadee/store-sql';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type BetterSqlite3 from 'better-sqlite3';

const require_ = createRequire(import.meta.url);
type SqliteDb = BetterSqlite3.Database;
const Database = require_('better-sqlite3') as new (path: string) => SqliteDb;

const T = 1_767_225_600_000; // 2026-01-01T00:00:00Z 고정
const TZ = 'Asia/Seoul';

let db: SqliteDb;
/** `app_write_json` 으로 나간 것. 파일 시스템에는 아무것도 쓰지 않는다. */
let written: { box: string; name: string; json: string }[] = [];
let revealed: string[] = [];
let wiped = 0;
let deletedAccounts: string[] = [];

function run(name: string, params: unknown): unknown[] {
  const sql = (statements as Record<string, string>)[name];
  if (sql === undefined) throw new Error(`카탈로그에 없는 이름: ${name}`);
  const stmt = db.prepare(sql);
  const bound = toSqliteBindings((params ?? {}) as Record<string, unknown>);
  if (stmt.reader) return stmt.all(bound) as unknown[];
  const info = stmt.run(bound);
  return [{ changes: info.changes, lastId: Number(info.lastInsertRowid) }];
}

vi.mock('@chickadee/ipc-client', () => ({
  ipc: {
    store: {
      query: (name: string, params: unknown) => Promise.resolve(run(name, params)),
      exec: (name: string, params: unknown) => Promise.resolve(run(name, params)[0]),
      info: () => Promise.resolve({ userVersion: 1, path: '', sizeBytes: 4096, wal: true }),
    },
    app: {
      version: () => Promise.resolve({ app: '0.1.0', tauri: '2.9.0', sqlite: '3.46.0', rustc: '1.81.0' }),
      writeJson: (box: string, name: string, json: string) => {
        written.push({ box, name, json });
        return Promise.resolve('/data/dev.chickadee.app/exports');
      },
      reveal: (which: string) => {
        revealed.push(which);
        return Promise.resolve();
      },
      wipe: () => {
        wiped += 1;
        return Promise.resolve();
      },
    },
    parse: {
      // 06 §6.3 의 첫째 값. 파서가 아는 것이지 사전이 아는 것이 아니다.
      langs: () => Promise.resolve([
        { grammar: 'typescript', grammarVersion: '0.23.2', abi: 14 },
        { grammar: 'tsx', grammarVersion: '0.23.2', abi: 14 },
      ]),
    },
    secret: {
      delete: (account: string) => {
        deletedAccounts.push(account);
        return Promise.resolve();
      },
    },
  },
  log: { info: () => undefined, warn: () => undefined, error: () => undefined },
}));

const {
  LLM_ACCOUNT, buildExport, currentBuild, exportFileName, exportRecords, ingestFingerprint,
  needsReingest, stampRun, wipeAll,
} = await import('./maintenance.js');
const { loadDict } = await import('@chickadee/dictionary');

// ───────── 픽스처 ─────────

/** 원장 한 줄이 서려면 개념·카드·세션·판·파라미터가 모두 있어야 한다 (02 §2 의 FK). */
function seed(): void {
  const init = migrations.find((m) => m.version === 1);
  if (!init) throw new Error('0001_init.sql 이 카탈로그에 없다');
  db = new Database(':memory:');
  db.exec(init.sql);
  db.pragma('foreign_keys = ON');

  db.exec(`
    INSERT INTO repo (id, root_path, name, fingerprint, added_at, last_ingest_at)
      VALUES (1, '/Users/me/work/cart-shop', 'cart-shop', 'root1', ${T}, ${T + 1000});
    INSERT INTO dictionary_version (id, lang, version, sha256, concept_count, loaded_at)
      VALUES (1, 'ts', '1.0.0', 'deadbeef', 1, ${T});
    INSERT INTO concept (id, lang, name_ko, kind, track_default, dict_version_id)
      VALUES ('ts/optional-chaining', 'ts', '옵셔널 체이닝', 'lang', 't0', 1);
    INSERT INTO card (id, repo_id, track, kind, concept_id, payload_json, content_hash, created_at)
      VALUES (1, 1, 't1', 'transcribe', 'ts/optional-chaining', '{}', 'h1', ${T});
    INSERT INTO scheduler_params (id, created_at, params_json, source, is_active)
      VALUES (1, ${T}, '[]', 'default', 1);
    INSERT INTO mastery (concept_id, state, stability, difficulty, due_at, last_review_at,
                         reps, lapses, layer, dunno_total, applied_log_id, updated_at)
      VALUES ('ts/optional-chaining', 2, 4.5, 5.1, ${T + 86400000}, ${T}, 3, 1, 2, 1, 1, ${T});
    INSERT INTO session (id, repo_id, day_key, started_at, budget_min, planned_min, elapsed_s,
                         status, plan_json)
      VALUES (1, 1, '2026-01-01', ${T}, 15, 14, 600, 'done', '[]');
    INSERT INTO session_item (id, session_id, pos, card_id, concept_id, track, role, est_min,
                              status, state_json, created_at)
      VALUES (1, 1, 0, 1, 'ts/optional-chaining', 't1', 'new', 9, 'done',
              '{"t1Draft":"const nick = res.user?.profile"}', ${T});
  `);

  for (const [id, ok, dunno] of [[1, 1, 0], [2, 0, 1]] as const) {
    db.prepare(`
      INSERT INTO review_log (id, session_id, session_item_id, card_id, concept_id, track, role,
        reviewed_at, day_key, grade, ok, dunno, early, elapsed_days, scheduled_days,
        layer_before, layer_after, s_after, d_after, due_after, params_id, duration_ms, detail_json)
      VALUES (?, 1, 1, 1, 'ts/optional-chaining', 't1', 'new', ${T}, '2026-01-01', 3, ?, ?, 0, 0, 0,
              1, 2, 4.5, 5.1, ${T + 86400000}, 1, 9000,
              '{"track":"t1","whyText":"내가 쓴 글"}')
    `).run(id, ok, dunno);
  }

  run('settings.set', { key: 'tz', valueJson: JSON.stringify(TZ), updatedAt: T });
  for (const [kind, msValue] of [['queue', 12], ['queue', 30], ['t1.grade', 8]] as const) {
    run('perf.insert', { kind, ms: msValue, n: 1, at: T });
  }
}

beforeEach(() => {
  written = [];
  revealed = [];
  deletedAccounts = [];
  wiped = 0;
  seed();
});

// ───────── 재인제스트 판별 (06 §6.3) ─────────

describe('재인제스트 판별', () => {
  const BUILD = {
    grammarVersionsJson: '{"typescript":"0.21.0"}',
    queryHash: 'abc123',
    genVersion: 1,
    dictSchema: 1,
  };

  test('지문은 네 값의 sha256 이다', async () => {
    // 값 사이에 NUL — 자리를 흐리지 않기 위한 구분자다. `node:crypto` 로 따로 계산해 대조한다.
    const joined = ['{"typescript":"0.21.0"}', 'abc123', '1', '1'].join('\u0000');
    const expected = createHash('sha256').update(joined, 'utf8').digest('hex');
    expect(await ingestFingerprint(BUILD)).toBe(expected);
    expect(expected).toMatch(/^[0-9a-f]{64}$/);
  });

  test('네 값 중 하나만 달라져도 지문이 달라진다', async () => {
    const base = await ingestFingerprint(BUILD);
    for (const patch of [
      { grammarVersionsJson: '{"typescript":"0.22.0"}' },
      { queryHash: 'abc124' },
      { genVersion: 2 },
      { dictSchema: 2 },
    ]) {
      expect(await ingestFingerprint({ ...BUILD, ...patch })).not.toBe(base);
    }
  });

  test('이어 붙이기가 자리를 흐리지 않는다', async () => {
    const a = await ingestFingerprint({ ...BUILD, grammarVersionsJson: 'ab', queryHash: 'c' });
    const b = await ingestFingerprint({ ...BUILD, grammarVersionsJson: 'a', queryHash: 'bc' });
    expect(a).not.toBe(b);
  });

  test('같으면 배너가 없고 다르면 있다', () => {
    expect(needsReingest('aaa', 'aaa')).toBe(false);
    expect(needsReingest('aaa', 'bbb')).toBe(true);
  });

  test('지문이 없는 마지막 인제스트는 배너를 내지 않는다 — 모르는 것을 「바뀌었다」로 말하지 않는다', () => {
    expect(needsReingest(null, 'aaa')).toBe(false);
    expect(needsReingest(undefined, 'aaa')).toBe(false);
    expect(needsReingest('', 'aaa')).toBe(false);
  });
});

// ───────── 내보내기 (06 §6.4) ─────────

describe('내보내기', () => {
  test('파일 이름은 chickadee-export-<YYYY-MM-DD>.json 이고 하루 경계를 적용하지 않는다', () => {
    // 2026-01-01T09:00+09:00 — 04:00 경계였다면 같은 날, 03:00 이면 전날이 됐을 자리다.
    const at = Date.UTC(2026, 0, 1, 0, 0);
    expect(exportFileName(at, TZ)).toBe('chickadee-export-2026-01-01.json');
    expect(exportFileName(Date.UTC(2025, 11, 31, 18, 30), TZ)).toBe('chickadee-export-2026-01-01.json');
  });

  test('이름이 app_write_json 의 문자 규칙을 통과한다 (D109)', () => {
    expect(exportFileName(T, TZ)).toMatch(/^[A-Za-z0-9._-]+$/);
  });

  test('기본은 카드 발췌·필사 초안을 담지 않는다', async () => {
    const out = await exportRecords({ cardExcerpts: false, t1Drafts: false }, T);
    expect(out.name).toBe('chickadee-export-2026-01-01.json');
    expect(out.dir).toBe('/data/dev.chickadee.app/exports');
    expect(written).toHaveLength(1);
    expect(written[0]?.box).toBe('exports');

    const bundle = JSON.parse(written[0]?.json ?? '{}');
    expect(bundle.kind).toBe('chickadee-export');
    expect(bundle.schemaVersion).toBe(1);
    expect(bundle.appVersion).toBe('0.1.0');
    expect(bundle.included).toEqual({ cardExcerpts: false, t1Drafts: false });
    expect(bundle.cardExcerpts).toBeUndefined();
    expect(bundle.t1Drafts).toBeUndefined();
  });

  test('스키마 번호·개념 숙련도·세션 요약·설정을 담는다 (06 §6.4)', async () => {
    await exportRecords({ cardExcerpts: false, t1Drafts: false }, T);
    const bundle = JSON.parse(written[0]?.json ?? '{}');

    expect(bundle.settings.tz).toBe(TZ);
    expect(bundle.settings.budgetMin).toBe(15);
    expect(bundle.concepts).toEqual([{
      conceptId: 'ts/optional-chaining', layer: 2, state: 2, stability: 4.5, difficulty: 5.1,
      dueAt: T + 86_400_000, lastReviewAt: T, reps: 3, lapses: 1, dunnoTotal: 1,
    }]);
    // 판 2개 = 원장 2줄. 맞은 것 1, 모르겠어요 1, 9초씩.
    expect(bundle.sessions).toEqual([
      { sessionId: 1, dayKey: '2026-01-01', plates: 2, ok: 1, dunno: 1, durationMs: 18_000 },
    ]);
    expect(bundle.days).toEqual([{ repoId: 1, dayKey: '2026-01-01', mins: 10 }]);
  });

  test('절대 경로가 파일에 실리지 않는다 (01 §6)', async () => {
    await exportRecords({ cardExcerpts: true, t1Drafts: true }, T);
    const json = written[0]?.json ?? '';
    expect(json).not.toContain('/Users/me/work/cart-shop');
    expect(json).not.toContain('rootPath');
    // 리포는 이름만 남는다.
    expect(JSON.parse(json).repos).toEqual([
      { id: 1, name: 'cart-shop', addedAt: T, lastIngestAt: T + 1000 },
    ]);
  });

  test('체크박스를 켜면 필사 초안이 담긴다', async () => {
    await exportRecords({ cardExcerpts: false, t1Drafts: true }, T);
    const bundle = JSON.parse(written[0]?.json ?? '{}');
    expect(bundle.included.t1Drafts).toBe(true);
    expect(bundle.t1Drafts).toEqual([
      { sessionId: 1, pos: 0, conceptId: 'ts/optional-chaining', draft: 'const nick = res.user?.profile' },
    ]);
    expect(bundle.cardExcerpts).toBeUndefined();
  });

  test('경로를 고르지 않고 exports 자리에만 쓴다 (D109)', async () => {
    await exportRecords({ cardExcerpts: false, t1Drafts: false }, T);
    expect(written[0]?.box).toBe('exports');
    // 폴더를 여는 것은 화면의 몫이다 — 이 층은 만들고 어디에 만들었는지만 돌려준다.
    expect(revealed).toEqual([]);
  });

  test('buildExport 는 순수하다 — 같은 입력에 같은 출력', () => {
    const input = {
      schemaVersion: 1, appVersion: '0.1.0', exportedAt: T,
      settings: { budgetMin: 15, tz: TZ, rolloverHour: 4, desiredRetention: 0.9, newPerDay: 2,
        t1PerWeek: 2, newcomerFlag: 'none' as const, theme: 'light' as const, trim: 'off' as const,
        motion: 'system' as const, identities: [], excludeGlobs: [], locale: 'ko' as const, dictLangs: [] },
      repos: [], mastery: [],
      logs: [
        { session_id: 2, day_key: '2026-01-02', ok: 1, dunno: 0, duration_ms: 100 },
        { session_id: 1, day_key: '2026-01-01', ok: 0, dunno: 1, duration_ms: 200 },
        { session_id: 2, day_key: '2026-01-02', ok: 1, dunno: 0, duration_ms: 300 },
      ],
      days: [], cardExcerpts: [], t1Drafts: [],
    };
    const once = buildExport(input, { cardExcerpts: false, t1Drafts: false });
    expect(buildExport(input, { cardExcerpts: false, t1Drafts: false })).toEqual(once);
    // 세션은 번호 순으로 정렬된다 — 원장이 어떤 순서로 와도 파일은 같다.
    expect(once.sessions.map((s) => s.sessionId)).toEqual([1, 2]);
    expect(once.sessions[1]).toEqual({
      sessionId: 2, dayKey: '2026-01-02', plates: 2, ok: 2, dunno: 0, durationMs: 400,
    });
  });
});

// ───────── 전부 지우기 (06 §6.4 · E8) ─────────

describe('전부 지우기', () => {
  test('파일을 먼저 지우고 키체인 항목을 지운다', async () => {
    await wipeAll();
    expect(wiped).toBe(1);
    expect(deletedAccounts).toEqual([LLM_ACCOUNT]);
  });

  test('키체인 계정 이름은 상수 하나다 — LLM 키 패널과 같은 값이어야 지워진다', () => {
    expect(LLM_ACCOUNT).toBe('llm');
  });
});

// ───────── 지문을 실제로 적는다 (06 §6.3) ─────────

describe('인제스트 지문', () => {
  beforeEach(() => {
    seed();
    db.exec(`
      INSERT INTO ingest_run (id, repo_id, mode, status, started_at, finished_at,
                              files_n, sites_n, captures_n, commits_n, warnings_n)
        VALUES (7, 1, 'full', 'done', ${T}, ${T + 100}, 3, 0, 12, 0, 0);
    `);
  });

  test('마지막 실행 한 줄에 다섯 값과 지문이 적힌다', async () => {
    const dict = loadDict();
    const written_ = await stampRun(1, dict, 42);

    const row = db.prepare(
      `SELECT sites_n, grammar_versions_json, query_hash, dict_version, dict_schema,
              gen_version, fingerprint FROM ingest_run WHERE id = 7`,
    ).get() as Record<string, unknown>;

    expect(row['sites_n']).toBe(42);
    expect(row['fingerprint']).toBe(written_);
    // 06 §6.3 의 네 값이 모두 채워져야 지문이 뜻을 갖는다 — 하나라도 null 이면
    // 그 축의 변화를 영원히 못 본다.
    for (const key of ['grammar_versions_json', 'query_hash', 'dict_version', 'dict_schema',
      'gen_version']) {
      expect(row[key], key).not.toBeNull();
    }
    expect(JSON.parse(row['grammar_versions_json'] as string)).toHaveProperty('typescript');
  });

  test('같은 빌드는 같은 지문이고, 값 하나가 바뀌면 달라진다', async () => {
    const build = await currentBuild(loadDict());
    expect(await ingestFingerprint(build)).toBe(await ingestFingerprint(build));
    expect(await ingestFingerprint({ ...build, genVersion: build.genVersion + 1 }))
      .not.toBe(await ingestFingerprint(build));
  });

  test('홈이 그 지문으로 배너를 켠다', async () => {
    const stored = await stampRun(1, loadDict(), 1);
    expect(needsReingest(stored, stored)).toBe(false);
    expect(needsReingest(stored, `${stored}x`)).toBe(true);
  });
});
