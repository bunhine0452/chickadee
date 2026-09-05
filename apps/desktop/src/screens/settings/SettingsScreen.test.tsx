// @vitest-environment jsdom
/**
 * 설정 화면 (05 §2.1 · 06 §6.4 · E8).
 *
 * `settings`·`repo`·`perf_sample` 조회는 **진짜 SQLite** 위에서 돈다 — 화면이 부르는
 * statement 이름과 파라미터가 실제로 맞물리는지가 여기서 걸린다. Rust 명령(`app_*`·`secret_*`)만
 * 모의한다.
 */
import { createRequire } from 'node:module';

import { getLocale, setLocale } from '@chickadee/i18n';
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
/** 이 이름의 조회만 실패시킨다 — 「읽기 실패해도 화면은 산다」를 재는 자리. */
let failQuery: string | null = null;

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
      query: (name: string, params: unknown) => (name === failQuery
        ? Promise.reject(new Error('읽기 실패'))
        : Promise.resolve(run(name, params))),
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
  failQuery = null;
  seed();
});

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-trim');
  document.documentElement.removeAttribute('data-motion');
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
    // 위·아래 둘 다 「홈으로」다 (D170 ⑧) — 어느 쪽을 눌러도 같은 문이다.
    const backs = screen.getAllByRole('button', { name: '홈으로' });
    expect(backs).toHaveLength(2);
    await user.click(backs[1] as HTMLElement);
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

  // D147 — `home.newcomerBody` 가 이 자리를 실명으로 가리킨다. 없으면 그 문구가 거짓말이다.
  it('「프로그래밍이 처음」을 여기서 되돌릴 수 있다 — 첫 실행에서 물은 것을 잠그지 않는다', async () => {
    const user = userEvent.setup();
    await drawn();
    await user.click(screen.getByRole('switch', { name: /프로그래밍이 처음인지 고르기/ }));

    await waitFor(() => {
      const row = db.prepare("SELECT value_json FROM settings WHERE key = 'declared_newcomer'")
        .get() as { value_json: string } | undefined;
      expect(row?.value_json).toBe('true');
    });
  });

  it('모션 감축도 <html> 을 세우고 저장한다 — 네 칸이 재실행에 남는다 (D122 · E7)', async () => {
    const user = userEvent.setup();
    await drawn();
    await user.click(screen.getByRole('switch', { name: '모션 시스템 따름 · 항상 줄이기' }));

    expect(document.documentElement.getAttribute('data-motion')).toBe('reduce');
    await waitFor(() => {
      const row = db.prepare("SELECT value_json FROM settings WHERE key = 'motion'").get() as
        { value_json: string } | undefined;
      expect(row?.value_json).toBe('"reduce"');
    });
  });

  it('편집 보조는 「단계에 맞춰」로 서고, 끄면 settings 테이블에 내려간다 (D143)', async () => {
    const user = userEvent.setup();
    await drawn();
    const sw = screen.getByRole('switch', { name: '편집 보조' });
    // 기본값은 매트릭스 그대로 — 스위치를 만든다고 기본을 끄로 내리지 않는다.
    expect(db.prepare("SELECT value_json FROM settings WHERE key = 'editor_assist'").get())
      .toBeUndefined();

    await user.click(sw);
    await waitFor(() => {
      const row = db.prepare("SELECT value_json FROM settings WHERE key = 'editor_assist'").get() as
        { value_json: string } | undefined;
      expect(row?.value_json).toBe('"off"');
    });
  });

  it('무엇을 잃는지 적는다 — 같은 85%가 다른 조건에서 나온 값이 된다', async () => {
    await drawn();
    expect(screen.getByText(/같은 85%가 서로 다른 조건에서 나온 값/)).toBeTruthy();
  });

  it('설정을 못 읽어도 화면은 기본값으로 뜬다 (01 §6)', async () => {
    // 한 조회만 넘어뜨린다. 화면이 통째로 빈 채 서는 것이 아니라 읽힌 것만 보여야 한다.
    failQuery = 'settings.get_all';
    render(<SettingsScreen onBack={vi.fn()} />);

    await screen.findByText('설정을 다 읽지 못했습니다.');
    // D12 기본값이 그대로 칸에 앉는다 — 못 읽었다고 0 이나 빈 칸이 되지 않는다.
    expect((screen.getByRole('spinbutton', { name: /하루 예산/ }) as HTMLInputElement).value)
      .toBe('15');
  });

  it('밝기는 라디오 셋이고 고른 것이 <html> 을 세우고 저장한다 (E7 · D187 ⑫)', async () => {
    const user = userEvent.setup();
    await drawn();
    // 기본은 「시스템 따름」이다 — 한 번도 안 고른 사람이 방의 밝기를 따른다.
    expect(screen.getByRole('radio', { name: '시스템 따름' }).getAttribute('aria-checked')).toBe('true');
    await user.click(screen.getByRole('radio', { name: '어둡게' }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    await waitFor(() => {
      const mode = db.prepare("SELECT value_json FROM settings WHERE key = 'theme_mode'").get() as
        { value_json: string } | undefined;
      expect(mode?.value_json).toBe('"dark"');
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
    expect(text).toContain('이 버전은 인터넷을 아예 쓰지 않습니다');
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

/**
 * `en` 스모크 — 설정 화면이 실제로 영어로 뜨는가 (D117 · 05 §9).
 *
 * 이 화면은 스위치 라벨 네 벌(`공정`·`부속`·`모션`·`표시 언어`)과 프라이버시 문단 셋을
 * **모듈 최상단**에 두고 있었다. 그 자리는 모듈이 열리는 시점에 굳고 그 시점은
 * `setLocale()` 보다 이르다 — `tsc` 도 카탈로그 린트도 못 잡고, 화면을 그려야 드러난다.
 * 그래서 여기서 재는 것은 「번역이 있는가」가 아니라 **「번역이 닿는가」** 다.
 */
describe('SettingsScreen — en', () => {
  // 이 파일의 나머지는 `ko` 를 전제한다. 로케일은 모듈 상태라 반드시 되돌린다.
  const before = getLocale();
  beforeEach(() => setLocale('en'));
  afterEach(() => setLocale(before));

  /** 절 제목이 영어라 `drawn()` 의 ko 대기 문구를 쓸 수 없다 — 리포 이름으로 기다린다. */
  async function drawnEn() {
    render(<SettingsScreen onBack={vi.fn()} />);
    await screen.findByText('cart-shop');
  }

  it('06 §6 의 여덟 절이 영어 제목으로 선다', async () => {
    await drawnEn();
    for (const title of [
      'Repos', 'Study', 'Look', 'LLM key', 'Performance', 'Data', 'Privacy note', 'About',
    ]) {
      expect(screen.getByRole('region', { name: new RegExp(title) })).toBeTruthy();
    }
  });

  it('그려진 글자에 한글이 없다 — 얼어붙은 문구가 있으면 여기서 걸린다', async () => {
    await drawnEn();
    // 「저장」 버튼이 없는 화면이라(05 §2.1) 값은 칸에서 바로 내려간다 — 그리기만으로 전부 뜬다.
    const left = (document.body.textContent ?? '').match(/[가-힣]/g) ?? [];
    // 언어 이름은 그 언어로 적는다 (D117) — `en/core.ts` 가 `locale.ko` 를 일부러 비워 두어
    // ko 로 폴백한다. 못 읽는 말로 적힌 이름은 고를 수가 없기 때문이다. 그래서 언어 스위치의
    // 「한국어」 석 자만 남는 것이 정상이고, **그 밖의 한글은 얼어붙은 문구다.**
    expect(left.join(''), '이 글자를 내는 자리가 로케일보다 먼저 굳었다').toBe('한국어');
  });

  it('프라이버시 노트도 06 §3.6 을 영어로 그대로 싣는다', async () => {
    await drawnEn();
    const text = screen.getByRole('region', { name: /Privacy note/ }).textContent ?? '';
    expect(text).toContain('Your code does not leave this computer.');
    expect(text).toContain('does not use the internet at all');
    expect(text).toContain('No usage statistics, no crash reports, no update checks.');
  });
});
