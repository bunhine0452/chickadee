/**
 * sqlite 어댑터 — 둘째 러너 (D175 를 SQL 로 · 정본 §5 「러너는 셋 — SQL 은 방언마다 하나」).
 *
 * 자바 어댑터와 같은 자리를 맡는다 — **탐지**·**인자**·**읽기**. 다른 것은 넷이고, 그
 * 넷이 D175 의 규칙 넷이 SQL 에서 어떻게 달라지는가다.
 *
 * ① **동의 게이트가 없다.** 자바는 Gradle 배포본을 내려받아야 해서 첫 회에 사람에게
 *    물었다. sqlite 엔진은 앱에 이미 실려 있고(`rusqlite` 번들) 네트워크를 안 쓴다 —
 *    물을 것이 없으므로 `askDownload` 가 이 길에서는 영영 안 뜬다. 대신 게이트가 하나
 *    남는다: **방언**. 러너는 언어마다 하나가 아니라 방언마다 하나이고 이 앱이 든 것은
 *    sqlite 하나라, 표본 리포의 MySQL 덤프는 여기서 안 돈다. 그 사실을 화면이 말한다
 *    (`reason: 'dialect-unsupported'` · D186 ④).
 * ② **상한이 두 자릿수 배 작다.** 자바는 기본 180초 · 첫 회 600초였다. 여기는 기본
 *    5초이고 Rust 가 30초에서 깎는다 — 컴파일이 없고 표가 작아서다. 안 끝나는 것은
 *    느린 것이 아니라 재귀 CTE 같은 사고이고, 5초면 그 사고를 다 잡는다.
 * ③ **작업본이 없다 — 그래서 더 강하다.** 자바는 리포를 통째로 복사해 그 안에 답안을
 *    떨어뜨렸다. 여기서는 데이터베이스가 **메모리에만** 서고 판마다 새로 세워진다.
 *    학습자 리포의 파일은 열지도 않으므로 「원본은 읽기만 한다」가 「원본을 안 본다」가
 *    된다. 곁가지 하나가 따라온다: 문항 하나가 표를 고치면 다음 문항이 그 표를 물려받는
 *    일이 없어야 하므로 **문항마다 한 번씩 세운다**.
 * ④ **「테스트가 이긴다」는 「결과 표가 이긴다」가 된다** (D180). SQL 에는 판정용 테스트를
 *    따로 쓸 자리가 없고 쓸 이유도 없다 — 실행이 곧 답이라 텍스트 동등을 물을 이유가
 *    없어진다. T1 사다리와 AST 승격이 면제되는 첫 언어다
 *    (`docs/curriculum/sql-learning.md` §11.5.2 ③).
 *
 * **채점은 대칭 차집합이다.** `EXCEPT` 를 양방향으로 돌린 것과 같은 판정을 하되 SQL 이
 * 아니라 여기서 센다: `EXCEPT` 는 집합 의미라 **중복 행 수를 안 보고 순서를 안 본다**
 * (같은 문서 §11.5.2 ③ 이 그 한계를 적어 두었다). 행을 받아서 세면 `order: 'none'` 은
 * 진짜 다중집합 비교가 되고 `order: 'given'` 은 자리까지 견준다.
 */
import { ipc, IpcError } from '@chickadee/ipc-client';
import type { AskOut, SqlTable } from '@chickadee/ipc-client';

import { emptyResult, tailLog } from './runner.js';
import type { RunFailure, RunResult, RunSpec, RunnerProbe } from './runner.js';

/** 이 앱이 든 방언. 하나다 (정본 §5). */
export const DIALECTS = ['sqlite'] as const;
export type SqlDialect = (typeof DIALECTS)[number];

/** 기본 상한. 컴파일이 없어 자바의 180초와 두 자릿수 배 차이가 난다. */
export const SQL_TIMEOUT_MS = 5_000;
/** 표 하나에서 받아 올 행 상한. 채점은 이보다 훨씬 작은 표에서 이뤄진다. */
export const SQL_MAX_ROWS = 500;

export interface SqlExpect {
  /** 기대 표를 내는 참조 문장. 있으면 러너가 같은 데이터베이스에서 돌려 얻는다. */
  sql?: string;
  /** 또는 손으로 적은 기대 표. `null` 이 **없는 값**이다 — 빈 글자와 다르다. */
  rows?: (string | null)[][];
}

