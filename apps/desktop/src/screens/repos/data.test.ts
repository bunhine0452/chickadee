/**
 * `repo.overview` 를 **진짜 SQLite** 위에서 돌린다 (D119).
 *
 * 여기서 확인하는 것은 넷이다: ① 리포가 0개면 행도 0개 ② 아직 안 읽은 리포도 빠지지 않고
 * 숫자 칸이 0·NULL 로 온다 ③ 같은 개념이 대지 둘에 놓여도 한 번만 센다 ④ 오늘 이미 맞힌
 * 개념은 만기에서 빠진다.
 *
 * 리포마다 한 번씩 묻지 않는다는 것이 이 statement 의 존재 이유라, 리포 셋을 넣고 **한 번**
 * 불러 셋이 다 오는지를 본다.
 */
import { createRequire } from 'node:module';

import { migrations, statements, toSqliteBindings } from '@chickadee/store-sql';
import { beforeEach, describe, expect, it } from 'vitest';

import type BetterSqlite3 from 'better-sqlite3';

const require_ = createRequire(import.meta.url);
type SqliteDb = BetterSqlite3.Database;
const Database = require_('better-sqlite3') as new (path: string) => SqliteDb;

const DAY = '2026-09-04';
/** 하루 경계(다음날 04:00) 자리. 만기 비교의 기준이다. */
const EOD = Date.UTC(2026, 8, 5, 4);

interface Row {
  id: number;
  name: string;
  detached_at: number | null;
  last_ingest_at: number | null;
  concepts: number;
  avg_layer: number | null;
  due_n: number;
}

let db: SqliteDb;

function overview(): Row[] {
  const sql = (statements as Record<string, string>)['repo.overview'];
  if (sql === undefined) throw new Error('카탈로그에 repo.overview 가 없다');
  return db.prepare(sql).all(toSqliteBindings({ eod: EOD, day: DAY })) as Row[];
}

