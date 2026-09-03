/**
 * T1 판 한 장을 **원장까지** 마친다 (M3 「끝났다는 증거」).
 *
 * 아래 SQLite 는 진짜이고 IPC 만 모의한다 — 그래서 이의와 왜 한 줄이 실제로 `appeal`·
 * `why_answer` 에 남는지, 그 두 행이 방금 쓴 `review_log` 를 가리키는지(D84), 그리고
 * `card_state.stage` 가 움직이는지를 여기서 확인할 수 있다.
 *
 * 화면은 이 테스트에 없다 — 그것은 Monaco 가 필요하고(`ClonePad`) jsdom 에서 뜨지 않는다.
 * 화면 쪽 키보드 완결은 `screens/session/T1Plate.test.tsx` 가 본다.
 */
import { createRequire } from 'node:module';

import { asDayKey, migrations, statements, toSqliteBindings } from '@chickadee/store-sql';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type BetterSqlite3 from 'better-sqlite3';

const require_ = createRequire(import.meta.url);
const Database = require_('better-sqlite3') as new (path: string) => BetterSqlite3.Database;

const T = 1_772_755_200_000; // 2026-09-03 09:00 KST
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
    file: { readLines: () => Promise.reject(new Error('no file')) },
    // 이 픽스처에는 문법 크레이트가 없다 — 04 §4.5 의 언어 폴백을 그대로 지난다.
    parse: { snippet: () => Promise.reject(new Error('no parser')) },
  },
  IpcError: class extends Error { code = 'X' },
  log: { info: () => undefined, warn: () => undefined, error: () => undefined },
  on: () => Promise.resolve(() => undefined),
}));

const { finishT1Plate, gradeT1Plate } = await import('../session-flow.js');
const { useUi } = await import('../store.js');
const { loadPlates } = await import('./session.js');

/** 목업 `T1.original` 에서 12줄만 — 04 §3.1 의 하한이 12 다. */
const ORIGINAL = [
  '// 로그인 폼. 제출하면 useLogin 의 submit 을 부른다',
  'export function LoginForm() {',
  '  const { submit, error, pending } = useLogin()',
  "  const [email, setEmail] = useState('')",
  "  const [password, setPassword] = useState('')",
  '',
  '  async function onSubmit(e: FormEvent) {',
  '    e.preventDefault()',
  '    await submit(email, password)',
  '  }',
  '',
  '  return null',
  '}',
];

const PAYLOAD = {
  track: 't1',
  kind: 'transcribe',
  blockId: 1,
  file: 'src/features/auth/LoginForm.tsx',
  fn: 'LoginForm()',
  original: ORIGINAL,
  show2: [0, 1, 5, 6, 9, 10, 12],
  why: { line: 7, q: '이 줄이 없으면 무엇이 달라질까요?', help: '한 줄이면 됩니다.', choices: [] },
};

function seed(): void {
  const init = migrations.find((m) => m.version === 1);
  if (!init) throw new Error('0001_init.sql 이 카탈로그에 없다');
  db = new Database(':memory:');
  db.exec(init.sql);
  db.pragma('foreign_keys = ON');
  db.prepare(
    `INSERT INTO repo (id, root_path, name, fingerprint, added_at) VALUES (1, '/w/app', 'app', 'r', ?)`,
  ).run(T);
  db.prepare(
    `INSERT INTO dictionary_version (id, lang, version, sha256, concept_count, loaded_at)
     VALUES (1, 'ts', '1.0.0', 'x', 1, ?)`,
  ).run(T);
  db.prepare(
    `INSERT INTO file (id, repo_id, path, grammar, content_hash, updated_at)
     VALUES (1, 1, 'src/features/auth/LoginForm.tsx', 'tsx', 'blob1', ?)`,
  ).run(T);
  db.prepare(`INSERT INTO settings (key, value_json, updated_at) VALUES ('tz', ?, ?)`)
    .run(JSON.stringify(TZ), T);
  db.prepare(
    `INSERT INTO concept (id, lang, name_ko, token, kind, track_default, dict_version_id)
     VALUES ('react/component', 'react', '컴포넌트', 'LoginForm', 'lang', 't1', 1)`,
  ).run();
  db.prepare(
    `INSERT INTO block (id, repo_id, file_id, name, kind, line_start, line_end, text_hash, updated_at)
     VALUES (1, 1, 1, 'LoginForm', 'function', 1, 13, 'h-block', ?)`,
  ).run(T);
  db.prepare(
    `INSERT INTO card (id, repo_id, track, kind, concept_id, level, file_id, payload_json,
                       content_hash, created_at)
     VALUES (1, 1, 't1', 'transcribe', 'react/component', 2, 1, ?, 'h1', ?)`,
  ).run(JSON.stringify(PAYLOAD), T);
  db.prepare(
    `INSERT INTO card_state (card_id, prints, stage) VALUES (1, 1, 2)`,
  ).run();
  db.prepare(
    `INSERT INTO session (id, repo_id, day_key, seq_in_day, started_at, budget_min, planned_min,
                          status, plan_json)
     VALUES (1, 1, '2026-09-03', 1, ?, 15, 9, 'active', '[]')`,
  ).run(T);
  db.prepare(
    `INSERT INTO session_item (id, session_id, pos, card_id, concept_id, track, role, est_min, created_at)
     VALUES (1, 1, 0, 1, 'react/component', 't1', 'new', 9, ?)`,
  ).run(T);
}

