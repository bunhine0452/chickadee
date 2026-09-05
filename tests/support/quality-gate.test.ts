/**
 * 학습질 성질 게이트 셋 (D186 ③) — **재는 자리는 vitest 다.**
 *
 * 사전 번들이 Vite 의 `import.meta.glob` 으로 만들어져 Playwright 로더에서는 안 열린다
 * (D108 이 시드 굽기를 vitest 로 보낸 것과 같은 벽). 그래서 센서스는 여기서 돌고,
 * 브라우저 게이트(`tests/gates/quality.spec.ts`)는 이 시험을 **자식 프로세스로** 돌린 뒤
 * 여기가 남긴 `.seed/quality.json` 을 읽어 같은 문턱을 다시 잰다.
 *
 * 통과해도 표를 찍는다 — 사람이 수준을 눈으로 보는 자리가 그 표다 (D181 센서스 태도).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { expect, test } from 'vitest';

import { expired, overlong, type AllowEntry } from './gates.js';
import { renderQuality, runQualityCensus } from './quality.js';

export const QUALITY_JSON = '.seed/quality.json';

interface QualityAllow {
  thresholds: {
    minMyCodeShare: number;
    minLadderLangs: number;
    maxTraceMissingWithoutReason: number;
    maxDiagnosisNone: number;
    minExprPerAxis: number;
  };
  entries: (AllowEntry & { at: string })[];
}

const allow = JSON.parse(
  readFileSync(join(process.cwd(), 'tests/gates/quality.allow.json'), 'utf8'),
) as QualityAllow;

test('학습질 — 내 코드 비율 · 2단 값 추적 · 오답 진단 (D186 ③)', async () => {
  const report = await runQualityCensus();
  // eslint-disable-next-line no-console -- 게이트의 값이 이 표다 (06 §2 · D181).
  console.log(`\n${renderQuality(report)}\n`);

  // 브라우저 게이트가 이 파일을 읽는다. `builtAt` 이 있어야 저쪽이 **낡았는지**를 안다 —
  // 낡은 수치로 통과하는 게이트는 게이트가 아니라 알리바이다.
  mkdirSync(dirname(join(process.cwd(), QUALITY_JSON)), { recursive: true });
  writeFileSync(
    join(process.cwd(), QUALITY_JSON),
    JSON.stringify({ ...report, builtAt: Date.now(), table: renderQuality(report) }, null, 2),
  );

  const { thresholds } = allow;

  // 예외 목록이 먼저다 — 만료된 예외로 통과하면 게이트가 아니라 알리바이다 (06 §2).
  expect(expired(allow.entries).map((e) => e.why), '만료된 예외').toEqual([]);
  expect(overlong(allow.entries).map((e) => e.why), '90일보다 멀리 잡은 예외').toEqual([]);

  // (ㄱ)
  expect(report.myCodeShare, '내 코드 비율을 잴 시드가 없다').not.toBeNull();
  expect(report.myCodeShare ?? 0, '내 코드 비율').toBeGreaterThanOrEqual(thresholds.minMyCodeShare);

  // (ㄴ)
  const silent = report.trace.filter((t) => t.missingWithoutReason > 0).map((t) => t.where);
  expect(silent, '못 구웠는데 사유가 없다 (D186 ④)').toEqual([]);
  expect(report.ladderLangs, '값 추적 판이 서는 언어').toBeGreaterThanOrEqual(thresholds.minLadderLangs);
  expect(
    report.trace.reduce((a, t) => a + t.missingWithoutReason, 0),
  ).toBeLessThanOrEqual(thresholds.maxTraceMissingWithoutReason);

  // (ㄷ)
  expect(report.diagTotal.none, '진단 재료가 하나도 없는 판').toBeLessThanOrEqual(thresholds.maxDiagnosisNone);
  const exempt = new Set(allow.entries.map((e) => e.at));
  expect(report.axisGaps.filter((g) => !exempt.has(g)), '축에 식이 셋에 못 미치는데 사유가 없다').toEqual([]);
  expect(thresholds.minExprPerAxis).toBe(3);
});
