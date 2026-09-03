/**
 * Q4 통합 — **Rust 가 실제로 뱉은 것**(`fixtures/ipc/tiny/`)을 TS 가 받아 세션 한 바퀴를 돈다
 * (06 §1.4).
 *
 * 여기서만 확인되는 것: 인제스트 덤프 → 사용처 파생 → **진짜 사전으로 카드 생성** →
 * 큐 → 오답 → 다시 찍기 → 사다리 2단 점프 → 자동 복귀 → 요약. `session.test.ts` 는 카드를
 * 손으로 넣지만 이 파일은 안 넣는다 — 그래서 사전이 비면 여기가 먼저 빨개진다.
 *
 * 덤프 자체가 Rust 계약과 같은지는 CI 의 `git diff --exit-code fixtures/ipc` 가 본다.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { deriveFile, materializeDict, type DerivedSite } from '@chickadee/concepts';
import { loadDict } from '@chickadee/dictionary';
import type { Capture } from '@chickadee/ipc-client';
import { migrations, statements, toSqliteBindings } from '@chickadee/store-sql';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type BetterSqlite3 from 'better-sqlite3';

const require_ = createRequire(import.meta.url);
const Database = require_('better-sqlite3') as new (path: string) => BetterSqlite3.Database;

const FIXTURE = join(process.cwd(), 'fixtures/ipc/tiny');
const T = 1_772_755_200_000;
const TZ = 'Asia/Seoul';

let db: BetterSqlite3.Database;

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
      batch: (ops: { name: string; params: unknown }[]) =>
        Promise.resolve(db.transaction(() => ops.map((op) => run(op.name, op.params)))()),
    },
    // 맥락 줄은 못 읽는다(픽스처 리포가 없다) — 생성기는 `excerpt` 로 물러선다.
    file: { readLines: () => Promise.reject(new Error('no file')) },
  },
  IpcError: class extends Error { code = 'X' },
  log: { info: () => undefined, warn: () => undefined, error: () => undefined },
  on: () => Promise.resolve(() => undefined),
}));

const { cardMaker } = await import('./cards.js');
const { emptyMastery, finishPlate } = await import('./plate.js');
const {
  insertPrereq, insertRetry, loadMastery, loadPlates, openSession, today,
} = await import('./session.js');
const { loadScheduler, loadSettings } = await import('./settings.js');
const { loadSummary } = await import('./summary.js');
const { loadLadder, rebuildPrompt } = await import('./ladder.js');

/** Rust 덤프의 snake_case 한 행 → 01 §3.1 의 `Capture`. */
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

const dump = <T,>(name: string): T =>
  JSON.parse(readFileSync(join(FIXTURE, name), 'utf8')) as T;

/** 덤프가 담은 파일은 하나뿐이다 — `derive.captures_by_file` 한 페이지가 그 계약이다. */
const DUMPED_FILE = 'src/store/repo.ts';

async function seedFromDump(): Promise<DerivedSite[]> {
  const init = migrations.find((m) => m.version === 1);
  if (!init) throw new Error('0001_init.sql 이 카탈로그에 없다');
  db = new Database(':memory:');
  db.exec(init.sql);
  db.pragma('foreign_keys = ON');

  db.prepare(
    `INSERT INTO repo (id, root_path, name, fingerprint, added_at) VALUES (1, '/w/tiny', 'tiny', 'r', ?)`,
  ).run(T);
  db.prepare(`INSERT INTO settings (key, value_json, updated_at) VALUES ('tz', ?, ?)`)
    .run(JSON.stringify(TZ), T);

  // 사전을 물질화한다 — 보편 개념이 먼저 들어가야 `concept.universal_id` 외래키가 산다.
  await materializeDict(loadDict(), T);

  const files = dump<{ path: string; content_hash: string }[]>('files.json');
  const insertFile = db.prepare(
    `INSERT INTO file (id, repo_id, path, content_hash, grammar, updated_at)
     VALUES (?, 1, ?, ?, 'typescript', ?)`,
  );
  files.forEach((f, i) => insertFile.run(i + 1, f.path, f.content_hash, T));
  const fileId = files.findIndex((f) => f.path === DUMPED_FILE) + 1;
  expect(fileId).toBeGreaterThan(0);

  const captures = dump<DumpCapture[]>('captures.json').map(toCapture);
  const { sites } = deriveFile(DUMPED_FILE, captures);

  const insertSite = db.prepare(
    `INSERT INTO concept_site (repo_id, file_id, concept_id, site_key, line_start, line_end,
       col_start, col_end, shape, occurrence, excerpt, picks_json, hole_json, ctx_json,
       line_concepts_json, uncovered_ratio, confidence, parse_quality, unknown_count, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ok', ?, ?)`,
  );
  for (const s of sites) {
    insertSite.run(
      fileId, s.conceptId, s.siteKey, s.lineStart, s.lineEnd, s.colStart, s.colEnd,
      s.shape, s.occurrence, s.excerpt, JSON.stringify(s.picks),
      s.hole === null ? null : JSON.stringify(s.hole), JSON.stringify(s.ctx),
      JSON.stringify(s.lineConcepts), s.uncoveredRatio, s.confidence, 0, T,
    );
  }
  return sites;
}

