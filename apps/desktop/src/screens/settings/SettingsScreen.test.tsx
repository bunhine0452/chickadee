// @vitest-environment jsdom
/**
 * 설정 화면 (05 §2.1 · 06 §6.4 · E8).
 *
 * `settings`·`repo`·`perf_sample` 조회는 **진짜 SQLite** 위에서 돈다 — 화면이 부르는
 * statement 이름과 파라미터가 실제로 맞물리는지가 여기서 걸린다. Rust 명령(`app_*`·`secret_*`)만
 * 모의한다.
 */
import { createRequire } from 'node:module';

import { migrations, statements, toSqliteBindings } from '@chickadee/store-sql';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type BetterSqlite3 from 'better-sqlite3';

const require_ = createRequire(import.meta.url);
type SqliteDb = BetterSqlite3.Database;
const Database = require_('better-sqlite3') as new (path: string) => SqliteDb;

const T = 1_767_225_600_000;

let db: SqliteDb;
let written: { box: string; name: string }[] = [];
let revealed: string[] = [];
let wiped = 0;
let secretDeleted: string[] = [];
let hasKey = false;

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
      paths: () => Promise.resolve({
        dataDir: '/data/dev.chickadee.app', dbPath: '/data/dev.chickadee.app/chickadee.db',
        logDir: '/data/dev.chickadee.app/logs', dictCacheDir: '', dictUserDir: '',
      }),
      writeJson: (box: string, name: string) => {
        written.push({ box, name });
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
    secret: {
      has: () => Promise.resolve(hasKey),
      set: () => Promise.resolve(),
      delete: (account: string) => {
        secretDeleted.push(account);
        return Promise.resolve();
      },
    },
  },
  IpcError: class extends Error { code = 'X'; },
  log: { info: () => undefined, warn: () => undefined, error: () => undefined },
}));

const { SettingsScreen } = await import('./SettingsScreen.js');

function seed(): void {
  db = new Database(':memory:');
  // 마이그레이션을 전부, 번호 순으로 태운다 — 0001 만 태우면 뒤 마이그레이션이 만든 표를
  // 쓰는 statement 가 「no such table」로 터진다.
  for (const m of [...migrations].sort((a, b) => a.version - b.version)) db.exec(m.sql);
  db.pragma('foreign_keys = ON');
  db.exec(`
    INSERT INTO repo (id, root_path, name, fingerprint, added_at, last_ingest_at)
      VALUES (1, '/w/cart-shop', 'cart-shop', 'root1', ${T}, ${T + 60000});
  `);
  run('settings.set', { key: 'tz', valueJson: '"Asia/Seoul"', updatedAt: T });
  for (const ms of [10, 12, 40]) run('perf.insert', { kind: 'queue', ms, n: 1, at: T });
}

/** 화면이 첫 조회를 끝낼 때까지. 값이 하나라도 붙으면 나머지도 같은 `Promise.all` 에서 왔다. */
async function drawn(onBack = vi.fn()) {
  render(<SettingsScreen onBack={onBack} />);
  await screen.findByText('cart-shop');
  return onBack;
}

beforeEach(() => {
  written = [];
  revealed = [];
  secretDeleted = [];
  wiped = 0;
  hasKey = false;
  seed();
});

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-trim');
});