function addRepo(id: number, name: string, lastIngestAt: number | null, detachedAt: number | null): void {
  db.prepare(
    `INSERT INTO repo (id, root_path, name, added_at, last_ingest_at, detached_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, `/w/${name}`, name, id, lastIngestAt, detachedAt);
}

function addConcept(id: string): void {
  db.prepare(
    `INSERT INTO concept (id, lang, name_ko, kind, track_default, dict_version_id)
     VALUES (?, 'ts', ?, 'lang', 't0', 1)`,
  ).run(id, id);
}

/** 대지 하나에 개념 하나를 올린다. 같은 개념을 대지 둘에 올려도 `concepts` 는 1이어야 한다. */
function place(repoId: number, unit: string, conceptId: string): void {
  db.prepare(
    `INSERT OR IGNORE INTO unit (repo_id, name, source) VALUES (?, ?, 'dir')`,
  ).run(repoId, unit);
  const row = db.prepare('SELECT id FROM unit WHERE repo_id = ? AND name = ?')
    .get(repoId, unit) as { id: number };
  db.prepare(
    `INSERT INTO unit_node (unit_id, concept_id, track) VALUES (?, ?, 't0')`,
  ).run(row.id, conceptId);
}

function master(conceptId: string, layer: number, dueAt: number | null): void {
  db.prepare(
    `INSERT INTO mastery (concept_id, state, layer, due_at, updated_at)
     VALUES (?, 2, ?, ?, 0)`,
  ).run(conceptId, layer, dueAt);
}

function addCard(id: number, repoId: number, conceptId: string): void {
  db.prepare(
    `INSERT INTO card (id, repo_id, track, kind, concept_id, payload_json, content_hash, created_at)
     VALUES (?, ?, 't0', 'meaning', ?, '{}', ?, 0)`,
  ).run(id, repoId, conceptId, `h${id}`);
}

/**
 * 오늘 맞힌 기록 한 줄. 원장은 세션과 자리에 매여 있어(`session_id`·`session_item_id` 가
 * NOT NULL) 부모 행을 먼저 세운다. 값은 대부분 자리 채우기고 보는 것은 `day_key`·`ok` 뿐이다.
 */
function reviewedOk(repoId: number, cardId: number, conceptId: string): void {
  db.prepare(
    `INSERT OR IGNORE INTO session (id, repo_id, day_key, started_at, budget_min, planned_min,
       status, plan_json) VALUES (1, ?, ?, 0, 15, 15, 'done', '[]')`,
  ).run(repoId, DAY);
  db.prepare(
    `INSERT OR IGNORE INTO session_item (id, session_id, pos, card_id, concept_id, track, role,
       est_min, created_at) VALUES (1, 1, 0, ?, ?, 't0', 'review', 1, 0)`,
  ).run(cardId, conceptId);
  db.prepare(
    `INSERT OR IGNORE INTO scheduler_params (id, created_at, params_json, source)
     VALUES (1, 0, '[]', 'default')`,
  ).run();
  db.prepare(
    `INSERT INTO review_log (session_id, session_item_id, card_id, concept_id, track, role,
       reviewed_at, day_key, grade, ok, elapsed_days, scheduled_days,
       layer_before, layer_after, s_after, d_after, due_after, params_id, duration_ms, detail_json)
     VALUES (1, 1, ?, ?, 't0', 'review', 0, ?, 3, 1, 0, 0, 1, 2, 1.0, 5.0, 0, 1, 0, '{}')`,
  ).run(cardId, conceptId, DAY);
}

beforeEach(() => {
  db = new Database(':memory:');
  const init = migrations.find((m) => m.version === 1);
  if (!init) throw new Error('0001_init.sql 이 카탈로그에 없다');
  db.exec(init.sql);
  // `concept.dict_version_id` 가 가리킬 곳. 사전 자체는 이 statement 와 상관없다.
  db.prepare(
    `INSERT INTO dictionary_version (id, lang, version, sha256, concept_count, loaded_at)
     VALUES (1, 'ts', '1', 'x', 0, 0)`,
  ).run();
});

describe('repo.overview', () => {
  it('리포가 0개면 행도 0개다', () => {
    expect(overview()).toEqual([]);
  });

  it('아직 안 읽은 리포도 빠지지 않는다 — 숫자 칸이 0 · NULL 이다', () => {
    addRepo(1, 'fresh', null, null);
    const [row] = overview();
    expect(row).toMatchObject({
      id: 1, name: 'fresh', last_ingest_at: null, detached_at: null,
      concepts: 0, avg_layer: null, due_n: 0,
    });
  });

  it('리포 셋을 한 번에 준다 — 등록 순서대로', () => {
    addRepo(1, 'alpha', 100, null);
    addRepo(2, 'beta', null, 500);
    addRepo(3, 'gamma', 300, null);
    expect(overview().map((r) => r.name)).toEqual(['alpha', 'beta', 'gamma']);
    expect(overview().map((r) => r.detached_at)).toEqual([null, 500, null]);
  });

  it('같은 개념이 대지 둘에 놓여도 한 번만 센다', () => {
    addRepo(1, 'alpha', 100, null);
    addConcept('ts/a');
    addConcept('ts/b');
    place(1, 'src', 'ts/a');
    place(1, 'lib', 'ts/a');
    place(1, 'lib', 'ts/b');
    master('ts/a', 4, null);
    // ts/b 는 mastery 행이 없다 — 겹 0 으로 세야 평균이 「아직 안 찍은 개념」을 반영한다.
    const [row] = overview();
    expect(row?.concepts).toBe(2);
    expect(row?.avg_layer).toBe(2);
  });

  it('만기는 리포별로 갈리고, 오늘 이미 맞힌 개념은 빠진다', () => {
    addRepo(1, 'alpha', 100, null);
    addRepo(2, 'beta', 100, null);
    for (const id of ['ts/a', 'ts/b', 'ts/c']) addConcept(id);
    master('ts/a', 1, EOD - 1);
    master('ts/b', 1, EOD - 1);
    master('ts/c', 1, EOD + 1);      // 경계 밖 — 오늘 만기가 아니다
    addCard(10, 1, 'ts/a');
    addCard(11, 1, 'ts/b');
    addCard(12, 1, 'ts/c');
    addCard(20, 2, 'ts/a');
    reviewedOk(1, 11, 'ts/b');       // 오늘 이미 맞혔다

    const byName = Object.fromEntries(overview().map((r) => [r.name, r.due_n]));
    expect(byName).toEqual({ alpha: 1, beta: 1 });
  });

  it('은퇴한 카드만 남은 개념은 만기에 서지 않는다', () => {
    addRepo(1, 'alpha', 100, null);
    addConcept('ts/a');
    master('ts/a', 1, EOD - 1);
    addCard(10, 1, 'ts/a');
    db.prepare('UPDATE card SET retired_at = 1 WHERE id = 10').run();
    expect(overview()[0]?.due_n).toBe(0);
  });
});