const maker = () => cardMaker({
  repoId: 1,
  rootPath: '/w/tiny',
  dict: loadDict(),
  dictVersion: 'test',
  layerOf: () => 0,
  now: T,
});

beforeEach(async () => {
  await seedFromDump();
});

describe('Rust 덤프 재생', () => {
  test('덤프의 캡처가 사용처로 파생된다 (01 §3.1 계약)', () => {
    const rows = db.prepare(
      'SELECT concept_id, line_start, excerpt FROM concept_site ORDER BY id',
    ).all() as { concept_id: string; line_start: number; excerpt: string }[];
    expect(rows.length).toBeGreaterThan(0);
    // 덤프는 `ts/optional-chaining` 을 담고 있다 — 이름이 바뀌면 사전이나 Rust 가 바뀐 것이다.
    expect(rows.some((r) => r.concept_id === 'ts/optional-chaining')).toBe(true);
    expect(rows.every((r) => r.line_start > 0)).toBe(true);
  });

  test('진짜 사전으로 카드가 나오고 큐가 선다', async () => {
    const view = await openSession(1, T, maker());
    expect(view).not.toBeNull();
    expect(view?.plates.length).toBeGreaterThan(0);

    const card = db.prepare('SELECT kind, payload_json FROM card LIMIT 1').get() as
      { kind: string; payload_json: string };
    expect(['point', 'blank', 'meaning']).toContain(card.kind);

    const payload = JSON.parse(card.payload_json) as { q: string; why: unknown[]; lines: unknown[] };
    // 문구는 생성 시점에 이미 렌더된 최종 문자열이다 (D74) — 템플릿 흔적이 남으면 안 된다.
    expect(payload.q).not.toMatch(/\{\{/);
    expect(payload.lines.length).toBeGreaterThan(0);
  });

  test('오답 → 다시 찍기 → 사다리 2단 → 복귀 → 요약이 한 흐름으로 돈다', async () => {
    const view = await openSession(1, T, maker());
    if (view === null) throw new Error('큐가 비었다');
    const first = view.plates[0];
    if (first === undefined) throw new Error('판이 없다');
    const payload = first.payload.track === 't0' ? first.payload : null;
    if (payload === null) throw new Error('T0 판이 아니다');

    const settings = await loadSettings();
    const scheduler = await loadScheduler(T, settings.desiredRetention);
    const wrong = (payload.answer + 1) % Math.max(2, payload.options?.length ?? 2);

    // ① 오답 — 겹은 유지되고 원장에 남는다.
    const mastery = (await loadMastery([first.conceptId])).get(first.conceptId)
      ?? emptyMastery(first.conceptId, null);
    const finished = await finishPlate({
      repoId: 1, sessionId: view.session.id, item: first, state: { sel: wrong, answered: true },
      mastery, scheduler, now: T, day: today(T, settings), ok: false, dunno: false,
      transfer: false, detail: { track: 't0', sel: wrong, answer: payload.answer, kind: payload.kind },
      durationMs: 9_000, elapsedS: 9,
      site: { filePath: payload.file, lineNo: payload.focus }, liferShown: 0,
    });
    expect(finished.move.after).toBe(0);

    // ② 다시 찍기가 큐에 들어간다.
    expect(await insertRetry(view.session.id, first.pos, first.id,
      { id: first.cardId, conceptId: first.conceptId, track: 't0' }, T)).toBe(true);
    expect(db.prepare(`SELECT COUNT(*) AS n FROM session_item WHERE role = 'retry'`).get())
      .toEqual({ n: 1 });

    // ③ 사다리 — 2단이 아래층을 진단한다.
    const ladder = await loadLadder({
      repoId: 1, payload, conceptId: first.conceptId,
      concept: { name: first.nameKo, token: first.token ?? '' },
      siteId: first.siteId, sel: wrong, answered: true, correct: false, stuck: '',
      mastery: (await loadMastery([first.conceptId])).get(first.conceptId) ?? null,
      now: T, settings,
    });
    expect(ladder.card.dict.length).toBeGreaterThan(0);
    // 머리말은 「모르겠어요」가 옮길 자리를 말한다 — 0겹이면 더 내려갈 곳이 없다.
    expect(ladder.ly).toEqual({ from: 0, to: 0 });
    // 오답이 이미 다음 자리를 잡아 두었으므로 머리말이 그것을 적는다 — 앞서는 `dueAt` 을
    // 호출부가 `null` 로 굳혀 이 줄이 언제나 「오늘 안에 → 오늘 안에」였다.
    expect(ladder.nextWas).toBe('내일');

    // 겹이 있고 예정이 있으면 머리말이 **이득 두 개**를 말한다: 겹 한 칸과 당겨진 시점.
    const scheduled = await loadLadder({
      repoId: 1, payload, conceptId: first.conceptId,
      concept: { name: first.nameKo, token: first.token ?? '' },
      siteId: first.siteId, sel: wrong, answered: true, correct: false, stuck: '',
      mastery: {
        layer: 2, dayKey: null, dayStartLayer: 2, dayCeiling: 4,
        firstOkAt: T - 86_400_000, lastOkDay: null, dueAt: T + 5 * 86_400_000,
      },
      now: T, settings,
    });
    expect(scheduled.ly).toEqual({ from: 2, to: 1 });
    expect(scheduled.nextWas).toBe('5일 뒤');
    // 4단 프롬프트는 「프롬프트 만들기」를 누른 순간 그때의 「막힌 지점」으로 조립된다 —
    // 사다리를 열 때 미리 구우면 사용자가 적은 문장이 영영 안 담긴다.
    const asked = rebuildPrompt({
      payload, concept: { name: first.nameKo, token: first.token ?? '' },
      sel: wrong, stuck: '왜 여기서 undefined 가 나오는지 모르겠어요',
    });
    expect(asked).toContain('왜 여기서 undefined 가 나오는지 모르겠어요');
    // 파일 이름만 담는다 (D8).
    expect(asked).not.toContain('/');
    expect(asked).toContain('배우려는 문법');

    // ④ 아래층 판을 끼우고 마친 뒤 부모로 돌아온다.
    const prereq = ladder.card.prereq[0];
    if (prereq !== undefined) {
      const cardId = db.prepare('SELECT id FROM card LIMIT 1').get() as { id: number };
      await insertPrereq(view.session.id, first.pos, first.id,
        { id: cardId.id, conceptId: prereq.conceptId as never, track: 't0' }, T);
      const plates = await loadPlates(view.session.id);
      expect(plates.some((p) => p.role === 'prereq')).toBe(true);
      // 아래층은 부모를 뒤로 민다 — 현재 자리 **앞**에 들어간다 (02 §5.5).
      const inserted = plates.find((p) => p.role === 'prereq');
      const parent = plates.find((p) => p.id === first.id);
      expect((inserted?.pos ?? 0) < (parent?.pos ?? 0)).toBe(true);
    }

    // ⑤ 요약 — 오늘 움직인 잉크.
    const summary = await loadSummary(1, view.session.id, view.session.startedAt, T, settings);
    expect(summary.plates).toBe(1);
    expect(summary.exact).toBe(0);
    expect(summary.shifts[0]).toMatchObject({ conceptId: first.conceptId, from: 0, to: 0 });
  });

  test('판이 안 나오는 개념은 사유를 남긴다 (04 §1.4 no-plate)', async () => {
    // 사전에 문항이 하나도 없는 개념을 넣고 구멍을 하나 판다.
    db.prepare(
      `INSERT INTO gap (repo_id, concept_id, site_count, min_unknown, status, computed_at)
       SELECT 1, concept_id, COUNT(*), 0, 'open', ? FROM concept_site GROUP BY concept_id`,
    ).run(T);
    await openSession(1, T, maker());
    const rows = db.prepare(
      `SELECT status, reason FROM gap WHERE status = 'card_made' OR reason IS NOT NULL`,
    ).all();
    // 판이 나왔으면 구멍이 닫히고, 안 나왔으면 사유가 남는다 — 둘 중 하나는 반드시 있다.
    expect(rows.length).toBeGreaterThan(0);
  });
});
