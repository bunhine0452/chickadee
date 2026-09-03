/**
 * T1 채점 골든 (04 §9 표 28건).
 *
 * 케이스는 `fixtures/golden/t1/cases.json` 이고 두 겹으로 본다:
 *
 * - `requires` — **04 §9 표의 그 행**을 손으로 옮긴 것. 문서가 정본이므로 생성하지 않는다.
 *   이 칸이 깨지면 규칙이 깨진 것이다.
 * - `expected.json` — 행 전체의 회귀 스냅샷. `UPDATE_GOLDEN=1` 로 다시 쓰고 diff 를 눈으로 본다.
 *   이 칸이 깨지면 무엇이 달라졌는지 diff 한 줄로 보인다.
 *
 * AST 는 `fixtures/golden/t1/ast/<id>.json` 이고 `crates/parse/tests/t1_ast.rs` 가 굽는다 —
 * 이 패키지는 tree-sitter 도 IPC 도 모르므로(04 §4.5) 트리를 인자로 받는다.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { AstLite } from '@chickadee/ipc-client';
import { describe, expect, test } from 'vitest';

import { align } from './t1-align.js';
import { gradeT1 } from './t1-result.js';
import type { Status, T1Result } from './t1-types.js';

interface Require {
  oi?: number;
  ui?: number;
  status: Status;
  code?: string;
  detail?: string;
  swap?: boolean;
}

interface Case {
  id: string;
  rule: string;
  grammar: string;
  ast?: boolean;
  usedNw?: boolean;
  moduleDecls?: string[];
  original: string[];
  user: string[];
  requires: Require[];
  /** AST 가 없는 빌드(그 문법이 안 실려 있을 때)의 기대. 04 §4.5 언어 폴백. */
  regexOnly?: Require[];
}

interface AstFixture {
  grammar: string;
  original: AstLite;
  originalHadError: boolean;
  user: AstLite;
  userHadError: boolean;
}

/** 스냅샷 한 줄 — 행의 정체만 남기고 사유 세부는 코드까지만 본다. */
interface RowShot {
  oi: number;
  ui: number;
  status: Status;
  codes: string[];
  engine: string;
  swap?: boolean;
}

interface Shot {
  rows: RowShot[];
  n: Record<Status, number>;
  total: number;
  meaning: number;
  pct: number;
  passPct: number;
  verdict: T1Result['verdict'];
  engine: string;
}

const DIR = join(new URL('../../../fixtures/golden/t1/', import.meta.url).pathname);
const cases = (JSON.parse(readFileSync(join(DIR, 'cases.json'), 'utf8')) as { cases: Case[] }).cases;
const SHOTS = join(DIR, 'expected.json');
const update = process.env.UPDATE_GOLDEN !== undefined;
const previous: Record<string, Shot> = existsSync(SHOTS)
  ? (JSON.parse(readFileSync(SHOTS, 'utf8')) as Record<string, Shot>)
  : {};
const written: Record<string, Shot> = {};

const astOf = (c: Case): AstFixture | null => {
  if (c.ast !== true) return null;
  const at = join(DIR, 'ast', `${c.id}.json`);
  if (!existsSync(at)) return null;
  return JSON.parse(readFileSync(at, 'utf8')) as AstFixture;
};

function run(c: Case): T1Result {
  const fixture = astOf(c);
  return gradeT1({
    blockId: 1,
    stage: 2,
    original: c.original,
    user: c.user,
    grammar: c.grammar,
    ...(c.moduleDecls ? { moduleDecls: c.moduleDecls } : {}),
    peeks: 0,
    downgraded: false,
    ...(fixture === null
      ? { astFallback: 'PARSE_LANG_UNSUPPORTED' as const }
      : {
          ast: {
            original: fixture.original,
            originalText: c.original,
            user: fixture.user,
            userText: c.user,
          },
        }),
    // 골든이 deep-equal 이려면 시계가 멈춰 있어야 한다 (04 §9).
    clock: () => 0,
  });
}

const shotOf = (r: T1Result): Shot => ({
  rows: r.rows.map((row) => ({
    oi: row.oi,
    ui: row.ui,
    status: row.status,
    codes: row.reasons.map((x) => x.code),
    engine: row.engine,
    ...(row.swap === true ? { swap: true } : {}),
  })),
  n: r.n,
  total: r.total,
  meaning: r.meaning,
  pct: r.pct,
  passPct: r.passPct,
  verdict: r.verdict,
  engine: r.engine,
});

describe('T1 채점 골든 (04 §9)', () => {
  test('28건이 다 있다 — 표에서 한 줄이 사라지면 조용히 통과한다', () => {
    expect(cases.length).toBe(28);
  });

  test.each(cases.map((c) => [`${c.id} — ${c.rule}`, c] as const))('%s', (_name, c) => {
    const result = run(c);
    const wanted = astOf(c) === null && c.regexOnly !== undefined ? c.regexOnly : c.requires;

    for (const want of wanted) {
      const row = want.oi !== undefined
        ? result.rows.find((r) => r.oi === want.oi)
        : result.rows.find((r) => r.ui === want.ui);
      expect(row, `행을 못 찾았다: ${JSON.stringify(want)}`).toBeDefined();
      const found = row as NonNullable<typeof row>;
      expect(found.status, `${c.id} oi=${want.oi ?? -1}`).toBe(want.status);
      if (want.code !== undefined) {
        expect(found.reasons.map((r) => r.code)).toContain(want.code);
      }
      if (want.detail !== undefined) {
        expect(found.reasons.find((r) => r.code === want.code)?.detail).toBe(want.detail);
      }
      if (want.swap === true) expect(found.swap).toBe(true);
    }

    if (c.usedNw === true) {
      expect(align(c.original, c.user).usedNw, `${c.id} 는 NW 폴백까지 가야 한다`).toBe(true);
    }

    const shot = shotOf(result);
    written[c.id] = shot;
    if (!update) {
      expect(shot, `${c.id} 의 스냅샷이 달라졌다 — UPDATE_GOLDEN=1 로 다시 쓰고 diff 를 봐라`)
        .toStrictEqual(previous[c.id]);
    }
  });

  test('같은 입력에 같은 결과 (04 §9 결정성)', () => {
    for (const c of cases) {
      expect(shotOf(run(c))).toStrictEqual(shotOf(run(c)));
    }
  });

  test('스냅샷을 쓴다', () => {
    if (!update) return;
    const ordered: Record<string, Shot> = {};
    for (const c of cases) {
      const shot = written[c.id];
      if (shot !== undefined) ordered[c.id] = shot;
    }
    writeFileSync(SHOTS, `${JSON.stringify(ordered, null, 2)}\n`);
    expect(Object.keys(ordered).length).toBe(cases.length);
  });
});