describe('SettingsScreen', () => {
  it('06 §6 이 정한 절이 전부 있다', async () => {
    await drawn();
    for (const title of ['리포', '학습', '모양', 'LLM 키', '성능', '데이터', '프라이버시 노트', '정보']) {
      expect(screen.getByRole('region', { name: new RegExp(title) })).toBeTruthy();
    }
  });

  it('리포 목록에 경로와 마지막 인제스트를 적는다', async () => {
    await drawn();
    const sec = screen.getByRole('region', { name: /리포/ });
    expect(sec.textContent).toContain('cart-shop');
    expect(sec.textContent).toContain('/w/cart-shop');
    expect(sec.textContent).toContain('마지막 인제스트');
  });

  it('홈으로 돌아간다', async () => {
    const user = userEvent.setup();
    const onBack = await drawn();
    await user.click(screen.getByRole('button', { name: '홈으로' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  // ───────── 학습 · 모양 ─────────

  it('학습 값을 바꾸면 settings 테이블에 바로 내려간다', async () => {
    const user = userEvent.setup();
    await drawn();
    const budget = screen.getByRole('spinbutton', { name: /하루 예산/ });
    await user.clear(budget);
    await user.type(budget, '20');

    await waitFor(() => {
      const row = db.prepare("SELECT value_json FROM settings WHERE key = 'budget_min'").get() as
        { value_json: string } | undefined;
      expect(row?.value_json).toBe('20');
    });
  });

  it('범위 밖 값은 저장하지 않는다 (D12 10~25)', async () => {
    const user = userEvent.setup();
    await drawn();
    const budget = screen.getByRole('spinbutton', { name: /하루 예산/ });
    await user.clear(budget);
    await user.type(budget, '99');

    const row = db.prepare("SELECT value_json FROM settings WHERE key = 'budget_min'").get() as
      { value_json: string } | undefined;
    // 9 는 하한 밖, 99 도 상한 밖 — 어느 쪽도 행을 만들지 않는다.
    expect(row).toBeUndefined();
  });

  it('모양 스위치가 <html> 을 세우고 저장한다 (E7)', async () => {
    const user = userEvent.setup();
    await drawn();
    await user.click(screen.getByRole('switch', { name: '주간반 · 야간반 전환' }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    await waitFor(() => {
      const row = db.prepare("SELECT value_json FROM settings WHERE key = 'theme'").get() as
        { value_json: string } | undefined;
      expect(row?.value_json).toBe('"dark"');
    });
  });

  // ───────── 성능 (06 §8) ─────────

  it('성능 절이 perf_sample 을 표로 보인다', async () => {
    await drawn();
    const table = screen.getByRole('table');
    expect(table.textContent).toContain('큐 생성');
    const row = screen.getByRole('row', { name: /큐 생성/ });
    expect(row.textContent).toContain('3'); // 표본 3건
  });

  // ───────── 내보내기 (06 §6.4) ─────────

  it('두 체크박스는 기본으로 꺼져 있다', async () => {
    await drawn();
    for (const name of [/카드 발췌/, /필사 초안/]) {
      expect((screen.getByRole('checkbox', { name }) as HTMLInputElement).checked).toBe(false);
    }
  });

  it('내보내면 exports 자리에 파일을 만들고 그 폴더를 연다 (D109)', async () => {
    const user = userEvent.setup();
    await drawn();
    await user.click(screen.getByRole('button', { name: '내 기록 내보내기' }));

    await waitFor(() => expect(written).toHaveLength(1));
    expect(written[0]?.box).toBe('exports');
    expect(written[0]?.name).toMatch(/^chickadee-export-\d{4}-\d{2}-\d{2}\.json$/);
    expect(revealed).toContain('data');
    // 「여기에 만들었습니다」 — 경로를 말해 준다. 고르는 대화상자는 없다.
    // `LiveRegion` 은 같은 문장을 다시 읽히려 30ms 비웠다 채운다.
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain('/data/dev.chickadee.app/exports'));
  });

  it('데이터·로그 폴더를 연다', async () => {
    const user = userEvent.setup();
    await drawn();
    await user.click(screen.getByRole('button', { name: '데이터 폴더 열기' }));
    await user.click(screen.getByRole('button', { name: '로그 폴더 열기' }));
    await waitFor(() => expect(revealed).toEqual(['data', 'logs']));
  });

  // ───────── 전부 지우기 (06 §6.4 · E8) ─────────

  it('한 번 눌러서는 지우지 않는다 — 확인 단계를 거친다', async () => {
    const user = userEvent.setup();
    await drawn();
    await user.click(screen.getByRole('button', { name: '전부 지우기' }));

    expect(wiped).toBe(0);
    expect(screen.getByText(/되돌릴 수 없습니다/)).toBeTruthy();
    expect(screen.getByRole('button', { name: '정말 전부 지웁니다' })).toBeTruthy();
  });

  it('그만두기로 확인 단계를 빠져나온다', async () => {
    const user = userEvent.setup();
    await drawn();
    await user.click(screen.getByRole('button', { name: '전부 지우기' }));
    await user.click(screen.getByRole('button', { name: '그만두기' }));

    expect(wiped).toBe(0);
    expect(screen.queryByText(/되돌릴 수 없습니다/)).toBeNull();
  });

  it('확인하면 파일과 키체인 항목을 지우고 앱을 닫으라고 말한다 (E8)', async () => {
    const user = userEvent.setup();
    await drawn();
    await user.click(screen.getByRole('button', { name: '전부 지우기' }));
    await user.click(screen.getByRole('button', { name: '정말 전부 지웁니다' }));

    await waitFor(() => expect(wiped).toBe(1));
    expect(secretDeleted).toEqual(['llm']);
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain('앱을 닫아 주세요'));
  });

  // ───────── 프라이버시 노트 (06 §3.6) ─────────

  it('프라이버시 노트를 06 §3.6 의 0.1.0 문장 그대로 싣는다', async () => {
    await drawn();
    const sec = screen.getByRole('region', { name: /프라이버시 노트/ });
    const text = sec.textContent ?? '';
    expect(text).toContain('당신의 코드는 이 컴퓨터를 떠나지 않습니다.');
    expect(text).toContain('이 판은 인터넷을 아예 쓰지 않습니다');
    expect(text).toContain('앱이 스스로 보내지 않습니다.');
    expect(text).toContain('사용 통계·오류 보고를 보내지 않고, 업데이트도 확인하지 않습니다.');
    expect(text).toContain('「설정 → 전부 지우기」로 모든 기록을 삭제할 수 있습니다.');
  });

  it('없는 기능을 있다고 말하지 않는다 — 0.1.0 에는 전송도 업데이트 확인도 없다 (D106 · 06 §5.5)', async () => {
    await drawn();
    const text = document.body.textContent ?? '';
    expect(text).not.toContain('직접 보내기를 누를 때');
    expect(text).not.toContain('업데이트 확인');
  });

  // ───────── 정보 ─────────

  it('정보 절이 app_version 과 데이터 위치를 보인다', async () => {
    await drawn();
    const sec = screen.getByRole('region', { name: /정보/ });
    expect(sec.textContent).toContain('0.1.0');
    expect(sec.textContent).toContain('2.9.0');
    expect(sec.textContent).toContain('3.46.0');
    expect(sec.textContent).toContain('/data/dev.chickadee.app');
  });
});