export interface SqlCase {
  /** 화면과 실패 목록에 실리는 이름. */
  name: string;
  /** 학습자가 낸 문장. */
  query: string;
  expect: SqlExpect;
  /**
   * `'none'` 이면 행의 **다중집합**을 견준다 — 줄 세우는 절이 없는 쿼리의 정답은 순서가
   * 없는 행 모음이고, 자리를 고정해 견주면 옳은 답이 어긋난다
   * (`sql-learning.md` §11.3.1). 기본값이 이쪽인 이유가 그것이다.
   */
  order?: 'none' | 'given';
}

/**
 * 한 행을 견줄 수 있는 글자 하나로. `null` 과 빈 글자가 절대 안 섞여야 하고 칸 경계도
 * 안 무너져야 한다 — `['a','sb']` 와 `['as','b']` 가 같은 열쇠가 되면 채점이 조용히 어긋난다.
 */
function keyOf(row: readonly (string | null)[]): string {
  return JSON.stringify(row);
}

export interface TableDiff {
  /** 기대 표에만 있는 행 — `기대 EXCEPT 실제` 쪽. */
  onlyExpected: (string | null)[][];
  /** 실제 표에만 있는 행 — `실제 EXCEPT 기대` 쪽. */
  onlyActual: (string | null)[][];
  /** 열 수가 다르면 행을 견줄 것도 없다. */
  widthMismatch?: { expected: number; actual: number };
}

/**
 * 두 표의 대칭 차집합. `EXCEPT` 를 양방향으로 돌린 것과 같은 판정이되 중복과 순서를 본다.
 *
 * 열 **이름**은 안 견준다 — 별명은 학습자가 자유롭게 붙이는 것이고, 이름이 다르다고
 * 오답이라고 하면 맞는 답을 틀렸다고 하는 쪽의 오류가 난다 (D180 이 피하려는 방향).
 */
export function diffTables(
  expected: readonly (string | null)[][],
  actual: readonly (string | null)[][],
  order: 'none' | 'given' = 'none',
  width?: { expected: number; actual: number },
): TableDiff {
  if (width && width.expected !== width.actual) {
    return { onlyExpected: [...expected], onlyActual: [...actual], widthMismatch: width };
  }
  if (order === 'given') {
    const onlyExpected: (string | null)[][] = [];
    const onlyActual: (string | null)[][] = [];
    for (let i = 0; i < Math.max(expected.length, actual.length); i++) {
      const a = expected[i];
      const b = actual[i];
      if (a !== undefined && b !== undefined && keyOf(a) === keyOf(b)) continue;
      if (a !== undefined) onlyExpected.push([...a]);
      if (b !== undefined) onlyActual.push([...b]);
    }
    return { onlyExpected, onlyActual };
  }
  const left = new Map<string, number>();
  for (const row of expected) left.set(keyOf(row), (left.get(keyOf(row)) ?? 0) + 1);
  const onlyActual: (string | null)[][] = [];
  for (const row of actual) {
    const k = keyOf(row);
    const n = left.get(k) ?? 0;
    if (n > 0) left.set(k, n - 1);
    else onlyActual.push([...row]);
  }
  const onlyExpected: (string | null)[][] = [];
  for (const row of expected) {
    const k = keyOf(row);
    const n = left.get(k) ?? 0;
    if (n > 0) {
      left.set(k, n - 1);
      onlyExpected.push([...row]);
    }
  }
  return { onlyExpected, onlyActual };
}

const show = (row: readonly (string | null)[]): string =>
  `(${row.map((c) => (c === null ? '없음' : c)).join(', ')})`;

/** 사람이 읽는 한 줄. 어느 행이 남고 어느 행이 모자라는지만 말한다. */
export function diffMessage(diff: TableDiff, order: 'none' | 'given'): string {
  if (diff.widthMismatch) {
    return `열 수가 다릅니다 — 기대 ${diff.widthMismatch.expected}개, 나온 것 ${diff.widthMismatch.actual}개.`;
  }
  const parts: string[] = [];
  if (diff.onlyExpected.length > 0) {
    parts.push(`빠진 행 ${diff.onlyExpected.length}개: ${diff.onlyExpected.slice(0, 3).map(show).join(' ')}`);
  }
  if (diff.onlyActual.length > 0) {
    parts.push(`더 나온 행 ${diff.onlyActual.length}개: ${diff.onlyActual.slice(0, 3).map(show).join(' ')}`);
  }
  if (parts.length === 0 && order === 'given') return '행은 같은데 순서가 다릅니다.';
  return parts.join(' · ');
}

