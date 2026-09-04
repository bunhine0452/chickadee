/**
 * en 스모크 (06 §2 · D117 · 플랜 `i18n-en-smoke`).
 *
 * **재는 것은 둘뿐이다** — `axe-core` serious 이상 0, 그리고 행 길이(05 §9 의 en 축
 * 45~68자). 시각 기준선 40장은 `tests/visual/shots.spec.ts` 가 **ko 로만** 유지한다.
 * 로케일마다 기준선을 뜨면 문구 한 줄을 고칠 때마다 80장을 다시 찍어야 하고, 그러면
 * 기준선이 회귀를 잡는 자리가 아니라 갱신하는 잡일이 된다. 로케일이 바꾸는 것은 글자의
 * **길이**이지 판의 배치가 아니므로, en 에서 새로 깨질 수 있는 것은 행 길이와
 * (문구가 길어져 겹치면) 접근성이다. 그 둘만 여기서 잰다.
 *
 * 시드는 `ko` 를 못박는다(`tests/support/build-seed.ts`) — 기본값이 `navigator.language`
 * 추정이라 풀면 게이트가 러너를 탄다. 그래서 이 파일만 **자기 워커의 시드 사본**에서
 * 그 한 칸을 뒤집는다. `makeAppDb()` 가 파일이 아니라 바이트로 열므로 다른 워커에는
 * 보이지 않는다.
 */
import AxeBuilder from '@axe-core/playwright';

import { test, expect } from '../support/fixture.js';
import type { Page } from '@playwright/test';
import type { AppDb } from '../support/app-db.js';

import {
  allowedBySel, answerKey, closeLifer, gotoDev, loadAllow, runGates, startSession, submit,
  toSummary,
} from '../support/gates.js';

const axeAllow = loadAllow('axe.allow.json').entries;
const measureAllow = loadAllow('measure.allow.json').entries;

/** 06 §2 — serious 이상 0. minor·moderate 는 보고만 하고 막지 않는다. */
const BLOCKING = new Set(['serious', 'critical']);

/** 이 워커의 시드 사본에서만 로케일을 뒤집는다. 화면을 열기 **전에** 불러야 한다. */
function useEnglish(app: AppDb): void {
  const changed = app.db
    .prepare(`UPDATE settings SET value_json = ? WHERE key = 'locale'`)
    .run(JSON.stringify('en')).changes;
  // 시드가 그 칸을 안 심으면 화면은 OS 추정으로 돌아가고 게이트는 조용히 ko 를 잰다.
  expect(changed, '시드에 locale 칸이 없다 — build-seed.ts 가 바뀌었는지 봐라').toBe(1);
}

/**
 * 리포가 0개면 `App.tsx` 가 첫 실행을 그린다.
 *
 * `DELETE FROM repo` 는 FK 로 막힌다 — 시드에 자식 행이 여럿 달려 있고, 지우는 순서를
 * 손으로 적으면 스키마가 자랄 때마다 여기가 틀린다. 이 화면이 보려는 것은 「리포가 없을 때」
 * 뿐이므로 **한 트랜잭션 동안만 FK 를 끄고** 지운다 — 시드 사본은 이 워커 안에서만 산다.
 */
function forgetRepos(app: AppDb): void {
  app.db.pragma('foreign_keys = OFF');
  app.db.prepare('DELETE FROM repo').run();
  app.db.pragma('foreign_keys = ON');
}

/**
 * 한 화면에서 재는 것 한 벌.
 *
 * `expectBodies` 가 0 보다 큰 것이 이 게이트의 핵심이다 — `hasBody()` 가 로케일별로
 * 판정하므로, 화면이 실수로 ko 로 떠 있으면 en 본문이 **한 건도 안 잡히고** 위반도
 * 0건이라 게이트가 소리 없이 통과한다. 그 함정을 한 번 밟았다(05 §9 · 인계 문서).
 */
async function measureEn(page: Page, screen: string, expectBodies: number): Promise<void> {
  const locale = await page.evaluate(() => document.documentElement.getAttribute('data-locale'));
  expect(locale, `${screen}: <html data-locale> 가 en 이 아니다`).toBe('en');

  const report = await runGates(page);
  expect(report.measure.length, `${screen}: en 본문으로 잡힌 것이 0건이다 — 게이트가 헛돈다`)
    .toBeGreaterThanOrEqual(expectBodies);
  const bad = report.measureViolations.filter((r) => !allowedBySel(measureAllow, r.sel));
  expect(bad, `${screen} 행 길이\n${JSON.stringify(bad, null, 1)}`).toEqual([]);

  const axe = await new AxeBuilder({ page }).analyze();
  // 예외 목록은 규칙 id 로 적는다(`rule`) — `sel` 이 아니다. keyboard.spec.ts 와 같은 열이다.
  const blocking = axe.violations
    .filter((v) => BLOCKING.has(v.impact ?? ''))
    .filter((v) => !axeAllow.some((e) => e.rule === v.id))
    .map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.slice(0, 3).map((n) => `${n.target.join(' ')} — ${n.failureSummary ?? ''}`),
    }));
  expect(blocking, `${screen} axe serious+\n${JSON.stringify(blocking, null, 1)}`).toEqual([]);
}

test('en — 첫 실행', async ({ page, app }) => {
  useEnglish(app);
  forgetRepos(app);
  await page.goto('/?dev=1');
  await page.locator('.firstrun').waitFor();
  await page.evaluate(() => document.fonts.ready);
  // 폴백으로 ko 가 오면 여기서 갈린다 — 첫 실행은 카탈로그를 거치는 첫 화면이다.
  await expect(page.locator('.firstrun')).toContainText('Add a repo');
  await measureEn(page, '첫 실행', 1);
});

test('en — 홈', async ({ page, app }) => {
  useEnglish(app);
  await gotoDev(page);
  await expect(page.getByRole('button', { name: /Settings/ })).toBeVisible();
  await measureEn(page, '홈', 5);
});

test('en — 교정지와 요약', async ({ page, app }) => {
  useEnglish(app);
  await gotoDev(page);
  await startSession(page);
  await measureEn(page, 'T0 교정지', 1);

  await submit(page, answerKey(app));
  await closeLifer(page);
  await toSummary(page, app);
  await measureEn(page, '요약', 3);
});
