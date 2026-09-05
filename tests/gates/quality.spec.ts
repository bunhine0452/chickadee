/**
 * 학습질 성질 게이트 셋 (D186 ③) — 브라우저 게이트에서 부르는 자리.
 *
 * **재는 코드는 여기 없다.** 센서스는 `tests/support/quality.ts` 에 있고 vitest 에서 돈다 —
 * 사전 번들이 Vite 의 `import.meta.glob` 으로 만들어져 Playwright 로더에서는 안 열리기
 * 때문이고, `build-seed.ts` 가 D108 에서 같은 벽에 부딪혀 같은 결론을 냈다. 그래서 이
 * 파일이 하는 일은 셋이다: ① 그 시험을 자식 프로세스로 돌린다 ② 남긴 수치를 표로 찍는다
 * ③ 같은 문턱을 여기서 한 번 더 잰다.
 *
 * 왜 굳이 여기에도 두나: `pnpm test:gates` 가 「완벽의 세 축」(D186)을 한 번에 도는 자리이고,
 * 학습질만 다른 명령에 있으면 그 축이 조용히 빠진다.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';

interface Thresholds {
  minMyCodeShare: number;
  minLadderLangs: number;
  maxTraceMissingWithoutReason: number;
  maxDiagnosisNone: number;
}
interface AllowRow { at: string; why: string; expires: string }
interface Report {
  myCodeShare: number | null;
  trace: { where: string; missingWithoutReason: number }[];
  ladderLangs: number;
  diagTotal: { siblings: number; variants: number; langAlt: number; none: number };
  catalogItems: number;
  axisGaps: string[];
  builtAt: number;
  table: string;
}

const ROOT = process.cwd();
const CENSUS = 'tests/support/quality-gate.test.ts';
const REPORT = '.seed/quality.json';

/** 센서스가 보는 재료. 이 아래 무엇이든 보고서보다 새것이면 보고서는 낡았다. */
const SOURCES = [
  'packages/cards/src', 'packages/concepts/src', 'packages/dictionary/src',
  'dictionary', 'fixtures/ipc/tiny', 'tests/support', 'tests/gates/quality.allow.json',
];

function newestMtime(rel: string): number {
  const full = join(ROOT, rel);
  const st = statSync(full, { throwIfNoEntry: false });
  if (st === undefined) return 0;
  if (!st.isDirectory()) return st.mtimeMs;
  let newest = st.mtimeMs;
  for (const entry of readdirSync(full, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    newest = Math.max(newest, newestMtime(join(rel, entry.name)));
  }
  return newest;
}

function staleOrMissing(): boolean {
  if (!existsSync(join(ROOT, REPORT))) return true;
  const { builtAt } = JSON.parse(readFileSync(join(ROOT, REPORT), 'utf8')) as { builtAt?: number };
  if (typeof builtAt !== 'number') return true;
  return SOURCES.some((rel) => newestMtime(rel) > builtAt);
}

/** 브라우저를 안 쓰는 게이트다 — 엔진 둘에서 두 번 돌 이유가 없다. */
test.skip(({ browserName }) => browserName !== 'chromium', '엔진과 무관한 데이터 게이트다');

test('학습질 — 내 코드 비율 · 2단 값 추적 · 오답 진단 (D186 ③)', () => {
  // 보통은 **굽지 않는다.** `pnpm test:gates` 가 브라우저를 띄우기 **전에** `pnpm test:quality`
  // 로 센서스를 돌려 두므로 여기서는 그 수치를 읽기만 한다.
  //
  // 처음엔 여기서 자식 vitest 를 띄웠다가 같은 기계의 WebKit 판 31개가 한꺼번에 죽었다 —
  // vitest 가 자기 워커 풀을 띄워 Playwright 워커 넷과 CPU 를 놓고 다투는 동안
  // `vite preview` 가 응답을 멈췄고, 오류는 「Could not connect to the server」였다.
  // 재는 것과 무관한 실패를 게이트가 만들어 내면 사람이 게이트를 안 믿게 된다.
  //
  // 그래도 **낡은 수치로는 통과시키지 않는다** — 재료가 보고서보다 새것이면 그 자리에서
  // 다시 굽는다. `playwright test tests/gates` 를 손으로 부른 경우가 그 길이다.
  if (staleOrMissing()) {
    test.slow();
    execFileSync('npx', [
      'vitest', 'run', CENSUS, '--maxWorkers=1', '--minWorkers=1', '--no-file-parallelism',
    ], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 180_000 });
  }

  const report = JSON.parse(readFileSync(join(ROOT, REPORT), 'utf8')) as Report;
  // eslint-disable-next-line no-console -- 게이트의 값이 이 표다 (06 §2 · D181).
  console.log(`\n${report.table}\n`);
  const allow = JSON.parse(readFileSync(join(ROOT, 'tests/gates/quality.allow.json'), 'utf8')) as
    { thresholds: Thresholds; entries: AllowRow[] };
  const t = allow.thresholds;

  expect(report.myCodeShare, '내 코드 비율을 잴 시드가 없다').not.toBeNull();
  expect(report.myCodeShare ?? 0).toBeGreaterThanOrEqual(t.minMyCodeShare);

  expect(report.trace.filter((x) => x.missingWithoutReason > 0).map((x) => x.where)).toEqual([]);
  expect(report.ladderLangs).toBeGreaterThanOrEqual(t.minLadderLangs);
  expect(report.trace.reduce((a, x) => a + x.missingWithoutReason, 0))
    .toBeLessThanOrEqual(t.maxTraceMissingWithoutReason);

  expect(report.diagTotal.none).toBeLessThanOrEqual(t.maxDiagnosisNone);
  expect(report.diagTotal.siblings + report.diagTotal.variants + report.diagTotal.langAlt)
    .toBe(report.catalogItems);

  const exempt = new Set(allow.entries.map((e) => e.at));
  expect(report.axisGaps.filter((g) => !exempt.has(g))).toEqual([]);
});
