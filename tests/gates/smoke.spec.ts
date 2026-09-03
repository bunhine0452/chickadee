/** 다리가 실제로 도는지 (D108). 이것이 빨가면 아래 게이트는 전부 뜻이 없다. */
import { test, expect, waitForHome } from '../support/fixture.js';

test('시드된 DB 로 홈이 뜬다', async ({ page, app }) => {
  const sites = app.db.prepare('SELECT COUNT(*) AS n FROM concept_site').get() as { n: number };
  expect(sites.n).toBeGreaterThan(0);

  await waitForHome(page);
  await expect(page.locator('.masthead')).toBeVisible();
});