/**
 * 이 컴퓨터에서 SQL 을 돌릴 수 있는가. **언제나 그렇다** — 엔진이 앱에 실려 있어서
 * 설치도 탐지도 없다. 자바 어댑터의 `detectJava` 와 자리는 같지만 하는 일이 다르고,
 * 그 다름이 「러너는 방언마다 하나」의 다른 얼굴이다: 여기서 켜지는 것은 sqlite 하나뿐이고
 * 다른 방언은 `runSql` 이 `dialect-unsupported` 로 거른다.
 */
export function detectSql(): Promise<RunnerProbe> {
  return Promise.resolve({ ok: true, dialect: 'sqlite' as const });
}

function tableOf(out: AskOut, at: number): SqlTable | undefined {
  return out.tables[at];
}

/** 문항 하나 = 호출 하나. 앞 문항이 고친 표를 뒤 문항이 물려받지 않게 매번 새로 세운다. */
async function askOne(db: string[], asks: string[], timeoutMs: number): Promise<AskOut> {
  return ipc.sql.run({ setup: db, asks, timeoutMs, maxRows: SQL_MAX_ROWS });
}

export async function runSql(spec: RunSpec): Promise<RunResult> {
  const dialect = spec.dialect ?? 'sqlite';
  if (!(DIALECTS as readonly string[]).includes(dialect)) {
    return emptyResult('no-runner', 'dialect-unsupported');
  }
  const db = spec.db ?? [];
  if (db.length === 0) return emptyResult('no-runner', 'no-fixture-db');
  const cases = spec.cases ?? [];
  if (cases.length === 0) return emptyResult('no-runner', 'not-detected');

  const began = Date.now();
  const failures: RunFailure[] = [];
  const notes: string[] = [];
  let passed = 0;
  let timedOut = false;

  for (const one of cases) {
    const order = one.order ?? 'none';
    const asks = one.expect.sql === undefined ? [one.query] : [one.query, one.expect.sql];
    let out: AskOut;
    try {
      out = await askOne(db, asks, spec.timeoutMs || SQL_TIMEOUT_MS);
    } catch (e) {
      // 엔진을 못 연 것은 학습자의 답과 무관하다 — 아무것도 안 잰 것이라 `no-runner` 다.
      const why = e instanceof IpcError ? `${e.code}: ${e.message}` : String(e);
      return emptyResult('no-runner', why, Date.now() - began);
    }
    if (out.timedOut) timedOut = true;
    if (out.failedAt !== null && out.failedAt < 0) {
      // 세우는 문장이 깨졌다 — 이건 우리 픽스처의 문제이고 답의 문제가 아니다.
      return emptyResult('no-runner', out.message ?? 'no-fixture-db', Date.now() - began);
    }
    if (out.failedAt === 0) {
      failures.push({ test: one.name, message: out.message ?? '문장이 서지 않았습니다.' });
      notes.push(`${one.name}: ${out.message ?? ''}`);
      continue;
    }
    if (out.failedAt === 1) {
      // 참조 문장이 깨졌다 — 문항을 쓴 쪽의 잘못이라 판정하지 않는다.
      return emptyResult('no-runner', out.message ?? 'not-detected', Date.now() - began);
    }
    const got = tableOf(out, 0);
    const want = one.expect.rows ?? tableOf(out, 1)?.rows;
    if (!got || !want) {
      failures.push({ test: one.name, message: '견줄 표가 없습니다.' });
      continue;
    }
    const width = { expected: want[0]?.length ?? got.columns.length, actual: got.columns.length };
    const diff = diffTables(want, got.rows, order, width);
    const same =
      diff.widthMismatch === undefined &&
      diff.onlyExpected.length === 0 &&
      diff.onlyActual.length === 0;
    if (same) {
      passed += 1;
    } else {
      const message = diffMessage(diff, order);
      failures.push({ test: one.name, message });
      notes.push(`${one.name}: ${message}`);
    }
  }

  const durationMs = Date.now() - began;
  const log = tailLog(notes.join('\n'));
  if (timedOut) return { status: 'timeout', passed, failed: failures.length, failures, log, durationMs };
  const status = failures.length > 0 ? 'failed' : 'passed';
  return { status, passed, failed: failures.length, failures, log, durationMs };
}