async function open(): Promise<void> {
  seed();
  const plates = await loadPlates(1);
  const row = db.prepare('SELECT * FROM session WHERE id = 1').get() as Record<string, unknown>;
  useUi.getState().beginSession(
    {
      id: 1,
      repoId: 1,
      dayKey: asDayKey('2026-09-03'),
      seqInDay: 1,
      startedAt: row.started_at as number,
      endedAt: null,
      budgetMin: 15,
      plannedMin: 9,
      elapsedS: 0,
      status: 'active',
      plan: [],
      liferShown: 0,
    },
    plates,
    0,
  );
}

const rows = (sql: string): Record<string, unknown>[] =>
  db.prepare(sql).all() as Record<string, unknown>[];

beforeEach(async () => {
  await open();
});

describe('T1 판 한 장 (04 §4~§6 · 02 §4)', () => {
  test('완벽한 필사는 진급이고 단계가 오른다 — 4겹은 3단계에서만이므로 여기선 상한 3', async () => {
    const graded = await gradeT1Plate({
      draft: ORIGINAL.join('\n'), stage: 2, peeks: 0, downgraded: false,
    });
    expect(graded).not.toBeNull();
    expect(graded?.result.pct).toBe(100);
    expect(graded?.result.verdict).toBe('advance');
    // 문법 크레이트가 없는 이 픽스처에서는 AST 층이 폴백한다 (04 §4.5).
    expect(graded?.result.engine).toBe('regex');

    const done = await finishT1Plate(
      graded!.result,
      graded!.question,
      {
        draft: ORIGINAL.join('\n'),
        stage: 2,
        peeks: 0,
        downgraded: false,
        elapsedMs: 540_000,
        appealed: [],
        why: { text: '폼 제출로 페이지가 새로 고쳐지는 것을 막는다', pick: null },
      },
    );
    expect(done?.correct).toBe(true);

    const log = rows('SELECT * FROM review_log')[0] as Record<string, unknown>;
    expect(log.track).toBe('t1');
    expect(log.ok).toBe(1);
    const detail = JSON.parse(log.detail_json as string) as Record<string, unknown>;
    expect(detail.track).toBe('t1');
    expect(detail.stageBefore).toBe(2);
    expect(detail.stageAfter).toBe(3);
    expect(detail.total).toBe(11); // 13줄 중 빈 줄 2개는 분모에서 빠진다 (04 §4.6)
    expect(detail.whyText).toBe('폼 제출로 페이지가 새로 고쳐지는 것을 막는다');

    const state = rows('SELECT * FROM card_state')[0] as Record<string, unknown>;
    expect(state.stage).toBe(3);
    expect(state.prints).toBe(2);
    expect(state.last_pct).toBe(100);

    // 왜 한 줄은 방금 쓴 원장 행을 가리킨다 (D84).
    const why = rows('SELECT * FROM why_answer')[0] as Record<string, unknown>;
    expect(why.review_log_id).toBe(log.id);
    expect(why.block_id).toBe(1);
    expect(why.question_id).toBe('generic');
  });

  test('이의 두 건이 같은 tx 에 남고 점수는 그대로다 (04 §5 · D84)', async () => {
    const user = [...ORIGINAL];
    user[8] = '    await submit(password, email)'; // 이름 맞바꿈
    user[11] = '  return undefined';               // 어긋남 하나 더
    const graded = await gradeT1Plate({
      draft: user.join('\n'), stage: 2, peeks: 1, downgraded: false,
    });
    expect(graded).not.toBeNull();
    const differ = graded!.result.rows.filter((r) => r.status === 'differ').map((r) => r.oi);
    expect(differ).toContain(8);
    expect(differ).toContain(11);
    // 이름 맞바꿈이 있으면 백분율과 무관하게 진급이 막힌다 (04 §4.6).
    expect(graded!.result.verdict).toBe('repeat-soft');

    const before = graded!.result.pct;
    await finishT1Plate(graded!.result, graded!.question, {
      draft: user.join('\n'),
      stage: 2,
      peeks: 1,
      downgraded: false,
      elapsedMs: 600_000,
      appealed: differ,
      why: { text: '기본 제출 동작을 막아서 새로 고침을 피한다', pick: null },
    });

    const log = rows('SELECT * FROM review_log')[0] as Record<string, unknown>;
    expect(log.ok).toBe(0);
    const appeals = rows('SELECT * FROM appeal ORDER BY line_no');
    expect(appeals).toHaveLength(2);
    // 둘 다 같은 원장 행을 가리킨다 — `last_insert_rowid()` 였다면 두 번째가 첫 이의를 가리킨다.
    expect(appeals.every((a) => a.review_log_id === log.id)).toBe(true);
    expect(appeals.map((a) => a.line_no)).toStrictEqual([9, 12]);
    expect(appeals.every((a) => a.status === 'open')).toBe(true);
    expect(appeals.every((a) => typeof a.pattern_key === 'string')).toBe(true);
    // 점수 불변 — 이의는 규칙 개선 큐이고 판정을 바꾸지 않는다.
    const detail = JSON.parse(log.detail_json as string) as Record<string, unknown>;
    expect(detail.meaning).toBe(graded!.result.meaning);
    expect(before).toBe(graded!.result.pct);
    expect(detail.appealedLines).toStrictEqual([9, 12]);
    // 단계는 오르지 않는다.
    expect((rows('SELECT * FROM card_state')[0] as Record<string, unknown>).stage).toBe(2);
  });

  test('「한 단계 쉽게」는 겹을 올리지 않는다 — 기록만 남는다 (02 §4)', async () => {
    const graded = await gradeT1Plate({
      draft: ORIGINAL.join('\n'), stage: 1, peeks: 0, downgraded: true,
    });
    const done = await finishT1Plate(graded!.result, graded!.question, {
      draft: ORIGINAL.join('\n'),
      stage: 1,
      peeks: 0,
      downgraded: true,
      elapsedMs: 300_000,
      appealed: [],
      why: { text: '이 줄이 없으면 페이지가 새로 고쳐진다', pick: null },
    });
    expect(graded!.result.pct).toBe(100);
    expect(done?.layer).toStrictEqual([0, 0]);
    const log = rows('SELECT * FROM review_log')[0] as Record<string, unknown>;
    expect(log.ok).toBe(0);
    expect(log.grade).toBe(2); // Hard — 「한 단계 쉽게」를 썼다
    const detail = JSON.parse(log.detail_json as string) as Record<string, unknown>;
    expect(detail.downgraded).toBe(true);
    // 진급 자체는 막히지 않으므로 단계는 1 → 2 로 간다 (D85 의 계산: 채점한 단계 + 1).
    expect(detail.stageAfter).toBe(2);
  });

  test('왜 한 줄이 코드 복사면 저장할 수 없다 — 화면이 막는 조건과 같다 (04 §6)', async () => {
    const graded = await gradeT1Plate({
      draft: ORIGINAL.join('\n'), stage: 2, peeks: 0, downgraded: false,
    });
    const { checkWhy } = await import('@chickadee/grading');
    const line = (ORIGINAL[graded!.question.line] ?? '').trim();
    expect(checkWhy(line, line).ok).toBe(false);
    expect(checkWhy('짧다', line).ok).toBe(false);
    expect(checkWhy('브라우저 기본 제출을 막아 새로 고침을 피한다', line).ok).toBe(true);
  });
});
